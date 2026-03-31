package com.tickets.gateway.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RateLimitServiceTest {

    private static final int CAPACITY       = 5;
    private static final int REFILL_MINUTES = 15;

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService(CAPACITY, REFILL_MINUTES);
    }

    @Test
    void testTryConsume_allowsUpToCapacity() {
        // GIVEN
        String ip = "192.168.1.1";

        // WHEN / THEN — capacity consecutive calls must all succeed
        for (int i = 1; i <= CAPACITY; i++) {
            assertTrue(rateLimitService.tryConsume(ip),
                    "Call " + i + " of " + CAPACITY + " must be allowed");
        }
    }

    @Test
    void testTryConsume_blocksAt6thAttempt() {
        // GIVEN
        String ip = "192.168.1.2";

        // WHEN — exhaust bucket
        for (int i = 0; i < CAPACITY; i++) {
            rateLimitService.tryConsume(ip);
        }

        // THEN — next request is rejected
        assertFalse(rateLimitService.tryConsume(ip),
                "Request beyond capacity must be blocked (rate limit exceeded)");
    }

    @Test
    void testTryConsume_differentIps_independentBuckets() {
        // GIVEN
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        // WHEN — exhaust ip1 bucket completely
        for (int i = 0; i < CAPACITY; i++) {
            rateLimitService.tryConsume(ip1);
        }

        // THEN — ip2 must still have a full independent bucket
        assertTrue(rateLimitService.tryConsume(ip2),
                "A different IP must have its own independent bucket, unaffected by ip1");
        // And ip1 is blocked
        assertFalse(rateLimitService.tryConsume(ip1),
                "ip1 must remain blocked after exhausting its bucket");
    }
}
