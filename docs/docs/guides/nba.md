---
title: NBA & WNBA recipes
sidebar_label: NBA / WNBA
sidebar_position: 2
---

# NBA & WNBA recipes

Basketball lives under `sdv.nba` and `sdv.wnba`. Both expose the full ESPN
cross-league surface — scoreboard, team roster, the 21-section summary
dispatcher, standings, rankings, and more — under `espnNba*` / `espnWnba*`
method names. Pass `{ parsed: true }` for tidy rows.

## Today's scoreboard

```js
import sdv from 'sportsdataverse';

const games = await sdv.nba.espnNbaScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=nba&e=espn%3Ascoreboard&parsed=1)

## A full team roster

`team_id` 13 is the Lakers. One row per player.

```js
import sdv from 'sportsdataverse';

const roster = await sdv.nba.espnNbaTeamRoster({ team_id: 13, parsed: true });
console.table(roster);
```

[Open in playground ▶](/playground?l=nba&e=espn%3Ateam_roster&parsed=1&team_id=13)

## Drill into a game (summary dispatcher)

The summary endpoint returns many sub-frames. Pull one with `section`:

```js
import sdv from 'sportsdataverse';

const sb = await sdv.nba.espnNbaScoreboard({});
const id = sb.events[0].id;

const boxscore = await sdv.nba.espnNbaSummary({
  event_id: id,
  parsed: true,
  section: 'boxscore_team',
});
console.table(boxscore);
```

[Open in playground ▶](/playground?l=nba&e=espn%3Asummary&parsed=1&section=boxscore_team)

## WNBA — same surface, different namespace

```js
import sdv from 'sportsdataverse';

const wnba = await sdv.wnba.espnWnbaScoreboard({ parsed: true });
console.table(wnba);
```

[Open in playground ▶](/playground?l=wnba&e=espn%3Ascoreboard&parsed=1)

:::tip
Full method + parameter tables: **[NBA reference](/docs/reference/nba)** and
**[WNBA reference](/docs/reference/wnba)**.
:::
