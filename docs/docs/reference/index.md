---
title: ESPN Reference
sidebar_label: Overview
sidebar_position: 0
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# ESPN cross-league reference

Every league below exposes the same generated `espn<League><Endpoint>` surface (e.g. `espnNbaScoreboard`), bound from a single YAML source of truth. Each method is also available under its snake_case name (`espn_nba_scoreboard`) for parity with the Python / R packages. Pick a league for its full endpoint table, or try any call live in the [playground](/playground).

Every endpoint also accepts `{ parsed: true }` to return tidy rows instead of raw JSON — see [**ESPN parsed returns**](./espn-parsed-returns) for the column reference (116 endpoints across 22 parsers).

Some leagues additionally ship **native (non-ESPN) API** wrappers — NBA Stats API (stats.nba.com) (`nba`), WNBA Stats API (stats.wnba.com) (`wnba`), KenPom (`mbb`), NFL.com Shield API + PFF Developer API + NFL Pro (Next Gen Stats) (`nfl`), MLB Stats API + Baseball Savant / Statcast (`mlb`), NHL api-web (game feed) + NHL EDGE (player tracking) + NHL Stats REST + NHL Records (`nhl`), MLS web API (`mls`), NWSL (StatsPerform SDP) (`nwsl`). They're listed in the **Native API** sections of each league page; the `native` column below counts them. The [Sources & coverage](/docs/sources) page lists every upstream source with its auth, ownership and parity.

| League | sport | ESPN slug | scopes | wrappers | native |
|---|---|---|---|---:|---:|
| [nba](../nba/) | `basketball` | `nba` | universal | 116 | 128 |
| [wnba](../wnba/) | `basketball` | `wnba` | universal | 116 | 111 |
| [nbagl](../nbagl/) | `basketball` | `nba-development` | universal | 112 | — |
| [mbb](../mbb/) | `basketball` | `mens-college-basketball` | universal, ncaa | 122 | 30 |
| [wbb](../wbb/) | `basketball` | `womens-college-basketball` | universal, ncaa | 122 | — |
| [cfb](../cfb/) | `football` | `college-football` | universal, ncaa, football | 125 | — |
| [nfl](../nfl/) | `football` | `nfl` | universal, football | 118 | 99 |
| [mlb](../mlb/) | `baseball` | `mlb` | universal, mlb | 117 | 117 |
| [nhl](../nhl/) | `hockey` | `nhl` | universal | 113 | 127 |
| [mch](../mch/) | `hockey` | `mens-college-hockey` | universal, ncaa | 118 | — |
| [wch](../wch/) | `hockey` | `womens-college-hockey` | universal, ncaa | 118 | — |
| [college_baseball](../college_baseball/) | `baseball` | `college-baseball` | universal, ncaa | 122 | — |
| [college_softball](../college_softball/) | `baseball` | `college-softball` | universal, ncaa | 121 | — |
| [ufl](../ufl/) | `football` | `ufl` | universal | 113 | — |
| [xfl](../xfl/) | `football` | `xfl` | universal | 112 | — |
| [cfl](../cfl/) | `football` | `cfl` | universal | 112 | — |
| [soccer](../soccer/) | `soccer` | `eng.1 *(param)*` | universal | 112 | — |
| [epl](../epl/) | `soccer` | `eng.1` | universal | 113 | — |
| [laliga](../laliga/) | `soccer` | `esp.1` | universal | 112 | — |
| [bundesliga](../bundesliga/) | `soccer` | `ger.1` | universal | 112 | — |
| [seriea](../seriea/) | `soccer` | `ita.1` | universal | 112 | — |
| [ligue1](../ligue1/) | `soccer` | `fra.1` | universal | 112 | — |
| [mls](../mls/) | `soccer` | `usa.1` | universal | 113 | 12 |
| [ligamx](../ligamx/) | `soccer` | `mex.1` | universal | 112 | — |
| [ucl](../ucl/) | `soccer` | `uefa.champions` | universal | 113 | — |
| [uel](../uel/) | `soccer` | `uefa.europa` | universal | 112 | — |
| [nwsl](../nwsl/) | `soccer` | `usa.nwsl` | universal | 112 | 9 |
| [wwc](../wwc/) | `soccer` | `fifa.wwc` | universal | 112 | — |
| [wc](../wc/) | `soccer` | `fifa.world` | universal | 112 | — |
| [cricket](../cricket/) | `cricket` | `eng.1 *(param)*` | universal | 112 | — |

## Standalone provider namespaces

Native providers that aren't a single ESPN league — each gets its own `sdv.<namespace>` surface and reference page. Cross-sport providers (odds, cbs, …) live under **Providers** in the sidebar; sport-specific ones (`torvik` → Basketball, `hockeytech` → Hockey) nest under their sport.

| Namespace | sport | provider | wrappers |
|---|---|---|---:|
| [odds](./odds) | *cross-sport* | The Odds API | 10 |
| [recruiting](./recruiting) | *cross-sport* | 247Sports | 25 |
| [sports247](./sports247) | *cross-sport* | 247Sports RDB, 247Sports site pages | 47 |
| [cbs](./cbs) | *cross-sport* | CBS Sports | 82 |
| [fox](./fox) | *cross-sport* | Fox Sports | 38 |
| [yahoo](./yahoo) | *cross-sport* | Yahoo Sports (scores), Yahoo Sports | 109 |
| [hockeytech](./hockeytech) | Hockey | HockeyTech / LeagueStat | 16 |
| [torvik](./torvik) | Basketball | BartTorvik (T-Rank), BartTorvik women's (T-Rank) | 6 |
| [on3](./on3) | *cross-sport* | On3 Recruit Database | 78 |
| [asa](./asa) | Soccer | American Soccer Analysis | 15 |

:::tip Same call, every league
```js
await sdv.nba.espnNbaScoreboard({});
await sdv.nfl.espnNflScoreboard({ week: 1, seasonType: 2 });
await sdv.soccer.espnSoccerScoreboard({ league: 'eng.1' });
```
:::

:::tip Native (non-ESPN) APIs
```js
await sdv.mlb.mlbSchedule({ sportId: 1, date: '2024-07-01' });
await sdv.nhl.nhlWebPbp({ gameId: 2023030417, parsed: true });
await sdv.nfl.nflStandings({ season: 2024, seasonType: 'REG', week: 1 });
```
:::

:::note v4 names
Since v4 every wrapper carries sdv-py's name (`athlete` → `player`, `event` → `game`, …). Pre-v4 names still work as deprecated aliases (one `DeprecationWarning` per name) — see [Deprecated names](./deprecations).
:::

## Dataset loaders

`load*` functions read the published SportsDataverse release assets (parquet) — play-by-play with EPA/WP, schedules, rosters, box scores, ratings, player value — the way sportsdataverse-py's `load_*` functions do. Node only.

| Namespace | loaders |
|---|---:|
| [cfb](../cfb/reference/loaders.md) | 71 |
| [mbb](../mbb/reference/loaders.md) | 34 |
| [mlb](../mlb/reference/loaders.md) | 32 |
| [nba](../nba/reference/loaders.md) | 41 |
| [nfl](../nfl/reference/loaders.md) | 29 |
| [nhl](../nhl/reference/loaders.md) | 27 |
| [pwhl](../pwhl/reference/loaders.md) | 21 |
| [wbb](../wbb/reference/loaders.md) | 34 |
| [wnba](../wnba/reference/loaders.md) | 34 |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/releases.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/loaders)._
