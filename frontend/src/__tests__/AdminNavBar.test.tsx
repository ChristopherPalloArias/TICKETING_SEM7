import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminNavBar from '../components/admin/AdminNavBar/AdminNavBar';

vi.mock('../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useAuth } from '../hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('AdminNavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
      role: 'ADMIN',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@sem7.com',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      registerBuyer: vi.fn(),
    });
  });

  it('muestra email del admin y botón cerrar sesión', () => {
    // GIVEN / WHEN: navbar renderizado con sesión activa
    render(
      <MemoryRouter>
        <AdminNavBar />
      </MemoryRouter>,
    );

    // THEN: email del administrador visible y botón de logout presente
    expect(screen.getByText('admin@sem7.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('llama logout al hacer clic en cerrar sesión', async () => {
    // GIVEN: navbar renderizado con función logout controlada
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
      role: 'ADMIN',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@sem7.com',
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      registerBuyer: vi.fn(),
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminNavBar />
      </MemoryRouter>,
    );

    // WHEN: clic en botón cerrar sesión
    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    // THEN: logout invocado una vez y navegación a /admin/login
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
  });
});
