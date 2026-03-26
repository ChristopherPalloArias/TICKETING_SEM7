package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.*;
import com.tickets.msticketing.exception.*;
import com.tickets.msticketing.model.*;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;
    private final MsEventsIntegrationService msEventsIntegrationService;
    private final RabbitMQPublisherService rabbitMQPublisherService;

    private static final int MAX_PAYMENT_ATTEMPTS = 3;

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, UUID buyerId) {
        log.info("Creating reservation for buyer={}, eventId={}, tierId={}", buyerId, request.eventId(), request.tierId());

        // Create and save reservation in PENDING state
        Reservation reservation = Reservation.builder()
            .eventId(request.eventId())
            .tierId(request.tierId())
            .buyerId(buyerId)
            .status(ReservationStatus.PENDING)
            .build();

        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation created: id={}, status=PENDING", saved.getId());

        return mapToReservationResponse(saved);
    }

    @Transactional
    public PaymentResponse processPayment(UUID reservationId, PaymentRequest paymentRequest, UUID buyerId) {
        log.info("Processing payment for reservation={}, buyer={}", reservationId, buyerId);

        // 1. Fetch reservation
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        // 2. Verify ownership
        if (!reservation.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You can only pay for your own reservations");
        }

        // 3. Check if reservation is expired
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(reservation.getValidUntilAt())) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            TicketExpiredEvent expiredEvent = new TicketExpiredEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                now
            );
            rabbitMQPublisherService.publishTicketExpiredEvent(expiredEvent);

            throw new ReservationExpiredException("Reservation has expired");
        }

        // 4. Check reservation status (must be PENDING or PAYMENT_FAILED for retry)
        if (!reservation.getStatus().equals(ReservationStatus.PENDING) && 
            !reservation.getStatus().equals(ReservationStatus.PAYMENT_FAILED)) {
            throw new IllegalArgumentException("Reservation is not available for payment");
        }

        // 5. Check payment attempts limit
        if (reservation.getPaymentAttempts() != null && reservation.getPaymentAttempts() >= MAX_PAYMENT_ATTEMPTS) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            throw new MaxPaymentAttemptsExceededException("Maximum payment attempts exceeded");
        }

        // 6. Validate payment request
        if (!paymentRequest.paymentMethod().equals("MOCK")) {
            throw new InvalidPaymentStatusException("Only MOCK payment method is supported");
        }

        if (!paymentRequest.status().equals("APPROVED") && !paymentRequest.status().equals("DECLINED")) {
            throw new InvalidPaymentStatusException("Invalid payment status");
        }

        // 7. Increment attempt counter
        reservation.setPaymentAttempts((reservation.getPaymentAttempts() != null ? reservation.getPaymentAttempts() : 0) + 1);

        // 8. Handle DECLINED status
        if (paymentRequest.status().equals("DECLINED")) {
            reservation.setStatus(ReservationStatus.PAYMENT_FAILED);
            reservationRepository.save(reservation);

            TicketPaymentFailedEvent failedEvent = new TicketPaymentFailedEvent(
                reservation.getId(),
                "Payment declined by mock service",
                now
            );
            rabbitMQPublisherService.publishTicketPaymentFailedEvent(failedEvent);

            throw new PaymentFailedException("Payment declined. Your reservation remains active for 10 minutes", reservation.getId().toString());
        }

        // 9. Process APPROVED payment: decrement quota in ms-events
        try {
            msEventsIntegrationService.decrementTierQuota(
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getId()
            );
        } catch (TierQuotaExhaustedException | InventoryServiceUnavailableException ex) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            throw ex;
        }

        // 10. Create ticket
        Ticket ticket = Ticket.builder()
            .reservationId(reservation.getId())
            .buyerId(reservation.getBuyerId())
            .eventId(reservation.getEventId())
            .tierId(reservation.getTierId())
            .tierType(TierType.valueOf(getTierTypeFromContext(reservation.getTierId())))
            .price(paymentRequest.amount())
            .status(TicketStatus.VALID)
            .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // 11. Update reservation to CONFIRMED
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        // 12. Publish ticket.paid event
        TicketPaidEvent paidEvent = new TicketPaidEvent(
            reservation.getId(),
            reservation.getEventId(),
            reservation.getTierId(),
            reservation.getBuyerId(),
            paymentRequest.amount(),
            now
        );
        rabbitMQPublisherService.publishTicketPaidEvent(paidEvent);

        log.info("Payment processed successfully: reservation={}, ticket={}", reservation.getId(), savedTicket.getId());

        return mapToPaymentResponse(reservation, savedTicket, "Payment approved. Ticket generated.");
    }

    public GetReservationResponse getReservation(UUID reservationId, UUID buyerId) {
        log.info("Fetching reservation: id={}, buyer={}", reservationId, buyerId);

        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        if (!reservation.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You can only view your own reservations");
        }

        return mapToGetReservationResponse(reservation);
    }

    public TicketResponse getTicket(UUID ticketId, UUID buyerId) {
        log.info("Fetching ticket: id={}, buyer={}", ticketId, buyerId);

        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        if (!ticket.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You can only view your own tickets");
        }

        return mapToTicketResponse(ticket);
    }

    // Mapper methods
    private ReservationResponse mapToReservationResponse(Reservation reservation) {
        return new ReservationResponse(
            reservation.getId(),
            reservation.getEventId(),
            reservation.getTierId(),
            reservation.getBuyerId(),
            reservation.getStatus(),
            reservation.getCreatedAt(),
            reservation.getUpdatedAt(),
            reservation.getValidUntilAt()
        );
    }

    private GetReservationResponse mapToGetReservationResponse(Reservation reservation) {
        return new GetReservationResponse(
            reservation.getId(),
            reservation.getEventId(),
            reservation.getTierId(),
            reservation.getStatus(),
            reservation.getCreatedAt(),
            reservation.getUpdatedAt(),
            reservation.getValidUntilAt()
        );
    }

    private PaymentResponse mapToPaymentResponse(Reservation reservation, Ticket ticket, String message) {
        return new PaymentResponse(
            reservation.getId(),
            reservation.getStatus(),
            ticket.getId(),
            message,
            mapToTicketResponse(ticket),
            LocalDateTime.now()
        );
    }

    private TicketResponse mapToTicketResponse(Ticket ticket) {
        return new TicketResponse(
            ticket.getId(),
            ticket.getReservationId(),
            ticket.getEventId(),
            ticket.getTierId(),
            ticket.getTierType().toString(),
            ticket.getPrice(),
            ticket.getStatus(),
            ticket.getCreatedAt()
        );
    }

    private String getTierTypeFromContext(UUID tierId) {
        // TODO: In a real scenario, we'd integrate with ms-events to get tier details
        // For now, default to GENERAL - this will be populated by the integration
        return "GENERAL";
    }
}
