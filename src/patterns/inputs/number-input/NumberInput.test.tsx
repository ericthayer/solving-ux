import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useState } from 'react';
import { NumberInput, parseNumber } from './NumberInput';
import type { NumberInputProps } from './NumberInput';

expect.extend(toHaveNoViolations);

type HarnessProps = Partial<NumberInputProps> & { initial?: number | null; spy?: jest.Mock };

function Harness({ initial = null, spy, ...props }: HarnessProps): JSX.Element {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <form aria-label="Test form" noValidate>
      <NumberInput
        label="Amount requested"
        name="amount"
        format={{ style: 'currency', currency: 'USD' }}
        min={1000}
        max={500000}
        required
        value={value}
        onValueChange={(v) => {
          setValue(v);
          spy?.(v);
        }}
        {...props}
      />
      <button type="button">Next</button>
    </form>
  );
}

function setup(props: HarnessProps = {}) {
  const user = userEvent.setup();
  const utils = render(<Harness {...props} />);
  return { user, input: screen.getByRole('textbox', { name: /Amount requested/ }), ...utils };
}

describe('parseNumber', () => {
  it.each([
    ['1250', 1250],
    ['1,250.50', 1250.5],
    ['$1,250.00', 1250],
    ['USD 1,250', 1250],
    ['1.250,50 €', 1250.5],
    ['(500)', -500],
    ['−500', -500],
    ['12.5%', 12.5],
    ['1 250 000', 1250000],
    ['12,50,000', 1250000],
  ])('accepts %s', (text, expected) => {
    expect(parseNumber(text)).toMatchObject({ kind: 'number', value: expected });
  });

  it.each(['abc', '1.2.3,4,5', '12,5', '1e5', '$'])('rejects %s', (text) => {
    expect(parseNumber(text).kind).toBe('invalid');
  });

  it('reads a lone comma as the decimal in a comma-decimal locale (edge case)', () => {
    expect(parseNumber('12,5', 'de-DE')).toMatchObject({ kind: 'number', value: 12.5 });
  });
});

describe('NumberInput', () => {
  it('puts the unit in the label and the range in a persistent hint', () => {
    const { input } = setup();
    expect(input).toHaveAccessibleName('Amount requested (USD)');
    expect(input).toHaveAccessibleDescription('From $1,000.00 to $500,000.00.');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('autocomplete', 'transaction-amount');
    expect(input).not.toHaveAttribute('placeholder');
  });

  it('keeps the typed text while editing and formats on blur', async () => {
    const spy = jest.fn();
    const { user, input, container } = setup({ spy });
    await user.type(input, '1250.5');
    expect(input).toHaveValue('1250.5');
    expect(spy).toHaveBeenLastCalledWith(1250.5);
    await user.tab();
    expect(input).toHaveValue('1,250.50');
    expect(container.querySelector('input[type="hidden"]')).toHaveValue('1250.5');
  });

  it('accepts a pasted amount with symbol and grouping', async () => {
    const { user, input } = setup();
    await user.click(input);
    await user.paste('$12,000.00');
    await user.tab();
    expect(input).toHaveValue('12,000.00');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('names the limit when a value is out of range, and clears once fixed', async () => {
    const { user, input } = setup();
    await user.type(input, '750000');
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('From $1,000.00 to $500,000.00. Enter no more than $500,000.00.');
    expect(input).toHaveValue('750000');
    await user.clear(input);
    await user.type(input, '5000');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('leaves unparseable text as typed and explains the format (edge case)', async () => {
    const { user, input } = setup();
    await user.type(input, '12,5');
    await user.tab();
    expect(input).toHaveValue('12,5');
    expect(screen.getByText('Enter a number, like 1,250.50.')).toBeInTheDocument();
  });

  it('rejects extra decimal places instead of rounding money (edge case)', async () => {
    const { user, input } = setup();
    await user.type(input, '1000.555');
    await user.tab();
    expect(screen.getByText('Use no more than 2 decimal places.')).toBeInTheDocument();
  });

  it('asks for a whole number in integer format', async () => {
    const user = userEvent.setup();
    render(<Harness label="Quantity" format={{ style: 'integer', unit: 'units' }} min={1} max={10000} />);
    const input = screen.getByRole('textbox', { name: 'Quantity (units)' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await user.type(input, '2.5');
    await user.tab();
    expect(screen.getByText('Enter a whole number.')).toBeInTheDocument();
  });

  it('reveals the required error when the form checks validity', () => {
    const { input } = setup();
    expect(screen.queryByText('Enter amount requested.')).not.toBeInTheDocument();
    let valid = true;
    act(() => {
      valid = (screen.getByRole('form', { name: 'Test form' }) as HTMLFormElement).checkValidity();
    });
    expect(valid).toBe(false);
    expect(screen.getByText('Enter amount requested.')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('ignores the mouse wheel (edge case)', async () => {
    const { user, input } = setup({ initial: 2000 });
    await user.click(input);
    fireEvent.wheel(input, { deltaY: 100 });
    expect(input).toHaveValue('2,000.00');
  });

  it('formats with the locale and places the symbol after the number in de-DE', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness format={{ style: 'currency', currency: 'EUR' }} locale="de-DE" />);
    const input = screen.getByRole('textbox', { name: 'Amount requested (EUR)' });
    await user.type(input, '1250,5');
    await user.tab();
    expect(input).toHaveValue('1.250,50');
    expect(input.nextElementSibling).toHaveTextContent('€');
    expect(container.querySelector('input[type="hidden"]')).toHaveValue('1250.5');
  });

  it('has no axe violations with an error showing', async () => {
    const { user, input, container } = setup();
    await user.type(input, '5');
    await user.tab();
    expect(await axe(container)).toHaveNoViolations();
  });
});
