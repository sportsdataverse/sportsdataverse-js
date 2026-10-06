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


# `soccer` — Core API

82 endpoints on `sdv.soccer`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnSoccerPlayerAwards`

SOCCER — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/awards`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_awards` / `espnSoccerAthleteAwards`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_awards(...)
```

## `espnSoccerPlayerCareerStats`

SOCCER — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/statistics[/{stat_type}]`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_career_stats` / `espnSoccerAthleteCareerStats`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_career_stats(...)
```

## `espnSoccerPlayerContracts`

SOCCER — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/contracts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_contracts` / `espnSoccerAthleteContracts`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_contracts(...)
```

## `espnSoccerPlayerCore`

SOCCER — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_core` / `espnSoccerAthleteCore`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_core(...)
```

## `espnSoccerPlayerEventlog`

SOCCER — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/eventlog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_eventlog` / `espnSoccerAthleteEventlog`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_eventlog(...)
```

## `espnSoccerPlayerInjuries`

SOCCER — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/injuries`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_injuries` / `espnSoccerAthleteInjuries`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_injuries(...)
```

## `espnSoccerPlayerNotes`

SOCCER — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/notes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_notes` / `espnSoccerAthleteNotes`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_notes(...)
```

## `espnSoccerPlayerRecords`

SOCCER — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/records`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_records` / `espnSoccerAthleteRecords`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_records(...)
```

## `espnSoccerPlayerSeasons`

SOCCER — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/seasons`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_seasons` / `espnSoccerAthleteSeasons`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_seasons(...)
```

## `espnSoccerPlayerStatisticslog`

SOCCER — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/statisticslog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_statisticslog` / `espnSoccerAthleteStatisticslog`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_statisticslog(...)
```

## `espnSoccerPlayerVsPlayer`

SOCCER — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes/{athlete_id}/vsathlete/{opp_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athlete_vs_athlete` / `espnSoccerAthleteVsAthlete`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_player_vs_player(...)
```

## `espnSoccerPlayersIndex`

SOCCER — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_athletes_index` / `espnSoccerAthletesIndex`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerPlayersIndex({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_players_index(...)
```

## `espnSoccerAward`

SOCCER — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_award(...)
```

## `espnSoccerAwards`

SOCCER — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/awards`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerAwards({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_awards(...)
```

## `espnSoccerCoach`

SOCCER — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_coach(...)
```

## `espnSoccerCoachRecord`

SOCCER — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_coach_record(...)
```

## `espnSoccerCoachSeason`

SOCCER — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_coach_season(...)
```

## `espnSoccerGame`

SOCCER — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event` / `espnSoccerEvent`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game(...)
```

## `espnSoccerGameBroadcasts`

SOCCER — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/broadcasts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_broadcasts` / `espnSoccerEventBroadcasts`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_broadcasts(...)
```

## `espnSoccerGameCompetition`

SOCCER — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competition` / `espnSoccerEventCompetition`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_competition(...)
```

## `espnSoccerGameTeam`

SOCCER — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor` / `espnSoccerEventCompetitor`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team(...)
```

## `espnSoccerGameTeamLeaders`

SOCCER — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor_leaders` / `espnSoccerEventCompetitorLeaders`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team_leaders(...)
```

## `espnSoccerGameTeamLinescores`

SOCCER — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor_linescores` / `espnSoccerEventCompetitorLinescores`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_linescores`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_linescores`](../../reference/espn-parsed-returns#parse_event_competitor_linescores) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team_linescores(...)
```

## `espnSoccerGameTeamRecord`

SOCCER — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor_record` / `espnSoccerEventCompetitorRecord`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team_record(...)
```

## `espnSoccerGameTeamRoster`

SOCCER — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor_roster` / `espnSoccerEventCompetitorRoster`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_competitor_roster`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_competitor_roster`](../../reference/espn-parsed-returns#parse_event_competitor_roster) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team_roster(...)
```

## `espnSoccerGameTeamStatistics`

SOCCER — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitor_statistics` / `espnSoccerEventCompetitorStatistics`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_team_statistics(...)
```

## `espnSoccerGameTeams`

SOCCER — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/competitors`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_competitors` / `espnSoccerEventCompetitors`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_teams(...)
```

## `espnSoccerGameLeaders`

SOCCER — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_leaders` / `espnSoccerEventLeaders`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_leaders(...)
```

## `espnSoccerGameOdds`

SOCCER — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/odds`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_odds` / `espnSoccerEventOdds`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_odds(...)
```

## `espnSoccerGameOfficialDetail`

SOCCER — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/officials/{official_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_official_detail` / `espnSoccerEventOfficialDetail`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{official_id}` | `official_id` | yes | `number \| string` — the `{official_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_official_detail(...)
```

## `espnSoccerGameOfficials`

SOCCER — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/officials`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_officials` / `espnSoccerEventOfficials`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_officials(...)
```

## `espnSoccerGamePlay`

SOCCER — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/plays/{play_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_play` / `espnSoccerEventPlay`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{play_id}` | `play_id` | yes | `number \| string` — the `{play_id}` path segment |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_play(...)
```

## `espnSoccerGamePlayPersonnel`

SOCCER — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_play_personnel` / `espnSoccerEventPlayPersonnel`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_play_personnel(...)
```

## `espnSoccerGamePlays`

SOCCER — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/plays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_plays` / `espnSoccerEventPlays`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_event_plays`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_event_plays`](../../reference/espn-parsed-returns#parse_event_plays) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_plays(...)
```

## `espnSoccerGamePowerindex`

SOCCER — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/powerindex`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_powerindex` / `espnSoccerEventPowerindex`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_powerindex(...)
```

## `espnSoccerGamePredictor`

SOCCER — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/predictor`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_predictor` / `espnSoccerEventPredictor`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_predictor(...)
```

## `espnSoccerGameProbabilities`

SOCCER — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/probabilities`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_probabilities` / `espnSoccerEventProbabilities`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_probabilities(...)
```

## `espnSoccerGamePropbets`

SOCCER — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/propbets`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_propbets` / `espnSoccerEventPropbets`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_propbets(...)
```

## `espnSoccerGameScoringplays`

SOCCER — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/scoringplays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_scoringplays` / `espnSoccerEventScoringplays`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_scoringplays(...)
```

## `espnSoccerGameSituation`

SOCCER — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/situation`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_situation` / `espnSoccerEventSituation`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_situation(...)
```

## `espnSoccerGameStatus`

SOCCER — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events/{event_id}/competitions/{cid}/status`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_event_status` / `espnSoccerEventStatus`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_game_status(...)
```

## `espnSoccerGames`

SOCCER — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_events` / `espnSoccerEvents`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerGames({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_games(...)
```

## `espnSoccerFranchise`

SOCCER — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_franchise(...)
```

## `espnSoccerFranchises`

SOCCER — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/franchises`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerFranchises({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_franchises(...)
```

## `espnSoccerLeadersCore`

SOCCER — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerLeadersCore({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_leaders_core(...)
```

## `espnSoccerLeagueNotes`

SOCCER — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/notes`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerLeagueNotes({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_league_notes(...)
```

## `espnSoccerLeagueRoot`

SOCCER — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerLeagueRoot({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_league_root(...)
```

## `espnSoccerPosition`

SOCCER — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_position(...)
```

## `espnSoccerPositions`

SOCCER — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/positions`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerPositions({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_positions(...)
```

## `espnSoccerSeasonPlayers`

SOCCER — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_season_athletes` / `espnSoccerSeasonAthletes`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_players(...)
```

## `espnSoccerSeasonAwards`

SOCCER — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/awards`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_awards(...)
```

## `espnSoccerSeasonCoaches`

SOCCER — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_coaches(...)
```

## `espnSoccerSeasonDraft`

SOCCER — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_draft(...)
```

## `espnSoccerSeasonDraftRoundPicks`

SOCCER — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/draft/rounds/{round_num}/picks`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_draft_round_picks(...)
```

## `espnSoccerSeasonFreeagents`

SOCCER — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/freeagents`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_freeagents(...)
```

## `espnSoccerSeasonFutures`

SOCCER — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/futures`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_futures(...)
```

## `espnSoccerSeasonGroup`

SOCCER — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/groups/{group_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{group_id}` | `group_id` | yes | `number \| string` — the `{group_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_group(...)
```

## `espnSoccerSeasonGroupChildren`

SOCCER — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/groups/{group_id}/children`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_group_children(...)
```

## `espnSoccerSeasonGroupTeams`

SOCCER — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_group_teams(...)
```

## `espnSoccerSeasonGroups`

SOCCER — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/groups`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_groups(...)
```

## `espnSoccerSeasonInfo`

SOCCER — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_info(...)
```

## `espnSoccerSeasonPointer`

SOCCER — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/season`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonPointer({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_pointer(...)
```

## `espnSoccerSeasonPowerindex`

SOCCER — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/powerindex[/{team_id}]`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_powerindex(...)
```

## `espnSoccerSeasonPowerindexLeaders`

SOCCER — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/powerindex/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_powerindex_leaders(...)
```

## `espnSoccerSeasonTeam`

SOCCER — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_team(...)
```

## `espnSoccerSeasonTeams`

SOCCER — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/teams`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_teams(...)
```

## `espnSoccerSeasonType`

SOCCER — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_type(...)
```

## `espnSoccerSeasonTypeCorrections`

SOCCER — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/corrections`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_type_corrections(...)
```

## `espnSoccerSeasonTypeLeaders`

SOCCER — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/leaders`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_type_leaders(...)
```

## `espnSoccerSeasonTypes`

SOCCER — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_types(...)
```

## `espnSoccerSeasonWeek`

SOCCER — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/weeks/{week}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_week(...)
```

## `espnSoccerSeasonWeekGames`

SOCCER — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/weeks/{week}/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_soccer_season_week_events` / `espnSoccerSeasonWeekEvents`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_week_games(...)
```

## `espnSoccerSeasonWeekPowerindex`

SOCCER — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_week_powerindex(...)
```

## `espnSoccerSeasonWeeks`

SOCCER — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{season}/types/{season_type}/weeks`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_season_weeks(...)
```

## `espnSoccerSeasons`

SOCCER — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerSeasons({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_seasons(...)
```

## `espnSoccerStandingsCore`

SOCCER — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/standings`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
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
await sdv.soccer.espnSoccerStandingsCore({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_standings_core(...)
```

## `espnSoccerTalentpicks`

SOCCER — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/talentpicks`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerTalentpicks({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_talentpicks(...)
```

## `espnSoccerTeamCore`

SOCCER — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_team_core(...)
```

## `espnSoccerTeamsCore`

SOCCER — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/teams`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerTeamsCore({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_teams_core(...)
```

## `espnSoccerTournaments`

SOCCER — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/tournaments`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `200` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerTournaments({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_tournaments(...)
```

## `espnSoccerVenue`

SOCCER — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_venue(...)
```

## `espnSoccerVenues`

SOCCER — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/venues`

| API param | JS | required | description |
|---|---|---|---|
| `league` | `league` | no | ESPN league slug override (default `eng.1`) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.soccer.espnSoccerVenues({ league: 'eng.1' });
// snake_case alias (py/R parity): sdv.soccer.espn_soccer_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
