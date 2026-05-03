"""
ATTACK SCRIPT 6: MIXED MULTI-VECTOR ASSAULT
Simulates a realistic cyber kill chain with all 5 attack types.
Run: python attack_6_mixed_assault.py

Timeline:
  Phase 1: Reconnaissance (Port Scan)
  Phase 2: Exploitation (Telnet Brute-Force)
  Phase 3: Lateral Movement (MITM-ARP Spoofing)
  Phase 4: Payload (DoS-SYN Flood)
  Phase 5: Full Assault (Mirai Botnet DDoS)
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"

def inject(attack_type, src, dst, count, delay_range, phase_name):
    print(f"\n  {'_'*50}")
    print(f"  PHASE: {phase_name}")
    print(f"  {src}  ->  {dst}  ({count} packets)")
    print(f"  {'_'*50}")
    for i in range(1, count + 1):
        try:
            r = requests.post(API, params={"attack_type": attack_type, "source_ip": src, "dest_ip": dst})
            data = r.json()
            print(f"    [{i:02d}/{count}] >> {data['classification']}")
        except Exception as e:
            print(f"    [{i:02d}] FAILED: {e}")
            break
        time.sleep(random.uniform(*delay_range))

print("=" * 60)
print("[ATTACK] MIXED MULTI-VECTOR ASSAULT SIMULATION")
print("  Simulating a full cyber kill chain...")
print("=" * 60)
time.sleep(1)

# Phase 1: Reconnaissance
inject("scan", "192.168.1.45", "10.0.0.5", 8, (0.3, 0.6), "RECONNAISSANCE -- Port Scan")
time.sleep(2)

# Phase 2: Brute Force
inject("brute", "192.168.1.45", "10.0.0.5", 10, (0.15, 0.3), "EXPLOITATION -- Telnet Brute-Force")
time.sleep(2)

# Phase 3: MITM
inject("theft", "192.168.1.200", "192.168.1.1", 6, (0.5, 0.8), "LATERAL MOVEMENT -- ARP Spoofing")
time.sleep(2)

# Phase 4: DoS
inject("dos", "82.14.99.102", "192.168.1.10", 12, (0.2, 0.4), "PAYLOAD -- DoS-SYN Flood")
time.sleep(2)

# Phase 5: Full DDoS from Botnet
botnet_ips = ["10.0.0.99", "45.22.19.1", "112.55.9.8"]
for bot in botnet_ips:
    inject("botnet", bot, "192.168.1.1", 6, (0.1, 0.2), f"FULL ASSAULT -- Mirai Botnet ({bot})")
    time.sleep(1)

print("\n" + "=" * 60)
print("[DONE] FULL KILL CHAIN SIMULATION COMPLETE!")
print("  Check the dashboard for the complete attack timeline.")
print("=" * 60)
