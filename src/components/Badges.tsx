import type { PatternStatus, SourceApp, WcagLevel } from '../types/pattern';

const base = 'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wide';

export function SourceBadges({ apps }: { apps: SourceApp[] }): JSX.Element {
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Observed in">
      {apps.map((app) => (
        <li key={app} className={`${base} border border-line bg-surface text-ink`}>
          {app === 'Both' ? 'CoBank + ISW' : app}
        </li>
      ))}
    </ul>
  );
}

export function WcagBadge({ level }: { level: WcagLevel }): JSX.Element {
  return (
    <span className={`${base} bg-accent text-accent-ink`}>
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
        <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      WCAG 2.1 {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: PatternStatus }): JSX.Element | null {
  if (status === 'published') return null;
  return <span className={`${base} border border-dashed border-ink text-ink`}>Draft</span>;
}

export function EditorModeBadge(): JSX.Element {
  return (
    <span className={`${base} bg-[var(--color-editor)] text-[#2b1d00]`} role="status">
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
        <path d="M8.5 1.5l2 2L4 10H2V8z" fill="currentColor" />
      </svg>
      Editor Mode
    </span>
  );
}
