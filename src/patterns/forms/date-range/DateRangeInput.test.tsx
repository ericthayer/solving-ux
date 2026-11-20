import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DateRangeInput, parseDate, validateRange } from './DateRangeInput';
import type { DateRangeInputProps } from './DateRangeInput';

expect.extend(toHaveNoViolations);

const TODAY = '2026-03-18';

function setup(props: Partial<DateRangeInputProps> = {}) {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { container } = render(<DateRangeInput legend="Order date" labels={{ start: 'From', end: 'To' }} today={TODAY} onChange={onChange} {...props} />);
  return { user, onChange, container, from: screen.getByLabelText('From (MM/DD/YYYY)'), to: screen.queryByLabelText('To (MM/DD/YYYY)') };
}

describe('parseDate', () => {
  it.each(['3/4/2026', '03/04/2026', '03-04-26', '3.4.2026', '2026-03-04', '03042026', 'Mar 4 2026', 'March 4, 2026', '4 March 2026'])(
    'reads %s as March 4, 2026',
    (text) => expect(parseDate(text)).toBe('2026-03-04'),
  );

  it.each(['02/30/2026', '13/01/2026', '00/10/2026', 'tomorrow', 'Ma 4 2026', ''])('rejects %p (edge case)', (text) => {
    expect(parseDate(text)).toBeNull();
  });
});

describe('DateRangeInput', () => {
  it('states the format in the label and echoes the parsed date in words', async () => {
    const { user, onChange, from, to } = setup();
    await user.type(from, '3-4-26');
    await user.tab();
    expect(from).toHaveValue('03/04/2026');
    expect(from).toHaveAccessibleDescription('Wednesday, March 4, 2026');
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-03-04', end: null });
    await user.type(to!, '03/10/2026');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-03-04', end: '2026-03-10' });
    expect(screen.getByRole('status')).toHaveTextContent('Wednesday, March 4, 2026 to Tuesday, March 10, 2026, 7 days.');
  });

  it('flags an end date before the start date and never emits it (edge case)', async () => {
    const { user, onChange, from, to } = setup();
    await user.type(from, '03/10/2026');
    await user.type(to!, '03/01/2026');
    await user.tab();
    expect(to).toHaveAttribute('aria-invalid', 'true');
    expect(to).toHaveAccessibleDescription(/To must be on or after from, Tuesday, March 10, 2026\./);
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ end: '2026-03-01' }));
  });

  it('explains unreadable input and enforces maxDays and bounds (edge case)', () => {
    const labels = { start: 'From', end: 'To' };
    expect(validateRange({ start: '31/12/2026', end: '' }, labels, {}).errors.start).toBe('Enter from as MM/DD/YYYY, for example 03/04/2026.');
    expect(validateRange({ start: '01/01/2026', end: '03/01/2026' }, labels, { maxDays: 31 }).errors.end).toBe(
      'Choose a range of 31 days or fewer. This one is 60 days.',
    );
    expect(validateRange({ start: '01/01/2027', end: '' }, labels, { max: TODAY }).errors.start).toMatch(/on or before Wednesday, March 18, 2026/);
    expect(validateRange({ start: '', end: '' }, labels, {}, false, true).errors).toEqual({ start: 'Enter from.', end: 'Enter to.' });
  });

  it('applies a preset and marks it pressed', async () => {
    const { user, onChange, from, to } = setup();
    const presets = screen.getByRole('group', { name: 'Quick ranges' });
    await user.click(within(presets).getByRole('button', { name: 'Last 7 days' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-03-12', end: '2026-03-18' });
    expect(within(presets).getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(from).toHaveValue('03/12/2026');
    expect(to).toHaveValue('03/18/2026');
    await user.click(within(presets).getByRole('button', { name: 'Last month' }));
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('picks a date from the calendar with the keyboard and returns focus', async () => {
    const { user, onChange, from } = setup({ defaultValue: { start: '2026-03-04', end: null } });
    const trigger = screen.getByRole('button', { name: 'Change from, Wednesday, March 4, 2026' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Choose from' });
    expect(within(dialog).getByRole('gridcell', { name: 'Wednesday, March 4, 2026' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowDown}{PageDown}');
    expect(within(dialog).getByText('April 2026')).toBeInTheDocument();
    expect(within(dialog).getByRole('gridcell', { name: 'Sunday, April 12, 2026' })).toHaveFocus();
    await user.keyboard('{End}{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(from).toHaveValue('04/18/2026');
    expect(onChange).toHaveBeenLastCalledWith({ start: '2026-04-18', end: null });
    expect(screen.getByRole('button', { name: /^Change from/ })).toHaveFocus();
  });

  it('keeps focus inside the dialog, closes on Escape, and blocks out-of-bounds days (edge case)', async () => {
    const { user, onChange } = setup({ max: TODAY });
    const trigger = screen.getByRole('button', { name: 'Choose from' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('gridcell', { name: 'Wednesday, March 18, 2026' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByRole('gridcell', { name: 'Wednesday, March 18, 2026' })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Previous month' })).toHaveFocus();
    await user.click(within(dialog).getByRole('gridcell', { name: 'Thursday, March 19, 2026' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders one labelled field in single mode', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<DateRangeInput mode="single" legend="Delivery date" required today={TODAY} timeZoneNote="Local dock time." onChange={onChange} />);
    const field = screen.getByLabelText('Delivery date (MM/DD/YYYY)');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    await user.click(field);
    await user.tab();
    expect(field).toHaveAccessibleDescription('Enter delivery date. Local dock time.');
  });

  it('has no axe violations with an error and with the calendar open', async () => {
    const { user, from, container } = setup({ timeZoneNote: 'Dates use UTC.' });
    await user.type(from, 'nope');
    await user.tab();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole('button', { name: 'Choose from' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
