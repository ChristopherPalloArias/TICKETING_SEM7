package com.tickets.msnotifications.service;

import com.tickets.msnotifications.dto.NotificationResponse;
import com.tickets.msnotifications.dto.PagedNotificationResponse;
import com.tickets.msnotifications.model.Notification;
import com.tickets.msnotifications.model.NotificationStatus;
import com.tickets.msnotifications.model.NotificationType;
import com.tickets.msnotifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Creates a notification if one does not already exist for (reservationId, type).
     * Applies priority rule: if PAYMENT_SUCCESS already exists for a reservationId,
     * RESERVATION_EXPIRED is silently skipped.
     *
     * @return true if created, false if skipped (idempotency or priority rule)
     */
    @Transactional
    public boolean createIfNotExists(UUID reservationId, UUID eventId, UUID tierId,
                                     UUID buyerId, NotificationType type, String motif) {
        // Priority rule: skip RESERVATION_EXPIRED if PAYMENT_SUCCESS already exists
        if (type == NotificationType.RESERVATION_EXPIRED
                && notificationRepository.existsByReservationIdAndType(reservationId, NotificationType.PAYMENT_SUCCESS)) {
            log.info("Skipping RESERVATION_EXPIRED: PAYMENT_SUCCESS already exists for reservationId={}", reservationId);
            return false;
        }

        // Idempotency: skip if same (reservationId, type) already persisted
        if (notificationRepository.existsByReservationIdAndType(reservationId, type)) {
            log.debug("Skipping duplicate notification type={} for reservationId={}", type, reservationId);
            return false;
        }

        Notification notification = Notification.builder()
            .reservationId(reservationId)
            .eventId(eventId)
            .tierId(tierId)
            .buyerId(buyerId)
            .type(type)
            .motif(motif)
            .status(NotificationStatus.PROCESSED)
            .createdAt(Instant.now())
            .build();

        try {
            notificationRepository.save(notification);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent duplicate — unique constraint (reservation_id, type) fired.
            // Treat as already-existing: idempotent ACK, no retry.
            log.debug("Concurrent duplicate suppressed by constraint: type={} reservationId={}", type, reservationId);
            return false;
        }
        log.info("Notification created: type={} reservationId={} buyerId={}", type, reservationId, buyerId);
        return true;
    }

    public List<NotificationResponse> getByReservationId(UUID reservationId) {
        return notificationRepository.findByReservationIdOrderByCreatedAtDesc(reservationId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public PagedNotificationResponse getByBuyerId(UUID buyerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> result = notificationRepository.findByBuyerId(buyerId, pageable);
        List<NotificationResponse> content = result.getContent().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        return new PagedNotificationResponse(
            content,
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages()
        );
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
            n.getId(),
            n.getReservationId(),
            n.getEventId(),
            n.getTierId(),
            n.getBuyerId(),
            n.getType().name(),
            n.getMotif(),
            n.getStatus().name(),
            n.getCreatedAt()
        );
    }
}
