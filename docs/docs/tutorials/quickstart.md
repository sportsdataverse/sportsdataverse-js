---
title: Quickstart
sidebar_label: 1. Quickstart
sidebar_position: 1
---

# Quickstart

This walks you from an empty folder to your first live ESPN calls in a couple of
minutes.

## 1. Install

`sportsdataverse` is **ESM-only** and needs Node **≥ 20.18.1**.

```bash
mkdir sdv-demo && cd sdv-demo
npm init -y
npm pkg set type=module      # enable ESM imports
npm install sportsdataverse
```

## 2. Your first call

Create `demo.js`:

```js
import sdv from "sportsdataverse";

const board = await sdv.nba.espn_nba_scoreboard({});
console.log(`${board.events?.length ?? 0} NBA games on the board today`);
```

```bash
node demo.js
```

Every wrapper returns the **raw ESPN JSON** as a plain object, so you can navigate
it however you like (or hand it straight to your own parser).

## 3. The one naming rule

Cross-league endpoints are always **`espn_<league>_<endpoint>`** on the league's
namespace:

```js
await sdv.nba.espn_nba_scoreboard({});
await sdv.nfl.espn_nfl_summary({ event_id: 401671789 });
await sdv.nhl.espn_nhl_team_roster({ team_id: 10 });
```

`<league>` is the namespace (`nba`, `nfl`, `nhl`, `mlb`, `wnba`, `mbb`, `wbb`,
`cfb`, plus soccer/cricket/UFL and more). `<endpoint>` is the data you want
(`scoreboard`, `summary`, `team_roster`, `standings`, …).

## 4. Parameters

Pass parameters as a single object. Both **snake_case and camelCase** work:

```js
await sdv.nfl.espn_nfl_team_schedule({ team_id: 12, season: 2024 });
await sdv.nfl.espn_nfl_team_schedule({ teamId: 12, season: 2024 });  // identical
```

Required path parameters (like `team_id` above) throw a clear error if missing;
optional query parameters are simply omitted when you don't pass them.

## 5. Legacy methods still work

If you used `sportsdataverse` before v3.0.0, your code keeps working — the legacy
convenience methods are merged alongside the new wrappers:

```js
const pbp = await sdv.nba.getPlayByPlay(401584793);
const box = await sdv.cfb.getBoxScore(401628319);
```

## Next steps

- **[The cross-league surface](./cross-league)** — one API across 29 leagues.
- **[From scoreboard to a table](./scoreboard-to-table)** — a real analysis.
- **[Playground](/playground)** — try any endpoint live in your browser.
- **[Reference](../reference/)** — every wrapper, by league.
