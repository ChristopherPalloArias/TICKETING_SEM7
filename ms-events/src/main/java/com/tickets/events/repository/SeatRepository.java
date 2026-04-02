package com.tickets.events.repository;

import com.tickets.events.model.Seat;
import com.tickets.events.model.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {
    List<Seat> findByEventIdAndTierId(UUID eventId, UUID tierId);
    List<Seat> findByEventIdAndStatus(UUID eventId, SeatStatus status);
    List<Seat> findByEventIdAndTierIdAndStatus(UUID eventId, UUID tierId, SeatStatus status);
}
