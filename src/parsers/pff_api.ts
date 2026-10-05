// Parsers for the PFF Developer API (`api.pff.com`). Faithful port of sdv-py's
// `sportsdataverse/nfl/pff_parsers.py` (`parse_pff_report`,
// `parse_pff_player_detail`, `parse_pff_matrix`, `parse_pff_v2_table`):
//
//   - `/v1` bodies are single-key envelopes keyed by the report slug
//     (`{passing_summary: [rows]}`); a `restricted` block beside the envelope
//     (columns withheld by entitlement) is metadata, never a table;
//   - matrix reports (`{defenders, receivers, versus}`) and multi-key singletons
//     (`/v1/teams` -> `{franchise_groups, games, teams}`) return a dict of tables,
//     the way py returns a dict of frames;
//   - `/v2` bodies self-describe their columns (`columns: [{key, type}]`) and the
//     declared types are the schema;
//   - id columns are integer join keys (Int64 in sdv-py), returned as exact decimal
//     strings (the v4 id rule, src/core/int64.ts); `jersey_number` stays a string ("09");
//     list / dict cells are JSON-stringified (py `json.dumps(sort_keys=True)`);
//   - keys are snake-cased with py's `underscore`; empty input returns `[]`.

import { idColumnsToStrings } from "../core/int64.js";
import { isPlainObject, underscore } from "./_normalize.js";
import { MULTI_TABLE_SECTIONS, sectionError } from "./_frames.js";

type Row = Record<string, any>;
type Tables = Record<string, Row[]>;

const MATRIX_KEYS = ["defenders", "receivers", "versus"];
const META_KEYS = new Set(["restricted"]);
/** /v2 tables: row key -> the key holding that table's self-described columns. */
const V2_TABLES: Record<string, string> = { rows: "columns", teamTotals: "totalsColumns" };

/** Integer join keys (py `_ID_COLS`): cast to integers, never floats or strings. */
const ID_COLS = new Set([
  "player_id",
  "franchise_id",
  "league_id",
  "season_id",
  "game_id",
  "away_franchise_id",
  "home_franchise_id",
  "player_franchise_id",
  "coverage_player_id",
  "defender_player_id",
  "receiver_player_id",
  "stadium_id",
  "id",
]);

/** `raw` without the non-table metadata keys (`restricted`). */
function envelope(raw: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) if (!META_KEYS.has(k)) out[k] = v;
  return out;
}

/**
 * Python `json.dumps(value, sort_keys=True)`: `", "` / `": "` separators, sorted
 * keys, non-ASCII escaped (`ensure_ascii`). Used for list / dict cells.
 */
export function pyJsonDumps(value: unknown): string {
  const str = (s: string): string =>
    JSON.stringify(s).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const enc = (v: any): string => {
    if (v === null || v === undefined) return "null";
    if (typeof v === "string") return str(v);
    if (typeof v === "number") return Number.isFinite(v) ? String(v) : v > 0 ? "Infinity" : v < 0 ? "-Infinity" : "NaN";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (Array.isArray(v)) return `[${v.map(enc).join(", ")}]`;
    if (typeof v === "object") {
      return `{${Object.keys(v)
        .sort()
        .map((k) => `${str(k)}: ${enc(v[k])}`)
        .join(", ")}}`;
    }
    return str(String(v)); // py `default=str`
  };
  return enc(value);
}

/** Python truthiness (`[]` / `{}` / `""` / `0` are falsy). */
function truthy(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (isPlainObject(v)) return Object.keys(v as object).length > 0;
  return Boolean(v);
}

/** JSON-stringify a list / dict cell; pass scalars through unchanged. */
function scalarize(value: unknown): unknown {
  return value !== null && typeof value === "object" ? pyJsonDumps(value) : value;
}

/**
 * Rows -> rectangular rows: union of keys in first-seen order (polars
 * `pl.DataFrame(rows)`), missing cells `null`, keys run through `underscore`.
 */
function rectangular(rows: Row[]): { columns: string[]; rows: Row[] } {
  const raw: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        raw.push(k);
      }
    }
  }
  const columns = raw.map(underscore);
  const out = rows.map((r) => {
    const o: Row = {};
    raw.forEach((k, i) => {
      o[columns[i]] = r[k] === undefined ? null : r[k];
    });
    return o;
  });
  return { columns, rows: out };
}

/** polars non-strict cast of one value to Int64 (`null` when it can't); a digit string past 2^53 stays exact (BigInt). */
function toInt(v: any): number | bigint | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  if (typeof v === "string" && /^\s*[-+]?\d+\s*$/.test(v)) {
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : BigInt(v.trim());
  }
  return null;
}

/** polars non-strict cast of one value to Float64 (`null` when it can't). */
function toFloat(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(v)) return Number(v);
  return null;
}

/** polars cast of one value to Utf8. */
function toStr(v: any): string | null {
  return v === null || v === undefined ? null : String(v);
}

/** Build the tidy rows for a list of row dicts (py `_frame`). */
function frame(rows: unknown): Row[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  // a list of scalars (e.g. player seasons -> [2025, 2024, ...])
  if (!isPlainObject(rows[0])) return rows.map((r) => ({ value: scalarize(r) }));
  const norm = rows.map((row) => {
    const o: Row = {};
    for (const [k, v] of Object.entries(isPlainObject(row) ? row : {})) o[k] = scalarize(v);
    return o;
  });
  const { columns, rows: out } = rectangular(norm);
  for (const c of columns) {
    const isText = out.some((r) => typeof r[c] === "string");
    if (ID_COLS.has(c) && !isText) for (const r of out) r[c] = toInt(r[c]);
  }
  if (columns.includes("jersey_number")) for (const r of out) r.jersey_number = toStr(r.jersey_number);
  return idColumnsToStrings(out);
}

/** The single matrix object in an envelope (py `parse_pff_matrix` lookup). */
function isMatrix(v: unknown): boolean {
  return isPlainObject(v) && MATRIX_KEYS.every((k) => k in (v as Row));
}

/**
 * Parse a coverage-matrix report (`receiving_coverage_stats`) into its three
 * tables: `{ defenders, receivers, versus }` (each possibly `[]`).
 */
export function parse_pff_matrix(raw: any, report?: string): Tables {
  let obj: Row = {};
  if (isPlainObject(raw) && Object.keys(raw).length) {
    if (report !== undefined && isPlainObject(raw[report])) {
      obj = raw[report];
    } else {
      for (const v of Object.values(raw)) {
        if (isMatrix(v)) {
          obj = v as Row;
          break;
        }
      }
    }
  }
  const out: Tables = {};
  for (const name of MATRIX_KEYS) out[name] = frame(truthy(obj[name]) ? obj[name] : []);
  return out;
}

/** Own-key check (never a prototype key such as `constructor`). */
const has = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Parse a `/v1` facet / singleton / matrix envelope.
 *
 * - one flat report (`{passing_summary: [rows]}`) -> tidy rows;
 * - a matrix report -> `{ defenders, receivers, versus }`;
 * - a multi-key singleton (`/v1/teams`) -> `{ <key>: rows }` over every list key;
 * - empty / malformed -> `[]`.
 *
 * @param section One table: a key of the dict above, or a single report's own
 *   key (sdv-py's `report`). Unknown -> an error listing the valid names.
 */
export function parse_pff_report(raw: any, section?: string): Row[] | Tables {
  const all = reportTables(raw);
  if (section === undefined) return all;
  let tables: Tables = {};
  if (!Array.isArray(all)) tables = all;
  else if (isPlainObject(raw)) {
    const keys = Object.keys(envelope(raw));
    if (keys.length === 1 && Array.isArray(raw[keys[0]])) tables = { [keys[0]]: all };
  }
  if (!Object.keys(tables).length) return [];
  if (!has(tables, section)) {
    throw sectionError("parse_pff_report", section, Object.keys(tables), MULTI_TABLE_SECTIONS.parse_pff_report.default);
  }
  return tables[section];
}

/** `parse_pff_report`'s default result (no `section`). */
function reportTables(raw: any): Row[] | Tables {
  if (!isPlainObject(raw) || !Object.keys(raw).length) return [];
  const env = envelope(raw);
  const keys = Object.keys(env);
  if (keys.length === 1) {
    const val = env[keys[0]];
    if (isMatrix(val)) return parse_pff_matrix(env);
    if (Array.isArray(val)) return frame(val);
    // a single non-list, non-matrix dict (a player-detail envelope routed here)
    return [];
  }
  // multi-key singleton (teams -> {franchise_groups, games, teams})
  const out: Tables = {};
  for (const [k, v] of Object.entries(env)) if (Array.isArray(v)) out[k] = frame(v);
  return Object.keys(out).length ? out : [];
}

/** Validate a fixed-name `section` against the parser's MULTI_TABLE_SECTIONS entry. */
function fixedSection(parser: string, section: string | undefined): string {
  const spec = MULTI_TABLE_SECTIONS[parser];
  const name = section ?? (spec.default as string);
  if (!(spec.sections as string[]).includes(name)) throw sectionError(parser, name, spec.sections as string[], spec.default);
  return name;
}

/**
 * Parse a `/v1/player/...` detail envelope (`{slug: {subject, week_totals,
 * weeks}}`) into one row per week, or with `section: "career"` (sdv-py's
 * `career=True`) one row per season. The nested `game` object becomes
 * `game_*` columns; `player_id` / `league_id` / `season` are filled from
 * `subject` when a row lacks them.
 *
 * @param section `"weeks"` (default) or `"career"`.
 */
export function parse_pff_player_detail(raw: any, section?: string): Row[] {
  const career = fixedSection("parse_pff_player_detail", section) === "career";
  if (!isPlainObject(raw) || !Object.keys(raw).length) return [];
  const env = envelope(raw);
  const keys = Object.keys(env);
  const obj = keys.length === 1 && isPlainObject(env[keys[0]]) ? env[keys[0]] : env;
  if (!isPlainObject(obj)) return [];
  const subject = truthy(obj.subject) ? obj.subject : {};
  let rows = career ? obj.seasons : obj.weeks;
  if (!truthy(rows)) rows = truthy(obj.week_totals) ? obj.week_totals : truthy(obj.career) ? obj.career : [];
  if (isPlainObject(rows)) rows = [rows];
  const flat: Row[] = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isPlainObject(row)) continue;
    const r: Row = { ...row };
    const game = r.game;
    delete r.game;
    if (isPlainObject(game)) for (const [gk, gv] of Object.entries(game)) r[`game_${gk}`] = gv;
    for (const sk of ["player_id", "league_id", "season"]) if (!(sk in r)) r[sk] = subject[sk] ?? null;
    flat.push(r);
  }
  return frame(flat);
}

/** The JS analogue of the polars dtype a column of JSON values infers to. */
function inferredKind(values: any[]): "int" | "float" | "bool" | "str" | "null" | "mixed" {
  const kinds = new Set<string>();
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") kinds.add(Number.isInteger(v) ? "int" : "float");
    else if (typeof v === "boolean") kinds.add("bool");
    else kinds.add("str");
  }
  if (kinds.size === 0) return "null";
  if (kinds.size === 1) return [...kinds][0] as "int" | "float" | "bool" | "str";
  if ([...kinds].every((k) => k === "int" || k === "float")) return "float";
  return "mixed";
}

/**
 * Parse a `/v2` table body (`{...meta, columns: [{key, label, type}], rows}`).
 * The declared types ARE the schema: integer / number / boolean / string; every
 * `id` / `*_id` column is an integer join key whatever the declaration says.
 * Declared columns come first, in PFF's order; a declared column missing from
 * every row is added as `null`. Metadata beside the table (`team`, `sos`,
 * `updatedAt`, …) is not a column — read it from the raw body.
 *
 * @param section Which table: `"rows"` (default) or `"teamTotals"` (sdv-py's `table`).
 */
export function parse_pff_v2_table(raw: any, section?: string): Row[] {
  const table = fixedSection("parse_pff_v2_table", section);
  const body = isPlainObject(raw) ? raw : {};
  const declared = ((body[V2_TABLES[table] ?? `${table}Columns`] as any[]) || []).filter(
    (c) => isPlainObject(c) && c.key
  );
  const schema = new Map<string, string>();
  for (const c of declared) {
    const name = underscore(String(c.key));
    const type = ["integer", "number", "boolean", "string"].includes(String(c.type)) ? String(c.type) : "string";
    schema.set(name, name === "id" || name.endsWith("_id") ? "integer" : type);
  }
  const rows = ((body[table] as any[]) || []).filter(isPlainObject);
  if (!rows.length) return [];
  const norm = rows.map((r) => {
    const o: Row = {};
    for (const [k, v] of Object.entries(r)) o[k] = scalarize(v);
    return o;
  });
  const { columns, rows: out } = rectangular(norm);
  for (const [c, type] of schema) {
    if (!columns.includes(c)) {
      for (const r of out) r[c] = null;
      continue;
    }
    const kind = inferredKind(out.map((r) => r[c]));
    if (type === "integer") for (const r of out) r[c] = toInt(r[c]);
    else if (type === "number") for (const r of out) r[c] = toFloat(r[c]);
    else if (type === "boolean") {
      // polars can't cast text to Boolean: py keeps the inferred column (never raises)
      if (kind !== "str" && kind !== "mixed") for (const r of out) r[c] = r[c] === null ? null : Boolean(r[c]);
    } else if (kind !== "null") {
      for (const r of out) r[c] = toStr(r[c]);
    }
  }
  const order = [...schema.keys(), ...columns.filter((c) => !schema.has(c))];
  return idColumnsToStrings(
    out.map((r) => {
      const o: Row = {};
      for (const c of order) o[c] = r[c];
      return o;
    })
  );
}
