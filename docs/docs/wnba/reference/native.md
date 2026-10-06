---
title: Native API
sidebar_label: Native API
sidebar_position: 6
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **An unset season is the latest season with rows** — Not the previous season. Dated per request for the league, endpoint and `SeasonType` (NBA rolls over in November, G League in January, Summer League in August, WNBA in June); pass `season` for a lockout or pandemic year. ([changelog](/CHANGELOG#statsnbacom--statswnbacom-default-season-the-latest-season-with-data-sdv-py-693))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `sdv.wnba` — Native (non-ESPN) APIs

Beyond the ESPN surface, `sdv.wnba` also wraps the league's own live APIs. Same `{ parsed: true }` contract; each method is exposed under both snake_case and camelCase on `sdv.wnba`.

## Native API — WNBA Stats API (stats.wnba.com)

Flat (non-ESPN) wrappers for stats.wnba.com (needs a TLS-impersonating transport and a residential IP). Host: `https://stats.wnba.com`. Each method is exposed under BOTH its snake_case name `wnba_stats_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.wnba`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. Endpoints marked **multi-table** parse to several frames in sdv-py; with `parsed: true` they return the default shown in the Parser column (one sub-frame, or every table as a dict), and `section: "<name>"` selects any other (an unknown name returns `[]`, sdv-py's zero-row frame).

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `wnba_stats_alltimeleadersgrids` / `wnbaStatsAlltimeleadersgrids` | `https://stats.wnba.com/stats/alltimeleadersgrids` | — | `league_id` → `LeagueID`, `per_mode_simple` → `PerMode`, `season_type` → `SeasonType`, `topx` → `TopX` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_assistleaders` / `wnbaStatsAssistleaders` | `https://stats.wnba.com/stats/assistleaders` | — | `league_id` → `LeagueID`, `per_mode_simple` → `PerMode`, `player_or_team` → `PlayerOrTeam`, `season` → `Season`, `season_type_playoffs` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_assisttracker` / `wnbaStatsAssisttracker` | `https://stats.wnba.com/stats/assisttracker` | — | `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_scope_simple_nullable` → `GameScope`, `height_nullable` → `Height`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month_nullable` → `Month`, `opponent_team_id_nullable` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `per_mode_simple_nullable` → `PerMode`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star_nullable` → `SeasonType`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoreadvancedv2` / `wnbaStatsBoxscoreadvancedv2` | `https://stats.wnba.com/stats/boxscoreadvancedv2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoreadvancedv3` / `wnbaStatsBoxscoreadvancedv3` | `https://stats.wnba.com/stats/boxscoreadvancedv3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoredefensivev2` / `wnbaStatsBoxscoredefensivev2` | `https://stats.wnba.com/stats/boxscoredefensivev2` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorefourfactorsv2` / `wnbaStatsBoxscorefourfactorsv2` | `https://stats.wnba.com/stats/boxscorefourfactorsv2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorefourfactorsv3` / `wnbaStatsBoxscorefourfactorsv3` | `https://stats.wnba.com/stats/boxscorefourfactorsv3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorehustlev2` / `wnbaStatsBoxscorehustlev2` | `https://stats.wnba.com/stats/boxscorehustlev2` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorematchupsv3` / `wnbaStatsBoxscorematchupsv3` | `https://stats.wnba.com/stats/boxscorematchupsv3` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoremiscv2` / `wnbaStatsBoxscoremiscv2` | `https://stats.wnba.com/stats/boxscoremiscv2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoremiscv3` / `wnbaStatsBoxscoremiscv3` | `https://stats.wnba.com/stats/boxscoremiscv3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoreplayertrackv3` / `wnbaStatsBoxscoreplayertrackv3` | `https://stats.wnba.com/stats/boxscoreplayertrackv3` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorescoringv2` / `wnbaStatsBoxscorescoringv2` | `https://stats.wnba.com/stats/boxscorescoringv2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscorescoringv3` / `wnbaStatsBoxscorescoringv3` | `https://stats.wnba.com/stats/boxscorescoringv3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoresummaryv2` / `wnbaStatsBoxscoresummaryv2` | `https://stats.wnba.com/stats/boxscoresummaryv2` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoresummaryv3` / `wnbaStatsBoxscoresummaryv3` | `https://stats.wnba.com/stats/boxscoresummaryv3` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoretraditionalv2` / `wnbaStatsBoxscoretraditionalv2` | `https://stats.wnba.com/stats/boxscoretraditionalv2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoretraditionalv3` / `wnbaStatsBoxscoretraditionalv3` | `https://stats.wnba.com/stats/boxscoretraditionalv3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoreusagev2` / `wnbaStatsBoxscoreusagev2` | `https://stats.wnba.com/stats/boxscoreusagev2` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_boxscoreusagev3` / `wnbaStatsBoxscoreusagev3` | `https://stats.wnba.com/stats/boxscoreusagev3` | — | `end_period` → `EndPeriod`, `end_range` → `EndRange`, `game_id` → `GameID`, `range_type` → `RangeType`, `start_period` → `StartPeriod`, `start_range` → `StartRange` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_commonallplayers` / `wnbaStatsCommonallplayers` | `https://stats.wnba.com/stats/commonallplayers` | — | `is_only_current_season` → `IsOnlyCurrentSeason`, `league_id` → `LeagueID`, `season` → `Season` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_commonplayerinfo` / `wnbaStatsCommonplayerinfo` | `https://stats.wnba.com/stats/commonplayerinfo` | — | `league_id` → `LeagueID`, `player_id` → `PlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_commonplayoffseries` / `wnbaStatsCommonplayoffseries` | `https://stats.wnba.com/stats/commonplayoffseries` | — | `league_id` → `LeagueID`, `season` → `Season`, `series_id_nullable` → `SeriesID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_commonteamroster` / `wnbaStatsCommonteamroster` | `https://stats.wnba.com/stats/commonteamroster` | — | `league_id` → `LeagueID`, `season` → `Season`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_commonteamyears` / `wnbaStatsCommonteamyears` | `https://stats.wnba.com/stats/commonteamyears` | — | `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_cumestatsplayer` / `wnbaStatsCumestatsplayer` | `https://stats.wnba.com/stats/cumestatsplayer` | — | `game_ids` → `GameIDs`, `league_id` → `LeagueID`, `player_id` → `PlayerID`, `season` → `Season`, `season_type_all_star` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_cumestatsplayergames` / `wnbaStatsCumestatsplayergames` | `https://stats.wnba.com/stats/cumestatsplayergames` | — | `league_id` → `LeagueID`, `location_nullable` → `Location`, `outcome_nullable` → `Outcome`, `player_id` → `PlayerID`, `season` → `Season`, `season_type_all_star` → `SeasonType`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_team_id_nullable` → `VsTeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_cumestatsteam` / `wnbaStatsCumestatsteam` | `https://stats.wnba.com/stats/cumestatsteam` | — | `game_ids` → `GameIDs`, `league_id` → `LeagueID`, `season` → `Season`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_cumestatsteamgames` / `wnbaStatsCumestatsteamgames` | `https://stats.wnba.com/stats/cumestatsteamgames` | — | `league_id` → `LeagueID`, `location_nullable` → `Location`, `outcome_nullable` → `Outcome`, `season` → `Season`, `season_id_nullable` → `SeasonID`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_team_id_nullable` → `VsTeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_draftcombinestats` / `wnbaStatsDraftcombinestats` | `https://stats.wnba.com/stats/draftcombinestats` | — | `league_id` → `LeagueID`, `season_all_time` → `SeasonYear` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_drafthistory` / `wnbaStatsDrafthistory` | `https://stats.wnba.com/stats/drafthistory` | — | `college_nullable` → `College`, `league_id` → `LeagueID`, `overall_pick_nullable` → `OverallPick`, `round_num_nullable` → `RoundNum`, `round_pick_nullable` → `RoundPick`, `season_year_nullable` → `Season`, `team_id_nullable` → `TeamID`, `topx_nullable` → `TopX` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_fantasywidget` / `wnbaStatsFantasywidget` | `https://stats.wnba.com/stats/fantasywidget` | — | `active_players` → `ActivePlayers`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month_nullable` → `Month`, `opponent_team_id_nullable` → `OpponentTeamID`, `po_round_nullable` → `PORound`, `player_id_nullable` → `PlayerID`, `position_nullable` → `Position`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id_nullable` → `TeamID`, `todays_opponent` → `TodaysOpponent`, `todays_players` → `TodaysPlayers`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_franchisehistory` / `wnbaStatsFranchisehistory` | `https://stats.wnba.com/stats/franchisehistory` | — | `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_franchiseleaders` / `wnbaStatsFranchiseleaders` | `https://stats.wnba.com/stats/franchiseleaders` | — | `league_id` → `LeagueID`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_franchiseleaderswrank` / `wnbaStatsFranchiseleaderswrank` | `https://stats.wnba.com/stats/franchiseleaderswrank` | — | `league_id` → `LeagueID`, `per_mode` → `PerMode`, `season_type` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_franchiseplayers` / `wnbaStatsFranchiseplayers` | `https://stats.wnba.com/stats/franchiseplayers` | — | `league_id` → `LeagueID`, `per_mode_detailed` → `PerMode`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_gamerotation` / `wnbaStatsGamerotation` | `https://stats.wnba.com/stats/gamerotation` | — | `game_id` → `GameID`, `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_homepageleaders` / `wnbaStatsHomepageleaders` | `https://stats.wnba.com/stats/homepageleaders` | — | `game_scope_detailed` → `GameScope`, `league_id` → `LeagueID`, `player_or_team` → `PlayerOrTeam`, `player_scope` → `PlayerScope`, `season` → `Season`, `season_type_playoffs` → `SeasonType`, `stat_category` → `StatCategory` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_homepagev2` / `wnbaStatsHomepagev2` | `https://stats.wnba.com/stats/homepagev2` | — | `game_scope_detailed` → `GameScope`, `league_id` → `LeagueID`, `player_or_team` → `PlayerOrTeam`, `player_scope` → `PlayerScope`, `season` → `Season`, `season_type_playoffs` → `SeasonType`, `stat_type` → `StatType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_hustlestatsboxscore` / `wnbaStatsHustlestatsboxscore` | `https://stats.wnba.com/stats/hustlestatsboxscore` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_infographicfanduelplayer` / `wnbaStatsInfographicfanduelplayer` | `https://stats.wnba.com/stats/infographicfanduelplayer` | — | `game_id` → `GameID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaderstiles` / `wnbaStatsLeaderstiles` | `https://stats.wnba.com/stats/leaderstiles` | — | `game_scope_detailed` → `GameScope`, `league_id` → `LeagueID`, `player_or_team` → `PlayerOrTeam`, `player_scope` → `PlayerScope`, `season` → `Season`, `season_type_playoffs` → `SeasonType`, `stat` → `Stat` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashlineups` / `wnbaStatsLeaguedashlineups` | `https://stats.wnba.com/stats/leaguedashlineups` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `game_segment_nullable` → `GameSegment`, `group_quantity` → `GroupQuantity`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashplayerbiostats` / `wnbaStatsLeaguedashplayerbiostats` | `https://stats.wnba.com/stats/leaguedashplayerbiostats` | — | `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `height_nullable` → `Height`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month_nullable` → `Month`, `opponent_team_id_nullable` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `per_mode_simple` → `PerMode`, `period_nullable` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashplayerclutch` / `wnbaStatsLeaguedashplayerclutch` | `https://stats.wnba.com/stats/leaguedashplayerclutch` | — | `ahead_behind` → `AheadBehind`, `clutch_time` → `ClutchTime`, `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `height_nullable` → `Height`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `point_diff` → `PointDiff`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashplayershotlocations` / `wnbaStatsLeaguedashplayershotlocations` | `https://stats.wnba.com/stats/leaguedashplayershotlocations` | — | `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `distance_range` → `DistanceRange`, `division_simple_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `height_nullable` → `Height`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_simple` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashplayerstats` / `wnbaStatsLeaguedashplayerstats` | `https://stats.wnba.com/stats/leaguedashplayerstats` | — | `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `height_nullable` → `Height`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `two_way_nullable` → `TwoWay`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashptdefend` / `wnbaStatsLeaguedashptdefend` | `https://stats.wnba.com/stats/leaguedashptdefend` | — | `college_nullable` → `College`, `conference_nullable` → `Conference`, `country_nullable` → `Country`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `defense_category` → `DefenseCategory`, `division_nullable` → `Division`, `draft_pick_nullable` → `DraftPick`, `draft_year_nullable` → `DraftYear`, `game_segment_nullable` → `GameSegment`, `height_nullable` → `Height`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month_nullable` → `Month`, `opponent_team_id_nullable` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `per_mode_simple` → `PerMode`, `period_nullable` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_id_nullable` → `PlayerID`, `player_position_nullable` → `PlayerPosition`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashteamclutch` / `wnbaStatsLeaguedashteamclutch` | `https://stats.wnba.com/stats/leaguedashteamclutch` | — | `ahead_behind` → `AheadBehind`, `clutch_time` → `ClutchTime`, `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `point_diff` → `PointDiff`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashteamshotlocations` / `wnbaStatsLeaguedashteamshotlocations` | `https://stats.wnba.com/stats/leaguedashteamshotlocations` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `distance_range` → `DistanceRange`, `division_simple_nullable` → `Division`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_simple` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguedashteamstats` / `wnbaStatsLeaguedashteamstats` | `https://stats.wnba.com/stats/leaguedashteamstats` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `game_scope_simple_nullable` → `GameScope`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_experience_nullable` → `PlayerExperience`, `player_position_abbreviation_nullable` → `PlayerPosition`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `two_way_nullable` → `TwoWay`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguegamefinder` / `wnbaStatsLeaguegamefinder` | `https://stats.wnba.com/stats/leaguegamefinder` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_number_nullable` → `DraftNumber`, `draft_round_nullable` → `DraftRound`, `draft_team_id_nullable` → `DraftTeamID`, `draft_year_nullable` → `DraftYear`, `eq_ast_nullable` → `EqAST`, `eq_blk_nullable` → `EqBLK`, `eq_dd_nullable` → `EqDD`, `eq_dreb_nullable` → `EqDREB`, `eq_fg3a_nullable` → `EqFG3A`, `eq_fg3m_nullable` → `EqFG3M`, `eq_fg3_pct_nullable` → `EqFG3_PCT`, `eq_fga_nullable` → `EqFGA`, `eq_fgm_nullable` → `EqFGM`, `eq_fg_pct_nullable` → `EqFG_PCT`, `eq_fta_nullable` → `EqFTA`, `eq_ftm_nullable` → `EqFTM`, `eq_ft_pct_nullable` → `EqFT_PCT`, `eq_minutes_nullable` → `EqMINUTES`, `eq_oreb_nullable` → `EqOREB`, `eq_pf_nullable` → `EqPF`, `eq_pts_nullable` → `EqPTS`, `eq_reb_nullable` → `EqREB`, `eq_stl_nullable` → `EqSTL`, `eq_td_nullable` → `EqTD`, `eq_tov_nullable` → `EqTOV`, `game_id_nullable` → `GameID`, `gt_ast_nullable` → `GtAST`, `gt_blk_nullable` → `GtBLK`, `gt_dd_nullable` → `GtDD`, `gt_dreb_nullable` → `GtDREB`, `gt_fg3a_nullable` → `GtFG3A`, `gt_fg3m_nullable` → `GtFG3M`, `gt_fg3_pct_nullable` → `GtFG3_PCT`, `gt_fga_nullable` → `GtFGA`, `gt_fgm_nullable` → `GtFGM`, `gt_fg_pct_nullable` → `GtFG_PCT`, `gt_fta_nullable` → `GtFTA`, `gt_ftm_nullable` → `GtFTM`, `gt_ft_pct_nullable` → `GtFT_PCT`, `gt_minutes_nullable` → `GtMINUTES`, `gt_oreb_nullable` → `GtOREB`, `gt_pf_nullable` → `GtPF`, `gt_pts_nullable` → `GtPTS`, `gt_reb_nullable` → `GtREB`, `gt_stl_nullable` → `GtSTL`, `gt_td_nullable` → `GtTD`, `gt_tov_nullable` → `GtTOV`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `lt_ast_nullable` → `LtAST`, `lt_blk_nullable` → `LtBLK`, `lt_dd_nullable` → `LtDD`, `lt_dreb_nullable` → `LtDREB`, `lt_fg3a_nullable` → `LtFG3A`, `lt_fg3m_nullable` → `LtFG3M`, `lt_fg3_pct_nullable` → `LtFG3_PCT`, `lt_fga_nullable` → `LtFGA`, `lt_fgm_nullable` → `LtFGM`, `lt_fg_pct_nullable` → `LtFG_PCT`, `lt_fta_nullable` → `LtFTA`, `lt_ftm_nullable` → `LtFTM`, `lt_ft_pct_nullable` → `LtFT_PCT`, `lt_minutes_nullable` → `LtMINUTES`, `lt_oreb_nullable` → `LtOREB`, `lt_pf_nullable` → `LtPF`, `lt_pts_nullable` → `LtPTS`, `lt_reb_nullable` → `LtREB`, `lt_stl_nullable` → `LtSTL`, `lt_td_nullable` → `LtTD`, `lt_tov_nullable` → `LtTOV`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `player_id_nullable` → `PlayerID`, `player_or_team_abbreviation` → `PlayerOrTeam`, `rookie_year_nullable` → `RookieYear`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_nullable` → `SeasonType`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_team_id_nullable` → `VsTeamID`, `years_experience_nullable` → `YearsExperience` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguegamelog` / `wnbaStatsLeaguegamelog` | `https://stats.wnba.com/stats/leaguegamelog` | — | `counter` → `Counter`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `direction` → `Direction`, `league_id` → `LeagueID`, `player_or_team_abbreviation` → `PlayerOrTeam`, `season` → `Season`, `season_type_all_star` → `SeasonType`, `sorter` → `Sorter` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leagueleaders` / `wnbaStatsLeagueleaders` | `https://stats.wnba.com/stats/leagueleaders` | — | `active_flag_nullable` → `ActiveFlag`, `league_id` → `LeagueID`, `per_mode48` → `PerMode`, `scope` → `Scope`, `season` → `Season`, `season_type_all_star` → `SeasonType`, `stat_category_abbreviation` → `StatCategory` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguelineupviz` / `wnbaStatsLeaguelineupviz` | `https://stats.wnba.com/stats/leaguelineupviz` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `game_segment_nullable` → `GameSegment`, `group_quantity` → `GroupQuantity`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `minutes_min` → `MinutesMin`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leagueplayerondetails` / `wnbaStatsLeagueplayerondetails` | `https://stats.wnba.com/stats/leagueplayerondetails` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leagueseasonmatchups` / `wnbaStatsLeagueseasonmatchups` | `https://stats.wnba.com/stats/leagueseasonmatchups` | — | `def_player_id_nullable` → `DefPlayerID`, `def_team_id_nullable` → `DefTeamID`, `league_id` → `LeagueID`, `off_player_id_nullable` → `OffPlayerID`, `off_team_id_nullable` → `OffTeamID`, `per_mode_simple` → `PerMode`, `season` → `Season`, `season_type_playoffs` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_leaguestandingsv3` / `wnbaStatsLeaguestandingsv3` | `https://stats.wnba.com/stats/leaguestandingsv3` | — | `league_id` → `LeagueID`, `season` → `Season`, `season_type` → `SeasonType`, `season_nullable` → `SeasonYear` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playbyplayv2` / `wnbaStatsPlaybyplayv2` | `https://stats.wnba.com/stats/playbyplayv2` | — | `end_period` → `EndPeriod`, `game_id` → `GameID`, `start_period` → `StartPeriod` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playbyplayv3` / `wnbaStatsPlaybyplayv3` | `https://stats.wnba.com/stats/playbyplayv3` | — | `end_period` → `EndPeriod`, `game_id` → `GameID`, `start_period` → `StartPeriod` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerawards` / `wnbaStatsPlayerawards` | `https://stats.wnba.com/stats/playerawards` | — | `player_id` → `PlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playercareerbycollegerollup` / `wnbaStatsPlayercareerbycollegerollup` | `https://stats.wnba.com/stats/playercareerbycollegerollup` | — | `league_id` → `LeagueID`, `per_mode_simple` → `PerMode`, `season_nullable` → `Season`, `season_type_all_star` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playercareerstats` / `wnbaStatsPlayercareerstats` | `https://stats.wnba.com/stats/playercareerstats` | — | `league_id` → `LeagueID`, `per_mode36` → `PerMode`, `player_id` → `PlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playercompare` / `wnbaStatsPlayercompare` | `https://stats.wnba.com/stats/playercompare` | — | `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id_list` → `PlayerIDList`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_player_id_list` → `VsPlayerIDList` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbyclutch` / `wnbaStatsPlayerdashboardbyclutch` | `https://stats.wnba.com/stats/playerdashboardbyclutch` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbygamesplits` / `wnbaStatsPlayerdashboardbygamesplits` | `https://stats.wnba.com/stats/playerdashboardbygamesplits` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbygeneralsplits` / `wnbaStatsPlayerdashboardbygeneralsplits` | `https://stats.wnba.com/stats/playerdashboardbygeneralsplits` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbylastngames` / `wnbaStatsPlayerdashboardbylastngames` | `https://stats.wnba.com/stats/playerdashboardbylastngames` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbyopponent` / `wnbaStatsPlayerdashboardbyopponent` | `https://stats.wnba.com/stats/playerdashboardbyopponent` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbyshootingsplits` / `wnbaStatsPlayerdashboardbyshootingsplits` | `https://stats.wnba.com/stats/playerdashboardbyshootingsplits` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbyteamperformance` / `wnbaStatsPlayerdashboardbyteamperformance` | `https://stats.wnba.com/stats/playerdashboardbyteamperformance` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashboardbyyearoveryear` / `wnbaStatsPlayerdashboardbyyearoveryear` | `https://stats.wnba.com/stats/playerdashboardbyyearoveryear` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerdashptshotdefend` / `wnbaStatsPlayerdashptshotdefend` | `https://stats.wnba.com/stats/playerdashptshotdefend` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `per_mode_simple` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerestimatedmetrics` / `wnbaStatsPlayerestimatedmetrics` | `https://stats.wnba.com/stats/playerestimatedmetrics` | — | `league_id` → `LeagueID`, `season` → `Season`, `season_type` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerfantasyprofile` / `wnbaStatsPlayerfantasyprofile` | `https://stats.wnba.com/stats/playerfantasyprofile` | — | `league_id` → `LeagueID`, `measure_type` → `MeasureType`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_type` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerfantasyprofilebargraph` / `wnbaStatsPlayerfantasyprofilebargraph` | `https://stats.wnba.com/stats/playerfantasyprofilebargraph` | — | `league_id` → `LeagueID`, `player_id` → `PlayerID`, `season` → `Season`, `season_type_all_star_nullable` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playergamelog` / `wnbaStatsPlayergamelog` | `https://stats.wnba.com/stats/playergamelog` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `league_id` → `LeagueID`, `player_id` → `PlayerID`, `season` → `Season`, `season_type_all_star` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playergamelogs` / `wnbaStatsPlayergamelogs` | `https://stats.wnba.com/stats/playergamelogs` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_player_game_logs_nullable` → `MeasureType`, `month_nullable` → `Month`, `oppteamid` → `OppTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `per_mode_simple_nullable` → `PerMode`, `period_nullable` → `Period`, `player_id_nullable` → `PlayerID`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_nullable` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playergamestreakfinder` / `wnbaStatsPlayergamestreakfinder` | `https://stats.wnba.com/stats/playergamestreakfinder` | — | `active_streaks_only_nullable` → `ActiveStreaksOnly`, `conference_nullable` → `Conference`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `division_simple_nullable` → `Division`, `draft_number_nullable` → `DraftNumber`, `draft_round_nullable` → `DraftRound`, `draft_team_id_nullable` → `DraftTeamID`, `draft_year_nullable` → `DraftYear`, `eq_ast_nullable` → `EqAST`, `eq_blk_nullable` → `EqBLK`, `eq_dd_nullable` → `EqDD`, `eq_dreb_nullable` → `EqDREB`, `eq_fg3a_nullable` → `EqFG3A`, `eq_fg3m_nullable` → `EqFG3M`, `eq_fg3_pct_nullable` → `EqFG3_PCT`, `eq_fga_nullable` → `EqFGA`, `eq_fgm_nullable` → `EqFGM`, `eq_fg_pct_nullable` → `EqFG_PCT`, `eq_fta_nullable` → `EqFTA`, `eq_ftm_nullable` → `EqFTM`, `eq_ft_pct_nullable` → `EqFT_PCT`, `eq_minutes_nullable` → `EqMINUTES`, `eq_oreb_nullable` → `EqOREB`, `eq_pf_nullable` → `EqPF`, `eq_pts_nullable` → `EqPTS`, `eq_reb_nullable` → `EqREB`, `eq_stl_nullable` → `EqSTL`, `eq_td_nullable` → `EqTD`, `eq_tov_nullable` → `EqTOV`, `game_id_nullable` → `GameID`, `gt_ast_nullable` → `GtAST`, `gt_blk_nullable` → `GtBLK`, `gt_dd_nullable` → `GtDD`, `gt_dreb_nullable` → `GtDREB`, `gt_fg3a_nullable` → `GtFG3A`, `gt_fg3m_nullable` → `GtFG3M`, `gt_fg3_pct_nullable` → `GtFG3_PCT`, `gt_fga_nullable` → `GtFGA`, `gt_fgm_nullable` → `GtFGM`, `gt_fg_pct_nullable` → `GtFG_PCT`, `gt_fta_nullable` → `GtFTA`, `gt_ftm_nullable` → `GtFTM`, `gt_ft_pct_nullable` → `GtFT_PCT`, `gt_minutes_nullable` → `GtMINUTES`, `gt_oreb_nullable` → `GtOREB`, `gt_pf_nullable` → `GtPF`, `gt_pts_nullable` → `GtPTS`, `gt_reb_nullable` → `GtREB`, `gt_stl_nullable` → `GtSTL`, `gt_td_nullable` → `GtTD`, `gt_tov_nullable` → `GtTOV`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `lt_ast_nullable` → `LtAST`, `lt_blk_nullable` → `LtBLK`, `lt_dd_nullable` → `LtDD`, `lt_dreb_nullable` → `LtDREB`, `lt_fg3a_nullable` → `LtFG3A`, `lt_fg3m_nullable` → `LtFG3M`, `lt_fg3_pct_nullable` → `LtFG3_PCT`, `lt_fga_nullable` → `LtFGA`, `lt_fgm_nullable` → `LtFGM`, `lt_fg_pct_nullable` → `LtFG_PCT`, `lt_fta_nullable` → `LtFTA`, `lt_ftm_nullable` → `LtFTM`, `lt_ft_pct_nullable` → `LtFT_PCT`, `lt_minutes_nullable` → `LtMINUTES`, `lt_oreb_nullable` → `LtOREB`, `lt_pf_nullable` → `LtPF`, `lt_pts_nullable` → `LtPTS`, `lt_reb_nullable` → `LtREB`, `lt_stl_nullable` → `LtSTL`, `lt_td_nullable` → `LtTD`, `lt_tov_nullable` → `LtTOV`, `min_games_nullable` → `MinGames`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `player_id_nullable` → `PlayerID`, `rookie_year_nullable` → `RookieYear`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_nullable` → `SeasonType`, `starter_bench_nullable` → `StarterBench`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_team_id_nullable` → `VsTeamID`, `years_experience_nullable` → `YearsExperience` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerindex` / `wnbaStatsPlayerindex` | `https://stats.wnba.com/stats/playerindex` | — | `active_nullable` → `Active`, `allstar_nullable` → `AllStar`, `college_nullable` → `College`, `country_nullable` → `Country`, `draft_pick_nullable` → `DraftPick`, `draft_round_nullable` → `DraftRound`, `draft_year_nullable` → `DraftYear`, `height_nullable` → `Height`, `historical_nullable` → `Historical`, `league_id` → `LeagueID`, `season` → `Season`, `team_id_nullable` → `TeamID`, `weight_nullable` → `Weight` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playernextngames` / `wnbaStatsPlayernextngames` | `https://stats.wnba.com/stats/playernextngames` | — | `league_id` → `LeagueID`, `number_of_games` → `NumberOfGames`, `player_id` → `PlayerID`, `season_all` → `Season`, `season_type_all_star` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playerprofilev2` / `wnbaStatsPlayerprofilev2` | `https://stats.wnba.com/stats/playerprofilev2` | — | `league_id` → `LeagueID`, `per_mode36` → `PerMode`, `player_id` → `PlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_playervsplayer` / `wnbaStatsPlayervsplayer` | `https://stats.wnba.com/stats/playervsplayer` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_player_id` → `VsPlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_scheduleleaguev2` / `wnbaStatsScheduleleaguev2` | `https://stats.wnba.com/stats/scheduleleaguev2` | — | `league_id` → `LeagueID`, `season` → `Season` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_scheduleleaguev2int` / `wnbaStatsScheduleleaguev2int` | `https://stats.wnba.com/stats/scheduleleaguev2int` | — | `league_id` → `LeagueID`, `season` → `Season` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_scoreboardv2` / `wnbaStatsScoreboardv2` | `https://stats.wnba.com/stats/scoreboardv2` | — | `day_offset` → `DayOffset`, `game_date` → `GameDate`, `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_scoreboardv3` / `wnbaStatsScoreboardv3` | `https://stats.wnba.com/stats/scoreboardv3` | — | `game_date` → `GameDate`, `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_shotchartdetail` / `wnbaStatsShotchartdetail` | `https://stats.wnba.com/stats/shotchartdetail` | — | `ahead_behind_nullable` → `AheadBehind`, `clutch_time_nullable` → `ClutchTime`, `context_filter_nullable` → `ContextFilter`, `context_measure_simple` → `ContextMeasure`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `end_period_nullable` → `EndPeriod`, `end_range_nullable` → `EndRange`, `game_id_nullable` → `GameID`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `period` → `Period`, `player_id` → `PlayerID`, `player_position_nullable` → `PlayerPosition`, `point_diff_nullable` → `PointDiff`, `position_nullable` → `Position`, `range_type_nullable` → `RangeType`, `rookie_year_nullable` → `RookieYear`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `start_period_nullable` → `StartPeriod`, `start_range_nullable` → `StartRange`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_shotchartleaguewide` / `wnbaStatsShotchartleaguewide` | `https://stats.wnba.com/stats/shotchartleaguewide` | — | `league_id` → `LeagueID`, `season` → `Season` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_shotchartlineupdetail` / `wnbaStatsShotchartlineupdetail` | `https://stats.wnba.com/stats/shotchartlineupdetail` | — | `context_filter_nullable` → `ContextFilter`, `context_measure_detailed` → `ContextMeasure`, `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `group_id` → `GROUP_ID`, `game_id_nullable` → `GameID`, `game_segment_nullable` → `GameSegment`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `month_nullable` → `Month`, `opponent_team_id_nullable` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `period` → `Period`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbyclutch` / `wnbaStatsTeamdashboardbyclutch` | `https://stats.wnba.com/stats/teamdashboardbyclutch` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbygamesplits` / `wnbaStatsTeamdashboardbygamesplits` | `https://stats.wnba.com/stats/teamdashboardbygamesplits` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbygeneralsplits` / `wnbaStatsTeamdashboardbygeneralsplits` | `https://stats.wnba.com/stats/teamdashboardbygeneralsplits` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbylastngames` / `wnbaStatsTeamdashboardbylastngames` | `https://stats.wnba.com/stats/teamdashboardbylastngames` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbyopponent` / `wnbaStatsTeamdashboardbyopponent` | `https://stats.wnba.com/stats/teamdashboardbyopponent` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbyshootingsplits` / `wnbaStatsTeamdashboardbyshootingsplits` | `https://stats.wnba.com/stats/teamdashboardbyshootingsplits` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbyteamperformance` / `wnbaStatsTeamdashboardbyteamperformance` | `https://stats.wnba.com/stats/teamdashboardbyteamperformance` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashboardbyyearoveryear` / `wnbaStatsTeamdashboardbyyearoveryear` | `https://stats.wnba.com/stats/teamdashboardbyyearoveryear` | — | `date_from` → `DateFrom`, `date_to` → `DateTo`, `game_segment` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location` → `Location`, `measure_type` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome` → `Outcome`, `po_round` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment` → `SeasonSegment`, `season_type` → `SeasonType`, `shot_clock_range` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference` → `VsConference`, `vs_division` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdashlineups` / `wnbaStatsTeamdashlineups` | `https://stats.wnba.com/stats/teamdashlineups` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_id_nullable` → `GameID`, `game_segment_nullable` → `GameSegment`, `group_quantity` → `GroupQuantity`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamdetails` / `wnbaStatsTeamdetails` | `https://stats.wnba.com/stats/teamdetails` | — | `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamestimatedmetrics` / `wnbaStatsTeamestimatedmetrics` | `https://stats.wnba.com/stats/teamestimatedmetrics` | — | `league_id` → `LeagueID`, `season` → `Season`, `season_type` → `SeasonType` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamgamelog` / `wnbaStatsTeamgamelog` | `https://stats.wnba.com/stats/teamgamelog` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `league_id` → `LeagueID`, `season` → `Season`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamgamelogs` / `wnbaStatsTeamgamelogs` | `https://stats.wnba.com/stats/teamgamelogs` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games_nullable` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_player_game_logs_nullable` → `MeasureType`, `month_nullable` → `Month`, `opp_team_id_nullable` → `OppTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `per_mode_simple_nullable` → `PerMode`, `period_nullable` → `Period`, `player_id_nullable` → `PlayerID`, `season_nullable` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_nullable` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id_nullable` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teaminfocommon` / `wnbaStatsTeaminfocommon` | `https://stats.wnba.com/stats/teaminfocommon` | — | `league_id` → `LeagueID`, `season_nullable` → `Season`, `season_type_nullable` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamplayerdashboard` / `wnbaStatsTeamplayerdashboard` | `https://stats.wnba.com/stats/teamplayerdashboard` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `po_round_nullable` → `PORound`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `shot_clock_range_nullable` → `ShotClockRange`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamplayeronoffdetails` / `wnbaStatsTeamplayeronoffdetails` | `https://stats.wnba.com/stats/teamplayeronoffdetails` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamplayeronoffsummary` / `wnbaStatsTeamplayeronoffsummary` | `https://stats.wnba.com/stats/teamplayeronoffsummary` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamvsplayer` / `wnbaStatsTeamvsplayer` | `https://stats.wnba.com/stats/teamvsplayer` | — | `date_from_nullable` → `DateFrom`, `date_to_nullable` → `DateTo`, `game_segment_nullable` → `GameSegment`, `last_n_games` → `LastNGames`, `league_id` → `LeagueID`, `location_nullable` → `Location`, `measure_type_detailed_defense` → `MeasureType`, `month` → `Month`, `opponent_team_id` → `OpponentTeamID`, `outcome_nullable` → `Outcome`, `pace_adjust` → `PaceAdjust`, `per_mode_detailed` → `PerMode`, `period` → `Period`, `player_id_nullable` → `PlayerID`, `plus_minus` → `PlusMinus`, `rank` → `Rank`, `season` → `Season`, `season_segment_nullable` → `SeasonSegment`, `season_type_playoffs` → `SeasonType`, `team_id` → `TeamID`, `vs_conference_nullable` → `VsConference`, `vs_division_nullable` → `VsDivision`, `vs_player_id` → `VsPlayerID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_teamyearbyyearstats` / `wnbaStatsTeamyearbyyearstats` | `https://stats.wnba.com/stats/teamyearbyyearstats` | — | `league_id` → `LeagueID`, `per_mode_simple` → `PerMode`, `season_type_all_star` → `SeasonType`, `team_id` → `TeamID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |
| `wnba_stats_videostatus` / `wnbaStatsVideostatus` | `https://stats.wnba.com/stats/videostatus` | — | `game_date` → `GameDate`, `league_id` → `LeagueID` | `parse_nba_stats_result_sets` — multi-table (default: every table, as a dict, or a one-table payload's table itself): `section` = a result-set name the payload ships (sdv-py's `result_set`) | — |

### Returns — `wnba_stats_alltimeleadersgrids` / `wnbaStatsAlltimeleadersgrids`

With `{ parsed: true }`: an object of tables, one per key below.

**`GPLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `gp` | integer | Games played. |
| `gp_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`PTSLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `pts` | numeric | Points scored. |
| `pts_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`ASTLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `ast` | numeric | Assists. |
| `ast_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`STLLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `stl` | numeric | Steals. |
| `stl_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`OREBLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `oreb` | numeric | Offensive rebounds. |
| `oreb_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`DREBLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `dreb` | numeric | Defensive rebounds. |
| `dreb_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`REBLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `reb` | numeric | Total rebounds. |
| `reb_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`BLKLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `blk` | numeric | Blocks. |
| `blk_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FGMLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fgm` | numeric | Field goals made. |
| `fgm_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FGALeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fga` | numeric | Field goal attempts. |
| `fga_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FG_PCTLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg_pct_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`TOVLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `tov` | numeric | Turnovers. |
| `tov_rank` | integer | All-time league rank of the player's career turnover total on the leaders grid. |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FG3MLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_m_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FG3ALeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_a_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FG3_PCTLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `fg3_pct_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`PFLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `pf` | numeric | Personal fouls. |
| `pf_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FTMLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `ftm` | numeric | Free throws made. |
| `ftm_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FTALeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fta` | numeric | Free throw attempts. |
| `fta_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**`FT_PCTLeaders`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `ft_pct_rank` | integer |  |
| `is_active_flag` | character | Flag indicating whether the player is currently active in the league. |

**Row type:** `WnbaStatsAlltimeleadersgridsTables`, `WnbaStatsAlltimeleadersgridsGPLeadersRow`, `WnbaStatsAlltimeleadersgridsPTSLeadersRow`, `WnbaStatsAlltimeleadersgridsASTLeadersRow`, `WnbaStatsAlltimeleadersgridsSTLLeadersRow`, `WnbaStatsAlltimeleadersgridsOREBLeadersRow`, `WnbaStatsAlltimeleadersgridsDREBLeadersRow`, `WnbaStatsAlltimeleadersgridsREBLeadersRow`, `WnbaStatsAlltimeleadersgridsBLKLeadersRow`, `WnbaStatsAlltimeleadersgridsFGMLeadersRow`, `WnbaStatsAlltimeleadersgridsFGALeadersRow`, `WnbaStatsAlltimeleadersgridsFGPCTLeadersRow`, `WnbaStatsAlltimeleadersgridsTOVLeadersRow`, `WnbaStatsAlltimeleadersgridsFG3MLeadersRow`, `WnbaStatsAlltimeleadersgridsFG3ALeadersRow`, `WnbaStatsAlltimeleadersgridsFG3PCTLeadersRow`, `WnbaStatsAlltimeleadersgridsPFLeadersRow`, `WnbaStatsAlltimeleadersgridsFTMLeadersRow`, `WnbaStatsAlltimeleadersgridsFTALeadersRow`, `WnbaStatsAlltimeleadersgridsFTPCTLeadersRow` (exported from the package root).

### Returns — `wnba_stats_assistleaders` / `wnbaStatsAssistleaders`

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `player_id` | integer | Unique player identifier. |
| `player` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `jersey_num` | character | Jersey number worn by the player. |
| `player_position` | character |  |
| `ast` | numeric | Assists. |

**Row type:** `WnbaStatsAssistleadersRow` (exported from the package root).

### Returns — `wnba_stats_assisttracker` / `wnbaStatsAssisttracker`

| col_name | type | description |
|---|---|---|
| `assists` | numeric | Total assists. |

**Row type:** `WnbaStatsAssisttrackerRow` (exported from the package root).

### Returns — `wnba_stats_boxscoreadvancedv2` / `wnbaStatsBoxscoreadvancedv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at ('F', 'C', or 'G'); empty for bench players. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `e_off_rating` | numeric | Estimated offensive rating: points produced per 100 possessions using the stats API's estimated-possession formula. |
| `off_rating` | numeric | Points scored per 100 possessions while on the floor. |
| `e_def_rating` | numeric | Estimated defensive rating: points allowed per 100 possessions using the estimated-possession formula. |
| `def_rating` | numeric | Points allowed per 100 possessions while on the floor. |
| `e_net_rating` | numeric | Estimated net rating: estimated offensive rating minus estimated defensive rating. |
| `net_rating` | numeric | Net rating (off rating - def rating). |
| `ast_pct` | numeric | Assist percentage. |
| `ast_tov` | numeric | Ratio of assists to turnovers. |
| `ast_ratio` | numeric | Assists per 100 possessions used. |
| `oreb_pct` | numeric | Percentage of available offensive rebounds grabbed while on the floor. |
| `dreb_pct` | numeric | Percentage of available defensive rebounds grabbed while on the floor. |
| `reb_pct` | numeric | Percentage of all available rebounds grabbed while on the floor. |
| `tm_tov_pct` | numeric | Turnovers committed per 100 possessions. |
| `efg_pct` | numeric | Effective field goal percentage: (FGM + 0.5 * FG3M) / FGA. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `usg_pct` | numeric | Percentage of team plays used while on the floor. |
| `e_usg_pct` | numeric | Estimated usage percentage using the stats API's estimated-possession formula. |
| `e_pace` | numeric | Estimated pace: team possessions per regulation game, from the estimated-possession formula. |
| `pace` | numeric | Possessions per 48 minutes. |
| `pace_per40` | numeric | Pace per40. |
| `poss` | integer | Poss. |
| `pie` | numeric | Player Impact Estimate (0-1). |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `e_off_rating` | numeric | Estimated offensive rating: points produced per 100 possessions using the stats API's estimated-possession formula. |
| `off_rating` | numeric | Points scored per 100 possessions while on the floor. |
| `e_def_rating` | numeric | Estimated defensive rating: points allowed per 100 possessions using the estimated-possession formula. |
| `def_rating` | numeric | Points allowed per 100 possessions while on the floor. |
| `e_net_rating` | numeric | Estimated net rating: estimated offensive rating minus estimated defensive rating. |
| `net_rating` | numeric | Net rating (off rating - def rating). |
| `ast_pct` | numeric | Assist percentage. |
| `ast_tov` | numeric | Ratio of assists to turnovers. |
| `ast_ratio` | numeric | Assists per 100 possessions used. |
| `oreb_pct` | numeric | Percentage of available offensive rebounds grabbed while on the floor. |
| `dreb_pct` | numeric | Percentage of available defensive rebounds grabbed while on the floor. |
| `reb_pct` | numeric | Percentage of all available rebounds grabbed while on the floor. |
| `e_tm_tov_pct` | numeric |  |
| `tm_tov_pct` | numeric | Turnovers committed per 100 possessions. |
| `efg_pct` | numeric | Effective field goal percentage: (FGM + 0.5 * FG3M) / FGA. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `usg_pct` | numeric | Percentage of team plays used while on the floor. |
| `e_usg_pct` | numeric | Estimated usage percentage using the stats API's estimated-possession formula. |
| `e_pace` | numeric | Estimated pace: team possessions per regulation game, from the estimated-possession formula. |
| `pace` | numeric | Possessions per 48 minutes. |
| `pace_per40` | numeric | Pace per40. |
| `poss` | integer | Poss. |
| `pie` | numeric | Player Impact Estimate (0-1). |

**Row type:** `WnbaStatsBoxscoreadvancedv2Tables`, `WnbaStatsBoxscoreadvancedv2PlayerStatsRow`, `WnbaStatsBoxscoreadvancedv2TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoreadvancedv3` / `wnbaStatsBoxscoreadvancedv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `estimated_offensive_rating` | numeric | Estimated offensive rating from the stats API's estimated-metrics family. |
| `offensive_rating` | numeric | Points scored per 100 possessions while on the floor (offensive rating). |
| `estimated_defensive_rating` | numeric | Estimated defensive rating from the stats API's estimated-metrics family. |
| `defensive_rating` | numeric | Points allowed per 100 possessions while on the floor (defensive rating). |
| `estimated_net_rating` | numeric | Estimated net rating (estimated offensive minus defensive rating) from the stats API's estimated-metrics family. |
| `net_rating` | numeric | Offensive rating minus defensive rating while on the floor (net rating). |
| `assist_percentage` | numeric | Percentage of teammate field goals assisted while on the floor, as a decimal. |
| `assist_to_turnover` | numeric | Ratio of assists to turnovers. |
| `assist_ratio` | numeric | Assists per 100 possessions used (assist ratio). |
| `offensive_rebound_percentage` | numeric | Percentage of available offensive rebounds secured while on the floor, as a decimal. |
| `defensive_rebound_percentage` | numeric | Percentage of available defensive rebounds secured while on the floor, as a decimal. |
| `rebound_percentage` | numeric | Percentage of all available rebounds secured while on the floor, as a decimal. |
| `turnover_ratio` | numeric | Turnovers per 100 possessions used (turnover ratio). |
| `effective_field_goal_percentage` | numeric | Effective field goal percentage (weights made threes at 1.5), as a decimal. |
| `true_shooting_percentage` | numeric | True shooting percentage (accounts for threes and free throws), as a decimal. |
| `usage_percentage` | numeric | Percentage of team plays used by the player while on the floor, as a decimal. |
| `estimated_usage_percentage` | numeric | Estimated percentage of team plays used by the player while on the floor, as a decimal. |
| `estimated_pace` | numeric | Estimated pace (possessions per 48 minutes) from the stats API's estimated-metrics family. |
| `pace` | numeric | Possessions per 48 minutes. |
| `pace_per40` | numeric | Pace normalized to possessions per 40 minutes. |
| `possessions` | numeric | Possessions used. |
| `pie` | numeric | Player Impact Estimate (0-1). |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `estimated_offensive_rating` | numeric | Estimated offensive rating from the stats API's estimated-metrics family. |
| `offensive_rating` | numeric | Points scored per 100 possessions while on the floor (offensive rating). |
| `estimated_defensive_rating` | numeric | Estimated defensive rating from the stats API's estimated-metrics family. |
| `defensive_rating` | numeric | Points allowed per 100 possessions while on the floor (defensive rating). |
| `estimated_net_rating` | numeric | Estimated net rating (estimated offensive minus defensive rating) from the stats API's estimated-metrics family. |
| `net_rating` | numeric | Offensive rating minus defensive rating while on the floor (net rating). |
| `assist_percentage` | numeric | Percentage of teammate field goals assisted while on the floor, as a decimal. |
| `assist_to_turnover` | numeric | Ratio of assists to turnovers. |
| `assist_ratio` | numeric | Assists per 100 possessions used (assist ratio). |
| `offensive_rebound_percentage` | numeric | Percentage of available offensive rebounds secured while on the floor, as a decimal. |
| `defensive_rebound_percentage` | numeric | Percentage of available defensive rebounds secured while on the floor, as a decimal. |
| `rebound_percentage` | numeric | Percentage of all available rebounds secured while on the floor, as a decimal. |
| `estimated_team_turnover_percentage` | numeric | Estimated team turnover percentage (0-1). |
| `turnover_ratio` | numeric | Turnovers per 100 possessions used (turnover ratio). |
| `effective_field_goal_percentage` | numeric | Effective field goal percentage (weights made threes at 1.5), as a decimal. |
| `true_shooting_percentage` | numeric | True shooting percentage (accounts for threes and free throws), as a decimal. |
| `usage_percentage` | numeric | Percentage of team plays used by the player while on the floor, as a decimal. |
| `estimated_usage_percentage` | numeric | Estimated percentage of team plays used by the player while on the floor, as a decimal. |
| `estimated_pace` | numeric | Estimated pace (possessions per 48 minutes) from the stats API's estimated-metrics family. |
| `pace` | numeric | Possessions per 48 minutes. |
| `pace_per40` | numeric | Pace normalized to possessions per 40 minutes. |
| `possessions` | numeric | Possessions used. |
| `pie` | numeric | Player Impact Estimate (0-1). |

**Row type:** `WnbaStatsBoxscoreadvancedv3Tables`, `WnbaStatsBoxscoreadvancedv3PlayerStatsRow`, `WnbaStatsBoxscoreadvancedv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoredefensivev2` / `wnbaStatsBoxscoredefensivev2`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `person_id` | integer | Stats API identifier for personid associated with this NBA or WNBA Stats row. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Display name for familyname associated with this NBA or WNBA Stats row. |
| `name_i` | character | NBA or WNBA Stats value for namei in the boxscoredefensivev2 result set. |
| `player_slug` | character | URL slug for playerslug used by NBA or WNBA Stats pages. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | NBA or WNBA Stats value for jerseynum in the boxscoredefensivev2 result set. |
| `matchup_minutes` | character | NBA or WNBA Stats value for matchupminutes in the boxscoredefensivev2 result set. |
| `partial_possessions` | numeric | Estimated partial possessions credited to the stint or rotation interval. |
| `switches_on` | integer | NBA or WNBA Stats value for switcheson in the boxscoredefensivev2 result set. |
| `player_points` | integer | Scoring or score-margin metric for playerpoints in the requested NBA or WNBA Stats split. |
| `defensive_rebounds` | integer | Rebounding metric for defensiverebounds in the requested NBA or WNBA Stats split. |
| `matchup_assists` | integer | Passing or assist metric for matchupassists in the requested NBA or WNBA Stats split. |
| `matchup_turnovers` | integer | Turnover or loose-ball metric for matchupturnovers in the requested NBA or WNBA Stats split. |
| `steals` | integer | Total steals. |
| `blocks` | integer | Total blocks. |
| `matchup_field_goals_made` | integer | Shooting metric for matchupfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `matchup_field_goals_attempted` | integer | Shooting metric for matchupfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `matchup_field_goal_percentage` | numeric | Percentage or rate for matchupfieldgoalpercentage in the requested NBA or WNBA Stats split. |
| `matchup_three_pointers_made` | integer | Shooting metric for matchupthreepointersmade in the requested NBA or WNBA Stats split. |
| `matchup_three_pointers_attempted` | integer | Shooting metric for matchupthreepointersattempted in the requested NBA or WNBA Stats split. |
| `matchup_three_pointer_percentage` | numeric | Percentage or rate for matchupthreepointerpercentage in the requested NBA or WNBA Stats split. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |

**Row type:** `WnbaStatsBoxscoredefensivev2Tables`, `WnbaStatsBoxscoredefensivev2PlayerStatsRow`, `WnbaStatsBoxscoredefensivev2TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscorefourfactorsv2` / `wnbaStatsBoxscorefourfactorsv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`sqlPlayersFourFactors`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at ('F', 'C', or 'G'); empty for bench players. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `efg_pct` | numeric | Effective field goal percentage: (FGM + 0.5 * FG3M) / FGA. |
| `fta_rate` | numeric | Free throw attempt rate: free throw attempts per field goal attempt. |
| `tm_tov_pct` | numeric | Turnovers committed per 100 possessions. |
| `oreb_pct` | numeric | Percentage of available offensive rebounds grabbed while on the floor. |
| `opp_efg_pct` | numeric | Opponent effective field goal percentage while on the floor. |
| `opp_fta_rate` | numeric | Opponent free throw attempts per field goal attempt while on the floor. |
| `opp_tov_pct` | numeric | Opponent turnovers per 100 possessions while on the floor. |
| `opp_oreb_pct` | numeric | Percentage of available offensive rebounds grabbed by the opponent while on the floor. |

**`sqlTeamsFourFactors`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `efg_pct` | numeric | Effective field goal percentage: (FGM + 0.5 * FG3M) / FGA. |
| `fta_rate` | numeric | Free throw attempt rate: free throw attempts per field goal attempt. |
| `tm_tov_pct` | numeric | Turnovers committed per 100 possessions. |
| `oreb_pct` | numeric | Percentage of available offensive rebounds grabbed while on the floor. |
| `opp_efg_pct` | numeric | Opponent effective field goal percentage while on the floor. |
| `opp_fta_rate` | numeric | Opponent free throw attempts per field goal attempt while on the floor. |
| `opp_tov_pct` | numeric | Opponent turnovers per 100 possessions while on the floor. |
| `opp_oreb_pct` | numeric | Percentage of available offensive rebounds grabbed by the opponent while on the floor. |

**Row type:** `WnbaStatsBoxscorefourfactorsv2Tables`, `WnbaStatsBoxscorefourfactorsv2SqlPlayersFourFactorsRow`, `WnbaStatsBoxscorefourfactorsv2SqlTeamsFourFactorsRow` (exported from the package root).

### Returns — `wnba_stats_boxscorefourfactorsv3` / `wnbaStatsBoxscorefourfactorsv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `effective_field_goal_percentage` | numeric | Effective field goal percentage four-factor, as a decimal. |
| `free_throw_attempt_rate` | numeric | Free throw attempts per field goal attempt (free throw rate four-factor). |
| `team_turnover_percentage` | numeric | Turnovers committed per 100 possessions (turnover four-factor). |
| `offensive_rebound_percentage` | numeric | Offensive rebound percentage four-factor, as a decimal. |
| `opp_effective_field_goal_percentage` | numeric | Opponent's effective field goal percentage while on the floor, as a decimal. |
| `opp_free_throw_attempt_rate` | numeric | Opponent's free throw attempt rate while on the floor. |
| `opp_team_turnover_percentage` | numeric | Opponent turnovers forced per 100 possessions while on the floor. |
| `opp_offensive_rebound_percentage` | numeric | Opponent's offensive rebound percentage while on the floor, as a decimal. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `effective_field_goal_percentage` | numeric | Effective field goal percentage four-factor, as a decimal. |
| `free_throw_attempt_rate` | numeric | Free throw attempts per field goal attempt (free throw rate four-factor). |
| `team_turnover_percentage` | numeric | Turnovers committed per 100 possessions (turnover four-factor). |
| `offensive_rebound_percentage` | numeric | Offensive rebound percentage four-factor, as a decimal. |
| `opp_effective_field_goal_percentage` | numeric | Opponent's effective field goal percentage while on the floor, as a decimal. |
| `opp_free_throw_attempt_rate` | numeric | Opponent's free throw attempt rate while on the floor. |
| `opp_team_turnover_percentage` | numeric | Opponent turnovers forced per 100 possessions while on the floor. |
| `opp_offensive_rebound_percentage` | numeric | Opponent's offensive rebound percentage while on the floor, as a decimal. |

**Row type:** `WnbaStatsBoxscorefourfactorsv3Tables`, `WnbaStatsBoxscorefourfactorsv3PlayerStatsRow`, `WnbaStatsBoxscorefourfactorsv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscorehustlev2` / `wnbaStatsBoxscorehustlev2`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`** — no columns in the reference capture


**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `statistics` | character |  |

**Row type:** `WnbaStatsBoxscorehustlev2Tables`, `WnbaStatsBoxscorehustlev2PlayerStatsRow`, `WnbaStatsBoxscorehustlev2TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscorematchupsv3` / `wnbaStatsBoxscorematchupsv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `person_id` | integer | NBA or WNBA Stats player identifier associated with the matchup boxscore row. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family name in the NBA or WNBA Stats matchup boxscore row. |
| `name_i` | character | Abbreviated player display name used in the NBA or WNBA Stats matchup boxscore row. |
| `player_slug` | character | URL slug for the player on NBA or WNBA Stats pages. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player jersey number shown in the NBA or WNBA Stats matchup boxscore row. |
| `matchups` | character |  |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |

**Row type:** `WnbaStatsBoxscorematchupsv3Tables`, `WnbaStatsBoxscorematchupsv3PlayerStatsRow`, `WnbaStatsBoxscorematchupsv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoremiscv2` / `wnbaStatsBoxscoremiscv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`sqlPlayersMisc`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at ('F', 'C', or 'G'); empty for bench players. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `pts_off_tov` | integer | Points scored following opponent turnovers. |
| `pts_2_nd_chance` | integer | Second-chance points scored after offensive rebounds. |
| `pts_fb` | integer | Fast-break points scored. |
| `pts_paint` | integer | Points scored in the paint. |
| `opp_pts_off_tov` | numeric | Opponent points scored off turnovers while on the floor. |
| `opp_pts_2_nd_chance` | numeric | Opponent second-chance points scored while on the floor. |
| `opp_pts_fb` | numeric | Opponent fast-break points scored while on the floor. |
| `opp_pts_paint` | numeric | Opponent points in the paint scored while on the floor. |
| `blk` | integer | Blocks. |
| `blka` | integer | Number of own field goal attempts that were blocked by opponents. |
| `pf` | integer | Personal fouls. |
| `pfd` | integer | Personal fouls drawn. |

**`sqlTeamsMisc`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `pts_off_tov` | numeric | Points scored following opponent turnovers. |
| `pts_2_nd_chance` | numeric | Second-chance points scored after offensive rebounds. |
| `pts_fb` | numeric | Fast-break points scored. |
| `pts_paint` | numeric | Points scored in the paint. |
| `opp_pts_off_tov` | numeric | Opponent points scored off turnovers while on the floor. |
| `opp_pts_2_nd_chance` | numeric | Opponent second-chance points scored while on the floor. |
| `opp_pts_fb` | numeric | Opponent fast-break points scored while on the floor. |
| `opp_pts_paint` | numeric | Opponent points in the paint scored while on the floor. |
| `blk` | integer | Blocks. |
| `blka` | integer | Number of own field goal attempts that were blocked by opponents. |
| `pf` | integer | Personal fouls. |
| `pfd` | integer | Personal fouls drawn. |

**Row type:** `WnbaStatsBoxscoremiscv2Tables`, `WnbaStatsBoxscoremiscv2SqlPlayersMiscRow`, `WnbaStatsBoxscoremiscv2SqlTeamsMiscRow` (exported from the package root).

### Returns — `wnba_stats_boxscoremiscv3` / `wnbaStatsBoxscoremiscv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `points_off_turnovers` | integer | Points scored off opponent turnovers. |
| `points_second_chance` | integer | Second-chance points scored after offensive rebounds. |
| `points_fast_break` | integer | Fast-break points scored. |
| `points_paint` | integer | Points scored in the paint. |
| `opp_points_off_turnovers` | integer | Opponent points off turnovers scored while on the floor. |
| `opp_points_second_chance` | integer | Opponent second-chance points scored while on the floor. |
| `opp_points_fast_break` | integer | Opponent fast-break points scored while on the floor. |
| `opp_points_paint` | integer | Opponent points in the paint scored while on the floor. |
| `blocks` | integer | Total blocks. |
| `blocks_against` | integer | Player's shot attempts that were blocked by opponents. |
| `fouls_personal` | integer | Personal fouls committed. |
| `fouls_drawn` | integer | Personal fouls drawn. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `points_off_turnovers` | integer | Points scored off opponent turnovers. |
| `points_second_chance` | integer | Second-chance points scored after offensive rebounds. |
| `points_fast_break` | integer | Fast-break points scored. |
| `points_paint` | integer | Points scored in the paint. |
| `opp_points_off_turnovers` | integer | Opponent points off turnovers scored while on the floor. |
| `opp_points_second_chance` | integer | Opponent second-chance points scored while on the floor. |
| `opp_points_fast_break` | integer | Opponent fast-break points scored while on the floor. |
| `opp_points_paint` | integer | Opponent points in the paint scored while on the floor. |
| `blocks` | integer | Total blocks. |
| `blocks_against` | integer | Player's shot attempts that were blocked by opponents. |
| `fouls_personal` | integer | Personal fouls committed. |
| `fouls_drawn` | integer | Personal fouls drawn. |

**Row type:** `WnbaStatsBoxscoremiscv3Tables`, `WnbaStatsBoxscoremiscv3PlayerStatsRow`, `WnbaStatsBoxscoremiscv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoreplayertrackv3` / `wnbaStatsBoxscoreplayertrackv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `person_id` | integer | Stats API identifier for personid associated with this NBA or WNBA Stats row. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Display name for familyname associated with this NBA or WNBA Stats row. |
| `name_i` | character | NBA or WNBA Stats value for namei in the boxscoreplayertrackv3 result set. |
| `player_slug` | character | URL slug for playerslug used by NBA or WNBA Stats pages. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | NBA or WNBA Stats value for jerseynum in the boxscoreplayertrackv3 result set. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `speed` | numeric | Speed. |
| `distance` | numeric | Distance value (in feet for shot data; otherwise context-dependent). |
| `rebound_chances_offensive` | integer | Rebounding metric for reboundchancesoffensive in the requested NBA or WNBA Stats split. |
| `rebound_chances_defensive` | integer | Rebounding metric for reboundchancesdefensive in the requested NBA or WNBA Stats split. |
| `rebound_chances_total` | integer | Rebounding metric for reboundchancestotal in the requested NBA or WNBA Stats split. |
| `touches` | integer | Touches. |
| `secondary_assists` | integer | Passing or assist metric for secondaryassists in the requested NBA or WNBA Stats split. |
| `free_throw_assists` | integer | Shooting metric for freethrowassists in the requested NBA or WNBA Stats split. |
| `passes` | integer | Passes. |
| `assists` | integer | Total assists. |
| `contested_field_goals_made` | integer | Shooting metric for contestedfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `contested_field_goals_attempted` | integer | Shooting metric for contestedfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `contested_field_goal_percentage` | numeric | Percentage or rate for contestedfieldgoalpercentage in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_made` | integer | Shooting metric for uncontestedfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_attempted` | integer | Shooting metric for uncontestedfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_percentage` | numeric | Percentage or rate for uncontestedfieldgoalspercentage in the requested NBA or WNBA Stats split. |
| `field_goal_percentage` | numeric | Percentage or rate for fieldgoalpercentage in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goals_made` | integer | Shooting metric for defendedatrimfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goals_attempted` | integer | Shooting metric for defendedatrimfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goal_percentage` | numeric | Percentage or rate for defendedatrimfieldgoalpercentage in the requested NBA or WNBA Stats split. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique stats.nba.com game identifier in endpoints that use compact schedule field names. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team code used by NBA or WNBA Stats schedule and scoreboard feeds. |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `distance` | numeric | Distance value (in feet for shot data; otherwise context-dependent). |
| `rebound_chances_offensive` | integer | Rebounding metric for reboundchancesoffensive in the requested NBA or WNBA Stats split. |
| `rebound_chances_defensive` | integer | Rebounding metric for reboundchancesdefensive in the requested NBA or WNBA Stats split. |
| `rebound_chances_total` | integer | Rebounding metric for reboundchancestotal in the requested NBA or WNBA Stats split. |
| `touches` | integer | Touches. |
| `secondary_assists` | integer | Passing or assist metric for secondaryassists in the requested NBA or WNBA Stats split. |
| `free_throw_assists` | integer | Shooting metric for freethrowassists in the requested NBA or WNBA Stats split. |
| `passes` | integer | Passes. |
| `assists` | integer | Total assists. |
| `contested_field_goals_made` | integer | Shooting metric for contestedfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `contested_field_goals_attempted` | integer | Shooting metric for contestedfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `contested_field_goal_percentage` | numeric | Percentage or rate for contestedfieldgoalpercentage in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_made` | integer | Shooting metric for uncontestedfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_attempted` | integer | Shooting metric for uncontestedfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `uncontested_field_goals_percentage` | numeric | Percentage or rate for uncontestedfieldgoalspercentage in the requested NBA or WNBA Stats split. |
| `field_goal_percentage` | numeric | Percentage or rate for fieldgoalpercentage in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goals_made` | integer | Shooting metric for defendedatrimfieldgoalsmade in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goals_attempted` | integer | Shooting metric for defendedatrimfieldgoalsattempted in the requested NBA or WNBA Stats split. |
| `defended_at_rim_field_goal_percentage` | numeric | Percentage or rate for defendedatrimfieldgoalpercentage in the requested NBA or WNBA Stats split. |

**Row type:** `WnbaStatsBoxscoreplayertrackv3Tables`, `WnbaStatsBoxscoreplayertrackv3PlayerStatsRow`, `WnbaStatsBoxscoreplayertrackv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscorescoringv2` / `wnbaStatsBoxscorescoringv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`sqlPlayersScoring`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at ('F', 'C', or 'G'); empty for bench players. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `pct_fga_2_pt` | numeric | Share of field goal attempts taken as two-pointers. |
| `pct_fga_3_pt` | numeric | Share of field goal attempts taken as three-pointers. |
| `pct_pts_2_pt` | numeric | Share of points scored on two-point field goals. |
| `pct_pts_2_pt_mr` | numeric | Share of points scored on mid-range two-point field goals. |
| `pct_pts_3_pt` | numeric | Share of points scored on three-point field goals. |
| `pct_pts_fb` | numeric | Share of points scored on the fast break. |
| `pct_pts_ft` | numeric | Share of points scored on free throws. |
| `pct_pts_off_tov` | numeric | Share of points scored off opponent turnovers. |
| `pct_pts_paint` | numeric | Share of points scored in the paint. |
| `pct_ast_2_pm` | numeric | Share of made two-point field goals that were assisted. |
| `pct_uast_2_pm` | numeric | Share of made two-point field goals that were unassisted. |
| `pct_ast_3_pm` | numeric | Share of made three-point field goals that were assisted. |
| `pct_uast_3_pm` | numeric | Share of made three-point field goals that were unassisted. |
| `pct_ast_fgm` | numeric | Share of all made field goals that were assisted. |
| `pct_uast_fgm` | numeric | Share of all made field goals that were unassisted. |

**`sqlTeamsScoring`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `pct_fga_2_pt` | numeric | Share of field goal attempts taken as two-pointers. |
| `pct_fga_3_pt` | numeric | Share of field goal attempts taken as three-pointers. |
| `pct_pts_2_pt` | numeric | Share of points scored on two-point field goals. |
| `pct_pts_2_pt_mr` | numeric | Share of points scored on mid-range two-point field goals. |
| `pct_pts_3_pt` | numeric | Share of points scored on three-point field goals. |
| `pct_pts_fb` | numeric | Share of points scored on the fast break. |
| `pct_pts_ft` | numeric | Share of points scored on free throws. |
| `pct_pts_off_tov` | numeric | Share of points scored off opponent turnovers. |
| `pct_pts_paint` | numeric | Share of points scored in the paint. |
| `pct_ast_2_pm` | numeric | Share of made two-point field goals that were assisted. |
| `pct_uast_2_pm` | numeric | Share of made two-point field goals that were unassisted. |
| `pct_ast_3_pm` | numeric | Share of made three-point field goals that were assisted. |
| `pct_uast_3_pm` | numeric | Share of made three-point field goals that were unassisted. |
| `pct_ast_fgm` | numeric | Share of all made field goals that were assisted. |
| `pct_uast_fgm` | numeric | Share of all made field goals that were unassisted. |

**Row type:** `WnbaStatsBoxscorescoringv2Tables`, `WnbaStatsBoxscorescoringv2SqlPlayersScoringRow`, `WnbaStatsBoxscorescoringv2SqlTeamsScoringRow` (exported from the package root).

### Returns — `wnba_stats_boxscorescoringv3` / `wnbaStatsBoxscorescoringv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `percentage_field_goals_attempted2pt` | numeric | Share of field goal attempts taken as two-pointers, as a decimal. |
| `percentage_field_goals_attempted3pt` | numeric | Share of field goal attempts taken as three-pointers, as a decimal. |
| `percentage_points2pt` | numeric | Share of points scored on two-pointers, as a decimal. |
| `percentage_points_midrange2pt` | numeric | Share of points scored on mid-range two-pointers, as a decimal. |
| `percentage_points3pt` | numeric | Share of points scored on three-pointers, as a decimal. |
| `percentage_points_fast_break` | numeric | Share of points scored on fast breaks, as a decimal. |
| `percentage_points_free_throw` | numeric | Share of points scored at the free throw line, as a decimal. |
| `percentage_points_off_turnovers` | numeric | Share of points scored off opponent turnovers, as a decimal. |
| `percentage_points_paint` | numeric | Share of points scored in the paint, as a decimal. |
| `percentage_assisted2pt` | numeric | Percentage of made two-pointers that were assisted, as a decimal. |
| `percentage_unassisted2pt` | numeric | Percentage of made two-pointers that were unassisted, as a decimal. |
| `percentage_assisted3pt` | numeric | Percentage of made three-pointers that were assisted, as a decimal. |
| `percentage_unassisted3pt` | numeric | Percentage of made three-pointers that were unassisted, as a decimal. |
| `percentage_assisted_fgm` | numeric | Percentage of made field goals that were assisted, as a decimal. |
| `percentage_unassisted_fgm` | numeric | Percentage of made field goals that were unassisted, as a decimal. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `percentage_field_goals_attempted2pt` | numeric | Share of field goal attempts taken as two-pointers, as a decimal. |
| `percentage_field_goals_attempted3pt` | numeric | Share of field goal attempts taken as three-pointers, as a decimal. |
| `percentage_points2pt` | numeric | Share of points scored on two-pointers, as a decimal. |
| `percentage_points_midrange2pt` | numeric | Share of points scored on mid-range two-pointers, as a decimal. |
| `percentage_points3pt` | numeric | Share of points scored on three-pointers, as a decimal. |
| `percentage_points_fast_break` | numeric | Share of points scored on fast breaks, as a decimal. |
| `percentage_points_free_throw` | numeric | Share of points scored at the free throw line, as a decimal. |
| `percentage_points_off_turnovers` | numeric | Share of points scored off opponent turnovers, as a decimal. |
| `percentage_points_paint` | numeric | Share of points scored in the paint, as a decimal. |
| `percentage_assisted2pt` | numeric | Percentage of made two-pointers that were assisted, as a decimal. |
| `percentage_unassisted2pt` | numeric | Percentage of made two-pointers that were unassisted, as a decimal. |
| `percentage_assisted3pt` | numeric | Percentage of made three-pointers that were assisted, as a decimal. |
| `percentage_unassisted3pt` | numeric | Percentage of made three-pointers that were unassisted, as a decimal. |
| `percentage_assisted_fgm` | numeric | Percentage of made field goals that were assisted, as a decimal. |
| `percentage_unassisted_fgm` | numeric | Percentage of made field goals that were unassisted, as a decimal. |

**Row type:** `WnbaStatsBoxscorescoringv3Tables`, `WnbaStatsBoxscorescoringv3PlayerStatsRow`, `WnbaStatsBoxscorescoringv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoresummaryv2` / `wnbaStatsBoxscoresummaryv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`GameSummary`**

| col_name | type | description |
|---|---|---|
| `game_date_est` | character | Game date est. |
| `game_sequence` | integer | Game sequence. |
| `game_id` | character | Unique game identifier. |
| `game_status_id` | integer | Numeric game status identifier. |
| `game_status_text` | character | Game status display text (e.g. 'Final', '4:32 - 4th'). |
| `gamecode` | character | Gamecode. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `live_period` | integer | Live period. |
| `live_pc_time` | character | Time / clock value. |
| `natl_tv_broadcaster_abbreviation` | character | Natl tv broadcaster abbreviation. |
| `live_period_time_bcast` | character | Live period time bcast. |
| `wh_status` | integer | Wh status. |

**`OtherStats`**

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `pts_paint` | integer | Points scored in the paint. |
| `pts_2_nd_chance` | integer |  |
| `pts_fb` | integer |  |
| `largest_lead` | integer | Largest lead during the game. |
| `lead_changes` | integer | Lead changes. |
| `times_tied` | integer | Times tied. |
| `team_turnovers` | integer | Team turnovers (turnovers credited to the team rather than a player). |
| `total_turnovers` | integer | Total turnovers (player + team). |
| `team_rebounds` | integer | Team rebounds (rebounds credited to the team rather than a player). |
| `pts_off_to` | integer |  |

**`Officials`**

| col_name | type | description |
|---|---|---|
| `official_id` | integer | Unique official / referee identifier. |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `jersey_num` | character | Jersey number worn by the player. |

**`InactivePlayers`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `jersey_num` | character | Jersey number worn by the player. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |

**`GameInfo`**

| col_name | type | description |
|---|---|---|
| `game_date` | character | Game date (YYYY-MM-DD). |
| `attendance` | integer | Reported attendance. |
| `game_time` | character | Game start time. |

**`LineScore`**

| col_name | type | description |
|---|---|---|
| `game_date_est` | character | Game date est. |
| `game_sequence` | integer | Game sequence. |
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city_name` | character | Team city name. |
| `team_nickname` | character | Team nickname. |
| `team_wins_losses` | character | Team wins losses. |
| `pts_qtr1` | integer | Pts qtr1. |
| `pts_qtr2` | integer | Pts qtr2. |
| `pts_qtr3` | integer | Pts qtr3. |
| `pts_qtr4` | integer | Pts qtr4. |
| `pts_ot1` | integer | Pts ot1. |
| `pts_ot2` | integer | Scoring or score-margin metric for points ot2 in the requested NBA or WNBA Stats split. |
| `pts_ot3` | integer | Scoring or score-margin metric for points ot3 in the requested NBA or WNBA Stats split. |
| `pts_ot4` | integer | Scoring or score-margin metric for points ot4 in the requested NBA or WNBA Stats split. |
| `pts_ot5` | integer | Scoring or score-margin metric for points ot5 in the requested NBA or WNBA Stats split. |
| `pts_ot6` | integer | Scoring or score-margin metric for points ot6 in the requested NBA or WNBA Stats split. |
| `pts_ot7` | integer | Scoring or score-margin metric for points ot7 in the requested NBA or WNBA Stats split. |
| `pts_ot8` | integer | Scoring or score-margin metric for points ot8 in the requested NBA or WNBA Stats split. |
| `pts_ot9` | integer | Scoring or score-margin metric for points ot9 in the requested NBA or WNBA Stats split. |
| `pts_ot10` | integer | Scoring or score-margin metric for points ot10 in the requested NBA or WNBA Stats split. |
| `pts` | integer | Points scored. |

**`LastMeeting`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `last_game_id` | character |  |
| `last_game_date_est` | character |  |
| `last_game_home_team_id` | integer |  |
| `last_game_home_team_city` | character |  |
| `last_game_home_team_name` | character |  |
| `last_game_home_team_abbreviation` | character |  |
| `last_game_home_team_points` | integer |  |
| `last_game_visitor_team_id` | integer |  |
| `last_game_visitor_team_city` | character |  |
| `last_game_visitor_team_name` | character |  |
| `last_game_visitor_team_city1` | character |  |
| `last_game_visitor_team_points` | integer |  |

**`SeasonSeries`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `game_date_est` | character | Game date est. |
| `home_team_wins` | integer | Home team's team wins. |
| `home_team_losses` | integer | Home team's team losses. |
| `series_leader` | character |  |

**`AvailableVideo`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `video_available_flag` | integer | Video available flag. |
| `pt_available` | integer | Pt available. |
| `pt_xyz_available` | integer | Pt xyz available. |
| `wh_status` | integer | Wh status. |
| `hustle_status` | integer | Hustle status. |
| `historical_status` | integer | Historical status. |

**Row type:** `WnbaStatsBoxscoresummaryv2Tables`, `WnbaStatsBoxscoresummaryv2GameSummaryRow`, `WnbaStatsBoxscoresummaryv2OtherStatsRow`, `WnbaStatsBoxscoresummaryv2OfficialsRow`, `WnbaStatsBoxscoresummaryv2InactivePlayersRow`, `WnbaStatsBoxscoresummaryv2GameInfoRow`, `WnbaStatsBoxscoresummaryv2LineScoreRow`, `WnbaStatsBoxscoresummaryv2LastMeetingRow`, `WnbaStatsBoxscoresummaryv2SeasonSeriesRow`, `WnbaStatsBoxscoresummaryv2AvailableVideoRow` (exported from the package root).

### Returns — `wnba_stats_boxscoresummaryv3` / `wnbaStatsBoxscoresummaryv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `game_code` | character | ESPN game code (numeric identifier). |
| `game_status` | integer | Game status label. |
| `game_status_text` | character | Game status display text (e.g. 'Final', '4:32 - 4th'). |
| `period` | integer | Period of the game (1-4 quarters; 5+ for OT). |
| `game_clock` | character | Game clock. |
| `game_time_utc` | character | Game start time in UTC (ISO 8601 timestamp). |
| `game_et` | character | Game et. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `duration` | character | Duration. |
| `attendance` | integer | Reported attendance. |
| `sellout` | integer | Sellout. |
| `series_game_number` | character | Series game number. |
| `game_label` | character |  |
| `game_sub_label` | character |  |
| `series_text` | character | Series text. |
| `if_necessary` | logical | If necessary. |
| `is_neutral` | logical |  |
| `video_available_flag` | integer | Video available flag. |
| `pt_available` | integer | Pt available. |
| `pt_xyz_available` | integer | Pt xyz available. |
| `wh_status` | integer | Wh status. |
| `hustle_status` | integer | Hustle status. |
| `historical_status` | integer | Historical status. |
| `game_subtype` | character | Game subtype. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `team_wins` | integer | Team's win total entering the game. |
| `team_losses` | integer | Team's loss total entering the game. |
| `score` | integer | Final score. |
| `in_bonus` | character | Whether the team is currently in the bonus (penalty) foul situation, as reported by the stats API. |
| `timeouts_remaining` | integer | Timeouts the team has remaining. |
| `seed` | integer | Team's playoff seed, populated for postseason games. |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `name` | character | Display name. |
| `name_i` | character | Initialed name (e.g. 'A. Wilson'). |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family / last name. |
| `jersey_num` | character | Jersey number worn by the player. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `game_code` | character | ESPN game code (numeric identifier). |
| `game_status` | integer | Game status label. |
| `game_status_text` | character | Game status display text (e.g. 'Final', '4:32 - 4th'). |
| `period` | integer | Period of the game (1-4 quarters; 5+ for OT). |
| `game_clock` | character | Game clock. |
| `game_time_utc` | character | Game start time in UTC (ISO 8601 timestamp). |
| `game_et` | character | Game et. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `duration` | character | Duration. |
| `attendance` | integer | Reported attendance. |
| `sellout` | integer | Sellout. |
| `series_game_number` | character | Series game number. |
| `game_label` | character |  |
| `game_sub_label` | character |  |
| `series_text` | character | Series text. |
| `if_necessary` | logical | If necessary. |
| `is_neutral` | logical |  |
| `video_available_flag` | integer | Video available flag. |
| `pt_available` | integer | Pt available. |
| `pt_xyz_available` | integer | Pt xyz available. |
| `wh_status` | integer | Wh status. |
| `hustle_status` | integer | Hustle status. |
| `historical_status` | integer | Historical status. |
| `game_subtype` | character | Game subtype. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `team_wins` | integer | Team's win total entering the game. |
| `team_losses` | integer | Team's loss total entering the game. |
| `score` | integer | Final score. |
| `in_bonus` | character | Whether the team is currently in the bonus (penalty) foul situation, as reported by the stats API. |
| `timeouts_remaining` | integer | Timeouts the team has remaining. |
| `seed` | integer | Team's playoff seed, populated for postseason games. |
| `dummy_key` | character | Placeholder key emitted by the stats API's box score summary payload; carries no data. |

**`Officials`**

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `name` | character | Display name. |
| `name_i` | character | Initialed name (e.g. 'A. Wilson'). |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family / last name. |
| `jersey_num` | character | Jersey number worn by the player. |
| `assignment` | character | Assignment. |

**Row type:** `WnbaStatsBoxscoresummaryv3Tables`, `WnbaStatsBoxscoresummaryv3PlayerStatsRow`, `WnbaStatsBoxscoresummaryv3TeamStatsRow`, `WnbaStatsBoxscoresummaryv3OfficialsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoretraditionalv2` / `wnbaStatsBoxscoretraditionalv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at (F, C, or G); empty for reserves. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `to` | integer | To. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |
| `plus_minus` | integer | Plus/minus point differential while on court. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `to` | integer | To. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |
| `plus_minus` | integer | Plus/minus point differential while on court. |

**`TeamStarterBenchStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `starters_bench` | character |  |
| `min` | character | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `to` | integer | To. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**Row type:** `WnbaStatsBoxscoretraditionalv2Tables`, `WnbaStatsBoxscoretraditionalv2PlayerStatsRow`, `WnbaStatsBoxscoretraditionalv2TeamStatsRow`, `WnbaStatsBoxscoretraditionalv2TeamStarterBenchStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoretraditionalv3` / `wnbaStatsBoxscoretraditionalv3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `field_goals_made` | integer | Field goals made recorded in the game. |
| `field_goals_attempted` | integer | Field goal attempts recorded in the game. |
| `field_goals_percentage` | numeric | Field goal percentage for the game, as a decimal. |
| `three_pointers_made` | integer | Three-pointers made recorded in the game. |
| `three_pointers_attempted` | integer | Three-point attempts recorded in the game. |
| `three_pointers_percentage` | numeric | Three-point percentage for the game, as a decimal. |
| `free_throws_made` | integer | Free throws made recorded in the game. |
| `free_throws_attempted` | integer | Free throw attempts recorded in the game. |
| `free_throws_percentage` | numeric | Free throw percentage for the game, as a decimal. |
| `rebounds_offensive` | integer | Offensive rebounds recorded in the game. |
| `rebounds_defensive` | integer | Defensive rebounds recorded in the game. |
| `rebounds_total` | integer | Total rebounds recorded in the game. |
| `assists` | integer | Total assists. |
| `steals` | integer | Total steals. |
| `blocks` | integer | Total blocks. |
| `turnovers` | integer | Total turnovers. |
| `fouls_personal` | integer | Personal fouls recorded in the game. |
| `points` | integer | Points scored. |
| `plus_minus_points` | numeric | Team point differential while the player was on the floor (plus-minus). |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `field_goals_made` | integer | Field goals made recorded in the game. |
| `field_goals_attempted` | integer | Field goal attempts recorded in the game. |
| `field_goals_percentage` | numeric | Field goal percentage for the game, as a decimal. |
| `three_pointers_made` | integer | Three-pointers made recorded in the game. |
| `three_pointers_attempted` | integer | Three-point attempts recorded in the game. |
| `three_pointers_percentage` | numeric | Three-point percentage for the game, as a decimal. |
| `free_throws_made` | integer | Free throws made recorded in the game. |
| `free_throws_attempted` | integer | Free throw attempts recorded in the game. |
| `free_throws_percentage` | numeric | Free throw percentage for the game, as a decimal. |
| `rebounds_offensive` | integer | Offensive rebounds recorded in the game. |
| `rebounds_defensive` | integer | Defensive rebounds recorded in the game. |
| `rebounds_total` | integer | Total rebounds recorded in the game. |
| `assists` | integer | Total assists. |
| `steals` | integer | Total steals. |
| `blocks` | integer | Total blocks. |
| `turnovers` | integer | Total turnovers. |
| `fouls_personal` | integer | Personal fouls recorded in the game. |
| `points` | integer | Points scored. |
| `plus_minus_points` | numeric | Team point differential while the player was on the floor (plus-minus). |

**Row type:** `WnbaStatsBoxscoretraditionalv3Tables`, `WnbaStatsBoxscoretraditionalv3PlayerStatsRow`, `WnbaStatsBoxscoretraditionalv3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_boxscoreusagev2` / `wnbaStatsBoxscoreusagev2`

With `{ parsed: true }`: an object of tables, one per key below.

**`sqlPlayersUsage`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `start_position` | character | Position the player started the game at ('F', 'C', or 'G'); empty for bench players. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `min` | character | Minutes played. |
| `usg_pct` | numeric | Percentage of team plays used while on the floor. |
| `pct_fgm` | numeric | Share of the team's field goals made accounted for while on the floor. |
| `pct_fga` | numeric | Share of the team's field goal attempts accounted for while on the floor. |
| `pct_fg3_m` | numeric | Share of the team's made three-pointers accounted for while on the floor. |
| `pct_fg3_a` | numeric | Share of the team's three-point attempts accounted for while on the floor. |
| `pct_ftm` | numeric | Share of the team's made free throws accounted for while on the floor. |
| `pct_fta` | numeric | Share of the team's free throw attempts accounted for while on the floor. |
| `pct_oreb` | numeric | Share of the team's offensive rebounds accounted for while on the floor. |
| `pct_dreb` | numeric | Share of the team's defensive rebounds accounted for while on the floor. |
| `pct_reb` | numeric | Share of the team's total rebounds accounted for while on the floor. |
| `pct_ast` | numeric | Share of the team's assists accounted for while on the floor. |
| `pct_tov` | numeric | Share of the team's turnovers accounted for while on the floor. |
| `pct_stl` | numeric | Share of the team's steals accounted for while on the floor. |
| `pct_blk` | numeric | Share of the team's blocks accounted for while on the floor. |
| `pct_blka` | numeric | Share of the team's blocked own attempts accounted for while on the floor. |
| `pct_pf` | numeric | Share of the team's personal fouls accounted for while on the floor. |
| `pct_pfd` | numeric | Share of the team's personal fouls drawn accounted for while on the floor. |
| `pct_pts` | numeric | Share of the team's points accounted for while on the floor. |

**`sqlTeamsUsage`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `min` | character | Minutes played. |
| `usg_pct` | numeric | Percentage of team plays used while on the floor. |
| `pct_fgm` | numeric | Share of the team's field goals made accounted for while on the floor. |
| `pct_fga` | numeric | Share of the team's field goal attempts accounted for while on the floor. |
| `pct_fg3_m` | numeric | Share of the team's made three-pointers accounted for while on the floor. |
| `pct_fg3_a` | numeric | Share of the team's three-point attempts accounted for while on the floor. |
| `pct_ftm` | numeric | Share of the team's made free throws accounted for while on the floor. |
| `pct_fta` | numeric | Share of the team's free throw attempts accounted for while on the floor. |
| `pct_oreb` | numeric | Share of the team's offensive rebounds accounted for while on the floor. |
| `pct_dreb` | numeric | Share of the team's defensive rebounds accounted for while on the floor. |
| `pct_reb` | numeric | Share of the team's total rebounds accounted for while on the floor. |
| `pct_ast` | numeric | Share of the team's assists accounted for while on the floor. |
| `pct_tov` | numeric | Share of the team's turnovers accounted for while on the floor. |
| `pct_stl` | numeric | Share of the team's steals accounted for while on the floor. |
| `pct_blk` | numeric | Share of the team's blocks accounted for while on the floor. |
| `pct_blka` | numeric | Share of the team's blocked own attempts accounted for while on the floor. |
| `pct_pf` | numeric | Share of the team's personal fouls accounted for while on the floor. |
| `pct_pfd` | numeric | Share of the team's personal fouls drawn accounted for while on the floor. |
| `pct_pts` | numeric | Share of the team's points accounted for while on the floor. |

**Row type:** `WnbaStatsBoxscoreusagev2Tables`, `WnbaStatsBoxscoreusagev2SqlPlayersUsageRow`, `WnbaStatsBoxscoreusagev2SqlTeamsUsageRow` (exported from the package root).

### Returns — `wnba_stats_boxscoreusagev3` / `wnbaStatsBoxscoreusagev3`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `person_id` | integer | Player identifier from the league's stats API. |
| `first_name` | character | Player's first name. |
| `family_name` | character | Player's family (last) name. |
| `name_i` | character | Abbreviated player name (first initial and last name). |
| `player_slug` | character | URL-friendly slug for the player's name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `jersey_num` | character | Player's jersey number. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `usage_percentage` | numeric | Percentage of team plays used by the player while on the floor, as a decimal. |
| `percentage_field_goals_made` | numeric | Share of the team's field goals made accounted for by the player while on the floor, as a decimal. |
| `percentage_field_goals_attempted` | numeric | Share of the team's field goal attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_three_pointers_made` | numeric | Share of the team's three-pointers made accounted for by the player while on the floor, as a decimal. |
| `percentage_three_pointers_attempted` | numeric | Share of the team's three-point attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_free_throws_made` | numeric | Share of the team's free throws made accounted for by the player while on the floor, as a decimal. |
| `percentage_free_throws_attempted` | numeric | Share of the team's free throw attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_offensive` | numeric | Share of the team's offensive rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_defensive` | numeric | Share of the team's defensive rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_total` | numeric | Share of the team's total rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_assists` | numeric | Share of the team's assists accounted for by the player while on the floor, as a decimal. |
| `percentage_turnovers` | numeric | Share of the team's turnovers accounted for by the player while on the floor, as a decimal. |
| `percentage_steals` | numeric | Share of the team's steals accounted for by the player while on the floor, as a decimal. |
| `percentage_blocks` | numeric | Share of the team's blocked shots accounted for by the player while on the floor, as a decimal. |
| `percentage_blocks_allowed` | numeric | Share of the team's shot attempts blocked by opponents accounted for by the player while on the floor, as a decimal. |
| `percentage_personal_fouls` | numeric | Share of the team's personal fouls accounted for by the player while on the floor, as a decimal. |
| `percentage_personal_fouls_drawn` | numeric | Share of the team's personal fouls drawn accounted for by the player while on the floor, as a decimal. |
| `percentage_points` | numeric | Share of the team's points accounted for by the player while on the floor, as a decimal. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique 10-character game identifier from the league's stats API. |
| `away_team_id` | integer | Unique identifier for the away team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_tricode` | character | Three-letter team abbreviation. |
| `team_slug` | character | URL-friendly slug for the team name. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `usage_percentage` | numeric | Percentage of team plays used by the player while on the floor, as a decimal. |
| `percentage_field_goals_made` | numeric | Share of the team's field goals made accounted for by the player while on the floor, as a decimal. |
| `percentage_field_goals_attempted` | numeric | Share of the team's field goal attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_three_pointers_made` | numeric | Share of the team's three-pointers made accounted for by the player while on the floor, as a decimal. |
| `percentage_three_pointers_attempted` | numeric | Share of the team's three-point attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_free_throws_made` | numeric | Share of the team's free throws made accounted for by the player while on the floor, as a decimal. |
| `percentage_free_throws_attempted` | numeric | Share of the team's free throw attempts accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_offensive` | numeric | Share of the team's offensive rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_defensive` | numeric | Share of the team's defensive rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_rebounds_total` | numeric | Share of the team's total rebounds accounted for by the player while on the floor, as a decimal. |
| `percentage_assists` | numeric | Share of the team's assists accounted for by the player while on the floor, as a decimal. |
| `percentage_turnovers` | numeric | Share of the team's turnovers accounted for by the player while on the floor, as a decimal. |
| `percentage_steals` | numeric | Share of the team's steals accounted for by the player while on the floor, as a decimal. |
| `percentage_blocks` | numeric | Share of the team's blocked shots accounted for by the player while on the floor, as a decimal. |
| `percentage_blocks_allowed` | numeric | Share of the team's shot attempts blocked by opponents accounted for by the player while on the floor, as a decimal. |
| `percentage_personal_fouls` | numeric | Share of the team's personal fouls accounted for by the player while on the floor, as a decimal. |
| `percentage_personal_fouls_drawn` | numeric | Share of the team's personal fouls drawn accounted for by the player while on the floor, as a decimal. |
| `percentage_points` | numeric | Share of the team's points accounted for by the player while on the floor, as a decimal. |

**Row type:** `WnbaStatsBoxscoreusagev3Tables`, `WnbaStatsBoxscoreusagev3PlayerStatsRow`, `WnbaStatsBoxscoreusagev3TeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_commonallplayers` / `wnbaStatsCommonallplayers`

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `display_last_comma_first` | character | Player name formatted as "Last, First". |
| `display_first_last` | character | Player name formatted as "First Last". |
| `rosterstatus` | integer | Roster status flag (1 = currently on a roster, 0 = not). |
| `from_year` | character | First season. |
| `to_year` | character | Most recent season. |
| `playercode` | character | URL-style player code slug used by the league's legacy stats pages. |
| `player_slug` | character | URL-safe player identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_code` | character |  |
| `team_slug` | character | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `is_nba_assigned` | integer | Flag indicating whether the player is currently on an NBA roster assignment (two-way and G League assignment tracking). |
| `nba_assigned_team_id` | integer | Team identifier of the NBA team the player is assigned to, when on assignment. |
| `games_played_flag` | character | Y/N flag for whether the player has appeared in a league game. |

**Row type:** `WnbaStatsCommonallplayersRow` (exported from the package root).

### Returns — `wnba_stats_commonplayerinfo` / `wnbaStatsCommonplayerinfo`

With `{ parsed: true }`: an object of tables, one per key below.

**`CommonPlayerInfo`**

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `display_first_last` | character | NBA or WNBA Stats value for display first last in the commonplayerinfo result set. |
| `display_last_comma_first` | character | NBA or WNBA Stats value for display last comma first in the commonplayerinfo result set. |
| `display_fi_last` | character | NBA or WNBA Stats value for display fi last in the commonplayerinfo result set. |
| `player_slug` | character | URL-safe player identifier. |
| `birthdate` | character |  |
| `school` | character | Player's school / college (when distinct from 'college'). |
| `country` | character | Country (full name or code). |
| `last_affiliation` | character | NBA or WNBA Stats value for last affiliation in the commonplayerinfo result set. |
| `height` | character | Player height (string e.g. '6-2' or inches). |
| `weight` | character | Player weight in pounds. |
| `season_exp` | integer | NBA or WNBA Stats value for season exp in the commonplayerinfo result set. |
| `jersey` | character | Jersey number worn by the player. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `rosterstatus` | character | NBA or WNBA Stats value for rosterstatus in the commonplayerinfo result set. |
| `games_played_current_season_flag` | character | Flag indicating games played current season flag for the requested NBA or WNBA Stats context. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_code` | character |  |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `playercode` | character | NBA or WNBA Stats value for playercode in the commonplayerinfo result set. |
| `from_year` | integer | First season. |
| `to_year` | integer | Most recent season. |
| `dleague_flag` | character | Flag indicating dleague flag for the requested NBA or WNBA Stats context. |
| `nba_flag` | character | Flag indicating NBA flag for the requested NBA or WNBA Stats context. |
| `games_played_flag` | character | Flag indicating games played flag for the requested NBA or WNBA Stats context. |
| `draft_year` | character | Draft year (4-digit). |
| `draft_round` | character | Round of the draft selection. |
| `draft_number` | character |  |
| `greatest_75_flag` | character | Flag indicating greatest 75 flag for the requested NBA or WNBA Stats context. |

**`PlayerHeadlineStats`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `time_frame` | character |  |
| `pts` | numeric | Points scored. |
| `ast` | numeric | Assists. |
| `reb` | numeric | Total rebounds. |
| `pie` | integer | Player Impact Estimate (0-1). |

**`AvailableSeasons`**

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |

**Row type:** `WnbaStatsCommonplayerinfoTables`, `WnbaStatsCommonplayerinfoCommonPlayerInfoRow`, `WnbaStatsCommonplayerinfoPlayerHeadlineStatsRow`, `WnbaStatsCommonplayerinfoAvailableSeasonsRow` (exported from the package root).

### Returns — `wnba_stats_commonplayoffseries` / `wnbaStatsCommonplayoffseries`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `series_id` | character |  |
| `game_num` | integer | NBA or WNBA Stats value for game number in the commonplayoffseries result set. |

**Row type:** `WnbaStatsCommonplayoffseriesRow` (exported from the package root).

### Returns — `wnba_stats_commonteamroster` / `wnbaStatsCommonteamroster`

With `{ parsed: true }`: an object of tables, one per key below.

**`CommonTeamRoster`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `league_id` | character | League identifier from the stats API ("00" = NBA, "10" = WNBA, "20" = G League). |
| `player` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `player_slug` | character | URL-safe player identifier. |
| `num` | character |  |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `height` | character | Player height (string e.g. '6-2' or inches). |
| `weight` | character | Player weight in pounds. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `age` | numeric | Player age (in years). |
| `exp` | character | Exp. |
| `school` | character | Player's school / college (when distinct from 'college'). |
| `player_id` | integer | Unique player identifier. |
| `how_acquired` | character | How the team acquired the player (e.g. draft, trade, free agency). |

**`Coaches`**

| col_name | type | description |
|---|---|---|
| `coach_id` | integer | Unique identifier for coach. |
| `team_id` | integer | Unique team identifier. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `coach_name` | character |  |
| `is_assistant` | integer |  |
| `coach_type` | character |  |
| `sort_sequence` | integer |  |

**Row type:** `WnbaStatsCommonteamrosterTables`, `WnbaStatsCommonteamrosterCommonTeamRosterRow`, `WnbaStatsCommonteamrosterCoachesRow` (exported from the package root).

### Returns — `wnba_stats_commonteamyears` / `wnbaStatsCommonteamyears`

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `min_year` | character | Minimum year queried (echoes `min_year`). |
| `max_year` | character | Maximum year queried (echoes `max_year`). |
| `abbreviation` | character | Short abbreviation. |

**Row type:** `WnbaStatsCommonteamyearsRow` (exported from the package root).

### Returns — `wnba_stats_cumestatsplayer` / `wnbaStatsCumestatsplayer`

With `{ parsed: true }`: an object of tables, one per key below.

**`GameByGameStats`**

| col_name | type | description |
|---|---|---|
| `date_est` | character |  |
| `visitor_team` | character |  |
| `home_team` | character | Home team name. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `actual_minutes` | integer | Whole minutes of actual playing time accumulated over the aggregated games. |
| `actual_seconds` | integer | Leftover seconds of actual playing time beyond the whole minutes. |
| `fg` | integer | Field goals made over the aggregated games. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3` | integer | Three-point field goals made over the aggregated games. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft` | integer | Free throws made over the aggregated games. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `off_reb` | integer | Offensive rebounds over the aggregated games. |
| `def_reb` | integer | Defensive rebounds over the aggregated games. |
| `tot_reb` | integer | Total rebounds over the aggregated games. |
| `avg_tot_reb` | numeric | Average total rebounds per game over the aggregated games. |
| `ast` | integer | Assists. |
| `pf` | integer | Personal fouls. |
| `dq` | integer | Disqualifications (fouled out) over the aggregated games. |
| `stl` | integer | Steals. |
| `turnovers` | integer | Total turnovers. |
| `blk` | integer | Blocks. |
| `pts` | integer | Points scored. |
| `avg_pts` | numeric | Average points per game over the aggregated games. |

**`TotalPlayerStats`**

| col_name | type | description |
|---|---|---|
| `display_fi_last` | character | Abbreviated player name (first initial and last name). |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `jersey_num` | character | Jersey number worn by the player. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `actual_minutes` | integer | Whole minutes of actual playing time accumulated over the aggregated games. |
| `actual_seconds` | integer | Leftover seconds of actual playing time beyond the whole minutes. |
| `fg` | integer | Field goals made over the aggregated games. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3` | integer | Three-point field goals made over the aggregated games. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft` | integer | Free throws made over the aggregated games. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `off_reb` | integer | Offensive rebounds over the aggregated games. |
| `def_reb` | integer | Defensive rebounds over the aggregated games. |
| `tot_reb` | integer | Total rebounds over the aggregated games. |
| `ast` | integer | Assists. |
| `pf` | integer | Personal fouls. |
| `dq` | integer | Disqualifications (fouled out) over the aggregated games. |
| `stl` | integer | Steals. |
| `turnovers` | integer | Total turnovers. |
| `blk` | integer | Blocks. |
| `pts` | integer | Points scored. |
| `max_actual_minutes` | integer | Most whole minutes played in any single aggregated game. |
| `max_actual_seconds` | integer | Seconds component paired with the single-game maximum minutes. |
| `max_reb` | integer | Most rebounds recorded in any single aggregated game. |
| `max_ast` | integer | Most assists recorded in any single aggregated game. |
| `max_stl` | integer | Most steals recorded in any single aggregated game. |
| `max_turnovers` | integer | Most turnovers recorded in any single aggregated game. |
| `max_blk` | integer | Most blocked shots recorded in any single aggregated game. |
| `max_pts` | integer | Most points recorded in any single aggregated game. |
| `avg_actual_minutes` | integer | Average whole minutes played per aggregated game. |
| `avg_actual_seconds` | numeric | Average seconds component of playing time per aggregated game. |
| `avg_tot_reb` | numeric | Average total rebounds per game over the aggregated games. |
| `avg_ast` | numeric | Average assists per game over the aggregated games. |
| `avg_stl` | numeric | Average steals per game over the aggregated games. |
| `avg_turnovers` | numeric | Average turnovers per game over the aggregated games. |
| `avg_blk` | numeric | Average blocked shots per game over the aggregated games. |
| `avg_pts` | numeric | Average points per game over the aggregated games. |
| `per_min_tot_reb` | numeric | Total rebounds per minute played over the aggregated games. |
| `per_min_ast` | numeric | Assists per minute played over the aggregated games. |
| `per_min_stl` | numeric | Steals per minute played over the aggregated games. |
| `per_min_turnovers` | numeric | Turnovers per minute played over the aggregated games. |
| `per_min_blk` | numeric | Blocked shots per minute played over the aggregated games. |
| `per_min_pts` | numeric | Points per minute played over the aggregated games. |

**Row type:** `WnbaStatsCumestatsplayerTables`, `WnbaStatsCumestatsplayerGameByGameStatsRow`, `WnbaStatsCumestatsplayerTotalPlayerStatsRow` (exported from the package root).

### Returns — `wnba_stats_cumestatsplayergames` / `wnbaStatsCumestatsplayergames`

| col_name | type | description |
|---|---|---|
| `matchup` | character | Matchup. |
| `game_id` | character | Unique game identifier. |

**Row type:** `WnbaStatsCumestatsplayergamesRow` (exported from the package root).

### Returns — `wnba_stats_cumestatsteam` / `wnbaStatsCumestatsteam`

With `{ parsed: true }`: an object of tables, one per key below.

**`GameByGameStats`**

| col_name | type | description |
|---|---|---|
| `jersey_num` | character | Jersey number worn by the player. |
| `player` | character | Player name. |
| `person_id` | character | Unique player identifier (V3 endpoints). |
| `team_id` | character | Unique team identifier. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `actual_minutes` | character | Whole minutes of actual playing time accumulated over the aggregated games. |
| `actual_seconds` | character | Leftover seconds of actual playing time beyond the whole minutes. |
| `fg` | character | Field goals made over the aggregated games. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3` | character | Three-point field goals made over the aggregated games. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ft` | character | Free throws made over the aggregated games. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `off_reb` | character | Offensive rebounds over the aggregated games. |
| `def_reb` | character | Defensive rebounds over the aggregated games. |
| `tot_reb` | character | Total rebounds over the aggregated games. |
| `ast` | character | Assists. |
| `pf` | character | Personal fouls. |
| `dq` | character | Disqualifications (fouled out) over the aggregated games. |
| `stl` | character | Steals. |
| `turnovers` | character | Total turnovers. |
| `blk` | character | Blocks. |
| `pts` | character | Points scored. |
| `max_actual_minutes` | character | Most whole minutes played in any single aggregated game. |
| `max_actual_seconds` | character | Seconds component paired with the single-game maximum minutes. |
| `max_reb` | character | Most rebounds recorded in any single aggregated game. |
| `max_ast` | character | Most assists recorded in any single aggregated game. |
| `max_stl` | character | Most steals recorded in any single aggregated game. |
| `max_turnovers` | character | Most turnovers recorded in any single aggregated game. |
| `max_blkp` | character | Most blocked shots recorded in any single aggregated game. |
| `max_pts` | character | Most points recorded in any single aggregated game. |
| `avg_actual_minutes` | character | Average whole minutes played per aggregated game. |
| `avg_actual_seconds` | character | Average seconds component of playing time per aggregated game. |
| `avg_reb` | character | Average rebounds per game over the aggregated games. |
| `avg_ast` | character | Average assists per game over the aggregated games. |
| `avg_stl` | character | Average steals per game over the aggregated games. |
| `avg_turnovers` | character | Average turnovers per game over the aggregated games. |
| `avg_blkp` | character | Average blocked shots per game over the aggregated games. |
| `avg_pts` | character | Average points per game over the aggregated games. |
| `per_min_reb` | character | Rebounds per minute played over the aggregated games. |
| `per_min_ast` | character | Assists per minute played over the aggregated games. |
| `per_min_stl` | character | Steals per minute played over the aggregated games. |
| `per_min_turnovers` | character | Turnovers per minute played over the aggregated games. |
| `per_min_blk` | character | Blocked shots per minute played over the aggregated games. |
| `per_min_pts` | character | Points per minute played over the aggregated games. |

**`TotalTeamStats`**

| col_name | type | description |
|---|---|---|
| `city` | character | Venue city. |
| `nickname` | character | Team or athlete nickname. |
| `team_id` | integer | Unique team identifier. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_home` | integer |  |
| `l_home` | integer |  |
| `w_road` | integer |  |
| `l_road` | integer |  |
| `team_turnovers` | integer | Team turnovers (turnovers credited to the team rather than a player). |
| `team_rebounds` | integer | Team rebounds (rebounds credited to the team rather than a player). |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `actual_minutes` | integer | Whole minutes of actual playing time accumulated over the aggregated games. |
| `actual_seconds` | integer | Leftover seconds of actual playing time beyond the whole minutes. |
| `fg` | integer | Field goals made over the aggregated games. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3` | integer | Three-point field goals made over the aggregated games. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft` | integer | Free throws made over the aggregated games. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `off_reb` | integer | Offensive rebounds over the aggregated games. |
| `def_reb` | integer | Defensive rebounds over the aggregated games. |
| `tot_reb` | integer | Total rebounds over the aggregated games. |
| `ast` | integer | Assists. |
| `pf` | integer | Personal fouls. |
| `stl` | integer | Steals. |
| `total_turnovers` | integer | Total turnovers (player + team). |
| `blk` | integer | Blocks. |
| `pts` | integer | Points scored. |
| `avg_reb` | numeric | Average rebounds per game over the aggregated games. |
| `avg_pts` | numeric | Average points per game over the aggregated games. |
| `dq` | integer | Disqualifications (fouled out) over the aggregated games. |

**Row type:** `WnbaStatsCumestatsteamTables`, `WnbaStatsCumestatsteamGameByGameStatsRow`, `WnbaStatsCumestatsteamTotalTeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_cumestatsteamgames` / `wnbaStatsCumestatsteamgames`

| col_name | type | description |
|---|---|---|
| `matchup` | character | Matchup. |
| `game_id` | character | Unique game identifier. |

**Row type:** `WnbaStatsCumestatsteamgamesRow` (exported from the package root).

### Returns — `wnba_stats_draftcombinestats` / `wnbaStatsDraftcombinestats`

| col_name | type | description |
|---|---|---|
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `player_id` | integer | Unique player identifier. |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `player_name` | character | Player name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `height_wo_shoes` | numeric | Height measured without shoes, in inches. |
| `height_wo_shoes_ft_in` | character | Height without shoes formatted as feet and inches. |
| `height_w_shoes` | character | Height measured with shoes, in inches. |
| `height_w_shoes_ft_in` | character | Height with shoes formatted as feet and inches. |
| `weight` | character | Player weight in pounds. |
| `wingspan` | numeric | Wingspan measured at the combine, in inches. |
| `wingspan_ft_in` | character | Wingspan formatted as feet and inches. |
| `standing_reach` | numeric | Standing reach measured at the combine, in inches. |
| `standing_reach_ft_in` | character | Standing reach formatted as feet and inches. |
| `body_fat_pct` | character | Body fat percentage measured at the combine. |
| `hand_length` | numeric | Hand length measured at the combine, in inches. |
| `hand_width` | numeric | Hand width measured at the combine, in inches. |
| `standing_vertical_leap` | numeric | Standing (no-step) vertical leap, in inches. |
| `max_vertical_leap` | numeric | Maximum (running) vertical leap, in inches. |
| `lane_agility_time` | numeric | Lane agility drill time, in seconds. |
| `modified_lane_agility_time` | numeric | Modified (shuttle) lane agility drill time, in seconds. |
| `three_quarter_sprint` | numeric | Three-quarter-court sprint time, in seconds. |
| `bench_press` | character | Repetitions of 185 pounds completed on the bench press. |
| `spot_fifteen_corner_left` | character | Made-attempted result (e.g. "3-5") from the 15-foot left corner spot-up shooting station at the combine. |
| `spot_fifteen_break_left` | character | Made-attempted result (e.g. "3-5") from the 15-foot left wing (break) spot-up shooting station at the combine. |
| `spot_fifteen_top_key` | character | Made-attempted result (e.g. "3-5") from the 15-foot top of the key spot-up shooting station at the combine. |
| `spot_fifteen_break_right` | character | Made-attempted result (e.g. "3-5") from the 15-foot right wing (break) spot-up shooting station at the combine. |
| `spot_fifteen_corner_right` | character | Made-attempted result (e.g. "3-5") from the 15-foot right corner spot-up shooting station at the combine. |
| `spot_college_corner_left` | character | Made-attempted result (e.g. "3-5") from the college three-point left corner spot-up shooting station at the combine. |
| `spot_college_break_left` | character | Made-attempted result (e.g. "3-5") from the college three-point left wing (break) spot-up shooting station at the combine. |
| `spot_college_top_key` | character | Made-attempted result (e.g. "3-5") from the college three-point top of the key spot-up shooting station at the combine. |
| `spot_college_break_right` | character | Made-attempted result (e.g. "3-5") from the college three-point right wing (break) spot-up shooting station at the combine. |
| `spot_college_corner_right` | character | Made-attempted result (e.g. "3-5") from the college three-point right corner spot-up shooting station at the combine. |
| `spot_nba_corner_left` | character | Made-attempted result (e.g. "3-5") from the NBA three-point left corner spot-up shooting station at the combine. |
| `spot_nba_break_left` | character | Made-attempted result (e.g. "3-5") from the NBA three-point left wing (break) spot-up shooting station at the combine. |
| `spot_nba_top_key` | character | Made-attempted result (e.g. "3-5") from the NBA three-point top of the key spot-up shooting station at the combine. |
| `spot_nba_break_right` | character | Made-attempted result (e.g. "3-5") from the NBA three-point right wing (break) spot-up shooting station at the combine. |
| `spot_nba_corner_right` | character | Made-attempted result (e.g. "3-5") from the NBA three-point right corner spot-up shooting station at the combine. |
| `off_drib_fifteen_break_left` | character | Made-attempted result from the 15-foot left wing (break) off-the-dribble shooting station at the combine. |
| `off_drib_fifteen_top_key` | character | Made-attempted result from the 15-foot top of the key off-the-dribble shooting station at the combine. |
| `off_drib_fifteen_break_right` | character | Made-attempted result from the 15-foot right wing (break) off-the-dribble shooting station at the combine. |
| `off_drib_college_break_left` | character | Made-attempted result from the college three-point left wing (break) off-the-dribble shooting station at the combine. |
| `off_drib_college_top_key` | character | Made-attempted result from the college three-point top of the key off-the-dribble shooting station at the combine. |
| `off_drib_college_break_right` | character | Made-attempted result from the college three-point right wing (break) off-the-dribble shooting station at the combine. |
| `on_move_fifteen` | character | Made-attempted result from the 15-foot shooting-on-the-move station at the combine. |
| `on_move_college` | character | Made-attempted result from the college three-point shooting-on-the-move station at the combine. |

**Row type:** `WnbaStatsDraftcombinestatsRow` (exported from the package root).

### Returns — `wnba_stats_drafthistory` / `wnbaStatsDrafthistory`

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player_name` | character | Player name. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `round_number` | integer | Numeric round. |
| `round_pick` | integer | Round pick. |
| `overall_pick` | integer | Overall pick. |
| `draft_type` | character | NBA or WNBA Stats value for draft type in the drafthistory result set. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `organization` | character | Organization. |
| `organization_type` | character | Organization type. |
| `player_profile_flag` | integer | Player profile flag. |

**Row type:** `WnbaStatsDrafthistoryRow` (exported from the package root).

### Returns — `wnba_stats_fantasywidget` / `wnbaStatsFantasywidget`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `player_position` | character |  |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `pts` | numeric | Points scored. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `blk` | numeric | Blocks. |
| `stl` | numeric | Steals. |
| `tov` | numeric | Turnovers. |
| `fg3_m` | numeric | Three-point field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |

**Row type:** `WnbaStatsFantasywidgetRow` (exported from the package root).

### Returns — `wnba_stats_franchisehistory` / `wnbaStatsFranchisehistory`

With `{ parsed: true }`: an object of tables, one per key below.

**`FranchiseHistory`**

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `start_year` | character |  |
| `end_year` | character |  |
| `years` | integer | Years. |
| `games` | integer | Games played. |
| `wins` | integer | Total wins. |
| `losses` | integer | Total losses. |
| `win_pct` | numeric | Win percentage (0-1 decimal). |
| `po_appearances` | integer | NBA or WNBA Stats value for playoff appearances in the franchisehistory result set. |
| `div_titles` | integer | NBA or WNBA Stats value for div titles in the franchisehistory result set. |
| `conf_titles` | integer | NBA or WNBA Stats value for conf titles in the franchisehistory result set. |
| `league_titles` | integer | NBA or WNBA Stats value for league titles in the franchisehistory result set. |

**`DefunctTeams`**

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `start_year` | character |  |
| `end_year` | character |  |
| `years` | integer | Years. |
| `games` | integer | Games played. |
| `wins` | integer | Total wins. |
| `losses` | integer | Total losses. |
| `win_pct` | numeric | Win percentage (0-1 decimal). |
| `po_appearances` | integer | NBA or WNBA Stats value for playoff appearances in the franchisehistory result set. |
| `div_titles` | integer | NBA or WNBA Stats value for div titles in the franchisehistory result set. |
| `conf_titles` | integer | NBA or WNBA Stats value for conf titles in the franchisehistory result set. |
| `league_titles` | integer | NBA or WNBA Stats value for league titles in the franchisehistory result set. |

**Row type:** `WnbaStatsFranchisehistoryTables`, `WnbaStatsFranchisehistoryFranchiseHistoryRow`, `WnbaStatsFranchisehistoryDefunctTeamsRow` (exported from the package root).

### Returns — `wnba_stats_franchiseleaders` / `wnbaStatsFranchiseleaders`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `pts` | integer | Points scored. |
| `pts_person_id` | integer | Stats API identifier for points person identifier associated with this NBA or WNBA Stats row. |
| `pts_player` | character | Scoring or score-margin metric for points player in the requested NBA or WNBA Stats split. |
| `ast` | integer | Assists. |
| `ast_person_id` | integer | Stats API identifier for assists person identifier associated with this NBA or WNBA Stats row. |
| `ast_player` | character | NBA or WNBA Stats value for assists player in the franchiseleaders result set. |
| `reb` | integer | Total rebounds. |
| `reb_person_id` | integer | Stats API identifier for rebounds person identifier associated with this NBA or WNBA Stats row. |
| `reb_player` | character | Rebounding metric for rebounds player in the requested NBA or WNBA Stats split. |
| `blk` | integer | Blocks. |
| `blk_person_id` | integer | Stats API identifier for blocks person identifier associated with this NBA or WNBA Stats row. |
| `blk_player` | character | NBA or WNBA Stats value for blocks player in the franchiseleaders result set. |
| `stl` | integer | Steals. |
| `stl_person_id` | integer | Stats API identifier for steals person identifier associated with this NBA or WNBA Stats row. |
| `stl_player` | character | NBA or WNBA Stats value for steals player in the franchiseleaders result set. |

**Row type:** `WnbaStatsFranchiseleadersRow` (exported from the package root).

### Returns — `wnba_stats_franchiseleaderswrank` / `wnbaStatsFranchiseleaderswrank`

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team` | character | Team-side label or team identifier. |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player` | character | Player name. |
| `season_type` | character | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `active_with_team` | integer | Flag indicating whether the franchise leader is still active with the team. |
| `gp` | integer | Games played. |
| `minutes` | numeric | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `pf` | numeric | Personal fouls. |
| `stl` | numeric | Steals. |
| `tov` | numeric | Turnovers. |
| `blk` | numeric | Blocks. |
| `pts` | numeric | Points scored. |
| `f_rank_gp` | integer | Franchise all-time rank of the player's career games played. |
| `f_rank_minutes` | integer | Franchise all-time rank of the player's career minutes played. |
| `f_rank_fgm` | integer | Franchise all-time rank of the player's career field goals made. |
| `f_rank_fga` | integer | Franchise all-time rank of the player's career field goals attempted. |
| `f_rank_fg_pct` | integer | Franchise all-time rank of the player's career field goal percentage. |
| `f_rank_fg3_m` | integer | Franchise all-time rank of the player's career three-point field goals made. |
| `f_rank_fg3_a` | integer | Franchise all-time rank of the player's career three-point field goals attempted. |
| `f_rank_fg3_pct` | integer | Franchise all-time rank of the player's career three-point field goal percentage. |
| `f_rank_ftm` | integer | Franchise all-time rank of the player's career free throws made. |
| `f_rank_fta` | integer | Franchise all-time rank of the player's career free throws attempted. |
| `f_rank_ft_pct` | integer | Franchise all-time rank of the player's career free throw percentage. |
| `f_rank_oreb` | integer | Franchise all-time rank of the player's career offensive rebounds. |
| `f_rank_dreb` | integer | Franchise all-time rank of the player's career defensive rebounds. |
| `f_rank_reb` | integer | Franchise all-time rank of the player's career total rebounds. |
| `f_rank_ast` | integer | Franchise all-time rank of the player's career assists. |
| `f_rank_pf` | integer | Franchise all-time rank of the player's career personal fouls committed. |
| `f_rank_stl` | integer | Franchise all-time rank of the player's career steals. |
| `f_rank_tov` | integer | Franchise all-time rank of the player's career turnovers. |
| `f_rank_blk` | integer | Franchise all-time rank of the player's career blocked shots. |
| `f_rank_pts` | integer | Franchise all-time rank of the player's career points scored. |

**Row type:** `WnbaStatsFranchiseleaderswrankRow` (exported from the package root).

### Returns — `wnba_stats_franchiseplayers` / `wnbaStatsFranchiseplayers`

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team` | character | Team-side label or team identifier. |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player` | character | Player name. |
| `season_type` | character | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `active_with_team` | integer | Flag indicating whether the player is still active with the franchise. |
| `gp` | integer | Games played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `pf` | numeric | Personal fouls. |
| `stl` | numeric | Steals. |
| `tov` | numeric | Turnovers. |
| `blk` | numeric | Blocks. |
| `pts` | numeric | Points scored. |

**Row type:** `WnbaStatsFranchiseplayersRow` (exported from the package root).

### Returns — `wnba_stats_gamerotation` / `wnbaStatsGamerotation`

With `{ parsed: true }`: an object of tables, one per key below.

**`AwayTeam`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player_first` | character | NBA or WNBA Stats value for player first in the gamerotation result set. |
| `player_last` | character | NBA or WNBA Stats value for player last in the gamerotation result set. |
| `in_time_real` | numeric | Real-time clock value when the player entered the game rotation stint. |
| `out_time_real` | numeric | Real-time clock value when the player exited the game rotation stint. |
| `player_pts` | integer | Scoring or score-margin metric for player points in the requested NBA or WNBA Stats split. |
| `pt_diff` | numeric | NBA or WNBA Stats value for pt diff in the gamerotation result set. |
| `usg_pct` | numeric | Percentage or rate for usage percentage in the requested NBA or WNBA Stats split. |

**`HomeTeam`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player_first` | character | NBA or WNBA Stats value for player first in the gamerotation result set. |
| `player_last` | character | NBA or WNBA Stats value for player last in the gamerotation result set. |
| `in_time_real` | numeric | Real-time clock value when the player entered the game rotation stint. |
| `out_time_real` | numeric | Real-time clock value when the player exited the game rotation stint. |
| `player_pts` | integer | Scoring or score-margin metric for player points in the requested NBA or WNBA Stats split. |
| `pt_diff` | numeric | NBA or WNBA Stats value for pt diff in the gamerotation result set. |
| `usg_pct` | numeric | Percentage or rate for usage percentage in the requested NBA or WNBA Stats split. |

**Row type:** `WnbaStatsGamerotationTables`, `WnbaStatsGamerotationAwayTeamRow`, `WnbaStatsGamerotationHomeTeamRow` (exported from the package root).

### Returns — `wnba_stats_homepageleaders` / `wnbaStatsHomepageleaders`

With `{ parsed: true }`: an object of tables, one per key below.

**`HomePageLeaders`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `pts` | numeric | Points scored. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `efg_pct` | numeric | Effective field goal percentage, as a decimal. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `pts_per48` | numeric | Points scored per 48 minutes played. |

**`LeagueAverage`**

| col_name | type | description |
|---|---|---|
| `pts` | numeric | Points scored. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `efg_pct` | numeric | Effective field goal percentage, as a decimal. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `pts_per48` | numeric | Points scored per 48 minutes played. |

**`LeagueMax`**

| col_name | type | description |
|---|---|---|
| `pts` | numeric | Points scored. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `efg_pct` | numeric | Effective field goal percentage, as a decimal. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `pts_per48` | numeric | Points scored per 48 minutes played. |

**Row type:** `WnbaStatsHomepageleadersTables`, `WnbaStatsHomepageleadersHomePageLeadersRow`, `WnbaStatsHomepageleadersLeagueAverageRow`, `WnbaStatsHomepageleadersLeagueMaxRow` (exported from the package root).

### Returns — `wnba_stats_homepagev2` / `wnbaStatsHomepagev2`

With `{ parsed: true }`: an object of tables, one per key below.

**`HomePageStat1`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `pts` | numeric | Points scored. |

**`HomePageStat2`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `reb` | numeric | Total rebounds. |

**`HomePageStat3`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `ast` | numeric | Assists. |

**`HomePageStat4`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `stl` | numeric | Steals. |

**`HomePageStat5`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`HomePageStat6`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `ft_pct` | numeric | Free throw percentage (0-1). |

**`HomePageStat7`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |

**`HomePageStat8`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `blk` | numeric | Blocks. |

**Row type:** `WnbaStatsHomepagev2Tables`, `WnbaStatsHomepagev2HomePageStat1Row`, `WnbaStatsHomepagev2HomePageStat2Row`, `WnbaStatsHomepagev2HomePageStat3Row`, `WnbaStatsHomepagev2HomePageStat4Row`, `WnbaStatsHomepagev2HomePageStat5Row`, `WnbaStatsHomepagev2HomePageStat6Row`, `WnbaStatsHomepagev2HomePageStat7Row`, `WnbaStatsHomepagev2HomePageStat8Row` (exported from the package root).

### Returns — `wnba_stats_hustlestatsboxscore` / `wnbaStatsHustlestatsboxscore`

With `{ parsed: true }`: an object of tables, one per key below.

**`HustleStatsAvailable`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `hustle_status` | integer | Hustle status. |

**`PlayerStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `start_position` | character | Position the player started the game at (F, C, or G); empty for reserves. |
| `comment` | character | Player status / inactive reason (e.g. 'DNP - Coach's Decision', 'Inactive'). |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `pts` | integer | Points scored. |
| `contested_shots` | numeric | Defensively contested shots. |
| `contested_shots_2_pt` | numeric | Opponent two-point attempts contested. |
| `contested_shots_3_pt` | numeric | Opponent three-point attempts contested. |
| `deflections` | numeric | Defensive deflections. |
| `charges_drawn` | numeric | Charges drawn. |
| `screen_assists` | numeric | Screen assists (resulting in a basket). |
| `screen_ast_pts` | numeric | Points teammates scored directly off the row's screen assists. |
| `off_loose_balls_recovered` | numeric | Loose balls recovered while on offense. |
| `def_loose_balls_recovered` | numeric | Loose balls recovered while on defense. |
| `loose_balls_recovered` | numeric | Total loose balls recovered. |
| `off_boxouts` | numeric | Box-outs recorded on the offensive glass. |
| `def_boxouts` | numeric | Box-outs recorded on the defensive glass. |
| `box_out_player_team_rebs` | numeric | Team rebounds secured following the row's box-outs. |
| `box_out_player_rebs` | numeric | Rebounds the player secured directly off their own box-outs. |
| `box_outs` | numeric | Box-outs executed. |

**`TeamStats`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `pts` | integer | Points scored. |
| `contested_shots` | numeric | Defensively contested shots. |
| `contested_shots_2_pt` | numeric | Opponent two-point attempts contested. |
| `contested_shots_3_pt` | numeric | Opponent three-point attempts contested. |
| `deflections` | numeric | Defensive deflections. |
| `charges_drawn` | numeric | Charges drawn. |
| `screen_assists` | numeric | Screen assists (resulting in a basket). |
| `screen_ast_pts` | numeric | Points teammates scored directly off the row's screen assists. |
| `off_loose_balls_recovered` | numeric | Loose balls recovered while on offense. |
| `def_loose_balls_recovered` | numeric | Loose balls recovered while on defense. |
| `loose_balls_recovered` | numeric | Total loose balls recovered. |
| `off_boxouts` | numeric | Box-outs recorded on the offensive glass. |
| `def_boxouts` | numeric | Box-outs recorded on the defensive glass. |
| `box_out_player_team_rebs` | numeric | Team rebounds secured following the row's box-outs. |
| `box_out_player_rebs` | numeric | Rebounds the player secured directly off their own box-outs. |
| `box_outs` | numeric | Box-outs executed. |

**Row type:** `WnbaStatsHustlestatsboxscoreTables`, `WnbaStatsHustlestatsboxscoreHustleStatsAvailableRow`, `WnbaStatsHustlestatsboxscorePlayerStatsRow`, `WnbaStatsHustlestatsboxscoreTeamStatsRow` (exported from the package root).

### Returns — `wnba_stats_infographicfanduelplayer` / `wnbaStatsInfographicfanduelplayer`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `jersey_num` | character | Jersey number worn by the player. |
| `player_position` | character |  |
| `location` | character | Filter results by game location. |
| `fan_duel_pts` | numeric | Scoring or score-margin metric for fan duel points in the requested NBA or WNBA Stats split. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `usg_pct` | numeric | Percentage or rate for usage percentage in the requested NBA or WNBA Stats split. |
| `min` | numeric | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `tov` | integer | Turnovers. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | integer | Personal fouls. |
| `pfd` | integer | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | integer | Points scored. |
| `plus_minus` | integer | Plus/minus point differential while on court. |

**Row type:** `WnbaStatsInfographicfanduelplayerRow` (exported from the package root).

### Returns — `wnba_stats_leaderstiles` / `wnbaStatsLeaderstiles`

With `{ parsed: true }`: an object of tables, one per key below.

**`LeadersTiles`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `player_id` | integer | Unique player identifier. |
| `player` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `pts` | numeric | Points scored. |

**`AllTimeSeasonHigh`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `pts` | numeric | Points scored. |
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |

**`LastSeasonHigh`**

| col_name | type | description |
|---|---|---|
| `rank` | integer | Rank. |
| `player_id` | integer | Unique player identifier. |
| `player` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `pts` | numeric | Points scored. |

**`LowSeasonHigh`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `pts` | numeric | Points scored. |
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |

**Row type:** `WnbaStatsLeaderstilesTables`, `WnbaStatsLeaderstilesLeadersTilesRow`, `WnbaStatsLeaderstilesAllTimeSeasonHighRow`, `WnbaStatsLeaderstilesLastSeasonHighRow`, `WnbaStatsLeaderstilesLowSeasonHighRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashlineups` / `wnbaStatsLeaguedashlineups`

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_id` | character | ESPN group id. |
| `group_name` | character |  |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `sum_time_played` | integer | Time value for sum time played in the NBA or WNBA Stats result set. |

**Row type:** `WnbaStatsLeaguedashlineupsRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashplayerbiostats` / `wnbaStatsLeaguedashplayerbiostats`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `age` | numeric | Player age (in years). |
| `player_height` | character |  |
| `player_height_inches` | integer | NBA or WNBA Stats value for player height inches in the leaguedashplayerbiostats result set. |
| `player_weight` | character |  |
| `college` | character | College or school attended. |
| `country` | character | Country (full name or code). |
| `draft_year` | character | Draft year (4-digit). |
| `draft_round` | character | Round of the draft selection. |
| `draft_number` | character |  |
| `gp` | integer | Games played. |
| `pts` | numeric | Points scored. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `net_rating` | numeric | Net rating (off rating - def rating). |
| `oreb_pct` | numeric | Percentage or rate for offensive rebounds percentage in the requested NBA or WNBA Stats split. |
| `dreb_pct` | numeric | Percentage or rate for defensive rebounds percentage in the requested NBA or WNBA Stats split. |
| `usg_pct` | numeric | Percentage or rate for usage percentage in the requested NBA or WNBA Stats split. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `ast_pct` | numeric | Assist percentage. |

**Row type:** `WnbaStatsLeaguedashplayerbiostatsRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashplayerclutch` / `wnbaStatsLeaguedashplayerclutch`

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `age` | numeric | Player age (in years). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**Row type:** `WnbaStatsLeaguedashplayerclutchRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashplayershotlocations` / `wnbaStatsLeaguedashplayershotlocations`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `age` | numeric | Player age (in years). |
| `nickname` | character | Team or athlete nickname. |
| `less_than_5_ft_fgm` | numeric | Field goals made from less than 5 feet. |
| `less_than_5_ft_fga` | numeric | Field goals attempted from less than 5 feet. |
| `less_than_5_ft_fg_pct` | numeric | Field goal percentage on shots from less than 5 feet, as a decimal. |
| `5_9_ft_fgm` | numeric | Field goals made from 5-9 feet. |
| `5_9_ft_fga` | numeric | Field goals attempted from 5-9 feet. |
| `5_9_ft_fg_pct` | numeric | Field goal percentage on shots from 5-9-f feet, as a decimal. |
| `10_14_ft_fgm` | numeric | Field goals made from 10-14 feet. |
| `10_14_ft_fga` | numeric | Field goals attempted from 10-14 feet. |
| `10_14_ft_fg_pct` | numeric | Field goal percentage on shots from 10-14-f feet, as a decimal. |
| `15_19_ft_fgm` | numeric | Field goals made from 15-19 feet. |
| `15_19_ft_fga` | numeric | Field goals attempted from 15-19 feet. |
| `15_19_ft_fg_pct` | numeric | Field goal percentage on shots from 15-19-f feet, as a decimal. |
| `20_24_ft_fgm` | numeric | Field goals made from 20-24 feet. |
| `20_24_ft_fga` | numeric | Field goals attempted from 20-24 feet. |
| `20_24_ft_fg_pct` | numeric | Field goal percentage on shots from 20-24-f feet, as a decimal. |
| `25_29_ft_fgm` | numeric | Field goals made from 25-29 feet. |
| `25_29_ft_fga` | numeric | Field goals attempted from 25-29 feet. |
| `25_29_ft_fg_pct` | numeric | Field goal percentage on shots from 25-29-f feet, as a decimal. |
| `30_34_ft_fgm` | numeric | Field goals made from 30-34 feet. |
| `30_34_ft_fga` | numeric | Field goals attempted from 30-34 feet. |
| `30_34_ft_fg_pct` | numeric | Field goal percentage on shots from 30-34-f feet, as a decimal. |
| `35_39_ft_fgm` | numeric | Field goals made from 35-39 feet. |
| `35_39_ft_fga` | numeric | Field goals attempted from 35-39 feet. |
| `35_39_ft_fg_pct` | numeric | Field goal percentage on shots from 35-39-f feet, as a decimal. |
| `40+_ft_fgm` | numeric | Field goals made from 40 feet and beyond, per the stats API's shot-location distance bands. |
| `40+_ft_fga` | numeric | Field goals attempted from 40 feet and beyond, per the stats API's shot-location distance bands. |
| `40+_ft_fg_pct` | numeric | Field-goal percentage on attempts from 40 feet and beyond, as a decimal. |

**Row type:** `WnbaStatsLeaguedashplayershotlocationsRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashplayerstats` / `wnbaStatsLeaguedashplayerstats`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `age` | numeric | Player age (in years). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked shot attempts against the player — shots the player attempted that were blocked by opponents. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn — fouls committed by opponents against this player. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | NBA fantasy points accrued under the standard NBA fantasy scoring formula. |
| `dd2` | integer | Number of double-doubles recorded over the span. |
| `td3` | integer | Number of triple-doubles recorded over the span. |
| `wnba_fantasy_pts` | numeric | WNBA fantasy points accrued under the standard WNBA fantasy scoring formula. |
| `gp_rank` | integer | Player's league rank for games played among qualified players (1 = most games). |
| `w_rank` | integer | Player's league rank for wins (1 = most wins while active). |
| `l_rank` | integer | Player's league rank for losses (1 = most losses while active). |
| `w_pct_rank` | integer | Player's league rank for win percentage (1 = highest win pct). |
| `min_rank` | integer | Player's league rank for minutes played (1 = most minutes). |
| `fgm_rank` | integer | Player's league rank for field goals made (1 = most made). |
| `fga_rank` | integer | Player's league rank for field goal attempts (1 = most attempts). |
| `fg_pct_rank` | integer | Player's league rank for field goal percentage (1 = highest pct). |
| `fg3_m_rank` | integer | Player's league rank for three-point field goals made (1 = most made). |
| `fg3_a_rank` | integer | Player's league rank for three-point field goal attempts (1 = most attempts). |
| `fg3_pct_rank` | integer | Player's league rank for three-point percentage (1 = highest pct). |
| `ftm_rank` | integer | Player's league rank for free throws made (1 = most made). |
| `fta_rank` | integer | Player's league rank for free throw attempts (1 = most attempts). |
| `ft_pct_rank` | integer | Player's league rank for free throw percentage (1 = highest pct). |
| `oreb_rank` | integer | Player's league rank for offensive rebounds (1 = most offensive rebounds). |
| `dreb_rank` | integer | Player's league rank for defensive rebounds (1 = most defensive rebounds). |
| `reb_rank` | integer | Player's league rank for total rebounds (1 = most rebounds). |
| `ast_rank` | integer | Player's league rank for assists (1 = most assists). |
| `tov_rank` | integer | Player's league rank for turnovers — note: lower turnovers is typically better. |
| `stl_rank` | integer | Player's league rank for steals (1 = most steals). |
| `blk_rank` | integer | Player's league rank for blocked shots (1 = most blocks). |
| `blka_rank` | integer | Player's league rank for shots blocked by opponents (1 = most blocked). |
| `pf_rank` | integer | Player's league rank for personal fouls committed (1 = most fouls). |
| `pfd_rank` | integer | Player's league rank for personal fouls drawn from opponents (1 = most drawn). |
| `pts_rank` | integer | Player's league rank for points scored (1 = league leader). |
| `plus_minus_rank` | integer | Player's league rank for plus/minus rating (1 = best differential). |
| `nba_fantasy_pts_rank` | integer | Player's league rank for NBA fantasy points scored (1 = most fantasy points). |
| `dd2_rank` | integer | Player's league rank for double-doubles recorded (1 = most double-doubles). |
| `td3_rank` | integer | Player's league rank for triple-doubles recorded (1 = most triple-doubles). |
| `wnba_fantasy_pts_rank` | integer | Player's league rank for WNBA fantasy points scored (1 = most fantasy points). |
| `team_count` | integer | Number of teams the player appeared for within the span. |

**Row type:** `WnbaStatsLeaguedashplayerstatsRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashptdefend` / `wnbaStatsLeaguedashptdefend`

| col_name | type | description |
|---|---|---|
| `close_def_person_id` | integer | Stats API identifier for close defensive person identifier associated with this NBA or WNBA Stats row. |
| `player_name` | character | Player name. |
| `player_last_team_id` | integer | Stats API identifier for player last team identifier associated with this NBA or WNBA Stats row. |
| `player_last_team_abbreviation` | character | NBA or WNBA Stats value for player last team abbreviation in the leaguedashptdefend result set. |
| `player_position` | character |  |
| `age` | numeric | Player age (in years). |
| `gp` | integer | Games played. |
| `g` | integer | Games played. |
| `freq` | numeric | NBA or WNBA Stats value for freq in the leaguedashptdefend result set. |
| `d_fgm` | numeric | Shooting metric for d fgm in the requested NBA or WNBA Stats split. |
| `d_fga` | numeric | Shooting metric for d fga in the requested NBA or WNBA Stats split. |
| `d_fg_pct` | numeric | Percentage or rate for d field goals percentage in the requested NBA or WNBA Stats split. |
| `normal_fg_pct` | numeric | Percentage or rate for normal field goals percentage in the requested NBA or WNBA Stats split. |
| `pct_plusminus` | numeric | Percentage share of plusminus for the requested NBA or WNBA Stats split. |

**Row type:** `WnbaStatsLeaguedashptdefendRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashteamclutch` / `wnbaStatsLeaguedashteamclutch`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsLeaguedashteamclutchRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashteamshotlocations` / `wnbaStatsLeaguedashteamshotlocations`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `less_than_5_ft_fgm` | numeric | Field goals made from less than 5 feet. |
| `less_than_5_ft_fga` | numeric | Field goals attempted from less than 5 feet. |
| `less_than_5_ft_fg_pct` | numeric | Field goal percentage on shots from less than 5 feet, as a decimal. |
| `5_9_ft_fgm` | numeric | Field goals made from 5-9 feet. |
| `5_9_ft_fga` | numeric | Field goals attempted from 5-9 feet. |
| `5_9_ft_fg_pct` | numeric | Field goal percentage on shots from 5-9-f feet, as a decimal. |
| `10_14_ft_fgm` | numeric | Field goals made from 10-14 feet. |
| `10_14_ft_fga` | numeric | Field goals attempted from 10-14 feet. |
| `10_14_ft_fg_pct` | numeric | Field goal percentage on shots from 10-14-f feet, as a decimal. |
| `15_19_ft_fgm` | numeric | Field goals made from 15-19 feet. |
| `15_19_ft_fga` | numeric | Field goals attempted from 15-19 feet. |
| `15_19_ft_fg_pct` | numeric | Field goal percentage on shots from 15-19-f feet, as a decimal. |
| `20_24_ft_fgm` | numeric | Field goals made from 20-24 feet. |
| `20_24_ft_fga` | numeric | Field goals attempted from 20-24 feet. |
| `20_24_ft_fg_pct` | numeric | Field goal percentage on shots from 20-24-f feet, as a decimal. |
| `25_29_ft_fgm` | numeric | Field goals made from 25-29 feet. |
| `25_29_ft_fga` | numeric | Field goals attempted from 25-29 feet. |
| `25_29_ft_fg_pct` | numeric | Field goal percentage on shots from 25-29-f feet, as a decimal. |
| `30_34_ft_fgm` | numeric | Field goals made from 30-34 feet. |
| `30_34_ft_fga` | numeric | Field goals attempted from 30-34 feet. |
| `30_34_ft_fg_pct` | numeric | Field goal percentage on shots from 30-34-f feet, as a decimal. |
| `35_39_ft_fgm` | numeric | Field goals made from 35-39 feet. |
| `35_39_ft_fga` | numeric | Field goals attempted from 35-39 feet. |
| `35_39_ft_fg_pct` | numeric | Field goal percentage on shots from 35-39-f feet, as a decimal. |
| `40+_ft_fgm` | numeric | Team field goals made from 40 feet and beyond, per the stats API's shot-location distance bands. |
| `40+_ft_fga` | numeric | Team field goals attempted from 40 feet and beyond, per the stats API's shot-location distance bands. |
| `40+_ft_fg_pct` | numeric | Team field-goal percentage on attempts from 40 feet and beyond, as a decimal. |

**Row type:** `WnbaStatsLeaguedashteamshotlocationsRow` (exported from the package root).

### Returns — `wnba_stats_leaguedashteamstats` / `wnbaStatsLeaguedashteamstats`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsLeaguedashteamstatsRow` (exported from the package root).

### Returns — `wnba_stats_leaguegamefinder` / `wnbaStatsLeaguegamefinder`

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `min` | integer | Minutes played. |
| `pts` | integer | Points scored. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |

**Row type:** `WnbaStatsLeaguegamefinderRow` (exported from the package root).

### Returns — `wnba_stats_leaguegamelog` / `wnbaStatsLeaguegamelog`

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `min` | integer | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |
| `plus_minus` | integer | Plus/minus point differential while on court. |
| `video_available` | integer | Video available. |

**Row type:** `WnbaStatsLeaguegamelogRow` (exported from the package root).

### Returns — `wnba_stats_leagueleaders` / `wnbaStatsLeagueleaders`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `rank` | integer | Rank. |
| `player` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team` | character | Team-side label or team identifier. |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pts` | numeric | Points scored. |
| `eff` | numeric | Eff. |

**Row type:** `WnbaStatsLeagueleadersRow` (exported from the package root).

### Returns — `wnba_stats_leaguelineupviz` / `wnbaStatsLeaguelineupviz`

| col_name | type | description |
|---|---|---|
| `group_id` | character | ESPN group id. |
| `group_name` | character |  |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `min` | numeric | Minutes played. |
| `off_rating` | numeric | Points scored per 100 possessions with the lineup on the floor (offensive rating). |
| `def_rating` | numeric | Points allowed per 100 possessions with the lineup on the floor (defensive rating). |
| `net_rating` | numeric | Net rating (off rating - def rating). |
| `pace` | numeric | Possessions per 48 minutes. |
| `ts_pct` | numeric | True shooting percentage (0-1). |
| `fta_rate` | numeric | Free throw attempts per field goal attempt for the lineup. |
| `tm_ast_pct` | numeric | Percentage of the lineup's made field goals that were assisted, as a decimal. |
| `pct_fga_2_pt` | numeric | Share of field goal attempts taken as two-pointers, as a decimal. |
| `pct_fga_3_pt` | numeric | Share of field goal attempts taken as three-pointers, as a decimal. |
| `pct_pts_2_pt_mr` | numeric | Share of points scored on mid-range two-pointers, as a decimal. |
| `pct_pts_fb` | numeric | Share of points scored on fast breaks, as a decimal. |
| `pct_pts_ft` | numeric | Share of points scored at the free throw line, as a decimal. |
| `pct_pts_paint` | numeric | Share of points scored in the paint, as a decimal. |
| `pct_ast_fgm` | numeric | Percentage of made field goals that were assisted, as a decimal. |
| `pct_uast_fgm` | numeric | Percentage of made field goals that were unassisted, as a decimal. |
| `opp_fg3_pct` | numeric | Opponent three-point percentage against the lineup, as a decimal. |
| `opp_efg_pct` | numeric | Opponent effective field goal percentage against the lineup, as a decimal. |
| `opp_fta_rate` | numeric | Opponent free throw attempt rate against the lineup. |
| `opp_tov_pct` | numeric | Opponent turnover percentage forced by the lineup. |
| `sum_tm_min` | numeric | Total team minutes summed across the lineup's stints on the floor. |

**Row type:** `WnbaStatsLeaguelineupvizRow` (exported from the package root).

### Returns — `wnba_stats_leagueplayerondetails` / `wnbaStatsLeagueplayerondetails`

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | integer | Stats API identifier for vs player identifier associated with this NBA or WNBA Stats row. |
| `vs_player_name` | character | Display name for vs player name associated with this NBA or WNBA Stats row. |
| `court_status` | character | Indicates whether the compared player was on court or off court for the split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsLeagueplayerondetailsRow` (exported from the package root).

### Returns — `wnba_stats_leagueseasonmatchups` / `wnbaStatsLeagueseasonmatchups`

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |
| `off_player_id` | integer | Stats API identifier for offensive player identifier associated with this NBA or WNBA Stats row. |
| `off_player_name` | character | Display name for offensive player name associated with this NBA or WNBA Stats row. |
| `def_player_id` | integer | Stats API identifier for defensive player identifier associated with this NBA or WNBA Stats row. |
| `def_player_name` | character | Display name for defensive player name associated with this NBA or WNBA Stats row. |
| `gp` | integer | Games played. |
| `matchup_min` | numeric | NBA or WNBA Stats value for matchup minutes in the leagueseasonmatchups result set. |
| `partial_poss` | numeric | Estimated partial possessions credited to the stint or rotation interval. |
| `player_pts` | numeric | Scoring or score-margin metric for player points in the requested NBA or WNBA Stats split. |
| `team_pts` | numeric | Scoring or score-margin metric for team points in the requested NBA or WNBA Stats split. |
| `matchup_ast` | numeric | NBA or WNBA Stats value for matchup assists in the leagueseasonmatchups result set. |
| `matchup_tov` | numeric | Turnover or loose-ball metric for matchup turnovers in the requested NBA or WNBA Stats split. |
| `matchup_blk` | numeric | NBA or WNBA Stats value for matchup blocks in the leagueseasonmatchups result set. |
| `matchup_fgm` | numeric | Shooting metric for matchup fgm in the requested NBA or WNBA Stats split. |
| `matchup_fga` | numeric | Shooting metric for matchup fga in the requested NBA or WNBA Stats split. |
| `matchup_fg_pct` | numeric | Percentage or rate for matchup field goals percentage in the requested NBA or WNBA Stats split. |
| `matchup_fg3_m` | numeric | Shooting metric for matchup fg3m in the requested NBA or WNBA Stats split. |
| `matchup_fg3_a` | numeric | Shooting metric for matchup fg3a in the requested NBA or WNBA Stats split. |
| `matchup_fg3_pct` | numeric | Percentage or rate for matchup three-point field goals percentage in the requested NBA or WNBA Stats split. |
| `help_blk` | integer | NBA or WNBA Stats value for help blocks in the leagueseasonmatchups result set. |
| `help_fgm` | integer | Shooting metric for help fgm in the requested NBA or WNBA Stats split. |
| `help_fga` | integer | Shooting metric for help fga in the requested NBA or WNBA Stats split. |
| `help_fg_perc` | integer | Shooting metric for help field goals perc in the requested NBA or WNBA Stats split. |
| `matchup_ftm` | numeric | NBA or WNBA Stats value for matchup ftm in the leagueseasonmatchups result set. |
| `matchup_fta` | numeric | NBA or WNBA Stats value for matchup fta in the leagueseasonmatchups result set. |
| `sfl` | numeric | NBA or WNBA Stats value for sfl in the leagueseasonmatchups result set. |

**Row type:** `WnbaStatsLeagueseasonmatchupsRow` (exported from the package root).

### Returns — `wnba_stats_leaguestandingsv3` / `wnbaStatsLeaguestandingsv3`

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier used in compact NBA Stats schedule and scoreboard result sets. |
| `season_id` | character | Stats API identifier for seasonid associated with this NBA or WNBA Stats row. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_slug` | character | URL slug for teamslug used by NBA or WNBA Stats pages. |
| `conference` | character | Filter players or teams by conference. |
| `conference_record` | character | NBA or WNBA Stats value for conferencerecord in the leaguestandingsv3 result set. |
| `playoff_rank` | integer | NBA or WNBA Stats value for playoffrank in the leaguestandingsv3 result set. |
| `clinch_indicator` | character | NBA or WNBA Stats value for clinchindicator in the leaguestandingsv3 result set. |
| `division` | character | Team division. |
| `division_record` | character | NBA or WNBA Stats value for divisionrecord in the leaguestandingsv3 result set. |
| `division_rank` | integer | NBA or WNBA Stats value for divisionrank in the leaguestandingsv3 result set. |
| `wins` | integer | Total wins. |
| `losses` | integer | Total losses. |
| `win_pct` | numeric | Winning percentage for the team or split represented by this row. |
| `league_rank` | integer | NBA or WNBA Stats value for leaguerank in the leaguestandingsv3 result set. |
| `record` | character | Record string (e.g. '12-4'). |
| `home` | character | Home. |
| `road` | character | Road. |
| `l10` | character | L10. |
| `last10_home` | character | NBA or WNBA Stats value for last10home in the leaguestandingsv3 result set. |
| `last10_road` | character | NBA or WNBA Stats value for last10road in the leaguestandingsv3 result set. |
| `ot` | character | Ot. |
| `three_pts_or_less` | character | Scoring or score-margin metric for threeptsorless in the requested NBA or WNBA Stats split. |
| `ten_pts_or_more` | character | Scoring or score-margin metric for tenptsormore in the requested NBA or WNBA Stats split. |
| `long_home_streak` | integer | NBA or WNBA Stats value for longhomestreak in the leaguestandingsv3 result set. |
| `str_long_home_streak` | character | NBA or WNBA Stats value for strlonghomestreak in the leaguestandingsv3 result set. |
| `long_road_streak` | integer | NBA or WNBA Stats value for longroadstreak in the leaguestandingsv3 result set. |
| `str_long_road_streak` | character | NBA or WNBA Stats value for strlongroadstreak in the leaguestandingsv3 result set. |
| `long_win_streak` | integer | NBA or WNBA Stats value for longwinstreak in the leaguestandingsv3 result set. |
| `long_loss_streak` | integer | NBA or WNBA Stats value for longlossstreak in the leaguestandingsv3 result set. |
| `current_home_streak` | integer | NBA or WNBA Stats value for currenthomestreak in the leaguestandingsv3 result set. |
| `str_current_home_streak` | character | NBA or WNBA Stats value for strcurrenthomestreak in the leaguestandingsv3 result set. |
| `current_road_streak` | integer | NBA or WNBA Stats value for currentroadstreak in the leaguestandingsv3 result set. |
| `str_current_road_streak` | character | NBA or WNBA Stats value for strcurrentroadstreak in the leaguestandingsv3 result set. |
| `current_streak` | integer | NBA or WNBA Stats value for currentstreak in the leaguestandingsv3 result set. |
| `str_current_streak` | character |  |
| `conference_games_back` | numeric | NBA or WNBA Stats value for conferencegamesback in the leaguestandingsv3 result set. |
| `division_games_back` | numeric | NBA or WNBA Stats value for divisiongamesback in the leaguestandingsv3 result set. |
| `clinched_conference_title` | integer | Flag indicating clinchedconferencetitle for the requested NBA or WNBA Stats context. |
| `clinched_division_title` | integer | Flag indicating clincheddivisiontitle for the requested NBA or WNBA Stats context. |
| `clinched_playoff_birth` | integer | Flag indicating clinchedplayoffbirth for the requested NBA or WNBA Stats context. |
| `clinched_play_in` | integer | Flag indicating clinchedplayin for the requested NBA or WNBA Stats context. |
| `eliminated_conference` | integer | Flag indicating eliminatedconference for the requested NBA or WNBA Stats context. |
| `eliminated_division` | integer | Flag indicating eliminateddivision for the requested NBA or WNBA Stats context. |
| `ahead_at_half` | character | NBA or WNBA Stats value for aheadathalf in the leaguestandingsv3 result set. |
| `behind_at_half` | character | NBA or WNBA Stats value for behindathalf in the leaguestandingsv3 result set. |
| `tied_at_half` | character | NBA or WNBA Stats value for tiedathalf in the leaguestandingsv3 result set. |
| `ahead_at_third` | character | NBA or WNBA Stats value for aheadatthird in the leaguestandingsv3 result set. |
| `behind_at_third` | character | NBA or WNBA Stats value for behindatthird in the leaguestandingsv3 result set. |
| `tied_at_third` | character | NBA or WNBA Stats value for tiedatthird in the leaguestandingsv3 result set. |
| `score100_pts` | character | Scoring or score-margin metric for score100pts in the requested NBA or WNBA Stats split. |
| `opp_score100_pts` | character | Scoring or score-margin metric for oppscore100pts in the requested NBA or WNBA Stats split. |
| `opp_over500` | character | NBA or WNBA Stats value for oppover500 in the leaguestandingsv3 result set. |
| `lead_in_fgpct` | character | Shooting metric for leadinfgpct in the requested NBA or WNBA Stats split. |
| `lead_in_reb` | character | Rebounding metric for leadinreb in the requested NBA or WNBA Stats split. |
| `fewer_turnovers` | character | Turnover or loose-ball metric for fewerturnovers in the requested NBA or WNBA Stats split. |
| `points_pg` | numeric | Scoring or score-margin metric for pointspg in the requested NBA or WNBA Stats split. |
| `opp_points_pg` | numeric | Scoring or score-margin metric for opppointspg in the requested NBA or WNBA Stats split. |
| `diff_points_pg` | numeric | Scoring or score-margin metric for diffpointspg in the requested NBA or WNBA Stats split. |
| `vs_east` | character | NBA or WNBA Stats value for vseast in the leaguestandingsv3 result set. |
| `vs_atlantic` | character | NBA or WNBA Stats value for vsatlantic in the leaguestandingsv3 result set. |
| `vs_central` | character | NBA or WNBA Stats value for vscentral in the leaguestandingsv3 result set. |
| `vs_southeast` | character | NBA or WNBA Stats value for vssoutheast in the leaguestandingsv3 result set. |
| `vs_west` | character | NBA or WNBA Stats value for vswest in the leaguestandingsv3 result set. |
| `vs_northwest` | character | NBA or WNBA Stats value for vsnorthwest in the leaguestandingsv3 result set. |
| `vs_pacific` | character | NBA or WNBA Stats value for vspacific in the leaguestandingsv3 result set. |
| `vs_southwest` | character | NBA or WNBA Stats value for vssouthwest in the leaguestandingsv3 result set. |
| `jan` | character | Value for January in the endpoint's monthly NBA or WNBA Stats split. |
| `feb` | character | Value for February in the endpoint's monthly NBA or WNBA Stats split. |
| `mar` | character | Value for March in the endpoint's monthly NBA or WNBA Stats split. |
| `apr` | character | Value for April in the endpoint's monthly NBA or WNBA Stats split. |
| `may` | character | Value for May in the endpoint's monthly NBA or WNBA Stats split. |
| `jun` | character | Value for June in the endpoint's monthly NBA or WNBA Stats split. |
| `jul` | character | Value for July in the endpoint's monthly NBA or WNBA Stats split. |
| `aug` | character | Value for August in the endpoint's monthly NBA or WNBA Stats split. |
| `sep` | character | Value for September in the endpoint's monthly NBA or WNBA Stats split. |
| `oct` | character | Value for October in the endpoint's monthly NBA or WNBA Stats split. |
| `nov` | character | Value for November in the endpoint's monthly NBA or WNBA Stats split. |
| `dec` | character | Value for December in the endpoint's monthly NBA or WNBA Stats split. |
| `score_80_plus` | character | Scoring or score-margin metric for score 80 plus in the requested NBA or WNBA Stats split. |
| `opp_score_80_plus` | character | Opponent score 80 plus for the requested NBA or WNBA team, player, lineup, or game split. |
| `score_below_80` | character | Scoring or score-margin metric for score below 80 in the requested NBA or WNBA Stats split. |
| `opp_score_below_80` | character | Opponent score below 80 for the requested NBA or WNBA team, player, lineup, or game split. |
| `total_points` | integer | Scoring or score-margin metric for totalpoints in the requested NBA or WNBA Stats split. |
| `opp_total_points` | integer | Scoring or score-margin metric for opptotalpoints in the requested NBA or WNBA Stats split. |
| `diff_total_points` | integer | Scoring or score-margin metric for difftotalpoints in the requested NBA or WNBA Stats split. |
| `league_games_back` | numeric | NBA or WNBA Stats value for leaguegamesback in the leaguestandingsv3 result set. |
| `playoff_seeding` | integer | NBA or WNBA Stats value for playoffseeding in the leaguestandingsv3 result set. |
| `clinched_post_season` | integer | Flag indicating clinchedpostseason for the requested NBA or WNBA Stats context. |
| `neutral` | character | Neutral. |

**Row type:** `WnbaStatsLeaguestandingsv3Row` (exported from the package root).

### Returns — `wnba_stats_playbyplayv2` / `wnbaStatsPlaybyplayv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`PlayByPlay`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `eventnum` | integer | Sequential event number within the game's play-by-play feed. |
| `eventmsgtype` | integer | Numeric event type code (1 = made shot, 2 = missed shot, 3 = free throw, 4 = rebound, 5 = turnover, 6 = foul, ...). |
| `eventmsgactiontype` | integer | Numeric sub-type code refining eventmsgtype (e.g. the specific shot, foul, or turnover variety). |
| `period` | integer | Period of the game (1-4 quarters; 5+ for OT). |
| `wctimestring` | character | Wall-clock time of day when the event occurred. |
| `pctimestring` | character | Game clock remaining in the period when the event occurred (MM:SS). |
| `homedescription` | character | Text description of the event from the home team's perspective; empty when not a home-team action. |
| `neutraldescription` | character | Neutral text description of the event (e.g. period start/end); empty for team actions. |
| `visitordescription` | character | Text description of the event from the visiting team's perspective; empty when not a visitor action. |
| `score` | character | Final score. |
| `scoremargin` | character | Score margin after the event ('TIE' when tied); empty on non-scoring events. |
| `person1_type` | integer |  |
| `player1_id` | integer | V2 PBP primary player ID (e.g. shooter / fouler). |
| `player1_name` | character | V2 PBP primary player name. |
| `player1_team_id` | integer | Team ID of player1. |
| `player1_team_city` | character | Player1 team city. |
| `player1_team_nickname` | character | Player1 team nickname. |
| `player1_team_abbreviation` | character | Player1 team abbreviation. |
| `person2_type` | integer |  |
| `player2_id` | integer | V2 PBP secondary player ID (e.g. assister / fouled-by). |
| `player2_name` | character | V2 PBP secondary player name. |
| `player2_team_id` | integer | Team ID of player2. |
| `player2_team_city` | character | Player2 team city. |
| `player2_team_nickname` | character | Player2 team nickname. |
| `player2_team_abbreviation` | character | Player2 team abbreviation. |
| `person3_type` | integer |  |
| `player3_id` | integer | V2 PBP tertiary player ID (e.g. blocker). |
| `player3_name` | character | V2 PBP tertiary player name. |
| `player3_team_id` | integer | Team ID of player3. |
| `player3_team_city` | character | Player3 team city. |
| `player3_team_nickname` | character | Player3 team nickname. |
| `player3_team_abbreviation` | character | Player3 team abbreviation. |
| `video_available_flag` | integer | Video available flag. |

**`AvailableVideo`**

| col_name | type | description |
|---|---|---|
| `video_available_flag` | integer | Video available flag. |

**Row type:** `WnbaStatsPlaybyplayv2Tables`, `WnbaStatsPlaybyplayv2PlayByPlayRow`, `WnbaStatsPlaybyplayv2AvailableVideoRow` (exported from the package root).

### Returns — `wnba_stats_playbyplayv3` / `wnbaStatsPlaybyplayv3`

No returns table is published for this endpoint: parse_nba_stats_result_sets emits no columns for the committed capture tests/fixtures/wnba_stats/endpoints/playbyplayv3.json

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `wnba_stats_playerawards` / `wnbaStatsPlayerawards`

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `team` | character | Team-side label or team identifier. |
| `description` | character | Long-form description text. |
| `all_nba_team_number` | character | NBA or WNBA Stats value for all NBA team number in the playerawards result set. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `month` | character | NBA or WNBA Stats value for month in the playerawards result set. |
| `week` | character | Week number. |
| `conference` | character | Filter players or teams by conference. |
| `type` | character | Record type / category. |
| `subtype1` | character | NBA or WNBA Stats value for subtype1 in the playerawards result set. |
| `subtype2` | character | NBA or WNBA Stats value for subtype2 in the playerawards result set. |
| `subtype3` | character | NBA or WNBA Stats value for subtype3 in the playerawards result set. |

**Row type:** `WnbaStatsPlayerawardsRow` (exported from the package root).

### Returns — `wnba_stats_playercareerbycollegerollup` / `wnbaStatsPlayercareerbycollegerollup`

With `{ parsed: true }`: an object of tables, one per key below.

**`East`**

| col_name | type | description |
|---|---|---|
| `region` | character | Region label. |
| `seed` | integer | Region seed slot of the college in the stats API's career-by-college rollup grid. |
| `college` | character | College or school attended. |
| `players` | integer | Nested list of per-player box scores. |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**`South`**

| col_name | type | description |
|---|---|---|
| `region` | character | Region label. |
| `seed` | integer | Region seed slot of the college in the stats API's career-by-college rollup grid. |
| `college` | character | College or school attended. |
| `players` | integer | Nested list of per-player box scores. |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**`Midwest`**

| col_name | type | description |
|---|---|---|
| `region` | character | Region label. |
| `seed` | integer | Region seed slot of the college in the stats API's career-by-college rollup grid. |
| `college` | character | College or school attended. |
| `players` | integer | Nested list of per-player box scores. |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**`West`**

| col_name | type | description |
|---|---|---|
| `region` | character | Region label. |
| `seed` | integer | Region seed slot of the college in the stats API's career-by-college rollup grid. |
| `college` | character | College or school attended. |
| `players` | integer | Nested list of per-player box scores. |
| `gp` | integer | Games played. |
| `min` | numeric | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**Row type:** `WnbaStatsPlayercareerbycollegerollupTables`, `WnbaStatsPlayercareerbycollegerollupEastRow`, `WnbaStatsPlayercareerbycollegerollupSouthRow`, `WnbaStatsPlayercareerbycollegerollupMidwestRow`, `WnbaStatsPlayercareerbycollegerollupWestRow` (exported from the package root).

### Returns — `wnba_stats_playercareerstats` / `wnbaStatsPlayercareerstats`

With `{ parsed: true }`: an object of tables, one per key below.

**`SeasonTotalsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsAllStarSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsAllStarSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsCollegeSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | character | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `organization_id` | character |  |
| `school_name` | character |  |
| `player_age` | character | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `tov` | character | Turnovers. |
| `pf` | character | Personal fouls. |
| `pts` | character | Points scored. |

**`CareerTotalsCollegeSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | character | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `organization_id` | character |  |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `tov` | character | Turnovers. |
| `pf` | character | Personal fouls. |
| `pts` | character | Points scored. |

**`SeasonTotalsShowcaseSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsShowcaseSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonRankingsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | character | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `rank_pg_min` | integer |  |
| `rank_pg_fgm` | integer |  |
| `rank_pg_fga` | integer |  |
| `rank_fg_pct` | integer |  |
| `rank_pg_fg3_m` | integer |  |
| `rank_pg_fg3_a` | integer |  |
| `rank_fg3_pct` | integer |  |
| `rank_pg_ftm` | integer |  |
| `rank_pg_fta` | integer |  |
| `rank_ft_pct` | integer |  |
| `rank_pg_oreb` | integer |  |
| `rank_pg_dreb` | integer |  |
| `rank_pg_reb` | integer |  |
| `rank_pg_ast` | integer |  |
| `rank_pg_stl` | integer |  |
| `rank_pg_blk` | integer |  |
| `rank_pg_tov` | integer |  |
| `rank_pg_pts` | integer |  |
| `rank_pg_eff` | integer |  |

**`SeasonRankingsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | character | NBA or WNBA Stats value for player age in the playercareerstats result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `rank_pg_min` | integer |  |
| `rank_pg_fgm` | integer |  |
| `rank_pg_fga` | integer |  |
| `rank_fg_pct` | integer |  |
| `rank_pg_fg3_m` | integer |  |
| `rank_pg_fg3_a` | integer |  |
| `rank_fg3_pct` | character |  |
| `rank_pg_ftm` | integer |  |
| `rank_pg_fta` | integer |  |
| `rank_ft_pct` | integer |  |
| `rank_pg_oreb` | integer |  |
| `rank_pg_dreb` | integer |  |
| `rank_pg_reb` | integer |  |
| `rank_pg_ast` | integer |  |
| `rank_pg_stl` | integer |  |
| `rank_pg_blk` | integer |  |
| `rank_pg_tov` | integer |  |
| `rank_pg_pts` | integer |  |
| `rank_pg_eff` | integer |  |

**`SeasonHighs`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `vs_team_id` | integer |  |
| `vs_team_city` | character |  |
| `vs_team_name` | character |  |
| `vs_team_abbreviation` | character |  |
| `stat` | character | Stat. |
| `stat_value` | integer | Stat value. |
| `stat_order` | integer |  |
| `date_est` | character |  |

**`CareerHighs`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `vs_team_id` | integer |  |
| `vs_team_city` | character |  |
| `vs_team_name` | character |  |
| `vs_team_abbreviation` | character |  |
| `stat` | character | Stat. |
| `stat_value` | integer | Stat value. |
| `stat_order` | integer |  |
| `date_est` | character |  |

**Row type:** `WnbaStatsPlayercareerstatsTables`, `WnbaStatsPlayercareerstatsSeasonTotalsRegularSeasonRow`, `WnbaStatsPlayercareerstatsCareerTotalsRegularSeasonRow`, `WnbaStatsPlayercareerstatsSeasonTotalsPostSeasonRow`, `WnbaStatsPlayercareerstatsCareerTotalsPostSeasonRow`, `WnbaStatsPlayercareerstatsSeasonTotalsAllStarSeasonRow`, `WnbaStatsPlayercareerstatsCareerTotalsAllStarSeasonRow`, `WnbaStatsPlayercareerstatsSeasonTotalsCollegeSeasonRow`, `WnbaStatsPlayercareerstatsCareerTotalsCollegeSeasonRow`, `WnbaStatsPlayercareerstatsSeasonTotalsShowcaseSeasonRow`, `WnbaStatsPlayercareerstatsCareerTotalsShowcaseSeasonRow`, `WnbaStatsPlayercareerstatsSeasonRankingsRegularSeasonRow`, `WnbaStatsPlayercareerstatsSeasonRankingsPostSeasonRow`, `WnbaStatsPlayercareerstatsSeasonHighsRow`, `WnbaStatsPlayercareerstatsCareerHighsRow` (exported from the package root).

### Returns — `wnba_stats_playercompare` / `wnbaStatsPlayercompare`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallCompare`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `description` | character | Long-form description text. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |

**`Individual`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `description` | character | Long-form description text. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |

**Row type:** `WnbaStatsPlayercompareTables`, `WnbaStatsPlayercompareOverallCompareRow`, `WnbaStatsPlayercompareIndividualRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbyclutch` / `wnbaStatsPlayerdashboardbyclutch`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last5Min5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last3Min5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last1Min5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last30Sec3PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last10Sec3PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last5MinPlusMinus5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last3MinPlusMinus5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last1MinPlusMinus5PointPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last30Sec3Point2PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**`Last10Sec3Point2PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyclutch result set. |

**Row type:** `WnbaStatsPlayerdashboardbyclutchTables`, `WnbaStatsPlayerdashboardbyclutchOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast5Min5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast3Min5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast1Min5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast30Sec3PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast10Sec3PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast5MinPlusMinus5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast3MinPlusMinus5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast1MinPlusMinus5PointPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast30Sec3Point2PlayerDashboardRow`, `WnbaStatsPlayerdashboardbyclutchLast10Sec3Point2PlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbygamesplits` / `wnbaStatsPlayerdashboardbygamesplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygamesplits result set. |

**`ByHalfPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygamesplits result set. |

**`ByPeriodPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | integer | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygamesplits result set. |

**`ByScoreMarginPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygamesplits result set. |

**`ByActualMarginPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygamesplits result set. |

**Row type:** `WnbaStatsPlayerdashboardbygamesplitsTables`, `WnbaStatsPlayerdashboardbygamesplitsOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygamesplitsByHalfPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygamesplitsByPeriodPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygamesplitsByScoreMarginPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygamesplitsByActualMarginPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbygeneralsplits` / `wnbaStatsPlayerdashboardbygeneralsplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`LocationPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`WinsLossesPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`MonthPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`PrePostAllStarPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`StartingPosition`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**`DaysRestPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbygeneralsplits result set. |

**Row type:** `WnbaStatsPlayerdashboardbygeneralsplitsTables`, `WnbaStatsPlayerdashboardbygeneralsplitsOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygeneralsplitsLocationPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygeneralsplitsWinsLossesPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygeneralsplitsMonthPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygeneralsplitsPrePostAllStarPlayerDashboardRow`, `WnbaStatsPlayerdashboardbygeneralsplitsStartingPositionRow`, `WnbaStatsPlayerdashboardbygeneralsplitsDaysRestPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbylastngames` / `wnbaStatsPlayerdashboardbylastngames`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**`Last5PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**`Last10PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**`Last15PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**`Last20PlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**`GameNumberPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbylastngames result set. |

**Row type:** `WnbaStatsPlayerdashboardbylastngamesTables`, `WnbaStatsPlayerdashboardbylastngamesOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbylastngamesLast5PlayerDashboardRow`, `WnbaStatsPlayerdashboardbylastngamesLast10PlayerDashboardRow`, `WnbaStatsPlayerdashboardbylastngamesLast15PlayerDashboardRow`, `WnbaStatsPlayerdashboardbylastngamesLast20PlayerDashboardRow`, `WnbaStatsPlayerdashboardbylastngamesGameNumberPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbyopponent` / `wnbaStatsPlayerdashboardbyopponent`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**`ConferencePlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**`DivisionPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**`OpponentPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**Row type:** `WnbaStatsPlayerdashboardbyopponentTables`, `WnbaStatsPlayerdashboardbyopponentOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyopponentConferencePlayerDashboardRow`, `WnbaStatsPlayerdashboardbyopponentDivisionPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyopponentOpponentPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbyshootingsplits` / `wnbaStatsPlayerdashboardbyshootingsplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`Shot5FTPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`Shot8FTPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`ShotAreaPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`AssitedShotPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`ShotTypeSummaryPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |

**`ShotTypePlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`AssistedBy`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsPlayerdashboardbyshootingsplitsTables`, `WnbaStatsPlayerdashboardbyshootingsplitsOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsShot5FTPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsShot8FTPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsShotAreaPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsAssitedShotPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsShotTypeSummaryPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsShotTypePlayerDashboardRow`, `WnbaStatsPlayerdashboardbyshootingsplitsAssistedByRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbyteamperformance` / `wnbaStatsPlayerdashboardbyteamperformance`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyteamperformance result set. |

**`ScoreDifferentialPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value_order` | integer | Sort order assigned to the grouping value in NBA or WNBA Stats dashboards. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `group_value_2` | character | Secondary grouping value for dashboards that return paired split dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyteamperformance result set. |

**`PointsScoredPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value_order` | integer | Sort order assigned to the grouping value in NBA or WNBA Stats dashboards. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `group_value_2` | character | Secondary grouping value for dashboards that return paired split dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyteamperformance result set. |

**`PontsAgainstPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value_order` | integer | Sort order assigned to the grouping value in NBA or WNBA Stats dashboards. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `group_value_2` | character | Secondary grouping value for dashboards that return paired split dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyteamperformance result set. |

**Row type:** `WnbaStatsPlayerdashboardbyteamperformanceTables`, `WnbaStatsPlayerdashboardbyteamperformanceOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyteamperformanceScoreDifferentialPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyteamperformancePointsScoredPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyteamperformancePontsAgainstPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashboardbyyearoveryear` / `wnbaStatsPlayerdashboardbyyearoveryear`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `max_game_date` | character | Date or timestamp for maximum game date in the NBA or WNBA Stats result set. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyyearoveryear result set. |

**`ByYearPlayerDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `max_game_date` | character | Date or timestamp for maximum game date in the NBA or WNBA Stats result set. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playerdashboardbyyearoveryear result set. |

**Row type:** `WnbaStatsPlayerdashboardbyyearoveryearTables`, `WnbaStatsPlayerdashboardbyyearoveryearOverallPlayerDashboardRow`, `WnbaStatsPlayerdashboardbyyearoveryearByYearPlayerDashboardRow` (exported from the package root).

### Returns — `wnba_stats_playerdashptshotdefend` / `wnbaStatsPlayerdashptshotdefend`

| col_name | type | description |
|---|---|---|
| `matchupid` | integer | Stats API identifier for matchupid associated with this NBA or WNBA Stats row. |
| `gp` | integer | Games played. |
| `g` | integer | Games played. |
| `defense_category` | character | NBA or WNBA Stats value for defense category in the playerdashptshotdefend result set. |
| `freq` | numeric | NBA or WNBA Stats value for freq in the playerdashptshotdefend result set. |
| `d_fgm` | numeric | Shooting metric for d fgm in the requested NBA or WNBA Stats split. |
| `d_fga` | numeric | Shooting metric for d fga in the requested NBA or WNBA Stats split. |
| `d_fg_pct` | numeric | Percentage or rate for d field goals percentage in the requested NBA or WNBA Stats split. |
| `normal_fg_pct` | numeric | Percentage or rate for normal field goals percentage in the requested NBA or WNBA Stats split. |
| `pct_plusminus` | numeric | Percentage share of plusminus for the requested NBA or WNBA Stats split. |

**Row type:** `WnbaStatsPlayerdashptshotdefendRow` (exported from the package root).

### Returns — `wnba_stats_playerestimatedmetrics` / `wnbaStatsPlayerestimatedmetrics`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `e_off_rating` | numeric | Estimated offensive rating for the requested NBA or WNBA Stats split. |
| `e_def_rating` | numeric | Estimated defensive rating for the requested NBA or WNBA Stats split. |
| `e_net_rating` | numeric | Estimated net rating for the requested NBA or WNBA Stats split. |
| `e_ast_ratio` | numeric | Estimated assist ratio for the requested NBA or WNBA Stats split. |
| `e_oreb_pct` | numeric | Estimated offensive rebound percentage for the requested NBA or WNBA Stats split. |
| `e_dreb_pct` | numeric | Estimated defensive rebound percentage for the requested NBA or WNBA Stats split. |
| `e_reb_pct` | numeric | Estimated rebound percentage for the requested NBA or WNBA Stats split. |
| `e_tov_pct` | numeric | Estimated turnovers percentage for the requested NBA or WNBA Stats split. |
| `e_usg_pct` | numeric | Estimated usage percentage for the requested NBA or WNBA Stats split. |
| `e_pace` | numeric | Estimated pace for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_off_rating_rank` | integer | Rank for e offensive rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_def_rating_rank` | integer | Rank for e defensive rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_net_rating_rank` | integer | Rank for e net rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_ast_ratio_rank` | integer | Rank for e assists ratio within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_oreb_pct_rank` | integer | Rank for e offensive rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_dreb_pct_rank` | integer | Rank for e defensive rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_reb_pct_rank` | integer | Rank for e rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_tov_pct_rank` | integer | Rank for e turnovers percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_usg_pct_rank` | integer | Rank for e usage percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_pace_rank` | integer | Rank for e pace within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsPlayerestimatedmetricsRow` (exported from the package root).

### Returns — `wnba_stats_playerfantasyprofile` / `wnbaStatsPlayerfantasyprofile`

With `{ parsed: true }`: an object of tables, one per key below.

**`Overall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`Location`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`LastNGames`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`DaysRestModified`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`Opponent`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `fan_duel_pts` | numeric | Fantasy points under FanDuel's scoring formula. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**Row type:** `WnbaStatsPlayerfantasyprofileTables`, `WnbaStatsPlayerfantasyprofileOverallRow`, `WnbaStatsPlayerfantasyprofileLocationRow`, `WnbaStatsPlayerfantasyprofileLastNGamesRow`, `WnbaStatsPlayerfantasyprofileDaysRestModifiedRow`, `WnbaStatsPlayerfantasyprofileOpponentRow` (exported from the package root).

### Returns — `wnba_stats_playerfantasyprofilebargraph` / `wnbaStatsPlayerfantasyprofilebargraph`

With `{ parsed: true }`: an object of tables, one per key below.

**`SeasonAvg`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `fan_duel_pts` | numeric | Scoring or score-margin metric for fan duel points in the requested NBA or WNBA Stats split. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `fg3_m` | numeric | Three-point field goals made. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`LastFiveGamesAvg`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `fan_duel_pts` | numeric | Scoring or score-margin metric for fan duel points in the requested NBA or WNBA Stats split. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `fg3_m` | numeric | Three-point field goals made. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**Row type:** `WnbaStatsPlayerfantasyprofilebargraphTables`, `WnbaStatsPlayerfantasyprofilebargraphSeasonAvgRow`, `WnbaStatsPlayerfantasyprofilebargraphLastFiveGamesAvgRow` (exported from the package root).

### Returns — `wnba_stats_playergamelog` / `wnbaStatsPlayergamelog`

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |
| `player_id` | integer | Unique player identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `min` | integer | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |
| `plus_minus` | integer | Plus/minus point differential while on court. |
| `video_available` | integer | Video available. |

**Row type:** `WnbaStatsPlayergamelogRow` (exported from the package root).

### Returns — `wnba_stats_playergamelogs` / `wnbaStatsPlayergamelogs`

| col_name | type | description |
|---|---|---|
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `available_flag` | integer | Flag indicating whether the requested NBA or WNBA Stats video or data asset is available. |
| `min_sec` | character | Minutes and seconds played, formatted as a game-clock duration string. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the playergamelogs result set. |

**Row type:** `WnbaStatsPlayergamelogsRow` (exported from the package root).

### Returns — `wnba_stats_playergamestreakfinder` / `wnbaStatsPlayergamestreakfinder`

| col_name | type | description |
|---|---|---|
| `player_name_last_first` | character | Player display name formatted as Last, First for sorting in NBA or WNBA Stats tables. |
| `player_id` | integer | Unique player identifier. |
| `gamestreak` | integer | NBA or WNBA Stats value for gamestreak in the playergamestreakfinder result set. |
| `startdate` | character | Date or timestamp for startdate in the NBA or WNBA Stats result set. |
| `enddate` | character | Date or timestamp for enddate in the NBA or WNBA Stats result set. |
| `activestreak` | integer | NBA or WNBA Stats value for activestreak in the playergamestreakfinder result set. |
| `numseasons` | integer | NBA or WNBA Stats value for numseasons in the playergamestreakfinder result set. |
| `lastseason` | character | NBA or WNBA Stats value for lastseason in the playergamestreakfinder result set. |
| `firstseason` | character | NBA or WNBA Stats value for firstseason in the playergamestreakfinder result set. |

**Row type:** `WnbaStatsPlayergamestreakfinderRow` (exported from the package root).

### Returns — `wnba_stats_playerindex` / `wnbaStatsPlayerindex`

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `player_last_name` | character |  |
| `player_first_name` | character |  |
| `player_slug` | character | URL-safe player identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_slug` | character | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `jersey_number` | character | Jersey number. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `height` | character | Player height (string e.g. '6-2' or inches). |
| `weight` | character | Player weight in pounds. |
| `college` | character | College or school attended. |
| `country` | character | Country (full name or code). |
| `draft_year` | integer | Draft year (4-digit). |
| `draft_round` | integer | Round of the draft selection. |
| `draft_number` | integer |  |
| `roster_status` | numeric |  |
| `from_year` | character | First season. |
| `to_year` | character | Most recent season. |
| `pts` | numeric | Points scored. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stats_timeframe` | character | Time value for stats timeframe in the NBA or WNBA Stats result set. |

**Row type:** `WnbaStatsPlayerindexRow` (exported from the package root).

### Returns — `wnba_stats_playernextngames` / `wnbaStatsPlayernextngames`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `home_team_name` | character | Home team name. |
| `visitor_team_name` | character | Full name of the visiting team in the upcoming game. |
| `home_team_abbreviation` | character |  |
| `visitor_team_abbreviation` | character | Abbreviation of the visiting team in the upcoming game. |
| `home_team_nickname` | character |  |
| `visitor_team_nickname` | character | Nickname of the visiting team in the upcoming game. |
| `game_time` | character | Game start time. |
| `home_wl` | character | Home team's win-loss record entering the upcoming game. |
| `visitor_wl` | character | Visiting team's win-loss record entering the upcoming game. |

**Row type:** `WnbaStatsPlayernextngamesRow` (exported from the package root).

### Returns — `wnba_stats_playerprofilev2` / `wnbaStatsPlayerprofilev2`

With `{ parsed: true }`: an object of tables, one per key below.

**`SeasonTotalsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsAllStarSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsAllStarSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonTotalsCollegeSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | character | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `organization_id` | character |  |
| `school_name` | character |  |
| `player_age` | character | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `tov` | character | Turnovers. |
| `pf` | character | Personal fouls. |
| `pts` | character | Points scored. |

**`CareerTotalsCollegeSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | character | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `organization_id` | character |  |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `tov` | character | Turnovers. |
| `pf` | character | Personal fouls. |
| `pts` | character | Points scored. |

**`SeasonTotalsPreseason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | numeric | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`CareerTotalsPreseason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `gs` | integer | Games started. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `tov` | numeric | Turnovers. |
| `pf` | numeric | Personal fouls. |
| `pts` | numeric | Points scored. |

**`SeasonRankingsRegularSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | character | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `rank_pg_min` | integer |  |
| `rank_pg_fgm` | integer |  |
| `rank_pg_fga` | integer |  |
| `rank_fg_pct` | integer |  |
| `rank_pg_fg3_m` | integer |  |
| `rank_pg_fg3_a` | integer |  |
| `rank_fg3_pct` | integer |  |
| `rank_pg_ftm` | integer |  |
| `rank_pg_fta` | integer |  |
| `rank_ft_pct` | integer |  |
| `rank_pg_oreb` | integer |  |
| `rank_pg_dreb` | integer |  |
| `rank_pg_reb` | integer |  |
| `rank_pg_ast` | integer |  |
| `rank_pg_stl` | integer |  |
| `rank_pg_blk` | integer |  |
| `rank_pg_tov` | integer |  |
| `rank_pg_pts` | integer |  |
| `rank_pg_eff` | integer |  |

**`SeasonRankingsPostSeason`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `season_id` | character | Unique season identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `player_age` | character | NBA or WNBA Stats value for player age in the playerprofilev2 result set. |
| `gp` | character | Games played. |
| `gs` | character | Games started. |
| `rank_pg_min` | integer |  |
| `rank_pg_fgm` | integer |  |
| `rank_pg_fga` | integer |  |
| `rank_fg_pct` | integer |  |
| `rank_pg_fg3_m` | integer |  |
| `rank_pg_fg3_a` | integer |  |
| `rank_fg3_pct` | integer |  |
| `rank_pg_ftm` | integer |  |
| `rank_pg_fta` | integer |  |
| `rank_ft_pct` | integer |  |
| `rank_pg_oreb` | integer |  |
| `rank_pg_dreb` | integer |  |
| `rank_pg_reb` | integer |  |
| `rank_pg_ast` | integer |  |
| `rank_pg_stl` | integer |  |
| `rank_pg_blk` | integer |  |
| `rank_pg_tov` | integer |  |
| `rank_pg_pts` | integer |  |
| `rank_pg_eff` | integer |  |

**`SeasonHighs`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `vs_team_id` | integer |  |
| `vs_team_city` | character |  |
| `vs_team_name` | character |  |
| `vs_team_abbreviation` | character |  |
| `stat` | character | Stat. |
| `stat_value` | integer | Stat value. |
| `stat_order` | integer |  |
| `date_est` | character |  |

**`CareerHighs`**

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `vs_team_id` | integer |  |
| `vs_team_city` | character |  |
| `vs_team_name` | character |  |
| `vs_team_abbreviation` | character |  |
| `stat` | character | Stat. |
| `stat_value` | integer | Stat value. |
| `stat_order` | integer |  |
| `date_est` | character |  |

**`NextGame`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `game_time` | character | Game start time. |
| `location` | character | Filter results by game location. |
| `player_team_id` | integer |  |
| `player_team_city` | character |  |
| `player_team_nickname` | character |  |
| `player_team_abbreviation` | character |  |
| `vs_team_id` | integer |  |
| `vs_team_city` | character |  |
| `vs_team_nickname` | character |  |
| `vs_team_abbreviation` | character |  |

**Row type:** `WnbaStatsPlayerprofilev2Tables`, `WnbaStatsPlayerprofilev2SeasonTotalsRegularSeasonRow`, `WnbaStatsPlayerprofilev2CareerTotalsRegularSeasonRow`, `WnbaStatsPlayerprofilev2SeasonTotalsPostSeasonRow`, `WnbaStatsPlayerprofilev2CareerTotalsPostSeasonRow`, `WnbaStatsPlayerprofilev2SeasonTotalsAllStarSeasonRow`, `WnbaStatsPlayerprofilev2CareerTotalsAllStarSeasonRow`, `WnbaStatsPlayerprofilev2SeasonTotalsCollegeSeasonRow`, `WnbaStatsPlayerprofilev2CareerTotalsCollegeSeasonRow`, `WnbaStatsPlayerprofilev2SeasonTotalsPreseasonRow`, `WnbaStatsPlayerprofilev2CareerTotalsPreseasonRow`, `WnbaStatsPlayerprofilev2SeasonRankingsRegularSeasonRow`, `WnbaStatsPlayerprofilev2SeasonRankingsPostSeasonRow`, `WnbaStatsPlayerprofilev2SeasonHighsRow`, `WnbaStatsPlayerprofilev2CareerHighsRow`, `WnbaStatsPlayerprofilev2NextGameRow` (exported from the package root).

### Returns — `wnba_stats_playervsplayer` / `wnbaStatsPlayervsplayer`

With `{ parsed: true }`: an object of tables, one per key below.

**`Overall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character |  |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`OnOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `vs_player_id` | integer | Stats API player id of the comparison (vs.) player. |
| `vs_player_name` | character | Name of the comparison (vs.) player. |
| `court_status` | character | Whether the split covers minutes with the vs. player on or off the court. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |

**`ShotDistanceOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character |  |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotDistanceOnCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `vs_player_id` | integer | Stats API player id of the comparison (vs.) player. |
| `vs_player_name` | character | Name of the comparison (vs.) player. |
| `court_status` | character | Whether the split covers minutes with the vs. player on or off the court. |
| `group_value` | character |  |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotDistanceOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `vs_player_id` | integer | Stats API player id of the comparison (vs.) player. |
| `vs_player_name` | character | Name of the comparison (vs.) player. |
| `court_status` | character | Whether the split covers minutes with the vs. player on or off the court. |
| `group_value` | character |  |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotAreaOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character |  |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotAreaOnCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `vs_player_id` | integer | Stats API player id of the comparison (vs.) player. |
| `vs_player_name` | character | Name of the comparison (vs.) player. |
| `court_status` | character | Whether the split covers minutes with the vs. player on or off the court. |
| `group_value` | character |  |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotAreaOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `vs_player_id` | integer | Stats API player id of the comparison (vs.) player. |
| `vs_player_name` | character | Name of the comparison (vs.) player. |
| `court_status` | character | Whether the split covers minutes with the vs. player on or off the court. |
| `group_value` | character |  |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`PlayerInfo`**

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `display_first_last` | character |  |
| `display_last_comma_first` | character |  |
| `display_fi_last` | character |  |
| `birthdate` | character |  |
| `school` | character | Player's school / college (when distinct from 'college'). |
| `country` | character | Country (full name or code). |
| `last_affiliation` | character |  |

**`VsPlayerInfo`**

| col_name | type | description |
|---|---|---|
| `person_id` | integer | Unique player identifier (V3 endpoints). |
| `first_name` | character | Player's first name. |
| `last_name` | character | Player's last name. |
| `display_first_last` | character |  |
| `display_last_comma_first` | character |  |
| `display_fi_last` | character |  |
| `birthdate` | character |  |
| `school` | character | Player's school / college (when distinct from 'college'). |
| `country` | character | Country (full name or code). |
| `last_affiliation` | character |  |

**Row type:** `WnbaStatsPlayervsplayerTables`, `WnbaStatsPlayervsplayerOverallRow`, `WnbaStatsPlayervsplayerOnOffCourtRow`, `WnbaStatsPlayervsplayerShotDistanceOverallRow`, `WnbaStatsPlayervsplayerShotDistanceOnCourtRow`, `WnbaStatsPlayervsplayerShotDistanceOffCourtRow`, `WnbaStatsPlayervsplayerShotAreaOverallRow`, `WnbaStatsPlayervsplayerShotAreaOnCourtRow`, `WnbaStatsPlayervsplayerShotAreaOffCourtRow`, `WnbaStatsPlayervsplayerPlayerInfoRow`, `WnbaStatsPlayervsplayerVsPlayerInfoRow` (exported from the package root).

### Returns — `wnba_stats_scheduleleaguev2` / `wnbaStatsScheduleleaguev2`

| col_name | type | description |
|---|---|---|
| `arena_city` | character | City hosting the game's arena. |
| `arena_name` | character | Name of the arena hosting the game. |
| `arena_state` | character | State or province of the game's arena (blank for international sites). |
| `away_team_city` | character | City of the away team. |
| `away_team_id` | integer | stats.nba.com / stats.wnba.com team id of the away team. |
| `away_team_losses` | integer | Away team's losses entering the game. |
| `away_team_name` | character | Away team nickname (e.g. Fever). |
| `away_team_score` | integer | Away team's final score, 0 before the game is played. |
| `away_team_seed` | integer | Away team's playoff seed, 0 outside the postseason. |
| `away_team_slug` | character | URL slug of the away team. |
| `away_team_time` | character | Scheduled tip-off in the away team's local time zone. |
| `away_team_tricode` | character | Three-letter abbreviation of the away team. |
| `away_team_wins` | integer | Away team's wins entering the game. |
| `branch_link` | character | Deep link for the game, blank when not published. |
| `day` | character | Three-letter day of week of the game date. |
| `game_code` | character | Provider game code, ``YYYYMMDD/AWYHOM``. |
| `game_date` | character | Game date as served by the schedule feed (``MM/DD/YYYY HH:MM:SS``). |
| `game_date_est` | character | Game date at midnight Eastern, ISO-8601. |
| `game_date_time_est` | character | Scheduled tip-off in Eastern time, ISO-8601. |
| `game_date_time_utc` | character | Scheduled tip-off in UTC, ISO-8601. The timestamp to reduce to a calendar date. |
| `game_date_utc` | character | Game date at midnight UTC, ISO-8601. |
| `game_id` | character | Unique stats.nba.com / stats.wnba.com game id; its 3rd character encodes the season type. |
| `game_label` | character | Human-readable round or event label (e.g. Preseason, Conf. Finals). |
| `game_sequence` | integer | Ordinal of the game within its date. |
| `game_status` | integer | Game status code: 1 scheduled, 2 in progress, 3 final. |
| `game_status_text` | character | Human-readable game status (e.g. Final, 7:00 pm ET). |
| `game_sub_label` | character | Secondary event label (e.g. NBA Abu Dhabi Game). |
| `game_subtype` | character | Game subtype tag (e.g. Global Games), blank for standard games. |
| `game_time_est` | character | Scheduled tip-off time of day, Eastern. |
| `game_time_utc` | character | Scheduled tip-off time of day, UTC. |
| `home_team_city` | character | City of the home team. |
| `home_team_id` | integer | stats.nba.com / stats.wnba.com team id of the home team. |
| `home_team_losses` | integer | Home team's losses entering the game. |
| `home_team_name` | character | Home team nickname (e.g. Liberty). |
| `home_team_score` | integer | Home team's final score, 0 before the game is played. |
| `home_team_seed` | integer | Home team's playoff seed, 0 outside the postseason. |
| `home_team_slug` | character | URL slug of the home team. |
| `home_team_time` | character | Scheduled tip-off in the home team's local time zone. |
| `home_team_tricode` | character | Three-letter abbreviation of the home team. |
| `home_team_wins` | integer | Home team's wins entering the game. |
| `if_necessary` | logical | Whether the game is a conditional series game that may not be played. |
| `is_neutral` | logical | Whether the game is played at a neutral site. |
| `league_id` | character | League id of the schedule: '00' NBA, '10' WNBA, '20' G-League. |
| `month_num` | integer | Calendar month number of the game date. |
| `postponed_status` | character | Postponement status; 'N' when the game is on as scheduled. |
| `season` | character | Season the schedule covers, as published by the feed ('2025-26' for the NBA, '2026' for the WNBA). |
| `season_type_description` | character | Season type label derived from season_type_id: Pre-Season, Regular Season, All-Star, Playoffs, Play-In Game. |
| `season_type_id` | character | Season type digit, the 3rd character of game_id. |
| `series_game_number` | character | Game number within a playoff series, blank outside a series. |
| `series_text` | character | Series context line (e.g. series tied 1-1), blank when not applicable. |
| `week_name` | character | Name of the schedule week, blank outside the regular season. |
| `week_number` | integer | Schedule week number, 0 outside the regular season. |

**Row type:** `WnbaStatsScheduleleaguev2Row` (exported from the package root).

### Returns — `wnba_stats_scheduleleaguev2int` / `wnbaStatsScheduleleaguev2int`

| col_name | type | description |
|---|---|---|
| `arena_city` | character | City hosting the game's arena. |
| `arena_name` | character | Name of the arena hosting the game. |
| `arena_state` | character | State or province of the game's arena (blank for international sites). |
| `away_team_city` | character | City of the away team. |
| `away_team_id` | integer | stats.nba.com / stats.wnba.com team id of the away team. |
| `away_team_losses` | integer | Away team's losses entering the game. |
| `away_team_name` | character | Away team nickname (e.g. Fever). |
| `away_team_score` | integer | Away team's final score, 0 before the game is played. |
| `away_team_seed` | integer | Away team's playoff seed, 0 outside the postseason. |
| `away_team_slug` | character | URL slug of the away team. |
| `away_team_time` | character | Scheduled tip-off in the away team's local time zone. |
| `away_team_tricode` | character | Three-letter abbreviation of the away team. |
| `away_team_wins` | integer | Away team's wins entering the game. |
| `branch_link` | character | Deep link for the game, blank when not published. |
| `day` | character | Three-letter day of week of the game date. |
| `game_code` | character | Provider game code, ``YYYYMMDD/AWYHOM``. |
| `game_date` | character | Game date as served by the schedule feed (``MM/DD/YYYY HH:MM:SS``). |
| `game_date_est` | character | Game date at midnight Eastern, ISO-8601. |
| `game_date_time_est` | character | Scheduled tip-off in Eastern time, ISO-8601. |
| `game_date_time_utc` | character | Scheduled tip-off in UTC, ISO-8601. The timestamp to reduce to a calendar date. |
| `game_date_utc` | character | Game date at midnight UTC, ISO-8601. |
| `game_id` | character | Unique stats.nba.com / stats.wnba.com game id; its 3rd character encodes the season type. |
| `game_label` | character | Human-readable round or event label (e.g. Preseason, Conf. Finals). |
| `game_sequence` | integer | Ordinal of the game within its date. |
| `game_status` | integer | Game status code: 1 scheduled, 2 in progress, 3 final. |
| `game_status_text` | character | Human-readable game status (e.g. Final, 7:00 pm ET). |
| `game_sub_label` | character | Secondary event label (e.g. NBA Abu Dhabi Game). |
| `game_subtype` | character | Game subtype tag (e.g. Global Games), blank for standard games. |
| `game_time_est` | character | Scheduled tip-off time of day, Eastern. |
| `game_time_utc` | character | Scheduled tip-off time of day, UTC. |
| `home_team_city` | character | City of the home team. |
| `home_team_id` | integer | stats.nba.com / stats.wnba.com team id of the home team. |
| `home_team_losses` | integer | Home team's losses entering the game. |
| `home_team_name` | character | Home team nickname (e.g. Liberty). |
| `home_team_score` | integer | Home team's final score, 0 before the game is played. |
| `home_team_seed` | integer | Home team's playoff seed, 0 outside the postseason. |
| `home_team_slug` | character | URL slug of the home team. |
| `home_team_time` | character | Scheduled tip-off in the home team's local time zone. |
| `home_team_tricode` | character | Three-letter abbreviation of the home team. |
| `home_team_wins` | integer | Home team's wins entering the game. |
| `if_necessary` | character | Whether the game is a conditional series game that may not be played. |
| `is_neutral` | logical | Whether the game is played at a neutral site. |
| `league_id` | character | League id of the schedule: '00' NBA, '10' WNBA, '20' G-League. |
| `month_num` | integer | Calendar month number of the game date. |
| `postponed_status` | character | Postponement status; 'N' when the game is on as scheduled. |
| `season` | character | Season the schedule covers, as published by the feed ('2025-26' for the NBA, '2026' for the WNBA). |
| `season_type_description` | character | Season type label derived from season_type_id: Pre-Season, Regular Season, All-Star, Playoffs, Play-In Game. |
| `season_type_id` | character | Season type digit, the 3rd character of game_id. |
| `series_game_number` | character | Game number within a playoff series, blank outside a series. |
| `series_text` | character | Series context line (e.g. series tied 1-1), blank when not applicable. |
| `week_name` | character | Name of the schedule week, blank outside the regular season. |
| `week_number` | integer | Schedule week number, 0 outside the regular season. |

**Row type:** `WnbaStatsScheduleleaguev2intRow` (exported from the package root).

### Returns — `wnba_stats_scoreboardv2` / `wnbaStatsScoreboardv2`

With `{ parsed: true }`: an object of tables, one per key below.

**`GameHeader`**

| col_name | type | description |
|---|---|---|
| `game_date_est` | character | Game date est. |
| `game_sequence` | integer | Game sequence. |
| `game_id` | character | Unique game identifier. |
| `game_status_id` | integer | Numeric game status identifier. |
| `game_status_text` | character | Game status display text (e.g. 'Final', '4:32 - 4th'). |
| `gamecode` | character | Gamecode. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `season` | character | Season identifier (4-digit year or 'YYYY-YY' string). |
| `live_period` | integer | Live period. |
| `live_pc_time` | character | Time / clock value. |
| `natl_tv_broadcaster_abbreviation` | character | Natl tv broadcaster abbreviation. |
| `home_tv_broadcaster_abbreviation` | character | Home team's tv broadcaster abbreviation. |
| `away_tv_broadcaster_abbreviation` | character | Away team's tv broadcaster abbreviation. |
| `live_period_time_bcast` | character | Live period time bcast. |
| `arena_name` | character | Arena name. |
| `wh_status` | integer | Wh status. |
| `wnba_commissioner_flag` | integer |  |

**`LineScore`**

| col_name | type | description |
|---|---|---|
| `game_date_est` | character | Game date est. |
| `game_sequence` | integer | Game sequence. |
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_city_name` | character | Team city name. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_wins_losses` | character | Team wins losses. |
| `pts_qtr1` | integer | Pts qtr1. |
| `pts_qtr2` | integer | Pts qtr2. |
| `pts_qtr3` | integer | Pts qtr3. |
| `pts_qtr4` | integer | Pts qtr4. |
| `pts_ot1` | integer | Pts ot1. |
| `pts_ot2` | integer | Points scored by the team in overtime period 2. |
| `pts_ot3` | integer | Points scored by the team in overtime period 3. |
| `pts_ot4` | integer | Points scored by the team in overtime period 4. |
| `pts_ot5` | integer | Points scored by the team in overtime period 5. |
| `pts_ot6` | integer | Points scored by the team in overtime period 6. |
| `pts_ot7` | integer | Points scored by the team in overtime period 7. |
| `pts_ot8` | integer | Points scored by the team in overtime period 8. |
| `pts_ot9` | integer | Points scored by the team in overtime period 9. |
| `pts_ot10` | integer | Points scored by the team in overtime period 10. |
| `pts` | integer | Points scored. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ast` | integer | Assists. |
| `reb` | integer | Total rebounds. |
| `tov` | integer | Turnovers. |

**`SeriesStandings`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `game_date_est` | character | Game date est. |
| `home_team_wins` | integer | Home team's team wins. |
| `home_team_losses` | integer | Home team's team losses. |
| `series_leader` | character |  |

**`LastMeeting`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `last_game_id` | character |  |
| `last_game_date_est` | character |  |
| `last_game_home_team_id` | integer |  |
| `last_game_home_team_city` | character |  |
| `last_game_home_team_name` | character |  |
| `last_game_home_team_abbreviation` | character |  |
| `last_game_home_team_points` | integer |  |
| `last_game_visitor_team_id` | integer |  |
| `last_game_visitor_team_city` | character |  |
| `last_game_visitor_team_name` | character |  |
| `last_game_visitor_team_city1` | character |  |
| `last_game_visitor_team_points` | integer |  |

**`EastConfStandingsByDay`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `season_id` | character | Unique season identifier. |
| `standingsdate` | character |  |
| `conference` | character | Filter players or teams by conference. |
| `team` | character | Team-side label or team identifier. |
| `g` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `home_record` | character | Home win-loss record. |
| `road_record` | character | Win-loss record for road. |

**`WestConfStandingsByDay`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `league_id` | character | League identifier ('10' = WNBA). |
| `season_id` | character | Unique season identifier. |
| `standingsdate` | character |  |
| `conference` | character | Filter players or teams by conference. |
| `team` | character | Team-side label or team identifier. |
| `g` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `home_record` | character | Home win-loss record. |
| `road_record` | character | Win-loss record for road. |

**`Available`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `pt_available` | integer | Pt available. |

**`TeamLeaders`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_nickname` | character | Team nickname. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `pts_player_id` | integer |  |
| `pts_player_name` | character |  |
| `pts` | integer | Points scored. |
| `reb_player_id` | integer |  |
| `reb_player_name` | character |  |
| `reb` | integer | Total rebounds. |
| `ast_player_id` | integer |  |
| `ast_player_name` | character |  |
| `ast` | integer | Assists. |

**`TicketLinks`**

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `leag_tix` | character |  |

**`WinProbability`** — no columns in the reference capture


**Row type:** `WnbaStatsScoreboardv2Tables`, `WnbaStatsScoreboardv2GameHeaderRow`, `WnbaStatsScoreboardv2LineScoreRow`, `WnbaStatsScoreboardv2SeriesStandingsRow`, `WnbaStatsScoreboardv2LastMeetingRow`, `WnbaStatsScoreboardv2EastConfStandingsByDayRow`, `WnbaStatsScoreboardv2WestConfStandingsByDayRow`, `WnbaStatsScoreboardv2AvailableRow`, `WnbaStatsScoreboardv2TeamLeadersRow`, `WnbaStatsScoreboardv2TicketLinksRow`, `WnbaStatsScoreboardv2WinProbabilityRow` (exported from the package root).

### Returns — `wnba_stats_scoreboardv3` / `wnbaStatsScoreboardv3`

| col_name | type | description |
|---|---|---|
| `awayteam_inbonus` | character | Whether the away team is currently in the bonus (penalty) foul situation. |
| `awayteam_losses` | integer | Away team's loss total entering the game. |
| `awayteam_score` | integer | Current or final points scored by the away team. |
| `awayteam_seed` | integer | Playoff seed of the away team, populated for postseason games. |
| `awayteam_teamcity` | character | City name of the away team. |
| `awayteam_teamid` | integer | Team identifier of the away team from the league's stats API. |
| `awayteam_teamname` | character | Nickname of the away team. |
| `awayteam_teamslug` | character | URL-friendly slug for the away team's name. |
| `awayteam_teamtricode` | character | Three-letter abbreviation of the away team. |
| `awayteam_timeoutsremaining` | integer | Timeouts the away team has remaining. |
| `awayteam_wins` | integer | Away team's win total entering the game. |
| `gameclock` | character | Current game clock display for a live game. |
| `gamecode` | character | Gamecode. |
| `gamedate` | character |  |
| `gameet` | character | Scheduled game start time in US Eastern time. |
| `gameid` | character | Unique 10-character game identifier from the league's stats API. |
| `gamelabel` | character | Display label for the game (e.g. a playoff series or event name). |
| `gameleaders_awayleaders_assists` | integer | Assist total of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_jerseynum` | character | Jersey number of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_name` | character | Name of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_personid` | integer | Stats API player id of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_playerslug` | character | URL name slug of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_points` | integer | Point total of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_position` | character | Position of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_rebounds` | integer | Rebound total of the away team's in-game statistical leader. |
| `gameleaders_awayleaders_teamtricode` | character | Team tricode of the away team's in-game statistical leader. |
| `gameleaders_homeleaders_assists` | integer | Assist total of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_jerseynum` | character | Jersey number of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_name` | character | Name of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_personid` | integer | Stats API player id of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_playerslug` | character | URL name slug of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_points` | integer | Point total of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_position` | character | Position of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_rebounds` | integer | Rebound total of the home team's in-game statistical leader. |
| `gameleaders_homeleaders_teamtricode` | character | Team tricode of the home team's in-game statistical leader. |
| `gamestatus` | integer | Numeric game status code (1 = scheduled, 2 = in progress, 3 = final). |
| `gamestatustext` | character | Human-readable game status (e.g. "Final", "7:00 pm ET"). |
| `gamesublabel` | character | Secondary display label for the game (e.g. game number within a series). |
| `gamesubtype` | character | Subtype code for the game as reported by the stats API (e.g. in-season tournament flags). |
| `gametimeutc` | character | Scheduled game start time in UTC. |
| `hometeam_inbonus` | character | Whether the home team is currently in the bonus (penalty) foul situation. |
| `hometeam_losses` | integer | Home team's loss total entering the game. |
| `hometeam_score` | integer | Current or final points scored by the home team. |
| `hometeam_seed` | integer | Playoff seed of the home team, populated for postseason games. |
| `hometeam_teamcity` | character | City name of the home team. |
| `hometeam_teamid` | integer | Team identifier of the home team from the league's stats API. |
| `hometeam_teamname` | character | Nickname of the home team. |
| `hometeam_teamslug` | character | URL-friendly slug for the home team's name. |
| `hometeam_teamtricode` | character | Three-letter abbreviation of the home team. |
| `hometeam_timeoutsremaining` | integer | Timeouts the home team has remaining. |
| `hometeam_wins` | integer | Home team's win total entering the game. |
| `ifnecessary` | logical | Whether the game is an if-necessary playoff series game. |
| `isneutral` | logical | Whether the game is played at a neutral site. |
| `leagueid` | character | League identifier from the stats API ("00" = NBA, "10" = WNBA). |
| `leaguename` | character | Display name of the league. |
| `period` | integer | Period of the game (1-4 quarters; 5+ for OT). |
| `porounddesc` | character | Playoff round description (e.g. Conference Finals). |
| `regulationperiods` | integer | Number of regulation periods for the game (4). |
| `seriesconference` | character | Conference of the playoff series the game belongs to. |
| `seriesgamenumber` | character | Game number within the playoff series. |
| `seriestext` | character | Display text summarizing the series state (e.g. "BOS leads 2-1"). |
| `teamleaders_awayleaders_assists` | numeric | Assist total of the away team's season statistical leader. |
| `teamleaders_awayleaders_jerseynum` | character | Jersey number of the away team's season statistical leader. |
| `teamleaders_awayleaders_name` | character | Name of the away team's season statistical leader. |
| `teamleaders_awayleaders_personid` | integer | Stats API player id of the away team's season statistical leader. |
| `teamleaders_awayleaders_playerslug` | character | URL name slug of the away team's season statistical leader. |
| `teamleaders_awayleaders_points` | numeric | Point total of the away team's season statistical leader. |
| `teamleaders_awayleaders_position` | character | Position of the away team's season statistical leader. |
| `teamleaders_awayleaders_rebounds` | numeric | Rebound total of the away team's season statistical leader. |
| `teamleaders_awayleaders_teamtricode` | character | Team tricode of the away team's season statistical leader. |
| `teamleaders_homeleaders_assists` | numeric | Assist total of the home team's season statistical leader. |
| `teamleaders_homeleaders_jerseynum` | character | Jersey number of the home team's season statistical leader. |
| `teamleaders_homeleaders_name` | character | Name of the home team's season statistical leader. |
| `teamleaders_homeleaders_personid` | integer | Stats API player id of the home team's season statistical leader. |
| `teamleaders_homeleaders_playerslug` | character | URL name slug of the home team's season statistical leader. |
| `teamleaders_homeleaders_points` | numeric | Point total of the home team's season statistical leader. |
| `teamleaders_homeleaders_position` | character | Position of the home team's season statistical leader. |
| `teamleaders_homeleaders_rebounds` | numeric | Rebound total of the home team's season statistical leader. |
| `teamleaders_homeleaders_teamtricode` | character | Team tricode of the home team's season statistical leader. |
| `teamleaders_seasonleadersflag` | integer | Flag indicating the team-leaders block carries season-long leaders rather than in-game leaders. |

**Row type:** `WnbaStatsScoreboardv3Row` (exported from the package root).

### Returns — `wnba_stats_shotchartdetail` / `wnbaStatsShotchartdetail`

With `{ parsed: true }`: an object of tables, one per key below.

**`Shot_Chart_Detail`**

| col_name | type | description |
|---|---|---|
| `grid_type` | character | Shot chart grid type label returned by the stats API (e.g. "Shot Chart Detail"). |
| `game_id` | character | Unique game identifier. |
| `game_event_id` | character | Unique identifier for game event. |
| `player_id` | character | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | character | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `period` | character | Period of the game (1-4 quarters; 5+ for OT). |
| `minutes_remaining` | character | Minutes remaining. |
| `seconds_remaining` | character | Seconds remaining in the period. |
| `event_type` | character | Event / play type code (V2 PBP). |
| `action_type` | character | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `shot_type` | character | Shot type label (e.g. 'Jump Shot', 'Layup'). |
| `shot_zone_basic` | character | Shot zone (e.g. 'Restricted Area', 'Mid-Range', 'Above the Break 3'). |
| `shot_zone_area` | character | Shot zone area ('Left Side', 'Right Side', 'Center'). |
| `shot_zone_range` | character | Shot zone range ('Less Than 8 ft.', '8-16 ft.', '16-24 ft.', etc.). |
| `shot_distance` | character | Shot distance from the basket, in feet. |
| `loc_x` | character | X coordinate on the court (units of inches; 0 = basket center). |
| `loc_y` | character | Y coordinate on the court (units of inches; baseline at 0). |
| `shot_attempted_flag` | character | 1 if a shot was attempted on this event. |
| `shot_made_flag` | character | 1 if the shot was made; 0 if missed. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `htm` | character | Home team abbreviation for the game. |
| `vtm` | character | Visiting team abbreviation for the game. |

**`LeagueAverages`**

| col_name | type | description |
|---|---|---|
| `grid_type` | character | Shot chart grid type label returned by the stats API (e.g. "Shot Chart Detail"). |
| `shot_zone_basic` | character | Shot zone (e.g. 'Restricted Area', 'Mid-Range', 'Above the Break 3'). |
| `shot_zone_area` | character | Shot zone area ('Left Side', 'Right Side', 'Center'). |
| `shot_zone_range` | character | Shot zone range ('Less Than 8 ft.', '8-16 ft.', '16-24 ft.', etc.). |
| `fga` | integer | Field goal attempts. |
| `fgm` | integer | Field goals made. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**Row type:** `WnbaStatsShotchartdetailTables`, `WnbaStatsShotchartdetailShotChartDetailRow`, `WnbaStatsShotchartdetailLeagueAveragesRow` (exported from the package root).

### Returns — `wnba_stats_shotchartleaguewide` / `wnbaStatsShotchartleaguewide`

| col_name | type | description |
|---|---|---|
| `grid_type` | character | NBA or WNBA Stats value for grid type in the shotchartleaguewide result set. |
| `shot_zone_basic` | character | Shot zone (e.g. 'Restricted Area', 'Mid-Range', 'Above the Break 3'). |
| `shot_zone_area` | character | Shot zone area ('Left Side', 'Right Side', 'Center'). |
| `shot_zone_range` | character | Shot zone range ('Less Than 8 ft.', '8-16 ft.', '16-24 ft.', etc.). |
| `fga` | integer | Field goal attempts. |
| `fgm` | integer | Field goals made. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**Row type:** `WnbaStatsShotchartleaguewideRow` (exported from the package root).

### Returns — `wnba_stats_shotchartlineupdetail` / `wnbaStatsShotchartlineupdetail`

With `{ parsed: true }`: an object of tables, one per key below.

**`ShotChartLineupDetail`**

| col_name | type | description |
|---|---|---|
| `grid_type` | character | Shot chart grid type label returned by the stats API (e.g. "Shot Chart Detail"). |
| `game_id` | character | Unique game identifier. |
| `game_event_id` | character | Unique identifier for game event. |
| `group_id` | character | ESPN group id. |
| `group_name` | character |  |
| `player_id` | character | Unique player identifier. |
| `player_name` | character | Player name. |
| `team_id` | character | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `period` | character | Period of the game (1-4 quarters; 5+ for OT). |
| `minutes_remaining` | character | Minutes remaining. |
| `seconds_remaining` | character | Seconds remaining in the period. |
| `event_type` | character | Event / play type code (V2 PBP). |
| `action_type` | character | Action type label (e.g. 'Made Shot', 'Substitution'). |
| `shot_type` | character | Shot type label (e.g. 'Jump Shot', 'Layup'). |
| `shot_zone_basic` | character | Shot zone (e.g. 'Restricted Area', 'Mid-Range', 'Above the Break 3'). |
| `shot_zone_area` | character | Shot zone area ('Left Side', 'Right Side', 'Center'). |
| `shot_zone_range` | character | Shot zone range ('Less Than 8 ft.', '8-16 ft.', '16-24 ft.', etc.). |
| `shot_distance` | character | Shot distance from the basket, in feet. |
| `loc_x` | character | X coordinate on the court (units of inches; 0 = basket center). |
| `loc_y` | character | Y coordinate on the court (units of inches; baseline at 0). |
| `shot_attempted_flag` | character | 1 if a shot was attempted on this event. |
| `shot_made_flag` | character | 1 if the shot was made; 0 if missed. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `htm` | character | Home team abbreviation for the game. |
| `vtm` | character | Visiting team abbreviation for the game. |

**`ShotChartLineupLeagueAverage`**

| col_name | type | description |
|---|---|---|
| `grid_type` | character | Shot chart grid type label returned by the stats API (e.g. "Shot Chart Detail"). |
| `shot_zone_basic` | character | Shot zone (e.g. 'Restricted Area', 'Mid-Range', 'Above the Break 3'). |
| `shot_zone_area` | character | Shot zone area ('Left Side', 'Right Side', 'Center'). |
| `shot_zone_range` | character | Shot zone range ('Less Than 8 ft.', '8-16 ft.', '16-24 ft.', etc.). |
| `fga` | integer | Field goal attempts. |
| `fgm` | integer | Field goals made. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**Row type:** `WnbaStatsShotchartlineupdetailTables`, `WnbaStatsShotchartlineupdetailShotChartLineupDetailRow`, `WnbaStatsShotchartlineupdetailShotChartLineupLeagueAverageRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbyclutch` / `wnbaStatsTeamdashboardbyclutch`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last5Min5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last3Min5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last1Min5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last30Sec3PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last10Sec3PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last5MinPlusMinus5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last3MinPlusMinus5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last1MinPlusMinus5PointTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last30Sec3Point2TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last10Sec3Point2TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbyclutchTables`, `WnbaStatsTeamdashboardbyclutchOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast5Min5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast3Min5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast1Min5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast30Sec3PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast10Sec3PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast5MinPlusMinus5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast3MinPlusMinus5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast1MinPlusMinus5PointTeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast30Sec3Point2TeamDashboardRow`, `WnbaStatsTeamdashboardbyclutchLast10Sec3Point2TeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbygamesplits` / `wnbaStatsTeamdashboardbygamesplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ByHalfTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ByPeriodTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | integer | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ByScoreMarginTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ByActualMarginTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbygamesplitsTables`, `WnbaStatsTeamdashboardbygamesplitsOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbygamesplitsByHalfTeamDashboardRow`, `WnbaStatsTeamdashboardbygamesplitsByPeriodTeamDashboardRow`, `WnbaStatsTeamdashboardbygamesplitsByScoreMarginTeamDashboardRow`, `WnbaStatsTeamdashboardbygamesplitsByActualMarginTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbygeneralsplits` / `wnbaStatsTeamdashboardbygeneralsplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`LocationTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_game_location` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`WinsLossesTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `game_result` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`MonthTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `season_month_name` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`PrePostAllStarTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `season_segment` | character | Season segment filter ('Pre All-Star' / 'Post All-Star'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`DaysRestTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_days_rest_range` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsTeamdashboardbygeneralsplitsTables`, `WnbaStatsTeamdashboardbygeneralsplitsOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbygeneralsplitsLocationTeamDashboardRow`, `WnbaStatsTeamdashboardbygeneralsplitsWinsLossesTeamDashboardRow`, `WnbaStatsTeamdashboardbygeneralsplitsMonthTeamDashboardRow`, `WnbaStatsTeamdashboardbygeneralsplitsPrePostAllStarTeamDashboardRow`, `WnbaStatsTeamdashboardbygeneralsplitsDaysRestTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbylastngames` / `wnbaStatsTeamdashboardbylastngames`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last5TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last10TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last15TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`Last20TeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`GameNumberTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbylastngamesTables`, `WnbaStatsTeamdashboardbylastngamesOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbylastngamesLast5TeamDashboardRow`, `WnbaStatsTeamdashboardbylastngamesLast10TeamDashboardRow`, `WnbaStatsTeamdashboardbylastngamesLast15TeamDashboardRow`, `WnbaStatsTeamdashboardbylastngamesLast20TeamDashboardRow`, `WnbaStatsTeamdashboardbylastngamesGameNumberTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbyopponent` / `wnbaStatsTeamdashboardbyopponent`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ConferenceTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`DivisionTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`OpponentTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbyopponentTables`, `WnbaStatsTeamdashboardbyopponentOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbyopponentConferenceTeamDashboardRow`, `WnbaStatsTeamdashboardbyopponentDivisionTeamDashboardRow`, `WnbaStatsTeamdashboardbyopponentOpponentTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbyshootingsplits` / `wnbaStatsTeamdashboardbyshootingsplits`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`Shot5FTTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`Shot8FTTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`ShotAreaTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`AssitedShotTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`ShotTypeTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`AssistedBy`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `efg_pct` | numeric | Percentage or rate for efg percentage in the requested NBA or WNBA Stats split. |
| `blka` | integer | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pct_ast_2_pm` | numeric | Percentage share of assists 2pm for the requested NBA or WNBA Stats split. |
| `pct_uast_2_pm` | numeric | Percentage share of uast 2pm for the requested NBA or WNBA Stats split. |
| `pct_ast_3_pm` | numeric | Percentage share of assists 3pm for the requested NBA or WNBA Stats split. |
| `pct_uast_3_pm` | numeric | Percentage share of uast 3pm for the requested NBA or WNBA Stats split. |
| `pct_ast_fgm` | numeric | Percentage share of assists fgm for the requested NBA or WNBA Stats split. |
| `pct_uast_fgm` | numeric | Percentage share of uast fgm for the requested NBA or WNBA Stats split. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `efg_pct_rank` | integer | Rank for effective field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_2_pm_rank` | integer | Rank for percentage assists 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_2_pm_rank` | integer | Rank for percentage uast 2pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_3_pm_rank` | integer | Rank for percentage assists 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_3_pm_rank` | integer | Rank for percentage uast 3pm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_ast_fgm_rank` | integer | Rank for percentage assists fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pct_uast_fgm_rank` | integer | Rank for percentage uast fgm within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsTeamdashboardbyshootingsplitsTables`, `WnbaStatsTeamdashboardbyshootingsplitsOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsShot5FTTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsShot8FTTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsShotAreaTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsAssitedShotTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsShotTypeTeamDashboardRow`, `WnbaStatsTeamdashboardbyshootingsplitsAssistedByRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbyteamperformance` / `wnbaStatsTeamdashboardbyteamperformance`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ScoreDifferentialTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value_order` | integer | Sort order of the split value within its group. |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `group_value_2` | character | Secondary split value for the row when the group uses two dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`PointsScoredTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value_order` | integer | Sort order of the split value within its group. |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `group_value_2` | character | Secondary split value for the row when the group uses two dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`PontsAgainstTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value_order` | integer | Sort order of the split value within its group. |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `group_value_2` | character | Secondary split value for the row when the group uses two dimensions. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbyteamperformanceTables`, `WnbaStatsTeamdashboardbyteamperformanceOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbyteamperformanceScoreDifferentialTeamDashboardRow`, `WnbaStatsTeamdashboardbyteamperformancePointsScoredTeamDashboardRow`, `WnbaStatsTeamdashboardbyteamperformancePontsAgainstTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashboardbyyearoveryear` / `wnbaStatsTeamdashboardbyyearoveryear`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ByYearTeamDashboard`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**Row type:** `WnbaStatsTeamdashboardbyyearoveryearTables`, `WnbaStatsTeamdashboardbyyearoveryearOverallTeamDashboardRow`, `WnbaStatsTeamdashboardbyyearoveryearByYearTeamDashboardRow` (exported from the package root).

### Returns — `wnba_stats_teamdashlineups` / `wnbaStatsTeamdashlineups`

With `{ parsed: true }`: an object of tables, one per key below.

**`Overall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`Lineups`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_id` | character | ESPN group id. |
| `group_name` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `sum_time_played` | integer |  |

**Row type:** `WnbaStatsTeamdashlineupsTables`, `WnbaStatsTeamdashlineupsOverallRow`, `WnbaStatsTeamdashlineupsLineupsRow` (exported from the package root).

### Returns — `wnba_stats_teamdetails` / `wnbaStatsTeamdetails`

With `{ parsed: true }`: an object of tables, one per key below.

**`TeamBackground`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `abbreviation` | character | Short abbreviation. |
| `nickname` | character | Team or athlete nickname. |
| `yearfounded` | integer | Year the franchise was founded. |
| `city` | character | Venue city. |
| `arena` | character | Arena. |
| `arenacapacity` | character | Seating capacity of the team's home arena. |
| `owner` | character | Name of the team's owner or ownership group. |
| `generalmanager` | character | Name of the team's general manager. |
| `headcoach` | character | Name of the team's head coach. |
| `dleagueaffiliation` | character | Name of the team's G League (formerly D-League) affiliate. |

**`TeamHistory`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `city` | character | Venue city. |
| `nickname` | character | Team or athlete nickname. |
| `yearfounded` | integer | Year the franchise was founded. |
| `yearactivetill` | integer |  |

**`TeamSocialSites`**

| col_name | type | description |
|---|---|---|
| `accounttype` | character |  |
| `website_link` | character |  |

**`TeamAwardsChampionships`**

| col_name | type | description |
|---|---|---|
| `yearawarded` | integer |  |
| `oppositeteam` | character |  |

**`TeamAwardsConf`**

| col_name | type | description |
|---|---|---|
| `yearawarded` | integer |  |
| `oppositeteam` | character |  |

**`TeamAwardsDiv`**

| col_name | type | description |
|---|---|---|
| `yearawarded` | integer |  |
| `oppositeteam` | character |  |

**`TeamHof`**

| col_name | type | description |
|---|---|---|
| `playerid` | integer | Playerid. |
| `player` | character | Player name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `jersey` | character | Jersey number worn by the player. |
| `seasonswithteam` | character |  |
| `year` | integer | 4-digit year. |

**`TeamRetired`**

| col_name | type | description |
|---|---|---|
| `playerid` | integer | Playerid. |
| `player` | character | Player name. |
| `position` | character | Listed roster position (G, F, C, etc.). |
| `jersey` | character | Jersey number worn by the player. |
| `seasonswithteam` | character |  |
| `year` | integer | 4-digit year. |

**`TeamAwardsCommCup`**

| col_name | type | description |
|---|---|---|
| `yearawarded` | integer |  |
| `oppositeteam` | character |  |

**Row type:** `WnbaStatsTeamdetailsTables`, `WnbaStatsTeamdetailsTeamBackgroundRow`, `WnbaStatsTeamdetailsTeamHistoryRow`, `WnbaStatsTeamdetailsTeamSocialSitesRow`, `WnbaStatsTeamdetailsTeamAwardsChampionshipsRow`, `WnbaStatsTeamdetailsTeamAwardsConfRow`, `WnbaStatsTeamdetailsTeamAwardsDivRow`, `WnbaStatsTeamdetailsTeamHofRow`, `WnbaStatsTeamdetailsTeamRetiredRow`, `WnbaStatsTeamdetailsTeamAwardsCommCupRow` (exported from the package root).

### Returns — `wnba_stats_teamestimatedmetrics` / `wnbaStatsTeamestimatedmetrics`

| col_name | type | description |
|---|---|---|
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_id` | integer | Unique team identifier. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `e_off_rating` | numeric | Estimated offensive rating for the requested NBA or WNBA Stats split. |
| `e_def_rating` | numeric | Estimated defensive rating for the requested NBA or WNBA Stats split. |
| `e_net_rating` | numeric | Estimated net rating for the requested NBA or WNBA Stats split. |
| `e_pace` | numeric | Estimated pace for the requested NBA or WNBA Stats split. |
| `e_ast_ratio` | numeric | Estimated assist ratio for the requested NBA or WNBA Stats split. |
| `e_oreb_pct` | numeric | Estimated offensive rebound percentage for the requested NBA or WNBA Stats split. |
| `e_dreb_pct` | numeric | Estimated defensive rebound percentage for the requested NBA or WNBA Stats split. |
| `e_reb_pct` | numeric | Estimated rebound percentage for the requested NBA or WNBA Stats split. |
| `e_tm_tov_pct` | numeric | Estimated team turnover percentage for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_off_rating_rank` | integer | Rank for e offensive rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_def_rating_rank` | integer | Rank for e defensive rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_net_rating_rank` | integer | Rank for e net rating within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_ast_ratio_rank` | integer | Rank for e assists ratio within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_oreb_pct_rank` | integer | Rank for e offensive rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_dreb_pct_rank` | integer | Rank for e defensive rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_reb_pct_rank` | integer | Rank for e rebounds percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_tm_tov_pct_rank` | integer | Rank for e team turnovers percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `e_pace_rank` | integer | Rank for e pace within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsTeamestimatedmetricsRow` (exported from the package root).

### Returns — `wnba_stats_teamgamelog` / `wnbaStatsTeamgamelog`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | integer | Minutes played. |
| `fgm` | integer | Field goals made. |
| `fga` | integer | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | integer | Three-point field goals made. |
| `fg3_a` | integer | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | integer | Free throws made. |
| `fta` | integer | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | integer | Offensive rebounds. |
| `dreb` | integer | Defensive rebounds. |
| `reb` | integer | Total rebounds. |
| `ast` | integer | Assists. |
| `stl` | integer | Steals. |
| `blk` | integer | Blocks. |
| `tov` | integer | Turnovers. |
| `pf` | integer | Personal fouls. |
| `pts` | integer | Points scored. |

**Row type:** `WnbaStatsTeamgamelogRow` (exported from the package root).

### Returns — `wnba_stats_teamgamelogs` / `wnbaStatsTeamgamelogs`

| col_name | type | description |
|---|---|---|
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `matchup` | character | Matchup. |
| `wl` | character | Wl. |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `available_flag` | integer | Flag indicating whether the requested NBA or WNBA Stats video or data asset is available. |

**Row type:** `WnbaStatsTeamgamelogsRow` (exported from the package root).

### Returns — `wnba_stats_teaminfocommon` / `wnbaStatsTeaminfocommon`

With `{ parsed: true }`: an object of tables, one per key below.

**`TeamInfoCommon`**

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `season_year` | character | Season year string ('YYYY-YY' format). |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_conference` | character | Conference the team belongs to. |
| `team_division` | character | Division the team belongs to. |
| `team_code` | character |  |
| `team_slug` | character | URL-safe team identifier (e.g. 'lasvegas-aces' / 'aces'). |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `pct` | numeric | Win percentage. |
| `conf_rank` | integer | Team's current rank within its conference. |
| `div_rank` | integer | Team's current rank within its division. |
| `min_year` | character | Minimum year queried (echoes `min_year`). |
| `max_year` | character | Maximum year queried (echoes `max_year`). |

**`TeamSeasonRanks`**

| col_name | type | description |
|---|---|---|
| `league_id` | character | League identifier ('10' = WNBA). |
| `season_id` | character | Unique season identifier. |
| `team_id` | integer | Unique team identifier. |
| `pts_rank` | integer |  |
| `pts_pg` | numeric |  |
| `reb_rank` | integer |  |
| `reb_pg` | numeric |  |
| `ast_rank` | integer |  |
| `ast_pg` | numeric |  |
| `opp_pts_rank` | integer |  |
| `opp_pts_pg` | numeric |  |

**`AvailableSeasons`**

| col_name | type | description |
|---|---|---|
| `season_id` | character | Unique season identifier. |

**Row type:** `WnbaStatsTeaminfocommonTables`, `WnbaStatsTeaminfocommonTeamInfoCommonRow`, `WnbaStatsTeaminfocommonTeamSeasonRanksRow`, `WnbaStatsTeaminfocommonAvailableSeasonsRow` (exported from the package root).

### Returns — `wnba_stats_teamplayerdashboard` / `wnbaStatsTeamplayerdashboard`

With `{ parsed: true }`: an object of tables, one per key below.

**`TeamOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `group_value` | character |  |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`PlayersSeasonTotals`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `player_id` | integer | Unique player identifier. |
| `player_name` | character | Player name. |
| `nickname` | character | Team or athlete nickname. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Nba fantasy points for the requested NBA or WNBA Stats split. |
| `dd2` | integer | Double-doubles for the requested NBA or WNBA Stats split. |
| `td3` | integer | Triple-doubles for the requested NBA or WNBA Stats split. |
| `wnba_fantasy_pts` | numeric | Wnba fantasy points for the requested NBA or WNBA Stats split. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `nba_fantasy_pts_rank` | integer | Rank for NBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dd2_rank` | integer | Rank for double-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `td3_rank` | integer | Rank for triple-doubles within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `wnba_fantasy_pts_rank` | integer | Rank for WNBA fantasy points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `team_count` | integer | NBA or WNBA Stats value for team count in the teamplayerdashboard result set. |

**Row type:** `WnbaStatsTeamplayerdashboardTables`, `WnbaStatsTeamplayerdashboardTeamOverallRow`, `WnbaStatsTeamplayerdashboardPlayersSeasonTotalsRow` (exported from the package root).

### Returns — `wnba_stats_teamplayeronoffdetails` / `wnbaStatsTeamplayeronoffdetails`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamPlayerOnOffDetails`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character |  |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`PlayersOnCourtTeamPlayerOnOffDetails`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character | Stats API identifier for vs player identifier associated with this NBA or WNBA Stats row. |
| `vs_player_name` | character | Display name for vs player name associated with this NBA or WNBA Stats row. |
| `court_status` | character | Indicates whether the compared player was on court or off court for the split row. |
| `gp` | character | Games played. |
| `w` | character | Wins. |
| `l` | character | Losses. |
| `w_pct` | character | Wins percentage (0-1 decimal). |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `tov` | character | Turnovers. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `blka` | character | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | character | Personal fouls. |
| `pfd` | character | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | character | Points scored. |
| `plus_minus` | character | Plus/minus point differential while on court. |
| `gp_rank` | character | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | character | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | character | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | character | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | character | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | character | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | character | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | character | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | character | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | character | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | character | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | character | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | character | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | character | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | character | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | character | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | character | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | character | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | character | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | character | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | character | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | character | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | character | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | character | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | character | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | character | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`PlayersOffCourtTeamPlayerOnOffDetails`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character | Stats API identifier for vs player identifier associated with this NBA or WNBA Stats row. |
| `vs_player_name` | character | Display name for vs player name associated with this NBA or WNBA Stats row. |
| `court_status` | character | Indicates whether the compared player was on court or off court for the split row. |
| `gp` | character | Games played. |
| `w` | character | Wins. |
| `l` | character | Losses. |
| `w_pct` | character | Wins percentage (0-1 decimal). |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `tov` | character | Turnovers. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `blka` | character | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | character | Personal fouls. |
| `pfd` | character | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | character | Points scored. |
| `plus_minus` | character | Plus/minus point differential while on court. |
| `gp_rank` | character | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | character | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | character | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | character | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | character | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | character | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | character | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | character | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | character | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | character | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | character | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | character | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | character | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | character | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | character | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | character | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | character | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | character | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | character | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | character | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | character | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | character | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | character | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | character | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | character | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | character | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**Row type:** `WnbaStatsTeamplayeronoffdetailsTables`, `WnbaStatsTeamplayeronoffdetailsOverallTeamPlayerOnOffDetailsRow`, `WnbaStatsTeamplayeronoffdetailsPlayersOnCourtTeamPlayerOnOffDetailsRow`, `WnbaStatsTeamplayeronoffdetailsPlayersOffCourtTeamPlayerOnOffDetailsRow` (exported from the package root).

### Returns — `wnba_stats_teamplayeronoffsummary` / `wnbaStatsTeamplayeronoffsummary`

With `{ parsed: true }`: an object of tables, one per key below.

**`OverallTeamPlayerOnOffSummary`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `group_value` | character | Specific grouping value for this dashboard or split row. |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Blocked field-goal attempts against for the requested NBA or WNBA Stats split. |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn for the requested NBA or WNBA Stats split. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | Rank for games played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_rank` | integer | Rank for wins within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `l_rank` | integer | Rank for losses within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `w_pct_rank` | integer | Rank for winning percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `min_rank` | integer | Rank for minutes played within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fgm_rank` | integer | Rank for field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fga_rank` | integer | Rank for field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg_pct_rank` | integer | Rank for field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_m_rank` | integer | Rank for three-point field goals made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_a_rank` | integer | Rank for three-point field goals attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fg3_pct_rank` | integer | Rank for three-point field-goal percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ftm_rank` | integer | Rank for free throws made within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `fta_rank` | integer | Rank for free throws attempted within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ft_pct_rank` | integer | Rank for free-throw percentage within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `oreb_rank` | integer | Rank for offensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `dreb_rank` | integer | Rank for defensive rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `reb_rank` | integer | Rank for total rebounds within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `ast_rank` | integer | Rank for assists within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `tov_rank` | integer | Rank for turnovers within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `stl_rank` | integer | Rank for steals within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blk_rank` | integer | Rank for blocks within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `blka_rank` | integer | Rank for blocked field-goal attempts against within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pf_rank` | integer | Rank for personal fouls within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pfd_rank` | integer | Rank for personal fouls drawn within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `pts_rank` | integer | Rank for points within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |
| `plus_minus_rank` | integer | Rank for plus-minus within the requested NBA or WNBA Stats leaderboard or split, where 1 is the leader. |

**`PlayersOnCourtTeamPlayerOnOffSummary`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `gp` | character | Games played. |
| `min` | character | Minutes played. |
| `plus_minus` | character | Plus/minus point differential while on court. |
| `off_rating` | character | Offensive rating (points produced per 100 possessions). |
| `def_rating` | character | Defensive rating (points allowed per 100 possessions). |
| `net_rating` | character | Net rating (off rating - def rating). |

**`PlayersOffCourtTeamPlayerOnOffSummary`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the grouping family used for this dashboard or split row. |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `gp` | character | Games played. |
| `min` | character | Minutes played. |
| `plus_minus` | character | Plus/minus point differential while on court. |
| `off_rating` | character | Offensive rating (points produced per 100 possessions). |
| `def_rating` | character | Defensive rating (points allowed per 100 possessions). |
| `net_rating` | character | Net rating (off rating - def rating). |

**Row type:** `WnbaStatsTeamplayeronoffsummaryTables`, `WnbaStatsTeamplayeronoffsummaryOverallTeamPlayerOnOffSummaryRow`, `WnbaStatsTeamplayeronoffsummaryPlayersOnCourtTeamPlayerOnOffSummaryRow`, `WnbaStatsTeamplayeronoffsummaryPlayersOffCourtTeamPlayerOnOffSummaryRow` (exported from the package root).

### Returns — `wnba_stats_teamvsplayer` / `wnbaStatsTeamvsplayer`

With `{ parsed: true }`: an object of tables, one per key below.

**`Overall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`vsPlayerOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `player_id` | integer | Unique player identifier. |
| `gp` | integer | Games played. |
| `w` | integer | Wins. |
| `l` | integer | Losses. |
| `w_pct` | numeric | Wins percentage (0-1 decimal). |
| `min` | numeric | Minutes played. |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `tov` | numeric | Turnovers. |
| `stl` | numeric | Steals. |
| `blk` | numeric | Blocks. |
| `blka` | numeric | Shot attempts blocked by opponents (blocks against). |
| `pf` | numeric | Personal fouls. |
| `pfd` | numeric | Personal fouls drawn. |
| `pts` | numeric | Points scored. |
| `plus_minus` | numeric | Plus/minus point differential while on court. |
| `nba_fantasy_pts` | numeric | Fantasy points under the NBA's fantasy scoring formula. |
| `dd2` | integer | Double-doubles recorded over the split. |
| `td3` | integer | Triple-doubles recorded over the split. |
| `wnba_fantasy_pts` | numeric | Fantasy points under the WNBA's fantasy scoring formula. |
| `gp_rank` | integer | League rank of the row's games played for the season and split. |
| `w_rank` | integer | League rank of the row's wins for the season and split. |
| `l_rank` | integer | League rank of the row's losses for the season and split. |
| `w_pct_rank` | integer | League rank of the row's win percentage for the season and split. |
| `min_rank` | integer | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | integer | League rank of the row's field goals made for the season and split. |
| `fga_rank` | integer | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | integer | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | integer | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | integer | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | integer | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | integer | League rank of the row's free throws made for the season and split. |
| `fta_rank` | integer | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | integer | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | integer | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | integer | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | integer | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | integer | League rank of the row's assists for the season and split. |
| `tov_rank` | integer | League rank of the row's turnovers for the season and split. |
| `stl_rank` | integer | League rank of the row's steals for the season and split. |
| `blk_rank` | integer | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | integer | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | integer | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | integer | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | integer | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | integer | League rank of the row's plus-minus point differential while on the floor for the season and split. |
| `nba_fantasy_pts_rank` | integer | League rank of the row's NBA fantasy points (league scoring formula) for the season and split. |
| `dd2_rank` | integer | League rank of the row's double-doubles for the season and split. |
| `td3_rank` | integer | League rank of the row's triple-doubles for the season and split. |
| `wnba_fantasy_pts_rank` | integer | League rank of the row's WNBA fantasy points (league scoring formula) for the season and split. |
| `team_count` | integer | Number of distinct teams aggregated into the split row. |

**`OnOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `gp` | character | Games played. |
| `w` | character | Wins. |
| `l` | character | Losses. |
| `w_pct` | character | Wins percentage (0-1 decimal). |
| `min` | character | Minutes played. |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |
| `fg3_m` | character | Three-point field goals made. |
| `fg3_a` | character | Three-point field goal attempts. |
| `fg3_pct` | character | Three-point field goal percentage (0-1). |
| `ftm` | character | Free throws made. |
| `fta` | character | Free throw attempts. |
| `ft_pct` | character | Free throw percentage (0-1). |
| `oreb` | character | Offensive rebounds. |
| `dreb` | character | Defensive rebounds. |
| `reb` | character | Total rebounds. |
| `ast` | character | Assists. |
| `tov` | character | Turnovers. |
| `stl` | character | Steals. |
| `blk` | character | Blocks. |
| `blka` | character | Shot attempts blocked by opponents (blocks against). |
| `pf` | character | Personal fouls. |
| `pfd` | character | Personal fouls drawn. |
| `pts` | character | Points scored. |
| `plus_minus` | character | Plus/minus point differential while on court. |
| `gp_rank` | character | League rank of the row's games played for the season and split. |
| `w_rank` | character | League rank of the row's wins for the season and split. |
| `l_rank` | character | League rank of the row's losses for the season and split. |
| `w_pct_rank` | character | League rank of the row's win percentage for the season and split. |
| `min_rank` | character | League rank of the row's minutes played for the season and split. |
| `fgm_rank` | character | League rank of the row's field goals made for the season and split. |
| `fga_rank` | character | League rank of the row's field goals attempted for the season and split. |
| `fg_pct_rank` | character | League rank of the row's field goal percentage for the season and split. |
| `fg3_m_rank` | character | League rank of the row's three-point field goals made for the season and split. |
| `fg3_a_rank` | character | League rank of the row's three-point field goals attempted for the season and split. |
| `fg3_pct_rank` | character | League rank of the row's three-point field goal percentage for the season and split. |
| `ftm_rank` | character | League rank of the row's free throws made for the season and split. |
| `fta_rank` | character | League rank of the row's free throws attempted for the season and split. |
| `ft_pct_rank` | character | League rank of the row's free throw percentage for the season and split. |
| `oreb_rank` | character | League rank of the row's offensive rebounds for the season and split. |
| `dreb_rank` | character | League rank of the row's defensive rebounds for the season and split. |
| `reb_rank` | character | League rank of the row's total rebounds for the season and split. |
| `ast_rank` | character | League rank of the row's assists for the season and split. |
| `tov_rank` | character | League rank of the row's turnovers for the season and split. |
| `stl_rank` | character | League rank of the row's steals for the season and split. |
| `blk_rank` | character | League rank of the row's blocked shots for the season and split. |
| `blka_rank` | character | League rank of the row's shot attempts blocked by opponents (blocks against) for the season and split. |
| `pf_rank` | character | League rank of the row's personal fouls committed for the season and split. |
| `pfd_rank` | character | League rank of the row's personal fouls drawn for the season and split. |
| `pts_rank` | character | League rank of the row's points scored for the season and split. |
| `plus_minus_rank` | character | League rank of the row's plus-minus point differential while on the floor for the season and split. |

**`ShotDistanceOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotDistanceOnCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |

**`ShotDistanceOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |

**`ShotAreaOverall`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `team_id` | integer | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |

**`ShotAreaOnCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |

**`ShotAreaOffCourt`**

| col_name | type | description |
|---|---|---|
| `group_set` | character | Name of the split group the row belongs to (e.g. Overall, By Opponent, By Month). |
| `team_id` | character | Unique team identifier. |
| `team_abbreviation` | character | Short team abbreviation (e.g. 'LAS'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `vs_player_id` | character |  |
| `vs_player_name` | character |  |
| `court_status` | character |  |
| `group_value` | character | Value of the split within the group (e.g. a specific opponent, month, or result). |
| `fgm` | character | Field goals made. |
| `fga` | character | Field goal attempts. |
| `fg_pct` | character | Field goal percentage (0-1). |

**Row type:** `WnbaStatsTeamvsplayerTables`, `WnbaStatsTeamvsplayerOverallRow`, `WnbaStatsTeamvsplayerVsPlayerOverallRow`, `WnbaStatsTeamvsplayerOnOffCourtRow`, `WnbaStatsTeamvsplayerShotDistanceOverallRow`, `WnbaStatsTeamvsplayerShotDistanceOnCourtRow`, `WnbaStatsTeamvsplayerShotDistanceOffCourtRow`, `WnbaStatsTeamvsplayerShotAreaOverallRow`, `WnbaStatsTeamvsplayerShotAreaOnCourtRow`, `WnbaStatsTeamvsplayerShotAreaOffCourtRow` (exported from the package root).

### Returns — `wnba_stats_teamyearbyyearstats` / `wnbaStatsTeamyearbyyearstats`

| col_name | type | description |
|---|---|---|
| `team_id` | integer | Unique team identifier. |
| `team_city` | character | Team city or region (e.g. 'Las Vegas'). |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `year` | character | 4-digit year. |
| `gp` | integer | Games played. |
| `wins` | integer | Total wins. |
| `losses` | integer | Total losses. |
| `win_pct` | numeric | Win percentage (0-1 decimal). |
| `conf_rank` | integer | Team's final rank within its conference for the season. |
| `div_rank` | integer | Team's final rank within its division for the season. |
| `po_wins` | integer | Playoff wins recorded by the team that season. |
| `po_losses` | integer | Playoff losses recorded by the team that season. |
| `conf_count` | integer | Number of teams in the team's conference that season. |
| `div_count` | integer | Number of teams in the team's division that season. |
| `nba_finals_appearance` | character | Whether the team reached the league finals that season (e.g. "FINALS APPEARANCE" or "N/A"). |
| `fgm` | numeric | Field goals made. |
| `fga` | numeric | Field goal attempts. |
| `fg_pct` | numeric | Field goal percentage (0-1). |
| `fg3_m` | numeric | Three-point field goals made. |
| `fg3_a` | numeric | Three-point field goal attempts. |
| `fg3_pct` | numeric | Three-point field goal percentage (0-1). |
| `ftm` | numeric | Free throws made. |
| `fta` | numeric | Free throw attempts. |
| `ft_pct` | numeric | Free throw percentage (0-1). |
| `oreb` | numeric | Offensive rebounds. |
| `dreb` | numeric | Defensive rebounds. |
| `reb` | numeric | Total rebounds. |
| `ast` | numeric | Assists. |
| `pf` | numeric | Personal fouls. |
| `stl` | numeric | Steals. |
| `tov` | numeric | Turnovers. |
| `blk` | numeric | Blocks. |
| `pts` | numeric | Points scored. |
| `pts_rank` | integer | League rank of the team's points scored for the season. |

**Row type:** `WnbaStatsTeamyearbyyearstatsRow` (exported from the package root).

### Returns — `wnba_stats_videostatus` / `wnbaStatsVideostatus`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `visitor_team_id` | integer | Unique identifier for visitor team. |
| `visitor_team_city` | character | City name of the visiting team. |
| `visitor_team_name` | character | Nickname of the visiting team. |
| `visitor_team_abbreviation` | character | Abbreviation of the visiting team. |
| `home_team_id` | integer | Unique identifier for the home team. |
| `home_team_city` | character | Home team city / location. |
| `home_team_name` | character | Home team name. |
| `home_team_abbreviation` | character |  |
| `game_status` | integer | Game status label. |
| `game_status_text` | character | Game status display text (e.g. 'Final', '4:32 - 4th'). |
| `is_available` | integer | Flag indicating whether game video is available in the league's stats video system. |
| `pt_xyz_available` | integer | Pt xyz available. |

**Row type:** `WnbaStatsVideostatusRow` (exported from the package root).

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/wnba_stats.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
