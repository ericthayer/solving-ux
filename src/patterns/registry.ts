import type { Pattern, PatternDefinition } from '../types/pattern';
import { patternSources } from './sources.generated';
import { bulkActionsPattern } from './data-table/bulk-actions/pattern';
import { nestedNavPattern } from './navigation/nested-nav/pattern';
import { wizardValidationPattern } from './forms/wizard-validation/pattern';
import { widgetGridPattern } from './dashboard/widget-grid/pattern';
import { confirmDialogPattern } from './modals/confirm-dialog/pattern';
import { emptyStatePattern } from './empty-states/empty-state/pattern';
import { toastStackPattern } from './notifications/toast-stack/pattern';
import { typeaheadPattern } from './search-filters/typeahead/pattern';

/** Joins a hand-written definition with the source text generated from its folder. */
export function buildPattern(definition: PatternDefinition): Pattern {
  const key = `${definition.category}/${definition.slug}`;
  const source = patternSources[key];
  if (!source) throw new Error(`No generated source for pattern "${key}". Run npm run gen.`);
  return {
    ...definition,
    code: source.component,
    styles: source.styles,
    testCode: source.test,
    files: { component: source.componentFile, styles: source.stylesFile, test: source.testFile },
    status: 'published',
  };
}

export const builtInPatterns: Pattern[] = [
  bulkActionsPattern,
  nestedNavPattern,
  wizardValidationPattern,
  widgetGridPattern,
  confirmDialogPattern,
  emptyStatePattern,
  toastStackPattern,
  typeaheadPattern,
].map(buildPattern);
