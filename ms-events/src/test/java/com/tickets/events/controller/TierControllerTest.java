package com.tickets.events.controller;

import com.tickets.events.dto.TierResponse;
import com.tickets.events.exception.EventNotFoundException;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.exception.InvalidEventStateException;
import com.tickets.events.exception.QuotaExceedsCapacityException;
import com.tickets.events.exception.TierNotFoundException;
import com.tickets.events.model.TierType;
import com.tickets.events.service.TierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TierController.class)
@TestPropertySource(properties = "service.auth.secret=test-secret")
class TierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TierService tierService;

    private static final String ADMIN_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_VIP_BODY = """
            {"tierType":"VIP","price":120.00,"quota":50}
            """;

    private TierResponse buildTierResponse(TierType tierType, int quota) {
        return new TierResponse(
                UUID.randomUUID(),
                tierType,
                BigDecimal.valueOf(120.00),
                quota,
                null,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    // ======================== POST /{eventId}/tiers/add ========================

    @Test
    void test_addSingleTier_returns_201_on_success() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        when(tierService.addSingleTier(eq(eventId), any(), eq("ADMIN"), any()))
                .thenReturn(buildTierResponse(TierType.VIP, 50));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_VIP_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tierType").value("VIP"))
                .andExpect(jsonPath("$.quota").value(50));
    }

    @Test
    void test_addSingleTier_returns_403_when_role_is_not_admin() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        when(tierService.addSingleTier(any(), any(), eq("USER"), any()))
                .thenThrow(new ForbiddenAccessException("Only users with X-Role: ADMIN can configure tiers"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "USER")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_VIP_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void test_addSingleTier_returns_404_when_event_not_found() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        when(tierService.addSingleTier(eq(eventId), any(), eq("ADMIN"), any()))
                .thenThrow(new EventNotFoundException("Event with id '" + eventId + "' does not exist"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_VIP_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("EVENT_NOT_FOUND"));
    }

    @Test
    void test_addSingleTier_returns_409_when_event_not_draft() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        when(tierService.addSingleTier(eq(eventId), any(), eq("ADMIN"), any()))
                .thenThrow(new InvalidEventStateException("Event is not in DRAFT state", "PUBLISHED"));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_VIP_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_EVENT_STATE"));
    }

    @Test
    void test_addSingleTier_returns_400_when_quota_exceeds_capacity() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        when(tierService.addSingleTier(eq(eventId), any(), eq("ADMIN"), any()))
                .thenThrow(new QuotaExceedsCapacityException(
                        "Total quota (210) exceeds event capacity (200)", 210, 200));

        // WHEN / THEN
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_VIP_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("QUOTA_EXCEEDS_CAPACITY"));
    }

    @Test
    void test_addSingleTier_returns_400_when_request_body_is_invalid() throws Exception {
        // GIVEN — quota = 0 violates @Min(1)
        UUID eventId = UUID.randomUUID();
        String invalidBody = """
                {"tierType":"VIP","price":120.00,"quota":0}
                """;

        // WHEN / THEN — Bean Validation rejects before service is called
        mockMvc.perform(post("/api/v1/events/{eventId}/tiers/add", eventId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    // ======================== DELETE /{eventId}/tiers/{tierId} ========================

    @Test
    void test_deleteSingleTier_returns_204_on_success() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        UUID tierId = UUID.randomUUID();
        doNothing().when(tierService).deleteSingleTier(eq(eventId), eq(tierId), eq("ADMIN"), any());

        // WHEN / THEN
        mockMvc.perform(delete("/api/v1/events/{eventId}/tiers/{tierId}", eventId, tierId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID))
                .andExpect(status().isNoContent());
    }

    @Test
    void test_deleteSingleTier_returns_403_when_role_is_not_admin() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        UUID tierId = UUID.randomUUID();
        doThrow(new ForbiddenAccessException("Only users with X-Role: ADMIN can configure tiers"))
                .when(tierService).deleteSingleTier(any(), any(), eq("USER"), any());

        // WHEN / THEN
        mockMvc.perform(delete("/api/v1/events/{eventId}/tiers/{tierId}", eventId, tierId)
                        .header("X-Role", "USER")
                        .header("X-User-Id", ADMIN_USER_ID))
                .andExpect(status().isForbidden());
    }

    @Test
    void test_deleteSingleTier_returns_404_when_tier_not_found() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        UUID tierId = UUID.randomUUID();
        doThrow(new TierNotFoundException("Tier '" + tierId + "' not found for event '" + eventId + "'"))
                .when(tierService).deleteSingleTier(eq(eventId), eq(tierId), eq("ADMIN"), any());

        // WHEN / THEN
        mockMvc.perform(delete("/api/v1/events/{eventId}/tiers/{tierId}", eventId, tierId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("TIER_NOT_FOUND"));
    }

    @Test
    void test_deleteSingleTier_returns_409_when_event_not_draft() throws Exception {
        // GIVEN
        UUID eventId = UUID.randomUUID();
        UUID tierId = UUID.randomUUID();
        doThrow(new InvalidEventStateException("Event is not in DRAFT state", "PUBLISHED"))
                .when(tierService).deleteSingleTier(eq(eventId), eq(tierId), eq("ADMIN"), any());

        // WHEN / THEN
        mockMvc.perform(delete("/api/v1/events/{eventId}/tiers/{tierId}", eventId, tierId)
                        .header("X-Role", "ADMIN")
                        .header("X-User-Id", ADMIN_USER_ID))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_EVENT_STATE"));
    }
}
