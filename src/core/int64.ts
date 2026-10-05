// The v4 integer-id rules, one implementation for every surface that returns an
// id: the release loaders (src/core/releases.ts), the producers (src/producers/*),
// the parsers (src/parsers/*), the HockeyTech analytics wrappers
// (src/analytics/hockeytech_family.ts) and the parity harness
// (test/helpers/parity.mjs). Browser-safe (the parsers run in the docs
// playground): no node: imports.
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
/**
 * Whole column names that are ids but fit no pattern: the MLBAM ids, and the
 * stats.nba.com video playlist's `hid` / `vid` (home / visitor team id: 1610612744 /
 * 1610612747 in the committed videodetailsasset capture, the payload's own TeamID).
 */
const EXACT_IDS = new Set([...MLBAM_ID_COLUMNS, "hid", "vid"]);

/**
 * One name segment that marks an id: `id`; `*_id`, `*_ids`; a numbered id
 * (`athlete_id_1`, `sack_player_id2`, `team_id_247`); `id_play` / `id_drive`;
 * `*_id_started` / `*_id_ended` (`drive_play_id_started`); stats.nba.com's
 * underscore-less `teamid` / `personid` / `playerid` / `matchupid`
 * (`hometeam_teamid`, `gameleaders_homeleaders_personid`); camelCase `…Id` / `…Ids`
 * (`playerId`, `homeTeamId`). Lower-case `id` must stand alone or touch `_`, and
 * camelCase needs the capital `I`, so words like valid, paid, void, idle, Idaho,
 * width, event_idx never match. Only listed words may follow `id_` / `_id_`: the
 * columns `team_id_source` ("espn"), `*_sportec_id_overwrite` (a flag) and
 * `player_id_list` (a joined list) are not ids. `_pk` is not a suffix rule (only
 * `game_pk` is an id; Savant's `n_pk` is a pickoff count).
 */
const ID_SEGMENT =
  /^id$|_ids?$|_id\d+$|_id_(\d+|started|ended)$|^id_(play|drive)$|(team|person|player|matchup)id$|[a-z0-9]Ids?$/;

/**
 * A join-key column: its last dotted segment marks an id (`id`, `*_id`, `*_ids`,
 * `athlete_id_1`, `id_play`, `drive_play_id_started`, `hometeam_teamid`,
 * `playerId`, `homeTeamId`; dotted `start.team.id`), or it is a listed id column
 * (MLBAM: `batter`, `on_1b`, `game_pk`, ...; stats.nba.com `hid` / `vid`). The one
 * id-name predicate: every surface and the parity harness use it.
 */
export function isIdColumn(name: string): boolean {
  return ID_SEGMENT.test(name.slice(name.lastIndexOf(".") + 1)) || EXACT_IDS.has(name);
}

/** Warning code of the integer-column warnings (`process.on('warning')` can filter on it). */
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
 * What {@link idsToStrings} did: `"strings"` (converted), `"unchanged"` (no
 * integer to convert: strings / nulls only), `"not-integers"` (left as read).
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
 */
export function idColumnsToStrings<R extends Record<string, unknown>>(rows: R[]): R[] {
  const cols = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (isIdColumn(k)) cols.add(k);
  for (const col of cols) idsToStrings(rowCells(rows, col));
  return rows;
}

const warned = new Set<string>();

/**
 * Dedupe state of the warnings below.
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
 */
export function notIntegerIdWarning(surface: string, column: string): string | undefined {
  return once(
    `id\u0000${surface}\u0000${column}`,
    `${surface}: id column "${column}" holds values that are not exact integers (a fraction, a number ` +
      `beyond Number.MAX_SAFE_INTEGER, a boolean or an object); left as read, not decimal strings`
  );
}

/** {@link bigintWarning}, emitted: a process warning in Node, `console.warn` elsewhere (the playground). */
export function warnBigint(surface: string, column: string): void {
  const message = bigintWarning(surface, column);
  if (message === undefined) return;
  const proc = (globalThis as { process?: { emitWarning?: (m: string, o: { code: string }) => void } }).process;
  if (proc?.emitWarning) proc.emitWarning(message, { code: INT64_WARNING_CODE });
  else console.warn(message);
}
