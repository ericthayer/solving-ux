import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AccessibilityPanel } from '../components/AccessibilityPanel';
import { AuditSummary } from '../components/AuditSummary';
import { BeforeDemoNotice } from '../components/BeforeDemoNotice';
import { SourceBadges, StatusBadge, WcagBadge } from '../components/Badges';
import { CodeBlock } from '../components/CodeBlock';
import { DemoVersionToggle } from '../components/DemoVersionToggle';
import type { DemoVersion } from '../components/DemoVersionToggle';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PropsTable } from '../components/PropsTable';
import { Tabs } from '../components/Tabs';
import { usePatterns } from '../context/PatternContext';
import { useEditor } from '../context/EditorContext';
import { CATEGORIES } from '../types/pattern';
import type { Pattern } from '../types/pattern';
import { NotFoundPage } from './NotFoundPage';

const TAB_IDS = ['preview', 'code', 'tests', 'accessibility'] as const;
type TabId = (typeof TAB_IDS)[number];
const isTab = (value: string | null): value is TabId => TAB_IDS.includes(value as TabId);

type PreviewProps = { pattern: Pattern; version: DemoVersion; onVersionChange: (version: DemoVersion) => void };

function Preview({ pattern, version, onVersionChange }: PreviewProps): JSX.Element {
  const showBefore = version === 'before' && pattern.beforeComponent !== null;
  const Demo = showBefore ? pattern.beforeComponent : pattern.component;
  return (
    <div className="grid gap-8">
      <section aria-labelledby="demo-heading" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="demo-heading" className="m-0 text-base font-semibold">
            Live demo
          </h2>
          {pattern.beforeComponent && pattern.component && <DemoVersionToggle value={showBefore ? 'before' : 'after'} onChange={onVersionChange} />}
        </div>
        {showBefore && <BeforeDemoNotice failures={pattern.beforeState.failures} />}
        <div
          className={`rounded-md border p-5 [container-type:inline-size] lg:p-8 ${showBefore ? 'overflow-clip border-dashed border-line bg-sunken' : 'border-line bg-surface'}`}
          data-demo-version={showBefore ? 'before' : 'after'}
        >
          {Demo ? (
            <ErrorBoundary
              key={`${pattern.id}:${showBefore ? 'before' : 'after'}`}
              fallback={(error, reset) => (
                <div role="alert" className="grid gap-2 text-sm">
                  <p className="m-0 font-semibold">The demo crashed: {error.message}</p>
                  <button type="button" onClick={reset} className="justify-self-start rounded border border-line px-3 py-1">
                    Reload demo
                  </button>
                </div>
              )}
            >
              <Demo />
            </ErrorBoundary>
          ) : (
            <p className="m-0 text-sm text-muted">
              Draft pattern: the live demo appears once the component is added to <code className="font-mono">src/patterns/{pattern.category}/{pattern.slug}</code> and
              registered. The Code and Tests tabs show the submitted source.
            </p>
          )}
        </div>
      </section>
      {pattern.usage && (
        <section aria-labelledby="usage-heading" className="grid gap-3">
          <h2 id="usage-heading" className="m-0 text-base font-semibold">
            Usage
          </h2>
          <CodeBlock code={pattern.usage} language="tsx" filename="Usage.tsx" />
        </section>
      )}
      <section aria-labelledby="props-heading" className="grid gap-3">
        <h2 id="props-heading" className="m-0 text-base font-semibold">
          Props
        </h2>
        <PropsTable props={pattern.props} />
      </section>
    </div>
  );
}

function CodeTab({ pattern }: { pattern: Pattern }): JSX.Element {
  const [file, setFile] = useState<'component' | 'styles'>('component');
  const hasStyles = Boolean(pattern.files.styles && pattern.styles);
  return (
    <div className="grid gap-3">
      {hasStyles && (
        <fieldset className="m-0 flex gap-4 border-0 p-0 text-sm">
          <legend className="sr-only">File</legend>
          {(['component', 'styles'] as const).map((f) => (
            <label key={f} className="inline-flex items-center gap-1.5">
              <input type="radio" name="code-file" checked={file === f} onChange={() => setFile(f)} className="accent-[var(--color-accent)]" />
              <span className="font-mono text-xs">{f === 'component' ? pattern.files.component : pattern.files.styles}</span>
            </label>
          ))}
        </fieldset>
      )}
      {file === 'component' || !hasStyles ? (
        <CodeBlock code={pattern.code} language="tsx" filename={pattern.files.component} />
      ) : (
        <CodeBlock code={pattern.styles} language="css" filename={pattern.files.styles} />
      )}
    </div>
  );
}

export function PatternPage(): JSX.Element {
  const { category = '', slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { getPattern } = usePatterns();
  const { editorMode } = useEditor();
  const pattern = getPattern(category, slug);
  const tabParam = params.get('tab');
  const tab: TabId = isTab(tabParam) ? tabParam : 'preview';
  const version: DemoVersion = params.get('demo') === 'before' ? 'before' : 'after';

  /** Updates one query param and keeps the rest, so tab and demo version deep-link together. */
  const setParam = (key: 'tab' | 'demo', value: string | null): void =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (pattern) document.title = `${pattern.title} · Solving UX`;
    return () => {
      document.title = 'Solving UX · Pattern Library';
    };
  }, [pattern]);

  if (!pattern) return <NotFoundPage what="pattern" />;
  const categoryLabel = CATEGORIES.find((c) => c.id === pattern.category)?.label ?? pattern.category;

  return (
    <article className="grid gap-8">
      <header className="grid gap-3">
        <nav aria-label="Breadcrumb">
          <ol className="m-0 flex list-none gap-1.5 p-0 font-mono text-xs uppercase tracking-wider text-muted">
            <li>
              <Link to="/" className="text-muted underline-offset-2 hover:underline">Patterns</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to={`/?category=${pattern.category}`} className="text-muted underline-offset-2 hover:underline">{categoryLabel}</Link>
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="m-0 text-3xl font-semibold tracking-tight">{pattern.title}</h1>
          {editorMode && (
            <Link to={`/editor/${encodeURIComponent(pattern.id)}`} className="rounded border border-[var(--color-editor)] px-3 py-1.5 text-sm font-medium text-ink">
              Edit pattern
            </Link>
          )}
        </div>
        <p className="m-0 max-w-[70ch] text-base leading-relaxed text-muted">{pattern.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <WcagBadge level={pattern.wcagLevel} />
          <SourceBadges apps={pattern.sourceApps} />
          <StatusBadge status={pattern.status} />
          <span>
            Updated <time dateTime={pattern.lastUpdated}>{pattern.lastUpdated}</time> by {pattern.author}
          </span>
        </div>
      </header>

      <AuditSummary pattern={pattern} />

      <Tabs<TabId>
        label="Pattern details"
        selected={tab}
        onSelect={(id) => setParam('tab', id === 'preview' ? null : id)}
        tabs={[
          { id: 'preview', label: 'Preview', panel: <Preview pattern={pattern} version={version} onVersionChange={(v) => setParam('demo', v === 'before' ? 'before' : null)} /> },
          { id: 'code', label: 'Code', panel: <CodeTab pattern={pattern} /> },
          { id: 'tests', label: 'Tests', panel: <CodeBlock code={pattern.testCode} language="tsx" filename={pattern.files.test} /> },
          { id: 'accessibility', label: 'Accessibility', panel: <AccessibilityPanel notes={pattern.accessibilityNotes} level={pattern.wcagLevel} /> },
        ]}
      />
    </article>
  );
}
