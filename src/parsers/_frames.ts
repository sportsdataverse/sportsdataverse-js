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
//   - with `ids: true` every `id` / `*_id` / `*_ids` column is pinned to a string
//     (a whole-number float is stringified as `"123"`, never `"123.0"`);
//   - a bare scalar array becomes a single `value` column of strings;
//   - every row carries every column (missing -> null), in first-seen order.
//
// Unlike pandas, a JS number stays a number: where Python's object-dtype
// coercion turns a *mixed-type* column into strings, the JS cell keeps its
// native value.

/**
 * sdv-py `dl_utils.underscore`, verbatim: split capital runs and camel humps,
 * `-` -> `_`, lower-case. Unlike `snakeCase` it keeps a leading `_` and spaces,
 * so column names match the sdv-py frames exactly.
 */
export function pyUnderscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

/** Python `json.dumps` text for a JSON value: ", " and ": " separators, non-ASCII as \uXXXX. */
export function pyJson(v: any): string {
  return JSON.stringify(v)
    .replace(/("(?:[^"\\]|\\.)*")|([,:])/g, (_m, str?: string, sep?: string) =>
      str !== undefined ? str : `${sep} `
    )
    .replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export type Row = Record<string, any>;

/** Is `v` a plain object (not null, not an array)? */
export function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** `id`, `*_id`, `*_ids`: a join-key column that must stay a string. */
export function isIdName(name: string): boolean {
  return name === "id" || name.endsWith("_id") || name.endsWith("_ids");
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

export interface RowsToFrameOptions {
  /** Pin `id` / `*_id` / `*_ids` columns to strings (the soccer providers). */
  ids?: boolean;
  /** Drop `null` entries before flattening (the soccer providers); on3 keeps them. */
  dropNull?: boolean;
}

/** Flatten a list of JSON records into rectangular, snake_cased rows. `[]` for no input. */
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

  return records.map((pairs) => {
    const row: Row = {};
    for (const c of columns) row[c] = null;
    for (const [path, v] of pairs) {
      const name = finalName.get(path)!;
      let cell = v === undefined ? null : v;
      if (opts.ids && isIdName(name)) cell = idString(cell);
      else if (Array.isArray(cell) || isPlainObject(cell)) cell = pyJson(cell);
      row[name] = cell;
    }
    return row;
  });
}

/** A JSON body as a row list: a list as-is, a non-empty object as one row, else `[]`. */
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
}

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
};

/** The error for a `section` the parser does not have, listing the valid names. */
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
