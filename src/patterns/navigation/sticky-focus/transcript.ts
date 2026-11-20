import type { ScreenReaderTranscript } from '../../../types/transcript';

export const stickyFocusTranscript: ScreenReaderTranscript = {
  patternId: 'navigation.sticky-focus',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the page from the header',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Cancel, button' }],
      after: [{ kind: 'speech', text: 'Edit project, region. Project name, edit, Riverside facility upgrade' }],
      failure: 'The Save bar comes first in the markup, so Tab lands on Cancel and Save before the first field.',
      criterion: '2.4.3',
    },
    {
      action: 'Tab down to Approver email',
      keys: 'Tab (7 times)',
      before: [{ kind: 'speech', text: 'Approver email, edit, blank' }],
      after: [{ kind: 'speech', text: 'Approver email, edit, approvals@example.com' }],
      failure: 'Speech is correct, but the field sits behind the pinned Save bar. A sighted keyboard user, or a low-vision user following the screen reader focus, cannot see what they type.',
      criterion: '2.4.11',
    },
    {
      action: 'Shift+Tab back to Cost center',
      keys: 'Shift+Tab',
      before: [{ kind: 'speech', text: 'Cost center, edit, blank' }],
      after: [{ kind: 'speech', text: 'Cost center, edit, CC-4410' }],
      failure: 'The field scrolls only to the top edge of the scroll area, which is under the pinned header.',
      criterion: '2.4.11',
    },
    {
      action: 'Read the form at 400% zoom',
      keys: 'Down arrow (browse mode)',
      before: [{ kind: 'speech', text: 'Start date, edit, blank' }],
      after: [{ kind: 'speech', text: 'Start date, edit, 2027-01-11' }],
      failure: 'Output is the same, but on screen the two bars cover most of the window and screen magnifier users chase a strip one line tall.',
      criterion: '1.4.10',
    },
    {
      action: 'Save the form',
      keys: 'Enter on Save changes',
      before: [{ kind: 'silence', note: 'The page saves with no announcement.' }],
      after: [{ kind: 'speech', text: 'Changes saved.' }],
    },
  ],
};
