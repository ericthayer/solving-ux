import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './JobTray.module.css';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'partial' | 'failed' | 'cancelled';

export type JobItemFailure = { item: string; reason: string };

/** Handed to a job's run function. Report progress and per-item failures; stop when signal aborts. */
export type JobContext = {
  signal: AbortSignal;
  progress: (done: number) => void;
  fail: (item: string, reason: string) => void;
};

export type JobResult = { href?: string; label?: string } | void;

export type JobSpec = {
  title: string;
  /** Items to process. Omit when the total is unknown; progress is then indeterminate. */
  total?: number;
  /** Plural noun for items, e.g. "rows". */
  unit?: string;
  run: (ctx: JobContext) => Promise<JobResult>;
};

export type Job = {
  id: string;
  title: string;
  total?: number;
  unit: string;
  status: JobStatus;
  done: number;
  failures: JobItemFailure[];
  result?: { href?: string; label?: string };
  error?: string;
};

type JobsApi = {
  jobs: Job[];
  start: (spec: JobSpec) => string;
  cancel: (id: string) => void;
  clearFinished: () => void;
  /** Text of the polite live region, rendered by <JobTray>. */
  announcement: string;
};

const JobsContext = createContext<JobsApi | null>(null);

export function useJobs(): JobsApi {
  const api = useContext(JobsContext);
  if (!api) throw new Error('useJobs must be used inside <JobProvider>.');
  return api;
}

const ACTIVE: JobStatus[] = ['queued', 'running'];
export const isActive = (job: Job): boolean => ACTIVE.includes(job.status);

export const STATUS_LABEL: Record<JobStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Done',
  partial: 'Done with problems',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

let counter = 0;

export type JobProviderProps = {
  children: ReactNode;
  /** Jobs allowed to run at once. Extra jobs wait as "Queued". */
  maxConcurrent?: number;
};

/** Mount above the router so jobs keep running when the user changes pages. */
export function JobProvider({ children, maxConcurrent = 2 }: JobProviderProps): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const specs = useRef(new Map<string, JobSpec>());
  const controllers = useRef(new Map<string, AbortController>());

  const patch = useCallback((id: string, change: (job: Job) => Partial<Job>) => {
    setJobs((list) => list.map((job) => (job.id === id ? { ...job, ...change(job) } : job)));
  }, []);

  const start = useCallback((spec: JobSpec): string => {
    counter += 1;
    const id = `job-${counter}`;
    specs.current.set(id, spec);
    setJobs((list) => [...list, { id, title: spec.title, total: spec.total, unit: spec.unit ?? 'items', status: 'queued', done: 0, failures: [] }]);
    setAnnouncement(`${spec.title} started. It runs in the background; you can keep working.`);
    return id;
  }, []);

  const launch = useCallback(
    (id: string) => {
      const spec = specs.current.get(id);
      if (!spec || controllers.current.has(id)) return;
      const controller = new AbortController();
      controllers.current.set(id, controller);
      const failures: JobItemFailure[] = [];
      patch(id, () => ({ status: 'running' }));
      const ctx: JobContext = {
        signal: controller.signal,
        progress: (done) => {
          if (!controller.signal.aborted) patch(id, () => ({ done }));
        },
        fail: (item, reason) => {
          if (controller.signal.aborted) return;
          failures.push({ item, reason });
          patch(id, () => ({ failures: [...failures] }));
        },
      };
      // Completion is announced exactly once, here, never on progress ticks.
      const finish = (status: JobStatus, extra: Partial<Job>, message: string): void => {
        controllers.current.delete(id);
        specs.current.delete(id);
        patch(id, () => ({ status, ...extra }));
        setAnnouncement(message);
      };
      spec.run(ctx).then(
        (result) => {
          if (controller.signal.aborted) return;
          const n = failures.length;
          if (n === 0) finish('succeeded', { result: result ?? undefined }, `${spec.title} finished.${result?.label ? ` ${result.label} is ready.` : ''}`);
          else if (spec.total !== undefined && n >= spec.total) finish('failed', { error: `All ${spec.total} ${spec.unit ?? 'items'} failed.` }, `${spec.title} failed. All ${spec.total} ${spec.unit ?? 'items'} failed.`);
          else finish('partial', { result: result ?? undefined }, `${spec.title} finished with ${n} ${n === 1 ? 'problem' : 'problems'}. Open the job tray to review them.`);
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const reason = error instanceof Error ? error.message : 'Unknown error.';
          finish('failed', { error: reason }, `${spec.title} failed. ${reason}`);
        },
      );
    },
    [patch],
  );

  // Start queued jobs while slots are free.
  useEffect(() => {
    const running = jobs.filter((j) => j.status === 'running').length;
    jobs
      .filter((j) => j.status === 'queued')
      .slice(0, Math.max(0, maxConcurrent - running))
      .forEach((j) => launch(j.id));
  }, [jobs, maxConcurrent, launch]);

  const cancel = useCallback((id: string) => {
    const title = specs.current.get(id)?.title;
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    specs.current.delete(id);
    setJobs((list) => list.map((j) => (j.id === id && isActive(j) ? { ...j, status: 'cancelled' } : j)));
    if (title) setAnnouncement(`${title} cancelled.`);
  }, []);

  const clearFinished = useCallback(() => setJobs((list) => list.filter(isActive)), []);

  useEffect(() => () => controllers.current.forEach((c) => c.abort()), []);

  const api = useMemo(() => ({ jobs, start, cancel, clearFinished, announcement }), [jobs, start, cancel, clearFinished, announcement]);
  return <JobsContext.Provider value={api}>{children}</JobsContext.Provider>;
}

function detailText(job: Job): string {
  const count = job.total !== undefined ? `${job.done} of ${job.total} ${job.unit}` : `${job.done} ${job.unit}`;
  switch (job.status) {
    case 'queued':
      return 'Waiting for another job to finish.';
    case 'running':
      return job.total !== undefined ? `${count} (${Math.round((job.done / Math.max(job.total, 1)) * 100)}%)` : `${job.done} ${job.unit} so far. Total not known yet.`;
    case 'succeeded':
      return `${count}.`;
    case 'partial':
      return `${job.done - job.failures.length} of ${job.total ?? job.done} ${job.unit} succeeded. ${job.failures.length} failed.`;
    case 'failed':
      return job.error ?? 'The job failed.';
    case 'cancelled':
      return `Stopped at ${count}. Work already done is kept.`;
  }
}

/** Place in persistent app chrome (header or footer), not inside a page. */
export function JobTray({ label = 'Background jobs' }: { label?: string }): JSX.Element | null {
  const { jobs, clearFinished, announcement } = useJobs();
  const [open, setOpen] = useState(true);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const active = jobs.filter(isActive).length;
  const summary = active > 0 ? `${active} running` : `${jobs.length} finished`;

  return (
    <section className={styles.tray} aria-label={label}>
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
      {jobs.length > 0 && (
        <>
          <div className={styles.bar}>
            <button ref={toggleRef} type="button" className={styles.toggle} aria-expanded={open} aria-controls={listId} onClick={() => setOpen((v) => !v)}>
              {label}: {summary}
            </button>
            {jobs.length > active && (
              <button
                type="button"
                className={styles.link}
                onClick={() => {
                  clearFinished();
                  toggleRef.current?.focus();
                }}
              >
                Clear finished
              </button>
            )}
          </div>
          <ul id={listId} className={styles.list} hidden={!open}>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function JobRow({ job }: { job: Job }): JSX.Element {
  const { cancel } = useJobs();
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const titleId = `${job.id}-title`;
  const detailId = `${job.id}-detail`;
  const active = isActive(job);

  useEffect(() => {
    if (confirming) stopRef.current?.focus();
  }, [confirming]);

  const keepRunning = (): void => {
    setConfirming(false);
    requestAnimationFrame(() => cancelRef.current?.focus());
  };

  return (
    <li className={styles.job} data-status={job.status} aria-labelledby={titleId}>
      <div className={styles.head}>
        <p id={titleId} className={styles.title}>
          {job.title}
        </p>
        <span className={styles.badge}>{STATUS_LABEL[job.status]}</span>
      </div>
      {job.status === 'running' && (
        <progress className={styles.progress} aria-labelledby={titleId} aria-describedby={detailId} max={job.total} value={job.total !== undefined ? job.done : undefined} />
      )}
      <p id={detailId} className={styles.detail}>
        {detailText(job)}
      </p>
      {job.failures.length > 0 && !active && (
        <details className={styles.report}>
          <summary>
            Review {job.failures.length} failed {job.unit}
          </summary>
          <ul className={styles.failures}>
            {job.failures.map((f) => (
              <li key={f.item}>
                <strong>{f.item}:</strong> {f.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {job.result?.href && (job.status === 'succeeded' || job.status === 'partial') && (
        <a className={styles.link} href={job.result.href} download>
          Download {job.result.label ?? 'result'}
        </a>
      )}
      {active && !confirming && (
        <button ref={cancelRef} type="button" className={styles.link} aria-label={`Cancel ${job.title}`} onClick={() => setConfirming(true)}>
          Cancel
        </button>
      )}
      {active && confirming && (
        <div role="group" aria-labelledby={`${job.id}-confirm`} className={styles.confirm}>
          <p id={`${job.id}-confirm`} className={styles.detail}>
            Stop {job.title}? {job.done > 0 ? `The ${job.done} ${job.unit} already processed stay processed.` : 'Nothing has been processed yet.'}
          </p>
          <button ref={stopRef} type="button" className={styles.danger} onClick={() => cancel(job.id)}>
            Stop job
          </button>
          <button type="button" className={styles.secondary} onClick={keepRunning}>
            Keep running
          </button>
        </div>
      )}
    </li>
  );
}
