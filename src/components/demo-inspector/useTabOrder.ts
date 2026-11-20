import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { getTabStops, resolveFocusScope } from './tabbable';
import type { TabStop } from './tabbable';

export type Box = { top: number; left: number; width: number; height: number };
export type MeasuredStop = Omit<TabStop, 'element'> & { box: Box };

export type TabOrderSnapshot = {
  stops: MeasuredStop[];
  /** Viewport box of the focus scope; badges are clipped to it. */
  frame: Box;
  /** Where the overlay layer mounts: document.body, or the open modal dialog (top layer) when one exists. */
  host: HTMLElement;
  /** 1-based order of the stop that holds focus, or null. */
  activeOrder: number | null;
};

/** Marks the overlay layer so its own renders never count as demo mutations. */
export const OVERLAY_ATTR = 'data-tab-order-overlay';

const toBox = (r: DOMRect): Box => ({ top: r.top, left: r.left, width: r.width, height: r.height });

function snapshot(root: HTMLElement): TabOrderSnapshot {
  const scope = resolveFocusScope(root);
  const stops = getTabStops(root);
  const active = root.ownerDocument.activeElement;
  const activeStop = stops.find((s) => s.element === active || s.element.contains(active));
  return {
    stops: stops.map(({ element, ...rest }) => ({ ...rest, box: toBox(element.getBoundingClientRect()) })),
    frame: toBox(scope.getBoundingClientRect()),
    host: scope === root ? root.ownerDocument.body : scope,
    activeOrder: activeStop?.order ?? null,
  };
}

function sameSnapshot(a: TabOrderSnapshot, b: TabOrderSnapshot): boolean {
  return a.host === b.host && a.activeOrder === b.activeOrder && JSON.stringify([a.frame, a.stops]) === JSON.stringify([b.frame, b.stops]);
}

/**
 * Tracks the sequential focus order inside `ref` while enabled.
 * Re-measures (batched to one rAF) on DOM mutations, resizes, scrolls, and focus moves,
 * so the overlay follows menus opening, rows being added, and dialogs taking over focus.
 */
export function useTabOrder(ref: RefObject<HTMLElement>, enabled: boolean): TabOrderSnapshot | null {
  const [state, setState] = useState<TabOrderSnapshot | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) {
      setState(null);
      return undefined;
    }
    const win = root.ownerDocument.defaultView ?? window;
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        const next = snapshot(root);
        setState((prev) => (prev && sameSnapshot(prev, next) ? prev : next));
      });
    };

    setState(snapshot(root));
    const mutations = new MutationObserver((records) => {
      const fromDemo = records.some((r) => !(r.target instanceof Element && r.target.closest(`[${OVERLAY_ATTR}]`)));
      if (fromDemo) schedule();
    });
    mutations.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'disabled', 'tabindex', 'open', 'inert', 'aria-expanded', 'checked'] });
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    resize?.observe(root);
    root.addEventListener('focusin', schedule);
    root.addEventListener('focusout', schedule);
    root.addEventListener('transitionend', schedule);
    win.addEventListener('scroll', schedule, { capture: true, passive: true });
    win.addEventListener('resize', schedule);

    return () => {
      if (frame) win.cancelAnimationFrame(frame);
      mutations.disconnect();
      resize?.disconnect();
      root.removeEventListener('focusin', schedule);
      root.removeEventListener('focusout', schedule);
      root.removeEventListener('transitionend', schedule);
      win.removeEventListener('scroll', schedule, { capture: true });
      win.removeEventListener('resize', schedule);
    };
  }, [ref, enabled]);

  return state;
}
