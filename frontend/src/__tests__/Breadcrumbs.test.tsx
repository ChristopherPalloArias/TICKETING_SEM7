import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumbs from '../components/admin/Breadcrumbs/Breadcrumbs';

describe('Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders clickable segments from route', () => {
    // GIVEN
    const segments = [
      { label: 'Admin', path: '/admin' },
      { label: 'Eventos', path: '/admin/events' },
      { label: 'Detalle', path: '/admin/events/1' },
    ];

    // WHEN
    render(
      <MemoryRouter>
        <Breadcrumbs segments={segments} />
      </MemoryRouter>,
    );

    // THEN: all non-last segments are rendered as clickable links
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Eventos' })).toBeInTheDocument();

    // AND: last segment is plain text, not a link
    expect(screen.getByText('Detalle')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Detalle' })).not.toBeInTheDocument();
  });
});
