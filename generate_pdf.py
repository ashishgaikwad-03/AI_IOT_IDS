from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(15, 52, 96)
        self.cell(0, 8, 'AI-IDS Dashboard Documentation', align='C')
        self.ln(10)
        self.set_draw_color(233, 69, 96)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

    def section_title(self, title):
        self.ln(4)
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(15, 52, 96)
        self.set_fill_color(233, 69, 96)
        self.rect(10, self.get_y(), 3, 8, 'F')
        self.cell(5)
        self.cell(0, 8, title)
        self.ln(10)

    def sub_title(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(22, 33, 62)
        self.cell(0, 7, title)
        self.ln(8)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(40, 40, 40)
        self.set_x(18)
        self.cell(4, 5.5, '-', ln=0)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def add_table(self, headers, data, col_widths=None):
        if col_widths is None:
            col_widths = [190 / len(headers)] * len(headers)
        # Header
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(22, 33, 62)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, 1, 0, 'C', True)
        self.ln()
        # Rows
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(40, 40, 40)
        fill = False
        for row in data:
            if self.get_y() > 260:
                self.add_page()
            if fill:
                self.set_fill_color(240, 244, 255)
            else:
                self.set_fill_color(255, 255, 255)
            max_h = 7
            for i, cell in enumerate(row):
                self.cell(col_widths[i], max_h, str(cell)[:50], 1, 0, 'L', True)
            self.ln()
            fill = not fill
        self.ln(3)

    def info_box(self, text, color=(209, 236, 241)):
        self.set_fill_color(*color)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(40, 40, 40)
        y = self.get_y()
        self.rect(10, y, 190, 12, 'F')
        self.set_draw_color(*[max(0, c - 60) for c in color])
        self.rect(10, y, 3, 12, 'F')
        self.set_xy(16, y + 2)
        self.multi_cell(180, 4, text)
        self.ln(4)

pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Title
pdf.set_font('Helvetica', 'B', 22)
pdf.set_text_color(15, 52, 96)
pdf.cell(0, 12, 'AI-Powered Intrusion Detection System', align='C')
pdf.ln(10)
pdf.set_font('Helvetica', '', 12)
pdf.set_text_color(100)
pdf.cell(0, 8, 'Complete Working Mechanism & Documentation', align='C')
pdf.ln(12)

pdf.info_box('Project: Multi-Layer IoT IDS with Real-Time Dashboard  |  Tech: Python (FastAPI + Scapy + XGBoost) + React.js  |  March 2026')
pdf.ln(2)

# Section 1
pdf.section_title('1. System Overview')
pdf.body_text('The AI-IDS Dashboard is a real-time network intrusion detection system that monitors all network traffic on the host machine, classifies each packet as either benign (normal) or malicious (attack), and displays the results on a live web dashboard. It combines Machine Learning models with heuristic pattern-matching rules to detect various types of cyber attacks as they happen.')
pdf.body_text('The system consists of 4 main components working together:')
pdf.bullet('Network Interface - Captures all IP packets flowing through the machine')
pdf.bullet('Python Backend (FastAPI) - Analyses packets using ML + heuristics in real-time')
pdf.bullet('WebSocket - Streams classification results instantly to the browser')
pdf.bullet('React Dashboard - Displays live traffic, charts, alerts & threat levels')

# Section 2
pdf.section_title('2. How It Works - Step by Step')

pdf.sub_title('Step 1: Packet Capture (Scapy)')
pdf.body_text('The backend uses Scapy AsyncSniffer to capture every IP packet that flows through the machine network interface. This runs in passive (read-only) mode - it only observes traffic, never modifies or injects packets. The sniffer requires Administrator privileges to access the raw network interface.')

pdf.sub_title('Step 2: Rolling Buffer & Feature Extraction')
pdf.body_text('Each captured packet is added to a rolling buffer of the last 30 packets. This buffer provides context - instead of looking at each packet in isolation, the system examines the recent traffic pattern. From this buffer, 6 key features are extracted:')

pdf.add_table(
    ['#', 'Feature', 'What It Measures', 'Why It Matters'],
    [
        ['1', 'packet_rate', 'Packets per second', 'Attacks generate much higher rates'],
        ['2', 'unique_dst_ips', 'Different destination IPs', 'Scans hit many IPs; normal goes to few'],
        ['3', 'unique_src_ips', 'Different source IPs', 'Botnets spoof many fake sources'],
        ['4', 'mean_pkt_size', 'Average packet size (bytes)', 'DoS=tiny packets; theft=large packets'],
        ['5', 'std_pkt_size', 'Variation in packet sizes', 'Attacks have uniform sizes'],
        ['6', 'protocol_count', 'Number of protocols used', 'Anomalies mix protocols unusually'],
    ],
    [12, 40, 65, 73]
)

pdf.sub_title('Step 3: Classification (Heuristic Rules + ML Model)')
pdf.body_text('The system uses a two-layer classification approach:')
pdf.body_text('Layer 1 - Heuristic Rules (Primary): These are pattern-matching rules specifically designed to detect known attack signatures. They check combinations of the 6 features against known attack profiles. This is the primary detection mechanism because it provides instant, reliable results.')
pdf.body_text('Layer 2 - XGBoost ML Model (Secondary): An XGBoost classifier trained on the BoT-IoT dataset provides a secondary anomaly probability. If heuristic rules do not trigger but the ML model detects elevated anomaly probability combined with unusual traffic rates, it flags the traffic as suspicious.')

pdf.info_box('Why Both? The ML model alone is too conservative. The heuristic rules catch specific attack patterns. Together, they provide robust detection coverage.', (255, 243, 205))

pdf.sub_title('Step 4: Real-Time Broadcast (WebSocket)')
pdf.body_text('Every classified packet is instantly sent to all connected dashboard clients via WebSocket. The system broadcasts approximately 3 packets per second (throttled to prevent browser overload). Each broadcast includes: source IP, destination IP, protocol, port, packet size, classification label, confidence score, and severity rating.')

pdf.sub_title('Step 5: Dashboard Visualization (React)')
pdf.body_text('The React frontend receives each packet and updates all dashboard components in real-time: Stats Bar (running counts), Threat Severity Index (0-100 gauge), Network Throughput Chart (live graph), Attack Intelligence Panel (attack breakdown), and Live Packet Log (scrolling classified packets).')

# Section 3
pdf.section_title('3. Attack Types & Detection Methods')
pdf.body_text('The IDS can detect and classify the following attack types. Each has a specific traffic pattern that the system recognizes:')

# Attack 1: DoS
pdf.sub_title('3.1  DoS - SYN Flood Attack')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Flood of TCP SYN packets without completing handshake'],
        ['Attack Script', 'trigger_dos.py'],
        ['Traffic Pattern', 'Very high rate (>60 pps), tiny packets (~40B), TCP SYN flag'],
        ['How IDS Detects', 'SYN count > 10 AND packet rate > 20 pps in buffer'],
        ['Dashboard Label', 'DoS-SYN or DoS-TCP'],
        ['Severity', '85-90 / 100'],
    ],
    [40, 150]
)

# Attack 2: OS Scan
pdf.sub_title('3.2  OS / IP Sweep Scan')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Scans range of IPs to discover alive hosts using ICMP ping'],
        ['Attack Script', 'trigger_scan.py'],
        ['Traffic Pattern', 'ICMP to many dest IPs (192.168.1.x), ~10 pps, ~42B pkts'],
        ['How IDS Detects', 'ICMP pkts > 30% of buffer AND unique dest IPs > 4'],
        ['Dashboard Label', 'OS SCAN'],
        ['Severity', '60-65 / 100'],
    ],
    [40, 150]
)

# Attack 3: Botnet
pdf.sub_title('3.3  DDoS - Botnet Attack')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Multiple spoofed sources attack single target simultaneously'],
        ['Attack Script', 'trigger_botnet.py'],
        ['Traffic Pattern', 'Many source IPs (10.0.0.x), large pkts (~540B), 1 dest'],
        ['How IDS Detects', 'Unique source IPs > 8 AND mean pkt size > 300 bytes'],
        ['Dashboard Label', 'DDoS-BOTNET'],
        ['Severity', '92 / 100'],
    ],
    [40, 150]
)

# Attack 4: Flood
pdf.sub_title('3.4  DDoS - UDP/TCP Flood')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Volumetric attack flooding target with massive traffic'],
        ['Traffic Pattern', 'Extremely high rate, one protocol dominant, spoofed srcs'],
        ['How IDS Detects', 'UDP > 70% of buffer AND rate > 50, OR srcs > 5 AND rate > 25'],
        ['Dashboard Label', 'DDoS-UDP or DDoS-FLOOD'],
        ['Severity', '82-85 / 100'],
    ],
    [40, 150]
)

# Attack 5: Svc Scan
pdf.sub_title('3.5  Service Scan (Port Scan)')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Probes many ports on target to find open services (like nmap)'],
        ['Attack Script', 'trigger_svc_scan.py'],
        ['Traffic Pattern', 'TCP SYN to many different ports, moderate rate, 1 source'],
        ['How IDS Detects', 'High SYN count + moderate packet rate = probing pattern'],
        ['Dashboard Label', 'SVC SCAN'],
        ['Severity', '52-55 / 100'],
    ],
    [40, 150]
)

# Attack 6: Theft
pdf.sub_title('3.6  Data Exfiltration / Theft')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Stolen data sent to external server controlled by attacker'],
        ['Attack Script', 'trigger_theft.py'],
        ['Traffic Pattern', 'Large pkts (~1200B), high rate, single external dest, TCP 443'],
        ['How IDS Detects', 'High rate + large mean pkt size + single destination'],
        ['Dashboard Label', 'DATA EXFIL'],
        ['Severity', '95 / 100'],
    ],
    [40, 150]
)

# Attack 7: L2 Anomaly
pdf.sub_title('3.7  L2 Anomaly (Mixed Protocol Attack)')
pdf.add_table(
    ['Property', 'Details'],
    [
        ['What It Is', 'Abnormal traffic mixing protocols at high rate'],
        ['Attack Script', 'trigger_l2_anomaly.py'],
        ['Traffic Pattern', 'Mix of TCP+UDP+ICMP, ~125 pps, small packets'],
        ['How IDS Detects', 'Rate > 80 pps + mean size < 200B, or ML anomaly > 15%'],
        ['Dashboard Label', 'L2 ANOMALY'],
        ['Severity', '65-72 / 100'],
    ],
    [40, 150]
)

# Section 4
pdf.section_title('4. Machine Learning Models')
pdf.add_table(
    ['Model', 'File', 'Purpose'],
    [
        ['XGBoost Multi-Class', 'bot_iot_xgb_multiclass.joblib', 'Classifies into DDoS/DoS/Scan/Theft/Normal'],
        ['Label Encoder', 'label_encoder.joblib', 'Maps numeric predictions to labels'],
        ['Layer2 Anomaly', 'layer2_anomaly_model.joblib', 'Binary anomaly detection on 6 features'],
    ],
    [45, 75, 70]
)

pdf.body_text('Layer2 Model Feature Importance:')
pdf.body_text('unique_dst_ips: 31.9% | protocol_count: 23.8% | packet_rate: 19.7% | mean_pkt_size: 15.0% | std_pkt_size: 8.5% | unique_src_ips: 1.1%')

# Section 5
pdf.section_title('5. Technology Stack')
pdf.sub_title('Backend')
pdf.bullet('Python 3.11 - Core programming language')
pdf.bullet('FastAPI - Async web framework for REST API and WebSocket')
pdf.bullet('Scapy - Low-level packet capture library (raw network interface)')
pdf.bullet('XGBoost - Gradient-boosted decision tree ML model')
pdf.bullet('Pandas / NumPy - Data processing and feature extraction')
pdf.bullet('Uvicorn - ASGI server running the FastAPI application')
pdf.ln(2)
pdf.sub_title('Frontend')
pdf.bullet('React.js - Component-based UI framework')
pdf.bullet('Recharts - Charting library for live throughput graphs')
pdf.bullet('WebSocket API - Browser-native real-time communication')
pdf.bullet('Vite - Build tool for development and production')
pdf.bullet('CSS - Custom dark-themed SOC design')

# Section 6
pdf.section_title('6. Demo Guide - Running Attack Scripts')
pdf.info_box('IMPORTANT: All attack scripts must be run in a separate terminal as Administrator.', (248, 215, 218))
pdf.ln(2)

pdf.add_table(
    ['Attack', 'Command', 'Dashboard Shows'],
    [
        ['DoS SYN Flood', 'python trigger_dos.py', 'Red DoS-SYN, severity 85-90'],
        ['IP Sweep Scan', 'python trigger_scan.py', 'Yellow OS SCAN, many dest IPs'],
        ['Botnet DDoS', 'python trigger_botnet.py', 'Red DDoS-BOTNET, many src IPs'],
        ['Service Scan', 'python trigger_svc_scan.py', 'SVC SCAN / DoS-SYN entries'],
        ['Data Theft', 'python trigger_theft.py', 'DATA EXFIL, large packets'],
        ['L2 Anomaly', 'python trigger_l2_anomaly.py', 'L2 ANOMALY, mixed protocols'],
    ],
    [35, 75, 80]
)

pdf.body_text('Recommended Demo Flow:')
pdf.bullet('1. Open dashboard - show normal benign traffic flowing (green entries)')
pdf.bullet('2. Run trigger_dos.py - dashboard immediately shows red DoS alerts')
pdf.bullet('3. Stop attack (Ctrl+C) - traffic returns to benign within seconds')
pdf.bullet('4. Run trigger_scan.py - show OS SCAN with multiple destination IPs')
pdf.bullet('5. Run trigger_botnet.py - show DDoS-BOTNET with spoofed source IPs')
pdf.bullet('6. Explain Attack Intelligence panel tracking all detected attacks')

# Section 7
pdf.section_title('7. Key Design Decisions')
pdf.bullet('Continuous Per-Packet Analysis: Each packet processed individually with rolling context buffer. No batching delays.')
pdf.bullet('Heuristic-First Approach: Rules provide immediate detection for known patterns. ML model is backup for novel anomalies.')
pdf.bullet('Single-Port Deployment: Backend + frontend served from port 8000. Only one tunnel needed for public access.')
pdf.bullet('Auto-Detecting URLs: Frontend detects localhost vs tunnel automatically. No manual configuration needed.')
pdf.bullet('Passive Monitoring: System only reads traffic (read-only). Never sends, modifies, or blocks any packets.')

# Save
output_path = r'C:\Users\ashis\.gemini\antigravity\scratch\ids-dashboard\IDS_Dashboard_Documentation.pdf'
pdf.output(output_path)
print(f"PDF saved to: {output_path}")
