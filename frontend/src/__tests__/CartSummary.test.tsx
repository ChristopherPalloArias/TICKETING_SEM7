import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartSummary from '../components/Cart/CartSummary';
import type { CartItem } from '../types/cart.types';

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

describe('CartSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC test: [CartSummary] calculates subtotal and total correctly
  it('calculates subtotal and total correctly', () => {
    // GIVEN: 2 active items — item1: 50000*2=100000, item2: 30000*1=30000
    const items = [
      buildCartItem({ id: 'item-1', tierPrice: 50000, quantity: 2 }),
      buildCartItem({ id: 'item-2', eventId: 'evt-2', tierId: 'tier-2', tierPrice: 30000, quantity: 1 }),
    ];
    // Subtotal: 130000, service fees: 10000*2=20000, total: 150000

    // WHEN
    render(<CartSummary items={items} />);

    // THEN: verify the summary panel renders with expected values
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText(/2 reservas/)).toBeInTheDocument();
    // Subtotal $\u00a0130.000
    expect(screen.getByText(/130\.000/)).toBeInTheDocument();
    // Service fee row: $10.000 × 2 = $20.000
    expect(screen.getByText(/20\.000/)).toBeInTheDocument();
    // Total: $150.000
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
  });

  it('excludes expired items from calculation', () => {
    // GIVEN: one active, one expired
    const items = [
      buildCartItem({ id: 'item-1', tierPrice: 50000, quantity: 1 }),
      buildCartItem({
        id: 'item-2',
        eventId: 'evt-2',
        tierId: 'tier-2',
        tierPrice: 30000,
        quantity: 1,
        expired: true,
        validUntilAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ];
    // Subtotal: 50000, service fees: 10000, total: 60000

    // WHEN
    render(<CartSummary items={items} />);

    // THEN: only 1 active reservation counted
    expect(screen.getByText(/1 reserva\b/)).toBeInTheDocument();
    expect(screen.getByText(/50\.000/)).toBeInTheDocument();
    expect(screen.getByText(/60\.000/)).toBeInTheDocument();
  });

  it('shows zero totals for empty items array', () => {
    // GIVEN: no items
    // WHEN
    render(<CartSummary items={[]} />);

    // THEN: 0 reservas, all zeroes
    expect(screen.getByText(/0 reservas/)).toBeInTheDocument();
  });
});
