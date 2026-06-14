# **sportsdataverse** <a href='https://js.sportsdataverse.org/'><img src='https://raw.githubusercontent.com/sportsdataverse/sportsdataverse-js/main/docs/static/img/sdv-js-logo.png' align="right" width="20%" min-width="100px"/></a>

![Lifecycle:maturing](https://img.shields.io/badge/lifecycle-maturing-blue.svg?style=for-the-badge&logo=github)
[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse) [![npm downloads](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse)
[![Contributors](https://img.shields.io/github/contributors/sportsdataverse/sportsdataverse-js?style=for-the-badge&logo=github)](https://github.com/sportsdataverse/sportsdataverse-js/graphs/contributors)
[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse)

`sportsdataverse` is the SportsDataverse's **Node.js** client for sports data. As of
**v3.0.0** it is a **cross-league ESPN client**: a single, uniform surface of **116
endpoint wrappers** generated for **29 leagues** — play-by-play, box scores,
schedules, rosters, standings, rankings, odds, and more — plus the original
hand-written scrapers it has always shipped.

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
follow one naming rule — **`espn_<league>_<endpoint>`**:

```js
import sdv from "sportsdataverse";

// Today's NBA scoreboard
const board = await sdv.nba.espn_nba_scoreboard({});

// A single game summary (box score + plays + win probability + ...)
const game = await sdv.nba.espn_nba_summary({ event_id: 401584793 });

// A team's roster
const roster = await sdv.nfl.espn_nfl_team_roster({ team_id: 12 });
```

The same methods exist on **every** league, so switching sports is a one-token change:

```js
await sdv.nfl.espn_nfl_scoreboard({ week: 1, season_type: 2 });
await sdv.nhl.espn_nhl_scoreboard({});
await sdv.cfb.espn_cfb_rankings({});                 // NCAA-scoped endpoint
await sdv.wnba.espn_wnba_standings({ season: 2024 });
```

Multi-league sports (soccer, cricket) take an extra `league` slug:

```js
await sdv.soccer.espn_soccer_scoreboard({ league: "eng.1" });  // Premier League
await sdv.soccer.espn_soccer_scoreboard({ league: "esp.1" });  // La Liga
```

Parameters accept **snake_case or camelCase**, and every pre-3.0 convenience method
is preserved alongside the generated wrappers:

```js
await sdv.nfl.espn_nfl_team_schedule({ team_id: 12, season: 2024 });
await sdv.nfl.espn_nfl_team_schedule({ teamId: 12, season: 2024 });  // identical

const pbp = await sdv.nba.getPlayByPlay(401584793);  // legacy method, still works
```

### Introspect the surface

```js
import sdv, { LEAGUES, WRAPPERS } from "sportsdataverse";

LEAGUES.map((l) => l.prefix);           // ['nba','nfl',...,'soccer','cricket','ufl',...]
WRAPPERS.length;                         // 116 endpoint definitions
Object.keys(sdv.nba).filter((k) => k.startsWith("espn_nba_"));  // every NBA wrapper
```

Endpoints are grouped into **scopes** — `universal` (every league), `ncaa` (college),
`football` (NFL/CFB/UFL), and `mlb` — so each league gets exactly the endpoints that
apply to it. See the [per-league reference](https://js.sportsdataverse.org/docs/reference/)
for the full list, or try any call live in the
[playground](https://js.sportsdataverse.org/playground).

## How it's built

The ESPN client is **generated from a single YAML source of truth**
(`tools/codegen/endpoints/*.yaml`). One generator emits the runtime wrapper tables,
the per-league docs reference, and the playground metadata — so they can never drift
apart.

```bash
npm run codegen         # regenerate from the endpoint YAML
npm run codegen:check   # drift gate (fails if the committed output is stale)
npm run build           # compile TypeScript -> dist/
npm test                # mocha suite (SDV_LIVE=1 adds a live per-league smoke test)
```

## Documentation

The full reference is on the docs site: **<https://js.sportsdataverse.org/>**.

- **[Tutorials](https://js.sportsdataverse.org/docs/tutorials/quickstart)** — guided walkthroughs.
- **[Reference](https://js.sportsdataverse.org/docs/reference/)** — every wrapper, by league.
- **[Playground](https://js.sportsdataverse.org/playground)** — run live ESPN calls in the browser.
- **[API](https://js.sportsdataverse.org/docs/api/)** — the full typed module surface (TypeDoc).
- **[Changelog](https://js.sportsdataverse.org/CHANGELOG)** — release notes.

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
