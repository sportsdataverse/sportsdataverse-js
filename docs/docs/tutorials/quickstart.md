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

const board = await sdv.nba.espnNbaScoreboard({});
console.log(`${board.events?.length ?? 0} NBA games on the board today`);
```

```bash
node demo.js
```

Every wrapper returns the **raw ESPN JSON** as a plain object, so you can navigate
it however you like (or hand it straight to your own parser).

## 3. The one naming rule

Cross-league endpoints are always **`espn<League><Endpoint>`** (camelCase) on the
league's namespace:

```js
await sdv.nba.espnNbaScoreboard({});
await sdv.nfl.espnNflSummary({ event_id: 401671789 });
await sdv.nhl.espnNhlTeamRoster({ team_id: 10 });
```

`<League>` is the namespace (`nba`, `nfl`, `nhl`, `mlb`, `wnba`, `mbb`, `wbb`,
`cfb`, plus soccer/cricket/UFL and more). `<Endpoint>` is the data you want
(`Scoreboard`, `Summary`, `TeamRoster`, `Standings`, …). Every method also has a
snake_case alias (`espn_nfl_summary`) for parity with the Python / R packages.

## 4. Parameters

Pass parameters as a single object. Both **snake_case and camelCase** work:

```js
await sdv.nfl.espnNflTeamSchedule({ team_id: 12, season: 2024 });
await sdv.nfl.espnNflTeamSchedule({ teamId: 12, season: 2024 });  // identical
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
