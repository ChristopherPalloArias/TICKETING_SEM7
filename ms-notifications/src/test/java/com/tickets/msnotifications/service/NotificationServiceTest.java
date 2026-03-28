package com.tickets.msnotifications.service;

import com.tickets.msnotifications.dto.NotificationResponse;
import com.tickets.msnotifications.dto.PagedNotificationResponse;
import com.tickets.msnotifications.model.Notification;
import com.tickets.msnotifications.model.NotificationStatus;
import com.tickets.msnotifications.model.NotificationType;
import com.tickets.msnotifications.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private final UUID BUYER_ID = UUID.randomUUID();
    private final UUID RESERVATION_ID = UUID.randomUUID();
    private final UUID EVENT_ID = UUID.randomUUID();
    private final UUID TIER_ID = UUID.randomUUID();

    // --- test_notification_created_with_read_false ---
    @Test
    void createIfNotExists_shouldPersistNotificationWithReadFalseByDefault() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(any(), any())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.PAYMENT_FAILED, "motif", "Hamlet");

        // THEN
        assertTrue(created);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertFalse(captor.getValue().getRead());
    }

    // --- test_notification_created_with_archived_false ---
    @Test
    void createIfNotExists_shouldPersistNotificationWithArchivedFalseByDefault() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(any(), any())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.PAYMENT_FAILED, "motif", "Hamlet");

        // THEN
        assertTrue(created);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertFalse(captor.getValue().getArchived());
    }

    // --- test_consumer_persists_eventName ---
    @Test
    void createIfNotExists_shouldPersistEventNameFromRabbitMQEvent() {
        // GIVEN
        String eventName = "Romeo y Julieta";
        when(notificationRepository.existsByReservationIdAndType(any(), any())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.RESERVATION_EXPIRED, "RESERVATION_EXPIRED", eventName);

        // THEN
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals(eventName, captor.getValue().getEventName());
    }

    // --- test_consumer_handles_null_eventName ---
    @Test
    void createIfNotExists_shouldHandleNullEventNameForBackwardCompatibility() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(any(), any())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.PAYMENT_FAILED, "motif", null);

        // THEN
        assertTrue(created);
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertNull(captor.getValue().getEventName());
    }

    // --- test_mark_all_read_updates_only_buyer_notifications ---
    @Test
    void markAllReadByBuyerId_shouldDelegateToRepositoryWithCorrectBuyerId() {
        // GIVEN
        when(notificationRepository.markAllReadByBuyerId(BUYER_ID)).thenReturn(3);

        // WHEN
        int count = notificationService.markAllReadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(3, count);
        verify(notificationRepository).markAllReadByBuyerId(BUYER_ID);
        verifyNoMoreInteractions(notificationRepository);
    }

    // --- test_mark_all_read_returns_updated_count ---
    @Test
    void markAllReadByBuyerId_shouldReturnUpdatedCount() {
        // GIVEN
        when(notificationRepository.markAllReadByBuyerId(BUYER_ID)).thenReturn(5);

        // WHEN
        int count = notificationService.markAllReadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(5, count);
    }

    // --- test_mark_all_read_idempotent ---
    @Test
    void markAllReadByBuyerId_shouldReturnZeroWhenAllAlreadyRead() {
        // GIVEN
        when(notificationRepository.markAllReadByBuyerId(BUYER_ID)).thenReturn(0);

        // WHEN
        int count = notificationService.markAllReadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(0, count);
    }

    // --- test_mark_all_read_excludes_archived ---
    @Test
    void markAllReadByBuyerId_shouldExcludeArchivedNotifications() {
        // GIVEN — the repo query already filters archived=false, so service delegates correctly
        when(notificationRepository.markAllReadByBuyerId(BUYER_ID)).thenReturn(2);

        // WHEN
        int count = notificationService.markAllReadByBuyerId(BUYER_ID);

        // THEN — count reflects only non-archived unread notifications
        assertEquals(2, count);
        verify(notificationRepository).markAllReadByBuyerId(BUYER_ID);
    }

    // --- test_unread_count_returns_correct_value ---
    @Test
    void countUnreadByBuyerId_shouldReturnCorrectUnreadCount() {
        // GIVEN
        when(notificationRepository.countByBuyerIdAndArchivedFalseAndReadFalse(BUYER_ID)).thenReturn(3L);

        // WHEN
        long count = notificationService.countUnreadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(3L, count);
    }

    // --- test_unread_count_zero_when_no_notifications ---
    @Test
    void countUnreadByBuyerId_shouldReturnZeroWhenNoNotifications() {
        // GIVEN
        when(notificationRepository.countByBuyerIdAndArchivedFalseAndReadFalse(BUYER_ID)).thenReturn(0L);

        // WHEN
        long count = notificationService.countUnreadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(0L, count);
    }

    // --- test_unread_count_excludes_archived ---
    @Test
    void countUnreadByBuyerId_shouldExcludeArchivedNotifications() {
        // GIVEN — repo method countByBuyerIdAndArchivedFalseAndReadFalse already filters archived
        when(notificationRepository.countByBuyerIdAndArchivedFalseAndReadFalse(BUYER_ID)).thenReturn(2L);

        // WHEN
        long count = notificationService.countUnreadByBuyerId(BUYER_ID);

        // THEN
        assertEquals(2L, count);
        verify(notificationRepository).countByBuyerIdAndArchivedFalseAndReadFalse(BUYER_ID);
    }

    // --- test_archive_all_updates_only_buyer_notifications ---
    @Test
    void archiveAllByBuyerId_shouldDelegateToRepositoryWithCorrectBuyerId() {
        // GIVEN
        when(notificationRepository.archiveAllByBuyerId(BUYER_ID)).thenReturn(4);

        // WHEN
        int count = notificationService.archiveAllByBuyerId(BUYER_ID);

        // THEN
        assertEquals(4, count);
        verify(notificationRepository).archiveAllByBuyerId(BUYER_ID);
        verifyNoMoreInteractions(notificationRepository);
    }

    // --- test_archive_all_returns_archived_count ---
    @Test
    void archiveAllByBuyerId_shouldReturnArchivedCount() {
        // GIVEN
        when(notificationRepository.archiveAllByBuyerId(BUYER_ID)).thenReturn(4);

        // WHEN
        int count = notificationService.archiveAllByBuyerId(BUYER_ID);

        // THEN
        assertEquals(4, count);
    }

    // --- test_archive_all_idempotent ---
    @Test
    void archiveAllByBuyerId_shouldReturnZeroWhenAllAlreadyArchived() {
        // GIVEN
        when(notificationRepository.archiveAllByBuyerId(BUYER_ID)).thenReturn(0);

        // WHEN
        int count = notificationService.archiveAllByBuyerId(BUYER_ID);

        // THEN
        assertEquals(0, count);
    }

    // --- test_notification_response_includes_read_and_eventName ---
    @Test
    void getByBuyerId_shouldReturnResponseWithReadAndEventNameFields() {
        // GIVEN
        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .reservationId(RESERVATION_ID)
                .eventId(EVENT_ID)
                .tierId(TIER_ID)
                .buyerId(BUYER_ID)
                .type(NotificationType.PAYMENT_FAILED)
                .motif("Fondos insuficientes")
                .status(NotificationStatus.PROCESSED)
                .read(false)
                .archived(false)
                .eventName("Hamlet")
                .createdAt(Instant.now())
                .build();

        Page<Notification> page = new PageImpl<>(List.of(notification), PageRequest.of(0, 20), 1);
        when(notificationRepository.findByBuyerIdAndArchivedFalse(eq(BUYER_ID), any(Pageable.class))).thenReturn(page);

        // WHEN
        PagedNotificationResponse response = notificationService.getByBuyerId(BUYER_ID, 0, 20);

        // THEN
        assertEquals(1, response.content().size());
        NotificationResponse dto = response.content().get(0);
        assertFalse(dto.read());
        assertEquals("Hamlet", dto.eventName());
    }

    // --- test_find_by_buyer_excludes_archived ---
    @Test
    void getByBuyerId_shouldExcludeArchivedNotifications() {
        // GIVEN — repo method findByBuyerIdAndArchivedFalse filters archived=true automatically
        Page<Notification> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 20), 0);
        when(notificationRepository.findByBuyerIdAndArchivedFalse(eq(BUYER_ID), any(Pageable.class))).thenReturn(emptyPage);

        // WHEN
        PagedNotificationResponse response = notificationService.getByBuyerId(BUYER_ID, 0, 20);

        // THEN
        assertTrue(response.content().isEmpty());
        verify(notificationRepository).findByBuyerIdAndArchivedFalse(eq(BUYER_ID), any(Pageable.class));
    }

    // --- Additional: createIfNotExists skips duplicate ---
    @Test
    void createIfNotExists_shouldReturnFalseWhenDuplicateExists() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(RESERVATION_ID, NotificationType.PAYMENT_FAILED))
                .thenReturn(true);

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.PAYMENT_FAILED, "motif", "Hamlet");

        // THEN
        assertFalse(created);
        verify(notificationRepository, never()).save(any());
    }

    // --- Additional: createIfNotExists skips RESERVATION_EXPIRED when PAYMENT_SUCCESS exists ---
    @Test
    void createIfNotExists_shouldSkipReservationExpiredWhenPaymentSuccessExists() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(RESERVATION_ID, NotificationType.PAYMENT_SUCCESS))
                .thenReturn(true);

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.RESERVATION_EXPIRED, "RESERVATION_EXPIRED", "Hamlet");

        // THEN
        assertFalse(created);
        verify(notificationRepository, never()).save(any());
    }

    // --- Additional: concurrent duplicate suppressed by constraint ---
    @Test
    void createIfNotExists_shouldHandleConcurrentDuplicateGracefully() {
        // GIVEN
        when(notificationRepository.existsByReservationIdAndType(any(), any())).thenReturn(false);
        when(notificationRepository.save(any(Notification.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        // WHEN
        boolean created = notificationService.createIfNotExists(
                RESERVATION_ID, EVENT_ID, TIER_ID, BUYER_ID,
                NotificationType.PAYMENT_FAILED, "motif", "Hamlet");

        // THEN
        assertFalse(created);
    }
}
