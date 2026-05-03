"""
ATTACK SCRIPT 2: Mirai Botnet ACK Flood
Simulates a Mirai botnet performing ACK-based DDoS attack.
Detection: Mirai-ACK (severity 85)
Run: python attack_2_mirai_ack_botnet.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
BOTNET_NODES = [
    {"ip": "10.0.0.55",     "device": "IoT Camera"},
    {"ip": "10.0.0.112",    "device": "Smart Thermostat"},
    {"ip": "172.16.5.88",   "device": "NAS Drive"},
    {"ip": "10.0.0.201",    "device": "IP Doorbell"},
    {"ip": "192.168.2.77",  "device": "Smart TV"},
    {"ip": "10.0.0.33",     "device": "WiFi Router"},
    {"ip": "172.16.5.144",  "device": "Baby Monitor"},
]
TARGET_IP = "192.168.1.1"
WAVES = 3

print("=" * 65)
print("  [ATTACK 2] MIRAI BOTNET ACK FLOOD SIMULATION")
print(f"  Compromised Devices : {len(BOTNET_NODES)}")
print(f"  Attack Waves        : {WAVES}")
print(f"  Target Gateway      : {TARGET_IP}")
print(f"  Total Packets       : {len(BOTNET_NODES) * WAVES}")
print("=" * 65)

total = 0
for wave in range(1, WAVES + 1):
    print(f"\n  --- Wave {wave}/{WAVES} ---")
    for node in BOTNET_NODES:
        total += 1
        try:
            r = requests.post(API, params={
                "attack_type": "ddos",
                "source_ip": node["ip"],
                "dest_ip": TARGET_IP,
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | {node['device']} ({node['ip']})")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.1, 0.25))
    time.sleep(0.5)

print(f"\n{'=' * 65}")
print(f"  [DONE] Mirai Botnet ACK Flood complete. {total} packets from {len(BOTNET_NODES)} bots.")
print(f"  >> Check the dashboard for Mirai-ACK DDoS alerts!")
print(f"{'=' * 65}")
