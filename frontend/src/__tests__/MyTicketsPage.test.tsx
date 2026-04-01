import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyTicketsPage from '../pages/MyTicketsPage/MyTicketsPage';

vi.mock('../hooks/useMyTickets');
vi.mock('../utils/toast');
vi.mock('../components/NavBar/NavBar', () => ({
  default: () => <nav data-testid="navbar" />,
}));
vi.mock('../components/NavBar/BottomNav', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}));
vi.mock('../components/Ticket/TicketCard', () => ({
  default: ({ ticket }: { ticket: { ticketId: string; eventTitle: string } }) => (
    <div data-testid={`ticket-${ticket.ticketId}`}>{ticket.eventTitle}</div>
  ),
}));

import { useMyTickets } from '../hooks/useMyTickets';

const mockUseMyTickets = vi.mocked(useMyTickets);

const makeTicket = (id: string, date = '2026-03-01T10:00:00') => ({
  ticketId: id,
  eventId: 'event-1',
  eventTitle: `Evento ${id}`,
  eventDate: '2026-07-01T20:00:00',
  tier: 'VIP',
  pricePaid: 120,
  status: 'VALID' as const,
  purchasedAt: date,
  buyerEmail: 'buyer@sem7.com',
});

const setPage = vi.fn();

const defaultHookValue = {
  tickets: [makeTicket('t1'), makeTicket('t2')],
  loading: false,
  error: null,
  page: 0,
  totalPages: 1,
  setPage,
  refetch: vi.fn(),
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyTicketsPage />
    </MemoryRouter>
  );

describe('MyTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyTickets.mockReturnValue(defaultHookValue);
  });

  // --- Loading state ---

  it('renders loading state when loading is true', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, loading: true, tickets: [] });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Cargando tickets...')).toBeInTheDocument();
  });

  // --- Empty state ---

  it('renders empty state message when no tickets', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, tickets: [] });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Aún no tienes tickets')).toBeInTheDocument();
    expect(screen.getByText('Explorar cartelera')).toBeInTheDocument();
  });

  it('renders link to /eventos in empty state', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, tickets: [] });

    // WHEN
    renderPage();

    // THEN
    const link = screen.getByRole('link', { name: /Explorar cartelera/i });
    expect(link).toHaveAttribute('href', '/eventos');
  });

  // --- Tickets list ---

  it('renders ticket cards for each ticket', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByTestId('ticket-t1')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-t2')).toBeInTheDocument();
  });

  it('renders page heading', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Mis Tickets')).toBeInTheDocument();
  });

  // --- Sort control ---

  it('renders sort select with default "Más recientes primero"', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    const select = screen.getByDisplayValue('Más recientes primero');
    expect(select).toBeInTheDocument();
  });

  it('allows changing sort order to "Más antiguos primero"', () => {
    // GIVEN
    renderPage();
    const select = screen.getByRole('combobox');

    // WHEN
    fireEvent.change(select, { target: { value: 'asc' } });

    // THEN
    expect(screen.getByDisplayValue('Más antiguos primero')).toBeInTheDocument();
  });

  // --- Pagination ---

  it('hides pagination when totalPages is 1', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.queryByText('← Anterior')).not.toBeInTheDocument();
  });

  it('shows pagination when totalPages > 1', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, totalPages: 3 });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('← Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente →')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
  });

  it('calls setPage with page - 1 when "Anterior" clicked', () => {
    // GIVEN — on page 1 (index 1)
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, page: 1, totalPages: 3 });

    // WHEN
    renderPage();
    fireEvent.click(screen.getByText('← Anterior'));

    // THEN
    expect(setPage).toHaveBeenCalledWith(0);
  });

  it('calls setPage with page + 1 when "Siguiente" clicked', () => {
    // GIVEN — on page 0 of 3
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, page: 0, totalPages: 3 });

    // WHEN
    renderPage();
    fireEvent.click(screen.getByText('Siguiente →'));

    // THEN
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it('disables "Anterior" button on first page', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, page: 0, totalPages: 3 });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('← Anterior')).toBeDisabled();
  });

  it('disables "Siguiente" button on last page', () => {
    // GIVEN
    mockUseMyTickets.mockReturnValue({ ...defaultHookValue, page: 2, totalPages: 3 });

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Siguiente →')).toBeDisabled();
  });
});
