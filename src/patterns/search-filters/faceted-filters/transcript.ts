import type { ScreenReaderTranscript } from '../../../types/transcript';

export const facetedFiltersTranscript: ScreenReaderTranscript = {
  patternId: 'search-filters.faceted-filters',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the first filter',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The group headers are divs. Tab skips the collapsed filters entirely and lands on the next link.' }],
      after: [{ kind: 'speech', text: 'Filter purchase orders, form. Status, grouping. Draft 14 results, check box, not checked' }],
      failure: 'Keyboard users cannot open a filter group, and the checkboxes have no group name.',
      criterion: '1.3.1',
    },
    {
      action: 'Check an option',
      keys: 'Space',
      before: [
        { kind: 'speech', text: 'checked' },
        { kind: 'speech', text: 'Loading' },
        { kind: 'silence', note: 'The list reloads and focus drops to the top of the page. The groups collapse again.' },
      ],
      after: [
        { kind: 'speech', text: 'checked' },
        { kind: 'speech', text: 'Showing 50 of 120 orders.' },
      ],
      failure: 'A checkbox change triggers a reload and moves focus without warning.',
      criterion: '3.2.2',
    },
    {
      action: 'Find out what is applied',
      keys: 'Tab to the results',
      before: [{ kind: 'speech', text: 'Filters' }],
      after: [
        { kind: 'speech', text: 'Purchase orders, region. Applied filters, list, 2 items' },
        { kind: 'speech', text: 'Remove filter Status: Approved, button' },
      ],
      failure: 'Applied filters live inside collapsed groups. Nothing summarizes them.',
    },
    {
      action: 'Remove one filter',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'There is nothing to remove from. The user has to reopen the group and uncheck the box; the new count is never announced.' }],
      after: [
        { kind: 'speech', text: 'Remove filter Category: IT hardware, button' },
        { kind: 'speech', text: 'Showing 24 of 120 orders.' },
      ],
      failure: 'Count changes are visible only.',
      criterion: '4.1.3',
    },
    {
      action: 'Clear every filter',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: '"clear all" is a link with no href below the results. It is not in the tab order.' }],
      after: [
        { kind: 'speech', text: 'Clear all filters, button' },
        { kind: 'speech', text: 'Purchase orders, region' },
        { kind: 'speech', text: 'Showing all 120 orders.' },
      ],
      failure: 'The reset control cannot be reached from the keyboard.',
      criterion: '2.1.1',
    },
  ],
};
