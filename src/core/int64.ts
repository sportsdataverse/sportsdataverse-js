// The v4 integer-id rules, one implementation for every surface that returns an
// id: the release loaders (src/core/releases.ts), the producers (src/producers/*),
// the parsers (src/parsers/*), the HockeyTech analytics wrappers
// (src/analytics/hockeytech_family.ts) and the parity harness
// (test/helpers/parity.mjs). Browser-safe (the parsers run in the docs
// playground): no node: imports. The id-NAME predicate itself lives in
// ./id_columns.ts, which the codegen type generator also loads (one predicate).
//
// - Owner decision 2026-10-05 12:55 (supersedes 09:53): a column whose NAME marks
//   an id (`isIdColumn`) and that holds integers is ALWAYS decimal strings, in
//   every row, call and season, whatever the width it was stored with (INT32,
//   INT64, or a DOUBLE / JSON number holding integer ids, e.g. pandas' Float64 of
//   an id column with nulls) and whatever the magnitude. One type per column, so
//   ids join across seasons and across surfaces (a release's INT32 `game_id`
//   matches another release's INT64 one), exact past 2^53, JSON-safe, and `===` /
//   `Set` / `Map` work.
// - Any other integer column: `number` when every value is a safe integer, else
//   `BigInt` (exact) and ONE warning per (surface, column) per process, with the
//   code {@link INT64_WARNING_CODE}.

export { MLBAM_ID_COLUMNS, isIdColumn } from "./id_columns.js";
import { isIdColumn } from "./id_columns.js";

/**
 * Warning code of the integer-column warnings (`process.on('warning')` can filter on it).
 *
 * @remarks `"SDV_INT64"`; {@link warnBigint} passes it as `{ code }` to `process.emitWarning`.
 */
export const INT64_WARNING_CODE = "SDV_INT64";

/**
 * One column of cells, read and written by index (row objects or a column array).
 *
 * @remarks The abstraction {@link idsToStrings} works over; {@link rowCells} builds one over
 *   row objects, a column array can implement it directly.
 */
export interface Cells {
  /** Number of cells (rows). */
  n: number;
  /** The value at row `i` (`undefined` when the row lacks the column). */
  get(i: number): unknown;
  /** Write `v` at row `i`; an implementation may ignore rows that lack the column. */
  set(i: number, v: unknown): void;
}

/**
 * Row objects' column `col` as {@link Cells}; a row without the key is left without it.
 *
 * @param rows - Row objects; mutated through the returned `set`.
 * @param col - The column (object key) to expose.
 * @returns A {@link Cells} view: `n = rows.length`, `get` reads `rows[i][col]`, `set` writes
 *   it only when `col in rows[i]` (so a missing key is never created).
 * @remarks A live view, not a copy: writes go straight to `rows`.
 * @example
 * ```ts
 * import { rowCells, idsToStrings } from "./int64.js";
 * const rows = [{ id: 401585607 }, { id: null }, { other: 1 }];
 * idsToStrings(rowCells(rows, "id")); // "strings"
 * rows; // [{ id: "401585607" }, { id: null }, { other: 1 }]
 * ```
 */
export function rowCells(rows: Record<string, unknown>[], col: string): Cells {
  return {
    n: rows.length,
    get: (i) => rows[i][col],
    set: (i, v) => {
      if (col in rows[i]) rows[i][col] = v;
    },
  };
}

/** Is `v` an integer that converts to an EXACT decimal string (a bigint, or a safe-integer number)? */
const exactInt = (v: unknown): v is bigint | number =>
  typeof v === "bigint" || (typeof v === "number" && Number.isSafeInteger(v));

/**
 * What {@link idsToStrings} did: `"strings"` (converted), `"unchanged"` (no
 * integer to convert: strings / nulls only), `"not-integers"` (left as read).
 *
 * @remarks `"not-integers"` is the case a surface should report with
 *   {@link notIntegerIdWarning}.
 */
export type IdColumnResult = "strings" | "unchanged" | "not-integers";

/**
 * The id rule over one column, in place. When every non-null cell is a decimal
 * string, an integer that converts exactly (a bigint, or a safe-integer number:
 * INT32, INT64, or a DOUBLE holding `123` -> `"123"`, never `"123.0"`; `-0` ->
 * `"0"`), a NaN (a missing DOUBLE -> `null`), or a list of those, every integer
 * becomes its decimal string. Otherwise the column is left as read (a NaN still
 * becomes `null`) and the result is `"not-integers"`: a fraction, a boolean, an
 * object, or a number past 2^53 (a double there is not an exact id, so a string
 * of it would be a wrong id).
 *
 * @param c - The column, e.g. {@link rowCells}`(rows, col)`; **mutated in place** through
 *   `c.set`. Lists are converted element-wise (recursively).
 * @returns `"strings"` when the integers were converted, `"unchanged"` when there were only
 *   strings / nulls / empty lists, `"not-integers"` when a cell blocked conversion.
 * @remarks All-or-nothing per column: one fraction leaves every integer in the column as read.
 *   NaN becomes `null` in both the `"strings"` and `"not-integers"` cases. `null`, `undefined`
 *   and strings are never written back.
 * @example
 * ```ts
 * import { rowCells, idsToStrings } from "./int64.js";
 * const mixed = [{ game_id: 401585607 }, { game_id: 401628579n }, { game_id: 39.0 }, { game_id: NaN }];
 * idsToStrings(rowCells(mixed, "game_id")); // "strings"
 * mixed.map((r) => r.game_id);              // ["401585607", "401628579", "39", null]
 * idsToStrings(rowCells([{ id: 1.5 }, { id: 2 }], "id")); // "not-integers" (2 stays a number)
 * ```
 */
export function idsToStrings(c: Cells): IdColumnResult {
  let convert = false;
  const ok = (v: unknown): boolean => {
    if (v === null || v === undefined || typeof v === "string") return true;
    if (Array.isArray(v)) return v.every(ok);
    if (typeof v === "number" && Number.isNaN(v)) return (convert = true);
    if (!exactInt(v)) return false;
    return (convert = true);
  };
  let integers = true;
  for (let i = 0; i < c.n && integers; i++) integers = ok(c.get(i));
  if (integers && !convert) return "unchanged";
  // A NaN is a missing value either way; integers become strings only when every cell allows it.
  const str = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(str)
      : typeof v === "number" && Number.isNaN(v)
        ? null
        : integers && (typeof v === "bigint" || typeof v === "number")
          ? String(v)
          : v;
  for (let i = 0; i < c.n; i++) {
    const v = c.get(i);
    if (v !== null && v !== undefined && typeof v !== "string") c.set(i, str(v));
  }
  return integers ? "strings" : "not-integers";
}

/**
 * The id rule over a parser's or producer's rows, in place: every id column of
 * integers becomes decimal strings ({@link idsToStrings}). A JSON integer is an
 * Int64 in sdv-py (an id column with nulls is Float64 there, a pandas artifact);
 * either way it is a string here.
 *
 * @param rows - Row objects; **mutated in place**. Id columns are every key of any row for
 *   which {@link isIdColumn} is `true`.
 * @returns The same `rows` array (for chaining), not a copy.
 * @remarks Non-id columns are untouched, so a non-id integer past 2^53 stays whatever the
 *   reader produced (see {@link warnBigint}). A `"not-integers"` id column is left as read
 *   silently here; surfaces emit {@link notIntegerIdWarning} themselves.
 * @example
 * ```ts
 * import { idColumnsToStrings } from "./int64.js";
 * idColumnsToStrings([{ team_id: 5, score: 3, name: "x" }, { team_id: 6, score: 4, name: "y" }]);
 * // [{ team_id: "5", score: 3, name: "x" }, { team_id: "6", score: 4, name: "y" }]
 * ```
 */
export function idColumnsToStrings<R extends Record<string, unknown>>(rows: R[]): R[] {
  const cols = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (isIdColumn(k)) cols.add(k);
  for (const col of cols) idsToStrings(rowCells(rows, col));
  return rows;
}

const warned = new Set<string>();

/**
 * Dedupe state of the warnings below: the `Set` of `(kind, surface, column)` keys already
 * warned this process. Tests `clear()` it to re-arm the once-per-process warnings.
 * @internal
 */
export const _int64Warned = warned;

const once = (key: string, message: string): string | undefined => {
  if (warned.has(key)) return undefined;
  warned.add(key);
  return message;
};

/**
 * The non-id BigInt warning message for (surface, column), or `undefined` when
 * this process already got it. The caller emits it with {@link INT64_WARNING_CODE}.
 *
 * @param surface - The surface name shown in the message (a loader / parser / producer name,
 *   e.g. `"load_x"` or `"Savant CSV"`).
 * @param column - The non-id column whose integers exceed `Number.MAX_SAFE_INTEGER`.
 * @returns The message `<surface>: column "<column>" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`
 *   the first time per (surface, column) per process; `undefined` after.
 * @remarks Pure apart from recording the key in {@link _int64Warned}; it emits nothing.
 *   {@link warnBigint} is the emitting wrapper.
 * @example
 * ```ts
 * import { bigintWarning } from "./int64.js";
 * bigintWarning("load_x", "games"); // 'load_x: column "games" holds integers beyond ...'
 * bigintWarning("load_x", "games"); // undefined (already warned)
 * ```
 */
export function bigintWarning(surface: string, column: string): string | undefined {
  return once(
    `bigint\u0000${surface}\u0000${column}`,
    `${surface}: column "${column}" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`
  );
}

/**
 * The warning for an id column that is not exact integers (see
 * {@link idsToStrings}), once per (surface, column) per process.
 *
 * @param surface - The surface name shown in the message.
 * @param column - The id column {@link idsToStrings} returned `"not-integers"` for.
 * @returns The message
 *   (`<surface>: id column "<column>" holds values that are not exact integers (...); left as read, not decimal strings`)
 *   the first time per (surface, column);
 *   `undefined` after.
 * @remarks Returns the text only; the caller emits it. Keyed separately from
 *   {@link bigintWarning}, so both can fire once for the same (surface, column).
 * @example
 * ```ts
 * import { notIntegerIdWarning } from "./int64.js";
 * notIntegerIdWarning("load_x", "games"); // 'load_x: id column "games" holds values ...'
 * notIntegerIdWarning("load_x", "games"); // undefined
 * ```
 */
export function notIntegerIdWarning(surface: string, column: string): string | undefined {
  return once(
    `id\u0000${surface}\u0000${column}`,
    `${surface}: id column "${column}" holds values that are not exact integers (a fraction, a number ` +
      `beyond Number.MAX_SAFE_INTEGER, a boolean or an object); left as read, not decimal strings`
  );
}

/**
 * {@link bigintWarning}, emitted: a process warning in Node, `console.warn` elsewhere (the playground).
 *
 * @param surface - The surface name shown in the message.
 * @param column - The non-id column holding integers beyond `Number.MAX_SAFE_INTEGER`.
 * @returns Nothing.
 * @remarks Once per (surface, column) per process (a repeat call is a no-op). In Node the
 *   warning carries `{ code: INT64_WARNING_CODE }` (`"SDV_INT64"`), so
 *   `process.on("warning", (w) => w.code === "SDV_INT64")` can filter it; where
 *   `process.emitWarning` is absent it falls back to `console.warn`.
 * @example
 * ```ts
 * import { warnBigint } from "./int64.js";
 * warnBigint("Savant CSV", "big"); // emits once
 * warnBigint("Savant CSV", "big"); // silent
 * ```
 */
export function warnBigint(surface: string, column: string): void {
  const message = bigintWarning(surface, column);
  if (message === undefined) return;
  const proc = (globalThis as { process?: { emitWarning?: (m: string, o: { code: string }) => void } }).process;
  if (proc?.emitWarning) proc.emitWarning(message, { code: INT64_WARNING_CODE });
  else console.warn(message);
}
