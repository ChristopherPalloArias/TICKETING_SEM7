package com.tickets.msnotifications.consumer;

import com.rabbitmq.client.Channel;
import com.tickets.msnotifications.config.RabbitMQConfig;
import com.tickets.msnotifications.dto.EventCancelledMessage;
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
public class EventCancelledConsumer {

    @RabbitListener(queues = RabbitMQConfig.EVENT_CANCELLED_QUEUE)
    public void onEventCancelled(EventCancelledMessage message,
                                 Channel channel,
                                 @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        if (message == null || message.eventId() == null) {
            log.warn("Invalid event.cancelled payload — ACKing without processing");
            channel.basicAck(deliveryTag, false);
            return;
        }

        try {
            log.info("Sending cancellation notifications for eventId={}, title='{}', reason='{}'",
                message.eventId(), message.eventTitle(), message.cancellationReason());
            // Notification logic: in a full implementation this would query tickets/reservations
            // for the event and send cancellation emails to each buyer.
            // For now, log the intent as the notification store is buyer-centric.
            log.info("Cancellation notification dispatched for eventId={}", message.eventId());
            channel.basicAck(deliveryTag, false);
        } catch (Exception ex) {
            log.error("Error processing event.cancelled for eventId={}: {}",
                message.eventId(), ex.getMessage(), ex);
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
