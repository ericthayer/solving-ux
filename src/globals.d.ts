/**
 * Compile-time flag (vite.config.ts `define`). true for the unscoped team build, false for a client build.
 * Code behind `if (__TEAM_BUILD__)` is removed from client bundles, so client labels, the client filter,
 * and the editor never ship to a client URL.
 */
declare const __TEAM_BUILD__: boolean;
