// Parsers for HockeyTech / LeagueStat feed payloads. Faithful port of the
// canonical `sportsdataverse/hockeytech/_parsers.py`, adapted to the JS flat-API
// parser contract (same shape as mlb.ts / nhl_api_web.ts):
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// HockeyTech responses come in three envelope shapes:
//   - `modulekit` feeds wrap rows under `SiteKit.<View>` (`SiteKit.Seasons`,
//     `SiteKit.Scorebar`, `SiteKit.Teamsbyseason`, `SiteKit.Roster`,
//     `SiteKit.Player`, `SiteKit.Gameshifts`);
//   - `statviewfeed` feeds are bespoke (standings: `[0].sections[].data[].row`;
//     leaders: `skaters.<Category>.results[]`; pbp: a top-level `{event,
//     details}[]` array);
//   - the `gc` feed wraps under `GC.Gamesummary`.
//
// Parsers that map to multiple sub-frames in the Python family return the single
// PRIMARY frame here (the flat-API JS contract is one rectangular frame per
// parser), matching how nhl_api_web.ts collapses its dispatchers.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Pull the first array-valued property out of a `SiteKit` (modulekit) payload.
 * The view's rows live under a capitalised key (`Seasons`, `Scorebar`, ...);
 * `Parameters` / `Copyright` are scalars/objects we skip. Returns `[]` when the
 * payload isn't a SiteKit envelope or carries no row array.
 */
function siteKitRows(payload: any): any[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  if (!isPlainObject(kit)) return [];
  for (const v of Object.values(kit)) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

/** Parse `hockeytech_seasons()` — one row per season (`SiteKit.Seasons`). */
export function parse_hockeytech_seasons(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/** Parse `hockeytech_schedule()` — one row per game (`SiteKit.Scorebar`). */
export function parse_hockeytech_schedule(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/** Parse `hockeytech_teams()` — one row per team (`SiteKit.Teamsbyseason`). */
export function parse_hockeytech_teams(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/** Parse `hockeytech_team_roster()` — one row per player (`SiteKit.Roster`). */
export function parse_hockeytech_team_roster(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/**
 * Parse `hockeytech_player_stats()` — one row per (stat-class × season).
 *
 * The `player` view (`category=seasonstats`) returns `SiteKit.Player` as an
 * object keyed by stat class (`regular`, `exhibition`, `playoff`), each a list
 * of season-stat rows. This concatenates every class's rows, tagging each with
 * its `stat_class`, so a single frame carries all of a player's season lines.
 */
export function parse_hockeytech_player_stats(payload: any): Record<string, any>[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  const player = isPlainObject(kit) ? kit.Player : undefined;
  if (!isPlainObject(player)) return normalize(siteKitRows(payload));
  const rows: any[] = [];
  for (const [statClass, lines] of Object.entries(player as Record<string, any>)) {
    if (!Array.isArray(lines)) continue;
    for (const r of lines) {
      if (isPlainObject(r)) rows.push({ stat_class: statClass, ...r });
    }
  }
  return normalize(rows);
}

/**
 * Parse `hockeytech_game_shifts()` — one row per shift stint.
 *
 * `SiteKit.Gameshifts` is `{home: [...], visitor: [...]}`; this concatenates the
 * two sides, tagging each row with its `side`. Empty sides yield no rows.
 */
export function parse_hockeytech_game_shifts(payload: any): Record<string, any>[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  const gs = isPlainObject(kit) ? kit.Gameshifts : undefined;
  if (!isPlainObject(gs)) return [];
  const rows: any[] = [];
  for (const side of ["home", "visitor"]) {
    const arr = (gs as Record<string, any>)[side];
    if (Array.isArray(arr)) {
      for (const r of arr) rows.push(isPlainObject(r) ? { side, ...r } : { side, value: r });
    }
  }
  return normalize(rows);
}

/**
 * Parse `hockeytech_standings()` — one row per team.
 *
 * statviewfeed `teams` returns `[{sections: [{headers, data: [{prop, row}]}]}]`;
 * the per-team stat object is `data[].row`. Walks every section's data rows.
 */
export function parse_hockeytech_standings(payload: any): Record<string, any>[] {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows: any[] = [];
  for (const block of payload) {
    const sections = isPlainObject(block) ? block.sections : undefined;
    if (!Array.isArray(sections)) continue;
    for (const sec of sections) {
      const data = isPlainObject(sec) ? sec.data : undefined;
      if (!Array.isArray(data)) continue;
      for (const d of data) {
        const row = isPlainObject(d) ? d.row : undefined;
        if (isPlainObject(row)) rows.push(row);
      }
    }
  }
  return normalize(rows);
}

/**
 * Parse `hockeytech_leaders()` — one row per leader.
 *
 * statviewfeed `leadersExtended` returns
 * `{skaters: {<Category>: {results: [...]}}}` (and/or a `goalies` group). Walks
 * every player-type group and every category, tagging each row with its
 * `player_type` + `category`.
 */
export function parse_hockeytech_leaders(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  const rows: any[] = [];
  for (const [playerType, group] of Object.entries(payload)) {
    if (!isPlainObject(group)) continue;
    for (const [category, body] of Object.entries(group as Record<string, any>)) {
      const results = isPlainObject(body) ? (body as Record<string, any>).results : undefined;
      if (!Array.isArray(results)) continue;
      for (const r of results) {
        if (isPlainObject(r)) rows.push({ player_type: playerType, category, ...r });
      }
    }
  }
  return normalize(rows);
}

/**
 * Parse `hockeytech_pbp()` — one row per event.
 *
 * The statviewfeed `gameCenterPlayByPlay` view returns a top-level
 * `[{event, details}, ...]` array. This lifts each event's `details` to the top
 * level alongside the `event` type so every play is one flat row.
 */
export function parse_hockeytech_pbp(payload: any): Record<string, any>[] {
  if (!Array.isArray(payload) || payload.length === 0) return [];
  const rows = payload.map((p) => {
    if (!isPlainObject(p)) return { value: p };
    const { event, details } = p as Record<string, any>;
    return isPlainObject(details) ? { event, ...details } : { event, details };
  });
  return normalize(rows);
}

/**
 * Parse `hockeytech_game_summary()` — one row per goal (the PRIMARY frame).
 *
 * The `gc` `gamesummary` view (`GC.Gamesummary`) is a rich object with many
 * sub-frames (`goals`, `penalties`, `goalies`, `shotsByPeriod`, ...). Mirroring
 * the JS flat-API single-frame contract (and how nhl_api_web collapses its
 * dispatchers), this returns the `goals` array — the most useful single frame.
 * Callers wanting the full object pass `{ parsed: false }` (the raw payload).
 */
export function parse_hockeytech_game_summary(payload: any): Record<string, any>[] {
  const gc = isPlainObject(payload) ? payload.GC : undefined;
  const summary = isPlainObject(gc) ? gc.Gamesummary : undefined;
  const goals = isPlainObject(summary) ? summary.goals : undefined;
  if (!Array.isArray(goals)) return [];
  return normalize(goals);
}
