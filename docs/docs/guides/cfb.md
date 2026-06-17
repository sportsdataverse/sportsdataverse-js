---
title: CFB recipes
sidebar_label: CFB
sidebar_position: 8
---

# CFB recipes

College football lives under `sdv.cfb`. It carries the universal ESPN surface
plus the NCAA + football extras — scoreboard, rankings (AP/Coaches), rosters,
and the drive-aware summary dispatcher. Pass `{ parsed: true }` for tidy rows.

## Scoreboard

```js
import sdv from 'sportsdataverse';

const games = await sdv.cfb.espnCfbScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=cfb&e=espn%3Ascoreboard&parsed=1)

## Rankings (AP poll & friends)

```js
import sdv from 'sportsdataverse';

const rankings = await sdv.cfb.espnCfbRankings({ parsed: true });
console.table(rankings);
```

[Open in playground ▶](/playground?l=cfb&e=espn%3Arankings&parsed=1)

## Team roster

`team_id` 333 is Alabama.

```js
import sdv from 'sportsdataverse';

const roster = await sdv.cfb.espnCfbTeamRoster({ team_id: 333, parsed: true });
console.table(roster);
```

[Open in playground ▶](/playground?l=cfb&e=espn%3Ateam_roster&parsed=1&team_id=333)

:::tip
Full method + parameter tables: **[CFB reference](/docs/reference/cfb)**. For
recruiting rankings, see the **[Providers guide](./providers)** (247Sports).
:::
