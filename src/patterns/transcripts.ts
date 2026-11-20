import type { ScreenReaderTranscript } from '../types/transcript';
import { catalogTranscripts } from './catalog.generated';

/** Every pattern's before/after screen reader transcript, keyed by pattern id. Built from each folder's transcript.ts. */
export const transcripts: ReadonlyMap<string, ScreenReaderTranscript> = new Map(catalogTranscripts.map((t) => [t.patternId, t]));

export const getTranscript = (patternId: string): ScreenReaderTranscript | undefined => transcripts.get(patternId);
