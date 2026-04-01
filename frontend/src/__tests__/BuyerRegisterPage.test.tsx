import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BuyerRegisterPage from '../pages/BuyerRegisterPage/BuyerRegisterPage';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function renderPage(registerBuyer = vi.fn().mockResolvedValue(undefined)) {
  mockUseAuth.mockReturnValue({
    token: null,
    role: null,
    userId: null,
    email: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    registerBuyer,
  });

  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <Routes>
        <Route path="/registro" element={<BuyerRegisterPage />} />
        <Route path="/eventos" element={<div data-testid="eventos-page">Eventos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BuyerRegisterPage (SPEC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida reglas de password (min 8, mayúscula, número)', async () => {
    const user = userEvent.setup();
    const registerBuyer = vi.fn();
    renderPage(registerBuyer);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'buyer@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'password1');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password1');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(screen.getByText(/debe contener al menos 1 mayúscula/i)).toBeInTheDocument();
    expect(registerBuyer).not.toHaveBeenCalled();
  });

  it('valida que contraseña y confirmación coincidan', async () => {
    const user = userEvent.setup();
    const registerBuyer = vi.fn();
    renderPage(registerBuyer);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'buyer@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password2');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(registerBuyer).not.toHaveBeenCalled();
  });

  it('invoca registerBuyer y navega a /eventos', async () => {
    const user = userEvent.setup();
    const registerBuyer = vi.fn().mockResolvedValue(undefined);
    renderPage(registerBuyer);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'buyer@test.com');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(registerBuyer).toHaveBeenCalledWith('buyer@test.com', 'Password1');
      expect(screen.getByTestId('eventos-page')).toBeInTheDocument();
    });
  });
});
