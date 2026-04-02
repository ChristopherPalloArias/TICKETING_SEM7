package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.SeatDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatIntegrationService {

    private final WebClient webClient;

    @Value("${clients.ms-events.base-url:http://localhost:8081}")
    private String msEventsBaseUrl;

    public List<SeatDTO> getSeats(UUID eventId, UUID tierId) {
        log.info("Fetching seats for event={}, tier={}", eventId, tierId);
        
        return webClient
            .get()
            .uri(msEventsBaseUrl + "/api/v1/events/{eventId}/seats?tierId={tierId}", eventId, tierId)
            .retrieve()
            .bodyToFlux(SeatDTO.class)
            .retryWhen(Retry.backoff(2, Duration.ofMillis(200)))
            .collectList()
            .block();
    }

    public void blockSeats(UUID eventId, List<UUID> seatIds, UUID idempotencyKey) {
        log.info("Blocking seats for event={}, seatIds={}", eventId, seatIds);
        
        webClient
            .patch()
            .uri(msEventsBaseUrl + "/api/v1/events/{eventId}/seats/block", eventId)
            .header("X-Idempotency-Key", idempotencyKey.toString())
            .bodyValue(new BlockSeatsRequest(seatIds))
            .retrieve()
            .toBodilessEntity()
            .retryWhen(Retry.backoff(2, Duration.ofMillis(200)))
            .block();
    }

    public void releaseSeats(UUID eventId, List<UUID> seatIds) {
        log.info("Releasing seats for event={}, seatIds={}", eventId, seatIds);
        
        webClient
            .patch()
            .uri(msEventsBaseUrl + "/api/v1/events/{eventId}/seats/release", eventId)
            .bodyValue(new ReleaseSeatRequest(seatIds))
            .retrieve()
            .toBodilessEntity()
            .retryWhen(Retry.backoff(2, Duration.ofMillis(200)))
            .block();
    }

    public void sellSeats(UUID eventId, List<UUID> seatIds) {
        log.info("Selling seats for event={}, seatIds={}", eventId, seatIds);
        
        webClient
            .patch()
            .uri(msEventsBaseUrl + "/api/v1/events/{eventId}/seats/sell", eventId)
            .bodyValue(new SellSeatRequest(seatIds))
            .retrieve()
            .toBodilessEntity()
            .retryWhen(Retry.backoff(2, Duration.ofMillis(200)))
            .block();
    }

    record BlockSeatsRequest(List<UUID> seatIds) {}
    record ReleaseSeatRequest(List<UUID> seatIds) {}
    record SellSeatRequest(List<UUID> seatIds) {}
}
