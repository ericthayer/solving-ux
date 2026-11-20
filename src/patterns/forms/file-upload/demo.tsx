import { useRef, useState } from 'react';
import { FileUpload } from './FileUpload';
import type { FileUploadHandle, UploadContext } from './FileUpload';
import demo from '../../demo.module.css';
import { useStressTest } from '../../stress';

const MB = 1024 * 1024;

const sample = (name: string, bytes: number): File => new File([new Uint8Array(bytes)], name);

/** Simulated network: progress ticks, honors Cancel, and drops the second file's first attempt. */
function useFakeUpload(): (file: File, context: UploadContext) => Promise<void> {
  const attempts = useRef(0);
  return (_file, { signal, onProgress }) => {
    const attempt = ++attempts.current;
    return new Promise<void>((resolve, reject) => {
      let percent = 0;
      const timer = setInterval(() => {
        percent += 20;
        onProgress(percent);
        if (attempt === 2 && percent >= 60) {
          clearInterval(timer);
          reject(new Error('The connection dropped at 60%'));
        } else if (percent >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
      signal.addEventListener('abort', () => clearInterval(timer));
    });
  };
}

export default function FileUploadDemo(): JSX.Element {
  const stress = useStressTest(['longText']);
  const upload = useFakeUpload();
  const uploader = useRef<FileUploadHandle>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const addSamples = (): void =>
    uploader.current?.addFiles([
      sample(`${stress.text('supplier-invoices-q3')}.pdf`, 1.2 * MB),
      sample('approved-vendor-list.csv', 40 * 1024),
      sample('site-photo.heic', 2 * MB),
      sample('signed-contract-scan.pdf', 14 * MB),
    ]);

  return (
    <div className={demo.stack}>
      <FileUpload
        ref={uploader}
        label={stress.text('Supporting documents')}
        accept={['.pdf', '.csv', '.xlsx']}
        maxSizeBytes={10 * MB}
        maxFiles={5}
        upload={upload}
        onUploadedChange={(files) => setUploaded(files.map((f) => f.name))}
      />
      <section className={`${demo.panel} ${demo.stack}`} aria-labelledby="file-upload-samples">
        <div>
          <h3 id="file-upload-samples" className={demo.panelTitle}>No files handy?</h3>
          <p className={demo.panelText}>Adds four sample files: two valid, one of the wrong type, one too large. The second upload fails once so you can retry it.</p>
        </div>
        <div className={demo.row}>
          <button type="button" className={demo.button} onClick={addSamples}>
            Add sample files
          </button>
        </div>
      </section>
      {uploaded.length > 0 && <pre className={demo.log}>{JSON.stringify({ uploaded }, null, 2)}</pre>}
    </div>
  );
}
