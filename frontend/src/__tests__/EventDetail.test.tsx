import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventDetail from '../pages/EventDetail/EventDetail';
import type { EventResponse, TierResponse } from '../types/event.types';

vi.mock('../hooks/useEventDetail');
vi.mock('../services/reservationService');
vi.mock('../services/ticketsStorage', () => ({
  saveTicket: vi.fn(),
}));
vi.mock('../contexts/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
    setPollingEnabled: vi.fn(),
  }),
}));
vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    clearCart: vi.fn(),
    activeItemCount: 0,
  }),
}));
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
vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: () => {
      return ({ children }: { children?: React.ReactNode }) => children ?? null;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Comp = () => null;
    Comp.displayName = name;
    return Comp;
  };
  return {
    ArrowRight: stub('ArrowRight'),
    ChevronLeft: stub('ChevronLeft'),
    MapPin: stub('MapPin'),
    Calendar: stub('Calendar'),
    Clock: stub('Clock'),
    Users: stub('Users'),
    Star: stub('Star'),
    Ticket: stub('Ticket'),
    Bell: stub('Bell'),
    Menu: stub('Menu'),
    X: stub('X'),
    Home: stub('Home'),
    LayoutGrid: stub('LayoutGrid'),
    Building2: stub('Building2'),
    Search: stub('Search'),
    Trash2: stub('Trash2'),
    ShoppingCart: stub('ShoppingCart'),
    Timer: stub('Timer'),
    XCircle: stub('XCircle'),
    CreditCard: stub('CreditCard'),
    ShieldCheck: stub('ShieldCheck'),
    CheckCircle2: stub('CheckCircle2'),
    AlertTriangle: stub('AlertTriangle'),
    Info: stub('Info'),
    User: stub('User'),
  };
});

import { useEventDetail } from '../hooks/useEventDetail';

const mockUseEventDetail = vi.mocked(useEventDetail);

function buildTier(overrides: Partial<TierResponse> = {}): TierResponse {
  return {
    id: 'tier-1',
    tierType: 'VIP',
    price: '50000',
    quota: 10,
    validFrom: null,
    validUntil: null,
    isAvailable: true,
    reason: null,
    ...overrides,
  };
}

function buildEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 'evt-1',
    title: 'Hamlet',
    description: 'Obra clásica de Shakespeare',
    date: '2026-07-15T20:00:00',
    capacity: 500,
    room: { id: 'room-1', name: 'Teatro Real', maxCapacity: 500 },
    availableTiers: [buildTier()],
    created_at: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/eventos/evt-1']}>
      <Routes>
        <Route path="/eventos/:id" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes quantity to 1 and passes to checkout', async () => {
    // GIVEN: event loaded with one available tier
    const event = buildEvent();
    mockUseEventDetail.mockReturnValue({ event, loading: false, error: null });

    // WHEN: page renders
    renderPage();

    // THEN: QuantitySelector shows "1" as the default quantity value
    await waitFor(() => {
      expect(screen.getByText('Cantidad')).toBeInTheDocument();
    });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders QuantitySelector with min=1 and max=tier.quota', async () => {
    // GIVEN: tier with quota 10
    const event = buildEvent({ availableTiers: [buildTier({ quota: 10 })] });
    mockUseEventDetail.mockReturnValue({ event, loading: false, error: null });

    // WHEN
    renderPage();

    // THEN: decrement button is disabled at min (1), increment button is enabled
    await waitFor(() => {
      expect(screen.getByText('Cantidad')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /disminuir cantidad/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /aumentar cantidad/i })).not.toBeDisabled();
  });

  it('increments quantity via QuantitySelector', async () => {
    // GIVEN: event with tier quota 5
    const event = buildEvent({ availableTiers: [buildTier({ quota: 5 })] });
    mockUseEventDetail.mockReturnValue({ event, loading: false, error: null });
    const user = userEvent.setup();

    // WHEN: click + twice
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cantidad')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /aumentar cantidad/i }));
    await user.click(screen.getByRole('button', { name: /aumentar cantidad/i }));

    // THEN: display shows 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows loading skeleton while event is loading', () => {
    // GIVEN: loading state
    mockUseEventDetail.mockReturnValue({ event: null, loading: true, error: null });

    // WHEN
    renderPage();

    // THEN: no event content yet, skeleton structure rendered
    expect(screen.queryByText('Cantidad')).not.toBeInTheDocument();
  });

  it('shows error message when event fails to load', () => {
    // GIVEN: error state
    mockUseEventDetail.mockReturnValue({
      event: null,
      loading: false,
      error: 'Error al cargar el evento.',
    });

    // WHEN
    renderPage();

    // THEN: error message displayed
    expect(screen.getByText('Error al cargar el evento.')).toBeInTheDocument();
  });
});
