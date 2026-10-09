---
title: NCAA additional
sidebar_label: NCAA additional
sidebar_position: 6
---

:::danger Breaking in 4.0.0

- **Public names are sportsdataverse-py's** — `athlete` → `player`, `event` → `game` on every ESPN league; sdv-py's `name_pattern` on the native families (`nhlApiWeb*` → `nhl*`, `nflApi*` → `nfl*`, CBS's 16 shorts, the 3.0.0 file-stem names). Every pre-v4 name still works as a deprecated alias that warns once. ([changelog](/CHANGELOG#public-names-are-sportsdataverse-pys-every-pre-v4-and-300-name-is-a-deprecated-alias))
- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Typed wrapper params and loader rows; `strict` mode** — TypeScript only. A param the endpoint does not have, a missing required path param or a non-boolean `bool` param is a type error; parser rows are `Record<string, unknown>`; loader rows are their generated row types. ([changelog](/CHANGELOG#typescript--typed-wrapper-params-and-loader-rows-strict-mode))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::


# `cfb` — NCAA additional

6 endpoints on `sdv.cfb`. Each is exposed under a camelCase canonical name and a snake_case alias (py/R parity), accepts snake_case or camelCase params, and returns raw ESPN JSON by default (`{ parsed: true }` for tidy rows).

## `espnCfbRankings`

CFB — rankings (ESPN site.api.espn.com).

**Endpoint URL:** `GET https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings`

| API param | JS | required | description |
|---|---|---|---|
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_rankings`):

| col_name | type | description |
|---|---|---|
| `poll_id` | integer | ESPN poll id as a decimal string, e.g. '1' = AP Top 25, '2' = Coaches Poll, '20' = FCS Coaches Poll, '10624' = USCHO Men's Poll. |
| `poll_name` | character | Full poll name, e.g. 'AP Top 25', 'AFCA Coaches Poll', "USCHO Women's Poll". |
| `poll_short_name` | character | Short poll label, e.g. 'AP Poll'. |
| `poll_type` | character | ESPN poll type code, e.g. 'ap', 'usa' (coaches), 'fcs', 'USCHOMENSPOLL'. |
| `season` | integer | Season year of the poll (ESPN's ending year for a season that spans two calendar years, e.g. 2026 for 2025-26). |
| `season_type` | integer | Season phase of the poll: 1 = preseason, 2 = regular season, 3 = postseason. |
| `week` | integer | Poll week within season_type (the week ESPN's Core v2 rankings URL uses). |
| `week_display` | character | Poll week as ESPN labels it, e.g. 'Week 6'. |
| `poll_date` | character | Date the poll was released (ISO 8601, UTC). |
| `ranked` | logical | true for the poll's ranked teams; false for teams that only received votes. |
| `team_id` | character | ESPN team id as a decimal string (the dtype of scoreboard home_id / away_id). |
| `rank` | integer | Rank in this poll (1 = top). Null on vote-receiving rows. |
| `previous_rank` | integer | Position in the previous poll; 0 when the team was unranked then. |
| `points` | double | Poll points received (0 for polls ESPN ships without points, such as USCHO). |
| `first_place_votes` | integer | First-place votes received. Null when the poll does not report them. |
| `trend` | character | Movement since the previous poll as ESPN prints it, e.g. '+3', '-2', or '-' for no change. |
| `record_summary` | character | Team's win-loss record at the poll date, e.g. '5-0'. |
| `team_uid` | character | ESPN universal team id, e.g. 's:20~l:23~t:251'. |
| `team_location` | character | Team location (school name), e.g. 'Texas'. |
| `team_name` | character | Team mascot name, e.g. 'Longhorns'. |
| `team_nickname` | character | Short team name ESPN displays, e.g. 'Texas'. |
| `team_abbreviation` | character | Short team code ESPN displays, e.g. 'TEX'. |
| `team_color` | character | Team primary color as a hex string without '#'. Null for teams ESPN ships without one. |
| `team_logo` | character | URL of the team logo on ESPN's CDN. |
| `last_updated` | character | When ESPN last updated this poll entry (ISO 8601, UTC). |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.cfb.espnCfbRankings({});
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_rankings(...)
```

## `espnCfbRecruitingPlayers`

CFB — recruiting players (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/recruiting/{year}/athletes`

**Deprecated aliases (pre-v4 names, still callable):** `espn_cfb_recruiting_athletes` / `espnCfbRecruitingAthletes`

| API param | JS | required | description |
|---|---|---|---|
| `{year}` | `year` | yes | `number \| string` — the season year |
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
await sdv.cfb.espnCfbRecruitingPlayers({ year: '…' });
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_recruiting_players(...)
```

## `espnCfbRecruitingRankings`

CFB — recruiting rankings (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/recruiting/{year}/rankings`

| API param | JS | required | description |
|---|---|---|---|
| `{year}` | `year` | yes | `number \| string` — the season year |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.cfb.espnCfbRecruitingRankings({ year: '…' });
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_recruiting_rankings(...)
```

## `espnCfbRecruitingYears`

CFB — recruiting years (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/recruiting`

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
await sdv.cfb.espnCfbRecruitingYears({});
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_recruiting_years(...)
```

## `espnCfbRecruits`

CFB — recruits (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/{season}/recruits`

**Deprecated aliases (pre-v4 names, still callable):** `espn_cfb_season_recruits` / `espnCfbSeasonRecruits`

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
await sdv.cfb.espnCfbRecruits({ season: '…' });
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_recruits(...)
```

## `espnCfbWeekRankings`

CFB — week rankings (ESPN sports.core.api.espn.com (core v2)).

**Endpoint URL:** `GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/{season}/types/{season_type}/weeks/{week}/rankings`

**Deprecated aliases (pre-v4 names, still callable):** `espn_cfb_season_week_rankings` / `espnCfbSeasonWeekRankings`

| API param | JS | required | description |
|---|---|---|---|
| `{season}` | `season` | yes | `number \| string` — the season year (the year the season ends for winter sports, e.g. `2025` for 2024-25) |
| `{season_type}` | `season_type` | yes | `number \| string` — the season type: `1` preseason, `2` regular season, `3` postseason |
| `{week}` | `week` | yes | `number \| string` — the week of the season (football) |
| — | `parsed` | no | `boolean` — return tidy rows instead of raw JSON |

**Returns** (with `{ parsed: true }`, via `parse_items`):

| col_name | type | description |
|---|---|---|
| `$ref` | character | Core v2 $ref URL to the resource |

_Rows are untyped `Row[]` (not parity-verified yet)._

**Example:**

```js
await sdv.cfb.espnCfbWeekRankings({ season: '…', season_type: '…', week: '…' });
// snake_case alias (py/R parity): sdv.cfb.espn_cfb_week_rankings(...)
```

_Generated by tools/codegen/generate.mjs from tools/codegen/endpoints/espn_*.yaml (vendored from sdv-py) — see [How this library is built](/docs/architecture/espn-vendored)._
