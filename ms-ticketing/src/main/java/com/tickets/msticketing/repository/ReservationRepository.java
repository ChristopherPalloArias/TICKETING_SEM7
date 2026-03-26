package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.model.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByStatusAndValidUntilAtBefore(ReservationStatus status, LocalDateTime dateTime);
    List<Reservation> findByBuyerId(UUID buyerId);
    List<Reservation> findByEventId(UUID eventId);
}
