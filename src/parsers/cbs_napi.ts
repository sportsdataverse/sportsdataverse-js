// CBS Sports NAPI (api.cbssports.com/napi) flat-API parsers. Each parser turns
// a raw NAPI payload into tidy rectangular rows, same contract as
// src/parsers/mlb_api.ts / sports247.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// NAPI envelope: every resource responds with `{data: ...}` on success (or
// `{error|errors|warnings: ...}` otherwise). `unwrapData` peels the `data`
// wrapper once so the parsers operate on the resource payload itself. Within
// `data` the surface is heterogeneous and untyped (the spec ships no
// `components.schemas`), so the generic `parse_cbs_napi_list` flattens the most
// list-like thing it can find. The three dedicated parsers
// (`scoreboard` / `standings` / `odds`) unroll the specific nested-list shapes
// those resource families publish.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Error/warning-envelope keys: a payload carrying one of these (and no `data`)
 *  is a NAPI failure response and resolves to no rows. */
const ERROR_KEYS = ["error", "errors", "warnings"];

/**
 * Peel the NAPI `{data: ...}` success envelope once. Returns the inner payload
 * when the `data` key is present. A failure envelope (`{error}` / `{errors}` /
 * `{warnings}` with no `data`) resolves to `null` so it yields `[]` downstream.
 * Anything else (an already-un-enveloped array / object) passes through
 * unchanged.
 */
function unwrapData(raw: any): any {
  if (isPlainObject(raw)) {
    const obj = raw as Record<string, any>;
    if ("data" in obj) return obj.data;
    if (ERROR_KEYS.some((k) => k in obj)) return null;
  }
  return raw;
}

/**
 * Common list-bearing keys in NAPI resource payloads, tried in order.
 * `firstListIn` walks these first, then falls back to the first own property
 * whose value is a non-empty array of objects. Mirrors the MLB / 247 parsers'
 * `_LIST_KEYS` approach.
 */
const LIST_KEYS = [
  "rows",
  "items",
  "list",
  "results",
  "entries",
  "rankings",
  "standings",
  "scores",
  "games",
  "events",
  "players",
  "teams",
  "leaders",
  "plays",
  "odds",
  "markets",
  "data",
];

/**
 * Find the first array-of-objects inside an object payload: the known
 * `LIST_KEYS` are preferred (in order), then any own property holding a
 * non-empty array of objects. Returns `null` when nothing list-like is found.
 */
function firstListIn(obj: Record<string, any>): any[] | null {
  for (const key of LIST_KEYS) {
    const c = obj[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject(c[0])) return c;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject(v[0])) return v;
  }
  return null;
}

/**
 * Generic parser for any NAPI resource (the DEFAULT for most cbs_napi
 * endpoints). After unwrapping the `{data}` envelope it handles:
 *
 *   1. a bare list payload — `data: [ {...}, ... ]` — flattened directly;
 *   2. an object that wraps records under a list-bearing key (`rows`, `items`,
 *      `standings`, …) — the first such list is flattened;
 *   3. a single resource object — `data: { ... }` with no inner list — emitted
 *      as a single flat row.
 *
 * Returns `[]` for empty / error-envelope / unrecognized payloads.
 */
export function parse_cbs_napi_list(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject(data)) return [];
  const list = firstListIn(data);
  if (list) return normalize(list);
  // No inner list — treat the resource object itself as one row (e.g. a single
  // team / player / venue meta resource).
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}

/**
 * Parse the scoreboard / scores / featured-game family into one row per game.
 *
 * NAPI scoreboard payloads wrap the games under `data` as either a bare array
 * of game objects or `{games|scoreboard|scores: [...]}`. Each game object is
 * flattened to a row (nested `home`/`away`/`status` blocks deep-flatten to
 * `home_*` / `away_*` / `status_*` columns). A single-game payload (one game
 * object under `data`) yields one row. Returns `[]` when empty / malformed.
 */
export function parse_cbs_napi_scoreboard(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject(data)) return [];
  for (const key of ["games", "scoreboard", "scores", "events"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}

/**
 * Parse the standings family (team / player / SportsLine standings) into one
 * row per entry.
 *
 * NAPI standings payloads wrap rows under `data` as a bare array or as
 * `{standings|rows|entries: [...]}`. When the standings are grouped (e.g.
 * `{groups: [{name, standings: [...]}]}`) the group's label is prefixed onto
 * each row as `group_*` so a flattened row keeps its grouping context. Returns
 * `[]` when empty / malformed.
 */
export function parse_cbs_napi_standings(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject(data)) return [];

  // Grouped standings: each group carries its own inner standings list.
  const groups = (data as Record<string, any>).groups ?? (data as Record<string, any>).divisions;
  if (Array.isArray(groups) && groups.length > 0 && isPlainObject(groups[0])) {
    const rows: Record<string, any>[] = [];
    for (const g of groups) {
      if (!isPlainObject(g)) continue;
      const { standings, rows: gRows, entries, ...groupCols } = g as Record<string, any>;
      const inner = [standings, gRows, entries].find(
        (x) => Array.isArray(x) && x.length > 0
      );
      const groupPrefixed: Record<string, any> = {};
      for (const [k, v] of Object.entries(groupCols)) {
        if (!isPlainObject(v) && !Array.isArray(v)) groupPrefixed[`group_${k}`] = v;
      }
      for (const r of (inner as any[]) ?? []) {
        if (isPlainObject(r)) rows.push({ ...groupPrefixed, ...r });
      }
    }
    if (rows.length > 0) return normalize(rows);
  }

  for (const key of ["standings", "rows", "entries"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}

/**
 * Parse the odds / HQ-odds / props family into one row per market line.
 *
 * NAPI odds payloads wrap markets under `data` as a bare array or as
 * `{markets|odds|lines: [...]}`. Each market may carry a nested `books`/`lines`
 * list (one quote per sportsbook); when present, the market is unrolled to one
 * row per book (the market-level fields prefixed onto each book row). Markets
 * with no nested book list flatten to a single row. Returns `[]` when empty /
 * malformed.
 */
export function parse_cbs_napi_odds(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  let markets: any[] | null = null;
  if (Array.isArray(data)) {
    markets = data;
  } else if (isPlainObject(data)) {
    for (const key of ["markets", "odds", "lines"]) {
      if (Array.isArray((data as Record<string, any>)[key])) {
        markets = (data as Record<string, any>)[key];
        break;
      }
    }
    if (!markets) markets = firstListIn(data);
    // Single odds object with no inner list — one row.
    if (!markets && Object.keys(data).length > 0) return normalize([data]);
  }
  if (!Array.isArray(markets)) return [];

  const rows: Record<string, any>[] = [];
  for (const mk of markets) {
    if (!isPlainObject(mk)) continue;
    const { books, lines, quotes, ...marketCols } = mk as Record<string, any>;
    const inner = [books, lines, quotes].find((x) => Array.isArray(x) && x.length > 0);
    if (Array.isArray(inner)) {
      for (const b of inner) {
        if (isPlainObject(b)) rows.push({ ...marketCols, ...b });
      }
    } else {
      rows.push(mk);
    }
  }
  return normalize(rows);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const CBS_NAPI_PARSERS = {
  parse_cbs_napi_list,
  parse_cbs_napi_scoreboard,
  parse_cbs_napi_standings,
  parse_cbs_napi_odds,
};
