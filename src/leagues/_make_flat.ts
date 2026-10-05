import { get } from "../core/client.js";
import { resolveFlat } from "../core/flat.js";
import { toCamel } from "../core/espn.js";
// Side-effect import: registers the `nfl_api` bearer-token auth provider
// (registerFamilyDefaults). Auth for every family is applied inside `request()`
// from the provider registered / configured for the wrapper's `api` stem.
import "../core/nfl_auth.js";
import { statcastGet } from "../core/statcast_runtime.js";
import { hockeytechGet } from "../core/hockeytech_runtime.js";
import { torvikGet } from "../core/torvik_runtime.js";
import { nbaStatsGet } from "../core/nba_stats_runtime.js";
import { parserFor } from "../parsers/_registry.js";
import { aliasesFor, withDeprecatedAliases } from "../core/deprecation.js";
import { FLAT_DEPRECATED_ALIASES } from "../generated/aliases.js";
import type { WrapperDef, WrapperFn } from "../core/types.js";

/** A flat-API getter: same shape as `core/client.ts` `get`. */
type GetterFn = (
  url: string,
  config: { params?: any; headers?: any; family: string }
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
  const getter: GetterFn = (def.api ? GETTER_OVERRIDES[def.api] : undefined) ?? get;
  const { url, query } = resolveFlat(def, params);
  // Flat defs always carry their `api` stem (codegen); get() guards it at runtime.
  const raw = await getter(url, { params: query, headers: params.headers, family: def.api! });
  const parser = params.parsed ? parserFor(def.parser) : undefined;
  return parser ? parser(raw) : raw;
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
