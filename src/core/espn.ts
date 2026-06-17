import { HOSTS, get } from "./client.js";
import type { LeagueConfig, Scope, WrapperDef } from "./types.js";
import { WRAPPERS } from "../generated/wrappers.js";
import { parserForEndpoint } from "../parsers/espn.js";

/** snake_case -> camelCase (e.g. `event_id` -> `eventId`, `espn_nba_scoreboard` -> `espnNbaScoreboard`). */
export function toCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

/**
 * Look a param up by its canonical (snake_case) name OR a camelCase alias, so
 * callers can pass either `{ event_id }` or `{ eventId }`.
 */
function lookup(params: Record<string, any>, name: string): any {
  if (params[name] !== undefined && params[name] !== null) return params[name];
  const camel = toCamel(name);
  if (camel !== name && params[camel] !== undefined && params[camel] !== null) {
    return params[camel];
  }
  return undefined;
}

/** Drop undefined/null query values so we don't send `?dates=undefined`. */
function cleanQuery(
  def: WrapperDef,
  params: Record<string, any>
): Record<string, any> | undefined {
  const out: Record<string, any> = {};
  for (const qp of def.queryParams) {
    const v = lookup(params, qp.name) ?? qp.default;
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
  const override = cfg.leagueParam ? lookup(params, "league") : undefined;
  const league = override != null ? override : cfg.league;
  const byName = new Map(def.pathParams.map((p) => [p.name, p]));

  // Resolve a path token: explicit param -> `defaultFrom` param -> `default`
  // (each lookup accepts the snake_case name or a camelCase alias).
  const resolve = (name: string): any => {
    const v = lookup(params, name);
    if (v !== undefined && v !== null) return v;
    const pp = byName.get(name);
    if (pp?.defaultFrom != null) {
      const from = lookup(params, pp.defaultFrom);
      if (from !== undefined && from !== null) return from;
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
        `${toCamel(`espn_${cfg.prefix}_${def.short}`)}: missing required path parameter "${name}"`
      );
    }
    return String(v);
  });

  return path;
}

/**
 * Build the full request (URL + query) for a wrapper without fetching. Exported
 * so the param resolution (camelCase aliases, defaults, path substitution) is
 * unit-testable without network.
 */
export function resolveRequest(
  def: WrapperDef,
  cfg: LeagueConfig,
  params: Record<string, any> = {}
): { url: string; query?: Record<string, any> } {
  return {
    url: `${HOSTS[def.family]}${buildPath(def, cfg, params)}`,
    query: cleanQuery(def, params),
  };
}

/**
 * Resolve a wrapper for a league, fetch the raw ESPN JSON, and — only when the
 * caller passes `{ parsed: true }` AND a parser is registered for this endpoint's
 * `short` name — run the payload through that parser. Omitting `parsed` returns
 * the raw payload unchanged, so the dispatch is strictly additive (mirrors the
 * native flat wrappers + sdv-py's `return_parsed=True`).
 *
 * The `summary` dispatcher additionally honours a `section` control param:
 * `{ parsed: true, section: "boxscore_team" }` returns just that sub-frame, while
 * `{ parsed: true }` alone returns the dict of all 21 summary sub-frames.
 * `parsed`/`section` are control params, not declared query params, so
 * `cleanQuery` already keeps them out of the request URL.
 */
export async function callWrapper(
  def: WrapperDef,
  cfg: LeagueConfig,
  params: Record<string, any> = {}
): Promise<any> {
  const { url, query } = resolveRequest(def, cfg, params);
  const raw = await get(url, { params: query });
  if (!params.parsed) return raw;
  const parser = parserForEndpoint(def.short);
  if (!parser) return raw;
  if (def.short === "summary") {
    return (parser as (p: any, section?: string) => any)(raw, params.section);
  }
  return (parser as (p: any) => any)(raw);
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
