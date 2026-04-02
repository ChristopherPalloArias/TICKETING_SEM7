package com.tickets.events.model;

public enum SeatStatus {
    AVAILABLE,    // Disponible para reservar
    RESERVED,     // Bloqueado por reserva temporal (10 min)
    SOLD          // Vendido (pago confirmado)
}
