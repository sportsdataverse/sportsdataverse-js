# ESPN API expansion plan — sportsdataverse.js

**Target release:** all of this work lands in **v3.0.0** (the TypeScript line, already on
`main` but not yet published to npm — npm `latest` is still `2.0.0`). The cross‑league
ESPN expansion accumulates onto `3.0.0` and is published once it's complete; individual
phases do **not** bump the version.

**Goal:** replace the 10 hand‑written, unevenly‑covered sport services with a
parameterized `(sport, league)` ESPN core — reaching parity with the Python package
(`sportsdataverse-py`), ideally **generated from the same metadata** so R / Python /
Node never drift.

---

## 1. Where things stand

### sportsdataverse.js (now)
- 10 hand‑written services (`cfb, mbb, mlb, nba, ncaa, nfl, nhl, tennis, wbb, wnba`),
  each with ~10–20 ad‑hoc methods (pbp, boxscore, summary, scoreboard, standings,
  rankings). No shared core; coverage is uneven sport‑to‑sport.
- As of v3.0.0: TypeScript, ESM, `dist/` build with `.d.ts`. Good foundation to build on.

### sportsdataverse-py (the model to match)
- One core (`sportsdataverse/_common_espn.py`) — **~127 core functions** parameterized on
  `(sport, league)`, wrapping every ESPN URL family once.
- Per‑league extension modules (`<league>/<league>_espn_ext.py`) — 4‑line files that call
  `make_league_module(sport, league, prefix, …)`.
- **121 curated short names** registered across the league matrix → **800+ wrappers**.
- A parser layer (raw `Dict` → tidy DataFrames) — *not* in scope to port to JS (see §5).
- **Codegen** from YAML endpoint metadata, with a `--check` drift gate in CI.

**Rough JS coverage today: ~15% of the families sdv‑py exposes** (missing athletes,
statistics, odds, injuries, news, depth charts, transactions, draft, futures, and the
entire Core API v2 `$ref` graph).

---

## 2. Phase 0 inventory (concrete)

### ESPN URL families (hosts) — from `sdv-py/tools/codegen/endpoints/leagues.yaml`
| family | host | ~endpoints |
|---|---|---:|
| `site_v2` | `https://site.api.espn.com/apis/site/v2/sports` | ~115 |
| `site_v2_alt` | `https://site.api.espn.com/apis/v2/sports` | (subset) |
| `web_v3` | `https://site.web.api.espn.com/apis/common/v3/sports` | ~28 |
| `core_v2` | `https://sports.core.api.espn.com/v2/sports` | ~416 (the `$ref` graph) |
| `cdn` | `https://cdn.espn.com/core/...` | (pbp/boxscore sidecars) |

### The league matrix — 29 leagues (`leagues.yaml`)
| group | prefixes |
|---|---|
| Core (8) | `nba, wnba, mbb, wbb, cfb, nfl, mlb, nhl` |
| College / spring (4) | `mch` (men's college hockey), `wch` (women's), `college_baseball`, `college_softball` |
| Other football (3) | `ufl, xfl, cfl` |
| Soccer (13) | `soccer` (league‑param catch‑all), `epl, laliga, bundesliga, seriea, ligue1, mls, ligamx, ucl, uel, nwsl, wwc, wc` |
| Cricket (1) | `cricket` (league‑param catch‑all) |

Each league declares `scopes` (`universal` + optional `ncaa` / `football` / `mlb`) that
select which wrapper tables apply — mirrors sdv‑py's
`_UNIVERSAL_WRAPPERS` / `_NCAA_WRAPPERS` / `_FOOTBALL_WRAPPERS` / `_MLB_WRAPPERS`.

### Shared metadata source — `sdv-internal-refs/espn/`
Already drives sdv‑py. Contains:
- `catalogs/` — curated endpoint catalog
- `inputs/crawler_output*/` — raw ESPN crawl per sport
- `overlays/` — manual corrections
- `tools/espn_gen/` — the generator

**This is the leverage:** one metadata source → R + Python + **JS**. The JS work is mostly
(1) a TS core mirroring the URL families and (2) a generator reading that same metadata.

---

## 3. Target architecture (TS)

```
src/
  core/
    client.ts        // shared axios instance (UA, timeout, retry, proxy hook)
    espn.ts          // ~the URL-family core fns, parameterized on (sport, league)
                     //   siteV2(...), siteV2Alt(...), webV3(...), coreV2(...), cdn(...)
    types.ts         // LeagueConfig {sport, league, prefix, scopes}, endpoint param types
  leagues/
    _make.ts         // makeLeagueModule(cfg) -> { espn_<prefix>_<short>: fn, ... }
    nba.ts wnba.ts ... soccer.ts cricket.ts          // thin, mostly generated
  compat/
    cfb.ts nba.ts ...// legacy sdv.cfb.getPlayByPlay() mapped onto the new core (NO break)
  index.ts           // default export { cfb, nba, ... } (compat) + named cross-league API
tools/codegen/       // reads sdv-internal-refs/espn metadata -> emits src/leagues/*.ts
                     //   + `--check` drift gate (CI)
```

`makeLeagueModule` is the TS analogue of sdv‑py's `make_league_module`: it partially
applies `(sport, league)` to the core fns and registers each `espn_<prefix>_<short>`.

---

## 4. Phases (all under v3.0.0)

- **Phase 0 — Inventory & contract.** ✅ done (this doc). Lock the public naming
  (`espn_<prefix>_<short>`) and the **back‑compat guarantee** (existing `sdv.cfb.*` keeps
  working).
- **Phase 1 — Core.** `src/core/{client,espn,types}.ts` — the URL‑family fns, typed,
  one shared client. Validate against the **basketball** family end‑to‑end.
- **Phase 2 — League binder.** `makeLeagueModule(cfg)`; wire `index.ts`; ship the
  basketball vertical slice (`nba, wnba, mbb, wbb`) as the first PR.
- **Phase 3 — Codegen.** TS generator over `sdv-internal-refs/espn` metadata → emits
  `src/leagues/*.ts`; add a `--check` drift gate to CI (same idea as sdv‑py's).
- **Phase 4 — Compat facade.** Map legacy per‑sport methods onto the new core; mark old
  names `@deprecated`.
- **Phase 5 — Remaining leagues.** football (`nfl, cfb, ufl, xfl, cfl`), baseball (`mlb,
  college_baseball, college_softball`), hockey (`nhl, mch, wch`), then soccer (13,
  league‑param) and cricket.
- **Phase 6 — Types & docs.** Tighten endpoint param types; TypeDoc reference per league.
- **Phase 7 — Tests.** Fixture‑based shape tests (capture payloads like sdv‑py's fixtures)
  + a gated live smoke in CI.

---

## 5. Decisions

1. **Raw JSON + typed shapes, not a parser layer.** sdv‑py parses to DataFrames; JS has no
   DataFrame norm. JS stays **raw‑JSON with typed return shapes** — far less work and
   idiomatic. (Porting the parser layer is explicitly out of scope.)
2. **Reuse `sdv-internal-refs/espn` as the source of truth** (one metadata → 3 languages),
   not a JS‑local catalog.
3. **Back‑compat is a hard requirement** — v3.0.0 must not break `sdv.cfb.getPlayByPlay`,
   etc. The legacy surface becomes a thin facade over the new core.
4. **Vertical slice first.** Prove core + binder + codegen on **basketball only** before
   scaling to all 29 leagues.

---

## 6. First step

Phase 1 + 2 for the **basketball family** (`nba, wnba, mbb, wbb`) as a small, reviewable
PR: the core URL‑family fns, `makeLeagueModule`, the 4 league modules, and a compat facade
preserving the existing `sdv.nba.*` / `sdv.wbb.*` methods — validated against live ESPN
endpoints. That round‑trips the architecture and de‑risks the codegen before going wide.
