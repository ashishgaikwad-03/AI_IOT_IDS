import requests
import time
import random

# --- CONFIGURATION ---
API_URL = "http://localhost:8000/api/inject-attack"
ATTACK_TYPES = ["ddos", "dos", "scan", "botnet", "theft"]

print(f"📟 [DASHBOARD DEMO] Volumetric API Flood")
print(f"[*] This script bypasses the network and injects traffic DIRECTLY into the UI.")
print(f"[*] Perfect for showing the dashboard's reaction to high-speed attacks.")
time.sleep(2)

count = 0
try:
    while True:
        atk = random.choice(ATTACK_TYPES)
        # Hit the injection API as fast as possible
        try:
            requests.post(f"{API_URL}?attack_type={atk}&source_ip=10.0.0.{random.randint(2,254)}", timeout=0.1)
            count += 1
            if count % 10 == 0:
                print(f"⚡ Injected {count} attacks into Dashboard UI...", end='\r')
        except:
            print("\n[!] Connection to Dashboard lost. Is the backend running?")
            break
        
        # Small delay to prevent crashing the browser, but fast enough to look cool
        time.sleep(0.05) 

except KeyboardInterrupt:
    print(f"\n🛑 Demo stopped. Total injections: {count}")
