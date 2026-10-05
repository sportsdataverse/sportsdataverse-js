# Contributing to sportsdataverse (Node.js)

Thanks for helping improve `sportsdataverse`! This guide covers local setup, the
codegen workflow, how to add endpoints and parsers, testing, and the commit/docs
conventions. By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Architecture overview](#architecture-overview)
- [Codegen workflow](#codegen-workflow)
- [Adding an ESPN endpoint](#adding-an-espn-endpoint)
- [Vendored families (sync from sdv-py)](#vendored-families-sync-from-sdv-py)
- [Adding a new flat-API family](#adding-a-new-flat-api-family)
- [The parser contract](#the-parser-contract)
- [Testing](#testing)
- [Docs & playground](#docs--playground)
- [Commit conventions](#commit-conventions)
- [Opening a pull request](#opening-a-pull-request)

## Prerequisites

- **Node ≥ 20.18.1** (see `engines` in `package.json`).
- npm (the repo commits `package-lock.json`).
- The package is **ESM-only** and written in **TypeScript**.

## Getting started

```sh
git clone https://github.com/sportsdataverse/sportsdataverse-js.git
cd sportsdataverse-js

npm ci             # install exactly from the lockfile
npm run build      # tsc -> dist/
npm test           # mocha suite (no network; runs the build first via pretest)
npm run typecheck  # tsc --noEmit
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm run codegen` | regenerate `src/generated/**`, `docs/docs/reference/**`, playground JSON |
| `npm run codegen:check` | **drift gate** — fails if committed generated output is stale |
| `npm run bundle:parsers` | esbuild the browser parser bundle for the playground |
| `npm run docs` | TypeDoc (the typed module reference) |
| `npm run build` | compile TypeScript to `dist/` |
| `npm test` | Mocha suite over `test/**/*.test.js` (no network) |

## Architecture overview

The library is **codegen-driven**. `tools/codegen/generate.mjs` reads the vendored
endpoint YAML in `tools/codegen/endpoints/*.yaml` — the single source of truth — and
generates:

- the runtime TypeScript wrapper / league tables under `src/generated/`
  (`wrappers.ts`, `leagues.ts`),
- the per-league/provider Markdown reference under `docs/docs/reference/`, and
- the playground metadata `docs/src/playground/endpoints.json`.

Two kinds of endpoints:

- **ESPN** (`espn_site_v2.yaml`, `espn_core_v2.yaml`, `espn_web_v3.yaml`) — one core,
  parameterized on `(sport, league)` slugs, exposed across **29 leagues** as
  `espn_<league>_<short>` + `espn<League><Short>`.
- **Flat APIs** (non-ESPN absolute hosts) — **7 native** league APIs (MLB Stats,
  Statcast, NHL ×4, NFL.com) merged onto their league namespace, and **5 cross-sport
  providers** (Odds / 247 / CBS / Fox / Yahoo) on standalone `sdv.<provider>.*`
  namespaces.

Every wrapper returns raw JSON by default; `{ parsed: true }` runs it through a
registered **parser** → a tidy array of flat, snake_cased row objects. See
[`CLAUDE.md`](CLAUDE.md) for the full deep-dive.

## Codegen workflow

> **Generated files are never hand-edited.** Every file under `src/generated/` and
> `docs/docs/reference/` starts with an `AUTO-GENERATED … do not edit by hand`
> header. Edit the **YAML** (or the renderer/templates) and regenerate.

The loop is:

```sh
# 1. edit tools/codegen/endpoints/<file>.yaml  (or generate.mjs / templates)
npm run codegen          # 2. regenerate the runtime + docs + playground outputs
npm run codegen:check    # 3. confirm there is no drift
git add src/generated docs/docs/reference docs/src/playground tools/codegen
```

`codegen:check` runs in CI (there is no pre-commit hook; run it yourself before pushing). **A PR that changes endpoint
YAML without committing the regenerated output will fail the drift gate.**

## Adding an ESPN endpoint

The ESPN family files are **vendored from sdv-py** (see the next section), so:

1. Add the endpoint to the right family file in **sportsdataverse-py**
   (`tools/codegen/endpoints/espn_site_v2.yaml` / `espn_core_v2.yaml` /
   `espn_web_v3.yaml`) with its `short`, `scope` (`universal` / `ncaa` / `football` /
   `mlb`), `path`, and params, and merge it there.
2. Re-vendor here: `npm run vendor -- --ref <sdv-py sha>` (or wait for the weekly
   sync PR).
3. Register its parser in `ESPN_ENDPOINT_PARSERS` (`src/parsers/espn.ts`) and
   `tools/codegen/endpoints/espn_parser_map.yaml` (the coverage test requires one).
4. `npm run codegen` and commit the regenerated output.
5. Add or extend a Mocha test under `test/`.

The endpoint automatically appears on **every** league in its scope under both naming
conventions — no per-league edits required.

## Vendored families (sync from sdv-py)

sdv-py's codegen YAML is the source of truth for the shared families (`espn_*`,
`leagues`, `mlb`, `mlb_statcast`, `nfl_api`, `nhl_*`, `torvik`, `cbs`, `yahoo`) and the
returns schemas they reference. `tools/codegen/vendor.mjs` copies them from a pinned
sdv-py commit (`tools/codegen/vendor.yaml` → `source.ref`) into
`tools/codegen/vendor/upstream/` verbatim, then derives `tools/codegen/endpoints/` +
`tools/codegen/schemas/` through the manifest's per-family rewrites (api stem, short
names, parser names, schema paths).

```sh
npm run vendor -- --ref <sha>   # bump the pin + fetch (GitHub raw; SDV_PY_REPO=<clone> for local)
npm run vendor -- --offline     # re-derive after editing vendor.yaml or overlay/
npm run vendor:check            # offline gate (CI): LOCK hashes + any hand-edit
npm run codegen                 # then regenerate as usual
```

- **Never hand-edit a vendored file** (it starts `# VENDORED from …`) or the
  upstream copies in `tools/codegen/vendor/upstream/` (`vendor:check` re-hashes them
  against `LOCK`). JS-only endpoints and JS-side patches go in
  `tools/codegen/overlay/<family>.yaml`: an entry with a new `short` (and a `path`)
  is appended, an entry with a vendored `short` replaces those keys. A patch that
  matches nothing, or that upstream has already absorbed, fails the vendor so you
  can delete it.
- Shared endpoint changes land in **sdv-py first**; the weekly
  `vendor-sync.yml` workflow opens a PR bumping the pin. The workflow itself runs
  `npm run vendor`, `npm run codegen`, the build and `npm test` before opening the
  PR (the outcome is in the PR body), but a PR opened with the workflow's
  `GITHUB_TOKEN` does **not** trigger CI: a maintainer closes and reopens it (or
  pushes to it) to run the CI checks before merging.
- A py `returns_schema` is attached only where the JS parser is DECLARED
  equivalent to py's (family `schema_compatible: true` for a kept py parser name,
  or `parsers: {<py>: {js: <name>, schema_compatible: true}}`); otherwise JS's own
  schema (via the overlay) or none.
- The parser-parity harness (`test/parsers/parity.test.js`) checks those tables on
  sdv-py's real captures (`test/fixtures/py/manifest.yaml`): every documented
  column present, JS value types matching, cells equal to sdv-py's own output
  (`test/fixtures/py/oracle/`, regenerated by `tools/parity/py_oracle.py` with
  sdv-py checked out at the pin). An endpoint whose table fails on a real capture
  goes in its family's `schema_incompatible: [<short>]` with the evidence, which
  drops the table (a family whose tables fail across the board is flipped to
  `schema_compatible: false` instead). Add a capture to the manifest (and
  regenerate the oracle) to verify more endpoints; generated row types are emitted
  only for the verified ones recorded in `test/fixtures/py/parity_coverage.json`
  (rewrite it with `SDV_PARITY_WRITE=1 npx mocha test/parsers/parity.test.js`).
- A new param `transform:` upstream fails `npm run codegen` until it is ported to
  `src/core/transforms.ts` (+ `docs/src/playground/resolve.mjs`) and listed in
  `tools/codegen/param-transforms.mjs`.
- JS-owned families (`fox`, `odds_api`, `hockeytech`, `yahoo_scores`, `recruiting`)
  are edited here directly, as before.
- **Public names are sdv-py's (v4).** `generate.mjs` ports py's emit-time rename
  layer, so never rename by hand: ESPN shorts get py's convention rename
  (`athlete`→`player`, `event`→`game`, …) plus the vendored `espn_rename_map.yaml`;
  a flat family is named by its YAML `name_pattern` / `qualifier` (not its file
  stem). Names py's own hand-written functions occupy are listed in
  `vendor.yaml` `py_reserved`; `test/naming.test.js` compares the result with
  sdv-py's generated names at the pin (`tools/codegen/py_public_names.json`, which
  `npm run vendor` derives from verbatim, LOCK-verified copies of sdv-py's generated
  modules in `vendor/upstream/py/`; `vendor:check` covers it). Pre-v4 names stay callable as
  deprecated aliases generated from the frozen `tools/codegen/pre_v4_names.json`.

## Adding a new flat-API family

1. **Generate a YAML skeleton from the OpenAPI spec.** If the provider has an
   OpenAPI 3.x spec (e.g. from the `sdv-swagger` collection):

   ```sh
   node tools/codegen/from-openapi.mjs <spec.yaml> --api <stem> --out tools/codegen/endpoints/<stem>.yaml
   ```

   This emits a skeleton (`api:`, `host:`, optional `auth: true`, `endpoints:` with
   `short`/`path`/`parser`/`returns_schema`/params). Only `GET` operations become
   wrappers. The `parser:` / `returns_schema:` values are placeholders.
2. **Register the stem** in `tools/codegen/generate.mjs`: add it to `FLAT_API_FILES`,
   map it in `FLAT_API_NAMESPACES`, and add a `FLAT_API_META` `{ label, source }`
   entry. **Add the same `FLAT_API_NAMESPACES` mapping to `src/index.ts`** (the two
   copies must stay in sync). A standalone provider namespace (not a league) gets its
   own reference page automatically.
3. **Author the parsers** in `src/parsers/<stem>.ts` and register them in
   `src/parsers/_registry.ts`. Add returns schemas under
   `tools/codegen/schemas/native/<stem>/`.
4. **Handle auth** if needed in `src/core/` (e.g. `client.ts` hosts, an auth helper
   like `nfl_auth.ts`). Document the auth style (keyless / apiKey query / bearer mint
   / caller-supplied headers/JWT).
5. `npm run codegen`, then `npm run bundle:parsers` if the parsers are browser-relevant.
6. Add Mocha tests with captured fixtures.

## The parser contract

A parser is a function `(raw) => rows[]`:

- Returns a **tidy array of flat row objects** — nested fields flattened via the
  in-house `normalize` (the JS analog of pandas `json_normalize`), keys snake_cased
  via `snakeCase`.
- Returns `[]` (a zero-row result) for empty / malformed payloads — **never throws**,
  so callers can chain without null checks.
- Is reached only when the caller passes `{ parsed: true }`; the default return is
  always the **raw** payload. Dispatch is strictly additive — do not change a
  wrapper's default return.
- The ESPN `summary` parser is a dispatcher: it returns 21 sub-frames, or one when
  given a `section` arg.

The browser-safe barrel is `src/parsers/index.ts` (the `sportsdataverse/parsers`
subpath export). It must import only browser-safe code (`_normalize`, sibling
parsers, `papaparse`) — never node-only HTTP deps. Run `npm run bundle:parsers` after
editing any parser so the playground bundle stays current.

## Testing

- Tests live under `test/**/*.test.js` and run with **Mocha** + `should`.
- **No network in the default suite** — use captured fixtures.
- `npm test` runs `npm run build` first (via `pretest`), then Mocha.
- Add a test for any new endpoint, parser, or bug fix. Parser tests should be
  payload-agnostic where possible so re-captured fixtures keep working.

## Docs & playground

- The Docusaurus site is under `docs/`. The reference subtree
  (`docs/docs/reference/**`) and playground metadata are **generated** — edit the YAML,
  not the Markdown. Conceptual pages (`docs/docs/intro.md`, tutorials, architecture)
  are hand-authored and survive regeneration.
- Build the site to confirm nothing broke:

  ```sh
  cd docs && npx docusaurus build
  ```

- The playground runs the **bundled** parser layer
  (`docs/src/playground/parsers.bundle.mjs`) plus a serverless proxy
  (`docs/api/run.mjs`). Rebundle with `npm run bundle:parsers` after parser changes.

### Getting-started guides (`.mdx` + live RunCell)

- The guides live as `.mdx` files under `docs/docs/guides/` (quickstart, per-sport,
  providers). They're hand-authored — write prose + runnable raw-vs-parsed snippets.
- **`<RunCell>` is embeddable inline in any guide.** Import it
  (`import RunCell from '@site/src/components/RunCell'`) and drop a single-endpoint
  live runner: `<RunCell league="nba" endpoint="espn:scoreboard" parsed />`. It
  resolves the URL, **Run**s it via the `/api/run` proxy, and shows raw JSON or a
  tidy table. It is SSR-safe and works for every endpoint kind (ESPN incl.
  `leagueParam` leagues, the `summary` section selector, every flat family, and
  non-JSON Statcast CSV). A live Run needs the `/api/run` proxy (the Vercel
  function) — `npx docusaurus build` itself needs no network.

### Frozen example tables (the output injector)

- `tools/docs/inject-outputs.mjs` freezes **real** parsed tables into guides between
  `<!-- inject:example:<id> -->` … `<!-- /inject -->` markers, driven by the manifest
  `tools/docs/examples.mjs`. It runs the committed `parsers.bundle.mjs` against
  committed fixtures (deterministic, no network).
- **After you change `src/parsers/**` (and `npm run bundle:parsers`) or add/edit an
  example, run `npm run docs:examples`** to refresh the tables, then commit them.
  `npm run docs:examples:check` is a **CI drift gate** — it must stay green. Add a
  new example by dropping a fixture + an entry in `examples.mjs` + the marker pair in
  the target guide; `test/docs-examples.test.js` checks the manifest is consistent.

### The sport-grouped reference sidebar

- The ESPN reference sidebar is **grouped by sport automatically**. Codegen emits
  `docs/src/generated/reference-sidebar.js` (nesting each league reference doc under
  a category named for its `sport`, plus a "Providers" group), and `docs/sidebars.js`
  consumes it. **Never hand-edit either** — to regroup a league, edit its `sport` in
  `tools/codegen/endpoints/leagues.yaml` (or `SPORT_ORDER` in `generate.mjs`) and run
  `npm run codegen`. The reference `.md` pages stay flat (no URL changes); the file is
  drift-guarded by `npm run codegen:check`. A 🛝 Playground link sits near the top of
  the sidebar, and Docs / News / Tutorials / Playground appear in the navbar + footer.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(odds): add player-prop event-odds wrappers
fix(parsers): return [] for empty NHL boxscore
docs(reference): regenerate after mlb_api endpoint add
refactor(codegen): extract standalone-provider page renderer
chore(deps): bump typescript + re-lock
```

**Do not add AI/assistant co-author trailers or "Generated with …" lines.** Omit all
`Co-Authored-By:` trailers referencing AI tools (Claude, Copilot, Cursor, GPT,
Gemini, …) and never add a "🤖 Generated with" line to commits or PR bodies — whether
the change was generated, refactored, or reviewed with AI assistance.

## Opening a pull request

Before opening a PR, confirm:

- [ ] `npm test` passes.
- [ ] `npm run codegen:check` passes (regenerated output committed if you touched
      endpoint YAML / renderers).
- [ ] `npm run typecheck` is clean.
- [ ] `cd docs && npx docusaurus build` succeeds (for doc-affecting changes).
- [ ] No hand-edited generated files (`src/generated/**`, `docs/docs/reference/**`).
- [ ] Parsers rebundled (`npm run bundle:parsers`) if you changed `src/parsers/`.
- [ ] Conventional Commit messages, no AI attribution.

Fill out the [pull request template](.github/pull_request_template.md) and link any
related issue. Thank you for contributing!

## The SportsDataverse ecosystem

`sportsdataverse-js` is one of a family of open-source sports-data packages. If
you're adding a data source, check whether a sister package already implements it
— mirroring the R/Python surface keeps the ecosystem consistent:

- **Python** ([py.sportsdataverse.org](https://py.sportsdataverse.org)): `sportsdataverse-py`,
  `collegebaseball`, `sportypy`, `nwslpy`.
- **R** ([r.sportsdataverse.org](https://r.sportsdataverse.org)): `hoopR`, `wehoop`,
  `cfbfastR`, `fastRhockey`, `baseballr`, `recruitR`, `oddsapiR`, `softballR`,
  `cfb4th`, `cfbplotR`, `sportyR`, plus the `nflverse` family.

See the [README ecosystem table](README.md#the-sportsdataverse-ecosystem) for links.
