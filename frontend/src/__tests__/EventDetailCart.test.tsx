import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventDetail from '../pages/EventDetail/EventDetail';
import type { EventResponse, TierResponse } from '../types/event.types';
import type { CartItem } from '../types/cart.types';

vi.mock('../hooks/useEventDetail');
vi.mock('../services/reservationService');
vi.mock('../services/ticketsStorage', () => ({
  saveTicket: vi.fn(),
}));
vi.mock('../services/cartService', () => ({
  addCartItem: vi.fn().mockReturnValue({ success: true }),
  getCartItems: vi.fn().mockReturnValue([]),
  saveCartItems: vi.fn(),
  removeCartItem: vi.fn().mockReturnValue([]),
  updateCartItem: vi.fn().mockReturnValue([]),
  clearCart: vi.fn(),
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
    RefreshCw: stub('RefreshCw'),
    Minus: stub('Minus'),
    Plus: stub('Plus'),
    ShoppingBag: stub('ShoppingBag'),
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

function buildCartItem(): CartItem {
  return {
    id: 'cart-item-1',
    eventId: 'evt-1',
    eventTitle: 'Hamlet',
    eventDate: '2026-07-15T20:00:00',
    eventRoom: 'Teatro Real',
    eventImageUrl: '',
    tierId: 'tier-1',
    tierType: 'VIP',
    tierPrice: 50000,
    quantity: 2,
    reservationId: 'res-from-cart',
    validUntilAt: new Date(Date.now() + 300_000).toISOString(),
    email: 'cart@test.com',
    addedAt: new Date().toISOString(),
    expired: false,
    expirationAlerted: false,
  };
}

describe('EventDetail — Cart restoration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC test: [EventDetail] restores checkout from cart location state
  it('restores checkout from cart location state', async () => {
    // GIVEN: event loaded, navigating from cart with fromCart state
    const event = buildEvent();
    mockUseEventDetail.mockReturnValue({ event, loading: false, error: null });
    const cartItem = buildCartItem();

    // WHEN: render EventDetail with fromCart location state
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/eventos/evt-1',
            state: { fromCart: true, cartItem },
          },
        ]}
      >
        <Routes>
          <Route path="/eventos/:id" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    // THEN: checkout screen is shown (not details), showing reservation info
    await waitFor(() => {
      expect(screen.getByText('RESUMEN DE PEDIDO')).toBeInTheDocument();
    });
  });

  it('does not restore checkout when fromCart is absent', async () => {
    // GIVEN: event loaded, normal navigation (no fromCart)
    const event = buildEvent();
    mockUseEventDetail.mockReturnValue({ event, loading: false, error: null });

    // WHEN
    render(
      <MemoryRouter initialEntries={['/eventos/evt-1']}>
        <Routes>
          <Route path="/eventos/:id" element={<EventDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    // THEN: details screen shown (quantity selector visible)
    await waitFor(() => {
      expect(screen.getByText('Cantidad')).toBeInTheDocument();
    });
  });
});
