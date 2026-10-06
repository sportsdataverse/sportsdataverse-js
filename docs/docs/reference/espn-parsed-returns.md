---
title: ESPN parsed returns
sidebar_label: Parsed returns
sidebar_position: 1
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# ESPN parsed returns

Every ESPN endpoint returns the raw ESPN `Dict` by default. Pass `{ parsed: true }` to route the payload through the parser registered for that endpoint and get a tidy array of row objects instead (the JS analogue of a tidy DataFrame — mirrors `sdv-py`'s `return_parsed=True`):

```js
const raw  = await sdv.nba.espnNbaScoreboard({});               // raw Dict
const rows = await sdv.nba.espnNbaScoreboard({ parsed: true }); // tidy row[]
```

The **126** ESPN endpoints route through just **27** parsers, so the returned columns are determined by the endpoint's *parser*, not the league — the same parser yields the same shape across every league. Each parser's column set is documented once below; the **Endpoints** line under each lists the short names that use it. Columns are snake_cased and nested objects flattened with `_` (e.g. `team.abbreviation` -> `team_abbreviation`). Generic / league-variable passthroughs show no fixed table.

## `parse_scoreboard`

One row per game on a Site v2 scoreboard (teams, score, status, odds).

**Endpoints (1):** `scoreboard`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `uid` | character | ESPN UID string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season slug. |
| `status_type_id` | character | Unique identifier for status type. |
| `status_type_name` | character | Status type name. |
| `status_type_state` | character | Status state (pre/in/post). |
| `status_type_completed` | logical | Whether the game is complete. |
| `status_type_description` | character | Status type description. |
| `status_type_detail` | character | Status type detail. |
| `status_type_short_detail` | character | Status type short detail. |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character | Status display clock. |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical | Conference competition. |
| `attendance` | integer | Reported attendance. |
| `venue_id` | character | Unique venue identifier. |
| `venue_full_name` | character | Venue full name. |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state / region. |
| `venue_indoor` | logical | Whether the home venue is indoors. |
| `broadcast` | character | Broadcast information string. |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character | Unique identifier for home. |
| `home_name` | character | Home team display name. |
| `home_abbreviation` | character | Home team's abbreviation. |
| `home_display_name` | character | Home team display name. |
| `home_location` | character | Home team's location. |
| `home_color` | character | Home team primary color hex. |
| `home_alternate_color` | character | Color code (hex) for home alternate. |
| `home_logo` | character | Home team logo URL. |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical | Whether the home team won. |
| `home_rank` | character | Home team rank (if ranked). |
| `away_id` | character | Unique identifier for away. |
| `away_name` | character | Away team display name. |
| `away_abbreviation` | character | Away team's abbreviation. |
| `away_display_name` | character | Away team display name. |
| `away_location` | character | Away team's location. |
| `away_color` | character | Away team primary color hex. |
| `away_alternate_color` | character | Color code (hex) for away alternate. |
| `away_logo` | character | Away team logo URL. |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical | Whether the away team won. |
| `away_rank` | character | Away team rank (if ranked). |

## `parse_teams`

League team catalog (Site v2 / Core v2).

**Endpoints (2):** `teams_core`, `teams_site`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_standings`

One row per team-standings entry with its stat columns.

**Endpoints (2):** `standings`, `standings_core`

| col_name | type | description |
|---|---|---|
| `group_name` | character | Group name (conference / division). |
| `group_abbreviation` | character | Group abbreviation. |
| `team_id` | character | ESPN team id |
| `team_name` | character | Full team display name (e.g. 'Las Vegas Aces'). |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `team_location` | character | Team city or location string. |
| `team_logo` | character | Team logo image URL. |
| `avg_points_against` | number |  |
| `avg_points_for` | number |  |
| `clincher` | integer | Clincher. |
| `differential` | integer | Differential. |
| `division_win_percent` | number |  |
| `games_behind` | integer |  |
| `league_win_percent` | number |  |
| `losses` | integer | Number of matches the team has lost. |
| `playoff_seed` | integer | Current playoff seed. |
| `point_differential` | integer | Goal difference (for minus against). |
| `points` | integer | Competition points. |
| `points_against` | integer | Goals conceded. |
| `points_for` | integer | Goals (or runs) scored by the team. |
| `streak` | integer | Current streak (e.g. 'W3' for three-game win streak). |
| `win_percent` | number | Win percent. |
| `wins` | integer | Number of matches the team has won. |
| `games_ahead` | integer |  |
| `overall` | character | Overall record summary as published by ESPN. |
| `home` | character | Home. |
| `road` | character | Road. |
| `vs_div` | character |  |
| `vs_conf` | character |  |
| `last_ten_games` | character |  |

## `parse_groups`

Conferences / groups (divisions) for the league.

**Endpoints (1):** `conferences`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_athlete_overview`

Web v3 athlete overview (bio + recent splits).

**Endpoints (1):** `athlete_overview`

| col_name | type | description |
|---|---|---|
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_short_name` | character | Athlete short name |
| `athlete_position` | character | Position abbreviation |
| `athlete_jersey` | character | Jersey number |
| `athlete_team_id` | character | Athlete's team id |
| `athlete_team_abbreviation` | character | Athlete's team abbreviation |
| `split_name` | character | Split / season-segment name |
| `split_category` | character | Split category |

## `parse_athlete_stats`

Web v3 athlete statistics blocks.

**Endpoints (1):** `athlete_stats`

| col_name | type | description |
|---|---|---|
| `category` | character | Stat / leader category name |
| `split_name` | character | Split / season-segment name |
| `split_category` | character | Split category |
| `split_value` | character | Split value |

## `parse_athlete_gamelog`

Web v3 athlete game log (one row per game).

**Endpoints (1):** `athlete_gamelog`

| col_name | type | description |
|---|---|---|
| `season_type_id` | character | Season type id (regular/post) |
| `season_type_name` | character | Season type name |
| `category` | character | Stat / leader category name |
| `event_id` | character | ESPN event/game id |
| `event_date` | character | Event date (ISO 8601) |
| `home_away` | character | home or away |
| `score` | character | Final score for the athlete's team |
| `opponent_id` | character | Opponent ESPN team id |
| `opponent_abbreviation` | character | Opponent abbreviation |
| `opponent_display_name` | character | Opponent display name |
| `game_result` | character | Game result (W/L) |
| `game_processed` | logical | Whether the game has been processed |

## `parse_athlete_splits`

Web v3 athlete splits.

**Endpoints (1):** `athlete_splits`

| col_name | type | description |
|---|---|---|
| `category` | character | Stat / leader category name |
| `split_name` | character | Split / season-segment name |
| `split_abbreviation` | character | Split abbreviation |
| `split_category` | character | Split category |
| `split_value` | character | Split value |
| `split_description` | character | Split description |

## `parse_leaders`

League statistical leaders (one row per leader entry).

**Endpoints (1):** `leaders`

| col_name | type | description |
|---|---|---|
| `category` | character | Stat / leader category name |
| `rank` | integer | Rank within the category |
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_short_name` | character | Athlete short name |
| `athlete_jersey` | character | Jersey number |
| `athlete_position` | character | Position abbreviation |
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |

## `parse_coaches`

Coaches catalog.

**Endpoints (1):** `season_coaches`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_draft`

Draft rounds / picks.

**Endpoints (1):** `season_draft`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_event_competitor_roster`

Per-competitor roster on an event.

**Endpoints (1):** `event_competitor_roster`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_event_competitor_statistics`

Per-competitor statistics on an event.

**Endpoints (1):** `event_competitor_statistics`

| col_name | type | description |
|---|---|---|
| `split_name` | character | Split / season-segment name |
| `category_name` | character | Statistic category name |
| `stat_name` | character | Statistic name |
| `stat_abbreviation` | character | Statistic abbreviation |
| `stat_value` | number | Numeric statistic value |
| `stat_display_value` | character | Formatted statistic value |
| `stat_description` | character | Statistic description |

## `parse_event_competitor_linescores`

Per-competitor linescores on an event.

**Endpoints (1):** `event_competitor_linescores`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_event_plays`

Core v2 event plays.

**Endpoints (1):** `event_plays`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_team_schedule`

A team's Site v2 schedule (one row per event).

**Endpoints (1):** `team_schedule`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_team_roster`

A team's roster (one row per athlete).

**Endpoints (1):** `team_roster`

| col_name | type | description |
|---|---|---|
| `id` | character | ID of the player in the 'name' column. |
| `uid` | character | ESPN universal id for the athlete. |
| `guid` | character | Stable cross-league team GUID. |
| `alternate_ids_sdr` | character | Alternate ids sdr. |
| `first_name` | character | Athlete's first (given) name. |
| `last_name` | character | Athlete's last (family) name. |
| `full_name` | character | Player's full name. |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `short_name` | character | Athlete's abbreviated display name (e.g. 'L. James'). |
| `weight` | integer | Athlete weight in pounds. |
| `display_weight` | character | Athlete weight, formatted for display. |
| `height` | integer | Athlete height in inches. |
| `display_height` | character | Athlete height, formatted for display. |
| `age` | integer | Athlete age in years. |
| `date_of_birth` | character | Athlete date of birth (ISO 8601). |
| `debut_year` | integer | Year of professional debut. |
| `links` | character |  |
| `birth_place_city` | character | Birth place city. |
| `birth_place_country` | character | Birth place country. |
| `college_id` | character | Unique identifier for college. |
| `college_guid` | character | College guid. |
| `college_mascot` | character | College mascot. |
| `college_name` | character | College name. |
| `college_short_name` | character | College short name. |
| `college_abbrev` | character | College abbreviation. |
| `college_logos` | character | College logo URLs (pipe-delimited). |
| `slug` | character | URL slug for the athlete. |
| `headshot_href` | character | Headshot image URL. |
| `headshot_alt` | character | Alternative-text label for the headshot. |
| `jersey` | character | Athlete's jersey number as a string. |
| `position_id` | character | Unique position identifier. |
| `position_name` | character | Full position name (e.g. 'Point Guard', 'Goalkeeper'). |
| `position_display_name` | character | Position display name. |
| `position_abbreviation` | character | Position abbreviation ('G' / 'F' / 'C'). |
| `position_leaf` | logical | Position leaf. |
| `injuries` | character |  |
| `teams` | character | Nested list of member-team membership spans. |
| `contracts` | character |  |
| `experience_years` | integer | Experience years. |
| `contract_bird_status` | integer | Contract bird status. |
| `contract_base_year_compensation_active` | logical | Contract base year compensation active. |
| `contract_poison_pill_provision_active` | logical |  |
| `contract_incoming_trade_value` | integer | Contract incoming trade value. |
| `contract_outgoing_trade_value` | integer | Contract outgoing trade value. |
| `contract_minimum_salary_exception` | logical | Contract minimum salary exception. |
| `contract_option_type` | integer | Contract option type. |
| `contract_salary` | integer | Contract salary. |
| `contract_salary_remaining` | integer | Contract salary remaining. |
| `contract_years_remaining` | integer | Contract years remaining. |
| `contract_season_year` | integer |  |
| `contract_season_start_date` | character |  |
| `contract_season_end_date` | character |  |
| `contract_trade_kicker_active` | logical | Contract trade kicker active. |
| `contract_trade_kicker_percentage` | integer | Contract trade kicker percentage (0-1 decimal). |
| `contract_trade_kicker_value` | integer | Contract trade kicker value. |
| `contract_trade_kicker_trade_value` | integer | Contract trade kicker trade value. |
| `contract_trade_restriction` | logical | Contract trade restriction. |
| `contract_unsigned_foreign_pick` | logical | Contract unsigned foreign pick. |
| `contract_active` | logical | Contract active. |
| `status_id` | character | Status identifier. |
| `status_name` | character | Status label. |
| `status_type` | character | Status type. |
| `status_abbreviation` | character | Status abbreviation. |
| `citizenship` | character | Athlete citizenship. |
| `birth_place_state` | character | Birth place state. |
| `hand_type` | character | Hand type. |
| `hand_abbreviation` | character | Hand abbreviation. |
| `hand_display_value` | character | Hand display value. |

## `parse_news`

ESPN news articles (league / team / athlete scoped).

**Endpoints (3):** `athlete_news`, `news`, `team_news`

| col_name | type | description |
|---|---|---|
| `id` | integer | ESPN numeric identifier for the article. |
| `now_id` | character | ESPN 'now' feed id. |
| `content_key` | character | Internal content key. |
| `data_source_identifier` | character | Source-system identifier. |
| `type` | character | Article type (Story, Media, HeadlineNews, etc.). |
| `headline` | character | Article headline. |
| `description` | character | Article summary/description. |
| `last_modified` | character | Last-modified timestamp (ISO 8601). |
| `published` | character | Publish timestamp (ISO 8601). |
| `images` | character | Article images (list, stringified). |
| `categories` | character | Article categories (list, stringified). |
| `premium` | logical | Whether the article is premium/paywalled. |
| `links_web_href` | character | Web article URL. |
| `links_mobile_href` | character | Mobile article URL. |
| `links_api_self_href` | character | ESPN API canonical self-link for the article resource. |
| `links_app_sportscenter_href` | character | SportsCenter app deep link. |
| `byline` | character | Author byline string as published by ESPN. |

## `parse_injuries`

Injury report rows (league / team / athlete scoped).

**Endpoints (3):** `athlete_injuries`, `injuries`, `team_injuries`

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN numeric identifier for the athlete. |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `injuries` | character | Injury entries for the athlete (list of dicts, stringified): status, type, details, dates. |

## `parse_summary`

Site v2 game summary dispatcher — returns 21 sub-frames.

**Endpoints (1):** `summary`

`summary` is a dispatcher: `{ parsed: true }` returns an object of all 21 sub-frames keyed by section; `{ parsed: true, section: '<name>' }` returns just that one. See [Summary sub-frames](#summary-sub-frames) below.

## `parse_items`

Generic Core v2 paginated list — one row per item (often a `$ref` pointer).

**Endpoints (63):** `athlete_awards`, `athlete_career_stats`, `athlete_contracts`, `athlete_eventlog`, `athlete_notes`, `athlete_records`, `athlete_seasons`, `athlete_statisticslog`, `athletes_index`, `awards`, `calendar`, `draft`, `event_broadcasts`, `event_competitor_leaders`, `event_competitors`, `event_leaders`, `event_odds`, `event_officials`, `event_play_personnel`, `event_probabilities`, `event_propbets`, `event_scoringplays`, `events`, `franchises`, `leaders_core`, `league_notes`, `positions`, `rankings`, `recruiting_athletes`, `recruiting_rankings`, `recruiting_years`, `season_athletes`, `season_awards`, `season_draft_round_picks`, `season_freeagents`, `season_futures`, `season_group_children`, `season_group_teams`, `season_groups`, `season_powerindex`, `season_powerindex_leaders`, `season_qbr`, `season_qbr_week`, `season_recruits`, `season_teams`, `season_type_corrections`, `season_type_leaders`, `season_types`, `season_week_events`, `season_week_powerindex`, `season_week_rankings`, `season_weeks`, `seasons`, `statistics_league`, `talentpicks`, `team_depthcharts`, `team_history`, `team_leaders`, `team_record`, `team_transactions`, `tournaments`, `transactions`, `venues`

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

## `parse_single_entity`

Generic Core v2 single resource — one row for the entity.

**Endpoints (31):** `athlete_bio`, `athlete_core`, `athlete_hotzones`, `athlete_info`, `athlete_vs_athlete`, `award`, `coach`, `coach_record`, `coach_season`, `event`, `event_competition`, `event_competitor`, `event_competitor_record`, `event_official_detail`, `event_play`, `event_powerindex`, `event_predictor`, `event_situation`, `event_status`, `franchise`, `league_root`, `position`, `season_group`, `season_info`, `season_pointer`, `season_team`, `season_type`, `season_week`, `team`, `team_core`, `venue`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_cdn_game`

CDN play-by-play / box-score page: its `gamepackageJSON` (a Site v2 summary) through the `summary` dispatcher — an object of 21 sub-frames, or one `section` (see [Summary sub-frames](#summary-sub-frames)).

**Endpoints (2):** `cdn_boxscore`, `cdn_playbyplay`


## `parse_cdn_scoreboard`

CDN scoreboard page: its `sbData` (a Site v2 scoreboard), one row per game — the `parse_scoreboard` columns.

**Endpoints (1):** `cdn_scoreboard`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `uid` | character | ESPN UID string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season slug. |
| `status_type_id` | character | Unique identifier for status type. |
| `status_type_name` | character | Status type name. |
| `status_type_state` | character | Status state (pre/in/post). |
| `status_type_completed` | logical | Whether the game is complete. |
| `status_type_description` | character | Status type description. |
| `status_type_detail` | character | Status type detail. |
| `status_type_short_detail` | character | Status type short detail. |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character | Status display clock. |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical | Conference competition. |
| `attendance` | integer | Reported attendance. |
| `venue_id` | character | Unique venue identifier. |
| `venue_full_name` | character | Venue full name. |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state / region. |
| `venue_indoor` | logical | Whether the home venue is indoors. |
| `broadcast` | character | Broadcast information string. |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character | Unique identifier for home. |
| `home_name` | character | Home team display name. |
| `home_abbreviation` | character | Home team's abbreviation. |
| `home_display_name` | character | Home team display name. |
| `home_location` | character | Home team's location. |
| `home_color` | character | Home team primary color hex. |
| `home_alternate_color` | character | Color code (hex) for home alternate. |
| `home_logo` | character | Home team logo URL. |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical | Whether the home team won. |
| `home_rank` | character | Home team rank (if ranked). |
| `away_id` | character | Unique identifier for away. |
| `away_name` | character | Away team display name. |
| `away_abbreviation` | character | Away team's abbreviation. |
| `away_display_name` | character | Away team display name. |
| `away_location` | character | Away team's location. |
| `away_color` | character | Away team primary color hex. |
| `away_alternate_color` | character | Color code (hex) for away alternate. |
| `away_logo` | character | Away team logo URL. |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical | Whether the away team won. |
| `away_rank` | character | Away team rank (if ranked). |

## `parse_cdn_schedule`

CDN schedule page: every day's games, one row per game — the `parse_scoreboard` columns.

**Endpoints (1):** `cdn_schedule`

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique game identifier. |
| `uid` | character | ESPN UID string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season slug. |
| `status_type_id` | character | Unique identifier for status type. |
| `status_type_name` | character | Status type name. |
| `status_type_state` | character | Status state (pre/in/post). |
| `status_type_completed` | logical | Whether the game is complete. |
| `status_type_description` | character | Status type description. |
| `status_type_detail` | character | Status type detail. |
| `status_type_short_detail` | character | Status type short detail. |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character | Status display clock. |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical | Conference competition. |
| `attendance` | integer | Reported attendance. |
| `venue_id` | character | Unique venue identifier. |
| `venue_full_name` | character | Venue full name. |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state / region. |
| `venue_indoor` | logical | Whether the home venue is indoors. |
| `broadcast` | character | Broadcast information string. |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character | Unique identifier for home. |
| `home_name` | character | Home team display name. |
| `home_abbreviation` | character | Home team's abbreviation. |
| `home_display_name` | character | Home team display name. |
| `home_location` | character | Home team's location. |
| `home_color` | character | Home team primary color hex. |
| `home_alternate_color` | character | Color code (hex) for home alternate. |
| `home_logo` | character | Home team logo URL. |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical | Whether the home team won. |
| `home_rank` | character | Home team rank (if ranked). |
| `away_id` | character | Unique identifier for away. |
| `away_name` | character | Away team display name. |
| `away_abbreviation` | character | Away team's abbreviation. |
| `away_display_name` | character | Away team display name. |
| `away_location` | character | Away team's location. |
| `away_color` | character | Away team primary color hex. |
| `away_alternate_color` | character | Color code (hex) for away alternate. |
| `away_logo` | character | Away team logo URL. |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical | Whether the away team won. |
| `away_rank` | character | Away team rank (if ranked). |

## `parse_cdn_rankings`

CDN poll rankings page (cfb): one row per (poll, team), ranked teams and those receiving votes.

**Endpoints (1):** `cdn_rankings`

| col_name | type | description |
|---|---|---|
| `poll_id` | integer | Poll id (1 = AP Top 25). |
| `poll_name` | character | Poll name (e.g. AP Top 25, AFCA Coaches Poll). |
| `poll_short_name` | character | Short poll name. |
| `ranked` | logical | true for a ranked team, false for a team receiving votes. |
| `team_id` | character | ESPN team id, read from team_url (null when the team is not linked). |
| `team_display_name` | character | Team display name. |
| `trend` | character | Movement since the previous poll. |
| `formatted_record` | character | Win-loss record (e.g. 4-0). |
| `first_place_votes` | integer | First-place votes. |
| `rank` | integer | Poll rank (null for teams receiving votes). |
| `previous_rank` | integer | Rank in the previous poll. |
| `team_abbreviation` | character | Team abbreviation. |
| `team_url` | character | espn.com team page URL. |
| `team_logo` | character | Team logo URL. |
| `points` | integer | Poll points. |

## Summary sub-frames

The `summary` dispatcher (`parse_summary`) yields these 21 sub-frames. Football (NFL / CFB) games additionally populate `drives` / `drive_plays` / `scoring_plays`; other sports return those as zero-row frames. Betting sections (`against_the_spread` / `pickcenter` / `odds`) are sparse in past-game captures.

### `boxscore_player`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `team_location` | character | Team city or location string. |
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_short_name` | character | Athlete short name |
| `athlete_jersey` | character | Jersey number |
| `athlete_position` | character | Position abbreviation |
| `starter` | logical | TRUE if the player was in the starting lineup; FALSE otherwise. |
| `active` | logical | TRUE if the row represents an active record (player / team / season). |
| `did_not_play` | logical | TRUE if the player did not appear in the game. |
| `ejected` | logical | TRUE if the player was ejected from the game. |
| `reason` | character | Reason. |
| `minutes` | character | Minutes played, formatted MM:SS (V3 PT-duration parsed) or decimal minutes (V2). |
| `points` | character | Points scored. |
| `field_goals_made_field_goals_attempted` | character | Field Goals Made-Attempted. |
| `three_point_field_goals_made_three_point_field_goals_attempted` | character | 3-Point Field Goals Made-Attempted. |
| `free_throws_made_free_throws_attempted` | character | Free Throws Made-Attempted. |
| `rebounds` | character | Total rebounds. |
| `assists` | character | Total assists. |
| `turnovers` | character | Total turnovers. |
| `steals` | character | Total steals. |
| `blocks` | character | Total blocks. |
| `offensive_rebounds` | character | Offensive rebounds. |
| `defensive_rebounds` | character | Defensive rebounds. |
| `fouls` | character | Personal fouls. |
| `plus_minus` | character | Plus/minus point differential while on court. |

### `boxscore_team`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `home_away` | character | home or away |
| `display_order` | integer | Position of the bracket slot within its round, controlling top-to-bottom rendering. |
| `stat_name` | character | Statistic name |
| `stat_label` | character | Human-readable label of the statistic (e.g. 'At bats'). |
| `stat_display_value` | character | Formatted statistic value |
| `stat_value` | character | Numeric statistic value |

### `plays`

| col_name | type | description |
|---|---|---|
| `id` | character | ID of the player in the 'name' column. |
| `sequence_number` | character | Sequence number representing a shot-possession (V3 PBP). |
| `type_id` | character | Type identifier (numeric). |
| `type_text` | character | Display text for the type field. |
| `text` | character | Text description of the play / record. |
| `away_score` | integer | Away team score at the time of the play. |
| `home_score` | integer | Home team score at the time of the play. |
| `period_number` | integer | Numeric period (1-4 for quarters; 5+ for OT). |
| `period_display_value` | character | Period display label (e.g. '1st Quarter', 'OT'). |
| `clock_display_value` | character | Game clock display string (e.g. '8:32'). |
| `scoring_play` | logical | TRUE if the play resulted in points scored. |
| `score_value` | integer | Point value of the play (2 / 3 / 1). |
| `team_id` | character | ESPN team id |
| `participants` | character | List of athlete participants in the play. |
| `wallclock` | character | Wallclock. |
| `shooting_play` | logical | TRUE if the play was a shooting attempt. |
| `coordinate_x` | integer | X coordinate on the court (half-court layout). |
| `coordinate_y` | integer | Y coordinate on the court (half-court layout). |
| `points_attempted` | integer |  |
| `short_description` | character |  |

### `winprobability`

| col_name | type | description |
|---|---|---|
| `home_win_percentage` | number | Home win percentage (0-1 decimal). |
| `tie_percentage` | integer | Tie percentage (0-1 decimal). |
| `play_id` | character | Numeric play id that when used with game_id and drive provides the unique identifier for a single play. |

### `leaders`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `category_name` | character | Statistic category name |
| `category_display_name` | character | Category display name (e.g. "Goals"). |
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_position` | character | Position abbreviation |
| `value` | integer | Numeric or string value field. |
| `display_value` | character | Display-formatted value. |
| `main_stat_value` | character |  |
| `main_stat_label` | character |  |
| `summary` | character | Record summary string (e.g. "25-15-10"). |

### `game_info`

| col_name | type | description |
|---|---|---|
| `attendance` | integer | Reported attendance. |
| `venue_id` | character | Unique venue identifier. |
| `venue_guid` | character |  |
| `venue_full_name` | character | Venue full name. |
| `venue_short_name` | character |  |
| `venue_address_city` | character | Venue address city. |
| `venue_address_state` | character | Venue address state / region. |
| `venue_grass` | logical | Whether the home venue has a grass surface. |

### `officials`

| col_name | type | description |
|---|---|---|
| `full_name` | character | Player's full name. |
| `display_name` | character | Display name. |
| `position_name` | character | Listed roster position ('Guard', 'Forward', 'Center'). |
| `position_display_name` | character | Position display name. |
| `position_id` | character | Unique position identifier. |
| `order` | integer | Display order within the result set. |

### `header`

| col_name | type | description |
|---|---|---|
| `id` | character | ID of the player in the 'name' column. |
| `uid` | character | ESPN UID string. |
| `season_year` | integer | Season year string ('YYYY-YY' format). |
| `season_current` | logical |  |
| `season_type` | integer | Season type (1=pre-season, 2=regular season, 3=postseason, 4=off-season for ESPN; or string label for WNBA Stats). |
| `time_valid` | logical | Whether the start time is confirmed. |
| `competitions` | character |  |
| `links` | character |  |
| `league_id` | character | League identifier ('10' = WNBA). |
| `league_uid` | character |  |
| `league_name` | character | League name. |
| `league_abbreviation` | character | League abbreviation (e.g. 'AL'). |
| `league_slug` | character |  |
| `league_is_tournament` | logical |  |
| `league_links` | character |  |
| `league_logos` | character |  |

### `season_series`

| col_name | type | description |
|---|---|---|
| `type` | character | Record type / category. |
| `title` | character | Specific role title for the assignment. |
| `description` | character | Long-form description text. |
| `summary` | character | Record summary string (e.g. "25-15-10"). |
| `completed` | logical | `TRUE` if the game is complete. |
| `total_competitions` | integer |  |
| `series_label` | character |  |
| `series_score` | character |  |
| `short_summary` | character |  |
| `events` | character | Nested list of non-game events. |

### `against_the_spread`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `standings`

| col_name | type | description |
|---|---|---|
| `group_header` | character |  |
| `conference_header` | character |  |
| `division_header` | character |  |
| `team_id` | character | ESPN team id |
| `team_uid` | character | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_location` | character | Team city or location string. |
| `games_behind` | character |  |
| `losses` | character | Number of matches the team has lost. |
| `streak` | character | Current streak (e.g. 'W3' for three-game win streak). |
| `win_percent` | character | Win percent. |
| `wins` | character | Number of matches the team has won. |

### `broadcasts`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `format`

| col_name | type | description |
|---|---|---|
| `regulation_periods` | integer | Regulation periods. |
| `regulation_display_name` | character |  |
| `regulation_slug` | character |  |
| `regulation_clock` | integer |  |
| `overtime_display_name` | character |  |
| `overtime_slug` | character |  |
| `overtime_clock` | integer |  |

### `pickcenter`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `odds`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `article`

| col_name | type | description |
|---|---|---|
| `id` | integer | ID of the player in the 'name' column. |
| `now_id` | character | ESPN Now identifier. |
| `content_key` | character | Content management key. |
| `data_source_identifier` | character |  |
| `publishedkey` | character |  |
| `type` | character | Record type / category. |
| `game_id` | character | Unique game identifier. |
| `headline` | character | News headline. |
| `description` | character | Long-form description text. |
| `link_text` | character |  |
| `categorized` | character |  |
| `originally_posted` | character |  |
| `last_modified` | character | ISO timestamp the probability row was last modified. |
| `published` | character | Publication timestamp (ISO 8601). |
| `section` | character |  |
| `source` | character | News source. |
| `images` | character |  |
| `video` | character | Associated video content. |
| `categories` | character |  |
| `keywords` | character |  |
| `story` | character |  |
| `premium` | logical | Whether the article is premium content. |
| `is_live_blog` | logical |  |
| `links_web_href` | character |  |
| `links_mobile_href` | character |  |
| `links_api_self_href` | character |  |
| `links_app_sportscenter_href` | character |  |
| `allow_comments` | logical |  |
| `allow_search` | logical |  |
| `allow_content_reactions` | logical |  |

### `injuries`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_uid` | character | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_display_name` | character | Team display name |
| `team_abbreviation` | character | Team abbreviation |
| `team_links` | character |  |
| `team_logo` | character | Team logo image URL. |
| `team_logos` | character | Team logo metadata. |
| `injuries` | character | Injury entries for the athlete (list of dicts, stringified): status, type, details, dates. |

### `news`

| col_name | type | description |
|---|---|---|
| `id` | integer | ESPN numeric identifier for the article. |
| `now_id` | character | ESPN 'now' feed id. |
| `content_key` | character | Internal content key. |
| `data_source_identifier` | character | Source-system identifier. |
| `type` | character | Article type (Story, Media, HeadlineNews, etc.). |
| `headline` | character | Article headline. |
| `description` | character | Article summary/description. |
| `last_modified` | character | Last-modified timestamp (ISO 8601). |
| `published` | character | Publish timestamp (ISO 8601). |
| `images` | character | Article images (list, stringified). |
| `categories` | character | Article categories (list, stringified). |
| `premium` | logical | Whether the article is premium/paywalled. |
| `links_web_href` | character | Web article URL. |
| `links_mobile_href` | character | Mobile article URL. |
| `links_api_self_href` | character | ESPN API canonical self-link for the article resource. |
| `links_app_sportscenter_href` | character | SportsCenter app deep link. |
| `byline` | character | Author byline string as published by ESPN. |

### `drives`

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN id. |
| `description` | character | Human-readable description. |
| `team_id` | character | ESPN team id. |
| `team_name` | character | Team name. |
| `team_abbreviation` | character | Team abbreviation. |
| `team_display_name` | character | Team display name. |
| `team_short_display_name` | character | Short team display name (e.g. 'Aces'). |
| `team_logos` | character | Team logo metadata. |
| `start_period_type` | character | Period type at the start of the drive (e.g. `quarter`). |
| `start_period_number` | integer |  |
| `start_clock_display_value` | character |  |
| `start_yard_line` | integer | Yard line at the start of the play. |
| `start_text` | character | Field-position text at the start of the drive. |
| `end_period_type` | character | Period type at the end of the drive (e.g. `quarter`). |
| `end_period_number` | integer |  |
| `end_clock_display_value` | character |  |
| `end_yard_line` | integer | String indicating the yardline at the end of the given play consisting of team half and yard line number. |
| `end_text` | character | Field-position text at the end of the drive. |
| `time_elapsed_display_value` | character |  |
| `yards` | integer | Net yards on the drive. |
| `is_score` | logical | Whether the drive ended in a score. |
| `offensive_plays` | integer | Number of offensive plays on the drive. |
| `result` | character | Drive result code. |
| `short_display_result` | character | Short drive-result label. |
| `display_result` | character | Human-readable drive result. |
| `plays` | character | JSON list of play ids on the drive (unrolled in drive_plays). |

### `drive_plays`

| col_name | type | description |
|---|---|---|
| `drive_id` | character | Parent drive id (join key to the drives frame). |
| `drive_sequence` | integer | 1-based index of the play within its drive. |
| `id` | character | ESPN id. |
| `sequence_number` | character | Sequence number representing a shot-possession (V3 PBP). |
| `type_id` | character | Type identifier (numeric). |
| `type_text` | character | Play type label. |
| `text` | character | Play description text. |
| `away_score` | integer | Away score after the play. |
| `home_score` | integer | Home score after the play. |
| `period_number` | integer | Quarter / period number. |
| `clock_display_value` | character | Game clock at the play (MM:SS). |
| `scoring_play` | logical | Whether the play resulted in a score. |
| `priority` | logical | `TRUE` if ESPN flags the play as a priority highlight. |
| `modified` | character | ISO timestamp the play record was last modified. |
| `wallclock` | character | Wallclock. |
| `team_participants` | character |  |
| `is_penalty` | logical | Whether the play was a penalty. |
| `stat_yardage` | integer | Yards gained/lost on the play. |
| `start_down` | integer | Down at the start of the play. |
| `start_distance` | integer | Yards to go at the start of the play. |
| `start_yard_line` | integer | Yard line at the start of the play. |
| `start_yards_to_endzone` | integer | Yards to the end zone at the start of the play. |
| `start_team_id` | character | ESPN team id in possession at the start of the play. |
| `end_down` | integer | Down at the end of the play. |
| `end_distance` | integer | Yards to go at the end of the play. |
| `end_yard_line` | integer | String indicating the yardline at the end of the given play consisting of team half and yard line number. |
| `end_yards_to_endzone` | integer | Yards to the end zone at the end of the play. |
| `end_team_id` | character | ESPN team id in possession at the end of the play. |
| `is_turnover` | logical | Whether the play was a turnover. |
| `type_abbreviation` | character | Play type abbreviation. |
| `start_down_distance_text` | character | Down-and-distance text at the start of the play. |
| `start_short_down_distance_text` | character | Short down-and-distance text at the start of the play. |
| `start_possession_text` | character | Field-position text at the start of the play. |
| `end_down_distance_text` | character | Down-and-distance text at the end of the play. |
| `end_short_down_distance_text` | character | Short down-and-distance text at the end of the play. |
| `end_possession_text` | character | Field-position text at the end of the play. |
| `scoring_type_name` | character | Scoring-type key on a scoring play (e.g. `touchdown`). |
| `scoring_type_display_name` | character | Human-readable scoring-type name. |
| `scoring_type_abbreviation` | character | Scoring-type abbreviation (e.g. `TD`, `FG`). |
| `point_after_attempt_id` | integer | Point-after-attempt id on a scoring play. |
| `point_after_attempt_text` | character | Point-after-attempt text (e.g. `Extra Point Good`). |
| `point_after_attempt_abbreviation` | character | Point-after-attempt abbreviation. |
| `point_after_attempt_value` | integer | Points added by the point-after attempt. |

### `scoring_plays`

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN id. |
| `type_id` | character | Type identifier (numeric). |
| `type_text` | character | Play type label. |
| `type_abbreviation` | character | Play type abbreviation. |
| `text` | character | Play description text. |
| `away_score` | integer | Away score after the play. |
| `home_score` | integer | Home score after the play. |
| `period_number` | integer | Quarter / period number. |
| `clock_value` | integer | Clock value in seconds. |
| `clock_display_value` | character | Game clock at the play (MM:SS). |
| `team_id` | character | ESPN team id. |
| `team_uid` | character | ESPN universal team identifier (UID format 's:40~l:...~t:...'). |
| `team_display_name` | character | Team display name. |
| `team_abbreviation` | character | Team abbreviation. |
| `team_links` | character |  |
| `team_logo` | character | Team logo image URL. |
| `team_logos` | character | Team logo metadata. |
| `scoring_type_name` | character | Scoring-type key on a scoring play (e.g. `touchdown`). |
| `scoring_type_display_name` | character | Human-readable scoring-type name. |
| `scoring_type_abbreviation` | character | Scoring-type abbreviation (e.g. `TD`, `FG`). |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
