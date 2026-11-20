import { NavLink } from 'react-router-dom';
import { activeClient } from '../appConfig';
import { usePatterns } from '../context/PatternContext';
import { CATEGORIES } from '../types/pattern';
import { activeFilterCount, allTags } from '../utils/filter';
import type { SourceFilter } from '../utils/filter';
import { patternPath } from '../utils/slug';
import { CLIENT_LABELS } from '../types/client';

const SOURCES: { value: SourceFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'client-a', label: CLIENT_LABELS['client-a'] },
  { value: 'client-b', label: CLIENT_LABELS['client-b'] },
  { value: 'Both', label: 'Both' },
];

export function Sidebar({ onNavigate }: { onNavigate: () => void }): JSX.Element {
  const { patterns, filtered, filters, setFilters, resetFilters } = usePatterns();
  const tags = allTags(patterns);
  const active = activeFilterCount(filters);

  return (
    <div className="grid gap-6 p-4">
      {activeClient === null && (
      <fieldset className="m-0 grid gap-2 border-0 p-0">
        <legend className="mb-2 p-0 font-mono text-xs uppercase tracking-wider text-muted">Observed in</legend>
        <div className="grid grid-cols-4 rounded border border-line p-0.5">
          {SOURCES.map((source) => (
            <label key={source.value} className="relative">
              <input
                type="radio"
                name="source-filter"
                value={source.value}
                checked={filters.source === source.value}
                onChange={() => setFilters({ source: source.value })}
                className="peer absolute inset-0 cursor-pointer opacity-0"
              />
              <span className="block rounded-sm py-1 text-center text-xs font-medium text-muted peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--sux-focus)]">
                {source.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      )}

      <div className="grid gap-2">
        <label htmlFor="tag-filter" className="font-mono text-xs uppercase tracking-wider text-muted">
          Tag
        </label>
        <select
          id="tag-filter"
          value={filters.tag}
          onChange={(event) => setFilters({ tag: event.target.value })}
          className="h-9 rounded border border-line bg-surface px-2 text-sm"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <p className="m-0" role="status">
          {filtered.length} of {patterns.length} patterns
        </p>
        {active > 0 && (
          <button type="button" onClick={resetFilters} className="font-medium text-accent underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>

      <nav aria-label="Patterns" className="grid gap-5">
        {CATEGORIES.map((category) => {
          const items = filtered.filter((p) => p.category === category.id);
          return (
            <section key={category.id} aria-labelledby={`nav-${category.id}`}>
              <h2 id={`nav-${category.id}`} className="m-0 mb-1.5 flex justify-between text-xs font-semibold uppercase tracking-wider text-ink">
                {category.label}
                <span className="font-mono font-normal text-muted">
                  {items.length}
                  <span className="sr-only"> patterns</span>
                </span>
              </h2>
              {items.length === 0 ? (
                <p className="m-0 pl-3 text-xs text-muted">No matches</p>
              ) : (
                <ul className="m-0 grid list-none gap-0.5 p-0">
                  {items.map((pattern) => (
                    <li key={pattern.id}>
                      <NavLink
                        to={patternPath(pattern)}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `block rounded border-l-2 px-3 py-1.5 text-sm no-underline ${
                            isActive ? 'border-accent bg-[var(--sux-accent-soft)] font-medium text-ink' : 'border-transparent text-muted hover:bg-sunken hover:text-ink'
                          }`
                        }
                      >
                        {pattern.title}
                        {pattern.status === 'draft' && <span className="ml-1 font-mono text-[0.625rem] uppercase">(draft)</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </nav>
    </div>
  );
}
