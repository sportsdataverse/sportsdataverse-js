import { get } from "../core/client.js";
import { resolveFlat } from "../core/flat.js";
import { toCamel } from "../core/espn.js";
import { nflHeadersGen } from "../core/nfl_auth.js";
import { statcastGet } from "../core/statcast_runtime.js";
import { hockeytechGet } from "../core/hockeytech_runtime.js";
import { torvikGet } from "../core/torvik_runtime.js";
import { parserFor } from "../parsers/_registry.js";
import type { WrapperDef, WrapperFn } from "../core/types.js";

/**
 * Auth-header providers for flat-API families that require a bearer token,
 * keyed by the `api` stem. A wrapper marked `auth: true` resolves its request
 * headers through the provider for its `api` (unless the caller supplies
 * `params.headers`). Family-agnostic by design — only `nfl_api` plugs in today,
 * but future authenticated families add one entry here.
 */
const AUTH_HEADER_PROVIDERS: Record<
  string,
  () => Promise<Record<string, string>>
> = {
  nfl_api: nflHeadersGen,
};

/** A flat-API getter: same shape as `core/client.ts` `get`. */
type GetterFn = (url: string, config?: { params?: any; headers?: any }) => Promise<any>;

/**
 * Per-family fetch overrides, keyed by the `api` stem. A family whose responses
 * aren't plain JSON (e.g. Baseball Savant's CSV/HTML/JSON mix) registers a
 * content-type-aware getter here; everything else uses the shared no-auth `get`.
 * Family-agnostic by design — only `mlb_statcast` plugs in today. A family can
 * compose this with `auth: true` (the resolved headers are still threaded into
 * the getter's config), though only `mlb_statcast` needs an override so far.
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
};

/**
 * Build a league's non-ESPN "flat API" surface. For each flat wrapper, expose
 * it under BOTH names (same fn), the same dual-case pattern as the ESPN
 * wrappers:
 *   - `mlb_teams(params)` — snake_case (py/R parity),
 *   - `mlbTeams(params)`   — camelCase canonical (idiomatic JS).
 *
 * The wrapper resolves the request via `resolveFlat`, fetches the raw JSON, and
 * — only when the caller passes `{ parsed: true }` AND a parser is registered —
 * runs the payload through the parser. Omitting `parsed` returns the raw JSON,
 * so the dispatch is strictly additive (matches sdv-py's `return_parsed=True`).
 *
 * Authenticated families (`def.auth`, e.g. `nfl_api`) additionally resolve a
 * bearer-token header set before fetching: a caller-supplied `params.headers`
 * is reused when present, else the family's `AUTH_HEADER_PROVIDERS` entry mints
 * one (cached + auto-renewed). `params.headers` and `params.parsed` are control
 * keys — `resolveFlat` only reads declared path/query params, so neither leaks
 * into the query string.
 *
 * @param defs Flat `WrapperDef`s (those with `flat: true` for this api stem).
 */
/**
 * Make one flat-API call (the flat analogue of `callWrapper`): pick the family
 * getter (content-type / JSONP / UA overrides), resolve the URL + query from the
 * def, thread an auth-bearer header when `def.auth` (caller-supplied or minted),
 * fetch, and route through the parser only when `{ parsed: true }`. Shared by
 * `makeFlatModule` AND the generated written flat modules
 * (`src/generated/flat/<api>.ts`), so both resolve identically.
 */
export async function callFlat(
  def: WrapperDef,
  params: Record<string, any> = {}
): Promise<any> {
  const getter: GetterFn = (def.api ? GETTER_OVERRIDES[def.api] : undefined) ?? get;
  const { url, query } = resolveFlat(def, params);
  let headers: Record<string, string> | undefined;
  if (def.auth) {
    const provider = def.api ? AUTH_HEADER_PROVIDERS[def.api] : undefined;
    headers =
      (params.headers as Record<string, string> | undefined) ??
      (provider ? await provider() : undefined);
  }
  const raw = await getter(url, { params: query, headers });
  const parser = params.parsed ? parserFor(def.parser) : undefined;
  return parser ? parser(raw) : raw;
}

export function makeFlatModule(defs: WrapperDef[]): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const def of defs) {
    const fn: WrapperFn = (params = {}) => callFlat(def, params);
    const snake = `${def.api}_${def.short}`;
    mod[snake] = fn; // py/R-parity alias
    mod[toCamel(snake)] = fn; // mlbTeams — idiomatic JS canonical
  }
  return mod;
}
