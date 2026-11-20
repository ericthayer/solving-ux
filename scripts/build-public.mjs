// Production build: one client-neutral site at the root with every pattern and no client attribution.
//
// Env (set in Netlify, never committed):
//   SUX_FORBIDDEN_TERMS  Comma list (real client names, internal app names). The build fails if any term
//                        appears as a whole word anywhere in dist/. Keeps the names out of the repo.
//   SUX_LEGACY_PATHS     Optional comma list of retired path slugs. Each 301-redirects to the same page at the root.
//
// Output: dist/ (the app), plus generated _redirects and _headers.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const SLUG = /^[a-z0-9][a-z0-9-]{7,63}$/;

function fail(message) {
  console.error(`build-public: ${message}`);
  process.exit(1);
}

const list = (raw) =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const forbidden = list(process.env.SUX_FORBIDDEN_TERMS).map((t) => t.toLowerCase());
const legacy = list(process.env.SUX_LEGACY_PATHS);
for (const slug of legacy) if (!SLUG.test(slug)) fail(`Legacy path "${slug}" must be 8-64 lowercase letters, digits, or dashes.`);

const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

// gen + tsc, then the public bundle with team-only code compiled out (vite.config.ts).
run('npm', ['run', '-s', 'typecheck']);
run('npx', ['vite', 'build', '--emptyOutDir'], { SUX_PUBLIC_BUILD: 'true', VITE_ENABLE_EDITOR: 'false' });

writeFileSync(
  join(dist, '_redirects'),
  [...legacy.flatMap((slug) => [`/${slug}  /  301!`, `/${slug}/*  /:splat  301!`]), '/*  /index.html  200', ''].join('\n'),
);

writeFileSync(
  join(dist, '_headers'),
  [
    '/*',
    '  X-Robots-Tag: noindex, nofollow, noarchive',
    '  Referrer-Policy: no-referrer',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n'),
);
writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

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
    if (file.endsWith('_redirects')) continue;
    const text = readFileSync(file, 'utf8');
    const hit = patterns.find(([, re]) => re.test(text))?.[0];
    if (hit) fail(`${label} found in ${file.slice(root.length)}. Remove it before publishing.`);
  }
}

// Team-only attribution must be compiled out (see __TEAM_BUILD__ in src/globals.d.ts).
assertAbsent(dist, ['client-a', 'client-b', 'client a', 'client b', 'observed in', 'seen in'], 'Team-only client attribution');
assertAbsent(dist, forbidden, 'A forbidden term');

console.log(`build-public: built the public site${forbidden.length ? `; scanned for ${forbidden.length} forbidden terms` : ''}${legacy.length ? `; ${legacy.length} legacy paths redirect to the root` : ''}.`);
