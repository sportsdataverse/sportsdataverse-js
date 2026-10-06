---
title: Native API
sidebar_label: Native API
sidebar_position: 5
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `sdv.nwsl` — Native (non-ESPN) APIs

Beyond the ESPN surface, `sdv.nwsl` also wraps the league's own live APIs. Same `{ parsed: true }` contract; each method is exposed under both snake_case and camelCase on `sdv.nwsl`.

## Native API — NWSL (StatsPerform SDP)

Flat (non-ESPN) wrappers for the official NWSL StatsPerform SDP API. Host: `https://api-sdp.nwslsoccer.com/v1/nwsl/football`. Each method is exposed under BOTH its snake_case name `nwsl_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.nwsl`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. Endpoints marked **multi-table** parse to several frames in sdv-py; with `parsed: true` they return the default shown in the Parser column (one sub-frame, or every table as a dict), and `section: "<name>"` selects any other (an unknown name throws, listing the valid ones).

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `nwsl_competitions` / `nwslCompetitions` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/competitions` | — | `locale` | `parse_nwsl_sdp` | — |
| `nwsl_match_lineups` / `nwslMatchLineups` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/matches/{match_id}/lineups` | `season_id`\*, `match_id`\* | `locale` | `parse_nwsl_lineups` — multi-table: `section` = `teams`, `players` (default), `staff` | — |
| `nwsl_matchdays` / `nwslMatchdays` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/matchdays` | `season_id`\* | `locale` | `parse_nwsl_sdp` | — |
| `nwsl_player_stats` / `nwslPlayerStats` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/stats/players` | `season_id`\* | `locale`, `category`, `role`, `direction`, `page`, `page_num_element` → `pageNumElement` | `parse_nwsl_stats` | — |
| `nwsl_season_matches` / `nwslSeasonMatches` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/multipleSeasonMatches` | — | `season_ids` → `seasonIds`, `locale`, `start_date` → `startDate`, `end_date` → `endDate` | `parse_nwsl_sdp` | — |
| `nwsl_stages` / `nwslStages` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/stages` | `season_id`\* | `locale` | `parse_nwsl_sdp` | — |
| `nwsl_standings` / `nwslStandings` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/standings/overall` | `season_id`\* | `locale`, `order_by` → `orderBy`, `direction` | `parse_nwsl_standings` | — |
| `nwsl_team_stats` / `nwslTeamStats` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/stats/teams` | `season_id`\* | `locale`, `category` | `parse_nwsl_stats` | — |
| `nwsl_teams` / `nwslTeams` | `https://api-sdp.nwslsoccer.com/v1/nwsl/football/seasons/{season_id}/teams` | `season_id`\* | `locale` | `parse_nwsl_sdp` | — |

### Returns — `nwsl_competitions` / `nwslCompetitions`

| col_name | type | description |
|---|---|---|
| `competition_id` | character | Composite Competition id (Utf8 join key). |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `name` | character | Stage display name. |
| `official_name` | character | Official team name. |
| `short_name` | character | Short team name. |
| `acronym_name` | character | 3-letter team code. |

**Row type:** `NwslApiCompetitionsRow` (exported from the package root).

### Returns — `nwsl_match_lineups` / `nwslMatchLineups`

| col_name | type | description |
|---|---|---|
| `match_id` | character | Composite Match id (Utf8 join key). |
| `side` | character |  |
| `team_id` | character | Composite Team id (Utf8 join key). |
| `selection` | character |  |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `player_id` | character | Composite Player id (Utf8 join key). |
| `bib_number` | character | Shirt/bib number. |
| `role_label` | character | Human position label (e.g. `Forward`). |
| `role` | integer | Numeric position/role code. |
| `media_first_name` | character | Media-style first name. |
| `media_last_name` | character | Media-style last name. |
| `shirt_name` | character | Name printed on the shirt. |
| `short_name` | character | Short team name. |
| `display_name` | character |  |
| `nationality` | character | Nationality name. |
| `nationality_iso_code` | character | ISO country code. |
| `is_captain` | logical | Whether the player wears the captain's armband. |
| `is_goalkeeper` | logical | Whether the player is the goalkeeper. |
| `events` | character | In-match events attributed to the player (goals/cards/subs). |
| `tactical_x_position` | character | Formation-grid X (0-1 normalized canvas). |
| `tactical_y_position` | character | Formation-grid Y (0-1 normalized canvas). |
| `average_x_position` | character | Average pitch x-coordinate of the player over the match. |
| `average_y_position` | character | Average pitch y-coordinate of the player over the match. |

**Row type:** `NwslApiMatchLineupsRow` (exported from the package root).

### Returns — `nwsl_matchdays` / `nwslMatchdays`

| col_name | type | description |
|---|---|---|
| `match_set_id` | character | Composite match-day (match set) id. |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `name` | character | Stage display name. |
| `season_id` | character | Composite Season id (Utf8 join key). |
| `competition_id` | character | Composite Competition id (Utf8 join key). |
| `round_id` | character | Composite id of the round. |
| `stage_id` | character | Composite Stage id (`nwsl::Football_Stage::{hex}`). |
| `index` | character | Ordinal position of the match day within the season. |
| `short_name` | character | Short team name. |
| `match_set_format_id` | character | Identifier of the match-day format. |
| `type` | character | Type discriminator for the record. |
| `start_date_utc` | character | Season window start (ISO-8601 UTC). |
| `end_date_utc` | character | Season window end (ISO-8601 UTC). |
| `matchday_status` | character | Status of the match day (scheduled, in progress, completed). |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `nwsl_player_stats` / `nwslPlayerStats`

| col_name | type | description |
|---|---|---|
| `rank_label` | character | Leaderboard rank label (null unless ranked view). |
| `player_id` | character | Composite Player id (Utf8 join key). |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `bib_number` | character | Shirt/bib number. |
| `role_label` | character | Human position label (e.g. `Forward`). |
| `role` | integer | Numeric position/role code. |
| `media_first_name` | character | Media-style first name. |
| `media_last_name` | character | Media-style last name. |
| `shirt_name` | character | Name printed on the shirt. |
| `short_name` | character | Short team name. |
| `display_name` | character |  |
| `nationality` | character | Nationality name. |
| `nationality_iso_code` | character | ISO country code. |
| `api_call_request_time` | character | Server timestamp the payload was assembled (ISO-8601). |
| `stats_id` | character | Stable stat key (e.g. `goals`, `points`, `Xg`). |
| `stats_label` | character | Human stat name. |
| `stats_label_abbreviation` | character | Short label (e.g. `PTS`, `GD`). |
| `stats_value` | character | Stat value - integer, string, or array (e.g. `form`). |
| `stats_unit` | character | Unit name (usually null). |
| `stats_unit_abbreviation` | character | Unit abbreviation (usually null). |
| `team_team_id` | character | Club: Composite Team id (Utf8 join key). |
| `team_provider_id` | character | Club: underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `team_short_name` | character | Club: short team name. |
| `team_official_name` | character | Club: official team name. |
| `team_acronym_name` | character | Club: 3-letter team code. |
| `team_acronym_name_localized` | character | Club: localized 3-letter code. |
| `team_is_team_fake` | logical | Club: true for placeholder/TBD teams. |
| `team_media_name` | character | Club: media-style display name. |
| `team_media_short_name` | character | Club: short media-style display name. |
| `team_country_code` | character | Club: ISO country code. |
| `team_team_type` | character | Club: team type (e.g. `club`). |
| `team_overall_summary` | character | Club: Season summary blurb. |
| `team_stadium` | character | Club: home venue: `{id, providerId, name, cityName, country, address, capacity, yearOfConstruction, mapsGeoCodeLatitude, mapsGeoCodeLongitude, imagery}`. |
| `team_all_season_imagery` | character | Club: per-season crest variants. |
| `team_editorial_social_facebook` | character | Club editorial: facebook handle or URL. |
| `team_editorial_social_instagram` | character | Club editorial: instagram handle or URL. |
| `team_editorial_social_x` | character | Club editorial: x (Twitter) handle or URL. |
| `team_editorial_social_tik_tok` | character | Club editorial: tikTok handle or URL. |
| `team_editorial_social_you_tube` | character | Club editorial: youTube handle or URL. |
| `team_editorial_social_linked_in` | character | Club editorial: linkedIn handle or URL. |
| `team_editorial_website_url` | character | Club editorial: official website URL. |
| `team_editorial_shop_url` | character | Club editorial: club shop URL. |
| `team_editorial_tickets_url` | character | Club editorial: ticketing URL. |
| `team_editorial_club_primary_colour` | character | Club editorial: club primary colour (hex). |
| `team_editorial_club_secondary_colour` | character | Club editorial: club secondary colour (hex). |
| `team_editorial_club_text_colour` | character | Club editorial: club text colour (hex). |
| `editorial_player_role_within_team` | character | Editorial metadata: editorial description of the player's role in the side. |

**Row type:** `NwslApiPlayerStatsRow` (exported from the package root).

### Returns — `nwsl_season_matches` / `nwslSeasonMatches`

| col_name | type | description |
|---|---|---|
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `season_id` | character | Composite Season id (Utf8 join key). |
| `match_id` | character | Composite Match id (Utf8 join key). |
| `status` | character | Normalized match status (e.g. `PostMatch`, `PreMatch`, `Live`). |
| `provider_status` | character | Raw provider status string. |
| `phase` | character | Season phase (e.g. `RegularSeason`, `Final Series`). |
| `match_date_utc` | character | Kickoff time in UTC (ISO-8601). |
| `match_date_local` | character | Kickoff time in venue-local time. |
| `local_time_utc_offset` | character | Venue UTC offset. |
| `is_unknown_kick_off_time` | logical | True if kickoff time is TBD. |
| `home_score_push` | integer | Home club: live score pushed by the feed for this side. |
| `away_score_push` | integer | Away club: live score pushed by the feed for this side. |
| `provider_penalty_score_home` | character | Provider-reported: home side's penalty-shootout score. |
| `provider_penalty_score_away` | character | Provider-reported: away side's penalty-shootout score. |
| `aggregate` | character | Two-leg aggregate label. |
| `win_reason` | character | How the result was decided. |
| `win_team_id` | character | Composite Team id of the winner (null if draw/unplayed). |
| `previous_legs_result` | character | Aggregate result of previous legs in a two-legged tie. |
| `stadium_id` | character | Composite Stadium id for the venue. |
| `stadium_name` | character | Stadium: stage display name. |
| `city_name` | character | City the stadium is in. |
| `group` | character |  |
| `group_name` | character |  |
| `round_id` | character | Composite id of the round. |
| `round_name` | character | Name of the round or series this match belongs to. |
| `schedule_status` | character | Scheduling status. |
| `provider_home_score` | integer | Provider-reported: home side's score. |
| `provider_away_score` | integer | Provider-reported: away side's score. |
| `group_id` | character |  |
| `sub_league` | character | Sub-league label. |
| `time` | character |  |
| `additional_time` | character | Stoppage time added, in minutes. |
| `previous_leg_id` | character | Composite Match id of the previous leg (two-legged ties). |
| `editorial_broadcasters_broadcaster_national1` | character | Broadcast listing: first national broadcaster carrying the match. |
| `editorial_broadcasters_broadcaster_national2` | character | Broadcast listing: second national broadcaster carrying the match. |
| `editorial_broadcasters_broadcaster_national3` | character | Broadcast listing: third national broadcaster carrying the match. |
| `editorial_broadcasters_broadcaster_international1` | character | Broadcast listing: first international broadcaster carrying the match. |
| `editorial_broadcasters_broadcaster_international2` | character | Broadcast listing: second international broadcaster carrying the match. |
| `editorial_broadcasters_broadcaster_international3` | character | Broadcast listing: third international broadcaster carrying the match. |
| `editorial_highlights_url` | character | Editorial metadata: Match highlights URL. |
| `editorial_highlights_national_url` | character | Editorial metadata: nationally-geofenced match highlights URL. |
| `editorial_highlights_international_url` | character | Editorial metadata: internationally-geofenced match highlights URL. |
| `editorial_tickets_url` | character | Editorial metadata: ticketing URL. |
| `editorial_sponsor_image` | character | Editorial metadata: sponsor image asset, JSON-encoded. |
| `editorial_theme_night` | character | Editorial metadata: theme-night promotion attached to the match. |
| `editorial_editorials` | character | Editorial metadata: editorial blurbs attached to the record, JSON-encoded. |
| `home_team_id` | character | Home club: Composite Team id (Utf8 join key). |
| `home_provider_id` | character | Home club: underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `home_short_name` | character | Home club: short team name. |
| `home_official_name` | character | Home club: official team name. |
| `home_acronym_name` | character | Home club: 3-letter team code. |
| `home_acronym_name_localized` | character | Home club: localized 3-letter code. |
| `home_is_team_fake` | logical | Home club: true for placeholder/TBD teams. |
| `home_media_name` | character | Home club: media-style display name. |
| `home_media_short_name` | character | Home club: short media-style display name. |
| `home_country_code` | character | Home club: ISO country code. |
| `home_team_type` | character | Home club: team type (e.g. `club`). |
| `home_overall_summary` | character | Home club: Season summary blurb. |
| `home_stadium` | character | Home club: home venue: `{id, providerId, name, cityName, country, address, capacity, yearOfConstruction, mapsGeoCodeLatitude, mapsGeoCodeLongitude, imagery}`. |
| `home_all_season_imagery` | character | Home club: per-season crest variants. |
| `home_editorial_social_facebook` | character | Home club editorial: facebook handle or URL. |
| `home_editorial_social_instagram` | character | Home club editorial: instagram handle or URL. |
| `home_editorial_social_x` | character | Home club editorial: x (Twitter) handle or URL. |
| `home_editorial_social_tik_tok` | character | Home club editorial: tikTok handle or URL. |
| `home_editorial_social_you_tube` | character | Home club editorial: youTube handle or URL. |
| `home_editorial_social_linked_in` | character | Home club editorial: linkedIn handle or URL. |
| `home_editorial_website_url` | character | Home club editorial: official website URL. |
| `home_editorial_shop_url` | character | Home club editorial: club shop URL. |
| `home_editorial_tickets_url` | character | Home club editorial: ticketing URL. |
| `home_editorial_club_primary_colour` | character | Home club editorial: club primary colour (hex). |
| `home_editorial_club_secondary_colour` | character | Home club editorial: club secondary colour (hex). |
| `home_editorial_club_text_colour` | character | Home club editorial: club text colour (hex). |
| `away_team_id` | character | Away club: Composite Team id (Utf8 join key). |
| `away_provider_id` | character | Away club: underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `away_short_name` | character | Away club: short team name. |
| `away_official_name` | character | Away club: official team name. |
| `away_acronym_name` | character | Away club: 3-letter team code. |
| `away_acronym_name_localized` | character | Away club: localized 3-letter code. |
| `away_is_team_fake` | logical | Away club: true for placeholder/TBD teams. |
| `away_media_name` | character | Away club: media-style display name. |
| `away_media_short_name` | character | Away club: short media-style display name. |
| `away_country_code` | character | Away club: ISO country code. |
| `away_team_type` | character | Away club: team type (e.g. `club`). |
| `away_overall_summary` | character | Away club: Season summary blurb. |
| `away_stadium` | character | Away club: home venue: `{id, providerId, name, cityName, country, address, capacity, yearOfConstruction, mapsGeoCodeLatitude, mapsGeoCodeLongitude, imagery}`. |
| `away_all_season_imagery` | character | Away club: per-season crest variants. |
| `away_editorial_social_facebook` | character | Away club editorial: facebook handle or URL. |
| `away_editorial_social_instagram` | character | Away club editorial: instagram handle or URL. |
| `away_editorial_social_x` | character | Away club editorial: x (Twitter) handle or URL. |
| `away_editorial_social_tik_tok` | character | Away club editorial: tikTok handle or URL. |
| `away_editorial_social_you_tube` | character | Away club editorial: youTube handle or URL. |
| `away_editorial_social_linked_in` | character | Away club editorial: linkedIn handle or URL. |
| `away_editorial_website_url` | character | Away club editorial: official website URL. |
| `away_editorial_shop_url` | character | Away club editorial: club shop URL. |
| `away_editorial_tickets_url` | character | Away club editorial: ticketing URL. |
| `away_editorial_club_primary_colour` | character | Away club editorial: club primary colour (hex). |
| `away_editorial_club_secondary_colour` | character | Away club editorial: club secondary colour (hex). |
| `away_editorial_club_text_colour` | character | Away club editorial: club text colour (hex). |
| `match_set_match_set_id` | character | Match day (round): Composite match-day (match set) id. |
| `match_set_provider_id` | character | Match day (round): underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `match_set_name` | character | Match day (round): stage display name. |
| `match_set_season_id` | character | Match day (round): Composite Season id (Utf8 join key). |
| `match_set_competition_id` | character | Match day (round): Composite Competition id (Utf8 join key). |
| `match_set_round_id` | character | Match day (round): Composite id of the round. |
| `match_set_stage_id` | character | Match day (round): Composite Stage id (`nwsl::Football_Stage::{hex}`). |
| `match_set_index` | character | Match day (round): ordinal position of the match day within the season. |
| `match_set_short_name` | character | Match day (round): short team name. |
| `match_set_match_set_format_id` | character | Match day (round): identifier of the match-day format. |
| `match_set_type` | character | Match day (round): type discriminator for the record. |
| `match_set_start_date_utc` | character | Match day (round): Season window start (ISO-8601 UTC). |
| `match_set_end_date_utc` | character | Match day (round): Season window end (ISO-8601 UTC). |
| `match_set_matchday_status` | character | Match day (round): status of the match day (scheduled, in progress, completed). |

**Row type:** `NwslApiSeasonMatchesRow` (exported from the package root).

### Returns — `nwsl_stages` / `nwslStages`

| col_name | type | description |
|---|---|---|
| `stage_id` | character | Composite Stage id (`nwsl::Football_Stage::{hex}`). |
| `name` | character | Stage display name. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `nwsl_team_stats` / `nwslTeamStats`

| col_name | type | description |
|---|---|---|
| `rank_label` | character | Leaderboard rank label (null unless ranked view). |
| `team_id` | character | Composite Team id (Utf8 join key). |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `short_name` | character | Short team name. |
| `official_name` | character | Official team name. |
| `acronym_name` | character | 3-letter team code. |
| `acronym_name_localized` | character | Localized 3-letter code. |
| `is_team_fake` | logical | True for placeholder/TBD teams. |
| `media_name` | character | Media-style display name. |
| `media_short_name` | character | Short media-style display name. |
| `country_code` | character | ISO country code. |
| `team_type` | character | Team type (e.g. `club`). |
| `overall_summary` | character | Season summary blurb. |
| `stadium` | character | Home venue: `{id, providerId, name, cityName, country, address, capacity, yearOfConstruction, mapsGeoCodeLatitude, mapsGeoCodeLongitude, imagery}`. |
| `all_season_imagery` | character | Per-season crest variants. |
| `stats_id` | character | Stable stat key (e.g. `goals`, `points`, `Xg`). |
| `stats_label` | character | Human stat name. |
| `stats_label_abbreviation` | character | Short label (e.g. `PTS`, `GD`). |
| `stats_value` | character | Stat value - integer, string, or array (e.g. `form`). |
| `stats_unit` | character | Unit name (usually null). |
| `stats_unit_abbreviation` | character | Unit abbreviation (usually null). |
| `editorial_social_facebook` | character | Editorial metadata: facebook handle or URL. |
| `editorial_social_instagram` | character | Editorial metadata: instagram handle or URL. |
| `editorial_social_x` | character | Editorial metadata: x (Twitter) handle or URL. |
| `editorial_social_tik_tok` | character | Editorial metadata: tikTok handle or URL. |
| `editorial_social_you_tube` | character | Editorial metadata: youTube handle or URL. |
| `editorial_social_linked_in` | character | Editorial metadata: linkedIn handle or URL. |
| `editorial_website_url` | character | Editorial metadata: official website URL. |
| `editorial_shop_url` | character | Editorial metadata: club shop URL. |
| `editorial_tickets_url` | character | Editorial metadata: ticketing URL. |
| `editorial_club_primary_colour` | character | Editorial metadata: club primary colour (hex). |
| `editorial_club_secondary_colour` | character | Editorial metadata: club secondary colour (hex). |
| `editorial_club_text_colour` | character | Editorial metadata: club text colour (hex). |

**Row type:** `NwslApiTeamStatsRow` (exported from the package root).

### Returns — `nwsl_teams` / `nwslTeams`

| col_name | type | description |
|---|---|---|
| `team_id` | character | Composite Team id (Utf8 join key). |
| `provider_id` | character | Underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `short_name` | character | Short team name. |
| `official_name` | character | Official team name. |
| `acronym_name` | character | 3-letter team code. |
| `acronym_name_localized` | character | Localized 3-letter code. |
| `is_team_fake` | logical | True for placeholder/TBD teams. |
| `media_name` | character | Media-style display name. |
| `media_short_name` | character | Short media-style display name. |
| `country_code` | character | ISO country code. |
| `team_type` | character | Team type (e.g. `club`). |
| `overall_summary` | character | Season summary blurb. |
| `all_season_imagery` | character | Per-season crest variants. |
| `stadium_id` | character | Composite Stadium id for the venue. |
| `stadium_provider_id` | character | Stadium: underlying StatsPerform/Opta provider id (e.g. `opta:...`). |
| `stadium_name` | character | Stadium: stage display name. |
| `stadium_city_name` | character | Stadium: city the stadium is in. |
| `stadium_country` | character | Stadium: country the stadium is in. |
| `stadium_address` | character | Stadium: street address of the stadium. |
| `stadium_capacity` | integer | Stadium: seating capacity of the stadium. |
| `stadium_year_of_construction` | integer | Stadium: year the stadium was built. |
| `stadium_maps_geo_code_latitude` | character | Stadium: latitude in decimal degrees. |
| `stadium_maps_geo_code_longitude` | character | Stadium: longitude in decimal degrees. |
| `editorial_social_facebook` | character | Editorial metadata: facebook handle or URL. |
| `editorial_social_instagram` | character | Editorial metadata: instagram handle or URL. |
| `editorial_social_x` | character | Editorial metadata: x (Twitter) handle or URL. |
| `editorial_social_tik_tok` | character | Editorial metadata: tikTok handle or URL. |
| `editorial_social_you_tube` | character | Editorial metadata: youTube handle or URL. |
| `editorial_social_linked_in` | character | Editorial metadata: linkedIn handle or URL. |
| `editorial_website_url` | character | Editorial metadata: official website URL. |
| `editorial_shop_url` | character | Editorial metadata: club shop URL. |
| `editorial_tickets_url` | character | Editorial metadata: ticketing URL. |
| `editorial_club_primary_colour` | character | Editorial metadata: club primary colour (hex). |
| `editorial_club_secondary_colour` | character | Editorial metadata: club secondary colour (hex). |
| `editorial_club_text_colour` | character | Editorial metadata: club text colour (hex). |

**Row type:** `NwslApiTeamsRow` (exported from the package root).

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/nwsl_api.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
