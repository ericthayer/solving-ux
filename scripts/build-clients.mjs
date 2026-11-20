// Production build: one isolated app per client, each under its own unlisted path, with nothing at the root
// that links, lists, or hints at them.
//
// Env (set in Netlify, never committed):
//   SUX_CLIENT_PATHS     "client-a=<path>,client-b=<path>". Paths are unguessable slugs, e.g. 12+ random chars.
//   SUX_FORBIDDEN_TERMS  Optional comma list (real client names, internal app names). The build fails if any
//                        appears anywhere in dist/. Keeps the names out of the repo while still guarding output.
//
// Output:
//   dist/index.html        neutral page, no links
//   dist/<path>/...        that client's app only (scripts/gen-sources.mjs drops every other client's pattern)
//   dist/_redirects        SPA fallback per client path; everything else 404s to the neutral page
//   dist/_headers          noindex + no-referrer everywhere, immutable caching for hashed assets
//   dist/robots.txt        disallow all, without naming any path
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const CLIENT_IDS = ['client-a', 'client-b'];
const SLUG = /^[a-z0-9][a-z0-9-]{7,63}$/;

function fail(message) {
  console.error(`build-clients: ${message}`);
  process.exit(1);
}

function parsePaths(raw) {
  if (!raw) fail('SUX_CLIENT_PATHS is not set. Expected "client-a=<path>,client-b=<path>".');
  const map = new Map();
  for (const pair of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [id, slug] = pair.split('=').map((s) => s.trim());
    if (!CLIENT_IDS.includes(id)) fail(`Unknown client id "${id}".`);
    if (!SLUG.test(slug ?? '')) fail(`Path for ${id} must be 8-64 lowercase letters, digits, or dashes.`);
    map.set(id, slug);
  }
  const missing = CLIENT_IDS.filter((id) => !map.has(id));
  if (missing.length) fail(`Missing a path for ${missing.join(', ')}.`);
  if (new Set(map.values()).size !== map.size) fail('Each client needs its own path.');
  return map;
}

const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Fails the build if any term shows up as a whole word in any file under dir (case-insensitive). */
function assertAbsent(dir, terms, label) {
  if (terms.length === 0) return;
  const patterns = terms.map((t) => [t, new RegExp(`(^|[^a-z0-9])${escape(t)}($|[^a-z0-9])`, 'i')]);
  for (const file of filesUnder(dir)) {
    const text = readFileSync(file, 'utf8');
    const hit = patterns.find(([, re]) => re.test(text))?.[0];
    if (hit) fail(`${label} found in ${file.slice(root.length)}. Remove it before publishing.`);
  }
}

const paths = parsePaths(process.env.SUX_CLIENT_PATHS);
const forbidden = (process.env.SUX_FORBIDDEN_TERMS ?? '')
  .split(',')
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

// Type-check the whole library once, unscoped.
run('npm', ['run', '-s', 'typecheck']);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

try {
  for (const [client, slug] of paths) {
    run('node', ['scripts/gen-sources.mjs'], { VITE_CLIENT: client });
    run('npx', ['vite', 'build', '--base', `/${slug}/`, '--outDir', `dist/${slug}`, '--emptyOutDir'], { VITE_CLIENT: client });
  }
} finally {
  // Leave the working tree with the unscoped catalog that dev and tests expect.
  run('node', ['scripts/gen-sources.mjs'], { VITE_CLIENT: '' });
}

writeFileSync(
  join(dist, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="referrer" content="no-referrer" />
    <title>Solving UX</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 1rem/1.5 system-ui, sans-serif; }
      main { padding: 1rem; text-align: center; }
      h1 { margin: 0; font-size: 1.125rem; font-weight: 600; }
      p { margin: 0.25rem 0 0; opacity: 0.7; }
    </style>
  </head>
  <body>
    <main>
      <h1>Solving UX</h1>
      <p>This library is shared by direct link.</p>
    </main>
  </body>
</html>
`,
);

writeFileSync(
  join(dist, '_redirects'),
  [...paths.values()].flatMap((slug) => [`/${slug}  /${slug}/index.html  200`, `/${slug}/*  /${slug}/index.html  200`]).join('\n') +
    '\n/*  /index.html  404\n',
);

writeFileSync(
  join(dist, '_headers'),
  [
    '/*',
    '  X-Robots-Tag: noindex, nofollow, noarchive',
    '  Referrer-Policy: no-referrer',
    ...[...paths.values()].flatMap((slug) => [`/${slug}/assets/*`, '  Cache-Control: public, max-age=31536000, immutable']),
    '',
  ].join('\n'),
);

writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

// Team-only attribution must be compiled out of every client app (see __TEAM_BUILD__ in src/globals.d.ts).
const TEAM_ONLY = [...CLIENT_IDS, 'client a', 'client b', 'observed in', 'seen in'];
for (const slug of paths.values()) assertAbsent(join(dist, slug), TEAM_ONLY, 'Team-only client attribution');

// Each client's output must not reference another client's path, and nothing may contain a forbidden term.
for (const [client, slug] of paths) {
  const others = [...paths].filter(([id]) => id !== client).map(([, s]) => s);
  assertAbsent(join(dist, slug), others, `Another client's path (from ${client}'s build)`);
}
assertAbsent(dist, forbidden, 'A forbidden term');

console.log(`build-clients: built ${paths.size} client apps${forbidden.length ? `; scanned for ${forbidden.length} forbidden terms` : ''}.`);
