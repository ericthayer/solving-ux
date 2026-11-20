import type { ScreenReaderTranscript } from '../../../types/transcript';

export const notificationCenterTranscript: ScreenReaderTranscript = {
  patternId: 'notifications.notification-center',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab to the notifications bell',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The bell is a div. Tab skips it, and browse mode reads only "graphic".' }],
      after: [{ kind: 'speech', text: 'Notifications, 3 unread, button, collapsed' }],
      failure: 'Keyboard and screen reader users cannot find or open the inbox, or learn how many items are new.',
      criterion: '4.1.2',
    },
    {
      action: 'Open the panel',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'Only a mouse click opens it. The dropdown appears at the end of the page.' }],
      after: [{ kind: 'speech', text: 'expanded' }],
      failure: 'The panel cannot be opened from the keyboard.',
      criterion: '2.1.1',
    },
    {
      action: 'Read the list',
      keys: 'Down Arrow',
      before: [
        { kind: 'speech', text: 'list with 5 items' },
        { kind: 'speech', text: 'Invoice INV-2048 approved' },
        { kind: 'speech', text: 'Weekly usage report generated' },
      ],
      after: [
        { kind: 'speech', text: 'Today, heading level 3' },
        { kind: 'speech', text: 'list with 3 items' },
        { kind: 'speech', text: 'Unread: Invoice INV-2048 approved' },
        { kind: 'speech', text: 'Weekly usage report generated' },
      ],
      failure: 'Read and unread rows sound identical; bold is the only difference.',
      criterion: '1.3.1',
    },
    {
      action: 'Act on an item',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'Rows are clickable divs. Tab never reaches them.' }],
      after: [{ kind: 'speech', text: 'View invoice, button, Unread: Invoice INV-2048 approved' }],
      failure: 'Items cannot be acted on or marked read from the keyboard.',
      criterion: '2.1.1',
    },
    {
      action: 'Mark everything read',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'There is no mark all as read control.' }],
      after: [{ kind: 'speech', text: '3 notifications marked as read' }],
    },
    {
      action: 'A new notification arrives',
      before: [{ kind: 'silence', note: 'The red dot reappears. Nothing is announced.' }],
      after: [{ kind: 'speech', text: 'New notification: Export ready: Q3 vendor spend' }],
      failure: 'Users relying on a screen reader never learn that something new arrived.',
      criterion: '4.1.3',
    },
    {
      action: 'Close the panel',
      keys: 'Escape',
      before: [{ kind: 'silence', note: 'Escape does nothing; the dropdown stays open until the next click.' }],
      after: [{ kind: 'speech', text: 'Notifications, button, collapsed' }],
      failure: 'There is no keyboard way out, and focus is not returned.',
      criterion: '2.4.3',
    },
  ],
};
