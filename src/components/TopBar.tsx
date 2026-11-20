import { Link, NavLink, useMatch, useNavigate } from 'react-router-dom';
import { usePatterns } from '../context/PatternContext';
import { useEditor } from '../context/EditorContext';
import { CopyLinkButton } from './CopyLinkButton';
import { ExportMenu } from './ExportMenu';
import { EditorModeBadge } from './Badges';

export function TopBar({ onToggleNav, navOpen }: { onToggleNav: () => void; navOpen: boolean }): JSX.Element {
  const navigate = useNavigate();
  const match = useMatch('/patterns/:category/:slug');
  const { filters, setFilters, getPattern, filtered } = usePatterns();
  const { canEdit, editorMode, setEditorMode } = useEditor();
  const pattern = match ? getPattern(match.params.category ?? '', match.params.slug ?? '') : undefined;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 lg:px-6">
        <button
          type="button"
          onClick={onToggleNav}
          aria-expanded={navOpen}
          aria-controls="pattern-sidebar"
          className="inline-flex min-h-[2.25rem] items-center rounded border border-line px-3 text-sm font-medium md:hidden"
        >
          Patterns
        </button>
        <Link to="/" className="mr-2 flex items-baseline gap-2 text-ink no-underline">
          <span className="font-mono text-sm font-semibold tracking-tight">solving/ux</span>
          <span className="hidden text-xs text-muted sm:inline">Pattern library</span>
        </Link>

        <form
          role="search"
          className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            navigate('/');
          }}
        >
          <label htmlFor="global-search" className="sr-only">
            Search patterns
          </label>
          <input
            id="global-search"
            type="search"
            value={filters.query}
            onChange={(event) => setFilters({ query: event.target.value })}
            placeholder="Search patterns, tags, problems"
            aria-describedby="global-search-count"
            className="h-9 w-full rounded border border-line bg-canvas px-3 text-sm placeholder:text-muted"
          />
          <span id="global-search-count" className="sr-only" aria-live="polite">
            {filters.query ? `${filtered.length} ${filtered.length === 1 ? 'pattern matches' : 'patterns match'}.` : ''}
          </span>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <NavLink
            to="/worksheet"
            className={({ isActive }) =>
              `inline-flex min-h-[2.25rem] items-center rounded px-2 text-sm font-medium no-underline ${isActive ? 'text-ink underline decoration-2 underline-offset-4' : 'text-muted hover:text-ink'}`
            }
          >
            Audit worksheet
          </NavLink>
          {pattern && (
            <>
              <CopyLinkButton pattern={pattern} />
              <ExportMenu pattern={pattern} />
            </>
          )}
          {canEdit && (
            <>
              {editorMode && <EditorModeBadge />}
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={editorMode}
                  checked={editorMode}
                  onChange={(event) => setEditorMode(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-editor)]"
                />
                Editor Mode
              </label>
              {editorMode && (
                <Link to="/editor" className="text-sm font-medium text-accent underline-offset-2 hover:underline">
                  Manage
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
