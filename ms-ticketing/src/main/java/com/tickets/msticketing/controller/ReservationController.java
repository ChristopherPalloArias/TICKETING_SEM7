package com.tickets.msticketing.controller;

import com.tickets.msticketing.dto.CreateReservationRequest;
import com.tickets.msticketing.dto.GetReservationResponse;
import com.tickets.msticketing.dto.PaymentRequest;
import com.tickets.msticketing.dto.PaymentResponse;
import com.tickets.msticketing.dto.ReservationResponse;
import com.tickets.msticketing.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reservations", description = "Gestión de reservas de entradas")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @Operation(
        summary = "Crear reserva",
        description = "Bloquea entradas por 10 minutos en estado PENDING. " +
            "Requiere header X-User-Id con el UUID del comprador (autenticado o guest para checkout anónimo)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Reserva creada en estado PENDING"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "404", description = "Evento o tier no encontrado")
    })
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID buyerId) {
        // Support both authenticated users and anonymous guest checkout
        final UUID finalBuyerId = buyerId != null ? buyerId : UUID.randomUUID();
        log.info("POST /api/v1/reservations - buyer={}", finalBuyerId);
        ReservationResponse response = reservationService.createReservation(request, finalBuyerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{reservationId}/payments")
    @Operation(
        summary = "Procesar mock payment",
        description = "Procesa el pago simulado de una reserva PENDING o PAYMENT_FAILED. " +
            "Enviar `status: APPROVED` para confirmar el ticket o `status: DECLINED` para fallar el pago. " +
            "Máximo 3 intentos. paymentMethod siempre debe ser `MOCK`. " +
            "Soporta usuarios autenticados (con JWT) y anónimos (con X-User-Id del guest)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Pago aprobado — ticket generado"),
        @ApiResponse(responseCode = "400", description = "Reserva expirada, método de pago inválido, o status inválido"),
        @ApiResponse(responseCode = "403", description = "X-User-Id no es el propietario de la reserva"),
        @ApiResponse(responseCode = "404", description = "Reserva no encontrada"),
        @ApiResponse(responseCode = "409", description = "Cupo agotado o máximo de intentos de pago superado")
    })
    public ResponseEntity<PaymentResponse> processPayment(
            @PathVariable UUID reservationId,
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID buyerId) {
        // Support both authenticated users and anonymous guest checkout
        final UUID finalBuyerId = buyerId != null ? buyerId : UUID.randomUUID();
        log.info("POST /api/v1/reservations/{}/payments - buyer={}", reservationId, finalBuyerId);
        PaymentResponse response = reservationService.processPayment(reservationId, request, finalBuyerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{reservationId}")
    @Operation(
        summary = "Consultar reserva",
        description = "Retorna el estado actual de una reserva. Solo el propietario puede consultarla (X-User-Id)."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reserva encontrada"),
        @ApiResponse(responseCode = "403", description = "X-User-Id no es el propietario"),
        @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    public ResponseEntity<GetReservationResponse> getReservation(
            @PathVariable UUID reservationId,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("GET /api/v1/reservations/{} - buyer={}", reservationId, buyerId);
        GetReservationResponse response = reservationService.getReservation(reservationId, buyerId);
        return ResponseEntity.ok(response);
    }
}
