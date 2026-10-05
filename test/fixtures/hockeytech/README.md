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

## Added 2026-10-05 (sdv-js T5)

Live PWHL captures (trimmed, JSONP re-wrapped): `pwhl_searchplayers.jsonp`
(`modulekit/searchplayers`, term Poulin), `pwhl_statviewtype.jsonp`
(`statviewtype` skaters, season_id 8), `pwhl_transactions.jsonp`,
`pwhl_brackets.jsonp` (season_id 9, 2026 playoffs), `pwhl_player_gamebygame.jsonp`
(player 36, season_id 7). Positive control for game log: player 12 / season 8 returns 30 games.

## Added 2026-10-05 (sdv-js JS-1, error sentinels)

Two real HTTP-200 error bodies, copied from sdv-internal-refs
`hockeytech/captures/samples/pwhl/{streaks,svf_streaks}.json` (captured live 2026-07-12,
internal-refs commit b78eb2c; stored pretty-printed, wire form was compact):
`pwhl_streaks_undefined_tab.json` (`modulekit` / `streaks` →
`{"SiteKit": {..., "Undefined": "Undefined Tab streaks"}}`) and
`pwhl_svf_streaks_invalidview.json` (`statviewfeed` / `streaks` →
`{"error": "InvalidView error: streaks"}`). The access-denied plain-text reply is
`analytics/live-2026-10-05/mjhl_summary_7301.txt`.

## Added 2026-10-05 (sdv-js JS-9, season names and season resolution)

`seasons/<league>.json`: the `modulekit` / `seasons` reply of all 20 leagues, used by
`test/parsers/hockeytech_seasons.test.js` (a port of sdv-py's
`tests/hockeytech/test_season_names.py`). Each file is a byte copy of sdv-py's
`tests/fixtures/hockeytech/<league>_seasons.json` at sdv-py 23e223d35c (#694): 18 untrimmed
live replies taken 2026-10-05 with `hockeytech_api(lg, "modulekit", "seasons", {})`, AHL
trimmed from the 2026-07-12 sdv-internal-refs capture, and PWHL as committed 2026-06-09
(ids 1-10, ending at the "2026-27 Pre-Season", a real preseason-before-regular window). The
`key` in `Parameters` is `REDACTED` in all 20. Sharing the files lets the JS and py outputs be
compared cell for cell.
