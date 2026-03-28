import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// Mock de componentes pesados con implementaciones ligeras
vi.mock('../pages/CarteleraPage/CarteleraPage', () => ({
  default: () => <div data-testid="cartelera-page">Cartelera</div>,
}));

vi.mock('../pages/EventDetail/EventDetail', () => ({
  default: () => <div data-testid="event-detail-page">Event Detail</div>,
}));

vi.mock('../pages/admin/LoginPage/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));

vi.mock('../pages/admin/EventsDashboard/EventsDashboard', () => ({
  default: () => <div data-testid="events-dashboard">Dashboard</div>,
}));

vi.mock('../components/admin/AdminGuard/AdminGuard', () => ({
  default: () => <div data-testid="admin-guard">Guard</div>,
}));

vi.mock('../components/admin/AdminNavBar/AdminNavBar', () => ({
  default: () => <div data-testid="admin-navbar">NavBar</div>,
}));

import CarteleraPage from '../pages/CarteleraPage/CarteleraPage';
import EventDetail from '../pages/EventDetail/EventDetail';
import LoginPage from '../pages/admin/LoginPage/LoginPage';
import AdminGuard from '../components/admin/AdminGuard/AdminGuard';
import AdminNavBar from '../components/admin/AdminNavBar/AdminNavBar';
import EventsDashboard from '../pages/admin/EventsDashboard/EventsDashboard';

const STORAGE_KEY = 'sem7_admin_session';

function renderAppRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/eventos" element={<CarteleraPage />} />
        <Route path="/eventos/:id" element={<EventDetail />} />
        <Route path="/" element={<Navigate to="/eventos" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route
            path="events"
            element={
              <>
                <AdminNavBar />
                <EventsDashboard />
              </>
            }
          />
          <Route index element={<Navigate to="events" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('rutas públicas /eventos accesibles sin sesión de admin', () => {
    // GIVEN: sin sesión de admin almacenada en localStorage
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // WHEN: navegar a /eventos con el árbol de rutas de la aplicación
    renderAppRoutes('/eventos');

    // THEN: renderiza la cartelera pública y NO redirige a /admin/login
    expect(screen.getByTestId('cartelera-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
