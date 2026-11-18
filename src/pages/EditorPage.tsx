import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StatusBadge } from '../components/Badges';
import { useEditor } from '../context/EditorContext';
import { usePatterns } from '../context/PatternContext';
import { EmptyState } from '../patterns/empty-states/empty-state/EmptyState';
import { CATEGORIES } from '../types/pattern';
import { patternPath } from '../utils/slug';

/** Protected route: requires an editor build and Editor Mode switched on. */
export function RequireEditor({ children }: { children: ReactNode }): JSX.Element {
  const { canEdit, editorMode, setEditorMode } = useEditor();
  if (!canEdit) {
    return (
      <EmptyState
        variant="no-access"
        headingLevel={1}
        resource="the pattern editor"
        ownerName="The design system team"
        requestAccessHref="mailto:design-system@example.com?subject=Pattern%20library%20editor%20access"
      />
    );
  }
  if (!editorMode) {
    return (
      <EmptyState
        variant="first-use"
        headingLevel={1}
        title="Editor Mode is off"
        description="Turn on Editor Mode to create, edit, and publish patterns. Drafts become visible while it is on."
        primaryAction={{ label: 'Turn on Editor Mode', onClick: () => setEditorMode(true) }}
      />
    );
  }
  return <>{children}</>;
}

export function EditorPage(): JSX.Element {
  const { patterns } = usePatterns();
  return (
    <RequireEditor>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <p className="m-0 font-mono text-xs uppercase tracking-wider text-muted">Design system team</p>
            <h1 className="m-0 text-2xl font-semibold">Manage patterns</h1>
            <p className="m-0 max-w-[65ch] text-sm text-muted">
              Edits are saved in this browser. To ship a change to everyone, export the pattern as JSON and open a pull request that updates its
              pattern.ts.
            </p>
          </div>
          <Link to="/editor/new" className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline">
            New pattern
          </Link>
        </header>
        <div className="overflow-x-auto rounded-md border border-line bg-surface" role="region" aria-label="All patterns" tabIndex={0}>
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">All patterns, including drafts</caption>
            <thead className="bg-sunken">
              <tr>
                {['Pattern', 'Category', 'Status', 'Updated', 'Actions'].map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-4 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="border-b border-line px-4 py-2 font-medium">
                    <Link to={patternPath(p)} className="text-ink underline-offset-2 hover:underline">
                      {p.title}
                    </Link>
                  </th>
                  <td className="border-b border-line px-4 py-2 text-muted">{CATEGORIES.find((c) => c.id === p.category)?.label}</td>
                  <td className="border-b border-line px-4 py-2">{p.status === 'draft' ? <StatusBadge status="draft" /> : 'Published'}</td>
                  <td className="border-b border-line px-4 py-2 font-mono text-xs">{p.lastUpdated}</td>
                  <td className="border-b border-line px-4 py-2">
                    <Link to={`/editor/${encodeURIComponent(p.id)}`} className="font-medium text-accent underline underline-offset-2">
                      Edit<span className="sr-only"> {p.title}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireEditor>
  );
}
