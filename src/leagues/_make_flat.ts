import { get } from "../core/client.js";
import { resolveFlat } from "../core/flat.js";
import { toCamel } from "../core/espn.js";
import { parserFor } from "../parsers/_registry.js";
import type { WrapperDef, WrapperFn } from "../core/types.js";

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
 * @param defs Flat `WrapperDef`s (those with `flat: true` for this api stem).
 */
export function makeFlatModule(defs: WrapperDef[]): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const def of defs) {
    const fn: WrapperFn = async (params = {}) => {
      const { url, query } = resolveFlat(def, params);
      const raw = await get(url, { params: query });
      const parser = params.parsed ? parserFor(def.parser) : undefined;
      return parser ? parser(raw) : raw;
    };
    const snake = `${def.api}_${def.short}`;
    mod[snake] = fn; // py/R-parity alias
    mod[toCamel(snake)] = fn; // mlbApiTeams — idiomatic JS canonical
  }
  return mod;
}
