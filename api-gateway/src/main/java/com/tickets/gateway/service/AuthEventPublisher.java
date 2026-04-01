package com.tickets.gateway.service;

import com.tickets.gateway.config.RabbitMQConfig;
import com.tickets.gateway.dto.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Publica el evento user.registered al exchange auth.exchange
 * para que ms-ticketing asocie tickets anónimos al nuevo usuario.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishUserRegistered(UserRegisteredEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.AUTH_EXCHANGE,
                RabbitMQConfig.USER_REGISTERED_ROUTING_KEY,
                event
            );
            log.info("Published user.registered event for userId={}, email={}", event.userId(), event.email());
        } catch (Exception e) {
            log.error("Failed to publish user.registered event for email={}: {}", event.email(), e.getMessage(), e);
            // No lanzar excepción — el registro ya fue exitoso; la asociación puede hacerse luego
        }
    }
}
