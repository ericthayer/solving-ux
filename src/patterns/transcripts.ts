import type { ScreenReaderTranscript } from '../types/transcript';
import { bulkActionsTranscript } from './data-table/bulk-actions/transcript';
import { nestedNavTranscript } from './navigation/nested-nav/transcript';
import { wizardValidationTranscript } from './forms/wizard-validation/transcript';
import { widgetGridTranscript } from './dashboard/widget-grid/transcript';
import { confirmDialogTranscript } from './modals/confirm-dialog/transcript';
import { emptyStateTranscript } from './empty-states/empty-state/transcript';
import { toastStackTranscript } from './notifications/toast-stack/transcript';
import { typeaheadTranscript } from './search-filters/typeahead/transcript';

/** Every pattern's before/after screen reader transcript, keyed by pattern id. */
export const transcripts: ReadonlyMap<string, ScreenReaderTranscript> = new Map(
  [
    bulkActionsTranscript,
    nestedNavTranscript,
    wizardValidationTranscript,
    widgetGridTranscript,
    confirmDialogTranscript,
    emptyStateTranscript,
    toastStackTranscript,
    typeaheadTranscript,
  ].map((t) => [t.patternId, t]),
);

export const getTranscript = (patternId: string): ScreenReaderTranscript | undefined => transcripts.get(patternId);
