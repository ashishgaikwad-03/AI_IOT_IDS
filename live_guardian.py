from scapy.all import sniff, IP
import time
import joblib
import pandas as pd
import requests

# --- CONFIGURATION ---
TARGET_IP = "192.168.166.167"  # <-- ENTER YOUR ESP32-CAM IP HERE
WINDOW_SIZE = 2 

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

def send_telegram_alert(pkt_rate):
    global last_alert_time
    current_time = time.time()
    
    if current_time - last_alert_time > ALERT_COOLDOWN:
        message = (
            "🚨 *CRITICAL SECURITY ALERT* 🚨\n\n"
            "🛡️ *Guardian AI Intervention*\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "🎯 *Target Node:* `IoT Edge (ESP32-CAM/DHT11)`\n"
            "🔍 *Signature:* `DoS / UDP Flood Detected`\n"
            f"📈 *Traffic Spike:* `{pkt_rate:.2f}` pkts/sec\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            "_Automated defense systems engaged. Review dashboard immediately._"
        )
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown"}
        
        try:
            requests.post(url, json=payload, timeout=2)
            print("📱 [ALERT] Sent Telegram Warning successfully!")
            last_alert_time = current_time
        except Exception as e:
            print(f"[-] Failed to send Telegram alert: {e}")

DASHBOARD_URL = "http://localhost:8000/api/esp32-traffic"

def send_to_dashboard(packet_count, byte_count, pkt_rate, byte_rate, prediction):
    payload = {
        "total_packets": float(packet_count),
        "total_bytes": float(byte_count),
        "packet_rate": float(pkt_rate),
        "byte_rate": float(byte_rate),
        "prediction": int(prediction)
    }
    try:
        requests.post(DASHBOARD_URL, json=payload, timeout=2)
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
        
        if prediction == 0:
            print("🟢 STATUS: SECURE (Normal IoT Traffic)")
        else:
            print("🔴 WARNING: INTRUSION DETECTED! (AI Signature Match)")
            send_telegram_alert(pkt_rate)
            
        send_to_dashboard(packet_count, byte_count, pkt_rate, byte_rate, prediction)
        
        # Reset counters
        packet_count = 0
        byte_count = 0
        start_time = current_time

print(f"[*] Starting AI Guardian targeting {TARGET_IP}...")
sniff(prn=process_packet, store=False)