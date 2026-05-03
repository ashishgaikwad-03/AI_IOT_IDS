package com.ids.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket Configuration — STOMP over SockJS
 *
 * This configuration establishes the WebSocket infrastructure:
 *
 * 1. Handshake Endpoint (/ws):
 *    The React frontend connects to ws://localhost:8080/ws using SockJS.
 *    SockJS provides a WebSocket-like API with HTTP long-polling fallback
 *    for environments where raw WebSocket is unavailable.
 *
 * 2. Simple Message Broker (/topic):
 *    Spring's in-memory STOMP broker routes messages prefixed with /topic
 *    to all subscribed clients. SimulationService publishes to
 *    /topic/telemetry; all connected dashboards receive the payload.
 *
 * 3. Application Destination Prefix (/app):
 *    Client→Server messages (not used in this architecture, but included
 *    for future bidirectional command support) are prefixed with /app
 *    and routed to @MessageMapping controller methods.
 *
 * Data Flow:
 *   SimulationService.broadcastTelemetry()
 *     → messagingTemplate.convertAndSend("/topic/telemetry", payload)
 *       → STOMP broker
 *         → all subscribed React dashboard clients
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Registers the /ws endpoint with SockJS fallback.
     * setAllowedOriginPatterns("*") is permissive for local dev;
     * tighten this to specific origins in production.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow React dev server (localhost:5173)
                .withSockJS();                  // SockJS fallback for broader browser support
    }

    /**
     * Configures the in-memory message broker:
     * - enableSimpleBroker("/topic") registers the /topic prefix for push subscriptions
     * - setApplicationDestinationPrefixes("/app") routes client→server messages
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");        // Server-to-client broadcast channel
        registry.setApplicationDestinationPrefixes("/app"); // Client-to-server prefix (future use)
    }
}
