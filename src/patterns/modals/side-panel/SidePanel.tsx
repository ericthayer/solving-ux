import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, RefObject, SyntheticEvent } from 'react';
import styles from './SidePanel.module.css';

export type SidePanelLayout = 'auto' | 'inline' | 'sheet';
type Mode = Exclude<SidePanelLayout, 'auto'>;

export type SidePanelProps = {
  /** The list or table the user scans. It stays mounted while the panel is open, so scroll and selection survive. */
  master: ReactNode;
  /** Id of the open record. null closes the panel. */
  recordKey: string | null;
  title: string;
  /** One line of context under the title, e.g. status and owner. */
  subtitle?: ReactNode;
  /** Panel body: the record's details and actions. */
  children: ReactNode;
  onClose: () => void;
  /** "auto" switches to a modal sheet when the container is narrower than sheetBelow. */
  layout?: SidePanelLayout;
  /** Container width in px below which the panel becomes a full-screen modal sheet. */
  sheetBelow?: number;
  headingLevel?: 2 | 3 | 4;
  closeLabel?: string;
  /** Close label in sheet mode, where the list is hidden. */
  backLabel?: string;
};

/** Measures the layout container, not the viewport, so the panel adapts wherever it is placed. */
function useContainerMode(ref: RefObject<HTMLElement>, layout: SidePanelLayout, sheetBelow: number): Mode {
  const [measured, setMeasured] = useState<Mode>('inline');

  useLayoutEffect(() => {
    const el = ref.current;
    if (layout !== 'auto' || !el) return undefined;
    // Width 0 means "not laid out yet" (jsdom, hidden tab): stay inline rather than open a modal.
    const update = (width: number): void => setMeasured(width > 0 && width < sheetBelow ? 'sheet' : 'inline');
    update(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, layout, sheetBelow]);

  return layout === 'auto' ? measured : layout;
}

export function SidePanel({
  master,
  recordKey,
  title,
  subtitle,
  children,
  onClose,
  layout = 'auto',
  sheetBelow = 640,
  headingLevel = 2,
  closeLabel = 'Close',
  backLabel = 'Back to list',
}: SidePanelProps): JSX.Element {
  const id = useId();
  const titleId = `${id}-title`;
  const rootRef = useRef<HTMLDivElement>(null);
  const masterRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // A record opened from the URL on page load must not pull focus away from where the user is.
  const skipFocusRef = useRef(recordKey !== null);
  const wasOpenRef = useRef(recordKey !== null);
  const mode = useContainerMode(rootRef, layout, sheetBelow);
  const open = recordKey !== null;
  const Heading = `h${headingLevel}` as const;

  // Runs for every newly opened record and when the layout mode swaps the panel's container.
  useEffect(() => {
    if (recordKey === null) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && masterRef.current?.contains(active)) {
      returnFocusRef.current = active;
    }
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (skipFocusRef.current) {
      skipFocusRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [recordKey, mode]);

  // On close, go back to the row that opened the panel. If that row is gone, land on the list.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target?.isConnected) target.focus();
    else masterRef.current?.focus();
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    // Preventing keydown also stops the dialog's native cancel, so onClose runs once.
    event.preventDefault();
    onClose();
  };

  // Close requests that arrive without a keydown (Android back gesture) still go through React state.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    onClose();
  };

  const panel = (
    <section className={styles.panel} aria-labelledby={titleId} data-mode={mode} onKeyDown={handleKeyDown}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <Heading ref={headingRef} id={titleId} tabIndex={-1} className={styles.title}>
            {title}
          </Heading>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <button type="button" className={styles.close} onClick={onClose}>
          {mode === 'sheet' ? backLabel : closeLabel}
        </button>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );

  return (
    <div ref={rootRef} className={styles.root} data-open={open && mode === 'inline' ? '' : undefined}>
      <div ref={masterRef} className={styles.master} tabIndex={-1}>
        {master}
      </div>
      {open &&
        (mode === 'sheet' ? (
          <dialog ref={dialogRef} className={styles.sheet} aria-labelledby={titleId} onCancel={handleCancel}>
            {panel}
          </dialog>
        ) : (
          panel
        ))}
    </div>
  );
}
