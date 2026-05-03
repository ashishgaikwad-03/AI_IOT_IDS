"""
ATTACK SCRIPT 1: DDoS TCP SYN Flood
Simulates a massive DDoS TCP SYN flood from multiple spoofed sources.
Detection: DoS-SYN (severity 88)
Run: python attack_1_ddos_tcp_flood.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
SPOOFED_SOURCES = [
    "185.220.101.34", "91.219.236.18", "45.155.205.99",
    "194.163.44.12", "23.129.64.210", "162.247.74.7",
]
TARGET_IP = "192.168.1.100"
PACKETS_PER_SOURCE = 6

print("=" * 65)
print("  [ATTACK 1] DDoS TCP SYN FLOOD SIMULATION")
print(f"  Spoofed Sources : {len(SPOOFED_SOURCES)} IPs")
print(f"  Target          : {TARGET_IP}")
print(f"  Total Packets   : {len(SPOOFED_SOURCES) * PACKETS_PER_SOURCE}")
print("=" * 65)

total = 0
for src_ip in SPOOFED_SOURCES:
    print(f"\n  >> Flooding from {src_ip}")
    for i in range(1, PACKETS_PER_SOURCE + 1):
        total += 1
        try:
            r = requests.post(API, params={
                "attack_type": "dos",
                "source_ip": src_ip,
                "dest_ip": TARGET_IP,
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | {src_ip} -> {TARGET_IP}")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.15, 0.35))

print(f"\n{'=' * 65}")
print(f"  [DONE] DDoS SYN Flood complete. {total} packets injected.")
print(f"  >> Check the dashboard for DoS-SYN alerts!")
print(f"{'=' * 65}")
