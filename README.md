# **sportsdataverse** <a href='https://js.sportsdataverse.org/'><img src='https://raw.githubusercontent.com/sportsdataverse/sportsdataverse-js/main/docs/static/img/sdv-js-logo.png' align="right" width="20%" min-width="100px"/></a>

![Lifecycle:maturing](https://img.shields.io/badge/lifecycle-maturing-blue.svg?style=for-the-badge&logo=github)
[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse) [![npm downloads](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse)
[![Contributors](https://img.shields.io/github/contributors/sportsdataverse/sportsdataverse-js?style=for-the-badge&logo=github)](https://github.com/sportsdataverse/sportsdataverse-js/graphs/contributors)
[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse)

`sportsdataverse` is the SportsDataverse's **Node.js** client for sports data. As of
**v3.0.0** it is a **cross-league ESPN client _plus_ a native (non-ESPN) live-API
client** with a tidy parser layer:

- **116 ESPN endpoint wrappers** generated for **29 leagues** (31 namespaces) from a
  single YAML source of truth — play-by-play, box scores, schedules, rosters,
  standings, rankings, and more, identical on every league.
- **532 flat-API wrappers across 15 families** — the **7 native** league APIs (MLB
  Stats, Baseball Savant / Statcast, NHL api-web/edge/stats-rest/records, NFL.com
  Shield) merged onto their league namespace, and **7 cross-sport providers** (The
  Odds API, 247Sports, CBS Sports, Fox Sports, Yahoo Sports, HockeyTech/LeagueStat,
  BartTorvik/T-Rank) on their own `sdv.<provider>.*` namespaces.
- **A tidy parser layer** — every wrapper returns raw JSON by default; pass
  `{ parsed: true }` to get a tidy array of flat, snake_cased row objects.
- Plus the original hand-written scrapers the package has always shipped
  (`sdv.nba.getPlayByPlay(...)` etc.), preserved unchanged.

It is the Node.js sister to the [`sportsdataverse-py`](https://py.sportsdataverse.org/)
Python package and the [SportsDataverse R packages](https://r.sportsdataverse.org/)
(`hoopR`, `wehoop`, `cfbfastR`, `fastRhockey`, …).

📖 **[Documentation](https://js.sportsdataverse.org/)** ·
🧭 **[Reference](https://js.sportsdataverse.org/docs/reference/)** ·
🛝 **[Playground](https://js.sportsdataverse.org/playground)** ·
🧩 **[API](https://js.sportsdataverse.org/docs/api/)**

## Installation

```bash
npm install sportsdataverse
```

**Requirements:** Node **≥ 20.18.1**. The package is **ESM-only** and ships
TypeScript declarations.

## Usage

Every league is a namespace on the default export. The cross-league ESPN endpoints
follow one naming rule — **`espn<League><Endpoint>`** (camelCase). Every method also
has a snake_case alias (`espn_nba_scoreboard`) for parity with the Python / R packages:

```js
import sdv from "sportsdataverse";

// Today's NBA scoreboard
const board = await sdv.nba.espnNbaScoreboard({});

// A single game summary (box score + plays + win probability + ...)
const game = await sdv.nba.espnNbaSummary({ event_id: 401584793 });

// A team's roster
const roster = await sdv.nfl.espnNflTeamRoster({ team_id: 12 });
```

The same methods exist on **every** league, so switching sports is a one-token change:

```js
await sdv.nfl.espnNflScoreboard({ week: 1, season_type: 2 });
await sdv.nhl.espnNhlScoreboard({});
await sdv.cfb.espnCfbRankings({});                 // NCAA-scoped endpoint
await sdv.wnba.espnWnbaStandings({ season: 2024 });
```

Multi-league sports (soccer, cricket) take an extra `league` slug:

```js
await sdv.soccer.espnSoccerScoreboard({ league: "eng.1" });  // Premier League
await sdv.soccer.espnSoccerScoreboard({ league: "esp.1" });  // La Liga
```

Parameters accept **snake_case or camelCase**, and every pre-3.0 convenience method
is preserved alongside the generated wrappers:

```js
await sdv.nfl.espnNflTeamSchedule({ team_id: 12, season: 2024 });
await sdv.nfl.espnNflTeamSchedule({ teamId: 12, season: 2024 });  // identical

const pbp = await sdv.nba.getPlayByPlay(401584793);  // legacy method, still works
```

### Tidy rows with `{ parsed: true }`

Every wrapper returns the **raw** payload by default. Pass `{ parsed: true }` to run
it through a registered parser and get a tidy array of flat, snake_cased row objects
(nested fields flattened) — the JS analog of `sportsdataverse-py`'s `return_parsed=True`:

```js
const raw  = await sdv.nba.espnNbaScoreboard({});                  // raw ESPN JSON
const rows = await sdv.nba.espnNbaScoreboard({ parsed: true });    // tidy row objects

// The summary endpoint is a dispatcher — omit `section` for all 21 sub-frames,
// or request one:
const box  = await sdv.nba.espnNbaSummary({ event_id: 401584793, parsed: true, section: "boxscore_player" });
```

### Native APIs and cross-sport providers

The **native** league APIs are merged onto their league namespace, so they sit next
to the ESPN methods. The **provider** families live on their own namespaces:

```js
// Native — MLB Stats API + Baseball Savant / Statcast (on sdv.mlb)
await sdv.mlb.mlbApiSchedule({ sport_id: 1, date: "2024-07-04", parsed: true });
await sdv.mlb.mlbStatcastSearch({ season: 2024, player_type: "batter" });

// Native — NHL api-web + NFL.com Shield (token minted automatically, no creds)
await sdv.nhl.nhlApiWebPbp({ game_id: 2023030417, parsed: true });
await sdv.nfl.nflApiWeeklyGameDetails({ season: 2024, week: 1, parsed: true });

// Providers — standalone namespaces (auth varies per provider)
await sdv.odds.oddsApiSports({ api_key: process.env.ODDS_API_KEY, parsed: true });
await sdv.fox.fox_bifrost_scoreboard({ parsed: true });            // public apikey defaulted
```

Browser callers can import **just** the parser layer (no node-only HTTP deps) from the
`sportsdataverse/parsers` subpath export:

```js
import { parseEndpoint } from "sportsdataverse/parsers";
const rows = parseEndpoint("espn", "scoreboard", rawPayload);
```

### Introspect the surface

```js
import sdv, { LEAGUES, WRAPPERS } from "sportsdataverse";

LEAGUES.map((l) => l.prefix);           // ['nba','wnba',...,'soccer','cricket','ufl',...] (29)
WRAPPERS.length;                         // generated ESPN wrapper definitions
Object.keys(sdv.nba).filter((k) => k.startsWith("espnNba"));  // every NBA wrapper
```

Endpoints are grouped into **scopes** — `universal` (every league), `ncaa` (college),
`football` (NFL/CFB/UFL), and `mlb` — so each league gets exactly the endpoints that
apply to it. See the [per-league reference](https://js.sportsdataverse.org/docs/reference/)
for the full list, or try any call live in the
[playground](https://js.sportsdataverse.org/playground).

## Architecture

The library is **codegen-driven**. `tools/codegen/generate.mjs` reads the vendored
endpoint YAML in `tools/codegen/endpoints/*.yaml` and, from that single source of
truth, generates:

- the runtime TypeScript wrapper / league tables under `src/generated/`
  (`wrappers.ts`, `leagues.ts`),
- the per-league Markdown reference under `docs/docs/reference/`, and
- the playground metadata `docs/src/playground/endpoints.json`.

`npm run codegen` writes those outputs; `npm run codegen:check` is the **drift gate**
that fails CI if the committed output is stale. **Generated files are never
hand-edited** — you edit the YAML (or the templates) and regenerate.

- **ESPN surface** — one core, parameterized on `(sport, league)` slugs, is wrapped
  once per URL family (Site v2 / Core v2 / Web v3) and exposed across **29 leagues**
  as `espn_<league>_<short>` (snake) **and** `espn<League><Short>` (camelCase). The
  per-league extension modules are thin; endpoints carry a **scope** (`universal`,
  `ncaa`, `football`, `mlb`) so each league gets exactly the endpoints that apply.
- **Flat-API families** — non-ESPN, absolute-host live APIs. The **7 native** APIs
  (MLB Stats, Statcast, NHL ×4, NFL.com) are merged onto their league namespace; the
  **7 cross-sport providers** (Odds / 247 / CBS / Fox / Yahoo / HockeyTech /
  BartTorvik) get standalone `sdv.<provider>.*` namespaces and their own generated
  reference page. `sdv.hockeytech.*` (PWHL + AHL/OHL/WHL/QMJHL) is
  league-parameterized; `sdv.torvik.*` is men's college-basketball T-Rank
  analytics. Auth varies per family — bearer-token mint (NFL.com, automatic),
  `apiKey` query (Odds), public `apikey`+`api-version` (Fox), caller-supplied
  `headers`/JWT (247, Yahoo), keyless (CBS, HockeyTech, BartTorvik). A family that
  needs non-JSON bodies or custom request shaping (HockeyTech's JSONP, BartTorvik's
  browser-UA CSV/JSON) supplies its own getter runtime via `GETTER_OVERRIDES`.
- **OpenAPI → YAML transform** — `tools/codegen/from-openapi.mjs` turns a canonical
  OpenAPI 3.x spec (the `sdv-swagger` collection) into an endpoint-YAML *skeleton*,
  which made the provider families largely mechanical to add.
- **Parser layer** — `src/parsers/` registers one parser per endpoint. `{ parsed:
  true }` runs the raw payload through it → a tidy array of flat, snake_cased row
  objects (nested fields flattened by the in-house `normalize`). The browser-safe
  `sportsdataverse/parsers` barrel is esbuild-bundled into the playground so it parses
  client-side.

**TypeScript + ESM-only**, dual-case naming, Mocha no-network tests, and a Docusaurus
3 docs site on Vercel with a live playground.

```bash
npm run codegen         # regenerate from the endpoint YAML
npm run codegen:check   # drift gate (fails if the committed output is stale)
npm run bundle:parsers  # rebuild the browser parser bundle for the playground
npm run build           # compile TypeScript -> dist/
npm test                # mocha suite (no network)
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full workflow and
[`CLAUDE.md`](CLAUDE.md) for the architecture deep-dive.

## Documentation

The full reference is on the docs site: **<https://js.sportsdataverse.org/>**.

- **[Guides](https://js.sportsdataverse.org/docs/guides/)** — getting-started recipes (quickstart + per-sport + providers) with **live RunCell cells** you can edit and run inline.
- **[Tutorials](https://js.sportsdataverse.org/docs/tutorials/quickstart)** — guided walkthroughs.
- **[Reference](https://js.sportsdataverse.org/docs/reference/)** — every wrapper, by league. The sidebar is **grouped by sport** (with a Providers group).
- **[Playground](https://js.sportsdataverse.org/playground)** — run live ESPN + native-API calls in the browser.
- **[API](https://js.sportsdataverse.org/docs/api/)** — the full typed module surface (TypeDoc).
- **[Changelog](https://js.sportsdataverse.org/CHANGELOG)** — release notes.

### The SportsDataverse ecosystem

`sportsdataverse-js` is part of a family of open-source sports-data packages across
**Node.js, Python, and R**, all under the [SportsDataverse](https://sportsdataverse.org)
umbrella.

**Node.js** — [js.sportsdataverse.org](https://js.sportsdataverse.org)

- [`sportsdataverse`](https://js.sportsdataverse.org) — this package.

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
