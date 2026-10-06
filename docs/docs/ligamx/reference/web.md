---
title: Web API
sidebar_label: Web API
sidebar_position: 3
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `ligamx` — Web API

5 endpoints on `sdv.ligamx`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnLigamxPlayerGamelog`

LIGAMX — player gamelog (ESPN site.web.api.espn.com (web v3)).

**Endpoint URL:** `GET https://site.web.api.espn.com/apis/common/v3/sports/soccer/mex.1/athletes/{athlete_id}/gamelog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_gamelog` / `espnLigamxAthleteGamelog`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_athlete_gamelog`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerGamelog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_gamelog(...)
```

## `espnLigamxPlayerOverview`

LIGAMX — player overview (ESPN site.web.api.espn.com (web v3)).

**Endpoint URL:** `GET https://site.web.api.espn.com/apis/common/v3/sports/soccer/mex.1/athletes/{athlete_id}/overview`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_overview` / `espnLigamxAthleteOverview`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_athlete_overview`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerOverview({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_overview(...)
```

## `espnLigamxPlayerSplits`

LIGAMX — player splits (ESPN site.web.api.espn.com (web v3)).

**Endpoint URL:** `GET https://site.web.api.espn.com/apis/common/v3/sports/soccer/mex.1/athletes/{athlete_id}/splits`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_splits` / `espnLigamxAthleteSplits`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_athlete_splits`):

| col_name | type | description |
|---|---|---|
| `category` | character | Stat / leader category name |
| `split_name` | character | Split / season-segment name |
| `split_abbreviation` | character | Split abbreviation |
| `split_category` | character | Split category |
| `split_value` | character | Split value |
| `split_description` | character | Split description |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerSplits({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_splits(...)
```

## `espnLigamxPlayerStats`

LIGAMX — player stats (ESPN site.web.api.espn.com (web v3)).

**Endpoint URL:** `GET https://site.web.api.espn.com/apis/common/v3/sports/soccer/mex.1/athletes/{athlete_id}/stats`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_stats` / `espnLigamxAthleteStats`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_athlete_stats`):

| col_name | type | description |
|---|---|---|
| `category` | character | Stat / leader category name |
| `split_name` | character | Split / season-segment name |
| `split_category` | character | Split category |
| `split_value` | character | Split value |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_stats(...)
```

## `espnLigamxLeaders`

LIGAMX — leaders (ESPN site.web.api.espn.com (web v3)).

**Endpoint URL:** `GET https://site.web.api.espn.com/apis/common/v3/sports/soccer/mex.1/statistics/byathlete`

| API param | JS | required | description |
|---|---|---|---|
| `category` | `category` | no | `number \| string` — the statistics category |
| `season` | `season` | no | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `seasontype` | `season_type` | no | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `50` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| `sort` | `sort` | no | `number \| string` — the sort key and direction, e.g. `offensive.avgPoints:desc` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_leaders`):

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

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxLeaders({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_leaders(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
