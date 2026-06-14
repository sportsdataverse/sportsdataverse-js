---
title: Getting Started
sidebar_label: Getting Started
sidebar_position: 1
---

# sportsdataverse-js

<a href='https://js.sportsdataverse.org/'><img src='https://raw.githubusercontent.com/sportsdataverse/sportsdataverse-js/main/docs/static/img/sdv-js-logo.png' alt="sportsdataverse-js logo" align="right" width="20%" min-width="100px"/></a>

[![npm](https://img.shields.io/npm/v/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse)
[![npm downloads](https://img.shields.io/npm/dm/sportsdataverse?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/sportsdataverse)
[![Contributors](https://img.shields.io/github/contributors/sportsdataverse/sportsdataverse-js?style=for-the-badge&logo=github)](https://github.com/sportsdataverse/sportsdataverse-js/graphs/contributors)
[![Twitter Follow](https://img.shields.io/twitter/follow/SportsDataverse?color=blue&label=%40SportsDataverse&logo=twitter&style=for-the-badge)](https://twitter.com/SportsDataverse)

**`sportsdataverse`** is the SportsDataverse's Node.js client for sports data. As
of **v3.0.0** it is a **cross-league ESPN client**: a single, uniform surface of
**116 endpoint wrappers** generated for **29 leagues** — play-by-play, box scores,
schedules, rosters, standings, rankings, odds, and more — plus the original
hand-written scrapers it has always shipped.

It is the Node.js sister to the [`sportsdataverse-py`](https://py.sportsdataverse.org/)
Python package and the [SportsDataverse R packages](https://r.sportsdataverse.org/)
(`hoopR`, `wehoop`, `cfbfastR`, `fastRhockey`, …).

## Installation

```bash
npm install sportsdataverse
```

**Requirements:** Node **≥ 20.18.1**. The package is **ESM-only** and ships
TypeScript declarations.

```js
import sdv from 'sportsdataverse';
```

> Using CommonJS? Load it with a dynamic import: `const sdv = (await import('sportsdataverse')).default;`

## Quick start

Every league is a namespace on the default export. The cross-league ESPN
endpoints follow one naming rule — **`espn_<league>_<endpoint>`**:

```js
import sdv from 'sportsdataverse';

// Today's NBA scoreboard
const board = await sdv.nba.espn_nba_scoreboard({});

// A single game summary (box score + plays + win probability + ...)
const game = await sdv.nba.espn_nba_summary({ event_id: 401584793 });

// A team's roster
const roster = await sdv.nfl.espn_nfl_team_roster({ team_id: 12 });
```

The same methods exist on **every** league, so switching sports is a one-token
change:

```js
await sdv.nfl.espn_nfl_scoreboard({ week: 1, season_type: 2 });
await sdv.nhl.espn_nhl_scoreboard({});
await sdv.cfb.espn_cfb_rankings({});          // NCAA-scoped endpoint
await sdv.wnba.espn_wnba_standings({ season: 2024 });
```

Multi-league sports (soccer, cricket) take an extra `league` slug:

```js
// English Premier League scoreboard
await sdv.soccer.espn_soccer_scoreboard({ league: 'eng.1' });
// La Liga, same call
await sdv.soccer.espn_soccer_scoreboard({ league: 'esp.1' });
```

### Parameters: snake_case **or** camelCase

Every wrapper accepts either spelling, so it reads naturally from JS or matches
the Python/R sister packages:

```js
await sdv.nfl.espn_nfl_team_schedule({ team_id: 12, season: 2024 });
await sdv.nfl.espn_nfl_team_schedule({ teamId: 12, season: 2024 });  // identical
```

### Legacy methods still work

Every pre-3.0 convenience method is preserved and merged *alongside* the
generated wrappers:

```js
const pbp = await sdv.nba.getPlayByPlay(401584793);
const box = await sdv.cfb.getBoxScore(401628319);
```

## How the cross-league surface works

The ESPN client is **generated from a single YAML source of truth**
(`tools/codegen/endpoints/*.yaml`). Each endpoint is wrapped once and bound to
every applicable league, so the 116 endpoints × 29 leagues stay perfectly in
sync. Endpoints are grouped into **scopes**:

| Scope | Applies to | Examples |
|---|---|---|
| `universal` | every league | `scoreboard`, `summary`, `team_roster`, `standings` |
| `ncaa` | college leagues | `rankings`, conference groupings |
| `football` | NFL + CFB + UFL | drive/play detail, betting endpoints |
| `mlb` | MLB | baseball-specific feeds |

You can introspect the whole surface at runtime:

```js
import sdv, { LEAGUES, WRAPPERS } from 'sportsdataverse';

LEAGUES.map((l) => l.prefix);            // ['nba','nfl','nhl',...,'soccer','cricket','ufl',...]
WRAPPERS.length;                          // 116 endpoint definitions
Object.keys(sdv.nba).filter((k) => k.startsWith('espn_nba_'));  // every NBA wrapper
```

## Where to next

- **[Tutorials](./tutorials/quickstart)** — guided, copy-pasteable walkthroughs.
- **[Reference](./reference/)** — every `espn_<league>_<endpoint>` wrapper, by league.
- **[Playground](/playground)** — run live ESPN calls in your browser.
- **[API (TypeDoc)](./api/)** — the full typed module surface.

## License

[MIT](https://github.com/sportsdataverse/sportsdataverse-js/blob/main/LICENSE) ©
[Saiem Gilani](https://twitter.com/saiemgilani), part of the
[SportsDataverse](https://sportsdataverse.org).
