"""
ATTACK SCRIPT 2: Mirai-UDP Botnet DDoS
Simulates a distributed botnet volumetric flood.
Run: python attack_2_mirai_udp.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
BOTNET_IPS = ["10.0.0.99", "45.22.19.1", "112.55.9.8", "77.8.2.19", "203.0.113.42"]
TARGET_IP = "192.168.1.1"
PER_BOT = 8

print("=" * 60)
print("[ATTACK] MIRAI-UDP BOTNET DDoS SIMULATION")
print(f"  Botnet Size: {len(BOTNET_IPS)} compromised devices")
print(f"  Target: {TARGET_IP}")
print("=" * 60)

total = 0
for bot_ip in BOTNET_IPS:
    print(f"\n  [BOT] Source: {bot_ip}")
    for i in range(1, PER_BOT + 1):
        total += 1
        try:
            r = requests.post(API, params={"attack_type": "botnet", "source_ip": bot_ip, "dest_ip": TARGET_IP})
            data = r.json()
            print(f"    [{i:02d}/{PER_BOT}] >> {data['classification']} from {bot_ip}")
        except Exception as e:
            print(f"    [{i:02d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.1, 0.3))

print(f"\n[DONE] Mirai-UDP Botnet simulation complete. {total} packets sent.")
