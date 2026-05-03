"""
ATTACK SCRIPT 4: MITM-ARP Spoofing
Simulates Man-in-the-Middle ARP poisoning.
Run: python attack_4_mitm_arp.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
ATTACKER_IP = "192.168.1.200"
GATEWAY_IP = "192.168.1.1"
TOTAL = 15

print("=" * 60)
print("[ATTACK] MITM-ARP SPOOFING SIMULATION")
print(f"  Attacker: {ATTACKER_IP}  ->  Gateway: {GATEWAY_IP}")
print(f"  Poisoning ARP table with {TOTAL} spoofed replies...")
print("=" * 60)

for i in range(1, TOTAL + 1):
    try:
        r = requests.post(API, params={"attack_type": "theft", "source_ip": ATTACKER_IP, "dest_ip": GATEWAY_IP})
        data = r.json()
        print(f"  [{i:02d}/{TOTAL}] >> {data['classification']} -- ARP cache poisoned!")
    except Exception as e:
        print(f"  [{i:02d}] FAILED: {e}")
        break
    time.sleep(random.uniform(0.5, 1.0))

print("\n[DONE] MITM-ARP Spoofing simulation complete. Check dashboard!")
