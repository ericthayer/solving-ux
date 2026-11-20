/** Geometry helpers for AccessibleChart. No DOM output and no styling decisions live here. */
import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export type Shape = 'circle' | 'square' | 'triangle' | 'diamond';

export function markerPath(shape: Shape, x: number, y: number, r = 4.5): string {
  switch (shape) {
    case 'square':
      return `M${x - r} ${y - r}h${r * 2}v${r * 2}h${-r * 2}z`;
    case 'triangle':
      return `M${x} ${y - r * 1.2}L${x + r * 1.15} ${y + r * 0.9}H${x - r * 1.15}z`;
    case 'diamond':
      return `M${x} ${y - r * 1.3}L${x + r * 1.3} ${y}L${x} ${y + r * 1.3}L${x - r * 1.3} ${y}z`;
    default:
      return `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
  }
}

/** 0 to a round maximum, in about four steps of 1, 2, or 5 × 10^n. */
export function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, k) => Number((k * step).toPrecision(12)));
}

/** Width of the chart's container. jsdom and first paint fall back to 640. */
export function useWidth(): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
