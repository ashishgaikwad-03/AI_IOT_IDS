package com.ids.service;

import com.ids.model.TelemetryPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * SimulationService — IoT Network Traffic Simulation Engine
 *
 * This service acts as the core telemetry producer of the IDS system.
 * It simulates traffic patterns from 3 Raspberry Pi edge nodes communicating
 * with a central IoT gateway / IDS server.
 *
 * Simulation Model (based on BoT-IoT dataset traffic characteristics):
 * ┌──────────────────────────────────────────────────────┐
 * │  Traffic Distribution (weighted random):             │
 * │    65% BENIGN       — Normal sensor telemetry        │
 * │    15% DDOS         — UDP/TCP flood packets           │
 * │    10% OS_FINGERPRINT— ICMP-based OS discovery        │
 * │    5%  SERVICE_SCAN  — TCP port scanning              │
 * │    5%  DATA_EXFIL    — Unauthorized data transfer     │
 * └──────────────────────────────────────────────────────┘
 *
 * The broadcastTelemetry() method is called every 600ms by Spring's scheduler.
 * Each invocation constructs a TelemetryPayload and pushes it to all
 * subscribed React dashboard clients via SimpMessagingTemplate on
 * the /topic/telemetry STOMP channel.
 *
 * Throughput Calculation:
 *   throughputMbps = (packetSize * pps * 8) / 1_000_000
 *   where pps varies by traffic type (attacks generate higher packet rates)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SimulationService {

    private final SimpMessagingTemplate messagingTemplate;

    private final Random random = new Random();
    private final AtomicInteger packetCounter = new AtomicInteger(0);
    private final AtomicLong byteCounter = new AtomicLong(0);

    /**
     * Controls whether the @Scheduled broadcast is active.
     * Toggled via REST endpoints: POST /api/simulation/start|stop
     */
    private final AtomicBoolean running = new AtomicBoolean(true);

    public void start() { running.set(true);  log.info("Simulation STARTED"); }
    public void stop()  { running.set(false); log.info("Simulation STOPPED"); }
    public boolean isRunning() { return running.get(); }

    // ── Edge Node Registry ───────────────────────────────────────────────────
    /** Three simulated Raspberry Pi edge nodes on the local IoT subnet */
    private static final List<String[]> EDGE_NODES = List.of(
        new String[]{"node-1", "RPi Node 1", "192.168.1.101"},
        new String[]{"node-2", "RPi Node 2", "192.168.1.102"},
        new String[]{"node-3", "RPi Node 3", "192.168.1.103"}
    );

    // ── IDS Server and attack target IPs ────────────────────────────────────
    private static final String IDS_SERVER_IP = "10.0.0.1";
    private static final String EXTERNAL_C2_IP = "203.0.113.42"; // IANA documentation range

    // ── Classification Labels ────────────────────────────────────────────────
    private static final String[] CLASSIFICATIONS = {
        "BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", // 65%
        "DDOS", "DDOS",               // 15% (weighted x2 in 13-item array → ~15%)
        "OS_FINGERPRINT",              // ~8%
        "SERVICE_SCAN",                // ~8%
        "DATA_EXFIL"                   // ~8%
    };

    // ── Protocol + Port Mappings ──────────────────────────────────────────────
    private static final int[] BENIGN_PORTS  = {1883, 8883, 5683, 80, 443};  // MQTT, CoAP, HTTP
    private static final int[] ATTACK_PORTS  = {22, 23, 80, 443, 3389, 8080, 53, 445};

    /**
     * Primary telemetry broadcast method — executed every 600ms.
     *
     * Steps:
     * 1. Randomly select an edge node from the registry
     * 2. Randomly select a classification using the weighted array
     * 3. Build protocol/port/size parameters appropriate to the traffic type
     * 4. Compute derived metrics (throughput, pps, severity)
     * 5. Serialize and publish to /topic/telemetry
     *
     * Error handling: Any exception is caught and logged to prevent
     * the scheduler from permanently stopping on transient failures.
     */
    @Scheduled(fixedRate = 600)
    public void broadcastTelemetry() {
        if (!running.get()) return; // Paused — skip broadcast
        try {
            // 1. Select random edge node
            String[] node = EDGE_NODES.get(random.nextInt(EDGE_NODES.size()));
            String nodeId    = node[0];
            String nodeLabel = node[1];
            String sourceIp  = node[2];

            // 2. Select classification (weighted)
            String classification = CLASSIFICATIONS[random.nextInt(CLASSIFICATIONS.length)];
            boolean isAttack = !classification.equals("BENIGN");

            // 3. Build traffic parameters based on classification
            TrafficParams params = buildTrafficParams(classification, sourceIp);

            // 4. Compute derived metrics
            int pps = isAttack
                ? 800 + random.nextInt(1200)
                :  20 + random.nextInt(80);

            double throughputMbps = Math.round(
                ((double) params.packetSize * pps * 8.0 / 1_000_000.0) * 100.0
            ) / 100.0;

            int severityScore = computeSeverityScore(classification, params.confidence);

            // 5. Build and publish payload
            TelemetryPayload payload = TelemetryPayload.builder()
                .timestamp(LocalDateTime.now())
                .sourceIp(sourceIp)
                .destIp(isAttack ? EXTERNAL_C2_IP : IDS_SERVER_IP)
                .protocol(params.protocol)
                .port(params.port)
                .packetSize(params.packetSize)
                .classification(classification)
                .confidence(params.confidence)
                .sourceNode(nodeId)
                .sourceNodeLabel(nodeLabel)
                .severityScore(severityScore)
                .throughputMbps(throughputMbps)
                .pps(pps)
                .build();

            messagingTemplate.convertAndSend("/topic/telemetry", payload);

            if (packetCounter.incrementAndGet() % 50 == 0) {
                log.info("Broadcast #{}: {} from {} [{}]",
                    packetCounter.get(), classification, nodeLabel, sourceIp);
            }

        } catch (Exception e) {
            log.error("Telemetry broadcast failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Builds protocol-appropriate traffic parameters for each classification type.
     * Models realistic BoT-IoT dataset characteristics:
     *  - DDoS: Large UDP packets at high rate (volumetric flood)
     *  - OS Fingerprint: Small ICMP probes
     *  - Service Scan: TCP SYN packets to random ports
     *  - Data Exfil: Large TCP packets on standard ports
     *  - Benign: Small MQTT/CoAP telemetry payloads
     */
    private TrafficParams buildTrafficParams(String classification, String sourceIp) {
        return switch (classification) {
            case "DDOS" -> TrafficParams.of(
                "UDP",
                random.nextBoolean() ? 53 : 80,
                900 + random.nextInt(500),         // Large packets: 900–1400 bytes
                0.88 + random.nextDouble() * 0.12   // High confidence: 88–100%
            );

            case "OS_FINGERPRINT" -> TrafficParams.of(
                "ICMP",
                0,                                  // ICMP has no port concept
                64 + random.nextInt(128),           // Small probe: 64–192 bytes
                0.72 + random.nextDouble() * 0.20   // Medium confidence: 72–92%
            );

            case "SERVICE_SCAN" -> TrafficParams.of(
                "TCP",
                ATTACK_PORTS[random.nextInt(ATTACK_PORTS.length)],
                54 + random.nextInt(100),           // SYN probe size: 54–154 bytes
                0.78 + random.nextDouble() * 0.18   // Confidence: 78–96%
            );

            case "DATA_EXFIL" -> TrafficParams.of(
                "TCP",
                443,                                // HTTPS masquerade
                800 + random.nextInt(700),          // Large payload: 800–1500 bytes
                0.81 + random.nextDouble() * 0.15   // Confidence: 81–96%
            );

            default -> // BENIGN
                TrafficParams.of(
                    random.nextBoolean() ? "TCP" : "UDP",
                    BENIGN_PORTS[random.nextInt(BENIGN_PORTS.length)],
                    50 + random.nextInt(200),       // Small sensor payload: 50–250 bytes
                    0.92 + random.nextDouble() * 0.08 // High benign confidence: 92–100%
                );
        };
    }

    /**
     * Maps classification type and confidence to a 0–100 severity score.
     * This score feeds the real-time ThreatGauge component on the dashboard.
     *
     * Severity tiers:
     *   0–20   : Safe   (green)
     *   21–50  : Low    (yellow)
     *   51–75  : Medium (orange)
     *   76–100 : High   (red)
     */
    private int computeSeverityScore(String classification, double confidence) {
        int base = switch (classification) {
            case "DDOS"          -> 85 + random.nextInt(16);   // 85–100
            case "DATA_EXFIL"    -> 70 + random.nextInt(16);   // 70–85
            case "OS_FINGERPRINT"-> 50 + random.nextInt(21);   // 50–70
            case "SERVICE_SCAN"  -> 40 + random.nextInt(20);   // 40–59
            default              ->  5 + random.nextInt(15);   // 5–19 (benign)
        };
        // Scale by confidence to reward high-certainty detections
        return (int) Math.min(100, base * confidence);
    }

    // ── Inner helper record ───────────────────────────────────────────────────
    /** Immutable container for traffic simulation parameters */
    private record TrafficParams(String protocol, int port, int packetSize, double confidence) {
        static TrafficParams of(String protocol, int port, int packetSize, double confidence) {
            return new TrafficParams(protocol, port, packetSize, confidence);
        }
    }
}
