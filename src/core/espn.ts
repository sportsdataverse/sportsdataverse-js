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
  // Only league-parameterized leagues (soccer/cricket) honour a `league` override.
  const league = cfg.leagueParam && params.league ? params.league : cfg.league;
  const byName = new Map(def.pathParams.map((p) => [p.name, p]));

  // Resolve a path token: explicit param -> `defaultFrom` param -> `default`.
  const resolve = (name: string): any => {
    if (params[name] !== undefined && params[name] !== null) return params[name];
    const pp = byName.get(name);
    if (pp?.defaultFrom != null && params[pp.defaultFrom] != null) {
      return params[pp.defaultFrom];
    }
    return pp?.default;
  };

  let path = def.path
    .replace("{sport}", cfg.sport)
    .replace("{league}", league);

  // Optional segments `[...]` (literals + tokens): include only when every
  // token inside resolves; otherwise drop the whole segment.
  path = path.replace(/\[([^\]]*)\]/g, (_m, inner: string) => {
    const tokens = [...inner.matchAll(/\{(\w+)\}/g)].map((t) => t[1]);
    const vals = tokens.map(resolve);
    if (vals.some((v) => v === undefined || v === null)) return "";
    let seg = inner;
    tokens.forEach((t, i) => {
      seg = seg.replace(`{${t}}`, String(vals[i]));
    });
    return seg;
  });

  // Remaining required tokens.
  path = path.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = resolve(name);
    if (v === undefined || v === null) {
      if (byName.get(name)?.required === false) return "";
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
