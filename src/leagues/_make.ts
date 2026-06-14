import { WRAPPER_TABLES, callWrapper, toCamel } from "../core/espn.js";
import type { LeagueConfig, WrapperFn } from "../core/types.js";

/**
 * Build a league's cross-league ESPN surface: for each wrapper in the league's
 * scopes, expose it under BOTH names, resolving to the same function:
 *   - `espnNbaScoreboard(params)` — camelCase, the idiomatic JS canonical name
 *   - `espn_nba_scoreboard(params)` — snake_case alias, for parity with the
 *     `sportsdataverse-py` / R packages.
 * The JS analogue of sdv-py's `make_league_module`.
 */
export function makeLeagueModule(
  cfg: LeagueConfig
): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const scope of cfg.scopes) {
    for (const def of WRAPPER_TABLES[scope] ?? []) {
      const snake = `espn_${cfg.prefix}_${def.short}`;
      const fn: WrapperFn = (params = {}) => callWrapper(def, cfg, params);
      mod[snake] = fn; // py/R-parity alias
      mod[toCamel(snake)] = fn; // espnNbaScoreboard — idiomatic JS canonical
    }
  }
  return mod;
}
