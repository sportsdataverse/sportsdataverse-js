// 247Sports parsers for the vendored `sports247` (RDB, ipa.247sports.com) and
// `sports247_site_pages` (247sports.com `*.json` page models) flat families.
//
// Faithful port of sdv-py `sportsdataverse/cfb/sports247_parsers.py` and
// `sports247_site_pages_parsers.py` (pin 719de79): same row resolution, same
// `_`-joined flattening and snake_case columns, same lossless numeric-string
// casting. sdv-py's RDB returns schemas describe these outputs (`sports247` is
// `schema_compatible` in tools/codegen/vendor.yaml); its site-page schemas at
// the pin are stale on TYPES, so they are not attached. JS-wide conventions apply
// where pandas has no JS analogue: array cells are JSON.stringify'd (pandas
// `str()`s them), non-string JSON scalars keep their native type, and a row
// carries only the keys its payload had (no null-filled union of columns).

import { isIdColumn, warnBigint } from "../core/int64.js";
import { normalize } from "./_normalize.js";

import type { ParserRow as Row } from "../core/types.js";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** RDB envelope keys holding the row list, in sdv-py's resolution order. */
const LIST_KEYS = ["players", "results", "rankings", "list", "items"];

/** sdv-py `_extract_rows`: bare array / `{<list key>: [...]}` envelope / one flat object. */
function extractRdbRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isPlainObject(raw)) {
    for (const k of LIST_KEYS) {
      if (Array.isArray(raw[k])) return raw[k] as unknown[];
    }
    // A single flat object (e.g. bettinginfo) is one row; a pagination/meta-only
    // object (nothing but nested dicts/lists) is zero rows.
    const values = Object.values(raw);
    if (values.some((v) => v === null || typeof v !== "object")) return [raw];
  }
  return [];
}

/**
 * Parse any 247Sports RDB payload into tidy rows: resolves the row list from a
 * bare array, a `{players|results|rankings|list|items: [...]}` envelope, or a
 * single flat object, flattens nested objects with `_`, and snake_cases the
 * keys. Scalar arrays (e.g. `sports/{k}/year`) land under a `value` column.
 * Empty / malformed payloads return `[]`.
 */
export function parse_sports247_result_set(raw: unknown): Row[] {
  const rows = extractRdbRows(raw);
  if (!rows.length) return [];
  // sdv-py keys the scalar-vs-object decision off the first row.
  return normalize(isPlainObject(rows[0]) ? rows : rows.map((value) => ({ value })));
}

/** RDB teams directory (bare array) — alias of {@link parse_sports247_result_set}. */
export function parse_sports247_teams(raw: unknown): Row[] {
  return parse_sports247_result_set(raw);
}

/** RDB institution rankings (`{pagination, list}`) — alias of {@link parse_sports247_result_set}. */
export function parse_sports247_institution_rankings(raw: unknown): Row[] {
  return parse_sports247_result_set(raw);
}

const INT_RE = /^[+-]?\d+$/;
// ponytail: plain decimal / exponent forms only; polars also parses "inf"/"nan",
// which never appear in these payloads — add them if one does.
const FLOAT_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
// sdv-py `_codegen_runtime._ZERO_PADDED`: a leading zero before a digit, which a numeric cast would lose.
const ZERO_PADDED_RE = /^\s*[+-]?0\d/;
// sdv-py `_TEXT_SUFFIXES`: column-name endings that are labels, not quantities.
const TEXT_SUFFIXES = ["jersey", "color", "postal_code"];
/**
 * sdv-py `_cast_numeric_strings`: a column whose non-null values are all
 * strings is cast to integers when every value parses as one, else to floats
 * when every value parses as one, else left alone (`"6-5"`, `"True"` stay
 * strings). An integer id column (`isIdColumn`; Int64 in sdv-py) is its
 * canonical decimal strings (`"007"` -> `"7"`, the v4 id rule); any other
 * integer column stays plain `number`s when every value is a safe integer,
 * else becomes `BigInt` (exact) with one warning per column per process.
 * As sdv-py since #928: a zero-padded column (`"000000"`, `"007"`) stays text,
 * a jersey / colour / postal-code column is always text, and a latitude /
 * longitude pair that is exactly (0, 0), 247's no-location sentinel, is null.
 */
function castNumericStrings(rows: Row[]): Row[] {
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  for (const col of columns) {
    const present = rows.filter((r) => r[col] !== undefined && r[col] !== null);
    if (!present.length) continue;
    // sdv-py #928: a jersey, colour or postal code is a label, not a quantity: it stays text whatever it holds,
    // and one 247 ships as a JSON number becomes text from the integer ("7", never "7.0").
    if (TEXT_SUFFIXES.some((s) => col.endsWith(s))) {
      for (const r of present) if (typeof r[col] === "number") r[col] = String(r[col]);
      continue;
    }
    if (!present.every((r) => typeof r[col] === "string")) continue;
    const values = present.map((r) => (r[col] as string));
    // "000000", "007": a cast would lose the zeros. An id column keeps the v4 id rule instead ("007" -> "7"):
    // sdv-py's ids arrive Int64 from json_normalize and never reach its zero-padded check.
    if (!isIdColumn(col) && values.some((v) => ZERO_PADDED_RE.test(v))) continue;
    if (values.every((v) => INT_RE.test(v))) {
      const nums = values.map(Number);
      if (isIdColumn(col)) {
        present.forEach((r, i) => (r[col] = BigInt(values[i]).toString()));
      } else if (nums.every(Number.isSafeInteger)) {
        present.forEach((r, i) => (r[col] = nums[i]));
      } else {
        present.forEach((r, i) => (r[col] = BigInt(values[i])));
        warnBigint("sports247_site_pages", col);
      }
    } else if (values.every((v) => FLOAT_RE.test(v))) {
      present.forEach((r, i) => (r[col] = Number(values[i])));
    }
  }
  // 247 writes "0.000000" for a location it does not know: null a pair that is exactly (0, 0), which is no
  // campus, but keep a lone 0 (the equator, the Greenwich meridian). sdv-py #928 (R48b-5).
  for (const lat of [...columns].filter((c) => c.endsWith("latitude"))) {
    const lon = `${lat.slice(0, -"latitude".length)}longitude`;
    if (!columns.has(lon)) continue;
    for (const r of rows)
      if (r[lat] === 0 && r[lon] === 0) {
        r[lat] = null;
        r[lon] = null;
      }
  }
  return rows;
}

/**
 * Parse any 247sports.com page-model payload (one detail object, or an array
 * of them) into tidy rows: flattens inline sub-objects (`Recruit.Player` ->
 * `player_*`), keeps bare integer foreign keys as-is (not traversed — walk each
 * through its own `.json` sub-route), snake_cases the keys, then losslessly
 * casts string-numeric columns (`"0.9421"`, `"12"`) to numbers. Empty /
 * malformed payloads return `[]`.
 */
export function parse_sports247_site_page(raw: unknown): Row[] {
  const rows = Array.isArray(raw)
    ? raw.filter((r) => isPlainObject(r) && Object.keys(r).length > 0)
    : isPlainObject(raw) && Object.keys(raw).length > 0
      ? [raw]
      : [];
  if (!rows.length) return [];
  return castNumericStrings(normalize(rows));
}

/** Parser name (as the vendored YAML references it) -> parser. */
export const SPORTS247_PARSERS = {
  parse_sports247_result_set,
  parse_sports247_teams,
  parse_sports247_institution_rankings,
  parse_sports247_site_page,
};
