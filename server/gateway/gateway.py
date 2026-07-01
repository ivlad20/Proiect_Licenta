"""Gateway-ul de inspectie.

Fluxul complet:
  LabVIEW (ROI) posteaza continuu la feed_server /ingest/{id}-roi.
  Dashboard --POST /inspect/{product_id}--> gateway
      -> ia ultimul cadru ROI din feed_server
      -> ia lista de piese ASTEPTATE (cu CANTITATE) din Supabase (tabelul "parts")
      -> trimite imaginea la microserviciul de inferenta YOLO (/predict)
      -> compara NUMARUL de piese detectate cu cel asteptat:
             detectate < asteptate  -> defect 'missing'  (ex. 3 roti din 4)
             clasa '<cod>-wrong'     -> defect 'wrong_mounted'
      -> calculeaza passed / match_score / defect_rate
      -> salveaza inspectia + defectele in Supabase (inspections, defects)
      -> urca poza scanata in Storage (bucket 'products')
      -> intoarce rezultatul catre dashboard

Config din .env: INFERENCE_URL, FEED_SERVER_URL, ROI_SUFFIX, SUPABASE_URL,
SUPABASE_SERVICE_KEY, STORAGE_BUCKET, SAVE_ONLY_DEFECTS, EXPECTED_FALLBACK_DIR.
"""

import os
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Incarca automat variabilele din gateway/.env (daca exista fisierul).
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

INFERENCE_URL = os.environ.get("INFERENCE_URL", "http://localhost:9001").rstrip("/")
# Serverul releu (feed_server.py) care tine ultimul cadru ROI primit de la LabVIEW.
FEED_SERVER_URL = os.environ.get("FEED_SERVER_URL", "http://localhost:8765").rstrip("/")
ROI_SUFFIX = os.environ.get("ROI_SUFFIX", "-roi")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
STORAGE_BUCKET = os.environ.get("STORAGE_BUCKET", "products")
SAVE_ONLY_DEFECTS = os.environ.get("SAVE_ONLY_DEFECTS", "1") == "1"
EXPECTED_FALLBACK_DIR = Path(
    os.environ.get("EXPECTED_FALLBACK_DIR", Path(__file__).parent.parent / "inference" / "models")
)

_USE_DB = bool(SUPABASE_URL and SUPABASE_KEY)

app = FastAPI(title="Gateway inspecție — recunoaștere asamblare")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


def _sb_headers(extra: dict | None = None) -> dict:
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    if extra:
        h.update(extra)
    return h


async def get_expected_parts(client: httpx.AsyncClient, product_id: str) -> Dict[str, dict]:
    """
    Intoarce {cod_piesa: {"name": ..., "qty": ...}} pentru piesele asteptate.
    'qty' = numarul de exemplare asteptate (ex. roata = 4). Din Supabase daca e
    configurat, altfel dintr-un fisier <id>.classes.txt (linii 'Cod' sau 'Cod:qty').
    """
    if _USE_DB:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/parts",
            headers=_sb_headers(),
            params={"product_id": f"eq.{product_id}", "select": "code,name,quantity"},
        )
        r.raise_for_status()
        out = {}
        for row in r.json():
            qty = row.get("quantity") or 1
            out[row["code"]] = {"name": row.get("name") or row["code"], "qty": int(qty)}
        return out

    # Fallback (mod test fara DB): fisier cu linii 'Cod' sau 'Cod:qty'.
    f = EXPECTED_FALLBACK_DIR / f"{product_id}.classes.txt"
    out: Dict[str, dict] = {}
    if f.exists():
        for ln in f.read_text(encoding="utf-8").splitlines():
            ln = ln.strip()
            if not ln:
                continue
            if ":" in ln:
                code, qty = ln.rsplit(":", 1)
                code = code.strip()
                qty = int(qty) if qty.strip().isdigit() else 1
            else:
                code, qty = ln, 1
            out[code] = {"name": code, "qty": qty}
    return out


def evaluate(expected: Dict[str, dict], detections: List[dict]) -> dict:
    """
    Compara pe NUMARARE detectiile cu piesele asteptate.
    Conventie clase model:
      'Roata'        -> piesa corecta (se numara aparitiile)
      'Roata-wrong'  -> piesa montata gresit (e prezenta, dar gresit)
    O piesa montata gresit NU se raporteaza si ca lipsa: e prezenta, dar incorecta.
    """
    correct_counts: Counter = Counter()
    wrong_counts: Counter = Counter()
    wrong: List[dict] = []
    for d in detections:
        cls = d.get("class", "")
        if cls in expected:
            correct_counts[cls] += 1
        else:
            base = cls[:-6] if cls.endswith("-wrong") else cls.replace("_wrong", "")
            if base in expected:
                wrong_counts[base] += 1
                wrong.append({**d, "_base": base})

    defects: List[dict] = []
    total_expected = 0
    correct_total = 0
    missing_instances = 0

    for code, info in expected.items():
        qty = info["qty"]
        name = info["name"]
        total_expected += qty
        correct_det = correct_counts.get(code, 0)
        wrong_det = wrong_counts.get(code, 0)
        ok = min(correct_det, qty)                       # doar corecte -> scor
        correct_total += ok
        present = min(correct_det + wrong_det, qty)       # corecte + gresite = prezente
        miss = qty - present
        if miss > 0:
            missing_instances += miss
            label = f"Lipsă {miss}× {name}" if qty > 1 else f"Lipsă {name}"
            defects.append({
                "part_code": code,
                "defect_type": "missing",
                "defect_name": label,
                "confidence": None,
                "bbox_x": None, "bbox_y": None, "bbox_w": None, "bbox_h": None,
            })

    for d in wrong:
        code = d["_base"]
        defects.append({
            "part_code": code,
            "defect_type": "wrong_mounted",
            "defect_name": f"Montaj greșit {expected[code]['name']}",
            "confidence": d.get("confidence"),
            "bbox_x": d.get("bbox_x"), "bbox_y": d.get("bbox_y"),
            "bbox_w": d.get("bbox_w"), "bbox_h": d.get("bbox_h"),
        })

    total_expected = total_expected or 1
    n_wrong = len(wrong)
    passed = missing_instances == 0 and n_wrong == 0
    match_score = round(correct_total / total_expected * 100, 2)
    defect_rate = round((missing_instances + n_wrong) / total_expected * 100, 2)

    return {
        "passed": passed,
        "match_score": match_score,
        "defect_rate": defect_rate,
        "expected_count": total_expected,
        "detected_ok": correct_total,
        "defects": defects,
    }


async def save_to_db(
    client: httpx.AsyncClient, product_id: str, result: dict, image_path: str | None
) -> str | None:
    """Salveaza inspectia + defectele in Supabase. Intoarce id-ul inspectiei."""
    if not _USE_DB:
        return None

    insp = {
        "product_id": product_id,
        "passed": result["passed"],
        "match_score": result["match_score"],
        "defect_rate": result["defect_rate"],
        "image_path": image_path,
    }
    r = await client.post(
        f"{SUPABASE_URL}/rest/v1/inspections",
        headers=_sb_headers({"Content-Type": "application/json", "Prefer": "return=representation"}),
        json=insp,
    )
    r.raise_for_status()
    inspection_id = r.json()[0]["id"]

    if result["defects"]:
        rows = [{**d, "inspection_id": inspection_id} for d in result["defects"]]
        r2 = await client.post(
            f"{SUPABASE_URL}/rest/v1/defects",
            headers=_sb_headers({"Content-Type": "application/json"}),
            json=rows,
        )
        r2.raise_for_status()
    return inspection_id


async def upload_scan(client: httpx.AsyncClient, product_id: str, jpeg: bytes) -> str | None:
    """Urca poza scanata in Storage si intoarce calea (path-ul) salvata."""
    if not _USE_DB:
        return None
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = f"scans/{product_id}/{day}/{uuid.uuid4().hex}.jpg"
    r = await client.post(
        f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}",
        headers=_sb_headers({"Content-Type": "image/jpeg"}),
        content=jpeg,
    )
    r.raise_for_status()
    return path


async def _fetch_latest_roi(client: httpx.AsyncClient, product_id: str) -> bytes:
    """Ia ultimul cadru ROI tinut de feed_server pentru produsul dat."""
    url = f"{FEED_SERVER_URL}/last/{product_id}{ROI_SUFFIX}"
    r = await client.get(url)
    if r.status_code != 200:
        return b""
    return r.content


@app.get("/health")
async def health():
    return {"status": "ok", "use_db": _USE_DB, "inference_url": INFERENCE_URL}


@app.post("/inspect/{product_id}")
async def inspect(product_id: str, request: Request):
    """
    Inspectie declansata din dashboard (butonul "Inspecteaza") sau din LabVIEW.

    Imaginea se obtine astfel:
      - daca cererea are body (LabVIEW posteaza direct imaginea), se foloseste acela;
      - daca body-ul e gol (apel din dashboard), gateway-ul ia ultimul cadru ROI
        din feed_server (/last/{id}-roi).
    """
    qs = request.url.query  # transmitem query-ul mai departe (util pt. mock: drop/wrong)
    jpeg = await request.body()

    async with httpx.AsyncClient(timeout=30, trust_env=False) as client:
        if not jpeg:
            jpeg = await _fetch_latest_roi(client, product_id)
            if not jpeg:
                return JSONResponse(
                    {"error": f"Niciun cadru ROI disponibil pentru '{product_id}'. "
                              f"Verifică dacă LabVIEW trimite la /ingest/{product_id}{ROI_SUFFIX}."},
                    status_code=409,
                )

        expected = await get_expected_parts(client, product_id)
        if not expected:
            return JSONResponse(
                {"error": f"Nicio piesă așteptată pentru produsul '{product_id}'"},
                status_code=404,
            )

        # 1. Inferenta
        url = f"{INFERENCE_URL}/predict/{product_id}" + (f"?{qs}" if qs else "")
        ir = await client.post(url, content=jpeg, headers={"Content-Type": "image/jpeg"})
        ir.raise_for_status()
        infer = ir.json()

        # 2. Evaluare pe numarare (lipsa / gresit)
        result = evaluate(expected, infer.get("detections", []))

        # 3. Storage (optional: doar daca are defect)
        image_path = None
        if _USE_DB and (not SAVE_ONLY_DEFECTS or not result["passed"]):
            image_path = await upload_scan(client, product_id, jpeg)

        # 4. DB
        inspection_id = await save_to_db(client, product_id, result, image_path)

    return {
        "product_id": product_id,
        "inspection_id": inspection_id,
        "mock_inference": infer.get("mock", False),
        "image_path": image_path,
        **result,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "9000")))
