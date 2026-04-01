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
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        // Try to extract and validate JWT if present
        Claims claims = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.isTokenValid(token)) {
                claims = jwtService.validateAndExtractClaims(token);
            }
        }

        // Caso 1: Usuario autenticado (tiene JWT válido)
        if (claims != null) {
            // User authenticated: remove client-provided headers and use JWT claims
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

        // Caso 2: No hay JWT válido → verificar si es ruta pública
        if (isPublicPath(path, method)) {
            // Rutas públicas sin autenticación: eliminar X-Role pero permitir X-User-Id del cliente (guest checkout)
            ServerHttpRequest publicRequest = exchange.getRequest().mutate()
                    .headers(headers -> {
                        headers.remove("X-Role");
                        // Remove X-User-Id only for non-guest paths to prevent header spoofing
                        if (!isGuestCheckoutPath(path, method)) {
                            headers.remove("X-User-Id");
                        }
                    })
                    .build();
            return chain.filter(exchange.mutate().request(publicRequest).build());
        }

        // Caso 3: Ruta protegida sin JWT → rechazar
        return writeError(exchange, HttpStatus.UNAUTHORIZED, "Token de autenticación requerido");
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

        // Guest checkout: POST /api/v1/reservations (anonymous user can create reservations)
        if (HttpMethod.POST.equals(method) && path.equals("/api/v1/reservations")) {
            return true;
        }

        // Guest payment: POST /api/v1/reservations/{uuid}/payments (anonymous user can pay for their reservation)
        if (HttpMethod.POST.equals(method) && path.matches("/api/v1/reservations/[0-9a-fA-F-]+/payments")) {
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
     * Determina si POST /api/v1/reservations, donde X-User-Id contiene el guest checkout ID
     * que debe ser preservado sin validación JWT.
     */
    private boolean isGuestCheckoutPath(String path, HttpMethod method) {
        return (HttpMethod.POST.equals(method) && path.equals("/api/v1/reservations")) ||
               (HttpMethod.POST.equals(method) && path.matches("/api/v1/reservations/[0-9a-fA-F-]+/payments"));
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
