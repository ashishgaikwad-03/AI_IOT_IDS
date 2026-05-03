import pyshark
import numpy as np
import time
import csv
import os

# Explicit Windows Wi-Fi Interface from TShark
INTERFACE = "\\Device\\NPF_{774E7F0D-090F-4B1C-A0D7-6A073B9326C8}"
WINDOW_DURATION = 5
OUTPUT_FILE = "../data/layer2_data.csv"

os.makedirs("../data", exist_ok=True)

print("Layer-2 Data Collection Started")
print("Interface:", INTERFACE)
print("Window:", WINDOW_DURATION, "seconds")

capture = pyshark.LiveCapture(interface=INTERFACE)

# Create CSV with header if not exists
if not os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "packet_rate",
            "unique_dst_ips",
            "unique_src_ips",
            "mean_pkt_size",
            "std_pkt_size",
            "protocol_count",
            "label"
        ])

while True:
    start_time = time.time()

    pkt_count = 0
    pkt_sizes = []
    src_ips = set()
    dst_ips = set()
    protocols = set()

    for packet in capture.sniff_continuously():
        try:
            pkt_count += 1
            pkt_sizes.append(int(packet.length))

            if hasattr(packet, "ip"):
                src_ips.add(packet.ip.src)
                dst_ips.add(packet.ip.dst)

            protocols.add(packet.highest_layer)

            if time.time() - start_time > WINDOW_DURATION:
                break

        except:
            continue

    if pkt_count < 5:
        continue

    duration = time.time() - start_time
    pkt_rate = pkt_count / duration

    row = [
        round(pkt_rate, 2),
        len(dst_ips),
        len(src_ips),
        round(np.mean(pkt_sizes), 2),
        round(np.std(pkt_sizes), 2),
        len(protocols),
        -1  # label placeholder
    ]

    import requests

    try:
        requests.post(
            "http://localhost:8000/alert_layer2", 
            json={
                "packet_rate": round(pkt_rate, 2),
                "unique_dst_ips": len(dst_ips),
                "unique_src_ips": len(src_ips),
                "mean_pkt_size": round(np.mean(pkt_sizes), 2),
                "std_pkt_size": round(np.std(pkt_sizes), 2),
                "protocol_count": len(protocols)
            },
            timeout=0.5
        )
    except Exception as e:
        print("Backend unreachable:", e)

    print("Collected & Sent:", row)
