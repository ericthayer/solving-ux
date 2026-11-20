/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_ENABLE_EDITOR?: string;
  /** Opaque client id (src/types/client.ts). Set only by scripts/build-clients.mjs. */
  readonly VITE_CLIENT?: string;
}
