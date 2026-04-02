package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.*;
import com.tickets.msticketing.exception.*;
import com.tickets.msticketing.model.*;
import com.tickets.msticketing.repository.ReservationRepository;
import com.tickets.msticketing.repository.SeatReservationRepository;
import com.tickets.msticketing.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final TicketRepository ticketRepository;
    private final SeatReservationRepository seatReservationRepository;
    private final MsEventsIntegrationService msEventsIntegrationService;
    private final SeatIntegrationService seatIntegrationService;
    private final RabbitMQPublisherService rabbitMQPublisherService;
    private final FraudService fraudService;

    private static final int MAX_PAYMENT_ATTEMPTS = 3;

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, UUID buyerId) {
        log.info("Creating reservation for buyer={}, eventId={}, tierId={}, hasSeatIds={}",
            buyerId, request.eventId(), request.tierId(),
            request.seatIds() != null && !request.seatIds().isEmpty());

        // Validate event is PUBLISHED
        EventDetailResponse eventDetail = msEventsIntegrationService.getEventDetail(request.eventId());

        // Validate tier exists on event
        boolean tierExists = eventDetail.availableTiers() != null &&
            eventDetail.availableTiers().stream()
                .anyMatch(t -> request.tierId().equals(t.id()));
        if (!tierExists) {
            throw new EventNotPublishedException("Tier '" + request.tierId() + "' not found in event '" + request.eventId() + "'");
        }

        // BIFURCATION: Seat-based or quota-based
        if (request.seatIds() != null && !request.seatIds().isEmpty()) {
            return createSeatBasedReservation(request, buyerId, eventDetail);
        } else {
            return createQuotaBasedReservation(request, buyerId, eventDetail);
        }
    }

    private ReservationResponse createSeatBasedReservation(CreateReservationRequest request, UUID buyerId, EventDetailResponse eventDetail) {
        UUID reservationId = UUID.randomUUID();
        
        log.info("Creating seat-based reservation: reservationId={}, seats={}, event={}, tier={}",
            reservationId, request.seatIds().size(), request.eventId(), request.tierId());

        // Call ms-events to block seats (transactional, will fail if seats unavailable)
        try {
            seatIntegrationService.blockSeats(request.eventId(), request.seatIds(), reservationId);
        } catch (Exception ex) {
            log.error("Failed to block seats for reservation={}: {}", reservationId, ex.getMessage());
            throw new SeatNotAvailableException("One or more seats are not available or already reserved");
        }

        // Get tier type from event details
        String tierType = eventDetail.availableTiers().stream()
            .filter(t -> request.tierId().equals(t.id()))
            .map(t -> t.tierType())
            .findFirst()
            .orElse("GENERAL");

        // Create reservation with seat-based flag
        Reservation reservation = Reservation.builder()
            .id(reservationId)
            .eventId(request.eventId())
            .tierId(request.tierId())
            .buyerId(buyerId)
            .buyerEmail(request.buyerEmail())
            .status(ReservationStatus.PENDING)
            .tierType(tierType)
            .seatReservations(new ArrayList<>())
            .build();

        // Create SeatReservation records for temporal tracking
        List<SeatReservation> seatReservations = request.seatIds().stream()
            .map(seatId -> SeatReservation.builder()
                .id(UUID.randomUUID())
                .seatId(seatId)
                .reservationId(reservationId)  // Set reservationId directly
                .expiresAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10))
                .build())
            .toList();

        Reservation saved = reservationRepository.save(reservation);
        
        // Save SeatReservations with their reservation IDs already set
        seatReservationRepository.saveAll(seatReservations);

        log.info("Seat-based reservation created: id={}, seats={}, expiresAt={}, status=PENDING",
            saved.getId(), request.seatIds().size(), LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));

        return mapToReservationResponse(Objects.requireNonNull(saved));
    }

    private ReservationResponse createQuotaBasedReservation(CreateReservationRequest request, UUID buyerId, EventDetailResponse eventDetail) {
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
            .buyerEmail(request.buyerEmail())
            .status(ReservationStatus.PENDING)
            .tierType(tierResponse.tierType())
            .build();

        Reservation saved = reservationRepository.save(reservation);

        log.info("Quota-based reservation created: id={}, status=PENDING, tierType={}", saved.getId(), saved.getTierType());

        return mapToReservationResponse(Objects.requireNonNull(saved));
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
            // ✅ FRAUD ATTEMPT: Log and report
            log.error("🚨 UNAUTHORIZED PAYMENT ATTEMPT: attempted_buyerId={}, owner={}, reservation={}", 
                buyerId, reservation.getBuyerId(), reservationId);
            fraudService.reportFraudAttempt(
                buyerId.toString(),
                reservation.getBuyerId().toString(),
                reservationId,
                paymentRequest.amount()
            );
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

            // Check if seat-based or quota-based
            boolean isSeatBased = reservation.getSeatReservations() != null && !reservation.getSeatReservations().isEmpty();
            
            if (isSeatBased) {
                // Release seats back to inventory
                List<UUID> seatIds = reservation.getSeatReservations().stream()
                    .map(SeatReservation::getSeatId)
                    .toList();
                try {
                    seatIntegrationService.releaseSeats(reservation.getEventId(), seatIds);
                    log.info("Released {} seats for expired seat-based reservation={}", seatIds.size(), reservation.getId());
                } catch (Exception ex) {
                    log.error("Failed to release seats on expiration for reservation={}: {}", reservation.getId(), ex.getMessage());
                }
            } else {
                // Return quota-based inventory
                try {
                    msEventsIntegrationService.incrementTierQuota(
                        reservation.getEventId(),
                        reservation.getTierId(),
                        reservation.getId()
                    );
                } catch (Exception ex) {
                    log.error("Failed to increment quota on time-expired reservation={}: {}", reservation.getId(), ex.getMessage());
                }
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
            // ✅ DUPLICATE PAYMENT DETECTION: Already paid or expired
            if (status.equals(ReservationStatus.CONFIRMED)) {
                log.error("🚨 DUPLICATE PAYMENT ATTEMPT: email={}, reservation={}, currentStatus={}", 
                    buyerId, reservationId, status);
                fraudService.reportDuplicatePayment(
                    reservation.getBuyerEmail() != null ? reservation.getBuyerEmail() : buyerId.toString(),
                    reservationId,
                    paymentRequest.amount()
                );
                throw new IllegalArgumentException("Reservation already paid - duplicate payment attempt blocked");
            }
            throw new IllegalArgumentException("Reservation is not available for payment");
        }

        int paymentAttempts = reservation.getPaymentAttempts() != null ? reservation.getPaymentAttempts() : 0;
        if (paymentAttempts >= MAX_PAYMENT_ATTEMPTS) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);

            // Check if seat-based or quota-based
            boolean isSeatBased = reservation.getSeatReservations() != null && !reservation.getSeatReservations().isEmpty();
            
            if (isSeatBased) {
                // Release seats
                List<UUID> seatIds = reservation.getSeatReservations().stream()
                    .map(SeatReservation::getSeatId)
                    .toList();
                try {
                    seatIntegrationService.releaseSeats(reservation.getEventId(), seatIds);
                } catch (Exception ex) {
                    log.error("Failed to release seats on max attempts for reservation={}: {}", reservation.getId(), ex.getMessage());
                }
            } else {
                // Return quota-based inventory
                try {
                    msEventsIntegrationService.incrementTierQuota(
                        reservation.getEventId(),
                        reservation.getTierId(),
                        reservation.getId()
                    );
                } catch (Exception ex) {
                    log.error("Failed to increment quota on max attempts for reservation={}: {}", reservation.getId(), ex.getMessage());
                }
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
        if (paymentRequest.paymentMethod() != PaymentMethod.MOCK) {
            throw new InvalidPaymentStatusException("Only MOCK payment method is supported");
        }

        if (paymentRequest.status() != PaymentStatus.APPROVED && paymentRequest.status() != PaymentStatus.DECLINED) {
            throw new InvalidPaymentStatusException("Invalid payment status");
        }

        paymentAttempts = paymentAttempts + 1;
        reservation.setPaymentAttempts(paymentAttempts);

        if (paymentRequest.status() == PaymentStatus.DECLINED) {
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

        UUID buyerIdNonNull = Objects.requireNonNull(reservation.getBuyerId(), "Buyer ID must not be null");
        UUID eventIdNonNull = Objects.requireNonNull(reservation.getEventId(), "Event ID must not be null");
        UUID tierIdNonNull = Objects.requireNonNull(reservation.getTierId(), "Tier ID must not be null");

        // Determine if seat-based or quota-based
        boolean isSeatBased = reservation.getSeatReservations() != null && !reservation.getSeatReservations().isEmpty();
        
        if (isSeatBased) {
            // Seat-based: confirm seats with ms-events
            List<UUID> seatIds = reservation.getSeatReservations().stream()
                .map(SeatReservation::getSeatId)
                .toList();
            try {
                seatIntegrationService.sellSeats(reservation.getEventId(), seatIds);
                log.info("Seats confirmed as SOLD for approved payment: reservation={}, seats={}", reservationId, seatIds.size());
            } catch (Exception ex) {
                log.error("Failed to confirm seats as sold for reservation={}: {}", reservationId, ex.getMessage());
                throw new IllegalStateException("Could not confirm seat purchase");
            }
        } else {
            // Quota-based: no additional quota operations (already decremented at creation)
            log.info("Quota-based reservation payment confirmed: reservation={}", reservationId);
        }

        Ticket ticket = Ticket.builder()
            .reservationId(reservation.getId())
            .buyerId(buyerIdNonNull)
            .eventId(eventIdNonNull)
            .tierId(tierIdNonNull)
            .tierType(TierType.valueOf(reservation.getTierType() != null ? reservation.getTierType() : "GENERAL"))
            .price(paymentRequest.amount())
            .status(TicketStatus.VALID)
            .buyerEmail(reservation.getBuyerEmail())
            .paymentMethod(paymentRequest.paymentMethod().name())
            .transactionId("TXN-" + UUID.randomUUID().toString())
            .paidAt(LocalDateTime.now(ZoneOffset.UTC))
            // For seat-based: populate seat info from first SeatReservation (or from ms-events)
            .seatId(isSeatBased && !reservation.getSeatReservations().isEmpty() 
                ? reservation.getSeatReservations().get(0).getSeatId() 
                : null)
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

        log.info("Payment processed successfully: reservation={}, ticket={}, seatBased={}", reservation.getId(), savedTicket.getId(), isSeatBased);

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
            .map(this::enrichTicketWithEventData)
            .toList();
    }

    @Transactional(readOnly = true)
    public PaginatedTicketsResponse getTicketsByBuyerPaginated(UUID buyerId, Pageable pageable) {
        log.info("Fetching paginated tickets for buyer={}, page={}, size={}", buyerId, pageable.getPageNumber(), pageable.getPageSize());
        Page<Ticket> page = ticketRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId, pageable);
        List<TicketResponse> enriched = page.getContent().stream()
            .map(this::enrichTicketWithEventData)
            .toList();
        return new PaginatedTicketsResponse(
            enriched,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }

    @Transactional
    public void associateAnonymousTickets(UUID userId, String email) {
        log.info("Associating anonymous tickets for userId={}, email={}", userId, email);
        List<Ticket> anonymousTickets = ticketRepository.findByBuyerEmailAndUserIdIsNull(email);
        for (Ticket ticket : anonymousTickets) {
            ticket.setUserId(userId);
            ticket.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        if (!anonymousTickets.isEmpty()) {
            ticketRepository.saveAll(anonymousTickets);
            log.info("Associated {} anonymous tickets to userId={}", anonymousTickets.size(), userId);
        }
    }

    @Transactional
    public void expireReservationsByEvent(UUID eventId) {
        log.info("Expiring PENDING reservations for cancelled eventId={}", eventId);
        List<Reservation> pending = reservationRepository.findByEventId(eventId).stream()
            .filter(r -> r.getStatus() == ReservationStatus.PENDING)
            .toList();
        for (Reservation reservation : pending) {
            reservation.setStatus(ReservationStatus.EXPIRED);
            reservation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        reservationRepository.saveAll(pending);
        log.info("Expired {} reservations for eventId={}", pending.size(), eventId);
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
        return enrichTicketWithEventData(ticket);
    }

    private TicketResponse enrichTicketWithEventData(Ticket ticket) {
        String tierTypeName = ticket.getTierType() != null ? ticket.getTierType().toString() : "UNKNOWN";
        
        // Try to fetch event details for enrichment
        String eventTitle = "Unknown Event";
        LocalDateTime eventDate = null;
        try {
            EventDetailResponse eventDetail = msEventsIntegrationService.getEventDetail(ticket.getEventId());
            if (eventDetail != null) {
                eventTitle = eventDetail.title() != null ? eventDetail.title() : "Unknown Event";
                eventDate = eventDetail.date();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch event details for ticket={}; using defaults: {}", ticket.getId(), ex.getMessage());
        }

        return new TicketResponse(
            ticket.getId(),
            ticket.getEventId(),
            eventTitle,
            eventDate,
            tierTypeName,
            ticket.getPrice(),
            ticket.getStatus(),
            ticket.getCreatedAt(),
            ticket.getBuyerEmail(),
            ticket.getReservationId()
        );
    }
}
