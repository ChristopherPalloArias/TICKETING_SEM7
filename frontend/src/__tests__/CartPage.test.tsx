import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../pages/CartPage/CartPage';
import type { CartItem } from '../types/cart.types';

vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Comp = (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
    Comp.displayName = name;
    return Comp;
  };
  return {
    ShoppingCart: stub('ShoppingCart'),
    Clock: stub('Clock'),
    Trash2: stub('Trash2'),
    CreditCard: stub('CreditCard'),
    RefreshCw: stub('RefreshCw'),
    Bell: stub('Bell'),
    Timer: stub('Timer'),
    Menu: stub('Menu'),
    X: stub('X'),
    Home: stub('Home'),
    LayoutGrid: stub('LayoutGrid'),
    Building2: stub('Building2'),
    Search: stub('Search'),
    Star: stub('Star'),
    Ticket: stub('Ticket'),
    MapPin: stub('MapPin'),
    User: stub('User'),
    CreditCard: stub('CreditCard'),
  };
});

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

vi.mock('../services/reservationService', () => ({
  createReservation: vi.fn(),
}));

const mockUseCart = vi.fn();
vi.mock('../contexts/CartContext', () => ({
  useCart: () => mockUseCart(),
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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
    email: 'buyer@test.com',
    addedAt: new Date().toISOString(),
    expired: false,
    expirationAlerted: false,
    ...overrides,
  };
}

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC test: [CartPage] renders list of cart items
  it('renders list of cart items', () => {
    // GIVEN: two items in cart
    mockUseCart.mockReturnValue({
      items: [
        buildCartItem({ id: 'item-1', eventTitle: 'Hamlet' }),
        buildCartItem({ id: 'item-2', eventId: 'evt-2', tierId: 'tier-2', eventTitle: 'Romeo y Julieta' }),
      ],
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      addItem: vi.fn(),
      clearCart: vi.fn(),
      activeItemCount: 2,
    });

    // WHEN
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );

    // THEN: both items rendered
    expect(screen.getByText('Hamlet')).toBeInTheDocument();
    expect(screen.getByText('Romeo y Julieta')).toBeInTheDocument();
    expect(screen.getByText('Mi Carrito')).toBeInTheDocument();
  });

  // SPEC test: [CartPage] shows empty state when no items
  it('shows empty state when no items', () => {
    // GIVEN: empty cart
    mockUseCart.mockReturnValue({
      items: [],
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      addItem: vi.fn(),
      clearCart: vi.fn(),
      activeItemCount: 0,
    });

    // WHEN
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );

    // THEN: empty state message and CTA
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByText('Explorar cartelera')).toBeInTheDocument();
  });

  it('Explorar cartelera links to /eventos', () => {
    // GIVEN: empty cart
    mockUseCart.mockReturnValue({
      items: [],
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      addItem: vi.fn(),
      clearCart: vi.fn(),
      activeItemCount: 0,
    });

    // WHEN
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );

    // THEN: link points to /eventos
    expect(screen.getByText('Explorar cartelera').closest('a')).toHaveAttribute('href', '/eventos');
  });
});
