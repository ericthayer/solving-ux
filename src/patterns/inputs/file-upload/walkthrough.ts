import type { CodeAnnotation } from '../../../types/walkthrough';

export const fileUploadWalkthrough: CodeAnnotation[] = [
  {
    id: 'validate-file',
    anchor: '/** Returns why one file cannot be added, or null. Each message names the file and the fix. */',
    endAnchor: 'return null;',
    topic: 'resilience',
    title: 'Every rejection names the file and the fix',
    rationale:
      'The audited uploader said "Upload failed" for the whole batch. Here each file is checked on its own for type, empty content, size, duplicates and the file count, and the message says which file and what to do: "signed-contract-scan.pdf is 14 MB. Choose a file of 10 MB or less."',
    wcag: ['3.3.1', '3.3.3'],
  },
  {
    id: 'summarize',
    anchor: '/** One polite sentence for the whole batch, e.g. "2 of 3 uploaded, 1 failed." */',
    endAnchor: "return parts.length > 0 ? `${parts.join(', ')}.` : '';",
    topic: 'announce',
    title: 'One sentence for the batch, not one per percent',
    rationale:
      'The status text is derived from counts, so it only changes when a file starts, finishes, fails or is removed. Progress ticks never reach the live region, which keeps a screen reader from reading "20%, 40%, 60%" for every file.',
    wcag: ['4.1.3'],
  },
  {
    id: 'independent-uploads',
    anchor: '// Each file uploads on its own, so one failure never takes the rest of the batch with it.',
    endAnchor: '.finally(() => controllers.current.delete(id));',
    topic: 'resilience',
    title: 'Independent uploads with their own AbortController',
    rationale:
      'Every file gets its own request and controller. A failure marks only that row, Cancel aborts only that request, and Retry calls start() again with the same file. An aborted request is ignored instead of being reported as a failure.',
  },
  {
    id: 'focus-after-remove',
    anchor: '// Removing a row would drop focus to <body>. Move it to the next row, or back to the picker.',
    endAnchor: '}, [items]);',
    topic: 'focus',
    title: 'Focus survives removing a row',
    rationale:
      'The focused Remove button is deleted along with its row. Without this effect, keyboard focus falls to the top of the page. Focus goes to the row that took its place, the previous row if it was last, or Choose files when the list is empty.',
    wcag: ['2.4.3'],
  },
  {
    id: 'fieldset-rules',
    anchor: "<fieldset className={styles.root} aria-describedby={`${baseId}-rules`}>",
    endAnchor: '<p id={`${baseId}-rules`} className={styles.hint}>{describeRules(rules)}</p>',
    topic: 'semantics',
    title: 'Limits are stated before the first pick',
    rationale:
      'The legend names the group and the rules are attached to it, so a screen reader reads the accepted types and limits on the way in. Users learn the 10 MB limit before choosing a 14 MB scan, not after.',
    wcag: ['3.3.2', '1.3.1'],
  },
  {
    id: 'native-input',
    anchor: '{/* Dropping is an enhancement. The native input below is the path that always works (WCAG 2.5.7). */}',
    endAnchor: '<span className={styles.dropText}>or drop them here</span>',
    topic: 'semantics',
    title: 'The native input is the primary path; drop is the shortcut',
    rationale:
      'A real <input type="file"> keeps keyboard, voice control and the OS picker for free. It is visually hidden, not display:none, so it stays focusable, and its label is styled as the button. The drop handlers sit on the surrounding box as a pointer shortcut. That single-pointer alternative is what WCAG 2.5.7 Dragging Movements asks for. Resetting value lets users pick the same file again after removing it.',
    wcag: ['2.5.7', '2.1.1', '4.1.2'],
  },
  {
    id: 'named-actions',
    anchor: '<button type="button" className={styles.action} onClick={() => remove(item.id)}',
    endAnchor: "{item.status === 'uploading' ? 'Cancel' : 'Remove'}",
    topic: 'semantics',
    title: 'Cancel, Retry and Remove say which file',
    rationale:
      'In a list of buttons, five identical "Remove" entries are useless. aria-label adds the file name. The same button reads Cancel while a file is in flight and Remove afterward, because that is what it does in each state.',
    wcag: ['2.4.6', '4.1.2'],
  },
  {
    id: 'focus-ring',
    file: 'styles',
    anchor: '.visuallyHidden:focus-visible + .chooseButton {',
    endAnchor: '}',
    topic: 'styling',
    title: 'The visible label shows the hidden input\'s focus',
    rationale:
      'Keyboard focus lands on the visually hidden input, so the ring is drawn on its adjacent label. Without this rule the button looks unfocused while it is the active element.',
    wcag: ['2.4.7'],
  },
];
