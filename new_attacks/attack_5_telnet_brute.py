"""
ATTACK SCRIPT 5: Telnet Brute Force
Simulates a credential stuffing attack against IoT Telnet services.
Detection: Telnet-Brute (severity 82)
Run: python attack_5_telnet_brute.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
ATTACKER_IP = "198.51.100.77"
IOT_TARGETS = [
    {"ip": "192.168.1.10",  "device": "IP Camera"},
    {"ip": "192.168.1.20",  "device": "Smart Router"},
    {"ip": "192.168.1.30",  "device": "NVR Recorder"},
    {"ip": "192.168.1.40",  "device": "Smart Plug"},
]
ATTEMPTS_PER_DEVICE = 8

CREDENTIALS = [
    "admin:admin", "root:root", "admin:1234", "root:password",
    "admin:password", "user:user", "root:toor", "admin:default",
]

print("=" * 65)
print("  [ATTACK 5] TELNET BRUTE FORCE SIMULATION")
print(f"  Attacker         : {ATTACKER_IP}")
print(f"  Target Devices   : {len(IOT_TARGETS)}")
print(f"  Attempts/Device  : {ATTEMPTS_PER_DEVICE}")
print(f"  Total Attempts   : {len(IOT_TARGETS) * ATTEMPTS_PER_DEVICE}")
print("=" * 65)

total = 0
for target in IOT_TARGETS:
    print(f"\n  >> Attacking {target['device']} ({target['ip']}) on port 23")
    for i in range(ATTEMPTS_PER_DEVICE):
        total += 1
        cred = CREDENTIALS[i % len(CREDENTIALS)]
        try:
            r = requests.post(API, params={
                "attack_type": "brute",
                "source_ip": ATTACKER_IP,
                "dest_ip": target["ip"],
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | Trying '{cred}' on {target['ip']}:23")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.2, 0.5))

print(f"\n{'=' * 65}")
print(f"  [DONE] Telnet Brute Force complete. {total} login attempts.")
print(f"  >> Check the dashboard for Telnet-Brute alerts!")
print(f"{'=' * 65}")
