import type { Pattern } from '../types/pattern';

/** The audit record: what broke, what it looked like, and why the fix works. */
export function AuditSummary({ pattern }: { pattern: Pattern }): JSX.Element {
  return (
    <section aria-labelledby="audit-heading" className="grid gap-4">
      <h2 id="audit-heading" className="sr-only">
        Audit
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-line bg-surface p-5" aria-labelledby="problem-heading">
          <p className="m-0 font-mono text-xs uppercase tracking-wider text-danger">Problem</p>
          <h3 id="problem-heading" className="mb-2 mt-1 text-base font-semibold">
            What we observed
          </h3>
          <p className="m-0 text-sm leading-relaxed text-muted">{pattern.problemStatement}</p>
        </article>
        <article className="rounded-md border border-dashed border-line bg-sunken p-5" aria-labelledby="before-heading">
          <p className="m-0 font-mono text-xs uppercase tracking-wider text-muted">Before</p>
          <h3 id="before-heading" className="mb-2 mt-1 text-base font-semibold">
            {pattern.beforeState.summary}
          </h3>
          <ul className="m-0 grid gap-1.5 pl-0 text-sm">
            {pattern.beforeState.failures.map((failure) => (
              <li key={failure.id} className="flex gap-2">
                <span aria-hidden="true" className="mt-[0.4rem] h-1.5 w-1.5 flex-none rounded-full bg-danger" />
                <span>{failure.description}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <article className="rounded-md border border-line border-l-4 border-l-accent bg-surface p-5" aria-labelledby="rationale-heading">
        <p className="m-0 font-mono text-xs uppercase tracking-wider text-accent">After</p>
        <h3 id="rationale-heading" className="mb-2 mt-1 text-base font-semibold">
          Design rationale
        </h3>
        <p className="m-0 max-w-[75ch] text-sm leading-relaxed">{pattern.designRationale}</p>
      </article>
    </section>
  );
}
