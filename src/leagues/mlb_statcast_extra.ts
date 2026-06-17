// Hand-written Baseball Savant / Statcast wrappers that need logic beyond a flat
// passthrough — the 25,000-row search has to be date-chunked + truncation-
// checked, and the player page returns HTML with embedded JSON. Port of
// `sportsdataverse/mlb/mlb_statcast_extra.py`. Merged onto `sdv.mlb` (alongside
// the generated flat wrappers) in src/index.ts, under both snake_case and
// camelCase names.

import { statcastGet } from "../core/statcast_runtime.js";
import {
  parse_mlb_statcast_search,
  parse_mlb_statcast_player,
} from "../parsers/mlb_statcast.js";

const SAVANT_BASE = "https://baseballsavant.mlb.com";
const SEARCH_URL = `${SAVANT_BASE}/statcast_search/csv`;
/** Minor-league search shares the search core but hits its own CSV route. */
const SEARCH_URL_MINORS = `${SAVANT_BASE}/statcast-search-minors/csv`;
/** World Baseball Classic search CSV route (same shape; WBC date windows). */
const SEARCH_URL_WBC = `${SAVANT_BASE}/statcast-search-world-baseball-classic/csv`;

/** Savant caps a single `/statcast_search/csv` response at this many rows (no pagination). */
const SAVANT_ROW_CAP = 25000;

/** Options for the Statcast search wrappers. */
export interface StatcastSearchOptions {
  /** `"batter"` (default) or `"pitcher"`. */
  player_type?: string;
  /** Initial date-window size in days (default 7). */
  chunk_days?: number;
  /**
   * Friendly filter kwargs translated to Savant's params (see `_translateFilters`):
   * `season`, `game_type`, `pitch_type`, `at_bat_result`, `batted_ball_type`,
   * `pitch_result`, `zone`, `count`, `outs`, `inning`, `runners_on`, `flag`,
   * `position` (pipe-lists); `batters_lookup` / `pitchers_lookup` (id or list);
   * `team`, `opponent`, `home_road`, `stadium`, `pitcher_throws`, `batter_stands`.
   * Any unrecognized key is forwarded verbatim, so raw Savant params still work.
   */
  [filter: string]: any;
}

/** ISO `YYYY-MM-DD` -> a `Date` at UTC midnight (parsing-stable, no TZ drift). */
function fromIso(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

/** A `Date` -> ISO `YYYY-MM-DD`. */
function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Split `[start, end]` (inclusive ISO dates) into `days`-wide windows. */
export function dateChunks(start: string, end: string, days = 7): Array<[string, string]> {
  const s = fromIso(start);
  const e = fromIso(end);
  const out: Array<[string, string]> = [];
  const dayMs = 86400000;
  let cur = s.getTime();
  while (cur <= e.getTime()) {
    const chunkEnd = Math.min(cur + (days - 1) * dayMs, e.getTime());
    out.push([toIso(new Date(cur)), toIso(new Date(chunkEnd))]);
    cur = chunkEnd + dayMs;
  }
  return out;
}

/**
 * Format a scalar / iterable as a Savant pipe-list with a trailing `|`.
 *
 * Savant multi-value filters expect `"FF|SL|"` (trailing pipe); a scalar becomes
 * `"x|"` and `null`/empty becomes `""`. A non-string scalar (e.g. `season=2024`)
 * becomes `"2024|"` (single piped value, not iterated).
 */
export function pipe(values: any): string {
  if (values === null || values === undefined) return "";
  if (typeof values === "string") {
    return !values || values.endsWith("|") ? values : `${values}|`;
  }
  if (!Array.isArray(values)) {
    // Non-string scalar (e.g. season=2024) -> single piped value.
    return `${values}|`;
  }
  const parts = values
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => String(v));
  return parts.length ? `${parts.join("|")}|` : "";
}

/** Friendly kwarg -> Savant query key for pipe-list filters (value goes through `pipe`). */
const PIPE_FILTERS: Record<string, string> = {
  season: "hfSea",
  game_type: "hfGT",
  position: "position",
  pitch_type: "hfPT",
  count: "hfC",
  at_bat_result: "hfAB",
  batted_ball_type: "hfBBT",
  pitch_result: "hfPR",
  zone: "hfZ",
  outs: "hfOuts",
  inning: "hfInn",
  runners_on: "hfRO",
  flag: "hfFlag",
};
/** Friendly kwarg -> Savant query key for scalar filters (value passed as-is). */
const SCALAR_FILTERS: Record<string, string> = {
  team: "team",
  opponent: "opponent",
  home_road: "home_road",
  stadium: "stadium",
  pitcher_throws: "pitcher_throws",
  batter_stands: "batter_stands",
};
/** Friendly kwarg -> Savant `name[]` array param (value coerced to a list of strings). */
const LIST_FILTERS: Record<string, string> = {
  batters_lookup: "batters_lookup[]",
  pitchers_lookup: "pitchers_lookup[]",
};

/**
 * Map friendly search kwargs to Savant's query params; pass unknowns through.
 *
 * Turns readable kwargs (`season`, `pitch_type`, `at_bat_result`,
 * `batters_lookup`, `team`, …) into the cryptic Savant params (`hfSea`, `hfPT`,
 * `hfAB`, `batters_lookup[]`, `team`, …). Any key not in a map is forwarded
 * verbatim, so raw Savant params still work for power users.
 */
export function translateFilters(filters: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(filters)) {
    if (key in PIPE_FILTERS) {
      out[PIPE_FILTERS[key]] = pipe(val);
    } else if (key in SCALAR_FILTERS) {
      out[SCALAR_FILTERS[key]] = val;
    } else if (key in LIST_FILTERS) {
      const ids = Array.isArray(val) ? val : [val];
      out[LIST_FILTERS[key]] = ids.map((i) => String(i));
    } else {
      out[key] = val;
    }
  }
  return out;
}

/** Fetch + parse a single date-window's search CSV into tidy rows. */
async function fetchChunk(
  gt: string,
  lt: string,
  playerType: string,
  filters: Record<string, any>,
  baseUrl: string
): Promise<Record<string, any>[]> {
  const params: Record<string, any> = {
    all: "true",
    type: "details",
    player_type: playerType,
    game_date_gt: gt,
    game_date_lt: lt,
    ...translateFilters(filters),
  };
  const text = await statcastGet(baseUrl, { params });
  return parse_mlb_statcast_search(typeof text === "string" ? text : "");
}

/**
 * Shared date-chunked, truncation-aware Savant search (MLB / MiLB / WBC).
 *
 * Splits `[startDt, endDt]` into `chunkDays` windows, fetches each from
 * `baseUrl`, halving the window for any chunk that hits the 25,000-row cap, and
 * warns once at the 1-day floor (where a single day can still truncate).
 */
async function searchCore(
  startDt: string,
  endDt: string,
  baseUrl: string,
  label: string,
  playerType: string,
  chunkDays: number,
  filters: Record<string, any>
): Promise<Record<string, any>[]> {
  const frames: Record<string, any>[][] = [];
  for (const [gt, lt] of dateChunks(startDt, endDt, chunkDays)) {
    let df = await fetchChunk(gt, lt, playerType, filters, baseUrl);
    if (df.length >= SAVANT_ROW_CAP && chunkDays > 1) {
      // truncated -> recurse on this sub-range with a smaller window
      df = await searchCore(
        gt,
        lt,
        baseUrl,
        label,
        playerType,
        Math.max(1, Math.floor(chunkDays / 2)),
        filters
      );
    } else if (df.length >= SAVANT_ROW_CAP) {
      // eslint-disable-next-line no-console
      console.warn(
        `${label}: ${gt}..${lt} hit the ${SAVANT_ROW_CAP}-row Savant cap at the ` +
          `1-day floor; results for that day may be truncated.`
      );
    }
    if (df.length) frames.push(df);
  }
  return frames.flat();
}

/** Pull `player_type` / `chunk_days` out of the options bag; the rest are filters. */
function splitOptions(opts: StatcastSearchOptions): {
  playerType: string;
  chunkDays: number;
  filters: Record<string, any>;
} {
  const { player_type = "batter", chunk_days = 7, ...filters } = opts ?? {};
  return { playerType: player_type, chunkDays: chunk_days, filters };
}

/**
 * Pitch-by-pitch MLB Statcast search (`/statcast_search/csv`), date-chunked.
 *
 * Savant caps a single response at 25,000 rows with no pagination; this splits
 * the date range into `chunk_days` windows, halving any window that hits the
 * cap, and stitches the chunks back together.
 *
 * @param startDt / endDt `YYYY-MM-DD` (inclusive).
 * @param opts `player_type` (`"batter"`/`"pitcher"`), `chunk_days`, plus friendly
 *             filter kwargs (see {@link StatcastSearchOptions}).
 * @returns One tidy row per pitch.
 */
export async function mlb_statcast_search(
  startDt: string,
  endDt: string,
  opts: StatcastSearchOptions = {}
): Promise<Record<string, any>[]> {
  const { playerType, chunkDays, filters } = splitOptions(opts);
  return searchCore(startDt, endDt, SEARCH_URL, "mlb_statcast_search", playerType, chunkDays, filters);
}

/**
 * Minor-league Statcast search (`/statcast-search-minors/csv`), date-chunked.
 * Same shape, columns, and chunking as {@link mlb_statcast_search}. Scope with
 * `hfLevel` (Triple-A/Double-A/…) + `hfSea` filters.
 */
export async function mlb_statcast_search_minors(
  startDt: string,
  endDt: string,
  opts: StatcastSearchOptions = {}
): Promise<Record<string, any>[]> {
  const { playerType, chunkDays, filters } = splitOptions(opts);
  return searchCore(
    startDt,
    endDt,
    SEARCH_URL_MINORS,
    "mlb_statcast_search_minors",
    playerType,
    chunkDays,
    filters
  );
}

/**
 * World Baseball Classic Statcast search
 * (`/statcast-search-world-baseball-classic/csv`), date-chunked. Same shape and
 * chunking as {@link mlb_statcast_search}; pass WBC date windows.
 */
export async function mlb_statcast_search_wbc(
  startDt: string,
  endDt: string,
  opts: StatcastSearchOptions = {}
): Promise<Record<string, any>[]> {
  const { playerType, chunkDays, filters } = splitOptions(opts);
  return searchCore(
    startDt,
    endDt,
    SEARCH_URL_WBC,
    "mlb_statcast_search_wbc",
    playerType,
    chunkDays,
    filters
  );
}

/** Options for {@link mlb_statcast_player}. */
export interface StatcastPlayerOptions {
  /** Which embedded `serverVals` table to flatten (default `"statcast"`). */
  section?: string;
  /** Optional `stats` query value to scope the embedded payload. */
  stats?: string;
  /** Return the raw page HTML string instead of a parsed frame. */
  raw?: boolean;
}

/** Fetch the raw `/savant-player/{id}` HTML (`""` on transport failure). */
async function playerPageHtml(playerId: number | string, stats?: string): Promise<string> {
  const url = `${SAVANT_BASE}/savant-player/${playerId}`;
  const params = stats ? { stats } : undefined;
  const body = await statcastGet(url, { params });
  return typeof body === "string" ? body : "";
}

/**
 * GET `/savant-player/{playerId}` and parse one embedded table into tidy rows.
 *
 * Returns tidy rows **by default** (the parsed Statcast page, `section`
 * `"statcast"`); pass `{ raw: true }` to get the underlying HTML string instead
 * (the page embeds ~12 other tables — feed the HTML to
 * {@link parse_mlb_statcast_player} with a different `section`).
 *
 * @param playerId MLBAM player id (shared with the Stats API `personId`).
 * @param opts `section` (default `"statcast"`), `stats`, `raw`.
 * @returns Tidy rows by default; the raw HTML `string` when `{ raw: true }`.
 */
export async function mlb_statcast_player(
  playerId: number | string,
  opts: StatcastPlayerOptions = {}
): Promise<Record<string, any>[] | string> {
  const { section = "statcast", stats, raw = false } = opts;
  const html = await playerPageHtml(playerId, stats);
  if (raw) return html;
  return parse_mlb_statcast_player(html, section);
}
