package com.tickets.gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;

import java.util.List;

@Configuration
public class HeaderPropagationFilterConfig {

    private static final List<String> PROPAGATED_HEADERS = List.of(
            "X-Role",
            "X-User-Id",
            "Content-Type",
            "Accept"
    );

    @Bean
    public GlobalFilter headerPropagationFilter() {
        return (exchange, chain) -> {
            ServerHttpRequest.Builder requestBuilder = exchange.getRequest().mutate();

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
