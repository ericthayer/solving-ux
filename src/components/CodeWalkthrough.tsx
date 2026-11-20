import { useId, useMemo } from 'react';
import type { ResolvedAnnotation, WalkthroughFile, WalkthroughTopic } from '../types/walkthrough';
import { lineRangeLabel } from '../utils/walkthrough';
import type { WalkthroughSources } from '../utils/walkthrough';
import { WCAG_CRITERIA, wcagUrl } from '../utils/wcag';
import { WalkthroughCode } from './WalkthroughCode';
import styles from './CodeWalkthrough.module.css';

export const TOPIC_LABEL: Record<WalkthroughTopic, string> = {
  semantics: 'Semantics',
  state: 'State',
  focus: 'Focus',
  announce: 'Announcements',
  resilience: 'Resilience',
  performance: 'Performance',
  styling: 'Styling',
};

export type CodeWalkthroughProps = {
  steps: ResolvedAnnotation[];
  sources: WalkthroughSources;
  filenames: Record<WalkthroughFile, string>;
  /** Controlled active step. Falls back to the first step when null or unknown. */
  activeId: string | null;
  onActiveChange: (id: string) => void;
};

function WcagLinks({ criteria }: { criteria: string[] }): JSX.Element {
  return (
    <ul className={styles.wcagList} aria-label="WCAG success criteria">
      {criteria.map((c) => {
        const entry = WCAG_CRITERIA[c];
        const url = wcagUrl(c);
        const text = entry ? `${c} ${entry.title} (${entry.level})` : c;
        return (
          <li key={c}>
            {url ? (
              <a className={styles.wcagChip} href={url} target="_blank" rel="noreferrer">
                {text}
                <span className="sr-only"> (opens W3C Understanding page in a new tab)</span>
              </a>
            ) : (
              <span className={styles.wcagChip}>{text}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Step-by-step reading of a pattern's source: each step pins rationale and WCAG notes to a line range. */
export function CodeWalkthrough({ steps, sources, filenames, activeId, onActiveChange }: CodeWalkthroughProps): JSX.Element {
  const baseId = useId();
  const regionId = `${baseId}-code`;
  const index = Math.max(0, steps.findIndex((s) => s.id === activeId));
  const active = steps[index] ?? null;
  const numberOf = useMemo(() => {
    const order = new Map(steps.map((s, i) => [s.id, i + 1] as const));
    return (step: ResolvedAnnotation): number => order.get(step.id) ?? 0;
  }, [steps]);

  if (!active) return <p className="m-0 text-sm text-muted">No walkthrough has been written for this pattern yet.</p>;

  const file = active.file;
  const fileSteps = steps.filter((s) => s.file === file);
  // aria-disabled instead of disabled: reaching the last step must not drop focus to <body>.
  const go = (next: number): void => {
    const step = steps[next];
    if (step) onActiveChange(step.id);
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <section className={styles.steps} aria-labelledby={`${baseId}-heading`}>
          <h2 id={`${baseId}-heading`} className={styles.heading}>
            Code walkthrough
          </h2>
          <p className={styles.intro}>
            {steps.length} annotated steps. Each one ties a span of the source to the decision behind it and the WCAG criteria it meets.
          </p>
          <ol className={styles.stepList}>
            {steps.map((step, i) => {
              const current = step.id === active.id;
              return (
                <li key={step.id} className={styles.step} data-active={current || undefined}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    aria-current={current ? 'step' : undefined}
                    aria-controls={regionId}
                    onClick={() => onActiveChange(step.id)}
                  >
                    <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
                    <span className={styles.stepText}>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <span className={styles.stepMeta}>
                        {TOPIC_LABEL[step.topic]} · {filenames[step.file]}, <span className={styles.nowrap}>{lineRangeLabel(step)}</span>
                      </span>
                    </span>
                  </button>
                  {current && (
                    <div className={styles.detail}>
                      <p className={styles.rationale}>{step.rationale}</p>
                      {step.wcag && step.wcag.length > 0 && <WcagLinks criteria={step.wcag} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className={styles.codeColumn}>
          <div className={styles.toolbar}>
            <button type="button" className={styles.navButton} onClick={() => go(index - 1)} aria-disabled={index === 0 || undefined}>
              Previous step
            </button>
            <p className={styles.position} aria-live="polite">
              Step {index + 1} of {steps.length}: {active.title}, {lineRangeLabel(active)}
            </p>
            <button type="button" className={styles.navButton} onClick={() => go(index + 1)} aria-disabled={index === steps.length - 1 || undefined}>
              Next step
            </button>
          </div>
          <WalkthroughCode
            code={sources[file]}
            language={file === 'styles' ? 'css' : 'tsx'}
            filename={filenames[file]}
            steps={fileSteps}
            numberOf={numberOf}
            active={active}
            onSelect={onActiveChange}
            regionId={regionId}
          />
        </div>
      </div>
    </div>
  );
}
