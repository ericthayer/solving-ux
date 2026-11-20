import { useState } from 'react';
import { CopyButton } from '../CopyButton';

type ExportPanelProps = { markdown: string; filename: string; findingCount: number };

type DownloadState = { status: 'idle' } | { status: 'done' } | { status: 'error'; message: string };

export function ExportPanel({ markdown, filename, findingCount }: ExportPanelProps): JSX.Element {
  const [download, setDownload] = useState<DownloadState>({ status: 'idle' });

  const save = async (): Promise<void> => {
    try {
      const { saveAs } = await import('file-saver');
      saveAs(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), filename);
      setDownload({ status: 'done' });
    } catch (error) {
      setDownload({ status: 'error', message: error instanceof Error ? error.message : 'Download failed.' });
    }
  };

  return (
    <section aria-labelledby="export-heading" className="grid gap-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id="export-heading" className="m-0 text-lg font-semibold">
            Export
          </h2>
          <p className="m-0 text-xs text-muted">
            {findingCount} {findingCount === 1 ? 'finding' : 'findings'}, sorted by severity, as <span className="font-mono">{filename}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={markdown} label="Copy Markdown" />
          <button type="button" onClick={() => void save()} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            Download .md
          </button>
        </div>
      </div>
      <p role="status" className={download.status === 'error' ? 'm-0 text-sm text-danger' : 'sr-only'}>
        {download.status === 'done' ? `Downloaded ${filename}.` : download.status === 'error' ? `Download failed: ${download.message} Use Copy Markdown instead.` : ''}
      </p>
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-accent underline-offset-2 hover:underline">Preview Markdown</summary>
        <pre
          tabIndex={0}
          aria-label="Markdown preview"
          className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded border border-line bg-sunken p-3 font-mono text-xs leading-relaxed"
        >
          {markdown}
        </pre>
      </details>
    </section>
  );
}
