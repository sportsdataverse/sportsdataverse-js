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


# `nbasl_gs` — Core API

82 endpoints on `sdv.nbasl_gs`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnNbaslGsPlayerAwards`

NBASL_GS — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/awards`

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
await sdv.nbasl_gs.espnNbaslGsPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_awards(...)
```

## `espnNbaslGsPlayerCareerStats`

NBASL_GS — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/statistics[/{stat_type}]`

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
await sdv.nbasl_gs.espnNbaslGsPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_career_stats(...)
```

## `espnNbaslGsPlayerContracts`

NBASL_GS — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/contracts`

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
await sdv.nbasl_gs.espnNbaslGsPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_contracts(...)
```

## `espnNbaslGsPlayerCore`

NBASL_GS — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_core(...)
```

## `espnNbaslGsPlayerEventlog`

NBASL_GS — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/eventlog`

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
await sdv.nbasl_gs.espnNbaslGsPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_eventlog(...)
```

## `espnNbaslGsPlayerInjuries`

NBASL_GS — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/injuries`

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
await sdv.nbasl_gs.espnNbaslGsPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_injuries(...)
```

## `espnNbaslGsPlayerNotes`

NBASL_GS — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/notes`

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
await sdv.nbasl_gs.espnNbaslGsPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_notes(...)
```

## `espnNbaslGsPlayerRecords`

NBASL_GS — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/records`

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
await sdv.nbasl_gs.espnNbaslGsPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_records(...)
```

## `espnNbaslGsPlayerSeasons`

NBASL_GS — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/seasons`

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
await sdv.nbasl_gs.espnNbaslGsPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_seasons(...)
```

## `espnNbaslGsPlayerStatisticslog`

NBASL_GS — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/statisticslog`

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
await sdv.nbasl_gs.espnNbaslGsPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_statisticslog(...)
```

## `espnNbaslGsPlayerVsPlayer`

NBASL_GS — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes/{athlete_id}/vsathlete/{opp_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_player_vs_player(...)
```

## `espnNbaslGsPlayersIndex`

NBASL_GS — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/athletes`

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
await sdv.nbasl_gs.espnNbaslGsPlayersIndex({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_players_index(...)
```

## `espnNbaslGsAward`

NBASL_GS — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_award(...)
```

## `espnNbaslGsAwards`

NBASL_GS — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/awards`

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
await sdv.nbasl_gs.espnNbaslGsAwards({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_awards(...)
```

## `espnNbaslGsCoach`

NBASL_GS — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_coach(...)
```

## `espnNbaslGsCoachRecord`

NBASL_GS — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_coach_record(...)
```

## `espnNbaslGsCoachSeason`

NBASL_GS — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_coach_season(...)
```

## `espnNbaslGsGame`

NBASL_GS — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game(...)
```

## `espnNbaslGsGameBroadcasts`

NBASL_GS — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/broadcasts`

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
await sdv.nbasl_gs.espnNbaslGsGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_broadcasts(...)
```

## `espnNbaslGsGameCompetition`

NBASL_GS — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_competition(...)
```

## `espnNbaslGsGameTeam`

NBASL_GS — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}`

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
await sdv.nbasl_gs.espnNbaslGsGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team(...)
```

## `espnNbaslGsGameTeamLeaders`

NBASL_GS — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

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
await sdv.nbasl_gs.espnNbaslGsGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team_leaders(...)
```

## `espnNbaslGsGameTeamLinescores`

NBASL_GS — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

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
await sdv.nbasl_gs.espnNbaslGsGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team_linescores(...)
```

## `espnNbaslGsGameTeamRecord`

NBASL_GS — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

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
await sdv.nbasl_gs.espnNbaslGsGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team_record(...)
```

## `espnNbaslGsGameTeamRoster`

NBASL_GS — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

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
await sdv.nbasl_gs.espnNbaslGsGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team_roster(...)
```

## `espnNbaslGsGameTeamStatistics`

NBASL_GS — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

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
await sdv.nbasl_gs.espnNbaslGsGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_team_statistics(...)
```

## `espnNbaslGsGameTeams`

NBASL_GS — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/competitors`

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
await sdv.nbasl_gs.espnNbaslGsGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_teams(...)
```

## `espnNbaslGsGameLeaders`

NBASL_GS — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/leaders`

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
await sdv.nbasl_gs.espnNbaslGsGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_leaders(...)
```

## `espnNbaslGsGameOdds`

NBASL_GS — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/odds`

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
await sdv.nbasl_gs.espnNbaslGsGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_odds(...)
```

## `espnNbaslGsGameOfficialDetail`

NBASL_GS — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/officials/{official_id}`

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
await sdv.nbasl_gs.espnNbaslGsGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_official_detail(...)
```

## `espnNbaslGsGameOfficials`

NBASL_GS — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/officials`

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
await sdv.nbasl_gs.espnNbaslGsGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_officials(...)
```

## `espnNbaslGsGamePlay`

NBASL_GS — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/plays/{play_id}`

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
await sdv.nbasl_gs.espnNbaslGsGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_play(...)
```

## `espnNbaslGsGamePlayPersonnel`

NBASL_GS — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

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
await sdv.nbasl_gs.espnNbaslGsGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_play_personnel(...)
```

## `espnNbaslGsGamePlays`

NBASL_GS — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/plays`

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
await sdv.nbasl_gs.espnNbaslGsGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_plays(...)
```

## `espnNbaslGsGamePowerindex`

NBASL_GS — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/powerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_powerindex(...)
```

## `espnNbaslGsGamePredictor`

NBASL_GS — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/predictor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_predictor(...)
```

## `espnNbaslGsGameProbabilities`

NBASL_GS — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/probabilities`

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
await sdv.nbasl_gs.espnNbaslGsGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_probabilities(...)
```

## `espnNbaslGsGamePropbets`

NBASL_GS — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/propbets`

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
await sdv.nbasl_gs.espnNbaslGsGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_propbets(...)
```

## `espnNbaslGsGameScoringplays`

NBASL_GS — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/scoringplays`

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
await sdv.nbasl_gs.espnNbaslGsGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_scoringplays(...)
```

## `espnNbaslGsGameSituation`

NBASL_GS — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/situation`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_situation(...)
```

## `espnNbaslGsGameStatus`

NBASL_GS — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events/{event_id}/competitions/{cid}/status`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_game_status(...)
```

## `espnNbaslGsGames`

NBASL_GS — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/events`

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
await sdv.nbasl_gs.espnNbaslGsGames({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_games(...)
```

## `espnNbaslGsFranchise`

NBASL_GS — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_franchise(...)
```

## `espnNbaslGsFranchises`

NBASL_GS — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/franchises`

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
await sdv.nbasl_gs.espnNbaslGsFranchises({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_franchises(...)
```

## `espnNbaslGsLeadersCore`

NBASL_GS — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/leaders`

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
await sdv.nbasl_gs.espnNbaslGsLeadersCore({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_leaders_core(...)
```

## `espnNbaslGsLeagueNotes`

NBASL_GS — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/notes`

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
await sdv.nbasl_gs.espnNbaslGsLeagueNotes({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_league_notes(...)
```

## `espnNbaslGsLeagueRoot`

NBASL_GS — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsLeagueRoot({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_league_root(...)
```

## `espnNbaslGsPosition`

NBASL_GS — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_position(...)
```

## `espnNbaslGsPositions`

NBASL_GS — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/positions`

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
await sdv.nbasl_gs.espnNbaslGsPositions({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_positions(...)
```

## `espnNbaslGsSeasonPlayers`

NBASL_GS — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/athletes`

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
await sdv.nbasl_gs.espnNbaslGsSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_players(...)
```

## `espnNbaslGsSeasonAwards`

NBASL_GS — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/awards`

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
await sdv.nbasl_gs.espnNbaslGsSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_awards(...)
```

## `espnNbaslGsSeasonCoaches`

NBASL_GS — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_coaches(...)
```

## `espnNbaslGsSeasonDraft`

NBASL_GS — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_draft(...)
```

## `espnNbaslGsSeasonDraftRoundPicks`

NBASL_GS — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/draft/rounds/{round_num}/picks`

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
await sdv.nbasl_gs.espnNbaslGsSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_draft_round_picks(...)
```

## `espnNbaslGsSeasonFreeagents`

NBASL_GS — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/freeagents`

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
await sdv.nbasl_gs.espnNbaslGsSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_freeagents(...)
```

## `espnNbaslGsSeasonFutures`

NBASL_GS — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/futures`

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
await sdv.nbasl_gs.espnNbaslGsSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_futures(...)
```

## `espnNbaslGsSeasonGroup`

NBASL_GS — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/groups/{group_id}`

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
await sdv.nbasl_gs.espnNbaslGsSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_group(...)
```

## `espnNbaslGsSeasonGroupChildren`

NBASL_GS — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/groups/{group_id}/children`

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
await sdv.nbasl_gs.espnNbaslGsSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_group_children(...)
```

## `espnNbaslGsSeasonGroupTeams`

NBASL_GS — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

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
await sdv.nbasl_gs.espnNbaslGsSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_group_teams(...)
```

## `espnNbaslGsSeasonGroups`

NBASL_GS — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/groups`

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
await sdv.nbasl_gs.espnNbaslGsSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_groups(...)
```

## `espnNbaslGsSeasonInfo`

NBASL_GS — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_info(...)
```

## `espnNbaslGsSeasonPointer`

NBASL_GS — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/season`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonPointer({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_pointer(...)
```

## `espnNbaslGsSeasonPowerindex`

NBASL_GS — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/powerindex[/{team_id}]`

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
await sdv.nbasl_gs.espnNbaslGsSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_powerindex(...)
```

## `espnNbaslGsSeasonPowerindexLeaders`

NBASL_GS — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/powerindex/leaders`

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
await sdv.nbasl_gs.espnNbaslGsSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_powerindex_leaders(...)
```

## `espnNbaslGsSeasonTeam`

NBASL_GS — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_team(...)
```

## `espnNbaslGsSeasonTeams`

NBASL_GS — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/teams`

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
await sdv.nbasl_gs.espnNbaslGsSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_teams(...)
```

## `espnNbaslGsSeasonType`

NBASL_GS — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_type(...)
```

## `espnNbaslGsSeasonTypeCorrections`

NBASL_GS — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/corrections`

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
await sdv.nbasl_gs.espnNbaslGsSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_type_corrections(...)
```

## `espnNbaslGsSeasonTypeLeaders`

NBASL_GS — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/leaders`

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
await sdv.nbasl_gs.espnNbaslGsSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_type_leaders(...)
```

## `espnNbaslGsSeasonTypes`

NBASL_GS — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types`

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
await sdv.nbasl_gs.espnNbaslGsSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_types(...)
```

## `espnNbaslGsSeasonWeek`

NBASL_GS — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/weeks/{week}`

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
await sdv.nbasl_gs.espnNbaslGsSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_week(...)
```

## `espnNbaslGsSeasonWeekGames`

NBASL_GS — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/weeks/{week}/events`

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
await sdv.nbasl_gs.espnNbaslGsSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_week_games(...)
```

## `espnNbaslGsSeasonWeekPowerindex`

NBASL_GS — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

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
await sdv.nbasl_gs.espnNbaslGsSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_week_powerindex(...)
```

## `espnNbaslGsSeasonWeeks`

NBASL_GS — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons/{season}/types/{season_type}/weeks`

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
await sdv.nbasl_gs.espnNbaslGsSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_season_weeks(...)
```

## `espnNbaslGsSeasons`

NBASL_GS — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/seasons`

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
await sdv.nbasl_gs.espnNbaslGsSeasons({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_seasons(...)
```

## `espnNbaslGsStandingsCore`

NBASL_GS — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/standings`

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
await sdv.nbasl_gs.espnNbaslGsStandingsCore({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_standings_core(...)
```

## `espnNbaslGsTalentpicks`

NBASL_GS — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/talentpicks`

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
await sdv.nbasl_gs.espnNbaslGsTalentpicks({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_talentpicks(...)
```

## `espnNbaslGsTeamCore`

NBASL_GS — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_team_core(...)
```

## `espnNbaslGsTeamsCore`

NBASL_GS — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsTeamsCore({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_teams_core(...)
```

## `espnNbaslGsTournaments`

NBASL_GS — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/tournaments`

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
await sdv.nbasl_gs.espnNbaslGsTournaments({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_tournaments(...)
```

## `espnNbaslGsVenue`

NBASL_GS — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 40 leagues (`nba`, `wnba`, `nbagl`, `nbl`, `fiba`, `olympics_mbk`, `olympics_wbk`, `nbasl_lv`, `nbasl_ut`, `nbasl_ca`, `nbasl_sac`, `nbasl_orl`, `nbasl_gs`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.nbasl_gs.espnNbaslGsVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_venue(...)
```

## `espnNbaslGsVenues`

NBASL_GS — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba-summer-golden-state/venues`

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
await sdv.nbasl_gs.espnNbaslGsVenues({});
// snake_case alias (py/R parity): sdv.nbasl_gs.espn_nbasl_gs_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
