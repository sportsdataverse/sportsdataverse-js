---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 5
---

# Dataset loaders

**Source of truth:** sportsdataverse-py's `tools/codegen/endpoints/releases.yaml` (every
`load_*` dataset: its release base, tag, URL template, season floor, `id_int64` columns,
`on_missing` policy) and `schemas/loader_schemas.yaml` (the polars dtype of every column of
every loader's frame, captured from the release parquet), both vendored verbatim at the pin.

<!-- gen:status -->
sdv-py pin: [`afafaedae47b`](https://github.com/sportsdataverse/sportsdataverse-py/commit/afafaedae47bca0799d64578e446d85d43b3f5ed).

323 loaders on 9 namespaces: `sdv.cfb`, `sdv.mbb`, `sdv.mlb`, `sdv.nba`, `sdv.nhl`, `sdv.wbb`, `sdv.wnba`, `sdv.pwhl`, `sdv.nfl`.
<!-- /gen:status -->

**Generator step:** `tools/codegen/render-loaders.mjs` turns each entry into a written
`export const load<Name>` (plus its snake_case alias) in `src/generated/loaders/<league>.ts`,
delegating to the release core in `src/core/releases.ts` (download, size guard, parquet decode,
the integer-id policy). `tools/codegen/loader-types.mjs` turns each loader schema into a row
interface in `src/generated/loader_rows/<league>.ts` (`Load<Name>Row`): an id column of
integers is `string`, other `Int64` columns `number | bigint`, `Date` / `Datetime` columns
`Date`, every column optional and nullable. The docs page
`docs/docs/<league>/reference/loaders.md` renders, per loader, its options, an example, the
row type's name and a returns table whose descriptions come from sdv-py's
`manual_column_descriptions.yaml` (keyed by the loader's `load_*` name) and the R packages.

**Where output lands:** `src/generated/loaders/`, `src/generated/loader_rows/`,
`docs/docs/<league>/reference/loaders.md`, and `docs/docs/pwhl/` for a namespace that has
loaders but no ESPN league.

**CI drift gate:** `npm run vendor:check`, `npm run codegen:check`,
`test/types/loader-agreement.test.js` (the committed real release fixtures against the row
types), `test/releases.test.js`, and the live `test/releases-live.test.js`.

**How to change it:** a new dataset is a `releases.yaml` entry in sdv-py (the JS generator has
no stub path — a `stub:` entry fails the codegen) plus its loader schema; then re-vendor and
`npm run codegen`. A play-by-play loader also needs an `EXAMPLE_COLUMNS` entry in
`render-loaders.mjs` so its generated example passes `columns`.
