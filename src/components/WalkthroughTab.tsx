import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Pattern } from '../types/pattern';
import type { CodeAnnotation } from '../types/walkthrough';
import { resolveWalkthrough } from '../utils/walkthrough';
import { CodeWalkthrough } from './CodeWalkthrough';

/** Binds the walkthrough's active step to `?step=` so every step is a shareable deep link. */
export function WalkthroughTab({ pattern, annotations }: { pattern: Pattern; annotations: CodeAnnotation[] }): JSX.Element {
  const [params, setParams] = useSearchParams();
  const { steps } = useMemo(
    () => resolveWalkthrough(annotations, { component: pattern.code, styles: pattern.styles }),
    [annotations, pattern.code, pattern.styles],
  );
  return (
    <CodeWalkthrough
      steps={steps}
      sources={{ component: pattern.code, styles: pattern.styles }}
      filenames={{ component: pattern.files.component, styles: pattern.files.styles }}
      activeId={params.get('step')}
      onActiveChange={(id) => setParams({ tab: 'walkthrough', step: id }, { replace: true })}
    />
  );
}
