import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMyTickets } from '../hooks/useMyTickets';

vi.mock('../services/ticketService');
vi.mock('../hooks/useAuth');

import * as ticketService from '../services/ticketService';
import { useAuth } from '../hooks/useAuth';

const mockGetMyTickets = vi.mocked(ticketService.getMyTickets);
const mockUseAuth = vi.mocked(useAuth);

const mockAuthBuyer = {
  isAuthenticated: true,
  isLoading: false,
  role: 'BUYER' as const,
  userId: 'buyer-42',
  email: 'buyer@sem7.com',
  token: 'tok',
  login: vi.fn(),
  logout: vi.fn(),
  registerBuyer: vi.fn(),
};

const makeTicket = (id: string) => ({
  ticketId: id,
  eventId: 'event-1',
  eventTitle: 'El Fantasma de la Ópera',
  eventDate: '2026-07-01T20:00:00',
  tier: 'VIP',
  pricePaid: 120,
  status: 'VALID' as const,
  purchasedAt: '2026-03-01T10:00:00',
  buyerEmail: 'buyer@sem7.com',
});

const makePagedResponse = (tickets: typeof ticketService.MyTicketResponse[], total = 1) => ({
  content: tickets,
  page: 0,
  size: 10,
  totalElements: total,
  totalPages: Math.ceil(total / 10),
});

describe('useMyTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthBuyer);
  });

  it('starts with loading true and empty tickets', () => {
    // GIVEN service is pending
    mockGetMyTickets.mockReturnValue(new Promise(() => {}));

    // WHEN hook mounts
    const { result } = renderHook(() => useMyTickets());

    // THEN initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.tickets).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('loads tickets for authenticated buyer on mount', async () => {
    // GIVEN
    const tickets = [makeTicket('t-1'), makeTicket('t-2')];
    mockGetMyTickets.mockResolvedValue(makePagedResponse(tickets, 2));

    // WHEN
    const { result } = renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets).toHaveLength(2);
    expect(result.current.tickets[0].ticketId).toBe('t-1');
    expect(result.current.error).toBeNull();
  });

  it('calls getMyTickets with correct buyerId and page=0 by default', async () => {
    // GIVEN
    mockGetMyTickets.mockResolvedValue(makePagedResponse([]));

    // WHEN
    renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(mockGetMyTickets).toHaveBeenCalledTimes(1));
    expect(mockGetMyTickets).toHaveBeenCalledWith('buyer-42', { page: 0, size: 10 });
  });

  it('sets totalPages from response', async () => {
    // GIVEN 25 tickets → 3 pages
    const tickets = Array.from({ length: 10 }, (_, i) => makeTicket(`t-${i}`));
    mockGetMyTickets.mockResolvedValue({ ...makePagedResponse(tickets, 25), totalPages: 3 });

    // WHEN
    const { result } = renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalPages).toBe(3);
  });

  it('does not fetch when userId is null', async () => {
    // GIVEN user not authenticated
    mockUseAuth.mockReturnValue({ ...mockAuthBuyer, userId: null });

    // WHEN
    const { result } = renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetMyTickets).not.toHaveBeenCalled();
    expect(result.current.tickets).toEqual([]);
  });

  it('sets error on fetch failure', async () => {
    // GIVEN
    mockGetMyTickets.mockRejectedValue(new Error('Unauthorized'));

    // WHEN
    const { result } = renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Unauthorized');
    expect(result.current.tickets).toEqual([]);
  });

  it('uses fallback error message when error has no message', async () => {
    // GIVEN
    mockGetMyTickets.mockRejectedValue('bad error');

    // WHEN
    const { result } = renderHook(() => useMyTickets());

    // THEN
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Error al cargar tickets');
  });

  it('refetches when page changes via setPage', async () => {
    // GIVEN page 0 loaded
    mockGetMyTickets.mockResolvedValue(makePagedResponse([makeTicket('t-1')], 20));
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // WHEN setPage called
    mockGetMyTickets.mockResolvedValue(makePagedResponse([makeTicket('t-11')], 20));
    act(() => result.current.setPage(1));

    // THEN fetched with page 1
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGetMyTickets).toHaveBeenLastCalledWith('buyer-42', { page: 1, size: 10 });
  });

  it('manual refetch re-calls getMyTickets', async () => {
    // GIVEN
    mockGetMyTickets.mockResolvedValue(makePagedResponse([makeTicket('t-1')]));
    const { result } = renderHook(() => useMyTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // WHEN
    mockGetMyTickets.mockResolvedValue(makePagedResponse([makeTicket('t-1'), makeTicket('t-2')]));
    await act(() => result.current.refetch());

    // THEN
    await waitFor(() => expect(result.current.tickets).toHaveLength(2));
    expect(mockGetMyTickets).toHaveBeenCalledTimes(2);
  });
});
