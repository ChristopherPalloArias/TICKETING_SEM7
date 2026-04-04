package com.tickets.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges

                        // ── CORS preflight ────────────────────────────────────────────────────
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── Auth pública ──────────────────────────────────────────────────────
                        // Login y registro no requieren JWT.
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/register/buyer").permitAll()

                        // ── Catálogo público de eventos ───────────────────────────────────────
                        // Solo GET del listado y del detalle de un evento individual.
                        // Rutas admin (/events/admin), de escritura (POST/PUT/PATCH/DELETE)
                        // y sub-recursos (/events/{id}/tiers, /events/{id}/publish, etc.)
                        // requieren JWT — los bloquea JwtAuthenticationFilter.
                        .pathMatchers(HttpMethod.GET, "/api/v1/events").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/events/{eventId:\\b[0-9a-fA-F\\-]{36}\\b}").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/events/{eventId}/seats").permitAll()

                        // ── Infraestructura ───────────────────────────────────────────────────
                        .pathMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/**").permitAll()

                        // ── Rutas protegidas ──────────────────────────────────────────────────
                        // La autenticación real la aplica JwtAuthenticationFilter (HIGHEST_PRECEDENCE).
                        // Spring Security no dispone de ReactiveAuthenticationManager integrado con
                        // nuestro JWT, por lo que .authenticated() bloquearía todo. Se usa
                        // .permitAll() aquí como capa de documentación; el filtro JWT es el
                        // único punto de control efectivo para estas rutas.
                        //
                        // Rutas que REQUIEREN JWT (comprador o admin):
                        //   GET  /api/v1/auth/me
                        //   GET  /api/v1/events/admin
                        //   POST /api/v1/events  ·  PUT /api/v1/events/{id}
                        //   PATCH /api/v1/events/{id}/publish  ·  PATCH /api/v1/events/{id}/cancel
                        //   GET|POST|DELETE /api/v1/events/{id}/tiers/**
                        //   GET /api/v1/rooms  (admin)
                        //   POST /api/v1/reservations  ·  POST /api/v1/reservations/{id}/payments
                        //   GET /api/v1/tickets/**
                        //   GET|PATCH /api/v1/notifications/buyer/{id}/**
                        .anyExchange().permitAll()
                )
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "X-Requested-With", "X-User-Id", "X-Role"));
        config.setExposedHeaders(Arrays.asList("X-Role", "X-User-Id"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
