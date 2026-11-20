import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, RefObject, SyntheticEvent } from 'react';
import { Typeahead } from '../../search-filters/typeahead/Typeahead';
import type { TypeaheadOption } from '../../search-filters/typeahead/Typeahead';
import styles from './CommandPalette.module.css';

export type Command = {
  id: string;
  label: string;
  /** Searched and read out with the label, e.g. "Navigation". */
  description?: string;
  /** Default single-key shortcut (one letter or digit). Users can remap or clear it. */
  shortcut?: string;
  run: () => void;
};

export type CommandPaletteProps = {
  commands: Command[];
  /** The work area. Single-key shortcuts only fire while focus is inside it. */
  children: ReactNode;
  /** Accessible name of the work area. */
  scopeLabel: string;
};

const SINGLE_KEY = /^[a-z0-9]$/;

/** True when the key press belongs to a text field, so a letter must type, not run a command. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(target.type);
}

/** Returns an error message, or null when `key` can be bound to `commandId`. */
export function validateShortcut(key: string, commandId: string, bindings: Record<string, string>, commands: Command[]): string | null {
  if (!key) return null;
  if (!SINGLE_KEY.test(key)) return 'Use one letter or number.';
  const owner = commands.find((c) => c.id !== commandId && bindings[c.id] === key);
  return owner ? `${key.toUpperCase()} already runs ${owner.label}.` : null;
}

/** Opens a native modal dialog while `open` is true and returns focus to where it was on close. */
function useModal(ref: RefObject<HTMLDialogElement>, open: boolean, focusSelector: string): () => void {
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>(focusSelector)?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [ref, open, focusSelector]);
  return () => {
    returnTo.current?.focus();
    returnTo.current = null;
  };
}

export function CommandPalette({ commands, children, scopeLabel }: CommandPaletteProps): JSX.Element {
  const id = useId();
  const paletteRef = useRef<HTMLDialogElement>(null);
  const shortcutsRef = useRef<HTMLDialogElement>(null);
  const listWasOpen = useRef(false);
  const pending = useRef<Command | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [singleKeys, setSingleKeys] = useState(true);
  const [bindings, setBindings] = useState<Record<string, string>>(() =>
    Object.fromEntries(commands.flatMap((c) => (c.shortcut ? [[c.id, c.shortcut.toLowerCase()]] : []))),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const restorePaletteFocus = useModal(paletteRef, paletteOpen, '[role="combobox"]');
  const restoreShortcutsFocus = useModal(shortcutsRef, shortcutsOpen, 'input');

  const options = useMemo<TypeaheadOption[]>(
    () =>
      commands.map((c) => {
        const key = bindings[c.id];
        const parts = [c.description, singleKeys && key ? `Shortcut ${key.toUpperCase()}` : undefined].filter(Boolean);
        return { id: c.id, label: c.label, description: parts.join(' · ') || undefined };
      }),
    [commands, bindings, singleKeys],
  );

  // Ctrl+K / Cmd+K uses a modifier, so it cannot be triggered by typing or dictation.
  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!shortcutsOpen) setPaletteOpen(true);
    }
  };

  // Single-key shortcuts: only inside the work area, never in a text field, and only while turned on.
  const onScopeKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (!singleKeys || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
    if (event.key === '?') {
      event.preventDefault();
      setShortcutsOpen(true);
      return;
    }
    const key = event.key.toLowerCase();
    const command = commands.find((c) => bindings[c.id] === key);
    if (command && SINGLE_KEY.test(key)) {
      event.preventDefault();
      command.run();
    }
  };

  const onPaletteKeyDownCapture = (event: KeyboardEvent<HTMLDialogElement>): void => {
    // Escape belongs to the open result list first; the dialog closes on the next press.
    if (event.key === 'Escape') listWasOpen.current = event.target instanceof HTMLElement && event.target.getAttribute('aria-expanded') === 'true';
  };

  const onPaletteCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    if (!listWasOpen.current) setPaletteOpen(false);
    listWasOpen.current = false;
  };

  // Run after the dialog closes and focus is back, so the command acts on the page, not the palette.
  const onPaletteClose = (): void => {
    restorePaletteFocus();
    const command = pending.current;
    pending.current = null;
    command?.run();
  };

  const remap = (command: Command, raw: string): void => {
    const key = raw.trim().slice(-1).toLowerCase();
    setDrafts((d) => ({ ...d, [command.id]: key }));
    const error = validateShortcut(key, command.id, bindings, commands);
    setErrors((e) => ({ ...e, [command.id]: error ?? '' }));
    if (error) return;
    setBindings((b) => {
      const next = { ...b };
      if (key) next[command.id] = key;
      else delete next[command.id];
      return next;
    });
  };

  return (
    <div className={styles.root} onKeyDown={onRootKeyDown}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.trigger} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" onClick={() => setPaletteOpen(true)}>
          Command palette <kbd className={styles.kbd}>Ctrl K</kbd>
        </button>
        <button type="button" className={styles.secondary} aria-haspopup="dialog" onClick={() => setShortcutsOpen(true)}>
          Keyboard shortcuts
        </button>
      </div>

      <section aria-label={scopeLabel} className={styles.scope} onKeyDown={onScopeKeyDown}>
        {children}
      </section>

      <dialog
        ref={paletteRef}
        className={styles.dialog}
        aria-labelledby={`${id}-palette-title`}
        onKeyDownCapture={onPaletteKeyDownCapture}
        onCancel={onPaletteCancel}
        onClose={onPaletteClose}
        onClick={(event) => event.target === paletteRef.current && setPaletteOpen(false)}
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2 id={`${id}-palette-title`} className={styles.title}>
              Command palette
            </h2>
            <button type="button" className={styles.secondary} onClick={() => setPaletteOpen(false)}>
              Close
            </button>
          </div>
          {paletteOpen && (
            <div className={styles.search}>
              <Typeahead
                label="Command"
                hint="Type to search commands and pages. Enter runs the highlighted command."
                options={options}
                onSelect={(option) => {
                  pending.current = commands.find((c) => c.id === option.id) ?? null;
                  setPaletteOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </dialog>

      <dialog
        ref={shortcutsRef}
        className={styles.dialog}
        aria-labelledby={`${id}-shortcuts-title`}
        onCancel={(event) => {
          event.preventDefault();
          setShortcutsOpen(false);
        }}
        onClose={restoreShortcutsFocus}
      >
        <div className={styles.panel}>
          <h2 id={`${id}-shortcuts-title`} className={styles.title}>
            Keyboard shortcuts
          </h2>
          <label className={styles.toggle}>
            <input type="checkbox" checked={singleKeys} onChange={(event) => setSingleKeys(event.target.checked)} aria-describedby={`${id}-single-hint`} />
            Single-key shortcuts
          </label>
          <p id={`${id}-single-hint`} className={styles.hint}>
            Letter keys run commands only while focus is in {scopeLabel} and not in a text field. Turn them off if you use speech input or screen reader quick keys.
          </p>
          <table className={styles.table}>
            <caption className={styles.caption}>Shortcuts</caption>
            <thead>
              <tr>
                <th scope="col">Command</th>
                <th scope="col">Key</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Open command palette</th>
                <td>
                  <kbd className={styles.kbd}>Ctrl K</kbd>
                </td>
              </tr>
              <tr>
                <th scope="row">Show keyboard shortcuts</th>
                <td>
                  <kbd className={styles.kbd}>?</kbd>
                </td>
              </tr>
              {commands
                .filter((c) => c.shortcut)
                .map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.label}</th>
                    <td>
                      <input
                        className={styles.keyInput}
                        aria-label={`Key for ${c.label}`}
                        aria-invalid={errors[c.id] ? true : undefined}
                        aria-describedby={errors[c.id] ? `${id}-${c.id}-error` : undefined}
                        value={(drafts[c.id] ?? bindings[c.id] ?? '').toUpperCase()}
                        disabled={!singleKeys}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => remap(c, event.target.value)}
                      />
                      {errors[c.id] && (
                        <span id={`${id}-${c.id}-error`} className={styles.error}>
                          {errors[c.id]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button type="button" className={`${styles.secondary} ${styles.done}`} onClick={() => setShortcutsOpen(false)}>
            Done
          </button>
        </div>
      </dialog>
    </div>
  );
}
