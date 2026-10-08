# **sportsdataverse** <a href='https://js.sportsdataverse.org/'><img src='https://raw.githubusercontent.com/sportsdataverse/sportsdataverse-js/main/docs/static/img/sdv-js-logo.png' align="right" width="20%" min-width="100px"/></a>

![Lifecycle:maturing](https://img.shields.io/badge/lifecycle-maturing-blue.svg?style=for-the-badge&logo=github)
[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse) [![npm downloads](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse)
[![Contributors](https://img.shields.io/github/contributors/sportsdataverse/sportsdataverse-js?style=for-the-badge&logo=github)](https://github.com/sportsdataverse/sportsdataverse-js/graphs/contributors)
[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse)

`sportsdataverse` is the SportsDataverse's **Node.js / TypeScript** client for sports
data: the cross-league ESPN API, the leagues' own live APIs, a set of cross-sport
providers, and the published SportsDataverse / nflverse release datasets — with one
parser layer, one error vocabulary and TypeScript types for every call.

- **126 ESPN endpoints** on **30 leagues**, identical on every league.
- **1060 flat-API wrappers across 27 families** — 14 league families on their league
  namespace (MLB Stats, Statcast, NHL ×4, NFL.com, stats.nba.com, …) and 13 provider
  families on their own (HockeyTech, The Odds API, CBS, Fox, Yahoo, 247Sports, On3, …).
- **323 dataset loaders** (`load*`) that read the release parquet directly.
- `{ parsed: true }` on any wrapper → tidy, snake_cased rows, typed where verified.

It is the Node.js sister to [`sportsdataverse-py`](https://py.sportsdataverse.org/) and the
[SportsDataverse R packages](https://r.sportsdataverse.org/) (`hoopR`, `wehoop`, `cfbfastR`,
`fastRhockey`, …). **The public names are sportsdataverse-py's**, so a function has the same
name in Python and JavaScript.

📖 **[Documentation](https://js.sportsdataverse.org/)** ·
🧭 **[Reference](https://js.sportsdataverse.org/docs/reference/)** ·
🎓 **[Tutorials](https://js.sportsdataverse.org/docs/tutorials/)** ·
🛝 **[Playground](https://js.sportsdataverse.org/playground)** ·
🤖 **[llms.txt](https://js.sportsdataverse.org/llms.txt)**

Data freshness and pipeline status for every SportsDataverse dataset: [sportsdataverse.org/status](https://sportsdataverse.org/status).

## Installation

```bash
npm install sportsdataverse
```

**Node ≥ 20.18.1.** The package is **ESM-only** and ships its TypeScript declarations.
From CommonJS, `const sdv = (await import('sportsdataverse')).default` (or `require()`
on Node 20.19+ / 22.12+). Two optional peers unlock specific families:
`impit` (browser TLS impersonation — stats.nba.com, stats.wnba.com, 247Sports, KenPom)
and `playwright` (the NFL Pro email / password login).

## Sources covered

| Source | Host | Families (wrappers) | Where | Auth |
|---|---|---|---|---|
| ESPN | `site.api.espn.com`, `sports.core.api.espn.com`, `site.web.api.espn.com`, fitt v3, `cdn.espn.com` | `site_v2` 25 · `core_v2` 90 · `web_v3` 5 · `fitt_v3` 1 · `cdn` 5 shorts | every league namespace (`sdv.nba` … `sdv.wwc`), 30 leagues | none |
| MLB Stats API | `statsapi.mlb.com` | `mlb` 78 | `sdv.mlb` | none |
| Baseball Savant / Statcast | `baseballsavant.mlb.com` | `mlb_statcast` 39 (+ the date-chunked search) | `sdv.mlb` | none |
| NHL | `api-web.nhle.com`, `api.nhle.com/stats/rest`, `records.nhl.com` | `nhl_api_web` 27 · `nhl_edge` 35 · `nhl_stats_rest` 21 · `nhl_records` 44 | `sdv.nhl` | none |
| NFL.com "Shield" | `api.nfl.com` | `nfl_api` 15 | `sdv.nfl` | anonymous bearer token, minted for you |
| PFF Developer API | `api.pff.com` | `pff_api` 68 | `sdv.nfl` | your API key |
| NFL Pro | `pro.nfl.com` | `nfl_pro` 16 | `sdv.nfl` | NFL+ token, or email / password login (`playwright`) |
| stats.nba.com / stats.wnba.com | `stats.nba.com`, `stats.wnba.com` | `nba_stats` 128 · `wnba_stats` 111 | `sdv.nba`, `sdv.wnba` (G League + Summer League via `league_id`) | none; needs `impit` (hangs on datacenter IPs) |
| KenPom | `kenpom.com` | `kenpom` 30 | `sdv.mbb` | subscription login; needs `impit` |
| BartTorvik / T-Rank | `barttorvik.com` | `torvik` 5 · `bart_wbb` 1 | `sdv.torvik` | none |
| MLS / NWSL stats | `stats-api.mlssoccer.com`, `api-sdp.nwslsoccer.com` | `mls_api` 12 · `nwsl_api` 9 | `sdv.mls`, `sdv.nwsl` | none (site `Referer` sent) |
| American Soccer Analysis | `app.americansocceranalysis.com` | `asa` 15 | `sdv.asa` | none |
| The Odds API | `api.the-odds-api.com` | `odds_api` 10 | `sdv.odds` | your `api_key` |
| 247Sports | `ipa.247sports.com`, `247sports.com` | `sports247` 12 · `sports247_site_pages` 35 (`recruiting` 25, deprecated) | `sdv.sports247` (`sdv.recruiting`) | free guest JWT, minted for you; needs `impit` |
| On3 | `api.on3.com` | `on3` 78 | `sdv.on3` | none |
| CBS Sports | `api.cbssports.com/napi` | `cbs` 82 | `sdv.cbs` | none |
| Fox Sports | `api.foxsports.com` | `fox` 38 | `sdv.fox` | public `apikey`, defaulted |
| Yahoo Sports | `graphite-secure.sports.yahoo.com`, `api-secure.sports.yahoo.com` | `yahoo` 107 · `yahoo_scores` 2 | `sdv.yahoo` | none |
| HockeyTech / LeagueStat | `lscluster.hockeytech.com` | `hockeytech` 16 + shifts / TOI / Corsi analytics | `sdv.hockeytech` (PWHL, AHL, OHL, WHL, QMJHL + 15 more: 20 leagues) | none (per-league public keys) |
| Release datasets | GitHub release parquet (`sportsdataverse-data`, nflverse) | 323 `load*` loaders | `sdv.cfb` 71 · `nba` 41 · `mbb` 34 · `wbb` 34 · `wnba` 34 · `mlb` 32 · `nfl` 29 · `nhl` 27 · `pwhl` 21 | none |

The same table, per league, is on each league's reference page; `npm run codegen` prints
the counts. The pre-3.0 hand-written methods (`sdv.nba.getPlayByPlay(id)` and friends)
still exist; since 4.0.0 they fetch through the same request layer (https, retries, typed
errors), and the six stats.ncaa.org scrapers on `sdv.ncaa` are deprecated.

## Quick start

Every league is a namespace on the default export. ESPN methods follow one rule,
**`espn<League><Endpoint>`**, and every method also has a snake_case alias
(`espn_nba_scoreboard`) for parity with Python and R. Parameters take snake_case or camelCase.

```js
import sdv from "sportsdataverse";

const board  = await sdv.nba.espnNbaScoreboard({});                         // raw ESPN JSON
const rows   = await sdv.nba.espnNbaScoreboard({ parsed: true });           // tidy rows
const box    = await sdv.nba.espnNbaSummary({ event_id: 401584793, parsed: true, section: "boxscore_player" });
const roster = await sdv.nfl.espnNflTeamRoster({ team_id: 12 });

await sdv.nfl.espnNflScoreboard({ week: 1, season_type: 2 });
await sdv.wnba.espnWnbaStandings({ season: 2024 });
await sdv.cfb.espnCfbRankings({});                           // NCAA-scoped endpoint
await sdv.soccer.espnSoccerScoreboard({ league: "eng.1" });  // multi-league sports take `league`
await sdv.laliga.espnLaligaScoreboard({});                   // or use the per-league namespace
```

Every wrapper returns the **raw** payload by default; `{ parsed: true }` runs it through
the registered parser and returns flat, snake_cased row objects (the JS analog of
sportsdataverse-py's `return_parsed=True`). The `summary` endpoint is a dispatcher: omit
`section` for all 21 sub-frames, or name one.

**Typed.** Every wrapper takes its endpoint's params type and, where the parser-parity
harness has verified the endpoint on a real capture, resolves to its row interface:

```ts
import sdv from "sportsdataverse";
import type { EspnTeamRosterParams, MlbTeamRosterRow, LoadNbaPbpRow } from "sportsdataverse";

const params: EspnTeamRosterParams = { team_id: 12 };
const mlb: MlbTeamRosterRow[] = await sdv.mlb.mlbTeamRoster({ team_id: 147, parsed: true });
const pbp: LoadNbaPbpRow[] = await sdv.nba.loadNbaPbp({ seasons: 2024, columns: ["game_id", "text"] });
```

A raw payload is `unknown` (narrow or cast it); an unverified endpoint's rows are
`Row[]` (`Record<string, unknown>`). **Integer id columns are decimal strings** on every
surface (`"401584793"`, exact past 2^53) — compare and join ids as strings.

**v4 names are sportsdataverse-py's.** An ESPN *athlete* is a *player* and an *event* a
*game* (`espnNbaPlayerGamelog`, `espnNflGameTeamRoster`); the native APIs use py's names
(`nhlBoxscore`, `nflStandings`, `cbsGameBoxscore`). Every pre-v4 name still works as a
deprecated alias that warns once (`DeprecationWarning`, code `SDV_DEPRECATED_NAME`);
the mapping is the [Deprecated names](https://js.sportsdataverse.org/docs/reference/deprecations) page.

### Native APIs and providers

The leagues' own APIs sit on the league namespace next to the ESPN methods; the
cross-sport providers have their own namespaces (see the table above):

```js
await sdv.mlb.mlbSchedule({ sport_id: 1, date: "2024-07-04", parsed: true });
await sdv.mlb.mlbStatcastSearch({ season: 2024, player_type: "batter" });     // CSV → typed rows
await sdv.nhl.nhlWebPbp({ game_id: 2023030417, parsed: true });
await sdv.nfl.nflWeeklyGameDetails({ season: 2024, week: 1, parsed: true });  // token minted for you
await sdv.nba.nbaStatsLeaguedashplayerstats({ parsed: true });                // needs `impit`
await sdv.hockeytech.hockeytechSchedule({ league: "pwhl", season_id: 8, parsed: true }); // one season
await sdv.hockeytech.pwhlGameCorsi(42);                                       // shifts → on-ice → Corsi
await sdv.odds.oddsApiSportsOdds({ sport: "americanfootball_nfl", api_key: process.env.ODDS_API_KEY, parsed: true });
await sdv.fox.foxApiScoreboard({ parsed: true });
```

### Dataset loaders

The 323 `load*` functions (one per entry of sportsdataverse-py's `releases.yaml`) read the
published parquet assets — play-by-play with EPA / WP, schedules, rosters, box scores,
ratings, player value — and resolve to plain row objects with a `Load<Name>Row` type:

```js
const plays = await sdv.cfb.loadCfbPbp({ seasons: [2023, 2024], columns: ["game_id", "text", "EPA"] });
const cols  = await sdv.nfl.loadNflPbp({ seasons: 2024, format: "columns" });   // { column: values[] }, ~4x lighter
const teams = await sdv.cfb.loadCfbRatings({ seasons: 2024 });                  // team_id "2306" (string)
```

Seasons below a loader's floor throw `SeasonNotFoundError` before any download; a season
with no asset is skipped with a warning; a size guard (`maxCells`) throws a catchable
`SdvError` instead of exhausting the heap. Node only (not in the browser playground).

### Utilities

Everything that is not a data function is catalogued, by category, under
[Utilities](https://js.sportsdataverse.org/docs/utilities/):

- **Parsers** — `import { parseEndpoint, normalize, PARSERS } from "sportsdataverse/parsers"`: the
  browser-safe parser layer (no HTTP deps), the same functions `{ parsed: true }` runs.
- **Analytics** — HockeyTech shifts, time on ice, on-ice tracking, Corsi / Fenwick (pure functions + per-league wrappers).
- **Odds math** — `sdv.odds.devigShin`, `probFromAmerican`, `spreadToProb`, … (ports of sdv-py `wexp.market`).
- **Models** — `sdv.cricket.cricketWinProbability` / `cricketWpa`, offline in-play cricket WP.
- **Producers** — `sdv.nba.espnNbaPbp(gameId)` and `helper<Lg>PlayerBox` / `TeamBox`: one ESPN summary in, the hoopR / wehoop release rows out (NBA, WNBA, MBB, WBB).
- **Discovery** — `listFunctions`, `functionCount`, `findTeam`, `findAthlete`, `findEvent`.
- **Transforms / HTTP core / errors / config** — below.

### Errors and configuration

Every wrapper fetches through one request core (auth → transport → retry → classify) and
throws one vocabulary (`src/core/errors.ts`, all under `SdvError`):

| Error | Meaning |
|---|---|
| `NoDataError` | the fetch worked and there is nothing there (HTTP 404, ESPN `{ code: 404 }`) |
| `AssetFetchError` | the fetch failed — 403 / 429 / 5xx after retries, a network error, an empty or non-JSON 2xx body; the answer is unknown |
| `InvalidParameterError` | HTTP 400 / 422: the call as made can never succeed; never retried |
| `SeasonNotFoundError` | a season outside what the source supports |
| `TransportUnavailableError` | an optional peer (`impit`, `playwright`) is missing |

A failed fetch is never returned as empty data. `NoESPNDataError` aliases `NoDataError`.
Retries follow `DEFAULT_RETRY_STATUSES` (403 / 408 / 429 / 5xx) with backoff and
`Retry-After`; credentials never reach `err.cause`.

```js
import { configure, axiosTransport, createImpersonatingTransport, bearerAuth } from "sportsdataverse";

configure({ retries: 5, timeoutMs: 60_000, userAgent: "my-app/1.0" });
configure({ transport: { default: axiosTransport, nba_stats: createImpersonatingTransport({ browser: "chrome" }) } });
configure({ auth: { pff_api: bearerAuth(process.env.PFF_API_KEY) } });
```

Transports and auth providers (`bearerAuth`, `headerAuth`, `queryAuth`, `tokenAuth`,
`sessionAuth`) are per family (`site_v2`, `core_v2`, `mlb`, `nfl_api`, …) with a `default`
fallback; `getConfig()` / `resetConfig()` read and reset. See the
[Transport, auth & errors](https://js.sportsdataverse.org/docs/guides/transport-and-auth) guide.

## Examples and tutorials

`examples/` holds one runnable script per topic (`NN_<topic>.mjs`), from an ESPN
scoreboard to Statcast, NHL EDGE, PWHL Corsi, odds math, the release loaders and three
sdvplot-js charts. They run **offline against committed fixtures by default**
(`SDV_LIVE=1` goes live):

```sh
npm run build
cd examples && node --import ./_resolve.mjs 01_nba_scoreboard_to_table.mjs
```

Each script is also a [tutorial](https://js.sportsdataverse.org/docs/tutorials/) with its
frozen output, an **Open in StackBlitz** button, and live-editable parser blocks; the
[guides](https://js.sportsdataverse.org/docs/guides/) run single endpoints inline through the
playground proxy. `docs/llms.txt` / `llms-full.txt` give LLMs the whole site as markdown.

## How this library is built

Almost everything callable is generated by `tools/codegen/generate.mjs` from YAML, with a
drift gate (`npm run codegen:check`) in CI. Five surfaces, each documented under
[How this library is built](https://js.sportsdataverse.org/docs/architecture/):

- **ESPN, vendored** — sdv-py's `espn_*.yaml` (copied at a pinned commit by `npm run vendor`,
  hash-locked) → `src/generated/espn/<league>.ts`, 126 endpoints × 30 leagues.
- **Native families, vendored** — sdv-py's `<family>.yaml` + returns schemas → `src/generated/flat/*.ts` (23 families).
- **Native families, JS-owned** — `tools/codegen/endpoints/{hockeytech,odds_api,yahoo_scores,recruiting}.yaml`, edited here.
- **Dataset loaders** — sdv-py's `releases.yaml` + `loader_schemas.yaml` → `src/generated/loaders/*.ts` + `Load<Name>Row` types.
- **Hand-written** — `src/` (parsers, analytics, odds, models, producers, discovery, HTTP core),
  catalogued by `tools/codegen/utilities.yaml`.

Generated files (`src/generated/**`, the per-league and provider reference pages, the
utilities catalogue, the playground metadata) are **never hand-edited** — edit the YAML or the
renderer and run `npm run codegen`. Returns-table column descriptions come from sdv-py's
`manual_column_descriptions.yaml` and the R packages' docs, never from vendored schema YAML.

```bash
npm run codegen && npm run codegen:check   # regenerate + drift gate
npm run vendor -- --ref <sdv-py sha>       # bump the sdv-py pin
npm run build && npm test                  # tsc → dist/, mocha under c8 (no network; coverage gate)
npm run docs:examples:check                # frozen tutorial output + sources are current
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow and [`CLAUDE.md`](CLAUDE.md) for
the architecture deep-dive.

## Documentation

- **[Guides](https://js.sportsdataverse.org/docs/guides/)** — quickstart, per-sport and provider recipes with live cells.
- **[Tutorials](https://js.sportsdataverse.org/docs/tutorials/)** — one per example script, output frozen at build time.
- **[Reference](https://js.sportsdataverse.org/docs/reference/)** — every wrapper and loader, by league, with returns tables.
- **[Utilities](https://js.sportsdataverse.org/docs/utilities/)** and **[Architecture](https://js.sportsdataverse.org/docs/architecture/)**.
- **[Playground](https://js.sportsdataverse.org/playground)** — run ESPN and native calls in the browser.
- **[API](https://js.sportsdataverse.org/docs/api/)** (TypeDoc) · **[Changelog](https://js.sportsdataverse.org/CHANGELOG)** · **[llms.txt](https://js.sportsdataverse.org/llms.txt)**.

<!-- cheatsheet-section -->
## **Cheat sheet**

A printable one-page reference for **sportsdataverse (Node.js)** — the loaders, the wrapper
families, and what each one returns.

📄 **[Download the sportsdataverse (Node.js) cheat sheet (PDF)](https://sportsdataverse.org/cheatsheets/sportsdataverse-js.pdf)**

Every SportsDataverse package has one — browse them all at
**[sportsdataverse.org/cheatsheets](https://sportsdataverse.org/cheatsheets)**.

### The SportsDataverse ecosystem

`sportsdataverse-js` is part of a family of open-source sports-data packages across
**Node.js, Python, and R**, all under the [SportsDataverse](https://sportsdataverse.org)
umbrella.

**Node.js** — [js.sportsdataverse.org](https://js.sportsdataverse.org)

- [`sportsdataverse`](https://js.sportsdataverse.org) — this package.
- [`sdvplot-js`](https://github.com/sportsdataverse/sdvplot-js) — `@sportsdataverse/sdvplot` (team colours, logos) + `@sportsdataverse/sporty` (sport surfaces); unpublished, used by the `9x` examples.

**Python** — [py.sportsdataverse.org](https://py.sportsdataverse.org)

| Package | Domain |
|---|---|
| [`sportsdataverse-py`](https://py.sportsdataverse.org/) | Cross-sport sister package (NBA/WNBA/NFL/MLB/NHL/MBB/WBB/CFB + odds) |
| [`collegebaseball`](https://collegebaseball.readthedocs.io/) | College baseball |
| [`sportypy`](https://sportypy.sportsdataverse.org/) | Matplotlib sport field/court/rink plotting |
| [`nwslpy`](https://github.com/nwslR/nwslpy) | NWSL women's soccer |

**R** — [r.sportsdataverse.org](https://r.sportsdataverse.org)

| Package | Domain |
|---|---|
| [`hoopR`](https://hoopR.sportsdataverse.org) | Men's basketball (NBA / MBB) |
| [`wehoop`](https://wehoop.sportsdataverse.org) | Women's basketball (WNBA / WBB) |
| [`cfbfastR`](https://cfbfastR.sportsdataverse.org) | College football |
| [`fastRhockey`](https://fastRhockey.sportsdataverse.org) | Hockey (NHL / PWHL) |
| [`baseballr`](https://billpetti.github.io/baseballr/) | Baseball (MLB / MiLB / college) |
| [`recruitR`](https://recruitR.sportsdataverse.org) | Recruiting |
| [`oddsapiR`](https://oddsapiR.sportsdataverse.org) | Betting odds (The Odds API) |
| [`softballR`](https://github.com/sportsdataverse/softballR) | Softball |
| [`cfb4th`](https://cfb4th.sportsdataverse.org) | College football 4th-down models |
| [`cfbplotR`](https://cfbplotR.sportsdataverse.org) | College football ggplot2 helpers |
| [`sportyR`](https://sportyR.sportsdataverse.org) | ggplot2 sport field/court/rink plotting |
| [`nflfastR`](https://www.nflfastr.com) / [`nflverse`](https://nflverse.nflverse.com) | NFL ecosystem |

## Our Authors

- [Saiem Gilani](https://twitter.com/saiemgilani)

<a href="https://twitter.com/saiemgilani" target="blank"><img src="https://img.shields.io/twitter/follow/SaiemGilani?color=blue&label=%40SaiemGilani&logo=twitter&style=for-the-badge" alt="@SaiemGilani" /></a>
<a href="https://github.com/saiemgilani" target="blank"><img src="https://img.shields.io/github/followers/saiemgilani?color=eee&logo=Github&style=for-the-badge" alt="@saiemgilani" /></a>

## Citation

To cite the [**`sportsdataverse`**](https://js.sportsdataverse.org) Node.js package in publications, use:

```bibtex
@misc{gilani_2021_sportsdataverse_js,
  author = {Gilani, Saiem},
  title = {sportsdataverse-js: The SportsDataverse's Node.js Package for Sports Data.},
  url = {https://js.sportsdataverse.org},
  year = {2021}
}
```

## License

[MIT](LICENSE) © [Saiem Gilani](https://twitter.com/saiemgilani), part of the
[SportsDataverse](https://sportsdataverse.org).
