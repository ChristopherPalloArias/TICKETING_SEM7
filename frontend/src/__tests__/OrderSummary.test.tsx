import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderSummary from '../components/Checkout/OrderSummary';
import type { EventResponse, TierResponse } from '../types/event.types';

vi.mock('lucide-react', () => ({
  Ticket: () => <span data-testid="icon-ticket" />,
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
    price: '150000',
    quota: 50,
    validFrom: null,
    validUntil: null,
    isAvailable: true,
    reason: null,
    ...overrides,
  };
}

describe('OrderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays correct total for given quantity', () => {
    // GIVEN: event with VIP tier at 150000, quantity = 3
    const event = buildEvent();
    const tier = buildTier({ tierType: 'VIP', price: '150000' });

    // WHEN: render with quantity 3
    render(<OrderSummary event={event} tier={tier} quantity={3} />);

    // THEN: shows "3x VIP"
    expect(screen.getByText('3x VIP')).toBeInTheDocument();
  });

  it('displays event title', () => {
    // GIVEN: event titled "Hamlet"
    const event = buildEvent({ title: 'Hamlet' });
    const tier = buildTier();

    // WHEN
    render(<OrderSummary event={event} tier={tier} quantity={1} />);

    // THEN
    expect(screen.getByText('Hamlet')).toBeInTheDocument();
  });

  it('shows "1x GENERAL" for single general ticket', () => {
    // GIVEN: GENERAL tier, quantity 1
    const event = buildEvent();
    const tier = buildTier({ tierType: 'GENERAL' });

    // WHEN
    render(<OrderSummary event={event} tier={tier} quantity={1} />);

    // THEN
    expect(screen.getByText('1x GENERAL')).toBeInTheDocument();
  });

  it('shows venue name from event room', () => {
    // GIVEN: event with room name
    const event = buildEvent({ room: { id: 'r-1', name: 'Grand Opera House', maxCapacity: 300 } });
    const tier = buildTier();

    // WHEN
    render(<OrderSummary event={event} tier={tier} quantity={2} />);

    // THEN
    expect(screen.getByText('Grand Opera House')).toBeInTheDocument();
  });
});
