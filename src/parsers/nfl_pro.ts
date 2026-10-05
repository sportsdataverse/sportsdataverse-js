// Parser for the NFL Pro (Next Gen Stats) wrappers (`pro.nfl.com`
// `/api/secured/stats/*`). Faithful port of sdv-py's
// `sportsdataverse/nfl/nflpro_parsers.py` (`parse_nfl_pro_stats`).
//
// Every route returns the same envelope — request params echoed back beside one
// list of records — so one parser serves all 16; only the collection key changes
// (`passers`, `rushers`, `receivers`, `defenders`, `offense`, `defense`,
// `players`). Some echoes are lists themselves, so "the first list" is not a
// safe rule: known collection keys first, else the longest record list.

import { isPlainObject, underscore } from "./_normalize.js";

type Row = Record<string, any>;

/** Known record-collection keys, in py's preference order (`_COLLECTION_KEYS`). */
export const NFL_PRO_COLLECTION_KEYS = [
  "passers",
  "rushers",
  "receivers",
  "defenders",
  "offense",
  "defense",
  "players",
] as const;

/** A list this parser can build rows from: empty, or holding at least one object. */
function isRecordList(value: unknown): value is any[] {
  return Array.isArray(value) && (value.length === 0 || value.some(isPlainObject));
}

/** Keep only the object elements — one stray scalar must not lose the page. */
const dicts = (values: any[]): Row[] => values.filter(isPlainObject);

function records(payload: unknown): Row[] {
  if (Array.isArray(payload)) return isRecordList(payload) ? dicts(payload) : [];
  if (!isPlainObject(payload)) return [];
  const body = payload as Row;
  for (const key of NFL_PRO_COLLECTION_KEYS) if (isRecordList(body[key])) return dicts(body[key]);
  let best: any[] | undefined;
  for (const v of Object.values(body)) if (isRecordList(v) && (!best || v.length > best.length)) best = v;
  return best ? dicts(best) : [];
}

/** pandas `json_normalize(sep="_")` of one record: nested objects flattened, empty objects dropped. */
function flatten(obj: Row, prefix: string, out: Row): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject(v)) flatten(v, key, out);
    else out[key] = v;
  }
}

/**
 * Python `str()` of a cell, for a column pandas stringifies with
 * `astype(str)` because it holds a list / dict.
 *
 * ponytail: JSON can't tell `5` from `5.0`, so a float-valued integer prints
 * as `"5"` where py prints `"5.0"` — only in these list/dict columns.
 */
function pyStr(v: unknown, missing: boolean): string {
  if (missing) return "nan";
  const repr = (x: any): string => {
    if (x === null || x === undefined) return "None";
    if (typeof x === "boolean") return x ? "True" : "False";
    if (typeof x === "number") return Number.isFinite(x) ? String(x) : Number.isNaN(x) ? "nan" : x > 0 ? "inf" : "-inf";
    if (typeof x === "string") {
      const quote = x.includes("'") && !x.includes('"') ? '"' : "'";
      const body = x.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      return quote + (quote === "'" ? body.replace(/'/g, "\\'") : body) + quote;
    }
    if (Array.isArray(x)) return `[${x.map(repr).join(", ")}]`;
    return `{${Object.entries(x)
      .map(([k, val]) => `${repr(k)}: ${repr(val)}`)
      .join(", ")}}`;
  };
  return typeof v === "string" ? v : repr(v);
}

/**
 * Turn an NFL Pro stats payload into one row per player, team or player-week.
 *
 * Nested objects flatten to `a_b` columns (`json_normalize(sep="_")`), keys are
 * snake-cased with py's `underscore`, two spellings of one field (`nflId` +
 * `nfl_id`) keep the first, and a column holding lists / dicts is stringified.
 * An empty or malformed payload returns `[]`.
 */
export function parse_nfl_pro_stats(payload: any): Row[] {
  const recs = records(payload);
  if (!recs.length) return [];
  const flat = recs.map((r) => {
    const o: Row = {};
    flatten(r, "", o);
    return o;
  });
  // DataFrame(list of dicts): union of keys in first-seen order
  const raw: string[] = [];
  const seen = new Set<string>();
  for (const r of flat) for (const k of Object.keys(r)) if (!seen.has(k) && seen.add(k)) raw.push(k);
  // snake-case; a duplicate after snake-casing keeps the first
  const keep: Array<[string, string]> = [];
  const names = new Set<string>();
  for (const k of raw) {
    const name = underscore(String(k));
    if (names.has(name)) continue;
    names.add(name);
    keep.push([k, name]);
  }
  const stringify = new Set(
    keep.filter(([k]) => flat.some((r) => r[k] !== null && typeof r[k] === "object")).map(([k]) => k)
  );
  return flat.map((r) => {
    const o: Row = {};
    for (const [k, name] of keep) {
      const missing = !(k in r);
      o[name] = stringify.has(k) ? pyStr(r[k], missing) : missing || r[k] === undefined ? null : r[k];
    }
    return o;
  });
}
