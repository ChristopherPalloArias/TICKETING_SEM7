package com.tickets.gateway.service;

import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.exception.ConflictException;
import com.tickets.gateway.exception.UnauthorizedException;
import com.tickets.gateway.model.User;
import com.tickets.gateway.repository.UserRepository;
import com.tickets.gateway.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = new BCryptPasswordEncoder(10);
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

    public String encodePassword(String raw) {
        return passwordEncoder.encode(raw);
    }
}
