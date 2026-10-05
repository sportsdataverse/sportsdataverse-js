// Release-asset dataset loaders: the runtime behind every generated `load*`
// function (src/generated/loaders/<league>.ts, from the vendored sdv-py
// manifest tools/codegen/endpoints/releases.yaml). Port of sdv-py's
// `_codegen_runtime` loader path (`_read_release_parquet`, `_cast_ids_int64`,
// `_as_season_list`) + the `load_module.py.jinja` season loop.
//
// Node-first: the parquet decode (hyparquet, pure JS) would run in a browser,
// but release downloads are cross-origin GitHub assets and the size guard reads
// the V8 heap limit, so browsers are not a supported target.

import { getHeapStatistics } from "node:v8";
import {
  parquetMetadata,
  parquetRead,
  parquetReadObjects,
  parquetSchema,
  type FileMetaData,
  type SchemaTree,
} from "hyparquet";
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
 * Per-request timeout for a release download. With the default axios transport
 * (follow-redirects) the timeout is a wall-clock timer only until the response
 * headers arrive, then a socket-idle timer — so it does not cap a slow 55 MB
 * body there. Other transports (fetch / impit) may bound the whole request, so
 * release downloads get a longer default than the 30 s global one. Override per
 * call with `timeoutMs`.
 */
export const RELEASE_TIMEOUT_MS = 300_000;

/**
 * Heap bytes budgeted per decoded cell (rows × leaf columns), by output format.
 * MEASURED 2026-10-05 on Node 24 with the default heap (4288 MB): row objects
 * cost 52-80 B/cell retained and 60-97 B/cell at peak (espn_cfb_pbp 2024,
 * 163,567 × 506 = 82.8M cells, OOMs; its first 300 columns, 49.1M cells, peak
 * 2.9 GB; espn_nba_pbp 2024, 41.2M cells, peak 2.5 GB). Column arrays cost
 * 13 B/cell retained and 24-28 B/cell at peak (the full 82.8M-cell CFB pbp peaks
 * 2.2 GB; espn_mbb_pbp 2024, 122.3M cells, peaks 2.9 GB). The guard therefore
 * allows heap_size_limit / 100 cells for rows (45.0M on the default heap) and
 * heap_size_limit / 30 for columns (149.9M), scaling with --max-old-space-size.
 */
const BYTES_PER_CELL = { rows: 100, columns: 30 } as const;

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
  /**
   * releases.yaml `on_missing: raise` (sdv-py's hand-written nfl loaders): a
   * requested season with no published asset throws {@link NoDataError} instead
   * of being skipped. Absent = skip (the generated-loader default).
   */
  onMissing?: "raise";
}

/** A row of a loaded dataset (column name -> value). */
export type ReleaseRow = Record<string, unknown>;

/** A loaded dataset in column form (`format: "columns"`): column name -> values. */
export type ReleaseColumns = Record<string, unknown[]>;

/** Options every loader accepts. */
export interface ReleaseLoaderOptions {
  /** Read only these columns (the rest are not decoded). Default: all. */
  columns?: string[];
  /**
   * `"rows"` (default): an array of row objects. `"columns"`: one array per
   * column (`{ [column]: values[] }`) — about 4x lighter on the heap.
   */
  format?: "rows" | "columns";
  /**
   * Refuse (with a catchable `SdvError`) to decode more than this many cells
   * (rows × leaf columns, a running total over the seasons) — each season's
   * parquet footer is checked before that season is decoded. Default: scaled to the V8 heap limit
   * (see `BYTES_PER_CELL`); `Infinity` disables the check.
   */
  maxCells?: number;
  /** Download timeout in milliseconds (default {@link RELEASE_TIMEOUT_MS}). */
  timeoutMs?: number;
}

/** Options for a per-season loader. */
export interface SeasonLoaderOptions extends ReleaseLoaderOptions {
  /** One season or a list of seasons: integers or 4-digit year strings (`2024`, `"2024"`). */
  seasons: number | number[];
}

/** A per-season loader: row objects by default, column arrays with `format: "columns"`. */
export interface SeasonLoader {
  (opts: SeasonLoaderOptions & { format: "columns" }): Promise<ReleaseColumns>;
  (opts: SeasonLoaderOptions): Promise<ReleaseRow[]>;
}

/** A single-asset loader (no season token in its URL). */
export interface AssetLoader {
  (opts: ReleaseLoaderOptions & { format: "columns" }): Promise<ReleaseColumns>;
  (opts?: ReleaseLoaderOptions): Promise<ReleaseRow[]>;
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

/** The default cell limit for a format on this process's heap. */
export function defaultMaxCells(format: "rows" | "columns"): number {
  return Math.floor(getHeapStatistics().heap_size_limit / BYTES_PER_CELL[format]);
}

const YEAR = /^\d{4}$/;

/** A caller's value for an error message (`JSON.stringify` throws on BigInt, drops undefined). */
function describe(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  return typeof v === "bigint" ? `${v}n` : String(v);
}

/** Normalise `seasons` to integers and check them against `minSeason` (before any fetch). */
function seasonList(def: ReleaseLoaderDef, seasons: unknown): number[] {
  if (seasons === undefined || seasons === null) {
    throw new SdvError(`${def.fn}: \`seasons\` is required (a season or a list of seasons)`);
  }
  // Only integers or 4-digit year strings: Number() would turn null / "" /
  // false into 0 and true into 1, a "season" that then just 404s and is skipped.
  const raw: unknown[] = Array.isArray(seasons) ? seasons : [seasons];
  const list = raw.map((s) =>
    typeof s === "number" && Number.isInteger(s)
      ? s
      : typeof s === "string" && YEAR.test(s)
        ? Number(s)
        : NaN
  );
  const badAt = list.findIndex(Number.isNaN);
  if (badAt >= 0) {
    throw new SdvError(
      `${def.fn}: each season must be an integer or a 4-digit year string, got ${describe(raw[badAt])}`
    );
  }
  if (def.minSeason !== undefined) {
    const low = list.find((s) => s < def.minSeason!);
    if (low !== undefined) {
      throw new SeasonNotFoundError(`${def.fn}: season cannot be less than ${def.minSeason} (got ${low})`);
    }
  }
  return list;
}

/** Bytes from whatever the transport handed back; no copy when a view spans its buffer. */
function toArrayBuffer(data: unknown, url: string): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    const { buffer, byteOffset, byteLength } = data;
    if (buffer instanceof ArrayBuffer && byteOffset === 0 && byteLength === buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
  }
  throw new SdvError(`release download did not return bytes: ${url}`);
}

/** A downloaded asset whose footer has been read (nothing decoded yet). */
interface Asset {
  url: string;
  file: ArrayBuffer;
  metadata: FileMetaData;
  /** Top-level columns to decode, in file order. */
  names: string[];
  /** Passed to hyparquet: undefined = every column. */
  columns?: string[];
  rows: number;
  /** Leaf columns under `names` (nested columns count each leaf). */
  leaves: number;
}

const decodeError = (def: ReleaseLoaderDef, url: string, err: unknown): SdvError =>
  new SdvError(`${def.fn}: could not decode the parquet asset ${url}`, { cause: err });

function leafCount(node: SchemaTree): number {
  return node.children.length ? node.children.reduce((n, c) => n + leafCount(c), 0) : 1;
}

/**
 * Download one release asset and read its footer. `undefined` when the asset is
 * absent (HTTP 404 → {@link NoDataError}); any failed fetch propagates as
 * `AssetFetchError` — a failed fetch is never reported as an absent season.
 *
 * ponytail: full download, then decode. hyparquet can range-read the footer and
 * single column chunks (`asyncBufferFromUrl`) — the later optimisation for
 * `columns` and for the size guard, once range requests go through `request()`.
 */
async function fetchAsset(
  def: ReleaseLoaderDef,
  url: string,
  opts: ReleaseLoaderOptions
): Promise<Asset | undefined> {
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
    const top = parquetSchema(metadata).children;
    const picked = opts.columns ? top.filter((c) => opts.columns!.includes(c.element.name)) : top;
    const names = picked.map((c) => c.element.name);
    return {
      url,
      file,
      metadata,
      names,
      columns: opts.columns ? names : undefined,
      rows: Number(metadata.num_rows),
      leaves: picked.reduce((n, c) => n + leafCount(c), 0),
    };
  } catch (err) {
    throw decodeError(def, url, err);
  }
}

async function decodeRows(def: ReleaseLoaderDef, a: Asset): Promise<ReleaseRow[]> {
  try {
    return await parquetReadObjects({ file: a.file, metadata: a.metadata, columns: a.columns, compressors });
  } catch (err) {
    throw decodeError(def, a.url, err);
  }
}

/** Column-oriented decode: hyparquet's column chunks, never transposed into row objects. */
async function decodeColumns(def: ReleaseLoaderDef, a: Asset): Promise<ColumnFrame> {
  const chunks = new Map<string, Array<{ rowStart: number; data: ArrayLike<unknown> }>>();
  try {
    await parquetRead({
      file: a.file,
      metadata: a.metadata,
      columns: a.columns,
      compressors,
      onChunk: ({ columnName, columnData, rowStart }) => {
        let list = chunks.get(columnName);
        if (!list) chunks.set(columnName, (list = []));
        list.push({ rowStart, data: columnData });
      },
    });
  } catch (err) {
    throw decodeError(def, a.url, err);
  }
  const cols: ReleaseColumns = {};
  for (const name of a.names) {
    const parts = (chunks.get(name) ?? []).sort((x, y) => x.rowStart - y.rowStart);
    chunks.delete(name);
    // Append into the first chunk (a plain Array from hyparquet) — no full copy.
    const first = parts[0]?.data;
    const out: unknown[] = Array.isArray(first) ? first : Array.from(first ?? []);
    for (let p = 1; p < parts.length; p++) {
      const d = parts[p].data;
      for (let i = 0; i < d.length; i++) out.push(d[i]);
    }
    cols[name] = out;
  }
  return { rows: a.rows, cols };
}

/** One season in column form. */
interface ColumnFrame {
  rows: number;
  cols: ReleaseColumns;
}

/** Union of column names (first-seen order) + requested-but-absent ones, named once. */
function unionNames(
  label: string,
  perFrame: string[][],
  requested: string[] | undefined,
  anyRows: boolean
): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const list of perFrame) {
    for (const c of list) {
      if (!seen.has(c)) {
        seen.add(c);
        names.push(c);
      }
    }
  }
  // Requested columns absent from every season still appear (all null) — and
  // are named, since that is usually a typo.
  const absent = (requested ?? []).filter((c) => !seen.has(c));
  if (absent.length && anyRows) {
    _warn.emit(`${label}: column(s) ${absent.join(", ")} not in the loaded data (null-filled)`);
  }
  return names.concat(absent);
}

type Kind = "string" | "number" | "bigint" | "boolean" | "date" | "other";

function kindOf(v: unknown): Kind | undefined {
  if (v === null || v === undefined) return undefined;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "bigint" || t === "boolean") return t;
  return v instanceof Date ? "date" : "other";
}

/**
 * sdv-py concatenates seasons with polars `diagonal_relaxed`, which casts a
 * column whose dtype differs between seasons to their supertype. A parquet
 * column has one type per file, so each season's kind is its first non-null
 * value's. Anything + string → string; boolean + numeric → number; number +
 * bigint is left to the INT64 policy; nested / other mixes are left alone.
 */
function supertype(kinds: Iterable<Kind | undefined>): "string" | "number" | undefined {
  const set = new Set<Kind>();
  for (const k of kinds) if (k) set.add(k);
  if (set.size < 2 || set.has("other")) return undefined;
  if (set.has("string")) return "string";
  return set.has("boolean") && [...set].every((k) => k !== "date") ? "number" : undefined;
}

/**
 * Cast one value to the supertype — an integer id becomes "123", never "123.0".
 * Known gap (ledgered): a Date becomes its ISO timestamp, while polars casts a
 * Date column to "YYYY-MM-DD" (hyparquet decodes DATE and TIMESTAMP alike to Date).
 */
function castTo(v: unknown, target: "string" | "number"): unknown {
  if (v === null || v === undefined) return v;
  if (target === "string") {
    if (typeof v === "string") return v;
    return v instanceof Date ? v.toISOString() : String(v);
  }
  return typeof v === "boolean" ? Number(v) : v;
}

function firstNonNull(n: number, get: (i: number) => unknown): unknown {
  for (let i = 0; i < n; i++) {
    const v = get(i);
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

/**
 * Concatenate per-season row frames the way sdv-py's `pl.concat(how="diagonal_relaxed")`
 * does: union of columns, missing ones null-filled (in place), drifted types
 * cast to their supertype.
 */
function concatRows(label: string, frames: ReleaseRow[][], requested?: string[]): ReleaseRow[] {
  const keys = frames.map((f) => (f.length ? Object.keys(f[0]) : []));
  const names = unionNames(label, keys, requested, frames.some((f) => f.length > 0));
  if (frames.length > 1) {
    for (const c of names) {
      const target = supertype(frames.map((f) => kindOf(firstNonNull(f.length, (i) => f[i][c]))));
      if (target) for (const f of frames) for (const r of f) r[c] = castTo(r[c], target);
    }
  }
  const out: ReleaseRow[] = frames[0] ?? [];
  frames.forEach((f, i) => {
    if (keys[i].length !== names.length) {
      for (const r of f) for (const c of names) if (!(c in r)) r[c] = null;
    }
    if (i > 0) {
      for (const r of f) out.push(r);
      frames[i] = []; // release the season's array once copied
    }
  });
  return out;
}

/** The column-form twin of {@link concatRows}. */
function concatColumns(label: string, frames: ColumnFrame[], requested?: string[]): ReleaseColumns {
  const names = unionNames(
    label,
    frames.map((f) => Object.keys(f.cols)),
    requested,
    frames.some((f) => f.rows > 0)
  );
  const out: ReleaseColumns = {};
  for (const c of names) {
    if (frames.length > 1) {
      const target = supertype(
        frames.map((f) => {
          const v = f.cols[c];
          return v ? kindOf(firstNonNull(v.length, (i) => v[i])) : undefined;
        })
      );
      if (target) {
        for (const f of frames) {
          const v = f.cols[c];
          if (v) for (let i = 0; i < v.length; i++) v[i] = castTo(v[i], target);
        }
      }
    }
    let col: unknown[] | undefined;
    for (const f of frames) {
      const part = f.cols[c];
      delete f.cols[c]; // release as we go
      if (!col) {
        col = part ?? new Array<unknown>(f.rows).fill(null);
      } else if (part) {
        for (let i = 0; i < part.length; i++) col.push(part[i]);
      } else {
        for (let i = 0; i < f.rows; i++) col.push(null);
      }
    }
    out[c] = col ?? [];
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

/** One column of either format, read and written by index. */
interface ColumnAccess {
  n: number;
  get(i: number): unknown;
  set(i: number, v: unknown): void;
}

const rowColumn = (rows: ReleaseRow[], col: string): ColumnAccess => ({
  n: rows.length,
  get: (i) => rows[i][col],
  set: (i, v) => {
    rows[i][col] = v;
  },
});

const arrayColumn = (values: unknown[]): ColumnAccess => ({
  n: values.length,
  get: (i) => values[i],
  set: (i, v) => {
    values[i] = v;
  },
});

/**
 * sdv-py `_cast_ids_int64`: pin an id column to integers when EVERY non-null
 * value survives exactly — integer numbers, bigints, or canonical in-range
 * integer strings (`"007"`, `"1.5"`, `"abc"` leave the column untouched).
 * Strings become BigInt here; the INT64 policy then makes them numbers when
 * safe, exactly like any other INT64 column.
 */
function castIdColumn(c: ColumnAccess): void {
  for (let i = 0; i < c.n; i++) {
    const v = c.get(i);
    if (v === null || v === undefined || typeof v === "bigint") continue;
    if (typeof v === "number" ? Number.isInteger(v) : typeof v === "string" && CANONICAL_INT.test(v)) {
      if (typeof v === "string") {
        const b = BigInt(v);
        if (b < INT64_MIN || b > INT64_MAX) return;
      }
      continue;
    }
    return;
  }
  for (let i = 0; i < c.n; i++) {
    const v = c.get(i);
    if (typeof v === "string") c.set(i, BigInt(v));
  }
}

/**
 * INT64 policy (owner decision 3) for one column: hyparquet decodes INT64 as
 * BigInt. If every value is a safe integer (|v| <= Number.MAX_SAFE_INTEGER) the
 * column becomes plain `number`; otherwise it is left BigInt (exact) and ONE
 * warning names it. Nested lists / structs included.
 */
function int64Column(label: string, col: string, c: ColumnAccess): void {
  let sawBigint = false;
  for (let i = 0; i < c.n; i++) {
    const safe = everyBigint(c.get(i), (b) => {
      sawBigint = true;
      return b >= MIN_SAFE && b <= MAX_SAFE;
    });
    if (!safe) {
      _warn.emit(`${label}: column "${col}" holds integers beyond Number.MAX_SAFE_INTEGER; left as BigInt`);
      return;
    }
  }
  if (sawBigint) for (let i = 0; i < c.n; i++) c.set(i, bigintsToNumbers(c.get(i)));
}

/** {@link castIdColumn} over row objects (exported for tests). */
export function castIdInt64(rows: ReleaseRow[], col: string): void {
  castIdColumn(rowColumn(rows, col));
}

/** The INT64 policy over every column of row objects. Mutates and returns `rows`. */
export function applyInt64Policy(rows: ReleaseRow[], label: string): ReleaseRow[] {
  if (rows.length) for (const col of Object.keys(rows[0])) int64Column(label, col, rowColumn(rows, col));
  return rows;
}

/**
 * Decode seam: tests spy on it to prove seasons are decoded one at a time and
 * a refused season is never decoded.
 * @internal
 */
export const _decode = { rows: decodeRows, columns: decodeColumns };

/**
 * The size-guard error. `asset` is the season that crossed the limit; `total`
 * is the running cell total including it (earlier seasons already decoded).
 */
function refuse(
  def: ReleaseLoaderDef,
  format: "rows" | "columns",
  asset: Asset,
  season: number | undefined,
  total: number,
  max: number,
  first: boolean
): SdvError {
  const n = (x: number): string => x.toLocaleString("en-US");
  const size = `${n(asset.rows)} rows × ${asset.leaves} columns`;
  const what = first
    ? `${size} (${n(total)} cells) is`
    : `season ${season} (${size}) brings the running total to ${n(total)} cells, which is`;
  const lighter = format === "rows" ? ', `format: "columns"` (column arrays, ~4x lighter)' : "";
  return new SdvError(
    `${def.fn}: ${what} over the ${n(max)}-cell limit for format "${format}" on this heap. ` +
      `Pass \`columns\` to read fewer columns${lighter}, or raise the heap ` +
      `(node --max-old-space-size=8192); \`maxCells: Infinity\` skips this check.`
  );
}

/** The loader body shared by both shapes (`seasons === undefined` = single asset). */
async function load(
  def: ReleaseLoaderDef,
  opts: ReleaseLoaderOptions,
  seasons: Array<number | undefined>
): Promise<ReleaseRow[] | ReleaseColumns> {
  const format = opts.format ?? "rows";
  if (format !== "rows" && format !== "columns") {
    throw new SdvError(`${def.fn}: format must be "rows" or "columns", got ${describe(format)}`);
  }
  const maxCells = opts.maxCells ?? defaultMaxCells(format);

  // One season at a time: download → read the footer → add its cells to the
  // running total → refuse if over `maxCells` (before decoding that season) →
  // else decode it and drop its download → next season. At most one compressed
  // download is held at once, and decoded cells never exceed `maxCells`.
  const rowFrames: ReleaseRow[][] = [];
  const colFrames: ColumnFrame[] = [];
  const missing: number[] = [];
  let found = 0;
  let cells = 0;
  for (const season of seasons) {
    const url = season === undefined ? def.url : releaseUrl(def.url, season);
    let asset = await fetchAsset(def, url, opts);
    if (!asset) {
      if (def.onMissing === "raise") {
        const what = season === undefined ? "no published asset" : `no published asset for season ${season}`;
        throw new NoDataError(`${def.fn}: ${what} (${url})`, { url, status: 404 });
      }
      if (season !== undefined) missing.push(season);
      continue;
    }
    found++;
    const total = cells + asset.rows * asset.leaves;
    if (total > maxCells) throw refuse(def, format, asset, season, total, maxCells, cells === 0);
    cells = total;
    if (format === "columns") colFrames.push(await _decode.columns(def, asset));
    else rowFrames.push(await _decode.rows(def, asset));
    asset = undefined; // release the download before fetching the next season
  }
  if (seasons[0] === undefined && !found) {
    _warn.emit(`${def.fn}: no published asset (returning no rows)`);
  } else if (missing.length) {
    _warn.emit(`${def.fn}: no data for season(s) ${missing.join(", ")} (skipped)`);
  }

  if (format === "columns") {
    const out = concatColumns(def.fn, colFrames, opts.columns);
    for (const [name, values] of Object.entries(out)) {
      if (def.idInt64?.includes(name)) castIdColumn(arrayColumn(values));
      int64Column(def.fn, name, arrayColumn(values));
    }
    return out;
  }
  const out = concatRows(def.fn, rowFrames, opts.columns);
  if (out.length) {
    for (const col of def.idInt64 ?? []) if (col in out[0]) castIdInt64(out, col);
  }
  return applyInt64Policy(out, def.fn);
}

/**
 * A per-season loader: every season is fetched in turn, a season with no
 * published asset (HTTP 404) is skipped with one warning (or, with
 * `onMissing: "raise"`, throws {@link NoDataError}), any other failure
 * raises `AssetFetchError`, and the seasons are concatenated (columns unioned,
 * gaps null-filled, drifted types cast to their supertype). Seasons below
 * `minSeason` raise {@link SeasonNotFoundError} before anything is fetched.
 */
export function seasonLoader(def: ReleaseLoaderDef): SeasonLoader {
  // async, so a bad `seasons` rejects like every other loader error.
  return (async (opts: SeasonLoaderOptions) =>
    load(def, opts ?? {}, seasonList(def, opts?.seasons))) as SeasonLoader;
}

/**
 * A single-asset loader (no season token in its URL). An absent asset returns
 * no rows with a warning; a failed fetch raises `AssetFetchError`.
 */
export function assetLoader(def: ReleaseLoaderDef): AssetLoader {
  return (async (opts: ReleaseLoaderOptions = {}) => load(def, opts, [undefined])) as AssetLoader;
}

const deprecationWarned = new Set<string>();

/**
 * A loader whose release tag was retired: forwards to `target()` (a thunk, so
 * the replacement may be declared later in the module) with a one-time
 * `DeprecationWarning`.
 */
export function deprecatedLoader<L>(fn: string, replacement: string, target: () => L): L {
  return ((opts: unknown) => {
    if (!deprecationWarned.has(fn)) {
      deprecationWarned.add(fn);
      process.emitWarning(`${fn} is deprecated; use ${replacement} instead.`, "DeprecationWarning");
    }
    return (target() as unknown as (o: unknown) => unknown)(opts);
  }) as unknown as L;
}
