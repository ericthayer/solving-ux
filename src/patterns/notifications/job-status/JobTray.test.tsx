import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { JobProvider, JobTray, useJobs } from './JobTray';
import type { JobContext, JobSpec } from './JobTray';

expect.extend(toHaveNoViolations);

/** A job the test drives by hand: call step() to advance, finish() to resolve. */
function manualJob(title: string, total?: number) {
  let ctx: JobContext | null = null;
  let resolve: (value: { href?: string; label?: string } | void) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const spec: JobSpec = {
    title,
    total,
    unit: 'rows',
    run: (c) =>
      new Promise((res, rej) => {
        ctx = c;
        resolve = res;
        reject = rej;
      }),
  };
  return {
    spec,
    ctx: () => ctx,
    step: (done: number) => act(() => ctx?.progress(done)),
    fail: (item: string, reason: string) => act(() => ctx?.fail(item, reason)),
    finish: async (value?: { href?: string; label?: string }) => act(async () => resolve(value)),
    crash: async (message: string) => act(async () => reject(new Error(message))),
  };
}

function Starter({ specs }: { specs: JobSpec[] }): JSX.Element {
  const { start } = useJobs();
  return (
    <>
      {specs.map((spec) => (
        <button key={spec.title} type="button" onClick={() => start(spec)}>
          Start {spec.title}
        </button>
      ))}
    </>
  );
}

function setup(specs: JobSpec[], maxConcurrent = 2) {
  const user = userEvent.setup();
  const utils = render(
    <JobProvider maxConcurrent={maxConcurrent}>
      <Starter specs={specs} />
      <JobTray />
    </JobProvider>,
  );
  const tray = () => screen.getByRole('region', { name: 'Background jobs' });
  return { ...utils, user, tray };
}

describe('JobTray', () => {
  it('shows a running job with a labelled determinate progress bar and announces the start politely', async () => {
    const job = manualJob('Customer export', 120);
    const { user, tray } = setup([job.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Customer export' }));
    job.step(30);
    const bar = within(tray()).getByRole('progressbar', { name: 'Customer export' });
    expect(bar).toHaveAttribute('value', '30');
    expect(bar).toHaveAttribute('max', '120');
    expect(bar).toHaveAccessibleDescription('30 of 120 rows (25%)');
    expect(within(tray()).getByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Customer export started.');
  });

  it('announces completion once and offers the download', async () => {
    const job = manualJob('Customer export', 4);
    const { user, tray } = setup([job.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Customer export' }));
    job.step(4);
    expect(screen.getByRole('status')).toHaveTextContent('started');
    await job.finish({ href: 'blob:file', label: 'customers.csv' });
    expect(screen.getByRole('status')).toHaveTextContent('Customer export finished. customers.csv is ready.');
    expect(within(tray()).getByRole('link', { name: 'Download customers.csv' })).toHaveAttribute('href', 'blob:file');
    expect(within(tray()).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('reports a partial failure with an itemized list', async () => {
    const job = manualJob('Price import', 10);
    const { user, tray } = setup([job.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Price import' }));
    job.fail('Row 3', 'Unit price is not a number.');
    job.step(10);
    await job.finish();
    expect(within(tray()).getByText('Done with problems')).toBeInTheDocument();
    expect(within(tray()).getByText('9 of 10 rows succeeded. 1 failed.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Price import finished with 1 problem.');
    await user.click(within(tray()).getByText('Review 1 failed rows'));
    expect(within(tray()).getByText(/Unit price is not a number/)).toBeVisible();
  });

  it('asks before cancelling, returns focus on Keep running, and aborts on Stop job', async () => {
    const job = manualJob('Customer export', 100);
    const { user, tray } = setup([job.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Customer export' }));
    job.step(40);
    await user.click(within(tray()).getByRole('button', { name: 'Cancel Customer export' }));
    expect(within(tray()).getByRole('group', { name: /Stop Customer export\? The 40 rows already processed stay processed/ })).toBeInTheDocument();
    expect(within(tray()).getByRole('button', { name: 'Stop job' })).toHaveFocus();
    await user.click(within(tray()).getByRole('button', { name: 'Keep running' }));
    await act(async () => new Promise((r) => requestAnimationFrame(() => r(undefined))));
    expect(within(tray()).getByRole('button', { name: 'Cancel Customer export' })).toHaveFocus();
    expect(job.ctx()?.signal.aborted).toBe(false);

    await user.click(within(tray()).getByRole('button', { name: 'Cancel Customer export' }));
    await user.click(within(tray()).getByRole('button', { name: 'Stop job' }));
    expect(job.ctx()?.signal.aborted).toBe(true);
    expect(within(tray()).getByText('Cancelled')).toBeInTheDocument();
    expect(within(tray()).getByText('Stopped at 40 of 100 rows. Work already done is kept.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Customer export cancelled.');
  });

  it('queues jobs beyond the concurrency cap and starts them when a slot frees (edge case)', async () => {
    const a = manualJob('Job A', 1);
    const b = manualJob('Job B', 1);
    const { user, tray } = setup([a.spec, b.spec], 1);
    await user.click(screen.getByRole('button', { name: 'Start Job A' }));
    await user.click(screen.getByRole('button', { name: 'Start Job B' }));
    expect(within(tray()).getByText('Waiting for another job to finish.')).toBeInTheDocument();
    expect(b.ctx()).toBeNull();
    await a.finish();
    expect(b.ctx()).not.toBeNull();
    expect(within(tray()).getByRole('progressbar', { name: 'Job B' })).toBeInTheDocument();
  });

  it('shows an indeterminate bar when the total is unknown and reports thrown errors as Failed (edge case)', async () => {
    const job = manualJob('Index rebuild');
    const { user, tray } = setup([job.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Index rebuild' }));
    job.step(250);
    const bar = within(tray()).getByRole('progressbar', { name: 'Index rebuild' });
    expect(bar).not.toHaveAttribute('value');
    expect(within(tray()).getByText('250 rows so far. Total not known yet.')).toBeInTheDocument();
    await job.crash('Search service unavailable.');
    expect(within(tray()).getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Index rebuild failed. Search service unavailable.');
  });

  it('collapses to hide moving bars and clears finished jobs (edge case)', async () => {
    const done = manualJob('Done job', 1);
    const running = manualJob('Running job', 5);
    const { user, tray } = setup([done.spec, running.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Done job' }));
    await user.click(screen.getByRole('button', { name: 'Start Running job' }));
    await done.finish();
    const toggle = within(tray()).getByRole('button', { name: 'Background jobs: 1 running' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(tray()).queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(toggle);
    await user.click(within(tray()).getByRole('button', { name: 'Clear finished' }));
    expect(within(tray()).queryByText('Done job')).not.toBeInTheDocument();
    expect(within(tray()).getByText('Running job')).toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it('throws a clear error when used outside the provider (edge case)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<JobTray />)).toThrow('useJobs must be used inside <JobProvider>.');
    spy.mockRestore();
  });

  it('has no axe violations with running, partial, and confirming jobs', async () => {
    const a = manualJob('Customer export', 10);
    const b = manualJob('Price import', 10);
    const { user, tray, container } = setup([a.spec, b.spec]);
    await user.click(screen.getByRole('button', { name: 'Start Customer export' }));
    await user.click(screen.getByRole('button', { name: 'Start Price import' }));
    a.step(5);
    b.fail('Row 2', 'Missing code.');
    b.step(10);
    await b.finish();
    await user.click(within(tray()).getByRole('button', { name: 'Cancel Customer export' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
