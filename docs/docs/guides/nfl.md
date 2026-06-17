---
title: NFL recipes
sidebar_label: NFL
sidebar_position: 3
---

# NFL recipes

Pro football lives under `sdv.nfl`. The ESPN surface (`espnNfl*`) gives you
scoreboard, rosters, standings, and the summary dispatcher; for football the
summary additionally unrolls drives into a long-form play frame. Pass
`{ parsed: true }` for tidy rows.

## Scoreboard

```js
import sdv from 'sportsdataverse';

const games = await sdv.nfl.espnNflScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=nfl&e=espn%3Ascoreboard&parsed=1)

## Team roster

`team_id` 12 is the Chiefs.

```js
import sdv from 'sportsdataverse';

const roster = await sdv.nfl.espnNflTeamRoster({ team_id: 12, parsed: true });
console.table(roster);
```

[Open in playground ▶](/playground?l=nfl&e=espn%3Ateam_roster&parsed=1&team_id=12)

## Box score from a game id

```js
import sdv from 'sportsdataverse';

const sb = await sdv.nfl.espnNflScoreboard({});
const id = sb.events[0].id;

const teamBox = await sdv.nfl.espnNflSummary({
  event_id: id,
  parsed: true,
  section: 'boxscore_team',
});
console.table(teamBox);
```

[Open in playground ▶](/playground?l=nfl&e=espn%3Asummary&parsed=1&section=boxscore_team)

:::tip
Full method + parameter tables: **[NFL reference](/docs/reference/nfl)**.
:::
