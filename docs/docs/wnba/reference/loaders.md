---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.wnba` — dataset loaders

34 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadWnbaPbp`](#loadwnbapbp) | [espn_wnba_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_pbp) | 2002+ |
| [`loadWnbaPlayerBoxscore`](#loadwnbaplayerboxscore) | [espn_wnba_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_boxscores) | 2002+ |
| [`loadWnbaSchedule`](#loadwnbaschedule) | [espn_wnba_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_schedules) | 2002+ |
| [`loadWnbaTeamBoxscore`](#loadwnbateamboxscore) | [espn_wnba_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_team_boxscores) | 2002+ |
| [`loadWnbaDraft`](#loadwnbadraft) | [espn_wnba_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_draft) | 2026+ |
| [`loadWnbaGameRosters`](#loadwnbagamerosters) | [espn_wnba_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_game_rosters) | 2024+ |
| [`loadWnbaOfficials`](#loadwnbaofficials) | [espn_wnba_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_officials) | 2024+ |
| [`loadWnbaPlayerSeasonStats`](#loadwnbaplayerseasonstats) | [espn_wnba_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_season_stats) | 2024+ |
| [`loadWnbaRosters`](#loadwnbarosters) | [espn_wnba_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_rosters) | 2024+ |
| [`loadWnbaShots`](#loadwnbashots) | [espn_wnba_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_shots) | 2024+ |
| [`loadWnbaStandings`](#loadwnbastandings) | [espn_wnba_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_standings) | 2024+ |
| [`loadWnbaTeamSeasonStats`](#loadwnbateamseasonstats) | [espn_wnba_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_team_season_stats) | 2024+ |
| [`loadWnbaPlayerCrosswalk`](#loadwnbaplayercrosswalk) | [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) | 2026+ |
| [`loadWnbaScheduleCrosswalk`](#loadwnbaschedulecrosswalk) | [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) | 2026+ |
| [`loadWnbaTeamCrosswalk`](#loadwnbateamcrosswalk) | [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) | 2026+ |
| [`loadWnbaPlayerCore`](#loadwnbaplayercore) | [espn_wnba_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_core) | 2003+ |
| [`loadWnbaPlayerImpact`](#loadwnbaplayerimpact) | [wnba_player_impact](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_player_impact) | 1997+ |
| [`loadWnbaStatsCoaches`](#loadwnbastatscoaches) | [wnba_stats_coaches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_coaches) | 2026+ |
| [`loadWnbaStatsDraft`](#loadwnbastatsdraft) | [wnba_stats_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_draft) | 2025+ |
| [`loadWnbaStatsGameRosters`](#loadwnbastatsgamerosters) | [wnba_stats_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_game_rosters) | 2026+ |
| [`loadWnbaStatsOfficials`](#loadwnbastatsofficials) | [wnba_stats_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_officials) | 2026+ |
| [`loadWnbaStatsPbp`](#loadwnbastatspbp) | [wnba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_pbp) | 1997+ |
| [`loadWnbaStatsPossessions`](#loadwnbastatspossessions) | [wnba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_possessions) | 1997+ |
| [`loadWnbaStatsGameLineups`](#loadwnbastatsgamelineups) | [wnba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_game_lineups) | 1997+ |
| [`loadWnbaStatsPlayerBoxscores`](#loadwnbastatsplayerboxscores) | [wnba_stats_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_player_boxscores) | 2026+ |
| [`loadWnbaStatsPlayerGameLogs`](#loadwnbastatsplayergamelogs) | [wnba_stats_player_game_logs](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_player_game_logs) | 2025+ |
| [`loadWnbaStatsRosters`](#loadwnbastatsrosters) | [wnba_stats_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_rosters) | 2026+ |
| [`loadWnbaStatsSchedules`](#loadwnbastatsschedules) | [wnba_stats_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_schedules) | 1997+ |
| [`loadWnbaStatsShots`](#loadwnbastatsshots) | [wnba_stats_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_shots) | 2026+ |
| [`loadWnbaStatsTeamBoxscores`](#loadwnbastatsteamboxscores) | [wnba_stats_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_team_boxscores) | 2026+ |
| [`loadWnbaGroups`](#loadwnbagroups) | [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) | one asset |
| [`loadWnbaGroupSeasons`](#loadwnbagroupseasons) | [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) | one asset |
| [`loadWnbaGroupAliases`](#loadwnbagroupaliases) | [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) | one asset |
| [`loadWnbaTeamGroupSeasons`](#loadwnbateamgroupseasons) | [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) | 1997+ |

## `loadWnbaPbp`

Release: [espn_wnba_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPbp({ seasons: 2024, columns: ['game_id', 'sequence_number', 'type_text', 'text', 'score_value'] });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_play_number` | `number` | Game play number |
| `id` | `string` | Unique play identification number |
| `sequence_number` | `number` | Sequence number representing a shot-possession (V3 PBP). |
| `type_id` | `string` | Type identifier (numeric). |
| `type_text` | `string` | Play type text, passed through verbatim from ESPN. ESPN labels the free-throw play type "MadeFreeThrow" for made AND missed free throws; filter makes vs. misses with scoring_play, not type_text. |
| `text` | `string` | Text description of the play / record. |
| `away_score` | `number` | Away team score at the time of the play. |
| `home_score` | `number` | Home team score at the time of the play. |
| `period_number` | `number` | Numeric period (1-4 for quarters; 5+ for OT). |
| `period_display_value` | `string` | Period display label (e.g. '1st Quarter', 'OT'). |
| `clock_display_value` | `string` | Game clock display string (e.g. '8:32'). |
| `scoring_play` | `boolean` | TRUE if the play resulted in points scored. |
| `score_value` | `number` | Point value of the attempt (1 / 2 / 3), carried even on misses (a missed free throw still shows 1); use scoring_play to identify points actually scored. |
| `team_id` | `string` | Unique team identifier. |
| `athlete_id_1` | `string` | Primary athlete identifier (e.g. shooter). |
| `athlete_id_2` | `string` | Secondary athlete identifier (e.g. assister / fouler). |
| `athlete_id_3` | `string` | Athlete id 3. |
| `wallclock` | `string` | Wallclock. |
| `shooting_play` | `boolean` | TRUE if the play was a shooting attempt. |
| `coordinate_x_raw` | `number` | X coordinate as returned by the API before any adjustment. |
| `coordinate_y_raw` | `number` | Y coordinate as returned by the API before any adjustment. |
| `points_attempted` | `number` | Point value at stake on the play's shot attempt (1, 2, or 3); 0 for non-shooting plays. |
| `short_description` | `string` | Abbreviated ESPN text description of the play. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `home_team_id` | `string` | Unique identifier for the home team. |
| `home_team_name` | `string` | Home team name. |
| `home_team_mascot` | `string` | Home team mascot. |
| `home_team_abbrev` | `string` | Home team three-letter abbreviation. |
| `home_team_name_alt` | `string` | Alternate versions of the home team abbreviation |
| `away_team_id` | `string` | Unique identifier for the away team. |
| `away_team_name` | `string` | Away team name. |
| `away_team_mascot` | `string` | Away team mascot. |
| `away_team_abbrev` | `string` | Away team three-letter abbreviation. |
| `away_team_name_alt` | `string` | Alternate versions of the away team abbreviation |
| `game_spread` | `number` | Game spread in (-X Team) format. There are almost none, I would recommend not trusting any of these three columns |
| `home_favorite` | `boolean` | Logical (TRUE/FALSE) indicating whether the home team is favored |
| `game_spread_available` | `boolean` | Logical (TRUE/FALSE) indicating whether the spread was available from ESPN. Basically, I would just not recommend using any of the spread information, I think I defaulted a lot of them to -2.5 for the home team. Most games probably do not have spread information. This column should really be listed first |
| `home_team_spread` | `number` | The game spread with respect to the home team |
| `qtr` | `number` | Quarter of the game |
| `time` | `string` | Time left within the period |
| `clock_minutes` | `number` | Clock minutes split from seconds for developer convenience |
| `clock_seconds` | `number` | Clock seconds split from minutes for developer convenience |
| `home_timeout_called` | `boolean` | True when the play is a timeout charged to the home team. |
| `away_timeout_called` | `boolean` | True when the play is a timeout charged to the away team. |
| `half` | `number` | Half of the game |
| `game_half` | `number` | Half of the game |
| `lag_qtr` | `number` | A lag column on the quarter |
| `lead_qtr` | `number` | A lead column on the quarter |
| `lag_half` | `number` | A lag column on the half |
| `lead_half` | `number` | A lead column on the half |
| `start_quarter_seconds_remaining` | `number` | Quarter seconds remaining at the start of the play (these are more or less code artifacts from other sports, but may eventually be used more seriously) |
| `start_half_seconds_remaining` | `number` | Game half seconds remaining at the start of the play (these are more or less code artifacts from other sports, but may eventually be used more seriously) |
| `start_game_seconds_remaining` | `number` | Game seconds remaining at the start of the play (''') |
| `end_quarter_seconds_remaining` | `number` | Quarter seconds remaining at the end of the play (''') |
| `end_half_seconds_remaining` | `number` | Game half seconds remaining at the end of the play (''') |
| `end_game_seconds_remaining` | `number` | Game seconds remaining at the end of the play (''') |
| `period` | `number` | Period of the game (1-4 quarters; 5+ for OT). |
| `coordinate_x` | `number` | X coordinate on the court (half-court layout). |
| `coordinate_y` | `number` | Y coordinate on the court (half-court layout). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `athlete_name_1` | `string` | Display name of the primary athlete on the play (e.g. the shooter, rebounder, or fouler), per ESPN participant order. |
| `athlete_name_2` | `string` | Display name of the secondary athlete on the play (e.g. the assister or fouled player), when present. |
| `athlete_name_3` | `string` | Display name of the third athlete listed on the play, when present. |
| `type_abbreviation` | `string` | Play type abbreviation |

## `loadWnbaPlayerBoxscore`

Release: [espn_wnba_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPlayerBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_player_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPlayerBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `athlete_display_name` | `string` | Athlete display name (full). |
| `team_id` | `string` | Unique team identifier. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_location` | `string` | Team city or location string. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `minutes` | `number` | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `field_goals_made` | `number` | Field goals made (2-pt + 3-pt). |
| `field_goals_attempted` | `number` | Field goal attempts (2-pt + 3-pt). |
| `three_point_field_goals_made` | `number` | Three-point field goals made. |
| `three_point_field_goals_attempted` | `number` | Three-point field goal attempts. |
| `free_throws_made` | `number` | Free throws made. |
| `free_throws_attempted` | `number` | Free throw attempts. |
| `offensive_rebounds` | `number` | Offensive rebounds. |
| `defensive_rebounds` | `number` | Defensive rebounds. |
| `rebounds` | `number` | Total rebounds. |
| `assists` | `number` | Total assists. |
| `steals` | `number` | Total steals. |
| `blocks` | `number` | Total blocks. |
| `turnovers` | `number` | Total turnovers. |
| `fouls` | `number` | Personal fouls. |
| `plus_minus` | `string` | Plus/minus point differential while on court. |
| `points` | `number` | Points scored. |
| `starter` | `boolean` | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `ejected` | `boolean` | TRUE if the player was ejected from the game. |
| `did_not_play` | `boolean` | TRUE if the player did not appear in the game. |
| `reason` | `string` | Reason. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |
| `athlete_jersey` | `string` | Athlete jersey number. |
| `athlete_short_name` | `string` | Athlete short display name. |
| `athlete_headshot_href` | `string` | Athlete headshot image URL. |
| `athlete_position_name` | `string` | Athlete position ('Guard', 'Forward', 'Center'). |
| `athlete_position_abbreviation` | `string` | Athlete position abbreviation (G / F / C). |
| `team_display_name` | `string` | Full team display name. |
| `team_uid` | `string` | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_logo` | `string` | Team logo image URL. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `home_away` | `string` | Game venue label ('home' or 'away'). |
| `team_winner` | `boolean` | TRUE if the team won this game. |
| `team_score` | `number` | Team's score / final score. |
| `opponent_team_id` | `string` | Unique identifier for the opponent team. |
| `opponent_team_name` | `string` | Opponent team display name. |
| `opponent_team_location` | `string` | Opponent team city / location. |
| `opponent_team_display_name` | `string` | Opponent team full display name. |
| `opponent_team_abbreviation` | `string` | Opponent team abbreviation. |
| `opponent_team_logo` | `string` | Opponent team logo URL. |
| `opponent_team_color` | `string` | Opponent team primary color (hex). |
| `opponent_team_alternate_color` | `string` | Opponent team alternate color (hex). |
| `opponent_team_score` | `number` | Opponent team's score. |

## `loadWnbaSchedule`

Release: [espn_wnba_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_schedules/wnba_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaSchedule({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `id` | `string` | Unique play identification number |
| `uid` | `string` | ESPN UID string. |
| `date` | `string` | Date in YYYY-MM-DD format. |
| `attendance` | `number` | Reported attendance. |
| `time_valid` | `boolean` | Time valid. |
| `neutral_site` | `boolean` | Neutral site. |
| `conference_competition` | `boolean` | Conference competition. |
| `play_by_play_available` | `boolean` | Whether play-by-play data is available. |
| `recent` | `boolean` | Recent. |
| `start_date` | `string` | Start date (YYYY-MM-DD). |
| `broadcast` | `string` | Broadcast information string. |
| `highlights` | `string` | Game highlight urls. |
| `notes_type` | `string` | Notes type. |
| `notes_headline` | `string` | Notes headline. |
| `broadcast_market` | `string` | Broadcast market label (e.g. 'national', 'home'). |
| `broadcast_name` | `string` | Broadcast name. |
| `type_id` | `string` | Type identifier (numeric). |
| `type_abbreviation` | `string` | Play type abbreviation |
| `venue_id` | `string` | Unique venue identifier. |
| `venue_full_name` | `string` | Venue full name. |
| `venue_address_city` | `string` | Venue address city. |
| `venue_address_state` | `string` | Venue address state / region. |
| `venue_indoor` | `boolean` | TRUE if the venue is indoors. |
| `status_clock` | `number` | Status clock. |
| `status_display_clock` | `string` | Status display clock. |
| `status_period` | `number` | Status period. |
| `status_type_id` | `string` | Unique identifier for status type. |
| `status_type_name` | `string` | Status type name. |
| `status_type_state` | `string` | Status type state. |
| `status_type_completed` | `boolean` | Status type completed. |
| `status_type_description` | `string` | Status type description. |
| `status_type_detail` | `string` | Status type detail. |
| `status_type_short_detail` | `string` | Status type short detail. |
| `format_regulation_periods` | `number` | Format regulation periods. |
| `home_id` | `string` | Unique identifier for home. |
| `home_uid` | `string` | Home team's uid. |
| `home_location` | `string` | Home team's location. |
| `home_name` | `string` | Home name. |
| `home_abbreviation` | `string` | Home team's abbreviation. |
| `home_display_name` | `string` | Home display name. |
| `home_short_display_name` | `string` | Home short display name. |
| `home_color` | `string` | Color code (hex) for home. |
| `home_alternate_color` | `string` | Color code (hex) for home alternate. |
| `home_is_active` | `boolean` | Home team's is active. |
| `home_venue_id` | `string` | Unique identifier for home venue. |
| `home_logo` | `string` | Home team logo URL. |
| `home_score` | `number` | Home team score at the time of the play. |
| `home_winner` | `boolean` | Home team's winner. |
| `home_linescores` | `string` | Stringified list of the home team's period-by-period scores from the ESPN schedule feed. |
| `home_records` | `string` | Stringified list of the home team's record summaries (overall/home/away) from the ESPN schedule feed. |
| `away_id` | `string` | Unique identifier for away. |
| `away_uid` | `string` | Away team's uid. |
| `away_location` | `string` | Away team's location. |
| `away_name` | `string` | Away name. |
| `away_abbreviation` | `string` | Away team's abbreviation. |
| `away_display_name` | `string` | Away display name. |
| `away_short_display_name` | `string` | Away short display name. |
| `away_color` | `string` | Color code (hex) for away. |
| `away_alternate_color` | `string` | Color code (hex) for away alternate. |
| `away_is_active` | `boolean` | Away team's is active. |
| `away_venue_id` | `string` | Unique identifier for away venue. |
| `away_logo` | `string` | Away team logo URL. |
| `away_score` | `number` | Away team score at the time of the play. |
| `away_winner` | `boolean` | Away team's winner. |
| `away_linescores` | `string` | Stringified list of the away team's period-by-period scores from the ESPN schedule feed. |
| `away_records` | `string` | Stringified list of the away team's record summaries (overall/home/away) from the ESPN schedule feed. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `status_type_alt_detail` | `string` | Status type alt detail. |
| `game_json` | `boolean` | Whether processed game JSON is available. |
| `game_json_url` | `string` | URL to the processed game JSON. |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `team_box` | `boolean` | Team box. |
| `player_box` | `boolean` | Player box. |

## `loadWnbaTeamBoxscore`

Release: [espn_wnba_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaTeamBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_team_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaTeamBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `team_id` | `string` | Unique team identifier. |
| `team_uid` | `string` | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_location` | `string` | Team city or location string. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `team_logo` | `string` | Team logo image URL. |
| `team_home_away` | `string` | Team home away. |
| `team_score` | `number` | Team's score / final score. |
| `team_winner` | `boolean` | TRUE if the team won this game. |
| `assists` | `number` | Total assists. |
| `blocks` | `number` | Total blocks. |
| `defensive_rebounds` | `number` | Defensive rebounds. |
| `fast_break_points` | `string` | Fast-break points scored. |
| `field_goal_pct` | `number` | Field goal percentage (0-1). |
| `field_goals_made` | `number` | Field goals made (2-pt + 3-pt). |
| `field_goals_attempted` | `number` | Field goal attempts (2-pt + 3-pt). |
| `flagrant_fouls` | `number` | Total flagrant fouls. |
| `fouls` | `number` | Personal fouls. |
| `free_throw_pct` | `number` | Free throw percentage (0-1). |
| `free_throws_made` | `number` | Free throws made. |
| `free_throws_attempted` | `number` | Free throw attempts. |
| `largest_lead` | `string` | Largest lead during the game. |
| `lead_changes` | `string` | Lead changes. |
| `lead_percentage` | `string` | Share of game time the team spent in the lead, as reported by ESPN. |
| `offensive_rebounds` | `number` | Offensive rebounds. |
| `points_in_paint` | `string` | Points scored in the paint. |
| `steals` | `number` | Total steals. |
| `team_turnovers` | `number` | Team turnovers (turnovers credited to the team rather than a player). |
| `technical_fouls` | `number` | Total technical fouls. |
| `three_point_field_goal_pct` | `number` | Three-point field goal percentage (0-1). |
| `three_point_field_goals_made` | `number` | Three-point field goals made. |
| `three_point_field_goals_attempted` | `number` | Three-point field goal attempts. |
| `total_rebounds` | `number` | Total rebounds. |
| `total_technical_fouls` | `number` | Total technical fouls (player + team). |
| `total_turnovers` | `number` | Total turnovers (player + team). |
| `turnover_points` | `string` | Turnover points. |
| `turnovers` | `number` | Total turnovers. |
| `opponent_team_id` | `string` | Unique identifier for the opponent team. |
| `opponent_team_uid` | `string` | Opponent team uid. |
| `opponent_team_slug` | `string` | Opponent team slug. |
| `opponent_team_location` | `string` | Opponent team city / location. |
| `opponent_team_name` | `string` | Opponent team display name. |
| `opponent_team_abbreviation` | `string` | Opponent team abbreviation. |
| `opponent_team_display_name` | `string` | Opponent team full display name. |
| `opponent_team_short_display_name` | `string` | Opponent team short display name. |
| `opponent_team_color` | `string` | Opponent team primary color (hex). |
| `opponent_team_alternate_color` | `string` | Opponent team alternate color (hex). |
| `opponent_team_logo` | `string` | Opponent team logo URL. |
| `opponent_team_score` | `number` | Opponent team's score. |

## `loadWnbaDraft`

Release: [espn_wnba_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_draft) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_draft/draft_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaDraft({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_draft(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaDraftRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `round` | `number` | Tournament / playoff round. |
| `round_display_name` | `string` | Human-readable label for the draft round, read from the ESPN round object's displayName falling back to its name; null whenever ESPN ships the modern flat picks array with no round objects, which is the case for every published season. |
| `pick` | `number` | Pick. |
| `overall_pick` | `number` | Overall pick. |
| `pick_traded` | `string` | ESPN's pick-level traded flag stringified as TRUE or FALSE, marking selections made with a pick that had changed hands (17 of the 45 published 2026 picks are TRUE). |
| `pick_notes` | `string` | Free-text annotation ESPN attaches to a pick, taken from notes and falling back to note; empty for every pick published so far. |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `athlete_uid` | `string` | ESPN athlete UID (universal identifier). |
| `athlete_guid` | `string` | ESPN athlete GUID. |
| `athlete_first_name` | `string` | Player first name. |
| `athlete_last_name` | `string` | Athlete last name. |
| `athlete_full_name` | `string` | Drafted player full name. |
| `athlete_display_name` | `string` | Athlete display name (full). |
| `athlete_short_name` | `string` | Athlete short display name. |
| `athlete_height` | `string` | Athlete height. |
| `athlete_weight` | `string` | Athlete weight. |
| `athlete_position_abbreviation` | `string` | Athlete position abbreviation (G / F / C). |
| `athlete_position_name` | `string` | Athlete position ('Guard', 'Forward', 'Center'). |
| `athlete_headshot_href` | `string` | Athlete headshot image URL. |
| `college_id` | `string` | Unique identifier for college. |
| `college_name` | `string` | College name. |
| `college_short_name` | `string` | College short name. |
| `college_abbreviation` | `string` | Short code for the drafted player's school, read from the athlete's ESPN college block; null throughout the published data because ESPN ships no college block on these picks. |
| `team_id` | `string` | Unique team identifier. |
| `team_uid` | `string` | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_location` | `string` | Team city or location string. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `team_logo` | `string` | Team logo image URL. |

## `loadWnbaGameRosters`

Release: [espn_wnba_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaGameRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaGameRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `game_id` | `string` | Unique game identifier. |
| `team_id` | `string` | Unique team identifier. |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `home_away` | `string` | Game venue label ('home' or 'away'). |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `athlete_uid` | `string` | ESPN athlete UID (universal identifier). |
| `athlete_guid` | `string` | ESPN athlete GUID. |
| `athlete_display_name` | `string` | Athlete display name (full). |
| `athlete_short_name` | `string` | Athlete short display name. |
| `athlete_first_name` | `string` | Player first name. |
| `athlete_last_name` | `string` | Athlete last name. |
| `athlete_jersey` | `string` | Athlete jersey number. |
| `athlete_position` | `string` | Athlete position. |
| `athlete_headshot` | `string` | Direct link to the player's ESPN headshot image, always of the form https://a.espncdn.com/i/headshots/wnba/players/full/\{athlete_id\}.png, and null for the few players ESPN has no photo for. |
| `starter` | `boolean` | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `did_not_play` | `boolean` | TRUE if the player did not appear in the game. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |
| `ejected` | `boolean` | TRUE if the player was ejected from the game. |
| `reason` | `string` | Reason. |

## `loadWnbaOfficials`

Release: [espn_wnba_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaOfficials({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `game_id` | `string` | Unique game identifier. |
| `official_id` | `string` | Unique official / referee identifier. |
| `official_uid` | `string` | ESPN's global uid string for the official, carried straight through from the officials payload; the Core v2 items ESPN serves omit it, so it is null in every published season. |
| `official_full_name` | `string` | The official's full name, taken from ESPN fullName and falling back to displayName; it equals first plus last name on every published row. |
| `official_display_name` | `string` | ESPN's display rendering of the official's name, which is byte-identical to official_full_name on every published row and therefore adds nothing. |
| `official_first_name` | `string` | Given name of the official as ESPN splits it out, the leading token of official_full_name. |
| `official_last_name` | `string` | Family name of the official as ESPN splits it out, the trailing token of official_full_name, with hyphenated surnames kept intact. |
| `official_order` | `number` | ESPN's 1-based position of the official within that game's crew; most games run 1 through 3 for a three-person crew and 40 of 573 games in 2024-2025 add a fourth. |
| `position_name` | `string` | Listed roster position ('Guard', 'Forward', 'Center'). |
| `position_display_name` | `string` | Position display name. |

## `loadWnbaPlayerSeasonStats`

Release: [espn_wnba_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_player_season_stats/player_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPlayerSeasonStats({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_player_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPlayerSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `athlete_display_name` | `string` | Athlete display name (full). |
| `athlete_first_name` | `string` | Player first name. |
| `athlete_last_name` | `string` | Athlete last name. |
| `athlete_position_abbreviation` | `string` | Athlete position abbreviation (G / F / C). |
| `athlete_jersey` | `string` | Athlete jersey number. |
| `team_id` | `string` | Unique team identifier. |
| `team_display_name` | `string` | Full team display name. |
| `category` | `string` | Category label. |
| `stat_label` | `string` | Human-readable label of the statistic (e.g. 'At bats'). |
| `stat_name` | `string` | Internal stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | ESPN's prose definition of the statistic on this row, for example The average number of points scored per game for avgPoints; combined made-attempted stats carry both halves joined by a hyphen. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadWnbaRosters`

Release: [espn_wnba_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `team_id` | `string` | Unique team identifier. |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `team_logo` | `string` | Team logo image URL. |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `uid` | `string` | ESPN UID string. |
| `guid` | `string` | Stable cross-league team GUID. |
| `full_name` | `string` | Player's full name. |
| `display_name` | `string` | Display name. |
| `short_name` | `string` | Short display name. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `jersey` | `string` | Jersey number worn by the player. |
| `position_abbreviation` | `string` | Position abbreviation ('G' / 'F' / 'C'). |
| `position_name` | `string` | Listed roster position ('Guard', 'Forward', 'Center'). |
| `position_id` | `string` | Unique position identifier. |
| `height` | `string` | Player height (string e.g. '6-2' or inches). |
| `weight` | `string` | Player weight in pounds. |
| `age` | `string` | Player age (in years). |
| `date_of_birth` | `string` | Date of birth (YYYY-MM-DD). |
| `birth_place_city` | `string` | Birth place city. |
| `birth_place_state` | `string` | Birth place state. |
| `birth_place_country` | `string` | Birth place country. |
| `experience_years` | `string` | Experience years. |
| `experience_display_value` | `string` | Experience display value. |
| `headshot_href` | `string` | Headshot image URL. |
| `headshot_alt` | `string` | Alternative-text label for the headshot. |
| `link_web` | `string` | Web link / URL. |
| `status_id` | `string` | Status identifier. |
| `status_name` | `string` | Status label. |
| `status_type` | `string` | Status type. |

## `loadWnbaShots`

Release: [espn_wnba_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_shots/shots_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaShots({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaShotsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `period_number` | `number` | Numeric period (1-4 for quarters; 5+ for OT). |
| `clock_display_value` | `string` | Game clock display string (e.g. '8:32'). |
| `team_id` | `string` | Unique team identifier. |
| `athlete_id_1` | `string` | Primary athlete identifier (e.g. shooter). |
| `athlete_id_2` | `string` | Secondary athlete identifier (e.g. assister / fouler). |
| `type_id` | `string` | Type identifier (numeric). |
| `type_text` | `string` | Display text for the type field. |
| `scoring_play` | `boolean` | TRUE if the play resulted in points scored. |
| `score_value` | `number` | Point value of the play (2 / 3 / 1). |
| `coordinate_x` | `number` | X coordinate on the court (half-court layout). |
| `coordinate_y` | `number` | Y coordinate on the court (half-court layout). |
| `coordinate_x_raw` | `number` | X coordinate as returned by the API before any adjustment. |
| `coordinate_y_raw` | `number` | Y coordinate as returned by the API before any adjustment. |
| `athlete_name_1` | `string` | Display name of the shooter, per ESPN participant order. |
| `athlete_name_2` | `string` | Display name of the secondary athlete on the shot (typically the assister), when present. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_mascot` | `string` | ESPN mascot (nickname) of the shooting team. |
| `team_abbrev` | `string` | Abbreviation for team. |

## `loadWnbaStandings`

Release: [espn_wnba_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_standings) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_standings/standings_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStandings({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_standings(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStandingsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `group_id` | `string` | ESPN group id. |
| `group_name` | `string` | Group name (conference / division). |
| `group_abbreviation` | `string` | Group abbreviation. |
| `group_short_name` | `string` | Short label of the standings group node the team sits under, read from ESPN shortName; the WNBA conference nodes ship only name and abbreviation, so it is null on every published row. |
| `team_id` | `string` | Unique team identifier. |
| `team_uid` | `string` | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_location` | `string` | Team city or location string. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `team_logo` | `string` | Team logo image URL. |
| `stat_name` | `string` | Internal stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_short_display_name` | `string` | Short human-readable stat name. |
| `stat_description` | `string` | ESPN's long-form explanation of the standings stat, such as Clinched Best League Record for clincher or Record last 10 games for lasttengames. |
| `stat_abbreviation` | `string` | ESPN's abbreviation for the standings stat, which can differ from stat_short_display_name (playoffSeed is SEED here but POS there) and is null on the record-split rows such as Home and vs. Conf. |
| `stat_type` | `string` | Stat type code (e.g. "win", "loss"). |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadWnbaTeamSeasonStats`

Release: [espn_wnba_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_team_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_team_season_stats/team_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2024) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaTeamSeasonStats({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_team_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaTeamSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `team_id` | `string` | Unique team identifier. |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_display_name` | `string` | Full team display name. |
| `team_short_display_name` | `string` | Short team display name (e.g. 'Aces'). |
| `team_color` | `string` | Team primary color (hex without leading '#'). |
| `team_alternate_color` | `string` | Team alternate color (hex without leading '#'). |
| `team_logo` | `string` | Team logo image URL. |
| `category` | `string` | Category label. |
| `stat_label` | `string` | Human-readable label of the statistic (e.g. 'At bats'). |
| `stat_name` | `string` | Internal stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | Human-readable description of the statistic the row reports. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadWnbaPlayerCrosswalk`

Release: [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_crosswalk/wnba_player_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPlayerCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_player_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPlayerCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `player_name` | `string` | Player name. |
| `espn_athlete_id` | `string` | ESPN athlete id. |
| `espn_full_name` | `string` | ESPN full name. |
| `espn_jersey` | `string` | ESPN jersey number. |
| `espn_position` | `string` | ESPN position abbreviation. |
| `wnba_player_id` | `string` | Player identifier on stats.wnba.com matched to the ESPN player. |
| `wnba_player_name` | `string` | Player display name on the stats.wnba.com side of the crosswalk. |
| `wnba_jersey_num` | `string` | Jersey number listed on the stats.wnba.com side of the crosswalk. |
| `wnba_position` | `string` | Position listed on the stats.wnba.com side of the crosswalk. |
| `fox_athlete_id` | `string` | Fox athlete id (NA if unmatched). |
| `fox_player` | `string` | Fox player name (NA if unmatched). |
| `fox_jersey` | `string` | Fox jersey number (NA if unmatched). |
| `fox_position_group` | `string` | Fox position group label (NA if unmatched). |
| `yahoo_player_id` | `string` | Yahoo player id (NA placeholder). |
| `yahoo_player_name` | `string` | Yahoo player name (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |
| `match_keys` | `string` | NA (reserved for future use). |

## `loadWnbaScheduleCrosswalk`

Release: [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_crosswalk/wnba_schedule_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaScheduleCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_schedule_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaScheduleCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `wnba_game_id` | `string` | Game identifier on stats.wnba.com matched to the ESPN game. |
| `wnba_game_code` | `string` | stats.wnba.com game code (date/matchup slug) for the matched game. |
| `wnba_home_team_id` | `string` | Home team identifier on stats.wnba.com for the matched game. |
| `wnba_away_team_id` | `string` | Away team identifier on stats.wnba.com for the matched game. |
| `fox_game_id` | `string` | Fox game id (NA placeholder). |
| `fox_home_team_id` | `string` | Home team identifier on Fox Sports for the matched game. |
| `fox_away_team_id` | `string` | Away team identifier on Fox Sports for the matched game. |
| `yahoo_game_id` | `string` | Yahoo game id (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |

## `loadWnbaTeamCrosswalk`

Release: [wnba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_crosswalk/wnba_team_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaTeamCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_team_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaTeamCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `espn_abbreviation` | `string` | ESPN abbreviation. |
| `espn_display_name` | `string` | ESPN display name (school + mascot). |
| `espn_short_name` | `string` | ESPN short name. |
| `espn_location` | `string` | ESPN school/location only. |
| `espn_mascot` | `string` | ESPN team mascot/nickname. |
| `wnba_team_id` | `string` | WNBA Stats team id. |
| `wnba_team_tricode` | `string` | WNBA Stats tricode. |
| `wnba_team_name` | `string` | WNBA Stats team name. |
| `wnba_team_city` | `string` | WNBA Stats team city. |
| `wnba_team_slug` | `string` | WNBA Stats team slug. |
| `fox_team_id` | `string` | Fox Bifrost team id (NA if unmatched). |
| `fox_team_name` | `string` | Fox team name (NA if unmatched). |
| `yahoo_team_id` | `string` | Yahoo team id (NA placeholder). |
| `yahoo_team_abbreviation` | `string` | Yahoo abbreviation (NA placeholder). |
| `yahoo_team_name` | `string` | Yahoo team name (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |

## `loadWnbaPlayerCore`

Release: [espn_wnba_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_wnba_player_core) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_wnba_player_core/player_core_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2003) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPlayerCore({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_player_core(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPlayerCoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `guid` | `string` | Stable cross-league team GUID. |
| `uid` | `string` | ESPN UID string. |
| `slug` | `string` | URL-safe identifier. |
| `type` | `string` | Record type / category. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `full_name` | `string` | Player's full name. |
| `display_name` | `string` | Display name. |
| `short_name` | `string` | Short display name. |
| `height` | `number` | Player height (string e.g. '6-2' or inches). |
| `display_height` | `string` | Player height in display format (e.g. '6-2'). |
| `weight` | `number` | Player weight in pounds. |
| `display_weight` | `string` | Player weight in display format (e.g. '180 lbs'). |
| `age` | `number` | Player age (in years). |
| `date_of_birth` | `string` | Date of birth (YYYY-MM-DD). |
| `birth_city` | `string` | Birth city. |
| `birth_state` | `string` | Birth state / region. |
| `birth_country` | `string` | Player birth country. |
| `jersey` | `string` | Jersey number worn by the player. |
| `position_id` | `string` | Unique position identifier. |
| `position_name` | `string` | Listed roster position ('Guard', 'Forward', 'Center'). |
| `position_abbreviation` | `string` | Position abbreviation ('G' / 'F' / 'C'). |
| `position_display_name` | `string` | Position display name. |
| `college_id` | `string` | Unique identifier for college. |
| `current_team_id` | `string` | Player's current team identifier. |
| `headshot_href` | `string` | Headshot image URL. |
| `experience_years` | `number` | Experience years. |
| `status_id` | `string` | Status identifier. |
| `status_name` | `string` | Status label. |
| `status_type` | `string` | Status type. |
| `draft_year` | `number` | Draft year (4-digit). |
| `draft_round` | `number` | Round of the draft selection. |
| `draft_selection` | `number` | Draft selection. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |

## `loadWnbaPlayerImpact`

Release: [wnba_player_impact](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_player_impact) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_player_impact/wnba_player_impact_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaPlayerImpact({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_player_impact(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaPlayerImpactRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `teams` | `string` | Nested list of member-team membership spans. |
| `season` | `number \| bigint` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `o_rapm` | `number` | Offensive RAPM: ridge-regularized on/off impact on team offense, in points per 100 possessions. |
| `d_rapm` | `number` | Defensive RAPM: ridge-regularized on/off impact on team defense, in points per 100 possessions. |
| `rapm` | `number` | Total RAPM: offensive plus defensive regularized on/off impact, in points per 100 possessions. |
| `off_poss` | `number \| bigint` | Offensive possessions the player was on the floor for in the RAPM sample. |
| `def_poss` | `number \| bigint` | Defensive possessions the player was on the floor for in the RAPM sample. |
| `o_adj_rapm` | `number` | Offensive prior-informed RAPM: ridge shrunk toward a box-score prior, in points per 100 possessions. |
| `d_adj_rapm` | `number` | Defensive prior-informed RAPM: ridge shrunk toward a box-score prior, in points per 100 possessions. |
| `adj_rapm` | `number` | Total prior-informed RAPM (offense plus defense), in points per 100 possessions. |
| `ospm` | `number` | Offensive statistical plus-minus: box-score features regressed onto the offensive RAPM target, per 100 possessions. |
| `dspm` | `number` | Defensive statistical plus-minus: box-score features regressed onto the defensive RAPM target, per 100 possessions. |
| `spm` | `number` | Statistical plus-minus: offensive plus defensive box-score estimate of the RAPM target, per 100 possessions. |
| `min` | `number` | Minutes played. |
| `gp` | `number \| bigint` | Games played. |
| `obpm` | `number` | Offensive box plus/minus. |
| `dbpm` | `number` | Defensive box plus/minus. |
| `bpm` | `number` | Career box plus/minus. |
| `war` | `number` | Wins above replacement implied by the player's impact and playing time, calibrated from team points-per-win. |
| `darko_filtered_skill` | `number` | DARKO-style Kalman-filtered estimate of the player's current skill level. |
| `darko_projected_rating` | `number` | DARKO-style projected forward rating, including the empirical aging-curve drift. |
| `darko_projected_sd` | `number` | Posterior standard deviation of the DARKO-style projected rating. |

## `loadWnbaStatsCoaches`

Release: [wnba_stats_coaches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_coaches) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_coaches/coaches_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsCoaches({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_coaches(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsCoachesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `coach_id` | `string` | Unique identifier for coach. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `coach_name` | `string` | Full name of the staff member as the feed renders it, exactly first_name plus a space plus last_name on every published row. |
| `is_assistant` | `number \| bigint` | Numeric staff-role code rather than a boolean flag: 1 head coach, 2 assistant coach, 3 trainer, 9 associate head coach, mapping one-to-one onto coach_type. |
| `coach_type` | `string` | Job title of the staff member, one of Head Coach, Associate Head Coach, Assistant Coach or Trainer in the published data. |
| `sort_sequence` | `unknown` | Ordering field passed through unchanged from the stats.wnba.com coaches result set; it arrives empty, so every published row is null. |
| `sub_sort_sequence` | `number \| bigint` | Secondary display-ordering rank that tracks coach_type exactly: 1 head coach, 2 associate head coach, 5 assistant coach, 7 trainer. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadWnbaStatsDraft`

Release: [wnba_stats_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_draft) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_draft/draft_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsDraft({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_draft(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsDraftRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `person_id` | `string` | Unique player identifier (V3 endpoints). |
| `player_name` | `string` | Player name. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `round_number` | `number \| bigint` | Numeric round. |
| `round_pick` | `number \| bigint` | Round pick. |
| `overall_pick` | `number \| bigint` | Overall pick. |
| `draft_type` | `string` | CONSTANT in the published asset: every row reads 'Draft', so it does not currently distinguish the main draft from any other selection event. |
| `team_id` | `string` | Unique team identifier. |
| `team_city` | `string` | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `organization` | `string` | Organization. |
| `organization_type` | `string` | Organization type. |
| `player_profile_flag` | `number \| bigint` | Player profile flag. |

## `loadWnbaStatsGameRosters`

Release: [wnba_stats_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsGameRosters({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsGameRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `jersey_num` | `string` | Jersey number worn by the player. |
| `team_id` | `string` | Unique team identifier. |
| `team_city` | `string` | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `game_id` | `string` | Unique game identifier. |

## `loadWnbaStatsOfficials`

Release: [wnba_stats_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsOfficials({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `official_id` | `string` | Unique official / referee identifier. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `jersey_num` | `string` | Jersey number worn by the player. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `game_id` | `string` | Unique game identifier. |

## `loadWnbaStatsPbp`

Release: [wnba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_pbp/wnba_play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsPbp({ seasons: 2025, columns: ['game_id', 'period', 'clock', 'event_type', 'description'] });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `order_index` | `number \| bigint` | Stable ordering index of the event within the game's stats.wnba.com play-by-play. |
| `action_number` | `number \| bigint` | Sequential action number within a game (V3 PBP). |
| `clock` | `string` | Game clock value. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `team_id` | `string` | Unique team identifier. |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `person_id` | `string` | Unique player identifier (V3 endpoints). |
| `player_name` | `string` | Player name. |
| `player_name_i` | `string` | Player name i. |
| `x_legacy` | `number \| bigint` | V2-format X coordinate (preserved for V3-to-V2 compatibility). |
| `y_legacy` | `number \| bigint` | V2-format Y coordinate (preserved for V3-to-V2 compatibility). |
| `shot_distance` | `number \| bigint` | Shot distance from the basket, in feet. |
| `shot_result` | `string` | Shot result ('Made' / 'Missed'). |
| `is_field_goal` | `number \| bigint` | 1 if the action was a field goal; 0 otherwise. |
| `score_home` | `string` | Score home. |
| `score_away` | `string` | Score away. |
| `points_total` | `number \| bigint` | Running total of points scored. |
| `location` | `string` | Filter results by game location. |
| `description` | `string` | Long-form description text. |
| `action_type` | `string` | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `sub_type` | `string` | Action sub-type label. |
| `video_available` | `number \| bigint` | Video available. |
| `shot_value` | `number \| bigint` | Point value of the shot (2 or 3). |
| `action_id` | `string` | Unique action identifier within a game (V3 PBP). |
| `game_id` | `string` | Unique game identifier. |
| `seconds_remaining` | `number` | Seconds remaining in the period. |
| `event_type` | `string` | Event / play type code (V2 PBP). |
| `is_made_shot` | `boolean` | True when the event is a made field goal. |
| `is_missed_shot` | `boolean` | True when the event is a missed field goal. |
| `is_free_throw` | `boolean` | True when the event is a free throw attempt. |
| `is_rebound` | `boolean` | True when the event is a rebound (player or team). |
| `is_turnover` | `boolean` | `TRUE` if the play was a turnover. |
| `is_foul` | `boolean` | True when the event is a foul. |
| `is_substitution` | `boolean` | True when the event is a substitution. |
| `is_jump_ball` | `boolean` | True when the event is a jump ball. |
| `is_timeout` | `boolean` | True when the event is a timeout. |
| `is_period` | `boolean` | True for period-start and period-end marker events. |
| `season` | `number \| bigint` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |

## `loadWnbaStatsPossessions`

Release: [wnba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_possessions) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_possessions/wnba_possessions_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsPossessions({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_possessions(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsPossessionsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `possession_number` | `number \| bigint` | Possession number. |
| `offense_team_id` | `string` | Unique identifier for offense team. |
| `defense_team_id` | `string` | stats.wnba.com identifier of the defending team for the possession. |
| `start_order_index` | `number \| bigint` | order_index of the first event in the possession; joins to the wnba_stats_pbp table. |
| `end_order_index` | `number \| bigint` | order_index of the last event in the possession; joins to the wnba_stats_pbp table. |
| `start_seconds_remaining` | `number` | Seconds remaining in the period when the possession began. |
| `end_seconds_remaining` | `number` | Seconds remaining in the period when the possession ended. |
| `points` | `number \| bigint` | Points scored. |
| `is_second_chance` | `boolean` | True when the possession continued after an offensive rebound (contains a second-chance segment). |
| `number_in_period` | `number \| bigint` | Possession number within the period, resetting to 1 at each period start. |
| `possession_start_type` | `string` | How the possession began: OffDeadball, OffTimeout, OffMadeShot, OffMissedShot, or OffLiveBallTurnover. |
| `count_as_possession` | `boolean` | False only for a possession starting with 2 seconds or less left in the period and no made basket before the period ends. |
| `fg2a` | `number \| bigint` | Two-point field goals attempted by the offense during the possession. |
| `fg2m` | `number \| bigint` | Two-point field goals made by the offense during the possession. |
| `fg3a` | `number \| bigint` | Three-point field goal attempts. |
| `fg3m` | `number \| bigint` | Three-point field goals made. |
| `fta` | `number \| bigint` | Free throw attempts. |
| `ftm` | `number \| bigint` | Free throws made. |
| `oreb` | `number \| bigint` | Offensive rebounds. |
| `dreb` | `number \| bigint` | Defensive rebounds. |
| `tov` | `number \| bigint` | Turnovers. |
| `off_player_1` | `number \| bigint` | stats.wnba.com identifier of offensive on-court player 1 of 5 for the possession (unordered slot). |
| `off_player_2` | `number \| bigint` | stats.wnba.com identifier of offensive on-court player 2 of 5 for the possession (unordered slot). |
| `off_player_3` | `number \| bigint` | stats.wnba.com identifier of offensive on-court player 3 of 5 for the possession (unordered slot). |
| `off_player_4` | `number \| bigint` | stats.wnba.com identifier of offensive on-court player 4 of 5 for the possession (unordered slot). |
| `off_player_5` | `number \| bigint` | stats.wnba.com identifier of offensive on-court player 5 of 5 for the possession (unordered slot). |
| `def_player_1` | `number \| bigint` | stats.wnba.com identifier of defensive on-court player 1 of 5 for the possession (unordered slot). |
| `def_player_2` | `number \| bigint` | stats.wnba.com identifier of defensive on-court player 2 of 5 for the possession (unordered slot). |
| `def_player_3` | `number \| bigint` | stats.wnba.com identifier of defensive on-court player 3 of 5 for the possession (unordered slot). |
| `def_player_4` | `number \| bigint` | stats.wnba.com identifier of defensive on-court player 4 of 5 for the possession (unordered slot). |
| `def_player_5` | `number \| bigint` | stats.wnba.com identifier of defensive on-court player 5 of 5 for the possession (unordered slot). |
| `season` | `number \| bigint` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |

## `loadWnbaStatsGameLineups`

Release: [wnba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_game_lineups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_game_lineups/wnba_lineups_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsGameLineups({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_game_lineups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsGameLineupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `action_number` | `number \| bigint` | Sequential action number within a game (V3 PBP). |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `home_player_1` | `number \| bigint` | stats.wnba.com identifier of home on-court player 1 of 5 for the lineup stint. |
| `home_player_2` | `number \| bigint` | stats.wnba.com identifier of home on-court player 2 of 5 for the lineup stint. |
| `home_player_3` | `number \| bigint` | stats.wnba.com identifier of home on-court player 3 of 5 for the lineup stint. |
| `home_player_4` | `number \| bigint` | stats.wnba.com identifier of home on-court player 4 of 5 for the lineup stint. |
| `home_player_5` | `number \| bigint` | stats.wnba.com identifier of home on-court player 5 of 5 for the lineup stint. |
| `away_player_1` | `number \| bigint` | stats.wnba.com identifier of away on-court player 1 of 5 for the lineup stint. |
| `away_player_2` | `number \| bigint` | stats.wnba.com identifier of away on-court player 2 of 5 for the lineup stint. |
| `away_player_3` | `number \| bigint` | stats.wnba.com identifier of away on-court player 3 of 5 for the lineup stint. |
| `away_player_4` | `number \| bigint` | stats.wnba.com identifier of away on-court player 4 of 5 for the lineup stint. |
| `away_player_5` | `number \| bigint` | stats.wnba.com identifier of away on-court player 5 of 5 for the lineup stint. |
| `season` | `number \| bigint` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |

## `loadWnbaStatsPlayerBoxscores`

Release: [wnba_stats_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_player_boxscores/player_boxscores_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsPlayerBoxscores({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_player_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsPlayerBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `side` | `string` | Side label (e.g. 'home', 'away', or 'overUnder'). |
| `person_id` | `string` | Unique player identifier (V3 endpoints). |
| `first_name` | `string` | Player's first name. |
| `family_name` | `string` | Player's family / last name. |
| `name_i` | `string` | Initialed name (e.g. 'A. Wilson'). |
| `player_slug` | `string` | URL-safe player identifier. |
| `position` | `string` | Listed roster position (G, F, C, etc.). |
| `comment` | `string` | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | `string` | Jersey number worn by the player. |
| `minutes` | `string` | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `field_goals_made` | `number \| bigint` | Field goals made (2-pt + 3-pt). |
| `field_goals_attempted` | `number \| bigint` | Field goal attempts (2-pt + 3-pt). |
| `field_goals_percentage` | `number` | Field goal percentage (0-1 decimal). |
| `three_pointers_made` | `number \| bigint` | Three-point field goals made. |
| `three_pointers_attempted` | `number \| bigint` | Three-point field goal attempts. |
| `three_pointers_percentage` | `number` | Three-point field goal percentage (0-1 decimal). |
| `free_throws_made` | `number \| bigint` | Free throws made. |
| `free_throws_attempted` | `number \| bigint` | Free throw attempts. |
| `free_throws_percentage` | `number` | Free throw percentage (0-1 decimal). |
| `rebounds_offensive` | `number \| bigint` | Offensive rebounds. |
| `rebounds_defensive` | `number \| bigint` | Defensive rebounds. |
| `rebounds_total` | `number \| bigint` | Total rebounds. |
| `assists` | `number \| bigint` | Total assists. |
| `steals` | `number \| bigint` | Total steals. |
| `blocks` | `number \| bigint` | Total blocks. |
| `turnovers` | `number \| bigint` | Total turnovers. |
| `fouls_personal` | `number \| bigint` | Personal fouls. |
| `points` | `number \| bigint` | Points scored. |
| `plus_minus_points` | `number` | Plus/minus point differential while on court. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |

## `loadWnbaStatsPlayerGameLogs`

Release: [wnba_stats_player_game_logs](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_player_game_logs) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_player_game_logs/player_game_logs_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsPlayerGameLogs({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_player_game_logs(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsPlayerGameLogsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season_id` | `string` | Unique season identifier. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `game_id` | `string` | Unique game identifier. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `matchup` | `string` | Matchup. |
| `wl` | `string` | Wl. |
| `min` | `number \| bigint` | Minutes played. |
| `fgm` | `number \| bigint` | Field goals made. |
| `fga` | `number \| bigint` | Field goals attempted. |
| `fg_pct` | `number` | Field-goal percentage. |
| `fg3m` | `number \| bigint` | Three-point field goals made. |
| `fg3a` | `number \| bigint` | Three-point field goals attempted. |
| `fg3_pct` | `number` | Three-point percentage. |
| `ftm` | `number \| bigint` | Free throws made. |
| `fta` | `number \| bigint` | Free throws attempted. |
| `ft_pct` | `number` | Free-throw percentage. |
| `oreb` | `number \| bigint` | Offensive rebounds collected. |
| `dreb` | `number \| bigint` | Defensive rebounds collected. |
| `reb` | `number \| bigint` | Total rebounds collected. |
| `ast` | `number \| bigint` | Assists credited. |
| `stl` | `number \| bigint` | Steals recorded. |
| `blk` | `number \| bigint` | Total shots blocked. |
| `tov` | `number \| bigint` | Turnovers committed. |
| `pf` | `number \| bigint` | Personal fouls committed. |
| `pts` | `number \| bigint` | Total points scored. |
| `plus_minus` | `number \| bigint` | Plus-minus point differential. |
| `video_available` | `number \| bigint` | Video available. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `fantasy_pts` | `number` | Fantasy points. |
| `measure_type` | `string` | Stats API measure-type slice the row was pulled from (e.g. 'Base'). |

## `loadWnbaStatsRosters`

Release: [wnba_stats_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsRosters({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `league_id` | `string` | League identifier ('10' = WNBA). |
| `player` | `string` | Player name. |
| `nickname` | `string` | Team or athlete nickname. |
| `player_slug` | `string` | URL-safe player identifier. |
| `num` | `string` | Jersey number worn by the player. |
| `position` | `string` | Listed roster position (G, F, C, etc.). |
| `height` | `string` | Player height (string e.g. '6-2' or inches). |
| `weight` | `string` | Player weight in pounds. |
| `birth_date` | `string` | Date of birth (YYYY-MM-DD). |
| `age` | `number` | Player age (in years). |
| `exp` | `string` | Years of WNBA playing experience entering the season ('R' = rookie). |
| `school` | `string` | Player's school / college (when distinct from 'college'). |
| `player_id` | `string` | Unique player identifier. |
| `how_acquired` | `string` | How the team acquired the player (draft, trade, free agency). |
| `supplemental_status` | `number \| bigint` | Numeric supplemental roster-status code from the stats.wnba.com roster feed. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadWnbaStatsSchedules`

Release: [wnba_stats_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_schedules/wnba_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsSchedules({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_schedules(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsSchedulesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `matchup` | `string` | Matchup. |
| `home_team_id` | `string` | Unique identifier for the home team. |
| `home_team_abbreviation` | `string` | Home team abbreviation. |
| `home_team_name` | `string` | Home team name. |
| `home_pts` | `number \| bigint` | Final points scored by the home team. |
| `home_wl` | `string` | Result for the home team ('W' or 'L'); null before the game is final. |
| `away_team_id` | `string` | Unique identifier for the away team. |
| `away_team_abbreviation` | `string` | Away team abbreviation. |
| `away_team_name` | `string` | Away team name. |
| `away_pts` | `number \| bigint` | Final points scored by the away team. |
| `away_wl` | `string` | Result for the away team ('W' or 'L'); null before the game is final. |

## `loadWnbaStatsShots`

Release: [wnba_stats_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_shots/shots_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsShots({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsShotsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `clock` | `string` | Game clock value. |
| `team_id` | `string` | Unique team identifier. |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `person_id` | `string` | Unique player identifier (V3 endpoints). |
| `player_name` | `string` | Player name. |
| `action_type` | `string` | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `sub_type` | `string` | Action sub-type label. |
| `shot_result` | `string` | Shot result ('Made' / 'Missed'). |
| `shot_value` | `number \| bigint` | Point value of the shot (2 or 3). |
| `shot_distance` | `number \| bigint` | Shot distance from the basket, in feet. |
| `x_legacy` | `number \| bigint` | V2-format X coordinate (preserved for V3-to-V2 compatibility). |
| `y_legacy` | `number \| bigint` | V2-format Y coordinate (preserved for V3-to-V2 compatibility). |
| `description` | `string` | Long-form description text. |
| `score_home` | `string` | Score home. |
| `score_away` | `string` | Score away. |

## `loadWnbaStatsTeamBoxscores`

Release: [wnba_stats_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_stats_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_stats_team_boxscores/team_boxscores_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaStatsTeamBoxscores({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_stats_team_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaStatsTeamBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `side` | `string` | Side label (e.g. 'home', 'away', or 'overUnder'). |
| `minutes` | `string` | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `field_goals_made` | `number \| bigint` | Field goals made (2-pt + 3-pt). |
| `field_goals_attempted` | `number \| bigint` | Field goal attempts (2-pt + 3-pt). |
| `field_goals_percentage` | `number` | Field goal percentage (0-1 decimal). |
| `three_pointers_made` | `number \| bigint` | Three-point field goals made. |
| `three_pointers_attempted` | `number \| bigint` | Three-point field goal attempts. |
| `three_pointers_percentage` | `number` | Three-point field goal percentage (0-1 decimal). |
| `free_throws_made` | `number \| bigint` | Free throws made. |
| `free_throws_attempted` | `number \| bigint` | Free throw attempts. |
| `free_throws_percentage` | `number` | Free throw percentage (0-1 decimal). |
| `rebounds_offensive` | `number \| bigint` | Offensive rebounds. |
| `rebounds_defensive` | `number \| bigint` | Defensive rebounds. |
| `rebounds_total` | `number \| bigint` | Total rebounds. |
| `assists` | `number \| bigint` | Total assists. |
| `steals` | `number \| bigint` | Total steals. |
| `blocks` | `number \| bigint` | Total blocks. |
| `turnovers` | `number \| bigint` | Total turnovers. |
| `fouls_personal` | `number \| bigint` | Personal fouls. |
| `points` | `number \| bigint` | Points scored. |
| `plus_minus_points` | `number` | Plus/minus point differential while on court. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |

## `loadWnbaGroups`

Release: [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_groups/wnba_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. wnba:east) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaGroups();
// snake_case alias (py/R parity): sdv.wnba.load_wnba_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("wnba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (calendar year). |
| `last_season` | `number` | Last season in which the group had at least one member (calendar year). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadWnbaGroupSeasons`

Release: [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_groups/wnba_group_seasons.parquet`

:::caution[Coverage]
One season-less file: one row per group per season it existed, with its name, short name, abbreviation and parent group AS OF that season (never today's label applied to the past) and its member count. season is the calendar year.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaGroupSeasons();
// snake_case alias (py/R parity): sdv.wnba.load_wnba_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("wnba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (calendar year). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadWnbaGroupAliases`

Release: [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_groups/wnba_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, sdv, wnba_stats) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaGroupAliases();
// snake_case alias (py/R parity): sdv.wnba.load_wnba_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("wnba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, sdv, wnba_stats); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (calendar year); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (calendar year); null = unbounded (still in use). |

## `loadWnbaTeamGroupSeasons`

Release: [wnba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/wnba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/wnba_groups/wnba_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id; team_id_source names the id space. season is the calendar year; seasons 1997-2026.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1997) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.wnba.loadWnbaTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.wnba.load_wnba_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadWnbaTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("wnba"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (calendar year). |
| `team_id` | `string` | Team id as a string: the ESPN team id where ESPN covers the team, otherwise the league's own id; team_id_source says which. |
| `team_id_source` | `string` | Id space of team_id (in this table: espn). |
| `team_name` | `string` | Team name as of that season, not today's. |
| `subdivision_id` | `string` | SDV group_id of the team's subdivision that season (e.g. FBS / FCS, Division I); null where the league has no subdivision level. |
| `conference_id` | `string` | SDV group_id of the team's conference that season; null where the team had no conference (an independent, or a season played without conferences). |
| `division_id` | `string` | SDV group_id of the team's division that season; null where the level does not apply. |
| `source` | `string` | Source the membership was taken from -- the most reliable per-season source for that era. |
| `sources_agree` | `boolean` | Whether a second source agreed on the membership; null when only one source covers the season. |
| `notes` | `string` | Builder notes on the team-season, such as a source disagreement or which of several listed memberships was kept. |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/releases.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/loaders)._
