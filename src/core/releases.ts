// Release-asset dataset loaders: the runtime behind every generated `load*`
// function (src/generated/loaders/<league>.ts, from the vendored sdv-py
// manifest tools/codegen/endpoints/releases.yaml). Port of sdv-py's
// `_codegen_runtime` loader path (`_read_release_parquet`, `_cast_ids_int64`,
// `_as_season_list`) + the `load_module.py.jinja` season loop.
//
// Node-first: the parquet decode (hyparquet, pure JS) would run in a browser,
// but release downloads are cross-origin GitHub assets, so browsers are not a
// supported target.

import { parquetMetadata, parquetReadObjects, parquetSchema } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { DEFAULT_RETRY_STATUSES, registerFamilyDefaults } from "./config.js";
import { NoDataError, SdvError, SeasonNotFoundError } from "./errors.js";
import { request } from "./request.js";

/**
 * Transport family for release downloads (GitHub releases / raw). Keyless
 * gateway traffic, so it keeps the full default retry set, 403 included (as
 * sdv-py's `dl_utils.download`). Swap its transport with
 * `configure({ transport: { releases } })`.
 */
export const RELEASES_FAMILY = "releases";
registerFamilyDefaults(RELEASES_FAMILY, { retryStatuses: DEFAULT_RETRY_STATUSES });

/**
 * Per-request timeout for a release download. The default 30 s request timeout
 * covers the whole body, and the largest assets (CFB play-by-play, ~55 MB) need
 * longer on an ordinary connection. Override per call with `timeoutMs`.
 */
export const RELEASE_TIMEOUT_MS = 300_000;

/** One generated loader: everything the runtime needs from its manifest entry. */
export interface ReleaseLoaderDef {
  /** sdv-py function name (`load_cfb_pbp`), used in warnings and errors. */
  fn: string;
  /** Absolute asset URL; `{season}` / `{season + N}` tokens are filled per season. */
  url: string;
  /** Lowest season with a published asset (below it: SeasonNotFoundError). */
  minSeason?: number;
  /** Id columns pinned to integers at the boundary (sdv-py `id_int64`). */
  idInt64?: string[];
}

/** A row of a loaded dataset (column name -> value). */
export type ReleaseRow = Record<string, unknown>;

/** Options every loader accepts. */
export interface ReleaseLoaderOptions {
  /** Read only these columns (the rest are not decoded). Default: all. */
  columns?: string[];
  /** Download timeout in milliseconds (default {@link RELEASE_TIMEOUT_MS}). */
  timeoutMs?: number;
}

/** Options for a per-season loader. */
export interface SeasonLoaderOptions extends ReleaseLoaderOptions {
  /** One season or a list of seasons. */
  seasons: number | number[];
}

/**
 * Test seam for warnings (skipped seasons, an absent asset, a BigInt column).
 * @internal
 */
export const _warn = {
  emit: (message: string): void => {
    process.emitWarning(message, { code: "SDV_RELEASE" });
  },
};

/** sdv-py `spec.SEASON_TOKEN`: `{season}` or `{season + N}`. */
const SEASON_TOKEN = /\{season(?:\s*\+\s*(\d+))?\}/g;

/** Fill the asset URL for one season (sdv-py `spec.render_url`). */
export function releaseUrl(template: string, season: number): string {
  return template.replace(SEASON_TOKEN, (_m, off: string | undefined) =>
    String(season + Number(off ?? 0))
  );
}

/** Normalise `seasons` to integers and check them against `minSeason` (before any fetch). */
function seasonList(def: ReleaseLoaderDef, seasons: unknown): number[] {
  if (seasons === undefined || seasons === null) {
    throw new TypeError(`${def.fn}: \`seasons\` is required (a season or a list of seasons)`);
  }
  const list = (Array.isArray(seasons) ? seasons : [seasons]).map(Number);
  const bad = list.find((s) => !Number.isInteger(s));
  if (bad !== undefined) {
    throw new TypeError(`${def.fn}: seasons must be integers, got ${JSON.stringify(seasons)}`);
  }
  if (def.minSeason !== undefined) {
    const low = list.find((s) => s < def.minSeason!);
    if (low !== undefined) {
      throw new SeasonNotFoundError(`${def.fn}: season cannot be less than ${def.minSeason} (got ${low})`);
    }
  }
  return list;
}

/** Bytes from whatever the transport handed back (ArrayBuffer, Buffer, typed array). */
function toArrayBuffer(data: unknown, url: string): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  throw new SdvError(`release download did not return bytes: ${url}`);
}

/**
 * Fetch and decode one release asset. `undefined` when the asset is absent
 * (HTTP 404 → {@link NoDataError}); any failed fetch propagates as
 * `AssetFetchError` — a failed fetch is never reported as an absent season.
 *
 * ponytail: full download, then decode. hyparquet can range-read column chunks
 * (`asyncBufferFromUrl`) — the later optimisation for `columns` on big assets,
 * once the range requests go through `request()` too.
 */
async function readAsset(
  def: ReleaseLoaderDef,
  url: string,
  opts: ReleaseLoaderOptions
): Promise<ReleaseRow[] | undefined> {
  let data: unknown;
  try {
    data = await request(RELEASES_FAMILY, {
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeoutMs: opts.timeoutMs ?? RELEASE_TIMEOUT_MS,
    });
  } catch (err) {
    if (err instanceof NoDataError) return undefined;
    throw err;
  }
  const file = toArrayBuffer(data, url);
  try {
    const metadata = parquetMetadata(file);
    // Seasons drift (columns added / dropped over the years): only ask a file
    // for the requested columns it has; the rest are null-filled on concat.
    const have = new Set(parquetSchema(metadata).children.map((c) => c.element.name));
    const columns = opts.columns?.filter((c) => have.has(c));
    return await parquetReadObjects({ file, metadata, columns, compressors });
  } catch (err) {
    throw new SdvError(`${def.fn}: could not decode the parquet asset ${url}`, { cause: err });
  }
}

/**
 * Concatenate per-season frames the way sdv-py's `pl.concat(how="diagonal_relaxed")`
 * does: union of columns (first-seen order), missing ones null-filled.
 */
function concatRows(label: string, frames: ReleaseRow[][], requested?: string[]): ReleaseRow[] {
  const cols: string[] = [];
  const seen = new Set<string>();
  const add = (c: string): void => {
    if (!seen.has(c)) {
      seen.add(c);
      cols.push(c);
    }
  };
  for (const frame of frames) if (frame.length) Object.keys(frame[0]).forEach(add);
  // Requested columns absent from every season still appear (all null) — and
  // are named, since that is usually a typo.
  const absent = (requested ?? []).filter((c) => !seen.has(c));
  if (absent.length && frames.some((f) => f.length)) {
    _warn.emit(`${label}: column(s) ${absent.join(", ")} not in the loaded data (null-filled)`);
  }
  absent.forEach(add);
  const out: ReleaseRow[] = [];
  for (const frame of frames) {
    const complete = frame.length > 0 && Object.keys(frame[0]).length === cols.length;
    for (const row of frame) {
      if (complete) {
        out.push(row);
        continue;
      }
      const filled: ReleaseRow = {};
      for (const c of cols) filled[c] = row[c] ?? null;
      out.push(filled);
    }
  }
  return out;
}

const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
/** The decimal form polars' Int64 -> String cast produces (no leading zeros / `+` / `-0`). */
const CANONICAL_INT = /^(0|-?[1-9]\d*)$/;

/** Plain object (a struct value) — not a Date, typed array, … */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && Object.getPrototypeOf(v) === Object.prototype;
}

/** Visit every bigint inside a cell (scalars, lists, structs); stop when `fn` returns false. */
function everyBigint(v: unknown, fn: (b: bigint) => boolean): boolean {
  if (typeof v === "bigint") return fn(v);
  if (Array.isArray(v)) return v.every((x) => everyBigint(x, fn));
  if (isPlainObject(v)) return Object.values(v).every((x) => everyBigint(x, fn));
  return true;
}

/** Replace every bigint inside a cell with a number. */
function bigintsToNumbers(v: unknown): unknown {
  if (typeof v === "bigint") return Number(v);
  if (Array.isArray(v)) return v.map(bigintsToNumbers);
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = bigintsToNumbers(x);
    return out;
  }
  return v;
}

/**
 * sdv-py `_cast_ids_int64`: pin an id column to integers when EVERY non-null
 * value survives exactly — integer numbers, bigints, or canonical in-range
 * integer strings (`"007"`, `"1.5"`, `"abc"` leave the column untouched).
 * Strings become BigInt here; {@link applyInt64Policy} then makes them numbers
 * when safe, exactly like any other INT64 column.
 */
export function castIdInt64(rows: ReleaseRow[], col: string): void {
  const ok = rows.every((r) => {
    const v = r[col];
    if (v === null || v === undefined || typeof v === "bigint") return true;
    if (typeof v === "number") return Number.isInteger(v);
    if (typeof v !== "string" || !CANONICAL_INT.test(v)) return false;
    const b = BigInt(v);
    return b >= INT64_MIN && b <= INT64_MAX;
  });
  if (!ok) return;
  for (const r of rows) {
    const v = r[col];
    if (typeof v === "string") r[col] = BigInt(v);
  }
}

/**
 * INT64 policy (owner decision 3): hyparquet decodes INT64 as BigInt. A column
 * whose every value is a safe integer (|v| <= Number.MAX_SAFE_INTEGER) becomes
 * plain `number`; otherwise the column is left BigInt (exact) and ONE warning
 * names it. Applies to every column holding a bigint, nested lists/structs
 * included. Mutates and returns `rows`.
 */
export function applyInt64Policy(rows: ReleaseRow[], label: string): ReleaseRow[] {
  if (!rows.length) return rows;
  for (const col of Object.keys(rows[0])) {
    let sawBigint = false;
    const safe = rows.every((r) =>
      everyBigint(r[col], (b) => {
        sawBigint = true;
        return b >= MIN_SAFE && b <= MAX_SAFE;
      })
    );
    if (!sawBigint) continue;
    if (safe) {
      for (const r of rows) r[col] = bigintsToNumbers(r[col]);
    } else {
      _warn.emit(
        `${label}: column "${col}" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`
      );
    }
  }
  return rows;
}

/** Boundary post-processing shared by both loader shapes. */
function finish(def: ReleaseLoaderDef, rows: ReleaseRow[]): ReleaseRow[] {
  if (!rows.length) return rows;
  for (const col of def.idInt64 ?? []) if (col in rows[0]) castIdInt64(rows, col);
  return applyInt64Policy(rows, def.fn);
}

/**
 * Load a per-season release dataset: every season is fetched in turn, a season
 * with no published asset (HTTP 404) is skipped with one warning, any other
 * failure raises `AssetFetchError`, and the seasons are concatenated (columns
 * unioned, gaps null-filled). Seasons below `minSeason` raise
 * {@link SeasonNotFoundError} before anything is fetched.
 */
export async function loadRelease(
  def: ReleaseLoaderDef,
  opts: SeasonLoaderOptions
): Promise<ReleaseRow[]> {
  const seasons = seasonList(def, opts?.seasons);
  const frames: ReleaseRow[][] = [];
  const missing: number[] = [];
  for (const season of seasons) {
    const rows = await readAsset(def, releaseUrl(def.url, season), opts);
    if (rows === undefined) missing.push(season);
    else frames.push(rows);
  }
  if (missing.length) {
    _warn.emit(`${def.fn}: no data for season(s) ${missing.join(", ")} (skipped)`);
  }
  return finish(def, concatRows(def.fn, frames, opts.columns));
}

/**
 * Load a single-asset release dataset (no season token in its URL). An absent
 * asset returns `[]` with a warning; a failed fetch raises `AssetFetchError`.
 */
export async function loadReleaseAsset(
  def: ReleaseLoaderDef,
  opts: ReleaseLoaderOptions = {}
): Promise<ReleaseRow[]> {
  const rows = await readAsset(def, def.url, opts);
  if (rows === undefined) {
    _warn.emit(`${def.fn}: no published asset (returning no rows)`);
    return [];
  }
  return finish(def, concatRows(def.fn, [rows], opts.columns));
}

const deprecationWarned = new Set<string>();

/** One-time `DeprecationWarning` for a loader whose release tag was retired. */
export function warnDeprecatedLoader(fn: string, replacement: string): void {
  if (deprecationWarned.has(fn)) return;
  deprecationWarned.add(fn);
  process.emitWarning(`${fn} is deprecated; use ${replacement} instead.`, "DeprecationWarning");
}
