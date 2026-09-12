import os
import sys
import threading
import uvicorn

# Ensure both current directory and parent directory are on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

PARENT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

# Support running from root or from within backend/
try:
    from backend.app.main import app
except ImportError:
    from app.main import app


def run_uvicorn(port: int):
    try:
        print(f"[SETU SERVER] Listening on 0.0.0.0:{port}...", flush=True)
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    except Exception as e:
        print(f"[SETU SERVER] Listener on port {port} ended: {e}", flush=True)


if __name__ == "__main__":
    env_port = os.environ.get("PORT")
    ports_to_listen = set()

    if env_port:
        try:
            ports_to_listen.add(int(env_port))
        except (ValueError, TypeError):
            pass

    # Always listen on both 8000 and 8080 to guarantee compatibility with Railway proxy, Docker, and local dev
    ports_to_listen.add(8000)
    ports_to_listen.add(8080)

    ports_list = sorted(list(ports_to_listen))
    print(f"[SETU STARTUP] Target Ports to Bind: {ports_list}", flush=True)

    # Primary port runs on the main thread; any other ports run on daemon threads
    primary_port = int(env_port) if env_port and int(env_port) in ports_list else ports_list[0]
    secondary_ports = [p for p in ports_list if p != primary_port]

    for p in secondary_ports:
        t = threading.Thread(target=run_uvicorn, args=(p,), daemon=True)
        t.start()

    run_uvicorn(primary_port)

