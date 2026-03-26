package com.tickets.events.repository;

import com.tickets.events.model.ProcessedIdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<ProcessedIdempotencyKey, String> {
}
