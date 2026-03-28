package com.tickets.events.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tickets.events.dto.TierCreateRequest;
import com.tickets.events.dto.TierResponse;
import com.tickets.events.exception.EventNotFoundException;
import com.tickets.events.exception.ForbiddenAccessException;
import com.tickets.events.exception.InvalidEventStateException;
import com.tickets.events.exception.QuotaExceedsCapacityException;
import com.tickets.events.exception.TierNotFoundException;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Tier;
import com.tickets.events.model.TierType;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.IdempotencyKeyRepository;
import com.tickets.events.repository.TierRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TierServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TierRepository tierRepository;

    @Mock
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TierService tierService;

    // --- helpers ---

    private Event buildEvent(EventStatus status, int capacity) {
        Event event = new Event();
        event.setId(UUID.randomUUID());
        event.setCapacity(capacity);
        event.setStatus(status);
        return event;
    }

    private Tier buildTier(UUID eventId, TierType tierType, int quota) {
        Tier tier = new Tier();
        tier.setId(UUID.randomUUID());
        tier.setEventId(eventId);
        tier.setTierType(tierType);
        tier.setPrice(BigDecimal.valueOf(100.00));
        tier.setQuota(quota);
        tier.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        tier.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        return tier;
    }

    private TierCreateRequest vipRequest(int quota) {
        return new TierCreateRequest(TierType.VIP, BigDecimal.valueOf(120.00), quota, null, null);
    }

    // ======================== addSingleTier ========================

    @Test
    void test_addSingleTier_success() {
        // GIVEN
        Event event = buildEvent(EventStatus.DRAFT, 200);
        Tier saved = buildTier(event.getId(), TierType.VIP, 50);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tierRepository.findByEventId(event.getId())).thenReturn(List.of());
        when(tierRepository.save(any(Tier.class))).thenReturn(saved);

        // WHEN
        TierResponse result = tierService.addSingleTier(event.getId(), vipRequest(50), "ADMIN", "user-id");

        // THEN
        assertThat(result.tierType()).isEqualTo(TierType.VIP);
    }

    @Test
    void test_addSingleTier_quotaExceedsCapacity() {
        // GIVEN — capacity=200, existing=150, new=60 → total=210 > 200
        Event event = buildEvent(EventStatus.DRAFT, 200);
        Tier existing = buildTier(event.getId(), TierType.GENERAL, 150);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tierRepository.findByEventId(event.getId())).thenReturn(List.of(existing));

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.addSingleTier(event.getId(), vipRequest(60), "ADMIN", "user-id"))
                .isInstanceOf(QuotaExceedsCapacityException.class);
    }

    @Test
    void test_addSingleTier_eventNotDraft() {
        // GIVEN — event is PUBLISHED, not DRAFT
        Event event = buildEvent(EventStatus.PUBLISHED, 200);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.addSingleTier(event.getId(), vipRequest(50), "ADMIN", "user-id"))
                .isInstanceOf(InvalidEventStateException.class);
    }

    @Test
    void test_addSingleTier_eventNotFound() {
        // GIVEN — unknown event id
        UUID unknownId = UUID.randomUUID();
        when(eventRepository.findById(unknownId)).thenReturn(Optional.empty());

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.addSingleTier(unknownId, vipRequest(50), "ADMIN", "user-id"))
                .isInstanceOf(EventNotFoundException.class);
    }

    @Test
    void test_addSingleTier_forbiddenNonAdmin() {
        // GIVEN — role is USER (not ADMIN); validateAdminRole runs before retrieveEvent
        UUID eventId = UUID.randomUUID();

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.addSingleTier(eventId, vipRequest(50), "USER", "user-id"))
                .isInstanceOf(ForbiddenAccessException.class);
    }

    @Test
    void test_addSingleTier_earlyBirdWithDates() {
        // GIVEN — EARLY_BIRD tier with future validFrom / validUntil
        Event event = buildEvent(EventStatus.DRAFT, 200);
        LocalDateTime from = LocalDateTime.now(ZoneOffset.UTC).plusDays(1);
        LocalDateTime until = LocalDateTime.now(ZoneOffset.UTC).plusDays(10);
        TierCreateRequest request = new TierCreateRequest(
                TierType.EARLY_BIRD, BigDecimal.valueOf(50.00), 30, from, until);
        Tier saved = buildTier(event.getId(), TierType.EARLY_BIRD, 30);
        saved.setValidFrom(from);
        saved.setValidUntil(until);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tierRepository.findByEventId(event.getId())).thenReturn(List.of());
        when(tierRepository.save(any(Tier.class))).thenReturn(saved);

        // WHEN
        TierResponse result = tierService.addSingleTier(event.getId(), request, "ADMIN", "user-id");

        // THEN
        assertThat(result.validFrom()).isEqualTo(from);
    }

    // ======================== deleteSingleTier ========================

    @Test
    void test_deleteSingleTier_success() {
        // GIVEN
        Event event = buildEvent(EventStatus.DRAFT, 200);
        Tier tier = buildTier(event.getId(), TierType.VIP, 50);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tierRepository.findByIdAndEventId(tier.getId(), event.getId())).thenReturn(Optional.of(tier));

        // WHEN
        tierService.deleteSingleTier(event.getId(), tier.getId(), "ADMIN", "user-id");

        // THEN
        verify(tierRepository).delete(tier);
    }

    @Test
    void test_deleteSingleTier_tierNotFound() {
        // GIVEN — tierId does not exist for this event
        Event event = buildEvent(EventStatus.DRAFT, 200);
        UUID unknownTierId = UUID.randomUUID();
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(tierRepository.findByIdAndEventId(unknownTierId, event.getId())).thenReturn(Optional.empty());

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.deleteSingleTier(event.getId(), unknownTierId, "ADMIN", "user-id"))
                .isInstanceOf(TierNotFoundException.class);
    }

    @Test
    void test_deleteSingleTier_eventNotDraft() {
        // GIVEN — event is PUBLISHED, not DRAFT
        Event event = buildEvent(EventStatus.PUBLISHED, 200);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.deleteSingleTier(event.getId(), UUID.randomUUID(), "ADMIN", "user-id"))
                .isInstanceOf(InvalidEventStateException.class);
    }

    @Test
    void test_deleteSingleTier_forbiddenNonAdmin() {
        // GIVEN — role is USER (not ADMIN); validateAdminRole runs before retrieveEvent
        UUID eventId = UUID.randomUUID();
        UUID tierId = UUID.randomUUID();

        // WHEN / THEN
        assertThatThrownBy(() -> tierService.deleteSingleTier(eventId, tierId, "USER", "user-id"))
                .isInstanceOf(ForbiddenAccessException.class);
    }
}
