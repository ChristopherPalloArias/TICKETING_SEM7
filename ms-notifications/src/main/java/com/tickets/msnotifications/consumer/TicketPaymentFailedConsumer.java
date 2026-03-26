package com.tickets.msnotifications.consumer;

import com.rabbitmq.client.Channel;
import com.tickets.msnotifications.config.RabbitMQConfig;
import com.tickets.msnotifications.dto.TicketPaymentFailedEvent;
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
public class TicketPaymentFailedConsumer {

    private static final String SUPPORTED_VERSION = "1.0";

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.TICKET_FAILED_QUEUE)
    public void onMessage(TicketPaymentFailedEvent event,
                          Channel channel,
                          @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        if (!isValidPayload(event)) {
            log.warn("Invalid payload for ticket.payment_failed event — ACKing without persisting. reservationId={}",
                event != null ? event.reservationId() : "null");
            channel.basicAck(deliveryTag, false);
            return;
        }

        if (event.version() != null && !SUPPORTED_VERSION.equals(event.version())) {
            log.warn("Unsupported version={} for ticket.payment_failed event reservationId={}", event.version(), event.reservationId());
            channel.basicAck(deliveryTag, false);
            return;
        }

        String motif = event.motif() != null ? event.motif() : NotificationType.PAYMENT_FAILED.name();

        try {
            notificationService.createIfNotExists(
                event.reservationId(),
                event.eventId(),
                event.tierId(),
                event.buyerId(),
                NotificationType.PAYMENT_FAILED,
                motif
            );
            channel.basicAck(deliveryTag, false);
            log.info("ticket.payment_failed processed: reservationId={} buyerId={}", event.reservationId(), event.buyerId());
        } catch (Exception ex) {
            log.error("Error processing ticket.payment_failed: reservationId={} error={}", event.reservationId(), ex.getMessage(), ex);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    private boolean isValidPayload(TicketPaymentFailedEvent event) {
        return event != null
            && event.reservationId() != null
            && event.eventId() != null
            && event.tierId() != null
            && event.buyerId() != null;
    }
}
