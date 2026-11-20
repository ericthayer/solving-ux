# Solving UX: Pattern Library & UI/UX Audit Platform

Internal pattern library that documents hard UI/UX failures observed in CoBank and ISW enterprise apps and ships the redesigned, accessible React component for each one, with tests, docs, and export.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Jest + React Testing Library + jest-axe
npm run typecheck
npm run build
```

Design system team builds expose Editor Mode:

```bash
VITE_ENABLE_EDITOR=true npm run dev
```

## What each pattern includes

| Piece | Where |
| --- | --- |
| Problem statement, before state, design rationale | `src/patterns/<category>/<slug>/pattern.ts` |
| Production component (copy-paste ready, no dependencies beyond React) | `<Component>.tsx` + `<Component>.module.css` |
| Tests: render, keyboard, ARIA, edge cases, axe | `<Component>.test.tsx` |
| Live demo used by the Preview tab | `demo.tsx` |
| Deliberately broken Before demo, shown by the Preview tab's Before/After toggle (`?demo=before`) | `before.tsx` (shared legacy styles in `src/patterns/before.module.css`) |
| Props docs, usage, accessibility notes (WCAG, keyboard, ARIA, screen reader) | `pattern.ts` |

`scripts/gen-sources.mjs` reads each pattern folder and writes `src/patterns/sources.generated.ts`, so the Code tab, Tests tab, ZIP, and JSON exports always show the exact files that run and pass tests. It runs automatically before `dev`, `build`, `test`, and `typecheck`.

## Audit failures as data

`beforeState.failures` is a list of structured `Failure` records, defined and documented in `src/types/failure.ts`:

| Field | Meaning |
| --- | --- |
| `id` | Kebab-case, unique within the pattern. Global key: `failureKey(pattern.id, id)`, e.g. `forms.wizard-validation#clears-data`. |
| `description` | One sentence, shown in the Before card. |
| `refs` | WCAG 2.2 success criteria (`{ kind: 'wcag', criterion: '1.4.1' }`) and/or Nielsen heuristics (`{ kind: 'heuristic', id: 'H5' }`). Titles and levels live in `WCAG_CRITERIA` and `HEURISTICS`. |
| `target` | `label` names the element in plain words; `revealedBy` says what interaction makes it appear, if it is not on screen at first render. |

`before.tsx` marks each target with `{...failureTarget(id)}`, which renders `data-failure="<id>"`. `src/__tests__/failures.test.tsx` fails if a failure lacks refs or a target, if an immediately visible target is missing from the Before demo, or if the demo marks an unknown id. Hotspots, exercises, and indexes should read from this model rather than parse descriptions.

## Patterns (v1: one per category)

| Category | Pattern | Route |
| --- | --- | --- |
| Data Tables | Bulk action table (sort, page/cross-page selection, frozen column, pagination) | `/patterns/data-table/bulk-actions` |
| Navigation | Nested navigation with derived breadcrumbs | `/patterns/navigation/nested-nav` |
| Forms | Multi-step form with inline validation, conditional fields, error recovery | `/patterns/forms/wizard-validation` |
| Dashboards | Widget grid with per-widget loading/error/empty states and density | `/patterns/dashboard/widget-grid` |
| Modals & Overlays | Confirmation dialog with severity tiers and type-to-confirm | `/patterns/modals/confirm-dialog` |
| Empty States | Empty, no-results, error, and no-access variants | `/patterns/empty-states/empty-state` |
| Notifications | Toast stack with severity timing and live regions | `/patterns/notifications/toast-stack` |
| Search & Filters | Typeahead combobox for large data sets | `/patterns/search-filters/typeahead` |

## Adding a pattern

1. Create `src/patterns/<category>/<slug>/` with `<Component>.tsx`, `<Component>.module.css`, `<Component>.test.tsx`, `demo.tsx`, `before.tsx`, and `pattern.ts`.
2. Register the definition in `src/patterns/registry.ts`.
3. `npm test`. The registry test fails if the pattern lacks an axe test, an edge-case test, props docs, or any of the four accessibility note kinds.

Editors can also draft patterns in the browser (Editor Mode, then Manage). Drafts persist in localStorage and can be exported as JSON for a PR.

## Theming patterns

Pattern CSS reads `--sux-*` custom properties (surface, ink, muted, line, accent, danger, focus, radius) and falls back to neutral defaults, so components work when dropped into any app. Override the properties at `:root` or on any ancestor.

## Sharing and export

- **Deep links**: `/patterns/:category/:slug`, plus `?tab=code|tests|accessibility`.
- **Copy link** in the top bar copies the absolute URL, keeping the open tab.
- **Export → ZIP**: component, CSS Module, test, and a generated README with props and accessibility notes.
- **Export → JSON**: versioned (`schemaVersion: 1`) metadata plus source for pipelines.
- **Copy** buttons on every code block.

## Access control

| Role | How | Can |
| --- | --- | --- |
| Everyone | Default build | Browse, run demos, copy code, export, share links |
| Design system team | Build with `VITE_ENABLE_EDITOR=true` | Toggle Editor Mode, see drafts, create and edit patterns at `/editor` |

This is a build-time flag, not authentication. Before exposing an editor build beyond the team, put `/editor` behind SSO.

## Deployment

Netlify (`netlify.toml`): builds with `npm run build`, publishes `dist`, and rewrites every path to `index.html` so deep links work on refresh. The public site builds with `VITE_ENABLE_EDITOR=false`. Live: https://solving-ux.netlify.app

## Stack

React 18, TypeScript (strict), React Router 6, Tailwind CSS 3 (shell), CSS Modules (patterns), prism-react-renderer, Jest + React Testing Library + jest-axe, JSZip + FileSaver, React Context for state, Vite.
