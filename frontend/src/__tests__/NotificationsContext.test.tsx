import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';

vi.mock('../hooks/useNotificationPolling');
vi.mock('../services/notificationService');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    token: null,
    role: null,
    userId: null,
    email: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    registerBuyer: vi.fn(),
  }),
}));

import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { markAllRead, archiveAll } from '../services/notificationService';

const mockUseNotificationPolling = vi.mocked(useNotificationPolling);
const mockMarkAllRead = vi.mocked(markAllRead);
const mockArchiveAll = vi.mocked(archiveAll);

function wrapper({ children }: { children: ReactNode }) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}

describe('NotificationsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotificationPolling.mockReturnValue({
      backendNotifications: [],
      unreadCount: 0,
      isPolling: false,
    });
    mockMarkAllRead.mockResolvedValue({ updatedCount: 0 });
    mockArchiveAll.mockResolvedValue({ archivedCount: 0 });
  });

  it('deduplicates local and backend notifications', () => {
    // GIVEN: backend has PAYMENT_FAILED for reservation R-001
    mockUseNotificationPolling.mockReturnValue({
      backendNotifications: [
        {
          id: 'backend-1',
          reservationId: 'R-001',
          eventId: 'E-001',
          tierId: 'T-001',
          buyerId: 'buyer-1',
          type: 'PAYMENT_FAILED',
          motif: 'Rejected',
          status: 'PROCESSED',
          read: false,
          archived: false,
          eventName: 'Hamlet',
          createdAt: '2026-03-28T10:00:00Z',
        },
      ],
      unreadCount: 1,
      isPolling: false,
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // WHEN: add local notification for same reservation + type
    act(() => {
      result.current.addNotification('payment_rejected', 'Hamlet', 'R-001');
    });

    // THEN: deduplicated — only backend version remains
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('backend-1');
  });

  it('merges and sorts by timestamp desc', () => {
    // GIVEN: backend with two notifications at different timestamps
    mockUseNotificationPolling.mockReturnValue({
      backendNotifications: [
        {
          id: 'backend-1',
          reservationId: 'R-001',
          eventId: 'E-001',
          tierId: 'T-001',
          buyerId: 'buyer-1',
          type: 'PAYMENT_FAILED',
          motif: 'Rejected',
          status: 'PROCESSED',
          read: false,
          archived: false,
          eventName: 'Hamlet',
          createdAt: '2026-03-28T08:00:00Z',
        },
        {
          id: 'backend-2',
          reservationId: 'R-002',
          eventId: 'E-002',
          tierId: 'T-002',
          buyerId: 'buyer-1',
          type: 'RESERVATION_EXPIRED',
          motif: 'Expired',
          status: 'PROCESSED',
          read: false,
          archived: false,
          eventName: 'Romeo y Julieta',
          createdAt: '2026-03-28T10:00:00Z',
        },
      ],
      unreadCount: 2,
      isPolling: false,
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    // WHEN: add a local notification (different reservation — no dedup)
    act(() => {
      result.current.addNotification('payment_rejected', 'Otelo', 'R-003');
    });

    // THEN: all 3 present, sorted by timestamp descending
    expect(result.current.notifications).toHaveLength(3);
    const timestamps = result.current.notifications.map((n) => n.timestamp.getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });

  it('restores state on archiveAll failure (optimistic rollback)', async () => {
    // GIVEN: local notification exists, archiveAll will fail
    mockArchiveAll.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification('payment_rejected', 'Hamlet', 'R-001');
    });
    expect(result.current.notifications).toHaveLength(1);

    // WHEN: clearAll triggers optimistic remove + backend archive (which fails)
    act(() => {
      result.current.clearAll();
    });

    // THEN: after rejection, local notifications are restored
    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });
    expect(result.current.notifications[0].eventTitle).toBe('Hamlet');

    consoleSpy.mockRestore();
  });
});
