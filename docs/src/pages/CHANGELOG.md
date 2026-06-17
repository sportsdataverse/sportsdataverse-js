# ChangeLog

## **V3.0.0**

A major release that turns `sportsdataverse` into a **cross-league ESPN client**
**plus a native (non-ESPN) live-API client** with a tidy parser layer.

- **Cross-league ESPN surface.** 116 endpoint wrappers are now generated for
  **29 leagues** (31 namespaces) from a single YAML source of truth — every
  league exposes the same `espn_<league>_<short>` methods (e.g.
  `sdv.nba.espn_nba_scoreboard()`, `sdv.soccer.espn_soccer_scoreboard({ league: 'eng.1' })`).
  Soccer, cricket, and the UFL join the existing NBA/NFL/NHL/MLB/WNBA/MBB/WBB/CFB set.
- **Native API integration (255 flat wrappers across 7 families).** Beyond ESPN,
  the package now wraps the major leagues' own live APIs, merged onto the matching
  league namespace:
  - **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlbApi*` (e.g. `mlbApiSchedule`).
  - **Baseball Savant / Statcast** (`baseballsavant.mlb.com`) — `sdv.mlb.mlbStatcast*`,
    including date-chunked Statcast search; heterogeneous CSV/JSON/HTML responses
    are content-type-aware.
  - **NHL api-web** game feed + **NHL EDGE** player tracking (`api-web.nhle.com`),
    **NHL Stats REST** (`api.nhle.com/stats/rest`), and **NHL Records**
    (`records.nhl.com`) — `sdv.nhl.nhlApiWeb*` / `nhlEdge*` / `nhlStatsRest*` / `nhlRecords*`.
  - **NFL.com "Shield" API** (`api.nfl.com`) — `sdv.nfl.nflApi*`, with automatic
    anonymous `WEB_DESKTOP` bearer-token minting (cached + auto-renewed; no
    credentials required).
- **tidy.js parser layer.** Every native wrapper returns the raw response by
  default; pass `{ parsed: true }` to run the payload through a registered parser
  that flattens it to a tidy array of row objects via a shared in-house
  `normalize` helper (a `json_normalize` equivalent). Strictly additive — omitting
  `parsed` is the unchanged raw-response behavior, matching `sdv-py`'s
  `return_parsed=True`. The [`@tidyjs/tidy`](https://github.com/pbeshai/tidy)
  toolkit is re-exported (`import { tidy } from 'sportsdataverse'`) so the parsed
  arrays compose directly with its grammar-of-data verbs.
- **Dual-case naming.** Every generated wrapper (ESPN and native) is exposed
  under BOTH its snake_case name (`mlb_api_teams`, py/R parity) and its camelCase
  canonical name (`mlbApiTeams`, idiomatic JS) — same function, either name.
- **Flat-aware docs + playground.** The generated reference pages now include a
  **Native API — `<family>`** section per league (host, path, params, parser, auth);
  the live [playground](/playground) groups native endpoints under their league by
  family and runs them through a flat-aware serverless proxy (host-allowlisted,
  with server-side token minting for NFL.com and content-type passthrough for
  Statcast CSV/HTML).
- **Migrated to TypeScript.** The package is authored in TypeScript and ships
  type declarations (`.d.ts`) alongside the ESM build. The compiler caught
  several latent bugs during the port.
- **ESM-only, Node ≥ 20.18.1.** `cheerio` 1.2 (via `undici` 7) sets the floor.
- **Codegen + drift gate.** `npm run codegen` regenerates the wrapper tables
  (ESPN + flat) and docs from `tools/codegen/endpoints/*.yaml`;
  `npm run codegen:check` fails CI if the committed output is stale.
- **Legacy methods preserved.** Every pre-3.0 method (`sdv.nba.getPlayByPlay(id)`,
  etc.) still works — the generated wrappers are merged *alongside* them.

## **V2.0.0**

- Major version bump to 2.0.0
- Convert to ESM (fixes tabletojson import error)
- Update dependency versions
- Remove broken functions due to API 404 so all tests pass (mbb getRankings, wbb getRankings, ncaa getTeamStats getScoringSummary)

## **V1.2.5**

- NFL getWeeklySchedule function added by @unmonk

## **V1.2.4**

- MLB functionality added by @unmonk (very grateful for the contribution!)

## **V1.2.0-2**

- Updated standings functions to be able to provide league-wide, conference and division for each applicable existing sport from ESPN.

## **V1.1.0**

The following breaking changes were made:

- submodules were just basically simplified/removed, all functions are just now `{sport-league}.getXXX`, eg. `cfb.getTeamList()` and no longer `cfbTeams.getTeamList()`;
- support for statistics from stats.ncaa.com added, so you can get information on everything from men's ice-hockey to women's bowling.
- Documentation website created and updated
