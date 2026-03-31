package com.tickets.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.gateway.dto.LoginRequest;
import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterRequest;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.exception.ConflictException;
import com.tickets.gateway.exception.GlobalExceptionHandler;
import com.tickets.gateway.exception.UnauthorizedException;
import com.tickets.gateway.security.JwtAuthenticationFilter;
import com.tickets.gateway.security.RateLimitService;
import com.tickets.gateway.service.AuthService;
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
import reactor.core.publisher.Mono;

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
        // Make the mock filter transparent: pass every request through to the controller
        when(jwtAuthenticationFilter.filter(any(ServerWebExchange.class), any(WebFilterChain.class)))
                .thenAnswer(inv -> {
                    ServerWebExchange exchange = inv.getArgument(0);
                    WebFilterChain chain = inv.getArgument(1);
                    return chain.filter(exchange);
                });
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────────

    @Test
    void testLogin_withValidCredentials_returns200WithToken() throws Exception {
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login("user@example.com", "password123"))
                .thenReturn(new LoginResponse("jwt.token.value", 3600L, "ADMIN"));

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "password123"));

        // WHEN / THEN
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
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login(anyString(), anyString()))
                .thenThrow(new UnauthorizedException("Credenciales inválidas"));

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "wrongPass1"));

        // WHEN / THEN
        webTestClient.post().uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody()
                .jsonPath("$.error").isEqualTo("Credenciales inválidas");
    }

    @Test
    void testLogin_whenRateLimitExceeded_returns429() throws Exception {
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(false);

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "password123"));

        // WHEN / THEN
        webTestClient.post().uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isEqualTo(429)
                .expectBody()
                .jsonPath("$.error").exists();
    }

    // ── REGISTER ──────────────────────────────────────────────────────────────

    @Test
    void testRegister_withValidData_returns201() throws Exception {
        // GIVEN
        UUID newId = UUID.randomUUID();
        when(authService.register("newuser@example.com", "securePass1"))
                .thenReturn(new RegisterResponse(newId, "newuser@example.com", "ADMIN", Instant.now()));

        String body = objectMapper.writeValueAsString(
                new RegisterRequest("newuser@example.com", "securePass1"));

        // WHEN / THEN
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
    void testRegister_withInvalidEmail_returns400() throws Exception {
        // GIVEN
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("not-an-email", "securePass1"));

        // WHEN / THEN
        webTestClient.post().uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").exists();
    }

    @Test
    void testRegister_withShortPassword_returns400() throws Exception {
        // GIVEN
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("valid@example.com", "short"));

        // WHEN / THEN
        webTestClient.post().uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.error").exists();
    }

    @Test
    void testRegister_withDuplicateEmail_returns409() throws Exception {
        // GIVEN
        when(authService.register(anyString(), anyString()))
                .thenThrow(new ConflictException("El email ya está registrado"));

        String body = objectMapper.writeValueAsString(
                new RegisterRequest("existing@example.com", "securePass1"));

        // WHEN / THEN
        webTestClient.post().uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange()
                .expectStatus().isEqualTo(409)
                .expectBody()
                .jsonPath("$.error").isEqualTo("El email ya está registrado");
    }
}
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = AuthController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
@Import(GlobalExceptionHandler.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private RateLimitService rateLimitService;

    // SecurityConfig (loaded by @WebMvcTest) requires this bean; mock it so it passes through
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() throws Exception {
        // Make the mock filter transparent — forward every request to the downstream chain
        doAnswer(inv -> {
            ((FilterChain) inv.getArgument(2)).doFilter(
                    (ServletRequest) inv.getArgument(0),
                    (ServletResponse) inv.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────────

    @Test
    void testLogin_withValidCredentials_returns200WithToken() throws Exception {
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login("user@example.com", "password123"))
                .thenReturn(new LoginResponse("jwt.token.value", 3600L, "ADMIN"));

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "password123"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt.token.value"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void testLogin_withInvalidCredentials_returns401() throws Exception {
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login(anyString(), anyString()))
                .thenThrow(new UnauthorizedException("Credenciales inválidas"));

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "wrongPass1"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Credenciales inválidas"));
    }

    @Test
    void testLogin_whenRateLimitExceeded_returns429() throws Exception {
        // GIVEN
        when(rateLimitService.tryConsume(anyString())).thenReturn(false);

        String body = objectMapper.writeValueAsString(
                new LoginRequest("user@example.com", "password123"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").exists());
    }

    // ── REGISTER ──────────────────────────────────────────────────────────────

    @Test
    void testRegister_withValidData_returns201() throws Exception {
        // GIVEN
        UUID newId = UUID.randomUUID();
        when(authService.register("newuser@example.com", "securePass1"))
                .thenReturn(new RegisterResponse(newId, "newuser@example.com", "ADMIN", Instant.now()));

        String body = objectMapper.writeValueAsString(
                new RegisterRequest("newuser@example.com", "securePass1"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void testRegister_withInvalidEmail_returns400() throws Exception {
        // GIVEN — email without '@' fails @Email constraint
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("not-an-email", "securePass1"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testRegister_withShortPassword_returns400() throws Exception {
        // GIVEN — password < 8 chars fails @Size(min=8) constraint
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("valid@example.com", "short"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testRegister_withDuplicateEmail_returns409() throws Exception {
        // GIVEN
        when(authService.register(anyString(), anyString()))
                .thenThrow(new ConflictException("El email ya está registrado"));

        String body = objectMapper.writeValueAsString(
                new RegisterRequest("existing@example.com", "securePass1"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("El email ya está registrado"));
    }
}
