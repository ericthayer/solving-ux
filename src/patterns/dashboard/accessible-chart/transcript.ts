import type { ScreenReaderTranscript } from '../../../types/transcript';

export const accessibleChartTranscript: ScreenReaderTranscript = {
  patternId: 'dashboard.accessible-chart',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Read down the page to the chart',
      keys: 'Down Arrow',
      before: [
        { kind: 'speech', text: 'PO approval time' },
        { kind: 'speech', text: 'Download PNG, button' },
        { kind: 'silence', note: 'The SVG has no name or role, so it is skipped. Nothing says a chart is there.' },
      ],
      after: [
        { kind: 'speech', text: 'Purchase order approval time, figure, heading level 3' },
        { kind: 'speech', text: 'Approvals over $100k slowed from about 6 days to 11.2 days since June. Smaller orders held steady.' },
      ],
      failure: 'The user never learns the chart exists, let alone what it shows.',
      criterion: '1.1.1',
    },
    {
      action: 'Tab into the chart',
      keys: 'Tab',
      before: [{ kind: 'silence', note: 'Focus jumps past the chart. Values exist only in a hover tooltip.' }],
      after: [
        { kind: 'speech', text: 'Purchase order approval time, chart, grouping. Tab to the chart, then use arrow keys to read each point.' },
        { kind: 'speech', text: 'Under $10k, grouping. Under $10k, Dec 2025: 2.1 days, 1 of 12, graphic' },
      ],
      failure: 'Keyboard and screen reader users cannot reach a single value.',
      criterion: '2.1.1',
    },
    {
      action: 'Move to the series that matters',
      keys: 'Down Arrow, Down Arrow, End',
      before: [{ kind: 'silence', note: 'No way to tell the series apart except color.' }],
      after: [
        { kind: 'speech', text: 'Over $100k, grouping. Over $100k, Dec 2025: 6.1 days, 1 of 12, graphic' },
        { kind: 'speech', text: 'Over $100k, Nov 2026: 11.2 days, 12 of 12, graphic' },
      ],
      failure: 'Series are told apart by red and green alone, so even sighted color-blind users cannot pick the right line.',
      criterion: '1.4.1',
    },
    {
      action: 'Switch to the table view',
      keys: 'Shift+Tab, Right Arrow',
      before: [{ kind: 'silence', note: 'The only export is a PNG image. There is no table.' }],
      after: [
        { kind: 'speech', text: 'View Purchase order approval time as, grouping. Table, radio button, checked, 2 of 2' },
      ],
      failure: 'Exact values are locked inside an image.',
      criterion: '1.3.1',
    },
    {
      action: 'Read a value in the table',
      keys: 'T, Ctrl+Alt+Down Arrow',
      before: [{ kind: 'silence', note: 'Nothing to read.' }],
      after: [
        { kind: 'speech', text: 'Purchase order approval time, Average days to approve, table with 13 rows and 4 columns' },
        { kind: 'speech', text: 'Row 13, Nov 2026, Over $100k, column 4, 11.2 days' },
      ],
    },
  ],
};
