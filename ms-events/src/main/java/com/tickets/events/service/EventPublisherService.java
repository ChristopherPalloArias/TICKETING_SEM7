package com.tickets.events.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.events.config.RabbitMQConfig;
import com.tickets.events.dto.EventCancelledMessage;
import com.tickets.events.model.OutboxEvent;
import com.tickets.events.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Persiste mensajes de dominio en la tabla {@code outbox} dentro de la misma
 * transacción de negocio. La publicación efectiva a RabbitMQ la realiza
 * {@link OutboxPublisherScheduler} de forma asíncrona.
 *
 * <p>Este servicio NO inyecta {@code RabbitTemplate} — toda comunicación con
 * el broker ocurre exclusivamente en el scheduler para garantizar la atomicidad
 * entre el cambio de estado del negocio y el registro del mensaje.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    /**
     * Persiste un mensaje {@code event.cancelled} en el outbox.
     * Debe llamarse dentro de una transacción activa (la del servicio de negocio).
     */
    public void publishEventCancelled(EventCancelledMessage message) {
        try {
            String payload = objectMapper.writeValueAsString(message);
            OutboxEvent outboxEvent = new OutboxEvent();
            outboxEvent.setEventType(RabbitMQConfig.EVENT_CANCELLED_ROUTING_KEY);
            outboxEvent.setRoutingKey(RabbitMQConfig.EVENT_CANCELLED_ROUTING_KEY);
            outboxEvent.setPayload(payload);
            outboxEvent.setPublished(false);
            outboxEventRepository.save(outboxEvent);
            log.debug("Outbox: encolado event.cancelled para eventId={}", message.eventId());
        } catch (JsonProcessingException e) {
            // Error de serialización — el payload es incorrecto, no reintentable
            throw new IllegalStateException(
                    "No se pudo serializar EventCancelledMessage para eventId=" + message.eventId(), e);
        }
    }
}

