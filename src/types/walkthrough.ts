/** Which pattern file an annotation points into. */
export type WalkthroughFile = 'component' | 'styles';

/** What a step teaches. Drives the label shown next to the step title. */
export type WalkthroughTopic = 'semantics' | 'state' | 'focus' | 'announce' | 'resilience' | 'performance' | 'styling';

/**
 * One annotated span of source. Anchors are text, not line numbers, so edits above a span
 * do not silently point it at the wrong code. `npm test` fails when an anchor stops matching.
 */
export type CodeAnnotation = {
  id: string;
  /** Defaults to "component". */
  file?: WalkthroughFile;
  /** Text that appears on exactly one line of the file: the first line of the span. */
  anchor: string;
  /** Text on the last line of the span, matched at or after the anchor line. Omit for one line. */
  endAnchor?: string;
  topic: WalkthroughTopic;
  title: string;
  /** Why the code is written this way, and what failure it prevents. */
  rationale: string;
  /** WCAG success criteria this span satisfies, e.g. ["1.3.1", "4.1.3"]. */
  wcag?: string[];
};

export type ResolvedAnnotation = CodeAnnotation & {
  file: WalkthroughFile;
  /** 1-based, inclusive. */
  start: number;
  end: number;
};
