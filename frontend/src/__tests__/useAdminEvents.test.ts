import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminEvents } from '../hooks/useAdminEvents';

vi.mock('../services/adminEventService');
vi.mock('../hooks/useAuth');

import * as adminEventService from '../services/adminEventService';
import { useAuth } from '../hooks/useAuth';

const mockGetAllEvents = vi.mocked(adminEventService.getAllEvents);
const mockUseAuth = vi.mocked(useAuth);

describe('useAdminEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
      role: 'ADMIN',
      userId: 'user-1',
      email: 'admin@sem7.com',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      registerBuyer: vi.fn(),
    });
  });

  it('loads events on mount', async () => {
    mockGetAllEvents.mockResolvedValue({
      content: [{
        id: 'e1',
        title: 'Show',
        description: 'Desc',
        date: '2026-07-01T20:00:00',
        capacity: 200,
        status: 'PUBLISHED',
        room: { id: 'r1', name: 'Teatro Real', maxCapacity: 300 },
        availableTiers: [],
        createdBy: 'admin',
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 10,
    });

    const { result } = renderHook(() => useAdminEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe('Show');
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockGetAllEvents.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAdminEvents());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.events).toHaveLength(0);
  });
});
