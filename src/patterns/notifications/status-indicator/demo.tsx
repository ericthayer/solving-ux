import { useEffect, useRef, useState } from 'react';
import { StatusLegend, defineStatusVocabulary } from './StatusBadge';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

/** Product config: one status vocabulary, defined once, used by every screen. */
const jobStatus = defineStatusVocabulary({
  succeeded: { tone: 'success', label: 'Succeeded', meaning: 'Finished with no errors.' },
  failed: { tone: 'error', label: 'Failed', meaning: 'Stopped. Rerun or open the log.' },
  review: { tone: 'warning', label: 'Needs review', meaning: 'Finished, but some records were skipped.' },
  running: { tone: 'pending', label: 'Running', meaning: 'In progress now.' },
  scheduled: { tone: 'info', label: 'Scheduled', meaning: 'Queued for a future start time.' },
  paused: { tone: 'neutral', label: 'Paused', meaning: 'Turned off until someone resumes it.' },
});

type JobStatus = keyof typeof jobStatus.definitions;
type Job = { id: string; name: string; status: JobStatus; detail?: string };
type View = 'color' | 'grayscale' | 'deuteranopia';

const JOBS: Job[] = [
  { id: 'export', name: 'Nightly ledger export', status: 'succeeded' },
  { id: 'sync', name: 'Invoice sync', status: 'failed', detail: 'Timed out after 30 min' },
  { id: 'import', name: 'Vendor file import', status: 'review', detail: '2 rows skipped' },
  { id: 'refresh', name: 'Rate table refresh', status: 'running' },
  { id: 'report', name: 'Weekly report delivery', status: 'scheduled', detail: 'Starts Monday 6:00 AM' },
  { id: 'archive', name: 'Archive cleanup', status: 'paused' },
];

const VIEWS: Record<View, string> = { color: 'Full color', grayscale: 'Grayscale', deuteranopia: 'Red-green color blindness' };
const VIEW_CLASS: Record<View, string | undefined> = { color: undefined, grayscale: demo.simGrayscale, deuteranopia: demo.simDeuteranopia };
const RUN_MS = 1500;

export default function StatusIndicatorDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [jobs, setJobs] = useState(JOBS);
  const [view, setView] = useState<View>('color');
  const [compact, setCompact] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setJob = (id: string, status: JobStatus, detail?: string): void => {
    setJobs((list) => list.map((job) => (job.id === id ? { ...job, status, detail } : job)));
    const name = JOBS.find((job) => job.id === id)?.name ?? '';
    setAnnouncement(`${name}: ${jobStatus.definitions[status].label}`);
  };

  const rerun = (): void => {
    window.clearTimeout(timer.current);
    setJob('sync', 'running');
    timer.current = window.setTimeout(() => setJob('sync', 'succeeded', '1,204 invoices'), RUN_MS);
  };

  return (
    <div className={demo.stack}>
      <fieldset className={demo.row}>
        <legend className={demo.log}>Preview as (demo control)</legend>
        {(Object.keys(VIEWS) as View[]).map((key) => (
          <label key={key} className={demo.row}>
            <input type="radio" name="status-view" checked={view === key} onChange={() => setView(key)} />
            {VIEWS[key]}
          </label>
        ))}
      </fieldset>
      <label className={demo.row}>
        <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
        Compact (icon only, label kept for screen readers)
      </label>

      <div className={`${demo.stack} ${VIEW_CLASS[view] ?? ''}`}>
        <div className={demo.tableScroll}>
          <table className={demo.table}>
            <caption className={demo.panelTitle}>Scheduled jobs</caption>
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <th scope="row">{text(job.name)}</th>
                  <td>
                    <jobStatus.Badge status={job.status} detail={job.detail && text(job.detail)} density={compact ? 'compact' : 'default'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StatusLegend caption="Status key" entries={jobStatus.entries} />
      </div>

      <div className={demo.row}>
        <button type="button" className={demo.button} onClick={rerun}>
          Rerun Invoice sync
        </button>
      </div>
      {/* Status changes are announced by name, without moving focus. */}
      <p className={demo.log} role="status">
        {announcement}
      </p>
      <svg width="0" height="0" aria-hidden="true" focusable="false" className={demo.filterDefs}>
        <filter id="sux-sim-deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
        </filter>
      </svg>
    </div>
  );
}
