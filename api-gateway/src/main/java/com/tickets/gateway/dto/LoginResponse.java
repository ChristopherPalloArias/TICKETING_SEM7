package com.tickets.gateway.dto;

public record LoginResponse(
    String token,
    long expiresIn,
    String role
) {}
