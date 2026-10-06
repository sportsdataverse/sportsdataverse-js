---
title: Models
sidebar_label: Models
sidebar_position: 4
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Models

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Offline models shipped with the package — cricket in-play win probability.

| Export | kind | module |
|---|---|---|
| [`cricket_match_state`](#cricket_match_state) | function | `src/models/cricket_wp.ts` |
| [`cricket_win_probability`](#cricket_win_probability) | function | `src/models/cricket_wp.ts` |
| [`cricket_expected_runs`](#cricket_expected_runs) | function | `src/models/cricket_wp.ts` |
| [`cricket_wpa`](#cricket_wpa) | function | `src/models/cricket_wp.ts` |
| [`parse_score_string`](#parse_score_string) | function | `src/models/cricket_wp.ts` |
| [`get_format`](#get_format) | function | `src/models/cricket_wp.ts` |
| [`norm_cdf`](#norm_cdf) | function | `src/models/cricket_wp.ts` |
| [`FORMAT_TABLE`](#format_table) | const | `src/models/cricket_wp.ts` |
| [`FormatConstants`](#formatconstants) | type | `src/models/cricket_wp.ts` |
| [`CricketState`](#cricketstate) | type | `src/models/cricket_wp.ts` |
| [`CricketWinProb`](#cricketwinprob) | type | `src/models/cricket_wp.ts` |
| [`CricketExpectedRuns`](#cricketexpectedruns) | type | `src/models/cricket_wp.ts` |
| [`CricketWpa`](#cricketwpa) | type | `src/models/cricket_wp.ts` |

## `src/models/cricket_wp.ts`

Cricket in-play win probability (port of sdv-py `cricket/cricket_wp.py` + `cricket_wpa.py`): match state from an ESPN summary, a resource-based projection fitted on Cricsheet T20I / ODI 2002-2026, expected runs and win-probability added. Pure and offline; mounted on `sdv.cricket` as `cricket_*` with camelCase aliases.

**Mounted on:** `sdv.cricket` (snake_case name + camelCase alias).

### `cricket_match_state`

Over-level match state from an ESPN cricket summary / scoreboard event — one row per innings with a parseable score.

```ts
export function cricket_match_state(summary: any, opts: { fmt: string }): CricketState[]
```

**Aliases:** `cricketMatchState`

**Example:**

```js
const state = sdv.cricket.cricket_match_state(summary, { fmt: 't20' });
const wp = sdv.cricket.cricket_win_probability(state);
```

### `cricket_win_probability`

In-play win probability of the batting / chasing team from match-state rows.

```ts
export function cricket_win_probability(state: CricketState[]): CricketWinProb[]
```

**Aliases:** `cricketWinProbability`

### `cricket_expected_runs`

Expected final runs from the projection (`proj_final`) and overs left.

```ts
export function cricket_expected_runs( stateWp: Pick<CricketWinProb, 'runs' | 'proj_final' | 'overs_left'>[], ): (typeof stateWp[number] & { exp_runs_remaining: number; exp_run_rate: number | null })[]
```

**Aliases:** `cricketExpectedRuns`

### `cricket_wpa`

Batting / bowling win-probability added — the change in `win_prob` within an innings.

```ts
export function cricket_wpa( stateWp: Pick<CricketWinProb, 'event_id' | 'innings_number' | 'balls_bowled' | 'win_prob'>[], ): (typeof stateWp[number] & { win_prob_before: number | null; wpa_batting: number; wpa_bowling: number })[]
```

**Aliases:** `cricketWpa`

### `parse_score_string`

`"185/4 (18.3 ov)"` -\> `[runs, wickets, balls, target]`, or `null`.

```ts
export function parse_score_string(score: unknown): [number, number, number, number | null] | null
```

**Aliases:** `parseScoreString`, `cricket_parse_score_string`

### `get_format`

The fitted resource constants of a format (`t20`, `odi`).

```ts
export function get_format(fmt: string): FormatConstants
```

**Aliases:** `getFormat`, `cricket_get_format`

### `norm_cdf`

The standard normal CDF.

```ts
export function norm_cdf(x: number): number
```

### `FORMAT_TABLE`

The fitted constants per format.

```ts
export const FORMAT_TABLE: Record<string, FormatConstants> =
```

### `FormatConstants`

A format's fitted constants.

```ts
export interface FormatConstants
```

### `CricketState`

One match-state row.

```ts
export interface CricketState
```

### `CricketWinProb`

A match-state row with `win_prob` and the projection.

```ts
export interface CricketWinProb extends CricketState
```

### `CricketExpectedRuns`

A win-probability row with `exp_runs`.

```ts
export interface CricketExpectedRuns extends CricketWinProb
```

### `CricketWpa`

A win-probability row with `wpa_batting` / `wpa_bowling`.

```ts
export interface CricketWpa extends CricketWinProb
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
