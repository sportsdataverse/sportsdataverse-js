// Shared "list of JSON records -> tidy rows" builder for the keyless provider
// parsers (on3, ASA, MLS, NWSL). Faithful port of sdv-py's
// `soccer/_frames.py::rows_to_frame` (and the near-identical `_rows_to_frame` in
// `cfb/on3_parsers.py`), i.e. `pandas.json_normalize(sep="_")` + `underscore()`:
//
//   - nested objects flatten with `_`, names are snake_cased;
//   - two source keys that snake_case to the same name do NOT overwrite each
//     other: later ones gain a `_2`, `_3`, ... suffix (on3 has several such
//     collisions: `person.highSchoolName` vs `person.highSchool.name`);
//   - array / object cells are JSON-encoded (rows stay rectangular), EXCEPT a
//     list-valued id cell, which is comma-joined (ASA serialises `team_id` as a
//     list for a player who featured for several clubs);
//   - with `ids: true` every id column (`isIdColumn`: `id` / `*_id` / `*_ids` /
//     `*_pk`) is pinned to a string (a whole-number float is stringified as
//     `"123"`, never `"123.0"`); without it an id column of integers still
//     becomes decimal strings (the v4 INT64 id rule, src/core/int64.ts);
//   - a bare scalar array becomes a single `value` column of strings;
//   - every row carries every column (missing -> null), in first-seen order.
//
// Unlike pandas, a JS number stays a number: where Python's object-dtype
// coercion turns a *mixed-type* column into strings, the JS cell keeps its
// native value.

import { idColumnsToStrings, isIdColumn } from "../core/int64.js";

/**
 * sdv-py `dl_utils.underscore`, verbatim: split capital runs and camel humps,
 * `-` -> `_`, lower-case. Unlike `snakeCase` it keeps a leading `_` and spaces,
 * so column names match the sdv-py frames exactly.
 *
 * @param word - The source key (camelCase, PascalCase, kebab-case or already snake_case).
 * @returns The lower-cased, underscore-separated name.
 * @remarks
 * Dots, spaces and repeated underscores pass through untouched (use `snakeCase` from
 * `_normalize.ts` when those must collapse). Same rule as `underscore` in `_normalize.ts`.
 * @example
 * pyUnderscore("highSchoolName"); // "high_school_name"
 * pyUnderscore("team-id"); // "team_id"
 */
export function pyUnderscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

/**
 * Python `json.dumps` text for a JSON value: ", " and ": " separators, non-ASCII as \uXXXX.
 *
 * @param v - Any JSON-serialisable value (an object, array, string, number, boolean or null).
 * @returns The `json.dumps`-shaped text, so a JSON-encoded cell compares equal to sdv-py's.
 * @remarks
 * Built on `JSON.stringify`: `undefined` input yields `undefined` and the `.replace` chain then
 * throws a `TypeError`, so pass JSON values only. Every code point from U+007F up is escaped
 * as `\uXXXX`, matching Python's default `ensure_ascii=True`.
 * @example
 * pyJson({ a: [1, 2], b: "é" }); // '{"a": [1, 2], "b": "\\u00e9"}'
 */
export function pyJson(v: any): string {
  return JSON.stringify(v)
    .replace(/("(?:[^"\\]|\\.)*")|([,:])/g, (_m, str?: string, sep?: string) =>
      str !== undefined ? str : `${sep} `
    )
    .replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

/** One tidy row (column name -> cell): the shared `ParserRow` type under its `_frames` alias. */
export type { ParserRow as Row } from "../core/types.js";
import type { ParserRow as Row } from "../core/types.js";

/**
 * Is `v` a plain object (not null, not an array)?
 *
 * @param v - Any value.
 * @returns `true` for a non-null, non-array object (a `Date` or class instance counts too —
 *   unlike the `_normalize.ts` twin, which excludes `Date`).
 * @example
 * isPlainObject({ id: 1 }); // true
 * isPlainObject([1]); // false
 */
export function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Flatten one record into ordered `[path, value]` pairs (path joined with `_`),
 * ordered like `pandas.json_normalize` (`nested_to_record`): at the TOP level the
 * scalar / array keys keep their place and every nested object's flattened keys
 * follow them; below the top level keys stay in encounter order.
 */
function flatten(obj: Record<string, any>, prefix: string, out: Array<[string, any]>): void {
  const top = prefix === "";
  const nested: Array<[string, Record<string, any>]> = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = top ? k : `${prefix}_${k}`;
    if (!isPlainObject(v)) out.push([key, v]);
    else if (top) nested.push([key, v]);
    else flatten(v, key, out);
  }
  for (const [key, v] of nested) flatten(v, key, out);
}

/** String form of an id cell: integer-valued numbers print without a decimal point. */
function idString(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => String(x)).join(",");
  if (isPlainObject(v)) return pyJson(v);
  return String(v);
}

/** Options for {@link rowsToFrame}. */
export interface RowsToFrameOptions {
  /** Pin every id column to strings, whatever its values (the soccer providers). */
  ids?: boolean;
  /** Drop `null` entries before flattening (the soccer providers); on3 keeps them. */
  dropNull?: boolean;
}

/**
 * Flatten a list of JSON records into rectangular, snake_cased rows. `[]` for no input.
 *
 * @param rows - The records (a JSON array; `null` / `undefined` count as empty). A record that
 *   is not an object is kept under a `value` column; a list with no objects at all becomes
 *   one `value` column of strings.
 * @param opts - `ids`: pin every id column (`isIdColumn`) to strings via the id-cell rule (a
 *   whole-number float prints as `"123"`, a list comma-joins, an object JSON-encodes).
 *   `dropNull`: drop `null` / `undefined` entries before flattening. Both default to `false`.
 * @returns One row per kept record, every row carrying every column (missing -> `null`) in
 *   first-seen order; nested objects flatten with `_`, names are `pyUnderscore`d and
 *   de-duplicated with `_2`, `_3`, ... suffixes, array / object cells are `pyJson` text.
 * @remarks
 * Port of sdv-py `soccer/_frames.py::rows_to_frame` (`pandas.json_normalize(sep="_")` +
 * `underscore()`). Column order follows `json_normalize`: top-level scalar / array keys first,
 * then each nested object's keys. Without `ids`, id columns still go through the v4 INT64 id
 * rule (`idColumnsToStrings`): a column of integers becomes decimal strings, anything else is
 * left as read. Unlike pandas a JS number stays a number in a mixed-type column.
 * @example
 * const rows = rowsToFrame(payload.players, { ids: true, dropNull: true });
 * rows[0].team_id; // "1234" (a list id -> "1234,5678")
 */
export function rowsToFrame(rows: readonly any[] | null | undefined, opts: RowsToFrameOptions = {}): Row[] {
  const kept = (rows ?? []).filter((r) => !(opts.dropNull && (r === null || r === undefined)));
  if (kept.length === 0) return [];
  // A bare scalar array has no keys to flatten: one `value` column of strings.
  if (!kept.some(isPlainObject)) return kept.map((r) => ({ value: String(r) }));

  const records = kept.map((r) => {
    const pairs: Array<[string, any]> = [];
    flatten(isPlainObject(r) ? r : { value: r }, "", pairs);
    return pairs;
  });

  // Column set: first-seen order across records; snake_case, de-duplicated.
  const finalName = new Map<string, string>();
  const used = new Map<string, number>();
  for (const pairs of records) {
    for (const [path] of pairs) {
      if (finalName.has(path)) continue;
      const base = pyUnderscore(path);
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      finalName.set(path, n === 1 ? base : `${base}_${n}`);
    }
  }
  const columns = [...finalName.values()];

  const out = records.map((pairs) => {
    const row: Row = {};
    for (const c of columns) row[c] = null;
    for (const [path, v] of pairs) {
      const name = finalName.get(path)!;
      let cell = v === undefined ? null : v;
      if (opts.ids && isIdColumn(name)) cell = idString(cell);
      else if (Array.isArray(cell) || isPlainObject(cell)) cell = pyJson(cell);
      row[name] = cell;
    }
    return row;
  });
  return opts.ids ? out : idColumnsToStrings(out);
}

/**
 * A JSON body as a row list: a list as-is, a non-empty object as one row, else `[]`.
 *
 * @param raw - A decoded JSON body (array, object, scalar, `null`).
 * @returns The array itself (not a copy), `[raw]` for a non-empty plain object, `[]` for
 *   anything else (an empty object, a scalar, `null`).
 * @example
 * const rows = rowsToFrame(asRows(payload));
 */
export function asRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (isPlainObject(raw) && Object.keys(raw).length > 0) return [raw];
  return [];
}

/**
 * Multi-table parsers (sdv-py returns a dict of frames): the sub-frame names each
 * returns and the one returned by default, i.e. the frame sdv-py's returns schema
 * documents. `section` on the wrapper (same name as the ESPN summary dispatcher's)
 * picks any other. Mirrored in tools/codegen/endpoints/flat_parser_sections.yaml
 * (read by codegen for the reference docs; a test keeps the two equal).
 */
export interface SectionSpec {
  /** The table returned without `section`; `null` = every table, as a dict (sdv-py's own shape). */
  default: string | null;
  /** The valid names; `null` when the payload names its own tables (see `dynamic`). */
  sections: string[] | null;
  /** For payload-named tables: what the names are (shown in the reference). */
  dynamic?: string;
  /**
   * sdv-py's `result_set` contract (stats.nba.com): an unknown name returns `[]` (py: a
   * zero-row frame) instead of throwing, and a one-table payload is that table by default.
   */
  resultSet?: true;
}

/**
 * The multi-table parsers (by registry name) and their {@link SectionSpec}: which sub-frame
 * each returns by default and which `section` names it accepts.
 *
 * @remarks
 * A parser's presence here is what makes the flat wrapper dispatch (and `parseEndpoint`) pass
 * `section` through. Mirrored in `tools/codegen/endpoints/flat_parser_sections.yaml`; a test
 * keeps the two equal, so an entry added here needs the YAML edit too.
 */
export const MULTI_TABLE_SECTIONS: Record<string, SectionSpec> = {
  parse_asa_goals_added: { default: "summary", sections: ["summary", "actions"] },
  parse_mls_standings: { default: "entries", sections: ["tables", "entries"] },
  parse_mls_match: {
    default: "match_information",
    sections: ["match_information", "environment", "teams", "players", "staff", "referees", "last_matches"],
  },
  parse_nwsl_lineups: { default: "players", sections: ["teams", "players", "staff"] },
  // PFF (py's `report` / `career` / `table` arguments) and KenPom (one table per
  // HTML id). The two dict-default parsers keep sdv-py's return shape.
  parse_pff_report: {
    default: null,
    sections: null,
    dynamic: "a key of the default dict (a matrix report's `defenders` / `receivers` / `versus`; `/v1/teams`' `franchise_groups` / `games` / `teams`), or a single report's own key (e.g. `passing_summary`)",
  },
  parse_pff_player_detail: { default: "weeks", sections: ["weeks", "career"] },
  parse_pff_v2_table: { default: "rows", sections: ["rows", "teamTotals"] },
  parse_kenpom_page: {
    default: null,
    sections: null,
    dynamic: "a table id on the page (e.g. `ratings_table`; team.php: `schedule_table`, `player_table`, `depth_chart`)",
  },
  // stats.nba.com / stats.wnba.com: the parser selects itself (sdv-py `result_set`).
  parse_nba_stats_result_sets: {
    default: null,
    sections: null,
    dynamic: "a result-set name the payload ships (sdv-py's `result_set`)",
    resultSet: true,
  },
};

/**
 * The error for a `section` the parser does not have, listing the valid names.
 *
 * @param parser - The parser's registry name (the message prefix).
 * @param name - The rejected section name.
 * @param valid - The names the parser does accept (JSON-encoded in the message).
 * @param dflt - The parser's default section, or `null` for a dict-default parser.
 * @returns A plain `Error` (not thrown here) whose message names the valid sections and the
 *   default.
 * @example
 * throw sectionError("parse_nwsl_lineups", "benches", ["teams", "players", "staff"], "players");
 */
export function sectionError(parser: string, name: string, valid: readonly string[], dflt: string | null): Error {
  return new Error(
    `${parser}: unknown section '${name}'. Choose one of ${JSON.stringify(valid)}` +
      (dflt === null ? " (default: every table, as a dict)." : ` (default '${dflt}').`)
  );
}

/**
 * Select one sub-frame of a multi-table parse. `section` omitted -> the parser's
 * default (for a dict-default parser, every table). An unknown name throws,
 * listing the valid ones.
 *
 * @param parser - A key of {@link MULTI_TABLE_SECTIONS} (the spec is read without a guard, so
 *   an unregistered name fails on `spec.default`).
 * @param tables - The parser's full output, every sub-frame keyed by name.
 * @param section - The sub-frame to return; omitted = the spec's `default`.
 * @returns The selected rows (the array held in `tables`, not a copy).
 * @throws Error when `section` (or the default) is not both present in `tables` and listed in
 *   the spec's `sections` — see {@link sectionError}. For a dict-default parser called without
 *   `section` the name is `""`, which throws as well; its callers return the whole dict instead.
 * @example
 * const players = pickSection("parse_mls_match", parse_mls_match_tables(raw), "players");
 */
export function pickSection(parser: string, tables: Record<string, Row[]>, section?: string): Row[] {
  const spec = MULTI_TABLE_SECTIONS[parser];
  const name = section ?? spec.default ?? "";
  const valid = spec.sections ?? Object.keys(tables);
  if (!Object.prototype.hasOwnProperty.call(tables, name) || !valid.includes(name)) {
    throw sectionError(parser, name, valid, spec.default);
  }
  return tables[name];
}
