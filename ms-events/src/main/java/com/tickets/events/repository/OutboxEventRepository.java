package com.tickets.events.repository;

import com.tickets.events.model.OutboxEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    /**
     * Devuelve hasta {@code pageable.getPageSize()} eventos pendientes de publicar,
     * ordenados por {@code createdAt} ascendente para garantizar orden FIFO.
     */
    List<OutboxEvent> findByPublishedFalseOrderByCreatedAtAsc(Pageable pageable);
}
