import { get } from "../core/client.js";
import { resolveFlat } from "../core/flat.js";
import { toCamel } from "../core/espn.js";
import { DEPRECATED_ENDPOINT_CODE, warnOnce } from "../core/deprecation.js";
// Side-effect import: registers the `nfl_api` bearer-token auth provider
// (registerFamilyDefaults). Auth for every family is applied inside `request()`
// from the provider registered / configured for the wrapper's `api` stem.
import "../core/nfl_auth.js";
import { statcastGet } from "../core/statcast_runtime.js";
import { hockeytechGet } from "../core/hockeytech_runtime.js";
// Subscription families: each module registers its auth / retry / error
// defaults on import and exports the getter the dispatch routes through.
import { pffApiGet } from "../core/pff_api_runtime.js";
import { nflProGet } from "../core/nfl_pro_runtime.js";
import { kenpomGet } from "../core/kenpom_runtime.js";
import { torvikGet, bartWbbGet } from "../core/torvik_runtime.js";
import { on3Get, mlsGet, nwslGet } from "../core/keyless_runtime.js";
// Also registers the 247 families' transport / guest-JWT auth defaults.
import { sports247Get, sports247SitePagesGet } from "../core/sports247_runtime.js";
import { nbaStatsGet } from "../core/nba_stats_runtime.js";
import { parserFor } from "../parsers/_registry.js";
import { aliasesFor, withDeprecatedAliases } from "../core/deprecation.js";
import { FLAT_DEPRECATED_ALIASES } from "../generated/aliases.js";
import { MULTI_TABLE_SECTIONS } from "../parsers/_frames.js";
import type { WrapperDef, WrapperFn } from "../core/types.js";

/**
 * A flat-API getter: same shape as `core/client.ts` `get`, plus `args` — the
 * caller's full params, for per-call controls that are not query params
 * (`api_key`, `strict`, `token`, `email` / `password`, …).
 */
type GetterFn = (
  url: string,
  config: { params?: any; headers?: any; family: string; args?: Record<string, any> }
) => Promise<any>;

/**
 * Per-family fetch overrides, keyed by the `api` stem. A family whose responses
 * aren't plain JSON (e.g. Baseball Savant's CSV/HTML/JSON mix) registers a
 * content-type-aware getter here; everything else uses the shared `get`. Every
 * getter fetches through `request()` under its family stem, so the configured
 * transport, auth, retry and error vocabulary apply to overrides too.
 */
const GETTER_OVERRIDES: Record<string, GetterFn> = {
  mlb_statcast: statcastGet,
  // HockeyTech responses are JSONP (`angular.callbacks._N({...})`) and the
  // per-league host / key / client_code / site_id all have to be injected from
  // the league registry — so this getter assembles the real URL from the
  // resolved query params, fetches, and strips the JSONP wrapper before parsing.
  hockeytech: hockeytechGet,
  // BartTorvik rejects default programmatic User-Agents and serves a mix of CSV
  // and JSON (one JSON endpoint even with a text/html content-type), so this
  // getter sets a browser UA and returns the raw body text for the parser.
  torvik: torvikGet,
  // Subscription families: bearer key + restricted-column warning (PFF), user
  // token + offset paging (NFL Pro), password-login session + HTML (KenPom).
  pff_api: pffApiGet,
  nfl_pro: nflProGet,
  kenpom: kenpomGet,
  // 247Sports: browser headers (+ the RDB's trailing slash); the guest JWT and
  // the impersonating transport come from the family defaults.
  sports247: sports247Get,
  sports247_site_pages: sports247SitePagesGet,
  // Women's T-Rank: same raw-text getter under the `bart_wbb` family.
  bart_wbb: bartWbbGet,
  // Keyless providers: browser UA (+ site Referer for MLS / NWSL).
  on3: on3Get,
  mls_api: mlsGet,
  nwsl_api: nwslGet,
  // stats.nba.com / stats.wnba.com: browser headers, sorted params, zero-padded
  // GameID, and a body check so a throttled blank / `{}` reply is a failure.
  nba_stats: nbaStatsGet,
  wnba_stats: nbaStatsGet,
};

/**
 * Make one flat-API call (the flat analogue of `callWrapper`): pick the family
 * getter (content-type / JSONP / UA overrides), resolve the URL + query from the
 * def, fetch through `request()` (which applies the family's auth provider —
 * caller-supplied `params.headers` win), and route through the parser only when
 * `{ parsed: true }`. Shared by `makeFlatModule` AND the generated written flat
 * modules (`src/generated/flat/<api>.ts`), so both resolve identically.
 */
export async function callFlat(
  def: WrapperDef,
  params: Record<string, any> = {}
): Promise<any> {
  if (def.deprecated) {
    const name = `${def.api}_${def.short}`;
    warnOnce(`endpoint:${name}`, `${name}() is deprecated: ${def.deprecated}`, {
      type: "DeprecationWarning",
      code: DEPRECATED_ENDPOINT_CODE,
    });
  }
  const getter: GetterFn = (def.api ? GETTER_OVERRIDES[def.api] : undefined) ?? get;
  const { url, query } = resolveFlat(def, params);
  // Flat defs always carry their `api` stem (codegen); get() guards it at runtime.
  const raw = await getter(url, { params: query, headers: params.headers, family: def.api!, args: params });
  const parser = params.parsed ? parserFor(def.parser) : undefined;
  // Multi-table parsers (sdv-py returns a dict of frames) take `section`; the rest
  // keep their one-argument contract.
  if (!parser) return raw;
  return def.parser && def.parser in MULTI_TABLE_SECTIONS ? parser(raw, params.section) : parser(raw);
}

/**
 * Build a flat-API family's surface from its `WrapperDef`s: each wrapper exposed
 * under BOTH `<api>_<short>` (snake_case, py/R parity) and `<api><Short>`
 * (camelCase canonical), both delegating to `callFlat`. This is the runtime-
 * factory path; the generated written flat modules (`src/generated/flat/<api>.ts`)
 * are the documented-source equivalent. Kept as a fallback / for direct use.
 *
 * @param defs Flat `WrapperDef`s for a single api stem.
 */
export function makeFlatModule(defs: WrapperDef[]): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  const aliases: Record<string, string> = {};
  for (const def of defs) {
    const fn: WrapperFn = (params = {}) => callFlat(def, params);
    const snake = def.publicName ?? `${def.api}_${def.short}`; // sdv-py's name (v4)
    mod[snake] = fn; // py/R-parity alias
    mod[toCamel(snake)] = fn; // mlbTeams — idiomatic JS canonical
    Object.assign(aliases, FLAT_DEPRECATED_ALIASES[def.api!]);
  }
  // Pre-v4 names a rename replaced stay callable as deprecated aliases.
  return withDeprecatedAliases(mod, aliasesFor(mod, aliases));
}
