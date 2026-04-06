package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.model.ReservationStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    List<Reservation> findByStatusAndValidUntilAtBefore(ReservationStatus status, LocalDateTime dateTime);

    @Query("SELECT r FROM Reservation r WHERE r.status IN :statuses AND r.validUntilAt < :now")
    List<Reservation> findExpiredReservations(
        @Param("statuses") List<ReservationStatus> statuses,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

    List<Reservation> findByBuyerId(UUID buyerId);
    List<Reservation> findByEventId(UUID eventId);

    // Para estadísticas de admin
    long countByStatus(ReservationStatus status);
    long countByEventIdAndStatus(UUID eventId, ReservationStatus status);
}
