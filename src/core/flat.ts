import { toCamel } from "./espn.js";
import type { WrapperDef } from "./types.js";

/**
 * Request resolver for the non-ESPN "flat API" wrappers (e.g. the MLB Stats
 * API). Mirrors the Python flat `_get` URL building:
 *
 *   - `url` = `host` + `path`, with simple `{token}` substitution from `params`
 *     (each token accepts the snake_case name OR a camelCase alias).
 *   - `query` = the remaining declared query params (defaults applied), with
 *     `undefined`/`null` dropped and the control key `parsed` excluded.
 *
 * Unlike the ESPN resolver there is no `{sport}`/`{league}` slug nesting and no
 * optional `[...]` segments — flat `path` templates are host-relative literals
 * with bare `{token}` path params. A `{token}` that resolves to nothing throws.
 */

/** Look a param up by its snake_case name OR a camelCase alias. */
function lookup(params: Record<string, any>, name: string): any {
  if (params[name] !== undefined && params[name] !== null) return params[name];
  const camel = toCamel(name);
  if (camel !== name && params[camel] !== undefined && params[camel] !== null) {
    return params[camel];
  }
  return undefined;
}

/** Resolve a single path token: explicit param -> declared `default`. */
function resolvePathParam(
  def: WrapperDef,
  params: Record<string, any>,
  name: string
): any {
  const v = lookup(params, name);
  if (v !== undefined && v !== null) return v;
  const pp = (def.pathParams ?? []).find((p) => p.name === name);
  return pp?.default;
}

/** Build the query map from the declared `queryParams` (+ defaults), dropping empties. */
function cleanQuery(
  def: WrapperDef,
  params: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const qp of def.queryParams ?? []) {
    const v = lookup(params, qp.name) ?? qp.default;
    if (v !== undefined && v !== null) out[qp.queryKey] = v;
  }
  return out;
}

/**
 * Build the full request (absolute URL + query) for a flat wrapper without
 * fetching. Exported so the param resolution is unit-testable without network.
 *
 * @throws if a `{token}` in the path can't be resolved (no param, no default).
 */
export function resolveFlat(
  def: WrapperDef,
  params: Record<string, any> = {}
): { url: string; query: Record<string, any> } {
  const host = def.host;
  if (!host) {
    throw new Error(`${def.short}: flat wrapper missing host`);
  }
  const path = def.path.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = resolvePathParam(def, params, name);
    if (v === undefined || v === null) {
      const pp = (def.pathParams ?? []).find((p) => p.name === name);
      if (pp?.required === false) return "";
      throw new Error(
        `${toCamel(`${def.api ?? "flat"}_${def.short}`)}: missing required path parameter "${name}"`
      );
    }
    return String(v);
  });
  return { url: `${host}${path}`, query: cleanQuery(def, params) };
}
