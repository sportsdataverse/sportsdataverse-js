---
title: Native API
sidebar_label: Native API
sidebar_position: 6
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))
- **Baseball Savant `parsed: true` rows are typed like sdv-py's** — Savant CSV rows (`parse_mlb_statcast_leaderboard`, `parse_mlb_statcast_search`, the `mlb_statcast_search*` wrappers): numeric columns are numbers (were strings), an integer past `Number.MAX_SAFE_INTEGER` is `BigInt`, `inf` is `Infinity`, True/False are booleans, NA cells are `null`; the MLBAM id columns (`batter`, `pitcher`, `on_1b`…, `fielder_2`…, `game_pk`) are pinned to Int64 and come back as decimal strings. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **The Statcast, BartTorvik and HockeyTech getters throw on a failed fetch** — A failed HTTP fetch is no longer `{}` / `""` — it throws like every other wrapper, so a failed fetch cannot be mistaken for an empty table. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `sdv.mlb` — Native (non-ESPN) APIs

Beyond the ESPN surface, `sdv.mlb` also wraps the league's own live APIs. Same `{ parsed: true }` contract; each method is exposed under both snake_case and camelCase on `sdv.mlb`.

## Native API — MLB Stats API

Flat (non-ESPN) wrappers for the official MLB Stats API. Host: `https://statsapi.mlb.com`. Each method is exposed under BOTH its snake_case name `mlb_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.mlb`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `mlb_all_star_ballot` / `mlbAllStarBallot` *(was `mlb_api_all_star_ballot`)* | `https://statsapi.mlb.com/api/v1/league/{league_id}/allStarBallot` | `league_id`\* | `season`, `fields` | `parse_mlb_list` | — |
| `mlb_all_star_final_vote` / `mlbAllStarFinalVote` *(was `mlb_api_all_star_final_vote`)* | `https://statsapi.mlb.com/api/v1/league/{league_id}/allStarFinalVote` | `league_id`\* | `season`, `fields` | `parse_mlb_list` | — |
| `mlb_all_star_write_ins` / `mlbAllStarWriteIns` *(was `mlb_api_all_star_write_ins`)* | `https://statsapi.mlb.com/api/v1/league/{league_id}/allStarWriteIns` | `league_id`\* | `season`, `fields` | `parse_mlb_list` | — |
| `mlb_analytics_games` / `mlbAnalyticsGames` *(was `mlb_api_analytics_games`)* | `https://statsapi.mlb.com/api/v1/game/analytics/game` | — | `game_mode_id` → `gameModeId`, `timecode`, `limit`, `sort_by` → `sortBy`, `is_non_statcast` → `isNonStatcast`, `offset`, `fields` | `parse_mlb_list` | — |
| `mlb_analytics_guids` / `mlbAnalyticsGuids` *(was `mlb_api_analytics_guids`)* | `https://statsapi.mlb.com/api/v1/game/analytics/guids` | — | `game_mode_id` → `gameModeId`, `timecode`, `limit`, `sort_by` → `sortBy`, `is_non_statcast` → `isNonStatcast`, `offset`, `fields` | `parse_mlb_list` | — |
| `mlb_attendance` / `mlbAttendance` *(was `mlb_api_attendance`)* | `https://statsapi.mlb.com/api/v1/attendance` | — | `team_id` → `teamId`, `league_id` → `leagueId`, `season`, `league_list_id` → `leagueListId`, `game_type` → `gameType` | `parse_mlb_list` | — |
| `mlb_award_recipients` / `mlbAwardRecipients` *(was `mlb_api_award_recipients`)* | `https://statsapi.mlb.com/api/v1/awards/{award_id}/recipients` | `award_id`\* | `season`, `sport_id` → `sportId`, `hydrate` | `parse_mlb_list` | — |
| `mlb_awards` / `mlbAwards` *(was `mlb_api_awards`)* | `https://statsapi.mlb.com/api/v1/awards` | — | `sport_id` → `sportId` | `parse_mlb_list` | — |
| `mlb_boxscore` / `mlbBoxscore` *(was `mlb_api_boxscore`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/boxscore` | `game_pk`\* | `timecode`, `fields` | `parse_mlb_boxscore` | — |
| `mlb_conference` / `mlbConference` *(was `mlb_api_conference`)* | `https://statsapi.mlb.com/api/v1/conferences/{conference_id}` | `conference_id`\* | `season`, `fields` | `parse_mlb_list` | — |
| `mlb_conferences` / `mlbConferences` *(was `mlb_api_conferences`)* | `https://statsapi.mlb.com/api/v1/conferences` | — | `conference_id` → `conferenceId`, `season`, `fields` | `parse_mlb_list` | — |
| `mlb_datacasters` / `mlbDatacasters` *(was `mlb_api_datacasters`)* | `https://statsapi.mlb.com/api/v1/jobs/datacasters` | — | `sport_id` → `sportId`, `date`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_divisions` / `mlbDivisions` *(was `mlb_api_divisions`)* | `https://statsapi.mlb.com/api/v1/divisions` | — | `sport_id` → `sportId`, `league_id` → `leagueId`, `division_id` → `divisionId` | `parse_mlb_list` | — |
| `mlb_draft` / `mlbDraft` *(was `mlb_api_draft`)* | `https://statsapi.mlb.com/api/v1/draft/{year}` | `year`\* | `round_` → `round`, `team_id` → `teamId`, `player_id` → `playerId`, `limit` | `parse_mlb_list` | — |
| `mlb_draft_latest` / `mlbDraftLatest` *(was `mlb_api_draft_latest`)* | `https://statsapi.mlb.com/api/v1/draft/{year}/latest` | `year`\* | — | `parse_mlb_draft_latest` | — |
| `mlb_draft_prospects` / `mlbDraftProspects` *(was `mlb_api_draft_prospects`)* | `https://statsapi.mlb.com/api/v1/draft/prospects/{year}` | `year`\* | `scouting_report` → `scoutingReport`, `limit` | `parse_mlb_list` | — |
| `mlb_free_agents` / `mlbFreeAgents` *(was `mlb_api_free_agents`)* | `https://statsapi.mlb.com/api/v1/people/freeAgents` | — | `season`, `order`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_game_changes` / `mlbGameChanges` *(was `mlb_api_game_changes`)* | `https://statsapi.mlb.com/api/v1/game/changes` | — | `updated_since` → `updatedSince`, `sport_id` → `sportId`, `fields` | `parse_mlb_schedule` | — |
| `mlb_game_color` / `mlbGameColor` *(was `mlb_api_game_color`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/feed/color` | `game_pk`\* | `timecode`, `fields` | `parse_mlb_list` | — |
| `mlb_game_color_diff` / `mlbGameColorDiff` *(was `mlb_api_game_color_diff`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/feed/color/diffPatch` | `game_pk`\* | `start_timecode` → `startTimecode`, `end_timecode` → `endTimecode` | `parse_mlb_list` | — |
| `mlb_game_color_timestamps` / `mlbGameColorTimestamps` *(was `mlb_api_game_color_timestamps`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/feed/color/timestamps` | `game_pk`\* | — | `parse_mlb_timecodes` | — |
| `mlb_game_content` / `mlbGameContent` *(was `mlb_api_game_content`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/content` | `game_pk`\* | — | `parse_mlb_list` | — |
| `mlb_game_context_metrics` / `mlbGameContextMetrics` *(was `mlb_api_game_context_metrics`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/contextMetrics` | `game_pk`\* | `fields` | `parse_mlb_list` | — |
| `mlb_game_guids` / `mlbGameGuids` *(was `mlb_api_game_guids`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/guids` | `game_pk`\* | `game_mode_id` → `gameModeId`, `updated_since` → `updatedSince`, `is_pitch` → `isPitch`, `is_hit` → `isHit`, `is_pickoff` → `isPickoff`, `hydrate`, `parsed_raw` → `parsed/raw`, `fields` | `parse_mlb_list` | — |
| `mlb_game_pace` / `mlbGamePace` *(was `mlb_api_game_pace`)* | `https://statsapi.mlb.com/api/v1/gamePace` | — | `season`, `team_ids` → `teamIds`, `league_ids` → `leagueIds`, `league_list_id` → `leagueListId`, `sport_id` → `sportId`, `game_type` → `gameType`, `start_date` → `startDate`, `end_date` → `endDate`, `venue_ids` → `venueIds`, `org_type` → `orgType`, `include_children` → `includeChildren`, `fields` | `parse_mlb_list` | — |
| `mlb_game_timestamps` / `mlbGameTimestamps` *(was `mlb_api_game_timestamps`)* | `https://statsapi.mlb.com/api/v1.1/game/{game_pk}/feed/live/timestamps` | `game_pk`\* | — | `parse_mlb_timecodes` | — |
| `mlb_high_low` / `mlbHighLow` *(was `mlb_api_high_low`)* | `https://statsapi.mlb.com/api/v1/highLow/{org_type}` | `org_type`\* | `stat_group` → `statGroup`, `sort_stat` → `sortStat`, `season`, `game_type` → `gameType`, `team_id` → `teamId`, `league_id` → `leagueId`, `sport_ids` → `sportIds`, `limit`, `fields` | `parse_mlb_list` | — |
| `mlb_home_run_derby` / `mlbHomeRunDerby` *(was `mlb_api_home_run_derby`)* | `https://statsapi.mlb.com/api/v1/homeRunDerby/{game_pk}` | `game_pk`\* | `fields` | `parse_mlb_list` | — |
| `mlb_home_run_derby_bracket` / `mlbHomeRunDerbyBracket` *(was `mlb_api_home_run_derby_bracket`)* | `https://statsapi.mlb.com/api/v1/homeRunDerby/{game_pk}/bracket` | `game_pk`\* | `fields` | `parse_mlb_list` | — |
| `mlb_home_run_derby_pool` / `mlbHomeRunDerbyPool` *(was `mlb_api_home_run_derby_pool`)* | `https://statsapi.mlb.com/api/v1/homeRunDerby/{game_pk}/pool` | `game_pk`\* | `fields` | `parse_mlb_list` | — |
| `mlb_jobs` / `mlbJobs` *(was `mlb_api_jobs`)* | `https://statsapi.mlb.com/api/v1/jobs` | — | `job_type` → `jobType`, `sport_id` → `sportId`, `date`, `fields` | `parse_mlb_list` | — |
| `mlb_leagues` / `mlbLeagues` *(was `mlb_api_leagues`)* | `https://statsapi.mlb.com/api/v1/leagues` | — | `sport_id` → `sportId`, `season`, `league_ids` → `leagueIds` | `parse_mlb_list` | — |
| `mlb_linescore` / `mlbLinescore` *(was `mlb_api_linescore`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/linescore` | `game_pk`\* | `timecode`, `fields` | `parse_mlb_linescore` | — |
| `mlb_meta` / `mlbMeta` *(was `mlb_api_meta`)* | `https://statsapi.mlb.com/api/v1/{meta_type}` | `meta_type`\* | — | `parse_mlb_list` | — |
| `mlb_official_scorers` / `mlbOfficialScorers` *(was `mlb_api_official_scorers`)* | `https://statsapi.mlb.com/api/v1/jobs/officialScorers` | — | `sport_id` → `sportId`, `date`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_pbp` / `mlbPbp` *(was `mlb_api_pbp`)* | `https://statsapi.mlb.com/api/v1.1/game/{game_pk}/feed/live` | `game_pk`\* | `language`, `timecode`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_pbp_diff` / `mlbPbpDiff` *(was `mlb_api_pbp_diff`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/feed/live/diffPatch` | `game_pk`\* | `start_timecode` → `startTimecode`, `end_timecode` → `endTimecode` | `parse_mlb_list` | — |
| `mlb_people` / `mlbPeople` *(was `mlb_api_people`)* | `https://statsapi.mlb.com/api/v1/people` | — | `person_ids` → `personIds`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_person` / `mlbPerson` *(was `mlb_api_person`)* | `https://statsapi.mlb.com/api/v1/people/{person_id}` | `person_id`\* | `season`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_person_game_stats` / `mlbPersonGameStats` *(was `mlb_api_person_game_stats`)* | `https://statsapi.mlb.com/api/v1/people/{person_id}/stats/game/{game_pk}` | `person_id`\*, `game_pk`\* | `fields` | `parse_mlb_list` | — |
| `mlb_person_stats` / `mlbPersonStats` *(was `mlb_api_person_stats`)* | `https://statsapi.mlb.com/api/v1/people/{person_id}/stats` | `person_id`\* | `stats`, `group`, `season`, `sport_id` → `sportId`, `hydrate`, `fields` | `parse_mlb_person_stats` | — |
| `mlb_play_analytics` / `mlbPlayAnalytics` *(was `mlb_api_play_analytics`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/{guid}/analytics` | `game_pk`\*, `guid`\* | `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_play_by_play` / `mlbPlayByPlay` *(was `mlb_api_play_by_play`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/playByPlay` | `game_pk`\* | `timecode`, `fields` | `parse_mlb_play_by_play` | — |
| `mlb_play_context_metrics_averages` / `mlbPlayContextMetricsAverages` *(was `mlb_api_play_context_metrics_averages`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/{guid}/contextMetricsAverages` | `game_pk`\*, `guid`\* | `fields` | `parse_mlb_list` | — |
| `mlb_schedule` / `mlbSchedule` *(was `mlb_api_schedule`)* | `https://statsapi.mlb.com/api/v1/schedule` | — | `sport_id` → `sportId`, `date`, `season`, `team_id` → `teamId`, `start_date` → `startDate`, `end_date` → `endDate`, `game_type` → `gameType`, `hydrate`, `fields` | `parse_mlb_schedule` | — |
| `mlb_schedule_postseason` / `mlbSchedulePostseason` *(was `mlb_api_schedule_postseason`)* | `https://statsapi.mlb.com/api/v1/schedule/postseason` | — | `season`, `sport_id` → `sportId`, `hydrate` | `parse_mlb_schedule` | — |
| `mlb_schedule_postseason_series` / `mlbSchedulePostseasonSeries` *(was `mlb_api_schedule_postseason_series`)* | `https://statsapi.mlb.com/api/v1/schedule/postseason/series` | — | `game_types` → `gameTypes`, `series_number` → `seriesNumber`, `team_id` → `teamId`, `sport_id` → `sportId`, `season`, `fields` | `parse_mlb_list` | — |
| `mlb_schedule_postseason_tunein` / `mlbSchedulePostseasonTunein` *(was `mlb_api_schedule_postseason_tunein`)* | `https://statsapi.mlb.com/api/v1/schedule/postseason/tuneIn` | — | `team_id` → `teamId`, `sport_id` → `sportId`, `season`, `hydrate`, `fields` | `parse_mlb_schedule` | — |
| `mlb_schedule_tied` / `mlbScheduleTied` *(was `mlb_api_schedule_tied`)* | `https://statsapi.mlb.com/api/v1/schedule/games/tied` | — | `game_types` → `gameTypes`, `season`, `hydrate`, `fields` | `parse_mlb_schedule` | — |
| `mlb_season` / `mlbSeason` *(was `mlb_api_season`)* | `https://statsapi.mlb.com/api/v1/seasons/{season_id}` | `season_id`\* | `sport_id` → `sportId` | `parse_mlb_list` | — |
| `mlb_seasons` / `mlbSeasons` *(was `mlb_api_seasons`)* | `https://statsapi.mlb.com/api/v1/seasons` | — | `sport_id` → `sportId`, `season`, `all_seasons` → `all` | `parse_mlb_list` | — |
| `mlb_seasons_all` / `mlbSeasonsAll` *(was `mlb_api_seasons_all`)* | `https://statsapi.mlb.com/api/v1/seasons/all` | — | `division_id` → `divisionId`, `league_id` → `leagueId`, `with_game_type_dates` → `withGameTypeDates`, `sport_id` → `sportId`, `fields` | `parse_mlb_list` | — |
| `mlb_sport` / `mlbSport` *(was `mlb_api_sport`)* | `https://statsapi.mlb.com/api/v1/sports/{sport_id}` | `sport_id`\* | `fields` | `parse_mlb_list` | — |
| `mlb_sport_players` / `mlbSportPlayers` *(was `mlb_api_sport_players`)* | `https://statsapi.mlb.com/api/v1/sports/{sport_id}/players` | `sport_id` | `season`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_sports` / `mlbSports` *(was `mlb_api_sports`)* | `https://statsapi.mlb.com/api/v1/sports` | — | `sport_id` → `sportId` | `parse_mlb_list` | — |
| `mlb_standings` / `mlbStandings` *(was `mlb_api_standings`)* | `https://statsapi.mlb.com/api/v1/standings` | — | `league_id` → `leagueId`, `season`, `standings_types` → `standingsTypes`, `hydrate`, `fields` | `parse_mlb_standings` | — |
| `mlb_stats` / `mlbStats` *(was `mlb_api_stats`)* | `https://statsapi.mlb.com/api/v1/stats` | — | `stats`, `group`, `season`, `sport_id` → `sportId`, `league_id` → `leagueId`, `team_id` → `teamId`, `player_pool` → `playerPool`, `game_type` → `gameType`, `limit`, `offset`, `fields` | `parse_mlb_list` | — |
| `mlb_stats_leaders` / `mlbStatsLeaders` *(was `mlb_api_stats_leaders`)* | `https://statsapi.mlb.com/api/v1/stats/leaders` | — | `leader_categories` → `leaderCategories`, `season`, `leader_game_types` → `leaderGameTypes`, `stat_group` → `statGroup`, `league_id` → `leagueId`, `sport_id` → `sportId`, `limit` | `parse_mlb_list` | — |
| `mlb_stats_metrics` / `mlbStatsMetrics` *(was `mlb_api_stats_metrics`)* | `https://statsapi.mlb.com/api/v1/stats/metrics` | — | `stats`, `group`, `game_type` → `gameType`, `season`, `start_date` → `startDate`, `end_date` → `endDate`, `venue_id` → `venueId`, `min_occurrences` → `minOccurrences`, `percentile`, `person_id` → `personId`, `team_id` → `teamId`, `limit`, `offset`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_stats_streaks` / `mlbStatsStreaks` *(was `mlb_api_stats_streaks`)* | `https://statsapi.mlb.com/api/v1/stats/streaks` | — | `streak_type` → `streakType`, `streak_threshold` → `streakThreshold`, `season`, `stat_group` → `statGroup`, `active_streak` → `activeStreak`, `sport_id` → `sportId` | `parse_mlb_list` | — |
| `mlb_team` / `mlbTeam` *(was `mlb_api_team`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}` | `team_id`\* | `season`, `sport_id` → `sportId`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_team_affiliates` / `mlbTeamAffiliates` *(was `mlb_api_team_affiliates`)* | `https://statsapi.mlb.com/api/v1/teams/affiliates` | — | `team_ids` → `teamIds`, `sport_id` → `sportId`, `season`, `hydrate` | `parse_mlb_list` | — |
| `mlb_team_alumni` / `mlbTeamAlumni` *(was `mlb_api_team_alumni`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/alumni` | `team_id`\* | `season`, `group`, `hydrate` | `parse_mlb_list` | — |
| `mlb_team_coaches` / `mlbTeamCoaches` *(was `mlb_api_team_coaches`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/coaches` | `team_id`\* | `season`, `date`, `fields` | `parse_mlb_list` | — |
| `mlb_team_leaders` / `mlbTeamLeaders` *(was `mlb_api_team_leaders`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/leaders` | `team_id`\* | `leader_categories` → `leaderCategories`, `season`, `leader_game_types` → `leaderGameTypes`, `limit` | `parse_mlb_list` | — |
| `mlb_team_personnel` / `mlbTeamPersonnel` *(was `mlb_api_team_personnel`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/personnel` | `team_id`\* | `date`, `fields` | `parse_mlb_list` | — |
| `mlb_team_roster` / `mlbTeamRoster` *(was `mlb_api_team_roster`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/roster` | `team_id`\* | `season`, `roster_type` → `rosterType`, `date`, `hydrate`, `fields` | `parse_mlb_team_roster` | — |
| `mlb_team_roster_type` / `mlbTeamRosterType` *(was `mlb_api_team_roster_type`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/roster/{roster_type}` | `team_id`\*, `roster_type`\* | `season`, `date`, `hydrate`, `fields` | `parse_mlb_team_roster` | — |
| `mlb_team_stats` / `mlbTeamStats` *(was `mlb_api_team_stats`)* | `https://statsapi.mlb.com/api/v1/teams/{team_id}/stats` | `team_id`\* | `season`, `stats`, `group`, `sport_ids` → `sportIds`, `game_type` → `gameType`, `fields` | `parse_mlb_person_stats` | — |
| `mlb_teams` / `mlbTeams` *(was `mlb_api_teams`)* | `https://statsapi.mlb.com/api/v1/teams` | — | `sport_id` → `sportId`, `season`, `league_ids` → `leagueIds`, `active_status` → `activeStatus`, `hydrate`, `fields` | `parse_mlb_teams` | — |
| `mlb_teams_history` / `mlbTeamsHistory` *(was `mlb_api_teams_history`)* | `https://statsapi.mlb.com/api/v1/teams/history` | — | `team_ids` → `teamIds`, `start_season` → `startSeason`, `end_season` → `endSeason`, `fields` | `parse_mlb_list` | — |
| `mlb_teams_stats` / `mlbTeamsStats` *(was `mlb_api_teams_stats`)* | `https://statsapi.mlb.com/api/v1/teams/stats` | — | `season`, `sport_ids` → `sportIds`, `stat_group` → `group`, `game_type` → `gameType`, `stats`, `order`, `sort_stat` → `sortStat`, `fields` | `parse_mlb_person_stats` | — |
| `mlb_teams_stats_leaders` / `mlbTeamsStatsLeaders` *(was `mlb_api_teams_stats_leaders`)* | `https://statsapi.mlb.com/api/v1/teams/stats/leaders` | — | `leader_categories` → `leaderCategories`, `sit_codes` → `sitCodes`, `game_types` → `gameTypes`, `stat_group` → `statGroup`, `season`, `league_ids` → `leagueIds`, `start_date` → `startDate`, `end_date` → `endDate`, `sport_id` → `sportId`, `hydrate`, `limit`, `fields` | `parse_mlb_list` | — |
| `mlb_umpire_games` / `mlbUmpireGames` *(was `mlb_api_umpire_games`)* | `https://statsapi.mlb.com/api/v1/jobs/umpires/games/{umpire_id}` | `umpire_id`\* | `season`, `hydrate`, `fields` | `parse_mlb_list` | — |
| `mlb_umpires` / `mlbUmpires` *(was `mlb_api_umpires`)* | `https://statsapi.mlb.com/api/v1/jobs/umpires` | — | — | `parse_mlb_list` | — |
| `mlb_venue` / `mlbVenue` *(was `mlb_api_venue`)* | `https://statsapi.mlb.com/api/v1/venues/{venue_id}` | `venue_id`\* | `season`, `hydrate` | `parse_mlb_list` | — |
| `mlb_venues` / `mlbVenues` *(was `mlb_api_venues`)* | `https://statsapi.mlb.com/api/v1/venues` | — | `season`, `sport_ids` → `sportIds`, `hydrate` | `parse_mlb_list` | — |
| `mlb_win_probability` / `mlbWinProbability` *(was `mlb_api_win_probability`)* | `https://statsapi.mlb.com/api/v1/game/{game_pk}/winProbability` | `game_pk`\* | `fields` | `parse_mlb_win_probability` | — |

### Returns — `mlb_all_star_ballot` / `mlbAllStarBallot`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `name_matrilineal` | character | Maternal family name. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `last_played_date` | character | Date of last MLB game played. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `birth_state_province` | character | State or province of birth. |
| `draft_year` | double | Year the player was drafted. |
| `name_title` | character | Name title. |
| `name_suffix` | character | Name suffix (e.g. Jr., Sr., III). |

**Row type:** `MlbAllStarBallotRow` (exported from the package root).

### Returns — `mlb_all_star_final_vote` / `mlbAllStarFinalVote`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `name_matrilineal` | character | Maternal family name. |
| `birth_state_province` | character | State or province of birth. |
| `name_title` | character | Name title. |
| `name_suffix` | character | Name suffix (e.g. Jr., Sr., III). |
| `middle_name` | character | Player middle name. |
| `draft_year` | double | Year the player was drafted. |
| `last_played_date` | character | Date of last MLB game played. |

**Row type:** `MlbAllStarFinalVoteRow` (exported from the package root).

### Returns — `mlb_all_star_write_ins` / `mlbAllStarWriteIns`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_state_province` | character | State or province of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `primary_number` | character | Player uniform number. |
| `draft_year` | double | Year the player was drafted. |
| `middle_name` | character | Player middle name. |
| `name_matrilineal` | character | Maternal family name. |
| `last_played_date` | character | Date of last MLB game played. |
| `nick_name` | character | Player nickname. |
| `name_title` | character | Name title. |
| `name_suffix` | character | Name suffix (e.g. Jr., Sr., III). |

**Row type:** `MlbAllStarWriteInsRow` (exported from the package root).

### Returns — `mlb_award_recipients` / `mlbAwardRecipients`

| col_name | type | description |
|---|---|---|
| `id` | character | Id. |
| `name` | character | Display name. |
| `date` | character | Date in YYYY-MM-DD format. |
| `season` | character | Season year. |
| `team_id` | integer | Unique ESPN team identifier. |
| `team_link` | character | API link to the team. |
| `player_id` | integer | stats.ncaa.org player identifier. |
| `player_link` | character | API relative link to the player. |
| `player_primary_position_code` | character | Recipient primary fielding position code. |
| `player_primary_position_name` | character | Recipient primary fielding position name. |
| `player_primary_position_type` | character | Participant primary position type (e.g. 'Hitter'). |
| `player_primary_position_abbreviation` | character | Participant primary position abbreviation (e.g. 'DH'). |
| `player_name_first_last` | character | Participant name in first-last order. |
| `votes` | double | Number of votes received. |

**Row type:** `MlbAwardRecipientsRow` (exported from the package root).

### Returns — `mlb_awards` / `mlbAwards`

| col_name | type | description |
|---|---|---|
| `id` | character | Id. |
| `name` | character | Display name. |
| `description` | character | Long-form description text. |
| `sort_order` | double | Display sort order for the sport. |
| `active` | logical | Whether the player is currently active. |
| `sport_id` | double | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |
| `league_id` | double | League MLBAM ID. |
| `league_link` | character | API link to the league. |
| `notes` | character | Notes. |

**Row type:** `MlbAwardsRow` (exported from the package root).

### Returns — `mlb_boxscore` / `mlbBoxscore`

| col_name | type | description |
|---|---|---|
| `team_side` | character |  |
| `team_id` | integer | Unique ESPN team identifier. |
| `team_name` | character | Team name. |
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `parent_team_id` | integer | MLB Stats API identifier for the player's parent (MLB-level) organization, useful for tracking players on optional assignment. |
| `batting_order` | character | Spot in the batting order (box-score row order). |
| `all_positions` | character | All fielding positions played by the player during the game, as a list of position codes. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |
| `person_boxscore_name` | character | Name as shown in box scores. |
| `position_code` | character | Numeric scorekeeping position code. |
| `position_name` | character | Position name. |
| `position_type` | character | Position category (e.g. 'Pitcher', 'Infielder'). |
| `position_abbreviation` | character | Position abbreviation. |
| `status_code` | character | Status code identifier (e.g. 'S', 'P', 'I', 'F'). |
| `status_description` | character | Roster status description (e.g. 'Active'). |
| `stats_batting_summary` | character | Condensed text summary of the batter's performance line (e.g., '2-4, HR, 2 RBI') for display purposes. |
| `stats_batting_games_played` | double | Number of games played indicator for this batter's boxscore row (typically 1 for a standard game appearance). |
| `stats_batting_fly_outs` | double | Number of outs recorded by the batter on fly balls in this game. |
| `stats_batting_ground_outs` | double | Number of outs recorded by the batter on ground balls in this game. |
| `stats_batting_air_outs` | double | Number of outs recorded by the batter on balls hit in the air during this game. |
| `stats_batting_runs` | double | Number of runs scored by the batter in this game. |
| `stats_batting_doubles` | double | Number of doubles hit by the batter in this game. |
| `stats_batting_triples` | double | Number of triples hit by the batter in this game. |
| `stats_batting_home_runs` | double | Number of home runs hit by the batter in this game. |
| `stats_batting_strike_outs` | double | Number of times the batter struck out in this game. |
| `stats_batting_base_on_balls` | double | Number of walks (bases on balls) drawn by the batter in this game, including intentional walks. |
| `stats_batting_intentional_walks` | double | Number of intentional walks issued to the batter in this game. |
| `stats_batting_hits` | double | Total number of hits recorded by the batter in this game. |
| `stats_batting_hit_by_pitch` | double | Number of times the batter was hit by a pitch in this game. |
| `stats_batting_at_bats` | double | Number of official at-bats for the batter in this game. |
| `stats_batting_caught_stealing` | double | Number of times the batter was caught stealing in this game. |
| `stats_batting_stolen_bases` | double | Number of stolen bases recorded by the batter in this game. |
| `stats_batting_stolen_base_percentage` | character | Percentage of stolen base attempts that were successful for the batter in this game. |
| `stats_batting_ground_into_double_play` | double | Number of times the batter grounded into a double play in this game. |
| `stats_batting_ground_into_triple_play` | double | Number of times the batter grounded into a triple play in this game. |
| `stats_batting_plate_appearances` | double | Total number of plate appearances for the batter in this game. |
| `stats_batting_total_bases` | double | Total number of bases accumulated by the batter on hits in this game. |
| `stats_batting_rbi` | double | Number of runs batted in (RBI) credited to the batter in this game. |
| `stats_batting_left_on_base` | double | Number of runners left on base when the batter made an out or the inning ended in this game. |
| `stats_batting_sac_bunts` | double | Number of sacrifice bunts executed by the batter in this game. |
| `stats_batting_sac_flies` | double | Number of sacrifice flies hit by the batter that scored a run in this game. |
| `stats_batting_catchers_interference` | double | Number of times the batter reached base due to catcher's interference in this game. |
| `stats_batting_pickoffs` | double | Number of times the batter was picked off base in this game. |
| `stats_batting_at_bats_per_home_run` | character | At-bats per home run ratio for the batter in this game. |
| `stats_batting_pop_outs` | double | Number of outs recorded by the batter on infield pop-ups in this game. |
| `stats_batting_line_outs` | double | Number of outs recorded by the batter on line drives caught in this game. |
| `stats_fielding_caught_stealing` | double | Number of baserunners caught stealing by the player (typically a catcher) in this game. |
| `stats_fielding_stolen_bases` | double | Number of stolen bases allowed by the player while fielding in this game. |
| `stats_fielding_stolen_base_percentage` | character | Percentage of stolen base attempts against the player (catcher perspective) that were successful in this game. |
| `stats_fielding_caught_stealing_percentage` | character | Percentage of stolen base attempts that the player threw out in this game. |
| `stats_fielding_assists` | double | Number of fielding assists recorded by the player in this game. |
| `stats_fielding_put_outs` | double | Number of putouts recorded by the player in this game. |
| `stats_fielding_errors` | double | Number of fielding errors committed by the player in this game. |
| `stats_fielding_chances` | double | Total fielding chances for the player in this game (putouts + assists + errors). |
| `stats_fielding_fielding` | character | Fielding percentage for the player in this game, calculated as (putouts + assists) / total chances. |
| `stats_fielding_passed_ball` | double | Number of passed balls charged to the player (catcher-specific) in this game. |
| `stats_fielding_pickoffs` | double | Number of pickoffs credited to the player as a fielder in this game. |
| `season_stats_batting_games_played` | integer | Season-to-date number of games in which the batter appeared. |
| `season_stats_batting_fly_outs` | integer | Season-to-date number of outs recorded by the batter on fly balls caught in the outfield. |
| `season_stats_batting_ground_outs` | integer | Season-to-date number of outs recorded by the batter on ground balls. |
| `season_stats_batting_air_outs` | integer | Season-to-date number of outs recorded by the batter on balls hit in the air (fly balls and line drives caught). |
| `season_stats_batting_runs` | integer | Season-to-date number of runs scored by the batter. |
| `season_stats_batting_doubles` | integer | Season-to-date number of doubles hit by the batter. |
| `season_stats_batting_triples` | integer | Season-to-date number of triples hit by the batter. |
| `season_stats_batting_home_runs` | integer | Season-to-date number of home runs hit by the batter. |
| `season_stats_batting_strike_outs` | integer | Season-to-date number of times the batter struck out. |
| `season_stats_batting_base_on_balls` | integer | Season-to-date total walks (bases on balls) drawn by the batter, including intentional walks. |
| `season_stats_batting_intentional_walks` | integer | Season-to-date number of intentional walks (IBB) issued to the batter. |
| `season_stats_batting_hits` | integer | Season-to-date total number of hits recorded by the batter. |
| `season_stats_batting_hit_by_pitch` | integer | Season-to-date number of times the batter was hit by a pitch. |
| `season_stats_batting_avg` | character | Season-to-date batting average (hits divided by at-bats) for the batter. |
| `season_stats_batting_at_bats` | integer | Season-to-date number of official at-bats accumulated by the batter. |
| `season_stats_batting_obp` | character | Season-to-date on-base percentage (OBP), measuring how often the batter reaches base per plate appearance. |
| `season_stats_batting_slg` | character | Season-to-date slugging percentage (SLG), measuring total bases per at-bat. |
| `season_stats_batting_ops` | character | Season-to-date on-base plus slugging percentage (OPS), a combined measure of a batter's ability to get on base and hit for power. |
| `season_stats_batting_caught_stealing` | integer | Season-to-date number of times the batter was caught stealing a base. |
| `season_stats_batting_stolen_bases` | integer | Season-to-date number of bases stolen by the batter. |
| `season_stats_batting_stolen_base_percentage` | character | Season-to-date percentage of stolen base attempts that were successful for the batter. |
| `season_stats_batting_caught_stealing_percentage` | character | Season-to-date percentage of stolen base attempts that resulted in the batter being caught stealing. |
| `season_stats_batting_ground_into_double_play` | integer | Season-to-date number of times the batter grounded into a double play. |
| `season_stats_batting_ground_into_triple_play` | integer | Season-to-date number of times the batter grounded into a triple play. |
| `season_stats_batting_plate_appearances` | integer | Season-to-date total number of plate appearances for the batter, including at-bats, walks, HBP, and sacrifices. |
| `season_stats_batting_total_bases` | integer | Season-to-date total number of bases accumulated by the batter on hits. |
| `season_stats_batting_rbi` | integer | Season-to-date number of runs batted in (RBI) credited to the batter. |
| `season_stats_batting_left_on_base` | integer | Season-to-date number of runners left on base when the batter made an out or the inning ended. |
| `season_stats_batting_sac_bunts` | integer | Season-to-date number of sacrifice bunts executed by the batter. |
| `season_stats_batting_sac_flies` | integer | Season-to-date number of sacrifice flies hit by the batter that scored a run. |
| `season_stats_batting_babip` | character | Season-to-date Batting Average on Balls In Play (BABIP), measuring batting average excluding strikeouts and home runs. |
| `season_stats_batting_ground_outs_to_airouts` | character | Season-to-date ratio of ground outs to air outs, indicating the batter's tendency to hit the ball on the ground versus in the air. |
| `season_stats_batting_catchers_interference` | integer | Season-to-date number of times the batter reached base due to catcher's interference. |
| `season_stats_batting_pickoffs` | integer | Season-to-date number of times the batter was picked off base by a pitcher or catcher. |
| `season_stats_batting_at_bats_per_home_run` | character | Season-to-date ratio of at-bats per home run, reflecting the batter's home run frequency. |
| `season_stats_batting_pop_outs` | integer | Season-to-date number of outs recorded by the batter on pop-ups caught in the infield. |
| `season_stats_batting_line_outs` | integer | Season-to-date number of outs recorded by the batter on line drives caught. |
| `season_stats_pitching_games_played` | integer | Season-to-date number of games the pitcher was active on the roster (may include non-pitching appearances). |
| `season_stats_pitching_games_started` | integer | Season-to-date number of games in which the pitcher was the starting pitcher. |
| `season_stats_pitching_fly_outs` | integer | Season-to-date number of outs recorded by the pitcher on fly balls. |
| `season_stats_pitching_ground_outs` | integer | Season-to-date number of outs recorded by the pitcher on ground balls. |
| `season_stats_pitching_air_outs` | integer | Season-to-date number of outs recorded by the pitcher on balls hit in the air. |
| `season_stats_pitching_runs` | integer | Season-to-date total runs (earned and unearned) allowed by the pitcher. |
| `season_stats_pitching_doubles` | integer | Season-to-date number of doubles allowed by the pitcher. |
| `season_stats_pitching_triples` | integer | Season-to-date number of triples allowed by the pitcher. |
| `season_stats_pitching_home_runs` | integer | Season-to-date number of home runs allowed by the pitcher. |
| `season_stats_pitching_strike_outs` | integer | Season-to-date number of batters struck out by the pitcher. |
| `season_stats_pitching_base_on_balls` | integer | Season-to-date total walks (bases on balls) issued by the pitcher, including intentional walks. |
| `season_stats_pitching_intentional_walks` | integer | Season-to-date number of intentional walks (IBB) issued by the pitcher. |
| `season_stats_pitching_hits` | integer | Season-to-date number of hits allowed by the pitcher. |
| `season_stats_pitching_hit_by_pitch` | integer | Season-to-date number of hit-by-pitch events while the pitcher was pitching (alternate field name for hit_batsmen). |
| `season_stats_pitching_at_bats` | integer | Season-to-date number of at-bats faced by the pitcher (excluding walks, HBP, and sacrifices). |
| `season_stats_pitching_obp` | character | Season-to-date on-base percentage allowed by the pitcher (opponents' OBP against this pitcher). |
| `season_stats_pitching_caught_stealing` | integer | Season-to-date number of baserunners caught stealing while the pitcher was on the mound. |
| `season_stats_pitching_stolen_bases` | integer | Season-to-date number of stolen bases allowed while the pitcher was pitching. |
| `season_stats_pitching_stolen_base_percentage` | character | Season-to-date percentage of stolen base attempts that were successful while the pitcher was on the mound. |
| `season_stats_pitching_caught_stealing_percentage` | character | Season-to-date percentage of stolen base attempts that were thrown out while the pitcher was pitching. |
| `season_stats_pitching_number_of_pitches` | integer | Season-to-date total number of pitches thrown by the pitcher. |
| `season_stats_pitching_era` | character | Season-to-date Earned Run Average (ERA) for the pitcher, expressed as earned runs per nine innings. |
| `season_stats_pitching_innings_pitched` | character | Season-to-date total innings pitched, expressed as a decimal where each out is one-third of an inning. |
| `season_stats_pitching_wins` | integer | Season-to-date number of wins credited to the pitcher. |
| `season_stats_pitching_losses` | integer | Season-to-date number of losses charged to the pitcher. |
| `season_stats_pitching_saves` | integer | Season-to-date number of saves recorded by the pitcher. |
| `season_stats_pitching_save_opportunities` | integer | Season-to-date number of save opportunities the pitcher entered (leads of three runs or fewer in the seventh inning or later, or entering with the tying run on base). |
| `season_stats_pitching_holds` | integer | Season-to-date number of holds recorded by the pitcher (relief appearance maintaining a lead without a save situation). |
| `season_stats_pitching_blown_saves` | integer | Season-to-date number of blown save opportunities for the pitcher. |
| `season_stats_pitching_earned_runs` | integer | Season-to-date number of earned runs allowed by the pitcher. |
| `season_stats_pitching_whip` | character | Season-to-date Walks plus Hits per Inning Pitched (WHIP), measuring baserunners allowed per inning. |
| `season_stats_pitching_batters_faced` | integer | Season-to-date total number of batters faced by the pitcher. |
| `season_stats_pitching_outs` | integer | Season-to-date total number of outs recorded by the pitcher. |
| `season_stats_pitching_games_pitched` | integer | Season-to-date number of games in which the pitcher appeared. |
| `season_stats_pitching_complete_games` | integer | Season-to-date number of complete games pitched by the pitcher. |
| `season_stats_pitching_shutouts` | integer | Season-to-date number of complete-game shutouts pitched. |
| `season_stats_pitching_balls` | integer | Season-to-date number of ball calls recorded against the pitcher. |
| `season_stats_pitching_strikes` | integer | Season-to-date total number of strikes thrown by the pitcher. |
| `season_stats_pitching_strike_percentage` | character | Season-to-date percentage of all pitches thrown that were strikes. |
| `season_stats_pitching_hit_batsmen` | integer | Season-to-date number of batters hit by a pitch thrown by the pitcher. |
| `season_stats_pitching_balks` | integer | Season-to-date number of balks called against the pitcher. |
| `season_stats_pitching_wild_pitches` | integer | Season-to-date number of wild pitches thrown by the pitcher. |
| `season_stats_pitching_pickoffs` | integer | Season-to-date number of pickoffs executed by the pitcher. |
| `season_stats_pitching_ground_outs_to_airouts` | character | Season-to-date ratio of ground ball outs to air ball outs allowed by the pitcher. |
| `season_stats_pitching_rbi` | integer | Season-to-date number of RBI allowed (runs batted in by opposing batters) while this pitcher was pitching. |
| `season_stats_pitching_win_percentage` | character | Season-to-date winning percentage for the pitcher (wins divided by decisions). |
| `season_stats_pitching_pitches_per_inning` | character | Season-to-date average number of pitches thrown per inning by the pitcher. |
| `season_stats_pitching_games_finished` | integer | Season-to-date number of games in which the pitcher was the last pitcher used by their team. |
| `season_stats_pitching_strikeout_walk_ratio` | character | Season-to-date ratio of strikeouts to walks, measuring the pitcher's command and dominance. |
| `season_stats_pitching_strikeouts_per9_inn` | character | Season-to-date strikeouts recorded per nine innings pitched (K/9), a rate measure of strikeout ability. |
| `season_stats_pitching_walks_per9_inn` | character | Season-to-date walks issued per nine innings pitched (BB/9), a rate measure of control. |
| `season_stats_pitching_hits_per9_inn` | character | Season-to-date hits allowed per nine innings pitched, a rate stat measuring hit prevention. |
| `season_stats_pitching_runs_scored_per9` | character | Season-to-date total runs (including unearned) allowed per nine innings pitched. |
| `season_stats_pitching_home_runs_per9` | character | Season-to-date home runs allowed per nine innings pitched. |
| `season_stats_pitching_inherited_runners` | integer | Season-to-date number of baserunners already on base when the pitcher entered the game. |
| `season_stats_pitching_inherited_runners_scored` | integer | Season-to-date number of inherited runners who eventually scored while or after the pitcher was pitching. |
| `season_stats_pitching_catchers_interference` | integer | Season-to-date number of times the pitcher benefited from a catcher's interference call. |
| `season_stats_pitching_sac_bunts` | integer | Season-to-date number of sacrifice bunts allowed by the pitcher. |
| `season_stats_pitching_sac_flies` | integer | Season-to-date number of sacrifice flies allowed by the pitcher. |
| `season_stats_pitching_passed_ball` | integer | Season-to-date number of passed balls that occurred while the pitcher was pitching. |
| `season_stats_pitching_pop_outs` | integer | Season-to-date number of outs recorded by the pitcher on pop-ups caught in the infield. |
| `season_stats_pitching_line_outs` | integer | Season-to-date number of outs recorded by the pitcher on line drives caught. |
| `season_stats_fielding_caught_stealing` | integer | Season-to-date number of baserunners caught stealing by the player (typically a catcher stat). |
| `season_stats_fielding_stolen_bases` | integer | Season-to-date number of stolen bases allowed by the player while fielding (typically catcher). |
| `season_stats_fielding_stolen_base_percentage` | character | Season-to-date percentage of stolen base attempts against the player that were successful (catcher perspective). |
| `season_stats_fielding_caught_stealing_percentage` | character | Season-to-date percentage of stolen base attempts that the player (usually a catcher) threw out. |
| `season_stats_fielding_assists` | integer | Season-to-date number of fielding assists recorded by the player (touching the ball before a putout by a teammate). |
| `season_stats_fielding_put_outs` | integer | Season-to-date number of putouts recorded by the player (directly retiring a baserunner or batter). |
| `season_stats_fielding_errors` | integer | Season-to-date number of fielding errors committed by the player. |
| `season_stats_fielding_chances` | integer | Season-to-date total fielding chances for the player (putouts + assists + errors). |
| `season_stats_fielding_fielding` | character | Season-to-date fielding percentage for the player, calculated as (putouts + assists) / total chances. |
| `season_stats_fielding_passed_ball` | integer | Season-to-date number of passed balls charged to the player (catcher-specific). |
| `season_stats_fielding_pickoffs` | integer | Season-to-date number of pickoffs credited to the player as a fielder. |
| `game_status_is_current_batter` | logical | Indicates whether the player is currently at bat at the moment the boxscore was captured. |
| `game_status_is_current_pitcher` | logical | Indicates whether the player is currently pitching at the moment the boxscore was captured. |
| `game_status_is_on_bench` | logical | Indicates whether the player is currently on the bench (not in the active lineup) at time of capture. |
| `game_status_is_substitute` | logical | Indicates whether the player entered the game as a substitute for another player. |
| `stats_fielding_games_started` | double | Indicator of whether the player started at a fielding position in this game. |
| `season_stats_fielding_games_started` | double | Season-to-date number of games in which the player started at a fielding position. |
| `season_stats_pitching_pitches_thrown` | double | Season-to-date total pitches thrown by the pitcher (may differ from number_of_pitches if strikes/balls are tracked separately). |
| `stats_pitching_summary` | character | Condensed text summary of the pitcher's performance line (e.g., '6.0 IP, 2 ER, 8 K') for display purposes. |
| `stats_pitching_games_played` | double | Number of games the pitcher appeared in for this boxscore row (typically 1). |
| `stats_pitching_games_started` | double | Indicator of whether the pitcher was the starting pitcher in this game. |
| `stats_pitching_fly_outs` | double | Number of outs recorded by the pitcher on fly balls in this game. |
| `stats_pitching_ground_outs` | double | Number of outs recorded by the pitcher on ground balls in this game. |
| `stats_pitching_air_outs` | double | Number of outs recorded by the pitcher on balls hit in the air in this game. |
| `stats_pitching_runs` | double | Total runs (earned and unearned) allowed by the pitcher in this game. |
| `stats_pitching_doubles` | double | Number of doubles allowed by the pitcher in this game. |
| `stats_pitching_triples` | double | Number of triples allowed by the pitcher in this game. |
| `stats_pitching_home_runs` | double | Number of home runs allowed by the pitcher in this game. |
| `stats_pitching_strike_outs` | double | Number of batters struck out by the pitcher in this game. |
| `stats_pitching_base_on_balls` | double | Number of walks (bases on balls) issued by the pitcher in this game, including intentional walks. |
| `stats_pitching_intentional_walks` | double | Number of intentional walks (IBB) issued by the pitcher in this game. |
| `stats_pitching_hits` | double | Number of hits allowed by the pitcher in this game. |
| `stats_pitching_hit_by_pitch` | double | Number of hit-by-pitch events while the pitcher was pitching in this game (alternate field for hit_batsmen). |
| `stats_pitching_at_bats` | double | Number of at-bats faced by the pitcher (excluding walks, HBP, and sacrifices) in this game. |
| `stats_pitching_caught_stealing` | double | Number of baserunners caught stealing while the pitcher was on the mound in this game. |
| `stats_pitching_stolen_bases` | double | Number of stolen bases allowed while the pitcher was pitching in this game. |
| `stats_pitching_stolen_base_percentage` | character | Percentage of stolen base attempts that were successful while the pitcher was on the mound in this game. |
| `stats_pitching_number_of_pitches` | double | Total number of pitches thrown by the pitcher in this game. |
| `stats_pitching_innings_pitched` | character | Total innings pitched by the pitcher in this game, expressed as a decimal (each out counts as one-third of an inning). |
| `stats_pitching_wins` | double | Indicator of whether the pitcher was credited with the win in this game. |
| `stats_pitching_losses` | double | Indicator of whether the pitcher was charged with the loss in this game. |
| `stats_pitching_saves` | double | Indicator of whether the pitcher recorded a save in this game. |
| `stats_pitching_save_opportunities` | double | Number of save opportunities the pitcher entered in this game. |
| `stats_pitching_holds` | double | Number of holds recorded by the pitcher in this game. |
| `stats_pitching_blown_saves` | double | Number of blown save opportunities for the pitcher in this game. |
| `stats_pitching_earned_runs` | double | Number of earned runs allowed by the pitcher in this game. |
| `stats_pitching_batters_faced` | double | Total number of batters faced by the pitcher in this game. |
| `stats_pitching_outs` | double | Total number of outs recorded by the pitcher in this game. |
| `stats_pitching_games_pitched` | double | Number of pitching appearances for the pitcher in this game (typically 1). |
| `stats_pitching_complete_games` | double | Indicator of whether the pitcher threw a complete game in this appearance. |
| `stats_pitching_shutouts` | double | Indicator of whether the pitcher recorded a complete-game shutout in this game. |
| `stats_pitching_pitches_thrown` | double | Total pitches thrown by the pitcher in this game (may differ from number_of_pitches depending on tracking method). |
| `stats_pitching_balls` | double | Number of ball calls recorded against the pitcher in this game. |
| `stats_pitching_strikes` | double | Total number of strikes thrown by the pitcher in this game. |
| `stats_pitching_strike_percentage` | character | Percentage of all pitches thrown that were strikes in this game. |
| `stats_pitching_hit_batsmen` | double | Number of batters hit by a pitch thrown by the pitcher in this game. |
| `stats_pitching_balks` | double | Number of balks called against the pitcher in this game. |
| `stats_pitching_wild_pitches` | double | Number of wild pitches thrown by the pitcher in this game. |
| `stats_pitching_pickoffs` | double | Number of pickoffs executed by the pitcher in this game. |
| `stats_pitching_rbi` | double | Number of RBI allowed (runs batted in by opposing batters off this pitcher) in this game. |
| `stats_pitching_games_finished` | double | Indicator of whether the pitcher was the last pitcher used by their team in this game. |
| `stats_pitching_runs_scored_per9` | character | Total runs (including unearned) allowed per nine innings rate for the pitcher in this game. |
| `stats_pitching_home_runs_per9` | character | Home runs allowed per nine innings rate for the pitcher in this game. |
| `stats_pitching_inherited_runners` | double | Number of baserunners already on base when the pitcher entered the game. |
| `stats_pitching_inherited_runners_scored` | double | Number of inherited runners who scored while or after the pitcher was pitching in this game. |
| `stats_pitching_catchers_interference` | double | Number of catcher's interference calls that occurred while the pitcher was pitching in this game. |
| `stats_pitching_sac_bunts` | double | Number of sacrifice bunts allowed by the pitcher in this game. |
| `stats_pitching_sac_flies` | double | Number of sacrifice flies allowed by the pitcher in this game. |
| `stats_pitching_passed_ball` | double | Number of passed balls that occurred while the pitcher was pitching in this game. |
| `stats_pitching_pop_outs` | double | Number of outs recorded by the pitcher on infield pop-ups in this game. |
| `stats_pitching_line_outs` | double | Number of outs recorded by the pitcher on line drives caught in this game. |
| `stats_pitching_note` | character | Supplementary note or annotation attached to the pitcher's boxscore line (e.g., indicating a special circumstance). |
| `stats_batting_note` | character | Supplementary note or annotation attached to the batter's boxscore line (e.g., indicating a special circumstance). |

**Row type:** `MlbBoxscoreRow` (exported from the package root).

### Returns — `mlb_conference` / `mlbConference`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `abbreviation` | character | Short abbreviation. |
| `has_wildcard` | logical | Whether the season has a wild card round. |
| `name_short` | character |  |
| `league_id` | integer | League MLBAM ID. |
| `league_link` | character | API link to the league. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |

**Row type:** `MlbConferenceRow` (exported from the package root).

### Returns — `mlb_conferences` / `mlbConferences`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `abbreviation` | character | Short abbreviation. |
| `has_wildcard` | logical | Whether the season has a wild card round. |
| `name_short` | character |  |
| `league_id` | integer | League MLBAM ID. |
| `league_link` | character | API link to the league. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |

**Row type:** `MlbConferencesRow` (exported from the package root).

### Returns — `mlb_datacasters` / `mlbDatacasters`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbDatacastersRow` (exported from the package root).

### Returns — `mlb_draft_latest` / `mlbDraftLatest`

| col_name | type | description |
|---|---|---|
| `number` | integer | Jersey number. |
| `next_up` | character | Indicates whether this draft slot is the next pick to be made in the current draft. |
| `pick_pick_round` | character | Draft round in which this pick was made (e.g., '1', '2', 'CB-A' for competitive balance). |
| `pick_pick_number` | integer | Overall pick number of this selection counting sequentially across all rounds of the draft. |
| `pick_display_pick_number` | integer | The formatted overall pick number displayed publicly for this draft selection. |
| `pick_round_pick_number` | integer | Pick number within the specific draft round (i.e., the Nth pick in that round). |
| `pick_signing_bonus` | character | Reported or slotted signing bonus amount associated with this draft pick. |
| `pick_home_city` | character | City of the draftee's listed home address at the time of the draft. |
| `pick_home_state` | character | State or province of the draftee's listed home address at the time of the draft. |
| `pick_home_country` | character | Country of the draftee's listed home address at the time of the draft. |
| `pick_school_name` | character | Name of the high school or college the draftee attended before being drafted. |
| `pick_school_school_class` | character | Academic class or level of the draftee at their school (e.g., High School, Junior, Senior). |
| `pick_school_city` | character | City of the high school or college the draftee attended before being drafted. |
| `pick_school_country` | character | Country of the school the draftee attended. |
| `pick_school_state` | character | State of the school the draftee attended. |
| `pick_headshot_link` | character | URL to the headshot image of the drafted player on the MLB Stats API CDN. |
| `pick_person_id` | integer | Unique MLB Stats API (MLBAM) identifier for the drafted player. |
| `pick_person_full_name` | character | Player's complete display name as used throughout the MLB Stats API. |
| `pick_person_link` | character | Relative URL path to the player's resource in the MLB Stats API. |
| `pick_person_first_name` | character | The player's legal or preferred first name. |
| `pick_person_last_name` | character | The player's legal or preferred last name. |
| `pick_person_birth_date` | character | Date of birth of the drafted player in ISO 8601 format. |
| `pick_person_current_age` | integer | Age of the drafted player in years at the time of the data retrieval. |
| `pick_person_birth_city` | character | City where the drafted player was born. |
| `pick_person_birth_state_province` | character | State or province where the drafted player was born. |
| `pick_person_birth_country` | character | Country where the drafted player was born. |
| `pick_person_height` | character | Player's height in feet-and-inches notation (e.g., 6' 2"). |
| `pick_person_weight` | integer | Player's weight in pounds as recorded by the MLB Stats API. |
| `pick_person_active` | logical | Boolean flag indicating whether the drafted player is currently on an active MLB roster. |
| `pick_person_primary_position_code` | character | Numeric or short code identifying the player's primary fielding position. |
| `pick_person_primary_position_name` | character | Full name of the player's primary fielding position (e.g., Shortstop, Center Field). |
| `pick_person_primary_position_type` | character | Broad classification of the player's position role (e.g., Pitcher, Infielder, Outfielder). |
| `pick_person_primary_position_abbreviation` | character | Short abbreviation for the player's primary fielding position (e.g., SS, CF, SP). |
| `pick_person_use_name` | character | The first name or nickname the player prefers to use publicly. |
| `pick_person_use_last_name` | character | The last name the player prefers to use publicly, which may differ from the legal last name. |
| `pick_person_middle_name` | character | The player's middle name as recorded by the MLB Stats API. |
| `pick_person_boxscore_name` | character | Abbreviated name format used for the player on official MLB box scores. |
| `pick_person_gender` | character | Recorded gender of the drafted player. |
| `pick_person_is_player` | logical | Boolean flag indicating whether this person is classified as an active player in the MLB Stats API. |
| `pick_person_is_verified` | logical | Boolean flag indicating whether the player's profile has been verified by MLB. |
| `pick_person_draft_year` | integer | The MLB draft year in which this player was originally selected. |
| `pick_person_bat_side_code` | character | Single-letter code for the player's batting handedness (e.g., R, L, S for switch). |
| `pick_person_bat_side_description` | character | Full description of the player's batting side (e.g., Right, Left, Switch). |
| `pick_person_pitch_hand_code` | character | Single-letter code for the player's pitching handedness (e.g., R, L, S). |
| `pick_person_pitch_hand_description` | character | Full description of the player's pitching hand (e.g., Right, Left, Switch). |
| `pick_person_name_first_last` | character | Player's display name in first-last format, typically matching the broadcast name. |
| `pick_person_name_slug` | character | URL-safe slug derived from the player's name for use in web links. |
| `pick_person_first_last_name` | character | Player's name formatted as first name followed by last name. |
| `pick_person_last_first_name` | character | Player's name formatted as last name followed by first name. |
| `pick_person_last_init_name` | character | Player's name formatted as last name followed by first initial. |
| `pick_person_init_last_name` | character | Player's name formatted as first initial followed by last name (e.g., J. Smith). |
| `pick_person_full_fml_name` | character | Player's full name in first-middle-last order as recorded by the MLB Stats API. |
| `pick_person_full_lfm_name` | character | Player's full name in last-first-middle order as recorded by the MLB Stats API. |
| `pick_person_strike_zone_top` | double | Upper boundary of the player's personalized strike zone in feet from the ground. |
| `pick_person_strike_zone_bottom` | double | Lower boundary of the player's personalized strike zone in feet from the ground. |
| `pick_person_xref_ids` | character | Serialized cross-reference identifiers linking the player to external data systems. |
| `pick_team_spring_league_id` | integer | MLB Stats API identifier for the team's spring training league. |
| `pick_team_spring_league_name` | character | Full name of the spring training league the team belongs to. |
| `pick_team_spring_league_link` | character | Relative URL path to the spring training league resource in the MLB Stats API. |
| `pick_team_spring_league_abbreviation` | character | Abbreviation for the spring training league the team participates in (e.g., Cactus, Grapefruit). |
| `pick_team_all_star_status` | character | All-Star game affiliation status of the team (e.g., American League, National League). |
| `pick_team_id` | integer | Unique MLB Stats API identifier for the team that made this draft pick. |
| `pick_team_name` | character | Full official name of the MLB team that made this pick (e.g., New York Yankees). |
| `pick_team_link` | character | Relative URL path to the team resource in the MLB Stats API. |
| `pick_team_season` | integer | MLB season year for which this team's metadata snapshot applies. |
| `pick_team_venue_id` | integer | MLB Stats API identifier for the team's regular-season home ballpark. |
| `pick_team_venue_name` | character | Name of the team's regular-season home ballpark (e.g., Yankee Stadium). |
| `pick_team_venue_link` | character | Relative URL path to the team's regular-season home venue in the MLB Stats API. |
| `pick_team_spring_venue_id` | integer | MLB Stats API identifier for the team's spring training ballpark. |
| `pick_team_spring_venue_link` | character | Relative URL path to the spring training venue resource in the MLB Stats API. |
| `pick_team_team_code` | character | Short internal code used by MLB to identify the team in system contexts. |
| `pick_team_file_code` | character | Lowercase file-system-safe code used internally by MLB to identify the team. |
| `pick_team_abbreviation` | character | Standard two- or three-letter abbreviation for the MLB team that made this pick. |
| `pick_team_team_name` | character | The nickname portion of the team's full name (e.g., Yankees, Dodgers). |
| `pick_team_location_name` | character | Geographic location name (city/metro) associated with the team (e.g., New York). |
| `pick_team_first_year_of_play` | character | Year in which the selecting franchise first played as an MLB team. |
| `pick_team_league_id` | integer | MLB Stats API identifier for the league (American or National) of the selecting team. |
| `pick_team_league_name` | character | Full name of the league the selecting team belongs to (e.g., American League). |
| `pick_team_league_link` | character | Relative URL path to the league resource in the MLB Stats API. |
| `pick_team_division_id` | integer | MLB Stats API identifier for the division the selecting team belongs to. |
| `pick_team_division_name` | character | Full name of the division the selecting team belongs to (e.g., AL East). |
| `pick_team_division_link` | character | Relative URL path to the division resource in the MLB Stats API. |
| `pick_team_sport_id` | integer | MLB Stats API identifier for the sport classification (MLB = 1). |
| `pick_team_sport_link` | character | Relative URL path to the sport resource in the MLB Stats API. |
| `pick_team_sport_name` | character | Full name of the sport classification for the team (e.g., Major League Baseball). |
| `pick_team_short_name` | character | Shortened version of the team name used in space-constrained display contexts. |
| `pick_team_franchise_name` | character | Historical franchise name that persists across any team relocations or renames. |
| `pick_team_club_name` | character | Informal club or nickname portion of the team's full name (e.g., Yankees, Red Sox). |
| `pick_team_active` | logical | Boolean flag indicating whether the selecting MLB franchise is currently active. |
| `pick_draft_type_code` | character | Short code identifying the type of draft (e.g., amateur, Rule 5) for this pick. |
| `pick_draft_type_description` | character | Human-readable description of the draft type associated with this pick. |
| `pick_is_drafted` | logical | Boolean flag indicating whether this draft slot has been filled with an actual selection. |
| `pick_is_pass` | logical | Boolean flag indicating whether the selecting team passed on this pick rather than making a selection. |
| `pick_year` | character | MLB draft year for which this pick record applies. |

**Row type:** `MlbDraftLatestRow` (exported from the package root).

### Returns — `mlb_free_agents` / `mlbFreeAgents`

| col_name | type | description |
|---|---|---|
| `notes` | character | Notes. |
| `date_declared` | character | Date the player declared free agency (YYYY-MM-DD). |
| `player_id` | integer | stats.ncaa.org player identifier. |
| `player_full_name` | character | Player full name. |
| `player_link` | character | API relative link to the player. |
| `original_team_id` | double | Team id the player left. |
| `original_team_name` | character | Name of the team the player left. |
| `original_team_link` | character | API relative link to the original team. |
| `new_team_link` | character | API relative link to the new team. |
| `position_code` | character | Numeric scorekeeping position code. |
| `position_name` | character | Position name. |
| `position_type` | character | Position category (e.g. 'Pitcher', 'Infielder'). |
| `position_abbreviation` | character | Position abbreviation. |
| `date_signed` | character | Date the player signed a new contract (YYYY-MM-DD). |
| `new_team_id` | double | Team id the player signed with. |
| `new_team_name` | character | Name of the team the player signed with. |
| `sort_order` | double | Display sort order for the sport. |

**Row type:** `MlbFreeAgentsRow` (exported from the package root).

### Returns — `mlb_game_changes` / `mlbGameChanges`

| col_name | type | description |
|---|---|---|
| `schedule_date` | character | The calendar date for which schedule changes are being reported, identifying when rescheduled or suspended games occurred. |
| `game_pk` | integer | Unique game identifier. |
| `game_guid` | character | Globally unique game identifier (GUID). |
| `link` | character | API link to the game feed. |
| `game_type` | character | Game type code (R, P, etc.). |
| `season` | character | Season year. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `official_date` | character | Official game date (YYYY-MM-DD). |
| `is_tie` | logical | Whether the game ended in a tie. |
| `game_number` | integer | Game number within a doubleheader. |
| `public_facing` | logical | Whether the game is public-facing. |
| `double_header` | character | Doubleheader indicator ('N', 'S', 'Y'). |
| `gameday_type` | character | Gameday data feed type. |
| `tiebreaker` | character | Whether the game is a tiebreaker. |
| `calendar_event_id` | character | Calendar event identifier. |
| `season_display` | character | Display string for the season. |
| `day_night` | character | Day or night game indicator. |
| `scheduled_innings` | integer | Scheduled number of innings. |
| `reverse_home_away_status` | logical | Whether home/away teams are reversed. |
| `inning_break_length` | integer | Length of inning breaks in seconds. |
| `games_in_series` | double | Number of games in the series. |
| `series_game_number` | double | Game number within the series. |
| `series_description` | character | Description of the series. |
| `record_source` | character | Source of the schedule record. |
| `if_necessary` | character | Whether the game is played only if necessary. |
| `if_necessary_description` | character | Description of the if-necessary status. |
| `status_abstract_game_state` | character | Abstract game state (e.g. 'Final'). |
| `status_coded_game_state` | character | Coded game state. |
| `status_detailed_state` | character | Detailed game state. |
| `status_status_code` | character | Status code for the game. |
| `status_start_time_tbd` | logical | Whether the start time is TBD. |
| `status_abstract_game_code` | character | Abstract game state code. |
| `teams_away_team_id` | integer | Away team MLBAM ID. |
| `teams_away_team_name` | character | Away team name. |
| `teams_away_team_link` | character | API link to the away team. |
| `teams_away_league_record_wins` | integer | Away team league-record wins. |
| `teams_away_league_record_losses` | integer | Away team league-record losses. |
| `teams_away_league_record_ties` | integer | Away team league-record ties. |
| `teams_away_league_record_pct` | character | Away team winning percentage. |
| `teams_away_score` | integer | Away team score. |
| `teams_away_is_winner` | logical | Whether the away team won. |
| `teams_away_split_squad` | logical | Whether the away team is a split squad. |
| `teams_away_series_number` | double | Away team's series number. |
| `teams_home_team_id` | integer | Home team MLBAM ID. |
| `teams_home_team_name` | character | Home team name. |
| `teams_home_team_link` | character | API link to the home team. |
| `teams_home_league_record_wins` | integer | Home team league-record wins. |
| `teams_home_league_record_losses` | integer | Home team league-record losses. |
| `teams_home_league_record_ties` | integer | Home team league-record ties. |
| `teams_home_league_record_pct` | character | Home team winning percentage. |
| `teams_home_score` | integer | Home team score. |
| `teams_home_is_winner` | logical | Whether the home team won. |
| `teams_home_split_squad` | logical | Whether the home team is a split squad. |
| `teams_home_series_number` | double | Home team's series number. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `content_link` | character | API link to the game content. |
| `rescheduled_from` | character | Original date-time the game was rescheduled from. |
| `rescheduled_from_date` | character | Original date the game was rescheduled from. |
| `description` | character | Long-form description text. |
| `status_reason` | character | Reason for the game status (e.g. 'Rain'). |
| `resumed_from` | character | Original date-time if the game was resumed. |
| `resumed_from_date` | character | Original date if the game was resumed. |

**Row type:** `MlbGameChangesRow` (exported from the package root).

### Returns — `mlb_game_pace` / `mlbGamePace`

| col_name | type | description |
|---|---|---|
| `hits_per9_inn` | double | Average number of hits allowed per nine innings across all games in the sample period. |
| `runs_per9_inn` | double | Average number of runs scored per nine innings across all games in the sample period. |
| `pitches_per9_inn` | double | Average number of pitches thrown per nine innings across all games in the sample period. |
| `plate_appearances_per9_inn` | double | Average number of plate appearances occurring per nine innings across all games in the sample period. |
| `hits_per_game` | double | Hits per game. |
| `runs_per_game` | double | Runs per game. |
| `innings_played_per_game` | double | Innings played per game. |
| `pitches_per_game` | double | Pitches per game. |
| `pitchers_per_game` | double | Pitchers used per game. |
| `plate_appearances_per_game` | double | Plate appearances per game. |
| `total_game_time` | character | Total game time (HHH:MM:SS). |
| `total_innings_played` | double | Total innings played. |
| `total_hits` | integer | Total hits. |
| `total_runs` | integer | Total runs. |
| `total_plate_appearances` | integer | Total plate appearances. |
| `total_pitchers` | integer | Total pitchers used. |
| `total_pitches` | integer | Total pitches thrown. |
| `total_games` | integer | Total games on the date. |
| `total7_inn_games` | integer | Total number of seven-inning games played (including doubleheader games). |
| `total9_inn_games` | double | Total number of nine-inning games played in the sample period. |
| `total_extra_inn_games` | integer | Total extra-inning games. |
| `time_per_game` | character | Average time per game (HH:MM:SS). |
| `time_per_pitch` | character | Average time per pitch (HH:MM:SS). |
| `time_per_hit` | character | Average time per hit (HH:MM:SS). |
| `time_per_run` | character | Average time per run (HH:MM:SS). |
| `time_per_plate_appearance` | character | Average time per plate appearance (HH:MM:SS). |
| `time_per9_inn` | character | Average elapsed clock time per nine-inning game formatted as hours and minutes. |
| `time_per77_plate_appearances` | character | Average time per 77 plate appearances, used as a normalized pace benchmark by MLB. |
| `total_extra_inn_time` | character | Total extra-inning time (HHH:MM:SS). |
| `time_per7_inn_game_without_extra_inn` | character | Average elapsed clock time per seven-inning game excluding games that went to extra innings. |
| `total9_inn_games_completed_early` | integer | Number of nine-inning games that were called or suspended before completing nine full innings. |
| `total9_inn_games_without_extra_inn` | double | Number of nine-inning games completed without requiring extra innings. |
| `total9_inn_games_scheduled` | integer | Total number of nine-inning games that were scheduled in the sample period. |
| `hits_per_run` | double | Hits per run. |
| `pitches_per_pitcher` | double | Pitches per pitcher. |
| `season` | character | Season year. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_code` | character | Short sport code (e.g. 'mlb', 'aaa'). |
| `sport_link` | character | API link to the sport. |
| `pr_portal_calculated_fields_total7_inn_games` | integer | Calculated total count of seven-inning games as tallied by the MLB Stats API pace portal. |
| `pr_portal_calculated_fields_total9_inn_games` | double | Calculated total count of nine-inning games as tallied by the MLB Stats API pace portal. |
| `pr_portal_calculated_fields_total_extra_inn_games` | integer | Portal-calculated total extra-inning games. |
| `pr_portal_calculated_fields_time_per7_inn_game` | character | Calculated average game time per seven-inning game as produced by the MLB Stats API pace portal. |
| `pr_portal_calculated_fields_time_per9_inn_game` | character | Calculated average game time per nine-inning game as produced by the MLB Stats API pace portal. |
| `pr_portal_calculated_fields_time_per_extra_inn_game` | character | Portal-calculated time per extra-inning game. |
| `time_per7_inn_game` | character | Average elapsed clock time per seven-inning game formatted as hours and minutes. |
| `total7_inn_games_scheduled` | double | Total number of seven-inning games that were scheduled in the sample period. |
| `total7_inn_games_without_extra_inn` | double | Number of seven-inning games completed without requiring extra innings. |
| `total7_inn_games_completed_early` | double | Number of seven-inning games that were called or completed before the full seven innings were played. |

**Row type:** `MlbGamePaceRow` (exported from the package root).

### Returns — `mlb_game_timestamps` / `mlbGameTimestamps`

| col_name | type | description |
|---|---|---|
| `timecode` | character | A timestamp string representing a specific point in time used to query the MLB Stats API for game state changes. |

**Row type:** `MlbGameTimestampsRow` (exported from the package root).

### Returns — `mlb_high_low` / `mlbHighLow`

| col_name | type | description |
|---|---|---|
| `total_splits` | integer | Total number of splits in the leaderboard. |
| `exemptions` | character | Serialized list of exemption codes or player IDs excluded from the high/low statistical split calculation. |
| `splits` | character | Splits. |
| `splits_tied_with_offset` | character | Players tied at the offset boundary. |
| `splits_tied_with_limit` | character | Players tied at the limit boundary. |
| `season` | character | Season year. |
| `combined_stats` | logical | Whether the stat combines multiple split sources. |
| `group_display_name` | character | Stat group display name. |
| `game_type_id` | character | Game type code (e.g., R for regular season). |
| `game_type_description` | character | Game type description. |
| `sort_stat_name` | character | Snake-case name of the sorted statistic (e.g. 'at_bats'). |
| `sort_stat_lookup_param` | character | API lookup parameter for the sorted statistic (e.g. 'atBats'). |
| `sort_stat_is_counting` | logical | Whether the sorted statistic is a counting stat. |
| `sort_stat_label` | character | Human-readable label of the sorted statistic (e.g. 'At bats'). |
| `sort_stat_stat_groups` | character | Serialized list of statistical group identifiers (e.g., hitting, pitching) used to filter this high/low query. |
| `sort_stat_org_types` | character | Serialized list of organization types (e.g., MLB, MiLB) in scope for this high/low stat sort. |
| `sort_stat_high_low_types` | character | Serialized list of high/low result type codes (e.g., high, low) applicable to this stat leader query. |
| `sort_stat_streak_levels` | character | Serialized list of streak level codes defining the streak lengths tracked in this high/low query. |

**Row type:** `MlbHighLowRow` (exported from the package root).

### Returns — `mlb_home_run_derby` / `mlbHomeRunDerby`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_state_province` | character | State or province of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `draft_year` | double | Year the player was drafted. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `stats` | character |  |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `current_team_spring_league_id` | double | The MLB Stats API numeric identifier for the spring training league of the player's current team. |
| `current_team_spring_league_name` | character | The full name of the spring training league (e.g., 'Cactus League') for the player's current team. |
| `current_team_spring_league_link` | character | The MLB Stats API relative URL linking to the spring training league resource for the player's current team. |
| `current_team_spring_league_abbreviation` | character | The abbreviation for the Cactus League or Grapefruit League in which the player's current team participates during spring training. |
| `current_team_all_star_status` | character | The All-Star designation status of the player's current team (e.g., which league's All-Star pool the team belongs to). |
| `current_team_id` | integer | Current team MLBAM ID. |
| `current_team_name` | character | Current team name. |
| `current_team_link` | character | API link to the current team. |
| `current_team_season` | integer | The MLB season year for which the player's current team metadata is reported. |
| `current_team_venue_id` | integer | The MLB Stats API numeric identifier for the regular-season home ballpark of the player's current team. |
| `current_team_venue_name` | character | The official name of the regular-season home ballpark for the player's current team. |
| `current_team_venue_link` | character | The MLB Stats API relative URL linking to the regular-season venue resource for the player's current team. |
| `current_team_spring_venue_id` | double | The MLB Stats API numeric identifier for the spring training ballpark used by the player's current team. |
| `current_team_spring_venue_link` | character | The MLB Stats API relative URL linking to the spring training venue resource for the player's current team. |
| `current_team_team_code` | character | The three-letter internal team code used by MLB in legacy data systems and some API references. |
| `current_team_file_code` | character | The lowercase alphabetic file code used by MLB for identifying the team in media and data assets. |
| `current_team_abbreviation` | character | The standard two- or three-letter abbreviation for the player's current MLB team (e.g., 'NYY', 'LAD'). |
| `current_team_team_name` | character | The full official name of the player's current team, including both city and nickname. |
| `current_team_location_name` | character | The city or metropolitan area name associated with the player's current team. |
| `current_team_first_year_of_play` | character | The calendar year in which the player's current franchise first played MLB games. |
| `current_team_league_id` | integer | The MLB Stats API numeric identifier for the league (American League or National League) of the player's current team. |
| `current_team_league_name` | character | The full name of the league (e.g., 'American League') in which the player's current team competes. |
| `current_team_league_link` | character | The MLB Stats API relative URL linking to the league resource for the player's current team. |
| `current_team_division_id` | double | The MLB Stats API numeric identifier for the division in which the player's current team competes. |
| `current_team_division_name` | character | The full name of the division in which the player's current team competes (e.g., 'American League East'). |
| `current_team_division_link` | character | The MLB Stats API relative URL linking to the division resource for the player's current team. |
| `current_team_sport_id` | integer | The MLB Stats API numeric identifier for the sport classification (e.g., 1 for MLB) of the player's current team. |
| `current_team_sport_link` | character | The MLB Stats API relative URL linking to the sport resource associated with the player's current team. |
| `current_team_sport_name` | character | The name of the sport classification for the player's current team (e.g., 'Major League Baseball'). |
| `current_team_short_name` | character | A shortened display name for the player's current team, often used in space-constrained UI contexts. |
| `current_team_franchise_name` | character | The historical franchise name for the player's current team, which may differ from the current team name for relocated clubs. |
| `current_team_club_name` | character | The short club nickname for the player's current team, typically the city-less portion of the franchise name. |
| `current_team_active` | logical | Boolean flag indicating whether the player's current team is an active MLB franchise. |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `last_played_date` | character | Date of last MLB game played. |
| `name_matrilineal` | character | Maternal family name. |
| `current_team_parent_org_name` | character | The name of the parent major-league organization for the player's current team. |
| `current_team_parent_org_id` | double | The MLB Stats API numeric identifier for the parent organization (major-league affiliate) of the player's current team. |

**Row type:** `MlbHomeRunDerbyRow` (exported from the package root).

### Returns — `mlb_home_run_derby_bracket` / `mlbHomeRunDerbyBracket`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_state_province` | character | State or province of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `draft_year` | double | Year the player was drafted. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `stats` | character |  |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `current_team_spring_league_id` | double | MLB Stats API identifier for the spring training league of the participant's current team. |
| `current_team_spring_league_name` | character | Full name of the spring training league the participant's team belongs to. |
| `current_team_spring_league_link` | character | Relative URL path to the spring training league resource in the MLB Stats API. |
| `current_team_spring_league_abbreviation` | character | Abbreviation for the spring training league the participant's team belongs to (e.g., Cactus, Grapefruit). |
| `current_team_all_star_status` | character | All-Star game league affiliation of the participant's current team (e.g., American League, National League). |
| `current_team_id` | integer | Current team MLBAM ID. |
| `current_team_name` | character | Current team name. |
| `current_team_link` | character | API link to the current team. |
| `current_team_season` | integer | MLB season year for which the participant's current team metadata snapshot applies. |
| `current_team_venue_id` | integer | MLB Stats API identifier for the participant's current team's regular-season home ballpark. |
| `current_team_venue_name` | character | Name of the participant's current team's regular-season home ballpark. |
| `current_team_venue_link` | character | Relative URL path to the current team's home venue resource in the MLB Stats API. |
| `current_team_spring_venue_id` | double | MLB Stats API identifier for the spring training ballpark used by the participant's team. |
| `current_team_spring_venue_link` | character | Relative URL path to the spring training venue resource in the MLB Stats API. |
| `current_team_team_code` | character | Short internal code used by MLB to identify the participant's current team in system contexts. |
| `current_team_file_code` | character | Lowercase file-system-safe code used by MLB to identify the participant's current team. |
| `current_team_abbreviation` | character | Standard two- or three-letter abbreviation for the Home Run Derby participant's current MLB team. |
| `current_team_team_name` | character | The nickname portion of the participant's current team name (e.g., Red Sox, Braves). |
| `current_team_location_name` | character | City or metropolitan area name associated with the participant's current team. |
| `current_team_first_year_of_play` | character | Year in which the participant's current franchise first played as an MLB team. |
| `current_team_league_id` | integer | MLB Stats API identifier for the league (American or National) of the participant's current team. |
| `current_team_league_name` | character | Full name of the league the participant's current team belongs to (e.g., National League). |
| `current_team_league_link` | character | Relative URL path to the league resource for the participant's current team in the MLB Stats API. |
| `current_team_division_id` | double | MLB Stats API identifier for the division the participant's current team belongs to. |
| `current_team_division_name` | character | Full name of the division the participant's current team belongs to (e.g., AL East). |
| `current_team_division_link` | character | Relative URL path to the participant's current team's division resource in the MLB Stats API. |
| `current_team_sport_id` | integer | MLB Stats API identifier for the sport classification of the participant's current team (MLB = 1). |
| `current_team_sport_link` | character | Relative URL path to the sport resource for the participant's current team in the MLB Stats API. |
| `current_team_sport_name` | character | Full sport classification name for the participant's current team (e.g., Major League Baseball). |
| `current_team_short_name` | character | Shortened display name of the participant's current team for space-constrained contexts. |
| `current_team_franchise_name` | character | Historical franchise name for the participant's team, persisting across relocations. |
| `current_team_club_name` | character | Informal nickname portion of the participant's current team name (e.g., Yankees, Dodgers). |
| `current_team_active` | logical | Boolean flag indicating whether the participant's current franchise is an active MLB organization. |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `last_played_date` | character | Date of last MLB game played. |
| `name_matrilineal` | character | Maternal family name. |
| `current_team_parent_org_name` | character | Name of the parent MLB organization for the participant's current team. |
| `current_team_parent_org_id` | double | MLB Stats API identifier for the parent MLB organization of the participant's current team, relevant for minor league affiliates. |

**Row type:** `MlbHomeRunDerbyBracketRow` (exported from the package root).

### Returns — `mlb_home_run_derby_pool` / `mlbHomeRunDerbyPool`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_state_province` | character | State or province of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `draft_year` | double | Year the player was drafted. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `stats` | character |  |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `current_team_spring_league_id` | double | The MLB Stats API numeric identifier for the spring training league of the pool participant's current team. |
| `current_team_spring_league_name` | character | The full name of the spring training league for the pool participant's current team. |
| `current_team_spring_league_link` | character | The MLB Stats API relative URL linking to the spring training league resource for the pool participant's current team. |
| `current_team_spring_league_abbreviation` | character | The abbreviation for the spring training league in which the pool participant's current team plays during spring training. |
| `current_team_all_star_status` | character | The All-Star designation status of the pool participant's current team (e.g., which league's All-Star pool the team belongs to). |
| `current_team_id` | integer | Current team MLBAM ID. |
| `current_team_name` | character | Current team name. |
| `current_team_link` | character | API link to the current team. |
| `current_team_season` | integer | The MLB season year for which the pool participant's current team metadata is reported. |
| `current_team_venue_id` | integer | The MLB Stats API numeric identifier for the regular-season home ballpark of the pool participant's current team. |
| `current_team_venue_name` | character | The official name of the regular-season home ballpark for the pool participant's current team. |
| `current_team_venue_link` | character | The MLB Stats API relative URL linking to the regular-season venue resource for the pool participant's current team. |
| `current_team_spring_venue_id` | double | The MLB Stats API numeric identifier for the spring training ballpark used by the pool participant's current team. |
| `current_team_spring_venue_link` | character | The MLB Stats API relative URL linking to the spring training venue resource for the pool participant's current team. |
| `current_team_team_code` | character | The three-letter internal team code used by MLB for the pool participant's team in legacy data systems. |
| `current_team_file_code` | character | The lowercase alphabetic file code used by MLB for identifying the pool participant's team in media and data assets. |
| `current_team_abbreviation` | character | The standard two- or three-letter abbreviation for the Home Run Derby pool participant's current MLB team. |
| `current_team_team_name` | character | The full official name of the pool participant's current team, including both city and nickname. |
| `current_team_location_name` | character | The city or metropolitan area name associated with the pool participant's current team. |
| `current_team_first_year_of_play` | character | The calendar year in which the pool participant's current franchise first played MLB games. |
| `current_team_league_id` | integer | The MLB Stats API numeric identifier for the league of the pool participant's current team. |
| `current_team_league_name` | character | The full name of the league (e.g., 'National League') in which the pool participant's current team competes. |
| `current_team_league_link` | character | The MLB Stats API relative URL linking to the league resource for the pool participant's current team. |
| `current_team_division_id` | double | The MLB Stats API numeric identifier for the division in which the pool participant's current team competes. |
| `current_team_division_name` | character | The full name of the division in which the pool participant's current team competes (e.g., 'National League West'). |
| `current_team_division_link` | character | The MLB Stats API relative URL linking to the division resource for the pool participant's current team. |
| `current_team_sport_id` | integer | The MLB Stats API numeric identifier for the sport classification of the pool participant's current team. |
| `current_team_sport_link` | character | The MLB Stats API relative URL linking to the sport resource associated with the pool participant's current team. |
| `current_team_sport_name` | character | The name of the sport classification for the pool participant's current team (e.g., 'Major League Baseball'). |
| `current_team_short_name` | character | A shortened display name for the pool participant's current team, often used in space-constrained UI contexts. |
| `current_team_franchise_name` | character | The historical franchise name for the pool participant's current team, which may differ from the current team name for relocated clubs. |
| `current_team_club_name` | character | The short club nickname for the pool participant's current team, typically the city-less portion of the franchise name. |
| `current_team_active` | logical | Boolean flag indicating whether the pool participant's current team is an active MLB franchise. |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `last_played_date` | character | Date of last MLB game played. |
| `name_matrilineal` | character | Maternal family name. |
| `current_team_parent_org_name` | character | The name of the parent major-league organization for the pool participant's current team. |
| `current_team_parent_org_id` | double | The MLB Stats API numeric identifier for the parent organization of the pool participant's current team. |

**Row type:** `MlbHomeRunDerbyPoolRow` (exported from the package root).

### Returns — `mlb_jobs` / `mlbJobs`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbJobsRow` (exported from the package root).

### Returns — `mlb_leagues` / `mlbLeagues`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `abbreviation` | character | Short abbreviation. |
| `name_short` | character |  |
| `season_state` | character | A string describing the current phase of the league's season (e.g., 'inProgress', 'offseason', 'preseason'). |
| `has_wild_card` | logical | Boolean flag indicating whether this league includes a wild card playoff format for postseason eligibility. |
| `has_split_season` | logical | Boolean flag indicating whether this league divides its season into two halves with separate standings (as used historically in some minor leagues). |
| `num_games` | double | The total number of regular-season games scheduled per team in this league for the given season. |
| `has_playoff_points` | logical | Boolean flag indicating whether this league uses a playoff points system to determine postseason seeding. |
| `num_teams` | double | Number of teams the player appeared for. |
| `num_wildcard_teams` | double | The number of wild card berths available for postseason entry in this league for the given season. |
| `season` | character | Season year. |
| `org_code` | character | The organizational code identifying the parent body (e.g., 'MLB') governing this league within the MLB Stats API hierarchy. |
| `conferences_in_use` | logical |  |
| `divisions_in_use` | logical |  |
| `sort_order` | integer | Display sort order for the sport. |
| `active` | logical | Whether the player is currently active. |
| `season_date_info_season_id` | character | Season identifier for the date info block. |
| `season_date_info_pre_season_start_date` | character | Preseason start date (YYYY-MM-DD). |
| `season_date_info_pre_season_end_date` | character | Preseason end date (YYYY-MM-DD). |
| `season_date_info_season_start_date` | character | Season start date (YYYY-MM-DD). |
| `season_date_info_spring_start_date` | character | Spring training start date (YYYY-MM-DD). |
| `season_date_info_spring_end_date` | character | Spring training end date (YYYY-MM-DD). |
| `season_date_info_regular_season_start_date` | character | Regular season start date (YYYY-MM-DD). |
| `season_date_info_last_date1st_half` | character | Last date of the first half (YYYY-MM-DD). |
| `season_date_info_all_star_date` | character | All-Star Game date (YYYY-MM-DD). |
| `season_date_info_first_date2nd_half` | character | First date of the second half (YYYY-MM-DD). |
| `season_date_info_regular_season_end_date` | character | Regular season end date (YYYY-MM-DD). |
| `season_date_info_post_season_start_date` | character | Postseason start date (YYYY-MM-DD). |
| `season_date_info_post_season_end_date` | character | Postseason end date (YYYY-MM-DD). |
| `season_date_info_season_end_date` | character | Season end date (YYYY-MM-DD). |
| `season_date_info_offseason_start_date` | character | Offseason start date (YYYY-MM-DD). |
| `season_date_info_off_season_end_date` | character | Offseason end date (YYYY-MM-DD). |
| `season_date_info_season_level_gameday_type` | character | Season-level Gameday data type code. |
| `season_date_info_game_level_gameday_type` | character | Game-level Gameday data type code. |
| `season_date_info_qualifier_plate_appearances` | double | Plate appearances per game needed to qualify. |
| `season_date_info_qualifier_outs_pitched` | double | Outs pitched per game needed to qualify. |
| `sport_id` | double | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |

**Row type:** `MlbLeaguesRow` (exported from the package root).

### Returns — `mlb_linescore` / `mlbLinescore`

| col_name | type | description |
|---|---|---|
| `num` | integer | Inning number. |
| `ordinal_num` | character | Inning ordinal label (e.g. 1st). |
| `home_runs` | integer | Home runs. |
| `home_hits` | integer | Home hits in the inning. |
| `home_errors` | integer | Home errors in the inning. |
| `home_left_on_base` | integer | Home runners left on base in the inning. |
| `away_runs` | integer | Away runs scored in the inning. |
| `away_hits` | integer | Away hits in the inning. |
| `away_errors` | integer | Away errors in the inning. |
| `away_left_on_base` | integer | Away runners left on base in the inning. |

**Row type:** `MlbLinescoreRow` (exported from the package root).

### Returns — `mlb_official_scorers` / `mlbOfficialScorers`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbOfficialScorersRow` (exported from the package root).

### Returns — `mlb_people` / `mlbPeople`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `birth_state_province` | character | State or province of birth. |
| `middle_name` | character | Player middle name. |
| `draft_year` | double | Year the player was drafted. |

**Row type:** `MlbPeopleRow` (exported from the package root).

### Returns — `mlb_person` / `mlbPerson`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |

**Row type:** `MlbPersonRow` (exported from the package root).

### Returns — `mlb_person_game_stats` / `mlbPersonGameStats`

| col_name | type | description |
|---|---|---|
| `total_splits` | double | Total number of splits in the leaderboard. |
| `exemptions` | character | Serialized list of statistical exemptions or special-case flags applied to this player's game-log splits. |
| `splits` | character | Splits. |
| `type_display_name` | character | Stat type display name. |
| `group_display_name` | character | Stat group display name. |

**Row type:** `MlbPersonGameStatsRow` (exported from the package root).

### Returns — `mlb_play_by_play` / `mlbPlayByPlay`

| col_name | type | description |
|---|---|---|
| `pitch_index` | character | A serialized list of indices identifying individual pitch events that occurred within this at-bat. |
| `action_index` | character | A serialized list of indices identifying action-type events (e.g., stolen bases, pickoffs) that occurred within the at-bat. |
| `runner_index` | character | A serialized list of indices identifying baserunner movement events that occurred during or after this play. |
| `runners` | character | A serialized representation of baserunner movement records for this play, including starting base, ending base, and relevant event types. |
| `play_events` | character | A serialized representation of the sequence of individual pitch and action events comprising this at-bat. |
| `play_end_time` | character | The ISO 8601 timestamp marking the conclusion of the entire play (as distinct from a single pitch event) within the game feed. |
| `at_bat_index` | integer | Zero-based index of the at-bat within the game. |
| `result_type` | character | The high-level category of the play result as classified by the MLB Stats API (e.g., 'atBat', 'action'). |
| `result_event` | character | The short categorical label for the play outcome as classified by the MLB Stats API (e.g., 'Strikeout', 'Home Run', 'Walk'). |
| `result_event_type` | character | The snake-cased type identifier for the play outcome used internally by the MLB Stats API (e.g., 'strikeout', 'home_run'). |
| `result_description` | character | A human-readable text description of the play result as reported by the MLB Stats API (e.g., 'Strikeout', 'Single to left field'). |
| `result_rbi` | integer | The number of runs batted in credited to the batter as a result of this play. |
| `result_away_score` | integer | The away team's cumulative run total at the conclusion of this play. |
| `result_home_score` | integer | The home team's cumulative run total at the conclusion of this play. |
| `result_is_out` | logical | Boolean flag indicating whether the play resulted in the batter being retired (i.e., an out was charged to the batter). |
| `about_at_bat_index` | integer | The sequential index of the at-bat within the game to which this play or pitch event belongs. |
| `about_half_inning` | character | Indicates whether the play occurred in the top or bottom half of the inning (e.g., 'top' or 'bottom'). |
| `about_is_top_inning` | logical | Boolean flag indicating whether this play occurred in the top half of the inning (true) or bottom half (false). |
| `about_inning` | integer | The inning number in which this play or pitch event occurred. |
| `about_start_time` | character | The ISO 8601 timestamp marking the start of the play event, used for temporal sequencing within the game feed. |
| `about_end_time` | character | The ISO 8601 timestamp marking the end of the play event, used for temporal sequencing within the game feed. |
| `about_is_complete` | logical | Boolean flag indicating whether the at-bat or play event has concluded (i.e., reached a terminal result). |
| `about_is_scoring_play` | logical | Boolean flag indicating whether this play resulted in one or more runs being scored. |
| `about_has_review` | logical | Boolean flag indicating whether this play was subject to a manager's challenge or umpire review. |
| `about_has_out` | logical | Boolean flag indicating whether this play resulted in at least one out being recorded. |
| `about_captivating_index` | integer | A numeric score assigned by the MLB Stats API reflecting how compelling or exciting a given play was, based on leverage and game context. |
| `count_balls` | integer | The ball count in the current at-bat at the time of this pitch or play event. |
| `count_strikes` | integer | The strike count in the current at-bat at the time of this pitch or play event. |
| `count_outs` | integer | The number of outs recorded in the current half-inning at the time of this pitch or play event. |
| `matchup_batter_id` | integer | The MLB Stats API (MLBAM) numeric identifier for the batter in this play's matchup. |
| `matchup_batter_full_name` | character | The full name of the batter involved in this plate appearance. |
| `matchup_batter_link` | character | The MLB Stats API relative URL linking to the batter's player resource for this matchup. |
| `matchup_bat_side_code` | character | A single-character code indicating the batter's handedness for this matchup (e.g., 'L' for left, 'R' for right, 'S' for switch). |
| `matchup_bat_side_description` | character | The human-readable description of the batter's hitting side for this matchup (e.g., 'Left', 'Right', 'Switch'). |
| `matchup_pitcher_id` | integer | The MLB Stats API (MLBAM) numeric identifier for the pitcher in this play's matchup. |
| `matchup_pitcher_full_name` | character | The full name of the pitcher involved in this plate appearance. |
| `matchup_pitcher_link` | character | The MLB Stats API relative URL linking to the pitcher's player resource for this matchup. |
| `matchup_pitch_hand_code` | character | A single-character code indicating the pitcher's throwing hand for this matchup (e.g., 'L' for left, 'R' for right). |
| `matchup_pitch_hand_description` | character | The human-readable description of the pitcher's throwing arm for this matchup (e.g., 'Left', 'Right'). |
| `matchup_post_on_first_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on first base after the play concluded. |
| `matchup_post_on_first_full_name` | character | The full name of the baserunner on first base after the play concluded, if applicable. |
| `matchup_post_on_first_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on first base after the play. |
| `matchup_batter_hot_cold_zones` | character | A serialized representation of the batter's hot and cold zone effectiveness data for this matchup context. |
| `matchup_pitcher_hot_cold_zones` | character | A serialized representation of the pitcher's hot and cold zone effectiveness data for this matchup context. |
| `matchup_splits_batter` | character | A string describing the batter's situational split relevant to this matchup (e.g., 'vs. Right' or 'vs. Left'). |
| `matchup_splits_pitcher` | character | A string describing the pitcher's situational split relevant to this matchup (e.g., 'vs. Left' or 'vs. Right'). |
| `matchup_splits_men_on_base` | character | A string describing the baserunner configuration applicable to the batter's situational split for this plate appearance. |
| `matchup_post_on_second_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on second base after the play concluded. |
| `matchup_post_on_second_full_name` | character | The full name of the baserunner on second base after the play concluded, if applicable. |
| `matchup_post_on_second_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on second base after the play. |
| `matchup_post_on_third_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on third base after the play concluded. |
| `matchup_post_on_third_full_name` | character | The full name of the baserunner on third base after the play concluded, if applicable. |
| `matchup_post_on_third_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on third base after the play. |
| `review_details_is_overturned` | logical | Boolean flag indicating whether the original on-field call was reversed as a result of the replay review. |
| `review_details_in_progress` | logical | Boolean flag indicating whether the umpire review of this play was still ongoing at the time of data capture. |
| `review_details_review_type` | character | The type of review mechanism applied to this play (e.g., 'managerChallenge', 'umpireReview'). |
| `review_details_challenge_team_id` | double | The MLB Stats API numeric identifier for the team that initiated the manager's challenge review on this play. |

**Row type:** `MlbPlayByPlayRow` (exported from the package root).

### Returns — `mlb_schedule_postseason` / `mlbSchedulePostseason`

| col_name | type | description |
|---|---|---|
| `schedule_date` | character | The calendar date grouping postseason games in this response row, as returned by the MLB Stats API schedule endpoint. |
| `game_pk` | integer | Unique game identifier. |
| `game_guid` | character | Globally unique game identifier (GUID). |
| `link` | character | API link to the game feed. |
| `game_type` | character | Game type code (R, P, etc.). |
| `season` | character | Season year. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `official_date` | character | Official game date (YYYY-MM-DD). |
| `is_tie` | logical | Whether the game ended in a tie. |
| `is_featured_game` | logical | Whether the game is a featured game. |
| `game_number` | integer | Game number within a doubleheader. |
| `public_facing` | logical | Whether the game is public-facing. |
| `double_header` | character | Doubleheader indicator ('N', 'S', 'Y'). |
| `gameday_type` | character | Gameday data feed type. |
| `tiebreaker` | character | Whether the game is a tiebreaker. |
| `calendar_event_id` | character | Calendar event identifier. |
| `season_display` | character | Display string for the season. |
| `day_night` | character | Day or night game indicator. |
| `description` | character | Long-form description text. |
| `scheduled_innings` | integer | Scheduled number of innings. |
| `reverse_home_away_status` | logical | Whether home/away teams are reversed. |
| `inning_break_length` | integer | Length of inning breaks in seconds. |
| `games_in_series` | integer | Number of games in the series. |
| `series_game_number` | integer | Game number within the series. |
| `series_description` | character | Description of the series. |
| `record_source` | character | Source of the schedule record. |
| `if_necessary` | character | Whether the game is played only if necessary. |
| `if_necessary_description` | character | Description of the if-necessary status. |
| `status_abstract_game_state` | character | Abstract game state (e.g. 'Final'). |
| `status_coded_game_state` | character | Coded game state. |
| `status_detailed_state` | character | Detailed game state. |
| `status_status_code` | character | Status code for the game. |
| `status_start_time_tbd` | logical | Whether the start time is TBD. |
| `status_abstract_game_code` | character | Abstract game state code. |
| `teams_away_team_id` | integer | Away team MLBAM ID. |
| `teams_away_team_name` | character | Away team name. |
| `teams_away_team_link` | character | API link to the away team. |
| `teams_away_league_record_wins` | integer | Away team league-record wins. |
| `teams_away_league_record_losses` | integer | Away team league-record losses. |
| `teams_away_league_record_ties` | integer | Away team league-record ties. |
| `teams_away_league_record_pct` | character | Away team winning percentage. |
| `teams_away_score` | integer | Away team score. |
| `teams_away_is_winner` | logical | Whether the away team won. |
| `teams_away_split_squad` | logical | Whether the away team is a split squad. |
| `teams_away_series_number` | integer | Away team's series number. |
| `teams_home_team_id` | integer | Home team MLBAM ID. |
| `teams_home_team_name` | character | Home team name. |
| `teams_home_team_link` | character | API link to the home team. |
| `teams_home_league_record_wins` | integer | Home team league-record wins. |
| `teams_home_league_record_losses` | integer | Home team league-record losses. |
| `teams_home_league_record_ties` | integer | Home team league-record ties. |
| `teams_home_league_record_pct` | character | Home team winning percentage. |
| `teams_home_score` | integer | Home team score. |
| `teams_home_is_winner` | logical | Whether the home team won. |
| `teams_home_split_squad` | logical | Whether the home team is a split squad. |
| `teams_home_series_number` | integer | Home team's series number. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `content_link` | character | API link to the game content. |

**Row type:** `MlbSchedulePostseasonRow` (exported from the package root).

### Returns — `mlb_schedule_postseason_series` / `mlbSchedulePostseasonSeries`

| col_name | type | description |
|---|---|---|
| `total_items` | integer | Total schedule items on the date. |
| `total_games` | integer | Total games on the date. |
| `total_games_in_progress` | integer | Games currently in progress on the date. |
| `games` | character |  |
| `sort_order` | integer | Display sort order for the sport. |
| `series_id` | character | Series identifier (e.g. 'W_1'). |
| `series_sort_number` | integer | Sort number for the series. |
| `series_is_default` | logical | Whether the series is the default series. |
| `series_game_type` | character | Game type code for the series. |

**Row type:** `MlbSchedulePostseasonSeriesRow` (exported from the package root).

### Returns — `mlb_schedule_tied` / `mlbScheduleTied`

| col_name | type | description |
|---|---|---|
| `schedule_date` | character | The calendar date grouping tied (suspended and resumed) games in this response row, as returned by the MLB Stats API schedule endpoint. |
| `game_pk` | integer | Unique game identifier. |
| `game_guid` | character | Globally unique game identifier (GUID). |
| `link` | character | API link to the game feed. |
| `game_type` | character | Game type code (R, P, etc.). |
| `season` | character | Season year. |
| `game_date` | character | Game date (YYYY-MM-DD). |
| `official_date` | character | Official game date (YYYY-MM-DD). |
| `is_tie` | logical | Whether the game ended in a tie. |
| `game_number` | integer | Game number within a doubleheader. |
| `public_facing` | logical | Whether the game is public-facing. |
| `double_header` | character | Doubleheader indicator ('N', 'S', 'Y'). |
| `gameday_type` | character | Gameday data feed type. |
| `tiebreaker` | character | Whether the game is a tiebreaker. |
| `calendar_event_id` | character | Calendar event identifier. |
| `season_display` | character | Display string for the season. |
| `day_night` | character | Day or night game indicator. |
| `scheduled_innings` | integer | Scheduled number of innings. |
| `reverse_home_away_status` | logical | Whether home/away teams are reversed. |
| `inning_break_length` | integer | Length of inning breaks in seconds. |
| `games_in_series` | integer | Number of games in the series. |
| `series_game_number` | integer | Game number within the series. |
| `series_description` | character | Description of the series. |
| `record_source` | character | Source of the schedule record. |
| `if_necessary` | character | Whether the game is played only if necessary. |
| `if_necessary_description` | character | Description of the if-necessary status. |
| `status_abstract_game_state` | character | Abstract game state (e.g. 'Final'). |
| `status_coded_game_state` | character | Coded game state. |
| `status_detailed_state` | character | Detailed game state. |
| `status_status_code` | character | Status code for the game. |
| `status_start_time_tbd` | logical | Whether the start time is TBD. |
| `status_reason` | character | Reason for the game status (e.g. 'Rain'). |
| `status_abstract_game_code` | character | Abstract game state code. |
| `teams_away_team_id` | integer | Away team MLBAM ID. |
| `teams_away_team_name` | character | Away team name. |
| `teams_away_team_link` | character | API link to the away team. |
| `teams_away_league_record_wins` | integer | Away team league-record wins. |
| `teams_away_league_record_losses` | integer | Away team league-record losses. |
| `teams_away_league_record_ties` | integer | Away team league-record ties. |
| `teams_away_league_record_pct` | character | Away team winning percentage. |
| `teams_away_score` | integer | Away team score. |
| `teams_away_split_squad` | logical | Whether the away team is a split squad. |
| `teams_away_series_number` | integer | Away team's series number. |
| `teams_home_team_id` | integer | Home team MLBAM ID. |
| `teams_home_team_name` | character | Home team name. |
| `teams_home_team_link` | character | API link to the home team. |
| `teams_home_league_record_wins` | integer | Home team league-record wins. |
| `teams_home_league_record_losses` | integer | Home team league-record losses. |
| `teams_home_league_record_ties` | integer | Home team league-record ties. |
| `teams_home_league_record_pct` | character | Home team winning percentage. |
| `teams_home_score` | integer | Home team score. |
| `teams_home_split_squad` | logical | Whether the home team is a split squad. |
| `teams_home_series_number` | integer | Home team's series number. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `content_link` | character | API link to the game content. |

**Row type:** `MlbScheduleTiedRow` (exported from the package root).

### Returns — `mlb_season` / `mlbSeason`

| col_name | type | description |
|---|---|---|
| `season_id` | character | stats.ncaa.org season identifier. |
| `has_wildcard` | logical | Whether the season has a wild card round. |
| `pre_season_start_date` | character | Pre-season start date. |
| `pre_season_end_date` | character | Pre-season end date. |
| `season_start_date` | character | Season start date. |
| `spring_start_date` | character | Spring training start date. |
| `spring_end_date` | character | Spring training end date. |
| `regular_season_start_date` | character | Regular season start date. |
| `last_date1st_half` | character | Last date of the first half. |
| `all_star_date` | character | All-Star Game date. |
| `first_date2nd_half` | character | First date of the second half. |
| `regular_season_end_date` | character | Regular season end date. |
| `post_season_start_date` | character | Post-season start date. |
| `post_season_end_date` | character | Post-season end date. |
| `season_end_date` | character | Season end date. |
| `offseason_start_date` | character | Off-season start date. |
| `off_season_end_date` | character | Off-season end date. |
| `season_level_gameday_type` | character | Season-level Gameday data feed type. |
| `game_level_gameday_type` | character | Game-level Gameday data feed type. |
| `qualifier_plate_appearances` | double | Plate appearances per team game to qualify. |
| `qualifier_outs_pitched` | double | Outs pitched per team game to qualify. |

**Row type:** `MlbSeasonRow` (exported from the package root).

### Returns — `mlb_seasons_all` / `mlbSeasonsAll`

| col_name | type | description |
|---|---|---|
| `season_id` | character | stats.ncaa.org season identifier. |
| `has_wildcard` | logical | Whether the season has a wild card round. |
| `pre_season_start_date` | character | Pre-season start date. |
| `season_start_date` | character | Season start date. |
| `regular_season_start_date` | character | Regular season start date. |
| `regular_season_end_date` | character | Regular season end date. |
| `season_end_date` | character | Season end date. |
| `offseason_start_date` | character | Off-season start date. |
| `off_season_end_date` | character | Off-season end date. |
| `season_level_gameday_type` | character | Season-level Gameday data feed type. |
| `game_level_gameday_type` | character | Game-level Gameday data feed type. |
| `qualifier_plate_appearances` | double | Plate appearances per team game to qualify. |
| `qualifier_outs_pitched` | double | Outs pitched per team game to qualify. |
| `post_season_start_date` | character | Post-season start date. |
| `post_season_end_date` | character | Post-season end date. |
| `last_date1st_half` | character | Last date of the first half. |
| `all_star_date` | character | All-Star Game date. |
| `first_date2nd_half` | character | First date of the second half. |
| `pre_season_end_date` | character | Pre-season end date. |
| `spring_start_date` | character | Spring training start date. |
| `spring_end_date` | character | Spring training end date. |

**Row type:** `MlbSeasonsAllRow` (exported from the package root).

### Returns — `mlb_sport` / `mlbSport`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `code` | character | Fielder detail type code. |
| `link` | character | API link to the game feed. |
| `name` | character | Display name. |
| `abbreviation` | character | Short abbreviation. |
| `sort_order` | integer | Display sort order for the sport. |
| `active_status` | logical | Whether the sport/level is active. |

**Row type:** `MlbSportRow` (exported from the package root).

### Returns — `mlb_sport_players` / `mlbSportPlayers`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_state_province` | character | State or province of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `draft_year` | double | Year the player was drafted. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `current_team_id` | integer | Current team MLBAM ID. |
| `current_team_name` | character | Current team name. |
| `current_team_link` | character | API link to the current team. |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `name_matrilineal` | character | Maternal family name. |
| `nick_name` | character | Player nickname. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `last_played_date` | character | Date of last MLB game played. |
| `name_title` | character | Name title. |
| `name_suffix` | character | Name suffix (e.g. Jr., Sr., III). |

**Row type:** `MlbSportPlayersRow` (exported from the package root).

### Returns — `mlb_sports` / `mlbSports`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `code` | character | Fielder detail type code. |
| `link` | character | API link to the game feed. |
| `name` | character | Display name. |
| `abbreviation` | character | Short abbreviation. |
| `sort_order` | integer | Display sort order for the sport. |
| `active_status` | logical | Whether the sport/level is active. |

**Row type:** `MlbSportsRow` (exported from the package root).

### Returns — `mlb_team` / `mlbTeam`

| col_name | type | description |
|---|---|---|
| `all_star_status` | character | All-star status flag. |
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `season` | integer | Season year. |
| `team_code` | character | Internal team code. |
| `file_code` | character | File code abbreviation. |
| `abbreviation` | character | Short abbreviation. |
| `team_name` | character | Team name. |
| `location_name` | character | Team location (city). |
| `first_year_of_play` | character | First year the franchise played. |
| `short_name` | character | Short display name. |
| `franchise_name` | character | Franchise name. |
| `club_name` | character | Club name. |
| `active` | logical | Whether the player is currently active. |
| `spring_league_id` | integer | Spring league MLBAM ID. |
| `spring_league_name` | character | Spring league name. |
| `spring_league_link` | character | API link to the spring league. |
| `spring_league_abbreviation` | character | Spring league abbreviation. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `spring_venue_id` | integer | Spring training venue MLBAM ID. |
| `spring_venue_link` | character | API link to the spring venue. |
| `league_id` | integer | League MLBAM ID. |
| `league_name` | character | League name. |
| `league_link` | character | API link to the league. |
| `division_id` | integer | Division MLBAM ID. |
| `division_name` | character | Division name. |
| `division_link` | character | API link to the division. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |
| `sport_name` | character | Sport name (e.g., Major League Baseball). |

**Row type:** `MlbTeamRow` (exported from the package root).

### Returns — `mlb_team_affiliates` / `mlbTeamAffiliates`

| col_name | type | description |
|---|---|---|
| `all_star_status` | character | All-star status flag. |
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `season` | integer | Season year. |
| `team_code` | character | Internal team code. |
| `file_code` | character | File code abbreviation. |
| `abbreviation` | character | Short abbreviation. |
| `team_name` | character | Team name. |
| `location_name` | character | Team location (city). |
| `first_year_of_play` | character | First year the franchise played. |
| `short_name` | character | Short display name. |
| `franchise_name` | character | Franchise name. |
| `club_name` | character | Club name. |
| `active` | logical | Whether the player is currently active. |
| `spring_league_id` | double | Spring league MLBAM ID. |
| `spring_league_name` | character | Spring league name. |
| `spring_league_link` | character | API link to the spring league. |
| `spring_league_abbreviation` | character | Spring league abbreviation. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `spring_venue_id` | double | Spring training venue MLBAM ID. |
| `spring_venue_link` | character | API link to the spring venue. |
| `league_id` | double | League MLBAM ID. |
| `league_name` | character | League name. |
| `league_link` | character | API link to the league. |
| `division_id` | double | Division MLBAM ID. |
| `division_name` | character | Division name. |
| `division_link` | character | API link to the division. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |
| `sport_name` | character | Sport name (e.g., Major League Baseball). |
| `parent_org_name` | character | Parent organization name. |
| `parent_org_id` | double | Parent organization MLBAM ID. |

**Row type:** `MlbTeamAffiliatesRow` (exported from the package root).

### Returns — `mlb_team_alumni` / `mlbTeamAlumni`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `full_name` | character | Player's full name. |
| `link` | character | API link to the game feed. |
| `first_name` | character | Player first name. |
| `last_name` | character | Player last name. |
| `primary_number` | character | Player uniform number. |
| `birth_date` | character | Date of birth (YYYY-MM-DD). |
| `current_age` | integer | Current age in years. |
| `birth_city` | character | City of birth. |
| `birth_country` | character | Country of birth. |
| `height` | character | Height (feet and inches). |
| `weight` | integer | Weight in pounds. |
| `active` | logical | Whether the player is currently active. |
| `use_name` | character | Preferred first name. |
| `use_last_name` | character | Preferred last name. |
| `middle_name` | character | Player middle name. |
| `boxscore_name` | character | Name as shown in box scores. |
| `nick_name` | character | Player nickname. |
| `gender` | character | Player gender. |
| `is_player` | logical | Whether the person is a player. |
| `is_verified` | logical | Whether the player profile is verified. |
| `pronunciation` | character | Phonetic name pronunciation. |
| `mlb_debut_date` | character | MLB debut date (YYYY-MM-DD). |
| `name_first_last` | character | Name in first-last order. |
| `name_slug` | character | URL-friendly name slug. |
| `first_last_name` | character | First and last name. |
| `last_first_name` | character | Name in last, first order. |
| `last_init_name` | character | Last name with first initial. |
| `init_last_name` | character | First initial with last name. |
| `full_fml_name` | character | Full name (first-middle-last). |
| `full_lfm_name` | character | Full name (last-first-middle). |
| `strike_zone_top` | double | Top of the player's strike zone (feet). |
| `strike_zone_bottom` | double | Bottom of the player's strike zone (feet). |
| `alumni_last_season` | character | Last season the player was with the team. |
| `primary_position_code` | character | Primary position code. |
| `primary_position_name` | character | Primary fielding position name. |
| `primary_position_type` | character | Primary position type (e.g. Infielder). |
| `primary_position_abbreviation` | character | Primary position abbreviation. |
| `bat_side_code` | character | Batting side code (L/R/S). |
| `bat_side_description` | character | Batting side description. |
| `pitch_hand_code` | character | Throwing hand code (L/R). |
| `pitch_hand_description` | character | Throwing hand description. |
| `birth_state_province` | character | State or province of birth. |
| `draft_year` | double | Year the player was drafted. |
| `last_played_date` | character | Date of last MLB game played. |
| `name_matrilineal` | character | Maternal family name. |

**Row type:** `MlbTeamAlumniRow` (exported from the package root).

### Returns — `mlb_team_coaches` / `mlbTeamCoaches`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbTeamCoachesRow` (exported from the package root).

### Returns — `mlb_team_personnel` / `mlbTeamPersonnel`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbTeamPersonnelRow` (exported from the package root).

### Returns — `mlb_team_roster` / `mlbTeamRoster`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |
| `position_code` | character | Numeric scorekeeping position code. |
| `position_name` | character | Full position name (e.g. 'Point Guard', 'Goalkeeper'). |
| `position_type` | character | Position category (e.g. 'Pitcher', 'Infielder'). |
| `position_abbreviation` | character | Position abbreviation. |
| `status_code` | character | Status code identifier (e.g. 'S', 'P', 'I', 'F'). |
| `status_description` | character | Roster status description (e.g. 'Active'). |

**Row type:** `MlbTeamRosterRow` (exported from the package root).

### Returns — `mlb_team_roster_type` / `mlbTeamRosterType`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |
| `position_code` | character | Numeric scorekeeping position code. |
| `position_name` | character | Position name. |
| `position_type` | character | Position category (e.g. 'Pitcher', 'Infielder'). |
| `position_abbreviation` | character | Position abbreviation. |
| `status_code` | character | Status code identifier (e.g. 'S', 'P', 'I', 'F'). |
| `status_description` | character | Roster status description (e.g. 'Active'). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_teams_history` / `mlbTeamsHistory`

| col_name | type | description |
|---|---|---|
| `all_star_status` | character | All-star status flag. |
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `season` | integer | Season year. |
| `team_code` | character | Internal team code. |
| `file_code` | character | File code abbreviation. |
| `abbreviation` | character | Short abbreviation. |
| `team_name` | character | Team name. |
| `location_name` | character | Team location (city). |
| `first_year_of_play` | character | First year the franchise played. |
| `short_name` | character | Short display name. |
| `franchise_name` | character | Franchise name. |
| `club_name` | character | Club name. |
| `active` | logical | Whether the player is currently active. |
| `venue_id` | integer | MLBAM venue ID. |
| `venue_name` | character | Venue name. |
| `venue_link` | character | API link to the venue. |
| `spring_venue_id` | double | Spring training venue MLBAM ID. |
| `spring_venue_link` | character | API link to the spring venue. |
| `league_id` | integer | League MLBAM ID. |
| `league_name` | character | League name. |
| `league_link` | character | API link to the league. |
| `sport_id` | integer | Sport MLBAM ID. |
| `sport_link` | character | API link to the sport. |
| `sport_name` | character | Sport name (e.g., Major League Baseball). |

**Row type:** `MlbTeamsHistoryRow` (exported from the package root).

### Returns — `mlb_teams_stats` / `mlbTeamsStats`

| col_name | type | description |
|---|---|---|
| `total_splits` | integer | Total number of splits in the leaderboard. |
| `exemptions` | character | A serialized list of any statistical exemption notes or flags associated with the team's stat splits (e.g., players exempt from qualifying thresholds). |
| `splits` | character | Splits. |
| `splits_tied_with_offset` | character | Players tied at the offset boundary. |
| `splits_tied_with_limit` | character | Players tied at the limit boundary. |
| `type_display_name` | character | Stat type display name. |
| `group_display_name` | character | Stat group display name. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_teams_stats_leaders` / `mlbTeamsStatsLeaders`

| col_name | type | description |
|---|---|---|
| `leader_category` | character | Team leader category (e.g., homeRuns). |
| `season` | character | Season year. |
| `leaders` | character | Serialized representation of the statistical leaders entries for the team stat category returned by the MLB Stats API. |
| `stat_group` | character | Stat group (e.g., hitting). |
| `total_splits` | integer | Total number of splits in the leaderboard. |
| `game_type_id` | character | Game type code (e.g., R for regular season). |
| `game_type_description` | character | Game type description. |

**Row type:** `MlbTeamsStatsLeadersRow` (exported from the package root).

### Returns — `mlb_umpires` / `mlbUmpires`

| col_name | type | description |
|---|---|---|
| `jersey_number` | character | Jersey number worn (often blank for non-uniformed roles). |
| `job` | character | Job title (e.g. 'Umpire'). |
| `job_id` | character | Job code identifier. |
| `title` | character | Specific role title for the assignment. |
| `person_id` | integer | MLB player ID. |
| `person_full_name` | character | Player full name. |
| `person_link` | character | API relative link to the person. |

**Row type:** `MlbUmpiresRow` (exported from the package root).

### Returns — `mlb_venue` / `mlbVenue`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `active` | logical | Whether the player is currently active. |
| `season` | character | Season year. |

**Row type:** `MlbVenueRow` (exported from the package root).

### Returns — `mlb_venues` / `mlbVenues`

| col_name | type | description |
|---|---|---|
| `id` | integer | Id. |
| `name` | character | Display name. |
| `link` | character | API link to the game feed. |
| `active` | logical | Whether the player is currently active. |
| `season` | character | Season year. |

**Row type:** `MlbVenuesRow` (exported from the package root).

### Returns — `mlb_win_probability` / `mlbWinProbability`

| col_name | type | description |
|---|---|---|
| `pitch_index` | character | A serialized list of indices identifying individual pitch events within the at-bat for this win-probability row. |
| `action_index` | character | A serialized list of indices identifying action-type events (stolen bases, pickoffs, etc.) within the at-bat for this win-probability row. |
| `runner_index` | character | A serialized list of indices identifying baserunner movement events during the play in this win-probability row. |
| `runners` | character | A serialized representation of baserunner movement records for this play in the win-probability feed, capturing start/end base positions and event types. |
| `play_events` | character | A serialized representation of the sequence of pitch and action events comprising the at-bat for this win-probability row. |
| `credits` | character | A serialized list of player credit records for this play, linking fielding, pitching, or batting achievements to specific player identifiers. |
| `flags` | character | A serialized representation of situational boolean flags associated with this play (e.g., whether it was a big lead situation or a save opportunity). |
| `home_team_win_probability` | double | Home team win probability (percent) entering the at-bat. |
| `away_team_win_probability` | double | Away team win probability (percent) entering the at-bat. |
| `home_team_win_probability_added` | double | Change in home team win probability attributed to the at-bat. |
| `play_end_time` | character | The ISO 8601 timestamp marking the conclusion of the play associated with this win-probability snapshot. |
| `at_bat_index` | integer | Zero-based index of the at-bat within the game. |
| `result_type` | character | The high-level category of the play result in the win-probability feed (e.g., 'atBat', 'action'). |
| `result_event` | character | The short categorical label for the play outcome in the win-probability feed (e.g., 'Single', 'Home Run', 'Strikeout'). |
| `result_event_type` | character | The snake-cased type identifier for the play outcome in the win-probability feed (e.g., 'single', 'home_run'). |
| `result_description` | character | A human-readable text description of the play result as reported in the win-probability game feed. |
| `result_rbi` | integer | The number of runs batted in credited to the batter for the play in this win-probability row. |
| `result_away_score` | integer | The away team's cumulative run total at the conclusion of the play in this win-probability row. |
| `result_home_score` | integer | The home team's cumulative run total at the conclusion of the play in this win-probability row. |
| `result_is_out` | logical | Boolean flag indicating whether the batter was retired on the play recorded in this win-probability row. |
| `about_at_bat_index` | integer | The sequential index of the at-bat within the game to which this win-probability observation belongs. |
| `about_half_inning` | character | Indicates whether the win-probability observation occurred in the top or bottom half of the inning. |
| `about_is_top_inning` | logical | Boolean flag indicating whether this win-probability observation occurred in the top half of the inning. |
| `about_inning` | integer | The inning number in which this win-probability observation was recorded. |
| `about_start_time` | character | The ISO 8601 timestamp marking the start of the play event within the win-probability game feed. |
| `about_end_time` | character | The ISO 8601 timestamp marking the end of the play event within the win-probability game feed. |
| `about_is_complete` | logical | Boolean flag indicating whether the at-bat associated with this win-probability row has concluded. |
| `about_is_scoring_play` | logical | Boolean flag indicating whether this play resulted in one or more runs being scored. |
| `about_has_review` | logical | Boolean flag indicating whether this play was subject to a manager's challenge or umpire review. |
| `about_has_out` | logical | Boolean flag indicating whether this play resulted in at least one out being recorded. |
| `about_captivating_index` | integer | A numeric score reflecting how compelling or exciting this plate appearance was, based on leverage and game-state context. |
| `count_balls` | integer | The ball count in the current at-bat at the time this win-probability snapshot was recorded. |
| `count_strikes` | integer | The strike count in the current at-bat at the time this win-probability snapshot was recorded. |
| `count_outs` | integer | The number of outs in the current half-inning at the time this win-probability snapshot was recorded. |
| `matchup_batter_id` | integer | The MLB Stats API (MLBAM) numeric identifier for the batter in this win-probability matchup row. |
| `matchup_batter_full_name` | character | The full name of the batter whose plate appearance generated this win-probability observation. |
| `matchup_batter_link` | character | The MLB Stats API relative URL linking to the batter's player resource for this win-probability row. |
| `matchup_bat_side_code` | character | A single-character code indicating the batter's handedness for this matchup in the win-probability feed (e.g., 'L', 'R', 'S'). |
| `matchup_bat_side_description` | character | The human-readable description of the batter's hitting side for this win-probability matchup row. |
| `matchup_pitcher_id` | integer | The MLB Stats API (MLBAM) numeric identifier for the pitcher in this win-probability matchup row. |
| `matchup_pitcher_full_name` | character | The full name of the pitcher who delivered pitches for this win-probability observation. |
| `matchup_pitcher_link` | character | The MLB Stats API relative URL linking to the pitcher's player resource for this win-probability row. |
| `matchup_pitch_hand_code` | character | A single-character code indicating the pitcher's throwing hand for this win-probability matchup (e.g., 'L' or 'R'). |
| `matchup_pitch_hand_description` | character | The human-readable description of the pitcher's throwing arm for this win-probability matchup row. |
| `matchup_post_on_first_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on first base after the play in this win-probability row. |
| `matchup_post_on_first_full_name` | character | The full name of the runner occupying first base at the conclusion of the play in this win-probability row. |
| `matchup_post_on_first_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on first base after the play. |
| `matchup_batter_hot_cold_zones` | character | A serialized representation of the batter's hot and cold zone data applicable to this win-probability matchup. |
| `matchup_pitcher_hot_cold_zones` | character | A serialized representation of the pitcher's hot and cold zone data applicable to this win-probability matchup. |
| `matchup_splits_batter` | character | A string describing the batter's situational split for this win-probability matchup (e.g., 'vs. Right'). |
| `matchup_splits_pitcher` | character | A string describing the pitcher's situational split for this win-probability matchup (e.g., 'vs. Left'). |
| `matchup_splits_men_on_base` | character | A string describing the baserunner configuration applicable to the batter's situational split in this win-probability row. |
| `leverage_index` | double | Leverage index quantifying the importance of the at-bat situation. |
| `drama_index` | double | A numeric score quantifying the dramatic significance of this play within the game, based on win-probability swing and game leverage. |
| `matchup_post_on_second_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on second base after the play in this win-probability row. |
| `matchup_post_on_second_full_name` | character | The full name of the runner occupying second base at the conclusion of the play in this win-probability row. |
| `matchup_post_on_second_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on second base after the play. |
| `matchup_post_on_third_id` | double | The MLB Stats API (MLBAM) numeric identifier for the runner on third base after the play in this win-probability row. |
| `matchup_post_on_third_full_name` | character | The full name of the runner occupying third base at the conclusion of the play in this win-probability row. |
| `matchup_post_on_third_link` | character | The MLB Stats API relative URL linking to the player resource of the runner on third base after the play. |
| `review_details_is_overturned` | logical | Boolean flag indicating whether the original on-field ruling was reversed following the replay review for this play. |
| `review_details_in_progress` | logical | Boolean flag indicating whether a replay review of this play was still underway at the time of data capture. |
| `review_details_review_type` | character | The type of review mechanism applied to this play in the win-probability feed (e.g., 'managerChallenge', 'umpireReview'). |
| `review_details_challenge_team_id` | double | The MLB Stats API numeric identifier for the team that initiated a replay challenge on this win-probability play. |

**Row type:** `MlbWinProbabilityRow` (exported from the package root).

## Native API — Baseball Savant / Statcast

Flat (non-ESPN) wrappers for Baseball Savant (Statcast). Host: `https://baseballsavant.mlb.com`. Each method is exposed under BOTH its snake_case name `mlb_statcast_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.mlb`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `mlb_statcast_gamefeed` / `mlbStatcastGamefeed` | `https://baseballsavant.mlb.com/gf` | — | `game_pk`, `at_bat_number` | `parse_mlb_statcast_gamefeed` | — |
| `mlb_statcast_leaderboard_active_spin` / `mlbStatcastLeaderboardActiveSpin` | `https://baseballsavant.mlb.com/leaderboard/active-spin` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_arm_angles` / `mlbStatcastLeaderboardArmAngles` | `https://baseballsavant.mlb.com/leaderboard/pitcher-arm-angles` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_arm_strength` / `mlbStatcastLeaderboardArmStrength` | `https://baseballsavant.mlb.com/leaderboard/arm-strength` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_baserunning` / `mlbStatcastLeaderboardBaserunning` | `https://baseballsavant.mlb.com/leaderboard/baserunning` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_baserunning_run_value` / `mlbStatcastLeaderboardBaserunningRunValue` | `https://baseballsavant.mlb.com/leaderboard/baserunning-run-value` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_basestealing_run_value` / `mlbStatcastLeaderboardBasestealingRunValue` | `https://baseballsavant.mlb.com/leaderboard/basestealing-run-value` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_bat_tracking` / `mlbStatcastLeaderboardBatTracking` | `https://baseballsavant.mlb.com/leaderboard/bat-tracking` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_batted_ball` / `mlbStatcastLeaderboardBattedBall` | `https://baseballsavant.mlb.com/leaderboard/batted-ball` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_catch_probability` / `mlbStatcastLeaderboardCatchProbability` | `https://baseballsavant.mlb.com/leaderboard/catch_probability` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_catcher_blocking` / `mlbStatcastLeaderboardCatcherBlocking` | `https://baseballsavant.mlb.com/leaderboard/catcher-blocking` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_catcher_framing` / `mlbStatcastLeaderboardCatcherFraming` | `https://baseballsavant.mlb.com/leaderboard/catcher-framing` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_catcher_stance` / `mlbStatcastLeaderboardCatcherStance` | `https://baseballsavant.mlb.com/leaderboard/catcher-stance` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_catcher_throwing` / `mlbStatcastLeaderboardCatcherThrowing` | `https://baseballsavant.mlb.com/leaderboard/catcher-throwing` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_custom` / `mlbStatcastLeaderboardCustom` | `https://baseballsavant.mlb.com/leaderboard/custom` | — | `type`, `year`, `selections`, `filter`, `min`, `sort`, `sort_dir` → `sortDir`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_exit_velocity_barrels` / `mlbStatcastLeaderboardExitVelocityBarrels` | `https://baseballsavant.mlb.com/leaderboard/statcast` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_expected_stats` / `mlbStatcastLeaderboardExpectedStats` | `https://baseballsavant.mlb.com/leaderboard/expected_statistics` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_fielding_run_value` / `mlbStatcastLeaderboardFieldingRunValue` | `https://baseballsavant.mlb.com/leaderboard/fielding-run-value` | — | `type`, `year`, `team` | `parse_mlb_statcast_html_leaderboard` | — |
| `mlb_statcast_leaderboard_home_runs` / `mlbStatcastLeaderboardHomeRuns` | `https://baseballsavant.mlb.com/leaderboard/home-runs` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_outfield_directional_oaa` / `mlbStatcastLeaderboardOutfieldDirectionalOaa` | `https://baseballsavant.mlb.com/leaderboard/outfield_directional_outs_above_average` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_outfield_jump` / `mlbStatcastLeaderboardOutfieldJump` | `https://baseballsavant.mlb.com/leaderboard/outfield_jump` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_outs_above_average` / `mlbStatcastLeaderboardOutsAboveAverage` | `https://baseballsavant.mlb.com/leaderboard/outs_above_average` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_park_factors` / `mlbStatcastLeaderboardParkFactors` | `https://baseballsavant.mlb.com/leaderboard/statcast-park-factors` | — | `type`, `year`, `team` | `parse_mlb_statcast_html_leaderboard` | — |
| `mlb_statcast_leaderboard_percentile_rankings` / `mlbStatcastLeaderboardPercentileRankings` | `https://baseballsavant.mlb.com/leaderboard/percentile-rankings` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_pitch_arsenal_stats` / `mlbStatcastLeaderboardPitchArsenalStats` | `https://baseballsavant.mlb.com/leaderboard/pitch-arsenal-stats` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_pitch_arsenals` / `mlbStatcastLeaderboardPitchArsenals` | `https://baseballsavant.mlb.com/leaderboard/pitch-arsenals` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_pitch_movement` / `mlbStatcastLeaderboardPitchMovement` | `https://baseballsavant.mlb.com/leaderboard/pitch-movement` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_pitch_tempo` / `mlbStatcastLeaderboardPitchTempo` | `https://baseballsavant.mlb.com/leaderboard/pitch-tempo` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_pitcher_running_game` / `mlbStatcastLeaderboardPitcherRunningGame` | `https://baseballsavant.mlb.com/leaderboard/pitcher-running-game` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_poptime` / `mlbStatcastLeaderboardPoptime` | `https://baseballsavant.mlb.com/leaderboard/poptime` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_running_splits` / `mlbStatcastLeaderboardRunningSplits` | `https://baseballsavant.mlb.com/leaderboard/running_splits` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_spin_direction` / `mlbStatcastLeaderboardSpinDirection` | `https://baseballsavant.mlb.com/leaderboard/spin-direction-pitches` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_sprint_speed` / `mlbStatcastLeaderboardSprintSpeed` | `https://baseballsavant.mlb.com/leaderboard/sprint_speed` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_swing_path` / `mlbStatcastLeaderboardSwingPath` | `https://baseballsavant.mlb.com/leaderboard/bat-tracking/swing-path-attack-angle` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_swing_take` / `mlbStatcastLeaderboardSwingTake` | `https://baseballsavant.mlb.com/leaderboard/swing-take` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_swing_timing` / `mlbStatcastLeaderboardSwingTiming` | `https://baseballsavant.mlb.com/leaderboard/bat-tracking/swing-timing-miss-distance` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_timer_infractions` / `mlbStatcastLeaderboardTimerInfractions` | `https://baseballsavant.mlb.com/leaderboard/pitch-timer-infractions` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_leaderboard_year_to_year` / `mlbStatcastLeaderboardYearToYear` | `https://baseballsavant.mlb.com/leaderboard/statcast-year-to-year` | — | `type`, `year`, `team`, `csv` | `parse_mlb_statcast_leaderboard` | — |
| `mlb_statcast_schedule` / `mlbStatcastSchedule` | `https://baseballsavant.mlb.com/schedule` | — | `date` | `parse_mlb_statcast_schedule` | — |

### Returns — `mlb_statcast_leaderboard_active_spin` / `mlbStatcastLeaderboardActiveSpin`

| col_name | type | description |
|---|---|---|
| `entity_name` | character | Player (or team) entity name. |
| `entity_id` | integer | MLBAM id of the player/team entity. |
| `pitch_hand` | character | Pitcher handedness (R/L). |
| `active_spin_fourseam` | character | Active spin fourseam. |
| `active_spin_sinker` | numeric | Active spin sinker. |
| `active_spin_cutter` | numeric | Active spin cutter. |
| `active_spin_changeup` | numeric | Active spin changeup. |
| `active_spin_splitter` | character | Active spin splitter. |
| `active_spin_curve` | character | Active spin curve. |
| `active_spin_slider` | numeric | Active spin slider. |
| `active_spin_sweeper` | numeric | Active spin sweeper. |
| `active_spin_slurve` | character | Active spin slurve. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_arm_angles` / `mlbStatcastLeaderboardArmAngles`

| col_name | type | description |
|---|---|---|
| `pitcher` | integer | MLBAM id of the pitcher. |
| `pitcher_name` | character | Pitcher name. |
| `pitch_hand` | character | Pitcher handedness (R/L). |
| `n_pitches` | integer | Number of pitches. |
| `team_id` | integer | MLBAM team id. |
| `ball_angle` | numeric | Arm slot angle (deg). |
| `relative_release_ball_x` | numeric | Relative release ball x. |
| `release_ball_z` | numeric | Release ball z. |
| `relative_shoulder_x` | numeric | Relative shoulder x. |
| `shoulder_z` | numeric | Shoulder z. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_arm_strength` / `mlbStatcastLeaderboardArmStrength`

| col_name | type | description |
|---|---|---|
| `fielder_name` | character | Fielder name. |
| `player_id` | integer | MLBAM player id. |
| `team_name` | character | Team name. |
| `primary_position` | integer | Primary fielding position. |
| `primary_position_name` | character | Primary position name. |
| `total_throws` | integer | Total throws. |
| `total_throws_1b` | integer | Total throws 1b. |
| `total_throws_2b` | integer | Total throws 2b. |
| `total_throws_3b` | integer | Total throws 3b. |
| `total_throws_ss` | integer | Total throws ss. |
| `total_throws_lf` | integer | Total throws lf. |
| `total_throws_cf` | integer | Total throws cf. |
| `total_throws_rf` | integer | Total throws rf. |
| `total_throws_inf` | integer | Total throws inf. |
| `total_throws_of` | integer | Total throws of. |
| `max_arm_strength` | numeric | Max arm strength (mph). |
| `arm_1b` | numeric | Arm 1b. |
| `arm_2b` | character | Arm 2b. |
| `arm_3b` | character | Arm 3b. |
| `arm_ss` | character | Arm ss. |
| `arm_lf` | character | Arm lf. |
| `arm_cf` | character | Arm cf. |
| `arm_rf` | character | Arm rf. |
| `arm_inf` | character | Arm inf. |
| `arm_of` | character | Arm of. |
| `arm_overall` | numeric | Arm overall. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_baserunning` / `mlbStatcastLeaderboardBaserunning`

| col_name | type | description |
|---|---|---|
| `entity_name` | character | Player (or team) entity name. |
| `entity_id` | integer | MLBAM id of the player/team entity. |
| `team_name` | character | Team name. |
| `year` | integer | Season year. |
| `runner_runs` | numeric | Baserunning run value as a runner. |
| `fielder_runs` | numeric | Run value from the defense's perspective. |
| `runner_runs_advances` | numeric | Runner runs advances. |
| `runner_runs_thrown_out` | integer | Runner runs thrown out. |
| `runner_runs_hold` | numeric | Runner runs hold. |
| `fielder_runs_advances` | numeric | Fielder runs advances. |
| `fielder_runs_thrown_out` | integer | Fielder runs thrown out. |
| `fielder_runs_hold` | numeric | Fielder runs hold. |
| `n_opp_xb` | integer | Number of opp xb. |
| `n_att_xb` | integer | Number of att xb. |
| `rate_att_xb` | numeric | Rate att xb. |
| `est_rate_att_generic_runner` | numeric | Expected rate att generic runner. |
| `est_rate_att_generic_fielder` | numeric | Expected rate att generic fielder. |
| `n_out` | integer | Number of out. |
| `n_safe` | integer | Number of safe. |
| `rate_safe` | numeric | Rate safe. |
| `rate_safe_per_attempt` | integer | Rate safe per attempt. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_baserunning_run_value` / `mlbStatcastLeaderboardBaserunningRunValue`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | MLBAM player id. |
| `entity_name` | character | Player (or team) entity name. |
| `team_name` | character | Team name. |
| `start_year` | integer | First season in the range. |
| `end_year` | integer | Last season in the range. |
| `runner_runs_tot` | numeric | Runner runs tot. |
| `runner_runs_xb` | numeric | Runner runs xb. |
| `runner_runs_sbx` | numeric | Runner runs sbx. |
| `n_runner_moved` | integer | Number of runner moved. |
| `runner_runs_xb_swipe` | numeric | Runner runs xb swipe. |
| `runner_runs_xb_snipe` | integer | Runner runs xb snipe. |
| `runner_runs_xb_freeze` | numeric | Runner runs xb freeze. |
| `n_runner_moved_xb` | integer | Number of runner moved xb. |
| `runner_runs_sb2` | numeric | Runner runs sb2. |
| `runner_runs_sb3` | numeric | Runner runs sb3. |
| `simple_stolen_on_running_act_sb2` | numeric | Simple stolen on running act sb2. |
| `simple_stolen_on_running_act_sb3` | numeric | Simple stolen on running act sb3. |
| `n_runner_moved_sbx` | integer | Number of runner moved sbx. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_basestealing_run_value` / `mlbStatcastLeaderboardBasestealingRunValue`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | MLBAM player id. |
| `player_name` | character | Player name. |
| `team_name` | character | Team name. |
| `start_year` | integer | First season in the range. |
| `end_year` | integer | Last season in the range. |
| `key_target_base` | character | Key target base. |
| `runs_stolen_on_running_act` | numeric | Runs stolen on running act. |
| `n_init` | integer | Number of init. |
| `rate_sbx` | integer | Rate sbx. |
| `n_sb` | integer | Stolen bases allowed (count). |
| `n_cs` | integer | Caught stealing (count). |
| `n_pk` | integer | Number of pk. |
| `n_bk` | integer | Number of bk. |
| `n_fb` | integer | Number of fb. |
| `n_plus` | integer | Number of plus. |
| `n_minus` | integer | Number of minus. |
| `net_act_plus` | numeric | Net act plus. |
| `net_act_minus` | numeric | Net act minus. |
| `r_primary_lead` | numeric | Average primary lead distance (ft). |
| `r_secondary_lead` | numeric | Average secondary lead (ft). |
| `r_sec_minus_prim_lead` | numeric | R sec minus prim lead. |
| `r_primary_lead_sbx` | character | R primary lead sbx. |
| `r_secondary_lead_sbx` | character | R secondary lead sbx. |
| `r_sec_minus_prim_lead_sbx` | character | R sec minus prim lead sbx. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_bat_tracking` / `mlbStatcastLeaderboardBatTracking`

| col_name | type | description |
|---|---|---|
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `swings_competitive` | integer | Competitive swings. |
| `percent_swings_competitive` | numeric | Share of swings that are competitive. |
| `contact` | integer | Contact. |
| `avg_bat_speed` | numeric | Average bat speed (mph). |
| `hard_swing_rate` | numeric | Hard swing rate. |
| `squared_up_per_bat_contact` | numeric | Squared up per bat contact. |
| `squared_up_per_swing` | numeric | Squared-up rate per swing. |
| `blast_per_bat_contact` | numeric | Blast per bat contact. |
| `blast_per_swing` | numeric | Blasts per swing. |
| `swing_length` | numeric | Swing length (ft, head travel). |
| `swords` | integer | Swords. |
| `batter_run_value` | numeric | Batter run value. |
| `whiffs` | character | Whiffs. |
| `whiff_per_swing` | character | Whiff per swing. |
| `batted_ball_events` | integer | Batted ball events. |
| `batted_ball_event_per_swing` | numeric | Batted ball event per swing. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_batted_ball` / `mlbStatcastLeaderboardBattedBall`

| col_name | type | description |
|---|---|---|
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `year` | integer | Season year. |
| `bbe` | integer | Batted-ball events. |
| `gb_rate` | numeric | Gb rate. |
| `air_rate` | numeric | Air rate. |
| `fb_rate` | numeric | Fb rate. |
| `ld_rate` | numeric | Ld rate. |
| `pu_rate` | numeric | Pu rate. |
| `pull_rate` | numeric | Pull rate. |
| `straight_rate` | numeric | Straight rate. |
| `oppo_rate` | numeric | Oppo rate. |
| `pull_gb_rate` | numeric | Pull gb rate. |
| `straight_gb_rate` | numeric | Straight gb rate. |
| `oppo_gb_rate` | numeric | Oppo gb rate. |
| `pull_air_rate` | numeric | Pull air rate. |
| `straight_air_rate` | numeric | Straight air rate. |
| `oppo_air_rate` | numeric | Oppo air rate. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_catch_probability` / `mlbStatcastLeaderboardCatchProbability`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | character | MLBAM player id. |
| `oaa` | character | Outs Above Average. |
| `n_fieldout_5stars` | character | 5-star (hardest) plays made. |
| `n_opp_5stars` | character | 5-star play opportunities. |
| `n_5star_percent` | character | Number of 5star rate. |
| `n_fieldout_4stars` | character | Number of fieldout 4stars. |
| `n_opp_4stars` | character | Number of opp 4stars. |
| `n_4star_percent` | character | Number of 4star rate. |
| `n_fieldout_3stars` | character | Number of fieldout 3stars. |
| `n_opp_3stars` | character | Number of opp 3stars. |
| `n_3star_percent` | character | Number of 3star rate. |
| `n_fieldout_2stars` | character | Number of fieldout 2stars. |
| `n_opp_2stars` | character | Number of opp 2stars. |
| `n_2star_percent` | character | Number of 2star rate. |
| `n_fieldout_1stars` | character | Number of fieldout 1stars. |
| `n_opp_1stars` | character | Number of opp 1stars. |
| `n_1star_percent` | character | Number of 1star rate. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_catcher_blocking` / `mlbStatcastLeaderboardCatcherBlocking`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | MLBAM player id. |
| `player_name` | character | Player name. |
| `team_name` | character | Team name. |
| `start_year` | integer | First season in the range. |
| `end_year` | character | Last season in the range. |
| `pitches` | integer | Pitches. |
| `catcher_blocking_runs` | integer | Catcher blocking runs. |
| `blocks_above_average` | integer | Blocks above average. |
| `n_pbwp` | integer | Number of pbwp. |
| `x_pbwp` | numeric | X pbwp. |
| `blocks_above_average_per_game` | numeric | Blocks above average per game. |
| `freq_pbwp_easy` | numeric | Freq pbwp easy. |
| `freq_pbwp_medium` | numeric | Freq pbwp medium. |
| `freq_pbwp_tough` | numeric | Freq pbwp tough. |
| `diff_pbwp_easy` | numeric | Diff pbwp easy. |
| `diff_pbwp_medium` | numeric | Diff pbwp medium. |
| `diff_pbwp_tough` | numeric | Diff pbwp tough. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_catcher_framing` / `mlbStatcastLeaderboardCatcherFraming`

| col_name | type | description |
|---|---|---|
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `pitches` | integer | Pitches. |
| `rv_tot` | numeric | Total framing run value. |
| `pct_tot` | numeric | Total called-strike rate. |
| `rv_11` | integer | Rv 11. |
| `pct_11` | numeric | Pct 11. |
| `rv_12` | integer | Rv 12. |
| `pct_12` | numeric | Pct 12. |
| `rv_13` | integer | Rv 13. |
| `pct_13` | integer | Pct 13. |
| `rv_14` | integer | Rv 14. |
| `pct_14` | numeric | Pct 14. |
| `rv_16` | integer | Rv 16. |
| `pct_16` | numeric | Pct 16. |
| `rv_17` | integer | Rv 17. |
| `pct_17` | numeric | Pct 17. |
| `rv_18` | integer | Rv 18. |
| `pct_18` | numeric | Pct 18. |
| `rv_19` | integer | Rv 19. |
| `pct_19` | numeric | Pct 19. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_catcher_throwing` / `mlbStatcastLeaderboardCatcherThrowing`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | MLBAM player id. |
| `player_name` | character | Player name. |
| `team_name` | character | Team name. |
| `start_year` | integer | First season in the range. |
| `end_year` | integer | Last season in the range. |
| `sb_attempts` | integer | Sb attempts. |
| `catcher_stealing_runs` | numeric | Catcher stealing runs. |
| `caught_stealing_above_average` | numeric | Caught-stealing above average. |
| `n_cs` | integer | Caught stealing (count). |
| `rate_cs` | numeric | Rate cs. |
| `est_cs_pct` | numeric | Expected caught stealing rate. |
| `cs_aa_per_throw` | numeric | Cs aa per throw. |
| `seasonal_runner_speed` | numeric | Seasonal runner speed. |
| `runner_distance_from_second` | numeric | Runner distance from second. |
| `pop_time` | numeric | Pop time. |
| `exchange_time` | numeric | Exchange time. |
| `arm_strength` | numeric | Arm strength (mph, top throws). |
| `n_xcs_with_flight_over_xcs` | numeric | Number of xcs with flight over xcs. |
| `n_xcs_with_exchange_over_xcs` | numeric | Number of xcs with exchange over xcs. |
| `n_xcs_with_accuracy_over_xcs` | numeric | Number of xcs with accuracy over xcs. |
| `n_xcs_with_ground_other_over_xcs` | numeric | Number of xcs with ground other over xcs. |
| `n_xcs_with_onfly_other_over_xcs` | numeric | Number of xcs with onfly other over xcs. |
| `n_xcs_with_untracked_other_over_xcs` | integer | Number of xcs with untracked other over xcs. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_custom` / `mlbStatcastLeaderboardCustom`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `year` | integer | Season year. |
| `xba` | numeric | Expected batting average. |
| `xslg` | numeric | Expected slugging. |
| `xwoba` | numeric | Expected wOBA. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_exit_velocity_barrels` / `mlbStatcastLeaderboardExitVelocityBarrels`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `attempts` | integer | Opportunities/attempts. |
| `avg_hit_angle` | numeric | Average launch angle (deg). |
| `anglesweetspotpercent` | numeric | Anglesweetspotpercent. |
| `max_hit_speed` | numeric | Max exit velocity (mph). |
| `avg_hit_speed` | numeric | Average exit velocity (mph). |
| `ev50` | numeric | Ev50. |
| `fbld` | numeric | Fbld. |
| `gb` | numeric | Gb. |
| `max_distance` | integer | Max distance. |
| `avg_distance` | integer | Avg distance. |
| `avg_hr_distance` | integer | Avg hr distance. |
| `ev95plus` | integer | Ev95plus. |
| `ev95percent` | numeric | Ev95percent. |
| `barrels` | integer | Barrels. |
| `brl_percent` | numeric | Barrel rate (% of batted balls). |
| `brl_pa` | numeric | Barrels per plate appearance. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_expected_stats` / `mlbStatcastLeaderboardExpectedStats`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `year` | integer | Season year. |
| `pa` | integer | Plate appearances. |
| `bip` | integer | Balls in play. |
| `ba` | numeric | Batting average. |
| `est_ba` | numeric | Expected batting average (xBA). |
| `est_ba_minus_ba_diff` | numeric | xBA minus actual BA (over/under-performance). |
| `slg` | numeric | Slugging percentage. |
| `est_slg` | numeric | Expected slugging (xSLG). |
| `est_slg_minus_slg_diff` | numeric | xSLG minus actual SLG. |
| `woba` | numeric | Weighted on-base average. |
| `est_woba` | numeric | Expected wOBA (xwOBA). |
| `est_woba_minus_woba_diff` | numeric | xwOBA minus actual wOBA. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_fielding_run_value` / `mlbStatcastLeaderboardFieldingRunValue`

| col_name | type | description |
|---|---|---|
| `total_runs` | numeric | Total runs. |
| `inf_of_runs` | character | Inf of runs. |
| `range_runs` | character | Range runs. |
| `arm_runs` | character | Arm runs. |
| `dp_runs` | character | Dp runs. |
| `catching_runs` | numeric | Catching runs. |
| `framing_runs` | numeric | Framing runs. |
| `throwing_runs` | numeric | Throwing runs. |
| `blocking_runs` | numeric | Blocking runs. |
| `outs_total` | integer | Outs total. |
| `tot_pa` | integer | Tot pa. |
| `outs_2` | integer | Outs 2. |
| `outs_3` | integer | Outs 3. |
| `outs_4` | integer | Outs 4. |
| `outs_5` | integer | Outs 5. |
| `outs_6` | integer | Outs 6. |
| `outs_7` | integer | Outs 7. |
| `outs_8` | integer | Outs 8. |
| `outs_9` | integer | Outs 9. |
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `team_id` | integer | MLBAM team id. |
| `n_teams` | integer | Number of teams. |
| `team_name` | character | Team name. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_home_runs` / `mlbStatcastLeaderboardHomeRuns`

| col_name | type | description |
|---|---|---|
| `player` | character | Player. |
| `player_id` | integer | MLBAM player id. |
| `team_abbrev` | character | Team abbreviation. |
| `year` | integer | Season year. |
| `type` | character | Record/pitch type. |
| `avg_hr_trot` | numeric | Avg hr trot. |
| `doubters` | integer | Doubters. |
| `mostly_gone` | integer | Mostly gone. |
| `no_doubters` | integer | No doubters. |
| `no_doubter_per` | numeric | No doubter per. |
| `hr_total` | integer | Hr total. |
| `xhr` | numeric | Xhr. |
| `xhr_diff` | numeric | Xhr diff. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_outfield_directional_oaa` / `mlbStatcastLeaderboardOutfieldDirectionalOaa`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `attempts` | integer | Opportunities/attempts. |
| `n_outs_above_average` | integer | Outs Above Average (count). |
| `n_oaa_slice_back_left` | integer | Number of oaa slice back left. |
| `n_oaa_slice_back` | integer | Number of oaa slice back. |
| `n_oaa_slice_back_right` | integer | Number of oaa slice back right. |
| `n_oaa_slice_back_all` | integer | Number of oaa slice back all. |
| `n_oaa_slice_in_left` | integer | Number of oaa slice in left. |
| `n_oaa_slice_in` | integer | Number of oaa slice in. |
| `n_oaa_slice_in_right` | integer | Number of oaa slice in right. |
| `n_oaa_slice_in_all` | integer | Number of oaa slice in all. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_outfield_jump` / `mlbStatcastLeaderboardOutfieldJump`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `resp_fielder_id` | integer | MLBAM id of the responsible fielder. |
| `year` | integer | Season year. |
| `outs_above_average` | integer | Outs Above Average. |
| `outs_per_play` | numeric | Outs per play. |
| `rel_league_burst_distance` | integer | Rel league burst distance. |
| `rel_league_reaction_distance` | numeric | Rel league reaction distance. |
| `rel_league_routing_distance` | numeric | Rel league routing distance. |
| `rel_league_bootup_distance` | numeric | Rel league bootup distance. |
| `f_bootup_distance` | numeric | F bootup distance. |
| `n` | integer | Sample count (pitches/events). |
| `n_outs` | integer | Number of outs. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_outs_above_average` / `mlbStatcastLeaderboardOutsAboveAverage`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | character | MLBAM player id. |
| `display_team_name` | character | Team display name. |
| `year` | character | Season year. |
| `primary_pos_formatted` | character | Primary position (formatted). |
| `fielding_runs_prevented` | character | Fielding Run Value (runs). |
| `outs_above_average` | character | Outs Above Average. |
| `outs_above_average_infront` | character | Outs above average infront. |
| `outs_above_average_lateral_toward3bline` | character | Outs above average lateral toward3bline. |
| `outs_above_average_lateral_toward1bline` | character | Outs above average lateral toward1bline. |
| `outs_above_average_behind` | character | Outs above average behind. |
| `outs_above_average_rhh` | character | Outs above average rhh. |
| `outs_above_average_lhh` | character | Outs above average lhh. |
| `actual_success_rate_formatted` | character | Actual success rate formatted. |
| `adj_estimated_success_rate_formatted` | character | Adj estimated success rate formatted. |
| `diff_success_rate_formatted` | character | Diff success rate formatted. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_park_factors` / `mlbStatcastLeaderboardParkFactors`

| col_name | type | description |
|---|---|---|
| `grouping_venue_conditions` | character | Grouping venue conditions. |
| `key_is_year_rolling` | integer | Key is year rolling. |
| `key_num_years_rolling` | integer | Key num years rolling. |
| `key_year` | integer | Key year. |
| `key_bat_side` | character | Key bat side. |
| `venue_id` | integer | Venue id. |
| `venue_name` | character | Ballpark name. |
| `main_team_id` | integer | Main team id. |
| `name_display_club` | character | Club name. |
| `n_pa` | integer | Number of plate appearances. |
| `index_runs` | integer | Index runs. |
| `index_hardhit` | integer | Index hardhit. |
| `index_woba` | integer | Park factor index for wOBA (100 = neutral). |
| `index_wobatto` | integer | Index wobatto. |
| `index_wobacon` | integer | Index wobacon. |
| `index_xwobacon` | integer | Index xwobacon. |
| `index_xbacon` | integer | Index xbacon. |
| `index_obp` | integer | Index obp. |
| `index_so` | integer | Index so. |
| `index_bb` | integer | Index bb. |
| `index_bacon` | integer | Index bacon. |
| `index_hits` | integer | Index hits. |
| `index_1b` | integer | Index 1b. |
| `index_2b` | integer | Index 2b. |
| `index_3b` | integer | Index 3b. |
| `index_hr` | integer | Index hr. |
| `year_range` | character | Year range. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_percentile_rankings` / `mlbStatcastLeaderboardPercentileRankings`

| col_name | type | description |
|---|---|---|
| `player_name` | character | Player name. |
| `player_id` | integer | MLBAM player id. |
| `year` | integer | Season year. |
| `xwoba` | character | Expected wOBA. |
| `xba` | character | Expected batting average. |
| `xslg` | character | Expected slugging. |
| `xiso` | character | Expected isolated power. |
| `xobp` | character | Expected on-base percentage. |
| `brl` | character | Barrels. |
| `brl_percent` | character | Barrel rate (% of batted balls). |
| `exit_velocity` | character | Exit velocity (mph). |
| `max_ev` | integer | Max ev. |
| `hard_hit_percent` | character | Hard-hit rate (95+ mph EV). |
| `k_percent` | character | Strikeout rate. |
| `bb_percent` | character | Walk rate. |
| `whiff_percent` | character | Whiff rate (swings and misses / swings). |
| `chase_percent` | character | Chase rate. |
| `arm_strength` | integer | Arm strength (mph, top throws). |
| `sprint_speed` | integer | Sprint speed (ft/sec, top 50% of competitive runs). |
| `oaa` | integer | Outs Above Average. |
| `bat_speed` | character | Bat speed (mph). |
| `squared_up_rate` | character | Squared up rate. |
| `swing_length` | character | Swing length (ft, head travel). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_pitch_arsenal_stats` / `mlbStatcastLeaderboardPitchArsenalStats`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `team_name_alt` | character | Team name (alternate form). |
| `pitch_type` | character | Pitch type code. |
| `pitch_name` | character | Pitch type name. |
| `run_value_per_100` | numeric | Run value per 100 pitches. |
| `run_value` | integer | Run value (runs). |
| `pitches` | integer | Pitches. |
| `pitch_usage` | numeric | Pitch usage. |
| `pa` | integer | Plate appearances. |
| `ba` | numeric | Batting average. |
| `slg` | numeric | Slugging percentage. |
| `woba` | numeric | Weighted on-base average. |
| `whiff_percent` | numeric | Whiff rate (swings and misses / swings). |
| `k_percent` | numeric | Strikeout rate. |
| `put_away` | numeric | Put away. |
| `est_ba` | numeric | Expected batting average (xBA). |
| `est_slg` | numeric | Expected slugging (xSLG). |
| `est_woba` | numeric | Expected wOBA (xwOBA). |
| `hard_hit_percent` | numeric | Hard-hit rate (95+ mph EV). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_pitch_arsenals` / `mlbStatcastLeaderboardPitchArsenals`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `pitcher` | integer | MLBAM id of the pitcher. |
| `ff_batter` | character | Ff batter. |
| `si_batter` | character | Si batter. |
| `fc_batter` | character | Fc batter. |
| `sl_batter` | character | Sl batter. |
| `ch_batter` | character | Ch batter. |
| `cu_batter` | character | Cu batter. |
| `fs_batter` | character | Fs batter. |
| `kn_batter` | character | Kn batter. |
| `st_batter` | character | St batter. |
| `sv_batter` | character | Sv batter. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_pitch_movement` / `mlbStatcastLeaderboardPitchMovement`

| col_name | type | description |
|---|---|---|
| `year` | integer | Season year. |
| `last_name, first_name` | character | Last name, first name. |
| `pitcher_id` | integer | MLBAM id of the pitcher. |
| `team_name` | character | Team name. |
| `team_name_abbrev` | character | Team name abbrev. |
| `pitch_hand` | character | Pitcher handedness (R/L). |
| `avg_speed` | integer | Average pitch velocity (mph). |
| `pitches_thrown` | integer | Pitches thrown. |
| `total_pitches` | integer | Total pitches. |
| `pitches_per_game` | numeric | Pitches per game. |
| `pitch_per` | numeric | Pitch per. |
| `pitch_type` | character | Pitch type code. |
| `pitch_type_name` | character | Pitch type name. |
| `pitcher_break_z` | numeric | Pitcher break z. |
| `league_break_z` | numeric | League break z. |
| `diff_z` | numeric | Diff z. |
| `rise` | integer | Rise. |
| `pitcher_break_z_induced` | numeric | Pitcher break z induced. |
| `pitcher_break_x` | numeric | Pitcher break x. |
| `league_break_x` | numeric | League break x. |
| `diff_x` | numeric | Diff x. |
| `tail` | integer | Tail. |
| `percent_rank_diff_z` | numeric | Percent rank diff z. |
| `percent_rank_diff_x` | numeric | Percent rank diff x. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_pitch_tempo` / `mlbStatcastLeaderboardPitchTempo`

| col_name | type | description |
|---|---|---|
| `entity_id` | integer | MLBAM id of the player/team entity. |
| `entity_name` | character | Player (or team) entity name. |
| `entity_code` | character | Entity code. |
| `team_id` | integer | MLBAM team id. |
| `total_pitches` | integer | Total pitches. |
| `total_pitches_empty` | integer | Total pitches empty. |
| `median_seconds_empty` | numeric | Median tempo (s) with bases empty. |
| `total_pitches_onbase` | integer | Total pitches onbase. |
| `freq_hot` | numeric | Freq hot. |
| `freq_warm` | numeric | Freq warm. |
| `freq_cold` | numeric | Freq cold. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_pitcher_running_game` / `mlbStatcastLeaderboardPitcherRunningGame`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | MLBAM player id. |
| `player_name` | character | Player name. |
| `team_name` | character | Team name. |
| `start_year` | integer | First season in the range. |
| `end_year` | integer | Last season in the range. |
| `key_target_base` | character | Key target base. |
| `runs_prevented_on_running_attr` | numeric | Runs prevented on running attr. |
| `n_pitcher_cs_aa` | numeric | Number of pitcher cs aa. |
| `n_init` | integer | Number of init. |
| `rate_sbx` | numeric | Rate sbx. |
| `n_sb` | integer | Stolen bases allowed (count). |
| `n_cs` | integer | Caught stealing (count). |
| `n_pk` | integer | Number of pk. |
| `n_bk` | integer | Number of bk. |
| `n_fb` | integer | Number of fb. |
| `n_plus` | integer | Number of plus. |
| `n_minus` | integer | Number of minus. |
| `net_attr_plus` | numeric | Net attr plus. |
| `net_attr_minus` | numeric | Net attr minus. |
| `r_primary_lead` | numeric | Average primary lead distance (ft). |
| `r_secondary_lead` | numeric | Average secondary lead (ft). |
| `r_sec_minus_prim_lead` | numeric | R sec minus prim lead. |
| `r_primary_lead_sbx` | numeric | R primary lead sbx. |
| `r_secondary_lead_sbx` | numeric | R secondary lead sbx. |
| `r_sec_minus_prim_lead_sbx` | numeric | R sec minus prim lead sbx. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_poptime` / `mlbStatcastLeaderboardPoptime`

| col_name | type | description |
|---|---|---|
| `entity_name` | character | Player (or team) entity name. |
| `entity_id` | integer | MLBAM id of the player/team entity. |
| `team_id` | integer | MLBAM team id. |
| `age` | integer | Player age. |
| `maxeff_arm_2b_3b_sba` | numeric | Max-effort arm velo to 2B/3B (mph). |
| `exchange_2b_3b_sba` | numeric | Transfer/exchange time (s). |
| `pop_2b_sba_count` | integer | Pop-time sample (throws to 2B). |
| `pop_2b_sba` | numeric | Pop time to 2B on stolen-base attempts (s). |
| `pop_2b_cs` | numeric | Pop 2b cs. |
| `pop_2b_sb` | numeric | Pop 2b sb. |
| `pop_3b_sba_count` | integer | Pop 3b sba count. |
| `pop_3b_sba` | numeric | Pop 3b sba. |
| `pop_3b_cs` | numeric | Pop 3b cs. |
| `pop_3b_sb` | numeric | Pop 3b sb. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_running_splits` / `mlbStatcastLeaderboardRunningSplits`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `name_abbrev` | character | Team/name abbreviation. |
| `team_id` | integer | MLBAM team id. |
| `position_name` | character | Position name. |
| `age` | integer | Player age. |
| `bat_side` | character | Batter side (R/L/S). |
| `seconds_since_hit_000` | numeric | Seconds since hit 000. |
| `seconds_since_hit_005` | numeric | Seconds since hit 005. |
| `seconds_since_hit_010` | numeric | Seconds since hit 010. |
| `seconds_since_hit_015` | numeric | Seconds since hit 015. |
| `seconds_since_hit_020` | numeric | Seconds since hit 020. |
| `seconds_since_hit_025` | numeric | Seconds since hit 025. |
| `seconds_since_hit_030` | numeric | Seconds since hit 030. |
| `seconds_since_hit_035` | numeric | Seconds since hit 035. |
| `seconds_since_hit_040` | numeric | Seconds since hit 040. |
| `seconds_since_hit_045` | numeric | Seconds since hit 045. |
| `seconds_since_hit_050` | numeric | Seconds since hit 050. |
| `seconds_since_hit_055` | numeric | Seconds since hit 055. |
| `seconds_since_hit_060` | numeric | Seconds since hit 060. |
| `seconds_since_hit_065` | numeric | Seconds since hit 065. |
| `seconds_since_hit_070` | numeric | Seconds since hit 070. |
| `seconds_since_hit_075` | numeric | Seconds since hit 075. |
| `seconds_since_hit_080` | numeric | Seconds since hit 080. |
| `seconds_since_hit_085` | numeric | Seconds since hit 085. |
| `seconds_since_hit_090` | numeric | Seconds since hit 090. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_spin_direction` / `mlbStatcastLeaderboardSpinDirection`

| col_name | type | description |
|---|---|---|
| `year` | integer | Season year. |
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `pitch_hand` | character | Pitcher handedness (R/L). |
| `api_pitch_type` | character | Pitch type (API code). |
| `n_pitches` | integer | Number of pitches. |
| `release_speed` | numeric | Release speed. |
| `spin_rate` | integer | Spin rate (rpm). |
| `movement_inches` | numeric | Movement inches. |
| `alan_active_spin_pct` | numeric | Alan active spin rate. |
| `active_spin` | numeric | Active (useful) spin (%). |
| `hawkeye_measured` | numeric | Hawkeye measured. |
| `movement_inferred` | numeric | Movement inferred. |
| `api_pitch_name` | character | Api pitch name. |
| `active_spin_formatted` | integer | Active spin (formatted, %). |
| `hawkeye_measured_clock_minutes` | integer | Hawkeye measured clock minutes. |
| `movement_inferred_clock_minutes` | integer | Movement inferred clock minutes. |
| `diff_measured_inferred` | numeric | Diff measured inferred. |
| `diff2` | numeric | Diff2. |
| `diff_measured_inferred_minutes` | integer | Diff measured inferred minutes. |
| `hawkeye_measured_clock_hh` | integer | Hawkeye measured clock hh. |
| `hawkeye_measured_clock_mm` | integer | Hawkeye measured clock mm. |
| `movement_inferred_clock_hh` | integer | Movement inferred clock hh. |
| `movement_inferred_clock_mm` | integer | Movement inferred clock mm. |
| `diff_clock_hh` | integer | Diff clock hh. |
| `diff_clock_mm` | integer | Diff clock mm. |
| `hawkeye_measured_clock_label` | character | Hawkeye measured clock label. |
| `movement_inferred_clock_label` | character | Movement inferred clock label. |
| `diff_clock_label` | character | Diff clock label. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_sprint_speed` / `mlbStatcastLeaderboardSprintSpeed`

| col_name | type | description |
|---|---|---|
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | integer | MLBAM player id. |
| `team_id` | integer | MLBAM team id. |
| `team` | character | Team abbreviation. |
| `position` | character | Position. |
| `age` | integer | Player age. |
| `competitive_runs` | integer | Competitive runs (qualifying sprint-speed runs). |
| `bolts` | integer | Bolts. |
| `hp_to_1b` | numeric | Home-to-first time (s). |
| `sprint_speed` | numeric | Sprint speed (ft/sec, top 50% of competitive runs). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_swing_path` / `mlbStatcastLeaderboardSwingPath`

| col_name | type | description |
|---|---|---|
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `side` | character | Side. |
| `avg_bat_speed` | numeric | Average bat speed (mph). |
| `swing_tilt` | numeric | Swing tilt (deg). |
| `attack_angle` | numeric | Attack angle (deg, bat path at contact). |
| `attack_direction` | numeric | Attack direction (deg, pull/oppo). |
| `ideal_attack_angle_rate` | numeric | Rate of swings in the ideal attack-angle window. |
| `avg_intercept_y_vs_plate` | numeric | Avg intercept y vs plate. |
| `avg_intercept_y_vs_batter` | numeric | Avg intercept y vs batter. |
| `avg_batter_y_position` | numeric | Avg batter y position. |
| `avg_batter_x_position` | numeric | Avg batter x position. |
| `competitive_swings` | integer | Competitive swings. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_swing_take` / `mlbStatcastLeaderboardSwingTake`

| col_name | type | description |
|---|---|---|
| `year` | character | Season year. |
| `last_name, first_name` | character | Last name, first name. |
| `player_id` | character | MLBAM player id. |
| `team_id` | character | MLBAM team id. |
| `pa` | character | Plate appearances. |
| `pitches` | character | Pitches. |
| `runs_all` | character | Runs all. |
| `runs_heart` | character | Runs heart. |
| `runs_shadow` | character | Runs shadow. |
| `runs_chase` | character | Runs chase. |
| `runs_waste` | character | Runs waste. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_swing_timing` / `mlbStatcastLeaderboardSwingTiming`

| col_name | type | description |
|---|---|---|
| `id` | integer | MLBAM player id. |
| `name` | character | Player (or entity) name. |
| `year` | integer | Season year. |
| `team_name` | character | Team name. |
| `bat_side_formatted` | character | Batter side (formatted). |
| `miss_distance` | numeric | Average miss distance (in) on swings. |
| `flawed_percent` | numeric | Flawed rate. |
| `perfect_percent` | numeric | Perfect rate. |
| `tied_up_percent` | numeric | Tied up rate. |
| `avg_x_tied_up` | numeric | Avg x tied up. |
| `centered_percent` | numeric | Centered rate. |
| `flailed_percent` | numeric | Flailed rate. |
| `avg_x_flail` | numeric | Avg x flail. |
| `early_percent` | numeric | Early rate. |
| `avg_y_early` | numeric | Avg y early. |
| `on_time_percent` | numeric | On time rate. |
| `late_percent` | numeric | Late rate. |
| `avg_y_late` | numeric | Avg y late. |
| `n_swings` | integer | Number of swings. |
| `whiff_rate` | numeric | Whiff rate. |
| `competitive_percent` | numeric | Competitive rate. |
| `over_percent` | numeric | Over rate. |
| `avg_z_over` | numeric | Avg z over. |
| `lined_up_percent` | numeric | Lined up rate. |
| `under_percent` | numeric | Under rate. |
| `avg_z_under` | numeric | Avg z under. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_timer_infractions` / `mlbStatcastLeaderboardTimerInfractions`

| col_name | type | description |
|---|---|---|
| `entity_id` | character | MLBAM id of the player/team entity. |
| `entity_name` | character | Player (or team) entity name. |
| `year` | character | Season year. |
| `pitches` | character | Pitches. |
| `all_violations` | character | Pitch-timer violations (total). |
| `pitcher_timer` | character | Pitcher timer. |
| `batter_timer` | character | Batter timer. |
| `batter_timeout` | character | Batter timeout. |
| `catcher_timer` | character | Catcher timer. |
| `defensive_shift` | character | Defensive shift. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_leaderboard_year_to_year` / `mlbStatcastLeaderboardYearToYear`

| col_name | type | description |
|---|---|---|
| `name` | character | Player (or entity) name. |
| `entity_id` | integer | MLBAM id of the player/team entity. |
| `2015` | character | 2015. |
| `2016` | character | 2016. |
| `delta_2015_2016` | character | Delta 2015 2016. |
| `2017` | character | 2017. |
| `delta_2016_2017` | character | Delta 2016 2017. |
| `2018` | character | 2018. |
| `delta_2017_2018` | character | Delta 2017 2018. |
| `2019` | character | 2019. |
| `delta_2018_2019` | character | Delta 2018 2019. |
| `2020` | character | 2020. |
| `delta_2019_2020` | character | Delta 2019 2020. |
| `2021` | character | 2021. |
| `delta_2020_2021` | character | Delta 2020 2021. |
| `2022` | character | 2022. |
| `delta_2021_2022` | character | Delta 2021 2022. |
| `2023` | character | 2023. |
| `delta_2022_2023` | character | Delta 2022 2023. |
| `2024` | character | 2024. |
| `delta_2023_2024` | character | Delta 2023 2024. |
| `2025` | character | 2025. |
| `delta_2024_2025` | character | Delta 2024 2025. |
| `2026` | character | 2026. |
| `delta_2025_2026` | character | Delta 2025 2026. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_schedule` / `mlbStatcastSchedule`

| col_name | type | description |
|---|---|---|
| `game_pk` | integer | MLBAM game id. |
| `game_guid` | character | Game GUID. |
| `link` | character | Stats API resource link. |
| `game_type` | character | Game type code (R/F/D/L/W/S/E/A). |
| `season` | character | Season year. |
| `game_date` | character | Game date/time (ISO 8601, UTC offset). |
| `official_date` | character | Official game date (YYYY-MM-DD). |
| `game_number` | integer | Game number (1, or 2 for the nightcap of a doubleheader). |
| `public_facing` | logical | Public facing. |
| `double_header` | character | Doubleheader flag (Y/N/S). |
| `gameday_type` | character | Gameday type. |
| `tiebreaker` | character | Tiebreaker. |
| `calendar_event_id` | character | Calendar event id. |
| `season_display` | character | Season display. |
| `day_night` | character | Day or night game. |
| `scheduled_innings` | integer | Scheduled innings (usually 9). |
| `reverse_home_away_status` | logical | Reverse home away status. |
| `inning_break_length` | integer | Inning break length. |
| `games_in_series` | integer | Total games in the series. |
| `series_game_number` | integer | Game number within the series. |
| `series_description` | character | Series description. |
| `record_source` | character | Record source. |
| `if_necessary` | character | If necessary. |
| `if_necessary_description` | character | If necessary description. |
| `status_abstract_game_state` | character | Status abstract game state. |
| `status_coded_game_state` | character | Status coded game state. |
| `status_detailed_state` | character | Status detailed state. |
| `status_status_code` | character | Status status code. |
| `status_start_time_tbd` | logical | Status start time tbd. |
| `status_abstract_game_code` | character | Status abstract game code. |
| `teams_away_team_spring_league_id` | integer | Away team team spring league id. |
| `teams_away_team_spring_league_name` | character | Away team team spring league name. |
| `teams_away_team_spring_league_link` | character | Away team team spring league link. |
| `teams_away_team_spring_league_abbreviation` | character | Away team team spring league abbreviation. |
| `teams_away_team_all_star_status` | character | Away team team all star status. |
| `teams_away_team_id` | integer | Away team team id. |
| `teams_away_team_name` | character | Away team team name. |
| `teams_away_team_link` | character | Away team team link. |
| `teams_away_team_season` | integer | Away team team season. |
| `teams_away_team_venue_id` | integer | Away team team venue id. |
| `teams_away_team_venue_name` | character | Away team team venue name. |
| `teams_away_team_venue_link` | character | Away team team venue link. |
| `teams_away_team_spring_venue_id` | integer | Away team team spring venue id. |
| `teams_away_team_spring_venue_link` | character | Away team team spring venue link. |
| `teams_away_team_team_code` | character | Away team team team code. |
| `teams_away_team_file_code` | character | Away team team file code. |
| `teams_away_team_abbreviation` | character | Away team team abbreviation. |
| `teams_away_team_team_name` | character | Away team team team name. |
| `teams_away_team_location_name` | character | Away team team location name. |
| `teams_away_team_first_year_of_play` | character | Away team team first year of play. |
| `teams_away_team_league_id` | integer | Away team team league id. |
| `teams_away_team_league_name` | character | Away team team league name. |
| `teams_away_team_league_link` | character | Away team team league link. |
| `teams_away_team_division_id` | integer | Away team team division id. |
| `teams_away_team_division_name` | character | Away team team division name. |
| `teams_away_team_division_link` | character | Away team team division link. |
| `teams_away_team_sport_id` | integer | Away team team sport id. |
| `teams_away_team_sport_link` | character | Away team team sport link. |
| `teams_away_team_sport_name` | character | Away team team sport name. |
| `teams_away_team_short_name` | character | Away team team short name. |
| `teams_away_team_franchise_name` | character | Away team team franchise name. |
| `teams_away_team_club_name` | character | Away team team club name. |
| `teams_away_team_active` | logical | Away team team active. |
| `teams_away_league_record_wins` | integer | Away team league record wins. |
| `teams_away_league_record_losses` | integer | Away team league record losses. |
| `teams_away_league_record_ties` | integer | Away team league record ties. |
| `teams_away_league_record_pct` | character | Away team league record rate. |
| `teams_away_probable_pitcher_id` | integer | Away team probable pitcher id. |
| `teams_away_probable_pitcher_full_name` | character | Away team probable pitcher full name. |
| `teams_away_probable_pitcher_link` | character | Away team probable pitcher link. |
| `teams_away_probable_pitcher_first_name` | character | Away team probable pitcher first name. |
| `teams_away_probable_pitcher_last_name` | character | Away team probable pitcher last name. |
| `teams_away_probable_pitcher_primary_number` | character | Away team probable pitcher primary number. |
| `teams_away_probable_pitcher_birth_date` | character | Away team probable pitcher birth date. |
| `teams_away_probable_pitcher_current_age` | integer | Away team probable pitcher current age. |
| `teams_away_probable_pitcher_birth_city` | character | Away team probable pitcher birth city. |
| `teams_away_probable_pitcher_birth_state_province` | character | Away team probable pitcher birth state province. |
| `teams_away_probable_pitcher_birth_country` | character | Away team probable pitcher birth country. |
| `teams_away_probable_pitcher_height` | character | Away team probable pitcher height. |
| `teams_away_probable_pitcher_weight` | integer | Away team probable pitcher weight. |
| `teams_away_probable_pitcher_active` | logical | Away team probable pitcher active. |
| `teams_away_probable_pitcher_primary_position_code` | character | Away team probable pitcher primary position code. |
| `teams_away_probable_pitcher_primary_position_name` | character | Away team probable pitcher primary position name. |
| `teams_away_probable_pitcher_primary_position_type` | character | Away team probable pitcher primary position type. |
| `teams_away_probable_pitcher_primary_position_abbreviation` | character | Away team probable pitcher primary position abbreviation. |
| `teams_away_probable_pitcher_use_name` | character | Away team probable pitcher use name. |
| `teams_away_probable_pitcher_use_last_name` | character | Away team probable pitcher use last name. |
| `teams_away_probable_pitcher_middle_name` | character | Away team probable pitcher middle name. |
| `teams_away_probable_pitcher_boxscore_name` | character | Away team probable pitcher boxscore name. |
| `teams_away_probable_pitcher_gender` | character | Away team probable pitcher gender. |
| `teams_away_probable_pitcher_is_player` | logical | Away team probable pitcher is player. |
| `teams_away_probable_pitcher_is_verified` | logical | Away team probable pitcher is verified. |
| `teams_away_probable_pitcher_draft_year` | integer | Away team probable pitcher draft year. |
| `teams_away_probable_pitcher_mlb_debut_date` | character | Away team probable pitcher mlb debut date. |
| `teams_away_probable_pitcher_bat_side_code` | character | Away team probable pitcher bat side code. |
| `teams_away_probable_pitcher_bat_side_description` | character | Away team probable pitcher bat side description. |
| `teams_away_probable_pitcher_pitch_hand_code` | character | Away team probable pitcher pitch hand code. |
| `teams_away_probable_pitcher_pitch_hand_description` | character | Away team probable pitcher pitch hand description. |
| `teams_away_probable_pitcher_name_first_last` | character | Away team probable pitcher name first last. |
| `teams_away_probable_pitcher_name_slug` | character | Away team probable pitcher name slug. |
| `teams_away_probable_pitcher_first_last_name` | character | Away team probable pitcher first last name. |
| `teams_away_probable_pitcher_last_first_name` | character | Away team probable pitcher last first name. |
| `teams_away_probable_pitcher_last_init_name` | character | Away team probable pitcher last init name. |
| `teams_away_probable_pitcher_init_last_name` | character | Away team probable pitcher init last name. |
| `teams_away_probable_pitcher_full_fml_name` | character | Away team probable pitcher full fml name. |
| `teams_away_probable_pitcher_full_lfm_name` | character | Away team probable pitcher full lfm name. |
| `teams_away_probable_pitcher_strike_zone_top` | numeric | Away team probable pitcher strike zone top. |
| `teams_away_probable_pitcher_strike_zone_bottom` | numeric | Away team probable pitcher strike zone bottom. |
| `teams_away_split_squad` | logical | Away team split squad. |
| `teams_away_series_number` | integer | Away team series number. |
| `teams_away_spring_league_id` | integer | Away team spring league id. |
| `teams_away_spring_league_name` | character | Away team spring league name. |
| `teams_away_spring_league_link` | character | Away team spring league link. |
| `teams_away_spring_league_abbreviation` | character | Away team spring league abbreviation. |
| `teams_home_team_spring_league_id` | integer | Home team team spring league id. |
| `teams_home_team_spring_league_name` | character | Home team team spring league name. |
| `teams_home_team_spring_league_link` | character | Home team team spring league link. |
| `teams_home_team_spring_league_abbreviation` | character | Home team team spring league abbreviation. |
| `teams_home_team_all_star_status` | character | Home team team all star status. |
| `teams_home_team_id` | integer | Home team team id. |
| `teams_home_team_name` | character | Home team team name. |
| `teams_home_team_link` | character | Home team team link. |
| `teams_home_team_season` | integer | Home team team season. |
| `teams_home_team_venue_id` | integer | Home team team venue id. |
| `teams_home_team_venue_name` | character | Home team team venue name. |
| `teams_home_team_venue_link` | character | Home team team venue link. |
| `teams_home_team_spring_venue_id` | integer | Home team team spring venue id. |
| `teams_home_team_spring_venue_link` | character | Home team team spring venue link. |
| `teams_home_team_team_code` | character | Home team team team code. |
| `teams_home_team_file_code` | character | Home team team file code. |
| `teams_home_team_abbreviation` | character | Home team team abbreviation. |
| `teams_home_team_team_name` | character | Home team team team name. |
| `teams_home_team_location_name` | character | Home team team location name. |
| `teams_home_team_first_year_of_play` | character | Home team team first year of play. |
| `teams_home_team_league_id` | integer | Home team team league id. |
| `teams_home_team_league_name` | character | Home team team league name. |
| `teams_home_team_league_link` | character | Home team team league link. |
| `teams_home_team_division_id` | integer | Home team team division id. |
| `teams_home_team_division_name` | character | Home team team division name. |
| `teams_home_team_division_link` | character | Home team team division link. |
| `teams_home_team_sport_id` | integer | Home team team sport id. |
| `teams_home_team_sport_link` | character | Home team team sport link. |
| `teams_home_team_sport_name` | character | Home team team sport name. |
| `teams_home_team_short_name` | character | Home team team short name. |
| `teams_home_team_franchise_name` | character | Home team team franchise name. |
| `teams_home_team_club_name` | character | Home team team club name. |
| `teams_home_team_active` | logical | Home team team active. |
| `teams_home_league_record_wins` | integer | Home team league record wins. |
| `teams_home_league_record_losses` | integer | Home team league record losses. |
| `teams_home_league_record_ties` | integer | Home team league record ties. |
| `teams_home_league_record_pct` | character | Home team league record rate. |
| `teams_home_probable_pitcher_id` | integer | Home team probable pitcher id. |
| `teams_home_probable_pitcher_full_name` | character | Home team probable pitcher full name. |
| `teams_home_probable_pitcher_link` | character | Home team probable pitcher link. |
| `teams_home_probable_pitcher_first_name` | character | Home team probable pitcher first name. |
| `teams_home_probable_pitcher_last_name` | character | Home team probable pitcher last name. |
| `teams_home_probable_pitcher_primary_number` | character | Home team probable pitcher primary number. |
| `teams_home_probable_pitcher_birth_date` | character | Home team probable pitcher birth date. |
| `teams_home_probable_pitcher_current_age` | integer | Home team probable pitcher current age. |
| `teams_home_probable_pitcher_birth_city` | character | Home team probable pitcher birth city. |
| `teams_home_probable_pitcher_birth_state_province` | character | Home team probable pitcher birth state province. |
| `teams_home_probable_pitcher_birth_country` | character | Home team probable pitcher birth country. |
| `teams_home_probable_pitcher_height` | character | Home team probable pitcher height. |
| `teams_home_probable_pitcher_weight` | integer | Home team probable pitcher weight. |
| `teams_home_probable_pitcher_active` | logical | Home team probable pitcher active. |
| `teams_home_probable_pitcher_primary_position_code` | character | Home team probable pitcher primary position code. |
| `teams_home_probable_pitcher_primary_position_name` | character | Home team probable pitcher primary position name. |
| `teams_home_probable_pitcher_primary_position_type` | character | Home team probable pitcher primary position type. |
| `teams_home_probable_pitcher_primary_position_abbreviation` | character | Home team probable pitcher primary position abbreviation. |
| `teams_home_probable_pitcher_use_name` | character | Home team probable pitcher use name. |
| `teams_home_probable_pitcher_use_last_name` | character | Home team probable pitcher use last name. |
| `teams_home_probable_pitcher_middle_name` | character | Home team probable pitcher middle name. |
| `teams_home_probable_pitcher_boxscore_name` | character | Home team probable pitcher boxscore name. |
| `teams_home_probable_pitcher_nick_name` | character | Home team probable pitcher nick name. |
| `teams_home_probable_pitcher_gender` | character | Home team probable pitcher gender. |
| `teams_home_probable_pitcher_is_player` | logical | Home team probable pitcher is player. |
| `teams_home_probable_pitcher_is_verified` | logical | Home team probable pitcher is verified. |
| `teams_home_probable_pitcher_draft_year` | integer | Home team probable pitcher draft year. |
| `teams_home_probable_pitcher_mlb_debut_date` | character | Home team probable pitcher mlb debut date. |
| `teams_home_probable_pitcher_bat_side_code` | character | Home team probable pitcher bat side code. |
| `teams_home_probable_pitcher_bat_side_description` | character | Home team probable pitcher bat side description. |
| `teams_home_probable_pitcher_pitch_hand_code` | character | Home team probable pitcher pitch hand code. |
| `teams_home_probable_pitcher_pitch_hand_description` | character | Home team probable pitcher pitch hand description. |
| `teams_home_probable_pitcher_name_first_last` | character | Home team probable pitcher name first last. |
| `teams_home_probable_pitcher_name_slug` | character | Home team probable pitcher name slug. |
| `teams_home_probable_pitcher_first_last_name` | character | Home team probable pitcher first last name. |
| `teams_home_probable_pitcher_last_first_name` | character | Home team probable pitcher last first name. |
| `teams_home_probable_pitcher_last_init_name` | character | Home team probable pitcher last init name. |
| `teams_home_probable_pitcher_init_last_name` | character | Home team probable pitcher init last name. |
| `teams_home_probable_pitcher_full_fml_name` | character | Home team probable pitcher full fml name. |
| `teams_home_probable_pitcher_full_lfm_name` | character | Home team probable pitcher full lfm name. |
| `teams_home_probable_pitcher_strike_zone_top` | numeric | Home team probable pitcher strike zone top. |
| `teams_home_probable_pitcher_strike_zone_bottom` | numeric | Home team probable pitcher strike zone bottom. |
| `teams_home_split_squad` | logical | Home team split squad. |
| `teams_home_series_number` | integer | Home team series number. |
| `teams_home_spring_league_id` | integer | Home team spring league id. |
| `teams_home_spring_league_name` | character | Home team spring league name. |
| `teams_home_spring_league_link` | character | Home team spring league link. |
| `teams_home_spring_league_abbreviation` | character | Home team spring league abbreviation. |
| `linescore_scheduled_innings` | integer | Linescore scheduled innings. |
| `linescore_innings` | character | Linescore innings. |
| `linescore_defense_team_id` | integer | Linescore defense team id. |
| `linescore_defense_team_name` | character | Linescore defense team name. |
| `linescore_defense_team_link` | character | Linescore defense team link. |
| `linescore_offense_team_id` | integer | Linescore offense team id. |
| `linescore_offense_team_name` | character | Linescore offense team name. |
| `linescore_offense_team_link` | character | Linescore offense team link. |
| `venue_id` | integer | MLBAM venue id. |
| `venue_name` | character | Ballpark name. |
| `venue_link` | character | Venue link. |
| `content_link` | character | Content link. |

**Row type:** `MlbStatcastScheduleRow` (exported from the package root).

### Returns — `mlb_statcast_search` / `mlbStatcastSearch`

| col_name | type | description |
|---|---|---|
| `pitch_type` | character | Pitch type code. |
| `game_date` | character | Game date. |
| `release_speed` | numeric | Release speed. |
| `release_pos_x` | numeric | Release pos x. |
| `release_pos_z` | numeric | Release pos z. |
| `player_name` | character | Player name. |
| `batter` | integer | MLBAM id of the batter. |
| `pitcher` | integer | MLBAM id of the pitcher. |
| `events` | character | Events. |
| `description` | character | Description. |
| `spin_dir` | character | Spin dir. |
| `spin_rate_deprecated` | character | Spin rate deprecated. |
| `break_angle_deprecated` | character | Break angle deprecated. |
| `break_length_deprecated` | character | Break length deprecated. |
| `zone` | integer | Zone. |
| `des` | character | Des. |
| `game_type` | character | Game type. |
| `stand` | character | Batter stance side (R/L). |
| `p_throws` | character | Pitcher throwing hand (R/L). |
| `home_team` | character | Home team. |
| `away_team` | character | Away team. |
| `type` | character | Record/pitch type. |
| `hit_location` | integer | Hit location. |
| `bb_type` | character | Bb type. |
| `balls` | integer | Balls. |
| `strikes` | integer | Strikes. |
| `game_year` | integer | Game year. |
| `pfx_x` | numeric | Horizontal movement (in, pitcher perspective). |
| `pfx_z` | numeric | Induced vertical movement (in). |
| `plate_x` | numeric | Plate x. |
| `plate_z` | numeric | Plate z. |
| `on_3b` | character | On 3b. |
| `on_2b` | character | On 2b. |
| `on_1b` | character | On 1b. |
| `outs_when_up` | integer | Outs when up. |
| `inning` | integer | Inning. |
| `inning_topbot` | character | Inning topbot. |
| `hc_x` | numeric | Hc x. |
| `hc_y` | numeric | Hc y. |
| `tfs_deprecated` | character | Tfs deprecated. |
| `tfs_zulu_deprecated` | character | Tfs zulu deprecated. |
| `umpire` | character | Umpire. |
| `sv_id` | character | Sv id. |
| `vx0` | numeric | Vx0. |
| `vy0` | numeric | Vy0. |
| `vz0` | numeric | Vz0. |
| `ax` | numeric | Ax. |
| `ay` | numeric | Ay. |
| `az` | numeric | Az. |
| `sz_top` | numeric | Sz top. |
| `sz_bot` | numeric | Sz bot. |
| `hit_distance_sc` | integer | Hit distance sc. |
| `launch_speed` | numeric | Exit velocity of the batted ball (mph). |
| `launch_angle` | integer | Launch angle (deg). |
| `effective_speed` | integer | Effective speed. |
| `release_spin_rate` | integer | Release spin rate. |
| `release_extension` | numeric | Release extension. |
| `game_pk` | integer | MLBAM game id. |
| `fielder_2` | integer | Fielder 2. |
| `fielder_3` | integer | Fielder 3. |
| `fielder_4` | integer | Fielder 4. |
| `fielder_5` | integer | Fielder 5. |
| `fielder_6` | integer | Fielder 6. |
| `fielder_7` | integer | Fielder 7. |
| `fielder_8` | integer | Fielder 8. |
| `fielder_9` | integer | Fielder 9. |
| `release_pos_y` | numeric | Release pos y. |
| `estimated_ba_using_speedangle` | numeric | Estimated ba using speedangle. |
| `estimated_woba_using_speedangle` | numeric | Estimated woba using speedangle. |
| `woba_value` | integer | Woba value. |
| `woba_denom` | integer | Woba denom. |
| `babip_value` | integer | Babip value. |
| `iso_value` | integer | Iso value. |
| `launch_speed_angle` | integer | Launch speed angle. |
| `at_bat_number` | integer | At bat number. |
| `pitch_number` | integer | Pitch number. |
| `pitch_name` | character | Pitch type name. |
| `home_score` | integer | Home score. |
| `away_score` | integer | Away score. |
| `bat_score` | integer | Bat score. |
| `fld_score` | integer | Fld score. |
| `post_away_score` | integer | Post away score. |
| `post_home_score` | integer | Post home score. |
| `post_bat_score` | integer | Post bat score. |
| `post_fld_score` | integer | Post fld score. |
| `if_fielding_alignment` | character | If fielding alignment. |
| `of_fielding_alignment` | character | Of fielding alignment. |
| `spin_axis` | integer | Spin axis. |
| `delta_home_win_exp` | numeric | Delta home win exp. |
| `delta_run_exp` | numeric | Delta run exp. |
| `bat_speed` | numeric | Bat speed (mph). |
| `swing_length` | numeric | Swing length (ft, head travel). |
| `miss_distance` | character | Average miss distance (in) on swings. |
| `estimated_slg_using_speedangle` | numeric | Estimated slg using speedangle. |
| `delta_pitcher_run_exp` | numeric | Delta pitcher run exp. |
| `hyper_speed` | numeric | Hyper speed. |
| `home_score_diff` | integer | Home score diff. |
| `bat_score_diff` | integer | Bat score diff. |
| `home_win_exp` | numeric | Home win exp. |
| `bat_win_exp` | numeric | Bat win exp. |
| `age_pit_legacy` | integer | Age pit legacy. |
| `age_bat_legacy` | integer | Age bat legacy. |
| `age_pit` | integer | Age pit. |
| `age_bat` | integer | Age bat. |
| `n_thruorder_pitcher` | integer | Number of thruorder pitcher. |
| `n_priorpa_thisgame_player_at_bat` | integer | Number of priorpa thisgame player at bat. |
| `pitcher_days_since_prev_game` | integer | Pitcher days since prev game. |
| `batter_days_since_prev_game` | integer | Batter days since prev game. |
| `pitcher_days_until_next_game` | integer | Pitcher days until next game. |
| `batter_days_until_next_game` | integer | Batter days until next game. |
| `api_break_z_with_gravity` | numeric | Api break z with gravity. |
| `api_break_x_arm` | numeric | Api break x arm. |
| `api_break_x_batter_in` | numeric | Api break x batter in. |
| `arm_angle` | numeric | Arm angle. |
| `attack_angle` | numeric | Attack angle (deg, bat path at contact). |
| `attack_direction` | numeric | Attack direction (deg, pull/oppo). |
| `swing_path_tilt` | numeric | Swing-path tilt (deg). |
| `intercept_ball_minus_batter_pos_x_inches` | numeric | Intercept ball minus batter pos x inches. |
| `intercept_ball_minus_batter_pos_y_inches` | numeric | Intercept ball minus batter pos y inches. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_search_minors` / `mlbStatcastSearchMinors`

| col_name | type | description |
|---|---|---|
| `pitch_type` | character | Pitch type code. |
| `game_date` | character | Game date. |
| `release_speed` | numeric | Release speed. |
| `release_pos_x` | numeric | Release pos x. |
| `release_pos_z` | numeric | Release pos z. |
| `player_name` | character | Player name. |
| `batter` | integer | MLBAM id of the batter. |
| `pitcher` | integer | MLBAM id of the pitcher. |
| `events` | character | Events. |
| `description` | character | Description. |
| `spin_dir` | character | Spin dir. |
| `spin_rate_deprecated` | character | Spin rate deprecated. |
| `break_angle_deprecated` | character | Break angle deprecated. |
| `break_length_deprecated` | character | Break length deprecated. |
| `zone` | integer | Zone. |
| `des` | character | Des. |
| `game_type` | character | Game type. |
| `stand` | character | Batter stance side (R/L). |
| `p_throws` | character | Pitcher throwing hand (R/L). |
| `home_team` | character | Home team. |
| `away_team` | character | Away team. |
| `type` | character | Record/pitch type. |
| `hit_location` | integer | Hit location. |
| `bb_type` | character | Bb type. |
| `balls` | integer | Balls. |
| `strikes` | integer | Strikes. |
| `game_year` | integer | Game year. |
| `pfx_x` | numeric | Horizontal movement (in, pitcher perspective). |
| `pfx_z` | numeric | Induced vertical movement (in). |
| `plate_x` | numeric | Plate x. |
| `plate_z` | numeric | Plate z. |
| `on_3b` | character | On 3b. |
| `on_2b` | character | On 2b. |
| `on_1b` | character | On 1b. |
| `outs_when_up` | integer | Outs when up. |
| `inning` | integer | Inning. |
| `inning_topbot` | character | Inning topbot. |
| `hc_x` | numeric | Hc x. |
| `hc_y` | numeric | Hc y. |
| `tfs_deprecated` | character | Tfs deprecated. |
| `tfs_zulu_deprecated` | character | Tfs zulu deprecated. |
| `umpire` | character | Umpire. |
| `sv_id` | character | Sv id. |
| `vx0` | numeric | Vx0. |
| `vy0` | numeric | Vy0. |
| `vz0` | numeric | Vz0. |
| `ax` | numeric | Ax. |
| `ay` | numeric | Ay. |
| `az` | numeric | Az. |
| `sz_top` | numeric | Sz top. |
| `sz_bot` | numeric | Sz bot. |
| `hit_distance_sc` | integer | Hit distance sc. |
| `launch_speed` | numeric | Exit velocity of the batted ball (mph). |
| `launch_angle` | integer | Launch angle (deg). |
| `effective_speed` | integer | Effective speed. |
| `release_spin_rate` | integer | Release spin rate. |
| `release_extension` | numeric | Release extension. |
| `game_pk` | integer | MLBAM game id. |
| `fielder_2` | integer | Fielder 2. |
| `fielder_3` | integer | Fielder 3. |
| `fielder_4` | integer | Fielder 4. |
| `fielder_5` | integer | Fielder 5. |
| `fielder_6` | integer | Fielder 6. |
| `fielder_7` | integer | Fielder 7. |
| `fielder_8` | integer | Fielder 8. |
| `fielder_9` | integer | Fielder 9. |
| `release_pos_y` | numeric | Release pos y. |
| `estimated_ba_using_speedangle` | numeric | Estimated ba using speedangle. |
| `estimated_woba_using_speedangle` | numeric | Estimated woba using speedangle. |
| `woba_value` | integer | Woba value. |
| `woba_denom` | integer | Woba denom. |
| `babip_value` | integer | Babip value. |
| `iso_value` | integer | Iso value. |
| `launch_speed_angle` | integer | Launch speed angle. |
| `at_bat_number` | integer | At bat number. |
| `pitch_number` | integer | Pitch number. |
| `pitch_name` | character | Pitch type name. |
| `home_score` | integer | Home score. |
| `away_score` | integer | Away score. |
| `bat_score` | integer | Bat score. |
| `fld_score` | integer | Fld score. |
| `post_away_score` | integer | Post away score. |
| `post_home_score` | integer | Post home score. |
| `post_bat_score` | integer | Post bat score. |
| `post_fld_score` | integer | Post fld score. |
| `if_fielding_alignment` | character | If fielding alignment. |
| `of_fielding_alignment` | character | Of fielding alignment. |
| `spin_axis` | integer | Spin axis. |
| `delta_home_win_exp` | numeric | Delta home win exp. |
| `delta_run_exp` | numeric | Delta run exp. |
| `bat_speed` | numeric | Bat speed (mph). |
| `swing_length` | numeric | Swing length (ft, head travel). |
| `miss_distance` | character | Average miss distance (in) on swings. |
| `estimated_slg_using_speedangle` | numeric | Estimated slg using speedangle. |
| `delta_pitcher_run_exp` | numeric | Delta pitcher run exp. |
| `hyper_speed` | numeric | Hyper speed. |
| `home_score_diff` | integer | Home score diff. |
| `bat_score_diff` | integer | Bat score diff. |
| `home_win_exp` | numeric | Home win exp. |
| `bat_win_exp` | numeric | Bat win exp. |
| `age_pit_legacy` | integer | Age pit legacy. |
| `age_bat_legacy` | integer | Age bat legacy. |
| `age_pit` | integer | Age pit. |
| `age_bat` | integer | Age bat. |
| `n_thruorder_pitcher` | integer | Number of thruorder pitcher. |
| `n_priorpa_thisgame_player_at_bat` | integer | Number of priorpa thisgame player at bat. |
| `pitcher_days_since_prev_game` | integer | Pitcher days since prev game. |
| `batter_days_since_prev_game` | integer | Batter days since prev game. |
| `pitcher_days_until_next_game` | integer | Pitcher days until next game. |
| `batter_days_until_next_game` | integer | Batter days until next game. |
| `api_break_z_with_gravity` | numeric | Api break z with gravity. |
| `api_break_x_arm` | numeric | Api break x arm. |
| `api_break_x_batter_in` | numeric | Api break x batter in. |
| `arm_angle` | numeric | Arm angle. |
| `attack_angle` | numeric | Attack angle (deg, bat path at contact). |
| `attack_direction` | numeric | Attack direction (deg, pull/oppo). |
| `swing_path_tilt` | numeric | Swing-path tilt (deg). |
| `intercept_ball_minus_batter_pos_x_inches` | numeric | Intercept ball minus batter pos x inches. |
| `intercept_ball_minus_batter_pos_y_inches` | numeric | Intercept ball minus batter pos y inches. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_search_wbc` / `mlbStatcastSearchWbc`

| col_name | type | description |
|---|---|---|
| `pitch_type` | character | Pitch type code. |
| `game_date` | character | Game date. |
| `release_speed` | numeric | Release speed. |
| `release_pos_x` | numeric | Release pos x. |
| `release_pos_z` | numeric | Release pos z. |
| `player_name` | character | Player name. |
| `batter` | integer | MLBAM id of the batter. |
| `pitcher` | integer | MLBAM id of the pitcher. |
| `events` | character | Events. |
| `description` | character | Description. |
| `spin_dir` | character | Spin dir. |
| `spin_rate_deprecated` | character | Spin rate deprecated. |
| `break_angle_deprecated` | character | Break angle deprecated. |
| `break_length_deprecated` | character | Break length deprecated. |
| `zone` | integer | Zone. |
| `des` | character | Des. |
| `game_type` | character | Game type. |
| `stand` | character | Batter stance side (R/L). |
| `p_throws` | character | Pitcher throwing hand (R/L). |
| `home_team` | character | Home team. |
| `away_team` | character | Away team. |
| `type` | character | Record/pitch type. |
| `hit_location` | integer | Hit location. |
| `bb_type` | character | Bb type. |
| `balls` | integer | Balls. |
| `strikes` | integer | Strikes. |
| `game_year` | integer | Game year. |
| `pfx_x` | numeric | Horizontal movement (in, pitcher perspective). |
| `pfx_z` | numeric | Induced vertical movement (in). |
| `plate_x` | numeric | Plate x. |
| `plate_z` | numeric | Plate z. |
| `on_3b` | character | On 3b. |
| `on_2b` | character | On 2b. |
| `on_1b` | character | On 1b. |
| `outs_when_up` | integer | Outs when up. |
| `inning` | integer | Inning. |
| `inning_topbot` | character | Inning topbot. |
| `hc_x` | numeric | Hc x. |
| `hc_y` | numeric | Hc y. |
| `tfs_deprecated` | character | Tfs deprecated. |
| `tfs_zulu_deprecated` | character | Tfs zulu deprecated. |
| `umpire` | character | Umpire. |
| `sv_id` | character | Sv id. |
| `vx0` | numeric | Vx0. |
| `vy0` | numeric | Vy0. |
| `vz0` | numeric | Vz0. |
| `ax` | numeric | Ax. |
| `ay` | numeric | Ay. |
| `az` | numeric | Az. |
| `sz_top` | numeric | Sz top. |
| `sz_bot` | numeric | Sz bot. |
| `hit_distance_sc` | integer | Hit distance sc. |
| `launch_speed` | numeric | Exit velocity of the batted ball (mph). |
| `launch_angle` | integer | Launch angle (deg). |
| `effective_speed` | integer | Effective speed. |
| `release_spin_rate` | integer | Release spin rate. |
| `release_extension` | numeric | Release extension. |
| `game_pk` | integer | MLBAM game id. |
| `fielder_2` | integer | Fielder 2. |
| `fielder_3` | integer | Fielder 3. |
| `fielder_4` | integer | Fielder 4. |
| `fielder_5` | integer | Fielder 5. |
| `fielder_6` | integer | Fielder 6. |
| `fielder_7` | integer | Fielder 7. |
| `fielder_8` | integer | Fielder 8. |
| `fielder_9` | integer | Fielder 9. |
| `release_pos_y` | numeric | Release pos y. |
| `estimated_ba_using_speedangle` | numeric | Estimated ba using speedangle. |
| `estimated_woba_using_speedangle` | numeric | Estimated woba using speedangle. |
| `woba_value` | integer | Woba value. |
| `woba_denom` | integer | Woba denom. |
| `babip_value` | integer | Babip value. |
| `iso_value` | integer | Iso value. |
| `launch_speed_angle` | integer | Launch speed angle. |
| `at_bat_number` | integer | At bat number. |
| `pitch_number` | integer | Pitch number. |
| `pitch_name` | character | Pitch type name. |
| `home_score` | integer | Home score. |
| `away_score` | integer | Away score. |
| `bat_score` | integer | Bat score. |
| `fld_score` | integer | Fld score. |
| `post_away_score` | integer | Post away score. |
| `post_home_score` | integer | Post home score. |
| `post_bat_score` | integer | Post bat score. |
| `post_fld_score` | integer | Post fld score. |
| `if_fielding_alignment` | character | If fielding alignment. |
| `of_fielding_alignment` | character | Of fielding alignment. |
| `spin_axis` | integer | Spin axis. |
| `delta_home_win_exp` | numeric | Delta home win exp. |
| `delta_run_exp` | numeric | Delta run exp. |
| `bat_speed` | numeric | Bat speed (mph). |
| `swing_length` | numeric | Swing length (ft, head travel). |
| `miss_distance` | character | Average miss distance (in) on swings. |
| `estimated_slg_using_speedangle` | numeric | Estimated slg using speedangle. |
| `delta_pitcher_run_exp` | numeric | Delta pitcher run exp. |
| `hyper_speed` | numeric | Hyper speed. |
| `home_score_diff` | integer | Home score diff. |
| `bat_score_diff` | integer | Bat score diff. |
| `home_win_exp` | numeric | Home win exp. |
| `bat_win_exp` | numeric | Bat win exp. |
| `age_pit_legacy` | integer | Age pit legacy. |
| `age_bat_legacy` | integer | Age bat legacy. |
| `age_pit` | integer | Age pit. |
| `age_bat` | integer | Age bat. |
| `n_thruorder_pitcher` | integer | Number of thruorder pitcher. |
| `n_priorpa_thisgame_player_at_bat` | integer | Number of priorpa thisgame player at bat. |
| `pitcher_days_since_prev_game` | integer | Pitcher days since prev game. |
| `batter_days_since_prev_game` | integer | Batter days since prev game. |
| `pitcher_days_until_next_game` | integer | Pitcher days until next game. |
| `batter_days_until_next_game` | integer | Batter days until next game. |
| `api_break_z_with_gravity` | numeric | Api break z with gravity. |
| `api_break_x_arm` | numeric | Api break x arm. |
| `api_break_x_batter_in` | numeric | Api break x batter in. |
| `arm_angle` | numeric | Arm angle. |
| `attack_angle` | numeric | Attack angle (deg, bat path at contact). |
| `attack_direction` | numeric | Attack direction (deg, pull/oppo). |
| `swing_path_tilt` | numeric | Swing-path tilt (deg). |
| `intercept_ball_minus_batter_pos_x_inches` | numeric | Intercept ball minus batter pos x inches. |
| `intercept_ball_minus_batter_pos_y_inches` | numeric | Intercept ball minus batter pos y inches. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mlb_statcast_player` / `mlbStatcastPlayer`

| col_name | type | description |
|---|---|---|
| `aggregate` | integer | Aggregate. |
| `year` | integer | Season year. |
| `yearhidden` | integer | Yearhidden. |
| `player_id` | integer | MLBAM player id. |
| `age` | integer | Player age. |
| `bat_side` | character | Batter side (R/L/S). |
| `pitch_hand` | character | Pitcher handedness (R/L). |
| `month` | character | Month. |
| `grouping_code` | character | Grouping code. |
| `grouping_cat` | character | Grouping cat. |
| `pitch_count` | integer | Pitch count. |
| `in_zone_percent` | numeric | In zone rate. |
| `out_zone_percent` | numeric | Out zone rate. |
| `edge_percent` | numeric | Edge rate. |
| `z_swing_percent` | numeric | Z swing rate. |
| `oz_swing_percent` | numeric | Oz swing rate. |
| `iz_contact_percent` | numeric | Iz contact rate. |
| `oz_contact_percent` | numeric | Oz contact rate. |
| `whiff_percent` | numeric | Whiff rate (swings and misses / swings). |
| `f_strike_percent` | numeric | F strike rate. |
| `f_swing_percent` | numeric | F swing rate. |
| `swing_percent` | numeric | Swing rate. |
| `meatball_swing_percent` | integer | Meatball swing rate. |
| `meatball_percent` | numeric | Meatball rate. |
| `z_swing_miss_percent` | numeric | Z swing miss rate. |
| `oz_swing_miss_percent` | numeric | Oz swing miss rate. |
| `in_zone` | integer | In zone. |
| `out_zone` | integer | Out zone. |
| `edge` | integer | Edge. |
| `popups` | integer | Popups. |
| `flyballs` | integer | Flyballs. |
| `linedrives` | integer | Linedrives. |
| `groundballs` | integer | Groundballs. |
| `airballs` | integer | Airballs. |
| `popups_percent` | numeric | Popups rate. |
| `flyballs_percent` | numeric | Flyballs rate. |
| `linedrives_percent` | numeric | Linedrives rate. |
| `groundballs_percent` | numeric | Groundballs rate. |
| `airballs_percent` | numeric | Airballs rate. |
| `pull_percent` | numeric | Pull rate. |
| `straightaway_percent` | numeric | Straightaway rate. |
| `opposite_percent` | numeric | Opposite rate. |
| `pull_percent_airballs` | numeric | Pull percent airballs. |
| `straightaway_percent_airballs` | numeric | Straightaway percent airballs. |
| `opposite_percent_airballs` | integer | Opposite percent airballs. |
| `pull_percent_groundballs` | numeric | Pull percent groundballs. |
| `straightaway_percent_groundballs` | numeric | Straightaway percent groundballs. |
| `opposite_percent_groundballs` | numeric | Opposite percent groundballs. |
| `pull_percent_popups` | numeric | Pull percent popups. |
| `straightaway_percent_popups` | numeric | Straightaway percent popups. |
| `opposite_percent_popups` | numeric | Opposite percent popups. |
| `pull_percent_flyballs` | numeric | Pull percent flyballs. |
| `straightaway_percent_flyballs` | numeric | Straightaway percent flyballs. |
| `opposite_percent_flyballs` | numeric | Opposite percent flyballs. |
| `pull_percent_linedrives` | integer | Pull percent linedrives. |
| `straightaway_percent_linedrives` | integer | Straightaway percent linedrives. |
| `opposite_percent_linedrives` | integer | Opposite percent linedrives. |
| `poorlyweak_percent` | integer | Poorlyweak rate. |
| `poorlytopped_percent` | numeric | Poorlytopped rate. |
| `poorlyunder_percent` | numeric | Poorlyunder rate. |
| `flareburner_percent` | numeric | Flareburner rate. |
| `solidcontact_percent` | numeric | Solidcontact rate. |
| `hr_flyballs_percent` | numeric | Hr flyballs rate. |
| `in_zone_swing` | integer | In zone swing. |
| `out_zone_swing` | integer | Out zone swing. |
| `in_zone_swing_miss` | integer | In zone swing miss. |
| `out_zone_swing_miss` | integer | Out zone swing miss. |
| `pitch_count_fastball` | integer | Pitch count fastball. |
| `pitch_count_offspeed` | integer | Pitch count offspeed. |
| `pitch_count_breaking` | integer | Pitch count breaking. |
| `pa` | integer | Plate appearances. |
| `ab` | integer | At-bats. |
| `hit` | integer | Hit. |
| `single` | integer | Singles. |
| `double` | integer | Doubles. |
| `triple` | integer | Triples. |
| `home_run` | integer | Home run. |
| `walk` | integer | Walk. |
| `strikeout` | integer | Strikeout. |
| `hbp` | integer | Hbp. |
| `k_percent` | numeric | Strikeout rate. |
| `bb_percent` | numeric | Walk rate. |
| `sz_judge` | numeric | Sz judge. |
| `batted_ball` | integer | Batted ball. |
| `barrel` | integer | Barrel. |
| `barrel_batted_rate` | numeric | Barrels per batted ball. |
| `barrels_per_pa` | numeric | Barrels per pa. |
| `launch_angle_avg` | numeric | Launch angle avg. |
| `exit_velocity_avg` | numeric | Exit velocity avg. |
| `exit_velocity_max` | numeric | Exit velocity max. |
| `hard_hit_percent` | numeric | Hard-hit rate (95+ mph EV). |
| `sweet_spot_percent` | numeric | Sweet-spot rate (8-32 deg launch angle). |
| `ba` | numeric | Batting average. |
| `xba` | numeric | Expected batting average. |
| `bacon` | numeric | Bacon. |
| `xbacon` | numeric | Expected batting average on contact. |
| `babip` | numeric | BABIP. |
| `obp` | numeric | On-base percentage. |
| `slg` | numeric | Slugging percentage. |
| `xobp` | numeric | Expected on-base percentage. |
| `xslg` | numeric | Expected slugging. |
| `iso` | numeric | Isolated power. |
| `xiso` | numeric | Expected isolated power. |
| `woba` | numeric | Weighted on-base average. |
| `xwoba` | numeric | Expected wOBA. |
| `wobacon` | numeric | Wobacon. |
| `xwobacon` | numeric | Xwobacon. |
| `xbadiff` | numeric | Xbadiff. |
| `xslgdiff` | numeric | Xslgdiff. |
| `wobadiff` | numeric | Wobadiff. |
| `player_type` | character | Player type. |
| `era` | character | Era. |
| `xera` | character | Expected ERA. |
| `avg_hyper_speed` | numeric | Avg hyper speed. |
| `avg_best_speed` | numeric | Avg best speed. |
| `distance_hr_avg` | integer | Distance hr avg. |
| `sprint_speed` | numeric | Sprint speed (ft/sec, top 50% of competitive runs). |
| `pop_2b` | character | Pop 2b. |
| `arm_cs_2b` | character | Arm cs 2b. |
| `strike_rate` | character | Called-strike rate. |
| `outs_above_average` | integer | Outs Above Average. |
| `jump_v_avg` | integer | Jump v avg. |
| `max_arm_strength` | character | Max arm strength (mph). |
| `arm_overall` | character | Arm overall. |
| `xhr` | numeric | Xhr. |
| `swing_take_run_value` | integer | Swing take run value. |
| `blocks_above_average` | character | Blocks above average. |
| `cs_above_average` | character | Cs above average. |
| `fastball_velo` | character | Fastball velo. |
| `fastball_spin` | character | Fastball spin. |
| `fastball_extension` | character | Fastball extension. |
| `curveball_spin` | character | Curveball spin. |
| `pitch_run_value_fastball` | numeric | Pitch run value fastball. |
| `pitch_run_value_breaking` | numeric | Pitch run value breaking. |
| `pitch_run_value_offspeed` | numeric | Pitch run value offspeed. |
| `group_fastball_velo` | numeric | Group fastball velo. |
| `group_breaking_velo` | numeric | Group breaking velo. |
| `group_offspeed_velo` | numeric | Group offspeed velo. |
| `pitch_usage_fastball` | numeric | Pitch usage fastball. |
| `pitch_usage_breaking` | numeric | Pitch usage breaking. |
| `pitch_usage_offspeed` | numeric | Pitch usage offspeed. |
| `fielding_run_value` | integer | Fielding run value. |
| `runner_run_value` | integer | Runner run value. |
| `fielding_run_value_arm` | integer | Fielding run value arm. |
| `fielding_run_value_framing` | character | Fielding run value framing. |
| `runner_runs_sb` | integer | Runner runs sb. |
| `runner_runs_xb` | integer | Runner runs xb. |
| `net_bases_runner` | integer | Net bases runner. |
| `net_bases_pitcher` | character | Net bases pitcher. |
| `fast_swing_rate` | character | Fast-swing rate (>=75 mph). |
| `squared_up_contact` | character | Squared up contact. |
| `squared_up_swing` | character | Squared up swing. |
| `blasts_contact` | character | Blasts contact. |
| `blasts_swing` | character | Blasts swing. |
| `swords` | character | Swords. |
| `avg_swing_speed` | character | Avg swing speed. |
| `avg_swing_length` | character | Avg swing length. |
| `attack_angle` | character | Attack angle (deg, bat path at contact). |
| `vertical_swing_path` | character | Vertical swing path. |
| `acceleration` | character | Acceleration. |
| `horizontal_swing_path` | character | Horizontal swing path. |
| `attack_direction` | character | Attack direction (deg, pull/oppo). |
| `ideal_angle_rate` | character | Ideal angle rate. |
| `n_squared_up` | character | Number of squared up. |
| `n_blasts` | character | Number of blasts. |
| `arm_angle` | character | Arm angle. |
| `is_qualified` | integer | Is qualified. |
| `percent_rank_barrel_unrounded` | character | Percent rank barrel unrounded. |
| `percent_rank_barrel_batted_rate_unrounded` | character | Percent rank barrel batted rate unrounded. |
| `percent_rank_exit_velocity_avg_unrounded` | character | Percent rank exit velocity avg unrounded. |
| `percent_rank_exit_velocity_max_unrounded` | numeric | Percent rank exit velocity max unrounded. |
| `percent_rank_launch_angle_avg_unrounded` | character | Percent rank launch angle avg unrounded. |
| `percent_rank_xba_unrounded` | character | Percent rank xba unrounded. |
| `percent_rank_xslg_unrounded` | character | Percent rank xslg unrounded. |
| `percent_rank_xwoba_unrounded` | character | Percent rank xwoba unrounded. |
| `percent_rank_woba_unrounded` | character | Percent rank woba unrounded. |
| `percent_rank_hard_hit_percent_unrounded` | character | Percent rank hard hit percent unrounded. |
| `percent_rank_xwobacon_unrounded` | character | Percent rank xwobacon unrounded. |
| `percent_rank_wobacon_unrounded` | character | Percent rank wobacon unrounded. |
| `percent_rank_k_percent_unrounded` | character | Percent rank k percent unrounded. |
| `percent_rank_bb_percent_unrounded` | character | Percent rank bb percent unrounded. |
| `percent_rank_sz_judge_unrounded` | character | Percent rank sz judge unrounded. |
| `percent_rank_whiff_percent_unrounded` | character | Percent rank whiff percent unrounded. |
| `percent_rank_chase_percent_unrounded` | character | Percent rank chase percent unrounded. |
| `percent_rank_ba_unrounded` | character | Percent rank ba unrounded. |
| `percent_rank_bacon_unrounded` | character | Percent rank bacon unrounded. |
| `percent_rank_xbacon_unrounded` | character | Percent rank xbacon unrounded. |
| `percent_rank_babip_unrounded` | character | Percent rank babip unrounded. |
| `percent_rank_obp_unrounded` | character | Percent rank obp unrounded. |
| `percent_rank_slg_unrounded` | character | Percent rank slg unrounded. |
| `percent_rank_xobp_unrounded` | character | Percent rank xobp unrounded. |
| `percent_rank_iso_unrounded` | character | Percent rank iso unrounded. |
| `percent_rank_xiso_unrounded` | character | Percent rank xiso unrounded. |
| `percent_rank_sweet_spot_percent_unrounded` | character | Percent rank sweet spot percent unrounded. |
| `percent_rank_distance_hr_avg_unrounded` | character | Percent rank distance hr avg unrounded. |
| `percent_rank_groundballs_percent_unrounded` | character | Percent rank groundballs percent unrounded. |
| `percent_rank_airballs_percent_unrounded` | character | Percent rank airballs percent unrounded. |
| `percent_rank_avg_hyper_speed_unrounded` | character | Percent rank avg hyper speed unrounded. |
| `percent_rank_avg_best_speed_unrounded` | character | Percent rank avg best speed unrounded. |
| `percent_rank_pitch_run_value_fastball_unrounded` | character | Percent rank pitch run value fastball unrounded. |
| `percent_rank_pitch_run_value_breaking_unrounded` | character | Percent rank pitch run value breaking unrounded. |
| `percent_rank_pitch_run_value_offspeed_unrounded` | character | Percent rank pitch run value offspeed unrounded. |
| `percent_rank_barrel` | character | Percent rank barrel. |
| `percent_rank_barrel_batted_rate` | character | Percent rank barrel batted rate. |
| `percent_rank_exit_velocity_avg` | character | Percent rank exit velocity avg. |
| `percent_rank_exit_velocity_max` | integer | Percent rank exit velocity max. |
| `percent_rank_launch_angle_avg` | character | Percent rank launch angle avg. |
| `percent_rank_xba` | character | Percent rank xba. |
| `percent_rank_xslg` | character | Percent rank xslg. |
| `percent_rank_xwoba` | character | Percent rank xwoba. |
| `percent_rank_woba` | character | Percent rank woba. |
| `percent_rank_hard_hit_percent` | character | Percent rank hard hit rate. |
| `percent_rank_xwobacon` | character | Percent rank xwobacon. |
| `percent_rank_wobacon` | character | Percent rank wobacon. |
| `percent_rank_k_percent` | character | Percent rank k rate. |
| `percent_rank_bb_percent` | character | Percent rank bb rate. |
| `percent_rank_sz_judge` | character | Percent rank sz judge. |
| `percent_rank_whiff_percent` | character | Percent rank whiff rate. |
| `percent_rank_chase_percent` | character | Percent rank chase rate. |
| `percent_rank_ba` | character | Percent rank ba. |
| `percent_rank_bacon` | character | Percent rank bacon. |
| `percent_rank_xbacon` | character | Percent rank xbacon. |
| `percent_rank_babip` | character | Percent rank babip. |
| `percent_rank_obp` | character | Percent rank obp. |
| `percent_rank_slg` | character | Percent rank slg. |
| `percent_rank_xobp` | character | Percent rank xobp. |
| `percent_rank_iso` | character | Percent rank iso. |
| `percent_rank_xiso` | character | Percent rank xiso. |
| `percent_rank_sweet_spot_percent` | character | Percent rank sweet spot rate. |
| `percent_rank_distance_hr_avg` | character | Percent rank distance hr avg. |
| `percent_rank_groundballs_percent` | character | Percent rank groundballs rate. |
| `percent_rank_airballs_percent` | character | Percent rank airballs rate. |
| `percent_rank_avg_hyper_speed` | character | Percent rank avg hyper speed. |
| `percent_rank_avg_best_speed` | character | Percent rank avg best speed. |
| `percent_rank_pitch_run_value_fastball` | character | Percent rank pitch run value fastball. |
| `percent_rank_pitch_run_value_breaking` | character | Percent rank pitch run value breaking. |
| `percent_rank_pitch_run_value_offspeed` | character | Percent rank pitch run value offspeed. |
| `percent_speed_order` | integer | Percent speed order. |
| `percent_rank_speed_order` | integer | Percent rank speed order. |
| `percent_rank_pop_2b` | character | Percent rank pop 2b. |
| `percent_rank_arm_cs_2b` | character | Percent rank arm cs 2b. |
| `percent_rank_oaa` | character | Percent rank oaa. |
| `percent_rank_framing` | character | Percent rank framing. |
| `percent_rank_jump` | character | Percent rank jump. |
| `percent_rank_fastball_velo` | character | Percent rank fastball velo. |
| `percent_rank_fastball_spin` | character | Percent rank fastball spin. |
| `percent_rank_fastball_extension` | character | Percent rank fastball extension. |
| `percent_rank_cu_spin` | character | Percent rank cu spin. |
| `percent_rank_xera` | character | Percent rank xera. |
| `percent_rank_arm_max` | character | Percent rank arm max. |
| `percent_rank_arm_overall` | character | Percent rank arm overall. |
| `percent_rank_xhr` | character | Percent rank xhr. |
| `percent_rank_swing_take_run_value` | character | Percent rank swing take run value. |
| `percent_rank_blocks_above_average` | character | Percent rank blocks above average. |
| `percent_rank_cs_above_average` | character | Percent rank cs above average. |
| `percent_rank_fielding_run_value` | character | Percent rank fielding run value. |
| `percent_rank_runner_run_value` | character | Percent rank runner run value. |
| `percent_rank_fielding_run_value_arm` | character | Percent rank fielding run value arm. |
| `percent_rank_fielding_run_value_framing` | character | Percent rank fielding run value framing. |
| `percent_rank_swing_speed` | character | Percent rank swing speed. |
| `percent_rank_swing_length` | character | Percent rank swing length. |
| `percent_rank_squared_up_swing` | character | Percent rank squared up swing. |
| `percent_rank_attack_angle` | character | Percent rank attack angle. |
| `percent_rank_vertical_swing_path` | character | Percent rank vertical swing path. |
| `percent_rank_acceleration` | character | Percent rank acceleration. |
| `percent_rank_ideal_angle_rate` | character | Percent rank ideal angle rate. |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/mlb.yaml (vendored from sdv-py) + tools/codegen/endpoints/mlb_statcast.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
