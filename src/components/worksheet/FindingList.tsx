import { Link } from 'react-router-dom';
import type { Pattern } from '../../types/pattern';
import type { Finding, Severity } from '../../types/worksheet';
import { categoryLabel, severityLabel } from '../../utils/worksheet';
import { patternPath } from '../../utils/slug';

const badgeBase = 'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wide';
const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-danger text-canvas',
  serious: 'border border-danger text-danger',
  moderate: 'border border-warning text-warning',
  minor: 'border border-line text-muted',
};

export function SeverityBadge({ severity }: { severity: Severity }): JSX.Element {
  return <span className={`${badgeBase} ${SEVERITY_STYLE[severity]}`}>{severityLabel(severity)}</span>;
}

export const findingHeadingId = (id: string): string => `finding-${id}`;

type FindingListProps = {
  findings: Finding[];
  patterns: Pick<Pattern, 'id' | 'title' | 'category' | 'slug'>[];
  editingId: string | null;
  onEdit: (finding: Finding) => void;
  onDelete: (finding: Finding) => void;
};

/** Findings, most severe first. Each heading takes focus after its finding is edited. */
export function FindingList({ findings, patterns, editingId, onEdit, onDelete }: FindingListProps): JSX.Element {
  return (
    <ol className="m-0 grid list-none gap-3 p-0">
      {findings.map((f, i) => {
        const pattern = patterns.find((p) => p.id === f.patternId);
        const headingId = findingHeadingId(f.id);
        return (
          <li key={f.id}>
            <article
              aria-labelledby={headingId}
              className={`grid gap-3 rounded-md border bg-surface p-4 ${editingId === f.id ? 'border-ink' : 'border-line'}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-2">
                <h3 id={headingId} tabIndex={-1} className="m-0 text-base font-semibold outline-none focus-visible:outline focus-visible:outline-2">
                  <span className="mr-1.5 font-mono text-sm text-muted">{i + 1}.</span>
                  {f.title}
                </h3>
                <SeverityBadge severity={f.severity} />
              </header>
              <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                {[
                  ['Category', categoryLabel(f.category)],
                  ['Where', f.location],
                  ['WCAG', f.wcag],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-1.5">
                      <dt className="text-muted">{label}</dt>
                      <dd className="m-0 font-medium">{value}</dd>
                    </div>
                  ))}
              </dl>
              <p className="m-0 whitespace-pre-line text-sm leading-relaxed">{f.observation}</p>
              {f.recommendation && (
                <div className="grid gap-1 border-l-2 border-accent pl-3">
                  <p className="m-0 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">Recommendation</p>
                  <p className="m-0 whitespace-pre-line text-sm leading-relaxed">{f.recommendation}</p>
                </div>
              )}
              <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {pattern && (
                  <span className="mr-auto text-muted">
                    Solved by{' '}
                    <Link to={patternPath(pattern)} className="font-medium text-accent underline underline-offset-2">
                      {pattern.title}
                    </Link>
                  </span>
                )}
                <span className={`flex gap-2 ${pattern ? '' : 'ml-auto'}`}>
                  <button type="button" onClick={() => onEdit(f)} className="rounded border border-line px-3 py-1 text-xs font-medium hover:border-ink">
                    Edit<span className="sr-only"> {f.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(f)}
                    className="rounded border border-line px-3 py-1 text-xs font-medium text-danger hover:border-danger"
                  >
                    Delete<span className="sr-only"> {f.title}</span>
                  </button>
                </span>
              </footer>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
