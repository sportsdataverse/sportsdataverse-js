// Yahoo Sports "shangrila" stats-graph API
// (graphite-secure.sports.yahoo.com/v1/query/shangrila) flat-API parsers: a
// port of sdv-py's `sportsdataverse/yahoo/yahoo_shangrila_parsers.py`
// (`parse_yahoo_shangrila` -> `parse_yahoo_list`, `parse_yahoo_shangrila_tables`
// -> `parse_yahoo_stats`), verified cell by cell against its output on the
// committed captures (test/parsers/parity.test.js). Same contract as
// src/parsers/cbs.ts / fox.ts / mlb.ts:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - columns are `pandas.json_normalize(sep="_")`-flattened and snake_cased
//     exactly as sdv-py names them (`pyFrame`).
//
// Every shangrila body is the GraphQL envelope `{ data, extensions }`. The rows
// sit under one or more collections of `data`, sometimes behind single-key
// wrapper levels (`leagues: [{ leaders: [row, ...] }]`); `descend` walks those
// levels the way sdv-py's `_descend` does. sdv-py returns ONE frame per `data`
// collection for the multi-table queries (`statTypes` + `leagues`); a JS parser
// returns one frame, so `parse_yahoo_stats` returns the `leagues` frame (the
// leaders / team lines callers want) and `parse_yahoo_list` the first.

import { idColumnsToStrings } from "../core/int64.js";
import type { ParserRow } from "../core/types.js";
import { isPlainObject, underscore } from "./_normalize.js";

/**
 * Python's `str()` of a JSON number in a mixed (pandas object) column.
 * Booleans are never passed here: they stay native JS booleans even where pandas
 * would print "True" / "False" (a bool column with a null in it), the same
 * precedent as parse_on3_rdb / parse_cbs_standings; the parity harness exempts it.
 */
function pyStr(v: unknown): string {
  // ponytail: a float with no fraction prints "1.0" in Python, "1" here; JSON
  // can't tell 1 from 1.0 and no committed capture mixes such a float with text.
  return String(v);
}

/** sdv-py's column rule: non-word runs -> `_`, `underscore`, strip `_`. */
const pyName = (key: string): string =>
  underscore(key.replace(/[^\p{L}\p{N}_]+/gu, "_")).replace(/^_+|_+$/g, "");

/**
 * `pandas.json_normalize(record, sep="_")`: nested objects join their keys with
 * `_` (an empty object contributes nothing); lists and scalars are cells. Top-level
 * scalars come before the flattened objects, as pandas orders them.
 */
function flattenRecord(rec: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const nested: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) (isPlainObject(v) ? nested : out)[k] = v;
  const walk = (obj: Record<string, unknown>, prefix: string): void => {
    for (const [k, v] of Object.entries(obj)) {
      const key = `${prefix}_${k}`;
      if (isPlainObject(v)) walk(v, key);
      else out[key] = v;
    }
  };
  for (const [k, v] of Object.entries(nested)) walk(v as Record<string, unknown>, k);
  return out;
}

/**
 * sdv-py's `_rows_to_frame`: `json_normalize(sep="_")`, columns named by `pyName`
 * with `_2` / `_3` suffixes on collision, pandas' dtype inference (a column of
 * numbers, of strings or of booleans keeps its values; any other mix is an
 * object column whose list / object cells are JSON-encoded and whose numbers
 * are `str()`-ed — booleans stay native, see pyStr), then id columns (`isIdColumn`) of
 * integers as decimal strings. Rows come back rectangular (every column on every
 * row, `null` where the record had nothing). `[]` for no rows.
 * @internal shared with src/parsers/yahoo_scores.ts
 */
export function pyFrame(rows: unknown[]): ParserRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (!rows.some(isPlainObject)) {
    return rows.map((r) => ({ value: r === null || r === undefined ? null : pyStr(r) }));
  }
  const flat = rows.map((r) => (isPlainObject(r) ? flattenRecord(r) : { value: r }));
  // raw joined key -> py column name, in order of first appearance
  const names = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const r of flat) {
    for (const k of Object.keys(r)) {
      if (names.has(k)) continue;
      let name = pyName(k);
      const n = (seen.get(name) ?? 0) + 1;
      seen.set(name, n);
      if (n > 1) name = `${name}_${n}`;
      names.set(k, name);
    }
  }
  const cols = [...new Set(names.values())];
  const out: Record<string, unknown>[] = flat.map((r) => {
    const o: Record<string, unknown> = {};
    for (const c of cols) o[c] = null;
    for (const [k, v] of Object.entries(r)) o[names.get(k) as string] = v === undefined ? null : v;
    return o;
  });
  for (const c of cols) {
    const vals = out.map((r) => r[c]).filter((v) => v !== null);
    const kinds = new Set(vals.map((v) => (typeof v === "object" ? "nested" : typeof v)));
    const native =
      kinds.size === 0 ||
      (kinds.size === 1 && (kinds.has("number") || kinds.has("string") || kinds.has("boolean")));
    if (native) continue;
    for (const r of out) {
      const v = r[c];
      if (v === null || typeof v === "string" || typeof v === "boolean") continue;
      r[c] = typeof v === "object" ? JSON.stringify(v) : pyStr(v);
    }
  }
  return idColumnsToStrings(out as ParserRow[]);
}

/**
 * sdv-py's `_descend`: walk down single-key wrapper levels to the row records.
 * A list whose elements are all the SAME single-key object (one league, or
 * several) descends into those values; an object with one collection-valued key
 * descends into it; any other object is one row; anything else is no rows.
 */
function descend(node: unknown): unknown[] {
  for (;;) {
    if (Array.isArray(node)) {
      const dicts = node.filter(isPlainObject);
      if (node.length && dicts.length === node.length && dicts.every((d) => Object.keys(d).length === 1)) {
        const keys = new Set(dicts.map((d) => Object.keys(d)[0]));
        if (keys.size === 1) {
          const inner = dicts.map((d) => d[Object.keys(d)[0]]);
          if (inner.every((v) => Array.isArray(v) || isPlainObject(v))) {
            node = inner.flatMap((v) => (Array.isArray(v) ? v : [v]));
            continue;
          }
        }
      }
      return node;
    }
    if (isPlainObject(node)) {
      const keys = Object.keys(node);
      if (keys.length === 1 && (Array.isArray(node[keys[0]]) || isPlainObject(node[keys[0]]))) {
        node = node[keys[0]];
        continue;
      }
      return keys.length ? [node] : [];
    }
    return [];
  }
}

/** sdv-py's `_tables`: `underscore(data key) -> rows` per `data` collection, in payload order. */
function tables(raw: unknown): Map<string, ParserRow[]> {
  const out = new Map<string, ParserRow[]>();
  const data = isPlainObject(raw) ? raw.data : undefined;
  if (!isPlainObject(data)) return out;
  for (const [key, value] of Object.entries(data)) out.set(underscore(key), pyFrame(descend(value)));
  return out;
}

/**
 * Generic shangrila parser (the DEFAULT for most endpoints) = sdv-py's
 * `parse_yahoo_shangrila`: the rows of the payload's FIRST `data` collection,
 * single-key wrappers descended (`leagues: [{ leaders: [...] }]` -> the leaders).
 * Returns `[]` for empty / malformed payloads (no `data` object, or a first
 * collection with no records).
 */
export function parse_yahoo_list(raw: unknown): ParserRow[] {
  const first = tables(raw).values().next();
  return first.done ? [] : first.value;
}

/**
 * Stats-query parser (seasonStats* / seasonTeamStats* / leagueStats* /
 * teamStatsLeadersV2): sdv-py's `parse_yahoo_shangrila_tables` returns one frame
 * per `data` collection; this returns its `leagues` frame (the leaders / team
 * stat lines, one row per entry, the per-entry `stats` list JSON-encoded) when it
 * has rows, else the first collection that has rows (`teams` for
 * teamStatsLeadersV2, whose `leagues` is empty). Returns `[]` when no collection
 * has rows or the payload is malformed.
 */
export function parse_yahoo_stats(raw: unknown): ParserRow[] {
  const t = tables(raw);
  const leagues = t.get("leagues");
  if (leagues?.length) return leagues;
  return [...t.values()].find((rows) => rows.length) ?? [];
}

/**
 * Endpoint (parser name) -> parser. Mirrors the Python-side registries; keyed by
 * the parser function name the YAML references. Registered in
 * src/parsers/_registry.ts.
 */
export const YAHOO_PARSERS = {
  parse_yahoo_list,
  parse_yahoo_stats,
};
