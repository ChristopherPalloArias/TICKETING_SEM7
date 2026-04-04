import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage/ProfilePage';

vi.mock('../hooks/useAuth');
vi.mock('../services/authService');
vi.mock('../utils/toast');

import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../services/authService';
import { showToast } from '../utils/toast';

const mockUseAuth = vi.mocked(useAuth);
const mockChangePassword = vi.mocked(changePassword);
const mockShowToast = vi.mocked(showToast);

const mockAuthBuyer = {
  isAuthenticated: true,
  isLoading: false,
  role: 'BUYER' as const,
  userId: 'buyer-1',
  email: 'buyer@sem7.com',
  token: 'tok-abc',
  login: vi.fn(),
  logout: vi.fn(),
  registerBuyer: vi.fn(),
};

const getSubmitBtn = () => screen.getByRole('button', { name: /Cambiar Contraseña/i });

const fillForm = (current: string, next: string, confirm: string) => {
  fireEvent.change(screen.getByLabelText('Contraseña Actual'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: confirm } });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthBuyer);
  });

  // --- Basic render ---

  it('renders page header', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Administra tu cuenta y contraseña')).toBeInTheDocument();
  });

  it('displays authenticated user email', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('buyer@sem7.com')).toBeInTheDocument();
  });

  it('renders password change form with all three fields', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByLabelText('Contraseña Actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
  });

  it('renders submit button with correct label', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(getSubmitBtn()).toBeInTheDocument();
  });

  // --- Validation: required fields ---

  it('shows error when current password is empty on submit', async () => {
    // GIVEN
    renderPage();

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(await screen.findByText('La contraseña actual es requerida')).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is empty on submit', async () => {
    // GIVEN
    renderPage();
    fireEvent.change(screen.getByLabelText('Contraseña Actual'), { target: { value: 'Pass1234' } });

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(await screen.findByText('La nueva contraseña es requerida')).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    // GIVEN
    renderPage();
    fillForm('Curr3nt!', 'New1pass!', 'Different1!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  // --- Validation: password strength ---

  it('shows error when new password is too short (< 8 chars)', async () => {
    // GIVEN
    renderPage();
    fillForm('Curr3nt!', 'Ab1', 'Ab1');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres')
    ).toBeInTheDocument();
  });

  it('shows error when new password has no uppercase letter', async () => {
    // GIVEN
    renderPage();
    fillForm('Curr3nt!', 'nouppercase1', 'nouppercase1');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(
      await screen.findByText('La contraseña debe contener al menos una mayúscula')
    ).toBeInTheDocument();
  });

  it('shows error when new password has no digit', async () => {
    // GIVEN
    renderPage();
    fillForm('Curr3nt!', 'NoNumberHere', 'NoNumberHere');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(
      await screen.findByText('La contraseña debe contener al menos un número')
    ).toBeInTheDocument();
  });

  // --- Happy path ---

  it('calls changePassword with current, new password and token', async () => {
    // GIVEN
    mockChangePassword.mockResolvedValue({ message: 'Contraseña actualizada' });
    renderPage();
    fillForm('Current1!', 'NewPass1!', 'NewPass1!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith('Current1!', 'NewPass1!', 'tok-abc')
    );
  });

  it('shows success toast after password change', async () => {
    // GIVEN
    mockChangePassword.mockResolvedValue({ message: 'Contraseña actualizada' });
    renderPage();
    fillForm('Current1!', 'NewPass1!', 'NewPass1!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith('Contraseña actualizada exitosamente', 'success')
    );
  });

  // --- Error path ---

  it('shows server error message when changePassword rejects with response', async () => {
    // GIVEN
    mockChangePassword.mockRejectedValue({
      response: { data: { message: 'Contraseña actual incorrecta' } },
    });
    renderPage();
    fillForm('WrongPass1!', 'NewPass2!', 'NewPass2!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(await screen.findByText('Contraseña actual incorrecta')).toBeInTheDocument();
  });

  it('shows fallback error message when rejection has no response', async () => {
    // GIVEN
    mockChangePassword.mockRejectedValue(new Error());
    renderPage();
    fillForm('WrongPass1!', 'NewPass2!', 'NewPass2!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN
    expect(await screen.findByText('Error al actualizar la contraseña')).toBeInTheDocument();
  });

  // --- Loading state ---

  it('shows "Actualizando..." while changePassword is in-flight', async () => {
    // GIVEN — promise never resolves synchronously
    let finishRequest!: (v: { message: string }) => void;
    mockChangePassword.mockReturnValue(
      new Promise<{ message: string }>((resolve) => {
        finishRequest = resolve;
      })
    );
    renderPage();
    fillForm('Current1!', 'NewPass1!', 'NewPass1!');

    // WHEN
    fireEvent.click(getSubmitBtn());

    // THEN — loading text appears while in-flight
    await waitFor(() => expect(screen.getByText('Actualizando...')).toBeInTheDocument());

    // cleanup — resolve so React can finish and avoid act() warnings
    finishRequest({ message: 'Contraseña actualizada' });
    await waitFor(() => expect(screen.queryByText('Actualizando...')).not.toBeInTheDocument());
  });
});
