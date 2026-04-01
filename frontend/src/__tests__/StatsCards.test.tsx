import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCards from '../components/admin/StatsCards/StatsCards';
import type { AdminStatsResponse } from '../services/adminEventService';

const mockStats: AdminStatsResponse = {
  totalEvents: 12,
  publishedEvents: 9,
  totalTicketsSold: 380,
  activeReservations: 22,
};

describe('StatsCards', () => {
  it('renders 4 skeleton cards when loading is true', () => {
    // GIVEN / WHEN
    const { container } = render(<StatsCards stats={null} loading={true} />);

    // THEN — 4 skeleton divs rendered (no metric values)
    const skeletons = container.querySelectorAll('[class*="skeletonCard"]');
    expect(skeletons).toHaveLength(4);
    expect(screen.queryByText('Total Eventos')).not.toBeInTheDocument();
  });

  it('renders 4 stat cards with correct labels when not loading', () => {
    // GIVEN / WHEN
    render(<StatsCards stats={mockStats} />);

    // THEN
    expect(screen.getByText('Total Eventos')).toBeInTheDocument();
    expect(screen.getByText('Eventos Publicados')).toBeInTheDocument();
    expect(screen.getByText('Tickets Vendidos')).toBeInTheDocument();
    expect(screen.getByText('Reservas Activas')).toBeInTheDocument();
  });

  it('renders correct numeric values from stats', () => {
    // GIVEN / WHEN
    render(<StatsCards stats={mockStats} />);

    // THEN — values formatted with es-ES locale
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('380')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('renders 0 for all values when stats is null', () => {
    // GIVEN / WHEN
    render(<StatsCards stats={null} />);

    // THEN — all values default to 0
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });

  it('renders large numbers formatted via toLocaleString', () => {
    // GIVEN
    const bigStats: AdminStatsResponse = {
      ...mockStats,
      totalTicketsSold: 1500,
    };
    const expected = (1500).toLocaleString('es-ES');

    // WHEN
    render(<StatsCards stats={bigStats} />);

    // THEN — formatted according to runtime locale support
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
