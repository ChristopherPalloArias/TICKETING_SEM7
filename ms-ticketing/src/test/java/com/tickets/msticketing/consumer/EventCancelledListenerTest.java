package com.tickets.msticketing.consumer;

import com.tickets.msticketing.dto.EventCancelledMessage;
import com.tickets.msticketing.service.ReservationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EventCancelledListenerTest {

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private EventCancelledListener eventCancelledListener;

    @Test
    void testOnEventCancelled_withValidPayload_expiresPendingReservations() {
        UUID eventId = UUID.randomUUID();
        EventCancelledMessage message = new EventCancelledMessage(
            eventId,
            "Hamlet",
            "Cancelado por fuerza mayor",
            LocalDateTime.now()
        );

        eventCancelledListener.onEventCancelled(message);

        verify(reservationService).expireReservationsByEvent(eventId);
    }

    @Test
    void testOnEventCancelled_withInvalidPayload_skipsProcessing() {
        EventCancelledMessage message = new EventCancelledMessage(
            null,
            "Hamlet",
            "Cancelado",
            LocalDateTime.now()
        );

        eventCancelledListener.onEventCancelled(message);

        verify(reservationService, never()).expireReservationsByEvent(any(UUID.class));
    }

    @Test
    void testOnEventCancelled_withNullMessage_skipsProcessing() {
        eventCancelledListener.onEventCancelled(null);

        verify(reservationService, never()).expireReservationsByEvent(any(UUID.class));
    }
}
