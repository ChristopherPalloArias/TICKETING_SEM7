package com.tickets.events.repository;

import com.tickets.events.model.Tier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TierRepository extends JpaRepository<Tier, UUID> {
    List<Tier> findByEventId(UUID eventId);
    boolean existsByEventId(UUID eventId);
    void deleteByEventId(UUID eventId);
    Optional<Tier> findByIdAndEventId(UUID id, UUID eventId);
}