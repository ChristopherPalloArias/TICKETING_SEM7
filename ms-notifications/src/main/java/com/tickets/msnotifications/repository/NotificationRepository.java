package com.tickets.msnotifications.repository;

import com.tickets.msnotifications.model.Notification;
import com.tickets.msnotifications.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByReservationIdOrderByCreatedAtDesc(UUID reservationId);

    Page<Notification> findByBuyerId(UUID buyerId, Pageable pageable);

    boolean existsByReservationIdAndType(UUID reservationId, NotificationType type);
}
