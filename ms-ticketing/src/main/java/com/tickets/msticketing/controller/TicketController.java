package com.tickets.msticketing.controller;

import com.tickets.msticketing.dto.TicketResponse;
import com.tickets.msticketing.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tickets", description = "Consulta de tickets confirmados")
public class TicketController {

    private final ReservationService reservationService;

    @GetMapping("/{ticketId}")
    @Operation(
        summary = "Consultar ticket",
        description = "Retorna el ticket generado tras un pago APPROVED. El ticketId se obtiene en la respuesta del endpoint de payments. Solo el propietario puede consultarlo (X-User-Id)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Ticket encontrado"),
        @ApiResponse(responseCode = "403", description = "X-User-Id no es el propietario"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable UUID ticketId,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("GET /api/v1/tickets/{} - buyer={}", ticketId, buyerId);
        TicketResponse response = reservationService.getTicket(ticketId, buyerId);
        return ResponseEntity.ok(response);
    }
}
