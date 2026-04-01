package com.tickets.gateway.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService);
    }

    // helper: chain that captures the exchange after it passes through
    private WebFilterChain passThroughChain() {
        return exchange -> Mono.empty();
    }

    // ── VALID TOKEN ────────────────────────────────────────────────────────────

    @Test
    void testFilter_withValidJwt_propagatesHeadersAndBlocksForgery() {
        // GIVEN
        MockServerHttpRequest request = MockServerHttpRequest
            .get("/api/v1/auth/me")
                .header("Authorization", "Bearer valid.token")
                .header("X-Role", "HACKER")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getSubject()).thenReturn("user-123");
        when(mockClaims.get("role")).thenReturn("ADMIN");
        when(jwtService.isTokenValid("valid.token")).thenReturn(true);
        when(jwtService.validateAndExtractClaims("valid.token")).thenReturn(mockClaims);

        // WHEN — capture request forwarded to downstream chain
        final org.springframework.http.server.reactive.ServerHttpRequest[] captured =
                new org.springframework.http.server.reactive.ServerHttpRequest[1];
        filter.filter(exchange, ex -> {
            captured[0] = ex.getRequest();
            return Mono.empty();
        }).block();

        // THEN
        assertNotNull(captured[0]);
        assertEquals("user-123", captured[0].getHeaders().getFirst("X-User-Id"));
        assertEquals("ADMIN", captured[0].getHeaders().getFirst("X-Role"));
        assertNotEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    // ── NO TOKEN ON PROTECTED ENDPOINT ─────────────────────────────────────────

    @Test
    void testFilter_withoutToken_onProtectedEndpoint_returns401() {
        // GIVEN
        MockServerHttpRequest request = MockServerHttpRequest
            .get("/api/v1/auth/me")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // WHEN
        filter.filter(exchange, ex -> Mono.error(new AssertionError("Chain must not be called"))).block();

        // THEN
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verify(jwtService, never()).isTokenValid(anyString());
    }

    // ── INVALID TOKEN ──────────────────────────────────────────────────────────

    @Test
    void testFilter_withInvalidToken_returns401() {
        // GIVEN
        MockServerHttpRequest request = MockServerHttpRequest
            .get("/api/v1/auth/me")
                .header("Authorization", "Bearer invalid.token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isTokenValid("invalid.token")).thenReturn(false);

        // WHEN
        filter.filter(exchange, ex -> Mono.error(new AssertionError("Chain must not be called"))).block();

        // THEN
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    // ── PUBLIC ENDPOINT ────────────────────────────────────────────────────────

    @Test
    void testFilter_onPublicEndpoint_passesThrough() {
        // GIVEN — public path, no token provided
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/v1/auth/login")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // WHEN
        filter.filter(exchange, passThroughChain()).block();

        // THEN — should NOT be 401
        assertNotEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verify(jwtService, never()).isTokenValid(anyString());
    }

    // ── FORGED HEADERS STRIPPED ON PUBLIC ENDPOINT ─────────────────────────────

    @Test
    void testFilter_withForgedHeadersOnPublicEndpoint_roleIsStripped_userIdIsPreserved() {
        // GIVEN — public endpoint, client sends forged privilege headers
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/v1/auth/login")
                .header("X-Role", "ADMIN")
                .header("X-User-Id", "malicious-id")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        // WHEN — capture the mutated exchange via the chain
        final org.springframework.http.server.reactive.ServerHttpRequest[] captured = new org.springframework.http.server.reactive.ServerHttpRequest[1];
        filter.filter(exchange, ex -> {
            captured[0] = ex.getRequest();
            return Mono.empty();
        }).block();

        // THEN — role is stripped, user id can flow for anonymous/cart flows
        assertNotNull(captured[0]);
        assertNull(captured[0].getHeaders().getFirst("X-Role"),
                "Forged X-Role header must be stripped by the filter");
        assertEquals("malicious-id", captured[0].getHeaders().getFirst("X-User-Id"),
            "X-User-Id is preserved on public endpoints by current gateway contract");
    }
}
