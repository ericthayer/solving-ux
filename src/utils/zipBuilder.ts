import type { Pattern } from '../types/pattern';
import { buildReadme } from './readme';

export type ZipEntry = { path: string; content: string };

export function zipEntries(pattern: Pattern): ZipEntry[] {
  const root = pattern.slug;
  const entries: ZipEntry[] = [
    { path: `${root}/${pattern.files.component}`, content: pattern.code },
    { path: `${root}/${pattern.files.test}`, content: pattern.testCode },
    { path: `${root}/README.md`, content: buildReadme(pattern) },
  ];
  if (pattern.files.styles && pattern.styles) {
    entries.splice(1, 0, { path: `${root}/${pattern.files.styles}`, content: pattern.styles });
  }
  return entries;
}

export async function buildPatternZip(pattern: Pattern): Promise<Blob> {
  // Loaded on demand so read-only browsing never downloads the ZIP library.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zipEntries(pattern).forEach((entry) => zip.file(entry.path, entry.content));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
