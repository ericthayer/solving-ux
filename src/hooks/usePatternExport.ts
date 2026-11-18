import { useCallback, useState } from 'react';
import type { Pattern } from '../types/pattern';
import { buildPatternZip } from '../utils/zipBuilder';
import { serializePattern } from '../utils/jsonExporter';

export type ExportFormat = 'zip' | 'json';
export type ExportState = { status: 'idle' } | { status: 'working'; format: ExportFormat } | { status: 'done'; format: ExportFormat } | { status: 'error'; format: ExportFormat; message: string };

export function usePatternExport(pattern: Pattern | null): { state: ExportState; exportAs: (format: ExportFormat) => Promise<void> } {
  const [state, setState] = useState<ExportState>({ status: 'idle' });

  const exportAs = useCallback(
    async (format: ExportFormat): Promise<void> => {
      if (!pattern) return;
      setState({ status: 'working', format });
      try {
        const { saveAs } = await import('file-saver');
        if (format === 'zip') {
          saveAs(await buildPatternZip(pattern), `${pattern.slug}.zip`);
        } else {
          saveAs(new Blob([serializePattern(pattern)], { type: 'application/json' }), `${pattern.slug}.json`);
        }
        setState({ status: 'done', format });
      } catch (error) {
        setState({ status: 'error', format, message: error instanceof Error ? error.message : 'Export failed.' });
      }
    },
    [pattern],
  );

  return { state, exportAs };
}
