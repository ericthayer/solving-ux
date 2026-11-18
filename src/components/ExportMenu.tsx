import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Pattern } from '../types/pattern';
import { usePatternExport } from '../hooks/usePatternExport';
import type { ExportFormat } from '../hooks/usePatternExport';

const ITEMS: { format: ExportFormat; label: string; detail: string }[] = [
  { format: 'zip', label: 'Download ZIP', detail: 'Component, styles, tests, README' },
  { format: 'json', label: 'Download JSON', detail: 'Metadata and source for pipelines' },
];

/** ARIA menu button. Arrow keys move between items; Escape and Tab close it. */
export function ExportMenu({ pattern }: { pattern: Pattern }): JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const { state, exportAs } = usePatternExport(pattern);

  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const openAt = (index: number): void => {
    setActive(index);
    setOpen(true);
  };

  const close = (refocus: boolean): void => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const onButtonKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(ITEMS.length - 1);
    }
  };

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const last = ITEMS.length - 1;
    if (event.key === 'ArrowDown') setActive((i) => (i === last ? 0 : i + 1));
    else if (event.key === 'ArrowUp') setActive((i) => (i === 0 ? last : i - 1));
    else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(last);
    else if (event.key === 'Escape') close(true);
    else if (event.key === 'Tab') return close(false);
    else return;
    event.preventDefault();
  };

  const choose = (format: ExportFormat): void => {
    close(true);
    void exportAs(format);
  };

  const message =
    state.status === 'working' ? `Preparing ${state.format.toUpperCase()}…`
    : state.status === 'done' ? `${state.format.toUpperCase()} downloaded.`
    : state.status === 'error' ? `Export failed: ${state.message}`
    : '';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={`${id}-button`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={onButtonKey}
        disabled={state.status === 'working'}
        className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded border border-ink bg-ink px-3 text-sm font-medium text-canvas hover:opacity-90 disabled:opacity-60"
      >
        Export
        <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <div
        id={`${id}-menu`}
        role="menu"
        aria-labelledby={`${id}-button`}
        hidden={!open}
        onKeyDown={onMenuKey}
        className="absolute right-0 top-full z-30 mt-1 w-64 rounded-md border border-line bg-surface p-1 shadow-lg"
      >
        {ITEMS.map((item, index) => (
          <button
            key={item.format}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => choose(item.format)}
            className="flex w-full flex-col items-start rounded px-3 py-2 text-left hover:bg-sunken focus:bg-sunken"
          >
            <span className="text-sm font-medium text-ink">{item.label}</span>
            <span className="text-xs text-muted">{item.detail}</span>
          </button>
        ))}
      </div>
      <span role="status" className="sr-only">
        {message}
      </span>
    </div>
  );
}
