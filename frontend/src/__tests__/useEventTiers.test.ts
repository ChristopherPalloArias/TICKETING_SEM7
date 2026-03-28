import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventTiers } from '../hooks/admin/useEventTiers';

vi.mock('../services/adminEventService');
vi.mock('../hooks/useAuth');

import * as adminEventService from '../services/adminEventService';
import { useAuth } from '../hooks/useAuth';

const mockGetEventTiers = vi.mocked(adminEventService.getEventTiers);
const mockAddTier = vi.mocked(adminEventService.addTier);
const mockUseAuth = vi.mocked(useAuth);

const SAMPLE_TIER = {
  id: 't1',
  tierType: 'GENERAL' as const,
  price: 50000,
  quota: 100,
  validFrom: null,
  validUntil: null,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
};

describe('useEventTiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'ADMIN',
      userId: 'user-1',
      email: 'admin@sem7.com',
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  it('loads tiers on mount', async () => {
    // GIVEN
    mockGetEventTiers.mockResolvedValue({ eventId: 'event-1', tiers: [SAMPLE_TIER] });

    // WHEN
    const { result } = renderHook(() => useEventTiers('event-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // THEN
    expect(result.current.tiers).toHaveLength(1);
    expect(result.current.tiers[0].id).toBe('t1');
    expect(result.current.error).toBeNull();
  });

  it('addTier updates list without page reload', async () => {
    // GIVEN: one existing tier loaded on mount
    mockGetEventTiers.mockResolvedValue({ eventId: 'event-1', tiers: [SAMPLE_TIER] });
    const newTier = { ...SAMPLE_TIER, id: 't2', tierType: 'VIP' as const };
    mockAddTier.mockResolvedValue(newTier);

    const { result } = renderHook(() => useEventTiers('event-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // WHEN: addTier is called locally
    await act(async () => {
      await result.current.addTier({ tierType: 'VIP', price: 100000, quota: 50 });
    });

    // THEN: list grows and getEventTiers was NOT called a second time
    expect(result.current.tiers).toHaveLength(2);
    expect(result.current.tiers[1].id).toBe('t2');
    expect(mockGetEventTiers).toHaveBeenCalledTimes(1);
  });
});
