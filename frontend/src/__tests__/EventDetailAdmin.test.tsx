import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventDetailAdmin from '../pages/admin/EventDetailAdmin/EventDetailAdmin';
import type { AdminEventResponse, AdminTierResponse } from '../types/admin.types';

vi.mock('../hooks/admin/useAdminEventDetail');
vi.mock('../hooks/admin/useEventTiers');
vi.mock('../hooks/useAuth');
vi.mock('../services/adminEventService');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAdminEventDetail } from '../hooks/admin/useAdminEventDetail';
import { useEventTiers } from '../hooks/admin/useEventTiers';
import { useAuth } from '../hooks/useAuth';

const mockUseAdminEventDetail = vi.mocked(useAdminEventDetail);
const mockUseEventTiers = vi.mocked(useEventTiers);
const mockUseAuth = vi.mocked(useAuth);

function buildEvent(overrides: Partial<AdminEventResponse> = {}): AdminEventResponse {
  return {
    id: 'event-1',
    title: 'Bodas de Sangre',
    description: 'Tragedia en tres actos',
    date: '2026-07-01T20:00:00',
    capacity: 200,
    status: 'DRAFT',
    room: { id: 'room-1', name: 'Teatro Real', maxCapacity: 300 },
    availableTiers: [],
    createdBy: 'admin',
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function buildTier(overrides: Partial<AdminTierResponse> = {}): AdminTierResponse {
  return {
    id: 'tier-1',
    tierType: 'GENERAL',
    price: 75000,
    quota: 100,
    validFrom: null,
    validUntil: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEventDetailMock(event: AdminEventResponse | null, overrides: any = {}) {
  return {
    event,
    loading: false,
    error: null,
    setEvent: vi.fn(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTiersMock(tiers: AdminTierResponse[] = [], overrides: any = {}) {
  return {
    tiers,
    loading: false,
    error: null,
    addTier: vi.fn(),
    deleteTier: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1']}>
      <Routes>
        <Route path="/admin/events/:id" element={<EventDetailAdmin />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EventDetailAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'ADMIN',
      userId: 'user-1',
      email: 'admin@sem7.com',
      login: vi.fn(),
      logout: vi.fn(),
    } as ReturnType<typeof useAuth>);
  });

  it('renders event info and tier section', () => {
    // GIVEN
    mockUseAdminEventDetail.mockReturnValue(buildEventDetailMock(buildEvent()));
    mockUseEventTiers.mockReturnValue(buildTiersMock([buildTier()]));

    // WHEN
    renderPage();

    // THEN: event title and tiers section heading visible
    expect(screen.getByText('Bodas de Sangre')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('shows empty state when no tiers', () => {
    // GIVEN: event in DRAFT with zero tiers
    mockUseAdminEventDetail.mockReturnValue(buildEventDetailMock(buildEvent()));
    mockUseEventTiers.mockReturnValue(buildTiersMock([]));

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText(/no hay tiers configurados/i)).toBeInTheDocument();
  });

  it('disables tier management when event is PUBLISHED', () => {
    // GIVEN: published event with one tier
    mockUseAdminEventDetail.mockReturnValue(
      buildEventDetailMock(buildEvent({ status: 'PUBLISHED' })),
    );
    mockUseEventTiers.mockReturnValue(buildTiersMock([buildTier()]));

    // WHEN
    renderPage();

    // THEN: add-tier, publish and delete actions are all absent
    expect(screen.queryByRole('button', { name: /agregar tier/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publicar evento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });
});
