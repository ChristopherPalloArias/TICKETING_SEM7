package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.TierResponse;
import com.tickets.msticketing.exception.InventoryServiceUnavailableException;
import com.tickets.msticketing.exception.TierQuotaExhaustedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MsEventsIntegrationService {

    private final WebClient msEventsWebClient;

    public TierResponse decrementTierQuota(UUID eventId, UUID tierId, UUID reservationId) {
        String url = String.format("/api/v1/events/%s/tiers/%s/quota", eventId, tierId);

        try {
            return msEventsWebClient.patch()
                .uri(url)
                .header("X-Idempotency-Key", reservationId.toString())
                .bodyValue("{\n\"decrementBy\": 1\n}")
                .retrieve()
                .toEntity(TierResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(200))
                    .filter(throwable -> throwable instanceof WebClientResponseException.ServiceUnavailable ||
                                       throwable instanceof WebClientResponseException.InternalServerError))
                .block()
                .getBody();
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
