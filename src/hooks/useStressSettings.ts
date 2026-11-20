import { useCallback, useMemo, useState } from 'react';
import type { StressCapability, StressContextValue } from '../patterns/stress';

export const WIDTH_PRESETS = [
  { value: 'fit', label: 'Fit', px: null },
  { value: '320', label: '320 px (phone)', px: 320 },
  { value: '480', label: '480 px', px: 480 },
  { value: '768', label: '768 px (tablet)', px: 768 },
  { value: '1024', label: '1024 px', px: 1024 },
] as const;

export const ZOOM_LEVELS = [
  { value: '1', label: '100%', factor: 1 },
  { value: '2', label: '200% (1.4.4)', factor: 2 },
  { value: '4', label: '400% (1.4.10)', factor: 4 },
] as const;

export type WidthPreset = (typeof WIDTH_PRESETS)[number]['value'];
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]['value'];

export type StressSettings = {
  width: WidthPreset;
  zoom: ZoomLevel;
  rtl: boolean;
  longText: boolean;
  largeData: boolean;
};

export const DEFAULT_STRESS: StressSettings = { width: 'fit', zoom: '1', rtl: false, longText: false, largeData: false };

export type StressSettingsApi = {
  settings: StressSettings;
  update: <K extends keyof StressSettings>(key: K, value: StressSettings[K]) => void;
  reset: () => void;
  isDefault: boolean;
  supports: ReadonlySet<StressCapability>;
  context: StressContextValue;
};

/** Owns stress settings for one pattern preview and the capability registry its demo reports into. */
export function useStressSettings(): StressSettingsApi {
  const [settings, setSettings] = useState<StressSettings>(DEFAULT_STRESS);
  const [supports, setSupports] = useState<ReadonlySet<StressCapability>>(() => new Set());

  const update = useCallback(<K extends keyof StressSettings>(key: K, value: StressSettings[K]): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);
  const reset = useCallback((): void => setSettings(DEFAULT_STRESS), []);

  const register = useCallback((capabilities: StressCapability[]): (() => void) => {
    setSupports(new Set(capabilities));
    return () => setSupports(new Set());
  }, []);

  const context = useMemo<StressContextValue>(
    () => ({ longText: settings.longText, largeData: settings.largeData, register }),
    [settings.longText, settings.largeData, register],
  );

  const isDefault = (Object.keys(DEFAULT_STRESS) as (keyof StressSettings)[]).every((k) => settings[k] === DEFAULT_STRESS[k]);

  return { settings, update, reset, isDefault, supports, context };
}
