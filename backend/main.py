import os
import sys
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


if __name__ == "__main__":
    # Railway sets PORT in environment (typically 8080 or dynamic)
    port_env = os.environ.get("PORT", "8080")
    try:
        port = int(port_env)
    except (ValueError, TypeError):
        port = 8080

    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[SETU SERVER] Starting Single-Process Uvicorn on {host}:{port}...", flush=True)
    uvicorn.run(app, host=host, port=port, log_level="info")


