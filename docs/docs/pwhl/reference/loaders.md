---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 1
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.pwhl` — dataset loaders

21 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadPhfPbp`](#loadphfpbp) | [phf_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_pbp) | 2016+ |
| [`loadPhfPlayerBoxscores`](#loadphfplayerboxscores) | [phf_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_player_boxscores) | 2016+ |
| [`loadPhfSchedules`](#loadphfschedules) | [phf_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_schedules) | 2016+ |
| [`loadPhfTeamBoxscores`](#loadphfteamboxscores) | [phf_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_team_boxscores) | 2016+ |
| [`loadPwhlGameInfo`](#loadpwhlgameinfo) | [pwhl_game_info](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_game_info) | 2024+ |
| [`loadPwhlGameRosters`](#loadpwhlgamerosters) | [pwhl_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_game_rosters) | 2024+ |
| [`loadPwhlShifts`](#loadpwhlshifts) | [pwhl_shifts](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shifts) | 2024+ |
| [`loadPwhlGoalieBoxscores`](#loadpwhlgoalieboxscores) | [pwhl_goalie_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_goalie_boxscores) | 2024+ |
| [`loadPwhlOfficials`](#loadpwhlofficials) | [pwhl_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_officials) | 2024+ |
| [`loadPwhlPbp`](#loadpwhlpbp) | [pwhl_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_pbp) | 2024+ |
| [`loadPwhlXgPbp`](#loadpwhlxgpbp) | [pwhl_xg_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_xg_pbp) | 2024+ |
| [`loadPwhlPenaltySummary`](#loadpwhlpenaltysummary) | [pwhl_penalty_summary](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_penalty_summary) | 2024+ |
| [`loadPwhlPlayerBoxscores`](#loadpwhlplayerboxscores) | [pwhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_player_boxscores) | 2024+ |
| [`loadPwhlRosters`](#loadpwhlrosters) | [pwhl_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_rosters) | 2024+ |
| [`loadPwhlSchedules`](#loadpwhlschedules) | [pwhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_schedules) | 2024+ |
| [`loadPwhlScoringSummary`](#loadpwhlscoringsummary) | [pwhl_scoring_summary](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_scoring_summary) | 2024+ |
| [`loadPwhlShootout`](#loadpwhlshootout) | [pwhl_shootout](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shootout) | 2026+ |
| [`loadPwhlShotsByPeriod`](#loadpwhlshotsbyperiod) | [pwhl_shots_by_period](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shots_by_period) | 2024+ |
| [`loadPwhlSkaterBoxscores`](#loadpwhlskaterboxscores) | [pwhl_skater_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_skater_boxscores) | 2024+ |
| [`loadPwhlTeamBoxscores`](#loadpwhlteamboxscores) | [pwhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_team_boxscores) | 2024+ |
| [`loadPwhlThreeStars`](#loadpwhlthreestars) | [pwhl_three_stars](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_three_stars) | 2024+ |

## `loadPhfPbp`

Release: [phf_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/phf_pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPhfPbp({ seasons: 2023, columns: ['game_id', 'period_id', 'play_type', 'play_description'] });
// snake_case alias (py/R parity): sdv.pwhl.load_phf_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPhfPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `play_type` | `string` |  |
| `team` | `string` | Team name. |
| `time` | `string` | Game clock at infraction (MM:SS). |
| `play_description` | `string` | Free-text description of the play as published by the league. |
| `period_id` | `string` | Period identifier. |
| `game_id` | `string` | Unique game identifier. |
| `game_date` | `string` | Game date. |
| `home_team` | `string` | Home team name. |
| `home_location` | `string` | Home team city. |
| `home_nickname` | `string` | Nickname of the home team. |
| `home_abbreviation` | `string` | Home team abbreviation. |
| `home_score_total` | `number` | Home team's cumulative score after the play. |
| `away_team` | `string` | Away team name. |
| `away_location` | `string` | Away team city. |
| `away_nickname` | `string` | Nickname of the away team. |
| `away_abbreviation` | `string` | Away team abbreviation. |
| `away_score_total` | `number` | Away team's cumulative score after the play. |
| `away_goalie` | `string` | Name of the away goalie on the ice. |
| `away_goalie_jersey` | `string` | Jersey number of the away goaltender on the ice. |
| `goalie_change` | `string` | True when the play records a goaltender change. |
| `penalty` | `number` |  |
| `on_ice_situation` | `string` | Strength situation on the ice for the play (e.g. even strength, power play). |
| `score` | `string` | Final score string. |
| `minute_start` | `number` | Minute mark of the period when the event started. |
| `second_start` | `number` | Second mark of the period when the event started. |
| `clock` | `string` | Game clock time remaining (MM:SS). |
| `leader` | `string` | Team leading the game at this point in the play sequence. |
| `away_goals` | `string` | Away goals in the period. |
| `home_goals` | `string` | Home goals in the period. |
| `sec_from_start` | `number` | Seconds elapsed since the start of the game. |
| `power_play_seconds` | `number` | Elapsed seconds of the power play at this play. |
| `time_elapsed` | `string` |  |
| `time_remaining` | `string` |  |
| `player_name_1` | `string` | Name of the player in slot 1 of the play's participant list. |
| `player_jersey_1` | `string` | Jersey number of the player in slot 1 of the play's participant list. |
| `home_skaters` | `number` | Number of home skaters on the ice. |
| `away_skaters` | `number` | Number of away skaters on the ice. |
| `home_goalie` | `string` | Name of the home goalie on the ice. |
| `home_goalie_jersey` | `string` | Jersey number of the home goaltender on the ice. |
| `player_name_2` | `string` | Name of the player in slot 2 of the play's participant list. |
| `player_jersey_2` | `string` | Jersey number of the player in slot 2 of the play's participant list. |
| `shot_result` | `string` |  |
| `goalie_involved` | `string` | Name of the goaltender involved in the play. |
| `penalty_type` | `string` |  |
| `penalty_level` | `string` | Severity classification of the penalty (e.g. minor, major). |
| `penalty_length` | `string` | Penalty length in minutes. |
| `start_power_play` | `number` | True on the play where a power play begins. |
| `end_power_play` | `number` | True on the play where a power play ends. |
| `player_name_3` | `string` | Name of the player in slot 3 of the play's participant list. |
| `player_jersey_3` | `string` | Jersey number of the player in slot 3 of the play's participant list. |
| `scoring_team_abbrev` | `string` | Abbreviation of the team credited with the goal. |
| `scoring_team_on_ice` | `string` | Skaters the scoring team had on the ice for the goal. |
| `offensive_player_name_1` | `string` | Name of the attacking team's skater in on-ice slot 1 for the play. |
| `offensive_player_name_2` | `string` | Name of the attacking team's skater in on-ice slot 2 for the play. |
| `offensive_player_name_3` | `string` | Name of the attacking team's skater in on-ice slot 3 for the play. |
| `offensive_player_name_4` | `string` | Name of the attacking team's skater in on-ice slot 4 for the play. |
| `offensive_player_name_5` | `string` | Name of the attacking team's skater in on-ice slot 5 for the play. |
| `defending_team_abbrev` | `string` | Abbreviation of the team defending on the play. |
| `offensive_player_jersey_1` | `string` | Jersey number of the attacking team's skater in on-ice slot 1 for the play. |
| `offensive_player_jersey_2` | `string` | Jersey number of the attacking team's skater in on-ice slot 2 for the play. |
| `offensive_player_jersey_3` | `string` | Jersey number of the attacking team's skater in on-ice slot 3 for the play. |
| `offensive_player_jersey_4` | `string` | Jersey number of the attacking team's skater in on-ice slot 4 for the play. |
| `offensive_player_jersey_5` | `string` | Jersey number of the attacking team's skater in on-ice slot 5 for the play. |
| `defending_team_on_ice` | `string` | Skaters the defending team had on the ice for the play. |
| `defensive_player_name_1` | `string` | Name of the defending team's skater in on-ice slot 1 for the play. |
| `defensive_player_name_2` | `string` | Name of the defending team's skater in on-ice slot 2 for the play. |
| `defensive_player_name_3` | `string` | Name of the defending team's skater in on-ice slot 3 for the play. |
| `defensive_player_name_4` | `string` | Name of the defending team's skater in on-ice slot 4 for the play. |
| `defensive_player_name_5` | `string` | Name of the defending team's skater in on-ice slot 5 for the play. |
| `defensive_player_jersey_1` | `string` | Jersey number of the defending team's skater in on-ice slot 1 for the play. |
| `defensive_player_jersey_2` | `string` | Jersey number of the defending team's skater in on-ice slot 2 for the play. |
| `defensive_player_jersey_3` | `string` | Jersey number of the defending team's skater in on-ice slot 3 for the play. |
| `defensive_player_jersey_4` | `string` | Jersey number of the defending team's skater in on-ice slot 4 for the play. |
| `defensive_player_jersey_5` | `string` | Jersey number of the defending team's skater in on-ice slot 5 for the play. |
| `defensive_player_name_6` | `string` | Name of the defending team's skater in on-ice slot 6 for the play. |
| `defensive_player_jersey_6` | `string` | Jersey number of the defending team's skater in on-ice slot 6 for the play. |
| `offensive_player_name_6` | `string` | Name of the attacking team's skater in on-ice slot 6 for the play. |
| `offensive_player_jersey_6` | `string` | Jersey number of the attacking team's skater in on-ice slot 6 for the play. |
| `season` | `number` | Season year (echoed from arg). |

## `loadPhfPlayerBoxscores`

Release: [phf_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/phf_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPhfPlayerBoxscores({ seasons: 2023 });
// snake_case alias (py/R parity): sdv.pwhl.load_phf_player_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPhfPlayerBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_jersey` | `number` | Player's jersey number. |
| `player_name` | `string` | Player name. |
| `position` | `string` | Player position. |
| `goals` | `number` | Goals scored. |
| `assists` | `number` | Assists. |
| `points` | `number` | Total points (goals + assists). |
| `penalty_minutes` | `number` | Penalty minutes. |
| `plus_minus` | `number` | Plus/minus rating. |
| `shots_on_goal` | `number` | Shots on goal. |
| `blocks` | `number` |  |
| `giveaways` | `number` | Giveaways. |
| `takeaways` | `number` | Takeaways. |
| `faceoffs_won_lost` | `string` | Faceoffs won and lost, as the league's combined won-lost string. |
| `faceoffs_win_pct` | `number` | Share of the player's faceoffs won. |
| `powerplay_goals` | `number` | Goals the player scored on the power play. |
| `shorthanded_goals` | `number` | Shorthanded goals. |
| `shots` | `number` | Shots on goal. |
| `shots_blocked` | `number` | Shots the player blocked. |
| `faceoffs_won` | `number` | Faceoffs won in the season. |
| `faceoffs_lost` | `number` | Faceoffs lost in the season. |
| `team` | `string` | Team name. |
| `skaters_href` | `string` | Relative link to the league's skater table for this game. |
| `player_id` | `string` | Unique player identifier. |
| `game_id` | `string` | Unique game identifier. |
| `minutes_played` | `string` | Minutes played. |
| `shots_against` | `number` | Shots faced. |
| `goals_against` | `number` | Goals against. |
| `saves` | `number` | Saves made. |
| `save_percent` | `number` | Share of shots faced that the goaltender saved. |
| `goalies_href` | `string` | Relative link to the league's goaltender table for this game. |
| `season` | `number` | Season year (echoed from arg). |

## `loadPhfSchedules`

Release: [phf_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/phf_schedules/phf_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPhfSchedules({ seasons: 2023 });
// snake_case alias (py/R parity): sdv.pwhl.load_phf_schedules(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPhfSchedulesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `type` | `string` | Competitor type (e.g. "team"). |
| `id` | `string` | Unique player identifier. |
| `league_id` | `string` | League identifier of the team. |
| `season_id` | `string` | Season identifier. |
| `tournament_id` | `boolean` | ESPN tournament id parsed from the `$ref` URL. |
| `game_id` | `string` | Unique game identifier. |
| `number` | `number` | Week number as returned by the API. |
| `datetime` | `Date` | Scheduled start of the game as a timestamp. |
| `datetime_tz` | `Date` | Scheduled start of the game including its time-zone offset. |
| `time_zone` | `string` | Time zone in which the game is played. |
| `time_zone_abbr` | `string` | Abbreviated form of the game's time zone. |
| `updated_at` | `Date` | Timestamp at which the league last updated the game record. |
| `created_at` | `Date` | Timestamp at which the league created the game record. |
| `home_team_id` | `string` | Home team identifier. |
| `home_team` | `string` | Home team name. |
| `home_team_short` | `string` | Short display name of the home team. |
| `home_team_logo_url_full` | `string` | URL of the home team's logo at the full rendition. |
| `home_team_logo_url_small` | `string` | URL of the home team's logo at the small rendition. |
| `home_team_logo_url_medium` | `string` | URL of the home team's logo at the medium rendition. |
| `home_team_logo_url_large` | `string` | URL of the home team's logo at the large rendition. |
| `home_team_logo_url_50` | `string` | URL of the home team's logo at the 50px rendition. |
| `home_team_logo_url_100` | `string` | URL of the home team's logo at the 100px rendition. |
| `home_team_logo_url_200` | `string` | URL of the home team's logo at the 200px rendition. |
| `away_team_id` | `string` | Away team identifier. |
| `away_team` | `string` | Away team name. |
| `away_team_short` | `string` | Short display name of the away team. |
| `away_team_logo_url_full` | `string` | URL of the away team's logo at the full rendition. |
| `away_team_logo_url_small` | `string` | URL of the away team's logo at the small rendition. |
| `away_team_logo_url_medium` | `string` | URL of the away team's logo at the medium rendition. |
| `away_team_logo_url_large` | `string` | URL of the away team's logo at the large rendition. |
| `away_team_logo_url_50` | `string` | URL of the away team's logo at the 50px rendition. |
| `away_team_logo_url_100` | `string` | URL of the away team's logo at the 100px rendition. |
| `away_team_logo_url_200` | `string` | URL of the away team's logo at the 200px rendition. |
| `home_division_id` | `string` | League identifier for the home team's division. |
| `home_division` | `string` | Home team division. |
| `away_division_id` | `string` | League identifier for the away team's division. |
| `away_division` | `string` |  |
| `home_score` | `number` | Home team final score. |
| `away_score` | `number` | Away team final score. |
| `home_shots` | `number` | Home team shots in the period. |
| `away_shots` | `number` | Away team shots in the period. |
| `home_penalty_minutes` | `number` | Penalty minutes assessed to the home team. |
| `away_penalty_minutes` | `number` | Penalty minutes assessed to the away team. |
| `home_roster_count` | `number` | Number of players dressed for the home team. |
| `away_roster_count` | `number` | Number of players dressed for the away team. |
| `facility_id` | `string` | League identifier for the hosting facility. |
| `facility` | `string` | Name of the facility hosting the game. |
| `facility_address` | `string` | Street address of the hosting facility. |
| `rink_id` | `boolean` | League identifier for the rink. |
| `rink` | `boolean` | Name of the rink within the facility. |
| `game_type` | `string` | Game type the row belongs to. |
| `notes` | `string` | Notes flag for the pick. |
| `status` | `string` | Status string (e.g. captain markers). |
| `overtime` | `boolean` |  |
| `shootout` | `boolean` | Whether shootout data is available. |
| `allow_players` | `boolean` | League flag for whether player-level detail is published for the game. |
| `tickets_url` | `string` | Link to purchase tickets for the game. |
| `watch_live_url` | `string` | Link to the live broadcast of the game. |
| `external_url` | `boolean` | League-published external link for the game. |
| `has_play_by_play` | `boolean` | True when a play-by-play feed exists for the game. |
| `highlight_color` | `boolean` | Display colour the league uses for the game in its schedule UI. |
| `attendance` | `number` | Game attendance. |
| `date_group` | `Date` | League grouping key for the game's date, used to bucket a slate. |
| `winner` | `string` | Whether this competitor won the game. |
| `season` | `number` | Season year (echoed from arg). |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `team_box` | `boolean` | Whether team box score data is available. |
| `player_box` | `boolean` | Whether player box score data is available. |

## `loadPhfTeamBoxscores`

Release: [phf_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/phf_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/phf_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPhfTeamBoxscores({ seasons: 2023 });
// snake_case alias (py/R parity): sdv.pwhl.load_phf_team_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPhfTeamBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team` | `string` | Team name. |
| `game_id` | `string` | Unique game identifier. |
| `winner` | `boolean` | Whether this competitor won the game. |
| `total_scoring` | `number` | Goals the team scored in the game. |
| `successful_power_play` | `number` | Number of power plays on which the team scored. |
| `power_play_opportunities` | `number` | Power play opportunities. |
| `power_play_percent` | `number` | Share of the team's power plays that produced a goal. |
| `penalty_minutes` | `number` | Penalty minutes. |
| `faceoff_percent` | `number` | Faceoff win percentage. |
| `blocked_opponent_shots` | `number` | Opponent shots the team blocked. |
| `takeaways` | `number` | Takeaways. |
| `giveaways` | `number` | Giveaways. |
| `period_1_shots` | `number` | Shots the team took in period 1. |
| `period_2_shots` | `number` | Shots the team took in period 2. |
| `period_3_shots` | `number` | Shots the team took in period 3. |
| `overtime_shots` | `number` | Shots the team took in overtime. |
| `shootout_made_shots` | `number` | Shootout shots the team took that scored. |
| `shootout_missed_shots` | `number` | Shootout shots the team took that did not score. |
| `total_shots` | `number` | Shots the team took in the game. |
| `period_1_scoring` | `number` | Goals the team scored in period 1. |
| `period_2_scoring` | `number` | Goals the team scored in period 2. |
| `period_3_scoring` | `number` | Goals the team scored in period 3. |
| `overtime_scoring` | `number` | Goals the team scored in overtime. |
| `shootout_made_scoring` | `number` | Shootout attempts the team converted. |
| `shootout_missed_scoring` | `number` | Shootout attempts the team failed to convert. |
| `season` | `number` | Season year (echoed from arg). |

## `loadPwhlGameInfo`

Release: [pwhl_game_info](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_game_info) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_game_info/game_info_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlGameInfo({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_game_info(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlGameInfoRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `game_number` | `string` | Game number within the schedule. |
| `game_date` | `string` | Game date. |
| `game_date_iso` | `string` | ISO-8601 game start datetime. |
| `start_time` | `string` | Shift start time (MM:SS countdown clock). |
| `end_time` | `string` | Shift end time (MM:SS countdown clock). |
| `game_duration` | `string` | Game length (H:MM). |
| `game_venue` | `string` | Venue where the game was played. |
| `attendance` | `number \| bigint` | Game attendance. |
| `game_status` | `string` | Game status text. |
| `game_season_id` | `string` | HockeyTech season identifier. |
| `started` | `number \| bigint` | Flag for whether the game has started. |
| `final` | `number \| bigint` | Flag for whether the game is final. |
| `home_team_id` | `string` | Home team identifier. |
| `home_team` | `string` | Home team name. |
| `home_team_abbr` | `string` | Home team abbreviation. |
| `home_score` | `number \| bigint` | Home team final score. |
| `away_team_id` | `string` | Away team identifier. |
| `away_team` | `string` | Away team name. |
| `away_team_abbr` | `string` | Away team abbreviation. |
| `away_score` | `number \| bigint` | Away team final score. |
| `has_shootout` | `number \| bigint` | Flag for whether the game went to shootout. |
| `game_report_url` | `string` | URL to the game report. |
| `boxscore_url` | `string` | URL to the boxscore. |

## `loadPwhlGameRosters`

Release: [pwhl_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlGameRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlGameRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `team_side` | `string` | Home or away indicator. |
| `player_type` | `string` | Player type (skater or goalie). |
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `jersey_number` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `birth_date` | `string` | Player birth date. |
| `starting` | `number \| bigint` | Whether the player started the game. |
| `status` | `string` | Status string (e.g. captain markers). |

## `loadPwhlShifts`

Release: [pwhl_shifts](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shifts) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_shifts/shifts_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlShifts({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_shifts(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlShiftsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `jersey_number` | `string` | Jersey number. |
| `home` | `number \| bigint` | Whether the player's team was home. |
| `period` | `number \| bigint` | Period number. |
| `start_time` | `string` | Shift start time (MM:SS countdown clock). |
| `end_time` | `string` | Shift end time (MM:SS countdown clock). |
| `length` | `string` | Length of the streak in games. |
| `start_s` | `number \| bigint` | Shift start in countdown seconds. |
| `end_s` | `number \| bigint` | Shift end in countdown seconds. |
| `goal_on_shift` | `number \| bigint` | 1 if a goal occurred during this shift, else 0. |
| `penalty_on_shift` | `number \| bigint` | 1 if a penalty occurred during this shift, else 0. |

## `loadPwhlGoalieBoxscores`

Release: [pwhl_goalie_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_goalie_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_goalie_boxscores/goalie_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlGoalieBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_goalie_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlGoalieBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `position` | `string` | Player position. |
| `team_id` | `string` | Unique team identifier. |
| `game_id` | `string` | Unique game identifier. |
| `league` | `string` | League code. |
| `toi` | `string` | Time on ice. |
| `time_on_ice` | `number` | Time on ice in seconds. |
| `saves` | `number \| bigint` | Saves made. |
| `goals_against` | `number \| bigint` | Goals against. |
| `shots_against` | `number \| bigint` | Shots faced. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `faceoff_attempts` | `number \| bigint` | Faceoff attempts. |
| `faceoff_wins` | `number \| bigint` | Faceoff wins. |
| `faceoff_losses` | `number \| bigint` | Faceoff losses. |
| `faceoff_pct` | `unknown` | Faceoff win percentage. |
| `starting` | `number \| bigint` | Whether the player started the game. |

## `loadPwhlOfficials`

Release: [pwhl_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlOfficials({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `role` | `string` | Grouped official role (Referee/Linesperson). |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `jersey_number` | `number \| bigint` | Jersey number. |
| `official_role` | `string` | Official's specific role. |

## `loadPwhlPbp`

Release: [pwhl_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlPbp({ seasons: 2024, columns: ['game_id', 'period_of_game', 'event', 'event_type', 'strength_state'] });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `event` | `string` | Event description label. |
| `team_id` | `string` | Unique team identifier. |
| `period_of_game` | `string` | Period in which the event occurred. |
| `time_of_period` | `string` | Elapsed time within the period (MM:SS). |
| `x_coord` | `number` | Transformed x-coordinate of the event (feet scale). |
| `y_coord` | `number` | Transformed y-coordinate of the event (feet scale). |
| `player_id` | `string` | Unique player identifier. |
| `player_name_first` | `string` | Primary player first name. |
| `player_name_last` | `string` | Primary player last name. |
| `player_position` | `string` | Primary player position. |
| `goal` | `boolean` | Flag for whether the event was a goal. |
| `goalie_id` | `string` | Goalie identifier on the play. |
| `goalie_first` | `string` | Goalie first name. |
| `goalie_last` | `string` | Goalie last name. |
| `home_win` | `string` | Whether the home player won the faceoff. |
| `player_team_id` | `string` | Unique team identifier of the primary player. |
| `event_type` | `string` | Standardized event type code. |
| `shot_quality` | `string` | Shot quality descriptor. |
| `empty_net` | `string` | Whether the net was empty. |
| `game_winner` | `string` | Whether the goal was the game-winning goal. |
| `penalty_shot` | `string` | Whether the goal came on a penalty shot. |
| `insurance` | `string` | Whether the goal was an insurance goal. |
| `short_handed` | `string` | Whether the event occurred while short-handed. |
| `power_play` | `string` | Whether the event occurred on a power play. |
| `player_two_id` | `string` | Second player's unique identifier. |
| `player_two_name_first` | `string` | Second player first name. |
| `player_two_name_last` | `string` | Second player last name. |
| `player_two_position` | `string` | Second player position. |
| `player_three_id` | `string` | Third player's unique identifier. |
| `player_three_name_first` | `string` | Third player first name. |
| `player_three_name_last` | `string` | Third player last name. |
| `player_three_position` | `string` | Third player position. |
| `plus_player_one_id` | `string` | On-ice plus player one unique identifier. |
| `plus_player_one_first` | `string` | On-ice plus player one first name. |
| `plus_player_one_last` | `string` | On-ice plus player one last name. |
| `plus_player_one_position` | `string` | On-ice plus player one position. |
| `plus_player_two_id` | `string` | On-ice plus player two unique identifier. |
| `plus_player_two_first` | `string` | On-ice plus player two first name. |
| `plus_player_two_last` | `string` | On-ice plus player two last name. |
| `plus_player_two_position` | `string` | On-ice plus player two position. |
| `plus_player_three_id` | `string` | On-ice plus player three unique identifier. |
| `plus_player_three_first` | `string` | On-ice plus player three first name. |
| `plus_player_three_last` | `string` | On-ice plus player three last name. |
| `plus_player_three_position` | `string` | On-ice plus player three position. |
| `plus_player_four_id` | `string` | On-ice plus player four unique identifier. |
| `plus_player_four_first` | `string` | On-ice plus player four first name. |
| `plus_player_four_last` | `string` | On-ice plus player four last name. |
| `plus_player_four_position` | `string` | On-ice plus player four position. |
| `plus_player_five_id` | `string` | On-ice plus player five unique identifier. |
| `plus_player_five_first` | `string` | On-ice plus player five first name. |
| `plus_player_five_last` | `string` | On-ice plus player five last name. |
| `plus_player_five_position` | `string` | On-ice plus player five position. |
| `minus_player_one_id` | `string` | On-ice minus player one unique identifier. |
| `minus_player_one_first` | `string` | On-ice minus player one first name. |
| `minus_player_one_last` | `string` | On-ice minus player one last name. |
| `minus_player_one_position` | `string` | On-ice minus player one position. |
| `minus_player_two_id` | `string` | On-ice minus player two unique identifier. |
| `minus_player_two_first` | `string` | On-ice minus player two first name. |
| `minus_player_two_last` | `string` | On-ice minus player two last name. |
| `minus_player_two_position` | `string` | On-ice minus player two position. |
| `minus_player_three_id` | `string` | On-ice minus player three unique identifier. |
| `minus_player_three_first` | `string` | On-ice minus player three first name. |
| `minus_player_three_last` | `string` | On-ice minus player three last name. |
| `minus_player_three_position` | `string` | On-ice minus player three position. |
| `minus_player_four_id` | `string` | On-ice minus player four unique identifier. |
| `minus_player_four_first` | `string` | On-ice minus player four first name. |
| `minus_player_four_last` | `string` | On-ice minus player four last name. |
| `minus_player_four_position` | `string` | On-ice minus player four position. |
| `minus_player_five_id` | `string` | On-ice minus player five unique identifier. |
| `minus_player_five_first` | `string` | On-ice minus player five first name. |
| `minus_player_five_last` | `string` | On-ice minus player five last name. |
| `minus_player_five_position` | `string` | On-ice minus player five position. |
| `penalty_length` | `string` | Penalty length in minutes. |
| `game_date` | `string` | Game date. |
| `game_season` | `number \| bigint` | Season (concluding year, YYYY). |
| `game_season_id` | `string` | HockeyTech season identifier. |
| `home_team` | `string` | Home team name. |
| `home_team_id` | `string` | Home team identifier. |
| `away_team` | `string` | Away team name. |
| `away_team_id` | `string` | Away team identifier. |
| `x_coord_original` | `number \| bigint` | Original raw x-coordinate from the feed. |
| `y_coord_original` | `number \| bigint` | Original raw y-coordinate from the feed. |
| `x_coord_neutral` | `number \| bigint` | Neutral-zone-centered x-coordinate. |
| `y_coord_neutral` | `number \| bigint` | Neutral-zone-centered y-coordinate. |
| `x_coord_fixed` | `number` | Fixed-orientation x-coordinate. |
| `y_coord_fixed` | `number` | Fixed-orientation y-coordinate. |
| `x_coord_right` | `number` | Right-orientation x-coordinate. |
| `y_coord_right` | `number` | Right-orientation y-coordinate. |
| `x_coord_vertical` | `number` | Vertical-orientation x-coordinate. |
| `y_coord_vertical` | `number` | Vertical-orientation y-coordinate. |
| `minute_start` | `number \| bigint` | Minute mark of the period when the event started. |
| `second_start` | `number \| bigint` | Second mark of the period when the event started. |
| `clock` | `string` | Game clock time remaining (MM:SS). |
| `sec_from_start` | `number \| bigint` | Seconds elapsed since the start of the game. |
| `shot_distance` | `number` | Distance of the shot from the net. |
| `shot_angle` | `number` | Angle of the shot relative to the net. |
| `scoring_chance` | `boolean` | TRUE when event is a shot-type within 25 ft of the net. |
| `on_ice_home` | `string` | Comma-joined sorted player_ids on ice for the home team. |
| `on_ice_away` | `string` | Comma-joined sorted player_ids on ice for the away team. |
| `skaters_home` | `number \| bigint` | Number of home skaters on the ice for the event, derived from HockeyTech shift data. |
| `skaters_away` | `number \| bigint` | Number of away skaters on the ice for the event, derived from HockeyTech shift data. |
| `strength_state` | `string` | Skater-strength state formatted home-first as skaters_home v skaters_away (5v4 = home has the extra skater), derived from shift data. |
| `strength_state_valid` | `boolean` | True when both shift-derived skater counts are between 3 and 6 inclusive; false when a count falls outside that range; null when a count is unavailable. |

## `loadPwhlXgPbp`

Release: [pwhl_xg_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_xg_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_xg_pbp/pwhl_xg_pbp_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlXgPbp({ seasons: 2025, columns: ['game_id', 'period_of_game', 'sec_from_start', 'event_type'] });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_xg_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlXgPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `game_season` | `number` | Season (concluding year, YYYY). |
| `game_date` | `string` | Game date. |
| `team_id` | `string` | Unique team identifier. |
| `player_id` | `string` | Unique player identifier. |
| `goalie_id` | `string` | Goalie identifier on the play. |
| `period_of_game` | `string` | Period in which the event occurred. |
| `sec_from_start` | `number` | Seconds elapsed since the start of the game. |
| `clock` | `string` | Game clock time remaining (MM:SS). |
| `x_coord` | `number` | Transformed x-coordinate of the event (feet scale). |
| `y_coord` | `number` | Transformed y-coordinate of the event (feet scale). |
| `shot_distance` | `number` | Distance of the shot from the net. |
| `shot_angle` | `number` | Angle of the shot relative to the net. |
| `event_type` | `string` | Standardized event type code. |
| `shot_quality` | `string` | Shot quality descriptor. |
| `power_play` | `number` | Whether the event occurred on a power play. |
| `short_handed` | `string` | Whether the event occurred while short-handed. |
| `empty_net` | `string` | Whether the net was empty. |
| `penalty_shot` | `string` | Whether the goal came on a penalty shot. |
| `goal` | `boolean` | Flag for whether the event was a goal. |
| `xg` | `number` | Expected goals value for the shot event. |

## `loadPwhlPenaltySummary`

Release: [pwhl_penalty_summary](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_penalty_summary) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_penalty_summary/penalty_summary_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlPenaltySummary({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_penalty_summary(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlPenaltySummaryRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period_id` | `string` | Period identifier. |
| `period` | `string` | Period number. |
| `time` | `string` | Game clock at infraction (MM:SS). |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `game_penalty_id` | `string` | Penalty identifier within the game. |
| `minutes` | `number \| bigint` | Penalty length in minutes. |
| `description` | `string` | Full text description of the event. |
| `rule_number` | `string` | Rulebook rule number. |
| `is_power_play` | `number \| bigint` | Power-play flag. |
| `is_bench` | `number \| bigint` | Bench-minor flag. |
| `taken_by_id` | `string` | Identifier of the player who took the penalty. |
| `taken_by_first` | `string` | Offender first name. |
| `taken_by_last` | `string` | Offender last name. |
| `taken_by_position` | `string` | Offender position. |
| `served_by_id` | `string` | Identifier of the player serving the penalty. |
| `served_by_first` | `string` | First name of the player serving. |
| `served_by_last` | `string` | Last name of the player serving. |

## `loadPwhlPlayerBoxscores`

Release: [pwhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlPlayerBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_player_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlPlayerBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `position` | `string` | Player position. |
| `team_id` | `string` | Unique team identifier. |
| `game_id` | `string` | Unique game identifier. |
| `league` | `string` | League code. |
| `toi` | `string` | Time on ice. |
| `time_on_ice` | `number` | Time on ice in seconds. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `shots` | `number \| bigint` | Shots on goal. |
| `hits` | `number \| bigint` | Hits. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `plus_minus` | `number \| bigint` | Plus/minus rating. |
| `faceoff_attempts` | `number \| bigint` | Faceoff attempts. |
| `faceoff_wins` | `number \| bigint` | Faceoff wins. |
| `faceoff_losses` | `number \| bigint` | Faceoff losses. |
| `faceoff_pct` | `number` | Faceoff win percentage. |
| `starting` | `number \| bigint` | Whether the player started the game. |
| `player_type` | `string` | Player type (skater or goalie). |
| `saves` | `number \| bigint` | Saves made. |
| `goals_against` | `number \| bigint` | Goals against. |
| `shots_against` | `number \| bigint` | Shots faced. |

## `loadPwhlRosters`

Release: [pwhl_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `team_side` | `string` | Home or away indicator. |
| `player_type` | `string` | Player type (skater or goalie). |
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `jersey_number` | `number` | Jersey number. |
| `position` | `string` | Player position. |
| `birth_date` | `string` | Player birth date. |
| `season` | `number` | Season year (echoed from arg). |

## `loadPwhlSchedules`

Release: [pwhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_schedules/pwhl_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlSchedules({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_schedules(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlSchedulesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |
| `game_status` | `string` | Game status text. |
| `home_team` | `string` | Home team name. |
| `home_team_id` | `string` | Home team identifier. |
| `away_team` | `string` | Away team name. |
| `away_team_id` | `string` | Away team identifier. |
| `home_score` | `string` | Home team final score. |
| `away_score` | `string` | Away team final score. |
| `winner` | `string` | Whether this competitor won the game. |
| `venue` | `string` | Venue where the game was played. |
| `venue_url` | `string` | URL for the venue. |
| `game_type` | `string` | Game type the row belongs to. |
| `game_json` | `boolean` | Whether processed game JSON is available. |
| `game_json_url` | `string` | URL to the processed game JSON. |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `player_box` | `boolean` | Whether player box score data is available. |
| `skater_box` | `boolean` | Whether skater box data is available. |
| `goalie_box` | `boolean` | Whether goalie box data is available. |
| `team_box` | `boolean` | Whether team box score data is available. |
| `game_info` | `boolean` | CONSTANT true: marks that the source game record carried a game-info block. |
| `game_rosters` | `boolean` | Whether game rosters data is available. |
| `scoring_summary` | `boolean` | Whether scoring summary data is available. |
| `penalty_summary` | `boolean` | Whether penalty summary data is available. |
| `three_stars` | `boolean` | CONSTANT true: marks that the source game record carried a three-stars block. |
| `officials` | `boolean` | Whether officials data is available. |
| `shots_by_period` | `boolean` | Whether shots-by-period data is available. |
| `shootout` | `boolean` | Whether shootout data is available. |

## `loadPwhlScoringSummary`

Release: [pwhl_scoring_summary](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_scoring_summary) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_scoring_summary/scoring_summary_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlScoringSummary({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_scoring_summary(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlScoringSummaryRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period_id` | `string` | Period identifier. |
| `period` | `string` | Period number. |
| `time` | `string` | Game clock at infraction (MM:SS). |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `game_goal_id` | `string` | Goal identifier within the game. |
| `scorer_goal_number` | `number \| bigint` | Scorer's season goal number. |
| `scorer_id` | `string` | Identifier of the goal scorer. |
| `scorer_first` | `string` | Scorer first name. |
| `scorer_last` | `string` | Scorer last name. |
| `scorer_position` | `string` | Scorer position. |
| `assist_1_id` | `string` | Primary assist player identifier. |
| `assist_1_first` | `string` | Primary assist first name. |
| `assist_1_last` | `string` | Primary assist last name. |
| `assist_2_id` | `string` | Secondary assist player identifier. |
| `assist_2_first` | `string` | Secondary assist first name. |
| `assist_2_last` | `string` | Secondary assist last name. |
| `is_power_play` | `number \| bigint` | Power-play flag. |
| `is_short_handed` | `number \| bigint` | Short-handed flag. |
| `is_empty_net` | `number \| bigint` | Empty-net flag. |
| `is_penalty_shot` | `number \| bigint` | Penalty-shot flag. |
| `is_insurance` | `number \| bigint` | Insurance-goal flag. |
| `is_game_winning` | `number \| bigint` | Game-winning-goal flag. |
| `x_location` | `unknown` | Goal x-coordinate on the ice. |
| `y_location` | `unknown` | Goal y-coordinate on the ice. |

## `loadPwhlShootout`

Release: [pwhl_shootout](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shootout) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_shootout/shootout_summary_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlShootout({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_shootout(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlShootoutRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `round` | `number \| bigint` | Shootout round number. |
| `team_side` | `string` | Home or away indicator. |
| `shooter_id` | `string` | Shooter player identifier. |
| `shooter_first` | `string` | Shooter first name. |
| `shooter_last` | `string` | Shooter last name. |
| `goalie_id` | `string` | Goalie identifier on the play. |
| `goalie_first` | `string` | Goalie first name. |
| `goalie_last` | `string` | Goalie last name. |
| `is_goal` | `number \| bigint` | Whether the attempt scored (1/0). |

## `loadPwhlShotsByPeriod`

Release: [pwhl_shots_by_period](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_shots_by_period) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_shots_by_period/shots_by_period_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlShotsByPeriod({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_shots_by_period(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlShotsByPeriodRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period_id` | `string` | Period identifier. |
| `period` | `string` | Period number. |
| `home_goals` | `number \| bigint` | Home goals in the period. |
| `home_shots` | `number \| bigint` | Home team shots in the period. |
| `away_goals` | `number \| bigint` | Away goals in the period. |
| `away_shots` | `number \| bigint` | Away team shots in the period. |

## `loadPwhlSkaterBoxscores`

Release: [pwhl_skater_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_skater_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_skater_boxscores/skater_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlSkaterBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_skater_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlSkaterBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `position` | `string` | Player position. |
| `team_id` | `string` | Unique team identifier. |
| `game_id` | `string` | Unique game identifier. |
| `league` | `string` | League code. |
| `toi` | `string` | Time on ice. |
| `time_on_ice` | `number` | Time on ice in seconds. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `shots` | `number \| bigint` | Shots on goal. |
| `hits` | `number \| bigint` | Hits. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `plus_minus` | `number \| bigint` | Plus/minus rating. |
| `faceoff_attempts` | `number \| bigint` | Faceoff attempts. |
| `faceoff_wins` | `number \| bigint` | Faceoff wins. |
| `faceoff_losses` | `number \| bigint` | Faceoff losses. |
| `faceoff_pct` | `number` | Faceoff win percentage. |
| `starting` | `number \| bigint` | Whether the player started the game. |

## `loadPwhlTeamBoxscores`

Release: [pwhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlTeamBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_team_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlTeamBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `team_side` | `string` | Home or away indicator. |
| `shots` | `number \| bigint` | Shots on goal. |
| `goals` | `number \| bigint` | Goals scored. |
| `hits` | `number \| bigint` | Hits. |
| `pp_goals` | `number \| bigint` | Power-play goals. |
| `pp_opportunities` | `number \| bigint` | Power-play opportunities. |
| `goal_count` | `number \| bigint` | Total goals recorded. |
| `assist_count` | `number \| bigint` | Total assists recorded. |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `infraction_count` | `number \| bigint` | Number of infractions. |
| `faceoff_attempts` | `number \| bigint` | Faceoff attempts. |
| `faceoff_wins` | `number \| bigint` | Faceoff wins. |
| `faceoff_win_pct` | `number` | Faceoff win percentage. |
| `season_wins` | `number \| bigint` | Season wins entering/after the game. |
| `season_losses` | `number \| bigint` | Season losses entering/after the game. |
| `season_ot_wins` | `number \| bigint` | Season overtime wins. |
| `season_ot_losses` | `number \| bigint` | Season overtime losses. |
| `season_so_losses` | `number \| bigint` | Season shootout losses. |
| `season_record` | `string` | Season record after this game. |

## `loadPwhlThreeStars`

Release: [pwhl_three_stars](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/pwhl_three_stars) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/pwhl_three_stars/three_stars_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.pwhl.loadPwhlThreeStars({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.pwhl.load_pwhl_three_stars(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadPwhlThreeStarsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `star` | `number \| bigint` | Star ranking (1, 2, or 3). |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team name. |
| `team_abbr` | `string` | Team abbreviation. |
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `jersey_number` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `is_goalie` | `number \| bigint` | Goalie flag. |
| `is_home` | `number \| bigint` | Home-team flag. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `shots` | `number \| bigint` | Shots on goal. |
| `saves` | `number \| bigint` | Saves made. |
| `shots_against` | `number \| bigint` | Shots faced. |
| `goals_against` | `number \| bigint` | Goals against. |
| `time_on_ice` | `string` | Time on ice in seconds. |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/releases.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/loaders)._
