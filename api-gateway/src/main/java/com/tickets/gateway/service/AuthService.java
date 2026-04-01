package com.tickets.gateway.service;

import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.dto.UserProfileResponse;
import com.tickets.gateway.dto.UserRegisteredEvent;
import com.tickets.gateway.exception.BadRequestException;
import com.tickets.gateway.exception.ConflictException;
import com.tickets.gateway.exception.UnauthorizedException;
import com.tickets.gateway.model.User;
import com.tickets.gateway.repository.UserRepository;
import com.tickets.gateway.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AuthService {

    private static final Pattern PASSWORD_PATTERN =
        Pattern.compile("^(?=.*[A-Z])(?=.*[0-9]).{8,}$");

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthEventPublisher authEventPublisher;

    public AuthService(UserRepository userRepository, JwtService jwtService, AuthEventPublisher authEventPublisher) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = new BCryptPasswordEncoder(10);
        this.authEventPublisher = authEventPublisher;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        String token = jwtService.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        return new LoginResponse(token, jwtService.getExpirationMs() / 1000, user.getRole().name());
    }

    @Transactional
    public RegisterResponse register(String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("El email ya está registrado");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(User.Role.ADMIN)
                .build();

        User saved = userRepository.save(user);
        log.info("New admin registered: {}", email);

        return new RegisterResponse(saved.getId(), saved.getEmail(), saved.getRole().name(), saved.getCreatedAt());
    }

    @Transactional
    public LoginResponse registerBuyer(String email, String password) {
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BadRequestException(
                "La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula y al menos 1 número"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("El email ya está registrado");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(User.Role.BUYER)
                .build();

        User saved = userRepository.save(user);
        log.info("New buyer registered: {}", email);

        // Publicar evento para que ms-ticketing asocie tickets anónimos
        authEventPublisher.publishUserRegistered(new UserRegisteredEvent(
            saved.getId(),
            saved.getEmail(),
            saved.getRole().name(),
            LocalDateTime.now(ZoneOffset.UTC)
        ));

        String token = jwtService.generateToken(
                saved.getId().toString(),
                saved.getEmail(),
                saved.getRole().name()
        );

        return new LoginResponse(token, 28800L, saved.getRole().name());
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(String userId) {
        UUID id = UUID.fromString(userId);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getRole().name(), user.getCreatedAt());
    }

    public String encodePassword(String raw) {
        return passwordEncoder.encode(raw);
    }

    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        UUID id = UUID.fromString(userId);
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));

        // Validate current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        // Validate new password complexity
        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new BadRequestException(
                "La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula y al menos 1 número"
            );
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed for user: {}", user.getEmail());
    }
}

