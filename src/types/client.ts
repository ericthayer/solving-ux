/**
 * Clients are opaque ids. Real client names never appear in source, builds, or exports:
 * each client is served from its own build under an unlisted path (see scripts/build-clients.mjs).
 */
export const CLIENT_IDS = ['client-a', 'client-b'] as const;
export type ClientId = (typeof CLIENT_IDS)[number];

/** Labels for the unscoped team build only. Client builds never render client attribution. */
export const CLIENT_LABELS: Record<ClientId, string> = { 'client-a': 'Client A', 'client-b': 'Client B' };

export const isClientId = (value: unknown): value is ClientId => CLIENT_IDS.includes(value as ClientId);
