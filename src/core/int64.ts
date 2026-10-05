// The v4 INT64 rules, one implementation for every surface that decodes a 64-bit
// integer: the release loaders (src/core/releases.ts), the producers
// (src/producers/*), the parsers (src/parsers/*) and the parity harness
// (test/helpers/parity.mjs). Browser-safe (the parsers run in the docs
// playground): no node: imports.
//
// - Owner decision 2026-10-05: a column whose NAME marks an id (`isIdColumn`) and
//   that holds 64-bit integers is ALWAYS decimal strings, in every row and every
//   call, whatever the magnitude: one type per column, exact, JSON-safe, and
//   `===` / `Set` work. ESPN play ids are 12-13 digits in old seasons and 18 in
//   new ones, so a number-if-safe rule gave one column two types.
// - Any other INT64 column: `number` when every value is a safe integer, else
//   `BigInt` (exact) and ONE warning per (surface, column) per process, with the
//   code {@link INT64_WARNING_CODE}.

/**
 * Savant columns holding MLBAM integer ids (players, game): sdv-py's
 * `_MLBAM_ID_COLUMNS` at the vendor pin. Their names do not end in `_id`, so the
 * id rule lists them.
 */
export const MLBAM_ID_COLUMNS: readonly string[] = [
  "batter", "pitcher", "on_1b", "on_2b", "on_3b",
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((i) => `fielder_${i}`),
  "game_pk",
];
const MLBAM = new Set(MLBAM_ID_COLUMNS);

/** A join-key column: `id`, `*_id`, `*_ids`, `*_pk`, or an MLBAM id column (`batter`, `on_1b`, ...). */
export function isIdColumn(name: string): boolean {
  return name === "id" || /_(ids?|pk)$/.test(name) || MLBAM.has(name);
}

/** Warning code of the non-id BigInt warning (`process.on('warning')` can filter on it). */
export const INT64_WARNING_CODE = "SDV_INT64";

/** One column of cells, read and written by index (row objects or a column array). */
export interface Cells {
  n: number;
  get(i: number): unknown;
  set(i: number, v: unknown): void;
}

/** Row objects' column `col`; a row without the key is left without it. */
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
 * The id rule over one column, in place: when every non-null cell is a decimal
 * string, an integer that converts exactly (a bigint or a safe-integer number), or
 * a list of those, every integer becomes its decimal string (`-0` -> `"0"`).
 * Otherwise the column is left as read and `false` is returned: a fraction,
 * boolean, object, or a number past 2^53 (already rounded by whatever parsed it;
 * a string from it would be a wrong id). `requireBigint`: act only when the
 * column holds a bigint (the release loaders, where hyparquet's bigint is the
 * INT64 marker and INT32 / DOUBLE id columns stay numbers).
 */
export function idsToStrings(c: Cells, requireBigint = false): boolean {
  let ints = false;
  let big = false;
  const ok = (v: unknown): boolean => {
    if (v === null || v === undefined || typeof v === "string") return true;
    if (Array.isArray(v)) return v.every(ok);
    if (!exactInt(v)) return false;
    ints = true;
    if (typeof v === "bigint") big = true;
    return true;
  };
  for (let i = 0; i < c.n; i++) if (!ok(c.get(i))) return false;
  if (!ints || (requireBigint && !big)) return false;
  const str = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(str) : typeof v === "bigint" || typeof v === "number" ? String(v) : v;
  for (let i = 0; i < c.n; i++) {
    const v = c.get(i);
    if (v !== null && v !== undefined && typeof v !== "string") c.set(i, str(v));
  }
  return true;
}

/**
 * The id rule over a parser's rows, in place: every id column holding integers
 * becomes decimal strings ({@link idsToStrings}). A JSON integer is an Int64 in
 * sdv-py (pandas / polars type Python ints Int64; an id column with nulls is
 * Float64 there, a pandas artifact, and is a string here too).
 */
export function idColumnsToStrings<R extends Record<string, unknown>>(rows: R[]): R[] {
  const cols = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (isIdColumn(k)) cols.add(k);
  for (const col of cols) idsToStrings(rowCells(rows, col));
  return rows;
}

const warned = new Set<string>();

/**
 * Dedupe state of {@link bigintWarning}.
 * @internal
 */
export const _int64Warned = warned;

/**
 * The non-id BigInt warning message for (surface, column), or `undefined` when
 * this process already got it. The caller emits it with {@link INT64_WARNING_CODE}.
 */
export function bigintWarning(surface: string, column: string): string | undefined {
  const key = `${surface}\u0000${column}`;
  if (warned.has(key)) return undefined;
  warned.add(key);
  return `${surface}: column "${column}" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`;
}

/** {@link bigintWarning}, emitted: a process warning in Node, `console.warn` elsewhere (the playground). */
export function warnBigint(surface: string, column: string): void {
  const message = bigintWarning(surface, column);
  if (message === undefined) return;
  const proc = (globalThis as { process?: { emitWarning?: (m: string, o: { code: string }) => void } }).process;
  if (proc?.emitWarning) proc.emitWarning(message, { code: INT64_WARNING_CODE });
  else console.warn(message);
}
