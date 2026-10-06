---
title: Odds math
sidebar_label: Odds math
sidebar_position: 3
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Odds math

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Implied probabilities, vig removal and market blends — ports of sdv-py `wexp.market`.

| Export | kind | module |
|---|---|---|
| [`prob_from_american`](#prob_from_american) | function | `src/odds/math.ts` |
| [`prob_from_decimal`](#prob_from_decimal) | function | `src/odds/math.ts` |
| [`devig_multiplicative`](#devig_multiplicative) | function | `src/odds/math.ts` |
| [`devig_shin`](#devig_shin) | function | `src/odds/math.ts` |
| [`spread_to_prob`](#spread_to_prob) | function | `src/odds/math.ts` |
| [`logit_blend`](#logit_blend) | function | `src/odds/math.ts` |
| [`moneyline_pair_prob`](#moneyline_pair_prob) | function | `src/odds/math.ts` |
| [`oddsMath`](#oddsmath) | const | `src/odds/math.ts` |
| [`oddsErrors`](#oddserrors) | const | `src/odds/math.ts` |
| [`OddsValueError`](#oddsvalueerror) | class | `src/odds/math.ts` |
| [`OddsZeroDivisionError`](#oddszerodivisionerror) | class | `src/odds/math.ts` |
| [`OddsOverflowError`](#oddsoverflowerror) | class | `src/odds/math.ts` |
| [`OddsRuntimeError`](#oddsruntimeerror) | class | `src/odds/math.ts` |

## `src/odds/math.ts`

Market math (ports of sdv-py `wexp.market`): implied probability from a price, vig removal (multiplicative, Shin), spread -\> probability, logit blending. Mounted on `sdv.odds` under the py names and camelCase aliases; the Python-named errors under `sdv.odds.errors`.

**Mounted on:** `sdv.odds` (snake_case name + camelCase alias).

### `prob_from_american`

Implied probability of an American price (`-110` -\> 0.5238).

```ts
export function prob_from_american(price: number): number
```

**Example:**

```js
sdv.odds.prob_from_american(-110); // 0.5238…
```

### `prob_from_decimal`

Implied probability of a decimal price (`1.91` -\> 0.5236).

```ts
export function prob_from_decimal(price: number): number
```

### `devig_multiplicative`

Remove the vig by scaling the raw probabilities to sum to 1.

```ts
export function devig_multiplicative(p_raw: readonly number[]): number[]
```

### `devig_shin`

Remove the vig with Shin's insider-trading model (falls back to multiplicative at overround \<= 0).

```ts
export function devig_shin(p_raw: readonly number[]): number[]
```

### `spread_to_prob`

Cover probability of a point spread under a normal margin with standard deviation `sigma`.

```ts
export function spread_to_prob(spread: number, sigma: number): number
```

### `logit_blend`

Blend two probabilities on the logit scale with weight `weight_a` on the first.

```ts
export function logit_blend(p_a: number, p_b: number, weight_a
```

### `moneyline_pair_prob`

The home win probability from a home / away moneyline pair after vig removal (`multiplicative` or `shin`).

```ts
export function moneyline_pair_prob( home_price: number, away_price: number, method: string
```

### `oddsMath`

The functions above as one object (what `sdv.odds` spreads in).

```ts
export const oddsMath =
```

### `oddsErrors`

The errors below keyed by their Python names (`ValueError`, …) — `sdv.odds.errors`.

```ts
export const oddsErrors
```

### `OddsValueError`

A bad price or probability (py `ValueError`).

```ts
export class OddsValueError extends SdvError
```

### `OddsZeroDivisionError`

A division by zero in the market math (py `ZeroDivisionError`).

```ts
export class OddsZeroDivisionError extends SdvError
```

### `OddsOverflowError`

An overflow in the market math (py `OverflowError`).

```ts
export class OddsOverflowError extends SdvError
```

### `OddsRuntimeError`

The Shin solver could not bracket a root (py `RuntimeError`).

```ts
export class OddsRuntimeError extends SdvError
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
