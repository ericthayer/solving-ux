import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { basePath } from '../appConfig';
import { ExportPanel } from '../components/worksheet/ExportPanel';
import { FindingForm } from '../components/worksheet/FindingForm';
import type { FindingFormHandle } from '../components/worksheet/FindingForm';
import { FindingList, findingHeadingId } from '../components/worksheet/FindingList';
import { usePatterns } from '../context/PatternContext';
import { useAuditWorksheet } from '../hooks/useAuditWorksheet';
import { ConfirmDialog } from '../patterns/modals/confirm-dialog/ConfirmDialog';
import { EmptyState } from '../patterns/empty-states/empty-state/EmptyState';
import { useToast } from '../patterns/notifications/toast-stack/ToastStack';
import { EMPTY_DRAFT } from '../types/worksheet';
import type { Finding, FindingDraft } from '../types/worksheet';
import { markdownFilename, sortFindings, worksheetToMarkdown } from '../utils/worksheet';

const today = (): string => new Date().toISOString().slice(0, 10);

function toDraft({ id: _id, createdAt: _createdAt, ...draft }: Finding): FindingDraft {
  return draft;
}

export function WorksheetPage(): JSX.Element {
  const { patterns } = usePatterns();
  const { notify } = useToast();
  const { sheet, persisted, setMeta, add, update, remove, restore, clear } = useAuditWorksheet();
  const [params] = useSearchParams();
  const [editing, setEditing] = useState<Finding | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const formRef = useRef<FindingFormHandle>(null);
  const focusAfterEdit = useRef<string | null>(null);

  const published = useMemo(() => patterns.filter((p) => p.status === 'published'), [patterns]);
  const findings = useMemo(() => sortFindings(sheet.findings), [sheet.findings]);
  const date = today();
  const markdown = useMemo(
    () => worksheetToMarkdown(sheet, { patterns: published, baseUrl: `${window.location.origin}${basePath}`, date }),
    [sheet, published, date],
  );

  // ?pattern=<id> starts a finding already linked to that pattern and its category.
  const linked = published.find((p) => p.id === params.get('pattern'));
  const addInitial: FindingDraft = linked ? { ...EMPTY_DRAFT, patternId: linked.id, category: linked.category } : EMPTY_DRAFT;

  useEffect(() => {
    if (!focusAfterEdit.current) return;
    document.getElementById(findingHeadingId(focusAfterEdit.current))?.focus();
    focusAfterEdit.current = null;
  });

  const count = (n: number): string => `${n} ${n === 1 ? 'finding' : 'findings'} logged.`;

  const handleAdd = (draft: FindingDraft): void => {
    add(draft);
    setAnnouncement(`Finding added. ${count(sheet.findings.length + 1)}`);
  };

  const handleSave = (draft: FindingDraft): void => {
    if (!editing) return;
    update(editing.id, draft);
    focusAfterEdit.current = editing.id;
    setEditing(null);
    setAnnouncement('Finding updated.');
  };

  const handleEdit = (finding: Finding): void => {
    setEditing(finding);
    requestAnimationFrame(() => formRef.current?.focusFirstField());
  };

  const handleDelete = (finding: Finding): void => {
    const removed = remove(finding.id);
    if (!removed) return;
    if (editing?.id === finding.id) setEditing(null);
    formRef.current?.focusFirstField();
    notify({
      tone: 'info',
      title: 'Finding deleted',
      description: removed.finding.title,
      action: { label: 'Undo', onClick: () => restore(removed.finding, removed.index) },
    });
  };

  const editIndex = editing ? findings.findIndex((f) => f.id === editing.id) + 1 : 0;

  return (
    <div className="grid gap-8">
      <header className="grid gap-4 border-b border-line pb-8">
        <p className="m-0 font-mono text-xs uppercase tracking-wider text-accent">Practice</p>
        <h1 className="m-0 max-w-[22ch] text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">Audit your own app.</h1>
        <p className="m-0 max-w-[62ch] text-base leading-relaxed text-muted">
          Walk one real flow in a product you work on. Log every UX and accessibility failure you hit, rate how bad it is, and link the pattern
          that solves it. Export the result as Markdown for a ticket, a PR, or your team wiki.
        </p>
        <fieldset className="m-0 grid max-w-2xl gap-4 border-0 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <legend className="sr-only">Audit details</legend>
          <div className="grid gap-1.5">
            <label htmlFor="audit-app" className="text-sm font-medium">
              App or flow audited
            </label>
            <input
              id="audit-app"
              value={sheet.appName}
              onChange={(e) => setMeta({ appName: e.target.value })}
              className="h-9 rounded border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="audit-auditor" className="text-sm font-medium">
              Auditor
            </label>
            <input
              id="audit-auditor"
              value={sheet.auditor}
              onChange={(e) => setMeta({ auditor: e.target.value })}
              autoComplete="name"
              className="h-9 rounded border border-line bg-surface px-3 text-sm"
            />
          </div>
        </fieldset>
        <p className="m-0 text-xs text-muted">
          {persisted
            ? 'Saved in this browser only. Nothing is sent to a server.'
            : 'This browser is blocking storage, so findings will be lost when you close the tab. Export before you leave.'}
        </p>
      </header>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <div>
          {editing ? (
            <FindingForm
              key={editing.id}
              ref={formRef}
              mode="edit"
              heading={`Edit finding ${editIndex}`}
              initial={toDraft(editing)}
              patterns={published}
              onSubmit={handleSave}
              onCancel={() => {
                focusAfterEdit.current = editing.id;
                setEditing(null);
              }}
            />
          ) : (
            <FindingForm key={`add-${linked?.id ?? ''}`} ref={formRef} mode="add" heading="Log a finding" initial={addInitial} patterns={published} onSubmit={handleAdd} />
          )}
        </div>

        <section aria-labelledby="findings-heading" className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="findings-heading" className="m-0 text-lg font-semibold">
              Findings <span className="font-mono text-base font-normal text-muted">{findings.length}</span>
            </h2>
            {findings.length > 0 && (
              <button type="button" onClick={() => setConfirmClear(true)} className="text-sm font-medium text-danger underline underline-offset-2">
                Clear worksheet
              </button>
            )}
          </div>
          <p role="status" className="sr-only">
            {announcement}
          </p>
          {findings.length === 0 ? (
            <EmptyState
              variant="first-use"
              headingLevel={3}
              title="No findings yet"
              description="Pick one task a real user does every week and try to finish it with only a keyboard. Log the first thing that gets in your way."
              primaryAction={{ label: 'Log your first finding', onClick: () => formRef.current?.focusFirstField() }}
            />
          ) : (
            <>
              <FindingList findings={findings} patterns={published} editingId={editing?.id ?? null} onEdit={handleEdit} onDelete={handleDelete} />
              <ExportPanel markdown={markdown} filename={markdownFilename(sheet.appName, date)} findingCount={findings.length} />
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title="Clear the worksheet?"
        description="This removes every finding and the audit details from this browser. Export first if you want to keep them."
        consequences={[count(findings.length).replace('logged', 'will be deleted')]}
        confirmLabel="Clear worksheet"
        onConfirm={() => {
          clear();
          setConfirmClear(false);
          setEditing(null);
          setAnnouncement('Worksheet cleared.');
        }}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}
