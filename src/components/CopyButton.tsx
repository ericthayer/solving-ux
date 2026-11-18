import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

type CopyButtonProps = { text: string; label: string; className?: string };

export function CopyButton({ text, label, className = '' }: CopyButtonProps): JSX.Element {
  const { status, copy } = useCopyToClipboard();
  const visible = status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy';
  return (
    <>
      <button
        type="button"
        onClick={() => void copy(text)}
        aria-label={label}
        className={`inline-flex min-h-[2rem] items-center gap-1.5 rounded border border-line bg-surface px-2.5 text-xs font-medium text-ink hover:border-ink ${className}`}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          {status === 'copied' ? (
            <path d="M3 8.5 6.5 12 13 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M5 5V2.5h8.5V11H11M2.5 5H11v8.5H2.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          )}
        </svg>
        <span aria-hidden="true">{visible}</span>
      </button>
      <span role="status" className="sr-only">
        {status === 'copied' ? `${label.replace(/^Copy /, '')} copied to clipboard.` : status === 'error' ? 'Copy failed. Select the text and copy it manually.' : ''}
      </span>
    </>
  );
}
