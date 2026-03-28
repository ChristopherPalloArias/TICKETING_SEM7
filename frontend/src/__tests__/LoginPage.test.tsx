import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/admin/LoginPage/LoginPage';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

const DEMO_EMAIL = 'admin@sem7.com';
const DEMO_PASSWORD = 'admin123';

function buildAuthMock(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    isAuthenticated: false,
    role: null,
    userId: null,
    email: null,
    login: vi.fn().mockReturnValue(false),
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

  it('renderiza formulario con inputs email y password', () => {
    // GIVEN / WHEN: componente renderizado sin sesión activa
    renderLoginPage();

    // THEN: inputs de email, password y botón de submit presentes
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra "Credenciales inválidas" tras login fallido', async () => {
    // GIVEN: login retorna false (credenciales incorrectas)
    const user = userEvent.setup();
    renderLoginPage({ login: vi.fn().mockReturnValue(false) });

    // WHEN: llenar formulario con credenciales incorrectas y enviar
    await user.type(screen.getByLabelText(/correo electrónico/i), 'wrong@email.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'claveincorrecta');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // THEN: mensaje de error visible, sin redirección
    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('redirige a /admin/events tras login exitoso', async () => {
    // GIVEN: login retorna true (credenciales correctas)
    const user = userEvent.setup();
    renderLoginPage({ login: vi.fn().mockReturnValue(true) });

    // WHEN: llenar formulario con credenciales de demo y enviar
    await user.type(screen.getByLabelText(/correo electrónico/i), DEMO_EMAIL);
    await user.type(screen.getByLabelText(/contraseña/i), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // THEN: redirige al dashboard del administrador
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  it('redirige a /admin/events si ya autenticado', () => {
    // GIVEN: usuario ya con sesión activa
    renderLoginPage({ isAuthenticated: true });

    // THEN: redirige automáticamente sin mostrar el formulario de login
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });
});
