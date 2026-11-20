import { Link } from 'react-router-dom';
import type { Pattern } from '../types/pattern';
import { CATEGORIES } from '../types/pattern';
import { patternPath } from '../utils/slug';
import { SourceBadges, StatusBadge, WcagBadge } from './Badges';

export function PatternCard({ pattern }: { pattern: Pattern }): JSX.Element {
  const category = CATEGORIES.find((c) => c.id === pattern.category)?.label ?? pattern.category;
  return (
    <article className="group relative flex flex-col gap-3 rounded-md border border-line bg-surface p-4 transition-colors hover:border-ink focus-within:border-ink">
      <p className="m-0 font-mono text-xs uppercase tracking-wider text-muted">{category}</p>
      <h3 className="m-0 text-base font-semibold leading-snug">
        <Link to={patternPath(pattern)} className="text-ink no-underline after:absolute after:inset-0 after:rounded-md focus-visible:outline-none group-focus-within:underline">
          {pattern.title}
        </Link>
      </h3>
      <p className="m-0 flex-1 text-sm leading-relaxed text-muted">{pattern.summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        <WcagBadge level={pattern.wcagLevel} />
        <SourceBadges clients={pattern.clients} />
        <StatusBadge status={pattern.status} />
      </div>
    </article>
  );
}
