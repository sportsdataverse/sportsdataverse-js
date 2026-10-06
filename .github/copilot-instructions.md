# GitHub Copilot instructions — `sportsdataverse` (Node.js)

A TypeScript, ESM-only Node.js client (Node ≥ 20.18.1; developing needs ^20.19 / ≥ 22.12
for mocha 12 + c8 12) for sports data: 126 ESPN endpoints on 30 leagues, 1,059 native
wrappers across 27 families (14 on league namespaces, 13 provider namespaces), 323
release-dataset loaders, one parser layer, one error vocabulary. Public names are
sportsdataverse-py's. `CLAUDE.md` is the deep-dive; this file is the short version.

## Architecture — five surfaces, one generator

`tools/codegen/generate.mjs` is a pure file-in / file-out renderer (no network) over
`tools/codegen/endpoints/*.yaml` + `schemas/`. It writes `src/generated/**`
(`wrappers`, `leagues`, `aliases`, `namespaces`, `espn/<league>.ts`, `flat/<family>.ts`,
`params/`, `rows/`, `loaders/`, `loader_rows/`, `utilities.ts`), the docs
(`docs/docs/<league>/`, `docs/docs/reference/`, `docs/docs/utilities/`, the
`<!-- gen:status -->` blocks of `docs/docs/architecture/`, `docs/src/generated/`) and
`docs/src/playground/endpoints.json`.

- **Vendored (sdv-py owns it):** the ESPN families, `leagues`, `releases.yaml`,
  `loader_schemas.yaml`, `mlb`, `mlb_statcast`, `nfl_api`, the four `nhl_*`, `cbs`,
  `fox`, `yahoo`, `torvik`, `sports247*`, `on3`, `nba_stats`, `wnba_stats`, the
  subscription and keyless families, every returns schema they reference, and the two
  column-description files. `npm run vendor -- --ref <sha>` copies them verbatim into
  `tools/codegen/vendor/upstream/` (hash `LOCK`) and derives `endpoints/` + `schemas/`.
  Change them in **sdv-py first**; JS-side patches go in `tools/codegen/overlay/<family>.yaml`.
- **JS-owned YAML:** `hockeytech`, `odds_api`, `yahoo_scores`, `recruiting`,
  `espn_parser_map.yaml`, `utilities.yaml`, `breaking.yaml`, `vendor.yaml` — edit here.
- **Hand-written TypeScript (`src/`):** parsers, analytics, odds math, cricket WP,
  producers, discovery, the HTTP core (`request` → transport → retry → classify),
  the legacy `get*` services. Catalogued by `utilities.yaml` (a listed export the
  source lacks fails codegen).
- **Loaders:** one `load*` per `releases.yaml` entry; `src/core/releases.ts` decodes
  parquet with hyparquet, skips a 404 season, applies the INT64 policy.
- **Namespace assembly** (`src/index.ts`): legacy services → `makeLeagueModule` (ESPN)
  → `makeFlatModule` (flat, additive, never clobbering; `FLAT_API_NAMESPACES` must match
  the copy in `generate.mjs`) → hand-written extras.

## Binding rules

- **Never hand-edit generated or vendored files.** Every generated file carries an
  `AUTO-GENERATED` header; vendored YAML starts `# VENDORED from …`. Edit the YAML or the
  renderer (`generate.mjs`, `render-loaders.mjs`, `row-types.mjs`, `utilities.mjs`,
  `breaking.mjs` — there are no templates) and run `npm run codegen`. The sport-grouped
  sidebar (`docs/src/generated/reference-sidebar.js`) and the homepage data are codegen-owned too.
- **Column descriptions never go into vendored schema YAML** (re-vendor clobbers them).
  They resolve from sdv-py's `manual_column_descriptions.yaml` → `r_column_descriptions.yaml`
  (`tools/codegen/descriptions.mjs`); `test/codegen-descriptions.test.js` holds the fill floor.
- **Integer id columns are decimal strings on every surface** (`id`, `*_id`, `game_pk`,
  `playerId`, …; one predicate `isIdColumn` in `src/core/id_columns.ts`). Never emit a numeric
  id, never `"123.0"`; a non-integer id column is left as read with one `SDV_INT64` warning.
- **Error vocabulary** (`src/core/errors.ts`, all under `SdvError`): `NoDataError` = the
  fetch worked and nothing is there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the
  fetch failed (403 / 429 / 5xx after retries, network, empty or non-JSON 2xx);
  `InvalidParameterError` = 400 / 422, never retried. **A failed fetch is never returned
  as empty data.** `safeCause` redacts credentials from every `cause`.
- **Parsers never throw:** `(raw) => rows[]`, `[]` on empty / malformed input, flat
  snake_cased rows via `normalize`. `{ parsed: true }` is strictly additive — the raw
  default return of a wrapper never changes. After editing `src/parsers/**` run
  `npm run bundle:parsers` (the playground bundle is byte-compared in a test).
- **Fixtures are real captures with provenance** (`test/fixtures/<dir>/README.md`: URL,
  date, trimming, consuming test; sdv-py-sourced captures cite the commit and are
  byte-identical). Synthetic payloads only as labelled malformed-/empty edge cases. The
  parser-parity harness (`test/parsers/parity.test.js`) checks returns tables and row
  types against sdv-py's own output; a table that fails on a real capture is dropped via
  `vendor.yaml`, never patched to pass.
- **Coverage thresholds are never lowered.** `npm test` runs mocha under c8
  (`.c8rc.json`: lines 94 / functions 95 / branches 84 over `dist/**` minus
  `dist/generated/**`); a measured rise may raise them.
- **Tests are no-network.** Mocha + `should`; live suites sit behind `SDV_LIVE=1`
  (stats.nba.com / stats.wnba.com behind `SDV_NBA_STATS_LIVE=1`, subscription families
  behind their own gates).
- **Typed, strict.** `tsconfig.json` is `strict: true` over all of `src/`; no new `any`
  (type payloads `unknown` and narrow). A public-API change needs `npm run api:report`
  and the updated `etc/*.api.md` committed.
- **Docs:** generated pages are never hand-edited; `docs/docs/intro.md`, `guides/`,
  `tutorials/` and the prose of `architecture/` are hand-authored. Tutorials freeze
  `examples/NN_*.mjs` output through `npm run docs:examples` (`docs:examples:check` gates
  it); new examples run offline via `examples/_offline.mjs` fixtures.

## Gates (run before pushing; all run in CI)

```sh
npm run vendor:check          # vendored inputs match LOCK, no hand-edit
npm run codegen:check         # every generated output is current
npm run typecheck && npm run typecheck:strict
npm run api:check             # etc/*.api.md matches dist/*.d.ts
npm run pack:check            # npm pack + attw + publint --strict
npm test                      # build, mocha under c8, coverage thresholds
npm run docs:examples:check   # frozen tutorial output + examples-source.json current
cd docs && npx docusaurus build   # for doc-affecting changes (onBrokenLinks: throw)
```

## Commits / PRs

- [Conventional Commits](https://www.conventionalcommits.org/) with a scope
  (`feat(odds): …`, `fix(parsers): …`, `docs(readme): …`); `!` for a breaking change,
  which also gets a `tools/codegen/breaking.yaml` entry and a CHANGELOG `BREAKING` line.
- **Never add AI / assistant co-author trailers or "Generated with …" lines** to commits
  or PR bodies. The human author is the sole attributable contributor.
- Regenerate and commit generated output in the same change as the YAML / renderer edit.
- CHANGELOG: new work goes under `## Unreleased` (4.0.0 is unpublished on npm; latest is
  3.0.0); `docs/src/pages/CHANGELOG.md` is a mirror of the root file.

## Cheat sheet

There is a printable one-page reference for this package at
<https://sportsdataverse.org/cheatsheets/sportsdataverse-js.pdf>, one of [a set covering
every SportsDataverse package](https://sportsdataverse.org/cheatsheets). It is a hand-built
canvas: adding or renaming an exported function means the sheet needs a revision too.
