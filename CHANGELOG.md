# Changelog

All notable changes to `sportsdataverse` (Node.js) are documented here. The
docs-site copy lives at [`docs/src/pages/CHANGELOG.md`](docs/src/pages/CHANGELOG.md)
and renders at <https://js.sportsdataverse.org/CHANGELOG>.

## v3.0.0

A major release that turns `sportsdataverse` into a **cross-league ESPN client**
**plus a native (non-ESPN) live-API client** with a tidy parser layer.

### ESPN cross-league surface

- **116 endpoint wrappers** generated for **29 leagues** (31 namespaces) from a
  single YAML source of truth — every league exposes the same
  `espn_<league>_<short>` methods (e.g. `sdv.nba.espn_nba_scoreboard()`,
  `sdv.soccer.espn_soccer_scoreboard({ league: 'eng.1' })`). Soccer, cricket, and
  the UFL join the existing NBA/NFL/NHL/MLB/WNBA/MBB/WBB/CFB set.

### Native API integration (255 flat wrappers across 7 families)

Beyond ESPN, the package now wraps the major leagues' own live APIs, merged onto
the matching league namespace:

- **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlbApi*` (e.g. `mlbApiSchedule`).
- **Baseball Savant / Statcast** (`baseballsavant.mlb.com`) — `sdv.mlb.mlbStatcast*`,
  including date-chunked Statcast search; heterogeneous CSV/JSON/HTML responses are
  handled by a content-type-aware getter.
- **NHL** — api-web game feed + EDGE player tracking (`api-web.nhle.com`),
  Stats REST (`api.nhle.com/stats/rest`), and Records (`records.nhl.com`):
  `sdv.nhl.nhlApiWeb*` / `nhlEdge*` / `nhlStatsRest*` / `nhlRecords*`.
- **NFL.com "Shield" API** (`api.nfl.com`) — `sdv.nfl.nflApi*`, with automatic
  anonymous `WEB_DESKTOP` bearer-token minting (cached + auto-renewed; no
  credentials required).

### tidy.js parser layer

- Every native wrapper returns the raw response by default; pass `{ parsed: true }`
  to run the payload through a registered parser that flattens it to a tidy array
  of row objects via a shared in-house `normalize` helper (a `json_normalize`
  equivalent). Strictly additive — omitting `parsed` is the unchanged raw-response
  behavior, matching `sportsdataverse-py`'s `return_parsed=True`.
- The [`@tidyjs/tidy`](https://github.com/pbeshai/tidy) toolkit is re-exported
  (`import { tidy } from 'sportsdataverse'`) so the parsed tidy arrays compose
  directly with grammar-of-data-manipulation verbs (`groupBy`, `summarize`, …).

### Dual-case naming

- Every generated wrapper (ESPN and native) is exposed under BOTH its snake_case
  name (`mlb_api_teams`, py/R parity) and its camelCase canonical name
  (`mlbApiTeams`, idiomatic JS) — the same function under either name.

### Docs + playground

- Generated reference pages now include a **Native API — `<family>`** section per
  league (host, path, params, parser, auth gate).
- The live [playground](https://js.sportsdataverse.org/playground) groups native
  endpoints under their league by family and runs them through a flat-aware
  serverless proxy — host-allowlisted (derived from the generated metadata), with
  server-side token minting for NFL.com and content-type passthrough for Statcast
  CSV/HTML so credentials never reach the browser and non-JSON bodies display raw.

### Tooling / housekeeping

- **Migrated to TypeScript.** Authored in TypeScript; ships `.d.ts` declarations
  alongside the ESM build.
- **ESM-only, Node ≥ 20.18.1.** `cheerio` 1.2 (via `undici` 7) sets the floor.
- **Codegen + drift gate.** `npm run codegen` regenerates the wrapper tables
  (ESPN + flat) and docs from `tools/codegen/endpoints/*.yaml`;
  `npm run codegen:check` fails CI if the committed output is stale.
- **Legacy methods preserved.** Every pre-3.0 method (`sdv.nba.getPlayByPlay(id)`,
  etc.) still works — the generated wrappers are merged *alongside* them.

## v2.0.0

- Major version bump to 2.0.0.
- Convert to ESM (fixes the `tabletojson` import error).
- Update dependency versions.
- Remove broken functions due to API 404s so all tests pass (mbb `getRankings`,
  wbb `getRankings`, ncaa `getTeamStats` / `getScoringSummary`).

## v1.2.5

- NFL `getWeeklySchedule` function added by @unmonk.

## v1.2.4

- MLB functionality added by @unmonk.

## v1.2.0–1.2.2

- Updated standings functions to provide league-wide, conference, and division
  splits for each applicable sport from ESPN.

## v1.1.0

Breaking changes:

- Submodules simplified/removed — all functions are now `{sport-league}.getXXX`
  (e.g. `cfb.getTeamList()` instead of `cfbTeams.getTeamList()`).
- Support for statistics from stats.ncaa.com added.
- Documentation website created.
