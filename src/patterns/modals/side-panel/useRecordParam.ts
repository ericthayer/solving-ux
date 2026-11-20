import { useCallback, useEffect, useState } from 'react';

const readParam = (name: string): string | null => new URLSearchParams(window.location.search).get(name);

/**
 * Keeps the open record in the URL (`?record=WO-1042`) so it survives reload and can be shared.
 * Uses replaceState so opening records does not fill the Back stack, and keeps history.state
 * intact for whichever router owns the page.
 */
export function useRecordParam(name = 'record'): [string | null, (next: string | null) => void] {
  const [value, setValue] = useState<string | null>(() => readParam(name));

  useEffect(() => {
    const onPopState = (): void => setValue(readParam(name));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [name]);

  const update = useCallback(
    (next: string | null): void => {
      const url = new URL(window.location.href);
      if (next === null) url.searchParams.delete(name);
      else url.searchParams.set(name, next);
      window.history.replaceState(window.history.state, '', url);
      setValue(next);
    },
    [name],
  );

  return [value, update];
}
