import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRooms } from '../hooks/useRooms';

vi.mock('../services/adminEventService');
vi.mock('../hooks/useAuth');

import * as adminEventService from '../services/adminEventService';
import { useAuth } from '../hooks/useAuth';

const mockGetAllRooms = vi.mocked(adminEventService.getAllRooms);
const mockUseAuth = vi.mocked(useAuth);

describe('useRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'ADMIN',
      userId: 'user-1',
      email: 'admin@sem7.com',
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('loads rooms on mount', async () => {
    mockGetAllRooms.mockResolvedValue([
      { id: 'r1', name: 'Teatro Real', maxCapacity: 300 },
      { id: 'r2', name: 'Grand Opera', maxCapacity: 500 },
    ]);

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockGetAllRooms.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRooms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.rooms).toHaveLength(0);
  });
});
