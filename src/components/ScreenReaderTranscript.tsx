import { useId } from 'react';
import type { ScreenReaderTranscript as Transcript, TranscriptStep, Utterance } from '../types/transcript';
import styles from './ScreenReaderTranscript.module.css';

type Side = 'before' | 'after';

const SIDE = {
  before: { label: 'Before', labelClass: 'text-danger', cardClass: 'border border-dashed border-line bg-sunken' },
  after: { label: 'After', labelClass: 'text-accent', cardClass: 'border border-line border-l-4 border-l-accent bg-surface' },
} as const satisfies Record<Side, { label: string; labelClass: string; cardClass: string }>;

function UtteranceItem({ utterance }: { utterance: Utterance }): JSX.Element {
  switch (utterance.kind) {
    case 'speech':
      return (
        <li className="font-mono text-xs leading-relaxed">
          <span className={styles.speech}>{utterance.text}</span>
        </li>
      );
    case 'silence':
      return (
        <li className="text-sm leading-relaxed">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Silence.</span>{' '}
          <span className="text-muted">{utterance.note}</span>
        </li>
      );
  }
}

function SideCard({ side, step }: { side: Side; step: TranscriptStep }): JSX.Element {
  const { label, labelClass, cardClass } = SIDE[side];
  const labelId = useId();
  return (
    <div className={`grid gap-2 rounded-md p-4 ${cardClass}`} role="group" aria-labelledby={labelId}>
      <p id={labelId} className={`m-0 font-mono text-xs uppercase tracking-wider ${labelClass}`}>
        {label}
      </p>
      <ol className="m-0 grid list-none gap-1.5 p-0">
        {step[side].map((utterance, i) => (
          <UtteranceItem key={i} utterance={utterance} />
        ))}
      </ol>
      {side === 'before' && step.failure && (
        <p className="m-0 flex gap-2 border-t border-line pt-2 text-sm">
          <span aria-hidden="true" className="mt-[0.4rem] h-1.5 w-1.5 flex-none rounded-full bg-danger" />
          <span>
            {step.criterion && <span className="font-mono text-xs font-semibold">Fails {step.criterion}. </span>}
            {step.failure}
          </span>
        </p>
      )}
    </div>
  );
}

function Step({ step, index }: { step: TranscriptStep; index: number }): JSX.Element {
  return (
    <li className={`grid gap-2 ${styles.step}`}>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span aria-hidden="true" className="font-mono text-xs text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <strong className="font-semibold">
          {step.action}
        </strong>
        {step.keys && <kbd className="rounded border border-line bg-sunken px-1.5 py-0.5 font-mono text-xs">{step.keys}</kbd>}
      </p>
      <div className={styles.compare}>
        <SideCard side="before" step={step} />
        <SideCard side="after" step={step} />
      </div>
    </li>
  );
}

/** Step-by-step comparison of what a screen reader announces in the audited build versus the solved pattern. */
export function ScreenReaderTranscript({ transcript }: { transcript: Transcript }): JSX.Element {
  const headingId = useId();
  return (
    <section className="grid gap-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="m-0 text-sm font-semibold uppercase tracking-wider text-muted">
        Screen reader transcript
      </h3>
      <p className="m-0 max-w-[75ch] text-sm text-muted">
        What {transcript.environment} announces at each step. Before is the audited build; After is this pattern. Wording is representative and
        shifts with the screen reader, browser, and verbosity settings.
      </p>
      <ol className="m-0 grid list-none gap-5 p-0">
        {transcript.steps.map((step, i) => (
          <Step key={step.action} step={step} index={i} />
        ))}
      </ol>
    </section>
  );
}
