---
title: Site API
sidebar_label: Site API
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


# `nfl` — Site API

24 endpoints on `sdv.nfl`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnNflPlayerBio`

NFL — player bio (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/{athlete_id}/bio`

**Deprecated aliases (pre-v4 names, still callable):** `espn_nfl_athlete_bio` / `espnNflAthleteBio`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflPlayerBio({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_player_bio(...)
```

## `espnNflPlayerInfo`

NFL — player info (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/{athlete_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_nfl_athlete_info` / `espnNflAthleteInfo`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflPlayerInfo({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_player_info(...)
```

## `espnNflPlayerNews`

NFL — player news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/{athlete_id}/news`

**Deprecated aliases (pre-v4 names, still callable):** `espn_nfl_athlete_news` / `espnNflAthleteNews`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_news`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflPlayerNews({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_player_news(...)
```

## `espnNflCalendar`

NFL — calendar (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/calendar`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflCalendar({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_calendar(...)
```

## `espnNflConferences`

NFL — conferences (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/groups`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_groups`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_groups`](../../reference/espn-parsed-returns#parse_groups) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflConferences({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_conferences(...)
```

## `espnNflDraft`

NFL — draft (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/draft`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflDraft({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_draft(...)
```

## `espnNflInjuries`

NFL — injuries (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_injuries`):

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN numeric identifier for the athlete. |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `injuries` | character | Injury entries for the athlete (list of dicts, stringified): status, type, details, dates. |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflInjuries({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_injuries(...)
```

## `espnNflNews`

NFL — news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/news`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `50` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_news`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflNews({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_news(...)
```

## `espnNflScoreboard`

NFL — scoreboard (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

| API param | JS | required | description |
|---|---|---|---|
| `dates` | `dates` | no | `number \| string` — a date `YYYYMMDD`, a range `YYYYMMDD-YYYYMMDD` or a season year `YYYY` |
| `week` | `week` | no | `number \| string` — the week of the season (football) |
| `seasontype` | `season_type` | no | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `groups` | `groups` | no | `number \| string` — an ESPN group (conference / division) id, e.g. `50` for all of men's college basketball |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_scoreboard`):

| col_name | type | description |
|---|---|---|
| `game_id` | character | Ten digit identifier for NFL game. |
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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflScoreboard({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_scoreboard(...)
```

## `espnNflStandings`

NFL — standings (ESPN site.api.espn.com (v2)).

**Endpoint URL:** `GET https://site.api.espn.com/apis/v2/sports/football/nfl/standings`

| API param | JS | required | description |
|---|---|---|---|
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `group` | `group` | no | `number \| string` — an ESPN group (conference / division) id |
| `type` | `standings_type` | no | `number \| string` — the `type` ESPN query parameter |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_standings`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflStandings({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_standings(...)
```

## `espnNflStatisticsLeague`

NFL — statistics league (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/statistics`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflStatisticsLeague({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_statistics_league(...)
```

## `espnNflSummary`

NFL — summary (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary`

| API param | JS | required | description |
|---|---|---|---|
| `event` | `event_id` | no | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |
| — | `section` | no | with `parsed`, return one named sub-frame (e.g. `boxscore`, `plays`, `winprobability`) instead of all |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the `summary` dispatcher returns an object of 21 sub-frames keyed by section (`{ parsed: true, section: '<name>' }` for one); see [ESPN parsed returns](../../reference/espn-parsed-returns#summary-sub-frames).

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflSummary({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_summary(...)
```

## `espnNflTeam`

NFL — team (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeam({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team(...)
```

## `espnNflTeamDepthcharts`

NFL — team depthcharts (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/depthcharts`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamDepthcharts({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_depthcharts(...)
```

## `espnNflTeamHistory`

NFL — team history (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/history`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamHistory({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_history(...)
```

## `espnNflTeamInjuries`

NFL — team injuries (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/injuries`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_injuries`):

| col_name | type | description |
|---|---|---|
| `id` | character | ESPN numeric identifier for the athlete. |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `injuries` | character | Injury entries for the athlete (list of dicts, stringified): status, type, details, dates. |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamInjuries({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_injuries(...)
```

## `espnNflTeamLeaders`

NFL — team leaders (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamLeaders({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_leaders(...)
```

## `espnNflTeamNews`

NFL — team news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/news`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `50` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_news`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamNews({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_news(...)
```

## `espnNflTeamRecord`

NFL — team record (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/record`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamRecord({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_record(...)
```

## `espnNflTeamRoster`

NFL — team roster (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/roster`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_team_roster`):

| col_name | type | description |
|---|---|---|
| `id` | character | ID of the player in the 'name' column. |
| `uid` | character | ESPN universal id for the athlete. |
| `guid` | character |  |
| `alternate_ids_sdr` | character |  |
| `first_name` | character | Athlete's first (given) name. |
| `last_name` | character | Athlete's last (family) name. |
| `full_name` | character | Full name as per NFL.com |
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
| `college_name` | character | Official college (usually the last one attended) |
| `college_short_name` | character |  |
| `college_abbrev` | character |  |
| `college_logos` | character |  |
| `slug` | character | URL slug for the athlete. |
| `headshot_href` | character | Link to ESPN Headshot of Player |
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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamRoster({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_roster(...)
```

## `espnNflTeamSchedule`

NFL — team schedule (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/schedule`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_team_schedule`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_team_schedule`](../../reference/espn-parsed-returns#parse_team_schedule) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamSchedule({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_schedule(...)
```

## `espnNflTeamTransactions`

NFL — team transactions (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/transactions`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamTransactions({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_team_transactions(...)
```

## `espnNflTeamsSite`

NFL — teams site (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTeamsSite({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_teams_site(...)
```

## `espnNflTransactions`

NFL — transactions (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/transactions`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nfl.espnNflTransactions({});
// snake_case alias (py/R parity): sdv.nfl.espn_nfl_transactions(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
