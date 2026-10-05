/** ESPN URL families, keyed to their host (see `HOSTS` in client.ts). */
export type EspnFamily = "site_v2" | "site_v2_alt" | "web_v3" | "core_v2" | "fitt_v3";

/** Which wrapper tables apply to a league (mirrors sdv-py's scope flags). */
export type Scope = "universal" | "ncaa" | "football" | "mlb";

/**
 * A league's binding into the ESPN core: the ESPN `(sport, league)` slugs plus
 * the public `prefix` used in generated wrapper names (`espn_<prefix>_<name>`).
 * `leagueParam` leagues (soccer/cricket) accept a `league` call-param override.
 */
export interface LeagueConfig {
  prefix: string;
  sport: string;
  league: string;
  scopes: Scope[];
  leagueParam?: boolean;
  /**
   * League-specific v4 public shorts, keyed by wrapper `short`, where they
   * differ from the wrapper's own `publicShort` (sdv-py's curated renames and
   * collision-versioned names, e.g. `athlete_stats` -> `player_stats_v3`).
   */
  publicShorts?: Record<string, string>;
}

/** A query parameter: the call-param `name` -> ESPN `queryKey`, with optional default. */
export interface QueryParam {
  name: string;
  queryKey: string;
  default?: string | number | boolean;
  /** sdv-py param transform applied to the resolved value (src/core/transforms.ts). */
  transform?: string;
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
  /** sdv-py param transform applied to the resolved value (src/core/transforms.ts). */
  transform?: string;
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
  /** The endpoint's sdv-py short name (keys parsers, the playground proxy, overlays). */
  short: string;
  /**
   * ESPN only: the v4 public short when it differs from `short` (sdv-py's
   * convention rename, e.g. `athlete_gamelog` -> `player_gamelog`). The public
   * name is `espn_<prefix>_<cfg.publicShorts[short] ?? publicShort ?? short>`.
   */
  publicShort?: string;
  /**
   * Flat only: the v4 public snake_case name when it differs from
   * `<api>_<short>` (sdv-py's name pattern, e.g. `nhl_boxscore`).
   */
  publicName?: string;
  /**
   * Flat only: the short JS used before v4 when it differs from `short` (CBS:
   * `boxscore` for `game_boxscore`). Lookups by short (playground share links,
   * the docs proxy) accept it; code matching `FLAT_WRAPPERS[].short` should
   * match `short` or `legacyShort`.
   */
  legacyShort?: string;
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
  /** Flat-API family stem, e.g. `"mlb"`. */
  api?: string;
  /** Flat-API absolute base URL, e.g. `"https://statsapi.mlb.com"`. */
  host?: string;
  /** Registered parser name (resolved via `src/parsers/_registry.ts`). */
  parser?: string;
  /**
   * Returns-schema path (docs-only metadata) for a flat-API wrapper, relative
   * to `tools/codegen/schemas/` and without the `.yaml` suffix
   * (e.g. `"native/mlb/boxscore"`). Drives the per-endpoint **Returns**
   * tables in the generated reference docs; unused at runtime.
   */
  returnsSchema?: string;
  /**
   * True for flat-API families that need a bearer token (e.g. `nfl_api`).
   * Docs metadata: the token itself is applied inside `request()` by the auth
   * provider registered (`registerFamilyDefaults`) or configured
   * (`configure({ auth })`) for that `api` stem.
   */
  auth?: boolean;
  /**
   * Set on a deprecated flat wrapper (endpoint YAML `deprecated:`): what to use
   * instead. The first call of each such wrapper emits one DeprecationWarning.
   */
  deprecated?: string;
}

/** A generated cross-league wrapper: `(params?) => Promise<raw ESPN JSON>`. */
export type WrapperFn = (params?: Record<string, any>) => Promise<any>;
