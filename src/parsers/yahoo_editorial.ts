// Yahoo Sports Editorial API (api-secure.sports.yahoo.com/v1/editorial/s)
// flat-API parsers. Each parser turns a raw editorial payload into tidy
// rectangular rows, same contract as src/parsers/cbs_napi.ts /
// fox_bifrost.ts / mlb_api.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// Editorial envelope: every resource wraps its payload in a `service` object.
// The scoreboard ships `service.scoreboard.games.<league>.g.<id>` (a game map
// keyed by id), the boxscore `service.boxscore.player_stats.<league>.p.<id>`
// (a player-stats map keyed by id). The two dedicated parsers unroll those
// keyed maps into one row per game / player (the map KEY becomes an `id`
// column). The generic `parse_yahoo_editorial_list` is the catch-all that
// flattens the first list-bearing thing it finds (used by neither endpoint by
// default, but registered so any future editorial endpoint can default to it).

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Common list-bearing keys in editorial payloads, tried in order. `firstListIn`
 * walks these first, then falls back to the first own property holding a
 * non-empty array of objects.
 */
const LIST_KEYS = [
  "games",
  "events",
  "scores",
  "players",
  "teams",
  "leaders",
  "rows",
  "items",
  "list",
  "results",
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
 * Peel the editorial `{service: ...}` envelope once. Returns the inner
 * `service` payload when present, else the raw value unchanged.
 */
function unwrapService(raw: any): any {
  if (isPlainObject(raw) && isPlainObject((raw as Record<string, any>).service)) {
    return (raw as Record<string, any>).service;
  }
  return raw;
}

/**
 * Unroll a keyed map (`{ "<league>.g.<id>": {…}, … }`) into an array of rows,
 * promoting the map key onto each row as `id`. Non-object values are skipped.
 * Returns `[]` when `map` isn't a plain object or holds no object values.
 */
function unrollKeyedMap(map: any): Record<string, any>[] {
  if (!isPlainObject(map)) return [];
  const rows: Record<string, any>[] = [];
  for (const [key, val] of Object.entries(map)) {
    if (isPlainObject(val)) rows.push({ id: key, ...(val as Record<string, any>) });
  }
  return rows;
}

/**
 * Generic editorial parser (catch-all). After peeling the `service` envelope it
 * handles a bare list, an object wrapping records under a list-bearing key, or a
 * single resource object (emitted as one row). Returns `[]` when empty.
 */
export function parse_yahoo_editorial_list(raw: any): Record<string, any>[] {
  const svc = unwrapService(raw);
  if (Array.isArray(svc)) return normalize(svc);
  if (!isPlainObject(svc)) return [];
  const list = firstListIn(svc);
  if (list) return normalize(list);
  if (Object.keys(svc).length > 0) return normalize([svc]);
  return [];
}

/**
 * Parse the editorial scoreboard into one row per game.
 *
 * Shape: `service.scoreboard.games.<league>.g.<id>` is a map keyed by game id;
 * each value is a game object (teams / status / odds nested). This unrolls the
 * keyed map into one row per game (the map key becomes the `id` column, nested
 * `home`/`away`/`status` blocks deep-flatten to `home_*` / `away_*` / `status_*`
 * columns). Falls back to the generic list flattener for un-keyed shapes.
 * Returns `[]` when empty / malformed.
 */
export function parse_yahoo_editorial_scoreboard(raw: any): Record<string, any>[] {
  const svc = unwrapService(raw);
  if (!isPlainObject(svc)) return [];
  const games = (svc as Record<string, any>).scoreboard?.games ?? (svc as Record<string, any>).games;
  // When `games` is PRESENT (even if empty), this is the canonical scoreboard
  // shape — return its unrolled rows directly (`[]` when empty).
  if (isPlainObject(games)) return normalize(unrollKeyedMap(games));
  if (Array.isArray(games)) return normalize(games);
  return parse_yahoo_editorial_list(raw);
}

/**
 * Parse the editorial boxscore into one row per player.
 *
 * Shape: `service.boxscore.player_stats.<league>.p.<id>` is a map keyed by
 * player id; each value is that player's stat block. This unrolls the keyed map
 * into one row per player (the map key becomes the `id` column). Falls back to
 * the generic list flattener. Returns `[]` when empty / malformed.
 */
export function parse_yahoo_editorial_boxscore(raw: any): Record<string, any>[] {
  const svc = unwrapService(raw);
  if (!isPlainObject(svc)) return [];
  const playerStats =
    (svc as Record<string, any>).boxscore?.player_stats ??
    (svc as Record<string, any>).player_stats;
  // When `player_stats` is PRESENT (even if empty), this is the canonical
  // boxscore shape — return its unrolled rows directly (`[]` when empty).
  if (isPlainObject(playerStats)) return normalize(unrollKeyedMap(playerStats));
  if (Array.isArray(playerStats)) return normalize(playerStats);
  return parse_yahoo_editorial_list(raw);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const YAHOO_EDITORIAL_PARSERS = {
  parse_yahoo_editorial_list,
  parse_yahoo_editorial_scoreboard,
  parse_yahoo_editorial_boxscore,
};
