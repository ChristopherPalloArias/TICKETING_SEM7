package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.Ticket;
import com.tickets.msticketing.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    
    // Paginación para tickets del usuario
    Page<Ticket> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);
    
    // Para asociación de tickets anónimos
    List<Ticket> findByBuyerEmailAndUserIdIsNull(String buyerEmail);

    // Para estadísticas de admin
    long countByStatus(TicketStatus status);
    long countByEventId(UUID eventId);
    long countByEventIdAndStatus(UUID eventId, TicketStatus status);
}
