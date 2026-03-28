package com.tickets.msnotifications.consumer;

import com.rabbitmq.client.Channel;
import com.tickets.msnotifications.config.RabbitMQConfig;
import com.tickets.msnotifications.dto.TicketPaidEvent;
import com.tickets.msnotifications.model.NotificationType;
import com.tickets.msnotifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketPaidConsumer {

    private static final String SUPPORTED_VERSION = "1.0";

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.TICKET_PAID_QUEUE)
    public void onMessage(TicketPaidEvent event,
                          Channel channel,
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        if (!isValidPayload(event)) {
            log.warn("Invalid payload for ticket.paid event — ACKing without persisting. reservationId={}",
                event != null ? event.reservationId() : "null");
            channel.basicAck(deliveryTag, false);
            return;
        }

        if (event.version() != null && !SUPPORTED_VERSION.equals(event.version())) {
            log.warn("Unsupported version={} for ticket.paid event reservationId={}", event.version(), event.reservationId());
            channel.basicAck(deliveryTag, false);
            return;
        }

        try {
            notificationService.createIfNotExists(
                event.reservationId(),
                event.eventId(),
                event.tierId(),
                event.buyerId(),
                NotificationType.PAYMENT_SUCCESS,
                NotificationType.PAYMENT_SUCCESS.name(),
                event.eventName()
            );
            channel.basicAck(deliveryTag, false);
            log.info("ticket.paid processed: reservationId={} buyerId={}", event.reservationId(), event.buyerId());
        } catch (Exception ex) {
            log.error("Error processing ticket.paid: reservationId={} error={}", event.reservationId(), ex.getMessage(), ex);
            channel.basicNack(deliveryTag, false, false); // requeue=false → routes to DLQ after exhausted retries
        }
    }

    private boolean isValidPayload(TicketPaidEvent event) {
        return event != null
            && event.reservationId() != null
            && event.eventId() != null
            && event.tierId() != null
            && event.buyerId() != null;
    }
}
