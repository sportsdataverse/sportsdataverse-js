---
title: Transforms
sidebar_label: Transforms
sidebar_position: 7
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Transforms

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Parameter transforms the wrappers apply before a request, and the tidy.js toolkit for the rows after it.

| Export | kind | module |
|---|---|---|
| [`bool_str`](#bool_str) | function | `src/core/transforms.ts` |
| [`_bool_str`](#_bool_str) | function | `src/core/transforms.ts` |
| [`format_nhl_season`](#format_nhl_season) | function | `src/core/transforms.ts` |
| [`season_latest_with_data`](#season_latest_with_data) | function | `src/core/transforms.ts` |
| [`latestSeason`](#latestseason) | function | `src/core/transforms.ts` |
| [`redateDefaultSeasons`](#redatedefaultseasons) | function | `src/core/transforms.ts` |
| [`DefaultSeason`](#defaultseason) | class | `src/core/transforms.ts` |
| [`TRANSFORMS`](#transforms) | const | `src/core/transforms.ts` |
| [`applyTransform`](#applytransform) | function | `src/core/transforms.ts` |
| [`ParamTransform`](#paramtransform) | type | `src/core/transforms.ts` |
| [`tidy`](#tidy) | const | `src/index.ts` |
| [`Sdv`](#sdv) | type | `src/index.ts` |

## `src/core/transforms.ts`

Parameter transforms named in the endpoint YAML (`transform:`), applied to a resolved argument before the request — ports of the sdv-py runtime functions of the same names.

**Import:** `import { … } from 'sportsdataverse/dist/core/transforms.js'`

### `bool_str`

`sportsdataverse._codegen_runtime.bool_str` — a truthy value sends `"true"`, a falsy one `"false"`.

```ts
export function bool_str(value: unknown): unknown
```

### `_bool_str`

`nfl_api_runtime._bool_str` — `str(value).lower()`.

```ts
export function _bool_str(value: unknown): unknown
```

### `format_nhl_season`

A 4-digit end year -\> the 8-digit NHL api-web season (`2025` -\> `"20242025"`); 8 digits pass through.

```ts
export function format_nhl_season(season: unknown): unknown
```

### `season_latest_with_data`

The stats.nba.com / stats.wnba.com season default: the season unchanged, or, when unset, the latest season with rows (re-dated per request).

```ts
export function season_latest_with_data(season: unknown, def?: { api?: string }): unknown
```

### `latestSeason`

The latest season with rows on a date for a league id, endpoint and season type (sdv-py `_latest_season`).

```ts
export function latestSeason( leagueId: string
```

### `redateDefaultSeasons`

Re-date every wrapper-filled `Season` / `SeasonYear` of a query for the request's league, endpoint and `SeasonType`.

```ts
export function redateDefaultSeasons( def: { host?: string; path?: string }, query: Record<string, any>, today: Date
```

### `DefaultSeason`

A season the wrapper filled in (not the caller's) — what `redateDefaultSeasons` re-dates.

```ts
export class DefaultSeason extends String {} /** * `sportsdataverse.{nba,wnba}.*_stats_runtime.season_latest_with_data`: the season * unchanged (an explicit `""` too: every season), or, when unset, the latest season * that has data. Resolved per call, so a long-running process rolls over too; the * flat resolver re-dates it per league, endpoint and SeasonType (`redateDefaultSeasons`). */ export function season_latest_with_data(season: unknown, def?: { api?: string }): unknown
```

### `TRANSFORMS`

The transform registry — YAML name -\> function.

```ts
export const TRANSFORMS: Record<string, ParamTransform> =
```

### `applyTransform`

Apply a named transform to a value (unknown name throws).

```ts
export function applyTransform(name: string | undefined, value: unknown, def?: { api?: string }): unknown
```

### `ParamTransform`

A transform — resolved value -\> wire value.

```ts
export type ParamTransform
```


## `src/index.ts`

The tidy.js toolkit, re-exported so parsed rows can be piped through grammar-of-data verbs.

**Import:** `import { … } from 'sportsdataverse'`

### `tidy`

`@tidyjs/tidy` as a namespace object — `tidy.tidy(rows, tidy.groupBy(…), tidy.summarize(…))`.

```ts
export tidy
```

**Example:**

```js
import { tidy } from 'sportsdataverse';
tidy.tidy(rows, tidy.groupBy('team', tidy.summarize({ n: tidy.n() })));
```

### `Sdv`

The type of the default export — every namespace's generated, legacy and hand-written members.

```ts
export type Sdv
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
