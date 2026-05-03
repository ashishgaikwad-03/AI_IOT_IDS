package com.ids.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * TelemetryPayload — Data Transfer Object for IoT Network Telemetry
 *
 * This DTO represents a single captured/simulated network packet event.
 * It is serialized to JSON by Jackson and broadcast via STOMP WebSocket
 * to all subscribed React dashboard clients.
 *
 * Classification Taxonomy (based on BoT-IoT dataset categories):
 *   - BENIGN       : Normal IoT device communication (sensor readings, telemetry)
 *   - DDOS         : Distributed Denial of Service flood attack
 *   - OS_FINGERPRINT : Active OS discovery / network reconnaissance (Nmap-style)
 *   - SERVICE_SCAN  : Port scanning to enumerate open services
 *   - DATA_EXFIL    : Unauthorized outbound data transfer
 *
 * The 'sourceNode' field maps the packet to a specific simulated Raspberry Pi
 * edge node so the frontend TopologyMap can highlight the affected node.
 *
 * The 'confidence' field represents the ML model's classification certainty
 * (0.0 = uncertain, 1.0 = highly confident) used for UI color-coding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryPayload {

    /** ISO-8601 timestamp of packet capture event */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime timestamp;

    /** Source IP address (simulated IoT edge node IP) */
    private String sourceIp;

    /** Destination IP address (typically the IDS server or C&C server for attacks) */
    private String destIp;

    /** Network protocol: TCP, UDP, ICMP */
    private String protocol;

    /** Destination port number (e.g., 80=HTTP, 443=HTTPS, 22=SSH, random for scans) */
    private int port;

    /** Packet payload size in bytes */
    private int packetSize;

    /**
     * AI Classification result — one of: BENIGN, DDOS, OS_FINGERPRINT, SERVICE_SCAN, DATA_EXFIL
     * Determined by the simulated ML model in SimulationService
     */
    private String classification;

    /**
     * ML model confidence score (0.00 – 1.00).
     * Displayed as a percentage bar in the frontend PacketTable component.
     */
    private double confidence;

    /**
     * Identifier of the originating edge IoT node.
     * Values: "node-1", "node-2", "node-3" (representing 3 Raspberry Pi devices).
     * Used by the TopologyMap component to flash the correct node red on attacks.
     */
    private String sourceNode;

    /**
     * Derived threat severity score (0–100) for this specific packet.
     * Benign = 0, DDoS = 90-100, Scans = 40-70, Data Exfil = 70-85.
     * Aggregated by the frontend to compute the real-time threat index gauge.
     */
    private int severityScore;

    /** Human-readable label of the originating edge node (e.g., "RPi Node 1") */
    private String sourceNodeLabel;

    /** Bytes per second throughput computed for this packet's time window */
    private double throughputMbps;

    /** Packets per second rate at the time of capture */
    private int pps;
}
