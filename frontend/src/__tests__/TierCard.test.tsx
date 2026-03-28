import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TierCard from '../components/admin/TierCard/TierCard';
import type { AdminTierResponse } from '../types/admin.types';

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

describe('TierCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tier type badge, price, and quota', () => {
    // GIVEN / WHEN
    render(<TierCard tier={buildTier()} isDraft onDelete={vi.fn()} />);

    // THEN: badge label, quota text, and price all visible
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText(/100 entradas/i)).toBeInTheDocument();
    expect(screen.getByText(/75/i)).toBeInTheDocument();
  });

  it('renders validFrom/validUntil for EARLY_BIRD tier', () => {
    // GIVEN: Early Bird tier with validity dates
    const tier = buildTier({
      tierType: 'EARLY_BIRD',
      validFrom: '2026-05-01T00:00:00',
      validUntil: '2026-05-31T23:59:00',
    });

    // WHEN
    render(<TierCard tier={tier} isDraft onDelete={vi.fn()} />);

    // THEN: vigencia row is rendered
    expect(screen.getByText('Vigencia')).toBeInTheDocument();
    expect(screen.getByText(/early bird/i)).toBeInTheDocument();
  });

  it('hides delete button when isDraft is false', () => {
    // GIVEN / WHEN: event is PUBLISHED (isDraft=false)
    render(<TierCard tier={buildTier()} isDraft={false} onDelete={vi.fn()} />);

    // THEN
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('calls onDelete with tierId when delete clicked', async () => {
    // GIVEN
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TierCard tier={buildTier({ id: 'tier-abc' })} isDraft onDelete={onDelete} />);

    // WHEN
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // THEN
    expect(onDelete).toHaveBeenCalledWith('tier-abc');
  });
});
