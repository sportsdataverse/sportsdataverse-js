// ESPN basketball BOX producers (NBA / WNBA / MBB / WBB): one game's ESPN summary
// payload (`final.json`) -> the tidy player-box / team-box rows the SDV releases
// publish.
//
// Faithful port of sdv-py, pinned at 719de79edb685b89c524f8b4c0c146fea0b53855:
//   * `wbb/wbb_team_box.py`   `helper_wbb_team_box` (the shared team core; the
//     NBA / WNBA / MBB team helpers delegate to it unchanged), itself a polars port
//     of `wehoop:::helper_espn_wbb_team_box`.
//   * `wbb/wbb_player_box.py` `_basketball_player_box` (the shared player core) +
//     the per-league facts encoded in `{nba,wnba,mbb,wbb}/<lg>_player_box.py`:
//       - `plus_minus`: NBA + WNBA carry it (kept a string, e.g. "+16" -- R never
//         casts it), between `fouls` and `points`; MBB + WBB do not.
//       - degenerate-payload gate: MBB + WBB use the STRICT gate (both teams must
//         ship athletes, `require_both_teams`); NBA + WNBA the LAX one (a game whose
//         second team ships no athletes still publishes the first team's rows).
//       - column order: WBB's canonical select; WNBA/NBA insert `plus_minus`; MBB
//         moves `active` LAST (the confirmed MBB/WBB release divergence).
//
// PURE: payload in, rows out, no network. A frame is `Row[]` whose keys are in the
// released column order; an empty (zero-column) py frame is `[]`.
//
// dtypes (py polars -> JS): Int32 / Float64 -> number (Int32 casts follow polars
// `cast(strict=False)`: only an ASCII `[+-]digits` string in the int32 range parses,
// anything else is null); String -> string; Boolean -> boolean. The two date columns
// are JS `Date`s, exactly as the release loaders decode the published parquet (hyparquet):
// Datetime(us, America/New_York) `game_date_time` -> the same instant; Date
// `game_date` (the New York calendar date) -> that date at UTC midnight. So producer
// rows and loaded release rows join / dedup on the same values.
// Id columns (`game_id`, `team_id`, `athlete_id`, `opponent_team_id`: py Int32) are
// decimal strings, from the Int32 cast (the v4 id rule, src/core/int64.ts), exactly as the
// release loaders return them.
//
// Known ceiling (not reproduced): a column whose cells mix JSON types (an int in one
// row, a string in another) -- polars' `strict=False` construction would coerce the
// whole column to a supertype; ESPN ships each field with one type, so each cell
// keeps its own here.

import { idColumnsToStrings } from "../core/int64.js";

export type { ParserRow as Row } from "../core/types.js";
import type { ParserRow as Row } from "../core/types.js";

// ---------------------------------------------------------------------------
// Python / polars semantics (the exported ones are shared with espn_basketball_pbp.ts)
// ---------------------------------------------------------------------------

export const isObj = (v: unknown): v is Record<string, any> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Python truthiness for JSON values (NaN is truthy in Python). */
export function truthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (isObj(v)) return Object.keys(v).length > 0;
  return true;
}

/** `x or {}` / `x or []`. */
export const or = <T>(v: any, dflt: T): any => (truthy(v) ? v : dflt);

/** Python `x == False` / `x == True` (0 == False, 1 == True). */
const pyEqFalse = (v: unknown): boolean => v === false || v === 0;
export const pyEqTrue = (v: unknown): boolean => v === true || v === 1;

/** sdv-py `dl_utils.underscore` (identical to `src/parsers/_normalize.ts`). */
function underscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

export const PY_INT = /^[+-]?\d+(?:_\d+)*$/;
export const PY_FLOAT = /^[+-]?(?:(?:\d+(?:_\d+)*)?\.?\d+(?:_\d+)*(?:[eE][+-]?\d+(?:_\d+)*)?|\d+(?:_\d+)*\.(?:[eE][+-]?\d+(?:_\d+)*)?|inf|infinity|nan)$/i;

/** Python `float(v)` succeeds (it strips whitespace and allows `_` digit groups). */
function pyFloatable(v: unknown): boolean {
  if (typeof v === "number" || typeof v === "boolean") return true;
  return typeof v === "string" && PY_FLOAT.test(v.trim());
}

/**
 * sdv-py `_to_int` (R `as.integer`): `int(val)`, else `int(float(val))`, else None.
 * `int(float("inf"))` raises OverflowError in py (uncaught); so does this.
 */
function toInt(val: unknown): number | null {
  if (typeof val === "boolean") return val ? 1 : 0;
  let f: number;
  if (typeof val === "number") f = val;
  else if (typeof val === "string") {
    const s = val.trim();
    if (PY_INT.test(s)) return Number(s.replace(/_/g, ""));
    if (!PY_FLOAT.test(s)) return null;
    f = Number(s.replace(/_/g, "").replace(/^([+-]?)inf(inity)?$/i, "$1Infinity")); // "nan" -> NaN
  } else return null;
  if (Number.isNaN(f)) return null;
  if (!Number.isFinite(f)) throw new RangeError(`cannot convert float infinity to integer: ${String(val)}`);
  return Math.trunc(f) || 0; // -0 -> 0
}

const INT32_MIN = -(2 ** 31);
const INT32_MAX = 2 ** 31 - 1;

/** polars `cast(pl.Int32, strict=False)` of one cell. */
function castInt32(v: unknown): number | null {
  let n: number;
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") {
    if (Number.isNaN(v)) return null;
    n = Math.trunc(v);
  } else if (typeof v === "string") {
    if (!/^[+-]?\d+$/.test(v)) return null;
    n = Number(v);
  } else return null;
  return n >= INT32_MIN && n <= INT32_MAX ? n || 0 : null;
}

/** polars `cast(pl.Float64, strict=False)` of one cell (no whitespace, no `_`). */
function castFloat64(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v !== "string") return null;
  if (/^[+-]?nan$/i.test(v)) return NaN;
  const m = /^([+-]?)inf(inity)?$/i.exec(v);
  if (m) return m[1] === "-" ? -Infinity : Infinity;
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(v) ? Number(v) : null;
}

// Python strptime field patterns for "%Y-%m-%dT%H:%M" / "%Y-%m-%dT%H:%M:%S".
const STRPTIME =
  /^(\d{4})-(1[0-2]|0[1-9]|[1-9])-(3[01]|[12]\d|0[1-9]|[1-9]| [1-9])T(2[0-3]|[01]\d|\d):([0-5]\d|\d)(?::(6[01]|[0-5]\d|\d))?$/i;

// The New York calendar date of an instant.
const NY = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" });

/** A UTC `Date` (not `Date.UTC`, which maps years 0-99 to 19xx). */
function utc(y: number, mo: number, d: number, h = 0, mi = 0, s = 0): Date {
  const at = new Date(0);
  at.setUTCFullYear(y, mo - 1, d);
  at.setUTCHours(h, mi, s, 0);
  return at;
}

/**
 * sdv-py `_game_datetime`: strip a trailing Z, parse as UTC, convert to
 * America/New_York. `game_date_time` is that instant; `game_date` its New York
 * calendar date at UTC midnight (how hyparquet decodes the release's DATE column).
 */
function gameDatetime(dateStr: unknown): { game_date: Date; game_date_time: Date } {
  if (typeof dateStr !== "string") throw new TypeError(`competition date is not a string: ${String(dateStr)}`);
  const raw = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
  const m = STRPTIME.exec(raw);
  const [y, mo, d, h, mi, s] = m ? m.slice(1).map((x) => Number(x ?? 0)) : [];
  const at = utc(y, mo, d, h, mi, s);
  // datetime() rejects year 0, a day past the month's end and a leap second.
  if (!m || y < 1 || at.getUTCDate() !== d || s > 59) {
    throw new Error(`unparseable competition date: '${dateStr}'`);
  }
  const p: Record<string, number> = {};
  for (const part of NY.formatToParts(at)) if (part.type !== "literal") p[part.type] = Number(part.value);
  return { game_date: utc(p.year, p.month, p.day), game_date_time: at };
}

/** Build the frame: keep `cols`, missing -> null, then apply the casts; id columns -> decimal strings. */
function frame(rows: Row[], cols: string[], int32: readonly string[], float64: readonly string[]): Row[] {
  const ints = new Set(int32);
  const floats = new Set(float64);
  const framed = rows.map((r) => {
    const out: Row = {};
    for (const c of cols) {
      const v = r[c] ?? null;
      // every row gets its own Date (rows share one game-level Date before this)
      out[c] = ints.has(c) ? castInt32(v) : floats.has(c) ? castFloat64(v) : v instanceof Date ? new Date(v) : v;
    }
    return out;
  });
  return idColumnsToStrings(framed);
}

// ---------------------------------------------------------------------------
// Team box (sdv-py wbb/wbb_team_box.py)
// ---------------------------------------------------------------------------

// R: tidyr::separate("<made>-<attempted>", sep = "-") -- split in place.
const SPLIT_STATS = new Map<unknown, [string, string]>([
  ["fieldGoalsMade-fieldGoalsAttempted", ["fieldGoalsMade", "fieldGoalsAttempted"]],
  ["freeThrowsMade-freeThrowsAttempted", ["freeThrowsMade", "freeThrowsAttempted"]],
  ["threePointFieldGoalsMade-threePointFieldGoalsAttempted", ["threePointFieldGoalsMade", "threePointFieldGoalsAttempted"]],
]);

// (ESPN team key, snake suffix) in the R column-assignment order.
const TEAM_META: [string, string][] = [
  ["uid", "uid"],
  ["slug", "slug"],
  ["location", "location"],
  ["name", "name"],
  ["abbreviation", "abbreviation"],
  ["displayName", "display_name"],
  ["shortDisplayName", "short_display_name"],
  ["color", "color"],
  ["alternateColor", "alternate_color"],
  ["logo", "logo"],
];

const TEAM_INT32 = [
  // _INT32_META
  "game_id", "season", "season_type", "team_id", "team_score", "opponent_team_id", "opponent_team_score",
  // _INT32_STATS
  "assists", "blocks", "defensive_rebounds", "field_goals_made", "field_goals_attempted", "flagrant_fouls",
  "fouls", "free_throws_made", "free_throws_attempted", "offensive_rebounds", "steals", "team_turnovers",
  "technical_fouls", "three_point_field_goals_made", "three_point_field_goals_attempted", "total_rebounds",
  "total_technical_fouls", "total_turnovers", "turnovers",
] as const;
const TEAM_FLOAT64 = ["field_goal_pct", "free_throw_pct", "three_point_field_goal_pct"] as const;

function hasKey(o: unknown, k: string): boolean {
  if (o === null || o === undefined) throw new TypeError(`argument of type 'NoneType' is not iterable`);
  return typeof o === "object" && k in (o as object);
}

function teamRow(idx: number, teams: any[], competitors: any[], gameCols: Row): Row {
  const team = or(teams[idx].team, {});
  const opp = or(teams[1 - idx].team, {});
  const teamId = toInt(team.id);
  // R ifelse chain: the index-aligned competitor when ids match, else the other.
  // An unparseable id on either side is NA in R -> NA fields.
  const aligned = competitors[idx];
  const fallback = competitors[1 - idx];
  const alignedId = toInt(aligned.id);
  let picked: any;
  let unpicked: any;
  if (teamId === null || alignedId === null) [picked, unpicked] = [{}, {}];
  else if (alignedId === teamId) [picked, unpicked] = [aligned, fallback];
  else [picked, unpicked] = [fallback, aligned];

  const row: Row = { ...gameCols, team_id: teamId };
  for (const [k, suffix] of TEAM_META) row[`team_${suffix}`] = team[k] ?? null;
  row.team_home_away = picked.homeAway ?? null;
  row.team_score = toInt(picked.score);
  row.team_winner = picked.winner ?? null;

  // R tidyr::spread orders stat columns alphabetically by their ESPN name.
  const wide = new Map<string, any>();
  for (const s of or(teams[idx].statistics, [])) if (truthy(s.name)) wide.set(s.name, s.displayValue ?? null);
  for (const name of [...wide.keys()].sort()) {
    const val = wide.get(name);
    const split = SPLIT_STATS.get(name);
    if (split) {
      const [made, dash, attempted] = partition(truthy(val) ? String(val) : "");
      row[underscore(split[0])] = val !== null ? made : null;
      row[underscore(split[1])] = dash ? attempted : null;
    } else {
      row[underscore(name)] = val;
    }
  }

  row.opponent_team_id = toInt(opp.id);
  for (const [k, suffix] of TEAM_META) row[`opponent_team_${suffix}`] = opp[k] ?? null;
  row.opponent_team_score = toInt(unpicked.score);
  return row;
}

/** Python `str.partition("-")`. */
function partition(s: string): [string, string, string] {
  const i = s.indexOf("-");
  return i < 0 ? [s, "", ""] : [s.slice(0, i), "-", s.slice(i + 1)];
}

function gameCols(header: any, comp: any): Row {
  const dt = gameDatetime(comp.date);
  const season = or(header.season, {});
  return {
    game_id: toInt(header.id),
    season: season.year ?? null,
    season_type: season.type ?? null,
    game_date: dt.game_date,
    game_date_time: dt.game_date_time,
  };
}

/**
 * Shared team-box core (sdv-py `helper_wbb_team_box`; NBA / WNBA / MBB delegate to
 * it). Two rows (one per team); `[]` when the payload has no usable boxscore.
 */
function basketballTeamBox(final: any): Row[] {
  const header = or(final.header, {});
  const competitions = or(header.competitions, []);
  if (!competitions.length) return [];
  const comp = competitions[0];
  // ESPN's `boxscoreAvailable` flag lies for archival games: the payload is the gate.
  const teams = or(or(final.boxscore, {}).teams, []);
  const competitors = or(comp.competitors, []);
  if (teams.length < 2 || competitors.length < 2 || !truthy(teams[0].statistics)) return [];
  // Degenerate payloads the R producer hard-errors on (tryCatch -> game skipped):
  // an empty second statistics list, duplicate stat names, and `winner` absent
  // from BOTH competitors.
  if (!truthy(teams[1].statistics)) return [];
  for (const t of teams.slice(0, 2)) {
    const names = (or(t.statistics, []) as any[]).map((s) => s.name).filter(truthy);
    if (names.length !== new Set(names).size) return [];
  }
  if (competitors.slice(0, 2).every((c: unknown) => !hasKey(c, "winner"))) return [];

  const g = gameCols(header, comp);
  const rows = [teamRow(0, teams, competitors, g), teamRow(1, teams, competitors, g)];
  // R bind_rows column union: row-1 order first, row-2-only columns appended.
  const cols = Object.keys(rows[0]);
  for (const c of Object.keys(rows[1])) if (!(c in rows[0])) cols.push(c);
  // tidyr::separate errors when a combined "M-A" stat is absent for BOTH teams.
  const required = [...SPLIT_STATS.values()].flat().map(underscore);
  if (!required.every((c) => cols.includes(c))) return [];
  return frame(rows, cols, TEAM_INT32, TEAM_FLOAT64);
}

// ---------------------------------------------------------------------------
// Player box (sdv-py wbb/wbb_player_box.py `_basketball_player_box`)
// ---------------------------------------------------------------------------

const PLAYER_INT32 = [
  // _INT32_META
  "game_id", "season", "season_type", "athlete_id", "team_id", "team_score", "opponent_team_id",
  "opponent_team_score",
  // _INT32_STATS
  "assists", "blocks", "defensive_rebounds", "field_goals_made", "field_goals_attempted", "flagrant_fouls",
  "fouls", "free_throws_made", "free_throws_attempted", "offensive_rebounds", "steals", "team_turnovers",
  "technical_fouls", "three_point_field_goals_made", "three_point_field_goals_attempted", "rebounds",
  "total_technical_fouls", "total_turnovers", "turnovers", "points",
] as const;
const PLAYER_FLOAT64 = ["minutes", "field_goal_pct", "free_throw_pct", "three_point_field_goal_pct"] as const;

// The canonical WBB final dplyr::select order (wehoop espn_wbb_data.R).
const WBB_PLAYER_ORDER: readonly string[] = [
  "game_id", "season", "season_type", "game_date", "game_date_time", "athlete_id", "athlete_display_name",
  "team_id", "team_name", "team_location", "team_short_display_name", "minutes", "field_goals_made",
  "field_goals_attempted", "three_point_field_goals_made", "three_point_field_goals_attempted",
  "free_throws_made", "free_throws_attempted", "offensive_rebounds", "defensive_rebounds", "rebounds",
  "assists", "steals", "blocks", "turnovers", "fouls", "points", "starter", "ejected", "did_not_play", "reason",
  "active", "athlete_jersey", "athlete_short_name", "athlete_headshot_href", "athlete_position_name",
  "athlete_position_abbreviation", "team_display_name", "team_uid", "team_slug", "team_logo",
  "team_abbreviation", "team_color", "team_alternate_color", "home_away", "team_winner", "team_score",
  "opponent_team_id", "opponent_team_name", "opponent_team_location", "opponent_team_display_name",
  "opponent_team_abbreviation", "opponent_team_logo", "opponent_team_color", "opponent_team_alternate_color",
  "opponent_team_score",
];
// WNBA (and NBA, which imports it): plus_minus right after fouls.
const WNBA_PLAYER_ORDER: readonly string[] = (() => {
  const at = WBB_PLAYER_ORDER.indexOf("fouls") + 1;
  return [...WBB_PLAYER_ORDER.slice(0, at), "plus_minus", ...WBB_PLAYER_ORDER.slice(at)];
})();
// MBB: WBB's order with `active` moved LAST.
const MBB_PLAYER_ORDER: readonly string[] = [...WBB_PLAYER_ORDER.filter((c) => c !== "active"), "active"];

/** Pivot one athlete's stats vector to snake columns, splitting "M-A" pairs. */
function statDict(statCols: any[], stats: any[]): Row {
  const out: Row = {};
  const n = Math.min(statCols.length, stats.length); // zip
  for (let i = 0; i < n; i++) {
    const name = statCols[i];
    const val = stats[i];
    const split = SPLIT_STATS.get(name);
    if (split) {
      const [made, dash, attempted] = partition(val !== null && val !== undefined ? String(val) : "");
      out[underscore(split[0])] = val !== null && val !== undefined ? made : null;
      out[underscore(split[1])] = dash ? attempted : null;
    } else {
      out[underscore(name)] = val ?? null;
    }
  }
  return out;
}

function basketballPlayerBox(final: any, finalOrder: readonly string[], requireBothTeams: boolean): Row[] {
  const header = or(final.header, {});
  const competitions = or(header.competitions, []);
  if (!competitions.length) return [];
  const comp = competitions[0];
  // ESPN's `boxscoreAvailable` flag lies for archival games: the payload is the gate.
  const teamBlocks = or(or(final.boxscore, {}).players, []);
  const competitors = or(comp.competitors, []);
  if (teamBlocks.length < 2 || competitors.length < 2) return [];

  // R validity probes (py `try/except (IndexError, TypeError, ValueError)` -> []):
  // the first athlete's stats vector is non-trivial and its 7th entry parses as a
  // number; the STRICT gate also needs the second team's athletes.
  const stats0 = or(teamBlocks[0].statistics, []);
  if (!stats0.length) return [];
  const statsBlock0 = stats0[0];
  const athletes0 = or(statsBlock0.athletes, []);
  if (!athletes0.length) return [];
  if (requireBothTeams) {
    const stats1 = or(teamBlocks[1].statistics, []);
    if (!stats1.length || !truthy(or(stats1[0].athletes, []))) return [];
  }
  const firstStats = or(athletes0[0].stats, []);
  // py: len <= 1 -> skip; float(stats[6]) IndexError / ValueError / TypeError -> skip.
  if (!(firstStats.length > 6) || !pyFloatable(firstStats[6])) return [];

  const statCols: any[] = [...or(statsBlock0.keys, [])];
  const g = gameCols(header, comp);
  const [c0, c1] = competitors;
  const c0Id = toInt(c0.id);

  // R ifelse chain on team_id == homeAway1_team.id; NA id -> NA fields.
  const sideCols = (teamId: number | null): Row => {
    let mine: any = {};
    let opp: any = {};
    if (teamId !== null && c0Id !== null) [mine, opp] = teamId === c0Id ? [c0, c1] : [c1, c0];
    const oppTeam = or(opp.team, {});
    const oppLogos = or(oppTeam.logos, []);
    return {
      home_away: mine.homeAway ?? null,
      team_winner: mine.winner ?? null,
      team_score: toInt(mine.score),
      opponent_team_id: toInt(opp.id),
      opponent_team_name: oppTeam.name ?? null,
      opponent_team_location: oppTeam.location ?? null,
      opponent_team_display_name: oppTeam.displayName ?? null,
      opponent_team_abbreviation: oppTeam.abbreviation ?? null,
      opponent_team_logo: oppLogos.length ? or(oppLogos[0], {}).href ?? null : null,
      opponent_team_color: oppTeam.color ?? null,
      opponent_team_alternate_color: oppTeam.alternateColor ?? null,
      opponent_team_score: toInt(opp.score),
    };
  };

  const metaRow = (entry: any, team: any): Row => {
    const ath = or(entry.athlete, {});
    const teamId = toInt(team.id);
    const row: Row = {
      ...g,
      athlete_id: toInt(ath.id),
      athlete_display_name: ath.displayName ?? null,
      team_id: teamId,
      team_name: team.name ?? null,
      team_location: team.location ?? null,
      team_short_display_name: team.shortDisplayName ?? null,
      starter: entry.starter ?? null,
      ejected: entry.ejected ?? null,
      did_not_play: entry.didNotPlay ?? null,
      active: entry.active ?? null,
      athlete_jersey: ath.jersey ?? null,
      athlete_short_name: ath.shortName ?? null,
      athlete_headshot_href: or(ath.headshot, {}).href ?? null,
      athlete_position_name: or(ath.position, {}).name ?? null,
      athlete_position_abbreviation: or(ath.position, {}).abbreviation ?? null,
      team_display_name: team.displayName ?? null,
      team_uid: team.uid ?? null,
      team_slug: team.slug ?? null,
      team_logo: team.logo ?? null,
      team_abbreviation: team.abbreviation ?? null,
      team_color: team.color ?? null,
      team_alternate_color: team.alternateColor ?? null,
    };
    if ("reason" in entry) row.reason = entry.reason ?? null;
    return Object.assign(row, sideCols(teamId));
  };

  // R: unnest keeps team-1 athletes then team-2; the stats matrix is built from the
  // non-empty stats vectors and positionally bound to the !didNotPlay rows.
  const entries: [any, any][] = [];
  for (const block of teamBlocks.slice(0, 2)) {
    const team = or(block.team, {});
    for (const entry of or(or(block.statistics, [{}])[0].athletes, [])) entries.push([entry, team]);
  }
  const statsVectors = entries.map(([e]) => e.stats).filter(truthy);
  const played = entries.filter(([e]) => pyEqFalse(e.didNotPlay));
  const dnp = entries.filter(([e]) => pyEqTrue(e.didNotPlay));
  // A stats/athletes count mismatch, a ragged stats vector, or missing keys all
  // tryCatch-skip the game in R.
  if (!statCols.length || statsVectors.length !== played.length || statsVectors.some((s) => s.length !== statCols.length)) {
    return [];
  }

  const rows: Row[] = played.map(([entry, team], i) => ({ ...metaRow(entry, team), ...statDict(statCols, statsVectors[i]) }));
  for (const [entry, team] of dnp) rows.push(metaRow(entry, team));
  if (!rows.length) return [];

  const present = new Set(rows.flatMap((r) => Object.keys(r)));
  const out = frame(rows, finalOrder.filter((c) => present.has(c)), PLAYER_INT32, PLAYER_FLOAT64);
  // R: dplyr::arrange(home_away) -- stable, NA last.
  return out.sort((a, b) => {
    const [x, y] = [a.home_away, b.home_away];
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return x < y ? -1 : 1;
  });
}

// ---------------------------------------------------------------------------
// Public per-league helpers (sdv-py names)
// ---------------------------------------------------------------------------

/** NBA player box (hoopR `helper_espn_nba_player_box`): has `plus_minus`; lax gate. */
export const helper_nba_player_box = (final: any): Row[] => basketballPlayerBox(final, WNBA_PLAYER_ORDER, false);
/** WNBA player box (wehoop `helper_espn_wnba_player_box`): has `plus_minus`; lax gate. */
export const helper_wnba_player_box = (final: any): Row[] => basketballPlayerBox(final, WNBA_PLAYER_ORDER, false);
/** MBB player box (hoopR `helper_espn_mbb_player_box`): no `plus_minus`; strict gate; `active` last. */
export const helper_mbb_player_box = (final: any): Row[] => basketballPlayerBox(final, MBB_PLAYER_ORDER, true);
/** WBB player box (wehoop `helper_espn_wbb_player_box`): no `plus_minus`; strict gate. */
export const helper_wbb_player_box = (final: any): Row[] => basketballPlayerBox(final, WBB_PLAYER_ORDER, true);

/** NBA team box (hoopR `helper_espn_nba_team_box`; shared basketball core). */
export const helper_nba_team_box = (final: any): Row[] => basketballTeamBox(final);
/** WNBA team box (wehoop `helper_espn_wnba_team_box`; shared basketball core). */
export const helper_wnba_team_box = (final: any): Row[] => basketballTeamBox(final);
/** MBB team box (hoopR `helper_espn_mbb_team_box`; shared basketball core). */
export const helper_mbb_team_box = (final: any): Row[] => basketballTeamBox(final);
/** WBB team box (wehoop `helper_espn_wbb_team_box`; shared basketball core). */
export const helper_wbb_team_box = (final: any): Row[] => basketballTeamBox(final);

/** `{ league: { helper_<lg>_player_box, helper_<lg>_team_box } }` for the `sdv.<lg>` merge. */
export const BASKETBALL_BOX_PRODUCERS: Record<string, Record<string, (final: any) => Row[]>> = {
  nba: { helper_nba_player_box, helper_nba_team_box },
  wnba: { helper_wnba_player_box, helper_wnba_team_box },
  mbb: { helper_mbb_player_box, helper_mbb_team_box },
  wbb: { helper_wbb_player_box, helper_wbb_team_box },
};
