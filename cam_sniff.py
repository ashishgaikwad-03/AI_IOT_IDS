from scapy.all import sniff, IP
import time
import csv

# --- CONFIGURATION ---
TARGET_IP = "192.168.166.167" # <-- ENTER YOUR ESP32-CAM IP HERE
WINDOW_SIZE = 2 
CSV_FILENAME = "real_normal_traffic.csv"

packet_count = 0
byte_count = 0
start_time = time.time()

# Create the CSV file and write the headers
with open(CSV_FILENAME, mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["total_packets", "total_bytes", "packet_rate", "byte_rate", "label"])

def process_packet(packet):
    global packet_count, byte_count, start_time

    if IP in packet:
        # Monitor traffic to and from the camera
        if packet[IP].src == TARGET_IP or packet[IP].dst == TARGET_IP:
            packet_count += 1
            byte_count += len(packet)

    current_time = time.time()
    if current_time - start_time >= WINDOW_SIZE:
        pkt_rate = packet_count / WINDOW_SIZE
        byte_rate = byte_count / WINDOW_SIZE
        
        # Save to CSV (Label 0 = Normal)
        with open(CSV_FILENAME, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([packet_count, byte_count, pkt_rate, byte_rate, 0])
            
        print(f"[*] Logged -> Rate: {pkt_rate:.2f} pkts/sec | {byte_rate:.2f} bytes/sec")
        
        # Reset counters
        packet_count = 0
        byte_count = 0
        start_time = current_time

print(f"[*] Gathering baseline traffic for {TARGET_IP}...")
print("[*] Let this run for at least 5 minutes while the camera is streaming.")
sniff(prn=process_packet, store=False)