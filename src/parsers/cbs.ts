// CBS Sports API (api.cbssports.com/napi) flat-API parsers. Each parser turns
// a raw API payload into tidy rectangular rows, same contract as
// src/parsers/mlb.ts / recruiting.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased.
//
// `parse_cbs_list` and `parse_cbs_standings` are faithful ports of sdv-py's
// `cbs/cbs_napi_parsers.py` (`parse_cbs_napi`, `parse_cbs_napi_standings`,
// `parse_cbs_napi_scoring_plays`, `parse_cbs_napi_scoring_drives`) and are
// gated against its output on the real captures (test/parsers/parity.test.js).
// NAPI serves every resource through one of a few envelope shapes:
//
//   - `{data: [...]}` / `{data: {...}}` -- a record list / one resource;
//   - a plain object -- one row (`/resource/league/{id}`);
//   - a dict-of-dicts keyed collection -- one row per key, the key in a `key`
//     column (`/resource/endpoint/registry`);
//   - `{year: {season_type: {...}}}` -- team standings (`parse_cbs_standings`);
//   - `{plays: [...]}` / `{drives: [...]}` -- the scoring feeds, which py parses
//     with dedicated pinned-column parsers; `parse_cbs_list` recognises the
//     envelope and applies the same handling;
//   - `{error|errors|warnings: ...}` -- NAPI answers an unknown id with HTTP
//     200 plus this envelope and no `data`; it parses to no rows.
//
// `parse_cbs_scoreboard` / `parse_cbs_odds` (no public capture) keep their
// own list-sniffing unrolls.

import { normalize } from "./_normalize.js";
import { isPlainObject, pyJson, rowsToFrame } from "./_frames.js";
import { idColumnsToStrings, isIdColumn } from "../core/int64.js";
import type { ParserRow } from "../core/types.js";

/** Error/warning-envelope keys: a payload carrying one of these (and no `data`)
 *  is a API failure response and resolves to no rows. */
const ERROR_KEYS = ["error", "errors", "warnings"];

const isErrorEnvelope = (obj: Record<string, any>): boolean => ERROR_KEYS.some((k) => k in obj);

/**
 * Peel the API `{data: ...}` success envelope once. Returns the inner payload
 * when the `data` key is present. A failure envelope (`{error}` / `{errors}` /
 * `{warnings}` with no `data`) resolves to `null` so it yields `[]` downstream.
 * Anything else (an already-un-enveloped array / object) passes through
 * unchanged.
 */
function unwrapData(raw: any): any {
  if (isPlainObject(raw)) {
    if ("data" in raw) return raw.data;
    if (isErrorEnvelope(raw)) return null;
  }
  return raw;
}

/**
 * Common list-bearing keys in API resource payloads, tried in order by the
 * scoreboard / odds parsers. `firstListIn` walks these first, then falls back
 * to the first own property whose value is a non-empty array of objects.
 */
const LIST_KEYS = [
  "rows",
  "items",
  "list",
  "results",
  "entries",
  "rankings",
  "standings",
  "scores",
  "games",
  "events",
  "players",
  "teams",
  "leaders",
  "plays",
  "odds",
  "markets",
  "data",
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

/** sdv-py `_envelope_rows`: resolve any NAPI envelope to the record list the rows are built from. */
function envelopeRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (!isPlainObject(raw) || Object.keys(raw).length === 0) return [];
  if ("data" in raw) {
    const data = raw.data;
    if (Array.isArray(data)) return data;
    return isPlainObject(data) && Object.keys(data).length > 0 ? [data] : [];
  }
  if (isErrorEnvelope(raw)) return [];
  const values = Object.values(raw);
  if (values.every(isPlainObject)) {
    // keyed collection (`/resource/endpoint/registry`): one row per key
    return Object.entries(raw).map(([key, value]) => ({ key, ...(value as Record<string, any>) }));
  }
  return [raw];
}

/**
 * sdv-py's `_rows_to_frame` goes through `pandas.json_normalize`, and pandas
 * types a column holding any string, or booleans alongside a null / a number,
 * as `object`; py then `str()`s every non-string cell of such a column
 * (`22` -> `"22"`, `True` -> `"True"`). A CBS standings block ships `"-"` in
 * the preseason where the regular season has a rank, so those columns are
 * strings in sdv-py, and so here. Nulls stay null (py's `"nan"` compares equal).
 */
// ponytail: pandas object-column coercion replicated for parity; drop this and
// extend parity.test.js's boolText exemption to parse_cbs_standings to keep booleans.
function pandasObjectColumns(rows: ParserRow[]): ParserRow[] {
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  for (const c of columns) {
    const cells = rows.map((r) => r[c]);
    // A column that mixes text with numbers is one text column, as pandas makes it
    // (strength_of_schedule_rank: "-" in the preseason, 22 in the regular season).
    // Booleans stay native: pandas stringifies a bool column that has a null in it
    // ("True" / "False" / "nan"), which the JS ports never copy (same precedent as
    // parse_on3_rdb; the parity harness exempts the comparison).
    if (!cells.some((v) => typeof v === "string")) continue;
    for (const r of rows) {
      if (typeof r[c] === "number") r[c] = String(r[c]);
    }
  }
  return rows;
}

// Column order is pinned (CBS key order is not stable across games) so frames
// from different games stack. Mirrors sdv-py `_PLAY_COLUMNS` / `_DRIVE_COLUMNS`.
const PLAY_COLUMNS = [
  "id",
  "game_id",
  "drive_id",
  "quarter",
  "time_remaining",
  "down",
  "distance",
  "side",
  "yardline",
  "team_in_possession",
  "description",
  "medium",
  "short",
  "score_on_play",
  "score_type",
  "short_score",
  "under_review",
  "home_timeouts_remaining",
  "away_timeouts_remaining",
  "real_clock",
  "subplays",
];
const DRIVE_COLUMNS = [
  "id",
  "team_id",
  "quarter",
  "starting_time",
  "ending_time",
  "time_of_possession",
  "starting_yardline",
  "ending_yardline",
  "starting_play_id",
  "ending_play_id",
  "drive_plays",
  "yards_on_drive",
  "drive_yards_total",
  "penalty_yards",
  "first_downs_on_drive",
  "inside_the_20",
  "score_on_drive",
  "result",
];
// CBS ships every scoring-feed value as a JSON string. These columns always hold
// integers (ids, counts, yard lines): an id column (`isIdColumn`) becomes its
// decimal string, any other a number; a non-integer text (`distance` is NOT here:
// CBS sends the literal "Goal" on goal-to-go downs) becomes null.
const PLAY_INT_COLUMNS = new Set([
  "id",
  "game_id",
  "drive_id",
  "quarter",
  "down",
  "yardline",
  "team_in_possession",
  "home_timeouts_remaining",
  "away_timeouts_remaining",
]);
const DRIVE_INT_COLUMNS = new Set([
  "id",
  "team_id",
  "quarter",
  "drive_plays",
  "starting_play_id",
  "ending_play_id",
  "yards_on_drive",
  "drive_yards_total",
  "penalty_yards",
  "first_downs_on_drive",
]);
// "Yes"/"No" flags.
const PLAY_BOOL_COLUMNS = new Set(["score_on_play", "under_review"]);
const DRIVE_BOOL_COLUMNS = new Set(["score_on_drive", "inside_the_20"]);

/**
 * `{"subplay": [{"type", "order", "<event>": {...}}]}` -> flat event dicts: each
 * sub-event's type-named block (`kickoff`, `complete_pass`, ...) is merged into
 * the event (sdv-py `_flat_subplays`).
 */
function flatSubplays(subplays: any): Record<string, any>[] {
  let events = isPlainObject(subplays) ? subplays.subplay : subplays;
  if (isPlainObject(events)) events = [events]; // a lone sub-event may arrive unwrapped
  const out: Record<string, any>[] = [];
  for (const event of Array.isArray(events) ? events : []) {
    if (!isPlainObject(event)) continue;
    const flat: Record<string, any> = {};
    for (const [key, value] of Object.entries(event)) {
      if (isPlainObject(value)) Object.assign(flat, value);
      else flat[key] = value;
    }
    out.push(flat);
  }
  return out;
}

/** A scoring-feed cell as sdv-py `_scoring_frame` types it. */
function scoringCell(column: string, v: any, ints: Set<string>, bools: Set<string>): any {
  if (v === null || v === undefined) return null;
  if (ints.has(column)) {
    const s = String(v);
    if (!/^-?\d+$/.test(s)) return null; // polars `cast(Int64, strict=False)`
    return isIdColumn(column) ? String(BigInt(s)) : Number(s);
  }
  if (bools.has(column)) return String(v) === "Yes";
  return Array.isArray(v) || isPlainObject(v) ? pyJson(v) : v;
}

/**
 * sdv-py `_scoring_frame`: one row per play / drive in feed order, the documented
 * columns always present (null when CBS omits one, as older games do) and first,
 * any extra key after them. `subplays` is the JSON of the flattened sub-events,
 * every event carrying the union of the fields this body used (polars' struct
 * unification), so a row's events share one shape.
 */
function scoringRows(
  raw: Record<string, any>,
  key: "plays" | "drives",
  order: string[],
  ints: Set<string>,
  bools: Set<string>
): ParserRow[] {
  const list = raw[key];
  const records: Record<string, any>[] = Array.isArray(list) ? list.filter(isPlainObject) : [];
  if (records.length === 0) return [];
  let subplays: Record<string, any>[][] = [];
  if (key === "plays") {
    const flat = records.map((r) => flatSubplays(r.subplays));
    const fields = [...new Set(flat.flat().flatMap((e) => Object.keys(e)))];
    subplays = flat.map((events) => events.map((e) => Object.fromEntries(fields.map((f) => [f, e[f] ?? null]))));
  }
  const rows = records.map((r, i) => {
    const row: ParserRow = {};
    for (const c of order) row[c] = c === "subplays" ? JSON.stringify(subplays[i]) : scoringCell(c, r[c], ints, bools);
    for (const [k, v] of Object.entries(r)) if (!(k in row)) row[k] = scoringCell(k, v, ints, bools);
    return row;
  });
  return idColumnsToStrings(rows);
}

/**
 * Generic parser for any API resource (the DEFAULT for most cbs endpoints;
 * sdv-py `parse_cbs_napi`). Handles every envelope NAPI serves: a
 * `{data: [...]}` record list, a `{data: {...}}` single resource, a bare list, a
 * plain object (one row), a dict-of-dicts keyed collection (one row per key, the
 * key kept in a `key` column) and the HTTP-200 `{error|errors|warnings}` failure
 * envelope (no rows). Rows are `json_normalize`-flattened (`_`), snake_cased,
 * list / object cells JSON-encoded, id columns decimal strings.
 *
 * A scoring-feed body -- `{plays: [...]}` (`/resource/game/scoring/plays/{gameId}`)
 * or `{drives: [...]}` (`/scoring/drives/{gameId}`) -- is parsed the way sdv-py's
 * `parse_cbs_napi_scoring_plays` / `parse_cbs_napi_scoring_drives` do: one row per
 * play / drive in feed order with a pinned column order, the always-integer
 * string fields typed (ids -> decimal strings, counts / yard lines -> numbers),
 * the `"Yes"`/`"No"` flags -> booleans, and a play's `subplays` (kickoff +
 * return, pass + fumble return, penalty, ...) as the JSON of its flattened
 * sub-events (`drive_id` joins the drives' `id`). `{plays: []}` is no rows.
 *
 * Returns `[]` for empty / error-envelope / unrecognized payloads.
 */
export function parse_cbs_list(raw: any): ParserRow[] {
  if (isPlainObject(raw)) {
    const keys = Object.keys(raw);
    if (keys.length === 1 && keys[0] === "plays") return scoringRows(raw, "plays", PLAY_COLUMNS, PLAY_INT_COLUMNS, PLAY_BOOL_COLUMNS);
    if (keys.length === 1 && keys[0] === "drives") return scoringRows(raw, "drives", DRIVE_COLUMNS, DRIVE_INT_COLUMNS, DRIVE_BOOL_COLUMNS);
  }
  return pandasObjectColumns(rowsToFrame(envelopeRows(raw)));
}

/**
 * Parse the scoreboard / scores / featured-game family into one row per game.
 *
 * API scoreboard payloads wrap the games under `data` as either a bare array
 * of game objects or `{games|scoreboard|scores: [...]}`. Each game object is
 * flattened to a row (nested `home`/`away`/`status` blocks deep-flatten to
 * `home_*` / `away_*` / `status_*` columns). A single-game payload (one game
 * object under `data`) yields one row. Returns `[]` when empty / malformed.
 */
export function parse_cbs_scoreboard(raw: any): ParserRow[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return normalize(data);
  if (!isPlainObject(data)) return [];
  for (const key of ["games", "scoreboard", "scores", "events"]) {
    const c = data[key];
    if (Array.isArray(c)) return normalize(c);
  }
  const list = firstListIn(data);
  if (list) return normalize(list);
  if (Object.keys(data).length > 0) return normalize([data]);
  return [];
}

/**
 * Parse a team-standings body (`/resource/team/standings/{teamId}`; sdv-py
 * `parse_cbs_napi_standings`) into one row per (season_year, season_type).
 *
 * Standings are the one NAPI resource that is not a record list: the body is a
 * `{year: {season_type: {stat: {...}}}}` map (season type `pre` / `regular` /
 * `post`). Each block becomes a row with `season_year` (a number when every
 * year key is numeric) and `season_type` leading the snake-cased stat columns
 * (`wins_number`, `winning_percentage_percentage`, ...; the stat keys are
 * sport-shaped, so the column set varies by league). An enveloped `{data: ...}`
 * body (the `player_standings` / SportsLine standings routed here) is handed to
 * the generic `parse_cbs_list`, which is the parser sdv-py uses for them.
 * Returns `[]` when empty / malformed / an error envelope.
 */
export function parse_cbs_standings(raw: any): ParserRow[] {
  if (!isPlainObject(raw) || Object.keys(raw).length === 0 || isErrorEnvelope(raw)) return [];
  const numericYears = Object.keys(raw).every((y) => /^\d+$/.test(y));
  const rows: Record<string, any>[] = [];
  for (const [year, byType] of Object.entries(raw)) {
    if (!isPlainObject(byType)) continue;
    for (const [seasonType, block] of Object.entries(byType)) {
      if (!isPlainObject(block)) continue;
      rows.push({ season_year: numericYears ? Number(year) : year, season_type: String(seasonType), ...block });
    }
  }
  if (rows.length > 0) return pandasObjectColumns(rowsToFrame(rows));
  return "data" in raw ? parse_cbs_list(raw) : [];
}

/**
 * Parse the odds / HQ-odds / props family into one row per market line.
 *
 * API odds payloads wrap markets under `data` as a bare array or as
 * `{markets|odds|lines: [...]}`. Each market may carry a nested `books`/`lines`
 * list (one quote per sportsbook); when present, the market is unrolled to one
 * row per book (the market-level fields prefixed onto each book row). Markets
 * with no nested book list flatten to a single row. Returns `[]` when empty /
 * malformed.
 */
export function parse_cbs_odds(raw: any): ParserRow[] {
  const data = unwrapData(raw);
  let markets: any[] | null = null;
  if (Array.isArray(data)) {
    markets = data;
  } else if (isPlainObject(data)) {
    for (const key of ["markets", "odds", "lines"]) {
      if (Array.isArray(data[key])) {
        markets = data[key];
        break;
      }
    }
    if (!markets) markets = firstListIn(data);
    // Single odds object with no inner list — one row.
    if (!markets && Object.keys(data).length > 0) return normalize([data]);
  }
  if (!Array.isArray(markets)) return [];

  const rows: Record<string, any>[] = [];
  for (const mk of markets) {
    if (!isPlainObject(mk)) continue;
    const { books, lines, quotes, ...marketCols } = mk;
    const inner = [books, lines, quotes].find((x) => Array.isArray(x) && x.length > 0);
    if (Array.isArray(inner)) {
      for (const b of inner) {
        if (isPlainObject(b)) rows.push({ ...marketCols, ...b });
      }
    } else {
      rows.push(mk);
    }
  }
  return normalize(rows);
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const CBS_PARSERS = {
  parse_cbs_list,
  parse_cbs_scoreboard,
  parse_cbs_standings,
  parse_cbs_odds,
};
