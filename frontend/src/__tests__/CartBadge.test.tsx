import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartBadge from '../components/Cart/CartBadge';

describe('CartBadge', () => {
  // SPEC test: [CartBadge] shows count when > 0
  it('shows count when count > 0', () => {
    // GIVEN/WHEN: count is 3
    render(<CartBadge count={3} />);

    // THEN: badge with "3" is visible
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // SPEC test: [CartBadge] hidden when count is 0
  it('hidden when count is 0', () => {
    // GIVEN/WHEN: count is 0
    const { container } = render(<CartBadge count={0} />);

    // THEN: nothing rendered
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for negative count', () => {
    // GIVEN/WHEN: count is negative
    const { container } = render(<CartBadge count={-1} />);

    // THEN: nothing rendered
    expect(container.innerHTML).toBe('');
  });

  it('shows "9+" when count exceeds 9', () => {
    // GIVEN/WHEN: count is 15
    render(<CartBadge count={15} />);

    // THEN
    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});
