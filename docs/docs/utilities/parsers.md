---
title: Parsers
sidebar_label: Parsers
sidebar_position: 1
---

:::danger Breaking in 4.0.0

- **Integer id columns are decimal strings** — Every id column of integers (`id`, `*_id`, `game_pk`, `playerId`, …) comes back as exact decimal strings on every surface — parsers, producers, loaders, HockeyTech analytics. Compare and join ids as strings; `Number(row.game_id)` for a safe number back. ([changelog](/CHANGELOG#integer-id-columns-are-decimal-strings-everywhere))
- **400 / 422 raise `InvalidParameterError`** — For every family (it was `AssetFetchError`), never retried; the message names host, path and status with a redacted excerpt of the body. ([changelog](/CHANGELOG#a-failed-fetch-never-comes-back-as-empty-data-400--422-raise-invalidparametererror-sdv-py-696--700))
- **Typed returns — generated row types for `parsed: true`** — TypeScript only. A wrapper's raw payload resolves to `unknown` (was `any`); verified endpoints resolve to their row interfaces; the summary dispatchers to `ParsedTables`. Narrow or cast a raw payload. ([changelog](/CHANGELOG#typescript--typed-returns-generated-row-types-for-parsed-true))
- **Wrapper failures raise `NoDataError` / `AssetFetchError`** — Instead of raw axios errors. `NoDataError` = the fetch worked and there is nothing there (404, ESPN `{ code: 404 }`); `AssetFetchError` = the fetch failed (403 / 429 / 5xx after retries, network). Retries follow `DEFAULT_RETRY_STATUSES` with backoff. ([changelog](/CHANGELOG#error-vocabulary-pluggable-transport--auth))

:::

# Parsers

:::info Not data functions
These utilities never fetch a provider payload by themselves — they transform, classify, configure or look things up. The data surface (every `espn*` / native wrapper and `load*` loader) is under [ESPN Reference](/docs/reference/).
:::

Turn a raw provider payload (ESPN, MLB, NHL, stats.nba.com, …) into tidy rows — the same functions `\{ parsed: true \}` runs.

| Export | kind | module |
|---|---|---|
| [`parseEndpoint`](#parseendpoint) | function | `src/parsers/index.ts` |
| [`normalize`](#normalize) | function | `src/parsers/index.ts` |
| [`snakeCase`](#snakecase) | function | `src/parsers/index.ts` |
| [`PARSERS`](#parsers) | const | `src/parsers/index.ts` |
| [`parserFor`](#parserfor) | function | `src/parsers/index.ts` |
| [`NODE_ONLY_PARSERS`](#node_only_parsers) | const | `src/parsers/index.ts` |
| [`MULTI_TABLE_SECTIONS`](#multi_table_sections) | const | `src/parsers/index.ts` |
| [`ESPN_ENDPOINT_PARSERS`](#espn_endpoint_parsers) | const | `src/parsers/index.ts` |
| [`parserForEndpoint`](#parserforendpoint) | function | `src/parsers/index.ts` |
| [`parse_summary`](#parse_summary) | function | `src/parsers/index.ts` |
| [`SECTIONED_ENDPOINTS`](#sectioned_endpoints) | const | `src/parsers/index.ts` |
| [`SUMMARY_SECTION_PARSERS`](#summary_section_parsers) | const | `src/parsers/index.ts` |
| [`parse_kenpom_page`](#parse_kenpom_page) | function | `src/parsers/index.ts` |
| [`parse_asa_goals_added_tables`](#parse_asa_goals_added_tables) | function | `src/parsers/index.ts` |
| [`parse_mls_standings_tables`](#parse_mls_standings_tables) | function | `src/parsers/index.ts` |
| [`parse_mls_match_tables`](#parse_mls_match_tables) | function | `src/parsers/index.ts` |
| [`parse_nwsl_lineups_tables`](#parse_nwsl_lineups_tables) | function | `src/parsers/index.ts` |
| [`parse_pff_report`](#parse_pff_report) | function | `src/parsers/index.ts` |
| [`parse_pff_player_detail`](#parse_pff_player_detail) | function | `src/parsers/index.ts` |
| [`parse_pff_v2_table`](#parse_pff_v2_table) | function | `src/parsers/index.ts` |
| [`parse_pff_matrix`](#parse_pff_matrix) | function | `src/parsers/index.ts` |
| [`parse_nfl_pro_stats`](#parse_nfl_pro_stats) | function | `src/parsers/index.ts` |
| [`ParserFn`](#parserfn) | type | `src/parsers/index.ts` |
| [`FlatParserFn`](#flatparserfn) | type | `src/parsers/index.ts` |
| [`ParsedTables`](#parsedtables) | type | `src/parsers/index.ts` |
| [`ParsedResult`](#parsedresult) | type | `src/parsers/index.ts` |

## `src/parsers/index.ts`

The parser layer: every registered parser, the ESPN endpoint -\> parser map and the summary dispatcher. Browser-safe except `parse_kenpom_page` (cheerio).

**Import:** `import { … } from 'sportsdataverse/parsers'`

### `parseEndpoint`

Run the parser registered for an endpoint over its raw payload — tidy rows, a dict of sub-frames (the ESPN `summary` dispatcher, a dict-default multi-table parser), or `null` when no parser is registered.

```ts
export function parseEndpoint( kind: "espn" | "flat", key: string, raw: unknown, section?: string ): ParsedResult
```

**Example:**

```js
import { parseEndpoint } from 'sportsdataverse/parsers';
const rows = parseEndpoint('scoreboard', raw);
```

### `normalize`

json_normalize equivalent — flatten nested row objects into rectangular rows with `_`-joined, snake_cased keys; integer id columns become decimal strings.

```ts
export function normalize(rows: any[]): ParserRow[]
```

### `snakeCase`

Convert a key to snake_case (camelCase, PascalCase, `dot.separated`, runs of capitals).

```ts
export function snakeCase(key: string): string
```

### `PARSERS`

The flat parser registry — parser name -\> function.

```ts
export const PARSERS: Record<string, FlatParserFn> =
```

### `parserFor`

Look up a parser by name; `undefined` when missing, so the caller falls back to the raw payload.

```ts
export function parserFor(name?: string): FlatParserFn | undefined
```

### `NODE_ONLY_PARSERS`

Names of the parsers registered by a node-side family runtime (not in the browser bundle).

```ts
export const NODE_ONLY_PARSERS
```

### `MULTI_TABLE_SECTIONS`

The sub-frame names of every multi-table parser and the one it returns by default.

```ts
export const MULTI_TABLE_SECTIONS: Record<string, SectionSpec> =
```

### `ESPN_ENDPOINT_PARSERS`

ESPN endpoint short -\> parser function.

```ts
export const ESPN_ENDPOINT_PARSERS: Record<string, ParserFn | typeof parse_summary> =
```

### `parserForEndpoint`

The parser registered for an ESPN endpoint short.

```ts
export function parserForEndpoint( short: string ): ParserFn | typeof parse_summary | undefined
```

### `parse_summary`

The ESPN Site v2 summary dispatcher — 21 sub-frames keyed by section, or one with `section`.

```ts
export function parse_summary( payload: any, section?: string ): ParserRow[] | Record<string, ParserRow[]>
```

### `SECTIONED_ENDPOINTS`

The ESPN endpoint shorts whose parsed result is the summary dispatcher's (they take `section`).

```ts
export const SECTIONED_ENDPOINTS: ReadonlySet<string>
```

### `SUMMARY_SECTION_PARSERS`

The summary dispatcher's section -\> sub-frame parser table.

```ts
export const SUMMARY_SECTION_PARSERS: Record<string, ParserFn> =
```

### `parse_kenpom_page`

Every table of a KenPom HTML page keyed by its HTML id (node only — cheerio).

```ts
export function parse_kenpom_page(raw: any, section?: string): Record<string, Row[]> | Row[]
```

**Import:** `import { parse_kenpom_page } from 'sportsdataverse'`

### `parse_asa_goals_added_tables`

American Soccer Analysis goals-added payload -\> its tables.

```ts
export function parse_asa_goals_added_tables(raw: any): { summary: Row[]; actions: Row[] }
```

### `parse_mls_standings_tables`

MLS standings payload -\> its tables.

```ts
export function parse_mls_standings_tables(raw: any): { tables: Row[]; entries: Row[] }
```

### `parse_mls_match_tables`

MLS match payload -\> its tables.

```ts
export function parse_mls_match_tables(raw: any): MatchTables
```

### `parse_nwsl_lineups_tables`

NWSL (StatsPerform) lineups payload -\> its tables.

```ts
export function parse_nwsl_lineups_tables(raw: any): { teams: Row[]; players: Row[]; staff: Row[] }
```

### `parse_pff_report`

A PFF Developer API `/v1` report envelope -\> rows (the `restricted` block is metadata, skipped).

```ts
export function parse_pff_report(raw: any, section?: string): Row[] | Tables
```

### `parse_pff_player_detail`

A PFF Developer API player-detail envelope -\> rows.

```ts
export function parse_pff_player_detail(raw: any, section?: string): Row[]
```

### `parse_pff_v2_table`

A PFF Developer API `/v2` table body -\> rows typed from the body's own `columns`.

```ts
export function parse_pff_v2_table(raw: any, section?: string): Row[]
```

### `parse_pff_matrix`

A PFF matrix body -\> rows.

```ts
export function parse_pff_matrix(raw: any, report?: string): Tables
```

### `parse_nfl_pro_stats`

An NFL Pro (Next Gen Stats) stats envelope -\> rows.

```ts
export function parse_nfl_pro_stats(payload: any): Row[]
```

### `ParserFn`

A one-table parser — `(raw, section?) =\> ParserRow[]`.

```ts
export type ParserFn
```

### `FlatParserFn`

A registered flat-API parser — rows, or a dict of row arrays for a multi-table payload.

```ts
export type FlatParserFn
```

### `ParsedTables`

A dict of tables — section name -\> rows.

```ts
export ParsedTables
```

### `ParsedResult`

What `parseEndpoint` returns — rows, a dict of sub-frames, or `null`.

```ts
export type ParsedResult
```


_Generated by tools/codegen/generate.mjs from tools/codegen/utilities.yaml — see [How this library is built](/docs/architecture/hand-written)._
