import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCartItems,
  saveCartItems,
  addCartItem,
  removeCartItem,
  updateCartItem,
  clearCart,
} from '../services/cartService';
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

describe('cartService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // SPEC test: [cartService] getCartItems returns empty array for new key
  it('getCartItems returns empty array when localStorage has no cart key', () => {
    // GIVEN: localStorage is empty
    // WHEN
    const items = getCartItems();
    // THEN
    expect(items).toEqual([]);
  });

  it('getCartItems returns empty array when localStorage has invalid JSON', () => {
    // GIVEN: corrupted data in localStorage
    localStorage.setItem('sem7_shopping_cart', '{not-valid-json');
    // WHEN
    const items = getCartItems();
    // THEN
    expect(items).toEqual([]);
  });

  // SPEC test: [cartService] saveCartItems persists to localStorage
  it('saveCartItems persists items to localStorage', () => {
    // GIVEN: an array with one cart item
    const item = buildCartItem();
    // WHEN
    saveCartItems([item]);
    // THEN
    const stored = JSON.parse(localStorage.getItem('sem7_shopping_cart')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('item-1');
  });

  it('addCartItem adds item and persists', () => {
    // GIVEN: empty cart
    const item = buildCartItem();
    // WHEN
    const result = addCartItem(item);
    // THEN
    expect(result.success).toBe(true);
    expect(getCartItems()).toHaveLength(1);
  });

  it('addCartItem rejects duplicate eventId+tierId', () => {
    // GIVEN: cart already has item with eventId=evt-1 tierId=tier-1
    addCartItem(buildCartItem());
    // WHEN: try to add same eventId+tierId
    const dup = buildCartItem({ id: 'item-dup' });
    const result = addCartItem(dup);
    // THEN
    expect(result.success).toBe(false);
    expect(result.error).toBe('Ya tienes este tier en tu carrito');
    expect(getCartItems()).toHaveLength(1);
  });

  it('addCartItem enforces max 5 items limit', () => {
    // GIVEN: 5 items already in cart
    for (let i = 0; i < 5; i++) {
      addCartItem(buildCartItem({ id: `item-${i}`, eventId: `evt-${i}`, tierId: `tier-${i}` }));
    }
    expect(getCartItems()).toHaveLength(5);
    // WHEN: attempt to add a 6th
    const result = addCartItem(buildCartItem({ id: 'item-6', eventId: 'evt-6', tierId: 'tier-6' }));
    // THEN
    expect(result.success).toBe(false);
    expect(result.error).toBe('Máximo 5 reservas simultáneas permitidas');
    expect(getCartItems()).toHaveLength(5);
  });

  it('removeCartItem removes item and returns updated list', () => {
    // GIVEN: two items in cart
    addCartItem(buildCartItem({ id: 'item-1', eventId: 'evt-1', tierId: 'tier-1' }));
    addCartItem(buildCartItem({ id: 'item-2', eventId: 'evt-2', tierId: 'tier-2' }));
    // WHEN
    const updated = removeCartItem('item-1');
    // THEN
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('item-2');
    expect(getCartItems()).toHaveLength(1);
  });

  it('updateCartItem updates specific fields', () => {
    // GIVEN: one item in cart
    addCartItem(buildCartItem());
    // WHEN
    const updated = updateCartItem('item-1', { expired: true });
    // THEN
    expect(updated[0].expired).toBe(true);
    expect(updated[0].eventTitle).toBe('Hamlet');
  });

  it('clearCart removes all items from localStorage', () => {
    // GIVEN: items in cart
    addCartItem(buildCartItem());
    // WHEN
    clearCart();
    // THEN
    expect(localStorage.getItem('sem7_shopping_cart')).toBeNull();
    expect(getCartItems()).toEqual([]);
  });
});
