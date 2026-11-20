/*
 * Stress-test hooks for live demos only. Pattern components never import this file.
 *
 * The pattern page owns the stress settings (width, zoom, RTL, long text, large data).
 * Width, zoom, and RTL apply to every demo from outside. Long text and large data need
 * the demo's cooperation, so a demo opts in by calling useStressTest() with the
 * capabilities it supports; the toolbar disables the ones nobody registered.
 */
import { createContext, useContext, useEffect, useMemo } from 'react';

export type StressCapability = 'longText' | 'largeData';

export type StressDemoFlags = { longText: boolean; largeData: boolean };

export type StressContextValue = StressDemoFlags & {
  /** Registers what the mounted demo supports. Returns the unregister function. */
  register: (capabilities: StressCapability[]) => () => void;
};

export const StressContext = createContext<StressContextValue | null>(null);

/** Row/record count used when "10k rows" is on. */
export const LARGE_DATA_COUNT = 10_000;

/** One unbreakable token, the kind that blows out fixed-width cells and buttons. */
const LONG_WORD = 'Landwirtschaftsgenossenschaftsverbandsverbindlichkeiten';
const LONG_SENTENCE =
  'Additional disclosure required by the Northern Regional Trade Compliance Office applies to this record and must stay readable when it wraps across several lines.';

/** Expands a string the way translation and real-world data do: longer, and with an unbroken word. */
export function expandText(value: string): string {
  const isSentence = value.length > 40 || /[.!?]$/.test(value);
  return isSentence ? `${value} ${LONG_SENTENCE}` : `${value} ${LONG_WORD}`;
}

export type StressDemoApi = StressDemoFlags & {
  /** Returns the expanded string when long text is on, otherwise the input unchanged. */
  text: (value: string) => string;
};

/**
 * Demo-side hook. Pass the capabilities this demo supports; read the flags it should honor.
 * Outside the pattern page (unit tests, exports) every flag is false and text() is identity.
 */
export function useStressTest(capabilities: StressCapability[]): StressDemoApi {
  const ctx = useContext(StressContext);
  const key = capabilities.join('|');
  const register = ctx?.register;

  useEffect(() => {
    if (!register) return undefined;
    return register(key ? (key.split('|') as StressCapability[]) : []);
  }, [register, key]);

  const longText = Boolean(ctx?.longText && capabilities.includes('longText'));
  const largeData = Boolean(ctx?.largeData && capabilities.includes('largeData'));

  return useMemo(
    () => ({ longText, largeData, text: (value: string) => (longText ? expandText(value) : value) }),
    [longText, largeData],
  );
}
