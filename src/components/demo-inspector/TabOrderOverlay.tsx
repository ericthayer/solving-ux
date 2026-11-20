import { createPortal } from 'react-dom';
import { OVERLAY_ATTR } from './useTabOrder';
import type { TabOrderSnapshot } from './useTabOrder';
import styles from './TabOrderOverlay.module.css';

/**
 * Visual-only layer: numbered badges on every tab stop, an outline per stop, and a path tracing the order.
 * aria-hidden because the same information is announced through DemoInspector's status line.
 * Fixed-positioned and portaled out of the demo box, whose container-type would otherwise become its containing block.
 */
export function TabOrderOverlay({ snapshot }: { snapshot: TabOrderSnapshot }): JSX.Element {
  const { frame, stops, host, activeOrder } = snapshot;
  const local = stops.map((s) => ({ ...s, x: s.box.left - frame.left, y: s.box.top - frame.top }));
  const path = local.map((s) => `${s.x + s.box.width / 2},${s.y + s.box.height / 2}`).join(' ');

  return createPortal(
    <div
      {...{ [OVERLAY_ATTR]: '' }}
      aria-hidden="true"
      className={styles.layer}
      style={{ top: frame.top, left: frame.left, width: frame.width, height: frame.height }}
    >
      <svg className={styles.path} width={frame.width} height={frame.height}>
        {local.length > 1 && <polyline points={path} />}
      </svg>
      {local.map((s) => {
        const active = s.order === activeOrder;
        return (
          <div key={s.order}>
            <div
              className={`${styles.outline} ${active ? styles.active : ''}`}
              style={{ top: s.y, left: s.x, width: s.box.width, height: s.box.height }}
            />
            <span
              className={`${styles.badge} ${active ? styles.active : ''} ${s.positiveTabIndex ? styles.warn : ''}`}
              style={{ top: s.y, left: s.x }}
            >
              {s.order}
            </span>
          </div>
        );
      })}
    </div>,
    host,
  );
}
