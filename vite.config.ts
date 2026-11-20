import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Set by scripts/build-public.mjs for the published site. Unset for dev and the team build. */
const publicBuild = process.env.SUX_PUBLIC_BUILD === 'true';

/** Public build: blank out each pattern's `clients` list, so no client attribution ships. */
function stripClientAttribution(): Plugin {
  return {
    name: 'sux-strip-client-attribution',
    enforce: 'pre',
    transform(code, id) {
      if (!publicBuild || !/\/src\/patterns\/[^/]+\/[^/]+\/pattern\.ts$/.test(id)) return null;
      return { code: code.replace(/clients:\s*\[[^\]]*\]/, 'clients: []'), map: null };
    },
  };
}

export default defineConfig({
  plugins: [stripClientAttribution(), react()],
  define: { __TEAM_BUILD__: JSON.stringify(!publicBuild) },
  css: { modules: { localsConvention: 'camelCaseOnly' } },
});
