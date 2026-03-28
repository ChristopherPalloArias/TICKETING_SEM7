package com.tickets.msnotifications.consumer;

import com.rabbitmq.client.Channel;
import com.tickets.msnotifications.dto.TicketExpiredEvent;
import com.tickets.msnotifications.dto.TicketPaidEvent;
import com.tickets.msnotifications.dto.TicketPaymentFailedEvent;
import com.tickets.msnotifications.model.NotificationType;
import com.tickets.msnotifications.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationConsumerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private Channel channel;

    @InjectMocks
    private TicketExpiredConsumer ticketExpiredConsumer;

    @InjectMocks
    private TicketPaymentFailedConsumer ticketPaymentFailedConsumer;

    @InjectMocks
    private TicketPaidConsumer ticketPaidConsumer;

    private final long DELIVERY_TAG = 1L;
    private final UUID RESERVATION_ID = UUID.randomUUID();
    private final UUID EVENT_ID = UUID.randomUUID();
    private final UUID TIER_ID = UUID.randomUUID();
    private final UUID BUYER_ID = UUID.randomUUID();

    // ===================== TicketExpiredConsumer =====================

    // --- test_consumer_persists_eventName ---
    @Test
    void ticketExpired_shouldPersistEventNameFromEvent() throws IOException {
        // GIVEN
        String eventName = "Romeo y Julieta";
        TicketExpiredEvent event = new TicketExpiredEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                LocalDateTime.now(), "1.0", eventName);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(true);

        // WHEN
        ticketExpiredConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.RESERVATION_EXPIRED),
                eq("RESERVATION_EXPIRED"),
                eq(eventName));
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    // --- test_consumer_handles_null_eventName ---
    @Test
    void ticketExpired_shouldHandleNullEventNameForBackwardCompatibility() throws IOException {
        // GIVEN
        TicketExpiredEvent event = new TicketExpiredEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                LocalDateTime.now(), "1.0", null);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), isNull()))
                .thenReturn(true);

        // WHEN
        ticketExpiredConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.RESERVATION_EXPIRED),
                eq("RESERVATION_EXPIRED"),
                isNull());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketExpired_shouldAckAndSkipWhenPayloadIsInvalid() throws IOException {
        // GIVEN — null reservationId
        TicketExpiredEvent event = new TicketExpiredEvent(
                null, EVENT_ID, TIER_ID, BUYER_ID,
                LocalDateTime.now(), "1.0", "Hamlet");

        // WHEN
        ticketExpiredConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService, never()).createIfNotExists(any(), any(), any(), any(), any(), any(), any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketExpired_shouldAckAndSkipWhenVersionUnsupported() throws IOException {
        // GIVEN
        TicketExpiredEvent event = new TicketExpiredEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                LocalDateTime.now(), "2.0", "Hamlet");

        // WHEN
        ticketExpiredConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService, never()).createIfNotExists(any(), any(), any(), any(), any(), any(), any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketExpired_shouldNackWhenServiceThrowsException() throws IOException {
        // GIVEN
        TicketExpiredEvent event = new TicketExpiredEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                LocalDateTime.now(), "1.0", "Hamlet");
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        // WHEN
        ticketExpiredConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(channel).basicNack(DELIVERY_TAG, false, false);
    }

    // ===================== TicketPaymentFailedConsumer =====================

    @Test
    void ticketPaymentFailed_shouldPersistEventNameFromEvent() throws IOException {
        // GIVEN
        String eventName = "Hamlet";
        TicketPaymentFailedEvent event = new TicketPaymentFailedEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                "Fondos insuficientes", LocalDateTime.now(), "1.0", eventName);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(true);

        // WHEN
        ticketPaymentFailedConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.PAYMENT_FAILED),
                eq("Fondos insuficientes"),
                eq(eventName));
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketPaymentFailed_shouldHandleNullEventName() throws IOException {
        // GIVEN
        TicketPaymentFailedEvent event = new TicketPaymentFailedEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                "Fondos insuficientes", LocalDateTime.now(), "1.0", null);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), isNull()))
                .thenReturn(true);

        // WHEN
        ticketPaymentFailedConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.PAYMENT_FAILED),
                eq("Fondos insuficientes"),
                isNull());
    }

    @Test
    void ticketPaymentFailed_shouldUseDefaultMotifWhenMotifIsNull() throws IOException {
        // GIVEN
        TicketPaymentFailedEvent event = new TicketPaymentFailedEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                null, LocalDateTime.now(), "1.0", "Hamlet");
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(true);

        // WHEN
        ticketPaymentFailedConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.PAYMENT_FAILED),
                eq("PAYMENT_FAILED"),
                eq("Hamlet"));
    }

    @Test
    void ticketPaymentFailed_shouldAckAndSkipWhenPayloadInvalid() throws IOException {
        // GIVEN
        TicketPaymentFailedEvent event = new TicketPaymentFailedEvent(
                null, EVENT_ID, TIER_ID, BUYER_ID,
                "motif", LocalDateTime.now(), "1.0", "Hamlet");

        // WHEN
        ticketPaymentFailedConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService, never()).createIfNotExists(any(), any(), any(), any(), any(), any(), any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    // ===================== TicketPaidConsumer =====================

    @Test
    void ticketPaid_shouldPersistEventNameFromEvent() throws IOException {
        // GIVEN
        String eventName = "El Fantasma de la Ópera";
        TicketPaidEvent event = new TicketPaidEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                BigDecimal.valueOf(50000), LocalDateTime.now(), "1.0", eventName);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(true);

        // WHEN
        ticketPaidConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.PAYMENT_SUCCESS),
                eq("PAYMENT_SUCCESS"),
                eq(eventName));
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketPaid_shouldHandleNullEventName() throws IOException {
        // GIVEN
        TicketPaidEvent event = new TicketPaidEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                BigDecimal.valueOf(50000), LocalDateTime.now(), "1.0", null);
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), isNull()))
                .thenReturn(true);

        // WHEN
        ticketPaidConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService).createIfNotExists(
                eq(RESERVATION_ID), eq(EVENT_ID), eq(TIER_ID), eq(BUYER_ID),
                eq(NotificationType.PAYMENT_SUCCESS),
                eq("PAYMENT_SUCCESS"),
                isNull());
    }

    @Test
    void ticketPaid_shouldAckAndSkipWhenPayloadInvalid() throws IOException {
        // GIVEN
        TicketPaidEvent event = new TicketPaidEvent(
                null, EVENT_ID, TIER_ID, BUYER_ID,
                BigDecimal.valueOf(50000), LocalDateTime.now(), "1.0", "Hamlet");

        // WHEN
        ticketPaidConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(notificationService, never()).createIfNotExists(any(), any(), any(), any(), any(), any(), any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void ticketPaid_shouldNackWhenServiceThrowsException() throws IOException {
        // GIVEN
        TicketPaidEvent event = new TicketPaidEvent(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                BigDecimal.valueOf(50000), LocalDateTime.now(), "1.0", "Hamlet");
        when(notificationService.createIfNotExists(any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        // WHEN
        ticketPaidConsumer.onMessage(event, channel, DELIVERY_TAG);

        // THEN
        verify(channel).basicNack(DELIVERY_TAG, false, false);
    }
}
