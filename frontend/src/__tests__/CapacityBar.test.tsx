import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CapacityBar from '../components/admin/CapacityBar/CapacityBar';

describe('CapacityBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders green bar when usage < 80%', () => {
    // GIVEN / WHEN: 100/200 = 50% — below the yellow threshold
    const { container } = render(<CapacityBar assignedQuota={100} totalCapacity={200} />);

    // THEN: progressbar present with correct aria values; green class applied
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-valuemax', '200');
    expect(bar?.className).toMatch(/green/i);
  });

  it('renders yellow bar when usage 80-100%', () => {
    // GIVEN / WHEN: 160/200 = 80% — at the yellow threshold
    const { container } = render(<CapacityBar assignedQuota={160} totalCapacity={200} />);

    // THEN: progressbar present with correct aria values; yellow class applied
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '160');
    expect(bar?.className).toMatch(/yellow/i);
  });

  it('renders "X / Y asignados" label', () => {
    // GIVEN / WHEN
    render(<CapacityBar assignedQuota={80} totalCapacity={150} />);

    // THEN
    expect(screen.getByText('80 / 150 asignados')).toBeInTheDocument();
  });
});
