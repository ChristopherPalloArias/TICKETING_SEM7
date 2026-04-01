package com.tickets.events.repository;

import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    Optional<Event> findByTitleAndDate(String title, LocalDateTime date);
    
    List<Event> findByStatus(EventStatus status);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    List<Event> findByRoomId(UUID roomId);

    boolean existsByRoomIdAndStatusIn(UUID roomId, List<EventStatus> statuses);

    long countByStatus(EventStatus status);

    @Query("SELECT e FROM Event e WHERE (:search IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Event> findAllBySearch(@Param("search") String search, Pageable pageable);
}
