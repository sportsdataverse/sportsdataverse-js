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
 *
 * @remarks Every member of {@link TRANSFORMS} has this shape; `def` is only read by
 *   {@link season_latest_with_data}.
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
 *
 * @param value - The resolved param value. `null` / `undefined` pass through unchanged;
 *   anything else is tested with Python truthiness (`0`, `""`, `[]`, `{}` are falsy; `NaN`
 *   and any non-empty string are truthy).
 * @returns `"true"` / `"false"`, or the nullish input.
 * @remarks Python-parity quirk: `bool_str("false")` is `"true"`; use {@link _bool_str} for a
 *   lower-cased string form.
 * @example
 * ```ts
 * import { bool_str } from "./transforms.js";
 * bool_str(true);    // "true"
 * bool_str(0);       // "false"
 * bool_str("false"); // "true" (non-empty string)
 * ```
 */
export function bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return pyTruthy(value) ? "true" : "false";
}

/**
 * `sportsdataverse.nfl.nfl_api_runtime._bool_str`: `str(value).lower()`, so
 * `true` -> `"true"`, `"False"` -> `"false"`, `1` -> `"1"`.
 *
 * @param value - The resolved param value; `null` / `undefined` pass through unchanged.
 * @returns `String(value).toLowerCase()`, or the nullish input.
 * @remarks Not a truthiness test: `1` becomes `"1"`, not `"true"` (contrast {@link bool_str}).
 * @example
 * ```ts
 * import { _bool_str } from "./transforms.js";
 * _bool_str(true);    // "true"
 * _bool_str("False"); // "false"
 * ```
 */
export function _bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return String(value).toLowerCase();
}

/**
 * `sportsdataverse._codegen_runtime.format_nhl_season`: a 4-digit end year
 * becomes the 8-digit api-web season (`2025` -> `"20242025"`); an 8-digit value
 * passes through as a string. Anything else throws.
 *
 * @param season - A 4-digit END year (number or string) or an 8-digit `YYYYYYYY` season;
 *   `null` / `undefined` pass through unchanged.
 * @returns The 8-digit season as a string, or the nullish input.
 * @throws Error `Unrecognized NHL season <json>` for any other value (e.g. `"24-25"`, `202425`).
 * @remarks The 4-digit input is the season's END year, so `2025` is 2024-25.
 * @example
 * ```ts
 * import { format_nhl_season } from "./transforms.js";
 * format_nhl_season(2025);       // "20242025"
 * format_nhl_season("20232024"); // "20232024"
 * ```
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
 *
 * @param leagueId - stats.nba.com `LeagueID`: `"00"` NBA (default), `"20"` G League, `"15"`
 *   Summer League, `"10"` WNBA. An unknown id falls back to the NBA calendar.
 * @param endpoint - The endpoint slug (the request path's last segment), default `""`. Any
 *   `draftcombine*` slug uses the combine rule, `drafthistory` the draft rule and
 *   `commonplayoffseries` the playoff rule; other slugs use the league's rule.
 * @param today - The date to evaluate on; defaults to `new Date()` (local time).
 * @param seasonType - The request's `SeasonType`: `"Playoffs"` / `"PlayIn"` select the playoff
 *   rule, `"All Star"` the All-Star rule; anything else is ignored.
 * @returns `"YYYY-YY"` for the NBA, G League and Summer League; `"YYYY"` for the WNBA and for
 *   `drafthistory` in any league.
 * @remarks The first-rows month and year lag per (league, endpoint) were measured on
 *   stats.nba.com 2026-10-05; the lookup order is endpoint alone, then `"<league> <endpoint>"`,
 *   then the league. A lockout or pandemic calendar needs an explicit season.
 * @example
 * ```ts
 * import { latestSeason } from "./transforms.js";
 * latestSeason("00", "", new Date(2026, 9, 5));                     // "2025-26" (October: not yet 2026-27)
 * latestSeason("10", "", new Date(2026, 9, 5));                     // "2026"
 * latestSeason("00", "leaguegamelog", new Date(2026, 9, 5), "Playoffs"); // "2025-26"
 * ```
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
 *
 * @remarks A `String` subclass, so it serialises like the label it wraps (`String(s)`,
 *   template literals) but is distinguishable with `instanceof DefaultSeason`. Only
 *   {@link season_latest_with_data} constructs it.
 */
export class DefaultSeason extends String {}

/**
 * `sportsdataverse.{nba,wnba}.*_stats_runtime.season_latest_with_data`: the season
 * unchanged (an explicit `""` too: every season), or, when unset, the latest season
 * that has data. Resolved per call, so a long-running process rolls over too; the
 * flat resolver re-dates it per league, endpoint and SeasonType (`redateDefaultSeasons`).
 *
 * @param season - The caller's season. Any non-nullish value (including `""`) is returned
 *   as-is; `null` / `undefined` are filled.
 * @param def - The flat wrapper's def; `def.api === "wnba_stats"` fills a WNBA year, any
 *   other (or no) def fills an NBA `"YYYY-YY"` label.
 * @returns The input, or a {@link DefaultSeason} wrapping `latestSeason("10" | "00")`.
 * @remarks The only transform that fills an unset param instead of passing it through. The
 *   filled value is a `DefaultSeason` (a `String` object, not a primitive); compare with
 *   `String(v)` or let {@link redateDefaultSeasons} replace it.
 * @example
 * ```ts
 * import { season_latest_with_data, latestSeason } from "./transforms.js";
 * season_latest_with_data("2023-24", { api: "nba_stats" });              // "2023-24"
 * season_latest_with_data("", { api: "wnba_stats" });                    // "" (every season)
 * String(season_latest_with_data(undefined, { api: "nba_stats" })) === latestSeason("00"); // true
 * ```
 */
export function season_latest_with_data(season: unknown, def?: { api?: string }): unknown {
  if (season !== null && season !== undefined) return season;
  return new DefaultSeason(latestSeason(def?.api === "wnba_stats" ? "10" : "00"));
}

/**
 * The re-dating in sdv-py `nba_stats_runtime._get`: each wrapper-filled `Season` /
 * `SeasonYear` becomes the latest season with rows for the request's `LeagueID` (else the
 * host's league), endpoint (the path's last segment) and `SeasonType`.
 *
 * @param def - The flat wrapper's def: `host` (a host containing `"wnba"` means league `"10"`,
 *   else `"00"`, when the query has no `LeagueID`) and `path` (its last segment is the endpoint).
 * @param query - The resolved query params, **mutated in place**: a `Season` / `SeasonYear`
 *   that is a {@link DefaultSeason} is replaced by a plain string label; caller-supplied
 *   values are left alone. `LeagueID` and `SeasonType` are read.
 * @param today - The date to evaluate on; defaults to `new Date()`.
 * @returns Nothing; the result is the mutation of `query`.
 * @remarks Only `DefaultSeason` values are touched, so an explicit season (even `""`) never
 *   changes. Called by the flat resolver after the transforms run.
 * @example
 * ```ts
 * import { redateDefaultSeasons, season_latest_with_data } from "./transforms.js";
 * const query = { Season: season_latest_with_data(undefined), SeasonType: "Playoffs" };
 * redateDefaultSeasons({ host: "stats.nba.com", path: "/stats/leaguegamelog" }, query);
 * typeof query.Season; // "string" (e.g. "2025-26", dated by the playoff rule)
 * ```
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

/**
 * Every transform the endpoint YAML may name, keyed by its sdv-py name.
 *
 * @remarks The codegen's `tools/codegen/param-transforms.mjs` list and the docs playground
 *   copy must stay equal to this table (a test asserts it); add a transform in all three.
 */
export const TRANSFORMS: Record<string, ParamTransform> = {
  bool_str,
  _bool_str,
  format_nhl_season,
  season_latest_with_data,
};

/**
 * Apply the named transform to `value` (no name: unchanged; unknown name: throws).
 *
 * @param name - A key of {@link TRANSFORMS}, or `undefined` / `""` for no transform.
 * @param value - The resolved param value (explicit or default).
 * @param def - The flat wrapper's def, forwarded to the transform (see {@link ParamTransform}).
 * @returns `value` unchanged when `name` is empty, else the transform's result.
 * @throws Error `unknown param transform "<name>"` when `name` is non-empty and not in
 *   {@link TRANSFORMS}.
 * @example
 * ```ts
 * import { applyTransform } from "./transforms.js";
 * applyTransform(undefined, 7);                  // 7
 * applyTransform("format_nhl_season", 2025);     // "20242025"
 * ```
 */
export function applyTransform(name: string | undefined, value: unknown, def?: { api?: string }): unknown {
  if (!name) return value;
  const fn = TRANSFORMS[name];
  if (!fn) throw new Error(`unknown param transform "${name}"`);
  return fn(value, def);
}
