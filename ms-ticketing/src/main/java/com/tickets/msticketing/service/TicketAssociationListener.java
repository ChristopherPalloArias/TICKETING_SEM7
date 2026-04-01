package com.tickets.msticketing.service;

import com.tickets.msticketing.dto.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listener para el evento user.registered publicado por api-gateway.
 * Asocia tickets anónimos (sin userId) al usuario que acaba de registrarse.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TicketAssociationListener {

    private final ReservationService reservationService;

    @RabbitListener(queues = "ticketing.user.registered", ackMode = "AUTO")
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Received user.registered event: userId={}, email={}", event.userId(), event.email());
        try {
            reservationService.associateAnonymousTickets(event.userId(), event.email());
            log.info("Successfully associated anonymous tickets for user={}", event.userId());
        } catch (Exception ex) {
            log.error("Error associating anonymous tickets for user={}: {}", event.userId(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to associate anonymous tickets", ex);
        }
    }
}
