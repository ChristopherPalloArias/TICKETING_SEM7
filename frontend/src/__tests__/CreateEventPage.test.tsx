import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateEventPage from '../pages/admin/CreateEventPage/CreateEventPage';

vi.mock('../hooks/useRooms');
vi.mock('../hooks/useCreateEvent');
vi.mock('../hooks/useAuth');

import { useRooms } from '../hooks/useRooms';
import { useCreateEvent } from '../hooks/useCreateEvent';
import { useAuth } from '../hooks/useAuth';

const mockUseRooms = vi.mocked(useRooms);
const mockUseCreateEvent = vi.mocked(useCreateEvent);
const mockUseAuth = vi.mocked(useAuth);

describe('CreateEventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
      role: 'ADMIN',
      userId: 'user-1',
      email: 'admin@sem7.com',
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      registerBuyer: vi.fn(),
    });
    mockUseCreateEvent.mockReturnValue({
      createEvent: vi.fn(),
      isSubmitting: false,
      error: null,
    });
  });

  it('displays rooms in the form selector', () => {
    mockUseRooms.mockReturnValue({
      rooms: [
        { id: 'r1', name: 'Teatro Real', maxCapacity: 300 },
        { id: 'r2', name: 'Grand Opera', maxCapacity: 500 },
      ],
      loading: false,
      error: null,
      createNewRoom: vi.fn(),
      updateExistingRoom: vi.fn(),
      deleteExistingRoom: vi.fn(),
      refetch: vi.fn(),
    });

    render(<MemoryRouter><CreateEventPage /></MemoryRouter>);

    expect(screen.getByText('Teatro Real (máx. 300)')).toBeInTheDocument();
    expect(screen.getByText('Grand Opera (máx. 500)')).toBeInTheDocument();
  });

  it('shows loading while rooms are loading', () => {
    mockUseRooms.mockReturnValue({ rooms: [], loading: true, error: null, createNewRoom: vi.fn(), updateExistingRoom: vi.fn(), deleteExistingRoom: vi.fn(), refetch: vi.fn() });

    render(<MemoryRouter><CreateEventPage /></MemoryRouter>);

    expect(screen.getByText('Cargando salas...')).toBeInTheDocument();
  });
});
