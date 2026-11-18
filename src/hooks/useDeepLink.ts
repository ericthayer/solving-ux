import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { Pattern } from '../types/pattern';
import { patternPath } from '../utils/slug';
import { useCopyToClipboard } from './useCopyToClipboard';
import type { CopyStatus } from './useCopyToClipboard';

/** Absolute, shareable URL for a pattern (keeping the open tab), or for the current page. */
export function useDeepLink(pattern?: Pattern | null): { url: string; copyLink: () => Promise<boolean>; status: CopyStatus } {
  const location = useLocation();
  const { status, copy } = useCopyToClipboard();

  const url = useMemo(() => {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    if (!pattern) return `${origin}${location.pathname}${location.search}`;
    const tab = new URLSearchParams(location.search).get('tab');
    return `${origin}${patternPath(pattern)}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`;
  }, [pattern, location.pathname, location.search]);

  return { url, status, copyLink: () => copy(url) };
}
