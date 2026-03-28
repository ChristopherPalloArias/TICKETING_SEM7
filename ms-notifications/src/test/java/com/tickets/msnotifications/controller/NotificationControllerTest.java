package com.tickets.msnotifications.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.msnotifications.dto.*;
import com.tickets.msnotifications.model.NotificationType;
import com.tickets.msnotifications.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @Autowired
    private ObjectMapper objectMapper;

    private final UUID BUYER_ID = UUID.randomUUID();

    // --- GET /buyer/{buyerId} — happy path 200 ---
    @Test
    void getByBuyerId_shouldReturn200WithPagedNotifications() throws Exception {
        // GIVEN
        NotificationResponse dto = new NotificationResponse(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                BUYER_ID, "PAYMENT_FAILED", "Fondos insuficientes", "PROCESSED",
                false, false, "Hamlet", Instant.now());
        PagedNotificationResponse paged = new PagedNotificationResponse(
                List.of(dto), 0, 20, 1, 1);
        when(notificationService.getByBuyerId(eq(BUYER_ID), eq(0), eq(20))).thenReturn(paged);

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].read", is(false)))
                .andExpect(jsonPath("$.content[0].eventName", is("Hamlet")))
                .andExpect(jsonPath("$.content[0].archived", is(false)))
                .andExpect(jsonPath("$.totalElements", is(1)));
    }

    // --- GET /buyer/{buyerId} — empty list ---
    @Test
    void getByBuyerId_shouldReturn200WithEmptyListWhenNoNotifications() throws Exception {
        // GIVEN
        PagedNotificationResponse paged = new PagedNotificationResponse(
                Collections.emptyList(), 0, 20, 0, 0);
        when(notificationService.getByBuyerId(eq(BUYER_ID), eq(0), eq(20))).thenReturn(paged);

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    // --- GET /buyer/{buyerId} — invalid UUID → 400 ---
    @Test
    void getByBuyerId_shouldReturn400ForInvalidUuid() throws Exception {
        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}", "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    // --- PATCH /buyer/{buyerId}/read-all — happy path 200 ---
    @Test
    void markAllRead_shouldReturn200WithUpdatedCount() throws Exception {
        // GIVEN
        when(notificationService.markAllReadByBuyerId(BUYER_ID)).thenReturn(3);

        // WHEN & THEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/read-all", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount", is(3)));
    }

    // --- PATCH /buyer/{buyerId}/read-all — idempotent ---
    @Test
    void markAllRead_shouldReturn200WithZeroWhenAlreadyRead() throws Exception {
        // GIVEN
        when(notificationService.markAllReadByBuyerId(BUYER_ID)).thenReturn(0);

        // WHEN & THEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/read-all", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount", is(0)));
    }

    // --- GET /buyer/{buyerId}/unread-count — happy path ---
    @Test
    void getUnreadCount_shouldReturn200WithCorrectCount() throws Exception {
        // GIVEN
        when(notificationService.countUnreadByBuyerId(BUYER_ID)).thenReturn(3L);

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}/unread-count", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(3)));
    }

    // --- GET /buyer/{buyerId}/unread-count — zero ---
    @Test
    void getUnreadCount_shouldReturn200WithZeroWhenNoNotifications() throws Exception {
        // GIVEN
        when(notificationService.countUnreadByBuyerId(BUYER_ID)).thenReturn(0L);

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}/unread-count", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(0)));
    }

    // --- PATCH /buyer/{buyerId}/archive-all — happy path 200 ---
    @Test
    void archiveAll_shouldReturn200WithArchivedCount() throws Exception {
        // GIVEN
        when(notificationService.archiveAllByBuyerId(BUYER_ID)).thenReturn(4);

        // WHEN & THEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/archive-all", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedCount", is(4)));
    }

    // --- PATCH /buyer/{buyerId}/archive-all — idempotent ---
    @Test
    void archiveAll_shouldReturn200WithZeroWhenAlreadyArchived() throws Exception {
        // GIVEN
        when(notificationService.archiveAllByBuyerId(BUYER_ID)).thenReturn(0);

        // WHEN & THEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/archive-all", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedCount", is(0)));
    }

    // --- Response DTO includes read and eventName ---
    @Test
    void getByBuyerId_responseShouldIncludeReadAndEventNameFields() throws Exception {
        // GIVEN
        NotificationResponse dto = new NotificationResponse(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                BUYER_ID, "RESERVATION_EXPIRED", "RESERVATION_EXPIRED", "PROCESSED",
                true, false, "Romeo y Julieta", Instant.now());
        PagedNotificationResponse paged = new PagedNotificationResponse(
                List.of(dto), 0, 20, 1, 1);
        when(notificationService.getByBuyerId(eq(BUYER_ID), eq(0), eq(20))).thenReturn(paged);

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/notifications/buyer/{buyerId}", BUYER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].read", is(true)))
                .andExpect(jsonPath("$.content[0].eventName", is("Romeo y Julieta")))
                .andExpect(jsonPath("$.content[0].type", is("RESERVATION_EXPIRED")))
                .andExpect(jsonPath("$.content[0].status", is("PROCESSED")));
    }

    // --- Verify service delegation for mark-all-read ---
    @Test
    void markAllRead_shouldDelegateToServiceWithCorrectBuyerId() throws Exception {
        // GIVEN
        when(notificationService.markAllReadByBuyerId(BUYER_ID)).thenReturn(2);

        // WHEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/read-all", BUYER_ID))
                .andExpect(status().isOk());

        // THEN
        verify(notificationService).markAllReadByBuyerId(BUYER_ID);
    }

    // --- Verify service delegation for archive-all ---
    @Test
    void archiveAll_shouldDelegateToServiceWithCorrectBuyerId() throws Exception {
        // GIVEN
        when(notificationService.archiveAllByBuyerId(BUYER_ID)).thenReturn(2);

        // WHEN
        mockMvc.perform(patch("/api/v1/notifications/buyer/{buyerId}/archive-all", BUYER_ID))
                .andExpect(status().isOk());

        // THEN
        verify(notificationService).archiveAllByBuyerId(BUYER_ID);
    }
}
