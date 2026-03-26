package com.tickets.events.repository;

import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    Optional<Event> findByTitleAndDate(String title, LocalDateTime date);
    
    List<Event> findByStatus(EventStatus status);
}
