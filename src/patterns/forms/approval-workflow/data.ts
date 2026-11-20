import type { ApprovalRequest } from './ApprovalWorkflow';

/** Neutral demo data: a purchase request on its second review round. */
export const sampleRequest = (t: (value: string) => string = (v) => v): ApprovalRequest => ({
  id: 'PR-2048',
  title: t('Conference room display refresh'),
  requester: 'Jordan Kim',
  status: 'in-review',
  approvers: [
    { name: 'Priya Shah', role: 'Team manager', decision: 'approved' },
    { name: 'Marcus Lee', role: 'Finance' },
    { name: 'Ana Ruiz', role: 'Director' },
  ],
  history: [
    { id: 'h1', kind: 'submitted', actor: 'Jordan Kim', role: 'Requester', at: '2026-11-10T15:12:00Z', comment: t('Ten displays for the third-floor rooms. Quote attached.') },
    { id: 'h2', kind: 'changes-requested', actor: 'Priya Shah', role: 'Team manager', at: '2026-11-11T09:40:00Z', comment: t('The attached quote is from August and has expired. Please attach a current one.') },
    { id: 'h3', kind: 'resubmitted', actor: 'Jordan Kim', role: 'Requester', at: '2026-11-12T16:05:00Z', comment: t('Attached the October quote. The vendor lowered the unit price.') },
    { id: 'h4', kind: 'approved', actor: 'Priya Shah', role: 'Team manager', at: '2026-11-13T10:22:00Z' },
  ],
  changesSinceLastReview: [
    { field: t('Quote'), from: t('August quote (expired)'), to: t('October quote') },
    { field: t('Unit price'), from: '$1,995', to: '$1,840' },
    { field: t('Total'), from: '$19,950', to: '$18,400' },
  ],
});
