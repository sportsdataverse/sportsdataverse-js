// Official MLS web API parsers (`stats-api` / `sportapi` / `dapi` .mlssoccer.com).
// Faithful port of sdv-py's `soccer/mls/mls_api_parsers.py`. The three hosts share
// no envelope convention, so there are four parsers:
//
//   parse_mls_api        list bodies and single-rows-key envelopes
//   parse_mls_entity     a body that IS one record (club, sportapi match, content entity)
//   parse_mls_standings  `{ tables: [{ ..., entries: [...] }] }`
//   parse_mls_match      the stats-api match detail (a multi-table payload)
//
// sdv-py returns two or seven frames for standings / match; the flat-API contract
// is one frame, so those two return the sub-frame sdv-py's returns schema documents
// (`entries` / `match_information`) and the full set is exported as
// `parse_mls_standings_tables` / `parse_mls_match_tables`.
//
// Ids are opaque Sportec strings (`MLS-COM/SEA/MAT/CLU/OBJ-*`) pinned to strings.

import { isPlainObject, rowsToFrame, type Row } from "./_frames.js";

const OPTS = { ids: true, dropNull: true } as const;

// Envelope keys that carry metadata rather than rows.
const META_KEYS = new Set(["meta", "pagination", "next_page_token"]);

/** First non-metadata list-of-objects value in an envelope, else undefined. */
function rowsKey(raw: Record<string, any>): any[] | undefined {
  for (const [key, value] of Object.entries(raw)) {
    if (META_KEYS.has(key) || !Array.isArray(value) || value.length === 0) continue;
    if (value.every(isPlainObject)) return value;
  }
  return undefined;
}

/** Parse a list-shaped MLS payload (bare array or a single-rows-key envelope). */
export function parse_mls_api(raw: any): Row[] {
  let rows: any[] = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject(raw) && Object.keys(raw).length) rows = rowsKey(raw) ?? [raw];
  return rowsToFrame(rows, OPTS);
}

/** Parse a single-record MLS payload into a one-row frame (nested arrays are attributes, not rows). */
export function parse_mls_entity(raw: any): Row[] {
  let rows: any[] = [];
  if (Array.isArray(raw)) rows = raw;
  else if (isPlainObject(raw) && Object.keys(raw).length) rows = [raw];
  return rowsToFrame(rows, OPTS);
}

/** Both frames of a standings body: `tables` (one row per table) and `entries` (one per ranked club). */
export function parse_mls_standings_tables(raw: any): { tables: Row[]; entries: Row[] } {
  const rawTables = isPlainObject(raw) ? raw.tables : Array.isArray(raw) ? raw : null;
  const tables = (Array.isArray(rawTables) ? rawTables : []).filter(isPlainObject);
  const meta = tables.map(({ entries: _entries, ...rest }) => rest);
  const entries: Record<string, any>[] = [];
  for (const table of tables) {
    const keys: Record<string, any> = {};
    for (const k of ["competition_id", "season_id", "group", "category", "type"]) {
      if (k in table) keys[k] = table[k];
    }
    for (const entry of Array.isArray(table.entries) ? table.entries : []) {
      if (isPlainObject(entry)) entries.push({ ...keys, ...entry });
    }
  }
  return { tables: rowsToFrame(meta, OPTS), entries: rowsToFrame(entries, OPTS) };
}

/** Parse an MLS standings payload into one row per ranked club (carrying its table's keys). */
export function parse_mls_standings(raw: any): Row[] {
  return parse_mls_standings_tables(raw).entries;
}

const MATCH_TABLES = [
  "match_information",
  "environment",
  "teams",
  "players",
  "staff",
  "referees",
  "last_matches",
] as const;

type MatchTables = Record<(typeof MATCH_TABLES)[number], Row[]>;

/** The seven sub-frames of a stats-api match-detail body. */
export function parse_mls_match_tables(raw: any): MatchTables {
  const match: Record<string, any> = isPlainObject(raw) ? raw : {};
  const teams: Record<string, any>[] = [];
  const players: Record<string, any>[] = [];
  const staff: Record<string, any>[] = [];
  for (const side of ["home", "away"]) {
    const block = match[side];
    if (!isPlainObject(block)) continue;
    const scalars: Record<string, any> = {};
    for (const [k, v] of Object.entries(block)) {
      if (!Array.isArray(v) && !isPlainObject(v)) scalars[k] = v;
    }
    teams.push({ side, ...scalars });
    const keys = { side, team_id: block.team_id, team_name: block.team_name };
    for (const person of Array.isArray(block.players) ? block.players : []) {
      if (isPlainObject(person)) players.push({ ...keys, ...person });
    }
    for (const group of ["trainer_staff", "official_staff"]) {
      for (const person of Array.isArray(block[group]) ? block[group] : []) {
        if (isPlainObject(person)) staff.push({ ...keys, staff_group: group, ...person });
      }
    }
  }
  const objs = (v: any): any[] => (Array.isArray(v) ? v.filter(isPlainObject) : []);
  const blocks: Record<(typeof MATCH_TABLES)[number], any[]> = {
    match_information: isPlainObject(match.match_information) ? [match.match_information] : [],
    environment: isPlainObject(match.environment) ? [match.environment] : [],
    teams,
    players,
    staff,
    referees: objs(match.referees),
    last_matches: objs(match.last_matches),
  };
  const out = {} as MatchTables;
  for (const name of MATCH_TABLES) out[name] = rowsToFrame(blocks[name], OPTS);
  return out;
}

/** Parse a stats-api match-detail payload into its `match_information` frame (one row). */
export function parse_mls_match(raw: any): Row[] {
  return parse_mls_match_tables(raw).match_information;
}
