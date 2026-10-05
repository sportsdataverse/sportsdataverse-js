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

/**
 * End year of a season name; the first rule that matches wins. Port of py `_derive_season_year`.
 *
 * 1. `YYYY-YYYY` / `YYYY-YY` (`-` or `/`, spaces allowed): "2025-2026", "2025/26",
 *    "2026 - 27" -> 2026, 2026, 2027. A two-digit tail takes the start's century, +100 when
 *    that falls below the start ("1999-00" -> 2000).
 * 2. `YY-ZZ` with ZZ = YY + 1: "26-27 Regular Season" -> 2027.
 * 3. The first standalone 4-digit token: a year in 1950..(this year + 2) is itself; else a
 *    compact span `YYZZ` with ZZ = YY + 1 is its end year ("CCHL 2425 Special Events" -> 2025).
 *
 * A two-digit end year is 20ZZ, or 19ZZ when 20ZZ is past this year + 2. A result outside
 * 1950..(this year + 2), or a name none of the rules match ("19 Tie Break"), is null.
 */
function deriveSeasonYear(name: any): number | null {
  const latest = new Date().getFullYear() + 2;
  const twoDigitEnd = (zz: number): number => (2000 + zz <= latest ? 2000 + zz : 1900 + zz);
  const s = String(name ?? "");
  const m = /(\d{4})\s*[-/]\s*(\d{4}|\d{2})(?!\d)/.exec(s);
  const short = /(?<!\d)(\d{2})\s*[-/]\s*(\d{2})(?!\d)/.exec(s);
  const token = /(?<!\d)(\d{4})(?!\d)/.exec(s);
  let yr: number | null = null;
  if (m) {
    const start = Number(m[1]);
    yr = m[2].length === 4 ? Number(m[2]) : Math.floor(start / 100) * 100 + Number(m[2]);
    if (yr < start) yr += 100;
  } else if (short && (Number(short[1]) + 1) % 100 === Number(short[2])) {
    yr = twoDigitEnd(Number(short[2]));
  } else if (token) {
    const t = Number(token[1]);
    if (t >= 1950 && t <= latest) yr = t;
    else if ((Math.floor(t / 100) + 1) % 100 === t % 100) yr = twoDigitEnd(t % 100);
  }
  return yr !== null && yr >= 1950 && yr <= latest ? yr : null;
}

/**
 * Game type of a season name; the first case-insensitive match wins. Port of py
 * `_game_type_label`: `pre[- ]?season` -> preseason ("2025-26 Preseason Exhibition" stays a
 * preseason), `playoff|post` -> playoffs, `exhibition` -> exhibition, anything else regular.
 */
function gameTypeLabel(name: any): string {
  const n = String(name ?? "").toLowerCase();
  if (/pre[- ]?season/.test(n)) return "preseason";
  if (/playoff|post/.test(n)) return "playoffs";
  if (n.includes("exhibition")) return "exhibition";
  return "regular";
}

/** A name spanning two years ("2025-26", "2025/2026", "2026 - 27", "26-27"); py `TWO_YEAR_NAME_RE`. */
const TWO_YEAR_NAME_RE = /\d{2}\s*[-/]\s*\d{2}/;

/**
 * Parse `hockeytech_seasons()` — one row per season (`SiteKit.Seasons`), plus
 * derived `season_yr` (end-year integer or null) and `game_type_label` (regular /
 * playoffs / preseason / exhibition) as in sdv-py's `parse_seasons`.
 *
 * A one-year preseason or exhibition name gives the camp's calendar year: "2026 Pre-season"
 * starts 2026-08-11 and opens 2026-27, so it is 2027, like "2026-27 MHL Exhibition Season".
 * It is shifted only when the name spans no two years and the row starts in the year the
 * name gives; PWHL's "2024 Preseason" started 2023-11-01 and stays 2024, the season it opened.
 */
export function parse_hockeytech_seasons(payload: any): Record<string, any>[] {
  const rows = siteKitRows(payload).map((r) => {
    if (!isPlainObject(r)) return r;
    const name = String(r.season_name ?? "");
    let yr = deriveSeasonYear(r.season_name);
    const label = gameTypeLabel(r.season_name);
    if (
      (label === "preseason" || label === "exhibition") &&
      yr !== null &&
      !TWO_YEAR_NAME_RE.test(name) &&
      String(r.start_date ?? "").slice(0, 4) === String(yr)
    ) {
      yr += 1;
    }
    return { ...r, season_yr: yr, game_type_label: label };
  });
  return normalize(rows);
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

/**
 * Parse `hockeytech_scorebar()` — one row per game in the live window. Same `SiteKit.Scorebar`
 * payload as the schedule view, so it shares {@link parse_hockeytech_schedule}.
 */
export function parse_hockeytech_scorebar(payload: any): Record<string, any>[] {
  return parse_hockeytech_schedule(payload);
}

/** Parse `hockeytech_player_search()` — one row per match (`SiteKit.Searchplayers`). */
export function parse_hockeytech_player_search(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/** Parse `hockeytech_stats()` — one row per player-season (`SiteKit.Statviewtype`). */
export function parse_hockeytech_stats(payload: any): Record<string, any>[] {
  return normalize(siteKitRows(payload));
}

/** Parse `hockeytech_player_game_log()` — one row per game (`SiteKit.Player.games`). */
export function parse_hockeytech_player_game_log(payload: any): Record<string, any>[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  const player = isPlainObject(kit) ? kit.Player : undefined;
  const games = isPlainObject(player) ? player.games : undefined;
  return Array.isArray(games) ? normalize(games) : [];
}

/** Parse `hockeytech_transactions()` — one row per transaction (`SiteKit.Transactions.transactions`). */
export function parse_hockeytech_transactions(payload: any): Record<string, any>[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  const tx = isPlainObject(kit) ? kit.Transactions : undefined;
  const rows = isPlainObject(tx) ? tx.transactions : undefined;
  return Array.isArray(rows) ? normalize(rows) : [];
}

/**
 * Parse `hockeytech_playoff_bracket()` — one row per series (matchup), each
 * carrying its round's fields as `round_*` columns. The per-series `games`
 * array is stringified by `normalize`; team lookups live in the raw payload.
 */
export function parse_hockeytech_playoff_bracket(payload: any): Record<string, any>[] {
  const kit = isPlainObject(payload) ? payload.SiteKit : undefined;
  const br = isPlainObject(kit) ? kit.Brackets : undefined;
  const rounds = isPlainObject(br) ? br.rounds : undefined;
  if (!Array.isArray(rounds)) return [];
  const rows: any[] = [];
  for (const rd of rounds) {
    if (!isPlainObject(rd)) continue;
    const { matchups, ...roundFields } = rd as Record<string, any>;
    if (!Array.isArray(matchups)) continue;
    for (const m of matchups) {
      if (!isPlainObject(m)) continue;
      const prefixed = Object.fromEntries(Object.entries(roundFields).map(([k, v]) => [k === "round" ? "round_number" : k.startsWith("round_") ? k : `round_${k}`, v]));
      rows.push({ ...prefixed, ...m });
    }
  }
  return normalize(rows);
}
