/** ESPN URL families, keyed to their host (see `HOSTS` in client.ts). */
export type EspnFamily = "site_v2" | "site_v2_alt" | "web_v3" | "core_v2";

/** Which wrapper tables apply to a league (mirrors sdv-py's scope flags). */
export type Scope = "universal" | "ncaa" | "football" | "mlb";

/**
 * A league's binding into the ESPN core: the ESPN `(sport, league)` slugs plus
 * the public `prefix` used in generated wrapper names (`espn_<prefix>_<short>`).
 * `leagueParam` leagues (soccer/cricket) accept a `league` call-param override.
 */
export interface LeagueConfig {
  prefix: string;
  sport: string;
  league: string;
  scopes: Scope[];
  leagueParam?: boolean;
}

/** A query parameter: the call-param `name` -> ESPN `queryKey`, with optional default. */
export interface QueryParam {
  name: string;
  queryKey: string;
  default?: string | number | boolean;
}

/**
 * A `{token}` in a path template. `required` defaults to true; a missing value
 * falls back to `default`, then to the value of another param (`defaultFrom`,
 * e.g. a competition id that defaults from the event id).
 */
export interface PathParam {
  name: string;
  required?: boolean;
  default?: string | number;
  defaultFrom?: string;
}

/**
 * A wrapper definition (data-driven; generated from the ESPN endpoint YAML).
 * `path` is the full host-relative template, e.g. `/{sport}/{league}/scoreboard`
 * (site) or `/{sport}/leagues/{league}/seasons/{season}` (core). Optional
 * segments are bracketed and may contain literals + tokens — e.g. `[/{token}]`
 * or `[/groups/{group_id}]` — and are dropped when their token(s) don't resolve.
 */
export interface WrapperDef {
  short: string;
  family: EspnFamily;
  scope: Scope;
  path: string;
  pathParams: PathParam[];
  queryParams: QueryParam[];
}

/** A generated cross-league wrapper: `(params?) => Promise<raw ESPN JSON>`. */
export type WrapperFn = (params?: Record<string, any>) => Promise<any>;
