// Dependency-free port of the package's request resolver (src/core/espn.ts),
// driven by the generated endpoints.json so it can never drift from the real
// wrappers. Imported by BOTH the browser playground component and the
// /api/run serverless proxy. Pure ESM, no dependencies.
//
// The only deliberate deviation from the package: empty-string param values are
// treated as "not provided" (the playground's text inputs yield "" when blank).

/** snake_case -> camelCase (e.g. `event_id` -> `eventId`). */
function toCamel(s) {
  return s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
}

/** Look a param up by snake_case name OR a camelCase alias. */
function lookup(params, name) {
  if (params[name] !== undefined && params[name] !== null && params[name] !== '') {
    return params[name];
  }
  const camel = toCamel(name);
  if (camel !== name && params[camel] !== undefined && params[camel] !== null && params[camel] !== '') {
    return params[camel];
  }
  return undefined;
}

/** Build the `?key=value` query from the wrapper's queryParams (+ defaults). */
function cleanQuery(def, params) {
  const out = {};
  for (const qp of def.queryParams || []) {
    const v = lookup(params, qp.name) ?? qp.default;
    if (v !== undefined && v !== null && v !== '') out[qp.queryKey] = v;
  }
  return out;
}

/** Substitute {sport}/{league}, optional [/{token}] segments, and required tokens. */
function buildPath(def, league, params) {
  const override = league.leagueParam ? lookup(params, 'league') : undefined;
  const leagueSlug = override != null ? override : league.league;
  const byName = new Map((def.pathParams || []).map((p) => [p.name, p]));

  const resolve = (name) => {
    const v = lookup(params, name);
    if (v !== undefined) return v;
    const pp = byName.get(name);
    if (pp && pp.defaultFrom != null) {
      const from = lookup(params, pp.defaultFrom);
      if (from !== undefined) return from;
    }
    return pp ? pp.default : undefined;
  };

  let path = def.path
    .replace('{sport}', league.sport)
    .replace('{league}', leagueSlug);

  // Optional `[...]` segments: included only when every token inside resolves.
  path = path.replace(/\[([^\]]*)\]/g, (_m, inner) => {
    const tokens = [...inner.matchAll(/\{(\w+)\}/g)].map((t) => t[1]);
    const vals = tokens.map(resolve);
    if (vals.some((v) => v === undefined || v === null || v === '')) return '';
    let seg = inner;
    tokens.forEach((t, i) => {
      seg = seg.replace(`{${t}}`, String(vals[i]));
    });
    return seg;
  });

  // Remaining required tokens.
  path = path.replace(/\{(\w+)\}/g, (_m, name) => {
    const v = resolve(name);
    if (v === undefined || v === null || v === '') {
      const pp = byName.get(name);
      if (pp && pp.required === false) return '';
      throw new Error(`espn_${league.prefix}_${def.short}: missing required path parameter "${name}"`);
    }
    return String(v);
  });

  return path;
}

/** Build { url, query } for a wrapper without fetching (mirrors resolveRequest). */
export function resolveRequest(def, league, params, hosts) {
  return {
    url: hosts[def.family] + buildPath(def, league, params),
    query: cleanQuery(def, params),
  };
}

/** Full absolute URL including the query string (what the proxy will fetch). */
export function resolveUrl(def, league, params, hosts) {
  const { url, query } = resolveRequest(def, league, params, hosts);
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
  return u.toString();
}
