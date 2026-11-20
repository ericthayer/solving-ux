import type { ScreenReaderTranscript } from '../../../types/transcript';

export const fileUploadTranscript: ScreenReaderTranscript = {
  patternId: 'forms.file-upload',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Tab into the uploader',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'The drop zone is a div with no tabindex. Focus skips straight past it.' }],
      after: [
        { kind: 'speech', text: 'Supporting documents, grouping, PDF, CSV or XLSX. Up to 10 MB each, 5 files at most.' },
        { kind: 'speech', text: 'Choose files, button' },
      ],
      failure: 'A keyboard user cannot reach the only way to add a file.',
      criterion: '2.1.1',
    },
    {
      action: 'Open the file picker and choose four files',
      keys: 'Enter',
      before: [{ kind: 'silence', note: 'Unreachable. A mouse user who clicks the box gets an unlabelled spinner and hears nothing.' }],
      after: [{ kind: 'speech', text: '0 of 2 uploaded, 2 in progress, 2 not added.' }],
      failure: 'Nothing confirms the upload started, so users click again and send duplicates.',
      criterion: '4.1.3',
    },
    {
      action: 'Wait for the batch to finish',
      before: [{ kind: 'silence', note: 'The spinner disappears and a red line reads "Upload failed." No file was kept.' }],
      after: [{ kind: 'speech', text: '1 of 2 uploaded, 1 failed, 2 not added.' }],
      failure: 'One bad file discarded the valid ones, and the result was never announced.',
      criterion: '3.3.1',
    },
    {
      action: 'Move through the file list',
      keys: 'Down arrow',
      before: [{ kind: 'speech', text: 'Upload failed. Files must be PDF and under 2 MB.' }],
      after: [
        { kind: 'speech', text: 'Supporting documents, 4 files, list with 4 items' },
        { kind: 'speech', text: 'site-photo.heic, 2 MB, ! site-photo.heic is not a PDF, CSV or XLSX file. Choose a file of an accepted type.' },
      ],
      failure: 'The limits arrive only after the failure, and the message does not name the file that broke the batch.',
      criterion: '3.3.2',
    },
    {
      action: 'Retry the failed file',
      keys: 'Enter on "Retry"',
      before: [{ kind: 'silence', note: 'There is no Retry. The user must find and drag every file again.' }],
      after: [
        { kind: 'speech', text: 'Retry approved-vendor-list.csv, button' },
        { kind: 'speech', text: '2 of 2 uploaded, 2 not added.' },
      ],
    },
    {
      action: 'Remove a rejected file',
      keys: 'Enter on "Remove"',
      before: [{ kind: 'silence', note: 'Attached files cannot be removed.' }],
      after: [
        { kind: 'speech', text: 'Remove signed-contract-scan.pdf, button' },
        { kind: 'speech', text: '2 of 2 uploaded, 1 not added.' },
      ],
    },
  ],
};
