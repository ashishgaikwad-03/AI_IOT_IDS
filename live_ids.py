#PHASE 1 WORKING CODE :

"""
=========================================================
FINAL PHASE-1 IDS (IoT Gateway – Safe Version)
---------------------------------------------------------
Scope:
  - Volumetric DDoS / Flooding
  - Network Scanning / Reconnaissance
Techniques:
  - Rate + Packet Size
  - Destination Spread
  - Traffic Stability (Variance as supporting signal)
Out of Scope:
  - Botnets, Brute force, AI / ML
=========================================================
"""

import pyshark
import numpy as np
import time
import requests
import warnings
import sys

warnings.filterwarnings("ignore")

# ============================
# CONFIGURATION
# ============================
INTERFACE = "Wi-Fi"            # wlan0 on Raspberry Pi
WINDOW_DURATION = 3            # seconds
MAX_PACKETS_PER_WINDOW = 3000  # anti-lag cap
CLOUD_ENDPOINT = "http://localhost:8000/alert"

# Heuristic thresholds (calibrated)
RATE_TRIGGER = 60              # packets/sec
DST_IP_LIMIT = 5               # scan threshold
VARIANCE_LIMIT = 300           # stability threshold

print(f"\n=== FINAL PHASE-1 IDS ONLINE ({INTERFACE}) ===")
print("Target: IoT Gateway | Attacks: DDoS & Scanning")

# ============================
# CAPTURE INIT
# ============================
try:
    capture = pyshark.LiveCapture(interface=INTERFACE)
except Exception as e:
    print(f"❌ Interface error: {e}")
    sys.exit(1)

# ============================
# MAIN LOOP
# ============================
while True:
    start_time = time.time()

    pkt_sizes = []
    src_ips = set()
    dst_ips = set()

    saturation_limit_hit = False

    # ----------------------------
    # PACKET CAPTURE
    # ----------------------------
    try:
        for packet in capture.sniff_continuously():
            if time.time() - start_time >= WINDOW_DURATION:
                break

            if len(pkt_sizes) >= MAX_PACKETS_PER_WINDOW:
                saturation_limit_hit = True
                break

            try:
                pkt_len = int(packet.length)
                pkt_sizes.append(pkt_len)

                if hasattr(packet, "ip"):
                    src_ips.add(packet.ip.src)
                    dst_ips.add(packet.ip.dst)
            except:
                continue
    except:
        continue

    pkt_count = len(pkt_sizes)
    if pkt_count < 10:
        continue

    duration = max(time.time() - start_time, 0.1)
    pkt_rate = pkt_count / duration
    mean_size = np.mean(pkt_sizes)
    std_size = np.std(pkt_sizes)

    alert_label = "Normal"
    reason = ""
    confidence = "Low"

    # ============================
    # RULE 1: PHYSICAL SATURATION
    # ============================
    if saturation_limit_hit:
        alert_label = "Volumetric_DoS"
        reason = "Packet processing saturation"
        confidence = "Critical"

    # ============================
    # RULE 2: NETWORK SCANNING
    # ============================
    elif len(dst_ips) > DST_IP_LIMIT and mean_size < 350:
        alert_label = "Network_Scanning"
        reason = f"Destination spread ({len(dst_ips)} IPs)"
        confidence = "High"

    # ============================
    # RULE 3: HIGH-SPEED ANALYSIS
    # ============================
    elif pkt_rate > RATE_TRIGGER:

        # --- Benign High Usage Guard ---
        benign_high_load = (
            mean_size > 400 and
            std_size > VARIANCE_LIMIT and
            len(src_ips) <= 2
        )

        if benign_high_load:
            print(f"✅ Normal High Usage | "
                  f"Rate={pkt_rate:.0f}/s | StdDev={std_size:.0f}")
            continue

        # --- Flooding Detection ---
        if mean_size < 250:
            alert_label = "High_Speed_DoS"
            reason = "High rate + small packets"
            confidence = "High"

        elif std_size < VARIANCE_LIMIT and len(src_ips) > 1:
            alert_label = "Anomalous_Flooding"
            reason = "Low-variance high-speed traffic"
            confidence = "Medium"

    # ============================
    # REPORTING
    # ============================
    if alert_label != "Normal":
        print(f"🚨 ALERT: {alert_label}")
        print(f"   Reason: {reason}")
        print(f"   Stats: Rate={pkt_rate:.0f}/s | "
              f"Size={mean_size:.0f}B | Var={std_size:.0f}")

        try:
            requests.post(
                CLOUD_ENDPOINT,
                json={
                    "attack": alert_label,
                    "confidence": confidence,
                    "packet_rate": round(pkt_rate, 2),
                    "mean_packet_size": round(mean_size, 2),
                    "variance": round(std_size, 2),
                    "src_ips": len(src_ips),
                    "dst_ips": len(dst_ips),
                    "timestamp": time.ctime()
                },
                timeout=0.1
            )
        except:
            pass
    else:
        print(f"✅ Monitoring... ({pkt_rate:.1f} pkts/s)")
