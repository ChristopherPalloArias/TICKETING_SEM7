package com.tickets.gateway.controller;

import com.tickets.gateway.dto.BuyerRegisterRequest;
import com.tickets.gateway.dto.LoginRequest;
import com.tickets.gateway.dto.LoginResponse;
import com.tickets.gateway.dto.RegisterRequest;
import com.tickets.gateway.dto.RegisterResponse;
import com.tickets.gateway.dto.UserProfileResponse;
import com.tickets.gateway.security.RateLimitService;
import com.tickets.gateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    public AuthController(AuthService authService, RateLimitService rateLimitService) {
        this.authService = authService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, ServerHttpRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        if (!rateLimitService.tryConsume(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ErrorResponse("Demasiados intentos. Intente de nuevo más tarde"));
        }
        LoginResponse response = authService.login(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/buyer")
    public ResponseEntity<LoginResponse> registerBuyer(@Valid @RequestBody BuyerRegisterRequest request) {
        LoginResponse response = authService.registerBuyer(request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserProfileResponse profile = authService.getCurrentUser(userId);
        return ResponseEntity.ok(profile);
    }

    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddress() != null
                ? request.getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
    }

    public record ErrorResponse(String error) {}
}
