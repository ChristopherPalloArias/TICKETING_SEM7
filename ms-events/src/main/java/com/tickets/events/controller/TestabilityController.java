package com.tickets.events.controller;

import com.tickets.events.util.SystemClock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/testability")
@ConditionalOnProperty(name = "testability.enabled", havingValue = "true")
public class TestabilityController {

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
}
