"""Microserviciu de inferenta YOLO.

Primeste o imagine (ROI preprocesat de LabVIEW) prin POST la /predict/{product_id}
si intoarce detectiile modelului: clasa (codul piesei), increderea si bounding box-ul
normalizat (0-1). Fiecare produs are propriul model in models/<product_id>.pt,
incarcat o singura data si tinut in cache.

Doua moduri: REAL, cand exista ultralytics si un model .pt, ruleaza YOLO real;
MOCK, cand acestea lipsesc, intoarce detectii simulate pe baza listei de clase din
models/<product_id>.classes.txt.
"""

import os
import random
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Directorul cu modele (.pt) si liste de clase (.classes.txt)
MODELS_DIR = Path(os.environ.get("MODELS_DIR", Path(__file__).parent / "models"))
CONF_THRESHOLD = float(os.environ.get("CONF_THRESHOLD", "0.35"))

app = FastAPI(title="Inferență YOLO — recunoaștere asamblare")

# Cache de modele incarcate: product_id -> obiect YOLO (sau None in mod mock)
_models: Dict[str, object] = {}

# Incercam sa importam ultralytics; daca nu exista, rulam in mod mock.
try:
    from ultralytics import YOLO  # type: ignore

    _HAS_YOLO = True
except Exception:
    _HAS_YOLO = False


def _classes_for(product_id: str) -> List[str]:
    """Lista de clase (coduri de piese) dintr-un fisier sidecar, pentru modul mock."""
    f = MODELS_DIR / f"{product_id}.classes.txt"
    if f.exists():
        return [ln.strip() for ln in f.read_text(encoding="utf-8").splitlines() if ln.strip()]
    return []


def _load_model(product_id: str):
    if product_id in _models:
        return _models[product_id]

    model_path = MODELS_DIR / f"{product_id}.pt"
    if _HAS_YOLO and model_path.exists():
        model = YOLO(str(model_path))
    else:
        model = None  # mod mock
    _models[product_id] = model
    return model


def _predict_real(model, jpeg: bytes) -> List[dict]:
    """Ruleaza YOLO real pe octetii JPEG si normalizeaza rezultatul."""
    import numpy as np
    import cv2

    arr = np.frombuffer(jpeg, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return []
    h, w = img.shape[:2]

    results = model.predict(img, conf=CONF_THRESHOLD, verbose=False)
    dets: List[dict] = []
    names = model.names  # {idx: nume_clasa}
    for r in results:
        for box in r.boxes:
            cls_idx = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
            dets.append({
                "class": names.get(cls_idx, str(cls_idx)),
                "confidence": round(conf * 100, 1),     # 0-100, ca in DB
                "bbox_x": round(x1 / w, 4),
                "bbox_y": round(y1 / h, 4),
                "bbox_w": round((x2 - x1) / w, 4),
                "bbox_h": round((y2 - y1) / h, 4),
            })
    return dets


def _predict_mock(product_id: str, drop: List[str], wrong: List[str]) -> List[dict]:
    """
    Detectii simulate: intoarce toate clasele cunoscute ale produsului ca fiind
    detectate, cu exceptia celor din 'drop' (simuleaza piese lipsa). Clasele din
    'wrong' sunt marcate cu sufixul '-wrong' (simuleaza montaj gresit).
    """
    classes = _classes_for(product_id)
    dets: List[dict] = []
    rnd = random.Random(hash(product_id) & 0xFFFF)
    for code in classes:
        if code in drop:
            continue  # piesa lipsa -> nu apare in detectii
        cls_name = f"{code}-wrong" if code in wrong else code
        dets.append({
            "class": cls_name,
            "confidence": round(rnd.uniform(85, 99), 1),
            "bbox_x": round(rnd.uniform(0.1, 0.6), 4),
            "bbox_y": round(rnd.uniform(0.1, 0.6), 4),
            "bbox_w": round(rnd.uniform(0.1, 0.3), 4),
            "bbox_h": round(rnd.uniform(0.1, 0.3), 4),
        })
    return dets


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "yolo_available": _HAS_YOLO,
        "models_loaded": list(_models.keys()),
        "models_dir": str(MODELS_DIR),
    }


@app.post("/predict/{product_id}")
async def predict(product_id: str, request: Request):
    """
    Primeste o imagine (JPEG brut in body) si intoarce detectiile.
    Query optional (doar in mod mock, pentru demo/testare):
    """
    jpeg = await request.body()
    if not jpeg:
        return JSONResponse({"error": "body gol (lipsește imaginea)"}, status_code=400)

    model = _load_model(product_id)

    if model is not None:
        dets = _predict_real(model, jpeg)
        mock = False
    else:
        qp = request.query_params
        drop = [c for c in qp.get("drop", "").split(",") if c]
        wrong = [c for c in qp.get("wrong", "").split(",") if c]
        dets = _predict_mock(product_id, drop, wrong)
        mock = True

    return {
        "product_id": product_id,
        "mock": mock,
        "detections": dets,
        "count": len(dets),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "9001")))
