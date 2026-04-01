import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../components/NavBar/NavBar';

vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Comp = () => <span data-testid={`icon-${name}`} />;
    Comp.displayName = name;
    return Comp;
  };
  return {
    Bell: stub('Bell'),
    ShoppingCart: stub('ShoppingCart'),
    Timer: stub('Timer'),
    Menu: stub('Menu'),
    X: stub('X'),
    Home: stub('Home'),
    LayoutGrid: stub('LayoutGrid'),
    Building2: stub('Building2'),
    Search: stub('Search'),
    Star: stub('Star'),
    Ticket: stub('Ticket'),
    XCircle: stub('XCircle'),
    CheckCircle2: stub('CheckCircle2'),
    Trash2: stub('Trash2'),
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

const mockUseCart = vi.fn();
vi.mock('../contexts/CartContext', () => ({
  useCart: () => mockUseCart(),
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

describe('NavBar — Cart integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCart.mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      activeItemCount: 0,
    });
  });

  // SPEC test: [NavBar] links cart icon to /carrito
  it('links cart icon to /carrito', () => {
    // GIVEN: default NavBar
    // WHEN
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    // THEN: cart link points to /carrito
    const cartLink = screen.getByLabelText('Carrito de compras');
    expect(cartLink).toHaveAttribute('href', '/carrito');
  });

  it('shows CartBadge with active item count', () => {
    // GIVEN: 3 active items
    mockUseCart.mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      activeItemCount: 3,
    });

    // WHEN
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    // THEN
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show CartBadge when activeItemCount is 0', () => {
    // GIVEN: 0 active items (default mock)
    // WHEN
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    // THEN: no badge number displayed — CartBadge returns null when count <= 0
    // The cart link still has the ShoppingCart icon span, but no badge text
    const cartLink = screen.getByLabelText('Carrito de compras');
    const badgeSpans = cartLink.querySelectorAll('span');
    // Only the ShoppingCart icon stub span exists, no badge with a number
    const numberBadge = Array.from(badgeSpans).find((s) => /^\d+$/.test(s.textContent || ''));
    expect(numberBadge).toBeUndefined();
  });
});
