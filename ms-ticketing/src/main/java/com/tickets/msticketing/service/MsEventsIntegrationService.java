package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.EventDetailResponse;
import com.tickets.msticketing.dto.TierResponse;
import com.tickets.msticketing.exception.EventNotPublishedException;
import com.tickets.msticketing.exception.InventoryServiceUnavailableException;
import com.tickets.msticketing.exception.TierQuotaExhaustedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;
import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@Slf4j
public class MsEventsIntegrationService {

    private final WebClient msEventsWebClient;
    private final String serviceAuthSecret;

    public MsEventsIntegrationService(WebClient msEventsWebClient,
                                      @Value("${service.auth.secret}") String serviceAuthSecret) {
        this.msEventsWebClient = msEventsWebClient;
        this.serviceAuthSecret = serviceAuthSecret;
    }

    public EventDetailResponse getEventDetail(UUID eventId) {
        String url = String.format("/api/v1/events/%s", eventId);

        try {
            EventDetailResponse body = msEventsWebClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(EventDetailResponse.class)
                .block();

            if (body == null) {
                throw new InventoryServiceUnavailableException("No response from events service for eventId=" + eventId);
            }

            return body;
        } catch (WebClientResponseException.NotFound ex) {
            log.warn("Event not found or not published: eventId={}", eventId);
            throw new EventNotPublishedException("Event '" + eventId + "' not found or not published");
        } catch (EventNotPublishedException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error fetching event detail for eventId={}: {}", eventId, ex.getMessage(), ex);
            throw new InventoryServiceUnavailableException("Events service unavailable");
        }
    }

    public TierResponse decrementTierQuota(UUID eventId, UUID tierId, UUID reservationId) {
        String url = String.format("/api/v1/events/%s/tiers/%s/quota", eventId, tierId);

        try {
            var response = msEventsWebClient.patch()
                .uri(url)
                .header("X-Service-Auth", serviceAuthSecret)
                .header("X-Idempotency-Key", reservationId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("decrementBy", 1))
                .retrieve()
                .toEntity(TierResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(200))
                    .filter(throwable -> throwable instanceof WebClientResponseException.ServiceUnavailable ||
                                       throwable instanceof WebClientResponseException.InternalServerError))
                .block();

            if (response == null) {
                log.error("No response received from ms-events service for event={}, tier={}", eventId, tierId);
                throw new InventoryServiceUnavailableException("No response from inventory service");
            }

            TierResponse body = response.getBody();
            if (body == null) {
                log.error("Empty body in response from ms-events service for event={}, tier={}", eventId, tierId);
                throw new InventoryServiceUnavailableException("Invalid response from inventory service");
            }

            return body;
        } catch (WebClientResponseException.Unauthorized ex) {
            log.error("Service auth rejected by ms-events for event={}, tier={}", eventId, tierId);
            throw new InventoryServiceUnavailableException("Inventory service rejected authentication");
        } catch (WebClientResponseException.Conflict ex) {
            log.warn("Tier quota exhausted for event={}, tier={}", eventId, tierId);
            throw new TierQuotaExhaustedException("Tier quota exhausted");
        } catch (WebClientResponseException.ServiceUnavailable | WebClientResponseException.BadGateway ex) {
            log.error("ms-events service unavailable: {}", ex.getMessage());
            throw new InventoryServiceUnavailableException("Inventory service unavailable, please retry");
        } catch (Exception ex) {
            log.error("Error decrementing tier quota: {}", ex.getMessage(), ex);
            throw new InventoryServiceUnavailableException("Inventory service unavailable, please retry");
        }
    }

    public void incrementTierQuota(UUID eventId, UUID tierId, UUID reservationId) {
        String url = String.format("/api/v1/events/%s/tiers/%s/quota/increment", eventId, tierId);

        try {
            msEventsWebClient.patch()
                .uri(url)
                .header("X-Service-Auth", serviceAuthSecret)
                .header("X-Idempotency-Key", reservationId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("incrementBy", 1))
                .retrieve()
                .toBodilessEntity()
                .block();

            log.info("Incremented tier quota for event={}, tier={}, reservation={}", eventId, tierId, reservationId);
        } catch (WebClientResponseException.Unauthorized ex) {
            log.error("Service auth rejected by ms-events on increment for event={}, tier={}", eventId, tierId);
            throw new InventoryServiceUnavailableException("Inventory service rejected authentication on increment");
        } catch (Exception ex) {
            log.error("Error incrementing tier quota for event={}, tier={}: {}", eventId, tierId, ex.getMessage(), ex);
            throw new InventoryServiceUnavailableException("Failed to return inventory for tier");
        }
    }
}

