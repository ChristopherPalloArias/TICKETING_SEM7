package com.tickets.events.controller;

import com.tickets.events.dto.TierConfigurationResponse;
import com.tickets.events.dto.TierCreateRequest;
import com.tickets.events.service.TierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class TierController {

    private final TierService tierService;

    @PostMapping("/{eventId}/tiers")
    public ResponseEntity<TierConfigurationResponse> configureEventTiers(
        @PathVariable UUID eventId,
        @Valid @RequestBody List<@Valid TierCreateRequest> tierRequests,
        @RequestHeader("X-Role") String role,
        @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        TierConfigurationResponse response = tierService.configureEventTiers(eventId, tierRequests, role, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{eventId}/tiers")
    public ResponseEntity<TierConfigurationResponse> getEventTiers(@PathVariable UUID eventId) {
        TierConfigurationResponse response = tierService.getEventTiers(eventId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{eventId}/tiers")
    public ResponseEntity<Void> deleteEventTiers(
        @PathVariable UUID eventId,
        @RequestHeader("X-Role") String role,
        @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        tierService.deleteEventTiers(eventId, role, userId);
        return ResponseEntity.noContent().build();
    }
}