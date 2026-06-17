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
  mlb_api: "https://statsapi.mlb.com",
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
