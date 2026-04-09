import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VenuesPage from '../pages/VenuesPage/VenuesPage';

vi.mock('../services/venueService');
vi.mock('../services/eventService');
vi.mock('../hooks/useEvents', () => ({
  useEvents: () => ({ events: [], loading: false, loadingMore: false, error: null, hasMore: false, loadMore: vi.fn() }),
}));
vi.mock('../contexts/NotificationsContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    addNotification: vi.fn(),
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
    setPollingEnabled: vi.fn(),
  }),
}));
vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    clearCart: vi.fn(),
    activeItemCount: 0,
  }),
}));
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    token: null,
    role: null,
    userId: null,
    email: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    registerBuyer: vi.fn(),
  }),
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <section {...props}>{children}</section>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Comp = () => null;
    Comp.displayName = name;
    return Comp;
  };
  return {
    MapPin: stub('MapPin'),
    Users: stub('Users'),
    Calendar: stub('Calendar'),
    ArrowRight: stub('ArrowRight'),
    Bell: stub('Bell'),
    ShoppingCart: stub('ShoppingCart'),
    Timer: stub('Timer'),
    Search: stub('Search'),
    CreditCard: stub('CreditCard'),
    User: stub('User'),
    XCircle: stub('XCircle'),
    CheckCircle2: stub('CheckCircle2'),
    Trash2: stub('Trash2'),
  };
});

import { getPublicRooms } from '../services/venueService';
import { getEvents } from '../services/eventService';

const mockGetPublicRooms = vi.mocked(getPublicRooms);
const mockGetEvents = vi.mocked(getEvents);

function buildRooms() {
  return [
    { id: 'room-1', name: 'Teatro Real', maxCapacity: 500 },
    { id: 'room-2', name: 'Grand Opera House', maxCapacity: 300 },
  ];
}

function buildEventsResponse() {
  return {
    total: 1,
    events: [
      {
        id: 'evt-1',
        title: 'Hamlet',
        description: 'Obra clásica',
        date: '2026-07-15T20:00:00',
        capacity: 500,
        room: { id: 'room-1', name: 'Teatro Real', maxCapacity: 500 },
        availableTiers: [],
        created_at: '2026-01-01T00:00:00',
      },
    ],
    page: 1,
    pageSize: 50,
    hasMore: false,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/venues']}>
      <VenuesPage />
    </MemoryRouter>,
  );
}

describe('VenuesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders venue cards with data from venueService', async () => {
    // GIVEN: venueService and eventService resolve with data
    mockGetPublicRooms.mockResolvedValueOnce(buildRooms());
    mockGetEvents.mockResolvedValueOnce(buildEventsResponse());

    // WHEN: page renders
    renderPage();

    // THEN: venue cards are displayed with names from the service
    await waitFor(() => {
      expect(screen.getByText('Teatro Real')).toBeInTheDocument();
    });
    expect(screen.getByText('Grand Opera House')).toBeInTheDocument();
  });

  it('shows event links associated with a venue', async () => {
    // GIVEN: room-1 has one event "Hamlet"
    mockGetPublicRooms.mockResolvedValueOnce(buildRooms());
    mockGetEvents.mockResolvedValueOnce(buildEventsResponse());

    // WHEN
    renderPage();

    // THEN: event title for Teatro Real's event is visible
    await waitFor(() => {
      expect(screen.getByText('Hamlet')).toBeInTheDocument();
    });
  });

  it('shows error message when API fails', async () => {
    // GIVEN: venueService rejects
    mockGetPublicRooms.mockRejectedValueOnce(new Error('Network Error'));
    mockGetEvents.mockResolvedValueOnce(buildEventsResponse());

    // WHEN: page renders
    renderPage();

    // THEN: friendly error message is shown
    await waitFor(() => {
      expect(
        screen.getByText(/no se pudieron cargar los venues/i),
      ).toBeInTheDocument();
    });
  });

  it('does not display venue cards when API fails', async () => {
    // GIVEN: venueService rejects
    mockGetPublicRooms.mockRejectedValueOnce(new Error('fail'));
    mockGetEvents.mockResolvedValueOnce(buildEventsResponse());

    // WHEN
    renderPage();

    // THEN: no venue card names are shown
    await waitFor(() => {
      expect(
        screen.getByText(/no se pudieron cargar los venues/i),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Teatro Real')).not.toBeInTheDocument();
  });
});
