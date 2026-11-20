/**
 * Screen reader transcripts: what a user hears, step by step, in the audited
 * build (before) versus the solved pattern (after). Each pattern folder owns
 * its transcript in transcript.ts; src/patterns/transcripts.ts indexes them.
 */

/** One thing the screen reader does in response to a step. */
export type Utterance =
  /** Spoken output, written the way NVDA reads it (name, role, state, description). */
  | { kind: 'speech'; text: string }
  /** Nothing is announced. `note` says what the user is left not knowing. */
  | { kind: 'silence'; note: string };

export type TranscriptStep = {
  /** What the user does, in plain language. */
  action: string;
  /** Keys pressed, if the step is keyboard-driven. */
  keys?: string;
  before: Utterance[];
  after: Utterance[];
  /** Why the before output fails the user. Omit when before is merely worse, not broken. */
  failure?: string;
  /** WCAG success criterion the before output fails, e.g. "4.1.2". */
  criterion?: string;
};

export type ScreenReaderTranscript = {
  /** Pattern id this transcript belongs to, e.g. "data-table.bulk-actions". */
  patternId: string;
  /** Screen reader and browser the wording is modeled on. */
  environment: string;
  steps: TranscriptStep[];
};
