import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../hooks/useCartExpirationWatcher', () => ({
  useCartExpirationWatcher: vi.fn(),
}));

vi.mock('../components/Toast/Toast', () => ({
  default: () => null,
}));

vi.mock('../pages/CarteleraPage/CarteleraPage', () => ({
  default: () => <div data-testid="cartelera-page">Cartelera</div>,
}));

vi.mock('../pages/EventDetail/EventDetail', () => ({
  default: () => <div data-testid="event-detail-page">Event Detail</div>,
}));

vi.mock('../pages/VenuesPage/VenuesPage', () => ({
  default: () => <div data-testid="venues-page">Venues</div>,
}));

vi.mock('../pages/MyTicketsPage/MyTicketsPage', () => ({
  default: () => <div data-testid="my-tickets-page">My Tickets</div>,
}));

vi.mock('../pages/CartPage/CartPage', () => ({
  default: () => <div data-testid="cart-page">Cart</div>,
}));

vi.mock('../pages/admin/EventsDashboard/EventsDashboard', () => ({
  default: () => <div data-testid="events-dashboard">Dashboard</div>,
}));

vi.mock('../pages/admin/CreateEventPage/CreateEventPage', () => ({
  default: () => <div data-testid="create-event-page">Create Event</div>,
}));

vi.mock('../pages/admin/EventDetailAdmin/EventDetailAdmin', () => ({
  default: () => <div data-testid="event-detail-admin-page">Event Detail Admin</div>,
}));

vi.mock('../pages/admin/EditEventPage/EditEventPage', () => ({
  default: () => <div data-testid="edit-event-page">Edit Event</div>,
}));

vi.mock('../pages/BuyerLoginPage/BuyerLoginPage', () => ({
  default: () => <div data-testid="buyer-login-page">Buyer Login</div>,
}));

vi.mock('../pages/BuyerRegisterPage/BuyerRegisterPage', () => ({
  default: () => <div data-testid="buyer-register-page">Buyer Register</div>,
}));

vi.mock('../components/admin/AdminGuard/AdminGuard', async () => {
  const reactRouterDom = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    default: () => <reactRouterDom.Outlet />,
  };
});

vi.mock('../components/admin/AdminLayout/AdminLayout', async () => {
  const reactRouterDom = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    default: () => <reactRouterDom.Outlet />,
  };
});

import App from '../App';

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('AppRoutes (SPEC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('incluye ruta /login para BuyerLoginPage', () => {
    renderAt('/login');
    expect(screen.getByTestId('buyer-login-page')).toBeInTheDocument();
  });

  it('incluye ruta /registro para BuyerRegisterPage', () => {
    renderAt('/registro');
    expect(screen.getByTestId('buyer-register-page')).toBeInTheDocument();
  });

  it('incluye ruta /admin/events/:id/edit para EditEventPage', () => {
    renderAt('/admin/events/event-123/edit');
    expect(screen.getByTestId('edit-event-page')).toBeInTheDocument();
  });
});
