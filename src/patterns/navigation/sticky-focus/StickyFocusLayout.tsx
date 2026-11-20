import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, ReactNode } from 'react';
import styles from './StickyFocusLayout.module.css';

/** Which element scrolls: the layout itself (a panel, drawer, or demo) or the whole page. */
export type StickyScroller = 'self' | 'page';

export type StickyFocusLayoutProps = {
  /** Accessible name for the region that wraps the header, content, and action bar. */
  label: string;
  /** Pinned to the top while it fits. Title, status, and page-level controls. */
  header: ReactNode;
  /** Pinned to the bottom while it fits. Save, cancel, and other commit actions. */
  actions: ReactNode;
  children: ReactNode;
  scroller?: StickyScroller;
  /** Largest share of the visible height the pinned header and action bar may cover together. */
  maxCoverage?: number;
  /** Space kept between a focused element and a pinned edge, in CSS px. */
  focusGap?: number;
  /** Called when the bars switch between pinned and in-flow. */
  onPinnedChange?: (pinned: boolean) => void;
};

/** Heights in CSS px. `viewport` is the visible height of the scroller. */
export type StickyMetrics = { top: number; bottom: number; viewport: number };

type Edges = { top: number; bottom: number };

/** Pin only while both bars together leave enough of the screen for the content. */
export function shouldPin({ top, bottom, viewport }: StickyMetrics, maxCoverage: number): boolean {
  return viewport > 0 && (top + bottom) / viewport <= maxCoverage;
}

/**
 * How far to scroll so `target` clears the pinned edges, in CSS px. Negative scrolls up, 0 means
 * it already clears them. A target taller than the gap between the bars is aligned to the top.
 */
export function obscuredOffset(target: Edges, visible: Edges, gap: number): number {
  const top = visible.top + gap;
  const bottom = visible.bottom - gap;
  if (target.top < top) return target.top - top;
  if (target.bottom > bottom) return Math.min(target.bottom - bottom, target.top - top);
  return 0;
}

const sameMetrics = (a: StickyMetrics, b: StickyMetrics): boolean =>
  a.top === b.top && a.bottom === b.bottom && a.viewport === b.viewport;

export function StickyFocusLayout({
  label,
  header,
  actions,
  children,
  scroller = 'self',
  maxCoverage = 0.4,
  focusGap = 8,
  onPinnedChange,
}: StickyFocusLayoutProps): JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLElement>(null);
  const [metrics, setMetrics] = useState<StickyMetrics>({ top: 0, bottom: 0, viewport: 0 });

  // Measure the bars and the visible height. Resizes, zoom, and long text all change the answer.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const head = headerRef.current;
    const foot = actionsRef.current;
    if (!root || !head || !foot) return undefined;
    const measure = (): void => {
      const viewport = scroller === 'page' ? window.innerHeight : root.clientHeight;
      const next = { top: head.offsetHeight, bottom: foot.offsetHeight, viewport };
      setMetrics((prev) => (sameMetrics(prev, next) ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    [root, head, foot].forEach((el) => observer?.observe(el));
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [scroller]);

  // Before the first measurement nothing is known, so start pinned (the common desktop case).
  const pinned = metrics.viewport === 0 || shouldPin(metrics, maxCoverage);
  const padTop = pinned ? metrics.top : 0;
  const padBottom = pinned ? metrics.bottom : 0;

  const onPinnedChangeRef = useRef(onPinnedChange);
  onPinnedChangeRef.current = onPinnedChange;
  useEffect(() => {
    onPinnedChangeRef.current?.(pinned);
  }, [pinned]);

  // Page mode: the document scrolls, so the scroll padding belongs on the root element.
  useEffect(() => {
    if (scroller !== 'page') return undefined;
    const style = document.documentElement.style;
    const previous = [style.scrollPaddingTop, style.scrollPaddingBottom] as const;
    style.scrollPaddingTop = `${padTop + focusGap}px`;
    style.scrollPaddingBottom = `${padBottom + focusGap}px`;
    return () => {
      [style.scrollPaddingTop, style.scrollPaddingBottom] = previous;
    };
  }, [scroller, padTop, padBottom, focusGap]);

  // Safety net for engines that ignore scroll-padding when moving focus (and for programmatic focus).
  const keepFocusVisible = (event: FocusEvent<HTMLElement>): void => {
    const target = event.target;
    const head = headerRef.current;
    const foot = actionsRef.current;
    const root = rootRef.current;
    if (!pinned || !head || !foot || !root || head.contains(target) || foot.contains(target)) return;
    // Run after the browser's own scroll-into-view so we only correct what it left covered.
    requestAnimationFrame(() => {
      const visible = { top: head.getBoundingClientRect().bottom, bottom: foot.getBoundingClientRect().top };
      const delta = obscuredOffset(target.getBoundingClientRect(), visible, focusGap);
      if (delta === 0) return;
      if (scroller === 'page') window.scrollBy(0, delta);
      else root.scrollTop += delta;
    });
  };

  const vars = {
    '--sux-sticky-top': `${padTop}px`,
    '--sux-sticky-bottom': `${padBottom}px`,
    '--sux-sticky-gap': `${focusGap}px`,
  } as CSSProperties;

  return (
    <section
      ref={rootRef}
      aria-label={label}
      className={styles.root}
      data-scroller={scroller}
      data-pinned={pinned}
      style={vars}
      onFocus={keepFocusVisible}
    >
      <header ref={headerRef} className={styles.header}>
        {header}
      </header>
      <div className={styles.content}>{children}</div>
      <footer ref={actionsRef} className={styles.actions}>
        {actions}
      </footer>
    </section>
  );
}
