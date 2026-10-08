---
title: Analytics
sidebar_label: Analytics
sidebar_position: 2
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Analytics

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Pure frame-to-frame hockey analytics (shifts, on-ice, strength state, Corsi/Fenwick) and their league-parameterised fetch-and-enrich wrappers.

| Export | kind | module |
|---|---|---|
| [`parse_shifts`](#parse_shifts) | function | `src/analytics/hockeytech.ts` |
| [`parse_pbp`](#parse_pbp) | function | `src/analytics/hockeytech.ts` |
| [`mmss_to_seconds`](#mmss_to_seconds) | function | `src/analytics/hockeytech.ts` |
| [`add_clock_columns`](#add_clock_columns) | function | `src/analytics/hockeytech.ts` |
| [`add_coord_transforms`](#add_coord_transforms) | function | `src/analytics/hockeytech.ts` |
| [`add_shot_distance_angle`](#add_shot_distance_angle) | function | `src/analytics/hockeytech.ts` |
| [`NHL_SIZE_RINK_GOAL_X`](#nhl_size_rink_goal_x) | const | `src/analytics/hockeytech.ts` |
| [`scoring_chances`](#scoring_chances) | function | `src/analytics/hockeytech.ts` |
| [`build_on_ice`](#build_on_ice) | function | `src/analytics/hockeytech.ts` |
| [`GOAL_EPSILON_S`](#goal_epsilon_s) | const | `src/analytics/hockeytech.ts` |
| [`add_strength_state`](#add_strength_state) | function | `src/analytics/hockeytech.ts` |
| [`corsi_fenwick`](#corsi_fenwick) | function | `src/analytics/hockeytech.ts` |
| [`corsi_fenwick_on_ice`](#corsi_fenwick_on_ice) | function | `src/analytics/hockeytech.ts` |
| [`backfill_power_play`](#backfill_power_play) | function | `src/analytics/hockeytech.ts` |
| [`enrich_pbp`](#enrich_pbp) | function | `src/analytics/hockeytech.ts` |
| [`EnrichOptions`](#enrichoptions) | type | `src/analytics/hockeytech.ts` |
| [`per60`](#per60) | function | `src/analytics/hockeytech.ts` |
| [`player_toi`](#player_toi) | function | `src/analytics/hockeytech.ts` |
| [`game_corsi_rows`](#game_corsi_rows) | function | `src/analytics/hockeytech.ts` |
| [`hockeytechShiftStints`](#hockeytechshiftstints) | function | `src/analytics/hockeytech_family.ts` |
| [`hockeytechPlayerToi`](#hockeytechplayertoi) | function | `src/analytics/hockeytech_family.ts` |
| [`hockeytechEnrichedPbp`](#hockeytechenrichedpbp) | function | `src/analytics/hockeytech_family.ts` |
| [`hockeytechGameCorsi`](#hockeytechgamecorsi) | function | `src/analytics/hockeytech_family.ts` |
| [`buildHockeytechAnalytics`](#buildhockeytechanalytics) | function | `src/analytics/hockeytech_family.ts` |
| [`allHockeytechAnalytics`](#allhockeytechanalytics) | function | `src/analytics/hockeytech_family.ts` |
| [`HockeytechAnalytics`](#hockeytechanalytics) | type | `src/analytics/hockeytech_family.ts` |

## `src/analytics/hockeytech.ts`

Pure HockeyTech frame functions (ports of sdv-py `hockeytech/_analytics.py`): parse shifts and play-by-play, attach clocks, coordinates, on-ice players, strength state, Corsi/Fenwick and time on ice. No fetching — every function takes rows and returns rows.

**Import:** `import { … } from 'sportsdataverse/dist/analytics/hockeytech.js'`

### `parse_shifts`

A `modulekit/gameshifts` payload -\> one row per player-shift stint (the shift clock counts down).

```ts
export function parse_shifts(payload: unknown, game_id: unknown
```

### `parse_pbp`

A `gameCenterPlayByPlay` payload -\> one row per event, in the `hockeytech_a` (850x400) or `hockeytech_b` (600x300) coordinate dialect.

```ts
export function parse_pbp(payload: unknown, pbp_style: string
```

### `mmss_to_seconds`

`"M:SS"` -\> seconds, or `null`.

```ts
export function mmss_to_seconds(value: unknown): number | null
```

### `add_clock_columns`

Add `minute_start` / `second_start` / `clock` / `sec_from_start` from `time_of_period`.

```ts
export function add_clock_columns(pbp: Row[]): Row[]
```

### `add_coord_transforms`

Add the ten derived coordinate columns from `x_coord` / `y_coord`; `*_original` / `*_neutral` are canvas pixels, `*_fixed` (home team shoots right), `*_right` (every team shoots right, `null` when the side is unknown) and `*_vertical` (every team shoots up) are rotations of the rink-feet frame.

```ts
export function add_coord_transforms(pbp: Row[]): Row[]
```

### `add_shot_distance_angle`

Add shot distance (ft) and angle from the fixed coordinates, against a goal line at `goal_x`.

```ts
export function add_shot_distance_angle(pbp: Row[], goal_x: number
```

### `NHL_SIZE_RINK_GOAL_X`

The goal line's x on an NHL-sized rink (89 ft).

```ts
export const NHL_SIZE_RINK_GOAL_X
```

### `scoring_chances`

Flag scoring chances — shot attempts within `threshold_ft` of the goal.

```ts
export function scoring_chances(pbp: Row[], threshold_ft: number
```

### `build_on_ice`

Attach `on_ice_home` / `on_ice_away` (comma-joined player ids) to every event from the shift stints.

```ts
export function build_on_ice(pbp: Row[], shifts: Row[], goal_epsilon_s: number
```

### `GOAL_EPSILON_S`

The seconds of slack a goal gets when matched to a shift boundary (2).

```ts
export const GOAL_EPSILON_S
```

### `add_strength_state`

`skaters_home` / `skaters_away`, `strength_state` ("5v4", home first) and `strength_state_valid` from the on-ice lists.

```ts
export function add_strength_state(pbp: Row[], goalie_ids: Iterable<unknown> | null
```

### `corsi_fenwick`

Team-level CF/CA/CF%, FF/FA/FF% — one row per team.

```ts
export function corsi_fenwick(pbp: Row[]): Row[]
```

### `corsi_fenwick_on_ice`

Player-level on-ice CF/CA/FF/FA from an enriched play-by-play.

```ts
export function corsi_fenwick_on_ice(pbp: Row[]): Row[]
```

### `backfill_power_play`

Back-fill `power_play` / `short_handed` on shot and faceoff events inside a power-play window.

```ts
export function backfill_power_play(df: Row[]): Row[]
```

### `enrich_pbp`

The whole enrichment — game-meta columns, coordinates, clocks, power-play back-fill, shot geometry, on-ice and strength state (sdv-py `enrich_pbp`).

```ts
export function enrich_pbp(df: Row[], league: string, game_id: unknown, opts: EnrichOptions
```

### `EnrichOptions`

Options of `enrich_pbp` — shifts, goalie ids, coordinate dialect.

```ts
export interface EnrichOptions
```

### `per60`

A rate per 60 minutes from a count and seconds of ice time.

```ts
export function per60(value: number, toi_seconds: number): number
```

### `player_toi`

Per-player `toi_seconds`, `num_shifts`, `avg_shift_s` from a shifts frame.

```ts
export function player_toi(shifts: Row[]): Row[]
```

### `game_corsi_rows`

Player-level on-ice Corsi/Fenwick joined to time on ice (the body of `\<lg\>_game_corsi`).

```ts
export function game_corsi_rows(enrichedPbp: Row[], shifts: Row[]): Row[]
```


## `src/analytics/hockeytech_family.ts`

The league-parameterised HockeyTech analytics — fetch a game's shifts and play-by-play, then run the pure frame functions. Mounted on `sdv.hockeytech` as `hockeytech_shift_stints` / `hockeytech_player_toi` / `hockeytech_enriched_pbp` / `hockeytech_game_corsi` and, per league, `\<lg\>_game_shifts` / `\<lg\>_player_toi` / `\<lg\>_pbp` / `\<lg\>_game_corsi`.

**Mounted on:** `sdv.hockeytech` (snake_case name + camelCase alias).

### `hockeytechShiftStints`

A game's shift stints (sdv-py `\<lg\>_game_shifts`).

```ts
export async function hockeytechShiftStints(league: string, gameId: GameId): Promise<Row[]>
```

**Aliases:** `hockeytech_shift_stints`

**Example:**

```js
const stints = await sdv.hockeytech.hockeytech_shift_stints({ league: 'pwhl', game_id: 42 });
```

### `hockeytechPlayerToi`

A game's per-player time on ice (sdv-py `\<lg\>_player_toi`).

```ts
export async function hockeytechPlayerToi(league: string, gameId: GameId): Promise<Row[]>
```

**Aliases:** `hockeytech_player_toi`

### `hockeytechEnrichedPbp`

A game's enriched play-by-play (sdv-py `\<lg\>_pbp`).

```ts
export async function hockeytechEnrichedPbp(league: string, gameId: GameId): Promise<Row[]>
```

**Aliases:** `hockeytech_enriched_pbp`

### `hockeytechGameCorsi`

A game's player-level on-ice Corsi/Fenwick with time on ice (sdv-py `\<lg\>_game_corsi`).

```ts
export async function hockeytechGameCorsi(league: string, gameId: GameId): Promise<Row[]>
```

**Aliases:** `hockeytech_game_corsi`

### `buildHockeytechAnalytics`

The three per-league callables (`\<lg\>_game_shifts`, `\<lg\>_player_toi`, `\<lg\>_game_corsi`) for one league slug.

```ts
export function buildHockeytechAnalytics(league: string): Record<string, (gameId: GameId)
```

### `allHockeytechAnalytics`

Every league's analytics callables, keyed by name — what `sdv.hockeytech` mounts.

```ts
export function allHockeytechAnalytics(): HockeytechAnalytics
```

### `HockeytechAnalytics`

The type of `allHockeytechAnalytics()`.

```ts
export type HockeytechAnalytics =
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
