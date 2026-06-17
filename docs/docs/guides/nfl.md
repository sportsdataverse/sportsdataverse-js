---
title: NFL recipes
sidebar_label: NFL
sidebar_position: 5
---

# NFL recipes

Pro football lives under `sdv.nfl`, which spans **two** surfaces: the ESPN
wrappers (`espnNfl*`) — scoreboard, rosters, standings, and the summary
dispatcher (for football the summary additionally unrolls drives into a
long-form play frame) — and the native **NFL.com "Shield" API** (`nflApi*`,
host `api.nfl.com`) for standings, rosters, weekly game details, and more. Pass
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

## Standings from the NFL.com Shield API (native)

`api.nfl.com` is NFL.com's own data API. A bearer token is minted automatically
before each call — no credentials required. Scope with `season`, `season_type`
(`REG` / `POST` / `PRE`), and `week`.

```js
import sdv from 'sportsdataverse';

const standings = await sdv.nfl.nflApiStandings({
  season: 2024,
  season_type: 'REG',
  week: 1,
  parsed: true,
});
console.table(standings);
```

[Open in playground ▶](/playground?l=nfl&e=flat%3Anfl_api%3Astandings&parsed=1&season=2024&season_type=REG&week=1)

## Rosters & weekly game details (native)

```js
import sdv from 'sportsdataverse';

// every active roster for a season
const rosters = await sdv.nfl.nflApiRosters({ season: 2024, parsed: true });
console.table(rosters.slice(0, 10));

// rich weekly game details (drive chart, scoring, standings)
const details = await sdv.nfl.nflApiWeeklyGameDetails({
  season: 2024,
  season_type: 'REG',
  week: 1,
  parsed: true,
});
console.table(details);
```

[Open rosters in playground ▶](/playground?l=nfl&e=flat%3Anfl_api%3Arosters&parsed=1&season=2024)

:::tip
Full method + parameter tables: **[NFL reference](/docs/reference/nfl)** (covers
both the ESPN and NFL.com Shield families).
:::
