import { isClientId } from './types/client';
import type { ClientId } from './types/client';

/** Build-time flag. Design system team builds set VITE_ENABLE_EDITOR=true. */
export const editorEnabled: boolean = import.meta.env.VITE_ENABLE_EDITOR === 'true';

/**
 * Build-time client scope. Set by scripts/build-clients.mjs for each client build; unset for the
 * unscoped team build (local dev and Editor Mode). When set, the bundle holds only that client's
 * patterns and the UI drops every client attribution.
 */
const rawClient = import.meta.env.VITE_CLIENT;
export const activeClient: ClientId | null = isClientId(rawClient) ? rawClient : null;

/** Path prefix the app is served under: '' for the root, '/<path>' for a client build. Used for absolute links. */
export const basePath: string = import.meta.env.BASE_URL.replace(/\/$/, '');
