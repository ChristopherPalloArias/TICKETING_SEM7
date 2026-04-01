package com.tickets.events.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Cliente HTTP para llamar a ms-ticketing y obtener métricas de tickets/reservas.
 */
@Component
@Slf4j
public class TicketingClient {

    private final RestTemplate restTemplate;
    private final String ticketingBaseUrl;

    public TicketingClient(RestTemplate restTemplate,
                           @Value("${services.ticketing.url:http://localhost:8082}") String ticketingBaseUrl) {
        this.restTemplate = restTemplate;
        this.ticketingBaseUrl = ticketingBaseUrl;
    }

    /**
     * Obtiene el resumen total de tickets vendidos y reservas activas.
     * @return mapa con keys: totalTicketsSold (long), activeReservations (long)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Long> getAdminSummary() {
        try {
            String url = ticketingBaseUrl + "/api/v1/tickets/admin/stats";
            Map<String, Long> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                return Map.of("totalTicketsSold", 0L, "activeReservations", 0L);
            }
            return response;
        } catch (Exception e) {
            log.warn("Could not fetch ticket admin summary from ms-ticketing: {}", e.getMessage());
            return Map.of("totalTicketsSold", 0L, "activeReservations", 0L);
        }
    }
}
