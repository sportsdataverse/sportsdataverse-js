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
 *
 * "Flat API" wrappers (non-ESPN live APIs, e.g. the MLB Stats API) reuse the
 * same shape but set `flat: true` and carry an absolute `host` + the family
 * `api` stem + an optional `parser` name. For flat wrappers `family` is unused
 * (the host is absolute, not an `EspnFamily` slug) and `path` need not contain
 * `{sport}`/`{league}` — see `src/core/flat.ts` for the resolver.
 */
export interface WrapperDef {
  short: string;
  /**
   * ESPN URL family slug (keys into `HOSTS`). Present on every ESPN wrapper;
   * omitted on flat-API wrappers (`flat: true`), which carry an absolute `host`.
   */
  family?: EspnFamily;
  scope: Scope;
  path: string;
  pathParams: PathParam[];
  queryParams: QueryParam[];
  /** True for non-ESPN "flat API" wrappers (see `src/core/flat.ts`). */
  flat?: boolean;
  /** Flat-API family stem, e.g. `"mlb_api"`. */
  api?: string;
  /** Flat-API absolute base URL, e.g. `"https://statsapi.mlb.com"`. */
  host?: string;
  /** Registered parser name (resolved via `src/parsers/_registry.ts`). */
  parser?: string;
  /**
   * Returns-schema path (docs-only metadata) for a flat-API wrapper, relative
   * to `tools/codegen/schemas/` and without the `.yaml` suffix
   * (e.g. `"native/mlb_api/boxscore"`). Drives the per-endpoint **Returns**
   * tables in the generated reference docs; unused at runtime.
   */
  returnsSchema?: string;
  /**
   * True for flat-API families that need a bearer token (e.g. `nfl_api`). The
   * dispatch (`src/leagues/_make_flat.ts`) resolves auth headers via the
   * `AUTH_HEADER_PROVIDERS` map for that `api` stem before fetching. Non-auth
   * families omit this and behave exactly as before.
   */
  auth?: boolean;
}

/** A generated cross-league wrapper: `(params?) => Promise<raw ESPN JSON>`. */
export type WrapperFn = (params?: Record<string, any>) => Promise<any>;
