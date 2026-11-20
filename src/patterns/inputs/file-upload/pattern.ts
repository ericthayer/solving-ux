import type { PatternDefinition } from '../../../types/pattern';
import Demo from './demo';
import Before from './before';

export const fileUploadPattern: PatternDefinition = {
  id: 'inputs.file-upload',
  slug: 'file-upload',
  title: 'File upload with drag-and-drop alternative',
  summary: 'Native file picker with drop as an enhancement, limits stated up front, per-file progress, cancel, retry and remove, and one polite summary of the batch.',
  category: 'inputs',
  tags: ['forms', 'file upload', 'drag and drop', 'progress', 'error recovery', 'WCAG 2.2'],
  clients: ['client-a', 'client-b'],
  problemStatement:
    'Users attach invoices, contracts and spreadsheet imports, often several files at once with type and size limits. The audited uploader is a dashed box that only accepts dragged files. The limits appear only after an upload fails, one oversized file rejects the whole batch with "Upload failed", and the only feedback while sending is a spinner nobody announces. Once a file is attached, it cannot be removed or canceled.',
  beforeState: {
    summary: 'Drag-only drop zone with batch-level, after-the-fact validation.',
    failures: [
      {
        id: 'drag-only',
        description: 'Files can only be dragged in or clicked on a div. Keyboard, switch and voice users cannot add a file, and the target has no role or name.',
        refs: [{ kind: 'wcag', criterion: '2.5.7' }, { kind: 'wcag', criterion: '2.1.1' }, { kind: 'wcag', criterion: '4.1.2' }],
        target: { label: 'Drop zone' },
      },
      {
        id: 'hidden-limits',
        description: 'Accepted types, size limit and file count are not stated before upload.',
        refs: [{ kind: 'wcag', criterion: '3.3.2' }, { kind: 'heuristic', id: 'H5' }],
        target: { label: 'Drop zone instructions' },
      },
      {
        id: 'batch-fails',
        description: 'One bad file fails the whole batch, and the message does not say which file or why.',
        refs: [{ kind: 'wcag', criterion: '3.3.1' }, { kind: 'wcag', criterion: '3.3.3' }, { kind: 'heuristic', id: 'H9' }],
        target: { label: '"Upload failed" message', revealedBy: 'Upload several files where one is over 2 MB or not a PDF' },
      },
      {
        id: 'silent-spinner',
        description: 'Progress is an unlabelled spinner. Nothing is announced when the upload starts, finishes or fails.',
        refs: [{ kind: 'wcag', criterion: '4.1.3' }, { kind: 'heuristic', id: 'H1' }],
        target: { label: 'Spinner', revealedBy: 'Click the drop zone and choose a file' },
      },
      {
        id: 'no-undo',
        description: 'An upload cannot be canceled, and an attached file cannot be removed or retried.',
        refs: [{ kind: 'heuristic', id: 'H3' }],
        target: { label: 'Attached file list', revealedBy: 'Upload a PDF under 2 MB' },
      },
    ],
  },
  designRationale:
    'The native file input is the primary path because it works with every input method and opens the OS picker, which already supports keyboard, voice and recent files. It is visually hidden behind its own label, styled as a button, so it keeps native semantics and focus. Dropping files is a pointer shortcut layered on top, which satisfies WCAG 2.5.7. Limits are written under the label before anyone picks a file. Each file is validated and uploaded on its own, so one oversized scan never blocks the rest of the batch, and every error names the file and the fix. A single polite status sentence ("2 of 3 uploaded, 1 failed.") replaces per-percent announcements, which would flood a screen reader. Cancel, Retry and Remove carry the file name, and removing a row moves focus to the next row instead of dropping it to the page.',
  component: Demo,
  beforeComponent: Before,
  props: [
    { name: 'label', type: 'string', required: true, description: 'Group label, rendered as the fieldset legend, e.g. "Supporting documents".' },
    { name: 'accept', type: 'string[]', required: true, description: 'Lowercase extensions with the dot. Drives the input accept attribute, validation, and the stated limits.' },
    { name: 'maxSizeBytes', type: 'number', required: true, description: 'Per-file size limit. Larger files are listed as not added, with the limit in the message.' },
    { name: 'maxFiles', type: 'number', required: false, description: 'Most files that can be attached at once. Rejected files do not count.' },
    { name: 'upload', type: '(file: File, ctx: { signal: AbortSignal; onProgress: (percent: number) => void }) => Promise<void>', required: true, description: 'Sends one file. Pass signal to fetch so Cancel aborts it. Reject with an Error whose message says what happened.' },
    { name: 'onUploadedChange', type: '(files: File[]) => void', required: false, description: 'Receives every successfully uploaded file whenever that list changes. Use it to enable the form submit.' },
    { name: 'ref', type: 'Ref<{ addFiles(files: File[]): void }>', required: false, description: 'Adds files programmatically, e.g. from a paste handler. They go through the same validation.' },
  ],
  usage: `<FileUpload
  label="Supporting documents"
  accept={['.pdf', '.csv', '.xlsx']}
  maxSizeBytes={10 * 1024 * 1024}
  maxFiles={5}
  upload={(file, { signal, onProgress }) => api.uploadAttachment(file, { signal, onProgress })}
  onUploadedChange={setAttachments}
/>`,
  accessibilityNotes: [
    { kind: 'wcag', criterion: '2.5.7', level: 'AA', title: 'Dragging movements', detail: 'Every file that can be dropped can also be added with the Choose files button, using a single click or Enter.' },
    { kind: 'wcag', criterion: '3.3.2', level: 'A', title: 'Labels or instructions', detail: 'Types, size and count limits are visible below the legend and attached to the group with aria-describedby.' },
    { kind: 'wcag', criterion: '3.3.1', level: 'A', title: 'Error identification', detail: 'Each rejected or failed file has its own row with a text error that names the file and the fix.' },
    { kind: 'wcag', criterion: '4.1.3', level: 'AA', title: 'Status messages', detail: 'role="status" summarizes the batch without moving focus. It changes when a file finishes, not on every progress tick.' },
    { kind: 'wcag', criterion: '1.4.1', level: 'A', title: 'Use of color', detail: 'Error rows add a thick left border and a "!" prefix. The drag-over state turns the dashed border solid.' },
    { kind: 'keyboard', keys: 'Tab', action: 'Focuses Choose files, then each row\'s Retry, Cancel or Remove button.' },
    { kind: 'keyboard', keys: 'Enter / Space', action: 'On Choose files, opens the system file picker.' },
    { kind: 'aria', attribute: 'fieldset + legend', detail: 'Groups the picker and file list so "Choose files" is read in the context of "Supporting documents".' },
    { kind: 'aria', attribute: '<progress aria-label>', detail: 'Each uploading file has a native progressbar named "<file> upload progress".' },
    { kind: 'screen-reader', title: 'Removing a file', detail: 'Focus moves to the next row\'s first button, or back to Choose files when the list is empty.' },
  ],
  wcagLevel: 'AA',
  lastUpdated: '2026-11-20',
  author: 'Design System Team',
};
