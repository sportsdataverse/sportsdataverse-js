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

The **126** ESPN endpoints route through just **28** parsers, so the returned columns are determined by the endpoint's *parser*, not the league — the same parser yields the same shape across every league. Each parser's column set is documented once below; the **Endpoints** line under each lists the short names that use it. Columns are snake_cased and nested objects flattened with `_` (e.g. `team.abbreviation` -> `team_abbreviation`). Generic / league-variable passthroughs show no fixed table.

## `parse_scoreboard`

One row per game on a Site v2 scoreboard (teams, score, status, odds).

**Endpoints (1):** `scoreboard`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `uid` | character |  |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character |  |
| `status_type_id` | character |  |
| `status_type_name` | character |  |
| `status_type_state` | character |  |
| `status_type_completed` | logical |  |
| `status_type_description` | character |  |
| `status_type_detail` | character |  |
| `status_type_short_detail` | character |  |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character |  |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical |  |
| `attendance` | integer |  |
| `venue_id` | character |  |
| `venue_full_name` | character |  |
| `venue_city` | character |  |
| `venue_state` | character |  |
| `venue_indoor` | logical |  |
| `broadcast` | character |  |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character |  |
| `home_name` | character |  |
| `home_abbreviation` | character |  |
| `home_display_name` | character |  |
| `home_location` | character |  |
| `home_color` | character |  |
| `home_alternate_color` | character |  |
| `home_logo` | character |  |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical |  |
| `home_rank` | character |  |
| `away_id` | character |  |
| `away_name` | character |  |
| `away_abbreviation` | character |  |
| `away_display_name` | character |  |
| `away_location` | character |  |
| `away_color` | character |  |
| `away_alternate_color` | character |  |
| `away_logo` | character |  |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical |  |
| `away_rank` | character |  |

## `parse_teams`

League team catalog (Site v2 / Core v2).

**Endpoints (2):** `teams_core`, `teams_site`

_Generic / dynamic passthrough — the column set varies by league and payload (e.g. Core v2 `$ref` items or a league-specific catalog). Call with `{ parsed: true }` to inspect the columns for a given league._

## `parse_standings`

One row per team-standings entry with its stat columns.

**Endpoints (2):** `standings`, `standings_core`

| col_name | type | description |
|---|---|---|
| `group_name` | character |  |
| `group_abbreviation` | character |  |
| `team_id` | character | ESPN team id |
| `team_name` | character |  |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `team_location` | character |  |
| `team_logo` | character |  |
| `avg_points_against` | number |  |
| `avg_points_for` | number |  |
| `clincher` | integer |  |
| `differential` | integer |  |
| `division_win_percent` | number |  |
| `games_behind` | integer |  |
| `league_win_percent` | number |  |
| `losses` | integer | Number of matches the team has lost. |
| `playoff_seed` | integer |  |
| `point_differential` | integer | Goal difference (for minus against). |
| `points` | integer | Competition points. |
| `points_against` | integer | Goals conceded. |
| `points_for` | integer | Goals (or runs) scored by the team. |
| `streak` | integer |  |
| `win_percent` | number |  |
| `wins` | integer | Number of matches the team has won. |
| `games_ahead` | integer |  |
| `overall` | character | Overall record summary as published by ESPN. |
| `home` | character |  |
| `road` | character |  |
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
| `id` | character |  |
| `uid` | character | ESPN universal id for the athlete. |
| `guid` | character |  |
| `alternate_ids_sdr` | character |  |
| `first_name` | character | Athlete's first (given) name. |
| `last_name` | character | Athlete's last (family) name. |
| `full_name` | character |  |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `short_name` | character | Athlete's abbreviated display name (e.g. 'L. James'). |
| `weight` | integer | Athlete weight in pounds. |
| `display_weight` | character | Athlete weight, formatted for display. |
| `height` | integer | Athlete height in inches. |
| `display_height` | character | Athlete height, formatted for display. |
| `age` | integer | Athlete age in years. |
| `date_of_birth` | character | Athlete date of birth (ISO 8601). |
| `debut_year` | integer |  |
| `links` | character |  |
| `birth_place_city` | character |  |
| `birth_place_country` | character |  |
| `college_id` | character |  |
| `college_guid` | character |  |
| `college_mascot` | character |  |
| `college_name` | character |  |
| `college_short_name` | character |  |
| `college_abbrev` | character |  |
| `college_logos` | character |  |
| `slug` | character | URL slug for the athlete. |
| `headshot_href` | character |  |
| `headshot_alt` | character |  |
| `jersey` | character | Athlete's jersey number as a string. |
| `position_id` | character |  |
| `position_name` | character | Full position name (e.g. 'Point Guard', 'Goalkeeper'). |
| `position_display_name` | character |  |
| `position_abbreviation` | character |  |
| `position_leaf` | logical |  |
| `injuries` | character |  |
| `teams` | character |  |
| `contracts` | character |  |
| `experience_years` | integer |  |
| `contract_bird_status` | integer |  |
| `contract_base_year_compensation_active` | logical |  |
| `contract_poison_pill_provision_active` | logical |  |
| `contract_incoming_trade_value` | integer |  |
| `contract_outgoing_trade_value` | integer |  |
| `contract_minimum_salary_exception` | logical |  |
| `contract_option_type` | integer |  |
| `contract_salary` | integer |  |
| `contract_salary_remaining` | integer |  |
| `contract_years_remaining` | integer |  |
| `contract_season_year` | integer |  |
| `contract_season_start_date` | character |  |
| `contract_season_end_date` | character |  |
| `contract_trade_kicker_active` | logical |  |
| `contract_trade_kicker_percentage` | integer |  |
| `contract_trade_kicker_value` | integer |  |
| `contract_trade_kicker_trade_value` | integer |  |
| `contract_trade_restriction` | logical |  |
| `contract_unsigned_foreign_pick` | logical |  |
| `contract_active` | logical |  |
| `status_id` | character |  |
| `status_name` | character |  |
| `status_type` | character |  |
| `status_abbreviation` | character |  |
| `citizenship` | character | Athlete citizenship. |
| `birth_place_state` | character |  |
| `hand_type` | character |  |
| `hand_abbreviation` | character |  |
| `hand_display_value` | character |  |

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

## `parse_rankings`

Site v2 poll rankings (cfb, mbb, wbb, mch, wch): one row per (poll, team), ranked teams and those receiving votes.

**Endpoints (1):** `rankings`

| col_name | type | description |
|---|---|---|
| `poll_id` | integer | ESPN poll id as a decimal string, e.g. '1' = AP Top 25, '2' = Coaches Poll, '20' = FCS Coaches Poll, '10624' = USCHO Men's Poll. |
| `poll_name` | character | Full poll name, e.g. 'AP Top 25', 'AFCA Coaches Poll', "USCHO Women's Poll". |
| `poll_short_name` | character | Short poll label, e.g. 'AP Poll'. |
| `poll_type` | character | ESPN poll type code, e.g. 'ap', 'usa' (coaches), 'fcs', 'USCHOMENSPOLL'. |
| `season` | integer | Season year of the poll (ESPN's ending year for a season that spans two calendar years, e.g. 2026 for 2025-26). |
| `season_type` | integer | Season phase of the poll: 1 = preseason, 2 = regular season, 3 = postseason. |
| `week` | integer | Poll week within season_type (the week ESPN's Core v2 rankings URL uses). |
| `week_display` | character | Poll week as ESPN labels it, e.g. 'Week 6'. |
| `poll_date` | character | Date the poll was released (ISO 8601, UTC). |
| `ranked` | logical | true for the poll's ranked teams; false for teams that only received votes. |
| `team_id` | character | ESPN team id as a decimal string (the dtype of scoreboard home_id / away_id). |
| `rank` | integer | Rank in this poll (1 = top). Null on vote-receiving rows. |
| `previous_rank` | integer | Position in the previous poll; 0 when the team was unranked then. |
| `points` | double | Poll points received (0 for polls ESPN ships without points, such as USCHO). |
| `first_place_votes` | integer | First-place votes received. Null when the poll does not report them. |
| `trend` | character | Movement since the previous poll as ESPN prints it, e.g. '+3', '-2', or '-' for no change. |
| `record_summary` | character | Team's win-loss record at the poll date, e.g. '5-0'. |
| `team_uid` | character | ESPN universal team id, e.g. 's:20~l:23~t:251'. |
| `team_location` | character | Team location (school name), e.g. 'Texas'. |
| `team_name` | character | Team mascot name, e.g. 'Longhorns'. |
| `team_nickname` | character | Short team name ESPN displays, e.g. 'Texas'. |
| `team_abbreviation` | character | Short team code ESPN displays, e.g. 'TEX'. |
| `team_color` | character | Team primary color as a hex string without '#'. Null for teams ESPN ships without one. |
| `team_logo` | character | URL of the team logo on ESPN's CDN. |
| `last_updated` | character | When ESPN last updated this poll entry (ISO 8601, UTC). |

## `parse_summary`

Site v2 game summary dispatcher — returns 21 sub-frames.

**Endpoints (1):** `summary`

`summary` is a dispatcher: `{ parsed: true }` returns an object of all 21 sub-frames keyed by section; `{ parsed: true, section: '<name>' }` returns just that one. See [Summary sub-frames](#summary-sub-frames) below.

## `parse_items`

Generic Core v2 paginated list — one row per item (often a `$ref` pointer).

**Endpoints (62):** `athlete_awards`, `athlete_career_stats`, `athlete_contracts`, `athlete_eventlog`, `athlete_notes`, `athlete_records`, `athlete_seasons`, `athlete_statisticslog`, `athletes_index`, `awards`, `calendar`, `draft`, `event_broadcasts`, `event_competitor_leaders`, `event_competitors`, `event_leaders`, `event_odds`, `event_officials`, `event_play_personnel`, `event_probabilities`, `event_propbets`, `event_scoringplays`, `events`, `franchises`, `leaders_core`, `league_notes`, `positions`, `recruiting_athletes`, `recruiting_rankings`, `recruiting_years`, `season_athletes`, `season_awards`, `season_draft_round_picks`, `season_freeagents`, `season_futures`, `season_group_children`, `season_group_teams`, `season_groups`, `season_powerindex`, `season_powerindex_leaders`, `season_qbr`, `season_qbr_week`, `season_recruits`, `season_teams`, `season_type_corrections`, `season_type_leaders`, `season_types`, `season_week_events`, `season_week_powerindex`, `season_week_rankings`, `season_weeks`, `seasons`, `statistics_league`, `talentpicks`, `team_depthcharts`, `team_history`, `team_leaders`, `team_record`, `team_transactions`, `tournaments`, `transactions`, `venues`

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
| `game_id` | character |  |
| `uid` | character |  |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character |  |
| `status_type_id` | character |  |
| `status_type_name` | character |  |
| `status_type_state` | character |  |
| `status_type_completed` | logical |  |
| `status_type_description` | character |  |
| `status_type_detail` | character |  |
| `status_type_short_detail` | character |  |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character |  |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical |  |
| `attendance` | integer |  |
| `venue_id` | character |  |
| `venue_full_name` | character |  |
| `venue_city` | character |  |
| `venue_state` | character |  |
| `venue_indoor` | logical |  |
| `broadcast` | character |  |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character |  |
| `home_name` | character |  |
| `home_abbreviation` | character |  |
| `home_display_name` | character |  |
| `home_location` | character |  |
| `home_color` | character |  |
| `home_alternate_color` | character |  |
| `home_logo` | character |  |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical |  |
| `home_rank` | character |  |
| `away_id` | character |  |
| `away_name` | character |  |
| `away_abbreviation` | character |  |
| `away_display_name` | character |  |
| `away_location` | character |  |
| `away_color` | character |  |
| `away_alternate_color` | character |  |
| `away_logo` | character |  |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical |  |
| `away_rank` | character |  |

## `parse_cdn_schedule`

CDN schedule page: every day's games, one row per game — the `parse_scoreboard` columns.

**Endpoints (1):** `cdn_schedule`

| col_name | type | description |
|---|---|---|
| `game_id` | character |  |
| `uid` | character |  |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character |  |
| `status_type_id` | character |  |
| `status_type_name` | character |  |
| `status_type_state` | character |  |
| `status_type_completed` | logical |  |
| `status_type_description` | character |  |
| `status_type_detail` | character |  |
| `status_type_short_detail` | character |  |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character |  |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical |  |
| `attendance` | integer |  |
| `venue_id` | character |  |
| `venue_full_name` | character |  |
| `venue_city` | character |  |
| `venue_state` | character |  |
| `venue_indoor` | logical |  |
| `broadcast` | character |  |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character |  |
| `home_name` | character |  |
| `home_abbreviation` | character |  |
| `home_display_name` | character |  |
| `home_location` | character |  |
| `home_color` | character |  |
| `home_alternate_color` | character |  |
| `home_logo` | character |  |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical |  |
| `home_rank` | character |  |
| `away_id` | character |  |
| `away_name` | character |  |
| `away_abbreviation` | character |  |
| `away_display_name` | character |  |
| `away_location` | character |  |
| `away_color` | character |  |
| `away_alternate_color` | character |  |
| `away_logo` | character |  |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical |  |
| `away_rank` | character |  |

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
| `team_location` | character |  |
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_short_name` | character | Athlete short name |
| `athlete_jersey` | character | Jersey number |
| `athlete_position` | character | Position abbreviation |
| `starter` | logical |  |
| `active` | logical |  |
| `did_not_play` | logical |  |
| `ejected` | logical |  |
| `reason` | character |  |
| `minutes` | character |  |
| `points` | character |  |
| `field_goals_made_field_goals_attempted` | character |  |
| `three_point_field_goals_made_three_point_field_goals_attempted` | character |  |
| `free_throws_made_free_throws_attempted` | character |  |
| `rebounds` | character |  |
| `assists` | character |  |
| `turnovers` | character |  |
| `steals` | character |  |
| `blocks` | character |  |
| `offensive_rebounds` | character |  |
| `defensive_rebounds` | character |  |
| `fouls` | character |  |
| `plus_minus` | character |  |

### `boxscore_team`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `home_away` | character | home or away |
| `display_order` | integer | Position of the bracket slot within its round, controlling top-to-bottom rendering. |
| `stat_name` | character | Statistic name |
| `stat_label` | character |  |
| `stat_display_value` | character | Formatted statistic value |
| `stat_value` | character | Numeric statistic value |

### `plays`

| col_name | type | description |
|---|---|---|
| `id` | character |  |
| `sequence_number` | character |  |
| `type_id` | character |  |
| `type_text` | character |  |
| `text` | character |  |
| `away_score` | integer |  |
| `home_score` | integer |  |
| `period_number` | integer |  |
| `period_display_value` | character |  |
| `clock_display_value` | character |  |
| `scoring_play` | logical |  |
| `score_value` | integer |  |
| `team_id` | character | ESPN team id |
| `participants` | character |  |
| `wallclock` | character |  |
| `shooting_play` | logical |  |
| `coordinate_x` | integer |  |
| `coordinate_y` | integer |  |
| `points_attempted` | integer |  |
| `short_description` | character |  |

### `winprobability`

| col_name | type | description |
|---|---|---|
| `home_win_percentage` | number |  |
| `tie_percentage` | integer |  |
| `play_id` | character |  |

### `leaders`

| col_name | type | description |
|---|---|---|
| `team_id` | character | ESPN team id |
| `team_abbreviation` | character | Team abbreviation |
| `category_name` | character | Statistic category name |
| `category_display_name` | character |  |
| `athlete_id` | character | ESPN athlete id |
| `athlete_display_name` | character | Athlete display name |
| `athlete_position` | character | Position abbreviation |
| `value` | integer |  |
| `display_value` | character |  |
| `main_stat_value` | character |  |
| `main_stat_label` | character |  |
| `summary` | character |  |

### `game_info`

| col_name | type | description |
|---|---|---|
| `attendance` | integer |  |
| `venue_id` | character |  |
| `venue_guid` | character |  |
| `venue_full_name` | character |  |
| `venue_short_name` | character |  |
| `venue_address_city` | character |  |
| `venue_address_state` | character |  |
| `venue_grass` | logical |  |

### `officials`

| col_name | type | description |
|---|---|---|
| `full_name` | character |  |
| `display_name` | character |  |
| `position_name` | character |  |
| `position_display_name` | character |  |
| `position_id` | character |  |
| `order` | integer |  |

### `header`

| col_name | type | description |
|---|---|---|
| `id` | character |  |
| `uid` | character |  |
| `season_year` | integer |  |
| `season_current` | logical |  |
| `season_type` | integer |  |
| `time_valid` | logical |  |
| `competitions` | character |  |
| `links` | character |  |
| `league_id` | character |  |
| `league_uid` | character |  |
| `league_name` | character |  |
| `league_abbreviation` | character |  |
| `league_slug` | character |  |
| `league_is_tournament` | logical |  |
| `league_links` | character |  |
| `league_logos` | character |  |

### `season_series`

| col_name | type | description |
|---|---|---|
| `type` | character |  |
| `title` | character |  |
| `description` | character |  |
| `summary` | character |  |
| `completed` | logical |  |
| `total_competitions` | integer |  |
| `series_label` | character |  |
| `series_score` | character |  |
| `short_summary` | character |  |
| `events` | character |  |

### `against_the_spread`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `standings`

| col_name | type | description |
|---|---|---|
| `group_header` | character |  |
| `conference_header` | character |  |
| `division_header` | character |  |
| `team_id` | character | ESPN team id |
| `team_uid` | character |  |
| `team_location` | character |  |
| `games_behind` | character |  |
| `losses` | character | Number of matches the team has lost. |
| `streak` | character |  |
| `win_percent` | character |  |
| `wins` | character | Number of matches the team has won. |

### `broadcasts`

_Zero rows in the reference capture (football-only or sparse-in-past-games); the shape populates on a live game of the relevant sport._

### `format`

| col_name | type | description |
|---|---|---|
| `regulation_periods` | integer |  |
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
| `id` | integer |  |
| `now_id` | character |  |
| `content_key` | character |  |
| `data_source_identifier` | character |  |
| `publishedkey` | character |  |
| `type` | character |  |
| `game_id` | character |  |
| `headline` | character |  |
| `description` | character |  |
| `link_text` | character |  |
| `categorized` | character |  |
| `originally_posted` | character |  |
| `last_modified` | character |  |
| `published` | character |  |
| `section` | character |  |
| `source` | character |  |
| `images` | character |  |
| `video` | character |  |
| `categories` | character |  |
| `keywords` | character |  |
| `story` | character |  |
| `premium` | logical |  |
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
| `team_uid` | character |  |
| `team_display_name` | character | Team display name |
| `team_abbreviation` | character | Team abbreviation |
| `team_links` | character |  |
| `team_logo` | character |  |
| `team_logos` | character |  |
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
| `team_short_display_name` | character |  |
| `team_logos` | character |  |
| `start_period_type` | character |  |
| `start_period_number` | integer |  |
| `start_clock_display_value` | character |  |
| `start_yard_line` | integer | Yard line at the start of the play. |
| `start_text` | character |  |
| `end_period_type` | character |  |
| `end_period_number` | integer |  |
| `end_clock_display_value` | character |  |
| `end_yard_line` | integer |  |
| `end_text` | character |  |
| `time_elapsed_display_value` | character |  |
| `yards` | integer | Net yards on the drive. |
| `is_score` | logical | Whether the drive ended in a score. |
| `offensive_plays` | integer | Number of offensive plays on the drive. |
| `result` | character | Drive result code. |
| `short_display_result` | character |  |
| `display_result` | character | Human-readable drive result. |
| `plays` | character | JSON list of play ids on the drive (unrolled in drive_plays). |

### `drive_plays`

| col_name | type | description |
|---|---|---|
| `drive_id` | character | Parent drive id (join key to the drives frame). |
| `drive_sequence` | integer | 1-based index of the play within its drive. |
| `id` | character | ESPN id. |
| `sequence_number` | character |  |
| `type_id` | character |  |
| `type_text` | character | Play type label. |
| `text` | character | Play description text. |
| `away_score` | integer | Away score after the play. |
| `home_score` | integer | Home score after the play. |
| `period_number` | integer | Quarter / period number. |
| `clock_display_value` | character | Game clock at the play (MM:SS). |
| `scoring_play` | logical | Whether the play resulted in a score. |
| `priority` | logical |  |
| `modified` | character |  |
| `wallclock` | character |  |
| `team_participants` | character |  |
| `is_penalty` | logical | Whether the play was a penalty. |
| `stat_yardage` | integer | Yards gained/lost on the play. |
| `start_down` | integer | Down at the start of the play. |
| `start_distance` | integer | Yards to go at the start of the play. |
| `start_yard_line` | integer | Yard line at the start of the play. |
| `start_yards_to_endzone` | integer |  |
| `start_team_id` | character |  |
| `end_down` | integer |  |
| `end_distance` | integer |  |
| `end_yard_line` | integer |  |
| `end_yards_to_endzone` | integer |  |
| `end_team_id` | character |  |
| `is_turnover` | logical | Whether the play was a turnover. |
| `type_abbreviation` | character |  |
| `start_down_distance_text` | character |  |
| `start_short_down_distance_text` | character |  |
| `start_possession_text` | character |  |
| `end_down_distance_text` | character |  |
| `end_short_down_distance_text` | character |  |
| `end_possession_text` | character |  |
| `scoring_type_name` | character |  |
| `scoring_type_display_name` | character |  |
| `scoring_type_abbreviation` | character |  |
| `point_after_attempt_id` | integer |  |
| `point_after_attempt_text` | character |  |
| `point_after_attempt_abbreviation` | character |  |
| `point_after_attempt_value` | integer |  |

### `scoring_plays`

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN id. |
| `type_id` | character |  |
| `type_text` | character | Play type label. |
| `type_abbreviation` | character |  |
| `text` | character | Play description text. |
| `away_score` | integer | Away score after the play. |
| `home_score` | integer | Home score after the play. |
| `period_number` | integer | Quarter / period number. |
| `clock_value` | integer |  |
| `clock_display_value` | character | Game clock at the play (MM:SS). |
| `team_id` | character | ESPN team id. |
| `team_uid` | character |  |
| `team_display_name` | character | Team display name. |
| `team_abbreviation` | character | Team abbreviation. |
| `team_links` | character |  |
| `team_logo` | character |  |
| `team_logos` | character |  |
| `scoring_type_name` | character |  |
| `scoring_type_display_name` | character |  |
| `scoring_type_abbreviation` | character |  |

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
