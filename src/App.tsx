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
const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })));
const PatternEditorPage = lazy(() => import('./pages/PatternEditorPage').then((m) => ({ default: m.PatternEditorPage })));

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
          <Route path="editor" element={<EditorPage />} />
          <Route path="editor/new" element={<PatternEditorPage />} />
          <Route path="editor/:id" element={<PatternEditorPage />} />
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
