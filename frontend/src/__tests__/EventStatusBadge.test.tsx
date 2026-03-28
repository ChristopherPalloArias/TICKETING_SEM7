import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventStatusBadge from '../components/admin/EventStatusBadge/EventStatusBadge';

describe('EventStatusBadge', () => {
  it('renders correct label and class for DRAFT', () => {
    render(<EventStatusBadge status="DRAFT" />);
    const badge = screen.getByText('Borrador');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('draft');
  });

  it('renders correct label and class for PUBLISHED', () => {
    render(<EventStatusBadge status="PUBLISHED" />);
    const badge = screen.getByText('Publicado');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('published');
  });

  it('renders correct label and class for CANCELLED', () => {
    render(<EventStatusBadge status="CANCELLED" />);
    const badge = screen.getByText('Cancelado');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('cancelled');
  });
});
