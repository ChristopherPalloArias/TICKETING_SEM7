import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TierForm from '../components/admin/TierForm/TierForm';

vi.mock('../hooks/useAuth');
vi.mock('../services/adminEventService');

import { useAuth } from '../hooks/useAuth';
import * as adminEventService from '../services/adminEventService';

const mockUseAuth = vi.mocked(useAuth);
const mockAddTier = vi.mocked(adminEventService.addTier);

function buildAuthMock(): ReturnType<typeof useAuth> {
  return {
    isAuthenticated: true,
    token: 'mock-token',
    role: 'ADMIN',
    userId: 'user-1',
    email: 'admin@sem7.com',
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    registerBuyer: vi.fn(),
  } as ReturnType<typeof useAuth>;
}

const DEFAULT_PROPS = {
  eventId: 'event-1',
  eventCapacity: 200,
  currentTotalQuota: 100,
  onTierAdded: vi.fn(),
  onCancel: vi.fn(),
};

function renderForm(props: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<TierForm {...DEFAULT_PROPS} {...props} />);
}

describe('TierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(buildAuthMock());
  });

  it('renders dropdown with VIP, GENERAL, EARLY_BIRD options', () => {
    // GIVEN / WHEN
    renderForm();

    // THEN: select element exposes all three tier type options
    const select = screen.getByRole('combobox');
    const optionValues = Array.from(select.querySelectorAll('option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(optionValues).toContain('VIP');
    expect(optionValues).toContain('GENERAL');
    expect(optionValues).toContain('EARLY_BIRD');
  });

  it('shows validFrom/validUntil fields only when EARLY_BIRD selected', async () => {
    // GIVEN
    const user = userEvent.setup();
    renderForm();

    // WHEN: initial selection is VIP — date fields must be absent
    expect(screen.queryByLabelText(/fecha de inicio/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/fecha de fin/i)).not.toBeInTheDocument();

    // WHEN: user selects EARLY_BIRD
    await user.selectOptions(screen.getByRole('combobox'), 'EARLY_BIRD');

    // THEN: date fields appear
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de fin/i)).toBeInTheDocument();
  });

  it('shows error when quota + current exceeds capacity', async () => {
    // GIVEN: capacity=200, current=100 → available=100; input 110 triggers overflow
    const user = userEvent.setup();
    renderForm({ eventCapacity: 200, currentTotalQuota: 100 });

    // WHEN
    await user.type(screen.getByLabelText(/cupo/i), '110');

    // THEN: inline capacity exceeded error
    expect(screen.getByText(/excede el aforo/i)).toBeInTheDocument();
  });

  it('shows error when price <= 0', async () => {
    // GIVEN
    const user = userEvent.setup();
    renderForm();

    // WHEN: enter zero price
    await user.type(screen.getByLabelText(/precio/i), '0');

    // THEN: inline price error
    expect(screen.getByText(/el precio debe ser mayor a \$0/i)).toBeInTheDocument();
  });

  it('calls onTierAdded on successful submit', async () => {
    // GIVEN
    const user = userEvent.setup();
    const onTierAdded = vi.fn();
    const newTier = {
      id: 't1',
      tierType: 'GENERAL' as const,
      price: 50,
      quota: 30,
      validFrom: null,
      validUntil: null,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
    };
    mockAddTier.mockResolvedValue(newTier);
    renderForm({ onTierAdded });

    // WHEN: enter valid price and quota, then submit
    await user.type(screen.getByLabelText(/precio/i), '50');
    await user.type(screen.getByLabelText(/cupo/i), '30');
    await user.click(screen.getByRole('button', { name: /guardar tier/i }));

    // THEN
    await waitFor(() => expect(onTierAdded).toHaveBeenCalledWith(newTier));
  });
});
