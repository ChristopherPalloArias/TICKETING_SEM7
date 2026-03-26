package com.tickets.msticketing.controller;

import com.tickets.msticketing.dto.TicketResponse;
import com.tickets.msticketing.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Slf4j
public class TicketController {

    private final ReservationService reservationService;

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable UUID ticketId,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("GET /api/v1/tickets/{} - buyer={}", ticketId, buyerId);
        TicketResponse response = reservationService.getTicket(ticketId, buyerId);
        return ResponseEntity.ok(response);
    }
}
