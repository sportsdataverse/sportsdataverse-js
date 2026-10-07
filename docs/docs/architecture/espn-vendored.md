---
title: ESPN (vendored)
sidebar_label: ESPN (vendored)
sidebar_position: 1
---

# ESPN cross-league surface (vendored)

**Source of truth:** sportsdataverse-py's ESPN endpoint YAML at the pinned commit — one file
per host family (`espn_site_v2`, `espn_core_v2`, `espn_web_v3`, `espn_fitt_v3`, `espn_cdn`) plus
`leagues.yaml` (the league matrix) and `espn_rename_map.yaml` (sdv-py's curated renames).
`npm run vendor` copies them verbatim into `tools/codegen/vendor/upstream/` and derives
`tools/codegen/endpoints/espn_*.yaml`. The parser map (`espn_parser_map.yaml`) and the ESPN
returns schemas (`tools/codegen/schemas/espn/*.yaml`) are JS-owned: the JS parsers in
`src/parsers/espn.ts` are ports of sdv-py's, and their columns were captured from real payloads.

<!-- gen:status -->
sdv-py pin: [`89c638a61b8c`](https://github.com/sportsdataverse/sportsdataverse-py/commit/89c638a61b8c36f0f59159773260b8a0b998a5dc).

| Family YAML | Host |
|---|---|
| `tools/codegen/endpoints/espn_site_v2.yaml` | `site.api.espn.com` |
| `tools/codegen/endpoints/espn_core_v2.yaml` | `sports.core.api.espn.com` |
| `tools/codegen/endpoints/espn_web_v3.yaml` | `site.web.api.espn.com` |
| `tools/codegen/endpoints/espn_fitt_v3.yaml` | `site.web.api.espn.com` (FPI) |
| `tools/codegen/endpoints/espn_cdn.yaml` | `cdn.espn.com` |

126 endpoint shorts bound on 30 leagues.
<!-- /gen:status -->

**Generator step:** `generate.mjs` loads the family YAML, applies sdv-py's emit-time naming
(`athlete` → `player`, `event` → `game`, the curated renames, version-qualifying on a collision),
resolves every pre-v4 name to a deprecated alias, and renders:

- `src/generated/espn/<league>.ts` — one written module per league, a real `export const` per
  endpoint with a typed signature (`Wrapper<Row[], Espn<Short>Params>`) and TSDoc;
- `src/generated/params/espn.ts`, `src/generated/aliases.ts`, `src/generated/leagues.ts`,
  `src/generated/wrappers.ts`, `src/generated/namespaces.ts`;
- `docs/docs/<league>/index.md` + `reference/{site,core,web,fitt,cdn,additional}.md` — the
  per-function reference (summary, endpoint URL, params, returns table, example);
- `docs/docs/reference/espn-parsed-returns.md` — one returns table per parser;
- `docs/src/playground/endpoints.json` — the playground's catalogue.

**Where output lands:** `src/generated/espn/`, `docs/docs/<league>/`, `docs/docs/reference/`.

**CI drift gate:** `npm run vendor:check` (the derived YAML matches the vendored copy and the
LOCK), `npm run codegen:check` (every rendered file matches), `test/naming.test.js` (JS names
equal sdv-py's at the pin), `test/espn-contract.test.js` and `test/espn-parser-map.test.js`.

**How to change it:** a new or changed endpoint lands in sdv-py first; then
`npm run vendor -- --ref <sha>` and `npm run codegen`. A JS-side divergence is an overlay
(`tools/codegen/overlay/`), never an edit to a vendored file. A returns table's columns come
from the parser's schema file; its descriptions from `manual_column_descriptions.yaml` (vendored
from sdv-py) — add text there, in sdv-py.
