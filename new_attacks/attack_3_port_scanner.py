"""
ATTACK SCRIPT 3: Aggressive Port Scanner
Simulates a reconnaissance port scan across multiple targets.
Detection: Scan-Port (severity 55)
Run: python attack_3_port_scanner.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
SCANNER_IP = "103.75.190.44"
TARGETS = [
    "192.168.1.1", "192.168.1.10", "192.168.1.20",
    "192.168.1.50", "192.168.1.100",
]
SCANS_PER_TARGET = 5

print("=" * 65)
print("  [ATTACK 3] AGGRESSIVE PORT SCANNER SIMULATION")
print(f"  Scanner IP     : {SCANNER_IP}")
print(f"  Target Hosts   : {len(TARGETS)}")
print(f"  Scans per Host : {SCANS_PER_TARGET}")
print(f"  Total Probes   : {len(TARGETS) * SCANS_PER_TARGET}")
print("=" * 65)

total = 0
for target in TARGETS:
    print(f"\n  >> Scanning {target}")
    for i in range(1, SCANS_PER_TARGET + 1):
        total += 1
        try:
            r = requests.post(API, params={
                "attack_type": "scan",
                "source_ip": SCANNER_IP,
                "dest_ip": target,
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | Port probe -> {target}")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.2, 0.4))

print(f"\n{'=' * 65}")
print(f"  [DONE] Port Scan complete. {total} probes sent across {len(TARGETS)} hosts.")
print(f"  >> Check the dashboard for Scan-Port recon alerts!")
print(f"{'=' * 65}")
