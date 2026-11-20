import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const editConflictGuardPattern: PatternDefinition = {
  id: 'forms.edit-conflict-guard',
  slug: 'edit-conflict-guard',
  title: 'Edit conflict and unsaved-changes guard',
  summary:
    'Record form that tracks real changes, warns before leaving only when something is unsaved, and resolves a stale save with a field-by-field "keep mine or theirs" choice instead of overwriting or erroring.',
  category: 'forms',
  tags: ['forms', 'concurrency', 'optimistic locking', 'unsaved changes', 'data loss', 'collaboration'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Two buyers open the same purchase order. The second one to press Save silently replaces the first one\'s changes, and nobody finds out until the supplier is paid on the wrong terms. Separately, the edit screen loses typed changes when the user clicks another order in the sidebar, yet shows "Are you sure you want to leave?" on every exit, including when nothing was changed. Users learn to click OK without reading, and the one time it matters, the warning is ignored.',
  beforeState: {
    summary: 'Last-write-wins form with no version check, no dirty tracking, and a leave prompt that fires on every exit.',
    failures: [
      {
        id: 'silent-overwrite',
        description: "Save sends the whole form with no version check, so a colleague's newer change is overwritten without either person being told.",
        refs: [{ kind: 'wcag', criterion: '3.3.4' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Save button' },
      },
      {
        id: 'route-loses-data',
        description: 'Switching to another record inside the app discards typed changes with no warning. Only browser tab close was ever guarded.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Other purchase order button' },
      },
      {
        id: 'nags-when-clean',
        description: 'The leave prompt fires on every exit, even with nothing changed, and its OK button does not say whether it leaves or stays. Users stop reading it.',
        refs: [{ kind: 'heuristic', id: 'H8' }, { kind: 'wcag', criterion: '2.4.6' }],
        target: { label: 'Leave warning', revealedBy: 'Click Back to orders without editing anything' },
      },
      {
        id: 'no-dirty-state',
        description: 'Nothing on the screen says whether there are unsaved changes, or which fields they are in.',
        refs: [{ kind: 'heuristic', id: 'H1' }, { kind: 'wcag', criterion: '4.1.3' }],
        target: { label: 'Form heading' },
      },
      {
        id: 'save-not-announced',
        description: '"Record saved." appears as plain text that screen readers do not announce, and it claims success even when it just destroyed someone else\'s work.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Save confirmation text', revealedBy: 'Click Save' },
      },
    ],
  },
  designRationale:
    'Data loss is the most expensive failure in a shared tool, and there are two ways it happens: you lose your own edits, or you erase someone else\'s. The guard handles the first by comparing the draft to the last saved copy, not by tracking "touched", so it warns only when leaving would actually lose something, and in-app navigation gets a real choice: keep editing, discard, or save and leave. The conflict view handles the second. Saves carry the version they were based on. When the server says it is stale, fields only the colleague changed merge in automatically, fields only you changed are kept, and only fields both of you changed ask for a decision, with both values shown side by side. Nothing anyone typed is thrown away, and the user never sees a raw 409.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'title', type: 'string', required: true, description: 'Form heading. Name the record, e.g. "Purchase order PO-1042".' },
    { name: 'fields', type: 'FieldDef[]', required: true, description: '{ name, label, multiline? }. Labels are reused in the conflict view and the leave dialog.' },
    { name: 'record', type: 'VersionedRecord', required: true, description: '{ version, values, updatedBy? } as loaded from the server. Change the component key to load a different record.' },
    { name: 'onSave', type: '(values, baseVersion) => Promise<SaveResult>', required: true, description: "Resolve { status: 'saved', record } or { status: 'conflict', latest }. Map an HTTP 409 or 412 to the conflict result." },
    { name: 'pendingNavigation', type: 'string | null', required: false, defaultValue: 'null', description: 'Destination of an in-app navigation the router is holding. Clean forms allow it at once; dirty forms ask.' },
    { name: 'onNavigationResolved', type: '(allow: boolean) => void', required: false, description: 'Called with true to proceed (React Router: blocker.proceed()) or false to stay (blocker.reset()).' },
  ],
  usage: `const blocker = useBlocker(true);

<EditConflictForm
  key={order.id}
  title={\`Purchase order \${order.id}\`}
  fields={fields}
  record={{ version: order.version, values: order.values }}
  onSave={async (values, baseVersion) => {
    const res = await fetch(url, { method: 'PUT', headers: { 'If-Match': String(baseVersion) }, body: JSON.stringify(values) });
    if (res.status === 412) return { status: 'conflict', latest: await res.json() };
    return { status: 'saved', record: await res.json() };
  }}
  pendingNavigation={blocker.state === 'blocked' ? blocker.location.pathname : null}
  onNavigationResolved={(allow) => (allow ? blocker.proceed?.() : blocker.reset?.())}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '3.3.4', level: 'AA', title: 'Error prevention', detail: 'A stale save never overwrites newer data; conflicting fields need an explicit choice before the record is written.' },
    { kind: 'wcag', criterion: '3.3.6', level: 'AAA', title: 'Error prevention (all)', detail: 'Leaving with unsaved changes is reversible: Keep editing is focused first, and Escape stays on the form.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'Unsaved count, saving, saved, and conflict messages are announced from one role="status" region without moving focus.' },
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'The conflict names who changed the record and each field in conflict, with both values in text.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Changed fields carry an "Unsaved change" text note, not only the amber bar.' },
    { kind: 'keyboard', keys: 'Enter', action: 'In a single-line field, saves the form.' },
    { kind: 'keyboard', keys: 'Arrow keys', action: 'Switch between Keep mine and Keep theirs inside a conflict group.' },
    { kind: 'keyboard', keys: 'Escape', action: 'In the leave dialog, cancels the navigation and keeps editing.' },
    { kind: 'aria', attribute: 'role="status"', detail: 'Polite live region for dirty and save state. Its text only changes when the count changes, so typing does not chatter.' },
    { kind: 'aria', attribute: 'aria-describedby', detail: 'Each changed input points at its "Unsaved change" note, so the state is read on focus.' },
    { kind: 'aria', attribute: '<fieldset> + <legend>', detail: 'Each conflict is a radio group named by the field label.' },
    { kind: 'screen-reader', title: 'On conflict', detail: 'Focus moves to the conflict heading: "Jordan Lee saved changes while you were editing, heading level 4", then the status reads how many fields need a decision.' },
    { kind: 'screen-reader', title: 'On leave', detail: 'Reads "Leave with unsaved changes?, dialog, You changed Payment terms and Notes." then focuses Keep editing.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
