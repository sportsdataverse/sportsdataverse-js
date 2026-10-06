---
title: Producers
sidebar_label: Producers
sidebar_position: 5
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Producers

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

The ESPN basketball box-score and play-by-play producers — one summary payload in, the release-shaped rows out.

| Export | kind | module |
|---|---|---|
| [`helper_nba_player_box`](#helper_nba_player_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_wnba_player_box`](#helper_wnba_player_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_mbb_player_box`](#helper_mbb_player_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_wbb_player_box`](#helper_wbb_player_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_nba_team_box`](#helper_nba_team_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_wnba_team_box`](#helper_wnba_team_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_mbb_team_box`](#helper_mbb_team_box) | function | `src/producers/espn_basketball_box.ts` |
| [`helper_wbb_team_box`](#helper_wbb_team_box) | function | `src/producers/espn_basketball_box.ts` |
| [`BASKETBALL_BOX_PRODUCERS`](#basketball_box_producers) | const | `src/producers/espn_basketball_box.ts` |
| [`helper_nba_pickcenter`](#helper_nba_pickcenter) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_nba_game_data`](#helper_nba_game_data) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_nba_pbp_features`](#helper_nba_pbp_features) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_nba_pbp`](#helper_nba_pbp) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wnba_pickcenter`](#helper_wnba_pickcenter) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wnba_game_data`](#helper_wnba_game_data) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wnba_pbp_features`](#helper_wnba_pbp_features) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wnba_pbp`](#helper_wnba_pbp) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_mbb_pickcenter`](#helper_mbb_pickcenter) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_mbb_game_data`](#helper_mbb_game_data) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_mbb_pbp_features`](#helper_mbb_pbp_features) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_mbb_pbp`](#helper_mbb_pbp) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wbb_pickcenter`](#helper_wbb_pickcenter) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wbb_game_data`](#helper_wbb_game_data) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wbb_pbp_features`](#helper_wbb_pbp_features) | function | `src/producers/espn_basketball_pbp.ts` |
| [`helper_wbb_pbp`](#helper_wbb_pbp) | function | `src/producers/espn_basketball_pbp.ts` |
| [`BASKETBALL_PBP_PRODUCERS`](#basketball_pbp_producers) | const | `src/producers/espn_basketball_pbp.ts` |
| [`PbpResult`](#pbpresult) | type | `src/producers/espn_basketball_pbp.ts` |
| [`EspnPbpOptions`](#espnpbpoptions) | type | `src/producers/espn_basketball_pbp.ts` |
| [`League`](#league) | type | `src/producers/espn_basketball_pbp.ts` |

## `src/producers/espn_basketball_box.ts`

ESPN basketball box-score producers (ports of sdv-py `helper_\<lg\>_player_box` / `helper_\<lg\>_team_box`): one ESPN summary payload in, the release-shaped player and team box rows out. Pure; mounted on `sdv.nba` / `sdv.wnba` / `sdv.mbb` / `sdv.wbb`.

**Mounted on:** `sdv.\<nba|wnba|mbb|wbb\>` (snake_case name + camelCase alias).

### `helper_nba_player_box`

NBA player box rows from a summary payload.

```ts
export const helper_nba_player_box
```

**Aliases:** `helperNbaPlayerBox`

**Example:**

```js
const summary = await sdv.nba.espnNbaSummary({ event_id: 401585601 });
const box = sdv.nba.helper_nba_player_box(summary);
```

### `helper_wnba_player_box`

WNBA player box rows from a summary payload.

```ts
export const helper_wnba_player_box
```

**Aliases:** `helperWnbaPlayerBox`

### `helper_mbb_player_box`

Men's college basketball player box rows from a summary payload.

```ts
export const helper_mbb_player_box
```

**Aliases:** `helperMbbPlayerBox`

### `helper_wbb_player_box`

Women's college basketball player box rows from a summary payload.

```ts
export const helper_wbb_player_box
```

**Aliases:** `helperWbbPlayerBox`

### `helper_nba_team_box`

NBA team box rows from a summary payload.

```ts
export const helper_nba_team_box
```

**Aliases:** `helperNbaTeamBox`

### `helper_wnba_team_box`

WNBA team box rows from a summary payload.

```ts
export const helper_wnba_team_box
```

**Aliases:** `helperWnbaTeamBox`

### `helper_mbb_team_box`

Men's college basketball team box rows from a summary payload.

```ts
export const helper_mbb_team_box
```

**Aliases:** `helperMbbTeamBox`

### `helper_wbb_team_box`

Women's college basketball team box rows from a summary payload.

```ts
export const helper_wbb_team_box
```

**Aliases:** `helperWbbTeamBox`

### `BASKETBALL_BOX_PRODUCERS`

The producers above keyed by league then name — what src/index.ts mounts.

```ts
export const BASKETBALL_BOX_PRODUCERS =
```


## `src/producers/espn_basketball_pbp.ts`

ESPN basketball play-by-play producers (ports of sdv-py `helper_\<lg\>_pickcenter` / `helper_\<lg\>_game_data` / `helper_\<lg\>_pbp_features` / `helper_\<lg\>_pbp`) and the `espn_\<lg\>_pbp` fetch-and-build. Mounted on `sdv.nba` / `sdv.wnba` / `sdv.mbb` / `sdv.wbb`.

**Mounted on:** `sdv.\<nba|wnba|mbb|wbb\>` (snake_case name + camelCase alias).

### `helper_nba_pickcenter`

NBA pickcenter metadata — spread, over/under, home favorite — as plain scalars.

```ts
export const helper_nba_pickcenter
```

**Aliases:** `helperNbaPickcenter`

### `helper_nba_game_data`

NBA home / away identification — `[pbp_txt, init]`.

```ts
export const helper_nba_game_data
```

**Aliases:** `helperNbaGameData`

### `helper_nba_pbp_features`

The NBA play-by-play feature frame (clock, score, lineups, timeouts) from a summary payload.

```ts
export const helper_nba_pbp_features
```

**Aliases:** `helperNbaPbpFeatures`

### `helper_nba_pbp`

The NBA play-by-play result — `\{ plays, timeouts, … \}` — from a summary payload.

```ts
export const helper_nba_pbp
```

**Aliases:** `helperNbaPbp`

**Example:**

```js
const pbp = await sdv.nba.espn_nba_pbp({ game_id: 401585601 });
pbp.plays.length;
```

### `helper_wnba_pickcenter`

WNBA pickcenter metadata as plain scalars.

```ts
export const helper_wnba_pickcenter
```

**Aliases:** `helperWnbaPickcenter`

### `helper_wnba_game_data`

WNBA home / away identification.

```ts
export const helper_wnba_game_data
```

**Aliases:** `helperWnbaGameData`

### `helper_wnba_pbp_features`

The WNBA play-by-play feature frame.

```ts
export const helper_wnba_pbp_features
```

**Aliases:** `helperWnbaPbpFeatures`

### `helper_wnba_pbp`

The WNBA play-by-play result from a summary payload.

```ts
export const helper_wnba_pbp
```

**Aliases:** `helperWnbaPbp`

### `helper_mbb_pickcenter`

Men's college basketball pickcenter metadata as plain scalars.

```ts
export const helper_mbb_pickcenter
```

**Aliases:** `helperMbbPickcenter`

### `helper_mbb_game_data`

Men's college basketball home / away identification.

```ts
export const helper_mbb_game_data
```

**Aliases:** `helperMbbGameData`

### `helper_mbb_pbp_features`

The men's college basketball play-by-play feature frame.

```ts
export const helper_mbb_pbp_features
```

**Aliases:** `helperMbbPbpFeatures`

### `helper_mbb_pbp`

The men's college basketball play-by-play result from a summary payload.

```ts
export const helper_mbb_pbp
```

**Aliases:** `helperMbbPbp`

### `helper_wbb_pickcenter`

Women's college basketball pickcenter metadata as plain scalars.

```ts
export const helper_wbb_pickcenter
```

**Aliases:** `helperWbbPickcenter`

### `helper_wbb_game_data`

Women's college basketball home / away identification.

```ts
export const helper_wbb_game_data
```

**Aliases:** `helperWbbGameData`

### `helper_wbb_pbp_features`

The women's college basketball play-by-play feature frame.

```ts
export const helper_wbb_pbp_features
```

**Aliases:** `helperWbbPbpFeatures`

### `helper_wbb_pbp`

The women's college basketball play-by-play result from a summary payload.

```ts
export const helper_wbb_pbp
```

**Aliases:** `helperWbbPbp`

### `BASKETBALL_PBP_PRODUCERS`

The producers above keyed by league then name — what src/index.ts mounts.

```ts
export const BASKETBALL_PBP_PRODUCERS =
```

### `PbpResult`

The play-by-play result — `plays` rows plus the `timeouts` id lists and py's scalar keys.

```ts
export type PbpResult
```

### `EspnPbpOptions`

Options of `espn_\<lg\>_pbp` (`raw` keeps the whole dict).

```ts
export type EspnPbpOptions
```

### `League`

`"nba" | "wnba" | "mbb" | "wbb"`.

```ts
export type League
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
