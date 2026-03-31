import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CartProvider, useCart } from '../contexts/CartContext';
import type { CartItem } from '../types/cart.types';

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    eventId: 'evt-1',
    eventTitle: 'Hamlet',
    eventDate: '2026-07-15T20:00:00',
    eventRoom: 'Teatro Real',
    eventImageUrl: 'https://img.test/hamlet.jpg',
    tierId: 'tier-1',
    tierType: 'VIP',
    tierPrice: 50000,
    quantity: 2,
    reservationId: 'res-1',
    validUntilAt: new Date(Date.now() + 600_000).toISOString(),
    email: 'buyer@test.com',
    addedAt: new Date().toISOString(),
    expired: false,
    expirationAlerted: false,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // SPEC test: [CartContext] adds item to cart correctly
  it('adds item to cart correctly', () => {
    // GIVEN: empty cart
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);

    // WHEN: add an item
    act(() => {
      result.current.addItem(buildCartItem());
    });

    // THEN: item is in the cart
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].eventTitle).toBe('Hamlet');
  });

  // SPEC test: [CartContext] rejects duplicate eventId+tierId
  it('rejects duplicate eventId+tierId', () => {
    // GIVEN: one item in cart
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(buildCartItem());
    });
    expect(result.current.items).toHaveLength(1);

    // WHEN: try to add same eventId+tierId
    act(() => {
      result.current.addItem(buildCartItem({ id: 'item-dup' }));
    });

    // THEN: still only 1 item (duplicate rejected by cartService)
    expect(result.current.items).toHaveLength(1);
  });

  // SPEC test: [CartContext] enforces max 5 items limit
  it('enforces max 5 items limit', () => {
    // GIVEN: empty cart
    const { result } = renderHook(() => useCart(), { wrapper });

    // WHEN: add 6 distinct items
    act(() => {
      for (let i = 0; i < 6; i++) {
        result.current.addItem(
          buildCartItem({ id: `item-${i}`, eventId: `evt-${i}`, tierId: `tier-${i}` }),
        );
      }
    });

    // THEN: only 5 items stored
    expect(result.current.items).toHaveLength(5);
  });

  // SPEC test: [CartContext] removes item and updates count
  it('removes item and updates count', () => {
    // GIVEN: two items
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(buildCartItem({ id: 'item-1', eventId: 'evt-1', tierId: 'tier-1' }));
      result.current.addItem(buildCartItem({ id: 'item-2', eventId: 'evt-2', tierId: 'tier-2' }));
    });
    expect(result.current.items).toHaveLength(2);

    // WHEN: remove one item
    act(() => {
      result.current.removeItem('item-1');
    });

    // THEN: count is 1, correct item remains
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('item-2');
    expect(result.current.activeItemCount).toBe(1);
  });

  // SPEC test: [CartContext] persists to localStorage
  it('persists items to localStorage', () => {
    // GIVEN: empty cart
    const { result } = renderHook(() => useCart(), { wrapper });

    // WHEN: add an item
    act(() => {
      result.current.addItem(buildCartItem());
    });

    // THEN: localStorage has the item
    const stored = JSON.parse(localStorage.getItem('sem7_shopping_cart')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].eventTitle).toBe('Hamlet');
  });

  // SPEC test: [CartContext] loads items from localStorage on mount
  it('loads items from localStorage on mount', () => {
    // GIVEN: items already in localStorage
    const items = [buildCartItem()];
    localStorage.setItem('sem7_shopping_cart', JSON.stringify(items));

    // WHEN: mount CartProvider
    const { result } = renderHook(() => useCart(), { wrapper });

    // THEN: items are loaded
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].eventTitle).toBe('Hamlet');
  });

  it('activeItemCount excludes expired items', () => {
    // GIVEN: one active, one expired item
    localStorage.setItem(
      'sem7_shopping_cart',
      JSON.stringify([
        buildCartItem({ id: 'active', expired: false }),
        buildCartItem({ id: 'expired', eventId: 'evt-2', tierId: 'tier-2', expired: true }),
      ]),
    );

    // WHEN
    const { result } = renderHook(() => useCart(), { wrapper });

    // THEN
    expect(result.current.activeItemCount).toBe(1);
  });

  it('clearCart empties items and localStorage', () => {
    // GIVEN: items in cart
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(buildCartItem());
    });
    expect(result.current.items).toHaveLength(1);

    // WHEN
    act(() => {
      result.current.clearCart();
    });

    // THEN
    expect(result.current.items).toHaveLength(0);
    // clearCart removes the key, but useEffect re-saves the empty array
    const stored = localStorage.getItem('sem7_shopping_cart');
    expect(stored === null || stored === '[]').toBe(true);
  });

  it('updateItem modifies specific fields', () => {
    // GIVEN: one item in cart
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(buildCartItem());
    });

    // WHEN: mark expired
    act(() => {
      result.current.updateItem('item-1', { expired: true });
    });

    // THEN
    expect(result.current.items[0].expired).toBe(true);
  });

  it('throws error when useCart is used outside CartProvider', () => {
    // GIVEN/WHEN: render hook without provider
    // THEN: should throw
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');
  });
});
