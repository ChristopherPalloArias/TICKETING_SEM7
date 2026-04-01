import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BuyerLoginPage from '../pages/BuyerLoginPage/BuyerLoginPage';

vi.mock('../hooks/useAuth');

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function renderPage(login = vi.fn().mockResolvedValue(undefined)) {
  mockUseAuth.mockReturnValue({
    token: null,
    role: null,
    userId: null,
    email: null,
    isAuthenticated: false,
    isLoading: false,
    login,
    logout: vi.fn(),
    registerBuyer: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/carrito' } }]}>
      <Routes>
        <Route path="/login" element={<BuyerLoginPage />} />
        <Route path="/carrito" element={<div data-testid="carrito-page">Carrito</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BuyerLoginPage (SPEC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invoca login y navega al path from', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    renderPage(login);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'buyer@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('buyer@test.com', 'Password1');
      expect(screen.getByTestId('carrito-page')).toBeInTheDocument();
    });
  });
});
