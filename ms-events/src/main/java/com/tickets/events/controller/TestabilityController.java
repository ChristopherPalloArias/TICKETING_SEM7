package com.tickets.events.controller;

import com.tickets.events.util.SystemClock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/v1/testability")
@ConditionalOnProperty(name = "testability.enabled", havingValue = "true")
@RequiredArgsConstructor
public class TestabilityController {

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

    @PostMapping("/performance/reset")
    public Map<String, String> resetPerformanceInventory() {
        int updated = jdbcTemplate.update("UPDATE seat SET status = 'AVAILABLE'");
        return Map.of("status", "inventory_reset", "seats_liberated", String.valueOf(updated));
    }

    @GetMapping("/performance/inventory")
    public List<Map<String, Object>> getInventory() {
        return jdbcTemplate.queryForList(
            "SELECT s.event_id AS \"eventId\", s.tier_id AS \"tierId\", s.id AS \"seatId\" " +
            "FROM seat s " +
            "JOIN tier t ON s.tier_id = t.id AND s.event_id = t.event_id " +
            "WHERE s.status = 'AVAILABLE'"
        );
    }
}
