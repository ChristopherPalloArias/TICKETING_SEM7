import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUpdateItem = vi.fn();
const mockAddNotification = vi.fn();

vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({
    items: mockItems,
    updateItem: mockUpdateItem,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    activeItemCount: 0,
  }),
}));

vi.mock('../contexts/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: mockAddNotification,
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
    setPollingEnabled: vi.fn(),
  }),
}));

import { useCartExpirationWatcher } from '../hooks/useCartExpirationWatcher';
import type { CartItem } from '../types/cart.types';

let mockItems: CartItem[] = [];

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    eventId: 'evt-1',
    eventTitle: 'Hamlet',
    eventDate: '2026-07-15T20:00:00',
    eventRoom: 'Teatro Real',
    eventImageUrl: '',
    tierId: 'tier-1',
    tierType: 'VIP',
    tierPrice: 50000,
    quantity: 2,
    reservationId: 'res-1',
    validUntilAt: new Date(Date.now() + 600_000).toISOString(),
    email: '',
    addedAt: new Date().toISOString(),
    expired: false,
    expirationAlerted: false,
    ...overrides,
  };
}

describe('useCartExpirationWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockItems = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // SPEC test: [useCartExpirationWatcher] marks expired items
  it('marks expired items', () => {
    // GIVEN: item with validUntilAt in the past
    mockItems = [buildCartItem({ validUntilAt: new Date(Date.now() - 1000).toISOString() })];

    // WHEN: hook renders and runs initial check
    renderHook(() => useCartExpirationWatcher());

    // THEN: updateItem called with expired: true
    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', { expired: true });
    // And a notification is emitted
    expect(mockAddNotification).toHaveBeenCalledWith(
      'timer_expired',
      'Hamlet — VIP',
      'res-1',
      'evt-1',
    );
  });

  // SPEC test: [useCartExpirationWatcher] emits alert at < 2 minutes
  it('emits alert at < 2 minutes', () => {
    // GIVEN: item with 90s remaining (< 2 min) and not yet alerted
    mockItems = [
      buildCartItem({
        validUntilAt: new Date(Date.now() + 90_000).toISOString(),
        expirationAlerted: false,
      }),
    ];

    // WHEN: hook renders and runs initial check
    renderHook(() => useCartExpirationWatcher());

    // THEN: item flagged as alerted
    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', { expirationAlerted: true });
    // And warning notification emitted
    expect(mockAddNotification).toHaveBeenCalledWith(
      'timer_expired',
      'Hamlet — VIP expira en menos de 2 minutos',
      'res-1',
      'evt-1',
    );
  });

  it('does not alert again if expirationAlerted is already true', () => {
    // GIVEN: item already alerted
    mockItems = [
      buildCartItem({
        validUntilAt: new Date(Date.now() + 90_000).toISOString(),
        expirationAlerted: true,
      }),
    ];

    // WHEN
    renderHook(() => useCartExpirationWatcher());

    // THEN: no update or notification for this item
    expect(mockUpdateItem).not.toHaveBeenCalled();
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('does not trigger for items with plenty of time remaining', () => {
    // GIVEN: item with 5 min remaining
    mockItems = [buildCartItem({ validUntilAt: new Date(Date.now() + 300_000).toISOString() })];

    // WHEN
    renderHook(() => useCartExpirationWatcher());

    // THEN: no updates
    expect(mockUpdateItem).not.toHaveBeenCalled();
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('sets up interval that runs every 30 seconds', () => {
    // GIVEN: item with plenty of time
    mockItems = [buildCartItem({ validUntilAt: new Date(Date.now() + 300_000).toISOString() })];
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    renderHook(() => useCartExpirationWatcher());

    // THEN: setInterval called with 30_000 ms
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
    setIntervalSpy.mockRestore();
  });
});
