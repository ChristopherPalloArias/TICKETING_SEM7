import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCartItems,
  saveCartItems,
  addCartItem,
  removeCartItem,
  updateCartItem,
  clearCart,
  getCartStorageKey,
  migrateOldCartData,
} from '../services/cartService';
import type { CartItem } from '../types/cart.types';

const TEST_EMAIL = 'buyer@test.com';

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
    const key = getCartStorageKey(TEST_EMAIL);
    localStorage.setItem(key, '{not-valid-json');
    // WHEN
    const items = getCartItems(TEST_EMAIL);
    // THEN
    expect(items).toEqual([]);
  });

  // SPEC test: [cartService] saveCartItems persists to localStorage
  it('saveCartItems persists items to localStorage', () => {
    // GIVEN: an array with one cart item
    const item = buildCartItem();
    // WHEN
    saveCartItems([item], TEST_EMAIL);
    // THEN
    const key = getCartStorageKey(TEST_EMAIL);
    const stored = JSON.parse(localStorage.getItem(key)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('item-1');
  });

  it('addCartItem adds item and persists', () => {
    // GIVEN: empty cart
    const item = buildCartItem();
    // WHEN
    const result = addCartItem(item, TEST_EMAIL);
    // THEN
    expect(result.success).toBe(true);
    expect(getCartItems(TEST_EMAIL)).toHaveLength(1);
  });

  it('addCartItem rejects duplicate eventId+tierId', () => {
    // GIVEN: cart already has item with eventId=evt-1 tierId=tier-1
    addCartItem(buildCartItem(), TEST_EMAIL);
    // WHEN: try to add same eventId+tierId
    const dup = buildCartItem({ id: 'item-dup' });
    const result = addCartItem(dup, TEST_EMAIL);
    // THEN
    expect(result.success).toBe(false);
    expect(result.error).toBe('Ya tienes este tier en tu carrito');
    expect(getCartItems(TEST_EMAIL)).toHaveLength(1);
  });

  it('addCartItem enforces max 5 items limit', () => {
    // GIVEN: 5 items already in cart
    for (let i = 0; i < 5; i++) {
      addCartItem(buildCartItem({ id: `item-${i}`, eventId: `evt-${i}`, tierId: `tier-${i}` }), TEST_EMAIL);
    }
    expect(getCartItems(TEST_EMAIL)).toHaveLength(5);
    // WHEN: attempt to add a 6th
    const result = addCartItem(buildCartItem({ id: 'item-6', eventId: 'evt-6', tierId: 'tier-6' }), TEST_EMAIL);
    // THEN
    expect(result.success).toBe(false);
    expect(result.error).toBe('Máximo 5 reservas simultáneas permitidas');
    expect(getCartItems(TEST_EMAIL)).toHaveLength(5);
  });

  it('removeCartItem removes item and returns updated list', () => {
    // GIVEN: two items in cart
    addCartItem(buildCartItem({ id: 'item-1', eventId: 'evt-1', tierId: 'tier-1' }), TEST_EMAIL);
    addCartItem(buildCartItem({ id: 'item-2', eventId: 'evt-2', tierId: 'tier-2' }), TEST_EMAIL);
    // WHEN
    const updated = removeCartItem('item-1', TEST_EMAIL);
    // THEN
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('item-2');
    expect(getCartItems(TEST_EMAIL)).toHaveLength(1);
  });

  it('updateCartItem updates specific fields', () => {
    // GIVEN: one item in cart
    addCartItem(buildCartItem(), TEST_EMAIL);
    // WHEN
    const updated = updateCartItem('item-1', { expired: true }, TEST_EMAIL);
    // THEN
    expect(updated[0].expired).toBe(true);
    expect(updated[0].eventTitle).toBe('Hamlet');
  });

  it('clearCart removes all items from localStorage', () => {
    // GIVEN: items in cart
    addCartItem(buildCartItem(), TEST_EMAIL);
    // WHEN
    clearCart(TEST_EMAIL);
    // THEN
    const key = getCartStorageKey(TEST_EMAIL);
    expect(localStorage.getItem(key)).toBeNull();
    expect(getCartItems(TEST_EMAIL)).toEqual([]);
  });
});
