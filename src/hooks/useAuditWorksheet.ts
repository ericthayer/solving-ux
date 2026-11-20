import { basePath } from '../appConfig';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_WORKSHEET } from '../types/worksheet';
import type { Finding, FindingDraft, Worksheet, WorksheetMeta } from '../types/worksheet';
import { parseWorksheet } from '../utils/worksheet';

// Client builds share one origin; each keeps its own worksheet.
export const WORKSHEET_STORAGE_KEY = `solving-ux:audit-worksheet${basePath}`;

export type AuditWorksheetApi = {
  sheet: Worksheet;
  /** False when the browser blocks storage; work survives only until the tab closes. */
  persisted: boolean;
  setMeta: (meta: Partial<WorksheetMeta>) => void;
  add: (draft: FindingDraft) => Finding;
  update: (id: string, draft: FindingDraft) => void;
  remove: (id: string) => { finding: Finding; index: number } | null;
  restore: (finding: Finding, index: number) => void;
  clear: () => void;
};

function read(): Worksheet {
  try {
    return parseWorksheet(localStorage.getItem(WORKSHEET_STORAGE_KEY));
  } catch {
    return EMPTY_WORKSHEET;
  }
}

let counter = 0;
const newId = (): string => `f-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;

/** Worksheet state, saved to localStorage after every change. */
export function useAuditWorksheet(): AuditWorksheetApi {
  const [sheet, setSheet] = useState<Worksheet>(read);
  const [persisted, setPersisted] = useState(true);
  const sheetRef = useRef(sheet);
  sheetRef.current = sheet;

  useEffect(() => {
    try {
      localStorage.setItem(WORKSHEET_STORAGE_KEY, JSON.stringify(sheet));
      setPersisted(true);
    } catch {
      setPersisted(false);
    }
  }, [sheet]);

  const setMeta = useCallback((meta: Partial<WorksheetMeta>) => setSheet((s) => ({ ...s, ...meta })), []);

  const add = useCallback((draft: FindingDraft): Finding => {
    const finding: Finding = { ...draft, id: newId(), createdAt: new Date().toISOString() };
    setSheet((s) => ({ ...s, findings: [...s.findings, finding] }));
    return finding;
  }, []);

  const update = useCallback((id: string, draft: FindingDraft) => {
    setSheet((s) => ({ ...s, findings: s.findings.map((f) => (f.id === id ? { ...f, ...draft } : f)) }));
  }, []);

  const remove = useCallback((id: string) => {
    const index = sheetRef.current.findings.findIndex((f) => f.id === id);
    const finding = sheetRef.current.findings[index];
    if (!finding) return null;
    setSheet((s) => ({ ...s, findings: s.findings.filter((f) => f.id !== id) }));
    return { finding, index };
  }, []);

  const restore = useCallback((finding: Finding, index: number) => {
    setSheet((s) => {
      if (s.findings.some((f) => f.id === finding.id)) return s;
      const findings = [...s.findings];
      findings.splice(Math.min(index, findings.length), 0, finding);
      return { ...s, findings };
    });
  }, []);

  const clear = useCallback(() => setSheet(EMPTY_WORKSHEET), []);

  return { sheet, persisted, setMeta, add, update, remove, restore, clear };
}
