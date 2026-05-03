"""
ATTACK SCRIPT 1: DoS-SYN Flood
Simulates a Denial-of-Service SYN Flood attack.
Run: python attack_1_dos_syn.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
ATTACKER_IP = "82.14.99.102"
TARGET_IP = "192.168.1.10"
TOTAL = 25

print("=" * 60)
print("[ATTACK] DoS-SYN FLOOD SIMULATION")
print(f"  Attacker: {ATTACKER_IP}  ->  Target: {TARGET_IP}")
print(f"  Injecting {TOTAL} malicious packets...")
print("=" * 60)

for i in range(1, TOTAL + 1):
    try:
        r = requests.post(API, params={"attack_type": "dos", "source_ip": ATTACKER_IP, "dest_ip": TARGET_IP})
        data = r.json()
        print(f"  [{i:02d}/{TOTAL}] >> {data['classification']} injected")
    except Exception as e:
        print(f"  [{i:02d}] FAILED: {e}")
        break
    time.sleep(random.uniform(0.3, 0.6))

print("\n[DONE] DoS-SYN Flood simulation complete. Check dashboard!")
