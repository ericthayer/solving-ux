import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ZOOM_LEVELS } from '../hooks/useStressSettings';
import type { StressSettings } from '../hooks/useStressSettings';
import styles from './StressStage.module.css';

export type StageMeasurement = {
  /** Width the demo lays out in, in CSS px (visual width / zoom). */
  cssWidth: number;
  /** How far content spills past the stage edge, in CSS px. 0 means it reflows. */
  overflow: number;
};

type StressStageProps = {
  settings: StressSettings;
  onMeasure: (measurement: StageMeasurement) => void;
  children: ReactNode;
};

const sameMeasurement = (a: StageMeasurement | null, b: StageMeasurement): boolean =>
  a !== null && a.cssWidth === b.cssWidth && a.overflow === b.overflow;

/** Wraps a live demo in a width-constrained, zoomable, direction-aware stage and reports reflow failures. */
export function StressStage({ settings, onMeasure, children }: StressStageProps): JSX.Element {
  const sizerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<StageMeasurement | null>(null);
  const onMeasureRef = useRef(onMeasure);
  onMeasureRef.current = onMeasure;
  const factor = ZOOM_LEVELS.find((z) => z.value === settings.zoom)?.factor ?? 1;

  useEffect(() => {
    const sizer = sizerRef.current;
    const stage = stageRef.current;
    if (!sizer || !stage) return undefined;
    let frame = 0;

    const measure = (): void => {
      frame = 0;
      // The sizer is unzoomed, so its width is visual px. The stage reports its own metrics in its zoomed CSS px.
      const next: StageMeasurement = {
        cssWidth: Math.round(sizer.clientWidth / factor),
        overflow: Math.max(0, stage.scrollWidth - stage.clientWidth),
      };
      if (sameMeasurement(lastRef.current, next)) return;
      lastRef.current = next;
      onMeasureRef.current(next);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    resize?.observe(sizer);
    resize?.observe(stage);
    const mutations = new MutationObserver(schedule);
    mutations.observe(stage, { childList: true, subtree: true, characterData: true, attributes: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resize?.disconnect();
      mutations.disconnect();
    };
  }, [factor, settings.width, settings.rtl]);

  const constrained = settings.width !== 'fit' || settings.zoom !== '1';

  return (
    <div ref={sizerRef} className={styles.sizer} data-width={settings.width} data-constrained={constrained || undefined}>
      <div ref={stageRef} className={styles.stage} data-zoom={settings.zoom} dir={settings.rtl ? 'rtl' : undefined} data-testid="stress-stage">
        {children}
      </div>
    </div>
  );
}
