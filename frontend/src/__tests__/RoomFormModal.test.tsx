import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomFormModal from '../components/admin/RoomFormModal/RoomFormModal';
import type { RoomOption } from '../types/admin.types';

const mockRoom: RoomOption = { id: 'r1', name: 'Teatro Real', maxCapacity: 300 };

describe('RoomFormModal', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Visibility ---

  it('renders nothing when isOpen is false', () => {
    // GIVEN / WHEN
    const { container } = render(
      <RoomFormModal isOpen={false} onClose={onClose} onSubmit={onSubmit} />
    );

    // THEN
    expect(container.firstChild).toBeNull();
  });

  it('renders modal overlay when isOpen is true', () => {
    // GIVEN / WHEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    // THEN
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  // --- Title and mode ---

  it('shows "Nueva Sala" title when no room prop', () => {
    // GIVEN / WHEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    // THEN
    expect(screen.getByText('Nueva Sala')).toBeInTheDocument();
    expect(screen.getByText('Crear')).toBeInTheDocument();
  });

  it('shows "Editar Sala" title and "Actualizar" button when room prop provided', () => {
    // GIVEN / WHEN
    render(
      <RoomFormModal isOpen={true} room={mockRoom} onClose={onClose} onSubmit={onSubmit} />
    );

    // THEN
    expect(screen.getByText('Editar Sala')).toBeInTheDocument();
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
  });

  it('pre-fills form fields with existing room data when editing', () => {
    // GIVEN / WHEN
    render(
      <RoomFormModal isOpen={true} room={mockRoom} onClose={onClose} onSubmit={onSubmit} />
    );

    // THEN
    expect(screen.getByLabelText(/Nombre de la Sala/i)).toHaveValue('Teatro Real');
    expect(screen.getByLabelText(/Capacidad Máxima/i)).toHaveValue(300);
  });

  // --- Validation ---

  it('shows error when submitting with empty name', async () => {
    // GIVEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const submitBtn = screen.getByText('Crear');

    // WHEN
    fireEvent.click(submitBtn);

    // THEN
    expect(await screen.findByText('El nombre de la sala es requerido')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when submitting with capacity 0 or negative', async () => {
    // GIVEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);
    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    await userEvent.type(nameInput, 'Sala A');

    // WHEN — capacity left empty (0)
    fireEvent.click(screen.getByText('Crear'));

    // THEN
    expect(await screen.findByText('La capacidad debe ser mayor a 0')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // --- Happy path ---

  it('calls onSubmit with form data and closes modal on success', async () => {
    // GIVEN
    onSubmit.mockResolvedValue(undefined);
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    const capacityInput = screen.getByLabelText(/Capacidad Máxima/i);

    // WHEN
    await userEvent.type(nameInput, 'Sala Principal');
    await userEvent.clear(capacityInput);
    await userEvent.type(capacityInput, '500');
    fireEvent.click(screen.getByText('Crear'));

    // THEN
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Sala Principal', maxCapacity: 500 });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows server error message when onSubmit rejects', async () => {
    // GIVEN
    onSubmit.mockRejectedValue(new Error('Sala ya existe'));
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/Nombre de la Sala/i);
    const capacityInput = screen.getByLabelText(/Capacidad Máxima/i);
    await userEvent.type(nameInput, 'Sala A');
    await userEvent.clear(capacityInput);
    await userEvent.type(capacityInput, '100');

    // WHEN
    fireEvent.click(screen.getByText('Crear'));

    // THEN
    expect(await screen.findByText('Sala ya existe')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  // --- Close button ---

  it('calls onClose when close button is clicked', () => {
    // GIVEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    // WHEN
    fireEvent.click(screen.getByLabelText('Cerrar'));

    // THEN
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    // GIVEN
    render(<RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    // WHEN
    fireEvent.click(screen.getByText('Cancelar'));

    // THEN
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- isSubmitting state ---

  it('shows "Procesando..." and disables inputs when isSubmitting', () => {
    // GIVEN / WHEN
    render(
      <RoomFormModal isOpen={true} onClose={onClose} onSubmit={onSubmit} isSubmitting={true} />
    );

    // THEN
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de la Sala/i)).toBeDisabled();
    expect(screen.getByLabelText(/Capacidad Máxima/i)).toBeDisabled();
    expect(screen.getByLabelText('Cerrar')).toBeDisabled();
  });
});
