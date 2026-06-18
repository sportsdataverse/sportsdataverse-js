# HockeyTech / LeagueStat fixtures

No-network captures for the `hockeytech` flat-API parser tests
(`test/parsers/hockeytech.test.js`). All four are **PWHL** responses captured
live from `https://lscluster.hockeytech.com/feed/index.php` on **2026-06-18**,
trimmed to a few rows, and re-wrapped in the `angular.callbacks._0(...)` JSONP
envelope so the tests exercise the runtime's JSONP-strip path.

| File | feed / view | key | shape |
|---|---|---|---|
| `pwhl_seasons.jsonp` | `modulekit` / `seasons` | `446521baf8c38984` | `{SiteKit:{Seasons:[…]}}` |
| `pwhl_scorebar.jsonp` | `modulekit` / `scorebar` | `446521baf8c38984` | `{SiteKit:{Scorebar:[…]}}` |
| `pwhl_pbp.jsonp` | `statviewfeed` / `gameCenterPlayByPlay` | `694cfeed58c932ee` (PWHL PBP override) | top-level `[{event,details}, …]` |
| `pwhl_gamesummary.jsonp` | `gc` / `gamesummary` (via `tab=`) | `446521baf8c38984` | `{GC:{Gamesummary:{…}}}` |

The captured game is PWHL game `ID=74`. The league registry, the `gc`-feed
`tab=` quirk, and the PWHL PBP key override all live in
`src/core/hockeytech_runtime.ts`.
