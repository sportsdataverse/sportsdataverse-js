// Yahoo Sports "stats" stats-graph API
// (graphite-secure.sports.yahoo.com/v1/query/stats) flat-API parsers. Each
// parser turns a raw stats payload into tidy rectangular rows, same
// contract as src/parsers/cbs.ts / fox.ts / mlb.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// The Yahoo stats API is a GraphQL persisted-query backend: every response is the GraphQL
// envelope `{ data, extensions }`, and `data` carries a SINGLE root field
// (`leagues` / `games` / `players` / `teams` / `olympics` / …) holding the
// rows. `parse_yahoo_list` (the default for ~80 endpoints) peels the
// `data` envelope, takes the first root field, and flattens it. The stats
// queries (leagueStats* / seasonStats* / seasonTeamStats* / *StatsLeaders)
// route to `parse_yahoo_stats`, which unrolls the nested per-player /
// leader stat arrays (`leagues[].{footballStats|leaders|…}[]`) into one row each.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Peel the GraphQL `{ data, extensions }` envelope once. Returns the inner
 * `data` payload when present; a bare (already-un-enveloped) value passes
 * through unchanged.
 */
function unwrapData(raw: any): any {
  if (isPlainObject(raw) && "data" in (raw as Record<string, any>)) {
    return (raw as Record<string, any>).data;
  }
  return raw;
}

/**
 * Return the first value inside `data` that is a non-empty array of objects
 * (the GraphQL root field's rows) — e.g. `data.leagues` / `data.games` /
 * `data.players`. Returns `null` when no root field holds such a list.
 */
function firstRootList(data: Record<string, any>): any[] | null {
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length > 0 && isPlainObject(v[0])) return v;
  }
  return null;
}

/**
 * Nested stat-array keys a stats-query league/entity object may carry. The
 * stats parser unrolls the FIRST of these it finds on each root-list entry into
 * one row per inner record (player / leader / team stat line).
 */
const STAT_ARRAY_KEYS = [
  "footballStats",
  "basketballStats",
  "baseballStats",
  "hockeyStats",
  "soccerStats",
  "leaders",
  "stats",
  "statLeaders",
  "players",
  "teams",
];

/**
 * Generic stats parser (the DEFAULT for most endpoints). After peeling the
 * `{ data }` envelope it handles:
 *
 *   1. a bare list payload — `data: [ {...}, … ]` — flattened directly;
 *   2. an object with a single root field holding the rows
 *      (`data: { leagues: [...] }` / `{ games: [...] }` / …) — that first
 *      root list is flattened;
 *   3. a single resource object — `data: { … }` with no inner list — emitted
 *      as one flat row.
 *
 * Returns `[]` for empty / malformed payloads.
 */
export function parse_yahoo_list(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject(data)) return [];
  const list = firstRootList(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}

/**
 * Parse a stats stats query into one row per player / leader / team stat
 * line.
 *
 * Stats queries (leagueStats* / seasonStats* / seasonTeamStats* / *StatsLeaders)
 * ship `data.<root>[]` (usually `leagues[]`) where each entry carries a nested
 * stat array (`footballStats` / `leaders` / `stats` / …) of per-entity records.
 * This walks every root entry, finds its first nested stat array, and emits one
 * row per inner record — prefixing the root entry's SCALAR meta fields
 * (league name / sport, etc.) onto each row so context survives the unroll.
 * When no root entry carries a nested stat array, falls back to the generic
 * list flattener. Returns `[]` when empty / malformed.
 */
export function parse_yahoo_stats(raw: any): Record<string, any>[] {
  const data = unwrapData(raw);
  if (!isPlainObject(data)) return [];
  const rootList = firstRootList(data);
  if (!rootList) return parse_yahoo_list(raw);

  const rows: Record<string, any>[] = [];
  let sawStatArray = false;
  for (const entry of rootList) {
    if (!isPlainObject(entry)) continue;
    const statArray = STAT_ARRAY_KEYS.map((k) => (entry as Record<string, any>)[k]).find(
      (x) => Array.isArray(x) && x.length > 0 && isPlainObject(x[0])
    );
    if (!Array.isArray(statArray)) continue;
    sawStatArray = true;
    // Scalar root-entry meta (league name / sport short name / …) prefixed onto
    // each inner stat row so the unrolled rows keep their grouping context.
    const meta: Record<string, any> = {};
    for (const [k, v] of Object.entries(entry as Record<string, any>)) {
      if (!isPlainObject(v) && !Array.isArray(v)) meta[k] = v;
    }
    for (const rec of statArray) {
      if (isPlainObject(rec)) rows.push({ ...meta, ...rec });
    }
  }
  // No nested stat array anywhere — fall back to flattening the root list
  // itself (some "stats" queries return a flat per-entity list).
  if (!sawStatArray) return normalize(rootList);
  return normalize(rows);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const YAHOO_PARSERS = {
  parse_yahoo_list,
  parse_yahoo_stats,
};
