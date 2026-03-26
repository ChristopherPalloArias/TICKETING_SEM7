package com.tickets.msticketing.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.msticketing.config.RabbitMQConfig;
import com.tickets.msticketing.dto.TicketExpiredEvent;
import com.tickets.msticketing.dto.TicketPaymentFailedEvent;
import com.tickets.msticketing.dto.TicketPaidEvent;
import com.tickets.msticketing.model.OutboxEvent;
import com.tickets.msticketing.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void publishTicketPaidEvent(TicketPaidEvent event) {
        persistToOutbox(RabbitMQConfig.TICKET_PAID_ROUTING_KEY, "ticket.paid", event);
        log.info("Queued ticket.paid event in outbox for reservation={}", event.reservationId());
    }

    public void publishTicketPaymentFailedEvent(TicketPaymentFailedEvent event) {
        persistToOutbox(RabbitMQConfig.TICKET_FAILED_ROUTING_KEY, "ticket.payment_failed", event);
        log.info("Queued ticket.payment_failed event in outbox for reservation={}", event.reservationId());
    }

    public void publishTicketExpiredEvent(TicketExpiredEvent event) {
        persistToOutbox(RabbitMQConfig.TICKET_EXPIRED_ROUTING_KEY, "ticket.expired", event);
        log.info("Queued ticket.expired event in outbox for reservation={}", event.reservationId());
    }

    private void persistToOutbox(String routingKey, String eventType, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                .eventType(eventType)
                .routingKey(routingKey)
                .payload(json)
                .published(false)
                .build();
            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event of type={} for outbox: {}", eventType, e.getMessage(), e);
            throw new IllegalStateException("Could not serialize domain event for outbox", e);
        }
    }
}

