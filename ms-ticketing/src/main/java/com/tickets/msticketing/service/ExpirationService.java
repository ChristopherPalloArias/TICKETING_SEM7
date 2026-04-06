package com.tickets.msticketing.service;

import com.tickets.msticketing.model.Reservation;
import com.tickets.msticketing.model.ReservationStatus;
import com.tickets.msticketing.repository.ReservationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Slf4j
public class ExpirationService {

    private static final List<ReservationStatus> EXPIRABLE_STATUSES =
        List.of(ReservationStatus.PENDING, ReservationStatus.PAYMENT_FAILED);
    private static final int BATCH_SIZE = 100;

    private final ReservationRepository reservationRepository;
    private final ReservationExpirationProcessor expirationProcessor;

    /**
     * Self-injection via @Lazy breaks the circular dependency and ensures
     * @Transactional on processExpiredBatch() is intercepted by the AOP proxy.
     * Without this, calling this.processExpiredBatch() from @Scheduled methods
     * bypasses the proxy and the transaction never opens.
     */
    @Lazy
    @Autowired
    private ExpirationService self;

    @Autowired
    public ExpirationService(ReservationRepository reservationRepository,
                             ReservationExpirationProcessor expirationProcessor) {
        this.reservationRepository = reservationRepository;
        this.expirationProcessor = expirationProcessor;
    }

    @Scheduled(fixedDelay = 60000)
    public void expireReservations() {
        log.info("ExpirationService [primary]: scanning for expired reservations");
        self.processExpiredBatch();
    }

    @Scheduled(fixedDelay = 120000)
    public void recoverUnprocessedReservations() {
        log.info("ExpirationService [backup]: scanning for unprocessed expired reservations");
        self.processExpiredBatch();
    }

    /**
     * Outer @Transactional keeps the PESSIMISTIC_WRITE row locks active for the full duration
     * of the batch, preventing other app instances from picking up the same reservations
     * (SKIP LOCKED semantics — RN-9).
     *
     * Each item is processed via ReservationExpirationProcessor.expireSingle() which runs in
     * its own REQUIRES_NEW transaction, so individual failures do not roll back the batch.
     */
    public void processExpiredBatch() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<Reservation> expired = reservationRepository.findExpiredReservations(
            EXPIRABLE_STATUSES, now, PageRequest.of(0, BATCH_SIZE)
        );

        log.info("ExpirationService: found {} expired reservations to process", expired.size());
        for (Reservation reservation : expired) {
            try {
                expirationProcessor.expireSingle(reservation);
            } catch (Exception ex) {
                log.error("ExpirationService: skipping reservation={} after failed expiration attempt",
                    reservation.getId(), ex);
            }
        }
    }
}

