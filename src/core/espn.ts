import { HOSTS, get } from "./client.js";
import type { LeagueConfig, Scope, WrapperDef } from "./types.js";
import { WRAPPERS } from "../generated/wrappers.js";

/** Drop undefined/null query values so we don't send `?dates=undefined`. */
function cleanQuery(
  def: WrapperDef,
  params: Record<string, any>
): Record<string, any> | undefined {
  const out: Record<string, any> = {};
  for (const qp of def.queryParams) {
    const v = params[qp.name] ?? qp.default;
    if (v !== undefined && v !== null) out[qp.queryKey] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Substitute the `{sport}`/`{league}` slugs, optional `[/{token}]` segments, and
 * required `{token}` path params into a path template.
 */
function buildPath(
  def: WrapperDef,
  cfg: LeagueConfig,
  params: Record<string, any>
): string {
  const league = params.league ?? cfg.league;
  let path = def.path
    .replace("{sport}", cfg.sport)
    .replace("{league}", league);

  // optional segments: include `/{value}` only when the param is supplied
  path = path.replace(/\[\/\{(\w+)\}\]/g, (_m, name: string) =>
    params[name] !== undefined && params[name] !== null
      ? `/${params[name]}`
      : ""
  );

  // required path params
  path = path.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = params[name];
    if (v === undefined || v === null) {
      throw new Error(
        `espn_${cfg.prefix}_${def.short}: missing required path parameter "${name}"`
      );
    }
    return String(v);
  });

  return path;
}

/** Resolve a wrapper for a league and fetch the raw ESPN JSON. */
export function callWrapper(
  def: WrapperDef,
  cfg: LeagueConfig,
  params: Record<string, any> = {}
): Promise<any> {
  const path = buildPath(def, cfg, params);
  return get(`${HOSTS[def.family]}${path}`, { params: cleanQuery(def, params) });
}

/** All wrappers grouped by scope (built from the generated table). */
export const WRAPPER_TABLES: Record<Scope, WrapperDef[]> = WRAPPERS.reduce(
  (acc, w) => {
    (acc[w.scope] ??= []).push(w);
    return acc;
  },
  { universal: [], ncaa: [], football: [], mlb: [] } as Record<
    Scope,
    WrapperDef[]
  >
);

export { WRAPPERS };
