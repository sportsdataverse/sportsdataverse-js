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


# `fiba` — Core API

82 endpoints on `sdv.fiba`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnFibaPlayerAwards`

FIBA — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/awards`

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
await sdv.fiba.espnFibaPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_awards(...)
```

## `espnFibaPlayerCareerStats`

FIBA — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/statistics[/{stat_type}]`

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
await sdv.fiba.espnFibaPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_career_stats(...)
```

## `espnFibaPlayerContracts`

FIBA — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/contracts`

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
await sdv.fiba.espnFibaPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_contracts(...)
```

## `espnFibaPlayerCore`

FIBA — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_core(...)
```

## `espnFibaPlayerEventlog`

FIBA — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/eventlog`

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
await sdv.fiba.espnFibaPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_eventlog(...)
```

## `espnFibaPlayerInjuries`

FIBA — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/injuries`

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
await sdv.fiba.espnFibaPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_injuries(...)
```

## `espnFibaPlayerNotes`

FIBA — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/notes`

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
await sdv.fiba.espnFibaPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_notes(...)
```

## `espnFibaPlayerRecords`

FIBA — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/records`

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
await sdv.fiba.espnFibaPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_records(...)
```

## `espnFibaPlayerSeasons`

FIBA — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/seasons`

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
await sdv.fiba.espnFibaPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_seasons(...)
```

## `espnFibaPlayerStatisticslog`

FIBA — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/statisticslog`

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
await sdv.fiba.espnFibaPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_statisticslog(...)
```

## `espnFibaPlayerVsPlayer`

FIBA — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes/{athlete_id}/vsathlete/{opp_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_player_vs_player(...)
```

## `espnFibaPlayersIndex`

FIBA — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/athletes`

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
await sdv.fiba.espnFibaPlayersIndex({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_players_index(...)
```

## `espnFibaAward`

FIBA — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_award(...)
```

## `espnFibaAwards`

FIBA — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/awards`

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
await sdv.fiba.espnFibaAwards({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_awards(...)
```

## `espnFibaCoach`

FIBA — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_coach(...)
```

## `espnFibaCoachRecord`

FIBA — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_coach_record(...)
```

## `espnFibaCoachSeason`

FIBA — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_coach_season(...)
```

## `espnFibaGame`

FIBA — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game(...)
```

## `espnFibaGameBroadcasts`

FIBA — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/broadcasts`

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
await sdv.fiba.espnFibaGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_broadcasts(...)
```

## `espnFibaGameCompetition`

FIBA — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_competition(...)
```

## `espnFibaGameTeam`

FIBA — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}`

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
await sdv.fiba.espnFibaGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team(...)
```

## `espnFibaGameTeamLeaders`

FIBA — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

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
await sdv.fiba.espnFibaGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team_leaders(...)
```

## `espnFibaGameTeamLinescores`

FIBA — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

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
await sdv.fiba.espnFibaGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team_linescores(...)
```

## `espnFibaGameTeamRecord`

FIBA — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

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
await sdv.fiba.espnFibaGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team_record(...)
```

## `espnFibaGameTeamRoster`

FIBA — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

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
await sdv.fiba.espnFibaGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team_roster(...)
```

## `espnFibaGameTeamStatistics`

FIBA — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

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
await sdv.fiba.espnFibaGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_team_statistics(...)
```

## `espnFibaGameTeams`

FIBA — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/competitors`

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
await sdv.fiba.espnFibaGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_teams(...)
```

## `espnFibaGameLeaders`

FIBA — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/leaders`

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
await sdv.fiba.espnFibaGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_leaders(...)
```

## `espnFibaGameOdds`

FIBA — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/odds`

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
await sdv.fiba.espnFibaGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_odds(...)
```

## `espnFibaGameOfficialDetail`

FIBA — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/officials/{official_id}`

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
await sdv.fiba.espnFibaGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_official_detail(...)
```

## `espnFibaGameOfficials`

FIBA — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/officials`

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
await sdv.fiba.espnFibaGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_officials(...)
```

## `espnFibaGamePlay`

FIBA — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/plays/{play_id}`

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
await sdv.fiba.espnFibaGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_play(...)
```

## `espnFibaGamePlayPersonnel`

FIBA — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

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
await sdv.fiba.espnFibaGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_play_personnel(...)
```

## `espnFibaGamePlays`

FIBA — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/plays`

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
await sdv.fiba.espnFibaGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_plays(...)
```

## `espnFibaGamePowerindex`

FIBA — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/powerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_powerindex(...)
```

## `espnFibaGamePredictor`

FIBA — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/predictor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_predictor(...)
```

## `espnFibaGameProbabilities`

FIBA — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/probabilities`

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
await sdv.fiba.espnFibaGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_probabilities(...)
```

## `espnFibaGamePropbets`

FIBA — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/propbets`

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
await sdv.fiba.espnFibaGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_propbets(...)
```

## `espnFibaGameScoringplays`

FIBA — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/scoringplays`

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
await sdv.fiba.espnFibaGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_scoringplays(...)
```

## `espnFibaGameSituation`

FIBA — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/situation`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_situation(...)
```

## `espnFibaGameStatus`

FIBA — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events/{event_id}/competitions/{cid}/status`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_game_status(...)
```

## `espnFibaGames`

FIBA — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/events`

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
await sdv.fiba.espnFibaGames({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_games(...)
```

## `espnFibaFranchise`

FIBA — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_franchise(...)
```

## `espnFibaFranchises`

FIBA — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/franchises`

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
await sdv.fiba.espnFibaFranchises({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_franchises(...)
```

## `espnFibaLeadersCore`

FIBA — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/leaders`

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
await sdv.fiba.espnFibaLeadersCore({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_leaders_core(...)
```

## `espnFibaLeagueNotes`

FIBA — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/notes`

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
await sdv.fiba.espnFibaLeagueNotes({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_league_notes(...)
```

## `espnFibaLeagueRoot`

FIBA — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaLeagueRoot({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_league_root(...)
```

## `espnFibaPosition`

FIBA — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_position(...)
```

## `espnFibaPositions`

FIBA — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/positions`

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
await sdv.fiba.espnFibaPositions({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_positions(...)
```

## `espnFibaSeasonPlayers`

FIBA — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/athletes`

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
await sdv.fiba.espnFibaSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_players(...)
```

## `espnFibaSeasonAwards`

FIBA — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/awards`

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
await sdv.fiba.espnFibaSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_awards(...)
```

## `espnFibaSeasonCoaches`

FIBA — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_coaches(...)
```

## `espnFibaSeasonDraft`

FIBA — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_draft(...)
```

## `espnFibaSeasonDraftRoundPicks`

FIBA — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/draft/rounds/{round_num}/picks`

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
await sdv.fiba.espnFibaSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_draft_round_picks(...)
```

## `espnFibaSeasonFreeagents`

FIBA — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/freeagents`

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
await sdv.fiba.espnFibaSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_freeagents(...)
```

## `espnFibaSeasonFutures`

FIBA — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/futures`

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
await sdv.fiba.espnFibaSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_futures(...)
```

## `espnFibaSeasonGroup`

FIBA — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/groups/{group_id}`

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
await sdv.fiba.espnFibaSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_group(...)
```

## `espnFibaSeasonGroupChildren`

FIBA — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/groups/{group_id}/children`

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
await sdv.fiba.espnFibaSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_group_children(...)
```

## `espnFibaSeasonGroupTeams`

FIBA — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

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
await sdv.fiba.espnFibaSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_group_teams(...)
```

## `espnFibaSeasonGroups`

FIBA — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/groups`

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
await sdv.fiba.espnFibaSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_groups(...)
```

## `espnFibaSeasonInfo`

FIBA — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_info(...)
```

## `espnFibaSeasonPointer`

FIBA — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/season`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonPointer({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_pointer(...)
```

## `espnFibaSeasonPowerindex`

FIBA — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/powerindex[/{team_id}]`

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
await sdv.fiba.espnFibaSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_powerindex(...)
```

## `espnFibaSeasonPowerindexLeaders`

FIBA — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/powerindex/leaders`

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
await sdv.fiba.espnFibaSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_powerindex_leaders(...)
```

## `espnFibaSeasonTeam`

FIBA — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_team(...)
```

## `espnFibaSeasonTeams`

FIBA — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/teams`

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
await sdv.fiba.espnFibaSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_teams(...)
```

## `espnFibaSeasonType`

FIBA — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_type(...)
```

## `espnFibaSeasonTypeCorrections`

FIBA — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/corrections`

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
await sdv.fiba.espnFibaSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_type_corrections(...)
```

## `espnFibaSeasonTypeLeaders`

FIBA — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/leaders`

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
await sdv.fiba.espnFibaSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_type_leaders(...)
```

## `espnFibaSeasonTypes`

FIBA — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types`

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
await sdv.fiba.espnFibaSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_types(...)
```

## `espnFibaSeasonWeek`

FIBA — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/weeks/{week}`

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
await sdv.fiba.espnFibaSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_week(...)
```

## `espnFibaSeasonWeekGames`

FIBA — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/weeks/{week}/events`

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
await sdv.fiba.espnFibaSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_week_games(...)
```

## `espnFibaSeasonWeekPowerindex`

FIBA — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

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
await sdv.fiba.espnFibaSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_week_powerindex(...)
```

## `espnFibaSeasonWeeks`

FIBA — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons/{season}/types/{season_type}/weeks`

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
await sdv.fiba.espnFibaSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_season_weeks(...)
```

## `espnFibaSeasons`

FIBA — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/seasons`

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
await sdv.fiba.espnFibaSeasons({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_seasons(...)
```

## `espnFibaStandingsCore`

FIBA — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/standings`

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
await sdv.fiba.espnFibaStandingsCore({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_standings_core(...)
```

## `espnFibaTalentpicks`

FIBA — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/talentpicks`

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
await sdv.fiba.espnFibaTalentpicks({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_talentpicks(...)
```

## `espnFibaTeamCore`

FIBA — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_team_core(...)
```

## `espnFibaTeamsCore`

FIBA — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaTeamsCore({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_teams_core(...)
```

## `espnFibaTournaments`

FIBA — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/tournaments`

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
await sdv.fiba.espnFibaTournaments({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_tournaments(...)
```

## `espnFibaVenue`

FIBA — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.fiba.espnFibaVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_venue(...)
```

## `espnFibaVenues`

FIBA — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/fiba/venues`

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
await sdv.fiba.espnFibaVenues({});
// snake_case alias (py/R parity): sdv.fiba.espn_fiba_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
