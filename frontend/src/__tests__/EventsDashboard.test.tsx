import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventsDashboard from '../pages/admin/EventsDashboard/EventsDashboard';
import type { AdminEventResponse } from '../types/admin.types';

vi.mock('../hooks/useAdminEvents');
vi.mock('../hooks/useAuth');

import { useAdminEvents } from '../hooks/useAdminEvents';
import { useAuth } from '../hooks/useAuth';

const mockUseAdminEvents = vi.mocked(useAdminEvents);
const mockUseAuth = vi.mocked(useAuth);

function buildAuthMock() {
  return {
    isAuthenticated: true,
    token: 'mock-token',
    role: 'ADMIN' as const,
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@sem7.com',
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    registerBuyer: vi.fn(),
  };
}

function buildEvent(overrides: Partial<AdminEventResponse> = {}): AdminEventResponse {
  return {
    id: 'event-1',
    title: 'Bodas de Sangre',
    description: 'Tragedia',
    date: '2026-07-01T20:00:00',
    capacity: 200,
    status: 'PUBLISHED',
    room: { id: 'room-1', name: 'Teatro Real', maxCapacity: 300 },
    availableTiers: [{ id: 't1', tierType: 'GENERAL', price: '75.00', quota: 150, validFrom: null, validUntil: null, isAvailable: true, reason: null }],
    createdBy: 'admin',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildHookMock(overrides = {}) {
  return {
    events: [],
    loading: false,
    error: null,
    refresh: vi.fn(),
    publishEvent: vi.fn(),
    ...overrides,
  };
}

describe('EventsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(buildAuthMock());
  });

  it('renders table with event data', () => {
    const event = buildEvent();
    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [event] }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    expect(screen.getByText('Bodas de Sangre')).toBeInTheDocument();
    expect(screen.getByText('Teatro Real')).toBeInTheDocument();
    expect(screen.getByText('1 tiers')).toBeInTheDocument();
  });

  it('filters events by status', () => {
    const draftEvent = buildEvent({ id: 'e1', title: 'Draft Show', status: 'DRAFT', availableTiers: [] });
    const publishedEvent = buildEvent({ id: 'e2', title: 'Published Show', status: 'PUBLISHED' });

    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [draftEvent, publishedEvent] }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    // Use role to distinguish filter button from status badge
    const filterButtons = screen.getAllByRole('button', { name: 'Borrador' });
    fireEvent.click(filterButtons[0]);

    expect(screen.getByText('Draft Show')).toBeInTheDocument();
    expect(screen.queryByText('Published Show')).not.toBeInTheDocument();
  });

  it('disables publish button when event has no tiers', () => {
    const event = buildEvent({ status: 'DRAFT', availableTiers: [] });
    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [event] }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    const publishBtn = screen.getByText('Publicar');
    expect(publishBtn).toBeDisabled();
  });

  it('shows empty state when no events', () => {
    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [] }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    expect(screen.getByText('No hay eventos aún')).toBeInTheDocument();
    expect(screen.getByText('Crear Primer Evento')).toBeInTheDocument();
  });

  it('shows warning for events with no tiers', () => {
    const event = buildEvent({ status: 'DRAFT', availableTiers: [] });
    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [event] }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    expect(screen.getByText('Sin tiers')).toBeInTheDocument();
  });

  it('calls publishEvent on button click for events with tiers', async () => {
    const publishFn = vi.fn().mockResolvedValue(undefined);
    const event = buildEvent({ status: 'DRAFT' });
    mockUseAdminEvents.mockReturnValue(buildHookMock({ events: [event], publishEvent: publishFn }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    fireEvent.click(screen.getByText('Publicar'));

    await waitFor(() => {
      expect(publishFn).toHaveBeenCalledWith('event-1');
    });
  });

  it('shows error message and retry button on error', () => {
    mockUseAdminEvents.mockReturnValue(buildHookMock({ error: 'Error de red', loading: false }));

    render(<MemoryRouter><EventsDashboard /></MemoryRouter>);

    expect(screen.getByText('Error de red')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });
});
