import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const transferListPattern: PatternDefinition = {
  id: 'inputs.transfer-list',
  slug: 'transfer-list',
  title: 'Transfer list for assigning items',
  summary: 'Two filterable checkbox lists with labelled Add and Remove buttons, live counts, select-all for filtered results, and an announcement for every move. Collapses into one checklist in narrow containers.',
  category: 'inputs',
  tags: ['transfer list', 'dual list', 'assign', 'roles', 'permissions', 'checkbox', 'multi-select'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Admins assign people to roles, permissions to groups, and fields to reports from lists of hundreds. The audited screens use two native multi-select boxes: picking several people needs Ctrl-click, which many users never discover and keyboard users rarely know is Ctrl+Space. There is no filter, so finding one name means scrolling a list sorted by internal id. The move buttons read "greater than" and "less than less than" to a screen reader, nothing confirms what moved, and the double-arrow button empties a role in one click with no undo.',
  beforeState: {
    summary: 'Two fixed-width multi-select boxes with symbol-only arrow buttons.',
    failures: [
      {
        id: 'ctrl-click',
        description: 'Selecting more than one person needs Ctrl-click or Ctrl+Space; a plain click silently drops the earlier selection.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Available list' },
      },
      {
        id: 'no-filter',
        description: 'No filter and no count. Lists are sorted by internal id, so finding a name means scrolling and reading every row.',
        refs: [{ kind: 'heuristic', id: 'H7' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Available column' },
      },
      {
        id: 'unlabelled-arrows',
        description: 'Move buttons are ">", ">>", "<" and "<<". Screen readers read "greater than"; nobody can tell which way is add.',
        refs: [{ kind: 'wcag', criterion: '4.1.2' }, { kind: 'wcag', criterion: '2.4.6' }],
        target: { label: 'Arrow buttons' },
      },
      {
        id: 'silent-move',
        description: 'Nothing confirms a move. Items vanish from one list and appear somewhere in the other, unannounced.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Assigned list' },
      },
      {
        id: 'move-all-no-undo',
        description: 'The double-arrow button removes every member in one click, with no confirmation and no undo.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Remove-all button' },
      },
      {
        id: 'fixed-width',
        description: 'Two fixed 13rem boxes side by side never reflow; at 320px the Assigned list is off screen.',
        refs: [{ kind: 'wcag', criterion: '1.4.10' }],
        target: { label: 'List row' },
      },
    ],
  },
  designRationale:
    'Checkboxes replace modifier-key selection: every user already knows how to check several boxes, with a mouse, a keyboard, or a switch. Each list has its own filter, a count in its legend, and a select-all that names exactly what it covers ("Select all 6 people matching"). Only checked items that match the current filter move, so nothing hidden moves by surprise. The buttons say what they do and how many ("Add selected (3)"), and stay focusable with aria-disabled so focus is not lost after a move. A visible status line, also a live region, confirms each move and the new total. Below 560px the two panes become one checklist where checking assigns immediately, because two stacked lists and a button row are hard to follow on a phone. Lists cap at 200 rendered rows and ask users to filter, which keeps 10,000 items fast.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Names the whole control (role="group").' },
    { name: 'items', type: 'TransferItem[]', required: true, description: '{ id, label, description? }. Description is filterable and shown under the label.' },
    { name: 'value', type: 'string[]', required: true, description: 'Assigned item ids. Lists keep the order of items.' },
    { name: 'onChange', type: '(ids: string[]) => void', required: true, description: 'Called with the new assigned ids after each move.' },
    { name: 'hint', type: 'string', required: false, description: 'Help text linked to the group with aria-describedby.' },
    { name: 'availableLabel', type: 'string', required: false, defaultValue: "'Available'", description: 'Legend of the source list.' },
    { name: 'assignedLabel', type: 'string', required: false, defaultValue: "'Assigned'", description: 'Legend of the target list.' },
    { name: 'noun', type: '{ one: string; other: string }', required: false, defaultValue: "{ one: 'item', other: 'items' }", description: 'Used in counts and announcements.' },
    { name: 'maxRendered', type: 'number', required: false, defaultValue: '200', description: 'Rows rendered per list before asking users to filter.' },
    { name: 'layout', type: "'auto' | 'dual' | 'checklist'", required: false, defaultValue: "'auto'", description: 'auto switches to one checklist below collapseBelow.' },
    { name: 'collapseBelow', type: 'number', required: false, defaultValue: '560', description: 'Container width in px where auto layout becomes a checklist.' },
  ],
  usage: `<TransferList
  label="Reviewer role members"
  items={people}
  value={memberIds}
  onChange={setMemberIds}
  noun={{ one: 'person', other: 'people' }}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'Native checkboxes and buttons; each list is a fieldset whose legend carries its count. Buttons name their direction and count.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'role="status" announces "Added 3 people. 6 people assigned." after each move.' },
    { kind: 'wcag', criterion: '2.1.1', level: 'A', title: 'Keyboard', detail: 'Tab and Space only. No modifier keys or dragging.' },
    { kind: 'wcag', criterion: '1.4.10', level: 'AA', title: 'Reflow', detail: 'Collapses to one checklist in narrow containers; a forced dual layout stacks its panes.' },
    { kind: 'keyboard', keys: 'Tab / Shift+Tab', action: 'Move between filter, select-all, items, and buttons.' },
    { kind: 'keyboard', keys: 'Space', action: 'Check or uncheck the focused item or select-all.' },
    { kind: 'keyboard', keys: 'Enter / Space on a button', action: 'Move the checked, visible items.' },
    { kind: 'aria', attribute: 'aria-disabled', detail: 'Move buttons stay focusable when nothing is checked, so focus survives a move.' },
    { kind: 'screen-reader', title: 'Entering a list', detail: '"Available (45 people) grouping, Filter available, edit".' },
    { kind: 'screen-reader', title: 'Moving', detail: '"Added 3 people. 6 people assigned."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
