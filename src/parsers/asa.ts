// American Soccer Analysis public API parsers (`app.americansocceranalysis.com/api/v1`).
// Faithful port of sdv-py's `soccer/asa_parsers.py`. Every route answers with a flat
// top-level JSON array; ids are short base62 STRINGS (kept as strings; a list-valued
// `team_id` -- a player who featured for several clubs -- is comma-joined).
//
// The three `goals-added` routes nest a per-action breakdown under `data[]`. sdv-py
// returns two frames (`summary`, `actions`); the flat-API contract is one frame, so
// `parse_asa_goals_added` returns the long `actions` frame (the g+ measures) and the
// two-frame form is exported as `parse_asa_goals_added_tables`.

import { asRows, isPlainObject, rowsToFrame, type Row } from "./_frames.js";

const OPTS = { ids: true, dropNull: true } as const;

// Row-identity keys copied onto every exploded `data[]` row so `actions` joins
// back to `summary` without a positional index.
const GOALS_ADDED_KEYS = ["player_id", "team_id", "general_position", "minutes_played", "minutes"];

/** Parse a flat ASA array (every route except `goals-added`) into one row per record. */
export function parse_asa(raw: any): Row[] {
  return rowsToFrame(asRows(raw), OPTS);
}

/** Both frames of an ASA `goals-added` body: `summary` (one row per entity) and `actions` (one per entity per action type). */
export function parse_asa_goals_added_tables(raw: any): { summary: Row[]; actions: Row[] } {
  const rows = asRows(raw).filter(isPlainObject);
  const summary = rows.map(({ data: _data, ...rest }) => rest);
  const actions: Record<string, any>[] = [];
  for (const row of rows) {
    const keys: Record<string, any> = {};
    for (const k of GOALS_ADDED_KEYS) if (k in row) keys[k] = row[k];
    for (const action of Array.isArray(row.data) ? row.data : []) {
      if (isPlainObject(action)) actions.push({ ...keys, ...action });
    }
  }
  return { summary: rowsToFrame(summary, OPTS), actions: rowsToFrame(actions, OPTS) };
}

/** Parse an ASA `goals-added` body into its long per-action frame. */
export function parse_asa_goals_added(raw: any): Row[] {
  return parse_asa_goals_added_tables(raw).actions;
}
