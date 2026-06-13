/** ESPN URL families, keyed to their host (see `HOSTS` in client.ts). */
export type EspnFamily = "site_v2" | "site_v2_alt" | "web_v3" | "core_v2";

/** Which wrapper tables apply to a league (mirrors sdv-py's scope flags). */
export type Scope = "universal" | "ncaa" | "football" | "mlb";

/**
 * A league's binding into the ESPN core: the ESPN `(sport, league)` slugs plus
 * the public `prefix` used in generated wrapper names (`espn_<prefix>_<short>`).
 */
export interface LeagueConfig {
  prefix: string;
  sport: string;
  league: string;
  scopes: Scope[];
}

/** A generated cross-league wrapper: `(params?) => Promise<raw ESPN JSON>`. */
export type WrapperFn = (params?: Record<string, any>) => Promise<any>;
