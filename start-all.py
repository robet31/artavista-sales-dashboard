import subprocess
import time
import os
import sys

# Simple colors using ANSI codes (works on Windows)
GREEN = "\x1b[92m"
YELLOW = "\x1b[93m"
RED = "\x1b[91m"
BLUE = "\x1b[94m"
RESET = "\x1b[0m"

print("=" * 50)
print("Starting Adidas Dashboard - Backend & Frontend")
print("=" * 50)

# Get project root (directory where this script is located)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = script_dir
backend_dir = os.path.join(project_root, "backend-fastapi")

# Change to backend directory
os.chdir(backend_dir)

# Start backend
print("\n[1] Starting Backend FastAPI (port 8000)...")
backend_process = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=backend_dir,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
)

# Wait for backend to start
print("    Waiting for backend...")
time.sleep(5)

# Check backend
try:
    import requests

    r = requests.get("http://localhost:8000/api/v1/adidas/test", timeout=5)
    if r.status_code == 200:
        print("    [OK] Backend running at http://localhost:8000")
    else:
        print("    [WARN] Backend responded but may not be ready")
except Exception as e:
    print("    [WARN] Backend check failed (may still be starting)")

# Start frontend
print("\n[2] Starting Frontend Next.js (port 3000)...")
os.chdir(project_root)

# Use npm command directly (works on Windows and Unix)
npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
frontend_process = subprocess.Popen(
    [npm_cmd, "run", "dev"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=project_root,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
)

# Wait for frontend
print("    Waiting for frontend...")
time.sleep(8)

print("\n" + "=" * 50)
print("SUCCESS! All services started!")
print("=" * 50)
print("\n   [BACKEND]  http://localhost:8000")
print("   [FRONTEND] http://localhost:3000")
print("\n   DASHBOARD READY TO USE!")
print("   Open http://localhost:3000/upload in your browser")
print("\n" + "=" * 50)
print("\nPress Ctrl+C to stop all services")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n\nStopping services...")
    backend_process.terminate()
    frontend_process.terminate()
    print("All services stopped.")
