package com.tickets.gateway.service;

import com.tickets.gateway.config.RabbitMQConfig;
import com.tickets.gateway.dto.UserRegisteredEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthEventPublisherTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private AuthEventPublisher authEventPublisher;

    private UserRegisteredEvent buildEvent() {
        return new UserRegisteredEvent(
            UUID.randomUUID(),
            "buyer@example.com",
            "BUYER",
            LocalDateTime.now()
        );
    }

    // ── publishUserRegistered — happy path ────────────────────────────────────

    @Test
    void publishUserRegistered_sendsToCorrectExchangeAndRoutingKey() {
        // GIVEN
        UserRegisteredEvent event = buildEvent();

        // WHEN
        authEventPublisher.publishUserRegistered(event);

        // THEN
        verify(rabbitTemplate).convertAndSend(
            eq(RabbitMQConfig.AUTH_EXCHANGE),
            eq(RabbitMQConfig.USER_REGISTERED_ROUTING_KEY),
            eq(event)
        );
    }

    @Test
    void publishUserRegistered_sendsCorrectPayload() {
        // GIVEN
        UUID userId = UUID.randomUUID();
        UserRegisteredEvent event = new UserRegisteredEvent(userId, "test@mail.com", "BUYER", LocalDateTime.now());
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);

        // WHEN
        authEventPublisher.publishUserRegistered(event);

        // THEN
        verify(rabbitTemplate).convertAndSend(any(String.class), any(String.class), captor.capture());
        UserRegisteredEvent captured = (UserRegisteredEvent) captor.getValue();
        assertThat(captured.userId()).isEqualTo(userId);
        assertThat(captured.email()).isEqualTo("test@mail.com");
        assertThat(captured.role()).isEqualTo("BUYER");
    }

    // ── publishUserRegistered — manejo graceful de errores ────────────────────

    @Test
    void publishUserRegistered_doesNotThrow_whenRabbitMQFails() {
        // GIVEN — RabbitMQ no disponible
        UserRegisteredEvent event = buildEvent();
        doThrow(new AmqpException("Connection refused"))
            .when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));

        // WHEN / THEN — no debe propagarse la excepción al caller
        assertDoesNotThrow(() -> authEventPublisher.publishUserRegistered(event));
    }

    @Test
    void publishUserRegistered_doesNotThrow_whenUnexpectedExceptionOccurs() {
        // GIVEN — excepción inesperada de runtime
        UserRegisteredEvent event = buildEvent();
        doThrow(new RuntimeException("Unexpected"))
            .when(rabbitTemplate).convertAndSend(any(String.class), any(String.class), any(Object.class));

        // WHEN / THEN — degradación graceful
        assertDoesNotThrow(() -> authEventPublisher.publishUserRegistered(event));
    }

    @Test
    void publishUserRegistered_usesAuthExchangeConstant() {
        // GIVEN
        UserRegisteredEvent event = buildEvent();
        ArgumentCaptor<String> exchangeCaptor = ArgumentCaptor.forClass(String.class);

        // WHEN
        authEventPublisher.publishUserRegistered(event);

        // THEN
        verify(rabbitTemplate).convertAndSend(exchangeCaptor.capture(), any(String.class), any(Object.class));
        assertThat(exchangeCaptor.getValue()).isEqualTo("auth.exchange");
    }

    @Test
    void publishUserRegistered_usesUserRegisteredRoutingKey() {
        // GIVEN
        UserRegisteredEvent event = buildEvent();
        ArgumentCaptor<String> routingKeyCaptor = ArgumentCaptor.forClass(String.class);

        // WHEN
        authEventPublisher.publishUserRegistered(event);

        // THEN
        verify(rabbitTemplate).convertAndSend(any(String.class), routingKeyCaptor.capture(), any(Object.class));
        assertThat(routingKeyCaptor.getValue()).isEqualTo("user.registered");
    }
}
