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

    @Transactional
    public boolean createIfNotExists(UUID reservationId, UUID eventId, UUID tierId,
                                     UUID buyerId, NotificationType type, String motif,
                                     String eventName) {
        if (type == NotificationType.RESERVATION_EXPIRED
                && notificationRepository.existsByReservationIdAndType(reservationId, NotificationType.PAYMENT_SUCCESS)) {
            log.info("Skipping RESERVATION_EXPIRED: PAYMENT_SUCCESS already exists for reservationId={}", reservationId);
            return false;
        }

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
            .eventName(eventName)
            .status(NotificationStatus.PROCESSED)
            .createdAt(Instant.now())
            .build();

        try {
            notificationRepository.save(notification);
        } catch (DataIntegrityViolationException ex) {
            log.debug("Concurrent duplicate suppressed by constraint: type={} reservationId={}", type, reservationId);
            return false;
        }
        log.info("Notification created: type={} reservationId={} buyerId={} eventName={}", type, reservationId, buyerId, eventName);
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
        Page<Notification> result = notificationRepository.findByBuyerIdAndArchivedFalse(buyerId, pageable);
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

    @Transactional
    public int markAllReadByBuyerId(UUID buyerId) {
        int count = notificationRepository.markAllReadByBuyerId(buyerId);
        log.info("Marked {} notifications as read for buyerId={}", count, buyerId);
        return count;
    }

    @Transactional(readOnly = true)
    public long countUnreadByBuyerId(UUID buyerId) {
        return notificationRepository.countByBuyerIdAndArchivedFalseAndReadFalse(buyerId);
    }

    @Transactional
    public int archiveAllByBuyerId(UUID buyerId) {
        int count = notificationRepository.archiveAllByBuyerId(buyerId);
        log.info("Archived {} notifications for buyerId={}", count, buyerId);
        return count;
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
            Boolean.TRUE.equals(n.getRead()),
            Boolean.TRUE.equals(n.getArchived()),
            n.getEventName(),
            n.getCreatedAt()
        );
    }
}
