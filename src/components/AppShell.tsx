import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEditor } from '../context/EditorContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell(): JSX.Element {
  const [navOpen, setNavOpen] = useState(false);
  const { editorMode } = useEditor();
  const location = useLocation();
  const firstRender = useRef(true);

  // Move focus to main content on route change so screen reader users land on the new page.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }, [location.pathname]);

  return (
    <div className={`min-h-screen ${editorMode ? 'border-t-4 border-[var(--color-editor)]' : ''}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-canvas"
      >
        Skip to content
      </a>
      <TopBar navOpen={navOpen} onToggleNav={() => setNavOpen((o) => !o)} />
      <div className="md:grid md:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside
          id="pattern-sidebar"
          aria-label="Pattern browser"
          className={`${navOpen ? 'block' : 'hidden'} border-b border-line bg-surface md:sticky md:top-[3.25rem] md:block md:h-[calc(100vh-3.25rem)] md:overflow-y-auto md:border-b-0 md:border-r`}
        >
          <Sidebar onNavigate={() => setNavOpen(false)} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
