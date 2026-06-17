---
title: NHL recipes
sidebar_label: NHL
sidebar_position: 5
---

# NHL recipes

Hockey lives under `sdv.nhl` and, like MLB, spans two surfaces: the ESPN
wrappers (`espnNhl*`) and the modern **NHL api-web** family (`nhlApiWeb*`, host
`api-web.nhle.com`) — play-by-play, boxscores, standings, rosters, leaders.
Both honor `{ parsed: true }`.

## ESPN scoreboard

```js
import sdv from 'sportsdataverse';

const games = await sdv.nhl.espnNhlScoreboard({ parsed: true });
console.table(games);
```

[Open in playground ▶](/playground?l=nhl&e=espn%3Ascoreboard&parsed=1)

## Full-season standings (api-web)

No parameters needed — the current season's standings, tidied.

```js
import sdv from 'sportsdataverse';

const standings = await sdv.nhl.nhlApiWebStandingsSeason({ parsed: true });
console.table(standings);
```

[Open in playground ▶](/playground?l=nhl&e=flat%3Anhl_api_web%3Astandings_season&parsed=1)

## Play-by-play for one game (api-web)

```js
import sdv from 'sportsdataverse';

// 2023030417 = a 2023 Stanley Cup Final game
const plays = await sdv.nhl.nhlApiWebPbp({ game_id: '2023030417', parsed: true });
console.table(plays.slice(0, 10));
```

[Open in playground ▶](/playground?l=nhl&e=flat%3Anhl_api_web%3Apbp&parsed=1&game_id=2023030417)

:::tip
Full method + parameter tables: **[NHL reference](/docs/reference/nhl)** (ESPN +
api-web families).
:::
