/**
 * Param transforms named by `transform:` on a path / query param in the
 * vendored sdv-py endpoint YAML. Exact ports of the sdv-py functions at the
 * vendor pin (tools/codegen/vendor.yaml `source.ref`); the resolvers in
 * src/core/espn.ts + flat.ts apply them to the resolved value (explicit param
 * or its default) before it reaches the URL. `null` / `undefined` pass through,
 * so an unset param is still dropped, except `season_latest_with_data`, which fills
 * an unset season. The codegen refuses any name not listed in
 * tools/codegen/param-transforms.mjs (a test keeps the two lists equal), and the
 * docs playground carries a dependency-free copy (docs/src/playground/resolve.mjs).
 */

/**
 * A param transform: resolved value -> wire value (`null`/`undefined` pass through).
 * `def` is the flat wrapper's def (its `api` family), for a transform sdv-py
 * implements per family runtime.
 */
export type ParamTransform = (value: unknown, def?: { api?: string }) => unknown;

/** Python truthiness for the values a wrapper param can hold. */
function pyTruthy(v: unknown): boolean {
  if (typeof v === "number") return v !== 0; // NaN is truthy in Python too
  if (typeof v === "string" || Array.isArray(v)) return v.length > 0;
  if (v !== null && typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}

/**
 * `sportsdataverse._codegen_runtime.bool_str`: a truthy value becomes `"true"`,
 * a falsy one `"false"` (Python truthiness, so `"false"` the string is truthy).
 */
export function bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return pyTruthy(value) ? "true" : "false";
}

/**
 * `sportsdataverse.nfl.nfl_api_runtime._bool_str`: `str(value).lower()`, so
 * `true` -> `"true"`, `"False"` -> `"false"`, `1` -> `"1"`.
 */
export function _bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return String(value).toLowerCase();
}

/**
 * `sportsdataverse._codegen_runtime.format_nhl_season`: a 4-digit end year
 * becomes the 8-digit api-web season (`2025` -> `"20242025"`); an 8-digit value
 * passes through as a string. Anything else throws.
 */
export function format_nhl_season(season: unknown): unknown {
  if (season === null || season === undefined) return season;
  const s = String(season);
  if (s.length === 8 && /^\d+$/.test(s)) return s;
  if (s.length === 4 && /^\d+$/.test(s)) return `${Number(s) - 1}${s}`;
  throw new Error(`Unrecognized NHL season ${JSON.stringify(season)}`);
}

// sdv-py `nba/nba_stats_runtime._FIRST_ROWS`: the month from which the newest season has
// rows, and how many years after the season's first year that month falls, keyed by league,
// by endpoint (any league) or by "league endpoint". Measured on stats.nba.com 2026-10-05 (the
// py comment has the dates). A Map, so an endpoint slug never hits Object.prototype.
const FIRST_ROWS = new Map<string, [month: number, lag: number]>([
  ["00", [11, 0]], // NBA: tips off late October
  ["20", [1, 1]], // G League: regular season from late December
  ["15", [8, 0]], // Summer League: July, labelled by its own year
  ["10", [6, 0]], // WNBA: tips off mid-May
  ["draftcombine", [6, 0]], // the mid-May combine, whichever league asks
  ["00 drafthistory", [7, 0]], // the late-June draft
  ["10 drafthistory", [5, 0]], // the mid-April draft
  ["00 playoffs", [5, 1]], // NBA playoffs and play-in: from mid-April of the season's second year
  ["20 playoffs", [5, 1]], // G League playoffs: from late March / early April
  ["10 playoffs", [10, 0]], // WNBA playoffs: from mid-September
  ["00 allstar", [3, 1]], // NBA All-Star: mid-February of the season's second year
  ["10 allstar", [8, 0]], // WNBA All-Star: mid-to-late July
]);

/**
 * sdv-py `nba_stats_runtime._latest_season`: the latest season that has rows on `today`
 * (local date, as py's `date.today()`), labelled for `leagueId`: `"2025-26"` for the NBA,
 * G League (`"20"`) and Summer League (`"15"`), a year for the WNBA (`"10"`) and for
 * `drafthistory`. `endpoint` picks the draft rules, `commonplayoffseries` or a `seasonType`
 * of `Playoffs` / `PlayIn` the playoff rule, and `All Star` the All-Star rule.
 */
export function latestSeason(
  leagueId: string = "00",
  endpoint: string = "",
  today: Date = new Date(),
  seasonType?: unknown
): string {
  if (endpoint === "commonplayoffseries" || seasonType === "Playoffs" || seasonType === "PlayIn") {
    endpoint = "playoffs"; // a season's playoffs have rows months after its first games
  } else if (seasonType === "All Star") {
    endpoint = "allstar"; // so does its All-Star game
  } else if (endpoint.startsWith("draftcombine")) {
    endpoint = "draftcombine";
  }
  const [month, lag] =
    FIRST_ROWS.get(endpoint) ?? FIRST_ROWS.get(`${leagueId} ${endpoint}`) ?? FIRST_ROWS.get(leagueId) ?? FIRST_ROWS.get("00")!;
  const start = today.getFullYear() - lag - (today.getMonth() + 1 < month ? 1 : 0);
  return leagueId === "10" || endpoint === "drafthistory" ? String(start) : `${start}-${String(start + 1).slice(2)}`;
}

/**
 * sdv-py `_DefaultSeason`: a season the wrapper filled in (not the caller's).
 * `redateDefaultSeasons` dates it for the request's league, endpoint and SeasonType.
 */
export class DefaultSeason extends String {}

/**
 * `sportsdataverse.{nba,wnba}.*_stats_runtime.season_latest_with_data`: the season
 * unchanged (an explicit `""` too: every season), or, when unset, the latest season
 * that has data. Resolved per call, so a long-running process rolls over too; the
 * flat resolver re-dates it per league, endpoint and SeasonType (`redateDefaultSeasons`).
 */
export function season_latest_with_data(season: unknown, def?: { api?: string }): unknown {
  if (season !== null && season !== undefined) return season;
  return new DefaultSeason(latestSeason(def?.api === "wnba_stats" ? "10" : "00"));
}

/**
 * The re-dating in sdv-py `nba_stats_runtime._get`: each wrapper-filled `Season` /
 * `SeasonYear` becomes the latest season with rows for the request's `LeagueID` (else the
 * host's league), endpoint (the path's last segment) and `SeasonType`.
 */
export function redateDefaultSeasons(
  def: { host?: string; path?: string },
  query: Record<string, any>,
  today: Date = new Date()
): void {
  for (const key of ["Season", "SeasonYear"]) {
    if (!(query[key] instanceof DefaultSeason)) continue;
    const league = String(query.LeagueID || ((def.host ?? "").includes("wnba") ? "10" : "00"));
    const endpoint = (def.path ?? "").replace(/\/+$/, "").split("/").pop() ?? "";
    query[key] = latestSeason(league, endpoint, today, query.SeasonType);
  }
}

/** Every transform the endpoint YAML may name, keyed by its sdv-py name. */
export const TRANSFORMS: Record<string, ParamTransform> = {
  bool_str,
  _bool_str,
  format_nhl_season,
  season_latest_with_data,
};

/** Apply the named transform to `value` (no name: unchanged; unknown name: throws). */
export function applyTransform(name: string | undefined, value: unknown, def?: { api?: string }): unknown {
  if (!name) return value;
  const fn = TRANSFORMS[name];
  if (!fn) throw new Error(`unknown param transform "${name}"`);
  return fn(value, def);
}
