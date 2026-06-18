<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [CLAUDE.md — sportsdataverse (Node.js) Development Guide](#claudemd--sportsdataverse-nodejs-development-guide)
  - [Package Overview](#package-overview)
  - [Commit Convention](#commit-convention)
  - [Branches](#branches)
  - [Build & Development Commands](#build--development-commands)
  - [Architecture](#architecture)
    - [Codegen pipeline (the heart of the repo)](#codegen-pipeline-the-heart-of-the-repo)
    - [ESPN cross-league surface](#espn-cross-league-surface)
    - [Flat-API families (native + providers)](#flat-api-families-native--providers)
    - [OpenAPI → endpoint-YAML transform](#openapi--endpoint-yaml-transform)
    - [Parser layer](#parser-layer)
    - [Namespace assembly (`src/index.ts`)](#namespace-assembly-srcindexts)
  - [Project Structure](#project-structure)
  - [Key Coding Conventions](#key-coding-conventions)
  - [Common Pitfalls](#common-pitfalls)
  - [Documentation Maintenance](#documentation-maintenance)
    - [Docs-overhaul features (live guides, injector, grouped sidebar)](#docs-overhaul-features-live-guides-injector-grouped-sidebar)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# CLAUDE.md — sportsdataverse (Node.js) Development Guide

## Package Overview

`sportsdataverse` (npm) is the SportsDataverse's **Node.js / TypeScript** client and
the sister to the Python package [`sportsdataverse-py`](https://py.sportsdataverse.org/)
and the SportsDataverse R packages (`hoopR`, `wehoop`, `cfbfastR`, `fastRhockey`,
`baseballr`, …). It provides tidy access to play-by-play, box score, schedule,
roster, standings, odds, and many other surfaces across the major leagues.

As of **v3.0.0** the package is a **cross-league ESPN client _plus_ a native
(non-ESPN) live-API client** with a tidy parser layer:

- **116 ESPN endpoint short names** generated for **29 leagues** (31 namespaces),
  exposed as `espn_<league>_<short>` (snake) + `espn<League><Short>` (camelCase).
- **532 flat-API wrappers across 15 families** — 7 native league APIs + 7 cross-sport
  providers (see [Flat-API families](#flat-api-families-native--providers)).
- A **parser layer** (`src/parsers/`): every wrapper returns raw JSON by default;
  `{ parsed: true }` returns a tidy array of flat, snake_cased row objects.

When this guide differs from the current repo, treat `CONTRIBUTING.md`, the endpoint
YAML under `tools/codegen/endpoints/`, and the test suite under `test/` as
authoritative.

- **License:** MIT
- **Author:** Saiem Gilani
- **Default / release branch:** `main`
- **Runtime:** Node **≥ 20.18.1**, **ESM-only** (`"type": "module"`), TypeScript
- **Packaging:** npm (`package-lock.json` committed); ships `dist/` only
- **Docs:** Docusaurus 3 on Vercel (`js.sportsdataverse.org`) with a live playground

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(nhl): add nhl_edge skater-tracking wrappers
fix(parsers): handle empty boxscore in parse_summary
docs(reference): regenerate after odds_api endpoint add
refactor(codegen): split flat-API rendering out of generate.mjs
chore(deps): bump esbuild + re-lock
ci(actions): add Node 22 to the test matrix
```

Prefer scoped subjects (`feat(mlb): …`, `fix(cfb): …`). Use `type!:` or a
`BREAKING CHANGE:` footer for breaking changes. Split unrelated work into separate
commits.

**Hard rule: never add AI/assistant co-author trailers or "Generated with …"
lines.** Omit all `Co-Authored-By:` trailers referencing AI tools (Claude, Copilot,
Cursor, GPT, Gemini, …) and never add a "🤖 Generated with" line to commits or PR
bodies. The human author is the sole attributable contributor. This applies whether
the change was generated, refactored, or reviewed with AI assistance.

## Branches

- **`main`** — default and release branch. The committed `src/generated/**`,
  `docs/docs/reference/**`, and `docs/src/playground/endpoints.json` MUST be in sync
  with `tools/codegen/endpoints/*.yaml` (the drift gate enforces this in CI).

## Build & Development Commands

```sh
npm ci                  # install from the lockfile

npm run build           # tsc -> dist/
npm run typecheck       # tsc --noEmit
npm test                # mocha suite (no network) — runs `npm run build` first via pretest

npm run codegen         # regenerate src/generated + docs/docs/reference + playground JSON
npm run codegen:check   # DRIFT GATE — fails if committed generated output is stale
npm run bundle:parsers  # esbuild the browser parser bundle for the playground
npm run docs            # typedoc -> the typed module reference
```

- `test` runs Mocha against `test/**/*.test.js` with no network access.
- `prepare` / `prepublishOnly` build `dist/`; only `dist/` is published (`files:
  ["dist"]`).

## Architecture

### Codegen pipeline (the heart of the repo)

The library is **codegen-driven**. `tools/codegen/generate.mjs` reads the vendored
endpoint YAML in `tools/codegen/endpoints/*.yaml` (plus return schemas under
`tools/codegen/schemas/`) and, from that single source of truth, generates:

| Output | Path | Purpose |
|---|---|---|
| Runtime wrapper / league tables | `src/generated/wrappers.ts`, `src/generated/leagues.ts` | the TS the package imports at runtime |
| Per-league Markdown reference | `docs/docs/reference/*.md` (+ `_category_.json`) | the docs site reference subtree |
| Playground metadata | `docs/src/playground/endpoints.json` | the in-browser playground endpoint list |

- `npm run codegen` **writes** those outputs.
- `npm run codegen:check` (`--check`) is the **drift gate**: it regenerates in-memory
  and exits non-zero if any committed output differs. This runs in CI and as a
  pre-commit hook.
- **Never hand-edit generated files.** Every generated file carries an
  `AUTO-GENERATED by tools/codegen/generate.mjs — do not edit by hand` header. Edit
  the YAML (or the Jinja-style templates / renderers in `generate.mjs`) and rerun
  `npm run codegen`; otherwise the drift gate goes red.

The generator is a pure file-in / file-out renderer — it makes **no network calls**.

### ESPN cross-league surface

ESPN endpoints come from three family YAML files — `espn_site_v2.yaml`,
`espn_core_v2.yaml`, `espn_web_v3.yaml` — and feed the `WRAPPERS` table in
`src/generated/wrappers.ts`. The pattern is **one core, parameterized on
`(sport, league)` slugs**, wrapped once per URL family.

- **116 distinct short names** are exposed across **29 leagues** (`leagues.yaml`).
- Each wrapper is registered under BOTH `espn_<prefix>_<short>` (snake, py/R parity)
  and `espn<Prefix><Short>` (camelCase, idiomatic JS) by `makeLeagueModule`
  (`src/leagues/_make.ts`) — both resolve to the same function.
- Endpoints carry a **scope**: `universal` (every league), `ncaa` (college),
  `football` (NFL / CFB / UFL), `mlb`. Each league gets exactly the endpoints in its
  scope set, so the ESPN contract tests stay invariant.
- The `summary` endpoint is a **dispatcher** returning 21 sub-frames; it honours a
  `section` arg (omit → all sub-frames as a dict).
- Multi-league sports take an extra `league` slug, e.g.
  `sdv.soccer.espnSoccerScoreboard({ league: "eng.1" })`.

### Flat-API families (native + providers)

Non-ESPN, absolute-host live APIs are generated into a **separate** `FLAT_WRAPPERS`
table (so the ESPN table stays untouched). **532 flat-API wrappers across 15
families**:

**7 native** — merged onto their league namespace:

| Family (YAML stem) | Namespace | Host | Auth |
|---|---|---|---|
| `mlb` | `sdv.mlb.mlb*` | `statsapi.mlb.com` | keyless |
| `mlb_statcast` | `sdv.mlb.mlbStatcast*` | `baseballsavant.mlb.com` | keyless (date-chunked search) |
| `nhl_api_web` | `sdv.nhl.nhlApiWeb*` | `api-web.nhle.com` | keyless |
| `nhl_edge` | `sdv.nhl.nhlEdge*` | `api-web.nhle.com/v1/edge` | keyless |
| `nhl_stats_rest` | `sdv.nhl.nhlStatsRest*` | `api.nhle.com/stats/rest` | keyless |
| `nhl_records` | `sdv.nhl.nhlRecords*` | `records.nhl.com` | keyless |
| `nfl_api` | `sdv.nfl.nflApi*` | `api.nfl.com` | **bearer token minted automatically** (anonymous `WEB_DESKTOP`, cached + auto-renewed; `src/core/nfl_auth.ts`) |

**7 cross-sport providers** — standalone `sdv.<ns>.*` namespaces (NOT leagues), each
getting its own generated reference page:

| Family | Namespace | Auth |
|---|---|---|
| The Odds API (`odds_api`) | `sdv.odds.*` | `apiKey` query param (caller-supplied) |
| 247Sports (`recruiting`) | `sdv.recruiting.*` | caller-supplied JWT via `headers` |
| CBS Sports (`cbs`) | `sdv.cbs.*` | keyless |
| Fox Sports (`fox`) | `sdv.fox.*` | public `apikey` + `api-version` query (defaulted) |
| Yahoo Sports (`yahoo_scores` + `yahoo`) | `sdv.yahoo.*` | keyless (browser-y `Origin`/`Referer` headers) |
| HockeyTech / LeagueStat (`hockeytech`) | `sdv.hockeytech.*` | keyless; **league-parameterized** (`league` slug) |
| BartTorvik / T-Rank (`torvik`) | `sdv.torvik.*` | keyless (needs a browser-like UA) |

`FLAT_API_NAMESPACES` in both `src/index.ts` and `generate.mjs` maps each stem to its
namespace — **keep the two copies in sync**. `standaloneFlatNamespaces()` in
`generate.mjs` decides which namespaces are providers (not leagues) and renders them
their own standalone reference page.

**Two newest providers (v3.1.0) — HockeyTech + BartTorvik:**

- **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, 10 endpoints: `seasons`,
  `schedule`, `teams`, `team_roster`, `player_stats`, `game_shifts`, `standings`,
  `leaders`, `pbp`, `game_summary`). One feed gateway (`/feed/index.php`) serves
  every league; the wrapper carries a `league` slug for **PWHL + AHL/OHL/WHL/QMJHL**.
  Hosts: `lscluster.hockeytech.com` (+ `cluster.leaguestat.com` for QMJHL). The
  `src/core/hockeytech_runtime.ts` getter (registered as `hockeytechGet` in
  `GETTER_OVERRIDES`) unwraps the JSONP envelope (`angular.callbacks._N({…})`)
  before `JSON.parse`, switches the `gc` feed to `tab=` (not `view=`), applies a
  PWHL play-by-play key override, and injects each league's `client_code` / `key` /
  `site_id` from a per-league registry (overridable via `SDV_<LEAGUE>_API_KEY`).
  Ported from `fastRhockey`'s `hockeytech_*.R` + sdv-py's `sportsdataverse/hockeytech/`.
- **BartTorvik / T-Rank** (`sdv.torvik.*`, 5 endpoints: `ratings`, `team_factors`,
  `game_stats`, `player_stats`, `game_schedule`) from `barttorvik.com`. The
  `src/core/torvik_runtime.ts` getter (`torvikGet`) sends a browser-like User-Agent
  (barttorvik rejects default programmatic UAs) and returns the raw body so each
  parser branches on format — CSV via papaparse, or `JSON.parse` of the
  **headerless positional column arrays** (31 / 55 / 67 fields, ported verbatim
  from `hoopR`'s `torvik_*.R`).

**Getter-runtime override convention.** The flat dispatch (`src/leagues/_make_flat.ts`)
defaults to the shared **JSON-only** no-auth getter (`src/core/client.ts` `get`). A
family that needs non-JSON bodies (CSV/HTML), envelope unwrapping (JSONP), per-league
credential injection, or custom request shaping registers its own getter in
`GETTER_OVERRIDES` keyed by `api` stem — `hockeytechGet`, `torvikGet`, and the MLB
Statcast getter (the JS analog of sdv-py's `mlb_statcast_runtime`) all use this hook.
The getter signature matches `get(url, config) => Promise<...>` so it slots in
transparently.

### OpenAPI → endpoint-YAML transform

`tools/codegen/from-openapi.mjs` turns a canonical **OpenAPI 3.x** spec (the
`sdv-swagger` collection; also handles Swagger-2 `host`+`basePath`) into a flat-API
endpoint-YAML **skeleton** in the shape of `odds_api.yaml` / `nfl_api.yaml`. It:

- emits only `GET` operations as wrappers;
- derives a stable snake_case `short` from `operationId` (else from the path),
  de-duplicating collisions;
- resolves `$ref` params against `components.parameters`, merges path-item + operation
  params, and rewrites path tokens to snake_case to match param names;
- sets top-level `auth: true` only for bearer / header-token schemes.

The output is a **skeleton**: `parser:` is a `parse_<api>_<short>` placeholder and
`returns_schema:` a `native/<api>/<short>` placeholder. Real parsers
(`src/parsers/<api>.ts`, registered in `_registry.ts`) and schemas
(`tools/codegen/schemas/native/<api>/*.yaml`) are authored by hand on top. CLI:
`node tools/codegen/from-openapi.mjs <spec.yaml> --api <stem> [--out <path>]`. This
transform is what made the provider families largely mechanical to add.

### Parser layer

`src/parsers/` registers one parser per endpoint. **Contract:**

- A parser is a function `(raw) => rows[]` — a tidy array of flat, snake_cased row
  objects. Nested fields are flattened by the in-house `normalize` (the JS analog of
  pandas `json_normalize`); keys are snake_cased via `snakeCase`.
- Empty / malformed payloads return `[]` (or a zero-row frame), never throw — callers
  can chain without null checks.
- The dispatch is **strictly additive**: a wrapper returns the **raw** payload by
  default; passing `{ parsed: true }` runs the registered parser. Omitting the kwarg
  preserves the raw return for every existing caller. This mirrors
  `sportsdataverse-py`'s `return_parsed=True`.
- ESPN parsed dispatch is a port of py's `_common_espn_parsers` — **22 parsers**
  (scoreboard / standings / rosters / leaders / athlete deep-dives / the 21-sub-frame
  `summary` dispatcher + two generics for Core v2 list + single-resource). All 116
  ESPN endpoints route through these; `summary` honours `section`.
- The browser-safe public barrel is `src/parsers/index.ts`, exposed via the
  `sportsdataverse/parsers` subpath export. It transitively imports only
  `_normalize`, sibling parser modules, and `papaparse` (all browser-safe — no
  node-only HTTP deps). `npm run bundle:parsers` esbuilds it into the playground so
  parsing happens client-side. **Rebundle whenever a parser changes.**

### Namespace assembly (`src/index.ts`)

The default export `sdv` is assembled as:

1. Start from the **legacy** hand-written services (`cfb, mbb, mlb, nba, ncaa, nfl,
   nhl, tennis, wbb, wnba` from `src/services/`) — these preserve pre-3.0 convenience
   methods like `sdv.nba.getPlayByPlay(...)`.
2. Merge the generated ESPN wrappers onto each league via `makeLeagueModule(cfg)` for
   every `cfg` in `LEAGUES`, adding new namespaces (soccer, cricket, ufl, …) where no
   legacy service exists.
3. Merge the flat-API wrappers via `makeFlatModule` AFTER the ESPN merge (additive,
   never clobbering) using `FLAT_API_NAMESPACES`; provider stems land on standalone
   namespaces.
4. Merge `mlb_statcast_extra` (hand-written date-chunked search) onto `sdv.mlb`.

Named, tree-shakeable re-exports include `LEAGUES`, `WRAPPERS`, `FLAT_WRAPPERS`,
`makeLeagueModule`, `makeFlatModule`, `normalize`, `PARSERS` / `parserFor`, the
NFL-auth helpers, and `export * as tidy from '@tidyjs/tidy'`.

## Project Structure

```
src/
  core/           # espn.ts (ESPN dispatch), client.ts (FLAT_HOSTS), flat.ts,
                  # nfl_auth.ts (bearer mint), types.ts
  generated/      # AUTO-GENERATED — wrappers.ts, leagues.ts (do NOT hand-edit)
  leagues/        # _make.ts (ESPN league module), _make_flat.ts (flat module),
                  # mlb_statcast_extra.ts
  parsers/        # parser layer + index.ts barrel (sportsdataverse/parsers export)
  services/       # legacy hand-written per-sport scrapers (preserved)
  index.ts        # namespace assembly + default export
tools/codegen/
  generate.mjs    # the codegen entry point (writes generated + docs + playground)
  from-openapi.mjs# OpenAPI 3.x spec -> endpoint-YAML skeleton
  endpoints/*.yaml# SOURCE OF TRUTH (espn_* families + flat-API stems + leagues.yaml)
  schemas/        # return schemas consumed by the docs renderer
  templates/      # rendering templates
docs/             # Docusaurus 3 site (reference subtree is generated; rest authored)
test/             # Mocha no-network tests (test/**/*.test.js)
examples/         # runnable example scripts
package.json      # ESM, engines.node >= 20.18.1, scripts, exports (. and ./parsers)
tsconfig.json, typedoc.json
```

## Key Coding Conventions

- **ESM-only.** `"type": "module"`; use `import` / `export`, no `require`, and
  include the `.js` extension in relative import specifiers (TS NodeNext). No CommonJS
  entry point is published.
- **Dual-case naming.** Generated wrappers are registered under snake_case (py/R
  parity) AND camelCase (idiomatic JS canonical) — both resolve to the same function.
  Params accept snake_case or camelCase.
- **The drift gate must stay green.** After editing any `tools/codegen/endpoints/*.yaml`
  (or a renderer), run `npm run codegen` and commit the regenerated
  `src/generated/**`, `docs/docs/reference/**`, and playground JSON together.
  `npm run codegen:check` must pass.
- **`{ parsed: true }` is additive.** Never change a wrapper's default (raw) return.
  Add or fix the registered parser; leave the raw path alone.
- **Parser contract.** `(raw) => rows[]`, `[]` on empty, snake_cased flat rows via
  `normalize`. New flat-API families: author `src/parsers/<api>.ts`, register in
  `src/parsers/_registry.ts`, add returns schemas under
  `tools/codegen/schemas/native/<api>/`.
- **New flat-API family workflow.** Run `from-openapi.mjs` to get a YAML skeleton →
  drop it in `tools/codegen/endpoints/` → add the stem to `FLAT_API_FILES` /
  `FLAT_API_NAMESPACES` / `FLAT_API_META` in `generate.mjs` and the
  `FLAT_API_NAMESPACES` copy in `src/index.ts` → author parsers + schemas →
  `npm run codegen` → `npm run bundle:parsers` (if parsers are browser-relevant).
- **Tests are no-network.** Mocha + `should`. Use captured fixtures; don't hit live
  APIs in the default suite.
- **Fully typed.** New modules ship param + return types; `npm run typecheck` must be
  clean.

## Common Pitfalls

- **Don't hand-edit `src/generated/**` or `docs/docs/reference/**`.** They're
  codegen-owned; the drift gate will fail and your edit will be clobbered on the next
  `npm run codegen`. Edit the YAML / renderer instead.
- **Rebundle parsers when they change.** The playground runs the esbuild bundle, not
  `src/parsers` directly — `npm run bundle:parsers` after any parser edit, or the
  browser playground serves stale parsing logic.
- **Keep `FLAT_API_NAMESPACES` in sync** between `generate.mjs` and `src/index.ts`. A
  mismatch routes a family's wrappers to the wrong namespace (or a missing one).
- **Legal comments in the bundle.** `bundle:parsers` uses
  `--legal-comments=eof`; don't strip the license footer from
  `docs/src/playground/parsers.bundle.mjs`.
- **Rate-limit live captures, not codegen.** `generate.mjs` makes no network calls.
  When capturing fixtures from ESPN Core v2 / providers, keep parallelism low —
  ESPN Core v2 in particular 403s under load.
- **NFL.com token is auto-minted.** `sdv.nfl.nflApi*` mints an anonymous
  `WEB_DESKTOP` bearer token (cached + auto-renewed in `src/core/nfl_auth.ts`); don't
  add a credential requirement or re-implement the mint.
- **The `{ parsed: true }` kwarg must never change the raw default.** Adding a parser
  is additive; verify a raw call still returns the untouched payload.

## Documentation Maintenance

- The Docusaurus site lives under `docs/`. The per-league/provider reference subtree
  (`docs/docs/reference/*.md`, `_category_.json`) and the playground metadata are
  **generated** — never hand-edit them. Conceptual pages outside that subtree
  (`docs/docs/intro.md`, tutorials, architecture) are hand-authored and survive
  regeneration.
- `CONTRIBUTING.md` is the canonical contributor onboarding file.
- `README.md` carries Install / Quick start / Architecture and the companion-package
  cross-links.
- Verify the docs build with `cd docs && npx docusaurus build` before shipping
  doc-affecting changes.

### Docs-overhaul features (live guides, injector, grouped sidebar)

The docs site grew a literate-docs / live-runner layer. Five pieces, each
**data-driven or codegen-owned** so they self-maintain:

- **Sport-grouped reference sidebar is codegen-owned — never hand-edit it.**
  `tools/codegen/generate.mjs` emits `docs/src/generated/reference-sidebar.js`,
  which nests every ESPN league reference doc under a collapsible category named
  for its `sport` (read from `tools/codegen/endpoints/leagues.yaml`) plus a
  "Providers" group; `docs/sidebars.js` just `require()`s it. It carries an
  `@generated … do not edit by hand` header and is **drift-guarded** by
  `npm run codegen:check`. To regroup a league, edit `leagues.yaml` (its `sport`
  field) or the `SPORT_ORDER` in `generate.mjs`, then `npm run codegen` — don't
  touch the generated file or `sidebars.js`. The reference `.md` files stay flat
  (no URL changes); only the sidebar nesting changes.

- **`<RunCell>` is an embeddable live runner for `.mdx` guides.**
  `docs/src/components/RunCell/index.jsx` is a compact single-endpoint slice of
  the full `<Playground>`: editable params → resolved GET URL → **Run** (via the
  `/api/run` proxy) → raw JSON or a tidy parsed table. It is SSR-safe and reuses
  the playground's own `resolve.mjs` + `parsers.bundle.mjs` verbatim. It handles
  every endpoint kind — ESPN (incl. `leagueParam` leagues like soccer), the
  `summary` section selector, every flat family, enum dropdowns, and non-JSON
  Statcast CSV/HTML. Drop it inline in any guide: `import RunCell from
  '@site/src/components/RunCell'` then `<RunCell league="nba"
  endpoint="espn:scoreboard" parsed />`.

- **Build-time output injector freezes real parsed tables into guides.**
  `tools/docs/inject-outputs.mjs` reads the manifest `tools/docs/examples.mjs`
  and writes the first few rows × cols of each example's **real** parsed output
  as a markdown table between `<!-- inject:example:<id> -->` …
  `<!-- /inject -->` markers in the target guide. It runs the SAME committed
  `parsers.bundle.mjs` the playground uses, is **deterministic** (committed
  fixtures, no network), and covers ESPN array frames, flat families, and the
  `summary` dispatcher (`espn` / `flat` / `espn-summary` families). Scripts:
  `npm run docs:examples` (write) and `npm run docs:examples:check` (drift gate,
  wired into `.github/workflows/ci.yml`). **After changing `src/parsers/**` (then
  `npm run bundle:parsers`) or the example manifest, run `npm run docs:examples`
  and keep `docs:examples:check` green** — it is a CI gate. A no-network
  consistency guard lives in `test/docs-examples.test.js`.

- **Programmatic homepage + Playground links are data-driven.**
  `docs/src/pages/index.js` maps over the generated
  `docs/src/playground/endpoints.json` (ESPN leagues grouped by `sport` + the
  provider namespaces), so adding a sport/league/provider and re-running
  `npm run codegen` updates the home page with no bespoke edit. The navbar and
  footer both carry **Docs / News / Tutorials / Playground**, and the docs
  sidebar has a 🛝 **Playground** link near the top
  (`docs/docusaurus.config.js` + `docs/sidebars.js`).

- **The `/api/run` proxy is what makes RunCell + the playground live.** It is a
  Vercel serverless function (`docs/api/run.mjs`) — host-allowlisted, with
  server-side NFL.com token minting and content-type passthrough. RunCell and the
  playground are no-ops without it; locally you need the proxy running for a live
  Run (the committed injected tables and the `build` itself need no network).
