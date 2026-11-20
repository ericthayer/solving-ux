import '@testing-library/jest-dom';

// Tests run as the unscoped team build (see src/globals.d.ts).
(globalThis as { __TEAM_BUILD__?: boolean }).__TEAM_BUILD__ = true;
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
