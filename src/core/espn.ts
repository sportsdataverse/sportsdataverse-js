import { familyUrl, get } from "./client.js";
import type { EspnFamily, LeagueConfig, Scope } from "./types.js";

/**
 * Definition of one cross-league wrapper: which ESPN family it hits and how to
 * build the path/query from the caller's params. `makeLeagueModule` binds these
 * to a league and exposes them as `espn_<prefix>_<short>(params)`.
 *
 * This is the JS analogue of sdv-py's `_UNIVERSAL_WRAPPERS` table; the codegen
 * phase will expand it from the shared `sdv-internal-refs/espn` metadata.
 */
export interface WrapperDef {
  short: string;
  family: EspnFamily;
  scope: Scope;
  build: (params: Record<string, any>) => {
    path: string;
    query?: Record<string, any>;
  };
}

/** Drop undefined/null query values so we don't send `?dates=undefined`. */
function clean(query?: Record<string, any>): Record<string, any> | undefined {
  if (!query) return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Wrappers that exist for every ESPN league. A small, real first set to prove
 * the `(sport, league)` parameterization end-to-end; extended via codegen.
 */
export const UNIVERSAL_WRAPPERS: WrapperDef[] = [
  {
    short: "scoreboard",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({
      path: "/scoreboard",
      query: {
        dates: p.dates,
        limit: p.limit,
        groups: p.groups,
        seasontype: p.seasontype,
        week: p.week,
      },
    }),
  },
  {
    short: "summary",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({ path: "/summary", query: { event: p.event ?? p.id } }),
  },
  {
    short: "standings",
    family: "site_v2_alt",
    scope: "universal",
    build: (p) => ({
      path: "/standings",
      query: { season: p.season, seasontype: p.seasontype, level: p.level },
    }),
  },
  {
    short: "teams",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({ path: "/teams", query: { limit: p.limit ?? 1000 } }),
  },
  {
    short: "team",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({ path: `/teams/${p.team ?? p.id}` }),
  },
  {
    short: "team_roster",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({ path: `/teams/${p.team ?? p.id}/roster` }),
  },
  {
    short: "team_schedule",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({
      path: `/teams/${p.team ?? p.id}/schedule`,
      query: { season: p.season, seasontype: p.seasontype },
    }),
  },
  {
    short: "news",
    family: "site_v2",
    scope: "universal",
    build: (p) => ({ path: "/news", query: { limit: p.limit } }),
  },
  {
    short: "athletes",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({
      path: "/athletes",
      query: { limit: p.limit ?? 50, page: p.page },
    }),
  },
  {
    short: "athlete",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: `/athletes/${p.athlete ?? p.id}` }),
  },
  {
    short: "seasons",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: "/seasons", query: { limit: p.limit } }),
  },
  {
    short: "season",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: `/seasons/${p.season}` }),
  },
  {
    short: "franchises",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: "/franchises", query: { limit: p.limit ?? 100 } }),
  },
  {
    short: "venues",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: "/venues", query: { limit: p.limit ?? 100 } }),
  },
  {
    short: "positions",
    family: "core_v2",
    scope: "universal",
    build: (p) => ({ path: "/positions", query: { limit: p.limit ?? 100 } }),
  },
];

/** Wrappers that only make sense for NCAA leagues (polls, etc.). */
export const NCAA_WRAPPERS: WrapperDef[] = [
  {
    short: "rankings",
    family: "site_v2",
    scope: "ncaa",
    build: (p) => ({
      path: "/rankings",
      query: { week: p.week, seasontype: p.seasontype },
    }),
  },
];

/** Tables keyed by scope (football/mlb land with codegen). */
export const WRAPPER_TABLES: Record<Scope, WrapperDef[]> = {
  universal: UNIVERSAL_WRAPPERS,
  ncaa: NCAA_WRAPPERS,
  football: [],
  mlb: [],
};

/** Resolve a wrapper for a league and fetch the raw ESPN JSON. */
export function callWrapper(
  def: WrapperDef,
  cfg: LeagueConfig,
  params: Record<string, any> = {}
): Promise<any> {
  const { path, query } = def.build(params);
  return get(familyUrl(def.family, cfg.sport, cfg.league, path), {
    params: clean(query),
  });
}
