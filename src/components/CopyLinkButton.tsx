import type { Pattern } from '../types/pattern';
import { useDeepLink } from '../hooks/useDeepLink';

export function CopyLinkButton({ pattern }: { pattern?: Pattern | null }): JSX.Element {
  const { copyLink, status } = useDeepLink(pattern);
  return (
    <>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-ink"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M6.5 9.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.9.9M9.5 6.5a3 3 0 0 0-4.2 0L3 8.8a3 3 0 0 0 4.2 4.2l.9-.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {status === 'copied' ? 'Link copied' : 'Copy link'}
      </button>
      <span role="status" className="sr-only">
        {status === 'copied' ? 'Link copied to clipboard.' : status === 'error' ? 'Could not copy the link.' : ''}
      </span>
    </>
  );
}
