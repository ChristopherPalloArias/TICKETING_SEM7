import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuantitySelector from '../components/QuantitySelector/QuantitySelector';

describe('QuantitySelector', () => {
  const defaultProps = {
    value: 1,
    min: 1,
    max: 10,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default value 1', () => {
    // GIVEN / WHEN: component renders with value = 1
    render(<QuantitySelector {...defaultProps} />);

    // THEN: current value "1" is displayed
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders label "Cantidad"', () => {
    // GIVEN / WHEN
    render(<QuantitySelector {...defaultProps} />);

    // THEN
    expect(screen.getByText('Cantidad')).toBeInTheDocument();
  });

  it('increments quantity on + click', async () => {
    // GIVEN: selector at value 1
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuantitySelector {...defaultProps} onChange={onChange} />);

    // WHEN: click the + button
    await user.click(screen.getByRole('button', { name: /aumentar cantidad/i }));

    // THEN: onChange called with value + 1
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('decrements quantity on − click', async () => {
    // GIVEN: selector at value 3
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuantitySelector {...defaultProps} value={3} onChange={onChange} />);

    // WHEN: click the − button
    await user.click(screen.getByRole('button', { name: /disminuir cantidad/i }));

    // THEN: onChange called with value - 1
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('disables − button at min value (1)', () => {
    // GIVEN / WHEN: value equals min
    render(<QuantitySelector {...defaultProps} value={1} min={1} />);

    // THEN: decrement button is disabled
    const decrementBtn = screen.getByRole('button', { name: /disminuir cantidad/i });
    expect(decrementBtn).toBeDisabled();
  });

  it('disables + button at max value', () => {
    // GIVEN / WHEN: value equals max
    render(<QuantitySelector {...defaultProps} value={10} max={10} />);

    // THEN: increment button is disabled
    const incrementBtn = screen.getByRole('button', { name: /aumentar cantidad/i });
    expect(incrementBtn).toBeDisabled();
  });

  it('enables both buttons when value is between min and max', () => {
    // GIVEN / WHEN: value in range
    render(<QuantitySelector {...defaultProps} value={5} min={1} max={10} />);

    // THEN: both buttons are enabled
    expect(screen.getByRole('button', { name: /disminuir cantidad/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /aumentar cantidad/i })).not.toBeDisabled();
  });

  it('displays the current value', () => {
    // GIVEN / WHEN: value is 7
    render(<QuantitySelector {...defaultProps} value={7} />);

    // THEN: "7" is rendered
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
