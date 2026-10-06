---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.nhl` — dataset loaders

27 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadNhlPbp`](#loadnhlpbp) | [nhl_pbp_full](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_full) | 2010+ |
| [`loadNhlPlayerBoxscore`](#loadnhlplayerboxscore) | [nhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_player_boxscores) | 2010+ |
| [`loadNhlSchedule`](#loadnhlschedule) | [nhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_schedules) | 2010+ |
| [`loadNhlTeamBoxscore`](#loadnhlteamboxscore) | [nhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_team_boxscores) | 2010+ |
| [`loadNhlGameInfo`](#loadnhlgameinfo) | [nhl_game_info](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_game_info) | 2024+ |
| [`loadNhlGameRosters`](#loadnhlgamerosters) | [nhl_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_game_rosters) | 2024+ |
| [`loadNhlGoalieBoxscores`](#loadnhlgoalieboxscores) | [nhl_goalie_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_goalie_boxscores) | 2024+ |
| [`loadNhlLinescore`](#loadnhllinescore) | [nhl_linescore](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_linescore) | 2024+ |
| [`loadNhlOfficials`](#loadnhlofficials) | [nhl_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_officials) | 2025+ |
| [`loadNhlPbpFull`](#loadnhlpbpfull) | [nhl_pbp_full](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_full) | 2010+ |
| [`loadNhlPbpLite`](#loadnhlpbplite) | [nhl_pbp_lite](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_lite) | 2010+ |
| [`loadNhlPenalties`](#loadnhlpenalties) | [nhl_penalties](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_penalties) | 2024+ |
| [`loadNhlPlayerBoxscores`](#loadnhlplayerboxscores) | [nhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_player_boxscores) | 2010+ |
| [`loadNhlRosters`](#loadnhlrosters) | [nhl_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_rosters) | 2010+ |
| [`loadNhlSchedules`](#loadnhlschedules) | [nhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_schedules) | 2010+ |
| [`loadNhlScoring`](#loadnhlscoring) | [nhl_scoring](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_scoring) | 2024+ |
| [`loadNhlScratches`](#loadnhlscratches) | [nhl_scratches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_scratches) | 2024+ |
| [`loadNhlShifts`](#loadnhlshifts) | [nhl_shifts](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shifts) | 2025+ |
| [`loadNhlShootout`](#loadnhlshootout) | [nhl_shootout](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shootout) | 2025+ |
| [`loadNhlShotsByPeriod`](#loadnhlshotsbyperiod) | [nhl_shots_by_period](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shots_by_period) | 2025+ |
| [`loadNhlSkaterBoxscores`](#loadnhlskaterboxscores) | [nhl_skater_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_skater_boxscores) | 2024+ |
| [`loadNhlTeamBoxscores`](#loadnhlteamboxscores) | [nhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_team_boxscores) | 2010+ |
| [`loadNhlThreeStars`](#loadnhlthreestars) | [nhl_three_stars](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_three_stars) | 2024+ |
| [`loadNhlGroups`](#loadnhlgroups) | [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) | one asset |
| [`loadNhlGroupSeasons`](#loadnhlgroupseasons) | [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) | one asset |
| [`loadNhlGroupAliases`](#loadnhlgroupaliases) | [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) | one asset |
| [`loadNhlTeamGroupSeasons`](#loadnhlteamgroupseasons) | [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) | 1918+ |

## `loadNhlPbp`

Release: [nhl_pbp_full](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_full) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_pbp_full/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPbp({ seasons: 2024, columns: ['game_id', 'period', 'event_type', 'description', 'strength_state'] });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `event_type` | `string` | Standardized event type code. |
| `event` | `string` | Event description label. |
| `secondary_type` | `string` | Secondary event type (e.g. shot type). |
| `event_team_abbr` | `string` | Abbreviation of the team credited with the event. |
| `event_team_type` | `string` | Whether the event team is home or away. |
| `description` | `string` | Full text description of the event. |
| `period` | `number \| bigint` | Period number. |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `period_time` | `string` | Elapsed time in the period (MM:SS). |
| `period_seconds` | `number \| bigint` | Elapsed seconds in the period. |
| `period_seconds_remaining` | `number \| bigint` | Seconds remaining in the period. |
| `period_time_remaining` | `string` | Time remaining in the period (MM:SS). |
| `game_seconds` | `number \| bigint` | Elapsed seconds in the game. |
| `game_seconds_remaining` | `number \| bigint` | Seconds remaining in regulation. |
| `home_score` | `number \| bigint` | Home team final score. |
| `away_score` | `number \| bigint` | Away team final score. |
| `event_player_1_name` | `string` | Name of the primary event player. |
| `event_player_1_type` | `string` | Role of the primary event player. |
| `event_player_1_id` | `string` | Player id of the primary event player. |
| `event_player_2_name` | `string` | Name of the secondary event player. |
| `event_player_2_type` | `string` | Role of the secondary event player. |
| `event_player_2_id` | `string` | Player id of the secondary event player. |
| `event_player_3_name` | `string` | Name of the tertiary event player. |
| `event_player_3_type` | `string` | Role of the tertiary event player. |
| `event_player_3_id` | `string` | Player ID of the tertiary event player. |
| `event_goalie_name` | `string` | Name of the goalie on the event. |
| `event_goalie_id` | `string` | Player id of the goalie on the event. |
| `penalty_severity` | `string` | Severity of the penalty. |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `strength_state` | `string` | Strength state (e.g. 5v5, 5v4). |
| `strength_code` | `string` | Strength state code (e.g., all, even, pp, pk). |
| `strength` | `string` | Strength label (Even, Power Play, Shorthanded). |
| `empty_net` | `boolean` | Whether the net was empty. |
| `extra_attacker` | `boolean` | Whether an extra attacker was on the ice. |
| `x` | `number \| bigint` | Raw x-coordinate of the event. |
| `y` | `number \| bigint` | Raw y-coordinate of the event. |
| `x_fixed` | `number \| bigint` | Normalized x coordinate (home shoots right). |
| `y_fixed` | `number \| bigint` | Normalized y coordinate (home shoots right). |
| `shot_distance` | `number` | Distance of the shot from the net. |
| `shot_angle` | `number` | Angle of the shot relative to the net. |
| `home_skaters` | `number \| bigint` | Number of home skaters on the ice. |
| `away_skaters` | `number \| bigint` | Number of away skaters on the ice. |
| `home_on_1` | `string` | Name of home skater 1 on the ice. |
| `home_on_2` | `string` | Name of home skater 2 on the ice. |
| `home_on_3` | `string` | Name of home skater 3 on the ice. |
| `home_on_4` | `string` | Name of home skater 4 on the ice. |
| `home_on_5` | `string` | Name of home skater 5 on the ice. |
| `home_on_6` | `string` | Name of home skater 6 on the ice. |
| `home_on_7` | `string` | Name of home skater 7 on the ice. |
| `away_on_1` | `string` | Name of away skater 1 on the ice. |
| `away_on_2` | `string` | Name of away skater 2 on the ice. |
| `away_on_3` | `string` | Name of away skater 3 on the ice. |
| `away_on_4` | `string` | Name of away skater 4 on the ice. |
| `away_on_5` | `string` | Name of away skater 5 on the ice. |
| `away_on_6` | `string` | Name of away skater 6 on the ice. |
| `away_on_7` | `string` | Name of away skater 7 on the ice. |
| `home_goalie` | `string` | Name of the home goalie on the ice. |
| `away_goalie` | `string` | Name of the away goalie on the ice. |
| `num_on` | `number \| bigint` | Number of players coming on (line change). |
| `players_on` | `string` | Names of players coming on. |
| `num_off` | `number \| bigint` | Number of players going off (line change). |
| `players_off` | `string` | Names of players going off. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `string` | Season year (echoed from arg). |
| `season_type` | `string` | Season type code (echoed from arg). |
| `home_abbr` | `string` | Home team abbreviation. |
| `away_abbr` | `string` | Away team abbreviation. |
| `event_idx` | `number \| bigint` | Sequential event index within the game. |
| `event_id` | `string` | ESPN event id (echoed from arg). |
| `pptReplayUrl` | `string` | URL to the play replay, if available. |
| `away_goalie_in` | `number \| bigint` | Whether the away goalie is on the ice (1/0). |
| `home_goalie_in` | `number \| bigint` | Whether the home goalie is on the ice (1/0). |
| `reason` | `string` | Reason for the event (e.g. stoppage reason). |
| `secondaryReason` | `string` | Secondary reason for a stoppage. |
| `ids_on` | `string` | Player ids coming on. |
| `ids_off` | `string` | Player ids going off. |
| `home_on_1_id` | `string` | Player id of home skater 1 on the ice. |
| `away_on_1_id` | `string` | Player id of away skater 1 on the ice. |
| `home_on_2_id` | `string` | Player id of home skater 2 on the ice. |
| `away_on_2_id` | `string` | Player id of away skater 2 on the ice. |
| `home_on_3_id` | `string` | Player id of home skater 3 on the ice. |
| `away_on_3_id` | `string` | Player id of away skater 3 on the ice. |
| `home_on_4_id` | `string` | Player id of home skater 4 on the ice. |
| `away_on_4_id` | `string` | Player id of away skater 4 on the ice. |
| `home_on_5_id` | `string` | Player id of home skater 5 on the ice. |
| `away_on_5_id` | `string` | Player id of away skater 5 on the ice. |
| `home_on_6_id` | `string` | Player id of home skater 6 on the ice. |
| `away_on_6_id` | `string` | Player id of away skater 6 on the ice. |
| `home_on_7_id` | `string` | Player id of home skater 7 on the ice. |
| `away_on_7_id` | `string` | Player id of away skater 7 on the ice. |
| `home_goalie_id` | `string` | Player ID of the home goalie on the ice. |
| `away_goalie_id` | `string` | Player ID of the away goalie on the ice. |
| `xg` | `number` | Expected goals value for the shot event. |
| `game_date` | `string` | Game date. |

## `loadNhlPlayerBoxscore`

Release: [nhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPlayerBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_player_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPlayerBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `sweater_number` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `plus_minus` | `number \| bigint` | Plus/minus rating. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `hits` | `number \| bigint` | Hits. |
| `power_play_goals` | `number \| bigint` | Power-play goals. |
| `shots_on_goal` | `number \| bigint` | Shots on goal. |
| `faceoff_winning_pctg` | `number` | Faceoff win percentage. |
| `toi` | `string` | Time on ice. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `shifts` | `number \| bigint` | CONSTANT false in every published row: the shift-chart block is not carried on this asset. An availability flag, not a shift count. |
| `giveaways` | `number \| bigint` | Giveaways. |
| `takeaways` | `number \| bigint` | Takeaways. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |
| `even_strength_shots_against` | `string` | Even-strength shots against (saves/total). |
| `power_play_shots_against` | `string` | Power-play shots against (saves/total). |
| `shorthanded_shots_against` | `string` | Shorthanded shots against (saves/total). |
| `save_shots_against` | `string` | Total shots against (saves/total). |
| `save_pctg` | `number` | Save percentage. |
| `even_strength_goals_against` | `number \| bigint` | Even-strength goals against. |
| `power_play_goals_against` | `number \| bigint` | Power-play goals against. |
| `shorthanded_goals_against` | `number \| bigint` | Shorthanded goals against. |
| `goals_against` | `number \| bigint` | Goals against. |
| `starter` | `boolean` | Whether the goalie started the game. |
| `decision` | `string` | Goalie decision (W/L/O). |
| `shots_against` | `number \| bigint` | Shots faced. |
| `saves` | `number \| bigint` | Saves made. |

## `loadNhlSchedule`

Release: [nhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_schedules/nhl_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlSchedule({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season_full` | `string` | Full season label (e.g. 20212022). |
| `game_type` | `string` | Game type the row belongs to. |
| `game_date` | `string` | Game date. |
| `game_time` | `string` | Scheduled start time of the game. |
| `home_team_abbr` | `string` | Home team abbreviation. |
| `away_team_abbr` | `string` | Away team abbreviation. |
| `home_team_name` | `string` | Home team name. |
| `away_team_name` | `string` | Away team name. |
| `home_score` | `number` | Home team final score. |
| `away_score` | `number` | Away team final score. |
| `game_state` | `string` | Game state (e.g., FINAL, LIVE). |
| `venue` | `string` | Venue where the game was played. |
| `series_letter` | `string` | Playoff series identifier letter, populated only for postseason games (88 of 1,400 rows in 2024) and null for the regular season. |
| `playoff_round` | `number` | Playoff round identifier. |
| `series_game_number` | `number` | Series game number. |
| `season` | `number` | Season year (echoed from arg). |
| `game_json` | `boolean` | Whether processed game JSON is available. |
| `game_json_url` | `string` | URL to the processed game JSON. |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `team_box` | `boolean` | Whether team box score data is available. |
| `player_box` | `boolean` | Whether player box score data is available. |
| `skater_box` | `boolean` | Whether skater box data is available. |
| `goalie_box` | `boolean` | Whether goalie box data is available. |
| `game_info` | `boolean` | CONSTANT true: marks that the source game record carried a game-info block. |
| `game_rosters` | `boolean` | Whether game rosters data is available. |
| `scoring` | `boolean` | CONSTANT true: marks that the source game record carried a scoring-summary block. It is an availability flag, not a count or a scoring event. |
| `penalties` | `boolean` | CONSTANT true: marks that the source game record carried a penalty-summary block. It is an availability flag, not a penalty count. |
| `scratches` | `boolean` | True when the source game record carried a scratches block for the game. |
| `linescore` | `boolean` | CONSTANT: true on every published row, so it carries no information as shipped. It marks that a linescore block existed on the source game record. |
| `three_stars` | `boolean` | CONSTANT true: marks that the source game record carried a three-stars block. |
| `shifts` | `boolean` | CONSTANT false in every published row: the shift-chart block is not carried on this asset. An availability flag, not a shift count. |
| `officials` | `boolean` | Whether officials data is available. |
| `shots_by_period` | `boolean` | Whether shots-by-period data is available. |
| `shootout` | `boolean` | Whether shootout data is available. |

## `loadNhlTeamBoxscore`

Release: [nhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlTeamBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_team_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlTeamBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `team_name` | `string` | Team name. |
| `goals` | `number \| bigint` | Goals scored. |
| `shots_on_goal` | `number \| bigint` | Shots on goal. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `hits` | `number \| bigint` | Hits. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `giveaways` | `number \| bigint` | Giveaways. |
| `takeaways` | `number \| bigint` | Takeaways. |
| `power_play_goals` | `number \| bigint` | Power-play goals. |
| `faceoff_win_pctg` | `number` | Faceoff win percentage. |
| `saves` | `number \| bigint` | Saves made. |
| `save_pctg` | `number` | Save percentage. |
| `goals_against` | `number \| bigint` | Goals against. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlGameInfo`

Release: [nhl_game_info](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_game_info) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_game_info/game_info_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGameInfo({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_game_info(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGameInfoRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_type` | `string` | Game type the row belongs to. |
| `game_date` | `string` | Game date. |
| `venue` | `string` | Venue where the game was played. |
| `home_team_abbr` | `string` | Home team abbreviation. |
| `away_team_abbr` | `string` | Away team abbreviation. |
| `home_score` | `number \| bigint` | Home team final score. |
| `away_score` | `number \| bigint` | Away team final score. |
| `game_state` | `string` | Game state (e.g., FINAL, LIVE). |

## `loadNhlGameRosters`

Release: [nhl_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGameRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGameRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `full_name` | `string` | Player full name. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `team_abbr` | `string` | Team abbreviation. |
| `team_id` | `string` | Unique team identifier. |
| `position_code` | `string` | Player position code. |
| `sweater_number` | `number \| bigint` | Jersey number. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |
| `shoots_catches` | `string` | Handedness (shoots/catches). |

## `loadNhlGoalieBoxscores`

Release: [nhl_goalie_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_goalie_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_goalie_boxscores/goalie_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGoalieBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_goalie_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGoalieBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `sweater_number` | `number \| bigint` | Jersey number. |
| `even_strength_shots_against` | `string` | Even-strength shots against (saves/total). |
| `power_play_shots_against` | `string` | Power-play shots against (saves/total). |
| `shorthanded_shots_against` | `string` | Shorthanded shots against (saves/total). |
| `save_shots_against` | `string` | Total shots against (saves/total). |
| `save_pctg` | `number` | Save percentage. |
| `even_strength_goals_against` | `number \| bigint` | Even-strength goals against. |
| `power_play_goals_against` | `number \| bigint` | Power-play goals against. |
| `shorthanded_goals_against` | `number \| bigint` | Shorthanded goals against. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `goals_against` | `number \| bigint` | Goals against. |
| `toi` | `string` | Time on ice. |
| `starter` | `boolean` | Whether the goalie started the game. |
| `decision` | `string` | Goalie decision (W/L/O). |
| `shots_against` | `number \| bigint` | Shots faced. |
| `saves` | `number \| bigint` | Saves made. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlLinescore`

Release: [nhl_linescore](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_linescore) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_linescore/linescore_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlLinescore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_linescore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlLinescoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `home_team_id` | `string` | Home team identifier. |
| `home_team_abbr` | `string` | Home team abbreviation. |
| `home_goals` | `number \| bigint` | Home goals in the period. |
| `home_shots` | `number \| bigint` | Home team shots in the period. |
| `away_team_id` | `string` | Away team identifier. |
| `away_team_abbr` | `string` | Away team abbreviation. |
| `away_goals` | `number \| bigint` | Away goals in the period. |
| `away_shots` | `number \| bigint` | Away team shots in the period. |
| `has_shootout` | `boolean` | Flag for whether the game went to shootout. |

## `loadNhlOfficials`

Release: [nhl_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlOfficials({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `role` | `string` | Grouped official role (Referee/Linesperson). |
| `name` | `string` | Team mascot name. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlPbpFull`

Release: [nhl_pbp_full](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_full) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_pbp_full/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPbpFull({ seasons: 2010, columns: ['game_id', 'period', 'event_type', 'description', 'event'] });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_pbp_full(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPbpFullRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `event_type` | `string` | Standardized event type code. |
| `event` | `string` | Event description label. |
| `secondary_type` | `string` | Secondary event type (e.g. shot type). |
| `event_team_abbr` | `string` | Abbreviation of the team credited with the event. |
| `event_team_type` | `string` | Whether the event team is home or away. |
| `description` | `string` | Full text description of the event. |
| `period` | `number \| bigint` | Period number. |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `period_time` | `string` | Elapsed time in the period (MM:SS). |
| `period_seconds` | `number \| bigint` | Elapsed seconds in the period. |
| `period_seconds_remaining` | `number \| bigint` | Seconds remaining in the period. |
| `period_time_remaining` | `string` | Time remaining in the period (MM:SS). |
| `game_seconds` | `number \| bigint` | Elapsed seconds in the game. |
| `game_seconds_remaining` | `number \| bigint` | Seconds remaining in regulation. |
| `home_score` | `number \| bigint` | Home team final score. |
| `away_score` | `number \| bigint` | Away team final score. |
| `event_player_1_name` | `string` | Name of the primary event player. |
| `event_player_1_type` | `string` | Role of the primary event player. |
| `event_player_1_id` | `string` | Player id of the primary event player. |
| `event_player_2_name` | `string` | Name of the secondary event player. |
| `event_player_2_type` | `string` | Role of the secondary event player. |
| `event_player_2_id` | `string` | Player id of the secondary event player. |
| `event_player_3_name` | `string` | Name of the tertiary event player. |
| `event_player_3_type` | `string` | Role of the tertiary event player. |
| `event_player_3_id` | `string` | Player ID of the tertiary event player. |
| `event_goalie_name` | `string` | Name of the goalie on the event. |
| `event_goalie_id` | `string` | Player id of the goalie on the event. |
| `penalty_severity` | `string` | Severity of the penalty. |
| `penalty_minutes` | `number \| bigint` | Penalty minutes. |
| `strength_state` | `string` | Strength state (e.g. 5v5, 5v4). |
| `strength_code` | `string` | Strength state code (e.g., all, even, pp, pk). |
| `strength` | `string` | Strength label (Even, Power Play, Shorthanded). |
| `empty_net` | `boolean` | Whether the net was empty. |
| `extra_attacker` | `boolean` | Whether an extra attacker was on the ice. |
| `x` | `number \| bigint` | Raw x-coordinate of the event. |
| `y` | `number \| bigint` | Raw y-coordinate of the event. |
| `x_fixed` | `number \| bigint` | Normalized x coordinate (home shoots right). |
| `y_fixed` | `number \| bigint` | Normalized y coordinate (home shoots right). |
| `shot_distance` | `number` | Distance of the shot from the net. |
| `shot_angle` | `number` | Angle of the shot relative to the net. |
| `home_skaters` | `number \| bigint` | Number of home skaters on the ice. |
| `away_skaters` | `number \| bigint` | Number of away skaters on the ice. |
| `home_on_1` | `string` | Name of home skater 1 on the ice. |
| `home_on_2` | `string` | Name of home skater 2 on the ice. |
| `home_on_3` | `string` | Name of home skater 3 on the ice. |
| `home_on_4` | `string` | Name of home skater 4 on the ice. |
| `home_on_5` | `string` | Name of home skater 5 on the ice. |
| `home_on_6` | `string` | Name of home skater 6 on the ice. |
| `home_on_7` | `string` | Name of home skater 7 on the ice. |
| `away_on_1` | `string` | Name of away skater 1 on the ice. |
| `away_on_2` | `string` | Name of away skater 2 on the ice. |
| `away_on_3` | `string` | Name of away skater 3 on the ice. |
| `away_on_4` | `string` | Name of away skater 4 on the ice. |
| `away_on_5` | `string` | Name of away skater 5 on the ice. |
| `away_on_6` | `string` | Name of away skater 6 on the ice. |
| `away_on_7` | `string` | Name of away skater 7 on the ice. |
| `home_goalie` | `string` | Name of the home goalie on the ice. |
| `away_goalie` | `string` | Name of the away goalie on the ice. |
| `num_on` | `number \| bigint` | Number of players coming on (line change). |
| `players_on` | `string` | Names of players coming on. |
| `num_off` | `number \| bigint` | Number of players going off (line change). |
| `players_off` | `string` | Names of players going off. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `string` | Season year (echoed from arg). |
| `season_type` | `string` | Season type code (echoed from arg). |
| `home_abbr` | `string` | Home team abbreviation. |
| `away_abbr` | `string` | Away team abbreviation. |
| `event_idx` | `number \| bigint` | Sequential event index within the game. |
| `event_id` | `string` | ESPN event id (echoed from arg). |
| `pptReplayUrl` | `string` | URL to the play replay, if available. |
| `away_goalie_in` | `number \| bigint` | Whether the away goalie is on the ice (1/0). |
| `home_goalie_in` | `number \| bigint` | Whether the home goalie is on the ice (1/0). |
| `reason` | `string` | Reason for the event (e.g. stoppage reason). |
| `secondaryReason` | `string` | Secondary reason for a stoppage. |
| `ids_on` | `string` | Player ids coming on. |
| `ids_off` | `string` | Player ids going off. |
| `home_on_1_id` | `string` | Player id of home skater 1 on the ice. |
| `away_on_1_id` | `string` | Player id of away skater 1 on the ice. |
| `home_on_2_id` | `string` | Player id of home skater 2 on the ice. |
| `away_on_2_id` | `string` | Player id of away skater 2 on the ice. |
| `home_on_3_id` | `string` | Player id of home skater 3 on the ice. |
| `away_on_3_id` | `string` | Player id of away skater 3 on the ice. |
| `home_on_4_id` | `string` | Player id of home skater 4 on the ice. |
| `away_on_4_id` | `string` | Player id of away skater 4 on the ice. |
| `home_on_5_id` | `string` | Player id of home skater 5 on the ice. |
| `away_on_5_id` | `string` | Player id of away skater 5 on the ice. |
| `home_on_6_id` | `string` | Player id of home skater 6 on the ice. |
| `away_on_6_id` | `string` | Player id of away skater 6 on the ice. |
| `home_on_7_id` | `string` | Player id of home skater 7 on the ice. |
| `away_on_7_id` | `string` | Player id of away skater 7 on the ice. |
| `home_goalie_id` | `string` | Player ID of the home goalie on the ice. |
| `away_goalie_id` | `string` | Player ID of the away goalie on the ice. |
| `xg` | `number` | Expected goals value for the shot event. |
| `game_date` | `string` | Game date. |

## `loadNhlPbpLite`

Release: [nhl_pbp_lite](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_pbp_lite) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_pbp_lite/play_by_play_{season}_lite.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPbpLite({ seasons: 2010, columns: ['game_id', 'period', 'event_type', 'description', 'event'] });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_pbp_lite(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPbpLiteRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `event_type` | `string` | Standardized event type code. |
| `event` | `string` | Event description label. |
| `secondary_type` | `string` | Secondary event type (e.g. shot type). |
| `event_team_abbr` | `string` | Abbreviation of the team credited with the event. |
| `event_team_type` | `string` | Whether the event team is home or away. |
| `description` | `string` | Full text description of the event. |
| `period` | `number` | Period number. |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `period_time` | `string` | Elapsed time in the period (MM:SS). |
| `period_seconds` | `number` | Elapsed seconds in the period. |
| `period_seconds_remaining` | `number` | Seconds remaining in the period. |
| `period_time_remaining` | `string` | Time remaining in the period (MM:SS). |
| `game_seconds` | `number` | Elapsed seconds in the game. |
| `game_seconds_remaining` | `number` | Seconds remaining in regulation. |
| `home_score` | `number` | Home team final score. |
| `away_score` | `number` | Away team final score. |
| `event_player_1_name` | `string` | Name of the primary event player. |
| `event_player_1_type` | `string` | Role of the primary event player. |
| `event_player_1_id` | `string` | Player id of the primary event player. |
| `event_player_2_name` | `string` | Name of the secondary event player. |
| `event_player_2_type` | `string` | Role of the secondary event player. |
| `event_player_2_id` | `string` | Player id of the secondary event player. |
| `event_player_3_name` | `string` | Name of the tertiary event player. |
| `event_player_3_type` | `string` | Role of the tertiary event player. |
| `event_player_3_id` | `string` | Player ID of the tertiary event player. |
| `event_goalie_name` | `string` | Name of the goalie on the event. |
| `event_goalie_id` | `string` | Player id of the goalie on the event. |
| `penalty_severity` | `string` | Severity of the penalty. |
| `penalty_minutes` | `number` | Penalty minutes. |
| `strength_state` | `string` | Strength state (e.g. 5v5, 5v4). |
| `strength_code` | `string` | Strength state code (e.g., all, even, pp, pk). |
| `strength` | `string` | Strength label (Even, Power Play, Shorthanded). |
| `empty_net` | `boolean` | Whether the net was empty. |
| `extra_attacker` | `boolean` | Whether an extra attacker was on the ice. |
| `x` | `number` | Raw x-coordinate of the event. |
| `y` | `number` | Raw y-coordinate of the event. |
| `x_fixed` | `number` | Normalized x coordinate (home shoots right). |
| `y_fixed` | `number` | Normalized y coordinate (home shoots right). |
| `shot_distance` | `number` | Distance of the shot from the net. |
| `shot_angle` | `number` | Angle of the shot relative to the net. |
| `home_skaters` | `number` | Number of home skaters on the ice. |
| `away_skaters` | `number` | Number of away skaters on the ice. |
| `home_on_1` | `string` | Name of home skater 1 on the ice. |
| `home_on_2` | `string` | Name of home skater 2 on the ice. |
| `home_on_3` | `string` | Name of home skater 3 on the ice. |
| `home_on_4` | `string` | Name of home skater 4 on the ice. |
| `home_on_5` | `string` | Name of home skater 5 on the ice. |
| `home_on_6` | `string` | Name of home skater 6 on the ice. |
| `home_on_7` | `string` | Name of home skater 7 on the ice. |
| `away_on_1` | `string` | Name of away skater 1 on the ice. |
| `away_on_2` | `string` | Name of away skater 2 on the ice. |
| `away_on_3` | `string` | Name of away skater 3 on the ice. |
| `away_on_4` | `string` | Name of away skater 4 on the ice. |
| `away_on_5` | `string` | Name of away skater 5 on the ice. |
| `away_on_6` | `string` | Name of away skater 6 on the ice. |
| `away_on_7` | `string` | Name of away skater 7 on the ice. |
| `home_goalie` | `string` | Name of the home goalie on the ice. |
| `away_goalie` | `string` | Name of the away goalie on the ice. |
| `num_on` | `number` | Number of players coming on (line change). |
| `players_on` | `string` | Names of players coming on. |
| `num_off` | `number` | Number of players going off (line change). |
| `players_off` | `string` | Names of players going off. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year (echoed from arg). |
| `season_type` | `string` | Season type code (echoed from arg). |
| `home_abbr` | `string` | Home team abbreviation. |
| `away_abbr` | `string` | Away team abbreviation. |
| `event_idx` | `number` | Sequential event index within the game. |
| `event_id` | `string` | ESPN event id (echoed from arg). |
| `pptReplayUrl` | `string` | URL to the play replay, if available. |
| `away_goalie_in` | `number` | Whether the away goalie is on the ice (1/0). |
| `home_goalie_in` | `number` | Whether the home goalie is on the ice (1/0). |
| `reason` | `string` | Reason for the event (e.g. stoppage reason). |
| `secondaryReason` | `string` | Secondary reason for a stoppage. |
| `ids_on` | `string` | Player ids coming on. |
| `ids_off` | `string` | Player ids going off. |
| `home_on_1_id` | `string` | Player id of home skater 1 on the ice. |
| `away_on_1_id` | `string` | Player id of away skater 1 on the ice. |
| `home_on_2_id` | `string` | Player id of home skater 2 on the ice. |
| `away_on_2_id` | `string` | Player id of away skater 2 on the ice. |
| `home_on_3_id` | `string` | Player id of home skater 3 on the ice. |
| `away_on_3_id` | `string` | Player id of away skater 3 on the ice. |
| `home_on_4_id` | `string` | Player id of home skater 4 on the ice. |
| `away_on_4_id` | `string` | Player id of away skater 4 on the ice. |
| `home_on_5_id` | `string` | Player id of home skater 5 on the ice. |
| `away_on_5_id` | `string` | Player id of away skater 5 on the ice. |
| `home_on_6_id` | `string` | Player id of home skater 6 on the ice. |
| `away_on_6_id` | `string` | Player id of away skater 6 on the ice. |
| `home_on_7_id` | `string` | Player id of home skater 7 on the ice. |
| `away_on_7_id` | `string` | Player id of away skater 7 on the ice. |
| `home_goalie_id` | `string` | Player ID of the home goalie on the ice. |
| `away_goalie_id` | `string` | Player ID of the away goalie on the ice. |
| `xg` | `number` | Expected goals value for the shot event. |

## `loadNhlPenalties`

Release: [nhl_penalties](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_penalties) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_penalties/penalties_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPenalties({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_penalties(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPenaltiesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `timeInPeriod` | `string` | Time within the period the penalty occurred. |
| `type` | `string` | Competitor type (e.g. "team"). |
| `duration` | `number \| bigint` | Penalty duration in minutes. |
| `committedByPlayer.firstName.default` | `string` | Given name of the penalized player as published in the NHL feed's default English locale. |
| `committedByPlayer.firstName.cs` | `string` | Alternate given name for the penalized player under the NHL feed's Czech key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.de` | `string` | Alternate given name for the penalized player under the NHL feed's German key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.es` | `string` | Alternate given name for the penalized player under the NHL feed's Spanish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.fi` | `string` | Alternate given name for the penalized player under the NHL feed's Finnish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.sk` | `string` | Alternate given name for the penalized player under the NHL feed's Slovak key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.sv` | `string` | Alternate given name for the penalized player under the NHL feed's Swedish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.firstName.fr` | `string` | Alternate given name for the penalized player under the NHL feed's French key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `committedByPlayer.lastName.default` | `string` | Family name of the penalized player as published in the NHL feed's default English locale. |
| `committedByPlayer.lastName.cs` | `string` | Alternate rendering of the family name published under the NHL feed's Czech key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.de` | `string` | Alternate rendering of the penalized player's family name under the NHL feed's German key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.es` | `string` | Alternate rendering of the penalized player's family name under the NHL feed's Spanish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.fi` | `string` | Alternate rendering of the family name published under the NHL feed's Finnish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.sk` | `string` | Alternate rendering of the family name published under the NHL feed's Slovak key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.sv` | `string` | Alternate rendering of the family name published under the NHL feed's Swedish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.lastName.fr` | `string` | Alternate rendering of the family name published under the NHL feed's French key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `committedByPlayer.sweaterNumber` | `number \| bigint` | Jersey number of the penalized player on the play. |
| `teamAbbrev.default` | `string` | Three-letter code of the team charged with the penalty, matching the committing player's boxscore team rather than the team that drew it. |
| `drawnBy.firstName.default` | `string` | Given name, in the feed's default English locale, of the opposing player credited with drawing the penalty. |
| `drawnBy.firstName.cs` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's Czech key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.de` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's German key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.es` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's Spanish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.fi` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's Finnish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.sk` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's Slovak key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.sv` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's Swedish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.firstName.fr` | `string` | Alternate given name for the opposing player credited with drawing the penalty under the NHL feed's French key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `drawnBy.lastName.default` | `string` | Family name, in the feed's default English locale, of the opposing player credited with drawing the penalty. |
| `drawnBy.lastName.cs` | `string` | Alternate rendering of the family name published under the NHL feed's Czech key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.de` | `string` | Alternate rendering of the opposing player credited with drawing the penalty's family name under the NHL feed's German key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.es` | `string` | Alternate rendering of the opposing player credited with drawing the penalty's family name under the NHL feed's Spanish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.fi` | `string` | Alternate rendering of the family name published under the NHL feed's Finnish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.sk` | `string` | Alternate rendering of the family name published under the NHL feed's Slovak key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.sv` | `string` | Alternate rendering of the family name published under the NHL feed's Swedish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.lastName.fr` | `string` | Alternate rendering of the family name published under the NHL feed's French key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `drawnBy.sweaterNumber` | `number \| bigint` | Jersey number of the opposing player credited with drawing the infraction; null whenever no victim is credited, as on all bench and game-misconduct penalties. |
| `descKey` | `string` | Penalty description key. |
| `game_id` | `string` | Unique game identifier. |
| `period_number` | `number \| bigint` | Period number (1-3 regulation, 4+ OT). |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `servedBy.default` | `string` | Abbreviated name, in the feed's default English locale, of the player serving the penalty. |
| `servedBy.cs` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Czech key, differing from the default by diacritics or by an alternate given-name form. |
| `servedBy.de` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's German key, differing from the default by diacritics or by an alternate given-name form. |
| `servedBy.es` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Spanish key, differing from the default by diacritics or by an alternate given-name form. |
| `servedBy.fi` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Finnish key, differing from the default by diacritics or by an alternate given-name form. |
| `servedBy.sk` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Slovak key, differing from the default by diacritics or by an alternate given-name form. |
| `servedBy.sv` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Swedish key, differing from the default by diacritics or by an alternate given-name form. |

## `loadNhlPlayerBoxscores`

Release: [nhl_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlPlayerBoxscores({ seasons: 2010 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_player_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlPlayerBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `sweater_number` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `plus_minus` | `number \| bigint` | Plus/minus rating. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `hits` | `number \| bigint` | Hits. |
| `power_play_goals` | `number \| bigint` | Power-play goals. |
| `shots_on_goal` | `number \| bigint` | Shots on goal. |
| `faceoff_winning_pctg` | `number` | Faceoff win percentage. |
| `toi` | `string` | Time on ice. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `shifts` | `number \| bigint` | CONSTANT false in every published row: the shift-chart block is not carried on this asset. An availability flag, not a shift count. |
| `giveaways` | `number \| bigint` | Giveaways. |
| `takeaways` | `number \| bigint` | Takeaways. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |
| `even_strength_shots_against` | `string` | Even-strength shots against (saves/total). |
| `power_play_shots_against` | `string` | Power-play shots against (saves/total). |
| `shorthanded_shots_against` | `string` | Shorthanded shots against (saves/total). |
| `save_shots_against` | `string` | Total shots against (saves/total). |
| `save_pctg` | `number` | Save percentage. |
| `even_strength_goals_against` | `number \| bigint` | Even-strength goals against. |
| `power_play_goals_against` | `number \| bigint` | Power-play goals against. |
| `shorthanded_goals_against` | `number \| bigint` | Shorthanded goals against. |
| `goals_against` | `number \| bigint` | Goals against. |
| `starter` | `boolean` | Whether the goalie started the game. |
| `decision` | `string` | Goalie decision (W/L/O). |
| `shots_against` | `number \| bigint` | Shots faced. |
| `saves` | `number \| bigint` | Saves made. |

## `loadNhlRosters`

Release: [nhl_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlRosters({ seasons: 2010 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `full_name` | `string` | Player full name. |
| `first_name` | `string` | Player first name. |
| `last_name` | `string` | Player last name. |
| `team_abbr` | `string` | Team abbreviation. |
| `team_id` | `string` | Unique team identifier. |
| `position_code` | `string` | Player position code. |
| `sweater_number` | `number` | Jersey number. |
| `season` | `number` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlSchedules`

Release: [nhl_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_schedules/nhl_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlSchedules({ seasons: 2010 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_schedules(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlSchedulesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season_full` | `string` | Full season label (e.g. 20212022). |
| `game_type` | `string` | Game type the row belongs to. |
| `game_date` | `string` | Game date. |
| `game_time` | `string` | Scheduled start time of the game. |
| `home_team_abbr` | `string` | Home team abbreviation. |
| `away_team_abbr` | `string` | Away team abbreviation. |
| `home_team_name` | `string` | Home team name. |
| `away_team_name` | `string` | Away team name. |
| `home_score` | `number` | Home team final score. |
| `away_score` | `number` | Away team final score. |
| `game_state` | `string` | Game state (e.g., FINAL, LIVE). |
| `venue` | `string` | Venue where the game was played. |
| `series_letter` | `string` | NHL API letter code identifying the playoff series the game belongs to (null for regular-season games). |
| `playoff_round` | `number` | Playoff round identifier. |
| `series_game_number` | `number` | Series game number. |
| `season` | `number` | Season year (echoed from arg). |
| `game_json` | `boolean` | Whether processed game JSON is available. |
| `game_json_url` | `string` | URL to the processed game JSON. |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `team_box` | `boolean` | Whether team box score data is available. |
| `player_box` | `boolean` | Whether player box score data is available. |
| `skater_box` | `boolean` | Whether skater box data is available. |
| `goalie_box` | `boolean` | Whether goalie box data is available. |
| `game_info` | `boolean` | Whether game info data is available. |
| `game_rosters` | `boolean` | Whether game rosters data is available. |
| `scoring` | `boolean` | TRUE when the play results in a score (TD, FG, safety, two-point conversion). |
| `penalties` | `boolean` | Penalty count. |
| `scratches` | `boolean` | Flag indicating a scratches payload was captured for this game in the NHL raw store. |
| `linescore` | `boolean` | Flag indicating a period-by-period linescore payload was captured for this game in the NHL raw store. |
| `three_stars` | `boolean` | Whether three stars data is available. |
| `shifts` | `boolean` | Number of shifts. |
| `officials` | `boolean` | Whether officials data is available. |
| `shots_by_period` | `boolean` | Whether shots-by-period data is available. |
| `shootout` | `boolean` | Whether shootout data is available. |

## `loadNhlScoring`

Release: [nhl_scoring](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_scoring) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_scoring/scoring_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlScoring({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_scoring(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlScoringRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `situationCode` | `string` | Strength/situation code for the goal. |
| `eventId` | `string` | Event identifier within the game. |
| `strength` | `string` | Strength label (Even, Power Play, Shorthanded). |
| `playerId` | `string` | Player identifier involved in the event. |
| `firstName.default` | `string` | Given name of the goal scorer as rendered in the NHL feed's default English locale. |
| `firstName.cs` | `string` | Alternate given name for the player under the NHL feed's Czech key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.de` | `string` | Alternate given name for the player under the NHL feed's German key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.es` | `string` | Alternate given name for the player under the NHL feed's Spanish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.fi` | `string` | Alternate given name for the player under the NHL feed's Finnish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.sk` | `string` | Alternate given name for the player under the NHL feed's Slovak key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.sv` | `string` | Alternate given name for the player under the NHL feed's Swedish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.fr` | `string` | Alternate given name for the player under the NHL feed's French key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `lastName.default` | `string` | Family name of the goal scorer as rendered in the NHL feed's default English locale. |
| `lastName.cs` | `string` | Alternate rendering of the family name published under the NHL feed's Czech key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.fi` | `string` | Alternate rendering of the family name published under the NHL feed's Finnish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.sk` | `string` | Alternate rendering of the family name published under the NHL feed's Slovak key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.sv` | `string` | Alternate rendering of the family name published under the NHL feed's Swedish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.de` | `string` | Alternate rendering of the player's family name under the NHL feed's German key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.es` | `string` | Alternate rendering of the player's family name under the NHL feed's Spanish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.fr` | `string` | Alternate rendering of the family name published under the NHL feed's French key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `name.default` | `string` | Abbreviated name of the player as published in the NHL feed's default English locale. |
| `name.cs` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Czech key, differing from the default by diacritics or by an alternate given-name form. |
| `name.de` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's German key, differing from the default by diacritics or by an alternate given-name form. |
| `name.es` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Spanish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.fi` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Finnish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.sk` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Slovak key, differing from the default by diacritics or by an alternate given-name form. |
| `name.sv` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Swedish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.fr` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's French key, differing from the default by diacritics or by an alternate given-name form. |
| `teamAbbrev.default` | `string` | Three-letter code of the team that scored the goal, resolving to the home club exactly when isHome is true and to the visitor otherwise. |
| `headshot` | `string` | URL to the player headshot image. |
| `highlightClipSharingUrl` | `string` | Shareable URL for the goal highlight clip. |
| `highlightClip` | `number \| bigint` | Highlight clip identifier. |
| `discreteClip` | `number \| bigint` | Discrete clip identifier. |
| `goalsToDate` | `number \| bigint` | Scorer goal total to date in the season. |
| `awayScore` | `number \| bigint` | Away team score after the goal. |
| `homeScore` | `number \| bigint` | Home team score after the goal. |
| `leadingTeamAbbrev.default` | `string` | Three-letter code of the team ahead on the scoreboard immediately after this goal, null exactly when the goal tied the game and not always the scoring team. |
| `timeInPeriod` | `string` | Time within the period the penalty occurred. |
| `shotType` | `string` | Type of shot on the goal. |
| `goalModifier` | `string` | Goal modifier (e.g. empty-net, power-play). |
| `assists` | `string` | Assists. |
| `pptReplayUrl` | `string` | URL to the play replay, if available. |
| `homeTeamDefendingSide` | `string` | Side of the ice the home team is defending. |
| `isHome` | `boolean` | Whether the scoring team is the home team. |
| `game_id` | `string` | Unique game identifier. |
| `period_number` | `number \| bigint` | Period number (1-3 regulation, 4+ OT). |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `goalInGame` | `number \| bigint` | Running goal count credited to the scorer within this game at the time of the goal. |
| `discreteClipFr` | `number \| bigint` | Numeric NHL video identifier of the French-language standalone clip of the goal, always a different asset id from discreteClip. |
| `highlightClipSharingUrlFr` | `string` | Shareable nhl.com URL for the French-language highlight clip; its trailing numeric segment is the same id carried in highlightClipFr. |
| `highlightClipFr` | `number \| bigint` | NHL video id of the French-language highlight clip for the goal. Stored as Float64 even though it is a whole 13-digit identifier, so cast before using it as a key. |

## `loadNhlScratches`

Release: [nhl_scratches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_scratches) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_scratches/scratches_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlScratches({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_scratches(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlScratchesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `id` | `string` | Unique player identifier. |
| `firstName` | `string` | Scorer first name (localized list). |
| `lastName` | `string` | Scorer last name (localized list). |
| `game_id` | `string` | Unique game identifier. |

## `loadNhlShifts`

Release: [nhl_shifts](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shifts) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_shifts/shifts_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlShifts({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_shifts(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlShiftsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `event_team` | `string` | Team associated with the shift change. |
| `period` | `number \| bigint` | Period number. |
| `period_time` | `string` | Elapsed time in the period (MM:SS). |
| `period_seconds` | `number \| bigint` | Elapsed seconds in the period. |
| `game_seconds` | `number \| bigint` | Elapsed seconds in the game. |
| `num_on` | `number \| bigint` | Number of players coming on (line change). |
| `players_on` | `string` | Names of players coming on. |
| `ids_on` | `string` | Player ids coming on. |
| `num_off` | `number \| bigint` | Number of players going off (line change). |
| `players_off` | `string` | Names of players going off. |
| `ids_off` | `string` | Player ids going off. |
| `event` | `string` | Event description label. |
| `event_type` | `string` | Standardized event type code. |
| `game_seconds_remaining` | `number \| bigint` | Seconds remaining in regulation. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlShootout`

Release: [nhl_shootout](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shootout) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_shootout/shootout_summary_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlShootout({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_shootout(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlShootoutRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home` | `number \| bigint` | Whether the player's team was home. |
| `away` | `number \| bigint` | Away team shots in the period. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |
| `sequence` | `number \| bigint` | Sequence order of the season row. |
| `playerId` | `string` | Player identifier involved in the event. |
| `teamAbbrev.default` | `string` | Three-letter code of the shooting player's team; null on the per-game summary row that instead carries the home and away shootout goal totals. |
| `firstName.default` | `string` | Given name of the shooter in the feed's default English locale; null on the per-game summary row. |
| `firstName.cs` | `string` | Alternate given name published under the NHL feed's Czech key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.de` | `string` | Alternate given name published under the NHL feed's German key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.es` | `string` | Alternate given name published under the NHL feed's Spanish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.fi` | `string` | Alternate given name published under the NHL feed's Finnish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.sk` | `string` | Alternate given name published under the NHL feed's Slovak key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `firstName.sv` | `string` | Alternate given name published under the NHL feed's Swedish key. Verified against the data it is frequently a different name form rather than a re-spelling (Joshua published as Josh, Aliaksei as Alexei), so it is not a reliable transliteration of the default. |
| `lastName.default` | `string` | Family name of the shooter in the feed's default English locale; null on the per-game summary row. |
| `lastName.cs` | `string` | Alternate rendering of the family name published under the NHL feed's Czech key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.fi` | `string` | Alternate rendering of the family name published under the NHL feed's Finnish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.sk` | `string` | Alternate rendering of the family name published under the NHL feed's Slovak key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `lastName.sv` | `string` | Alternate rendering of the family name published under the NHL feed's Swedish key. It differs from the default in orthography -- usually restoring diacritics the default folds to ASCII, though for some names it strips them instead -- so treat it as an alternate spelling, not a canonical one. |
| `shotType` | `string` | Type of shot on the goal. |
| `result` | `string` | Attempt result (goal/save/miss). |
| `headshot` | `string` | URL to the player headshot image. |
| `gameWinner` | `boolean` | True on the single attempt per shootout credited as the game-deciding goal, false on every other attempt and null on the per-game summary row. |
| `homeScore` | `number \| bigint` | Home team score after the goal. |
| `awayScore` | `number \| bigint` | Away team score after the goal. |
| `discreteClip` | `number \| bigint` | Discrete clip identifier. |
| `discreteClipFr` | `number \| bigint` | Numeric NHL video identifier of the French-language clip of the shootout attempt, distinct from the id in discreteClip. |
| `highlightClipSharingUrl` | `string` | Shareable URL for the goal highlight clip. |
| `highlightClipSharingUrlFr` | `string` | Shareable URL of the French-language broadcast highlight clip for the shootout attempt. |
| `highlightClip` | `number \| bigint` | Highlight clip identifier. |
| `highlightClipFr` | `number \| bigint` | NHL video identifier of the French-language highlight clip for the shootout attempt. |

## `loadNhlShotsByPeriod`

Release: [nhl_shots_by_period](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_shots_by_period) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_shots_by_period/shots_by_period_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlShotsByPeriod({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_shots_by_period(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlShotsByPeriodRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `period` | `number \| bigint` | Period number. |
| `period_type` | `string` | Period type (REG/OT/SO). |
| `max_regulation_periods` | `number \| bigint` | Number of regulation periods the game format defines before overtime, constant at 3 for every row in the published seasons. |
| `ot_periods` | `number \| bigint` | Overtime period ordinal taken from the NHL period descriptor, populated only from the second overtime onward so period 5 rows carry 2 and all other rows are null. |
| `away` | `number \| bigint` | Away team shots in the period. |
| `home` | `number \| bigint` | Whether the player's team was home. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlSkaterBoxscores`

Release: [nhl_skater_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_skater_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_skater_boxscores/skater_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlSkaterBoxscores({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_skater_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlSkaterBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `sweater_number` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `plus_minus` | `number \| bigint` | Plus/minus rating. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `hits` | `number \| bigint` | Hits. |
| `power_play_goals` | `number \| bigint` | Power-play goals. |
| `shots_on_goal` | `number \| bigint` | Shots on goal. |
| `faceoff_winning_pctg` | `number` | Faceoff win percentage. |
| `toi` | `string` | Time on ice. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `shifts` | `number \| bigint` | CONSTANT false in every published row: the shift-chart block is not carried on this asset. An availability flag, not a shift count. |
| `giveaways` | `number \| bigint` | Giveaways. |
| `takeaways` | `number \| bigint` | Takeaways. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlTeamBoxscores`

Release: [nhl_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlTeamBoxscores({ seasons: 2010 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_team_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlTeamBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home_away` | `string` | Home or away indicator. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbrev` | `string` | Team abbreviation. |
| `team_name` | `string` | Team name. |
| `goals` | `number \| bigint` | Goals scored. |
| `shots_on_goal` | `number \| bigint` | Shots on goal. |
| `pim` | `number \| bigint` | Penalty minutes. |
| `hits` | `number \| bigint` | Hits. |
| `blocked_shots` | `number \| bigint` | Blocked shots. |
| `giveaways` | `number \| bigint` | Giveaways. |
| `takeaways` | `number \| bigint` | Takeaways. |
| `power_play_goals` | `number \| bigint` | Power-play goals. |
| `faceoff_win_pctg` | `number` | Faceoff win percentage. |
| `saves` | `number \| bigint` | Saves made. |
| `save_pctg` | `number` | Save percentage. |
| `goals_against` | `number \| bigint` | Goals against. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year (echoed from arg). |
| `game_date` | `string` | Game date. |

## `loadNhlThreeStars`

Release: [nhl_three_stars](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_three_stars) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_three_stars/three_stars_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlThreeStars({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_three_stars(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlThreeStarsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `star` | `number \| bigint` | Star ranking (1, 2, or 3). |
| `playerId` | `string` | Player identifier involved in the event. |
| `teamAbbrev` | `string` | Penalized team abbreviation (localized list). |
| `headshot` | `string` | URL to the player headshot image. |
| `name.default` | `string` | Abbreviated name of the player as published in the NHL feed's default English locale. |
| `name.cs` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Czech key, differing from the default by diacritics or by an alternate given-name form. |
| `name.sk` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Slovak key, differing from the default by diacritics or by an alternate given-name form. |
| `name.fi` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Finnish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.sv` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Swedish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.de` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's German key, differing from the default by diacritics or by an alternate given-name form. |
| `name.es` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's Spanish key, differing from the default by diacritics or by an alternate given-name form. |
| `name.fr` | `string` | Alternate abbreviated name (first initial plus family name) published under the NHL feed's French key, differing from the default by diacritics or by an alternate given-name form. |
| `sweaterNo` | `number \| bigint` | Jersey number. |
| `position` | `string` | Player position. |
| `goals` | `number \| bigint` | Goals scored. |
| `assists` | `number \| bigint` | Assists. |
| `points` | `number \| bigint` | Total points (goals + assists). |
| `goalsAgainstAverage` | `number` | Goals-against average (goalies). |
| `savePctg` | `number` | Save percentage (goalies). |
| `game_id` | `string` | Unique game identifier. |
| `winner_id` | `string` | Player id of the winning goalie. |
| `winner_name` | `string` | Name of the winning goalie. |
| `loser_id` | `string` | Player id of the losing goalie. |
| `loser_name` | `string` | Name of the losing goalie. |

## `loadNhlGroups`

Release: [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_groups/nhl_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. nhl:metropolitan) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the ENDING year (2025 = the 2024-25 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGroups();
// snake_case alias (py/R parity): sdv.nhl.load_nhl_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nhl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `last_season` | `number` | Last season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadNhlGroupSeasons`

Release: [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_groups/nhl_group_seasons.parquet`

:::caution[Coverage]
One season-less file: one row per group per season it existed, with its name, short name, abbreviation and parent group AS OF that season (never today's label applied to the past) and its member count. season is the ENDING year (2025 = the 2024-25 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGroupSeasons();
// snake_case alias (py/R parity): sdv.nhl.load_nhl_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nhl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (ENDING year: 2025 = the 2024-25 season). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadNhlGroupAliases`

Release: [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_groups/nhl_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, nhl) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlGroupAliases();
// snake_case alias (py/R parity): sdv.nhl.load_nhl_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nhl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, nhl); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded (still in use). |

## `loadNhlTeamGroupSeasons`

Release: [nhl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nhl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_groups/nhl_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id where ESPN covers the team, otherwise the NHL id; team_id_source names the id space. season is the ENDING year (2025 = the 2024-25 season); seasons 1918-2026. No 2005 asset (the 2004-05 lockout).
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1918) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nhl.loadNhlTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nhl.load_nhl_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNhlTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nhl"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (ENDING year: 2025 = the 2024-25 season). |
| `team_id` | `string` | Team id as a string: the ESPN team id where ESPN covers the team, otherwise the league's own id; team_id_source says which. |
| `team_id_source` | `string` | Id space of team_id (in this table: espn, nhl). |
| `team_name` | `string` | Team name as of that season, not today's. |
| `subdivision_id` | `string` | SDV group_id of the team's subdivision that season (e.g. FBS / FCS, Division I); null where the league has no subdivision level. |
| `conference_id` | `string` | SDV group_id of the team's conference that season; null where the team had no conference (an independent, or a season played without conferences). |
| `division_id` | `string` | SDV group_id of the team's division that season; null where the level does not apply. |
| `source` | `string` | Source the membership was taken from -- the most reliable per-season source for that era. |
| `sources_agree` | `boolean` | Whether a second source agreed on the membership; null when only one source covers the season. |
| `notes` | `string` | Builder notes on the team-season, such as a source disagreement or which of several listed memberships was kept. |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/releases.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/loaders)._
