package com.tickets.gateway.service;

import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.exception.ConflictException;
import com.tickets.gateway.exception.UnauthorizedException;
import com.tickets.gateway.model.User;
import com.tickets.gateway.repository.UserRepository;
import com.tickets.gateway.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    // Used locally to prepare hashed passwords for test fixtures
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, jwtService);
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────────

    @Test
    void testLogin_withValidCredentials_returnsToken() {
        // GIVEN
        String rawPassword = "securePassword123";
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash(encoder.encode(rawPassword))
                .role(User.Role.ADMIN)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("mocked.jwt.token");
        when(jwtService.getExpirationMs()).thenReturn(28_800_000L);

        // WHEN
        LoginResponse response = authService.login("user@example.com", rawPassword);

        // THEN
        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.token());
        assertEquals("ADMIN", response.role());
        assertTrue(response.expiresIn() > 0);
    }

    @Test
    void testLogin_withInvalidPassword_throwsUnauthorized() {
        // GIVEN
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash(encoder.encode("correctPassword"))
                .role(User.Role.ADMIN)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        // WHEN / THEN
        assertThrows(UnauthorizedException.class,
                () -> authService.login("user@example.com", "wrongPassword"));
    }

    @Test
    void testLogin_withNonExistentEmail_throwsUnauthorized() {
        // GIVEN
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        // WHEN / THEN
        assertThrows(UnauthorizedException.class,
                () -> authService.login("ghost@example.com", "anyPassword"));
    }

    @Test
    void testLogin_errorMessageIsGeneric() {
        // GIVEN — prepare both scenarios
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .passwordHash(encoder.encode("correctPassword"))
                .role(User.Role.ADMIN)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // WHEN
        UnauthorizedException wrongPasswordEx = assertThrows(UnauthorizedException.class,
                () -> authService.login("user@example.com", "wrongPassword"));
        UnauthorizedException noEmailEx = assertThrows(UnauthorizedException.class,
                () -> authService.login("nonexistent@example.com", "anyPassword"));

        // THEN — both errors must produce identical messages (no information leakage)
        assertEquals(wrongPasswordEx.getMessage(), noEmailEx.getMessage(),
                "Error message must not reveal whether email or password was incorrect");
    }

    // ── REGISTER ───────────────────────────────────────────────────────────────

    @Test
    void testRegister_withValidData_savesWithBCrypt() {
        // GIVEN
        String rawPassword = "securePassword123";
        UUID generatedId   = UUID.randomUUID();
        User savedUser = User.builder()
                .id(generatedId)
                .email("new@example.com")
                .passwordHash(encoder.encode(rawPassword))
                .role(User.Role.ADMIN)
                .createdAt(Instant.now())
                .build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // WHEN
        RegisterResponse response = authService.register("new@example.com", rawPassword);

        // THEN
        assertNotNull(response);
        assertEquals("new@example.com", response.email());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        String storedHash = captor.getValue().getPasswordHash();

        assertNotEquals(rawPassword, storedHash,
                "Password must NOT be stored in plain text");
        assertTrue(encoder.matches(rawPassword, storedHash),
                "Stored hash must verify correctly against the raw password via BCrypt");
    }

    @Test
    void testRegister_withExistingEmail_throwsConflict() {
        // GIVEN
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // WHEN / THEN
        assertThrows(ConflictException.class,
                () -> authService.register("existing@example.com", "somePassword123"));
        verify(userRepository, never()).save(any());
    }

        @Test
        void testRegisterBuyer_withValidData_returnsBuyerJwt() {
                // GIVEN
                UUID buyerId = UUID.randomUUID();
                User savedBuyer = User.builder()
                                .id(buyerId)
                                .email("buyer@example.com")
                                .passwordHash(encoder.encode("BuyerPass1"))
                                .role(User.Role.BUYER)
                                .createdAt(Instant.now())
                                .build();

                when(userRepository.existsByEmail("buyer@example.com")).thenReturn(false);
                when(userRepository.save(any(User.class))).thenReturn(savedBuyer);
                when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("buyer.jwt.token");

                // WHEN
                LoginResponse response = authService.registerBuyer("buyer@example.com", "BuyerPass1");

                // THEN
                assertNotNull(response);
                assertEquals("buyer.jwt.token", response.token());
                assertEquals("BUYER", response.role());
                assertEquals(28800L, response.expiresIn());

                ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
                verify(userRepository).save(captor.capture());
                assertEquals(User.Role.BUYER, captor.getValue().getRole());
        }

        @Test
        void testRegisterBuyer_withDuplicateEmail_throwsConflict() {
                // GIVEN
                when(userRepository.existsByEmail("buyer@example.com")).thenReturn(true);

                // WHEN / THEN
                assertThrows(ConflictException.class,
                                () -> authService.registerBuyer("buyer@example.com", "BuyerPass1"));
                verify(userRepository, never()).save(any());
        }

        @Test
        void testGetCurrentUser_withValidId_returnsProfile() {
                // GIVEN
                UUID id = UUID.randomUUID();
                Instant createdAt = Instant.now();
                User buyer = User.builder()
                                .id(id)
                                .email("buyer@example.com")
                                .passwordHash(encoder.encode("BuyerPass1"))
                                .role(User.Role.BUYER)
                                .createdAt(createdAt)
                                .build();

                when(userRepository.findById(id)).thenReturn(Optional.of(buyer));

                // WHEN
                var response = authService.getCurrentUser(id.toString());

                // THEN
                assertEquals(id, response.id());
                assertEquals("buyer@example.com", response.email());
                assertEquals("BUYER", response.role());
                assertEquals(createdAt, response.createdAt());
        }
}
