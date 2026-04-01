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
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/v1/auth/register/buyer").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/auth/me").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/events", "/api/v1/events/**").permitAll()
                        .pathMatchers("/api/v1/rooms/**").permitAll()
                        .pathMatchers("/api/v1/reservations/**").permitAll()
                        .pathMatchers("/api/v1/tickets/**").permitAll()
                        .pathMatchers("/api/v1/notifications/**").permitAll()
                        .pathMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/**").permitAll()
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
                "Authorization", "Content-Type", "X-Requested-With", "X-User-Id"));
        config.setExposedHeaders(Arrays.asList("X-Role", "X-User-Id"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
