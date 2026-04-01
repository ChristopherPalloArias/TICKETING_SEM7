import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClientSource from '../services/apiClient.ts?raw';

const requestUse = vi.fn();
const responseUse = vi.fn();

const mockAxiosInstance = {
  interceptors: {
    request: { use: requestUse },
    response: { use: responseUse },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

type RequestInterceptor = (config: { headers?: Record<string, string> }) => { headers?: Record<string, string> };
type ResponseErrorInterceptor = (error: unknown) => Promise<never>;

async function loadInterceptors() {
  vi.resetModules();
  requestUse.mockClear();
  responseUse.mockClear();

  await import('../services/apiClient');

  const requestInterceptor = requestUse.mock.calls[0]?.[0] as RequestInterceptor;
  const responseErrorInterceptor = responseUse.mock.calls[0]?.[1] as ResponseErrorInterceptor;

  if (!requestInterceptor || !responseErrorInterceptor) {
    throw new Error('No se pudieron capturar interceptores de apiClient');
  }

  return { requestInterceptor, responseErrorInterceptor };
}

describe('apiClient interceptors (SPEC-021)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('agrega Authorization Bearer token en request cuando hay sesión', async () => {
    sessionStorage.setItem('jwt_token', 'jwt-test-token');
    const { requestInterceptor } = await loadInterceptors();

    const config = requestInterceptor({ headers: {} });

    expect(config.headers?.Authorization).toBe('Bearer jwt-test-token');
  });

  it('en 401 limpia sesión, emite toast y redirige a /admin/login para ADMIN', async () => {
    sessionStorage.setItem('jwt_token', 'jwt-admin');
    sessionStorage.setItem('user_role', 'ADMIN');
    sessionStorage.setItem('user_id', 'admin-1');
    sessionStorage.setItem('user_email', 'admin@test.com');

    const toastListener = vi.fn();
    window.addEventListener('app:toast', toastListener as EventListener);

    const { responseErrorInterceptor } = await loadInterceptors();
    const error = { response: { status: 401 } };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(sessionStorage.getItem('jwt_token')).toBeNull();
    expect(sessionStorage.getItem('user_role')).toBeNull();
    expect(sessionStorage.getItem('user_id')).toBeNull();
    expect(sessionStorage.getItem('user_email')).toBeNull();

    expect(toastListener).toHaveBeenCalledTimes(1);
    const toastEvent = toastListener.mock.calls[0][0] as CustomEvent;
    expect(toastEvent.detail.message).toBe('Tu sesión ha expirado');

    window.removeEventListener('app:toast', toastListener as EventListener);
  });

  it('en 401 redirige a /login para BUYER', async () => {
    sessionStorage.setItem('jwt_token', 'jwt-buyer');
    sessionStorage.setItem('user_role', 'BUYER');

    const { responseErrorInterceptor } = await loadInterceptors();

    const error = { response: { status: 401 } };
    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(sessionStorage.getItem('jwt_token')).toBeNull();
    expect(sessionStorage.getItem('user_role')).toBeNull();
  });

  it('define redirección por rol ADMIN/BUYER en el interceptor 401', () => {
    expect(apiClientSource).toContain("const redirectPath = role === 'ADMIN' ? '/admin/login' : '/login';");
  });

  it('en 403 emite toast de permisos sin redirección', async () => {
    const toastListener = vi.fn();
    window.addEventListener('app:toast', toastListener as EventListener);

    const { responseErrorInterceptor } = await loadInterceptors();
    const error = { response: { status: 403 } };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(toastListener).toHaveBeenCalledTimes(1);
    const toastEvent = toastListener.mock.calls[0][0] as CustomEvent;
    expect(toastEvent.detail.message).toBe('No tienes permisos para esta acción');

    window.removeEventListener('app:toast', toastListener as EventListener);
  });
});
