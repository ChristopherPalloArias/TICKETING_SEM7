package com.tickets.events.controller;

import com.tickets.events.dto.EventCreateRequest;
import com.tickets.events.dto.EventResponse;
import com.tickets.events.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {
    
    private final EventService eventService;
    
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
        @Valid @RequestBody EventCreateRequest request,
        @RequestHeader("X-Role") String role,
        @RequestHeader("X-User-Id") String userId
    ) {
        EventResponse response = eventService.createEvent(request, role, userId);
        return ResponseEntity.status(201).body(response);
    }
}
