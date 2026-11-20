import { useState } from 'react';
import { JobProvider, JobTray, useJobs } from './JobTray';
import type { JobContext } from './JobTray';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    });
  });

/** Fake server work: processes `total` items in batches, failing the listed item numbers. */
async function simulate(ctx: JobContext, total: number, failAt: number[] = [], stepMs = 250): Promise<void> {
  for (let done = 0; done < total; ) {
    await wait(stepMs, ctx.signal);
    const next = Math.min(total, done + 8);
    for (let n = done + 1; n <= next; n += 1) if (failAt.includes(n)) ctx.fail(`Row ${n}`, n % 2 ? 'Supplier code is missing.' : 'Unit price is not a number.');
    done = next;
    ctx.progress(done);
  }
}

const CSV = 'data:text/csv;charset=utf-8,' + encodeURIComponent('id,name\n1,Sample customer\n');

function Pages(): JSX.Element {
  const { start } = useJobs();
  const { text } = useStressTest(['longText']);
  const [page, setPage] = useState<'reports' | 'settings'>('reports');

  return (
    <div className={demo.stack}>
      <nav aria-label="Demo app" className={demo.row}>
        {(['reports', 'settings'] as const).map((p) => (
          <button key={p} type="button" className={demo.button} aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>
            {p === 'reports' ? 'Reports page' : 'Settings page'}
          </button>
        ))}
      </nav>
      {page === 'reports' ? (
        <section className={`${demo.panel} ${demo.stack}`} aria-labelledby="job-demo-reports">
          <h3 id="job-demo-reports" className={demo.panelTitle}>
            Reports
          </h3>
          <div className={demo.row}>
            <button
              type="button"
              className={demo.button}
              onClick={() =>
                start({
                  title: text('Customer list export'),
                  total: 120,
                  unit: 'rows',
                  run: async (ctx) => {
                    await simulate(ctx, 120);
                    return { href: CSV, label: 'customers.csv' };
                  },
                })
              }
            >
              Export customer list
            </button>
            <button
              type="button"
              className={demo.button}
              onClick={() => start({ title: text('Supplier price import'), total: 96, unit: 'rows', run: (ctx) => simulate(ctx, 96, [14, 51, 88], 300) })}
            >
              Import supplier prices
            </button>
            <button
              type="button"
              className={demo.button}
              onClick={() =>
                start({
                  title: text('Search index rebuild'),
                  unit: 'records',
                  run: async (ctx) => {
                    for (let n = 1; n <= 12; n += 1) {
                      await wait(400, ctx.signal);
                      ctx.progress(n * 250);
                    }
                  },
                })
              }
            >
              Rebuild search index
            </button>
          </div>
        </section>
      ) : (
        <section className={demo.panel} aria-labelledby="job-demo-settings">
          <h3 id="job-demo-settings" className={demo.panelTitle}>
            Settings
          </h3>
          <p className={demo.panelText}>Jobs keep running here. The tray lives in the app frame, not on the page that started them.</p>
        </section>
      )}
      <p className={demo.log}>Two jobs run at once; a third waits as Queued. Switch pages while a job runs, then come back.</p>
    </div>
  );
}

export default function JobStatusDemo(): JSX.Element {
  return (
    <JobProvider maxConcurrent={2}>
      <div className={demo.stack}>
        <Pages />
        <JobTray />
      </div>
    </JobProvider>
  );
}
