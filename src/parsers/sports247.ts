// 247Sports Recruit Database ("RDB") flat-API parsers
// (api.247sports.com /rdb/v1). Each parser turns a raw JSON payload into tidy
// rectangular rows, same contract as src/parsers/mlb.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// The RDB surface is shaped three ways:
//   1. bare top-level JSON arrays (playerSportRankings, biggestMovers, sports,
//      year, positions, teams, …) — `parse_sports247_list` flattens directly;
//   2. `{ pagination, list: [...] }` paged envelopes (institutionrankings,
//      tags/.../photos) — `parse_sports247_paged_list` flattens `list[]`,
//      `parse_sports247_institution_rankings` additionally prefixes the
//      `pagination_*` context onto each row;
//   3. `{ rankings: [ItemDto] }` feed envelopes (the three ranking *feed*
//      endpoints) — `parse_sports247_ranking_feed` flattens `rankings[]`.
//
// Most endpoints use the generic `parse_sports247_list`; the dedicated parsers
// cover the envelope shapes that need real unrolling.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Common top-level array keys in RDB envelope responses, tried in order.
 * `parse_sports247_list` walks these and flattens the first that resolves to a
 * non-empty list of objects. Mirrors the MLB parser's `_LIST_KEYS` approach.
 */
const LIST_KEYS = ["list", "rankings", "items", "results", "data"];

/**
 * Generic parser for any RDB response. Handles BOTH a bare top-level JSON array
 * (the common case — playerSportRankings, biggestMovers, sports, year, …) and
 * an object that wraps the records under a known top-level key (`list`,
 * `rankings`, …). Returns `[]` for empty / unrecognized payloads.
 *
 * Use a dedicated parser for envelopes that need extra context unrolled onto
 * each row (`parse_sports247_institution_rankings`,
 * `parse_sports247_ranking_feed`).
 */
export function parse_sports247_list(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  for (const key of LIST_KEYS) {
    const candidate = raw[key];
    if (Array.isArray(candidate) && candidate.length > 0 && isPlainObject(candidate[0])) {
      return normalize(candidate);
    }
  }
  return [];
}

/**
 * Parse a `{ pagination, list: [...] }` paged envelope into one row per
 * `list[]` item (the `tags/.../photos` endpoints). The `pagination` block is
 * NOT prefixed — use `parse_sports247_institution_rankings` when you want the
 * pagination context joined onto every row.
 */
export function parse_sports247_paged_list(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  return normalize(raw.list ?? []);
}

/**
 * Parse `sports247_institution_rankings()` into one row per institution.
 *
 * `/rdb/v1/rankings/{sportKey}/{year}/institutionrankings` returns
 * `{ pagination: {...}, list: [InstitutionRankingDto, ...] }`. Each `list[]`
 * row is flattened and the `pagination_*` context (page/count/limit) is
 * prefixed onto it so a single row carries both the institution standing and
 * its paging context.
 */
export function parse_sports247_institution_rankings(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  const list = raw.list;
  if (!Array.isArray(list) || list.length === 0) return [];
  const pag = isPlainObject(raw.pagination) ? raw.pagination : {};
  const base: Record<string, any> = {};
  for (const [k, v] of Object.entries(pag)) base[`pagination_${k}`] = v;
  return normalize(list.map((row: any) => ({ ...base, ...(isPlainObject(row) ? row : {}) })));
}

/**
 * Parse the three ranking *feed* endpoints into one row per feed item.
 *
 * `transferPortalPlayerfeed` / `compositeTeamRankingFeed` /
 * `transferPortalOnlyTeamFeed` all return `PlayerRankingFeedDto`:
 * `{ rankings: [ItemDto, ...] }` (each `ItemDto` = a player + target
 * institution). Flattens `rankings[]` directly; returns `[]` when the feed is
 * empty / malformed.
 */
export function parse_sports247_ranking_feed(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  return normalize(raw.rankings ?? []);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const SPORTS247_PARSERS = {
  parse_sports247_list,
  parse_sports247_paged_list,
  parse_sports247_institution_rankings,
  parse_sports247_ranking_feed,
};
