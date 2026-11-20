import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TabOrderOverlay } from './TabOrderOverlay';
import { useKeyboardOnly } from './useKeyboardOnly';
import { useTabOrder } from './useTabOrder';
import type { TabOrderSnapshot } from './useTabOrder';

type DemoInspectorProps = {
  /** Classes for the demo frame; the inspector owns the frame element so it can observe and guard it. */
  className?: string;
  children: ReactNode;
};

const POINTER_HINT = 'Pointer input is off. Use Tab, Shift+Tab, Enter, Space, the arrow keys, and Escape.';

function ToggleButton({ pressed, onToggle, children }: { pressed: boolean; onToggle: () => void; children: ReactNode }): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-sm ${
        pressed ? 'border-ink bg-ink text-canvas' : 'border-line text-ink hover:border-ink'
      }`}
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${pressed ? 'bg-canvas' : 'border border-muted'}`} />
      {children}
    </button>
  );
}

export type TabOrderDescription = {
  /** Stop count and warnings; announced politely when it changes. */
  summary: string;
  /** Position of the focused stop; shown but not announced, since screen readers already speak the focused control. */
  focus: string;
};

export function describeTabOrder(snapshot: TabOrderSnapshot): TabOrderDescription {
  const { stops, activeOrder } = snapshot;
  if (stops.length === 0) return { summary: 'No tab stops in this demo.', focus: '' };
  const count = `${stops.length} tab ${stops.length === 1 ? 'stop' : 'stops'}.`;
  const positive = stops.filter((s) => s.positiveTabIndex).length;
  const warning = positive > 0 ? ` ${positive} ${positive === 1 ? 'uses' : 'use'} a positive tabindex.` : '';
  const active = stops.find((s) => s.order === activeOrder);
  const focus = active ? `Focus on ${active.order} of ${stops.length}: ${active.label}.` : '';
  return { summary: `${count}${warning}`, focus };
}

/**
 * Wraps a live demo with two audit tools:
 *  - Keyboard only: blocks pointer input inside the demo, so the reviewer has to complete the task by keyboard.
 *  - Tab order: overlays the sequential focus order and tracks the focused stop as it moves.
 */
export function DemoInspector({ className, children }: DemoInspectorProps): JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  const [keyboardOnly, setKeyboardOnly] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [hint, setHint] = useState('');

  const onBlocked = useCallback(() => setHint(POINTER_HINT), []);
  useKeyboardOnly(frameRef, keyboardOnly, onBlocked);
  const snapshot = useTabOrder(frameRef, showOrder);

  useEffect(() => {
    if (!keyboardOnly) setHint('');
  }, [keyboardOnly]);

  const order = snapshot ? describeTabOrder(snapshot) : null;
  const summary = [hint, order?.summary].filter(Boolean).join(' ');

  return (
    <div className="grid gap-3">
      <div role="group" aria-label="Demo inspection tools" className="flex flex-wrap items-center gap-2">
        <ToggleButton pressed={keyboardOnly} onToggle={() => setKeyboardOnly((v) => !v)}>
          Keyboard only
        </ToggleButton>
        <ToggleButton pressed={showOrder} onToggle={() => setShowOrder((v) => !v)}>
          Show tab order
        </ToggleButton>
        <p className="m-0 min-h-[1.25rem] text-xs text-muted">
          <span id={statusId} role="status">
            {summary}
          </span>
          {order?.focus && <span className="text-ink"> {order.focus}</span>}
        </p>
      </div>
      <div
        ref={frameRef}
        data-keyboard-only={keyboardOnly || undefined}
        className={`${className ?? ''} ${keyboardOnly ? 'cursor-not-allowed outline-dashed outline-1 outline-offset-4 outline-line' : ''}`}
      >
        {children}
      </div>
      {snapshot && <TabOrderOverlay snapshot={snapshot} />}
    </div>
  );
}
