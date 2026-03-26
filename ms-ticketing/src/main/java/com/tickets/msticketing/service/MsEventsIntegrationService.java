package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.TierResponse;
import com.tickets.msticketing.exception.InventoryServiceUnavailableException;
import com.tickets.msticketing.exception.TierQuotaExhaustedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequiredArgsConstructor
@Slf4j
public class MsEventsIntegrationService {

    private final WebClient msEventsWebClient;
    public TierResponse decrementTierQuota(UUID eventId, UUID tierId, UUID reservationId) {
        String url = String.format("/api/v1/events/%s/tiers/%s/quota", eventId, tierId);

        try {
            var response = msEventsWebClient.patch()
                .uri(url)
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
}
