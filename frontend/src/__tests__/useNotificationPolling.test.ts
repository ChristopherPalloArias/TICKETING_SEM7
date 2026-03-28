import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationPolling } from '../hooks/useNotificationPolling';

vi.mock('../services/notificationService');

import { fetchNotifications, fetchUnreadCount } from '../services/notificationService';

const mockFetchNotifications = vi.mocked(fetchNotifications);
const mockFetchUnreadCount = vi.mocked(fetchUnreadCount);

const BUYER_ID = 'buyer-123';

describe('useNotificationPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFetchNotifications.mockResolvedValue({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    });
    mockFetchUnreadCount.mockResolvedValue({ unreadCount: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls every 30 seconds', async () => {
    // GIVEN: hook rendered with polling enabled
    renderHook(() => useNotificationPolling({ buyerId: BUYER_ID, enabled: true }));

    // WHEN: initial poll completes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // THEN: first call made immediately
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
    expect(mockFetchUnreadCount).toHaveBeenCalledTimes(1);

    // WHEN: 30 seconds advance
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    // THEN: second poll
    expect(mockFetchNotifications).toHaveBeenCalledTimes(2);

    // WHEN: another 30 seconds advance
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    // THEN: third poll
    expect(mockFetchNotifications).toHaveBeenCalledTimes(3);
  });

  it('stops when disabled', async () => {
    // GIVEN: polling initially enabled
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useNotificationPolling({ buyerId: BUYER_ID, enabled }),
      { initialProps: { enabled: true } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);

    // WHEN: polling disabled
    rerender({ enabled: false });

    // THEN: no more calls after 60 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
  });
});
