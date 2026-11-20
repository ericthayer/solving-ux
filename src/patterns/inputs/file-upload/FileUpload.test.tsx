import { createRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FileUpload, describeRules, summarize, validateFile } from './FileUpload';
import type { FileUploadHandle, UploadContext, UploadItem } from './FileUpload';

expect.extend(toHaveNoViolations);

const MB = 1024 * 1024;
const rules = { accept: ['.pdf', '.csv'], maxSizeBytes: 2 * MB, maxFiles: 3 };
const file = (name: string, bytes = 1024): File => new File([new Uint8Array(bytes)], name);

type Pending = { file: File; ctx: UploadContext; resolve: () => void; reject: (e: Error) => void };

/** Upload double: each call waits until the test settles it. */
function controlledUpload() {
  const calls: Pending[] = [];
  const upload = jest.fn(
    (f: File, ctx: UploadContext) => new Promise<void>((resolve, reject) => calls.push({ file: f, ctx, resolve, reject })),
  );
  return { upload, calls };
}

function setup(props: Partial<Parameters<typeof FileUpload>[0]> = {}) {
  const user = userEvent.setup({ applyAccept: false });
  const { upload, calls } = controlledUpload();
  const onUploadedChange = jest.fn();
  const ref = createRef<FileUploadHandle>();
  const utils = render(<FileUpload ref={ref} label="Supporting documents" {...rules} upload={upload} onUploadedChange={onUploadedChange} {...props} />);
  const input = screen.getByLabelText('Choose files') as HTMLInputElement;
  return { ...utils, user, upload, calls, onUploadedChange, ref, input };
}

describe('validateFile and summarize', () => {
  it('names the file and the fix for each rule', () => {
    expect(validateFile(file('photo.HEIC'), rules, [])).toBe('photo.HEIC is not a PDF or CSV file. Choose a file of an accepted type.');
    expect(validateFile(file('scan.pdf', 3 * MB), rules, [])).toBe('scan.pdf is 3 MB. Choose a file of 2 MB or less.');
    expect(validateFile(file('blank.csv', 0), rules, [])).toBe('blank.csv is empty. Choose a file with content.');
    expect(validateFile(file('a.pdf'), rules, [file('a.pdf')])).toBe('a.pdf is already attached.');
    expect(validateFile(file('d.pdf'), rules, [file('a.pdf'), file('b.pdf'), file('c.pdf')])).toMatch(/3 files at most/);
    expect(validateFile(file('Report.PDF'), rules, [])).toBeNull();
  });

  it('states limits before upload', () => {
    expect(describeRules(rules)).toBe('PDF or CSV. Up to 2 MB each, 3 files at most.');
    expect(describeRules({ accept: ['.xlsx'], maxSizeBytes: 500 * 1024 })).toBe('XLSX. Up to 500 KB each.');
  });

  it('summarizes a mixed batch in one sentence', () => {
    const f = file('x.pdf');
    const items: UploadItem[] = [
      { id: '1', file: f, status: 'done' },
      { id: '2', file: f, status: 'done' },
      { id: '3', file: f, status: 'failed', error: 'x' },
      { id: '4', file: f, status: 'rejected', error: 'x' },
    ];
    expect(summarize(items)).toBe('2 of 3 uploaded, 1 failed, 1 not added.');
    expect(summarize([{ id: '1', file: f, status: 'uploading', progress: 10 }])).toBe('0 of 1 uploaded, 1 in progress.');
    expect(summarize([])).toBe('');
  });
});

describe('FileUpload', () => {
  it('is a labelled group with a keyboard-reachable picker and the limits attached', async () => {
    const { user, input } = setup();
    const group = screen.getByRole('group', { name: 'Supporting documents' });
    expect(group).toHaveAccessibleDescription('PDF or CSV. Up to 2 MB each, 3 files at most.');
    expect(input).toHaveAttribute('accept', '.pdf,.csv');
    await user.tab();
    expect(input).toHaveFocus();
  });

  it('uploads valid files independently while rejecting bad ones with a reason', async () => {
    const { user, input, calls, onUploadedChange } = setup();
    await user.upload(input, [file('invoice.pdf'), file('huge.pdf', 5 * MB), file('vendors.csv')]);

    expect(calls.map((c) => c.file.name)).toEqual(['invoice.pdf', 'vendors.csv']);
    expect(screen.getByRole('status')).toHaveTextContent('0 of 2 uploaded, 2 in progress, 1 not added.');
    expect(screen.getByText('huge.pdf is 5 MB. Choose a file of 2 MB or less.')).toBeInTheDocument();

    act(() => calls[0]!.ctx.onProgress(40));
    expect(screen.getByRole('progressbar', { name: 'invoice.pdf upload progress' })).toHaveAttribute('value', '40');

    await act(async () => calls[0]!.resolve());
    await act(async () => calls[1]!.reject(new Error('The connection dropped')));
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 uploaded, 1 failed, 1 not added.');
    expect(screen.getByText('The connection dropped. Select Retry to try vendors.csv again.')).toBeInTheDocument();
    expect(onUploadedChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'invoice.pdf' })]);
  });

  it('retries a failed file', async () => {
    const { user, input, calls } = setup();
    await user.upload(input, file('vendors.csv'));
    await act(async () => calls[0]!.reject(new Error('Timed out')));
    await user.click(screen.getByRole('button', { name: 'Retry vendors.csv' }));
    expect(calls).toHaveLength(2);
    await act(async () => calls[1]!.resolve());
    expect(screen.getByRole('status')).toHaveTextContent('1 of 1 uploaded.');
  });

  it('cancels an in-flight upload by aborting its signal', async () => {
    const { user, input, calls } = setup();
    await user.upload(input, file('invoice.pdf'));
    await user.click(screen.getByRole('button', { name: 'Cancel invoice.pdf' }));
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
    await act(async () => calls[0]!.reject(new Error('aborted')));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('moves focus to the next row after Remove, then back to the picker', async () => {
    const { user, input } = setup();
    await user.upload(input, [file('a.exe'), file('b.exe')]);
    const list = screen.getByRole('list', { name: 'Supporting documents, 2 files' });
    await user.click(within(list).getByRole('button', { name: 'Remove a.exe' }));
    expect(screen.getByRole('button', { name: 'Remove b.exe' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Remove b.exe' }));
    expect(input).toHaveFocus();
  });

  it('accepts dropped files as an enhancement and counts only kept files toward the limit (edge case)', () => {
    const { calls } = setup();
    const zone = screen.getByText('or drop them here').parentElement!;
    fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
    expect(zone).toHaveAttribute('data-dragging');
    fireEvent.drop(zone, { dataTransfer: { files: [file('a.pdf'), file('bad.txt'), file('b.pdf'), file('c.pdf'), file('d.pdf')] } });
    expect(zone).not.toHaveAttribute('data-dragging');
    expect(calls.map((c) => c.file.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(screen.getByText(/d\.pdf was not added\. You can attach 3 files at most/)).toBeInTheDocument();
  });

  it('adds files through the ref handle with the same validation', () => {
    const { ref, calls } = setup();
    act(() => ref.current!.addFiles([file('pasted.pdf')]));
    expect(calls.map((c) => c.file.name)).toEqual(['pasted.pdf']);
  });

  it('has no axe violations with mixed row states', async () => {
    const { container, user, input, calls } = setup();
    await user.upload(input, [file('ok.pdf'), file('bad.txt'), file('slow.csv')]);
    await act(async () => calls[0]!.resolve());
    expect(await axe(container)).toHaveNoViolations();
  });
});
