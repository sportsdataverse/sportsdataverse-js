---
title: How this library is built
sidebar_label: Overview
sidebar_position: 0
---

# How this library is built

Almost everything callable in `sportsdataverse` is **generated**: the ESPN wrappers, the
native (non-ESPN) families, the dataset loaders, their TypeScript row and params types, and
every reference page on this site come out of `tools/codegen/generate.mjs`. The generator
reads two kinds of input:

- **Vendored YAML** — endpoint and returns-schema YAML that [sportsdataverse-py](https://py.sportsdataverse.org/)
  owns. `npm run vendor` copies it verbatim from a pinned sdv-py commit into
  `tools/codegen/vendor/upstream/` (with a `LOCK` of git blob shas) and derives
  `tools/codegen/endpoints/<family>.yaml`. Never hand-edit a vendored file; it is clobbered on
  the next re-vendor and `npm run vendor:check` fails on the drift.
- **JS-owned YAML and TypeScript** — families that exist only here (`hockeytech`, `odds_api`,
  `yahoo_scores`, `recruiting`), the overlays that patch a vendored family, the utilities
  catalogue, the breaking-change register, and the hand-written runtime under `src/`.

Every generated file carries a visible footer naming its source and linking the page here
that explains it. The CI gates are `npm run vendor:check` (vendored inputs), `npm run
codegen:check` (every generated output, this site's pages included), `npm run api:check`
(the public API report) and `npm test`.

<!-- gen:status -->
| Surface | Source of truth | Generated | Count |
|---|---|---|---:|
| [ESPN (vendored)](./espn-vendored) | sdv-py `espn_*.yaml` at the pin | `src/generated/espn/*.ts`, `docs/docs/<league>/` | 126 endpoints × 30 leagues |
| [Native, vendored](./flat-vendored) | sdv-py `<family>.yaml` at the pin | `src/generated/flat/*.ts` | 23 families |
| [Native, JS-owned](./flat-js-owned) | `tools/codegen/endpoints/<family>.yaml` in this repo | `src/generated/flat/*.ts` | 4 families |
| [Dataset loaders](./loaders) | sdv-py `releases.yaml` + `loader_schemas.yaml` | `src/generated/loaders/*.ts` | 323 loaders |
| [Hand-written](./hand-written) | TypeScript under `src/` | `src/generated/utilities.ts`, `docs/docs/utilities/` | 208 utility exports |

sdv-py pin: [`89c638a61b8c`](https://github.com/sportsdataverse/sportsdataverse-py/commit/89c638a61b8c36f0f59159773260b8a0b998a5dc). 1060 native wrappers in total; 438 verified endpoints carry row types; 25 breaking changes on record.
<!-- /gen:status -->

## The surfaces

- [ESPN (vendored)](./espn-vendored) — one YAML per ESPN host family, bound on every league.
- [Native families, vendored](./flat-vendored) — MLB, NHL, stats.nba.com, PFF, … from sdv-py.
- [Native families, JS-owned](./flat-js-owned) — HockeyTech, The Odds API, Yahoo scores.
- [Dataset loaders](./loaders) — the `load*` readers of the published release parquet.
- [Hand-written modules](./hand-written) — parsers, analytics, odds math, models, producers,
  discovery, the HTTP core.

## Changing something

| You want to… | Edit | Then run |
|---|---|---|
| add / change a shared endpoint | sdv-py first; bump the pin in `tools/codegen/vendor.yaml` | `npm run vendor -- --ref <sha>` → `npm run codegen` |
| patch how JS binds a vendored family | `tools/codegen/overlay/<family>.yaml` | `npm run vendor -- --offline` → `npm run codegen` |
| add a JS-only endpoint | `tools/codegen/endpoints/<family>.yaml` (a JS-owned family) | `npm run codegen` |
| describe a returns-table column | sdv-py's `manual_column_descriptions.yaml` (vendored here) | re-vendor → `npm run codegen` |
| label a hand-written export | `tools/codegen/utilities.yaml` | `npm run codegen` |
| record a breaking change | `tools/codegen/breaking.yaml` (+ CHANGELOG.md) | `npm run codegen` |
| change the runtime | `src/` (never `src/generated/`) | `npm run build && npm test` |

Column descriptions on every returns table resolve through `tools/codegen/descriptions.mjs`:
the schema's own text, then sdv-py's hand-curated `manual_column_descriptions.yaml` (by schema
key, then `_global`), then the column descriptions mined from the SDV R packages
(`r_column_descriptions.yaml`: the league's package, its sport's siblings, the merged union).
`npm run codegen` prints the fill rate per family and writes
`docs/src/generated/description_coverage.json`.
