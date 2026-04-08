package com.tickets.msticketing.controller;

import com.tickets.msticketing.util.SystemClock;
import com.tickets.msticketing.service.ExpirationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;

@RestController
@RequestMapping("/api/v1/testability")
@ConditionalOnProperty(name = "testability.enabled", havingValue = "true")
@RequiredArgsConstructor
public class TestabilityController {

    private final ExpirationService expirationService;
    private final JdbcTemplate jdbcTemplate;

    @PostMapping("/clock/advance")
    public Map<String, String> advanceClock(@RequestParam long minutes) {
        SystemClock.advanceMinutes(minutes);
        return Map.of("status", "advanced", "current_time", SystemClock.now().toString());
    }

    @PostMapping("/clock/reset")
    public Map<String, String> resetClock() {
        SystemClock.reset();
        return Map.of("status", "reset", "current_time", SystemClock.now().toString());
    }

    @PostMapping("/jobs/expiration/trigger")
    public Map<String, String> triggerExpirationJob() {
        expirationService.processExpiredBatch();
        return Map.of("status", "Triggered processExpiredBatch");
    }

    @PostMapping("/performance/reset")
    public Map<String, String> resetPerformanceReservations() {
        int deleted = jdbcTemplate.update("DELETE FROM reservation");
        return Map.of("status", "reservations_reset", "records_deleted", String.valueOf(deleted));
    }
}
