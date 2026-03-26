package com.tickets.msticketing.service;

import com.tickets.msticketing.config.RabbitMQConfig;
import com.tickets.msticketing.dto.TicketExpiredEvent;
import com.tickets.msticketing.dto.TicketPaymentFailedEvent;
import com.tickets.msticketing.dto.TicketPaidEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQPublisherService {

    private final RabbitTemplate rabbitTemplate;

    public void publishTicketPaidEvent(TicketPaidEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.TICKETS_EXCHANGE,
                RabbitMQConfig.TICKET_PAID_ROUTING_KEY,
                event
            );
            log.info("Published ticket.paid event for reservation={}", event.reservationId());
        } catch (Exception ex) {
            log.error("Error publishing ticket.paid event: {}", ex.getMessage(), ex);
        }
    }

    public void publishTicketPaymentFailedEvent(TicketPaymentFailedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.TICKETS_EXCHANGE,
                RabbitMQConfig.TICKET_FAILED_ROUTING_KEY,
                event
            );
            log.info("Published ticket.payment_failed event for reservation={}", event.reservationId());
        } catch (Exception ex) {
            log.error("Error publishing ticket.payment_failed event: {}", ex.getMessage(), ex);
        }
    }

    public void publishTicketExpiredEvent(TicketExpiredEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.TICKETS_EXCHANGE,
                RabbitMQConfig.TICKET_EXPIRED_ROUTING_KEY,
                event
            );
            log.info("Published ticket.expired event for reservation={}", event.reservationId());
        } catch (Exception ex) {
            log.error("Error publishing ticket.expired event: {}", ex.getMessage(), ex);
        }
    }
}
