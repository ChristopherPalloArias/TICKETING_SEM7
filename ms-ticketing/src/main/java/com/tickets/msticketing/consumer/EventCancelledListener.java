package com.tickets.msticketing.consumer;

import com.tickets.msticketing.config.RabbitMQConfig;
import com.tickets.msticketing.dto.EventCancelledMessage;
import com.tickets.msticketing.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventCancelledListener {

    private final ReservationService reservationService;

    @RabbitListener(queues = RabbitMQConfig.EVENT_CANCELLED_QUEUE)
    public void onEventCancelled(EventCancelledMessage message) {
        if (message == null || message.eventId() == null) {
            log.warn("Received invalid event.cancelled message — skipping");
            return;
        }
        log.info("Received event.cancelled for eventId={}, title='{}'",
            message.eventId(), message.eventTitle());
        try {
            reservationService.expireReservationsByEvent(message.eventId());
        } catch (Exception ex) {
            log.error("Error expiring reservations for eventId={}: {}", message.eventId(), ex.getMessage(), ex);
            throw ex;
        }
    }
}
