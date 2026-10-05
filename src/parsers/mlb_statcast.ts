// Parsers for Baseball Savant / Statcast payloads. Faithful port of
// `sportsdataverse/mlb/mlb_statcast_parsers.py`. Universal flat-API parser
// contract (mirrors `mlb.ts`):
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are snake-cased via a faithful port of the Python
//     `dl_utils.underscore` (NOT the json_normalize `snakeCase` used elsewhere).
//
// Why a dedicated column transform: Savant's CSVs already ship snake_case
// headers, and the very first column is literally `"last_name, first_name"`
// (comma + space). The Python parser applies `underscore`, which is a near
// no-op on these and — crucially — preserves the comma/space verbatim (it only
// splits camelCase and lowercases). The shared `_normalize.normalize`'s
// `snakeCase` would collapse `"last_name, first_name"` to
// `"last_name_first_name"`, so it can't be used for these payloads. JSON
// payloads (gamefeed / schedule / HTML-embedded leaderboards) are deep-flattened
// with a `_` separator (the `pd.json_normalize(sep="_")` equivalent) before the
// same `underscore` pass.

import Papa from "papaparse";
import { idColumnsToStrings, MLBAM_ID_COLUMNS, warnBigint } from "../core/int64.js";

/**
 * Faithful port of `sportsdataverse.dl_utils.underscore` (+ the parser's
 * trailing `.replace(".", "_")`):
 *
 *   - split a run of capitals followed by Capital+lower (`ABCDef` -> `ABC_Def`);
 *   - split a lower/digit boundary before a capital (`xwOBA` -> `xw_OBA`,
 *     `fooBar` -> `foo_Bar`);
 *   - `-` -> `_`, `.` -> `_`; then lowercase the whole thing.
 *
 * It does NOT touch spaces or commas — so `"last_name, first_name"` and
 * `"team name"` survive verbatim (lowercased), matching the Python output.
 */
function underscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .replace(/\./g, "_")
    .toLowerCase();
}

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Deep-flatten one row into `{ key: scalar }` with `_`-joined nested keys
 * (the `pd.json_normalize(sep="_")` equivalent). Array-valued cells are
 * JSON.stringify'd so the frame stays rectangular.
 */
function flattenRow(obj: Record<string, any>, prefix: string, out: Record<string, any>): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject(v)) {
      flattenRow(v, key, out);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
}

/** Apply the `underscore` column transform to every key of a row. */
export function underscoreKeys(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) out[underscore(String(k))] = v;
  return out;
}

/**
 * json_normalize-style flatten for a list of (possibly nested) JSON rows, then
 * `underscore` the resulting `_`-joined keys. Non-array / empty input -> `[]`.
 */
function jsonRows(rows: any[]): Record<string, any>[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const flat = rows.map((row) => {
    const out: Record<string, any> = {};
    if (isPlainObject(row)) flattenRow(row, "", out);
    else out.value = Array.isArray(row) ? JSON.stringify(row) : row;
    return underscoreKeys(out);
  });
  return idColumnsToStrings(flat); // an id column of integers -> decimal strings (v4 id rule)
}

/**
 * Parse Savant CSV text into tidy rows. Standard quoted CSV (the first header
 * is `"last_name, first_name"` — preserved verbatim). Empty / unparseable input
 * returns `[]`. Headers go through `underscore` (a near no-op on Savant's
 * already-snake headers).
 */
export function csvToRowsRaw(text: any): Record<string, any>[] {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = Papa.parse<Record<string, any>>(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data;
}

// pandas.read_csv's default NA strings (pandas STR_NA_VALUES): such a cell is missing.
const CSV_NA = new Set([
  "", "#N/A", "#N/A N/A", "#NA", "-1.#IND", "-1.#QNAN", "-NaN", "-nan", "1.#IND",
  "1.#QNAN", "<NA>", "N/A", "NA", "NULL", "NaN", "None", "n/a", "nan", "null",
]);
const CSV_INT = /^[+-]?\d+$/;
const CSV_NUMBER = /^[+-]?((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|inf|infinity)$/i;
const CSV_TRUE = new Set(["True", "TRUE", "true"]);
const CSV_BOOL = new Set([...CSV_TRUE, "False", "FALSE", "false"]);

/** A numeric CSV cell as pandas reads it (`inf` / `-inf` -> +/-Infinity). */
function csvNumber(v: string): number {
  const t = v.trim();
  return /inf/i.test(t) ? (t.startsWith("-") ? -Infinity : Infinity) : Number(t);
}

/** Node: a process warning; other runtimes (the browser playground): console.warn. */
function warn(message: string): void {
  const proc = (globalThis as { process?: { emitWarning?: (m: string) => void } }).process;
  if (proc?.emitWarning) proc.emitWarning(message);
  else console.warn(message);
}

/**
 * pandas.read_csv's per-column dtype inference (what sdv-py's `_csv_to_frame`
 * reads Savant CSVs with), in place: an NA cell becomes `null`; a column whose
 * every other cell is numeric becomes numbers (an integer column holding a value
 * beyond Number.MAX_SAFE_INTEGER becomes BigInt instead, with one warning,
 * so no int64 precision is lost), one of only True/False cells booleans; anything
 * else stays text. (`typedCsvRows` names a column still BigInt after the id
 * rule in one warning per column per process.)
 */
function inferCsvTypes(rows: Record<string, any>[]): Record<string, any>[] {
  for (const col of rows.length ? Object.keys(rows[0]) : []) {
    const present = rows.map((r) => r[col]).filter((v) => typeof v === "string" && !CSV_NA.has(v));
    let conv: ((v: string) => any) | null = null;
    if (present.length && present.every((v) => CSV_NUMBER.test(v.trim()))) {
      const big =
        present.every((v) => CSV_INT.test(v.trim())) &&
        present.some((v) => !Number.isSafeInteger(Number(v.trim())));
      conv = big ? (v) => BigInt(v.trim()) : csvNumber;
    } else if (present.length && present.every((v) => CSV_BOOL.has(v))) {
      conv = (v) => CSV_TRUE.has(v);
    }
    for (const r of rows) {
      const v = r[col];
      r[col] = typeof v !== "string" || CSV_NA.has(v) ? null : conv ? conv(v) : v;
    }
  }
  return rows;
}

/**
 * An MLBAM id cell as sdv-py's `to_numeric` + Int64 cast reads it, as its exact
 * decimal string; `undefined` when it is not an integer (or is a number past
 * 2^53, already rounded).
 */
function mlbamId(v: any): string | undefined {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return Number.isSafeInteger(v) ? String(v) : undefined;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (CSV_INT.test(t)) return BigInt(t).toString(); // exact, any length
  const n = CSV_NUMBER.test(t) ? csvNumber(t) : NaN;
  return Number.isSafeInteger(n) ? String(n) : undefined;
}

/**
 * Port of sdv-py's `_pin_id_columns`, in place: an MLBAM id column
 * (`MLBAM_ID_COLUMNS`) whose every non-null cell is an integer (a number, or a
 * digit string such as the `/gf` feed's `"745444"`) is pinned to Int64 in
 * sdv-py, so here to its exact decimal strings (the v4 id rule:
 * `"745444"`, `"0745444"` -> `"745444"`); `""` is null. A column holding a
 * non-integral or non-numeric value is left as read and named in one warning
 * (`_warn_uncast_ids`).
 */
function pinIdColumns(rows: Record<string, any>[]): Record<string, any>[] {
  const uncast: string[] = [];
  for (const col of MLBAM_ID_COLUMNS) {
    if (!rows.some((r) => col in r)) continue;
    // pandas `to_numeric("")` -> NaN, so an empty-string cell is null (whitespace is not).
    const present = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "");
    if (!present.every((v) => mlbamId(v) !== undefined)) {
      uncast.push(col);
      continue;
    }
    for (const r of rows) {
      if (r[col] === "") r[col] = null;
      else if (r[col] !== null && r[col] !== undefined) r[col] = mlbamId(r[col]);
    }
  }
  if (uncast.length) {
    warn(
      `Savant CSV id columns [${uncast.sort().join(", ")}] hold non-integral or non-numeric values; ` +
        "left as read, not cast to Int64."
    );
  }
  return rows;
}

/**
 * Raw CSV rows (`csvToRowsRaw`) -> the tidy, typed form sdv-py's `_csv_to_frame`
 * returns: pandas-style column typing, the `underscore` key transform, MLBAM ids
 * pinned (decimal strings), every other id column of integers decimal strings
 * (the v4 id rule). An integer column left BigInt is named in one warning per
 * column per process (code `SDV_INT64`). Mutates the raw rows' cells.
 */
export function typedCsvRows(rows: Record<string, any>[]): Record<string, any>[] {
  const out = idColumnsToStrings(pinIdColumns(inferCsvTypes(rows).map((row) => underscoreKeys(row))));
  for (const col of out.length ? Object.keys(out[0]) : []) {
    if (out.some((r) => typeof r[col] === "bigint")) warnBigint("Savant CSV", col);
  }
  return out;
}

/** `csvToRowsRaw` + `typedCsvRows` (the tidy form). */
function csvToRows(text: any): Record<string, any>[] {
  return typedCsvRows(csvToRowsRaw(text));
}

/**
 * Extract the JSON value assigned to `varName` in an embedded `<script>` blob.
 *
 * Savant pages embed data as `var serverVals = {...}` (player pages) or
 * `const data = [...]` (the `fielding-run-value` / `statcast-park-factors`
 * leaderboards). Handles `var` / `let` / `const` / `window.` / bare assignment,
 * decodes either an object or an array via balanced-bracket scanning (so nested
 * Savant payloads are not truncated), and skips any same-named assignment whose
 * body fails to decode. A word-boundary guard (`[\w$.]` not preceding the name)
 * ensures a request for `data` does not latch onto `methods_data`. Returns
 * `null` when absent / unparseable.
 */
function htmlDecodeVar(html: string, varName: string): any {
  if (!html || typeof html !== "string") return null;
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pat = new RegExp(`(?:(?:var|let|const)\\s+|window\\.)?${escaped}\\s*=\\s*`, "g");
  let m: RegExpExecArray | null;
  while ((m = pat.exec(html)) !== null) {
    const start = m.index;
    // word-boundary guard: the char before the match start must not be part of
    // an identifier (so `methods_data` doesn't match a request for `data`).
    const prev = start > 0 ? html[start - 1] : "";
    if (prev && /[\w$.]/.test(prev)) continue;
    const decoded = decodeJsonAt(html, m.index + m[0].length);
    if (decoded !== undefined && (Array.isArray(decoded) || isPlainObject(decoded))) {
      return decoded;
    }
  }
  return null;
}

/**
 * `JSONDecoder.raw_decode` equivalent: decode a single JSON value beginning at
 * `pos` in `text` by scanning to the matching close bracket/brace (respecting
 * strings + escapes), then `JSON.parse` that slice. Returns `undefined` on
 * failure or when `pos` isn't on a `{`/`[`.
 */
function decodeJsonAt(text: string, pos: number): any {
  const open = text[pos];
  if (open !== "{" && open !== "[") return undefined;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = pos; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(pos, i + 1));
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
}

/** Object-only convenience over {@link htmlDecodeVar} (`{}` if not a dict). */
function htmlScriptJson(html: string, varName: string): Record<string, any> {
  const obj = htmlDecodeVar(html, varName);
  return isPlainObject(obj) ? obj : {};
}

/**
 * Parse a Statcast search CSV payload (`/statcast_search/csv`) into tidy rows,
 * one row per search result. Non-string / empty input returns `[]`.
 */
export function parse_mlb_statcast_search(payload: any): Record<string, any>[] {
  return csvToRows(payload);
}

/**
 * Parse a Statcast leaderboard CSV payload (`/leaderboard/*` with `csv=true`)
 * into tidy rows, one row per leaderboard entry. Non-string / empty input
 * returns `[]`. The first column header (`"last_name, first_name"`) is kept
 * verbatim, matching the Python parser.
 */
export function parse_mlb_statcast_leaderboard(payload: any): Record<string, any>[] {
  return csvToRows(payload);
}

/**
 * Parse a Statcast gamefeed (`/gf`) JSON payload into a tidy per-pitch frame.
 *
 * The Savant `/gf` feed carries the game's pitch-by-pitch tracking under the
 * `team_home` and `team_away` arrays (one rich object per pitch). This
 * concatenates both sides into one frame, one row per pitch. When neither side
 * is present it falls back to the `exit_velocity` array (batted-ball events).
 */
export function parse_mlb_statcast_gamefeed(payload: any): Record<string, any>[] {
  if (!isPlainObject(payload)) return [];
  let rows: any[] = [];
  for (const side of ["team_home", "team_away"]) {
    const v = payload[side];
    if (Array.isArray(v)) rows = rows.concat(v);
  }
  if (rows.length === 0 && Array.isArray(payload.exit_velocity)) {
    rows = payload.exit_velocity;
  }
  // MLBAM ids pinned to integers like the CSV parsers (the feed ships game_pk as "745444").
  return pinIdColumns(jsonRows(rows));
}

/**
 * Parse the Savant `/schedule` JSON into a tidy frame of one row per game.
 *
 * The feed wraps the standard MLB Stats API schedule under
 * `schedule.dates[].games[]`. This flattens every game across all dates into
 * one row, snake-cased. Missing / empty input returns `[]`.
 */
export function parse_mlb_statcast_schedule(payload: any): Record<string, any>[] {
  const sched = isPlainObject(payload) ? payload.schedule : null;
  const dates = isPlainObject(sched) ? sched.dates : null;
  if (!Array.isArray(dates)) return [];
  const games: any[] = [];
  for (const d of dates) {
    if (isPlainObject(d) && Array.isArray(d.games)) games.push(...d.games);
  }
  return jsonRows(games);
}

/**
 * Parse an HTML-embedded-JSON Statcast leaderboard into a tidy frame.
 *
 * A couple of leaderboards (`fielding-run-value`, `statcast-park-factors`)
 * return `text/html` even with `csv=true`; the rows live in an embedded
 * `const data = [...]` `<script>` array. This extracts and flattens that array.
 */
export function parse_mlb_statcast_html_leaderboard(payload: any): Record<string, any>[] {
  const rows = htmlDecodeVar(typeof payload === "string" ? payload : "", "data");
  if (!Array.isArray(rows)) return [];
  return jsonRows(rows);
}

/**
 * Parse a Savant player page into a tidy frame of one of its embedded tables.
 *
 * The `/savant-player/{id}` page embeds a large `var serverVals = {...}` blob
 * whose array-valued keys are the page's data tables. `section` selects which
 * one — default `"statcast"` (the seasonal Statcast aggregate). Other useful
 * sections include `"statcastGameLogs"`, `"statcastHistogram"`, `"zones"`,
 * `"pitchDetails"`, `"sprayChart"`, `"fielderPositioning"`, `"statcastLeader"`.
 *
 * @param payload HTML page text (e.g. from `mlb_statcast_player(..., raw: true)`).
 * @param section name of the `serverVals` array key to flatten.
 */
export function parse_mlb_statcast_player(
  payload: any,
  section = "statcast"
): Record<string, any>[] {
  const rows = htmlScriptJson(typeof payload === "string" ? payload : "", "serverVals")[section];
  if (!Array.isArray(rows)) return [];
  return jsonRows(rows);
}
