---
title: Dataset loaders
sidebar_label: Dataset loaders
sidebar_position: 50
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))

:::


# `sdv.nfl` — dataset loaders

29 loaders reading the published nflverse data releases / sportsdataverse-data releases (parquet) — the JS mirror of sportsdataverse-py's `load_*` functions. Each is a camelCase export plus its snake_case alias and resolves to an array of plain row objects (or `{ [column]: values[] }` with `format: "columns"`).

- **Size:** row objects cost ~60-100 bytes per cell on the heap, so before decoding each season a loader adds its rows × columns (from the parquet footer) to a running total and checks it against `maxCells` — by default heap limit / 100 for rows (≈45M cells on Node's default 4 GB heap) and heap limit / 30 for `format: "columns"` — and throws a catchable `SdvError` instead of running out of memory. Play-by-play is the usual case: pass `columns`, use `format: "columns"`, or raise the heap (`node --max-old-space-size=8192`).
- **Seasons:** `seasons` takes one season or a list. A season with no published asset (HTTP 404) is skipped with a warning (loaders marked so in their `seasons` row — sdv-py's hand-written ones — throw `NoDataError` instead); any other failure raises `AssetFetchError` (a failed download is never an empty season); a season below the loader's floor raises `SeasonNotFoundError` before anything is fetched. Multi-season results union the columns, null-filling gaps, and cast a column whose type changed between seasons to the common type (an integer id that became a string → strings, "123" not "123.0"), as sdv-py's `diagonal_relaxed` concat does.
- **Integers:** an id column (`id`, `*_id`, `*_ids`, `game_pk`, `athlete_id_1`, `id_play`, `playerId`, `homeTeamId`, `start.team.id`, …) of integers comes back as exact decimal strings in every row and every season, whatever width the release stores it with (INT32, INT64, or a DOUBLE holding integers: `"401628579101849903"`, `"39"`, never `"39.0"`), so ids join across seasons and across releases. Code-like id columns (`type_id`, `status_id`, …) are strings too. An id column that is not exact integers (a fraction, a DOUBLE past 2^53) is left as read with one warning. Any other INT64 column comes back as `number` when every value is a safe integer, otherwise as `BigInt` with one warning (code `SDV_INT64`) per column per process.
- **Runtime:** Node only. Downloads go through the `releases` transport family (see [Transport, auth & errors](../../guides/transport-and-auth.md)); each asset is downloaded whole, then decoded.

| Loader | Release | Seasons |
|---|---|---|
| [`loadNflPbp`](#loadnflpbp) | [pbp](https://github.com/nflverse/nflverse-data/releases/tag/pbp) | 1999+ |
| [`loadNflModelPbp`](#loadnflmodelpbp) | [nfl_model_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_model_pbp) | 1999+ |
| [`loadNflRatingsWeekly`](#loadnflratingsweekly) | [nfl_ratings_weekly](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_ratings_weekly) | 1999+ |
| [`loadNflNgs`](#loadnflngs) | [nfl_ngs_passing](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_ngs_passing) | 2009+ |
| [`loadNflRosters`](#loadnflrosters) | [rosters](https://github.com/nflverse/nflverse-data/releases/tag/rosters) | 1920+ |
| [`loadNflWeeklyRosters`](#loadnflweeklyrosters) | [weekly_rosters](https://github.com/nflverse/nflverse-data/releases/tag/weekly_rosters) | 2002+ |
| [`loadNflDepthCharts`](#loadnfldepthcharts) | [depth_charts](https://github.com/nflverse/nflverse-data/releases/tag/depth_charts) | 2001+ |
| [`loadNflInjuries`](#loadnflinjuries) | [injuries](https://github.com/nflverse/nflverse-data/releases/tag/injuries) | 2009+ |
| [`loadNflSnapCounts`](#loadnflsnapcounts) | [snap_counts](https://github.com/nflverse/nflverse-data/releases/tag/snap_counts) | 2012+ |
| [`loadNflPbpParticipation`](#loadnflpbpparticipation) | [pbp_participation](https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation) | 2016+ |
| [`loadNflFtnCharting`](#loadnflftncharting) | [ftn_charting](https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting) | 2022+ |
| [`loadNflUsagePlayers`](#loadnflusageplayers) | [espn_nfl_usage_players](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_players) | 2002+ |
| [`loadNflUsagePositionGroups`](#loadnflusagepositiongroups) | [espn_nfl_usage_position_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_position_groups) | 2002+ |
| [`loadNflUsageTackles`](#loadnflusagetackles) | [espn_nfl_usage_tackles](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_tackles) | 2002+ |
| [`loadNflUsagePositionGroupTackles`](#loadnflusagepositiongrouptackles) | [espn_nfl_usage_position_group_tackles](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_position_group_tackles) | 2002+ |
| [`loadNflUsageTeams`](#loadnflusageteams) | [espn_nfl_usage_teams](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_teams) | 2002+ |
| [`loadNflUsageDriveScripting`](#loadnflusagedrivescripting) | [espn_nfl_usage_drive_scripting](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_drive_scripting) | 2002+ |
| [`loadNflUsageStKickers`](#loadnflusagestkickers) | [espn_nfl_usage_st_kickers](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_kickers) | 2002+ |
| [`loadNflUsageStPunters`](#loadnflusagestpunters) | [espn_nfl_usage_st_punters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_punters) | 2002+ |
| [`loadNflUsageStReturners`](#loadnflusagestreturners) | [espn_nfl_usage_st_returners](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_returners) | 2002+ |
| [`loadNflUsageStBlocks`](#loadnflusagestblocks) | [espn_nfl_usage_st_blocks](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_blocks) | 2002+ |
| [`loadNflUsageStTeam`](#loadnflusagestteam) | [espn_nfl_usage_st_team](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_team) | 2002+ |
| [`loadNflTeamTendencies`](#loadnflteamtendencies) | [espn_nfl_team_tendencies](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_team_tendencies) | 2002+ |
| [`loadNflCoachTendencies`](#loadnflcoachtendencies) | [espn_nfl_coach_tendencies](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_coach_tendencies) | 2002+ |
| [`loadNflCoachCareers`](#loadnflcoachcareers) | [espn_nfl_coach_careers](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_coach_careers) | one asset |
| [`loadNflGroups`](#loadnflgroups) | [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) | one asset |
| [`loadNflGroupSeasons`](#loadnflgroupseasons) | [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) | one asset |
| [`loadNflGroupAliases`](#loadnflgroupaliases) | [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) | one asset |
| [`loadNflTeamGroupSeasons`](#loadnflteamgroupseasons) | [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) | 1970+ |

## `loadNflPbp`

Release: [pbp](https://github.com/nflverse/nflverse-data/releases/tag/pbp) · asset `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1999); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflPbp({ seasons: 2024, columns: ['game_id', 'play_id', 'desc', 'epa', 'wp'] });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `play_id` | `string \| number` | Numeric play id that when used with game_id and drive provides the unique identifier for a single play. |
| `game_id` | `string` | Ten digit identifier for NFL game. |
| `old_game_id` | `string` | Legacy NFL game ID. |
| `home_team` | `string` | The home team. Note that this contains the designated home team for games which no team is playing at home such as Super Bowls or NFL International games. |
| `away_team` | `string` | String abbreviation for the away team. |
| `season_type` | `string` | REG or POST indicating if the timeframe belongs to regular or post season. |
| `week` | `number` | Season week. |
| `posteam` | `string` | String abbreviation for the team with possession. |
| `posteam_type` | `string` | String indicating whether the posteam team is home or away. |
| `defteam` | `string` | String abbreviation for the team on defense. |
| `side_of_field` | `string` | String abbreviation for which team's side of the field the team with possession is currently on. |
| `yardline_100` | `number` | Numeric distance in the number of yards from the opponent's endzone for the posteam. |
| `game_date` | `string` | Date of the game. |
| `quarter_seconds_remaining` | `number` | Numeric seconds remaining in the quarter. |
| `half_seconds_remaining` | `number` | Numeric seconds remaining in the half. |
| `game_seconds_remaining` | `number` | Numeric seconds remaining in the game. |
| `game_half` | `string` | String indicating which half the play is in, either Half1, Half2, or Overtime. |
| `quarter_end` | `number` | Binary indicator for whether or not the row of the data is marking the end of a quarter. |
| `drive` | `number` | Numeric drive number in the game. |
| `sp` | `number` | Binary indicator for whether or not a score occurred on the play. |
| `qtr` | `number` | Quarter of the game (5 is overtime). |
| `down` | `number` | The down for the given play. |
| `goal_to_go` | `number` | Binary indicator for whether or not the posteam is in a goal down situation. |
| `time` | `string` | Time at start of play provided in string format as minutes:seconds remaining in the quarter. |
| `yrdln` | `string` | String indicating the current field position for a given play. |
| `ydstogo` | `number` | Numeric yards in distance from either the first down marker or the endzone in goal down situations. |
| `ydsnet` | `number` | Numeric value for total yards gained on the given drive. |
| `desc` | `string` | Detailed string description for the given play. |
| `play_type` | `string` | String indicating the type of play: pass (includes sacks), run (includes scrambles), punt, field_goal, kickoff, extra_point, qb_kneel, qb_spike, no_play (timeouts and penalties), and missing for rows indicating end of play. |
| `yards_gained` | `number` | Numeric yards gained (or lost) by the possessing team, excluding yards gained via fumble recoveries and laterals. |
| `shotgun` | `number` | Binary indicator for whether or not the play was in shotgun formation. |
| `no_huddle` | `number` | Binary indicator for whether or not the play was in no_huddle formation. |
| `qb_dropback` | `number` | Binary indicator for whether or not the QB dropped back on the play (pass attempt, sack, or scrambled). |
| `qb_kneel` | `number` | Binary indicator for whether or not the QB took a knee. |
| `qb_spike` | `number` | Binary indicator for whether or not the QB spiked the ball. |
| `qb_scramble` | `number` | Binary indicator for whether or not the QB scrambled. |
| `pass_length` | `string` | String indicator for pass length: short or deep. |
| `pass_location` | `string` | String indicator for pass location: left, middle, or right. |
| `air_yards` | `number` | Numeric value for distance in yards perpendicular to the line of scrimmage at where the targeted receiver either caught or didn't catch the ball. |
| `yards_after_catch` | `number` | Numeric value for distance in yards perpendicular to the yard line where the receiver made the reception to where the play ended. |
| `run_location` | `string` | String indicator for location of run: left, middle, or right. |
| `run_gap` | `string` | String indicator for line gap of run: end, guard, or tackle |
| `field_goal_result` | `string` | String indicator for result of field goal attempt: made, missed, or blocked. |
| `kick_distance` | `number` | Numeric distance in yards for kickoffs, field goals, and punts. |
| `extra_point_result` | `string` | String indicator for the result of the extra point attempt: good, failed, blocked, safety (touchback in defensive endzone is 1 point apparently), or aborted. |
| `two_point_conv_result` | `string` | String indicator for result of two point conversion attempt: success, failure, safety (touchback in defensive endzone is 1 point apparently), or return. |
| `home_timeouts_remaining` | `number` | Numeric timeouts remaining in the half for the home team. |
| `away_timeouts_remaining` | `number` | Numeric timeouts remaining in the half for the away team. |
| `timeout` | `number` | Binary indicator for whether or not a timeout was called by either team. |
| `timeout_team` | `string` | String abbreviation for which team called the timeout. |
| `td_team` | `string` | String abbreviation for which team scored the touchdown. |
| `td_player_name` | `string` | String name of the player who scored a touchdown. |
| `td_player_id` | `string` | Unique identifier of the player who scored a touchdown. |
| `posteam_timeouts_remaining` | `number` | Number of timeouts remaining for the possession team. |
| `defteam_timeouts_remaining` | `number` | Number of timeouts remaining for the team on defense. |
| `total_home_score` | `number` | Score for the home team at the start of the play. |
| `total_away_score` | `number` | Score for the away team at the start of the play. |
| `posteam_score` | `number` | Score the posteam at the start of the play. |
| `defteam_score` | `number` | Score the defteam at the start of the play. |
| `score_differential` | `number` | Score differential between the posteam and defteam at the start of the play. |
| `posteam_score_post` | `number` | Score for the posteam at the end of the play. |
| `defteam_score_post` | `number` | Score for the defteam at the end of the play. |
| `score_differential_post` | `number` | Score differential between the posteam and defteam at the end of the play. |
| `no_score_prob` | `number` | Predicted probability of no score occurring for the rest of the half based on the expected points model. |
| `opp_fg_prob` | `number` | Predicted probability of the defteam scoring a FG next. 'Next' in this context means the next score in the same game half. |
| `opp_safety_prob` | `number` | Predicted probability of the defteam scoring a safety next. 'Next' in this context means the next score in the same game half. |
| `opp_td_prob` | `number` | Predicted probability of the defteam scoring a TD next. 'Next' in this context means the next score in the same game half. |
| `fg_prob` | `number` | Predicted probability of the posteam scoring a FG next. 'Next' in this context means the next score in the same game half. |
| `safety_prob` | `number` | Predicted probability of the posteam scoring a safety next. 'Next' in this context means the next score in the same game half. |
| `td_prob` | `number` | Predicted probability of the posteam scoring a TD next. 'Next' in this context means the next score in the same game half. |
| `extra_point_prob` | `number` | Predicted probability of the posteam scoring an extra point. |
| `two_point_conversion_prob` | `number` | Predicted probability of the posteam scoring the two point conversion. |
| `ep` | `number` | Using the scoring event probabilities, the estimated expected points with respect to the possession team for the given play. |
| `epa` | `number` | Expected points added (EPA) by the posteam for the given play. |
| `total_home_epa` | `number` | Cumulative total EPA for the home team in the game so far. |
| `total_away_epa` | `number` | Cumulative total EPA for the away team in the game so far. |
| `total_home_rush_epa` | `number` | Cumulative total rushing EPA for the home team in the game so far. |
| `total_away_rush_epa` | `number` | Cumulative total rushing EPA for the away team in the game so far. |
| `total_home_pass_epa` | `number` | Cumulative total passing EPA for the home team in the game so far. |
| `total_away_pass_epa` | `number` | Cumulative total passing EPA for the away team in the game so far. |
| `air_epa` | `number` | EPA from the air yards alone. For completions this represents the actual value provided through the air. For incompletions this represents the hypothetical value that could've been added through the air if the pass was completed. |
| `yac_epa` | `number` | EPA from the yards after catch alone. For completions this represents the actual value provided after the catch. For incompletions this represents the difference between the hypothetical air_epa and the play's raw observed EPA (how much the incomplete pass cost the posteam). |
| `comp_air_epa` | `number` | EPA from the air yards alone only for completions. |
| `comp_yac_epa` | `number` | EPA from the yards after catch alone only for completions. |
| `total_home_comp_air_epa` | `number` | Cumulative total completions air EPA for the home team in the game so far. |
| `total_away_comp_air_epa` | `number` | Cumulative total completions air EPA for the away team in the game so far. |
| `total_home_comp_yac_epa` | `number` | Cumulative total completions yac EPA for the home team in the game so far. |
| `total_away_comp_yac_epa` | `number` | Cumulative total completions yac EPA for the away team in the game so far. |
| `total_home_raw_air_epa` | `number` | Cumulative total raw air EPA for the home team in the game so far. |
| `total_away_raw_air_epa` | `number` | Cumulative total raw air EPA for the away team in the game so far. |
| `total_home_raw_yac_epa` | `number` | Cumulative total raw yac EPA for the home team in the game so far. |
| `total_away_raw_yac_epa` | `number` | Cumulative total raw yac EPA for the away team in the game so far. |
| `wp` | `number` | Estimated win probability for the posteam given the current situation at the start of the given play. |
| `def_wp` | `number` | Estimated win probability for the defteam. |
| `home_wp` | `number` | Estimated win probability for the home team. |
| `away_wp` | `number` | Estimated win probability for the away team. |
| `wpa` | `number` | Win probability added (WPA) for the posteam. |
| `vegas_wpa` | `number` | Win probability added (WPA) for the posteam: spread_adjusted model. |
| `vegas_home_wpa` | `number` | Win probability added (WPA) for the home team: spread_adjusted model. |
| `home_wp_post` | `number` | Estimated win probability for the home team at the end of the play. |
| `away_wp_post` | `number` | Estimated win probability for the away team at the end of the play. |
| `vegas_wp` | `number` | Estimated win probability for the posteam given the current situation at the start of the given play, incorporating pre-game Vegas line. |
| `vegas_home_wp` | `number` | Estimated win probability for the home team incorporating pre-game Vegas line. |
| `total_home_rush_wpa` | `number` | Cumulative total rushing WPA for the home team in the game so far. |
| `total_away_rush_wpa` | `number` | Cumulative total rushing WPA for the away team in the game so far. |
| `total_home_pass_wpa` | `number` | Cumulative total passing WPA for the home team in the game so far. |
| `total_away_pass_wpa` | `number` | Cumulative total passing WPA for the away team in the game so far. |
| `air_wpa` | `number` | WPA through the air (same logic as air_epa). |
| `yac_wpa` | `number` | WPA from yards after the catch (same logic as yac_epa). |
| `comp_air_wpa` | `number` | The air_wpa for completions only. |
| `comp_yac_wpa` | `number` | The yac_wpa for completions only. |
| `total_home_comp_air_wpa` | `number` | Cumulative total completions air WPA for the home team in the game so far. |
| `total_away_comp_air_wpa` | `number` | Cumulative total completions air WPA for the away team in the game so far. |
| `total_home_comp_yac_wpa` | `number` | Cumulative total completions yac WPA for the home team in the game so far. |
| `total_away_comp_yac_wpa` | `number` | Cumulative total completions yac WPA for the away team in the game so far. |
| `total_home_raw_air_wpa` | `number` | Cumulative total raw air WPA for the home team in the game so far. |
| `total_away_raw_air_wpa` | `number` | Cumulative total raw air WPA for the away team in the game so far. |
| `total_home_raw_yac_wpa` | `number` | Cumulative total raw yac WPA for the home team in the game so far. |
| `total_away_raw_yac_wpa` | `number` | Cumulative total raw yac WPA for the away team in the game so far. |
| `punt_blocked` | `number` | Binary indicator for if the punt was blocked. |
| `first_down_rush` | `number` | Binary indicator for if a running play converted the first down. |
| `first_down_pass` | `number` | Binary indicator for if a passing play converted the first down. |
| `first_down_penalty` | `number` | Binary indicator for if a penalty converted the first down. |
| `third_down_converted` | `number` | Binary indicator for if the first down was converted on third down. |
| `third_down_failed` | `number` | Binary indicator for if the posteam failed to convert first down on third down. |
| `fourth_down_converted` | `number` | Binary indicator for if the first down was converted on fourth down. |
| `fourth_down_failed` | `number` | Binary indicator for if the posteam failed to convert first down on fourth down. |
| `incomplete_pass` | `number` | Binary indicator for if the pass was incomplete. |
| `touchback` | `number` | Binary indicator for if a touchback occurred on the play. |
| `interception` | `number` | Binary indicator for if the pass was intercepted. |
| `punt_inside_twenty` | `number` | Binary indicator for if the punt ended inside the twenty yard line. |
| `punt_in_endzone` | `number` | Binary indicator for if the punt was in the endzone. |
| `punt_out_of_bounds` | `number` | Binary indicator for if the punt went out of bounds. |
| `punt_downed` | `number` | Binary indicator for if the punt was downed. |
| `punt_fair_catch` | `number` | Binary indicator for if the punt was caught with a fair catch. |
| `kickoff_inside_twenty` | `number` | Binary indicator for if the kickoff ended inside the twenty yard line. |
| `kickoff_in_endzone` | `number` | Binary indicator for if the kickoff was in the endzone. |
| `kickoff_out_of_bounds` | `number` | Binary indicator for if the kickoff went out of bounds. |
| `kickoff_downed` | `number` | Binary indicator for if the kickoff was downed. |
| `kickoff_fair_catch` | `number` | Binary indicator for if the kickoff was caught with a fair catch. |
| `fumble_forced` | `number` | Binary indicator for if the fumble was forced. |
| `fumble_not_forced` | `number` | Binary indicator for if the fumble was not forced. |
| `fumble_out_of_bounds` | `number` | Binary indicator for if the fumble went out of bounds. |
| `solo_tackle` | `number` | Binary indicator if the play had a solo tackle (could be multiple due to fumbles). |
| `safety` | `number` | Binary indicator for whether or not a safety occurred. |
| `penalty` | `number` | Binary indicator for whether or not a penalty occurred. |
| `tackled_for_loss` | `number` | Binary indicator for whether or not a tackle for loss on a run play occurred. |
| `fumble_lost` | `number` | Binary indicator for if the fumble was lost. |
| `own_kickoff_recovery` | `number` | Binary indicator for if the kicking team recovered the kickoff. |
| `own_kickoff_recovery_td` | `number` | Binary indicator for if the kicking team recovered the kickoff and scored a TD. |
| `qb_hit` | `number` | Binary indicator if the QB was hit on the play. |
| `rush_attempt` | `number` | Binary indicator for if the play was a run. |
| `pass_attempt` | `number` | Binary indicator for if the play was a pass attempt (includes sacks). |
| `sack` | `number` | Binary indicator for if the play ended in a sack. |
| `touchdown` | `number` | Binary indicator for if the play resulted in a TD. |
| `pass_touchdown` | `number` | Binary indicator for if the play resulted in a passing TD. |
| `rush_touchdown` | `number` | Binary indicator for if the play resulted in a rushing TD. |
| `return_touchdown` | `number` | Binary indicator for if the play resulted in a return TD. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `extra_point_attempt` | `number` | Binary indicator for extra point attempt. |
| `two_point_attempt` | `number` | Binary indicator for two point conversion attempt. |
| `field_goal_attempt` | `number` | Binary indicator for field goal attempt. |
| `kickoff_attempt` | `number` | Binary indicator for kickoff. |
| `punt_attempt` | `number` | Binary indicator for punts. |
| `fumble` | `number` | Binary indicator for if a fumble occurred. |
| `complete_pass` | `number` | Binary indicator for if the pass was completed. |
| `assist_tackle` | `number` | Binary indicator for if an assist tackle occurred. |
| `lateral_reception` | `number` | Binary indicator for if a lateral occurred on the reception. |
| `lateral_rush` | `number` | Binary indicator for if a lateral occurred on a run. |
| `lateral_return` | `number` | Binary indicator for if a lateral occurred on a return. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `lateral_recovery` | `number` | Binary indicator for if a lateral occurred on a fumble recovery. |
| `passer_player_id` | `string` | Unique identifier for the player that attempted the pass. |
| `passer_player_name` | `string` | String name for the player that attempted the pass. |
| `passing_yards` | `number` | Numeric yards by the passer_player_name, including yards gained in pass plays with laterals. This should equal official passing statistics. |
| `receiver_player_id` | `string` | Unique identifier for the receiver that was targeted on the pass. |
| `receiver_player_name` | `string` | String name for the targeted receiver. |
| `receiving_yards` | `number` | Numeric yards by the receiver_player_name, excluding yards gained in pass plays with laterals. This should equal official receiving statistics but could miss yards gained in pass plays with laterals. Please see the description of `lateral_receiver_player_name` for further information. |
| `rusher_player_id` | `string` | Unique identifier for the player that attempted the run. |
| `rusher_player_name` | `string` | String name for the player that attempted the run. |
| `rushing_yards` | `number` | Numeric yards by the rusher_player_name, excluding yards gained in rush plays with laterals. This should equal official rushing statistics but could miss yards gained in rush plays with laterals. Please see the description of `lateral_rusher_player_name` for further information. |
| `lateral_receiver_player_id` | `string` | Unique identifier for the player that received the last(!) lateral on a pass play. |
| `lateral_receiver_player_name` | `string` | String name for the player that received the last(!) lateral on a pass play. If there were multiple laterals in the same play, this will only be the last player who received a lateral. Please see \<https://github.com/mrcaseb/nfl-data/tree/master/data/lateral_yards\> for a list of plays where multiple players recorded lateral receiving yards. |
| `lateral_receiving_yards` | `number` | Numeric yards by the `lateral_receiver_player_name` in pass plays with laterals. Please see the description of `lateral_receiver_player_name` for further information. |
| `lateral_rusher_player_id` | `string` | Unique identifier for the player that received the last(!) lateral on a run play. |
| `lateral_rusher_player_name` | `string` | String name for the player that received the last(!) lateral on a run play. If there were multiple laterals in the same play, this will only be the last player who received a lateral. Please see \<https://github.com/mrcaseb/nfl-data/tree/master/data/lateral_yards\> for a list of plays where multiple players recorded lateral rushing yards. |
| `lateral_rushing_yards` | `number` | Numeric yards by the `lateral_rusher_player_name` in run plays with laterals. Please see the description of `lateral_rusher_player_name` for further information. |
| `lateral_sack_player_id` | `string` | Unique identifier for the player that received the lateral on a sack. |
| `lateral_sack_player_name` | `string` | String name for the player that received the lateral on a sack. |
| `interception_player_id` | `string` | Unique identifier for the player that intercepted the pass. |
| `interception_player_name` | `string` | String name for the player that intercepted the pass. |
| `lateral_interception_player_id` | `string` | Unique identifier for the player that received the lateral on an interception. |
| `lateral_interception_player_name` | `string` | String name for the player that received the lateral on an interception. |
| `punt_returner_player_id` | `string` | Unique identifier for the punt returner. |
| `punt_returner_player_name` | `string` | String name for the punt returner. |
| `lateral_punt_returner_player_id` | `string` | Unique identifier for the player that received the lateral on a punt return. |
| `lateral_punt_returner_player_name` | `string` | String name for the player that received the lateral on a punt return. |
| `kickoff_returner_player_name` | `string` | String name for the kickoff returner. |
| `kickoff_returner_player_id` | `string` | Unique identifier for the kickoff returner. |
| `lateral_kickoff_returner_player_id` | `string` | Unique identifier for the player that received the lateral on a kickoff return. |
| `lateral_kickoff_returner_player_name` | `string` | String name for the player that received the lateral on a kickoff return. |
| `punter_player_id` | `string` | Unique identifier for the punter. |
| `punter_player_name` | `string` | String name for the punter. |
| `kicker_player_name` | `string` | String name for the kicker on FG or kickoff. |
| `kicker_player_id` | `string` | Unique identifier for the kicker on FG or kickoff. |
| `own_kickoff_recovery_player_id` | `string` | Unique identifier for the player that recovered their own kickoff. |
| `own_kickoff_recovery_player_name` | `string` | String name for the player that recovered their own kickoff. |
| `blocked_player_id` | `string` | Unique identifier for the player that blocked the punt or FG. |
| `blocked_player_name` | `string` | String name for the player that blocked the punt or FG. |
| `tackle_for_loss_1_player_id` | `string` | Unique identifier for one of the potential players with the tackle for loss. |
| `tackle_for_loss_1_player_name` | `string` | String name for one of the potential players with the tackle for loss. |
| `tackle_for_loss_2_player_id` | `string` | Unique identifier for one of the potential players with the tackle for loss. |
| `tackle_for_loss_2_player_name` | `string` | String name for one of the potential players with the tackle for loss. |
| `qb_hit_1_player_id` | `string` | Unique identifier for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_1_player_name` | `string` | String name for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_2_player_id` | `string` | Unique identifier for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_2_player_name` | `string` | String name for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `forced_fumble_player_1_team` | `string` | Team of one of the players with a forced fumble. |
| `forced_fumble_player_1_player_id` | `string` | Unique identifier of one of the players with a forced fumble. |
| `forced_fumble_player_1_player_name` | `string` | String name of one of the players with a forced fumble. |
| `forced_fumble_player_2_team` | `string` | Team of one of the players with a forced fumble. |
| `forced_fumble_player_2_player_id` | `string` | Unique identifier of one of the players with a forced fumble. |
| `forced_fumble_player_2_player_name` | `string` | String name of one of the players with a forced fumble. |
| `solo_tackle_1_team` | `string` | Team of one of the players with a solo tackle. |
| `solo_tackle_2_team` | `string` | Team of one of the players with a solo tackle. |
| `solo_tackle_1_player_id` | `string` | Unique identifier of one of the players with a solo tackle. |
| `solo_tackle_2_player_id` | `string` | Unique identifier of one of the players with a solo tackle. |
| `solo_tackle_1_player_name` | `string` | String name of one of the players with a solo tackle. |
| `solo_tackle_2_player_name` | `string` | String name of one of the players with a solo tackle. |
| `assist_tackle_1_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_1_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_1_team` | `string` | Team of one of the players with a tackle assist. |
| `assist_tackle_2_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_2_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_2_team` | `string` | Team of one of the players with a tackle assist. |
| `assist_tackle_3_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_3_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_3_team` | `string` | Team of one of the players with a tackle assist. |
| `assist_tackle_4_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_4_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_4_team` | `string` | Team of one of the players with a tackle assist. |
| `tackle_with_assist` | `number` | Binary indicator for if there has been a tackle with assist. |
| `tackle_with_assist_1_player_id` | `string` | Unique identifier of one of the players with a tackle with assist. |
| `tackle_with_assist_1_player_name` | `string` | String name of one of the players with a tackle with assist. |
| `tackle_with_assist_1_team` | `string` | Team of one of the players with a tackle with assist. |
| `tackle_with_assist_2_player_id` | `string` | Unique identifier of one of the players with a tackle with assist. |
| `tackle_with_assist_2_player_name` | `string` | String name of one of the players with a tackle with assist. |
| `tackle_with_assist_2_team` | `string` | Team of one of the players with a tackle with assist. |
| `pass_defense_1_player_id` | `string` | Unique identifier of one of the players with a pass defense. |
| `pass_defense_1_player_name` | `string` | String name of one of the players with a pass defense. |
| `pass_defense_2_player_id` | `string` | Unique identifier of one of the players with a pass defense. |
| `pass_defense_2_player_name` | `string` | String name of one of the players with a pass defense. |
| `fumbled_1_team` | `string` | Team of one of the first player with a fumble. |
| `fumbled_1_player_id` | `string` | Unique identifier of the first player who fumbled on the play. |
| `fumbled_1_player_name` | `string` | String name of one of the first player who fumbled on the play. |
| `fumbled_2_player_id` | `string` | Unique identifier of the second player who fumbled on the play. |
| `fumbled_2_player_name` | `string` | String name of one of the second player who fumbled on the play. |
| `fumbled_2_team` | `string` | Team of one of the second player with a fumble. |
| `fumble_recovery_1_team` | `string` | Team of one of the players with a fumble recovery. |
| `fumble_recovery_1_yards` | `number` | Yards gained by one of the players with a fumble recovery. |
| `fumble_recovery_1_player_id` | `string` | Unique identifier of one of the players with a fumble recovery. |
| `fumble_recovery_1_player_name` | `string` | String name of one of the players with a fumble recovery. |
| `fumble_recovery_2_team` | `string` | Team of one of the players with a fumble recovery. |
| `fumble_recovery_2_yards` | `number` | Yards gained by one of the players with a fumble recovery. |
| `fumble_recovery_2_player_id` | `string` | Unique identifier of one of the players with a fumble recovery. |
| `fumble_recovery_2_player_name` | `string` | String name of one of the players with a fumble recovery. |
| `sack_player_id` | `string` | Unique identifier of the player who recorded a solo sack. |
| `sack_player_name` | `string` | String name of the player who recorded a solo sack. |
| `half_sack_1_player_id` | `string` | Unique identifier of the first player who recorded half a sack. |
| `half_sack_1_player_name` | `string` | String name of the first player who recorded half a sack. |
| `half_sack_2_player_id` | `string` | Unique identifier of the second player who recorded half a sack. |
| `half_sack_2_player_name` | `string` | String name of the second player who recorded half a sack. |
| `return_team` | `string` | String abbreviation of the return team. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `return_yards` | `number` | Yards gained by the return team. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `penalty_team` | `string` | String abbreviation of the team with the penalty. |
| `penalty_player_id` | `string` | Unique identifier for the player with the penalty. |
| `penalty_player_name` | `string` | String name for the player with the penalty. |
| `penalty_yards` | `number` | Yards gained (or lost) by the posteam from the penalty. |
| `replay_or_challenge` | `number` | Binary indicator for whether or not a replay or challenge. |
| `replay_or_challenge_result` | `string` | String indicating the result of the replay or challenge. |
| `penalty_type` | `string` | String indicating the penalty type of the first penalty in the given play. Will be `NA` if `desc` is missing the type. |
| `defensive_two_point_attempt` | `number` | Binary indicator whether or not the defense was able to have an attempt on a two point conversion, this results following a turnover. |
| `defensive_two_point_conv` | `number` | Binary indicator whether or not the defense successfully scored on the two point conversion. |
| `defensive_extra_point_attempt` | `number` | Binary indicator whether or not the defense was able to have an attempt on an extra point attempt, this results following a blocked attempt that the defense recovers the ball. |
| `defensive_extra_point_conv` | `number` | Binary indicator whether or not the defense successfully scored on an extra point attempt. |
| `safety_player_name` | `string` | String name for the player who scored a safety. |
| `safety_player_id` | `string` | Unique identifier for the player who scored a safety. |
| `season` | `number` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `cp` | `number` | Numeric value indicating the probability for a complete pass based on comparable game situations. |
| `cpoe` | `number` | Completion percentage over expected in PERCENTAGE POINTS, not a 0-1 rate -- 100 * (complete_pass - cp) per pass play, so a completed pass with cp 0.368 scores +63.2 and the same pass falling incomplete scores -36.8. Averaged over a passer's attempts it is the familiar CPOE of a few points either way; divide by 100 before combining it with 0-1 probabilities such as cp. Null on non-pass rows. |
| `series` | `number` | Starts at 1, each new first down increments, numbers shared across both teams NA: kickoffs, extra point/two point conversion attempts, non-plays, no posteam |
| `series_success` | `number` | 1: scored touchdown, gained enough yards for first down. |
| `series_result` | `string` | Possible values: First down, Touchdown, Opp touchdown, Field goal, Missed field goal, Safety, Turnover, Punt, Turnover on downs, QB kneel, End of half |
| `order_sequence` | `number` | Column provided by NFL to fix out-of-order plays. Available 2011 and beyond with source "nfl". |
| `start_time` | `string` | Kickoff time in eastern time zone. |
| `time_of_day` | `string` | Time of day of play in UTC "HH:MM:SS" format. Available 2011 and beyond with source "nfl". |
| `stadium` | `string` | Name of the stadium |
| `weather` | `string` | String describing the weather including temperature, humidity and wind (direction and speed). Doesn't change during the game! |
| `nfl_api_id` | `string` | UUID of the game in the new NFL API. |
| `play_clock` | `string` | Time on the playclock when the ball was snapped. |
| `play_deleted` | `number` | Binary indicator for deleted plays. |
| `play_type_nfl` | `string` | Play type as listed in the NFL source. Slightly different to the regular play_type variable. |
| `special_teams_play` | `number` | Binary indicator for whether play is special teams play from NFL source. Available 2011 and beyond with source "nfl". |
| `st_play_type` | `string` | Type of special teams play from NFL source. Available 2011 and beyond with source "nfl". |
| `end_clock_time` | `string` | Game time at the end of a given play. |
| `end_yard_line` | `string` | String indicating the yardline at the end of the given play consisting of team half and yard line number. |
| `fixed_drive` | `number` | Manually created drive number in a game. |
| `fixed_drive_result` | `string` | Manually created drive result. |
| `drive_real_start_time` | `string` | Local day time when the drive started (currently not used by the NFL and therefore mostly 'NA'). |
| `drive_play_count` | `number` | Numeric value of how many regular plays happened in a given drive. |
| `drive_time_of_possession` | `string` | Time of possession in a given drive. |
| `drive_first_downs` | `number` | Number of first downs in a given drive. |
| `drive_inside20` | `number` | Binary indicator if the offense was able to get inside the opponents 20 yard line. |
| `drive_ended_with_score` | `number` | Binary indicator the drive ended with a score. |
| `drive_quarter_start` | `number` | Numeric value indicating in which quarter the given drive has started. |
| `drive_quarter_end` | `number` | Numeric value indicating in which quarter the given drive has ended. |
| `drive_yards_penalized` | `number` | Numeric value of how many yards the offense gained or lost through penalties in the given drive. |
| `drive_start_transition` | `string` | String indicating how the offense got the ball. |
| `drive_end_transition` | `string` | String indicating how the offense lost the ball. |
| `drive_game_clock_start` | `string` | Game time at the beginning of a given drive. |
| `drive_game_clock_end` | `string` | Game time at the end of a given drive. |
| `drive_start_yard_line` | `string` | String indicating where a given drive started consisting of team half and yard line number. |
| `drive_end_yard_line` | `string` | String indicating where a given drive ended consisting of team half and yard line number. |
| `drive_play_id_started` | `string \| number` | Play_id of the first play in the given drive. |
| `drive_play_id_ended` | `string \| number` | Play_id of the last play in the given drive. |
| `away_score` | `number` | The number of points the away team scored. Is NA for games which haven't yet been played. |
| `home_score` | `number` | The number of points the home team scored. Is NA for games which haven't yet been played. |
| `location` | `string` | Either Home if the home team is playing in their home stadium, or Neutral if the game is being played at a neutral location. This still shows as Home for games between the Giants and Jets even though they share the same home stadium. |
| `result` | `number` | The number of points the home team scored minus the number of points the visiting team scored. Equals h_score - v_score. Is NA for games which haven't yet been played. Convenient for evaluating against the spread bets. |
| `total` | `number` | The sum of each team's score in the game. Equals h_score + v_score. Is NA for games which haven't yet been played. Convenient for evaluating over/under total bets. |
| `spread_line` | `number` | The closing spread line for the game. A positive number means the home team was favored by that many points, a negative number means the away team was favored by that many points. (Source: Pro-Football-Reference) |
| `total_line` | `number` | The closing total line for the game. (Source: Pro-Football-Reference) |
| `div_game` | `number` | Binary indicator of whether or not game was played by 2 teams in the same division. |
| `roof` | `string` | One of 'dome', 'outdoors', 'closed', 'open' indicating indicating the roof status of the stadium the game was played in. (Source: Pro-Football-Reference) |
| `surface` | `string` | What type of ground the game was played on. (Source: Pro-Football-Reference) |
| `temp` | `number` | The temperature at the stadium only for 'roof' = 'outdoors' or 'open'.(Source: Pro-Football-Reference) |
| `wind` | `number` | The speed of the wind in miles/hour only for 'roof' = 'outdoors' or 'open'. (Source: Pro-Football-Reference) |
| `home_coach` | `string` | First and last name of the home team coach. (Source: Pro-Football-Reference) |
| `away_coach` | `string` | First and last name of the away team coach. (Source: Pro-Football-Reference) |
| `stadium_id` | `string` | ID of the stadium the game was played in. (Source: Pro-Football-Reference) |
| `game_stadium` | `string` | Name of the stadium the game was played in. (Source: Pro-Football-Reference) |
| `aborted_play` | `number` | Binary indicator if the play description indicates "Aborted". |
| `success` | `number` | Binary indicator whether epa \> 0 in the given play. |
| `passer` | `string` | Name of the dropback player (scrambles included) including plays with penalties. |
| `passer_jersey_number` | `number` | Jersey number of the passer. |
| `rusher` | `string` | Name of the rusher (no scrambles) including plays with penalties. |
| `rusher_jersey_number` | `number` | Jersey number of the rusher. |
| `receiver` | `string` | Name of the receiver including plays with penalties. |
| `receiver_jersey_number` | `number` | Jersey number of the receiver. |
| `pass` | `number` | Binary indicator if the play was a pass play (sacks and scrambles included). |
| `rush` | `number` | Binary indicator if the play was a rushing play. |
| `first_down` | `number` | Binary indicator if the play ended in a first down. |
| `special` | `number` | Binary indicator if "play_type" is one of "extra_point", "field_goal", "kickoff", or "punt". |
| `play` | `number` | Binary indicator: 1 if the play was a 'normal' play (including penalties), 0 otherwise. |
| `passer_id` | `string` | ID of the player in the 'passer' column. |
| `rusher_id` | `string` | ID of the player in the 'rusher' column. |
| `receiver_id` | `string` | ID of the player in the 'receiver' column. |
| `name` | `string` | Name, as reported by MFL but reordered into FirstName LastName instead of Last, First |
| `jersey_number` | `number` | Jersey number. Often useful for joins by name/team/jersey. |
| `id` | `string` | ID of the player in the 'name' column. |
| `fantasy_player_name` | `string` | Name of the rusher on rush plays or receiver on pass plays (from official stats). |
| `fantasy_player_id` | `string` | ID of the rusher on rush plays or receiver on pass plays (from official stats). |
| `fantasy` | `string` | Name of the rusher on rush plays or receiver on pass plays. |
| `fantasy_id` | `string` | ID of the rusher on rush plays or receiver on pass plays. |
| `out_of_bounds` | `number` | 1 if play description contains ran ob, pushed ob, or sacked ob; 0 otherwise. |
| `home_opening_kickoff` | `number` | 1 if the home team received the opening kickoff, 0 otherwise. |
| `qb_epa` | `number` | Gives QB credit for EPA for up to the point where a receiver lost a fumble after a completed catch and makes EPA work more like passing yards on plays with fumbles. |
| `xyac_epa` | `number` | Expected value of EPA gained after the catch, starting from where the catch was made. Zero yards after the catch would be listed as zero EPA. |
| `xyac_mean_yardage` | `number` | Average expected yards after the catch based on where the ball was caught. |
| `xyac_median_yardage` | `number` | Median expected yards after the catch based on where the ball was caught. |
| `xyac_success` | `number` | Probability play earns positive EPA (relative to where play started) based on where ball was caught. |
| `xyac_fd` | `number` | Probability play earns a first down based on where the ball was caught. |
| `xpass` | `number` | Probability of dropback scaled from 0 to 1. |
| `pass_oe` | `number` | Dropback percent over expected on a given play scaled from 0 to 100. |

## `loadNflModelPbp`

Release: [nfl_model_pbp](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_model_pbp) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_model_pbp/model_pbp_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1999); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflModelPbp({ seasons: 2024, columns: ['game_id', 'play_id', 'desc', 'epa', 'wp'] });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_model_pbp(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflModelPbpRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Ten digit identifier for NFL game. |
| `season` | `number \| bigint` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `week` | `number \| bigint` | Season week. |
| `season_type` | `string` | REG or POST indicating if the timeframe belongs to regular or post season. |
| `play_id` | `string` | Numeric play id that when used with game_id and drive provides the unique identifier for a single play. |
| `play_seq` | `number` | Game-global sequential play order from the NFL.com Shield feed; ordering key within a game (game_id + play_seq is unique). |
| `posteam` | `string` | String abbreviation for the team with possession. |
| `defteam` | `string` | String abbreviation for the team on defense. |
| `home_team` | `string` | The home team. Note that this contains the designated home team for games which no team is playing at home such as Super Bowls or NFL International games. |
| `away_team` | `string` | String abbreviation for the away team. |
| `home` | `number \| bigint` |  |
| `qtr` | `number \| bigint` | Quarter of the game (5 is overtime). |
| `game_half` | `string` | String indicating which half the play is in, either Half1, Half2, or Overtime. |
| `down` | `number \| bigint` | The down for the given play. |
| `ydstogo` | `number \| bigint` | Numeric yards in distance from either the first down marker or the endzone in goal down situations. |
| `yardline_100` | `number \| bigint` | Numeric distance in the number of yards from the opponent's endzone for the posteam. |
| `goal_to_go` | `number \| bigint` | Binary indicator for whether or not the posteam is in a goal down situation. |
| `quarter_seconds_remaining` | `number \| bigint` | Numeric seconds remaining in the quarter. |
| `half_seconds_remaining` | `number \| bigint` | Numeric seconds remaining in the half. |
| `game_seconds_remaining` | `number \| bigint` | Numeric seconds remaining in the game. |
| `play_type` | `string` | String indicating the type of play: pass (includes sacks), run (includes scrambles), punt, field_goal, kickoff, extra_point, qb_kneel, qb_spike, no_play (timeouts and penalties), and missing for rows indicating end of play. |
| `yards_gained` | `number \| bigint` | Numeric yards gained (or lost) by the possessing team, excluding yards gained via fumble recoveries and laterals. |
| `desc` | `string` | Detailed string description for the given play. |
| `shield_play_type` | `string` | Raw NFL.com Shield play-type enum for the play (e.g. RUSH, PASS, FIELD_GOAL, KICK_OFF, PENALTY, END_QUARTER, GAME_START, COMMENT) -- the unmapped upstream value behind the nflfastR-style play_type. |
| `special_teams_play_type` | `string` | Shield special-teams sub-type qualifier; UNSPECIFIED on ordinary plays and PENALTY when the special-teams play resolved to a penalty. |
| `sp` | `number \| bigint` | Binary indicator for whether or not a score occurred on the play. |
| `pass_attempt` | `number \| bigint` | Binary indicator for if the play was a pass attempt (includes sacks). |
| `complete_pass` | `number \| bigint` | Binary indicator for if the pass was completed. |
| `incomplete_pass` | `number \| bigint` | Binary indicator for if the pass was incomplete. |
| `interception` | `number \| bigint` | Binary indicator for if the pass was intercepted. |
| `rush_attempt` | `number \| bigint` | Binary indicator for if the play was a run. |
| `sack` | `number \| bigint` | Binary indicator for if the play ended in a sack. |
| `touchdown` | `number \| bigint` | Binary indicator for if the play resulted in a TD. |
| `pass_touchdown` | `number \| bigint` | Binary indicator for if the play resulted in a passing TD. |
| `rush_touchdown` | `number \| bigint` | Binary indicator for if the play resulted in a rushing TD. |
| `return_touchdown` | `number \| bigint` | Binary indicator for if the play resulted in a return TD. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `field_goal_attempt` | `number \| bigint` | Binary indicator for field goal attempt. |
| `field_goal_made` | `number \| bigint` | Binary indicator (1/0) that the field-goal attempt on this play was good. |
| `field_goal_missed` | `number \| bigint` | Binary indicator (1/0) that the field-goal attempt on this play was missed (not blocked). |
| `field_goal_blocked` | `number \| bigint` | Binary indicator (1/0) that the field-goal attempt on this play was blocked. |
| `extra_point_attempt` | `number \| bigint` | Binary indicator for extra point attempt. |
| `two_point_attempt` | `number \| bigint` | Binary indicator for two point conversion attempt. |
| `punt_attempt` | `number \| bigint` | Binary indicator for punts. |
| `kickoff_attempt` | `number \| bigint` | Binary indicator for kickoff. |
| `penalty` | `number \| bigint` | Binary indicator for whether or not a penalty occurred. |
| `fumble` | `number \| bigint` | Binary indicator for if a fumble occurred. |
| `fumble_lost` | `number \| bigint` | Binary indicator for if the fumble was lost. |
| `qb_hit` | `number \| bigint` | Binary indicator if the QB was hit on the play. |
| `safety` | `number \| bigint` | Binary indicator for whether or not a safety occurred. |
| `timeout` | `number \| bigint` | Binary indicator for whether or not a timeout was called by either team. |
| `first_down_rush` | `number \| bigint` | Binary indicator for if a running play converted the first down. |
| `first_down_pass` | `number \| bigint` | Binary indicator for if a passing play converted the first down. |
| `first_down_penalty` | `number \| bigint` | Binary indicator for if a penalty converted the first down. |
| `solo_tackle` | `number \| bigint` | Binary indicator if the play had a solo tackle (could be multiple due to fumbles). |
| `assist_tackle` | `number \| bigint` | Binary indicator for if an assist tackle occurred. |
| `tackle_with_assist` | `number \| bigint` | Binary indicator for if there has been a tackle with assist. |
| `tackled_for_loss` | `number \| bigint` | Binary indicator for whether or not a tackle for loss on a run play occurred. |
| `fumble_forced` | `number \| bigint` | Binary indicator for if the fumble was forced. |
| `fumble_not_forced` | `number \| bigint` | Binary indicator for if the fumble was not forced. |
| `fumble_out_of_bounds` | `number \| bigint` | Binary indicator for if the fumble went out of bounds. |
| `punt_fair_catch` | `number \| bigint` | Binary indicator for if the punt was caught with a fair catch. |
| `punt_downed` | `number \| bigint` | Binary indicator for if the punt was downed. |
| `punt_out_of_bounds` | `number \| bigint` | Binary indicator for if the punt went out of bounds. |
| `kickoff_fair_catch` | `number \| bigint` | Binary indicator for if the kickoff was caught with a fair catch. |
| `kickoff_out_of_bounds` | `number \| bigint` | Binary indicator for if the kickoff went out of bounds. |
| `extra_point_good` | `number \| bigint` | Binary indicator (1/0) that the extra-point kick on this play was good. |
| `extra_point_failed` | `number \| bigint` | Binary indicator (1/0) that the extra-point kick on this play was missed (not blocked or aborted). |
| `extra_point_blocked` | `number \| bigint` | Binary indicator (1/0) that the extra-point kick on this play was blocked. |
| `extra_point_safety` | `number \| bigint` | Binary indicator (1/0) that the extra-point attempt on this play resulted in a defensive safety (one point for the defense). |
| `extra_point_aborted` | `number \| bigint` | Binary indicator (1/0) that the extra-point attempt on this play was aborted (botched snap or hold, no kick attempted). |
| `two_point_rush_good` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion attempt was a rush that converted. |
| `two_point_rush_failed` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion attempt was a rush that failed. |
| `two_point_rush_safety` | `number \| bigint` | Binary indicator (1/0) that a rushing two-point conversion attempt ended in a safety for the defense. |
| `two_point_pass_good` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion attempt was a pass that converted. |
| `two_point_pass_failed` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion attempt was a pass that failed. |
| `two_point_pass_safety` | `number \| bigint` | Binary indicator (1/0) that a passing two-point conversion attempt ended in a safety for the defense. |
| `two_point_pass_reception_good` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion was completed and credited as a reception. |
| `two_point_pass_reception_failed` | `number \| bigint` | Binary indicator (1/0) that the two-point conversion pass was thrown but not completed for the conversion. |
| `two_point_return` | `number \| bigint` | Binary indicator (1/0) that the defense returned a failed conversion attempt for two points. |
| `def_tackles_for_loss` | `number \| bigint` | Number of tackles for loss (TFL) for this player |
| `def_tackles_for_loss_yards` | `number \| bigint` | Yards lost from TFLs involving this player |
| `td_ids_touchdown` | `number \| bigint` | Count of touchdowns credited on the play from the Shield scoring-participant ids (2 on the rare multi-score bookkeeping rows). |
| `misc_yards` | `number \| bigint` | Yards gained or lost on the play that are not attributed to a rush, pass, or return (miscellaneous Shield yardage bucket). |
| `fumble_recovery_own_lateral_yards` | `number \| bigint` | Yards gained or lost after an own-team fumble recovery that came via a lateral. |
| `fumble_recovery_opp_lateral_yards` | `number \| bigint` | Yards gained or lost after an opponent fumble recovery that came via a lateral. |
| `air_yards` | `number \| bigint` | Numeric value for distance in yards perpendicular to the line of scrimmage at where the targeted receiver either caught or didn't catch the ball. |
| `yards_after_catch` | `number \| bigint` | Numeric value for distance in yards perpendicular to the yard line where the receiver made the reception to where the play ended. |
| `passing_yards` | `number \| bigint` | Numeric yards by the passer_player_name, including yards gained in pass plays with laterals. This should equal official passing statistics. |
| `rushing_yards` | `number \| bigint` | Numeric yards by the rusher_player_name, excluding yards gained in rush plays with laterals. This should equal official rushing statistics but could miss yards gained in rush plays with laterals. Please see the description of `lateral_rusher_player_name` for further information. |
| `receiving_yards` | `number \| bigint` | Numeric yards by the receiver_player_name, excluding yards gained in pass plays with laterals. This should equal official receiving statistics but could miss yards gained in pass plays with laterals. Please see the description of `lateral_receiver_player_name` for further information. |
| `penalty_yards` | `number \| bigint` | Yards gained (or lost) by the posteam from the penalty. |
| `kick_distance` | `number \| bigint` | Numeric distance in yards for kickoffs, field goals, and punts. |
| `return_yards` | `number \| bigint` | Yards gained by the return team. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `lateral_rushing_yards` | `unknown` | Numeric yards by the `lateral_rusher_player_name` in run plays with laterals. Please see the description of `lateral_rusher_player_name` for further information. |
| `lateral_receiving_yards` | `number \| bigint` | Numeric yards by the `lateral_receiver_player_name` in pass plays with laterals. Please see the description of `lateral_receiver_player_name` for further information. |
| `passer_player_id` | `string` | Unique identifier for the player that attempted the pass. |
| `passer_player_name` | `string` | String name for the player that attempted the pass. |
| `rusher_player_id` | `string` | Unique identifier for the player that attempted the run. |
| `rusher_player_name` | `string` | String name for the player that attempted the run. |
| `receiver_player_id` | `string` | Unique identifier for the receiver that was targeted on the pass. |
| `receiver_player_name` | `string` | String name for the targeted receiver. |
| `td_player_id` | `string` | Unique identifier of the player who scored a touchdown. |
| `td_player_name` | `string` | String name of the player who scored a touchdown. |
| `td_team` | `string` | String abbreviation for which team scored the touchdown. |
| `penalty_team` | `string` | String abbreviation of the team with the penalty. |
| `timeout_team` | `string` | String abbreviation for which team called the timeout. |
| `kicker_player_id` | `string` | Unique identifier for the kicker on FG or kickoff. |
| `kicker_player_name` | `string` | String name for the kicker on FG or kickoff. |
| `punter_player_id` | `string` | Unique identifier for the punter. |
| `punter_player_name` | `string` | String name for the punter. |
| `punt_returner_player_id` | `string` | Unique identifier for the punt returner. |
| `punt_returner_player_name` | `string` | String name for the punt returner. |
| `kickoff_returner_player_id` | `string` | Unique identifier for the kickoff returner. |
| `kickoff_returner_player_name` | `string` | String name for the kickoff returner. |
| `return_team` | `string` | String abbreviation of the return team. Returns may occur on any of: interception, fumble, kickoff, punt, or blocked kicks. |
| `interception_player_id` | `string` | Unique identifier for the player that intercepted the pass. |
| `interception_player_name` | `string` | String name for the player that intercepted the pass. |
| `sack_player_id` | `string` | Unique identifier of the player who recorded a solo sack. |
| `sack_player_name` | `string` | String name of the player who recorded a solo sack. |
| `safety_player_id` | `unknown` | Unique identifier for the player who scored a safety. |
| `safety_player_name` | `unknown` | String name for the player who scored a safety. |
| `blocked_player_id` | `string` | Unique identifier for the player that blocked the punt or FG. |
| `blocked_player_name` | `string` | String name for the player that blocked the punt or FG. |
| `penalty_player_id` | `string` | Unique identifier for the player with the penalty. |
| `penalty_player_name` | `string` | String name for the player with the penalty. |
| `solo_tackle_1_player_id` | `string` | Unique identifier of one of the players with a solo tackle. |
| `solo_tackle_1_player_name` | `string` | String name of one of the players with a solo tackle. |
| `solo_tackle_1_team` | `string` | Team of one of the players with a solo tackle. |
| `solo_tackle_2_player_id` | `string` | Unique identifier of one of the players with a solo tackle. |
| `solo_tackle_2_player_name` | `string` | String name of one of the players with a solo tackle. |
| `solo_tackle_2_team` | `string` | Team of one of the players with a solo tackle. |
| `assist_tackle_1_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_1_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_1_team` | `string` | Team of one of the players with a tackle assist. |
| `assist_tackle_2_player_id` | `string` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_2_player_name` | `string` | String name of one of the players with a tackle assist. |
| `assist_tackle_2_team` | `string` | Team of one of the players with a tackle assist. |
| `assist_tackle_3_player_id` | `unknown` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_3_player_name` | `unknown` | String name of one of the players with a tackle assist. |
| `assist_tackle_3_team` | `unknown` | Team of one of the players with a tackle assist. |
| `assist_tackle_4_player_id` | `unknown` | Unique identifier of one of the players with a tackle assist. |
| `assist_tackle_4_player_name` | `unknown` | String name of one of the players with a tackle assist. |
| `assist_tackle_4_team` | `unknown` | Team of one of the players with a tackle assist. |
| `tackle_with_assist_1_player_id` | `string` | Unique identifier of one of the players with a tackle with assist. |
| `tackle_with_assist_1_player_name` | `string` | String name of one of the players with a tackle with assist. |
| `tackle_with_assist_1_team` | `string` | Team of one of the players with a tackle with assist. |
| `tackle_with_assist_2_player_id` | `unknown` | Unique identifier of one of the players with a tackle with assist. |
| `tackle_with_assist_2_player_name` | `unknown` | String name of one of the players with a tackle with assist. |
| `tackle_with_assist_2_team` | `unknown` | Team of one of the players with a tackle with assist. |
| `tackle_for_loss_1_player_id` | `string` | Unique identifier for one of the potential players with the tackle for loss. |
| `tackle_for_loss_1_player_name` | `string` | String name for one of the potential players with the tackle for loss. |
| `tackle_for_loss_2_player_id` | `unknown` | Unique identifier for one of the potential players with the tackle for loss. |
| `tackle_for_loss_2_player_name` | `unknown` | String name for one of the potential players with the tackle for loss. |
| `half_sack_1_player_id` | `string` | Unique identifier of the first player who recorded half a sack. |
| `half_sack_1_player_name` | `string` | String name of the first player who recorded half a sack. |
| `half_sack_2_player_id` | `string` | Unique identifier of the second player who recorded half a sack. |
| `half_sack_2_player_name` | `string` | String name of the second player who recorded half a sack. |
| `qb_hit_1_player_id` | `string` | Unique identifier for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_1_player_name` | `string` | String name for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_2_player_id` | `string` | Unique identifier for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `qb_hit_2_player_name` | `string` | String name for one of the potential players that hit the QB. No sack as the QB was not the ball carrier. For sacks please see `sack_player` or `half_sack_*_player`. |
| `pass_defense_1_player_id` | `string` | Unique identifier of one of the players with a pass defense. |
| `pass_defense_1_player_name` | `string` | String name of one of the players with a pass defense. |
| `pass_defense_2_player_id` | `string` | Unique identifier of one of the players with a pass defense. |
| `pass_defense_2_player_name` | `string` | String name of one of the players with a pass defense. |
| `forced_fumble_player_1_player_id` | `string` | Unique identifier of one of the players with a forced fumble. |
| `forced_fumble_player_1_player_name` | `string` | String name of one of the players with a forced fumble. |
| `forced_fumble_player_1_team` | `string` | Team of one of the players with a forced fumble. |
| `forced_fumble_player_2_player_id` | `string` | Unique identifier of one of the players with a forced fumble. |
| `forced_fumble_player_2_player_name` | `string` | String name of one of the players with a forced fumble. |
| `forced_fumble_player_2_team` | `string` | Team of one of the players with a forced fumble. |
| `fumbled_1_player_id` | `string` | Unique identifier of the first player who fumbled on the play. |
| `fumbled_1_player_name` | `string` | String name of one of the first player who fumbled on the play. |
| `fumbled_1_team` | `string` | Team of one of the first player with a fumble. |
| `fumbled_2_player_id` | `string` | Unique identifier of the second player who fumbled on the play. |
| `fumbled_2_player_name` | `string` | String name of one of the second player who fumbled on the play. |
| `fumbled_2_team` | `string` | Team of one of the second player with a fumble. |
| `fumble_recovery_1_player_id` | `string` | Unique identifier of one of the players with a fumble recovery. |
| `fumble_recovery_1_player_name` | `string` | String name of one of the players with a fumble recovery. |
| `fumble_recovery_1_team` | `string` | Team of one of the players with a fumble recovery. |
| `fumble_recovery_1_yards` | `number \| bigint` | Yards gained by one of the players with a fumble recovery. |
| `fumble_recovery_2_player_id` | `string` | Unique identifier of one of the players with a fumble recovery. |
| `fumble_recovery_2_player_name` | `string` | String name of one of the players with a fumble recovery. |
| `fumble_recovery_2_team` | `string` | Team of one of the players with a fumble recovery. |
| `fumble_recovery_2_yards` | `number \| bigint` | Yards gained by one of the players with a fumble recovery. |
| `two_point_conv_result` | `string` | String indicator for result of two point conversion attempt: success, failure, safety (touchback in defensive endzone is 1 point apparently), or return. |
| `extra_point_result` | `string` | String indicator for the result of the extra point attempt: good, failed, blocked, safety (touchback in defensive endzone is 1 point apparently), or aborted. |
| `special` | `number \| bigint` | Binary indicator if "play_type" is one of "extra_point", "field_goal", "kickoff", or "punt". |
| `pass_length` | `string` | String indicator for pass length: short or deep. |
| `pass_location` | `string` | String indicator for pass location: left, middle, or right. |
| `qb_kneel` | `number \| bigint` | Binary indicator for whether or not the QB took a knee. |
| `qb_spike` | `number \| bigint` | Binary indicator for whether or not the QB spiked the ball. |
| `qb_scramble` | `number \| bigint` | Binary indicator for whether or not the QB scrambled. |
| `shotgun` | `number \| bigint` | Binary indicator for whether or not the play was in shotgun formation. |
| `no_huddle` | `number \| bigint` | Binary indicator for whether or not the play was in no_huddle formation. |
| `run_location` | `string` | String indicator for location of run: left, middle, or right. |
| `run_gap` | `string` | String indicator for line gap of run: end, guard, or tackle |
| `pass` | `number \| bigint` | Binary indicator if the play was a pass play (sacks and scrambles included). |
| `rush` | `number \| bigint` | Binary indicator if the play was a rushing play. |
| `qb_dropback` | `number` | Binary indicator for whether or not the QB dropped back on the play (pass attempt, sack, or scrambled). |
| `posteam_score` | `number \| bigint` | Score the posteam at the start of the play. |
| `defteam_score` | `number \| bigint` | Score the defteam at the start of the play. |
| `score_differential` | `number \| bigint` | Score differential between the posteam and defteam at the start of the play. |
| `posteam_timeouts_remaining` | `number \| bigint` | Number of timeouts remaining for the possession team. |
| `defteam_timeouts_remaining` | `number \| bigint` | Number of timeouts remaining for the team on defense. |
| `roof` | `string` | One of 'dome', 'outdoors', 'closed', 'open' indicating indicating the roof status of the stadium the game was played in. (Source: Pro-Football-Reference) |
| `spread_line` | `number` | The closing spread line for the game. A positive number means the home team was favored by that many points, a negative number means the away team was favored by that many points. (Source: Pro-Football-Reference) |
| `total_line` | `number` | The closing total line for the game. (Source: Pro-Football-Reference) |
| `field_goal_result` | `string` | String indicator for result of field goal attempt: made, missed, or blocked. |
| `home_score` | `number \| bigint` | The number of points the home team scored. Is NA for games which haven't yet been played. |
| `away_score` | `number \| bigint` | The number of points the away team scored. Is NA for games which haven't yet been played. |
| `result` | `number \| bigint` | The number of points the home team scored minus the number of points the visiting team scored. Equals h_score - v_score. Is NA for games which haven't yet been played. Convenient for evaluating against the spread bets. |
| `fixed_drive` | `number \| bigint` | Manually created drive number in a game. |
| `fixed_drive_result` | `string` | Manually created drive result. |
| `drive_play_count` | `number \| bigint` | Numeric value of how many regular plays happened in a given drive. |
| `drive_first_downs` | `number \| bigint` | Number of first downs in a given drive. |
| `drive_inside20` | `number \| bigint` | Binary indicator if the offense was able to get inside the opponents 20 yard line. |
| `drive_ended_with_score` | `number \| bigint` | Binary indicator the drive ended with a score. |
| `drive_quarter_start` | `number \| bigint` | Numeric value indicating in which quarter the given drive has started. |
| `drive_quarter_end` | `number \| bigint` | Numeric value indicating in which quarter the given drive has ended. |
| `drive_yards_penalized` | `number \| bigint` | Numeric value of how many yards the offense gained or lost through penalties in the given drive. |
| `drive_start_transition` | `string` | String indicating how the offense got the ball. |
| `drive_end_transition` | `string` | String indicating how the offense lost the ball. |
| `drive_game_clock_start` | `string` | Game time at the beginning of a given drive. |
| `drive_game_clock_end` | `string` | Game time at the end of a given drive. |
| `drive_start_yard_line` | `number \| bigint` | Yards from the offense's line of scrimmage to the opponent's end zone (yardline_100) on the drive's first play, 1-99; the model-pbp parquet stores the numeric spot, not the 'OWN 20' text load_nfl_pbp carries. |
| `drive_end_yard_line` | `number \| bigint` | Yards from the offense's line of scrimmage to the opponent's end zone (yardline_100) on the drive's last play; the model-pbp parquet stores the numeric spot, not the 'OPP 45' text load_nfl_pbp carries. |
| `drive_play_id_started` | `string` | Play_id of the first play in the given drive. |
| `drive_play_id_ended` | `string` | Play_id of the last play in the given drive. |
| `drive_time_of_possession` | `string` | Time of possession in a given drive. |
| `series` | `number` | Starts at 1, each new first down increments, numbers shared across both teams NA: kickoffs, extra point/two point conversion attempts, non-plays, no posteam |
| `series_result` | `string` | Possible values: First down, Touchdown, Opp touchdown, Field goal, Missed field goal, Safety, Turnover, Punt, Turnover on downs, QB kneel, End of half |
| `series_success` | `number` | 1: scored touchdown, gained enough yards for first down. |
| `ep` | `number` | Using the scoring event probabilities, the estimated expected points with respect to the possession team for the given play. |
| `td_prob` | `number` | Predicted probability of the posteam scoring a TD next. 'Next' in this context means the next score in the same game half. |
| `opp_td_prob` | `number` | Predicted probability of the defteam scoring a TD next. 'Next' in this context means the next score in the same game half. |
| `fg_prob` | `number` | Predicted probability of the posteam scoring a FG next. 'Next' in this context means the next score in the same game half. |
| `opp_fg_prob` | `number` | Predicted probability of the defteam scoring a FG next. 'Next' in this context means the next score in the same game half. |
| `safety_prob` | `number` | Predicted probability of the posteam scoring a safety next. 'Next' in this context means the next score in the same game half. |
| `opp_safety_prob` | `number` | Predicted probability of the defteam scoring a safety next. 'Next' in this context means the next score in the same game half. |
| `no_score_prob` | `number` | Predicted probability of no score occurring for the rest of the half based on the expected points model. |
| `epa` | `number` | Expected points added (EPA) by the posteam for the given play. |
| `total_home_epa` | `number` | Cumulative total EPA for the home team in the game so far. |
| `total_away_epa` | `number` | Cumulative total EPA for the away team in the game so far. |
| `total_home_rush_epa` | `number` | Cumulative total rushing EPA for the home team in the game so far. |
| `total_away_rush_epa` | `number` | Cumulative total rushing EPA for the away team in the game so far. |
| `total_home_pass_epa` | `number` | Cumulative total passing EPA for the home team in the game so far. |
| `total_away_pass_epa` | `number` | Cumulative total passing EPA for the away team in the game so far. |
| `qb_epa` | `number` | Gives QB credit for EPA for up to the point where a receiver lost a fumble after a completed catch and makes EPA work more like passing yards on plays with fumbles. |
| `air_epa` | `number` | EPA from the air yards alone. For completions this represents the actual value provided through the air. For incompletions this represents the hypothetical value that could've been added through the air if the pass was completed. |
| `yac_epa` | `number` | EPA from the yards after catch alone. For completions this represents the actual value provided after the catch. For incompletions this represents the difference between the hypothetical air_epa and the play's raw observed EPA (how much the incomplete pass cost the posteam). |
| `comp_air_epa` | `number` | EPA from the air yards alone only for completions. |
| `comp_yac_epa` | `number` | EPA from the yards after catch alone only for completions. |
| `total_home_comp_air_epa` | `number` | Cumulative total completions air EPA for the home team in the game so far. |
| `total_away_comp_air_epa` | `number` | Cumulative total completions air EPA for the away team in the game so far. |
| `total_home_comp_yac_epa` | `number` | Cumulative total completions yac EPA for the home team in the game so far. |
| `total_away_comp_yac_epa` | `number` | Cumulative total completions yac EPA for the away team in the game so far. |
| `total_home_raw_air_epa` | `number` | Cumulative total raw air EPA for the home team in the game so far. |
| `total_away_raw_air_epa` | `number` | Cumulative total raw air EPA for the away team in the game so far. |
| `total_home_raw_yac_epa` | `number` | Cumulative total raw yac EPA for the home team in the game so far. |
| `total_away_raw_yac_epa` | `number` | Cumulative total raw yac EPA for the away team in the game so far. |
| `receive_2h_ko` | `number` | Binary indicator (1/0) that the play is in the first half and the possession team is the team receiving the second-half kickoff (the game's opening defense); mirrors nflfastR helper_add_ep_wp.R. |
| `posteam_spread` | `number` | Vegas point spread from the possession team's perspective (spread_line when the posteam is home, negated when it is away). |
| `elapsed_share` | `number` | Share of regulation elapsed at the start of the play, (3600 - game_seconds_remaining) / 3600, clipped to [0, 1]. |
| `spread_time` | `number` | WP-model feature: posteam_spread decayed by elapsed time, posteam_spread * exp(SPREAD_TIME_DECAY_EXPONENT * elapsed_share); set to 0 when no spread is available (use the naive WP model instead). |
| `Diff_Time_Ratio` | `number` | WP-model feature: score_differential inflated by elapsed time, score_differential / exp(SPREAD_TIME_DECAY_EXPONENT * elapsed_share). |
| `wp` | `number` | Estimated win probability for the posteam given the current situation at the start of the given play. |
| `vegas_wp` | `number` | Estimated win probability for the posteam given the current situation at the start of the given play, incorporating pre-game Vegas line. |
| `home_wp` | `number` | Estimated win probability for the home team. |
| `away_wp` | `number` | Estimated win probability for the away team. |
| `def_wp` | `number` | Estimated win probability for the defteam. |
| `vegas_home_wpa` | `number` | Win probability added (WPA) for the home team: spread_adjusted model. |
| `vegas_wpa` | `number` | Win probability added (WPA) for the posteam: spread_adjusted model. |
| `wpa` | `number` | Win probability added (WPA) for the posteam. |
| `total_home_rush_wpa` | `number` | Cumulative total rushing WPA for the home team in the game so far. |
| `total_away_rush_wpa` | `number` | Cumulative total rushing WPA for the away team in the game so far. |
| `total_home_pass_wpa` | `number` | Cumulative total passing WPA for the home team in the game so far. |
| `total_away_pass_wpa` | `number` | Cumulative total passing WPA for the away team in the game so far. |
| `air_wpa` | `number` | WPA through the air (same logic as air_epa). |
| `yac_wpa` | `number` | WPA from yards after the catch (same logic as yac_epa). |
| `comp_air_wpa` | `number` | The air_wpa for completions only. |
| `comp_yac_wpa` | `number` | The yac_wpa for completions only. |
| `total_home_comp_air_wpa` | `number` | Cumulative total completions air WPA for the home team in the game so far. |
| `total_away_comp_air_wpa` | `number` | Cumulative total completions air WPA for the away team in the game so far. |
| `total_home_comp_yac_wpa` | `number` | Cumulative total completions yac WPA for the home team in the game so far. |
| `total_away_comp_yac_wpa` | `number` | Cumulative total completions yac WPA for the away team in the game so far. |
| `total_home_raw_air_wpa` | `number` | Cumulative total raw air WPA for the home team in the game so far. |
| `total_away_raw_air_wpa` | `number` | Cumulative total raw air WPA for the away team in the game so far. |
| `total_home_raw_yac_wpa` | `number` | Cumulative total raw yac WPA for the home team in the game so far. |
| `total_away_raw_yac_wpa` | `number` | Cumulative total raw yac WPA for the away team in the game so far. |
| `cp` | `number` | Numeric value indicating the probability for a complete pass based on comparable game situations. |
| `cpoe` | `number` | For a single pass play this is 1 - cp when the pass was completed or 0 - cp when the pass was incomplete. Analyzed for a whole game or season an indicator for the passer how much over or under expectation his completion percentage was. |
| `xpass` | `number` | Probability of dropback scaled from 0 to 1. |
| `pass_oe` | `number` | Dropback percent over expected on a given play scaled from 0 to 100. |
| `xyac_epa` | `number` | Expected value of EPA gained after the catch, starting from where the catch was made. Zero yards after the catch would be listed as zero EPA. |
| `xyac_mean_yardage` | `number` | Average expected yards after the catch based on where the ball was caught. |
| `xyac_median_yardage` | `number` | Median expected yards after the catch based on where the ball was caught. |
| `xyac_success` | `number` | Probability play earns positive EPA (relative to where play started) based on where ball was caught. |
| `xyac_fd` | `number` | Probability play earns a first down based on where the ball was caught. |
| `qbr_epa` | `number` | EPA input used by the QBR calculation for the play (clipped at -5). |
| `weight` | `number` | Official weight, in pounds |
| `non_fumble_sack` | `boolean` | Whether the play was a sack that did not involve a fumble. |
| `sack_epa` | `number` | EPA credited to the play's sack component (clipped at -5). |
| `pass_epa` | `number` | EPA credited to the play's passing component (clipped at -5). |
| `rush_epa` | `number` | EPA credited to the play's rushing component (clipped at -5). |
| `pen_epa` | `number` | EPA credited to the play's penalty component (clipped at -5). |
| `sack_weight` | `number` | Weight applied to the paired EPA term when aggregating (observed 0.6, 0.9, 1.0). |
| `pass_weight` | `number` | Weight applied to the paired EPA term when aggregating (observed 0.6, 0.9, 1.0). |
| `rush_weight` | `number` | Weight applied to the paired EPA term when aggregating (observed 0.6, 0.9, 1.0). |
| `pen_weight` | `number` | Weight applied to the paired EPA term when aggregating (observed 0.6, 0.9, 1.0). |
| `action_play` | `boolean` | Whether the row is an action play -- a live-ball play rather than a timeout, penalty-only or administrative row. |
| `home_opening_kickoff` | `number` | 1 if the home team received the opening kickoff, 0 otherwise. |
| `go_wp` | `number` | Probability-weighted win probability of going for it on fourth down, first_down_prob * wp_succeed + (1 - first_down_prob) * wp_fail. |
| `first_down_prob` | `number` | Modeled probability of converting the fourth down if the offense goes for it. |
| `wp_succeed` | `number` | Mean win probability across the conversion outcomes, i.e. the WP conditional on converting the fourth down. |
| `wp_fail` | `number` | Mean win probability across the failure outcomes, i.e. the WP conditional on failing to convert. |
| `fg_make_prob` | `number` |  |
| `make_fg_wp` | `number` | Win probability conditional on the field-goal attempt being good. |
| `miss_fg_wp` | `number` | Win probability conditional on the field-goal attempt being missed (opponent takes over at the spot). |
| `fg_wp` | `number` | Probability-weighted win probability of attempting the field goal, from the kicking team's perspective. |
| `punt_wp` | `number` | Probability-weighted win probability of punting, integrated over the modeled punt-landing distribution. |
| `go_boost` | `number` | nfl4th's headline number: 100 * (go_wp - max(fg_wp, punt_wp)), in win-probability percentage points. Positive means going for it is the higher-WP choice. |
| `go_wp_diff` | `number` | go_wp minus the best available option's WP, in win-probability units. 0 when going for it is the recommendation and \<= 0 otherwise. |
| `punt_wp_diff` | `number` | punt_wp minus the best available option's WP, in win-probability units. 0 when punting is the recommendation and \<= 0 otherwise. |
| `fg_wp_diff` | `number` | fg_wp minus the best available option's WP, in win-probability units. 0 when kicking is the recommendation and \<= 0 otherwise. |
| `fourth_down_recommendation` | `string` | The max-WP choice among go / punt / field_goal for the fourth-down state; null when the fourth-down or WP models are unavailable. |

## `loadNflRatingsWeekly`

Release: [nfl_ratings_weekly](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_ratings_weekly) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_ratings_weekly/nfl_ratings_weekly_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1999); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflRatingsWeekly({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_ratings_weekly(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflRatingsWeeklyRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `team_id` | `string` |  |
| `adj_off_epa` | `number` | Opponent-adjusted offensive EPA per play for the team as of this week. |
| `adj_def_epa` | `number` | Opponent-adjusted defensive EPA per play for the team as of this week (negative is better for the defense). |
| `adj_st_epa` | `number` | Opponent-adjusted special-teams EPA per play for the team as of this week. |
| `adj_net` | `number` | Opponent-adjusted net EPA per play -- the team's offensive rating less its defensive rating. |
| `games` | `number \| bigint` | Games the team played in the fitted window: those with a gameday strictly before as_of_week's first kickoff, the only games the rating for that week saw. |
| `off_rank` | `number \| bigint` | Team's rank (1-32) on adjusted offensive EPA as of this week. |
| `def_rank` | `number \| bigint` | Team's rank (1-32) on adjusted defensive EPA as of this week. |
| `net_rank` | `number \| bigint` | Team's rank (1-32) on adjusted net EPA as of this week. |
| `net_z` | `number` | Adjusted net rating expressed as a z-score across the league that week. |
| `as_of_week` | `number` | Week through which the rating was computed; the row is the team's standing at that point in the season. |

## `loadNflNgs`

Release: [nfl_ngs_passing](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_ngs_passing) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_ngs_passing/ngs_passing_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2009); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflNgs({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_ngs(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflNgsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `season_type` | `string` | REG or POST indicating if the timeframe belongs to regular or post season. |
| `week` | `number \| bigint` | Season week. |
| `scope` | `string` | Aggregation scope of the row -- "season" for the season-to-date aggregate (always week 0) or "week" for a single week's statboard (week 0 is preseason week 0). |
| `threshold` | `number \| bigint` | Minimum-attempts qualifying threshold NGS applied to the statboard the row came from (differs between weekly and season scopes). |
| `games_played` | `number \| bigint` |  |
| `player_name` | `string` | Full name of player |
| `position` | `string` | Primary position as reported by NFL.com |
| `team_id` | `string` |  |
| `player_gsis_id` | `string` | Unique identifier of the player |
| `player_display_name` | `string` | Full name of the player |
| `player_short_name` | `string` | Short version of player's name |
| `player_esb_id` | `string` | NFL Elias Sports Bureau (ESB) player id, a letter-digit key such as "MAH047439" shared across NFL data products. |
| `player_position_group` | `string` | Roster position group the player is listed under (e.g. "QB", "WR", "RB"). |
| `player_position` | `string` | Position of the player accordinng to NGS |
| `player_jersey_number` | `number \| bigint` | Player's jersey number |
| `player_current_team_id` | `string` |  |
| `player_season` | `number \| bigint` | Season the embedded player record was resolved against; mirrors season. |
| `player_gsis_it_id` | `string` | Integer NFL GSIS "IT" player id used by the league's internal tracking systems; a second id alongside the string player_gsis_id. |
| `player_smart_id` | `string` | NFL "smart id", a UUID-style player identifier shared across NFL data products. |
| `player_first_name` | `string` | Player's first name |
| `player_last_name` | `string` | Player's last name |
| `player_football_name` | `string` | Name the player goes by on the field and in broadcasts (e.g. "Patrick"), which can differ from the legal first name. |
| `player_ngs_position` | `string` | Position as classified by the Next Gen Stats tracking model, which can differ from the roster position. |
| `player_ngs_position_group` | `string` | Position group the Next Gen Stats tracking model assigns the player to (e.g. "QB", "WR"). |
| `player_uniform_number` | `string` | Jersey number as the zero-padded string NGS lists it (e.g. "07"). |
| `player_status` | `string` | Roster status code of the player at capture time (e.g. "ACT" active, "RES" reserve, "CUT", "DEV" practice squad). |
| `player_headshot` | `string` |  |
| `attempts` | `number \| bigint` | The number of pass attempts as defined by the NFL. |
| `completions` | `number \| bigint` | The number of completed passes. |
| `interceptions` | `number \| bigint` | The number of interceptions thrown. |
| `completion_percentage` | `number` | Percentage of completed passes |
| `expected_completion_percentage` | `number` | Using a passer's Completion Probability on every play, determine what a passer's completion percentage is expected to be. |
| `completion_percentage_above_expectation` | `number` | A passer's actual completion percentage compared to their Expected Completion Percentage. |
| `pass_yards` | `number \| bigint` | Number of yards gained on pass plays |
| `pass_touchdowns` | `number \| bigint` | Number of touchdowns scored on pass plays |
| `passer_rating` | `number` | Overall NFL passer rating |
| `avg_time_to_throw` | `number` | Average time elapsed from the time of snap to throw on every pass attempt for a passer (sacks excluded). |
| `avg_intended_air_yards` | `number` | Average air yards on all attempted passes |
| `avg_completed_air_yards` | `number` | Average air yards on completed passes |
| `avg_air_yards_differential` | `number` | Air Yards Differential is calculated by subtracting the passer's average Intended Air Yards from his average Completed Air Yards. This stat indicates if he is on average attempting deep passes than he on average completes. |
| `avg_air_distance` | `number` | A receiver's average depth of target |
| `max_air_distance` | `number` | A receiver's maximum depth of target |
| `max_completed_air_distance` | `number` | Air Distance is the amount of yards the ball has traveled on a pass, from the point of release to the point of reception (as the crow flies). Unlike Air Yards, Air Distance measures the actual distance the passer throws the ball. |
| `avg_air_yards_to_sticks` | `number` | Air Yards to the Sticks shows the amount of Air Yards ahead or behind the first down marker on all attempts for a passer. The metric indicates if the passer is attempting his passes past the 1st down marker, or if he is relying on his skill position players to make yards after catch. |
| `aggressiveness` | `number` | Aggressiveness tracks the amount of passing attempts a quarterback makes that are into tight coverage, where there is a defender within 1 yard or less of the receiver at the time of completion or incompletion. AGG is shown as a % of attempts into tight windows over all passing attempts. |
| `player_season_type` | `string` | Season type (PRE, REG, POST) of the embedded player record; mirrors season_type. |
| `player_week` | `number \| bigint` | Week of the embedded player record; mirrors week. |

## `loadNflRosters`

Release: [rosters](https://github.com/nflverse/nflverse-data/releases/tag/rosters) · asset `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1920); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | NFL season (year) the roster entry applies to. |
| `team` | `string` | Team abbreviation in the nflverse standard (relocations folded, e.g. 'OAK' -\> 'LV', 'SD' -\> 'LAC', 'STL' -\> 'LA'). |
| `position` | `string` | Position the player is listed at on the roster (e.g. 'QB', 'WR', 'CB'). |
| `depth_chart_position` | `string` | Fine-grained depth-chart position label, which may differ from the broader position group. |
| `jersey_number` | `number` | Uniform (jersey) number the player wears. |
| `status` | `string` | Roster status code for the player (e.g. 'ACT' active, 'INA' inactive, 'RES' reserve/injured). |
| `full_name` | `string` | Player's full display name. |
| `first_name` | `string` | Player's first (given) name. |
| `last_name` | `string` | Player's last (family) name. |
| `birth_date` | `Date` | Player's date of birth (YYYY-MM-DD). |
| `height` | `number` | Player's height in inches. |
| `weight` | `number` | Player's listed weight in pounds. |
| `college` | `string` | College or university the player attended. |
| `gsis_id` | `string` | NFL GSIS player identifier — the canonical nflverse player key used to join across datasets. |
| `espn_id` | `string` | ESPN player identifier for cross-system joins. |
| `sportradar_id` | `string` | Sportradar player identifier for cross-system joins. |
| `yahoo_id` | `string` | Yahoo Sports player identifier for cross-system joins. |
| `rotowire_id` | `string` | RotoWire player identifier for cross-system joins. |
| `pff_id` | `string` | Pro Football Focus (PFF) player identifier for cross-system joins. |
| `pfr_id` | `string` | Pro Football Reference (PFR) player identifier for cross-system joins. |
| `fantasy_data_id` | `string` | FantasyData player identifier for cross-system joins. |
| `sleeper_id` | `string` | Sleeper player identifier for cross-system joins. |
| `years_exp` | `number` | Number of accrued NFL seasons of experience for the player. |
| `headshot_url` | `string` | URL of the player's headshot image. |
| `ngs_position` | `string` | Player's position as classified by NFL Next Gen Stats. |
| `week` | `number` | Week of the season the roster snapshot applies to (weekly rosters only). |
| `game_type` | `string` | Type of game the roster snapshot applies to (e.g. 'REG', 'POST'). |
| `status_description_abbr` | `string` | Abbreviated roster status description code from the source feed. |
| `football_name` | `string` | Player's preferred football (commonly used) first name. |
| `esb_id` | `string` | Elias Sports Bureau (ESB) player identifier used for official NFL record-keeping. |
| `gsis_it_id` | `string` | NFL GSIS internal tracking identifier for the player. |
| `smart_id` | `string` | NFL SMART player identifier (GUID) used across modern NFL data feeds. |
| `entry_year` | `number` | Calendar year the player first entered the NFL. |
| `rookie_year` | `number` | Calendar year of the player's rookie season. |
| `draft_club` | `string` | Team abbreviation of the club that drafted the player. |
| `draft_number` | `number` | Overall pick number at which the player was selected in the NFL draft. |

## `loadNflWeeklyRosters`

Release: [weekly_rosters](https://github.com/nflverse/nflverse-data/releases/tag/weekly_rosters) · asset `https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflWeeklyRosters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_weekly_rosters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflWeeklyRostersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | NFL season (year) the weekly roster snapshot applies to. |
| `team` | `string` | Team abbreviation in the nflverse standard (relocations folded, e.g. 'OAK' -\> 'LV', 'SD' -\> 'LAC', 'STL' -\> 'LA'). |
| `position` | `string` | Position the player is listed at on the roster (e.g. 'QB', 'WR', 'CB'). |
| `depth_chart_position` | `string` | Fine-grained depth-chart position label, which may differ from the broader position group. |
| `jersey_number` | `number` | Uniform (jersey) number the player wears. |
| `status` | `string` | Roster status code for the player (e.g. 'ACT' active, 'INA' inactive, 'RES' reserve/injured). |
| `full_name` | `string` | Player's full display name. |
| `first_name` | `string` | Player's first (given) name. |
| `last_name` | `string` | Player's last (family) name. |
| `birth_date` | `Date` | Player's date of birth (YYYY-MM-DD). |
| `height` | `number` | Player's height in inches. |
| `weight` | `number` | Player's listed weight in pounds. |
| `college` | `string` | College or university the player attended. |
| `gsis_id` | `string` | NFL GSIS player identifier — the canonical nflverse player key used to join across datasets. |
| `espn_id` | `string` | ESPN player identifier for cross-system joins. |
| `sportradar_id` | `string` | Sportradar player identifier for cross-system joins. |
| `yahoo_id` | `string` | Yahoo Sports player identifier for cross-system joins. |
| `rotowire_id` | `string` | RotoWire player identifier for cross-system joins. |
| `pff_id` | `string` | Pro Football Focus (PFF) player identifier for cross-system joins. |
| `pfr_id` | `string` | Pro Football Reference (PFR) player identifier for cross-system joins. |
| `fantasy_data_id` | `string` | FantasyData player identifier for cross-system joins. |
| `sleeper_id` | `string` | Sleeper player identifier for cross-system joins. |
| `years_exp` | `number` | Number of accrued NFL seasons of experience for the player. |
| `headshot_url` | `string` | URL of the player's headshot image. |
| `ngs_position` | `string` | Player's position as classified by NFL Next Gen Stats. |
| `week` | `number` | Week of the season the weekly roster snapshot applies to. |
| `game_type` | `string` | Type of game the weekly roster snapshot applies to (e.g. 'REG', 'POST'). |
| `status_description_abbr` | `string` | Abbreviated roster status description code from the source feed. |
| `football_name` | `string` | Player's preferred football (commonly used) first name. |
| `esb_id` | `string` | Elias Sports Bureau (ESB) player identifier used for official NFL record-keeping. |
| `gsis_it_id` | `string` | NFL GSIS internal tracking identifier for the player. |
| `smart_id` | `string` | NFL SMART player identifier (GUID) used across modern NFL data feeds. |
| `entry_year` | `number` | Calendar year the player first entered the NFL. |
| `rookie_year` | `number` | Calendar year of the player's rookie season. |
| `draft_club` | `string` | Team abbreviation of the club that drafted the player. |
| `draft_number` | `number` | Overall pick number at which the player was selected in the NFL draft. |

## `loadNflDepthCharts`

Release: [depth_charts](https://github.com/nflverse/nflverse-data/releases/tag/depth_charts) · asset `https://github.com/nflverse/nflverse-data/releases/download/depth_charts/depth_charts_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2001); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflDepthCharts({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_depth_charts(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflDepthChartsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `dt` | `string` | The timestamp (ISO8601-formatted text) indicating when the data record was loaded. Can be used to assign the data set to a specific point in time during the season. |
| `team` | `string` | NFL team. Uses official abbreviations as per NFL.com |
| `player_name` | `string` | Full name of player |
| `espn_id` | `string` | ESPN ID - usual format is an integer with ~5 digits |
| `gsis_id` | `string` | Game Stats and Info Service ID: the primary ID for play-by-play data. |
| `pos_grp_id` | `string` | Player position group identifier |
| `pos_grp` | `string` | Player position group: formation of offense, defense, or special teams |
| `pos_id` | `string` | Player position identifier |
| `pos_name` | `string` | Player position name |
| `pos_abb` | `string` | Player position abbreviation |
| `pos_slot` | `number` | A number assigned to each position in a formation |
| `pos_rank` | `number` | Player's rank on depth chart grouped by pos_slot |

## `loadNflInjuries`

Release: [injuries](https://github.com/nflverse/nflverse-data/releases/tag/injuries) · asset `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2009); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflInjuries({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_injuries(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflInjuriesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `season_type` | `string` | REG or POST indicating if the timeframe belongs to regular or post season. |
| `game_type` | `string` | The most recent game type of that season that a player appeared on the roster. |
| `team` | `string` | NFL team. Uses official abbreviations as per NFL.com |
| `week` | `number` | Season week. |
| `gsis_id` | `string` | Game Stats and Info Service ID: the primary ID for play-by-play data. |
| `position` | `string` | Primary position as reported by NFL.com |
| `full_name` | `string` | Full name as per NFL.com |
| `first_name` | `string` | First name of player |
| `last_name` | `string` | Last name of player |
| `report_primary_injury` | `string` | Primary injury listed on official injury report |
| `report_secondary_injury` | `string` | Secondary injury listed on official injury report |
| `report_status` | `string` | Player's status for game on official injury report |
| `practice_primary_injury` | `string` | Primary injury listed on practice injury report |
| `practice_secondary_injury` | `string` | Secondary injury listed on practice injury report |
| `practice_status` | `string` | Player's participation in practice |

## `loadNflSnapCounts`

Release: [snap_counts](https://github.com/nflverse/nflverse-data/releases/tag/snap_counts) · asset `https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2012); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflSnapCounts({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_snap_counts(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflSnapCountsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `game_id` | `string` | Ten digit identifier for NFL game. |
| `pfr_game_id` | `string` | PFR game ID |
| `season` | `number` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `game_type` | `string` | The most recent game type of that season that a player appeared on the roster. |
| `week` | `number` | Season week. |
| `player` | `string` | Player name |
| `pfr_player_id` | `string` | ID from Pro Football Reference |
| `position` | `string` | Primary position as reported by NFL.com |
| `team` | `string` | NFL team. Uses official abbreviations as per NFL.com |
| `opponent` | `string` | Opposing team of player |
| `offense_snaps` | `number` | Number of snaps on offense |
| `offense_pct` | `number` | Percent of offensive snaps taken |
| `defense_snaps` | `number` | Number of snaps on defense |
| `defense_pct` | `number` | Percent of defensive snaps taken |
| `st_snaps` | `number` | Number of snaps on special teams |
| `st_pct` | `number` | Percent of special teams snaps taken |

## `loadNflPbpParticipation`

Release: [pbp_participation](https://github.com/nflverse/nflverse-data/releases/tag/pbp_participation) · asset `https://github.com/nflverse/nflverse-data/releases/download/pbp_participation/pbp_participation_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2016); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflPbpParticipation({ seasons: 2024, columns: ['nflverse_game_id', 'play_id', 'offense_formation', 'defenders_in_box'] });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_pbp_participation(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflPbpParticipationRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `nflverse_game_id` | `string` | nflverse identifier for games. Format is season, week, away_team, home_team |
| `old_game_id` | `string` | Legacy NFL game ID. |
| `play_id` | `string \| number` | Numeric play id that when used with game_id and drive provides the unique identifier for a single play. |
| `possession_team` | `string` | String abbreviation for the team with possession. |
| `offense_formation` | `string` | Formation the offense lines up in to snap the ball. |
| `offense_personnel` | `string` | The positions of the offensive personnel lined up on the field for a play. |
| `defenders_in_box` | `number` | Number of defensive players lined up in the box at the snap. |
| `defense_personnel` | `string` | The positions of the defensive personnel lined up on the field for a play. |
| `number_of_pass_rushers` | `number` | Number of defensive player who rushed the passer. |
| `players_on_play` | `string` | A list of every player on the field for the play, by gsis_id |
| `offense_players` | `string` | A list of every offensive player on the field for the play, by gsis_id |
| `defense_players` | `string` | A list of every defensive player on the field for the play, by gsis_id |
| `n_offense` | `number` | Number of offensive players on the field for the play |
| `n_defense` | `number` | Number of defensive players on the field for the play |
| `ngs_air_yards` | `number` | Legacy column. For 2023 and prior years, reflects the distance (in yards) that the ball traveled in the air on a given passing play as tracked by NGS. Is NA for 2024 on--we advise instead using the air_yards column from nflreadr::load_pbp() moving forward. |
| `time_to_throw` | `number` | Duration (in seconds) between the time of the ball being snapped and the time of release of a pass attempt |
| `was_pressure` | `boolean` | A boolean indicating whether or not the QB was pressured on a play |
| `route` | `string` | A string indicating the route the primary receiver on a play took. Has the following possible values: "CORNER", "DEEP OUT", "GO", "HITCH/CURL", "IN/DIG", "POST", "QUICK OUT", "SCREEN", "SHALLOW CROSS/DRAG", "SLANT", "SWING", "TEXAS/ANGLE", "WHEEL". |
| `defense_man_zone_type` | `string` | A string indicating whether the defense was in man or zone coverage on a play |
| `defense_coverage_type` | `string` | A string indicating what type of cover the defense was in on a play. Has one of the following values: "COVER_0", "COVER_1", "COVER_2", "2_MAN", "COVER_3", "COVER_4", "COVER_6", "COVER_9", "COMBO", "BLOWN". |
| `offense_names` | `string` | A string listing all of the names of offensive players in the order of their gsis_ids in offense_players. |
| `defense_names` | `string` | A string listing all of the names of defensive players in the order of their gsis_ids in defense_players. |
| `offense_positions` | `string` | A string listing all of the positions of offensive players in the order of their gsis_ids in offense_players. |
| `defense_positions` | `string` | A string listing all of the positions of defensive players in the order of their gsis_ids in defense_players. |
| `offense_numbers` | `string` | A string listing all of the numbers of offensive players in the order of their gsis_ids in offense_players. |
| `defense_numbers` | `string` | A string listing all of the numbers of defensive players in the order of their gsis_ids in defense_players. |

## `loadNflFtnCharting`

Release: [ftn_charting](https://github.com/nflverse/nflverse-data/releases/tag/ftn_charting) · asset `https://github.com/nflverse/nflverse-data/releases/download/ftn_charting/ftn_charting_{season}.parquet`

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2022); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflFtnCharting({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_ftn_charting(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflFtnChartingRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `ftn_game_id` | `string` | FTN game ID |
| `nflverse_game_id` | `string` | nflverse identifier for games. Format is season, week, away_team, home_team |
| `season` | `number` | 4 digit number indicating to which season(s) the specified timeframe belongs to. |
| `week` | `number` | Season week. |
| `ftn_play_id` | `string` | FTN play ID |
| `nflverse_play_id` | `string` | Play ID used by nflverse, corresponds to GSIS play ID |
| `starting_hash` | `string` | hash the ball was place(L = left, M = middle, R = right) |
| `qb_location` | `string` | pre-snap position of quarterback(U = under center, S = shotgun, P = pistol) |
| `n_offense_backfield` | `number` | number of players in the backfield at the snap |
| `n_defense_box` | `number` | Number of defenders aligned in the box at the time of the snap, as charted by FTN Data. |
| `is_no_huddle` | `boolean` | no huddle |
| `is_motion` | `boolean` | motion occurred on the play before or at the time of the snap |
| `is_play_action` | `boolean` | play-action pass |
| `is_screen_pass` | `boolean` | screen pass |
| `is_rpo` | `boolean` | play is considered run-pass option |
| `is_trick_play` | `boolean` | trick play |
| `is_qb_out_of_pocket` | `boolean` | quarterback moved out of pocket |
| `is_interception_worthy` | `boolean` | interception worthy pass |
| `is_throw_away` | `boolean` | quarterback thrown away |
| `read_thrown` | `string` | read the ball was thrown |
| `is_catchable_ball` | `boolean` | catchable ball(defined by throws that are generally on target that are not defended away) |
| `is_contested_ball` | `boolean` | contested ball(defined by whether or not the receiver is facing physical contact at the time of the catch) |
| `is_created_reception` | `boolean` | created reception(defined by a reception that only occurs due to an exceptional play by the receiver) |
| `is_drop` | `boolean` | receiver drop |
| `is_qb_sneak` | `boolean` | quarterback sneak |
| `n_blitzers` | `number` | number of blitzers |
| `n_pass_rushers` | `number` | number of pass rushers |
| `is_qb_fault_sack` | `boolean` | sack that is the fault of the quarterback |
| `date_pulled` | `Date` | Date the data was retrieved from the FTN Data API by nflverse jobs |

## `loadNflUsagePlayers`

Release: [espn_nfl_usage_players](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_players) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_players/usage_players_{season}.parquet`

:::caution[Coverage]
2005 has no asset: ESPN's 2005 NFL feed carries no play text, so no usage rows exist for it. position_group is null before 2014, when the feed starts carrying participant positions. A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsagePlayers({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_players(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsagePlayersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the possession team (offense); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the possession team (offense), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `position_group` | `string` | Position group of the player (QB, RB, WR, TE, OL, DL, LB, DB, K, P, ...) resolved from the play participants' ESPN position ids; null when no participant row carried a position for the player; the season row carries his most frequent non-null group, so a game with no group does not split his season. |
| `rushes` | `number \| bigint` | Rushing attempts on which the player was the rusher, on standing scrimmage plays (plays nullified by penalty are excluded). |
| `targets` | `number \| bigint` | Pass targets on which the player was the receiver, complete or not, on standing scrimmage plays. |
| `receptions` | `number \| bigint` | Targets the player caught (completed passes). |
| `touches` | `number \| bigint` | Rushes plus receptions. |
| `opportunities` | `number \| bigint` | Rushes plus targets -- the denominator of the per-opportunity rates. |
| `rush_yards` | `number` | Yards gained on the player's rushes (yds_rushed, falling back to the play's statYardage). |
| `receiving_yards` | `number` | Yards gained on the player's receptions (yds_receiving, falling back to statYardage); an incomplete target adds 0. |
| `first_downs` | `number \| bigint` | Rushes and targets of the player that created a first down (first_down_created). |
| `touchdowns` | `number \| bigint` | Rushes and targets of the player that scored an offensive touchdown. |
| `fd_or_td` | `number \| bigint` | Rushes and targets of the player that produced a first down or an offensive touchdown (a play counts once even when both flags are set). |
| `explosive_plays` | `number \| bigint` | Rushes and targets of the player flagged EPA_explosive on the play-by-play. |
| `successful_plays` | `number \| bigint` | Rushes and targets of the player flagged EPA_success (positive EPA) on the play-by-play. |
| `epa` | `number` | Play EPA summed over the player's rushes and targets. |
| `rz_rushes` | `number \| bigint` | Rushes by the player snapped in the red zone (rz_play: 20 or fewer yards to the end zone at the snap). |
| `rz_targets` | `number \| bigint` | Targets of the player snapped in the red zone. |
| `rz_touches` | `number \| bigint` | Touches (rushes plus receptions) by the player snapped in the red zone. |
| `rz_touchdowns` | `number \| bigint` | Red-zone rushes and targets of the player that scored an offensive touchdown. |
| `so_rushes` | `number \| bigint` | Rushes by the player snapped in scoring-opportunity territory (scoring_opp: 40 or fewer yards to the end zone at the snap). |
| `so_targets` | `number \| bigint` | Targets of the player snapped in scoring-opportunity territory. |
| `so_touches` | `number \| bigint` | Touches (rushes plus receptions) by the player snapped in scoring-opportunity territory. |
| `so_touchdowns` | `number \| bigint` | Scoring-opportunity rushes and targets of the player that scored an offensive touchdown. |
| `third_down_opportunities` | `number \| bigint` | Rushes and targets of the player that came on third down. |
| `third_down_conversions` | `number \| bigint` | Third-down rushes and targets of the player that converted (a first down or an offensive touchdown). |
| `third_down_expected` | `number` | Expected third-down conversions for the player: the league's bundled third-down yards-to-go conversion curve summed over the third-down opportunities; null when no curve was available. |
| `team_targets` | `number \| bigint` | The team's targets over the same games, counting every standing scrimmage target whether or not a receiver was attributed -- the denominator of target_share. |
| `team_first_downs` | `number \| bigint` | The team's first downs created on standing scrimmage plays over the same games -- the denominator of first_down_share. |
| `team_touches` | `number \| bigint` | The team's rushes plus completions over the same games -- the denominator of touch_share. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `fd_td_rate` | `number` | fd_or_td / opportunities: the share of opportunities that produced a first down or an offensive touchdown; null with no opportunities. |
| `explosive_rate` | `number` | explosive_plays / opportunities; null with no opportunities. |
| `success_rate` | `number` | successful_plays / opportunities; null with no opportunities. |
| `epa_per_opportunity` | `number` | epa / opportunities; null with no opportunities. |
| `rz_touchdown_rate` | `number` | rz_touchdowns / rz_touches; null with no red-zone touches. |
| `so_touchdown_rate` | `number` | so_touchdowns / so_touches; null with no scoring-opportunity touches. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities; null with no third downs. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `target_share` | `number` | targets / team_targets: the player's share of the team's targets over the same games. |
| `first_down_share` | `number` | first_downs / team_first_downs: the player's share of the team's first downs. |
| `touch_share` | `number` | touches / team_touches: the player's share of the team's touches. |

## `loadNflUsagePositionGroups`

Release: [espn_nfl_usage_position_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_position_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_position_groups/usage_position_groups_{season}.parquet`

:::caution[Coverage]
Built from ESPN play participants, which the NFL feed carries from 2014; earlier seasons have no asset (NoDataError).
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsagePositionGroups({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_position_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsagePositionGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the possession team (offense); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the possession team (offense), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `position_group` | `string` | Position group of the player (QB, RB, WR, TE, OL, DL, LB, DB, K, P, ...) resolved from the play participants' ESPN position ids; null when no participant row carried a position for the player. |
| `rushes` | `number \| bigint` | Rushing attempts on which the position group was the rusher, on standing scrimmage plays (plays nullified by penalty are excluded). |
| `targets` | `number \| bigint` | Pass targets on which the position group was the receiver, complete or not, on standing scrimmage plays. |
| `receptions` | `number \| bigint` | Targets the position group caught (completed passes). |
| `touches` | `number \| bigint` | Rushes plus receptions. |
| `opportunities` | `number \| bigint` | Rushes plus targets -- the denominator of the per-opportunity rates. |
| `rush_yards` | `number` | Yards gained on the position group's rushes (yds_rushed, falling back to the play's statYardage). |
| `receiving_yards` | `number` | Yards gained on the position group's receptions (yds_receiving, falling back to statYardage); an incomplete target adds 0. |
| `first_downs` | `number \| bigint` | Rushes and targets of the position group that created a first down (first_down_created). |
| `touchdowns` | `number \| bigint` | Rushes and targets of the position group that scored an offensive touchdown. |
| `fd_or_td` | `number \| bigint` | Rushes and targets of the position group that produced a first down or an offensive touchdown (a play counts once even when both flags are set). |
| `explosive_plays` | `number \| bigint` | Rushes and targets of the position group flagged EPA_explosive on the play-by-play. |
| `successful_plays` | `number \| bigint` | Rushes and targets of the position group flagged EPA_success (positive EPA) on the play-by-play. |
| `epa` | `number` | Play EPA summed over the position group's rushes and targets. |
| `rz_rushes` | `number \| bigint` | Rushes by the position group snapped in the red zone (rz_play: 20 or fewer yards to the end zone at the snap). |
| `rz_targets` | `number \| bigint` | Targets of the position group snapped in the red zone. |
| `rz_touches` | `number \| bigint` | Touches (rushes plus receptions) by the position group snapped in the red zone. |
| `rz_touchdowns` | `number \| bigint` | Red-zone rushes and targets of the position group that scored an offensive touchdown. |
| `so_rushes` | `number \| bigint` | Rushes by the position group snapped in scoring-opportunity territory (scoring_opp: 40 or fewer yards to the end zone at the snap). |
| `so_targets` | `number \| bigint` | Targets of the position group snapped in scoring-opportunity territory. |
| `so_touches` | `number \| bigint` | Touches (rushes plus receptions) by the position group snapped in scoring-opportunity territory. |
| `so_touchdowns` | `number \| bigint` | Scoring-opportunity rushes and targets of the position group that scored an offensive touchdown. |
| `third_down_opportunities` | `number \| bigint` | Rushes and targets of the position group that came on third down. |
| `third_down_conversions` | `number \| bigint` | Third-down rushes and targets of the position group that converted (a first down or an offensive touchdown). |
| `third_down_expected` | `number` | Expected third-down conversions for the position group: the league's bundled third-down yards-to-go conversion curve summed over the third-down opportunities; null when no curve was available. |
| `team_targets` | `number \| bigint` | The team's targets over the same games, counting every standing scrimmage target whether or not a receiver was attributed -- the denominator of target_share. |
| `team_first_downs` | `number \| bigint` | The team's first downs created on standing scrimmage plays over the same games -- the denominator of first_down_share. |
| `team_touches` | `number \| bigint` | The team's rushes plus completions over the same games -- the denominator of touch_share. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `fd_td_rate` | `number` | fd_or_td / opportunities: the share of opportunities that produced a first down or an offensive touchdown; null with no opportunities. |
| `explosive_rate` | `number` | explosive_plays / opportunities; null with no opportunities. |
| `success_rate` | `number` | successful_plays / opportunities; null with no opportunities. |
| `epa_per_opportunity` | `number` | epa / opportunities; null with no opportunities. |
| `rz_touchdown_rate` | `number` | rz_touchdowns / rz_touches; null with no red-zone touches. |
| `so_touchdown_rate` | `number` | so_touchdowns / so_touches; null with no scoring-opportunity touches. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities; null with no third downs. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `target_share` | `number` | targets / team_targets: the position group's share of the team's targets over the same games. |
| `first_down_share` | `number` | first_downs / team_first_downs: the position group's share of the team's first downs. |
| `touch_share` | `number` | touches / team_touches: the position group's share of the team's touches. |

## `loadNflUsageTackles`

Release: [espn_nfl_usage_tackles](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_tackles) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_tackles/usage_tackles_{season}.parquet`

:::caution[Coverage]
Built from ESPN play participants (tackler / assist ids), which the NFL feed carries from 2014; earlier seasons have no asset (NoDataError).
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageTackles({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_tackles(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageTacklesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `def_pos_team_id` | `string` | ESPN team id of the play's defense (the NFL build passes no game roster, so a tackle is not moved to the tackler's own team); joins to the ESPN teams dataset on team_id. |
| `def_pos_team` | `string` | Display name of the play's defense. The NFL build passes no game roster, so every tackle stays with the play's defense, including kickoff / punt coverage tackles and tackles after a turnover. |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `position_group` | `string` | Position group of the player (QB, RB, WR, TE, OL, DL, LB, DB, K, P, ...) resolved from the play participants' ESPN position ids; null when no participant row carried a position for the player; the season row carries his most frequent non-null group, so a game with no group does not split his season. |
| `tackles` | `number \| bigint` | Solo tackles credited to the player in the play participants (tackler_player_ids). |
| `assists` | `number \| bigint` | Assisted tackles credited to the player in the play participants (assisted_by_player_ids). |
| `scrimmage_tackle_points` | `number` | tackle_points (tackles plus 0.5 times assists) earned on the defense's own standing scrimmage snaps only -- kickoff, punt and field-goal coverage, plays a penalty wiped out and tackles after a turnover are excluded; tackle_share's numerator. |
| `tackle_points` | `number` | tackles plus 0.5 times assists. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `team_tackle_points` | `number` | tackle_points summed over every player credited to the defense for the season, special-teams tackles included; tackle_share's denominator is the scrimmage-only total. |
| `team_scrimmage_tackle_points` | `number` | scrimmage_tackle_points summed over every player credited to the defense for the season; tackle_share's denominator. |
| `tackle_share` | `number` | scrimmage_tackle_points / team_scrimmage_tackle_points: the player's share of the defense's tackle points on its own standing scrimmage snaps -- kickoff, punt and field-goal coverage and plays a penalty wiped out are left out (the NFL build passes no game roster, so a tackle after a turnover stays with the play's defense and is shared); null when the defense has none. |

## `loadNflUsagePositionGroupTackles`

Release: [espn_nfl_usage_position_group_tackles](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_position_group_tackles) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_position_group_tackles/usage_position_group_tackles_{season}.parquet`

:::caution[Coverage]
Built from ESPN play participants, which the NFL feed carries from 2014; earlier seasons have no asset (NoDataError).
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsagePositionGroupTackles({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_position_group_tackles(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsagePositionGroupTacklesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `def_pos_team_id` | `string` | ESPN team id of the play's defense (the NFL build passes no game roster, so a tackle is not moved to the tackler's own team); joins to the ESPN teams dataset on team_id. |
| `def_pos_team` | `string` | Display name of the play's defense. The NFL build passes no game roster, so every tackle stays with the play's defense, including kickoff / punt coverage tackles and tackles after a turnover. |
| `position_group` | `string` | Position group of the player (QB, RB, WR, TE, OL, DL, LB, DB, K, P, ...) resolved from the play participants' ESPN position ids; null when no participant row carried a position for the player. |
| `tackles` | `number \| bigint` | Solo tackles credited to the position group in the play participants (tackler_player_ids). |
| `assists` | `number \| bigint` | Assisted tackles credited to the position group in the play participants (assisted_by_player_ids). |
| `scrimmage_tackle_points` | `number` | tackle_points (tackles plus 0.5 times assists) earned by the position group on the defense's own standing scrimmage snaps only -- kickoff, punt and field-goal coverage, plays a penalty wiped out and tackles after a turnover are excluded; tackle_share's numerator. |
| `tackle_points` | `number` | tackles plus 0.5 times assists. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `team_tackle_points` | `number` | tackle_points summed over every player credited to the defense for the season, special-teams tackles included; tackle_share's denominator is the scrimmage-only total. |
| `team_scrimmage_tackle_points` | `number` | scrimmage_tackle_points summed over every position group credited to the defense for the season; tackle_share's denominator. |
| `tackle_share` | `number` | scrimmage_tackle_points / team_scrimmage_tackle_points: the position group's share of the defense's tackle points on its own standing scrimmage snaps -- kickoff, punt and field-goal coverage and plays a penalty wiped out are left out (the NFL build passes no game roster, so a tackle after a turnover stays with the play's defense and is shared); null when the defense has none. |

## `loadNflUsageTeams`

Release: [espn_nfl_usage_teams](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_teams) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_teams/usage_teams_{season}.parquet`

:::caution[Coverage]
Published 2002-2026 (2005 is built from ESPN's play-text-less 2005 feed, so it is thin). A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageTeams({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_teams(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageTeamsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the possession team (offense); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the possession team (offense), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `plays` | `number \| bigint` | Standing scrimmage plays the offense ran (plays nullified by penalty are excluded). |
| `rushes` | `number \| bigint` | Rushing plays among the standing scrimmage plays. |
| `targets` | `number \| bigint` | Pass plays with a targeted receiver (the target flag). |
| `completions` | `number \| bigint` | Completed passes among the standing scrimmage plays. |
| `first_downs` | `number \| bigint` | Scrimmage plays that created a first down (first_down_created). |
| `touchdowns` | `number \| bigint` | Scrimmage plays that scored an offensive touchdown. |
| `explosive_plays` | `number \| bigint` | Scrimmage plays flagged EPA_explosive on the play-by-play. |
| `successful_plays` | `number \| bigint` | Scrimmage plays flagged EPA_success (positive EPA) on the play-by-play. |
| `epa` | `number` | Play EPA summed over the standing scrimmage plays. |
| `third_down_opportunities` | `number \| bigint` | Third-down scrimmage plays with a known distance. |
| `third_down_conversions` | `number \| bigint` | Third-down plays that produced a first down or an offensive touchdown. |
| `third_down_expected` | `number` | Expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `rz_plays` | `number \| bigint` | Scrimmage plays snapped in the red zone (rz_play: 20 or fewer yards to the end zone at the snap). |
| `rz_successes` | `number \| bigint` | Red-zone plays flagged EPA_success. |
| `rz_epa` | `number` | Play EPA summed over the red-zone plays. |
| `rz_touchdowns` | `number \| bigint` | Red-zone plays that scored an offensive touchdown. |
| `rz_targets` | `number \| bigint` | Red-zone pass plays with a targeted receiver. |
| `rz_rushes` | `number \| bigint` | Red-zone rushing plays. |
| `rz_trips` | `number \| bigint` | Drives with at least one red-zone play. |
| `rz_points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over the drives that reached the red zone. |
| `so_plays` | `number \| bigint` | Scrimmage plays snapped in scoring-opportunity territory (scoring_opp: 40 or fewer yards to the end zone at the snap). |
| `so_successes` | `number \| bigint` | Scoring-opportunity plays flagged EPA_success. |
| `so_epa` | `number` | Play EPA summed over the scoring-opportunity plays. |
| `so_touchdowns` | `number \| bigint` | Scoring-opportunity plays that scored an offensive touchdown. |
| `so_targets` | `number \| bigint` | Scoring-opportunity pass plays with a targeted receiver. |
| `so_rushes` | `number \| bigint` | Scoring-opportunity rushing plays. |
| `so_trips` | `number \| bigint` | Drives with at least one play snapped in scoring-opportunity territory (the opponent's 40). |
| `so_points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over the drives that reached the opponent's 40. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `success_rate` | `number` | successful_plays / plays; null with no plays. |
| `explosive_rate` | `number` | explosive_plays / plays; null with no plays. |
| `epa_per_play` | `number` | epa / plays; null with no plays. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities; null with no third downs. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `rz_touchdown_rate` | `number` | rz_touchdowns / rz_trips: touchdowns per red-zone trip; null with no trips. |
| `rz_points_per_trip` | `number` | rz_points / rz_trips; null with no trips. |
| `rz_success_rate` | `number` | rz_successes / rz_plays; null with no red-zone plays. |
| `rz_epa_per_play` | `number` | rz_epa / rz_plays; null with no red-zone plays. |
| `so_touchdown_rate` | `number` | so_touchdowns / so_trips: touchdowns per scoring-opportunity trip; null with no trips. |
| `so_points_per_trip` | `number` | so_points / so_trips; null with no trips. |
| `so_success_rate` | `number` | so_successes / so_plays; null with no scoring-opportunity plays. |
| `so_epa_per_play` | `number` | so_epa / so_plays; null with no scoring-opportunity plays. |

## `loadNflUsageDriveScripting`

Release: [espn_nfl_usage_drive_scripting](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_drive_scripting) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_drive_scripting/usage_drive_scripting_{season}.parquet`

:::caution[Coverage]
Published 2002-2026 (2005 is thin: ESPN's 2005 feed carries no play text). A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageDriveScripting({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_drive_scripting(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageDriveScriptingRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the possession team (offense); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the possession team (offense), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `script` | `string` | "scripted" for the offense's first two drives of each half, "non_scripted" for every other drive. |
| `drives` | `number \| bigint` | Drives of this script type (distinct drive.id values with at least one standing scrimmage play). |
| `plays` | `number \| bigint` | Standing scrimmage plays on those drives. |
| `epa` | `number` | Play EPA summed over those drives. |
| `successes` | `number \| bigint` | Plays flagged EPA_success on those drives. |
| `yards` | `number` | statYardage summed over the plays on those drives. |
| `points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over those drives. |
| `touchdowns` | `number \| bigint` | Drives that included an offensive touchdown play. |
| `scoring_opps` | `number \| bigint` | Drives that reached scoring-opportunity territory (a play snapped 40 or fewer yards from the end zone). |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `epa_per_play` | `number` | epa / plays; null with no plays. |
| `success_rate` | `number` | successes / plays; null with no plays. |
| `yards_per_play` | `number` | yards / plays; null with no plays. |
| `points_per_drive` | `number` | points / drives; null with no drives. |
| `touchdown_rate` | `number` | touchdowns / drives: the share of drives that scored a touchdown; null with no drives. |
| `scoring_opp_rate` | `number` | scoring_opps / drives: the share of drives that reached the opponent's 40; null with no drives. |

## `loadNflUsageStKickers`

Release: [espn_nfl_usage_st_kickers](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_kickers) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_st_kickers/usage_st_kickers_{season}.parquet`

:::caution[Coverage]
No asset for 2005-2007 (2005 has no play text upstream); a season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageStKickers({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_st_kickers(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageStKickersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the kicking team (the kicker's own team); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the kicking team (the kicker's own team), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `kickoffs` | `number \| bigint` | Kickoffs by the kicker that stood (kicks nullified by penalty are excluded). |
| `kickoff_yards` | `number` | Kickoff distance summed over the kickoffs (yds_kickoff). |
| `kickoff_touchbacks` | `number \| bigint` | Kickoffs that resulted in a touchback. |
| `kickoff_onside` | `number \| bigint` | Onside kicks attempted by the kicker. |
| `kickoff_out_of_bounds` | `number \| bigint` | Kickoffs that went out of bounds. |
| `kickoff_returns_allowed` | `number \| bigint` | Kickoffs that were returned: not a touchback, onside, out of bounds or fair catch, and with a named returner. |
| `kickoff_return_yards_allowed` | `number` | Return yards allowed on the returned kickoffs. |
| `kickoff_return_tds_allowed` | `number \| bigint` | Returned kickoffs that were taken back for a touchdown. |
| `kickoff_epa` | `number` | Play EPA summed over the kickoffs from the kicking side (the play EPA negated, because the receiving team is the possession team on a kickoff). |
| `fg_attempts` | `number \| bigint` | Field-goal attempts by the kicker that stood (attempts nullified by penalty are excluded). |
| `fg_made` | `number \| bigint` | Field goals made by the kicker. |
| `fg_blocked` | `number \| bigint` | Field-goal attempts on which a blocker was credited. |
| `fg_0_39_attempts` | `number \| bigint` | Field-goal attempts from under 40 yards. |
| `fg_0_39_made` | `number \| bigint` | Field goals made from under 40 yards. |
| `fg_40_49_attempts` | `number \| bigint` | Field-goal attempts from 40 to 49 yards. |
| `fg_40_49_made` | `number \| bigint` | Field goals made from 40 to 49 yards. |
| `fg_50_plus_attempts` | `number \| bigint` | Field-goal attempts from 50 yards or more. |
| `fg_50_plus_made` | `number \| bigint` | Field goals made from 50 yards or more. |
| `fg_epa` | `number` | Play EPA summed over the field-goal attempts. |
| `xp_attempts` | `number \| bigint` | Extra-point kick attempts by the kicker that stood. |
| `xp_made` | `number \| bigint` | Extra-point kicks made by the kicker. |
| `fg_long` | `number` | Longest field goal made, in yards (a season maximum, not a sum). |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `kickoff_avg` | `number` | kickoff_yards / kickoffs; null with no kickoffs. |
| `kickoff_touchback_rate` | `number` | kickoff_touchbacks / kickoffs; null with no kickoffs. |
| `kickoff_return_avg_allowed` | `number` | kickoff_return_yards_allowed / kickoff_returns_allowed; null with no returns allowed. |
| `fg_pct` | `number` | fg_made / fg_attempts; null with no attempts. |
| `xp_pct` | `number` | xp_made / xp_attempts; null with no attempts. |

## `loadNflUsageStPunters`

Release: [espn_nfl_usage_st_punters](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_punters) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_st_punters/usage_st_punters_{season}.parquet`

:::caution[Coverage]
No asset for 2005-2007 (2005 has no play text upstream); a season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageStPunters({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_st_punters(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageStPuntersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the punting team (the punter's own team); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the punting team (the punter's own team), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `punts` | `number \| bigint` | Punts by the punter that stood (punts nullified by penalty are excluded). |
| `punt_yards` | `number` | Gross punt distance summed over the punts (yds_punted). |
| `punt_touchbacks` | `number \| bigint` | Punts that resulted in a touchback. |
| `punt_inside_20` | `number \| bigint` | Punts that landed inside the receiving team's 20: yards to the end zone at the snap minus punt distance between 0 and 20, touchbacks excluded. |
| `punt_fair_catches` | `number \| bigint` | Punts that were fair caught. |
| `punt_downed` | `number \| bigint` | Punts downed by the coverage team. |
| `punt_out_of_bounds` | `number \| bigint` | Punts that went out of bounds. |
| `punt_blocked` | `number \| bigint` | Punts by the punter that were blocked. |
| `punt_returns_allowed` | `number \| bigint` | Punts that were returned: not a touchback, fair catch, downed, out of bounds or blocked, and with a named returner. |
| `punt_return_yards_allowed` | `number` | Return yards allowed on the returned punts. |
| `punt_return_tds_allowed` | `number \| bigint` | Returned punts that were taken back for a touchdown. |
| `punt_epa` | `number` | Play EPA summed over the punts (the punting team is the possession team on a punt, so this already reads from the punter's side). |
| `punt_long` | `number` | Longest punt, in yards (a season maximum, not a sum). |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `punt_net_yards` | `number` | punt_yards minus punt_return_yards_allowed minus 20 yards per touchback. |
| `punt_avg` | `number` | punt_yards / punts: gross punting average; null with no punts. |
| `punt_net_avg` | `number` | punt_net_yards / punts: net punting average; null with no punts. |
| `punt_inside_20_rate` | `number` | punt_inside_20 / punts; null with no punts. |
| `punt_return_avg_allowed` | `number` | punt_return_yards_allowed / punt_returns_allowed; null with no returns allowed. |

## `loadNflUsageStReturners`

Release: [espn_nfl_usage_st_returners](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_returners) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_st_returners/usage_st_returners_{season}.parquet`

:::caution[Coverage]
No asset for 2005-2007 (2005 has no play text upstream); a season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageStReturners({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_st_returners(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageStReturnersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the returning team (the returner's own team); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the returning team (the returner's own team), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `kick_returns` | `number \| bigint` | Kickoff returns by the returner (kickoffs that were neither a touchback, onside, out of bounds nor fair caught). |
| `kick_return_yards` | `number` | Kickoff return yards summed over the returns (yds_kickoff_return). |
| `kick_return_tds` | `number \| bigint` | Kickoff returns that scored a touchdown. |
| `kick_return_epa` | `number` | Play EPA summed over the kickoff returns (the returning team is the possession team on a kickoff, so this reads from the returner's side). |
| `punt_returns` | `number \| bigint` | Punt returns by the returner (punts that were neither a touchback, fair catch, downed, out of bounds nor blocked). |
| `punt_return_yards` | `number` | Punt return yards summed over the returns (yds_punt_return). |
| `punt_return_tds` | `number \| bigint` | Punt returns that scored a touchdown. |
| `punt_return_epa` | `number` | Play EPA summed over the punt returns, negated so it reads from the return team's side (the punting team is the possession team on a punt). |
| `kick_return_long` | `number` | Longest kickoff return, in yards (a season maximum, not a sum). |
| `punt_return_long` | `number` | Longest punt return, in yards (a season maximum, not a sum). |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `kick_return_avg` | `number` | kick_return_yards / kick_returns; null with no kickoff returns. |
| `punt_return_avg` | `number` | punt_return_yards / punt_returns; null with no punt returns. |

## `loadNflUsageStBlocks`

Release: [espn_nfl_usage_st_blocks](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_blocks) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_st_blocks/usage_st_blocks_{season}.parquet`

:::caution[Coverage]
Published from 2007 (no block participants earlier); a season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageStBlocks({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_st_blocks(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageStBlocksRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `def_pos_team_id` | `string` | ESPN team id of the team that made the block (the defense on the kick). |
| `def_pos_team` | `string` | Display name of the team that made the block (the defense on the kick). |
| `player_id` | `string` | ESPN athlete id of the player, as a string; null when the play-by-play named the player without an id (the row is then keyed on the name). |
| `player_name` | `string` | Player display name, as carried on the play-by-play participants; the season row carries the most frequent non-null name over his games, so a renamed player with a player_id keeps one row per team (a row with no player_id is keyed on its name, so a rename there splits it). |
| `punt_blocks` | `number \| bigint` | Punts the player blocked (credited as the punt_block_player on the play). |
| `fg_blocks` | `number \| bigint` | Field-goal attempts the player blocked (credited as the fg_block_player on the play). |
| `blocks` | `number \| bigint` | punt_blocks plus fg_blocks. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |

## `loadNflUsageStTeam`

Release: [espn_nfl_usage_st_team](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_usage_st_team) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_usage_st_team/usage_st_team_{season}.parquet`

:::caution[Coverage]
Published 2002-2026 (2005 is thin: ESPN's 2005 feed carries no play text). A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflUsageStTeam({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_usage_st_team(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflUsageStTeamRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the team (its own kicking, punting and returns, plus what it allowed); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the team (its own kicking, punting and returns, plus what it allowed), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `kickoffs` | `number \| bigint` | Kickoffs by the team that stood (kicks nullified by penalty are excluded). |
| `kickoff_touchbacks` | `number \| bigint` | The team's kickoffs that resulted in a touchback. |
| `kickoff_returns_allowed` | `number \| bigint` | Kickoffs that were returned: not a touchback, onside, out of bounds or fair catch, and with a named returner. |
| `kickoff_return_yards_allowed` | `number` | Return yards allowed on the team's returned kickoffs. |
| `kickoff_return_tds_allowed` | `number \| bigint` | The team's kickoffs that were returned for a touchdown. |
| `kickoff_epa` | `number` | Play EPA summed over the kickoffs from the kicking side (the play EPA negated, because the receiving team is the possession team on a kickoff). |
| `kick_returns` | `number \| bigint` | Kickoff returns by the team (kickoffs received that were neither a touchback, onside, out of bounds nor fair caught). |
| `kick_return_yards` | `number` | Kickoff return yards summed over the team's returns (yds_kickoff_return). |
| `kick_return_tds` | `number \| bigint` | The team's kickoff returns that scored a touchdown. |
| `kick_return_epa` | `number` | Play EPA summed over the team's kickoff returns (the returning team is the possession team on a kickoff). |
| `punts` | `number \| bigint` | Punts by the team that stood (punts nullified by penalty are excluded). |
| `punt_yards` | `number` | Gross punt distance summed over the team's punts (yds_punted). |
| `punt_touchbacks` | `number \| bigint` | The team's punts that resulted in a touchback. |
| `punts_blocked` | `number \| bigint` | The team's punts that were blocked. |
| `punt_returns_allowed` | `number \| bigint` | Punts that were returned: not a touchback, fair catch, downed, out of bounds or blocked, and with a named returner. |
| `punt_return_yards_allowed` | `number` | Return yards allowed on the team's returned punts. |
| `punt_return_tds_allowed` | `number \| bigint` | The team's punts that were returned for a touchdown. |
| `punt_epa` | `number` | Play EPA summed over the team's punts (the punting team is the possession team on a punt). |
| `punt_returns` | `number \| bigint` | Punt returns by the team (punts received that were neither a touchback, fair catch, downed, out of bounds nor blocked). |
| `punt_return_yards` | `number` | Punt return yards summed over the team's returns (yds_punt_return). |
| `punt_return_tds` | `number \| bigint` | The team's punt returns that scored a touchdown. |
| `punt_return_epa` | `number` | Play EPA summed over the team's punt returns, negated so it reads from the return team's side. |
| `fg_attempts` | `number \| bigint` | The team's field-goal attempts that stood. |
| `fg_made` | `number \| bigint` | The team's field goals made. |
| `fgs_blocked` | `number \| bigint` | The team's field-goal attempts that were blocked. |
| `fg_epa` | `number` | Play EPA summed over the team's field-goal attempts. |
| `punt_blocks_by` | `number \| bigint` | Opponent punts the team blocked. |
| `fg_blocks_by` | `number \| bigint` | Opponent field-goal attempts the team blocked. |
| `games` | `number` | Per-game rows summed into this season row -- the games in which this key appeared in the section -- so it counts games with activity, not games played. |
| `punt_net_yards` | `number` | punt_yards minus punt_return_yards_allowed minus 20 yards per touchback. |
| `kickoff_touchback_rate` | `number` | kickoff_touchbacks / kickoffs; null with no kickoffs. |
| `kickoff_return_avg_allowed` | `number` | kickoff_return_yards_allowed / kickoff_returns_allowed; null with no returns allowed. |
| `fg_pct` | `number` | fg_made / fg_attempts; null with no attempts. |
| `punt_avg` | `number` | punt_yards / punts: gross punting average; null with no punts. |
| `punt_net_avg` | `number` | punt_net_yards / punts: net punting average; null with no punts. |
| `punt_return_avg_allowed` | `number` | punt_return_yards_allowed / punt_returns_allowed; null with no returns allowed. |
| `kick_return_avg` | `number` | kick_return_yards / kick_returns; null with no kickoff returns. |
| `punt_return_avg` | `number` | punt_return_yards / punt_returns; null with no punt returns. |

## `loadNflTeamTendencies`

Release: [espn_nfl_team_tendencies](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_team_tendencies) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_team_tendencies/team_tendencies_{season}.parquet`

:::caution[Coverage]
Published 2002-2026 (2005 is thin: ESPN's 2005 feed carries no play text). A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflTeamTendencies({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_team_tendencies(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflTeamTendenciesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the team whose offense the row describes (the def_ columns are its defense); joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the team whose offense the row describes (the def_ columns are its defense), as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `games` | `number` | Distinct games in which the offense ran at least one standing scrimmage play. |
| `plays` | `number` | Standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `rushes` | `number` | Rushing plays among the standing scrimmage plays. |
| `passes` | `number` | Pass plays among the standing scrimmage plays. |
| `epa` | `number` | Play EPA summed over the standing scrimmage plays. |
| `epa_rush` | `number` | Play EPA summed over the rushing plays. |
| `epa_pass` | `number` | Play EPA summed over the pass plays. |
| `successes` | `number` | Plays flagged EPA_success (positive EPA) on the play-by-play. |
| `successes_rush` | `number` | Rushing plays flagged EPA_success. |
| `successes_pass` | `number` | Pass plays flagged EPA_success. |
| `yards` | `number` | statYardage summed over the standing scrimmage plays. |
| `yards_rush` | `number` | statYardage summed over the rushing plays. |
| `yards_pass` | `number` | statYardage summed over the pass plays. |
| `explosives` | `number` | Plays flagged EPA_explosive on the play-by-play. |
| `explosives_rush` | `number` | Rushing plays flagged EPA_explosive. |
| `explosives_pass` | `number` | Pass plays flagged EPA_explosive. |
| `third_down_opportunities` | `number` | Third-down scrimmage plays. |
| `third_down_conversions` | `number` | Third-down plays that produced a first down or an offensive touchdown. |
| `third_down_expected` | `number` | Expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `plays_neutral` | `number` | Plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `passes_neutral` | `number` | Pass plays in situation-neutral situations (see plays_neutral). |
| `epa_neutral` | `number` | Play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `successes_neutral` | `number` | Plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `plays_d1` | `number` | Plays on first down. |
| `passes_d1` | `number` | Pass plays on first down. |
| `epa_d1` | `number` | Play EPA summed over the plays on first down. |
| `successes_d1` | `number` | Plays flagged EPA_success (positive EPA) on first down. |
| `plays_d2` | `number` | Plays on second down. |
| `passes_d2` | `number` | Pass plays on second down. |
| `epa_d2` | `number` | Play EPA summed over the plays on second down. |
| `successes_d2` | `number` | Plays flagged EPA_success (positive EPA) on second down. |
| `plays_d3` | `number` | Plays on third down. |
| `passes_d3` | `number` | Pass plays on third down. |
| `epa_d3` | `number` | Play EPA summed over the plays on third down. |
| `successes_d3` | `number` | Plays flagged EPA_success (positive EPA) on third down. |
| `plays_d4` | `number` | Plays on fourth down. |
| `passes_d4` | `number` | Pass plays on fourth down. |
| `epa_d4` | `number` | Play EPA summed over the plays on fourth down. |
| `successes_d4` | `number` | Plays flagged EPA_success (positive EPA) on fourth down. |
| `plays_early_down` | `number` | Plays on first or second down. |
| `passes_early_down` | `number` | Pass plays on first or second down. |
| `epa_early_down` | `number` | Play EPA summed over the first- and second-down plays. |
| `successes_early_down` | `number` | Plays flagged EPA_success (positive EPA) on first or second down. |
| `plays_standard_down` | `number` | Plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `passes_standard_down` | `number` | Pass plays on standard downs (see plays_standard_down). |
| `epa_standard_down` | `number` | Play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `successes_standard_down` | `number` | Plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `plays_passing_down` | `number` | Plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `passes_passing_down` | `number` | Pass plays on passing downs (see plays_passing_down). |
| `epa_passing_down` | `number` | Play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `successes_passing_down` | `number` | Plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `plays_leading` | `number` | Plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_leading` | `number` | Pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_leading` | `number` | Play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_leading` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_tied` | `number` | Plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_tied` | `number` | Pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_tied` | `number` | Play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_tied` | `number` | Plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_trailing` | `number` | Plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_trailing` | `number` | Pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_trailing` | `number` | Play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_trailing` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_first_half` | `number` | Plays in the first two quarters. |
| `passes_first_half` | `number` | Pass plays in the first two quarters. |
| `epa_first_half` | `number` | Play EPA summed over the plays in the first two quarters. |
| `successes_first_half` | `number` | Plays flagged EPA_success (positive EPA) in the first two quarters. |
| `plays_second_half` | `number` | Plays in the third and fourth quarters (overtime belongs to neither half). |
| `passes_second_half` | `number` | Pass plays in the third and fourth quarters. |
| `epa_second_half` | `number` | Play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `successes_second_half` | `number` | Plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `plays_d3_short` | `number` | Plays on third down with 3 or fewer yards to go. |
| `passes_d3_short` | `number` | Pass plays on third down with 3 or fewer yards to go. |
| `epa_d3_short` | `number` | Play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `successes_d3_short` | `number` | Plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `plays_d3_medium` | `number` | Plays on third down with 4 to 6 yards to go. |
| `passes_d3_medium` | `number` | Pass plays on third down with 4 to 6 yards to go. |
| `epa_d3_medium` | `number` | Play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `successes_d3_medium` | `number` | Plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `plays_d3_long` | `number` | Plays on third down with 7 or more yards to go. |
| `passes_d3_long` | `number` | Pass plays on third down with 7 or more yards to go. |
| `epa_d3_long` | `number` | Play EPA summed over the plays on third down with 7 or more yards to go. |
| `successes_d3_long` | `number` | Plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `plays_red_zone` | `number` | Plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `passes_red_zone` | `number` | Pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `epa_red_zone` | `number` | Play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `successes_red_zone` | `number` | Plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `plays_own_half` | `number` | Plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `passes_own_half` | `number` | Pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `epa_own_half` | `number` | Play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `successes_own_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `plays_opp_half` | `number` | Plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `passes_opp_half` | `number` | Pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `epa_opp_half` | `number` | Play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `successes_opp_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `plays_one_score` | `number` | Plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_one_score` | `number` | Pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_one_score` | `number` | Play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_one_score` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_home` | `number` | Plays in the team's home games. |
| `passes_home` | `number` | Pass plays in the team's home games. |
| `epa_home` | `number` | Play EPA summed over the plays in the team's home games. |
| `successes_home` | `number` | Plays flagged EPA_success (positive EPA) in the team's home games. |
| `games_home` | `number` | Distinct home games in which the offense ran at least one standing scrimmage play. |
| `wins_home` | `number` | Of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `plays_away` | `number` | Plays in the team's away games. |
| `passes_away` | `number` | Pass plays in the team's away games. |
| `epa_away` | `number` | Play EPA summed over the plays in the team's away games. |
| `successes_away` | `number` | Plays flagged EPA_success (positive EPA) in the team's away games. |
| `games_away` | `number` | Distinct away games in which the offense ran at least one standing scrimmage play. |
| `wins_away` | `number` | Of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `plays_neutral_site` | `number` | Plays in the team's neutral-site games. |
| `passes_neutral_site` | `number` | Pass plays in the team's neutral-site games. |
| `epa_neutral_site` | `number` | Play EPA summed over the plays in the team's neutral-site games. |
| `successes_neutral_site` | `number` | Plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `games_neutral_site` | `number` | Distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `wins_neutral_site` | `number` | Of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `plays_after_bye` | `number` | Plays in the team's games played 13 or more days after the team's previous game. |
| `passes_after_bye` | `number` | Pass plays in the team's games played 13 or more days after the team's previous game. |
| `epa_after_bye` | `number` | Play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `successes_after_bye` | `number` | Plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `games_after_bye` | `number` | Distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `wins_after_bye` | `number` | Of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `plays_opener` | `number` | Plays in the team's regular-season openers. |
| `passes_opener` | `number` | Pass plays in the team's regular-season openers. |
| `epa_opener` | `number` | Play EPA summed over the plays in the team's regular-season openers. |
| `successes_opener` | `number` | Plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `games_opener` | `number` | Distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `wins_opener` | `number` | Of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `plays_one_score_game` | `number` | Plays in the team's games decided by 8 points or fewer. |
| `passes_one_score_game` | `number` | Pass plays in the team's games decided by 8 points or fewer. |
| `epa_one_score_game` | `number` | Play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `successes_one_score_game` | `number` | Plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `games_one_score_game` | `number` | Distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `wins_one_score_game` | `number` | Of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `fourth_decisions` | `number` | Fourth-down plays on which the offense ran, passed, punted or attempted a field goal and the play stood (timeouts and nullified plays are not decisions). |
| `fourth_went` | `number` | Fourth-down decisions that were a rush or a pass (the offense went for it). |
| `fourth_converted` | `number` | Fourth-down go attempts that produced a first down or an offensive touchdown. |
| `fourth_model_go` | `number` | Decisions on which the fourth-down model recommended going for it (fourth_down_recommendation == "go"). |
| `fourth_model_kick` | `number` | Decisions on which the fourth-down model recommended a punt or a field goal. |
| `fourth_went_when_go` | `number` | Decisions on which the offense went for it when the model also said go. |
| `fourth_went_when_kick` | `number` | Decisions on which the offense went for it when the model said kick. |
| `fourth_agreed` | `number` | Decisions that matched the model's recommendation (went when it said go, kicked when it said kick). |
| `fourth_wp_left` | `number` | Win probability left on the table, summed over the decisions that went against the model: go_boost when the offense kicked against a go recommendation, minus go_boost when it went against a kick recommendation, floored at zero. |
| `drives` | `number` | Offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `drives_with_clock` | `number` | Drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays), in regulation (overtime has no game clock) and owned by this offense (an ESPN drive id that holds snaps by both offenses counts once, for ESPN's drive team when it matches an offense in the drive, else the offense with the most standing snaps, the first snap breaking a tie). |
| `drive_seconds` | `number` | ESPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `drive_plays` | `number` | ESPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `drive_seconds_neutral` | `number` | ESPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `drive_plays_neutral` | `number` | ESPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `drive_points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `rz_trips` | `number` | Drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `rz_tds` | `number` | Red-zone drives that included an offensive touchdown play. |
| `rz_scores` | `number` | Red-zone drives that scored (a touchdown or a field goal). |
| `rz_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `so_trips` | `number` | Drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `so_tds` | `number` | Scoring-opportunity drives that included an offensive touchdown play. |
| `so_scores` | `number` | Scoring-opportunity drives that scored (a touchdown or a field goal). |
| `so_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `scripted_drives` | `number` | The offense's first two drives of each half. |
| `scripted_plays` | `number` | Standing scrimmage plays on the scripted drives. |
| `scripted_epa` | `number` | Play EPA summed over the scripted drives. |
| `scripted_successes` | `number` | Plays flagged EPA_success on the scripted drives. |
| `scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `non_scripted_drives` | `number` | Every drive after the offense's first two of each half. |
| `non_scripted_plays` | `number` | Standing scrimmage plays on the non-scripted drives. |
| `non_scripted_epa` | `number` | Play EPA summed over the non-scripted drives. |
| `non_scripted_successes` | `number` | Plays flagged EPA_success on the non-scripted drives. |
| `non_scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `plays_per_game` | `number` | plays / games. Null when the denominator is 0. |
| `plays_per_drive` | `number` | plays / drives. Null when the denominator is 0. |
| `drives_per_game` | `number` | drives / games. Null when the denominator is 0. |
| `sec_per_play` | `number` | drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Null when the denominator is 0. |
| `sec_per_play_neutral` | `number` | drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Null when the denominator is 0. |
| `pace_coverage` | `number` | drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Null when the denominator is 0. |
| `pass_rate` | `number` | passes / plays. Null when the denominator is 0. |
| `epa_per_play` | `number` | epa / plays. Null when the denominator is 0. |
| `epa_per_rush` | `number` | epa_rush / rushes. Null when the denominator is 0. |
| `epa_per_pass` | `number` | epa_pass / passes. Null when the denominator is 0. |
| `success_rate` | `number` | successes / plays. Null when the denominator is 0. |
| `success_rate_rush` | `number` | successes_rush / rushes. Null when the denominator is 0. |
| `success_rate_pass` | `number` | successes_pass / passes. Null when the denominator is 0. |
| `pass_rate_neutral` | `number` | passes_neutral / plays_neutral: pass rate in situation-neutral situations. Null when the denominator is 0. |
| `epa_per_play_neutral` | `number` | epa_neutral / plays_neutral. Null when the denominator is 0. |
| `success_rate_neutral` | `number` | successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Null when the denominator is 0. |
| `pass_rate_d1` | `number` | passes_d1 / plays_d1: pass rate on first down. Null when the denominator is 0. |
| `epa_per_play_d1` | `number` | epa_d1 / plays_d1: EPA per play on first down. Null when the denominator is 0. |
| `success_rate_d1` | `number` | successes_d1 / plays_d1: success rate on first down. Null when the denominator is 0. |
| `pass_rate_d2` | `number` | passes_d2 / plays_d2: pass rate on second down. Null when the denominator is 0. |
| `epa_per_play_d2` | `number` | epa_d2 / plays_d2: EPA per play on second down. Null when the denominator is 0. |
| `success_rate_d2` | `number` | successes_d2 / plays_d2: success rate on second down. Null when the denominator is 0. |
| `pass_rate_d3` | `number` | passes_d3 / plays_d3: pass rate on third down. Null when the denominator is 0. |
| `epa_per_play_d3` | `number` | epa_d3 / plays_d3: EPA per play on third down. Null when the denominator is 0. |
| `success_rate_d3` | `number` | successes_d3 / plays_d3: success rate on third down. Null when the denominator is 0. |
| `pass_rate_d4` | `number` | passes_d4 / plays_d4: pass rate on fourth down. Null when the denominator is 0. |
| `epa_per_play_d4` | `number` | epa_d4 / plays_d4: EPA per play on fourth down. Null when the denominator is 0. |
| `success_rate_d4` | `number` | successes_d4 / plays_d4: success rate on fourth down. Null when the denominator is 0. |
| `pass_rate_early_down` | `number` | passes_early_down / plays_early_down. Null when the denominator is 0. |
| `epa_per_play_early_down` | `number` | epa_early_down / plays_early_down. Null when the denominator is 0. |
| `success_rate_early_down` | `number` | successes_early_down / plays_early_down: success rate on first or second down. Null when the denominator is 0. |
| `pass_rate_standard_down` | `number` | passes_standard_down / plays_standard_down. Null when the denominator is 0. |
| `epa_per_play_standard_down` | `number` | epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `success_rate_standard_down` | `number` | successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `pass_rate_passing_down` | `number` | passes_passing_down / plays_passing_down. Null when the denominator is 0. |
| `epa_per_play_passing_down` | `number` | epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `success_rate_passing_down` | `number` | successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `pass_rate_leading` | `number` | passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_leading` | `number` | epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_leading` | `number` | successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_tied` | `number` | passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_tied` | `number` | epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_tied` | `number` | successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_trailing` | `number` | passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_trailing` | `number` | epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_trailing` | `number` | successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_first_half` | `number` | passes_first_half / plays_first_half. Null when the denominator is 0. |
| `epa_per_play_first_half` | `number` | epa_first_half / plays_first_half: EPA per play in the first two quarters. Null when the denominator is 0. |
| `success_rate_first_half` | `number` | successes_first_half / plays_first_half: success rate in the first two quarters. Null when the denominator is 0. |
| `pass_rate_second_half` | `number` | passes_second_half / plays_second_half. Null when the denominator is 0. |
| `epa_per_play_second_half` | `number` | epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `success_rate_second_half` | `number` | successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `pass_rate_d3_short` | `number` | passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_short` | `number` | epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `success_rate_d3_short` | `number` | successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `pass_rate_d3_medium` | `number` | passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_medium` | `number` | epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `success_rate_d3_medium` | `number` | successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `pass_rate_d3_long` | `number` | passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_long` | `number` | epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Null when the denominator is 0. |
| `success_rate_d3_long` | `number` | successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `pass_rate_red_zone` | `number` | passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `epa_per_play_red_zone` | `number` | epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `success_rate_red_zone` | `number` | successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `pass_rate_own_half` | `number` | passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_own_half` | `number` | epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_own_half` | `number` | successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_opp_half` | `number` | passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_opp_half` | `number` | epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_opp_half` | `number` | successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_one_score` | `number` | passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_one_score` | `number` | epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_one_score` | `number` | successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_home` | `number` | passes_home / plays_home: pass rate in the team's home games. Null when the denominator is 0. |
| `epa_per_play_home` | `number` | epa_home / plays_home: EPA per play in the team's home games. Null when the denominator is 0. |
| `success_rate_home` | `number` | successes_home / plays_home: success rate in the team's home games. Null when the denominator is 0. |
| `win_rate_home` | `number` | wins_home / games_home: win rate in the team's home games. Null when the denominator is 0. |
| `pass_rate_away` | `number` | passes_away / plays_away: pass rate in the team's away games. Null when the denominator is 0. |
| `epa_per_play_away` | `number` | epa_away / plays_away: EPA per play in the team's away games. Null when the denominator is 0. |
| `success_rate_away` | `number` | successes_away / plays_away: success rate in the team's away games. Null when the denominator is 0. |
| `win_rate_away` | `number` | wins_away / games_away: win rate in the team's away games. Null when the denominator is 0. |
| `pass_rate_neutral_site` | `number` | passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Null when the denominator is 0. |
| `epa_per_play_neutral_site` | `number` | epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Null when the denominator is 0. |
| `success_rate_neutral_site` | `number` | successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Null when the denominator is 0. |
| `win_rate_neutral_site` | `number` | wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Null when the denominator is 0. |
| `pass_rate_after_bye` | `number` | passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `epa_per_play_after_bye` | `number` | epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `success_rate_after_bye` | `number` | successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `win_rate_after_bye` | `number` | wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `pass_rate_opener` | `number` | passes_opener / plays_opener: pass rate in the team's regular-season openers. Null when the denominator is 0. |
| `epa_per_play_opener` | `number` | epa_opener / plays_opener: EPA per play in the team's regular-season openers. Null when the denominator is 0. |
| `success_rate_opener` | `number` | successes_opener / plays_opener: success rate in the team's regular-season openers. Null when the denominator is 0. |
| `win_rate_opener` | `number` | wins_opener / games_opener: win rate in the team's regular-season openers. Null when the denominator is 0. |
| `pass_rate_one_score_game` | `number` | passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `epa_per_play_one_score_game` | `number` | epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `success_rate_one_score_game` | `number` | successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `win_rate_one_score_game` | `number` | wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `ypp` | `number` | yards / plays: yards per play. Null when the denominator is 0. |
| `ypp_rush` | `number` | yards_rush / rushes: yards per rush. Null when the denominator is 0. |
| `ypp_pass` | `number` | yards_pass / passes: yards per pass play. Null when the denominator is 0. |
| `explosive_rate` | `number` | explosives / plays. Null when the denominator is 0. |
| `explosive_rate_rush` | `number` | explosives_rush / rushes. Null when the denominator is 0. |
| `explosive_rate_pass` | `number` | explosives_pass / passes. Null when the denominator is 0. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities. Null when the denominator is 0. |
| `rz_trip_rate` | `number` | rz_trips / drives: the share of drives that reached the red zone. Null when the denominator is 0. |
| `rz_td_rate` | `number` | rz_tds / rz_trips: touchdowns per red-zone trip. Null when the denominator is 0. |
| `rz_conversion_rate` | `number` | rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Null when the denominator is 0. |
| `rz_pts_per_trip` | `number` | rz_points / rz_trips: points per red-zone trip. Null when the denominator is 0. |
| `so_trip_rate` | `number` | so_trips / drives: the share of drives that reached the opponent's 40. Null when the denominator is 0. |
| `so_td_rate` | `number` | so_tds / so_trips: touchdowns per scoring-opportunity trip. Null when the denominator is 0. |
| `so_conversion_rate` | `number` | so_scores / so_trips: the share of scoring-opportunity trips that scored. Null when the denominator is 0. |
| `so_pts_per_trip` | `number` | so_points / so_trips: points per scoring-opportunity trip. Null when the denominator is 0. |
| `pts_per_drive` | `number` | drive_points / drives: points per drive. Null when the denominator is 0. |
| `scripted_epa_per_play` | `number` | scripted_epa / scripted_plays. Null when the denominator is 0. |
| `scripted_success_rate` | `number` | scripted_successes / scripted_plays. Null when the denominator is 0. |
| `scripted_pts_per_drive` | `number` | scripted_points / scripted_drives. Null when the denominator is 0. |
| `non_scripted_epa_per_play` | `number` | non_scripted_epa / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_success_rate` | `number` | non_scripted_successes / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_pts_per_drive` | `number` | non_scripted_points / non_scripted_drives. Null when the denominator is 0. |
| `go_rate` | `number` | fourth_went / fourth_decisions: the share of fourth-down decisions on which the offense went for it. Null when the denominator is 0. |
| `go_rate_when_model_says_go` | `number` | fourth_went_when_go / fourth_model_go: go rate on the decisions where the fourth-down model said go. Null when the denominator is 0. |
| `go_rate_when_model_says_kick` | `number` | fourth_went_when_kick / fourth_model_kick: go rate on the decisions where the model said punt or kick. Null when the denominator is 0. |
| `fourth_agreement_rate` | `number` | fourth_agreed / fourth_decisions: the share of decisions that matched the model. Null when the denominator is 0. |
| `fourth_wp_left_per_decision` | `number` | fourth_wp_left / fourth_decisions: win probability left on the table per fourth-down decision. Null when the denominator is 0. |
| `fourth_conversion_rate` | `number` | fourth_converted / fourth_went: conversion rate when going for it. Null when the denominator is 0. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `def_games` | `number` | Defense-allowed twin of games -- the same measure over the opposing offenses' plays while this team's defense was on the field: distinct games in which the offense ran at least one standing scrimmage play. |
| `def_plays` | `number` | Defense-allowed twin of plays -- the same measure over the opposing offenses' plays while this team's defense was on the field: standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `def_rushes` | `number` | Defense-allowed twin of rushes -- the same measure over the opposing offenses' plays while this team's defense was on the field: rushing plays among the standing scrimmage plays. |
| `def_passes` | `number` | Defense-allowed twin of passes -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays among the standing scrimmage plays. |
| `def_epa` | `number` | Defense-allowed twin of epa -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the standing scrimmage plays. |
| `def_epa_rush` | `number` | Defense-allowed twin of epa_rush -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the rushing plays. |
| `def_epa_pass` | `number` | Defense-allowed twin of epa_pass -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the pass plays. |
| `def_successes` | `number` | Defense-allowed twin of successes -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on the play-by-play. |
| `def_successes_rush` | `number` | Defense-allowed twin of successes_rush -- the same measure over the opposing offenses' plays while this team's defense was on the field: rushing plays flagged EPA_success. |
| `def_successes_pass` | `number` | Defense-allowed twin of successes_pass -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays flagged EPA_success. |
| `def_yards` | `number` | Defense-allowed twin of yards -- the same measure over the opposing offenses' plays while this team's defense was on the field: statYardage summed over the standing scrimmage plays. |
| `def_yards_rush` | `number` | Defense-allowed twin of yards_rush -- the same measure over the opposing offenses' plays while this team's defense was on the field: statYardage summed over the rushing plays. |
| `def_yards_pass` | `number` | Defense-allowed twin of yards_pass -- the same measure over the opposing offenses' plays while this team's defense was on the field: statYardage summed over the pass plays. |
| `def_explosives` | `number` | Defense-allowed twin of explosives -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_explosive on the play-by-play. |
| `def_explosives_rush` | `number` | Defense-allowed twin of explosives_rush -- the same measure over the opposing offenses' plays while this team's defense was on the field: rushing plays flagged EPA_explosive. |
| `def_explosives_pass` | `number` | Defense-allowed twin of explosives_pass -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays flagged EPA_explosive. |
| `def_third_down_opportunities` | `number` | Defense-allowed twin of third_down_opportunities -- the same measure over the opposing offenses' plays while this team's defense was on the field: third-down scrimmage plays. |
| `def_third_down_conversions` | `number` | Defense-allowed twin of third_down_conversions -- the same measure over the opposing offenses' plays while this team's defense was on the field: third-down plays that produced a first down or an offensive touchdown. |
| `def_third_down_expected` | `number` | Defense-allowed twin of third_down_expected -- the same measure over the opposing offenses' plays while this team's defense was on the field: expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `def_plays_neutral` | `number` | Defense-allowed twin of plays_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_passes_neutral` | `number` | Defense-allowed twin of passes_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays in situation-neutral situations (see plays_neutral). |
| `def_epa_neutral` | `number` | Defense-allowed twin of epa_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_successes_neutral` | `number` | Defense-allowed twin of successes_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `def_plays_d1` | `number` | Defense-allowed twin of plays_d1 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on first down. |
| `def_passes_d1` | `number` | Defense-allowed twin of passes_d1 -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on first down. |
| `def_epa_d1` | `number` | Defense-allowed twin of epa_d1 -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on first down. |
| `def_successes_d1` | `number` | Defense-allowed twin of successes_d1 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on first down. |
| `def_plays_d2` | `number` | Defense-allowed twin of plays_d2 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on second down. |
| `def_passes_d2` | `number` | Defense-allowed twin of passes_d2 -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on second down. |
| `def_epa_d2` | `number` | Defense-allowed twin of epa_d2 -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on second down. |
| `def_successes_d2` | `number` | Defense-allowed twin of successes_d2 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on second down. |
| `def_plays_d3` | `number` | Defense-allowed twin of plays_d3 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on third down. |
| `def_passes_d3` | `number` | Defense-allowed twin of passes_d3 -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on third down. |
| `def_epa_d3` | `number` | Defense-allowed twin of epa_d3 -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on third down. |
| `def_successes_d3` | `number` | Defense-allowed twin of successes_d3 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on third down. |
| `def_plays_d4` | `number` | Defense-allowed twin of plays_d4 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on fourth down. |
| `def_passes_d4` | `number` | Defense-allowed twin of passes_d4 -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on fourth down. |
| `def_epa_d4` | `number` | Defense-allowed twin of epa_d4 -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on fourth down. |
| `def_successes_d4` | `number` | Defense-allowed twin of successes_d4 -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on fourth down. |
| `def_plays_early_down` | `number` | Defense-allowed twin of plays_early_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on first or second down. |
| `def_passes_early_down` | `number` | Defense-allowed twin of passes_early_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on first or second down. |
| `def_epa_early_down` | `number` | Defense-allowed twin of epa_early_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the first- and second-down plays. |
| `def_successes_early_down` | `number` | Defense-allowed twin of successes_early_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on first or second down. |
| `def_plays_standard_down` | `number` | Defense-allowed twin of plays_standard_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `def_passes_standard_down` | `number` | Defense-allowed twin of passes_standard_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on standard downs (see plays_standard_down). |
| `def_epa_standard_down` | `number` | Defense-allowed twin of epa_standard_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `def_successes_standard_down` | `number` | Defense-allowed twin of successes_standard_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `def_plays_passing_down` | `number` | Defense-allowed twin of plays_passing_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `def_passes_passing_down` | `number` | Defense-allowed twin of passes_passing_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on passing downs (see plays_passing_down). |
| `def_epa_passing_down` | `number` | Defense-allowed twin of epa_passing_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `def_successes_passing_down` | `number` | Defense-allowed twin of successes_passing_down -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `def_plays_leading` | `number` | Defense-allowed twin of plays_leading -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_leading` | `number` | Defense-allowed twin of passes_leading -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_leading` | `number` | Defense-allowed twin of epa_leading -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_leading` | `number` | Defense-allowed twin of successes_leading -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_tied` | `number` | Defense-allowed twin of plays_tied -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_tied` | `number` | Defense-allowed twin of passes_tied -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_tied` | `number` | Defense-allowed twin of epa_tied -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_tied` | `number` | Defense-allowed twin of successes_tied -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_trailing` | `number` | Defense-allowed twin of plays_trailing -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_trailing` | `number` | Defense-allowed twin of passes_trailing -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_trailing` | `number` | Defense-allowed twin of epa_trailing -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_trailing` | `number` | Defense-allowed twin of successes_trailing -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_first_half` | `number` | Defense-allowed twin of plays_first_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays in the first two quarters. |
| `def_passes_first_half` | `number` | Defense-allowed twin of passes_first_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays in the first two quarters. |
| `def_epa_first_half` | `number` | Defense-allowed twin of epa_first_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays in the first two quarters. |
| `def_successes_first_half` | `number` | Defense-allowed twin of successes_first_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) in the first two quarters. |
| `def_plays_second_half` | `number` | Defense-allowed twin of plays_second_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_passes_second_half` | `number` | Defense-allowed twin of passes_second_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays in the third and fourth quarters. |
| `def_epa_second_half` | `number` | Defense-allowed twin of epa_second_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_successes_second_half` | `number` | Defense-allowed twin of successes_second_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `def_plays_d3_short` | `number` | Defense-allowed twin of plays_d3_short -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on third down with 3 or fewer yards to go. |
| `def_passes_d3_short` | `number` | Defense-allowed twin of passes_d3_short -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on third down with 3 or fewer yards to go. |
| `def_epa_d3_short` | `number` | Defense-allowed twin of epa_d3_short -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `def_successes_d3_short` | `number` | Defense-allowed twin of successes_d3_short -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `def_plays_d3_medium` | `number` | Defense-allowed twin of plays_d3_medium -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on third down with 4 to 6 yards to go. |
| `def_passes_d3_medium` | `number` | Defense-allowed twin of passes_d3_medium -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on third down with 4 to 6 yards to go. |
| `def_epa_d3_medium` | `number` | Defense-allowed twin of epa_d3_medium -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `def_successes_d3_medium` | `number` | Defense-allowed twin of successes_d3_medium -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `def_plays_d3_long` | `number` | Defense-allowed twin of plays_d3_long -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays on third down with 7 or more yards to go. |
| `def_passes_d3_long` | `number` | Defense-allowed twin of passes_d3_long -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays on third down with 7 or more yards to go. |
| `def_epa_d3_long` | `number` | Defense-allowed twin of epa_d3_long -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays on third down with 7 or more yards to go. |
| `def_successes_d3_long` | `number` | Defense-allowed twin of successes_d3_long -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `def_plays_red_zone` | `number` | Defense-allowed twin of plays_red_zone -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_passes_red_zone` | `number` | Defense-allowed twin of passes_red_zone -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_epa_red_zone` | `number` | Defense-allowed twin of epa_red_zone -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_successes_red_zone` | `number` | Defense-allowed twin of successes_red_zone -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_plays_own_half` | `number` | Defense-allowed twin of plays_own_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_passes_own_half` | `number` | Defense-allowed twin of passes_own_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_epa_own_half` | `number` | Defense-allowed twin of epa_own_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_successes_own_half` | `number` | Defense-allowed twin of successes_own_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_plays_opp_half` | `number` | Defense-allowed twin of plays_opp_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_passes_opp_half` | `number` | Defense-allowed twin of passes_opp_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_epa_opp_half` | `number` | Defense-allowed twin of epa_opp_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_successes_opp_half` | `number` | Defense-allowed twin of successes_opp_half -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_plays_one_score` | `number` | Defense-allowed twin of plays_one_score -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_one_score` | `number` | Defense-allowed twin of passes_one_score -- the same measure over the opposing offenses' plays while this team's defense was on the field: pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_one_score` | `number` | Defense-allowed twin of epa_one_score -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_one_score` | `number` | Defense-allowed twin of successes_one_score -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_home` | `number` | Defense-allowed twin of plays_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's home games. |
| `def_passes_home` | `number` | Defense-allowed twin of passes_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's home games. |
| `def_epa_home` | `number` | Defense-allowed twin of epa_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's home games. |
| `def_successes_home` | `number` | Defense-allowed twin of successes_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's home games. |
| `def_games_home` | `number` | Defense-allowed twin of games_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct home games in which the offense ran at least one standing scrimmage play. |
| `def_wins_home` | `number` | Defense-allowed twin of wins_home -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `def_plays_away` | `number` | Defense-allowed twin of plays_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's away games. |
| `def_passes_away` | `number` | Defense-allowed twin of passes_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's away games. |
| `def_epa_away` | `number` | Defense-allowed twin of epa_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's away games. |
| `def_successes_away` | `number` | Defense-allowed twin of successes_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's away games. |
| `def_games_away` | `number` | Defense-allowed twin of games_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct away games in which the offense ran at least one standing scrimmage play. |
| `def_wins_away` | `number` | Defense-allowed twin of wins_away -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `def_plays_neutral_site` | `number` | Defense-allowed twin of plays_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's neutral-site games. |
| `def_passes_neutral_site` | `number` | Defense-allowed twin of passes_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's neutral-site games. |
| `def_epa_neutral_site` | `number` | Defense-allowed twin of epa_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's neutral-site games. |
| `def_successes_neutral_site` | `number` | Defense-allowed twin of successes_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `def_games_neutral_site` | `number` | Defense-allowed twin of games_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `def_wins_neutral_site` | `number` | Defense-allowed twin of wins_neutral_site -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `def_plays_after_bye` | `number` | Defense-allowed twin of plays_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games played 13 or more days after the team's previous game. |
| `def_passes_after_bye` | `number` | Defense-allowed twin of passes_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games played 13 or more days after the team's previous game. |
| `def_epa_after_bye` | `number` | Defense-allowed twin of epa_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `def_successes_after_bye` | `number` | Defense-allowed twin of successes_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `def_games_after_bye` | `number` | Defense-allowed twin of games_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `def_wins_after_bye` | `number` | Defense-allowed twin of wins_after_bye -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `def_plays_opener` | `number` | Defense-allowed twin of plays_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's regular-season openers. |
| `def_passes_opener` | `number` | Defense-allowed twin of passes_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's regular-season openers. |
| `def_epa_opener` | `number` | Defense-allowed twin of epa_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's regular-season openers. |
| `def_successes_opener` | `number` | Defense-allowed twin of successes_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `def_games_opener` | `number` | Defense-allowed twin of games_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `def_wins_opener` | `number` | Defense-allowed twin of wins_opener -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `def_plays_one_score_game` | `number` | Defense-allowed twin of plays_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games decided by 8 points or fewer. |
| `def_passes_one_score_game` | `number` | Defense-allowed twin of passes_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games decided by 8 points or fewer. |
| `def_epa_one_score_game` | `number` | Defense-allowed twin of epa_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `def_successes_one_score_game` | `number` | Defense-allowed twin of successes_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `def_games_one_score_game` | `number` | Defense-allowed twin of games_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `def_wins_one_score_game` | `number` | Defense-allowed twin of wins_one_score_game -- the same measure over the opposing offenses' plays while this team's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `def_drives` | `number` | Defense-allowed twin of drives -- the same measure over the opposing offenses' plays while this team's defense was on the field: offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `def_drives_with_clock` | `number` | Defense-allowed twin of drives_with_clock -- the same measure over the opposing offenses' plays while this team's defense was on the field: drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays). |
| `def_drive_seconds` | `number` | Defense-allowed twin of drive_seconds -- the same measure over the opposing offenses' plays while this team's defense was on the field: eSPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `def_drive_plays` | `number` | Defense-allowed twin of drive_plays -- the same measure over the opposing offenses' plays while this team's defense was on the field: eSPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `def_drive_seconds_neutral` | `number` | Defense-allowed twin of drive_seconds_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: eSPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_plays_neutral` | `number` | Defense-allowed twin of drive_plays_neutral -- the same measure over the opposing offenses' plays while this team's defense was on the field: eSPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_points` | `number` | Defense-allowed twin of drive_points -- the same measure over the opposing offenses' plays while this team's defense was on the field: drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `def_rz_trips` | `number` | Defense-allowed twin of rz_trips -- the same measure over the opposing offenses' plays while this team's defense was on the field: drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `def_rz_tds` | `number` | Defense-allowed twin of rz_tds -- the same measure over the opposing offenses' plays while this team's defense was on the field: red-zone drives that included an offensive touchdown play. |
| `def_rz_scores` | `number` | Defense-allowed twin of rz_scores -- the same measure over the opposing offenses' plays while this team's defense was on the field: red-zone drives that scored (a touchdown or a field goal). |
| `def_rz_points` | `number` | Defense-allowed twin of rz_points -- the same measure over the opposing offenses' plays while this team's defense was on the field: drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `def_so_trips` | `number` | Defense-allowed twin of so_trips -- the same measure over the opposing offenses' plays while this team's defense was on the field: drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `def_so_tds` | `number` | Defense-allowed twin of so_tds -- the same measure over the opposing offenses' plays while this team's defense was on the field: scoring-opportunity drives that included an offensive touchdown play. |
| `def_so_scores` | `number` | Defense-allowed twin of so_scores -- the same measure over the opposing offenses' plays while this team's defense was on the field: scoring-opportunity drives that scored (a touchdown or a field goal). |
| `def_so_points` | `number` | Defense-allowed twin of so_points -- the same measure over the opposing offenses' plays while this team's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `def_scripted_drives` | `number` | Defense-allowed twin of scripted_drives -- the same measure over the opposing offenses' plays while this team's defense was on the field: the offense's first two drives of each half. |
| `def_scripted_plays` | `number` | Defense-allowed twin of scripted_plays -- the same measure over the opposing offenses' plays while this team's defense was on the field: standing scrimmage plays on the scripted drives. |
| `def_scripted_epa` | `number` | Defense-allowed twin of scripted_epa -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the scripted drives. |
| `def_scripted_successes` | `number` | Defense-allowed twin of scripted_successes -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success on the scripted drives. |
| `def_scripted_points` | `number` | Defense-allowed twin of scripted_points -- the same measure over the opposing offenses' plays while this team's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `def_non_scripted_drives` | `number` | Defense-allowed twin of non_scripted_drives -- the same measure over the opposing offenses' plays while this team's defense was on the field: every drive after the offense's first two of each half. |
| `def_non_scripted_plays` | `number` | Defense-allowed twin of non_scripted_plays -- the same measure over the opposing offenses' plays while this team's defense was on the field: standing scrimmage plays on the non-scripted drives. |
| `def_non_scripted_epa` | `number` | Defense-allowed twin of non_scripted_epa -- the same measure over the opposing offenses' plays while this team's defense was on the field: play EPA summed over the non-scripted drives. |
| `def_non_scripted_successes` | `number` | Defense-allowed twin of non_scripted_successes -- the same measure over the opposing offenses' plays while this team's defense was on the field: plays flagged EPA_success on the non-scripted drives. |
| `def_non_scripted_points` | `number` | Defense-allowed twin of non_scripted_points -- the same measure over the opposing offenses' plays while this team's defense was on the field: drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `def_plays_per_game` | `number` | Defense-allowed twin of plays_per_game: plays / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_plays_per_drive` | `number` | Defense-allowed twin of plays_per_drive: plays / drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_drives_per_game` | `number` | Defense-allowed twin of drives_per_game: drives / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play` | `number` | Defense-allowed twin of sec_per_play: drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play_neutral` | `number` | Defense-allowed twin of sec_per_play_neutral: drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_pace_coverage` | `number` | Defense-allowed twin of pace_coverage: drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate` | `number` | Defense-allowed twin of pass_rate: passes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play` | `number` | Defense-allowed twin of epa_per_play: epa / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_rush` | `number` | Defense-allowed twin of epa_per_rush: epa_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_pass` | `number` | Defense-allowed twin of epa_per_pass: epa_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate` | `number` | Defense-allowed twin of success_rate: successes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_rush` | `number` | Defense-allowed twin of success_rate_rush: successes_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_pass` | `number` | Defense-allowed twin of success_rate_pass: successes_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral` | `number` | Defense-allowed twin of pass_rate_neutral: passes_neutral / plays_neutral: pass rate in situation-neutral situations. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral` | `number` | Defense-allowed twin of epa_per_play_neutral: epa_neutral / plays_neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral` | `number` | Defense-allowed twin of success_rate_neutral: successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d1` | `number` | Defense-allowed twin of pass_rate_d1: passes_d1 / plays_d1: pass rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d1` | `number` | Defense-allowed twin of epa_per_play_d1: epa_d1 / plays_d1: EPA per play on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d1` | `number` | Defense-allowed twin of success_rate_d1: successes_d1 / plays_d1: success rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d2` | `number` | Defense-allowed twin of pass_rate_d2: passes_d2 / plays_d2: pass rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d2` | `number` | Defense-allowed twin of epa_per_play_d2: epa_d2 / plays_d2: EPA per play on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d2` | `number` | Defense-allowed twin of success_rate_d2: successes_d2 / plays_d2: success rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3` | `number` | Defense-allowed twin of pass_rate_d3: passes_d3 / plays_d3: pass rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3` | `number` | Defense-allowed twin of epa_per_play_d3: epa_d3 / plays_d3: EPA per play on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3` | `number` | Defense-allowed twin of success_rate_d3: successes_d3 / plays_d3: success rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d4` | `number` | Defense-allowed twin of pass_rate_d4: passes_d4 / plays_d4: pass rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d4` | `number` | Defense-allowed twin of epa_per_play_d4: epa_d4 / plays_d4: EPA per play on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d4` | `number` | Defense-allowed twin of success_rate_d4: successes_d4 / plays_d4: success rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_early_down` | `number` | Defense-allowed twin of pass_rate_early_down: passes_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_early_down` | `number` | Defense-allowed twin of epa_per_play_early_down: epa_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_early_down` | `number` | Defense-allowed twin of success_rate_early_down: successes_early_down / plays_early_down: success rate on first or second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_standard_down` | `number` | Defense-allowed twin of pass_rate_standard_down: passes_standard_down / plays_standard_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_standard_down` | `number` | Defense-allowed twin of epa_per_play_standard_down: epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_standard_down` | `number` | Defense-allowed twin of success_rate_standard_down: successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_passing_down` | `number` | Defense-allowed twin of pass_rate_passing_down: passes_passing_down / plays_passing_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_passing_down` | `number` | Defense-allowed twin of epa_per_play_passing_down: epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_passing_down` | `number` | Defense-allowed twin of success_rate_passing_down: successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_leading` | `number` | Defense-allowed twin of pass_rate_leading: passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_leading` | `number` | Defense-allowed twin of epa_per_play_leading: epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_leading` | `number` | Defense-allowed twin of success_rate_leading: successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_tied` | `number` | Defense-allowed twin of pass_rate_tied: passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_tied` | `number` | Defense-allowed twin of epa_per_play_tied: epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_tied` | `number` | Defense-allowed twin of success_rate_tied: successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_trailing` | `number` | Defense-allowed twin of pass_rate_trailing: passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_trailing` | `number` | Defense-allowed twin of epa_per_play_trailing: epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_trailing` | `number` | Defense-allowed twin of success_rate_trailing: successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_first_half` | `number` | Defense-allowed twin of pass_rate_first_half: passes_first_half / plays_first_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_first_half` | `number` | Defense-allowed twin of epa_per_play_first_half: epa_first_half / plays_first_half: EPA per play in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_first_half` | `number` | Defense-allowed twin of success_rate_first_half: successes_first_half / plays_first_half: success rate in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_second_half` | `number` | Defense-allowed twin of pass_rate_second_half: passes_second_half / plays_second_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_second_half` | `number` | Defense-allowed twin of epa_per_play_second_half: epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_second_half` | `number` | Defense-allowed twin of success_rate_second_half: successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_short` | `number` | Defense-allowed twin of pass_rate_d3_short: passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_short` | `number` | Defense-allowed twin of epa_per_play_d3_short: epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_short` | `number` | Defense-allowed twin of success_rate_d3_short: successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_medium` | `number` | Defense-allowed twin of pass_rate_d3_medium: passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_medium` | `number` | Defense-allowed twin of epa_per_play_d3_medium: epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_medium` | `number` | Defense-allowed twin of success_rate_d3_medium: successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_long` | `number` | Defense-allowed twin of pass_rate_d3_long: passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_long` | `number` | Defense-allowed twin of epa_per_play_d3_long: epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_long` | `number` | Defense-allowed twin of success_rate_d3_long: successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_red_zone` | `number` | Defense-allowed twin of pass_rate_red_zone: passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_red_zone` | `number` | Defense-allowed twin of epa_per_play_red_zone: epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_red_zone` | `number` | Defense-allowed twin of success_rate_red_zone: successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_own_half` | `number` | Defense-allowed twin of pass_rate_own_half: passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_own_half` | `number` | Defense-allowed twin of epa_per_play_own_half: epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_own_half` | `number` | Defense-allowed twin of success_rate_own_half: successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opp_half` | `number` | Defense-allowed twin of pass_rate_opp_half: passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opp_half` | `number` | Defense-allowed twin of epa_per_play_opp_half: epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opp_half` | `number` | Defense-allowed twin of success_rate_opp_half: successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score` | `number` | Defense-allowed twin of pass_rate_one_score: passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score` | `number` | Defense-allowed twin of epa_per_play_one_score: epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score` | `number` | Defense-allowed twin of success_rate_one_score: successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_home` | `number` | Defense-allowed twin of pass_rate_home: passes_home / plays_home: pass rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_home` | `number` | Defense-allowed twin of epa_per_play_home: epa_home / plays_home: EPA per play in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_home` | `number` | Defense-allowed twin of success_rate_home: successes_home / plays_home: success rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_home` | `number` | Defense-allowed twin of win_rate_home: wins_home / games_home: win rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_away` | `number` | Defense-allowed twin of pass_rate_away: passes_away / plays_away: pass rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_away` | `number` | Defense-allowed twin of epa_per_play_away: epa_away / plays_away: EPA per play in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_away` | `number` | Defense-allowed twin of success_rate_away: successes_away / plays_away: success rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_away` | `number` | Defense-allowed twin of win_rate_away: wins_away / games_away: win rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral_site` | `number` | Defense-allowed twin of pass_rate_neutral_site: passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral_site` | `number` | Defense-allowed twin of epa_per_play_neutral_site: epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral_site` | `number` | Defense-allowed twin of success_rate_neutral_site: successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_neutral_site` | `number` | Defense-allowed twin of win_rate_neutral_site: wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_after_bye` | `number` | Defense-allowed twin of pass_rate_after_bye: passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_after_bye` | `number` | Defense-allowed twin of epa_per_play_after_bye: epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_after_bye` | `number` | Defense-allowed twin of success_rate_after_bye: successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_after_bye` | `number` | Defense-allowed twin of win_rate_after_bye: wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opener` | `number` | Defense-allowed twin of pass_rate_opener: passes_opener / plays_opener: pass rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opener` | `number` | Defense-allowed twin of epa_per_play_opener: epa_opener / plays_opener: EPA per play in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opener` | `number` | Defense-allowed twin of success_rate_opener: successes_opener / plays_opener: success rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_opener` | `number` | Defense-allowed twin of win_rate_opener: wins_opener / games_opener: win rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score_game` | `number` | Defense-allowed twin of pass_rate_one_score_game: passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score_game` | `number` | Defense-allowed twin of epa_per_play_one_score_game: epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score_game` | `number` | Defense-allowed twin of success_rate_one_score_game: successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_one_score_game` | `number` | Defense-allowed twin of win_rate_one_score_game: wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp` | `number` | Defense-allowed twin of ypp: yards / plays: yards per play. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_rush` | `number` | Defense-allowed twin of ypp_rush: yards_rush / rushes: yards per rush. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_pass` | `number` | Defense-allowed twin of ypp_pass: yards_pass / passes: yards per pass play. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate` | `number` | Defense-allowed twin of explosive_rate: explosives / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_rush` | `number` | Defense-allowed twin of explosive_rate_rush: explosives_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_pass` | `number` | Defense-allowed twin of explosive_rate_pass: explosives_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_rate` | `number` | Defense-allowed twin of third_down_rate: third_down_conversions / third_down_opportunities. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_trip_rate` | `number` | Defense-allowed twin of rz_trip_rate: rz_trips / drives: the share of drives that reached the red zone. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_td_rate` | `number` | Defense-allowed twin of rz_td_rate: rz_tds / rz_trips: touchdowns per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_conversion_rate` | `number` | Defense-allowed twin of rz_conversion_rate: rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_pts_per_trip` | `number` | Defense-allowed twin of rz_pts_per_trip: rz_points / rz_trips: points per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_trip_rate` | `number` | Defense-allowed twin of so_trip_rate: so_trips / drives: the share of drives that reached the opponent's 40. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_td_rate` | `number` | Defense-allowed twin of so_td_rate: so_tds / so_trips: touchdowns per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_conversion_rate` | `number` | Defense-allowed twin of so_conversion_rate: so_scores / so_trips: the share of scoring-opportunity trips that scored. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_pts_per_trip` | `number` | Defense-allowed twin of so_pts_per_trip: so_points / so_trips: points per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_pts_per_drive` | `number` | Defense-allowed twin of pts_per_drive: drive_points / drives: points per drive. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_epa_per_play` | `number` | Defense-allowed twin of scripted_epa_per_play: scripted_epa / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_success_rate` | `number` | Defense-allowed twin of scripted_success_rate: scripted_successes / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_pts_per_drive` | `number` | Defense-allowed twin of scripted_pts_per_drive: scripted_points / scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_epa_per_play` | `number` | Defense-allowed twin of non_scripted_epa_per_play: non_scripted_epa / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_success_rate` | `number` | Defense-allowed twin of non_scripted_success_rate: non_scripted_successes / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_pts_per_drive` | `number` | Defense-allowed twin of non_scripted_pts_per_drive: non_scripted_points / non_scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_over_expected` | `number` | Defense-allowed twin of third_down_over_expected: def_third_down_conversions minus def_third_down_expected; null when no curve was available. |

## `loadNflCoachTendencies`

Release: [espn_nfl_coach_tendencies](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_coach_tendencies) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_coach_tendencies/coach_tendencies_{season}.parquet`

:::caution[Coverage]
One row per (season, team, head coach). The coach comes from the nflverse schedule (home_coach / away_coach) per game, so a midseason change splits the season between both coaches; role is always "HC". Published 2002-2026 (2005 is thin). A season with no asset raises NoDataError.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 2002); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflCoachTendencies({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_coach_tendencies(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflCoachTendenciesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `season` | `number \| bigint` | Season the rows were summed over, keyed by the season's starting calendar year -- the same season stamp the released play-by-play carries. |
| `pos_team_id` | `string` | ESPN team id of the team the coach's plays were attributed to; joins to the ESPN teams and schedule datasets on team_id. |
| `pos_team` | `string` | Display name of the team the coach's plays were attributed to, as carried on the released play-by-play (e.g. "Kansas City Chiefs", "Georgia Bulldogs"). |
| `coach` | `string` | Head coach the plays were attributed to -- per game from the nflverse schedule (home_coach / away_coach) for the NFL, per team-season from the producer's CFBD coach roster for CFB. |
| `role` | `string` | Coaching role the row is keyed on; always "HC" (head coach) in the published assets, reserved for later coordinator rows. |
| `games` | `number` | Distinct games in which the offense ran at least one standing scrimmage play. |
| `plays` | `number` | Standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `rushes` | `number` | Rushing plays among the standing scrimmage plays. |
| `passes` | `number` | Pass plays among the standing scrimmage plays. |
| `epa` | `number` | Play EPA summed over the standing scrimmage plays. |
| `epa_rush` | `number` | Play EPA summed over the rushing plays. |
| `epa_pass` | `number` | Play EPA summed over the pass plays. |
| `successes` | `number` | Plays flagged EPA_success (positive EPA) on the play-by-play. |
| `successes_rush` | `number` | Rushing plays flagged EPA_success. |
| `successes_pass` | `number` | Pass plays flagged EPA_success. |
| `yards` | `number` | statYardage summed over the standing scrimmage plays. |
| `yards_rush` | `number` | statYardage summed over the rushing plays. |
| `yards_pass` | `number` | statYardage summed over the pass plays. |
| `explosives` | `number` | Plays flagged EPA_explosive on the play-by-play. |
| `explosives_rush` | `number` | Rushing plays flagged EPA_explosive. |
| `explosives_pass` | `number` | Pass plays flagged EPA_explosive. |
| `third_down_opportunities` | `number` | Third-down scrimmage plays. |
| `third_down_conversions` | `number` | Third-down plays that produced a first down or an offensive touchdown. |
| `third_down_expected` | `number` | Expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `plays_neutral` | `number` | Plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `passes_neutral` | `number` | Pass plays in situation-neutral situations (see plays_neutral). |
| `epa_neutral` | `number` | Play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `successes_neutral` | `number` | Plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `plays_d1` | `number` | Plays on first down. |
| `passes_d1` | `number` | Pass plays on first down. |
| `epa_d1` | `number` | Play EPA summed over the plays on first down. |
| `successes_d1` | `number` | Plays flagged EPA_success (positive EPA) on first down. |
| `plays_d2` | `number` | Plays on second down. |
| `passes_d2` | `number` | Pass plays on second down. |
| `epa_d2` | `number` | Play EPA summed over the plays on second down. |
| `successes_d2` | `number` | Plays flagged EPA_success (positive EPA) on second down. |
| `plays_d3` | `number` | Plays on third down. |
| `passes_d3` | `number` | Pass plays on third down. |
| `epa_d3` | `number` | Play EPA summed over the plays on third down. |
| `successes_d3` | `number` | Plays flagged EPA_success (positive EPA) on third down. |
| `plays_d4` | `number` | Plays on fourth down. |
| `passes_d4` | `number` | Pass plays on fourth down. |
| `epa_d4` | `number` | Play EPA summed over the plays on fourth down. |
| `successes_d4` | `number` | Plays flagged EPA_success (positive EPA) on fourth down. |
| `plays_early_down` | `number` | Plays on first or second down. |
| `passes_early_down` | `number` | Pass plays on first or second down. |
| `epa_early_down` | `number` | Play EPA summed over the first- and second-down plays. |
| `successes_early_down` | `number` | Plays flagged EPA_success (positive EPA) on first or second down. |
| `plays_standard_down` | `number` | Plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `passes_standard_down` | `number` | Pass plays on standard downs (see plays_standard_down). |
| `epa_standard_down` | `number` | Play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `successes_standard_down` | `number` | Plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `plays_passing_down` | `number` | Plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `passes_passing_down` | `number` | Pass plays on passing downs (see plays_passing_down). |
| `epa_passing_down` | `number` | Play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `successes_passing_down` | `number` | Plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `plays_leading` | `number` | Plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_leading` | `number` | Pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_leading` | `number` | Play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_leading` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_tied` | `number` | Plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_tied` | `number` | Pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_tied` | `number` | Play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_tied` | `number` | Plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_trailing` | `number` | Plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_trailing` | `number` | Pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_trailing` | `number` | Play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_trailing` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_first_half` | `number` | Plays in the first two quarters. |
| `passes_first_half` | `number` | Pass plays in the first two quarters. |
| `epa_first_half` | `number` | Play EPA summed over the plays in the first two quarters. |
| `successes_first_half` | `number` | Plays flagged EPA_success (positive EPA) in the first two quarters. |
| `plays_second_half` | `number` | Plays in the third and fourth quarters (overtime belongs to neither half). |
| `passes_second_half` | `number` | Pass plays in the third and fourth quarters. |
| `epa_second_half` | `number` | Play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `successes_second_half` | `number` | Plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `plays_d3_short` | `number` | Plays on third down with 3 or fewer yards to go. |
| `passes_d3_short` | `number` | Pass plays on third down with 3 or fewer yards to go. |
| `epa_d3_short` | `number` | Play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `successes_d3_short` | `number` | Plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `plays_d3_medium` | `number` | Plays on third down with 4 to 6 yards to go. |
| `passes_d3_medium` | `number` | Pass plays on third down with 4 to 6 yards to go. |
| `epa_d3_medium` | `number` | Play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `successes_d3_medium` | `number` | Plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `plays_d3_long` | `number` | Plays on third down with 7 or more yards to go. |
| `passes_d3_long` | `number` | Pass plays on third down with 7 or more yards to go. |
| `epa_d3_long` | `number` | Play EPA summed over the plays on third down with 7 or more yards to go. |
| `successes_d3_long` | `number` | Plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `plays_red_zone` | `number` | Plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `passes_red_zone` | `number` | Pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `epa_red_zone` | `number` | Play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `successes_red_zone` | `number` | Plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `plays_own_half` | `number` | Plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `passes_own_half` | `number` | Pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `epa_own_half` | `number` | Play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `successes_own_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `plays_opp_half` | `number` | Plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `passes_opp_half` | `number` | Pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `epa_opp_half` | `number` | Play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `successes_opp_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `plays_one_score` | `number` | Plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_one_score` | `number` | Pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_one_score` | `number` | Play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_one_score` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_home` | `number` | Plays in the team's home games. |
| `passes_home` | `number` | Pass plays in the team's home games. |
| `epa_home` | `number` | Play EPA summed over the plays in the team's home games. |
| `successes_home` | `number` | Plays flagged EPA_success (positive EPA) in the team's home games. |
| `games_home` | `number` | Distinct home games in which the offense ran at least one standing scrimmage play. |
| `wins_home` | `number` | Of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `plays_away` | `number` | Plays in the team's away games. |
| `passes_away` | `number` | Pass plays in the team's away games. |
| `epa_away` | `number` | Play EPA summed over the plays in the team's away games. |
| `successes_away` | `number` | Plays flagged EPA_success (positive EPA) in the team's away games. |
| `games_away` | `number` | Distinct away games in which the offense ran at least one standing scrimmage play. |
| `wins_away` | `number` | Of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `plays_neutral_site` | `number` | Plays in the team's neutral-site games. |
| `passes_neutral_site` | `number` | Pass plays in the team's neutral-site games. |
| `epa_neutral_site` | `number` | Play EPA summed over the plays in the team's neutral-site games. |
| `successes_neutral_site` | `number` | Plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `games_neutral_site` | `number` | Distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `wins_neutral_site` | `number` | Of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `plays_after_bye` | `number` | Plays in the team's games played 13 or more days after the team's previous game. |
| `passes_after_bye` | `number` | Pass plays in the team's games played 13 or more days after the team's previous game. |
| `epa_after_bye` | `number` | Play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `successes_after_bye` | `number` | Plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `games_after_bye` | `number` | Distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `wins_after_bye` | `number` | Of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `plays_opener` | `number` | Plays in the team's regular-season openers. |
| `passes_opener` | `number` | Pass plays in the team's regular-season openers. |
| `epa_opener` | `number` | Play EPA summed over the plays in the team's regular-season openers. |
| `successes_opener` | `number` | Plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `games_opener` | `number` | Distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `wins_opener` | `number` | Of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `plays_one_score_game` | `number` | Plays in the team's games decided by 8 points or fewer. |
| `passes_one_score_game` | `number` | Pass plays in the team's games decided by 8 points or fewer. |
| `epa_one_score_game` | `number` | Play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `successes_one_score_game` | `number` | Plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `games_one_score_game` | `number` | Distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `wins_one_score_game` | `number` | Of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `fourth_decisions` | `number` | Fourth-down plays on which the offense ran, passed, punted or attempted a field goal and the play stood (timeouts and nullified plays are not decisions). |
| `fourth_went` | `number` | Fourth-down decisions that were a rush or a pass (the offense went for it). |
| `fourth_converted` | `number` | Fourth-down go attempts that produced a first down or an offensive touchdown. |
| `fourth_model_go` | `number` | Decisions on which the fourth-down model recommended going for it (fourth_down_recommendation == "go"). |
| `fourth_model_kick` | `number` | Decisions on which the fourth-down model recommended a punt or a field goal. |
| `fourth_went_when_go` | `number` | Decisions on which the offense went for it when the model also said go. |
| `fourth_went_when_kick` | `number` | Decisions on which the offense went for it when the model said kick. |
| `fourth_agreed` | `number` | Decisions that matched the model's recommendation (went when it said go, kicked when it said kick). |
| `fourth_wp_left` | `number` | Win probability left on the table, summed over the decisions that went against the model: go_boost when the offense kicked against a go recommendation, minus go_boost when it went against a kick recommendation, floored at zero. |
| `drives` | `number` | Offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `drives_with_clock` | `number` | Drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays), in regulation (overtime has no game clock) and owned by this offense (an ESPN drive id that holds snaps by both offenses counts once, for ESPN's drive team when it matches an offense in the drive, else the offense with the most standing snaps, the first snap breaking a tie). |
| `drive_seconds` | `number` | ESPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `drive_plays` | `number` | ESPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `drive_seconds_neutral` | `number` | ESPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `drive_plays_neutral` | `number` | ESPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `drive_points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `rz_trips` | `number` | Drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `rz_tds` | `number` | Red-zone drives that included an offensive touchdown play. |
| `rz_scores` | `number` | Red-zone drives that scored (a touchdown or a field goal). |
| `rz_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `so_trips` | `number` | Drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `so_tds` | `number` | Scoring-opportunity drives that included an offensive touchdown play. |
| `so_scores` | `number` | Scoring-opportunity drives that scored (a touchdown or a field goal). |
| `so_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `scripted_drives` | `number` | The offense's first two drives of each half. |
| `scripted_plays` | `number` | Standing scrimmage plays on the scripted drives. |
| `scripted_epa` | `number` | Play EPA summed over the scripted drives. |
| `scripted_successes` | `number` | Plays flagged EPA_success on the scripted drives. |
| `scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `non_scripted_drives` | `number` | Every drive after the offense's first two of each half. |
| `non_scripted_plays` | `number` | Standing scrimmage plays on the non-scripted drives. |
| `non_scripted_epa` | `number` | Play EPA summed over the non-scripted drives. |
| `non_scripted_successes` | `number` | Plays flagged EPA_success on the non-scripted drives. |
| `non_scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `plays_per_game` | `number` | plays / games. Null when the denominator is 0. |
| `plays_per_drive` | `number` | plays / drives. Null when the denominator is 0. |
| `drives_per_game` | `number` | drives / games. Null when the denominator is 0. |
| `sec_per_play` | `number` | drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Null when the denominator is 0. |
| `sec_per_play_neutral` | `number` | drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Null when the denominator is 0. |
| `pace_coverage` | `number` | drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Null when the denominator is 0. |
| `pass_rate` | `number` | passes / plays. Null when the denominator is 0. |
| `epa_per_play` | `number` | epa / plays. Null when the denominator is 0. |
| `epa_per_rush` | `number` | epa_rush / rushes. Null when the denominator is 0. |
| `epa_per_pass` | `number` | epa_pass / passes. Null when the denominator is 0. |
| `success_rate` | `number` | successes / plays. Null when the denominator is 0. |
| `success_rate_rush` | `number` | successes_rush / rushes. Null when the denominator is 0. |
| `success_rate_pass` | `number` | successes_pass / passes. Null when the denominator is 0. |
| `pass_rate_neutral` | `number` | passes_neutral / plays_neutral: pass rate in situation-neutral situations. Null when the denominator is 0. |
| `epa_per_play_neutral` | `number` | epa_neutral / plays_neutral. Null when the denominator is 0. |
| `success_rate_neutral` | `number` | successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Null when the denominator is 0. |
| `pass_rate_d1` | `number` | passes_d1 / plays_d1: pass rate on first down. Null when the denominator is 0. |
| `epa_per_play_d1` | `number` | epa_d1 / plays_d1: EPA per play on first down. Null when the denominator is 0. |
| `success_rate_d1` | `number` | successes_d1 / plays_d1: success rate on first down. Null when the denominator is 0. |
| `pass_rate_d2` | `number` | passes_d2 / plays_d2: pass rate on second down. Null when the denominator is 0. |
| `epa_per_play_d2` | `number` | epa_d2 / plays_d2: EPA per play on second down. Null when the denominator is 0. |
| `success_rate_d2` | `number` | successes_d2 / plays_d2: success rate on second down. Null when the denominator is 0. |
| `pass_rate_d3` | `number` | passes_d3 / plays_d3: pass rate on third down. Null when the denominator is 0. |
| `epa_per_play_d3` | `number` | epa_d3 / plays_d3: EPA per play on third down. Null when the denominator is 0. |
| `success_rate_d3` | `number` | successes_d3 / plays_d3: success rate on third down. Null when the denominator is 0. |
| `pass_rate_d4` | `number` | passes_d4 / plays_d4: pass rate on fourth down. Null when the denominator is 0. |
| `epa_per_play_d4` | `number` | epa_d4 / plays_d4: EPA per play on fourth down. Null when the denominator is 0. |
| `success_rate_d4` | `number` | successes_d4 / plays_d4: success rate on fourth down. Null when the denominator is 0. |
| `pass_rate_early_down` | `number` | passes_early_down / plays_early_down. Null when the denominator is 0. |
| `epa_per_play_early_down` | `number` | epa_early_down / plays_early_down. Null when the denominator is 0. |
| `success_rate_early_down` | `number` | successes_early_down / plays_early_down: success rate on first or second down. Null when the denominator is 0. |
| `pass_rate_standard_down` | `number` | passes_standard_down / plays_standard_down. Null when the denominator is 0. |
| `epa_per_play_standard_down` | `number` | epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `success_rate_standard_down` | `number` | successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `pass_rate_passing_down` | `number` | passes_passing_down / plays_passing_down. Null when the denominator is 0. |
| `epa_per_play_passing_down` | `number` | epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `success_rate_passing_down` | `number` | successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `pass_rate_leading` | `number` | passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_leading` | `number` | epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_leading` | `number` | successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_tied` | `number` | passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_tied` | `number` | epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_tied` | `number` | successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_trailing` | `number` | passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_trailing` | `number` | epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_trailing` | `number` | successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_first_half` | `number` | passes_first_half / plays_first_half. Null when the denominator is 0. |
| `epa_per_play_first_half` | `number` | epa_first_half / plays_first_half: EPA per play in the first two quarters. Null when the denominator is 0. |
| `success_rate_first_half` | `number` | successes_first_half / plays_first_half: success rate in the first two quarters. Null when the denominator is 0. |
| `pass_rate_second_half` | `number` | passes_second_half / plays_second_half. Null when the denominator is 0. |
| `epa_per_play_second_half` | `number` | epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `success_rate_second_half` | `number` | successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `pass_rate_d3_short` | `number` | passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_short` | `number` | epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `success_rate_d3_short` | `number` | successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `pass_rate_d3_medium` | `number` | passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_medium` | `number` | epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `success_rate_d3_medium` | `number` | successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `pass_rate_d3_long` | `number` | passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_long` | `number` | epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Null when the denominator is 0. |
| `success_rate_d3_long` | `number` | successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `pass_rate_red_zone` | `number` | passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `epa_per_play_red_zone` | `number` | epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `success_rate_red_zone` | `number` | successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `pass_rate_own_half` | `number` | passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_own_half` | `number` | epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_own_half` | `number` | successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_opp_half` | `number` | passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_opp_half` | `number` | epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_opp_half` | `number` | successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_one_score` | `number` | passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_one_score` | `number` | epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_one_score` | `number` | successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_home` | `number` | passes_home / plays_home: pass rate in the team's home games. Null when the denominator is 0. |
| `epa_per_play_home` | `number` | epa_home / plays_home: EPA per play in the team's home games. Null when the denominator is 0. |
| `success_rate_home` | `number` | successes_home / plays_home: success rate in the team's home games. Null when the denominator is 0. |
| `win_rate_home` | `number` | wins_home / games_home: win rate in the team's home games. Null when the denominator is 0. |
| `pass_rate_away` | `number` | passes_away / plays_away: pass rate in the team's away games. Null when the denominator is 0. |
| `epa_per_play_away` | `number` | epa_away / plays_away: EPA per play in the team's away games. Null when the denominator is 0. |
| `success_rate_away` | `number` | successes_away / plays_away: success rate in the team's away games. Null when the denominator is 0. |
| `win_rate_away` | `number` | wins_away / games_away: win rate in the team's away games. Null when the denominator is 0. |
| `pass_rate_neutral_site` | `number` | passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Null when the denominator is 0. |
| `epa_per_play_neutral_site` | `number` | epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Null when the denominator is 0. |
| `success_rate_neutral_site` | `number` | successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Null when the denominator is 0. |
| `win_rate_neutral_site` | `number` | wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Null when the denominator is 0. |
| `pass_rate_after_bye` | `number` | passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `epa_per_play_after_bye` | `number` | epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `success_rate_after_bye` | `number` | successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `win_rate_after_bye` | `number` | wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `pass_rate_opener` | `number` | passes_opener / plays_opener: pass rate in the team's regular-season openers. Null when the denominator is 0. |
| `epa_per_play_opener` | `number` | epa_opener / plays_opener: EPA per play in the team's regular-season openers. Null when the denominator is 0. |
| `success_rate_opener` | `number` | successes_opener / plays_opener: success rate in the team's regular-season openers. Null when the denominator is 0. |
| `win_rate_opener` | `number` | wins_opener / games_opener: win rate in the team's regular-season openers. Null when the denominator is 0. |
| `pass_rate_one_score_game` | `number` | passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `epa_per_play_one_score_game` | `number` | epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `success_rate_one_score_game` | `number` | successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `win_rate_one_score_game` | `number` | wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `ypp` | `number` | yards / plays: yards per play. Null when the denominator is 0. |
| `ypp_rush` | `number` | yards_rush / rushes: yards per rush. Null when the denominator is 0. |
| `ypp_pass` | `number` | yards_pass / passes: yards per pass play. Null when the denominator is 0. |
| `explosive_rate` | `number` | explosives / plays. Null when the denominator is 0. |
| `explosive_rate_rush` | `number` | explosives_rush / rushes. Null when the denominator is 0. |
| `explosive_rate_pass` | `number` | explosives_pass / passes. Null when the denominator is 0. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities. Null when the denominator is 0. |
| `rz_trip_rate` | `number` | rz_trips / drives: the share of drives that reached the red zone. Null when the denominator is 0. |
| `rz_td_rate` | `number` | rz_tds / rz_trips: touchdowns per red-zone trip. Null when the denominator is 0. |
| `rz_conversion_rate` | `number` | rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Null when the denominator is 0. |
| `rz_pts_per_trip` | `number` | rz_points / rz_trips: points per red-zone trip. Null when the denominator is 0. |
| `so_trip_rate` | `number` | so_trips / drives: the share of drives that reached the opponent's 40. Null when the denominator is 0. |
| `so_td_rate` | `number` | so_tds / so_trips: touchdowns per scoring-opportunity trip. Null when the denominator is 0. |
| `so_conversion_rate` | `number` | so_scores / so_trips: the share of scoring-opportunity trips that scored. Null when the denominator is 0. |
| `so_pts_per_trip` | `number` | so_points / so_trips: points per scoring-opportunity trip. Null when the denominator is 0. |
| `pts_per_drive` | `number` | drive_points / drives: points per drive. Null when the denominator is 0. |
| `scripted_epa_per_play` | `number` | scripted_epa / scripted_plays. Null when the denominator is 0. |
| `scripted_success_rate` | `number` | scripted_successes / scripted_plays. Null when the denominator is 0. |
| `scripted_pts_per_drive` | `number` | scripted_points / scripted_drives. Null when the denominator is 0. |
| `non_scripted_epa_per_play` | `number` | non_scripted_epa / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_success_rate` | `number` | non_scripted_successes / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_pts_per_drive` | `number` | non_scripted_points / non_scripted_drives. Null when the denominator is 0. |
| `go_rate` | `number` | fourth_went / fourth_decisions: the share of fourth-down decisions on which the offense went for it. Null when the denominator is 0. |
| `go_rate_when_model_says_go` | `number` | fourth_went_when_go / fourth_model_go: go rate on the decisions where the fourth-down model said go. Null when the denominator is 0. |
| `go_rate_when_model_says_kick` | `number` | fourth_went_when_kick / fourth_model_kick: go rate on the decisions where the model said punt or kick. Null when the denominator is 0. |
| `fourth_agreement_rate` | `number` | fourth_agreed / fourth_decisions: the share of decisions that matched the model. Null when the denominator is 0. |
| `fourth_wp_left_per_decision` | `number` | fourth_wp_left / fourth_decisions: win probability left on the table per fourth-down decision. Null when the denominator is 0. |
| `fourth_conversion_rate` | `number` | fourth_converted / fourth_went: conversion rate when going for it. Null when the denominator is 0. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `def_games` | `number` | Defense-allowed twin of games -- the same measure over the opposing offenses' plays while this coach's defense was on the field: distinct games in which the offense ran at least one standing scrimmage play. |
| `def_plays` | `number` | Defense-allowed twin of plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `def_rushes` | `number` | Defense-allowed twin of rushes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays among the standing scrimmage plays. |
| `def_passes` | `number` | Defense-allowed twin of passes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays among the standing scrimmage plays. |
| `def_epa` | `number` | Defense-allowed twin of epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the standing scrimmage plays. |
| `def_epa_rush` | `number` | Defense-allowed twin of epa_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the rushing plays. |
| `def_epa_pass` | `number` | Defense-allowed twin of epa_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the pass plays. |
| `def_successes` | `number` | Defense-allowed twin of successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on the play-by-play. |
| `def_successes_rush` | `number` | Defense-allowed twin of successes_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays flagged EPA_success. |
| `def_successes_pass` | `number` | Defense-allowed twin of successes_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays flagged EPA_success. |
| `def_yards` | `number` | Defense-allowed twin of yards -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the standing scrimmage plays. |
| `def_yards_rush` | `number` | Defense-allowed twin of yards_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the rushing plays. |
| `def_yards_pass` | `number` | Defense-allowed twin of yards_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the pass plays. |
| `def_explosives` | `number` | Defense-allowed twin of explosives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_explosive on the play-by-play. |
| `def_explosives_rush` | `number` | Defense-allowed twin of explosives_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays flagged EPA_explosive. |
| `def_explosives_pass` | `number` | Defense-allowed twin of explosives_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays flagged EPA_explosive. |
| `def_third_down_opportunities` | `number` | Defense-allowed twin of third_down_opportunities -- the same measure over the opposing offenses' plays while this coach's defense was on the field: third-down scrimmage plays. |
| `def_third_down_conversions` | `number` | Defense-allowed twin of third_down_conversions -- the same measure over the opposing offenses' plays while this coach's defense was on the field: third-down plays that produced a first down or an offensive touchdown. |
| `def_third_down_expected` | `number` | Defense-allowed twin of third_down_expected -- the same measure over the opposing offenses' plays while this coach's defense was on the field: expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `def_plays_neutral` | `number` | Defense-allowed twin of plays_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_passes_neutral` | `number` | Defense-allowed twin of passes_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in situation-neutral situations (see plays_neutral). |
| `def_epa_neutral` | `number` | Defense-allowed twin of epa_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_successes_neutral` | `number` | Defense-allowed twin of successes_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `def_plays_d1` | `number` | Defense-allowed twin of plays_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on first down. |
| `def_passes_d1` | `number` | Defense-allowed twin of passes_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on first down. |
| `def_epa_d1` | `number` | Defense-allowed twin of epa_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on first down. |
| `def_successes_d1` | `number` | Defense-allowed twin of successes_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on first down. |
| `def_plays_d2` | `number` | Defense-allowed twin of plays_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on second down. |
| `def_passes_d2` | `number` | Defense-allowed twin of passes_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on second down. |
| `def_epa_d2` | `number` | Defense-allowed twin of epa_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on second down. |
| `def_successes_d2` | `number` | Defense-allowed twin of successes_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on second down. |
| `def_plays_d3` | `number` | Defense-allowed twin of plays_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down. |
| `def_passes_d3` | `number` | Defense-allowed twin of passes_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down. |
| `def_epa_d3` | `number` | Defense-allowed twin of epa_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down. |
| `def_successes_d3` | `number` | Defense-allowed twin of successes_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down. |
| `def_plays_d4` | `number` | Defense-allowed twin of plays_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on fourth down. |
| `def_passes_d4` | `number` | Defense-allowed twin of passes_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on fourth down. |
| `def_epa_d4` | `number` | Defense-allowed twin of epa_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on fourth down. |
| `def_successes_d4` | `number` | Defense-allowed twin of successes_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on fourth down. |
| `def_plays_early_down` | `number` | Defense-allowed twin of plays_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on first or second down. |
| `def_passes_early_down` | `number` | Defense-allowed twin of passes_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on first or second down. |
| `def_epa_early_down` | `number` | Defense-allowed twin of epa_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the first- and second-down plays. |
| `def_successes_early_down` | `number` | Defense-allowed twin of successes_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on first or second down. |
| `def_plays_standard_down` | `number` | Defense-allowed twin of plays_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `def_passes_standard_down` | `number` | Defense-allowed twin of passes_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on standard downs (see plays_standard_down). |
| `def_epa_standard_down` | `number` | Defense-allowed twin of epa_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `def_successes_standard_down` | `number` | Defense-allowed twin of successes_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `def_plays_passing_down` | `number` | Defense-allowed twin of plays_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `def_passes_passing_down` | `number` | Defense-allowed twin of passes_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on passing downs (see plays_passing_down). |
| `def_epa_passing_down` | `number` | Defense-allowed twin of epa_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `def_successes_passing_down` | `number` | Defense-allowed twin of successes_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `def_plays_leading` | `number` | Defense-allowed twin of plays_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_leading` | `number` | Defense-allowed twin of passes_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_leading` | `number` | Defense-allowed twin of epa_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_leading` | `number` | Defense-allowed twin of successes_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_tied` | `number` | Defense-allowed twin of plays_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_tied` | `number` | Defense-allowed twin of passes_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_tied` | `number` | Defense-allowed twin of epa_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_tied` | `number` | Defense-allowed twin of successes_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_trailing` | `number` | Defense-allowed twin of plays_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_trailing` | `number` | Defense-allowed twin of passes_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_trailing` | `number` | Defense-allowed twin of epa_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_trailing` | `number` | Defense-allowed twin of successes_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_first_half` | `number` | Defense-allowed twin of plays_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the first two quarters. |
| `def_passes_first_half` | `number` | Defense-allowed twin of passes_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the first two quarters. |
| `def_epa_first_half` | `number` | Defense-allowed twin of epa_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the first two quarters. |
| `def_successes_first_half` | `number` | Defense-allowed twin of successes_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the first two quarters. |
| `def_plays_second_half` | `number` | Defense-allowed twin of plays_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_passes_second_half` | `number` | Defense-allowed twin of passes_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the third and fourth quarters. |
| `def_epa_second_half` | `number` | Defense-allowed twin of epa_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_successes_second_half` | `number` | Defense-allowed twin of successes_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `def_plays_d3_short` | `number` | Defense-allowed twin of plays_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 3 or fewer yards to go. |
| `def_passes_d3_short` | `number` | Defense-allowed twin of passes_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 3 or fewer yards to go. |
| `def_epa_d3_short` | `number` | Defense-allowed twin of epa_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `def_successes_d3_short` | `number` | Defense-allowed twin of successes_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `def_plays_d3_medium` | `number` | Defense-allowed twin of plays_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 4 to 6 yards to go. |
| `def_passes_d3_medium` | `number` | Defense-allowed twin of passes_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 4 to 6 yards to go. |
| `def_epa_d3_medium` | `number` | Defense-allowed twin of epa_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `def_successes_d3_medium` | `number` | Defense-allowed twin of successes_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `def_plays_d3_long` | `number` | Defense-allowed twin of plays_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 7 or more yards to go. |
| `def_passes_d3_long` | `number` | Defense-allowed twin of passes_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 7 or more yards to go. |
| `def_epa_d3_long` | `number` | Defense-allowed twin of epa_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 7 or more yards to go. |
| `def_successes_d3_long` | `number` | Defense-allowed twin of successes_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `def_plays_red_zone` | `number` | Defense-allowed twin of plays_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_passes_red_zone` | `number` | Defense-allowed twin of passes_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_epa_red_zone` | `number` | Defense-allowed twin of epa_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_successes_red_zone` | `number` | Defense-allowed twin of successes_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_plays_own_half` | `number` | Defense-allowed twin of plays_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_passes_own_half` | `number` | Defense-allowed twin of passes_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_epa_own_half` | `number` | Defense-allowed twin of epa_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_successes_own_half` | `number` | Defense-allowed twin of successes_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_plays_opp_half` | `number` | Defense-allowed twin of plays_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_passes_opp_half` | `number` | Defense-allowed twin of passes_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_epa_opp_half` | `number` | Defense-allowed twin of epa_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_successes_opp_half` | `number` | Defense-allowed twin of successes_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_plays_one_score` | `number` | Defense-allowed twin of plays_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_one_score` | `number` | Defense-allowed twin of passes_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_one_score` | `number` | Defense-allowed twin of epa_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_one_score` | `number` | Defense-allowed twin of successes_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_home` | `number` | Defense-allowed twin of plays_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's home games. |
| `def_passes_home` | `number` | Defense-allowed twin of passes_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's home games. |
| `def_epa_home` | `number` | Defense-allowed twin of epa_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's home games. |
| `def_successes_home` | `number` | Defense-allowed twin of successes_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's home games. |
| `def_games_home` | `number` | Defense-allowed twin of games_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct home games in which the offense ran at least one standing scrimmage play. |
| `def_wins_home` | `number` | Defense-allowed twin of wins_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `def_plays_away` | `number` | Defense-allowed twin of plays_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's away games. |
| `def_passes_away` | `number` | Defense-allowed twin of passes_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's away games. |
| `def_epa_away` | `number` | Defense-allowed twin of epa_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's away games. |
| `def_successes_away` | `number` | Defense-allowed twin of successes_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's away games. |
| `def_games_away` | `number` | Defense-allowed twin of games_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct away games in which the offense ran at least one standing scrimmage play. |
| `def_wins_away` | `number` | Defense-allowed twin of wins_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `def_plays_neutral_site` | `number` | Defense-allowed twin of plays_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's neutral-site games. |
| `def_passes_neutral_site` | `number` | Defense-allowed twin of passes_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's neutral-site games. |
| `def_epa_neutral_site` | `number` | Defense-allowed twin of epa_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's neutral-site games. |
| `def_successes_neutral_site` | `number` | Defense-allowed twin of successes_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `def_games_neutral_site` | `number` | Defense-allowed twin of games_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `def_wins_neutral_site` | `number` | Defense-allowed twin of wins_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `def_plays_after_bye` | `number` | Defense-allowed twin of plays_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games played 13 or more days after the team's previous game. |
| `def_passes_after_bye` | `number` | Defense-allowed twin of passes_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games played 13 or more days after the team's previous game. |
| `def_epa_after_bye` | `number` | Defense-allowed twin of epa_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `def_successes_after_bye` | `number` | Defense-allowed twin of successes_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `def_games_after_bye` | `number` | Defense-allowed twin of games_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `def_wins_after_bye` | `number` | Defense-allowed twin of wins_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `def_plays_opener` | `number` | Defense-allowed twin of plays_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's regular-season openers. |
| `def_passes_opener` | `number` | Defense-allowed twin of passes_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's regular-season openers. |
| `def_epa_opener` | `number` | Defense-allowed twin of epa_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's regular-season openers. |
| `def_successes_opener` | `number` | Defense-allowed twin of successes_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `def_games_opener` | `number` | Defense-allowed twin of games_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `def_wins_opener` | `number` | Defense-allowed twin of wins_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `def_plays_one_score_game` | `number` | Defense-allowed twin of plays_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games decided by 8 points or fewer. |
| `def_passes_one_score_game` | `number` | Defense-allowed twin of passes_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games decided by 8 points or fewer. |
| `def_epa_one_score_game` | `number` | Defense-allowed twin of epa_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `def_successes_one_score_game` | `number` | Defense-allowed twin of successes_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `def_games_one_score_game` | `number` | Defense-allowed twin of games_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `def_wins_one_score_game` | `number` | Defense-allowed twin of wins_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `def_drives` | `number` | Defense-allowed twin of drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `def_drives_with_clock` | `number` | Defense-allowed twin of drives_with_clock -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays). |
| `def_drive_seconds` | `number` | Defense-allowed twin of drive_seconds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `def_drive_plays` | `number` | Defense-allowed twin of drive_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `def_drive_seconds_neutral` | `number` | Defense-allowed twin of drive_seconds_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_plays_neutral` | `number` | Defense-allowed twin of drive_plays_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_points` | `number` | Defense-allowed twin of drive_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `def_rz_trips` | `number` | Defense-allowed twin of rz_trips -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `def_rz_tds` | `number` | Defense-allowed twin of rz_tds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: red-zone drives that included an offensive touchdown play. |
| `def_rz_scores` | `number` | Defense-allowed twin of rz_scores -- the same measure over the opposing offenses' plays while this coach's defense was on the field: red-zone drives that scored (a touchdown or a field goal). |
| `def_rz_points` | `number` | Defense-allowed twin of rz_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `def_so_trips` | `number` | Defense-allowed twin of so_trips -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `def_so_tds` | `number` | Defense-allowed twin of so_tds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: scoring-opportunity drives that included an offensive touchdown play. |
| `def_so_scores` | `number` | Defense-allowed twin of so_scores -- the same measure over the opposing offenses' plays while this coach's defense was on the field: scoring-opportunity drives that scored (a touchdown or a field goal). |
| `def_so_points` | `number` | Defense-allowed twin of so_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `def_scripted_drives` | `number` | Defense-allowed twin of scripted_drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: the offense's first two drives of each half. |
| `def_scripted_plays` | `number` | Defense-allowed twin of scripted_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays on the scripted drives. |
| `def_scripted_epa` | `number` | Defense-allowed twin of scripted_epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the scripted drives. |
| `def_scripted_successes` | `number` | Defense-allowed twin of scripted_successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success on the scripted drives. |
| `def_scripted_points` | `number` | Defense-allowed twin of scripted_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `def_non_scripted_drives` | `number` | Defense-allowed twin of non_scripted_drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: every drive after the offense's first two of each half. |
| `def_non_scripted_plays` | `number` | Defense-allowed twin of non_scripted_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays on the non-scripted drives. |
| `def_non_scripted_epa` | `number` | Defense-allowed twin of non_scripted_epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the non-scripted drives. |
| `def_non_scripted_successes` | `number` | Defense-allowed twin of non_scripted_successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success on the non-scripted drives. |
| `def_non_scripted_points` | `number` | Defense-allowed twin of non_scripted_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `def_plays_per_game` | `number` | Defense-allowed twin of plays_per_game: plays / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_plays_per_drive` | `number` | Defense-allowed twin of plays_per_drive: plays / drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_drives_per_game` | `number` | Defense-allowed twin of drives_per_game: drives / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play` | `number` | Defense-allowed twin of sec_per_play: drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play_neutral` | `number` | Defense-allowed twin of sec_per_play_neutral: drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_pace_coverage` | `number` | Defense-allowed twin of pace_coverage: drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate` | `number` | Defense-allowed twin of pass_rate: passes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play` | `number` | Defense-allowed twin of epa_per_play: epa / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_rush` | `number` | Defense-allowed twin of epa_per_rush: epa_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_pass` | `number` | Defense-allowed twin of epa_per_pass: epa_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate` | `number` | Defense-allowed twin of success_rate: successes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_rush` | `number` | Defense-allowed twin of success_rate_rush: successes_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_pass` | `number` | Defense-allowed twin of success_rate_pass: successes_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral` | `number` | Defense-allowed twin of pass_rate_neutral: passes_neutral / plays_neutral: pass rate in situation-neutral situations. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral` | `number` | Defense-allowed twin of epa_per_play_neutral: epa_neutral / plays_neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral` | `number` | Defense-allowed twin of success_rate_neutral: successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d1` | `number` | Defense-allowed twin of pass_rate_d1: passes_d1 / plays_d1: pass rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d1` | `number` | Defense-allowed twin of epa_per_play_d1: epa_d1 / plays_d1: EPA per play on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d1` | `number` | Defense-allowed twin of success_rate_d1: successes_d1 / plays_d1: success rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d2` | `number` | Defense-allowed twin of pass_rate_d2: passes_d2 / plays_d2: pass rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d2` | `number` | Defense-allowed twin of epa_per_play_d2: epa_d2 / plays_d2: EPA per play on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d2` | `number` | Defense-allowed twin of success_rate_d2: successes_d2 / plays_d2: success rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3` | `number` | Defense-allowed twin of pass_rate_d3: passes_d3 / plays_d3: pass rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3` | `number` | Defense-allowed twin of epa_per_play_d3: epa_d3 / plays_d3: EPA per play on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3` | `number` | Defense-allowed twin of success_rate_d3: successes_d3 / plays_d3: success rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d4` | `number` | Defense-allowed twin of pass_rate_d4: passes_d4 / plays_d4: pass rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d4` | `number` | Defense-allowed twin of epa_per_play_d4: epa_d4 / plays_d4: EPA per play on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d4` | `number` | Defense-allowed twin of success_rate_d4: successes_d4 / plays_d4: success rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_early_down` | `number` | Defense-allowed twin of pass_rate_early_down: passes_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_early_down` | `number` | Defense-allowed twin of epa_per_play_early_down: epa_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_early_down` | `number` | Defense-allowed twin of success_rate_early_down: successes_early_down / plays_early_down: success rate on first or second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_standard_down` | `number` | Defense-allowed twin of pass_rate_standard_down: passes_standard_down / plays_standard_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_standard_down` | `number` | Defense-allowed twin of epa_per_play_standard_down: epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_standard_down` | `number` | Defense-allowed twin of success_rate_standard_down: successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_passing_down` | `number` | Defense-allowed twin of pass_rate_passing_down: passes_passing_down / plays_passing_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_passing_down` | `number` | Defense-allowed twin of epa_per_play_passing_down: epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_passing_down` | `number` | Defense-allowed twin of success_rate_passing_down: successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_leading` | `number` | Defense-allowed twin of pass_rate_leading: passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_leading` | `number` | Defense-allowed twin of epa_per_play_leading: epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_leading` | `number` | Defense-allowed twin of success_rate_leading: successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_tied` | `number` | Defense-allowed twin of pass_rate_tied: passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_tied` | `number` | Defense-allowed twin of epa_per_play_tied: epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_tied` | `number` | Defense-allowed twin of success_rate_tied: successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_trailing` | `number` | Defense-allowed twin of pass_rate_trailing: passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_trailing` | `number` | Defense-allowed twin of epa_per_play_trailing: epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_trailing` | `number` | Defense-allowed twin of success_rate_trailing: successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_first_half` | `number` | Defense-allowed twin of pass_rate_first_half: passes_first_half / plays_first_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_first_half` | `number` | Defense-allowed twin of epa_per_play_first_half: epa_first_half / plays_first_half: EPA per play in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_first_half` | `number` | Defense-allowed twin of success_rate_first_half: successes_first_half / plays_first_half: success rate in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_second_half` | `number` | Defense-allowed twin of pass_rate_second_half: passes_second_half / plays_second_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_second_half` | `number` | Defense-allowed twin of epa_per_play_second_half: epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_second_half` | `number` | Defense-allowed twin of success_rate_second_half: successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_short` | `number` | Defense-allowed twin of pass_rate_d3_short: passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_short` | `number` | Defense-allowed twin of epa_per_play_d3_short: epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_short` | `number` | Defense-allowed twin of success_rate_d3_short: successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_medium` | `number` | Defense-allowed twin of pass_rate_d3_medium: passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_medium` | `number` | Defense-allowed twin of epa_per_play_d3_medium: epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_medium` | `number` | Defense-allowed twin of success_rate_d3_medium: successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_long` | `number` | Defense-allowed twin of pass_rate_d3_long: passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_long` | `number` | Defense-allowed twin of epa_per_play_d3_long: epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_long` | `number` | Defense-allowed twin of success_rate_d3_long: successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_red_zone` | `number` | Defense-allowed twin of pass_rate_red_zone: passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_red_zone` | `number` | Defense-allowed twin of epa_per_play_red_zone: epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_red_zone` | `number` | Defense-allowed twin of success_rate_red_zone: successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_own_half` | `number` | Defense-allowed twin of pass_rate_own_half: passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_own_half` | `number` | Defense-allowed twin of epa_per_play_own_half: epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_own_half` | `number` | Defense-allowed twin of success_rate_own_half: successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opp_half` | `number` | Defense-allowed twin of pass_rate_opp_half: passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opp_half` | `number` | Defense-allowed twin of epa_per_play_opp_half: epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opp_half` | `number` | Defense-allowed twin of success_rate_opp_half: successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score` | `number` | Defense-allowed twin of pass_rate_one_score: passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score` | `number` | Defense-allowed twin of epa_per_play_one_score: epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score` | `number` | Defense-allowed twin of success_rate_one_score: successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_home` | `number` | Defense-allowed twin of pass_rate_home: passes_home / plays_home: pass rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_home` | `number` | Defense-allowed twin of epa_per_play_home: epa_home / plays_home: EPA per play in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_home` | `number` | Defense-allowed twin of success_rate_home: successes_home / plays_home: success rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_home` | `number` | Defense-allowed twin of win_rate_home: wins_home / games_home: win rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_away` | `number` | Defense-allowed twin of pass_rate_away: passes_away / plays_away: pass rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_away` | `number` | Defense-allowed twin of epa_per_play_away: epa_away / plays_away: EPA per play in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_away` | `number` | Defense-allowed twin of success_rate_away: successes_away / plays_away: success rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_away` | `number` | Defense-allowed twin of win_rate_away: wins_away / games_away: win rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral_site` | `number` | Defense-allowed twin of pass_rate_neutral_site: passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral_site` | `number` | Defense-allowed twin of epa_per_play_neutral_site: epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral_site` | `number` | Defense-allowed twin of success_rate_neutral_site: successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_neutral_site` | `number` | Defense-allowed twin of win_rate_neutral_site: wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_after_bye` | `number` | Defense-allowed twin of pass_rate_after_bye: passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_after_bye` | `number` | Defense-allowed twin of epa_per_play_after_bye: epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_after_bye` | `number` | Defense-allowed twin of success_rate_after_bye: successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_after_bye` | `number` | Defense-allowed twin of win_rate_after_bye: wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opener` | `number` | Defense-allowed twin of pass_rate_opener: passes_opener / plays_opener: pass rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opener` | `number` | Defense-allowed twin of epa_per_play_opener: epa_opener / plays_opener: EPA per play in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opener` | `number` | Defense-allowed twin of success_rate_opener: successes_opener / plays_opener: success rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_opener` | `number` | Defense-allowed twin of win_rate_opener: wins_opener / games_opener: win rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score_game` | `number` | Defense-allowed twin of pass_rate_one_score_game: passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score_game` | `number` | Defense-allowed twin of epa_per_play_one_score_game: epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score_game` | `number` | Defense-allowed twin of success_rate_one_score_game: successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_one_score_game` | `number` | Defense-allowed twin of win_rate_one_score_game: wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp` | `number` | Defense-allowed twin of ypp: yards / plays: yards per play. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_rush` | `number` | Defense-allowed twin of ypp_rush: yards_rush / rushes: yards per rush. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_pass` | `number` | Defense-allowed twin of ypp_pass: yards_pass / passes: yards per pass play. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate` | `number` | Defense-allowed twin of explosive_rate: explosives / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_rush` | `number` | Defense-allowed twin of explosive_rate_rush: explosives_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_pass` | `number` | Defense-allowed twin of explosive_rate_pass: explosives_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_rate` | `number` | Defense-allowed twin of third_down_rate: third_down_conversions / third_down_opportunities. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_trip_rate` | `number` | Defense-allowed twin of rz_trip_rate: rz_trips / drives: the share of drives that reached the red zone. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_td_rate` | `number` | Defense-allowed twin of rz_td_rate: rz_tds / rz_trips: touchdowns per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_conversion_rate` | `number` | Defense-allowed twin of rz_conversion_rate: rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_pts_per_trip` | `number` | Defense-allowed twin of rz_pts_per_trip: rz_points / rz_trips: points per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_trip_rate` | `number` | Defense-allowed twin of so_trip_rate: so_trips / drives: the share of drives that reached the opponent's 40. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_td_rate` | `number` | Defense-allowed twin of so_td_rate: so_tds / so_trips: touchdowns per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_conversion_rate` | `number` | Defense-allowed twin of so_conversion_rate: so_scores / so_trips: the share of scoring-opportunity trips that scored. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_pts_per_trip` | `number` | Defense-allowed twin of so_pts_per_trip: so_points / so_trips: points per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_pts_per_drive` | `number` | Defense-allowed twin of pts_per_drive: drive_points / drives: points per drive. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_epa_per_play` | `number` | Defense-allowed twin of scripted_epa_per_play: scripted_epa / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_success_rate` | `number` | Defense-allowed twin of scripted_success_rate: scripted_successes / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_pts_per_drive` | `number` | Defense-allowed twin of scripted_pts_per_drive: scripted_points / scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_epa_per_play` | `number` | Defense-allowed twin of non_scripted_epa_per_play: non_scripted_epa / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_success_rate` | `number` | Defense-allowed twin of non_scripted_success_rate: non_scripted_successes / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_pts_per_drive` | `number` | Defense-allowed twin of non_scripted_pts_per_drive: non_scripted_points / non_scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_over_expected` | `number` | Defense-allowed twin of third_down_over_expected: def_third_down_conversions minus def_third_down_expected; null when no curve was available. |

## `loadNflCoachCareers`

Release: [espn_nfl_coach_careers](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/espn_nfl_coach_careers) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nfl_coach_careers/coach_careers.parquet`

:::caution[Coverage]
One season-less file: every published coach_tendencies season summed per head coach with the rates recomputed (play-weighted, never averaged averages). Careers therefore cover exactly the seasons published under the coach_tendencies tag.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflCoachCareers();
// snake_case alias (py/R parity): sdv.nfl.load_nfl_coach_careers(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflCoachCareersRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `coach` | `string` | Head coach the plays were attributed to -- per game from the nflverse schedule (home_coach / away_coach) for the NFL, per team-season from the producer's CFBD coach roster for CFB. |
| `role` | `string` | Coaching role the row is keyed on; always "HC" (head coach) in the published assets, reserved for later coordinator rows. |
| `teams` | `string` | Comma-separated teams the coach's attributed seasons were with, in first-to-last season order. |
| `seasons` | `number` | Number of distinct seasons summed into the career row. |
| `first_season` | `number \| bigint` | Earliest season summed into the career row. |
| `last_season` | `number \| bigint` | Latest season summed into the career row. |
| `games` | `number` | Distinct games in which the offense ran at least one standing scrimmage play. Summed over the coach's published seasons, like every count here. |
| `plays` | `number` | Standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `rushes` | `number` | Rushing plays among the standing scrimmage plays. |
| `passes` | `number` | Pass plays among the standing scrimmage plays. |
| `epa` | `number` | Play EPA summed over the standing scrimmage plays. |
| `epa_rush` | `number` | Play EPA summed over the rushing plays. |
| `epa_pass` | `number` | Play EPA summed over the pass plays. |
| `successes` | `number` | Plays flagged EPA_success (positive EPA) on the play-by-play. |
| `successes_rush` | `number` | Rushing plays flagged EPA_success. |
| `successes_pass` | `number` | Pass plays flagged EPA_success. |
| `yards` | `number` | statYardage summed over the standing scrimmage plays. |
| `yards_rush` | `number` | statYardage summed over the rushing plays. |
| `yards_pass` | `number` | statYardage summed over the pass plays. |
| `explosives` | `number` | Plays flagged EPA_explosive on the play-by-play. |
| `explosives_rush` | `number` | Rushing plays flagged EPA_explosive. |
| `explosives_pass` | `number` | Pass plays flagged EPA_explosive. |
| `third_down_opportunities` | `number` | Third-down scrimmage plays. |
| `third_down_conversions` | `number` | Third-down plays that produced a first down or an offensive touchdown. |
| `third_down_expected` | `number` | Expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `plays_neutral` | `number` | Plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `passes_neutral` | `number` | Pass plays in situation-neutral situations (see plays_neutral). |
| `epa_neutral` | `number` | Play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `successes_neutral` | `number` | Plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `plays_d1` | `number` | Plays on first down. |
| `passes_d1` | `number` | Pass plays on first down. |
| `epa_d1` | `number` | Play EPA summed over the plays on first down. |
| `successes_d1` | `number` | Plays flagged EPA_success (positive EPA) on first down. |
| `plays_d2` | `number` | Plays on second down. |
| `passes_d2` | `number` | Pass plays on second down. |
| `epa_d2` | `number` | Play EPA summed over the plays on second down. |
| `successes_d2` | `number` | Plays flagged EPA_success (positive EPA) on second down. |
| `plays_d3` | `number` | Plays on third down. |
| `passes_d3` | `number` | Pass plays on third down. |
| `epa_d3` | `number` | Play EPA summed over the plays on third down. |
| `successes_d3` | `number` | Plays flagged EPA_success (positive EPA) on third down. |
| `plays_d4` | `number` | Plays on fourth down. |
| `passes_d4` | `number` | Pass plays on fourth down. |
| `epa_d4` | `number` | Play EPA summed over the plays on fourth down. |
| `successes_d4` | `number` | Plays flagged EPA_success (positive EPA) on fourth down. |
| `plays_early_down` | `number` | Plays on first or second down. |
| `passes_early_down` | `number` | Pass plays on first or second down. |
| `epa_early_down` | `number` | Play EPA summed over the first- and second-down plays. |
| `successes_early_down` | `number` | Plays flagged EPA_success (positive EPA) on first or second down. |
| `plays_standard_down` | `number` | Plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `passes_standard_down` | `number` | Pass plays on standard downs (see plays_standard_down). |
| `epa_standard_down` | `number` | Play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `successes_standard_down` | `number` | Plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `plays_passing_down` | `number` | Plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `passes_passing_down` | `number` | Pass plays on passing downs (see plays_passing_down). |
| `epa_passing_down` | `number` | Play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `successes_passing_down` | `number` | Plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `plays_leading` | `number` | Plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_leading` | `number` | Pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_leading` | `number` | Play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_leading` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_tied` | `number` | Plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_tied` | `number` | Pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_tied` | `number` | Play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_tied` | `number` | Plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_trailing` | `number` | Plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_trailing` | `number` | Pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_trailing` | `number` | Play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_trailing` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_first_half` | `number` | Plays in the first two quarters. |
| `passes_first_half` | `number` | Pass plays in the first two quarters. |
| `epa_first_half` | `number` | Play EPA summed over the plays in the first two quarters. |
| `successes_first_half` | `number` | Plays flagged EPA_success (positive EPA) in the first two quarters. |
| `plays_second_half` | `number` | Plays in the third and fourth quarters (overtime belongs to neither half). |
| `passes_second_half` | `number` | Pass plays in the third and fourth quarters. |
| `epa_second_half` | `number` | Play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `successes_second_half` | `number` | Plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `plays_d3_short` | `number` | Plays on third down with 3 or fewer yards to go. |
| `passes_d3_short` | `number` | Pass plays on third down with 3 or fewer yards to go. |
| `epa_d3_short` | `number` | Play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `successes_d3_short` | `number` | Plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `plays_d3_medium` | `number` | Plays on third down with 4 to 6 yards to go. |
| `passes_d3_medium` | `number` | Pass plays on third down with 4 to 6 yards to go. |
| `epa_d3_medium` | `number` | Play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `successes_d3_medium` | `number` | Plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `plays_d3_long` | `number` | Plays on third down with 7 or more yards to go. |
| `passes_d3_long` | `number` | Pass plays on third down with 7 or more yards to go. |
| `epa_d3_long` | `number` | Play EPA summed over the plays on third down with 7 or more yards to go. |
| `successes_d3_long` | `number` | Plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `plays_red_zone` | `number` | Plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `passes_red_zone` | `number` | Pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `epa_red_zone` | `number` | Play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `successes_red_zone` | `number` | Plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `plays_own_half` | `number` | Plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `passes_own_half` | `number` | Pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `epa_own_half` | `number` | Play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `successes_own_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `plays_opp_half` | `number` | Plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `passes_opp_half` | `number` | Pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `epa_opp_half` | `number` | Play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `successes_opp_half` | `number` | Plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `plays_one_score` | `number` | Plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `passes_one_score` | `number` | Pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `epa_one_score` | `number` | Play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `successes_one_score` | `number` | Plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `plays_home` | `number` | Plays in the team's home games. |
| `passes_home` | `number` | Pass plays in the team's home games. |
| `epa_home` | `number` | Play EPA summed over the plays in the team's home games. |
| `successes_home` | `number` | Plays flagged EPA_success (positive EPA) in the team's home games. |
| `games_home` | `number` | Distinct home games in which the offense ran at least one standing scrimmage play. |
| `wins_home` | `number` | Of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `plays_away` | `number` | Plays in the team's away games. |
| `passes_away` | `number` | Pass plays in the team's away games. |
| `epa_away` | `number` | Play EPA summed over the plays in the team's away games. |
| `successes_away` | `number` | Plays flagged EPA_success (positive EPA) in the team's away games. |
| `games_away` | `number` | Distinct away games in which the offense ran at least one standing scrimmage play. |
| `wins_away` | `number` | Of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `plays_neutral_site` | `number` | Plays in the team's neutral-site games. |
| `passes_neutral_site` | `number` | Pass plays in the team's neutral-site games. |
| `epa_neutral_site` | `number` | Play EPA summed over the plays in the team's neutral-site games. |
| `successes_neutral_site` | `number` | Plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `games_neutral_site` | `number` | Distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `wins_neutral_site` | `number` | Of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `plays_after_bye` | `number` | Plays in the team's games played 13 or more days after the team's previous game. |
| `passes_after_bye` | `number` | Pass plays in the team's games played 13 or more days after the team's previous game. |
| `epa_after_bye` | `number` | Play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `successes_after_bye` | `number` | Plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `games_after_bye` | `number` | Distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `wins_after_bye` | `number` | Of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `plays_opener` | `number` | Plays in the team's regular-season openers. |
| `passes_opener` | `number` | Pass plays in the team's regular-season openers. |
| `epa_opener` | `number` | Play EPA summed over the plays in the team's regular-season openers. |
| `successes_opener` | `number` | Plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `games_opener` | `number` | Distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `wins_opener` | `number` | Of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `plays_one_score_game` | `number` | Plays in the team's games decided by 8 points or fewer. |
| `passes_one_score_game` | `number` | Pass plays in the team's games decided by 8 points or fewer. |
| `epa_one_score_game` | `number` | Play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `successes_one_score_game` | `number` | Plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `games_one_score_game` | `number` | Distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `wins_one_score_game` | `number` | Of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `fourth_decisions` | `number` | Fourth-down plays on which the offense ran, passed, punted or attempted a field goal and the play stood (timeouts and nullified plays are not decisions). |
| `fourth_went` | `number` | Fourth-down decisions that were a rush or a pass (the offense went for it). |
| `fourth_converted` | `number` | Fourth-down go attempts that produced a first down or an offensive touchdown. |
| `fourth_model_go` | `number` | Decisions on which the fourth-down model recommended going for it (fourth_down_recommendation == "go"). |
| `fourth_model_kick` | `number` | Decisions on which the fourth-down model recommended a punt or a field goal. |
| `fourth_went_when_go` | `number` | Decisions on which the offense went for it when the model also said go. |
| `fourth_went_when_kick` | `number` | Decisions on which the offense went for it when the model said kick. |
| `fourth_agreed` | `number` | Decisions that matched the model's recommendation (went when it said go, kicked when it said kick). |
| `fourth_wp_left` | `number` | Win probability left on the table, summed over the decisions that went against the model: go_boost when the offense kicked against a go recommendation, minus go_boost when it went against a kick recommendation, floored at zero. |
| `drives` | `number` | Offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `drives_with_clock` | `number` | Drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays), in regulation (overtime has no game clock) and owned by this offense (an ESPN drive id that holds snaps by both offenses counts once, for ESPN's drive team when it matches an offense in the drive, else the offense with the most standing snaps, the first snap breaking a tie). |
| `drive_seconds` | `number` | ESPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `drive_plays` | `number` | ESPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `drive_seconds_neutral` | `number` | ESPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `drive_plays_neutral` | `number` | ESPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `drive_points` | `number` | Drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `rz_trips` | `number` | Drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `rz_tds` | `number` | Red-zone drives that included an offensive touchdown play. |
| `rz_scores` | `number` | Red-zone drives that scored (a touchdown or a field goal). |
| `rz_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `so_trips` | `number` | Drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `so_tds` | `number` | Scoring-opportunity drives that included an offensive touchdown play. |
| `so_scores` | `number` | Scoring-opportunity drives that scored (a touchdown or a field goal). |
| `so_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `scripted_drives` | `number` | The offense's first two drives of each half. |
| `scripted_plays` | `number` | Standing scrimmage plays on the scripted drives. |
| `scripted_epa` | `number` | Play EPA summed over the scripted drives. |
| `scripted_successes` | `number` | Plays flagged EPA_success on the scripted drives. |
| `scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `non_scripted_drives` | `number` | Every drive after the offense's first two of each half. |
| `non_scripted_plays` | `number` | Standing scrimmage plays on the non-scripted drives. |
| `non_scripted_epa` | `number` | Play EPA summed over the non-scripted drives. |
| `non_scripted_successes` | `number` | Plays flagged EPA_success on the non-scripted drives. |
| `non_scripted_points` | `number` | Drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `def_games` | `number` | Defense-allowed twin of games -- the same measure over the opposing offenses' plays while this coach's defense was on the field: distinct games in which the offense ran at least one standing scrimmage play. |
| `def_plays` | `number` | Defense-allowed twin of plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays run by the offense (scrimmage_play rows not nullified by penalty). |
| `def_rushes` | `number` | Defense-allowed twin of rushes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays among the standing scrimmage plays. |
| `def_passes` | `number` | Defense-allowed twin of passes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays among the standing scrimmage plays. |
| `def_epa` | `number` | Defense-allowed twin of epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the standing scrimmage plays. |
| `def_epa_rush` | `number` | Defense-allowed twin of epa_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the rushing plays. |
| `def_epa_pass` | `number` | Defense-allowed twin of epa_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the pass plays. |
| `def_successes` | `number` | Defense-allowed twin of successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on the play-by-play. |
| `def_successes_rush` | `number` | Defense-allowed twin of successes_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays flagged EPA_success. |
| `def_successes_pass` | `number` | Defense-allowed twin of successes_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays flagged EPA_success. |
| `def_yards` | `number` | Defense-allowed twin of yards -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the standing scrimmage plays. |
| `def_yards_rush` | `number` | Defense-allowed twin of yards_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the rushing plays. |
| `def_yards_pass` | `number` | Defense-allowed twin of yards_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: statYardage summed over the pass plays. |
| `def_explosives` | `number` | Defense-allowed twin of explosives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_explosive on the play-by-play. |
| `def_explosives_rush` | `number` | Defense-allowed twin of explosives_rush -- the same measure over the opposing offenses' plays while this coach's defense was on the field: rushing plays flagged EPA_explosive. |
| `def_explosives_pass` | `number` | Defense-allowed twin of explosives_pass -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays flagged EPA_explosive. |
| `def_third_down_opportunities` | `number` | Defense-allowed twin of third_down_opportunities -- the same measure over the opposing offenses' plays while this coach's defense was on the field: third-down scrimmage plays. |
| `def_third_down_conversions` | `number` | Defense-allowed twin of third_down_conversions -- the same measure over the opposing offenses' plays while this coach's defense was on the field: third-down plays that produced a first down or an offensive touchdown. |
| `def_third_down_expected` | `number` | Defense-allowed twin of third_down_expected -- the same measure over the opposing offenses' plays while this coach's defense was on the field: expected third-down conversions: the league's bundled third-down yards-to-go conversion curve summed over the third-down plays; null when no curve was available. |
| `def_plays_neutral` | `number` | Defense-allowed twin of plays_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_passes_neutral` | `number` | Defense-allowed twin of passes_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in situation-neutral situations (see plays_neutral). |
| `def_epa_neutral` | `number` | Defense-allowed twin of epa_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over situation-neutral plays: score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half. |
| `def_successes_neutral` | `number` | Defense-allowed twin of successes_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). |
| `def_plays_d1` | `number` | Defense-allowed twin of plays_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on first down. |
| `def_passes_d1` | `number` | Defense-allowed twin of passes_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on first down. |
| `def_epa_d1` | `number` | Defense-allowed twin of epa_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on first down. |
| `def_successes_d1` | `number` | Defense-allowed twin of successes_d1 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on first down. |
| `def_plays_d2` | `number` | Defense-allowed twin of plays_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on second down. |
| `def_passes_d2` | `number` | Defense-allowed twin of passes_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on second down. |
| `def_epa_d2` | `number` | Defense-allowed twin of epa_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on second down. |
| `def_successes_d2` | `number` | Defense-allowed twin of successes_d2 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on second down. |
| `def_plays_d3` | `number` | Defense-allowed twin of plays_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down. |
| `def_passes_d3` | `number` | Defense-allowed twin of passes_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down. |
| `def_epa_d3` | `number` | Defense-allowed twin of epa_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down. |
| `def_successes_d3` | `number` | Defense-allowed twin of successes_d3 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down. |
| `def_plays_d4` | `number` | Defense-allowed twin of plays_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on fourth down. |
| `def_passes_d4` | `number` | Defense-allowed twin of passes_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on fourth down. |
| `def_epa_d4` | `number` | Defense-allowed twin of epa_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on fourth down. |
| `def_successes_d4` | `number` | Defense-allowed twin of successes_d4 -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on fourth down. |
| `def_plays_early_down` | `number` | Defense-allowed twin of plays_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on first or second down. |
| `def_passes_early_down` | `number` | Defense-allowed twin of passes_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on first or second down. |
| `def_epa_early_down` | `number` | Defense-allowed twin of epa_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the first- and second-down plays. |
| `def_successes_early_down` | `number` | Defense-allowed twin of successes_early_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on first or second down. |
| `def_plays_standard_down` | `number` | Defense-allowed twin of plays_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged standard_down on the play-by-play: first down, second down with fewer than 8 to go, or third / fourth down with fewer than 5 to go. |
| `def_passes_standard_down` | `number` | Defense-allowed twin of passes_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on standard downs (see plays_standard_down). |
| `def_epa_standard_down` | `number` | Defense-allowed twin of epa_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on standard downs (the play-by-play standard_down flag). |
| `def_successes_standard_down` | `number` | Defense-allowed twin of successes_standard_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on standard downs (the play-by-play standard_down flag). |
| `def_plays_passing_down` | `number` | Defense-allowed twin of plays_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged passing_down on the play-by-play: second down with 8 or more to go, or third / fourth down with 5 or more to go. |
| `def_passes_passing_down` | `number` | Defense-allowed twin of passes_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on passing downs (see plays_passing_down). |
| `def_epa_passing_down` | `number` | Defense-allowed twin of epa_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on passing downs (the play-by-play passing_down flag). |
| `def_successes_passing_down` | `number` | Defense-allowed twin of successes_passing_down -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on passing downs (the play-by-play passing_down flag). |
| `def_plays_leading` | `number` | Defense-allowed twin of plays_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_leading` | `number` | Defense-allowed twin of passes_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_leading` | `number` | Defense-allowed twin of epa_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_leading` | `number` | Defense-allowed twin of successes_leading -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_tied` | `number` | Defense-allowed twin of plays_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_tied` | `number` | Defense-allowed twin of passes_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_tied` | `number` | Defense-allowed twin of epa_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_tied` | `number` | Defense-allowed twin of successes_tied -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_trailing` | `number` | Defense-allowed twin of plays_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_trailing` | `number` | Defense-allowed twin of passes_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_trailing` | `number` | Defense-allowed twin of epa_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_trailing` | `number` | Defense-allowed twin of successes_trailing -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_first_half` | `number` | Defense-allowed twin of plays_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the first two quarters. |
| `def_passes_first_half` | `number` | Defense-allowed twin of passes_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the first two quarters. |
| `def_epa_first_half` | `number` | Defense-allowed twin of epa_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the first two quarters. |
| `def_successes_first_half` | `number` | Defense-allowed twin of successes_first_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the first two quarters. |
| `def_plays_second_half` | `number` | Defense-allowed twin of plays_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_passes_second_half` | `number` | Defense-allowed twin of passes_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the third and fourth quarters. |
| `def_epa_second_half` | `number` | Defense-allowed twin of epa_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the third and fourth quarters (overtime belongs to neither half). |
| `def_successes_second_half` | `number` | Defense-allowed twin of successes_second_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the third and fourth quarters (overtime belongs to neither half). |
| `def_plays_d3_short` | `number` | Defense-allowed twin of plays_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 3 or fewer yards to go. |
| `def_passes_d3_short` | `number` | Defense-allowed twin of passes_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 3 or fewer yards to go. |
| `def_epa_d3_short` | `number` | Defense-allowed twin of epa_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 3 or fewer yards to go. |
| `def_successes_d3_short` | `number` | Defense-allowed twin of successes_d3_short -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 3 or fewer yards to go. |
| `def_plays_d3_medium` | `number` | Defense-allowed twin of plays_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 4 to 6 yards to go. |
| `def_passes_d3_medium` | `number` | Defense-allowed twin of passes_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 4 to 6 yards to go. |
| `def_epa_d3_medium` | `number` | Defense-allowed twin of epa_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 4 to 6 yards to go. |
| `def_successes_d3_medium` | `number` | Defense-allowed twin of successes_d3_medium -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 4 to 6 yards to go. |
| `def_plays_d3_long` | `number` | Defense-allowed twin of plays_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays on third down with 7 or more yards to go. |
| `def_passes_d3_long` | `number` | Defense-allowed twin of passes_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays on third down with 7 or more yards to go. |
| `def_epa_d3_long` | `number` | Defense-allowed twin of epa_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays on third down with 7 or more yards to go. |
| `def_successes_d3_long` | `number` | Defense-allowed twin of successes_d3_long -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) on third down with 7 or more yards to go. |
| `def_plays_red_zone` | `number` | Defense-allowed twin of plays_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_passes_red_zone` | `number` | Defense-allowed twin of passes_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_epa_red_zone` | `number` | Defense-allowed twin of epa_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_successes_red_zone` | `number` | Defense-allowed twin of successes_red_zone -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). |
| `def_plays_own_half` | `number` | Defense-allowed twin of plays_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_passes_own_half` | `number` | Defense-allowed twin of passes_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_epa_own_half` | `number` | Defense-allowed twin of epa_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_successes_own_half` | `number` | Defense-allowed twin of successes_own_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the offense's own half (50 or more yards from the opponent end zone). |
| `def_plays_opp_half` | `number` | Defense-allowed twin of plays_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_passes_opp_half` | `number` | Defense-allowed twin of passes_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_epa_opp_half` | `number` | Defense-allowed twin of epa_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_successes_opp_half` | `number` | Defense-allowed twin of successes_opp_half -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped in the opponent's half (fewer than 50 yards from the opponent end zone). |
| `def_plays_one_score` | `number` | Defense-allowed twin of plays_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_passes_one_score` | `number` | Defense-allowed twin of passes_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: pass plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_epa_one_score` | `number` | Defense-allowed twin of epa_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the plays snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_successes_one_score` | `number` | Defense-allowed twin of successes_one_score -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success (positive EPA) snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). |
| `def_plays_home` | `number` | Defense-allowed twin of plays_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's home games. |
| `def_passes_home` | `number` | Defense-allowed twin of passes_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's home games. |
| `def_epa_home` | `number` | Defense-allowed twin of epa_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's home games. |
| `def_successes_home` | `number` | Defense-allowed twin of successes_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's home games. |
| `def_games_home` | `number` | Defense-allowed twin of games_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct home games in which the offense ran at least one standing scrimmage play. |
| `def_wins_home` | `number` | Defense-allowed twin of wins_home -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_home, the home games the team won (points for above points against, so a tie is not a win). |
| `def_plays_away` | `number` | Defense-allowed twin of plays_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's away games. |
| `def_passes_away` | `number` | Defense-allowed twin of passes_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's away games. |
| `def_epa_away` | `number` | Defense-allowed twin of epa_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's away games. |
| `def_successes_away` | `number` | Defense-allowed twin of successes_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's away games. |
| `def_games_away` | `number` | Defense-allowed twin of games_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct away games in which the offense ran at least one standing scrimmage play. |
| `def_wins_away` | `number` | Defense-allowed twin of wins_away -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_away, the away games the team won (points for above points against, so a tie is not a win). |
| `def_plays_neutral_site` | `number` | Defense-allowed twin of plays_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's neutral-site games. |
| `def_passes_neutral_site` | `number` | Defense-allowed twin of passes_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's neutral-site games. |
| `def_epa_neutral_site` | `number` | Defense-allowed twin of epa_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's neutral-site games. |
| `def_successes_neutral_site` | `number` | Defense-allowed twin of successes_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's neutral-site games. |
| `def_games_neutral_site` | `number` | Defense-allowed twin of games_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct neutral-site games in which the offense ran at least one standing scrimmage play. |
| `def_wins_neutral_site` | `number` | Defense-allowed twin of wins_neutral_site -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_neutral_site, the neutral-site games the team won (points for above points against, so a tie is not a win). |
| `def_plays_after_bye` | `number` | Defense-allowed twin of plays_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games played 13 or more days after the team's previous game. |
| `def_passes_after_bye` | `number` | Defense-allowed twin of passes_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games played 13 or more days after the team's previous game. |
| `def_epa_after_bye` | `number` | Defense-allowed twin of epa_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games played 13 or more days after the team's previous game. |
| `def_successes_after_bye` | `number` | Defense-allowed twin of successes_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games played 13 or more days after the team's previous game. |
| `def_games_after_bye` | `number` | Defense-allowed twin of games_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games played 13 or more days after the team's previous game in which the offense ran at least one standing scrimmage play. |
| `def_wins_after_bye` | `number` | Defense-allowed twin of wins_after_bye -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_after_bye, the games played 13 or more days after the team's previous game the team won (points for above points against, so a tie is not a win). |
| `def_plays_opener` | `number` | Defense-allowed twin of plays_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's regular-season openers. |
| `def_passes_opener` | `number` | Defense-allowed twin of passes_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's regular-season openers. |
| `def_epa_opener` | `number` | Defense-allowed twin of epa_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's regular-season openers. |
| `def_successes_opener` | `number` | Defense-allowed twin of successes_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's regular-season openers. |
| `def_games_opener` | `number` | Defense-allowed twin of games_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct regular-season openers in which the offense ran at least one standing scrimmage play. |
| `def_wins_opener` | `number` | Defense-allowed twin of wins_opener -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_opener, the regular-season openers the team won (points for above points against, so a tie is not a win). |
| `def_plays_one_score_game` | `number` | Defense-allowed twin of plays_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays in the team's games decided by 8 points or fewer. |
| `def_passes_one_score_game` | `number` | Defense-allowed twin of passes_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): pass plays in the team's games decided by 8 points or fewer. |
| `def_epa_one_score_game` | `number` | Defense-allowed twin of epa_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): play EPA summed over the plays in the team's games decided by 8 points or fewer. |
| `def_successes_one_score_game` | `number` | Defense-allowed twin of successes_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): plays flagged EPA_success (positive EPA) in the team's games decided by 8 points or fewer. |
| `def_games_one_score_game` | `number` | Defense-allowed twin of games_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): distinct games decided by 8 points or fewer in which the offense ran at least one standing scrimmage play. |
| `def_wins_one_score_game` | `number` | Defense-allowed twin of wins_one_score_game -- the same measure over the opposing offenses' plays while this coach's defense was on the field, with the game context read from the defending team's side (def_ctx_*): of games_one_score_game, the games decided by 8 points or fewer the team won (points for above points against, so a tie is not a win). |
| `def_drives` | `number` | Defense-allowed twin of drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: offensive drives: distinct drive.id values with at least one standing scrimmage play. |
| `def_drives_with_clock` | `number` | Defense-allowed twin of drives_with_clock -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with a usable ESPN drive clock (a parseable drive.timeElapsed and a positive drive.offensivePlays). |
| `def_drive_seconds` | `number` | Defense-allowed twin of drive_seconds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN elapsed drive time in seconds, summed over the drives with a usable clock. |
| `def_drive_plays` | `number` | Defense-allowed twin of drive_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN drive.offensivePlays summed over the drives with a usable clock -- the pace denominator. |
| `def_drive_seconds_neutral` | `number` | Defense-allowed twin of drive_seconds_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN elapsed drive seconds summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_plays_neutral` | `number` | Defense-allowed twin of drive_plays_neutral -- the same measure over the opposing offenses' plays while this coach's defense was on the field: eSPN drive.offensivePlays summed over the clocked drives whose first play was situation-neutral. |
| `def_drive_points` | `number` | Defense-allowed twin of drive_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3, from drive.result) summed over the drives. |
| `def_rz_trips` | `number` | Defense-allowed twin of rz_trips -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with at least one play snapped in the red zone (20 or fewer yards to the end zone). |
| `def_rz_tds` | `number` | Defense-allowed twin of rz_tds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: red-zone drives that included an offensive touchdown play. |
| `def_rz_scores` | `number` | Defense-allowed twin of rz_scores -- the same measure over the opposing offenses' plays while this coach's defense was on the field: red-zone drives that scored (a touchdown or a field goal). |
| `def_rz_points` | `number` | Defense-allowed twin of rz_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the red-zone drives. |
| `def_so_trips` | `number` | Defense-allowed twin of so_trips -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drives with at least one play snapped in scoring-opportunity territory (40 or fewer yards to the end zone). |
| `def_so_tds` | `number` | Defense-allowed twin of so_tds -- the same measure over the opposing offenses' plays while this coach's defense was on the field: scoring-opportunity drives that included an offensive touchdown play. |
| `def_so_scores` | `number` | Defense-allowed twin of so_scores -- the same measure over the opposing offenses' plays while this coach's defense was on the field: scoring-opportunity drives that scored (a touchdown or a field goal). |
| `def_so_points` | `number` | Defense-allowed twin of so_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scoring-opportunity drives. |
| `def_scripted_drives` | `number` | Defense-allowed twin of scripted_drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: the offense's first two drives of each half. |
| `def_scripted_plays` | `number` | Defense-allowed twin of scripted_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays on the scripted drives. |
| `def_scripted_epa` | `number` | Defense-allowed twin of scripted_epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the scripted drives. |
| `def_scripted_successes` | `number` | Defense-allowed twin of scripted_successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success on the scripted drives. |
| `def_scripted_points` | `number` | Defense-allowed twin of scripted_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the scripted drives. |
| `def_non_scripted_drives` | `number` | Defense-allowed twin of non_scripted_drives -- the same measure over the opposing offenses' plays while this coach's defense was on the field: every drive after the offense's first two of each half. |
| `def_non_scripted_plays` | `number` | Defense-allowed twin of non_scripted_plays -- the same measure over the opposing offenses' plays while this coach's defense was on the field: standing scrimmage plays on the non-scripted drives. |
| `def_non_scripted_epa` | `number` | Defense-allowed twin of non_scripted_epa -- the same measure over the opposing offenses' plays while this coach's defense was on the field: play EPA summed over the non-scripted drives. |
| `def_non_scripted_successes` | `number` | Defense-allowed twin of non_scripted_successes -- the same measure over the opposing offenses' plays while this coach's defense was on the field: plays flagged EPA_success on the non-scripted drives. |
| `def_non_scripted_points` | `number` | Defense-allowed twin of non_scripted_points -- the same measure over the opposing offenses' plays while this coach's defense was on the field: drive points (touchdown 7, field goal 3) summed over the non-scripted drives. |
| `plays_per_game` | `number` | plays / games. Null when the denominator is 0. |
| `plays_per_drive` | `number` | plays / drives. Null when the denominator is 0. |
| `drives_per_game` | `number` | drives / games. Null when the denominator is 0. |
| `sec_per_play` | `number` | drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Null when the denominator is 0. |
| `sec_per_play_neutral` | `number` | drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Null when the denominator is 0. |
| `pace_coverage` | `number` | drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Null when the denominator is 0. |
| `pass_rate` | `number` | passes / plays. Null when the denominator is 0. |
| `epa_per_play` | `number` | epa / plays. Null when the denominator is 0. |
| `epa_per_rush` | `number` | epa_rush / rushes. Null when the denominator is 0. |
| `epa_per_pass` | `number` | epa_pass / passes. Null when the denominator is 0. |
| `success_rate` | `number` | successes / plays. Null when the denominator is 0. |
| `success_rate_rush` | `number` | successes_rush / rushes. Null when the denominator is 0. |
| `success_rate_pass` | `number` | successes_pass / passes. Null when the denominator is 0. |
| `pass_rate_neutral` | `number` | passes_neutral / plays_neutral: pass rate in situation-neutral situations. Null when the denominator is 0. |
| `epa_per_play_neutral` | `number` | epa_neutral / plays_neutral. Null when the denominator is 0. |
| `success_rate_neutral` | `number` | successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Null when the denominator is 0. |
| `pass_rate_d1` | `number` | passes_d1 / plays_d1: pass rate on first down. Null when the denominator is 0. |
| `epa_per_play_d1` | `number` | epa_d1 / plays_d1: EPA per play on first down. Null when the denominator is 0. |
| `success_rate_d1` | `number` | successes_d1 / plays_d1: success rate on first down. Null when the denominator is 0. |
| `pass_rate_d2` | `number` | passes_d2 / plays_d2: pass rate on second down. Null when the denominator is 0. |
| `epa_per_play_d2` | `number` | epa_d2 / plays_d2: EPA per play on second down. Null when the denominator is 0. |
| `success_rate_d2` | `number` | successes_d2 / plays_d2: success rate on second down. Null when the denominator is 0. |
| `pass_rate_d3` | `number` | passes_d3 / plays_d3: pass rate on third down. Null when the denominator is 0. |
| `epa_per_play_d3` | `number` | epa_d3 / plays_d3: EPA per play on third down. Null when the denominator is 0. |
| `success_rate_d3` | `number` | successes_d3 / plays_d3: success rate on third down. Null when the denominator is 0. |
| `pass_rate_d4` | `number` | passes_d4 / plays_d4: pass rate on fourth down. Null when the denominator is 0. |
| `epa_per_play_d4` | `number` | epa_d4 / plays_d4: EPA per play on fourth down. Null when the denominator is 0. |
| `success_rate_d4` | `number` | successes_d4 / plays_d4: success rate on fourth down. Null when the denominator is 0. |
| `pass_rate_early_down` | `number` | passes_early_down / plays_early_down. Null when the denominator is 0. |
| `epa_per_play_early_down` | `number` | epa_early_down / plays_early_down. Null when the denominator is 0. |
| `success_rate_early_down` | `number` | successes_early_down / plays_early_down: success rate on first or second down. Null when the denominator is 0. |
| `pass_rate_standard_down` | `number` | passes_standard_down / plays_standard_down. Null when the denominator is 0. |
| `epa_per_play_standard_down` | `number` | epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `success_rate_standard_down` | `number` | successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Null when the denominator is 0. |
| `pass_rate_passing_down` | `number` | passes_passing_down / plays_passing_down. Null when the denominator is 0. |
| `epa_per_play_passing_down` | `number` | epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `success_rate_passing_down` | `number` | successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Null when the denominator is 0. |
| `pass_rate_leading` | `number` | passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_leading` | `number` | epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_leading` | `number` | successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_tied` | `number` | passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_tied` | `number` | epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_tied` | `number` | successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_trailing` | `number` | passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_trailing` | `number` | epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_trailing` | `number` | successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_first_half` | `number` | passes_first_half / plays_first_half. Null when the denominator is 0. |
| `epa_per_play_first_half` | `number` | epa_first_half / plays_first_half: EPA per play in the first two quarters. Null when the denominator is 0. |
| `success_rate_first_half` | `number` | successes_first_half / plays_first_half: success rate in the first two quarters. Null when the denominator is 0. |
| `pass_rate_second_half` | `number` | passes_second_half / plays_second_half. Null when the denominator is 0. |
| `epa_per_play_second_half` | `number` | epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `success_rate_second_half` | `number` | successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Null when the denominator is 0. |
| `pass_rate_d3_short` | `number` | passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_short` | `number` | epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `success_rate_d3_short` | `number` | successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Null when the denominator is 0. |
| `pass_rate_d3_medium` | `number` | passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_medium` | `number` | epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `success_rate_d3_medium` | `number` | successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Null when the denominator is 0. |
| `pass_rate_d3_long` | `number` | passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `epa_per_play_d3_long` | `number` | epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Null when the denominator is 0. |
| `success_rate_d3_long` | `number` | successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Null when the denominator is 0. |
| `pass_rate_red_zone` | `number` | passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `epa_per_play_red_zone` | `number` | epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `success_rate_red_zone` | `number` | successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Null when the denominator is 0. |
| `pass_rate_own_half` | `number` | passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_own_half` | `number` | epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_own_half` | `number` | successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_opp_half` | `number` | passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `epa_per_play_opp_half` | `number` | epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `success_rate_opp_half` | `number` | successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Null when the denominator is 0. |
| `pass_rate_one_score` | `number` | passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `epa_per_play_one_score` | `number` | epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `success_rate_one_score` | `number` | successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Null when the denominator is 0. |
| `pass_rate_home` | `number` | passes_home / plays_home: pass rate in the team's home games. Null when the denominator is 0. |
| `epa_per_play_home` | `number` | epa_home / plays_home: EPA per play in the team's home games. Null when the denominator is 0. |
| `success_rate_home` | `number` | successes_home / plays_home: success rate in the team's home games. Null when the denominator is 0. |
| `win_rate_home` | `number` | wins_home / games_home: win rate in the team's home games. Null when the denominator is 0. |
| `pass_rate_away` | `number` | passes_away / plays_away: pass rate in the team's away games. Null when the denominator is 0. |
| `epa_per_play_away` | `number` | epa_away / plays_away: EPA per play in the team's away games. Null when the denominator is 0. |
| `success_rate_away` | `number` | successes_away / plays_away: success rate in the team's away games. Null when the denominator is 0. |
| `win_rate_away` | `number` | wins_away / games_away: win rate in the team's away games. Null when the denominator is 0. |
| `pass_rate_neutral_site` | `number` | passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Null when the denominator is 0. |
| `epa_per_play_neutral_site` | `number` | epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Null when the denominator is 0. |
| `success_rate_neutral_site` | `number` | successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Null when the denominator is 0. |
| `win_rate_neutral_site` | `number` | wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Null when the denominator is 0. |
| `pass_rate_after_bye` | `number` | passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `epa_per_play_after_bye` | `number` | epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `success_rate_after_bye` | `number` | successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `win_rate_after_bye` | `number` | wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Null when the denominator is 0. |
| `pass_rate_opener` | `number` | passes_opener / plays_opener: pass rate in the team's regular-season openers. Null when the denominator is 0. |
| `epa_per_play_opener` | `number` | epa_opener / plays_opener: EPA per play in the team's regular-season openers. Null when the denominator is 0. |
| `success_rate_opener` | `number` | successes_opener / plays_opener: success rate in the team's regular-season openers. Null when the denominator is 0. |
| `win_rate_opener` | `number` | wins_opener / games_opener: win rate in the team's regular-season openers. Null when the denominator is 0. |
| `pass_rate_one_score_game` | `number` | passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `epa_per_play_one_score_game` | `number` | epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `success_rate_one_score_game` | `number` | successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `win_rate_one_score_game` | `number` | wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Null when the denominator is 0. |
| `ypp` | `number` | yards / plays: yards per play. Null when the denominator is 0. |
| `ypp_rush` | `number` | yards_rush / rushes: yards per rush. Null when the denominator is 0. |
| `ypp_pass` | `number` | yards_pass / passes: yards per pass play. Null when the denominator is 0. |
| `explosive_rate` | `number` | explosives / plays. Null when the denominator is 0. |
| `explosive_rate_rush` | `number` | explosives_rush / rushes. Null when the denominator is 0. |
| `explosive_rate_pass` | `number` | explosives_pass / passes. Null when the denominator is 0. |
| `third_down_rate` | `number` | third_down_conversions / third_down_opportunities. Null when the denominator is 0. |
| `rz_trip_rate` | `number` | rz_trips / drives: the share of drives that reached the red zone. Null when the denominator is 0. |
| `rz_td_rate` | `number` | rz_tds / rz_trips: touchdowns per red-zone trip. Null when the denominator is 0. |
| `rz_conversion_rate` | `number` | rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Null when the denominator is 0. |
| `rz_pts_per_trip` | `number` | rz_points / rz_trips: points per red-zone trip. Null when the denominator is 0. |
| `so_trip_rate` | `number` | so_trips / drives: the share of drives that reached the opponent's 40. Null when the denominator is 0. |
| `so_td_rate` | `number` | so_tds / so_trips: touchdowns per scoring-opportunity trip. Null when the denominator is 0. |
| `so_conversion_rate` | `number` | so_scores / so_trips: the share of scoring-opportunity trips that scored. Null when the denominator is 0. |
| `so_pts_per_trip` | `number` | so_points / so_trips: points per scoring-opportunity trip. Null when the denominator is 0. |
| `pts_per_drive` | `number` | drive_points / drives: points per drive. Null when the denominator is 0. |
| `scripted_epa_per_play` | `number` | scripted_epa / scripted_plays. Null when the denominator is 0. |
| `scripted_success_rate` | `number` | scripted_successes / scripted_plays. Null when the denominator is 0. |
| `scripted_pts_per_drive` | `number` | scripted_points / scripted_drives. Null when the denominator is 0. |
| `non_scripted_epa_per_play` | `number` | non_scripted_epa / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_success_rate` | `number` | non_scripted_successes / non_scripted_plays. Null when the denominator is 0. |
| `non_scripted_pts_per_drive` | `number` | non_scripted_points / non_scripted_drives. Null when the denominator is 0. |
| `go_rate` | `number` | fourth_went / fourth_decisions: the share of fourth-down decisions on which the offense went for it. Null when the denominator is 0. |
| `go_rate_when_model_says_go` | `number` | fourth_went_when_go / fourth_model_go: go rate on the decisions where the fourth-down model said go. Null when the denominator is 0. |
| `go_rate_when_model_says_kick` | `number` | fourth_went_when_kick / fourth_model_kick: go rate on the decisions where the model said punt or kick. Null when the denominator is 0. |
| `fourth_agreement_rate` | `number` | fourth_agreed / fourth_decisions: the share of decisions that matched the model. Null when the denominator is 0. |
| `fourth_wp_left_per_decision` | `number` | fourth_wp_left / fourth_decisions: win probability left on the table per fourth-down decision. Null when the denominator is 0. |
| `fourth_conversion_rate` | `number` | fourth_converted / fourth_went: conversion rate when going for it. Null when the denominator is 0. |
| `third_down_over_expected` | `number` | third_down_conversions minus third_down_expected: conversions above the distance-adjusted expectation; null when no curve was available. |
| `def_plays_per_game` | `number` | Defense-allowed twin of plays_per_game: plays / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_plays_per_drive` | `number` | Defense-allowed twin of plays_per_drive: plays / drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_drives_per_game` | `number` | Defense-allowed twin of drives_per_game: drives / games. Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play` | `number` | Defense-allowed twin of sec_per_play: drive_seconds / drive_plays: seconds of game clock per offensive play from ESPN's own drive clock (pace; lower is faster). Computed from the def_ counts; null when the denominator is 0. |
| `def_sec_per_play_neutral` | `number` | Defense-allowed twin of sec_per_play_neutral: drive_seconds_neutral / drive_plays_neutral: the same pace measure on drives that started situation-neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_pace_coverage` | `number` | Defense-allowed twin of pace_coverage: drives_with_clock / drives: the share of drives with a usable clock; treat sec_per_play with caution when this is low. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate` | `number` | Defense-allowed twin of pass_rate: passes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play` | `number` | Defense-allowed twin of epa_per_play: epa / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_rush` | `number` | Defense-allowed twin of epa_per_rush: epa_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_pass` | `number` | Defense-allowed twin of epa_per_pass: epa_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate` | `number` | Defense-allowed twin of success_rate: successes / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_rush` | `number` | Defense-allowed twin of success_rate_rush: successes_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_pass` | `number` | Defense-allowed twin of success_rate_pass: successes_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral` | `number` | Defense-allowed twin of pass_rate_neutral: passes_neutral / plays_neutral: pass rate in situation-neutral situations. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral` | `number` | Defense-allowed twin of epa_per_play_neutral: epa_neutral / plays_neutral. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral` | `number` | Defense-allowed twin of success_rate_neutral: successes_neutral / plays_neutral: success rate in situation-neutral situations (score-and-clock win probability (wp_before_naive, no pregame line) between 20% and 80%, in the first four quarters, outside the final two minutes of a half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d1` | `number` | Defense-allowed twin of pass_rate_d1: passes_d1 / plays_d1: pass rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d1` | `number` | Defense-allowed twin of epa_per_play_d1: epa_d1 / plays_d1: EPA per play on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d1` | `number` | Defense-allowed twin of success_rate_d1: successes_d1 / plays_d1: success rate on first down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d2` | `number` | Defense-allowed twin of pass_rate_d2: passes_d2 / plays_d2: pass rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d2` | `number` | Defense-allowed twin of epa_per_play_d2: epa_d2 / plays_d2: EPA per play on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d2` | `number` | Defense-allowed twin of success_rate_d2: successes_d2 / plays_d2: success rate on second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3` | `number` | Defense-allowed twin of pass_rate_d3: passes_d3 / plays_d3: pass rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3` | `number` | Defense-allowed twin of epa_per_play_d3: epa_d3 / plays_d3: EPA per play on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3` | `number` | Defense-allowed twin of success_rate_d3: successes_d3 / plays_d3: success rate on third down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d4` | `number` | Defense-allowed twin of pass_rate_d4: passes_d4 / plays_d4: pass rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d4` | `number` | Defense-allowed twin of epa_per_play_d4: epa_d4 / plays_d4: EPA per play on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d4` | `number` | Defense-allowed twin of success_rate_d4: successes_d4 / plays_d4: success rate on fourth down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_early_down` | `number` | Defense-allowed twin of pass_rate_early_down: passes_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_early_down` | `number` | Defense-allowed twin of epa_per_play_early_down: epa_early_down / plays_early_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_early_down` | `number` | Defense-allowed twin of success_rate_early_down: successes_early_down / plays_early_down: success rate on first or second down. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_standard_down` | `number` | Defense-allowed twin of pass_rate_standard_down: passes_standard_down / plays_standard_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_standard_down` | `number` | Defense-allowed twin of epa_per_play_standard_down: epa_standard_down / plays_standard_down: EPA per play on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_standard_down` | `number` | Defense-allowed twin of success_rate_standard_down: successes_standard_down / plays_standard_down: success rate on standard downs (the play-by-play standard_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_passing_down` | `number` | Defense-allowed twin of pass_rate_passing_down: passes_passing_down / plays_passing_down. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_passing_down` | `number` | Defense-allowed twin of epa_per_play_passing_down: epa_passing_down / plays_passing_down: EPA per play on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_passing_down` | `number` | Defense-allowed twin of success_rate_passing_down: successes_passing_down / plays_passing_down: success rate on passing downs (the play-by-play passing_down flag). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_leading` | `number` | Defense-allowed twin of pass_rate_leading: passes_leading / plays_leading: pass rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_leading` | `number` | Defense-allowed twin of epa_per_play_leading: epa_leading / plays_leading: EPA per play snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_leading` | `number` | Defense-allowed twin of success_rate_leading: successes_leading / plays_leading: success rate snapped with the offense ahead on the scoreboard (pos_score_diff_start \> 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_tied` | `number` | Defense-allowed twin of pass_rate_tied: passes_tied / plays_tied: pass rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_tied` | `number` | Defense-allowed twin of epa_per_play_tied: epa_tied / plays_tied: EPA per play snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_tied` | `number` | Defense-allowed twin of success_rate_tied: successes_tied / plays_tied: success rate snapped with the score tied (pos_score_diff_start == 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_trailing` | `number` | Defense-allowed twin of pass_rate_trailing: passes_trailing / plays_trailing: pass rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_trailing` | `number` | Defense-allowed twin of epa_per_play_trailing: epa_trailing / plays_trailing: EPA per play snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_trailing` | `number` | Defense-allowed twin of success_rate_trailing: successes_trailing / plays_trailing: success rate snapped with the offense behind on the scoreboard (pos_score_diff_start \< 0, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_first_half` | `number` | Defense-allowed twin of pass_rate_first_half: passes_first_half / plays_first_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_first_half` | `number` | Defense-allowed twin of epa_per_play_first_half: epa_first_half / plays_first_half: EPA per play in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_first_half` | `number` | Defense-allowed twin of success_rate_first_half: successes_first_half / plays_first_half: success rate in the first two quarters. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_second_half` | `number` | Defense-allowed twin of pass_rate_second_half: passes_second_half / plays_second_half. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_second_half` | `number` | Defense-allowed twin of epa_per_play_second_half: epa_second_half / plays_second_half: EPA per play in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_second_half` | `number` | Defense-allowed twin of success_rate_second_half: successes_second_half / plays_second_half: success rate in the third and fourth quarters (overtime belongs to neither half). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_short` | `number` | Defense-allowed twin of pass_rate_d3_short: passes_d3_short / plays_d3_short: pass rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_short` | `number` | Defense-allowed twin of epa_per_play_d3_short: epa_d3_short / plays_d3_short: EPA per play on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_short` | `number` | Defense-allowed twin of success_rate_d3_short: successes_d3_short / plays_d3_short: success rate on third down with 3 or fewer yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_medium` | `number` | Defense-allowed twin of pass_rate_d3_medium: passes_d3_medium / plays_d3_medium: pass rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_medium` | `number` | Defense-allowed twin of epa_per_play_d3_medium: epa_d3_medium / plays_d3_medium: EPA per play on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_medium` | `number` | Defense-allowed twin of success_rate_d3_medium: successes_d3_medium / plays_d3_medium: success rate on third down with 4 to 6 yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_d3_long` | `number` | Defense-allowed twin of pass_rate_d3_long: passes_d3_long / plays_d3_long: pass rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_d3_long` | `number` | Defense-allowed twin of epa_per_play_d3_long: epa_d3_long / plays_d3_long: EPA per play on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_d3_long` | `number` | Defense-allowed twin of success_rate_d3_long: successes_d3_long / plays_d3_long: success rate on third down with 7 or more yards to go. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_red_zone` | `number` | Defense-allowed twin of pass_rate_red_zone: passes_red_zone / plays_red_zone: pass rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_red_zone` | `number` | Defense-allowed twin of epa_per_play_red_zone: epa_red_zone / plays_red_zone: EPA per play in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_red_zone` | `number` | Defense-allowed twin of success_rate_red_zone: successes_red_zone / plays_red_zone: success rate in the red zone (20 or fewer yards from the opponent end zone, read from yards to goal rather than the absolute yard line; the play-by-play rz_play flag only when that distance is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_own_half` | `number` | Defense-allowed twin of pass_rate_own_half: passes_own_half / plays_own_half: pass rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_own_half` | `number` | Defense-allowed twin of epa_per_play_own_half: epa_own_half / plays_own_half: EPA per play snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_own_half` | `number` | Defense-allowed twin of success_rate_own_half: successes_own_half / plays_own_half: success rate snapped in the offense's own half (50 or more yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opp_half` | `number` | Defense-allowed twin of pass_rate_opp_half: passes_opp_half / plays_opp_half: pass rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opp_half` | `number` | Defense-allowed twin of epa_per_play_opp_half: epa_opp_half / plays_opp_half: EPA per play snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opp_half` | `number` | Defense-allowed twin of success_rate_opp_half: successes_opp_half / plays_opp_half: success rate snapped in the opponent's half (fewer than 50 yards from the opponent end zone). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score` | `number` | Defense-allowed twin of pass_rate_one_score: passes_one_score / plays_one_score: pass rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score` | `number` | Defense-allowed twin of epa_per_play_one_score: epa_one_score / plays_one_score: EPA per play snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score` | `number` | Defense-allowed twin of success_rate_one_score: successes_one_score / plays_one_score: success rate snapped with the offense within 8 points either way (\|pos_score_diff_start\| \<= 8, the score at the snap, before the play; pos_score_diff where the start score is missing). Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_home` | `number` | Defense-allowed twin of pass_rate_home: passes_home / plays_home: pass rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_home` | `number` | Defense-allowed twin of epa_per_play_home: epa_home / plays_home: EPA per play in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_home` | `number` | Defense-allowed twin of success_rate_home: successes_home / plays_home: success rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_home` | `number` | Defense-allowed twin of win_rate_home: wins_home / games_home: win rate in the team's home games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_away` | `number` | Defense-allowed twin of pass_rate_away: passes_away / plays_away: pass rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_away` | `number` | Defense-allowed twin of epa_per_play_away: epa_away / plays_away: EPA per play in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_away` | `number` | Defense-allowed twin of success_rate_away: successes_away / plays_away: success rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_away` | `number` | Defense-allowed twin of win_rate_away: wins_away / games_away: win rate in the team's away games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_neutral_site` | `number` | Defense-allowed twin of pass_rate_neutral_site: passes_neutral_site / plays_neutral_site: pass rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_neutral_site` | `number` | Defense-allowed twin of epa_per_play_neutral_site: epa_neutral_site / plays_neutral_site: EPA per play in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_neutral_site` | `number` | Defense-allowed twin of success_rate_neutral_site: successes_neutral_site / plays_neutral_site: success rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_neutral_site` | `number` | Defense-allowed twin of win_rate_neutral_site: wins_neutral_site / games_neutral_site: win rate in the team's neutral-site games. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_after_bye` | `number` | Defense-allowed twin of pass_rate_after_bye: passes_after_bye / plays_after_bye: pass rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_after_bye` | `number` | Defense-allowed twin of epa_per_play_after_bye: epa_after_bye / plays_after_bye: EPA per play in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_after_bye` | `number` | Defense-allowed twin of success_rate_after_bye: successes_after_bye / plays_after_bye: success rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_after_bye` | `number` | Defense-allowed twin of win_rate_after_bye: wins_after_bye / games_after_bye: win rate in the team's games played 13 or more days after the team's previous game. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_opener` | `number` | Defense-allowed twin of pass_rate_opener: passes_opener / plays_opener: pass rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_opener` | `number` | Defense-allowed twin of epa_per_play_opener: epa_opener / plays_opener: EPA per play in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_opener` | `number` | Defense-allowed twin of success_rate_opener: successes_opener / plays_opener: success rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_opener` | `number` | Defense-allowed twin of win_rate_opener: wins_opener / games_opener: win rate in the team's regular-season openers. Computed from the def_ counts; null when the denominator is 0. |
| `def_pass_rate_one_score_game` | `number` | Defense-allowed twin of pass_rate_one_score_game: passes_one_score_game / plays_one_score_game: pass rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_epa_per_play_one_score_game` | `number` | Defense-allowed twin of epa_per_play_one_score_game: epa_one_score_game / plays_one_score_game: EPA per play in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_success_rate_one_score_game` | `number` | Defense-allowed twin of success_rate_one_score_game: successes_one_score_game / plays_one_score_game: success rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_win_rate_one_score_game` | `number` | Defense-allowed twin of win_rate_one_score_game: wins_one_score_game / games_one_score_game: win rate in the team's games decided by 8 points or fewer. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp` | `number` | Defense-allowed twin of ypp: yards / plays: yards per play. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_rush` | `number` | Defense-allowed twin of ypp_rush: yards_rush / rushes: yards per rush. Computed from the def_ counts; null when the denominator is 0. |
| `def_ypp_pass` | `number` | Defense-allowed twin of ypp_pass: yards_pass / passes: yards per pass play. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate` | `number` | Defense-allowed twin of explosive_rate: explosives / plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_rush` | `number` | Defense-allowed twin of explosive_rate_rush: explosives_rush / rushes. Computed from the def_ counts; null when the denominator is 0. |
| `def_explosive_rate_pass` | `number` | Defense-allowed twin of explosive_rate_pass: explosives_pass / passes. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_rate` | `number` | Defense-allowed twin of third_down_rate: third_down_conversions / third_down_opportunities. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_trip_rate` | `number` | Defense-allowed twin of rz_trip_rate: rz_trips / drives: the share of drives that reached the red zone. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_td_rate` | `number` | Defense-allowed twin of rz_td_rate: rz_tds / rz_trips: touchdowns per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_conversion_rate` | `number` | Defense-allowed twin of rz_conversion_rate: rz_scores / rz_trips: the share of red-zone trips that scored (touchdown or field goal). Computed from the def_ counts; null when the denominator is 0. |
| `def_rz_pts_per_trip` | `number` | Defense-allowed twin of rz_pts_per_trip: rz_points / rz_trips: points per red-zone trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_trip_rate` | `number` | Defense-allowed twin of so_trip_rate: so_trips / drives: the share of drives that reached the opponent's 40. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_td_rate` | `number` | Defense-allowed twin of so_td_rate: so_tds / so_trips: touchdowns per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_conversion_rate` | `number` | Defense-allowed twin of so_conversion_rate: so_scores / so_trips: the share of scoring-opportunity trips that scored. Computed from the def_ counts; null when the denominator is 0. |
| `def_so_pts_per_trip` | `number` | Defense-allowed twin of so_pts_per_trip: so_points / so_trips: points per scoring-opportunity trip. Computed from the def_ counts; null when the denominator is 0. |
| `def_pts_per_drive` | `number` | Defense-allowed twin of pts_per_drive: drive_points / drives: points per drive. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_epa_per_play` | `number` | Defense-allowed twin of scripted_epa_per_play: scripted_epa / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_success_rate` | `number` | Defense-allowed twin of scripted_success_rate: scripted_successes / scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_scripted_pts_per_drive` | `number` | Defense-allowed twin of scripted_pts_per_drive: scripted_points / scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_epa_per_play` | `number` | Defense-allowed twin of non_scripted_epa_per_play: non_scripted_epa / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_success_rate` | `number` | Defense-allowed twin of non_scripted_success_rate: non_scripted_successes / non_scripted_plays. Computed from the def_ counts; null when the denominator is 0. |
| `def_non_scripted_pts_per_drive` | `number` | Defense-allowed twin of non_scripted_pts_per_drive: non_scripted_points / non_scripted_drives. Computed from the def_ counts; null when the denominator is 0. |
| `def_third_down_over_expected` | `number` | Defense-allowed twin of third_down_over_expected: def_third_down_conversions minus def_third_down_expected; null when no curve was available. |

## `loadNflGroups`

Release: [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_groups/nfl_groups.parquet`

:::caution[Coverage]
One season-less file: one row per group lineage (the league, subdivisions, conferences, divisions) with the first and last season it had members. group_id is SDV's own id (e.g. nfl:afc-east) and names a lineage: a rename that keeps continuity keeps the id, a new body gets a new one, and notes records each call. Seasons are the STARTING year (2025 = the 2025-26 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflGroups();
// snake_case alias (py/R parity): sdv.nfl.load_nfl_groups(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflGroupsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nfl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `first_season` | `number` | First season in which the group had at least one member (STARTING year: 2025 = the 2025-26 season). |
| `last_season` | `number` | Last season in which the group had at least one member (STARTING year: 2025 = the 2025-26 season). |
| `notes` | `string` | Builder notes on the group: the lineage decisions behind its group_id and any source caveats. |

## `loadNflGroupSeasons`

Release: [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_groups/nfl_group_seasons.parquet`

:::caution[Coverage]
One season-less file: one row per group per season it existed, with its name, short name, abbreviation and parent group AS OF that season (never today's label applied to the past) and its member count. season is the STARTING year (2025 = the 2025-26 season).
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflGroupSeasons();
// snake_case alias (py/R parity): sdv.nfl.load_nfl_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nfl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `season` | `number` | Season the row describes (STARTING year: 2025 = the 2025-26 season). |
| `level` | `string` | Hierarchy level of the group: "league", "subdivision", "conference" or "division". |
| `name` | `string` | Full name of the group as of that season -- the label in use then, not today's name. |
| `short_name` | `string` | Short display name of the group as of that season. |
| `abbreviation` | `string` | Abbreviation of the group as of that season. |
| `parent_group_id` | `string` | group_id one level up as of that season (division -\> conference -\> subdivision -\> league); null at the top level or where no higher group applied that season. |
| `n_teams` | `number` | Number of member teams in the group that season. |

## `loadNflGroupAliases`

Release: [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_groups/nfl_group_aliases.parquet`

:::caution[Coverage]
One season-less file: every name, abbreviation, slug and source id that a source (espn, nflverse, sdv) uses for a group, each with the seasons it is valid for (valid_from / valid_to, inclusive; null = unbounded). Match a source's conference or division label here to reach group_id.
:::

| option | type | required | description |
|---|---|---|---|
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflGroupAliases();
// snake_case alias (py/R parity): sdv.nfl.load_nfl_group_aliases(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflGroupAliasesRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nfl"); the prefix of every group_id in it. |
| `group_id` | `string` | SDV group id, \{league\}:\{slug\}. It names a lineage: renames that keep continuity keep the id, and a new body (a new conference, or a merger the sources treat as new) gets a new one. |
| `source` | `string` | Source that uses this label or id (in this table: espn, nflverse, sdv); "sdv" marks SDV's own labels. |
| `source_id` | `string` | The source's own id for the group (ESPN group id, NCAA conf_id, CFBD id, MLB division id) when it has one; null otherwise. |
| `name_kind` | `string` | Kind of label in value: "name", "short_name", "abbreviation", "slug" or "code". |
| `value` | `string` | The label exactly as the source writes it; match a source's conference or division label against it to reach group_id. |
| `valid_from` | `number` | First season the alias is valid for, inclusive (STARTING year: 2025 = the 2025-26 season); null = unbounded. |
| `valid_to` | `number` | Last season the alias is valid for, inclusive (STARTING year: 2025 = the 2025-26 season); null = unbounded (still in use). |

## `loadNflTeamGroupSeasons`

Release: [nfl_groups](https://github.com/sportsdataverse/sportsdataverse-data/releases/tag/nfl_groups) · asset `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/nfl_groups/nfl_team_group_seasons_{season}.parquet`

:::caution[Coverage]
One row per team per season: the SDV subdivision, conference and division group ids the team belonged to that season (null where a level does not apply), the team name as of that season, where the membership came from, and whether a second source agreed (null when only one source covers the season). team_id is a string: the ESPN team id; team_id_source names the id space. season is the STARTING year (2025 = the 2025-26 season); seasons 1970-2026.
:::

| option | type | required | description |
|---|---|---|---|
| `seasons` | `number \| number[]` | yes | season(s) to load (>= 1970); a season with no published asset throws `NoDataError` |
| `columns` | `string[]` | no | read only these columns |
| `format` | `"rows" \| "columns"` | no | row objects (default) or column arrays |
| `maxCells` | `number` | no | size guard; default scales with the heap, `Infinity` disables |
| `timeoutMs` | `number` | no | download timeout in ms (default 300000) |

```js
const rows = await sdv.nfl.loadNflTeamGroupSeasons({ seasons: 2024 });
// snake_case alias (py/R parity): sdv.nfl.load_nfl_team_group_seasons(...)
```

**Returns** (one row per record; every column optional and nullable):

**Row type:** `LoadNflTeamGroupSeasonsRow` (exported from the package root).

| col_name | type | description |
|---|---|---|
| `league` | `string` | League code of the table ("nfl"); the prefix of every group_id in it. |
| `season` | `number` | Season of the membership (STARTING year: 2025 = the 2025-26 season). |
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
