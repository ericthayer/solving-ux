/**
 * Clients are opaque ids for the team build only. Real client names never appear in source, builds, or exports,
 * and the public build compiles all client attribution out (see scripts/build-public.mjs).
 */
export const CLIENT_IDS = ['client-a', 'client-b'] as const;
export type ClientId = (typeof CLIENT_IDS)[number];

/** Labels for the team build only. The public build never renders client attribution. */
export const CLIENT_LABELS: Record<ClientId, string> = { 'client-a': 'Client A', 'client-b': 'Client B' };

export const isClientId = (value: unknown): value is ClientId => CLIENT_IDS.includes(value as ClientId);
