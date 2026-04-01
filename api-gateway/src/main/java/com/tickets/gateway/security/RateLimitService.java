package com.tickets.gateway.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Rate limiter por IP para el endpoint de login.
 *
 * <p>Usa Bucket4j (token bucket) con un mapa LRU de tamaño acotado para evitar
 * la acumulación ilimitada de entradas en ataques DDoS distribuidos.</p>
 *
 * <p><b>IP spoofing:</b> Se ignora X-Forwarded-For intencionalmente a nivel de
 * este servicio. La extracción de IP confiable se delega a {@code AuthController},
 * que solo debe parsear ese header si el gateway está detrás de un reverse-proxy
 * confiable (no expuesto directamente a internet).</p>
 */
@Service
@Slf4j
public class RateLimitService {

    private final Map<String, Bucket> buckets;
    private final int capacity;
    private final int refillMinutes;

    public RateLimitService(
            @Value("${rate-limit.login.capacity:5}") int capacity,
            @Value("${rate-limit.login.refill-minutes:15}") int refillMinutes,
            @Value("${rate-limit.login.max-tracked-ips:10000}") int maxTrackedIps) {
        this.capacity = capacity;
        this.refillMinutes = refillMinutes;
        // LRU map con tamaño máximo — evita OOM por acumulación ilimitada de IPs
        this.buckets = Collections.synchronizedMap(new LinkedHashMap<>(maxTrackedIps, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Bucket> eldest) {
                return size() > maxTrackedIps;
            }
        });
    }

    /**
     * Intenta consumir un token del bucket asociado a la IP.
     *
     * @return {@code true} si el request es permitido, {@code false} si supera el límite
     */
    public boolean tryConsume(String ip) {
        Bucket bucket = buckets.computeIfAbsent(ip, this::newBucket);
        return bucket.tryConsume(1);
    }

    /**
     * Intenta consumir un token y devuelve información detallada del probe,
     * incluyendo el tiempo de espera restante en nanosegundos (para {@code Retry-After}).
     */
    public ConsumptionProbe tryConsumeAndGetProbe(String ip) {
        Bucket bucket = buckets.computeIfAbsent(ip, this::newBucket);
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    private Bucket newBucket(String key) {
        // intervally: los tokens se recargan al final de la ventana completa, no de forma greedy.
        // Esto es más restrictivo y apropiado para protección de login.
        Refill refill = Refill.intervally(capacity, Duration.ofMinutes(refillMinutes));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }
}
