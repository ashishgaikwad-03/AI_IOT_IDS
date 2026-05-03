"""
ATTACK SCRIPT 5: Telnet Brute-Force
Simulates Hydra-style password cracking on Telnet port 23.
Run: python attack_5_telnet_brute.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
ATTACKER_IP = "172.16.0.4"
TARGET_IP = "192.168.1.50"
TOTAL = 30

print("=" * 60)
print("[ATTACK] TELNET BRUTE-FORCE SIMULATION")
print(f"  Attacker: {ATTACKER_IP}  ->  Target: {TARGET_IP}:23")
print(f"  Attempting {TOTAL} password guesses...")
print("=" * 60)

for i in range(1, TOTAL + 1):
    try:
        r = requests.post(API, params={"attack_type": "brute", "source_ip": ATTACKER_IP, "dest_ip": TARGET_IP})
        data = r.json()
        print(f"  [{i:02d}/{TOTAL}] >> {data['classification']} -- Login attempt #{i}")
    except Exception as e:
        print(f"  [{i:02d}] FAILED: {e}")
        break
    time.sleep(random.uniform(0.15, 0.35))

print("\n[DONE] Telnet Brute-Force simulation complete. Check dashboard!")
