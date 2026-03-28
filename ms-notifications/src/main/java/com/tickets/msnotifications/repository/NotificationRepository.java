package com.tickets.msnotifications.repository;

import com.tickets.msnotifications.model.Notification;
import com.tickets.msnotifications.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByReservationIdOrderByCreatedAtDesc(UUID reservationId);

    Page<Notification> findByBuyerIdAndArchivedFalse(UUID buyerId, Pageable pageable);

    boolean existsByReservationIdAndType(UUID reservationId, NotificationType type);

    long countByBuyerIdAndArchivedFalseAndReadFalse(UUID buyerId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.buyerId = :buyerId AND n.read = false AND n.archived = false")
    int markAllReadByBuyerId(@Param("buyerId") UUID buyerId);

    @Modifying
    @Query("UPDATE Notification n SET n.archived = true WHERE n.buyerId = :buyerId AND n.archived = false")
    int archiveAllByBuyerId(@Param("buyerId") UUID buyerId);
}
