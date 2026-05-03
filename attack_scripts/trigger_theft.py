from scapy.all import *
import random, time, string
TARGET_IP = "10.0.0.50"
print("[ATTACK] DATA EXFILTRATION... Ctrl+C to stop")
try:
    while True:
        data = ''.join(random.choices(string.ascii_letters, k=1200))
        send(IP(dst=TARGET_IP)/TCP(dport=443, flags="PA")/Raw(load=data), verbose=False)
        time.sleep(0.02)
except KeyboardInterrupt:
    print("\nStopped.")
