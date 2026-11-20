import type { CodeAnnotation } from '../types/walkthrough';
import { bulkActionsWalkthrough } from './data-table/bulk-actions/walkthrough';
import { nestedNavWalkthrough } from './navigation/nested-nav/walkthrough';
import { wizardValidationWalkthrough } from './forms/wizard-validation/walkthrough';
import { widgetGridWalkthrough } from './dashboard/widget-grid/walkthrough';
import { confirmDialogWalkthrough } from './modals/confirm-dialog/walkthrough';
import { emptyStateWalkthrough } from './empty-states/empty-state/walkthrough';
import { toastStackWalkthrough } from './notifications/toast-stack/walkthrough';
import { typeaheadWalkthrough } from './search-filters/typeahead/walkthrough';

/** Annotated walkthroughs keyed by "category/slug". Kept apart from the registry so patterns without one still build. */
export const walkthroughs: Record<string, CodeAnnotation[]> = {
  'data-table/bulk-actions': bulkActionsWalkthrough,
  'navigation/nested-nav': nestedNavWalkthrough,
  'forms/wizard-validation': wizardValidationWalkthrough,
  'dashboard/widget-grid': widgetGridWalkthrough,
  'modals/confirm-dialog': confirmDialogWalkthrough,
  'empty-states/empty-state': emptyStateWalkthrough,
  'notifications/toast-stack': toastStackWalkthrough,
  'search-filters/typeahead': typeaheadWalkthrough,
};

export const getWalkthrough = (category: string, slug: string): CodeAnnotation[] => walkthroughs[`${category}/${slug}`] ?? [];
