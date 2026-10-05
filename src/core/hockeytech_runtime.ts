// HockeyTech / LeagueStat runtime for the generated `hockeytech` flat wrappers.
// Faithful port of the Python `sportsdataverse/hockeytech/_leagues.py` +
// `_client.py`: the league registry, the JSONP URL builder (with the `gc` feed's
// `tab=` quirk + the PWHL play-by-play key override), and the content getter
// that strips the `angular.callbacks._N(...)` wrapper before JSON.parse.
//
// HockeyTech serves every league from one feed gateway (`/feed/index.php`);
// the league is chosen by a `league` query param the wrapper carries. The
// shared no-auth getter (`src/core/client.ts` `get`) can't parse the JSONP
// body, and the per-league host / key / client_code / site_id all have to be
// injected, so this family registers `hockeytechGet` in GETTER_OVERRIDES
// (src/leagues/_make_flat.ts).

import axios, { type AxiosRequestConfig } from "axios";
import { parse_hockeytech_seasons } from "../parsers/hockeytech.js";

/** A HockeyTech league's web-client defaults (public, shipped in each site's JS). */
export interface HockeytechLeague {
  /** Display name (e.g. `"PWHL"`). */
  name: string;
  /** Feed `client_code` (note QMJHL's is `lhjmq`, not `qmjhl`). */
  clientCode: string;
  /** Default feed `key`. */
  apiKey: string;
  /** League id used by the scorebar / standings views. */
  leagueId: number;
  /** Feed `site_id`. */
  siteId: number;
  /** Absolute feed base URL (host differs for QMJHL — cluster.leaguestat.com). */
  baseUrl: string;
  /** Play-by-play coordinate-canvas dialect: `hockeytech_a` ~850x400, `hockeytech_b` ~600x300. */
  pbpStyle: "hockeytech_a" | "hockeytech_b";
  /** Regulation-OT length in seconds (informational). */
  otPeriodLength: number;
}

const LSCLUSTER = "https://lscluster.hockeytech.com/feed/index.php";
const LEAGUESTAT = "https://cluster.leaguestat.com/feed/index.php";

/**
 * League registry (values lifted from the canonical sdv-py `_leagues.py`, in
 * turn from maxtixador/scrapernhl). Each league's `key` can be overridden at
 * runtime with the `SDV_<LEAGUE>_API_KEY` environment variable.
 */
export const HOCKEYTECH_LEAGUES: Record<string, HockeytechLeague> = {
  // ushl: PBP ships goals/penalties/goalie changes only (no coordinates).
  // mjhl: its public key has NO gamecenter access, so pbp/game_summary come back empty.
  // New-league pbpStyle defaults to hockeytech_b until a coordinate-range probe says otherwise.
  pwhl: { name: "PWHL", clientCode: "pwhl", apiKey: "446521baf8c38984", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_a", otPeriodLength: 600 },
  ahl: { name: "AHL", clientCode: "ahl", apiKey: "ccb91f29d6744675", leagueId: 4, siteId: 3, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_a", otPeriodLength: 300 },
  ohl: { name: "OHL", clientCode: "ohl", apiKey: "f1aa699db3d81487", leagueId: 1, siteId: 1, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  whl: { name: "WHL", clientCode: "whl", apiKey: "f1aa699db3d81487", leagueId: 7, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  qmjhl: { name: "QMJHL", clientCode: "lhjmq", apiKey: "f322673b6bcae299", leagueId: 6, siteId: 0, baseUrl: LEAGUESTAT, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  echl: { name: "ECHL", clientCode: "echl", apiKey: "2c2b89ea7345cae8", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  sphl: { name: "SPHL", clientCode: "sphl", apiKey: "8fa10d218c49ec96", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  chl: { name: "CHL", clientCode: "chl", apiKey: "ef96ea7d71574f2a", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  ushl: { name: "USHL", clientCode: "ushl", apiKey: "e828f89b243dc43f", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  bchl: { name: "BCHL", clientCode: "bchl", apiKey: "f3ed30007ad2124e", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  ajhl: { name: "AJHL", clientCode: "ajhl", apiKey: "cbe60a1d91c44ade", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  sjhl: { name: "SJHL", clientCode: "sjhl", apiKey: "2fb5c2e84bf3e4a8", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  ojhl: { name: "OJHL", clientCode: "ojhl", apiKey: "cce66dd6bebf4790", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  cchl: { name: "CCHL", clientCode: "cchl", apiKey: "b370f3e6c805baf3", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  gojhl: { name: "GOJHL", clientCode: "gojhl", apiKey: "34b10d4d34d7b59a", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  mhl: { name: "MHL", clientCode: "mhl", apiKey: "4a948e7faf5ee58d", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  nojhl: { name: "NOJHL", clientCode: "nojhl", apiKey: "c1375ff55168bd71", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  vijhl: { name: "VIJHL", clientCode: "vijhl", apiKey: "4f1a61df18906b61", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  kijhl: { name: "KIJHL", clientCode: "kijhl", apiKey: "2589e0f644b1bb71", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
  mjhl: { name: "MJHL", clientCode: "mjhl", apiKey: "f894c324fe5fd8f0", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER, pbpStyle: "hockeytech_b", otPeriodLength: 300 },
};

/**
 * `gameCenterPlayByPlay` uses a distinct key for PWHL on the statviewfeed PBP
 * view (observed live). Other leagues reuse their default key until proven
 * otherwise; add a `(league)` entry here if a different one is needed.
 */
const PBP_KEY_OVERRIDES: Record<string, string> = { pwhl: "694cfeed58c932ee" };

/** League-specific Referer headers (HockeyTech is lenient, but mirror the site). */
const LEAGUE_REFERER: Record<string, string> = {
  pwhl: "https://www.thepwhl.com/",
  ahl: "https://www.theahl.com/",
  ohl: "https://www.ontariohockeyleague.com/",
  whl: "https://www.whl.ca/",
  qmjhl: "https://www.theqmjhl.ca/",
};

const UA = "Mozilla/5.0 (compatible; sportsdataverse-js/3.x; +https://js.sportsdataverse.org/)";

const LEAGUE_ID_VIEWS = new Set(["scorebar", "transactions", "brackets", "teams"]);

/** Resolve the league config, honouring an env-var key override. */
export function resolveLeague(league: string): HockeytechLeague {
  const cfg = HOCKEYTECH_LEAGUES[league];
  if (!cfg) {
    throw new Error(
      `Unknown HockeyTech league ${JSON.stringify(league)}; expected one of ${Object.keys(HOCKEYTECH_LEAGUES).join(", ")}`
    );
  }
  return cfg;
}

/** The API key for a (league, view): env override > PBP override > default. */
export function resolveApiKey(league: string, view?: string): string {
  const env =
    typeof process !== "undefined" && process.env
      ? process.env[`SDV_${league.toUpperCase()}_API_KEY`]
      : undefined;
  if (env) return env;
  if (view === "gameCenterPlayByPlay" && PBP_KEY_OVERRIDES[league]) return PBP_KEY_OVERRIDES[league];
  return resolveLeague(league).apiKey;
}

/**
 * Strip an `angular.callbacks._N( ... )` (or bare `( ... )`) JSONP wrapper.
 * Faithful port of `_client._strip_jsonp`.
 */
export function stripJsonp(text: string): string {
  let t = text.trim();
  if (/^[A-Za-z_$][\w.$]*\(/.test(t) && t.endsWith(")")) {
    t = t.slice(t.indexOf("(") + 1, -1);
  } else if (t.startsWith("(") && t.endsWith(")")) {
    t = t.slice(1, -1);
  }
  return t.trim();
}

/**
 * Build the full HockeyTech feed URL from the resolved wrapper query params.
 *
 * `params` is the cleaned query the flat resolver produced — it carries the
 * control inputs `league`, `feed`, `view`, plus the per-view params. This pulls
 * `league`/`feed`/`view` out, injects `key`/`client_code`/`site_id`/`lang`,
 * applies the `gc`-feed `tab=` quirk + the per-view key override, and appends
 * the remaining params verbatim (dropping `undefined`/`null`/`""`). Returns the
 * absolute URL (the per-league base host) — exported so it is unit-testable
 * without network.
 */
export function buildHockeytechUrl(params: Record<string, any>): string {
  const { league, feed = "modulekit", view, ...rest } = params ?? {};
  if (!league) throw new Error("hockeytech: missing required `league` param");
  const cfg = resolveLeague(String(league));
  const sp = new URLSearchParams();
  sp.set("feed", String(feed));
  sp.set("key", resolveApiKey(String(league), view !== undefined ? String(view) : undefined));
  sp.set("client_code", cfg.clientCode);
  sp.set("site_id", String(cfg.siteId));
  sp.set("lang", "en");
  // The `gc` feed selects its view with `tab=`; every other feed uses `view=`.
  if (view !== undefined && view !== null && view !== "") {
    sp.set(feed === "gc" ? "tab" : "view", String(view));
  }
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  // sdv-py sends the registry `league_id` on these views (schedule/scorebar,
  // standings, transactions, brackets); an explicit `league_id` param wins.
  if (LEAGUE_ID_VIEWS.has(String(view)) && !sp.has("league_id")) sp.set("league_id", String(cfg.leagueId));
  return `${cfg.baseUrl}?${sp.toString()}`;
}

const client = axios.create({
  timeout: 30000,
  responseType: "text",
  transformResponse: [(data) => data], // hand back raw text; we strip + parse ourselves
});

/**
 * GET a HockeyTech feed and return parsed JSON (object/array), or `{}` on
 * failure so JSON consumers can chain without a null-check.
 *
 * Signature matches `core/client.ts` `get` so it slots into the flat dispatch's
 * GETTER_OVERRIDES. The `url` arg (the gateway `/feed/index.php` the flat
 * resolver built) is ignored — the real per-league URL is assembled here from
 * `config.params` — so the wrapper's declared host/path stays a stable, valid
 * stand-in for the no-network contract test + playground metadata.
 */
export async function hockeytechGet(
  _url: string,
  config?: AxiosRequestConfig
): Promise<any> {
  const params = (config?.params ?? {}) as Record<string, any>;
  let target: string;
  try {
    target = buildHockeytechUrl(params);
  } catch {
    return {};
  }
  const referer = params.league ? LEAGUE_REFERER[String(params.league)] : undefined;
  const headers: Record<string, string> = { "User-Agent": UA, Accept: "application/json" };
  if (referer) headers.Referer = referer;
  let res;
  try {
    res = await client.get(target, { headers });
  } catch {
    return {};
  }
  if (res == null || res.data == null) return {};
  const body = typeof res.data === "string" ? res.data : String(res.data);
  try {
    return JSON.parse(stripJsonp(body));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Season-id resolution (py `resolve_season_id` / `<lg>_season_id` /
// `most_recent_<lg>_season`).
// ---------------------------------------------------------------------------

/** Hardcoded PWHL fallback (from fastRhockey) used when the live seasons feed is unreachable. */
const PWHL_SEASON_FALLBACK = [
  { season_id: 1, season_yr: 2024, game_type_label: "regular" },
  { season_id: 3, season_yr: 2024, game_type_label: "playoffs" },
  { season_id: 5, season_yr: 2025, game_type_label: "regular" },
  { season_id: 6, season_yr: 2025, game_type_label: "playoffs" },
  { season_id: 8, season_yr: 2026, game_type_label: "regular" },
];

/** All of a league's seasons (tidy rows incl. `season_yr` + `game_type_label`) — py `<lg>_season_id`. */
export async function hockeytechSeasonId(league: string): Promise<Record<string, any>[]> {
  resolveLeague(league); // throw early on an unknown league
  const raw = await hockeytechGet("", { params: { league, feed: "modulekit", view: "seasons" } });
  return parse_hockeytech_seasons(raw);
}

/** Most-recent season as an end-year integer (max `season_yr`), or 2026 — py `most_recent_<lg>_season`. */
export async function mostRecentHockeytechSeason(league: string): Promise<number> {
  const yrs = (await hockeytechSeasonId(league))
    .map((r) => Number(r.season_yr))
    .filter((n) => Number.isFinite(n));
  return yrs.length ? Math.max(...yrs) : 2026;
}

/**
 * Resolve an end-year `season` (e.g. 2025) to the integer HockeyTech `season_id`
 * — py `resolve_season_id`. An explicit `seasonId` short-circuits. PWHL falls
 * back to a hardcoded table if the live feed is unreachable/empty; anything
 * else unresolved throws.
 */
export async function resolveSeasonId(
  league: string,
  opts: { season?: number; seasonId?: number; gameType?: "regular" | "playoffs" | "preseason" } = {}
): Promise<number> {
  const { season, seasonId, gameType = "regular" } = opts;
  if (seasonId !== undefined && seasonId !== null) return Number(seasonId);
  if (season === undefined || season === null) throw new Error("Provide either season (end-year) or seasonId");
  const hit = (await hockeytechSeasonId(league)).find(
    (r) => Number(r.season_yr) === Number(season) && r.game_type_label === gameType
  );
  if (hit) return Number(hit.season_id);
  if (league === "pwhl") {
    const fb = PWHL_SEASON_FALLBACK.find((r) => r.season_yr === Number(season) && r.game_type_label === gameType);
    if (fb) return fb.season_id;
  }
  throw new Error(`No ${league} season for season=${season}, gameType=${gameType}`);
}
