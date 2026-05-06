from scapy.all import sniff, IP
import time
import joblib
import pandas as pd
import requests
import sys

# --- CONFIGURATION ---
# Accept ESP32 IP as command-line argument: python live_guardian.py 192.168.x.x
if len(sys.argv) > 1:
    TARGET_IP = sys.argv[1]
else:
    TARGET_IP = "192.168.166.167"  # Default fallback

WINDOW_SIZE = 2 
DASHBOARD_URL = "http://localhost:8000"

# --- TELEGRAM CONFIGURATION ---
BOT_TOKEN = "8697442024:AAFnMcIqebrFuDg-k8NCEN6FxNITV_VbZls"
CHAT_ID = "5120288258"

# Cooldown so we don't spam the Telegram API and get blocked
last_alert_time = 0  
ALERT_COOLDOWN = 10  # Wait 10 seconds between sending messages

print("[*] Loading Custom XGBoost AI Model...")
try:
    model = joblib.load('xgboost_custom_ids.pkl')
    print("[+] Guardian AI loaded successfully!")
except Exception as e:
    print("[-] Error loading model. Did you run train_custom_model.py?")
    exit()

# --- GLOBAL VARIABLES ---
packet_count = 0
byte_count = 0
start_time = time.time()

def check_camera_health():
    """Check if ESP32-CAM is still responding via HTTP."""
    try:
        resp = requests.get(f"http://{TARGET_IP}/", timeout=2)
        if resp.status_code == 200:
            return "STREAMING"
        else:
            return "DOWN"
    except requests.exceptions.Timeout:
        return "FROZEN"
    except requests.exceptions.ConnectionError:
        return "DOWN"
    except Exception:
        return "UNKNOWN"

def report_camera_status(status):
    """Report camera health to the dashboard backend."""
    try:
        requests.post(f"{DASHBOARD_URL}/api/esp32/camera-status", json={
            "status": status,
            "target_ip": TARGET_IP,
        }, timeout=2)
    except Exception:
        pass  # Dashboard might not be running yet

def send_telegram_alert(pkt_rate, cam_status="UNKNOWN"):
    global last_alert_time
    current_time = time.time()
    
    if current_time - last_alert_time > ALERT_COOLDOWN:
        now_str = time.strftime("%H:%M:%S")
        
        # Determine threat level
        if pkt_rate > 1500:
            threat = "CRITICAL"
        elif pkt_rate > 750:
            threat = "HIGH"
        else:
            threat = "MEDIUM"

        message = (
            "\U0001f6a8 *AI-IDS ALERT*\n\n"
            "\u26a0 Attack Detected\n"
            f"\U0001f3af Target Device: `ESP32-CAM ({TARGET_IP})`\n"
            f"\U0001f552 Time: `{now_str}`\n"
            f"\U0001f4ca Threat Level: *{threat}*\n"
            f"\U0001f4c8 Traffic Spike: `{pkt_rate:.0f} pkts/sec`\n"
            f"\U0001f4f7 Camera Status: `{cam_status}`\n\n"
            f"\U0001f517 Open Security Dashboard:\n"
            f"{DASHBOARD_URL}"
        )
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown", "disable_web_page_preview": True}
        
        try:
            requests.post(url, json=payload, timeout=2)
            print("[ALERT] Sent Telegram Warning successfully!")
            last_alert_time = current_time
        except Exception as e:
            print(f"[-] Failed to send Telegram alert: {e}")

def send_to_dashboard(packet_count, byte_count, pkt_rate, byte_rate, prediction):
    payload = {
        "total_packets": float(packet_count),
        "total_bytes": float(byte_count),
        "packet_rate": float(pkt_rate),
        "byte_rate": float(byte_rate),
        "prediction": int(prediction)
    }
    try:
        requests.post(f"{DASHBOARD_URL}/api/esp32-traffic", json=payload, timeout=2)
    except Exception as e:
        print(f"[-] Failed to forward to dashboard: {e}")

def process_packet(packet):
    global packet_count, byte_count, start_time

    if IP in packet:
        if packet[IP].src == TARGET_IP or packet[IP].dst == TARGET_IP:
            packet_count += 1
            byte_count += len(packet)

    current_time = time.time()
    if current_time - start_time >= WINDOW_SIZE:
        pkt_rate = packet_count / WINDOW_SIZE
        byte_rate = byte_count / WINDOW_SIZE
        
        # Format the live data for the AI
        live_features = pd.DataFrame([[packet_count, byte_count, pkt_rate, byte_rate]], 
                                     columns=['total_packets', 'total_bytes', 'packet_rate', 'byte_rate'])
        
        # AI Prediction
        prediction = model.predict(live_features)[0]
        
        print(f"\n--- NETWORK TRAFFIC ---")
        print(f"Rate: {pkt_rate:.2f} pkts/sec | {byte_rate:.2f} bytes/sec")
        
        # Check camera health
        cam_status = check_camera_health()
        report_camera_status(cam_status)
        
        if prediction == 0:
            print(f"\U0001f7e2 STATUS: SECURE (Normal IoT Traffic) | Camera: {cam_status}")
        else:
            print(f"\U0001f534 WARNING: INTRUSION DETECTED! (AI Signature Match) | Camera: {cam_status}")
            send_telegram_alert(pkt_rate, cam_status)
            
        send_to_dashboard(packet_count, byte_count, pkt_rate, byte_rate, prediction)
        
        # Reset counters
        packet_count = 0
        byte_count = 0
        start_time = current_time

print(f"[*] Starting AI Guardian targeting {TARGET_IP}...")
print(f"[*] Dashboard: {DASHBOARD_URL}")
print(f"[*] Usage: python live_guardian.py <ESP32_IP>")
print(f"[*] Press Ctrl+C to stop\n")
sniff(prn=process_packet, store=False)