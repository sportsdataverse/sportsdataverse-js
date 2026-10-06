---
title: Deprecated names (v4)
sidebar_label: Deprecated names (v4)
sidebar_position: 2
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

## Breaking changes by version

18 breaking changes are on record (tools/codegen/breaking.yaml); each affected reference page carries them as a callout at its top.

| Version | Surface | Change | Changelog |
|---|---|---|---|
| 4.0.0 | `flat:hockeytech` | **`hockeytech_resolve_season_id` skips one-off events and ranks what is left** — All-star games, showcases, combines, exhibitions and play-ins are dropped for a regular season or playoffs; the rest rank by league code, named game type, two-year span, feed order. | [changelog](/CHANGELOG#hockeytech-season-years-and-season-resolution-sdv-py-parity) |
| 4.0.0 | `flat:hockeytech` | **`most_recent_hockeytech_season` / `hockeytech_season_id` throw on a failed fetch** — Instead of returning 2026 / `[]`. With no seasons in the feed, `hockeytech_season_id` returns `[]` and `most_recent_hockeytech_season` throws `NoDataError`. | [changelog](/CHANGELOG#hockeytech-hardening-error-vocabulary-user-agent-returns-descriptions) |
| 4.0.0 | `flat:hockeytech` | **`most_recent_hockeytech_season` is the newest regular season** — One-off events and a preseason listed before its regular season are no longer the default (ECHL in the 2026 preseason window gives 2026, not 2027). | [changelog](/CHANGELOG#hockeytech-season-years-and-season-resolution-sdv-py-parity) |
| 4.0.0 | `flat:fox` | **`sdv.fox` is vendored from sdv-py's `fox_api`** — The canonical names are `fox_api_*` / `foxApi*`; every pre-v4 `fox_*` name is a deprecated alias. | [changelog](/CHANGELOG#changed) |
| 4.0.0 | `flat:yahoo` | **`sdv.yahoo.*` no longer defaults `league=ncaaf` or sets a locale** — The stats queries send no `lang` / `region` / `tz` and no default `league` — pass `league` explicitly. | [changelog](/CHANGELOG#changed) |
| 4.0.0 | `flat:hockeytech` | **`season_yr` is the season's end year in every name form** — `"2025-2026"` and `"2025/26"` are 2026 (were 2120 / 2025); `"26-27 Regular Season"` is 2027; a preseason named with its start year belongs to the next season. | [changelog](/CHANGELOG#hockeytech-season-years-and-season-resolution-sdv-py-parity) |
| 4.0.0 | `espn`, `flat:*`, `core` | **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. | [changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700) |
| 4.0.0 | `flat:hockeytech` | **A failed HockeyTech fetch is no longer an empty result** — An empty or unparseable body and the in-body error sentinels throw `AssetFetchError`; only the recognised `Feed type access denied.` stays `{}` / `[]`. A missing or unknown `league` throws. | [changelog](/CHANGELOG#hockeytech-hardening-error-vocabulary-user-agent-returns-descriptions) |
| 4.0.0 | `flat:mlb`, `flat:nhl_api_web`, `flat:nhl_edge`, `flat:nhl_stats_rest`, `flat:nhl_records`, `flat:cbs`, `flat:yahoo`, `flat:yahoo_scores`, `flat:fox`, `flat:nfl_api`, `flat:odds_api`, `flat:asa`, `flat:recruiting`, `flat:torvik`, `flat:bart_wbb`, `flat:mlb_statcast` | **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). | [changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700) |
| 4.0.0 | `flat:nba_stats`, `flat:wnba_stats` | **An unset season is the latest season with rows** — Not the previous season. Dated per request for the league, endpoint and `SeasonType` (NBA rolls over in November, G League in January, Summer League in August, WNBA in June); pass `season` for a lockout or pandemic year. | [changelog](/CHANGELOG#statsnbacom--statswnbacom-default-season-the-latest-season-with-data-sdv-py-693) |
| 4.0.0 | `flat:hockeytech` | **Exhibitions get their own `game_type_label`** — `"exhibition"` (was `"regular"`); `hockeytech_resolve_season_id` takes `gameType: "exhibition"`. | [changelog](/CHANGELOG#hockeytech-season-years-and-season-resolution-sdv-py-parity) |
| 4.0.0 | `espn`, `flat:*`, `loaders`, `core` | **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. | [changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere) |
| 4.0.0 | `legacy` | **Legacy `get*` methods throw typed errors** — A failed fetch throws `NoDataError` (404, ESPN's `{ code: 404 }`) or `AssetFetchError` instead of a raw axios error. | [changelog](/CHANGELOG#fixed) |
| 4.0.0 | `espn`, `flat:nhl_api_web`, `flat:nfl_api`, `flat:cbs`, `flat:mlb`, `flat:fox`, `flat:yahoo`, `flat:recruiting` | **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. | [changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias) |
| 4.0.0 | `flat:mlb_statcast`, `flat:torvik`, `flat:bart_wbb`, `flat:hockeytech` | **The Statcast, BartTorvik and HockeyTech getters throw on a failed fetch** — A failed HTTP fetch is no longer `{}` / `""` — it throws like every other wrapper, so a failed fetch cannot be mistaken for an empty table. | [changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth) |
| 4.0.0 | `espn`, `flat:*`, `core` | **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. | [changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true) |
| 4.0.0 | `espn`, `flat:*`, `loaders`, `legacy` | **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. | [changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode) |
| 4.0.0 | `espn`, `flat:*`, `legacy`, `core` | **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. | [changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth) |



# Deprecated names (v4)

v4 renamed the generated wrappers to **sdv-py's names**, so the same endpoint has the same name in Python and JavaScript. The rules are sdv-py's (`tools/codegen/generate.py`):

- ESPN: `athlete` → `player`, `event` → `game` (and their plurals) as whole `_`-separated words; `event_competitor*` → `game_team*`; `event_competition_<x>` → `game_<x>`. Where that name is taken by another sdv-py function, `athlete_stats` becomes `player_stats_v3`. sdv-py's curated CFB renames apply (`season_futures` → `futures`, …).
- Native APIs: sdv-py's name pattern — `nhl_<endpoint>` for the NHL api-web family (`nhl_web_<endpoint>` where sdv-py's name is taken), `nfl_<endpoint>` for NFL.com.
- CBS: sdv-py's 16 short names replace the ones JS had picked.
- 3.0.0 (the last published 3.x) named five native families by their sdv-py file stem: `mlb_api_*`, `cbs_napi_*`, `fox_bifrost_*`, `yahoo_shangrila_*` and `sdv.recruiting.sports247_*`. Each forwards to the same endpoint's v4 name.

Every pre-v4 name below still works: it forwards to the new function and emits one `DeprecationWarning` per name per process. The aliases will be removed in a future major release. **1766** names are deprecated, each in both its snake_case and camelCase form.

## `sdv.bundesliga`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_bundesliga_athlete_awards` / `espnBundesligaAthleteAwards` | `espn_bundesliga_player_awards` / `espnBundesligaPlayerAwards` |
| `espn_bundesliga_athlete_bio` / `espnBundesligaAthleteBio` | `espn_bundesliga_player_bio` / `espnBundesligaPlayerBio` |
| `espn_bundesliga_athlete_career_stats` / `espnBundesligaAthleteCareerStats` | `espn_bundesliga_player_career_stats` / `espnBundesligaPlayerCareerStats` |
| `espn_bundesliga_athlete_contracts` / `espnBundesligaAthleteContracts` | `espn_bundesliga_player_contracts` / `espnBundesligaPlayerContracts` |
| `espn_bundesliga_athlete_core` / `espnBundesligaAthleteCore` | `espn_bundesliga_player_core` / `espnBundesligaPlayerCore` |
| `espn_bundesliga_athlete_eventlog` / `espnBundesligaAthleteEventlog` | `espn_bundesliga_player_eventlog` / `espnBundesligaPlayerEventlog` |
| `espn_bundesliga_athlete_gamelog` / `espnBundesligaAthleteGamelog` | `espn_bundesliga_player_gamelog` / `espnBundesligaPlayerGamelog` |
| `espn_bundesliga_athlete_info` / `espnBundesligaAthleteInfo` | `espn_bundesliga_player_info` / `espnBundesligaPlayerInfo` |
| `espn_bundesliga_athlete_injuries` / `espnBundesligaAthleteInjuries` | `espn_bundesliga_player_injuries` / `espnBundesligaPlayerInjuries` |
| `espn_bundesliga_athlete_news` / `espnBundesligaAthleteNews` | `espn_bundesliga_player_news` / `espnBundesligaPlayerNews` |
| `espn_bundesliga_athlete_notes` / `espnBundesligaAthleteNotes` | `espn_bundesliga_player_notes` / `espnBundesligaPlayerNotes` |
| `espn_bundesliga_athlete_overview` / `espnBundesligaAthleteOverview` | `espn_bundesliga_player_overview` / `espnBundesligaPlayerOverview` |
| `espn_bundesliga_athlete_records` / `espnBundesligaAthleteRecords` | `espn_bundesliga_player_records` / `espnBundesligaPlayerRecords` |
| `espn_bundesliga_athlete_seasons` / `espnBundesligaAthleteSeasons` | `espn_bundesliga_player_seasons` / `espnBundesligaPlayerSeasons` |
| `espn_bundesliga_athlete_splits` / `espnBundesligaAthleteSplits` | `espn_bundesliga_player_splits` / `espnBundesligaPlayerSplits` |
| `espn_bundesliga_athlete_statisticslog` / `espnBundesligaAthleteStatisticslog` | `espn_bundesliga_player_statisticslog` / `espnBundesligaPlayerStatisticslog` |
| `espn_bundesliga_athlete_stats` / `espnBundesligaAthleteStats` | `espn_bundesliga_player_stats` / `espnBundesligaPlayerStats` |
| `espn_bundesliga_athlete_vs_athlete` / `espnBundesligaAthleteVsAthlete` | `espn_bundesliga_player_vs_player` / `espnBundesligaPlayerVsPlayer` |
| `espn_bundesliga_athletes_index` / `espnBundesligaAthletesIndex` | `espn_bundesliga_players_index` / `espnBundesligaPlayersIndex` |
| `espn_bundesliga_event` / `espnBundesligaEvent` | `espn_bundesliga_game` / `espnBundesligaGame` |
| `espn_bundesliga_event_broadcasts` / `espnBundesligaEventBroadcasts` | `espn_bundesliga_game_broadcasts` / `espnBundesligaGameBroadcasts` |
| `espn_bundesliga_event_competition` / `espnBundesligaEventCompetition` | `espn_bundesliga_game_competition` / `espnBundesligaGameCompetition` |
| `espn_bundesliga_event_competitor` / `espnBundesligaEventCompetitor` | `espn_bundesliga_game_team` / `espnBundesligaGameTeam` |
| `espn_bundesliga_event_competitor_leaders` / `espnBundesligaEventCompetitorLeaders` | `espn_bundesliga_game_team_leaders` / `espnBundesligaGameTeamLeaders` |
| `espn_bundesliga_event_competitor_linescores` / `espnBundesligaEventCompetitorLinescores` | `espn_bundesliga_game_team_linescores` / `espnBundesligaGameTeamLinescores` |
| `espn_bundesliga_event_competitor_record` / `espnBundesligaEventCompetitorRecord` | `espn_bundesliga_game_team_record` / `espnBundesligaGameTeamRecord` |
| `espn_bundesliga_event_competitor_roster` / `espnBundesligaEventCompetitorRoster` | `espn_bundesliga_game_team_roster` / `espnBundesligaGameTeamRoster` |
| `espn_bundesliga_event_competitor_statistics` / `espnBundesligaEventCompetitorStatistics` | `espn_bundesliga_game_team_statistics` / `espnBundesligaGameTeamStatistics` |
| `espn_bundesliga_event_competitors` / `espnBundesligaEventCompetitors` | `espn_bundesliga_game_teams` / `espnBundesligaGameTeams` |
| `espn_bundesliga_event_leaders` / `espnBundesligaEventLeaders` | `espn_bundesliga_game_leaders` / `espnBundesligaGameLeaders` |
| `espn_bundesliga_event_odds` / `espnBundesligaEventOdds` | `espn_bundesliga_game_odds` / `espnBundesligaGameOdds` |
| `espn_bundesliga_event_official_detail` / `espnBundesligaEventOfficialDetail` | `espn_bundesliga_game_official_detail` / `espnBundesligaGameOfficialDetail` |
| `espn_bundesliga_event_officials` / `espnBundesligaEventOfficials` | `espn_bundesliga_game_officials` / `espnBundesligaGameOfficials` |
| `espn_bundesliga_event_play` / `espnBundesligaEventPlay` | `espn_bundesliga_game_play` / `espnBundesligaGamePlay` |
| `espn_bundesliga_event_play_personnel` / `espnBundesligaEventPlayPersonnel` | `espn_bundesliga_game_play_personnel` / `espnBundesligaGamePlayPersonnel` |
| `espn_bundesliga_event_plays` / `espnBundesligaEventPlays` | `espn_bundesliga_game_plays` / `espnBundesligaGamePlays` |
| `espn_bundesliga_event_powerindex` / `espnBundesligaEventPowerindex` | `espn_bundesliga_game_powerindex` / `espnBundesligaGamePowerindex` |
| `espn_bundesliga_event_predictor` / `espnBundesligaEventPredictor` | `espn_bundesliga_game_predictor` / `espnBundesligaGamePredictor` |
| `espn_bundesliga_event_probabilities` / `espnBundesligaEventProbabilities` | `espn_bundesliga_game_probabilities` / `espnBundesligaGameProbabilities` |
| `espn_bundesliga_event_propbets` / `espnBundesligaEventPropbets` | `espn_bundesliga_game_propbets` / `espnBundesligaGamePropbets` |
| `espn_bundesliga_event_scoringplays` / `espnBundesligaEventScoringplays` | `espn_bundesliga_game_scoringplays` / `espnBundesligaGameScoringplays` |
| `espn_bundesliga_event_situation` / `espnBundesligaEventSituation` | `espn_bundesliga_game_situation` / `espnBundesligaGameSituation` |
| `espn_bundesliga_event_status` / `espnBundesligaEventStatus` | `espn_bundesliga_game_status` / `espnBundesligaGameStatus` |
| `espn_bundesliga_events` / `espnBundesligaEvents` | `espn_bundesliga_games` / `espnBundesligaGames` |
| `espn_bundesliga_season_athletes` / `espnBundesligaSeasonAthletes` | `espn_bundesliga_season_players` / `espnBundesligaSeasonPlayers` |
| `espn_bundesliga_season_week_events` / `espnBundesligaSeasonWeekEvents` | `espn_bundesliga_season_week_games` / `espnBundesligaSeasonWeekGames` |

## `sdv.cbs`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `cbs_baseball_player_meta` / `cbsBaseballPlayerMeta` | `cbs_player_meta_baseball` / `cbsPlayerMetaBaseball` |
| `cbs_boxscore` / `cbsBoxscore` | `cbs_game_boxscore` / `cbsGameBoxscore` |
| `cbs_client_configuration` / `cbsClientConfiguration` | `cbs_client_config` / `cbsClientConfig` |
| `cbs_depth_charts` / `cbsDepthCharts` | `cbs_player_depth_charts` / `cbsPlayerDepthCharts` |
| `cbs_featured_game` / `cbsFeaturedGame` | `cbs_game_featured` / `cbsGameFeatured` |
| `cbs_game_hq_odds` / `cbsGameHqOdds` | `cbs_game_odds_hq` / `cbsGameOddsHq` |
| `cbs_hockey_player_meta` / `cbsHockeyPlayerMeta` | `cbs_player_hockey_meta` / `cbsPlayerHockeyMeta` |
| `cbs_napi_baseball_player_meta` / `cbsNapiBaseballPlayerMeta` | `cbs_player_meta_baseball` / `cbsPlayerMetaBaseball` |
| `cbs_napi_boxscore` / `cbsNapiBoxscore` | `cbs_game_boxscore` / `cbsGameBoxscore` |
| `cbs_napi_bulk` / `cbsNapiBulk` | `cbs_bulk` / `cbsBulk` |
| `cbs_napi_client_configuration` / `cbsNapiClientConfiguration` | `cbs_client_config` / `cbsClientConfig` |
| `cbs_napi_coach_rankings` / `cbsNapiCoachRankings` | `cbs_coach_rankings` / `cbsCoachRankings` |
| `cbs_napi_coach_team_associations` / `cbsNapiCoachTeamAssociations` | `cbs_coach_team_associations` / `cbsCoachTeamAssociations` |
| `cbs_napi_depth_charts` / `cbsNapiDepthCharts` | `cbs_player_depth_charts` / `cbsPlayerDepthCharts` |
| `cbs_napi_endpoint_registry` / `cbsNapiEndpointRegistry` | `cbs_endpoint_registry` / `cbsEndpointRegistry` |
| `cbs_napi_event` / `cbsNapiEvent` | `cbs_event` / `cbsEvent` |
| `cbs_napi_event_entrants` / `cbsNapiEventEntrants` | `cbs_event_entrants` / `cbsEventEntrants` |
| `cbs_napi_event_leaderboard` / `cbsNapiEventLeaderboard` | `cbs_event_leaderboard` / `cbsEventLeaderboard` |
| `cbs_napi_event_seasons` / `cbsNapiEventSeasons` | `cbs_event_seasons` / `cbsEventSeasons` |
| `cbs_napi_event_venues` / `cbsNapiEventVenues` | `cbs_event_venues` / `cbsEventVenues` |
| `cbs_napi_featured_game` / `cbsNapiFeaturedGame` | `cbs_game_featured` / `cbsGameFeatured` |
| `cbs_napi_game` / `cbsNapiGame` | `cbs_game` / `cbsGame` |
| `cbs_napi_game_betting_splits` / `cbsNapiGameBettingSplits` | `cbs_game_betting_splits` / `cbsGameBettingSplits` |
| `cbs_napi_game_content_preview` / `cbsNapiGameContentPreview` | `cbs_game_content_preview` / `cbsGameContentPreview` |
| `cbs_napi_game_content_recap` / `cbsNapiGameContentRecap` | `cbs_game_content_recap` / `cbsGameContentRecap` |
| `cbs_napi_game_content_story` / `cbsNapiGameContentStory` | `cbs_game_content_story` / `cbsGameContentStory` |
| `cbs_napi_game_hq_odds` / `cbsNapiGameHqOdds` | `cbs_game_odds_hq` / `cbsGameOddsHq` |
| `cbs_napi_game_lineup` / `cbsNapiGameLineup` | `cbs_game_lineup` / `cbsGameLineup` |
| `cbs_napi_game_odds` / `cbsNapiGameOdds` | `cbs_game_odds` / `cbsGameOdds` |
| `cbs_napi_game_outcomes` / `cbsNapiGameOutcomes` | `cbs_game_outcomes` / `cbsGameOutcomes` |
| `cbs_napi_game_props` / `cbsNapiGameProps` | `cbs_game_props` / `cbsGameProps` |
| `cbs_napi_game_rtwp` / `cbsNapiGameRtwp` | `cbs_game_rtwp` / `cbsGameRtwp` |
| `cbs_napi_game_scoring_boxscores` / `cbsNapiGameScoringBoxscores` | `cbs_game_scoring_boxscores` / `cbsGameScoringBoxscores` |
| `cbs_napi_game_scoring_drives` / `cbsNapiGameScoringDrives` | `cbs_game_scoring_drives` / `cbsGameScoringDrives` |
| `cbs_napi_game_scoring_leaders` / `cbsNapiGameScoringLeaders` | `cbs_game_scoring_leaders` / `cbsGameScoringLeaders` |
| `cbs_napi_game_scoring_player_stats` / `cbsNapiGameScoringPlayerStats` | `cbs_game_scoring_player_stats` / `cbsGameScoringPlayerStats` |
| `cbs_napi_game_scoring_plays` / `cbsNapiGameScoringPlays` | `cbs_game_scoring_plays` / `cbsGameScoringPlays` |
| `cbs_napi_game_scoring_rosters` / `cbsNapiGameScoringRosters` | `cbs_game_scoring_rosters` / `cbsGameScoringRosters` |
| `cbs_napi_game_scoring_scoreboard` / `cbsNapiGameScoringScoreboard` | `cbs_game_scoring_scoreboard` / `cbsGameScoringScoreboard` |
| `cbs_napi_game_scoring_scores` / `cbsNapiGameScoringScores` | `cbs_game_scoring_scores` / `cbsGameScoringScores` |
| `cbs_napi_game_scoring_team_stats` / `cbsNapiGameScoringTeamStats` | `cbs_game_scoring_team_stats` / `cbsGameScoringTeamStats` |
| `cbs_napi_game_scoring_winprob` / `cbsNapiGameScoringWinprob` | `cbs_game_scoring_winprob` / `cbsGameScoringWinprob` |
| `cbs_napi_game_scoring_ytd_player_stats` / `cbsNapiGameScoringYtdPlayerStats` | `cbs_game_scoring_ytd_player_stats` / `cbsGameScoringYtdPlayerStats` |
| `cbs_napi_game_scoring_ytd_team_stats` / `cbsNapiGameScoringYtdTeamStats` | `cbs_game_scoring_ytd_team_stats` / `cbsGameScoringYtdTeamStats` |
| `cbs_napi_game_ticket` / `cbsNapiGameTicket` | `cbs_game_ticket` / `cbsGameTicket` |
| `cbs_napi_golf_event_markets` / `cbsNapiGolfEventMarkets` | `cbs_golf_event_markets` / `cbsGolfEventMarkets` |
| `cbs_napi_golf_player_markets` / `cbsNapiGolfPlayerMarkets` | `cbs_golf_player_markets` / `cbsGolfPlayerMarkets` |
| `cbs_napi_golfer_results` / `cbsNapiGolferResults` | `cbs_golfer_results` / `cbsGolferResults` |
| `cbs_napi_hockey_player_meta` / `cbsNapiHockeyPlayerMeta` | `cbs_player_hockey_meta` / `cbsPlayerHockeyMeta` |
| `cbs_napi_league` / `cbsNapiLeague` | `cbs_league` / `cbsLeague` |
| `cbs_napi_league_teams` / `cbsNapiLeagueTeams` | `cbs_league_teams` / `cbsLeagueTeams` |
| `cbs_napi_odds` / `cbsNapiOdds` | `cbs_odds` / `cbsOdds` |
| `cbs_napi_player` / `cbsNapiPlayer` | `cbs_player` / `cbsPlayer` |
| `cbs_napi_player_combine_data` / `cbsNapiPlayerCombineData` | `cbs_player_combine_data` / `cbsPlayerCombineData` |
| `cbs_napi_player_draft_info` / `cbsNapiPlayerDraftInfo` | `cbs_player_draft_info` / `cbsPlayerDraftInfo` |
| `cbs_napi_player_encyclopedia` / `cbsNapiPlayerEncyclopedia` | `cbs_player_encyclopedia` / `cbsPlayerEncyclopedia` |
| `cbs_napi_player_futures` / `cbsNapiPlayerFutures` | `cbs_player_futures` / `cbsPlayerFutures` |
| `cbs_napi_player_game_stats` / `cbsNapiPlayerGameStats` | `cbs_player_game_stats` / `cbsPlayerGameStats` |
| `cbs_napi_player_golf_metadata` / `cbsNapiPlayerGolfMetadata` | `cbs_player_meta_golf` / `cbsPlayerMetaGolf` |
| `cbs_napi_player_injuries` / `cbsNapiPlayerInjuries` | `cbs_player_injuries` / `cbsPlayerInjuries` |
| `cbs_napi_player_outlook` / `cbsNapiPlayerOutlook` | `cbs_player_outlook` / `cbsPlayerOutlook` |
| `cbs_napi_player_rankings` / `cbsNapiPlayerRankings` | `cbs_player_rankings` / `cbsPlayerRankings` |
| `cbs_napi_player_standings` / `cbsNapiPlayerStandings` | `cbs_player_standings` / `cbsPlayerStandings` |
| `cbs_napi_player_stats` / `cbsNapiPlayerStats` | `cbs_player_stats` / `cbsPlayerStats` |
| `cbs_napi_player_team_associations` / `cbsNapiPlayerTeamAssociations` | `cbs_player_team_associations` / `cbsPlayerTeamAssociations` |
| `cbs_napi_player_transactions` / `cbsNapiPlayerTransactions` | `cbs_player_transactions` / `cbsPlayerTransactions` |
| `cbs_napi_position_rankings` / `cbsNapiPositionRankings` | `cbs_player_position_rankings` / `cbsPlayerPositionRankings` |
| `cbs_napi_probable_players` / `cbsNapiProbablePlayers` | `cbs_game_probable_players` / `cbsGameProbablePlayers` |
| `cbs_napi_recruit_rankings` / `cbsNapiRecruitRankings` | `cbs_recruit_rankings` / `cbsRecruitRankings` |
| `cbs_napi_recruit_team_associations` / `cbsNapiRecruitTeamAssociations` | `cbs_player_recruit_associations` / `cbsPlayerRecruitAssociations` |
| `cbs_napi_ruwt_highlights` / `cbsNapiRuwtHighlights` | `cbs_game_ruwt_highlights` / `cbsGameRuwtHighlights` |
| `cbs_napi_season` / `cbsNapiSeason` | `cbs_season` / `cbsSeason` |
| `cbs_napi_season_teams` / `cbsNapiSeasonTeams` | `cbs_season_teams` / `cbsSeasonTeams` |
| `cbs_napi_sport` / `cbsNapiSport` | `cbs_sport` / `cbsSport` |
| `cbs_napi_sport_leagues` / `cbsNapiSportLeagues` | `cbs_sport_leagues` / `cbsSportLeagues` |
| `cbs_napi_sports_line_team_rankings` / `cbsNapiSportsLineTeamRankings` | `cbs_team_rankings_sportsline` / `cbsTeamRankingsSportsline` |
| `cbs_napi_sports_line_team_standings` / `cbsNapiSportsLineTeamStandings` | `cbs_team_standings_sportsline` / `cbsTeamStandingsSportsline` |
| `cbs_napi_sub_divisions` / `cbsNapiSubDivisions` | `cbs_division_subdivisions` / `cbsDivisionSubdivisions` |
| `cbs_napi_team_futures` / `cbsNapiTeamFutures` | `cbs_team_futures` / `cbsTeamFutures` |
| `cbs_napi_team_metadata` / `cbsNapiTeamMetadata` | `cbs_team_metadata` / `cbsTeamMetadata` |
| `cbs_napi_team_players` / `cbsNapiTeamPlayers` | `cbs_team_players` / `cbsTeamPlayers` |
| `cbs_napi_team_polls` / `cbsNapiTeamPolls` | `cbs_team_polls` / `cbsTeamPolls` |
| `cbs_napi_team_rankings` / `cbsNapiTeamRankings` | `cbs_team_rankings` / `cbsTeamRankings` |
| `cbs_napi_team_seasons` / `cbsNapiTeamSeasons` | `cbs_team_seasons` / `cbsTeamSeasons` |
| `cbs_napi_team_standings` / `cbsNapiTeamStandings` | `cbs_team_standings` / `cbsTeamStandings` |
| `cbs_napi_team_stats` / `cbsNapiTeamStats` | `cbs_team_stats` / `cbsTeamStats` |
| `cbs_napi_venue` / `cbsNapiVenue` | `cbs_venue` / `cbsVenue` |
| `cbs_napi_venue_metadata` / `cbsNapiVenueMetadata` | `cbs_venue_metadata` / `cbsVenueMetadata` |
| `cbs_napi_weather` / `cbsNapiWeather` | `cbs_game_weather` / `cbsGameWeather` |
| `cbs_player_golf_metadata` / `cbsPlayerGolfMetadata` | `cbs_player_meta_golf` / `cbsPlayerMetaGolf` |
| `cbs_position_rankings` / `cbsPositionRankings` | `cbs_player_position_rankings` / `cbsPlayerPositionRankings` |
| `cbs_probable_players` / `cbsProbablePlayers` | `cbs_game_probable_players` / `cbsGameProbablePlayers` |
| `cbs_recruit_team_associations` / `cbsRecruitTeamAssociations` | `cbs_player_recruit_associations` / `cbsPlayerRecruitAssociations` |
| `cbs_ruwt_highlights` / `cbsRuwtHighlights` | `cbs_game_ruwt_highlights` / `cbsGameRuwtHighlights` |
| `cbs_sports_line_team_rankings` / `cbsSportsLineTeamRankings` | `cbs_team_rankings_sportsline` / `cbsTeamRankingsSportsline` |
| `cbs_sports_line_team_standings` / `cbsSportsLineTeamStandings` | `cbs_team_standings_sportsline` / `cbsTeamStandingsSportsline` |
| `cbs_sub_divisions` / `cbsSubDivisions` | `cbs_division_subdivisions` / `cbsDivisionSubdivisions` |
| `cbs_weather` / `cbsWeather` | `cbs_game_weather` / `cbsGameWeather` |

## `sdv.cfb`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_cfb_athlete_awards` / `espnCfbAthleteAwards` | `espn_cfb_player_awards` / `espnCfbPlayerAwards` |
| `espn_cfb_athlete_bio` / `espnCfbAthleteBio` | `espn_cfb_player_bio` / `espnCfbPlayerBio` |
| `espn_cfb_athlete_career_stats` / `espnCfbAthleteCareerStats` | `espn_cfb_player_career_stats` / `espnCfbPlayerCareerStats` |
| `espn_cfb_athlete_contracts` / `espnCfbAthleteContracts` | `espn_cfb_player_contracts` / `espnCfbPlayerContracts` |
| `espn_cfb_athlete_core` / `espnCfbAthleteCore` | `espn_cfb_player_core` / `espnCfbPlayerCore` |
| `espn_cfb_athlete_eventlog` / `espnCfbAthleteEventlog` | `espn_cfb_player_eventlog` / `espnCfbPlayerEventlog` |
| `espn_cfb_athlete_gamelog` / `espnCfbAthleteGamelog` | `espn_cfb_player_gamelog` / `espnCfbPlayerGamelog` |
| `espn_cfb_athlete_info` / `espnCfbAthleteInfo` | `espn_cfb_player_info` / `espnCfbPlayerInfo` |
| `espn_cfb_athlete_injuries` / `espnCfbAthleteInjuries` | `espn_cfb_player_injuries` / `espnCfbPlayerInjuries` |
| `espn_cfb_athlete_news` / `espnCfbAthleteNews` | `espn_cfb_player_news` / `espnCfbPlayerNews` |
| `espn_cfb_athlete_notes` / `espnCfbAthleteNotes` | `espn_cfb_player_notes` / `espnCfbPlayerNotes` |
| `espn_cfb_athlete_overview` / `espnCfbAthleteOverview` | `espn_cfb_player_overview` / `espnCfbPlayerOverview` |
| `espn_cfb_athlete_records` / `espnCfbAthleteRecords` | `espn_cfb_player_records` / `espnCfbPlayerRecords` |
| `espn_cfb_athlete_seasons` / `espnCfbAthleteSeasons` | `espn_cfb_player_seasons` / `espnCfbPlayerSeasons` |
| `espn_cfb_athlete_splits` / `espnCfbAthleteSplits` | `espn_cfb_player_splits` / `espnCfbPlayerSplits` |
| `espn_cfb_athlete_statisticslog` / `espnCfbAthleteStatisticslog` | `espn_cfb_player_statisticslog` / `espnCfbPlayerStatisticslog` |
| `espn_cfb_athlete_stats` / `espnCfbAthleteStats` | `espn_cfb_player_stats_v3` / `espnCfbPlayerStatsV3` |
| `espn_cfb_athlete_vs_athlete` / `espnCfbAthleteVsAthlete` | `espn_cfb_player_vs_player` / `espnCfbPlayerVsPlayer` |
| `espn_cfb_athletes_index` / `espnCfbAthletesIndex` | `espn_cfb_players_index` / `espnCfbPlayersIndex` |
| `espn_cfb_event` / `espnCfbEvent` | `espn_cfb_game` / `espnCfbGame` |
| `espn_cfb_event_broadcasts` / `espnCfbEventBroadcasts` | `espn_cfb_game_broadcasts` / `espnCfbGameBroadcasts` |
| `espn_cfb_event_competition` / `espnCfbEventCompetition` | `espn_cfb_game_competition` / `espnCfbGameCompetition` |
| `espn_cfb_event_competitor` / `espnCfbEventCompetitor` | `espn_cfb_game_team` / `espnCfbGameTeam` |
| `espn_cfb_event_competitor_leaders` / `espnCfbEventCompetitorLeaders` | `espn_cfb_game_team_leaders` / `espnCfbGameTeamLeaders` |
| `espn_cfb_event_competitor_linescores` / `espnCfbEventCompetitorLinescores` | `espn_cfb_game_team_linescores` / `espnCfbGameTeamLinescores` |
| `espn_cfb_event_competitor_record` / `espnCfbEventCompetitorRecord` | `espn_cfb_game_team_record` / `espnCfbGameTeamRecord` |
| `espn_cfb_event_competitor_roster` / `espnCfbEventCompetitorRoster` | `espn_cfb_game_team_roster` / `espnCfbGameTeamRoster` |
| `espn_cfb_event_competitor_statistics` / `espnCfbEventCompetitorStatistics` | `espn_cfb_game_team_statistics` / `espnCfbGameTeamStatistics` |
| `espn_cfb_event_competitors` / `espnCfbEventCompetitors` | `espn_cfb_game_teams` / `espnCfbGameTeams` |
| `espn_cfb_event_leaders` / `espnCfbEventLeaders` | `espn_cfb_game_leaders` / `espnCfbGameLeaders` |
| `espn_cfb_event_odds` / `espnCfbEventOdds` | `espn_cfb_game_odds` / `espnCfbGameOdds` |
| `espn_cfb_event_official_detail` / `espnCfbEventOfficialDetail` | `espn_cfb_game_official_detail` / `espnCfbGameOfficialDetail` |
| `espn_cfb_event_officials` / `espnCfbEventOfficials` | `espn_cfb_game_officials` / `espnCfbGameOfficials` |
| `espn_cfb_event_play` / `espnCfbEventPlay` | `espn_cfb_game_play` / `espnCfbGamePlay` |
| `espn_cfb_event_play_personnel` / `espnCfbEventPlayPersonnel` | `espn_cfb_game_play_personnel` / `espnCfbGamePlayPersonnel` |
| `espn_cfb_event_plays` / `espnCfbEventPlays` | `espn_cfb_game_plays` / `espnCfbGamePlays` |
| `espn_cfb_event_powerindex` / `espnCfbEventPowerindex` | `espn_cfb_game_powerindex` / `espnCfbGamePowerindex` |
| `espn_cfb_event_predictor` / `espnCfbEventPredictor` | `espn_cfb_game_predictor` / `espnCfbGamePredictor` |
| `espn_cfb_event_probabilities` / `espnCfbEventProbabilities` | `espn_cfb_game_probabilities` / `espnCfbGameProbabilities` |
| `espn_cfb_event_propbets` / `espnCfbEventPropbets` | `espn_cfb_game_propbets` / `espnCfbGamePropbets` |
| `espn_cfb_event_scoringplays` / `espnCfbEventScoringplays` | `espn_cfb_game_scoringplays` / `espnCfbGameScoringplays` |
| `espn_cfb_event_situation` / `espnCfbEventSituation` | `espn_cfb_game_situation` / `espnCfbGameSituation` |
| `espn_cfb_event_status` / `espnCfbEventStatus` | `espn_cfb_game_status` / `espnCfbGameStatus` |
| `espn_cfb_events` / `espnCfbEvents` | `espn_cfb_games` / `espnCfbGames` |
| `espn_cfb_recruiting_athletes` / `espnCfbRecruitingAthletes` | `espn_cfb_recruiting_players` / `espnCfbRecruitingPlayers` |
| `espn_cfb_season_athletes` / `espnCfbSeasonAthletes` | `espn_cfb_season_players` / `espnCfbSeasonPlayers` |
| `espn_cfb_season_futures` / `espnCfbSeasonFutures` | `espn_cfb_futures` / `espnCfbFutures` |
| `espn_cfb_season_groups` / `espnCfbSeasonGroups` | `espn_cfb_groups` / `espnCfbGroups` |
| `espn_cfb_season_powerindex` / `espnCfbSeasonPowerindex` | `espn_cfb_team_powerindex` / `espnCfbTeamPowerindex` |
| `espn_cfb_season_recruits` / `espnCfbSeasonRecruits` | `espn_cfb_recruits` / `espnCfbRecruits` |
| `espn_cfb_season_week_events` / `espnCfbSeasonWeekEvents` | `espn_cfb_season_week_games` / `espnCfbSeasonWeekGames` |
| `espn_cfb_season_week_rankings` / `espnCfbSeasonWeekRankings` | `espn_cfb_week_rankings` / `espnCfbWeekRankings` |

## `sdv.cfl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_cfl_athlete_awards` / `espnCflAthleteAwards` | `espn_cfl_player_awards` / `espnCflPlayerAwards` |
| `espn_cfl_athlete_bio` / `espnCflAthleteBio` | `espn_cfl_player_bio` / `espnCflPlayerBio` |
| `espn_cfl_athlete_career_stats` / `espnCflAthleteCareerStats` | `espn_cfl_player_career_stats` / `espnCflPlayerCareerStats` |
| `espn_cfl_athlete_contracts` / `espnCflAthleteContracts` | `espn_cfl_player_contracts` / `espnCflPlayerContracts` |
| `espn_cfl_athlete_core` / `espnCflAthleteCore` | `espn_cfl_player_core` / `espnCflPlayerCore` |
| `espn_cfl_athlete_eventlog` / `espnCflAthleteEventlog` | `espn_cfl_player_eventlog` / `espnCflPlayerEventlog` |
| `espn_cfl_athlete_gamelog` / `espnCflAthleteGamelog` | `espn_cfl_player_gamelog` / `espnCflPlayerGamelog` |
| `espn_cfl_athlete_info` / `espnCflAthleteInfo` | `espn_cfl_player_info` / `espnCflPlayerInfo` |
| `espn_cfl_athlete_injuries` / `espnCflAthleteInjuries` | `espn_cfl_player_injuries` / `espnCflPlayerInjuries` |
| `espn_cfl_athlete_news` / `espnCflAthleteNews` | `espn_cfl_player_news` / `espnCflPlayerNews` |
| `espn_cfl_athlete_notes` / `espnCflAthleteNotes` | `espn_cfl_player_notes` / `espnCflPlayerNotes` |
| `espn_cfl_athlete_overview` / `espnCflAthleteOverview` | `espn_cfl_player_overview` / `espnCflPlayerOverview` |
| `espn_cfl_athlete_records` / `espnCflAthleteRecords` | `espn_cfl_player_records` / `espnCflPlayerRecords` |
| `espn_cfl_athlete_seasons` / `espnCflAthleteSeasons` | `espn_cfl_player_seasons` / `espnCflPlayerSeasons` |
| `espn_cfl_athlete_splits` / `espnCflAthleteSplits` | `espn_cfl_player_splits` / `espnCflPlayerSplits` |
| `espn_cfl_athlete_statisticslog` / `espnCflAthleteStatisticslog` | `espn_cfl_player_statisticslog` / `espnCflPlayerStatisticslog` |
| `espn_cfl_athlete_stats` / `espnCflAthleteStats` | `espn_cfl_player_stats` / `espnCflPlayerStats` |
| `espn_cfl_athlete_vs_athlete` / `espnCflAthleteVsAthlete` | `espn_cfl_player_vs_player` / `espnCflPlayerVsPlayer` |
| `espn_cfl_athletes_index` / `espnCflAthletesIndex` | `espn_cfl_players_index` / `espnCflPlayersIndex` |
| `espn_cfl_event` / `espnCflEvent` | `espn_cfl_game` / `espnCflGame` |
| `espn_cfl_event_broadcasts` / `espnCflEventBroadcasts` | `espn_cfl_game_broadcasts` / `espnCflGameBroadcasts` |
| `espn_cfl_event_competition` / `espnCflEventCompetition` | `espn_cfl_game_competition` / `espnCflGameCompetition` |
| `espn_cfl_event_competitor` / `espnCflEventCompetitor` | `espn_cfl_game_team` / `espnCflGameTeam` |
| `espn_cfl_event_competitor_leaders` / `espnCflEventCompetitorLeaders` | `espn_cfl_game_team_leaders` / `espnCflGameTeamLeaders` |
| `espn_cfl_event_competitor_linescores` / `espnCflEventCompetitorLinescores` | `espn_cfl_game_team_linescores` / `espnCflGameTeamLinescores` |
| `espn_cfl_event_competitor_record` / `espnCflEventCompetitorRecord` | `espn_cfl_game_team_record` / `espnCflGameTeamRecord` |
| `espn_cfl_event_competitor_roster` / `espnCflEventCompetitorRoster` | `espn_cfl_game_team_roster` / `espnCflGameTeamRoster` |
| `espn_cfl_event_competitor_statistics` / `espnCflEventCompetitorStatistics` | `espn_cfl_game_team_statistics` / `espnCflGameTeamStatistics` |
| `espn_cfl_event_competitors` / `espnCflEventCompetitors` | `espn_cfl_game_teams` / `espnCflGameTeams` |
| `espn_cfl_event_leaders` / `espnCflEventLeaders` | `espn_cfl_game_leaders` / `espnCflGameLeaders` |
| `espn_cfl_event_odds` / `espnCflEventOdds` | `espn_cfl_game_odds` / `espnCflGameOdds` |
| `espn_cfl_event_official_detail` / `espnCflEventOfficialDetail` | `espn_cfl_game_official_detail` / `espnCflGameOfficialDetail` |
| `espn_cfl_event_officials` / `espnCflEventOfficials` | `espn_cfl_game_officials` / `espnCflGameOfficials` |
| `espn_cfl_event_play` / `espnCflEventPlay` | `espn_cfl_game_play` / `espnCflGamePlay` |
| `espn_cfl_event_play_personnel` / `espnCflEventPlayPersonnel` | `espn_cfl_game_play_personnel` / `espnCflGamePlayPersonnel` |
| `espn_cfl_event_plays` / `espnCflEventPlays` | `espn_cfl_game_plays` / `espnCflGamePlays` |
| `espn_cfl_event_powerindex` / `espnCflEventPowerindex` | `espn_cfl_game_powerindex` / `espnCflGamePowerindex` |
| `espn_cfl_event_predictor` / `espnCflEventPredictor` | `espn_cfl_game_predictor` / `espnCflGamePredictor` |
| `espn_cfl_event_probabilities` / `espnCflEventProbabilities` | `espn_cfl_game_probabilities` / `espnCflGameProbabilities` |
| `espn_cfl_event_propbets` / `espnCflEventPropbets` | `espn_cfl_game_propbets` / `espnCflGamePropbets` |
| `espn_cfl_event_scoringplays` / `espnCflEventScoringplays` | `espn_cfl_game_scoringplays` / `espnCflGameScoringplays` |
| `espn_cfl_event_situation` / `espnCflEventSituation` | `espn_cfl_game_situation` / `espnCflGameSituation` |
| `espn_cfl_event_status` / `espnCflEventStatus` | `espn_cfl_game_status` / `espnCflGameStatus` |
| `espn_cfl_events` / `espnCflEvents` | `espn_cfl_games` / `espnCflGames` |
| `espn_cfl_season_athletes` / `espnCflSeasonAthletes` | `espn_cfl_season_players` / `espnCflSeasonPlayers` |
| `espn_cfl_season_week_events` / `espnCflSeasonWeekEvents` | `espn_cfl_season_week_games` / `espnCflSeasonWeekGames` |

## `sdv.college_baseball`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_college_baseball_athlete_awards` / `espnCollegeBaseballAthleteAwards` | `espn_college_baseball_player_awards` / `espnCollegeBaseballPlayerAwards` |
| `espn_college_baseball_athlete_bio` / `espnCollegeBaseballAthleteBio` | `espn_college_baseball_player_bio` / `espnCollegeBaseballPlayerBio` |
| `espn_college_baseball_athlete_career_stats` / `espnCollegeBaseballAthleteCareerStats` | `espn_college_baseball_player_career_stats` / `espnCollegeBaseballPlayerCareerStats` |
| `espn_college_baseball_athlete_contracts` / `espnCollegeBaseballAthleteContracts` | `espn_college_baseball_player_contracts` / `espnCollegeBaseballPlayerContracts` |
| `espn_college_baseball_athlete_core` / `espnCollegeBaseballAthleteCore` | `espn_college_baseball_player_core` / `espnCollegeBaseballPlayerCore` |
| `espn_college_baseball_athlete_eventlog` / `espnCollegeBaseballAthleteEventlog` | `espn_college_baseball_player_eventlog` / `espnCollegeBaseballPlayerEventlog` |
| `espn_college_baseball_athlete_gamelog` / `espnCollegeBaseballAthleteGamelog` | `espn_college_baseball_player_gamelog` / `espnCollegeBaseballPlayerGamelog` |
| `espn_college_baseball_athlete_info` / `espnCollegeBaseballAthleteInfo` | `espn_college_baseball_player_info` / `espnCollegeBaseballPlayerInfo` |
| `espn_college_baseball_athlete_injuries` / `espnCollegeBaseballAthleteInjuries` | `espn_college_baseball_player_injuries` / `espnCollegeBaseballPlayerInjuries` |
| `espn_college_baseball_athlete_news` / `espnCollegeBaseballAthleteNews` | `espn_college_baseball_player_news` / `espnCollegeBaseballPlayerNews` |
| `espn_college_baseball_athlete_notes` / `espnCollegeBaseballAthleteNotes` | `espn_college_baseball_player_notes` / `espnCollegeBaseballPlayerNotes` |
| `espn_college_baseball_athlete_overview` / `espnCollegeBaseballAthleteOverview` | `espn_college_baseball_player_overview` / `espnCollegeBaseballPlayerOverview` |
| `espn_college_baseball_athlete_records` / `espnCollegeBaseballAthleteRecords` | `espn_college_baseball_player_records` / `espnCollegeBaseballPlayerRecords` |
| `espn_college_baseball_athlete_seasons` / `espnCollegeBaseballAthleteSeasons` | `espn_college_baseball_player_seasons` / `espnCollegeBaseballPlayerSeasons` |
| `espn_college_baseball_athlete_splits` / `espnCollegeBaseballAthleteSplits` | `espn_college_baseball_player_splits` / `espnCollegeBaseballPlayerSplits` |
| `espn_college_baseball_athlete_statisticslog` / `espnCollegeBaseballAthleteStatisticslog` | `espn_college_baseball_player_statisticslog` / `espnCollegeBaseballPlayerStatisticslog` |
| `espn_college_baseball_athlete_stats` / `espnCollegeBaseballAthleteStats` | `espn_college_baseball_player_stats` / `espnCollegeBaseballPlayerStats` |
| `espn_college_baseball_athlete_vs_athlete` / `espnCollegeBaseballAthleteVsAthlete` | `espn_college_baseball_player_vs_player` / `espnCollegeBaseballPlayerVsPlayer` |
| `espn_college_baseball_athletes_index` / `espnCollegeBaseballAthletesIndex` | `espn_college_baseball_players_index` / `espnCollegeBaseballPlayersIndex` |
| `espn_college_baseball_event` / `espnCollegeBaseballEvent` | `espn_college_baseball_game` / `espnCollegeBaseballGame` |
| `espn_college_baseball_event_broadcasts` / `espnCollegeBaseballEventBroadcasts` | `espn_college_baseball_game_broadcasts` / `espnCollegeBaseballGameBroadcasts` |
| `espn_college_baseball_event_competition` / `espnCollegeBaseballEventCompetition` | `espn_college_baseball_game_competition` / `espnCollegeBaseballGameCompetition` |
| `espn_college_baseball_event_competitor` / `espnCollegeBaseballEventCompetitor` | `espn_college_baseball_game_team` / `espnCollegeBaseballGameTeam` |
| `espn_college_baseball_event_competitor_leaders` / `espnCollegeBaseballEventCompetitorLeaders` | `espn_college_baseball_game_team_leaders` / `espnCollegeBaseballGameTeamLeaders` |
| `espn_college_baseball_event_competitor_linescores` / `espnCollegeBaseballEventCompetitorLinescores` | `espn_college_baseball_game_team_linescores` / `espnCollegeBaseballGameTeamLinescores` |
| `espn_college_baseball_event_competitor_record` / `espnCollegeBaseballEventCompetitorRecord` | `espn_college_baseball_game_team_record` / `espnCollegeBaseballGameTeamRecord` |
| `espn_college_baseball_event_competitor_roster` / `espnCollegeBaseballEventCompetitorRoster` | `espn_college_baseball_game_team_roster` / `espnCollegeBaseballGameTeamRoster` |
| `espn_college_baseball_event_competitor_statistics` / `espnCollegeBaseballEventCompetitorStatistics` | `espn_college_baseball_game_team_statistics` / `espnCollegeBaseballGameTeamStatistics` |
| `espn_college_baseball_event_competitors` / `espnCollegeBaseballEventCompetitors` | `espn_college_baseball_game_teams` / `espnCollegeBaseballGameTeams` |
| `espn_college_baseball_event_leaders` / `espnCollegeBaseballEventLeaders` | `espn_college_baseball_game_leaders` / `espnCollegeBaseballGameLeaders` |
| `espn_college_baseball_event_odds` / `espnCollegeBaseballEventOdds` | `espn_college_baseball_game_odds` / `espnCollegeBaseballGameOdds` |
| `espn_college_baseball_event_official_detail` / `espnCollegeBaseballEventOfficialDetail` | `espn_college_baseball_game_official_detail` / `espnCollegeBaseballGameOfficialDetail` |
| `espn_college_baseball_event_officials` / `espnCollegeBaseballEventOfficials` | `espn_college_baseball_game_officials` / `espnCollegeBaseballGameOfficials` |
| `espn_college_baseball_event_play` / `espnCollegeBaseballEventPlay` | `espn_college_baseball_game_play` / `espnCollegeBaseballGamePlay` |
| `espn_college_baseball_event_play_personnel` / `espnCollegeBaseballEventPlayPersonnel` | `espn_college_baseball_game_play_personnel` / `espnCollegeBaseballGamePlayPersonnel` |
| `espn_college_baseball_event_plays` / `espnCollegeBaseballEventPlays` | `espn_college_baseball_game_plays` / `espnCollegeBaseballGamePlays` |
| `espn_college_baseball_event_powerindex` / `espnCollegeBaseballEventPowerindex` | `espn_college_baseball_game_powerindex` / `espnCollegeBaseballGamePowerindex` |
| `espn_college_baseball_event_predictor` / `espnCollegeBaseballEventPredictor` | `espn_college_baseball_game_predictor` / `espnCollegeBaseballGamePredictor` |
| `espn_college_baseball_event_probabilities` / `espnCollegeBaseballEventProbabilities` | `espn_college_baseball_game_probabilities` / `espnCollegeBaseballGameProbabilities` |
| `espn_college_baseball_event_propbets` / `espnCollegeBaseballEventPropbets` | `espn_college_baseball_game_propbets` / `espnCollegeBaseballGamePropbets` |
| `espn_college_baseball_event_scoringplays` / `espnCollegeBaseballEventScoringplays` | `espn_college_baseball_game_scoringplays` / `espnCollegeBaseballGameScoringplays` |
| `espn_college_baseball_event_situation` / `espnCollegeBaseballEventSituation` | `espn_college_baseball_game_situation` / `espnCollegeBaseballGameSituation` |
| `espn_college_baseball_event_status` / `espnCollegeBaseballEventStatus` | `espn_college_baseball_game_status` / `espnCollegeBaseballGameStatus` |
| `espn_college_baseball_events` / `espnCollegeBaseballEvents` | `espn_college_baseball_games` / `espnCollegeBaseballGames` |
| `espn_college_baseball_recruiting_athletes` / `espnCollegeBaseballRecruitingAthletes` | `espn_college_baseball_recruiting_players` / `espnCollegeBaseballRecruitingPlayers` |
| `espn_college_baseball_season_athletes` / `espnCollegeBaseballSeasonAthletes` | `espn_college_baseball_season_players` / `espnCollegeBaseballSeasonPlayers` |
| `espn_college_baseball_season_week_events` / `espnCollegeBaseballSeasonWeekEvents` | `espn_college_baseball_season_week_games` / `espnCollegeBaseballSeasonWeekGames` |

## `sdv.college_softball`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_college_softball_athlete_awards` / `espnCollegeSoftballAthleteAwards` | `espn_college_softball_player_awards` / `espnCollegeSoftballPlayerAwards` |
| `espn_college_softball_athlete_bio` / `espnCollegeSoftballAthleteBio` | `espn_college_softball_player_bio` / `espnCollegeSoftballPlayerBio` |
| `espn_college_softball_athlete_career_stats` / `espnCollegeSoftballAthleteCareerStats` | `espn_college_softball_player_career_stats` / `espnCollegeSoftballPlayerCareerStats` |
| `espn_college_softball_athlete_contracts` / `espnCollegeSoftballAthleteContracts` | `espn_college_softball_player_contracts` / `espnCollegeSoftballPlayerContracts` |
| `espn_college_softball_athlete_core` / `espnCollegeSoftballAthleteCore` | `espn_college_softball_player_core` / `espnCollegeSoftballPlayerCore` |
| `espn_college_softball_athlete_eventlog` / `espnCollegeSoftballAthleteEventlog` | `espn_college_softball_player_eventlog` / `espnCollegeSoftballPlayerEventlog` |
| `espn_college_softball_athlete_gamelog` / `espnCollegeSoftballAthleteGamelog` | `espn_college_softball_player_gamelog` / `espnCollegeSoftballPlayerGamelog` |
| `espn_college_softball_athlete_info` / `espnCollegeSoftballAthleteInfo` | `espn_college_softball_player_info` / `espnCollegeSoftballPlayerInfo` |
| `espn_college_softball_athlete_injuries` / `espnCollegeSoftballAthleteInjuries` | `espn_college_softball_player_injuries` / `espnCollegeSoftballPlayerInjuries` |
| `espn_college_softball_athlete_news` / `espnCollegeSoftballAthleteNews` | `espn_college_softball_player_news` / `espnCollegeSoftballPlayerNews` |
| `espn_college_softball_athlete_notes` / `espnCollegeSoftballAthleteNotes` | `espn_college_softball_player_notes` / `espnCollegeSoftballPlayerNotes` |
| `espn_college_softball_athlete_overview` / `espnCollegeSoftballAthleteOverview` | `espn_college_softball_player_overview` / `espnCollegeSoftballPlayerOverview` |
| `espn_college_softball_athlete_records` / `espnCollegeSoftballAthleteRecords` | `espn_college_softball_player_records` / `espnCollegeSoftballPlayerRecords` |
| `espn_college_softball_athlete_seasons` / `espnCollegeSoftballAthleteSeasons` | `espn_college_softball_player_seasons` / `espnCollegeSoftballPlayerSeasons` |
| `espn_college_softball_athlete_splits` / `espnCollegeSoftballAthleteSplits` | `espn_college_softball_player_splits` / `espnCollegeSoftballPlayerSplits` |
| `espn_college_softball_athlete_statisticslog` / `espnCollegeSoftballAthleteStatisticslog` | `espn_college_softball_player_statisticslog` / `espnCollegeSoftballPlayerStatisticslog` |
| `espn_college_softball_athlete_stats` / `espnCollegeSoftballAthleteStats` | `espn_college_softball_player_stats` / `espnCollegeSoftballPlayerStats` |
| `espn_college_softball_athlete_vs_athlete` / `espnCollegeSoftballAthleteVsAthlete` | `espn_college_softball_player_vs_player` / `espnCollegeSoftballPlayerVsPlayer` |
| `espn_college_softball_athletes_index` / `espnCollegeSoftballAthletesIndex` | `espn_college_softball_players_index` / `espnCollegeSoftballPlayersIndex` |
| `espn_college_softball_event` / `espnCollegeSoftballEvent` | `espn_college_softball_game` / `espnCollegeSoftballGame` |
| `espn_college_softball_event_broadcasts` / `espnCollegeSoftballEventBroadcasts` | `espn_college_softball_game_broadcasts` / `espnCollegeSoftballGameBroadcasts` |
| `espn_college_softball_event_competition` / `espnCollegeSoftballEventCompetition` | `espn_college_softball_game_competition` / `espnCollegeSoftballGameCompetition` |
| `espn_college_softball_event_competitor` / `espnCollegeSoftballEventCompetitor` | `espn_college_softball_game_team` / `espnCollegeSoftballGameTeam` |
| `espn_college_softball_event_competitor_leaders` / `espnCollegeSoftballEventCompetitorLeaders` | `espn_college_softball_game_team_leaders` / `espnCollegeSoftballGameTeamLeaders` |
| `espn_college_softball_event_competitor_linescores` / `espnCollegeSoftballEventCompetitorLinescores` | `espn_college_softball_game_team_linescores` / `espnCollegeSoftballGameTeamLinescores` |
| `espn_college_softball_event_competitor_record` / `espnCollegeSoftballEventCompetitorRecord` | `espn_college_softball_game_team_record` / `espnCollegeSoftballGameTeamRecord` |
| `espn_college_softball_event_competitor_roster` / `espnCollegeSoftballEventCompetitorRoster` | `espn_college_softball_game_team_roster` / `espnCollegeSoftballGameTeamRoster` |
| `espn_college_softball_event_competitor_statistics` / `espnCollegeSoftballEventCompetitorStatistics` | `espn_college_softball_game_team_statistics` / `espnCollegeSoftballGameTeamStatistics` |
| `espn_college_softball_event_competitors` / `espnCollegeSoftballEventCompetitors` | `espn_college_softball_game_teams` / `espnCollegeSoftballGameTeams` |
| `espn_college_softball_event_leaders` / `espnCollegeSoftballEventLeaders` | `espn_college_softball_game_leaders` / `espnCollegeSoftballGameLeaders` |
| `espn_college_softball_event_odds` / `espnCollegeSoftballEventOdds` | `espn_college_softball_game_odds` / `espnCollegeSoftballGameOdds` |
| `espn_college_softball_event_official_detail` / `espnCollegeSoftballEventOfficialDetail` | `espn_college_softball_game_official_detail` / `espnCollegeSoftballGameOfficialDetail` |
| `espn_college_softball_event_officials` / `espnCollegeSoftballEventOfficials` | `espn_college_softball_game_officials` / `espnCollegeSoftballGameOfficials` |
| `espn_college_softball_event_play` / `espnCollegeSoftballEventPlay` | `espn_college_softball_game_play` / `espnCollegeSoftballGamePlay` |
| `espn_college_softball_event_play_personnel` / `espnCollegeSoftballEventPlayPersonnel` | `espn_college_softball_game_play_personnel` / `espnCollegeSoftballGamePlayPersonnel` |
| `espn_college_softball_event_plays` / `espnCollegeSoftballEventPlays` | `espn_college_softball_game_plays` / `espnCollegeSoftballGamePlays` |
| `espn_college_softball_event_powerindex` / `espnCollegeSoftballEventPowerindex` | `espn_college_softball_game_powerindex` / `espnCollegeSoftballGamePowerindex` |
| `espn_college_softball_event_predictor` / `espnCollegeSoftballEventPredictor` | `espn_college_softball_game_predictor` / `espnCollegeSoftballGamePredictor` |
| `espn_college_softball_event_probabilities` / `espnCollegeSoftballEventProbabilities` | `espn_college_softball_game_probabilities` / `espnCollegeSoftballGameProbabilities` |
| `espn_college_softball_event_propbets` / `espnCollegeSoftballEventPropbets` | `espn_college_softball_game_propbets` / `espnCollegeSoftballGamePropbets` |
| `espn_college_softball_event_scoringplays` / `espnCollegeSoftballEventScoringplays` | `espn_college_softball_game_scoringplays` / `espnCollegeSoftballGameScoringplays` |
| `espn_college_softball_event_situation` / `espnCollegeSoftballEventSituation` | `espn_college_softball_game_situation` / `espnCollegeSoftballGameSituation` |
| `espn_college_softball_event_status` / `espnCollegeSoftballEventStatus` | `espn_college_softball_game_status` / `espnCollegeSoftballGameStatus` |
| `espn_college_softball_events` / `espnCollegeSoftballEvents` | `espn_college_softball_games` / `espnCollegeSoftballGames` |
| `espn_college_softball_recruiting_athletes` / `espnCollegeSoftballRecruitingAthletes` | `espn_college_softball_recruiting_players` / `espnCollegeSoftballRecruitingPlayers` |
| `espn_college_softball_season_athletes` / `espnCollegeSoftballSeasonAthletes` | `espn_college_softball_season_players` / `espnCollegeSoftballSeasonPlayers` |
| `espn_college_softball_season_week_events` / `espnCollegeSoftballSeasonWeekEvents` | `espn_college_softball_season_week_games` / `espnCollegeSoftballSeasonWeekGames` |

## `sdv.cricket`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_cricket_athlete_awards` / `espnCricketAthleteAwards` | `espn_cricket_player_awards` / `espnCricketPlayerAwards` |
| `espn_cricket_athlete_bio` / `espnCricketAthleteBio` | `espn_cricket_player_bio` / `espnCricketPlayerBio` |
| `espn_cricket_athlete_career_stats` / `espnCricketAthleteCareerStats` | `espn_cricket_player_career_stats` / `espnCricketPlayerCareerStats` |
| `espn_cricket_athlete_contracts` / `espnCricketAthleteContracts` | `espn_cricket_player_contracts` / `espnCricketPlayerContracts` |
| `espn_cricket_athlete_core` / `espnCricketAthleteCore` | `espn_cricket_player_core` / `espnCricketPlayerCore` |
| `espn_cricket_athlete_eventlog` / `espnCricketAthleteEventlog` | `espn_cricket_player_eventlog` / `espnCricketPlayerEventlog` |
| `espn_cricket_athlete_gamelog` / `espnCricketAthleteGamelog` | `espn_cricket_player_gamelog` / `espnCricketPlayerGamelog` |
| `espn_cricket_athlete_info` / `espnCricketAthleteInfo` | `espn_cricket_player_info` / `espnCricketPlayerInfo` |
| `espn_cricket_athlete_injuries` / `espnCricketAthleteInjuries` | `espn_cricket_player_injuries` / `espnCricketPlayerInjuries` |
| `espn_cricket_athlete_news` / `espnCricketAthleteNews` | `espn_cricket_player_news` / `espnCricketPlayerNews` |
| `espn_cricket_athlete_notes` / `espnCricketAthleteNotes` | `espn_cricket_player_notes` / `espnCricketPlayerNotes` |
| `espn_cricket_athlete_overview` / `espnCricketAthleteOverview` | `espn_cricket_player_overview` / `espnCricketPlayerOverview` |
| `espn_cricket_athlete_records` / `espnCricketAthleteRecords` | `espn_cricket_player_records` / `espnCricketPlayerRecords` |
| `espn_cricket_athlete_seasons` / `espnCricketAthleteSeasons` | `espn_cricket_player_seasons` / `espnCricketPlayerSeasons` |
| `espn_cricket_athlete_splits` / `espnCricketAthleteSplits` | `espn_cricket_player_splits` / `espnCricketPlayerSplits` |
| `espn_cricket_athlete_statisticslog` / `espnCricketAthleteStatisticslog` | `espn_cricket_player_statisticslog` / `espnCricketPlayerStatisticslog` |
| `espn_cricket_athlete_stats` / `espnCricketAthleteStats` | `espn_cricket_player_stats` / `espnCricketPlayerStats` |
| `espn_cricket_athlete_vs_athlete` / `espnCricketAthleteVsAthlete` | `espn_cricket_player_vs_player` / `espnCricketPlayerVsPlayer` |
| `espn_cricket_athletes_index` / `espnCricketAthletesIndex` | `espn_cricket_players_index` / `espnCricketPlayersIndex` |
| `espn_cricket_event` / `espnCricketEvent` | `espn_cricket_game` / `espnCricketGame` |
| `espn_cricket_event_broadcasts` / `espnCricketEventBroadcasts` | `espn_cricket_game_broadcasts` / `espnCricketGameBroadcasts` |
| `espn_cricket_event_competition` / `espnCricketEventCompetition` | `espn_cricket_game_competition` / `espnCricketGameCompetition` |
| `espn_cricket_event_competitor` / `espnCricketEventCompetitor` | `espn_cricket_game_team` / `espnCricketGameTeam` |
| `espn_cricket_event_competitor_leaders` / `espnCricketEventCompetitorLeaders` | `espn_cricket_game_team_leaders` / `espnCricketGameTeamLeaders` |
| `espn_cricket_event_competitor_linescores` / `espnCricketEventCompetitorLinescores` | `espn_cricket_game_team_linescores` / `espnCricketGameTeamLinescores` |
| `espn_cricket_event_competitor_record` / `espnCricketEventCompetitorRecord` | `espn_cricket_game_team_record` / `espnCricketGameTeamRecord` |
| `espn_cricket_event_competitor_roster` / `espnCricketEventCompetitorRoster` | `espn_cricket_game_team_roster` / `espnCricketGameTeamRoster` |
| `espn_cricket_event_competitor_statistics` / `espnCricketEventCompetitorStatistics` | `espn_cricket_game_team_statistics` / `espnCricketGameTeamStatistics` |
| `espn_cricket_event_competitors` / `espnCricketEventCompetitors` | `espn_cricket_game_teams` / `espnCricketGameTeams` |
| `espn_cricket_event_leaders` / `espnCricketEventLeaders` | `espn_cricket_game_leaders` / `espnCricketGameLeaders` |
| `espn_cricket_event_odds` / `espnCricketEventOdds` | `espn_cricket_game_odds` / `espnCricketGameOdds` |
| `espn_cricket_event_official_detail` / `espnCricketEventOfficialDetail` | `espn_cricket_game_official_detail` / `espnCricketGameOfficialDetail` |
| `espn_cricket_event_officials` / `espnCricketEventOfficials` | `espn_cricket_game_officials` / `espnCricketGameOfficials` |
| `espn_cricket_event_play` / `espnCricketEventPlay` | `espn_cricket_game_play` / `espnCricketGamePlay` |
| `espn_cricket_event_play_personnel` / `espnCricketEventPlayPersonnel` | `espn_cricket_game_play_personnel` / `espnCricketGamePlayPersonnel` |
| `espn_cricket_event_plays` / `espnCricketEventPlays` | `espn_cricket_game_plays` / `espnCricketGamePlays` |
| `espn_cricket_event_powerindex` / `espnCricketEventPowerindex` | `espn_cricket_game_powerindex` / `espnCricketGamePowerindex` |
| `espn_cricket_event_predictor` / `espnCricketEventPredictor` | `espn_cricket_game_predictor` / `espnCricketGamePredictor` |
| `espn_cricket_event_probabilities` / `espnCricketEventProbabilities` | `espn_cricket_game_probabilities` / `espnCricketGameProbabilities` |
| `espn_cricket_event_propbets` / `espnCricketEventPropbets` | `espn_cricket_game_propbets` / `espnCricketGamePropbets` |
| `espn_cricket_event_scoringplays` / `espnCricketEventScoringplays` | `espn_cricket_game_scoringplays` / `espnCricketGameScoringplays` |
| `espn_cricket_event_situation` / `espnCricketEventSituation` | `espn_cricket_game_situation` / `espnCricketGameSituation` |
| `espn_cricket_event_status` / `espnCricketEventStatus` | `espn_cricket_game_status` / `espnCricketGameStatus` |
| `espn_cricket_events` / `espnCricketEvents` | `espn_cricket_games` / `espnCricketGames` |
| `espn_cricket_season_athletes` / `espnCricketSeasonAthletes` | `espn_cricket_season_players` / `espnCricketSeasonPlayers` |
| `espn_cricket_season_week_events` / `espnCricketSeasonWeekEvents` | `espn_cricket_season_week_games` / `espnCricketSeasonWeekGames` |

## `sdv.epl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_epl_athlete_awards` / `espnEplAthleteAwards` | `espn_epl_player_awards` / `espnEplPlayerAwards` |
| `espn_epl_athlete_bio` / `espnEplAthleteBio` | `espn_epl_player_bio` / `espnEplPlayerBio` |
| `espn_epl_athlete_career_stats` / `espnEplAthleteCareerStats` | `espn_epl_player_career_stats` / `espnEplPlayerCareerStats` |
| `espn_epl_athlete_contracts` / `espnEplAthleteContracts` | `espn_epl_player_contracts` / `espnEplPlayerContracts` |
| `espn_epl_athlete_core` / `espnEplAthleteCore` | `espn_epl_player_core` / `espnEplPlayerCore` |
| `espn_epl_athlete_eventlog` / `espnEplAthleteEventlog` | `espn_epl_player_eventlog` / `espnEplPlayerEventlog` |
| `espn_epl_athlete_gamelog` / `espnEplAthleteGamelog` | `espn_epl_player_gamelog` / `espnEplPlayerGamelog` |
| `espn_epl_athlete_info` / `espnEplAthleteInfo` | `espn_epl_player_info` / `espnEplPlayerInfo` |
| `espn_epl_athlete_injuries` / `espnEplAthleteInjuries` | `espn_epl_player_injuries` / `espnEplPlayerInjuries` |
| `espn_epl_athlete_news` / `espnEplAthleteNews` | `espn_epl_player_news` / `espnEplPlayerNews` |
| `espn_epl_athlete_notes` / `espnEplAthleteNotes` | `espn_epl_player_notes` / `espnEplPlayerNotes` |
| `espn_epl_athlete_overview` / `espnEplAthleteOverview` | `espn_epl_player_overview` / `espnEplPlayerOverview` |
| `espn_epl_athlete_records` / `espnEplAthleteRecords` | `espn_epl_player_records` / `espnEplPlayerRecords` |
| `espn_epl_athlete_seasons` / `espnEplAthleteSeasons` | `espn_epl_player_seasons` / `espnEplPlayerSeasons` |
| `espn_epl_athlete_splits` / `espnEplAthleteSplits` | `espn_epl_player_splits` / `espnEplPlayerSplits` |
| `espn_epl_athlete_statisticslog` / `espnEplAthleteStatisticslog` | `espn_epl_player_statisticslog` / `espnEplPlayerStatisticslog` |
| `espn_epl_athlete_stats` / `espnEplAthleteStats` | `espn_epl_player_stats` / `espnEplPlayerStats` |
| `espn_epl_athlete_vs_athlete` / `espnEplAthleteVsAthlete` | `espn_epl_player_vs_player` / `espnEplPlayerVsPlayer` |
| `espn_epl_athletes_index` / `espnEplAthletesIndex` | `espn_epl_players_index` / `espnEplPlayersIndex` |
| `espn_epl_event` / `espnEplEvent` | `espn_epl_game` / `espnEplGame` |
| `espn_epl_event_broadcasts` / `espnEplEventBroadcasts` | `espn_epl_game_broadcasts` / `espnEplGameBroadcasts` |
| `espn_epl_event_competition` / `espnEplEventCompetition` | `espn_epl_game_competition` / `espnEplGameCompetition` |
| `espn_epl_event_competitor` / `espnEplEventCompetitor` | `espn_epl_game_team` / `espnEplGameTeam` |
| `espn_epl_event_competitor_leaders` / `espnEplEventCompetitorLeaders` | `espn_epl_game_team_leaders` / `espnEplGameTeamLeaders` |
| `espn_epl_event_competitor_linescores` / `espnEplEventCompetitorLinescores` | `espn_epl_game_team_linescores` / `espnEplGameTeamLinescores` |
| `espn_epl_event_competitor_record` / `espnEplEventCompetitorRecord` | `espn_epl_game_team_record` / `espnEplGameTeamRecord` |
| `espn_epl_event_competitor_roster` / `espnEplEventCompetitorRoster` | `espn_epl_game_team_roster` / `espnEplGameTeamRoster` |
| `espn_epl_event_competitor_statistics` / `espnEplEventCompetitorStatistics` | `espn_epl_game_team_statistics` / `espnEplGameTeamStatistics` |
| `espn_epl_event_competitors` / `espnEplEventCompetitors` | `espn_epl_game_teams` / `espnEplGameTeams` |
| `espn_epl_event_leaders` / `espnEplEventLeaders` | `espn_epl_game_leaders` / `espnEplGameLeaders` |
| `espn_epl_event_odds` / `espnEplEventOdds` | `espn_epl_game_odds` / `espnEplGameOdds` |
| `espn_epl_event_official_detail` / `espnEplEventOfficialDetail` | `espn_epl_game_official_detail` / `espnEplGameOfficialDetail` |
| `espn_epl_event_officials` / `espnEplEventOfficials` | `espn_epl_game_officials` / `espnEplGameOfficials` |
| `espn_epl_event_play` / `espnEplEventPlay` | `espn_epl_game_play` / `espnEplGamePlay` |
| `espn_epl_event_play_personnel` / `espnEplEventPlayPersonnel` | `espn_epl_game_play_personnel` / `espnEplGamePlayPersonnel` |
| `espn_epl_event_plays` / `espnEplEventPlays` | `espn_epl_game_plays` / `espnEplGamePlays` |
| `espn_epl_event_powerindex` / `espnEplEventPowerindex` | `espn_epl_game_powerindex` / `espnEplGamePowerindex` |
| `espn_epl_event_predictor` / `espnEplEventPredictor` | `espn_epl_game_predictor` / `espnEplGamePredictor` |
| `espn_epl_event_probabilities` / `espnEplEventProbabilities` | `espn_epl_game_probabilities` / `espnEplGameProbabilities` |
| `espn_epl_event_propbets` / `espnEplEventPropbets` | `espn_epl_game_propbets` / `espnEplGamePropbets` |
| `espn_epl_event_scoringplays` / `espnEplEventScoringplays` | `espn_epl_game_scoringplays` / `espnEplGameScoringplays` |
| `espn_epl_event_situation` / `espnEplEventSituation` | `espn_epl_game_situation` / `espnEplGameSituation` |
| `espn_epl_event_status` / `espnEplEventStatus` | `espn_epl_game_status` / `espnEplGameStatus` |
| `espn_epl_events` / `espnEplEvents` | `espn_epl_games` / `espnEplGames` |
| `espn_epl_season_athletes` / `espnEplSeasonAthletes` | `espn_epl_season_players` / `espnEplSeasonPlayers` |
| `espn_epl_season_week_events` / `espnEplSeasonWeekEvents` | `espn_epl_season_week_games` / `espnEplSeasonWeekGames` |

## `sdv.fox`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `fox_bifrost_event_data` / `foxBifrostEventData` | `fox_api_event_data` / `foxApiEventData` |
| `fox_bifrost_event_matchup` / `foxBifrostEventMatchup` | `fox_api_event_matchup` / `foxApiEventMatchup` |
| `fox_bifrost_event_odds` / `foxBifrostEventOdds` | `fox_api_event_odds` / `foxApiEventOdds` |
| `fox_bifrost_event_recap` / `foxBifrostEventRecap` | `fox_api_event_recap` / `foxApiEventRecap` |
| `fox_bifrost_event_standings` / `foxBifrostEventStandings` | `fox_api_event_standings` / `foxApiEventStandings` |
| `fox_bifrost_explore_browse` / `foxBifrostExploreBrowse` | `fox_api_explore_browse` / `foxApiExploreBrowse` |
| `fox_bifrost_explore_favorite` / `foxBifrostExploreFavorite` | `fox_explore_favorite` / `foxExploreFavorite` |
| `fox_bifrost_explore_odds` / `foxBifrostExploreOdds` | `fox_api_explore_odds` / `foxApiExploreOdds` |
| `fox_bifrost_foxpolls` / `foxBifrostFoxpolls` | `fox_api_foxpolls` / `foxApiFoxpolls` |
| `fox_bifrost_fs_feed` / `foxBifrostFsFeed` | `fox_fs_feed` / `foxFsFeed` |
| `fox_bifrost_fs_images` / `foxBifrostFsImages` | `fox_fs_images` / `foxFsImages` |
| `fox_bifrost_fs_layouts` / `foxBifrostFsLayouts` | `fox_fs_layouts` / `foxFsLayouts` |
| `fox_bifrost_fs_videos` / `foxBifrostFsVideos` | `fox_fs_videos` / `foxFsVideos` |
| `fox_bifrost_league_conferences` / `foxBifrostLeagueConferences` | `fox_api_league_conferences` / `foxApiLeagueConferences` |
| `fox_bifrost_league_header` / `foxBifrostLeagueHeader` | `fox_api_league_header` / `foxApiLeagueHeader` |
| `fox_bifrost_league_odds` / `foxBifrostLeagueOdds` | `fox_api_league_odds` / `foxApiLeagueOdds` |
| `fox_bifrost_league_playernews` / `foxBifrostLeaguePlayernews` | `fox_api_league_playernews` / `foxApiLeaguePlayernews` |
| `fox_bifrost_league_polls` / `foxBifrostLeaguePolls` | `fox_api_league_polls` / `foxApiLeaguePolls` |
| `fox_bifrost_league_schedule` / `foxBifrostLeagueSchedule` | `fox_api_league_schedule` / `foxApiLeagueSchedule` |
| `fox_bifrost_league_scores` / `foxBifrostLeagueScores` | `fox_api_league_scores` / `foxApiLeagueScores` |
| `fox_bifrost_league_scores_segment` / `foxBifrostLeagueScoresSegment` | `fox_api_league_scores_segment` / `foxApiLeagueScoresSegment` |
| `fox_bifrost_league_standings` / `foxBifrostLeagueStandings` | `fox_api_league_standings` / `foxApiLeagueStandings` |
| `fox_bifrost_league_stats` / `foxBifrostLeagueStats` | `fox_api_league_stats` / `foxApiLeagueStats` |
| `fox_bifrost_league_stats_con` / `foxBifrostLeagueStatsCon` | `fox_api_league_stats_con` / `foxApiLeagueStatsCon` |
| `fox_bifrost_league_teamnav` / `foxBifrostLeagueTeamnav` | `fox_api_league_teamnav` / `foxApiLeagueTeamnav` |
| `fox_bifrost_scoreboard` / `foxBifrostScoreboard` | `fox_api_scoreboard` / `foxApiScoreboard` |
| `fox_bifrost_scorechip` / `foxBifrostScorechip` | `fox_api_scorechip` / `foxApiScorechip` |
| `fox_bifrost_search_content` / `foxBifrostSearchContent` | `fox_api_search_content` / `foxApiSearchContent` |
| `fox_bifrost_search_entities` / `foxBifrostSearchEntities` | `fox_api_search_entities` / `foxApiSearchEntities` |
| `fox_bifrost_search_popular` / `foxBifrostSearchPopular` | `fox_api_search_popular` / `foxApiSearchPopular` |
| `fox_bifrost_team_gamelog` / `foxBifrostTeamGamelog` | `fox_api_team_gamelog` / `foxApiTeamGamelog` |
| `fox_bifrost_team_header` / `foxBifrostTeamHeader` | `fox_api_team_header` / `foxApiTeamHeader` |
| `fox_bifrost_team_roster` / `foxBifrostTeamRoster` | `fox_api_team_roster` / `foxApiTeamRoster` |
| `fox_bifrost_team_standings` / `foxBifrostTeamStandings` | `fox_api_team_standings` / `foxApiTeamStandings` |
| `fox_bifrost_team_stats` / `foxBifrostTeamStats` | `fox_api_team_stats` / `foxApiTeamStats` |
| `fox_bifrost_topevents_scoreboard_segment` / `foxBifrostTopeventsScoreboardSegment` | `fox_api_topevents_scoreboard_segment` / `foxApiTopeventsScoreboardSegment` |
| `fox_bifrost_trending_articles` / `foxBifrostTrendingArticles` | `fox_api_trending_articles` / `foxApiTrendingArticles` |
| `fox_bifrost_trending_videos` / `foxBifrostTrendingVideos` | `fox_api_trending_videos` / `foxApiTrendingVideos` |
| `fox_event_data` / `foxEventData` | `fox_api_event_data` / `foxApiEventData` |
| `fox_event_matchup` / `foxEventMatchup` | `fox_api_event_matchup` / `foxApiEventMatchup` |
| `fox_event_odds` / `foxEventOdds` | `fox_api_event_odds` / `foxApiEventOdds` |
| `fox_event_recap` / `foxEventRecap` | `fox_api_event_recap` / `foxApiEventRecap` |
| `fox_event_standings` / `foxEventStandings` | `fox_api_event_standings` / `foxApiEventStandings` |
| `fox_explore_browse` / `foxExploreBrowse` | `fox_api_explore_browse` / `foxApiExploreBrowse` |
| `fox_explore_odds` / `foxExploreOdds` | `fox_api_explore_odds` / `foxApiExploreOdds` |
| `fox_foxpolls` / `foxFoxpolls` | `fox_api_foxpolls` / `foxApiFoxpolls` |
| `fox_league_conferences` / `foxLeagueConferences` | `fox_api_league_conferences` / `foxApiLeagueConferences` |
| `fox_league_header` / `foxLeagueHeader` | `fox_api_league_header` / `foxApiLeagueHeader` |
| `fox_league_odds` / `foxLeagueOdds` | `fox_api_league_odds` / `foxApiLeagueOdds` |
| `fox_league_playernews` / `foxLeaguePlayernews` | `fox_api_league_playernews` / `foxApiLeaguePlayernews` |
| `fox_league_polls` / `foxLeaguePolls` | `fox_api_league_polls` / `foxApiLeaguePolls` |
| `fox_league_schedule` / `foxLeagueSchedule` | `fox_api_league_schedule` / `foxApiLeagueSchedule` |
| `fox_league_scores` / `foxLeagueScores` | `fox_api_league_scores` / `foxApiLeagueScores` |
| `fox_league_scores_segment` / `foxLeagueScoresSegment` | `fox_api_league_scores_segment` / `foxApiLeagueScoresSegment` |
| `fox_league_standings` / `foxLeagueStandings` | `fox_api_league_standings` / `foxApiLeagueStandings` |
| `fox_league_stats` / `foxLeagueStats` | `fox_api_league_stats` / `foxApiLeagueStats` |
| `fox_league_stats_con` / `foxLeagueStatsCon` | `fox_api_league_stats_con` / `foxApiLeagueStatsCon` |
| `fox_league_teamnav` / `foxLeagueTeamnav` | `fox_api_league_teamnav` / `foxApiLeagueTeamnav` |
| `fox_scoreboard` / `foxScoreboard` | `fox_api_scoreboard` / `foxApiScoreboard` |
| `fox_scorechip` / `foxScorechip` | `fox_api_scorechip` / `foxApiScorechip` |
| `fox_search_content` / `foxSearchContent` | `fox_api_search_content` / `foxApiSearchContent` |
| `fox_search_entities` / `foxSearchEntities` | `fox_api_search_entities` / `foxApiSearchEntities` |
| `fox_search_popular` / `foxSearchPopular` | `fox_api_search_popular` / `foxApiSearchPopular` |
| `fox_team_gamelog` / `foxTeamGamelog` | `fox_api_team_gamelog` / `foxApiTeamGamelog` |
| `fox_team_header` / `foxTeamHeader` | `fox_api_team_header` / `foxApiTeamHeader` |
| `fox_team_roster` / `foxTeamRoster` | `fox_api_team_roster` / `foxApiTeamRoster` |
| `fox_team_standings` / `foxTeamStandings` | `fox_api_team_standings` / `foxApiTeamStandings` |
| `fox_team_stats` / `foxTeamStats` | `fox_api_team_stats` / `foxApiTeamStats` |
| `fox_topevents_scoreboard_segment` / `foxTopeventsScoreboardSegment` | `fox_api_topevents_scoreboard_segment` / `foxApiTopeventsScoreboardSegment` |
| `fox_trending_articles` / `foxTrendingArticles` | `fox_api_trending_articles` / `foxApiTrendingArticles` |
| `fox_trending_videos` / `foxTrendingVideos` | `fox_api_trending_videos` / `foxApiTrendingVideos` |

## `sdv.laliga`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_laliga_athlete_awards` / `espnLaligaAthleteAwards` | `espn_laliga_player_awards` / `espnLaligaPlayerAwards` |
| `espn_laliga_athlete_bio` / `espnLaligaAthleteBio` | `espn_laliga_player_bio` / `espnLaligaPlayerBio` |
| `espn_laliga_athlete_career_stats` / `espnLaligaAthleteCareerStats` | `espn_laliga_player_career_stats` / `espnLaligaPlayerCareerStats` |
| `espn_laliga_athlete_contracts` / `espnLaligaAthleteContracts` | `espn_laliga_player_contracts` / `espnLaligaPlayerContracts` |
| `espn_laliga_athlete_core` / `espnLaligaAthleteCore` | `espn_laliga_player_core` / `espnLaligaPlayerCore` |
| `espn_laliga_athlete_eventlog` / `espnLaligaAthleteEventlog` | `espn_laliga_player_eventlog` / `espnLaligaPlayerEventlog` |
| `espn_laliga_athlete_gamelog` / `espnLaligaAthleteGamelog` | `espn_laliga_player_gamelog` / `espnLaligaPlayerGamelog` |
| `espn_laliga_athlete_info` / `espnLaligaAthleteInfo` | `espn_laliga_player_info` / `espnLaligaPlayerInfo` |
| `espn_laliga_athlete_injuries` / `espnLaligaAthleteInjuries` | `espn_laliga_player_injuries` / `espnLaligaPlayerInjuries` |
| `espn_laliga_athlete_news` / `espnLaligaAthleteNews` | `espn_laliga_player_news` / `espnLaligaPlayerNews` |
| `espn_laliga_athlete_notes` / `espnLaligaAthleteNotes` | `espn_laliga_player_notes` / `espnLaligaPlayerNotes` |
| `espn_laliga_athlete_overview` / `espnLaligaAthleteOverview` | `espn_laliga_player_overview` / `espnLaligaPlayerOverview` |
| `espn_laliga_athlete_records` / `espnLaligaAthleteRecords` | `espn_laliga_player_records` / `espnLaligaPlayerRecords` |
| `espn_laliga_athlete_seasons` / `espnLaligaAthleteSeasons` | `espn_laliga_player_seasons` / `espnLaligaPlayerSeasons` |
| `espn_laliga_athlete_splits` / `espnLaligaAthleteSplits` | `espn_laliga_player_splits` / `espnLaligaPlayerSplits` |
| `espn_laliga_athlete_statisticslog` / `espnLaligaAthleteStatisticslog` | `espn_laliga_player_statisticslog` / `espnLaligaPlayerStatisticslog` |
| `espn_laliga_athlete_stats` / `espnLaligaAthleteStats` | `espn_laliga_player_stats` / `espnLaligaPlayerStats` |
| `espn_laliga_athlete_vs_athlete` / `espnLaligaAthleteVsAthlete` | `espn_laliga_player_vs_player` / `espnLaligaPlayerVsPlayer` |
| `espn_laliga_athletes_index` / `espnLaligaAthletesIndex` | `espn_laliga_players_index` / `espnLaligaPlayersIndex` |
| `espn_laliga_event` / `espnLaligaEvent` | `espn_laliga_game` / `espnLaligaGame` |
| `espn_laliga_event_broadcasts` / `espnLaligaEventBroadcasts` | `espn_laliga_game_broadcasts` / `espnLaligaGameBroadcasts` |
| `espn_laliga_event_competition` / `espnLaligaEventCompetition` | `espn_laliga_game_competition` / `espnLaligaGameCompetition` |
| `espn_laliga_event_competitor` / `espnLaligaEventCompetitor` | `espn_laliga_game_team` / `espnLaligaGameTeam` |
| `espn_laliga_event_competitor_leaders` / `espnLaligaEventCompetitorLeaders` | `espn_laliga_game_team_leaders` / `espnLaligaGameTeamLeaders` |
| `espn_laliga_event_competitor_linescores` / `espnLaligaEventCompetitorLinescores` | `espn_laliga_game_team_linescores` / `espnLaligaGameTeamLinescores` |
| `espn_laliga_event_competitor_record` / `espnLaligaEventCompetitorRecord` | `espn_laliga_game_team_record` / `espnLaligaGameTeamRecord` |
| `espn_laliga_event_competitor_roster` / `espnLaligaEventCompetitorRoster` | `espn_laliga_game_team_roster` / `espnLaligaGameTeamRoster` |
| `espn_laliga_event_competitor_statistics` / `espnLaligaEventCompetitorStatistics` | `espn_laliga_game_team_statistics` / `espnLaligaGameTeamStatistics` |
| `espn_laliga_event_competitors` / `espnLaligaEventCompetitors` | `espn_laliga_game_teams` / `espnLaligaGameTeams` |
| `espn_laliga_event_leaders` / `espnLaligaEventLeaders` | `espn_laliga_game_leaders` / `espnLaligaGameLeaders` |
| `espn_laliga_event_odds` / `espnLaligaEventOdds` | `espn_laliga_game_odds` / `espnLaligaGameOdds` |
| `espn_laliga_event_official_detail` / `espnLaligaEventOfficialDetail` | `espn_laliga_game_official_detail` / `espnLaligaGameOfficialDetail` |
| `espn_laliga_event_officials` / `espnLaligaEventOfficials` | `espn_laliga_game_officials` / `espnLaligaGameOfficials` |
| `espn_laliga_event_play` / `espnLaligaEventPlay` | `espn_laliga_game_play` / `espnLaligaGamePlay` |
| `espn_laliga_event_play_personnel` / `espnLaligaEventPlayPersonnel` | `espn_laliga_game_play_personnel` / `espnLaligaGamePlayPersonnel` |
| `espn_laliga_event_plays` / `espnLaligaEventPlays` | `espn_laliga_game_plays` / `espnLaligaGamePlays` |
| `espn_laliga_event_powerindex` / `espnLaligaEventPowerindex` | `espn_laliga_game_powerindex` / `espnLaligaGamePowerindex` |
| `espn_laliga_event_predictor` / `espnLaligaEventPredictor` | `espn_laliga_game_predictor` / `espnLaligaGamePredictor` |
| `espn_laliga_event_probabilities` / `espnLaligaEventProbabilities` | `espn_laliga_game_probabilities` / `espnLaligaGameProbabilities` |
| `espn_laliga_event_propbets` / `espnLaligaEventPropbets` | `espn_laliga_game_propbets` / `espnLaligaGamePropbets` |
| `espn_laliga_event_scoringplays` / `espnLaligaEventScoringplays` | `espn_laliga_game_scoringplays` / `espnLaligaGameScoringplays` |
| `espn_laliga_event_situation` / `espnLaligaEventSituation` | `espn_laliga_game_situation` / `espnLaligaGameSituation` |
| `espn_laliga_event_status` / `espnLaligaEventStatus` | `espn_laliga_game_status` / `espnLaligaGameStatus` |
| `espn_laliga_events` / `espnLaligaEvents` | `espn_laliga_games` / `espnLaligaGames` |
| `espn_laliga_season_athletes` / `espnLaligaSeasonAthletes` | `espn_laliga_season_players` / `espnLaligaSeasonPlayers` |
| `espn_laliga_season_week_events` / `espnLaligaSeasonWeekEvents` | `espn_laliga_season_week_games` / `espnLaligaSeasonWeekGames` |

## `sdv.ligamx`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_ligamx_athlete_awards` / `espnLigamxAthleteAwards` | `espn_ligamx_player_awards` / `espnLigamxPlayerAwards` |
| `espn_ligamx_athlete_bio` / `espnLigamxAthleteBio` | `espn_ligamx_player_bio` / `espnLigamxPlayerBio` |
| `espn_ligamx_athlete_career_stats` / `espnLigamxAthleteCareerStats` | `espn_ligamx_player_career_stats` / `espnLigamxPlayerCareerStats` |
| `espn_ligamx_athlete_contracts` / `espnLigamxAthleteContracts` | `espn_ligamx_player_contracts` / `espnLigamxPlayerContracts` |
| `espn_ligamx_athlete_core` / `espnLigamxAthleteCore` | `espn_ligamx_player_core` / `espnLigamxPlayerCore` |
| `espn_ligamx_athlete_eventlog` / `espnLigamxAthleteEventlog` | `espn_ligamx_player_eventlog` / `espnLigamxPlayerEventlog` |
| `espn_ligamx_athlete_gamelog` / `espnLigamxAthleteGamelog` | `espn_ligamx_player_gamelog` / `espnLigamxPlayerGamelog` |
| `espn_ligamx_athlete_info` / `espnLigamxAthleteInfo` | `espn_ligamx_player_info` / `espnLigamxPlayerInfo` |
| `espn_ligamx_athlete_injuries` / `espnLigamxAthleteInjuries` | `espn_ligamx_player_injuries` / `espnLigamxPlayerInjuries` |
| `espn_ligamx_athlete_news` / `espnLigamxAthleteNews` | `espn_ligamx_player_news` / `espnLigamxPlayerNews` |
| `espn_ligamx_athlete_notes` / `espnLigamxAthleteNotes` | `espn_ligamx_player_notes` / `espnLigamxPlayerNotes` |
| `espn_ligamx_athlete_overview` / `espnLigamxAthleteOverview` | `espn_ligamx_player_overview` / `espnLigamxPlayerOverview` |
| `espn_ligamx_athlete_records` / `espnLigamxAthleteRecords` | `espn_ligamx_player_records` / `espnLigamxPlayerRecords` |
| `espn_ligamx_athlete_seasons` / `espnLigamxAthleteSeasons` | `espn_ligamx_player_seasons` / `espnLigamxPlayerSeasons` |
| `espn_ligamx_athlete_splits` / `espnLigamxAthleteSplits` | `espn_ligamx_player_splits` / `espnLigamxPlayerSplits` |
| `espn_ligamx_athlete_statisticslog` / `espnLigamxAthleteStatisticslog` | `espn_ligamx_player_statisticslog` / `espnLigamxPlayerStatisticslog` |
| `espn_ligamx_athlete_stats` / `espnLigamxAthleteStats` | `espn_ligamx_player_stats` / `espnLigamxPlayerStats` |
| `espn_ligamx_athlete_vs_athlete` / `espnLigamxAthleteVsAthlete` | `espn_ligamx_player_vs_player` / `espnLigamxPlayerVsPlayer` |
| `espn_ligamx_athletes_index` / `espnLigamxAthletesIndex` | `espn_ligamx_players_index` / `espnLigamxPlayersIndex` |
| `espn_ligamx_event` / `espnLigamxEvent` | `espn_ligamx_game` / `espnLigamxGame` |
| `espn_ligamx_event_broadcasts` / `espnLigamxEventBroadcasts` | `espn_ligamx_game_broadcasts` / `espnLigamxGameBroadcasts` |
| `espn_ligamx_event_competition` / `espnLigamxEventCompetition` | `espn_ligamx_game_competition` / `espnLigamxGameCompetition` |
| `espn_ligamx_event_competitor` / `espnLigamxEventCompetitor` | `espn_ligamx_game_team` / `espnLigamxGameTeam` |
| `espn_ligamx_event_competitor_leaders` / `espnLigamxEventCompetitorLeaders` | `espn_ligamx_game_team_leaders` / `espnLigamxGameTeamLeaders` |
| `espn_ligamx_event_competitor_linescores` / `espnLigamxEventCompetitorLinescores` | `espn_ligamx_game_team_linescores` / `espnLigamxGameTeamLinescores` |
| `espn_ligamx_event_competitor_record` / `espnLigamxEventCompetitorRecord` | `espn_ligamx_game_team_record` / `espnLigamxGameTeamRecord` |
| `espn_ligamx_event_competitor_roster` / `espnLigamxEventCompetitorRoster` | `espn_ligamx_game_team_roster` / `espnLigamxGameTeamRoster` |
| `espn_ligamx_event_competitor_statistics` / `espnLigamxEventCompetitorStatistics` | `espn_ligamx_game_team_statistics` / `espnLigamxGameTeamStatistics` |
| `espn_ligamx_event_competitors` / `espnLigamxEventCompetitors` | `espn_ligamx_game_teams` / `espnLigamxGameTeams` |
| `espn_ligamx_event_leaders` / `espnLigamxEventLeaders` | `espn_ligamx_game_leaders` / `espnLigamxGameLeaders` |
| `espn_ligamx_event_odds` / `espnLigamxEventOdds` | `espn_ligamx_game_odds` / `espnLigamxGameOdds` |
| `espn_ligamx_event_official_detail` / `espnLigamxEventOfficialDetail` | `espn_ligamx_game_official_detail` / `espnLigamxGameOfficialDetail` |
| `espn_ligamx_event_officials` / `espnLigamxEventOfficials` | `espn_ligamx_game_officials` / `espnLigamxGameOfficials` |
| `espn_ligamx_event_play` / `espnLigamxEventPlay` | `espn_ligamx_game_play` / `espnLigamxGamePlay` |
| `espn_ligamx_event_play_personnel` / `espnLigamxEventPlayPersonnel` | `espn_ligamx_game_play_personnel` / `espnLigamxGamePlayPersonnel` |
| `espn_ligamx_event_plays` / `espnLigamxEventPlays` | `espn_ligamx_game_plays` / `espnLigamxGamePlays` |
| `espn_ligamx_event_powerindex` / `espnLigamxEventPowerindex` | `espn_ligamx_game_powerindex` / `espnLigamxGamePowerindex` |
| `espn_ligamx_event_predictor` / `espnLigamxEventPredictor` | `espn_ligamx_game_predictor` / `espnLigamxGamePredictor` |
| `espn_ligamx_event_probabilities` / `espnLigamxEventProbabilities` | `espn_ligamx_game_probabilities` / `espnLigamxGameProbabilities` |
| `espn_ligamx_event_propbets` / `espnLigamxEventPropbets` | `espn_ligamx_game_propbets` / `espnLigamxGamePropbets` |
| `espn_ligamx_event_scoringplays` / `espnLigamxEventScoringplays` | `espn_ligamx_game_scoringplays` / `espnLigamxGameScoringplays` |
| `espn_ligamx_event_situation` / `espnLigamxEventSituation` | `espn_ligamx_game_situation` / `espnLigamxGameSituation` |
| `espn_ligamx_event_status` / `espnLigamxEventStatus` | `espn_ligamx_game_status` / `espnLigamxGameStatus` |
| `espn_ligamx_events` / `espnLigamxEvents` | `espn_ligamx_games` / `espnLigamxGames` |
| `espn_ligamx_season_athletes` / `espnLigamxSeasonAthletes` | `espn_ligamx_season_players` / `espnLigamxSeasonPlayers` |
| `espn_ligamx_season_week_events` / `espnLigamxSeasonWeekEvents` | `espn_ligamx_season_week_games` / `espnLigamxSeasonWeekGames` |

## `sdv.ligue1`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_ligue1_athlete_awards` / `espnLigue1AthleteAwards` | `espn_ligue1_player_awards` / `espnLigue1PlayerAwards` |
| `espn_ligue1_athlete_bio` / `espnLigue1AthleteBio` | `espn_ligue1_player_bio` / `espnLigue1PlayerBio` |
| `espn_ligue1_athlete_career_stats` / `espnLigue1AthleteCareerStats` | `espn_ligue1_player_career_stats` / `espnLigue1PlayerCareerStats` |
| `espn_ligue1_athlete_contracts` / `espnLigue1AthleteContracts` | `espn_ligue1_player_contracts` / `espnLigue1PlayerContracts` |
| `espn_ligue1_athlete_core` / `espnLigue1AthleteCore` | `espn_ligue1_player_core` / `espnLigue1PlayerCore` |
| `espn_ligue1_athlete_eventlog` / `espnLigue1AthleteEventlog` | `espn_ligue1_player_eventlog` / `espnLigue1PlayerEventlog` |
| `espn_ligue1_athlete_gamelog` / `espnLigue1AthleteGamelog` | `espn_ligue1_player_gamelog` / `espnLigue1PlayerGamelog` |
| `espn_ligue1_athlete_info` / `espnLigue1AthleteInfo` | `espn_ligue1_player_info` / `espnLigue1PlayerInfo` |
| `espn_ligue1_athlete_injuries` / `espnLigue1AthleteInjuries` | `espn_ligue1_player_injuries` / `espnLigue1PlayerInjuries` |
| `espn_ligue1_athlete_news` / `espnLigue1AthleteNews` | `espn_ligue1_player_news` / `espnLigue1PlayerNews` |
| `espn_ligue1_athlete_notes` / `espnLigue1AthleteNotes` | `espn_ligue1_player_notes` / `espnLigue1PlayerNotes` |
| `espn_ligue1_athlete_overview` / `espnLigue1AthleteOverview` | `espn_ligue1_player_overview` / `espnLigue1PlayerOverview` |
| `espn_ligue1_athlete_records` / `espnLigue1AthleteRecords` | `espn_ligue1_player_records` / `espnLigue1PlayerRecords` |
| `espn_ligue1_athlete_seasons` / `espnLigue1AthleteSeasons` | `espn_ligue1_player_seasons` / `espnLigue1PlayerSeasons` |
| `espn_ligue1_athlete_splits` / `espnLigue1AthleteSplits` | `espn_ligue1_player_splits` / `espnLigue1PlayerSplits` |
| `espn_ligue1_athlete_statisticslog` / `espnLigue1AthleteStatisticslog` | `espn_ligue1_player_statisticslog` / `espnLigue1PlayerStatisticslog` |
| `espn_ligue1_athlete_stats` / `espnLigue1AthleteStats` | `espn_ligue1_player_stats` / `espnLigue1PlayerStats` |
| `espn_ligue1_athlete_vs_athlete` / `espnLigue1AthleteVsAthlete` | `espn_ligue1_player_vs_player` / `espnLigue1PlayerVsPlayer` |
| `espn_ligue1_athletes_index` / `espnLigue1AthletesIndex` | `espn_ligue1_players_index` / `espnLigue1PlayersIndex` |
| `espn_ligue1_event` / `espnLigue1Event` | `espn_ligue1_game` / `espnLigue1Game` |
| `espn_ligue1_event_broadcasts` / `espnLigue1EventBroadcasts` | `espn_ligue1_game_broadcasts` / `espnLigue1GameBroadcasts` |
| `espn_ligue1_event_competition` / `espnLigue1EventCompetition` | `espn_ligue1_game_competition` / `espnLigue1GameCompetition` |
| `espn_ligue1_event_competitor` / `espnLigue1EventCompetitor` | `espn_ligue1_game_team` / `espnLigue1GameTeam` |
| `espn_ligue1_event_competitor_leaders` / `espnLigue1EventCompetitorLeaders` | `espn_ligue1_game_team_leaders` / `espnLigue1GameTeamLeaders` |
| `espn_ligue1_event_competitor_linescores` / `espnLigue1EventCompetitorLinescores` | `espn_ligue1_game_team_linescores` / `espnLigue1GameTeamLinescores` |
| `espn_ligue1_event_competitor_record` / `espnLigue1EventCompetitorRecord` | `espn_ligue1_game_team_record` / `espnLigue1GameTeamRecord` |
| `espn_ligue1_event_competitor_roster` / `espnLigue1EventCompetitorRoster` | `espn_ligue1_game_team_roster` / `espnLigue1GameTeamRoster` |
| `espn_ligue1_event_competitor_statistics` / `espnLigue1EventCompetitorStatistics` | `espn_ligue1_game_team_statistics` / `espnLigue1GameTeamStatistics` |
| `espn_ligue1_event_competitors` / `espnLigue1EventCompetitors` | `espn_ligue1_game_teams` / `espnLigue1GameTeams` |
| `espn_ligue1_event_leaders` / `espnLigue1EventLeaders` | `espn_ligue1_game_leaders` / `espnLigue1GameLeaders` |
| `espn_ligue1_event_odds` / `espnLigue1EventOdds` | `espn_ligue1_game_odds` / `espnLigue1GameOdds` |
| `espn_ligue1_event_official_detail` / `espnLigue1EventOfficialDetail` | `espn_ligue1_game_official_detail` / `espnLigue1GameOfficialDetail` |
| `espn_ligue1_event_officials` / `espnLigue1EventOfficials` | `espn_ligue1_game_officials` / `espnLigue1GameOfficials` |
| `espn_ligue1_event_play` / `espnLigue1EventPlay` | `espn_ligue1_game_play` / `espnLigue1GamePlay` |
| `espn_ligue1_event_play_personnel` / `espnLigue1EventPlayPersonnel` | `espn_ligue1_game_play_personnel` / `espnLigue1GamePlayPersonnel` |
| `espn_ligue1_event_plays` / `espnLigue1EventPlays` | `espn_ligue1_game_plays` / `espnLigue1GamePlays` |
| `espn_ligue1_event_powerindex` / `espnLigue1EventPowerindex` | `espn_ligue1_game_powerindex` / `espnLigue1GamePowerindex` |
| `espn_ligue1_event_predictor` / `espnLigue1EventPredictor` | `espn_ligue1_game_predictor` / `espnLigue1GamePredictor` |
| `espn_ligue1_event_probabilities` / `espnLigue1EventProbabilities` | `espn_ligue1_game_probabilities` / `espnLigue1GameProbabilities` |
| `espn_ligue1_event_propbets` / `espnLigue1EventPropbets` | `espn_ligue1_game_propbets` / `espnLigue1GamePropbets` |
| `espn_ligue1_event_scoringplays` / `espnLigue1EventScoringplays` | `espn_ligue1_game_scoringplays` / `espnLigue1GameScoringplays` |
| `espn_ligue1_event_situation` / `espnLigue1EventSituation` | `espn_ligue1_game_situation` / `espnLigue1GameSituation` |
| `espn_ligue1_event_status` / `espnLigue1EventStatus` | `espn_ligue1_game_status` / `espnLigue1GameStatus` |
| `espn_ligue1_events` / `espnLigue1Events` | `espn_ligue1_games` / `espnLigue1Games` |
| `espn_ligue1_season_athletes` / `espnLigue1SeasonAthletes` | `espn_ligue1_season_players` / `espnLigue1SeasonPlayers` |
| `espn_ligue1_season_week_events` / `espnLigue1SeasonWeekEvents` | `espn_ligue1_season_week_games` / `espnLigue1SeasonWeekGames` |

## `sdv.mbb`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_mbb_athlete_awards` / `espnMbbAthleteAwards` | `espn_mbb_player_awards` / `espnMbbPlayerAwards` |
| `espn_mbb_athlete_bio` / `espnMbbAthleteBio` | `espn_mbb_player_bio` / `espnMbbPlayerBio` |
| `espn_mbb_athlete_career_stats` / `espnMbbAthleteCareerStats` | `espn_mbb_player_career_stats` / `espnMbbPlayerCareerStats` |
| `espn_mbb_athlete_contracts` / `espnMbbAthleteContracts` | `espn_mbb_player_contracts` / `espnMbbPlayerContracts` |
| `espn_mbb_athlete_core` / `espnMbbAthleteCore` | `espn_mbb_player_core` / `espnMbbPlayerCore` |
| `espn_mbb_athlete_eventlog` / `espnMbbAthleteEventlog` | `espn_mbb_player_eventlog` / `espnMbbPlayerEventlog` |
| `espn_mbb_athlete_gamelog` / `espnMbbAthleteGamelog` | `espn_mbb_player_gamelog` / `espnMbbPlayerGamelog` |
| `espn_mbb_athlete_info` / `espnMbbAthleteInfo` | `espn_mbb_player_info` / `espnMbbPlayerInfo` |
| `espn_mbb_athlete_injuries` / `espnMbbAthleteInjuries` | `espn_mbb_player_injuries` / `espnMbbPlayerInjuries` |
| `espn_mbb_athlete_news` / `espnMbbAthleteNews` | `espn_mbb_player_news` / `espnMbbPlayerNews` |
| `espn_mbb_athlete_notes` / `espnMbbAthleteNotes` | `espn_mbb_player_notes` / `espnMbbPlayerNotes` |
| `espn_mbb_athlete_overview` / `espnMbbAthleteOverview` | `espn_mbb_player_overview` / `espnMbbPlayerOverview` |
| `espn_mbb_athlete_records` / `espnMbbAthleteRecords` | `espn_mbb_player_records` / `espnMbbPlayerRecords` |
| `espn_mbb_athlete_seasons` / `espnMbbAthleteSeasons` | `espn_mbb_player_seasons` / `espnMbbPlayerSeasons` |
| `espn_mbb_athlete_splits` / `espnMbbAthleteSplits` | `espn_mbb_player_splits` / `espnMbbPlayerSplits` |
| `espn_mbb_athlete_statisticslog` / `espnMbbAthleteStatisticslog` | `espn_mbb_player_statisticslog` / `espnMbbPlayerStatisticslog` |
| `espn_mbb_athlete_stats` / `espnMbbAthleteStats` | `espn_mbb_player_stats_v3` / `espnMbbPlayerStatsV3` |
| `espn_mbb_athlete_vs_athlete` / `espnMbbAthleteVsAthlete` | `espn_mbb_player_vs_player` / `espnMbbPlayerVsPlayer` |
| `espn_mbb_athletes_index` / `espnMbbAthletesIndex` | `espn_mbb_players_index` / `espnMbbPlayersIndex` |
| `espn_mbb_event` / `espnMbbEvent` | `espn_mbb_game` / `espnMbbGame` |
| `espn_mbb_event_broadcasts` / `espnMbbEventBroadcasts` | `espn_mbb_game_broadcasts` / `espnMbbGameBroadcasts` |
| `espn_mbb_event_competition` / `espnMbbEventCompetition` | `espn_mbb_game_competition` / `espnMbbGameCompetition` |
| `espn_mbb_event_competitor` / `espnMbbEventCompetitor` | `espn_mbb_game_team` / `espnMbbGameTeam` |
| `espn_mbb_event_competitor_leaders` / `espnMbbEventCompetitorLeaders` | `espn_mbb_game_team_leaders` / `espnMbbGameTeamLeaders` |
| `espn_mbb_event_competitor_linescores` / `espnMbbEventCompetitorLinescores` | `espn_mbb_game_team_linescores` / `espnMbbGameTeamLinescores` |
| `espn_mbb_event_competitor_record` / `espnMbbEventCompetitorRecord` | `espn_mbb_game_team_record` / `espnMbbGameTeamRecord` |
| `espn_mbb_event_competitor_roster` / `espnMbbEventCompetitorRoster` | `espn_mbb_game_team_roster` / `espnMbbGameTeamRoster` |
| `espn_mbb_event_competitor_statistics` / `espnMbbEventCompetitorStatistics` | `espn_mbb_game_team_statistics` / `espnMbbGameTeamStatistics` |
| `espn_mbb_event_competitors` / `espnMbbEventCompetitors` | `espn_mbb_game_teams` / `espnMbbGameTeams` |
| `espn_mbb_event_leaders` / `espnMbbEventLeaders` | `espn_mbb_game_leaders` / `espnMbbGameLeaders` |
| `espn_mbb_event_odds` / `espnMbbEventOdds` | `espn_mbb_game_odds` / `espnMbbGameOdds` |
| `espn_mbb_event_official_detail` / `espnMbbEventOfficialDetail` | `espn_mbb_game_official_detail` / `espnMbbGameOfficialDetail` |
| `espn_mbb_event_officials` / `espnMbbEventOfficials` | `espn_mbb_game_officials` / `espnMbbGameOfficials` |
| `espn_mbb_event_play` / `espnMbbEventPlay` | `espn_mbb_game_play` / `espnMbbGamePlay` |
| `espn_mbb_event_play_personnel` / `espnMbbEventPlayPersonnel` | `espn_mbb_game_play_personnel` / `espnMbbGamePlayPersonnel` |
| `espn_mbb_event_plays` / `espnMbbEventPlays` | `espn_mbb_game_plays` / `espnMbbGamePlays` |
| `espn_mbb_event_powerindex` / `espnMbbEventPowerindex` | `espn_mbb_game_powerindex` / `espnMbbGamePowerindex` |
| `espn_mbb_event_predictor` / `espnMbbEventPredictor` | `espn_mbb_game_predictor` / `espnMbbGamePredictor` |
| `espn_mbb_event_probabilities` / `espnMbbEventProbabilities` | `espn_mbb_game_probabilities` / `espnMbbGameProbabilities` |
| `espn_mbb_event_propbets` / `espnMbbEventPropbets` | `espn_mbb_game_propbets` / `espnMbbGamePropbets` |
| `espn_mbb_event_scoringplays` / `espnMbbEventScoringplays` | `espn_mbb_game_scoringplays` / `espnMbbGameScoringplays` |
| `espn_mbb_event_situation` / `espnMbbEventSituation` | `espn_mbb_game_situation` / `espnMbbGameSituation` |
| `espn_mbb_event_status` / `espnMbbEventStatus` | `espn_mbb_game_status` / `espnMbbGameStatus` |
| `espn_mbb_events` / `espnMbbEvents` | `espn_mbb_games` / `espnMbbGames` |
| `espn_mbb_recruiting_athletes` / `espnMbbRecruitingAthletes` | `espn_mbb_recruiting_players` / `espnMbbRecruitingPlayers` |
| `espn_mbb_season_athletes` / `espnMbbSeasonAthletes` | `espn_mbb_season_players` / `espnMbbSeasonPlayers` |
| `espn_mbb_season_week_events` / `espnMbbSeasonWeekEvents` | `espn_mbb_season_week_games` / `espnMbbSeasonWeekGames` |

## `sdv.mch`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_mch_athlete_awards` / `espnMchAthleteAwards` | `espn_mch_player_awards` / `espnMchPlayerAwards` |
| `espn_mch_athlete_bio` / `espnMchAthleteBio` | `espn_mch_player_bio` / `espnMchPlayerBio` |
| `espn_mch_athlete_career_stats` / `espnMchAthleteCareerStats` | `espn_mch_player_career_stats` / `espnMchPlayerCareerStats` |
| `espn_mch_athlete_contracts` / `espnMchAthleteContracts` | `espn_mch_player_contracts` / `espnMchPlayerContracts` |
| `espn_mch_athlete_core` / `espnMchAthleteCore` | `espn_mch_player_core` / `espnMchPlayerCore` |
| `espn_mch_athlete_eventlog` / `espnMchAthleteEventlog` | `espn_mch_player_eventlog` / `espnMchPlayerEventlog` |
| `espn_mch_athlete_gamelog` / `espnMchAthleteGamelog` | `espn_mch_player_gamelog` / `espnMchPlayerGamelog` |
| `espn_mch_athlete_info` / `espnMchAthleteInfo` | `espn_mch_player_info` / `espnMchPlayerInfo` |
| `espn_mch_athlete_injuries` / `espnMchAthleteInjuries` | `espn_mch_player_injuries` / `espnMchPlayerInjuries` |
| `espn_mch_athlete_news` / `espnMchAthleteNews` | `espn_mch_player_news` / `espnMchPlayerNews` |
| `espn_mch_athlete_notes` / `espnMchAthleteNotes` | `espn_mch_player_notes` / `espnMchPlayerNotes` |
| `espn_mch_athlete_overview` / `espnMchAthleteOverview` | `espn_mch_player_overview` / `espnMchPlayerOverview` |
| `espn_mch_athlete_records` / `espnMchAthleteRecords` | `espn_mch_player_records` / `espnMchPlayerRecords` |
| `espn_mch_athlete_seasons` / `espnMchAthleteSeasons` | `espn_mch_player_seasons` / `espnMchPlayerSeasons` |
| `espn_mch_athlete_splits` / `espnMchAthleteSplits` | `espn_mch_player_splits` / `espnMchPlayerSplits` |
| `espn_mch_athlete_statisticslog` / `espnMchAthleteStatisticslog` | `espn_mch_player_statisticslog` / `espnMchPlayerStatisticslog` |
| `espn_mch_athlete_stats` / `espnMchAthleteStats` | `espn_mch_player_stats` / `espnMchPlayerStats` |
| `espn_mch_athlete_vs_athlete` / `espnMchAthleteVsAthlete` | `espn_mch_player_vs_player` / `espnMchPlayerVsPlayer` |
| `espn_mch_athletes_index` / `espnMchAthletesIndex` | `espn_mch_players_index` / `espnMchPlayersIndex` |
| `espn_mch_event` / `espnMchEvent` | `espn_mch_game` / `espnMchGame` |
| `espn_mch_event_broadcasts` / `espnMchEventBroadcasts` | `espn_mch_game_broadcasts` / `espnMchGameBroadcasts` |
| `espn_mch_event_competition` / `espnMchEventCompetition` | `espn_mch_game_competition` / `espnMchGameCompetition` |
| `espn_mch_event_competitor` / `espnMchEventCompetitor` | `espn_mch_game_team` / `espnMchGameTeam` |
| `espn_mch_event_competitor_leaders` / `espnMchEventCompetitorLeaders` | `espn_mch_game_team_leaders` / `espnMchGameTeamLeaders` |
| `espn_mch_event_competitor_linescores` / `espnMchEventCompetitorLinescores` | `espn_mch_game_team_linescores` / `espnMchGameTeamLinescores` |
| `espn_mch_event_competitor_record` / `espnMchEventCompetitorRecord` | `espn_mch_game_team_record` / `espnMchGameTeamRecord` |
| `espn_mch_event_competitor_roster` / `espnMchEventCompetitorRoster` | `espn_mch_game_team_roster` / `espnMchGameTeamRoster` |
| `espn_mch_event_competitor_statistics` / `espnMchEventCompetitorStatistics` | `espn_mch_game_team_statistics` / `espnMchGameTeamStatistics` |
| `espn_mch_event_competitors` / `espnMchEventCompetitors` | `espn_mch_game_teams` / `espnMchGameTeams` |
| `espn_mch_event_leaders` / `espnMchEventLeaders` | `espn_mch_game_leaders` / `espnMchGameLeaders` |
| `espn_mch_event_odds` / `espnMchEventOdds` | `espn_mch_game_odds` / `espnMchGameOdds` |
| `espn_mch_event_official_detail` / `espnMchEventOfficialDetail` | `espn_mch_game_official_detail` / `espnMchGameOfficialDetail` |
| `espn_mch_event_officials` / `espnMchEventOfficials` | `espn_mch_game_officials` / `espnMchGameOfficials` |
| `espn_mch_event_play` / `espnMchEventPlay` | `espn_mch_game_play` / `espnMchGamePlay` |
| `espn_mch_event_play_personnel` / `espnMchEventPlayPersonnel` | `espn_mch_game_play_personnel` / `espnMchGamePlayPersonnel` |
| `espn_mch_event_plays` / `espnMchEventPlays` | `espn_mch_game_plays` / `espnMchGamePlays` |
| `espn_mch_event_powerindex` / `espnMchEventPowerindex` | `espn_mch_game_powerindex` / `espnMchGamePowerindex` |
| `espn_mch_event_predictor` / `espnMchEventPredictor` | `espn_mch_game_predictor` / `espnMchGamePredictor` |
| `espn_mch_event_probabilities` / `espnMchEventProbabilities` | `espn_mch_game_probabilities` / `espnMchGameProbabilities` |
| `espn_mch_event_propbets` / `espnMchEventPropbets` | `espn_mch_game_propbets` / `espnMchGamePropbets` |
| `espn_mch_event_scoringplays` / `espnMchEventScoringplays` | `espn_mch_game_scoringplays` / `espnMchGameScoringplays` |
| `espn_mch_event_situation` / `espnMchEventSituation` | `espn_mch_game_situation` / `espnMchGameSituation` |
| `espn_mch_event_status` / `espnMchEventStatus` | `espn_mch_game_status` / `espnMchGameStatus` |
| `espn_mch_events` / `espnMchEvents` | `espn_mch_games` / `espnMchGames` |
| `espn_mch_recruiting_athletes` / `espnMchRecruitingAthletes` | `espn_mch_recruiting_players` / `espnMchRecruitingPlayers` |
| `espn_mch_season_athletes` / `espnMchSeasonAthletes` | `espn_mch_season_players` / `espnMchSeasonPlayers` |
| `espn_mch_season_week_events` / `espnMchSeasonWeekEvents` | `espn_mch_season_week_games` / `espnMchSeasonWeekGames` |

## `sdv.mlb`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_mlb_athlete_awards` / `espnMlbAthleteAwards` | `espn_mlb_player_awards` / `espnMlbPlayerAwards` |
| `espn_mlb_athlete_bio` / `espnMlbAthleteBio` | `espn_mlb_player_bio` / `espnMlbPlayerBio` |
| `espn_mlb_athlete_career_stats` / `espnMlbAthleteCareerStats` | `espn_mlb_player_career_stats` / `espnMlbPlayerCareerStats` |
| `espn_mlb_athlete_contracts` / `espnMlbAthleteContracts` | `espn_mlb_player_contracts` / `espnMlbPlayerContracts` |
| `espn_mlb_athlete_core` / `espnMlbAthleteCore` | `espn_mlb_player_core` / `espnMlbPlayerCore` |
| `espn_mlb_athlete_eventlog` / `espnMlbAthleteEventlog` | `espn_mlb_player_eventlog` / `espnMlbPlayerEventlog` |
| `espn_mlb_athlete_gamelog` / `espnMlbAthleteGamelog` | `espn_mlb_player_gamelog` / `espnMlbPlayerGamelog` |
| `espn_mlb_athlete_hotzones` / `espnMlbAthleteHotzones` | `espn_mlb_player_hotzones` / `espnMlbPlayerHotzones` |
| `espn_mlb_athlete_info` / `espnMlbAthleteInfo` | `espn_mlb_player_info` / `espnMlbPlayerInfo` |
| `espn_mlb_athlete_injuries` / `espnMlbAthleteInjuries` | `espn_mlb_player_injuries` / `espnMlbPlayerInjuries` |
| `espn_mlb_athlete_news` / `espnMlbAthleteNews` | `espn_mlb_player_news` / `espnMlbPlayerNews` |
| `espn_mlb_athlete_notes` / `espnMlbAthleteNotes` | `espn_mlb_player_notes` / `espnMlbPlayerNotes` |
| `espn_mlb_athlete_overview` / `espnMlbAthleteOverview` | `espn_mlb_player_overview` / `espnMlbPlayerOverview` |
| `espn_mlb_athlete_records` / `espnMlbAthleteRecords` | `espn_mlb_player_records` / `espnMlbPlayerRecords` |
| `espn_mlb_athlete_seasons` / `espnMlbAthleteSeasons` | `espn_mlb_player_seasons` / `espnMlbPlayerSeasons` |
| `espn_mlb_athlete_splits` / `espnMlbAthleteSplits` | `espn_mlb_player_splits` / `espnMlbPlayerSplits` |
| `espn_mlb_athlete_statisticslog` / `espnMlbAthleteStatisticslog` | `espn_mlb_player_statisticslog` / `espnMlbPlayerStatisticslog` |
| `espn_mlb_athlete_stats` / `espnMlbAthleteStats` | `espn_mlb_player_stats_v3` / `espnMlbPlayerStatsV3` |
| `espn_mlb_athlete_vs_athlete` / `espnMlbAthleteVsAthlete` | `espn_mlb_player_vs_player` / `espnMlbPlayerVsPlayer` |
| `espn_mlb_athletes_index` / `espnMlbAthletesIndex` | `espn_mlb_players_index` / `espnMlbPlayersIndex` |
| `espn_mlb_event` / `espnMlbEvent` | `espn_mlb_game` / `espnMlbGame` |
| `espn_mlb_event_broadcasts` / `espnMlbEventBroadcasts` | `espn_mlb_game_broadcasts` / `espnMlbGameBroadcasts` |
| `espn_mlb_event_competition` / `espnMlbEventCompetition` | `espn_mlb_game_competition` / `espnMlbGameCompetition` |
| `espn_mlb_event_competitor` / `espnMlbEventCompetitor` | `espn_mlb_game_team` / `espnMlbGameTeam` |
| `espn_mlb_event_competitor_leaders` / `espnMlbEventCompetitorLeaders` | `espn_mlb_game_team_leaders` / `espnMlbGameTeamLeaders` |
| `espn_mlb_event_competitor_linescores` / `espnMlbEventCompetitorLinescores` | `espn_mlb_game_team_linescores` / `espnMlbGameTeamLinescores` |
| `espn_mlb_event_competitor_record` / `espnMlbEventCompetitorRecord` | `espn_mlb_game_team_record` / `espnMlbGameTeamRecord` |
| `espn_mlb_event_competitor_roster` / `espnMlbEventCompetitorRoster` | `espn_mlb_game_team_roster` / `espnMlbGameTeamRoster` |
| `espn_mlb_event_competitor_statistics` / `espnMlbEventCompetitorStatistics` | `espn_mlb_game_team_statistics` / `espnMlbGameTeamStatistics` |
| `espn_mlb_event_competitors` / `espnMlbEventCompetitors` | `espn_mlb_game_teams` / `espnMlbGameTeams` |
| `espn_mlb_event_leaders` / `espnMlbEventLeaders` | `espn_mlb_game_leaders` / `espnMlbGameLeaders` |
| `espn_mlb_event_odds` / `espnMlbEventOdds` | `espn_mlb_game_odds` / `espnMlbGameOdds` |
| `espn_mlb_event_official_detail` / `espnMlbEventOfficialDetail` | `espn_mlb_game_official_detail` / `espnMlbGameOfficialDetail` |
| `espn_mlb_event_officials` / `espnMlbEventOfficials` | `espn_mlb_game_officials` / `espnMlbGameOfficials` |
| `espn_mlb_event_play` / `espnMlbEventPlay` | `espn_mlb_game_play` / `espnMlbGamePlay` |
| `espn_mlb_event_play_personnel` / `espnMlbEventPlayPersonnel` | `espn_mlb_game_play_personnel` / `espnMlbGamePlayPersonnel` |
| `espn_mlb_event_plays` / `espnMlbEventPlays` | `espn_mlb_game_plays` / `espnMlbGamePlays` |
| `espn_mlb_event_powerindex` / `espnMlbEventPowerindex` | `espn_mlb_game_powerindex` / `espnMlbGamePowerindex` |
| `espn_mlb_event_predictor` / `espnMlbEventPredictor` | `espn_mlb_game_predictor` / `espnMlbGamePredictor` |
| `espn_mlb_event_probabilities` / `espnMlbEventProbabilities` | `espn_mlb_game_probabilities` / `espnMlbGameProbabilities` |
| `espn_mlb_event_propbets` / `espnMlbEventPropbets` | `espn_mlb_game_propbets` / `espnMlbGamePropbets` |
| `espn_mlb_event_scoringplays` / `espnMlbEventScoringplays` | `espn_mlb_game_scoringplays` / `espnMlbGameScoringplays` |
| `espn_mlb_event_situation` / `espnMlbEventSituation` | `espn_mlb_game_situation` / `espnMlbGameSituation` |
| `espn_mlb_event_status` / `espnMlbEventStatus` | `espn_mlb_game_status` / `espnMlbGameStatus` |
| `espn_mlb_events` / `espnMlbEvents` | `espn_mlb_games` / `espnMlbGames` |
| `espn_mlb_season_athletes` / `espnMlbSeasonAthletes` | `espn_mlb_season_players` / `espnMlbSeasonPlayers` |
| `espn_mlb_season_week_events` / `espnMlbSeasonWeekEvents` | `espn_mlb_season_week_games` / `espnMlbSeasonWeekGames` |
| `mlb_api_all_star_ballot` / `mlbApiAllStarBallot` | `mlb_all_star_ballot` / `mlbAllStarBallot` |
| `mlb_api_all_star_final_vote` / `mlbApiAllStarFinalVote` | `mlb_all_star_final_vote` / `mlbAllStarFinalVote` |
| `mlb_api_all_star_write_ins` / `mlbApiAllStarWriteIns` | `mlb_all_star_write_ins` / `mlbAllStarWriteIns` |
| `mlb_api_analytics_games` / `mlbApiAnalyticsGames` | `mlb_analytics_games` / `mlbAnalyticsGames` |
| `mlb_api_analytics_guids` / `mlbApiAnalyticsGuids` | `mlb_analytics_guids` / `mlbAnalyticsGuids` |
| `mlb_api_attendance` / `mlbApiAttendance` | `mlb_attendance` / `mlbAttendance` |
| `mlb_api_award_recipients` / `mlbApiAwardRecipients` | `mlb_award_recipients` / `mlbAwardRecipients` |
| `mlb_api_awards` / `mlbApiAwards` | `mlb_awards` / `mlbAwards` |
| `mlb_api_boxscore` / `mlbApiBoxscore` | `mlb_boxscore` / `mlbBoxscore` |
| `mlb_api_conference` / `mlbApiConference` | `mlb_conference` / `mlbConference` |
| `mlb_api_conferences` / `mlbApiConferences` | `mlb_conferences` / `mlbConferences` |
| `mlb_api_datacasters` / `mlbApiDatacasters` | `mlb_datacasters` / `mlbDatacasters` |
| `mlb_api_divisions` / `mlbApiDivisions` | `mlb_divisions` / `mlbDivisions` |
| `mlb_api_draft` / `mlbApiDraft` | `mlb_draft` / `mlbDraft` |
| `mlb_api_draft_latest` / `mlbApiDraftLatest` | `mlb_draft_latest` / `mlbDraftLatest` |
| `mlb_api_draft_prospects` / `mlbApiDraftProspects` | `mlb_draft_prospects` / `mlbDraftProspects` |
| `mlb_api_free_agents` / `mlbApiFreeAgents` | `mlb_free_agents` / `mlbFreeAgents` |
| `mlb_api_game_changes` / `mlbApiGameChanges` | `mlb_game_changes` / `mlbGameChanges` |
| `mlb_api_game_color` / `mlbApiGameColor` | `mlb_game_color` / `mlbGameColor` |
| `mlb_api_game_color_diff` / `mlbApiGameColorDiff` | `mlb_game_color_diff` / `mlbGameColorDiff` |
| `mlb_api_game_color_timestamps` / `mlbApiGameColorTimestamps` | `mlb_game_color_timestamps` / `mlbGameColorTimestamps` |
| `mlb_api_game_content` / `mlbApiGameContent` | `mlb_game_content` / `mlbGameContent` |
| `mlb_api_game_context_metrics` / `mlbApiGameContextMetrics` | `mlb_game_context_metrics` / `mlbGameContextMetrics` |
| `mlb_api_game_guids` / `mlbApiGameGuids` | `mlb_game_guids` / `mlbGameGuids` |
| `mlb_api_game_pace` / `mlbApiGamePace` | `mlb_game_pace` / `mlbGamePace` |
| `mlb_api_game_timestamps` / `mlbApiGameTimestamps` | `mlb_game_timestamps` / `mlbGameTimestamps` |
| `mlb_api_high_low` / `mlbApiHighLow` | `mlb_high_low` / `mlbHighLow` |
| `mlb_api_home_run_derby` / `mlbApiHomeRunDerby` | `mlb_home_run_derby` / `mlbHomeRunDerby` |
| `mlb_api_home_run_derby_bracket` / `mlbApiHomeRunDerbyBracket` | `mlb_home_run_derby_bracket` / `mlbHomeRunDerbyBracket` |
| `mlb_api_home_run_derby_pool` / `mlbApiHomeRunDerbyPool` | `mlb_home_run_derby_pool` / `mlbHomeRunDerbyPool` |
| `mlb_api_jobs` / `mlbApiJobs` | `mlb_jobs` / `mlbJobs` |
| `mlb_api_leagues` / `mlbApiLeagues` | `mlb_leagues` / `mlbLeagues` |
| `mlb_api_linescore` / `mlbApiLinescore` | `mlb_linescore` / `mlbLinescore` |
| `mlb_api_meta` / `mlbApiMeta` | `mlb_meta` / `mlbMeta` |
| `mlb_api_official_scorers` / `mlbApiOfficialScorers` | `mlb_official_scorers` / `mlbOfficialScorers` |
| `mlb_api_pbp` / `mlbApiPbp` | `mlb_pbp` / `mlbPbp` |
| `mlb_api_pbp_diff` / `mlbApiPbpDiff` | `mlb_pbp_diff` / `mlbPbpDiff` |
| `mlb_api_people` / `mlbApiPeople` | `mlb_people` / `mlbPeople` |
| `mlb_api_person` / `mlbApiPerson` | `mlb_person` / `mlbPerson` |
| `mlb_api_person_game_stats` / `mlbApiPersonGameStats` | `mlb_person_game_stats` / `mlbPersonGameStats` |
| `mlb_api_person_stats` / `mlbApiPersonStats` | `mlb_person_stats` / `mlbPersonStats` |
| `mlb_api_play_analytics` / `mlbApiPlayAnalytics` | `mlb_play_analytics` / `mlbPlayAnalytics` |
| `mlb_api_play_by_play` / `mlbApiPlayByPlay` | `mlb_play_by_play` / `mlbPlayByPlay` |
| `mlb_api_play_context_metrics_averages` / `mlbApiPlayContextMetricsAverages` | `mlb_play_context_metrics_averages` / `mlbPlayContextMetricsAverages` |
| `mlb_api_schedule` / `mlbApiSchedule` | `mlb_schedule` / `mlbSchedule` |
| `mlb_api_schedule_postseason` / `mlbApiSchedulePostseason` | `mlb_schedule_postseason` / `mlbSchedulePostseason` |
| `mlb_api_schedule_postseason_series` / `mlbApiSchedulePostseasonSeries` | `mlb_schedule_postseason_series` / `mlbSchedulePostseasonSeries` |
| `mlb_api_schedule_postseason_tunein` / `mlbApiSchedulePostseasonTunein` | `mlb_schedule_postseason_tunein` / `mlbSchedulePostseasonTunein` |
| `mlb_api_schedule_tied` / `mlbApiScheduleTied` | `mlb_schedule_tied` / `mlbScheduleTied` |
| `mlb_api_season` / `mlbApiSeason` | `mlb_season` / `mlbSeason` |
| `mlb_api_seasons` / `mlbApiSeasons` | `mlb_seasons` / `mlbSeasons` |
| `mlb_api_seasons_all` / `mlbApiSeasonsAll` | `mlb_seasons_all` / `mlbSeasonsAll` |
| `mlb_api_sport` / `mlbApiSport` | `mlb_sport` / `mlbSport` |
| `mlb_api_sport_players` / `mlbApiSportPlayers` | `mlb_sport_players` / `mlbSportPlayers` |
| `mlb_api_sports` / `mlbApiSports` | `mlb_sports` / `mlbSports` |
| `mlb_api_standings` / `mlbApiStandings` | `mlb_standings` / `mlbStandings` |
| `mlb_api_stats` / `mlbApiStats` | `mlb_stats` / `mlbStats` |
| `mlb_api_stats_leaders` / `mlbApiStatsLeaders` | `mlb_stats_leaders` / `mlbStatsLeaders` |
| `mlb_api_stats_metrics` / `mlbApiStatsMetrics` | `mlb_stats_metrics` / `mlbStatsMetrics` |
| `mlb_api_stats_streaks` / `mlbApiStatsStreaks` | `mlb_stats_streaks` / `mlbStatsStreaks` |
| `mlb_api_team` / `mlbApiTeam` | `mlb_team` / `mlbTeam` |
| `mlb_api_team_affiliates` / `mlbApiTeamAffiliates` | `mlb_team_affiliates` / `mlbTeamAffiliates` |
| `mlb_api_team_alumni` / `mlbApiTeamAlumni` | `mlb_team_alumni` / `mlbTeamAlumni` |
| `mlb_api_team_coaches` / `mlbApiTeamCoaches` | `mlb_team_coaches` / `mlbTeamCoaches` |
| `mlb_api_team_leaders` / `mlbApiTeamLeaders` | `mlb_team_leaders` / `mlbTeamLeaders` |
| `mlb_api_team_personnel` / `mlbApiTeamPersonnel` | `mlb_team_personnel` / `mlbTeamPersonnel` |
| `mlb_api_team_roster` / `mlbApiTeamRoster` | `mlb_team_roster` / `mlbTeamRoster` |
| `mlb_api_team_roster_type` / `mlbApiTeamRosterType` | `mlb_team_roster_type` / `mlbTeamRosterType` |
| `mlb_api_team_stats` / `mlbApiTeamStats` | `mlb_team_stats` / `mlbTeamStats` |
| `mlb_api_teams` / `mlbApiTeams` | `mlb_teams` / `mlbTeams` |
| `mlb_api_teams_history` / `mlbApiTeamsHistory` | `mlb_teams_history` / `mlbTeamsHistory` |
| `mlb_api_teams_stats` / `mlbApiTeamsStats` | `mlb_teams_stats` / `mlbTeamsStats` |
| `mlb_api_teams_stats_leaders` / `mlbApiTeamsStatsLeaders` | `mlb_teams_stats_leaders` / `mlbTeamsStatsLeaders` |
| `mlb_api_umpire_games` / `mlbApiUmpireGames` | `mlb_umpire_games` / `mlbUmpireGames` |
| `mlb_api_umpires` / `mlbApiUmpires` | `mlb_umpires` / `mlbUmpires` |
| `mlb_api_venue` / `mlbApiVenue` | `mlb_venue` / `mlbVenue` |
| `mlb_api_venues` / `mlbApiVenues` | `mlb_venues` / `mlbVenues` |
| `mlb_api_win_probability` / `mlbApiWinProbability` | `mlb_win_probability` / `mlbWinProbability` |

## `sdv.mls`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_mls_athlete_awards` / `espnMlsAthleteAwards` | `espn_mls_player_awards` / `espnMlsPlayerAwards` |
| `espn_mls_athlete_bio` / `espnMlsAthleteBio` | `espn_mls_player_bio` / `espnMlsPlayerBio` |
| `espn_mls_athlete_career_stats` / `espnMlsAthleteCareerStats` | `espn_mls_player_career_stats` / `espnMlsPlayerCareerStats` |
| `espn_mls_athlete_contracts` / `espnMlsAthleteContracts` | `espn_mls_player_contracts` / `espnMlsPlayerContracts` |
| `espn_mls_athlete_core` / `espnMlsAthleteCore` | `espn_mls_player_core` / `espnMlsPlayerCore` |
| `espn_mls_athlete_eventlog` / `espnMlsAthleteEventlog` | `espn_mls_player_eventlog` / `espnMlsPlayerEventlog` |
| `espn_mls_athlete_gamelog` / `espnMlsAthleteGamelog` | `espn_mls_player_gamelog` / `espnMlsPlayerGamelog` |
| `espn_mls_athlete_info` / `espnMlsAthleteInfo` | `espn_mls_player_info` / `espnMlsPlayerInfo` |
| `espn_mls_athlete_injuries` / `espnMlsAthleteInjuries` | `espn_mls_player_injuries` / `espnMlsPlayerInjuries` |
| `espn_mls_athlete_news` / `espnMlsAthleteNews` | `espn_mls_player_news` / `espnMlsPlayerNews` |
| `espn_mls_athlete_notes` / `espnMlsAthleteNotes` | `espn_mls_player_notes` / `espnMlsPlayerNotes` |
| `espn_mls_athlete_overview` / `espnMlsAthleteOverview` | `espn_mls_player_overview` / `espnMlsPlayerOverview` |
| `espn_mls_athlete_records` / `espnMlsAthleteRecords` | `espn_mls_player_records` / `espnMlsPlayerRecords` |
| `espn_mls_athlete_seasons` / `espnMlsAthleteSeasons` | `espn_mls_player_seasons` / `espnMlsPlayerSeasons` |
| `espn_mls_athlete_splits` / `espnMlsAthleteSplits` | `espn_mls_player_splits` / `espnMlsPlayerSplits` |
| `espn_mls_athlete_statisticslog` / `espnMlsAthleteStatisticslog` | `espn_mls_player_statisticslog` / `espnMlsPlayerStatisticslog` |
| `espn_mls_athlete_stats` / `espnMlsAthleteStats` | `espn_mls_player_stats` / `espnMlsPlayerStats` |
| `espn_mls_athlete_vs_athlete` / `espnMlsAthleteVsAthlete` | `espn_mls_player_vs_player` / `espnMlsPlayerVsPlayer` |
| `espn_mls_athletes_index` / `espnMlsAthletesIndex` | `espn_mls_players_index` / `espnMlsPlayersIndex` |
| `espn_mls_event` / `espnMlsEvent` | `espn_mls_game` / `espnMlsGame` |
| `espn_mls_event_broadcasts` / `espnMlsEventBroadcasts` | `espn_mls_game_broadcasts` / `espnMlsGameBroadcasts` |
| `espn_mls_event_competition` / `espnMlsEventCompetition` | `espn_mls_game_competition` / `espnMlsGameCompetition` |
| `espn_mls_event_competitor` / `espnMlsEventCompetitor` | `espn_mls_game_team` / `espnMlsGameTeam` |
| `espn_mls_event_competitor_leaders` / `espnMlsEventCompetitorLeaders` | `espn_mls_game_team_leaders` / `espnMlsGameTeamLeaders` |
| `espn_mls_event_competitor_linescores` / `espnMlsEventCompetitorLinescores` | `espn_mls_game_team_linescores` / `espnMlsGameTeamLinescores` |
| `espn_mls_event_competitor_record` / `espnMlsEventCompetitorRecord` | `espn_mls_game_team_record` / `espnMlsGameTeamRecord` |
| `espn_mls_event_competitor_roster` / `espnMlsEventCompetitorRoster` | `espn_mls_game_team_roster` / `espnMlsGameTeamRoster` |
| `espn_mls_event_competitor_statistics` / `espnMlsEventCompetitorStatistics` | `espn_mls_game_team_statistics` / `espnMlsGameTeamStatistics` |
| `espn_mls_event_competitors` / `espnMlsEventCompetitors` | `espn_mls_game_teams` / `espnMlsGameTeams` |
| `espn_mls_event_leaders` / `espnMlsEventLeaders` | `espn_mls_game_leaders` / `espnMlsGameLeaders` |
| `espn_mls_event_odds` / `espnMlsEventOdds` | `espn_mls_game_odds` / `espnMlsGameOdds` |
| `espn_mls_event_official_detail` / `espnMlsEventOfficialDetail` | `espn_mls_game_official_detail` / `espnMlsGameOfficialDetail` |
| `espn_mls_event_officials` / `espnMlsEventOfficials` | `espn_mls_game_officials` / `espnMlsGameOfficials` |
| `espn_mls_event_play` / `espnMlsEventPlay` | `espn_mls_game_play` / `espnMlsGamePlay` |
| `espn_mls_event_play_personnel` / `espnMlsEventPlayPersonnel` | `espn_mls_game_play_personnel` / `espnMlsGamePlayPersonnel` |
| `espn_mls_event_plays` / `espnMlsEventPlays` | `espn_mls_game_plays` / `espnMlsGamePlays` |
| `espn_mls_event_powerindex` / `espnMlsEventPowerindex` | `espn_mls_game_powerindex` / `espnMlsGamePowerindex` |
| `espn_mls_event_predictor` / `espnMlsEventPredictor` | `espn_mls_game_predictor` / `espnMlsGamePredictor` |
| `espn_mls_event_probabilities` / `espnMlsEventProbabilities` | `espn_mls_game_probabilities` / `espnMlsGameProbabilities` |
| `espn_mls_event_propbets` / `espnMlsEventPropbets` | `espn_mls_game_propbets` / `espnMlsGamePropbets` |
| `espn_mls_event_scoringplays` / `espnMlsEventScoringplays` | `espn_mls_game_scoringplays` / `espnMlsGameScoringplays` |
| `espn_mls_event_situation` / `espnMlsEventSituation` | `espn_mls_game_situation` / `espnMlsGameSituation` |
| `espn_mls_event_status` / `espnMlsEventStatus` | `espn_mls_game_status` / `espnMlsGameStatus` |
| `espn_mls_events` / `espnMlsEvents` | `espn_mls_games` / `espnMlsGames` |
| `espn_mls_season_athletes` / `espnMlsSeasonAthletes` | `espn_mls_season_players` / `espnMlsSeasonPlayers` |
| `espn_mls_season_week_events` / `espnMlsSeasonWeekEvents` | `espn_mls_season_week_games` / `espnMlsSeasonWeekGames` |

## `sdv.nba`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_nba_athlete_awards` / `espnNbaAthleteAwards` | `espn_nba_player_awards` / `espnNbaPlayerAwards` |
| `espn_nba_athlete_bio` / `espnNbaAthleteBio` | `espn_nba_player_bio` / `espnNbaPlayerBio` |
| `espn_nba_athlete_career_stats` / `espnNbaAthleteCareerStats` | `espn_nba_player_career_stats` / `espnNbaPlayerCareerStats` |
| `espn_nba_athlete_contracts` / `espnNbaAthleteContracts` | `espn_nba_player_contracts` / `espnNbaPlayerContracts` |
| `espn_nba_athlete_core` / `espnNbaAthleteCore` | `espn_nba_player_core` / `espnNbaPlayerCore` |
| `espn_nba_athlete_eventlog` / `espnNbaAthleteEventlog` | `espn_nba_player_eventlog` / `espnNbaPlayerEventlog` |
| `espn_nba_athlete_gamelog` / `espnNbaAthleteGamelog` | `espn_nba_player_gamelog` / `espnNbaPlayerGamelog` |
| `espn_nba_athlete_info` / `espnNbaAthleteInfo` | `espn_nba_player_info` / `espnNbaPlayerInfo` |
| `espn_nba_athlete_injuries` / `espnNbaAthleteInjuries` | `espn_nba_player_injuries` / `espnNbaPlayerInjuries` |
| `espn_nba_athlete_news` / `espnNbaAthleteNews` | `espn_nba_player_news` / `espnNbaPlayerNews` |
| `espn_nba_athlete_notes` / `espnNbaAthleteNotes` | `espn_nba_player_notes` / `espnNbaPlayerNotes` |
| `espn_nba_athlete_overview` / `espnNbaAthleteOverview` | `espn_nba_player_overview` / `espnNbaPlayerOverview` |
| `espn_nba_athlete_records` / `espnNbaAthleteRecords` | `espn_nba_player_records` / `espnNbaPlayerRecords` |
| `espn_nba_athlete_seasons` / `espnNbaAthleteSeasons` | `espn_nba_player_seasons` / `espnNbaPlayerSeasons` |
| `espn_nba_athlete_splits` / `espnNbaAthleteSplits` | `espn_nba_player_splits` / `espnNbaPlayerSplits` |
| `espn_nba_athlete_statisticslog` / `espnNbaAthleteStatisticslog` | `espn_nba_player_statisticslog` / `espnNbaPlayerStatisticslog` |
| `espn_nba_athlete_stats` / `espnNbaAthleteStats` | `espn_nba_player_stats_v3` / `espnNbaPlayerStatsV3` |
| `espn_nba_athlete_vs_athlete` / `espnNbaAthleteVsAthlete` | `espn_nba_player_vs_player` / `espnNbaPlayerVsPlayer` |
| `espn_nba_athletes_index` / `espnNbaAthletesIndex` | `espn_nba_players_index` / `espnNbaPlayersIndex` |
| `espn_nba_event` / `espnNbaEvent` | `espn_nba_game` / `espnNbaGame` |
| `espn_nba_event_broadcasts` / `espnNbaEventBroadcasts` | `espn_nba_game_broadcasts` / `espnNbaGameBroadcasts` |
| `espn_nba_event_competition` / `espnNbaEventCompetition` | `espn_nba_game_competition` / `espnNbaGameCompetition` |
| `espn_nba_event_competitor` / `espnNbaEventCompetitor` | `espn_nba_game_team` / `espnNbaGameTeam` |
| `espn_nba_event_competitor_leaders` / `espnNbaEventCompetitorLeaders` | `espn_nba_game_team_leaders` / `espnNbaGameTeamLeaders` |
| `espn_nba_event_competitor_linescores` / `espnNbaEventCompetitorLinescores` | `espn_nba_game_team_linescores` / `espnNbaGameTeamLinescores` |
| `espn_nba_event_competitor_record` / `espnNbaEventCompetitorRecord` | `espn_nba_game_team_record` / `espnNbaGameTeamRecord` |
| `espn_nba_event_competitor_roster` / `espnNbaEventCompetitorRoster` | `espn_nba_game_team_roster` / `espnNbaGameTeamRoster` |
| `espn_nba_event_competitor_statistics` / `espnNbaEventCompetitorStatistics` | `espn_nba_game_team_statistics` / `espnNbaGameTeamStatistics` |
| `espn_nba_event_competitors` / `espnNbaEventCompetitors` | `espn_nba_game_teams` / `espnNbaGameTeams` |
| `espn_nba_event_leaders` / `espnNbaEventLeaders` | `espn_nba_game_leaders` / `espnNbaGameLeaders` |
| `espn_nba_event_odds` / `espnNbaEventOdds` | `espn_nba_game_odds` / `espnNbaGameOdds` |
| `espn_nba_event_official_detail` / `espnNbaEventOfficialDetail` | `espn_nba_game_official_detail` / `espnNbaGameOfficialDetail` |
| `espn_nba_event_officials` / `espnNbaEventOfficials` | `espn_nba_game_officials` / `espnNbaGameOfficials` |
| `espn_nba_event_play` / `espnNbaEventPlay` | `espn_nba_game_play` / `espnNbaGamePlay` |
| `espn_nba_event_play_personnel` / `espnNbaEventPlayPersonnel` | `espn_nba_game_play_personnel` / `espnNbaGamePlayPersonnel` |
| `espn_nba_event_plays` / `espnNbaEventPlays` | `espn_nba_game_plays` / `espnNbaGamePlays` |
| `espn_nba_event_powerindex` / `espnNbaEventPowerindex` | `espn_nba_game_powerindex` / `espnNbaGamePowerindex` |
| `espn_nba_event_predictor` / `espnNbaEventPredictor` | `espn_nba_game_predictor` / `espnNbaGamePredictor` |
| `espn_nba_event_probabilities` / `espnNbaEventProbabilities` | `espn_nba_game_probabilities` / `espnNbaGameProbabilities` |
| `espn_nba_event_propbets` / `espnNbaEventPropbets` | `espn_nba_game_propbets` / `espnNbaGamePropbets` |
| `espn_nba_event_scoringplays` / `espnNbaEventScoringplays` | `espn_nba_game_scoringplays` / `espnNbaGameScoringplays` |
| `espn_nba_event_situation` / `espnNbaEventSituation` | `espn_nba_game_situation` / `espnNbaGameSituation` |
| `espn_nba_event_status` / `espnNbaEventStatus` | `espn_nba_game_status` / `espnNbaGameStatus` |
| `espn_nba_events` / `espnNbaEvents` | `espn_nba_games` / `espnNbaGames` |
| `espn_nba_season_athletes` / `espnNbaSeasonAthletes` | `espn_nba_season_players` / `espnNbaSeasonPlayers` |
| `espn_nba_season_week_events` / `espnNbaSeasonWeekEvents` | `espn_nba_season_week_games` / `espnNbaSeasonWeekGames` |

## `sdv.nfl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_nfl_athlete_awards` / `espnNflAthleteAwards` | `espn_nfl_player_awards` / `espnNflPlayerAwards` |
| `espn_nfl_athlete_bio` / `espnNflAthleteBio` | `espn_nfl_player_bio` / `espnNflPlayerBio` |
| `espn_nfl_athlete_career_stats` / `espnNflAthleteCareerStats` | `espn_nfl_player_career_stats` / `espnNflPlayerCareerStats` |
| `espn_nfl_athlete_contracts` / `espnNflAthleteContracts` | `espn_nfl_player_contracts` / `espnNflPlayerContracts` |
| `espn_nfl_athlete_core` / `espnNflAthleteCore` | `espn_nfl_player_core` / `espnNflPlayerCore` |
| `espn_nfl_athlete_eventlog` / `espnNflAthleteEventlog` | `espn_nfl_player_eventlog` / `espnNflPlayerEventlog` |
| `espn_nfl_athlete_gamelog` / `espnNflAthleteGamelog` | `espn_nfl_player_gamelog` / `espnNflPlayerGamelog` |
| `espn_nfl_athlete_info` / `espnNflAthleteInfo` | `espn_nfl_player_info` / `espnNflPlayerInfo` |
| `espn_nfl_athlete_injuries` / `espnNflAthleteInjuries` | `espn_nfl_player_injuries` / `espnNflPlayerInjuries` |
| `espn_nfl_athlete_news` / `espnNflAthleteNews` | `espn_nfl_player_news` / `espnNflPlayerNews` |
| `espn_nfl_athlete_notes` / `espnNflAthleteNotes` | `espn_nfl_player_notes` / `espnNflPlayerNotes` |
| `espn_nfl_athlete_overview` / `espnNflAthleteOverview` | `espn_nfl_player_overview` / `espnNflPlayerOverview` |
| `espn_nfl_athlete_records` / `espnNflAthleteRecords` | `espn_nfl_player_records` / `espnNflPlayerRecords` |
| `espn_nfl_athlete_seasons` / `espnNflAthleteSeasons` | `espn_nfl_player_seasons` / `espnNflPlayerSeasons` |
| `espn_nfl_athlete_splits` / `espnNflAthleteSplits` | `espn_nfl_player_splits` / `espnNflPlayerSplits` |
| `espn_nfl_athlete_statisticslog` / `espnNflAthleteStatisticslog` | `espn_nfl_player_statisticslog` / `espnNflPlayerStatisticslog` |
| `espn_nfl_athlete_stats` / `espnNflAthleteStats` | `espn_nfl_player_stats_v3` / `espnNflPlayerStatsV3` |
| `espn_nfl_athlete_vs_athlete` / `espnNflAthleteVsAthlete` | `espn_nfl_player_vs_player` / `espnNflPlayerVsPlayer` |
| `espn_nfl_athletes_index` / `espnNflAthletesIndex` | `espn_nfl_players_index` / `espnNflPlayersIndex` |
| `espn_nfl_event` / `espnNflEvent` | `espn_nfl_game` / `espnNflGame` |
| `espn_nfl_event_broadcasts` / `espnNflEventBroadcasts` | `espn_nfl_game_broadcasts` / `espnNflGameBroadcasts` |
| `espn_nfl_event_competition` / `espnNflEventCompetition` | `espn_nfl_game_competition` / `espnNflGameCompetition` |
| `espn_nfl_event_competitor` / `espnNflEventCompetitor` | `espn_nfl_game_team` / `espnNflGameTeam` |
| `espn_nfl_event_competitor_leaders` / `espnNflEventCompetitorLeaders` | `espn_nfl_game_team_leaders` / `espnNflGameTeamLeaders` |
| `espn_nfl_event_competitor_linescores` / `espnNflEventCompetitorLinescores` | `espn_nfl_game_team_linescores` / `espnNflGameTeamLinescores` |
| `espn_nfl_event_competitor_record` / `espnNflEventCompetitorRecord` | `espn_nfl_game_team_record` / `espnNflGameTeamRecord` |
| `espn_nfl_event_competitor_roster` / `espnNflEventCompetitorRoster` | `espn_nfl_game_team_roster` / `espnNflGameTeamRoster` |
| `espn_nfl_event_competitor_statistics` / `espnNflEventCompetitorStatistics` | `espn_nfl_game_team_statistics` / `espnNflGameTeamStatistics` |
| `espn_nfl_event_competitors` / `espnNflEventCompetitors` | `espn_nfl_game_teams` / `espnNflGameTeams` |
| `espn_nfl_event_leaders` / `espnNflEventLeaders` | `espn_nfl_game_leaders` / `espnNflGameLeaders` |
| `espn_nfl_event_odds` / `espnNflEventOdds` | `espn_nfl_game_odds` / `espnNflGameOdds` |
| `espn_nfl_event_official_detail` / `espnNflEventOfficialDetail` | `espn_nfl_game_official_detail` / `espnNflGameOfficialDetail` |
| `espn_nfl_event_officials` / `espnNflEventOfficials` | `espn_nfl_game_officials` / `espnNflGameOfficials` |
| `espn_nfl_event_play` / `espnNflEventPlay` | `espn_nfl_game_play` / `espnNflGamePlay` |
| `espn_nfl_event_play_personnel` / `espnNflEventPlayPersonnel` | `espn_nfl_game_play_personnel` / `espnNflGamePlayPersonnel` |
| `espn_nfl_event_plays` / `espnNflEventPlays` | `espn_nfl_game_plays` / `espnNflGamePlays` |
| `espn_nfl_event_powerindex` / `espnNflEventPowerindex` | `espn_nfl_game_powerindex` / `espnNflGamePowerindex` |
| `espn_nfl_event_predictor` / `espnNflEventPredictor` | `espn_nfl_game_predictor` / `espnNflGamePredictor` |
| `espn_nfl_event_probabilities` / `espnNflEventProbabilities` | `espn_nfl_game_probabilities` / `espnNflGameProbabilities` |
| `espn_nfl_event_propbets` / `espnNflEventPropbets` | `espn_nfl_game_propbets` / `espnNflGamePropbets` |
| `espn_nfl_event_scoringplays` / `espnNflEventScoringplays` | `espn_nfl_game_scoringplays` / `espnNflGameScoringplays` |
| `espn_nfl_event_situation` / `espnNflEventSituation` | `espn_nfl_game_situation` / `espnNflGameSituation` |
| `espn_nfl_event_status` / `espnNflEventStatus` | `espn_nfl_game_status` / `espnNflGameStatus` |
| `espn_nfl_events` / `espnNflEvents` | `espn_nfl_games` / `espnNflGames` |
| `espn_nfl_season_athletes` / `espnNflSeasonAthletes` | `espn_nfl_season_players` / `espnNflSeasonPlayers` |
| `espn_nfl_season_week_events` / `espnNflSeasonWeekEvents` | `espn_nfl_season_week_games` / `espnNflSeasonWeekGames` |
| `nfl_api_combine_profiles` / `nflApiCombineProfiles` | `nfl_combine_profiles` / `nflCombineProfiles` |
| `nfl_api_draft_picks` / `nflApiDraftPicks` | `nfl_draft_picks` / `nflDraftPicks` |
| `nfl_api_game_details_by_slug` / `nflApiGameDetailsBySlug` | `nfl_game_details_by_slug` / `nflGameDetailsBySlug` |
| `nfl_api_game_details_v2` / `nflApiGameDetailsV2` | `nfl_game_details_v2` / `nflGameDetailsV2` |
| `nfl_api_game_summaries` / `nflApiGameSummaries` | `nfl_game_summaries` / `nflGameSummaries` |
| `nfl_api_injuries` / `nflApiInjuries` | `nfl_injuries` / `nflInjuries` |
| `nfl_api_live_player_statistics` / `nflApiLivePlayerStatistics` | `nfl_live_player_statistics` / `nflLivePlayerStatistics` |
| `nfl_api_live_team_statistics` / `nflApiLiveTeamStatistics` | `nfl_live_team_statistics` / `nflLiveTeamStatistics` |
| `nfl_api_rosters` / `nflApiRosters` | `nfl_rosters` / `nflRosters` |
| `nfl_api_standings` / `nflApiStandings` | `nfl_standings` / `nflStandings` |
| `nfl_api_team` / `nflApiTeam` | `nfl_team` / `nflTeam` |
| `nfl_api_teams_history` / `nflApiTeamsHistory` | `nfl_teams_history` / `nflTeamsHistory` |
| `nfl_api_weekly_game_details` / `nflApiWeeklyGameDetails` | `nfl_weekly_game_details` / `nflWeeklyGameDetails` |
| `nfl_api_weeks` / `nflApiWeeks` | `nfl_weeks` / `nflWeeks` |
| `nfl_api_weeks_by_date` / `nflApiWeeksByDate` | `nfl_weeks_by_date` / `nflWeeksByDate` |

## `sdv.nhl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_nhl_athlete_awards` / `espnNhlAthleteAwards` | `espn_nhl_player_awards` / `espnNhlPlayerAwards` |
| `espn_nhl_athlete_bio` / `espnNhlAthleteBio` | `espn_nhl_player_bio` / `espnNhlPlayerBio` |
| `espn_nhl_athlete_career_stats` / `espnNhlAthleteCareerStats` | `espn_nhl_player_career_stats` / `espnNhlPlayerCareerStats` |
| `espn_nhl_athlete_contracts` / `espnNhlAthleteContracts` | `espn_nhl_player_contracts` / `espnNhlPlayerContracts` |
| `espn_nhl_athlete_core` / `espnNhlAthleteCore` | `espn_nhl_player_core` / `espnNhlPlayerCore` |
| `espn_nhl_athlete_eventlog` / `espnNhlAthleteEventlog` | `espn_nhl_player_eventlog` / `espnNhlPlayerEventlog` |
| `espn_nhl_athlete_gamelog` / `espnNhlAthleteGamelog` | `espn_nhl_player_gamelog` / `espnNhlPlayerGamelog` |
| `espn_nhl_athlete_info` / `espnNhlAthleteInfo` | `espn_nhl_player_info` / `espnNhlPlayerInfo` |
| `espn_nhl_athlete_injuries` / `espnNhlAthleteInjuries` | `espn_nhl_player_injuries` / `espnNhlPlayerInjuries` |
| `espn_nhl_athlete_news` / `espnNhlAthleteNews` | `espn_nhl_player_news` / `espnNhlPlayerNews` |
| `espn_nhl_athlete_notes` / `espnNhlAthleteNotes` | `espn_nhl_player_notes` / `espnNhlPlayerNotes` |
| `espn_nhl_athlete_overview` / `espnNhlAthleteOverview` | `espn_nhl_player_overview` / `espnNhlPlayerOverview` |
| `espn_nhl_athlete_records` / `espnNhlAthleteRecords` | `espn_nhl_player_records` / `espnNhlPlayerRecords` |
| `espn_nhl_athlete_seasons` / `espnNhlAthleteSeasons` | `espn_nhl_player_seasons` / `espnNhlPlayerSeasons` |
| `espn_nhl_athlete_splits` / `espnNhlAthleteSplits` | `espn_nhl_player_splits` / `espnNhlPlayerSplits` |
| `espn_nhl_athlete_statisticslog` / `espnNhlAthleteStatisticslog` | `espn_nhl_player_statisticslog` / `espnNhlPlayerStatisticslog` |
| `espn_nhl_athlete_stats` / `espnNhlAthleteStats` | `espn_nhl_player_stats_v3` / `espnNhlPlayerStatsV3` |
| `espn_nhl_athlete_vs_athlete` / `espnNhlAthleteVsAthlete` | `espn_nhl_player_vs_player` / `espnNhlPlayerVsPlayer` |
| `espn_nhl_athletes_index` / `espnNhlAthletesIndex` | `espn_nhl_players_index` / `espnNhlPlayersIndex` |
| `espn_nhl_event` / `espnNhlEvent` | `espn_nhl_game` / `espnNhlGame` |
| `espn_nhl_event_broadcasts` / `espnNhlEventBroadcasts` | `espn_nhl_game_broadcasts` / `espnNhlGameBroadcasts` |
| `espn_nhl_event_competition` / `espnNhlEventCompetition` | `espn_nhl_game_competition` / `espnNhlGameCompetition` |
| `espn_nhl_event_competitor` / `espnNhlEventCompetitor` | `espn_nhl_game_team` / `espnNhlGameTeam` |
| `espn_nhl_event_competitor_leaders` / `espnNhlEventCompetitorLeaders` | `espn_nhl_game_team_leaders` / `espnNhlGameTeamLeaders` |
| `espn_nhl_event_competitor_linescores` / `espnNhlEventCompetitorLinescores` | `espn_nhl_game_team_linescores` / `espnNhlGameTeamLinescores` |
| `espn_nhl_event_competitor_record` / `espnNhlEventCompetitorRecord` | `espn_nhl_game_team_record` / `espnNhlGameTeamRecord` |
| `espn_nhl_event_competitor_roster` / `espnNhlEventCompetitorRoster` | `espn_nhl_game_team_roster` / `espnNhlGameTeamRoster` |
| `espn_nhl_event_competitor_statistics` / `espnNhlEventCompetitorStatistics` | `espn_nhl_game_team_statistics` / `espnNhlGameTeamStatistics` |
| `espn_nhl_event_competitors` / `espnNhlEventCompetitors` | `espn_nhl_game_teams` / `espnNhlGameTeams` |
| `espn_nhl_event_leaders` / `espnNhlEventLeaders` | `espn_nhl_game_leaders` / `espnNhlGameLeaders` |
| `espn_nhl_event_odds` / `espnNhlEventOdds` | `espn_nhl_game_odds` / `espnNhlGameOdds` |
| `espn_nhl_event_official_detail` / `espnNhlEventOfficialDetail` | `espn_nhl_game_official_detail` / `espnNhlGameOfficialDetail` |
| `espn_nhl_event_officials` / `espnNhlEventOfficials` | `espn_nhl_game_officials` / `espnNhlGameOfficials` |
| `espn_nhl_event_play` / `espnNhlEventPlay` | `espn_nhl_game_play` / `espnNhlGamePlay` |
| `espn_nhl_event_play_personnel` / `espnNhlEventPlayPersonnel` | `espn_nhl_game_play_personnel` / `espnNhlGamePlayPersonnel` |
| `espn_nhl_event_plays` / `espnNhlEventPlays` | `espn_nhl_game_plays` / `espnNhlGamePlays` |
| `espn_nhl_event_powerindex` / `espnNhlEventPowerindex` | `espn_nhl_game_powerindex` / `espnNhlGamePowerindex` |
| `espn_nhl_event_predictor` / `espnNhlEventPredictor` | `espn_nhl_game_predictor` / `espnNhlGamePredictor` |
| `espn_nhl_event_probabilities` / `espnNhlEventProbabilities` | `espn_nhl_game_probabilities` / `espnNhlGameProbabilities` |
| `espn_nhl_event_propbets` / `espnNhlEventPropbets` | `espn_nhl_game_propbets` / `espnNhlGamePropbets` |
| `espn_nhl_event_scoringplays` / `espnNhlEventScoringplays` | `espn_nhl_game_scoringplays` / `espnNhlGameScoringplays` |
| `espn_nhl_event_situation` / `espnNhlEventSituation` | `espn_nhl_game_situation` / `espnNhlGameSituation` |
| `espn_nhl_event_status` / `espnNhlEventStatus` | `espn_nhl_game_status` / `espnNhlGameStatus` |
| `espn_nhl_events` / `espnNhlEvents` | `espn_nhl_games` / `espnNhlGames` |
| `espn_nhl_season_athletes` / `espnNhlSeasonAthletes` | `espn_nhl_season_players` / `espnNhlSeasonPlayers` |
| `espn_nhl_season_week_events` / `espnNhlSeasonWeekEvents` | `espn_nhl_season_week_games` / `espnNhlSeasonWeekGames` |
| `nhl_api_web_boxscore` / `nhlApiWebBoxscore` | `nhl_boxscore` / `nhlBoxscore` |
| `nhl_api_web_club_schedule_month` / `nhlApiWebClubScheduleMonth` | `nhl_club_schedule_month` / `nhlClubScheduleMonth` |
| `nhl_api_web_club_schedule_season` / `nhlApiWebClubScheduleSeason` | `nhl_club_schedule_season` / `nhlClubScheduleSeason` |
| `nhl_api_web_club_schedule_week` / `nhlApiWebClubScheduleWeek` | `nhl_club_schedule_week` / `nhlClubScheduleWeek` |
| `nhl_api_web_club_stats` / `nhlApiWebClubStats` | `nhl_club_stats` / `nhlClubStats` |
| `nhl_api_web_club_stats_season` / `nhlApiWebClubStatsSeason` | `nhl_club_stats_season` / `nhlClubStatsSeason` |
| `nhl_api_web_draft_picks` / `nhlApiWebDraftPicks` | `nhl_draft_picks` / `nhlDraftPicks` |
| `nhl_api_web_draft_picks_now` / `nhlApiWebDraftPicksNow` | `nhl_draft_picks_now` / `nhlDraftPicksNow` |
| `nhl_api_web_draft_rankings` / `nhlApiWebDraftRankings` | `nhl_draft_rankings` / `nhlDraftRankings` |
| `nhl_api_web_draft_rankings_now` / `nhlApiWebDraftRankingsNow` | `nhl_draft_rankings_now` / `nhlDraftRankingsNow` |
| `nhl_api_web_draft_tracker_picks_now` / `nhlApiWebDraftTrackerPicksNow` | `nhl_draft_tracker_picks_now` / `nhlDraftTrackerPicksNow` |
| `nhl_api_web_goalie_leaders` / `nhlApiWebGoalieLeaders` | `nhl_goalie_leaders` / `nhlGoalieLeaders` |
| `nhl_api_web_landing` / `nhlApiWebLanding` | `nhl_landing` / `nhlLanding` |
| `nhl_api_web_pbp` / `nhlApiWebPbp` | `nhl_web_pbp` / `nhlWebPbp` |
| `nhl_api_web_player_game_log` / `nhlApiWebPlayerGameLog` | `nhl_player_game_log` / `nhlPlayerGameLog` |
| `nhl_api_web_player_landing` / `nhlApiWebPlayerLanding` | `nhl_player_landing` / `nhlPlayerLanding` |
| `nhl_api_web_player_spotlight` / `nhlApiWebPlayerSpotlight` | `nhl_player_spotlight` / `nhlPlayerSpotlight` |
| `nhl_api_web_playoff_series` / `nhlApiWebPlayoffSeries` | `nhl_playoff_series` / `nhlPlayoffSeries` |
| `nhl_api_web_right_rail` / `nhlApiWebRightRail` | `nhl_right_rail` / `nhlRightRail` |
| `nhl_api_web_roster` / `nhlApiWebRoster` | `nhl_roster` / `nhlRoster` |
| `nhl_api_web_roster_season` / `nhlApiWebRosterSeason` | `nhl_roster_season` / `nhlRosterSeason` |
| `nhl_api_web_schedule` / `nhlApiWebSchedule` | `nhl_web_schedule` / `nhlWebSchedule` |
| `nhl_api_web_schedule_calendar` / `nhlApiWebScheduleCalendar` | `nhl_schedule_calendar` / `nhlScheduleCalendar` |
| `nhl_api_web_score` / `nhlApiWebScore` | `nhl_score` / `nhlScore` |
| `nhl_api_web_skater_leaders` / `nhlApiWebSkaterLeaders` | `nhl_skater_leaders` / `nhlSkaterLeaders` |
| `nhl_api_web_standings` / `nhlApiWebStandings` | `nhl_standings` / `nhlStandings` |
| `nhl_api_web_standings_season` / `nhlApiWebStandingsSeason` | `nhl_standings_season` / `nhlStandingsSeason` |

## `sdv.nwsl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_nwsl_athlete_awards` / `espnNwslAthleteAwards` | `espn_nwsl_player_awards` / `espnNwslPlayerAwards` |
| `espn_nwsl_athlete_bio` / `espnNwslAthleteBio` | `espn_nwsl_player_bio` / `espnNwslPlayerBio` |
| `espn_nwsl_athlete_career_stats` / `espnNwslAthleteCareerStats` | `espn_nwsl_player_career_stats` / `espnNwslPlayerCareerStats` |
| `espn_nwsl_athlete_contracts` / `espnNwslAthleteContracts` | `espn_nwsl_player_contracts` / `espnNwslPlayerContracts` |
| `espn_nwsl_athlete_core` / `espnNwslAthleteCore` | `espn_nwsl_player_core` / `espnNwslPlayerCore` |
| `espn_nwsl_athlete_eventlog` / `espnNwslAthleteEventlog` | `espn_nwsl_player_eventlog` / `espnNwslPlayerEventlog` |
| `espn_nwsl_athlete_gamelog` / `espnNwslAthleteGamelog` | `espn_nwsl_player_gamelog` / `espnNwslPlayerGamelog` |
| `espn_nwsl_athlete_info` / `espnNwslAthleteInfo` | `espn_nwsl_player_info` / `espnNwslPlayerInfo` |
| `espn_nwsl_athlete_injuries` / `espnNwslAthleteInjuries` | `espn_nwsl_player_injuries` / `espnNwslPlayerInjuries` |
| `espn_nwsl_athlete_news` / `espnNwslAthleteNews` | `espn_nwsl_player_news` / `espnNwslPlayerNews` |
| `espn_nwsl_athlete_notes` / `espnNwslAthleteNotes` | `espn_nwsl_player_notes` / `espnNwslPlayerNotes` |
| `espn_nwsl_athlete_overview` / `espnNwslAthleteOverview` | `espn_nwsl_player_overview` / `espnNwslPlayerOverview` |
| `espn_nwsl_athlete_records` / `espnNwslAthleteRecords` | `espn_nwsl_player_records` / `espnNwslPlayerRecords` |
| `espn_nwsl_athlete_seasons` / `espnNwslAthleteSeasons` | `espn_nwsl_player_seasons` / `espnNwslPlayerSeasons` |
| `espn_nwsl_athlete_splits` / `espnNwslAthleteSplits` | `espn_nwsl_player_splits` / `espnNwslPlayerSplits` |
| `espn_nwsl_athlete_statisticslog` / `espnNwslAthleteStatisticslog` | `espn_nwsl_player_statisticslog` / `espnNwslPlayerStatisticslog` |
| `espn_nwsl_athlete_stats` / `espnNwslAthleteStats` | `espn_nwsl_player_stats` / `espnNwslPlayerStats` |
| `espn_nwsl_athlete_vs_athlete` / `espnNwslAthleteVsAthlete` | `espn_nwsl_player_vs_player` / `espnNwslPlayerVsPlayer` |
| `espn_nwsl_athletes_index` / `espnNwslAthletesIndex` | `espn_nwsl_players_index` / `espnNwslPlayersIndex` |
| `espn_nwsl_event` / `espnNwslEvent` | `espn_nwsl_game` / `espnNwslGame` |
| `espn_nwsl_event_broadcasts` / `espnNwslEventBroadcasts` | `espn_nwsl_game_broadcasts` / `espnNwslGameBroadcasts` |
| `espn_nwsl_event_competition` / `espnNwslEventCompetition` | `espn_nwsl_game_competition` / `espnNwslGameCompetition` |
| `espn_nwsl_event_competitor` / `espnNwslEventCompetitor` | `espn_nwsl_game_team` / `espnNwslGameTeam` |
| `espn_nwsl_event_competitor_leaders` / `espnNwslEventCompetitorLeaders` | `espn_nwsl_game_team_leaders` / `espnNwslGameTeamLeaders` |
| `espn_nwsl_event_competitor_linescores` / `espnNwslEventCompetitorLinescores` | `espn_nwsl_game_team_linescores` / `espnNwslGameTeamLinescores` |
| `espn_nwsl_event_competitor_record` / `espnNwslEventCompetitorRecord` | `espn_nwsl_game_team_record` / `espnNwslGameTeamRecord` |
| `espn_nwsl_event_competitor_roster` / `espnNwslEventCompetitorRoster` | `espn_nwsl_game_team_roster` / `espnNwslGameTeamRoster` |
| `espn_nwsl_event_competitor_statistics` / `espnNwslEventCompetitorStatistics` | `espn_nwsl_game_team_statistics` / `espnNwslGameTeamStatistics` |
| `espn_nwsl_event_competitors` / `espnNwslEventCompetitors` | `espn_nwsl_game_teams` / `espnNwslGameTeams` |
| `espn_nwsl_event_leaders` / `espnNwslEventLeaders` | `espn_nwsl_game_leaders` / `espnNwslGameLeaders` |
| `espn_nwsl_event_odds` / `espnNwslEventOdds` | `espn_nwsl_game_odds` / `espnNwslGameOdds` |
| `espn_nwsl_event_official_detail` / `espnNwslEventOfficialDetail` | `espn_nwsl_game_official_detail` / `espnNwslGameOfficialDetail` |
| `espn_nwsl_event_officials` / `espnNwslEventOfficials` | `espn_nwsl_game_officials` / `espnNwslGameOfficials` |
| `espn_nwsl_event_play` / `espnNwslEventPlay` | `espn_nwsl_game_play` / `espnNwslGamePlay` |
| `espn_nwsl_event_play_personnel` / `espnNwslEventPlayPersonnel` | `espn_nwsl_game_play_personnel` / `espnNwslGamePlayPersonnel` |
| `espn_nwsl_event_plays` / `espnNwslEventPlays` | `espn_nwsl_game_plays` / `espnNwslGamePlays` |
| `espn_nwsl_event_powerindex` / `espnNwslEventPowerindex` | `espn_nwsl_game_powerindex` / `espnNwslGamePowerindex` |
| `espn_nwsl_event_predictor` / `espnNwslEventPredictor` | `espn_nwsl_game_predictor` / `espnNwslGamePredictor` |
| `espn_nwsl_event_probabilities` / `espnNwslEventProbabilities` | `espn_nwsl_game_probabilities` / `espnNwslGameProbabilities` |
| `espn_nwsl_event_propbets` / `espnNwslEventPropbets` | `espn_nwsl_game_propbets` / `espnNwslGamePropbets` |
| `espn_nwsl_event_scoringplays` / `espnNwslEventScoringplays` | `espn_nwsl_game_scoringplays` / `espnNwslGameScoringplays` |
| `espn_nwsl_event_situation` / `espnNwslEventSituation` | `espn_nwsl_game_situation` / `espnNwslGameSituation` |
| `espn_nwsl_event_status` / `espnNwslEventStatus` | `espn_nwsl_game_status` / `espnNwslGameStatus` |
| `espn_nwsl_events` / `espnNwslEvents` | `espn_nwsl_games` / `espnNwslGames` |
| `espn_nwsl_season_athletes` / `espnNwslSeasonAthletes` | `espn_nwsl_season_players` / `espnNwslSeasonPlayers` |
| `espn_nwsl_season_week_events` / `espnNwslSeasonWeekEvents` | `espn_nwsl_season_week_games` / `espnNwslSeasonWeekGames` |

## `sdv.recruiting`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `sports247_archived_player_rankings` / `sports247ArchivedPlayerRankings` | `recruiting_archived_player_rankings` / `recruitingArchivedPlayerRankings` |
| `sports247_biggest_movers` / `sports247BiggestMovers` | `recruiting_biggest_movers` / `recruitingBiggestMovers` |
| `sports247_coaches` / `sports247Coaches` | `recruiting_coaches` / `recruitingCoaches` |
| `sports247_current_target_predictions` / `sports247CurrentTargetPredictions` | `recruiting_current_target_predictions` / `recruitingCurrentTargetPredictions` |
| `sports247_institution_groups` / `sports247InstitutionGroups` | `recruiting_institution_groups` / `recruitingInstitutionGroups` |
| `sports247_institution_rankings` / `sports247InstitutionRankings` | `recruiting_institution_rankings` / `recruitingInstitutionRankings` |
| `sports247_player_sport_rankings` / `sports247PlayerSportRankings` | `recruiting_player_sport_rankings` / `recruitingPlayerSportRankings` |
| `sports247_players_under_special_evaluation` / `sports247PlayersUnderSpecialEvaluation` | `recruiting_players_under_special_evaluation` / `recruitingPlayersUnderSpecialEvaluation` |
| `sports247_positions` / `sports247Positions` | `recruiting_positions` / `recruitingPositions` |
| `sports247_rankings` / `sports247Rankings` | `recruiting_rankings` / `recruitingRankings` |
| `sports247_rankings_composite_team_feed` / `sports247RankingsCompositeTeamFeed` | `recruiting_rankings_composite_team_feed` / `recruitingRankingsCompositeTeamFeed` |
| `sports247_rankings_transfer_portal_player_feed` / `sports247RankingsTransferPortalPlayerFeed` | `recruiting_rankings_transfer_portal_player_feed` / `recruitingRankingsTransferPortalPlayerFeed` |
| `sports247_rankings_transfer_portal_team_feed` / `sports247RankingsTransferPortalTeamFeed` | `recruiting_rankings_transfer_portal_team_feed` / `recruitingRankingsTransferPortalTeamFeed` |
| `sports247_recruits` / `sports247Recruits` | `recruiting_recruits` / `recruitingRecruits` |
| `sports247_sport_years` / `sports247SportYears` | `recruiting_sport_years` / `recruitingSportYears` |
| `sports247_sports` / `sports247Sports` | `recruiting_sports` / `recruitingSports` |
| `sports247_tags_autocomplete` / `sports247TagsAutocomplete` | `recruiting_tags_autocomplete` / `recruitingTagsAutocomplete` |
| `sports247_tags_photos_by_key` / `sports247TagsPhotosByKey` | `recruiting_tags_photos_by_key` / `recruitingTagsPhotosByKey` |
| `sports247_tags_photos_by_type` / `sports247TagsPhotosByType` | `recruiting_tags_photos_by_type` / `recruitingTagsPhotosByType` |
| `sports247_teams` / `sports247Teams` | `recruiting_teams` / `recruitingTeams` |
| `sports247_transfer_player_sport_rankings` / `sports247TransferPlayerSportRankings` | `recruiting_transfer_player_sport_rankings` / `recruitingTransferPlayerSportRankings` |
| `sports247_transfers` / `sports247Transfers` | `recruiting_transfers` / `recruitingTransfers` |
| `sports247_unranked_recruits` / `sports247UnrankedRecruits` | `recruiting_unranked_recruits` / `recruitingUnrankedRecruits` |
| `sports247_unranked_transfers` / `sports247UnrankedTransfers` | `recruiting_unranked_transfers` / `recruitingUnrankedTransfers` |
| `sports247_year` / `sports247Year` | `recruiting_year` / `recruitingYear` |

## `sdv.seriea`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_seriea_athlete_awards` / `espnSerieaAthleteAwards` | `espn_seriea_player_awards` / `espnSerieaPlayerAwards` |
| `espn_seriea_athlete_bio` / `espnSerieaAthleteBio` | `espn_seriea_player_bio` / `espnSerieaPlayerBio` |
| `espn_seriea_athlete_career_stats` / `espnSerieaAthleteCareerStats` | `espn_seriea_player_career_stats` / `espnSerieaPlayerCareerStats` |
| `espn_seriea_athlete_contracts` / `espnSerieaAthleteContracts` | `espn_seriea_player_contracts` / `espnSerieaPlayerContracts` |
| `espn_seriea_athlete_core` / `espnSerieaAthleteCore` | `espn_seriea_player_core` / `espnSerieaPlayerCore` |
| `espn_seriea_athlete_eventlog` / `espnSerieaAthleteEventlog` | `espn_seriea_player_eventlog` / `espnSerieaPlayerEventlog` |
| `espn_seriea_athlete_gamelog` / `espnSerieaAthleteGamelog` | `espn_seriea_player_gamelog` / `espnSerieaPlayerGamelog` |
| `espn_seriea_athlete_info` / `espnSerieaAthleteInfo` | `espn_seriea_player_info` / `espnSerieaPlayerInfo` |
| `espn_seriea_athlete_injuries` / `espnSerieaAthleteInjuries` | `espn_seriea_player_injuries` / `espnSerieaPlayerInjuries` |
| `espn_seriea_athlete_news` / `espnSerieaAthleteNews` | `espn_seriea_player_news` / `espnSerieaPlayerNews` |
| `espn_seriea_athlete_notes` / `espnSerieaAthleteNotes` | `espn_seriea_player_notes` / `espnSerieaPlayerNotes` |
| `espn_seriea_athlete_overview` / `espnSerieaAthleteOverview` | `espn_seriea_player_overview` / `espnSerieaPlayerOverview` |
| `espn_seriea_athlete_records` / `espnSerieaAthleteRecords` | `espn_seriea_player_records` / `espnSerieaPlayerRecords` |
| `espn_seriea_athlete_seasons` / `espnSerieaAthleteSeasons` | `espn_seriea_player_seasons` / `espnSerieaPlayerSeasons` |
| `espn_seriea_athlete_splits` / `espnSerieaAthleteSplits` | `espn_seriea_player_splits` / `espnSerieaPlayerSplits` |
| `espn_seriea_athlete_statisticslog` / `espnSerieaAthleteStatisticslog` | `espn_seriea_player_statisticslog` / `espnSerieaPlayerStatisticslog` |
| `espn_seriea_athlete_stats` / `espnSerieaAthleteStats` | `espn_seriea_player_stats` / `espnSerieaPlayerStats` |
| `espn_seriea_athlete_vs_athlete` / `espnSerieaAthleteVsAthlete` | `espn_seriea_player_vs_player` / `espnSerieaPlayerVsPlayer` |
| `espn_seriea_athletes_index` / `espnSerieaAthletesIndex` | `espn_seriea_players_index` / `espnSerieaPlayersIndex` |
| `espn_seriea_event` / `espnSerieaEvent` | `espn_seriea_game` / `espnSerieaGame` |
| `espn_seriea_event_broadcasts` / `espnSerieaEventBroadcasts` | `espn_seriea_game_broadcasts` / `espnSerieaGameBroadcasts` |
| `espn_seriea_event_competition` / `espnSerieaEventCompetition` | `espn_seriea_game_competition` / `espnSerieaGameCompetition` |
| `espn_seriea_event_competitor` / `espnSerieaEventCompetitor` | `espn_seriea_game_team` / `espnSerieaGameTeam` |
| `espn_seriea_event_competitor_leaders` / `espnSerieaEventCompetitorLeaders` | `espn_seriea_game_team_leaders` / `espnSerieaGameTeamLeaders` |
| `espn_seriea_event_competitor_linescores` / `espnSerieaEventCompetitorLinescores` | `espn_seriea_game_team_linescores` / `espnSerieaGameTeamLinescores` |
| `espn_seriea_event_competitor_record` / `espnSerieaEventCompetitorRecord` | `espn_seriea_game_team_record` / `espnSerieaGameTeamRecord` |
| `espn_seriea_event_competitor_roster` / `espnSerieaEventCompetitorRoster` | `espn_seriea_game_team_roster` / `espnSerieaGameTeamRoster` |
| `espn_seriea_event_competitor_statistics` / `espnSerieaEventCompetitorStatistics` | `espn_seriea_game_team_statistics` / `espnSerieaGameTeamStatistics` |
| `espn_seriea_event_competitors` / `espnSerieaEventCompetitors` | `espn_seriea_game_teams` / `espnSerieaGameTeams` |
| `espn_seriea_event_leaders` / `espnSerieaEventLeaders` | `espn_seriea_game_leaders` / `espnSerieaGameLeaders` |
| `espn_seriea_event_odds` / `espnSerieaEventOdds` | `espn_seriea_game_odds` / `espnSerieaGameOdds` |
| `espn_seriea_event_official_detail` / `espnSerieaEventOfficialDetail` | `espn_seriea_game_official_detail` / `espnSerieaGameOfficialDetail` |
| `espn_seriea_event_officials` / `espnSerieaEventOfficials` | `espn_seriea_game_officials` / `espnSerieaGameOfficials` |
| `espn_seriea_event_play` / `espnSerieaEventPlay` | `espn_seriea_game_play` / `espnSerieaGamePlay` |
| `espn_seriea_event_play_personnel` / `espnSerieaEventPlayPersonnel` | `espn_seriea_game_play_personnel` / `espnSerieaGamePlayPersonnel` |
| `espn_seriea_event_plays` / `espnSerieaEventPlays` | `espn_seriea_game_plays` / `espnSerieaGamePlays` |
| `espn_seriea_event_powerindex` / `espnSerieaEventPowerindex` | `espn_seriea_game_powerindex` / `espnSerieaGamePowerindex` |
| `espn_seriea_event_predictor` / `espnSerieaEventPredictor` | `espn_seriea_game_predictor` / `espnSerieaGamePredictor` |
| `espn_seriea_event_probabilities` / `espnSerieaEventProbabilities` | `espn_seriea_game_probabilities` / `espnSerieaGameProbabilities` |
| `espn_seriea_event_propbets` / `espnSerieaEventPropbets` | `espn_seriea_game_propbets` / `espnSerieaGamePropbets` |
| `espn_seriea_event_scoringplays` / `espnSerieaEventScoringplays` | `espn_seriea_game_scoringplays` / `espnSerieaGameScoringplays` |
| `espn_seriea_event_situation` / `espnSerieaEventSituation` | `espn_seriea_game_situation` / `espnSerieaGameSituation` |
| `espn_seriea_event_status` / `espnSerieaEventStatus` | `espn_seriea_game_status` / `espnSerieaGameStatus` |
| `espn_seriea_events` / `espnSerieaEvents` | `espn_seriea_games` / `espnSerieaGames` |
| `espn_seriea_season_athletes` / `espnSerieaSeasonAthletes` | `espn_seriea_season_players` / `espnSerieaSeasonPlayers` |
| `espn_seriea_season_week_events` / `espnSerieaSeasonWeekEvents` | `espn_seriea_season_week_games` / `espnSerieaSeasonWeekGames` |

## `sdv.soccer`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_soccer_athlete_awards` / `espnSoccerAthleteAwards` | `espn_soccer_player_awards` / `espnSoccerPlayerAwards` |
| `espn_soccer_athlete_bio` / `espnSoccerAthleteBio` | `espn_soccer_player_bio` / `espnSoccerPlayerBio` |
| `espn_soccer_athlete_career_stats` / `espnSoccerAthleteCareerStats` | `espn_soccer_player_career_stats` / `espnSoccerPlayerCareerStats` |
| `espn_soccer_athlete_contracts` / `espnSoccerAthleteContracts` | `espn_soccer_player_contracts` / `espnSoccerPlayerContracts` |
| `espn_soccer_athlete_core` / `espnSoccerAthleteCore` | `espn_soccer_player_core` / `espnSoccerPlayerCore` |
| `espn_soccer_athlete_eventlog` / `espnSoccerAthleteEventlog` | `espn_soccer_player_eventlog` / `espnSoccerPlayerEventlog` |
| `espn_soccer_athlete_gamelog` / `espnSoccerAthleteGamelog` | `espn_soccer_player_gamelog` / `espnSoccerPlayerGamelog` |
| `espn_soccer_athlete_info` / `espnSoccerAthleteInfo` | `espn_soccer_player_info` / `espnSoccerPlayerInfo` |
| `espn_soccer_athlete_injuries` / `espnSoccerAthleteInjuries` | `espn_soccer_player_injuries` / `espnSoccerPlayerInjuries` |
| `espn_soccer_athlete_news` / `espnSoccerAthleteNews` | `espn_soccer_player_news` / `espnSoccerPlayerNews` |
| `espn_soccer_athlete_notes` / `espnSoccerAthleteNotes` | `espn_soccer_player_notes` / `espnSoccerPlayerNotes` |
| `espn_soccer_athlete_overview` / `espnSoccerAthleteOverview` | `espn_soccer_player_overview` / `espnSoccerPlayerOverview` |
| `espn_soccer_athlete_records` / `espnSoccerAthleteRecords` | `espn_soccer_player_records` / `espnSoccerPlayerRecords` |
| `espn_soccer_athlete_seasons` / `espnSoccerAthleteSeasons` | `espn_soccer_player_seasons` / `espnSoccerPlayerSeasons` |
| `espn_soccer_athlete_splits` / `espnSoccerAthleteSplits` | `espn_soccer_player_splits` / `espnSoccerPlayerSplits` |
| `espn_soccer_athlete_statisticslog` / `espnSoccerAthleteStatisticslog` | `espn_soccer_player_statisticslog` / `espnSoccerPlayerStatisticslog` |
| `espn_soccer_athlete_stats` / `espnSoccerAthleteStats` | `espn_soccer_player_stats` / `espnSoccerPlayerStats` |
| `espn_soccer_athlete_vs_athlete` / `espnSoccerAthleteVsAthlete` | `espn_soccer_player_vs_player` / `espnSoccerPlayerVsPlayer` |
| `espn_soccer_athletes_index` / `espnSoccerAthletesIndex` | `espn_soccer_players_index` / `espnSoccerPlayersIndex` |
| `espn_soccer_event` / `espnSoccerEvent` | `espn_soccer_game` / `espnSoccerGame` |
| `espn_soccer_event_broadcasts` / `espnSoccerEventBroadcasts` | `espn_soccer_game_broadcasts` / `espnSoccerGameBroadcasts` |
| `espn_soccer_event_competition` / `espnSoccerEventCompetition` | `espn_soccer_game_competition` / `espnSoccerGameCompetition` |
| `espn_soccer_event_competitor` / `espnSoccerEventCompetitor` | `espn_soccer_game_team` / `espnSoccerGameTeam` |
| `espn_soccer_event_competitor_leaders` / `espnSoccerEventCompetitorLeaders` | `espn_soccer_game_team_leaders` / `espnSoccerGameTeamLeaders` |
| `espn_soccer_event_competitor_linescores` / `espnSoccerEventCompetitorLinescores` | `espn_soccer_game_team_linescores` / `espnSoccerGameTeamLinescores` |
| `espn_soccer_event_competitor_record` / `espnSoccerEventCompetitorRecord` | `espn_soccer_game_team_record` / `espnSoccerGameTeamRecord` |
| `espn_soccer_event_competitor_roster` / `espnSoccerEventCompetitorRoster` | `espn_soccer_game_team_roster` / `espnSoccerGameTeamRoster` |
| `espn_soccer_event_competitor_statistics` / `espnSoccerEventCompetitorStatistics` | `espn_soccer_game_team_statistics` / `espnSoccerGameTeamStatistics` |
| `espn_soccer_event_competitors` / `espnSoccerEventCompetitors` | `espn_soccer_game_teams` / `espnSoccerGameTeams` |
| `espn_soccer_event_leaders` / `espnSoccerEventLeaders` | `espn_soccer_game_leaders` / `espnSoccerGameLeaders` |
| `espn_soccer_event_odds` / `espnSoccerEventOdds` | `espn_soccer_game_odds` / `espnSoccerGameOdds` |
| `espn_soccer_event_official_detail` / `espnSoccerEventOfficialDetail` | `espn_soccer_game_official_detail` / `espnSoccerGameOfficialDetail` |
| `espn_soccer_event_officials` / `espnSoccerEventOfficials` | `espn_soccer_game_officials` / `espnSoccerGameOfficials` |
| `espn_soccer_event_play` / `espnSoccerEventPlay` | `espn_soccer_game_play` / `espnSoccerGamePlay` |
| `espn_soccer_event_play_personnel` / `espnSoccerEventPlayPersonnel` | `espn_soccer_game_play_personnel` / `espnSoccerGamePlayPersonnel` |
| `espn_soccer_event_plays` / `espnSoccerEventPlays` | `espn_soccer_game_plays` / `espnSoccerGamePlays` |
| `espn_soccer_event_powerindex` / `espnSoccerEventPowerindex` | `espn_soccer_game_powerindex` / `espnSoccerGamePowerindex` |
| `espn_soccer_event_predictor` / `espnSoccerEventPredictor` | `espn_soccer_game_predictor` / `espnSoccerGamePredictor` |
| `espn_soccer_event_probabilities` / `espnSoccerEventProbabilities` | `espn_soccer_game_probabilities` / `espnSoccerGameProbabilities` |
| `espn_soccer_event_propbets` / `espnSoccerEventPropbets` | `espn_soccer_game_propbets` / `espnSoccerGamePropbets` |
| `espn_soccer_event_scoringplays` / `espnSoccerEventScoringplays` | `espn_soccer_game_scoringplays` / `espnSoccerGameScoringplays` |
| `espn_soccer_event_situation` / `espnSoccerEventSituation` | `espn_soccer_game_situation` / `espnSoccerGameSituation` |
| `espn_soccer_event_status` / `espnSoccerEventStatus` | `espn_soccer_game_status` / `espnSoccerGameStatus` |
| `espn_soccer_events` / `espnSoccerEvents` | `espn_soccer_games` / `espnSoccerGames` |
| `espn_soccer_season_athletes` / `espnSoccerSeasonAthletes` | `espn_soccer_season_players` / `espnSoccerSeasonPlayers` |
| `espn_soccer_season_week_events` / `espnSoccerSeasonWeekEvents` | `espn_soccer_season_week_games` / `espnSoccerSeasonWeekGames` |

## `sdv.ucl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_ucl_athlete_awards` / `espnUclAthleteAwards` | `espn_ucl_player_awards` / `espnUclPlayerAwards` |
| `espn_ucl_athlete_bio` / `espnUclAthleteBio` | `espn_ucl_player_bio` / `espnUclPlayerBio` |
| `espn_ucl_athlete_career_stats` / `espnUclAthleteCareerStats` | `espn_ucl_player_career_stats` / `espnUclPlayerCareerStats` |
| `espn_ucl_athlete_contracts` / `espnUclAthleteContracts` | `espn_ucl_player_contracts` / `espnUclPlayerContracts` |
| `espn_ucl_athlete_core` / `espnUclAthleteCore` | `espn_ucl_player_core` / `espnUclPlayerCore` |
| `espn_ucl_athlete_eventlog` / `espnUclAthleteEventlog` | `espn_ucl_player_eventlog` / `espnUclPlayerEventlog` |
| `espn_ucl_athlete_gamelog` / `espnUclAthleteGamelog` | `espn_ucl_player_gamelog` / `espnUclPlayerGamelog` |
| `espn_ucl_athlete_info` / `espnUclAthleteInfo` | `espn_ucl_player_info` / `espnUclPlayerInfo` |
| `espn_ucl_athlete_injuries` / `espnUclAthleteInjuries` | `espn_ucl_player_injuries` / `espnUclPlayerInjuries` |
| `espn_ucl_athlete_news` / `espnUclAthleteNews` | `espn_ucl_player_news` / `espnUclPlayerNews` |
| `espn_ucl_athlete_notes` / `espnUclAthleteNotes` | `espn_ucl_player_notes` / `espnUclPlayerNotes` |
| `espn_ucl_athlete_overview` / `espnUclAthleteOverview` | `espn_ucl_player_overview` / `espnUclPlayerOverview` |
| `espn_ucl_athlete_records` / `espnUclAthleteRecords` | `espn_ucl_player_records` / `espnUclPlayerRecords` |
| `espn_ucl_athlete_seasons` / `espnUclAthleteSeasons` | `espn_ucl_player_seasons` / `espnUclPlayerSeasons` |
| `espn_ucl_athlete_splits` / `espnUclAthleteSplits` | `espn_ucl_player_splits` / `espnUclPlayerSplits` |
| `espn_ucl_athlete_statisticslog` / `espnUclAthleteStatisticslog` | `espn_ucl_player_statisticslog` / `espnUclPlayerStatisticslog` |
| `espn_ucl_athlete_stats` / `espnUclAthleteStats` | `espn_ucl_player_stats` / `espnUclPlayerStats` |
| `espn_ucl_athlete_vs_athlete` / `espnUclAthleteVsAthlete` | `espn_ucl_player_vs_player` / `espnUclPlayerVsPlayer` |
| `espn_ucl_athletes_index` / `espnUclAthletesIndex` | `espn_ucl_players_index` / `espnUclPlayersIndex` |
| `espn_ucl_event` / `espnUclEvent` | `espn_ucl_game` / `espnUclGame` |
| `espn_ucl_event_broadcasts` / `espnUclEventBroadcasts` | `espn_ucl_game_broadcasts` / `espnUclGameBroadcasts` |
| `espn_ucl_event_competition` / `espnUclEventCompetition` | `espn_ucl_game_competition` / `espnUclGameCompetition` |
| `espn_ucl_event_competitor` / `espnUclEventCompetitor` | `espn_ucl_game_team` / `espnUclGameTeam` |
| `espn_ucl_event_competitor_leaders` / `espnUclEventCompetitorLeaders` | `espn_ucl_game_team_leaders` / `espnUclGameTeamLeaders` |
| `espn_ucl_event_competitor_linescores` / `espnUclEventCompetitorLinescores` | `espn_ucl_game_team_linescores` / `espnUclGameTeamLinescores` |
| `espn_ucl_event_competitor_record` / `espnUclEventCompetitorRecord` | `espn_ucl_game_team_record` / `espnUclGameTeamRecord` |
| `espn_ucl_event_competitor_roster` / `espnUclEventCompetitorRoster` | `espn_ucl_game_team_roster` / `espnUclGameTeamRoster` |
| `espn_ucl_event_competitor_statistics` / `espnUclEventCompetitorStatistics` | `espn_ucl_game_team_statistics` / `espnUclGameTeamStatistics` |
| `espn_ucl_event_competitors` / `espnUclEventCompetitors` | `espn_ucl_game_teams` / `espnUclGameTeams` |
| `espn_ucl_event_leaders` / `espnUclEventLeaders` | `espn_ucl_game_leaders` / `espnUclGameLeaders` |
| `espn_ucl_event_odds` / `espnUclEventOdds` | `espn_ucl_game_odds` / `espnUclGameOdds` |
| `espn_ucl_event_official_detail` / `espnUclEventOfficialDetail` | `espn_ucl_game_official_detail` / `espnUclGameOfficialDetail` |
| `espn_ucl_event_officials` / `espnUclEventOfficials` | `espn_ucl_game_officials` / `espnUclGameOfficials` |
| `espn_ucl_event_play` / `espnUclEventPlay` | `espn_ucl_game_play` / `espnUclGamePlay` |
| `espn_ucl_event_play_personnel` / `espnUclEventPlayPersonnel` | `espn_ucl_game_play_personnel` / `espnUclGamePlayPersonnel` |
| `espn_ucl_event_plays` / `espnUclEventPlays` | `espn_ucl_game_plays` / `espnUclGamePlays` |
| `espn_ucl_event_powerindex` / `espnUclEventPowerindex` | `espn_ucl_game_powerindex` / `espnUclGamePowerindex` |
| `espn_ucl_event_predictor` / `espnUclEventPredictor` | `espn_ucl_game_predictor` / `espnUclGamePredictor` |
| `espn_ucl_event_probabilities` / `espnUclEventProbabilities` | `espn_ucl_game_probabilities` / `espnUclGameProbabilities` |
| `espn_ucl_event_propbets` / `espnUclEventPropbets` | `espn_ucl_game_propbets` / `espnUclGamePropbets` |
| `espn_ucl_event_scoringplays` / `espnUclEventScoringplays` | `espn_ucl_game_scoringplays` / `espnUclGameScoringplays` |
| `espn_ucl_event_situation` / `espnUclEventSituation` | `espn_ucl_game_situation` / `espnUclGameSituation` |
| `espn_ucl_event_status` / `espnUclEventStatus` | `espn_ucl_game_status` / `espnUclGameStatus` |
| `espn_ucl_events` / `espnUclEvents` | `espn_ucl_games` / `espnUclGames` |
| `espn_ucl_season_athletes` / `espnUclSeasonAthletes` | `espn_ucl_season_players` / `espnUclSeasonPlayers` |
| `espn_ucl_season_week_events` / `espnUclSeasonWeekEvents` | `espn_ucl_season_week_games` / `espnUclSeasonWeekGames` |

## `sdv.uel`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_uel_athlete_awards` / `espnUelAthleteAwards` | `espn_uel_player_awards` / `espnUelPlayerAwards` |
| `espn_uel_athlete_bio` / `espnUelAthleteBio` | `espn_uel_player_bio` / `espnUelPlayerBio` |
| `espn_uel_athlete_career_stats` / `espnUelAthleteCareerStats` | `espn_uel_player_career_stats` / `espnUelPlayerCareerStats` |
| `espn_uel_athlete_contracts` / `espnUelAthleteContracts` | `espn_uel_player_contracts` / `espnUelPlayerContracts` |
| `espn_uel_athlete_core` / `espnUelAthleteCore` | `espn_uel_player_core` / `espnUelPlayerCore` |
| `espn_uel_athlete_eventlog` / `espnUelAthleteEventlog` | `espn_uel_player_eventlog` / `espnUelPlayerEventlog` |
| `espn_uel_athlete_gamelog` / `espnUelAthleteGamelog` | `espn_uel_player_gamelog` / `espnUelPlayerGamelog` |
| `espn_uel_athlete_info` / `espnUelAthleteInfo` | `espn_uel_player_info` / `espnUelPlayerInfo` |
| `espn_uel_athlete_injuries` / `espnUelAthleteInjuries` | `espn_uel_player_injuries` / `espnUelPlayerInjuries` |
| `espn_uel_athlete_news` / `espnUelAthleteNews` | `espn_uel_player_news` / `espnUelPlayerNews` |
| `espn_uel_athlete_notes` / `espnUelAthleteNotes` | `espn_uel_player_notes` / `espnUelPlayerNotes` |
| `espn_uel_athlete_overview` / `espnUelAthleteOverview` | `espn_uel_player_overview` / `espnUelPlayerOverview` |
| `espn_uel_athlete_records` / `espnUelAthleteRecords` | `espn_uel_player_records` / `espnUelPlayerRecords` |
| `espn_uel_athlete_seasons` / `espnUelAthleteSeasons` | `espn_uel_player_seasons` / `espnUelPlayerSeasons` |
| `espn_uel_athlete_splits` / `espnUelAthleteSplits` | `espn_uel_player_splits` / `espnUelPlayerSplits` |
| `espn_uel_athlete_statisticslog` / `espnUelAthleteStatisticslog` | `espn_uel_player_statisticslog` / `espnUelPlayerStatisticslog` |
| `espn_uel_athlete_stats` / `espnUelAthleteStats` | `espn_uel_player_stats` / `espnUelPlayerStats` |
| `espn_uel_athlete_vs_athlete` / `espnUelAthleteVsAthlete` | `espn_uel_player_vs_player` / `espnUelPlayerVsPlayer` |
| `espn_uel_athletes_index` / `espnUelAthletesIndex` | `espn_uel_players_index` / `espnUelPlayersIndex` |
| `espn_uel_event` / `espnUelEvent` | `espn_uel_game` / `espnUelGame` |
| `espn_uel_event_broadcasts` / `espnUelEventBroadcasts` | `espn_uel_game_broadcasts` / `espnUelGameBroadcasts` |
| `espn_uel_event_competition` / `espnUelEventCompetition` | `espn_uel_game_competition` / `espnUelGameCompetition` |
| `espn_uel_event_competitor` / `espnUelEventCompetitor` | `espn_uel_game_team` / `espnUelGameTeam` |
| `espn_uel_event_competitor_leaders` / `espnUelEventCompetitorLeaders` | `espn_uel_game_team_leaders` / `espnUelGameTeamLeaders` |
| `espn_uel_event_competitor_linescores` / `espnUelEventCompetitorLinescores` | `espn_uel_game_team_linescores` / `espnUelGameTeamLinescores` |
| `espn_uel_event_competitor_record` / `espnUelEventCompetitorRecord` | `espn_uel_game_team_record` / `espnUelGameTeamRecord` |
| `espn_uel_event_competitor_roster` / `espnUelEventCompetitorRoster` | `espn_uel_game_team_roster` / `espnUelGameTeamRoster` |
| `espn_uel_event_competitor_statistics` / `espnUelEventCompetitorStatistics` | `espn_uel_game_team_statistics` / `espnUelGameTeamStatistics` |
| `espn_uel_event_competitors` / `espnUelEventCompetitors` | `espn_uel_game_teams` / `espnUelGameTeams` |
| `espn_uel_event_leaders` / `espnUelEventLeaders` | `espn_uel_game_leaders` / `espnUelGameLeaders` |
| `espn_uel_event_odds` / `espnUelEventOdds` | `espn_uel_game_odds` / `espnUelGameOdds` |
| `espn_uel_event_official_detail` / `espnUelEventOfficialDetail` | `espn_uel_game_official_detail` / `espnUelGameOfficialDetail` |
| `espn_uel_event_officials` / `espnUelEventOfficials` | `espn_uel_game_officials` / `espnUelGameOfficials` |
| `espn_uel_event_play` / `espnUelEventPlay` | `espn_uel_game_play` / `espnUelGamePlay` |
| `espn_uel_event_play_personnel` / `espnUelEventPlayPersonnel` | `espn_uel_game_play_personnel` / `espnUelGamePlayPersonnel` |
| `espn_uel_event_plays` / `espnUelEventPlays` | `espn_uel_game_plays` / `espnUelGamePlays` |
| `espn_uel_event_powerindex` / `espnUelEventPowerindex` | `espn_uel_game_powerindex` / `espnUelGamePowerindex` |
| `espn_uel_event_predictor` / `espnUelEventPredictor` | `espn_uel_game_predictor` / `espnUelGamePredictor` |
| `espn_uel_event_probabilities` / `espnUelEventProbabilities` | `espn_uel_game_probabilities` / `espnUelGameProbabilities` |
| `espn_uel_event_propbets` / `espnUelEventPropbets` | `espn_uel_game_propbets` / `espnUelGamePropbets` |
| `espn_uel_event_scoringplays` / `espnUelEventScoringplays` | `espn_uel_game_scoringplays` / `espnUelGameScoringplays` |
| `espn_uel_event_situation` / `espnUelEventSituation` | `espn_uel_game_situation` / `espnUelGameSituation` |
| `espn_uel_event_status` / `espnUelEventStatus` | `espn_uel_game_status` / `espnUelGameStatus` |
| `espn_uel_events` / `espnUelEvents` | `espn_uel_games` / `espnUelGames` |
| `espn_uel_season_athletes` / `espnUelSeasonAthletes` | `espn_uel_season_players` / `espnUelSeasonPlayers` |
| `espn_uel_season_week_events` / `espnUelSeasonWeekEvents` | `espn_uel_season_week_games` / `espnUelSeasonWeekGames` |

## `sdv.ufl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_ufl_athlete_awards` / `espnUflAthleteAwards` | `espn_ufl_player_awards` / `espnUflPlayerAwards` |
| `espn_ufl_athlete_bio` / `espnUflAthleteBio` | `espn_ufl_player_bio` / `espnUflPlayerBio` |
| `espn_ufl_athlete_career_stats` / `espnUflAthleteCareerStats` | `espn_ufl_player_career_stats` / `espnUflPlayerCareerStats` |
| `espn_ufl_athlete_contracts` / `espnUflAthleteContracts` | `espn_ufl_player_contracts` / `espnUflPlayerContracts` |
| `espn_ufl_athlete_core` / `espnUflAthleteCore` | `espn_ufl_player_core` / `espnUflPlayerCore` |
| `espn_ufl_athlete_eventlog` / `espnUflAthleteEventlog` | `espn_ufl_player_eventlog` / `espnUflPlayerEventlog` |
| `espn_ufl_athlete_gamelog` / `espnUflAthleteGamelog` | `espn_ufl_player_gamelog` / `espnUflPlayerGamelog` |
| `espn_ufl_athlete_info` / `espnUflAthleteInfo` | `espn_ufl_player_info` / `espnUflPlayerInfo` |
| `espn_ufl_athlete_injuries` / `espnUflAthleteInjuries` | `espn_ufl_player_injuries` / `espnUflPlayerInjuries` |
| `espn_ufl_athlete_news` / `espnUflAthleteNews` | `espn_ufl_player_news` / `espnUflPlayerNews` |
| `espn_ufl_athlete_notes` / `espnUflAthleteNotes` | `espn_ufl_player_notes` / `espnUflPlayerNotes` |
| `espn_ufl_athlete_overview` / `espnUflAthleteOverview` | `espn_ufl_player_overview` / `espnUflPlayerOverview` |
| `espn_ufl_athlete_records` / `espnUflAthleteRecords` | `espn_ufl_player_records` / `espnUflPlayerRecords` |
| `espn_ufl_athlete_seasons` / `espnUflAthleteSeasons` | `espn_ufl_player_seasons` / `espnUflPlayerSeasons` |
| `espn_ufl_athlete_splits` / `espnUflAthleteSplits` | `espn_ufl_player_splits` / `espnUflPlayerSplits` |
| `espn_ufl_athlete_statisticslog` / `espnUflAthleteStatisticslog` | `espn_ufl_player_statisticslog` / `espnUflPlayerStatisticslog` |
| `espn_ufl_athlete_stats` / `espnUflAthleteStats` | `espn_ufl_player_stats` / `espnUflPlayerStats` |
| `espn_ufl_athlete_vs_athlete` / `espnUflAthleteVsAthlete` | `espn_ufl_player_vs_player` / `espnUflPlayerVsPlayer` |
| `espn_ufl_athletes_index` / `espnUflAthletesIndex` | `espn_ufl_players_index` / `espnUflPlayersIndex` |
| `espn_ufl_event` / `espnUflEvent` | `espn_ufl_game` / `espnUflGame` |
| `espn_ufl_event_broadcasts` / `espnUflEventBroadcasts` | `espn_ufl_game_broadcasts` / `espnUflGameBroadcasts` |
| `espn_ufl_event_competition` / `espnUflEventCompetition` | `espn_ufl_game_competition` / `espnUflGameCompetition` |
| `espn_ufl_event_competitor` / `espnUflEventCompetitor` | `espn_ufl_game_team` / `espnUflGameTeam` |
| `espn_ufl_event_competitor_leaders` / `espnUflEventCompetitorLeaders` | `espn_ufl_game_team_leaders` / `espnUflGameTeamLeaders` |
| `espn_ufl_event_competitor_linescores` / `espnUflEventCompetitorLinescores` | `espn_ufl_game_team_linescores` / `espnUflGameTeamLinescores` |
| `espn_ufl_event_competitor_record` / `espnUflEventCompetitorRecord` | `espn_ufl_game_team_record` / `espnUflGameTeamRecord` |
| `espn_ufl_event_competitor_roster` / `espnUflEventCompetitorRoster` | `espn_ufl_game_team_roster` / `espnUflGameTeamRoster` |
| `espn_ufl_event_competitor_statistics` / `espnUflEventCompetitorStatistics` | `espn_ufl_game_team_statistics` / `espnUflGameTeamStatistics` |
| `espn_ufl_event_competitors` / `espnUflEventCompetitors` | `espn_ufl_game_teams` / `espnUflGameTeams` |
| `espn_ufl_event_leaders` / `espnUflEventLeaders` | `espn_ufl_game_leaders` / `espnUflGameLeaders` |
| `espn_ufl_event_odds` / `espnUflEventOdds` | `espn_ufl_game_odds` / `espnUflGameOdds` |
| `espn_ufl_event_official_detail` / `espnUflEventOfficialDetail` | `espn_ufl_game_official_detail` / `espnUflGameOfficialDetail` |
| `espn_ufl_event_officials` / `espnUflEventOfficials` | `espn_ufl_game_officials` / `espnUflGameOfficials` |
| `espn_ufl_event_play` / `espnUflEventPlay` | `espn_ufl_game_play` / `espnUflGamePlay` |
| `espn_ufl_event_play_personnel` / `espnUflEventPlayPersonnel` | `espn_ufl_game_play_personnel` / `espnUflGamePlayPersonnel` |
| `espn_ufl_event_plays` / `espnUflEventPlays` | `espn_ufl_game_plays` / `espnUflGamePlays` |
| `espn_ufl_event_powerindex` / `espnUflEventPowerindex` | `espn_ufl_game_powerindex` / `espnUflGamePowerindex` |
| `espn_ufl_event_predictor` / `espnUflEventPredictor` | `espn_ufl_game_predictor` / `espnUflGamePredictor` |
| `espn_ufl_event_probabilities` / `espnUflEventProbabilities` | `espn_ufl_game_probabilities` / `espnUflGameProbabilities` |
| `espn_ufl_event_propbets` / `espnUflEventPropbets` | `espn_ufl_game_propbets` / `espnUflGamePropbets` |
| `espn_ufl_event_scoringplays` / `espnUflEventScoringplays` | `espn_ufl_game_scoringplays` / `espnUflGameScoringplays` |
| `espn_ufl_event_situation` / `espnUflEventSituation` | `espn_ufl_game_situation` / `espnUflGameSituation` |
| `espn_ufl_event_status` / `espnUflEventStatus` | `espn_ufl_game_status` / `espnUflGameStatus` |
| `espn_ufl_events` / `espnUflEvents` | `espn_ufl_games` / `espnUflGames` |
| `espn_ufl_season_athletes` / `espnUflSeasonAthletes` | `espn_ufl_season_players` / `espnUflSeasonPlayers` |
| `espn_ufl_season_week_events` / `espnUflSeasonWeekEvents` | `espn_ufl_season_week_games` / `espnUflSeasonWeekGames` |

## `sdv.wbb`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_wbb_athlete_awards` / `espnWbbAthleteAwards` | `espn_wbb_player_awards` / `espnWbbPlayerAwards` |
| `espn_wbb_athlete_bio` / `espnWbbAthleteBio` | `espn_wbb_player_bio` / `espnWbbPlayerBio` |
| `espn_wbb_athlete_career_stats` / `espnWbbAthleteCareerStats` | `espn_wbb_player_career_stats` / `espnWbbPlayerCareerStats` |
| `espn_wbb_athlete_contracts` / `espnWbbAthleteContracts` | `espn_wbb_player_contracts` / `espnWbbPlayerContracts` |
| `espn_wbb_athlete_core` / `espnWbbAthleteCore` | `espn_wbb_player_core` / `espnWbbPlayerCore` |
| `espn_wbb_athlete_eventlog` / `espnWbbAthleteEventlog` | `espn_wbb_player_eventlog` / `espnWbbPlayerEventlog` |
| `espn_wbb_athlete_gamelog` / `espnWbbAthleteGamelog` | `espn_wbb_player_gamelog` / `espnWbbPlayerGamelog` |
| `espn_wbb_athlete_info` / `espnWbbAthleteInfo` | `espn_wbb_player_info` / `espnWbbPlayerInfo` |
| `espn_wbb_athlete_injuries` / `espnWbbAthleteInjuries` | `espn_wbb_player_injuries` / `espnWbbPlayerInjuries` |
| `espn_wbb_athlete_news` / `espnWbbAthleteNews` | `espn_wbb_player_news` / `espnWbbPlayerNews` |
| `espn_wbb_athlete_notes` / `espnWbbAthleteNotes` | `espn_wbb_player_notes` / `espnWbbPlayerNotes` |
| `espn_wbb_athlete_overview` / `espnWbbAthleteOverview` | `espn_wbb_player_overview` / `espnWbbPlayerOverview` |
| `espn_wbb_athlete_records` / `espnWbbAthleteRecords` | `espn_wbb_player_records` / `espnWbbPlayerRecords` |
| `espn_wbb_athlete_seasons` / `espnWbbAthleteSeasons` | `espn_wbb_player_seasons` / `espnWbbPlayerSeasons` |
| `espn_wbb_athlete_splits` / `espnWbbAthleteSplits` | `espn_wbb_player_splits` / `espnWbbPlayerSplits` |
| `espn_wbb_athlete_statisticslog` / `espnWbbAthleteStatisticslog` | `espn_wbb_player_statisticslog` / `espnWbbPlayerStatisticslog` |
| `espn_wbb_athlete_stats` / `espnWbbAthleteStats` | `espn_wbb_player_stats_v3` / `espnWbbPlayerStatsV3` |
| `espn_wbb_athlete_vs_athlete` / `espnWbbAthleteVsAthlete` | `espn_wbb_player_vs_player` / `espnWbbPlayerVsPlayer` |
| `espn_wbb_athletes_index` / `espnWbbAthletesIndex` | `espn_wbb_players_index` / `espnWbbPlayersIndex` |
| `espn_wbb_event` / `espnWbbEvent` | `espn_wbb_game` / `espnWbbGame` |
| `espn_wbb_event_broadcasts` / `espnWbbEventBroadcasts` | `espn_wbb_game_broadcasts` / `espnWbbGameBroadcasts` |
| `espn_wbb_event_competition` / `espnWbbEventCompetition` | `espn_wbb_game_competition` / `espnWbbGameCompetition` |
| `espn_wbb_event_competitor` / `espnWbbEventCompetitor` | `espn_wbb_game_team` / `espnWbbGameTeam` |
| `espn_wbb_event_competitor_leaders` / `espnWbbEventCompetitorLeaders` | `espn_wbb_game_team_leaders` / `espnWbbGameTeamLeaders` |
| `espn_wbb_event_competitor_linescores` / `espnWbbEventCompetitorLinescores` | `espn_wbb_game_team_linescores` / `espnWbbGameTeamLinescores` |
| `espn_wbb_event_competitor_record` / `espnWbbEventCompetitorRecord` | `espn_wbb_game_team_record` / `espnWbbGameTeamRecord` |
| `espn_wbb_event_competitor_roster` / `espnWbbEventCompetitorRoster` | `espn_wbb_game_team_roster` / `espnWbbGameTeamRoster` |
| `espn_wbb_event_competitor_statistics` / `espnWbbEventCompetitorStatistics` | `espn_wbb_game_team_statistics` / `espnWbbGameTeamStatistics` |
| `espn_wbb_event_competitors` / `espnWbbEventCompetitors` | `espn_wbb_game_teams` / `espnWbbGameTeams` |
| `espn_wbb_event_leaders` / `espnWbbEventLeaders` | `espn_wbb_game_leaders` / `espnWbbGameLeaders` |
| `espn_wbb_event_odds` / `espnWbbEventOdds` | `espn_wbb_game_odds` / `espnWbbGameOdds` |
| `espn_wbb_event_official_detail` / `espnWbbEventOfficialDetail` | `espn_wbb_game_official_detail` / `espnWbbGameOfficialDetail` |
| `espn_wbb_event_officials` / `espnWbbEventOfficials` | `espn_wbb_game_officials` / `espnWbbGameOfficials` |
| `espn_wbb_event_play` / `espnWbbEventPlay` | `espn_wbb_game_play` / `espnWbbGamePlay` |
| `espn_wbb_event_play_personnel` / `espnWbbEventPlayPersonnel` | `espn_wbb_game_play_personnel` / `espnWbbGamePlayPersonnel` |
| `espn_wbb_event_plays` / `espnWbbEventPlays` | `espn_wbb_game_plays` / `espnWbbGamePlays` |
| `espn_wbb_event_powerindex` / `espnWbbEventPowerindex` | `espn_wbb_game_powerindex` / `espnWbbGamePowerindex` |
| `espn_wbb_event_predictor` / `espnWbbEventPredictor` | `espn_wbb_game_predictor` / `espnWbbGamePredictor` |
| `espn_wbb_event_probabilities` / `espnWbbEventProbabilities` | `espn_wbb_game_probabilities` / `espnWbbGameProbabilities` |
| `espn_wbb_event_propbets` / `espnWbbEventPropbets` | `espn_wbb_game_propbets` / `espnWbbGamePropbets` |
| `espn_wbb_event_scoringplays` / `espnWbbEventScoringplays` | `espn_wbb_game_scoringplays` / `espnWbbGameScoringplays` |
| `espn_wbb_event_situation` / `espnWbbEventSituation` | `espn_wbb_game_situation` / `espnWbbGameSituation` |
| `espn_wbb_event_status` / `espnWbbEventStatus` | `espn_wbb_game_status` / `espnWbbGameStatus` |
| `espn_wbb_events` / `espnWbbEvents` | `espn_wbb_games` / `espnWbbGames` |
| `espn_wbb_recruiting_athletes` / `espnWbbRecruitingAthletes` | `espn_wbb_recruiting_players` / `espnWbbRecruitingPlayers` |
| `espn_wbb_season_athletes` / `espnWbbSeasonAthletes` | `espn_wbb_season_players` / `espnWbbSeasonPlayers` |
| `espn_wbb_season_week_events` / `espnWbbSeasonWeekEvents` | `espn_wbb_season_week_games` / `espnWbbSeasonWeekGames` |

## `sdv.wc`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_wc_athlete_awards` / `espnWcAthleteAwards` | `espn_wc_player_awards` / `espnWcPlayerAwards` |
| `espn_wc_athlete_bio` / `espnWcAthleteBio` | `espn_wc_player_bio` / `espnWcPlayerBio` |
| `espn_wc_athlete_career_stats` / `espnWcAthleteCareerStats` | `espn_wc_player_career_stats` / `espnWcPlayerCareerStats` |
| `espn_wc_athlete_contracts` / `espnWcAthleteContracts` | `espn_wc_player_contracts` / `espnWcPlayerContracts` |
| `espn_wc_athlete_core` / `espnWcAthleteCore` | `espn_wc_player_core` / `espnWcPlayerCore` |
| `espn_wc_athlete_eventlog` / `espnWcAthleteEventlog` | `espn_wc_player_eventlog` / `espnWcPlayerEventlog` |
| `espn_wc_athlete_gamelog` / `espnWcAthleteGamelog` | `espn_wc_player_gamelog` / `espnWcPlayerGamelog` |
| `espn_wc_athlete_info` / `espnWcAthleteInfo` | `espn_wc_player_info` / `espnWcPlayerInfo` |
| `espn_wc_athlete_injuries` / `espnWcAthleteInjuries` | `espn_wc_player_injuries` / `espnWcPlayerInjuries` |
| `espn_wc_athlete_news` / `espnWcAthleteNews` | `espn_wc_player_news` / `espnWcPlayerNews` |
| `espn_wc_athlete_notes` / `espnWcAthleteNotes` | `espn_wc_player_notes` / `espnWcPlayerNotes` |
| `espn_wc_athlete_overview` / `espnWcAthleteOverview` | `espn_wc_player_overview` / `espnWcPlayerOverview` |
| `espn_wc_athlete_records` / `espnWcAthleteRecords` | `espn_wc_player_records` / `espnWcPlayerRecords` |
| `espn_wc_athlete_seasons` / `espnWcAthleteSeasons` | `espn_wc_player_seasons` / `espnWcPlayerSeasons` |
| `espn_wc_athlete_splits` / `espnWcAthleteSplits` | `espn_wc_player_splits` / `espnWcPlayerSplits` |
| `espn_wc_athlete_statisticslog` / `espnWcAthleteStatisticslog` | `espn_wc_player_statisticslog` / `espnWcPlayerStatisticslog` |
| `espn_wc_athlete_stats` / `espnWcAthleteStats` | `espn_wc_player_stats` / `espnWcPlayerStats` |
| `espn_wc_athlete_vs_athlete` / `espnWcAthleteVsAthlete` | `espn_wc_player_vs_player` / `espnWcPlayerVsPlayer` |
| `espn_wc_athletes_index` / `espnWcAthletesIndex` | `espn_wc_players_index` / `espnWcPlayersIndex` |
| `espn_wc_event` / `espnWcEvent` | `espn_wc_game` / `espnWcGame` |
| `espn_wc_event_broadcasts` / `espnWcEventBroadcasts` | `espn_wc_game_broadcasts` / `espnWcGameBroadcasts` |
| `espn_wc_event_competition` / `espnWcEventCompetition` | `espn_wc_game_competition` / `espnWcGameCompetition` |
| `espn_wc_event_competitor` / `espnWcEventCompetitor` | `espn_wc_game_team` / `espnWcGameTeam` |
| `espn_wc_event_competitor_leaders` / `espnWcEventCompetitorLeaders` | `espn_wc_game_team_leaders` / `espnWcGameTeamLeaders` |
| `espn_wc_event_competitor_linescores` / `espnWcEventCompetitorLinescores` | `espn_wc_game_team_linescores` / `espnWcGameTeamLinescores` |
| `espn_wc_event_competitor_record` / `espnWcEventCompetitorRecord` | `espn_wc_game_team_record` / `espnWcGameTeamRecord` |
| `espn_wc_event_competitor_roster` / `espnWcEventCompetitorRoster` | `espn_wc_game_team_roster` / `espnWcGameTeamRoster` |
| `espn_wc_event_competitor_statistics` / `espnWcEventCompetitorStatistics` | `espn_wc_game_team_statistics` / `espnWcGameTeamStatistics` |
| `espn_wc_event_competitors` / `espnWcEventCompetitors` | `espn_wc_game_teams` / `espnWcGameTeams` |
| `espn_wc_event_leaders` / `espnWcEventLeaders` | `espn_wc_game_leaders` / `espnWcGameLeaders` |
| `espn_wc_event_odds` / `espnWcEventOdds` | `espn_wc_game_odds` / `espnWcGameOdds` |
| `espn_wc_event_official_detail` / `espnWcEventOfficialDetail` | `espn_wc_game_official_detail` / `espnWcGameOfficialDetail` |
| `espn_wc_event_officials` / `espnWcEventOfficials` | `espn_wc_game_officials` / `espnWcGameOfficials` |
| `espn_wc_event_play` / `espnWcEventPlay` | `espn_wc_game_play` / `espnWcGamePlay` |
| `espn_wc_event_play_personnel` / `espnWcEventPlayPersonnel` | `espn_wc_game_play_personnel` / `espnWcGamePlayPersonnel` |
| `espn_wc_event_plays` / `espnWcEventPlays` | `espn_wc_game_plays` / `espnWcGamePlays` |
| `espn_wc_event_powerindex` / `espnWcEventPowerindex` | `espn_wc_game_powerindex` / `espnWcGamePowerindex` |
| `espn_wc_event_predictor` / `espnWcEventPredictor` | `espn_wc_game_predictor` / `espnWcGamePredictor` |
| `espn_wc_event_probabilities` / `espnWcEventProbabilities` | `espn_wc_game_probabilities` / `espnWcGameProbabilities` |
| `espn_wc_event_propbets` / `espnWcEventPropbets` | `espn_wc_game_propbets` / `espnWcGamePropbets` |
| `espn_wc_event_scoringplays` / `espnWcEventScoringplays` | `espn_wc_game_scoringplays` / `espnWcGameScoringplays` |
| `espn_wc_event_situation` / `espnWcEventSituation` | `espn_wc_game_situation` / `espnWcGameSituation` |
| `espn_wc_event_status` / `espnWcEventStatus` | `espn_wc_game_status` / `espnWcGameStatus` |
| `espn_wc_events` / `espnWcEvents` | `espn_wc_games` / `espnWcGames` |
| `espn_wc_season_athletes` / `espnWcSeasonAthletes` | `espn_wc_season_players` / `espnWcSeasonPlayers` |
| `espn_wc_season_week_events` / `espnWcSeasonWeekEvents` | `espn_wc_season_week_games` / `espnWcSeasonWeekGames` |

## `sdv.wch`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_wch_athlete_awards` / `espnWchAthleteAwards` | `espn_wch_player_awards` / `espnWchPlayerAwards` |
| `espn_wch_athlete_bio` / `espnWchAthleteBio` | `espn_wch_player_bio` / `espnWchPlayerBio` |
| `espn_wch_athlete_career_stats` / `espnWchAthleteCareerStats` | `espn_wch_player_career_stats` / `espnWchPlayerCareerStats` |
| `espn_wch_athlete_contracts` / `espnWchAthleteContracts` | `espn_wch_player_contracts` / `espnWchPlayerContracts` |
| `espn_wch_athlete_core` / `espnWchAthleteCore` | `espn_wch_player_core` / `espnWchPlayerCore` |
| `espn_wch_athlete_eventlog` / `espnWchAthleteEventlog` | `espn_wch_player_eventlog` / `espnWchPlayerEventlog` |
| `espn_wch_athlete_gamelog` / `espnWchAthleteGamelog` | `espn_wch_player_gamelog` / `espnWchPlayerGamelog` |
| `espn_wch_athlete_info` / `espnWchAthleteInfo` | `espn_wch_player_info` / `espnWchPlayerInfo` |
| `espn_wch_athlete_injuries` / `espnWchAthleteInjuries` | `espn_wch_player_injuries` / `espnWchPlayerInjuries` |
| `espn_wch_athlete_news` / `espnWchAthleteNews` | `espn_wch_player_news` / `espnWchPlayerNews` |
| `espn_wch_athlete_notes` / `espnWchAthleteNotes` | `espn_wch_player_notes` / `espnWchPlayerNotes` |
| `espn_wch_athlete_overview` / `espnWchAthleteOverview` | `espn_wch_player_overview` / `espnWchPlayerOverview` |
| `espn_wch_athlete_records` / `espnWchAthleteRecords` | `espn_wch_player_records` / `espnWchPlayerRecords` |
| `espn_wch_athlete_seasons` / `espnWchAthleteSeasons` | `espn_wch_player_seasons` / `espnWchPlayerSeasons` |
| `espn_wch_athlete_splits` / `espnWchAthleteSplits` | `espn_wch_player_splits` / `espnWchPlayerSplits` |
| `espn_wch_athlete_statisticslog` / `espnWchAthleteStatisticslog` | `espn_wch_player_statisticslog` / `espnWchPlayerStatisticslog` |
| `espn_wch_athlete_stats` / `espnWchAthleteStats` | `espn_wch_player_stats` / `espnWchPlayerStats` |
| `espn_wch_athlete_vs_athlete` / `espnWchAthleteVsAthlete` | `espn_wch_player_vs_player` / `espnWchPlayerVsPlayer` |
| `espn_wch_athletes_index` / `espnWchAthletesIndex` | `espn_wch_players_index` / `espnWchPlayersIndex` |
| `espn_wch_event` / `espnWchEvent` | `espn_wch_game` / `espnWchGame` |
| `espn_wch_event_broadcasts` / `espnWchEventBroadcasts` | `espn_wch_game_broadcasts` / `espnWchGameBroadcasts` |
| `espn_wch_event_competition` / `espnWchEventCompetition` | `espn_wch_game_competition` / `espnWchGameCompetition` |
| `espn_wch_event_competitor` / `espnWchEventCompetitor` | `espn_wch_game_team` / `espnWchGameTeam` |
| `espn_wch_event_competitor_leaders` / `espnWchEventCompetitorLeaders` | `espn_wch_game_team_leaders` / `espnWchGameTeamLeaders` |
| `espn_wch_event_competitor_linescores` / `espnWchEventCompetitorLinescores` | `espn_wch_game_team_linescores` / `espnWchGameTeamLinescores` |
| `espn_wch_event_competitor_record` / `espnWchEventCompetitorRecord` | `espn_wch_game_team_record` / `espnWchGameTeamRecord` |
| `espn_wch_event_competitor_roster` / `espnWchEventCompetitorRoster` | `espn_wch_game_team_roster` / `espnWchGameTeamRoster` |
| `espn_wch_event_competitor_statistics` / `espnWchEventCompetitorStatistics` | `espn_wch_game_team_statistics` / `espnWchGameTeamStatistics` |
| `espn_wch_event_competitors` / `espnWchEventCompetitors` | `espn_wch_game_teams` / `espnWchGameTeams` |
| `espn_wch_event_leaders` / `espnWchEventLeaders` | `espn_wch_game_leaders` / `espnWchGameLeaders` |
| `espn_wch_event_odds` / `espnWchEventOdds` | `espn_wch_game_odds` / `espnWchGameOdds` |
| `espn_wch_event_official_detail` / `espnWchEventOfficialDetail` | `espn_wch_game_official_detail` / `espnWchGameOfficialDetail` |
| `espn_wch_event_officials` / `espnWchEventOfficials` | `espn_wch_game_officials` / `espnWchGameOfficials` |
| `espn_wch_event_play` / `espnWchEventPlay` | `espn_wch_game_play` / `espnWchGamePlay` |
| `espn_wch_event_play_personnel` / `espnWchEventPlayPersonnel` | `espn_wch_game_play_personnel` / `espnWchGamePlayPersonnel` |
| `espn_wch_event_plays` / `espnWchEventPlays` | `espn_wch_game_plays` / `espnWchGamePlays` |
| `espn_wch_event_powerindex` / `espnWchEventPowerindex` | `espn_wch_game_powerindex` / `espnWchGamePowerindex` |
| `espn_wch_event_predictor` / `espnWchEventPredictor` | `espn_wch_game_predictor` / `espnWchGamePredictor` |
| `espn_wch_event_probabilities` / `espnWchEventProbabilities` | `espn_wch_game_probabilities` / `espnWchGameProbabilities` |
| `espn_wch_event_propbets` / `espnWchEventPropbets` | `espn_wch_game_propbets` / `espnWchGamePropbets` |
| `espn_wch_event_scoringplays` / `espnWchEventScoringplays` | `espn_wch_game_scoringplays` / `espnWchGameScoringplays` |
| `espn_wch_event_situation` / `espnWchEventSituation` | `espn_wch_game_situation` / `espnWchGameSituation` |
| `espn_wch_event_status` / `espnWchEventStatus` | `espn_wch_game_status` / `espnWchGameStatus` |
| `espn_wch_events` / `espnWchEvents` | `espn_wch_games` / `espnWchGames` |
| `espn_wch_recruiting_athletes` / `espnWchRecruitingAthletes` | `espn_wch_recruiting_players` / `espnWchRecruitingPlayers` |
| `espn_wch_season_athletes` / `espnWchSeasonAthletes` | `espn_wch_season_players` / `espnWchSeasonPlayers` |
| `espn_wch_season_week_events` / `espnWchSeasonWeekEvents` | `espn_wch_season_week_games` / `espnWchSeasonWeekGames` |

## `sdv.wnba`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_wnba_athlete_awards` / `espnWnbaAthleteAwards` | `espn_wnba_player_awards` / `espnWnbaPlayerAwards` |
| `espn_wnba_athlete_bio` / `espnWnbaAthleteBio` | `espn_wnba_player_bio` / `espnWnbaPlayerBio` |
| `espn_wnba_athlete_career_stats` / `espnWnbaAthleteCareerStats` | `espn_wnba_player_career_stats` / `espnWnbaPlayerCareerStats` |
| `espn_wnba_athlete_contracts` / `espnWnbaAthleteContracts` | `espn_wnba_player_contracts` / `espnWnbaPlayerContracts` |
| `espn_wnba_athlete_core` / `espnWnbaAthleteCore` | `espn_wnba_player_core` / `espnWnbaPlayerCore` |
| `espn_wnba_athlete_eventlog` / `espnWnbaAthleteEventlog` | `espn_wnba_player_eventlog` / `espnWnbaPlayerEventlog` |
| `espn_wnba_athlete_gamelog` / `espnWnbaAthleteGamelog` | `espn_wnba_player_gamelog` / `espnWnbaPlayerGamelog` |
| `espn_wnba_athlete_info` / `espnWnbaAthleteInfo` | `espn_wnba_player_info` / `espnWnbaPlayerInfo` |
| `espn_wnba_athlete_injuries` / `espnWnbaAthleteInjuries` | `espn_wnba_player_injuries` / `espnWnbaPlayerInjuries` |
| `espn_wnba_athlete_news` / `espnWnbaAthleteNews` | `espn_wnba_player_news` / `espnWnbaPlayerNews` |
| `espn_wnba_athlete_notes` / `espnWnbaAthleteNotes` | `espn_wnba_player_notes` / `espnWnbaPlayerNotes` |
| `espn_wnba_athlete_overview` / `espnWnbaAthleteOverview` | `espn_wnba_player_overview` / `espnWnbaPlayerOverview` |
| `espn_wnba_athlete_records` / `espnWnbaAthleteRecords` | `espn_wnba_player_records` / `espnWnbaPlayerRecords` |
| `espn_wnba_athlete_seasons` / `espnWnbaAthleteSeasons` | `espn_wnba_player_seasons` / `espnWnbaPlayerSeasons` |
| `espn_wnba_athlete_splits` / `espnWnbaAthleteSplits` | `espn_wnba_player_splits` / `espnWnbaPlayerSplits` |
| `espn_wnba_athlete_statisticslog` / `espnWnbaAthleteStatisticslog` | `espn_wnba_player_statisticslog` / `espnWnbaPlayerStatisticslog` |
| `espn_wnba_athlete_stats` / `espnWnbaAthleteStats` | `espn_wnba_player_stats_v3` / `espnWnbaPlayerStatsV3` |
| `espn_wnba_athlete_vs_athlete` / `espnWnbaAthleteVsAthlete` | `espn_wnba_player_vs_player` / `espnWnbaPlayerVsPlayer` |
| `espn_wnba_athletes_index` / `espnWnbaAthletesIndex` | `espn_wnba_players_index` / `espnWnbaPlayersIndex` |
| `espn_wnba_event` / `espnWnbaEvent` | `espn_wnba_game` / `espnWnbaGame` |
| `espn_wnba_event_broadcasts` / `espnWnbaEventBroadcasts` | `espn_wnba_game_broadcasts` / `espnWnbaGameBroadcasts` |
| `espn_wnba_event_competition` / `espnWnbaEventCompetition` | `espn_wnba_game_competition` / `espnWnbaGameCompetition` |
| `espn_wnba_event_competitor` / `espnWnbaEventCompetitor` | `espn_wnba_game_team` / `espnWnbaGameTeam` |
| `espn_wnba_event_competitor_leaders` / `espnWnbaEventCompetitorLeaders` | `espn_wnba_game_team_leaders` / `espnWnbaGameTeamLeaders` |
| `espn_wnba_event_competitor_linescores` / `espnWnbaEventCompetitorLinescores` | `espn_wnba_game_team_linescores` / `espnWnbaGameTeamLinescores` |
| `espn_wnba_event_competitor_record` / `espnWnbaEventCompetitorRecord` | `espn_wnba_game_team_record` / `espnWnbaGameTeamRecord` |
| `espn_wnba_event_competitor_roster` / `espnWnbaEventCompetitorRoster` | `espn_wnba_game_team_roster` / `espnWnbaGameTeamRoster` |
| `espn_wnba_event_competitor_statistics` / `espnWnbaEventCompetitorStatistics` | `espn_wnba_game_team_statistics` / `espnWnbaGameTeamStatistics` |
| `espn_wnba_event_competitors` / `espnWnbaEventCompetitors` | `espn_wnba_game_teams` / `espnWnbaGameTeams` |
| `espn_wnba_event_leaders` / `espnWnbaEventLeaders` | `espn_wnba_game_leaders` / `espnWnbaGameLeaders` |
| `espn_wnba_event_odds` / `espnWnbaEventOdds` | `espn_wnba_game_odds` / `espnWnbaGameOdds` |
| `espn_wnba_event_official_detail` / `espnWnbaEventOfficialDetail` | `espn_wnba_game_official_detail` / `espnWnbaGameOfficialDetail` |
| `espn_wnba_event_officials` / `espnWnbaEventOfficials` | `espn_wnba_game_officials` / `espnWnbaGameOfficials` |
| `espn_wnba_event_play` / `espnWnbaEventPlay` | `espn_wnba_game_play` / `espnWnbaGamePlay` |
| `espn_wnba_event_play_personnel` / `espnWnbaEventPlayPersonnel` | `espn_wnba_game_play_personnel` / `espnWnbaGamePlayPersonnel` |
| `espn_wnba_event_plays` / `espnWnbaEventPlays` | `espn_wnba_game_plays` / `espnWnbaGamePlays` |
| `espn_wnba_event_powerindex` / `espnWnbaEventPowerindex` | `espn_wnba_game_powerindex` / `espnWnbaGamePowerindex` |
| `espn_wnba_event_predictor` / `espnWnbaEventPredictor` | `espn_wnba_game_predictor` / `espnWnbaGamePredictor` |
| `espn_wnba_event_probabilities` / `espnWnbaEventProbabilities` | `espn_wnba_game_probabilities` / `espnWnbaGameProbabilities` |
| `espn_wnba_event_propbets` / `espnWnbaEventPropbets` | `espn_wnba_game_propbets` / `espnWnbaGamePropbets` |
| `espn_wnba_event_scoringplays` / `espnWnbaEventScoringplays` | `espn_wnba_game_scoringplays` / `espnWnbaGameScoringplays` |
| `espn_wnba_event_situation` / `espnWnbaEventSituation` | `espn_wnba_game_situation` / `espnWnbaGameSituation` |
| `espn_wnba_event_status` / `espnWnbaEventStatus` | `espn_wnba_game_status` / `espnWnbaGameStatus` |
| `espn_wnba_events` / `espnWnbaEvents` | `espn_wnba_games` / `espnWnbaGames` |
| `espn_wnba_season_athletes` / `espnWnbaSeasonAthletes` | `espn_wnba_season_players` / `espnWnbaSeasonPlayers` |
| `espn_wnba_season_week_events` / `espnWnbaSeasonWeekEvents` | `espn_wnba_season_week_games` / `espnWnbaSeasonWeekGames` |

## `sdv.wwc`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_wwc_athlete_awards` / `espnWwcAthleteAwards` | `espn_wwc_player_awards` / `espnWwcPlayerAwards` |
| `espn_wwc_athlete_bio` / `espnWwcAthleteBio` | `espn_wwc_player_bio` / `espnWwcPlayerBio` |
| `espn_wwc_athlete_career_stats` / `espnWwcAthleteCareerStats` | `espn_wwc_player_career_stats` / `espnWwcPlayerCareerStats` |
| `espn_wwc_athlete_contracts` / `espnWwcAthleteContracts` | `espn_wwc_player_contracts` / `espnWwcPlayerContracts` |
| `espn_wwc_athlete_core` / `espnWwcAthleteCore` | `espn_wwc_player_core` / `espnWwcPlayerCore` |
| `espn_wwc_athlete_eventlog` / `espnWwcAthleteEventlog` | `espn_wwc_player_eventlog` / `espnWwcPlayerEventlog` |
| `espn_wwc_athlete_gamelog` / `espnWwcAthleteGamelog` | `espn_wwc_player_gamelog` / `espnWwcPlayerGamelog` |
| `espn_wwc_athlete_info` / `espnWwcAthleteInfo` | `espn_wwc_player_info` / `espnWwcPlayerInfo` |
| `espn_wwc_athlete_injuries` / `espnWwcAthleteInjuries` | `espn_wwc_player_injuries` / `espnWwcPlayerInjuries` |
| `espn_wwc_athlete_news` / `espnWwcAthleteNews` | `espn_wwc_player_news` / `espnWwcPlayerNews` |
| `espn_wwc_athlete_notes` / `espnWwcAthleteNotes` | `espn_wwc_player_notes` / `espnWwcPlayerNotes` |
| `espn_wwc_athlete_overview` / `espnWwcAthleteOverview` | `espn_wwc_player_overview` / `espnWwcPlayerOverview` |
| `espn_wwc_athlete_records` / `espnWwcAthleteRecords` | `espn_wwc_player_records` / `espnWwcPlayerRecords` |
| `espn_wwc_athlete_seasons` / `espnWwcAthleteSeasons` | `espn_wwc_player_seasons` / `espnWwcPlayerSeasons` |
| `espn_wwc_athlete_splits` / `espnWwcAthleteSplits` | `espn_wwc_player_splits` / `espnWwcPlayerSplits` |
| `espn_wwc_athlete_statisticslog` / `espnWwcAthleteStatisticslog` | `espn_wwc_player_statisticslog` / `espnWwcPlayerStatisticslog` |
| `espn_wwc_athlete_stats` / `espnWwcAthleteStats` | `espn_wwc_player_stats` / `espnWwcPlayerStats` |
| `espn_wwc_athlete_vs_athlete` / `espnWwcAthleteVsAthlete` | `espn_wwc_player_vs_player` / `espnWwcPlayerVsPlayer` |
| `espn_wwc_athletes_index` / `espnWwcAthletesIndex` | `espn_wwc_players_index` / `espnWwcPlayersIndex` |
| `espn_wwc_event` / `espnWwcEvent` | `espn_wwc_game` / `espnWwcGame` |
| `espn_wwc_event_broadcasts` / `espnWwcEventBroadcasts` | `espn_wwc_game_broadcasts` / `espnWwcGameBroadcasts` |
| `espn_wwc_event_competition` / `espnWwcEventCompetition` | `espn_wwc_game_competition` / `espnWwcGameCompetition` |
| `espn_wwc_event_competitor` / `espnWwcEventCompetitor` | `espn_wwc_game_team` / `espnWwcGameTeam` |
| `espn_wwc_event_competitor_leaders` / `espnWwcEventCompetitorLeaders` | `espn_wwc_game_team_leaders` / `espnWwcGameTeamLeaders` |
| `espn_wwc_event_competitor_linescores` / `espnWwcEventCompetitorLinescores` | `espn_wwc_game_team_linescores` / `espnWwcGameTeamLinescores` |
| `espn_wwc_event_competitor_record` / `espnWwcEventCompetitorRecord` | `espn_wwc_game_team_record` / `espnWwcGameTeamRecord` |
| `espn_wwc_event_competitor_roster` / `espnWwcEventCompetitorRoster` | `espn_wwc_game_team_roster` / `espnWwcGameTeamRoster` |
| `espn_wwc_event_competitor_statistics` / `espnWwcEventCompetitorStatistics` | `espn_wwc_game_team_statistics` / `espnWwcGameTeamStatistics` |
| `espn_wwc_event_competitors` / `espnWwcEventCompetitors` | `espn_wwc_game_teams` / `espnWwcGameTeams` |
| `espn_wwc_event_leaders` / `espnWwcEventLeaders` | `espn_wwc_game_leaders` / `espnWwcGameLeaders` |
| `espn_wwc_event_odds` / `espnWwcEventOdds` | `espn_wwc_game_odds` / `espnWwcGameOdds` |
| `espn_wwc_event_official_detail` / `espnWwcEventOfficialDetail` | `espn_wwc_game_official_detail` / `espnWwcGameOfficialDetail` |
| `espn_wwc_event_officials` / `espnWwcEventOfficials` | `espn_wwc_game_officials` / `espnWwcGameOfficials` |
| `espn_wwc_event_play` / `espnWwcEventPlay` | `espn_wwc_game_play` / `espnWwcGamePlay` |
| `espn_wwc_event_play_personnel` / `espnWwcEventPlayPersonnel` | `espn_wwc_game_play_personnel` / `espnWwcGamePlayPersonnel` |
| `espn_wwc_event_plays` / `espnWwcEventPlays` | `espn_wwc_game_plays` / `espnWwcGamePlays` |
| `espn_wwc_event_powerindex` / `espnWwcEventPowerindex` | `espn_wwc_game_powerindex` / `espnWwcGamePowerindex` |
| `espn_wwc_event_predictor` / `espnWwcEventPredictor` | `espn_wwc_game_predictor` / `espnWwcGamePredictor` |
| `espn_wwc_event_probabilities` / `espnWwcEventProbabilities` | `espn_wwc_game_probabilities` / `espnWwcGameProbabilities` |
| `espn_wwc_event_propbets` / `espnWwcEventPropbets` | `espn_wwc_game_propbets` / `espnWwcGamePropbets` |
| `espn_wwc_event_scoringplays` / `espnWwcEventScoringplays` | `espn_wwc_game_scoringplays` / `espnWwcGameScoringplays` |
| `espn_wwc_event_situation` / `espnWwcEventSituation` | `espn_wwc_game_situation` / `espnWwcGameSituation` |
| `espn_wwc_event_status` / `espnWwcEventStatus` | `espn_wwc_game_status` / `espnWwcGameStatus` |
| `espn_wwc_events` / `espnWwcEvents` | `espn_wwc_games` / `espnWwcGames` |
| `espn_wwc_season_athletes` / `espnWwcSeasonAthletes` | `espn_wwc_season_players` / `espnWwcSeasonPlayers` |
| `espn_wwc_season_week_events` / `espnWwcSeasonWeekEvents` | `espn_wwc_season_week_games` / `espnWwcSeasonWeekGames` |

## `sdv.xfl`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `espn_xfl_athlete_awards` / `espnXflAthleteAwards` | `espn_xfl_player_awards` / `espnXflPlayerAwards` |
| `espn_xfl_athlete_bio` / `espnXflAthleteBio` | `espn_xfl_player_bio` / `espnXflPlayerBio` |
| `espn_xfl_athlete_career_stats` / `espnXflAthleteCareerStats` | `espn_xfl_player_career_stats` / `espnXflPlayerCareerStats` |
| `espn_xfl_athlete_contracts` / `espnXflAthleteContracts` | `espn_xfl_player_contracts` / `espnXflPlayerContracts` |
| `espn_xfl_athlete_core` / `espnXflAthleteCore` | `espn_xfl_player_core` / `espnXflPlayerCore` |
| `espn_xfl_athlete_eventlog` / `espnXflAthleteEventlog` | `espn_xfl_player_eventlog` / `espnXflPlayerEventlog` |
| `espn_xfl_athlete_gamelog` / `espnXflAthleteGamelog` | `espn_xfl_player_gamelog` / `espnXflPlayerGamelog` |
| `espn_xfl_athlete_info` / `espnXflAthleteInfo` | `espn_xfl_player_info` / `espnXflPlayerInfo` |
| `espn_xfl_athlete_injuries` / `espnXflAthleteInjuries` | `espn_xfl_player_injuries` / `espnXflPlayerInjuries` |
| `espn_xfl_athlete_news` / `espnXflAthleteNews` | `espn_xfl_player_news` / `espnXflPlayerNews` |
| `espn_xfl_athlete_notes` / `espnXflAthleteNotes` | `espn_xfl_player_notes` / `espnXflPlayerNotes` |
| `espn_xfl_athlete_overview` / `espnXflAthleteOverview` | `espn_xfl_player_overview` / `espnXflPlayerOverview` |
| `espn_xfl_athlete_records` / `espnXflAthleteRecords` | `espn_xfl_player_records` / `espnXflPlayerRecords` |
| `espn_xfl_athlete_seasons` / `espnXflAthleteSeasons` | `espn_xfl_player_seasons` / `espnXflPlayerSeasons` |
| `espn_xfl_athlete_splits` / `espnXflAthleteSplits` | `espn_xfl_player_splits` / `espnXflPlayerSplits` |
| `espn_xfl_athlete_statisticslog` / `espnXflAthleteStatisticslog` | `espn_xfl_player_statisticslog` / `espnXflPlayerStatisticslog` |
| `espn_xfl_athlete_stats` / `espnXflAthleteStats` | `espn_xfl_player_stats` / `espnXflPlayerStats` |
| `espn_xfl_athlete_vs_athlete` / `espnXflAthleteVsAthlete` | `espn_xfl_player_vs_player` / `espnXflPlayerVsPlayer` |
| `espn_xfl_athletes_index` / `espnXflAthletesIndex` | `espn_xfl_players_index` / `espnXflPlayersIndex` |
| `espn_xfl_event` / `espnXflEvent` | `espn_xfl_game` / `espnXflGame` |
| `espn_xfl_event_broadcasts` / `espnXflEventBroadcasts` | `espn_xfl_game_broadcasts` / `espnXflGameBroadcasts` |
| `espn_xfl_event_competition` / `espnXflEventCompetition` | `espn_xfl_game_competition` / `espnXflGameCompetition` |
| `espn_xfl_event_competitor` / `espnXflEventCompetitor` | `espn_xfl_game_team` / `espnXflGameTeam` |
| `espn_xfl_event_competitor_leaders` / `espnXflEventCompetitorLeaders` | `espn_xfl_game_team_leaders` / `espnXflGameTeamLeaders` |
| `espn_xfl_event_competitor_linescores` / `espnXflEventCompetitorLinescores` | `espn_xfl_game_team_linescores` / `espnXflGameTeamLinescores` |
| `espn_xfl_event_competitor_record` / `espnXflEventCompetitorRecord` | `espn_xfl_game_team_record` / `espnXflGameTeamRecord` |
| `espn_xfl_event_competitor_roster` / `espnXflEventCompetitorRoster` | `espn_xfl_game_team_roster` / `espnXflGameTeamRoster` |
| `espn_xfl_event_competitor_statistics` / `espnXflEventCompetitorStatistics` | `espn_xfl_game_team_statistics` / `espnXflGameTeamStatistics` |
| `espn_xfl_event_competitors` / `espnXflEventCompetitors` | `espn_xfl_game_teams` / `espnXflGameTeams` |
| `espn_xfl_event_leaders` / `espnXflEventLeaders` | `espn_xfl_game_leaders` / `espnXflGameLeaders` |
| `espn_xfl_event_odds` / `espnXflEventOdds` | `espn_xfl_game_odds` / `espnXflGameOdds` |
| `espn_xfl_event_official_detail` / `espnXflEventOfficialDetail` | `espn_xfl_game_official_detail` / `espnXflGameOfficialDetail` |
| `espn_xfl_event_officials` / `espnXflEventOfficials` | `espn_xfl_game_officials` / `espnXflGameOfficials` |
| `espn_xfl_event_play` / `espnXflEventPlay` | `espn_xfl_game_play` / `espnXflGamePlay` |
| `espn_xfl_event_play_personnel` / `espnXflEventPlayPersonnel` | `espn_xfl_game_play_personnel` / `espnXflGamePlayPersonnel` |
| `espn_xfl_event_plays` / `espnXflEventPlays` | `espn_xfl_game_plays` / `espnXflGamePlays` |
| `espn_xfl_event_powerindex` / `espnXflEventPowerindex` | `espn_xfl_game_powerindex` / `espnXflGamePowerindex` |
| `espn_xfl_event_predictor` / `espnXflEventPredictor` | `espn_xfl_game_predictor` / `espnXflGamePredictor` |
| `espn_xfl_event_probabilities` / `espnXflEventProbabilities` | `espn_xfl_game_probabilities` / `espnXflGameProbabilities` |
| `espn_xfl_event_propbets` / `espnXflEventPropbets` | `espn_xfl_game_propbets` / `espnXflGamePropbets` |
| `espn_xfl_event_scoringplays` / `espnXflEventScoringplays` | `espn_xfl_game_scoringplays` / `espnXflGameScoringplays` |
| `espn_xfl_event_situation` / `espnXflEventSituation` | `espn_xfl_game_situation` / `espnXflGameSituation` |
| `espn_xfl_event_status` / `espnXflEventStatus` | `espn_xfl_game_status` / `espnXflGameStatus` |
| `espn_xfl_events` / `espnXflEvents` | `espn_xfl_games` / `espnXflGames` |
| `espn_xfl_season_athletes` / `espnXflSeasonAthletes` | `espn_xfl_season_players` / `espnXflSeasonPlayers` |
| `espn_xfl_season_week_events` / `espnXflSeasonWeekEvents` | `espn_xfl_season_week_games` / `espnXflSeasonWeekGames` |

## `sdv.yahoo`

| Deprecated (pre-v4) | Use instead (v4) |
|---|---|
| `yahoo_shangrila_alias` / `yahooShangrilaAlias` | `yahoo_alias` / `yahooAlias` |
| `yahoo_shangrila_article_list_card_players` / `yahooShangrilaArticleListCardPlayers` | `yahoo_article_list_card_players` / `yahooArticleListCardPlayers` |
| `yahoo_shangrila_article_list_card_teams` / `yahooShangrilaArticleListCardTeams` | `yahoo_article_list_card_teams` / `yahooArticleListCardTeams` |
| `yahoo_shangrila_basic_players` / `yahooShangrilaBasicPlayers` | `yahoo_basic_players` / `yahooBasicPlayers` |
| `yahoo_shangrila_betting_disclaimer` / `yahooShangrilaBettingDisclaimer` | `yahoo_betting_disclaimer` / `yahooBettingDisclaimer` |
| `yahoo_shangrila_combat_event_fights` / `yahooShangrilaCombatEventFights` | `yahoo_combat_event_fights` / `yahooCombatEventFights` |
| `yahoo_shangrila_combat_schedule` / `yahooShangrilaCombatSchedule` | `yahoo_combat_schedule` / `yahooCombatSchedule` |
| `yahoo_shangrila_common_pills` / `yahooShangrilaCommonPills` | `yahoo_common_pills` / `yahooCommonPills` |
| `yahoo_shangrila_consensus_rankings_php` / `yahooShangrilaConsensusRankingsPhp` | `yahoo_consensus_rankings_php` / `yahooConsensusRankingsPhp` |
| `yahoo_shangrila_draft` / `yahooShangrilaDraft` | `yahoo_draft` / `yahooDraft` |
| `yahoo_shangrila_draft_prospects` / `yahooShangrilaDraftProspects` | `yahoo_draft_prospects` / `yahooDraftProspects` |
| `yahoo_shangrila_driver_results` / `yahooShangrilaDriverResults` | `yahoo_driver_results` / `yahooDriverResults` |
| `yahoo_shangrila_driver_splits` / `yahooShangrilaDriverSplits` | `yahoo_driver_splits` / `yahooDriverSplits` |
| `yahoo_shangrila_featured_game_ids` / `yahooShangrilaFeaturedGameIds` | `yahoo_featured_game_ids` / `yahooFeaturedGameIds` |
| `yahoo_shangrila_game_prop_bets` / `yahooShangrilaGamePropBets` | `yahoo_game_prop_bets` / `yahooGamePropBets` |
| `yahoo_shangrila_game_stats_leaders` / `yahooShangrilaGameStatsLeaders` | `yahoo_game_stats_leaders` / `yahooGameStatsLeaders` |
| `yahoo_shangrila_gametime_game` / `yahooShangrilaGametimeGame` | `yahoo_gametime_game` / `yahooGametimeGame` |
| `yahoo_shangrila_gametime_team` / `yahooShangrilaGametimeTeam` | `yahoo_gametime_team` / `yahooGametimeTeam` |
| `yahoo_shangrila_golf_tournament_seasons` / `yahooShangrilaGolfTournamentSeasons` | `yahoo_golf_tournament_seasons` / `yahooGolfTournamentSeasons` |
| `yahoo_shangrila_golf_tournaments` / `yahooShangrilaGolfTournaments` | `yahoo_golf_tournaments` / `yahooGolfTournaments` |
| `yahoo_shangrila_golf_tournaments_basic` / `yahooShangrilaGolfTournamentsBasic` | `yahoo_golf_tournaments_basic` / `yahooGolfTournamentsBasic` |
| `yahoo_shangrila_league_conferences` / `yahooShangrilaLeagueConferences` | `yahoo_league_conferences` / `yahooLeagueConferences` |
| `yahoo_shangrila_league_filters_data` / `yahooShangrilaLeagueFiltersData` | `yahoo_league_filters_data` / `yahooLeagueFiltersData` |
| `yahoo_shangrila_league_future_odds` / `yahooShangrilaLeagueFutureOdds` | `yahoo_league_future_odds` / `yahooLeagueFutureOdds` |
| `yahoo_shangrila_league_game_ids` / `yahooShangrilaLeagueGameIds` | `yahoo_league_game_ids` / `yahooLeagueGameIds` |
| `yahoo_shangrila_league_game_ids_by_date` / `yahooShangrilaLeagueGameIdsByDate` | `yahoo_league_game_ids_by_date` / `yahooLeagueGameIdsByDate` |
| `yahoo_shangrila_league_games_by_round` / `yahooShangrilaLeagueGamesByRound` | `yahoo_league_games_by_round` / `yahooLeagueGamesByRound` |
| `yahoo_shangrila_league_info` / `yahooShangrilaLeagueInfo` | `yahoo_league_info` / `yahooLeagueInfo` |
| `yahoo_shangrila_league_injuries` / `yahooShangrilaLeagueInjuries` | `yahoo_league_injuries` / `yahooLeagueInjuries` |
| `yahoo_shangrila_league_names` / `yahooShangrilaLeagueNames` | `yahoo_league_names` / `yahooLeagueNames` |
| `yahoo_shangrila_league_prop_odds` / `yahooShangrilaLeaguePropOdds` | `yahoo_league_prop_odds` / `yahooLeaguePropOdds` |
| `yahoo_shangrila_league_standings` / `yahooShangrilaLeagueStandings` | `yahoo_league_standings` / `yahooLeagueStandings` |
| `yahoo_shangrila_league_stats_by_team` / `yahooShangrilaLeagueStatsByTeam` | `yahoo_league_stats_by_team` / `yahooLeagueStatsByTeam` |
| `yahoo_shangrila_league_stats_individual` / `yahooShangrilaLeagueStatsIndividual` | `yahoo_league_stats_individual` / `yahooLeagueStatsIndividual` |
| `yahoo_shangrila_league_stats_overview` / `yahooShangrilaLeagueStatsOverview` | `yahoo_league_stats_overview` / `yahooLeagueStatsOverview` |
| `yahoo_shangrila_league_stats_weekly` / `yahooShangrilaLeagueStatsWeekly` | `yahoo_league_stats_weekly` / `yahooLeagueStatsWeekly` |
| `yahoo_shangrila_league_team_ids` / `yahooShangrilaLeagueTeamIds` | `yahoo_league_team_ids` / `yahooLeagueTeamIds` |
| `yahoo_shangrila_league_teams` / `yahooShangrilaLeagueTeams` | `yahoo_league_teams` / `yahooLeagueTeams` |
| `yahoo_shangrila_leagues_season_states` / `yahooShangrilaLeaguesSeasonStates` | `yahoo_leagues_season_states` / `yahooLeaguesSeasonStates` |
| `yahoo_shangrila_module_game` / `yahooShangrilaModuleGame` | `yahoo_module_game` / `yahooModuleGame` |
| `yahoo_shangrila_motorsport_standings` / `yahooShangrilaMotorsportStandings` | `yahoo_motorsport_standings` / `yahooMotorsportStandings` |
| `yahoo_shangrila_nascar_drivers` / `yahooShangrilaNascarDrivers` | `yahoo_nascar_drivers` / `yahooNascarDrivers` |
| `yahoo_shangrila_nav_dropdown_tray` / `yahooShangrilaNavDropdownTray` | `yahoo_nav_dropdown_tray` / `yahooNavDropdownTray` |
| `yahoo_shangrila_oly_medal_count` / `yahooShangrilaOlyMedalCount` | `yahoo_oly_medal_count` / `yahooOlyMedalCount` |
| `yahoo_shangrila_oly_seasons` / `yahooShangrilaOlySeasons` | `yahoo_oly_seasons` / `yahooOlySeasons` |
| `yahoo_shangrila_pick_distribution` / `yahooShangrilaPickDistribution` | `yahoo_pick_distribution` / `yahooPickDistribution` |
| `yahoo_shangrila_playbook_boxscore` / `yahooShangrilaPlaybookBoxscore` | `yahoo_playbook_boxscore` / `yahooPlaybookBoxscore` |
| `yahoo_shangrila_playbook_boxscore_poll` / `yahooShangrilaPlaybookBoxscorePoll` | `yahoo_playbook_boxscore_poll` / `yahooPlaybookBoxscorePoll` |
| `yahoo_shangrila_playbook_boxscore_social_share` / `yahooShangrilaPlaybookBoxscoreSocialShare` | `yahoo_playbook_boxscore_social_share` / `yahooPlaybookBoxscoreSocialShare` |
| `yahoo_shangrila_playbook_combat_match` / `yahooShangrilaPlaybookCombatMatch` | `yahoo_playbook_combat_match` / `yahooPlaybookCombatMatch` |
| `yahoo_shangrila_playbook_game` / `yahooShangrilaPlaybookGame` | `yahoo_playbook_game` / `yahooPlaybookGame` |
| `yahoo_shangrila_playbook_game_odds_poll` / `yahooShangrilaPlaybookGameOddsPoll` | `yahoo_playbook_game_odds_poll` / `yahooPlaybookGameOddsPoll` |
| `yahoo_shangrila_playbook_golf_tournament` / `yahooShangrilaPlaybookGolfTournament` | `yahoo_playbook_golf_tournament` / `yahooPlaybookGolfTournament` |
| `yahoo_shangrila_playbook_league_odds` / `yahooShangrilaPlaybookLeagueOdds` | `yahoo_playbook_league_odds` / `yahooPlaybookLeagueOdds` |
| `yahoo_shangrila_playbook_player` / `yahooShangrilaPlaybookPlayer` | `yahoo_playbook_player` / `yahooPlaybookPlayer` |
| `yahoo_shangrila_playbook_player_social_share` / `yahooShangrilaPlaybookPlayerSocialShare` | `yahoo_playbook_player_social_share` / `yahooPlaybookPlayerSocialShare` |
| `yahoo_shangrila_playbook_race` / `yahooShangrilaPlaybookRace` | `yahoo_playbook_race` / `yahooPlaybookRace` |
| `yahoo_shangrila_playbook_team` / `yahooShangrilaPlaybookTeam` | `yahoo_playbook_team` / `yahooPlaybookTeam` |
| `yahoo_shangrila_playbook_team_basic` / `yahooShangrilaPlaybookTeamBasic` | `yahoo_playbook_team_basic` / `yahooPlaybookTeamBasic` |
| `yahoo_shangrila_playbook_team_social_share` / `yahooShangrilaPlaybookTeamSocialShare` | `yahoo_playbook_team_social_share` / `yahooPlaybookTeamSocialShare` |
| `yahoo_shangrila_playbook_tennis_match` / `yahooShangrilaPlaybookTennisMatch` | `yahoo_playbook_tennis_match` / `yahooPlaybookTennisMatch` |
| `yahoo_shangrila_player_basic` / `yahooShangrilaPlayerBasic` | `yahoo_player_basic` / `yahooPlayerBasic` |
| `yahoo_shangrila_player_career_stats` / `yahooShangrilaPlayerCareerStats` | `yahoo_player_career_stats` / `yahooPlayerCareerStats` |
| `yahoo_shangrila_player_game_log` / `yahooShangrilaPlayerGameLog` | `yahoo_player_game_log` / `yahooPlayerGameLog` |
| `yahoo_shangrila_player_props` / `yahooShangrilaPlayerProps` | `yahoo_player_props` / `yahooPlayerProps` |
| `yahoo_shangrila_player_search` / `yahooShangrilaPlayerSearch` | `yahoo_player_search` / `yahooPlayerSearch` |
| `yahoo_shangrila_player_season_stats` / `yahooShangrilaPlayerSeasonStats` | `yahoo_player_season_stats` / `yahooPlayerSeasonStats` |
| `yahoo_shangrila_playoff_bracket` / `yahooShangrilaPlayoffBracket` | `yahoo_playoff_bracket` / `yahooPlayoffBracket` |
| `yahoo_shangrila_playoff_series_game` / `yahooShangrilaPlayoffSeriesGame` | `yahoo_playoff_series_game` / `yahooPlayoffSeriesGame` |
| `yahoo_shangrila_polymarket_game` / `yahooShangrilaPolymarketGame` | `yahoo_polymarket_game` / `yahooPolymarketGame` |
| `yahoo_shangrila_racing_schedule` / `yahooShangrilaRacingSchedule` | `yahoo_racing_schedule` / `yahooRacingSchedule` |
| `yahoo_shangrila_scoreboard_game` / `yahooShangrilaScoreboardGame` | `yahoo_scoreboard_game` / `yahooScoreboardGame` |
| `yahoo_shangrila_season_stats_football_defense_ncaaf` / `yahooShangrilaSeasonStatsFootballDefenseNcaaf` | `yahoo_season_stats_football_defense_ncaaf` / `yahooSeasonStatsFootballDefenseNcaaf` |
| `yahoo_shangrila_season_stats_football_kicking_ncaaf` / `yahooShangrilaSeasonStatsFootballKickingNcaaf` | `yahoo_season_stats_football_kicking_ncaaf` / `yahooSeasonStatsFootballKickingNcaaf` |
| `yahoo_shangrila_season_stats_football_passing_ncaaf` / `yahooShangrilaSeasonStatsFootballPassingNcaaf` | `yahoo_season_stats_football_passing_ncaaf` / `yahooSeasonStatsFootballPassingNcaaf` |
| `yahoo_shangrila_season_stats_football_punting_ncaaf` / `yahooShangrilaSeasonStatsFootballPuntingNcaaf` | `yahoo_season_stats_football_punting_ncaaf` / `yahooSeasonStatsFootballPuntingNcaaf` |
| `yahoo_shangrila_season_stats_football_receiving_ncaaf` / `yahooShangrilaSeasonStatsFootballReceivingNcaaf` | `yahoo_season_stats_football_receiving_ncaaf` / `yahooSeasonStatsFootballReceivingNcaaf` |
| `yahoo_shangrila_season_stats_football_returns_ncaaf` / `yahooShangrilaSeasonStatsFootballReturnsNcaaf` | `yahoo_season_stats_football_returns_ncaaf` / `yahooSeasonStatsFootballReturnsNcaaf` |
| `yahoo_shangrila_season_stats_football_rushing_ncaaf` / `yahooShangrilaSeasonStatsFootballRushingNcaaf` | `yahoo_season_stats_football_rushing_ncaaf` / `yahooSeasonStatsFootballRushingNcaaf` |
| `yahoo_shangrila_season_team_stats_football_defense` / `yahooShangrilaSeasonTeamStatsFootballDefense` | `yahoo_season_team_stats_football_defense` / `yahooSeasonTeamStatsFootballDefense` |
| `yahoo_shangrila_season_team_stats_football_kicking` / `yahooShangrilaSeasonTeamStatsFootballKicking` | `yahoo_season_team_stats_football_kicking` / `yahooSeasonTeamStatsFootballKicking` |
| `yahoo_shangrila_season_team_stats_football_kickoffs` / `yahooShangrilaSeasonTeamStatsFootballKickoffs` | `yahoo_season_team_stats_football_kickoffs` / `yahooSeasonTeamStatsFootballKickoffs` |
| `yahoo_shangrila_season_team_stats_football_offense` / `yahooShangrilaSeasonTeamStatsFootballOffense` | `yahoo_season_team_stats_football_offense` / `yahooSeasonTeamStatsFootballOffense` |
| `yahoo_shangrila_season_team_stats_football_passing` / `yahooShangrilaSeasonTeamStatsFootballPassing` | `yahoo_season_team_stats_football_passing` / `yahooSeasonTeamStatsFootballPassing` |
| `yahoo_shangrila_season_team_stats_football_passing_defense` / `yahooShangrilaSeasonTeamStatsFootballPassingDefense` | `yahoo_season_team_stats_football_passing_defense` / `yahooSeasonTeamStatsFootballPassingDefense` |
| `yahoo_shangrila_season_team_stats_football_punting` / `yahooShangrilaSeasonTeamStatsFootballPunting` | `yahoo_season_team_stats_football_punting` / `yahooSeasonTeamStatsFootballPunting` |
| `yahoo_shangrila_season_team_stats_football_receiving` / `yahooShangrilaSeasonTeamStatsFootballReceiving` | `yahoo_season_team_stats_football_receiving` / `yahooSeasonTeamStatsFootballReceiving` |
| `yahoo_shangrila_season_team_stats_football_receiving_defense` / `yahooShangrilaSeasonTeamStatsFootballReceivingDefense` | `yahoo_season_team_stats_football_receiving_defense` / `yahooSeasonTeamStatsFootballReceivingDefense` |
| `yahoo_shangrila_season_team_stats_football_returns` / `yahooShangrilaSeasonTeamStatsFootballReturns` | `yahoo_season_team_stats_football_returns` / `yahooSeasonTeamStatsFootballReturns` |
| `yahoo_shangrila_season_team_stats_football_rushing` / `yahooShangrilaSeasonTeamStatsFootballRushing` | `yahoo_season_team_stats_football_rushing` / `yahooSeasonTeamStatsFootballRushing` |
| `yahoo_shangrila_season_team_stats_football_rushing_defense` / `yahooShangrilaSeasonTeamStatsFootballRushingDefense` | `yahoo_season_team_stats_football_rushing_defense` / `yahooSeasonTeamStatsFootballRushingDefense` |
| `yahoo_shangrila_team_injuries` / `yahooShangrilaTeamInjuries` | `yahoo_team_injuries` / `yahooTeamInjuries` |
| `yahoo_shangrila_team_playoff_series` / `yahooShangrilaTeamPlayoffSeries` | `yahoo_team_playoff_series` / `yahooTeamPlayoffSeries` |
| `yahoo_shangrila_team_roster` / `yahooShangrilaTeamRoster` | `yahoo_team_roster` / `yahooTeamRoster` |
| `yahoo_shangrila_team_schedule_by_season` / `yahooShangrilaTeamScheduleBySeason` | `yahoo_team_schedule_by_season` / `yahooTeamScheduleBySeason` |
| `yahoo_shangrila_team_search` / `yahooShangrilaTeamSearch` | `yahoo_team_search` / `yahooTeamSearch` |
| `yahoo_shangrila_team_stats_leaders_v2` / `yahooShangrilaTeamStatsLeadersV2` | `yahoo_team_stats_leaders_v2` / `yahooTeamStatsLeadersV2` |
| `yahoo_shangrila_team_transactions` / `yahooShangrilaTeamTransactions` | `yahoo_team_transactions` / `yahooTeamTransactions` |
| `yahoo_shangrila_teams_basic` / `yahooShangrilaTeamsBasic` | `yahoo_teams_basic` / `yahooTeamsBasic` |
| `yahoo_shangrila_tennis_matches_by_date` / `yahooShangrilaTennisMatchesByDate` | `yahoo_tennis_matches_by_date` / `yahooTennisMatchesByDate` |
| `yahoo_shangrila_tennis_tournament` / `yahooShangrilaTennisTournament` | `yahoo_tennis_tournament` / `yahooTennisTournament` |
| `yahoo_shangrila_tennis_tournaments` / `yahooShangrilaTennisTournaments` | `yahoo_tennis_tournaments` / `yahooTennisTournaments` |
| `yahoo_shangrila_tennis_tournaments_by_date` / `yahooShangrilaTennisTournamentsByDate` | `yahoo_tennis_tournaments_by_date` / `yahooTennisTournamentsByDate` |
| `yahoo_shangrila_trending_event_ids` / `yahooShangrilaTrendingEventIds` | `yahoo_trending_event_ids` / `yahooTrendingEventIds` |
| `yahoo_shangrila_trending_game_ids` / `yahooShangrilaTrendingGameIds` | `yahoo_trending_game_ids` / `yahooTrendingGameIds` |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
