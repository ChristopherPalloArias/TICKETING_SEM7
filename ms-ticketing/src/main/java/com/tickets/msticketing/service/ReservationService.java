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
import java.util.List;
import java.util.Objects;
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

        Reservation reservation = Reservation.builder()
            .eventId(request.eventId())
            .tierId(request.tierId())
            .buyerId(buyerId)
            .status(ReservationStatus.PENDING)
            .build();

        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation created: id={}, status=PENDING", saved.getId());

        return mapToReservationResponse(Objects.requireNonNull(saved, "Saved reservation must not be null"));
    }

    @Transactional(noRollbackFor = {ReservationExpiredException.class, PaymentFailedException.class})
    public PaymentResponse processPayment(UUID reservationId, PaymentRequest paymentRequest, UUID buyerId) {
        log.info("Processing payment for reservation={}, buyer={}", reservationId, buyerId);

        Reservation reservation = Objects.requireNonNull(
            reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found")),
            "Reservation must not be null"
        );

        if (!reservation.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You can only pay for your own reservations");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validUntil = reservation.getValidUntilAt();
        if (validUntil != null && now.isAfter(validUntil)) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            TicketExpiredEvent expiredEvent = new TicketExpiredEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getBuyerId(),
                now,
                "1.0"
            );
            rabbitMQPublisherService.publishTicketExpiredEvent(expiredEvent);

            throw new ReservationExpiredException("Reservation has expired");
        }

        ReservationStatus status = reservation.getStatus();
        if (status == null || (!status.equals(ReservationStatus.PENDING) && 
            !status.equals(ReservationStatus.PAYMENT_FAILED))) {
            throw new IllegalArgumentException("Reservation is not available for payment");
        }

        int paymentAttempts = reservation.getPaymentAttempts() != null ? reservation.getPaymentAttempts() : 0;
        if (paymentAttempts >= MAX_PAYMENT_ATTEMPTS) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
            throw new MaxPaymentAttemptsExceededException("Maximum payment attempts exceeded");
        }
        if (!paymentRequest.paymentMethod().equals("MOCK")) {
            throw new InvalidPaymentStatusException("Only MOCK payment method is supported");
        }

        if (!paymentRequest.status().equals("APPROVED") && !paymentRequest.status().equals("DECLINED")) {
            throw new InvalidPaymentStatusException("Invalid payment status");
        }

        paymentAttempts = paymentAttempts + 1;
        reservation.setPaymentAttempts(paymentAttempts);

        if (paymentRequest.status().equals("DECLINED")) {
            reservation.setStatus(ReservationStatus.PAYMENT_FAILED);
            reservationRepository.save(reservation);

            TicketPaymentFailedEvent failedEvent = new TicketPaymentFailedEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getBuyerId(),
                "Payment declined by mock service",
                now,
                "1.0"
            );
            rabbitMQPublisherService.publishTicketPaymentFailedEvent(failedEvent);

            throw new PaymentFailedException("Payment declined. Your reservation remains active for 10 minutes", reservation.getId().toString());
        }

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

        UUID buyerIdNonNull = Objects.requireNonNull(reservation.getBuyerId(), "Buyer ID must not be null");
        UUID eventIdNonNull = Objects.requireNonNull(reservation.getEventId(), "Event ID must not be null");
        UUID tierIdNonNull = Objects.requireNonNull(reservation.getTierId(), "Tier ID must not be null");
        
        Ticket ticket = Ticket.builder()
            .reservationId(reservation.getId())
            .buyerId(buyerIdNonNull)
            .eventId(eventIdNonNull)
            .tierId(tierIdNonNull)
            .tierType(TierType.valueOf(getTierTypeFromContext(tierIdNonNull)))
            .price(paymentRequest.amount())
            .status(TicketStatus.VALID)
            .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        TicketPaidEvent paidEvent = new TicketPaidEvent(
            reservation.getId(),
            reservation.getEventId(),
            reservation.getTierId(),
            reservation.getBuyerId(),
            paymentRequest.amount(),
            now,
            "1.0"
        );
        rabbitMQPublisherService.publishTicketPaidEvent(paidEvent);

        log.info("Payment processed successfully: reservation={}, ticket={}", reservation.getId(), savedTicket.getId());

        return mapToPaymentResponse(reservation, savedTicket, "Payment approved. Ticket generated.");
    }

    public GetReservationResponse getReservation(UUID reservationId, UUID buyerId) {
        log.info("Fetching reservation: id={}, buyer={}", reservationId, buyerId);

        Reservation reservation = Objects.requireNonNull(
            reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found")),
            "Reservation must not be null"
        );

        UUID reservationBuyerId = Objects.requireNonNull(
            reservation.getBuyerId(),
            "Reservation buyer ID must not be null"
        );
        if (!reservationBuyerId.equals(buyerId)) {
            throw new ForbiddenAccessException("You can only view your own reservations");
        }

        return mapToGetReservationResponse(reservation);
    }

    public TicketResponse getTicket(UUID ticketId, UUID buyerId) {
        log.info("Fetching ticket: id={}, buyer={}", ticketId, buyerId);

        Ticket ticket = Objects.requireNonNull(
            ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found")),
            "Ticket must not be null"
        );

        UUID ticketBuyerId = Objects.requireNonNull(
            ticket.getBuyerId(),
            "Ticket buyer ID must not be null"
        );
        if (!ticketBuyerId.equals(buyerId)) {
            throw new ForbiddenAccessException("You can only view your own tickets");
        }

        return mapToTicketResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByBuyer(UUID buyerId) {
        log.info("Fetching all VALID tickets for buyer={}", buyerId);
        return ticketRepository
            .findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(buyerId, TicketStatus.VALID)
            .stream()
            .map(this::mapToTicketResponse)
            .toList();
    }

    private ReservationResponse mapToReservationResponse(Reservation reservation) {
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation must not be null");
        }
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
        if (reservation == null) {
            throw new IllegalArgumentException("Reservation must not be null");
        }
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
        if (reservation == null || ticket == null) {
            throw new IllegalArgumentException("Reservation and ticket must not be null");
        }
        return new PaymentResponse(
            reservation.getId(),
            reservation.getStatus(),
            ticket.getId(),
            message != null ? message : "Payment processed",
            mapToTicketResponse(ticket),
            LocalDateTime.now()
        );
    }

    private TicketResponse mapToTicketResponse(Ticket ticket) {
        if (ticket == null) {
            throw new IllegalArgumentException("Ticket must not be null");
        }
        String tierTypeName = ticket.getTierType() != null ? ticket.getTierType().toString() : "UNKNOWN";
        return new TicketResponse(
            ticket.getId(),
            ticket.getReservationId(),
            ticket.getEventId(),
            ticket.getTierId(),
            tierTypeName,
            ticket.getPrice(),
            ticket.getStatus(),
            ticket.getCreatedAt()
        );
    }

    private String getTierTypeFromContext(UUID tierId) {
        return "GENERAL";
    }
}
