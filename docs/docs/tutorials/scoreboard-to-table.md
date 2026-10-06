---
title: From scoreboard to a table
sidebar_label: 2. Scoreboard to a table
sidebar_position: 2
description: The raw ESPN scoreboard next to its parsed form, and a derived margin-of-victory table — the pattern every other tutorial builds on.
---

import OpenInStackBlitz from '@site/src/components/OpenInStackBlitz';

# From scoreboard to a tidy table

**What you'll build:** a script that fetches the NBA scoreboard twice — raw and
parsed — prints one row per game, then derives a "biggest margins" table from
the parsed rows. The same code works for any league by swapping the namespace.

## Sources used

| Source | Host | Call |
| --- | --- | --- |
| ESPN Site API v2 | `site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard` | `sdv.nba.espnNbaScoreboard` |

Offline fixture: `test/fixtures/espn/scoreboard_nba.json` (a 10-game slate).

## Raw vs parsed

ESPN's scoreboard nests each game under
`events[].competitions[0].competitors[]`, with the home and away sides as two
entries of that array distinguished by `homeAway`. If you want to walk it
yourself, a defensive extractor looks like this:

```js
function tidyGames(board) {
  return (board.events ?? []).map((event) => {
    const comp = event.competitions?.[0] ?? {};
    const home = (comp.competitors ?? []).find((c) => c.homeAway === "home") ?? {};
    const away = (comp.competitors ?? []).find((c) => c.homeAway === "away") ?? {};
    return {
      id: event.id,
      status: event.status?.type?.description ?? "",
      home: home.team?.abbreviation,
      away: away.team?.abbreviation,
      homeScore: Number(home.score ?? 0),
      awayScore: Number(away.score ?? 0),
    };
  });
}
```

You don't have to: `{ parsed: true }` runs the registered `scoreboard` parser,
which does that flattening for every league and gives you ~50 snake_cased
columns per game — `game_id`, `short_name`, `status_type_detail`,
`home_abbreviation`, `home_score`, `away_abbreviation`, `away_score`,
`venue_full_name`, `broadcast`, and so on. The script prints seven of them.

Two things to notice in the parsed rows:

- **Scores are strings** in ESPN's payload and stay strings in the parsed
  frame (the parser does not guess types); the script wraps them in `Number()`
  before comparing. Ids (`game_id`, `home_id`, `venue_id`) are strings by rule.
- `status_type_completed` is a real boolean, so filtering finals needs no
  string comparison.

## Deriving a table

With flat rows the rest is ordinary array work: filter to completed games, map
to the columns you want, sort. The script's second table is the margin of
victory per game, biggest first, with the venue pulled from the same row.

## The script

<!-- inject:source:ex01 -->

```js title="examples/01_nba_scoreboard_to_table.mjs"
// 01 — NBA scoreboard → a tidy games table.
//
// Shows: the one pattern to learn, `{ parsed: true }`. The raw ESPN scoreboard
// nests each game under events[].competitions[0].competitors[]; the parsed call
// gives one flat row per game (home_*/away_* columns), ready for a table.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
// Offline fixture: test/fixtures/espn/scoreboard_nba.json (SDV_LIVE=1 for today's board).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

// Raw: the provider's exact payload.
const raw = await sdv.nba.espnNbaScoreboard({});
console.log(`raw payload: ${raw.events.length} events, top-level keys = ${Object.keys(raw).join(', ')}`);

// Parsed: one row per game, snake_case, flat.
const games = await sdv.nba.espnNbaScoreboard({ parsed: true });
printTable(
  games,
  ['game_id', 'short_name', 'status_type_detail', 'home_abbreviation', 'home_score', 'away_abbreviation', 'away_score'],
  10,
  'Games (parsed scoreboard)'
);

// A derived table: margin of victory for finished games, biggest first.
const finals = games
  .filter((g) => g.status_type_completed)
  .map((g) => ({
    short_name: g.short_name,
    winner: Number(g.home_score) > Number(g.away_score) ? g.home_abbreviation : g.away_abbreviation,
    margin: Math.abs(Number(g.home_score) - Number(g.away_score)),
    venue: g.venue_full_name,
  }))
  .sort((a, b) => b.margin - a.margin);
printTable(finals, ['short_name', 'winner', 'margin', 'venue'], 5, 'Biggest margins');
```

<!-- /inject -->

<OpenInStackBlitz src="examples/01_nba_scoreboard_to_table.mjs" title="From scoreboard to a table" />

## Output

<!-- inject:example:ex01 -->

Output of `node examples/01_nba_scoreboard_to_table.mjs` (offline, against the committed fixtures):

```text
raw payload: 10 events, top-level keys = leagues, events, provider

## Games (parsed scoreboard)
| game_id   | short_name | status_type_detail | home_abbreviation | home_score | away_abbreviation | away_score |
| --------- | ---------- | ------------------ | ----------------- | ---------- | ----------------- | ---------- |
| 401704871 | ORL @ BKN  | Final              | BKN               | 92         | ORL               | 100        |
| 401704872 | IND @ MEM  | Final              | MEM               | 136        | IND               | 121        |
| 401704873 | BOS @ CLE  | Final              | CLE               | 115        | BOS               | 111        |
| 401704874 | NO @ NY    | Final              | NY                | 118        | NO                | 85         |
| 401704875 | MIA @ TOR  | Final              | TOR               | 119        | MIA               | 116        |
| 401704876 | OKC @ HOU  | Final              | HOU               | 119        | OKC               | 116        |
| 401704877 | LAL @ UTAH | Final              | UTAH              | 104        | LAL               | 105        |
| 401704878 | DAL @ POR  | Final              | POR               | 131        | DAL               | 137        |
| 401704879 | SA @ SAC   | Final              | SAC               | 125        | SA                | 127        |
| 401704880 | DEN @ LAC  | Final              | LAC               | 126        | DEN               | 122        |
(10 rows, all shown)

## Biggest margins
| short_name | winner | margin | venue                 |
| ---------- | ------ | ------ | --------------------- |
| NO @ NY    | NY     | 33     | Madison Square Garden |
| IND @ MEM  | MEM    | 15     | FedExForum            |
| ORL @ BKN  | ORL    | 8      | Barclays Center       |
| DAL @ POR  | DAL    | 6      | Moda Center           |
| BOS @ CLE  | CLE    | 4      | Rocket Arena          |
(10 rows, first 5 shown)
```

<!-- /inject -->

## Drilling into one game

Take a `game_id` from the table and pull the full game summary — box score,
plays, win probability, leaders — with the `summary` dispatcher, which takes a
`section` to return one of its 21 sub-frames:

```js
const teamBox = await sdv.nba.espnNbaSummary({ event_id: games[0].game_id, parsed: true, section: "boxscore_team" });
const leaders = await sdv.nba.espnNbaSummary({ event_id: games[0].game_id, parsed: true, section: "leaders" });
```

The [NBA play-by-play tutorial](./nba-pbp-shots) does exactly that with the
`plays` section.

## Tips

- **Inspect before you parse.** Payloads vary by sport and game state; log a
  sample (or use the [playground](/playground)) before writing extractors.
- **Keep concurrency low.** ESPN's core endpoints rate-limit aggressive
  callers; sequential calls or small batches are safest when you fan out
  across a season.
- **Cache during development.** The examples do this by construction — they
  run against committed fixtures and only hit the network with `SDV_LIVE=1`.

## Next steps

- **[NBA play-by-play shots](./nba-pbp-shots)** — the `summary` dispatcher.
- **[Reference](../reference/)** — every endpoint and its parameters, by league.
