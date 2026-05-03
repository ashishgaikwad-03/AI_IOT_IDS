"""
ATTACK SCRIPT 4: MITM ARP Spoofing
Simulates a Man-in-the-Middle ARP poisoning attack.
Detection: MITM-ARP (severity 92) — highest severity!
Run: python attack_4_mitm_arp_spoof.py
"""
import requests, time, random

API = "http://localhost:8000/api/inject-attack"
ATTACKER_IP = "192.168.1.66"
GATEWAY_IP = "192.168.1.1"
VICTIMS = [
    "192.168.1.10", "192.168.1.20", "192.168.1.30",
    "192.168.1.40", "192.168.1.50",
]
POISON_ROUNDS = 4

print("=" * 65)
print("  [ATTACK 4] MITM ARP SPOOFING SIMULATION")
print(f"  Attacker       : {ATTACKER_IP}")
print(f"  Gateway        : {GATEWAY_IP}")
print(f"  Victim Hosts   : {len(VICTIMS)}")
print(f"  Poison Rounds  : {POISON_ROUNDS}")
print(f"  Total Packets  : {len(VICTIMS) * POISON_ROUNDS * 2}")
print("=" * 65)

total = 0
for rnd in range(1, POISON_ROUNDS + 1):
    print(f"\n  --- ARP Poison Round {rnd}/{POISON_ROUNDS} ---")
    for victim in VICTIMS:
        # Poison victim's ARP cache (pretend to be gateway)
        total += 1
        try:
            r = requests.post(API, params={
                "attack_type": "theft",
                "source_ip": ATTACKER_IP,
                "dest_ip": victim,
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | Poisoning {victim} (fake gateway)")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.1, 0.2))

        # Poison gateway's ARP cache (pretend to be victim)
        total += 1
        try:
            r = requests.post(API, params={
                "attack_type": "theft",
                "source_ip": ATTACKER_IP,
                "dest_ip": GATEWAY_IP,
            })
            data = r.json()
            print(f"     [{total:03d}] {data['classification']} | Poisoning gateway (fake {victim})")
        except Exception as e:
            print(f"     [{total:03d}] FAILED: {e}")
            break
        time.sleep(random.uniform(0.1, 0.2))
    time.sleep(0.3)

print(f"\n{'=' * 65}")
print(f"  [DONE] ARP Spoofing complete. {total} poison packets sent.")
print(f"  >> Check the dashboard for MITM-ARP critical alerts!")
print(f"{'=' * 65}")
