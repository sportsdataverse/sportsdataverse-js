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

:::


# `sdv.nhl` — Native (non-ESPN) APIs

Beyond the ESPN surface, `sdv.nhl` also wraps the league's own live APIs. Same `{ parsed: true }` contract; each method is exposed under both snake_case and camelCase on `sdv.nhl`.

## Native API — NHL api-web (game feed)

Flat (non-ESPN) wrappers for the modern NHL game-feed API. Host: `https://api-web.nhle.com`. Each method is exposed under BOTH its snake_case name `nhl_<endpoint>` (`nhl_web_<endpoint>` where sdv-py's name is taken) (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.nhl`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `nhl_boxscore` / `nhlBoxscore` *(was `nhl_api_web_boxscore`)* | `https://api-web.nhle.com/v1/gamecenter/{game_id}/boxscore` | `game_id`\* | — | `parse_nhl_web_boxscore` | — |
| `nhl_club_schedule_month` / `nhlClubScheduleMonth` *(was `nhl_api_web_club_schedule_month`)* | `https://api-web.nhle.com/v1/club-schedule/{team}/month/{month}` | `team`\*, `month` | — | `parse_nhl_web_club_schedule` | — |
| `nhl_club_schedule_season` / `nhlClubScheduleSeason` *(was `nhl_api_web_club_schedule_season`)* | `https://api-web.nhle.com/v1/club-schedule-season/{team}/{season}` | `team`\*, `season` | — | `parse_nhl_web_club_schedule` | — |
| `nhl_club_schedule_week` / `nhlClubScheduleWeek` *(was `nhl_api_web_club_schedule_week`)* | `https://api-web.nhle.com/v1/club-schedule/{team}/week/{date}` | `team`\*, `date` | — | `parse_nhl_web_club_schedule` | — |
| `nhl_club_stats` / `nhlClubStats` *(was `nhl_api_web_club_stats`)* | `https://api-web.nhle.com/v1/club-stats/{team}/{season}/{game_type}` | `team`\*, `season`, `game_type` | — | `parse_nhl_web_club_stats` | — |
| `nhl_club_stats_season` / `nhlClubStatsSeason` *(was `nhl_api_web_club_stats_season`)* | `https://api-web.nhle.com/v1/club-stats-season/{team}` | `team`\* | — | `parse_nhl_web_club_stats` | — |
| `nhl_draft_picks` / `nhlDraftPicks` *(was `nhl_api_web_draft_picks`)* | `https://api-web.nhle.com/v1/draft/picks/{year}/{round_}` | `year`\*, `round_` | — | `parse_nhl_web_draft_picks` | — |
| `nhl_draft_picks_now` / `nhlDraftPicksNow` *(was `nhl_api_web_draft_picks_now`)* | `https://api-web.nhle.com/v1/draft/picks/now` | — | — | `parse_nhl_web_draft_picks` | — |
| `nhl_draft_rankings` / `nhlDraftRankings` *(was `nhl_api_web_draft_rankings`)* | `https://api-web.nhle.com/v1/draft/rankings/{year}/{category}` | `year`\*, `category` | — | `parse_nhl_web_draft_rankings` | — |
| `nhl_draft_rankings_now` / `nhlDraftRankingsNow` *(was `nhl_api_web_draft_rankings_now`)* | `https://api-web.nhle.com/v1/draft/rankings/now` | — | — | `parse_nhl_web_draft_rankings` | — |
| `nhl_draft_tracker_picks_now` / `nhlDraftTrackerPicksNow` *(was `nhl_api_web_draft_tracker_picks_now`)* | `https://api-web.nhle.com/v1/draft-tracker/picks/now` | — | — | `parse_nhl_web_draft_picks` | — |
| `nhl_goalie_leaders` / `nhlGoalieLeaders` *(was `nhl_api_web_goalie_leaders`)* | `https://api-web.nhle.com/v1/goalie-stats-leaders/{season}/{game_type}` | `season`, `game_type` | — | `parse_nhl_web_leaders` | — |
| `nhl_landing` / `nhlLanding` *(was `nhl_api_web_landing`)* | `https://api-web.nhle.com/v1/gamecenter/{game_id}/landing` | `game_id`\* | — | `parse_nhl_web_landing` | — |
| `nhl_web_pbp` / `nhlWebPbp` *(was `nhl_api_web_pbp`)* | `https://api-web.nhle.com/v1/gamecenter/{game_id}/play-by-play` | `game_id`\* | — | `parse_nhl_web_pbp` | — |
| `nhl_player_game_log` / `nhlPlayerGameLog` *(was `nhl_api_web_player_game_log`)* | `https://api-web.nhle.com/v1/player/{player_id}/game-log/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_nhl_web_player_game_log` | — |
| `nhl_player_landing` / `nhlPlayerLanding` *(was `nhl_api_web_player_landing`)* | `https://api-web.nhle.com/v1/player/{player_id}/landing` | `player_id`\* | — | `parse_nhl_web_player_landing` | — |
| `nhl_player_spotlight` / `nhlPlayerSpotlight` *(was `nhl_api_web_player_spotlight`)* | `https://api-web.nhle.com/v1/player-spotlight` | — | — | `parse_nhl_web_player_spotlight` | — |
| `nhl_playoff_series` / `nhlPlayoffSeries` *(was `nhl_api_web_playoff_series`)* | `https://api-web.nhle.com/v1/schedule/playoff-series/{season}/{series_letter}` | `season`\*, `series_letter`\* | — | `parse_nhl_web_playoff_series` | — |
| `nhl_right_rail` / `nhlRightRail` *(was `nhl_api_web_right_rail`)* | `https://api-web.nhle.com/v1/gamecenter/{game_id}/right-rail` | `game_id`\* | — | `parse_nhl_web_right_rail` | — |
| `nhl_roster` / `nhlRoster` *(was `nhl_api_web_roster`)* | `https://api-web.nhle.com/v1/roster/{team}/{season}` | `team`\*, `season` | — | `parse_nhl_web_roster` | — |
| `nhl_roster_season` / `nhlRosterSeason` *(was `nhl_api_web_roster_season`)* | `https://api-web.nhle.com/v1/roster-season/{team}` | `team`\* | — | `parse_nhl_web_roster` | — |
| `nhl_web_schedule` / `nhlWebSchedule` *(was `nhl_api_web_schedule`)* | `https://api-web.nhle.com/v1/schedule/{date}` | `date` | — | `parse_nhl_web_schedule` | — |
| `nhl_schedule_calendar` / `nhlScheduleCalendar` *(was `nhl_api_web_schedule_calendar`)* | `https://api-web.nhle.com/v1/schedule-calendar/{date}` | `date` | — | `parse_nhl_web_schedule` | — |
| `nhl_score` / `nhlScore` *(was `nhl_api_web_score`)* | `https://api-web.nhle.com/v1/score/{date}` | `date` | — | `parse_nhl_web_score` | — |
| `nhl_skater_leaders` / `nhlSkaterLeaders` *(was `nhl_api_web_skater_leaders`)* | `https://api-web.nhle.com/v1/skater-stats-leaders/{season}/{game_type}` | `season`, `game_type` | — | `parse_nhl_web_leaders` | — |
| `nhl_standings` / `nhlStandings` *(was `nhl_api_web_standings`)* | `https://api-web.nhle.com/v1/standings/{date}` | `date` | — | `parse_nhl_web_standings` | — |
| `nhl_standings_season` / `nhlStandingsSeason` *(was `nhl_api_web_standings_season`)* | `https://api-web.nhle.com/v1/standings-season` | — | — | `parse_nhl_web_standings_season` | — |

### Returns — `nhl_boxscore` / `nhlBoxscore`

| col_name | type | description |
|---|---|---|
| `home_away` | character | Home or away indicator. |
| `position_group` | character | Position group name (e.g. Centers). |
| `player_id` | integer | Unique player identifier. |
| `sweater_number` | integer | Jersey number. |
| `position` | character | Player position. |
| `goals` | double | Goals scored. |
| `assists` | double | Assists. |
| `points` | double | Total points (goals + assists). |
| `plus_minus` | double | Plus/minus rating. |
| `pim` | integer | Penalty minutes. |
| `hits` | double | Hits. |
| `power_play_goals` | double | Power-play goals. |
| `sog` | double | Shots on goal from the area. |
| `faceoff_winning_pctg` | double | Faceoff win percentage. |
| `toi` | character | Time on ice. |
| `blocked_shots` | double | Blocked shots. |
| `shifts` | double | Number of shifts. |
| `giveaways` | double | Giveaways. |
| `takeaways` | double | Takeaways. |
| `name_default` | character | Player name (default localization). |
| `even_strength_shots_against` | character | Even-strength shots against (saves/total). |
| `power_play_shots_against` | character | Power-play shots against (saves/total). |
| `shorthanded_shots_against` | character | Shorthanded shots against (saves/total). |
| `save_shots_against` | character | Total shots against (saves/total). |
| `even_strength_goals_against` | double | Even-strength goals against. |
| `power_play_goals_against` | double | Power-play goals against. |
| `shorthanded_goals_against` | double | Shorthanded goals against. |
| `goals_against` | double | Goals against. |
| `starter` | logical | Whether the goalie started the game. |
| `shots_against` | double | Shots faced. |
| `saves` | double | Saves made. |
| `save_pctg` | double | Save percentage. |
| `decision` | character | Goalie decision (W/L/O). |
| `name_cs` | character | Player name (Czech localization). |
| `name_fi` | character | Player name (Finnish localization). |
| `name_sk` | character | Player name (Slovak localization). |

**Row type:** `NhlApiWebBoxscoreRow` (exported from the package root).

### Returns — `nhl_club_schedule_season` / `nhlClubScheduleSeason`

| col_name | type | description |
|---|---|---|
| `club_previous_season` | integer | Indicator for whether the game belongs to the club's prior completed season (1 = previous season, 0 otherwise). |
| `club_current_season` | integer | Indicator for whether the game falls within the current season for the requesting club (1 = current season, 0 otherwise). |
| `club_next_season` | integer | Indicator for whether the game belongs to the club's next upcoming season (1 = next season, 0 otherwise). |
| `club_timezone` | character | IANA timezone identifier for the home club's arena, used to localise game start times in the schedule. |
| `id` | integer | Unique player identifier. |
| `season` | integer | Season year (echoed from arg). |
| `game_type` | integer | Game type the row belongs to. |
| `game_date` | character | Game date. |
| `neutral_site` | logical | Whether the game is at a neutral site. |
| `start_time_utc` | character | Scheduled start time in UTC. |
| `eastern_utc_offset` | character | Eastern time UTC offset. |
| `venue_utc_offset` | character | Venue UTC offset. |
| `venue_timezone` | character | Venue time zone. |
| `game_state` | character | Game state (e.g., FINAL, LIVE). |
| `game_schedule_state` | character | Schedule state of the game. |
| `tv_broadcasts` | character | Nested list of TV broadcast details. |
| `game_center_link` | character | Link to the NHL game center page. |
| `venue_default` | character | Venue name (default language). |
| `away_team_id` | integer | Away team identifier. |
| `away_team_common_name_default` | character | Away team common name (default language). |
| `away_team_place_name_default` | character | Away team place name (default language). |
| `away_team_place_name_with_preposition_default` | character | Away team place name with preposition (default). |
| `away_team_place_name_with_preposition_fr` | character | Away team place name with preposition (French). |
| `away_team_abbrev` | character | Away team abbreviation. |
| `away_team_logo` | character | URL to the away team logo. |
| `away_team_dark_logo` | character | URL to the away team dark logo. |
| `away_team_away_split_squad` | logical | Whether the away team is a split squad. |
| `away_team_score` | integer | Away team final score. |
| `home_team_id` | integer | Home team identifier. |
| `home_team_common_name_default` | character | Home team common name (default language). |
| `home_team_place_name_default` | character | Home team place name (default language). |
| `home_team_place_name_with_preposition_default` | character | Home team place name with preposition (default). |
| `home_team_place_name_with_preposition_fr` | character | Home team place name with preposition (French). |
| `home_team_abbrev` | character | Home team abbreviation. |
| `home_team_logo` | character | URL to the home team logo. |
| `home_team_dark_logo` | character | URL to the home team dark logo. |
| `home_team_home_split_squad` | logical | Whether the home team is a split squad. |
| `home_team_airline_link` | character | Link to home team airline info. |
| `home_team_airline_desc` | character | Home team airline description. |
| `home_team_hotel_link` | character | Link to home team hotel info. |
| `home_team_hotel_desc` | character | Home team hotel description. |
| `home_team_score` | integer | Home team final score. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `game_outcome_last_period_type` | character | Period type in which the game ended. |
| `winning_goalie_player_id` | integer | Winning goalie player identifier. |
| `winning_goalie_first_initial_default` | character | Winning goalie first initial (default language). |
| `winning_goalie_last_name_default` | character | Winning goalie last name (default language). |
| `away_team_airline_link` | character | Link to away team airline info. |
| `away_team_airline_desc` | character | Away team airline description. |
| `winning_goal_scorer_player_id` | double | Winning goal scorer player identifier. |
| `winning_goal_scorer_first_initial_default` | character | Winning goal scorer first initial (default). |
| `winning_goal_scorer_last_name_default` | character | Winning goal scorer last name (default language). |
| `three_min_recap` | character | Link to the three-minute recap. |
| `home_team_place_name_fr` | character | Home team place name (French). |
| `condensed_game` | character | Link to the condensed game video. |
| `venue_es` | character | Venue name (Spanish). |
| `venue_fr` | character | Venue name (French). |
| `special_event_parent_id` | double | NHL api-web identifier for the parent special-event record grouping multiple games under the same marquee event umbrella. |
| `special_event_name_default` | character | English display name for a special promotional or marquee event designation attached to the game (e.g., 'Winter Classic', 'Heritage Classic'). |
| `special_event_name_fr` | character | French display name for a special promotional or marquee event designation attached to the game, used in bilingual NHL communications. |
| `away_team_hotel_link` | character | Link to away team hotel info. |
| `away_team_hotel_desc` | character | Away team hotel description. |
| `three_min_recap_fr` | character | Link to the French three-minute recap. |
| `winning_goalie_last_name_cs` | character | Winning goalie last name (Czech). |
| `winning_goalie_last_name_fi` | character | Winning goalie last name (Finnish). |
| `winning_goalie_last_name_sk` | character | Winning goalie last name (Slovak). |
| `away_team_place_name_fr` | character | Away team place name (French). |
| `away_team_common_name_fr` | character | Away team common name (French). |
| `home_team_common_name_fr` | character | Home team common name (French). |
| `series_url` | character | NHL api-web URL path to the dedicated page for the current playoff series associated with this scheduled game. |
| `series_status_round` | double | Playoff round number to which the current series belongs (1 = first round, 4 = Stanley Cup Final). |
| `series_status_series_abbrev` | character | Short abbreviation identifying the specific playoff series slot (e.g., 'A', 'B') within the bracket for this game. |
| `series_status_series_title` | character | Human-readable display title for the playoff series (e.g., 'Eastern Conference First Round'). |
| `series_status_series_letter` | character | Single-letter label assigned to the playoff series in the bracket structure, used to pair teams across rounds. |
| `series_status_needed_to_win` | double | Wins still required by the leading team to clinch and advance in the current playoff series. |
| `series_status_top_seed_wins` | double | Number of wins accumulated by the higher-seeded team in the current playoff series as of this scheduled game. |
| `series_status_bottom_seed_wins` | double | Number of wins accumulated by the lower-seeded team in the current playoff series as of this scheduled game. |
| `series_status_game_number_of_series` | double | Sequential game number within the playoff series (e.g., 1 through 7 for a best-of-seven). |

**Row type:** `NhlApiWebClubScheduleSeasonRow` (exported from the package root).

### Returns — `nhl_draft_picks` / `nhlDraftPicks`

| col_name | type | description |
|---|---|---|
| `round` | integer | Shootout round number. |
| `pick_in_round` | integer | Pick number within the round. |
| `overall_pick` | integer | Overall pick number in the draft. |
| `team_id` | integer | Unique team identifier. |
| `team_abbrev` | character | Team abbreviation. |
| `team_logo_light` | character | URL to the team logo (light variant). |
| `team_logo_dark` | character | URL to the team logo (dark variant). |
| `team_pick_history` | character | History of the team's picks at this slot. |
| `position_code` | character | Player position code. |
| `country_code` | character | Player country code. |
| `height` | integer | Player height in inches. |
| `weight` | integer | Player weight in pounds. |
| `amateur_league` | character | Amateur league the player played in. |
| `amateur_club_name` | character | Amateur club the player played for. |
| `team_name_default` | character | Team name (default locale). |
| `team_name_fr` | character | Team name (French locale). |
| `team_common_name_default` | character | Team common name (default language). |
| `team_place_name_with_preposition_default` | character | Team place name with preposition (default). |
| `team_place_name_with_preposition_fr` | character | Team place name with preposition (French). |
| `display_abbrev_default` | character | Short display abbreviation for the selected player's nationality or amateur league affiliation shown in the NHL draft picks listing. |
| `first_name_default` | character | Player first name (default language). |
| `last_name_default` | character | Player last name (default language). |
| `team_common_name_fr` | character | Team common name (French localization). |

**Row type:** `NhlApiWebDraftPicksRow` (exported from the package root).

### Returns — `nhl_draft_picks_now` / `nhlDraftPicksNow`

| col_name | type | description |
|---|---|---|
| `round` | integer | Shootout round number. |
| `pick_in_round` | integer | Pick number within the round. |
| `overall_pick` | integer | Overall pick number in the draft. |
| `team_id` | integer | Unique team identifier. |
| `team_abbrev` | character | Team abbreviation. |
| `team_logo_light` | character | URL to the team logo (light variant). |
| `team_logo_dark` | character | URL to the team logo (dark variant). |
| `team_pick_history` | character | History of the team's picks at this slot. |
| `position_code` | character | Player position code. |
| `country_code` | character | Player country code. |
| `height` | integer | Player height in inches. |
| `weight` | integer | Player weight in pounds. |
| `amateur_league` | character | Amateur league the player played in. |
| `amateur_club_name` | character | Amateur club the player played for. |
| `team_name_default` | character | Team name (default locale). |
| `team_name_fr` | character | Team name (French locale). |
| `team_common_name_default` | character | Team common name (default language). |
| `team_place_name_with_preposition_default` | character | Team place name with preposition (default). |
| `team_place_name_with_preposition_fr` | character | Team place name with preposition (French). |
| `display_abbrev_default` | character | Default-language display abbreviation for the team that currently holds this draft pick. |
| `first_name_default` | character | Player first name (default language). |
| `last_name_default` | character | Player last name (default language). |

**Row type:** `NhlApiWebDraftPicksNowRow` (exported from the package root).

### Returns — `nhl_draft_rankings` / `nhlDraftRankings`

| col_name | type | description |
|---|---|---|
| `draft_year` | integer | Draft year the lottery applies to. |
| `category_id` | integer | Prospect category identifier. |
| `category_key` | character | Machine-readable slug identifying the scouting or ranking category (e.g., 'north-american-skater', 'international-skater') that the prospect belongs to in the NHL draft rankings. |
| `last_name` | character | Player last name. |
| `first_name` | character | Player first name. |
| `position_code` | character | Player position code. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `height_in_inches` | integer | Height in inches. |
| `weight_in_pounds` | integer | Weight in pounds. |
| `last_amateur_club` | character | Prospect's most recent amateur club. |
| `last_amateur_league` | character | Prospect's most recent amateur league. |
| `birth_date` | character | Player birth date. |
| `birth_city` | character | Birth city. |
| `birth_state_province` | character | Birth state or province of the player. |
| `birth_country` | character | Player birth country. |
| `midterm_rank` | double | Prospect's midterm draft ranking. |
| `final_rank` | double | Prospect's final draft ranking. |

**Row type:** `NhlApiWebDraftRankingsRow` (exported from the package root).

### Returns — `nhl_draft_rankings_now` / `nhlDraftRankingsNow`

| col_name | type | description |
|---|---|---|
| `draft_year` | integer | Draft year the lottery applies to. |
| `category_id` | integer | Prospect category identifier. |
| `category_key` | character | Short identifier string for the scouting category or ranking list under which the prospect is evaluated (e.g., 'NA-SKATER', 'GOALIE'). |
| `last_name` | character | Player last name. |
| `first_name` | character | Player first name. |
| `position_code` | character | Player position code. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `height_in_inches` | integer | Height in inches. |
| `weight_in_pounds` | integer | Weight in pounds. |
| `last_amateur_club` | character | Prospect's most recent amateur club. |
| `last_amateur_league` | character | Prospect's most recent amateur league. |
| `birth_date` | character | Player birth date. |
| `birth_city` | character | Birth city. |
| `birth_state_province` | character | Birth state or province of the player. |
| `birth_country` | character | Player birth country. |
| `midterm_rank` | double | Prospect's midterm draft ranking. |
| `final_rank` | double | Prospect's final draft ranking. |

**Row type:** `NhlApiWebDraftRankingsNowRow` (exported from the package root).

### Returns — `nhl_draft_tracker_picks_now` / `nhlDraftTrackerPicksNow`

| col_name | type | description |
|---|---|---|
| `pick_in_round` | integer | Pick number within the round. |
| `overall_pick` | integer | Overall pick number in the draft. |
| `team_id` | integer | Unique team identifier. |
| `team_abbrev` | character | Team abbreviation. |
| `team_logo_light` | character | URL to the team logo (light variant). |
| `team_logo_dark` | character | URL to the team logo (dark variant). |
| `state` | character | Pick state (e.g., on the clock, complete). |
| `position_code` | character | Player position code. |
| `team_full_name_default` | character | Team full name (default language). |
| `team_full_name_fr` | character | Team full name (French). |
| `team_common_name_default` | character | Team common name (default language). |
| `team_place_name_with_preposition_default` | character | Team place name with preposition (default). |
| `team_place_name_with_preposition_fr` | character | Team place name with preposition (French). |
| `last_name_default` | character | Player last name (default language). |
| `first_name_default` | character | Player first name (default language). |

**Row type:** `NhlApiWebDraftTrackerPicksNowRow` (exported from the package root).

### Returns — `nhl_goalie_leaders` / `nhlGoalieLeaders`

| col_name | type | description |
|---|---|---|
| `category` | character | Stat leader category. |
| `id` | integer | Unique player identifier. |
| `sweater_number` | integer | Jersey number. |
| `headshot` | character | URL to the player headshot image. |
| `team_abbrev` | character | Team abbreviation. |
| `team_logo` | character | URL to the team logo image. |
| `position` | character | Player position. |
| `value` | integer | Leader stat numeric value. |
| `first_name_default` | character | Player first name (default language). |
| `last_name_default` | character | Player last name (default language). |
| `team_name_default` | character | Team name (default locale). |
| `first_name_cs` | character | Player first name (Czech localization). |
| `first_name_sk` | character | Player first name (Slovak localization). |
| `last_name_cs` | character | Player last name (Czech localization). |
| `last_name_sk` | character | Player last name (Slovak localization). |
| `last_name_fi` | character | Player last name (Finnish localization). |

**Row type:** `NhlApiWebGoalieLeadersRow` (exported from the package root).

### Returns — `nhl_landing` / `nhlLanding`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `season` | integer | Season year (echoed from arg). |
| `game_type` | integer | Game type the row belongs to. |
| `limited_scoring` | logical | Boolean flag indicating whether the game is subject to a limited-scoring designation (e.g., a low-scoring or shootout-resolved game) per NHL api-web metadata. |
| `game_date` | character | Game date. |
| `start_time_utc` | character | Scheduled start time in UTC. |
| `eastern_utc_offset` | character | Eastern time UTC offset. |
| `venue_utc_offset` | character | Venue UTC offset. |
| `venue_timezone` | character | Venue time zone. |
| `tv_broadcasts` | character | Nested list of TV broadcast details. |
| `game_state` | character | Game state (e.g., FINAL, LIVE). |
| `game_schedule_state` | character | Schedule state of the game. |
| `shootout_in_use` | logical | Boolean flag indicating whether a shootout is in use as the tiebreaker format for this game per NHL api-web game landing metadata. |
| `reg_periods` | integer | Number of regulation periods scheduled for this game (typically 3 for NHL, may differ for special-format games). |
| `ot_in_use` | logical | Boolean flag indicating whether overtime rules are in effect for this game, as determined by the NHL api-web game landing endpoint. |
| `ties_in_use` | logical | Whether ties were in use that season. |
| `venue_default` | character | Venue name (default language). |
| `venue_location_default` | character | Default-language display string for the city or location associated with the game's venue, as provided by the NHL api-web landing endpoint. |
| `period_descriptor_number` | integer | Period number. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `away_team_id` | integer | Away team identifier. |
| `away_team_common_name_default` | character | Away team common name (default language). |
| `away_team_abbrev` | character | Away team abbreviation. |
| `away_team_place_name_default` | character | Away team place name (default language). |
| `away_team_place_name_with_preposition_default` | character | Away team place name with preposition (default). |
| `away_team_place_name_with_preposition_fr` | character | Away team place name with preposition (French). |
| `away_team_score` | integer | Away team final score. |
| `away_team_sog` | integer | Away team shots on goal. |
| `away_team_logo` | character | URL to the away team logo. |
| `away_team_dark_logo` | character | URL to the away team dark logo. |
| `home_team_id` | integer | Home team identifier. |
| `home_team_common_name_default` | character | Home team common name (default language). |
| `home_team_abbrev` | character | Home team abbreviation. |
| `home_team_place_name_default` | character | Home team place name (default language). |
| `home_team_place_name_fr` | character | Home team place name (French). |
| `home_team_place_name_with_preposition_default` | character | Home team place name with preposition (default). |
| `home_team_place_name_with_preposition_fr` | character | Home team place name with preposition (French). |
| `home_team_score` | integer | Home team final score. |
| `home_team_sog` | integer | Home team shots on goal. |
| `home_team_logo` | character | URL to the home team logo. |
| `home_team_dark_logo` | character | URL to the home team dark logo. |
| `summary_scoring` | character | Serialized summary of scoring events for the game, flattened from the nested NHL api-web landing payload scoring sub-object. |
| `summary_three_stars` | character | Serialized representation of the three-star selections for the game, flattened from the nested NHL api-web landing payload. |
| `summary_penalties` | character | Serialized summary of penalty events for the game, flattened from the nested NHL api-web landing payload penalties sub-object. |
| `clock_time_remaining` | character | Remaining time in the current period formatted as MM:SS, as provided by the NHL api-web game landing endpoint. |
| `clock_seconds_remaining` | integer | Integer count of seconds remaining in the current period at the time the NHL api-web landing payload was captured. |
| `clock_running` | logical | Boolean flag indicating whether the game clock is actively counting down at the time the NHL api-web landing payload was captured. |
| `clock_in_intermission` | logical | Boolean flag indicating whether the game clock is currently paused during an intermission period between regulation periods. |

**Row type:** `NhlApiWebLandingRow` (exported from the package root).

### Returns — `nhl_web_pbp` / `nhlWebPbp`

| col_name | type | description |
|---|---|---|
| `event_id` | integer | ESPN event id (echoed from arg). |
| `time_in_period` | character | Time elapsed in the period when the shot occurred. |
| `time_remaining` | character | Time remaining. |
| `situation_code` | character | Code identifying the game situation. |
| `home_team_defending_side` | character | Ice end ('left' or 'right') that the home team is defending in the current period, used to orient x/y coordinates in the NHL api-web play-by-play feed. |
| `type_code` | integer | Numeric event-type code identifying the category of play (e.g., goal, shot, hit, penalty, faceoff) in the NHL api-web play-by-play feed. |
| `type_desc_key` | character | String key describing the event type category (e.g., 'goal', 'shot-on-goal', 'hit', 'faceoff') in the NHL api-web play-by-play feed. |
| `sort_order` | integer | Display sort order for the sport. |
| `period_descriptor_number` | integer | Period number. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `details_event_owner_team_id` | double | NHL api-web team identifier for the team credited with or responsible for the play event in the play-by-play feed. |
| `details_losing_player_id` | double | NHL api-web player identifier for the skater who lost the faceoff on a faceoff event in the play-by-play feed. |
| `details_winning_player_id` | double | NHL api-web player identifier for the skater who won the faceoff on a faceoff event in the play-by-play feed. |
| `details_x_coord` | double | Horizontal rink coordinate (feet from centre ice, positive toward right side) of the play event location in the NHL api-web play-by-play feed. |
| `details_y_coord` | double | Vertical rink coordinate (feet from centre ice, positive toward one end) of the play event location in the NHL api-web play-by-play feed. |
| `details_zone_code` | character | Ice zone where the play event occurred, coded as 'O' (offensive), 'D' (defensive), or 'N' (neutral) relative to the event owner team in the play-by-play feed. |
| `details_shot_type` | character | Classification of the shot attempt (e.g., wrist shot, slap shot, backhand, deflection) as provided in the NHL api-web play-by-play details. |
| `details_shooting_player_id` | double | NHL api-web player identifier for the skater who took the shot on a shot-on-goal, missed-shot, or blocked-shot event in the play-by-play feed. |
| `details_goalie_in_net_id` | double | NHL api-web player identifier for the goaltender who was in the net at the time of the shot, goal, or missed-shot event in the play-by-play feed. |
| `details_away_sog` | double | Cumulative shots on goal by the away team at the moment of the play event in the NHL api-web play-by-play feed. |
| `details_home_sog` | double | Cumulative shots on goal by the home team at the moment of the play event in the NHL api-web play-by-play feed. |
| `details_reason` | character | Primary reason or description for the play event (e.g., specific penalty infraction name) as provided in the NHL api-web play-by-play details. |
| `details_blocking_player_id` | double | NHL api-web player identifier for the skater who blocked a shot on the blocked-shot event in the play-by-play feed. |
| `details_hitting_player_id` | double | NHL api-web player identifier for the skater who delivered the body check on a hit event in the play-by-play feed. |
| `details_hittee_player_id` | double | NHL api-web player identifier for the skater who received the body check on a hit event in the play-by-play feed. |
| `details_player_id` | double | NHL api-web player identifier for the primary player involved in the play event (used on giveaway, takeaway, and similar single-player events). |
| `details_type_code` | character | Structured sub-type code providing additional classification within the play event category in the NHL api-web play-by-play feed. |
| `details_desc_key` | character | Short descriptor key providing additional classification of the play event (e.g., penalty type or shot outcome) in the NHL api-web play-by-play feed. |
| `details_duration` | double | Duration of the penalty in minutes as specified in the play event details of the NHL api-web play-by-play feed. |
| `details_committed_by_player_id` | double | NHL api-web player identifier for the player who committed the infraction on a penalty event in the play-by-play feed. |
| `details_drawn_by_player_id` | double | NHL api-web player identifier for the player who drew (was the victim of) the penalty on a penalty event in the play-by-play feed. |
| `ppt_replay_url` | character | URL to the power-play tracking replay video associated with this play event in the NHL api-web play-by-play feed. |
| `details_scoring_player_id` | double | NHL api-web player identifier for the skater who scored the goal on a goal event in the play-by-play feed. |
| `details_scoring_player_total` | double | Running season goal total for the scoring player at the time of the goal event in the NHL api-web play-by-play feed. |
| `details_assist1_player_id` | double | NHL api-web player identifier for the primary (first) assist credited on a goal event in the play-by-play feed. |
| `details_assist1_player_total` | double | Running season assist total for the primary assist player at the time of the goal event in the play-by-play feed. |
| `details_assist2_player_id` | double | NHL api-web player identifier for the secondary (second) assist credited on a goal event in the play-by-play feed. |
| `details_assist2_player_total` | double | Running season assist total for the secondary assist player at the time of the goal event in the play-by-play feed. |
| `details_away_score` | double | Cumulative away-team score at the moment of the play event in the NHL api-web play-by-play feed. |
| `details_home_score` | double | Cumulative home-team score at the moment of the play event in the NHL api-web play-by-play feed. |
| `details_highlight_clip_sharing_url` | character | Public sharing URL for the English-language broadcast highlight clip of this play event from the NHL api-web play-by-play feed. |
| `details_highlight_clip` | double | NHL api-web identifier for the broadcast highlight clip associated with this play event in the play-by-play feed (English feed). |
| `details_discrete_clip` | double | NHL api-web clip identifier for the discrete video clip of this play event in the play-by-play feed (English feed). |
| `details_discrete_clip_fr` | double | NHL api-web clip identifier for the discrete video clip of this play event in the play-by-play feed (French feed). |
| `details_highlight_clip_sharing_url_fr` | character | Public sharing URL for the French-language broadcast highlight clip of this play event from the NHL api-web play-by-play feed. |
| `details_highlight_clip_fr` | double | NHL api-web identifier for the broadcast highlight clip associated with this play event in the play-by-play feed (French feed). |
| `details_secondary_reason` | character | Secondary descriptive reason or sub-classification for the play event as provided in the NHL api-web play-by-play details (e.g., penalty sub-type). |

**Row type:** `NhlApiWebPbpRow` (exported from the package root).

### Returns — `nhl_player_game_log` / `nhlPlayerGameLog`

| col_name | type | description |
|---|---|---|
| `game_id` | integer | Unique game identifier. |
| `team_abbrev` | character | Team abbreviation. |
| `home_road_flag` | character | Home or road indicator. |
| `game_date` | character | Game date. |
| `goals` | integer | Goals scored. |
| `assists` | integer | Assists. |
| `points` | integer | Total points (goals + assists). |
| `plus_minus` | integer | Plus/minus rating. |
| `power_play_goals` | integer | Power-play goals. |
| `power_play_points` | integer | Power play points. |
| `game_winning_goals` | integer | Game-winning goals. |
| `ot_goals` | integer | Overtime goals. |
| `shots` | integer | Shots on goal. |
| `shifts` | integer | Number of shifts. |
| `shorthanded_goals` | integer | Shorthanded goals. |
| `shorthanded_points` | integer | Shorthanded points. |
| `opponent_abbrev` | character | Opponent team abbreviation. |
| `pim` | integer | Penalty minutes. |
| `toi` | character | Time on ice. |
| `common_name_default` | character | Player's team common name. |
| `opponent_common_name_default` | character | Opponent team common name. |
| `opponent_common_name_fr` | character | French-language common name of the opposing team in the player's individual game log entry from the NHL api-web feed. |

**Row type:** `NhlApiWebPlayerGameLogRow` (exported from the package root).

### Returns — `nhl_player_landing` / `nhlPlayerLanding`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `is_active` | logical | Whether the team is active. |
| `current_team_id` | integer | Player's current team identifier. |
| `current_team_abbrev` | character | Three-letter abbreviation of the NHL team the player is currently rostered on (e.g., 'TOR', 'BOS'). |
| `badges` | character | Serialized list of achievement or milestone badges displayed on the player's NHL api-web profile page. |
| `team_logo` | character | URL to the team logo image. |
| `sweater_number` | integer | Jersey number. |
| `position` | character | Player position. |
| `headshot` | character | URL to the player headshot image. |
| `hero_image` | character | URL to the large hero/banner image of the player displayed at the top of their NHL api-web profile page. |
| `height_in_inches` | integer | Height in inches. |
| `height_in_centimeters` | integer | Height in centimeters. |
| `weight_in_pounds` | integer | Weight in pounds. |
| `weight_in_kilograms` | integer | Weight in kilograms. |
| `birth_date` | character | Player birth date. |
| `birth_country` | character | Player birth country. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `player_slug` | character | URL slug for the player. |
| `in_top100_all_time` | integer | Flag (1/0) indicating whether the player is recognized among the NHL's Top 100 all-time greatest players. |
| `in_hhof` | integer | Flag (1/0) indicating whether the player has been inducted into the Hockey Hall of Fame. |
| `shop_link` | character | URL to the NHL shop page where merchandise for this player (e.g., jerseys) can be purchased. |
| `twitter_link` | character | URL to the player's official Twitter/X account as listed on their NHL api-web profile. |
| `watch_link` | character | URL to the NHL.tv or league streaming page where the player's games can be watched. |
| `last5_games` | character | Serialized array of stat lines for the player's five most recent NHL games, as returned by the player landing endpoint. |
| `season_totals` | character | Serialized array of per-season stat totals for the player across all regular seasons and playoffs in their NHL career. |
| `awards` | character | Serialized list of NHL awards and honors the player has received, as returned by the NHL api-web player landing endpoint. |
| `current_team_roster` | character | Serialized roster-position metadata for the player's current NHL team assignment, as returned by the player landing endpoint. |
| `full_team_name_default` | character | Full English name of the player's current NHL team (e.g., 'Toronto Maple Leafs'), as returned by the player landing endpoint. |
| `full_team_name_fr` | character | Full French-language name of the player's current NHL team, as returned by the player landing endpoint. |
| `team_common_name_default` | character | Team common name (default language). |
| `team_place_name_with_preposition_default` | character | Team place name with preposition (default). |
| `team_place_name_with_preposition_fr` | character | Team place name with preposition (French). |
| `first_name_default` | character | Player first name (default language). |
| `last_name_default` | character | Player last name (default language). |
| `birth_city_default` | character | Birth city (default localization). |
| `birth_state_province_default` | character | Birth state/province (default localization). |
| `draft_details_year` | integer | Calendar year in which the player was selected in the NHL Entry Draft. |
| `draft_details_team_abbrev` | character | Three-letter abbreviation of the NHL team that drafted the player in the Entry Draft. |
| `draft_details_round` | integer | Round number in which the player was selected during the NHL Entry Draft. |
| `draft_details_pick_in_round` | integer | Pick number within the player's draft round in the NHL Entry Draft. |
| `draft_details_overall_pick` | integer | Overall pick number at which the player was selected in the NHL Entry Draft. |
| `featured_stats_season` | integer | Eight-digit NHL season identifier (e.g., 20232024) indicating which season the featured stats on the player's profile correspond to. |
| `featured_stats_regular_season_sub_season_assists` | integer | Assists recorded by the player in the featured regular-season sub-season (typically the current or most recent season) on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_game_winning_goals` | integer | Game-winning goals recorded by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_games_played` | integer | Games played by the player in the featured regular-season sub-season (typically the current or most recent season) on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_goals` | integer | Goals scored by the player in the featured regular-season sub-season (typically the current or most recent season) on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_ot_goals` | integer | Overtime goals scored by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_pim` | integer | Penalty minutes accumulated by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_plus_minus` | integer | Plus/minus rating for the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_points` | integer | Points (goals + assists) recorded by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_power_play_goals` | integer | Power-play goals scored by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_power_play_points` | integer | Power-play points accumulated by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_shooting_pctg` | double | Shooting percentage for the player in the featured regular-season sub-season on their NHL api-web profile, expressed as a decimal. |
| `featured_stats_regular_season_sub_season_shorthanded_goals` | integer | Shorthanded goals scored by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_shorthanded_points` | integer | Shorthanded points accumulated by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_sub_season_shots` | integer | Shots on goal taken by the player in the featured regular-season sub-season on their NHL api-web profile. |
| `featured_stats_regular_season_career_assists` | integer | Career regular-season assists highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_game_winning_goals` | integer | Career regular-season game-winning goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_games_played` | integer | Career regular-season games played highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_goals` | integer | Career regular-season goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_ot_goals` | integer | Career regular-season overtime goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_pim` | integer | Career regular-season penalty minutes highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_plus_minus` | integer | Career regular-season plus/minus rating highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_points` | integer | Career regular-season points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_power_play_goals` | integer | Career regular-season power-play goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_power_play_points` | integer | Career regular-season power-play points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_shooting_pctg` | double | Career regular-season shooting percentage highlighted on the player's NHL api-web profile, expressed as a decimal. |
| `featured_stats_regular_season_career_shorthanded_goals` | integer | Career regular-season shorthanded goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_shorthanded_points` | integer | Career regular-season shorthanded points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_regular_season_career_shots` | integer | Career regular-season shots on goal highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_sub_season_assists` | integer | Assists recorded by the player in the featured playoff sub-season (typically the most recent postseason) on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_game_winning_goals` | integer | Game-winning goals recorded by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_games_played` | integer | Games played by the player in the featured playoff sub-season (typically the most recent postseason) on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_goals` | integer | Goals scored by the player in the featured playoff sub-season (typically the most recent postseason) on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_ot_goals` | integer | Overtime goals scored by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_pim` | integer | Penalty minutes accumulated by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_plus_minus` | integer | Plus/minus rating for the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_points` | integer | Points (goals + assists) recorded by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_power_play_goals` | integer | Power-play goals scored by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_power_play_points` | integer | Power-play points accumulated by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_shooting_pctg` | double | Shooting percentage for the player in the featured playoff sub-season on their NHL api-web profile, expressed as a decimal. |
| `featured_stats_playoffs_sub_season_shorthanded_goals` | integer | Shorthanded goals scored by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_shorthanded_points` | integer | Shorthanded points accumulated by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_sub_season_shots` | integer | Shots on goal taken by the player in the featured playoff sub-season on their NHL api-web profile. |
| `featured_stats_playoffs_career_assists` | integer | Career playoff assists highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_game_winning_goals` | integer | Career playoff game-winning goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_games_played` | integer | Career playoff games played highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_goals` | integer | Career playoff goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_ot_goals` | integer | Career playoff overtime goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_pim` | integer | Career playoff penalty minutes highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_plus_minus` | integer | Career playoff plus/minus rating highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_points` | integer | Career playoff points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_power_play_goals` | integer | Career playoff power-play goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_power_play_points` | integer | Career playoff power-play points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_shooting_pctg` | double | Career playoff shooting percentage highlighted on the player's NHL api-web profile, expressed as a decimal. |
| `featured_stats_playoffs_career_shorthanded_goals` | integer | Career playoff shorthanded goals highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_shorthanded_points` | integer | Career playoff shorthanded points highlighted on the player's NHL api-web profile for the featured season context. |
| `featured_stats_playoffs_career_shots` | integer | Career playoff shots on goal highlighted on the player's NHL api-web profile for the featured season context. |
| `career_totals_regular_season_assists` | integer | Career cumulative assists recorded by the player across all NHL regular-season games. |
| `career_totals_regular_season_avg_toi` | character | Career average time on ice per game in the NHL regular season, expressed as an MM:SS string. |
| `career_totals_regular_season_faceoff_winning_pctg` | double | Career faceoff win percentage for the player across all NHL regular-season games. |
| `career_totals_regular_season_game_winning_goals` | integer | Career total of game-winning goals the player has scored in NHL regular-season games. |
| `career_totals_regular_season_games_played` | integer | Total number of NHL regular-season games the player has appeared in across their career. |
| `career_totals_regular_season_goals` | integer | Career total goals scored by the player in NHL regular-season games. |
| `career_totals_regular_season_ot_goals` | integer | Career total overtime goals scored by the player in NHL regular-season games. |
| `career_totals_regular_season_pim` | integer | Career total penalty minutes accumulated by the player in NHL regular-season games. |
| `career_totals_regular_season_plus_minus` | integer | Career plus/minus rating accumulated by the player across all NHL regular-season games. |
| `career_totals_regular_season_points` | integer | Career total points (goals + assists) accumulated by the player in NHL regular-season games. |
| `career_totals_regular_season_power_play_goals` | integer | Career total power-play goals scored by the player in NHL regular-season games. |
| `career_totals_regular_season_power_play_points` | integer | Career total power-play points (goals + assists on the power play) in NHL regular-season games. |
| `career_totals_regular_season_shooting_pctg` | double | Career shooting percentage for the player in NHL regular-season games, expressed as a decimal. |
| `career_totals_regular_season_shorthanded_goals` | integer | Career total shorthanded goals scored by the player in NHL regular-season games. |
| `career_totals_regular_season_shorthanded_points` | integer | Career total shorthanded points (goals + assists while shorthanded) in NHL regular-season games. |
| `career_totals_regular_season_shots` | integer | Career total shots on goal taken by the player in NHL regular-season games. |
| `career_totals_playoffs_assists` | integer | Career cumulative assists recorded by the player across all NHL playoff appearances. |
| `career_totals_playoffs_avg_toi` | character | Career average time on ice per game in NHL playoff play, expressed as an MM:SS string. |
| `career_totals_playoffs_faceoff_winning_pctg` | double | Career faceoff win percentage for the player across all NHL playoff games. |
| `career_totals_playoffs_game_winning_goals` | integer | Career total of game-winning goals the player has scored in NHL playoff games. |
| `career_totals_playoffs_games_played` | integer | Total number of NHL playoff games the player has appeared in across their career. |
| `career_totals_playoffs_goals` | integer | Career total goals scored by the player in NHL playoff games. |
| `career_totals_playoffs_ot_goals` | integer | Career total overtime goals scored by the player in NHL playoff games. |
| `career_totals_playoffs_pim` | integer | Career total penalty minutes accumulated by the player in NHL playoff games. |
| `career_totals_playoffs_plus_minus` | integer | Career plus/minus rating accumulated by the player across all NHL playoff games. |
| `career_totals_playoffs_points` | integer | Career total points (goals + assists) accumulated by the player in NHL playoff games. |
| `career_totals_playoffs_power_play_goals` | integer | Career total power-play goals scored by the player in NHL playoff games. |
| `career_totals_playoffs_power_play_points` | integer | Career total power-play points (goals + assists on the power play) in NHL playoff games. |
| `career_totals_playoffs_shooting_pctg` | double | Career shooting percentage for the player in NHL playoff games, expressed as a decimal. |
| `career_totals_playoffs_shorthanded_goals` | integer | Career total shorthanded goals scored by the player in NHL playoff games. |
| `career_totals_playoffs_shorthanded_points` | integer | Career total shorthanded points (goals + assists while shorthanded) in NHL playoff games. |
| `career_totals_playoffs_shots` | integer | Career total shots on goal taken by the player in NHL playoff games. |

**Row type:** `NhlApiWebPlayerLandingRow` (exported from the package root).

### Returns — `nhl_player_spotlight` / `nhlPlayerSpotlight`

| col_name | type | description |
|---|---|---|
| `player_id` | integer | Unique player identifier. |
| `player_slug` | character | URL slug for the player. |
| `position` | character | Player position. |
| `sweater_number` | integer | Jersey number. |
| `team_id` | integer | Unique team identifier. |
| `headshot` | character | URL to the player headshot image. |
| `team_tri_code` | character | Team tri-code abbreviation. |
| `team_logo` | character | URL to the team logo image. |
| `sort_id` | integer | Sort order identifier for the spotlight. |
| `name_default` | character | Player name (default localization). |
| `name_cs` | character | Player name (Czech localization). |
| `name_fi` | character | Player name (Finnish localization). |
| `name_sk` | character | Player name (Slovak localization). |

**Row type:** `NhlApiWebPlayerSpotlightRow` (exported from the package root).

### Returns — `nhl_playoff_series` / `nhlPlayoffSeries`

| col_name | type | description |
|---|---|---|
| `round` | integer | Shootout round number. |
| `series_letter` | character | Single-letter label identifying this series within its playoff round (e.g., 'A', 'B'), as used by the NHL api-web. |
| `top_seed_team_id` | integer | Unique NHL api-web identifier for the higher-seeded team in this playoff series. |
| `top_seed_team_abbrev` | character | Three-letter abbreviation of the higher-seeded team in this NHL playoff series (e.g., 'TOR'). |
| `bottom_seed_team_id` | integer | Unique NHL api-web identifier for the lower-seeded team in this playoff series. |
| `bottom_seed_team_abbrev` | character | Three-letter abbreviation of the lower-seeded team in this NHL playoff series (e.g., 'BOS'). |
| `id` | integer | Unique player identifier. |
| `season` | integer | Season year (echoed from arg). |
| `game_type` | integer | Game type the row belongs to. |
| `game_number` | integer | Game number within the schedule. |
| `if_necessary` | logical | If necessary. |
| `neutral_site` | logical | Whether the game is at a neutral site. |
| `start_time_utc` | character | Scheduled start time in UTC. |
| `eastern_utc_offset` | character | Eastern time UTC offset. |
| `venue_utc_offset` | character | Venue UTC offset. |
| `venue_timezone` | character | Venue time zone. |
| `game_state` | character | Game state (e.g., FINAL, LIVE). |
| `game_schedule_state` | character | Schedule state of the game. |
| `tv_broadcasts` | character | Nested list of TV broadcast details. |
| `game_center_link` | character | Link to the NHL game center page. |
| `venue_default` | character | Venue name (default language). |
| `away_team_id` | integer | Away team identifier. |
| `away_team_common_name_default` | character | Away team common name (default language). |
| `away_team_place_name_default` | character | Away team place name (default language). |
| `away_team_place_name_with_preposition_default` | character | Away team place name with preposition (default). |
| `away_team_place_name_with_preposition_fr` | character | Away team place name with preposition (French). |
| `away_team_abbrev` | character | Away team abbreviation. |
| `away_team_score` | integer | Away team final score. |
| `home_team_id` | integer | Home team identifier. |
| `home_team_common_name_default` | character | Home team common name (default language). |
| `home_team_place_name_default` | character | Home team place name (default language). |
| `home_team_place_name_fr` | character | Home team place name (French). |
| `home_team_place_name_with_preposition_default` | character | Home team place name with preposition (default). |
| `home_team_place_name_with_preposition_fr` | character | Home team place name with preposition (French). |
| `home_team_abbrev` | character | Home team abbreviation. |
| `home_team_score` | integer | Home team final score. |
| `period_descriptor_number` | integer | Period number. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `series_status_top_seed_wins` | integer | Number of wins accumulated by the higher-seeded team in this NHL playoff series to date. |
| `series_status_bottom_seed_wins` | integer | Number of wins accumulated by the lower-seeded team in this NHL playoff series to date. |
| `game_outcome_last_period_type` | character | Period type in which the game ended. |
| `game_outcome_ot_periods` | double | Number of overtime periods played in the game that concluded this series or scheduled game, where applicable. |
| `away_team_place_name_fr` | character | Away team place name (French). |

**Row type:** `NhlApiWebPlayoffSeriesRow` (exported from the package root).

### Returns — `nhl_roster` / `nhlRoster`

| col_name | type | description |
|---|---|---|
| `position_group` | character | Position group name (e.g. Centers). |
| `id` | integer | Unique player identifier. |
| `headshot` | character | URL to the player headshot image. |
| `sweater_number` | integer | Jersey number. |
| `position_code` | character | Player position code. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `height_in_inches` | integer | Height in inches. |
| `weight_in_pounds` | integer | Weight in pounds. |
| `height_in_centimeters` | integer | Height in centimeters. |
| `weight_in_kilograms` | integer | Weight in kilograms. |
| `birth_date` | character | Player birth date. |
| `birth_country` | character | Player birth country. |
| `first_name_default` | character | Player first name (default language). |
| `last_name_default` | character | Player last name (default language). |
| `birth_city_default` | character | Birth city (default localization). |
| `birth_state_province_default` | character | Birth state/province (default localization). |
| `birth_city_cs` | character | Birth city (Czech localization). |
| `birth_city_de` | character | Birth city (German localization). |
| `birth_city_fi` | character | Birth city (Finnish localization). |
| `birth_city_sk` | character | Birth city (Slovak localization). |
| `birth_city_sv` | character | Birth city (Swedish localization). |

**Row type:** `NhlApiWebRosterRow` (exported from the package root).

### Returns — `nhl_web_schedule` / `nhlWebSchedule`

| col_name | type | description |
|---|---|---|
| `schedule_date` | character | Calendar date of the game in YYYY-MM-DD format as returned by the NHL api-web schedule endpoint. |
| `id` | integer | Unique player identifier. |
| `season` | integer | Season year (echoed from arg). |
| `game_type` | integer | Game type the row belongs to. |
| `neutral_site` | logical | Whether the game is at a neutral site. |
| `start_time_utc` | character | Scheduled start time in UTC. |
| `eastern_utc_offset` | character | Eastern time UTC offset. |
| `venue_utc_offset` | character | Venue UTC offset. |
| `venue_timezone` | character | Venue time zone. |
| `game_state` | character | Game state (e.g., FINAL, LIVE). |
| `game_schedule_state` | character | Schedule state of the game. |
| `tv_broadcasts` | character | Nested list of TV broadcast details. |
| `series_url` | character | NHL api-web URL path to the dedicated page for the playoff series associated with this scheduled game. |
| `three_min_recap` | character | Link to the three-minute recap. |
| `game_center_link` | character | Link to the NHL game center page. |
| `venue_default` | character | Venue name (default language). |
| `away_team_id` | integer | Away team identifier. |
| `away_team_common_name_default` | character | Away team common name (default language). |
| `away_team_place_name_default` | character | Away team place name (default language). |
| `away_team_place_name_with_preposition_default` | character | Away team place name with preposition (default). |
| `away_team_place_name_with_preposition_fr` | character | Away team place name with preposition (French). |
| `away_team_abbrev` | character | Away team abbreviation. |
| `away_team_logo` | character | URL to the away team logo. |
| `away_team_dark_logo` | character | URL to the away team dark logo. |
| `away_team_away_split_squad` | logical | Whether the away team is a split squad. |
| `away_team_score` | integer | Away team final score. |
| `home_team_id` | integer | Home team identifier. |
| `home_team_common_name_default` | character | Home team common name (default language). |
| `home_team_place_name_default` | character | Home team place name (default language). |
| `home_team_place_name_fr` | character | Home team place name (French). |
| `home_team_place_name_with_preposition_default` | character | Home team place name with preposition (default). |
| `home_team_place_name_with_preposition_fr` | character | Home team place name with preposition (French). |
| `home_team_abbrev` | character | Home team abbreviation. |
| `home_team_logo` | character | URL to the home team logo. |
| `home_team_dark_logo` | character | URL to the home team dark logo. |
| `home_team_home_split_squad` | logical | Whether the home team is a split squad. |
| `home_team_score` | integer | Home team final score. |
| `period_descriptor_number` | integer | Period number. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `game_outcome_last_period_type` | character | Period type in which the game ended. |
| `winning_goalie_player_id` | integer | Winning goalie player identifier. |
| `winning_goalie_first_initial_default` | character | Winning goalie first initial (default language). |
| `winning_goalie_last_name_default` | character | Winning goalie last name (default language). |
| `winning_goalie_last_name_cs` | character | Winning goalie last name (Czech). |
| `winning_goalie_last_name_fi` | character | Winning goalie last name (Finnish). |
| `winning_goalie_last_name_sk` | character | Winning goalie last name (Slovak). |
| `winning_goal_scorer_player_id` | integer | Winning goal scorer player identifier. |
| `winning_goal_scorer_first_initial_default` | character | Winning goal scorer first initial (default). |
| `winning_goal_scorer_last_name_default` | character | Winning goal scorer last name (default language). |
| `series_status_round` | integer | Playoff round number (1 through 4) for the series containing this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_series_abbrev` | character | Short abbreviation identifying the specific playoff series slot within the bracket for this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_series_title` | character | Human-readable display title for the playoff series containing this scheduled game (e.g., 'Eastern Conference Second Round'). |
| `series_status_series_letter` | character | Single-letter label assigned to the playoff series in the bracket structure for this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_needed_to_win` | integer | Number of additional wins needed by the series leader to clinch and advance at the time of this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_top_seed_team_abbrev` | character | Three-letter team abbreviation for the higher-seeded team in the playoff series associated with this scheduled game. |
| `series_status_top_seed_wins` | integer | Number of wins accumulated by the higher-seeded team in the playoff series as of this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_bottom_seed_team_abbrev` | character | Three-letter team abbreviation for the lower-seeded team in the playoff series associated with this scheduled game. |
| `series_status_bottom_seed_wins` | integer | Number of wins accumulated by the lower-seeded team in the playoff series as of this scheduled game from the NHL api-web schedule endpoint. |
| `series_status_game_number_of_series` | integer | Sequential game number within the playoff series for this scheduled game (e.g., 1 through 7 for a best-of-seven) from the NHL api-web schedule endpoint. |

**Row type:** `NhlApiWebScheduleRow` (exported from the package root).

### Returns — `nhl_score` / `nhlScore`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `season` | integer | Season year (echoed from arg). |
| `game_type` | integer | Game type the row belongs to. |
| `game_date` | character | Game date. |
| `start_time_utc` | character | Scheduled start time in UTC. |
| `eastern_utc_offset` | character | Eastern time UTC offset. |
| `venue_utc_offset` | character | Venue UTC offset. |
| `tv_broadcasts` | character | Nested list of TV broadcast details. |
| `game_state` | character | Game state (e.g., FINAL, LIVE). |
| `game_schedule_state` | character | Schedule state of the game. |
| `game_center_link` | character | Link to the NHL game center page. |
| `series_url` | character | URL path to the NHL api-web series landing page providing full details about this playoff series matchup. |
| `three_min_recap` | character | Link to the three-minute recap. |
| `neutral_site` | logical | Whether the game is at a neutral site. |
| `venue_timezone` | character | Venue time zone. |
| `period` | integer | Period number. |
| `goals` | character | Goals scored. |
| `venue_default` | character | Venue name (default language). |
| `away_team_id` | integer | Away team identifier. |
| `away_team_name_default` | character | Default-language full team name for the away team in this game, as provided by the NHL api-web scoreboard endpoint. |
| `away_team_abbrev` | character | Away team abbreviation. |
| `away_team_score` | integer | Away team final score. |
| `away_team_sog` | integer | Away team shots on goal. |
| `away_team_logo` | character | URL to the away team logo. |
| `home_team_id` | integer | Home team identifier. |
| `home_team_name_default` | character | Default-language full team name for the home team in this game, as provided by the NHL api-web scoreboard endpoint. |
| `home_team_abbrev` | character | Home team abbreviation. |
| `home_team_score` | integer | Home team final score. |
| `home_team_sog` | integer | Home team shots on goal. |
| `home_team_logo` | character | URL to the home team logo. |
| `series_status_round` | integer | Numeric identifier for the playoff round (e.g., 1 = First Round, 2 = Second Round) in which this game is being played. |
| `series_status_series_abbrev` | character | Short abbreviation code identifying the specific playoff series matchup, as provided by the NHL api-web score endpoint. |
| `series_status_series_title` | character | Human-readable title describing the playoff series matchup (e.g., team abbreviations and round name), as returned by the NHL api-web score endpoint. |
| `series_status_series_letter` | character | Single-letter label (e.g., 'A', 'B') assigned to the playoff series by the NHL api-web score endpoint to distinguish simultaneous matchups within a round. |
| `series_status_needed_to_win` | integer | Number of additional wins required by the series leader to clinch the playoff round at the time of this game. |
| `series_status_top_seed_team_abbrev` | character | Three-letter abbreviation for the higher-seeded team in this playoff series, as reported by the NHL api-web score endpoint. |
| `series_status_top_seed_wins` | integer | Number of wins accumulated by the higher-seeded team in the current playoff series as of this game. |
| `series_status_bottom_seed_team_abbrev` | character | Three-letter abbreviation for the lower-seeded team in this playoff series, as reported by the NHL api-web score endpoint. |
| `series_status_bottom_seed_wins` | integer | Number of wins accumulated by the lower-seeded team in the current playoff series as of this game. |
| `series_status_game_number_of_series` | integer | Sequential game number within the playoff series (e.g., 1 through 7 for a best-of-seven round). |
| `clock_time_remaining` | character | Remaining time in the current period in MM:SS format, as provided by the NHL api-web score endpoint. |
| `clock_seconds_remaining` | integer | Integer count of seconds remaining in the current period as reported by the NHL api-web score endpoint. |
| `clock_running` | logical | Boolean flag indicating whether the game clock is actively running at the time the NHL api-web score payload was captured. |
| `clock_in_intermission` | logical | Boolean flag indicating whether the game clock is paused during an intermission at the time the NHL api-web score payload was captured. |
| `period_descriptor_number` | integer | Period number. |
| `period_descriptor_period_type` | character | Period type (e.g., REG, OT). |
| `period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods. |
| `game_outcome_last_period_type` | character | Period type in which the game ended. |

**Row type:** `NhlApiWebScoreRow` (exported from the package root).

### Returns — `nhl_skater_leaders` / `nhlSkaterLeaders`

| col_name | type | description |
|---|---|---|
| `category` | character | Stat leader category. |
| `id` | integer | Unique player identifier. |
| `sweater_number` | integer | Jersey number. |
| `headshot` | character | URL to the player headshot image. |
| `team_abbrev` | character | Team abbreviation. |
| `team_logo` | character | URL to the team logo image. |
| `position` | character | Player position. |
| `value` | integer | Leader stat numeric value. |
| `first_name_default` | character | Player first name (default language). |
| `first_name_cs` | character | Player first name (Czech localization). |
| `first_name_de` | character | Player first name (German). |
| `first_name_es` | character | Player first name (Spanish). |
| `first_name_fi` | character | Player first name (Finnish). |
| `first_name_sk` | character | Player first name (Slovak localization). |
| `first_name_sv` | character | Player first name (Swedish). |
| `last_name_default` | character | Player last name (default language). |
| `team_name_default` | character | Team name (default locale). |
| `last_name_cs` | character | Player last name (Czech localization). |
| `last_name_fi` | character | Player last name (Finnish localization). |
| `last_name_sk` | character | Player last name (Slovak localization). |

**Row type:** `NhlApiWebSkaterLeadersRow` (exported from the package root).

### Returns — `nhl_standings` / `nhlStandings`

| col_name | type | description |
|---|---|---|
| `clinch_indicator` | character | Playoff clinch indicator (e.g. 'x' clinched playoff, 'e' eliminated). |
| `conference_abbrev` | character | Conference abbreviation. |
| `conference_home_sequence` | integer | Team's rank within its conference based solely on home-game results in the NHL api-web standings. |
| `conference_l10_sequence` | integer | Team's rank within its conference based on performance in the last 10 games played, as reported by the NHL api-web standings endpoint. |
| `conference_name` | character | Conference name. |
| `conference_road_sequence` | integer | Team's rank within its conference based solely on road-game results in the NHL api-web standings. |
| `conference_sequence` | integer | Team's seeding position within the conference. |
| `date` | character | Game date (ISO 8601 datetime string). |
| `division_abbrev` | character | Division abbreviation. |
| `division_home_sequence` | integer | Team's rank within its division based solely on home-game results in the NHL api-web standings. |
| `division_l10_sequence` | integer | Team's rank within its division based on performance in the last 10 games played, as reported by the NHL api-web standings endpoint. |
| `division_name` | character | Division name. |
| `division_road_sequence` | integer | Team's rank within its division based solely on road-game results in the NHL api-web standings. |
| `division_sequence` | integer | Team's seeding position within the division. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Matches played. |
| `goal_differential` | integer | Goal differential. |
| `goal_differential_pctg` | double | Team's goal differential normalized to a per-game (or percentage) basis, as published in the NHL standings feed. |
| `goal_against` | integer | Total number of goals allowed by the team across all games played in the current standings snapshot. |
| `goal_for` | integer | Total number of goals scored by the team across all games played in the current standings snapshot. |
| `goals_for_pctg` | double | Team's share of total goals scored in all games involving this team, calculated as goals-for divided by (goals-for + goals-against). |
| `home_games_played` | integer | Number of home games the team has completed in the current season as of this standings snapshot. |
| `home_goal_differential` | integer | Net goal differential (goals-for minus goals-against) accumulated across all home games played in the current season. |
| `home_goals_against` | integer | Total number of goals allowed by the team in home games during the current season. |
| `home_goals_for` | integer | Total number of goals scored by the team in home games during the current season. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | integer | Home overtime losses. |
| `home_points` | integer | Home team total points scored in the game so far. |
| `home_regulation_plus_ot_wins` | integer | Number of home wins achieved in regulation or overtime (excluding shootout decisions) in the current season. |
| `home_regulation_wins` | integer | Number of home wins achieved in regulation time (within 60 minutes) in the current season. |
| `home_ties` | integer | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `l10_games_played` | integer | Number of games included in the team's last-10-games performance window (typically 10, may be lower early in the season). |
| `l10_goal_differential` | integer | Net goal differential (goals-for minus goals-against) across the team's most recent 10 games. |
| `l10_goals_against` | integer | Total goals allowed by the team across its most recent 10 games. |
| `l10_goals_for` | integer | Total goals scored by the team across its most recent 10 games. |
| `l10_losses` | integer | Losses in the last ten games. |
| `l10_ot_losses` | integer | Overtime losses in the last ten games. |
| `l10_points` | integer | Total standings points earned by the team across its most recent 10 games. |
| `l10_regulation_plus_ot_wins` | integer | Number of wins in regulation or overtime (excluding shootouts) within the team's most recent 10 games. |
| `l10_regulation_wins` | integer | Number of regulation-time wins within the team's most recent 10 games. |
| `l10_ties` | integer | Number of tied results recorded within the team's most recent 10 games (applicable to seasons using tie rules). |
| `l10_wins` | integer | Wins in the last ten games. |
| `league_home_sequence` | integer | Team's rank league-wide based solely on home-game results in the NHL api-web standings. |
| `league_l10_sequence` | integer | Team's rank league-wide based on performance in the last 10 games played, as reported by the NHL api-web standings endpoint. |
| `league_road_sequence` | integer | Team's rank league-wide based solely on road-game results in the NHL api-web standings. |
| `league_sequence` | integer | Team's seeding position within the league. |
| `losses` | integer | Number of matches the team has lost. |
| `ot_losses` | integer | Overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Competition points. |
| `regulation_plus_ot_win_pctg` | double | Fraction of games won in regulation or overtime (excluding shootout decisions), used as a tiebreaker metric in NHL standings. |
| `regulation_plus_ot_wins` | integer | Wins in regulation plus overtime. |
| `regulation_win_pctg` | double | Fraction of games won in regulation time only, used as a secondary tiebreaker in NHL standings. |
| `regulation_wins` | integer | Wins in regulation. |
| `road_games_played` | integer | Number of road games the team has completed in the current season as of this standings snapshot. |
| `road_goal_differential` | integer | Net goal differential (goals-for minus goals-against) accumulated across all road games played in the current season. |
| `road_goals_against` | integer | Total number of goals allowed by the team in road games during the current season. |
| `road_goals_for` | integer | Total number of goals scored by the team in road games during the current season. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | integer | Road overtime losses. |
| `road_points` | integer | Total standings points earned by the team in road games during the current season. |
| `road_regulation_plus_ot_wins` | integer | Number of road wins achieved in regulation or overtime (excluding shootout decisions) in the current season. |
| `road_regulation_wins` | integer | Number of road wins achieved in regulation time (within 60 minutes) in the current season. |
| `road_ties` | integer | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `season_id` | integer | Season identifier. |
| `shootout_losses` | integer | Shootout losses. |
| `shootout_wins` | integer | Shootout wins. |
| `streak_code` | character | Current streak code (W/L/OT). |
| `streak_count` | integer | Length of the current streak. |
| `team_logo` | character | URL to the team logo image. |
| `ties` | integer | Number of matches the team has drawn. |
| `waivers_sequence` | integer | Team's position in the NHL waiver-claim priority order for the current season, determined by reverse standings order. |
| `wildcard_sequence` | integer | Team's wild card seeding position. |
| `win_pctg` | double | Team's overall win percentage (wins divided by games played), as reported by the NHL api-web standings endpoint. |
| `wins` | integer | Number of matches the team has won. |
| `place_name_default` | character | Default-language city or place name associated with the team's market (e.g., "Toronto"), as returned by the NHL api-web standings endpoint. |
| `team_name_default` | character | Team name (default locale). |
| `team_name_fr` | character | Team name (French locale). |
| `team_common_name_default` | character | Team common name (default language). |
| `team_abbrev_default` | character | Default three-letter abbreviation for the team (e.g., "TOR"), as provided by the NHL api-web standings endpoint. |
| `place_name_fr` | character | French-language city or place name associated with the team's market, as returned by the NHL api-web standings endpoint. |
| `team_common_name_fr` | character | Team common name (French localization). |

**Row type:** `NhlApiWebStandingsRow` (exported from the package root).

### Returns — `nhl_standings_season` / `nhlStandingsSeason`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `conferences_in_use` | logical | Whether conferences were in use that season. |
| `divisions_in_use` | logical | Whether divisions were in use that season. |
| `point_for_o_tloss_in_use` | logical | Whether a point for overtime losses was in use. |
| `regulation_wins_in_use` | logical | Whether regulation wins were tracked. |
| `row_in_use` | logical | Whether the regulation/overtime/shootout format was in use. |
| `standings_end` | character | End date of the standings period. |
| `standings_start` | character | Start date of the standings period. |
| `ties_in_use` | logical | Whether ties were in use that season. |
| `wildcard_in_use` | logical | Whether the wild-card playoff format was in use this season. |

**Row type:** `NhlApiWebStandingsSeasonRow` (exported from the package root).

## Native API — NHL EDGE (player tracking)

Flat (non-ESPN) wrappers for NHL EDGE player/team tracking. Host: `https://api-web.nhle.com`. Each method is exposed under BOTH its snake_case name `nhl_edge_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.nhl`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `nhl_edge_cat_goalie_detail` / `nhlEdgeCatGoalieDetail` | `https://api-web.nhle.com/v1/cat/edge/goalie-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_cat_skater_detail` / `nhlEdgeCatSkaterDetail` | `https://api-web.nhle.com/v1/cat/edge/skater-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_5v5_detail` / `nhlEdgeGoalie5v5Detail` | `https://api-web.nhle.com/v1/edge/goalie-5v5-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_5v5_top_10` / `nhlEdgeGoalie5v5Top10` | `https://api-web.nhle.com/v1/edge/goalie-5v5-top-10/{sort_by}/{season}/{game_type}` | `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_goalie_comparison` / `nhlEdgeGoalieComparison` | `https://api-web.nhle.com/v1/edge/goalie-comparison/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_detail` / `nhlEdgeGoalieDetail` | `https://api-web.nhle.com/v1/edge/goalie-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_edge_save_pctg_top_10` / `nhlEdgeGoalieEdgeSavePctgTop10` | `https://api-web.nhle.com/v1/edge/goalie-edge-save-pctg-top-10/{sort_by}/{season}/{game_type}` | `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_goalie_landing` / `nhlEdgeGoalieLanding` | `https://api-web.nhle.com/v1/edge/goalie-landing/{season}/{game_type}` | `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_save_percentage_detail` / `nhlEdgeGoalieSavePercentageDetail` | `https://api-web.nhle.com/v1/edge/goalie-save-percentage-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_goalie_shot_location_detail` / `nhlEdgeGoalieShotLocationDetail` | `https://api-web.nhle.com/v1/edge/goalie-shot-location-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_shot_location` | — |
| `nhl_edge_goalie_shot_location_top_10` / `nhlEdgeGoalieShotLocationTop10` | `https://api-web.nhle.com/v1/edge/goalie-shot-location-top-10/{category}/{sort_by}/{season}/{game_type}` | `category`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_skater_comparison` / `nhlEdgeSkaterComparison` | `https://api-web.nhle.com/v1/edge/skater-comparison/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_detail` / `nhlEdgeSkaterDetail` | `https://api-web.nhle.com/v1/edge/skater-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_distance_top_10` / `nhlEdgeSkaterDistanceTop10` | `https://api-web.nhle.com/v1/edge/skater-distance-top-10/{positions}/{strength}/{sort_by}/{season}/{game_type}` | `positions`\*, `strength`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_skater_landing` / `nhlEdgeSkaterLanding` | `https://api-web.nhle.com/v1/edge/skater-landing/{season}/{game_type}` | `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_shot_location_detail` / `nhlEdgeSkaterShotLocationDetail` | `https://api-web.nhle.com/v1/edge/skater-shot-location-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_shot_location` | — |
| `nhl_edge_skater_shot_location_top_10` / `nhlEdgeSkaterShotLocationTop10` | `https://api-web.nhle.com/v1/edge/skater-shot-location-top-10/{position}/{category}/{sort_by}/{season}/{game_type}` | `position`\*, `category`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_skater_shot_speed_detail` / `nhlEdgeSkaterShotSpeedDetail` | `https://api-web.nhle.com/v1/edge/skater-shot-speed-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_shot_speed_top_10` / `nhlEdgeSkaterShotSpeedTop10` | `https://api-web.nhle.com/v1/edge/skater-shot-speed-top-10/{positions}/{sort_by}/{season}/{game_type}` | `positions`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_skater_skating_distance_detail` / `nhlEdgeSkaterSkatingDistanceDetail` | `https://api-web.nhle.com/v1/edge/skater-skating-distance-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_skating_speed_detail` / `nhlEdgeSkaterSkatingSpeedDetail` | `https://api-web.nhle.com/v1/edge/skater-skating-speed-detail/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_skater_speed_top_10` / `nhlEdgeSkaterSpeedTop10` | `https://api-web.nhle.com/v1/edge/skater-speed-top-10/{positions}/{sort_by}/{season}/{game_type}` | `positions`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_skater_zone_time` / `nhlEdgeSkaterZoneTime` | `https://api-web.nhle.com/v1/edge/skater-zone-time/{player_id}/{season}/{game_type}` | `player_id`\*, `season`, `game_type` | — | `parse_edge_zone_time` | — |
| `nhl_edge_skater_zone_time_top_10` / `nhlEdgeSkaterZoneTimeTop10` | `https://api-web.nhle.com/v1/edge/skater-zone-time-top-10/{positions}/{strength}/{sort_by}/{season}/{game_type}` | `positions`\*, `strength`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_team_detail` / `nhlEdgeTeamDetail` | `https://api-web.nhle.com/v1/edge/team-detail/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_team_landing` / `nhlEdgeTeamLanding` | `https://api-web.nhle.com/v1/edge/team-landing/{season}/{game_type}` | `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_team_shot_location_detail` / `nhlEdgeTeamShotLocationDetail` | `https://api-web.nhle.com/v1/edge/team-shot-location-detail/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | `parse_edge_shot_location` | — |
| `nhl_edge_team_shot_location_top_10` / `nhlEdgeTeamShotLocationTop10` | `https://api-web.nhle.com/v1/edge/team-shot-location-top-10/{position}/{category}/{sort_by}/{season}/{game_type}` | `position`\*, `category`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_team_shot_speed_detail` / `nhlEdgeTeamShotSpeedDetail` | `https://api-web.nhle.com/v1/edge/team-shot-speed-detail/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | `parse_edge_detail` | — |
| `nhl_edge_team_skating_distance_detail` / `nhlEdgeTeamSkatingDistanceDetail` | `https://api-web.nhle.com/v1/edge/team-skating-distance-detail/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | *(raw)* | — |
| `nhl_edge_team_skating_distance_top_10` / `nhlEdgeTeamSkatingDistanceTop10` | `https://api-web.nhle.com/v1/edge/team-skating-distance-top-10/{positions}/{strength}/{sort_by}/{season}/{game_type}` | `positions`\*, `strength`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_team_skating_speed_detail` / `nhlEdgeTeamSkatingSpeedDetail` | `https://api-web.nhle.com/v1/edge/team-skating-speed-detail/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | *(raw)* | — |
| `nhl_edge_team_skating_speed_top_10` / `nhlEdgeTeamSkatingSpeedTop10` | `https://api-web.nhle.com/v1/edge/team-skating-speed-top-10/{positions}/{sort_by}/{season}/{game_type}` | `positions`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |
| `nhl_edge_team_zone_time_details` / `nhlEdgeTeamZoneTimeDetails` | `https://api-web.nhle.com/v1/edge/team-zone-time-details/{team_id}/{season}/{game_type}` | `team_id`\*, `season`, `game_type` | — | `parse_edge_zone_time` | — |
| `nhl_edge_team_zone_time_top_10` / `nhlEdgeTeamZoneTimeTop10` | `https://api-web.nhle.com/v1/edge/team-zone-time-top-10/{strength}/{sort_by}/{season}/{game_type}` | `strength`\*, `sort_by`\*, `season`, `game_type` | — | `parse_edge_top10` | — |

### Returns — `nhl_edge_cat_goalie_detail` / `nhlEdgeCatGoalieDetail`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | JSON-serialized list of NHL season identifiers for which EDGE puck-and-player tracking data is available for this goalie. |
| `shot_location_summary` | character | JSON-serialized summary of shot-location tracking data aggregated across all zones for the goalie. |
| `shot_location_details` | character | JSON-serialized per-zone shot-location tracking breakdown showing where shots were attempted against the goalie. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Side on which the goalie catches — L (left) or R (right). |
| `player_sweater_number` | integer | Player jersey number. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_wins` | integer | Number of regulation and overtime wins credited to the goalie during the tracking period. |
| `player_losses` | integer | Number of regulation losses credited to the goalie during the tracking period. |
| `player_overtime_losses` | integer | Number of overtime or shootout losses credited to the goalie during the tracking period. |
| `player_goals_against_avg` | double | Goalie's goals-against average — goals allowed per 60 minutes of ice time — for the tracking period. |
| `player_save_pctg` | double | Goalie's save percentage, expressed as the proportion of shots on goal stopped. |
| `player_games_played` | integer | Number of games in which the goalie appeared during the relevant tracking period. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `stats_goals_against_avg_value` | double | Goalie's goals-against average for the tracking period. |
| `stats_goals_against_avg_percentile` | double | Percentile rank among all NHL goalies for goals-against average (lower GAA = higher percentile). |
| `stats_goals_against_avg_league_avg` | double | League-average goals-against average used as the baseline for this goalie's GAA percentile calculation. |
| `stats_games_above900_value` | double | Number of games the goalie posted a save percentage above .900 during the tracking period. |
| `stats_games_above900_percentile` | double | Percentile rank among all NHL goalies for games played in which the goalie posted a save percentage above .900. |
| `stats_games_above900_league_avg` | double | League-average games-above-.900-save-percentage rate used as the baseline for this goalie's percentile calculation. |
| `stats_goal_differential_per60_value` | double | Goalie's goals-saved-above-expected per 60 minutes, measuring performance relative to shot quality faced. |
| `stats_goal_differential_per60_percentile` | double | Percentile rank among all NHL goalies for goals-saved-above-expected per 60 minutes of ice time. |
| `stats_goal_differential_per60_league_avg` | double | League-average goals-saved-above-expected per 60 minutes used as the baseline for this goalie's percentile. |
| `stats_goal_support_avg_value` | double | Average number of goals scored for the goalie per game started during the tracking period. |
| `stats_goal_support_avg_percentile` | double | Percentile rank among all NHL goalies for average offensive goal support received per game started. |
| `stats_goal_support_avg_league_avg` | double | League-average goal support (goals scored for the goalie per game) used as the baseline for percentile calculation. |
| `stats_point_pctg_value` | double | Fraction of available standings points the goalie's team earned in games the goalie started. |
| `stats_point_pctg_percentile` | double | Percentile rank among all NHL goalies for team point percentage in games the goalie started. |
| `stats_point_pctg_league_avg` | double | League-average team point percentage in games the goalie started, used as the baseline for percentile calculation. |

**Row type:** `NhlEdgeCatGoalieDetailRow` (exported from the package root).

### Returns — `nhl_edge_cat_skater_detail` / `nhlEdgeCatSkaterDetail`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | JSON-serialized list of NHL season identifiers for which EDGE puck-and-player tracking data is available for this skater. |
| `sog_summary` | character | JSON-serialized summary of shot-on-goal tracking data aggregated over the tracking period for the skater. |
| `sog_details` | character | JSON-serialized per-game shot-on-goal tracking details for the skater across the tracking period. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Side on which the skater shoots — L (left) or R (right). |
| `player_sweater_number` | integer | Player jersey number. |
| `player_position` | character | Primary player position. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_goals` | integer | Number of goals scored by the skater during the relevant tracking period. |
| `player_assists` | integer | Number of assists credited to the skater during the relevant tracking period. |
| `player_points` | integer | Player points. |
| `player_games_played` | integer | Number of games in which the skater appeared during the relevant tracking period. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `top_shot_speed_imperial` | double | Skater's highest recorded shot speed in miles per hour during the tracking period. |
| `top_shot_speed_metric` | double | Skater's highest recorded shot speed in kilometers per hour during the tracking period. |
| `top_shot_speed_percentile` | double | Percentile rank among all NHL skaters for highest recorded shot speed during the tracking period. |
| `top_shot_speed_league_avg_imperial` | double | League-average top shot speed in miles per hour, used as the baseline for this skater's shot-speed percentile. |
| `top_shot_speed_league_avg_metric` | double | League-average top shot speed in kilometers per hour, used as the baseline for this skater's shot-speed percentile. |
| `skating_speed_speed_max_imperial` | double | Skater's maximum recorded skating speed in miles per hour during the tracking period. |
| `skating_speed_speed_max_metric` | double | Skater's maximum recorded skating speed in kilometers per hour during the tracking period. |
| `skating_speed_speed_max_percentile` | double | Percentile rank among all NHL skaters for maximum skating speed recorded during the tracking period. |
| `skating_speed_speed_max_league_avg_imperial` | double | League-average maximum skating speed in miles per hour, used as the baseline for this skater's percentile. |
| `skating_speed_speed_max_league_avg_metric` | double | League-average maximum skating speed in kilometers per hour, used as the baseline for this skater's percentile. |
| `skating_speed_speed_max_overlay_player_first_name_default` | character | First name of the skater who achieved the maximum skating speed in the context of the overlay comparison play. |
| `skating_speed_speed_max_overlay_player_last_name_default` | character | Last name of the skater who achieved the maximum skating speed in the context of the overlay comparison play. |
| `skating_speed_speed_max_overlay_time_in_period` | character | Elapsed time within the period (mm:ss) at which the skater's maximum skating speed was recorded. |
| `skating_speed_bursts_over20_value` | integer | Number of skating bursts the skater reached or exceeded 20 mph per game on average during the tracking period. |
| `skating_speed_bursts_over20_percentile` | double | Percentile rank among all NHL skaters for frequency of skating speed bursts exceeding 20 mph per game. |
| `skating_speed_bursts_over20_league_avg_value` | double | League-average number of skating speed bursts exceeding 20 mph per game, used as the baseline for this skater's percentile. |
| `total_distance_skated_imperial` | double | Total cumulative distance skated by the player in miles during the tracking period. |
| `total_distance_skated_metric` | double | Total cumulative distance skated by the player in kilometers during the tracking period. |
| `total_distance_skated_percentile` | double | Percentile rank among all NHL skaters for total distance skated per game during the tracking period. |
| `total_distance_skated_league_avg_imperial` | double | League-average total distance skated in miles per game, used as the baseline for this skater's distance percentile. |
| `total_distance_skated_league_avg_metric` | double | League-average total distance skated in kilometers per game, used as the baseline for this skater's distance percentile. |
| `zone_time_details_offensive_zone_pctg` | double | Percentage of the skater's total on-ice time spent in the offensive zone during the tracking period. |
| `zone_time_details_offensive_zone_percentile` | double | Percentile rank among all NHL skaters for percentage of ice time spent in the offensive zone. |
| `zone_time_details_offensive_zone_league_avg` | double | League-average percentage of on-ice time skaters spend in the offensive zone, used as the baseline for this player's percentile. |
| `zone_time_details_neutral_zone_pctg` | double | Percentage of the skater's total on-ice time spent in the neutral zone during the tracking period. |
| `zone_time_details_neutral_zone_percentile` | double | Percentile rank among all NHL skaters for percentage of ice time spent in the neutral zone. |
| `zone_time_details_neutral_zone_league_avg` | double | League-average percentage of on-ice time skaters spend in the neutral zone, used as the baseline for this player's percentile. |
| `zone_time_details_defensive_zone_pctg` | double | Percentage of the skater's total on-ice time spent in the defensive zone during the tracking period. |
| `zone_time_details_defensive_zone_percentile` | double | Percentile rank among all NHL skaters for percentage of ice time spent in the defensive zone. |
| `zone_time_details_defensive_zone_league_avg` | double | League-average percentage of on-ice time skaters spend in the defensive zone, used as the baseline for this player's percentile. |

**Row type:** `NhlEdgeCatSkaterDetailRow` (exported from the package root).

### Returns — `nhl_edge_goalie_5v5_detail` / `nhlEdgeGoalie5v5Detail`

| col_name | type | description |
|---|---|---|
| `save_pctg5v5_last10` | character | Serialized last-10-game 5-on-5 save percentage trend data for the goalie. |
| `save_pctg5v5_details_save_pctg_value` | double | Goalie's overall 5-on-5 save percentage (saves divided by shots faced at even strength). |
| `save_pctg5v5_details_save_pctg_league_avg` | double | League-average 5-on-5 save percentage across all NHL goalies for the current period. |
| `save_pctg5v5_details_save_pctg_percentile` | double | Percentile rank of the goalie's overall 5-on-5 save percentage relative to all qualifying NHL goalies. |
| `save_pctg5v5_details_save_pctg_close_value` | double | Goalie's 5-on-5 save percentage recorded specifically in close-score situations. |
| `save_pctg5v5_details_save_pctg_close_league_avg` | double | League-average 5-on-5 save percentage in close-score situations (one-goal games in the third period or overtime) for the current period. |
| `save_pctg5v5_details_save_pctg_close_percentile` | double | Percentile rank of the goalie's 5-on-5 save percentage in close-score situations relative to all qualifying NHL goalies. |
| `save_pctg5v5_details_shots_value` | integer | Total number of 5-on-5 shots the goalie faced during the current period. |
| `save_pctg5v5_details_shots_league_avg` | integer | League-average number of 5-on-5 shots faced per game by NHL goalies for the current period. |
| `save_pctg5v5_details_shots_percentile` | double | Percentile rank of the goalie's 5-on-5 shots-faced count relative to all qualifying NHL goalies. |
| `save_pctg5v5_details_shots_per60_value` | double | Goalie's rate of 5-on-5 shots faced per 60 minutes of even-strength ice time. |
| `save_pctg5v5_details_shots_per60_league_avg` | double | League-average rate of 5-on-5 shots faced per 60 minutes of even-strength ice time. |
| `save_pctg5v5_details_shots_per60_percentile` | double | Percentile rank of the goalie's 5-on-5 shots-faced-per-60-minutes rate relative to all qualifying NHL goalies. |

**Row type:** `NhlEdgeGoalie5v5DetailRow` (exported from the package root).

### Returns — `nhl_edge_goalie_comparison` / `nhlEdgeGoalieComparison`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Serialized list of season identifiers for which EDGE player-tracking data is available for this goalie. |
| `shot_location_summary` | character | High-level serialized summary of the goalie's save percentages grouped by shot location zone. |
| `shot_location_details` | character | Serialized shot-zone breakdown detailing save rates from each ice region (slot, off-wing, etc.). |
| `save_pctg5v5_last10` | character | Serialized breakdown of the goalie's 5-on-5 save percentage across their last 10 games. |
| `save_pctg_last10` | character | Serialized summary of the goalie's save percentage across their most recent 10 games. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Handedness indicator showing which side the goalie catches (L = left-catch, R = right-catch). |
| `player_sweater_number` | integer | Player jersey number. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_wins` | integer | Number of decisions recorded as wins for the goalie during the comparison period. |
| `player_losses` | integer | Number of decisions recorded as losses for the goalie during the comparison period. |
| `player_overtime_losses` | integer | Number of losses the goalie suffered after regulation time, counting as an overtime loss in the standings. |
| `player_goals_against_avg` | double | Goalie's goals-against average — average goals allowed per 60 minutes of ice time. |
| `player_save_pctg` | double | Overall save percentage for the goalie — proportion of shots faced that were stopped. |
| `player_games_played` | integer | Total number of regular-season or playoff games the goalie appeared in during the comparison period. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `save_pctg5v5_details_save_pctg` | double | Goalie's save percentage in 5-on-5 even-strength situations only. |
| `save_pctg5v5_details_save_pctg_close` | double | Save percentage in 5-on-5 situations where the game score was within one goal (close-game situations). |
| `save_pctg5v5_details_shots` | integer | Total number of shots the goalie faced in 5-on-5 situations during the comparison period. |
| `save_pctg5v5_details_shots_per60` | double | Rate of shots faced per 60 minutes of 5-on-5 ice time, reflecting workload intensity. |
| `save_pctg_details_games_above900` | integer | Number of games in which the goalie posted a save percentage above .900 during the comparison period. |
| `save_pctg_details_pctg_games_above900` | double | Proportion of the goalie's games (as a percentage) in which they achieved a save percentage above .900. |
| `save_pctg_details_point_pctg` | double | Team points percentage in games started by this goalie, reflecting their contribution to standings. |
| `save_pctg_details_goals_against_avg` | double | Goals-against average from the detailed save-percentage breakdown dataset for this goalie. |
| `save_pctg_details_save_pctg` | double | Overall save percentage from the detailed breakdown dataset, capturing all situations. |

**Row type:** `NhlEdgeGoalieComparisonRow` (exported from the package root).

### Returns — `nhl_edge_goalie_detail` / `nhlEdgeGoalieDetail`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Serialized list of seasons for which NHL EDGE player-tracking data is available for this goalie. |
| `shot_location_summary` | character | Serialized summary of shot-location zones faced by the goalie, aggregated from NHL EDGE tracking data. |
| `shot_location_details` | character | Serialized detailed breakdown of shot locations faced by the goalie, derived from NHL EDGE tracking data. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Hand on which the goalie catches (glove side), typically 'L' for left or 'R' for right. |
| `player_sweater_number` | integer | Player jersey number. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_wins` | integer | Number of wins credited to the goalie for the season in this NHL EDGE detail record. |
| `player_losses` | integer | Number of regulation losses credited to the goalie for the season in this NHL EDGE detail record. |
| `player_overtime_losses` | integer | Number of overtime or shootout losses (OTL) credited to the goalie during the season. |
| `player_goals_against_avg` | double | Goals-against average (GAA) for the goalie during the season, reflecting the average number of goals allowed per 60 minutes played. |
| `player_save_pctg` | double | Save percentage (SV%) for the goalie during the season, expressed as a decimal ratio of saves to shots faced. |
| `player_games_played` | integer | Total number of regular-season games the goalie appeared in for the season covered by this NHL EDGE detail record. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `stats_goals_against_avg_value` | double | Goalie's goals-against average value as reported in the NHL EDGE detail stat block (mirrors player_goals_against_avg at the EDGE layer). |
| `stats_goals_against_avg_percentile` | double | Percentile rank among all NHL goalies for goals-against average as reported in the NHL EDGE detail. |
| `stats_goals_against_avg_league_avg` | double | League-average GAA value used as the EDGE comparative baseline for this goalie's goals-against-average metric. |
| `stats_games_above900_value` | double | Goalie's own count of games in which save percentage exceeded .900, as tracked by the NHL EDGE system. |
| `stats_games_above900_percentile` | double | Percentile rank among all NHL goalies for the 'games above .900 save percentage' EDGE metric during the season. |
| `stats_games_above900_league_avg` | double | League-average value for the 'games above .900 save percentage' EDGE metric, used as a comparative baseline for the goalie. |
| `stats_goal_differential_per60_value` | double | Goalie's net goal differential (team goals scored minus goals allowed while in net) per 60 minutes of play, as tracked by the NHL EDGE system. |
| `stats_goal_differential_per60_percentile` | double | Percentile rank among all NHL goalies for the goals-differential-per-60 EDGE metric during the season. |
| `stats_goal_differential_per60_league_avg` | double | League-average net goal differential (team goals scored minus goals allowed while in net) per 60 minutes, the EDGE baseline comparator for the goalie. |
| `stats_goal_support_avg_value` | double | Average number of goals scored by the goalie's team per game while this goalie was in net, as tracked by NHL EDGE. |
| `stats_goal_support_avg_percentile` | double | Percentile rank among all NHL goalies for average goal support received while the goalie was in net. |
| `stats_goal_support_avg_league_avg` | double | League-average goal-support value (average goals scored for the goalie while in net), used as the EDGE baseline comparator. |
| `stats_point_pctg_value` | double | Team points percentage in games started by this goalie during the season, as tracked by the NHL EDGE system. |
| `stats_point_pctg_percentile` | double | Percentile rank among all NHL goalies for team points percentage in games the goalie started, per NHL EDGE. |
| `stats_point_pctg_league_avg` | double | League-average points percentage (team winning percentage when the goalie starts) used as the EDGE comparative baseline. |

**Row type:** `NhlEdgeGoalieDetailRow` (exported from the package root).

### Returns — `nhl_edge_goalie_landing` / `nhlEdgeGoalieLanding`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Serialized list of season identifiers for which EDGE player-tracking data is available on this landing page. |
| `minimum_minutes_played` | integer | Minimum minutes-played threshold a goalie must meet to qualify for the EDGE leaderboards. |
| `leaders_high_danger_save_pctg_player_id` | integer | NHL player identifier for the goalie leading the high-danger save-percentage leaderboard. |
| `leaders_high_danger_save_pctg_player_first_name_default` | character | First name of the goalie leading the high-danger save-percentage leaderboard (default locale). |
| `leaders_high_danger_save_pctg_player_last_name_default` | character | Last name of the goalie leading the high-danger save-percentage leaderboard (default locale). |
| `leaders_high_danger_save_pctg_player_last_name_cs` | character | Last name of the high-danger save-percentage leader rendered in Czech locale. |
| `leaders_high_danger_save_pctg_player_last_name_sk` | character | Last name of the high-danger save-percentage leader rendered in Slovak locale. |
| `leaders_high_danger_save_pctg_player_sweater_number` | integer | Jersey number worn by the goalie leading the high-danger save-percentage leaderboard. |
| `leaders_high_danger_save_pctg_player_position` | character | Position code for the goalie leading the high-danger save-percentage leaderboard (always G). |
| `leaders_high_danger_save_pctg_player_slug` | character | URL-friendly slug for the high-danger save-percentage leader, used in NHL.com profile links. |
| `leaders_high_danger_save_pctg_player_headshot` | character | URL pointing to the headshot image of the goalie leading the high-danger save-percentage leaderboard. |
| `leaders_high_danger_save_pctg_player_team_common_name_default` | character | Common team name for the club of the leader in the high-danger save-percentage category. |
| `leaders_high_danger_save_pctg_player_team_place_name_with_preposition_default` | character | City/place name with grammatical preposition for the high-danger save-percentage leader's team, default locale. |
| `leaders_high_danger_save_pctg_player_team_place_name_with_preposition_fr` | character | City/place name with grammatical preposition for the high-danger save-percentage leader's team in the French locale. |
| `leaders_high_danger_save_pctg_player_team_abbrev` | character | Three-letter team abbreviation for the club of the goalie leading the high-danger save-percentage leaderboard. |
| `leaders_high_danger_save_pctg_player_team_team_logo_light` | character | URL for the light-background team logo for the high-danger save-percentage leaderboard leader. |
| `leaders_high_danger_save_pctg_player_team_team_logo_dark` | character | URL for the dark-background team logo for the high-danger save-percentage leaderboard leader. |
| `leaders_high_danger_save_pctg_save_pctg` | double | Save percentage value for the leader of the high-danger save-percentage leaderboard. |
| `leaders_high_danger_save_pctg_shot_location_details` | character | Serialized shot-zone breakdown for the high-danger save-percentage leaderboard leader. |
| `leaders_high_danger_saves_player_id` | integer | NHL player identifier for the goalie leading the high-danger saves leaderboard. |
| `leaders_high_danger_saves_player_first_name_default` | character | First name of the goalie leading the high-danger saves leaderboard (default locale). |
| `leaders_high_danger_saves_player_last_name_default` | character | Last name of the goalie leading the high-danger saves leaderboard (default locale). |
| `leaders_high_danger_saves_player_sweater_number` | integer | Jersey number worn by the goalie leading the high-danger saves leaderboard. |
| `leaders_high_danger_saves_player_position` | character | Position code for the goalie leading the high-danger saves leaderboard (always G). |
| `leaders_high_danger_saves_player_slug` | character | URL-friendly slug for the high-danger saves leaderboard leader, used in NHL.com profile links. |
| `leaders_high_danger_saves_player_headshot` | character | URL pointing to the headshot image of the goalie leading the high-danger saves leaderboard. |
| `leaders_high_danger_saves_player_team_common_name_default` | character | Common team name for the club of the leader in the high-danger saves category. |
| `leaders_high_danger_saves_player_team_place_name_with_preposition_default` | character | City/place name with grammatical preposition for the high-danger saves leader's team, default locale. |
| `leaders_high_danger_saves_player_team_place_name_with_preposition_fr` | character | City/place name with grammatical preposition for the high-danger saves leader's team in the French locale. |
| `leaders_high_danger_saves_player_team_abbrev` | character | Three-letter team abbreviation for the club of the goalie leading the high-danger saves leaderboard. |
| `leaders_high_danger_saves_player_team_team_logo_light` | character | URL for the light-background team logo for the high-danger saves leaderboard leader. |
| `leaders_high_danger_saves_player_team_team_logo_dark` | character | URL for the dark-background team logo for the high-danger saves leaderboard leader. |
| `leaders_high_danger_saves_saves` | integer | Total high-danger saves made by the goalie leading the high-danger saves leaderboard. |
| `leaders_high_danger_saves_shot_location_details` | character | Serialized shot-zone breakdown for the high-danger saves leaderboard leader. |
| `leaders_high_danger_goals_against_player_id` | integer | NHL player identifier for the goalie leading the high-danger goals-against leaderboard. |
| `leaders_high_danger_goals_against_player_first_name_default` | character | First name of the goalie leading the high-danger goals-against leaderboard (default locale). |
| `leaders_high_danger_goals_against_player_last_name_default` | character | Last name of the goalie leading the high-danger goals-against leaderboard (default locale). |
| `leaders_high_danger_goals_against_player_sweater_number` | integer | Jersey number worn by the goalie leading the high-danger goals-against leaderboard. |
| `leaders_high_danger_goals_against_player_position` | character | Position code for the goalie leading the high-danger goals-against leaderboard (always G). |
| `leaders_high_danger_goals_against_player_slug` | character | URL-friendly slug for the goalie leading the high-danger goals-against leaderboard, used in NHL.com profile links. |
| `leaders_high_danger_goals_against_player_headshot` | character | URL pointing to the headshot image of the goalie leading the high-danger goals-against leaderboard. |
| `leaders_high_danger_goals_against_player_team_common_name_default` | character | Common team name for the club of the leader in the high-danger goals-against category. |
| `leaders_high_danger_goals_against_player_team_place_name_with_preposition_default` | character | City/place name with grammatical preposition for the high-danger goals-against leader's team, default locale. |
| `leaders_high_danger_goals_against_player_team_place_name_with_preposition_fr` | character | City/place name with grammatical preposition for the high-danger goals-against leader's team in the French locale. |
| `leaders_high_danger_goals_against_player_team_abbrev` | character | Three-letter team abbreviation for the club of the goalie leading the high-danger goals-against leaderboard. |
| `leaders_high_danger_goals_against_player_team_team_logo_light` | character | URL for the light-background team logo for the high-danger goals-against leaderboard leader. |
| `leaders_high_danger_goals_against_player_team_team_logo_dark` | character | URL for the dark-background team logo for the high-danger goals-against leaderboard leader. |
| `leaders_high_danger_goals_against_goals_against` | integer | Number of high-danger goals allowed by the goalie leading the high-danger goals-against leaderboard. |
| `leaders_save_pctg5v5_player_id` | integer | NHL player identifier for the goalie leading the 5-on-5 save-percentage leaderboard. |
| `leaders_save_pctg5v5_player_first_name_default` | character | First name of the goalie leading the 5-on-5 save-percentage leaderboard (default locale). |
| `leaders_save_pctg5v5_player_last_name_default` | character | Last name of the goalie leading the 5-on-5 save-percentage leaderboard (default locale). |
| `leaders_save_pctg5v5_player_last_name_cs` | character | Last name of the 5-on-5 save-percentage leader rendered in Czech locale. |
| `leaders_save_pctg5v5_player_last_name_sk` | character | Last name of the 5-on-5 save-percentage leader rendered in Slovak locale. |
| `leaders_save_pctg5v5_player_sweater_number` | integer | Jersey number worn by the goalie leading the 5-on-5 save-percentage leaderboard. |
| `leaders_save_pctg5v5_player_position` | character | Position code for the goalie leading the 5-on-5 save-percentage leaderboard (always G). |
| `leaders_save_pctg5v5_player_slug` | character | URL-friendly slug for the 5-on-5 save-percentage leaderboard leader, used in NHL.com profile links. |
| `leaders_save_pctg5v5_player_headshot` | character | URL pointing to the headshot image of the goalie leading the 5-on-5 save-percentage leaderboard. |
| `leaders_save_pctg5v5_player_team_common_name_default` | character | Common team name for the club of the leader in the 5-on-5 save-percentage category. |
| `leaders_save_pctg5v5_player_team_place_name_with_preposition_default` | character | City/place name with grammatical preposition for the 5-on-5 save-percentage leader's team, default locale. |
| `leaders_save_pctg5v5_player_team_place_name_with_preposition_fr` | character | City/place name with grammatical preposition for the 5-on-5 save-percentage leader's team in the French locale. |
| `leaders_save_pctg5v5_player_team_abbrev` | character | Three-letter team abbreviation for the club of the goalie leading the 5-on-5 save-percentage leaderboard. |
| `leaders_save_pctg5v5_player_team_team_logo_light` | character | URL for the light-background team logo for the 5-on-5 save-percentage leaderboard leader. |
| `leaders_save_pctg5v5_player_team_team_logo_dark` | character | URL for the dark-background team logo for the 5-on-5 save-percentage leaderboard leader. |
| `leaders_save_pctg5v5_save_pctg` | double | Save percentage value for the leader of the 5-on-5 save-percentage leaderboard. |
| `leaders_games_above900_player_id` | integer | NHL player identifier for the goalie leading the games-above-.900 leaderboard. |
| `leaders_games_above900_player_first_name_default` | character | First name of the goalie leading the games-above-.900 leaderboard (default locale). |
| `leaders_games_above900_player_last_name_default` | character | Last name of the goalie leading the games-above-.900 leaderboard (default locale). |
| `leaders_games_above900_player_sweater_number` | integer | Jersey number worn by the goalie leading the games-above-.900 leaderboard. |
| `leaders_games_above900_player_position` | character | Position code for the goalie leading the games-above-.900 leaderboard (always G). |
| `leaders_games_above900_player_slug` | character | URL-friendly slug for the goalie leading the games-above-.900 leaderboard, used in NHL.com profile links. |
| `leaders_games_above900_player_headshot` | character | URL pointing to the headshot image of the goalie leading the games-above-.900 leaderboard. |
| `leaders_games_above900_player_team_common_name_default` | character | Common team name (e.g., Maple Leafs) for the club of the leader in the games-above-.900 category. |
| `leaders_games_above900_player_team_place_name_with_preposition_default` | character | City/place name with grammatical preposition (e.g., in Toronto) for the leader's team, in the default locale. |
| `leaders_games_above900_player_team_place_name_with_preposition_fr` | character | City/place name with grammatical preposition for the leader's team in the French locale. |
| `leaders_games_above900_player_team_abbrev` | character | Three-letter team abbreviation for the club of the goalie leading the games-above-.900 leaderboard. |
| `leaders_games_above900_player_team_team_logo_light` | character | URL for the light-background version of the team logo for the games-above-.900 leaderboard leader. |
| `leaders_games_above900_player_team_team_logo_dark` | character | URL for the dark-background version of the team logo for the games-above-.900 leaderboard leader. |
| `leaders_games_above900_games` | integer | Number of games above a .900 save percentage for the top-ranked goalie in that leaderboard category. |

**Row type:** `NhlEdgeGoalieLandingRow` (exported from the package root).

### Returns — `nhl_edge_goalie_save_percentage_detail` / `nhlEdgeGoalieSavePercentageDetail`

| col_name | type | description |
|---|---|---|
| `save_pctg_last10` | character | Serialized summary of the goalie's save percentage across their most recent 10 games. |
| `save_pctg_details_games_above900_value` | integer | Actual count of games in which this goalie achieved a save percentage above .900. |
| `save_pctg_details_games_above900_percentile` | double | Percentile rank of this goalie's games-above-.900 count relative to all qualifying goalies. |
| `save_pctg_details_games_above900_league_avg` | double | League-average number of games in which goalies posted a save percentage above .900, used as a comparison baseline. |
| `save_pctg_details_pctg_games_above900_value` | double | Proportion (as a decimal fraction) of the goalie's games in which they exceeded a .900 save percentage. |
| `save_pctg_details_pctg_games_above900_percentile` | double | Percentile rank of this goalie's proportion of games above .900 relative to all qualifying goalies. |
| `save_pctg_details_pctg_games_above900_league_avg` | double | League-average percentage of games with a save percentage above .900, used as the baseline comparison. |

**Row type:** `NhlEdgeGoalieSavePercentageDetailRow` (exported from the package root).

### Returns — `nhl_edge_goalie_shot_location_detail` / `nhlEdgeGoalieShotLocationDetail`

| col_name | type | description |
|---|---|---|
| `area` | character | Net/ice zone the shots were taken from. |
| `shots_against` | integer | Shots faced. |
| `saves` | integer | Saves made. |
| `goals_against` | integer | Goals against. |
| `save_pctg` | double | Save percentage. |
| `shots_against_percentile` | double | League percentile rank for shots against. |
| `saves_percentile` | double | League percentile rank for saves. |
| `goals_against_percentile` | double | League percentile rank for goals against. |
| `save_pctg_percentile` | double | League percentile rank for save percentage. |

**Row type:** `NhlEdgeGoalieShotLocationDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_comparison` / `nhlEdgeSkaterComparison`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Serialized list of seasons for which NHL EDGE player-tracking data is available for the skater. |
| `skating_distance_last10` | character | Serialized skating-distance trend data for the skater's most recent 10 games. |
| `shot_location_details` | character | Serialized shot-location breakdown object containing zone-based shot attempt counts and percentages. |
| `shot_location_totals` | character | Serialized aggregate shot-location totals across all zones for the skater. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Handedness of the skater's shot or, for goalies, their catching hand (L or R). |
| `player_sweater_number` | integer | Player jersey number. |
| `player_position` | character | Primary player position. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_goals` | integer | Total regular-season goals scored by the skater in the current season. |
| `player_assists` | integer | Total regular-season assists recorded by the skater in the current season. |
| `player_points` | integer | Player points. |
| `player_games_played` | integer | Number of regular-season games the skater appeared in during the current season. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `player_team_slug` | character | Player team URL-friendly slug. |
| `shot_speed_details_top_shot_speed_imperial` | double | Skater's single highest recorded shot speed in miles per hour for the season. |
| `shot_speed_details_top_shot_speed_metric` | double | Skater's single highest recorded shot speed in kilometres per hour for the season. |
| `shot_speed_details_top_shot_speed_overlay_player_first_name_default` | character | Skater's first name as displayed in the top-shot-speed overlay. |
| `shot_speed_details_top_shot_speed_overlay_player_last_name_default` | character | Skater's last name as displayed in the top-shot-speed overlay. |
| `shot_speed_details_top_shot_speed_overlay_game_date` | character | Calendar date of the game in which the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_away_team_abbrev` | character | Abbreviation of the away team in the game where the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_away_team_score` | integer | Away team's final score in the game where the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_home_team_abbrev` | character | Abbreviation of the home team in the game where the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_home_team_score` | integer | Home team's final score in the game where the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, or SO) of the final period in the game where the skater's top shot speed was recorded. |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods played in the top-shot-speed game (typically 3). |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_number` | integer | Period number in which the skater recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_period_type` | character | Period type label (REG, OT, or SO) of the period in which the skater's top shot speed occurred. |
| `shot_speed_details_top_shot_speed_overlay_time_in_period` | character | Elapsed time within the period (mm:ss) when the skater's top shot speed was recorded. |
| `shot_speed_details_top_shot_speed_overlay_game_type` | integer | Numeric game-type code (e.g. 2 for regular season, 3 for playoffs) for the top-shot-speed game. |
| `shot_speed_details_avg_shot_speed_imperial` | double | Skater's average shot speed in miles per hour, measured by NHL EDGE puck-tracking. |
| `shot_speed_details_avg_shot_speed_metric` | double | Skater's average shot speed in kilometres per hour, measured by NHL EDGE puck-tracking. |
| `shot_speed_details_shot_attempts_over100` | integer | Number of shot attempts the skater recorded at speeds exceeding 100 mph. |
| `shot_speed_details_shot_attempts90_to100` | integer | Number of shot attempts the skater recorded at speeds between 90 and 100 mph. |
| `shot_speed_details_shot_attempts80_to90` | integer | Number of shot attempts the skater recorded at speeds between 80 and 90 mph. |
| `shot_speed_details_shot_attempts70_to80` | integer | Number of shot attempts the skater recorded at speeds between 70 and 80 mph. |
| `skating_speed_details_max_skating_speed_imperial` | double | Skater's single highest skating speed recorded during the season, in miles per hour. |
| `skating_speed_details_max_skating_speed_metric` | double | Skater's single highest skating speed recorded during the season, in kilometres per hour. |
| `skating_speed_details_max_skating_speed_overlay_player_first_name_default` | character | Skater's first name as displayed in the top-skating-speed overlay. |
| `skating_speed_details_max_skating_speed_overlay_player_last_name_default` | character | Skater's last name as displayed in the top-skating-speed overlay. |
| `skating_speed_details_max_skating_speed_overlay_game_date` | character | Calendar date of the game in which the skater reached their maximum skating speed. |
| `skating_speed_details_max_skating_speed_overlay_away_team_abbrev` | character | Abbreviation of the away team in the game where the skater recorded their top skating speed. |
| `skating_speed_details_max_skating_speed_overlay_away_team_score` | integer | Away team's final score in the game where the skater recorded their top skating speed. |
| `skating_speed_details_max_skating_speed_overlay_home_team_abbrev` | character | Abbreviation of the home team in the game where the skater recorded their top skating speed. |
| `skating_speed_details_max_skating_speed_overlay_home_team_score` | integer | Home team's final score in the game where the skater recorded their top skating speed. |
| `skating_speed_details_max_skating_speed_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, or SO) of the final period in the game where the skater's top speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the skater reached their top skating speed (typically 3). |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_number` | integer | Period number in which the skater reached their maximum skating speed. |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_period_type` | character | Period type label (REG or OT) for the period in which the skater's top speed occurred. |
| `skating_speed_details_max_skating_speed_overlay_time_in_period` | character | Elapsed time within the period (mm:ss) when the skater reached their maximum skating speed. |
| `skating_speed_details_max_skating_speed_overlay_game_type` | integer | Numeric game-type code for the game in which the skater recorded their maximum skating speed. |
| `skating_speed_details_bursts_over22` | integer | Number of skating speed bursts the skater recorded exceeding 22 mph during the season. |
| `skating_speed_details_bursts20_to22` | integer | Number of skating speed bursts the skater recorded between 20 and 22 mph during the season. |
| `skating_speed_details_bursts18_to20` | integer | Number of skating speed bursts the skater recorded between 18 and 20 mph during the season. |
| `skating_distance_details_distance_total_imperial` | double | Total cumulative skating distance the skater covered across all games in the season, in miles. |
| `skating_distance_details_distance_total_metric` | double | Total cumulative skating distance the skater covered across all games in the season, in kilometres. |
| `skating_distance_details_distance_per60_imperial` | double | Skater's average skating distance per 60 minutes of ice time during the season, in miles. |
| `skating_distance_details_distance_per60_metric` | double | Skater's average skating distance per 60 minutes of ice time during the season, in kilometres. |
| `skating_distance_details_distance_max_game_imperial` | double | Greatest total distance the skater covered in any single game during the season, in miles. |
| `skating_distance_details_distance_max_game_metric` | double | Greatest total distance the skater covered in any single game during the season, in kilometres. |
| `skating_distance_details_distance_max_game_overlay_player_first_name_default` | character | Skater's first name as displayed in the single-game maximum distance overlay. |
| `skating_distance_details_distance_max_game_overlay_player_last_name_default` | character | Skater's last name as displayed in the single-game maximum distance overlay. |
| `skating_distance_details_distance_max_game_overlay_game_date` | character | Calendar date of the game in which the skater covered their maximum single-game distance. |
| `skating_distance_details_distance_max_game_overlay_away_team_abbrev` | character | Abbreviation of the away team in the game where the skater set their single-game distance record. |
| `skating_distance_details_distance_max_game_overlay_away_team_score` | integer | Away team's final score in the game where the skater set their single-game distance record. |
| `skating_distance_details_distance_max_game_overlay_home_team_abbrev` | character | Abbreviation of the home team in the game where the skater set their single-game distance record. |
| `skating_distance_details_distance_max_game_overlay_home_team_score` | integer | Home team's final score in the game where the skater set their single-game distance record. |
| `skating_distance_details_distance_max_game_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, or SO) of the final period in the skater's maximum single-game distance game. |
| `skating_distance_details_distance_max_game_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where the skater set their single-game distance record. |
| `skating_distance_details_distance_max_game_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the skater covered their greatest single-game distance. |
| `skating_distance_details_distance_max_game_overlay_period_descriptor_number` | integer | Period number being referenced in the skater's maximum single-game distance overlay context. |
| `skating_distance_details_distance_max_game_overlay_period_descriptor_period_type` | character | Period type label for the period referenced in the skater's maximum single-game distance overlay. |
| `skating_distance_details_distance_max_game_overlay_game_type` | integer | Numeric game-type code for the game in which the skater covered their maximum single-game distance. |
| `skating_distance_details_distance_max_period_imperial` | double | Greatest distance the skater covered in any single period during the season, in miles. |
| `skating_distance_details_distance_max_period_metric` | double | Greatest distance the skater covered in any single period during the season, in kilometres. |
| `skating_distance_details_distance_max_period_overlay_player_first_name_default` | character | Skater's first name as displayed in the single-period maximum distance overlay. |
| `skating_distance_details_distance_max_period_overlay_player_last_name_default` | character | Skater's last name as displayed in the single-period maximum distance overlay. |
| `skating_distance_details_distance_max_period_overlay_game_date` | character | Calendar date of the game in which the skater covered their maximum single-period distance. |
| `skating_distance_details_distance_max_period_overlay_away_team_abbrev` | character | Abbreviation of the away team in the game where the skater set their single-period distance record. |
| `skating_distance_details_distance_max_period_overlay_away_team_score` | integer | Away team's final score in the game where the skater set their single-period distance record. |
| `skating_distance_details_distance_max_period_overlay_home_team_abbrev` | character | Abbreviation of the home team in the game where the skater set their single-period distance record. |
| `skating_distance_details_distance_max_period_overlay_home_team_score` | integer | Home team's final score in the game where the skater set their single-period distance record. |
| `skating_distance_details_distance_max_period_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, or SO) of the final period in the skater's maximum single-period distance game. |
| `skating_distance_details_distance_max_period_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the skater covered their greatest single-period distance. |
| `skating_distance_details_distance_max_period_overlay_period_descriptor_number` | integer | Period number in which the skater covered their maximum single-period skating distance. |
| `skating_distance_details_distance_max_period_overlay_period_descriptor_period_type` | character | Period type label (REG, OT) for the period in which the skater's single-period distance record was set. |
| `skating_distance_details_distance_max_period_overlay_game_type` | integer | Numeric game-type code for the game in which the skater covered their maximum single-period distance. |
| `zone_time_details_offensive_zone_pctg` | double | Percentage of the skater's total ice time spent in the offensive zone, per EDGE tracking. |
| `zone_time_details_offensive_zone_league_avg` | double | League-average percentage of ice time that skaters spend in the offensive zone. |
| `zone_time_details_neutral_zone_pctg` | double | Percentage of the skater's total ice time spent in the neutral zone, per EDGE tracking. |
| `zone_time_details_neutral_zone_league_avg` | double | League-average percentage of ice time that skaters spend in the neutral zone. |
| `zone_time_details_defensive_zone_pctg` | double | Percentage of the skater's total ice time spent in the defensive zone, per EDGE tracking. |
| `zone_time_details_defensive_zone_league_avg` | double | League-average percentage of ice time that skaters spend in the defensive zone. |
| `zone_starts_offensive_zone_starts` | double | Percentage of the skater's on-ice faceoffs that were taken in the offensive zone. |
| `zone_starts_neutral_zone_starts` | double | Percentage of the skater's on-ice faceoffs that were taken in the neutral zone. |
| `zone_starts_defensive_zone_starts` | double | Percentage of the skater's on-ice faceoffs that were taken in the defensive zone. |

**Row type:** `NhlEdgeSkaterComparisonRow` (exported from the package root).

### Returns — `nhl_edge_skater_detail` / `nhlEdgeSkaterDetail`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Comma-separated list or serialized array of seasons for which NHL EDGE player-tracking data is available for this skater. |
| `sog_summary` | character | Serialized summary-level shots-on-goal statistics for the skater, as returned in the NHL EDGE skater detail payload. |
| `sog_details` | character | Serialized detail breakdown of shots on goal by game or other sub-category, as returned in the NHL EDGE skater detail payload. |
| `player_id` | integer | Unique player identifier. |
| `player_first_name_default` | character | Player first name (default language). |
| `player_last_name_default` | character | Player last name (default language). |
| `player_birth_date` | character | Participant birth date (YYYY-MM-DD). |
| `player_shoots_catches` | character | Handedness indicator for the skater showing the side they shoot from ('L' for left, 'R' for right). |
| `player_sweater_number` | integer | Player jersey number. |
| `player_position` | character | Primary player position. |
| `player_slug` | character | URL slug for the player. |
| `player_headshot` | character | URL to the player headshot image. |
| `player_goals` | integer | Total regular-season goals scored by the skater in the current NHL season, as returned in the EDGE skater detail. |
| `player_assists` | integer | Total regular-season assists recorded by the skater in the current NHL season, as returned in the EDGE skater detail. |
| `player_points` | integer | Player points. |
| `player_games_played` | integer | Total number of regular-season games played by the skater in the current NHL season, as returned in the EDGE skater detail. |
| `player_team_common_name_default` | character | Player team common name (default locale). |
| `player_team_place_name_with_preposition_default` | character | Player team place name with preposition (default locale). |
| `player_team_place_name_with_preposition_fr` | character | Player team place name with preposition (French locale). |
| `player_team_abbrev` | character | Player team abbreviation. |
| `player_team_team_logo_light` | character | Player team light-mode logo URL. |
| `player_team_team_logo_dark` | character | Player team dark-mode logo URL. |
| `top_shot_speed_imperial` | double | Player's highest recorded shot speed for the season measured in miles per hour (imperial), as captured by NHL EDGE puck-tracking. |
| `top_shot_speed_metric` | double | Player's highest recorded shot speed for the season measured in kilometers per hour (metric), as captured by NHL EDGE puck-tracking. |
| `top_shot_speed_percentile` | double | Percentile rank of the player's top shot speed relative to all qualifying skaters in the NHL EDGE dataset. |
| `top_shot_speed_league_avg_imperial` | double | League-average top shot speed among qualifying skaters for the season, measured in miles per hour (imperial). |
| `top_shot_speed_league_avg_metric` | double | League-average top shot speed among qualifying skaters for the season, measured in kilometers per hour (metric). |
| `top_shot_speed_overlay_player_first_name_default` | character | Player's first name as stored in the NHL api-web system, included in the overlay for the top-shot-speed game. |
| `top_shot_speed_overlay_player_last_name_default` | character | Player's last name as stored in the NHL api-web system, included in the overlay for the top-shot-speed game. |
| `top_shot_speed_overlay_game_date` | character | Date (YYYY-MM-DD) of the game in which the player recorded their top shot speed for the season. |
| `top_shot_speed_overlay_away_team_abbrev` | character | Three-letter abbreviation for the away team in the game where the player recorded their top shot speed this season. |
| `top_shot_speed_overlay_away_team_score` | integer | Away team's final score in the game where the player recorded their season-high shot speed. |
| `top_shot_speed_overlay_home_team_abbrev` | character | Three-letter abbreviation for the home team in the game where the player achieved their top shot speed this season. |
| `top_shot_speed_overlay_home_team_score` | integer | Home team's final score in the game where the player recorded their season-high shot speed. |
| `top_shot_speed_overlay_game_outcome_last_period_type` | character | Type of period that ended the game where the player set their top shot speed (e.g., 'REG', 'OT', 'SO'). |
| `top_shot_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods defined for the game type in which the player recorded their top shot speed. |
| `top_shot_speed_overlay_period_descriptor_number` | integer | Period number in which the player recorded their top shot speed during the referenced game. |
| `top_shot_speed_overlay_period_descriptor_period_type` | character | Period type label (e.g., 'REG', 'OT') for the period in which the player hit their top shot speed. |
| `top_shot_speed_overlay_time_in_period` | character | Time elapsed within the period (MM:SS) when the player released their top-speed shot for the season. |
| `top_shot_speed_overlay_game_type` | integer | Numeric code for the game type of the game in which the player recorded their top shot speed (e.g., 2 = regular season). |
| `skating_speed_speed_max_imperial` | double | Player's top recorded skating speed for the season measured in miles per hour (imperial), as captured by NHL EDGE player tracking. |
| `skating_speed_speed_max_metric` | double | Player's top recorded skating speed for the season measured in kilometers per hour (metric), as captured by NHL EDGE player tracking. |
| `skating_speed_speed_max_percentile` | double | Percentile rank of the player's top skating speed relative to all qualifying skaters in the NHL EDGE dataset. |
| `skating_speed_speed_max_league_avg_imperial` | double | League-average top skating speed among qualifying skaters for the season, measured in miles per hour (imperial). |
| `skating_speed_speed_max_league_avg_metric` | double | League-average top skating speed among qualifying skaters for the season, measured in kilometers per hour (metric). |
| `skating_speed_speed_max_overlay_player_first_name_default` | character | Player's first name as stored in the NHL api-web system, included in the overlay for the top-skating-speed game. |
| `skating_speed_speed_max_overlay_player_last_name_default` | character | Player's last name as stored in the NHL api-web system, included in the overlay for the top-skating-speed game. |
| `skating_speed_speed_max_overlay_game_date` | character | Date (YYYY-MM-DD) of the game in which the player recorded their top skating speed for the season. |
| `skating_speed_speed_max_overlay_away_team_abbrev` | character | Three-letter abbreviation for the away team in the game where the player achieved their top skating speed this season. |
| `skating_speed_speed_max_overlay_away_team_score` | integer | Away team's final score in the game where the player achieved their season-high skating speed. |
| `skating_speed_speed_max_overlay_home_team_abbrev` | character | Three-letter abbreviation for the home team in the game where the player achieved their top skating speed this season. |
| `skating_speed_speed_max_overlay_home_team_score` | integer | Home team's final score in the game where the player achieved their season-high skating speed. |
| `skating_speed_speed_max_overlay_game_outcome_last_period_type` | character | Type of period that ended the game where the player set their top skating speed (e.g., 'REG', 'OT', 'SO'). |
| `skating_speed_speed_max_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods defined for the game type in which the player set their top skating speed. |
| `skating_speed_speed_max_overlay_period_descriptor_number` | integer | Period number in which the player recorded their top skating speed during the referenced game. |
| `skating_speed_speed_max_overlay_period_descriptor_period_type` | character | Period type label (e.g., 'REG', 'OT') for the period in which the player hit their top skating speed. |
| `skating_speed_speed_max_overlay_time_in_period` | character | Time elapsed within the period (MM:SS) when the player recorded their top skating speed for the season. |
| `skating_speed_speed_max_overlay_game_type` | integer | Numeric code for the game type of the game in which the player recorded their top skating speed (e.g., 2 = regular season). |
| `skating_speed_bursts_over20_value` | integer | Number of distinct skating speed bursts exceeding 20 mph recorded for the player across the season in NHL EDGE tracking data. |
| `skating_speed_bursts_over20_percentile` | double | Percentile rank of the player's count of skating speed bursts exceeding 20 mph relative to all qualifying skaters in the NHL EDGE dataset. |
| `skating_speed_bursts_over20_league_avg_value` | double | League-average season total of skating speed bursts exceeding 20 mph among qualifying skaters, the EDGE baseline comparator. |
| `total_distance_skated_imperial` | double | Total cumulative distance skated by the player across all tracked games in the season, measured in miles (imperial). |
| `total_distance_skated_metric` | double | Total cumulative distance skated by the player across all tracked games in the season, measured in kilometers (metric). |
| `total_distance_skated_percentile` | double | Percentile rank of the player's total season skating distance relative to all qualifying skaters in the NHL EDGE dataset. |
| `total_distance_skated_league_avg_imperial` | double | League-average total season skating distance among qualifying skaters, measured in miles (imperial). |
| `total_distance_skated_league_avg_metric` | double | League-average total season skating distance among qualifying skaters, measured in kilometers (metric). |
| `distance_max_game_imperial` | double | Maximum distance skated by the player in their single best game of the season, measured in miles (imperial). |
| `distance_max_game_metric` | double | Maximum distance skated by the player in their single best game of the season, measured in kilometers (metric). |
| `distance_max_game_percentile` | double | Percentile rank of the player's maximum single-game skating distance relative to all qualifying skaters in the NHL EDGE dataset. |
| `distance_max_game_league_avg_imperial` | double | League-average maximum single-game distance skated among all qualifying skaters, measured in miles (imperial). |
| `distance_max_game_league_avg_metric` | double | League-average maximum single-game distance skated among all qualifying skaters, measured in kilometers (metric). |
| `distance_max_game_overlay_player_first_name_default` | character | Player's first name as stored in the NHL api-web system, included in the overlay context for the max-distance game. |
| `distance_max_game_overlay_player_last_name_default` | character | Player's last name as stored in the NHL api-web system, included in the overlay context for the max-distance game. |
| `distance_max_game_overlay_game_date` | character | Date (YYYY-MM-DD) of the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_away_team_abbrev` | character | Three-letter abbreviation for the away team in the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_away_team_score` | integer | Away team's final score in the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_home_team_abbrev` | character | Three-letter abbreviation for the home team in the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_home_team_score` | integer | Home team's final score in the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_game_outcome_last_period_type` | character | Type of period that ended the game where the player set their maximum single-game skating distance (e.g., 'REG', 'OT', 'SO'). |
| `distance_max_game_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where the player achieved their maximum single-game skating distance. |
| `distance_max_game_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods defined for the game type in which the player set their max-distance performance. |
| `distance_max_game_overlay_period_descriptor_number` | integer | Period number during which the player's max-distance game context is anchored in the NHL EDGE overlay data. |
| `distance_max_game_overlay_period_descriptor_period_type` | character | Period type label (e.g., 'REG', 'OT') for the period referenced in the max-distance game overlay. |
| `distance_max_game_overlay_game_type` | integer | Numeric code for the game type (e.g., 2 = regular season, 3 = playoffs) of the max-distance game. |
| `zone_time_details_offensive_zone_pctg` | double | Percentage of the player's total tracked ice time spent in the offensive zone across all situations, as measured by NHL EDGE zone-time tracking. |
| `zone_time_details_offensive_zone_percentile` | double | Percentile rank of the player's overall offensive zone time percentage relative to all qualifying skaters in the NHL EDGE dataset. |
| `zone_time_details_offensive_zone_league_avg` | double | League-average percentage of all-situation ice time spent in the offensive zone among qualifying skaters, used as a comparison baseline. |
| `zone_time_details_offensive_zone_ev_pctg` | double | Percentage of the player's even-strength ice time spent in the offensive zone, as measured by NHL EDGE zone-time tracking. |
| `zone_time_details_offensive_zone_ev_percentile` | double | Percentile rank of the player's even-strength offensive zone time percentage relative to all qualifying skaters in the NHL EDGE dataset. |
| `zone_time_details_offensive_zone_ev_league_avg` | double | League-average percentage of even-strength ice time spent in the offensive zone among qualifying skaters, used as a comparison baseline. |
| `zone_time_details_neutral_zone_pctg` | double | Percentage of the player's total tracked ice time spent in the neutral zone, as measured by NHL EDGE zone-time tracking. |
| `zone_time_details_neutral_zone_percentile` | double | Percentile rank of the player's neutral zone time percentage relative to all qualifying skaters in the NHL EDGE dataset. |
| `zone_time_details_neutral_zone_league_avg` | double | League-average percentage of ice time spent in the neutral zone among qualifying skaters, used as a comparison baseline. |
| `zone_time_details_defensive_zone_pctg` | double | Percentage of the player's total tracked ice time spent in the defensive zone, as measured by NHL EDGE zone-time tracking. |
| `zone_time_details_defensive_zone_percentile` | double | Percentile rank of the player's defensive zone time percentage relative to all qualifying skaters in the NHL EDGE dataset. |
| `zone_time_details_defensive_zone_league_avg` | double | League-average percentage of ice time spent in the defensive zone among qualifying skaters, used as a comparison baseline. |

**Row type:** `NhlEdgeSkaterDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_landing` / `nhlEdgeSkaterLanding`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | List of NHL seasons for which this skater has NHL EDGE player-tracking statistics available. |
| `leaders_hardest_shot_player_id` | integer | Unique NHL identifier for the skater atop the hardest shot speed leaderboard. |
| `leaders_hardest_shot_player_first_name_default` | character | First name of the skater leading the hardest shot speed leaderboard, in the default display language. |
| `leaders_hardest_shot_player_last_name_default` | character | Last name of the skater leading the hardest shot speed leaderboard, in the default display language. |
| `leaders_hardest_shot_player_sweater_number` | integer | Jersey number worn by the skater leading the hardest shot speed leaderboard. |
| `leaders_hardest_shot_player_position` | character | Ice position (e.g., C, LW, RW, D) of the hardest shot speed leaderboard leader. |
| `leaders_hardest_shot_player_slug` | character | URL-safe slug identifying the hardest shot leaderboard leader on the NHL website. |
| `leaders_hardest_shot_player_headshot` | character | URL of the headshot image for the hardest shot leaderboard leader. |
| `leaders_hardest_shot_player_team_common_name_default` | character | Common team name of the hardest shot leaderboard leader's club, in the default language. |
| `leaders_hardest_shot_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the hardest shot leader's team. |
| `leaders_hardest_shot_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the hardest shot leader's team. |
| `leaders_hardest_shot_player_team_abbrev` | character | Three-letter abbreviation of the team the hardest shot leaderboard leader plays for. |
| `leaders_hardest_shot_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the hardest shot leaderboard leader's club. |
| `leaders_hardest_shot_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the hardest shot leaderboard leader's club. |
| `leaders_hardest_shot_overlay_player_first_name_default` | character | First name of the skater shown in the hardest shot game overlay, in the default language. |
| `leaders_hardest_shot_overlay_player_last_name_default` | character | Last name of the skater shown in the hardest shot game overlay, in the default language. |
| `leaders_hardest_shot_overlay_game_date` | character | Calendar date of the game in which the hardest shot leader recorded their fastest shot speed. |
| `leaders_hardest_shot_overlay_away_team_abbrev` | character | Three-letter abbreviation of the away team in the game where the hardest shot leader recorded their top shot speed. |
| `leaders_hardest_shot_overlay_away_team_score` | integer | Final score of the away team in the game where the hardest shot leader recorded their top shot speed. |
| `leaders_hardest_shot_overlay_home_team_abbrev` | character | Three-letter abbreviation of the home team in the game where the hardest shot leader recorded their top shot speed. |
| `leaders_hardest_shot_overlay_home_team_score` | integer | Final score of the home team in the game where the hardest shot leader recorded their top shot speed. |
| `leaders_hardest_shot_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, SO) that decided the outcome of the game where the hardest shot leader set their mark. |
| `leaders_hardest_shot_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where the hardest shot leader recorded their top speed. |
| `leaders_hardest_shot_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the hardest shot leader set their record (typically 3). |
| `leaders_hardest_shot_overlay_period_descriptor_number` | integer | Period number in which the hardest shot leader's fastest shot was recorded. |
| `leaders_hardest_shot_overlay_period_descriptor_period_type` | character | Period type label (e.g., REG, OT) for the period in which the hardest shot was recorded. |
| `leaders_hardest_shot_overlay_time_in_period` | character | Elapsed time within the period when the hardest shot leader's fastest recorded shot occurred. |
| `leaders_hardest_shot_overlay_game_type` | integer | Game type code (e.g., regular season, playoffs) for the game where the hardest shot leader set their record. |
| `leaders_hardest_shot_shot_speed_imperial` | double | Fastest NHL EDGE-tracked shot speed (in mph) recorded by the hardest shot leaderboard leader. |
| `leaders_hardest_shot_shot_speed_metric` | double | Fastest NHL EDGE-tracked shot speed (in km/h) recorded by the hardest shot leaderboard leader. |
| `leaders_max_skating_speed_player_id` | integer | Unique NHL identifier for the skater atop the maximum skating speed leaderboard. |
| `leaders_max_skating_speed_player_first_name_default` | character | First name of the skater leading the maximum skating speed leaderboard, in the default display language. |
| `leaders_max_skating_speed_player_last_name_default` | character | Last name of the skater leading the maximum skating speed leaderboard, in the default display language. |
| `leaders_max_skating_speed_player_sweater_number` | integer | Jersey number worn by the skater leading the maximum skating speed leaderboard. |
| `leaders_max_skating_speed_player_position` | character | Ice position (e.g., C, LW, RW, D) of the maximum skating speed leaderboard leader. |
| `leaders_max_skating_speed_player_slug` | character | URL-safe slug identifying the maximum skating speed leaderboard leader on the NHL website. |
| `leaders_max_skating_speed_player_headshot` | character | URL of the headshot image for the maximum skating speed leaderboard leader. |
| `leaders_max_skating_speed_player_team_common_name_default` | character | Common team name of the maximum skating speed leaderboard leader's club, in the default language. |
| `leaders_max_skating_speed_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the max skating speed leader's team. |
| `leaders_max_skating_speed_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the max skating speed leader's team. |
| `leaders_max_skating_speed_player_team_abbrev` | character | Three-letter abbreviation of the team the maximum skating speed leaderboard leader plays for. |
| `leaders_max_skating_speed_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the maximum skating speed leaderboard leader's club. |
| `leaders_max_skating_speed_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the maximum skating speed leaderboard leader's club. |
| `leaders_max_skating_speed_overlay_player_first_name_default` | character | First name of the skater shown in the max skating speed game overlay, in the default language. |
| `leaders_max_skating_speed_overlay_player_last_name_default` | character | Last name of the skater shown in the max skating speed game overlay, in the default language. |
| `leaders_max_skating_speed_overlay_game_date` | character | Calendar date of the game in which the max skating speed leader recorded their fastest burst speed. |
| `leaders_max_skating_speed_overlay_away_team_abbrev` | character | Three-letter abbreviation of the away team in the game where the max skating speed leader recorded their top speed. |
| `leaders_max_skating_speed_overlay_away_team_score` | integer | Final score of the away team in the game where the max skating speed leader set their top burst speed. |
| `leaders_max_skating_speed_overlay_home_team_abbrev` | character | Three-letter abbreviation of the home team in the game where the max skating speed leader recorded their top speed. |
| `leaders_max_skating_speed_overlay_home_team_score` | integer | Final score of the home team in the game where the max skating speed leader set their top burst speed. |
| `leaders_max_skating_speed_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, SO) that decided the game where the max skating speed leader set their top mark. |
| `leaders_max_skating_speed_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where the max skating speed leader recorded their fastest speed. |
| `leaders_max_skating_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the max skating speed leader set their record (typically 3). |
| `leaders_max_skating_speed_overlay_period_descriptor_number` | integer | Period number in which the max skating speed leader's fastest burst was recorded. |
| `leaders_max_skating_speed_overlay_period_descriptor_period_type` | character | Period type label (e.g., REG, OT) for the period in which the max skating speed was recorded. |
| `leaders_max_skating_speed_overlay_time_in_period` | character | Elapsed time within the period when the max skating speed leader's fastest burst was recorded. |
| `leaders_max_skating_speed_overlay_game_type` | integer | Game type code (e.g., regular season, playoffs) for the game where the max skating speed leader set their record. |
| `leaders_max_skating_speed_skating_speed_imperial` | double | Peak skating burst speed (in mph) recorded by the maximum skating speed leaderboard leader, per NHL EDGE tracking. |
| `leaders_max_skating_speed_skating_speed_metric` | double | Peak skating burst speed (in km/h) recorded by the maximum skating speed leaderboard leader, per NHL EDGE tracking. |
| `leaders_total_distance_skated_player_id` | integer | Unique NHL identifier for the skater atop the total distance skated leaderboard. |
| `leaders_total_distance_skated_player_first_name_default` | character | First name of the skater leading the total distance skated leaderboard, in the default display language. |
| `leaders_total_distance_skated_player_last_name_default` | character | Last name of the skater leading the total distance skated leaderboard, in the default display language. |
| `leaders_total_distance_skated_player_sweater_number` | integer | Jersey number worn by the skater leading the total distance skated leaderboard. |
| `leaders_total_distance_skated_player_position` | character | Ice position (e.g., C, LW, RW, D) of the total distance skated leaderboard leader. |
| `leaders_total_distance_skated_player_slug` | character | URL-safe slug identifying the total distance skated leaderboard leader on the NHL website. |
| `leaders_total_distance_skated_player_headshot` | character | URL of the headshot image for the total distance skated leaderboard leader. |
| `leaders_total_distance_skated_player_team_common_name_default` | character | Common team name of the total distance skated leaderboard leader's club, in the default language. |
| `leaders_total_distance_skated_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the total distance skated leader's team. |
| `leaders_total_distance_skated_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the total distance skated leader's team. |
| `leaders_total_distance_skated_player_team_abbrev` | character | Three-letter abbreviation of the team the total distance skated leaderboard leader plays for. |
| `leaders_total_distance_skated_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the total distance skated leaderboard leader's club. |
| `leaders_total_distance_skated_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the total distance skated leaderboard leader's club. |
| `leaders_total_distance_skated_distance_skated_imperial` | double | Cumulative skating distance (in miles) recorded by the total distance skated leaderboard leader, per NHL EDGE tracking. |
| `leaders_total_distance_skated_distance_skated_metric` | double | Cumulative skating distance (in kilometres) recorded by the total distance skated leaderboard leader, per NHL EDGE tracking. |
| `leaders_distance_max_game_player_id` | integer | Unique NHL identifier for the skater who recorded the highest single-game skating distance. |
| `leaders_distance_max_game_player_first_name_default` | character | First name of the skater who skated the farthest distance in a single game, in the default display language. |
| `leaders_distance_max_game_player_last_name_default` | character | Last name of the skater who skated the farthest distance in a single game, in the default display language. |
| `leaders_distance_max_game_player_sweater_number` | integer | Jersey number worn by the skater who recorded the highest single-game skating distance. |
| `leaders_distance_max_game_player_position` | character | Ice position (e.g., C, LW, RW, D) of the single-game distance skating leader. |
| `leaders_distance_max_game_player_slug` | character | URL-safe slug identifying the single-game distance skating leader on the NHL website. |
| `leaders_distance_max_game_player_headshot` | character | URL of the headshot image for the skater atop the single-game distance leaderboard. |
| `leaders_distance_max_game_player_team_common_name_default` | character | Common team name of the single-game distance skating leader's club, in the default language. |
| `leaders_distance_max_game_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the single-game distance leader's team. |
| `leaders_distance_max_game_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the single-game distance leader's team. |
| `leaders_distance_max_game_player_team_abbrev` | character | Three-letter abbreviation of the team the single-game distance skating leader plays for. |
| `leaders_distance_max_game_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the single-game distance skating leader's club. |
| `leaders_distance_max_game_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the single-game distance skating leader's club. |
| `leaders_distance_max_game_distance_skated_imperial` | double | Farthest single-game skating distance (in miles) recorded by the distance-max-game leaderboard leader, per NHL EDGE tracking. |
| `leaders_distance_max_game_distance_skated_metric` | double | Farthest single-game skating distance (in kilometres) recorded by the distance-max-game leaderboard leader, per NHL EDGE tracking. |
| `leaders_distance_max_game_overlay_player_first_name_default` | character | First name of the skater displayed in the distance-max-game game overlay, in the default language. |
| `leaders_distance_max_game_overlay_player_last_name_default` | character | Last name of the skater displayed in the distance-max-game game overlay, in the default language. |
| `leaders_distance_max_game_overlay_game_date` | character | Calendar date of the game in which the distance-max-game leader skated their record single-game distance. |
| `leaders_distance_max_game_overlay_away_team_abbrev` | character | Three-letter abbreviation of the away team in the game where the distance-max-game leader set their top mark. |
| `leaders_distance_max_game_overlay_away_team_score` | integer | Final score of the away team in the game where the distance-max-game leader set their single-game distance record. |
| `leaders_distance_max_game_overlay_home_team_abbrev` | character | Three-letter abbreviation of the home team in the game where the distance-max-game leader set their top mark. |
| `leaders_distance_max_game_overlay_home_team_score` | integer | Final score of the home team in the game where the distance-max-game leader set their single-game distance record. |
| `leaders_distance_max_game_overlay_game_outcome_last_period_type` | character | Period type (REG, OT, SO) that decided the outcome of the game where the distance-max-game leader set their record. |
| `leaders_distance_max_game_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where the distance-max-game leader set their single-game distance record. |
| `leaders_distance_max_game_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game where the distance-max-game leader set their record (typically 3). |
| `leaders_distance_max_game_overlay_period_descriptor_number` | integer | Period number in which the distance-max-game leader's record tracking event was most notable. |
| `leaders_distance_max_game_overlay_period_descriptor_period_type` | character | Period type label (e.g., REG, OT) for the period highlighted in the distance-max-game overlay. |
| `leaders_distance_max_game_overlay_game_type` | integer | Game type code (e.g., regular season, playoffs) for the game where the distance-max-game leader set their record. |
| `leaders_high_danger_sog_player_id` | integer | Unique NHL identifier for the skater atop the high-danger shots-on-goal leaderboard. |
| `leaders_high_danger_sog_player_first_name_default` | character | First name of the skater leading the high-danger shots-on-goal leaderboard, in the default display language. |
| `leaders_high_danger_sog_player_last_name_default` | character | Last name of the skater leading the high-danger shots-on-goal leaderboard, in the default display language. |
| `leaders_high_danger_sog_player_sweater_number` | integer | Jersey number worn by the skater leading the high-danger shots-on-goal leaderboard. |
| `leaders_high_danger_sog_player_position` | character | Ice position (e.g., C, LW, RW, D) of the high-danger shots-on-goal leaderboard leader. |
| `leaders_high_danger_sog_player_slug` | character | URL-safe slug identifying the high-danger shots-on-goal leaderboard leader on the NHL website. |
| `leaders_high_danger_sog_player_headshot` | character | URL of the headshot image for the high-danger shots-on-goal leaderboard leader. |
| `leaders_high_danger_sog_player_team_common_name_default` | character | Common team name of the high-danger shots-on-goal leaderboard leader's club, in the default language. |
| `leaders_high_danger_sog_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the high-danger shots-on-goal leader's team. |
| `leaders_high_danger_sog_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the high-danger shots-on-goal leader's team. |
| `leaders_high_danger_sog_player_team_abbrev` | character | Three-letter abbreviation of the team the high-danger shots-on-goal leader plays for. |
| `leaders_high_danger_sog_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the high-danger shots-on-goal leader's club. |
| `leaders_high_danger_sog_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the high-danger shots-on-goal leader's club. |
| `leaders_high_danger_sog_sog` | integer | Total number of high-danger shots on goal recorded by the leaderboard leader, as tracked by NHL EDGE puck tracking. |
| `leaders_high_danger_sog_shot_location_details` | character | Structured details describing the ice zones or slot locations from which the high-danger shots-on-goal leader's tracked shots originated. |
| `leaders_offensive_zone_time_player_id` | integer | Unique NHL identifier for the skater atop the offensive zone time leaderboard. |
| `leaders_offensive_zone_time_player_first_name_default` | character | First name of the skater leading the offensive zone time leaderboard, in the default display language. |
| `leaders_offensive_zone_time_player_last_name_default` | character | Last name of the skater leading the offensive zone time leaderboard, in the default display language. |
| `leaders_offensive_zone_time_player_sweater_number` | integer | Jersey number worn by the skater leading the offensive zone time leaderboard. |
| `leaders_offensive_zone_time_player_position` | character | Ice position (e.g., C, LW, RW, D) of the offensive zone time leaderboard leader. |
| `leaders_offensive_zone_time_player_slug` | character | URL-safe slug identifying the offensive zone time leaderboard leader on the NHL website. |
| `leaders_offensive_zone_time_player_headshot` | character | URL of the headshot image for the offensive zone time leaderboard leader. |
| `leaders_offensive_zone_time_player_team_common_name_default` | character | Common team name of the offensive zone time leaderboard leader's club, in the default language. |
| `leaders_offensive_zone_time_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language for the offensive zone time leader's team. |
| `leaders_offensive_zone_time_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the offensive zone time leader's team. |
| `leaders_offensive_zone_time_player_team_abbrev` | character | Three-letter abbreviation of the team the offensive zone time leaderboard leader plays for. |
| `leaders_offensive_zone_time_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the offensive zone time leaderboard leader's club. |
| `leaders_offensive_zone_time_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the offensive zone time leaderboard leader's club. |
| `leaders_offensive_zone_time_zone_time` | double | Total time the offensive zone time leaderboard leader spent in the offensive zone, as tracked by NHL EDGE player tracking. |
| `leaders_defensive_zone_time_player_id` | integer | Unique NHL identifier for the skater atop the defensive zone time leaderboard. |
| `leaders_defensive_zone_time_player_first_name_default` | character | First name of the skater leading the defensive zone time leaderboard, in the default display language. |
| `leaders_defensive_zone_time_player_last_name_default` | character | Last name of the skater leading the defensive zone time leaderboard, in the default display language. |
| `leaders_defensive_zone_time_player_sweater_number` | integer | Jersey number worn by the skater leading the defensive zone time leaderboard. |
| `leaders_defensive_zone_time_player_position` | character | Ice position (e.g., C, LW, RW, D) of the defensive zone time leaderboard leader. |
| `leaders_defensive_zone_time_player_slug` | character | URL-safe slug identifying the defensive zone time leaderboard leader on the NHL website. |
| `leaders_defensive_zone_time_player_headshot` | character | URL of the headshot image for the defensive zone time leaderboard leader. |
| `leaders_defensive_zone_time_player_team_common_name_default` | character | Common team name (e.g., Maple Leafs) of the defensive zone time leaderboard leader's club, in the default language. |
| `leaders_defensive_zone_time_player_team_place_name_with_preposition_default` | character | Team place name with grammatical preposition in the default language (e.g., "in Toronto") for the defensive zone time leader's team. |
| `leaders_defensive_zone_time_player_team_place_name_with_preposition_fr` | character | Team place name with grammatical preposition in French for the defensive zone time leader's team. |
| `leaders_defensive_zone_time_player_team_abbrev` | character | Three-letter abbreviation of the team the defensive zone time leader plays for. |
| `leaders_defensive_zone_time_player_team_team_logo_light` | character | URL of the light-background version of the team logo for the defensive zone time leaderboard leader's club. |
| `leaders_defensive_zone_time_player_team_team_logo_dark` | character | URL of the dark-background version of the team logo for the defensive zone time leaderboard leader's club. |
| `leaders_defensive_zone_time_zone_time` | double | Total time the defensive zone time leaderboard leader spent in the defensive zone, as tracked by NHL EDGE player tracking. |

**Row type:** `NhlEdgeSkaterLandingRow` (exported from the package root).

### Returns — `nhl_edge_skater_shot_location_detail` / `nhlEdgeSkaterShotLocationDetail`

| col_name | type | description |
|---|---|---|
| `area` | character | Net/ice zone the shots were taken from. |
| `sog` | integer | Shots on goal from the area. |
| `goals` | integer | Goals scored. |
| `shooting_pctg` | double | Shooting percentage from the area. |
| `sog_percentile` | double | League percentile rank for shots on goal. |
| `goals_percentile` | double | League percentile rank for goals. |
| `shooting_pctg_percentile` | double | League percentile rank for shooting percentage. |

**Row type:** `NhlEdgeSkaterShotLocationDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_shot_speed_detail` / `nhlEdgeSkaterShotSpeedDetail`

| col_name | type | description |
|---|---|---|
| `hardest_shots` | character | Serialized list or JSON array of the player's hardest individual shot efforts, including speed and context metadata from NHL EDGE puck tracking. |
| `shot_speed_details_top_shot_speed_imperial` | double | Player's single highest recorded shot speed for the season measured in miles per hour (imperial), from NHL EDGE puck-tracking. |
| `shot_speed_details_top_shot_speed_metric` | double | Player's single highest recorded shot speed for the season measured in kilometers per hour (metric), from NHL EDGE puck-tracking. |
| `shot_speed_details_top_shot_speed_percentile` | double | Percentile rank of the player's top shot speed relative to all qualifying skaters in the NHL EDGE shot-speed dataset. |
| `shot_speed_details_top_shot_speed_league_avg_imperial` | double | League-average highest shot speed among qualifying skaters for the season, measured in miles per hour (imperial). |
| `shot_speed_details_top_shot_speed_league_avg_metric` | double | League-average highest shot speed among qualifying skaters for the season, measured in kilometers per hour (metric). |
| `shot_speed_details_top_shot_speed_overlay_player_first_name_default` | character | Player's first name as stored in the NHL api-web system, included in the overlay for the top-shot-speed event. |
| `shot_speed_details_top_shot_speed_overlay_player_last_name_default` | character | Player's last name as stored in the NHL api-web system, included in the overlay for the top-shot-speed event. |
| `shot_speed_details_top_shot_speed_overlay_game_date` | character | Date (YYYY-MM-DD) of the game in which the player recorded their top shot speed for the season. |
| `shot_speed_details_top_shot_speed_overlay_away_team_abbrev` | character | Three-letter abbreviation for the away team in the game where the player recorded their top shot speed this season. |
| `shot_speed_details_top_shot_speed_overlay_away_team_score` | integer | Away team's final score in the game where the player recorded their season-high shot speed. |
| `shot_speed_details_top_shot_speed_overlay_home_team_abbrev` | character | Three-letter abbreviation for the home team in the game where the player achieved their top shot speed this season. |
| `shot_speed_details_top_shot_speed_overlay_home_team_score` | integer | Home team's final score in the game where the player recorded their season-high shot speed. |
| `shot_speed_details_top_shot_speed_overlay_game_outcome_last_period_type` | character | Type of period that ended the game where the player set their top shot speed (e.g., 'REG', 'OT', 'SO'). |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods defined for the game type in which the player recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_number` | integer | Period number in which the player released their top-speed shot during the referenced game. |
| `shot_speed_details_top_shot_speed_overlay_period_descriptor_period_type` | character | Period type label (e.g., 'REG', 'OT') for the period in which the player recorded their top shot speed. |
| `shot_speed_details_top_shot_speed_overlay_time_in_period` | character | Time elapsed within the period (MM:SS) when the player released their top-speed shot for the season. |
| `shot_speed_details_top_shot_speed_overlay_game_type` | integer | Numeric code for the game type of the game in which the player recorded their top shot speed (e.g., 2 = regular season). |
| `shot_speed_details_avg_shot_speed_imperial` | double | Player's average shot speed across all tracked shot attempts for the season, measured in miles per hour (imperial). |
| `shot_speed_details_avg_shot_speed_metric` | double | Player's average shot speed across all tracked shot attempts for the season, measured in kilometers per hour (metric). |
| `shot_speed_details_avg_shot_speed_percentile` | double | Percentile rank of the player's average shot speed relative to all qualifying skaters in the NHL EDGE shot-speed dataset. |
| `shot_speed_details_avg_shot_speed_league_avg_imperial` | double | League-average shot speed across all qualifying skaters' tracked attempts for the season, measured in miles per hour (imperial). |
| `shot_speed_details_avg_shot_speed_league_avg_metric` | double | League-average shot speed across all qualifying skaters' tracked attempts for the season, measured in kilometers per hour (metric). |
| `shot_speed_details_shot_attempts_over100_value` | integer | Number of the player's tracked shot attempts for the season with a recorded speed exceeding 100 mph. |
| `shot_speed_details_shot_attempts_over100_percentile` | double | Percentile rank of the player's count of shot attempts exceeding 100 mph relative to all qualifying skaters in the NHL EDGE dataset. |
| `shot_speed_details_shot_attempts_over100_league_avg` | double | League-average number of shot attempts with a recorded speed above 100 mph among qualifying skaters for the season. |
| `shot_speed_details_shot_attempts90_to100_value` | integer | Number of the player's tracked shot attempts for the season with a recorded speed between 90 and 100 mph. |
| `shot_speed_details_shot_attempts90_to100_percentile` | double | Percentile rank of the player's count of shot attempts in the 90–100 mph speed band relative to all qualifying skaters in the NHL EDGE dataset. |
| `shot_speed_details_shot_attempts90_to100_league_avg` | double | League-average number of shot attempts falling in the 90–100 mph speed band among qualifying skaters for the season. |
| `shot_speed_details_shot_attempts80_to90_value` | integer | Number of the player's tracked shot attempts for the season with a recorded speed between 80 and 90 mph. |
| `shot_speed_details_shot_attempts80_to90_percentile` | double | Percentile rank of the player's count of shot attempts in the 80–90 mph speed band relative to all qualifying skaters in the NHL EDGE dataset. |
| `shot_speed_details_shot_attempts80_to90_league_avg` | double | League-average number of shot attempts falling in the 80–90 mph speed band among qualifying skaters for the season. |
| `shot_speed_details_shot_attempts70_to80_value` | integer | Number of the player's tracked shot attempts for the season with a recorded speed between 70 and 80 mph. |
| `shot_speed_details_shot_attempts70_to80_percentile` | double | Percentile rank of the player's count of shot attempts in the 70–80 mph speed band relative to all qualifying skaters in the NHL EDGE dataset. |
| `shot_speed_details_shot_attempts70_to80_league_avg` | double | League-average number of shot attempts falling in the 70–80 mph speed band among qualifying skaters for the season. |

**Row type:** `NhlEdgeSkaterShotSpeedDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_skating_distance_detail` / `nhlEdgeSkaterSkatingDistanceDetail`

| col_name | type | description |
|---|---|---|
| `skating_distance_last10` | character | JSON-serialized rolling summary of total distance skated by the player across the last 10 games. |
| `skating_distance_details` | character | JSON-serialized per-game breakdown of total distance skated by the player during the tracking period. |

**Row type:** `NhlEdgeSkaterSkatingDistanceDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_skating_speed_detail` / `nhlEdgeSkaterSkatingSpeedDetail`

| col_name | type | description |
|---|---|---|
| `top_skating_speeds` | character | JSON-serialized list of the skater's top individual speed bursts, typically the ten highest speed readings recorded during the tracking period. |
| `skating_speed_details_max_skating_speed_imperial` | double | Skater's maximum recorded skating speed in miles per hour captured by EDGE tracking during the tracking period. |
| `skating_speed_details_max_skating_speed_metric` | double | Skater's maximum recorded skating speed in kilometers per hour captured by EDGE tracking during the tracking period. |
| `skating_speed_details_max_skating_speed_percentile` | double | Percentile rank among all NHL skaters for maximum skating speed recorded during the tracking period. |
| `skating_speed_details_max_skating_speed_league_avg_imperial` | double | League-average maximum skating speed in miles per hour, used as the baseline for this skater's max-speed percentile. |
| `skating_speed_details_max_skating_speed_league_avg_metric` | double | League-average maximum skating speed in kilometers per hour, used as the baseline for this skater's max-speed percentile. |
| `skating_speed_details_max_skating_speed_overlay_player_first_name_default` | character | First name of the skater for whom the maximum skating speed overlay data is displayed. |
| `skating_speed_details_max_skating_speed_overlay_player_last_name_default` | character | Last name of the skater for whom the maximum skating speed overlay data is displayed. |
| `skating_speed_details_max_skating_speed_overlay_game_date` | character | Date on which the game occurred where the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_away_team_abbrev` | character | Abbreviation of the away team in the game where the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_away_team_score` | integer | Score of the away team at the conclusion of the game in which the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_home_team_abbrev` | character | Abbreviation of the home team in the game where the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_home_team_score` | integer | Score of the home team at the conclusion of the game in which the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_game_outcome_last_period_type` | character | Type of the final period that determined the outcome of the game where the max speed was recorded (REG, OT, or SO). |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_max_regulation_periods` | integer | Number of regulation periods in the game format where the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_number` | integer | Period number within the game in which the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_period_descriptor_period_type` | character | Period type (REG, OT) identifying the phase of the game when the skater's maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_time_in_period` | character | Elapsed time within the period (mm:ss) at which the skater's career or season maximum skating speed was recorded. |
| `skating_speed_details_max_skating_speed_overlay_game_type` | integer | NHL game type code (e.g., 2 = regular season, 3 = playoffs) for the game where the skater's maximum speed was recorded. |
| `skating_speed_details_bursts_over22_value` | integer | Average number of skating bursts per game in which the skater reached or exceeded 22 mph during the tracking period. |
| `skating_speed_details_bursts_over22_percentile` | double | Percentile rank among all NHL skaters for frequency of skating speed bursts exceeding 22 mph per game. |
| `skating_speed_details_bursts_over22_league_avg` | double | League-average number of skating speed bursts exceeding 22 mph per game, used as the baseline for this skater's percentile. |
| `skating_speed_details_bursts20_to22_value` | integer | Average number of skating bursts per game in which the skater's speed fell in the 20-22 mph range. |
| `skating_speed_details_bursts20_to22_percentile` | double | Percentile rank among all NHL skaters for frequency of skating speed bursts in the 20-22 mph speed band. |
| `skating_speed_details_bursts20_to22_league_avg` | double | League-average number of skating speed bursts in the 20-22 mph band per game, used as the baseline for percentile calculation. |
| `skating_speed_details_bursts18_to20_value` | integer | Average number of skating bursts per game in which the skater's speed fell in the 18-20 mph range. |
| `skating_speed_details_bursts18_to20_percentile` | double | Percentile rank among all NHL skaters for frequency of skating speed bursts in the 18-20 mph speed band. |
| `skating_speed_details_bursts18_to20_league_avg` | double | League-average number of skating speed bursts in the 18-20 mph band per game, used as the baseline for percentile calculation. |

**Row type:** `NhlEdgeSkaterSkatingSpeedDetailRow` (exported from the package root).

### Returns — `nhl_edge_skater_zone_time` / `nhlEdgeSkaterZoneTime`

| col_name | type | description |
|---|---|---|
| `strength_code` | character | Strength state code (e.g., all, even, pp, pk). |
| `offensive_zone_pctg` | double | Percentage of time spent in the offensive zone. |
| `offensive_zone_percentile` | double | League percentile rank for offensive-zone time. |
| `offensive_zone_league_avg` | double | League average offensive-zone time percentage. |
| `neutral_zone_pctg` | double | Percentage of time spent in the neutral zone. |
| `neutral_zone_percentile` | double | League percentile rank for neutral-zone time. |
| `neutral_zone_league_avg` | double | League average neutral-zone time percentage. |
| `defensive_zone_pctg` | double | Percentage of time spent in the defensive zone. |
| `defensive_zone_percentile` | double | League percentile rank for defensive-zone time. |
| `defensive_zone_league_avg` | double | League average defensive-zone time percentage. |

**Row type:** `NhlEdgeSkaterZoneTimeRow` (exported from the package root).

### Returns — `nhl_edge_team_detail` / `nhlEdgeTeamDetail`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Comma-separated list of season identifiers for which NHL EDGE player-tracking statistics are available for this team. |
| `sog_summary` | character | Serialized summary string of total shots-on-goal across all periods for this team, flattened from the NHL api-web team detail payload. |
| `sog_details` | character | Serialized JSON-like string containing per-period or per-game shots-on-goal detail for this team, flattened from the NHL api-web team detail payload. |
| `team_id` | integer | Unique team identifier. |
| `team_common_name_default` | character | Team common name (default language). |
| `team_place_name_with_preposition_default` | character | Team place name with preposition (default). |
| `team_place_name_with_preposition_fr` | character | Team place name with preposition (French). |
| `team_abbrev` | character | Team abbreviation. |
| `team_team_logo_light` | character | URL to the team light logo. |
| `team_team_logo_dark` | character | URL to the team dark logo. |
| `team_slug` | character | Team URL slug. |
| `team_conference` | character | Name of the NHL conference (e.g., Eastern, Western) to which this team belongs, as returned by the NHL api-web team detail endpoint. |
| `team_division` | character | Name of the NHL division (e.g., Atlantic, Metro, Central, Pacific) to which this team belongs, as returned by the NHL api-web team detail endpoint. |
| `team_wins` | integer | Team wins. |
| `team_losses` | integer | Team losses. |
| `team_ot_losses` | integer | Total number of games this team has lost in overtime or a shootout (earning one standings point each) in the current season. |
| `team_games_played` | integer | Total number of regular-season or playoff games this team has played in the current season, from the NHL api-web team detail endpoint. |
| `team_points` | integer | Total points scored by the player's team in this game. |
| `shot_speed_shot_attempts_over90_value` | integer | Total count of shot attempts recorded at a speed exceeding 90 mph by this team's players during the season, from NHL EDGE tracking data. |
| `shot_speed_shot_attempts_over90_rank` | integer | Team's league rank by number of shot attempts exceeding 90 mph in shot speed, with rank 1 indicating the highest count, from NHL EDGE tracking data. |
| `shot_speed_top_shot_speed_imperial` | double | Fastest recorded shot speed by any player on this team during the season, expressed in miles per hour, from NHL EDGE tracking data. |
| `shot_speed_top_shot_speed_metric` | double | Fastest recorded shot speed by any player on this team during the season, expressed in kilometers per hour, from NHL EDGE tracking data. |
| `shot_speed_top_shot_speed_rank` | integer | Team's league rank by top shot speed for the season, where rank 1 indicates the team whose fastest shot was the quickest in the league. |
| `shot_speed_top_shot_speed_league_avg_imperial` | double | League-average of the top shot speed across all teams for the same period, expressed in miles per hour, from NHL EDGE tracking data. |
| `shot_speed_top_shot_speed_league_avg_metric` | double | League-average of the top shot speed across all teams for the same period, expressed in kilometers per hour, from NHL EDGE tracking data. |
| `shot_speed_top_shot_speed_overlay_player_first_name_default` | character | Default-language first name of the player who recorded this team's top shot speed, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_player_last_name_default` | character | Default-language last name of the player who recorded this team's top shot speed, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_game_date` | character | Calendar date of the game in which this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_away_team_abbrev` | character | Three-letter abbreviation of the away team in the game where this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_away_team_score` | integer | Away team's final score in the game where this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_home_team_abbrev` | character | Three-letter abbreviation of the home team in the game where this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_home_team_score` | integer | Home team's final score in the game where this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_game_outcome_last_period_type` | character | Type of the final period played (e.g., REG, OT, SO) in the game where this team's top shot speed was recorded. |
| `shot_speed_top_shot_speed_overlay_game_outcome_ot_periods` | integer | Number of overtime periods played in the game where this team's top shot speed was recorded, or zero if decided in regulation. |
| `shot_speed_top_shot_speed_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game format where this team's top shot speed was recorded (typically 3 for NHL). |
| `shot_speed_top_shot_speed_overlay_period_descriptor_number` | integer | Period number within the game during which this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_period_descriptor_period_type` | character | Type label for the period (e.g., REG, OT) during which this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_time_in_period` | character | Elapsed time within the period (MM:SS format) at which this team's top shot speed was recorded, from the NHL EDGE overlay context. |
| `shot_speed_top_shot_speed_overlay_game_type` | integer | Numeric game-type code (e.g., 2 = regular season, 3 = playoffs) for the game in which this team's top shot speed was recorded. |
| `skating_speed_bursts_over22_value` | integer | Total count of skating speed bursts exceeding 22 mph recorded by this team's skaters during the season, from NHL EDGE tracking data. |
| `skating_speed_bursts_over22_rank` | integer | Team's league rank by total count of skating speed bursts exceeding 22 mph, where rank 1 indicates the most elite-speed bursts, from NHL EDGE tracking data. |
| `skating_speed_bursts_over20_value` | integer | Total count of skating speed bursts exceeding 20 mph recorded by this team's skaters during the season, from NHL EDGE tracking data. |
| `skating_speed_bursts_over20_rank` | integer | Team's league rank by total count of skating speed bursts exceeding 20 mph, where rank 1 indicates the most such bursts, from NHL EDGE tracking data. |
| `skating_speed_bursts_over20_league_avg_value` | integer | League-average number of skating speed bursts exceeding 20 mph recorded per team over the same season window, from NHL EDGE tracking data. |
| `skating_speed_speed_max_imperial` | double | Fastest skating speed reached by any player on this team during the season, expressed in miles per hour, from NHL EDGE tracking data. |
| `skating_speed_speed_max_metric` | double | Fastest skating speed reached by any player on this team during the season, expressed in kilometers per hour, from NHL EDGE tracking data. |
| `skating_speed_speed_max_rank` | integer | Team's league rank by maximum skating speed for the season, where rank 1 indicates the team whose fastest skater reached the highest speed in the league. |
| `skating_speed_speed_max_league_avg_imperial` | double | League-average of the maximum skating speed across all teams for the same period, expressed in miles per hour, from NHL EDGE tracking data. |
| `skating_speed_speed_max_league_avg_metric` | double | League-average of the maximum skating speed across all teams for the same period, expressed in kilometers per hour, from NHL EDGE tracking data. |
| `skating_speed_speed_max_overlay_player_first_name_default` | character | Default-language first name of the player who recorded this team's top skating speed, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_player_last_name_default` | character | Default-language last name of the player who recorded this team's top skating speed, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_game_date` | character | Calendar date of the game in which this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_away_team_abbrev` | character | Three-letter abbreviation of the away team in the game where this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_away_team_score` | integer | Away team's final score in the game where this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_home_team_abbrev` | character | Three-letter abbreviation of the home team in the game where this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_home_team_score` | integer | Home team's final score in the game where this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_game_outcome_last_period_type` | character | Type of the final period played (e.g., REG, OT, SO) in the game where this team's top skating speed was recorded. |
| `skating_speed_speed_max_overlay_period_descriptor_max_regulation_periods` | integer | Maximum number of regulation periods in the game format where this team's top skating speed was recorded (typically 3 for NHL). |
| `skating_speed_speed_max_overlay_period_descriptor_number` | integer | Period number within the game during which this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_period_descriptor_period_type` | character | Type label for the period (e.g., REG, OT) during which this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_time_in_period` | character | Elapsed time within the period (MM:SS format) at which this team's top skating speed was recorded, from the NHL EDGE overlay context. |
| `skating_speed_speed_max_overlay_game_type` | integer | Numeric game-type code (e.g., 2 = regular season, 3 = playoffs) for the game in which this team's top skating speed was recorded. |
| `distance_skated_total_imperial` | double | Total cumulative skating distance logged by all skaters on this team across the season, expressed in miles (imperial), from NHL EDGE tracking data. |
| `distance_skated_total_metric` | double | Total cumulative skating distance logged by all skaters on this team across the season, expressed in kilometers (metric), from NHL EDGE tracking data. |
| `distance_skated_total_rank` | integer | Team's league rank by total cumulative skating distance for the season, where rank 1 indicates the team with the most distance skated. |
| `distance_skated_total_league_avg_imperial` | double | League-average cumulative skating distance for all teams over the same period as this team's totals, expressed in miles (imperial), from NHL EDGE tracking data. |
| `distance_skated_total_league_avg_metric` | double | League-average cumulative skating distance for all teams over the same period as this team's totals, expressed in kilometers (metric), from NHL EDGE tracking data. |
| `zone_time_details_offensive_zone_pctg` | double | Percentage of all-situation ice time this team spends in the offensive zone, as measured by NHL EDGE player-tracking data. |
| `zone_time_details_offensive_zone_rank` | integer | Team's league rank by overall offensive-zone time percentage (all situations), where rank 1 indicates the team with the most offensive-zone presence. |
| `zone_time_details_offensive_zone_league_avg` | double | League-average percentage of all-situation ice time that teams spend in the offensive zone, from NHL EDGE zone-time tracking data. |
| `zone_time_details_offensive_zone_ev_pctg` | double | Percentage of even-strength ice time this team spends in the offensive zone, as measured by NHL EDGE player-tracking data. |
| `zone_time_details_offensive_zone_ev_rank` | integer | Team's league rank by even-strength offensive-zone time percentage, where rank 1 indicates the team spending the most time in the offensive zone at even strength. |
| `zone_time_details_offensive_zone_ev_league_avg` | double | League-average percentage of even-strength ice time that teams spend in the offensive zone, from NHL EDGE zone-time tracking data. |
| `zone_time_details_neutral_zone_pctg` | double | Percentage of five-on-five ice time this team spends in the neutral zone, as measured by NHL EDGE player-tracking data. |
| `zone_time_details_neutral_zone_rank` | integer | Team's league rank by neutral-zone time percentage, where rank 1 indicates the team that spends the most time in the neutral zone during five-on-five play. |
| `zone_time_details_neutral_zone_league_avg` | double | League-average percentage of time that teams spend in the neutral zone during five-on-five play, from NHL EDGE zone-time tracking data. |
| `zone_time_details_defensive_zone_pctg` | double | Percentage of five-on-five ice time this team spends in its own defensive zone, as measured by NHL EDGE player-tracking data. |
| `zone_time_details_defensive_zone_rank` | integer | Team's league rank by defensive-zone time percentage, where rank 1 indicates the team that spends the most time in its own zone during five-on-five play. |
| `zone_time_details_defensive_zone_league_avg` | double | League-average percentage of time that teams spend in the defensive zone during five-on-five play, from NHL EDGE zone-time tracking data. |

**Row type:** `NhlEdgeTeamDetailRow` (exported from the package root).

### Returns — `nhl_edge_team_landing` / `nhlEdgeTeamLanding`

| col_name | type | description |
|---|---|---|
| `seasons_with_edge_stats` | character | Serialized list of NHL seasons for which EDGE player-tracking data is available for this team. |
| `leaders_shot_attempts_over90_team_id` | integer | NHL identifier for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_common_name_default` | character | Common team name for the leader in the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_wins` | integer | Regular-season wins for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_losses` | integer | Regular-season losses for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_team_ot_losses` | integer | Overtime losses for the team leading the EDGE shot-attempts-over-90-mph category. |
| `leaders_shot_attempts_over90_attempts` | integer | Number of shot attempts above the 90-mph threshold recorded by the leading team in the EDGE shot-speed leaderboard period. |
| `leaders_bursts_over22_team_id` | integer | NHL identifier for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_common_name_default` | character | Common team name (e.g., 'Maple Leafs') for the leader in the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_place_name_with_preposition_default` | character | Default-language place name with preposition (e.g., 'in Toronto') for the team leading the speed-bursts-over-22-mph EDGE category. |
| `leaders_bursts_over22_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the speed-bursts-over-22-mph EDGE category. |
| `leaders_bursts_over22_team_abbrev` | character | Three-letter abbreviation for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_team_logo_light` | character | URL of the light-background logo for the team leading the speed-bursts-over-22-mph EDGE category. |
| `leaders_bursts_over22_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the speed-bursts-over-22-mph EDGE category. |
| `leaders_bursts_over22_team_slug` | character | URL-friendly slug identifier for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_wins` | integer | Regular-season wins for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_losses` | integer | Regular-season losses for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_team_ot_losses` | integer | Overtime losses for the team leading the speed-bursts-over-22-mph EDGE tracking category. |
| `leaders_bursts_over22_bursts` | integer | Number of speed bursts above 22 mph recorded by skaters on the team in the EDGE tracking leaderboard period. |
| `leaders_distance_per60_team_id` | integer | NHL identifier for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_common_name_default` | character | Common team name for the leader in the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_wins` | integer | Regular-season wins for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_losses` | integer | Regular-season losses for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_team_ot_losses` | integer | Overtime losses for the team leading the EDGE distance-skated-per-60 category. |
| `leaders_distance_per60_distance_skated_imperial` | double | Average distance skated per 60 minutes of ice time by the leading team's skaters, measured in miles. |
| `leaders_distance_per60_distance_skated_metric` | double | Average distance skated per 60 minutes of ice time by the leading team's skaters, measured in kilometers. |
| `leaders_high_danger_sog_team_id` | integer | NHL identifier for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_common_name_default` | character | Common team name for the leader in the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_wins` | integer | Regular-season wins for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_losses` | integer | Regular-season losses for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_team_ot_losses` | integer | Overtime losses for the team leading the EDGE high-danger shots-on-goal category. |
| `leaders_high_danger_sog_sog` | integer | Number of high-danger shots on goal recorded by the leading team in the EDGE tracking leaderboard period. |
| `leaders_high_danger_sog_shot_location_details` | character | Serialized details describing the high-danger shot locations used to define this EDGE tracking leaderboard category. |
| `leaders_offensive_zone_time_team_id` | integer | NHL identifier for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_common_name_default` | character | Common team name for the leader in the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_wins` | integer | Regular-season wins for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_losses` | integer | Regular-season losses for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_team_ot_losses` | integer | Overtime losses for the team leading the EDGE offensive-zone time category. |
| `leaders_offensive_zone_time_zone_time` | double | Total time spent in the offensive zone by the leading team in the EDGE tracking leaderboard period. |
| `leaders_neutral_zone_time_team_id` | integer | NHL identifier for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_common_name_default` | character | Common team name for the leader in the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_wins` | integer | Regular-season wins for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_losses` | integer | Regular-season losses for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_team_ot_losses` | integer | Overtime losses for the team leading the EDGE neutral-zone time category. |
| `leaders_neutral_zone_time_zone_time` | double | Total time spent in the neutral zone by the leading team in the EDGE tracking leaderboard period. |
| `leaders_defensive_zone_time_team_id` | integer | NHL identifier for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_common_name_default` | character | Common team name for the leader in the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_place_name_with_preposition_default` | character | Default-language place name with preposition for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_place_name_with_preposition_fr` | character | French-language place name with preposition for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_abbrev` | character | Three-letter abbreviation for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_team_logo_light` | character | URL of the light-background logo for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_team_logo_dark` | character | URL of the dark-background logo for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_slug` | character | URL-friendly slug identifier for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_wins` | integer | Regular-season wins for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_losses` | integer | Regular-season losses for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_team_ot_losses` | integer | Overtime losses for the team leading the EDGE defensive-zone time category. |
| `leaders_defensive_zone_time_zone_time` | double | Total time spent in the defensive zone by the leading team in the EDGE tracking leaderboard period. |

**Row type:** `NhlEdgeTeamLandingRow` (exported from the package root).

### Returns — `nhl_edge_team_shot_location_detail` / `nhlEdgeTeamShotLocationDetail`

| col_name | type | description |
|---|---|---|
| `area` | character | Net/ice zone the shots were taken from. |
| `sog` | integer | Shots on goal from the area. |
| `sog_rank` | integer | League rank for shots on goal from the area. |
| `goals` | integer | Goals scored. |
| `goals_rank` | integer | League rank for goals scored from the area. |
| `shooting_pctg` | double | Shooting percentage from the area. |
| `shooting_pctg_rank` | integer | League rank for shooting percentage from the area. |

**Row type:** `NhlEdgeTeamShotLocationDetailRow` (exported from the package root).

### Returns — `nhl_edge_team_shot_speed_detail` / `nhlEdgeTeamShotSpeedDetail`

| col_name | type | description |
|---|---|---|
| `hardest_shots` | character | Serialized list of the hardest individual shot records associated with the team's players. |
| `shot_speed_details` | character | Serialized shot-speed breakdown object containing aggregate and top-speed metrics for the team. |

**Row type:** `NhlEdgeTeamShotSpeedDetailRow` (exported from the package root).

### Returns — `nhl_edge_team_zone_time_details` / `nhlEdgeTeamZoneTimeDetails`

| col_name | type | description |
|---|---|---|
| `strength_code` | character | Strength state code (e.g., all, even, pp, pk). |
| `offensive_zone_pctg` | double | Percentage of time spent in the offensive zone. |
| `offensive_zone_rank` | integer | League rank for offensive zone time. |
| `offensive_zone_league_avg` | double | League average offensive-zone time percentage. |
| `neutral_zone_pctg` | double | Percentage of time spent in the neutral zone. |
| `neutral_zone_rank` | integer | League rank for neutral zone time. |
| `neutral_zone_league_avg` | double | League average neutral-zone time percentage. |
| `defensive_zone_pctg` | double | Percentage of time spent in the defensive zone. |
| `defensive_zone_rank` | integer | League rank for defensive zone time. |
| `defensive_zone_league_avg` | double | League average defensive-zone time percentage. |

**Row type:** `NhlEdgeTeamZoneTimeDetailsRow` (exported from the package root).

## Native API — NHL Stats REST

Flat (non-ESPN) wrappers for the NHL Stats REST API. Host: `https://api.nhle.com/stats/rest`. Each method is exposed under BOTH its snake_case name `nhl_stats_rest_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.nhl`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `nhl_stats_rest_component_season` / `nhlStatsRestComponentSeason` | `https://api.nhle.com/stats/rest/{lang}/componentSeason` | `lang` | — | *(raw)* | — |
| `nhl_stats_rest_config` / `nhlStatsRestConfig` | `https://api.nhle.com/stats/rest/{lang}/config` | `lang` | — | *(raw)* | — |
| `nhl_stats_rest_content_module` / `nhlStatsRestContentModule` | `https://api.nhle.com/stats/rest/{lang}/content/module/{template_key}` | `template_key`\*, `lang` | — | *(raw)* | — |
| `nhl_stats_rest_country` / `nhlStatsRestCountry` | `https://api.nhle.com/stats/rest/{lang}/country` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_draft` / `nhlStatsRestDraft` | `https://api.nhle.com/stats/rest/{lang}/draft` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_franchise` / `nhlStatsRestFranchise` | `https://api.nhle.com/stats/rest/{lang}/franchise` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_game` / `nhlStatsRestGame` | `https://api.nhle.com/stats/rest/{lang}/game` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_glossary` / `nhlStatsRestGlossary` | `https://api.nhle.com/stats/rest/{lang}/glossary` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_goalie_report` / `nhlStatsRestGoalieReport` | `https://api.nhle.com/stats/rest/{lang}/goalie/{report}` | `report`\*, `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_leaders_goalies` / `nhlStatsRestLeadersGoalies` | `https://api.nhle.com/stats/rest/{lang}/leaders/goalies/{attribute}` | `attribute`\*, `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_leaders_skaters` / `nhlStatsRestLeadersSkaters` | `https://api.nhle.com/stats/rest/{lang}/leaders/skaters/{attribute}` | `attribute`\*, `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_milestones_goalies` / `nhlStatsRestMilestonesGoalies` | `https://api.nhle.com/stats/rest/{lang}/milestones/goalies` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_milestones_skaters` / `nhlStatsRestMilestonesSkaters` | `https://api.nhle.com/stats/rest/{lang}/milestones/skaters` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_ping` / `nhlStatsRestPing` | `https://api.nhle.com/stats/rest/ping` | — | — | *(raw)* | — |
| `nhl_stats_rest_players` / `nhlStatsRestPlayers` | `https://api.nhle.com/stats/rest/{lang}/players` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_season` / `nhlStatsRestSeason` | `https://api.nhle.com/stats/rest/{lang}/season` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_shiftcharts` / `nhlStatsRestShiftcharts` | `https://api.nhle.com/stats/rest/{lang}/shiftcharts` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_skater_report` / `nhlStatsRestSkaterReport` | `https://api.nhle.com/stats/rest/{lang}/skater/{report}` | `report`\*, `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_team` / `nhlStatsRestTeam` | `https://api.nhle.com/stats/rest/{lang}/team` | `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_team_by_id` / `nhlStatsRestTeamById` | `https://api.nhle.com/stats/rest/{lang}/team/id/{team_id}` | `team_id`\*, `lang` | — | `parse_nhl_stats_rest` | — |
| `nhl_stats_rest_team_report` / `nhlStatsRestTeamReport` | `https://api.nhle.com/stats/rest/{lang}/team/{report}` | `report`\*, `lang` | — | `parse_nhl_stats_rest` | — |

### Returns — `nhl_stats_rest_country` / `nhlStatsRestCountry`

| col_name | type | description |
|---|---|---|
| `id` | character | Unique player identifier. |
| `country3_code` | character | Three-letter ISO country code used by the NHL api-web country reference endpoint. |
| `country_code` | character | Player country code. |
| `country_name` | character | Full English display name of the country as provided by the NHL api-web country reference. |
| `has_player_stats` | integer | Flag (1/0) indicating whether the NHL api-web tracks player statistics for this country. |
| `image_url` | character | Player headshot URL. |
| `ioc_code` | character | International Olympic Committee three-letter country code assigned to this nation. |
| `is_active` | integer | Whether the team is active. |
| `nationality_name` | character | Nationality label string used on player profiles in the NHL api-web (e.g., 'Canadian', 'American'). |
| `olympic_url` | character | URL to the country's Olympic profile page linked from the NHL api-web country record. |
| `thumbnail_url` | character | URL to a small thumbnail image representing the country's flag or emblem in the NHL api-web. |

**Row type:** `NhlStatsRestCountryRow` (exported from the package root).

### Returns — `nhl_stats_rest_draft` / `nhlStatsRestDraft`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `draft_year` | integer | Draft year the lottery applies to. |
| `rounds` | integer | Number of rounds in the draft. |

**Row type:** `NhlStatsRestDraftRow` (exported from the package root).

### Returns — `nhl_stats_rest_franchise` / `nhlStatsRestFranchise`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `full_name` | character | Player full name. |
| `team_common_name` | character | Team common (nickname) name. |
| `team_place_name` | character | Team place (city/location) name. |

**Row type:** `NhlStatsRestFranchiseRow` (exported from the package root).

### Returns — `nhl_stats_rest_game` / `nhlStatsRestGame`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `eastern_start_time` | character | Game start time in Eastern time. |
| `game_date` | character | Game date. |
| `game_number` | integer | Game number within the schedule. |
| `game_schedule_state_id` | integer | Schedule state identifier. |
| `game_state_id` | integer | Game state identifier. |
| `game_type` | integer | Game type the row belongs to. |
| `home_score` | integer | Home team final score. |
| `home_team_id` | integer | Home team identifier. |
| `period` | integer | Period number. |
| `season` | integer | Season year (echoed from arg). |
| `visiting_score` | integer | Visiting team score. |
| `visiting_team_id` | integer | Visiting team identifier. |

**Row type:** `NhlStatsRestGameRow` (exported from the package root).

### Returns — `nhl_stats_rest_glossary` / `nhlStatsRestGlossary`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `abbreviation` | character | Team abbreviation. |
| `definition` | character | Definition of the stat or term. |
| `first_season_for_stat` | double | First season the stat was tracked (YYYYYYYY). |
| `full_name` | character | Player full name. |
| `language_code` | character | Language code of the entry. |
| `last_updated` | character | Timestamp the entry was last updated. |

**Row type:** `NhlStatsRestGlossaryRow` (exported from the package root).

### Returns — `nhl_stats_rest_goalie_report` / `nhlStatsRestGoalieReport`

| col_name | type | description |
|---|---|---|
| `assists` | integer | Assists. |
| `games_played` | integer | Games played. |
| `games_started` | integer | Games started (goalies). |
| `goalie_full_name` | character | Goalie full name. |
| `goals` | integer | Goals scored. |
| `goals_against` | integer | Goals against. |
| `goals_against_average` | double | Goals against average. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `ot_losses` | integer | Overtime losses. |
| `penalty_minutes` | integer | Penalty minutes. |
| `player_id` | integer | Unique player identifier. |
| `points` | integer | Total points (goals + assists). |
| `save_pct` | double | Save percentage. |
| `saves` | integer | Saves made. |
| `season_id` | integer | Season identifier. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `shots_against` | integer | Shots faced. |
| `shutouts` | integer | Shutouts recorded. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `ties` | character | Total ties. |
| `time_on_ice` | integer | Time on ice in seconds. |
| `wins` | integer | Wins. |

**Row type:** `NhlStatsRestGoalieReportRow` (exported from the package root).

### Returns — `nhl_stats_rest_leaders_goalies` / `nhlStatsRestLeadersGoalies`

| col_name | type | description |
|---|---|---|
| `save_pctg` | double | Save percentage. |
| `player_id` | integer | Unique player identifier. |
| `player_current_team_id` | double | Player's current team identifier. |
| `player_first_name` | character | Player first name. |
| `player_full_name` | character | Player full name. |
| `player_last_name` | character | Player last name. |
| `player_position_code` | character | Player position code. |
| `player_sweater_number` | double | Player jersey number. |
| `team_id` | integer | Unique team identifier. |
| `team_franchise_id` | integer | Team franchise identifier. |
| `team_full_name` | character | Full team name. |
| `team_league_id` | integer | League identifier of the team. |
| `team_logos` | character | Team logo metadata. |
| `team_raw_tricode` | character | Team raw three-letter code. |
| `team_tri_code` | character | Team tri-code abbreviation. |

**Row type:** `NhlStatsRestLeadersGoaliesRow` (exported from the package root).

### Returns — `nhl_stats_rest_leaders_skaters` / `nhlStatsRestLeadersSkaters`

| col_name | type | description |
|---|---|---|
| `goals` | integer | Goals scored. |
| `player_id` | integer | Unique player identifier. |
| `player_current_team_id` | character | Player's current team identifier. |
| `player_first_name` | character | Player first name. |
| `player_full_name` | character | Player full name. |
| `player_last_name` | character | Player last name. |
| `player_position_code` | character | Player position code. |
| `player_sweater_number` | integer | Player jersey number. |
| `team_id` | integer | Unique team identifier. |
| `team_franchise_id` | integer | Team franchise identifier. |
| `team_full_name` | character | Full team name. |
| `team_league_id` | integer | League identifier of the team. |
| `team_logos` | character | Team logo metadata. |
| `team_raw_tricode` | character | Team raw three-letter code. |
| `team_tri_code` | character | Team tri-code abbreviation. |

**Row type:** `NhlStatsRestLeadersSkatersRow` (exported from the package root).

### Returns — `nhl_stats_rest_milestones_goalies` / `nhlStatsRestMilestonesGoalies`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `current_team_id` | integer | Player's current team identifier. |
| `first_name` | character | Player first name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `last_name` | character | Player last name. |
| `milestone` | character | Milestone category. |
| `milestone_amount` | integer | Amount remaining to reach the milestone. |
| `player_full_name` | character | Player full name. |
| `player_id` | integer | Unique player identifier. |
| `so` | integer | Shutouts. |
| `team_abbrev` | character | Team abbreviation. |
| `team_common_name` | character | Team common (nickname) name. |
| `team_full_name` | character | Full team name. |
| `team_place_name` | character | Team place (city/location) name. |
| `toi_minutes` | integer | Time on ice in minutes. |
| `wins` | integer | Wins. |

**Row type:** `NhlStatsRestMilestonesGoaliesRow` (exported from the package root).

### Returns — `nhl_stats_rest_milestones_skaters` / `nhlStatsRestMilestonesSkaters`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `assists` | integer | Assists. |
| `current_team_id` | integer | Player's current team identifier. |
| `first_name` | character | Player first name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `last_name` | character | Player last name. |
| `milestone` | character | Milestone category. |
| `milestone_amount` | integer | Amount remaining to reach the milestone. |
| `player_full_name` | character | Player full name. |
| `player_id` | integer | Unique player identifier. |
| `points` | integer | Total points (goals + assists). |
| `team_abbrev` | character | Team abbreviation. |
| `team_common_name` | character | Team common (nickname) name. |
| `team_full_name` | character | Full team name. |
| `team_place_name` | character | Team place (city/location) name. |

**Row type:** `NhlStatsRestMilestonesSkatersRow` (exported from the package root).

### Returns — `nhl_stats_rest_season` / `nhlStatsRestSeason`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_game_in_use` | integer | Whether an All-Star Game was held this season. |
| `conferences_in_use` | integer | Whether conferences were in use that season. |
| `divisions_in_use` | integer | Whether divisions were in use that season. |
| `end_date` | character | Season end date. |
| `entry_draft_in_use` | integer | Whether an entry draft was in use this season. |
| `formatted_season_id` | character | Human-readable season string (e.g. "2023-24"). |
| `minimum_playoff_minutes_for_goalie_stats_leaders` | integer | Minimum playoff minutes to qualify for goalie stats leaders. |
| `minimum_regular_games_for_goalie_stats_leaders` | integer | Minimum regular-season games to qualify for goalie stats leaders. |
| `nhl_stanley_cup_owner` | integer | Whether the NHL owned the Stanley Cup this season. |
| `number_of_games` | integer | Number of games per team this season. |
| `olympics_participation` | integer | Whether NHL players participated in the Olympics this season. |
| `point_for_ot_loss_in_use` | integer | Whether the overtime-loss point was in use this season. |
| `preseason_startdate` | character | Preseason start date. |
| `regular_season_end_date` | character | Regular-season end date. |
| `row_in_use` | integer | Whether the regulation/overtime/shootout format was in use. |
| `season_ordinal` | integer | Ordinal sequence number of the season. |
| `start_date` | character | Season start date. |
| `supplemental_draft_in_use` | integer | Whether a supplemental draft was in use this season. |
| `ties_in_use` | integer | Whether ties were in use that season. |
| `total_playoff_games` | integer | Total number of playoff games this season. |
| `total_regular_season_games` | integer | Total number of regular-season games this season. |
| `wildcard_in_use` | integer | Whether the wild-card playoff format was in use this season. |

**Row type:** `NhlStatsRestSeasonRow` (exported from the package root).

### Returns — `nhl_stats_rest_shiftcharts` / `nhlStatsRestShiftcharts`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `detail_code` | integer | Numeric code identifying the specific detail type or sub-category within the shift or event record. |
| `duration` | character | Penalty duration in minutes. |
| `end_time` | character | Shift end time (MM:SS countdown clock). |
| `event_description` | character | Human-readable event description. |
| `event_details` | character | Serialized details describing the on-ice event associated with the shift, such as play type and participants. |
| `event_number` | integer | Event number identifier. |
| `first_name` | character | Player first name. |
| `game_id` | integer | Unique game identifier. |
| `hex_value` | character | Hexadecimal color code associated with the event or team, used for display rendering. |
| `last_name` | character | Player last name. |
| `period` | integer | Period number. |
| `player_id` | integer | Unique player identifier. |
| `shift_number` | integer | Sequential number identifying the shift within the game, ordered chronologically by start time. |
| `start_time` | character | Shift start time (MM:SS countdown clock). |
| `team_abbrev` | character | Team abbreviation. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `type_code` | integer | Numeric code identifying the high-level event type (e.g., faceoff, goal, penalty) for this shift record. |

**Row type:** `NhlStatsRestShiftchartsRow` (exported from the package root).

### Returns — `nhl_stats_rest_skater_report` / `nhlStatsRestSkaterReport`

| col_name | type | description |
|---|---|---|
| `assists` | integer | Assists. |
| `ev_goals` | integer | Even-strength goals. |
| `ev_points` | integer | Even-strength points. |
| `faceoff_win_pct` | double | Faceoff win percentage. |
| `game_winning_goals` | integer | Game-winning goals. |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `last_name` | character | Player last name. |
| `ot_goals` | integer | Overtime goals. |
| `penalty_minutes` | integer | Penalty minutes. |
| `player_id` | integer | Unique player identifier. |
| `plus_minus` | integer | Plus/minus rating. |
| `points` | integer | Total points (goals + assists). |
| `points_per_game` | double | Points per game. |
| `position_code` | character | Player position code. |
| `pp_goals` | integer | Power-play goals. |
| `pp_points` | integer | Power-play points. |
| `season_id` | integer | Season identifier. |
| `sh_goals` | integer | Short-handed goals. |
| `sh_points` | integer | Short-handed points. |
| `shooting_pct` | double | Shooting percentage. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `shots` | integer | Shots on goal. |
| `skater_full_name` | character | Player full name. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `time_on_ice_per_game` | double | Average time on ice per game. |

**Row type:** `NhlStatsRestSkaterReportRow` (exported from the package root).

### Returns — `nhl_stats_rest_team` / `nhlStatsRestTeam`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `franchise_id` | integer | Unique franchise identifier. |
| `full_name` | character | Player full name. |
| `league_id` | integer | League identifier of the team. |
| `raw_tricode` | character | Team raw three-letter code. |
| `tri_code` | character | Team three-letter code. |

**Row type:** `NhlStatsRestTeamRow` (exported from the package root).

### Returns — `nhl_stats_rest_team_by_id` / `nhlStatsRestTeamById`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `franchise_id` | integer | Unique franchise identifier. |
| `full_name` | character | Player full name. |
| `league_id` | integer | League identifier of the team. |
| `raw_tricode` | character | Team raw three-letter code. |
| `tri_code` | character | Team three-letter code. |

**Row type:** `NhlStatsRestTeamByIdRow` (exported from the package root).

### Returns — `nhl_stats_rest_team_report` / `nhlStatsRestTeamReport`

| col_name | type | description |
|---|---|---|
| `faceoff_win_pct` | double | Faceoff win percentage. |
| `games_played` | integer | Games played. |
| `goals_against` | integer | Goals against. |
| `goals_against_per_game` | double | Goals against per game. |
| `goals_for` | integer | Goals for. |
| `goals_for_per_game` | double | Goals for per game. |
| `losses` | integer | Losses. |
| `ot_losses` | integer | Overtime losses. |
| `penalty_kill_net_pct` | double | Net penalty kill percentage. |
| `penalty_kill_pct` | double | Penalty kill percentage. |
| `point_pct` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `power_play_net_pct` | double | Net power play percentage. |
| `power_play_pct` | double | Power play percentage. |
| `regulation_and_ot_wins` | integer | Wins in regulation and overtime. |
| `season_id` | integer | Season identifier. |
| `shots_against_per_game` | double | Shots against per game. |
| `shots_for_per_game` | double | Shots for per game. |
| `team_full_name` | character | Full team name. |
| `team_id` | integer | Unique team identifier. |
| `team_shutouts` | integer | Team shutouts. |
| `ties` | character | Total ties. |
| `wins` | integer | Wins. |
| `wins_in_regulation` | integer | Wins in regulation. |
| `wins_in_shootout` | integer | Wins in shootout. |

**Row type:** `NhlStatsRestTeamReportRow` (exported from the package root).

## Native API — NHL Records

Flat (non-ESPN) wrappers for the NHL Records site API. Host: `https://records.nhl.com/site/api`. Each method is exposed under BOTH its snake_case name `nhl_records_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.nhl`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `nhl_records_all_time_record_vs_franchise` / `nhlRecordsAllTimeRecordVsFranchise` | `https://records.nhl.com/site/api/all-time-record-vs-franchise` | — | — | `parse_nhl_records` | — |
| `nhl_records_allstar_coach_career` / `nhlRecordsAllstarCoachCareer` | `https://records.nhl.com/site/api/all-star-coach-career-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_allstar_goalie_career` / `nhlRecordsAllstarGoalieCareer` | `https://records.nhl.com/site/api/all-star-goaltender-career-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_allstar_goalie_game` / `nhlRecordsAllstarGoalieGame` | `https://records.nhl.com/site/api/all-star-goaltender-game-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_allstar_skater_career` / `nhlRecordsAllstarSkaterCareer` | `https://records.nhl.com/site/api/all-star-skater-career-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_allstar_skater_game` / `nhlRecordsAllstarSkaterGame` | `https://records.nhl.com/site/api/all-star-skater-game-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_attendance` / `nhlRecordsAttendance` | `https://records.nhl.com/site/api/attendance` | — | — | `parse_nhl_records` | — |
| `nhl_records_awards` / `nhlRecordsAwards` | `https://records.nhl.com/site/api/award-details` | — | — | `parse_nhl_records` | — |
| `nhl_records_awards_by_franchise` / `nhlRecordsAwardsByFranchise` | `https://records.nhl.com/site/api/award-details/{franchise_id}` | `franchise_id`\* | — | `parse_nhl_records` | — |
| `nhl_records_awards_trophy_season` / `nhlRecordsAwardsTrophySeason` | `https://records.nhl.com/site/api/award-details/trophy/{trophy_id}/season/{season_id}` | `trophy_id`\*, `season_id`\* | — | `parse_nhl_records` | — |
| `nhl_records_away_team_record` / `nhlRecordsAwayTeamRecord` | `https://records.nhl.com/site/api/away-team-record` | — | — | `parse_nhl_records` | — |
| `nhl_records_coach` / `nhlRecordsCoach` | `https://records.nhl.com/site/api/coach/{coach_id}` | `coach_id`\* | — | `parse_nhl_records` | — |
| `nhl_records_coach_career` / `nhlRecordsCoachCareer` | `https://records.nhl.com/site/api/coach-career-records/{coach_id}` | `coach_id` | — | `parse_nhl_records` | — |
| `nhl_records_coach_career_with_playoffs` / `nhlRecordsCoachCareerWithPlayoffs` | `https://records.nhl.com/site/api/coach-career-records-regular-plus-playoffs` | — | — | `parse_nhl_records` | — |
| `nhl_records_coach_franchise` / `nhlRecordsCoachFranchise` | `https://records.nhl.com/site/api/coach-franchise-records/{coach_id}` | `coach_id` | — | `parse_nhl_records` | — |
| `nhl_records_coach_stanley_cup` / `nhlRecordsCoachStanleyCup` | `https://records.nhl.com/site/api/coach-stanley-cup-streak` | — | — | `parse_nhl_records` | — |
| `nhl_records_coaches` / `nhlRecordsCoaches` | `https://records.nhl.com/site/api/coach` | — | — | `parse_nhl_records` | — |
| `nhl_records_consecutive_100pt_seasons` / `nhlRecordsConsecutive100ptSeasons` | `https://records.nhl.com/site/api/consecutive-100-point-seasons` | — | — | `parse_nhl_records` | — |
| `nhl_records_draft` / `nhlRecordsDraft` | `https://records.nhl.com/site/api/draft/{draft_id}` | `draft_id` | — | `parse_nhl_records` | — |
| `nhl_records_draft_by_team` / `nhlRecordsDraftByTeam` | `https://records.nhl.com/site/api/draft/byTeam/{team_id}` | `team_id`\* | — | `parse_nhl_records` | — |
| `nhl_records_draft_lottery_odds` / `nhlRecordsDraftLotteryOdds` | `https://records.nhl.com/site/api/draft-lottery-odds` | — | — | `parse_nhl_records` | — |
| `nhl_records_draft_prospect` / `nhlRecordsDraftProspect` | `https://records.nhl.com/site/api/draft-prospect/{prospect_id}` | `prospect_id` | — | `parse_nhl_records` | — |
| `nhl_records_expansion_draft_picks` / `nhlRecordsExpansionDraftPicks` | `https://records.nhl.com/site/api/expansion-draft-picks` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchise_detail` / `nhlRecordsFranchiseDetail` | `https://records.nhl.com/site/api/franchise-detail` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchise_playoff_appearances` / `nhlRecordsFranchisePlayoffAppearances` | `https://records.nhl.com/site/api/franchise-playoff-appearances` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchise_season_results` / `nhlRecordsFranchiseSeasonResults` | `https://records.nhl.com/site/api/franchise-season-results` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchise_team_totals` / `nhlRecordsFranchiseTeamTotals` | `https://records.nhl.com/site/api/franchise-team-totals` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchise_totals` / `nhlRecordsFranchiseTotals` | `https://records.nhl.com/site/api/franchise-totals` | — | — | `parse_nhl_records` | — |
| `nhl_records_franchises` / `nhlRecordsFranchises` | `https://records.nhl.com/site/api/franchise` | — | — | `parse_nhl_records` | — |
| `nhl_records_gm_career` / `nhlRecordsGmCareer` | `https://records.nhl.com/site/api/general-manager/{gm_id}` | `gm_id` | — | `parse_nhl_records` | — |
| `nhl_records_gm_franchise` / `nhlRecordsGmFranchise` | `https://records.nhl.com/site/api/general-manager-franchise-records` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_career_stats` / `nhlRecordsGoalieCareerStats` | `https://records.nhl.com/site/api/goalie-career-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_career_stats_with_playoffs` / `nhlRecordsGoalieCareerStatsWithPlayoffs` | `https://records.nhl.com/site/api/goalie_career_stats_incl_playoffs` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_playoff_streak` / `nhlRecordsGoaliePlayoffStreak` | `https://records.nhl.com/site/api/goalie-playoff-streak` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_season_stats` / `nhlRecordsGoalieSeasonStats` | `https://records.nhl.com/site/api/goalie-season-stats` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_shutout_streak` / `nhlRecordsGoalieShutoutStreak` | `https://records.nhl.com/site/api/goalie-shutout-streak` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_undefeated_streak` / `nhlRecordsGoalieUndefeatedStreak` | `https://records.nhl.com/site/api/goalie-undefeated-streak` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_win_plateaus` / `nhlRecordsGoalieWinPlateaus` | `https://records.nhl.com/site/api/goalie-win-plateaus` | — | — | `parse_nhl_records` | — |
| `nhl_records_goalie_win_streak` / `nhlRecordsGoalieWinStreak` | `https://records.nhl.com/site/api/goalie-win-streak` | — | — | `parse_nhl_records` | — |
| `nhl_records_hof_players` / `nhlRecordsHofPlayers` | `https://records.nhl.com/site/api/hof/players` | — | — | `parse_nhl_records` | — |
| `nhl_records_hof_players_by_office` / `nhlRecordsHofPlayersByOffice` | `https://records.nhl.com/site/api/hof/players/{office_id}` | `office_id`\* | — | `parse_nhl_records` | — |
| `nhl_records_home_team_record` / `nhlRecordsHomeTeamRecord` | `https://records.nhl.com/site/api/home-team-record` | — | — | `parse_nhl_records` | — |
| `nhl_records_skater_career_leaders` / `nhlRecordsSkaterCareerLeaders` | `https://records.nhl.com/site/api/skater-career-leaders` | — | — | `parse_nhl_records` | — |
| `nhl_records_skater_career_stats` / `nhlRecordsSkaterCareerStats` | `https://records.nhl.com/site/api/skater-career-statistics` | — | — | `parse_nhl_records` | — |

### Returns — `nhl_records_all_time_record_vs_franchise` / `nhlRecordsAllTimeRecordVsFranchise`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_franchise` | integer | Indicator of whether the franchise is active. |
| `active_opponent_franchise` | integer | Flag indicating whether the opponent franchise is currently active in the NHL (1 = active, 0 = relocated or dissolved). |
| `franchise_name` | character | Franchise name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `home_games_played` | integer | Total number of home games the franchise has played all-time against this opponent franchise. |
| `home_goals_against` | double | Total goals allowed by the franchise in all-time home games against this opponent. |
| `home_goals_for` | double | Total goals scored by the franchise in all-time home games against this opponent. |
| `home_last_meeting_season_id` | integer | NHL season identifier for the most recent home game played against this opponent franchise. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | integer | Home overtime losses. |
| `home_points` | integer | Home team total points scored in the game so far. |
| `home_ties` | integer | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `opponent_franchise_id` | integer | NHL records identifier for the opposing franchise in this all-time head-to-head record. |
| `opponent_franchise_name` | character | Full name of the opposing franchise in this all-time head-to-head record. |
| `opponent_team_id` | integer | Opponent team identifier. |
| `road_games_played` | integer | Total number of road games the franchise has played all-time against this opponent franchise. |
| `road_goals_against` | integer | Total goals allowed by the franchise in all-time road games against this opponent. |
| `road_goals_for` | integer | Total goals scored by the franchise in all-time road games against this opponent. |
| `road_last_meeting_season_id` | integer | NHL season identifier for the most recent road game played against this opponent franchise. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | integer | Road overtime losses. |
| `road_points` | integer | Total standings points earned by the franchise in all-time road games against this opponent. |
| `road_ties` | integer | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `team_franchise_id` | integer | Team franchise identifier. |
| `team_id` | integer | Unique team identifier. |
| `total_games_played` | integer | Total number of games played all-time between this franchise and the opponent franchise across home and road venues. |
| `total_goals_against` | integer | Total goals allowed by the franchise in all-time games against this opponent across home and road. |
| `total_goals_for` | integer | Total goals scored by the franchise in all-time games against this opponent across home and road. |
| `total_last_meeting_season_id` | integer | NHL season identifier for the most recent game played between the two franchises in any venue. |
| `total_losses` | integer | Total losses to date (goalie). |
| `total_ot_losses` | integer | Total number of overtime losses accumulated by the franchise all-time against this opponent. |
| `total_points` | integer | Total standings points earned by the franchise across all all-time games against this opponent. |
| `total_ties` | integer | Total ties. |
| `total_wins` | integer | Total wins. |

**Row type:** `NhlRecordsAllTimeRecordVsFranchiseRow` (exported from the package root).

### Returns — `nhl_records_allstar_coach_career` / `nhlRecordsAllstarCoachCareer`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_team_id` | integer | NHL identifier for the All-Star team the coach was assigned to in a given All-Star game. |
| `coach_id` | integer | ESPN coach id parsed from the `$ref` URL. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `games_coached` | integer | Total number of All-Star games the coach has coached across their career. |
| `is_active` | logical | Whether the team is active. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `ot_losses` | integer | Overtime losses. |
| `season_id` | integer | Season identifier. |
| `ties` | integer | Total ties. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsAllstarCoachCareerRow` (exported from the package root).

### Returns — `nhl_records_allstar_goalie_career` / `nhlRecordsAllstarGoalieCareer`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_team_id` | integer | Identifier for the NHL All-Star team the goalie represented in their career All-Star appearances. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `games_played` | integer | Games played. |
| `goals_against` | integer | Goals against. |
| `goals_against_average` | double | Goals against average. |
| `is_active` | logical | Whether the team is active. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `nhl_team_id` | integer | NHL identifier for the regular-season franchise the goalie was affiliated with during their All-Star career. |
| `ot_losses` | integer | Overtime losses. |
| `player_id` | integer | Unique player identifier. |
| `save_percentage` | double | Save percentage (goalies). |
| `season_id` | integer | Season identifier. |
| `shots_against` | integer | Shots faced. |
| `team_losses` | integer | Team losses. |
| `team_wins` | integer | Team wins. |
| `ties` | integer | Total ties. |
| `time_on_ice` | integer | Time on ice in seconds. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsAllstarGoalieCareerRow` (exported from the package root).

### Returns — `nhl_records_allstar_goalie_game` / `nhlRecordsAllstarGoalieGame`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_team_id` | integer | NHL identifier for the All-Star team the goalie was assigned to in the game. |
| `all_star_team_score` | integer | Goals scored by the goalie's All-Star team in that game. |
| `arena_name` | character | Arena name. |
| `city` | character | City where the venue is located. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `game_date` | character | Game date. |
| `game_id` | integer | Unique game identifier. |
| `game_name` | character | Full event name. |
| `goals_against` | integer | Goals against. |
| `home_road` | character | Indicates whether the goalie's All-Star team was the designated home or road squad for the game. |
| `is_active` | logical | Whether the team is active. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `last_name` | character | Player last name. |
| `mvp` | character | Mvp. |
| `nhl_team_id` | integer | NHL identifier for the goalie's regular-season franchise at the time of the All-Star game. |
| `opponent_score` | integer | Opponent score. |
| `opponent_team_id` | integer | Opponent team identifier. |
| `player_id` | integer | Unique player identifier. |
| `save_percentage` | double | Save percentage (goalies). |
| `saves` | integer | Saves made. |
| `season_id` | integer | Season identifier. |
| `shots_against` | integer | Shots faced. |
| `state_province_code` | character | State or province code of the official. |
| `time_on_ice` | integer | Time on ice in seconds. |

**Row type:** `NhlRecordsAllstarGoalieGameRow` (exported from the package root).

### Returns — `nhl_records_allstar_skater_career` / `nhlRecordsAllstarSkaterCareer`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_team_id` | integer | Identifier for the All-Star team roster to which the skater was assigned during the All-Star event. |
| `assists` | integer | Assists. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `is_active` | logical | Whether the team is active. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `nhl_team_id` | integer | NHL identifier for the skater's regular-season team at the time of All-Star selection. |
| `penalties` | double | Penalty count. |
| `penalty_minutes` | double | Penalty minutes. |
| `player_id` | integer | Unique player identifier. |
| `points` | integer | Total points (goals + assists). |
| `position` | character | Player position. |
| `power_play_goals` | integer | Power-play goals. |
| `season_id` | integer | Season identifier. |
| `short_handed_goals` | integer | Short-handed goals. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsAllstarSkaterCareerRow` (exported from the package root).

### Returns — `nhl_records_allstar_skater_game` / `nhlRecordsAllstarSkaterGame`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `all_star_team_id` | integer | Identifier for the All-Star team roster to which the skater was assigned for this game. |
| `all_star_team_score` | integer | Goals scored by the skater's All-Star team in this specific All-Star game. |
| `arena_name` | character | Arena name. |
| `assists` | integer | Assists. |
| `city` | character | City where the venue is located. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `game_date` | character | Game date. |
| `game_id` | integer | Unique game identifier. |
| `game_name` | character | Full event name. |
| `goals` | integer | Goals scored. |
| `home_road` | character | Designation indicating whether the skater's All-Star team was the home or road side for this game. |
| `is_active` | logical | Whether the team is active. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `last_name` | character | Player last name. |
| `mvp` | character | Mvp. |
| `nhl_team_id` | integer | NHL identifier for the skater's regular-season team at the time this All-Star game was played. |
| `opponent_score` | integer | Opponent score. |
| `opponent_team_id` | integer | Opponent team identifier. |
| `penalties` | double | Penalty count. |
| `penalty_minutes` | double | Penalty minutes. |
| `player_id` | integer | Unique player identifier. |
| `points` | integer | Total points (goals + assists). |
| `position` | character | Player position. |
| `power_play_goals` | integer | Power-play goals. |
| `season_id` | integer | Season identifier. |
| `short_handed_goals` | integer | Short-handed goals. |
| `state_province_code` | character | State or province code of the official. |

**Row type:** `NhlRecordsAllstarSkaterGameRow` (exported from the package root).

### Returns — `nhl_records_attendance` / `nhlRecordsAttendance`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `playoff_attendance` | double | Total playoff attendance. |
| `regular_attendance` | double | Total regular-season attendance. |
| `season_id` | integer | Season identifier. |
| `total_attendance` | double | Total attendance for the season. |

**Row type:** `NhlRecordsAttendanceRow` (exported from the package root).

### Returns — `nhl_records_awards` / `nhlRecordsAwards`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `awarded_posthumously` | logical | Whether the award was given posthumously. |
| `coach_id` | double | ESPN coach id parsed from the `$ref` URL. |
| `created_on` | character | Date the trophy record was created. |
| `detail_summary` | character | Detail summary flag. |
| `full_name` | character | Player full name. |
| `general_manager_id` | double | General manager identifier, if applicable. |
| `image_url` | character | Player headshot URL. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `player_id` | double | Unique player identifier. |
| `player_image_caption` | character | Player image caption flag. |
| `player_image_url` | character | URL to the player image. |
| `season_id` | integer | Season identifier. |
| `status` | character | Status string (e.g. captain markers). |
| `summary` | character | Record summary string (e.g. "25-15-10"). |
| `team_id` | integer | Unique team identifier. |
| `trophy_category_id` | integer | Trophy category identifier. |
| `trophy_id` | integer | Trophy identifier. |
| `value` | character | Leader stat numeric value. |
| `vote_count` | double | Number of votes received. |

**Row type:** `NhlRecordsAwardsRow` (exported from the package root).

### Returns — `nhl_records_awards_trophy_season` / `nhlRecordsAwardsTrophySeason`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `awarded_posthumously` | logical | Whether the award was given posthumously. |
| `coach_id` | integer | ESPN coach id parsed from the `$ref` URL. |
| `created_on` | character | Date the trophy record was created. |
| `detail_summary` | character | Detail summary flag. |
| `full_name` | character | Player full name. |
| `general_manager_id` | integer | General manager identifier, if applicable. |
| `image_url` | character | Player headshot URL. |
| `is_rookie` | logical | Whether the player is a rookie. |
| `player_id` | character | Unique player identifier. |
| `player_image_caption` | character | Player image caption flag. |
| `player_image_url` | character | URL to the player image. |
| `season_id` | integer | Season identifier. |
| `status` | character | Status string (e.g. captain markers). |
| `summary` | character | Record summary string (e.g. "25-15-10"). |
| `team_id` | integer | Unique team identifier. |
| `trophy_category_id` | integer | Trophy category identifier. |
| `trophy_id` | integer | Trophy identifier. |
| `value` | character | Leader stat numeric value. |
| `vote_count` | integer | Number of votes received. |

**Row type:** `NhlRecordsAwardsTrophySeasonRow` (exported from the package root).

### Returns — `nhl_records_away_team_record` / `nhlRecordsAwayTeamRecord`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `goals_against` | integer | Goals against. |
| `goals_against_per_game` | double | Goals against per game. |
| `goals_per_game` | double | Average number of goals the team scored per road game over the recorded period. |
| `losses` | integer | Losses. |
| `overtime_losses` | double | Total overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `season_id` | integer | Season identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | double | Total ties. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsAwayTeamRecordRow` (exported from the package root).

### Returns — `nhl_records_coach` / `nhlRecordsCoach`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `bio` | character | Free-text biographical summary of the coach's career and background. |
| `birth_city` | character | Birth city. |
| `birth_country3code` | character | Prospect birth country three-letter code. |
| `birth_date` | character | Player birth date. |
| `birth_state_province_code` | character | Two-letter state or province code indicating the coach's place of birth. |
| `brief_description` | character | Brief description of the trophy. |
| `date_of_death` | character | Date of death, if applicable. |
| `deceased` | logical | Whether the player is deceased. |
| `description` | character | Full text description of the event. |
| `featured_image` | character | URL of the featured promotional image associated with the coach's NHL profile. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `history` | character | ESPN's long-form history text for the award. |
| `hockey_hof_link` | character | URL to the coach's page on the Hockey Hall of Fame website, if inducted. |
| `in_hockey_hof` | logical | Whether the player is in the Hockey Hall of Fame. |
| `in_iihf_hockey_hof` | logical | Boolean flag indicating whether the coach is inducted into the IIHF Hockey Hall of Fame. |
| `in_us_hockey_hof` | logical | Whether the player is in the US Hockey Hall of Fame. |
| `instagram` | character | Instagram profile handle or URL associated with the coach. |
| `is_active` | logical | Whether the team is active. |
| `last_name` | character | Player last name. |
| `nationality_code` | character | Nationality code of the official. |
| `player_id` | integer | Unique player identifier. |
| `stanley_cup` | integer | Number of Stanley Cup championships won by the coach as a head coach. |
| `team_id` | character | Unique team identifier. |
| `top100_player_link` | character | URL to the coach's entry on the NHL's Top 100 Players list, if applicable. |
| `twitter` | character | Twitter (X) handle or URL associated with the coach. |

**Row type:** `NhlRecordsCoachRow` (exported from the package root).

### Returns — `nhl_records_coach_career` / `nhlRecordsCoachCareer`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_coach` | logical | Indicates whether the coach is currently active as an NHL head coach. |
| `coach_name` | character | Full display name of the NHL head coach. |
| `end_season` | integer | The most recent season the coach held a head-coaching position, encoded as an eight-digit season ID. |
| `first_name` | character | Player first name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games` | integer | Games played. |
| `home_games` | integer | Total home games. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | double | Home overtime losses. |
| `home_ties` | double | Ties at home. |
| `home_win_pctg` | double | Win percentage for all regular-season home games coached. |
| `home_wins` | integer | Wins at home. |
| `jack_adams` | integer | Number of Jack Adams Award trophies won by the coach as NHL coach of the year. |
| `last_coached_date` | character | Date of the coach's most recent game on the bench, in ISO 8601 format. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `losses_in_ot` | integer | Total regular-season games the coach's team lost in overtime. |
| `losses_in_ot_plus_shootout` | integer | Total regular-season games the coach's team lost in overtime or a shootout combined. |
| `losses_in_shootout` | double | Total regular-season games the coach's team lost via shootout. |
| `ot_losses` | double | Overtime losses. |
| `road_games` | integer | Total regular-season road games coached. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | double | Road overtime losses. |
| `road_ties` | double | Ties on the road. |
| `road_win_pctg` | double | Win percentage for all regular-season road games coached. |
| `road_wins` | integer | Wins on the road. |
| `seasons` | integer | Number of NHL seasons the coach has served as a head coach. |
| `stanley_cup_final_appearances` | integer | Number of times the coach has led a team to the Stanley Cup Final. |
| `stanley_cups` | integer | Number of Stanley Cup championships won as head coach. |
| `start_season` | integer | The first season the coach served as an NHL head coach, encoded as an eight-digit season ID. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `ties` | double | Total ties. |
| `ties_in_ot` | integer | Total regular-season overtime-period ties recorded under pre-shootout rules. |
| `win_pctg` | double | Overall regular-season win percentage across the coach's entire career. |
| `wins` | integer | Wins. |
| `wins_in_ot` | integer | Total regular-season games the coach's team won in overtime. |
| `wins_in_ot_plus_shootout` | integer | Total regular-season games the coach's team won in overtime or a shootout combined. |
| `wins_in_shootout` | double | Wins in shootout. |

**Row type:** `NhlRecordsCoachCareerRow` (exported from the package root).

### Returns — `nhl_records_coach_career_with_playoffs` / `nhlRecordsCoachCareerWithPlayoffs`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_coach` | logical | Indicates whether the coach is currently active as an NHL head coach. |
| `coach_id` | integer | ESPN coach id parsed from the `$ref` URL. |
| `coach_name` | character | Full display name of the NHL head coach. |
| `end_season` | integer | The most recent season the coach held a head-coaching position, encoded as an eight-digit season ID. |
| `games` | integer | Games played. |
| `losses` | integer | Losses. |
| `ot_losses` | double | Overtime losses. |
| `seasons` | integer | Number of NHL seasons the coach has served as a head coach, including playoff appearances. |
| `start_season` | integer | The first season the coach served as an NHL head coach, encoded as an eight-digit season ID. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `ties` | double | Total ties. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsCoachCareerWithPlayoffsRow` (exported from the package root).

### Returns — `nhl_records_coach_franchise` / `nhlRecordsCoachFranchise`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_coach` | logical | Indicates whether the coach is currently active with the franchise. |
| `coach_name` | character | Full display name of the coach as recorded in NHL records. |
| `end_season` | integer | Last season (in YYYYYYYY format) the coach was behind the bench for this franchise. |
| `first_coached_date` | character | Calendar date on which the coach first handled a game for this franchise. |
| `first_name` | character | Player first name. |
| `franchise_id` | integer | Unique franchise identifier. |
| `franchise_name` | character | Franchise name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games` | integer | Games played. |
| `home_games` | integer | Total home games. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | double | Home overtime losses. |
| `home_ties` | double | Ties at home. |
| `home_win_pctg` | double | Fraction of home games the coach's franchise won during their tenure. |
| `home_wins` | integer | Wins at home. |
| `jack_adams` | integer | Number of Jack Adams Awards (NHL coach of the year) won by the coach during this franchise tenure. |
| `last_coached_date` | character | Calendar date of the coach's most recent game on the bench for this franchise. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `losses_in_ot` | integer | Number of games the coach's franchise lost in overtime during the tenure. |
| `losses_in_ot_plus_shootout` | integer | Combined losses in overtime and shootout during the coach's franchise tenure. |
| `losses_in_shootout` | double | Number of games the coach's franchise lost in a shootout during the tenure. |
| `ot_losses` | double | Overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `road_games` | integer | Total regular-season road games coached with this franchise. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | double | Road overtime losses. |
| `road_ties` | double | Ties on the road. |
| `road_win_pctg` | double | Fraction of away games the coach's franchise won during their tenure. |
| `road_wins` | integer | Wins on the road. |
| `seasons` | integer | Number of NHL seasons the coach spent with this franchise. |
| `stanley_cup_final_appearances` | integer | Number of Stanley Cup Final appearances made while coaching this franchise. |
| `stanley_cups` | integer | Number of Stanley Cup championships won while coaching this franchise. |
| `start_season` | integer | First season (in YYYYYYYY format) the coach served with this franchise. |
| `team_abbrev` | character | Team abbreviation. |
| `team_name` | character | Team name. |
| `ties` | double | Total ties. |
| `ties_in_ot` | integer | Number of overtime ties recorded under this coach for this franchise (pre-shootout era). |
| `win_pctg` | double | Overall win percentage across all regular-season games coached with this franchise. |
| `wins` | integer | Wins. |
| `wins_in_ot` | integer | Number of games the coach's franchise won in overtime during the tenure. |
| `wins_in_ot_plus_shootout` | integer | Combined wins in overtime and shootout during the coach's franchise tenure. |
| `wins_in_shootout` | double | Wins in shootout. |

**Row type:** `NhlRecordsCoachFranchiseRow` (exported from the package root).

### Returns — `nhl_records_coach_stanley_cup` / `nhlRecordsCoachStanleyCup`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_coach` | logical | Boolean flag indicating whether the coach is currently active as an NHL head coach. |
| `coach_id` | integer | ESPN coach id parsed from the `$ref` URL. |
| `coach_name` | character | Full name of the head coach in this Stanley Cup championship record. |
| `franchise_id` | double | Unique franchise identifier. |
| `franchise_name` | character | Franchise name. |
| `longest_streak` | integer | Maximum number of consecutive seasons in which the coach won the Stanley Cup. |
| `longest_streak_description` | character | Human-readable description of the coach's longest consecutive Stanley Cup winning streak. |
| `seasons_won` | character | Comma-separated list of NHL seasons in which the coach won the Stanley Cup as head coach. |
| `stanley_cups` | integer | Total number of Stanley Cup championships won by this coach as head coach. |
| `team_abbrevs` | character | Team abbreviation(s). |

**Row type:** `NhlRecordsCoachStanleyCupRow` (exported from the package root).

### Returns — `nhl_records_coaches` / `nhlRecordsCoaches`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `bio` | character | Long-form biographical narrative for the coach, as provided by the NHL api-web endpoint. |
| `birth_city` | character | Birth city. |
| `birth_country3code` | character | Prospect birth country three-letter code. |
| `birth_date` | character | Player birth date. |
| `birth_state_province_code` | character | Two-letter state or province code of the coach's birth location (e.g., 'ON' for Ontario, 'MI' for Michigan). |
| `brief_description` | character | Brief description of the trophy. |
| `date_of_death` | character | Date of death, if applicable. |
| `deceased` | logical | Whether the player is deceased. |
| `description` | character | Full text description of the event. |
| `featured_image` | character | URL of the coach's featured promotional or profile image on the NHL platform. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `history` | character | ESPN's long-form history text for the award. |
| `hockey_hof_link` | character | URL to the coach's Hockey Hall of Fame profile page, if they are an inductee. |
| `in_hockey_hof` | logical | Whether the player is in the Hockey Hall of Fame. |
| `in_iihf_hockey_hof` | logical | Boolean flag indicating whether the coach is inducted into the IIHF Hockey Hall of Fame. |
| `in_us_hockey_hof` | logical | Whether the player is in the US Hockey Hall of Fame. |
| `instagram` | character | Instagram handle or profile URL for the coach's official social media presence. |
| `is_active` | logical | Whether the team is active. |
| `last_name` | character | Player last name. |
| `nationality_code` | character | Nationality code of the official. |
| `player_id` | double | Unique player identifier. |
| `stanley_cup` | double | Number of Stanley Cup championships won by the coach as a head coach or assistant coach. |
| `team_id` | character | Unique team identifier. |
| `top100_player_link` | character | URL to the coach's NHL Top 100 players recognition page, if applicable. |
| `twitter` | character | Twitter/X handle or profile URL for the coach's official social media presence. |

**Row type:** `NhlRecordsCoachesRow` (exported from the package root).

### Returns — `nhl_records_consecutive_100pt_seasons` / `nhlRecordsConsecutive100ptSeasons`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `active_streak` | logical | Indicator of whether the streak is active. |
| `consecutive100_point_seasons` | integer | Number of consecutive NHL regular seasons in which the player reached 100 or more points. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `position_code` | character | Player position code. |
| `seasons_played` | integer | Number of seasons played. |
| `streak_end_season` | integer | The last season of the consecutive 100-point streak, encoded as an eight-digit season ID. |
| `streak_start_season` | integer | The first season of the consecutive 100-point streak, encoded as an eight-digit season ID. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `team_names` | character | Team names. |

**Row type:** `NhlRecordsConsecutive100ptSeasonsRow` (exported from the package root).

### Returns — `nhl_records_draft` / `nhlRecordsDraft`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `age_in_days` | character | Player age in days. |
| `age_in_days_for_year` | character | Player age in days for the draft year. |
| `age_in_years` | character | Player age in years. |
| `amateur_club_name` | character | Amateur club the player played for. |
| `amateur_league` | character | Amateur league the player played in. |
| `birth_date` | character | Player birth date. |
| `birth_place` | character | Player birth place. |
| `country_code` | character | Player country code. |
| `cs_player_id` | character | Central Scouting player identifier. |
| `draft_date` | character | Date the player was drafted. |
| `draft_master_id` | integer | Draft master record identifier. |
| `draft_year` | integer | Draft year the lottery applies to. |
| `drafted_by_team_id` | character | Identifier of the drafting team. |
| `first_name` | character | Player first name. |
| `height` | character | Player height in inches. |
| `last_name` | character | Player last name. |
| `notes` | character | Notes flag for the pick. |
| `overall_pick_number` | integer | Overall pick number in the draft. |
| `pick_in_round` | integer | Pick number within the round. |
| `player_id` | character | Unique player identifier. |
| `player_name` | character | Player name. |
| `position` | character | Player position. |
| `removed_outright` | character | Removed-outright indicator. |
| `removed_outright_why` | character | Reason the pick was removed outright. |
| `round_number` | integer | Draft round number. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `supplemental_draft` | character | Supplemental draft indicator. |
| `team_pick_history` | character | History of the team's picks at this slot. |
| `tri_code` | character | Team three-letter code. |
| `weight` | character | Player weight in pounds. |

**Row type:** `NhlRecordsDraftRow` (exported from the package root).

### Returns — `nhl_records_draft_by_team` / `nhlRecordsDraftByTeam`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `age_in_days` | integer | Player age in days. |
| `age_in_days_for_year` | integer | Player age in days for the draft year. |
| `age_in_years` | integer | Player age in years. |
| `amateur_club_name` | character | Amateur club the player played for. |
| `amateur_league` | character | Amateur league the player played in. |
| `birth_date` | character | Player birth date. |
| `birth_place` | character | Player birth place. |
| `country_code` | character | Player country code. |
| `cs_player_id` | character | Central Scouting player identifier. |
| `draft_date` | character | Date the player was drafted. |
| `draft_master_id` | integer | Draft master record identifier. |
| `draft_year` | integer | Draft year the lottery applies to. |
| `drafted_by_team_id` | integer | Identifier of the drafting team. |
| `first_name` | character | Player first name. |
| `height` | double | Player height in inches. |
| `last_name` | character | Player last name. |
| `notes` | character | Notes flag for the pick. |
| `overall_pick_number` | integer | Overall pick number in the draft. |
| `pick_in_round` | integer | Pick number within the round. |
| `player_id` | character | Unique player identifier. |
| `player_name` | character | Player name. |
| `position` | character | Player position. |
| `removed_outright` | character | Removed-outright indicator. |
| `removed_outright_why` | character | Reason the pick was removed outright. |
| `round_number` | integer | Draft round number. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `supplemental_draft` | character | Supplemental draft indicator. |
| `team_pick_history` | character | History of the team's picks at this slot. |
| `tri_code` | character | Team three-letter code. |
| `weight` | double | Player weight in pounds. |

**Row type:** `NhlRecordsDraftByTeamRow` (exported from the package root).

### Returns — `nhl_records_draft_lottery_odds` / `nhlRecordsDraftLotteryOdds`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `draft_year` | integer | Draft year the lottery applies to. |
| `format_content` | character | Description of the lottery format. |
| `odds_content` | character | Description of the lottery odds. |
| `result_notes` | character | Notes on the lottery results. |

**Row type:** `NhlRecordsDraftLotteryOddsRow` (exported from the package root).

### Returns — `nhl_records_draft_prospect` / `nhlRecordsDraftProspect`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `birth_city` | character | Birth city. |
| `birth_country3code` | character | Prospect birth country three-letter code. |
| `birth_date` | character | Player birth date. |
| `birth_state_prov_code` | character | Prospect birth state/province code. |
| `category_id` | integer | Prospect category identifier. |
| `created_on` | character | Date the trophy record was created. |
| `cs_player_id` | integer | Central Scouting player identifier. |
| `draft_status_code` | character | Draft eligibility status code. |
| `ep_player_id` | integer | EliteProspects player identifier. |
| `first_name` | character | Player first name. |
| `headshot_id` | integer | Headshot image identifier. |
| `height` | integer | Player height in inches. |
| `hometown` | character | Prospect hometown. |
| `last_club_name` | character | Most recent club name. |
| `last_league_abbr` | character | Most recent league abbreviation. |
| `last_name` | character | Player last name. |
| `nationality_code` | character | Nationality code of the official. |
| `news_articles` | character | Associated news articles. |
| `playerid` | integer | Unique player identifier. |
| `position_desc` | character | Player position description. |
| `profile` | character | Prospect profile text. |
| `quotes` | character | Quotes about the prospect. |
| `scouting_report` | character | Scouting report text. |
| `shoots_catches` | character | Handedness (shoots/catches). |
| `stats_text` | character | Statistical summary text. |
| `video` | character | Associated video content. |
| `weight` | integer | Player weight in pounds. |

**Row type:** `NhlRecordsDraftProspectRow` (exported from the package root).

### Returns — `nhl_records_expansion_draft_picks` / `nhlRecordsExpansionDraftPicks`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active` | logical | Whether athlete is currently active. |
| `draft_picks` | character | JSON-serialized list of players selected by this franchise in the NHL expansion draft. |
| `season_id` | integer | Season identifier. |
| `team_id` | integer | Unique team identifier. |

**Row type:** `NhlRecordsExpansionDraftPicksRow` (exported from the package root).

### Returns — `nhl_records_franchise_detail` / `nhlRecordsFranchiseDetail`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active` | logical | Whether athlete is currently active. |
| `captain_history` | character | Franchise captain history text. |
| `coaching_history` | character | Franchise coaching history text. |
| `date_awarded` | character | Date the franchise was awarded. |
| `directory_url` | character | Franchise directory URL. |
| `first_season_id` | integer | Season identifier of the first season. |
| `general_manager_history` | character | Franchise general manager history text. |
| `hero_image_url` | character | Franchise hero image URL. |
| `most_recent_team_id` | integer | Most recent team identifier. |
| `retired_numbers_summary` | character | Summary of retired jersey numbers. |
| `team_abbrev` | character | Team abbreviation. |
| `team_full_name` | character | Full team name. |

**Row type:** `NhlRecordsFranchiseDetailRow` (exported from the package root).

### Returns — `nhl_records_franchise_playoff_appearances` / `nhlRecordsFranchisePlayoffAppearances`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `first_season_id` | integer | Season identifier of the first season. |
| `franchise_id` | integer | Unique franchise identifier. |
| `franchise_name` | character | Franchise name. |
| `playoff_seasons` | integer | Number of playoff seasons. |
| `stanley_cup_appearances` | integer | Number of Stanley Cup Final appearances. |
| `stanley_cup_wins` | integer | Number of Stanley Cup championships. |
| `years` | integer | Number of years the franchise existed. |

**Row type:** `NhlRecordsFranchisePlayoffAppearancesRow` (exported from the package root).

### Returns — `nhl_records_franchise_season_results` / `nhlRecordsFranchiseSeasonResults`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `conference_abbrev` | character | Conference abbreviation. |
| `conference_name` | character | Conference name. |
| `conference_sequence` | integer | Team's seeding position within the conference. |
| `decision` | character | Goalie decision (W/L/O). |
| `division_abbrev` | character | Division abbreviation. |
| `division_name` | character | Division name. |
| `division_sequence` | integer | Team's seeding position within the division. |
| `final_playoff_round` | integer | Final playoff round reached. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `goals_against` | integer | Goals against. |
| `home_losses` | integer | Losses at home. |
| `home_overtime_losses` | character | Overtime losses at home. |
| `home_ties` | integer | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `in_playoffs` | logical | Whether the season reached the playoffs. |
| `league_sequence` | integer | Team's seeding position within the league. |
| `losses` | integer | Losses. |
| `overtime_losses` | character | Total overtime losses. |
| `penalty_minutes` | integer | Penalty minutes. |
| `playoff_round` | double | Playoff round identifier. |
| `points` | integer | Total points (goals + assists). |
| `road_losses` | integer | Losses on the road. |
| `road_overtime_losses` | character | Overtime losses on the road. |
| `road_ties` | integer | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `season_id` | integer | Season identifier. |
| `series_abbrev` | character | Playoff series abbreviation. |
| `series_title` | character | Playoff series title. |
| `shutouts` | integer | Shutouts recorded. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | integer | Total ties. |
| `tri_code` | character | Team three-letter code. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsFranchiseSeasonResultsRow` (exported from the package root).

### Returns — `nhl_records_franchise_team_totals` / `nhlRecordsFranchiseTeamTotals`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_franchise` | integer | Indicator of whether the franchise is active. |
| `active_team` | logical | Indicator of whether the team is active. |
| `cups` | integer | Number of Stanley Cup championships. |
| `first_season_id` | integer | Season identifier of the first season. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `game_win_pctg` | double | Game-winning percentage. |
| `games_played` | double | Games played. |
| `goals_against` | double | Goals against. |
| `goals_for` | double | Goals for. |
| `home_losses` | double | Losses at home. |
| `home_overtime_losses` | double | Overtime losses at home. |
| `home_ties` | double | Ties at home. |
| `home_wins` | double | Wins at home. |
| `last_season_id` | double | Season ID of the franchise's last season. |
| `losses` | double | Losses. |
| `overtime_losses` | double | Total overtime losses. |
| `penalty_minutes` | double | Penalty minutes. |
| `playoff_seasons` | double | Number of playoff seasons. |
| `point_pctg` | double | Points percentage. |
| `points` | double | Total points (goals + assists). |
| `road_losses` | double | Losses on the road. |
| `road_overtime_losses` | double | Overtime losses on the road. |
| `road_ties` | double | Ties on the road. |
| `road_wins` | double | Wins on the road. |
| `series_losses` | integer | Playoff series losses. |
| `series_played` | double | Playoff series played. |
| `series_win_pctg` | double | Playoff series win percentage. |
| `series_wins` | integer | Playoff series wins. |
| `shootout_losses` | double | Shootout losses. |
| `shootout_wins` | double | Shootout wins. |
| `shutouts` | double | Shutouts recorded. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | double | Total ties. |
| `tri_code` | character | Team three-letter code. |
| `wins` | double | Wins. |

**Row type:** `NhlRecordsFranchiseTeamTotalsRow` (exported from the package root).

### Returns — `nhl_records_franchise_totals` / `nhlRecordsFranchiseTotals`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_franchise` | integer | Indicator of whether the franchise is active. |
| `cups` | integer | Number of Stanley Cup championships. |
| `first_season_id` | integer | Season identifier of the first season. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `game_win_pctg` | double | Game-winning percentage. |
| `games_played` | integer | Games played. |
| `goals_against` | integer | Goals against. |
| `goals_for` | integer | Goals for. |
| `home_losses` | integer | Losses at home. |
| `home_overtime_losses` | double | Overtime losses at home. |
| `home_ties` | double | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `last_season_id` | double | Season ID of the franchise's last season. |
| `losses` | integer | Losses. |
| `overtime_losses` | double | Total overtime losses. |
| `penalty_minutes` | integer | Penalty minutes. |
| `playoff_seasons` | double | Number of playoff seasons. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `road_losses` | integer | Losses on the road. |
| `road_overtime_losses` | double | Overtime losses on the road. |
| `road_ties` | double | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `series_losses` | double | Playoff series losses. |
| `series_played` | double | Playoff series played. |
| `series_win_pctg` | double | Playoff series win percentage. |
| `series_wins` | double | Playoff series wins. |
| `shootout_losses` | integer | Shootout losses. |
| `shootout_wins` | integer | Shootout wins. |
| `shutouts` | integer | Shutouts recorded. |
| `team_abbrev` | character | Team abbreviation. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | double | Total ties. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsFranchiseTotalsRow` (exported from the package root).

### Returns — `nhl_records_franchises` / `nhlRecordsFranchises`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `first_season_id` | integer | Season identifier of the first season. |
| `full_name` | character | Player full name. |
| `last_season_id` | double | Season ID of the franchise's last season. |
| `most_recent_team_id` | integer | Most recent team identifier. |
| `team_abbrev` | character | Team abbreviation. |
| `team_common_name` | character | Team common (nickname) name. |
| `team_place_name` | character | Team place (city/location) name. |

**Row type:** `NhlRecordsFranchisesRow` (exported from the package root).

### Returns — `nhl_records_gm_career` / `nhlRecordsGmCareer`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_gm` | logical | Indicates whether the general manager is currently active in an NHL front-office role. |
| `end_date` | character | Season end date. |
| `end_season_id` | integer | Season identifier (e.g., 20232024) for the last season the GM held the position. |
| `first_name` | character | Player first name. |
| `full_name` | character | Player full name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games` | integer | Games played. |
| `gm_of_the_year` | integer | Number of times the general manager won the NHL GM of the Year Award during their career. |
| `home_games` | integer | Total home games. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | double | Home overtime losses. |
| `home_ties` | double | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `losses_in_ot` | integer | Number of games the GM's team lost in overtime during their tenure. |
| `losses_in_ot_plus_shootout` | integer | Combined total of overtime and shootout losses recorded during the GM's tenure. |
| `losses_in_shootout` | double | Number of games the GM's team lost in the shootout portion of a tied game. |
| `overtime_losses` | integer | Total overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `road_games` | integer | Total number of away games played by the GM's team across their tenure. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | double | Road overtime losses. |
| `road_ties` | double | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `seasons` | integer | Total number of NHL seasons the general manager has served in the role. |
| `stanley_cup_final_appearances` | integer | Number of times the GM's team reached the Stanley Cup Final during their tenure. |
| `stanley_cups` | integer | Number of Stanley Cup championships won by the GM's franchise during their tenure. |
| `start_date` | character | Season start date. |
| `start_season_id` | integer | Season identifier (e.g., 20052006) for the first season the GM held the position. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `ties` | integer | Total ties. |
| `ties_in_ot` | integer | Number of overtime ties recorded under legacy rules during the GM's tenure. |
| `win_pctg` | double | Career winning percentage for the GM, calculated as wins divided by total games decided. |
| `wins` | integer | Wins. |
| `wins_in_ot` | integer | Number of games the GM's team won in overtime during their tenure. |
| `wins_in_ot_plus_shootout` | integer | Combined total of overtime and shootout wins recorded during the GM's tenure. |
| `wins_in_shootout` | double | Wins in shootout. |

**Row type:** `NhlRecordsGmCareerRow` (exported from the package root).

### Returns — `nhl_records_gm_franchise` / `nhlRecordsGmFranchise`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_gm` | logical | Indicates whether the general manager is currently active with the franchise. |
| `end_date` | character | Season end date. |
| `end_season_id` | integer | NHL season identifier for the last season the GM held the role with this franchise. |
| `first_name` | character | Player first name. |
| `franchise_id` | integer | Unique franchise identifier. |
| `franchise_name` | character | Franchise name. |
| `full_name` | character | Player full name. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games` | integer | Games played. |
| `gm_of_the_year` | integer | Number of NHL General Manager of the Year awards won during this franchise tenure. |
| `home_games` | integer | Total home games. |
| `home_losses` | integer | Losses at home. |
| `home_ot_losses` | double | Home overtime losses. |
| `home_ties` | double | Ties at home. |
| `home_wins` | integer | Wins at home. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `losses_in_ot` | integer | Number of regular-season overtime losses recorded by the franchise under this GM. |
| `losses_in_ot_plus_shootout` | integer | Combined overtime and shootout losses for the franchise during this GM's tenure. |
| `losses_in_shootout` | double | Number of regular-season shootout losses recorded by the franchise under this GM. |
| `overtime_losses` | integer | Total overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `road_games` | integer | Total regular-season away games played by the franchise during this GM's tenure. |
| `road_losses` | integer | Losses on the road. |
| `road_ot_losses` | double | Road overtime losses. |
| `road_ties` | double | Ties on the road. |
| `road_wins` | integer | Wins on the road. |
| `seasons` | integer | Number of NHL seasons the GM held the role with this franchise. |
| `stanley_cup_final_appearances` | integer | Number of Stanley Cup Final appearances by the franchise during this GM's tenure. |
| `stanley_cups` | integer | Number of Stanley Cup championships won by the franchise under this GM. |
| `start_date` | character | Season start date. |
| `start_season_id` | integer | NHL season identifier for the first season the GM held the role with this franchise. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | integer | Total ties. |
| `ties_in_ot` | integer | Number of overtime ties recorded by the franchise under this GM (pre-shootout era). |
| `win_pctg` | double | Overall win percentage for the franchise across all regular-season games during this GM's tenure. |
| `wins` | integer | Wins. |
| `wins_in_ot` | integer | Number of regular-season overtime wins recorded by the franchise under this GM. |
| `wins_in_ot_plus_shootout` | integer | Combined overtime and shootout wins for the franchise during this GM's tenure. |
| `wins_in_shootout` | double | Wins in shootout. |

**Row type:** `NhlRecordsGmFranchiseRow` (exported from the package root).

### Returns — `nhl_records_goalie_career_stats` / `nhlRecordsGoalieCareerStats`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `first_name` | character | Player first name. |
| `first_season_for_game_type` | integer | First season ID for the game type. |
| `franchise_id` | double | Unique franchise identifier. |
| `game_seven_games_played` | character | Game seven games played. |
| `game_seven_losses` | character | Game seven losses. |
| `game_seven_wins` | character | Game seven wins. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `goals_against` | integer | Goals against. |
| `goals_against_average` | double | Goals against average. |
| `last_name` | character | Player last name. |
| `last_season_for_game_type` | integer | Last season ID for the game type. |
| `losses` | integer | Losses. |
| `overtime_games_played` | integer | Overtime games played. |
| `overtime_goals_against` | integer | Overtime goals against. |
| `overtime_goals_against_average` | character | Overtime goals against average. |
| `overtime_losses` | character | Total overtime losses. |
| `overtime_save_pctg` | double | Overtime save percentage. |
| `overtime_shots_against` | integer | Overtime shots against. |
| `overtime_ties` | integer | Overtime ties. |
| `overtime_time_on_ice` | double | Overtime time on ice (seconds). |
| `overtime_wins` | integer | Overtime wins. |
| `player_id` | integer | Unique player identifier. |
| `position_code` | character | Player position code. |
| `save_pctg` | double | Save percentage. |
| `saves` | integer | Saves made. |
| `seasons_played` | integer | Number of seasons played. |
| `shots_against` | integer | Shots faced. |
| `shutouts` | integer | Shutouts recorded. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `team_names` | character | Team names. |
| `ties` | integer | Total ties. |
| `time_on_ice` | integer | Time on ice in seconds. |
| `time_on_ice_min_sec` | character | Total time on ice (MM:SS). |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsGoalieCareerStatsRow` (exported from the package root).

### Returns — `nhl_records_goalie_career_stats_with_playoffs` / `nhlRecordsGoalieCareerStatsWithPlayoffs`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | integer | Indicator of whether the player is active. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `games_played` | integer | Games played. |
| `goals_against` | integer | Goals against. |
| `goals_against_average` | double | Goals against average. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `overtime_losses` | character | Total overtime losses. |
| `player_id` | integer | Unique player identifier. |
| `position_code` | character | Player position code. |
| `save_pctg` | double | Save percentage. |
| `saves` | integer | Saves made. |
| `shots_against` | integer | Shots faced. |
| `shutouts` | integer | Shutouts recorded. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `team_names` | character | Team names. |
| `ties` | integer | Total ties. |
| `time_on_ice` | integer | Time on ice in seconds. |
| `time_on_ice_min_sec` | character | Total time on ice (MM:SS). |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsGoalieCareerStatsWithPlayoffsRow` (exported from the package root).

### Returns — `nhl_records_goalie_playoff_streak` / `nhlRecordsGoaliePlayoffStreak`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `active_streak` | logical | Indicator of whether the streak is active. |
| `consecutive_playoff_seasons` | integer | Number of consecutive playoff seasons in which the goalie appeared for the franchise during this streak. |
| `end_season` | integer | Last season (in YYYYYYYY format) of the goalie's consecutive playoff appearance streak. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `playoff_seasons` | integer | Number of playoff seasons. |
| `stanley_cup_wins` | integer | Number of Stanley Cup championships. |
| `start_season` | integer | First season (in YYYYYYYY format) of the goalie's consecutive playoff appearance streak. |
| `team_abbrevs` | character | Team abbreviation(s). |

**Row type:** `NhlRecordsGoaliePlayoffStreakRow` (exported from the package root).

### Returns — `nhl_records_goalie_season_stats` / `nhlRecordsGoalieSeasonStats`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `game_seven_games_played` | character | Game seven games played. |
| `game_seven_losses` | character | Game seven losses. |
| `game_seven_wins` | character | Game seven wins. |
| `game_type` | integer | Game type the row belongs to. |
| `games_played` | integer | Games played. |
| `games_started` | integer | Games started (goalies). |
| `goals_against` | integer | Goals against. |
| `goals_against_average` | double | Goals against average. |
| `last_name` | character | Player last name. |
| `losses` | integer | Losses. |
| `number_of_games_in_season` | integer | Number of games in the season. |
| `overtime_games_played` | integer | Overtime games played. |
| `overtime_goals_against` | integer | Overtime goals against. |
| `overtime_losses` | character | Total overtime losses. |
| `overtime_ties` | integer | Overtime ties. |
| `overtime_wins` | integer | Overtime wins. |
| `player_id` | integer | Unique player identifier. |
| `position_code` | character | Player position code. |
| `rookie_flag` | logical | Indicator of whether the player was a rookie. |
| `save_pctg` | double | Save percentage. |
| `saves` | integer | Saves made. |
| `season_id` | integer | Season identifier. |
| `shots_against` | integer | Shots faced. |
| `shutouts` | integer | Shutouts recorded. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `team_names` | character | Team names. |
| `ties` | integer | Total ties. |
| `time_on_ice` | integer | Time on ice in seconds. |
| `time_on_ice_min_sec` | character | Total time on ice (MM:SS). |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsGoalieSeasonStatsRow` (exported from the package root).

### Returns — `nhl_records_goalie_shutout_streak` / `nhlRecordsGoalieShutoutStreak`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `active_streak` | logical | Indicator of whether the streak is active. |
| `duration_min_sec` | character | Streak duration (MM:SS). |
| `duration_seconds` | integer | Streak duration in seconds. |
| `end_date` | character | Season end date. |
| `first_name` | character | Player first name. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `saves` | character | Saves made. |
| `season_id` | integer | Season identifier. |
| `start_date` | character | Season start date. |
| `team_abbrev` | character | Team abbreviation. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |

**Row type:** `NhlRecordsGoalieShutoutStreakRow` (exported from the package root).

### Returns — `nhl_records_goalie_undefeated_streak` / `nhlRecordsGoalieUndefeatedStreak`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `active_streak` | logical | Indicator of whether the streak is active. |
| `end_date` | character | Season end date. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `season_id` | integer | Season identifier. |
| `start_date` | character | Season start date. |
| `team_abbrev` | character | Team abbreviation. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `undefeated_streak` | integer | Number of consecutive games without a regulation loss (wins plus overtime or shootout losses) in the goalie's record streak. |

**Row type:** `NhlRecordsGoalieUndefeatedStreakRow` (exported from the package root).

### Returns — `nhl_records_goalie_win_plateaus` / `nhlRecordsGoalieWinPlateaus`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `first_name` | character | Player first name. |
| `forty_win_seasons` | integer | Number of seasons in which the goalie recorded 40 or more wins, a rare single-season achievement. |
| `franchise_id` | double | Unique franchise identifier. |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `seasons_played` | integer | Number of seasons played. |
| `team_abbrevs` | character | Team abbreviation(s). |
| `team_names` | character | Team names. |
| `thirty_win_seasons` | integer | Number of seasons in which the goalie recorded 30 or more wins. |
| `twenty_win_seasons` | integer | Number of seasons in which the goalie recorded 20 or more wins. |

**Row type:** `NhlRecordsGoalieWinPlateausRow` (exported from the package root).

### Returns — `nhl_records_goalie_win_streak` / `nhlRecordsGoalieWinStreak`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `active_player` | logical | Indicator of whether the player is active. |
| `active_streak` | logical | Indicator of whether the streak is active. |
| `end_date` | character | Season end date. |
| `first_name` | character | Player first name. |
| `franchise_id` | double | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `last_name` | character | Player last name. |
| `player_id` | integer | Unique player identifier. |
| `rookie` | logical | Whether the player is a rookie. |
| `season_id` | integer | Season identifier. |
| `start_date` | character | Season start date. |
| `team_abbrev` | character | Team abbreviation. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `win_streak` | integer | Number of consecutive wins recorded by the goalie in this streak. |

**Row type:** `NhlRecordsGoalieWinStreakRow` (exported from the package root).

### Returns — `nhl_records_hof_players` / `nhlRecordsHofPlayers`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `date_inducted` | character | Date the inductee entered the Hall of Fame. |
| `induction_cat_id` | integer | Induction category identifier. |
| `misc_full_name` | character | Full name of the inductee. |
| `office_id` | integer | Office/category identifier. |
| `official_id` | character | ESPN official id (echoed from arg). |
| `player_id` | integer | Unique player identifier. |

**Row type:** `NhlRecordsHofPlayersRow` (exported from the package root).

### Returns — `nhl_records_hof_players_by_office` / `nhlRecordsHofPlayersByOffice`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `date_inducted` | character | Date the inductee entered the Hall of Fame. |
| `induction_cat_id` | integer | Induction category identifier. |
| `misc_full_name` | character | Full name of the inductee. |
| `office_id` | integer | Office/category identifier. |
| `official_id` | character | ESPN official id (echoed from arg). |
| `player_id` | character | Unique player identifier. |

**Row type:** `NhlRecordsHofPlayersByOfficeRow` (exported from the package root).

### Returns — `nhl_records_home_team_record` / `nhlRecordsHomeTeamRecord`

| col_name | type | description |
|---|---|---|
| `id` | integer | Unique player identifier. |
| `franchise_id` | integer | Unique franchise identifier. |
| `game_type_id` | integer | Game type identifier (regular/playoffs). |
| `games_played` | integer | Games played. |
| `goals` | integer | Goals scored. |
| `goals_against` | integer | Goals against. |
| `goals_against_per_game` | double | Goals against per game. |
| `goals_per_game` | double | Average number of goals the team scored per home game over the recorded period. |
| `losses` | integer | Losses. |
| `overtime_losses` | double | Total overtime losses. |
| `point_pctg` | double | Points percentage. |
| `points` | integer | Total points (goals + assists). |
| `season_id` | integer | Season identifier. |
| `team_id` | integer | Unique team identifier. |
| `team_name` | character | Team name. |
| `ties` | double | Total ties. |
| `wins` | integer | Wins. |

**Row type:** `NhlRecordsHomeTeamRecordRow` (exported from the package root).

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/nhl_api_web.yaml + tools/codegen/endpoints/nhl_edge.yaml + tools/codegen/endpoints/nhl_stats_rest.yaml + tools/codegen/endpoints/nhl_records.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
