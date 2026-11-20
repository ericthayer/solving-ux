import type { ScreenReaderTranscript } from '../../../types/transcript';

export const permissionAwareActionsTranscript: ScreenReaderTranscript = {
  patternId: 'permissions.permission-aware-actions',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the request actions',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Export PDF, button' }],
      after: [
        { kind: 'speech', text: 'Request actions, grouping' },
        { kind: 'speech', text: 'Edit request, button, unavailable, Requires the Editor role. Your workspace admin can grant it.' },
      ],
      failure: 'The disabled Edit and Invite buttons are skipped. The user never learns they exist.',
      criterion: '4.1.2',
    },
    {
      action: 'Look for the reason Invite is unavailable',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The reason is a title tooltip on a wrapper around a disabled button. It shows on mouse hover only, and focus never lands there.' }],
      after: [
        { kind: 'speech', text: 'Request access: Edit request, button' },
        { kind: 'speech', text: 'Invite collaborator, button, unavailable, Requires the Editor role. Your workspace admin can grant it.' },
      ],
      failure: 'The only explanation is unreachable without a mouse.',
      criterion: '1.4.13',
    },
    {
      action: 'Look for Approve on a submitted request',
      keys: 'Tab',
      before: [{ kind: 'speech', text: 'Delete, button' }],
      after: [{ kind: 'speech', text: 'Approve, button, unavailable, Requires the Approver role. Your workspace admin can grant it.' }],
      failure: 'Approve is removed for this role, so the user concludes the product cannot approve requests.',
    },
    {
      action: 'Press an unavailable action',
      keys: 'Enter on "Edit request"',
      before: [{ kind: 'silence', note: 'Disabled buttons cannot be reached or pressed, so nothing happens and nothing is said.' }],
      after: [{ kind: 'speech', text: 'Edit request is unavailable. Requires the Editor role. Your workspace admin can grant it.' }],
    },
    {
      action: 'Delete the request',
      keys: 'Enter on "Delete"',
      before: [{ kind: 'silence', note: '"Error 403: Forbidden" appears below the toolbar and is not announced. It names no permission and no person.' }],
      after: [{ kind: 'speech', text: 'Delete request, button, unavailable, Requires the Editor role. Your workspace admin can grant it.' }],
      failure: 'The action looked available and fails with an unspoken, unexplained error.',
      criterion: '3.3.1',
    },
    {
      action: 'Request access',
      keys: 'Enter on "Request access"',
      before: [{ kind: 'silence', note: 'There is no request path. The user has to find out who the admin is and email them.' }],
      after: [{ kind: 'speech', text: 'Request sent for Edit request.' }],
    },
  ],
};
