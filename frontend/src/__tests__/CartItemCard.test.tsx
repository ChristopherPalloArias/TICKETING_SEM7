import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartItemCard from '../components/Cart/CartItemCard';
import type { CartItem } from '../types/cart.types';

vi.mock('lucide-react', () => {
  const stub = (name: string) => {
    const Comp = () => <span data-testid={`icon-${name}`} />;
    Comp.displayName = name;
    return Comp;
  };
  return {
    Clock: stub('Clock'),
    Trash2: stub('Trash2'),
    CreditCard: stub('CreditCard'),
    RefreshCw: stub('RefreshCw'),
  };
});

function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    eventId: 'evt-1',
    eventTitle: 'Hamlet',
    eventDate: '2026-07-15T20:00:00',
    eventRoom: 'Teatro Real',
    eventImageUrl: 'https://img.test/hamlet.jpg',
    tierId: 'tier-1',
    tierType: 'VIP',
    tierPrice: 50000,
    quantity: 2,
    reservationId: 'res-1',
    validUntilAt: new Date(Date.now() + 300_000).toISOString(),
    email: 'buyer@test.com',
    addedAt: new Date().toISOString(),
    expired: false,
    expirationAlerted: false,
    ...overrides,
  };
}

describe('CartItemCard', () => {
  const onPay = vi.fn();
  const onRemove = vi.fn();
  const onRenew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // SPEC test: [CartItemCard] renders event info and countdown
  it('renders event info and countdown', () => {
    // GIVEN: an active cart item
    const item = buildCartItem();

    // WHEN
    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // THEN: event title, tier info and countdown are visible
    expect(screen.getByText('Hamlet')).toBeInTheDocument();
    expect(screen.getByText(/VIP × 2/)).toBeInTheDocument();
    expect(screen.getByText(/Teatro Real/)).toBeInTheDocument();
    // Countdown is rendered (not "Expirado")
    expect(screen.queryByText('Expirado')).not.toBeInTheDocument();
  });

  // SPEC test: [CartItemCard] shows expired badge when item expired
  it('shows expired badge when item expired', () => {
    // GIVEN: an expired item
    const item = buildCartItem({
      expired: true,
      validUntilAt: new Date(Date.now() - 60_000).toISOString(),
    });

    // WHEN
    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // THEN: "Expirado" badge is visible, "Pagar" button absent, "Renovar reserva" present
    const expiredTexts = screen.getAllByText('Expirado');
    expect(expiredTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Pagar')).not.toBeInTheDocument();
    expect(screen.getByText('Renovar reserva')).toBeInTheDocument();
  });

  // SPEC test: [CartItemCard] calls onPay when Pay button clicked
  it('calls onPay when Pay button clicked', async () => {
    // GIVEN: active item
    const user = userEvent.setup();
    const item = buildCartItem();

    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // WHEN: click "Pagar"
    await user.click(screen.getByText('Pagar'));

    // THEN
    expect(onPay).toHaveBeenCalledWith(item);
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  // SPEC test: [CartItemCard] calls onRemove when Remove button clicked
  it('calls onRemove when Remove button clicked', async () => {
    // GIVEN: active item with window.confirm returning true
    const user = userEvent.setup();
    const item = buildCartItem();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // WHEN: click remove button
    await user.click(screen.getByRole('button', { name: /eliminar item/i }));

    // THEN
    expect(window.confirm).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith('item-1');
  });

  it('does not call onRemove when confirm is cancelled', async () => {
    // GIVEN
    const user = userEvent.setup();
    const item = buildCartItem();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // WHEN: click remove but cancel confirm
    await user.click(screen.getByRole('button', { name: /eliminar item/i }));

    // THEN
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('calls onRenew for expired item', async () => {
    // GIVEN: expired item
    const user = userEvent.setup();
    const item = buildCartItem({
      expired: true,
      validUntilAt: new Date(Date.now() - 60_000).toISOString(),
    });

    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // WHEN: click "Renovar reserva"
    await user.click(screen.getByText('Renovar reserva'));

    // THEN
    expect(onRenew).toHaveBeenCalledWith(item);
  });

  it('renders image when eventImageUrl is provided', () => {
    // GIVEN: item with image
    const item = buildCartItem();

    // WHEN
    render(<CartItemCard item={item} onPay={onPay} onRemove={onRemove} onRenew={onRenew} />);

    // THEN
    expect(screen.getByAltText('Hamlet')).toHaveAttribute('src', 'https://img.test/hamlet.jpg');
  });
});
