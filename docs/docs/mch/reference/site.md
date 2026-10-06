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


# `mch` — Site API

24 endpoints on `sdv.mch`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnMchPlayerBio`

MCH — player bio (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/athletes/{athlete_id}/bio`

**Deprecated aliases (pre-v4 names, still callable):** `espn_mch_athlete_bio` / `espnMchAthleteBio`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchPlayerBio({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_player_bio(...)
```

## `espnMchPlayerInfo`

MCH — player info (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/athletes/{athlete_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_mch_athlete_info` / `espnMchAthleteInfo`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchPlayerInfo({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_player_info(...)
```

## `espnMchPlayerNews`

MCH — player news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/athletes/{athlete_id}/news`

**Deprecated aliases (pre-v4 names, still callable):** `espn_mch_athlete_news` / `espnMchAthleteNews`

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
await sdv.mch.espnMchPlayerNews({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_player_news(...)
```

## `espnMchCalendar`

MCH — calendar (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/calendar`

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
await sdv.mch.espnMchCalendar({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_calendar(...)
```

## `espnMchConferences`

MCH — conferences (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/groups`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_groups`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_groups`](../../reference/espn-parsed-returns#parse_groups) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchConferences({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_conferences(...)
```

## `espnMchDraft`

MCH — draft (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/draft`

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
await sdv.mch.espnMchDraft({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_draft(...)
```

## `espnMchInjuries`

MCH — injuries (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/injuries`

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
await sdv.mch.espnMchInjuries({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_injuries(...)
```

## `espnMchNews`

MCH — news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/news`

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
await sdv.mch.espnMchNews({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_news(...)
```

## `espnMchScoreboard`

MCH — scoreboard (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/scoreboard`

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
| `game_id` | character | Unique game identifier. |
| `uid` | character | Competitor uid string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season type slug. |
| `status_type_id` | character | Status type identifier. |
| `status_type_name` | character | Status type name. |
| `status_type_state` | character | Status state (pre/in/post). |
| `status_type_completed` | logical | Whether the game is complete. |
| `status_type_description` | character | Status description. |
| `status_type_detail` | character | Status detail text. |
| `status_type_short_detail` | character | Short status detail. |
| `status_clock` | integer | Game clock in seconds as ESPN reports it: time remaining in the period for clock sports, elapsed seconds for soccer (e.g. 5400.0 at full time); 0.0 once a game has ended. |
| `status_display_clock` | character | Display clock string. |
| `status_period` | integer | Current or final period number (quarter, half, inning or period, depending on the sport). |
| `neutral_site` | logical | Whether the match is played at a neutral venue. |
| `conference_competition` | logical | Whether it is a conference competition. |
| `attendance` | integer | Game attendance. |
| `venue_id` | character | Venue identifier. |
| `venue_full_name` | character | Venue full name. |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state. |
| `venue_indoor` | logical | Whether the venue is indoors. |
| `broadcast` | character | Broadcast network(s). |
| `note` | character | Event note text from the competition (e.g. a series or game label such as 'World Series - Game 1', or a shootout result); an empty string when there is none. |
| `home_id` | character | Home team ESPN identifier. |
| `home_name` | character | Home team display name. |
| `home_abbreviation` | character | Home team abbreviation. |
| `home_display_name` | character | Home team display name. |
| `home_location` | character | Home team city. |
| `home_color` | character | Home team primary color hex. |
| `home_alternate_color` | character | Home team alternate color hex. |
| `home_logo` | character | Home team logo URL. |
| `home_score` | character | Home team's score. For cricket, the innings string (e.g. '161/5 (18/20 ov, target 156)'). |
| `home_winner` | logical | Whether the home team won. |
| `home_rank` | character | Home team rank (if ranked). |
| `away_id` | character | Away team ESPN identifier. |
| `away_name` | character | Away team display name. |
| `away_abbreviation` | character | Away team abbreviation. |
| `away_display_name` | character | Away team display name. |
| `away_location` | character | Away team city. |
| `away_color` | character | Away team primary color hex. |
| `away_alternate_color` | character | Away team alternate color hex. |
| `away_logo` | character | Away team logo URL. |
| `away_score` | character | Away team's score. For cricket, the innings string. |
| `away_winner` | logical | Whether the away team won. |
| `away_rank` | character | Away team rank (if ranked). |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchScoreboard({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_scoreboard(...)
```

## `espnMchStandings`

MCH — standings (ESPN site.api.espn.com (v2)).

**Endpoint URL:** `GET https://site.api.espn.com/apis/v2/sports/hockey/mens-college-hockey/standings`

| API param | JS | required | description |
|---|---|---|---|
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `group` | `group` | no | `number \| string` — an ESPN group (conference / division) id |
| `type` | `standings_type` | no | `number \| string` — the `type` ESPN query parameter |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_standings`):

| col_name | type | description |
|---|---|---|
| `group_name` | character | Group name (conference / division). |
| `group_abbreviation` | character | Group abbreviation. |
| `team_id` | character | ESPN team id |
| `team_name` | character | Team name. |
| `team_abbreviation` | character | Team abbreviation |
| `team_display_name` | character | Team display name |
| `team_location` | character | Team city/location. |
| `team_logo` | character | URL to the team logo image. |
| `avg_points_against` | number |  |
| `avg_points_for` | number |  |
| `clincher` | integer |  |
| `differential` | integer |  |
| `division_win_percent` | number |  |
| `games_behind` | integer |  |
| `league_win_percent` | number |  |
| `losses` | integer | Number of matches the team has lost. |
| `playoff_seed` | integer | Current playoff seed. |
| `point_differential` | integer | Goal difference (for minus against). |
| `points` | integer | Competition points. |
| `points_against` | integer | Goals conceded. |
| `points_for` | integer | Goals (or runs) scored by the team. |
| `streak` | integer | Current streak value. |
| `win_percent` | number |  |
| `wins` | integer | Number of matches the team has won. |
| `games_ahead` | integer |  |
| `overall` | character | Overall record summary as published by ESPN. |
| `home` | character | Whether the player's team was home. |
| `road` | character |  |
| `vs_div` | character |  |
| `vs_conf` | character |  |
| `last_ten_games` | character |  |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchStandings({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_standings(...)
```

## `espnMchStatisticsLeague`

MCH — statistics league (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/statistics`

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
await sdv.mch.espnMchStatisticsLeague({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_statistics_league(...)
```

## `espnMchSummary`

MCH — summary (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/summary`

| API param | JS | required | description |
|---|---|---|---|
| `event` | `event_id` | no | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |
| — | `section` | no | with `parsed`, return one named sub-frame (e.g. `boxscore`, `plays`, `winprobability`) instead of all |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the `summary` dispatcher returns an object of 21 sub-frames keyed by section (`{ parsed: true, section: '<name>' }` for one); see [ESPN parsed returns](../../reference/espn-parsed-returns#summary-sub-frames).

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchSummary({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_summary(...)
```

## `espnMchTeam`

MCH — team (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchTeam({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team(...)
```

## `espnMchTeamDepthcharts`

MCH — team depthcharts (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/depthcharts`

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
await sdv.mch.espnMchTeamDepthcharts({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_depthcharts(...)
```

## `espnMchTeamHistory`

MCH — team history (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/history`

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
await sdv.mch.espnMchTeamHistory({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_history(...)
```

## `espnMchTeamInjuries`

MCH — team injuries (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/injuries`

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
await sdv.mch.espnMchTeamInjuries({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_injuries(...)
```

## `espnMchTeamLeaders`

MCH — team leaders (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/leaders`

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
await sdv.mch.espnMchTeamLeaders({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_leaders(...)
```

## `espnMchTeamNews`

MCH — team news (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/news`

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
await sdv.mch.espnMchTeamNews({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_news(...)
```

## `espnMchTeamRecord`

MCH — team record (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/record`

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
await sdv.mch.espnMchTeamRecord({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_record(...)
```

## `espnMchTeamRoster`

MCH — team roster (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/roster`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_team_roster`):

| col_name | type | description |
|---|---|---|
| `id` | character | Unique player identifier. |
| `uid` | character | ESPN universal id for the athlete. |
| `guid` | character | Athlete global unique identifier. |
| `alternate_ids_sdr` | character | Alternate ids sdr. |
| `first_name` | character | Athlete's first (given) name. |
| `last_name` | character | Athlete's last (family) name. |
| `full_name` | character | Player full name. |
| `display_name` | character | Athlete's full display name as shown on ESPN. |
| `short_name` | character | Athlete's abbreviated display name (e.g. 'L. James'). |
| `weight` | integer | Athlete weight in pounds. |
| `display_weight` | character | Athlete weight, formatted for display. |
| `height` | integer | Athlete height in inches. |
| `display_height` | character | Athlete height, formatted for display. |
| `age` | integer | Athlete age in years. |
| `date_of_birth` | character | Athlete date of birth (ISO 8601). |
| `debut_year` | integer | Year of NHL debut. |
| `links` | character |  |
| `birth_place_city` | character | Birth place city. |
| `birth_place_country` | character | Birth place country. |
| `college_id` | character | College identifier. |
| `college_guid` | character | College guid. |
| `college_mascot` | character | College mascot. |
| `college_name` | character | College name. |
| `college_short_name` | character | College short name. |
| `college_abbrev` | character | College abbreviation. |
| `college_logos` | character | College logo URLs (pipe-delimited). |
| `slug` | character | URL slug for the athlete. |
| `headshot_href` | character | Player headshot image URL. |
| `headshot_alt` | character | Headshot alt text. |
| `jersey` | character | Athlete's jersey number as a string. |
| `position_id` | character | Official position identifier. |
| `position_name` | character | Full position name (e.g. 'Point Guard', 'Goalkeeper'). |
| `position_display_name` | character | Position display name. |
| `position_abbreviation` | character | Position abbreviation. |
| `position_leaf` | logical | Whether position is a leaf node. |
| `injuries` | character |  |
| `teams` | character |  |
| `contracts` | character |  |
| `experience_years` | integer | Experience years. |
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
| `status_id` | character | Status identifier. |
| `status_name` | character | Status name. |
| `status_type` | character | Status type. |
| `status_abbreviation` | character | Status abbreviation. |
| `citizenship` | character | Athlete citizenship. |
| `birth_place_state` | character | Birth place state. |
| `hand_type` | character | Shooting/catching hand type. |
| `hand_abbreviation` | character | Hand abbreviation. |
| `hand_display_value` | character | Hand display value. |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchTeamRoster({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_roster(...)
```

## `espnMchTeamSchedule`

MCH — team schedule (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/schedule`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_team_schedule`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_team_schedule`](../../reference/espn-parsed-returns#parse_team_schedule) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchTeamSchedule({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_schedule(...)
```

## `espnMchTeamTransactions`

MCH — team transactions (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams/{team_id}/transactions`

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
await sdv.mch.espnMchTeamTransactions({ team_id: '…' });
// snake_case alias (py/R parity): sdv.mch.espn_mch_team_transactions(...)
```

## `espnMchTeamsSite`

MCH — teams site (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mch.espnMchTeamsSite({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_teams_site(...)
```

## `espnMchTransactions`

MCH — transactions (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/hockey/mens-college-hockey/transactions`

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
await sdv.mch.espnMchTransactions({});
// snake_case alias (py/R parity): sdv.mch.espn_mch_transactions(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
