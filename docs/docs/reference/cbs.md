---
title: cbs
sidebar_label: cbs
sidebar_position: 35
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `cbs` — native provider reference

- **namespace:** `sdv.cbs` *(standalone — not an ESPN league)*
- **families:** CBS Sports
- **wrappers:** 82 native

`cbs` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.cbs`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// CBS Sports is an anonymously-reachable public JSON API (no token):
await sdv.cbs.cbs_league({ league_id: 'football-nfl' });
```

## Native API — CBS Sports

Flat (non-ESPN) wrappers for the CBS Sports API. Host: `https://api.cbssports.com/napi`. Each method is exposed under BOTH its snake_case name `cbs_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.cbs`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `cbs_bulk` / `cbsBulk` *(was `cbs_napi_bulk`)* | `https://api.cbssports.com/napi/resource/bulk` | — | `player_resource` → `PlayerResource`, `team_resource` → `TeamResource`, `game_resource` → `GameResource`, `venue_resource` → `VenueResource`, `event_resource` → `EventResource`, `featured_game_resource` → `FeaturedGameResource`, `golf_event_markets_resource` → `GolfEventMarketsResource` | `parse_cbs_list` | — |
| `cbs_client_config` / `cbsClientConfig` *(was `cbs_client_configuration`, `cbs_napi_client_configuration`)* | `https://api.cbssports.com/napi/resource/client/config/{client_name}` | `client_name`\* | `resources`, `league_id` → `leagueId`, `classifier`, `key_name` → `keyName` | `parse_cbs_list` | — |
| `cbs_coach_rankings` / `cbsCoachRankings` *(was `cbs_napi_coach_rankings`)* | `https://api.cbssports.com/napi/resource/coach/rankings/{coach_id}` | `coach_id`\* | — | `parse_cbs_list` | — |
| `cbs_coach_team_associations` / `cbsCoachTeamAssociations` *(was `cbs_napi_coach_team_associations`)* | `https://api.cbssports.com/napi/resource/coach/teamAssociations/{coach_id}` | `coach_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_division_subdivisions` / `cbsDivisionSubdivisions` *(was `cbs_sub_divisions`, `cbs_napi_sub_divisions`)* | `https://api.cbssports.com/napi/resource/division/subdivisions/{division_id}` | `division_id`\* | `sub_division_id` → `subDivisionId`, `name` | `parse_cbs_list` | — |
| `cbs_endpoint_registry` / `cbsEndpointRegistry` *(was `cbs_napi_endpoint_registry`)* | `https://api.cbssports.com/napi/resource/endpoint/registry` | — | — | `parse_cbs_list` | — |
| `cbs_event` / `cbsEvent` *(was `cbs_napi_event`)* | `https://api.cbssports.com/napi/resource/event/{event_id}` | `event_id`\* | `date_format` → `dateFormat`, `resources` | `parse_cbs_list` | — |
| `cbs_event_entrants` / `cbsEventEntrants` *(was `cbs_napi_event_entrants`)* | `https://api.cbssports.com/napi/resource/event/entrants/{event_id}` | `event_id`\* | — | `parse_cbs_list` | — |
| `cbs_event_leaderboard` / `cbsEventLeaderboard` *(was `cbs_napi_event_leaderboard`)* | `https://api.cbssports.com/napi/resource/event/leaderboard/{event_id}` | `event_id`\* | — | `parse_cbs_list` | — |
| `cbs_event_seasons` / `cbsEventSeasons` *(was `cbs_napi_event_seasons`)* | `https://api.cbssports.com/napi/resource/event/seasons/{event_id}` | `event_id`\* | — | `parse_cbs_list` | — |
| `cbs_event_venues` / `cbsEventVenues` *(was `cbs_napi_event_venues`)* | `https://api.cbssports.com/napi/resource/event/venues/{event_id}` | `event_id`\* | — | `parse_cbs_list` | — |
| `cbs_game` / `cbsGame` *(was `cbs_napi_game`)* | `https://api.cbssports.com/napi/resource/game/{game_id}` | `game_id`\* | `date_format` → `dateFormat`, `resources` | `parse_cbs_list` | — |
| `cbs_game_betting_splits` / `cbsGameBettingSplits` *(was `cbs_napi_game_betting_splits`)* | `https://api.cbssports.com/napi/resource/game/bettingSplits/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_boxscore` / `cbsGameBoxscore` *(was `cbs_boxscore`, `cbs_napi_boxscore`)* | `https://api.cbssports.com/napi/resource/game/boxscore/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_content_preview` / `cbsGameContentPreview` *(was `cbs_napi_game_content_preview`)* | `https://api.cbssports.com/napi/resource/game/content/preview/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_content_recap` / `cbsGameContentRecap` *(was `cbs_napi_game_content_recap`)* | `https://api.cbssports.com/napi/resource/game/content/recap/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_content_story` / `cbsGameContentStory` *(was `cbs_napi_game_content_story`)* | `https://api.cbssports.com/napi/resource/game/content/story/{game_id}` | `game_id`\* | `game_ids_story_tags` → `gameIdsStoryTags` | `parse_cbs_list` | — |
| `cbs_game_featured` / `cbsGameFeatured` *(was `cbs_featured_game`, `cbs_napi_featured_game`)* | `https://api.cbssports.com/napi/resource/game/featured/{game_id}` | `game_id`\* | — | `parse_cbs_scoreboard` | — |
| `cbs_game_lineup` / `cbsGameLineup` *(was `cbs_napi_game_lineup`)* | `https://api.cbssports.com/napi/resource/game/lineup/{game_id}` | `game_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_game_odds` / `cbsGameOdds` *(was `cbs_napi_game_odds`)* | `https://api.cbssports.com/napi/resource/game/odds/{game_id}` | `game_id`\* | `market_ids` → `marketIds`, `book_ids` → `bookIds`, `state`, `model`, `show_hidden_odds` → `showHiddenOdds` | `parse_cbs_odds` | — |
| `cbs_game_odds_hq` / `cbsGameOddsHq` *(was `cbs_game_hq_odds`, `cbs_napi_game_hq_odds`)* | `https://api.cbssports.com/napi/resource/game/odds/hq/{game_id}` | `game_id`\* | — | `parse_cbs_odds` | — |
| `cbs_game_outcomes` / `cbsGameOutcomes` *(was `cbs_napi_game_outcomes`)* | `https://api.cbssports.com/napi/resource/game/outcomes/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_probable_players` / `cbsGameProbablePlayers` *(was `cbs_probable_players`, `cbs_napi_probable_players`)* | `https://api.cbssports.com/napi/resource/game/probablePlayers/{game_id}` | `game_id`\* | `date_format` → `dateFormat`, `resources` | `parse_cbs_list` | — |
| `cbs_game_props` / `cbsGameProps` *(was `cbs_napi_game_props`)* | `https://api.cbssports.com/napi/resource/game/props/{game_id}` | `game_id`\* | `market_ids` → `marketIds`, `book_ids` → `bookIds`, `prop_bet_types` → `propBetTypes`, `state`, `include_inactive_markets` → `includeInactiveMarkets` | `parse_cbs_odds` | — |
| `cbs_game_rtwp` / `cbsGameRtwp` *(was `cbs_napi_game_rtwp`)* | `https://api.cbssports.com/napi/resource/game/rtwp/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_ruwt_highlights` / `cbsGameRuwtHighlights` *(was `cbs_ruwt_highlights`, `cbs_napi_ruwt_highlights`)* | `https://api.cbssports.com/napi/resource/game/ruwtHighlights/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_boxscores` / `cbsGameScoringBoxscores` *(was `cbs_napi_game_scoring_boxscores`)* | `https://api.cbssports.com/napi/resource/game/scoring/boxscores/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_drives` / `cbsGameScoringDrives` *(was `cbs_napi_game_scoring_drives`)* | `https://api.cbssports.com/napi/resource/game/scoring/drives/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_leaders` / `cbsGameScoringLeaders` *(was `cbs_napi_game_scoring_leaders`)* | `https://api.cbssports.com/napi/resource/game/scoring/leaders/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_player_stats` / `cbsGameScoringPlayerStats` *(was `cbs_napi_game_scoring_player_stats`)* | `https://api.cbssports.com/napi/resource/game/scoring/playerStats/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_plays` / `cbsGameScoringPlays` *(was `cbs_napi_game_scoring_plays`)* | `https://api.cbssports.com/napi/resource/game/scoring/plays/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_rosters` / `cbsGameScoringRosters` *(was `cbs_napi_game_scoring_rosters`)* | `https://api.cbssports.com/napi/resource/game/scoring/rosters/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_scoreboard` / `cbsGameScoringScoreboard` *(was `cbs_napi_game_scoring_scoreboard`)* | `https://api.cbssports.com/napi/resource/game/scoring/scoreboard/{game_id}` | `game_id`\* | — | `parse_cbs_scoreboard` | — |
| `cbs_game_scoring_scores` / `cbsGameScoringScores` *(was `cbs_napi_game_scoring_scores`)* | `https://api.cbssports.com/napi/resource/game/scoring/scores/{game_id}` | `game_id`\* | — | `parse_cbs_scoreboard` | — |
| `cbs_game_scoring_team_stats` / `cbsGameScoringTeamStats` *(was `cbs_napi_game_scoring_team_stats`)* | `https://api.cbssports.com/napi/resource/game/scoring/teamStats/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_winprob` / `cbsGameScoringWinprob` *(was `cbs_napi_game_scoring_winprob`)* | `https://api.cbssports.com/napi/resource/game/scoring/winprob/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_ytd_player_stats` / `cbsGameScoringYtdPlayerStats` *(was `cbs_napi_game_scoring_ytd_player_stats`)* | `https://api.cbssports.com/napi/resource/game/scoring/ytdPlayerStats/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_scoring_ytd_team_stats` / `cbsGameScoringYtdTeamStats` *(was `cbs_napi_game_scoring_ytd_team_stats`)* | `https://api.cbssports.com/napi/resource/game/scoring/ytdTeamStats/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_ticket` / `cbsGameTicket` *(was `cbs_napi_game_ticket`)* | `https://api.cbssports.com/napi/resource/game/ticket/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_game_weather` / `cbsGameWeather` *(was `cbs_weather`, `cbs_napi_weather`)* | `https://api.cbssports.com/napi/resource/game/weather/{game_id}` | `game_id`\* | — | `parse_cbs_list` | — |
| `cbs_golf_event_markets` / `cbsGolfEventMarkets` *(was `cbs_napi_golf_event_markets`)* | `https://api.cbssports.com/napi/resource/golf/event/markets/{event_id}` | `event_id`\* | — | `parse_cbs_list` | — |
| `cbs_golf_player_markets` / `cbsGolfPlayerMarkets` *(was `cbs_napi_golf_player_markets`)* | `https://api.cbssports.com/napi/resource/golf/player/markets/{player_id}` | `player_id`\* | `event_id` → `eventId` | `parse_cbs_list` | — |
| `cbs_golfer_results` / `cbsGolferResults` *(was `cbs_napi_golfer_results`)* | `https://api.cbssports.com/napi/resource/golfer/results/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_id` → `seasonId` | `parse_cbs_list` | — |
| `cbs_league` / `cbsLeague` *(was `cbs_napi_league`)* | `https://api.cbssports.com/napi/resource/league/{league_id}` | `league_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_league_teams` / `cbsLeagueTeams` *(was `cbs_napi_league_teams`)* | `https://api.cbssports.com/napi/resource/league/teams/{league_id}` | `league_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_odds` / `cbsOdds` *(was `cbs_napi_odds`)* | `https://api.cbssports.com/napi/resource/odds/{game_id}` | `game_id`\* | — | `parse_cbs_odds` | — |
| `cbs_player` / `cbsPlayer` *(was `cbs_napi_player`)* | `https://api.cbssports.com/napi/resource/player/{player_id}` | `player_id`\* | `date_format` → `dateFormat`, `year`, `resources` | `parse_cbs_list` | — |
| `cbs_player_combine_data` / `cbsPlayerCombineData` *(was `cbs_napi_player_combine_data`)* | `https://api.cbssports.com/napi/resource/player/combineData/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_player_depth_charts` / `cbsPlayerDepthCharts` *(was `cbs_depth_charts`, `cbs_napi_depth_charts`)* | `https://api.cbssports.com/napi/resource/player/depthCharts/{player_id}` | `player_id`\* | `position`, `pitch_pos` → `pitchPos` | `parse_cbs_list` | — |
| `cbs_player_draft_info` / `cbsPlayerDraftInfo` *(was `cbs_napi_player_draft_info`)* | `https://api.cbssports.com/napi/resource/player/draftInfo/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId` | `parse_cbs_list` | — |
| `cbs_player_encyclopedia` / `cbsPlayerEncyclopedia` *(was `cbs_napi_player_encyclopedia`)* | `https://api.cbssports.com/napi/resource/player/encyclopedia/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_id` → `seasonId` | `parse_cbs_list` | — |
| `cbs_player_futures` / `cbsPlayerFutures` *(was `cbs_napi_player_futures`)* | `https://api.cbssports.com/napi/resource/player/futures/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_player_game_stats` / `cbsPlayerGameStats` *(was `cbs_napi_player_game_stats`)* | `https://api.cbssports.com/napi/resource/player/gameStats/{player_id}` | `player_id`\* | `game_id` → `gameId`, `season_year` → `seasonYear`, `season_type` → `seasonType` | `parse_cbs_list` | — |
| `cbs_player_hockey_meta` / `cbsPlayerHockeyMeta` *(was `cbs_hockey_player_meta`, `cbs_napi_hockey_player_meta`)* | `https://api.cbssports.com/napi/resource/player/hockey/meta/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_player_injuries` / `cbsPlayerInjuries` *(was `cbs_napi_player_injuries`)* | `https://api.cbssports.com/napi/resource/player/injuries/{player_id}` | `player_id`\* | `date_format` → `dateFormat` | `parse_cbs_list` | — |
| `cbs_player_meta_baseball` / `cbsPlayerMetaBaseball` *(was `cbs_baseball_player_meta`, `cbs_napi_baseball_player_meta`)* | `https://api.cbssports.com/napi/resource/player/meta/baseball/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_player_meta_golf` / `cbsPlayerMetaGolf` *(was `cbs_player_golf_metadata`, `cbs_napi_player_golf_metadata`)* | `https://api.cbssports.com/napi/resource/player/meta/golf/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_player_outlook` / `cbsPlayerOutlook` *(was `cbs_napi_player_outlook`)* | `https://api.cbssports.com/napi/resource/player/outlook/{player_id}` | `player_id`\* | `date_format` → `dateFormat` | `parse_cbs_list` | — |
| `cbs_player_position_rankings` / `cbsPlayerPositionRankings` *(was `cbs_position_rankings`, `cbs_napi_position_rankings`)* | `https://api.cbssports.com/napi/resource/player/positionRankings/{player_id}` | `player_id`\* | `position` | `parse_cbs_list` | — |
| `cbs_player_rankings` / `cbsPlayerRankings` *(was `cbs_napi_player_rankings`)* | `https://api.cbssports.com/napi/resource/player/rankings/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `is_current` → `isCurrent`, `categories` | `parse_cbs_list` | — |
| `cbs_player_recruit_associations` / `cbsPlayerRecruitAssociations` *(was `cbs_recruit_team_associations`, `cbs_napi_recruit_team_associations`)* | `https://api.cbssports.com/napi/resource/player/recruitAssociations/{player_id}` | `player_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_player_standings` / `cbsPlayerStandings` *(was `cbs_napi_player_standings`)* | `https://api.cbssports.com/napi/resource/player/standings/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `is_current` → `isCurrent`, `resources` | `parse_cbs_standings` | — |
| `cbs_player_stats` / `cbsPlayerStats` *(was `cbs_napi_player_stats`)* | `https://api.cbssports.com/napi/resource/player/stats/{player_id}` | `player_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `is_current` → `isCurrent`, `team_id` → `teamId`, `team_abbr` → `teamAbbr`, `is_total` → `isTotal` | `parse_cbs_list` | — |
| `cbs_player_team_associations` / `cbsPlayerTeamAssociations` *(was `cbs_napi_player_team_associations`)* | `https://api.cbssports.com/napi/resource/player/teamAssociations/{player_id}` | `player_id`\* | `assoc_type` → `assocType`, `roster_status` → `rosterStatus`, `resources` | `parse_cbs_list` | — |
| `cbs_player_transactions` / `cbsPlayerTransactions` *(was `cbs_napi_player_transactions`)* | `https://api.cbssports.com/napi/resource/player/transactions/{player_id}` | `player_id`\* | `date_format` → `dateFormat`, `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `resources` | `parse_cbs_list` | — |
| `cbs_recruit_rankings` / `cbsRecruitRankings` *(was `cbs_napi_recruit_rankings`)* | `https://api.cbssports.com/napi/resource/recruit/rankings/{player_id}` | `player_id`\* | — | `parse_cbs_list` | — |
| `cbs_season` / `cbsSeason` *(was `cbs_napi_season`)* | `https://api.cbssports.com/napi/resource/season/{season_id}` | `season_id`\* | `date_format` → `dateFormat`, `resources` | `parse_cbs_list` | — |
| `cbs_season_teams` / `cbsSeasonTeams` *(was `cbs_napi_season_teams`)* | `https://api.cbssports.com/napi/resource/season/teams/{season_id}` | `season_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_sport` / `cbsSport` *(was `cbs_napi_sport`)* | `https://api.cbssports.com/napi/resource/sport/{sport_id}` | `sport_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_sport_leagues` / `cbsSportLeagues` *(was `cbs_napi_sport_leagues`)* | `https://api.cbssports.com/napi/resource/sport/leagues/{sport_id}` | `sport_id`\* | — | `parse_cbs_list` | — |
| `cbs_team_futures` / `cbsTeamFutures` *(was `cbs_napi_team_futures`)* | `https://api.cbssports.com/napi/resource/team/futures/{team_id}` | `team_id`\* | — | `parse_cbs_list` | — |
| `cbs_team_metadata` / `cbsTeamMetadata` *(was `cbs_napi_team_metadata`)* | `https://api.cbssports.com/napi/resource/team/metadata/{team_id}` | `team_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_team_players` / `cbsTeamPlayers` *(was `cbs_napi_team_players`)* | `https://api.cbssports.com/napi/resource/team/players/{team_id}` | `team_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_team_polls` / `cbsTeamPolls` *(was `cbs_napi_team_polls`)* | `https://api.cbssports.com/napi/resource/team/polls/{team_id}` | `team_id`\* | `polls`, `season_id` → `seasonId` | `parse_cbs_list` | — |
| `cbs_team_rankings` / `cbsTeamRankings` *(was `cbs_napi_team_rankings`)* | `https://api.cbssports.com/napi/resource/team/rankings/{team_id}` | `team_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId` | `parse_cbs_list` | — |
| `cbs_team_rankings_sportsline` / `cbsTeamRankingsSportsline` *(was `cbs_sports_line_team_rankings`, `cbs_napi_sports_line_team_rankings`)* | `https://api.cbssports.com/napi/resource/team/rankings/sportsline/{team_id}` | `team_id`\* | — | `parse_cbs_list` | — |
| `cbs_team_seasons` / `cbsTeamSeasons` *(was `cbs_napi_team_seasons`)* | `https://api.cbssports.com/napi/resource/team/seasons/{team_id}` | `team_id`\* | `date_format` → `dateFormat`, `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `resources` | `parse_cbs_list` | — |
| `cbs_team_standings` / `cbsTeamStandings` *(was `cbs_napi_team_standings`)* | `https://api.cbssports.com/napi/resource/team/standings/{team_id}` | `team_id`\* | `year`, `season_type` → `seasonType`, `season_id` → `seasonId` | `parse_cbs_standings` | — |
| `cbs_team_standings_sportsline` / `cbsTeamStandingsSportsline` *(was `cbs_sports_line_team_standings`, `cbs_napi_sports_line_team_standings`)* | `https://api.cbssports.com/napi/resource/team/standings/sportsline/{team_id}` | `team_id`\* | `date_format` → `dateFormat` | `parse_cbs_standings` | — |
| `cbs_team_stats` / `cbsTeamStats` *(was `cbs_napi_team_stats`)* | `https://api.cbssports.com/napi/resource/team/stats/{team_id}` | `team_id`\* | `season_year` → `seasonYear`, `season_type` → `seasonType`, `season_id` → `seasonId`, `is_current` → `isCurrent` | `parse_cbs_list` | — |
| `cbs_venue` / `cbsVenue` *(was `cbs_napi_venue`)* | `https://api.cbssports.com/napi/resource/venue/{venue_id}` | `venue_id`\* | `resources` | `parse_cbs_list` | — |
| `cbs_venue_metadata` / `cbsVenueMetadata` *(was `cbs_napi_venue_metadata`)* | `https://api.cbssports.com/napi/resource/venue/metadata/{venue_id}` | `venue_id`\* | — | `parse_cbs_list` | — |

### Returns — `cbs_endpoint_registry` / `cbsEndpointRegistry`

| col_name | type | description |
|---|---|---|
| `key` | character | Registry key for the endpoint, which is CBS's internal resource class name such as BoxscoreResource or PlayerResource; the parser lifts it out of the payload's top-level key into a column. |
| `location` | character |  |
| `route` | character |  |
| `path` | character | OpenAPI-style request path for the endpoint with brace placeholders, e.g. /resource/game/boxscore/\{gameId\}. |
| `summary` | character |  |
| `notes` | character |  |
| `methods` | character | JSON-encoded list of HTTP verbs the endpoint accepts; every entry in the captured registry allows GET only. |
| `formats` | character | JSON-encoded list of response serialisations the endpoint can emit, json throughout the captured registry. |
| `parameters` | character | JSON-encoded list of parameter descriptors, each carrying name, required, dataType, paramType (path or query), an optional allowedValues enumeration and CBS's own prose description. |
| `versions_allowed` | character | JSON-encoded list of API versions the endpoint will serve, e.g. ["v1"]. |
| `versions_current` | character | API version the endpoint serves when the caller does not pin one, e.g. v1. |
| `auth_settings_require_auth` | logical | Whether CBS's registry marks the endpoint as requiring an authenticated client; the data-backed resources stay anonymously reachable in practice even where this is true. |
| `auth_settings_allow_only` | character | JSON-encoded list of CBS client identifiers allow-listed for the endpoint, e.g. mweb, mobile, fantasy, prism. |
| `resource_cache_ns` | character | Cache namespace CBS files the endpoint's responses under, e.g. FINALBOXSCORE or PLAYERTEAMASSOCIATION. |
| `resource_cache_cache_keys` | character | JSON-encoded list of request parameters that compose the endpoint's cache key, e.g. ["gameId"]. |
| `resource_cache_cache_buster` | integer | Generation counter CBS bumps to invalidate every cached response for the endpoint. |
| `expiration_message_object_key_name` | character | Payload key CBS quotes back in the endpoint's cache-expiration message, e.g. objectKey, playerId or teamId. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_game_scoring_drives` / `cbsGameScoringDrives`

| col_name | type | description |
|---|---|---|
| `id` | character | CBS drive number within the game; joins drive_id of the scoring-plays frame. |
| `team_id` | character | CBS team id of the offense on the drive. |
| `quarter` | integer | Period in which the drive started. |
| `starting_time` | character | Game clock (m:ss) at the drive's first snap. |
| `ending_time` | character | Game clock (m:ss) at the drive's last play. |
| `time_of_possession` | character | Drive duration as m:ss. |
| `starting_yardline` | character | Field position where the drive started, team abbreviation plus yard line (e.g. TEXAS 22). |
| `ending_yardline` | character | Field position where the drive ended, team abbreviation plus yard line (e.g. TEXAS 18). |
| `starting_play_id` | character | CBS play id of the drive's first play; joins id of the scoring-plays frame. |
| `ending_play_id` | character | CBS play id of the drive's last play; joins id of the scoring-plays frame. |
| `drive_plays` | integer | Number of plays CBS counts in the drive. |
| `yards_on_drive` | integer | Net yards gained on the drive. |
| `drive_yards_total` | integer | Total drive yardage as CBS reports it, penalties included. |
| `penalty_yards` | integer | Penalty yards assessed on the drive. |
| `first_downs_on_drive` | integer | First downs gained on the drive. |
| `inside_the_20` | logical | True when the drive reached the opponent's 20-yard line (CBS "Yes"/"No" flag). |
| `score_on_drive` | logical | True when the drive produced a score (CBS "Yes"/"No" flag). |
| `result` | character | Drive outcome label from CBS (Punt, Touchdown, Field Goal, Downs, Fumble, End of Half, ...). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_game_scoring_plays` / `cbsGameScoringPlays`

| col_name | type | description |
|---|---|---|
| `id` | character | CBS play id; the GSIS play id for NFL games, an epoch-style stamp for NCAAF games. |
| `game_id` | character | CBS game id (null for older games, which lack it). |
| `drive_id` | character | CBS drive number within the game; joins id of the scoring-drives frame. |
| `quarter` | integer | Period of the snap. |
| `time_remaining` | character | Game clock (m:ss) at the snap. |
| `down` | integer | Down at the snap; 0 on kickoffs and tries. |
| `distance` | character | Yards to go for a first down, or the literal "Goal" on goal-to-go downs. |
| `side` | character | Team abbreviation naming the half of the field that yardline refers to. |
| `yardline` | integer | Yard line of the ball on the side team's half of the field. |
| `team_in_possession` | integer | CBS team id with the ball at the snap. |
| `description` | character | Full CBS play text, including tacklers and spots. |
| `medium` | character | Medium-length play summary (e.g. "J. Sayin pass to M. Williams for 6 yds"). |
| `short` | character | Short play summary (e.g. "6 yd pass"). |
| `score_on_play` | logical | True when the play scored (CBS "Yes"/"No" flag). |
| `score_type` | character | Scoring type for a scoring play (Touchdown, FieldGoal, ...); null otherwise. |
| `short_score` | character | Short scoring summary; empty string when the play did not score. |
| `under_review` | logical | True when the play was under replay review (CBS "Yes"/"No" flag). |
| `home_timeouts_remaining` | integer | Home team's timeouts left after the play (null for older games, which lack it). |
| `away_timeouts_remaining` | integer | Away team's timeouts left after the play (null for older games, which lack it). |
| `real_clock` | character | UTC wall-clock timestamp of the play in ISO 8601 (null for older games, which lack it). |
| `subplays` | character | Sub-events of the play as a list of structs: type, order, and the event fields (player ids and names, yards_on_play, yards_to_endzone, team_in_possession). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_league` / `cbsLeague`

| col_name | type | description |
|---|---|---|
| `league_id` | character | League ID. |
| `league_abbr` | character | League abbreviation. |
| `league_name` | character | League name. |
| `sport_id` | character | Sport ID. |
| `league_type` | character | League type. |
| `teams` | character | Teams. |
| `color_primary` | character | Color primary. |
| `color_secondary` | character | Color secondary. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_season_teams` / `cbsSeasonTeams`

| col_name | type | description |
|---|---|---|
| `team_id` | character | Team ID. |
| `stub_hub_team_id` | character | Stub hub team ID. |
| `location` | character | Location. |
| `nick_name` | character | Nick name. |
| `medium_name` | character | Medium name. |
| `short_name` | character | Short name. |
| `abbrev` | character | Abbrev. |
| `status` | character | Status. |
| `home_venue_id` | character | Home venue ID. |
| `conference_id` | character | Conference ID. |
| `league_id` | character | League ID. |
| `division_id` | character | Division ID. |
| `ticket_url` | character | Ticket URL. |
| `color_hex_dex` | character | Color hex dex. |
| `color_primary_hex` | character | Color primary hex. |
| `color_secondary_hex` | character | Color secondary hex. |
| `players` | character | Players. |
| `league` | character | League. |
| `standings` | character | Standings. |
| `conference` | character | Conference. |
| `division` | character | Division. |
| `team_seasons` | character | Team seasons. |
| `polls` | character | Polls. |
| `home_venue` | character | Home venue. |
| `sports_line_standings` | character | Sports line standings. |
| `team_stats` | character | Team stats. |
| `team_rankings` | character | Team rankings. |
| `sports_line_rankings` | character | Sports line rankings. |
| `meta_tsa_overlay` | logical | Meta tsa overlay. |
| `meta_season_id` | character | Meta season ID. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_team_players` / `cbsTeamPlayers`

| col_name | type | description |
|---|---|---|
| `player_id` | character | Player ID. |
| `first_name` | character | First name. |
| `full_first_name` | character | Full first name. |
| `last_name` | character | Last name. |
| `full_last_name` | character | Full last name. |
| `nick_name` | character | Nick name. |
| `height` | character | Height. |
| `weight` | integer | Weight. |
| `experience` | integer | Experience. |
| `school` | character | School. |
| `home_town` | character | Home town. |
| `debut` | character | Debut. |
| `birth_date` | character | Birth date. |
| `birth_country` | character | Birth country. |
| `birth_country_code` | character | Birth country code. |
| `nationality_country` | character | Nationality country. |
| `nationality_country_code` | character | Nationality country code. |
| `locked` | integer | Locked. |
| `player_team_associations` | character | Player team associations. |
| `injuries` | character | Injuries. |
| `transactions` | character | Transactions. |
| `depth_charts` | character | Depth charts. |
| `position_rankings` | character | Position rankings. |
| `player_stats` | character | Player stats. |
| `standings` | character | Standings. |
| `rankings` | character | Rankings. |
| `player_outlook` | character | Player outlook. |
| `meta_data` | character | Meta data. |
| `draft_info` | character | Draft info. |
| `game_stats` | character | Game stats. |
| `combine_data` | character | Combine data. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `cbs_team_standings` / `cbsTeamStandings`

| col_name | type | description |
|---|---|---|
| `season_year` | integer |  |
| `season_type` | character |  |
| `win_loss_record` | character | JSON-encoded array of the team's split records, one object per split carrying wins, losses, ties (plus shootout and overtime splits in the NHL) with a name and a type such as home, away, division, conference or last5. |
| `season_id` | character |  |
| `wins_number` | integer | Wins the team recorded over the season and season type of this row. |
| `team_code_id` | character | League-scoped team code on the US-league standings shape, a small per-league sequence (3 for the Angels, 34 for the Texans) rather than the global id. |
| `team_code_global_id` | character | CBS global team identifier on the US-league standings shape, e.g. 227 for the Angels and 325 for the Texans. |
| `clinched_division_clinched` | logical | Whether the team has clinched its division. |
| `team_city_city` | character | City CBS attributes the team to on the US-league standings shape, e.g. Houston. |
| `clinched_playoffs_clinched` | logical | Whether the team has clinched a playoff berth, on the NFL standings shape. |
| `games_back_number` | double | Games behind the leader of the team's standings group; typed as text because CBS emits a dash on rows where it does not compute one. |
| `winning_percentage_percentage` | character | Winning percentage as CBS formats it, a leading-dot three-decimal string such as .706. |
| `strength_of_schedule_rank` | character | Team's rank by strength of schedule on the NFL standings shape; typed as text because CBS emits a dash on rows where it publishes none. |
| `streak_kind` | character | Direction of the team's current run when CBS returns a single streak object, e.g. winning or losing (the NHL returns an array instead, kept in the streak column). |
| `streak_games` | integer | Length in games of the current run described by streak_kind. |
| `losses_number` | integer | Losses the team recorded over the season and season type of this row. |
| `points_for_number` | integer | Points the team scored, on the NFL standings shape. |
| `points_against_number` | integer | Points the team conceded, on the NFL standings shape. |
| `today_games_included_through` | logical | Whether the standings figures already account for games played today. |
| `clinched_home_field_clinched` | logical | Whether the team has clinched home-field advantage through the playoffs, on the NFL standings shape. |
| `ties_number` | integer | Ties (draws) the team recorded; 0 in the leagues that no longer play to a tie, and typed as text because CBS emits an empty string where the concept does not apply. |
| `wc_games_back_number` | character | Games behind the last wild-card position, on the MLB standings shape. |
| `eliminated_from_playoffs_eliminated` | logical | Whether the team has been eliminated from playoff contention. |
| `team_name_name` | character | Nickname CBS uses for the team on the US-league standings shape, e.g. Texans or Angels. |
| `team_name_alias` | character | Short alias for the team on the US-league standings shape, e.g. Hou or LAA. |
| `conference_seed_seed` | character | Team's current seeding within its conference bracket. |
| `place_place` | integer | Position the team occupies in the standings table it is ranked within, 1 being top. |
| `season_season_id` | character | CBS season identifier for the standings row, an eight-digit id on modern rows (29444245 for the 2025 NFL regular season) and a small legacy number on the oldest ones. |
| `season_sport_id` | character | CBS sport identifier for the season (1 football, 2 baseball, 3 basketball, 4 hockey, 5 soccer). |
| `season_league_id` | character | CBS league identifier for the season, e.g. 59 for the NFL, 60 for the NHL, 52 for MLB. |
| `season_league` | character | League record nested inside the season block; CBS returns it as null on every captured standings payload. |
| `season_teams` | character | Team list nested inside the season block; CBS returns it as an empty array on standings payloads, JSON-encoded to []. |
| `season_season_year` | integer | Calendar year CBS keys the season by, matching the year key the standings block was nested under. |
| `season_is_current` | integer | Flag marking the season as the one currently under way (1 current, 0 historical). |
| `season_season_type` | character | Portion of the season the row covers, one of pre, regular or post. |
| `season_season_type_desc` | character | Human-readable label for season_season_type, e.g. Regular season. |
| `season_season_start_date` | character | First day of the season formatted MM-DD-YYYY HH:MM:SS with a UTC offset, e.g. 09-04-2025 00:00:00 -0400. |
| `season_season_end_date` | character | Last day of the season in the same MM-DD-YYYY HH:MM:SS plus UTC-offset format, e.g. 01-04-2026 23:59:59 -0500. |
| `clinched_first_round_bye_clinched` | logical | Whether the team has clinched a first-round playoff bye, on the NFL standings shape. |
| `content` | character | Raw markup fragment CBS emits on some NFL standings blocks; the captured rows carry only the string /\> and it holds no standings meaning. |
| `clinched_playoffs_date_date` | integer | Day of the month on which the team clinched a playoff berth. |
| `clinched_playoffs_date_month` | integer | Month of the date on which the team clinched a playoff berth, 1 through 12. |
| `clinched_playoffs_date_year` | integer | Year of the date on which the team clinched a playoff berth, on the NFL standings shape. |
| `clinched_playoffs_date_day` | integer | Day-of-week component CBS emits alongside the clinch date; the one captured NFL row pairs 6 with Saturday 12-27-2025, an ISO Monday-is-1 index. |
| `streak` | character |  |
| `overtime_losses_number` | integer | Losses the team took in overtime, on the NHL standings shape. |
| `goals_against_goals` | integer | Goals conceded by the team, on the soccer and hockey standings shapes. |
| `regulation_plus_overtime_wins_number` | integer | Wins the team earned in regulation or overtime, excluding shootout wins, on the NHL standings shape. |
| `shootout_losses_number` | integer | Losses the team took in a shootout, on the NHL standings shape. |
| `overtime_wins_number` | integer | Wins the team earned in overtime, on the NHL standings shape. |
| `elimination_number_number` | character | Elimination number for the team, the combined team losses and rival wins that would end its contention; 0 once the outcome is settled, and typed as text because CBS emits an empty string where it does not compute one. |
| `games_played_games` | integer | Games the team has played in the season and season type of this row. |
| `team_points_number` | integer | Standings points the team has accumulated on the NHL shape (two per win, one per overtime or shootout loss). |
| `shootout_wins_number` | integer | Wins the team earned in a shootout, on the NHL standings shape. |
| `regulation_wins_number` | integer | Wins the team earned in regulation time, on the NHL standings shape. |
| `goals_for_goals` | integer | Goals the team scored, on the soccer and hockey standings shapes. |
| `team_city_alternate` | character | Alternate city spelling CBS carries for the team on the NHL standings shape, which usually repeats team_city_city. |
| `magic_number_number` | character | Magic number CBS publishes for the team's clinching scenario; 0 or negative once the scenario no longer applies to a clinched team, and an empty string on rows where CBS computes none (preseason blocks). |
| `wild_card_rank_rank` | integer | Team's rank in the wild-card race, on the MLB and NHL standings shapes. |
| `hockey_nhl_conference_ranking_ranking` | integer | Team's ranking within its NHL conference; typed as text because CBS emits both integers and zero-padded strings such as 05. |
| `league_rank_rank` | integer | Team's rank across the whole league, 1 being best. |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/cbs.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
