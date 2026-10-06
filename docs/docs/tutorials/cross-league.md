---
title: The cross-league surface
sidebar_label: 2. Cross-league surface
sidebar_position: 2
description: One API across 30 leagues and 10 provider namespaces — and how to discover it at runtime with listFunctions, findTeam and the parser registry.
---

# The cross-league surface

**What you'll build:** a short script that maps the package from the inside —
how many functions each namespace carries, a search within one league, a fuzzy
team lookup, a parser run on JSON you already have, and the league matrix.
Along the way you learn the rule that makes the surface predictable: the same
endpoint name works on every league that has it.

## Sources used

| Source | Host | Call |
| --- | --- | --- |
| ESPN Site API v2 | `site.api.espn.com` | `findTeam('Celtics', 'nba')` (one `teams` request per league, cached) |
| The package itself | — | `listFunctions`, `functionCount`, `LEAGUES`, `sportsdataverse/parsers` |

## One call, every league

The headline feature is that **the same API works across every league**. Once
you know one league, you know them all:

```js
import sdv from "sportsdataverse";

await sdv.nba.espnNbaScoreboard({});
await sdv.nfl.espnNflScoreboard({ week: 1, season_type: 2 });
await sdv.nhl.espnNhlScoreboard({});
await sdv.mlb.espnMlbScoreboard({});
await sdv.wnba.espnWnbaScoreboard({});
```

That makes league-agnostic helpers trivial. The snake_case twin composes
cleanly from a league string:

```js
async function gamesToday(league) {
  return sdv[league][`espn_${league}_scoreboard`]({ parsed: true });
}
for (const league of ["nba", "nfl", "nhl", "mlb"]) {
  console.log(league, (await gamesToday(league)).length);
}
```

## Scopes: which endpoints a league has

Not every endpoint applies to every league. Endpoints belong to a **scope**, and
a league exposes an endpoint only when the scope matches (the `scopes` column
in the script's last table):

| Scope | Applies to | Example endpoints |
| --- | --- | --- |
| `universal` | every league | `scoreboard`, `summary`, `team_roster`, `standings`, `news` |
| `ncaa` | college leagues | `rankings`, conference groupings |
| `football` | NFL, CFB, UFL | drive / play detail, betting endpoints |
| `mlb` | MLB | baseball-specific feeds |

So `espnCfbRankings` exists (CFB carries the `ncaa` scope) but `espnNbaRankings`
does not. Beyond ESPN, 27 native and provider families sit on the same
namespaces (`sdv.nhl.nhl*`, `sdv.mlb.mlb*`, `sdv.nfl.nfl*`) or on their own
(`sdv.odds`, `sdv.hockeytech`, `sdv.torvik`, `sdv.cbs`, …) — which is why
`sdv.mlb` carries 400+ functions in the first table below.

## Multi-league sports take a `league` slug

Soccer and cricket cover many competitions under one namespace, so they take an
extra `league` parameter; convenience namespaces (`sdv.epl`, `sdv.laliga`, …)
pin it for you. The [soccer tutorial](./soccer-cross-league) shows both forms
producing the same request.

## Discovering the surface at runtime

The script below is the reference for the discovery helpers:

- `functionCount()` — functions per namespace (or one league's count).
- `listFunctions(league, { search })` — the callable names on a namespace,
  camelCase canonical with the snake_case twins folded away; `parsersOnly` /
  `wrappersOnly` narrow it.
- `findTeam(name, league)` — a case-insensitive, partial-name match against
  ESPN's `teams` list, returning the team record (id, abbreviation, colour, …).
  `findAthlete` and `findEvent` work the same way.
- `sportsdataverse/parsers` — the parser layer as a subpath export:
  `parseEndpoint('espn', 'scoreboard', raw)` runs the registered parser on a
  payload you already hold (a saved file, a proxy response). It is the same
  bundle the docs playground runs in the browser.
- `LEAGUES` — the league matrix the wrappers are generated from.

## The script

<!-- inject:source:ex13 -->

```js title="examples/13_discover_and_utilities.mjs"
// 13 — Discovering the surface: listFunctions, findTeam, and the parser registry.
//
// Shows: the runtime index of what the package exposes. `listFunctions(league)`
// returns the callable names on a namespace (camelCase canonical, with the
// snake_case twins folded away), `functionCount()` the per-namespace totals,
// `findTeam(name, league)` resolves a fuzzy team name to its ESPN team record
// (one `teams` request per league, cached), and the `sportsdataverse/parsers`
// subpath (`parseEndpoint`, `PARSERS`) exposes the parser layer so you can run a
// registered parser on JSON you already have — the same bundle the docs
// playground runs in the browser.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/teams (findTeam)
// Offline fixture: test/fixtures/espn/teams_site_nba.json (all 30 teams, 2026-10-05).

import sdv, { listFunctions, functionCount, findTeam, LEAGUES } from 'sportsdataverse';
import { parseEndpoint, PARSERS } from 'sportsdataverse/parsers';
import { readFileSync } from 'node:fs';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

// 1. How big is each namespace?
const counts = await functionCount();
printTable(
  Object.entries(counts).map(([ns, n]) => ({ namespace: `sdv.${ns}`, functions: n })).sort((a, b) => b.functions - a.functions),
  ['namespace', 'functions'],
  10,
  'Largest namespaces (functionCount)'
);

// 2. Search within a league.
const nhlShots = await listFunctions('nhl', { search: 'shot' });
printTable(nhlShots.map((name) => ({ name })), ['name'], 10, `sdv.nhl functions matching "shot" (${nhlShots.length})`);

// 3. Resolve a team by (partial) name → ESPN team record.
const team = await findTeam('Celtics', 'nba');
printTable([{ id: team.id, abbreviation: team.abbreviation, displayName: team.displayName, color: team.color, slug: team.slug }], ['id', 'abbreviation', 'displayName', 'color', 'slug'], 1, "findTeam('Celtics', 'nba')");

// 4. The parser registry: run a registered parser on a payload you already hold.
const raw = JSON.parse(readFileSync(new URL('../test/fixtures/espn/scoreboard_nba.json', import.meta.url), 'utf8'));
const rows = parseEndpoint('espn', 'scoreboard', raw);
console.log(`PARSERS: ${Object.keys(PARSERS).length} flat parsers registered; parseEndpoint('espn', 'scoreboard', raw) → ${rows.length} rows, ${Object.keys(rows[0]).length} columns`);
printTable(rows, ['game_id', 'short_name', 'status_type_description', 'home_score', 'away_score'], 4, 'parseEndpoint("espn", "scoreboard", raw) on a saved payload');

// 5. The league matrix.
printTable(
  LEAGUES.map((l) => ({ prefix: l.prefix, sport: l.sport, league: l.league, scopes: l.scopes.join('+') })),
  ['prefix', 'sport', 'league', 'scopes'],
  8,
  `LEAGUES (${LEAGUES.length} entries)`
);
```

<!-- /inject -->

## Output

<!-- inject:example:ex13 -->

Output of `node examples/13_discover_and_utilities.mjs` (offline, against the committed fixtures):

```text

## Largest namespaces (functionCount)
| namespace | functions |
| --------- | --------- |
| sdv.mlb   | 408       |
| sdv.nhl   | 350       |
| sdv.nba   | 348       |
| sdv.wnba  | 323       |
| sdv.nfl   | 318       |
| sdv.cfb   | 263       |
| sdv.mbb   | 254       |
| sdv.wbb   | 220       |
| sdv.yahoo | 214       |
| sdv.cbs   | 180       |
(43 rows, first 10 shown)

## sdv.nhl functions matching "shot" (10)
| name                       |
| -------------------------- |
| load_nhl_shots_by_period   |
| nhl_edge_goalie_shot_loca… |
| nhl_edge_goalie_shot_loca… |
| nhl_edge_skater_shot_loca… |
| nhl_edge_skater_shot_loca… |
| nhl_edge_skater_shot_spee… |
| nhl_edge_skater_shot_spee… |
| nhl_edge_team_shot_locati… |
| nhl_edge_team_shot_locati… |
| nhl_edge_team_shot_speed_… |
(10 rows, all shown)

## findTeam('Celtics', 'nba')
| id | abbreviation | displayName    | color  | slug           |
| -- | ------------ | -------------- | ------ | -------------- |
| 2  | BOS          | Boston Celtics | 008348 | boston-celtics |
(1 rows, all shown)
PARSERS: 128 flat parsers registered; parseEndpoint('espn', 'scoreboard', raw) → 10 rows, 50 columns

## parseEndpoint("espn", "scoreboard", raw) on a saved payload
| game_id   | short_name | status_type_description | home_score | away_score |
| --------- | ---------- | ----------------------- | ---------- | ---------- |
| 401704871 | ORL @ BKN  | Final                   | 92         | 100        |
| 401704872 | IND @ MEM  | Final                   | 136        | 121        |
| 401704873 | BOS @ CLE  | Final                   | 115        | 111        |
| 401704874 | NO @ NY    | Final                   | 118        | 85         |
(10 rows, first 4 shown)

## LEAGUES (30 entries)
| prefix | sport      | league                    | scopes                  |
| ------ | ---------- | ------------------------- | ----------------------- |
| nba    | basketball | nba                       | universal               |
| wnba   | basketball | wnba                      | universal               |
| nbagl  | basketball | nba-development           | universal               |
| mbb    | basketball | mens-college-basketball   | universal+ncaa          |
| wbb    | basketball | womens-college-basketball | universal+ncaa          |
| cfb    | football   | college-football          | universal+ncaa+football |
| nfl    | football   | nfl                       | universal+football      |
| mlb    | baseball   | mlb                       | universal+mlb           |
(30 rows, first 8 shown)
```

<!-- /inject -->

## Next steps

- **[From scoreboard to a table](./scoreboard-to-table)** — put a single league to work.
- **[Reference](../reference/)** — the full per-league endpoint tables.
