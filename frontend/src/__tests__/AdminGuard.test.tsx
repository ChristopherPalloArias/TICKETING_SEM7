import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminGuard from '../components/admin/AdminGuard/AdminGuard';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

/**
 * Crea un JWT manual (header.payload.signature) con el exp indicado.
 * No necesita firma real — isTokenExpired sólo decodifica el payload.
 */
function makeJWT(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp, sub: 'user-1' }));
  return `${header}.${payload}.fakesignature`;
}

function buildAuthMock(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    isAuthenticated: false,
    token: null,
    role: null,
    userId: null,
    email: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>;
}

function renderGuard(authOverrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockUseAuth.mockReturnValue(buildAuthMock(authOverrides));
  return render(
    <MemoryRouter initialEntries={['/admin/events']}>
      <Routes>
        <Route path="/admin" element={<AdminGuard />}>
          <Route path="events" element={<div data-testid="protected">Contenido protegido</div>} />
        </Route>
        <Route path="/login" element={<div data-testid="login">Página de Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── casos base (existentes — actualizados con token en mock) ────────────────

  it('redirige a /login si no autenticado', () => {
    // GIVEN: usuario no autenticado, sin token
    renderGuard({ isAuthenticated: false, token: null });

    // THEN: muestra login y oculta el contenido protegido
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('renderiza Outlet si autenticado con token válido no expirado', () => {
    // GIVEN: usuario autenticado con token que expira en 1 hora
    const validToken = makeJWT(3600);
    renderGuard({ isAuthenticated: true, token: validToken, role: 'ADMIN' });

    // THEN: renderiza el Outlet con el contenido protegido
    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login')).not.toBeInTheDocument();
  });

  // ─── JWT expiry — nuevos casos (SPEC-020 / HU-SEC-05) ───────────────────────

  it('AdminGuard_withValidNonExpiredToken_rendersChildren — token JWT válido y no expirado renderiza los hijos', () => {
    // GIVEN: token que expira dentro de 1 hora
    const validToken = makeJWT(3600);
    renderGuard({ isAuthenticated: true, token: validToken, role: 'ADMIN' });

    // THEN: se muestra el contenido protegido
    expect(screen.getByTestId('protected')).toBeInTheDocument();
    expect(screen.queryByTestId('login')).not.toBeInTheDocument();
  });

  it('AdminGuard_withExpiredToken_redirectsToLogin — token JWT expirado redirige a /login', () => {
    // GIVEN: token expirado hace 1 hora
    const expiredToken = makeJWT(-3600);
    renderGuard({ isAuthenticated: true, token: expiredToken });

    // THEN: redirige al login, no muestra contenido protegido
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('AdminGuard_withNoToken_redirectsToLogin — sin token redirige a /login', () => {
    // GIVEN: isAuthenticated false, token null
    renderGuard({ isAuthenticated: false, token: null });

    // THEN: redirige al login
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('AdminGuard_withMalformedToken_redirectsToLogin — token malformado (no es JWT) redirige a /login', () => {
    // GIVEN: token que no tiene estructura header.payload.signature
    // token.split('.')[1] es undefined → atob(undefined) lanza → isTokenExpired devuelve true
    renderGuard({ isAuthenticated: true, token: 'abc' });

    // THEN: redirige al login
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});
