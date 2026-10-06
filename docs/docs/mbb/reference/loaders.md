---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.mbb` — dataset loaders

34 loaders reading the published sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadMbbPbp`](#loadmbbpbp) | [espn_mens_college_basketball_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_pbp) | 2002+ |
| [`loadMbbPlayerBoxscore`](#loadmbbplayerboxscore) | [espn_mens_college_basketball_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_boxscores) | 2002+ |
| [`loadMbbSchedule`](#loadmbbschedule) | [espn_mens_college_basketball_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_schedules) | 2002+ |
| [`loadMbbTeamBoxscore`](#loadmbbteamboxscore) | [espn_mens_college_basketball_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_team_boxscores) | 2002+ |
| [`loadMbbRatings`](#loadmbbratings) | [mbb_ratings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_ratings) | 2006+ |
| [`loadMbbPlayerValue`](#loadmbbplayervalue) | [mbb_player_value](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_player_value) | 2006+ |
| [`loadMbbShots`](#loadmbbshots) | [espn_mens_college_basketball_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_shots) | 2025+ |
| [`loadMbbStandings`](#loadmbbstandings) | [espn_mens_college_basketball_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_standings) | 2003+ |
| [`loadMbbPlayerSeasonStats`](#loadmbbplayerseasonstats) | [espn_mens_college_basketball_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_season_stats) | 2025+ |
| [`loadMbbRosters`](#loadmbbrosters) | [espn_mens_college_basketball_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_rosters) | 2025+ |
| [`loadMbbOfficials`](#loadmbbofficials) | [espn_mens_college_basketball_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_officials) | 2025+ |
| [`loadMbbGameRosters`](#loadmbbgamerosters) | [espn_mens_college_basketball_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_game_rosters) | 2025+ |
| [`loadMbbTeamSeasonStats`](#loadmbbteamseasonstats) | [espn_mens_college_basketball_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_team_season_stats) | 2003+ |
| [`loadMbbPlayerCrosswalk`](#loadmbbplayercrosswalk) | [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) | 2025+ |
| [`loadMbbScheduleCrosswalk`](#loadmbbschedulecrosswalk) | [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) | 2025+ |
| [`loadMbbTeamCrosswalk`](#loadmbbteamcrosswalk) | [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) | 2002+ |
| [`loadMbbPlayerCore`](#loadmbbplayercore) | [espn_mens_college_basketball_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_core) | 2003+ |
| [`loadNcaaMbbPbp`](#loadncaambbpbp) | [ncaa_mbb_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_pbp) | 2010+ |
| [`loadNcaaMbbSchedule`](#loadncaambbschedule) | [ncaa_mbb_schedule](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_schedule) | 2010+ |
| [`loadNcaaMbbPlayerBox`](#loadncaambbplayerbox) | [ncaa_mbb_player_box](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_player_box) | 2010+ |
| [`loadNcaaMbbTeamBox`](#loadncaambbteambox) | [ncaa_mbb_team_box](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_box) | 2010+ |
| [`loadNcaaMbbRosters`](#loadncaambbrosters) | [ncaa_mbb_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rosters) | 2010+ |
| [`loadNcaaMbbTeamRosters`](#loadncaambbteamrosters) | [ncaa_mbb_team_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_rosters) | 2010+ |
| [`loadNcaaMbbTeamIds`](#loadncaambbteamids) | [ncaa_mbb_team_ids](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_ids) | 2010+ |
| [`loadNcaaMbbPossessions`](#loadncaambbpossessions) | [ncaa_mbb_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_possessions) | 2010+ |
| [`loadNcaaMbbLineups`](#loadncaambblineups) | [ncaa_mbb_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_lineups) | 2010+ |
| [`loadNcaaMbbMatchupStints`](#loadncaambbmatchupstints) | [ncaa_mbb_matchup_stints](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_matchup_stints) | 2010+ |
| [`loadNcaaMbbShots`](#loadncaambbshots) | [ncaa_mbb_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_shots) | 2019+ |
| [`loadNcaaMbbRapmWithinTeam`](#loadncaambbrapmwithinteam) | [ncaa_mbb_rapm_within_team](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rapm_within_team) | 2010+ |
| [`loadNcaaMbbRapm`](#loadncaambbrapm) | [ncaa_mbb_rapm](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rapm) | 2011+ |
| [`loadMbbGroups`](#loadmbbgroups) | [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) | one asset |
| [`loadMbbGroupSeasons`](#loadmbbgroupseasons) | [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) | one asset |
| [`loadMbbGroupAliases`](#loadmbbgroupaliases) | [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) | one asset |
| [`loadMbbTeamGroupSeasons`](#loadmbbteamgroupseasons) | [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) | 2002+ |

## `loadMbbPbp`

Release: [espn_mens_college_basketball_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPbp({ seasons: 2024, columns: ['game_id', 'sequence_number', 'type_text', 'text', 'score_value'] });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPbpRow` (exported from the package root).

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
| `wallclock` | `string` | Wallclock. |
| `shooting_play` | `boolean` | TRUE if the play was a shooting attempt. |
| `points_attempted` | `number` | Point value at stake on the shot attempt (3 for threes, 2 for other field goals, 1 for free throws), from the ESPN play type. |
| `short_description` | `string` | Shortened version of ESPN's play description text, without score context. |
| `athlete_id_2` | `string` | Secondary athlete identifier (e.g. assister / fouler). |
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
| `half` | `number` | Half of the game (1 or 2). |
| `time` | `string` | Time / clock value. |
| `clock_minutes` | `number` | Clock minutes split out for convenience. |
| `clock_seconds` | `number` | Clock seconds split out for convenience. |
| `home_timeout_called` | `boolean` | True when the home team called a timeout on the play. |
| `away_timeout_called` | `boolean` | True when the away team called a timeout on the play. |
| `lag_period` | `number` | Period number of the previous play in the same game (period_number shifted forward one row within game_id), and null on each game's first play. |
| `lead_period` | `number` | Period number of the next play in the same game (period_number shifted back one row within game_id), and null on each game's final play. |
| `lag_half` | `number` | A lag column on the half |
| `lead_half` | `number` | A lead column on the half |
| `start_period_seconds_remaining` | `number` | Seconds left in the current period when the play started, computed as 60 times the game clock minutes plus the seconds, so 1200 at the tip of each 20-minute half and 300 at the start of an overtime. |
| `start_game_seconds_remaining` | `number` | Seconds remaining in the game at the start of the play. |
| `end_period_seconds_remaining` | `number` | Seconds left in the period when the play ended. |
| `end_game_seconds_remaining` | `number` | Seconds remaining in the game at the end of the play. |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `coordinate_x` | `number` | X coordinate on the court (half-court layout). |
| `coordinate_y` | `number` | Y coordinate on the court (half-court layout). |
| `coordinate_x_raw` | `number` | X coordinate as returned by the API before any adjustment. |
| `coordinate_y_raw` | `number` | Y coordinate as returned by the API before any adjustment. |
| `athlete_name_1` | `string` | Display name of the first athlete in the ESPN play participants (e.g., the shooter on a shot attempt). |
| `athlete_name_2` | `string` | Display name of the second athlete in the ESPN play participants (e.g., the assisting player), when present. |
| `athlete_name_3` | `string` | Display name of the third athlete in the ESPN play participants, when present. |
| `media_id` | `string` | Media identifier (video / image). |
| `pregame_home_prob` | `number` | Model's pre-game win probability for the home team (0-1), constant within a game. |
| `home_win_prob` | `number` |  |

## `loadMbbPlayerBoxscore`

Release: [espn_mens_college_basketball_player_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_player_boxscores/player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPlayerBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_player_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPlayerBoxscoreRow` (exported from the package root).

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
| `points` | `number` | Points scored. |
| `starter` | `boolean` | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `ejected` | `boolean` | TRUE if the player was ejected from the game. |
| `did_not_play` | `boolean` | TRUE if the player did not appear in the game. |
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
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |

## `loadMbbSchedule`

Release: [espn_mens_college_basketball_schedules](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_schedules) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_schedules/mbb_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbSchedule({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `id` | `string` | Id. |
| `uid` | `string` | ESPN UID string. |
| `date` | `string` | Date in YYYY-MM-DD format. |
| `attendance` | `number` | Reported attendance. |
| `time_valid` | `boolean` | Time valid. |
| `neutral_site` | `boolean` | Neutral site. |
| `conference_competition` | `boolean` | Conference competition. |
| `play_by_play_available` | `boolean` |  |
| `recent` | `boolean` | Recent. |
| `start_date` | `string` | Start date (YYYY-MM-DD). |
| `broadcast` | `string` | Broadcast information string. |
| `highlights` | `string` |  |
| `notes_type` | `string` | Notes type. |
| `notes_headline` | `string` | Notes headline. |
| `broadcast_market` | `string` | Broadcast market label (e.g. 'national', 'home'). |
| `broadcast_name` | `string` | Broadcast name. |
| `type_id` | `string` | Type identifier (numeric). |
| `type_abbreviation` | `string` | Type abbreviation. |
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
| `home_conference_id` | `string` | Unique identifier for home conference. |
| `home_score` | `number` | Home team score at the time of the play. |
| `home_winner` | `boolean` | Home team's winner. |
| `home_current_rank` | `number` | Poll ranking ESPN listed for the home team at game time (unranked teams carry a sentinel value). |
| `home_linescores` | `string` | Period-by-period scores for the home team as a delimited string from ESPN's schedule feed. |
| `home_records` | `string` | Record strings (overall and split records) for the home team from ESPN's schedule feed. |
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
| `away_conference_id` | `string` | Unique identifier for away conference. |
| `away_score` | `number` | Away team score at the time of the play. |
| `away_winner` | `boolean` | Away team's winner. |
| `away_current_rank` | `number` | Poll ranking ESPN listed for the away team at game time (unranked teams carry a sentinel value). |
| `away_linescores` | `string` | Period-by-period scores for the away team as a delimited string from ESPN's schedule feed. |
| `away_records` | `string` | Record strings (overall and split records) for the away team from ESPN's schedule feed. |
| `game_id` | `string` | Unique game identifier. |
| `season` | `number` | Season year. |
| `season_type` | `number` | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `away_non_div1_team` | `boolean` | ESPN's non-Division I flag for the away team: True when the away team is not a Division I program (a lower-division or exhibition opponent, which also carries no away_conference_id); null, not False, for every Division I team. Sparse -- a handful of games per season. |
| `status_type_alt_detail` | `string` | Status type alt detail. |
| `tournament_id` | `string` | ESPN tournament identifier. |
| `groups_id` | `string` | Unique identifier for groups. |
| `groups_name` | `string` | Groups name. |
| `groups_short_name` | `string` | Groups short name. |
| `groups_is_conference` | `boolean` | Groups is conference. |
| `game_json` | `boolean` |  |
| `game_json_url` | `string` |  |
| `game_date_time` | `Date` | Game start date/time (ISO 8601). |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `PBP` | `boolean` |  |
| `team_box` | `boolean` | Team box. |
| `player_box` | `boolean` | Player box. |

## `loadMbbTeamBoxscore`

Release: [espn_mens_college_basketball_team_boxscores](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_team_boxscores) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_team_boxscores/team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbTeamBoxscore({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_team_boxscore(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbTeamBoxscoreRow` (exported from the package root).

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
| `lead_percentage` | `string` | Share of game time the team held the lead, as reported in ESPN's team boxscore. |

## `loadMbbRatings`

Release: [mbb_ratings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_ratings) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_ratings/mbb_ratings_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2006) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbRatings({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_ratings(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbRatingsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season year. |
| `team_id` | `string` | Unique team identifier. |
| `adj_o` | `number` | Adj o. |
| `adj_d` | `number` | Adj d. |
| `adj_em` | `number` | Adj em. |
| `adj_tempo` | `number` | Opponent-adjusted possessions per 40 minutes, solved by the same fixed point as the efficiency ratings under the additive model that a game's pace is the two teams' tempos less the league baseline; it averages about 71 in 2025. |
| `raw_o` | `number` | Raw o. |
| `raw_d` | `number` | Raw d. |
| `games` | `number \| bigint` | Games played. |
| `rank` | `number \| bigint` | Rank. |
| `adj_em_z` | `number` | Within-season z-score of adj_em, computed as adj_em minus the season mean divided by the season standard deviation, so each season is centered at zero with unit spread. |

## `loadMbbPlayerValue`

Release: [mbb_player_value](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_player_value) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_player_value/mbb_player_value_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2006) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPlayerValue({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_player_value(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPlayerValueRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `player_id` | `string` | Unique player identifier. |
| `player` | `string` | Player name. |
| `season` | `number \| bigint` | Season year. |
| `team_id` | `string` | Unique team identifier. |
| `min` | `number` | Minutes played. |
| `box_obpm` | `number` | Box-score offensive plus/minus for the player, the offensive half of box BPM. |
| `box_dbpm` | `number` | Box-score defensive plus/minus for the player, the defensive half of box BPM. |
| `box_bpm` | `number` | Total box plus/minus in points per 100 possessions above an average player, exactly box_obpm plus box_dbpm (verified to zero residual across all 9,805 rows of 2025). |
| `qualified` | `boolean` |  |

## `loadMbbShots`

Release: [espn_mens_college_basketball_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_shots/shots_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbShots({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbShotsRow` (exported from the package root).

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
| `athlete_name_1` | `string` | Display name of the shooter credited on the attempt in ESPN's play participants. |
| `athlete_name_2` | `string` | Display name of the second athlete tied to the attempt (typically the assister), when present. |
| `team_name` | `string` | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_mascot` | `string` | Mascot/nickname of the shooting team from ESPN's team record. |
| `team_abbrev` | `string` | Abbreviation for team. |

## `loadMbbStandings`

Release: [espn_mens_college_basketball_standings](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_standings) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_standings/standings_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2003) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbStandings({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_standings(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbStandingsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `group_id` | `string` | ESPN group id. |
| `group_name` | `string` |  |
| `group_abbreviation` | `string` |  |
| `group_short_name` | `string` | Abbreviated conference label ESPN prints in standings tables, such as ACC, Big Ten or Am. East, one value per group_id. |
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
| `stat_short_display_name` | `string` |  |
| `stat_description` | `string` | ESPN's longer-form label for the standings statistic, which can differ from stat_display_name (streak is described as Current Streak and playoffSeed as Playoff Seed). |
| `stat_abbreviation` | `string` | Short code ESPN prints for the standings statistic in a table header, such as W, L, PCT, GB or STRK; it diverges from stat_short_display_name for playoff seed and the home and conference record rows. |
| `stat_type` | `string` | Stat type code (e.g. "win", "loss"). |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadMbbPlayerSeasonStats`

Release: [espn_mens_college_basketball_player_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_player_season_stats/player_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPlayerSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_player_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPlayerSeasonStatsRow` (exported from the package root).

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
| `stat_label` | `string` |  |
| `stat_name` | `string` | Stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | ESPN's prose glossary definition of the statistic named in stat_name, for example defining assists as a pass to a teammate that leads directly to a field goal. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadMbbRosters`

Release: [espn_mens_college_basketball_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_rosters/rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbRostersRow` (exported from the package root).

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

## `loadMbbOfficials`

Release: [espn_mens_college_basketball_officials](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_officials) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_officials/officials_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbOfficials({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_officials(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbOfficialsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `game_id` | `string` | Unique game identifier. |
| `official_full_name` | `string` | Full name of the game official as published in ESPN's gameInfo officials list; in this release it is byte-identical to official_display_name on every row. |
| `official_display_name` | `string` | Display form of the official's name used by ESPN's game feed, which duplicates official_full_name for all 18,284 rows of the 2025 release. |
| `official_position` | `string` | ESPN's role label for the crew member, which is the constant Referee for every men's college basketball official in this release rather than a distinct crew chief or umpire designation. |
| `official_position_id` | `string` | ESPN's numeric code for the official's role, constant at 40 (Referee) across the entire men's college basketball officials release. |
| `official_order` | `number` | Position of the official within the game's listed officiating crew. |

## `loadMbbGameRosters`

Release: [espn_mens_college_basketball_game_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_game_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_game_rosters/game_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbGameRosters({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_game_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbGameRostersRow` (exported from the package root).

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
| `athlete_first_name` | `string` |  |
| `athlete_last_name` | `string` |  |
| `athlete_jersey` | `string` | Athlete jersey number. |
| `athlete_position` | `string` | Athlete position. |
| `athlete_headshot` | `string` | URL of the player's ESPN headshot image, whose filename is the athlete_id (verified equal for all 190,365 non-null rows in 2025); null when ESPN publishes no photo for that player. |
| `starter` | `boolean` | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `did_not_play` | `boolean` | TRUE if the player did not appear in the game. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |
| `ejected` | `boolean` | TRUE if the player was ejected from the game. |
| `reason` | `string` | Reason. |

## `loadMbbTeamSeasonStats`

Release: [espn_mens_college_basketball_team_season_stats](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_team_season_stats) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_team_season_stats/team_season_stats_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2003) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbTeamSeasonStats({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_team_season_stats(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbTeamSeasonStatsRow` (exported from the package root).

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
| `stat_label` | `string` |  |
| `stat_name` | `string` | Stat key. |
| `stat_display_name` | `string` | Stat display name. |
| `stat_description` | `string` | ESPN's prose glossary definition of the statistic named in stat_name, for example defining field goal percentage as the ratio of field goals made to field goals attempted. |
| `display_value` | `string` | Display-formatted value. |
| `value` | `number` | Numeric or string value field. |

## `loadMbbPlayerCrosswalk`

Release: [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_crosswalk/mbb_player_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPlayerCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_player_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPlayerCrosswalkRow` (exported from the package root).

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
| `fox_athlete_id` | `string` | Fox athlete id (NA if unmatched). |
| `fox_player` | `string` | Fox player name (NA if unmatched). |
| `fox_jersey` | `string` | Fox jersey number (NA if unmatched). |
| `fox_position_group` | `string` | Fox position group label (NA if unmatched). |
| `yahoo_player_id` | `string` | Yahoo player id (NA placeholder). |
| `yahoo_player_name` | `string` | Yahoo player name (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |
| `match_keys` | `string` | NA (reserved for future use). |

## `loadMbbScheduleCrosswalk`

Release: [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_crosswalk/mbb_schedule_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2025) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbScheduleCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_schedule_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbScheduleCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `game_date` | `Date` | Game date (YYYY-MM-DD). |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `bart_muid` | `string` | Torvik muid (NA for espn-only rows). |
| `bart_team1` | `string` | Torvik team1 name (NA for espn-only rows). |
| `bart_team2` | `string` | Torvik team2 name (NA for espn-only rows). |
| `bart_winner` | `string` | Torvik winner name (NA for espn-only rows). |
| `kp_game_id` | `string` | KenPom game id (NA unless kenpom enabled). |
| `fox_game_id` | `string` | Fox game id (NA placeholder). |
| `yahoo_game_id` | `string` | Yahoo game id (NA placeholder). |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |
| `match_confidence` | `number` | Jaro-Winkler score or 1 for exact (NA if none). |

## `loadMbbTeamCrosswalk`

Release: [mbb_crosswalk](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_crosswalk) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_crosswalk/mbb_team_crosswalk_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbTeamCrosswalk({ seasons: 2026 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_team_crosswalk(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbTeamCrosswalkRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season year. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `espn_abbreviation` | `string` | ESPN abbreviation. |
| `espn_display_name` | `string` | ESPN display name (school + mascot). |
| `espn_short_name` | `string` | ESPN short name. |
| `espn_location` | `string` | ESPN school/location only. |
| `espn_mascot` | `string` | ESPN mascot/nickname. |
| `espn_conference` | `string` | ESPN conference name. |
| `fox_team_id` | `string` | Fox Bifrost team id (NA if unmatched). |
| `fox_team_name` | `string` | Fox team name (NA if unmatched). |
| `fox_section` | `string` | Fox conference/section label (NA if unmatched). |
| `bart_team` | `string` | Torvik team name (NA if unmatched). |
| `bart_conf` | `string` | Torvik conference abbreviation (NA if unmatched). |
| `kp_team` | `string` | KenPom team name (NA if unmatched). |
| `kp_conf` | `string` | KenPom conference abbreviation (NA if unmatched). |
| `yahoo_team_id` | `string` | Yahoo team id (NA placeholder). |
| `yahoo_team_name` | `string` | Yahoo team name (NA placeholder). |
| `fox_match_confidence` | `number` | 1 for matched, NA for unmatched. |
| `bart_match_confidence` | `number` | 1 for matched, NA for unmatched. |
| `kp_match_confidence` | `number` | 1 for matched, NA for unmatched. |
| `match_method` | `string` | Combination of matched sources, e.g. "fox+bart" / "fox_only" / "bart_only" / "espn_only". |

## `loadMbbPlayerCore`

Release: [espn_mens_college_basketball_player_core](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_mens_college_basketball_player_core) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_mens_college_basketball_player_core/player_core_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2003) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbPlayerCore({ seasons: 2025 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_player_core(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbPlayerCoreRow` (exported from the package root).

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
| `birth_country` | `string` |  |
| `jersey` | `string` | Jersey number worn by the player. |
| `position_id` | `string` | Unique position identifier. |
| `position_name` | `string` | Listed roster position ('Guard', 'Forward', 'Center'). |
| `position_abbreviation` | `string` | Position abbreviation ('G' / 'F' / 'C'). |
| `position_display_name` | `string` | Position display name. |
| `college_id` | `string` | Unique identifier for college. |
| `current_team_id` | `string` |  |
| `headshot_href` | `string` | Headshot image URL. |
| `experience_years` | `number` | Experience years. |
| `status_id` | `string` | Status identifier. |
| `status_name` | `string` | Status label. |
| `status_type` | `string` | Status type. |
| `draft_year` | `number` | Draft year (4-digit). |
| `draft_round` | `number` | Round of the draft selection. |
| `draft_selection` | `number` | Draft selection. |
| `active` | `boolean` | TRUE if the row represents an active record (player / team / season). |

## `loadNcaaMbbPbp`

Release: [ncaa_mbb_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_pbp/ncaa_mbb_pbp_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbPbp({ seasons: 2024, columns: ['game_date', 'home', 'away', 'period', 'event_type', 'shot_value'] });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `clock` | `string` | Game clock value. |
| `game_time` | `string` | Game start time. |
| `game_seconds` | `number \| bigint` |  |
| `home_score` | `number \| bigint` | Home team score at the time of the play. |
| `away_score` | `number \| bigint` | Away team score at the time of the play. |
| `event_team` | `string` |  |
| `event_description` | `string` |  |
| `player_1` | `string` | Name of the primary player credited on the event (shooter, fouler, rebounder, etc.), as scraped from stats.ncaa.org. |
| `player_2` | `string` | Name of the secondary player on the event (e.g., the assister or the player subbed for), when present. |
| `event_type` | `string` | Event / play type code (V2 PBP). |
| `event_result` | `string` | Outcome of the event, e.g. made or missed for shot attempts. |
| `shot_value` | `number \| bigint` | Point value of the shot (2 or 3). |
| `event_length` | `number \| bigint` | Seconds elapsed between this event and the previous event in the game. |
| `poss_num` | `number \| bigint` | Sequential possession number within the game that the event belongs to. |
| `poss_team` | `string` | Name of the team in possession when the event occurred. |
| `poss_length` | `number \| bigint` | Duration of the enclosing possession in seconds. |
| `is_transition` | `boolean` | Flag marking events that occurred in transition, within the opening seconds of the possession. |
| `home_1` | `string` | Name of the home team's on-floor player in lineup slot 1 for the event, from the substitution walk-forward. |
| `home_2` | `string` | Name of the home team's on-floor player in lineup slot 2 for the event, from the substitution walk-forward. |
| `home_3` | `string` | Name of the home team's on-floor player in lineup slot 3 for the event, from the substitution walk-forward. |
| `home_4` | `string` | Name of the home team's on-floor player in lineup slot 4 for the event, from the substitution walk-forward. |
| `home_5` | `string` | Name of the home team's on-floor player in lineup slot 5 for the event, from the substitution walk-forward. |
| `away_1` | `string` | Name of the away team's on-floor player in lineup slot 1 for the event, from the substitution walk-forward. |
| `away_2` | `string` | Name of the away team's on-floor player in lineup slot 2 for the event, from the substitution walk-forward. |
| `away_3` | `string` | Name of the away team's on-floor player in lineup slot 3 for the event, from the substitution walk-forward. |
| `away_4` | `string` | Name of the away team's on-floor player in lineup slot 4 for the event, from the substitution walk-forward. |
| `away_5` | `string` | Name of the away team's on-floor player in lineup slot 5 for the event, from the substitution walk-forward. |
| `status` | `string` | Status label. |
| `is_garbage_time` | `boolean` | Flag marking events in garbage time under the score-margin and clock rule of the pbp builder. |
| `sub_deviate` | `number \| bigint` | Per-game count of substitution-tracking deviations found while walking lineups forward; nonzero flags imperfect substitution data. |
| `contest_id` | `string` |  |
| `home_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the home team. |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the away team. |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `event_team_ncaa_team_id` | `string` | stats.ncaa.org team identifier of the team credited with the event. |
| `event_team_espn_team_id` | `string` | ESPN team identifier of the team credited with the event, via the NCAA-to-ESPN crosswalk. |
| `poss_team_ncaa_team_id` | `string` | stats.ncaa.org team identifier of the team in possession. |
| `poss_team_espn_team_id` | `string` | ESPN team identifier of the team in possession, via the NCAA-to-ESPN crosswalk. |
| `player_1_id` | `string` | stats.ncaa.org player identifier for player_1, resolved through the roster name matcher. |
| `player_1_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name for player_1. |
| `player_2_id` | `string` | stats.ncaa.org player identifier for player_2, resolved through the roster name matcher. |
| `player_2_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name for player_2. |
| `home_1_player_id` | `string` | stats.ncaa.org player identifier for the home slot-1 on-floor player. |
| `home_1_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-1 on-floor player. |
| `home_2_player_id` | `string` | stats.ncaa.org player identifier for the home slot-2 on-floor player. |
| `home_2_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-2 on-floor player. |
| `home_3_player_id` | `string` | stats.ncaa.org player identifier for the home slot-3 on-floor player. |
| `home_3_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-3 on-floor player. |
| `home_4_player_id` | `string` | stats.ncaa.org player identifier for the home slot-4 on-floor player. |
| `home_4_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-4 on-floor player. |
| `home_5_player_id` | `string` | stats.ncaa.org player identifier for the home slot-5 on-floor player. |
| `home_5_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-5 on-floor player. |
| `away_1_player_id` | `string` | stats.ncaa.org player identifier for the away slot-1 on-floor player. |
| `away_1_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-1 on-floor player. |
| `away_2_player_id` | `string` | stats.ncaa.org player identifier for the away slot-2 on-floor player. |
| `away_2_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-2 on-floor player. |
| `away_3_player_id` | `string` | stats.ncaa.org player identifier for the away slot-3 on-floor player. |
| `away_3_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-3 on-floor player. |
| `away_4_player_id` | `string` | stats.ncaa.org player identifier for the away slot-4 on-floor player. |
| `away_4_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-4 on-floor player. |
| `away_5_player_id` | `string` | stats.ncaa.org player identifier for the away slot-5 on-floor player. |
| `away_5_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-5 on-floor player. |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `is_fastbreak` | `boolean` | Flag marking the shot as a fast-break attempt, from the stats.ncaa.org play text. |
| `is_from_turnover` | `boolean` | Flag marking an attempt generated off an opponent turnover. |
| `is_paint` | `boolean` | Flag marking the shot as attempted in the paint. |
| `is_second_chance` | `boolean` | Flag marking a second-chance attempt following an offensive rebound. |
| `assist_player` | `string` | Name of the player credited with the assist on a made shot, when present. |
| `ft_number` | `number \| bigint` | Which free throw of the trip this attempt is (1 of 2, 2 of 2, etc.). |
| `ft_attempts` | `number \| bigint` | Total free throws in the trip this attempt belongs to. |
| `foul_class` | `string` | Parsed category of the foul event (e.g. personal, offensive). |
| `is_shooting_foul` | `boolean` | Flag marking the foul as a shooting foul. |
| `is_looseball_foul` | `boolean` | Flag marking the foul as a loose-ball foul. |
| `is_one_and_one` | `boolean` | Flag marking a bonus one-and-one free-throw trip. |
| `is_flagrant` | `boolean` | Flag marking the foul as flagrant. |
| `foul_tech_class` | `string` | Parsed technical-foul class for technical foul events, when present. |
| `ft_awarded` | `number \| bigint` | Number of free throws awarded by the foul. |
| `turnover_type` | `string` | Parsed turnover subtype (e.g. lost ball, bad pass, travel). |
| `is_team_turnover` | `boolean` | Flag marking a turnover charged to the team rather than an individual player. |
| `timeout_type` | `string` | Type of timeout called (e.g. full, 30-second, media). |
| `challenge_outcome` | `string` | Outcome of a coach's challenge or video-review event, when present. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbSchedule`

Release: [ncaa_mbb_schedule](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_schedule) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_schedule/ncaa_mbb_schedule_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbSchedule({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_schedule(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbScheduleRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` |  |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `home_score` | `number \| bigint` | Home team score at the time of the play. |
| `away_score` | `number \| bigint` | Away team score at the time of the play. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbPlayerBox`

Release: [ncaa_mbb_player_box](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_player_box) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_player_box/ncaa_mbb_player_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbPlayerBox({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_player_box(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbPlayerBoxRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `team` | `string` | Team-side label or team identifier. |
| `player` | `string` | Player name. |
| `mins` | `number` | Minutes played, derived from the lineup walk-forward through the play-by-play. |
| `o_poss` | `number` | Offensive possessions the player was on the floor for. |
| `pts` | `number` | Points scored. |
| `orb` | `number` | Offensive rebounds. |
| `drb` | `number` | Defensive rebounds. |
| `ast` | `number` | Assists. |
| `stl` | `number` | Steals. |
| `blk` | `number` | Blocks. |
| `tov` | `number` | Turnovers. |
| `pf` | `number` | Personal fouls. |
| `ts_pct` | `number` | True shooting percentage (0-1). |
| `efg_pct` | `number` | Effective field-goal percentage, weighting made threes at 1.5. |
| `fgm` | `number` | Field goals made. |
| `fga` | `number` | Field goal attempts. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `tpm` | `number` | Three-point field goals made. |
| `tpa` | `number` | Three-point field goals attempted. |
| `tp_pct` | `number` | Three-point field-goal percentage. |
| `ftm` | `number` | Free throws made. |
| `fta` | `number` | Free throw attempts. |
| `ft_pct` | `number` | Free throw percentage (0-1). |
| `rimm` | `number` | Rim shots (dunks, layups, hooks, tip-ins) made. |
| `rima` | `number` | Rim shots (dunks, layups, hooks, tip-ins) attempted. |
| `rim_pct` | `number` | Field-goal percentage on rim attempts. |
| `midm` | `number` | Mid-range (non-rim two-point) shots made. |
| `mida` | `number` | Mid-range (non-rim two-point) shots attempted. |
| `mid_pct` | `number` | Field-goal percentage on mid-range attempts. |
| `pbackm` | `number` | Putbacks made — rim shots immediately following an offensive rebound. |
| `pbacka` | `number` | Putbacks attempted — rim shots immediately following an offensive rebound. |
| `pback_pct` | `number` | Field-goal percentage on putback attempts. |
| `blk_rim` | `number` | Blocks recorded against opponent rim attempts. |
| `blk_mid` | `number` | Blocks recorded against opponent mid-range attempts. |
| `blk_three` | `number` | Blocks recorded against opponent three-point attempts. |
| `pct_fga_trans` | `number` | Share of the player's field-goal attempts taken in transition. |
| `pct_tpa_trans` | `number` | Share of the player's three-point attempts taken in transition. |
| `pct_rima_trans` | `number` | Share of the player's rim attempts taken in transition. |
| `pct_fgm_trans` | `number` | Share of the player's field-goal makes that came in transition. |
| `pct_tpm_trans` | `number` | Share of the player's three-point makes that came in transition. |
| `pct_rimm_trans` | `number` | Share of the player's rim makes that came in transition. |
| `pct_fgm_ast` | `number` | Share of the player's made field goals that were assisted. |
| `pct_tpm_ast` | `number` | Share of the player's made threes that were assisted. |
| `pct_rimm_ast` | `number` | Share of the player's made rim shots that were assisted. |
| `pts_trans` | `number` | Points scored in transition possessions. |
| `orb_trans` | `number` | Offensive rebounds in transition possessions. |
| `drb_trans` | `number` | Defensive rebounds in transition possessions. |
| `ast_trans` | `number` | Assists in transition possessions. |
| `stl_trans` | `number` | Steals in transition possessions. |
| `blk_trans` | `number` | Blocks in transition possessions. |
| `tov_trans` | `number` | Turnovers in transition possessions. |
| `ts_pct_trans` | `number` | True-shooting percentage in transition possessions. |
| `efg_pct_trans` | `number` | Effective field-goal percentage in transition possessions. |
| `fgm_trans` | `number` | Field goals made in transition possessions. |
| `fga_trans` | `number` | Field goals attempted in transition possessions. |
| `fg_pct_trans` | `number` | Field-goal percentage in transition possessions. |
| `tpm_trans` | `number` | Three-pointers made in transition possessions. |
| `tpa_trans` | `number` | Three-pointers attempted in transition possessions. |
| `tp_pct_trans` | `number` | Three-point percentage in transition possessions. |
| `ftm_trans` | `number` | Free throws made in transition possessions. |
| `fta_trans` | `number` | Free throws attempted in transition possessions. |
| `ft_pct_trans` | `number` | Free-throw percentage in transition possessions. |
| `rimm_trans` | `number` | Rim shots made in transition possessions. |
| `rima_trans` | `number` | Rim shots attempted in transition possessions. |
| `rim_pct_trans` | `number` | Rim field-goal percentage in transition possessions. |
| `midm_trans` | `number` | Mid-range shots made in transition possessions. |
| `mida_trans` | `number` | Mid-range shots attempted in transition possessions. |
| `mid_pct_trans` | `number` | Mid-range field-goal percentage in transition possessions. |
| `pts_half` | `number` | Points scored in halfcourt possessions. |
| `orb_half` | `number` | Offensive rebounds in halfcourt possessions. |
| `drb_half` | `number` | Defensive rebounds in halfcourt possessions. |
| `ast_half` | `number` | Assists in halfcourt possessions. |
| `stl_half` | `number` | Steals in halfcourt possessions. |
| `blk_half` | `number` | Blocks in halfcourt possessions. |
| `tov_half` | `number` | Turnovers in halfcourt possessions. |
| `ts_pct_half` | `number` | True-shooting percentage in halfcourt possessions. |
| `efg_pct_half` | `number` | Effective field-goal percentage in halfcourt possessions. |
| `fgm_half` | `number` | Field goals made in halfcourt possessions. |
| `fga_half` | `number` | Field goals attempted in halfcourt possessions. |
| `fg_pct_half` | `number` | Field-goal percentage in halfcourt possessions. |
| `tpm_half` | `number` | Three-pointers made in halfcourt possessions. |
| `tpa_half` | `number` | Three-pointers attempted in halfcourt possessions. |
| `tp_pct_half` | `number` | Three-point percentage in halfcourt possessions. |
| `ftm_half` | `number` | Free throws made in halfcourt possessions. |
| `fta_half` | `number` | Free throws attempted in halfcourt possessions. |
| `ft_pct_half` | `number` | Free-throw percentage in halfcourt possessions. |
| `rimm_half` | `number` | Rim shots made in halfcourt possessions. |
| `rima_half` | `number` | Rim shots attempted in halfcourt possessions. |
| `rim_pct_half` | `number` | Rim field-goal percentage in halfcourt possessions. |
| `midm_half` | `number` | Mid-range shots made in halfcourt possessions. |
| `mida_half` | `number` | Mid-range shots attempted in halfcourt possessions. |
| `mid_pct_half` | `number` | Mid-range field-goal percentage in halfcourt possessions. |
| `pts_ast` | `number` | Points from the player's assisted field-goal makes. |
| `fgm_ast` | `number` | Assisted field-goal makes. |
| `tpm_ast` | `number` | Assisted three-point makes. |
| `rimm_ast` | `number` | Assisted rim makes. |
| `midm_ast` | `number` | Assisted mid-range makes. |
| `pts_unast` | `number` | Points from the player's unassisted field-goal makes. |
| `efg_pct_unast` | `number` | Effective field-goal percentage in the unassisted split (makes for which no assist was credited). |
| `fgm_unast` | `number` | Field goals made in the unassisted split (makes for which no assist was credited). |
| `fga_unast` | `number` | Field goals attempted in the unassisted split (makes for which no assist was credited). |
| `fg_pct_unast` | `number` | Field-goal percentage in the unassisted split (makes for which no assist was credited). |
| `tpm_unast` | `number` | Three-pointers made in the unassisted split (makes for which no assist was credited). |
| `tpa_unast` | `number` | Three-pointers attempted in the unassisted split (makes for which no assist was credited). |
| `tp_pct_unast` | `number` | Three-point percentage in the unassisted split (makes for which no assist was credited). |
| `rimm_unast` | `number` | Rim shots made in the unassisted split (makes for which no assist was credited). |
| `rima_unast` | `number` | Rim shots attempted in the unassisted split (makes for which no assist was credited). |
| `rim_pct_unast` | `number` | Rim field-goal percentage in the unassisted split (makes for which no assist was credited). |
| `midm_unast` | `number` | Mid-range shots made in the unassisted split (makes for which no assist was credited). |
| `mida_unast` | `number` | Mid-range shots attempted in the unassisted split (makes for which no assist was credited). |
| `mid_pct_unast` | `number` | Mid-range field-goal percentage in the unassisted split (makes for which no assist was credited). |
| `contest_id` | `string` |  |
| `home_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the home team. |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the away team. |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `team_ncaa_team_id` | `string` | stats.ncaa.org team identifier of the player's team. |
| `team_espn_team_id` | `string` | ESPN team identifier of the player's team, via the NCAA-to-ESPN crosswalk. |
| `player_id` | `string` | Unique player identifier. |
| `clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) player name used to join across the NCAA datasets. |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbTeamBox`

Release: [ncaa_mbb_team_box](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_box) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_team_box/ncaa_mbb_team_box_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbTeamBox({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_team_box(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbTeamBoxRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `team` | `string` | Team-side label or team identifier. |
| `mins` | `number` | Minutes covered by the team's tracked lineups in the game. |
| `o_mins` | `number` | Minutes spent on tracked offensive possessions. |
| `d_mins` | `number` | Minutes spent on tracked defensive possessions. |
| `o_poss` | `number` | Offensive possessions. |
| `d_poss` | `number` | Defensive possessions. |
| `ortg` | `number` | Offensive rating — points scored per 100 possessions. |
| `drtg` | `number` | Defensive rating — points allowed per 100 possessions. |
| `netrtg` | `number` | Net rating — offensive rating minus defensive rating. |
| `pts` | `number` | Points scored. |
| `d_pts` | `number` | Points allowed. |
| `fga` | `number` | Field goal attempts. |
| `d_fga` | `number` | Opponent field-goal attempts. |
| `fgm` | `number` | Field goals made. |
| `d_fgm` | `number` | Opponent field goals made. |
| `tpa` | `number` | Three-point attempts. |
| `d_tpa` | `number` | Opponent three-point attempts. |
| `tpm` | `number` | Three-pointers made. |
| `d_tpm` | `number` | Opponent three-pointers made. |
| `fta` | `number` | Free throw attempts. |
| `d_fta` | `number` | Opponent free-throw attempts. |
| `ftm` | `number` | Free throws made. |
| `d_ftm` | `number` | Opponent free throws made. |
| `rima` | `number` | Rim shots (dunks, layups, hooks, tip-ins) attempted. |
| `d_rima` | `number` | Opponent rim shots attempted. |
| `rimm` | `number` | Rim shots made. |
| `d_rimm` | `number` | Opponent rim shots made. |
| `orb` | `number` | Offensive rebounds. |
| `d_orb` | `number` | Opponent offensive rebounds. |
| `drb` | `number` | Defensive rebounds. |
| `d_drb` | `number` | Opponent defensive rebounds. |
| `blk` | `number` | Blocks. |
| `d_blk` | `number` | Opponent blocks (own shots blocked). |
| `to` | `number` | To. |
| `d_to` | `number` | Opponent turnovers forced. |
| `ast` | `number` | Assists. |
| `d_ast` | `number` | Opponent assists allowed. |
| `e_poss` | `number` | Estimated possessions — the average of the team's and the opponent's raw possession counts. |
| `fg_pct` | `number` | Field goal percentage (0-1). |
| `d_fg_pct` | `number` | Opponent field-goal percentage. |
| `tpp` | `number` | Three-point percentage. |
| `d_tpp` | `number` | Opponent three-point percentage. |
| `ftp` | `number` | Free-throw percentage. |
| `d_ftp` | `number` | Opponent free-throw percentage. |
| `efg_pct` | `number` | Effective field-goal percentage, weighting made threes at 1.5. |
| `d_efg_pct` | `number` | Opponent effective field-goal percentage. |
| `ts_pct` | `number` | True shooting percentage (0-1). |
| `d_ts_pct` | `number` | Opponent true-shooting percentage. |
| `rim_pct` | `number` | Field-goal percentage on rim attempts. |
| `d_rim_pct` | `number` | Opponent field-goal percentage on rim attempts. |
| `mid_pct` | `number` | Field-goal percentage on mid-range attempts. |
| `d_mid_pct` | `number` | Opponent field-goal percentage on mid-range attempts. |
| `tp_rate` | `number` | Three-point attempts as a share of field-goal attempts. |
| `d_tp_rate` | `number` | Opponent three-point attempts as a share of their field-goal attempts. |
| `rim_rate` | `number` | Rim attempts as a share of field-goal attempts. |
| `d_rim_rate` | `number` | Opponent rim attempts as a share of their field-goal attempts. |
| `mid_rate` | `number` | Mid-range attempts as a share of field-goal attempts. |
| `d_mid_rate` | `number` | Opponent mid-range attempts as a share of their field-goal attempts. |
| `ft_rate` | `number` | Ft rate. |
| `d_ft_rate` | `number` | Opponent free-throw attempts relative to their field-goal attempts. |
| `ast_rate` | `number` | Share of the team's made field goals that were assisted. |
| `d_ast_rate` | `number` | Share of opponent made field goals that were assisted. |
| `to_rate` | `number` | To rate. |
| `d_to_rate` | `number` | Opponent turnovers as a share of their possessions (forced-turnover rate). |
| `blk_rate` | `number` | Share of opponent two-point attempts the team blocked. |
| `o_blk_rate` | `number` | Share of the team's own two-point attempts blocked by the opponent. |
| `orb_pct` | `number` | Offensive rebound percentage. |
| `drb_pct` | `number` | Defensive rebound percentage. |
| `time_per_poss` | `number` | Average seconds per offensive possession. |
| `d_time_per_poss` | `number` | Average seconds per defensive possession. |
| `contest_id` | `string` |  |
| `home_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the home team. |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the away team. |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `team_ncaa_team_id` | `string` | stats.ncaa.org team identifier of the team the row belongs to. |
| `team_espn_team_id` | `string` | ESPN team identifier of the team, via the NCAA-to-ESPN crosswalk. |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbRosters`

Release: [ncaa_mbb_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_rosters/ncaa_mbb_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season year. |
| `team` | `string` | Team-side label or team identifier. |
| `player` | `string` | Player name. |
| `games` | `number \| bigint` | Games played. |

## `loadNcaaMbbTeamRosters`

Release: [ncaa_mbb_team_rosters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_rosters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_team_rosters/ncaa_mbb_team_rosters_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbTeamRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_team_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbTeamRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season year. |
| `team_id` | `string` | Unique team identifier. |
| `team` | `string` | Team-side label or team identifier. |
| `player_id` | `string` | Unique player identifier. |
| `player` | `string` | Player name. |
| `clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) player name used to join across the NCAA datasets. |
| `name` | `string` | Display name. |
| `jersey` | `string` | Jersey number worn by the player. |
| `class` | `string` | College class / draft eligibility note. |
| `position` | `string` | Listed roster position (G, F, C, etc.). |
| `height` | `string` | Player height (string e.g. '6-2' or inches). |
| `ht_inches` | `number \| bigint` | Player height converted to total inches from the stats.ncaa.org roster listing. |
| `hometown` | `string` | Player hometown. |
| `high_school` | `string` |  |
| `gp` | `string` | Games played. |
| `gs` | `string` | Games started. |

## `loadNcaaMbbTeamIds`

Release: [ncaa_mbb_team_ids](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_team_ids) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_team_ids/ncaa_mbb_team_ids_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbTeamIds({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_team_ids(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbTeamIdsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team` | `string` | Team-side label or team identifier. |
| `conference` | `string` | Conference name. |
| `id` | `string` | Id. |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbPossessions`

Release: [ncaa_mbb_possessions](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_possessions) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_possessions/ncaa_mbb_possessions_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbPossessions({ seasons: 2024, columns: ['game_date', 'home', 'away', 'poss_num', 'poss_team'] });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_possessions(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbPossessionsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `poss_num` | `number \| bigint` | Sequential possession number within the game. |
| `poss_team` | `string` | Name of the team in possession. |
| `home_1` | `string` | Name of the home team's on-floor player in lineup slot 1 for the possession, from the substitution walk-forward. |
| `home_2` | `string` | Name of the home team's on-floor player in lineup slot 2 for the possession, from the substitution walk-forward. |
| `home_3` | `string` | Name of the home team's on-floor player in lineup slot 3 for the possession, from the substitution walk-forward. |
| `home_4` | `string` | Name of the home team's on-floor player in lineup slot 4 for the possession, from the substitution walk-forward. |
| `home_5` | `string` | Name of the home team's on-floor player in lineup slot 5 for the possession, from the substitution walk-forward. |
| `away_1` | `string` | Name of the away team's on-floor player in lineup slot 1 for the possession, from the substitution walk-forward. |
| `away_2` | `string` | Name of the away team's on-floor player in lineup slot 2 for the possession, from the substitution walk-forward. |
| `away_3` | `string` | Name of the away team's on-floor player in lineup slot 3 for the possession, from the substitution walk-forward. |
| `away_4` | `string` | Name of the away team's on-floor player in lineup slot 4 for the possession, from the substitution walk-forward. |
| `away_5` | `string` | Name of the away team's on-floor player in lineup slot 5 for the possession, from the substitution walk-forward. |
| `home_score` | `number \| bigint` | Home team score at the time of the play. |
| `away_score` | `number \| bigint` | Away team score at the time of the play. |
| `pts` | `number \| bigint` | Points scored. |
| `is_assisted` | `number \| bigint` | 1 when the possession's made field goal was assisted, else 0. |
| `is_transition` | `number \| bigint` | 1 for transition possessions, else 0. |
| `is_garbage_time` | `number \| bigint` | 1 for possessions in garbage time under the score-margin and clock rule, else 0. |
| `start_event_type` | `string` | Event type that opened the possession (e.g., a defensive rebound or a made-basket inbound). |
| `first_shot_time` | `number \| bigint` | Clock time in seconds at the possession's first shot attempt, from the possession segmentation engine. |
| `first_shot_type` | `string` | Shot class of the possession's first attempt (rim, mid-range, or three). |
| `last_event_time` | `number \| bigint` | Clock time in seconds at the possession's final event. |
| `last_event_type` | `string` | Event type that ended the possession (e.g., a made shot, turnover, or defensive rebound). |
| `contest_id` | `string` |  |
| `home_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the home team. |
| `home_espn_team_id` | `string` | ESPN home team id (NA for bart-only rows). |
| `away_ncaa_team_id` | `string` | stats.ncaa.org team identifier for the away team. |
| `away_espn_team_id` | `string` | ESPN away team id (NA for bart-only rows). |
| `poss_team_ncaa_team_id` | `string` | stats.ncaa.org team identifier of the team in possession. |
| `poss_team_espn_team_id` | `string` | ESPN team identifier of the team in possession, via the NCAA-to-ESPN crosswalk. |
| `home_1_player_id` | `string` | stats.ncaa.org player identifier for the home slot-1 on-floor player. |
| `home_1_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-1 on-floor player. |
| `home_2_player_id` | `string` | stats.ncaa.org player identifier for the home slot-2 on-floor player. |
| `home_2_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-2 on-floor player. |
| `home_3_player_id` | `string` | stats.ncaa.org player identifier for the home slot-3 on-floor player. |
| `home_3_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-3 on-floor player. |
| `home_4_player_id` | `string` | stats.ncaa.org player identifier for the home slot-4 on-floor player. |
| `home_4_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-4 on-floor player. |
| `home_5_player_id` | `string` | stats.ncaa.org player identifier for the home slot-5 on-floor player. |
| `home_5_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the home slot-5 on-floor player. |
| `away_1_player_id` | `string` | stats.ncaa.org player identifier for the away slot-1 on-floor player. |
| `away_1_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-1 on-floor player. |
| `away_2_player_id` | `string` | stats.ncaa.org player identifier for the away slot-2 on-floor player. |
| `away_2_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-2 on-floor player. |
| `away_3_player_id` | `string` | stats.ncaa.org player identifier for the away slot-3 on-floor player. |
| `away_3_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-3 on-floor player. |
| `away_4_player_id` | `string` | stats.ncaa.org player identifier for the away slot-4 on-floor player. |
| `away_4_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-4 on-floor player. |
| `away_5_player_id` | `string` | stats.ncaa.org player identifier for the away slot-5 on-floor player. |
| `away_5_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the away slot-5 on-floor player. |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbLineups`

Release: [ncaa_mbb_lineups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_lineups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_lineups/ncaa_mbb_lineups_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbLineups({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_lineups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbLineupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `lineup_key` | `string` | Sorted player-code key identifying the five-player unit on the floor (hoop-explorer convention). |
| `date` | `string` | Date in YYYY-MM-DD format. |
| `location_type` | `string` | Whether the lineup's team was the Home or Away side in the game. |
| `team` | `string` | Team-side label or team identifier. |
| `team_year` | `number \| bigint` | Season year of the team-season the lineup row belongs to. |
| `opponent` | `string` | Opponent. |
| `lineup_id` | `string` | Sorted-name identifier of the five-player lineup, joined from the on-floor player names. |
| `start_min` | `number` | Game minute at which the stint began. |
| `end_min` | `number` | Game minute at which the stint ended. |
| `duration_mins` | `number` | Length of the stint in minutes. |
| `player_1` | `string` | Name of the first player (in sorted order) of the five-player lineup. |
| `player_2` | `string` | Name of the second player (in sorted order) of the five-player lineup. |
| `player_3` | `string` | Name of the third player (in sorted order) of the five-player lineup. |
| `player_4` | `string` | Name of the fourth player (in sorted order) of the five-player lineup. |
| `player_5` | `string` | Name of the fifth player (in sorted order) of the five-player lineup. |
| `players_in` | `string` | Delimited names of the players substituted in at the start of the stint. |
| `players_out` | `string` | Delimited names of the players substituted out at the end of the stint. |
| `start_scored` | `number \| bigint` | Team points scored at the moment the stint began. |
| `start_allowed` | `number \| bigint` | Points allowed at the moment the stint began. |
| `end_scored` | `number \| bigint` | Team points scored at the moment the stint ended. |
| `end_allowed` | `number \| bigint` | Points allowed at the moment the stint ended. |
| `start_diff` | `number \| bigint` | Score margin (scored minus allowed) when the stint began. |
| `end_diff` | `number \| bigint` | Score margin (scored minus allowed) when the stint ended. |
| `player_count_error` | `unknown` | Flag marking stints where the reconciled on-floor count was not exactly five players (all-null when clean). |
| `poss` | `number \| bigint` | Poss. |
| `pts` | `number \| bigint` | Points scored. |
| `plus_minus` | `number \| bigint` | Plus/minus point differential while on court. |
| `fga` | `number \| bigint` | Field goal attempts. |
| `fgm` | `number \| bigint` | Field goals made. |
| `rima` | `number \| bigint` | Rim shots (dunks, layups, hooks, tip-ins) attempted by the lineup during the stint. |
| `rimm` | `number \| bigint` | Rim shots made by the lineup during the stint. |
| `rim_ast` | `number \| bigint` | Assisted rim makes by the lineup during the stint. |
| `mida` | `number \| bigint` | Mid-range shots attempted by the lineup during the stint. |
| `midm` | `number \| bigint` | Mid-range shots made by the lineup during the stint. |
| `mid_ast` | `number \| bigint` | Assisted mid-range makes by the lineup during the stint. |
| `fg2a` | `number \| bigint` | Two-point field goals attempted by the lineup during the stint. |
| `fg2m` | `number \| bigint` | Two-point field goals made by the lineup during the stint. |
| `tpa` | `number \| bigint` | Three-pointers attempted by the lineup during the stint. |
| `tpm` | `number \| bigint` | Three-pointers made by the lineup during the stint. |
| `tp_ast` | `number \| bigint` | Assisted three-point makes by the lineup during the stint. |
| `fta` | `number \| bigint` | Free throw attempts. |
| `ftm` | `number \| bigint` | Free throws made. |
| `orb` | `number \| bigint` | Offensive rebounds by the lineup during the stint. |
| `drb` | `number \| bigint` | Defensive rebounds by the lineup during the stint. |
| `to` | `number \| bigint` | To. |
| `stl` | `number \| bigint` | Steals. |
| `blk` | `number \| bigint` | Blocks. |
| `ast` | `number \| bigint` | Assists. |
| `foul` | `number \| bigint` | Fouls committed by the lineup during the stint. |
| `opp_poss` | `number \| bigint` | Opponent possessions while the lineup was on the floor during the stint. |
| `opp_pts` | `number \| bigint` | Opponent points. |
| `opp_plus_minus` | `number \| bigint` | Opponent scoring margin while the lineup was on the floor during the stint. |
| `opp_fga` | `number \| bigint` | Opponent field-goal attempts while the lineup was on the floor during the stint. |
| `opp_fgm` | `number \| bigint` | Opponent field goals made while the lineup was on the floor during the stint. |
| `opp_rima` | `number \| bigint` | Opponent rim shots attempted while the lineup was on the floor during the stint. |
| `opp_rimm` | `number \| bigint` | Opponent rim shots made while the lineup was on the floor during the stint. |
| `opp_rim_ast` | `number \| bigint` | Opponent assisted rim makes while the lineup was on the floor during the stint. |
| `opp_mida` | `number \| bigint` | Opponent mid-range shots attempted while the lineup was on the floor during the stint. |
| `opp_midm` | `number \| bigint` | Opponent mid-range shots made while the lineup was on the floor during the stint. |
| `opp_mid_ast` | `number \| bigint` | Opponent assisted mid-range makes while the lineup was on the floor during the stint. |
| `opp_fg2a` | `number \| bigint` | Opponent two-point attempts while the lineup was on the floor during the stint. |
| `opp_fg2m` | `number \| bigint` | Opponent two-point makes while the lineup was on the floor during the stint. |
| `opp_tpa` | `number \| bigint` | Opponent three-point attempts while the lineup was on the floor during the stint. |
| `opp_tpm` | `number \| bigint` | Opponent three-point makes while the lineup was on the floor during the stint. |
| `opp_tp_ast` | `number \| bigint` | Opponent assisted three-point makes while the lineup was on the floor during the stint. |
| `opp_fta` | `number \| bigint` | Opponent free-throw attempts while the lineup was on the floor during the stint. |
| `opp_ftm` | `number \| bigint` | Opponent free throws made while the lineup was on the floor during the stint. |
| `opp_orb` | `number \| bigint` | Opponent offensive rebounds while the lineup was on the floor during the stint. |
| `opp_drb` | `number \| bigint` | Opponent defensive rebounds while the lineup was on the floor during the stint. |
| `opp_to` | `number \| bigint` | Opponent turnovers while the lineup was on the floor during the stint. |
| `opp_stl` | `number \| bigint` | Opponent steals while the lineup was on the floor during the stint. |
| `opp_blk` | `number \| bigint` | Opponent blocks while the lineup was on the floor during the stint. |
| `opp_ast` | `number \| bigint` | Opponent assists while the lineup was on the floor during the stint. |
| `opp_foul` | `number \| bigint` | Opponent fouls committed while the lineup was on the floor during the stint. |
| `stint_num` | `number \| bigint` | Sequential on-floor stint number for the lineup within the game. |
| `contest_id` | `string` |  |
| `season` | `number \| bigint` | Season year. |

## `loadNcaaMbbMatchupStints`

Release: [ncaa_mbb_matchup_stints](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_matchup_stints) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_matchup_stints/ncaa_mbb_matchup_stints_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbMatchupStints({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_matchup_stints(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbMatchupStintsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `contest_id` | `string` |  |
| `season` | `number \| bigint` | Season year. |
| `game_date` | `string` | Game date (YYYY-MM-DD). |
| `home` | `string` | Home. |
| `away` | `string` | Away record. |
| `game_stint_num` | `number \| bigint` | Sequential stint number within the game, incremented at every substitution by either team. |
| `period` | `number \| bigint` | Period of the game (1-4 quarters; 5+ for OT). |
| `start_seconds` | `number \| bigint` | Elapsed game seconds at which the stint began. |
| `end_seconds` | `number \| bigint` | Elapsed game seconds at which the stint ended. |
| `duration_seconds` | `number \| bigint` | Duration of the lineup stint in seconds. |
| `matchup_key` | `string` | Combined home-plus-away lineup key identifying the ten-player matchup on the floor. |
| `home_lineup_key` | `string` | Sorted player-code key for the home five on the floor. |
| `away_lineup_key` | `string` | Sorted player-code key for the away five on the floor. |
| `home_lineup` | `string` | Delimited names of the home five on the floor during the stint. |
| `away_lineup` | `string` | Delimited names of the away five on the floor during the stint. |
| `end_home_score` | `number \| bigint` | Home team score when the stint ended. |
| `end_away_score` | `number \| bigint` | Away team score when the stint ended. |
| `n_events` | `number \| bigint` | Number of play-by-play events falling within the stint. |
| `n_possessions` | `number \| bigint` | Number of possessions falling within the stint. |
| `start_home_score` | `number \| bigint` | Home team score when the stint began. |
| `start_away_score` | `number \| bigint` | Away team score when the stint began. |
| `home_pts` | `number \| bigint` | Points scored by the home team during the stint. |
| `away_pts` | `number \| bigint` | Points scored by the away team during the stint. |
| `home_1` | `string` | Name of the home team's on-floor player in lineup slot 1 for the stint. |
| `home_2` | `string` | Name of the home team's on-floor player in lineup slot 2 for the stint. |
| `home_3` | `string` | Name of the home team's on-floor player in lineup slot 3 for the stint. |
| `home_4` | `string` | Name of the home team's on-floor player in lineup slot 4 for the stint. |
| `home_5` | `string` | Name of the home team's on-floor player in lineup slot 5 for the stint. |
| `away_1` | `string` | Name of the away team's on-floor player in lineup slot 1 for the stint. |
| `away_2` | `string` | Name of the away team's on-floor player in lineup slot 2 for the stint. |
| `away_3` | `string` | Name of the away team's on-floor player in lineup slot 3 for the stint. |
| `away_4` | `string` | Name of the away team's on-floor player in lineup slot 4 for the stint. |
| `away_5` | `string` | Name of the away team's on-floor player in lineup slot 5 for the stint. |

## `loadNcaaMbbShots`

Release: [ncaa_mbb_shots](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_shots) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_shots/ncaa_mbb_shots_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2019) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbShots({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_shots(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbShotsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season year. |
| `team_id` | `string` | Unique team identifier. |
| `shooter_id` | `string` | Unique identifier for shooter. |
| `shot_x` | `number` | Court x-coordinate of the attempt in feet, decoded from the stats.ncaa.org shot-chart map. |
| `shot_y` | `number` | Court y-coordinate of the attempt in feet, decoded from the stats.ncaa.org shot-chart map. |
| `dist_ft` | `number` | Shot distance from the basket in feet. |
| `shot_zone` | `string` | Labeled zone of the attempt (rim, mid-range, or three-point). |
| `shot_type` | `string` | Shot type label (e.g. 'Jump Shot', 'Layup'). |
| `made` | `boolean` | Whether the shot was made. |
| `point_value` | `number \| bigint` | Point value of the attempt (2 or 3). |
| `period` | `unknown` | Period of the game (1-4 quarters; 5+ for OT). |
| `sec_left` | `unknown` | Seconds remaining in the period when the shot was taken (all-null in current captures). |
| `source` | `string` |  |
| `contest_id` | `string` |  |
| `ncaa_team_id` | `string` | stats.ncaa.org team identifier of the shooting team. |
| `espn_team_id` | `string` | ESPN team id (canonical key). |
| `shooter_player_id` | `string` | stats.ncaa.org player identifier of the shooter. |
| `shooter_clean_name` | `string` | Normalized (diacritics- and punctuation-cleaned) name of the shooter. |
| `espn_game_id` | `string` | ESPN game id (NA for bart-only rows). |

## `loadNcaaMbbRapmWithinTeam`

Release: [ncaa_mbb_rapm_within_team](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rapm_within_team) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_rapm_within_team/ncaa_mbb_rapm_within_team_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2010) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbRapmWithinTeam({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_rapm_within_team(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbRapmWithinTeamRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `team` | `string` | Team-side label or team identifier. |
| `player_code` | `string` | Short unique-within-team player code generated from the player's name (hoop-explorer convention). |
| `rapm_off` | `number` | Ridge-regressed offensive RAPM per 100 possessions, estimated relative to the player's own teammates. |
| `rapm_def` | `number` | Ridge-regressed defensive RAPM per 100 possessions relative to teammates; positive means good defense. |
| `team_off_poss` | `number` | Team offensive possessions underlying the within-team fit. |
| `num_players` | `number \| bigint` | Number of players in the team's RAPM design matrix. |
| `rapm_net` | `number` | Net RAPM — the sum of the offensive and defensive components, per 100 possessions. |
| `season` | `number` | Season year. |
| `player_id` | `string` | Unique player identifier. |
| `team_id` | `string` | Unique team identifier. |
| `person_id` | `string` | Unique player identifier (V3 endpoints). |

## `loadNcaaMbbRapm`

Release: [ncaa_mbb_rapm](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/ncaa_mbb_rapm) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/ncaa_mbb_rapm/ncaa_mbb_rapm_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2011) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadNcaaMbbRapm({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_ncaa_mbb_rapm(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNcaaMbbRapmRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | Season as a 4-digit starting year (integer). A 'YYYY-YY' string is not accepted. |
| `player_id` | `string` | Unique player identifier. |
| `person_id` | `string` | Unique player identifier (V3 endpoints). |
| `player` | `string` | Player name. |
| `team` | `string` | Team-side label or team identifier. |
| `orapm` | `number` | Offensive regularized adjusted plus-minus: points contributed per 100 possessions on offense, adjusted for the other 9 players on the floor. |
| `drapm` | `number` | Defensive regularized adjusted plus-minus: points prevented per 100 possessions on defense (higher is better defense), adjusted for the other 9 players on the floor. |
| `rapm_net` | `number` | Net RAPM (orapm plus drapm): overall point contribution per 100 possessions. Verified against live data: rapm_net == orapm + drapm exactly. |
| `off_poss` | `number \| bigint` | Offensive possessions the player was on court for; the regression weight behind orapm. |
| `def_poss` | `number \| bigint` | Defensive possessions the player was on court for; the regression weight behind drapm. |
| `estimand` | `string` | Fit-scope tag for the RAPM model that produced this row (observed value: 'league', a Division I-wide fit) -- one row per player-season, not per estimand. |

## `loadMbbGroups`

Release: [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_groups/mbb_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. mbb:big-east) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the ENDING year (2025 = the 2024-25 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbGroups();
// snake_case alias (py/R parity): sdv.mbb.load_mbb_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mbb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `last_season` | `number` | Last season in which the group had at least one member (ENDING year: 2025 = the 2024-25 season). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadMbbGroupSeasons`

Release: [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_groups/mbb_group_seasons.parquet`

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
const rows = await sdv.mbb.loadMbbGroupSeasons();
// snake_case alias (py/R parity): sdv.mbb.load_mbb_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mbb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (ENDING year: 2025 = the 2024-25 season). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadMbbGroupAliases`

Release: [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_groups/mbb_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, kenpom, ncaa, sdv) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbGroupAliases();
// snake_case alias (py/R parity): sdv.mbb.load_mbb_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mbb"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, kenpom, ncaa, sdv); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (ENDING year: 2025 = the 2024-25 season); null = unbounded (still in use). |

## `loadMbbTeamGroupSeasons`

Release: [mbb_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/mbb_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/mbb_groups/mbb_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id; team_id_source names the id space. season is the ENDING year (2025 = the 2024-25 season); seasons 2002-2027.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002) |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.mbb.loadMbbTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.mbb.load_mbb_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadMbbTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("mbb"); the prefix of every group_id in it. |
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
