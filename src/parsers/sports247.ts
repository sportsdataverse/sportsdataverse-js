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

import { normalize } from "./_normalize.js";

type Row = Record<string, any>;

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
const warnedBigInt = new Set<string>();

/** Browser-safe one-line warning (the parsers also run in the docs playground). */
function warn(message: string): void {
  const proc = (globalThis as { process?: { emitWarning?: (m: string) => void } }).process;
  if (proc?.emitWarning) proc.emitWarning(message);
  else console.warn(message);
}

/**
 * sdv-py `_cast_numeric_strings`: a column whose non-null values are all
 * strings is cast to integers when every value parses as one, else to floats
 * when every value parses as one, else left alone (`"6-5"`, `"True"` stay
 * strings). Integer columns stay plain `number`s when every value is a safe
 * integer; otherwise the column becomes `BigInt` (exact) with one warning.
 */
function castNumericStrings(rows: Row[]): Row[] {
  const columns = new Set(rows.flatMap((r) => Object.keys(r)));
  for (const col of columns) {
    const present = rows.filter((r) => r[col] !== undefined && r[col] !== null);
    if (!present.length || !present.every((r) => typeof r[col] === "string")) continue;
    const values = present.map((r) => (r[col] as string));
    if (values.every((v) => INT_RE.test(v))) {
      const nums = values.map(Number);
      if (nums.every(Number.isSafeInteger)) {
        present.forEach((r, i) => (r[col] = nums[i]));
      } else {
        present.forEach((r, i) => (r[col] = BigInt(values[i])));
        if (!warnedBigInt.has(col)) {
          warnedBigInt.add(col);
          warn(`sports247_site_pages: column "${col}" holds integers beyond 2^53; kept as BigInt.`);
        }
      }
    } else if (values.every((v) => FLOAT_RE.test(v))) {
      present.forEach((r, i) => (r[col] = Number(values[i])));
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
