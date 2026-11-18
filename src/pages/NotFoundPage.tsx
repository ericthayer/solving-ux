import { Link } from 'react-router-dom';

export function NotFoundPage({ what = 'page' }: { what?: string }): JSX.Element {
  return (
    <div className="grid max-w-xl gap-3">
      <p className="m-0 font-mono text-xs uppercase tracking-wider text-muted">404</p>
      <h1 className="m-0 text-2xl font-semibold">This {what} does not exist</h1>
      <p className="m-0 text-muted">The link may be outdated, or the pattern may still be a draft. Drafts are visible only in Editor Mode.</p>
      <p className="m-0">
        <Link to="/" className="font-medium text-accent underline underline-offset-2">
          Browse all patterns
        </Link>
      </p>
    </div>
  );
}
