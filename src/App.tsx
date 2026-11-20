import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { EditorProvider } from './context/EditorContext';
import { PatternProvider } from './context/PatternContext';
import { ToastProvider } from './patterns/notifications/toast-stack/ToastStack';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Detail and editor routes carry the syntax highlighter and editor forms; load them on demand.
const PatternPage = lazy(() => import('./pages/PatternPage').then((m) => ({ default: m.PatternPage })));
// Editor routes exist only in the team build; the import is compiled out of client builds.
const editorOnly = <T,>(load: () => Promise<T>): Promise<T> => (__TEAM_BUILD__ ? load() : Promise.reject(new Error('Editor is not available in this build.')));
const EditorPage = lazy(() => editorOnly(() => import('./pages/EditorPage')).then((m) => ({ default: m.EditorPage })));
const WorksheetPage = lazy(() => import('./pages/WorksheetPage').then((m) => ({ default: m.WorksheetPage })));
const PatternEditorPage = lazy(() => editorOnly(() => import('./pages/PatternEditorPage')).then((m) => ({ default: m.PatternEditorPage })));

function Loading(): JSX.Element {
  return (
    <p role="status" className="text-sm text-muted">
      Loading…
    </p>
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="patterns/:category/:slug" element={<PatternPage />} />
          <Route path="worksheet" element={<WorksheetPage />} />
          {__TEAM_BUILD__ && (
            <>
              <Route path="editor" element={<EditorPage />} />
              <Route path="editor/new" element={<PatternEditorPage />} />
              <Route path="editor/:id" element={<PatternEditorPage />} />
            </>
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export function App({ canEdit }: { canEdit?: boolean }): JSX.Element {
  return (
    <EditorProvider canEdit={canEdit}>
      <PatternProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </PatternProvider>
    </EditorProvider>
  );
}
