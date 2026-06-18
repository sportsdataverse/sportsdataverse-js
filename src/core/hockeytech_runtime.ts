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
}

const LSCLUSTER = "https://lscluster.hockeytech.com/feed/index.php";
const LEAGUESTAT = "https://cluster.leaguestat.com/feed/index.php";

/**
 * League registry (values lifted from the canonical sdv-py `_leagues.py`, in
 * turn from maxtixador/scrapernhl). Each league's `key` can be overridden at
 * runtime with the `SDV_<LEAGUE>_API_KEY` environment variable.
 */
export const HOCKEYTECH_LEAGUES: Record<string, HockeytechLeague> = {
  pwhl: { name: "PWHL", clientCode: "pwhl", apiKey: "446521baf8c38984", leagueId: 1, siteId: 0, baseUrl: LSCLUSTER },
  ahl: { name: "AHL", clientCode: "ahl", apiKey: "ccb91f29d6744675", leagueId: 4, siteId: 3, baseUrl: LSCLUSTER },
  ohl: { name: "OHL", clientCode: "ohl", apiKey: "f1aa699db3d81487", leagueId: 1, siteId: 1, baseUrl: LSCLUSTER },
  whl: { name: "WHL", clientCode: "whl", apiKey: "f1aa699db3d81487", leagueId: 7, siteId: 0, baseUrl: LSCLUSTER },
  qmjhl: { name: "QMJHL", clientCode: "lhjmq", apiKey: "f322673b6bcae299", leagueId: 6, siteId: 0, baseUrl: LEAGUESTAT },
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
