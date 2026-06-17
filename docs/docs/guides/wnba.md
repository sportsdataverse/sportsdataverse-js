---
title: WNBA recipes
sidebar_label: WNBA
sidebar_position: 3
---

# WNBA recipes

The WNBA lives under `sdv.wnba` and exposes the full ESPN cross-league surface
under `espnWnba*` method names — scoreboard, standings, team list, rosters, and
the 21-section summary dispatcher. Every method takes a single options object;
pass `{ parsed: true }` for tidy rows, or omit it for the raw ESPN payload.

## Today's scoreboard

Raw payload first, then the same call tidied to one row per game:

```js
import sdv from 'sportsdataverse';

const raw = await sdv.wnba.espnWnbaScoreboard({});
const games = await sdv.wnba.espnWnbaScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=wnba&e=espn%3Ascoreboard&parsed=1)

## League standings

No parameters needed — the current season, tidied.

```js
import sdv from 'sportsdataverse';

const standings = await sdv.wnba.espnWnbaStandings({ parsed: true });
console.table(standings);
```

[Open in playground ▶](/playground?l=wnba&e=espn%3Astandings&parsed=1)

## Every team, then a roster

`espnWnbaTeamsSite` lists the league's teams (grab an `id`); `espnWnbaTeamRoster`
returns one row per player.

```js
import sdv from 'sportsdataverse';

const teams = await sdv.wnba.espnWnbaTeamsSite({ parsed: true });
console.table(teams);

// team_id 9 is the Las Vegas Aces
const roster = await sdv.wnba.espnWnbaTeamRoster({ team_id: 9, parsed: true });
console.table(roster);
```

[Open in playground ▶](/playground?l=wnba&e=espn%3Ateam_roster&parsed=1&team_id=9)

## Drill into a game (summary dispatcher)

The summary endpoint returns many sub-frames (boxscore, plays, leaders…). Pull
one with `section`:

```js
import sdv from 'sportsdataverse';

const sb = await sdv.wnba.espnWnbaScoreboard({});
const id = sb.events[0].id;

const boxscore = await sdv.wnba.espnWnbaSummary({
  event_id: id,
  parsed: true,
  section: 'boxscore_team',
});
console.table(boxscore);
```

[Open in playground ▶](/playground?l=wnba&e=espn%3Asummary&parsed=1&section=boxscore_team)

:::tip
Full method + parameter tables: **[WNBA reference](/docs/reference/wnba)**. The
men's and women's pro leagues share the same surface — see the
**[NBA & WNBA guide](./nba)** for the NBA side.
:::
