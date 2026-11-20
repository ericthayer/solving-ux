import { useEffect, useRef, useState } from 'react';
import { StatusBadge, StatusLegend } from './StatusBadge';
import type { StatusLegendEntry, StatusTone } from './StatusBadge';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

type Job = { id: string; name: string; tone: StatusTone; label: string; detail?: string };
type View = 'color' | 'grayscale' | 'deuteranopia';

const JOBS: Job[] = [
  { id: 'export', name: 'Nightly ledger export', tone: 'success', label: 'Succeeded' },
  { id: 'sync', name: 'Invoice sync', tone: 'error', label: 'Failed', detail: 'Timed out after 30 min' },
  { id: 'import', name: 'Vendor file import', tone: 'warning', label: 'Needs review', detail: '2 rows skipped' },
  { id: 'refresh', name: 'Rate table refresh', tone: 'pending', label: 'Running' },
  { id: 'report', name: 'Weekly report delivery', tone: 'info', label: 'Scheduled', detail: 'Starts Monday 6:00 AM' },
  { id: 'archive', name: 'Archive cleanup', tone: 'neutral', label: 'Paused' },
];

const LEGEND: StatusLegendEntry[] = [
  { tone: 'success', label: 'Succeeded', meaning: 'Finished with no errors.' },
  { tone: 'error', label: 'Failed', meaning: 'Stopped. Rerun or open the log.' },
  { tone: 'warning', label: 'Needs review', meaning: 'Finished, but some records were skipped.' },
  { tone: 'pending', label: 'Running', meaning: 'In progress now.' },
  { tone: 'info', label: 'Scheduled', meaning: 'Queued for a future start time.' },
  { tone: 'neutral', label: 'Paused', meaning: 'Turned off until someone resumes it.' },
];

const VIEWS: Record<View, string> = { color: 'Full color', grayscale: 'Grayscale', deuteranopia: 'Red-green color blindness' };
const VIEW_CLASS: Record<View, string | undefined> = { color: undefined, grayscale: demo.simGrayscale, deuteranopia: demo.simDeuteranopia };
const RUN_MS = 1500;

export default function StatusIndicatorDemo(): JSX.Element {
  const { text } = useStressTest(['longText']);
  const [jobs, setJobs] = useState(JOBS);
  const [view, setView] = useState<View>('color');
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setJob = (id: string, next: Pick<Job, 'tone' | 'label' | 'detail'>): void => {
    setJobs((list) => list.map((job) => (job.id === id ? { ...job, ...next } : job)));
    const name = JOBS.find((job) => job.id === id)?.name ?? '';
    setAnnouncement(`${name}: ${next.label}`);
  };

  const rerun = (): void => {
    window.clearTimeout(timer.current);
    setJob('sync', { tone: 'pending', label: 'Running', detail: undefined });
    timer.current = window.setTimeout(() => setJob('sync', { tone: 'success', label: 'Succeeded', detail: '1,204 invoices' }), RUN_MS);
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
                    <StatusBadge tone={job.tone} label={text(job.label)} detail={job.detail && text(job.detail)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <StatusLegend caption="Status key" entries={LEGEND} />
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
