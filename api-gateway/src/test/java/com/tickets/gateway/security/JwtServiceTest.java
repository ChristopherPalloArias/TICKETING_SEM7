package com.tickets.gateway.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String SECRET = "test-secret-key-must-be-at-least-32-chars!!";
    private static final long EXPIRATION_MS = 3_600_000L;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    // ── GENERATE ───────────────────────────────────────────────────────────────

    @Test
    void testGenerateToken_hasCorrectClaims() {
        // GIVEN
        String userId = "user-123";
        String email  = "test@example.com";
        String role   = "ADMIN";

        // WHEN
        String token = jwtService.generateToken(userId, email, role);

        // THEN
        assertNotNull(token);
        assertFalse(token.isBlank());

        Claims claims = jwtService.validateAndExtractClaims(token);
        assertEquals(userId, claims.getSubject());
        assertEquals(email,  claims.get("email"));
        assertEquals(role,   claims.get("role"));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
        assertTrue(claims.getExpiration().after(claims.getIssuedAt()),
                "Expiration must be after issuedAt");
    }

    // ── VALIDATE & EXTRACT ─────────────────────────────────────────────────────

    @Test
    void testValidateAndExtractClaims_withValidToken() {
        // GIVEN
        String userId = "user-456";
        String email  = "user@example.com";
        String role   = "BUYER";
        String token  = jwtService.generateToken(userId, email, role);

        // WHEN
        Claims claims = jwtService.validateAndExtractClaims(token);

        // THEN
        assertEquals(userId, claims.getSubject());
        assertEquals(email,  claims.get("email"));
        assertEquals(role,   claims.get("role"));
    }

    // ── IS TOKEN VALID ─────────────────────────────────────────────────────────

    @Test
    void testIsTokenValid_withValidToken() {
        // GIVEN
        String token = jwtService.generateToken("user-1", "a@b.com", "ADMIN");

        // WHEN / THEN
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void testIsTokenValid_withExpiredToken() throws InterruptedException {
        // GIVEN — JwtService with 1 ms expiration
        JwtService shortLivedService = new JwtService(SECRET, 1L);
        String token = shortLivedService.generateToken("user-1", "a@b.com", "ADMIN");
        Thread.sleep(10);

        // WHEN / THEN — validated by the normal service (same secret)
        assertFalse(jwtService.isTokenValid(token), "Expired token must be rejected");
    }

    @Test
    void testIsTokenValid_withMalformedToken() {
        // GIVEN / WHEN / THEN
        assertFalse(jwtService.isTokenValid("not.a.token"),
                "Malformed token must be rejected");
    }

    @Test
    void testIsTokenValid_withEmptyToken() {
        // GIVEN / WHEN / THEN
        assertFalse(jwtService.isTokenValid(""),
                "Empty token must be rejected");
    }

    @Test
    void testIsTokenValid_withTokenSignedWithDifferentSecret() {
        // GIVEN — token produced by a service with a different secret
        String otherSecret = "other-secret-key-must-be-at-least-32-chars!!";
        JwtService otherService = new JwtService(otherSecret, EXPIRATION_MS);
        String token = otherService.generateToken("user-1", "a@b.com", "ADMIN");

        // WHEN / THEN
        assertFalse(jwtService.isTokenValid(token),
                "Token signed with different secret must be rejected");
    }
}
