---
title: Core API
sidebar_label: Core API
sidebar_position: 2
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `nbasl_ca` — Core API

82 endpoints on `sdv.nbasl_ca`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnNbaslCaPlayerAwards`

NBASL_CA — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/awards`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_awards(...)
```

## `espnNbaslCaPlayerCareerStats`

NBASL_CA — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/statistics[/{stat_type}]`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{stat_type}` | `stat_type` | no | `number \| string` — the `{stat_type}` path segment; optional |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_career_stats(...)
```

## `espnNbaslCaPlayerContracts`

NBASL_CA — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/contracts`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_contracts(...)
```

## `espnNbaslCaPlayerCore`

NBASL_CA — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_core(...)
```

## `espnNbaslCaPlayerEventlog`

NBASL_CA — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/eventlog`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_eventlog(...)
```

## `espnNbaslCaPlayerInjuries`

NBASL_CA — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/injuries`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
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
await sdv.nbasl_ca.espnNbaslCaPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_injuries(...)
```

## `espnNbaslCaPlayerNotes`

NBASL_CA — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/notes`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_notes(...)
```

## `espnNbaslCaPlayerRecords`

NBASL_CA — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/records`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_records(...)
```

## `espnNbaslCaPlayerSeasons`

NBASL_CA — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/seasons`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_seasons(...)
```

## `espnNbaslCaPlayerStatisticslog`

NBASL_CA — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/statisticslog`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_statisticslog(...)
```

## `espnNbaslCaPlayerVsPlayer`

NBASL_CA — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes/{athlete_id}/vsathlete/{opp_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_player_vs_player(...)
```

## `espnNbaslCaPlayersIndex`

NBASL_CA — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/athletes`

| API param | JS | required | description |
|---|---|---|---|
| `active` | `active` | no | `boolean` — the `active` ESPN query parameter; default `true` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `100` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPlayersIndex({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_players_index(...)
```

## `espnNbaslCaAward`

NBASL_CA — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_award(...)
```

## `espnNbaslCaAwards`

NBASL_CA — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/awards`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaAwards({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_awards(...)
```

## `espnNbaslCaCoach`

NBASL_CA — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_coach(...)
```

## `espnNbaslCaCoachRecord`

NBASL_CA — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_coach_record(...)
```

## `espnNbaslCaCoachSeason`

NBASL_CA — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_coach_season(...)
```

## `espnNbaslCaGame`

NBASL_CA — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game(...)
```

## `espnNbaslCaGameBroadcasts`

NBASL_CA — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/broadcasts`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_broadcasts(...)
```

## `espnNbaslCaGameCompetition`

NBASL_CA — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_competition(...)
```

## `espnNbaslCaGameTeam`

NBASL_CA — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team(...)
```

## `espnNbaslCaGameTeamLeaders`

NBASL_CA — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team_leaders(...)
```

## `espnNbaslCaGameTeamLinescores`

NBASL_CA — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_linescores`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_linescores`](../../reference/espn-parsed-returns#parse_event_competitor_linescores) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team_linescores(...)
```

## `espnNbaslCaGameTeamRecord`

NBASL_CA — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team_record(...)
```

## `espnNbaslCaGameTeamRoster`

NBASL_CA — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_roster`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_roster`](../../reference/espn-parsed-returns#parse_event_competitor_roster) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team_roster(...)
```

## `espnNbaslCaGameTeamStatistics`

NBASL_CA — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_event_competitor_statistics`):

| col_name | type | description |
|---|---|---|
| `split_name` | character | Split / season-segment name |
| `category_name` | character | Statistic category name |
| `stat_name` | character | Statistic name |
| `stat_abbreviation` | character | Statistic abbreviation |
| `stat_value` | number | Numeric statistic value |
| `stat_display_value` | character | Formatted statistic value |
| `stat_description` | character | Statistic description |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_team_statistics(...)
```

## `espnNbaslCaGameTeams`

NBASL_CA — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/competitors`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_teams(...)
```

## `espnNbaslCaGameLeaders`

NBASL_CA — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_leaders(...)
```

## `espnNbaslCaGameOdds`

NBASL_CA — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/odds`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_odds(...)
```

## `espnNbaslCaGameOfficialDetail`

NBASL_CA — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/officials/{official_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{official_id}` | `official_id` | yes | `number \| string` — the `{official_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_official_detail(...)
```

## `espnNbaslCaGameOfficials`

NBASL_CA — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/officials`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_officials(...)
```

## `espnNbaslCaGamePlay`

NBASL_CA — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/plays/{play_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{play_id}` | `play_id` | yes | `number \| string` — the `{play_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_play(...)
```

## `espnNbaslCaGamePlayPersonnel`

NBASL_CA — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{play_id}` | `play_id` | yes | `number \| string` — the `{play_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_play_personnel(...)
```

## `espnNbaslCaGamePlays`

NBASL_CA — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/plays`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_plays`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_plays`](../../reference/espn-parsed-returns#parse_event_plays) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_plays(...)
```

## `espnNbaslCaGamePowerindex`

NBASL_CA — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/powerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_powerindex(...)
```

## `espnNbaslCaGamePredictor`

NBASL_CA — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/predictor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_predictor(...)
```

## `espnNbaslCaGameProbabilities`

NBASL_CA — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/probabilities`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `300` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_probabilities(...)
```

## `espnNbaslCaGamePropbets`

NBASL_CA — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/propbets`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_propbets(...)
```

## `espnNbaslCaGameScoringplays`

NBASL_CA — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/scoringplays`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_scoringplays(...)
```

## `espnNbaslCaGameSituation`

NBASL_CA — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/situation`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_situation(...)
```

## `espnNbaslCaGameStatus`

NBASL_CA — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events/{event_id}/competitions/{cid}/status`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_game_status(...)
```

## `espnNbaslCaGames`

NBASL_CA — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/events`

| API param | JS | required | description |
|---|---|---|---|
| `dates` | `dates` | no | `number \| string` — a date `YYYYMMDD`, a range `YYYYMMDD-YYYYMMDD` or a season year `YYYY` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaGames({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_games(...)
```

## `espnNbaslCaFranchise`

NBASL_CA — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_franchise(...)
```

## `espnNbaslCaFranchises`

NBASL_CA — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/franchises`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaFranchises({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_franchises(...)
```

## `espnNbaslCaLeadersCore`

NBASL_CA — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/leaders`

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
await sdv.nbasl_ca.espnNbaslCaLeadersCore({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_leaders_core(...)
```

## `espnNbaslCaLeagueNotes`

NBASL_CA — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/notes`

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
await sdv.nbasl_ca.espnNbaslCaLeagueNotes({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_league_notes(...)
```

## `espnNbaslCaLeagueRoot`

NBASL_CA — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaLeagueRoot({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_league_root(...)
```

## `espnNbaslCaPosition`

NBASL_CA — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_position(...)
```

## `espnNbaslCaPositions`

NBASL_CA — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/positions`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaPositions({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_positions(...)
```

## `espnNbaslCaSeasonPlayers`

NBASL_CA — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/athletes`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `100` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_players(...)
```

## `espnNbaslCaSeasonAwards`

NBASL_CA — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/awards`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_awards(...)
```

## `espnNbaslCaSeasonCoaches`

NBASL_CA — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_coaches(...)
```

## `espnNbaslCaSeasonDraft`

NBASL_CA — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_draft(...)
```

## `espnNbaslCaSeasonDraftRoundPicks`

NBASL_CA — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/draft/rounds/{round_num}/picks`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{round_num}` | `round_num` | yes | `number \| string` — the `{round_num}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_draft_round_picks(...)
```

## `espnNbaslCaSeasonFreeagents`

NBASL_CA — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/freeagents`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_freeagents(...)
```

## `espnNbaslCaSeasonFutures`

NBASL_CA — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/futures`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_futures(...)
```

## `espnNbaslCaSeasonGroup`

NBASL_CA — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/groups/{group_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{group_id}` | `group_id` | yes | `number \| string` — the `{group_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_group(...)
```

## `espnNbaslCaSeasonGroupChildren`

NBASL_CA — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/groups/{group_id}/children`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{group_id}` | `group_id` | yes | `number \| string` — the `{group_id}` path segment |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_group_children(...)
```

## `espnNbaslCaSeasonGroupTeams`

NBASL_CA — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{group_id}` | `group_id` | yes | `number \| string` — the `{group_id}` path segment |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_group_teams(...)
```

## `espnNbaslCaSeasonGroups`

NBASL_CA — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/groups`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_groups(...)
```

## `espnNbaslCaSeasonInfo`

NBASL_CA — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_info(...)
```

## `espnNbaslCaSeasonPointer`

NBASL_CA — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/season`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonPointer({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_pointer(...)
```

## `espnNbaslCaSeasonPowerindex`

NBASL_CA — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/powerindex[/{team_id}]`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | no | `number \| string` — the ESPN team id (see `espn_<league>_teams`); optional |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_powerindex(...)
```

## `espnNbaslCaSeasonPowerindexLeaders`

NBASL_CA — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/powerindex/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_powerindex_leaders(...)
```

## `espnNbaslCaSeasonTeam`

NBASL_CA — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_team(...)
```

## `espnNbaslCaSeasonTeams`

NBASL_CA — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/teams`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_teams(...)
```

## `espnNbaslCaSeasonType`

NBASL_CA — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_type(...)
```

## `espnNbaslCaSeasonTypeCorrections`

NBASL_CA — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/corrections`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_type_corrections(...)
```

## `espnNbaslCaSeasonTypeLeaders`

NBASL_CA — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_type_leaders(...)
```

## `espnNbaslCaSeasonTypes`

NBASL_CA — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_types(...)
```

## `espnNbaslCaSeasonWeek`

NBASL_CA — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/weeks/{week}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_week(...)
```

## `espnNbaslCaSeasonWeekGames`

NBASL_CA — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/weeks/{week}/events`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_week_games(...)
```

## `espnNbaslCaSeasonWeekPowerindex`

NBASL_CA — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| `limit` | `limit` | no | `number \| string` — Page size for this weekly power-index table; pass a limit large enough to avoid paging (table size varies by sport/league -- CFB's FBS table alone is ~134 rows) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_week_powerindex(...)
```

## `espnNbaslCaSeasonWeeks`

NBASL_CA — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons/{season}/types/{season_type}/weeks`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_season_weeks(...)
```

## `espnNbaslCaSeasons`

NBASL_CA — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/seasons`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaSeasons({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_seasons(...)
```

## `espnNbaslCaStandingsCore`

NBASL_CA — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/standings`

| API param | JS | required | description |
|---|---|---|---|
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
await sdv.nbasl_ca.espnNbaslCaStandingsCore({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_standings_core(...)
```

## `espnNbaslCaTalentpicks`

NBASL_CA — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/talentpicks`

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
await sdv.nbasl_ca.espnNbaslCaTalentpicks({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_talentpicks(...)
```

## `espnNbaslCaTeamCore`

NBASL_CA — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_team_core(...)
```

## `espnNbaslCaTeamsCore`

NBASL_CA — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaTeamsCore({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_teams_core(...)
```

## `espnNbaslCaTournaments`

NBASL_CA — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/tournaments`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaTournaments({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_tournaments(...)
```

## `espnNbaslCaVenue`

NBASL_CA — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_venue(...)
```

## `espnNbaslCaVenues`

NBASL_CA — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-california/venues`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_ca.espnNbaslCaVenues({});
// snake_case alias (py/R parity): sdv.nbasl_ca.espn_nbasl_ca_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
