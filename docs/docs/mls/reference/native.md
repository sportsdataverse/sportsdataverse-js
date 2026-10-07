---
title: Native API
sidebar_label: Native API
sidebar_position: 6
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `sdv.mls` — Native (non-ESPN) APIs

Beyond the ESPN surface, `sdv.mls` also wraps the league's own live APIs. Same `{ parsed: true }` contract; each method is exposed under both snake_case and camelCase on `sdv.mls`.

## Native API — MLS web API

Flat (non-ESPN) wrappers for the official mlssoccer.com data APIs. Host: `https://stats-api.mlssoccer.com`. Each method is exposed under BOTH its snake_case name `mls_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.mls`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. Endpoints marked **multi-table** parse to several frames in sdv-py; with `parsed: true` they return the default shown in the Parser column (one sub-frame, or every table as a dict), and `section: "<name>"` selects any other (an unknown name throws, listing the valid ones).

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `mls_club` / `mlsClub` | `https://stats-api.mlssoccer.com/clubs/{club_id}` | `club_id`\* | — | `parse_mls_entity` | — |
| `mls_competition_seasons` / `mlsCompetitionSeasons` | `https://stats-api.mlssoccer.com/competitions/{competition_id}/seasons` | `competition_id`\* | — | `parse_mls_api` | — |
| `mls_competitions` / `mlsCompetitions` | `https://stats-api.mlssoccer.com/competitions` | — | — | `parse_mls_api` | — |
| `mls_content_season` / `mlsContentSeason` | `https://dapi.mlssoccer.com/v2/content/en-us/seasons/{slug}` | `slug`\* | — | `parse_mls_entity` | — |
| `mls_content_seasons` / `mlsContentSeasons` | `https://dapi.mlssoccer.com/v2/content/en-us/seasons` | — | `competition_sportec_id` → `fields.competitionSportecId`, `sportec_id` → `fields.sportecId` | `parse_mls_api` | — |
| `mls_match` / `mlsMatch` | `https://stats-api.mlssoccer.com/matches/{match_id}` | `match_id`\* | — | `parse_mls_match` — multi-table: `section` = `match_information` (default), `environment`, `teams`, `players`, `staff`, `referees`, `last_matches` | — |
| `mls_season_matches` / `mlsSeasonMatches` | `https://stats-api.mlssoccer.com/matches/seasons/{season_id}` | `season_id`\* | `match_date_gte` → `match_date[gte]`, `match_date_lte` → `match_date[lte]`, `competition_id`, `per_page`, `sort`, `series_name` | `parse_mls_api` | — |
| `mls_sportapi_club_players` / `mlsSportapiClubPlayers` | `https://sportapi.mlssoccer.com/api/players/byClub/{club_id}` | `club_id`\* | `culture` | `parse_mls_api` | — |
| `mls_sportapi_clubs_by_sportec_ids` / `mlsSportapiClubsBySportecIds` | `https://sportapi.mlssoccer.com/api/clubs/bySportecIds/{ids}` | `ids`\* | — | `parse_mls_api` | — |
| `mls_sportapi_match` / `mlsSportapiMatch` | `https://sportapi.mlssoccer.com/api/matches/{match_id}` | `match_id`\* | — | `parse_mls_entity` | — |
| `mls_sportapi_matches_by_sportec_ids` / `mlsSportapiMatchesBySportecIds` | `https://sportapi.mlssoccer.com/api/matches/bySportecIds/{ids}` | `ids`\* | — | `parse_mls_api` | — |
| `mls_standings` / `mlsStandings` | `https://stats-api.mlssoccer.com/competitions/{competition_id}/seasons/{season_id}/standings` | `competition_id`\*, `season_id`\* | `category`, `standings_type` → `type`, `is_live` | `parse_mls_standings` — multi-table: `section` = `tables`, `entries` (default) | — |

### Returns — `mls_club` / `mlsClub`

| col_name | type | description |
|---|---|---|
| `club_id` | character | Sportec club id |
| `club_name` | character | Full club name |
| `three_letter_code` | character | 3-letter code |
| `short_name` | character | Short name |
| `club_short_name` | character | Alternate short name |
| `club_three_letter_code` | character | Alternate 3-letter code |
| `city` | character | Home city |
| `country` | character | Country |
| `long_name` | character | Long/legal club name |
| `founded` | character | Year founded |
| `stadium_id` | character | Stadium id |
| `stadium_name` | character | Stadium name |
| `club_color_one_club_color` | character | Primary club colour: club colour name. |
| `club_color_one_club_color_rgb` | character | Primary club colour: club colour as an RGB hex string. |
| `club_color_two_club_color` | character | Secondary club colour: club colour name. |
| `club_color_two_club_color_rgb` | character | Secondary club colour: club colour as an RGB hex string. |
| `club_color_three_club_color` | character | Tertiary club colour: club colour name. |
| `club_color_three_club_color_rgb` | character | Tertiary club colour: club colour as an RGB hex string. |
| `shirt_one_shirt_main_color` | character | First-choice kit: main shirt colour name. |
| `shirt_one_shirt_main_color_rgb` | character | First-choice kit: main shirt colour as an RGB hex string. |
| `shirt_one_shirt_secondary_color` | character | First-choice kit: secondary shirt colour name. |
| `shirt_one_shirt_secondary_color_rgb` | character | First-choice kit: secondary shirt colour as an RGB hex string. |
| `shirt_one_shirt_number_color` | character | First-choice kit: shirt-number colour name. |
| `shirt_one_shirt_number_color_rgb` | character | First-choice kit: shirt-number colour as an RGB hex string. |
| `shirt_two_shirt_main_color` | character | Second-choice kit: main shirt colour name. |
| `shirt_two_shirt_main_color_rgb` | character | Second-choice kit: main shirt colour as an RGB hex string. |
| `shirt_two_shirt_secondary_color` | character | Second-choice kit: secondary shirt colour name. |
| `shirt_two_shirt_secondary_color_rgb` | character | Second-choice kit: secondary shirt colour as an RGB hex string. |
| `shirt_two_shirt_number_color` | character | Second-choice kit: shirt-number colour name. |
| `shirt_two_shirt_number_color_rgb` | character | Second-choice kit: shirt-number colour as an RGB hex string. |
| `shirt_three_shirt_main_color` | character | Third-choice kit: main shirt colour name. |
| `shirt_three_shirt_main_color_rgb` | character | Third-choice kit: main shirt colour as an RGB hex string. |
| `shirt_three_shirt_secondary_color` | character | Third-choice kit: secondary shirt colour name. |
| `shirt_three_shirt_secondary_color_rgb` | character | Third-choice kit: secondary shirt colour as an RGB hex string. |
| `shirt_three_shirt_number_color` | character | Third-choice kit: shirt-number colour name. |
| `shirt_three_shirt_number_color_rgb` | character | Third-choice kit: shirt-number colour as an RGB hex string. |

**Row type:** `MlsApiClubRow` (exported from the package root).

### Returns — `mls_competition_seasons` / `mlsCompetitionSeasons`

| col_name | type | description |
|---|---|---|
| `season_id` | character | Sportec season id |
| `season` | integer | Season year |

**Row type:** `MlsApiCompetitionSeasonsRow` (exported from the package root).

### Returns — `mls_competitions` / `mlsCompetitions`

| col_name | type | description |
|---|---|---|
| `competition_id` | character | Sportec competition id |
| `competition_name` | character | Competition display name |
| `competition_name_french` | character | French competition name |
| `country` | character | Country |
| `competition_type` | character | `League` or `Tournament` |

**Row type:** `MlsApiCompetitionsRow` (exported from the package root).

### Returns — `mls_content_season` / `mlsContentSeason`

| col_name | type | description |
|---|---|---|
| `type` | character | Type discriminator for the record. |
| `_translation_id` | character | Contentful translation-group id shared by every locale of this entry. |
| `_entity_id` | character | Contentful entity id for the content entry. |
| `self_url` | character | Canonical API URL of this content entry. |
| `slug` | character | URL slug. |
| `title` | character | Display title. |
| `tags` | character | Content tags, JSON-encoded. |
| `relations` | character | Related content entries, JSON-encoded. |
| `created_by` | character | User or service that created the content entry. |
| `last_updated_by` | character | User or service that last updated the content entry. |
| `last_updated_date` | character | Timestamp of the last content update (ISO 8601). |
| `content_date` | character | Editorial content date (ISO 8601). |
| `featured` | integer | Whether the entry is flagged as featured (1 = featured). |
| `entity_code` | character | Contentful entity-type code. |
| `_list_availability` | integer | Contentful flag controlling whether the entry appears in listings. |
| `references_list_of_clubs_clinched_x` | character | Contentful reference list: reference list of clubs that have clinched, list variant x. |
| `references_list_of_clubs_clinched_e` | character | Contentful reference list: reference list of clubs that have clinched, list variant e. |
| `references_list_of_clubs_clinched_s` | character | Contentful reference list: reference list of clubs that have clinched, list variant s. |
| `references_list_of_clubs_clinched_y` | character | Contentful reference list: reference list of clubs that have clinched, list variant y. |
| `fields_opta_id` | character | Season content field: parallel Opta integer id for the entity. |
| `fields_sportec_id` | character | Season content field: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `fields_name` | character | Season content field: display name. |
| `fields_competition_opta_id` | character | Season content field: parallel Opta integer id of the competition. |
| `fields_competition_sportec_id` | character | Season content field: Sportec opaque id of the competition (Utf8 join key). |
| `fields_standings_legend` | character | Season content field: prose legend explaining the standings qualification bands. |
| `fields_top_clubs` | integer | Season content field: number of clubs qualifying from the top of the table. |
| `fields_top_clubs_legend` | character | Season content field: prose legend explaining the top-clubs cut line. |
| `fields_home_advantage` | integer | Season content field: points of home advantage applied by the playoff seeding rules. |
| `fields_home_advantage_legend` | character | Season content field: prose legend explaining the home-advantage rule. |
| `fields_playoff_qualified_east_conference` | integer | Season content field: count of Eastern Conference clubs that have clinched a playoff berth. |
| `fields_playoff_qualified_west_conference` | integer | Season content field: count of Western Conference clubs that have clinched a playoff berth. |
| `fields_competition_sportec_id_overwrite` | logical | Season content field: competition: whether the season's Sportec id is manually overridden in the CMS. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mls_content_seasons` / `mlsContentSeasons`

| col_name | type | description |
|---|---|---|
| `type` | character | Type discriminator for the record. |
| `_translation_id` | character | Contentful translation-group id shared by every locale of this entry. |
| `_entity_id` | character | Contentful entity id for the content entry. |
| `self_url` | character | Canonical API URL of this content entry. |
| `slug` | character | URL slug. |
| `title` | character | Display title. |
| `tags` | character | Content tags, JSON-encoded. |
| `created_by` | character | User or service that created the content entry. |
| `last_updated_by` | character | User or service that last updated the content entry. |
| `last_updated_date` | character | Timestamp of the last content update (ISO 8601). |
| `content_date` | character | Editorial content date (ISO 8601). |
| `featured` | integer | Whether the entry is flagged as featured (1 = featured). |
| `entity_code` | character | Contentful entity-type code. |
| `fields_opta_id` | character | Season content field: parallel Opta integer id for the entity. |
| `fields_sportec_id` | character | Season content field: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `fields_name` | character | Season content field: display name. |
| `fields_competition_opta_id` | character | Season content field: parallel Opta integer id of the competition. |
| `fields_competition_sportec_id` | character | Season content field: Sportec opaque id of the competition (Utf8 join key). |
| `fields_standings_legend` | character | Season content field: prose legend explaining the standings qualification bands. |
| `fields_top_clubs` | integer | Season content field: number of clubs qualifying from the top of the table. |
| `fields_top_clubs_legend` | character | Season content field: prose legend explaining the top-clubs cut line. |
| `fields_home_advantage` | integer | Season content field: points of home advantage applied by the playoff seeding rules. |
| `fields_home_advantage_legend` | character | Season content field: prose legend explaining the home-advantage rule. |
| `fields_playoff_qualified_east_conference` | integer | Season content field: count of Eastern Conference clubs that have clinched a playoff berth. |
| `fields_playoff_qualified_west_conference` | integer | Season content field: count of Western Conference clubs that have clinched a playoff berth. |
| `fields_competition_sportec_id_overwrite` | logical | Season content field: competition: whether the season's Sportec id is manually overridden in the CMS. |

**Row type:** `MlsApiContentSeasonsRow` (exported from the package root).

### Returns — `mls_match` / `mlsMatch`

| col_name | type | description |
|---|---|---|
| `competition_id` | character | Sportec competition id |
| `competition_name` | character | Competition display name |
| `away_team_goals` | integer | Away goals |
| `home_team_goals` | integer | Home goals |
| `kickoff_time` | character | Actual kickoff timestamp (ISO 8601) |
| `match_day` | integer | Matchday / round number |
| `match_id` | character | Sportec match id (MLS-MAT-*) |
| `match_title` | character | Home:Away title, e.g. `CF Montréal:Toronto FC` |
| `planned_kickoff_time` | character | Scheduled kickoff timestamp (ISO 8601) |
| `result` | character | Final score string, e.g. `0:0` |
| `season` | integer | Season year |
| `season_id` | character | Sportec season id |
| `competition_type` | character | `League` or `Tournament` |
| `section_name` | character | Season section / phase |
| `competition_label` | character | Short competition label |
| `series_type` | character | Series type (e.g. regular) |
| `total_time_first_half` | integer | First-half elapsed seconds |
| `total_time_second_half` | integer | Second-half elapsed seconds |
| `playing_time_first_half` | integer | First-half playing seconds |
| `playing_time_second_half` | integer | Second-half playing seconds |
| `total_time_first_half_extra` | integer | First-half stoppage seconds |
| `total_time_second_half_extra` | integer | Second-half stoppage seconds |
| `total_time_penalty` | integer | Penalty-shootout total seconds |
| `playing_time_penalty` | integer | Penalty-shootout playing seconds |
| `other_information` | character | Free-form notes |
| `match_type` | character | Match classification |
| `match_scheduled` | logical | Whether kickoff is scheduled |
| `date_quality` | character | Confidence of the match date |
| `end_date` | character | Match end date |
| `sub_league` | character | Sub-league grouping |
| `group` | character | Group name (tournaments) |
| `competition_name_french` | character | French competition name |
| `match_status` | character | Status (e.g. `Live`, `FullTime`) |
| `minute_of_play` | character | Current minute (live) |

**Row type:** `MlsApiMatchRow` (exported from the package root).

### Returns — `mls_season_matches` / `mlsSeasonMatches`

| col_name | type | description |
|---|---|---|
| `competition_id` | character | Sportec competition id |
| `competition_name` | character | Competition display name |
| `competition_type` | character | `League` or `Tournament` |
| `end_date` | character | Match end date |
| `away_team_id` | character | Away Sportec club id |
| `away_team_name` | character | Away club name |
| `home_team_id` | character | Home Sportec club id |
| `home_team_name` | character | Home club name |
| `home_team_short_name` | character | Home short name |
| `home_team_three_letter_code` | character | Home 3-letter code |
| `away_team_short_name` | character | Away short name |
| `away_team_three_letter_code` | character | Away 3-letter code |
| `match_scheduled` | logical | Whether kickoff is scheduled |
| `match_day` | integer | Matchday / round number |
| `match_day_id` | character | Sportec matchday id |
| `match_id` | character | Sportec match id (MLS-MAT-*) |
| `match_type` | character | Match classification |
| `planned_kickoff_time` | character | Scheduled kickoff timestamp (ISO 8601) |
| `season` | integer | Season year |
| `season_id` | character | Sportec season id |
| `stadium_id` | character | Stadium id |
| `stadium_name` | character | Stadium name |
| `neutral_venue` | logical | Neutral-venue flag |
| `start_date` | character | Match start date |
| `sub_league` | character | Sub-league grouping |
| `group` | character | Group name (tournaments) |
| `date_quality` | character | Confidence of the match date |
| `official_information` | character | Officiating notes |
| `match_date_time_status` | character | Kickoff time status |
| `section_name` | character | Season section / phase |
| `competition_label` | character | Short competition label |
| `series_type` | character | Series type (e.g. regular) |
| `competition_name_french` | character | French competition name |
| `result` | character | Final score string, e.g. `0:0` |
| `away_team_goals` | integer | Away goals |
| `home_team_goals` | integer | Home goals |
| `match_status` | character | Status (e.g. `Live`, `FullTime`) |
| `minute_of_play` | character | Current minute (live) |
| `stadium_city` | character | Stadium city |
| `stadium_country` | character | Stadium country |
| `bracket_structure_id` | character | Identifier of the playoff bracket structure. |

**Row type:** `MlsApiSeasonMatchesRow` (exported from the package root).

### Returns — `mls_sportapi_club_players` / `mlsSportapiClubPlayers`

| col_name | type | description |
|---|---|---|
| `opta_id` | character | Parallel Opta integer id for the entity. |
| `full_name` | character | Full name |
| `first_name` | character | First name |
| `last_name` | character | Last name |
| `known_name` | character | Known / display name |
| `on_loan` | logical | On-loan flag |
| `club_opta_id` | character | Club Opta id |
| `club_sportec_id` | character | Club Sportec id |
| `sportec_id` | character | Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `height` | character | Height |
| `weight` | character | Weight |
| `position` | character | Table position/rank |
| `roster_category` | character | Roster category |
| `player_categories` | character | Roster category tags |
| `jersey_number` | character | Jersey number |
| `player_status_list` | character | Status tags (e.g. `Loaned Out`) |
| `date_of_birth` | character | Birth date |
| `player_slug` | character | URL slug |
| `thumbnail_slug` | character | Player thumbnail image: URL slug. |
| `thumbnail_self_url` | character | Player thumbnail image: canonical API URL of this content entry. |
| `thumbnail_title` | character | Player thumbnail image: display title. |
| `thumbnail_template_url` | character | Player thumbnail image: templated image URL with substitutable size tokens. |
| `thumbnail_thumbnail_url` | character | Player thumbnail image: URL of the rendered thumbnail image. |
| `thumbnail_format` | character | Player thumbnail image: image format of the asset. |

**Row type:** `MlsApiSportapiClubPlayersRow` (exported from the package root).

### Returns — `mls_sportapi_clubs_by_sportec_ids` / `mlsSportapiClubsBySportecIds`

| col_name | type | description |
|---|---|---|
| `opta_id` | character | Parallel Opta integer id for the entity. |
| `sportec_id` | character | Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `full_name` | character | Full name |
| `slug` | character | URL slug. |
| `short_name` | character | Short name |
| `abbreviation` | character |  |
| `background_color` | character | Brand background colour (hex). |
| `logo_bw_slug` | character | Asset slug for the black-and-white logo. |
| `logo_color_slug` | character | Asset slug for the full-colour logo. |
| `logo_color_url` | character | URL of the full-colour logo asset. |
| `crest_color_slug` | character | Asset slug for the full-colour club crest. |
| `ecal_widget_id` | character | Identifier of the eCal calendar-subscription widget. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mls_sportapi_match` / `mlsSportapiMatch`

| col_name | type | description |
|---|---|---|
| `opta_id` | character | Parallel Opta integer id for the entity. |
| `sportec_id` | character | Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `slug` | character | URL slug. |
| `league_match_title` | character | Home:Away match title as rendered in league listings. |
| `broadcasters` | character | Broadcast listings for the match, JSON-encoded. |
| `match_date` | character | Scheduled kickoff timestamp (ISO 8601). |
| `tags` | character | Content tags, JSON-encoded. |
| `home_club_broadcasters` | character | Home club: club-specific broadcast listings, JSON-encoded. |
| `away_club_broadcasters` | character | Away club: club-specific broadcast listings, JSON-encoded. |
| `club_broadcasters` | character | Club-specific broadcast listings, JSON-encoded. |
| `is_time_tbd` | logical | Whether the kickoff time is still to be confirmed. |
| `mgm_id` | character | MGM sportsbook partner identifier. |
| `apple_stream_url` | character | Apple broadcast: Apple TV stream URL for the match. |
| `apple_subscription_tier` | character | Apple broadcast: Apple subscription tier required to watch. |
| `apple_advertisement_category` | character | Apple broadcast: Apple advertising category for the stream. |
| `round_name` | character | Name of the round or series this match belongs to. |
| `competition_phase` | character | Competition: competition phase of the match (regular season, playoffs, ...). |
| `home_club_rank` | character | Home club: club's standings rank at the time of the request. |
| `away_club_rank` | character | Away club: club's standings rank at the time of the request. |
| `round_number` | integer |  |
| `round_group` | character | Group label within the round (tournaments). |
| `match_day` | character | Matchday / round number |
| `calendar_url` | character | Calendar (.ics) subscription URL for the match. |
| `delayed_match` | logical | Whether the match is flagged as delayed. |
| `priority_match_date_to` | character | Priority-match window: end of the display window (ISO 8601). |
| `priority_match_sponsor` | character | Priority-match window: sponsor name attached to the priority match. |
| `home_opta_id` | character | Home club: parallel Opta integer id for the entity. |
| `home_sportec_id` | character | Home club: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `home_full_name` | character | Home club: full name |
| `home_slug` | character | Home club: URL slug. |
| `home_short_name` | character | Home club: short name |
| `home_abbreviation` | character |  |
| `home_background_color` | character | Home club: brand background colour (hex). |
| `home_logo_bw_slug` | character | Home club: asset slug for the black-and-white logo. |
| `home_logo_color_slug` | character | Home club: asset slug for the full-colour logo. |
| `home_logo_color_url` | character | Home club: URL of the full-colour logo asset. |
| `home_crest_color_slug` | character | Home club: asset slug for the full-colour club crest. |
| `home_ecal_widget_id` | character | Home club: identifier of the eCal calendar-subscription widget. |
| `away_opta_id` | character | Away club: parallel Opta integer id for the entity. |
| `away_sportec_id` | character | Away club: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `away_full_name` | character | Away club: full name |
| `away_slug` | character | Away club: URL slug. |
| `away_short_name` | character | Away club: short name |
| `away_abbreviation` | character |  |
| `away_background_color` | character | Away club: brand background colour (hex). |
| `away_logo_bw_slug` | character | Away club: asset slug for the black-and-white logo. |
| `away_logo_color_slug` | character | Away club: asset slug for the full-colour logo. |
| `away_logo_color_url` | character | Away club: URL of the full-colour logo asset. |
| `away_crest_color_slug` | character | Away club: asset slug for the full-colour club crest. |
| `away_ecal_widget_id` | character | Away club: identifier of the eCal calendar-subscription widget. |
| `venue_venue_sportec_id` | character | Venue: Sportec opaque id of the venue (Utf8 join key). |
| `venue_background_image_slug` | character | Venue: asset slug for the background image. |
| `venue_name` | character | Venue: display name. |
| `venue_city` | character | Venue: home city |
| `season_slug` | character | Season: URL slug. |
| `season_opta_id` | character | Season: parallel Opta integer id for the entity. |
| `season_sportec_id` | character | Season: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `season_competition_opta_id` | character | Season: parallel Opta integer id of the competition. |
| `season_name` | character | Season: display name. |
| `competition_opta_id` | character | Parallel Opta integer id of the competition. |
| `competition_sportec_id` | character | Sportec opaque id of the competition (Utf8 join key). |
| `competition_name` | character | Competition display name |
| `competition_widget_id` | character | Competition: identifier of the embedded provider widget. |
| `competition_slug` | character | Competition: URL slug. |
| `competition_short_name` | character | Competition: short name |
| `competition_match_type` | character | Competition: Match classification |
| `competition_logo_light_slug` | character | Competition light-theme logo: URL slug. |
| `competition_logo_dark_slug` | character | Competition dark-theme logo: URL slug. |
| `competition_block_header_name` | character | Competition: header label used for this competition on the site. |
| `competition_mgm_id` | character | Competition: MGM sportsbook partner identifier. |
| `competition_nextgen_ecal_match_hub_display` | logical | Competition: whether the match hub shows the eCal subscribe control. |
| `competition_player_headshot_thumbnail_field` | character | Competition: content field the site reads player headshots from. |
| `league_promo_image_asset_url` | character | League promo image: URL of the image asset. |
| `first_party_tickets_display_text` | character | MLS-operated ticketing link: button label for the ticketing link. |
| `first_party_tickets_accessible_text` | character | MLS-operated ticketing link: accessible (screen-reader) label for the ticketing link. |
| `first_party_tickets_url` | character | MLS-operated ticketing link: link URL. |
| `first_party_tickets_open_in_new_tab` | logical | MLS-operated ticketing link: whether the link opens in a new tab. |
| `first_party_tickets_is_visible` | logical | MLS-operated ticketing link: whether the link is shown. |

**Row type:** `MlsApiSportapiMatchRow` (exported from the package root).

### Returns — `mls_sportapi_matches_by_sportec_ids` / `mlsSportapiMatchesBySportecIds`

| col_name | type | description |
|---|---|---|
| `opta_id` | character | Parallel Opta integer id for the entity. |
| `sportec_id` | character | Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `slug` | character | URL slug. |
| `league_match_title` | character | Home:Away match title as rendered in league listings. |
| `broadcasters` | character | Broadcast listings for the match, JSON-encoded. |
| `match_date` | character | Scheduled kickoff timestamp (ISO 8601). |
| `tags` | character | Content tags, JSON-encoded. |
| `home_club_broadcasters` | character | Home club: club-specific broadcast listings, JSON-encoded. |
| `away_club_broadcasters` | character | Away club: club-specific broadcast listings, JSON-encoded. |
| `club_broadcasters` | character | Club-specific broadcast listings, JSON-encoded. |
| `is_time_tbd` | logical | Whether the kickoff time is still to be confirmed. |
| `mgm_id` | character | MGM sportsbook partner identifier. |
| `apple_stream_url` | character | Apple broadcast: Apple TV stream URL for the match. |
| `apple_subscription_tier` | character | Apple broadcast: Apple subscription tier required to watch. |
| `apple_advertisement_category` | character | Apple broadcast: Apple advertising category for the stream. |
| `round_name` | character | Name of the round or series this match belongs to. |
| `competition_phase` | character | Competition: competition phase of the match (regular season, playoffs, ...). |
| `home_club_rank` | character | Home club: club's standings rank at the time of the request. |
| `away_club_rank` | character | Away club: club's standings rank at the time of the request. |
| `round_number` | integer |  |
| `round_group` | character | Group label within the round (tournaments). |
| `match_day` | character | Matchday / round number |
| `calendar_url` | character | Calendar (.ics) subscription URL for the match. |
| `delayed_match` | logical | Whether the match is flagged as delayed. |
| `priority_match_date_to` | character | Priority-match window: end of the display window (ISO 8601). |
| `priority_match_sponsor` | character | Priority-match window: sponsor name attached to the priority match. |
| `home_opta_id` | character | Home club: parallel Opta integer id for the entity. |
| `home_sportec_id` | character | Home club: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `home_full_name` | character | Home club: full name |
| `home_slug` | character | Home club: URL slug. |
| `home_short_name` | character | Home club: short name |
| `home_abbreviation` | character |  |
| `home_background_color` | character | Home club: brand background colour (hex). |
| `home_logo_bw_slug` | character | Home club: asset slug for the black-and-white logo. |
| `home_logo_color_slug` | character | Home club: asset slug for the full-colour logo. |
| `home_logo_color_url` | character | Home club: URL of the full-colour logo asset. |
| `home_crest_color_slug` | character | Home club: asset slug for the full-colour club crest. |
| `away_opta_id` | character | Away club: parallel Opta integer id for the entity. |
| `away_sportec_id` | character | Away club: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `away_full_name` | character | Away club: full name |
| `away_slug` | character | Away club: URL slug. |
| `away_short_name` | character | Away club: short name |
| `away_abbreviation` | character |  |
| `away_background_color` | character | Away club: brand background colour (hex). |
| `away_logo_bw_slug` | character | Away club: asset slug for the black-and-white logo. |
| `away_logo_color_slug` | character | Away club: asset slug for the full-colour logo. |
| `away_logo_color_url` | character | Away club: URL of the full-colour logo asset. |
| `away_crest_color_slug` | character | Away club: asset slug for the full-colour club crest. |
| `venue_venue_sportec_id` | character | Venue: Sportec opaque id of the venue (Utf8 join key). |
| `venue_name` | character | Venue: display name. |
| `venue_city` | character | Venue: home city |
| `season_slug` | character | Season: URL slug. |
| `season_opta_id` | character | Season: parallel Opta integer id for the entity. |
| `season_sportec_id` | character | Season: Sportec opaque id for the entity (Utf8 join key, never numeric). |
| `season_competition_opta_id` | character | Season: parallel Opta integer id of the competition. |
| `season_name` | character | Season: display name. |
| `competition_opta_id` | character | Parallel Opta integer id of the competition. |
| `competition_sportec_id` | character | Sportec opaque id of the competition (Utf8 join key). |
| `competition_name` | character | Competition display name |
| `competition_widget_id` | character | Competition: identifier of the embedded provider widget. |
| `competition_slug` | character | Competition: URL slug. |
| `competition_short_name` | character | Competition: short name |
| `competition_match_type` | character | Competition: Match classification |
| `competition_logo_light_slug` | character | Competition light-theme logo: URL slug. |
| `competition_logo_dark_slug` | character | Competition dark-theme logo: URL slug. |
| `competition_block_header_name` | character | Competition: header label used for this competition on the site. |
| `competition_mgm_id` | character | Competition: MGM sportsbook partner identifier. |
| `competition_nextgen_ecal_match_hub_display` | logical | Competition: whether the match hub shows the eCal subscribe control. |
| `competition_player_headshot_thumbnail_field` | character | Competition: content field the site reads player headshots from. |
| `league_promo_image_asset_url` | character | League promo image: URL of the image asset. |
| `third_party_tickets_url` | character | Third-party ticketing link: link URL. |
| `third_party_tickets_open_in_new_tab` | logical | Third-party ticketing link: whether the link opens in a new tab. |
| `third_party_tickets_is_visible` | logical | Third-party ticketing link: whether the link is shown. |
| `priority_match_date_from` | character | Priority-match window: start of the display window (ISO 8601). |
| `home_ecal_widget_id` | character | Home club: identifier of the eCal calendar-subscription widget. |
| `away_ecal_widget_id` | character | Away club: identifier of the eCal calendar-subscription widget. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `mls_standings` / `mlsStandings`

| col_name | type | description |
|---|---|---|
| `competition_id` | character | Sportec competition id |
| `season_id` | character | Sportec season id |
| `group` | character | Group name (tournaments) |
| `category` | character |  |
| `type` | character | Type discriminator for the record. |
| `position` | integer | Table position/rank |
| `club` | character | Club full name |
| `club_id` | character | Sportec club id |
| `team` | character | Team name |
| `team_id` | character | Sportec club id |
| `team_short_name` | character | Short club name |
| `team_three_letter_code` | character | 3-letter club code |
| `games_played` | integer | Matches played |
| `wins` | integer | Wins |
| `draws` | integer | Draws |
| `losses` | integer | Losses |
| `goals_scored` | integer | Goals for |
| `goals_against` | integer | Goals against |
| `goals_difference` | integer | Goal differential |
| `points` | integer | Points |
| `qualification` | character | Playoff/qualification marker |
| `tendency` | character | Movement vs prior matchday |
| `points_per_game` | numeric | Points per game |
| `goals_scored_per_game` | numeric | Goals-for per game |
| `goals_against_per_game` | numeric | Goals-against per game |
| `goals_difference_per_game` | numeric | Goal-diff per game |

**Row type:** `MlsApiStandingsRow` (exported from the package root).

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/mls_api.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
