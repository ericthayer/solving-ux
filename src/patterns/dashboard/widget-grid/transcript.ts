import type { ScreenReaderTranscript } from '../../../types/transcript';

export const widgetGridTranscript: ScreenReaderTranscript = {
  patternId: 'dashboard.widget-grid',
  environment: 'NVDA + Chrome',
  steps: [
    {
      action: 'Open the dashboard while data loads',
      before: [
        { kind: 'speech', text: 'graphic, spinner' },
        { kind: 'silence', note: 'One global spinner covers everything, including widgets that already loaded.' },
      ],
      after: [
        { kind: 'speech', text: 'Committed exposure, region, busy' },
        { kind: 'speech', text: 'Loading 30+ day delinquency' },
      ],
      failure: 'The user cannot tell what is loading, what has loaded, or how long to wait.',
      criterion: '4.1.3',
    },
    {
      action: 'List regions to scan the dashboard',
      keys: 'NVDA+F7, Landmarks',
      before: [{ kind: 'silence', note: 'No landmarks. Cards are unnamed divs, so the only option is reading line by line.' }],
      after: [
        { kind: 'speech', text: 'Portfolio health, Committed exposure, 30+ day delinquency, Covenant breaches, Largest relationships' },
      ],
      failure: 'Widgets have no names or structure, so they cannot be navigated directly.',
      criterion: '1.3.1',
    },
    {
      action: 'Read a KPI',
      keys: 'Down Arrow',
      before: [{ kind: 'speech', text: '0.42%, graphic' }],
      after: [{ kind: 'speech', text: 'Rate, 0.42%, Up 0.08 pts' }],
      failure: 'Direction and meaning are carried by a red arrow only.',
      criterion: '1.4.1',
    },
    {
      action: 'One service fails',
      before: [
        { kind: 'silence', note: 'The whole dashboard goes blank. No error is read.' },
      ],
      after: [
        { kind: 'speech', text: 'Covenant breaches did not load. The covenant service timed out.' },
      ],
      failure: 'A single failure removes data that loaded fine, with no explanation.',
      criterion: '4.1.3',
    },
    {
      action: 'Retry the failed widget',
      keys: 'Tab, Enter',
      before: [{ kind: 'silence', note: 'No retry control. The only recovery is reloading the page.' }],
      after: [
        { kind: 'speech', text: 'Retry loading Covenant breaches, button' },
        { kind: 'speech', text: 'Loading Covenant breaches' },
      ],
    },
  ],
};
