import axios, { type AxiosRequestConfig } from "axios";
import type { EspnFamily } from "./types.js";

/**
 * Base hosts for each ESPN URL family. Wrapper `path` templates are
 * host-relative and already include the league nesting (`/{sport}/{league}/...`
 * for the site families, `/{sport}/leagues/{league}/...` for the Core API).
 */
export const HOSTS: Record<EspnFamily, string> = {
  site_v2: "https://site.api.espn.com/apis/site/v2/sports",
  site_v2_alt: "https://site.api.espn.com/apis/v2/sports",
  web_v3: "https://site.web.api.espn.com/apis/common/v3/sports",
  core_v2: "https://sports.core.api.espn.com/v2/sports",
};

/**
 * Base hosts for the non-ESPN "flat API" families, keyed by family stem
 * (`WrapperDef.api`). Unlike `HOSTS`, these are absolute API roots; the flat
 * wrapper `path` templates are appended verbatim (with `{token}` substitution).
 * Each wrapper also carries its own absolute `host` for self-containment — this
 * map is the canonical lookup the playground / proxy can share.
 */
export const FLAT_HOSTS: Record<string, string> = {
  mlb: "https://statsapi.mlb.com",
  // Baseball Savant / Statcast (heterogeneous CSV/JSON/HTML — see
  // src/core/statcast_runtime.ts for the content-type-aware getter).
  mlb_statcast: "https://baseballsavant.mlb.com",
  // NHL native APIs. `nhl_api_web` and `nhl_edge` are separate `api` stems
  // that share the same host (api-web.nhle.com); the Stats REST and Records
  // families each have their own host.
  nhl_api_web: "https://api-web.nhle.com",
  nhl_edge: "https://api-web.nhle.com",
  nhl_stats_rest: "https://api.nhle.com/stats/rest",
  nhl_records: "https://records.nhl.com/site/api",
  // NFL.com "Shield" API (token-auth; the wrapper dispatch mints a WEB_DESKTOP
  // bearer token — see src/core/nfl_auth.ts).
  nfl_api: "https://api.nfl.com",
  // The Odds API — the first cross-sport (non-league) provider family. Merges
  // onto the standalone `odds` namespace (sdv.odds.*). No bearer auth: the
  // caller passes `api_key` as a plain `apiKey` query param on every call.
  odds_api: "https://api.the-odds-api.com",
  // 247Sports Recruit Database — second cross-sport (non-league) provider
  // family. Merges onto the standalone `recruiting` namespace
  // (sdv.recruiting.*). The spec declares a JWT `Authorization: Bearer` header
  // but there is no public token-minting machinery, so this family is NOT
  // `auth: true`; the caller supplies their own token via the flat `headers`
  // arg (sdv.recruiting.sports247_rankings({ headers: { Authorization: … } })).
  sports247: "https://api.247sports.com",
  // CBS Sports API — third cross-sport (non-league) provider family. Merges
  // onto the standalone `cbs` namespace (sdv.cbs.*). The CBS data resources are
  // anonymously reachable (the spec ships no securityScheme), so this family is
  // NOT `auth: true` — no token, no required `headers`.
  cbs: "https://api.cbssports.com",
  // Fox Sports API — fourth cross-sport (non-league) provider family.
  // Merges onto the standalone `fox` namespace (sdv.fox.*). Auth is a public
  // apikey + api-version query pair (both default in the wrapper metadata), so
  // this family is NOT `auth: true` — no account/token, no required `headers`.
  fox: "https://api.foxsports.com",
  // Yahoo Sports — fifth (and final) cross-sport (non-league) provider family.
  // TWO api stems on TWO hosts share the standalone `yahoo` namespace
  // (sdv.yahoo.*): scores (api-secure.sports.yahoo.com) + stats-graph
  // (graphite-secure.sports.yahoo.com). Keyless (the specs ship no
  // securityScheme), so NOT `auth: true` — Yahoo rejects requests without
  // browser-y Origin/Referer, which the caller supplies via the flat `headers`.
  yahoo_scores: "https://api-secure.sports.yahoo.com",
  yahoo: "https://graphite-secure.sports.yahoo.com",
  // HockeyTech / LeagueStat — standalone `hockeytech` namespace (sdv.hockeytech.*)
  // for the PWHL + junior/minor leagues. This is the DEFAULT feed host (4 of 5
  // leagues); QMJHL is served from cluster.leaguestat.com, which the family's
  // content-type-aware JSONP getter (src/core/hockeytech_runtime.ts) selects
  // per-league. Responses are JSONP, so this family registers that getter in
  // GETTER_OVERRIDES (src/leagues/_make_flat.ts) instead of the shared `get`.
  hockeytech: "https://lscluster.hockeytech.com",
  // BartTorvik / T-Rank — standalone `torvik` namespace (sdv.torvik.*) for
  // men's college basketball analytics. Keyless, but barttorvik.com rejects
  // default programmatic User-Agents, so the family's getter
  // (src/core/torvik_runtime.ts) sets a browser UA + returns the raw body text
  // (the endpoints mix CSV / JSON) — registered in GETTER_OVERRIDES.
  torvik: "https://barttorvik.com",
};

const client = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; sportsdataverse-js/3.x; +https://js.sportsdataverse.org/)",
  },
});

/** GET an ESPN URL and return the raw JSON body. */
export async function get(
  url: string,
  config?: AxiosRequestConfig
): Promise<any> {
  const res = await client.get(url, config);
  return res.data;
}
