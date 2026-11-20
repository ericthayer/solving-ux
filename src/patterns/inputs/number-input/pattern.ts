import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const numberInputPattern: PatternDefinition = {
  id: 'inputs.number-input',
  slug: 'number-input',
  title: 'Formatted number and currency input',
  summary: 'Plain text field with a numeric keypad, formatting on blur, tolerant parsing of pasted amounts, the unit in the label, and range errors that say the limit.',
  category: 'inputs',
  tags: ['inputs', 'currency', 'number', 'input mask', 'paste', 'locale', 'validation'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Amount, quantity, and ID fields use input masks that reformat on every keystroke. The caret jumps to the end, so fixing one digit means retyping the whole value. Pasting a copied amount like "$1,250.00" is blocked or mangled. Screen readers read the placeholder mask as "dollar underscore underscore underscore". Quantity fields use type="number", so scrolling the page over a focused field silently changes the order, and values over the limit are clamped without a word.',
  beforeState: {
    summary: 'Masked amount and ID fields, a native number field for quantity, and a digits-only percent field.',
    failures: [
      {
        id: 'placeholder-mask',
        description: 'The format lives only in an underscore placeholder that disappears on the first keystroke and is read aloud character by character. The label says "Amount" with no currency.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'heuristic', id: 'H6' }],
        target: { label: 'Amount field placeholder' },
      },
      {
        id: 'caret-jump',
        description: 'The mask rewrites the value on every keystroke, so the caret jumps to the end and digits shift between dollars and cents mid-edit.',
        refs: [{ kind: 'heuristic', id: 'H3' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Amount field' },
      },
      {
        id: 'paste-blocked',
        description: 'Paste is cancelled without a message, so IDs copied from another system have to be retyped.',
        refs: [{ kind: 'heuristic', id: 'H7' }, { kind: 'heuristic', id: 'H3' }],
        target: { label: 'Cost center field' },
      },
      {
        id: 'scroll-changes-value',
        description: 'type="number" changes the value when the mouse wheel scrolls over the focused field, and its spinner has no unit or range.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.2' }],
        target: { label: 'Quantity field' },
      },
      {
        id: 'silent-clamp',
        description: 'A quantity over 10,000 is quietly replaced with 10,000 on blur. No error says a limit exists.',
        refs: [{ kind: 'wcag', criterion: '3.3.1' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: 'Quantity field and label' },
      },
      {
        id: 'strips-characters',
        description: 'Every non-digit is dropped as it is typed, so "12.5%" becomes 125 with no error.',
        refs: [{ kind: 'heuristic', id: 'H5' }, { kind: 'wcag', criterion: '3.3.1' }],
        target: { label: 'Discount field' },
      },
    ],
  },
  designRationale:
    'The field is type="text" with inputmode, not type="number" and not a mask. That gives the right mobile keypad without wheel changes, spinners, or a reformat on every keystroke, so the caret stays where the user put it. Formatting happens once, on blur, and only when the value is valid; invalid text is left as typed so it can be fixed. The parser is tolerant: it accepts currency symbols and codes, percent signs, spaces, accounting parentheses, and either 1,250.50 or 1.250,50, which covers values pasted from spreadsheets and statements. Grouping that does not look like grouping ("12,5" in a US locale) is an error, not a silent 125, because a misread amount is worse than an extra keystroke. The unit is part of the label so it is announced; the visible "$" or "%" beside the field is decoration. Separators and currency digits come from Intl, so EUR, JPY, and de-DE work without new code. The form posts a hidden canonical value, so the server never parses display text.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Visible label. The unit (currency code, "%", or format.unit) is appended automatically.' },
    { name: 'name', type: 'string', required: true, description: 'Name of a hidden input that posts the canonical value ("1250.5"), not the formatted text.' },
    { name: 'format', type: "{ style: 'currency'; currency: string } | { style: 'percent' } | { style: 'decimal' | 'integer'; unit?: string }", required: true, description: 'What the number means. Drives the label unit, the adornment, decimal places, and messages.' },
    { name: 'value', type: 'number | null', required: true, description: 'Controlled value. External changes replace the text only while the field is not focused.' },
    { name: 'onValueChange', type: '(value: number | null) => void', required: true, description: 'Called on every edit with the parsed number, or null when empty or not a number.' },
    { name: 'locale', type: 'string', required: false, defaultValue: '"en-US"', description: 'BCP 47 locale for separators, grouping, and currency placement.' },
    { name: 'min / max', type: 'number', required: false, description: 'Inclusive range. Shown as a hint and enforced with an error that names the limit. min >= 0 enables the numeric keypad.' },
    { name: 'maxFractionDigits', type: 'number', required: false, description: "Defaults to the currency's minor units, 2 for percent, 4 for decimal, 0 for integer." },
    { name: 'required', type: 'boolean', required: false, defaultValue: 'false', description: 'An empty field shows "Enter <label>." after blur or a submit attempt.' },
    { name: 'hint', type: 'string', required: false, description: 'Replaces the generated range hint, e.g. "From $1,000.00 to $500,000.00."' },
    { name: 'autoComplete', type: 'string', required: false, description: 'Defaults to "transaction-amount" for currency and "off" otherwise.' },
  ],
  usage: `<NumberInput
  label="Amount requested"
  name="amount"
  format={{ style: 'currency', currency: 'USD' }}
  min={1000}
  max={500000}
  required
  value={amount}
  onValueChange={setAmount}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '3.3.2', level: 'A', title: 'Labels or instructions', detail: 'The unit is in the label ("Amount requested (USD)") and the range is a persistent hint, not a placeholder.' },
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'Unparseable, out-of-range, and over-precise values get a text error that names the limit, linked by aria-describedby.' },
    { kind: 'wcag', criterion: '4.1.2', level: 'A', title: 'Name, role, value', detail: 'A plain text input with a real label. The value read back is the formatted number, never mask underscores.' },
    { kind: 'wcag', criterion: '1.3.5', level: 'AA', title: 'Identify input purpose', detail: 'Currency fields default to autocomplete="transaction-amount".' },
    { kind: 'keyboard', keys: 'Tab', action: 'Leaving the field formats a valid value and shows any error.' },
    { kind: 'keyboard', keys: 'Ctrl+V / Cmd+V', action: 'Paste is allowed. "$1,250.00", "1.250,00 €", and "(500)" all parse.' },
    { kind: 'keyboard', keys: 'Arrow keys / mouse wheel', action: 'Never change the value. Arrows move the caret like any text field.' },
    { kind: 'aria', attribute: 'inputmode', detail: '"numeric" or "decimal" brings up the number keypad when min >= 0; "text" otherwise, because those keypads have no minus key on iOS.' },
    { kind: 'aria', attribute: 'aria-hidden on "$" and "%"', detail: 'The visible symbol is decoration. The label already says USD or %, so it is not read twice.' },
    { kind: 'screen-reader', title: 'Focus', detail: 'NVDA: "Amount requested (USD), edit, required, From $1,000.00 to $500,000.00."' },
    { kind: 'screen-reader', title: 'Error', detail: 'Returning to the field reads "invalid entry" and the message, e.g. "Enter no more than 10,000 units."' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
