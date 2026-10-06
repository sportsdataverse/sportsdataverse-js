---
title: Native families (vendored)
sidebar_label: Native, vendored
sidebar_position: 2
---

# Native (non-ESPN) families — vendored from sdv-py

**Source of truth:** sportsdataverse-py's endpoint YAML for each family at the pinned commit
(`tools/codegen/vendor.yaml` → `families:`), with its returns schemas under
`tools/codegen/schemas/native/<family>/`. A family's YAML names the host, every endpoint's
path and params, its parser and its returns schema. `vendor.yaml` records per family which
sdv-py parsers the JS parsers are faithful ports of (`schema_compatible`), so a returns table
is attached only when it describes what the JS parser returns (fail-closed: no table beats a
wrong one). A family with `tools/codegen/overlay/<family>.yaml` gets JS-only endpoints and
patches merged on top.

<!-- gen:status -->
sdv-py pin: [`afafaedae47b`](https://github.com/sportsdataverse/sportsdataverse-py/commit/afafaedae47bca0799d64578e446d85d43b3f5ed).

| Family | wrappers |
|---|---:|
| `mlb` | 78 |
| `mlb_statcast` | 39 |
| `nhl_api_web` | 27 |
| `nhl_edge` | 35 |
| `nhl_stats_rest` | 21 |
| `nhl_records` | 44 |
| `nfl_api` | 15 |
| `sports247` | 12 |
| `sports247_site_pages` | 35 |
| `cbs` | 82 |
| `fox` | 38 |
| `yahoo` | 107 |
| `torvik` | 5 |
| `pff_api` | 68 |
| `nfl_pro` | 16 |
| `kenpom` | 30 |
| `bart_wbb` | 1 |
| `on3` | 78 |
| `asa` | 15 |
| `mls_api` | 12 |
| `nwsl_api` | 9 |
| `nba_stats` | 128 |
| `wnba_stats` | 111 |
<!-- /gen:status -->

**Generator step:** `generate.mjs` loads each `tools/codegen/endpoints/<family>.yaml`, applies
sdv-py's `name_pattern` / `qualifier` naming, and renders `src/generated/flat/<family>.ts` (a
written module, one `export const` per endpoint, typed `Wrapper` / `SectionedWrapper`),
`src/generated/params/<family>.ts`, and — for every endpoint the parser-parity harness verified
on a real sdv-py capture (`test/fixtures/py/parity_coverage.json`) — a row interface in
`src/generated/rows/<family>.ts`. The docs get a "Native API — family" section on the league
page (`docs/docs/<league>/reference/native.md`) or a standalone provider page
(`docs/docs/reference/<namespace>.md`), with a returns table and the row type per endpoint.

**Where output lands:** `src/generated/flat/`, `src/generated/rows/`, `src/generated/params/`,
the league `native.md` pages and `docs/docs/reference/<provider>.md`.

**CI drift gate:** `npm run vendor:check`, `npm run codegen:check`, `test/flat-contract.test.js`,
the parser-parity harness (`test/parsers/parity.test.js`) and `test/types/agreement.test.js`
(every parsed value on the committed captures against its generated row type).

**How to change it:** endpoints change in sdv-py, then re-vendor. A JS-only endpoint or a
different parser binding goes in the family's overlay. A parser port that diverges from sdv-py's
drops the returns table through `schema_incompatible` in `vendor.yaml` rather than shipping a
wrong one.
