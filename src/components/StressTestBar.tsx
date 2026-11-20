import { useId } from 'react';
import { WIDTH_PRESETS, ZOOM_LEVELS } from '../hooks/useStressSettings';
import type { StressSettingsApi, WidthPreset, ZoomLevel } from '../hooks/useStressSettings';
import type { StressCapability } from '../patterns/stress';
import type { StageMeasurement } from './StressStage';

type ToggleKey = 'rtl' | 'longText' | 'largeData';

const TOGGLES: { key: ToggleKey; label: string; capability?: StressCapability; help: string }[] = [
  { key: 'rtl', label: 'RTL', help: 'Sets dir="rtl" on the demo to check logical properties and icon mirroring.' },
  { key: 'longText', label: 'Long text', capability: 'longText', help: 'Lengthens labels and copy and adds an unbreakable word.' },
  { key: 'largeData', label: '10k rows', capability: 'largeData', help: 'Loads 10,000 records into the demo.' },
];

const selectClass = 'rounded border border-line bg-surface px-1.5 py-1 text-xs text-ink';

type StressTestBarProps = {
  api: StressSettingsApi;
  measurement: StageMeasurement | null;
};

/** Controls that push a live demo past the happy path: narrow containers, zoom, RTL, long text, big data. */
export function StressTestBar({ api, measurement }: StressTestBarProps): JSX.Element {
  const { settings, update, reset, isDefault, supports } = api;
  const baseId = useId();
  const zoomLabel = ZOOM_LEVELS.find((z) => z.value === settings.zoom)?.label.split(' ')[0] ?? '100%';

  return (
    <div role="group" aria-labelledby={`${baseId}-title`} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-line bg-sunken px-3 py-2 text-xs">
      <h3 id={`${baseId}-title`} className="m-0 font-mono text-xs font-normal uppercase tracking-wider text-muted">
        Stress test
      </h3>

      <label className="inline-flex items-center gap-1.5">
        <span className="text-muted">Width</span>
        <select className={selectClass} value={settings.width} onChange={(e) => update('width', e.target.value as WidthPreset)}>
          {WIDTH_PRESETS.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-1.5">
        <span className="text-muted">Zoom</span>
        <select className={selectClass} value={settings.zoom} onChange={(e) => update('zoom', e.target.value as ZoomLevel)}>
          {ZOOM_LEVELS.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-1.5">
        {TOGGLES.map((t) => {
          const unsupported = t.capability !== undefined && !supports.has(t.capability);
          const pressed = settings[t.key] && !unsupported;
          const helpId = `${baseId}-${t.key}-help`;
          return (
            <span key={t.key} className="contents">
            <button
              type="button"
              aria-pressed={pressed}
              aria-disabled={unsupported || undefined}
              aria-describedby={helpId}
              title={unsupported ? 'This demo has no data or copy to stretch.' : t.help}
              onClick={() => {
                if (!unsupported) update(t.key, !settings[t.key]);
              }}
              className={`rounded border px-2 py-1 font-medium ${
                pressed ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink'
              } ${unsupported ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {t.label}
            </button>
            <span id={helpId} className="sr-only">
              {unsupported ? 'Not available for this demo.' : t.help}
            </span>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={reset}
        disabled={isDefault}
        className="text-muted underline underline-offset-2 hover:text-ink disabled:cursor-default disabled:no-underline disabled:opacity-50"
      >
        Reset
      </button>

      {measurement && (
        <p className="m-0 ms-auto font-mono text-muted" aria-live="polite">
          {measurement.cssWidth} CSS px at {zoomLabel}
          {measurement.overflow > 0 && (
            <strong className="ms-2 font-semibold text-danger">Overflows by {measurement.overflow} px</strong>
          )}
        </p>
      )}
    </div>
  );
}
