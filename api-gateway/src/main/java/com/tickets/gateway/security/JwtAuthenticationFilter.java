package com.tickets.gateway.security;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class JwtAuthenticationFilter implements WebFilter {

    private static final String UUID_PATTERN =
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Pass OPTIONS preflight through immediately so gateway CORS filter can respond
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        if (isPublicPath(path, method)) {
            // Rutas públicas: eliminar ambos headers de identidad para evitar suplantación.
            // El downstream no debe confiar en ningún header de identidad en rutas públicas.
            ServerHttpRequest publicRequest = exchange.getRequest().mutate()
                    .headers(headers -> {
                        headers.remove("X-Role");
                        headers.remove("X-User-Id");
                    })
                    .build();
            return chain.filter(exchange.mutate().request(publicRequest).build());
        }

        // Rutas protegidas: eliminar ambos headers forjados y reemplazar desde el JWT.
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "Token de autenticación requerido");
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "Token inválido o expirado");
        }

        Claims claims = jwtService.validateAndExtractClaims(token);
        ServerHttpRequest authenticatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-Role");
                })
                .header("X-User-Id", claims.getSubject())
                .header("X-Role", (String) claims.get("role"))
                .build();

        return chain.filter(exchange.mutate().request(authenticatedRequest).build());
    }

    /**
     * Determina si una ruta debe ser tratada como pública (sin requerir JWT).
     * Usa matching exacto o por método para evitar que rutas privadas sean
     * accidentalmente clasificadas como públicas (ej: /api/v1/events/admin).
     */
    private boolean isPublicPath(String path, HttpMethod method) {
        // Auth: login y register son siempre públicos
        if (path.startsWith("/api/v1/auth/login") ||
                path.startsWith("/api/v1/auth/register")) {
            return true;
        }

        // Catálogo de eventos y detalle de evento — solo GET
        if (HttpMethod.GET.equals(method)) {
            // Listado de eventos: GET /api/v1/events
            if (path.equals("/api/v1/events")) {
                return true;
            }
            // Detalle de evento público: GET /api/v1/events/{uuid} (sin segmentos adicionales)
            if (path.startsWith("/api/v1/events/") && isExactUuidTail(path, "/api/v1/events/".length())) {
                return true;
            }
            // Salas públicas: GET /api/v1/rooms/public
            if (path.equals("/api/v1/rooms/public")) {
                return true;
            }
        }

        // Infraestructura: Swagger y Actuator
        if (path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/actuator")) {
            return true;
        }

        return false;
    }

    /**
     * Verifica que el segmento de path desde {@code start} sea exactamente un UUID
     * sin segmentos adicionales. Esto evita que /api/v1/events/{id}/tiers sea público.
     */
    private boolean isExactUuidTail(String path, int start) {
        if (start >= path.length()) return false;
        String tail = path.substring(start);
        return !tail.contains("/") && tail.matches(UUID_PATTERN);
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] bytes = ("{\"error\":\"" + message + "\"}").getBytes();
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(bytes))
        );
    }
}
