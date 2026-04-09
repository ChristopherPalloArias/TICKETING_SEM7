import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    LogOut: stub('LogOut'),
    Search: stub('Search'),
    X: stub('X'),
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

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function renderNavBar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  );
}

describe('NavBar buyer auth state (SPEC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra botones de Iniciar Sesión y Registrarse cuando no hay autenticación', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      role: null,
      userId: null,
      email: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      registerBuyer: vi.fn(),
    });

    renderNavBar();

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /registrarse/i })).toHaveAttribute('href', '/registro');
  });

  it('muestra estado autenticado para BUYER y permite logout', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();

    mockUseAuth.mockReturnValue({
      token: 'jwt-token',
      role: 'BUYER',
      userId: 'buyer-1',
      email: 'buyer@test.com',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout,
      registerBuyer: vi.fn(),
    });

    renderNavBar();

    expect(screen.getByText('buyer@test.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
