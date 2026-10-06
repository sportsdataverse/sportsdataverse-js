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


# `wch` — Core API

82 endpoints on `sdv.wch`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnWchPlayerAwards`

WCH — player awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/awards`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_awards` / `espnWchAthleteAwards`

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
await sdv.wch.espnWchPlayerAwards({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_awards(...)
```

## `espnWchPlayerCareerStats`

WCH — player career stats (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/statistics[/{stat_type}]`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_career_stats` / `espnWchAthleteCareerStats`

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
await sdv.wch.espnWchPlayerCareerStats({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_career_stats(...)
```

## `espnWchPlayerContracts`

WCH — player contracts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/contracts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_contracts` / `espnWchAthleteContracts`

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
await sdv.wch.espnWchPlayerContracts({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_contracts(...)
```

## `espnWchPlayerCore`

WCH — player core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_core` / `espnWchAthleteCore`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchPlayerCore({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_core(...)
```

## `espnWchPlayerEventlog`

WCH — player eventlog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/eventlog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_eventlog` / `espnWchAthleteEventlog`

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
await sdv.wch.espnWchPlayerEventlog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_eventlog(...)
```

## `espnWchPlayerInjuries`

WCH — player injuries (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/injuries`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_injuries` / `espnWchAthleteInjuries`

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
await sdv.wch.espnWchPlayerInjuries({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_injuries(...)
```

## `espnWchPlayerNotes`

WCH — player notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/notes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_notes` / `espnWchAthleteNotes`

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
await sdv.wch.espnWchPlayerNotes({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_notes(...)
```

## `espnWchPlayerRecords`

WCH — player records (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/records`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_records` / `espnWchAthleteRecords`

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
await sdv.wch.espnWchPlayerRecords({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_records(...)
```

## `espnWchPlayerSeasons`

WCH — player seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/seasons`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_seasons` / `espnWchAthleteSeasons`

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
await sdv.wch.espnWchPlayerSeasons({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_seasons(...)
```

## `espnWchPlayerStatisticslog`

WCH — player statisticslog (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/statisticslog`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_statisticslog` / `espnWchAthleteStatisticslog`

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
await sdv.wch.espnWchPlayerStatisticslog({ athlete_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_statisticslog(...)
```

## `espnWchPlayerVsPlayer`

WCH — player vs player (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes/{athlete_id}/vsathlete/{opp_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athlete_vs_athlete` / `espnWchAthleteVsAthlete`

| API param | JS | required | description |
|---|---|---|---|
| `{athlete_id}` | `athlete_id` | yes | `number \| string` — the ESPN athlete id |
| `{opp_id}` | `opp_id` | yes | `number \| string` — the `{opp_id}` path segment |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchPlayerVsPlayer({ athlete_id: '…', opp_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_player_vs_player(...)
```

## `espnWchPlayersIndex`

WCH — players index (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_athletes_index` / `espnWchAthletesIndex`

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
await sdv.wch.espnWchPlayersIndex({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_players_index(...)
```

## `espnWchAward`

WCH — award (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/awards/{award_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{award_id}` | `award_id` | yes | `number \| string` — the ESPN award id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchAward({ award_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_award(...)
```

## `espnWchAwards`

WCH — awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/awards`

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
await sdv.wch.espnWchAwards({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_awards(...)
```

## `espnWchCoach`

WCH — coach (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/coaches/{coach_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchCoach({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_coach(...)
```

## `espnWchCoachRecord`

WCH — coach record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/coaches/{coach_id}/record/{record_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{record_type}` | `record_type` | no | `number \| string` — the `{record_type}` path segment; optional; default `0` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchCoachRecord({ coach_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_coach_record(...)
```

## `espnWchCoachSeason`

WCH — coach season (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/coaches/{coach_id}/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{coach_id}` | `coach_id` | yes | `number \| string` — the ESPN coach id |
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchCoachSeason({ coach_id: '…', season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_coach_season(...)
```

## `espnWchGame`

WCH — game (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event` / `espnWchEvent`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGame({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game(...)
```

## `espnWchGameBroadcasts`

WCH — game broadcasts (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/broadcasts`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_broadcasts` / `espnWchEventBroadcasts`

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
await sdv.wch.espnWchGameBroadcasts({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_broadcasts(...)
```

## `espnWchGameCompetition`

WCH — game competition (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competition` / `espnWchEventCompetition`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGameCompetition({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_competition(...)
```

## `espnWchGameTeam`

WCH — game team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor` / `espnWchEventCompetitor`

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
await sdv.wch.espnWchGameTeam({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team(...)
```

## `espnWchGameTeamLeaders`

WCH — game team leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor_leaders` / `espnWchEventCompetitorLeaders`

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
await sdv.wch.espnWchGameTeamLeaders({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team_leaders(...)
```

## `espnWchGameTeamLinescores`

WCH — game team linescores (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}/linescores`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor_linescores` / `espnWchEventCompetitorLinescores`

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
await sdv.wch.espnWchGameTeamLinescores({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team_linescores(...)
```

## `espnWchGameTeamRecord`

WCH — game team record (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}/record`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor_record` / `espnWchEventCompetitorRecord`

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
await sdv.wch.espnWchGameTeamRecord({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team_record(...)
```

## `espnWchGameTeamRoster`

WCH — game team roster (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}/roster`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor_roster` / `espnWchEventCompetitorRoster`

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
await sdv.wch.espnWchGameTeamRoster({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team_roster(...)
```

## `espnWchGameTeamStatistics`

WCH — game team statistics (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors/{team_id}/statistics`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitor_statistics` / `espnWchEventCompetitorStatistics`

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
await sdv.wch.espnWchGameTeamStatistics({ event_id: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_team_statistics(...)
```

## `espnWchGameTeams`

WCH — game teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/competitors`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_competitors` / `espnWchEventCompetitors`

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
await sdv.wch.espnWchGameTeams({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_teams(...)
```

## `espnWchGameLeaders`

WCH — game leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/leaders`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_leaders` / `espnWchEventLeaders`

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
await sdv.wch.espnWchGameLeaders({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_leaders(...)
```

## `espnWchGameOdds`

WCH — game odds (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/odds`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_odds` / `espnWchEventOdds`

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
await sdv.wch.espnWchGameOdds({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_odds(...)
```

## `espnWchGameOfficialDetail`

WCH — game official detail (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/officials/{official_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_official_detail` / `espnWchEventOfficialDetail`

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
await sdv.wch.espnWchGameOfficialDetail({ event_id: '…', official_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_official_detail(...)
```

## `espnWchGameOfficials`

WCH — game officials (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/officials`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_officials` / `espnWchEventOfficials`

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
await sdv.wch.espnWchGameOfficials({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_officials(...)
```

## `espnWchGamePlay`

WCH — game play (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/plays/{play_id}`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_play` / `espnWchEventPlay`

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
await sdv.wch.espnWchGamePlay({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_play(...)
```

## `espnWchGamePlayPersonnel`

WCH — game play personnel (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/plays/{play_id}/personnel`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_play_personnel` / `espnWchEventPlayPersonnel`

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
await sdv.wch.espnWchGamePlayPersonnel({ event_id: '…', play_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_play_personnel(...)
```

## `espnWchGamePlays`

WCH — game plays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/plays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_plays` / `espnWchEventPlays`

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
await sdv.wch.espnWchGamePlays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_plays(...)
```

## `espnWchGamePowerindex`

WCH — game powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/powerindex`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_powerindex` / `espnWchEventPowerindex`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGamePowerindex({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_powerindex(...)
```

## `espnWchGamePredictor`

WCH — game predictor (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/predictor`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_predictor` / `espnWchEventPredictor`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGamePredictor({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_predictor(...)
```

## `espnWchGameProbabilities`

WCH — game probabilities (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/probabilities`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_probabilities` / `espnWchEventProbabilities`

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
await sdv.wch.espnWchGameProbabilities({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_probabilities(...)
```

## `espnWchGamePropbets`

WCH — game propbets (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/propbets`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_propbets` / `espnWchEventPropbets`

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
await sdv.wch.espnWchGamePropbets({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_propbets(...)
```

## `espnWchGameScoringplays`

WCH — game scoringplays (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/scoringplays`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_scoringplays` / `espnWchEventScoringplays`

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
await sdv.wch.espnWchGameScoringplays({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_scoringplays(...)
```

## `espnWchGameSituation`

WCH — game situation (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/situation`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_situation` / `espnWchEventSituation`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGameSituation({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_situation(...)
```

## `espnWchGameStatus`

WCH — game status (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events/{event_id}/competitions/{cid}/status`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_event_status` / `espnWchEventStatus`

| API param | JS | required | description |
|---|---|---|---|
| `{event_id}` | `event_id` | yes | `number \| string` — the ESPN event (game) id |
| `{cid}` | `cid` | no | `number \| string` — the `{cid}` path segment; optional; default from `event_id` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchGameStatus({ event_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_game_status(...)
```

## `espnWchGames`

WCH — games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_events` / `espnWchEvents`

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
await sdv.wch.espnWchGames({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_games(...)
```

## `espnWchFranchise`

WCH — franchise (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/franchises/{franchise_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{franchise_id}` | `franchise_id` | yes | `number \| string` — the ESPN franchise id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchFranchise({ franchise_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_franchise(...)
```

## `espnWchFranchises`

WCH — franchises (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/franchises`

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
await sdv.wch.espnWchFranchises({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_franchises(...)
```

## `espnWchLeadersCore`

WCH — leaders core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/leaders`

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
await sdv.wch.espnWchLeadersCore({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_leaders_core(...)
```

## `espnWchLeagueNotes`

WCH — league notes (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/notes`

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
await sdv.wch.espnWchLeagueNotes({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_league_notes(...)
```

## `espnWchLeagueRoot`

WCH — league root (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchLeagueRoot({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_league_root(...)
```

## `espnWchPosition`

WCH — position (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/positions/{position_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{position_id}` | `position_id` | yes | `number \| string` — the ESPN position id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchPosition({ position_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_position(...)
```

## `espnWchPositions`

WCH — positions (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/positions`

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
await sdv.wch.espnWchPositions({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_positions(...)
```

## `espnWchSeasonPlayers`

WCH — season players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_season_athletes` / `espnWchSeasonAthletes`

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
await sdv.wch.espnWchSeasonPlayers({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_players(...)
```

## `espnWchSeasonAwards`

WCH — season awards (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/awards`

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
await sdv.wch.espnWchSeasonAwards({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_awards(...)
```

## `espnWchSeasonCoaches`

WCH — season coaches (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/coaches`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `500` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_coaches`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_coaches`](../../reference/espn-parsed-returns#parse_coaches) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonCoaches({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_coaches(...)
```

## `espnWchSeasonDraft`

WCH — season draft (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/draft`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_draft`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_draft`](../../reference/espn-parsed-returns#parse_draft) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonDraft({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_draft(...)
```

## `espnWchSeasonDraftRoundPicks`

WCH — season draft round picks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/draft/rounds/{round_num}/picks`

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
await sdv.wch.espnWchSeasonDraftRoundPicks({ season: '…', round_num: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_draft_round_picks(...)
```

## `espnWchSeasonFreeagents`

WCH — season freeagents (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/freeagents`

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
await sdv.wch.espnWchSeasonFreeagents({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_freeagents(...)
```

## `espnWchSeasonFutures`

WCH — season futures (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/futures`

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
await sdv.wch.espnWchSeasonFutures({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_futures(...)
```

## `espnWchSeasonGroup`

WCH — season group (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/groups/{group_id}`

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
await sdv.wch.espnWchSeasonGroup({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_group(...)
```

## `espnWchSeasonGroupChildren`

WCH — season group children (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/groups/{group_id}/children`

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
await sdv.wch.espnWchSeasonGroupChildren({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_group_children(...)
```

## `espnWchSeasonGroupTeams`

WCH — season group teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/groups/{group_id}/teams`

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
await sdv.wch.espnWchSeasonGroupTeams({ season: '…', season_type: '…', group_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_group_teams(...)
```

## `espnWchSeasonGroups`

WCH — season groups (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/groups`

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
await sdv.wch.espnWchSeasonGroups({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_groups(...)
```

## `espnWchSeasonInfo`

WCH — season info (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonInfo({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_info(...)
```

## `espnWchSeasonPointer`

WCH — season pointer (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/season`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonPointer({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_pointer(...)
```

## `espnWchSeasonPowerindex`

WCH — season powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/powerindex[/{team_id}]`

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
await sdv.wch.espnWchSeasonPowerindex({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_powerindex(...)
```

## `espnWchSeasonPowerindexLeaders`

WCH — season powerindex leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/powerindex/leaders`

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
await sdv.wch.espnWchSeasonPowerindexLeaders({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_powerindex_leaders(...)
```

## `espnWchSeasonTeam`

WCH — season team (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonTeam({ season: '…', team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_team(...)
```

## `espnWchSeasonTeams`

WCH — season teams (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/teams`

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
await sdv.wch.espnWchSeasonTeams({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_teams(...)
```

## `espnWchSeasonType`

WCH — season type (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchSeasonType({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_type(...)
```

## `espnWchSeasonTypeCorrections`

WCH — season type corrections (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/corrections`

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
await sdv.wch.espnWchSeasonTypeCorrections({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_type_corrections(...)
```

## `espnWchSeasonTypeLeaders`

WCH — season type leaders (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/leaders`

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
await sdv.wch.espnWchSeasonTypeLeaders({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_type_leaders(...)
```

## `espnWchSeasonTypes`

WCH — season types (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types`

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
await sdv.wch.espnWchSeasonTypes({ season: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_types(...)
```

## `espnWchSeasonWeek`

WCH — season week (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/weeks/{week}`

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
await sdv.wch.espnWchSeasonWeek({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_week(...)
```

## `espnWchSeasonWeekGames`

WCH — season week games (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/weeks/{week}/events`

**Deprecated aliases (pre-v4 names, still callable):** `espn_wch_season_week_events` / `espnWchSeasonWeekEvents`

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
await sdv.wch.espnWchSeasonWeekGames({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_week_games(...)
```

## `espnWchSeasonWeekPowerindex`

WCH — season week powerindex (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/weeks/{week}/powerindex`

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
await sdv.wch.espnWchSeasonWeekPowerindex({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_week_powerindex(...)
```

## `espnWchSeasonWeeks`

WCH — season weeks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons/{season}/types/{season_type}/weeks`

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
await sdv.wch.espnWchSeasonWeeks({ season: '…', season_type: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_season_weeks(...)
```

## `espnWchSeasons`

WCH — seasons (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/seasons`

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
await sdv.wch.espnWchSeasons({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_seasons(...)
```

## `espnWchStandingsCore`

WCH — standings core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/standings`

| API param | JS | required | description |
|---|---|---|---|
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
await sdv.wch.espnWchStandingsCore({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_standings_core(...)
```

## `espnWchTalentpicks`

WCH — talentpicks (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/talentpicks`

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
await sdv.wch.espnWchTalentpicks({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_talentpicks(...)
```

## `espnWchTeamCore`

WCH — team core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/teams/{team_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{team_id}` | `team_id` | yes | `number \| string` — the ESPN team id (see `espn_<league>_teams`) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchTeamCore({ team_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_team_core(...)
```

## `espnWchTeamsCore`

WCH — teams core (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/teams`

| API param | JS | required | description |
|---|---|---|---|
| `limit` | `limit` | no | `number \| string` — the maximum number of items to return; default `1000` |
| `page` | `page` | no | `number \| string` — the page of a paginated Core v2 list (1-based); default `1` |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_teams`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_teams`](../../reference/espn-parsed-returns#parse_teams) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchTeamsCore({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_teams_core(...)
```

## `espnWchTournaments`

WCH — tournaments (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/tournaments`

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
await sdv.wch.espnWchTournaments({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_tournaments(...)
```

## `espnWchVenue`

WCH — venue (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/venues/{venue_id}`

| API param | JS | required | description |
|---|---|---|---|
| `{venue_id}` | `venue_id` | yes | `number \| string` — the ESPN venue id |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns:** raw ESPN `Dict` by default. With `{ parsed: true }` the payload is routed through its parser (`parse_single_entity`); the column set varies by league and payload, so no fixed table is published. This endpoint is exposed on 30 leagues (`nba`, `wnba`, `nbagl`, `mbb`, `wbb`, `cfb`, `nfl`, `mlb`, `nhl`, `mch`, `wch`, `college_baseball`, `college_softball`, `ufl`, `xfl`, `cfl`, `soccer`, `epl`, `laliga`, `bundesliga`, `seriea`, `ligue1`, `mls`, `ligamx`, `ucl`, `uel`, `nwsl`, `wwc`, `wc`, `cricket`) — see [`parse_single_entity`](../../reference/espn-parsed-returns#parse_single_entity) for the shared parser note.

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.wch.espnWchVenue({ venue_id: '…' });
// snake_case alias (py/R parity): sdv.wch.espn_wch_venue(...)
```

## `espnWchVenues`

WCH — venues (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/hockey/leagues/womens-college-hockey/venues`

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
await sdv.wch.espnWchVenues({});
// snake_case alias (py/R parity): sdv.wch.espn_wch_venues(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
