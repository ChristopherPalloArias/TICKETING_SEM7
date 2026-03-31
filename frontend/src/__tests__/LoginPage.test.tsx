import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import loginPageSource from '../pages/admin/LoginPage/LoginPage.tsx?raw';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/admin/LoginPage/LoginPage';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function buildAuthMock(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    isAuthenticated: false,
    token: null,
    role: null,
    userId: null,
    email: null,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>;
}

function renderLoginPage(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  mockUseAuth.mockReturnValue(buildAuthMock(overrides));
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/events" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── render básico ────────────────────────────────────────────────────────────

  it('renderiza formulario con inputs email y password', () => {
    // GIVEN / WHEN: componente renderizado sin sesión activa
    renderLoginPage();

    // THEN: inputs de email, password y botón de submit presentes
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('redirige a /admin/events si ya autenticado', () => {
    // GIVEN: usuario ya con sesión activa
    renderLoginPage({ isAuthenticated: true });

    // THEN: redirige automáticamente sin mostrar el formulario de login
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  // ─── loginPage_withValidCredentials_redirectsToDashboard ─────────────────────

  it('loginPage_withValidCredentials_redirectsToDashboard — login exitoso redirige a /admin/events', async () => {
    // GIVEN: login resuelve sin error
    const user = userEvent.setup();
    renderLoginPage({ login: vi.fn().mockResolvedValue(undefined) });

    // WHEN: rellenar form y enviar
    await user.type(screen.getByLabelText(/correo electrónico/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // THEN: redirige al dashboard del administrador
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  // ─── loginPage_withInvalidCredentials_showsGenericError ──────────────────────

  it('loginPage_withInvalidCredentials_showsGenericError — login con error 401 muestra "Credenciales inválidas"', async () => {
    // GIVEN: login rechaza con error
    const user = userEvent.setup();
    const authError = Object.assign(new Error('Unauthorized'), { response: { status: 401 } });
    renderLoginPage({ login: vi.fn().mockRejectedValue(authError) });

    // WHEN: rellenar form con credenciales incorrectas y enviar
    await user.type(screen.getByLabelText(/correo electrónico/i), 'bad@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'claveincorrecta');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // THEN: mensaje de error visible, sin redirección
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  // ─── loginPage_onError_clearsPasswordField ───────────────────────────────────

  it('loginPage_onError_clearsPasswordField — tras error de login, el campo de password queda vacío', async () => {
    // GIVEN: login rechaza con error
    const user = userEvent.setup();
    renderLoginPage({ login: vi.fn().mockRejectedValue(new Error('Unauthorized')) });

    // WHEN: ingresar contraseña y enviar
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // THEN: campo de password limpiado
    expect(screen.getByLabelText(/contraseña/i)).toHaveValue('');
  });

  // ─── loginPage_doesNotContainHardcodedCredentials ────────────────────────────

  it('loginPage_doesNotContainHardcodedCredentials — el código fuente no contiene credenciales hardcodeadas', () => {
    // GIVEN: source importado con ?raw (Vite transforma el módulo a string literal)
    // THEN: no hay credenciales hardcodeadas
    expect(loginPageSource).not.toContain('admin@');
    expect(loginPageSource).not.toContain('admin123');
  });

  // ─── loginPage_showsLoadingState_duringSubmit ────────────────────────────────

  it('loginPage_showsLoadingState_duringSubmit — con isLoading true, el botón está deshabilitado y muestra texto alternativo', () => {
    // GIVEN: isLoading true (simulando que el login está en curso)
    renderLoginPage({ isLoading: true });

    // THEN: el botón está deshabilitado con texto de carga
    const button = screen.getByRole('button', { name: /iniciando sesión/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
