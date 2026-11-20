import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Pointer events that would let a mouse or touch user operate the demo. Wheel stays enabled so the page still scrolls. */
const BLOCKED_EVENTS = ['pointerdown', 'mousedown', 'click', 'dblclick', 'contextmenu', 'touchstart'] as const;

/**
 * Blocks pointer interaction inside `ref` while `enabled`, so reviewers must operate the demo by keyboard.
 * Listeners run in the capture phase so the demo's own handlers never see the event.
 * Keyboard-synthesized clicks (Enter/Space on a button) have `detail === 0` and pass through.
 */
export function useKeyboardOnly(ref: RefObject<HTMLElement>, enabled: boolean, onBlocked: () => void): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return undefined;

    const block = (event: Event): void => {
      if (event.type === 'click' && event instanceof MouseEvent && event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.type === 'pointerdown' || event.type === 'touchstart') onBlocked();
    };

    BLOCKED_EVENTS.forEach((type) => root.addEventListener(type, block, { capture: true }));
    return () => {
      BLOCKED_EVENTS.forEach((type) => root.removeEventListener(type, block, { capture: true }));
    };
  }, [ref, enabled, onBlocked]);
}
