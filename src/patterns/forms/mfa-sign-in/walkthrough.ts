import type { CodeAnnotation } from '../../../types/walkthrough';

export const mfaSignInWalkthrough: CodeAnnotation[] = [
  {
    id: 'adapter',
    anchor: '/** The only seam to your auth backend.',
    endAnchor: 'sendEmailLink?: (email: string) => Promise<void>;',
    topic: 'resilience',
    title: 'One typed adapter, with optional passwordless methods',
    rationale:
      'Every server call goes through this object, so the component holds no auth logic and tests swap in fakes. Wrong answers resolve with a message; network failures reject. Leaving out signInWithPasskey or sendEmailLink hides that option instead of rendering a dead button.',
    wcag: ['3.3.8'],
  },
  {
    id: 'normalize-code',
    anchor: '/** Strips the spaces and hyphens that messages and password managers paste with a code. */',
    endAnchor: 'return null;',
    topic: 'resilience',
    title: 'Accept the code the way people paste it',
    rationale:
      'Codes arrive as "246 810" or "246-810". Stripping those separators means paste just works, and the validation messages say exactly what is wrong (letters, or how many digits were entered) rather than a generic "Invalid code".',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'countdown',
    anchor: '/** "0:07" style wait text.',
    endAnchor: 'return [left, () => setLeft(seconds)];',
    topic: 'announce',
    title: 'A visible wait that is not read every second',
    rationale:
      'The resend wait is shown as text so nobody guesses when they can try again. It is deliberately not a live region: announcing a ticking countdown would drown out everything else a screen reader user is trying to hear.',
    wcag: ['2.2.1', '4.1.3'],
  },
  {
    id: 'focus-heading',
    anchor: '// Focus moves to the new heading after the stage commits',
    endAnchor: '}, [stage]);',
    topic: 'focus',
    title: 'Focus follows the stage change',
    rationale:
      'When the password is accepted the form swaps its fields. Without moving focus it would be left on a button that no longer exists. Focusing the heading announces where the user is, and the ref flag skips this on first render.',
    wcag: ['2.4.3'],
  },
  {
    id: 'keep-data',
    anchor: '/** Runs a server call. A thrown error keeps every value on screen and says so. */',
    endAnchor: 'finally {',
    topic: 'resilience',
    title: 'Errors never clear what the user typed',
    rationale:
      'The audited screen reset the whole form on any error. Here values live in state that no error path touches, and the network-failure message says so explicitly, because users who have lost data before will otherwise assume it happened again.',
    wcag: ['3.3.7'],
  },
  {
    id: 'credential-errors',
    anchor: 'const submitCredentials = async (): Promise<void> => {',
    endAnchor: "goTo('code');",
    topic: 'state',
    title: 'Field errors focus the field; credential errors use an alert',
    rationale:
      'An empty field is the user\'s problem and has a place, so focus goes there. A wrong password is not attributable to one field (saying which would help attackers), so it is announced with role="alert" and both fields keep their values.',
    wcag: ['3.3.1', '3.3.7'],
  },
  {
    id: 'resend',
    anchor: 'const resend = async (): Promise<void> => {',
    endAnchor: 'startResendWait();',
    topic: 'announce',
    title: 'Resend confirms through a status message',
    rationale:
      'A new code is the kind of change users cannot see if they are looking at their phone. role="status" announces it politely, names where it went, and clears the old error so the next attempt starts clean.',
    wcag: ['4.1.3'],
  },
  {
    id: 'field-wiring',
    anchor: 'const field = (name: FieldName, hintId?: string) => ({',
    endAnchor: "'aria-describedby':",
    topic: 'semantics',
    title: 'Hint and error are tied to every input',
    rationale:
      'One helper wires id, aria-invalid, and aria-describedby the same way for all three fields, so the hint and the error are read when a field gets focus. aria-invalid is omitted rather than set to "false" when there is no error.',
    wcag: ['3.3.1', '1.3.1'],
  },
  {
    id: 'autocomplete',
    anchor: '<input {...field(\'email\')} type="email" autoComplete="username"',
    endAnchor: 'autoComplete="current-password"',
    topic: 'semantics',
    title: 'Autocomplete tokens and paste are left alone',
    rationale:
      '"username" and "current-password" are the tokens password managers look for; "email" on a sign-in field often gets ignored. Nothing calls preventDefault on paste. Together they make sign-in a copy, not a memory test.',
    wcag: ['1.3.5', '3.3.8'],
  },
  {
    id: 'show-password',
    anchor: '<button type="button" className={styles.secondary} aria-pressed={showPassword}',
    endAnchor: 'Show password',
    topic: 'semantics',
    title: 'Show password is a toggle with a stable name',
    rationale:
      'Users who cannot see well or type accurately need to check what they entered. The name stays "Show password" and aria-pressed carries the state, so speech-input users can always say the same words to toggle it.',
    wcag: ['4.1.2', '2.5.3', '3.3.8'],
  },
  {
    id: 'alternatives',
    anchor: '{(auth.signInWithPasskey || auth.sendEmailLink) && (',
    endAnchor: '</section>',
    topic: 'semantics',
    title: 'A path with no cognitive test at all',
    rationale:
      'A passkey or an email link lets someone sign in without recalling or transcribing anything. Grouping them under their own heading makes them findable by heading navigation, not buried after the main button.',
    wcag: ['3.3.8', '1.3.1'],
  },
  {
    id: 'code-input',
    anchor: '<input {...field(\'code\', `${id}-code-hint`)} type="text" inputMode="numeric" autoComplete="one-time-code"',
    topic: 'semantics',
    title: 'One code field, not six boxes',
    rationale:
      'type="text" with inputMode="numeric" brings up the number pad without type="number" quirks like spinners and dropped leading zeros. autocomplete="one-time-code" lets phones offer the code from the message, and a single field takes a pasted code in one go.',
    wcag: ['1.3.5', '3.3.8'],
  },
  {
    id: 'resend-control',
    anchor: '<button type="button" className={styles.linkButton} aria-disabled={waiting || undefined}',
    endAnchor: '{waiting && <span',
    topic: 'focus',
    title: 'aria-disabled keeps the wait discoverable',
    rationale:
      'A natively disabled button drops out of the tab order, so keyboard and screen reader users never learn the option exists. aria-disabled keeps it reachable, and aria-describedby reads the remaining time. The click handler ignores presses until the wait ends.',
    wcag: ['2.2.1', '4.1.2'],
  },
  {
    id: 'code-styling',
    file: 'styles',
    anchor: '/* One field, wide tracking: reads like separate boxes without breaking paste or autofill. */',
    endAnchor: '}',
    topic: 'styling',
    title: 'The six-box look without six boxes',
    rationale:
      'Designers usually ask for split boxes for the look. A monospace face and letter-spacing on a single input gives the same rhythm while keeping one accessible name, one caret, and working paste.',
    wcag: ['3.3.8'],
  },
];
