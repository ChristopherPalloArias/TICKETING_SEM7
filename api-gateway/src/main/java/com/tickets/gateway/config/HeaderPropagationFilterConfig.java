package com.tickets.gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;

import java.util.List;
import java.util.Set;

@Configuration
public class HeaderPropagationFilterConfig {

    // Headers that are safe to propagate from upstream to downstream services.
    // X-Role and X-User-Id are intentionally EXCLUDED here — they are set exclusively
    // by the JWT security layer and must never be accepted from external clients.
    private static final List<String> PROPAGATED_HEADERS = List.of(
            "Content-Type",
            "Accept"
    );

    // Headers that are always stripped from incoming client requests to prevent forgery.
    private static final Set<String> FORBIDDEN_CLIENT_HEADERS = Set.of(
            "X-Role",
            "X-User-Id"
    );

    @Bean
    public GlobalFilter headerPropagationFilter() {
        return (exchange, chain) -> {
            ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate();

            // Strip forbidden headers that clients must not be able to forge
            requestBuilder.headers(headers -> FORBIDDEN_CLIENT_HEADERS.forEach(headers::remove));

            // Propagate only the safe headers
            PROPAGATED_HEADERS.forEach(header -> {
                List<String> values = exchange.getRequest().getHeaders().get(header);
                if (values != null && !values.isEmpty()) {
                    requestBuilder.header(header, values.toArray(new String[0]));
                }
            });

            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        };
    }
}
