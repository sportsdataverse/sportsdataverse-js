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


# `ligamx` — Core API

82 endpoints on `sdv.ligamx`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnLigamxPlayerAwards`

LIGAMX — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/awards`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_awards` / `espnLigamxAthleteAwards`

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
await sdv.ligamx.espnLigamxPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_awards(...)
```

## `espnLigamxPlayerCareerStats`

LIGAMX — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/statistics[/{stat_type}]`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_career_stats` / `espnLigamxAthleteCareerStats`

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
await sdv.ligamx.espnLigamxPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_career_stats(...)
```

## `espnLigamxPlayerContracts`

LIGAMX — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/contracts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_contracts` / `espnLigamxAthleteContracts`

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
await sdv.ligamx.espnLigamxPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_contracts(...)
```

## `espnLigamxPlayerCore`

LIGAMX — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_core` / `espnLigamxAthleteCore`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_core(...)
```

## `espnLigamxPlayerEventlog`

LIGAMX — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/eventlog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_eventlog` / `espnLigamxAthleteEventlog`

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
await sdv.ligamx.espnLigamxPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_eventlog(...)
```

## `espnLigamxPlayerInjuries`

LIGAMX — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/injuries`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_injuries` / `espnLigamxAthleteInjuries`

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
await sdv.ligamx.espnLigamxPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_injuries(...)
```

## `espnLigamxPlayerNotes`

LIGAMX — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/notes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_notes` / `espnLigamxAthleteNotes`

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
await sdv.ligamx.espnLigamxPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_notes(...)
```

## `espnLigamxPlayerRecords`

LIGAMX — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/records`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_records` / `espnLigamxAthleteRecords`

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
await sdv.ligamx.espnLigamxPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_records(...)
```

## `espnLigamxPlayerSeasons`

LIGAMX — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/seasons`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_seasons` / `espnLigamxAthleteSeasons`

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
await sdv.ligamx.espnLigamxPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_seasons(...)
```

## `espnLigamxPlayerStatisticslog`

LIGAMX — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/statisticslog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_statisticslog` / `espnLigamxAthleteStatisticslog`

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
await sdv.ligamx.espnLigamxPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_statisticslog(...)
```

## `espnLigamxPlayerVsPlayer`

LIGAMX — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes/{athlete_id}/vsathlete/{opp_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athlete_vs_athlete` / `espnLigamxAthleteVsAthlete`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_player_vs_player(...)
```

## `espnLigamxPlayersIndex`

LIGAMX — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_athletes_index` / `espnLigamxAthletesIndex`

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
await sdv.ligamx.espnLigamxPlayersIndex({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_players_index(...)
```

## `espnLigamxAward`

LIGAMX — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_award(...)
```

## `espnLigamxAwards`

LIGAMX — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/awards`

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
await sdv.ligamx.espnLigamxAwards({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_awards(...)
```

## `espnLigamxCoach`

LIGAMX — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_coach(...)
```

## `espnLigamxCoachRecord`

LIGAMX — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_coach_record(...)
```

## `espnLigamxCoachSeason`

LIGAMX — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_coach_season(...)
```

## `espnLigamxGame`

LIGAMX — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event` / `espnLigamxEvent`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game(...)
```

## `espnLigamxGameBroadcasts`

LIGAMX — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/broadcasts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_broadcasts` / `espnLigamxEventBroadcasts`

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
await sdv.ligamx.espnLigamxGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_broadcasts(...)
```

## `espnLigamxGameCompetition`

LIGAMX — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competition` / `espnLigamxEventCompetition`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_competition(...)
```

## `espnLigamxGameTeam`

LIGAMX — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor` / `espnLigamxEventCompetitor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team(...)
```

## `espnLigamxGameTeamLeaders`

LIGAMX — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor_leaders` / `espnLigamxEventCompetitorLeaders`

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
await sdv.ligamx.espnLigamxGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team_leaders(...)
```

## `espnLigamxGameTeamLinescores`

LIGAMX — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor_linescores` / `espnLigamxEventCompetitorLinescores`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_linescores`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_linescores`](../../reference/espn-parsed-returns#parse_event_competitor_linescores) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team_linescores(...)
```

## `espnLigamxGameTeamRecord`

LIGAMX — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor_record` / `espnLigamxEventCompetitorRecord`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team_record(...)
```

## `espnLigamxGameTeamRoster`

LIGAMX — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor_roster` / `espnLigamxEventCompetitorRoster`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_roster`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_roster`](../../reference/espn-parsed-returns#parse_event_competitor_roster) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team_roster(...)
```

## `espnLigamxGameTeamStatistics`

LIGAMX — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitor_statistics` / `espnLigamxEventCompetitorStatistics`

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
await sdv.ligamx.espnLigamxGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_team_statistics(...)
```

## `espnLigamxGameTeams`

LIGAMX — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/competitors`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_competitors` / `espnLigamxEventCompetitors`

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
await sdv.ligamx.espnLigamxGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_teams(...)
```

## `espnLigamxGameLeaders`

LIGAMX — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_leaders` / `espnLigamxEventLeaders`

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
await sdv.ligamx.espnLigamxGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_leaders(...)
```

## `espnLigamxGameOdds`

LIGAMX — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/odds`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_odds` / `espnLigamxEventOdds`

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
await sdv.ligamx.espnLigamxGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_odds(...)
```

## `espnLigamxGameOfficialDetail`

LIGAMX — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/officials/{official_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_official_detail` / `espnLigamxEventOfficialDetail`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{official_id}` | `official_id` | yes | `number \| string` — the `{official_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_official_detail(...)
```

## `espnLigamxGameOfficials`

LIGAMX — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/officials`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_officials` / `espnLigamxEventOfficials`

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
await sdv.ligamx.espnLigamxGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_officials(...)
```

## `espnLigamxGamePlay`

LIGAMX — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/plays/{play_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_play` / `espnLigamxEventPlay`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{play_id}` | `play_id` | yes | `number \| string` — the `{play_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_play(...)
```

## `espnLigamxGamePlayPersonnel`

LIGAMX — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_play_personnel` / `espnLigamxEventPlayPersonnel`

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
await sdv.ligamx.espnLigamxGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_play_personnel(...)
```

## `espnLigamxGamePlays`

LIGAMX — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/plays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_plays` / `espnLigamxEventPlays`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_plays`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_plays`](../../reference/espn-parsed-returns#parse_event_plays) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_plays(...)
```

## `espnLigamxGamePowerindex`

LIGAMX — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/powerindex`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_powerindex` / `espnLigamxEventPowerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_powerindex(...)
```

## `espnLigamxGamePredictor`

LIGAMX — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/predictor`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_predictor` / `espnLigamxEventPredictor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_predictor(...)
```

## `espnLigamxGameProbabilities`

LIGAMX — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/probabilities`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_probabilities` / `espnLigamxEventProbabilities`

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
await sdv.ligamx.espnLigamxGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_probabilities(...)
```

## `espnLigamxGamePropbets`

LIGAMX — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/propbets`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_propbets` / `espnLigamxEventPropbets`

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
await sdv.ligamx.espnLigamxGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_propbets(...)
```

## `espnLigamxGameScoringplays`

LIGAMX — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/scoringplays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_scoringplays` / `espnLigamxEventScoringplays`

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
await sdv.ligamx.espnLigamxGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_scoringplays(...)
```

## `espnLigamxGameSituation`

LIGAMX — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/situation`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_situation` / `espnLigamxEventSituation`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_situation(...)
```

## `espnLigamxGameStatus`

LIGAMX — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events/{event_id}/competitions/{cid}/status`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_event_status` / `espnLigamxEventStatus`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_game_status(...)
```

## `espnLigamxGames`

LIGAMX — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_events` / `espnLigamxEvents`

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
await sdv.ligamx.espnLigamxGames({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_games(...)
```

## `espnLigamxFranchise`

LIGAMX — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_franchise(...)
```

## `espnLigamxFranchises`

LIGAMX — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/franchises`

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
await sdv.ligamx.espnLigamxFranchises({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_franchises(...)
```

## `espnLigamxLeadersCore`

LIGAMX — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/leaders`

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
await sdv.ligamx.espnLigamxLeadersCore({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_leaders_core(...)
```

## `espnLigamxLeagueNotes`

LIGAMX — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/notes`

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
await sdv.ligamx.espnLigamxLeagueNotes({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_league_notes(...)
```

## `espnLigamxLeagueRoot`

LIGAMX — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxLeagueRoot({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_league_root(...)
```

## `espnLigamxPosition`

LIGAMX — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_position(...)
```

## `espnLigamxPositions`

LIGAMX — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/positions`

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
await sdv.ligamx.espnLigamxPositions({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_positions(...)
```

## `espnLigamxSeasonPlayers`

LIGAMX — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_season_athletes` / `espnLigamxSeasonAthletes`

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
await sdv.ligamx.espnLigamxSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_players(...)
```

## `espnLigamxSeasonAwards`

LIGAMX — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/awards`

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
await sdv.ligamx.espnLigamxSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_awards(...)
```

## `espnLigamxSeasonCoaches`

LIGAMX — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_coaches(...)
```

## `espnLigamxSeasonDraft`

LIGAMX — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_draft(...)
```

## `espnLigamxSeasonDraftRoundPicks`

LIGAMX — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/draft/rounds/{round_num}/picks`

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
await sdv.ligamx.espnLigamxSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_draft_round_picks(...)
```

## `espnLigamxSeasonFreeagents`

LIGAMX — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/freeagents`

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
await sdv.ligamx.espnLigamxSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_freeagents(...)
```

## `espnLigamxSeasonFutures`

LIGAMX — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/futures`

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
await sdv.ligamx.espnLigamxSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_futures(...)
```

## `espnLigamxSeasonGroup`

LIGAMX — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/groups/{group_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{group_id}` | `group_id` | yes | `number \| string` — the `{group_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_group(...)
```

## `espnLigamxSeasonGroupChildren`

LIGAMX — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/groups/{group_id}/children`

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
await sdv.ligamx.espnLigamxSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_group_children(...)
```

## `espnLigamxSeasonGroupTeams`

LIGAMX — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

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
await sdv.ligamx.espnLigamxSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_group_teams(...)
```

## `espnLigamxSeasonGroups`

LIGAMX — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/groups`

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
await sdv.ligamx.espnLigamxSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_groups(...)
```

## `espnLigamxSeasonInfo`

LIGAMX — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_info(...)
```

## `espnLigamxSeasonPointer`

LIGAMX — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/season`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonPointer({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_pointer(...)
```

## `espnLigamxSeasonPowerindex`

LIGAMX — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/powerindex[/{team_id}]`

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
await sdv.ligamx.espnLigamxSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_powerindex(...)
```

## `espnLigamxSeasonPowerindexLeaders`

LIGAMX — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/powerindex/leaders`

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
await sdv.ligamx.espnLigamxSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_powerindex_leaders(...)
```

## `espnLigamxSeasonTeam`

LIGAMX — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_team(...)
```

## `espnLigamxSeasonTeams`

LIGAMX — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/teams`

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
await sdv.ligamx.espnLigamxSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_teams(...)
```

## `espnLigamxSeasonType`

LIGAMX — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_type(...)
```

## `espnLigamxSeasonTypeCorrections`

LIGAMX — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/corrections`

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
await sdv.ligamx.espnLigamxSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_type_corrections(...)
```

## `espnLigamxSeasonTypeLeaders`

LIGAMX — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/leaders`

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
await sdv.ligamx.espnLigamxSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_type_leaders(...)
```

## `espnLigamxSeasonTypes`

LIGAMX — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types`

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
await sdv.ligamx.espnLigamxSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_types(...)
```

## `espnLigamxSeasonWeek`

LIGAMX — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/weeks/{week}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_week(...)
```

## `espnLigamxSeasonWeekGames`

LIGAMX — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/weeks/{week}/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_ligamx_season_week_events` / `espnLigamxSeasonWeekEvents`

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
await sdv.ligamx.espnLigamxSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_week_games(...)
```

## `espnLigamxSeasonWeekPowerindex`

LIGAMX — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

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
await sdv.ligamx.espnLigamxSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_week_powerindex(...)
```

## `espnLigamxSeasonWeeks`

LIGAMX — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{season}/types/{season_type}/weeks`

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
await sdv.ligamx.espnLigamxSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_season_weeks(...)
```

## `espnLigamxSeasons`

LIGAMX — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons`

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
await sdv.ligamx.espnLigamxSeasons({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_seasons(...)
```

## `espnLigamxStandingsCore`

LIGAMX — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/standings`

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
await sdv.ligamx.espnLigamxStandingsCore({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_standings_core(...)
```

## `espnLigamxTalentpicks`

LIGAMX — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/talentpicks`

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
await sdv.ligamx.espnLigamxTalentpicks({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_talentpicks(...)
```

## `espnLigamxTeamCore`

LIGAMX — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_team_core(...)
```

## `espnLigamxTeamsCore`

LIGAMX — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxTeamsCore({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_teams_core(...)
```

## `espnLigamxTournaments`

LIGAMX — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/tournaments`

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
await sdv.ligamx.espnLigamxTournaments({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_tournaments(...)
```

## `espnLigamxVenue`

LIGAMX — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.ligamx.espnLigamxVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_venue(...)
```

## `espnLigamxVenues`

LIGAMX — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/venues`

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
await sdv.ligamx.espnLigamxVenues({});
// snake_case alias (py/R parity): sdv.ligamx.espn_ligamx_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
