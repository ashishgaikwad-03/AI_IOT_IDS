from scapy.all import *
import random, time
TARGET_IP = "192.168.1.10"
print("[ATTACK] L2 ANOMALY... Ctrl+C to stop")
try:
    while True:
        c = random.choice(["tcp","udp","icmp"])
        if c == "tcp":
            pkt = IP(dst=TARGET_IP)/TCP(dport=random.randint(1,1024), flags="S")
        elif c == "udp":
            pkt = IP(dst=TARGET_IP)/UDP(dport=random.randint(1,1024))/Raw(load="X"*50)
        else:
            pkt = IP(dst=TARGET_IP)/ICMP()
        send(pkt, verbose=False)
        time.sleep(0.008)
except KeyboardInterrupt:
    print("\nStopped.")
