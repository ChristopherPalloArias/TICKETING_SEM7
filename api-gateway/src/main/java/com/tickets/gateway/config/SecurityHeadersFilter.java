package com.tickets.gateway.config;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Adds OWASP-recommended HTTP security headers to every response.
 * Uses beforeCommit() to ensure headers are set before the response is flushed.
 */
@Component
@Order(-50)
public class SecurityHeadersFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        exchange.getResponse().beforeCommit(() -> {
            HttpHeaders headers = exchange.getResponse().getHeaders();
            headers.set("X-Content-Type-Options", "nosniff");
            headers.set("X-Frame-Options", "DENY");
            headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
            headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
            headers.set("Content-Security-Policy",
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'");
            headers.set("X-XSS-Protection", "0");
            return Mono.empty();
        });
        return chain.filter(exchange);
    }
}
