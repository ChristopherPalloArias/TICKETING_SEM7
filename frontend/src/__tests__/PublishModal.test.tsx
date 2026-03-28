import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublishModal from '../components/admin/PublishModal/PublishModal';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const DEFAULT_PROPS = {
  isOpen: true,
  eventTitle: 'Bodas de Sangre',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  loading: false,
};

describe('PublishModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows confirmation text with event title', () => {
    // GIVEN / WHEN
    render(<PublishModal {...DEFAULT_PROPS} />);

    // THEN: event title and warning message are both visible
    expect(screen.getByText('Bodas de Sangre')).toBeInTheDocument();
    expect(screen.getByText(/publicar este evento/i)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    // GIVEN
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<PublishModal {...DEFAULT_PROPS} onConfirm={onConfirm} />);

    // WHEN
    await user.click(screen.getByRole('button', { name: /^publicar$/i }));

    // THEN
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
