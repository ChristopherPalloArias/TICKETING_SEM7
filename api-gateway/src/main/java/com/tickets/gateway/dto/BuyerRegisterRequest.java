package com.tickets.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record BuyerRegisterRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
