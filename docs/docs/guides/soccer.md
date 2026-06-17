---
title: Soccer recipes
sidebar_label: Soccer
sidebar_position: 9
---

# Soccer recipes

Soccer lives under `sdv.soccer` and exposes the ESPN cross-league surface under
`espnSoccer*` method names. Unlike the single-league namespaces, **every soccer
call takes a `league` slug** that selects the competition — ESPN serves dozens
of them through one set of endpoints.

| Competition | `league` slug |
|---|---|
| English Premier League | `eng.1` |
| La Liga (Spain) | `esp.1` |
| Serie A (Italy) | `ita.1` |
| Bundesliga (Germany) | `ger.1` |
| Ligue 1 (France) | `fra.1` |
| MLS (USA) | `usa.1` |
| Liga MX (Mexico) | `mex.1` |
| UEFA Champions League | `uefa.champions` |
| NWSL | `usa.nwsl` |

Pass `{ parsed: true }` for tidy rows, or omit it for the raw ESPN payload.

## Scoreboard for a competition

Raw first, then the same fixtures tidied:

```js
import sdv from 'sportsdataverse';

const raw = await sdv.soccer.espnSoccerScoreboard({ league: 'eng.1' });
const fixtures = await sdv.soccer.espnSoccerScoreboard({ league: 'eng.1', parsed: true });
console.table(fixtures);
```

[Open in playground ▶](/playground?l=soccer&e=espn%3Ascoreboard&parsed=1&league=eng.1)

## League table (standings)

Swap the `league` slug to follow any competition — here, La Liga:

```js
import sdv from 'sportsdataverse';

const table = await sdv.soccer.espnSoccerStandings({ league: 'esp.1', parsed: true });
console.table(table);
```

[Open in playground ▶](/playground?l=soccer&e=espn%3Astandings&parsed=1&league=esp.1)

## Every club, then a roster

`espnSoccerTeamsSite` lists the clubs in a competition (grab an `id`);
`espnSoccerTeamRoster` returns one row per player.

```js
import sdv from 'sportsdataverse';

const clubs = await sdv.soccer.espnSoccerTeamsSite({ league: 'ger.1', parsed: true });
console.table(clubs);

// team_id 132 is Bayern Munich
const roster = await sdv.soccer.espnSoccerTeamRoster({
  league: 'ger.1',
  team_id: 132,
  parsed: true,
});
console.table(roster);
```

[Open in playground ▶](/playground?l=soccer&e=espn%3Ateam_roster&parsed=1&league=ger.1&team_id=132)

:::tip
Full method + parameter tables: **[Soccer reference](/docs/reference/soccer)**.
Per-competition reference pages (EPL, La Liga, Bundesliga, MLS, NWSL, UCL…) each
pin a default `league` slug — see the **[EPL reference](/docs/reference/epl)** for
an example.
:::
