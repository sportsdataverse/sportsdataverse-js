---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.nba` — dataset loaders

41 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadNbaPbp`](#loadnbapbp) | [espn_nba_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_pbp) | 2002+ |
| [`loadNbaPlayerBoxscore`](#loadnbaplayerboxscore) | [espn_nba_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_boxscores) | 2002+ |
| [`loadNbaSchedule`](#loadnbaschedule) | [espn_nba_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_schedules) | 2002+ |
| [`loadNbaTeamBoxscore`](#loadnbateamboxscore) | [espn_nba_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_team_boxscores) | 2002+ |
| [`loadNbaGameRosters`](#loadnbagamerosters) | [espn_nba_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_game_rosters) | 2002+ |
| [`loadNbaOfficials`](#loadnbaofficials) | [espn_nba_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_officials) | 2002+ |
| [`loadNbaShots`](#loadnbashots) | [espn_nba_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_shots) | 2002+ |
| [`loadNbaStandings`](#loadnbastandings) | [espn_nba_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_standings) | 2002+ |
| [`loadNbaPlayerSeasonStats`](#loadnbaplayerseasonstats) | [espn_nba_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_season_stats) | 2002+ |
| [`loadNbaTeamSeasonStats`](#loadnbateamseasonstats) | [espn_nba_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_team_season_stats) | 2002+ |
| [`loadNbaDraft`](#loadnbadraft) | [espn_nba_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_draft) | 2003+ |
| [`loadNbaRosters`](#loadnbarosters) | [espn_nba_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_rosters) | 2025+ |
| [`loadNbaStatsSchedules`](#loadnbastatsschedules) | [nba_stats_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_schedules) | 1996+ |
| [`loadNbaStatsCoaches`](#loadnbastatscoaches) | [nba_stats_coaches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_coaches) | 1996+ |
| [`loadNbaStatsGameRosters`](#loadnbastatsgamerosters) | [nba_stats_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_rosters) | 1996+ |
| [`loadNbaStatsLineups`](#loadnbastatslineups) | [nba_stats_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_lineups) | 2007+ |
| [`loadNbaStatsLineupsV3`](#loadnbastatslineupsv3) *(deprecated)* | [nba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_lineups) | 1996+ |
| [`loadNbaStatsOfficials`](#loadnbastatsofficials) | [nba_stats_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_officials) | 1996+ |
| [`loadNbaStatsPbp`](#loadnbastatspbp) | [nba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_pbp) | 1996+ |
| [`loadNbaStatsPossessions`](#loadnbastatspossessions) | [nba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_possessions) | 1996+ |
| [`loadNbaStatsGameLineups`](#loadnbastatsgamelineups) | [nba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_lineups) | 1996+ |
| [`loadNbaStatsGameMatchups`](#loadnbastatsgamematchups) | [nba_stats_game_matchups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_matchups) | 2017+ |
| [`loadNbaStatsPbpV3`](#loadnbastatspbpv3) *(deprecated)* | [nba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_pbp) | 1996+ |
| [`loadNbaStatsPlayerBoxscores`](#loadnbastatsplayerboxscores) | [nba_stats_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_boxscores) | 1996+ |
| [`loadNbaStatsPlayerGameLogs`](#loadnbastatsplayergamelogs) | [nba_stats_player_game_logs](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_game_logs) | 1996+ |
| [`loadNbaStatsPlayerSeasonStats`](#loadnbastatsplayerseasonstats) | [nba_stats_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_season_stats) | 1996+ |
| [`loadNbaStatsPossessionsV3`](#loadnbastatspossessionsv3) *(deprecated)* | [nba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_possessions) | 1996+ |
| [`loadNbaStatsRosters`](#loadnbastatsrosters) | [nba_stats_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_rosters) | 1996+ |
| [`loadNbaStatsShots`](#loadnbastatsshots) | [nba_stats_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_shots) | 1996+ |
| [`loadNbaStatsStandings`](#loadnbastatsstandings) | [nba_stats_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_standings) | 1996+ |
| [`loadNbaStatsTeamBoxscores`](#loadnbastatsteamboxscores) | [nba_stats_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_team_boxscores) | 1996+ |
| [`loadNbaStatsTeamSeasonStats`](#loadnbastatsteamseasonstats) | [nba_stats_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_team_season_stats) | 1996+ |
| [`loadNbaPlayerCrosswalk`](#loadnbaplayercrosswalk) | [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) | 2026+ |
| [`loadNbaScheduleCrosswalk`](#loadnbaschedulecrosswalk) | [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) | 2026+ |
| [`loadNbaTeamCrosswalk`](#loadnbateamcrosswalk) | [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) | 2026+ |
| [`loadNbaPlayerCore`](#loadnbaplayercore) | [espn_nba_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_core) | 2002+ |
| [`loadNbaPlayerImpact`](#loadnbaplayerimpact) | [nba_player_impact](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_player_impact) | 1996+ |
| [`loadNbaGroups`](#loadnbagroups) | [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) | one asset |
| [`loadNbaGroupSeasons`](#loadnbagroupseasons) | [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) | one asset |
| [`loadNbaGroupAliases`](#loadnbagroupaliases) | [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) | one asset |
| [`loadNbaTeamGroupSeasons`](#loadnbateamgroupseasons) | [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) | 1971+ |

## `loadNbaPbp`

Release: [espn_nba_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPbp({ seasons: 2024, columns: ['game_id', 'sequence_number', 'type_text', 'text', 'score_value'] });
// snake_case alias (py/R parity): sdv.nba.load_nba_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_play_number` | `number` | Sequential play number within the game. |
| `id` | `string` | Id. |
| `sequence_number` | `number` | Sequence number representing a shot-possession (V3 PBP). |
| `type_id` | `string` | Type identifier (numeric). |
| `type_text` | `string` | Display text for the type field. |
| `text` | `string` | Text description of the play / record. |
| `away_score` | `number` | Away team score at the time of the play. |
| `home_score` | `number` | Home team score at the time of the play. |
| `period_number` | `number` | Numeric period (1-4 for quarters; 5+ for OT). |
| `period_display_value` | `string` | Period display label (e.g. '1st Quarter', 'OT'). |
| `clock_display_value` | `string` | Game clock display string (e.g. '8:32'). |
| `scoring_play` | `boolean` | TRUE if the play resulted in points scored. |
| `score_value` | `number` | Point value of the play (2 / 3 / 1). |
| `team_id` | `string` | Unique team identifier. |
| `athlete_id_1` | `string` | Primary athlete identifier (e.g. shooter). |
| `athlete_id_2` | `string` | Secondary athlete identifier (e.g. assister / fouler). |
| `athlete_id_3` | `string` | Athlete id 3. |
| `wallclock` | `string` | Wallclock. |
| `shooting_play` | `boolean` | TRUE if the play was a shooting attempt. |
| `coordinate_x_raw` | `number` | X coordinate as returned by the API before any adjustment. |
| `coordinate_y_raw` | `number` | Y coordinate as returned by the API before any adjustment. |
| `points_attempted` | `number` | Point value attempted on the shot (2 or 3; 1 for a free throw). |
| `short_description` | `string` | Short text description of the play from ESPN. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `home_team_id` | `string` | Unique identifier for the home team. |
| `home_team_name` | `string` | Home team name. |
| `home_team_mascot` | `string` | Home team mascot. |
| `home_team_abbrev` | `string` | Home team three-letter abbreviation. |
| `home_team_name_alt` | `string` | Alternate home team name. |
| `away_team_id` | `string` | Unique identifier for the away team. |
| `away_team_name` | `string` | Away team name. |
| `away_team_mascot` | `string` | Away team mascot. |
| `away_team_abbrev` | `string` | Away team three-letter abbreviation. |
| `away_team_name_alt` | `string` | Alternate away team name. |
| `game_spread` | `number` | Game spread (signed; positive = home favored). |
| `home_favorite` | `boolean` | TRUE if the home team is the betting favorite. |
| `game_spread_available` | `boolean` | TRUE if a point spread was available. |
| `home_team_spread` | `number` | Home team's point spread. |
| `qtr` | `number` | Quarter (1-4) or OT period (5+). |
| `time` | `string` | Time / clock value. |
| `clock_minutes` | `number` | Clock minutes split out for convenience. |
| `clock_seconds` | `number` | Clock seconds split out for convenience. |
| `home_timeout_called` | `boolean` | Whether the play is a timeout called by the home team. |
| `away_timeout_called` | `boolean` | Whether the play is a timeout called by the away team. |
| `half` | `number` | Half of the game (1 or 2). |
| `game_half` | `number` | Half of the game (1 or 2). |
| `lag_qtr` | `number` | Quarter lag (the previous-play's quarter). |
| `lead_qtr` | `number` | Quarter lead (the next-play's quarter). |
| `lag_half` | `number` | A lag column on the half |
| `lead_half` | `number` | A lead column on the half |
| `start_quarter_seconds_remaining` | `number` | Seconds remaining in the period at the start of the play. |
| `start_half_seconds_remaining` | `number` | Seconds remaining in the half at the start of the play. |
| `start_game_seconds_remaining` | `number` | Seconds remaining in the game at the start of the play. |
| `end_quarter_seconds_remaining` | `number` | Seconds remaining in the period at the end of the play. |
| `end_half_seconds_remaining` | `number` | Seconds remaining in the half at the end of the play. |
| `end_game_seconds_remaining` | `number` | Seconds remaining in the game at the end of the play. |
| `period` | `number` | Period of the game (1-4 quarters; 5+ for OT). |
| `coordinate_x` | `number` | X coordinate on the court (half-court layout). |
| `coordinate_y` | `number` | Y coordinate on the court (half-court layout). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `athlete_name_1` | `string` | Name of the primary athlete involved in the play (pairs with athlete_id_1). |
| `athlete_name_2` | `string` | Name of the secondary athlete involved in the play (e.g. the assister or fouled player). |
| `athlete_name_3` | `string` | Name of the tertiary athlete involved in the play. |
| `type_abbreviation` | `string` | Type abbreviation. |

## `loadNbaPlayerBoxscore`

Release: [espn_nba_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPlayerBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nba.load_nba_player_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPlayerBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
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

## `loadNbaSchedule`

Release: [espn_nba_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_schedules/nba_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaSchedule({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nba.load_nba_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `id` | `string` | Id. |
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
| `type_abbreviation` | `string` | Type abbreviation. |
| `venue_id` | `string` | Unique venue identifier. |
| `venue_full_name` | `string` | Venue full name. |
| `venue_address_city` | `string` | Venue address city. |
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
| `home_linescores` | `string` | Period-by-period points for the home team, stringified from ESPN's linescores array. |
| `home_records` | `string` | Home team's records at game time (overall, home, away), stringified from ESPN. |
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
| `away_linescores` | `string` | Period-by-period points for the away team, stringified from ESPN's linescores array. |
| `away_records` | `string` | Away team's records at game time (overall, home, away), stringified from ESPN. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `venue_address_state` | `string` | Venue address state / region. |
| `status_type_alt_detail` | `string` | Status type alt detail. |
| `game_json` | `boolean` | Whether processed game JSON is available. |
| `game_json_url` | `string` | URL to the processed game JSON. |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `PBP` | `boolean` | Whether play-by-play data is available. |
| `team_box` | `boolean` | Team box. |
| `player_box` | `boolean` | Player box. |

## `loadNbaTeamBoxscore`

Release: [espn_nba_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaTeamBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nba.load_nba_team_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaTeamBoxscoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
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
| `lead_changes` | `string` | Lead changes. |
| `lead_percentage` | `string` | Percentage of the game the team held the lead, from ESPN's team box score stats. |

## `loadNbaGameRosters`

Release: [espn_nba_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaGameRosters({ seasons: 2002 });
// snake_case alias (py/R parity): sdv.nba.load_nba_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaGameRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
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
| `athlete_headshot` | `string` | URL of the player's headshot image. |
| `starter` | `boolean` | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `did_not_play` | `boolean` | TRUE if the player did not appear in the game. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |
| `ejected` | `boolean` | TRUE if the player was ejected from the game. |
| `reason` | `string` | Reason. |

## `loadNbaOfficials`

Release: [espn_nba_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaOfficials({ seasons: 2002 });
// snake_case alias (py/R parity): sdv.nba.load_nba_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `game_id` | `string` | Unique game identifier. |
| `official_full_name` | `string` | Full name of an on-court game official as ESPN publishes it in the summary gameInfo.officials array; it is identical to official_display_name in every released NBA row. |
| `official_display_name` | `string` | ESPN's display-form name for the official, falling back to the full name when ESPN omits it; it never diverges from official_full_name in the released NBA data. |
| `official_position` | `string` | ESPN's label for the official's assignment slot; the NBA summary feed only ever ships Referee, so this reads the same on every released row. |
| `official_position_id` | `string` | ESPN's numeric identifier for the official's assignment slot, constant at 40 (Referee) across every released NBA season. |
| `official_order` | `number` | The official's listing index within the game's crew as ESPN orders them, normally 1 through 3 for a three-person crew; a fourth entry appears in a small share of recent-season games and the sequence is not guaranteed to be gap-free. |

## `loadNbaShots`

Release: [espn_nba_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_shots/shots_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaShots({ seasons: 2002 });
// snake_case alias (py/R parity): sdv.nba.load_nba_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaShotsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
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
| `athlete_name_1` | `string` | Name of the shooter on the attempt. |
| `athlete_name_2` | `string` | Name of the secondary athlete on the attempt (e.g. the assister). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_mascot` | `string` | Mascot (nickname) portion of the shooting team's name. |
| `team_abbrev` | `string` | Abbreviation for team. |

## `loadNbaStandings`

Release: [espn_nba_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_standings) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_standings/standings_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStandings({ seasons: 2002 });
// snake_case alias (py/R parity): sdv.nba.load_nba_standings(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStandingsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `group_id` | `string` | ESPN group id. |
| `group_name` | `string` | Group name (conference / division). |
| `group_abbreviation` | `string` | Group abbreviation. |
| `group_short_name` | `string` | ESPN's short name for the standings grouping the team sits in, read from the group node's shortName; the NBA standings payload supplies only the group name and abbreviation, so this is null throughout. |
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
| `stat_name` | `string` | Stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_short_display_name` | `string` | Short human-readable stat name. |
| `stat_description` | `string` | ESPN's prose gloss for the standings statistic on this row; for the clincher stat it is not a fixed label but the team's actual status text, such as Clinched Playoff Berth or Eliminated From Playoff. |
| `stat_abbreviation` | `string` | ESPN's short code for the standings statistic, such as PCT, GB or OPP PPG; it is null for the four record-style splits (Home, Road, vs. Conf., vs. Div.), which ship no abbreviation. |
| `stat_type` | `string` | Stat type code (e.g. "win", "loss"). |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadNbaPlayerSeasonStats`

Release: [espn_nba_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_player_season_stats/player_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPlayerSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_player_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPlayerSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `athlete_id` | `string` | Unique athlete identifier (ESPN). |
| `athlete_display_name` | `string` | Athlete display name (full). |
| `athlete_position_abbreviation` | `string` | Athlete position abbreviation (G / F / C). |
| `athlete_jersey` | `string` | Athlete jersey number. |
| `team_id` | `string` | Unique team identifier. |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_display_name` | `string` | Full team display name. |
| `category` | `string` | Category label. |
| `stat_label` | `string` | Human-readable label of the statistic (e.g. 'At bats'). |
| `stat_name` | `string` | Stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | ESPN's prose definition of the statistic on this row, for example the ratio of field goals made to field goals attempted; for the paired Made-Attempted stats it is the two definitions joined with a hyphen. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadNbaTeamSeasonStats`

Release: [espn_nba_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_team_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_team_season_stats/team_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaTeamSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_team_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaTeamSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
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
| `stat_name` | `string` | Stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | ESPN's prose definition of the team statistic on this row, for example the average number of assists a team records per turnover. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadNbaDraft`

Release: [espn_nba_draft](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_draft) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_draft/draft_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2003) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaDraft({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_draft(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaDraftRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `round` | `number` | Tournament / playoff round. |
| `round_display_name` | `string` | ESPN's display label for the draft round a pick belongs to, read from the round object's displayName; the NBA payload supplies no round metadata, so this is null for every released season 2003 through 2025. |
| `pick` | `number` | Pick number within the round. |
| `overall_pick` | `number` | Overall pick. |
| `pick_traded` | `string` | ESPN's traded flag for the pick, carried through as a string rather than a boolean; every released NBA row reads FALSE, so it does not currently identify traded picks. |
| `pick_notes` | `string` | Free-text note ESPN can attach to a pick, read from the pick's notes or note field; the NBA draft payload never populates it, so it is null across all released seasons. |
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
| `college_name` | `string` | College / pre-draft team. |
| `college_short_name` | `string` | College short name. |
| `college_abbreviation` | `string` | Abbreviation of the drafted player's college taken from the pick's nested college block; the ESPN NBA draft feed omits that block entirely, so this and the other college columns are null throughout. |
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

## `loadNbaRosters`

Release: [espn_nba_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
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

## `loadNbaStatsSchedules`

Release: [nba_stats_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_schedules/nba_schedule_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsSchedules({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_schedules(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsSchedulesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number \| bigint` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `matchup` | `string` | Matchup. |
| `home_team_id` | `string` | Unique identifier for the home team. |
| `home_team_abbreviation` | `string` | Home team abbreviation. |
| `home_team_name` | `string` | Home team name. |
| `home_pts` | `number \| bigint` | Final points scored by the home team. |
| `home_wl` | `string` | Home team's result for the game (W or L). |
| `away_team_id` | `string` | Unique identifier for the away team. |
| `away_team_abbreviation` | `string` | Away team abbreviation. |
| `away_team_name` | `string` | Away team name. |
| `away_pts` | `number \| bigint` | Final points scored by the away team. |
| `away_wl` | `string` | Away team's result for the game (W or L). |

## `loadNbaStatsCoaches`

Release: [nba_stats_coaches](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_coaches) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_coaches/coaches_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsCoaches({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_coaches(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsCoachesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `season` | `number` | Season year. |
| `coach_id` | `string` | ESPN coach id. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `coach_name` | `string` | Coach's full name. |
| `is_assistant` | `number \| bigint` | Numeric flag from the NBA Stats API distinguishing assistants from head coaches. |
| `coach_type` | `string` | Coach role description (e.g. "Head Coach", "Assistant Coach"). |
| `sort_sequence` | `number \| bigint` | Sort order of the coach within the team's staff listing. |
| `sub_sort_sequence` | `number \| bigint` | Secondary sort order within the coach type. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadNbaStatsGameRosters`

Release: [nba_stats_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_game_rosters/game_rosters_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsGameRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsGameRostersRow` (exported from the package root).

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
| `season` | `number` | Season year. |
| `game_id` | `string` | Unique game identifier. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |

## `loadNbaStatsLineups`

Release: [nba_stats_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_lineups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_lineups/lineups_{season + 1}.parquet`

Pass the season's START year (e.g. `2007` for the 2007-08 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2007) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsLineups({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_lineups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsLineupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `group_set` | `string` | Lineup grouping label from the NBA Stats API (e.g. "Lineups"). |
| `group_id` | `string` | ESPN group id. |
| `group_name` | `string` | Group name (conference / division). |
| `team_id` | `string` | Unique team identifier. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `gp` | `number \| bigint` | Games played. |
| `w` | `number \| bigint` | Wins. |
| `l` | `number \| bigint` | Losses. |
| `w_pct` | `number` | Wins percentage (0-1 decimal). |
| `min` | `number` | Minutes played. |
| `e_off_rating` | `number` | Estimated offensive rating (NBA Stats estimated-metrics family) over the split. |
| `off_rating` | `number` | Offensive rating (points scored per 100 possessions) over the split. |
| `e_def_rating` | `number` | Estimated defensive rating (NBA Stats estimated-metrics family) over the split. |
| `def_rating` | `number` | Defensive rating (points allowed per 100 possessions) over the split. |
| `e_net_rating` | `number` | Estimated net rating (NBA Stats estimated-metrics family) over the split. |
| `net_rating` | `number` | Net rating (off rating - def rating). |
| `ast_pct` | `number` | Assist percentage. |
| `ast_to` | `number` | Assist-to-turnover ratio over the split. |
| `ast_ratio` | `number` | Assist ratio (assists per 100 possessions used) over the split. |
| `oreb_pct` | `number` | Offensive rebound percentage over the split, as a decimal. |
| `dreb_pct` | `number` | Defensive rebound percentage over the split, as a decimal. |
| `reb_pct` | `number` | Total rebound percentage over the split, as a decimal. |
| `tm_tov_pct` | `number` | Team turnover percentage (turnovers per 100 possessions) over the split, as a decimal. |
| `efg_pct` | `number` | Effective field goal percentage over the split, as a decimal. |
| `ts_pct` | `number` | True shooting percentage (0-1). |
| `e_pace` | `number` | Estimated pace (NBA Stats estimated-metrics family) over the split. |
| `pace` | `number` | Possessions per 48 minutes. |
| `pace_per40` | `number` | Pace per40. |
| `poss` | `number \| bigint` | Poss. |
| `pie` | `number` | Player Impact Estimate (0-1). |
| `gp_rank` | `number \| bigint` | League rank of the row's games played for the season and split. |
| `w_rank` | `number \| bigint` | League rank of the row's wins for the season and split. |
| `l_rank` | `number \| bigint` | League rank of the row's losses for the season and split. |
| `w_pct_rank` | `number \| bigint` | League rank of the row's win percentage for the season and split. |
| `min_rank` | `number \| bigint` | League rank of the row's minutes played for the season and split. |
| `off_rating_rank` | `number \| bigint` | League rank of the row's offensive rating (points scored per 100 possessions) for the season and split. |
| `def_rating_rank` | `number \| bigint` | League rank of the row's defensive rating (points allowed per 100 possessions) for the season and split. |
| `net_rating_rank` | `number \| bigint` | League rank of the row's net rating (offensive minus defensive rating) for the season and split. |
| `ast_pct_rank` | `number \| bigint` | League rank of the row's assist percentage (share of teammate field goals assisted while on the floor) for the season and split. |
| `ast_to_rank` | `number \| bigint` | League rank of the row's assist-to-turnover ratio for the season and split. |
| `ast_ratio_rank` | `number \| bigint` | League rank of the row's assist ratio (assists per 100 possessions used) for the season and split. |
| `oreb_pct_rank` | `number \| bigint` | League rank of the row's offensive rebound percentage for the season and split. |
| `dreb_pct_rank` | `number \| bigint` | League rank of the row's defensive rebound percentage for the season and split. |
| `reb_pct_rank` | `number \| bigint` | League rank of the row's total rebound percentage for the season and split. |
| `tm_tov_pct_rank` | `number \| bigint` | League rank of the row's team turnover percentage (turnovers per 100 possessions) for the season and split. |
| `efg_pct_rank` | `number \| bigint` | League rank of the row's effective field goal percentage for the season and split. |
| `ts_pct_rank` | `number \| bigint` | League rank of the row's true shooting percentage for the season and split. |
| `pace_rank` | `number \| bigint` | League rank of the row's pace (possessions per 48 minutes) for the season and split. |
| `pie_rank` | `number \| bigint` | League rank of the row's Player Impact Estimate (PIE, the NBA Stats catch-all impact metric) for the season and split. |
| `sum_time_played` | `number \| bigint` | Total time the five-man lineup was on the floor across the split. |
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `measure_type` | `string` | NBA Stats measure type the row was pulled from (e.g. Base, Advanced, Misc, Scoring, Opponent, Usage, Defense). |
| `per_mode` | `string` | NBA Stats per-mode of the row values (e.g. Totals, PerGame, Per100Possessions). |
| `fgm` | `number` | Field goals made. |
| `fga` | `number` | Field goal attempts. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `fg3m` | `number` | Three-point field goals made. |
| `fg3a` | `number` | Three-point field goal attempts. |
| `fg3_pct` | `number` | Three-point field goal percentage (0-1). |
| `ftm` | `number` | Free throws made. |
| `fta` | `number` | Free throw attempts. |
| `ft_pct` | `number` | Free throw percentage (0-1). |
| `oreb` | `number` | Offensive rebounds. |
| `dreb` | `number` | Defensive rebounds. |
| `reb` | `number` | Rebounds per game. |
| `ast` | `number` | Assists. |
| `tov` | `number` | Turnovers. |
| `stl` | `number` | Steals. |
| `blk` | `number` | Blocks. |
| `blka` | `number` | Shot attempts blocked by opponents (blocks against). |
| `pf` | `number` | Personal fouls. |
| `pfd` | `number` | Personal fouls drawn. |
| `pts` | `number` | Points scored. |
| `plus_minus` | `number` | Plus/minus point differential while on court. |
| `fgm_rank` | `number \| bigint` | League rank of the row's field goals made for the season and split. |
| `fga_rank` | `number \| bigint` | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | `number \| bigint` | League rank of the row's field goal percentage for the season and split. |
| `fg3m_rank` | `number \| bigint` | League rank of the row's three-point field goals made for the season and split. |
| `fg3a_rank` | `number \| bigint` | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | `number \| bigint` | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | `number \| bigint` | League rank of the row's free throws made for the season and split. |
| `fta_rank` | `number \| bigint` | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | `number \| bigint` | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | `number \| bigint` | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | `number \| bigint` | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | `number \| bigint` | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | `number \| bigint` | League rank of the row's assists for the season and split. |
| `tov_rank` | `number \| bigint` | League rank of the row's turnovers for the season and split. |
| `stl_rank` | `number \| bigint` | League rank of the row's steals for the season and split. |
| `blk_rank` | `number \| bigint` | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | `number \| bigint` | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | `number \| bigint` | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | `number \| bigint` | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | `number \| bigint` | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | `number \| bigint` | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `pts_off_tov` | `number` | Points scored off opponent turnovers over the split. |
| `pts_2nd_chance` | `number` | Second-chance points over the split. |
| `pts_fb` | `number` | Fast-break points over the split. |
| `pts_paint` | `number` | Points in the paint over the split. |
| `opp_pts_off_tov` | `number` | Opponent points scored off opponent turnovers allowed over the split. |
| `opp_pts_2nd_chance` | `number` | Opponent second-chance points allowed over the split. |
| `opp_pts_fb` | `number` | Opponent fast-break points allowed over the split. |
| `opp_pts_paint` | `number` | Opponent points in the paint allowed over the split. |
| `pts_off_tov_rank` | `number \| bigint` | League rank of the row's points scored off opponent turnovers for the season and split. |
| `pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's second-chance points for the season and split. |
| `pts_fb_rank` | `number \| bigint` | League rank of the row's fast-break points for the season and split. |
| `pts_paint_rank` | `number \| bigint` | League rank of the row's points in the paint for the season and split. |
| `opp_pts_off_tov_rank` | `number \| bigint` | League rank of the row's opponent points scored off opponent turnovers for the season and split. |
| `opp_pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's opponent second-chance points for the season and split. |
| `opp_pts_fb_rank` | `number \| bigint` | League rank of the row's opponent fast-break points for the season and split. |
| `opp_pts_paint_rank` | `number \| bigint` | League rank of the row's opponent points in the paint for the season and split. |
| `opp_fgm` | `number` | Opponent field goals made allowed over the split. |
| `opp_fga` | `number` | Opponent field goals attempted allowed over the split. |
| `opp_fg_pct` | `number` | Opponent field goal percentage allowed over the split. |
| `opp_fg3m` | `number` | Opponent three-point field goals made allowed over the split. |
| `opp_fg3a` | `number` | Opponent three-point field goals attempted allowed over the split. |
| `opp_fg3_pct` | `number` | Opponent three-point field goal percentage allowed over the split. |
| `opp_ftm` | `number` | Opponent free throws made allowed over the split. |
| `opp_fta` | `number` | Opponent free throws attempted allowed over the split. |
| `opp_ft_pct` | `number` | Opponent free throw percentage allowed over the split. |
| `opp_oreb` | `number` | Opponent offensive rebounds allowed over the split. |
| `opp_dreb` | `number` | Opponent defensive rebounds allowed over the split. |
| `opp_reb` | `number` | Opponent total rebounds allowed over the split. |
| `opp_ast` | `number` | Opponent assists allowed over the split. |
| `opp_tov` | `number` | Opponent turnovers allowed over the split. |
| `opp_stl` | `number` | Opponent steals allowed over the split. |
| `opp_blk` | `number` | Opponent blocked shots allowed over the split. |
| `opp_blka` | `number` | Opponent shot attempts blocked by opponents (blocks against) allowed over the split. |
| `opp_pf` | `number` | Opponent personal fouls committed allowed over the split. |
| `opp_pfd` | `number` | Opponent personal fouls drawn allowed over the split. |
| `opp_pts` | `number` | Opponent points. |
| `opp_fgm_rank` | `number \| bigint` | League rank of the row's opponent field goals made for the season and split. |
| `opp_fga_rank` | `number \| bigint` | League rank of the row's opponent field goals attempted for the season and split. |
| `opp_fg_pct_rank` | `number \| bigint` | League rank of the row's opponent field goal percentage for the season and split. |
| `opp_fg3m_rank` | `number \| bigint` | League rank of the row's opponent three-point field goals made for the season and split. |
| `opp_fg3a_rank` | `number \| bigint` | League rank of the row's opponent three-point field goals attempted for the season and split. |
| `opp_fg3_pct_rank` | `number \| bigint` | League rank of the row's opponent three-point field goal percentage for the season and split. |
| `opp_ftm_rank` | `number \| bigint` | League rank of the row's opponent free throws made for the season and split. |
| `opp_fta_rank` | `number \| bigint` | League rank of the row's opponent free throws attempted for the season and split. |
| `opp_ft_pct_rank` | `number \| bigint` | League rank of the row's opponent free throw percentage for the season and split. |
| `opp_oreb_rank` | `number \| bigint` | League rank of the row's opponent offensive rebounds for the season and split. |
| `opp_dreb_rank` | `number \| bigint` | League rank of the row's opponent defensive rebounds for the season and split. |
| `opp_reb_rank` | `number \| bigint` | League rank of the row's opponent total rebounds for the season and split. |
| `opp_ast_rank` | `number \| bigint` | League rank of the row's opponent assists for the season and split. |
| `opp_tov_rank` | `number \| bigint` | League rank of the row's opponent turnovers for the season and split. |
| `opp_stl_rank` | `number \| bigint` | League rank of the row's opponent steals for the season and split. |
| `opp_blk_rank` | `number \| bigint` | League rank of the row's opponent blocked shots for the season and split. |
| `opp_blka_rank` | `number \| bigint` | League rank of the row's opponent shot attempts blocked by opponents (blocks against) for the season and split. |
| `opp_pf_rank` | `number \| bigint` | League rank of the row's opponent personal fouls committed for the season and split. |
| `opp_pfd_rank` | `number \| bigint` | League rank of the row's opponent personal fouls drawn for the season and split. |
| `opp_pts_rank` | `number \| bigint` | League rank of the row's opponent points scored for the season and split. |
| `pct_fga_2pt` | `number` | Share of field goal attempts taken as two-pointers, as a decimal. |
| `pct_fga_3pt` | `number` | Share of field goal attempts taken as three-pointers, as a decimal. |
| `pct_pts_2pt` | `number` | Share of points scored on two-point field goals, as a decimal. |
| `pct_pts_2pt_mr` | `number` | Share of points scored on mid-range two-pointers, as a decimal. |
| `pct_pts_3pt` | `number` | Share of points scored on three-pointers, as a decimal. |
| `pct_pts_fb` | `number` | Share of points scored on fast breaks, as a decimal. |
| `pct_pts_ft` | `number` | Share of points scored at the free throw line, as a decimal. |
| `pct_pts_off_tov` | `number` | Share of points scored off opponent turnovers, as a decimal. |
| `pct_pts_paint` | `number` | Share of points scored in the paint, as a decimal. |
| `pct_ast_2pm` | `number` | Percentage of made two-pointers that were assisted, as a decimal. |
| `pct_uast_2pm` | `number` | Percentage of made two-pointers that were unassisted, as a decimal. |
| `pct_ast_3pm` | `number` | Percentage of made three-pointers that were assisted, as a decimal. |
| `pct_uast_3pm` | `number` | Percentage of made three-pointers that were unassisted, as a decimal. |
| `pct_ast_fgm` | `number` | Percentage of made field goals that were assisted, as a decimal. |
| `pct_uast_fgm` | `number` | Percentage of made field goals that were unassisted, as a decimal. |
| `pct_fga_2pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as two-pointers for the season and split. |
| `pct_fga_3pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as three-pointers for the season and split. |
| `pct_pts_2pt_rank` | `number \| bigint` | League rank of the row's share of points scored on two-point field goals for the season and split. |
| `pct_pts_2pt_mr_rank` | `number \| bigint` | League rank of the row's share of points scored on mid-range two-pointers for the season and split. |
| `pct_pts_3pt_rank` | `number \| bigint` | League rank of the row's share of points scored on three-pointers for the season and split. |
| `pct_pts_fb_rank` | `number \| bigint` | League rank of the row's share of points scored on fast breaks for the season and split. |
| `pct_pts_ft_rank` | `number \| bigint` | League rank of the row's share of points scored at the free throw line for the season and split. |
| `pct_pts_off_tov_rank` | `number \| bigint` | League rank of the row's share of points scored off opponent turnovers for the season and split. |
| `pct_pts_paint_rank` | `number \| bigint` | League rank of the row's share of points scored in the paint for the season and split. |
| `pct_ast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were assisted for the season and split. |
| `pct_uast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were unassisted for the season and split. |
| `pct_ast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were assisted for the season and split. |
| `pct_uast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were unassisted for the season and split. |
| `pct_ast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were assisted for the season and split. |
| `pct_uast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were unassisted for the season and split. |

## `loadNbaStatsLineupsV3`

:::warning[Deprecated]
Use [`loadNbaStatsGameLineups`](#loadnbastatsgamelineups) — same `seasons` convention. Emits a one-time `DeprecationWarning`.
:::

Release: [nba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_lineups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_game_lineups/nba_lineups_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsLineupsV3({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_lineups_v3(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsGameLineupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `action_number` | `number \| bigint` | Sequential action number within a game (V3 PBP). |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `home_player_1` | `number \| bigint` | NBA Stats player id of the home on-court player 1 of 5 for the row. |
| `home_player_2` | `number \| bigint` | NBA Stats player id of the home on-court player 2 of 5 for the row. |
| `home_player_3` | `number \| bigint` | NBA Stats player id of the home on-court player 3 of 5 for the row. |
| `home_player_4` | `number \| bigint` | NBA Stats player id of the home on-court player 4 of 5 for the row. |
| `home_player_5` | `number \| bigint` | NBA Stats player id of the home on-court player 5 of 5 for the row. |
| `away_player_1` | `number \| bigint` | NBA Stats player id of the away on-court player 1 of 5 for the row. |
| `away_player_2` | `number \| bigint` | NBA Stats player id of the away on-court player 2 of 5 for the row. |
| `away_player_3` | `number \| bigint` | NBA Stats player id of the away on-court player 3 of 5 for the row. |
| `away_player_4` | `number \| bigint` | NBA Stats player id of the away on-court player 4 of 5 for the row. |
| `away_player_5` | `number \| bigint` | NBA Stats player id of the away on-court player 5 of 5 for the row. |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsOfficials`

Release: [nba_stats_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_officials/officials_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsOfficials({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `official_id` | `string` | Unique official / referee identifier. |
| `first_name` | `string` | Player's first name. |
| `last_name` | `string` | Player's last name. |
| `jersey_num` | `string` | Jersey number worn by the player. |
| `season` | `number` | Season year. |
| `game_id` | `string` | Unique game identifier. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |

## `loadNbaStatsPbp`

Release: [nba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_pbp/nba_play_by_play_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPbp({ seasons: 2025, columns: ['game_id', 'period', 'clock', 'event_type', 'description'] });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `order_index` | `number \| bigint` | Stable within-game ordering index for events after pbpstats-style reordering of the raw feed. |
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
| `location` | `string` | Location. |
| `description` | `string` | Long-form description text. |
| `action_type` | `string` | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `sub_type` | `string` | Action sub-type label. |
| `video_available` | `number \| bigint` | Video available. |
| `shot_value` | `number \| bigint` | Point value of the shot (2 or 3). |
| `action_id` | `string` | Unique action identifier within a game (V3 PBP). |
| `game_id` | `string` | Unique game identifier. |
| `seconds_remaining` | `number` | Seconds remaining in the period. |
| `event_type` | `string` | Event / play type code (V2 PBP). |
| `is_made_shot` | `boolean` | Whether the event is a made field goal. |
| `is_missed_shot` | `boolean` | Whether the event is a missed field goal. |
| `is_free_throw` | `boolean` | Whether the event is a free throw attempt. |
| `is_rebound` | `boolean` | Whether the event is a rebound. |
| `is_turnover` | `boolean` | `TRUE` if the play was a turnover. |
| `is_foul` | `boolean` | Whether the event is a foul. |
| `is_substitution` | `boolean` | Whether the event is a substitution. |
| `is_jump_ball` | `boolean` | Whether the event is a jump ball. |
| `is_timeout` | `boolean` | Whether the event is a timeout. |
| `is_period` | `boolean` | Whether the event is a period start or end marker. |
| `possession_number` | `number \| bigint` | Possession number. |
| `off_player_1` | `number \| bigint` | NBA Stats player id of offensive on-court player 1 of 5 during the event. |
| `off_player_2` | `number \| bigint` | NBA Stats player id of offensive on-court player 2 of 5 during the event. |
| `off_player_3` | `number \| bigint` | NBA Stats player id of offensive on-court player 3 of 5 during the event. |
| `off_player_4` | `number \| bigint` | NBA Stats player id of offensive on-court player 4 of 5 during the event. |
| `off_player_5` | `number \| bigint` | NBA Stats player id of offensive on-court player 5 of 5 during the event. |
| `def_player_1` | `number \| bigint` | NBA Stats player id of defensive on-court player 1 of 5 during the event. |
| `def_player_2` | `number \| bigint` | NBA Stats player id of defensive on-court player 2 of 5 during the event. |
| `def_player_3` | `number \| bigint` | NBA Stats player id of defensive on-court player 3 of 5 during the event. |
| `def_player_4` | `number \| bigint` | NBA Stats player id of defensive on-court player 4 of 5 during the event. |
| `def_player_5` | `number \| bigint` | NBA Stats player id of defensive on-court player 5 of 5 during the event. |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsPossessions`

Release: [nba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_possessions) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_possessions/nba_possessions_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPossessions({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_possessions(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPossessionsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `possession_number` | `number \| bigint` | Possession number. |
| `offense_team_id` | `string` | Unique identifier for offense team. |
| `defense_team_id` | `string` | NBA Stats team id of the defending team for the possession. |
| `start_order_index` | `number \| bigint` | order_index of the play-by-play event that starts the possession. |
| `end_order_index` | `number \| bigint` | order_index of the play-by-play event that ends the possession. |
| `start_seconds_remaining` | `number` | Seconds remaining in the period when the possession started. |
| `end_seconds_remaining` | `number` | Seconds remaining in the period when the possession ended. |
| `points` | `number \| bigint` | Points scored. |
| `is_second_chance` | `boolean` | Whether the row is a second-chance continuation following an offensive rebound. |
| `number_in_period` | `number \| bigint` | Sequential possession number for the offense within the period. |
| `possession_start_type` | `string` | How the possession began (e.g. off a made shot, defensive rebound, turnover, or period start). |
| `count_as_possession` | `boolean` | Whether the row counts as a true possession for per-possession rate stats. |
| `fg2a` | `number \| bigint` | Two-point field goal attempts during the possession. |
| `fg2m` | `number \| bigint` | Two-point field goals made during the possession. |
| `fg3a` | `number \| bigint` | Three-point field goal attempts. |
| `fg3m` | `number \| bigint` | Three-point field goals made. |
| `fta` | `number \| bigint` | Free throw attempts. |
| `ftm` | `number \| bigint` | Free throws made. |
| `oreb` | `number \| bigint` | Offensive rebounds. |
| `dreb` | `number \| bigint` | Defensive rebounds. |
| `tov` | `number \| bigint` | Turnovers. |
| `off_player_1` | `number \| bigint` | NBA Stats player id of offensive on-court player 1 of 5 for the possession. |
| `off_player_2` | `number \| bigint` | NBA Stats player id of offensive on-court player 2 of 5 for the possession. |
| `off_player_3` | `number \| bigint` | NBA Stats player id of offensive on-court player 3 of 5 for the possession. |
| `off_player_4` | `number \| bigint` | NBA Stats player id of offensive on-court player 4 of 5 for the possession. |
| `off_player_5` | `number \| bigint` | NBA Stats player id of offensive on-court player 5 of 5 for the possession. |
| `def_player_1` | `number \| bigint` | NBA Stats player id of defensive on-court player 1 of 5 for the possession. |
| `def_player_2` | `number \| bigint` | NBA Stats player id of defensive on-court player 2 of 5 for the possession. |
| `def_player_3` | `number \| bigint` | NBA Stats player id of defensive on-court player 3 of 5 for the possession. |
| `def_player_4` | `number \| bigint` | NBA Stats player id of defensive on-court player 4 of 5 for the possession. |
| `def_player_5` | `number \| bigint` | NBA Stats player id of defensive on-court player 5 of 5 for the possession. |
| `lineup_source` | `string` | Provenance of the on-court lineup identification for the row (how the five-man units were resolved). |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsGameLineups`

Release: [nba_stats_game_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_lineups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_game_lineups/nba_lineups_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsGameLineups({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_game_lineups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsGameLineupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `action_number` | `number \| bigint` | Sequential action number within a game (V3 PBP). |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `home_player_1` | `number \| bigint` | NBA Stats player id of the home on-court player 1 of 5 for the row. |
| `home_player_2` | `number \| bigint` | NBA Stats player id of the home on-court player 2 of 5 for the row. |
| `home_player_3` | `number \| bigint` | NBA Stats player id of the home on-court player 3 of 5 for the row. |
| `home_player_4` | `number \| bigint` | NBA Stats player id of the home on-court player 4 of 5 for the row. |
| `home_player_5` | `number \| bigint` | NBA Stats player id of the home on-court player 5 of 5 for the row. |
| `away_player_1` | `number \| bigint` | NBA Stats player id of the away on-court player 1 of 5 for the row. |
| `away_player_2` | `number \| bigint` | NBA Stats player id of the away on-court player 2 of 5 for the row. |
| `away_player_3` | `number \| bigint` | NBA Stats player id of the away on-court player 3 of 5 for the row. |
| `away_player_4` | `number \| bigint` | NBA Stats player id of the away on-court player 4 of 5 for the row. |
| `away_player_5` | `number \| bigint` | NBA Stats player id of the away on-court player 5 of 5 for the row. |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsGameMatchups`

Release: [nba_stats_game_matchups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_game_matchups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_game_matchups/game_matchups_{season + 1}.parquet`

Pass the season's START year (e.g. `2017` for the 2017-18 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2017) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsGameMatchups({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_game_matchups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsGameMatchupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `off_team_id` | `string` | Team id of the offensive player. Taken from the payload's team block. |
| `off_team_city` | `string` | City/market of the offensive player's team ("Indiana"). |
| `off_team_name` | `string` | Nickname of the offensive player's team ("Pacers") -- pair with `off_team_city` for the full club name. |
| `off_team_tricode` | `string` | Three-letter abbreviation of the offensive player's team ("IND"). |
| `off_team_slug` | `string` | URL slug of the offensive player's team ("pacers"). |
| `def_team_id` | `string` | Team id of the defender, read from the game envelope's homeTeamId/awayTeamId rather than the nested team object, which is 0 on uncovered captures. |
| `side` | `string` | Which side of the game the row's team was on: "home" or "away". In `game_matchups`, where a row carries two teams, it is the OFFENSIVE player's team (`off_team_id`) -- the defender is always the other side. |
| `off_person_id` | `string` | stats.nba.com person id of the offensive player -- the one being guarded. |
| `off_first_name` | `string` | First name of the offensive player. |
| `off_family_name` | `string` | Family name of the offensive player. |
| `off_name_i` | `string` | Offensive player's abbreviated display name ("B. Mathurin"). |
| `off_player_slug` | `string` | URL slug of the offensive player ("bennedict-mathurin"). |
| `off_position` | `string` | Starting position of the offensive player as the payload reports it; empty for players who did not start. |
| `off_comment` | `string` | Availability note on the offensive player (DNP reason); empty when they played. |
| `off_jersey_num` | `string` | Jersey number of the offensive player, as a string (it can carry a leading zero, e.g. "00"). |
| `def_person_id` | `string` | stats.nba.com person id of the defender guarding the offensive player. |
| `def_first_name` | `string` | First name of the defender. |
| `def_family_name` | `string` | Family name of the defender. |
| `def_name_i` | `string` | Defender's abbreviated display name ("J. Allen"). |
| `def_player_slug` | `string` | URL slug of the defender ("jarrett-allen"). |
| `def_jersey_num` | `string` | Jersey number of the defender, as a string (it can carry a leading zero). |
| `matchup_minutes` | `string` | Time the pair were matched up, as the payload's MM:SS string; use `matchup_minutes_sort` for arithmetic. |
| `matchup_minutes_sort` | `number` | The same matchup time in seconds, as a float -- the sortable/summable form. |
| `partial_possessions` | `number` | Possessions credited to the matchup. Fractional because a possession is split across every defender who guarded the ball-handler during it, which is why matchup counting stats do not sum exactly to a player's game totals. |
| `percentage_defender_total_time` | `number` | Share of the defender's floor time spent guarding this offensive player. |
| `percentage_offensive_total_time` | `number` | Share of the offensive player's floor time spent guarded by this defender. |
| `percentage_total_time_both_on` | `number` | Share of the time both players were on the floor together that they were matched up. |
| `switches_on` | `number \| bigint` | Times the defense switched this defender onto the offensive player. |
| `player_points` | `number \| bigint` | Points the offensive player scored while guarded by this defender. |
| `team_points` | `number \| bigint` | Points the offensive player's team scored while this matchup was on. |
| `matchup_assists` | `number \| bigint` | Assists by the offensive player while guarded by this defender. |
| `matchup_potential_assists` | `number \| bigint` | Passes by the offensive player that would have been assists had the shot fallen, while guarded by this defender. |
| `matchup_turnovers` | `number \| bigint` | Turnovers by the offensive player while guarded by this defender. |
| `matchup_blocks` | `number \| bigint` | Shots by the offensive player blocked by this defender. |
| `matchup_field_goals_made` | `number \| bigint` | Field goals made by the offensive player against this defender. |
| `matchup_field_goals_attempted` | `number \| bigint` | Field goals attempted by the offensive player against this defender. |
| `matchup_field_goals_percentage` | `number` | Field-goal percentage of the offensive player against this defender. |
| `matchup_three_pointers_made` | `number \| bigint` | Three-pointers made by the offensive player against this defender. |
| `matchup_three_pointers_attempted` | `number \| bigint` | Three-pointers attempted by the offensive player against this defender. |
| `matchup_three_pointers_percentage` | `number` | Three-point percentage of the offensive player against this defender. |
| `help_blocks` | `number \| bigint` | Blocks by this defender on the offensive player when helping off another assignment rather than as the primary defender. |
| `help_field_goals_made` | `number \| bigint` | Field goals the offensive player made against this defender in help defense. |
| `help_field_goals_attempted` | `number \| bigint` | Field goals the offensive player attempted against this defender in help defense. |
| `help_field_goals_percentage` | `number` | Field-goal percentage allowed by this defender in help defense. |
| `matchup_free_throws_made` | `number \| bigint` | Free throws made by the offensive player on trips drawn against this defender. |
| `matchup_free_throws_attempted` | `number \| bigint` | Free throws attempted by the offensive player on trips drawn against this defender. |
| `shooting_fouls` | `number \| bigint` | Shooting fouls committed by this defender on the offensive player. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |

## `loadNbaStatsPbpV3`

:::warning[Deprecated]
Use [`loadNbaStatsPbp`](#loadnbastatspbp) — same `seasons` convention. Emits a one-time `DeprecationWarning`.
:::

Release: [nba_stats_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_pbp/nba_play_by_play_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPbpV3({ seasons: 2025, columns: ['game_id', 'period', 'clock', 'event_type', 'description'] });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_pbp_v3(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `order_index` | `number \| bigint` | Stable within-game ordering index for events after pbpstats-style reordering of the raw feed. |
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
| `location` | `string` | Location. |
| `description` | `string` | Long-form description text. |
| `action_type` | `string` | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `sub_type` | `string` | Action sub-type label. |
| `video_available` | `number \| bigint` | Video available. |
| `shot_value` | `number \| bigint` | Point value of the shot (2 or 3). |
| `action_id` | `string` | Unique action identifier within a game (V3 PBP). |
| `game_id` | `string` | Unique game identifier. |
| `seconds_remaining` | `number` | Seconds remaining in the period. |
| `event_type` | `string` | Event / play type code (V2 PBP). |
| `is_made_shot` | `boolean` | Whether the event is a made field goal. |
| `is_missed_shot` | `boolean` | Whether the event is a missed field goal. |
| `is_free_throw` | `boolean` | Whether the event is a free throw attempt. |
| `is_rebound` | `boolean` | Whether the event is a rebound. |
| `is_turnover` | `boolean` | `TRUE` if the play was a turnover. |
| `is_foul` | `boolean` | Whether the event is a foul. |
| `is_substitution` | `boolean` | Whether the event is a substitution. |
| `is_jump_ball` | `boolean` | Whether the event is a jump ball. |
| `is_timeout` | `boolean` | Whether the event is a timeout. |
| `is_period` | `boolean` | Whether the event is a period start or end marker. |
| `possession_number` | `number \| bigint` | Possession number. |
| `off_player_1` | `number \| bigint` | NBA Stats player id of offensive on-court player 1 of 5 during the event. |
| `off_player_2` | `number \| bigint` | NBA Stats player id of offensive on-court player 2 of 5 during the event. |
| `off_player_3` | `number \| bigint` | NBA Stats player id of offensive on-court player 3 of 5 during the event. |
| `off_player_4` | `number \| bigint` | NBA Stats player id of offensive on-court player 4 of 5 during the event. |
| `off_player_5` | `number \| bigint` | NBA Stats player id of offensive on-court player 5 of 5 during the event. |
| `def_player_1` | `number \| bigint` | NBA Stats player id of defensive on-court player 1 of 5 during the event. |
| `def_player_2` | `number \| bigint` | NBA Stats player id of defensive on-court player 2 of 5 during the event. |
| `def_player_3` | `number \| bigint` | NBA Stats player id of defensive on-court player 3 of 5 during the event. |
| `def_player_4` | `number \| bigint` | NBA Stats player id of defensive on-court player 4 of 5 during the event. |
| `def_player_5` | `number \| bigint` | NBA Stats player id of defensive on-court player 5 of 5 during the event. |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsPlayerBoxscores`

Release: [nba_stats_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_player_boxscores/player_boxscores_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPlayerBoxscores({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_player_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPlayerBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team_city` | `string` | City/market of the team ("Indiana"); pair with `team_name` for the full club name. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `team_slug` | `string` | URL slug of the team ("pacers"). |
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
| `season` | `number` | Season year. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |

## `loadNbaStatsPlayerGameLogs`

Release: [nba_stats_player_game_logs](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_game_logs) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_player_game_logs/player_game_logs_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPlayerGameLogs({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_player_game_logs(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPlayerGameLogsRow` (exported from the package root).

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
| `fga` | `number \| bigint` | Field goal attempts. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `fg3m` | `number \| bigint` | Three-point field goals made. |
| `fg3a` | `number \| bigint` | Three-point field goal attempts. |
| `fg3_pct` | `number` | Three-point field goal percentage (0-1). |
| `ftm` | `number \| bigint` | Free throws made. |
| `fta` | `number \| bigint` | Free throw attempts. |
| `ft_pct` | `number` | Free throw percentage (0-1). |
| `oreb` | `number \| bigint` | Offensive rebounds. |
| `dreb` | `number \| bigint` | Defensive rebounds. |
| `reb` | `number \| bigint` | Rebounds per game. |
| `ast` | `number \| bigint` | Assists. |
| `stl` | `number \| bigint` | Steals. |
| `blk` | `number \| bigint` | Blocks. |
| `tov` | `number \| bigint` | Turnovers. |
| `pf` | `number \| bigint` | Personal fouls. |
| `pts` | `number \| bigint` | Points scored. |
| `plus_minus` | `number \| bigint` | Plus/minus point differential while on court. |
| `video_available` | `number \| bigint` | Video available. |
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadNbaStatsPlayerSeasonStats`

Release: [nba_stats_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_player_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_player_season_stats/player_season_stats_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPlayerSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_player_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPlayerSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `nickname` | `string` | Team or athlete nickname. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `age` | `number` | Player age (in years). |
| `gp` | `number \| bigint` | Games played. |
| `w` | `number \| bigint` | Wins. |
| `l` | `number \| bigint` | Losses. |
| `w_pct` | `number` | Wins percentage (0-1 decimal). |
| `min` | `number` | Minutes played. |
| `e_off_rating` | `number` | Estimated offensive rating (NBA Stats estimated-metrics family) over the split. |
| `off_rating` | `number` | Offensive rating (points scored per 100 possessions) over the split. |
| `sp_work_off_rating` | `number` | Offensive rating carried in the stats API's SP_WORK column set (mirrors off_rating) over the split. |
| `e_def_rating` | `number` | Estimated defensive rating (NBA Stats estimated-metrics family) over the split. |
| `def_rating` | `number` | Defensive rating (points allowed per 100 possessions) over the split. |
| `sp_work_def_rating` | `number` | Defensive rating carried in the stats API's SP_WORK column set (mirrors def_rating) over the split. |
| `e_net_rating` | `number` | Estimated net rating (NBA Stats estimated-metrics family) over the split. |
| `net_rating` | `number` | Net rating (off rating - def rating). |
| `sp_work_net_rating` | `number` | Net rating carried in the stats API's SP_WORK column set (mirrors net_rating) over the split. |
| `ast_pct` | `number` | Assist percentage. |
| `ast_to` | `number` | Assist-to-turnover ratio over the split. |
| `ast_ratio` | `number` | Assist ratio (assists per 100 possessions used) over the split. |
| `oreb_pct` | `number` | Offensive rebound percentage over the split, as a decimal. |
| `dreb_pct` | `number` | Defensive rebound percentage over the split, as a decimal. |
| `reb_pct` | `number` | Total rebound percentage over the split, as a decimal. |
| `tm_tov_pct` | `number` | Team turnover percentage (turnovers per 100 possessions) over the split, as a decimal. |
| `e_tov_pct` | `number` | Estimated turnover percentage (NBA Stats estimated-metrics family) over the split, as a decimal. |
| `efg_pct` | `number` | Effective field goal percentage over the split, as a decimal. |
| `ts_pct` | `number` | True shooting percentage (0-1). |
| `usg_pct` | `number` | Usage percentage (share of team plays used while on the floor) over the split, as a decimal. |
| `e_usg_pct` | `number` | Estimated usage percentage (NBA Stats estimated-metrics family) over the split, as a decimal. |
| `e_pace` | `number` | Estimated pace (NBA Stats estimated-metrics family) over the split. |
| `pace` | `number` | Possessions per 48 minutes. |
| `pace_per40` | `number` | Pace per40. |
| `sp_work_pace` | `number` | Pace carried in the stats API's SP_WORK column set (mirrors pace) over the split. |
| `pie` | `number` | Player Impact Estimate (0-1). |
| `poss` | `number \| bigint` | Poss. |
| `fgm` | `number` | Field goals made. |
| `fga` | `number` | Field goal attempts. |
| `fgm_pg` | `number` | Field goals made per game over the split. |
| `fga_pg` | `number` | Field goals attempted per game over the split. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `gp_rank` | `number \| bigint` | League rank of the row's games played for the season and split. |
| `w_rank` | `number \| bigint` | League rank of the row's wins for the season and split. |
| `l_rank` | `number \| bigint` | League rank of the row's losses for the season and split. |
| `w_pct_rank` | `number \| bigint` | League rank of the row's win percentage for the season and split. |
| `min_rank` | `number \| bigint` | League rank of the row's minutes played for the season and split. |
| `e_off_rating_rank` | `number \| bigint` | League rank of the row's estimated offensive rating (NBA Stats estimated-metrics family) for the season and split. |
| `off_rating_rank` | `number \| bigint` | League rank of the row's offensive rating (points scored per 100 possessions) for the season and split. |
| `sp_work_off_rating_rank` | `number \| bigint` | League rank of the row's offensive rating carried in the stats API's SP_WORK column set (mirrors off_rating) for the season and split. |
| `e_def_rating_rank` | `number \| bigint` | League rank of the row's estimated defensive rating (NBA Stats estimated-metrics family) for the season and split. |
| `def_rating_rank` | `number \| bigint` | League rank of the row's defensive rating (points allowed per 100 possessions) for the season and split. |
| `sp_work_def_rating_rank` | `number \| bigint` | League rank of the row's defensive rating carried in the stats API's SP_WORK column set (mirrors def_rating) for the season and split. |
| `e_net_rating_rank` | `number \| bigint` | League rank of the row's estimated net rating (NBA Stats estimated-metrics family) for the season and split. |
| `net_rating_rank` | `number \| bigint` | League rank of the row's net rating (offensive minus defensive rating) for the season and split. |
| `sp_work_net_rating_rank` | `number \| bigint` | League rank of the row's net rating carried in the stats API's SP_WORK column set (mirrors net_rating) for the season and split. |
| `ast_pct_rank` | `number \| bigint` | League rank of the row's assist percentage (share of teammate field goals assisted while on the floor) for the season and split. |
| `ast_to_rank` | `number \| bigint` | League rank of the row's assist-to-turnover ratio for the season and split. |
| `ast_ratio_rank` | `number \| bigint` | League rank of the row's assist ratio (assists per 100 possessions used) for the season and split. |
| `oreb_pct_rank` | `number \| bigint` | League rank of the row's offensive rebound percentage for the season and split. |
| `dreb_pct_rank` | `number \| bigint` | League rank of the row's defensive rebound percentage for the season and split. |
| `reb_pct_rank` | `number \| bigint` | League rank of the row's total rebound percentage for the season and split. |
| `tm_tov_pct_rank` | `number \| bigint` | League rank of the row's team turnover percentage (turnovers per 100 possessions) for the season and split. |
| `e_tov_pct_rank` | `number \| bigint` | League rank of the row's estimated turnover percentage (NBA Stats estimated-metrics family) for the season and split. |
| `efg_pct_rank` | `number \| bigint` | League rank of the row's effective field goal percentage for the season and split. |
| `ts_pct_rank` | `number \| bigint` | League rank of the row's true shooting percentage for the season and split. |
| `usg_pct_rank` | `number \| bigint` | League rank of the row's usage percentage (share of team plays used while on the floor) for the season and split. |
| `e_usg_pct_rank` | `number \| bigint` | League rank of the row's estimated usage percentage (NBA Stats estimated-metrics family) for the season and split. |
| `e_pace_rank` | `number \| bigint` | League rank of the row's estimated pace (NBA Stats estimated-metrics family) for the season and split. |
| `pace_rank` | `number \| bigint` | League rank of the row's pace (possessions per 48 minutes) for the season and split. |
| `sp_work_pace_rank` | `number \| bigint` | League rank of the row's pace carried in the stats API's SP_WORK column set (mirrors pace) for the season and split. |
| `pie_rank` | `number \| bigint` | League rank of the row's Player Impact Estimate (PIE, the NBA Stats catch-all impact metric) for the season and split. |
| `fgm_rank` | `number \| bigint` | League rank of the row's field goals made for the season and split. |
| `fga_rank` | `number \| bigint` | League rank of the row's field goals attempted for the season and split. |
| `fgm_pg_rank` | `number \| bigint` | League rank of the row's field goals made per game for the season and split. |
| `fga_pg_rank` | `number \| bigint` | League rank of the row's field goals attempted per game for the season and split. |
| `fg_pct_rank` | `number \| bigint` | League rank of the row's field goal percentage for the season and split. |
| `team_count` | `number \| bigint` | Number of distinct teams aggregated into the split row. |
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `measure_type` | `string` | NBA Stats measure type the row was pulled from (e.g. Base, Advanced, Misc, Scoring, Opponent, Usage, Defense). |
| `per_mode` | `string` | NBA Stats per-mode of the row values (e.g. Totals, PerGame, Per100Possessions). |
| `fg3m` | `number` | Three-point field goals made. |
| `fg3a` | `number` | Three-point field goal attempts. |
| `fg3_pct` | `number` | Three-point field goal percentage (0-1). |
| `ftm` | `number` | Free throws made. |
| `fta` | `number` | Free throw attempts. |
| `ft_pct` | `number` | Free throw percentage (0-1). |
| `oreb` | `number` | Offensive rebounds. |
| `dreb` | `number` | Defensive rebounds. |
| `reb` | `number` | Rebounds per game. |
| `ast` | `number` | Assists. |
| `tov` | `number` | Turnovers. |
| `stl` | `number` | Steals. |
| `blk` | `number` | Blocks. |
| `blka` | `number` | Shot attempts blocked by opponents (blocks against). |
| `pf` | `number` | Personal fouls. |
| `pfd` | `number` | Personal fouls drawn. |
| `pts` | `number` | Points scored. |
| `plus_minus` | `number` | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | `number` | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | `number \| bigint` | Double-doubles recorded over the split. |
| `td3` | `number \| bigint` | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | `number` | Fantasy points under the WNBA's fantasy scoring formula. |
| `fg3m_rank` | `number \| bigint` | League rank of the row's three-point field goals made for the season and split. |
| `fg3a_rank` | `number \| bigint` | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | `number \| bigint` | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | `number \| bigint` | League rank of the row's free throws made for the season and split. |
| `fta_rank` | `number \| bigint` | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | `number \| bigint` | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | `number \| bigint` | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | `number \| bigint` | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | `number \| bigint` | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | `number \| bigint` | League rank of the row's assists for the season and split. |
| `tov_rank` | `number \| bigint` | League rank of the row's turnovers for the season and split. |
| `stl_rank` | `number \| bigint` | League rank of the row's steals for the season and split. |
| `blk_rank` | `number \| bigint` | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | `number \| bigint` | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | `number \| bigint` | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | `number \| bigint` | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | `number \| bigint` | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | `number \| bigint` | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | `number \| bigint` | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | `number \| bigint` | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | `number \| bigint` | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | `number \| bigint` | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `pct_dreb` | `number` | Share of the team's defensive rebounds accounted for by the player while on the floor, as a decimal. |
| `pct_stl` | `number` | Share of the team's steals accounted for by the player while on the floor, as a decimal. |
| `pct_blk` | `number` | Share of the team's blocked shots accounted for by the player while on the floor, as a decimal. |
| `opp_pts_off_tov` | `number` | Opponent points scored off opponent turnovers allowed over the split. |
| `opp_pts_2nd_chance` | `number` | Opponent second-chance points allowed over the split. |
| `opp_pts_fb` | `number` | Opponent fast-break points allowed over the split. |
| `opp_pts_paint` | `number` | Opponent points in the paint allowed over the split. |
| `def_ws` | `number` | Defensive win shares credited to the player (NBA Stats defense dashboard metric). |
| `def_ws_raw` | `number` | Unscaled (raw) defensive win shares value carried alongside def_ws by the NBA Stats API. |
| `pct_dreb_rank` | `number \| bigint` | League rank of the row's share of the team's defensive rebounds accounted for by the player while on the floor for the season and split. |
| `pct_stl_rank` | `number \| bigint` | League rank of the row's share of the team's steals accounted for by the player while on the floor for the season and split. |
| `pct_blk_rank` | `number \| bigint` | League rank of the row's share of the team's blocked shots accounted for by the player while on the floor for the season and split. |
| `opp_pts_off_tov_rank` | `number \| bigint` | League rank of the row's opponent points scored off opponent turnovers for the season and split. |
| `opp_pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's opponent second-chance points for the season and split. |
| `opp_pts_fb_rank` | `number \| bigint` | League rank of the row's opponent fast-break points for the season and split. |
| `opp_pts_paint_rank` | `number \| bigint` | League rank of the row's opponent points in the paint for the season and split. |
| `def_ws_rank` | `number \| bigint` | League rank of the row's defensive win shares (NBA Stats defense dashboard metric) for the season and split. |
| `pts_off_tov` | `number` | Points scored off opponent turnovers over the split. |
| `pts_2nd_chance` | `number` | Second-chance points over the split. |
| `pts_fb` | `number` | Fast-break points over the split. |
| `pts_paint` | `number` | Points in the paint over the split. |
| `pts_off_tov_rank` | `number \| bigint` | League rank of the row's points scored off opponent turnovers for the season and split. |
| `pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's second-chance points for the season and split. |
| `pts_fb_rank` | `number \| bigint` | League rank of the row's fast-break points for the season and split. |
| `pts_paint_rank` | `number \| bigint` | League rank of the row's points in the paint for the season and split. |
| `pct_fga_2pt` | `number` | Share of field goal attempts taken as two-pointers, as a decimal. |
| `pct_fga_3pt` | `number` | Share of field goal attempts taken as three-pointers, as a decimal. |
| `pct_pts_2pt` | `number` | Share of points scored on two-point field goals, as a decimal. |
| `pct_pts_2pt_mr` | `number` | Share of points scored on mid-range two-pointers, as a decimal. |
| `pct_pts_3pt` | `number` | Share of points scored on three-pointers, as a decimal. |
| `pct_pts_fb` | `number` | Share of points scored on fast breaks, as a decimal. |
| `pct_pts_ft` | `number` | Share of points scored at the free throw line, as a decimal. |
| `pct_pts_off_tov` | `number` | Share of points scored off opponent turnovers, as a decimal. |
| `pct_pts_paint` | `number` | Share of points scored in the paint, as a decimal. |
| `pct_ast_2pm` | `number` | Percentage of made two-pointers that were assisted, as a decimal. |
| `pct_uast_2pm` | `number` | Percentage of made two-pointers that were unassisted, as a decimal. |
| `pct_ast_3pm` | `number` | Percentage of made three-pointers that were assisted, as a decimal. |
| `pct_uast_3pm` | `number` | Percentage of made three-pointers that were unassisted, as a decimal. |
| `pct_ast_fgm` | `number` | Percentage of made field goals that were assisted, as a decimal. |
| `pct_uast_fgm` | `number` | Percentage of made field goals that were unassisted, as a decimal. |
| `pct_fga_2pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as two-pointers for the season and split. |
| `pct_fga_3pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as three-pointers for the season and split. |
| `pct_pts_2pt_rank` | `number \| bigint` | League rank of the row's share of points scored on two-point field goals for the season and split. |
| `pct_pts_2pt_mr_rank` | `number \| bigint` | League rank of the row's share of points scored on mid-range two-pointers for the season and split. |
| `pct_pts_3pt_rank` | `number \| bigint` | League rank of the row's share of points scored on three-pointers for the season and split. |
| `pct_pts_fb_rank` | `number \| bigint` | League rank of the row's share of points scored on fast breaks for the season and split. |
| `pct_pts_ft_rank` | `number \| bigint` | League rank of the row's share of points scored at the free throw line for the season and split. |
| `pct_pts_off_tov_rank` | `number \| bigint` | League rank of the row's share of points scored off opponent turnovers for the season and split. |
| `pct_pts_paint_rank` | `number \| bigint` | League rank of the row's share of points scored in the paint for the season and split. |
| `pct_ast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were assisted for the season and split. |
| `pct_uast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were unassisted for the season and split. |
| `pct_ast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were assisted for the season and split. |
| `pct_uast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were unassisted for the season and split. |
| `pct_ast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were assisted for the season and split. |
| `pct_uast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were unassisted for the season and split. |
| `pct_fgm` | `number` | Share of the team's field goals made accounted for by the player while on the floor, as a decimal. |
| `pct_fga` | `number` | Share of the team's field goals attempted accounted for by the player while on the floor, as a decimal. |
| `pct_fg3m` | `number` | Share of the team's three-point field goals made accounted for by the player while on the floor, as a decimal. |
| `pct_fg3a` | `number` | Share of the team's three-point field goals attempted accounted for by the player while on the floor, as a decimal. |
| `pct_ftm` | `number` | Share of the team's free throws made accounted for by the player while on the floor, as a decimal. |
| `pct_fta` | `number` | Share of the team's free throws attempted accounted for by the player while on the floor, as a decimal. |
| `pct_oreb` | `number` | Share of the team's offensive rebounds accounted for by the player while on the floor, as a decimal. |
| `pct_reb` | `number` | Share of the team's total rebounds accounted for by the player while on the floor, as a decimal. |
| `pct_ast` | `number` | Share of the team's assists accounted for by the player while on the floor, as a decimal. |
| `pct_tov` | `number` | Share of the team's turnovers accounted for by the player while on the floor, as a decimal. |
| `pct_blka` | `number` | Share of the team's shot attempts blocked by opponents (blocks against) accounted for by the player while on the floor, as a decimal. |
| `pct_pf` | `number` | Share of the team's personal fouls committed accounted for by the player while on the floor, as a decimal. |
| `pct_pfd` | `number` | Share of the team's personal fouls drawn accounted for by the player while on the floor, as a decimal. |
| `pct_pts` | `number` | Share of the team's points scored accounted for by the player while on the floor, as a decimal. |
| `pct_fgm_rank` | `number \| bigint` | League rank of the row's share of the team's field goals made accounted for by the player while on the floor for the season and split. |
| `pct_fga_rank` | `number \| bigint` | League rank of the row's share of the team's field goals attempted accounted for by the player while on the floor for the season and split. |
| `pct_fg3m_rank` | `number \| bigint` | League rank of the row's share of the team's three-point field goals made accounted for by the player while on the floor for the season and split. |
| `pct_fg3a_rank` | `number \| bigint` | League rank of the row's share of the team's three-point field goals attempted accounted for by the player while on the floor for the season and split. |
| `pct_ftm_rank` | `number \| bigint` | League rank of the row's share of the team's free throws made accounted for by the player while on the floor for the season and split. |
| `pct_fta_rank` | `number \| bigint` | League rank of the row's share of the team's free throws attempted accounted for by the player while on the floor for the season and split. |
| `pct_oreb_rank` | `number \| bigint` | League rank of the row's share of the team's offensive rebounds accounted for by the player while on the floor for the season and split. |
| `pct_reb_rank` | `number \| bigint` | League rank of the row's share of the team's total rebounds accounted for by the player while on the floor for the season and split. |
| `pct_ast_rank` | `number \| bigint` | League rank of the row's share of the team's assists accounted for by the player while on the floor for the season and split. |
| `pct_tov_rank` | `number \| bigint` | League rank of the row's share of the team's turnovers accounted for by the player while on the floor for the season and split. |
| `pct_blka_rank` | `number \| bigint` | League rank of the row's share of the team's shot attempts blocked by opponents (blocks against) accounted for by the player while on the floor for the season and split. |
| `pct_pf_rank` | `number \| bigint` | League rank of the row's share of the team's personal fouls committed accounted for by the player while on the floor for the season and split. |
| `pct_pfd_rank` | `number \| bigint` | League rank of the row's share of the team's personal fouls drawn accounted for by the player while on the floor for the season and split. |
| `pct_pts_rank` | `number \| bigint` | League rank of the row's share of the team's points scored accounted for by the player while on the floor for the season and split. |

## `loadNbaStatsPossessionsV3`

:::warning[Deprecated]
Use [`loadNbaStatsPossessions`](#loadnbastatspossessions) — same `seasons` convention. Emits a one-time `DeprecationWarning`.
:::

Release: [nba_stats_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_possessions) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_possessions/nba_possessions_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsPossessionsV3({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_possessions_v3(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsPossessionsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `possession_number` | `number \| bigint` | Possession number. |
| `offense_team_id` | `string` | Unique identifier for offense team. |
| `defense_team_id` | `string` | NBA Stats team id of the defending team for the possession. |
| `start_order_index` | `number \| bigint` | order_index of the play-by-play event that starts the possession. |
| `end_order_index` | `number \| bigint` | order_index of the play-by-play event that ends the possession. |
| `start_seconds_remaining` | `number` | Seconds remaining in the period when the possession started. |
| `end_seconds_remaining` | `number` | Seconds remaining in the period when the possession ended. |
| `points` | `number \| bigint` | Points scored. |
| `is_second_chance` | `boolean` | Whether the row is a second-chance continuation following an offensive rebound. |
| `number_in_period` | `number \| bigint` | Sequential possession number for the offense within the period. |
| `possession_start_type` | `string` | How the possession began (e.g. off a made shot, defensive rebound, turnover, or period start). |
| `count_as_possession` | `boolean` | Whether the row counts as a true possession for per-possession rate stats. |
| `fg2a` | `number \| bigint` | Two-point field goal attempts during the possession. |
| `fg2m` | `number \| bigint` | Two-point field goals made during the possession. |
| `fg3a` | `number \| bigint` | Three-point field goal attempts. |
| `fg3m` | `number \| bigint` | Three-point field goals made. |
| `fta` | `number \| bigint` | Free throw attempts. |
| `ftm` | `number \| bigint` | Free throws made. |
| `oreb` | `number \| bigint` | Offensive rebounds. |
| `dreb` | `number \| bigint` | Defensive rebounds. |
| `tov` | `number \| bigint` | Turnovers. |
| `off_player_1` | `number \| bigint` | NBA Stats player id of offensive on-court player 1 of 5 for the possession. |
| `off_player_2` | `number \| bigint` | NBA Stats player id of offensive on-court player 2 of 5 for the possession. |
| `off_player_3` | `number \| bigint` | NBA Stats player id of offensive on-court player 3 of 5 for the possession. |
| `off_player_4` | `number \| bigint` | NBA Stats player id of offensive on-court player 4 of 5 for the possession. |
| `off_player_5` | `number \| bigint` | NBA Stats player id of offensive on-court player 5 of 5 for the possession. |
| `def_player_1` | `number \| bigint` | NBA Stats player id of defensive on-court player 1 of 5 for the possession. |
| `def_player_2` | `number \| bigint` | NBA Stats player id of defensive on-court player 2 of 5 for the possession. |
| `def_player_3` | `number \| bigint` | NBA Stats player id of defensive on-court player 3 of 5 for the possession. |
| `def_player_4` | `number \| bigint` | NBA Stats player id of defensive on-court player 4 of 5 for the possession. |
| `def_player_5` | `number \| bigint` | NBA Stats player id of defensive on-court player 5 of 5 for the possession. |
| `lineup_source` | `string` | Provenance of the on-court lineup identification for the row (how the five-man units were resolved). |
| `season` | `number \| bigint` | Season year. |

## `loadNbaStatsRosters`

Release: [nba_stats_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_rosters/rosters_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `season` | `number` | Season year. |
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
| `exp` | `string` | Years of NBA playing experience entering the season ('R' = rookie). |
| `school` | `string` | Player school / pre-draft team. |
| `player_id` | `string` | Unique player identifier. |
| `how_acquired` | `string` | How the team acquired the player (e.g. draft, trade, free agency). |
| `supplemental_status` | `number \| bigint` | Numeric supplemental roster-status code from the stats.nba.com roster feed. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadNbaStatsShots`

Release: [nba_stats_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_shots/shots_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsShots({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsShotsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |
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

## `loadNbaStatsStandings`

Release: [nba_stats_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_standings) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_standings/standings_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsStandings({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_standings(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsStandingsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league_id` | `string` | League identifier ('10' = WNBA). |
| `season_id` | `string` | Unique season identifier. |
| `team_id` | `string` | Unique team identifier. |
| `team_city` | `string` | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_slug` | `string` | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `conference` | `string` | Conference name. |
| `conference_record` | `string` | Conference win-loss record. |
| `playoff_rank` | `number \| bigint` | League/season rank for playoff. |
| `clinch_indicator` | `string` | Playoff clinch indicator (e.g. 'x' clinched playoff, 'e' eliminated). |
| `division` | `string` | Team division. |
| `division_record` | `string` | Win-loss record against division opponents. |
| `division_rank` | `number \| bigint` | Team's rank within its division. |
| `wins` | `number \| bigint` | Total wins. |
| `losses` | `number \| bigint` | Total losses. |
| `win_pct` | `number` | Win percentage (0-1 decimal). |
| `league_rank` | `number \| bigint` | Team's rank in the overall league standings. |
| `record` | `string` | Overall win-loss record. |
| `home` | `string` | Home. |
| `road` | `string` | Road. |
| `l10` | `string` | Last-ten record. |
| `last10_home` | `string` | Win-loss record over the team's last 10 home games. |
| `last10_road` | `string` | Win-loss record over the team's last 10 road games. |
| `ot` | `string` | Ot. |
| `three_pts_or_less` | `string` | Win-loss record in games decided by three points or fewer. |
| `ten_pts_or_more` | `string` | Win-loss record in games decided by ten points or more. |
| `long_home_streak` | `number \| bigint` | Longest home streak of the season (positive counts wins, negative losses). |
| `str_long_home_streak` | `string` | Longest home streak of the season as display text (e.g. "W 5"). |
| `long_road_streak` | `number \| bigint` | Longest road streak of the season (positive counts wins, negative losses). |
| `str_long_road_streak` | `string` | Longest road streak of the season as display text (e.g. "W 5"). |
| `long_win_streak` | `number \| bigint` | Longest winning streak of the season, in games. |
| `long_loss_streak` | `number \| bigint` | Longest losing streak of the season, in games. |
| `current_home_streak` | `number \| bigint` | Current home streak (positive counts wins, negative losses). |
| `str_current_home_streak` | `string` | Current home streak as display text (e.g. "L 2"). |
| `current_road_streak` | `number \| bigint` | Current road streak (positive counts wins, negative losses). |
| `str_current_road_streak` | `string` | Current road streak as display text (e.g. "W 3"). |
| `current_streak` | `number \| bigint` | Current overall streak (positive counts wins, negative losses). |
| `str_current_streak` | `string` | Current overall streak as display text (e.g. "W 4"). |
| `conference_games_back` | `number` | Games behind the conference leader. |
| `division_games_back` | `number` | Games behind the division leader. |
| `clinched_conference_title` | `number \| bigint` | Flag (1/0) for whether the team has clinched the conference title. |
| `clinched_division_title` | `number \| bigint` | Flag (1/0) for whether the team has clinched its division. |
| `clinched_playoff_birth` | `number \| bigint` | Flag (1/0) for whether the team has clinched a playoff berth. |
| `clinched_play_in` | `number \| bigint` | Flag (1/0) for whether the team has clinched a play-in tournament spot. |
| `eliminated_conference` | `number \| bigint` | Flag (1/0) for whether the team is eliminated from conference contention. |
| `eliminated_division` | `number \| bigint` | Flag (1/0) for whether the team is eliminated from division contention. |
| `ahead_at_half` | `string` | Win-loss record when leading at halftime. |
| `behind_at_half` | `string` | Win-loss record when trailing at halftime. |
| `tied_at_half` | `string` | Win-loss record when tied at halftime. |
| `ahead_at_third` | `string` | Win-loss record when leading after three quarters. |
| `behind_at_third` | `string` | Win-loss record when trailing after three quarters. |
| `tied_at_third` | `string` | Win-loss record when tied after three quarters. |
| `score100_pts` | `string` | Win-loss record when scoring 100 or more points. |
| `opp_score100_pts` | `string` | Win-loss record when the opponent scores 100 or more points. |
| `opp_over500` | `string` | Win-loss record against teams with winning (over .500) records. |
| `lead_in_fgpct` | `string` | Win-loss record when posting the higher field goal percentage. |
| `lead_in_reb` | `string` | Win-loss record when out-rebounding the opponent. |
| `fewer_turnovers` | `string` | Win-loss record when committing fewer turnovers than the opponent. |
| `points_pg` | `number` | Points pg. |
| `opp_points_pg` | `number` | Opponent points pg. |
| `diff_points_pg` | `number` | Diff points pg. |
| `vs_east` | `string` | Win-loss record against Eastern Conference opponents. |
| `vs_atlantic` | `string` | Win-loss record against Atlantic Division opponents. |
| `vs_central` | `string` | Win-loss record against Central Division opponents. |
| `vs_southeast` | `string` | Win-loss record against Southeast Division opponents. |
| `vs_west` | `string` | Win-loss record against Western Conference opponents. |
| `vs_northwest` | `string` | Win-loss record against Northwest Division opponents. |
| `vs_pacific` | `string` | Win-loss record against Pacific Division opponents. |
| `vs_southwest` | `string` | Win-loss record against Southwest Division opponents. |
| `jan` | `string` | Win-loss record in games played in January. |
| `feb` | `string` | Win-loss record in games played in February. |
| `mar` | `string` | Win-loss record in games played in March. |
| `apr` | `string` | Win-loss record in games played in April. |
| `may` | `unknown` | Win-loss record in games played in May. |
| `jun` | `unknown` | Win-loss record in games played in June. |
| `jul` | `unknown` | Win-loss record in games played in July. |
| `aug` | `unknown` | Win-loss record in games played in August. |
| `sep` | `unknown` | Win-loss record in games played in September. |
| `oct` | `string` | Win-loss record in games played in October. |
| `nov` | `string` | Win-loss record in games played in November. |
| `dec` | `string` | Win-loss record in games played in December. |
| `score_80_plus` | `string` | Win-loss record when scoring 80 or more points. |
| `opp_score_80_plus` | `string` | Win-loss record when the opponent scores 80 or more points. |
| `score_below_80` | `string` | Win-loss record when scoring fewer than 80 points. |
| `opp_score_below_80` | `string` | Win-loss record when holding the opponent below 80 points. |
| `total_points` | `number \| bigint` | Total points scored by the team over the season to date. |
| `opp_total_points` | `number \| bigint` | Total points allowed by the team over the season to date. |
| `diff_total_points` | `number \| bigint` | Season point differential (points scored minus points allowed). |
| `league_games_back` | `number` | Games behind the overall league leader. |
| `playoff_seeding` | `number \| bigint` | Team's current playoff seed. |
| `clinched_post_season` | `number \| bigint` | Flag (1/0) for whether the team has clinched any postseason berth. |
| `neutral` | `string` | Neutral. |
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |

## `loadNbaStatsTeamBoxscores`

Release: [nba_stats_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_team_boxscores/team_boxscores_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsTeamBoxscores({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_team_boxscores(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsTeamBoxscoresRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team_city` | `string` | City/market of the team ("Indiana"); pair with `team_name` for the full club name. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | `string` | Three-letter team code (e.g. 'LAS' / 'NYL'). |
| `team_slug` | `string` | URL slug of the team ("pacers"). |
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
| `season` | `number` | Season year. |
| `season_type_id` | `string` | Season-type digit: the 3rd character of game_id (and the leading digit of season_id). 1 = preseason, 2 = regular season, 3 = All-Star, 4 = playoffs, 5 = play-in, 6 = NBA Cup final, 9 = international. |

## `loadNbaStatsTeamSeasonStats`

Release: [nba_stats_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_stats_team_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_stats_team_season_stats/team_season_stats_{season + 1}.parquet`

Pass the season's START year (e.g. `1996` for the 1996-97 season); the asset is keyed by the END year and the loader translates internally, so a `season` column in the rows carries that END year.

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaStatsTeamSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_stats_team_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaStatsTeamSeasonStatsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team_id` | `string` | Unique team identifier. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | `number \| bigint` | Games played. |
| `w` | `number \| bigint` | Wins. |
| `l` | `number \| bigint` | Losses. |
| `w_pct` | `number` | Wins percentage (0-1 decimal). |
| `min` | `number` | Minutes played. |
| `e_off_rating` | `number` | Estimated offensive rating (NBA Stats estimated-metrics family) over the split. |
| `off_rating` | `number` | Offensive rating (points scored per 100 possessions) over the split. |
| `e_def_rating` | `number` | Estimated defensive rating (NBA Stats estimated-metrics family) over the split. |
| `def_rating` | `number` | Defensive rating (points allowed per 100 possessions) over the split. |
| `e_net_rating` | `number` | Estimated net rating (NBA Stats estimated-metrics family) over the split. |
| `net_rating` | `number` | Net rating (off rating - def rating). |
| `ast_pct` | `number` | Assist percentage. |
| `ast_to` | `number` | Assist-to-turnover ratio over the split. |
| `ast_ratio` | `number` | Assist ratio (assists per 100 possessions used) over the split. |
| `oreb_pct` | `number` | Offensive rebound percentage over the split, as a decimal. |
| `dreb_pct` | `number` | Defensive rebound percentage over the split, as a decimal. |
| `reb_pct` | `number` | Total rebound percentage over the split, as a decimal. |
| `tm_tov_pct` | `number` | Team turnover percentage (turnovers per 100 possessions) over the split, as a decimal. |
| `efg_pct` | `number` | Effective field goal percentage over the split, as a decimal. |
| `ts_pct` | `number` | True shooting percentage (0-1). |
| `e_pace` | `number` | Estimated pace (NBA Stats estimated-metrics family) over the split. |
| `pace` | `number` | Possessions per 48 minutes. |
| `pace_per40` | `number` | Pace per40. |
| `poss` | `number \| bigint` | Poss. |
| `pie` | `number` | Player Impact Estimate (0-1). |
| `gp_rank` | `number \| bigint` | League rank of the row's games played for the season and split. |
| `w_rank` | `number \| bigint` | League rank of the row's wins for the season and split. |
| `l_rank` | `number \| bigint` | League rank of the row's losses for the season and split. |
| `w_pct_rank` | `number \| bigint` | League rank of the row's win percentage for the season and split. |
| `min_rank` | `number \| bigint` | League rank of the row's minutes played for the season and split. |
| `off_rating_rank` | `number \| bigint` | League rank of the row's offensive rating (points scored per 100 possessions) for the season and split. |
| `def_rating_rank` | `number \| bigint` | League rank of the row's defensive rating (points allowed per 100 possessions) for the season and split. |
| `net_rating_rank` | `number \| bigint` | League rank of the row's net rating (offensive minus defensive rating) for the season and split. |
| `ast_pct_rank` | `number \| bigint` | League rank of the row's assist percentage (share of teammate field goals assisted while on the floor) for the season and split. |
| `ast_to_rank` | `number \| bigint` | League rank of the row's assist-to-turnover ratio for the season and split. |
| `ast_ratio_rank` | `number \| bigint` | League rank of the row's assist ratio (assists per 100 possessions used) for the season and split. |
| `oreb_pct_rank` | `number \| bigint` | League rank of the row's offensive rebound percentage for the season and split. |
| `dreb_pct_rank` | `number \| bigint` | League rank of the row's defensive rebound percentage for the season and split. |
| `reb_pct_rank` | `number \| bigint` | League rank of the row's total rebound percentage for the season and split. |
| `tm_tov_pct_rank` | `number \| bigint` | League rank of the row's team turnover percentage (turnovers per 100 possessions) for the season and split. |
| `efg_pct_rank` | `number \| bigint` | League rank of the row's effective field goal percentage for the season and split. |
| `ts_pct_rank` | `number \| bigint` | League rank of the row's true shooting percentage for the season and split. |
| `pace_rank` | `number \| bigint` | League rank of the row's pace (possessions per 48 minutes) for the season and split. |
| `pie_rank` | `number \| bigint` | League rank of the row's Player Impact Estimate (PIE, the NBA Stats catch-all impact metric) for the season and split. |
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `measure_type` | `string` | NBA Stats measure type the row was pulled from (e.g. Base, Advanced, Misc, Scoring, Opponent, Usage, Defense). |
| `per_mode` | `string` | NBA Stats per-mode of the row values (e.g. Totals, PerGame, Per100Possessions). |
| `fgm` | `number` | Field goals made. |
| `fga` | `number` | Field goal attempts. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `fg3m` | `number` | Three-point field goals made. |
| `fg3a` | `number` | Three-point field goal attempts. |
| `fg3_pct` | `number` | Three-point field goal percentage (0-1). |
| `ftm` | `number` | Free throws made. |
| `fta` | `number` | Free throw attempts. |
| `ft_pct` | `number` | Free throw percentage (0-1). |
| `oreb` | `number` | Offensive rebounds. |
| `dreb` | `number` | Defensive rebounds. |
| `reb` | `number` | Rebounds per game. |
| `ast` | `number` | Assists. |
| `tov` | `number` | Turnovers. |
| `stl` | `number` | Steals. |
| `blk` | `number` | Blocks. |
| `blka` | `number` | Shot attempts blocked by opponents (blocks against). |
| `pf` | `number` | Personal fouls. |
| `pfd` | `number` | Personal fouls drawn. |
| `pts` | `number` | Points scored. |
| `plus_minus` | `number` | Plus/minus point differential while on court. |
| `fgm_rank` | `number \| bigint` | League rank of the row's field goals made for the season and split. |
| `fga_rank` | `number \| bigint` | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | `number \| bigint` | League rank of the row's field goal percentage for the season and split. |
| `fg3m_rank` | `number \| bigint` | League rank of the row's three-point field goals made for the season and split. |
| `fg3a_rank` | `number \| bigint` | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | `number \| bigint` | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | `number \| bigint` | League rank of the row's free throws made for the season and split. |
| `fta_rank` | `number \| bigint` | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | `number \| bigint` | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | `number \| bigint` | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | `number \| bigint` | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | `number \| bigint` | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | `number \| bigint` | League rank of the row's assists for the season and split. |
| `tov_rank` | `number \| bigint` | League rank of the row's turnovers for the season and split. |
| `stl_rank` | `number \| bigint` | League rank of the row's steals for the season and split. |
| `blk_rank` | `number \| bigint` | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | `number \| bigint` | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | `number \| bigint` | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | `number \| bigint` | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | `number \| bigint` | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | `number \| bigint` | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `opp_pts_off_tov` | `number` | Opponent points scored off opponent turnovers allowed over the split. |
| `opp_pts_2nd_chance` | `number` | Opponent second-chance points allowed over the split. |
| `opp_pts_fb` | `number` | Opponent fast-break points allowed over the split. |
| `opp_pts_paint` | `number` | Opponent points in the paint allowed over the split. |
| `opp_pts_off_tov_rank` | `number \| bigint` | League rank of the row's opponent points scored off opponent turnovers for the season and split. |
| `opp_pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's opponent second-chance points for the season and split. |
| `opp_pts_fb_rank` | `number \| bigint` | League rank of the row's opponent fast-break points for the season and split. |
| `opp_pts_paint_rank` | `number \| bigint` | League rank of the row's opponent points in the paint for the season and split. |
| `pts_off_tov` | `number` | Points scored off opponent turnovers over the split. |
| `pts_2nd_chance` | `number` | Second-chance points over the split. |
| `pts_fb` | `number` | Fast-break points over the split. |
| `pts_paint` | `number` | Points in the paint over the split. |
| `pts_off_tov_rank` | `number \| bigint` | League rank of the row's points scored off opponent turnovers for the season and split. |
| `pts_2nd_chance_rank` | `number \| bigint` | League rank of the row's second-chance points for the season and split. |
| `pts_fb_rank` | `number \| bigint` | League rank of the row's fast-break points for the season and split. |
| `pts_paint_rank` | `number \| bigint` | League rank of the row's points in the paint for the season and split. |
| `opp_fgm` | `number` | Opponent field goals made allowed over the split. |
| `opp_fga` | `number` | Opponent field goals attempted allowed over the split. |
| `opp_fg_pct` | `number` | Opponent field goal percentage allowed over the split. |
| `opp_fg3m` | `number` | Opponent three-point field goals made allowed over the split. |
| `opp_fg3a` | `number` | Opponent three-point field goals attempted allowed over the split. |
| `opp_fg3_pct` | `number` | Opponent three-point field goal percentage allowed over the split. |
| `opp_ftm` | `number` | Opponent free throws made allowed over the split. |
| `opp_fta` | `number` | Opponent free throws attempted allowed over the split. |
| `opp_ft_pct` | `number` | Opponent free throw percentage allowed over the split. |
| `opp_oreb` | `number` | Opponent offensive rebounds allowed over the split. |
| `opp_dreb` | `number` | Opponent defensive rebounds allowed over the split. |
| `opp_reb` | `number` | Opponent total rebounds allowed over the split. |
| `opp_ast` | `number` | Opponent assists allowed over the split. |
| `opp_tov` | `number` | Opponent turnovers allowed over the split. |
| `opp_stl` | `number` | Opponent steals allowed over the split. |
| `opp_blk` | `number` | Opponent blocked shots allowed over the split. |
| `opp_blka` | `number` | Opponent shot attempts blocked by opponents (blocks against) allowed over the split. |
| `opp_pf` | `number` | Opponent personal fouls committed allowed over the split. |
| `opp_pfd` | `number` | Opponent personal fouls drawn allowed over the split. |
| `opp_pts` | `number` | Opponent points. |
| `opp_fgm_rank` | `number \| bigint` | League rank of the row's opponent field goals made for the season and split. |
| `opp_fga_rank` | `number \| bigint` | League rank of the row's opponent field goals attempted for the season and split. |
| `opp_fg_pct_rank` | `number \| bigint` | League rank of the row's opponent field goal percentage for the season and split. |
| `opp_fg3m_rank` | `number \| bigint` | League rank of the row's opponent three-point field goals made for the season and split. |
| `opp_fg3a_rank` | `number \| bigint` | League rank of the row's opponent three-point field goals attempted for the season and split. |
| `opp_fg3_pct_rank` | `number \| bigint` | League rank of the row's opponent three-point field goal percentage for the season and split. |
| `opp_ftm_rank` | `number \| bigint` | League rank of the row's opponent free throws made for the season and split. |
| `opp_fta_rank` | `number \| bigint` | League rank of the row's opponent free throws attempted for the season and split. |
| `opp_ft_pct_rank` | `number \| bigint` | League rank of the row's opponent free throw percentage for the season and split. |
| `opp_oreb_rank` | `number \| bigint` | League rank of the row's opponent offensive rebounds for the season and split. |
| `opp_dreb_rank` | `number \| bigint` | League rank of the row's opponent defensive rebounds for the season and split. |
| `opp_reb_rank` | `number \| bigint` | League rank of the row's opponent total rebounds for the season and split. |
| `opp_ast_rank` | `number \| bigint` | League rank of the row's opponent assists for the season and split. |
| `opp_tov_rank` | `number \| bigint` | League rank of the row's opponent turnovers for the season and split. |
| `opp_stl_rank` | `number \| bigint` | League rank of the row's opponent steals for the season and split. |
| `opp_blk_rank` | `number \| bigint` | League rank of the row's opponent blocked shots for the season and split. |
| `opp_blka_rank` | `number \| bigint` | League rank of the row's opponent shot attempts blocked by opponents (blocks against) for the season and split. |
| `opp_pf_rank` | `number \| bigint` | League rank of the row's opponent personal fouls committed for the season and split. |
| `opp_pfd_rank` | `number \| bigint` | League rank of the row's opponent personal fouls drawn for the season and split. |
| `opp_pts_rank` | `number \| bigint` | League rank of the row's opponent points scored for the season and split. |
| `pct_fga_2pt` | `number` | Share of field goal attempts taken as two-pointers, as a decimal. |
| `pct_fga_3pt` | `number` | Share of field goal attempts taken as three-pointers, as a decimal. |
| `pct_pts_2pt` | `number` | Share of points scored on two-point field goals, as a decimal. |
| `pct_pts_2pt_mr` | `number` | Share of points scored on mid-range two-pointers, as a decimal. |
| `pct_pts_3pt` | `number` | Share of points scored on three-pointers, as a decimal. |
| `pct_pts_fb` | `number` | Share of points scored on fast breaks, as a decimal. |
| `pct_pts_ft` | `number` | Share of points scored at the free throw line, as a decimal. |
| `pct_pts_off_tov` | `number` | Share of points scored off opponent turnovers, as a decimal. |
| `pct_pts_paint` | `number` | Share of points scored in the paint, as a decimal. |
| `pct_ast_2pm` | `number` | Percentage of made two-pointers that were assisted, as a decimal. |
| `pct_uast_2pm` | `number` | Percentage of made two-pointers that were unassisted, as a decimal. |
| `pct_ast_3pm` | `number` | Percentage of made three-pointers that were assisted, as a decimal. |
| `pct_uast_3pm` | `number` | Percentage of made three-pointers that were unassisted, as a decimal. |
| `pct_ast_fgm` | `number` | Percentage of made field goals that were assisted, as a decimal. |
| `pct_uast_fgm` | `number` | Percentage of made field goals that were unassisted, as a decimal. |
| `pct_fga_2pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as two-pointers for the season and split. |
| `pct_fga_3pt_rank` | `number \| bigint` | League rank of the row's share of field goal attempts taken as three-pointers for the season and split. |
| `pct_pts_2pt_rank` | `number \| bigint` | League rank of the row's share of points scored on two-point field goals for the season and split. |
| `pct_pts_2pt_mr_rank` | `number \| bigint` | League rank of the row's share of points scored on mid-range two-pointers for the season and split. |
| `pct_pts_3pt_rank` | `number \| bigint` | League rank of the row's share of points scored on three-pointers for the season and split. |
| `pct_pts_fb_rank` | `number \| bigint` | League rank of the row's share of points scored on fast breaks for the season and split. |
| `pct_pts_ft_rank` | `number \| bigint` | League rank of the row's share of points scored at the free throw line for the season and split. |
| `pct_pts_off_tov_rank` | `number \| bigint` | League rank of the row's share of points scored off opponent turnovers for the season and split. |
| `pct_pts_paint_rank` | `number \| bigint` | League rank of the row's share of points scored in the paint for the season and split. |
| `pct_ast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were assisted for the season and split. |
| `pct_uast_2pm_rank` | `number \| bigint` | League rank of the row's percentage of made two-pointers that were unassisted for the season and split. |
| `pct_ast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were assisted for the season and split. |
| `pct_uast_3pm_rank` | `number \| bigint` | League rank of the row's percentage of made three-pointers that were unassisted for the season and split. |
| `pct_ast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were assisted for the season and split. |
| `pct_uast_fgm_rank` | `number \| bigint` | League rank of the row's percentage of made field goals that were unassisted for the season and split. |

## `loadNbaPlayerCrosswalk`

Release: [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_crosswalk/nba_player_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPlayerCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.nba.load_nba_player_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPlayerCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `player_name` | `string` | Player name. |
| `espn_athlete_id` | `string` | ESPN athlete id. |
| `espn_full_name` | `string` | ESPN full name. |
| `espn_jersey` | `string` | ESPN jersey number. |
| `espn_position` | `string` | ESPN position abbreviation. |
| `nba_player_id` | `string` | NBA Stats player id side of the ESPN-to-NBA player crosswalk. |
| `nba_player_name` | `string` | Player name as listed by the NBA Stats API. |
| `nba_jersey_num` | `string` | Player's jersey number as listed by the NBA Stats API. |
| `nba_position` | `string` | Player's position as listed by the NBA Stats API. |
| `fox_athlete_id` | `string` | Fox athlete id (NA if unmatched). |
| `fox_player` | `string` | Fox player name (NA if unmatched). |
| `fox_jersey` | `string` | Fox jersey number (NA if unmatched). |
| `fox_position_group` | `string` | Fox position group label (NA if unmatched). |
| `yahoo_player_id` | `string` | Yahoo player id (NA placeholder). |
| `yahoo_player_name` | `string` | Yahoo player name (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |
| `match_keys` | `string` | NA (reserved for future use). |

## `loadNbaScheduleCrosswalk`

Release: [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_crosswalk/nba_schedule_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaScheduleCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.nba.load_nba_schedule_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaScheduleCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `nba_game_id` | `string` | NBA Stats 10-character game id matched to the ESPN game in the crosswalk. |
| `nba_game_code` | `string` | NBA game code (date and matchup string) from the NBA Stats API. |
| `nba_home_team_id` | `string` | NBA Stats team id of the home team. |
| `nba_away_team_id` | `string` | NBA Stats team id of the away team. |
| `fox_game_id` | `string` | Fox game id (NA placeholder). |
| `fox_home_team_id` | `string` | FOX Sports team id of the home team in the crosswalk. |
| `fox_away_team_id` | `string` | FOX Sports team id of the away team in the crosswalk. |
| `yahoo_game_id` | `string` | Yahoo game id (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |

## `loadNbaTeamCrosswalk`

Release: [nba_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_crosswalk/nba_team_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2026) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaTeamCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.nba.load_nba_team_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaTeamCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `espn_abbreviation` | `string` | ESPN abbreviation. |
| `espn_display_name` | `string` | ESPN display name (school + mascot). |
| `espn_short_name` | `string` | ESPN short name. |
| `espn_location` | `string` | ESPN school/location only. |
| `espn_mascot` | `string` | ESPN mascot/nickname. |
| `nba_team_id` | `string` | NBA Stats team id side of the ESPN-to-NBA team crosswalk. |
| `nba_team_abbreviation` | `string` | Team abbreviation as listed by the NBA Stats API. |
| `nba_team_name` | `string` | Full NBA team name from the NBA Stats API, city followed by nickname (e.g. 'Boston Celtics'). |
| `nba_team_city` | `string` | Team city as listed by the NBA Stats API. |
| `nba_team_slug` | `string` | URL-friendly slug for the team's name on NBA Stats. |
| `nba_conference` | `string` | Team's conference as listed by the NBA Stats API. |
| `nba_division` | `string` | Team's division as listed by the NBA Stats API. |
| `fox_team_id` | `string` | Fox Bifrost team id (NA if unmatched). |
| `fox_team_name` | `string` | Fox team name (NA if unmatched). |
| `yahoo_team_id` | `string` | Yahoo team id (NA placeholder). |
| `yahoo_team_abbreviation` | `string` | Yahoo abbreviation (NA placeholder). |
| `yahoo_team_name` | `string` | Yahoo team name (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |

## `loadNbaPlayerCore`

Release: [espn_nba_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nba_player_core) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_player_core/player_core_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPlayerCore({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.nba.load_nba_player_core(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPlayerCoreRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
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

## `loadNbaPlayerImpact`

Release: [nba_player_impact](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_player_impact) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_player_impact/nba_player_impact_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1996) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaPlayerImpact({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nba.load_nba_player_impact(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaPlayerImpactRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `player_name` | `string` | Player name. |
| `team_id` | `string` | Unique team identifier. |
| `team_abbreviation` | `string` | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `teams` | `string` | Nested list of member-team membership spans. |
| `season` | `number \| bigint` | Season year. |
| `season_type` | `string` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `o_rapm` | `number` | Offensive regularized adjusted plus-minus per 100 possessions from the single-season ridge fit over possession-level lineup indicators; positive means the player raised his team's scoring rate while on offense. |
| `d_rapm` | `number` | Defensive regularized adjusted plus-minus per 100 possessions, negated from the raw points-allowed coefficient so a positive value marks a defender who suppresses opponent scoring. |
| `rapm` | `number` | Total regularized adjusted plus-minus per 100 possessions, exactly the sum of o_rapm and d_rapm. |
| `off_poss` | `number \| bigint` | Number of possessions the player was on the floor on offense, the count of design-matrix rows carrying his offensive indicator and therefore the offensive-side sample size behind o_rapm. |
| `def_poss` | `number \| bigint` | Number of possessions the player was on the floor on defense, the sample size behind d_rapm; it tracks off_poss almost exactly because substitutions rarely split an offense-defense pair. |
| `o_adj_rapm` | `number` | Offensive regularized adjusted plus/minus after the ridge opponent adjustment. |
| `d_adj_rapm` | `number` | Defensive regularized adjusted plus/minus after the ridge opponent adjustment. |
| `adj_rapm` | `number` | Total prior-informed RAPM per 100 possessions, exactly the sum of o_adj_rapm and d_adj_rapm. |
| `ospm` | `number` | Offensive statistical plus-minus per 100 possessions: the player's per-100 box-score feature vector scored through ridge coefficients trained on that season's o_rapm target. |
| `dspm` | `number` | Defensive statistical plus-minus per 100 possessions from the same box-score feature vector scored through coefficients trained on the d_rapm target. |
| `spm` | `number` | Total statistical plus-minus per 100 possessions, exactly the sum of ospm and dspm. |
| `min` | `number` | Minutes played. |
| `gp` | `number \| bigint` | Games played. |
| `obpm` | `number` | Offensive box plus/minus. |
| `dbpm` | `number` | Defensive box plus/minus. |
| `bpm` | `number` | Career box plus/minus. |
| `war` | `number` | Wins above replacement, computed as (rapm minus a replacement level of -2.0 per 100) times total possessions divided by 100, divided by a points-per-win constant calibrated each season by regressing team wins on full-season point margin. |
| `darko_filtered_skill` | `number` | DARKO-style Kalman-filtered skill estimate at the end of the player's observed multi-season RAPM panel, i.e. his current-form rating after aging drift and possession-weighted observation noise. |
| `darko_projected_rating` | `number` | One-season-ahead DARKO forecast, the filtered skill plus the empirical aging-curve drift at the player's last observed age; both season_type rows of a player-season carry the same value because the projection is not playoff-specific. |
| `darko_projected_sd` | `number` | Standard deviation of the one-season-ahead DARKO forecast, the square root of the filtered state variance plus the Kalman process variance; it sits at roughly 10.19 for a player with only one season in the panel, whose diffuse prior variance was never updated. |

## `loadNbaGroups`

Release: [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_groups/nba_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. nba:atlantic) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the ENDING year (2025 = the 2024-25 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaGroups();
// snake_case alias (py/R parity): sdv.nba.load_nba_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `last_season` | `number` | Last season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadNbaGroupSeasons`

Release: [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_groups/nba_group_seasons.parquet`

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
const rows = await sdv.nba.loadNbaGroupSeasons();
// snake_case alias (py/R parity): sdv.nba.load_nba_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (ENDING year: 2025 = the 2024-25 season). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadNbaGroupAliases`

Release: [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_groups/nba_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, nba_stats, sdv) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaGroupAliases();
// snake_case alias (py/R parity): sdv.nba.load_nba_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nba"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, nba_stats, sdv); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded (still in use). |

## `loadNbaTeamGroupSeasons`

Release: [nba_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nba_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nba_groups/nba_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id; team_id_source names the id space. season is the ENDING year (2025 = the 2024-25 season); seasons 1971-2027.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1971) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nba.loadNbaTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nba.load_nba_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNbaTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nba"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (ENDING year: 2025 = the 2024-25 season). |
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
