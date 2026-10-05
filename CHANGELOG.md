# Changelog

All notable changes to `sportsdataverse` (Node.js) are documented here. The
docs-site copy lives at [`docs/src/pages/CHANGELOG.md`](docs/src/pages/CHANGELOG.md)
and renders at <https://js.sportsdataverse.org/CHANGELOG>.

## Unreleased

### Fixed

- `sdv.cbs.*`: host is now `https://api.cbssports.com/napi` (every endpoint 404'd without the `/napi` base). `tools/codegen/from-openapi.mjs` no longer drops the spec base path when `--host` is a bare origin.
- `getPicks` (cfb, mbb, mlb, nba, nfl, nhl): `pickcenter` was populated from `winprobability`; it now returns the real `pickcenter`.
- `sdv.wnba.getTeamList()` no longer throws when called with no argument.
- ESPN site API rejected the default User-Agent (HTTP 403 on every site_v2 wrapper: scoreboard, summary, teams, rosters…); the default UA no longer carries the `+https://…` token.

### Deprecated

- The six stats.ncaa.org scrapers in `sdv.ncaa` (`getSports`, `getSeasons`, `getDivisions`, `getSportDivisionData`, `getPlayerData`, `getTeamData`) are marked `@deprecated` and emit a one-time `DeprecationWarning` (the host 403s plain clients). `ncaa.getScoreboard` only serves historical seasons.

### CI

- New weekly `live-smoke.yml` runs the `SDV_LIVE=1` suite and opens/updates one `live-tests:drift` issue on failure; `npm-publish.yml` now runs `npm test` before publishing.

### Added — subscription families: PFF Developer API, KenPom, NFL Pro

Vendored from sportsdataverse-py (`719de79`). Each needs the caller's own paid credentials, has its own runtime, never retries a `403`, and is left out of the docs playground and its proxy allowlist. See the "Subscription families" section of the Transport & auth guide.

- **PFF Developer API** — `sdv.nfl.pffApi*` (68 wrappers, `api.pff.com`). Bearer key from `headers.Authorization` > `api_key` > `SDV_PFF_API_KEY` > `PFF_API_KEY`. `400` / `422` throw the new `InvalidParameterError` with PFF's message; `404` → `NoDataError`; `401` / `403` / `429` / `5xx` and non-object `200` bodies → `AssetFetchError`. Columns withheld by entitlement (`restricted`) warn, or throw with `strict: true` / `SDV_PFF_STRICT=1`. `/v1` query keys stay snake_case as the spec. Parsers `parse_pff_report` / `parse_pff_player_detail` / `parse_pff_v2_table` are ports of sdv-py's and match its output on PFF's published examples.
- **KenPom** — `sdv.mbb.kenpom*` (30 wrappers, `kenpom.com`). Password login (`email` / `password`, or `KENPOM_EMAIL` / `KENPOM_PW`, hoopR's `KP_USER` / `KP_PW`), session reused for 30 minutes; a rejected login throws. The default transport for this family is the browser-impersonating one (kenpom.com's Cloudflare check answers `403` to Node's TLS fingerprint), so it needs the optional `impit`. `{ parsed: true }` returns every table on the page keyed by HTML id; the parser ports sdv-py's `parse_kenpom_page` and the `pandas.read_html` header rules it relies on, and matches sdv-py on the committed fixture and on eight live pages. The parser is node-only (cheerio), so it is registered by the runtime rather than in the browser parser bundle (`NODE_ONLY_PARSERS`).
- **NFL Pro** — `sdv.nfl.nflPro*` (16 wrappers, `pro.nfl.com`). User-bound bearer from `headers.Authorization` > `token` > `NFLPRO_TOKEN`, checked for an active `NFL_PLUS_*` plan and expiry first (`NflProAuthError`). Pages on `offset` until the envelope's `total`; a capped result is flagged `_truncated`. An empty `200` (how the API rejects a parameter) → `InvalidParameterError`. sdv-py's headless-browser login is not ported.
- Core: `registerFamilyDefaults(family, { classifyError })` lets a family map a final failed response to its own error (404 stays `NoDataError`). New exports: `InvalidParameterError`, `NflProAuthError`, `nflProToken`, `resolvePffApiKey`, `hasKenpomLogin`, `kenpomLogin`, `kenpomClearSessionCache`, `parse_kenpom_page`, `NODE_ONLY_PARSERS`, and the `FlatParserFn` / `ParsedTables` types (a flat parser may return a dict of tables, as for KenPom pages and PFF's multi-table bodies).
- Live tests: `SDV_PFF_LIVE=1`, `SDV_KENPOM_LIVE=1`, `SDV_NFL_PRO_LIVE=1`, each also skipped without its credentials.

### Added — HockeyTech: 15 more leagues, season-id helpers, PWHL views

- Registry now covers all 20 sdv-py leagues: added `echl`, `sphl`, `chl`, `ushl`, `bchl`, `ajhl`, `sjhl`, `ojhl`, `cchl`, `gojhl`, `mhl`, `nojhl`, `vijhl`, `kijhl`, `mjhl` (keys/ids copied from sdv-py; `SDV_<LEAGUE>_API_KEY` overrides). Registry entries also carry `pbpStyle` and `otPeriodLength`. Caveats: `ushl` PBP has no coordinates; `mjhl`'s public key has no gamecenter access (pbp/game_summary come back empty).
- New wrappers (every league): `hockeytech_scorebar`, `_player_game_log`, `_player_search`, `_stats`, `_transactions`, `_playoff_bracket`. py's `streaks`, `game_info`, `player_box` and `player_info` are not ported (upstream view absent / non-functional in sdv-py).
- Season helpers on `sdv.hockeytech`: `hockeytech_season_id(league)`, `most_recent_hockeytech_season(league)`, `hockeytech_resolve_season_id(league, {season|seasonId, gameType})` (camelCase too).
- `hockeytech_seasons` parsed rows gain `season_yr` and `game_type_label`; `hockeytech_schedule` now defaults to the full-history window (`numberofdaysback/ahead/limit` = 10000, as sdv-py).
- Season ids: `hockeytech_schedule` / `hockeytech_playoff_bracket` take a raw `season_id` (py accepts an end-year `season=`). Resolve first with `hockeytech_resolve_season_id(league, { season })`; brackets need `gameType: 'playoffs'`. The views that sdv-py sends `league_id` on (schedule/scorebar, standings, transactions, brackets) now send the league's registry `leagueId` (overridable via `league_id`).

### Changed (breaking) — error vocabulary, pluggable transport + auth

Every wrapper (ESPN and flat-API) now fetches through one runtime core
(`src/core/request.ts`): auth provider → transport → retry → classification.

- **BREAKING: wrapper failures raise `NoDataError` / `AssetFetchError` instead of
  raw axios errors.** `NoDataError` = the fetch worked and there is nothing there
  (HTTP 404, or an ESPN 200 body `{ code: 404 }`, which used to be returned as
  data). `AssetFetchError` = the fetch failed (403, 429, 5xx, network, retries
  exhausted; carries `status`, `url`, `cause`). They are siblings under `SdvError`;
  `NoESPNDataError` aliases `NoDataError`; `SeasonNotFoundError` and
  `TransportUnavailableError` are new too.
- **BREAKING: the Statcast, BartTorvik and HockeyTech getters no longer turn a
  failed HTTP fetch** into `{}` / `""` — they throw like every other wrapper, so
  a failed fetch can't be mistaken for an empty table. (Unchanged: HockeyTech
  still returns `{}` for an unknown league or an unparseable 200 body.)
- **Retries:** network errors and the family's retry statuses (default
  `DEFAULT_RETRY_STATUSES` = 403 / 408 / 429 / 500 / 502 / 503 / 504, as
  sdv-py) are retried with exponential backoff + jitter (0.5s doubling, capped
  at 4s), honouring `Retry-After` (capped at 120s). The default budget is 3
  retries, with at most 4 spent on statuses. 403 is retried because ESPN Core v2
  answers 403 under load. Auth-gated families narrow the set with
  `registerFamilyDefaults(family, { retryStatuses })`; `nfl_api` never retries a
  403. A 401 refreshes credentials once.
- **`configure({ transport, auth, retries, timeoutMs, userAgent })`** +
  `getConfig()` / `resetConfig()`. Transports and auth are per family
  (`site_v2`, `core_v2`, `mlb`, `nfl_api`, …) with an optional `default`
  transport.
- **Transports:** `axiosTransport` (default) and `createImpersonatingTransport()`
  — browser TLS fingerprinting via the new **optional peer dependency
  [`impit`](https://github.com/apify/impit)** (`npm install impit`).
- **Auth helpers:** `bearerAuth`, `headerAuth`, `queryAuth`, `tokenAuth` (minted +
  cached tokens), `sessionAuth` (login cookies / headers). NFL.com auth is now a
  `tokenAuth` registered for `nfl_api` (same `NFL_ACCESS_TOKEN` /
  `NFL_CLIENT_KEY` / `NFL_CLIENT_SECRET` behaviour).
- **Fix:** a flat wrapper's `headers` argument is now forwarded for every family
  whose getter takes headers. It was dropped for non-`auth` families such as
  247Sports and Yahoo. HockeyTech's getter builds its own headers and still
  takes params only.
- New guide: *Transport, auth & errors*. CI adds a `strict: true` type-check of
  the runtime core (`npm run typecheck:strict`).

### Changed (breaking) — provider method naming

Dropped internal vendor API codenames (and redundant `_api` stems) from the
provider method names + labels so they read as the product / namespace, not the
vendor's internal API name. The namespaces (`sdv.fox` / `sdv.cbs` / `sdv.yahoo` /
`sdv.mlb` / `sdv.recruiting`) are unchanged; only the method prefixes were renamed:

- `foxBifrost*` → `fox*` (e.g. `foxBifrostScoreboard` → `foxScoreboard`)
- `cbsNapi*` → `cbs*`
- `yahooShangrila*` → `yahoo*`, `yahooEditorial*` → `yahooScores*`
- `mlbApi*` → `mlb*` (e.g. `mlbApiSchedule` → `mlbSchedule`)
- `sports247*` → `recruiting*` (matches the `sdv.recruiting` namespace; the
  "247Sports" label is kept — it's the real product)

The same rename flows through the codegen `api` stems, returns-schema paths,
parser names, playground endpoint ids, and reference docs. Upstream URL paths
that genuinely contain the vendor codename (Fox's `/bifrost/v1/…`, Yahoo's
`/v1/query/shangrila/…`) are unchanged — those are the real endpoints.
(`odds_api` / `mlb_statcast` / the four `nhl_*` families /
`hockeytech` / `torvik` are real product names and were left as-is.)

### Changed — shared endpoint YAML is vendored from sportsdataverse-py

The shared codegen families (`espn_site_v2`, `espn_core_v2`, `espn_web_v3`,
`leagues`, `mlb_statcast`, `nfl_api`, the four `nhl_*`, `mlb`, `torvik`, `cbs`,
`yahoo`) and every returns schema they reference are now derived from a pinned
sportsdataverse-py commit by `tools/codegen/vendor.mjs` (`npm run vendor`), with
JS-only endpoints in `tools/codegen/overlay/`. `npm run vendor:check` (CI) fails
on a hand-edit; a weekly `vendor-sync.yml` PR bumps the pin. The first re-vendor
(sdv-py `719de79edb`) converges the 127 shared endpoint definitions that had
drifted since the 2026-06 fork:

- **New wrappers:** ESPN Core v2 `season_week_powerindex` (every league) and NCAA
  `recruiting_years` / `recruiting_athletes` / `recruiting_rankings`;
  `sdv.nfl.nflApi{GameDetailsBySlug,GameDetailsV2,LiveTeamStatistics,LivePlayerStatistics}`;
  `sdv.yahoo.yahooEditorial{Boxscore,Scoreboard}` (on the editorial host — flat
  endpoints may now carry their own `host`). Their py-only parsers fall back to the
  family's generic parser in JS.
- **New query defaults:** ESPN `team_roster` / `transactions` /
  `season_group_children` send `limit=500`; `awards` / `season_awards` /
  `positions` / `tournaments` `limit=200`; `teams_core` / `season_teams` /
  `season_recruits` `limit=1000` + `page=1`; `venues` `limit=1000`; `season_coaches`
  `limit=500`. ESPN otherwise pages these silently (CFB rosters were cut at 100).
  `nflApiRosters` gains `team_id`.
- **`sdv.yahoo.*` (stats graph):** host is now
  `https://graphite-secure.sports.yahoo.com/v1/query/shangrila` (same final URLs).
  The wrappers no longer declare `lang` / `region` / `tz` (Yahoo applies the same
  locale defaults server-side) and the stats queries no longer default
  `league=ncaaf` — pass `league` explicitly. **BREAKING** for callers that passed a
  locale or relied on the `league` default.
- **`sdv.cbs.*`:** host `https://api.cbssports.com/napi` (what sdv-py ships).
- **Param transforms:** `sdv.nhl.nhlEdge*` / `nhlApiWeb*` accept a 4-digit season
  and send the 8-digit form (`season: 2025` → `20242025`, sdv-py's
  `format_nhl_season`; an unrecognized season throws). `nflApi*` `include_*` flags and
  ESPN `athletes_index` `active` are sent as `"true"`/`"false"`. The codegen fails on
  a transform the runtime doesn't implement.
- 75 returns-schema files arrive from sdv-py (NHL Records, NHL EDGE, NHL Stats
  REST, NHL api-web, MLB Stats, nfl_api). A py schema is attached only where
  vendor.yaml declares the JS parser equivalent to sdv-py's (fail-closed); CBS,
  Yahoo, torvik, ESPN and the endpoints on a different or fallback parser keep JS's
  own schema or show none.

## v3.1.0

A minor, additive release: two new flat-API families (no breaking changes), plus
the docs-site overhaul.

### New flat-API families (2)

Two standalone provider namespaces join the flat-API surface, bringing the total
to **532 flat-API wrappers across 15 families** (was 517 across 13). Both expose
the usual dual-case names (snake_case + camelCase), accept `{ parsed: true }` for
tidy rows, and ship fully column-described returns tables.

- **HockeyTech / LeagueStat** (`sdv.hockeytech.*`, 10 endpoints) — a
  **league-parameterized** women's + junior hockey family covering the **PWHL**
  plus the CHL juniors (**AHL / OHL / WHL / QMJHL**); pick the league with a
  `league` slug (e.g. `sdv.hockeytech.hockeytech_schedule({ league: 'pwhl' })`).
  Endpoints: `seasons`, `schedule`, `teams`, `team_roster`, `player_stats`,
  `game_shifts`, `standings`, `leaders`, `pbp`, `game_summary`. Hosts:
  `lscluster.hockeytech.com` (and `cluster.leaguestat.com` for QMJHL). The
  `src/core/hockeytech_runtime.ts` getter unwraps the JSONP envelope
  (`angular.callbacks._N({…})`) before `JSON.parse`, switches the `gc` feed to its
  `tab=` form (not `view=`), applies the PWHL play-by-play key override, and
  injects each league's `client_code` / `key` / `site_id` from a per-league
  registry (overridable via `SDV_<LEAGUE>_API_KEY`). Ported from `fastRhockey`'s
  `hockeytech_*` and `sportsdataverse-py`'s `sportsdataverse/hockeytech/`.
- **BartTorvik / T-Rank** (`sdv.torvik.*`, 5 endpoints) — men's college-basketball
  advanced analytics (`ratings`, `team_factors`, `game_stats`, `player_stats`,
  `game_schedule`) from `barttorvik.com`. The `src/core/torvik_runtime.ts` getter
  sends a browser-like User-Agent (barttorvik rejects default programmatic UAs)
  and returns the raw response body so each parser can branch on format — CSV via
  papaparse, or `JSON.parse` of the **headerless positional column arrays**
  (31 / 55 / 67 fields, ported verbatim from `hoopR`'s `torvik_*.R`).

A flat family that needs non-JSON bodies or custom request shaping registers its
own getter runtime in `GETTER_OVERRIDES` (`src/leagues/_make_flat.ts`) — the same
pattern as the existing Statcast getter — so the shared no-auth getter stays
JSON-only.

> **Playground caveat.** QMJHL's secondary host (`cluster.leaguestat.com`) works
> from the **library**, but not from the in-browser **playground**: the `/api/run`
> proxy allowlist derives a single host per family, so QMJHL calls there hit the
> primary host. Use the library directly for QMJHL.

### Docs

A docs-site overhaul that makes the guides literate and the navigation
data-driven:

- **Sport-grouped reference sidebar.** ESPN league reference docs are now nested
  under a collapsible category named for their sport (plus a Providers group),
  emitted by codegen into `docs/src/generated/reference-sidebar.js` and consumed
  by `docs/sidebars.js`. It's drift-guarded (`npm run codegen:check`) and regroups
  automatically from `leagues.yaml` — the reference pages stay flat (no URL change).
- **Nav/footer + sidebar Playground link.** Docs / News / Tutorials / Playground
  appear in both the navbar and the footer, and a 🛝 Playground link sits near the
  top of the docs sidebar.
- **Data-driven homepage.** `docs/src/pages/index.js` maps over the generated
  `endpoints.json` (leagues by sport + provider families), so adding a
  sport/provider updates the home page on `npm run codegen` — no bespoke edit.
- **Embeddable live RunCell guides.** `<RunCell>` is a compact single-endpoint
  live runner droppable inline in any `.mdx` guide: editable params → resolved URL
  → Run (via the `/api/run` proxy) → raw JSON or a parsed table. It handles every
  flat family, the `summary` section selector, enum dropdowns, and non-JSON
  Statcast CSV, and is SSR-safe.
- **Build-time output injector.** `tools/docs/inject-outputs.mjs` (+ the manifest
  `tools/docs/examples.mjs`) freezes real parsed tables into guides between
  `<!-- inject:example:ID -->` markers — deterministic (fixture-driven, no network).
  `npm run docs:examples` writes them; `npm run docs:examples:check` is a CI drift
  gate.

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

- **MLB Stats API** (`statsapi.mlb.com`) — `sdv.mlb.mlb*` (e.g. `mlbSchedule`).
- **Baseball Savant / Statcast** (`baseballsavant.mlb.com`) — `sdv.mlb.mlbStatcast*`,
  including date-chunked Statcast search; heterogeneous CSV/JSON/HTML responses are
  handled by a content-type-aware getter.
- **NHL** — api-web game feed + EDGE player tracking (`api-web.nhle.com`),
  Stats REST (`api.nhle.com/stats/rest`), and Records (`records.nhl.com`):
  `sdv.nhl.nhlApiWeb*` / `nhlEdge*` / `nhlStatsRest*` / `nhlRecords*`.
- **NFL.com "Shield" API** (`api.nfl.com`) — `sdv.nfl.nflApi*`, with automatic
  anonymous `WEB_DESKTOP` bearer-token minting (cached + auto-renewed; no
  credentials required).

### Provider families (5 cross-sport, standalone namespaces)

Beyond ESPN + the league-native APIs, v3.0.0 adds **five independent provider
families**, each generated from a canonical OpenAPI spec (the `sdv-swagger`
collection) via a new reusable **OpenAPI 3.x → endpoint-YAML transform**
(`tools/codegen/from-openapi.mjs`, with path / query / `$ref` param resolution +
auth detection). Each cross-sport family gets its own standalone `sdv.<ns>.*`
namespace and its own generated reference page; pass `{ parsed: true }` for tidy
rows. The transform makes adding the next provider largely mechanical.

- **The Odds API** (`sdv.odds.*`, 10 endpoints) — betting odds / scores / events
  across sports. `apiKey` is a plain query param you supply. Ported from
  [`oddsapiR`](https://oddsapiR.sportsdataverse.org); odds / event / history
  parsers unroll events → bookmakers → markets → outcomes to one row per outcome.
- **247Sports** (`sdv.recruiting.*`, 25 endpoints) — recruiting rankings /
  commits / profiles (caller-supplied JWT via `headers`). Supersedes the legacy
  `getPlayerRankings`-style service methods (kept for back-compat).
- **CBS Sports** (`sdv.cbs.*`, 82 endpoints) — the public NAPI (scores /
  standings / teams / odds across sports), keyless.
- **Fox Sports** (`sdv.fox.*`, 38 endpoints) — the Bifrost API (`{sport}` path
  param across 11 sports); a public `apikey` + `api-version` query pair, defaulted.
- **Yahoo Sports** (`sdv.yahoo.*`, 107 endpoints) — the editorial scoreboard /
  boxscore feed + the shangrila stats-graph API; keyless (needs browser-y
  `Origin` / `Referer` headers).

In total: **517 flat-API wrappers across 13 families** (the 7 native + 5 provider
+ Statcast).

### tidy.js parser layer

- Every native wrapper returns the raw response by default; pass `{ parsed: true }`
  to run the payload through a registered parser that flattens it to a tidy array
  of row objects via a shared in-house `normalize` helper (a `json_normalize`
  equivalent). Strictly additive — omitting `parsed` is the unchanged raw-response
  behavior, matching `sportsdataverse-py`'s `return_parsed=True`.
- The [`@tidyjs/tidy`](https://github.com/pbeshai/tidy) toolkit is re-exported
  (`import { tidy } from 'sportsdataverse'`) so the parsed tidy arrays compose
  directly with grammar-of-data-manipulation verbs (`groupBy`, `summarize`, …).
- **ESPN parsed dispatch.** The cross-league ESPN wrappers now accept the same
  `{ parsed: true }` flag — a faithful port of `sportsdataverse-py`'s
  `_common_espn_parsers` (22 parsers: scoreboard / standings / rosters / leaders /
  athlete deep-dives / the 21-sub-frame `summary` dispatcher, plus two generics
  for the Core v2 list + single-resource long tail). All **116** ESPN endpoints
  route through these parsers; `summary` additionally honours a `section` arg
  (`{ parsed: true, section: 'boxscore_team' }`). Omitting `parsed` is the
  unchanged raw-`Dict` behavior.

### Dual-case naming

- Every generated wrapper (ESPN and native) is exposed under BOTH its snake_case
  name (`mlb_teams`, py/R parity) and its camelCase canonical name
  (`mlbTeams`, idiomatic JS) — the same function under either name.

### Docs + playground

- Generated reference pages now include a **Native API — `<family>`** section per
  league (host, path, params, parser, auth gate).
- A shared **ESPN parsed returns** reference page documents the `col_name | type |
  description` columns each of the 22 ESPN parsers produces (the 116 endpoints
  share them, so they're documented once by parser rather than repeated per
  endpoint), with every league page linking to it.
- The live [playground](https://js.sportsdataverse.org/playground) groups native
  endpoints under their league by family and runs them through a flat-aware
  serverless proxy — host-allowlisted (derived from the generated metadata), with
  server-side token minting for NFL.com and content-type passthrough for Statcast
  CSV/HTML so credentials never reach the browser and non-JSON bodies display raw.
  It now also has a **Raw/Parsed toggle** (tidy rows render as a sortable table —
  with a section selector for the 21-sub-frame `summary` dispatcher),
  **deep-linkable URLs** (every call is shareable), and an **Examples menu** of
  curated presets across ESPN, the native APIs, and all 5 providers. The provider
  families each appear under their standalone namespace.
- **Getting-started guides** (`/docs/guides/`) — per-area recipe pages (quickstart,
  NBA/WNBA/college-basketball/NFL/MLB/NHL/CFB/soccer, providers) with runnable
  raw-vs-parsed snippets, "Open in playground" deep-links, and embedded **RunKit**
  live notebooks.

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
