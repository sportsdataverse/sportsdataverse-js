---
title: sports247
sidebar_label: sports247
sidebar_position: 34
toc_max_heading_level: 2
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `sports247` — native provider reference

- **namespace:** `sdv.sports247` *(standalone — not an ESPN league)*
- **families:** 247Sports RDB, 247Sports site pages
- **wrappers:** 47 native

`sports247` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.sports247`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// 247Sports: a free guest token is minted for you; needs `npm install impit`
// (both hosts block plain HTTP clients). sport_key 1 = football, 2 = basketball.
await sdv.sports247.sports247InstitutionRankings({ year: 2026, parsed: true });
await sdv.sports247.sports247SitePagesInstitution({ key: 24099, parsed: true });
```

## Native API — 247Sports RDB

Flat (non-ESPN) wrappers for the 247Sports Recruit Database (`ipa.247sports.com`). Host: `https://ipa.247sports.com`. Each method is exposed under BOTH its snake_case name `sports247_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.sports247`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. **Auth:** this family mints a bearer token automatically before each call (no credentials required). **Transport:** the host fingerprint-blocks plain HTTP clients, so this family uses the browser-impersonating transport — `npm install impit` (without it, calls reject with `TransportUnavailableError`).

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `sports247_coaches` / `sports247Coaches` | `https://ipa.247sports.com/rdb/v1/coaches/` | — | `sport_key` → `sportKey`, `year`, `page_size` → `pageSize`, `page` | `parse_sports247_result_set` | yes |
| `sports247_composite_team_ranking_feed` / `sports247CompositeTeamRankingFeed` | `https://ipa.247sports.com/rdb/v1/rankings/{sport_key}/{year}/compositeTeamRankingFeed/` | `year`\*, `sport_key` | `page_size` → `pageSize` | `parse_sports247_result_set` | yes |
| `sports247_institution_rankings` / `sports247InstitutionRankings` | `https://ipa.247sports.com/rdb/v1/rankings/{sport_key}/{year}/institutionrankings/` | `year`\*, `sport_key` | `page_size` → `pagesize`, `page`, `use_composite` → `useComposite`, `conference_abbreviation` → `conferenceAbbreviation`, `institution_key` → `institutionKey` | `parse_sports247_institution_rankings` | yes |
| `sports247_positions` / `sports247Positions` | `https://ipa.247sports.com/rdb/v1/positions/` | — | `sport_key` → `sportKey`, `year`, `ranking_key` → `rankingKey` | `parse_sports247_result_set` | yes |
| `sports247_recruits` / `sports247Recruits` | `https://ipa.247sports.com/rdb/v1/recruits/` | — | `sport_key` → `sportKey`, `year`, `page_size` → `pagesize`, `page`, `position_abbreviation` → `positionAbbreviation`, `state_abbreviation` → `stateAbbreviation` | `parse_sports247_result_set` | yes |
| `sports247_sport_years` / `sports247SportYears` | `https://ipa.247sports.com/rdb/v1/sports/{sport_key}/year/` | `sport_key` | — | `parse_sports247_result_set` | yes |
| `sports247_tags_autocomplete` / `sports247TagsAutocomplete` | `https://ipa.247sports.com/rdb/v1/tags/autocomplete/` | — | `default_name` → `defaultName`, `items` | `parse_sports247_result_set` | yes |
| `sports247_target_predictions` / `sports247TargetPredictions` | `https://ipa.247sports.com/rdb/v1/sites/{site_key}/years/{year}/sports/{sport_key}/currentTargetPredictions/` | `site_key`\*, `year`\*, `sport_key` | `page_size` → `pageSize` | `parse_sports247_result_set` | yes |
| `sports247_teams` / `sports247Teams` | `https://ipa.247sports.com/rdb/v1/teams/` | — | `sport_key` → `sportKey`, `year`, `institution_type` → `institutionType` | `parse_sports247_teams` | yes |
| `sports247_transfer_portal_player_feed` / `sports247TransferPortalPlayerFeed` | `https://ipa.247sports.com/rdb/v1/rankings/{sport_key}/{year}/transferPortalPlayerfeed/` | `year`\*, `sport_key` | `page_size` → `pageSize` | `parse_sports247_result_set` | yes |
| `sports247_transfer_portal_team_feed` / `sports247TransferPortalTeamFeed` | `https://ipa.247sports.com/rdb/v1/rankings/{sport_key}/{year}/transferPortalOnlyTeamFeed/` | `year`\*, `sport_key` | `page_size` → `pageSize` | `parse_sports247_result_set` | yes |
| `sports247_transfers` / `sports247Transfers` | `https://ipa.247sports.com/rdb/v1/transfers/` | — | `sport_key` → `sportKey`, `year`, `page_size` → `pagesize`, `page` | `parse_sports247_result_set` | yes |

### Returns — `sports247_coaches` / `sports247Coaches`

| col_name | type | description |
|---|---|---|
| `key` | integer | 247Sports coach key. |
| `cbs_key` | integer | Legacy CBS coach key. |
| `first_name` | character | Given name of the coach. |
| `last_name` | character | Family (surname) of the coach. |
| `profile_url` | character | 247sports.com path to the coach's profile. |
| `default_asset_url` | character | CDN URL of the coach's headshot. |
| `composite_rating` | character | Coach's composite recruiting rating (formula points). |
| `current_job` | double | Current-job program object when present; null (this scalar) otherwise (see current_job_* columns). |
| `average_composite_rating` | character | Coach's average composite recruit rating. |
| `overall_rank` | character | Coach's national recruiting rank. |
| `division_rank` | character | Coach's rank within the division. |
| `conference_rank` | character | Coach's rank within the conference. |
| `current_job_institution_key` | double | 247Sports institution key of the coach's current program. |
| `current_job_team_key` | double | 247Sports RDB team key of the coach's current program. |
| `current_job_cbs_key` | double | Legacy CBS key of the coach's current program. |
| `current_job_name` | character | Short name of the coach's current program. |
| `current_job_abbreviation` | character | Abbreviation of the coach's current program. |
| `current_job_full_name` | character | Full name of the coach's current program. |

**Row type:** `Sports247Sports247CoachesRow` (exported from the package root).

### Returns — `sports247_composite_team_ranking_feed` / `sports247CompositeTeamRankingFeed`

| col_name | type | description |
|---|---|---|
| `name` | character | Short display name of the program. |
| `full_name` | character | Full name of the program (school plus nickname). |
| `state_abbreviation` | character | Program's state abbreviation. |
| `conference_name` | character | Name of the athletic conference the program competes in. |
| `key` | integer | 247Sports institution/team key. |
| `logo` | character | CDN URL of the program's logo. |
| `alternate_logo` | character | CDN URL of the program's alternate logo. |
| `position` | integer | Row position in the feed. |
| `team_ranking_position` | integer | Rank in the high-school team recruiting class. |
| `transfer_ranking_position` | integer | Rank in the transfer-portal team class. |
| `overall_rank` | integer | 247Sports overall national team-class rank. |
| `composite_overall_rank` | integer | Composite overall national team-class rank. |
| `conference_rank` | integer | 247Sports class rank within the conference. |
| `composite_conference_rank` | integer | Composite class rank within the conference. |
| `five_stars` | integer | Count of 247Sports five-star commits. |
| `composite_five_stars` | integer | Count of composite five-star commits. |
| `four_stars` | integer | Count of 247Sports four-star commits. |
| `composite_four_stars` | integer | Count of composite four-star commits. |
| `three_stars` | integer | Count of 247Sports three-star commits. |
| `composite_three_stars` | integer | Count of composite three-star commits. |
| `average_rating` | integer | Average 247Sports commit rating. |
| `composite_average_rating` | double | Average composite commit rating. |
| `rating` | integer | Total 247Sports class rating (formula points). |
| `composite_rating` | double | Total composite class rating (formula points). |

**Row type:** `Sports247Sports247CompositeTeamRankingFeedRow` (exported from the package root).

### Returns — `sports247_institution_rankings` / `sports247InstitutionRankings`

| col_name | type | description |
|---|---|---|
| `name` | character | Short display name of the institution as shown on the 247Sports class-ranking page (e.g. USC, Notre Dame). |
| `full_name` | character | Institution full name (school + nickname). |
| `conference_rank` | integer | 247Sports class rank within the conference. |
| `conference_composite_rank` | integer | Composite class rank within the conference. |
| `rank` | integer | 247Sports national team-class rank. |
| `composite_rank` | integer | Industry-composite national team-class rank. |
| `institution_key` | integer | 247Sports institution key (school-level). |
| `team_key` | integer | 247Sports RDB team key (per-sport). |
| `average_rating` | double | Average 247Sports rating of counted commits. |
| `rating` | double | Total 247Sports class rating (team-ranking formula points). |
| `composite_rating` | double | Total composite class rating (formula points). |
| `average_composite_rating` | double | Average composite rating of counted commits. |
| `default_asset` | character | CDN URL of the institution's default logo. |
| `alternate_asset` | character | CDN URL of the institution's alternate logo. |
| `light_asset` | character | CDN URL of the institution's light-background logo. |
| `high_school_ranking_position` | character | Position of the class in the high-school-only ranking. |
| `transfer_points` | character | Transfer-portal points contributed to the class rating. |
| `transfer_number` | integer | Number of incoming transfers counted in the class. |
| `five_stars` | integer | Count of 247Sports five-star commits. |
| `composite_five_stars` | integer | Count of composite five-star commits. |
| `four_stars` | integer | Count of 247Sports four-star commits. |
| `composite_four_stars` | integer | Count of composite four-star commits. |
| `three_stars` | integer | Count of 247Sports three-star commits. |
| `composite_three_stars` | integer | Count of composite three-star commits. |
| `commits` | integer | Number of commits in the class. |
| `site_key` | integer | 247Sports team-site key. |
| `institution_root_path` | character | 247sports.com root path of the institution's team site. |
| `ranking_date` | character | Timestamp the ranking row was last updated. |
| `city` | character | Institution city. |
| `state` | character | Full name of the U.S. state where the institution is located. |
| `state_abbreviation` | character | Institution state abbreviation. |
| `institution_ranking_url` | character | 247sports.com URL of the institution's class-ranking page. |

**Row type:** `Sports247Sports247InstitutionRankingsRow` (exported from the package root).

### Returns — `sports247_positions` / `sports247Positions`

| col_name | type | description |
|---|---|---|
| `group` | character | Position group name (e.g. Quarterback, Running Back). |
| `group_key` | integer | 247Sports position group key. |
| `name` | character | Full position group name (e.g. Quarterback). |
| `label` | character | Position abbreviation label (e.g. QB, RB). |
| `value` | character | 247Sports position key (returned as a string). |

**Row type:** `Sports247Sports247PositionsRow` (exported from the package root).

### Returns — `sports247_recruits` / `sports247Recruits`

| col_name | type | description |
|---|---|---|
| `key` | integer | 247Sports player key of the recruit. |
| `cbs_key` | integer | Legacy CBS player key (0 when unmapped). |
| `first_name` | character | Given name of the recruit. |
| `last_name` | character | Family (surname) of the recruit. |
| `profile_url` | character | 247sports.com path to the recruit's profile. |
| `default_asset_url` | character | CDN URL of the recruit's headshot. |
| `primary_position` | character | Recruit's primary position abbreviation. |
| `composite_rating` | double | 247Sports Composite rating (industry-blended 0-1 scale). |
| `composite_star_rating` | integer | 247Sports Composite star rating (2-5). |
| `composite_national_rank` | integer | Composite national rank. |
| `composite_position_rank` | integer | Composite rank at the recruit's position. |
| `composite_state_rank` | integer | Composite rank within the recruit's state. |
| `signed_institution` | double | Signed-program object when present; null (this scalar) for unsigned recruits (see signed_institution_* columns). |
| `home_town_city` | character | Recruit's home-town city. |
| `home_town_state` | character | Recruit's home-town state. |
| `committed_institution_institution_key` | integer | 247Sports institution key of the program the recruit is committed to. |
| `committed_institution_team_key` | integer | 247Sports RDB team key of the program the recruit is committed to. |
| `committed_institution_cbs_key` | integer | Legacy CBS key of the program the recruit is committed to. |
| `committed_institution_name` | character | Short name of the program the recruit is committed to. |
| `committed_institution_abbreviation` | character | Abbreviation of the program the recruit is committed to. |
| `committed_institution_full_name` | character | Full name of the program the recruit is committed to. |
| `current_institution_institution_key` | integer | 247Sports institution key of the recruit's current program. |
| `current_institution_team_key` | double | 247Sports RDB team key of the recruit's current program. |
| `current_institution_cbs_key` | double | Legacy CBS key of the recruit's current program. |
| `current_institution_name` | character | Short name of the recruit's current program. |
| `current_institution_abbreviation` | character | Abbreviation of the recruit's current program. |
| `current_institution_full_name` | character | Full name of the recruit's current program. |
| `signed_institution_institution_key` | double | 247Sports institution key of the program the recruit signed with. |
| `signed_institution_team_key` | double | 247Sports RDB team key of the program the recruit signed with. |
| `signed_institution_cbs_key` | double | Legacy CBS key of the program the recruit signed with. |
| `signed_institution_name` | character | Short name of the program the recruit signed with. |
| `signed_institution_abbreviation` | character | Abbreviation of the program the recruit signed with. |
| `signed_institution_full_name` | character | Full name of the program the recruit signed with. |

**Row type:** `Sports247Sports247RecruitsRow` (exported from the package root).

### Returns — `sports247_sport_years` / `sports247SportYears`

| col_name | type | description |
|---|---|---|
| `value` | integer | A class year for which the 247Sports RDB has data for the sport. |

**Row type:** `Sports247Sports247SportYearsRow` (exported from the package root).

### Returns — `sports247_tags_autocomplete` / `sports247TagsAutocomplete`

| col_name | type | description |
|---|---|---|
| `id` | character | 247Sports tag id (prefixed key, e.g. Player_46151084). |
| `name` | character | Display name of the tagged entity. |
| `type` | character | Tag entity type (Player, Team, Institution, ...). |
| `annotation` | character | Disambiguating annotation (e.g. class year, position, school). |

**Row type:** `Sports247Sports247TagsAutocompleteRow` (exported from the package root).

### Returns — `sports247_target_predictions` / `sports247TargetPredictions`

| col_name | type | description |
|---|---|---|
| `player_key` | integer | 247Sports player key of the recruit the prediction is about. |
| `player_institution_key` | integer | 247Sports institution key predicted for the recruit. |
| `prediction_type` | integer | Numeric prediction-type discriminator. |
| `rating` | double | Recruit's 247Sports rating at prediction time. |
| `star_rating` | integer | Recruit's star rating (2-5). |
| `position` | character | Recruit's position abbreviation. |
| `weight` | double | Recruit's weight in pounds. |
| `height` | character | Recruit's height as a formatted string. |
| `prediction` | character | Predicted destination program name. |
| `prediction_level` | integer | Expert confidence level of the prediction. |
| `image` | character | CDN URL of the predicted program's logo. |
| `alt_image` | character | CDN URL of the predicted program's alternate logo. |
| `light_image` | character | CDN URL of the predicted program's light-background logo. |
| `player_name` | character | Recruit's full name. |
| `player_image` | character | CDN URL of the recruit's headshot. |
| `prediction_date` | character | Timestamp the prediction was made. |
| `expert_name` | character | Name of the expert who made the prediction. |
| `expert_alias` | character | 247Sports handle of the expert. |
| `expert_key` | integer | 247Sports key of the expert. |
| `expert_role` | character | Expert's role/title. |
| `expert_image` | character | CDN URL of the expert's avatar. |
| `expert_prediction_year` | integer | Class year the expert's accuracy stats cover. |
| `expert_yearly_total_correct` | integer | Expert's correct predictions this year. |
| `expert_yearly_total_made` | integer | Expert's total predictions made this year. |
| `expert_all_time_total_correct` | integer | Expert's correct predictions all-time. |
| `expert_all_time_total_made` | integer | Expert's total predictions made all-time. |
| `prediction_page_url` | character | 247sports.com path to the prediction detail. |

**Row type:** `Sports247Sports247TargetPredictionsRow` (exported from the package root).

### Returns — `sports247_teams` / `sports247Teams`

| col_name | type | description |
|---|---|---|
| `name` | character | Team display name (school + nickname). |
| `team_id` | integer | 247Sports RDB team id (per-sport). |
| `institution_key` | integer | 247Sports institution key (school-level, sport-agnostic). |
| `conference` | character | Full name of the athletic conference the team competes in (e.g. ACC, Big Ten). |
| `conference_abbreviation` | character | Conference abbreviation. |
| `sport` | character | Sport name (Football, Basketball, ...). |
| `type` | character | Institution type (College, ...). |

**Row type:** `Sports247Sports247TeamsRow` (exported from the package root).

### Returns — `sports247_transfer_portal_player_feed` / `sports247TransferPortalPlayerFeed`

| col_name | type | description |
|---|---|---|
| `key` | integer | 247Sports player key. |
| `target_institution` | character | Name of the program the player is targeting / committed to. |
| `target_institution_key` | character | 247Sports institution key of the target program. |
| `full_name` | character | Full name of the transfer player. |
| `position_abbr` | character | Position abbreviation. |
| `current_institution` | character | Name of the player's current program. |
| `current_institution_key` | integer | 247Sports institution key of the current program. |
| `current_institution_state_abbreviation` | character | State abbreviation of the current program. |
| `current_institution_city` | character | City of the current program. |
| `first_name` | character | Given name of the transfer player. |
| `last_name` | character | Family (surname) of the transfer player. |
| `state_abbreviation` | character | Player's state abbreviation. |
| `player_image` | character | CDN URL of the player's headshot. |
| `star_rating` | integer | 247Sports star rating (2-5). |
| `group_rank` | integer | Rank within the transfer position group. |
| `position_rank` | integer | Rank at the player's position among transfers. |
| `state_rank` | integer | Rank within the player's state. |
| `formatted_height` | character | Height as a formatted string. |
| `weight` | double | Weight in pounds. |

**Row type:** `Sports247Sports247TransferPortalPlayerFeedRow` (exported from the package root).

### Returns — `sports247_transfer_portal_team_feed` / `sports247TransferPortalTeamFeed`

| col_name | type | description |
|---|---|---|
| `name` | character | Display name of the program. |
| `key` | integer | 247Sports institution/team key. |
| `logo` | character | CDN URL of the program's logo. |
| `alternate_logo` | character | CDN URL of the program's alternate logo. |
| `position` | integer | Rank in the transfer-portal team class. |
| `number_of_transfers` | integer | Number of incoming transfers in the class. |
| `transfer_points` | double | Total transfer-portal class rating points. |

**Row type:** `Sports247Sports247TransferPortalTeamFeedRow` (exported from the package root).

### Returns — `sports247_transfers` / `sports247Transfers`

| col_name | type | description |
|---|---|---|
| `player_key` | integer | 247Sports player key of the transfer. |
| `player_first_name` | character | Given name of the transfer player. |
| `player_last_name` | character | Family (surname) of the transfer player. |
| `player_avatar` | character | CDN URL of the transfer's headshot. |
| `player_transfer_date` | character | Timestamp the player entered the transfer portal. |
| `player_transfer_rating` | double | 247Sports transfer rating. |
| `player_high_school_rating` | double | The player's original high-school recruiting rating. |
| `player_rating` | double | 247Sports current rating. |
| `player_star_rating` | double | 247Sports star rating (2-5). |
| `player_transfer_rank` | double | National rank among transfers. |
| `player_high_school_rank` | double | The player's original high-school national rank. |
| `player_rank` | double | 247Sports current national rank. |
| `player_rank_trend` | double | Change in rank since the previous update. |
| `player_institution_status` | character | Transfer status relative to institutions (e.g. Entered, Committed). |
| `player_position` | character | Position abbreviation. |
| `player_position_key` | integer | 247Sports position key. |
| `player_eligibility_type` | character | Eligibility classification (e.g. Grad, Underclassman). |
| `player_eligibility_years` | double | Years of eligibility remaining. |
| `player_state_rank` | double | Rank within the player's state. |
| `player_status` | character | Portal status label. |
| `player_status_date` | character | Timestamp of the latest status change. |
| `player_transfer_source_institution` | character | Name of the program the player is transferring from. |
| `player_transfer_source_institution_key` | integer | 247Sports institution key of the source program. |
| `player_transfer_source_logo` | character | CDN URL of the source program's logo. |
| `player_transfer_source_default_asset` | character | CDN URL of the source program's default logo asset. |
| `player_transfer_source_alternate_asset` | character | CDN URL of the source program's alternate logo asset. |
| `player_transfer_source_light_asset` | character | CDN URL of the source program's light-background logo asset. |
| `player_transfer_source_institution_root_path` | character | 247sports.com root path of the source program's team site. |
| `player_transfer_destination` | character | Name of the program the player is transferring to (null if uncommitted). |
| `player_position_group_key` | integer | 247Sports position-group key. |
| `player_position_group_name` | character | Position-group name (e.g. Quarterback). |
| `player_position_rank` | double | Rank at the player's position among transfers. |
| `player_last_update_date` | character | Timestamp of the last record update. |
| `player_transfer_commit_date_time` | character | Timestamp of the transfer commitment (null if uncommitted). |
| `player_weight` | integer | Weight in pounds. |
| `player_height` | character | Height as a formatted string. |
| `player_player_profile_url` | character | 247sports.com path to the player's profile. |
| `player_start_date` | character | Start date of the transfer window record. |
| `player_end_date` | character | End date of the transfer window record. |

**Row type:** `Sports247Sports247TransfersRow` (exported from the package root).

## Native API — 247Sports site pages

Flat (non-ESPN) wrappers for the 247sports.com `*.json` page models. Host: `https://247sports.com`. Each method is exposed under BOTH its snake_case name `sports247_site_pages_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.sports247`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response. No auth. **Transport:** browser-impersonating (`npm install impit`), as for `sports247`. Nested entities arrive as bare integer keys — walk each through its own `.json` route.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `sports247_site_pages_coach` / `sports247SitePagesCoach` | `https://247sports.com/Coach/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_coach_alma_mater` / `sports247SitePagesCoachAlmaMater` | `https://247sports.com/Coach/{key}/AlmaMater.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_coach_hometown` / `sports247SitePagesCoachHometown` | `https://247sports.com/Coach/{key}/Hometown.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_coach_ranking` / `sports247SitePagesCoachRanking` | `https://247sports.com/CoachRanking/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_coach_rankings` / `sports247SitePagesCoachRankings` | `https://247sports.com/Coach/{key}/CoachRankings.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_event` / `sports247SitePagesEvent` | `https://247sports.com/Event/{slug}.json` | `slug`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_institution` / `sports247SitePagesInstitution` | `https://247sports.com/Institution/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_institution_list` / `sports247SitePagesInstitutionList` | `https://247sports.com/Institution.json` | — | `items` | `parse_sports247_site_page` | — |
| `sports247_site_pages_institution_location` / `sports247SitePagesInstitutionLocation` | `https://247sports.com/Institution/{key}/Location.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_institution_timeline_events` / `sports247SitePagesInstitutionTimelineEvents` | `https://247sports.com/college/{school_slug}/Institution/{key}/TimelineEvents.json` | `school_slug`\*, `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_league_draft_picks` / `sports247SitePagesLeagueDraftPicks` | `https://247sports.com/League/{league_slug}/DraftPicks/ConfigureEmbed/.json` | `league_slug`\* | `year`, `round` | `parse_sports247_site_page` | — |
| `sports247_site_pages_league_institutions` / `sports247SitePagesLeagueInstitutions` | `https://247sports.com/League/{league_id}/Institutions.json` | `league_id`\* | `items` | `parse_sports247_site_page` | — |
| `sports247_site_pages_page_feeds` / `sports247SitePagesPageFeeds` | `https://247sports.com/Page/{page_id}/Feeds.json` | `page_id`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player` / `sports247SitePagesPlayer` | `https://247sports.com/Player/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_current_institution` / `sports247SitePagesPlayerCurrentInstitution` | `https://247sports.com/Player/{key}/CurrentPlayerInstitution.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_high_school` / `sports247SitePagesPlayerHighSchool` | `https://247sports.com/Player/{key}/PlayerHighSchool.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_institution` / `sports247SitePagesPlayerInstitution` | `https://247sports.com/PlayerInstitution/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_institution_evaluation` / `sports247SitePagesPlayerInstitutionEvaluation` | `https://247sports.com/PlayerInstitutionEvaluation/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_primary_sport` / `sports247SitePagesPlayerPrimarySport` | `https://247sports.com/Player/{key}/PrimaryPlayerSport.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_player_search` / `sports247SitePagesPlayerSearch` | `https://247sports.com/Player.json` | — | `first_name` → `FirstName`, `last_name` → `LastName` | `parse_sports247_site_page` | — |
| `sports247_site_pages_playersport` / `sports247SitePagesPlayersport` | `https://247sports.com/playersport/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_playersport_institution` / `sports247SitePagesPlayersportInstitution` | `https://247sports.com/PlayerSport/{key}/PlayerInstitution.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_playersport_rank_history` / `sports247SitePagesPlayersportRankHistory` | `https://247sports.com/PlayerSport/{key}/RecruitRankHistory.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_position_rankings` / `sports247SitePagesPositionRankings` | `https://247sports.com/Position/{key}/playersportrankings.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruit_interest` / `sports247SitePagesRecruitInterest` | `https://247sports.com/RecruitInterest/{key}.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruitment_final_choice` / `sports247SitePagesRecruitmentFinalChoice` | `https://247sports.com/Recruitment/{key}/FinalChoice.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruitment_institution` / `sports247SitePagesRecruitmentInstitution` | `https://247sports.com/Recruitment/{key}/Institution.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruitment_interests` / `sports247SitePagesRecruitmentInterests` | `https://247sports.com/Recruitment/{key}/Interests.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruitment_offers` / `sports247SitePagesRecruitmentOffers` | `https://247sports.com/Recruitment/{key}/Offers.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_recruitment_player_sport` / `sports247SitePagesRecruitmentPlayerSport` | `https://247sports.com/Recruitment/{key}/PlayerSport.json` | `key`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_season_current_expert_predictions` / `sports247SitePagesSeasonCurrentExpertPredictions` | `https://247sports.com/Season/{season}/CurrentExpertPredictions.json` | `season`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_season_recruit_interest_events` / `sports247SitePagesSeasonRecruitInterestEvents` | `https://247sports.com/Season/{season}/RecruitInterestEvents.json` | `season`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_season_recruit_interests` / `sports247SitePagesSeasonRecruitInterests` | `https://247sports.com/Season/{season}/RecruitInterests.json` | `season`\* | — | `parse_sports247_site_page` | — |
| `sports247_site_pages_season_recruits` / `sports247SitePagesSeasonRecruits` | `https://247sports.com/Season/{season}/Recruits.json` | `season`\* | `items` → `Items`, `page` → `Page`, `player_full_name` → `Player.FullName`, `institution` → `Institution` | `parse_sports247_site_page` | — |
| `sports247_site_pages_season_roster_embed` / `sports247SitePagesSeasonRosterEmbed` | `https://247sports.com/Season/{season}/Roster/Embed.json` | `season`\* | — | `parse_sports247_site_page` | — |

### Returns — `sports247_site_pages_coach` / `sports247SitePagesCoach`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `first_name` | character |  |
| `last_name` | character |  |
| `full_name` | character |  |
| `birthdate` | character |  |
| `hometown` | integer |  |
| `alma_mater` | integer | School the coach graduated from, per 247Sports. |
| `cbs_key` | integer | CBS Sports identifier for the coach (247Sports is a CBS Sports property). |
| `twitter_contact` | character | Coach's Twitter/X handle on the 247Sports profile. |
| `predictions_locked` | character | 247Sports flag that Crystal Ball prediction entries tied to the coach are locked. |
| `primary_coach_job` | integer | Nested 247Sports record for the coach's current job (stringified). |
| `default_asset` | integer | Nested 247Sports image asset for the coach's headshot (stringified). |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the coach page (stringified). |
| `quote_asset` | character | Nested 247Sports image asset used alongside the coach's quote block (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_coach_alma_mater` / `sports247SitePagesCoachAlmaMater`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_coach_hometown` / `sports247SitePagesCoachHometown`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `postal_code` | integer |  |
| `city` | character |  |
| `state` | integer | U.S. state of the location record, per 247Sports. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `county_tax_rate` | numeric | County income-tax rate for the location, carried on the 247Sports location record. |
| `city_tax_rate` | numeric | City income-tax rate for the location, carried on the 247Sports location record. |
| `special_tax_rate` | numeric | Special-district tax rate for the location, carried on the 247Sports location record. |
| `region_name` | character | Name of the region (state/province) for the location. |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_coach_ranking` / `sports247SitePagesCoachRanking`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `coach` | integer |  |
| `institution` | integer | Nested 247Sports institution the coach recruited for during the ranking cycle (stringified). |
| `conference` | integer |  |
| `ranking` | integer | FK -\> the Ranking snapshot this row belongs to. |
| `sport` | integer | Nested 247Sports sport the ranking covers (stringified). |
| `recruitment` | character | Nested 247Sports recruitment record credited to the coach on this row (stringified). |
| `rating` | numeric | Overall rating score for the coach's recruiting haul in the 247Sports coach ranking. |
| `scout_rating` | numeric | Total 247Sports in-house (scout) rating points credited to the coach's commits. |
| `composite_rating` | numeric | Composite class rating for the coach's haul. |
| `commits` | integer | Number of commits credited to the coach in the ranking. |
| `total` | integer | Total ranking score for the coach's class, as reported by 247Sports. |
| `composite_total` | integer | Total 247Sports Composite rating points credited to the coach's commits. |
| `five_stars` | integer | Number of five-star commits credited to the coach. |
| `scout_five_stars` | integer | Number of five-star commits by 247Sports' own (scout) rating. |
| `composite_five_stars` | integer | Number of five-star commits by the 247Sports Composite rating. |
| `four_stars` | integer | Number of four-star commits credited to the coach. |
| `scout_four_stars` | integer | Number of four-star commits by 247Sports' own (scout) rating. |
| `composite_four_stars` | integer | Number of four-star commits by the 247Sports Composite rating. |
| `three_stars` | integer | Number of three-star commits credited to the coach. |
| `scout_three_stars` | integer | Number of three-star commits by 247Sports' own (scout) rating. |
| `composite_three_stars` | integer | Number of three-star commits by the 247Sports Composite rating. |
| `two_stars` | integer | Number of two-star commits credited to the coach. |
| `scout_two_stars` | integer | Number of two-star commits by 247Sports' own (scout) rating. |
| `composite_two_stars` | integer | Number of two-star commits by the 247Sports Composite rating. |
| `average_rating` | numeric | Average rating across the coach's credited commits. |
| `average_scout_rating` | integer | Average 247Sports in-house (scout) rating across the credited commits. |
| `composite_average_rating` | numeric | Average 247Sports Composite rating across the credited commits. |
| `overall_rank` | integer | Overall national coach-recruiting rank. |
| `composite_overall_rank` | integer | Coach's national recruiter rank by Composite points. |
| `scout_overall_rank` | integer | Coach's national recruiter rank by 247Sports' own (scout) points. |
| `division_rank` | integer | Coach's recruiter rank within the division. |
| `scout_division_rank` | integer | Coach's division recruiter rank by 247Sports' own (scout) points. |
| `composite_division_rank` | integer | Coach's division recruiter rank by Composite points. |
| `conference_rank` | integer | Rank within conference. |
| `scout_conference_rank` | integer | Coach's conference recruiter rank by 247Sports' own (scout) points. |
| `composite_conference_rank` | integer | Coach's conference recruiter rank by Composite points. |
| `previous_coach_ranking` | numeric | Nested prior-cycle recruiter-ranking row for the coach (stringified). |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_coach_rankings` / `sports247SitePagesCoachRankings`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `coach` | integer |  |
| `institution` | integer | Nested 247Sports institution the coach recruited for during the ranking cycle (stringified). |
| `conference` | integer |  |
| `ranking` | integer | FK -\> the Ranking snapshot this row belongs to. |
| `sport` | integer | Nested 247Sports sport the ranking covers (stringified). |
| `recruitment` | character | Nested 247Sports recruitment record credited to the coach on this row (stringified). |
| `rating` | numeric | Overall rating score for the coach's recruiting haul in the 247Sports coach ranking. |
| `scout_rating` | numeric | Total 247Sports in-house (scout) rating points credited to the coach's commits. |
| `composite_rating` | numeric | Composite class rating for the coach's haul. |
| `commits` | integer | Number of commits credited to the coach in the ranking. |
| `total` | integer | Total ranking score for the coach's class, as reported by 247Sports. |
| `composite_total` | integer | Total 247Sports Composite rating points credited to the coach's commits. |
| `five_stars` | integer | Number of five-star commits credited to the coach. |
| `scout_five_stars` | integer | Number of five-star commits by 247Sports' own (scout) rating. |
| `composite_five_stars` | integer | Number of five-star commits by the 247Sports Composite rating. |
| `four_stars` | integer | Number of four-star commits credited to the coach. |
| `scout_four_stars` | integer | Number of four-star commits by 247Sports' own (scout) rating. |
| `composite_four_stars` | integer | Number of four-star commits by the 247Sports Composite rating. |
| `three_stars` | integer | Number of three-star commits credited to the coach. |
| `scout_three_stars` | integer | Number of three-star commits by 247Sports' own (scout) rating. |
| `composite_three_stars` | integer | Number of three-star commits by the 247Sports Composite rating. |
| `two_stars` | integer | Number of two-star commits credited to the coach. |
| `scout_two_stars` | integer | Number of two-star commits by 247Sports' own (scout) rating. |
| `composite_two_stars` | integer | Number of two-star commits by the 247Sports Composite rating. |
| `average_rating` | numeric | Average rating across the coach's credited commits. |
| `average_scout_rating` | integer | Average 247Sports in-house (scout) rating across the credited commits. |
| `composite_average_rating` | numeric | Average 247Sports Composite rating across the credited commits. |
| `overall_rank` | integer | Overall national coach-recruiting rank. |
| `composite_overall_rank` | integer | Coach's national recruiter rank by Composite points. |
| `scout_overall_rank` | integer | Coach's national recruiter rank by 247Sports' own (scout) points. |
| `division_rank` | integer | Coach's recruiter rank within the division. |
| `scout_division_rank` | integer | Coach's division recruiter rank by 247Sports' own (scout) points. |
| `composite_division_rank` | integer | Coach's division recruiter rank by Composite points. |
| `conference_rank` | integer | Rank within conference. |
| `scout_conference_rank` | integer | Coach's conference recruiter rank by 247Sports' own (scout) points. |
| `composite_conference_rank` | integer | Coach's conference recruiter rank by Composite points. |
| `previous_coach_ranking` | numeric | Nested prior-cycle recruiter-ranking row for the coach (stringified). |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_event` / `sports247SitePagesEvent`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `event_group` | integer | Grouping or series the event belongs to (e.g. a camp circuit) on 247Sports. |
| `event_type` | integer | Numeric code for the kind of 247Sports recruiting event on this row. |
| `event_date` | character |  |
| `default_asset` | integer | Nested 247Sports image asset for the event (stringified). |
| `primary_color` | integer |  |
| `year` | integer |  |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_institution` / `sports247SitePagesInstitution`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_institution_list` / `sports247SitePagesInstitutionList`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_institution_location` / `sports247SitePagesInstitutionLocation`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `postal_code` | integer |  |
| `city` | character |  |
| `state` | integer | U.S. state of the location record, per 247Sports. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `county_tax_rate` | numeric | County income-tax rate for the location, carried on the 247Sports location record. |
| `city_tax_rate` | numeric | City income-tax rate for the location, carried on the 247Sports location record. |
| `special_tax_rate` | numeric | Special-district tax rate for the location, carried on the 247Sports location record. |
| `region_name` | character | Name of the region (state/province) for the location. |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_institution_timeline_events` / `sports247SitePagesInstitutionTimelineEvents`

| col_name | type | description |
|---|---|---|
| `body` | character | Text body of the timeline entry. |
| `date` | character | Date of the institution timeline entry, per 247Sports. |
| `author_first_name` | character | First name of the entry's author. |
| `author_last_name` | character | Last name of the entry's author. |
| `author_affiliation` | character | Outlet or site the author writes for, per 247Sports. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_league_draft_picks` / `sports247SitePagesLeagueDraftPicks`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `pro_team` | integer | Nested 247Sports record for the professional team that made the pick (stringified). |
| `pro_team_name` | character | Name of the professional team that made the pick. |
| `year` | integer |  |
| `round` | integer | Draft round number (1-based) the pick belongs to. |
| `pick` | integer | Pick number within the round. |
| `overall_pick` | integer | Overall selection number in the draft. |
| `player` | integer |  |
| `player_first_name` | character |  |
| `player_last_name` | character |  |
| `college_team` | integer |  |
| `college_team_name` | character | Name of the college the player was drafted out of. |
| `position_abbreviation` | character | Player's position at draft. |
| `traded_from_team` | character | Team the pick was traded from, when it changed hands. |
| `pick_type` | character | Type of the selection (e.g. regular, compensatory, supplemental). |
| `league` | integer |  |
| `mock` | character | Whether this is a mock-draft projection vs an actual pick. |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_league_institutions` / `sports247SitePagesLeagueInstitutions`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_page_feeds` / `sports247SitePagesPageFeeds`

| col_name | type | description |
|---|---|---|
| `uid` | character |  |
| `update_date` | character | Date the feed item was published or updated. |
| `title_text` | character | Headline text of the feed item. |
| `main_text` | character | Body text of the feed item. |
| `redirection_url` | character | URL the feed item links out to. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player` / `sports247SitePagesPlayer`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `first_name` | character |  |
| `last_name` | character |  |
| `full_name` | character |  |
| `height` | character |  |
| `weight` | numeric |  |
| `bio` | character | Player biography text authored on 247Sports. |
| `scout_evaluation` | character | 247Sports scouting evaluation text for the player. |
| `birthdate` | character |  |
| `modified_user` | character | 247Sports user who last modified the player record. |
| `modified_date` | character | Date the player record was last modified. |
| `cbs_key` | integer | Cross-reference key into the CBS Sports id space. |
| `url` | character |  |
| `last_recruitment_player_institution` | integer | Nested player-institution record from the player's most recent recruitment (stringified). |
| `current_player_institution` | integer | FK -\> PlayerInstitution (current school). |
| `twitter_contact` | integer | Nested 247Sports contact record for the player's Twitter/X account (stringified). |
| `mobile_phone_contact` | character | Player's mobile phone contact field on the 247Sports record. |
| `primary_player_sport` | integer | FK -\> PlayerSport (`/PlayerSport/\{id\}.json`). |
| `primary_recruitment` | integer | Nested 247Sports record for the player's primary recruitment (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `default_asset` | integer | Nested 247Sports image asset for the player's headshot (stringified). |
| `default_asset_url` | character | URL of the player's headshot image. |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the player page (stringified). |
| `quote_asset` | character | Nested 247Sports image asset used alongside the player's quote block (stringified). |
| `user` | character | 247Sports user account linked to the player profile (nested, stringified). |
| `pro_stat_player` | integer | Reference tying the profile to a professional stats player record (247Sports field). |
| `college_stat_player` | integer | Reference tying the profile to a college stats player record (247Sports field). |
| `bio_or_default` | character | Player bio text, falling back to a default blurb when none is authored. |
| `rating` | integer | 247Sports numeric rating (0-1 scale) for the primary sport. |
| `star_rating` | integer | Star tier (2-5) derived from the rating. |
| `national_rank` | integer | Overall national rank in the recruit's class. |
| `position_rank` | integer | Rank within position for the class. |
| `state_rank` | integer | Rank within home state for the class. |
| `hometown_state` | character |  |
| `hometown_city` | character |  |
| `player_high_school_name` | character | Name of the player's high school. |
| `primary_player_position_abbreviation` | character | Abbreviation of the player's primary position. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_current_institution` / `sports247SitePagesPlayerCurrentInstitution`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `institution` | integer | Nested 247Sports institution for the stint (stringified). |
| `state` | integer | Nested 247Sports state record for the institution's location (stringified). |
| `agent` | character |  |
| `end_year` | integer |  |
| `end_date` | character |  |
| `early_enrollee` | character | Whether the player enrolled early at the institution. |
| `early_signee` | character | Whether the player signed in the early signing period. |
| `height` | numeric |  |
| `weight` | numeric |  |
| `transfer_institution` | character | Nested institution involved in the player's transfer, for transfer-portal stints (stringified). |
| `transfer_season` | character | Season of the player's transfer, when applicable. |
| `transfer_eligibility` | character | Player's eligibility status for the transfer, per 247Sports. |
| `created_date` | character | Date the player-institution record was created. |
| `modified_date` | character | Date the player-institution record was last modified. |
| `lead_expert` | integer | 247Sports expert assigned as the lead on the recruitment (nested, stringified). |
| `player_institution_evaluation` | integer | Nested 247Sports evaluation attached to this player-institution stint (stringified). |
| `primary_player_sport` | integer | Nested 247Sports player-sport profile the stint belongs to (stringified). |
| `default_asset` | integer | Nested 247Sports image asset for the stint (stringified). |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the stint (stringified). |
| `primary_recruitment` | integer | Nested 247Sports record for the recruitment behind the stint (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `end_year_or_current` | integer | Stint's end year, or the current year for an active stint. |
| `start_year_or_expected` | integer | Stint's start year, or the expected start year for a future stint. |
| `end_year_or_expected` | integer | Stint's end year, or the expected end year for an active stint. |
| `next_institution_type` | character | Level of the player's next institution (e.g. college, professional), per 247Sports. |
| `next_institution_group` | character | Grouping (e.g. conference/division) of the player's next institution, per 247Sports. |
| `start_year` | integer |  |
| `start_date` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_high_school` / `sports247SitePagesPlayerHighSchool`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `institution` | integer | Nested 247Sports institution for the stint (stringified). |
| `state` | integer | Nested 247Sports state record for the institution's location (stringified). |
| `agent` | character |  |
| `end_year` | integer |  |
| `end_date` | character |  |
| `early_enrollee` | character | Whether the player enrolled early at the institution. |
| `early_signee` | character | Whether the player signed in the early signing period. |
| `height` | numeric |  |
| `weight` | numeric |  |
| `transfer_institution` | character | Nested institution involved in the player's transfer, for transfer-portal stints (stringified). |
| `transfer_season` | character | Season of the player's transfer, when applicable. |
| `transfer_eligibility` | character | Player's eligibility status for the transfer, per 247Sports. |
| `created_date` | character | Date the player-institution record was created. |
| `modified_date` | character | Date the player-institution record was last modified. |
| `lead_expert` | integer | 247Sports expert assigned as the lead on the recruitment (nested, stringified). |
| `player_institution_evaluation` | integer | Nested 247Sports evaluation attached to this player-institution stint (stringified). |
| `primary_player_sport` | integer | Nested 247Sports player-sport profile the stint belongs to (stringified). |
| `default_asset` | integer | Nested 247Sports image asset for the stint (stringified). |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the stint (stringified). |
| `primary_recruitment` | integer | Nested 247Sports record for the recruitment behind the stint (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `end_year_or_current` | integer | Stint's end year, or the current year for an active stint. |
| `start_year_or_expected` | integer | Stint's start year, or the expected start year for a future stint. |
| `end_year_or_expected` | integer | Stint's end year, or the expected end year for an active stint. |
| `next_institution_type` | character | Level of the player's next institution (e.g. college, professional), per 247Sports. |
| `next_institution_group` | character | Grouping (e.g. conference/division) of the player's next institution, per 247Sports. |
| `start_year` | integer |  |
| `start_date` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_institution` / `sports247SitePagesPlayerInstitution`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `institution` | integer | Nested 247Sports institution for the stint (stringified). |
| `state` | integer | Nested 247Sports state record for the institution's location (stringified). |
| `agent` | character |  |
| `end_year` | integer |  |
| `end_date` | character |  |
| `early_enrollee` | character | Whether the player enrolled early at the institution. |
| `early_signee` | character | Whether the player signed in the early signing period. |
| `height` | numeric |  |
| `weight` | numeric |  |
| `transfer_institution` | character | Nested institution involved in the player's transfer, for transfer-portal stints (stringified). |
| `transfer_season` | character | Season of the player's transfer, when applicable. |
| `transfer_eligibility` | character | Player's eligibility status for the transfer, per 247Sports. |
| `created_date` | character | Date the player-institution record was created. |
| `modified_date` | character | Date the player-institution record was last modified. |
| `lead_expert` | integer | 247Sports expert assigned as the lead on the recruitment (nested, stringified). |
| `player_institution_evaluation` | integer | Nested 247Sports evaluation attached to this player-institution stint (stringified). |
| `primary_player_sport` | integer | Nested 247Sports player-sport profile the stint belongs to (stringified). |
| `default_asset` | integer | Nested 247Sports image asset for the stint (stringified). |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the stint (stringified). |
| `primary_recruitment` | integer | Nested 247Sports record for the recruitment behind the stint (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `end_year_or_current` | integer | Stint's end year, or the current year for an active stint. |
| `start_year_or_expected` | integer | Stint's start year, or the expected start year for a future stint. |
| `end_year_or_expected` | integer | Stint's end year, or the expected end year for an active stint. |
| `next_institution_type` | character | Level of the player's next institution (e.g. college, professional), per 247Sports. |
| `next_institution_group` | character | Grouping (e.g. conference/division) of the player's next institution, per 247Sports. |
| `start_year` | integer |  |
| `start_date` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_institution_evaluation` / `sports247SitePagesPlayerInstitutionEvaluation`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player_institution` | integer | Nested player-institution stint the evaluation is attached to (stringified). |
| `user` | integer | 247Sports user account of the evaluator (nested, stringified). |
| `evaluated_date` | character | Date the evaluation was written. |
| `comparison_player` | integer | Established player the evaluator compares the prospect to. |
| `projection` | character | Evaluator's projection for the player (e.g. draft round or college level). |
| `primary` | character | Whether this is the primary (featured) evaluation for the stint. |
| `scout_evaluation` | character | Full text of the 247Sports scouting evaluation. |
| `event` | character |  |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_primary_sport` / `sports247SitePagesPlayerPrimarySport`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `player_institution` | integer | Nested player-institution stint the player-sport profile points to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `sport` | integer | Nested 247Sports sport for the profile (stringified). |
| `rating` | integer | 247Sports rating string (0-1). |
| `rating_or_default` | integer | 247Sports in-house rating, falling back to a default value when unrated. |
| `local_index` | integer | 247Sports' own industry-index value for the player, alongside the Rivals and ESPN indexes. |
| `rivals_grade` | numeric | Rivals source grade (industry composite input). |
| `rivals_rank` | integer | Player's rank in the Rivals industry ranking, as tracked by 247Sports. |
| `rivals_index` | numeric | Rivals index value for the player, as tracked by 247Sports. |
| `espn_grade` | integer | ESPN source grade (industry composite input). |
| `espn_rank` | integer | Player's rank in the ESPN industry ranking, as tracked by 247Sports. |
| `espn_index` | numeric | ESPN index value for the player, as tracked by 247Sports. |
| `composite_strength` | integer | Composite strength points (team-ranking weight). |
| `composite_rating` | numeric | 247Sports Composite rating (industry blend). |
| `composite_rating_or_default` | numeric | 247Sports Composite rating, falling back to a default value when unrated. |
| `average_rank` | numeric | Player's average rank across the tracked industry services. |
| `previous_recruitment` | integer | Nested record for the player's previous recruitment (stringified). |
| `primary` | character | Whether this is the player's primary sport. |
| `class_year_override` | character | Override of the player's recruiting class year, when 247Sports reassigns it. |
| `class_year` | character | Recruiting class year. |
| `recruitment` | integer | FK -\> Recruitment aggregate for this player-sport. |
| `primary_institution_prediction` | numeric | Nested leading Crystal Ball institution prediction for the player (stringified). |
| `secondary_institution_prediction` | integer | Nested second-place Crystal Ball institution prediction (stringified). |
| `primary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the leading institution. |
| `show_unranked_rating` | character | 247Sports display flag to show the rating even while the player is unranked. |
| `current_player_sport_year` | numeric | Current ranking-cycle year for the player-sport profile. |
| `unpublished_player_sport_ranking` | numeric | Nested not-yet-published ranking row for the player (stringified). |
| `current_player_sport_ranking` | numeric | Nested current published ranking row for the player (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the player's primary position (stringified). |
| `primary_position` | integer | Player's primary position on the 247Sports profile. |
| `primary_position_group` | integer | Position group the player's primary position belongs to. |
| `default_name` | character | Server-rendered display label for the entity. |
| `star_rating` | integer | Star tier (2-5). |
| `secondary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the second-place institution. |
| `jersey` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_player_search` / `sports247SitePagesPlayerSearch`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `first_name` | character |  |
| `last_name` | character |  |
| `full_name` | character |  |
| `height` | character |  |
| `weight` | numeric |  |
| `bio` | character | Player biography text authored on 247Sports. |
| `scout_evaluation` | character | 247Sports scouting evaluation text for the player. |
| `birthdate` | character |  |
| `modified_user` | character | 247Sports user who last modified the player record. |
| `modified_date` | character | Date the player record was last modified. |
| `cbs_key` | integer | Cross-reference key into the CBS Sports id space. |
| `url` | character |  |
| `last_recruitment_player_institution` | integer | Nested player-institution record from the player's most recent recruitment (stringified). |
| `current_player_institution` | integer | FK -\> PlayerInstitution (current school). |
| `twitter_contact` | integer | Nested 247Sports contact record for the player's Twitter/X account (stringified). |
| `mobile_phone_contact` | character | Player's mobile phone contact field on the 247Sports record. |
| `primary_player_sport` | integer | FK -\> PlayerSport (`/PlayerSport/\{id\}.json`). |
| `primary_recruitment` | integer | Nested 247Sports record for the player's primary recruitment (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `default_asset` | integer | Nested 247Sports image asset for the player's headshot (stringified). |
| `default_asset_url` | character | URL of the player's headshot image. |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the player page (stringified). |
| `quote_asset` | character | Nested 247Sports image asset used alongside the player's quote block (stringified). |
| `user` | character | 247Sports user account linked to the player profile (nested, stringified). |
| `pro_stat_player` | integer | Reference tying the profile to a professional stats player record (247Sports field). |
| `college_stat_player` | integer | Reference tying the profile to a college stats player record (247Sports field). |
| `bio_or_default` | character | Player bio text, falling back to a default blurb when none is authored. |
| `rating` | integer | 247Sports numeric rating (0-1 scale) for the primary sport. |
| `star_rating` | integer | Star tier (2-5) derived from the rating. |
| `national_rank` | integer | Overall national rank in the recruit's class. |
| `position_rank` | integer | Rank within position for the class. |
| `state_rank` | integer | Rank within home state for the class. |
| `hometown_state` | character |  |
| `hometown_city` | character |  |
| `player_high_school_name` | character | Name of the player's high school. |
| `primary_player_position_abbreviation` | character | Abbreviation of the player's primary position. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_playersport` / `sports247SitePagesPlayersport`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `player_institution` | integer | Nested player-institution stint the player-sport profile points to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `sport` | integer | Nested 247Sports sport for the profile (stringified). |
| `rating` | integer | 247Sports rating string (0-1). |
| `rating_or_default` | integer | 247Sports in-house rating, falling back to a default value when unrated. |
| `local_index` | integer | 247Sports' own industry-index value for the player, alongside the Rivals and ESPN indexes. |
| `rivals_grade` | numeric | Rivals source grade (industry composite input). |
| `rivals_rank` | integer | Player's rank in the Rivals industry ranking, as tracked by 247Sports. |
| `rivals_index` | numeric | Rivals index value for the player, as tracked by 247Sports. |
| `espn_grade` | integer | ESPN source grade (industry composite input). |
| `espn_rank` | integer | Player's rank in the ESPN industry ranking, as tracked by 247Sports. |
| `espn_index` | numeric | ESPN index value for the player, as tracked by 247Sports. |
| `composite_strength` | integer | Composite strength points (team-ranking weight). |
| `composite_rating` | numeric | 247Sports Composite rating (industry blend). |
| `composite_rating_or_default` | numeric | 247Sports Composite rating, falling back to a default value when unrated. |
| `average_rank` | numeric | Player's average rank across the tracked industry services. |
| `previous_recruitment` | integer | Nested record for the player's previous recruitment (stringified). |
| `primary` | character | Whether this is the player's primary sport. |
| `class_year_override` | character | Override of the player's recruiting class year, when 247Sports reassigns it. |
| `class_year` | character | Recruiting class year. |
| `recruitment` | integer | FK -\> Recruitment aggregate for this player-sport. |
| `primary_institution_prediction` | numeric | Nested leading Crystal Ball institution prediction for the player (stringified). |
| `secondary_institution_prediction` | integer | Nested second-place Crystal Ball institution prediction (stringified). |
| `primary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the leading institution. |
| `show_unranked_rating` | character | 247Sports display flag to show the rating even while the player is unranked. |
| `current_player_sport_year` | numeric | Current ranking-cycle year for the player-sport profile. |
| `unpublished_player_sport_ranking` | numeric | Nested not-yet-published ranking row for the player (stringified). |
| `current_player_sport_ranking` | numeric | Nested current published ranking row for the player (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the player's primary position (stringified). |
| `primary_position` | integer | Player's primary position on the 247Sports profile. |
| `primary_position_group` | integer | Position group the player's primary position belongs to. |
| `default_name` | character | Server-rendered display label for the entity. |
| `star_rating` | integer | Star tier (2-5). |
| `secondary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the second-place institution. |
| `jersey` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_playersport_institution` / `sports247SitePagesPlayersportInstitution`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `institution` | integer | Nested 247Sports institution for the stint (stringified). |
| `state` | integer | Nested 247Sports state record for the institution's location (stringified). |
| `agent` | character |  |
| `end_year` | integer |  |
| `end_date` | character |  |
| `early_enrollee` | character | Whether the player enrolled early at the institution. |
| `early_signee` | character | Whether the player signed in the early signing period. |
| `height` | numeric |  |
| `weight` | numeric |  |
| `transfer_institution` | character | Nested institution involved in the player's transfer, for transfer-portal stints (stringified). |
| `transfer_season` | character | Season of the player's transfer, when applicable. |
| `transfer_eligibility` | character | Player's eligibility status for the transfer, per 247Sports. |
| `created_date` | character | Date the player-institution record was created. |
| `modified_date` | character | Date the player-institution record was last modified. |
| `lead_expert` | integer | 247Sports expert assigned as the lead on the recruitment (nested, stringified). |
| `player_institution_evaluation` | integer | Nested 247Sports evaluation attached to this player-institution stint (stringified). |
| `primary_player_sport` | integer | Nested 247Sports player-sport profile the stint belongs to (stringified). |
| `default_asset` | integer | Nested 247Sports image asset for the stint (stringified). |
| `hero_asset` | character | Nested 247Sports hero (banner) image asset for the stint (stringified). |
| `primary_recruitment` | integer | Nested 247Sports record for the recruitment behind the stint (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `end_year_or_current` | integer | Stint's end year, or the current year for an active stint. |
| `start_year_or_expected` | integer | Stint's start year, or the expected start year for a future stint. |
| `end_year_or_expected` | integer | Stint's end year, or the expected end year for an active stint. |
| `next_institution_type` | character | Level of the player's next institution (e.g. college, professional), per 247Sports. |
| `next_institution_group` | character | Grouping (e.g. conference/division) of the player's next institution, per 247Sports. |
| `start_year` | integer |  |
| `start_date` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_playersport_rank_history` / `sports247SitePagesPlayersportRankHistory`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `ranking` | integer | FK -\> Ranking snapshot. |
| `sport` | integer | Nested 247Sports sport the ranking row covers (stringified). |
| `player_sport` | integer | Nested player-sport profile the ranking row belongs to (stringified). |
| `committed_institution` | integer | FK -\> committed Institution (null if uncommitted). |
| `order` | integer | Display order of the entry within the 247Sports ranking list. |
| `position` | integer |  |
| `position_group` | integer |  |
| `platoon` | integer | 247Sports platoon (side-of-ball grouping) identifier on the ranking row. |
| `state` | integer | Nested 247Sports state record for the recruit's home state (stringified). |
| `region` | integer | Nested 247Sports region record for the recruit's home region (stringified). |
| `institution` | integer | Nested institution the player was committed or signed to at ranking time (stringified). |
| `institution_group` | character | Grouping (e.g. conference/division) of the player's institution, per 247Sports. |
| `rating` | integer | Nested 247Sports rating record attached to the ranking row (stringified). |
| `composite_strength` | integer | 247Sports field describing the strength of the industry inputs behind the Composite rating. |
| `composite_rating` | numeric | Player's 247Sports Composite rating, blending the major services' ratings. |
| `overall_rank` | integer | Overall national rank in the snapshot. |
| `composite_overall_rank` | integer | Player's national rank by 247Sports Composite rating. |
| `group_rank` | integer |  |
| `composite_group_rank` | integer | Player's rank within their position group by Composite rating. |
| `position_rank` | integer | Rank within position. |
| `previous_player_sport_ranking` | numeric | Nested prior-cycle ranking row for the player (stringified). |
| `composite_position_rank` | integer | Player's rank at their position by Composite rating. |
| `state_rank` | integer | Rank within home state. |
| `composite_state_rank` | integer | Player's rank within their home state by Composite rating. |
| `default_name` | character | Server-rendered display label for the entity. |
| `position_group_rank` | integer | Player's rank within their position group in the 247Sports ranking. |
| `region_rank` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_position_rankings` / `sports247SitePagesPositionRankings`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `ranking` | integer | FK -\> Ranking snapshot. |
| `sport` | integer | Nested 247Sports sport the ranking row covers (stringified). |
| `player_sport` | integer | Nested player-sport profile the ranking row belongs to (stringified). |
| `committed_institution` | integer | FK -\> committed Institution (null if uncommitted). |
| `order` | integer | Display order of the entry within the 247Sports ranking list. |
| `position` | integer |  |
| `position_group` | integer |  |
| `platoon` | integer | 247Sports platoon (side-of-ball grouping) identifier on the ranking row. |
| `state` | integer | Nested 247Sports state record for the recruit's home state (stringified). |
| `region` | integer | Nested 247Sports region record for the recruit's home region (stringified). |
| `institution` | integer | Nested institution the player was committed or signed to at ranking time (stringified). |
| `institution_group` | character | Grouping (e.g. conference/division) of the player's institution, per 247Sports. |
| `rating` | integer | Nested 247Sports rating record attached to the ranking row (stringified). |
| `composite_strength` | integer | 247Sports field describing the strength of the industry inputs behind the Composite rating. |
| `composite_rating` | numeric | Player's 247Sports Composite rating, blending the major services' ratings. |
| `overall_rank` | integer | Overall national rank in the snapshot. |
| `composite_overall_rank` | integer | Player's national rank by 247Sports Composite rating. |
| `group_rank` | integer |  |
| `composite_group_rank` | integer | Player's rank within their position group by Composite rating. |
| `position_rank` | integer | Rank within position. |
| `previous_player_sport_ranking` | numeric | Nested prior-cycle ranking row for the player (stringified). |
| `composite_position_rank` | integer | Player's rank at their position by Composite rating. |
| `state_rank` | integer | Rank within home state. |
| `composite_state_rank` | integer | Player's rank within their home state by Composite rating. |
| `default_name` | character | Server-rendered display label for the entity. |
| `position_group_rank` | integer | Player's rank within their position group in the 247Sports ranking. |
| `region_rank` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruit_interest` / `sports247SitePagesRecruitInterest`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `recruitment` | integer | FK -\> parent Recruitment. |
| `player_sport` | integer | Nested player-sport profile the interest entry belongs to (stringified). |
| `recruit_state` | integer | 247Sports status of the recruit's interest entry for the school (e.g. committed, signed, decommitted). |
| `institution` | integer | FK -\> the interested/interesting Institution. |
| `lock_prediction` | character | Crystal Ball lock-prediction value for the school on this recruitment (247Sports field). |
| `recruits_interest` | character | Recruit's stated interest level in the school, per 247Sports. |
| `primary_coach` | numeric | Lead recruiting coach at the school for this recruit. |
| `secondary_coach` | character | Secondary recruiting coach at the school for this recruit. |
| `keeper_coach` | character | Coach designated as the keeper contact for the recruitment (247Sports field). |
| `institutions_interest` | character | School's interest level in the recruit, per 247Sports. |
| `position` | integer |  |
| `position_group` | integer |  |
| `platoon` | integer | 247Sports platoon (side-of-ball grouping) identifier on the interest entry. |
| `offered` | character | Whether the school has extended an offer. |
| `gray_shirt` | character | Whether the offer or commitment is a grayshirt (delayed enrollment) arrangement. |
| `walk_on` | character | Whether the recruit would join the program as a walk-on. |
| `official_visit` | numeric | Date of the recruit's official visit to the school. |
| `second_official_visit` | character | Date of the recruit's second official visit to the school. |
| `soft_commit` | character | Whether 247Sports marks the commitment as a soft commit. |
| `hard_commit` | numeric | FK -\> the RecruitInterestEvent marking a hard commit. |
| `signing_date` | numeric | Date the recruit signed with the school. |
| `enrollment_date` | numeric | Date the recruit enrolled at the school. |
| `decommit` | character | Date the recruit decommitted from the school, when applicable. |
| `offer` | character | Whether the school has extended a scholarship offer to the recruit. |
| `highest_recruit_interest_event` | numeric | Nested highest-signal event on the interest timeline (e.g. commitment) (stringified). |
| `commit_status` | character | Commitment status label (e.g. Committed, Signed). |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruitment_final_choice` / `sports247SitePagesRecruitmentFinalChoice`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `player_institution` | integer | Nested player-institution stint the player-sport profile points to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `sport` | integer | Nested 247Sports sport for the profile (stringified). |
| `rating` | integer | 247Sports rating string (0-1). |
| `rating_or_default` | integer | 247Sports in-house rating, falling back to a default value when unrated. |
| `local_index` | integer | 247Sports' own industry-index value for the player, alongside the Rivals and ESPN indexes. |
| `rivals_grade` | numeric | Rivals source grade (industry composite input). |
| `rivals_rank` | integer | Player's rank in the Rivals industry ranking, as tracked by 247Sports. |
| `rivals_index` | numeric | Rivals index value for the player, as tracked by 247Sports. |
| `espn_grade` | integer | ESPN source grade (industry composite input). |
| `espn_rank` | integer | Player's rank in the ESPN industry ranking, as tracked by 247Sports. |
| `espn_index` | numeric | ESPN index value for the player, as tracked by 247Sports. |
| `composite_strength` | integer | Composite strength points (team-ranking weight). |
| `composite_rating` | numeric | 247Sports Composite rating (industry blend). |
| `composite_rating_or_default` | numeric | 247Sports Composite rating, falling back to a default value when unrated. |
| `average_rank` | numeric | Player's average rank across the tracked industry services. |
| `previous_recruitment` | integer | Nested record for the player's previous recruitment (stringified). |
| `primary` | character | Whether this is the player's primary sport. |
| `class_year_override` | character | Override of the player's recruiting class year, when 247Sports reassigns it. |
| `class_year` | character | Recruiting class year. |
| `recruitment` | integer | FK -\> Recruitment aggregate for this player-sport. |
| `primary_institution_prediction` | numeric | Nested leading Crystal Ball institution prediction for the player (stringified). |
| `secondary_institution_prediction` | integer | Nested second-place Crystal Ball institution prediction (stringified). |
| `primary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the leading institution. |
| `show_unranked_rating` | character | 247Sports display flag to show the rating even while the player is unranked. |
| `current_player_sport_year` | numeric | Current ranking-cycle year for the player-sport profile. |
| `unpublished_player_sport_ranking` | numeric | Nested not-yet-published ranking row for the player (stringified). |
| `current_player_sport_ranking` | numeric | Nested current published ranking row for the player (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the player's primary position (stringified). |
| `primary_position` | integer | Player's primary position on the 247Sports profile. |
| `primary_position_group` | integer | Position group the player's primary position belongs to. |
| `default_name` | character | Server-rendered display label for the entity. |
| `star_rating` | integer | Star tier (2-5). |
| `secondary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the second-place institution. |
| `jersey` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruitment_institution` / `sports247SitePagesRecruitmentInstitution`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruitment_interests` / `sports247SitePagesRecruitmentInterests`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruitment_offers` / `sports247SitePagesRecruitmentOffers`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `name` | character |  |
| `type` | character | Institution type code (college / pro / high school). |
| `group` | character | Institution group (division/level) bitmask code. |
| `location` | integer | FK -\> Location (`/Institution/\{Location\}/Location.json`). |
| `state` | integer | FK -\> State entity. |
| `latitude` | numeric |  |
| `longitude` | numeric |  |
| `rankable` | character | Whether the institution participates in class rankings. |
| `mascot` | character |  |
| `abbreviation` | character |  |
| `primary_color` | character |  |
| `secondary_color` | character |  |
| `is_foreign` | character | Whether the institution is located outside the United States. |
| `site` | integer | FK -\> team Site (network site key). |
| `default_asset` | numeric | Nested 247Sports image asset for the institution's primary logo (stringified). |
| `alternate_asset` | numeric | Nested 247Sports image asset for the institution's alternate logo (stringified). |
| `light_asset` | numeric | Nested 247Sports image asset for the light-background logo variant (stringified). |
| `default_name` | character | Server-rendered display label for the entity. |
| `address` | character | Institution's street address. |
| `telephone` | character | Institution's telephone number. |
| `website` | character | Institution's website URL. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_recruitment_player_sport` / `sports247SitePagesRecruitmentPlayerSport`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `player_institution` | integer | Nested player-institution stint the player-sport profile points to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `sport` | integer | Nested 247Sports sport for the profile (stringified). |
| `rating` | integer | 247Sports rating string (0-1). |
| `rating_or_default` | integer | 247Sports in-house rating, falling back to a default value when unrated. |
| `local_index` | integer | 247Sports' own industry-index value for the player, alongside the Rivals and ESPN indexes. |
| `rivals_grade` | numeric | Rivals source grade (industry composite input). |
| `rivals_rank` | integer | Player's rank in the Rivals industry ranking, as tracked by 247Sports. |
| `rivals_index` | numeric | Rivals index value for the player, as tracked by 247Sports. |
| `espn_grade` | integer | ESPN source grade (industry composite input). |
| `espn_rank` | integer | Player's rank in the ESPN industry ranking, as tracked by 247Sports. |
| `espn_index` | numeric | ESPN index value for the player, as tracked by 247Sports. |
| `composite_strength` | integer | Composite strength points (team-ranking weight). |
| `composite_rating` | numeric | 247Sports Composite rating (industry blend). |
| `composite_rating_or_default` | numeric | 247Sports Composite rating, falling back to a default value when unrated. |
| `average_rank` | numeric | Player's average rank across the tracked industry services. |
| `previous_recruitment` | integer | Nested record for the player's previous recruitment (stringified). |
| `primary` | character | Whether this is the player's primary sport. |
| `class_year_override` | character | Override of the player's recruiting class year, when 247Sports reassigns it. |
| `class_year` | character | Recruiting class year. |
| `recruitment` | integer | FK -\> Recruitment aggregate for this player-sport. |
| `primary_institution_prediction` | numeric | Nested leading Crystal Ball institution prediction for the player (stringified). |
| `secondary_institution_prediction` | integer | Nested second-place Crystal Ball institution prediction (stringified). |
| `primary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the leading institution. |
| `show_unranked_rating` | character | 247Sports display flag to show the rating even while the player is unranked. |
| `current_player_sport_year` | numeric | Current ranking-cycle year for the player-sport profile. |
| `unpublished_player_sport_ranking` | numeric | Nested not-yet-published ranking row for the player (stringified). |
| `current_player_sport_ranking` | numeric | Nested current published ranking row for the player (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the player's primary position (stringified). |
| `primary_position` | integer | Player's primary position on the 247Sports profile. |
| `primary_position_group` | integer | Position group the player's primary position belongs to. |
| `default_name` | character | Server-rendered display label for the entity. |
| `star_rating` | integer | Star tier (2-5). |
| `secondary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the second-place institution. |
| `jersey` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_season_current_expert_predictions` / `sports247SitePagesSeasonCurrentExpertPredictions`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player_institution` | integer | Nested player-institution stint the Crystal Ball prediction targets (stringified). |
| `institution` | integer | FK -\> predicted destination Institution. |
| `user` | integer | 247Sports user account of the predictor (nested, stringified). |
| `updated_on` | character | Date the prediction was last updated. |
| `prediction_status` | character | Crystal-ball prediction status code. |
| `days_correct` | numeric | Number of days the prediction has stood as correct. |
| `premium` | character |  |
| `score` | numeric | Expert accuracy score at time of prediction. |
| `confidence` | integer | Expert confidence 1-10. |
| `parent` | character | Parent prediction record this entry updates (247Sports field). |
| `is_zero_zone` | character | Whether the prediction fell in 247Sports' zero zone (logged too close to the announcement to earn accuracy credit). |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_season_recruit_interest_events` / `sports247SitePagesSeasonRecruitInterestEvents`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `institution` | integer | Nested 247Sports institution the interest event involves (stringified). |
| `recruitment` | integer | Nested 247Sports recruitment the event belongs to (stringified). |
| `recruit_interest` | integer | Nested recruit-interest record the event belongs to (stringified). |
| `type` | character |  |
| `date` | character | Date of the recruiting-interest event, per 247Sports. |
| `default_name` | integer | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_season_recruit_interests` / `sports247SitePagesSeasonRecruitInterests`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `recruitment` | integer | FK -\> parent Recruitment. |
| `player_sport` | integer | Nested player-sport profile the interest entry belongs to (stringified). |
| `recruit_state` | integer | 247Sports status of the recruit's interest entry for the school (e.g. committed, signed, decommitted). |
| `institution` | integer | FK -\> the interested/interesting Institution. |
| `lock_prediction` | character | Crystal Ball lock-prediction value for the school on this recruitment (247Sports field). |
| `recruits_interest` | character | Recruit's stated interest level in the school, per 247Sports. |
| `primary_coach` | numeric | Lead recruiting coach at the school for this recruit. |
| `secondary_coach` | character | Secondary recruiting coach at the school for this recruit. |
| `keeper_coach` | character | Coach designated as the keeper contact for the recruitment (247Sports field). |
| `institutions_interest` | character | School's interest level in the recruit, per 247Sports. |
| `position` | integer |  |
| `position_group` | integer |  |
| `platoon` | integer | 247Sports platoon (side-of-ball grouping) identifier on the interest entry. |
| `offered` | character | Whether the school has extended an offer. |
| `gray_shirt` | character | Whether the offer or commitment is a grayshirt (delayed enrollment) arrangement. |
| `walk_on` | character | Whether the recruit would join the program as a walk-on. |
| `official_visit` | numeric | Date of the recruit's official visit to the school. |
| `second_official_visit` | character | Date of the recruit's second official visit to the school. |
| `soft_commit` | character | Whether 247Sports marks the commitment as a soft commit. |
| `hard_commit` | numeric | FK -\> the RecruitInterestEvent marking a hard commit. |
| `signing_date` | numeric | Date the recruit signed with the school. |
| `enrollment_date` | numeric | Date the recruit enrolled at the school. |
| `decommit` | character | Date the recruit decommitted from the school, when applicable. |
| `offer` | character | Whether the school has extended a scholarship offer to the recruit. |
| `highest_recruit_interest_event` | numeric | Nested highest-signal event on the interest timeline (e.g. commitment) (stringified). |
| `commit_status` | character | Commitment status label (e.g. Committed, Signed). |
| `default_name` | character | Server-rendered display label for the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_season_recruits` / `sports247SitePagesSeasonRecruits`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player_institution` | integer | Nested player-institution stint behind the recruit row (stringified). |
| `year` | integer |  |
| `announcement_date` | character | Date the recruit announced their decision. |
| `signed_institution` | integer | Nested institution the recruit signed with (stringified). |
| `position` | integer |  |
| `institution` | integer | Nested institution the recruit row is scoped to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `player_sport` | integer | Nested player-sport profile for the recruit (stringified). |
| `composite_strength` | integer | Composite strength points contributed to team ranking. |
| `final_choice` | integer | Whether this entry represents the recruit's final school choice. |
| `highest_recruit_interest_event_type` | character | Type of the highest-signal event on the recruit's interest timeline (e.g. commit, signing). |
| `highest_recruit_interest_event` | integer | Nested highest-signal event on the recruit's interest timeline (stringified). |
| `committed_recruit_interest` | integer | Nested interest record for the school the recruit committed to (stringified). |
| `committed_institution` | integer | FK -\> committed Institution. |
| `highest_recruit_interest` | integer | Nested interest record carrying the recruit's highest interest signal (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the recruit's primary position (stringified). |
| `primary_position` | integer | Recruit's primary position on the 247Sports profile. |
| `default_name` | character | Server-rendered display label for the entity. |
| `commited_institution_team_image` | character | Team image asset for the committed institution (the 'commited' spelling is 247Sports' own field name). |
| `recruit_interest_count` | integer | Number of tracked school interests. |
| `recruit_interests_url` | character | Site URL to the recruit's interest timeline. |
| `player_key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player_first_name` | character |  |
| `player_last_name` | character |  |
| `player_full_name` | character |  |
| `player_height` | character |  |
| `player_weight` | numeric |  |
| `player_bio` | character | Player biography text authored on 247Sports. |
| `player_scout_evaluation` | character | 247Sports scouting evaluation text for the player. |
| `player_birthdate` | character | Player's date of birth, per 247Sports. |
| `player_modified_user` | character | 247Sports user who last modified the player record. |
| `player_modified_date` | character | Date the player record was last modified. |
| `player_cbs_key` | integer | Cross-reference key into the CBS Sports id space. |
| `player_url` | character |  |
| `player_last_recruitment_player_institution` | integer | Nested player-institution record from the player's most recent recruitment (stringified). |
| `player_current_player_institution` | integer | FK -\> PlayerInstitution (current school). |
| `player_twitter_contact` | numeric | Nested 247Sports contact record for the player's Twitter/X account (stringified). |
| `player_mobile_phone_contact` | character | Player's mobile phone contact field on the 247Sports record. |
| `player_primary_player_sport` | integer | FK -\> PlayerSport (`/PlayerSport/\{id\}.json`). |
| `player_primary_recruitment` | integer | Nested 247Sports record for the player's primary recruitment (stringified). |
| `player_default_name` | character | Server-rendered display label for the entity. |
| `player_default_asset` | integer | Nested 247Sports image asset for the player's headshot (stringified). |
| `player_default_asset_url` | character | URL of the player's headshot image. |
| `player_hero_asset` | character | Nested 247Sports hero (banner) image asset for the player page (stringified). |
| `player_quote_asset` | character | Nested 247Sports image asset used alongside the player's quote block (stringified). |
| `player_user` | character | 247Sports user account linked to the player profile (nested, stringified). |
| `player_pro_stat_player` | integer | Reference tying the profile to a professional stats player record (247Sports field). |
| `player_college_stat_player` | integer | Reference tying the profile to a college stats player record (247Sports field). |
| `player_bio_or_default` | character | Player bio text, falling back to a default blurb when none is authored. |
| `player_rating` | integer | 247Sports numeric rating (0-1 scale) for the primary sport. |
| `player_star_rating` | integer | Star tier (2-5) derived from the rating. |
| `player_national_rank` | integer | Overall national rank in the recruit's class. |
| `player_position_rank` | integer | Rank within position for the class. |
| `player_state_rank` | integer | Rank within home state for the class. |
| `player_hometown_state` | character | State of the player's hometown. |
| `player_hometown_city` | character | City of the player's hometown. |
| `player_player_high_school_name` | character | Name of the player's high school. |
| `player_primary_player_position_abbreviation` | character | Abbreviation of the player's primary position. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `sports247_site_pages_season_roster_embed` / `sports247SitePagesSeasonRosterEmbed`

| col_name | type | description |
|---|---|---|
| `key` | integer | Primary key of this entity (the id used in its `.json` route). |
| `player` | integer |  |
| `player_institution` | integer | Nested player-institution stint the player-sport profile points to (stringified). |
| `state` | integer | Home state of the recruit, per 247Sports. |
| `sport` | integer | Nested 247Sports sport for the profile (stringified). |
| `rating` | integer | 247Sports rating string (0-1). |
| `rating_or_default` | integer | 247Sports in-house rating, falling back to a default value when unrated. |
| `local_index` | integer | 247Sports' own industry-index value for the player, alongside the Rivals and ESPN indexes. |
| `rivals_grade` | numeric | Rivals source grade (industry composite input). |
| `rivals_rank` | integer | Player's rank in the Rivals industry ranking, as tracked by 247Sports. |
| `rivals_index` | numeric | Rivals index value for the player, as tracked by 247Sports. |
| `espn_grade` | integer | ESPN source grade (industry composite input). |
| `espn_rank` | integer | Player's rank in the ESPN industry ranking, as tracked by 247Sports. |
| `espn_index` | numeric | ESPN index value for the player, as tracked by 247Sports. |
| `composite_strength` | integer | Composite strength points (team-ranking weight). |
| `composite_rating` | numeric | 247Sports Composite rating (industry blend). |
| `composite_rating_or_default` | numeric | 247Sports Composite rating, falling back to a default value when unrated. |
| `average_rank` | numeric | Player's average rank across the tracked industry services. |
| `previous_recruitment` | integer | Nested record for the player's previous recruitment (stringified). |
| `primary` | character | Whether this is the player's primary sport. |
| `class_year_override` | character | Override of the player's recruiting class year, when 247Sports reassigns it. |
| `class_year` | character | Recruiting class year. |
| `recruitment` | integer | FK -\> Recruitment aggregate for this player-sport. |
| `primary_institution_prediction` | numeric | Nested leading Crystal Ball institution prediction for the player (stringified). |
| `secondary_institution_prediction` | integer | Nested second-place Crystal Ball institution prediction (stringified). |
| `primary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the leading institution. |
| `show_unranked_rating` | character | 247Sports display flag to show the rating even while the player is unranked. |
| `current_player_sport_year` | numeric | Current ranking-cycle year for the player-sport profile. |
| `unpublished_player_sport_ranking` | numeric | Nested not-yet-published ranking row for the player (stringified). |
| `current_player_sport_ranking` | numeric | Nested current published ranking row for the player (stringified). |
| `primary_player_position` | integer | Nested 247Sports record for the player's primary position (stringified). |
| `primary_position` | integer | Player's primary position on the 247Sports profile. |
| `primary_position_group` | integer | Position group the player's primary position belongs to. |
| `default_name` | character | Server-rendered display label for the entity. |
| `star_rating` | integer | Star tier (2-5). |
| `secondary_institution_prediction_percentage` | numeric | Share of Crystal Ball predictions favoring the second-place institution. |
| `jersey` | integer |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/sports247.yaml (vendored from sdv-py) + tools/codegen/endpoints/sports247_site_pages.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
