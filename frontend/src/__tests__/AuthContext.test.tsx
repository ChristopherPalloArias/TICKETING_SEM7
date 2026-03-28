import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';

const STORAGE_KEY = 'sem7_admin_session';
const DEMO_EMAIL = 'admin@sem7.com';
const DEMO_PASSWORD = 'admin123';
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login con credenciales válidas establece sesión y retorna true', () => {
    // GIVEN: AuthProvider montado sin sesión previa
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN: login con credenciales de demo
    let success = false;
    act(() => {
      success = result.current.login(DEMO_EMAIL, DEMO_PASSWORD);
    });

    // THEN: retorna true, estado actualizado y sesión persistida en localStorage
    expect(success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('ADMIN');
    expect(result.current.userId).toBe(DEMO_USER_ID);
    expect(result.current.email).toBe(DEMO_EMAIL);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.role).toBe('ADMIN');
    expect(stored.userId).toBe(DEMO_USER_ID);
    expect(stored.email).toBe(DEMO_EMAIL);
  });

  it('login con credenciales inválidas retorna false y no cambia estado', () => {
    // GIVEN: AuthProvider montado sin sesión previa
    const { result } = renderHook(() => useAuth(), { wrapper });

    // WHEN: login con credenciales incorrectas
    let success = true;
    act(() => {
      success = result.current.login('otro@email.com', 'clave_incorrecta');
    });

    // THEN: retorna false, estado sin cambios, localStorage intacto
    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.email).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('logout limpia localStorage y resetea isAuthenticated', () => {
    // GIVEN: sesión activa establecida via login
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.login(DEMO_EMAIL, DEMO_PASSWORD);
    });
    expect(result.current.isAuthenticated).toBe(true);

    // WHEN: logout
    act(() => {
      result.current.logout();
    });

    // THEN: estado reseteado y clave eliminada de localStorage
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.userId).toBeNull();
    expect(result.current.email).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restaura sesión válida desde localStorage al montar', () => {
    // GIVEN: sesión válida preexistente en localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role: 'ADMIN', userId: DEMO_USER_ID, email: DEMO_EMAIL }),
    );

    // WHEN: AuthProvider monta y lee localStorage
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN: sesión restaurada correctamente
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('ADMIN');
    expect(result.current.userId).toBe(DEMO_USER_ID);
    expect(result.current.email).toBe(DEMO_EMAIL);
  });

  it('limpia localStorage corrupto al montar', () => {
    // GIVEN: localStorage con JSON inválido
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('corrupted-json{{{');
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');

    // WHEN: AuthProvider intenta restaurar sesión al montar
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN: no autenticado y localStorage limpiado
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('limpia localStorage con role distinto de ADMIN al montar', () => {
    // GIVEN: localStorage con sesión de usuario no-admin (role USER)
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role: 'USER', userId: '123', email: 'x@x.com' }),
    );

    // WHEN: AuthProvider intenta restaurar sesión al montar
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN: no autenticado y localStorage limpiado
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('limpia localStorage sin userId al montar', () => {
    // GIVEN: localStorage con sesión ADMIN pero sin userId
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role: 'ADMIN', email: DEMO_EMAIL }),
    );

    // WHEN: AuthProvider intenta restaurar sesión al montar
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN: no autenticado y localStorage limpiado
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('limpia localStorage sin email al montar', () => {
    // GIVEN: localStorage con sesión ADMIN pero sin email
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role: 'ADMIN', userId: DEMO_USER_ID }),
    );

    // WHEN: AuthProvider intenta restaurar sesión al montar
    const { result } = renderHook(() => useAuth(), { wrapper });

    // THEN: no autenticado y localStorage limpiado
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
