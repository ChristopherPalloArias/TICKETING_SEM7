import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminStats } from '../hooks/useAdminStats';

vi.mock('../services/adminEventService');
vi.mock('../hooks/useAuth');

import * as adminEventService from '../services/adminEventService';
import { useAuth } from '../hooks/useAuth';

const mockGetAdminStats = vi.mocked(adminEventService.getAdminStats);
const mockUseAuth = vi.mocked(useAuth);

const mockAuthAdmin = {
  isAuthenticated: true,
  isLoading: false,
  role: 'ADMIN' as const,
  userId: 'admin-1',
  email: 'admin@sem7.com',
  token: 'tok',
  login: vi.fn(),
  logout: vi.fn(),
  registerBuyer: vi.fn(),
};

const mockStats = {
  totalEvents: 10,
  publishedEvents: 7,
  totalTicketsSold: 250,
  activeReservations: 15,
};

describe('useAdminStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthAdmin);
  });

  it('starts with loading true and null stats', () => {
    // GIVEN service never resolves (pending)
    mockGetAdminStats.mockReturnValue(new Promise(() => {}));

    // WHEN hook mounts
    const { result } = renderHook(() => useAdminStats());

    // THEN initial state is loading
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and sets stats on successful load', async () => {
    // GIVEN service resolves with stats
    mockGetAdminStats.mockResolvedValue(mockStats);

    // WHEN hook mounts
    const { result } = renderHook(() => useAdminStats());

    // THEN stats are loaded
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('calls getAdminStats exactly once on mount', async () => {
    // GIVEN
    mockGetAdminStats.mockResolvedValue(mockStats);

    // WHEN
    renderHook(() => useAdminStats());

    // THEN
    await waitFor(() => expect(mockGetAdminStats).toHaveBeenCalledTimes(1));
  });

  it('sets error message when fetch fails', async () => {
    // GIVEN service rejects
    mockGetAdminStats.mockRejectedValue(new Error('Connection refused'));

    // WHEN
    const { result } = renderHook(() => useAdminStats());

    // THEN error is set and loading is false
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Connection refused');
    expect(result.current.stats).toBeNull();
  });

  it('sets fallback error message when error has no message', async () => {
    // GIVEN service rejects with non-Error object
    mockGetAdminStats.mockRejectedValue('something went wrong');

    // WHEN
    const { result } = renderHook(() => useAdminStats());

    // THEN uses fallback message
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error al cargar estadísticas');
  });

  it('does not fetch when userId is null', async () => {
    // GIVEN user not authenticated
    mockUseAuth.mockReturnValue({ ...mockAuthAdmin, userId: null });

    // WHEN hook mounts
    const { result } = renderHook(() => useAdminStats());

    // THEN service never called
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetAdminStats).not.toHaveBeenCalled();
    expect(result.current.stats).toBeNull();
  });

  it('refetches stats when refetch is called', async () => {
    // GIVEN initial load succeeds
    mockGetAdminStats.mockResolvedValue({ ...mockStats, totalEvents: 5 });
    const { result } = renderHook(() => useAdminStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // WHEN refetch is called with updated data
    mockGetAdminStats.mockResolvedValue({ ...mockStats, totalEvents: 20 });
    await result.current.refetch();

    // THEN stats are updated
    await waitFor(() => expect(result.current.stats?.totalEvents).toBe(20));
    expect(mockGetAdminStats).toHaveBeenCalledTimes(2);
  });

  it('sets loading true during refetch', async () => {
    // GIVEN initial load done
    mockGetAdminStats.mockResolvedValue(mockStats);
    const { result } = renderHook(() => useAdminStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // WHEN refetch starts
    let resolveRefetch!: (v: typeof mockStats) => void;
    mockGetAdminStats.mockReturnValue(
      new Promise<typeof mockStats>((res) => { resolveRefetch = res; })
    );
    result.current.refetch();

    // THEN loading is true while pending
    await waitFor(() => expect(result.current.loading).toBe(true));

    // cleanup
    resolveRefetch(mockStats);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
