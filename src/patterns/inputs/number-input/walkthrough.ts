import type { CodeAnnotation } from '../../../types/walkthrough';

export const numberInputWalkthrough: CodeAnnotation[] = [
  {
    id: 'tolerant-parse',
    anchor: '* Tolerant parser for typed and pasted numbers.',
    endAnchor: "if (!/^[\\d.,]*\\d[\\d.,]*$/.test(s)) return { kind: 'invalid' };",
    topic: 'resilience',
    title: 'Accept what people paste',
    rationale:
      'Amounts arrive from statements, spreadsheets, and email with symbols, codes, spaces, and accounting parentheses. The parser strips the decoration instead of rejecting the paste, which is what the audited masks did. Anything that is still not a number after that is an error, not silently dropped characters.',
    wcag: ['3.3.1'],
  },
  {
    id: 'decimal-detection',
    anchor: '// When both separators appear, the last one is the decimal.',
    endAnchor: '  }',
    topic: 'resilience',
    title: 'Work out the decimal separator',
    rationale:
      'With both "." and "," present, the last one is the decimal, so 1,250.50 and 1.250,50 both parse. A lone separator follows the locale. Repeated separators are always grouping.',
  },
  {
    id: 'grouping-check',
    anchor: '// Grouping must look like grouping',
    endAnchor: "return { kind: 'invalid' };",
    topic: 'resilience',
    title: 'A typo is an error, not a different amount',
    rationale:
      'In a US locale "12,5" is almost always a typo for 12.5. Reading it as 125 would be tolerant and wrong. Groups must be three digits at the end (two allowed before that for 12,50,000), otherwise the user is asked to fix it.',
    wcag: ['3.3.1'],
  },
  {
    id: 'intl-formatting',
    anchor: 'export function createFormatting(',
    endAnchor: "affix: { text: parts[symbolAt]?.value ?? format.currency",
    topic: 'semantics',
    title: 'Separators and symbol placement come from Intl',
    rationale:
      'Minor units (2 for USD, 0 for JPY) and whether the symbol goes before or after the number are read from Intl.NumberFormat, so a new currency or locale needs no code.',
  },
  {
    id: 'messages',
    anchor: 'export function validateNumber(',
    endAnchor: 'return null;',
    topic: 'semantics',
    title: 'Errors name the limit',
    rationale:
      'Every message says what to enter: an example of the format, the decimal places allowed, or the exact limit in the field’s own unit. Extra decimals on money are an error, never a silent round.',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'external-value',
    anchor: '// A value set from outside (reset, prefill) replaces the text, but never while the user is typing.',
    endAnchor: '}, [value]);',
    topic: 'state',
    title: 'The text is owned by the user while focused',
    rationale:
      'The component holds the raw text and reports a number. A parent update only replaces the text when the field is not focused, so a round trip through parent state can never reformat what the user is typing.',
  },
  {
    id: 'native-validity',
    anchor: '// Native validity lets a parent form call checkValidity()',
    endAnchor: '}, [error]);',
    topic: 'state',
    title: 'Plays well with plain forms',
    rationale:
      'setCustomValidity mirrors the inline error, so form.checkValidity() works and the first invalid field can be found with :invalid. The invalid event reveals the error and suppresses the browser bubble.',
  },
  {
    id: 'no-reformat-while-typing',
    anchor: '// Keep exactly what was typed: no reformatting mid-edit, so the caret never jumps.',
    endAnchor: "onValueChange(parsed.kind === 'number' ? parsed.value : null);",
    topic: 'state',
    title: 'No mask, no caret jump',
    rationale:
      'The audited mask rewrote the value on every keystroke, so the browser moved the caret to the end. Here the text is stored exactly as typed. The parsed number still goes to the parent on every edit, so Enter-to-submit sees the current value.',
  },
  {
    id: 'format-on-blur',
    anchor: '// Format only a valid value. Invalid text stays as typed so the user can fix it.',
    endAnchor: 'if (result.kind',
    topic: 'state',
    title: 'Format once, on blur',
    rationale:
      'Leaving the field is the moment the user is done, so that is when "1250.5" becomes "1,250.50". Invalid text is not touched: erasing or rewriting it would hide the mistake.',
    wcag: ['3.2.2'],
  },
  {
    id: 'inputmode',
    anchor: '// iOS numeric and decimal keypads have no minus key',
    endAnchor: 'const inputMode =',
    topic: 'semantics',
    title: 'Keypad from inputmode, not type="number"',
    rationale:
      'type="number" changes value on wheel and arrow keys, drops grouping, and is announced as a spin button. A text input with inputmode gets the number keypad on phones without any of that. The keypad is only used when min rules out negatives.',
    wcag: ['4.1.2'],
  },
  {
    id: 'label-unit',
    anchor: '<label htmlFor={id} className={styles.label}>',
    endAnchor: '</label>',
    topic: 'semantics',
    title: 'The unit is in the label',
    rationale:
      'The accessible name is "Amount requested (USD)". The visible "$" beside the field is aria-hidden so it is not read twice, and the range lives in a hint that stays visible while typing instead of a placeholder.',
    wcag: ['3.3.2', '1.3.1'],
  },
  {
    id: 'autocomplete',
    anchor: "autoComplete={autoComplete ?? (format.style === 'currency' ? 'transaction-amount' : 'off')}",
    topic: 'semantics',
    title: 'Input purpose for amounts',
    rationale:
      'transaction-amount is the HTML autocomplete token for a money amount the user is entering, which lets assistive tech and browsers identify the field.',
    wcag: ['1.3.5'],
  },
  {
    id: 'hidden-canonical',
    anchor: '<input type="hidden" name={name}',
    topic: 'resilience',
    title: 'The server gets a number, not display text',
    rationale:
      'The visible field has no name. A hidden input posts "1250.5", so the server never parses "1.250,50 €" and a locale change cannot change the stored value.',
  },
  {
    id: 'focus-ring',
    file: 'styles',
    anchor: '.control:focus-within {',
    endAnchor: '}',
    topic: 'styling',
    title: 'One focus ring around the symbol and the field',
    rationale:
      'The wrapper draws the ring, so the "$" and the input read as one control. The error state adds a thick inner border, not just a red outline.',
    wcag: ['2.4.7', '1.4.1'],
  },
];
