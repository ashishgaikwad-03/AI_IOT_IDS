# 🛡️ AI-IoT Intrusion Detection System (IDS)

A high-performance, real-time Intrusion Detection System designed for IoT environments. This system uses an **XGBoost Machine Learning model** to classify network traffic and detect sophisticated cyber attacks in real-time.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![React](https://img.shields.io/badge/Frontend-React-61dafb.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)

## 🚀 Key Features
- **Real-Time Traffic Analysis**: Captures live Wi-Fi traffic via TShark/Npcap.
- **AI-Powered Detection**: Classified using an 11-class XGBoost model (99.7% F1-Score).
- **IoT-Focused**: Specifically tuned for ESP32 and other edge devices.
- **Interactive SOC Dashboard**: Premium dark-mode UI with live packet logs and throughput charts.
- **Multi-Channel Alerting**: Instant notifications via **Telegram Bot**, Windows Toasts, and System Sounds.
- **Attack Simulation**: Includes 5 automated scripts to demonstrate DDoS, MITM, and Brute Force attacks.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Lucide Icons.
- **Backend**: FastAPI (Python), WebSockets.
- **ML Model**: XGBoost (Trained on BoT-IoT and custom datasets).
- **Packet Capture**: TShark (Wireshark CLI).

## 📂 Project Structure
```text
├── ids-frontend/          # React Dashboard source code
├── ids-python-backend/    # FastAPI server & ML logic
├── demo_attacks/          # 5 Automated attack simulation scripts
├── models/                # Pre-trained XGBoost models (.joblib / .pkl)
├── START_DASHBOARD.bat    # One-click launcher for Windows
└── README.md              # This documentation
```

## ⚡ Quick Start (Windows)

### Prerequisites
1. **Python 3.9+** installed.
2. **Wireshark / TShark** installed.
3. **Npcap** (installed with Wireshark) for packet capture.

### Running the System
1. **Install Dependencies**:
   ```bash
   pip install -r ids-python-backend/requirements.txt
   cd ids-frontend && npm install
   ```
2. **Launch the Dashboard**:
   Simply double-click `START_DASHBOARD.bat`. 
   *The dashboard will open automatically at `http://localhost:8000`.*

## ⚔️ Attack Demonstration
To verify the system's detection capabilities, run the automated attack suite:
1. Open a new terminal.
2. Run the master launcher:
   ```bash
   demo_attacks\RUN_ALL_ATTACKS.bat
   ```
The system will detect:
- **DDoS SYN Flood** (Severity 88)
- **Mirai Botnet ACK Flood** (Severity 85)
- **MITM ARP Spoofing** (Severity 92)
- **Port Scanning** (Severity 55)
- **Telnet Brute Force** (Severity 82)

## 📬 Telegram Integration
To receive alerts on your phone:
1. Update `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `ids-python-backend/alerts.py`.
2. Ensure `TELEGRAM_ENABLED = True`.

## 📜 License
This project is licensed under the MIT License.
