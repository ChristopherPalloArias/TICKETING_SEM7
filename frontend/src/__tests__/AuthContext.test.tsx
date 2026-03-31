/**
 * AuthContext.test.tsx — SPEC-020 / HU-SEC-05
 *
 * Este archivo reemplaza los tests anteriores que usaban credenciales hardcodeadas
 * y un login sincrónico. La nueva implementación de AuthContext usa authService
 * de forma asíncrona y persiste en sessionStorage (no localStorage).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import authContextSource from '../contexts/AuthContext.tsx?raw';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';

vi.mock('../services/authService');

const mockLogin = vi.mocked(authService.login);
const mockGetProfile = vi.mocked(authService.getProfile);

/** Mocks por defecto para login exitoso */
function setupSuccessfulAuth(token = 'jwt.abc.def') {
  mockLogin.mockResolvedValue({ token, expiresIn: 3600, role: 'ADMIN' });
  mockGetProfile.mockResolvedValue({ id: 'user-1', email: 'admin@test.com', role: 'ADMIN' });
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // ─── login_callsAuthService ──────────────────────────────────────────────────

  it('login_callsAuthService — authService.login es invocado con el email y password correctos', async () => {
    // GIVEN
    setupSuccessfulAuth();
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN
    await act(async () => {
      await result.current.login('admin@test.com', 'pass123');
    });

    // THEN
    expect(mockLogin).toHaveBeenCalledOnce();
    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'pass123');
  });

  // ─── login_storesTokenInSessionStorage ──────────────────────────────────────

  it('login_storesTokenInSessionStorage — tras login exitoso, jwt_token está en sessionStorage', async () => {
    // GIVEN
    setupSuccessfulAuth('jwt.abc.def');
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN
    await act(async () => {
      await result.current.login('admin@test.com', 'pass123');
    });

    // THEN
    expect(sessionStorage.getItem('jwt_token')).not.toBeNull();
    expect(sessionStorage.getItem('jwt_token')).toBe('jwt.abc.def');
  });

  // ─── login_storesRoleInSessionStorage ───────────────────────────────────────

  it('login_storesRoleInSessionStorage — tras login exitoso, user_role está en sessionStorage', async () => {
    // GIVEN
    setupSuccessfulAuth();
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN
    await act(async () => {
      await result.current.login('admin@test.com', 'pass123');
    });

    // THEN
    expect(sessionStorage.getItem('user_role')).not.toBeNull();
    expect(sessionStorage.getItem('user_role')).toBe('ADMIN');
  });

  // ─── logout_clearsSessionStorage ────────────────────────────────────────────

  it('logout_clearsSessionStorage — tras logout, las claves jwt_token, user_role, user_id y user_email son eliminadas', async () => {
    // GIVEN: sesión activa
    setupSuccessfulAuth();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('admin@test.com', 'pass123');
    });
    expect(sessionStorage.getItem('jwt_token')).not.toBeNull();

    // WHEN
    act(() => {
      result.current.logout();
    });

    // THEN
    expect(sessionStorage.getItem('jwt_token')).toBeNull();
    expect(sessionStorage.getItem('user_role')).toBeNull();
    expect(sessionStorage.getItem('user_id')).toBeNull();
    expect(sessionStorage.getItem('user_email')).toBeNull();
  });

  // ─── login_withInvalidCredentials_throwsError ────────────────────────────────

  it('login_withInvalidCredentials_throwsError — cuando authService lanza error, el context lo propaga sin alterar el estado', async () => {
    // GIVEN
    const authError = new Error('Unauthorized');
    mockLogin.mockRejectedValue(authError);
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN
    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.login('bad@email.com', 'wrongpass');
      } catch (e) {
        caughtError = e;
      }
    });

    // THEN
    expect(caughtError).toBe(authError);
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem('jwt_token')).toBeNull();
  });

  // ─── isAuthenticated_true_whenTokenExists ───────────────────────────────────

  it('isAuthenticated_true_whenTokenExists — con jwt_token preexistente en sessionStorage, isAuthenticated es true', () => {
    // GIVEN: token preexistente (ej. recarga de página)
    sessionStorage.setItem('jwt_token', 'existing.jwt.token');

    // WHEN
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN
    expect(result.current.isAuthenticated).toBe(true);
  });

  // ─── isAuthenticated_false_whenNoToken ──────────────────────────────────────

  it('isAuthenticated_false_whenNoToken — sin token en sessionStorage, isAuthenticated es false', () => {
    // GIVEN: sessionStorage vacío (garantizado por beforeEach)

    // WHEN
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN
    expect(result.current.isAuthenticated).toBe(false);
  });

  // ─── noHardcodedCredentials_inAuthContext ────────────────────────────────────

  it('noHardcodedCredentials_inAuthContext — el código fuente no contiene strings de credenciales demo', () => {
    // GIVEN: source importado con ?raw (Vite transforma el módulo a string literal)
    // THEN: no hay credenciales hardcodeadas
    expect(authContextSource).not.toContain('DEMO_EMAIL');
    expect(authContextSource).not.toContain('DEMO_PASSWORD');
    expect(authContextSource).not.toContain('admin@');
    expect(authContextSource).not.toContain('admin123');
  });
});
