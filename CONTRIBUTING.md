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
- [Release dataset loaders](#release-dataset-loaders)
- [The parser contract](#the-parser-contract)
- [The error vocabulary](#the-error-vocabulary)
- [Utilities catalogue and breaking changes](#utilities-catalogue-and-breaking-changes)
- [Testing](#testing)
- [Docs & playground](#docs--playground)
- [Commit conventions](#commit-conventions)
- [Opening a pull request](#opening-a-pull-request)

## Prerequisites

- **Node ≥ 20.18.1** (see `engines` in `package.json`) to *use* the package. To
  *develop* it you need **Node ^20.19 or >= 22.12**: the test runner (`mocha` 12)
  and coverage tool (`c8` 12) require that; `engines` is unchanged because they are
  devDependencies.
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
| `npm run vendor -- --ref <sha>` / `npm run vendor:check` | re-vendor sdv-py's YAML + schemas at a pin / **vendor gate** (CI) |
| `npm run docs` | TypeDoc (local only; the site builds its own API pages) |
| `npm run build` | compile TypeScript to `dist/` |
| `npm run typecheck:strict` | `tsc -p tsconfig.strict.json` (equals the build; CI) |
| `npm test` | Mocha suite over `test/**/*.test.js` under **c8** (no network; coverage thresholds enforced) |
| `npm run coverage:generated` | re-report the last run over `dist/generated/**` alone (not gated) |
| `npm run docs:examples` / `docs:examples:check` | refresh / **gate** the frozen guide + tutorial outputs and `examples-source.json` |
| `npm run api:report` | rewrite the API Extractor reports `etc/*.api.md` from the built `.d.ts`; commit them with any public-API change |
| `npm run api:check` | **API gate** (CI) — fails if `etc/*.api.md` is stale |
| `npm run pack:check` | `npm pack`, then `@arethetypeswrong/cli` + `publint --strict` on that tarball (CI) |

## Architecture overview

The library is **codegen-driven**. `tools/codegen/generate.mjs` reads the vendored
endpoint YAML in `tools/codegen/endpoints/*.yaml` — the single source of truth — and
generates:

- the runtime TypeScript under `src/generated/`: the wrapper / league / alias /
  namespace tables (`wrappers.ts`, `leagues.ts`, `aliases.ts`, `namespaces.ts`), the
  written ESPN and flat modules (`espn/<league>.ts`, `flat/<family>.ts`), the params
  and row types (`params/`, `rows/`), the release loaders and their row types
  (`loaders/`, `loader_rows/`) and the utilities table (`utilities.ts`);
- the docs: per-league dirs (`docs/docs/<league>/`), the shared + provider reference
  pages (`docs/docs/reference/`), the utilities catalogue (`docs/docs/utilities/`), the
  `<!-- gen:status -->` blocks of `docs/docs/architecture/` and `docs/src/generated/`
  (sidebar, coverage); and
- the playground metadata `docs/src/playground/endpoints.json`.

Three kinds of callables:

- **ESPN** (`espn_site_v2.yaml`, `espn_core_v2.yaml`, `espn_web_v3.yaml`,
  `espn_fitt_v3.yaml`, `espn_cdn.yaml`) — one core, parameterized on `(sport, league)`
  slugs: **126 endpoint short names** exposed across **30 leagues** as
  `espn_<league>_<short>` + `espn<League><Short>`.
- **Flat APIs** (non-ESPN absolute hosts) — **1059 wrappers across 27 families**:
  **14 league families** (MLB Stats, Statcast, NHL ×4, NFL.com, PFF API, NFL Pro,
  KenPom, MLS, NWSL, stats.nba.com, stats.wnba.com) merged onto their league
  namespace, and **13 provider families** (Odds / 247 RDB + site pages / old 247 /
  CBS / Fox / Yahoo ×2 / HockeyTech / BartTorvik men's + women's / On3 / ASA) on
  standalone `sdv.<provider>.*` namespaces. `npm run codegen` prints the current
  counts.

- **Release loaders** — **323 `load*` functions**, one per entry of sdv-py's
  `releases.yaml` (see [Release dataset loaders](#release-dataset-loaders)).

Every wrapper returns raw JSON by default; `{ parsed: true }` runs it through a
registered **parser** → a tidy array of flat, snake_cased row objects. See
[`CLAUDE.md`](CLAUDE.md) for the full deep-dive and the
[How this library is built](https://js.sportsdataverse.org/docs/architecture/) pages
for the per-surface account (source of truth, generator, gate, how to change it).

## Codegen workflow

> **Generated files are never hand-edited.** Every file under `src/generated/` and
> `docs/docs/reference/` starts with an `AUTO-GENERATED … do not edit by hand`
> header. Edit the **YAML** (or the string-builder renderers — `generate.mjs`,
> `render-loaders.mjs`, `row-types.mjs`, `utilities.mjs`, `breaking.mjs`; there is no
> templates directory) and regenerate.

The loop is:

```sh
# 1. edit tools/codegen/endpoints/<file>.yaml  (or a renderer under tools/codegen/)
npm run codegen          # 2. regenerate the runtime + docs + playground outputs
npm run codegen:check    # 3. confirm there is no drift
git add src/generated docs/docs docs/src/generated docs/src/playground tools/codegen
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
npm run vendor:check:online     # CI + weekly sync: LOCK shas == sdv-py's git tree at the pin
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
  (rewrite it with `SDV_PARITY_WRITE=1 npx mocha test/parsers/parity.test.js`),
  and a column it lists as unexercised (null in every capture) is typed `unknown`.
  `tools/codegen/row-types.mjs` holds the column rule; `test/types/agreement.test.js`
  checks every parsed value of every capture against the generated TypeScript, so a
  newly verified endpoint is type-checked against its real capture automatically.
- A vendored returns schema must have a shape JS understands, or `npm run vendor`
  fails (`checkSchemaShape` in `vendor.mjs`): `kind: dataframe` + `columns`,
  `kind: frames` + `frames: [{section, columns}]` (one table per key of the parser's
  dict; the harness checks each frame, the docs render one table per frame), or
  `unverified: <reason>` with no columns (no table; the docs print the reason).
- `npm run vendor` deletes (and `vendor:check` flags) only the exact py schema
  copies it wrote and no longer attaches (byte-identical to the upstream copy);
  JS-authored schemas are never touched, wherever they live. Across a pin bump,
  `npm run vendor` (only it; the old upstream copy is gone by the time `vendor:check`
  runs) also prunes copies only the OLD pin vendored, compared against the outgoing
  derived outputs per family; a family whose outgoing outputs cannot be derived is named
  and skipped.
- `vendor:check:online` closes the gap the offline gate leaves (a copy and its LOCK line
  edited together, or a LOCK line dropped): every LOCK blob sha must equal
  `git/trees/<ref>` of sdv-py at the pin AND LOCK's path set must equal what the vendor
  fetches (one shared path-selection helper). Unauthenticated, or `GITHUB_TOKEN`;
  5xx/network errors get up to 3 attempts, 403/404 and exhausted attempts fail; it never passes unverified.
- A new param `transform:` upstream fails `npm run codegen` until it is ported to
  `src/core/transforms.ts` (+ `docs/src/playground/resolve.mjs`) and listed in
  `tools/codegen/param-transforms.mjs`.
- JS-owned families (`odds_api`, `hockeytech`, `yahoo_scores`, `recruiting`)
  are edited here directly, as before. (`fox` is vendored from sdv-py's `fox_api`
  since v4; its JS-only deprecated routes live in `overlay/fox.yaml`.)
- An overlay addition may set `public_name:` to keep a pre-v4 name instead of the
  family pattern's (used for the dead Fox routes sdv-py dropped).
- **Public names are sdv-py's (v4).** `generate.mjs` ports py's emit-time rename
  layer, so never rename by hand: ESPN shorts get py's convention rename
  (`athlete`→`player`, `event`→`game`, …) plus the vendored `espn_rename_map.yaml`;
  a flat family is named by its YAML `name_pattern` / `qualifier` (not its file
  stem). Names py's own hand-written functions occupy are listed in
  `vendor.yaml` `py_reserved`; `test/naming.test.js` compares the result with
  sdv-py's generated names at the pin (`tools/codegen/py_public_names.json`, which
  `npm run vendor` derives from verbatim, LOCK-verified copies of sdv-py's generated
  modules in `vendor/upstream/py/`; `vendor:check` covers it). Pre-v4 names stay callable as
  deprecated aliases generated from `tools/codegen/pre_v4_names.json`, which holds two
  frozen snapshots: `published` (every name of the `sportsdataverse@3.0.0` npm tarball)
  and the later pre-v4 development names (`exports` / `namespaces`, read from the built
  package at origin/main 76b0d719e4). Neither is regenerated; aliases derive from their union.

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

## Release dataset loaders

The 323 `load*` functions read the published SportsDataverse / nflverse release
parquet. They are generated, not hand-written:

- **Source of truth:** sdv-py's `releases.yaml` (vendored verbatim to
  `tools/codegen/endpoints/releases.yaml`) names each loader, its release URL pattern,
  season floor and `id_int64` columns; sdv-py's `schemas/loader_schemas.yaml` (also
  vendored) gives each loader's columns and dtypes.
- **Generated:** `src/generated/loaders/<league>.ts` (`render-loaders.mjs`; one
  camelCase `loadNbaPbp` + snake alias `load_nba_pbp` per entry) and
  `src/generated/loader_rows/<league>.ts` (`loader-types.mjs`; one `Load<Name>Row`
  interface per loader, re-exported from the package root), plus each league's
  `reference/loaders.md` with a returns table per loader.
- **Runtime:** `src/core/releases.ts` — hyparquet decode, the `releases` transport
  family, `seasons` / `columns` / `format: "columns"` / `maxCells`, the 404-season skip
  (a failed fetch still throws `AssetFetchError`), and the integer policy: id columns
  are decimal strings, other INT64 columns `number` or `BigInt`.
- **Adding or changing a loader** happens in sdv-py (`releases.yaml` +
  `loader_schemas.yaml`), then `npm run vendor -- --ref <sha>` and `npm run codegen`.
- **Tests:** `test/types/loader-agreement.test.js` checks every value of the committed
  real release fixtures (`test/fixtures/releases/`) against the generated row type;
  the loader runtime tests run on those same fixtures behind a stubbed transport.

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

The browser-safe barrel is `src/parsers/browser.ts` (what `npm run bundle:parsers`
builds the playground bundle from). It must import only browser-safe code
(`_normalize`, sibling parsers, `papaparse`) — never node-only HTTP deps. The
`sportsdataverse/parsers` subpath export, `src/parsers/index.ts`, is that barrel
plus node-only parsers (KenPom's cheerio HTML parser, registered via
`registerParser`). Run `npm run bundle:parsers` after editing any parser so the
playground bundle stays current.

## The error vocabulary

Every wrapper, loader and legacy `get*` method fetches through `src/core/request.ts`
(auth provider → transport → retry → classification) and throws from one vocabulary
(`src/core/errors.ts`, all subclasses of `SdvError`):

| Error | When | Retried? |
|---|---|---|
| `NoDataError` | the fetch **worked** and there is nothing there: HTTP 404, ESPN's 200 `{ code: 404 }` | no |
| `AssetFetchError` | the fetch **failed** and the answer is unknown: 403 / 429 / 5xx after the retry budget, a network error, an empty or non-JSON 2xx body | yes, first |
| `InvalidParameterError` | 400 / 422 — the call as made can never succeed | never |
| `SeasonNotFoundError` | a loader season below its floor | no |
| `TransportUnavailableError` | an optional peer (`impit`, `playwright`) is missing | no |

Rules: a failed fetch is **never** returned as `[]` / `{}` / `""`; never collapse
`NoDataError` into `AssetFetchError` (a failed fetch recorded as an empty season is
silent data loss); a family narrows the retry set or maps a final response with
`registerFamilyDefaults(family, { retryStatuses, classifyError })`; every `cause` goes
through `safeCause`, so credentials never reach an error. `NoESPNDataError` is an alias
of `NoDataError`. `tools/oracle/error_vocabulary_oracle.py` records sdv-py's own outcome
for the wire cases the tests replay.

## Utilities catalogue and breaking changes

- **`tools/codegen/utilities.yaml`** labels every hand-written non-data export
  (module, name, category, one-liner). Codegen renders `docs/docs/utilities/` (signatures
  read off the TypeScript source), `src/generated/utilities.ts` and a sidebar group;
  `listFunctions(ns, { detail: true })` labels entries with it. A new exported helper
  in `src/` gets a YAML entry, or `test/utilities-catalogue.test.js` fails; a listed
  name the source lacks fails codegen.
- **`tools/codegen/breaking.yaml`** is the register of breaking changes (version, the
  surface — `espn`, `flat:<family>`, `loaders`, `legacy`, `core` — and a one-line
  summary linking the CHANGELOG anchor). Codegen puts a `:::danger Breaking in <version>`
  admonition on every affected generated page and the "Breaking changes by version"
  table on `reference/deprecations.md`. A `!:` commit adds a YAML entry **and** a
  CHANGELOG line under the release's `### BREAKING` heading.
- In both cases: edit the YAML, run `npm run codegen`, commit the regenerated output.

## Testing

- Tests live under `test/**/*.test.js` and run with **Mocha** + `should`.
- **No network in the default suite** — use captured fixtures.
- `npm test` runs `npm run build` first (via `pretest`), then Mocha **under c8**.
- Add a test for any new endpoint, parser, or bug fix. Parser tests should be
  payload-agnostic where possible so re-captured fixtures keep working.
- **Fixtures are real captures with provenance.** Every `test/fixtures/<dir>/` has a
  `README.md` naming each file's request URL, capture date, trimming and consuming
  test; a capture copied from sdv-py cites the commit and is byte-identical. Synthetic
  payloads survive only as labelled malformed-/empty-payload edge cases (the three
  suites with no public capture anywhere are listed in `test/fixtures/README.md`).
- **Coverage gate.** `.c8rc.json` measures `dist/**` minus `dist/generated/**` (the
  generated modules are contract-tested by the codegen suites) and `npm test` fails
  below **lines 94 / functions 95 / branches 84** — the measured baseline at the time
  the gate landed. The thresholds are never lowered; raise them when the measured
  number rises. `npm run coverage:generated` reports the generated tree separately.
  CI uploads `coverage/lcov.info`.
- Live suites are gated: `SDV_LIVE=1` (ESPN + keyless families, run by the weekly
  `live-smoke.yml`), `SDV_NBA_STATS_LIVE=1` (stats.nba.com / stats.wnba.com, never in
  CI), and per-family gates for the subscription families (`SDV_PFF_LIVE`,
  `SDV_KENPOM_LIVE`, `SDV_NFL_PRO_LIVE`).

## Docs & playground

- The Docusaurus site is under `docs/`. The reference subtree
  (`docs/docs/reference/**`) and playground metadata are **generated** — edit the YAML,
  not the Markdown. Conceptual pages (`docs/docs/intro.md`, tutorials, architecture)
  are hand-authored and survive regeneration.
- Build the site to confirm nothing broke:

  ```sh
  cd docs && npx docusaurus build   # onBrokenLinks: 'throw'
  ```

  On a box where the `@swc/html` native addon refuses to load, build through a
  throwaway wrapper config (`docs/docusaurus.local.config.js`, requiring the real one
  and setting `future.faster` to the flag object with `swcHtmlMinimizer: false`), build
  with `npx docusaurus build --config docusaurus.local.config.js`, and delete the
  wrapper before committing; CI builds the real config.

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

### Examples and tutorials (`examples/` + `docs/docs/tutorials/`)

- `examples/NN_<topic>.mjs` are the runnable scripts (one per surface); each prints one
  to three tables. They are the source of the tutorial pages. Run one with
  `npm run build && cd examples && node --import ./_resolve.mjs 01_nba_scoreboard_to_table.mjs`.
- **Offline by default.** `examples/_offline.mjs` installs a `configure({ transport })`
  that serves `test/fixtures/**` by URL and throws on an unrouted URL, so a script can
  never silently return `{}`; `SDV_LIVE=1` hits the real hosts instead. A new script
  needs its fixtures routed there (add a capture with a provenance README).
- `examples/_resolve.mjs` is a `--import` preload: it resolves `sportsdataverse` and
  `sportsdataverse/parsers` to the repo's `dist/` (no install), and `@sportsdataverse/*`
  (the unpublished sdvplot-js packages) from `SDVPLOT_JS_DIR` (default `../../sdvplot-js`,
  a sibling clone; see `examples/README.md` for the build steps). A script that needs an
  unbuilt sdvplot-js prints `skipped:` and exits 0, so CI stays green without it.
  **That means CI never runs the three `9x_sdvplot_*.mjs` scripts**: the injector keeps
  their committed source / output / artifacts, so a change to one of them, to
  `docs/docs/tutorials/sdvplot-*.mdx` or to `docs/static/examples/*` must be followed by a
  manual `SDVPLOT_JS_DIR=<built sdvplot-js> npm run docs:examples` before pushing (CI cannot
  catch a stale page there).
- **Tutorial pages** (`docs/docs/tutorials/<topic>.mdx`) carry a `script` entry in
  `tools/docs/examples.mjs`; `npm run docs:examples` runs the script offline and freezes
  its source (`<!-- inject:source:ex<NN> -->`) and stdout (`<!-- inject:example:ex<NN> -->`)
  into the page, copies declared artifacts to `docs/static/examples/`, and writes
  `docs/src/generated/examples-source.json` (`tools/docs/examples-source.mjs`) for the
  StackBlitz button. `docs:examples:check` fails on any drift. `test/examples.test.js`
  runs every script; `test/docs-examples.test.js` checks the wiring.
- To add a tutorial: write the script, route its fixtures, add the manifest entry and
  the page with both marker pairs + an `<OpenInStackBlitz src="examples/NN_*.mjs" />`
  under the source block, run `npm run docs:examples`, commit everything.

### llms.txt, live blocks and StackBlitz

- **llms.txt:** `docusaurus-plugin-llms` (in `docs/docusaurus.config.js`) emits
  `llms.txt`, `llms-full.txt` and a `.md` beside every page at build time; the TypeDoc
  tree (`docs/api/**`) is excluded from all three. `test/docs-llms.test.js` pins the
  config offline — change the options there too.
- **Live-editable blocks:** `@docusaurus/theme-live-codeblock` with the swizzled
  `docs/src/theme/ReactLiveScope` exposing the browser parser bundle, `fetchViaProxy`
  (POSTs the `/api/run` body — `{ league | api, endpoint, params }` — the proxy resolves
  URLs itself), `resolve` + `endpoints`, `<Table/>` and React. A ` ```jsx live noInline`
  block cannot `import` the package; use it for parser / transform snippets (see
  `guides/live-blocks.md`).
- **Open in StackBlitz:** `docs/src/components/OpenInStackBlitz` opens a snippet (`code=`)
  or a tutorial script (`src=`) as a Node project; the generated `package.json` pins
  `sportsdataverse: "latest"` until 4.x is published (`// TODO(release)`).
- Every page Docusaurus compiles is MDX: `test/docs-mdx.test.js` flags bare `{`, `<`
  and unknown tags (file:line) before the build does.

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

- [ ] `npm test` passes (coverage thresholds included).
- [ ] `npm run codegen:check` and `npm run vendor:check` pass (regenerated output
      committed if you touched endpoint YAML / renderers / `utilities.yaml` / `breaking.yaml`).
- [ ] `npm run typecheck` and `npm run typecheck:strict` are clean; `npm run api:check`
      passes (run `npm run api:report` and commit `etc/*.api.md` on a public-API change).
- [ ] `npm run docs:examples:check` passes (run `npm run docs:examples` after a parser,
      fixture, example or tutorial change).
- [ ] `cd docs && npx docusaurus build` succeeds (for doc-affecting changes).
- [ ] No hand-edited generated or vendored files (`src/generated/**`, `docs/docs/<league>/`,
      `docs/docs/reference/**`, `docs/docs/utilities/**`, `tools/codegen/vendor/upstream/**`).
- [ ] Parsers rebundled (`npm run bundle:parsers`) if you changed `src/parsers/`.
- [ ] New fixtures are real captures with a provenance README entry.
- [ ] A breaking change has a `tools/codegen/breaking.yaml` entry and a CHANGELOG line
      under `BREAKING`; other changes go under `## Unreleased`.
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
