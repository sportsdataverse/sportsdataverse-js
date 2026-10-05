import { WRAPPER_TABLES, callWrapper, toCamel } from "../core/espn.js";
import { aliasesFor, withDeprecatedAliases } from "../core/deprecation.js";
import { ESPN_DEPRECATED_ALIASES } from "../generated/aliases.js";
import { LEAGUES } from "../generated/leagues.js";
import type { LeagueConfig, WrapperDef, WrapperFn } from "../core/types.js";

/**
 * A wrapper's v4 public snake_case name on a league: sdv-py's name
 * (`espn_nba_player_gamelog`, `espn_nba_player_stats_v3`). League-specific
 * overrides come from `cfg.publicShorts`, else from the generated league of the
 * same prefix.
 */
export function espnPublicName(cfg: LeagueConfig, def: WrapperDef): string {
  const overrides = cfg.publicShorts ?? LEAGUES.find((l) => l.prefix === cfg.prefix)?.publicShorts;
  return `espn_${cfg.prefix}_${overrides?.[def.short] ?? def.publicShort ?? def.short}`;
}

/**
 * Build a league's cross-league ESPN surface: for each wrapper in the league's
 * scopes, expose it under BOTH names, resolving to the same function:
 *   - `espnNbaScoreboard(params)` — camelCase, the idiomatic JS canonical name
 *   - `espn_nba_scoreboard(params)` — snake_case alias, for parity with the
 *     `sportsdataverse-py` / R packages.
 * Names are sdv-py's (v4); every pre-v4 name a rename replaced is registered as
 * a deprecated alias (src/core/deprecation.ts). The JS analogue of sdv-py's
 * `make_league_module`.
 */
export function makeLeagueModule(
  cfg: LeagueConfig
): Record<string, WrapperFn> {
  const mod: Record<string, WrapperFn> = {};
  for (const scope of cfg.scopes) {
    for (const def of WRAPPER_TABLES[scope] ?? []) {
      const snake = espnPublicName(cfg, def);
      const fn: WrapperFn = (params = {}) => callWrapper(def, cfg, params);
      mod[snake] = fn; // py/R-parity alias
      mod[toCamel(snake)] = fn; // espnNbaScoreboard — idiomatic JS canonical
    }
  }
  return withDeprecatedAliases(mod, aliasesFor(mod, ESPN_DEPRECATED_ALIASES[cfg.prefix]));
}
