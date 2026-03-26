package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.Ticket;
import com.tickets.msticketing.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Optional<Ticket> findByReservationId(UUID reservationId);
    List<Ticket> findByBuyerId(UUID buyerId);
    List<Ticket> findByEventId(UUID eventId);
    List<Ticket> findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(UUID buyerId, TicketStatus status);
}
