import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const client = process.env.VITE_CLIENT ?? '';

/**
 * Client builds: blank out each pattern's `clients` list, so a client bundle never carries another
 * client's id. gen-sources has already dropped out-of-scope patterns, so the list is not needed at runtime.
 */
function stripClientAttribution(): Plugin {
  return {
    name: 'sux-strip-client-attribution',
    enforce: 'pre',
    transform(code, id) {
      if (!client || !/\/src\/patterns\/[^/]+\/[^/]+\/pattern\.ts$/.test(id)) return null;
      return { code: code.replace(/clients:\s*\[[^\]]*\]/, 'clients: []'), map: null };
    },
  };
}

export default defineConfig({
  plugins: [stripClientAttribution(), react()],
  define: { __TEAM_BUILD__: JSON.stringify(client === '') },
  css: { modules: { localsConvention: 'camelCaseOnly' } },
});
