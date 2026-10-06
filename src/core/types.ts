/** ESPN URL families, keyed to their host (see `HOSTS` in client.ts). */
export type EspnFamily = "site_v2" | "site_v2_alt" | "web_v3" | "core_v2" | "fitt_v3" | "cdn";

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
  /**
   * ESPN only: the league prefixes this wrapper is emitted for, on top of
   * `scope` (sdv-py `include_prefixes`, a live-probed allowlist). Absent = every
   * in-scope league.
   */
  includePrefixes?: string[];
  path: string;
  /** Flat only (sdv-py `now_variant`): path used when the `nowToggle` param is absent. */
  nowVariant?: string;
  /** Flat only: the path param whose absence selects `nowVariant`. */
  nowToggle?: string;
  pathParams: PathParam[];
  queryParams: QueryParam[];
  /**
   * Constant query params sent on every request and never exposed as arguments
   * (sdv-py `fixed_params`: per endpoint, or family-level on an ESPN family, e.g.
   * the CDN's `xhr: 1`). A caller param of the same name overrides one.
   */
  fixedParams?: Record<string, string | number | boolean>;
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

/** A snake_case name as the camelCase alias the namespaces also register (`espn_nba_pbp` -> `espnNbaPbp`). */
export type SnakeToCamel<S extends string> = S extends `${infer H}_${infer C}${infer T}`
  ? `${H}${Uppercase<C>}${SnakeToCamel<T>}`
  : S;

/** `T` plus every member again under its camelCase name. */
export type WithCamelAliases<T> = T & { [K in keyof T & string as SnakeToCamel<K>]: T[K] };

/** A generated cross-league wrapper: `(params?) => Promise<raw ESPN JSON>`. */
export type WrapperFn = (params?: Record<string, any>) => Promise<any>;

/**
 * One parsed row (column name -> value) whose columns no verified returns schema
 * describes: the base row type of every `{ parsed: true }` return. Endpoints whose
 * returns schema the parser-parity harness verified on a real capture return a
 * generated row interface instead (`src/generated/rows/`).
 */
export type Row = Record<string, unknown>;

/** Several parsed tables keyed by name: a multi-table parser's output without `section`. */
export type ParsedTables = Record<string, Row[]>;

/**
 * A row as a parser function builds it (the `sportsdataverse/parsers` functions'
 * signatures). The wrappers return {@link Row} or a generated row type.
 */
export type ParserRow = Record<string, any>;

/**
 * The params of a generated wrapper call: the endpoint's path / query params plus
 * the controls `parsed`, `section`, `headers` and any family control (`api_key`, ...).
 */
export type WrapperParams = { [param: string]: unknown };

/**
 * A generated wrapper. Without `parsed: true` it resolves to the raw payload
 * (`unknown`: narrow it yourself); with `{ parsed: true }` to the endpoint parser's
 * output `P`: rows of a generated row type for a verified endpoint, else {@link Row}`[]`.
 * An endpoint with no parser has `P = unknown` (`parsed` returns the raw payload).
 */
export interface Wrapper<P = Row[]> {
  /** `{ parsed: true }`: the parser's tidy output. */
  (params: WrapperParams & { parsed: true }): Promise<P>;
  /** The raw payload. */
  (params?: WrapperParams): Promise<unknown>;
}

/**
 * A generated wrapper whose parser returns several tables (sdv-py's dict of frames):
 * as {@link Wrapper}, plus `{ parsed: true, section }`, which returns one table:
 * `S[section]` for a table the verified schema names, else {@link Row}`[]`.
 */
export interface SectionedWrapper<P = Row[], S extends object = {}> {
  /** `{ parsed: true, section }` naming a table the verified schema types. */
  <K extends keyof S & string>(params: WrapperParams & { parsed: true; section: K }): Promise<S[K]>;
  /** `{ parsed: true, section }`: any other table (an unknown name throws, or is `[]` for stats.nba.com). */
  (params: WrapperParams & { parsed: true; section: string }): Promise<Row[]>;
  /** `{ parsed: true }`: the parser's default output. */
  (params: WrapperParams & { parsed: true }): Promise<P>;
  /** The raw payload. */
  (params?: WrapperParams): Promise<unknown>;
}
