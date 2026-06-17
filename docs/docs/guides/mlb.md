---
title: MLB recipes
sidebar_label: MLB
sidebar_position: 4
---

# MLB recipes

Baseball lives under `sdv.mlb`, which spans **two** surfaces: the ESPN
cross-league wrappers (`espnMlb*`) and the native **MLB Stats API**
(`mlbApi*`, host `statsapi.mlb.com`). Both honor `{ parsed: true }`.

## ESPN scoreboard

```js
import sdv from 'sportsdataverse';

const games = await sdv.mlb.espnMlbScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=mlb&e=espn%3Ascoreboard&parsed=1)

## MLB Stats API schedule (native)

`statsapi.mlb.com`'s own schedule feed. Defaults to today; scope it with a
`date` (YYYY-MM-DD) or a `season`.

```js
import sdv from 'sportsdataverse';

const schedule = await sdv.mlb.mlbApiSchedule({ parsed: true });
console.table(schedule);
```

[Open in playground ▶](/playground?l=mlb&e=flat%3Amlb_api%3Aschedule&parsed=1)

```js
import sdv from 'sportsdataverse';

// scope to a single day
const opening = await sdv.mlb.mlbApiSchedule({ date: '2024-03-28', parsed: true });
console.table(opening);
```

[Open in playground ▶](/playground?l=mlb&e=flat%3Amlb_api%3Aschedule&parsed=1)

## Team roster (native)

`team_id` 147 is the Yankees in the Stats API.

```js
import sdv from 'sportsdataverse';

const roster = await sdv.mlb.mlbApiTeamRoster({ team_id: 147, parsed: true });
console.table(roster);
```

[Open in playground ▶](/playground?l=mlb&e=flat%3Amlb_api%3Ateam_roster&parsed=1&team_id=147)

:::tip
Full method + parameter tables: **[MLB reference](/docs/reference/mlb)** (covers both
the ESPN and Stats API families).
:::
