"""Server releu intre LabVIEW si dashboard.

LabVIEW trimite frame-uri prin HTTP POST la /ingest/<product_id>, iar dashboard-ul
se conecteaza prin WebSocket la /<product_id> si primeste frame-urile ca
"data:image/jpeg;base64,...".
"""

import base64
from typing import Dict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Feed relay (LabVIEW -> dashboard)")

# CORS lax: utile daca dashboard-ul ruleaza pe alt port (Vite: 5173).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# product_id -> set de WebSocket-uri (clienti dashboard conectati)
_subscribers: Dict[str, Set[WebSocket]] = {}
# product_id -> ultimul frame primit (data URI), ca un client nou sa vada imediat ceva
_latest: Dict[str, str] = {}
# product_id -> ultimii octeti JPEG (pentru endpoint-ul de diagnostic /last)
_latest_bytes: Dict[str, bytes] = {}


async def _broadcast(product_id: str, message: str) -> None:
    """Trimite un mesaj tuturor dashboard-urilor abonate la produsul dat."""
    dead = []
    for ws in list(_subscribers.get(product_id, set())):
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _subscribers.get(product_id, set()).discard(ws)


@app.get("/health")
async def health():
    """Verificare rapida ca serverul e pornit + cati clienti sunt pe fiecare produs."""
    return {
        "status": "ok",
        "products": {pid: len(conns) for pid, conns in _subscribers.items()},
    }


@app.post("/ingest/{product_id}")
async def ingest(product_id: str, request: Request):

    body = await request.body()

    if body[:2] == b"\xff\xd8":

        jpeg = body
        b64 = base64.b64encode(jpeg).decode("ascii")
    else:
        # text base64 (cu sau fara prefix "data:image...")
        text = body.decode("ascii", errors="ignore").strip()
        if text.startswith("data:"):
            text = text.split(",", 1)[1]
        b64 = text
        try:
            jpeg = base64.b64decode(b64)
        except Exception:
            jpeg = b""

    data_uri = "data:image/jpeg;base64," + b64
    _latest[product_id] = data_uri
    _latest_bytes[product_id] = jpeg
    await _broadcast(product_id, data_uri)

    return {
        "ok": True,
        "bytes": len(body),
        "looks_like_jpeg": body[:2] == b"\xff\xd8",
        "subscribers": len(_subscribers.get(product_id, set())),
    }


@app.get("/last/{product_id}")
async def last(product_id: str):
    """
    Diagnostic: intoarce ultimul frame ca imagine reala.
    Deschide http://localhost:8765/last/p-101 in browser:
      - vezi poza de la camera  -> serverul primeste corect, problema e doar in dashboard;
      - vezi imagine sparta/goala -> octetii de la LabVIEW sunt deformati.
    """
    jpeg = _latest_bytes.get(product_id)
    if not jpeg:
        return JSONResponse({"error": f"Niciun frame încă pentru '{product_id}'"}, status_code=404)
    return Response(content=jpeg, media_type="image/jpeg")


@app.websocket("/{product_id}")
async def feed(ws: WebSocket, product_id: str):
    """Dashboard-ul se conecteaza aici si primeste frame-urile produsului."""
    await ws.accept()
    _subscribers.setdefault(product_id, set()).add(ws)

    # Daca avem deja un frame, il trimitem imediat (altfel ecranul sta gol pana la urmatorul POST).
    if product_id in _latest:
        try:
            await ws.send_text(_latest[product_id])
        except Exception:
            pass

    try:
        # Nu asteptam mesaje de la dashboard; doar tinem conexiunea vie
        # si detectam deconectarea.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _subscribers.get(product_id, set()).discard(ws)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8765)
