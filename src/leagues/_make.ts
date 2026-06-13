import { WRAPPER_TABLES, callWrapper } from "../core/espn.js";
import type { LeagueConfig, WrapperFn } from "../core/types.js";

/**
 * Build a league's cross-league ESPN surface: for each wrapper in the league's
 * scopes, expose `espn_<prefix>_<short>(params)`. The JS analogue of sdv-py's
 * `make_league_module`.
 */
export function makeLeagueModule(
  cfg: LeagueConfig
): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const scope of cfg.scopes) {
    for (const def of WRAPPER_TABLES[scope] ?? []) {
      mod[`espn_${cfg.prefix}_${def.short}`] = (params = {}) =>
        callWrapper(def, cfg, params);
    }
  }
  return mod;
}
