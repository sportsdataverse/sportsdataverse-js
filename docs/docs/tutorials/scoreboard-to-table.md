---
title: From scoreboard to a table
sidebar_label: 3. A real analysis
sidebar_position: 3
---

# From scoreboard to a tidy table

Wrappers return **raw ESPN JSON**, which is deeply nested. This tutorial shows the
typical shape of a real task: fetch a payload, pull out the fields you care about,
and drill into a single game. The pattern is the same for any league.

> 💡 Want to see the raw shapes first? Open the
> **[playground](/playground)**, run `scoreboard` and `summary`, and expand the JSON.

## 1. A tidy games table from the scoreboard

ESPN's scoreboard nests each game under `events[].competitions[0].competitors[]`.
Here's a small, defensive extractor:

```js
import sdv from "sportsdataverse";

function tidyGames(board) {
  return (board.events ?? []).map((event) => {
    const comp = event.competitions?.[0] ?? {};
    const competitors = comp.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home") ?? {};
    const away = competitors.find((c) => c.homeAway === "away") ?? {};
    return {
      id: event.id,
      date: event.date,
      status: event.status?.type?.description ?? "",
      home: home.team?.abbreviation ?? home.team?.displayName,
      away: away.team?.abbreviation ?? away.team?.displayName,
      homeScore: Number(home.score ?? 0),
      awayScore: Number(away.score ?? 0),
    };
  });
}

const board = await sdv.nba.espn_nba_scoreboard({});
const games = tidyGames(board);
console.table(games);
```

`console.table` prints a clean grid:

```text
┌─────────┬──────────────┬──────────────┬───────┬───────┬───────────┬───────────┐
│ id      │ status       │ home         │ away  │ homeScore │ awayScore │
├─────────┼──────────────┼──────────────┼───────┼───────────┼───────────┤
│ 4015... │ Final        │ BOS          │ MIA   │ 112       │ 98        │
│ ...     │ ...          │ ...          │ ...   │ ...       │ ...       │
└─────────┴──────────────┴──────────────┴───────┴───────────┴───────────┘
```

Because the extractor only touches `events`, the **exact same function works for
any league** — swap `espn_nba_scoreboard` for `espn_nfl_scoreboard`,
`espn_nhl_scoreboard`, etc.

## 2. Drill into one game

Take an `id` from the table and pull the full game summary (box score, plays, win
probability, leaders, …):

```js
const game = await sdv.nba.espn_nba_summary({ event_id: games[0].id });

// Team box-score totals
for (const team of game.boxscore?.teams ?? []) {
  console.log(team.team?.displayName, team.statistics?.length, "stat groups");
}

// Scoring leaders
for (const cat of game.leaders ?? []) {
  console.log(cat.leaders?.[0]?.displayValue, "-", cat.leaders?.[0]?.athlete?.displayName);
}
```

## 3. Fan out across a season

Combine endpoints: get a team's schedule, then summarize each game. Be a polite
ESPN client — these are public endpoints, so keep concurrency modest.

```js
const schedule = await sdv.nfl.espn_nfl_team_schedule({ team_id: 12, season: 2024 });
const eventIds = (schedule.events ?? []).map((e) => e.id);

const results = [];
for (const id of eventIds) {
  const summary = await sdv.nfl.espn_nfl_summary({ event_id: id });
  const header = summary.header?.competitions?.[0]?.competitors ?? [];
  results.push({
    id,
    teams: header.map((c) => `${c.team?.abbreviation} ${c.score ?? ""}`).join(" vs "),
  });
}
console.table(results);
```

## Tips

- **Inspect before you parse.** ESPN payloads vary by sport and game state; log a
  sample (or use the [playground](/playground)) before writing extractors.
- **Cache during development.** Re-fetching the same game repeatedly is wasteful —
  store the JSON locally while you iterate on your parser.
- **Keep concurrency low.** ESPN's core endpoints rate-limit aggressive callers;
  sequential or small batches are safest.

## Next steps

- **[Reference](../reference/)** — every endpoint and its parameters, by league.
- **[Playground](/playground)** — explore payloads interactively.
- **[API](../api/)** — the typed module surface.
