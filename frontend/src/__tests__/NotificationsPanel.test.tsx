import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPanel from '../components/NavBar/NotificationsPanel';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../contexts/NotificationsContext');

import { useNotifications } from '../contexts/NotificationsContext';

const mockUseNotifications = vi.mocked(useNotifications);

interface MockNotification {
  id: string;
  type: 'timer_expired' | 'payment_rejected';
  title: string;
  message: string;
  eventTitle: string;
  timestamp: Date;
  read: boolean;
  reservationId?: string;
}

function makeNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  return {
    id: 'notif-1',
    type: 'payment_rejected',
    title: 'Pago rechazado',
    message: 'Tu pago para "Hamlet" fue rechazado.',
    eventTitle: 'Hamlet',
    timestamp: new Date('2026-03-28T10:00:00Z'),
    read: false,
    ...overrides,
  };
}

function buildMockValue(overrides: Partial<ReturnType<typeof useNotifications>> = {}) {
  return {
    notifications: [] as MockNotification[],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
    setPollingEnabled: vi.fn(),
    ...overrides,
  };
}

describe('NotificationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders backend notifications with eventName', () => {
    // GIVEN: a backend notification with eventName
    const notification = makeNotification({ eventTitle: 'Hamlet en el Noir' });
    mockUseNotifications.mockReturnValue(buildMockValue({
      notifications: [notification],
    }));

    // WHEN
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    // THEN: notification title and event name are visible
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
    expect(screen.getByText('Hamlet en el Noir')).toBeInTheDocument();
  });

  it('calls markAllRead on open', () => {
    // GIVEN
    const mockMarkAllRead = vi.fn();
    mockUseNotifications.mockReturnValue(buildMockValue({
      markAllRead: mockMarkAllRead,
    }));

    // WHEN: panel opens with isOpen=true
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    // THEN: markAllRead called on mount
    expect(mockMarkAllRead).toHaveBeenCalledOnce();
  });

  it('shows fallback when eventName is null', () => {
    // GIVEN: notification with fallback eventTitle ("Evento" — mapped from null eventName)
    const notification = makeNotification({ eventTitle: 'Evento' });
    mockUseNotifications.mockReturnValue(buildMockValue({
      notifications: [notification],
    }));

    // WHEN
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    // THEN: fallback text "Evento" is displayed
    expect(screen.getByText('Evento')).toBeInTheDocument();
  });

  it('clearAll calls archiveAll on backend', async () => {
    // GIVEN: panel with notifications and clear button visible
    const mockClearAll = vi.fn();
    const notification = makeNotification();
    mockUseNotifications.mockReturnValue(buildMockValue({
      notifications: [notification],
      clearAll: mockClearAll,
    }));

    const user = userEvent.setup();
    render(<NotificationsPanel isOpen={true} onClose={vi.fn()} />);

    // WHEN: click "Borrar todas"
    await user.click(screen.getByRole('button', { name: /borrar todas/i }));

    // THEN: clearAll (which internally calls archiveAll) is invoked
    expect(mockClearAll).toHaveBeenCalledOnce();
  });

  it('archived notifications do not reappear after polling', () => {
    // GIVEN: panel initially has notifications
    const notification = makeNotification();
    mockUseNotifications.mockReturnValue(buildMockValue({
      notifications: [notification],
    }));

    const onClose = vi.fn();
    const { rerender } = render(
      <NotificationsPanel isOpen={true} onClose={onClose} />,
    );
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();

    // WHEN: after archiving, next polling returns empty (backend filtered archived)
    mockUseNotifications.mockReturnValue(buildMockValue({
      notifications: [],
    }));
    rerender(<NotificationsPanel isOpen={true} onClose={onClose} />);

    // THEN: panel shows empty state — archived notifications don't reappear
    expect(screen.queryByText('Pago rechazado')).not.toBeInTheDocument();
    expect(screen.getByText('Sin notificaciones')).toBeInTheDocument();
  });
});
