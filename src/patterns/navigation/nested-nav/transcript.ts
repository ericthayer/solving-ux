import type { ScreenReaderTranscript } from '../../../types/transcript';

export const nestedNavTranscript: ScreenReaderTranscript = {
  patternId: 'navigation.nested-nav',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Jump to navigation landmarks',
      keys: 'D (next landmark)',
      before: [{ kind: 'speech', text: 'navigation landmark' }],
      after: [
        { kind: 'speech', text: 'Workspace breadcrumb, navigation landmark' },
        { kind: 'speech', text: 'Workspace, navigation landmark' },
      ],
      failure: 'One unnamed landmark. Breadcrumbs are a plain div, so there is no second landmark to jump to.',
      criterion: '2.4.1',
    },
    {
      action: 'Tab to the Receiving menu item',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Receiving, link' }],
      after: [{ kind: 'speech', text: 'Receiving, button, collapsed' }],
      failure: 'Nothing says Receiving has a submenu or whether it is open.',
      criterion: '4.1.2',
    },
    {
      action: 'Try to open the submenu',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'The flyout opens on hover only. Enter follows the link and reloads the page.' }],
      after: [{ kind: 'speech', text: 'Receiving, button, expanded' }],
      failure: 'Level 2 and deeper cannot be reached from the keyboard.',
      criterion: '2.1.1',
    },
    {
      action: 'Move into the submenu',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'Unreachable. Focus skips straight to Reports.' }],
      after: [{ kind: 'speech', text: 'list, 3 items, level 2, Payments, link' }],
    },
    {
      action: 'Read the breadcrumb',
      keys: 'Browse mode',
      before: [{ kind: 'speech', text: 'Customers, link, slash, Spend, link, slash, By industry' }],
      after: [
        { kind: 'speech', text: 'Workspace breadcrumb, navigation landmark, list, 4 items' },
        { kind: 'speech', text: 'Customers, link. Relationships. Spend. By region, current page' },
      ],
      failure: 'The hand-written trail disagrees with the page, and separators are read aloud as "slash".',
      criterion: '2.4.8',
    },
  ],
};
