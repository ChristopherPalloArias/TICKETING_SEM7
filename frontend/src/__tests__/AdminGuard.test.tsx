import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminGuard from '../components/admin/AdminGuard/AdminGuard';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function buildAuthMock(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    isAuthenticated: false,
    role: null,
    userId: null,
    email: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>;
}

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige a /admin/login si no autenticado', () => {
    // GIVEN: usuario no autenticado
    mockUseAuth.mockReturnValue(buildAuthMock({ isAuthenticated: false }));

    // WHEN: intento de acceder a ruta protegida
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <Routes>
          <Route path="/admin" element={<AdminGuard />}>
            <Route path="events" element={<div data-testid="protected">Contenido protegido</div>} />
          </Route>
          <Route path="/admin/login" element={<div data-testid="login">Página de Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // THEN: muestra login y oculta el contenido protegido
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('renderiza Outlet si autenticado', () => {
    // GIVEN: usuario con sesión activa
    mockUseAuth.mockReturnValue(
      buildAuthMock({
        isAuthenticated: true,
        role: 'ADMIN',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@sem7.com',
      }),
    );

    // WHEN: navegar a ruta protegida con sesión válida
    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <Routes>
          <Route path="/admin" element={<AdminGuard />}>
            <Route path="events" element={<div data-testid="protected">Contenido protegido</div>} />
          </Route>
          <Route path="/admin/login" element={<div data-testid="login">Página de Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // THEN: renderiza el Outlet con el contenido protegido
    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login')).not.toBeInTheDocument();
  });
});
