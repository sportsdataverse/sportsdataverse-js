# GitHub Copilot instructions — `sportsdataverse` (Node.js)

A TypeScript, ESM-only Node.js client (Node ≥ 20.18.1) for sports data: a
cross-league ESPN surface plus native (non-ESPN) live-API families and seven
cross-sport provider families, all with a tidy parser layer.

## Architecture (how the code is generated)

- **Codegen-driven.** `tools/codegen/generate.mjs` reads the endpoint YAML in
  `tools/codegen/endpoints/*.yaml` (the single source of truth) and generates the
  runtime wrapper tables under `src/generated/`, the per-league reference docs
  under `docs/docs/reference/`, and the playground metadata
  `docs/src/playground/endpoints.json`.
- **Do NOT hand-edit generated output** (`src/generated/**`,
  `docs/docs/reference/**`, `docs/src/playground/endpoints.json`). Edit the YAML
  (or the codegen templates) and run `npm run codegen`. `npm run codegen:check`
  is the drift gate — it must stay green (CI fails otherwise).
- New non-ESPN families come from a canonical OpenAPI spec via
  `tools/codegen/from-openapi.mjs` (OpenAPI 3.x → endpoint-YAML skeleton).
- **The sport-grouped reference sidebar is codegen-owned — never hand-edit it.**
  `docs/src/generated/reference-sidebar.js` (and `docs/sidebars.js`) group league
  reference docs by `sport`. To regroup, edit `tools/codegen/endpoints/leagues.yaml`
  or `generate.mjs` and run `npm run codegen` — the file is drift-guarded by
  `npm run codegen:check`.

## Conventions

- **ESM only** — `import sdv from 'sportsdataverse'`. There is no CommonJS
  `require` export. In RunKit/notebooks use `await import('sportsdataverse')`.
- **Dual-case naming** — every generated wrapper is exposed under BOTH snake_case
  (`espn_nba_scoreboard`, `mlb_teams`) and camelCase (`espnNbaScoreboard`,
  `mlbTeams`). Same function, either name.
- **Parser contract** — parsers are `(raw: any) => Record<string, any>[]`: return
  a tidy array of flat (snake_cased, nested-flattened) row objects; return `[]`
  on empty/malformed input; never throw. `{ parsed: true }` is strictly additive
  (omitting it returns the raw payload). When you change `src/parsers/**`, re-run
  `npm run bundle:parsers` (the playground bundle) so its staleness test passes.
- **Flat-API getter runtimes.** The flat dispatch defaults to the shared JSON-only
  no-auth getter (`src/core/client.ts`). A family needing non-JSON bodies or custom
  request shaping registers its own getter in `GETTER_OVERRIDES`
  (`src/leagues/_make_flat.ts`) keyed by `api` stem:
  - **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, `src/core/hockeytech_runtime.ts`)
    — JSONP family; the getter strips the `angular.callbacks._N({…})` wrapper before
    `JSON.parse`, uses `tab=` (not `view=`) on the `gc` feed, applies a PWHL
    play-by-play key override, and injects each league's `client_code`/`key`/`site_id`
    from a per-league registry (PWHL + AHL/OHL/WHL/QMJHL; `SDV_<LEAGUE>_API_KEY`
    overrides the key). QMJHL uses a second host (`cluster.leaguestat.com`).
  - **BartTorvik / T-Rank** (`sdv.torvik.*`, `src/core/torvik_runtime.ts`) — sends a
    browser-like User-Agent (barttorvik rejects default UAs) and returns the raw body
    so each parser branches on format (CSV via papaparse, or `JSON.parse` of
    headerless positional column arrays ported from hoopR).
  Both are **standalone provider namespaces** (`sdv.<ns>.*`, not leagues).
- **Docs guides + live runner.** Getting-started guides are `.mdx` under
  `docs/docs/guides/`; `<RunCell>` (`docs/src/components/RunCell`) is embeddable
  inline in any guide for a live single-endpoint Run (via the `/api/run` proxy).
  After changing `src/parsers/**` (and re-bundling) or the example manifest
  `tools/docs/examples.mjs`, run `npm run docs:examples` to refresh the frozen
  tables and keep `npm run docs:examples:check` green (a CI gate). The homepage +
  reference sidebar are data-driven/codegen-owned — don't hand-edit them.
- **New modules must be typed** and pass `npm run typecheck` (tsc) + `npm run build`.
- **Tests** are Mocha, no network (inline payloads / committed fixtures);
  live/integration tests are gated behind `SDV_LIVE=1`.

## Commits / PRs

- [Conventional Commits](https://www.conventionalcommits.org/) (`feat(odds): …`,
  `fix(cfb): …`, `docs(readme): …`).
- **Never add AI/assistant co-author trailers or "Generated with …" lines** to
  commits or PRs. The human author is the sole attributable contributor.
- If you touched any `tools/codegen/endpoints/*.yaml`, regenerate and commit the
  generated output in the same change.
