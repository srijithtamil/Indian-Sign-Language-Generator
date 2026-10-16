import subprocess
import sys
import os
import time
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    engine_dir = os.path.join(root_dir, "engine")
    server_dir = os.path.join(root_dir, "server")
    client_dir = os.path.join(root_dir, "client")

    print("=" * 65)
    print("   INDIAN SIGN LANGUAGE (ISL) TRANSLATOR WEB PORTAL")
    print("   harshbg Deep Learning Engine + MERN Architecture")
    print("=" * 65)
    print("[*] Starting Python ISL Deep Learning Engine on port 5001...")
    engine_proc = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=engine_dir,
        shell=False
    )

    time.sleep(2)

    print("[*] Starting Express API Server on port 5000...")
    server_proc = subprocess.Popen(
        ["npm", "start"],
        cwd=server_dir,
        shell=True
    )

    time.sleep(2)

    print("[*] Starting React Vite Portal on port 5173...")
    client_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=client_dir,
        shell=True
    )

    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    print("\n[OK] All services started successfully!")
    print("-----------------------------------------------------------------")
    print("   * Frontend Portal:  http://localhost:5173")
    print("   * Express Backend:  http://localhost:5000")
    print("   * Python DL Engine: http://localhost:5001")
    print("-----------------------------------------------------------------")
    print("Press Ctrl+C to terminate all services...\n")

    processes = [engine_proc, server_proc, client_proc]

    try:
        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    # One of the processes died
                    print(f"[!] Process {p} exited with code {p.returncode}")
    except KeyboardInterrupt:
        print("\n[*] Shutting down all ISL Portal services...")
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
        print("[OK] All services stopped.")

if __name__ == "__main__":
    main()
