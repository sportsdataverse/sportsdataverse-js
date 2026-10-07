---
title: fox
sidebar_label: fox
sidebar_position: 36
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
| `id` | character | Play sequence id within the game's play-by-play feed, as a string ('1' is the opening play). |
| `play_description` | character | Play text as Fox displays it (e.g. 'Rueben Chinyelu vs. Malachi Moreno (Boogie Fland gains possession)'). |
| `left_team_score_change` | logical | Whether the play changed the left-hand (first-listed) team's score. |
| `right_team_score_change` | logical | Whether the play changed the right-hand (second-listed) team's score. |
| `time_of_play` | character | Game clock when the play occurred, as displayed (e.g. '20:00'). |
| `image_url` | character | URL of the image Fox shows beside the play (a player headshot or team logo), when any. |
| `image_type` | character | Fox image-type label of image_url (e.g. 'image-logo', 'image-headshot'). |
| `image_alt_text` | character | Alt text of image_url. |
| `left_team_score` | character | Left-hand team's score after the play, as a string. |
| `right_team_score` | character | Right-hand team's score after the play, as a string. |
| `left_team_abbr` | character | Left-hand team's abbreviation. |
| `right_team_abbr` | character | Right-hand team's abbreviation. |
| `entity_link_title` | character | Display title of the entity (player or team) Fox links the play to. |
| `entity_link_web_url` | character | Site-relative foxsports.com path of the linked entity's page. |
| `entity_link_color` | character | Fox color token of the linked entity ('\<alpha\>, \<r\>, \<g\>, \<b\>' as decimal components). |
| `entity_link_image_url` | character | Image URL of the linked entity (headshot or logo). |
| `entity_link_image_type` | character | Fox image-type label of entity_link_image_url. |
| `entity_link_image_alt_text` | character | Alt text of entity_link_image_url. |
| `entity_link_content_uri` | character | Fox Bifrost content URI of the linked entity (e.g. 'basketball/cbk/athletes/12345'); its trailing number is the Fox id. |
| `entity_link_content_type` | character | Fox entity type of the linked entity (e.g. 'player', 'team'). |
| `entity_link_layout_path` | character | Fox app layout path used to render the linked entity's page. |
| `entity_link_layout_tokens_id` | character | Fox id token the layout path is filled with. |
| `entity_link_layout_tokens_content_uri` | character | Content URI token the layout path is filled with (same as entity_link_content_uri). |
| `entity_link_analytics_name` | character | Analytics name Fox tags the linked entity with. |
| `entity_link_analytics_sport` | character | Analytics sport slug Fox tags the linked entity with. |
| `entity_link_type` | character | Fox link type of the entity link (e.g. 'entity'). |
| `alternate_image_url` | character | Alternate image URL for the play (e.g. the other team's logo), when any. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_event_matchup` / `foxApiEventMatchup`

| col_name | type | description |
|---|---|---|
| `entity_link_title` | character | Display title of the player or team the insight is about. |
| `entity_link_web_url` | character | Site-relative foxsports.com path of the linked entity's page. |
| `entity_link_color` | character | Fox color token of the linked entity ('\<alpha\>, \<r\>, \<g\>, \<b\>' as decimal components). |
| `entity_link_image_url` | character | Image URL of the linked entity (headshot or logo). |
| `entity_link_image_type` | character | Fox image-type label of entity_link_image_url. |
| `entity_link_image_alt_text` | character | Alt text of entity_link_image_url. |
| `entity_link_content_uri` | character | Fox Bifrost content URI of the linked entity; its trailing number is the Fox id. |
| `entity_link_content_type` | character | Fox entity type of the linked entity (e.g. 'player', 'team'). |
| `entity_link_layout_path` | character | Fox app layout path used to render the linked entity's page. |
| `entity_link_layout_tokens_id` | character | Fox id token the layout path is filled with. |
| `entity_link_layout_tokens_content_uri` | character | Content URI token the layout path is filled with. |
| `entity_link_analytics_name` | character | Analytics name Fox tags the linked entity with. |
| `entity_link_analytics_sport` | character | Analytics sport slug Fox tags the linked entity with. |
| `entity_link_type` | character | Fox link type of the entity link (e.g. 'entity'). |
| `entity_link_alternate_image_url` | character | Alternate image URL of the linked entity, when any. |
| `entity_image_url` | character | Image URL Fox shows for the insight's entity. |
| `entity_image_alt_url` | character | Alternate image URL for the insight's entity, when any. |
| `entity_image_type` | character | Fox image-type label of entity_image_url. |
| `entity_image_alt_text` | character | Alt text of entity_image_url. |
| `title` | character | Bifrost event_matchup field `title`. |
| `text` | character | Body text of the matchup insight. |

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
| `group` | character | Title of the conference group the row sits in on Fox's conference picker. |
| `fox_id` | character | Fox conference id as a string, the trailing number of content_uri; ids are assigned per feed and can differ between the men's and women's feeds. |
| `abbreviation` | character | Conference abbreviation as Fox displays it. |
| `name` | character | Conference display name (e.g. 'Atlantic Coast'). |
| `content_uri` | character | Fox Bifrost content URI identifying the conference (e.g. 'basketball/cbk/groups/11'). |
| `content_type` | character | Fox entity type of the row; 'group' for a conference. |
| `web_url` | character | Site-relative foxsports.com path of the conference's page. |
| `color` | character | Fox color token of the conference ('\<alpha\>, \<r\>, \<g\>, \<b\>' as decimal components), when any. |
| `logo_url` | character | Conference logo URL on the Fox CDN. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_header` / `foxApiLeagueHeader`

| col_name | type | description |
|---|---|---|
| `template` | character | Bifrost field `template`: template. |
| `title` | character | Bifrost field `title`: title. |
| `entity_id` | character | Fox id of the league as a string, the trailing number of content_uri. |
| `content_uri` | character | Bifrost field `content_uri`: content URI. |
| `content_type` | character | Bifrost field `content_type`: content type. |
| `color` | character | Bifrost field `color`: color. |
| `logo_url` | character | Bifrost field `logo_url`: logo URL. |
| `image_alt_text` | character | Bifrost field `image_alt_text`: image alt text. |
| `rank` | character | Rank text shown in the header; populated for team headers, null for a league header. |
| `details` | character | JSON-encoded list of detail strings Fox shows under the title (e.g. the current week and date range). |

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
| `section` | character | Title of the poll the row came from (e.g. 'ASSOCIATED PRESS', 'COACHES POLL'). |
| `ranking` | character | Team's position in the poll, as a string from the RANKING cell. |
| `v1` | character | Rank-movement magnitude from the unlabeled change cell (e.g. '2'); the direction is in rank_change. Named v1 because the header cell is blank. |
| `v2` | character | Team name as Fox prints it, with first-place votes in parentheses when it got any (e.g. 'Michigan (57)'). Named v2 because the header cell is blank. |
| `pts` | character | Poll points as a string from the PTS cell. |
| `entity_id` | character | Fox id of the team as a string, the trailing number of the row's entity link. |
| `team` | character | Team name from the entity cell (same text as v2). |
| `rank_change` | integer | Signed places moved since the previous poll (positive = up), parsed from the change cell's direction and number; null when unchanged. |
| `rpi` | character | RPI value as a decimal string; populated only on RPI-ranking rows, null on poll rows. |
| `sos` | character | Strength-of-schedule value as a string; populated only on RPI-ranking rows. |
| `home` | character | Home record as a 'W-L' string; populated only on RPI-ranking rows. |
| `away` | character | Away record as a 'W-L' string; populated only on RPI-ranking rows. |
| `neutral` | character | Neutral-site record as a 'W-L' string; populated only on RPI-ranking rows. |

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
| `segment_id` | character | Fox scoreboard segment the game was fetched from (e.g. '\{season\}-\{week\}-1'); null when the segment feed does not echo it. |
| `section_id` | character | Id of the section within the segment that listed the game. |
| `section_title` | character | Title of the section that listed the game (e.g. 'WEEK 3'); often null. |
| `game_id` | character | Fox game id as a string, from the event's layout token or content URI. |
| `chip_id` | character | Fox score-chip id of the game. |
| `league` | character | Fox league slug of the game (e.g. 'nfl', 'cfb'). |
| `date` | character | Scheduled start of the game, an ISO-8601 UTC string. |
| `event_status` | integer | Fox numeric event-status code (1 = pre-game, 2 = in progress, 3 = final). |
| `status` | character | Status line as displayed (e.g. 'FINAL', 'SUN 1:00 PM'). |
| `tv_station` | character | Broadcast network, when listed. |
| `headline` | character | Event headline Fox attaches to the game, when any. |
| `odds_line` | character | Point-spread line as displayed (e.g. 'KC -3.5'), when listed. |
| `over_under_line` | character | Over/under total as displayed (e.g. 'O/U 47.5'), when listed. |
| `home_team` | character | Home team's full name. |
| `home_team_id` | character | Fox id of the home team as a string. |
| `home_score` | integer | Home team's score (integer; null before the game). |
| `home_record` | character | Home team's record string as displayed. |
| `away_team` | character | Away team's full name. |
| `away_team_id` | character | Fox id of the away team as a string. |
| `away_score` | integer | Away team's score (integer; null before the game). |
| `away_record` | character | Away team's record string as displayed. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_league_standings` / `foxApiLeagueStandings`

| col_name | type | description |
|---|---|---|
| `section` | character | Title of the standings section the row came from (e.g. 'DIVISION', 'CONFERENCE'). |
| `afc_east` | character | Team's position in the AFC East table, as a string; null on rows from every other table (each table's first column is named from its header cell). |
| `v1` | character | Team nickname as Fox displays it (e.g. 'Bills'); named v1 because the header cell is blank. |
| `w_l_t` | character | Record as a 'W-L-T' string with the tie count shown only when nonzero (e.g. '3-1', '1-1-1'). |
| `pct` | character | Winning percentage as a decimal string (e.g. '.750'). |
| `pf` | character | Points for, as a string. |
| `pa` | character | Points against, as a string. |
| `home` | character | Home record as a 'W-L' string. |
| `away` | character | Away record as a 'W-L' string. |
| `conf` | character | Record against conference opponents as a 'W-L' string. |
| `div` | character | Record against division opponents as a 'W-L' string. |
| `strk` | character | Current streak as displayed (e.g. 'W2', 'L1'). |
| `entity_id` | character | Fox id of the team as a string, the trailing number of the row's entity link. |
| `afc_north` | character | Team's position in the AFC North table, as a string; null on rows from every other table. |
| `afc_south` | character | Team's position in the AFC South table, as a string; null on rows from every other table. |
| `afc_west` | character | Team's position in the AFC West table, as a string; null on rows from every other table. |
| `nfc_east` | character | Team's position in the NFC East table, as a string; null on rows from every other table. |
| `nfc_north` | character | Team's position in the NFC North table, as a string; null on rows from every other table. |
| `nfc_south` | character | Team's position in the NFC South table, as a string; null on rows from every other table. |
| `nfc_west` | character | Team's position in the NFC West table, as a string; null on rows from every other table. |
| `american_football_conference` | character | Team's position in the AFC conference table, as a string; null on rows from every other table. |
| `national_football_conference` | character | Team's position in the NFC conference table, as a string; null on rows from every other table. |

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
| `group` | character | Title of the result group the row sits in (e.g. 'ARTICLES', 'VIDEOS'). |
| `type` | character | Fox result type of the row. |
| `entity_id` | character | Fox id of the result as a string, the trailing number of content_uri. |
| `title` | character | Bifrost search_content field `title`. |
| `subtitle` | character | Secondary line Fox shows under the title (e.g. a date or a player's team and position). |
| `content_type` | character | Fox content type of the result (e.g. 'article', 'video'). |
| `content_uri` | character | Fox Bifrost content URI of the result. |
| `web_url` | character | Site-relative foxsports.com path of the result. |
| `analytics_name` | character | Analytics name Fox tags the result with. |
| `image_url` | character | Thumbnail or logo URL of the result. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_search_entities` / `foxApiSearchEntities`

| col_name | type | description |
|---|---|---|
| `group` | character | Title of the entity group the row sits in (e.g. 'TEAMS', 'PLAYERS'). |
| `type` | character | Fox entity type of the row. |
| `entity_id` | character | Fox id of the entity as a string, the trailing number of content_uri. |
| `title` | character | Bifrost search_entities field `title`. |
| `subtitle` | character | Secondary line Fox shows under the title (e.g. a player's team and position, or a team's league). |
| `content_type` | character | Fox content type of the entity (e.g. 'team', 'player'). |
| `content_uri` | character | Fox Bifrost content URI of the entity. |
| `web_url` | character | Site-relative foxsports.com path of the entity's page. |
| `analytics_name` | character | Analytics name Fox tags the entity with. |
| `image_url` | character | Headshot or logo URL of the entity. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_search_popular` / `foxApiSearchPopular`

| col_name | type | description |
|---|---|---|
| `group` | character | Title of the popular-search group the row sits in. |
| `type` | character | Fox entity type of the row. |
| `entity_id` | character | Fox id of the entity as a string, the trailing number of content_uri. |
| `title` | character | Display title of the popular search entry. |
| `subtitle` | character | Secondary line Fox shows under the title, when any. |
| `content_type` | character | Fox content type of the entry (e.g. 'team', 'player', 'league'). |
| `content_uri` | character | Fox Bifrost content URI of the entry. |
| `web_url` | character | Site-relative foxsports.com path of the entry's page. |
| `analytics_name` | character | Analytics name Fox tags the entry with. |
| `image_url` | character | Headshot or logo URL of the entry. |

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
| `position_group` | character | Roster table the player came from, named from its header (e.g. 'OFFENSE', 'DEFENSE', 'SPECIAL TEAMS'). |
| `player` | character | Player's display name from the first column. |
| `pos` | character | Position abbreviation from the POS column (e.g. 'WR'). |
| `age` | character | Athlete age in years. |
| `ht` | character | Height as displayed in the HT column (feet-inches, e.g. 6'0"). |
| `wt` | character | Weight as displayed in the WT column (e.g. '190 lbs'). |
| `college` | character | College from the COLLEGE column. |
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
| `segment_id` | character | Fox scoreboard segment the game was fetched from; null when the segment feed does not echo it. |
| `section_id` | character | Id of the section within the segment that listed the game. |
| `section_title` | character | Title of the section that listed the game; often null. |
| `game_id` | character | Fox game id as a string, from the event's layout token or content URI. |
| `chip_id` | character | Fox score-chip id of the game. |
| `league` | character | Fox league slug of the game (e.g. 'nfl', 'cbk'). |
| `date` | character | Scheduled start of the game, an ISO-8601 UTC string. |
| `event_status` | integer | Fox numeric event-status code (1 = pre-game, 2 = in progress, 3 = final). |
| `status` | character | Status line as displayed (e.g. 'FINAL', 'SUN 1:00 PM'). |
| `tv_station` | character | Broadcast network, when listed. |
| `headline` | character | Event headline Fox attaches to the game, when any. |
| `odds_line` | character | Point-spread line as displayed, when listed. |
| `over_under_line` | character | Over/under total as displayed, when listed. |
| `home_team` | character | Home team's full name. |
| `home_team_id` | character | Fox id of the home team as a string. |
| `home_score` | character | Home team's score as a string; null before the game. |
| `home_record` | character | Home team's record string as displayed. |
| `away_team` | character | Away team's full name. |
| `away_team_id` | character | Fox id of the away team as a string. |
| `away_score` | character | Away team's score as a string; null before the game. |
| `away_record` | character | Away team's record string as displayed. |

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_trending_articles` / `foxApiTrendingArticles`

No returns table is published for this endpoint: these columns were written for parse_fox_list's output before it was ported to sdv-py's row builders (4.0.0) and no committed capture of this endpoint confirms them (tools/codegen/regen-capture-schemas.mjs)

_Rows are untyped `Row[]` (not parity-verified yet)._

### Returns — `fox_api_trending_videos` / `foxApiTrendingVideos`

| col_name | type | description |
|---|---|---|
| `id` | character | Fox CMS id of the video. |
| `spark_id` | character | Fox Spark (video platform) id of the video. |
| `title` | character | Headline title of the video as published by Fox. |
| `description` | character | Video description, falling back to the dek or meta description. |
| `content_type` | character | Fox CMS content type of the item (e.g. 'video'). |
| `component_type` | character | Fox CMS component type the item renders as. |
| `publication_date` | character | First publication timestamp (ISO-8601). |
| `last_published_date` | character | Most recent publication timestamp (ISO-8601). |
| `canonical_url` | character | Canonical foxsports.com URL of the video. |
| `thumbnail_url` | character | Thumbnail image URL of the video. |
| `playback_url` | character | Playback (stream) URL of the video. |

_Rows are untyped `Row[]` (not parity-verified yet)._

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/fox.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/flat-vendored)._
