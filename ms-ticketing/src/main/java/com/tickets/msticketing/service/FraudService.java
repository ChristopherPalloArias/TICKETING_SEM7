package com.tickets.msticketing.service;

import com.tickets.msticketing.model.FraudLog;
import com.tickets.msticketing.model.FraudStatus;
import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.repository.FraudLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Service for detecting, logging, and investigating fraud attempts
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FraudService {

    private final FraudLogRepository fraudLogRepository;

    /**
     * Report a fraud attempt (unauthorized access to reservation)
     *
     * @param attemptedEmail Email that tried to access the reservation
     * @param actualOwnerEmail Email of the actual reservation owner
     * @param reservationId Reservation ID being accessed
     * @param amount Transaction amount (if applicable)
     */
    @Transactional
    public void reportFraudAttempt(
        String attemptedEmail,
        String actualOwnerEmail,
        UUID reservationId,
        BigDecimal amount
    ) {
        log.error("🚨 FRAUD ATTEMPT DETECTED: attempted_email={}, owner={}, reservation={}",
            attemptedEmail, actualOwnerEmail, reservationId);

        FraudLog fraudLog = FraudLog.builder()
            .attemptedEmail(attemptedEmail)
            .actualOwnerEmail(actualOwnerEmail)
            .reservationId(reservationId)
            .amount(amount)
            .status(FraudStatus.DETECTED)
            .description("Unauthorized access attempt to reservation belonging to different user")
            .attemptedAt(LocalDateTime.now(ZoneOffset.UTC))
            .build();

        FraudLog savedLog = fraudLogRepository.save(fraudLog);

        // Check for pattern: same email multiple attempts in short window
        long recentAttempts = fraudLogRepository.countByAttemptedEmailAndAttemptedAtAfter(
            attemptedEmail,
            LocalDateTime.now(ZoneOffset.UTC).minusHours(1)
        );

        if (recentAttempts > 3) {
            log.error("⚠️ ESCALATION: {} has {} fraud attempts in the last hour",
                attemptedEmail, recentAttempts);
            alertSecurityTeam(
                "🚨 CRITICAL: Potential automated fraud — " + attemptedEmail +
                " has " + recentAttempts + " failed attempts in 1 hour"
            );
        }

        log.info("Fraud log saved: id={}, status={}", savedLog.getId(), savedLog.getStatus());
    }

    /**
     * Report duplicate payment attempt on same reservation
     */
    @Transactional
    public void reportDuplicatePayment(
        String buyerEmail,
        UUID reservationId,
        BigDecimal amount
    ) {
        log.error("🚨 DUPLICATE PAYMENT ATTEMPT: email={}, reservation={}",
            buyerEmail, reservationId);

        FraudLog fraudLog = FraudLog.builder()
            .attemptedEmail(buyerEmail)
            .actualOwnerEmail(buyerEmail)
            .reservationId(reservationId)
            .amount(amount)
            .status(FraudStatus.DETECTED)
            .description("Attempt to pay for already-paid reservation")
            .attemptedAt(LocalDateTime.now(ZoneOffset.UTC))
            .build();

        fraudLogRepository.save(fraudLog);
    }

    /**
     * Get fraud statistics for an email address
     */
    public long getRecentFraudAttemptCount(String email) {
        return fraudLogRepository.countByAttemptedEmailAndAttemptedAtAfter(
            email,
            LocalDateTime.now(ZoneOffset.UTC).minusHours(24)
        );
    }

    /**
     * Get recent fraud logs (DETECTED status) - for security team
     */
    public Page<FraudLog> getRecentFraudLogs(int page, int size) {
        return fraudLogRepository.findByStatusAndAttemptedAtAfter(
            FraudStatus.DETECTED,
            LocalDateTime.now(ZoneOffset.UTC).minusDays(7),
            PageRequest.of(page, size)
        );
    }

    /**
     * Mark a fraud log as investigated
     */
    @Transactional
    public void resolveFraud(UUID fraudLogId, FraudStatus resolution, String investigatedBy) {
        fraudLogRepository.findById(fraudLogId).ifPresent(fraudLog -> {
            fraudLog.setStatus(resolution);
            fraudLog.setInvestigatedAt(LocalDateTime.now(ZoneOffset.UTC));
            fraudLog.setInvestigatedBy(investigatedBy);
            fraudLogRepository.save(fraudLog);
            log.info("Fraud log {} resolved as: {}", fraudLogId, resolution);
        });
    }

    /**
     * Alert security team about suspicious activity
     * TODO: Implement email/Slack/webhook integration
     */
    private void alertSecurityTeam(String message) {
        log.error("🚨 SECURITY ALERT: {}", message);
        // Future: send to Slack, email, or monitoring system
        // slackNotifier.send("#security", message);
    }
}
