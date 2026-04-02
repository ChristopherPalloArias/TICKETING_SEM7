package com.tickets.msticketing.repository;

import com.tickets.msticketing.model.FraudLog;
import com.tickets.msticketing.model.FraudStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FraudLogRepository extends JpaRepository<FraudLog, UUID> {

    /**
     * Find all fraud logs for a specific email address
     */
    List<FraudLog> findByAttemptedEmail(String attemptedEmail);

    /**
     * Find all fraud logs for a reservation
     */
    List<FraudLog> findByReservationId(UUID reservationId);

    /**
     * Find recent fraud attempts (last N days) with status DETECTED
     */
    Page<FraudLog> findByStatusAndAttemptedAtAfter(
        FraudStatus status,
        LocalDateTime since,
        Pageable pageable
    );

    /**
     * Count fraud attempts by email in recent period
     */
    long countByAttemptedEmailAndAttemptedAtAfter(String email, LocalDateTime since);

    /**
     * Find all fraud logs by status
     */
    Page<FraudLog> findByStatus(FraudStatus status, Pageable pageable);
}
