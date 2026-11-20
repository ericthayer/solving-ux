import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const jobStatusPattern: PatternDefinition = {
  id: 'notifications.job-status',
  slug: 'job-status',
  title: 'Long-running job status',
  summary: 'Provider plus job tray that persists across pages: queued, running with real progress, done with a download, or done with an itemized problem report. Completion is announced once, and cancel asks first.',
  category: 'notifications',
  tags: ['background jobs', 'progress', 'export', 'import', 'live region', 'cancel'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Exports, imports, reports and batch updates take seconds to hours. The audited apps either block the whole screen with a spinner until the job ends, or start the job silently and never report back. Leaving the page cancels the work without warning, and an import that rejects some rows still says "Import complete".',
  beforeState: {
    summary: 'Full-screen spinner for exports, silent background imports, and work lost on navigation.',
    failures: [
      {
        id: 'blocking-spinner',
        description: 'A full-screen overlay blocks the whole app until the export finishes, with no way to keep working or cancel.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'wcag', criterion: '2.2.2' }],
        target: { label: 'Full-screen spinner overlay', revealedBy: 'Click Export customer list' },
      },
      {
        id: 'no-progress',
        description: 'The spinner is a decorative div: no progress role, value, or text, so nobody knows how far along it is and screen readers hear nothing.',
        refs: [{ kind: 'wcag', criterion: '1.3.1' }, { kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Spinner graphic', revealedBy: 'Click Export customer list' },
      },
      {
        id: 'silent-background',
        description: 'The import starts with no indicator and its result is never announced.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Import supplier prices button' },
      },
      {
        id: 'nav-cancels',
        description: 'Going to another page silently cancels any running job.',
        refs: [{ kind: 'wcag', criterion: '3.3.4' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Settings page button' },
      },
      {
        id: 'hidden-partial',
        description: 'The import reports "Import complete" although 3 rows were rejected, and there is no list of which rows or why.',
        refs: [{ kind: 'wcag', criterion: '3.3.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Import complete status text', revealedBy: 'Click Import supplier prices and wait 5 seconds' },
      },
    ],
  },
  designRationale:
    'Jobs belong to the app, not the page. JobProvider sits above the router and JobTray sits in persistent chrome, so changing pages never cancels work; in production the provider would poll a jobs endpoint so a reload rehydrates the tray. Each job shows a native progress element with a real value when the total is known and an indeterminate bar when it is not, plus the same count as text. The tray announces start and finish once each through one persistent polite region, never on every tick, because a job finishing is news but not an emergency. A partial failure is its own state with an itemized list of what failed and why. Cancel asks first, inline, and says what will be kept. The tray collapses, which also hides the animated bars.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'JobProvider.maxConcurrent', type: 'number', required: false, defaultValue: '2', description: 'Jobs running at once. Extra jobs show as Queued and start when a slot frees.' },
    { name: 'JobTray.label', type: 'string', required: false, defaultValue: "'Background jobs'", description: 'Accessible name of the tray region and text of its toggle.' },
    { name: 'useJobs().start', type: '(spec: JobSpec) => string', required: true, description: 'Queues a job and returns its id. JobSpec: { title, total?, unit?, run(ctx) }. run receives { signal, progress(done), fail(item, reason) } and may resolve to { href, label } for a download.' },
    { name: 'useJobs().cancel', type: '(id: string) => void', required: false, description: 'Aborts the job’s signal and marks it Cancelled. The tray asks for confirmation before calling it.' },
    { name: 'useJobs().clearFinished', type: '() => void', required: false, description: 'Removes finished, failed, and cancelled jobs from the tray.' },
  ],
  usage: `// App shell, above the router
<JobProvider>
  <Header />
  <Routes>…</Routes>
  <footer><JobTray /></footer>
</JobProvider>

// Any page
const { start } = useJobs();
start({
  title: 'Customer list export',
  total: rows.length,
  unit: 'rows',
  run: async ({ signal, progress, fail }) => {
    const file = await exportRows(rows, { signal, onProgress: progress, onRowError: fail });
    return { href: file.url, label: 'customers.csv' };
  },
});`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'One persistent role="status" region announces start and finish once each, without moving focus.' },
    { kind: 'wcag', criterion: '1.3.1', level: 'A', title: 'Info and relationships', detail: 'Native <progress> labelled by the job title and described by the "45 of 120 rows" text.' },
    { kind: 'wcag', criterion: '2.2.2', level: 'A', title: 'Pause, stop, hide', detail: 'The tray collapses to hide moving bars, and reduced motion swaps the indeterminate animation for a static stripe.' },
    { kind: 'wcag', criterion: '3.3.4', level: 'AA', title: 'Error prevention', detail: 'Cancel asks for confirmation inline and says which work is kept.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Reach the tray toggle, each job’s Cancel, Download, and problem report.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'Collapse or expand the tray; open the problem report.' },
    { kind: 'keyboard', keys: 'Enter on Cancel', action: 'Focus moves to Stop job; Keep running returns focus to Cancel.' },
    { kind: 'aria', attribute: 'aria-expanded on the tray toggle', detail: 'Says whether the job list is shown.' },
    { kind: 'aria', attribute: 'aria-label="Cancel <title>"', detail: 'Each Cancel button names the job it stops.' },
    { kind: 'aria', attribute: 'aria-labelledby / aria-describedby on <progress>', detail: 'The bar is read as "Customer list export, progress bar, 45%" with the count as its description.' },
    { kind: 'screen-reader', title: 'Job starts', detail: 'Hears "Customer list export started. It runs in the background; you can keep working."' },
    { kind: 'screen-reader', title: 'Job ends with problems', detail: 'Hears once, politely: "Supplier price import finished with 3 problems. Open the job tray to review them."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
