---
title: The cross-league surface
sidebar_label: 2. Cross-league surface
sidebar_position: 2
---

# The cross-league surface

The headline feature of v3.0.0 is that **the same API works across every league**.
Once you know one league, you know them all.

## One call, every league

Switching sports is a one-token change — the method name and the parameters are
the same:

```js
import sdv from "sportsdataverse";

await sdv.nba.espn_nba_scoreboard({});
await sdv.nfl.espn_nfl_scoreboard({ week: 1, season_type: 2 });
await sdv.nhl.espn_nhl_scoreboard({});
await sdv.mlb.espn_mlb_scoreboard({});
await sdv.wnba.espn_wnba_scoreboard({});
```

That makes it trivial to write league-agnostic helpers:

```js
async function gamesToday(league) {
  const board = await sdv[league][`espn_${league}_scoreboard`]({});
  return board.events ?? [];
}

for (const league of ["nba", "nfl", "nhl", "mlb"]) {
  console.log(league, (await gamesToday(league)).length);
}
```

## Scopes: which endpoints a league has

Not every endpoint applies to every league. Endpoints belong to a **scope**, and a
league exposes an endpoint only when the scope matches:

| Scope | Applies to | Example endpoints |
|---|---|---|
| `universal` | every league | `scoreboard`, `summary`, `team_roster`, `standings`, `news` |
| `ncaa` | college leagues | `rankings`, conference groupings |
| `football` | NFL, CFB, UFL | drive/play detail, betting endpoints |
| `mlb` | MLB | baseball-specific feeds |

So `espn_cfb_rankings` exists (CFB carries the `ncaa` scope) but `espn_nba_rankings`
does not:

```js
typeof sdv.cfb.espn_cfb_rankings;   // 'function'
typeof sdv.nba.espn_nba_rankings;   // 'undefined'
```

## Multi-league sports: soccer & cricket

Soccer and cricket cover many competitions under one namespace, so they take an
extra **`league`** slug:

```js
await sdv.soccer.espn_soccer_scoreboard({ league: "eng.1" });  // Premier League
await sdv.soccer.espn_soccer_scoreboard({ league: "esp.1" });  // La Liga
await sdv.soccer.espn_soccer_standings({ league: "ita.1" });   // Serie A
```

There are also convenience namespaces for the big competitions (`epl`, `laliga`,
`seriea`, `bundesliga`, `ligue1`, `ucl`, …) that pin the slug for you:

```js
await sdv.epl.espn_epl_scoreboard({});      // same as soccer + { league: 'eng.1' }
```

## Introspecting the surface at runtime

The full matrix is exported, so you can build menus, validate input, or just
explore:

```js
import sdv, { LEAGUES, WRAPPERS } from "sportsdataverse";

// Every league and its ESPN slugs
LEAGUES.map((l) => ({ prefix: l.prefix, sport: l.sport, league: l.league }));

// Every endpoint definition (116 of them)
WRAPPERS.map((w) => w.short);

// Every endpoint available on a given league
Object.keys(sdv.nfl).filter((k) => k.startsWith("espn_nfl_"));
```

## Next steps

- **[From scoreboard to a table](./scoreboard-to-table)** — put this to work.
- **[Reference](../reference/)** — the full per-league endpoint tables.
