// NWSL StatsPerform SDP API parsers (`api-sdp.nwslsoccer.com/v1/nwsl/football`).
// Faithful port of sdv-py's `soccer/nwsl/nwsl_api_parsers.py`. The feed is
// consistently enveloped (rows under a named key beside an `apiCallRequestTime`
// stamp). Composite ids (`nwsl::Football_{Entity}::{32-hex}`) are string join keys.
//
//   parse_nwsl_sdp        the five plain-list routes
//   parse_nwsl_standings  one WIDE row per club per split (the fixed 12 stats pivoted)
//   parse_nwsl_stats      player / team stats, kept LONG (one row per entity per stat;
//                         the stat set varies by `category`, ~170 keys)
//   parse_nwsl_lineups    team / player / staff frames
//
// sdv-py's lineups parser returns three frames; the flat-API contract is one, so
// `parse_nwsl_lineups(raw, section?)` returns the `players` frame sdv-py's returns
// schema documents by default (`teams` / `staff` via `section`); the three-frame form
// is exported as `parse_nwsl_lineups_tables`.

import { isPlainObject, pickSection, pyJson, pyUnderscore, rowsToFrame, type Row } from "./_frames.js";

const OPTS = { ids: true, dropNull: true } as const;

// Rows-key preference order. `competitions` is last because `multipleSeasonMatches`
// returns BOTH a `competitions` context array and the `matches` rows -- the caller
// wants the matches.
const ROWS_KEYS = ["matches", "matchdays", "stages", "standings", "players", "teams", "competitions"];
// Envelope keys that are context rather than rows.
const META_KEYS = new Set(["apiCallRequestTime", "competition", "pagination"]);

/** Rows array from an SDP envelope (`[]` for anything unusable). */
function envelopeRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (!isPlainObject(raw)) return [];
  for (const key of ROWS_KEYS) {
    const v = raw[key];
    if (Array.isArray(v) && v.length) return v;
  }
  for (const [key, v] of Object.entries(raw)) {
    if (META_KEYS.has(key) || !Array.isArray(v) || v.length === 0) continue;
    if (v.every(isPlainObject)) return v;
  }
  return [];
}

/** The `stats[]` cells of one entity row. */
const statCells = (row: Record<string, any>): Record<string, any>[] =>
  (Array.isArray(row.stats) ? row.stats : []).filter(isPlainObject);

const withoutStats = ({ stats: _stats, ...rest }: Record<string, any>): Record<string, any> => rest;

/** A stat value as one cell: arrays / objects JSON-encoded, scalars untouched. */
const scalar = (v: any): any => (Array.isArray(v) || isPlainObject(v) ? pyJson(v) : v);

/** Parse a plain NWSL SDP envelope into one row per record. */
export function parse_nwsl_sdp(raw: any): Row[] {
  return rowsToFrame(envelopeRows(raw), OPTS);
}

/** Parse an NWSL standings payload into one wide row per club per split (`table` / `home` / `away`). */
export function parse_nwsl_standings(raw: any): Row[] {
  const splits = isPlainObject(raw) ? raw.standings : raw;
  const rows: Record<string, any>[] = [];
  for (const split of Array.isArray(splits) ? splits : []) {
    if (!isPlainObject(split)) continue;
    for (const club of Array.isArray(split.teams) ? split.teams : []) {
      if (!isPlainObject(club)) continue;
      const row: Record<string, any> = { split_type: split.type, ...withoutStats(club) };
      for (const cell of statCells(club)) {
        if (cell.statsId) row[pyUnderscore(String(cell.statsId))] = scalar(cell.statsValue);
      }
      rows.push(row);
    }
  }
  return rowsToFrame(rows, OPTS);
}

/** Parse an NWSL player / team stats leaderboard into a long frame (`stats_value` is a string). */
export function parse_nwsl_stats(raw: any): Row[] {
  const rows: Record<string, any>[] = [];
  for (const entity of envelopeRows(raw)) {
    if (!isPlainObject(entity)) continue;
    const identity = withoutStats(entity);
    for (const cell of statCells(entity)) {
      rows.push({ ...identity, ...cell, statsValue: scalar(cell.statsValue) });
    }
  }
  return rowsToFrame(rows, OPTS).map((r) => {
    if ("stats_value" in r && r.stats_value !== null && typeof r.stats_value !== "string") {
      r.stats_value = String(r.stats_value);
    }
    return r;
  });
}

/** The three frames of a match-lineups body: `teams`, `players` (fielded + benched) and `staff`. */
export function parse_nwsl_lineups_tables(raw: any): { teams: Row[]; players: Row[]; staff: Row[] } {
  const body: Record<string, any> = isPlainObject(raw) ? raw : {};
  const matchId = body.matchId;
  const teams: Record<string, any>[] = [];
  const players: Record<string, any>[] = [];
  const staff: Record<string, any>[] = [];
  for (const side of ["home", "away"]) {
    const block = body[side];
    if (!isPlainObject(block)) continue;
    const scalars: Record<string, any> = {};
    for (const [k, v] of Object.entries(block)) {
      if (!Array.isArray(v) && !isPlainObject(v)) scalars[k] = v;
    }
    teams.push({ matchId, side, ...scalars });
    const keys = { matchId, side, teamId: block.teamId };
    for (const selection of ["fielded", "benched"]) {
      for (const person of Array.isArray(block[selection]) ? block[selection] : []) {
        if (isPlainObject(person)) players.push({ ...keys, selection, ...person });
      }
    }
    for (const person of Array.isArray(block.staff) ? block.staff : []) {
      if (isPlainObject(person)) staff.push({ ...keys, ...person });
    }
  }
  return {
    teams: rowsToFrame(teams, OPTS),
    players: rowsToFrame(players, OPTS),
    staff: rowsToFrame(staff, OPTS),
  };
}

/** Parse an NWSL match-lineups payload: `players` (default; starting XI + bench), `teams` or `staff` via `section`. */
export function parse_nwsl_lineups(raw: any, section?: string): Row[] {
  return pickSection("parse_nwsl_lineups", parse_nwsl_lineups_tables(raw), section);
}
