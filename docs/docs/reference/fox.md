---
title: fox
sidebar_label: fox
sidebar_position: 36
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **An empty or non-JSON 2xx body raises `AssetFetchError`** — An empty 200 or an HTML challenge page is a failed fetch, not `""` / `[]`. Catch `AssetFetchError` (unknown — retry later) apart from `NoDataError` (nothing there). ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))
- **`sdv.fox` is vendored from sdv-py's `fox_api`** — The canonical names are `fox_api_*` / `foxApi*`; every pre-v4 `fox_*` name is a deprecated alias. ([changelog](/CHANGELOG#vendor-pin-81eb7e7060-espn-cdn-fox-statson3-returns-tables-on_missing))

:::


# `fox` — native provider reference

- **namespace:** `sdv.fox` *(standalone — not an ESPN league)*
- **families:** Fox Sports
- **wrappers:** 38 native

`fox` is a cross-sport provider namespace (no ESPN `{sport}`/`{league}` nesting). Every method is exposed under BOTH its snake_case name (`<family>_<endpoint>`, py/R parity) and a camelCase canonical name (`<family><Endpoint>`) on `sdv.fox`. Pass `{ parsed: true }` to any endpoint to get tidy rows instead of raw JSON.

```js
import sdv from 'sportsdataverse';

// Fox Sports uses a public apikey + api-version query pair
// (both default out of the box — override apikey if you have your own):
await sdv.fox.fox_api_scoreboard({ sport: 'cfb' });
```

## Native API — Fox Sports

Flat (non-ESPN) wrappers for the Fox Sports API. Host: `https://api.foxsports.com`. Each method is exposed under BOTH its snake_case name `fox_api_<endpoint>` (sdv-py's name, py/R parity) and its camelCase form (canonical) on `sdv.fox`. Pass `{ parsed: true }` to run the payload through its tidy.js parser; omit it for the raw response.

| Method | HTTP | Path params | Query params | Parser | Auth |
|---|---|---|---|---|---|
| `fox_api_event_data` / `foxApiEventData` *(was `fox_event_data`, `fox_bifrost_event_data`)* | `https://api.foxsports.com/bifrost/v1/{sport}/event/{event_id}/data` | `sport`\*, `event_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_event` | — |
| `fox_api_event_matchup` / `foxApiEventMatchup` *(was `fox_event_matchup`, `fox_bifrost_event_matchup`)* | `https://api.foxsports.com/bifrost/v1/{sport}/event/{event_id}/matchup` | `sport`\*, `event_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_event` | — |
| `fox_api_event_odds` / `foxApiEventOdds` *(was `fox_event_odds`, `fox_bifrost_event_odds`)* | `https://api.foxsports.com/bifrost/v1/{sport}/event/{event_id}/odds` | `sport`\*, `event_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_event_recap` / `foxApiEventRecap` *(was `fox_event_recap`, `fox_bifrost_event_recap`)* | `https://api.foxsports.com/bifrost/v1/{sport}/event/{event_id}/recap` | `sport`\*, `event_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_event_standings` / `foxApiEventStandings` *(was `fox_event_standings`, `fox_bifrost_event_standings`)* | `https://api.foxsports.com/bifrost/v1/{sport}/event/{event_id}/standings` | `sport`\*, `event_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_standings` | — |
| `fox_api_explore_browse` / `foxApiExploreBrowse` *(was `fox_explore_browse`, `fox_bifrost_explore_browse`)* | `https://api.foxsports.com/bifrost/v1/explore/browse/{section}/main` | `section`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_explore_favorite` / `foxExploreFavorite` *(was `fox_bifrost_explore_favorite`)* — **deprecated:** Fox never returned data for this route (sdv-py probe 2026-10-05: 400 for sports/players, 404 for nfl/cfb/teams, with ids/sections taken from a live explore/browse payload); sdv-py dropped it from fox_api (probe record: tools/codegen/endpoints/fox_api.yaml). Use fox_api_explore_browse(). | `https://api.foxsports.com/bifrost/v1/explore/favorite/{section}/main` | `section`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_explore_odds` / `foxApiExploreOdds` *(was `fox_explore_odds`, `fox_bifrost_explore_odds`)* | `https://api.foxsports.com/bifrost/v1/explore/odds/main` | — | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_foxpolls` / `foxApiFoxpolls` *(was `fox_foxpolls`, `fox_bifrost_foxpolls`)* | `https://api.foxsports.com/foxpolls/v1/polls` | — | `apikey`, `associated_entity_ids` → `associatedEntityIds`, `include_answers` → `includeAnswers` | `parse_fox_list` | — |
| `fox_fs_feed` / `foxFsFeed` *(was `fox_bifrost_fs_feed`)* — **deprecated:** Fox answers 404 (fault: Unable to identify proxy for host: secure) for /fs/feed with both the data and the feed key (sdv-py probe 2026-10-05); sdv-py dropped it from fox_api (probe record: tools/codegen/endpoints/fox_api.yaml). | `https://api.foxsports.com/fs/feed` | — | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_fs_images` / `foxFsImages` *(was `fox_bifrost_fs_images`)* — **deprecated:** Fox answers 404 (fault: Unable to identify proxy for host: secure) for /fs/images with both the data and the feed key (sdv-py probe 2026-10-05); sdv-py dropped it from fox_api (probe record: tools/codegen/endpoints/fox_api.yaml). | `https://api.foxsports.com/fs/images` | — | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_fs_layouts` / `foxFsLayouts` *(was `fox_bifrost_fs_layouts`)* — **deprecated:** Fox answers 404 (fault: Unable to identify proxy for host: secure) for /fs/layouts with both the data and the feed key (sdv-py probe 2026-10-05); sdv-py dropped it from fox_api (probe record: tools/codegen/endpoints/fox_api.yaml). | `https://api.foxsports.com/fs/layouts` | — | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_fs_videos` / `foxFsVideos` *(was `fox_bifrost_fs_videos`)* — **deprecated:** Fox answers 404 (fault: Unable to identify proxy for host: secure) for /fs/videos with both the data and the feed key (sdv-py probe 2026-10-05); sdv-py dropped it from fox_api (probe record: tools/codegen/endpoints/fox_api.yaml). | `https://api.foxsports.com/fs/videos` | — | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_league_conferences` / `foxApiLeagueConferences` *(was `fox_league_conferences`, `fox_bifrost_league_conferences`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/conferences` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_league_header` / `foxApiLeagueHeader` *(was `fox_league_header`, `fox_bifrost_league_header`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/header` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_league_odds` / `foxApiLeagueOdds` *(was `fox_league_odds`, `fox_bifrost_league_odds`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/odds` | `sport`\* | `apikey`, `api_version` → `api-version`, `group_id` → `groupId` | `parse_fox_list` | — |
| `fox_api_league_playernews` / `foxApiLeaguePlayernews` *(was `fox_league_playernews`, `fox_bifrost_league_playernews`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/playernews` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_league_polls` / `foxApiLeaguePolls` *(was `fox_league_polls`, `fox_bifrost_league_polls`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/polls` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_standings` | — |
| `fox_api_league_schedule` / `foxApiLeagueSchedule` *(was `fox_league_schedule`, `fox_bifrost_league_schedule`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/schedule` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_scoreboard` | — |
| `fox_api_league_scores` / `foxApiLeagueScores` *(was `fox_league_scores`, `fox_bifrost_league_scores`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/scores` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_scoreboard` | — |
| `fox_api_league_scores_segment` / `foxApiLeagueScoresSegment` *(was `fox_league_scores_segment`, `fox_bifrost_league_scores_segment`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/scores-segment/{segment_id}` | `sport`\*, `segment_id`\* | `apikey`, `api_version` → `api-version`, `group_id` → `groupId` | `parse_fox_scoreboard` | — |
| `fox_api_league_standings` / `foxApiLeagueStandings` *(was `fox_league_standings`, `fox_bifrost_league_standings`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/standings` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_standings` | — |
| `fox_api_league_stats` / `foxApiLeagueStats` *(was `fox_league_stats`, `fox_bifrost_league_stats`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/stats` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_league_stats_con` / `foxApiLeagueStatsCon` *(was `fox_league_stats_con`, `fox_bifrost_league_stats_con`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/stats-con/{who}/{category}/{page}` | `sport`\*, `who`\*, `category`\*, `page`\* | `apikey`, `api_version` → `api-version`, `group_id` → `groupId` | `parse_fox_standings` | — |
| `fox_api_league_teamnav` / `foxApiLeagueTeamnav` *(was `fox_league_teamnav`, `fox_bifrost_league_teamnav`)* | `https://api.foxsports.com/bifrost/v1/{sport}/league/teamnav` | `sport`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_scoreboard` / `foxApiScoreboard` *(was `fox_scoreboard`, `fox_bifrost_scoreboard`)* | `https://api.foxsports.com/bifrost/v1/{sport}/scoreboard/main` | `sport`\* | `apikey`, `api_version` → `api-version`, `group_id` → `groupId` | `parse_fox_scoreboard` | — |
| `fox_api_scorechip` / `foxApiScorechip` *(was `fox_scorechip`, `fox_bifrost_scorechip`)* | `https://api.foxsports.com/bifrost/v1/{sport}/scorechip/{chip_id}` | `sport`\*, `chip_id`\* | `apikey` | `parse_fox_list` | — |
| `fox_api_search_content` / `foxApiSearchContent` *(was `fox_search_content`, `fox_bifrost_search_content`)* | `https://api.foxsports.com/bifrost/v1/search/content` | — | `apikey`, `api_version` → `api-version`, `text` | `parse_fox_search` | — |
| `fox_api_search_entities` / `foxApiSearchEntities` *(was `fox_search_entities`, `fox_bifrost_search_entities`)* | `https://api.foxsports.com/bifrost/v1/search/entities` | — | `apikey`, `api_version` → `api-version`, `text` | `parse_fox_search` | — |
| `fox_api_search_popular` / `foxApiSearchPopular` *(was `fox_search_popular`, `fox_bifrost_search_popular`)* | `https://api.foxsports.com/bifrost/v1/search/popular` | — | `apikey`, `api_version` → `api-version` | `parse_fox_search` | — |
| `fox_api_team_gamelog` / `foxApiTeamGamelog` *(was `fox_team_gamelog`, `fox_bifrost_team_gamelog`)* | `https://api.foxsports.com/bifrost/v1/{sport}/team/{team_id}/gamelog` | `sport`\*, `team_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_team_header` / `foxApiTeamHeader` *(was `fox_team_header`, `fox_bifrost_team_header`)* | `https://api.foxsports.com/bifrost/v1/{sport}/team/{team_id}/header` | `sport`\*, `team_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_team_roster` / `foxApiTeamRoster` *(was `fox_team_roster`, `fox_bifrost_team_roster`)* | `https://api.foxsports.com/bifrost/v1/{sport}/team/{team_id}/roster` | `sport`\*, `team_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_team_roster` | — |
| `fox_api_team_standings` / `foxApiTeamStandings` *(was `fox_team_standings`, `fox_bifrost_team_standings`)* | `https://api.foxsports.com/bifrost/v1/{sport}/team/{team_id}/standings` | `sport`\*, `team_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_standings` | — |
| `fox_api_team_stats` / `foxApiTeamStats` *(was `fox_team_stats`, `fox_bifrost_team_stats`)* | `https://api.foxsports.com/bifrost/v1/{sport}/team/{team_id}/stats` | `sport`\*, `team_id`\* | `apikey`, `api_version` → `api-version` | `parse_fox_list` | — |
| `fox_api_topevents_scoreboard_segment` / `foxApiTopeventsScoreboardSegment` *(was `fox_topevents_scoreboard_segment`, `fox_bifrost_topevents_scoreboard_segment`)* | `https://api.foxsports.com/bifrost/v1/topevents/scoreboard/segment/{segment}` | `segment`\* | `apikey`, `api_version` → `api-version` | `parse_fox_scoreboard` | — |
| `fox_api_trending_articles` / `foxApiTrendingArticles` *(was `fox_trending_articles`, `fox_bifrost_trending_articles`)* | `https://api.foxsports.com/bifrost/v1/general/trending/articles` | — | `apikey`, `api_version` → `api-version`, `duration`, `tags` | `parse_fox_list` | — |
| `fox_api_trending_videos` / `foxApiTrendingVideos` *(was `fox_trending_videos`, `fox_bifrost_trending_videos`)* | `https://api.foxsports.com/bifrost/v1/general/trending/videos` | — | `apikey`, `api_version` → `api-version`, `duration`, `max_items` → `maxItems` | `parse_fox_list` | — |

### Returns — `fox_api_event_data` / `foxApiEventData`

| col_name | type | description |
|---|---|---|
| `id` | character |  |
| `play_description` | character |  |
| `left_team_score_change` | logical |  |
| `right_team_score_change` | logical |  |
| `time_of_play` | character |  |
| `image_url` | character |  |
| `image_type` | character |  |
| `image_alt_text` | character |  |
| `left_team_score` | character |  |
| `right_team_score` | character |  |
| `left_team_abbr` | character |  |
| `right_team_abbr` | character |  |
| `entity_link_title` | character |  |
| `entity_link_web_url` | character |  |
| `entity_link_color` | character |  |
| `entity_link_image_url` | character |  |
| `entity_link_image_type` | character |  |
| `entity_link_image_alt_text` | character |  |
| `entity_link_content_uri` | character |  |
| `entity_link_content_type` | character |  |
| `entity_link_layout_path` | character |  |
| `entity_link_layout_tokens_id` | character |  |
| `entity_link_layout_tokens_content_uri` | character |  |
| `entity_link_analytics_name` | character |  |
| `entity_link_analytics_sport` | character |  |
| `entity_link_type` | character |  |
| `alternate_image_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_event_matchup` / `foxApiEventMatchup`

| col_name | type | description |
|---|---|---|
| `entity_link_title` | character |  |
| `entity_link_web_url` | character |  |
| `entity_link_color` | character |  |
| `entity_link_image_url` | character |  |
| `entity_link_image_type` | character |  |
| `entity_link_image_alt_text` | character |  |
| `entity_link_content_uri` | character |  |
| `entity_link_content_type` | character |  |
| `entity_link_layout_path` | character |  |
| `entity_link_layout_tokens_id` | character |  |
| `entity_link_layout_tokens_content_uri` | character |  |
| `entity_link_analytics_name` | character |  |
| `entity_link_analytics_sport` | character |  |
| `entity_link_type` | character |  |
| `entity_link_alternate_image_url` | character |  |
| `entity_image_url` | character |  |
| `entity_image_alt_url` | character |  |
| `entity_image_type` | character |  |
| `entity_image_alt_text` | character |  |
| `title` | character | Bifrost event_matchup field `title`. |
| `text` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_event_odds` / `foxApiEventOdds`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_event_recap` / `foxApiEventRecap`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_event_standings` / `foxApiEventStandings`

No returns table is published for this endpoint: these columns were written for parse_fox_standings's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_explore_browse` / `foxApiExploreBrowse`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_explore_odds` / `foxApiExploreOdds`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_conferences` / `foxApiLeagueConferences`

| col_name | type | description |
|---|---|---|
| `group` | character |  |
| `fox_id` | character |  |
| `abbreviation` | character |  |
| `name` | character |  |
| `content_uri` | character |  |
| `content_type` | character |  |
| `web_url` | character |  |
| `color` | character |  |
| `logo_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_header` / `foxApiLeagueHeader`

| col_name | type | description |
|---|---|---|
| `template` | character | Bifrost field `template`: template. |
| `title` | character | Bifrost field `title`: title. |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `content_uri` | character | Bifrost field `content_uri`: content URI. |
| `content_type` | character | Bifrost field `content_type`: content type. |
| `color` | character | Bifrost field `color`: color. |
| `logo_url` | character | Bifrost field `logo_url`: logo URL. |
| `image_alt_text` | character | Bifrost field `image_alt_text`: image alt text. |
| `rank` | character |  |
| `details` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_odds` / `foxApiLeagueOdds`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_playernews` / `foxApiLeaguePlayernews`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_polls` / `foxApiLeaguePolls`

| col_name | type | description |
|---|---|---|
| `section` | character |  |
| `ranking` | character |  |
| `v1` | character |  |
| `v2` | character |  |
| `pts` | character |  |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `team` | character |  |
| `rank_change` | integer |  |
| `rpi` | character |  |
| `sos` | character |  |
| `home` | character |  |
| `away` | character |  |
| `neutral` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_schedule` / `foxApiLeagueSchedule`

No returns table is published for this endpoint: these columns were written for parse_fox_scoreboard's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_scores` / `foxApiLeagueScores`

No returns table is published for this endpoint: these columns were written for parse_fox_scoreboard's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_scores_segment` / `foxApiLeagueScoresSegment`

| col_name | type | description |
|---|---|---|
| `segment_id` | character |  |
| `section_id` | character |  |
| `section_title` | character |  |
| `game_id` | character |  |
| `chip_id` | character |  |
| `league` | character |  |
| `date` | character |  |
| `event_status` | integer |  |
| `status` | character |  |
| `tv_station` | character |  |
| `headline` | character |  |
| `odds_line` | character |  |
| `over_under_line` | character |  |
| `home_team` | character |  |
| `home_team_id` | character |  |
| `home_score` | integer |  |
| `home_record` | character |  |
| `away_team` | character |  |
| `away_team_id` | character |  |
| `away_score` | integer |  |
| `away_record` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_standings` / `foxApiLeagueStandings`

| col_name | type | description |
|---|---|---|
| `section` | character |  |
| `afc_east` | character |  |
| `v1` | character |  |
| `w_l_t` | character |  |
| `pct` | character |  |
| `pf` | character |  |
| `pa` | character |  |
| `home` | character |  |
| `away` | character |  |
| `conf` | character |  |
| `div` | character |  |
| `strk` | character |  |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `afc_north` | character |  |
| `afc_south` | character |  |
| `afc_west` | character |  |
| `nfc_east` | character |  |
| `nfc_north` | character |  |
| `nfc_south` | character |  |
| `nfc_west` | character |  |
| `american_football_conference` | character |  |
| `national_football_conference` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_stats` / `foxApiLeagueStats`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_stats_con` / `foxApiLeagueStatsCon`

No returns table is published for this endpoint: these columns were written for parse_fox_standings's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_teamnav` / `foxApiLeagueTeamnav`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_scoreboard` / `foxApiScoreboard`

No returns table is published for this endpoint: these columns were written for parse_fox_scoreboard's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_search_content` / `foxApiSearchContent`

| col_name | type | description |
|---|---|---|
| `group` | character |  |
| `type` | character |  |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `title` | character | Bifrost search_content field `title`. |
| `subtitle` | character |  |
| `content_type` | character |  |
| `content_uri` | character |  |
| `web_url` | character |  |
| `analytics_name` | character |  |
| `image_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_search_entities` / `foxApiSearchEntities`

| col_name | type | description |
|---|---|---|
| `group` | character |  |
| `type` | character |  |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `title` | character | Bifrost search_entities field `title`. |
| `subtitle` | character |  |
| `content_type` | character |  |
| `content_uri` | character |  |
| `web_url` | character |  |
| `analytics_name` | character |  |
| `image_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_search_popular` / `foxApiSearchPopular`

| col_name | type | description |
|---|---|---|
| `group` | character |  |
| `type` | character |  |
| `entity_id` | character | Composite Yahoo id this editorial row was keyed under, surfaced from the collection map key (e.g., "ncaaf.g.202509200023" for a game, "ncaaf.t.29" for a team); always carried as Utf8. |
| `title` | character |  |
| `subtitle` | character |  |
| `content_type` | character |  |
| `content_uri` | character |  |
| `web_url` | character |  |
| `analytics_name` | character |  |
| `image_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_team_gamelog` / `foxApiTeamGamelog`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_team_header` / `foxApiTeamHeader`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_team_roster` / `foxApiTeamRoster`

| col_name | type | description |
|---|---|---|
| `position_group` | character |  |
| `player` | character |  |
| `pos` | character |  |
| `age` | character | Athlete age in years. |
| `ht` | character |  |
| `wt` | character |  |
| `college` | character |  |
| `athlete_id` | character | ESPN numeric identifier for the athlete. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_team_standings` / `foxApiTeamStandings`

No returns table is published for this endpoint: these columns were written for parse_fox_standings's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_team_stats` / `foxApiTeamStats`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_topevents_scoreboard_segment` / `foxApiTopeventsScoreboardSegment`

| col_name | type | description |
|---|---|---|
| `segment_id` | character |  |
| `section_id` | character |  |
| `section_title` | character |  |
| `game_id` | character |  |
| `chip_id` | character |  |
| `league` | character |  |
| `date` | character |  |
| `event_status` | integer |  |
| `status` | character |  |
| `tv_station` | character |  |
| `headline` | character |  |
| `odds_line` | character |  |
| `over_under_line` | character |  |
| `home_team` | character |  |
| `home_team_id` | character |  |
| `home_score` | character |  |
| `home_record` | character |  |
| `away_team` | character |  |
| `away_team_id` | character |  |
| `away_score` | character |  |
| `away_record` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_trending_articles` / `foxApiTrendingArticles`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_trending_videos` / `foxApiTrendingVideos`

| col_name | type | description |
|---|---|---|
| `id` | character |  |
| `spark_id` | character |  |
| `title` | character |  |
| `description` | character |  |
| `content_type` | character |  |
| `component_type` | character |  |
| `publication_date` | character |  |
| `last_published_date` | character |  |
| `canonical_url` | character |  |
| `thumbnail_url` | character |  |
| `playback_url` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/fox.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
