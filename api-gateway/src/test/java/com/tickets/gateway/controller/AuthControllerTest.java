package com.tickets.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.gateway.dto.BuyerRegisterRequest;
import com.tickets.gateway.dto.LoginRequest;
import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterRequest;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.dto.UserProfileResponse;
import com.tickets.gateway.exception.ConflictException;
import com.tickets.gateway.exception.GlobalExceptionHandler;
import com.tickets.gateway.exception.UnauthorizedException;
import com.tickets.gateway.security.JwtAuthenticationFilter;
import com.tickets.gateway.security.RateLimitService;
import com.tickets.gateway.service.AuthService;
import io.github.bucket4j.ConsumptionProbe;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.reactive.ReactiveSecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@WebFluxTest(
        controllers = AuthController.class,
        excludeAutoConfiguration = {ReactiveSecurityAutoConfiguration.class})
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        when(jwtAuthenticationFilter.filter(any(ServerWebExchange.class), any(WebFilterChain.class)))
                .thenAnswer(invocation -> {
                    ServerWebExchange exchange = invocation.getArgument(0);
                    WebFilterChain chain = invocation.getArgument(1);
                    return chain.filter(exchange);
                });
    }

    @Test
    void testLogin_withValidCredentials_returns200WithToken() throws Exception {
        when(rateLimitService.tryConsumeAndGetProbe(anyString()))
                .thenReturn(ConsumptionProbe.consumed(4, 900_000_000_000L));
        when(authService.login("user@example.com", "password123"))
                .thenReturn(new LoginResponse("jwt.token.value", 3600L, "ADMIN"));

        String body = objectMapper.writeValueAsString(new LoginRequest("user@example.com", "password123"));

        webTestClient.post().uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.token").isEqualTo("jwt.token.value")
                .jsonPath("$.role").isEqualTo("ADMIN");
    }

    @Test
    void testLogin_withInvalidCredentials_returns401() throws Exception {
        when(rateLimitService.tryConsumeAndGetProbe(anyString()))
                .thenReturn(ConsumptionProbe.consumed(4, 900_000_000_000L));
        when(authService.login(anyString(), anyString()))
                .thenThrow(new UnauthorizedException("Credenciales invalidas"));

        String body = objectMapper.writeValueAsString(new LoginRequest("user@example.com", "wrongPass1"));

        webTestClient.post().uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Credenciales invalidas");
    }

    @Test
    void testLogin_whenRateLimitExceeded_returns429() throws Exception {
        // Rejected probe: 0 tokens restantes, ~15 min de espera
        when(rateLimitService.tryConsumeAndGetProbe(anyString()))
                .thenReturn(ConsumptionProbe.rejected(0, 900_000_000_000L, 900_000_000_000L));

        String body = objectMapper.writeValueAsString(new LoginRequest("user@example.com", "password123"));

        webTestClient.post().uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isEqualTo(429)
                .expectHeader().exists("Retry-After")
                .expectBody()
                .jsonPath("$.error").exists();
    }

    @Test
    void testRegister_withValidData_returns201() throws Exception {
        UUID newId = UUID.randomUUID();
        when(authService.register("newuser@example.com", "securePass1"))
                .thenReturn(new RegisterResponse(newId, "newuser@example.com", "ADMIN", Instant.now()));

        String body = objectMapper.writeValueAsString(new RegisterRequest("newuser@example.com", "securePass1"));

        webTestClient.post().uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.email").isEqualTo("newuser@example.com")
                .jsonPath("$.id").exists();
    }

    @Test
    void testRegister_withDuplicateEmail_returns409() throws Exception {
        when(authService.register(anyString(), anyString()))
                                .thenThrow(new ConflictException("El email ya esta registrado"));

        String body = objectMapper.writeValueAsString(new RegisterRequest("existing@example.com", "securePass1"));

        webTestClient.post().uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.error").isEqualTo("El email ya esta registrado");
    }

    @Test
    void testRegisterBuyer_withValidData_returns201WithBuyerJwt() throws Exception {
        when(authService.registerBuyer("buyer@example.com", "BuyerPass1"))
                .thenReturn(new LoginResponse("buyer.jwt.token", 28800L, "BUYER"));

        String body = objectMapper.writeValueAsString(new BuyerRegisterRequest("buyer@example.com", "BuyerPass1"));

        webTestClient.post().uri("/api/v1/auth/register/buyer")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.token").isEqualTo("buyer.jwt.token")
                .jsonPath("$.role").isEqualTo("BUYER");
    }

    @Test
    void testRegisterBuyer_withDuplicateEmail_returns409() throws Exception {
        when(authService.registerBuyer(anyString(), anyString()))
                                .thenThrow(new ConflictException("El email ya esta registrado"));

        String body = objectMapper.writeValueAsString(new BuyerRegisterRequest("buyer@example.com", "BuyerPass1"));

        webTestClient.post().uri("/api/v1/auth/register/buyer")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.error").isEqualTo("El email ya esta registrado");
    }

    @Test
    void testGetMe_withValidAuthenticatedHeader_returnsProfile() {
        UUID userId = UUID.randomUUID();
        when(authService.getCurrentUser(userId.toString()))
                .thenReturn(new UserProfileResponse(userId, "buyer@example.com", "BUYER", Instant.now()));

        webTestClient.get().uri("/api/v1/auth/me")
                .header("X-User-Id", userId.toString())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo(userId.toString())
                .jsonPath("$.email").isEqualTo("buyer@example.com")
                .jsonPath("$.role").isEqualTo("BUYER");
    }

    @Test
    void testGetMe_withoutAuthenticatedHeader_returns401() {
        webTestClient.get().uri("/api/v1/auth/me")
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
