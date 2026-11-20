import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CommandPalette, isTypingTarget, validateShortcut } from './CommandPalette';
import type { Command } from './CommandPalette';

expect.extend(toHaveNoViolations);

// jsdom does not implement modal dialogs yet. Minimal stand-ins that mirror browser behavior.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

function setup() {
  const user = userEvent.setup();
  const runs: string[] = [];
  const make = (id: string, label: string, shortcut?: string, description?: string): Command => ({ id, label, shortcut, description, run: () => runs.push(id) });
  const commands = [
    make('new', 'New purchase order', 'n', 'Create'),
    make('orders', 'Go to orders', 'o', 'Navigation'),
    make('suppliers', 'Go to suppliers', 's', 'Navigation'),
    make('settings', 'Go to settings', undefined, 'Navigation'),
  ];
  const utils = render(
    <CommandPalette commands={commands} scopeLabel="Orders workspace">
      <label htmlFor="notes">Notes</label>
      <input id="notes" />
      <button type="button">PO-4410</button>
    </CommandPalette>,
  );
  return { ...utils, user, runs };
}

/** What a browser dispatches on a modal dialog when Escape is pressed. */
const cancel = (dialog: HTMLElement): boolean => fireEvent(dialog, new Event('cancel', { cancelable: true }));

const dialogNamed = (name: string): HTMLElement => screen.getByRole('dialog', { name });

describe('CommandPalette', () => {
  it('opens on Ctrl+K with focus in the labelled combobox and runs the chosen command after focus returns', async () => {
    const { user, runs } = setup();
    const order = screen.getByRole('button', { name: 'PO-4410' });
    await user.click(order);
    await user.keyboard('{Control>}k{/Control}');
    const combo = within(dialogNamed('Command palette')).getByRole('combobox', { name: 'Command' });
    expect(combo).toHaveFocus();
    await user.type(combo, 'go');
    expect(screen.getByRole('status')).toHaveTextContent('3 matches.');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Go to orders/ })).toHaveTextContent('Navigation · Shortcut O');
    await user.keyboard('{Enter}');
    expect(runs).toEqual(['orders']);
    expect(order).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('advertises the modifier shortcut on a real button', () => {
    setup();
    expect(screen.getByRole('button', { name: /Command palette/ })).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
  });

  it('fires single-key shortcuts only inside the work area and never while typing (edge case: WCAG 2.1.4)', async () => {
    const { user, runs } = setup();
    await user.type(screen.getByRole('textbox', { name: 'Notes' }), 'snow');
    expect(runs).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    await user.keyboard('n');
    expect(runs).toEqual([]);
    cancel(dialogNamed('Keyboard shortcuts'));
    screen.getByRole('button', { name: 'PO-4410' }).focus();
    await user.keyboard('s');
    expect(runs).toEqual(['suppliers']);
  });

  it('lets users turn single-key shortcuts off', async () => {
    const { user, runs } = setup();
    screen.getByRole('button', { name: 'PO-4410' }).focus();
    await user.keyboard('?');
    const dialog = dialogNamed('Keyboard shortcuts');
    const toggle = within(dialog).getByRole('checkbox', { name: 'Single-key shortcuts' });
    expect(toggle).toHaveFocus();
    await user.click(toggle);
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    screen.getByRole('button', { name: 'PO-4410' }).focus();
    await user.keyboard('n');
    expect(runs).toEqual([]);
  });

  it('remaps a key and rejects conflicts inline', async () => {
    const { user, runs } = setup();
    await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    const input = screen.getByRole('textbox', { name: 'Key for New purchase order' });
    await user.clear(input);
    await user.type(input, 'o');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('O already runs Go to orders.');
    await user.clear(input);
    await user.type(input, 'p');
    expect(input).not.toHaveAttribute('aria-invalid');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    screen.getByRole('button', { name: 'PO-4410' }).focus();
    await user.keyboard('n');
    await user.keyboard('p');
    expect(runs).toEqual(['new']);
  });

  it('closes the result list on the first Escape and the palette on the next', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /Command palette/ }));
    const dialog = dialogNamed('Command palette');
    const combo = within(dialog).getByRole('combobox');
    await user.type(combo, 'go');
    // jsdom does not fire "cancel" on Escape, so dispatch it the way a browser would after keydown.
    fireEvent.keyDown(combo, { key: 'Escape' });
    cancel(dialog);
    expect(dialog).toHaveAttribute('open');
    expect(combo).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(combo, { key: 'Escape' });
    cancel(dialog);
    expect(dialog).not.toHaveAttribute('open');
  });

  it('classifies typing targets and validates keys', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('input'))).toBe(true);
    expect(isTypingTarget(checkbox)).toBe(false);
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    const commands = [{ id: 'a', label: 'Alpha', run: jest.fn() }, { id: 'b', label: 'Beta', run: jest.fn() }];
    expect(validateShortcut('', 'a', { b: 'x' }, commands)).toBeNull();
    expect(validateShortcut('!', 'a', {}, commands)).toBe('Use one letter or number.');
    expect(validateShortcut('x', 'a', { b: 'x' }, commands)).toBe('X already runs Beta.');
  });

  it('has no axe violations with the palette and the shortcuts dialog open', async () => {
    const { user, container } = setup();
    screen.getByRole('button', { name: 'PO-4410' }).focus();
    await user.keyboard('{Control>}k{/Control}');
    expect(await axe(container)).toHaveNoViolations();
    cancel(dialogNamed('Command palette'));
    await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
