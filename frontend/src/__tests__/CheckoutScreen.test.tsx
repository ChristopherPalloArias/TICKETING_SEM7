import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckoutScreen from '../pages/EventDetail/screens/CheckoutScreen';
import type { EventResponse, TierResponse } from '../types/event.types';

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron" />,
  Ticket: () => <span data-testid="icon-ticket" />,
  CreditCard: () => <span data-testid="icon-cc" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
}));

function buildEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 'evt-1',
    title: 'Hamlet',
    description: 'Obra clásica de Shakespeare',
    date: '2026-07-15T20:00:00',
    capacity: 500,
    room: { id: 'room-1', name: 'Teatro Real', maxCapacity: 500 },
    availableTiers: [],
    created_at: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildTier(overrides: Partial<TierResponse> = {}): TierResponse {
  return {
    id: 'tier-1',
    tierType: 'VIP',
    price: '50000',
    quota: 50,
    validFrom: null,
    validUntil: null,
    isAvailable: true,
    reason: null,
    ...overrides,
  };
}

describe('CheckoutScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates quantity to OrderSummary and PaymentPanel', () => {
    // GIVEN: tier price 50000, quantity = 3
    const event = buildEvent();
    const tier = buildTier({ tierType: 'VIP', price: '50000' });

    // WHEN: render CheckoutScreen with quantity 3
    render(
      <CheckoutScreen
        event={event}
        tier={tier}
        quantity={3}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    // THEN: OrderSummary shows "3x VIP" and PaymentPanel shows "3x VIP" in breakdown
    const quantityLabels = screen.getAllByText('3x VIP');
    expect(quantityLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('displays subtotal calculated from quantity × price', () => {
    // GIVEN: tier price 50000, quantity = 2 → subtotal = 100000
    const event = buildEvent();
    const tier = buildTier({ price: '50000' });

    // WHEN
    render(
      <CheckoutScreen
        event={event}
        tier={tier}
        quantity={2}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    // THEN: subtotal "$100,000.00" shown in PaymentPanel
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
  });

  it('displays total with service fee for given quantity', () => {
    // GIVEN: price 50000, quantity = 2 → total = 100000 + 10 = 100010
    const event = buildEvent();
    const tier = buildTier({ price: '50000' });

    // WHEN
    render(
      <CheckoutScreen
        event={event}
        tier={tier}
        quantity={2}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    // THEN: total "$100,010.00" shown
    expect(screen.getByText('$100,010.00')).toBeInTheDocument();
  });

  it('renders single quantity correctly', () => {
    // GIVEN: quantity = 1
    const event = buildEvent();
    const tier = buildTier({ tierType: 'GENERAL', price: '75000' });

    // WHEN
    render(
      <CheckoutScreen
        event={event}
        tier={tier}
        quantity={1}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    // THEN: "1x GENERAL" is displayed
    const labels = screen.getAllByText('1x GENERAL');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders heading "Finalizar Reserva"', () => {
    // GIVEN / WHEN
    render(
      <CheckoutScreen
        event={buildEvent()}
        tier={buildTier()}
        quantity={1}
        onBack={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    // THEN
    expect(screen.getByText('Finalizar Reserva')).toBeInTheDocument();
  });
});
