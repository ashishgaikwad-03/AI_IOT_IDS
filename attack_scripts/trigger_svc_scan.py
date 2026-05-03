from scapy.all import *
import random, time
TARGET_IP = "192.168.1.10"
print("[ATTACK] SERVICE SCAN... Ctrl+C to stop")
try:
    while True:
        send(IP(dst=TARGET_IP)/TCP(dport=random.randint(1,65535), flags="S"), verbose=False)
        time.sleep(0.05)
except KeyboardInterrupt:
    print("\nStopped.")
