import os
import sys
import socket
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


def forward_stream(source: socket.socket, destination: socket.socket):
    try:
        while True:
            data = source.recv(4096)
            if not data:
                break
            destination.sendall(data)
    except Exception:
        pass
    finally:
        try:
            source.close()
        except Exception:
            pass
        try:
            destination.close()
        except Exception:
            pass


def start_port_forwarder(from_port: int, to_port: int):
    """
    Transparent Layer-4 TCP forwarder.
    Forward requests from auxiliary ports (e.g. 8000 or 8080) to primary Uvicorn port.
    Guarantees compatibility with Railway router whether it dials 8000, 8080, or $PORT,
    without launching duplicate Uvicorn instances or causing DB/signal conflicts.
    """
    if from_port == to_port:
        return

    def forwarder_thread():
        try:
            srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            srv.bind(("0.0.0.0", from_port))
            srv.listen(128)
            print(f"[SETU PROXY] Auxiliary TCP forwarder active: 0.0.0.0:{from_port} -> 127.0.0.1:{to_port}", flush=True)
            while True:
                client, _ = srv.accept()
                upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    upstream.connect(("127.0.0.1", to_port))
                    t1 = threading.Thread(target=forward_stream, args=(client, upstream), daemon=True)
                    t2 = threading.Thread(target=forward_stream, args=(upstream, client), daemon=True)
                    t1.start()
                    t2.start()
                except Exception:
                    client.close()
        except Exception as e:
            print(f"[SETU PROXY] Port {from_port} forwarder skipped: {e}", flush=True)

    t = threading.Thread(target=forwarder_thread, daemon=True)
    t.start()


if __name__ == "__main__":
    port_env = os.environ.get("PORT")
    primary_port = 8080
    if port_env:
        try:
            primary_port = int(port_env)
        except (ValueError, TypeError):
            primary_port = 8080

    host = os.environ.get("HOST", "0.0.0.0")

    # Start transparent TCP forwarders for standard ports (8000, 8080) to the primary port
    for aux_port in [8000, 8080]:
        if aux_port != primary_port:
            start_port_forwarder(aux_port, primary_port)

    print(f"[SETU SERVER] Starting Main Uvicorn Server on {host}:{primary_port}...", flush=True)
    uvicorn.run(app, host=host, port=primary_port, log_level="info")
