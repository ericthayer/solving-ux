import type { CodeAnnotation } from '../../../types/walkthrough';

export const confirmDialogWalkthrough: CodeAnnotation[] = [
  {
    id: 'tone-prop',
    anchor: '/** "danger" uses alertdialog semantics, focuses Cancel first, and ignores backdrop clicks. */',
    endAnchor: 'requireText?: string;',
    topic: 'semantics',
    title: 'Risk level is part of the API',
    rationale:
      'The audited app used one "Are you sure?" dialog for everything, which trained users to click OK. tone, consequences, and requireText scale the friction to the risk: a rename gets a plain dialog, a wire cancellation gets itemized consequences and a typed confirmation.',
    wcag: ['3.3.4'],
  },
  {
    id: 'show-modal',
    anchor: 'returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;',
    endAnchor: '(requireText ? inputRef.current : cancelRef.current)?.focus();',
    topic: 'focus',
    title: 'Native showModal() traps focus for us',
    rationale:
      'showModal() makes the rest of the page inert, so Tab cannot reach content behind the dialog. That fixes the audited div modal without a hand-written focus trap. The trigger is remembered first, and focus goes to the least destructive control.',
    wcag: ['2.4.3', '2.1.2'],
  },
  {
    id: 'return-focus',
    anchor: 'const handleNativeClose = (): void => {',
    endAnchor: 'returnFocusRef.current = null;',
    topic: 'focus',
    title: 'Focus returns to the trigger',
    rationale:
      'Every close path (Cancel, Escape, confirm, backdrop) ends in the native close event, so returning focus in one handler covers them all. Keyboard users continue from the button they pressed instead of the top of the page.',
    wcag: ['2.4.3'],
  },
  {
    id: 'escape',
    anchor: '// Escape fires "cancel". Prevent the native close so React state stays the source of truth.',
    endAnchor: 'requestClose();',
    topic: 'state',
    title: 'Escape asks; the parent decides',
    rationale:
      'The browser would close the dialog on Escape while the open prop still says true. Preventing the default and calling onClose keeps React in charge. requestClose ignores Escape only while the action is running, so the user is never stuck.',
    wcag: ['2.1.2'],
  },
  {
    id: 'backdrop',
    anchor: "if (tone !== 'danger' && event.target === dialogRef.current) requestClose();",
    topic: 'resilience',
    title: 'Backdrop clicks cannot dismiss a danger dialog',
    rationale:
      'A stray click outside should not count as a decision on an irreversible action. Default dialogs still close on backdrop click because that is the expected shortcut.',
    wcag: ['3.3.4'],
  },
  {
    id: 'error-in-place',
    anchor: 'const confirm = async (): Promise<void> => {',
    endAnchor: '} finally {',
    topic: 'resilience',
    title: 'Failures stay inside the dialog',
    rationale:
      'The dialog only closes after onConfirm resolves. If it throws, the message is shown in the dialog next to the buttons. The audited modal closed first and showed errors out of context, if at all.',
    wcag: ['3.3.1'],
  },
  {
    id: 'alertdialog',
    anchor: "role={tone === 'danger' ? 'alertdialog' : undefined}",
    endAnchor: 'aria-describedby={`${id}-description`}',
    topic: 'semantics',
    title: 'Title and consequences are announced on open',
    rationale:
      'aria-describedby points at the description and the consequence list, so screen readers read what will happen, not just the title. Danger dialogs use alertdialog, which tells assistive tech this needs a response now.',
    wcag: ['4.1.2', '1.3.1'],
  },
  {
    id: 'typed-confirm',
    anchor: '{requireText && (',
    endAnchor: 'spellCheck={false}',
    topic: 'semantics',
    title: 'Typed confirmation with a real label',
    rationale:
      'The phrase to type is inside the <label>, so it is announced with the input. Autocomplete and spellcheck are off so the browser cannot fill or "correct" it for the user.',
    wcag: ['3.3.2', '3.3.4'],
  },
  {
    id: 'action-buttons',
    anchor: '<button ref={cancelRef} type="button" className={styles.secondary} onClick={requestClose} disabled={pending}>',
    endAnchor: "{pending ? 'Working…' : confirmLabel}",
    topic: 'semantics',
    title: 'Buttons name the action',
    rationale:
      'confirmLabel is required, so the button says "Cancel 3 payments" instead of "OK". Both buttons lock while the action runs, preventing a double submit.',
    wcag: ['2.4.6', '3.3.4'],
  },
  {
    id: 'reduced-motion',
    file: 'styles',
    anchor: '@media (prefers-reduced-motion: reduce) {',
    endAnchor: 'animation: none;',
    topic: 'styling',
    title: 'Entrance animation respects reduced motion',
    rationale: 'The slide-in is removed for users who ask for less motion. The dialog still appears instantly.',
    wcag: ['2.3.3'],
  },
];
