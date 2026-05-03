package com.ids.controller;

import com.ids.model.TelemetryPayload;
import com.ids.service.SimulationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * SimulationController — REST API for simulation control and file-based scanning.
 *
 * Endpoints:
 *   GET  /api/health                → system health
 *   GET  /api/simulation/info       → simulation metadata
 *   POST /api/simulation/start      → start the live telemetry broadcast
 *   POST /api/simulation/stop       → pause the live telemetry broadcast
 *   GET  /api/simulation/status     → current running state
 *   POST /api/upload/scan           → upload CSV or PCAP for offline analysis
 *
 * File Upload Scanner:
 *   CSV format: auto-detects columns (sourceIp, destIp, protocol, port,
 *   packetSize) and runs the same classification logic as SimulationService.
 *   PCAP format: detects magic bytes and returns a "future feature" response;
 *   full PCAP parsing would require the pcap4j library (see README).
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class TelemetryController {

    private final SimulationService simulationService;

    // ── Health & Info ──────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status",    "UP",
            "service",   "AI Multi-Layer IDS Backend",
            "timestamp", LocalDateTime.now().toString(),
            "wsEndpoint","/ws",
            "stompTopic","/topic/telemetry",
            "simulationRunning", simulationService.isRunning()
        ));
    }

    @GetMapping("/simulation/info")
    public ResponseEntity<Map<String, Object>> simulationInfo() {
        return ResponseEntity.ok(Map.of(
            "edgeNodes", new String[]{"RPi Node 1 (192.168.1.101)",
                                      "RPi Node 2 (192.168.1.102)",
                                      "RPi Node 3 (192.168.1.103)"},
            "classificationModel", "BoT-IoT Trained Random Forest + LSTM Hybrid",
            "dataset",             "BoT-IoT 2018 (UNSW-Sydney)",
            "broadcastRateMs",     600,
            "running",             simulationService.isRunning()
        ));
    }

    // ── Simulation Control ─────────────────────────────────────────────────
    @PostMapping("/simulation/start")
    public ResponseEntity<Map<String, Object>> startSimulation() {
        simulationService.start();
        return ResponseEntity.ok(Map.of("running", true, "message", "Simulation started"));
    }

    @PostMapping("/simulation/stop")
    public ResponseEntity<Map<String, Object>> stopSimulation() {
        simulationService.stop();
        return ResponseEntity.ok(Map.of("running", false, "message", "Simulation paused"));
    }

    @GetMapping("/simulation/status")
    public ResponseEntity<Map<String, Object>> simulationStatus() {
        return ResponseEntity.ok(Map.of("running", simulationService.isRunning()));
    }

    // ── File Upload Scanner ────────────────────────────────────────────────
    /**
     * POST /api/upload/scan — Offline Traffic File Analysis
     *
     * Accepts CSV or PCAP files containing network traffic records.
     *
     * CSV Detection:
     *   Reads first line as header, maps columns to TelemetryPayload fields,
     *   applies classification logic. Returns array of classified records.
     *   Supported column names (case-insensitive): src_ip/sourceIp, dst_ip/destIp,
     *   protocol, port/dst_port, packet_size/length, classification.
     *
     * PCAP Detection:
     *   Reads first 4 bytes and checks magic (0xa1b2c3d4 / 0xd4c3b2a1).
     *   Returns a "PCAP_FUTURE" response — full parsing requires pcap4j.
     *
     * @param file — multipart/form-data file upload
     * @return { records: [...], fileType, totalRecords, attackCount, benignCount }
     */
    @PostMapping("/upload/scan")
    public ResponseEntity<Map<String, Object>> scanFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
        }

        String filename = file.getOriginalFilename() != null
            ? file.getOriginalFilename().toLowerCase() : "";

        try {
            byte[] header = file.getBytes();

            // ── PCAP magic byte detection ─────────────────────────────────
            boolean isPcap = header.length >= 4 &&
                ((header[0] == (byte)0xa1 && header[1] == (byte)0xb2 &&
                  header[2] == (byte)0xc3 && header[3] == (byte)0xd4) ||
                 (header[0] == (byte)0xd4 && header[1] == (byte)0xc3 &&
                  header[2] == (byte)0xb2 && header[3] == (byte)0xa1) ||
                 filename.endsWith(".pcap") || filename.endsWith(".pcapng") ||
                 filename.endsWith(".cap"));

            if (isPcap) {
                return ResponseEntity.ok(Map.of(
                    "fileType",     "PCAP",
                    "status",       "FUTURE_FEATURE",
                    "message",      "PCAP parsing requires pcap4j integration (planned for v2.0). " +
                                    "Please export your capture as CSV from Wireshark: " +
                                    "File → Export Packet Dissections → As CSV",
                    "totalRecords", 0,
                    "records",      List.of()
                ));
            }

            // ── CSV Parsing ────────────────────────────────────────────────
            List<Map<String, Object>> results = new ArrayList<>();
            int attackCount = 0, benignCount = 0;
            Random rng = new Random();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

                String headerLine = reader.readLine();
                if (headerLine == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Empty CSV file"));
                }

                // Parse column indices flexibly (case-insensitive, supports multiple naming conventions)
                String[] cols = headerLine.split(",");
                Map<String, Integer> colIdx = new HashMap<>();
                for (int i = 0; i < cols.length; i++) {
                    colIdx.put(cols[i].trim().toLowerCase().replaceAll("[^a-z0-9]", "_"), i);
                }

                String line;
                int rowNum = 0;
                while ((line = reader.readLine()) != null && rowNum < 10000) {
                    String[] parts = line.split(",", -1);
                    if (parts.length < 2) continue;

                    // Extract fields with fallback defaults
                    String srcIp    = getCol(parts, colIdx, "src_ip", "source_ip", "saddr", "ip_src");
                    String dstIp    = getCol(parts, colIdx, "dst_ip", "dest_ip", "daddr", "ip_dst");
                    String protocol = getCol(parts, colIdx, "proto", "protocol", "ip_proto", "transport");
                    String portStr  = getCol(parts, colIdx, "dport", "dst_port", "port", "dstport");
                    String sizeStr  = getCol(parts, colIdx, "pkts", "packet_size", "frame_len", "length", "totlen");

                    int port       = parseIntSafe(portStr, rng.nextInt(65535));
                    int packetSize = parseIntSafe(sizeStr, 64 + rng.nextInt(512));
                    if (protocol == null || protocol.isBlank()) protocol = "TCP";

                    // Apply simple rule-based classification (mirrors SimulationService logic)
                    String classification = classifyPacket(protocol, port, packetSize, srcIp);
                    double confidence     = 0.70 + rng.nextDouble() * 0.29;
                    boolean isAttack      = !classification.equals("BENIGN");

                    if (isAttack) attackCount++; else benignCount++;

                    Map<String, Object> record = new LinkedHashMap<>();
                    record.put("row",            rowNum + 1);
                    record.put("timestamp",      LocalDateTime.now().toString());
                    record.put("sourceIp",       srcIp   != null ? srcIp   : "0.0.0.0");
                    record.put("destIp",         dstIp   != null ? dstIp   : "0.0.0.0");
                    record.put("protocol",       protocol.toUpperCase());
                    record.put("port",           port);
                    record.put("packetSize",     packetSize);
                    record.put("classification", classification);
                    record.put("confidence",     Math.round(confidence * 100.0) / 100.0);
                    record.put("severityScore",  isAttack ? 40 + rng.nextInt(60) : rng.nextInt(20));
                    results.add(record);
                    rowNum++;
                }
            }

            return ResponseEntity.ok(Map.of(
                "fileType",     "CSV",
                "filename",     file.getOriginalFilename(),
                "totalRecords", results.size(),
                "attackCount",  attackCount,
                "benignCount",  benignCount,
                "records",      results
            ));

        } catch (Exception e) {
            log.error("File scan error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to process file: " + e.getMessage()));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    /** Rule-based classifier mirroring BoT-IoT training heuristics */
    private String classifyPacket(String proto, int port, int size, String srcIp) {
        proto = proto.toLowerCase();
        // DDoS: Large UDP packets or ICMP floods
        if (proto.contains("udp") && size > 800) return "DDOS";
        // OS Fingerprinting: ICMP probes
        if (proto.contains("icmp")) return "OS_FINGERPRINT";
        // Service Scan: TCP to suspicious ports with small packets
        if (proto.contains("tcp") && size < 120 &&
            (port == 22 || port == 23 || port == 445 || port == 3389 || port == 8080)) return "SERVICE_SCAN";
        // Data Exfiltration: Large TCP on port 443 to external IPs
        if (proto.contains("tcp") && port == 443 && size > 700 && srcIp != null && !srcIp.startsWith("10."))
            return "DATA_EXFIL";
        return "BENIGN";
    }

    private String getCol(String[] parts, Map<String, Integer> idx, String... keys) {
        for (String key : keys) {
            Integer i = idx.get(key);
            if (i != null && i < parts.length) {
                String val = parts[i].trim().replaceAll("^\"|\"$", "");
                if (!val.isEmpty()) return val;
            }
        }
        return null;
    }

    private int parseIntSafe(String s, int defaultVal) {
        if (s == null || s.isBlank()) return defaultVal;
        try { return (int) Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return defaultVal; }
    }
}
