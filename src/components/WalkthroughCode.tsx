import { Highlight } from 'prism-react-renderer';
import { useEffect, useMemo, useRef } from 'react';
import type { ResolvedAnnotation } from '../types/walkthrough';
import { codeThemeDark, codeThemeLight } from './codeThemes';
import { usePrefersDark } from './CodeBlock';
import { CopyButton } from './CopyButton';
import codeStyles from './CodeBlock.module.css';
import styles from './CodeWalkthrough.module.css';

type WalkthroughCodeProps = {
  code: string;
  language: 'tsx' | 'css';
  filename: string;
  /** Steps that point into this file, in walkthrough order. */
  steps: ResolvedAnnotation[];
  /** Position of each step in the full walkthrough, for marker numbers. */
  numberOf: (step: ResolvedAnnotation) => number;
  active: ResolvedAnnotation | null;
  onSelect: (id: string) => void;
  regionId: string;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Source view with the active step's lines highlighted and every step's first line numbered. */
export function WalkthroughCode({ code, language, filename, steps, numberOf, active, onSelect, regionId }: WalkthroughCodeProps): JSX.Element {
  const dark = usePrefersDark();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trimmed = code.replace(/\n$/, '');

  // First step that covers each line, so a click anywhere in a span selects it.
  const owner = useMemo((): Map<number, ResolvedAnnotation> => {
    const map = new Map<number, ResolvedAnnotation>();
    for (const step of steps) {
      for (let line = step.start; line <= step.end; line += 1) if (!map.has(line)) map.set(line, step);
    }
    return map;
  }, [steps]);
  const startsAt = useMemo(() => new Map(steps.map((s) => [s.start, s] as const)), [steps]);

  // Scroll the code pane only (never the page) so the active span sits near the top.
  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      const line = scroller?.querySelector<HTMLElement>(`[data-line="${active.start}"]`);
      if (!scroller || !line || typeof scroller.scrollTo !== 'function') return;
      const top = line.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
      scroller.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, filename]);

  return (
    <figure className={`${codeStyles.frame} m-0`}>
      <figcaption className={codeStyles.header}>
        <p className={codeStyles.filename}>{filename}</p>
        <CopyButton text={code} label={`Copy ${filename}`} />
      </figcaption>
      <div
        ref={scrollerRef}
        id={regionId}
        className={`${codeStyles.scroller} ${styles.scroller}`}
        tabIndex={0}
        role="region"
        aria-label={active ? `${filename} source, step ${numberOf(active)} highlighted` : `${filename} source`}
      >
        <Highlight code={trimmed} language={language} theme={dark ? codeThemeDark : codeThemeLight}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} ${codeStyles.pre}`} style={style}>
              <code>
                {tokens.map((line, i) => {
                  const n = i + 1;
                  const step = owner.get(n);
                  const isActive = !!active && active.file === step?.file && n >= active.start && n <= active.end;
                  const marker = startsAt.get(n);
                  return (
                    <span
                      key={i}
                      {...getLineProps({ line })}
                      className={`${codeStyles.line} ${styles.line}`}
                      data-line={n}
                      data-annotated={step ? true : undefined}
                      data-active={isActive || undefined}
                      // Pointer shortcut only; the step list is the keyboard and screen reader path.
                      onClick={step ? () => onSelect(step.id) : undefined}
                    >
                      <span className={`${codeStyles.lineNo} ${styles.gutter}`} aria-hidden="true">
                        {marker ? <span className={styles.marker} data-active={marker.id === active?.id || undefined}>{numberOf(marker)}</span> : null}
                        <span className={styles.lineNumber}>{n}</span>
                      </span>
                      <span className={codeStyles.lineContent}>
                        {isActive && n === active?.start && <span className="sr-only">Start of step {numberOf(active)}. </span>}
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                        {isActive && n === active?.end && <span className="sr-only"> End of step {numberOf(active)}.</span>}
                      </span>
                    </span>
                  );
                })}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
    </figure>
  );
}
