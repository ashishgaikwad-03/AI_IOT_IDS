package com.ids;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * IDS Backend — AI Multi-Layer Intrusion Detection System
 *
 * Entry point for the Spring Boot application.
 * @EnableScheduling activates the @Scheduled annotation used in SimulationService
 * to broadcast telemetry payloads at a fixed rate via WebSocket.
 *
 * Architecture Overview:
 *   SimulationService (producer) → SimpMessagingTemplate → /topic/telemetry (STOMP)
 *   → React frontend (consumer via SockJS + STOMP client)
 */
@SpringBootApplication
@EnableScheduling
public class IdsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdsBackendApplication.class, args);
    }
}
