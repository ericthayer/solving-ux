import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { editorEnabled } from '../appConfig';

type EditorContextValue = {
  /** True only for design system team builds (VITE_ENABLE_EDITOR=true). */
  canEdit: boolean;
  editorMode: boolean;
  setEditorMode: (on: boolean) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);
const STORAGE_KEY = 'solving-ux:editor-mode';

function readStored(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function EditorProvider({ children, canEdit = editorEnabled }: { children: ReactNode; canEdit?: boolean }): JSX.Element {
  const [mode, setMode] = useState<boolean>(() => canEdit && readStored());

  const setEditorMode = useCallback(
    (on: boolean) => {
      const next = canEdit && on;
      setMode(next);
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      } catch {
        // Storage can be blocked; mode still works for this page view.
      }
    },
    [canEdit],
  );

  const value = useMemo(() => ({ canEdit, editorMode: canEdit && mode, setEditorMode }), [canEdit, mode, setEditorMode]);
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error('useEditor must be used inside <EditorProvider>.');
  return value;
}
