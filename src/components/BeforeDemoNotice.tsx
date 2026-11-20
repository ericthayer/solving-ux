import type { Failure } from '../types/failure';

/** Warns that the Before demo is broken on purpose and tells learners how to surface each failure. */
export function BeforeDemoNotice({ failures }: { failures: Failure[] }): JSX.Element {
  const revealed = failures.filter((f) => f.target.revealedBy);
  return (
    <div className="grid gap-2 rounded-md border border-danger bg-[var(--sux-danger-soft)] p-4 text-sm">
      <p className="m-0">
        <span className="font-mono text-xs uppercase tracking-wider text-danger">Deliberately broken</span>
        <span className="block pt-1">
          This version reproduces the {failures.length} failures in the Before card. Try it with a keyboard and a screen reader; it is built to fail
          both.
        </span>
      </p>
      {revealed.length > 0 && (
        <details>
          <summary className="cursor-pointer font-medium">How to trigger the hidden failures</summary>
          <ul className="m-0 mt-2 grid gap-1 pl-5">
            {revealed.map((f) => (
              <li key={f.id}>
                <span className="font-medium">{f.target.revealedBy}:</span> {f.description}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
