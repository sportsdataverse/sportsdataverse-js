---
title: CDN (espn.com page data)
sidebar_label: CDN (espn.com page data)
sidebar_position: 5
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `mlb` — CDN (espn.com page data)

4 endpoints on `sdv.mlb`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnMlbCdnBoxscore`

MLB — cdn boxscore (ESPN cdn.espn.com (espn.com page data)).

**Endpoint URL:** `GET https://cdn.espn.com/core/mlb/boxscore?xhr=1`

| API param | JS | required | description |
|---|---|---|---|
| `gameId` | `game_id` | no | `number \| string` — ESPN game (event) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |
| — | `section` | no | with `parsed`, return one named sub-frame (e.g. `boxscore`, `plays`, `winprobability`) instead of all |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the page's `gamepackageJSON` (a Site v2 summary) goes through the `summary` dispatcher, which returns an object of 21 sub-frames keyed by section (`{ parsed: true, section: '<name>' }` for one); see [ESPN parsed returns](../../reference/espn-parsed-returns#summary-sub-frames).

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mlb.espnMlbCdnBoxscore({});
// snake_case alias (py/R parity): sdv.mlb.espn_mlb_cdn_boxscore(...)
```

## `espnMlbCdnPlaybyplay`

MLB — cdn playbyplay (ESPN cdn.espn.com (espn.com page data)).

**Endpoint URL:** `GET https://cdn.espn.com/core/mlb/playbyplay?xhr=1`

| API param | JS | required | description |
|---|---|---|---|
| `gameId` | `game_id` | no | `number \| string` — ESPN game (event) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |
| — | `section` | no | with `parsed`, return one named sub-frame (e.g. `boxscore`, `plays`, `winprobability`) instead of all |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the page's `gamepackageJSON` (a Site v2 summary) goes through the `summary` dispatcher, which returns an object of 21 sub-frames keyed by section (`{ parsed: true, section: '<name>' }` for one); see [ESPN parsed returns](../../reference/espn-parsed-returns#summary-sub-frames).

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.mlb.espnMlbCdnPlaybyplay({});
// snake_case alias (py/R parity): sdv.mlb.espn_mlb_cdn_playbyplay(...)
```

## `espnMlbCdnSchedule`

MLB — cdn schedule (ESPN cdn.espn.com (espn.com page data)).

**Endpoint URL:** `GET https://cdn.espn.com/core/mlb/schedule?xhr=1`

| API param | JS | required | description |
|---|---|---|---|
| `date` | `date` | no | `number \| string` — Single date (YYYYMMDD). Ignored by cfb and nfl, which are week-oriented. Defaults to today |
| `week` | `week` | no | `number \| string` — Week number (cfb and nfl) |
| `year` | `season` | no | `number \| string` — Season year that `week` belongs to (cfb and nfl) |
| `seasontype` | `season_type` | no | `number \| string` — Season phase for `week`: 1=preseason, 2=regular season, 3=postseason (cfb and nfl) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_cdn_schedule`):

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique ESPN game/event identifier. |
| `uid` | character | ESPN UID string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season slug. |
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
| `conference_competition` | logical | Conference competition. |
| `attendance` | integer | Reported attendance (NA on the redesigned page). |
| `venue_id` | character | MLBAM venue ID. |
| `venue_full_name` | character |  |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state / province. |
| `venue_indoor` | logical |  |
| `broadcast` | character | Broadcast information string. |
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
await sdv.mlb.espnMlbCdnSchedule({});
// snake_case alias (py/R parity): sdv.mlb.espn_mlb_cdn_schedule(...)
```

## `espnMlbCdnScoreboard`

MLB — cdn scoreboard (ESPN cdn.espn.com (espn.com page data)).

**Endpoint URL:** `GET https://cdn.espn.com/core/mlb/scoreboard?xhr=1`

| API param | JS | required | description |
|---|---|---|---|
| `date` | `date` | no | `number \| string` — Single date (YYYYMMDD). Ignored by cfb and nfl, which are week-oriented. Defaults to today |
| `week` | `week` | no | `number \| string` — Week number (cfb and nfl) |
| `year` | `season` | no | `number \| string` — Season year that `week` belongs to (cfb and nfl) |
| `seasontype` | `season_type` | no | `number \| string` — Season phase for `week`: 1=preseason, 2=regular season, 3=postseason (cfb and nfl) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_cdn_scoreboard`):

| col_name | type | description |
|---|---|---|
| `game_id` | character | Unique ESPN game/event identifier. |
| `uid` | character | ESPN UID string. |
| `date` | character | Match start timestamp (ISO 8601, UTC). |
| `name` | character | Full event name (e.g. 'Team A at Team B'). |
| `short_name` | character | Abbreviated event name (e.g. 'TA @ TB'). |
| `season_year` | integer | Integer season year ESPN assigns the event (e.g. 2025 for the 2025-26 season). |
| `season_type` | integer | ESPN season-type id of the event's season: 1 preseason, 2 regular season, 3 postseason, 4 offseason for the US leagues; soccer competitions carry their own competition-specific ids (e.g. 13481). |
| `season_slug` | character | Season slug. |
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
| `conference_competition` | logical | Conference competition. |
| `attendance` | integer | Reported attendance (NA on the redesigned page). |
| `venue_id` | character | MLBAM venue ID. |
| `venue_full_name` | character |  |
| `venue_city` | character | Venue city. |
| `venue_state` | character | Venue state / province. |
| `venue_indoor` | logical |  |
| `broadcast` | character | Broadcast information string. |
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
await sdv.mlb.espnMlbCdnScoreboard({});
// snake_case alias (py/R parity): sdv.mlb.espn_mlb_cdn_scoreboard(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
