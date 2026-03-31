package com.tickets.gateway.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int capacity;
    private final int refillMinutes;

    public RateLimitService(
            @Value("${rate-limit.login.capacity:5}") int capacity,
            @Value("${rate-limit.login.refill-minutes:15}") int refillMinutes) {
        this.capacity = capacity;
        this.refillMinutes = refillMinutes;
    }

    public boolean tryConsume(String ip) {
        Bucket bucket = buckets.computeIfAbsent(ip, this::newBucket);
        return bucket.tryConsume(1);
    }

    private Bucket newBucket(String ip) {
        Refill refill = Refill.greedy(capacity, Duration.ofMinutes(refillMinutes));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }
}
