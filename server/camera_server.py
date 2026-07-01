import cv2
import base64
import asyncio
import json
import websockets

# Mapam fiecare produs (cu camera) la un index de camera al calculatorului.
CAMERA_MAP = {
    "p-101": 0,   # Carcasa conector A12  -> camera 0
    "p-102": 1,   # Suport montaj B7      -> camera 1
    # "p-103" nu are camera
}

# Cate citiri esuate la rand consideram "camera pierduta".
MAX_FAILED_READS = 15

# Camere deschise o singura data, partajate intre conexiuni.
_cameras = {}
_lock = asyncio.Lock()


async def acquire_camera(cam_index):
    async with _lock:
        entry = _cameras.get(cam_index)
        if entry is None:
            cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap.release()
                return None
            entry = {"cap": cap, "clients": 0}
            _cameras[cam_index] = entry
            print(f"Camera {cam_index} deschisă")
        entry["clients"] += 1
        return entry["cap"]


async def release_camera(cam_index):
    async with _lock:
        entry = _cameras.get(cam_index)
        if not entry:
            return
        entry["clients"] -= 1
        if entry["clients"] <= 0:
            entry["cap"].release()
            del _cameras[cam_index]
            print(f"Camera {cam_index} eliberată (niciun client)")


async def drop_camera(cam_index):
    """Forteaza eliberarea camerei (ex. a fost deconectata fizic)."""
    async with _lock:
        entry = _cameras.get(cam_index)
        if entry:
            entry["cap"].release()
            del _cameras[cam_index]
            print(f"Camera {cam_index} pierdută, eliberată")


async def stream(websocket):
    path = websocket.request.path.lstrip("/")
    product_id = path or "p-101"

    if product_id not in CAMERA_MAP:
        await websocket.send(json.dumps({"error": f"Niciun feed pentru '{product_id}'"}))
        await websocket.close()
        return

    cam_index = CAMERA_MAP[product_id]
    cap = await acquire_camera(cam_index)

    if cap is None:
        await websocket.send(json.dumps({"error": f"Camera {cam_index} indisponibilă"}))
        await websocket.close()
        return

    print(f"Client conectat pe /{product_id} -> camera {cam_index}")
    failed = 0
    dropped = False

    try:
        while True:
            ret, frame = cap.read()

            if not ret or frame is None:
                failed += 1
                if failed >= MAX_FAILED_READS:
                    # Camera nu mai da imagini -> anuntam clientul si inchidem.
                    await websocket.send(json.dumps({"error": "Cameră deconectată"}))
                    await drop_camera(cam_index)
                    dropped = True
                    break
                await asyncio.sleep(0.05)
                continue

            failed = 0  # reset la o citire reusita
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            encoded = base64.b64encode(buffer).decode("utf-8")
            await websocket.send("data:image/jpeg;base64," + encoded)
            await asyncio.sleep(0.03)  # ~30 fps

    except websockets.exceptions.ConnectionClosed:
        print(f"Client deconectat de pe /{product_id}")
    finally:
        if not dropped:
            await release_camera(cam_index)


async def main():
    async with websockets.serve(stream, "0.0.0.0", 8765):
        print("Server pornit pe ws://0.0.0.0:8765")
        print("Conectează un produs la ws://localhost:8765/<product_id> (ex. /p-101)")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())