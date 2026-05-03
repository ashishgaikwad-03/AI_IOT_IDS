"""
ATTACK SCRIPT 3: Port Scan (Reconnaissance)
Simulates Nmap-style sequential port scanning.
Run: python attack_3_port_scan.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
SCANNER_IP = "192.168.1.45"
TARGET_IP = "10.0.0.5"
TOTAL = 20

print("=" * 60)
print("[ATTACK] PORT SCAN RECONNAISSANCE SIMULATION")
print(f"  Scanner: {SCANNER_IP}  ->  Target: {TARGET_IP}")
print(f"  Scanning {TOTAL} ports...")
print("=" * 60)

for i in range(1, TOTAL + 1):
    try:
        r = requests.post(API, params={"attack_type": "scan", "source_ip": SCANNER_IP, "dest_ip": TARGET_IP})
        data = r.json()
        print(f"  [{i:02d}/{TOTAL}] >> {data['classification']} detected")
    except Exception as e:
        print(f"  [{i:02d}] FAILED: {e}")
        break
    time.sleep(random.uniform(0.4, 0.8))

print("\n[DONE] Port Scan simulation complete. Check dashboard!")
