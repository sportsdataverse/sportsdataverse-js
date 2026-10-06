---
title: Native families (JS-owned)
sidebar_label: Native, JS-owned
sidebar_position: 3
---

# Native (non-ESPN) families — owned by this repo

**Source of truth:** `tools/codegen/endpoints/<family>.yaml` in this repository, written by
hand (no `# VENDORED` header), with returns schemas under `tools/codegen/schemas/native/<family>/`
that were captured from real payloads. These families either exist only in JS or were ported
before sdv-py had them: the HockeyTech / LeagueStat gateway behind the PWHL and the junior and
minor leagues, The Odds API, Yahoo's scoreboard feed and the deprecated 247Sports
`recruiting` routes.

<!-- gen:status -->
| Family | wrappers |
|---|---:|
| `odds_api` | 10 |
| `recruiting` | 25 |
| `yahoo_scores` | 2 |
| `hockeytech` | 16 |
<!-- /gen:status -->

**Generator step:** the same as a [vendored family](./flat-vendored): `generate.mjs` renders
the written module, its params types, row types for the parity-verified endpoints, and the
docs section or provider page. The HockeyTech family additionally gets the hand-written
analytics (`src/analytics/`) and season helpers mounted on `sdv.hockeytech` by `src/index.ts`.

**Where output lands:** `src/generated/flat/`, `src/generated/params/`,
`docs/docs/reference/<provider>.md`.

**CI drift gate:** `npm run codegen:check`, `test/flat-contract.test.js`, and the family's
own tests (`test/analytics/`, `test/parsers/`). `npm run vendor:check` reports a JS-owned file
that shadows a vendored path as an orphan, so the two cannot collide.

**How to change it:** edit the family's YAML (and the schema file under `schemas/` when the
parser's columns change), then `npm run codegen`. Column descriptions for a JS-owned schema go
in the schema file's `description` field — the only place the generator reads JS-owned text
from; sdv-py's description files are consulted only for the blanks.
