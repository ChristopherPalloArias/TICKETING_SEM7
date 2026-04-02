package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.SeatReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SeatReservationRepository extends JpaRepository<SeatReservation, UUID> {
    List<SeatReservation> findByReservationId(UUID reservationId);
    List<SeatReservation> findByExpiresAtBefore(LocalDateTime dateTime);
}
