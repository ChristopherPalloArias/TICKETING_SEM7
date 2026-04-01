import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventDetailTabs from '../components/admin/EventDetailTabs/EventDetailTabs';
import type { AdminEventResponse, AdminTierResponse } from '../types/admin.types';

const mockEvent: AdminEventResponse = {
  id: 'e1',
  title: 'El Fantasma de la Ópera',
  subtitle: 'Temporada 2026',
  description: 'Una obra maestra',
  date: '2026-07-01T20:00:00',
  capacity: 400,
  status: 'PUBLISHED',
  room: { id: 'r1', name: 'Teatro Real', maxCapacity: 400 },
  availableTiers: [],
  createdBy: 'admin-1',
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
};

const mockTiers: AdminTierResponse[] = [
  {
    id: 't1',
    tierType: 'VIP',
    price: 200,
    quota: 50,
    validFrom: null,
    validUntil: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
  {
    id: 't2',
    tierType: 'GENERAL',
    price: 80,
    quota: 300,
    validFrom: null,
    validUntil: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  },
];

describe('EventDetailTabs', () => {
  // --- Tab navigation ---

  it('renders all 4 tabs', () => {
    // GIVEN / WHEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // THEN
    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText('Tiers')).toBeInTheDocument();
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText('Métricas')).toBeInTheDocument();
  });

  it('shows Información tab content by default', () => {
    // GIVEN / WHEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // THEN — Info tab is active
    expect(screen.getByText('Información General del Evento')).toBeInTheDocument();
    expect(screen.getByText('El Fantasma de la Ópera')).toBeInTheDocument();
  });

  it('shows event title in info tab', () => {
    // GIVEN / WHEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // THEN
    expect(screen.getByText('El Fantasma de la Ópera')).toBeInTheDocument();
  });

  it('shows event subtitle in info tab when provided', () => {
    // GIVEN / WHEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // THEN
    expect(screen.getByText('Temporada 2026')).toBeInTheDocument();
  });

  it('shows room name in info tab', () => {
    // GIVEN / WHEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // THEN
    expect(screen.getByText('Teatro Real')).toBeInTheDocument();
  });

  it('shows "No asignada" when event has no room', () => {
    // GIVEN
    const eventNoRoom = { ...mockEvent, room: null as unknown as typeof mockEvent.room };

    // WHEN
    render(<EventDetailTabs event={eventNoRoom} tiers={[]} />);

    // THEN
    expect(screen.getByText('No asignada')).toBeInTheDocument();
  });

  it('switches to Tiers tab on click', () => {
    // GIVEN
    render(<EventDetailTabs event={mockEvent} tiers={mockTiers} />);

    // WHEN
    fireEvent.click(screen.getByText('Tiers'));

    // THEN
    expect(screen.getByText('Configuración de Tiers')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('GENERAL')).toBeInTheDocument();
  });

  it('shows empty tiers message when no tiers configured', () => {
    // GIVEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // WHEN
    fireEvent.click(screen.getByText('Tiers'));

    // THEN
    expect(screen.getByText('No hay tiers configurados')).toBeInTheDocument();
  });

  it('renders tier price and quota in Tiers tab', () => {
    // GIVEN
    render(<EventDetailTabs event={mockEvent} tiers={mockTiers} />);

    // WHEN
    fireEvent.click(screen.getByText('Tiers'));

    // THEN
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('Cupo: 300')).toBeInTheDocument();
  });

  it('switches to Reservas tab on click', () => {
    // GIVEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // WHEN
    fireEvent.click(screen.getByText('Reservas'));

    // THEN
    expect(screen.getByText('Reservas Activas')).toBeInTheDocument();
  });

  it('switches to Métricas tab on click', () => {
    // GIVEN
    render(<EventDetailTabs event={mockEvent} tiers={[]} />);

    // WHEN
    fireEvent.click(screen.getByText('Métricas'));

    // THEN
    expect(screen.getByText('Métricas del Evento')).toBeInTheDocument();
  });

  it('renders children in childrenArea', () => {
    // GIVEN / WHEN
    render(
      <EventDetailTabs event={mockEvent} tiers={[]}>
        <div data-testid="child-content">Extra content</div>
      </EventDetailTabs>
    );

    // THEN
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
