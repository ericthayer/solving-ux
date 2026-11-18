import { useSearchParams } from 'react-router-dom';
import { PatternCard } from '../components/PatternCard';
import { usePatterns } from '../context/PatternContext';
import { EmptyState } from '../patterns/empty-states/empty-state/EmptyState';
import { CATEGORIES } from '../types/pattern';
import { activeFilterCount } from '../utils/filter';

export function HomePage(): JSX.Element {
  const { patterns, filtered, filters, resetFilters } = usePatterns();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const visible = category ? filtered.filter((p) => p.category === category) : filtered;
  const sourceCount = (app: 'CoBank' | 'ISW'): number =>
    patterns.filter((p) => p.sourceApps.includes(app) || p.sourceApps.includes('Both')).length;

  return (
    <div className="grid gap-8">
      <header className="grid gap-4 border-b border-line pb-8">
        <p className="m-0 font-mono text-xs uppercase tracking-wider text-accent">Enterprise UX audit</p>
        <h1 className="m-0 max-w-[22ch] text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
          Hard UI problems from CoBank and ISW, solved once.
        </h1>
        <p className="m-0 max-w-[62ch] text-base leading-relaxed text-muted">
          Each entry documents a failure we found in production apps, the redesigned component, its tests, and its accessibility contract.
          Copy the code, download it as a ZIP, or link a teammate straight to the pattern.
        </p>
        <dl className="m-0 mt-2 flex flex-wrap gap-x-10 gap-y-3">
          {[
            ['Patterns', patterns.length],
            ['Categories', CATEGORIES.length],
            ['Seen in CoBank', sourceCount('CoBank')],
            ['Seen in ISW', sourceCount('ISW')],
          ].map(([label, value]) => (
            <div key={label} className="grid">
              <dt className="order-2 text-xs text-muted">{label}</dt>
              <dd className="order-1 m-0 font-mono text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-labelledby="browse-heading" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="browse-heading" className="m-0 text-lg font-semibold">
            Browse patterns
          </h2>
          <p className="m-0 text-sm text-muted" aria-live="polite">
            Showing {visible.length} of {patterns.length}
          </p>
        </div>

        <nav aria-label="Filter by category">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {[{ id: '', label: 'All' }, ...CATEGORIES].map((c) => {
              const current = c.id === category;
              return (
                <li key={c.id || 'all'}>
                  <button
                    type="button"
                    aria-pressed={current}
                    onClick={() => setParams(c.id ? { category: c.id } : {}, { replace: true })}
                    className={`rounded-full border px-3 py-1 text-sm ${current ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink hover:border-ink'}`}
                  >
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {visible.length === 0 ? (
          <EmptyState
            variant="no-results"
            query={filters.query || undefined}
            activeFilterCount={activeFilterCount(filters) + (category ? 1 : 0)}
            onClearFilters={() => {
              resetFilters();
              setParams({}, { replace: true });
            }}
          />
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {visible.map((pattern) => (
              <li key={pattern.id} className="grid">
                <PatternCard pattern={pattern} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
