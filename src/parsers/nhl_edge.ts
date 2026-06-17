// Parsers for NHL EDGE player/team-tracking payloads (`api-web.nhle.com/v1/edge/*`).
// Faithful port of `sportsdataverse/nhl/nhl_edge_parsers.py`. EDGE responses
// have no declared inner schema, so these parsers are DEFENSIVE by design: they
// walk a sequence of likely top-level keys, fall back to a single-row flatten,
// and return `[]` rather than throwing on empty input.
//
// Four primary shape families + three sub-frame parsers + one generic fallback:
//   - parse_edge_top10        — `*_top_10` leaderboards (list of rows)
//   - parse_edge_detail       — `*_detail` / `*_comparison` (single-row flatten)
//   - parse_edge_shot_location — `*_shot_location_*` heat-map grids (long form)
//   - parse_edge_zone_time    — `*_zone_time_*` possession-by-zone (long form)
//   - parse_edge_sog_details / parse_edge_sog_summary / parse_edge_hardest_shots
//     — sub-frame parsers for nested lists detail payloads stringify
//   - parse_edge_payload      — generic best-effort flatten (the fallback)

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Is `v` a non-empty array? */
function isNonEmptyArray(v: any): v is any[] {
  return Array.isArray(v) && v.length > 0;
}

// ---------------------------------------------------------------------------
// Family 1 — leaderboards (`*_top_10`)
// ---------------------------------------------------------------------------

// Common top-level keys observed on EDGE leaderboard payloads, tried in order.
const TOP10_LIST_KEYS = [
  "top10",
  "leaderboard",
  "leaders",
  "players",
  "skaters",
  "goalies",
  "teams",
  "data",
  "items",
];

/**
 * Parse an EDGE leaderboard (`*_top_10`) response into a tidy frame. Tries a
 * sequence of likely top-level keys — the first that resolves to a non-empty
 * list is the row source; otherwise falls back to the first list-of-dicts found
 * anywhere in the payload. Returns `[]` when nothing resolves.
 */
export function parse_edge_top10(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  let rows: any[] | null = null;
  for (const key of TOP10_LIST_KEYS) {
    if (isNonEmptyArray(raw[key])) {
      rows = raw[key];
      break;
    }
  }
  if (rows === null) {
    for (const val of Object.values(raw)) {
      if (isNonEmptyArray(val) && isPlainObject(val[0])) {
        rows = val;
        break;
      }
    }
  }
  if (!rows || rows.length === 0) return [];
  return normalize(rows);
}

// ---------------------------------------------------------------------------
// Family 2 — single-entity detail / comparison pages
// ---------------------------------------------------------------------------

/**
 * Parse an EDGE detail / comparison payload into a single-row frame. Flattens
 * the entire payload one level deep; list-valued attributes (season splits,
 * shot-location grids) stay as their string representation so the result
 * remains one row per detail call. Use `parse_edge_shot_location` /
 * `parse_edge_zone_time` to unroll the nested structures.
 */
export function parse_edge_detail(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}

// ---------------------------------------------------------------------------
// Family 3 — shot-location heat maps
// ---------------------------------------------------------------------------

// Keys that host the per-zone heat-map grid, in priority order: most granular
// (17-cell) first, then the 4-12 row aggregates as a fallback.
const SHOT_LOCATION_KEYS = [
  "shotLocationDetails",
  "sogDetails",
  "shotLocationTotals",
  "shotLocationSummary",
  "sogSummary",
];

/**
 * Parse an EDGE shot-location heat map into long-form rows. Picks the most
 * granular zone list available (`shotLocationDetails` -> `sogDetails` ->
 * `shotLocationTotals` -> `shotLocationSummary` -> `sogSummary`); each zone
 * becomes one row. Falls back to a dict-of-sections shape (each section
 * carrying one of the zone keys), tagging each row with its `section`.
 */
export function parse_edge_shot_location(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];

  // Direct shape: one of SHOT_LOCATION_KEYS resolves to the zone list.
  for (const key of SHOT_LOCATION_KEYS) {
    if (isNonEmptyArray(raw[key])) {
      return normalize(raw[key]);
    }
  }

  // Nested shape: dict-of-sections, each containing one of SHOT_LOCATION_KEYS.
  const parts: Record<string, any>[] = [];
  for (const [section, contents] of Object.entries(raw)) {
    if (!isPlainObject(contents)) continue;
    for (const key of SHOT_LOCATION_KEYS) {
      if (isNonEmptyArray((contents as Record<string, any>)[key])) {
        for (const zone of (contents as Record<string, any>)[key]) {
          parts.push({ section, ...(zone ?? {}) });
        }
        break;
      }
    }
  }
  if (parts.length === 0) return [];
  return normalize(parts);
}

// ---------------------------------------------------------------------------
// Family 4 — zone-time / possession by zone
// ---------------------------------------------------------------------------

// Zone-time payloads contain one of these keys, tried in priority order:
// list-valued zoneTimeDetails (multi strength splits) first, then dict-valued
// zoneTimeDetails / zoneStarts (flatten to one row).
const ZONE_TIME_KEYS = [
  "zoneTimeDetails",
  "zoneTime",
  "zoneTimes",
  "zoneStarts",
  "zones",
  "byZone",
  "byStrength",
  "data",
];

/**
 * Parse an EDGE zone-time payload into long-form rows. Each zone / strength-
 * state row becomes one output row. Falls back to a single-row flatten
 * (`parse_edge_detail`) when no recognized zone key is found.
 */
export function parse_edge_zone_time(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  for (const key of ZONE_TIME_KEYS) {
    const candidate = raw[key];
    if (isNonEmptyArray(candidate)) {
      // Multi-row case: strength-state splits keyed by strengthCode.
      return normalize(candidate);
    }
    if (isPlainObject(candidate) && Object.keys(candidate).length > 0) {
      // Single-row case: flat metric dict.
      return normalize([candidate]);
    }
  }
  // No zone-shaped key found — fall back to a single-row flatten.
  return parse_edge_detail(raw);
}

// ---------------------------------------------------------------------------
// Family 5 — sub-frame parsers for detail-page nested lists
// ---------------------------------------------------------------------------

/**
 * Extract the 17-cell shots-on-goal heat-map grid from a detail payload. Looks
 * for `sogDetails` (skater/team detail) or `shotLocationDetails` (goalie /
 * `*-shot-location-detail`). One row per zone cell, else `[]`.
 */
export function parse_edge_sog_details(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  for (const key of ["sogDetails", "shotLocationDetails"]) {
    if (isNonEmptyArray(raw[key])) return normalize(raw[key]);
  }
  return [];
}

/**
 * Extract the 4-row shots-on-goal location aggregate from a detail payload.
 * Looks for `sogSummary` (skater/team detail), `shotLocationSummary` (goalie
 * detail), or `shotLocationTotals` (`*-shot-location-detail`). One row per
 * location code, else `[]`.
 */
export function parse_edge_sog_summary(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  for (const key of ["sogSummary", "shotLocationSummary", "shotLocationTotals"]) {
    if (isNonEmptyArray(raw[key])) return normalize(raw[key]);
  }
  return [];
}

/**
 * Extract the hardest-shots list from `skater-shot-speed-detail`. The endpoint
 * ships `hardestShots: list[10]` with per-shot metadata; returns those rows
 * tidied, else `[]`.
 */
export function parse_edge_hardest_shots(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  if (!isNonEmptyArray(raw.hardestShots)) return [];
  return normalize(raw.hardestShots);
}

// ---------------------------------------------------------------------------
// Generic fallback
// ---------------------------------------------------------------------------

/**
 * Generic best-effort flatten for any EDGE payload shape. Picks the largest
 * list-of-dicts inside the payload (most likely the "interesting" row source)
 * and flattens it; falls back to flattening the payload itself as a single row.
 */
export function parse_edge_payload(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  let bestKey: string | null = null;
  let bestLen = 0;
  for (const [key, val] of Object.entries(raw)) {
    if (isNonEmptyArray(val) && isPlainObject(val[0]) && val.length > bestLen) {
      bestLen = val.length;
      bestKey = key;
    }
  }
  if (bestKey !== null) return normalize(raw[bestKey]);
  return parse_edge_detail(raw);
}
