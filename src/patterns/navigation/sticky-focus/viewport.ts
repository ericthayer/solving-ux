/*
 * Demo-only. Pattern components never import this file.
 *
 * The stress bar zooms the demo stage with CSS zoom, which scales everything inside it, so a
 * fixed-height box never "gets shorter" the way a browser window does at 400%. This hook reads
 * the stage's zoom and returns a height in CSS px that keeps the box a constant visual size:
 * 560px tall at 100%, 140 CSS px at 400%. That is the squeeze real browser zoom applies.
 */
import { useEffect, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

/** Visual height of the simulated browser window, in screen px. */
export const SIMULATED_VIEWPORT_PX = 560;

const zoomOf = (el: Element | null): number => {
  const value = Number(el?.closest('[data-zoom]')?.getAttribute('data-zoom'));
  return Number.isFinite(value) && value > 0 ? value : 1;
};

/** Style carrying --demo-viewport-height for the element in `ref`, tracking the stage's zoom. */
export function useSimulatedViewport(ref: RefObject<HTMLElement>): CSSProperties {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const stage = ref.current?.closest('[data-zoom]') ?? null;
    setZoom(zoomOf(ref.current));
    if (!stage) return undefined;
    const observer = new MutationObserver(() => setZoom(zoomOf(stage)));
    observer.observe(stage, { attributes: true, attributeFilter: ['data-zoom'] });
    return () => observer.disconnect();
  }, [ref]);

  return { '--demo-viewport-height': `${Math.round(SIMULATED_VIEWPORT_PX / zoom)}px` } as CSSProperties;
}
