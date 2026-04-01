import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CancelEventModal from '../components/admin/CancelEventModal/CancelEventModal';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CancelEventModal (SPEC-021)', () => {
  it('exige motivo mínimo de 10 caracteres', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <CancelEventModal
        eventId="event-1"
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const reasonInput = screen.getByLabelText(/motivo de cancelación/i);
    const confirmButton = screen.getByRole('button', { name: /confirmar cancelación/i });

    await user.type(reasonInput, 'muy corto');
    expect(screen.getByText(/mínimo 10 caracteres requeridos/i)).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();

    await user.click(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ejecuta onConfirm con motivo válido (trim)', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <CancelEventModal
        eventId="event-1"
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const reasonInput = screen.getByLabelText(/motivo de cancelación/i);
    const confirmButton = screen.getByRole('button', { name: /confirmar cancelación/i });

    await user.type(reasonInput, '  Motivo válido de cancelación  ');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('Motivo válido de cancelación');
  });
});
