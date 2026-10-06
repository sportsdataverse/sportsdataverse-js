---
title: recruiting
sidebar_label: recruiting
sidebar_position: 33
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


# `recruiting` — native provider reference

- **namespace:** `sdv.recruiting` *(standalone — not an ESPN league)*
- **families:** 247Sports
- **wrappers:** 25 native

`recruiting` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.recruiting`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// DEPRECATED (api.247sports.com answers HTTP 500) — use sdv.sports247.
// 247Sports recruiting rankings (pass your own JWT via `headers`):
await sdv.recruiting.recruiting_rankings({
  sport_key: 'football', year: 2025,
  headers: { Authorization: `Bearer ${process.env.SPORTS247_TOKEN}` },
});
```

## Native API — 247Sports

Flat (non-ESPN) wrappers for the 247Sports recruiting database. Host: `https://api.247sports.com`. Each method is exposed under BOTH its snake_case name `recruiting_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.recruiting`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

:::warning Deprecated

Every method is deprecated: `api.247sports.com` answers HTTP 500. Use [`sdv.sports247`](./sports247) instead — each row below names its replacement; the 13 routes without one need a logged-in 247Sports session.

:::

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `recruiting_archived_player_rankings` / `recruitingArchivedPlayerRankings` *(was `sports247_archived_player_rankings`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/rankings/{ranking_key}/archivedPlayerRankings` | `ranking_key`\* | `page_size` → `pagesize`, `page` | `parse_recruiting_list` | — |
| `recruiting_biggest_movers` / `recruitingBiggestMovers` *(was `sports247_biggest_movers`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/rankings/{ranking_key}/biggestMovers` | `ranking_key`\* | `page_size` → `pageSize` | `parse_recruiting_list` | — |
| `recruiting_coaches` / `recruitingCoaches` *(was `sports247_coaches`)* — **deprecated:** use sdv.sports247.sports247_coaches() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/coaches` | — | `sport_key` → `sportKey`, `year`, `page`, `page_size` → `pageSize` | `parse_recruiting_list` | — |
| `recruiting_current_target_predictions` / `recruitingCurrentTargetPredictions` *(was `sports247_current_target_predictions`)* — **deprecated:** use sdv.sports247.sports247_target_predictions() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/sites/{site_key}/years/{year}/sports/{sport_key}/currentTargetPredictions` | `site_key`\*, `year`\*, `sport_key`\* | `page`, `page_size` → `pageSize` | `parse_recruiting_list` | — |
| `recruiting_institution_groups` / `recruitingInstitutionGroups` *(was `sports247_institution_groups`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/institutionGroups` | — | — | `parse_recruiting_list` | — |
| `recruiting_institution_rankings` / `recruitingInstitutionRankings` *(was `sports247_institution_rankings`)* — **deprecated:** use sdv.sports247.sports247_institution_rankings() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/rankings/{sport_key}/{year}/institutionrankings` | `sport_key`\*, `year`\* | `institution_key` → `institutionKey`, `ranking_type` → `rankingType`, `conference_abbreviation` → `conferenceAbbreviation`, `use_composite` → `useComposite`, `institutions`, `page_size` → `pagesize`, `page` | `parse_recruiting_institution_rankings` | — |
| `recruiting_player_sport_rankings` / `recruitingPlayerSportRankings` *(was `sports247_player_sport_rankings`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/playerSportRankings` | — | `state_abbreviation` → `stateAbbreviation`, `position_abbreviation` → `positionAbbreviation`, `ranking_key` → `rankingKey`, `year`, `sport`, `institution_group` → `institutionGroup`, `player_sport_rating` → `playerSportRating`, `page_size` → `pagesize`, `page` | `parse_recruiting_list` | — |
| `recruiting_players_under_special_evaluation` / `recruitingPlayersUnderSpecialEvaluation` *(was `sports247_players_under_special_evaluation`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/rankings/{ranking_key}/playerSportsUnderSpecialEvaluation` | `ranking_key`\* | — | `parse_recruiting_list` | — |
| `recruiting_positions` / `recruitingPositions` *(was `sports247_positions`)* — **deprecated:** use sdv.sports247.sports247_positions() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/positions` | — | `ranking_key` → `rankingKey`, `sport_key` → `sportKey`, `year` | `parse_recruiting_list` | — |
| `recruiting_rankings` / `recruitingRankings` *(was `sports247_rankings`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/rankings` | — | `year`, `sport_key` → `sportKey`, `ranking_type` → `rankingType`, `ranking_version` → `rankingVersion` | `parse_recruiting_list` | — |
| `recruiting_rankings_composite_team_feed` / `recruitingRankingsCompositeTeamFeed` *(was `sports247_rankings_composite_team_feed`)* — **deprecated:** use sdv.sports247.sports247_composite_team_ranking_feed() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/rankings/{sport_key}/{year}/compositeTeamRankingFeed` | `sport_key`\*, `year`\* | `page_size` → `pageSize` | `parse_recruiting_ranking_feed` | — |
| `recruiting_rankings_transfer_portal_player_feed` / `recruitingRankingsTransferPortalPlayerFeed` *(was `sports247_rankings_transfer_portal_player_feed`)* — **deprecated:** use sdv.sports247.sports247_transfer_portal_player_feed() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/rankings/{sport_key}/{year}/transferPortalPlayerfeed` | `sport_key`\*, `year`\* | `page_size` → `pageSize` | `parse_recruiting_ranking_feed` | — |
| `recruiting_rankings_transfer_portal_team_feed` / `recruitingRankingsTransferPortalTeamFeed` *(was `sports247_rankings_transfer_portal_team_feed`)* — **deprecated:** use sdv.sports247.sports247_transfer_portal_team_feed() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/rankings/{sport_key}/{year}/transferPortalOnlyTeamFeed` | `sport_key`\*, `year`\* | `page_size` → `pageSize` | `parse_recruiting_ranking_feed` | — |
| `recruiting_recruits` / `recruitingRecruits` *(was `sports247_recruits`)* — **deprecated:** use sdv.sports247.sports247_recruits() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/recruits` | — | `sport_key` → `sportKey`, `year`, `min_date` → `minDate`, `page`, `page_size` → `pageSize` | `parse_recruiting_list` | — |
| `recruiting_sport_years` / `recruitingSportYears` *(was `sports247_sport_years`)* — **deprecated:** use sdv.sports247.sports247_sport_years() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/sports/{sport_key}/year` | `sport_key`\* | — | `parse_recruiting_list` | — |
| `recruiting_sports` / `recruitingSports` *(was `sports247_sports`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/sports` | — | `ranking_key` → `rankingKey` | `parse_recruiting_list` | — |
| `recruiting_tags_autocomplete` / `recruitingTagsAutocomplete` *(was `sports247_tags_autocomplete`)* — **deprecated:** use sdv.sports247.sports247_tags_autocomplete() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/tags/autocomplete` | — | `default_name` → `defaultName`, `items` | `parse_recruiting_list` | — |
| `recruiting_tags_photos_by_key` / `recruitingTagsPhotosByKey` *(was `sports247_tags_photos_by_key`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/tags/{prefixed_key}/photos` | `prefixed_key`\* | `page`, `page_size` → `pageSize` | `parse_recruiting_paged_list` | — |
| `recruiting_tags_photos_by_type` / `recruitingTagsPhotosByType` *(was `sports247_tags_photos_by_type`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/tags/{type}/{key}/photos` | `type`\*, `key`\* | `page`, `page_size` → `pageSize` | `parse_recruiting_paged_list` | — |
| `recruiting_teams` / `recruitingTeams` *(was `sports247_teams`)* — **deprecated:** use sdv.sports247.sports247_teams() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/teams` | — | `sport_key` → `sportKey`, `year`, `institution_type` → `institutionType` | `parse_recruiting_list` | — |
| `recruiting_transfer_player_sport_rankings` / `recruitingTransferPlayerSportRankings` *(was `sports247_transfer_player_sport_rankings`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/transferPlayerSportRankings` | — | `state_abbreviation` → `stateAbbreviation`, `position_abbreviation` → `positionAbbreviation`, `ranking_key` → `rankingKey`, `year`, `sport`, `institution_group` → `institutionGroup`, `player_sport_rating` → `playerSportRating`, `page_size` → `pagesize`, `page` | `parse_recruiting_list` | — |
| `recruiting_transfers` / `recruitingTransfers` *(was `sports247_transfers`)* — **deprecated:** use sdv.sports247.sports247_transfers() instead (api.247sports.com answers HTTP 500). | `https://api.247sports.com/rdb/v1/transfers` | — | `sport_key` → `sportKey`, `year`, `list_type` → `listType`, `position_group_key` → `positionGroupKey`, `position_key` → `positionKey`, `eligibility`, `institution_key` → `institutionKey`, `status`, `page_size` → `pageSize`, `page` | `parse_recruiting_list` | — |
| `recruiting_unranked_recruits` / `recruitingUnrankedRecruits` *(was `sports247_unranked_recruits`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/unrankedRecruits` | — | `state_abbreviation` → `stateAbbreviation`, `position_abbreviation` → `positionAbbreviation`, `ranking_key` → `rankingKey`, `year`, `sport`, `institution_group` → `institutionGroup`, `player_sport_rating` → `playerSportRating`, `list_type` → `listType`, `page_size` → `pagesize`, `page` | `parse_recruiting_list` | — |
| `recruiting_unranked_transfers` / `recruitingUnrankedTransfers` *(was `sports247_unranked_transfers`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/transferrankings/{ranking_key}/unrankedtransfers` | `ranking_key`\* | `state_abbreviation` → `stateAbbreviation`, `position_abbreviation` → `positionAbbreviation`, `page_size` → `pagesize`, `page` | `parse_recruiting_list` | — |
| `recruiting_year` / `recruitingYear` *(was `sports247_year`)* — **deprecated:** no sports247 equivalent: this route needs a logged-in 247Sports session (the free guest token is refused) and api.247sports.com answers HTTP 500. | `https://api.247sports.com/rdb/v1/year` | — | `ranking_key` → `rankingKey` | `parse_recruiting_list` | — |

### Returns — `recruiting_archived_player_rankings` / `recruitingArchivedPlayerRankings`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_biggest_movers` / `recruitingBiggestMovers`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_institution_rankings` / `recruitingInstitutionRankings`

| col_name | type | description |
|---|---|---|
| `pagination_count` | numeric | Paging context: count. |
| `pagination_offset` | numeric | Paging context: offset. |
| `pagination_limit` | numeric | Paging context: limit. |
| `pagination_items_per_page` | numeric | Paging context: items per page. |
| `pagination_current_page` | numeric | Paging context: current page. |
| `pagination_page_count` | numeric | Paging context: page count. |
| `name` | character | name of the institution |
| `conference_rank` | numeric | conference Transfer Rank |
| `conference_composite_rank` | numeric | conference Transfer Ranking Composite Rank |
| `rank` | numeric | Transfer Rank |
| `composite_rank` | numeric | Transfer Ranking Composite Rank |
| `institution_key` | numeric | unique identifier of the institution |
| `team_key` | numeric | unique identifier of the team |
| `average_rating` | numeric | average rating |
| `rating` | numeric | team rating |
| `composite_rating` | numeric | team composite rating |
| `average_composite_rating` | numeric | average composite rating |
| `default_asset` | character | institution default logo |
| `alternate_asset` | character | an alternate institution logo |
| `high_school_ranking_position` | numeric | high school rankingposition |
| `transfer_points` | numeric | transfer points for the institution |
| `transfer_number` | numeric | number of transfers for the institution |
| `five_stars` | numeric | five star count |
| `composite_five_stars` | numeric | composite five star count |
| `four_stars` | numeric | four star count |
| `composite_four_stars` | numeric | composite four star count |
| `three_stars` | numeric | three star count |
| `composite_three_stars` | numeric | composite three star count |
| `commits` | numeric | commit count |
| `site_key` | numeric | site key |
| `institution_root_path` | character | Team Site Url |
| `ranking_date` | character | ranking date |
| `city` | character | city |
| `state` | character | state |
| `institution_ranking_url` | character | institution ranking url |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_player_sport_rankings` / `recruitingPlayerSportRankings`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_players_under_special_evaluation` / `recruitingPlayersUnderSpecialEvaluation`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_positions` / `recruitingPositions`

| col_name | type | description |
|---|---|---|
| `key` | numeric | key |
| `position_group_key` | numeric | position group key |
| `name` | character | name |
| `abbreviation` | character | abbreviation |
| `start_year` | numeric | start year |
| `end_year` | numeric | end year |
| `player_positions` | character | player positions |
| `player_sport_rankings` | character | player sport rankings |
| `position_group` | character | position group |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_rankings_composite_team_feed` / `recruitingRankingsCompositeTeamFeed`

| col_name | type | description |
|---|---|---|
| `key` | numeric | unique identifier of the institution |
| `target_institution_logo` | character | institution default logo |
| `target_institution_name` | character | name of the target institution |
| `position` | character | player's position |
| `first_name` | character | player's first name |
| `last_name` | character | player's last name |
| `ranking_position` | numeric | ranking position |
| `previous_institution_name` | character | name of the previous school |
| `previous_institution_logo` | character | name of the previous school logo |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_rankings_transfer_portal_player_feed` / `recruitingRankingsTransferPortalPlayerFeed`

| col_name | type | description |
|---|---|---|
| `key` | numeric | unique identifier of the institution |
| `target_institution_logo` | character | institution default logo |
| `target_institution_name` | character | name of the target institution |
| `position` | character | player's position |
| `first_name` | character | player's first name |
| `last_name` | character | player's last name |
| `ranking_position` | numeric | ranking position |
| `previous_institution_name` | character | name of the previous school |
| `previous_institution_logo` | character | name of the previous school logo |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_rankings_transfer_portal_team_feed` / `recruitingRankingsTransferPortalTeamFeed`

| col_name | type | description |
|---|---|---|
| `key` | numeric | unique identifier of the institution |
| `target_institution_logo` | character | institution default logo |
| `target_institution_name` | character | name of the target institution |
| `position` | character | player's position |
| `first_name` | character | player's first name |
| `last_name` | character | player's last name |
| `ranking_position` | numeric | ranking position |
| `previous_institution_name` | character | name of the previous school |
| `previous_institution_logo` | character | name of the previous school logo |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_sports` / `recruitingSports`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `label` | character | label |
| `value` | character | value |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_tags_autocomplete` / `recruitingTagsAutocomplete`

| col_name | type | description |
|---|---|---|
| `id` | character | id |
| `name` | character | name |
| `type` | character | type |
| `annotation` | character | annotation |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_tags_photos_by_key` / `recruitingTagsPhotosByKey`

| col_name | type | description |
|---|---|---|
| `key` | numeric | key |
| `user_key` | numeric | user key |
| `source_key` | numeric | source key |
| `date` | character | date |
| `name` | character | name |
| `description` | character | description |
| `thumbnail` | character | thumbnail |
| `file_type` | character | file type |
| `height` | numeric | height |
| `width` | numeric | width |
| `duration` | numeric | duration |
| `url` | character | url |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_tags_photos_by_type` / `recruitingTagsPhotosByType`

| col_name | type | description |
|---|---|---|
| `key` | numeric | key |
| `user_key` | numeric | user key |
| `source_key` | numeric | source key |
| `date` | character | date |
| `name` | character | name |
| `description` | character | description |
| `thumbnail` | character | thumbnail |
| `file_type` | character | file type |
| `height` | numeric | height |
| `width` | numeric | width |
| `duration` | numeric | duration |
| `url` | character | url |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_teams` / `recruitingTeams`

| col_name | type | description |
|---|---|---|
| `name` | character | Team Name |
| `team_id` | numeric | Primary key of the team |
| `institution_key` | numeric | Key of the institution |
| `conference` | character | Name of the team's Conference |
| `conference_abbreviation` | character | Abbreviation of the team's Conference |
| `sport` | character | Name of Sport assoicated with the specific Team PK |
| `type` | character | Institutution Type (College or Pro) |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_transfer_player_sport_rankings` / `recruitingTransferPlayerSportRankings`

| col_name | type | description |
|---|---|---|
| `status` | character | status |
| `source` | character | source |
| `destination` | character | destination |
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_unranked_recruits` / `recruitingUnrankedRecruits`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_unranked_transfers` / `recruitingUnrankedTransfers`

| col_name | type | description |
|---|---|---|
| `status` | character | status |
| `source` | character | source |
| `destination` | character | destination |
| `ranking_key` | numeric | ranking key |
| `key` | numeric | key |
| `index` | numeric | index |
| `order` | numeric | order |
| `current_rating` | numeric | current rating |
| `rating` | numeric | rating |
| `current_group_rank` | numeric | current group rank |
| `previous_group_rank` | numeric | previous group rank |
| `current_group_composite_rank` | numeric | current group composite rank |
| `current_overall_rank` | numeric | current overall rank |
| `current_overall_composite_rank` | numeric | current overall composite rank |
| `player_sport_rating` | numeric | player sport rating |
| `under_evaluation` | logical | under evaluation |
| `first_name` | character | first name |
| `last_name` | character | last name |
| `player_key` | numeric | player key |
| `player_institution_key` | numeric | player institution key |
| `position` | character | position |
| `city` | character | city |
| `state` | character | state |
| `current_order` | character | current order |
| `has_eval` | logical | has eval |
| `current_star_rating` | numeric | current star rating |
| `star_rating` | numeric | star rating |
| `player_sport_star_rating` | numeric | player sport star rating |
| `height` | numeric | height |
| `weight` | numeric | weight |
| `move` | numeric | move |
| `current_temp_rank` | numeric | current temp rank |
| `previous_temp_rank` | numeric | previous temp rank |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `recruiting_year` / `recruitingYear`

| col_name | type | description |
|---|---|---|
| `ranking_key` | numeric | ranking key |
| `label` | character | label |
| `value` | character | value |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/recruiting.yaml (JS-owned) — see [How this library is built](/docs/architecture/flat-js-owned)._
