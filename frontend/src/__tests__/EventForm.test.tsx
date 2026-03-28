import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventForm from '../components/admin/EventForm/EventForm';
import type { RoomOption } from '../types/admin.types';

const rooms: RoomOption[] = [
  { id: 'room-1', name: 'Teatro Real', maxCapacity: 300 },
  { id: 'room-2', name: 'Grand Opera', maxCapacity: 500 },
];

function renderForm(overrides = {}) {
  const defaultProps = {
    rooms,
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitError: undefined,
    ...overrides,
  };
  return { ...render(<EventForm {...defaultProps} />), props: defaultProps };
}

describe('EventForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields on submit attempt', async () => {
    renderForm();

    // Submit with empty form
    fireEvent.submit(screen.getByRole('button', { name: 'Crear Evento' }).closest('form')!);

    await waitFor(() => {
      const errors = screen.getAllByText('Este campo es obligatorio');
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('validates capacity against room maxCapacity', async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Show' } });
    fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/Sala/), { target: { value: 'room-1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: /Aforo/ }), { target: { value: '999' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Crear Evento' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/El aforo no puede exceder la capacidad de la sala \(300\)/)).toBeInTheDocument();
    });
  });

  it('validates future date', async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Show' } });
    fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/Sala/), { target: { value: 'room-1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: /Aforo/ }), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Fecha y Hora/), { target: { value: '2020-01-01T10:00' } });

    fireEvent.submit(screen.getByRole('button', { name: 'Crear Evento' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('La fecha debe ser posterior a la fecha actual')).toBeInTheDocument();
    });
  });

  it('shows submit error when provided', () => {
    renderForm({ submitError: 'Ya existe un evento con ese título y fecha' });

    expect(screen.getByText('Ya existe un evento con ese título y fecha')).toBeInTheDocument();
  });

  it('disables submit button when submitting', () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByText('Creando...')).toBeDisabled();
  });
});
