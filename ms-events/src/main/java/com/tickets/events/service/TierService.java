package com.tickets.events.service;

import com.tickets.events.dto.AvailableTierResponse;
import com.tickets.events.dto.TierConfigurationResponse;
import com.tickets.events.dto.TierCreateRequest;
import com.tickets.events.dto.TierResponse;
import com.tickets.events.exception.*;
import com.tickets.events.model.Event;
import com.tickets.events.model.EventStatus;
import com.tickets.events.model.Tier;
import com.tickets.events.model.TierType;
import com.tickets.events.repository.EventRepository;
import com.tickets.events.repository.TierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TierService {

    private final EventRepository eventRepository;
    private final TierRepository tierRepository;

    @Transactional
    public TierConfigurationResponse configureEventTiers(UUID eventId, List<TierCreateRequest> tierRequests, String role, String userId) {
        UUID safeEventId = Objects.requireNonNull(eventId, "eventId must not be null");
        validateAdminRole(role);
        Event event = retrieveEvent(safeEventId);
        validateDraftState(event);

        if (tierRepository.existsByEventId(safeEventId)) {
            throw new TiersAlreadyConfiguredException("Event already has tiers configured.");
        }

        validateTierRequests(tierRequests, event.getCapacity());

        List<Tier> tiers = tierRequests.stream()
            .map(request -> toEntity(event, request))
            .toList();

       Iterable<Tier> tiersToSave = java.util.Objects.requireNonNull(tiers, "tiers must not be null");
        List<Tier> savedTiers = tierRepository.saveAll(tiersToSave);
        
        return toConfigurationResponse(safeEventId, savedTiers);
    }

    public TierConfigurationResponse getEventTiers(UUID eventId) {
        UUID safeEventId = Objects.requireNonNull(eventId, "eventId must not be null");
        retrieveEvent(safeEventId);
        List<Tier> tiers = tierRepository.findByEventId(safeEventId);
        return toConfigurationResponse(safeEventId, tiers);
    }

    @Transactional
    public void deleteEventTiers(UUID eventId, String role, String userId) {
        UUID safeEventId = Objects.requireNonNull(eventId, "eventId must not be null");
        validateAdminRole(role);
        Event event = retrieveEvent(safeEventId);
        validateDraftState(event);
        tierRepository.deleteByEventId(safeEventId);
    }

    private void validateAdminRole(String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            throw new ForbiddenAccessException("Only users with X-Role: ADMIN can configure tiers");
        }
    }

    private Event retrieveEvent(UUID eventId) {
        UUID safeEventId = Objects.requireNonNull(eventId, "eventId must not be null");
        return eventRepository.findById(safeEventId)
            .orElseThrow(() -> new EventNotFoundException("Event with id '" + safeEventId + "' does not exist"));
    }

    private void validateDraftState(Event event) {
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new InvalidEventStateException(
                "Event with id '" + event.getId() + "' is not in DRAFT state",
                event.getStatus().name()
            );
        }
    }

    private void validateTierRequests(List<TierCreateRequest> tierRequests, Integer eventCapacity) {
        if (tierRequests == null || tierRequests.isEmpty()) {
            throw new InvalidTierConfigurationException("At least one tier must be provided.");
        }

        Set<TierType> seenTypes = new HashSet<>();
        int totalQuota = 0;

        for (TierCreateRequest request : tierRequests) {
            if (request.tierType() == null) {
                throw new InvalidTierConfigurationException("tierType must not be null");
            }

            if (!seenTypes.add(request.tierType())) {
                throw new InvalidTierConfigurationException("Duplicated tier type: " + request.tierType());
            }

            validatePrice(request.price());
            validateQuota(request.quota());
            validateTierValidity(request);

            totalQuota += request.quota();
        }

        if (totalQuota > eventCapacity) {
            throw new QuotaExceedsCapacityException(
                "Total quota (" + totalQuota + ") exceeds event capacity (" + eventCapacity + ")",
                totalQuota,
                eventCapacity
            );
        }
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPriceException("price must be greater than 0");
        }
    }

    private void validateQuota(Integer quota) {
        if (quota == null || quota <= 0) {
            throw new InvalidQuotaException("quota must be greater than 0");
        }
    }

    private void validateTierValidity(TierCreateRequest request) {
        LocalDateTime validFrom = request.validFrom();
        LocalDateTime validUntil = request.validUntil();

        if (request.tierType() != TierType.EARLY_BIRD) {
            if (validFrom != null || validUntil != null) {
                throw new InvalidTierConfigurationException("Only EARLY_BIRD tier can define validFrom and validUntil");
            }
            return;
        }

        boolean bothNull = validFrom == null && validUntil == null;
        boolean bothPresent = validFrom != null && validUntil != null;

        if (!bothNull && !bothPresent) {
            throw new InvalidEarlyBirdValidityException("Early Bird tier must define both validFrom and validUntil or neither");
        }

        if (bothPresent) {
            LocalDateTime safeValidFrom = Objects.requireNonNull(validFrom, "validFrom must not be null");
            LocalDateTime safeValidUntil = Objects.requireNonNull(validUntil, "validUntil must not be null");
            
            if (!safeValidFrom.isBefore(safeValidUntil)) {
                throw new InvalidEarlyBirdValidityException("Early Bird tier validFrom must be before validUntil");
            }

            LocalDateTime now = LocalDateTime.now();
            if (!safeValidFrom.isAfter(now) || !safeValidUntil.isAfter(now)) {
                throw new InvalidEarlyBirdValidityException("Early Bird validity dates must be in the future");
            }
        }
    }

    private Tier toEntity(Event event, TierCreateRequest request) {
        Tier tier = new Tier();
        tier.setEventId(event.getId());
        tier.setEvent(event);
        tier.setTierType(request.tierType());
        tier.setPrice(request.price());
        tier.setQuota(request.quota());
        tier.setValidFrom(request.validFrom());
        tier.setValidUntil(request.validUntil());
        return tier;
    }

    private TierConfigurationResponse toConfigurationResponse(UUID eventId, List<Tier> tiers) {
        List<TierResponse> tierResponses = tiers.stream()
            .map(this::toTierResponse)
            .toList();

        return new TierConfigurationResponse(eventId, tierResponses);
    }

    private TierResponse toTierResponse(Tier tier) {
        return new TierResponse(
            tier.getId(),
            tier.getTierType(),
            tier.getPrice(),
            tier.getQuota(),
            tier.getValidFrom(),
            tier.getValidUntil(),
            tier.getCreatedAt(),
            tier.getUpdatedAt()
        );
    }

    /**
     * Determines if a tier is available based on:
     * 1. quota > 0 (has available slots)
     * 2. Within temporal validity window (validFrom <= now <= validUntil, handling nulls)
     *
     * @param tier The tier to check
     * @return true if tier is available, false otherwise
     */
    public boolean isAvailable(Tier tier) {
        if (tier.getQuota() <= 0) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // Check validFrom: if null, no lower bound restriction
        if (tier.getValidFrom() != null && now.isBefore(tier.getValidFrom())) {
            return false;
        }
        
        // Check validUntil: if null, no upper bound restriction
        if (tier.getValidUntil() != null && now.isAfter(tier.getValidUntil())) {
            return false;
        }
        
        return true;
    }

    /**
     * Converts a Tier entity to AvailableTierResponse with availability status and reason
     *
     * @param tier The tier to convert
     * @return AvailableTierResponse with isAvailable and reason set
     */
    public AvailableTierResponse toAvailableTierResponse(Tier tier) {
        boolean available = isAvailable(tier);
        String reason = null;
        
        if (!available) {
            if (tier.getQuota() <= 0) {
                reason = "SOLD_OUT";
            } else if (tier.getValidUntil() != null && LocalDateTime.now().isAfter(tier.getValidUntil())) {
                reason = "EXPIRED";
            } else if (tier.getValidFrom() != null && LocalDateTime.now().isBefore(tier.getValidFrom())) {
                reason = "NOT_YET_AVAILABLE";
            }
        }
        
        return new AvailableTierResponse(
            tier.getId(),
            tier.getTierType(),
            tier.getPrice(),
            tier.getQuota(),
            tier.getValidFrom(),
            tier.getValidUntil(),
            available,
            reason
        );
    }
}