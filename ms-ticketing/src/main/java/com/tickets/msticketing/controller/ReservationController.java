package com.tickets.msticketing.controller;

import com.tickets.msticketing.dto.CreateReservationRequest;
import com.tickets.msticketing.dto.GetReservationResponse;
import com.tickets.msticketing.dto.PaymentRequest;
import com.tickets.msticketing.dto.PaymentResponse;
import com.tickets.msticketing.dto.ReservationResponse;
import com.tickets.msticketing.service.ReservationService;
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
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("POST /api/v1/reservations - buyer={}", buyerId);
        ReservationResponse response = reservationService.createReservation(request, buyerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{reservationId}/payments")
    public ResponseEntity<PaymentResponse> processPayment(
            @PathVariable UUID reservationId,
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("POST /api/v1/reservations/{}/payments - buyer={}", reservationId, buyerId);
        PaymentResponse response = reservationService.processPayment(reservationId, request, buyerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<GetReservationResponse> getReservation(
            @PathVariable UUID reservationId,
            @RequestHeader("X-User-Id") UUID buyerId) {
        log.info("GET /api/v1/reservations/{} - buyer={}", reservationId, buyerId);
        GetReservationResponse response = reservationService.getReservation(reservationId, buyerId);
        return ResponseEntity.ok(response);
    }
}
