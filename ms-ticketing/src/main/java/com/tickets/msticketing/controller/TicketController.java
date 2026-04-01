package com.tickets.msticketing.controller;

import com.tickets.msticketing.dto.PaginatedTicketsResponse;
import com.tickets.msticketing.dto.TicketResponse;
import com.tickets.msticketing.model.ReservationStatus;
import com.tickets.msticketing.model.TicketStatus;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import com.tickets.msticketing.service.PdfService;
import com.tickets.msticketing.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tickets", description = "Consulta de tickets confirmados")
public class TicketController {

    private final ReservationService reservationService;
    private final PdfService pdfService;
    private final TicketRepository ticketRepository;
    private final ReservationRepository reservationRepository;

    @GetMapping("/admin/stats")
    @Operation(
        summary = "Estadísticas globales de tickets (admin)",
        description = "Retorna el total de tickets vendidos y reservas activas. Requiere llamada interna de ms-events."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Estadísticas obtenidas exitosamente")
    })
    public ResponseEntity<Map<String, Long>> getAdminStats() {
        long totalTicketsSold = ticketRepository.countByStatus(TicketStatus.VALID);
        long activeReservations = reservationRepository.countByStatus(ReservationStatus.PENDING);
        return ResponseEntity.ok(Map.of(
            "totalTicketsSold", totalTicketsSold,
            "activeReservations", activeReservations
        ));
    }

    @GetMapping
    @Operation(
        summary = "Listar tickets del comprador",
        description = "Retorna todos los tickets confirmados (VALID) del comprador identificado por el query param buyerId, paginados."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de tickets (puede ser vacía)"),
        @ApiResponse(responseCode = "400", description = "buyerId inválido o parámetros de paginación inválidos"),
        @ApiResponse(responseCode = "403", description = "buyerId no coincide con el usuario autenticado (y no es ADMIN)")
    })
    public ResponseEntity<PaginatedTicketsResponse> getTickets(
            @RequestParam(required = true) UUID buyerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "X-User-Id", required = false) UUID authUserId,
            @RequestHeader(value = "X-Role", required = false) String role) {
        
        log.info("GET /api/v1/tickets - buyerId={}, page={}, size={}, authUserId={}", buyerId, page, size, authUserId);
        
        // Validación de autorización
        if (authUserId != null && !authUserId.equals(buyerId) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        PaginatedTicketsResponse response = reservationService.getTicketsByBuyerPaginated(buyerId, pageable);
        return ResponseEntity.ok(response);
    }

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

    @GetMapping("/{ticketId}/pdf")
    @Operation(
        summary = "Descargar ticket como PDF",
        description = "Genera y descarga un PDF con los datos del ticket. Solo funciona para tickets en estado VALID."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF generado y descargado"),
        @ApiResponse(responseCode = "400", description = "Ticket cancelado o en estado no permitido"),
        @ApiResponse(responseCode = "403", description = "No autorizado para descargar este ticket"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<byte[]> downloadTicketPdf(
            @PathVariable UUID ticketId,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("GET /api/v1/tickets/{}/pdf - buyer={}", ticketId, buyerId);
        
        byte[] pdfContent = pdfService.generateTicketPdf(ticketId, buyerId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
            .filename("ticket-" + ticketId + ".pdf")
            .build());
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfContent);
    }
}
