package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.*;
import com.tickets.msticketing.exception.*;
import com.tickets.msticketing.model.*;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

        // Validate event is PUBLISHED
        EventDetailResponse eventDetail = msEventsIntegrationService.getEventDetail(request.eventId());

        // Validate tier exists on event
        boolean tierExists = eventDetail.availableTiers() != null &&
            eventDetail.availableTiers().stream()
                .anyMatch(t -> request.tierId().equals(t.id()));
        if (!tierExists) {
            throw new EventNotPublishedException("Tier '" + request.tierId() + "' not found in event '" + request.eventId() + "'");
        }

        // Pre-generate reservation ID to use as idempotency key
        UUID reservationId = UUID.randomUUID();

        // Decrement quota (blocks inventory before creating reservation)
        TierResponse tierResponse = msEventsIntegrationService.decrementTierQuota(
            request.eventId(),
            request.tierId(),
            reservationId
        );

        // Persist reservation with tierType from ms-events response
        Reservation reservation = Reservation.builder()
            .id(reservationId)
            .eventId(request.eventId())
            .tierId(request.tierId())
            .buyerId(buyerId)
            .status(ReservationStatus.PENDING)
            .tierType(tierResponse.tierType())
            .build();

        Reservation saved = reservationRepository.save(reservation);

        log.info("Reservation created: id={}, status=PENDING, tierType={}", saved.getId(), saved.getTierType());

        return mapToReservationResponse(Objects.requireNonNull(saved, "Saved reservation must not be null"));
    }

    @Transactional(noRollbackFor = {ReservationExpiredException.class, PaymentFailedException.class})
    public PaymentResponse processPayment(UUID reservationId, PaymentRequest paymentRequest, UUID buyerId) {
        log.info("Processing payment for reservation={}, buyer={}", reservationId, buyerId);
        try {
            return doProcessPayment(reservationId, paymentRequest, buyerId);
        } catch (ObjectOptimisticLockingFailureException ex) {
            log.warn("Optimistic lock conflict on reservation={} — reservation was concurrently modified", reservationId);
            throw new ReservationExpiredException("Reservation is no longer available (concurrent modification)");
        }
    }

    private PaymentResponse doProcessPayment(UUID reservationId, PaymentRequest paymentRequest, UUID buyerId) {

        Reservation reservation = Objects.requireNonNull(
            reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found")),
            "Reservation must not be null"
        );

        if (!reservation.getBuyerId().equals(buyerId)) {
            throw new ForbiddenAccessException("You can only pay for your own reservations");
        }

        // Fetch eventName for notification enrichment (graceful degradation)
        String eventName = null;
        try {
            EventDetailResponse eventDetail = msEventsIntegrationService.getEventDetail(reservation.getEventId());
            if (eventDetail != null) {
                eventName = eventDetail.title();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch eventName for reservation={}: {}", reservationId, ex.getMessage());
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime validUntil = reservation.getValidUntilAt();
        if (validUntil != null && now.isAfter(validUntil)) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            // Return inventory since quota was decremented at reservation creation
            try {
                msEventsIntegrationService.incrementTierQuota(
                    reservation.getEventId(),
                    reservation.getTierId(),
                    reservation.getId()
                );
            } catch (Exception ex) {
                log.error("Failed to increment quota on time-expired reservation={}: {}", reservation.getId(), ex.getMessage());
            }

            TicketExpiredEvent expiredEvent = new TicketExpiredEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getBuyerId(),
                now,
                "1.0",
                null,
                eventName
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

            // Return inventory since no further payment can succeed
            try {
                msEventsIntegrationService.incrementTierQuota(
                    reservation.getEventId(),
                    reservation.getTierId(),
                    reservation.getId()
                );
            } catch (Exception ex) {
                log.error("Failed to increment quota on max attempts for reservation={}: {}", reservation.getId(), ex.getMessage());
            }

            TicketExpiredEvent maxAttemptsEvent = new TicketExpiredEvent(
                reservation.getId(),
                reservation.getEventId(),
                reservation.getTierId(),
                reservation.getBuyerId(),
                now,
                "1.0",
                "Maximum payment attempts exceeded",
                eventName
            );
            rabbitMQPublisherService.publishTicketExpiredEvent(maxAttemptsEvent);

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
                "1.0",
                eventName
            );
            rabbitMQPublisherService.publishTicketPaymentFailedEvent(failedEvent);

            throw new PaymentFailedException("Payment declined. Your reservation remains active for 10 minutes", reservation.getId().toString());
        }

        // No decrementTierQuota here — quota was already decremented when reservation was created

        UUID buyerIdNonNull = Objects.requireNonNull(reservation.getBuyerId(), "Buyer ID must not be null");
        UUID eventIdNonNull = Objects.requireNonNull(reservation.getEventId(), "Event ID must not be null");
        UUID tierIdNonNull = Objects.requireNonNull(reservation.getTierId(), "Tier ID must not be null");

        Ticket ticket = Ticket.builder()
            .reservationId(reservation.getId())
            .buyerId(buyerIdNonNull)
            .eventId(eventIdNonNull)
            .tierId(tierIdNonNull)
            .tierType(TierType.valueOf(reservation.getTierType() != null ? reservation.getTierType() : "GENERAL"))
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
            "1.0",
            eventName
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
            LocalDateTime.now(ZoneOffset.UTC)
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
}
