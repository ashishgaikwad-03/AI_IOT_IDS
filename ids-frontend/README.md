# AI Multi-Layer Intrusion Detection System — IDS Dashboard

A real-time SOC-style web dashboard for monitoring simulated IoT network intrusion detection. Built with Spring Boot WebSockets (backend) and React + Tailwind CSS (frontend).

---

## Architecture

```
[Raspberry Pi Edge Nodes] → SimulationService (Spring Boot, port 8080)
        → STOMP WebSocket /topic/telemetry
                → React Dashboard (Vite dev server, port 5173)
                        → ThreatGauge | ThroughputChart | PacketTable | TopologyMap
```

---

## Prerequisites

| Tool     | Version  | Check                  |
|----------|----------|------------------------|
| Java JDK | 17+      | `java -version`        |
| Maven    | 3.8+     | `mvn -version`         |
| Node.js  | 18+      | `node -version`        |
| npm      | 9+       | `npm -version`         |

---

## Quick Start

### 1 — Start the Backend (Spring Boot)

```powershell
cd ids-dashboard\ids-backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**.  
WebSocket endpoint: `ws://localhost:8080/ws`  
STOMP topic: `/topic/telemetry`  
Health check: http://localhost:8080/api/health

### 2 — Start the Frontend (React + Vite)

Open a **second** terminal:

```powershell
cd ids-dashboard\ids-frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
ids-dashboard/
├── ids-backend/
│   ├── pom.xml
│   └── src/main/java/com/ids/
│       ├── IdsBackendApplication.java      # Entry point, @EnableScheduling
│       ├── config/WebSocketConfig.java     # STOMP + SockJS broker config
│       ├── model/TelemetryPayload.java     # JSON DTO (all telemetry fields)
│       ├── service/SimulationService.java  # Scheduled broadcast @ 600ms
│       └── controller/TelemetryController.java  # REST /api/health
│
└── ids-frontend/
    ├── package.json
    ├── vite.config.js                      # Dev proxy → :8080
    ├── tailwind.config.js                  # SOC dark theme tokens
    └── src/
        ├── App.jsx                         # Root: header + tab navigation
        ├── index.css                       # Global SOC theme styles
        ├── hooks/useWebSocket.js           # STOMP client + state management
        └── components/
            ├── Dashboard.jsx               # Grid layout coordinator
            ├── ThreatGauge.jsx             # SVG arc gauge (0–100)
            ├── ThroughputChart.jsx         # Recharts dual-axis line chart
            ├── PacketTable.jsx             # Auto-scrolling packet log
            ├── TopologyMap.jsx             # SVG network topology + attack flash
            └── ModelAnalysis.jsx           # Static BoT-IoT model metrics view
```

---

## WebSocket Data Flow

```
SimulationService.broadcastTelemetry() [@Scheduled 600ms]
  └─► messagingTemplate.convertAndSend("/topic/telemetry", TelemetryPayload)
        └─► STOMP broker (in-memory)
              └─► All subscribed SockJS clients
                    └─► useWebSocket.js processPacket()
                          ├─► setPackets()          → PacketTable re-renders
                          ├─► setThroughputHistory() → ThroughputChart re-renders
                          ├─► setThreatIndex()       → ThreatGauge re-renders
                          └─► setLatestPacket()      → TopologyMap attack flash
```

---

## API Endpoints

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| GET    | `/api/health`         | Backend health + WebSocket info |
| GET    | `/api/simulation/info`| Simulation config metadata      |
| WS     | `/ws` (SockJS)        | WebSocket handshake endpoint    |
| STOMP  | `/topic/telemetry`    | Telemetry broadcast topic       |

---

## Telemetry Payload Schema

```json
{
  "timestamp":       "2026-03-20T01:00:00.000",
  "sourceIp":        "192.168.1.101",
  "destIp":          "10.0.0.1",
  "protocol":        "UDP",
  "port":            1883,
  "packetSize":      142,
  "classification":  "BENIGN",
  "confidence":      0.97,
  "sourceNode":      "node-1",
  "sourceNodeLabel": "RPi Node 1",
  "severityScore":   8,
  "throughputMbps":  1.23,
  "pps":             68
}
```

**Classification values:** `BENIGN` | `DDOS` | `OS_FINGERPRINT` | `SERVICE_SCAN` | `DATA_EXFIL`

---

## Traffic Simulation Model

Based on BoT-IoT dataset traffic characteristics:

| Class          | Weight | Protocol | Packet Size | Severity  |
|----------------|--------|----------|-------------|-----------|
| BENIGN         | 65%    | TCP/UDP  | 50–250 B    | 5–19      |
| DDOS           | 15%    | UDP      | 900–1400 B  | 85–100    |
| OS_FINGERPRINT | ~7%    | ICMP     | 64–192 B    | 50–70     |
| SERVICE_SCAN   | ~7%    | TCP      | 54–154 B    | 40–59     |
| DATA_EXFIL     | ~6%    | TCP/443  | 800–1500 B  | 70–85     |

---

## Stopping the Services

```powershell
# Backend: Ctrl+C in the Maven terminal
# Frontend: Ctrl+C in the npm terminal
```

---

## Academic References

- Koroniotis, N., et al. (2019). *Towards the development of realistic botnet dataset in the Internet of Things for network forensic analytics: Bot-IoT dataset.* Future Generation Computer Systems, 100, 779–796.
- UNSW-Sydney Cyber Range, BoT-IoT Dataset: https://research.unsw.edu.au/projects/bot-iot-dataset
