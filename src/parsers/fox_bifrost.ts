// Fox Sports "Bifrost" API (api.foxsports.com/bifrost/v1) flat-API parsers.
// Each parser turns a raw Bifrost payload into tidy rectangular rows, same
// contract as src/parsers/cbs_napi.ts / mlb_api.ts / sports247.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// Bifrost shape: responses are UI "module shells" — a top-level object whose
// data lives under list-bearing keys like `groupList` / `sectionList` /
// `selectionGroupList` / `standingsSections` / `results`, with each game or row
// nested a level or two down (`selectionGroupList[].selectionList[]`,
// `standingsSections[].standings[]`, `groups[].rows[]`). The generic
// `parse_fox_bifrost_list` finds the first list-like thing and flattens it; the
// dedicated parsers (scoreboard / standings / event / team_roster / search)
// reach into the specific nested-list shape those families publish.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Common list-bearing keys across Bifrost module payloads, tried in order.
 * `firstListIn` walks these first, then falls back to the first own property
 * holding a non-empty array of objects.
 */
const LIST_KEYS = [
  "selectionGroupList",
  "groupList",
  "sectionList",
  "standingsSections",
  "navItems",
  "results",
  "items",
  "events",
  "rows",
  "groups",
  "list",
  "entries",
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
 * Generic parser for any Bifrost module payload (the DEFAULT for most
 * fox_bifrost endpoints). Handles:
 *
 *   1. a bare list payload — `[ {...}, ... ]` — flattened directly;
 *   2. an object wrapping records under a list-bearing key (`groupList`,
 *      `sectionList`, `results`, …) — the first such list is flattened;
 *   3. a single module object with no inner list — emitted as one flat row.
 *
 * Returns `[]` for empty / unrecognized payloads.
 */
export function parse_fox_bifrost_list(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  const list = firstListIn(raw);
  if (list) return normalize(list);
  if (Object.keys(raw).length > 0) return normalize([raw]);
  return [];
}

/**
 * Parse the scoreboard / scores / schedule family into one row per game.
 *
 * Bifrost scoreboard payloads (`ScoreboardResponse` / `LeagueScores`) carry the
 * games under `selectionGroupList[].selectionList[]` (each selection is a game
 * tile). This walks every selection across every group and prefixes the group
 * `title` / `id` onto each row as `group_*`. Falls back to a bare `events[]` /
 * `groupList[]` list, then to the generic flattener. Returns `[]` when empty.
 */
export function parse_fox_bifrost_scoreboard(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];

  // When the sectioned key is PRESENT (even if empty), this is the canonical
  // scoreboard shape — return its unrolled rows directly (`[]` when empty), so
  // an empty board doesn't fall through to the single-shell-row fallback.
  const selectionGroups = raw.selectionGroupList;
  if (Array.isArray(selectionGroups)) {
    const rows: Record<string, any>[] = [];
    for (const g of selectionGroups) {
      if (!isPlainObject(g)) continue;
      const { selectionList, ...groupMeta } = g as Record<string, any>;
      const list = Array.isArray(selectionList) ? selectionList : [];
      for (const sel of list) {
        if (!isPlainObject(sel)) continue;
        rows.push({ group: groupMeta, ...sel });
      }
    }
    return normalize(rows);
  }

  // Some scoreboards expose a flat `events[]` (top-events segments) — use it.
  for (const key of ["events", "groupList", "sectionList"]) {
    const c = raw[key];
    if (Array.isArray(c) && c.length > 0 && isPlainObject(c[0])) return normalize(c);
  }
  return parse_fox_bifrost_list(raw);
}

/**
 * Parse the standings / polls / team-rankings family into one row per entry.
 *
 * Bifrost standings payloads (`Standings`) wrap rows under
 * `standingsSections[].standings[]`. Each section's `title` / `id` is prefixed
 * onto its rows as `section_*` so a flattened row keeps its grouping context.
 * `stats-con` tables ship the same sectioned shape. Falls back to the generic
 * flattener for un-sectioned payloads. Returns `[]` when empty / malformed.
 */
export function parse_fox_bifrost_standings(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];

  // When `standingsSections` is PRESENT (even if empty), this is the canonical
  // standings shape — return its unrolled rows directly (`[]` when empty).
  const sections = raw.standingsSections;
  if (Array.isArray(sections)) {
    const rows: Record<string, any>[] = [];
    for (const s of sections) {
      if (!isPlainObject(s)) continue;
      const { standings, ...sectionMeta } = s as Record<string, any>;
      const list = Array.isArray(standings) ? standings : [];
      for (const r of list) {
        if (!isPlainObject(r)) continue;
        rows.push({ section: sectionMeta, ...r });
      }
    }
    return normalize(rows);
  }
  return parse_fox_bifrost_list(raw);
}

/**
 * Parse the event-data / matchup family.
 *
 * Bifrost event payloads (`EventData` / `EventMatchup`) are deeply nested module
 * shells with no single canonical row list — the most useful tidy projection is
 * the head-to-head stat comparison. This unrolls
 * `teamStatsComparison.items[]` (matchup) / `gameStats.items[]` (event data)
 * into one row per compared stat, falling back to a single flattened row of the
 * whole module shell so callers always get the raw fields. Returns `[]` empty.
 */
export function parse_fox_bifrost_event(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];

  const comparison =
    raw?.teamStatsComparison?.items ?? raw?.gameStats?.items ?? raw?.eventStatsTab?.eventStatsList;
  if (Array.isArray(comparison) && comparison.length > 0 && isPlainObject(comparison[0])) {
    return normalize(comparison);
  }
  // No comparison block — emit the whole event shell as a single flat row so
  // the (header / linescore / boxscore) fields are still reachable.
  if (Object.keys(raw).length > 0) return normalize([raw]);
  return [];
}

/**
 * Parse the team-roster family into one row per player.
 *
 * Bifrost roster payloads (`TeamRoster`) ship `groups[]`, each a table with
 * `headers[]` + `rows[]`. This walks every group's `rows[]` and prefixes the
 * group `template` onto each row as `group_*`. Returns `[]` when empty.
 */
export function parse_fox_bifrost_team_roster(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  // When `groups` is PRESENT (even if empty), this is the canonical roster
  // shape — return its unrolled player rows directly (`[]` when empty).
  const groups = raw.groups;
  if (Array.isArray(groups)) {
    const rows: Record<string, any>[] = [];
    for (const g of groups) {
      if (!isPlainObject(g)) continue;
      const { rows: groupRows, ...groupMeta } = g as Record<string, any>;
      const list = Array.isArray(groupRows) ? groupRows : [];
      for (const r of list) {
        if (!isPlainObject(r)) continue;
        rows.push({ group: groupMeta, ...r });
      }
    }
    return normalize(rows);
  }
  return parse_fox_bifrost_list(raw);
}

/**
 * Parse the search-results family into one row per result.
 *
 * Bifrost search payloads (`SearchResults`) wrap hits under `results[]`. Each
 * result object is flattened to a row. Returns `[]` when empty / malformed.
 */
export function parse_fox_bifrost_search(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (!isPlainObject(raw)) return [];
  const results = raw.results;
  if (Array.isArray(results)) return normalize(results);
  return parse_fox_bifrost_list(raw);
}
