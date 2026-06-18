# ChangeLog

## **Unreleased**

### Changed (breaking) — provider method naming

Dropped internal vendor API codenames from provider method names + labels (the
`sdv.fox`/`cbs`/`yahoo`/`mlb` namespaces are unchanged):

- `foxBifrost*` → `fox*`, `cbsNapi*` → `cbs*`, `yahooShangrila*` → `yahoo*`,
  `yahooEditorial*` → `yahooScores*`, `mlbApi*` → `mlb*`.

The rename flows through the codegen stems, returns-schema paths, parser names,
playground ids, and docs. Real upstream URL paths that contain the vendor
codename (Fox `/bifrost/v1/…`, Yahoo `/v1/query/shangrila/…`) are unchanged.

## **V3.1.0**

A minor, additive release: two new flat-API families (no breaking changes), plus
the docs-site overhaul.

### New flat-API families

Two standalone provider namespaces join the flat-API surface — **532 flat-API
wrappers across 15 families** now (was 517 across 13). Both expose dual-case names
(snake_case + camelCase), accept `{ parsed: true }`, and ship fully
column-described returns tables.

- **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, 10 endpoints) — a
  **league-parameterized** women's + junior hockey family for the **PWHL** plus
  **AHL / OHL / WHL / QMJHL**; pick the league with a `league` slug
  (`sdv.hockeytech.hockeytech_schedule({ league: 'pwhl', parsed: true })`).
  Endpoints: `seasons`, `schedule`, `teams`, `team_roster`, `player_stats`,
  `game_shifts`, `standings`, `leaders`, `pbp`, `game_summary`. Hosts:
  `lscluster.hockeytech.com` (+ `cluster.leaguestat.com` for QMJHL). Its runtime
  (`src/core/hockeytech_runtime.ts`) unwraps the JSONP envelope
  (`angular.callbacks._N({…})`) before `JSON.parse`, switches the `gc` feed to
  `tab=` (not `view=`), applies the PWHL play-by-play key override, and injects
  each league's `client_code` / `key` / `site_id` from a per-league registry
  (overridable via `SDV_<LEAGUE>_API_KEY`). Ported from `fastRhockey` +
  `sportsdataverse-py`.
- **BartTorvik / T-Rank** (`sdv.torvik.*`, 5 endpoints) — men's
  college-basketball analytics (`ratings`, `team_factors`, `game_stats`,
  `player_stats`, `game_schedule`) from `barttorvik.com`. Its runtime
  (`src/core/torvik_runtime.ts`) sends a browser-like User-Agent (barttorvik
  rejects default UAs) and returns the raw body so each parser branches on format
  — CSV via papaparse, or `JSON.parse` of the **headerless positional column
  arrays** (31 / 55 / 67 fields, ported verbatim from `hoopR`'s `torvik_*.R`).

  A flat family needing non-JSON bodies or custom request shaping registers its
  own getter runtime in `GETTER_OVERRIDES` (`src/leagues/_make_flat.ts`), so the
  shared no-auth getter stays JSON-only.

  **Playground caveat:** QMJHL's secondary host works from the **library** but not
  the in-browser **playground** — the `/api/run` proxy allowlist derives one host
  per family, so QMJHL calls there hit the primary host. Use the library directly
  for QMJHL.

### Docs

A docs-site overhaul that makes the guides literate and the navigation
data-driven:

- **Sport-grouped reference sidebar.** ESPN league reference docs are now nested
  under a collapsible category named for their sport (plus a Providers group),
  emitted by codegen into `docs/src/generated/reference-sidebar.js` and consumed
  by `docs/sidebars.js`. It's drift-guarded (`npm run codegen:check`) and regroups
  automatically from `leagues.yaml` — the reference pages stay flat (no URL change).
- **Nav/footer + sidebar Playground link.** Docs / News / Tutorials / Playground
  appear in both the navbar and the footer, and a 🛝 [Playground](/playground)
  link sits near the top of the docs sidebar.
- **Data-driven homepage.** The home page maps over the generated `endpoints.json`
  (leagues by sport + provider families), so adding a sport/provider updates it on
  `npm run codegen` — no bespoke edit.
- **Embeddable live RunCell guides.** `<RunCell>` is a compact single-endpoint
  live runner droppable inline in any `.mdx` guide: editable params → resolved URL
  → Run (via the `/api/run` proxy) → raw JSON or a parsed table. It handles every
  flat family, the `summary` section selector, enum dropdowns, and non-JSON
  Statcast CSV, and is SSR-safe.
- **Build-time output injector.** A build-time injector (`tools/docs/inject-outputs.mjs`
  + the manifest `tools/docs/examples.mjs`) freezes real parsed tables into guides
  between `<!-- inject:example:ID -->` markers — deterministic (fixture-driven, no
  network). `npm run docs:examples` writes them; `npm run docs:examples:check` is a
  CI drift gate.

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
  - **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlb*` (e.g. `mlbSchedule`).
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
  arrays compose directly with its grammar-of-data verbs. The **cross-league ESPN
  wrappers** now accept the same `{ parsed: true }` flag — a faithful port of
  `sdv-py`'s `_common_espn_parsers` (22 parsers covering all 116 ESPN endpoints,
  incl. the 21-sub-frame `summary` dispatcher with a `section` arg).
- **Five cross-sport provider families.** Beyond ESPN + the native league APIs,
  five independent providers each get a standalone `sdv.<ns>.*` namespace +
  reference page, generated from a canonical OpenAPI spec via a reusable
  **OpenAPI→endpoint-YAML transform**:
  - **The Odds API** (`sdv.odds.*`, 10) — odds/scores; `apiKey` query param.
  - **247Sports** (`sdv.recruiting.*`, 25) — recruiting rankings (caller JWT).
  - **CBS Sports** (`sdv.cbs.*`, 82) — public NAPI, keyless.
  - **Fox Sports** (`sdv.fox.*`, 38) — Bifrost API (`{sport}`); public apikey.
  - **Yahoo Sports** (`sdv.yahoo.*`, 107) — editorial + shangrila stats-graph.

  **517 flat-API wrappers across 13 families** in total; `{ parsed: true }` works
  for every one.
- **Dual-case naming.** Every generated wrapper (ESPN and native) is exposed
  under BOTH its snake_case name (`mlb_teams`, py/R parity) and its camelCase
  canonical name (`mlbTeams`, idiomatic JS) — same function, either name.
- **Flat-aware docs + playground.** The generated reference pages now include a
  **Native API — `<family>`** section per league (host, path, params, parser, auth);
  the live [playground](/playground) groups native endpoints under their league by
  family and runs them through a flat-aware serverless proxy (host-allowlisted,
  with server-side token minting for NFL.com and content-type passthrough for
  Statcast CSV/HTML). A shared **ESPN parsed returns** page documents the columns
  each of the 22 ESPN parsers yields (documented once by parser, since the 116
  endpoints share them), linked from every league page. The playground now also
  has a **Raw/Parsed toggle** (tidy rows render as a sortable table), **shareable
  deep-link URLs**, and an **Examples menu** spanning ESPN, the native APIs, and
  all five providers.
- **Getting-started guides + RunKit notebooks.** Per-area recipe pages under
  `/docs/guides/` (quickstart, NBA/WNBA/college-basketball/NFL/MLB/NHL/CFB/soccer,
  providers) with runnable raw-vs-parsed snippets, "Open in playground" deep-links,
  and embedded RunKit live notebooks.
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
