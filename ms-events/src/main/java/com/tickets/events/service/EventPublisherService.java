package com.tickets.events.service;

import com.tickets.events.config.RabbitMQConfig;
import com.tickets.events.dto.EventCancelledMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    public void publishEventCancelled(EventCancelledMessage message) {
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.EVENTS_EXCHANGE,
                RabbitMQConfig.EVENT_CANCELLED_ROUTING_KEY,
                message
            );
            log.info("Published event.cancelled for eventId={}", message.eventId());
        } catch (Exception ex) {
            log.error("Failed to publish event.cancelled for eventId={}: {}", message.eventId(), ex.getMessage(), ex);
        }
    }
}
