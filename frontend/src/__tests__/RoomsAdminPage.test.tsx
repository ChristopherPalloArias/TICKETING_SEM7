import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoomsAdminPage from '../pages/admin/RoomsAdminPage/RoomsAdminPage';

// Mock the useRooms hook
vi.mock('../hooks/useRooms');
vi.mock('../utils/toast');

import { useRooms } from '../hooks/useRooms';
import { showToast } from '../utils/toast';

const mockUseRooms = vi.mocked(useRooms);
const mockShowToast = vi.mocked(showToast);

const mockRoom1 = { id: 'r1', name: 'Teatro Real', maxCapacity: 300 };
const mockRoom2 = { id: 'r2', name: 'Grand Opera', maxCapacity: 500 };

const createNewRoom = vi.fn();
const updateExistingRoom = vi.fn();
const deleteExistingRoom = vi.fn();

const defaultHookValue = {
  rooms: [mockRoom1, mockRoom2],
  loading: false,
  error: null,
  createNewRoom,
  updateExistingRoom,
  deleteExistingRoom,
  refetch: vi.fn(),
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RoomsAdminPage />
    </MemoryRouter>
  );

describe('RoomsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRooms.mockReturnValue(defaultHookValue);
  });

  // --- Loading state ---

  it('shows loading message while fetching rooms', () => {
    // GIVEN
    mockUseRooms.mockReturnValue({ ...defaultHookValue, loading: true, rooms: [] });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Cargando salas...')).toBeInTheDocument();
  });

  // --- Empty state ---

  it('shows empty state when no rooms exist', () => {
    // GIVEN
    mockUseRooms.mockReturnValue({ ...defaultHookValue, rooms: [] });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('No hay salas registradas')).toBeInTheDocument();
    expect(screen.getByText('Crear Primera Sala')).toBeInTheDocument();
  });

  // --- Rooms table ---

  it('renders rooms table with all rooms', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Teatro Real')).toBeInTheDocument();
    expect(screen.getByText('Grand Opera')).toBeInTheDocument();
    expect(screen.getByText('300 personas')).toBeInTheDocument();
    expect(screen.getByText('500 personas')).toBeInTheDocument();
  });

  it('shows total rooms count', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // --- Create modal ---

  it('opens create modal when "Nueva Sala" button is clicked', () => {
    // GIVEN
    renderPage();

    // WHEN
    fireEvent.click(screen.getByText('Nueva Sala'));

    // THEN
    expect(screen.getByText('Nueva Sala', { selector: 'h2' })).toBeInTheDocument();
  });

  it('creates room and shows success toast', async () => {
    // GIVEN
    createNewRoom.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getByText('Nueva Sala'));

    // WHEN — fill form and submit
    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    const capacityInput = screen.getByLabelText(/Capacidad Máxima/i);
    fireEvent.change(nameInput, { target: { value: 'Sala Nueva' } });
    fireEvent.change(capacityInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Crear'));

    // THEN
    await waitFor(() => {
      expect(createNewRoom).toHaveBeenCalledWith({ name: 'Sala Nueva', maxCapacity: 200 });
    });
    expect(mockShowToast).toHaveBeenCalledWith('Sala creada exitosamente', 'success');
  });

  it('shows error toast when create fails', async () => {
    // GIVEN
    createNewRoom.mockRejectedValue(new Error('Nombre duplicado'));
    renderPage();
    fireEvent.click(screen.getByText('Nueva Sala'));

    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    const capacityInput = screen.getByLabelText(/Capacidad Máxima/i);
    fireEvent.change(nameInput, { target: { value: 'Sala X' } });
    fireEvent.change(capacityInput, { target: { value: '100' } });

    // WHEN
    fireEvent.click(screen.getByText('Crear'));

    // THEN
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Nombre duplicado', 'error');
    });
  });

  // --- Edit modal ---

  it('opens edit modal pre-filled when edit button is clicked', () => {
    // GIVEN
    renderPage();

    // WHEN — click first edit button
    const editButtons = screen.getAllByTitle('Editar sala');
    fireEvent.click(editButtons[0]);

    // THEN
    expect(screen.getByText('Editar Sala')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de la Sala/i)).toHaveValue('Teatro Real');
  });

  it('updates room and shows success toast', async () => {
    // GIVEN
    updateExistingRoom.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getAllByTitle('Editar sala')[0]);

    // WHEN — change name and submit
    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    fireEvent.change(nameInput, { target: { value: 'Teatro Actualizado' } });
    fireEvent.click(screen.getByText('Actualizar'));

    // THEN
    await waitFor(() => {
      expect(updateExistingRoom).toHaveBeenCalledWith(
        'r1',
        { name: 'Teatro Actualizado', maxCapacity: 300 }
      );
    });
    expect(mockShowToast).toHaveBeenCalledWith('Sala actualizada exitosamente', 'success');
  });

  // --- Delete confirmation ---

  it('shows delete confirmation when delete button is clicked', () => {
    // GIVEN
    renderPage();

    // WHEN
    const deleteButtons = screen.getAllByTitle('Eliminar sala');
    fireEvent.click(deleteButtons[0]);

    // THEN
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('cancels delete when "No" is clicked', () => {
    // GIVEN
    renderPage();
    fireEvent.click(screen.getAllByTitle('Eliminar sala')[0]);
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument();

    // WHEN
    fireEvent.click(screen.getByText('No'));

    // THEN
    expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument();
  });

  it('deletes room and shows success toast on confirm', async () => {
    // GIVEN
    deleteExistingRoom.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getAllByTitle('Eliminar sala')[0]);

    // WHEN
    fireEvent.click(screen.getByText('Sí'));

    // THEN
    await waitFor(() => {
      expect(deleteExistingRoom).toHaveBeenCalledWith('r1');
    });
    expect(mockShowToast).toHaveBeenCalledWith('Sala eliminada exitosamente', 'success');
  });

  it('shows error toast when delete fails', async () => {
    // GIVEN
    deleteExistingRoom.mockRejectedValue(new Error('Sala con eventos asociados'));
    renderPage();
    fireEvent.click(screen.getAllByTitle('Eliminar sala')[0]);

    // WHEN
    fireEvent.click(screen.getByText('Sí'));

    // THEN
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Sala con eventos asociados', 'error');
    });
  });
});
