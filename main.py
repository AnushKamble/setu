import os
import sys

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

if __name__ == "__main__":
    import uvicorn

    port_str = os.environ.get("PORT", "8000")
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 8000

    print(f"[SETU STARTUP] Target Port: {port}", flush=True)
    print(f"[SETU STARTUP] Launching Uvicorn server on 0.0.0.0:{port}...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
