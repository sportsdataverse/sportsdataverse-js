import { get } from "../core/client.js";
import { resolveFlat } from "../core/flat.js";
import { toCamel } from "../core/espn.js";
import { nflHeadersGen } from "../core/nfl_auth.js";
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

/**
 * Build a league's non-ESPN "flat API" surface. For each flat wrapper, expose
 * it under BOTH names (same fn), the same dual-case pattern as the ESPN
 * wrappers:
 *   - `mlb_api_teams(params)` — snake_case (py/R parity),
 *   - `mlbApiTeams(params)`   — camelCase canonical (idiomatic JS).
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
export function makeFlatModule(defs: WrapperDef[]): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const def of defs) {
    const fn: WrapperFn = async (params = {}) => {
      const { url, query } = resolveFlat(def, params);
      let headers: Record<string, string> | undefined;
      if (def.auth) {
        const provider = def.api ? AUTH_HEADER_PROVIDERS[def.api] : undefined;
        headers = (params.headers as Record<string, string> | undefined) ??
          (provider ? await provider() : undefined);
      }
      const raw = await get(url, { params: query, headers });
      const parser = params.parsed ? parserFor(def.parser) : undefined;
      return parser ? parser(raw) : raw;
    };
    const snake = `${def.api}_${def.short}`;
    mod[snake] = fn; // py/R-parity alias
    mod[toCamel(snake)] = fn; // mlbApiTeams — idiomatic JS canonical
  }
  return mod;
}
