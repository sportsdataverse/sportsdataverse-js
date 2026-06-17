// Vercel serverless proxy for the docs playground.
//
// ESPN's API (and the native flat APIs) send no CORS headers, so a browser can't
// call them directly. This function runs the resolved request server-side (no
// CORS there) and returns the response. It is locked to known hosts via an
// allowlist derived from the generated endpoints.json, so it cannot be used as
// an open/SSRF proxy: the league + endpoint must exist in the metadata, ESPN
// endpoints must be in scope for the league, and the resolved host must be one
// of ESPN's four API hosts OR one of the generated flat-API hosts.
//
// Two dispatch paths:
//   - ESPN (default): `{ league, endpoint, params }` — resolved via
//     `resolveRequest`, host-checked against `endpoints.hosts`. Unchanged.
//   - Flat (native): `{ api, endpoint, params }` — resolved via `resolveFlat`,
//     host-checked against `endpoints.flatHosts`. Auth families (`nfl_api`) mint
//     a bearer token SERVER-SIDE (the credentials never reach the browser);
//     non-JSON families (`mlb_statcast` CSV/HTML) pass the upstream
//     `content-type` through and return the body as text.
//
// Runs on Vercel only (or `vercel dev`); during plain `docusaurus start` the
// /api/run route does not exist and the playground surfaces a friendly error.
// Native ESM (Vercel traces rather than bundles this function) requires an
// explicit import attribute for JSON — without it the module fails to load.
import endpoints from '../src/playground/endpoints.json' with { type: 'json' };
import { resolveRequest, resolveFlat } from '../src/playground/resolve.mjs';
import { AUTH_HEADER_PROVIDERS } from '../src/playground/nfl_auth.mjs';

const ALLOWED_HOSTS = new Set(
  Object.values(endpoints.hosts).map((u) => new URL(u).host)
);
// Flat-API hosts derived the same SSRF-safe way: only hosts present in the
// generated `flatHosts` metadata are reachable. Some flat hosts carry a path
// (e.g. `https://api.nhle.com/stats/rest`) — `new URL(...).host` keys on the
// bare host (`api.nhle.com`), which is exactly what we compare the resolved
// target's `.host` against.
const ALLOWED_FLAT_HOSTS = new Set(
  Object.values(endpoints.flatHosts || {}).map((u) => new URL(u).host)
);
const LEAGUE = Object.fromEntries(endpoints.leagues.map((l) => [l.prefix, l]));
const ENDPOINT = Object.fromEntries(endpoints.endpoints.map((e) => [e.short, e]));
// Flat endpoints keyed by `${api}:${short}` (a flat `short` like `teams` is not
// unique across families, so the family stem is part of the key).
const FLAT_ENDPOINT = Object.fromEntries(
  (endpoints.flatApis || []).map((e) => [`${e.api}:${e.short}`, e])
);

/**
 * Run the resolved upstream request (bounded + edge-cached) and stream the
 * response back. Shared by both the ESPN and flat dispatch paths. For JSON the
 * body is forwarded verbatim with a JSON content-type; for non-JSON (Statcast
 * CSV/HTML) the upstream `content-type` is passed through so the browser can
 * display the raw text.
 */
async function proxyFetch(res, targetUrl, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(targetUrl, {
      headers: { 'User-Agent': 'sportsdataverse-js docs playground', ...headers },
      signal: controller.signal,
    });
    const text = await upstream.text();
    // Mirror the upstream content-type so CSV/HTML (Statcast) display as text;
    // default to JSON when the upstream omits a content-type.
    const ctype = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('Content-Type', ctype);
    // Cache successful responses briefly at the edge to be a polite client.
    if (upstream.ok) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }
    res.status(upstream.status).send(text);
  } catch (err) {
    const timedOut = err && err.name === 'AbortError';
    res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? 'Upstream request timed out.'
        : `Upstream fetch failed: ${String((err && err.message) || err)}`,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** ESPN dispatch: resolve via the cross-league resolver + ESPN host allowlist. */
async function handleEspn(res, body) {
  const prefix = body.league;
  const short = body.endpoint;
  const params = body.params || {};

  const league = LEAGUE[prefix];
  const def = ENDPOINT[short];
  if (!league || !def) {
    res.status(400).json({ error: 'Unknown league or endpoint.' });
    return;
  }
  if (!league.scopes.includes(def.scope)) {
    res
      .status(400)
      .json({ error: `Endpoint "${short}" is not available for league "${prefix}".` });
    return;
  }

  let target;
  try {
    const { url, query } = resolveRequest(def, league, params, endpoints.hosts);
    target = new URL(url);
    for (const [k, v] of Object.entries(query)) target.searchParams.set(k, String(v));
  } catch (err) {
    res.status(400).json({ error: String((err && err.message) || err) });
    return;
  }

  if (!ALLOWED_HOSTS.has(target.host)) {
    res.status(400).json({ error: 'Resolved host is not an allowed ESPN host.' });
    return;
  }
  await proxyFetch(res, target.toString());
}

/**
 * Flat (native) dispatch: resolve via `resolveFlat` + the flat-host allowlist.
 * Auth families mint a bearer token server-side via the family's
 * `AUTH_HEADER_PROVIDERS` entry (creds never reach the browser); the
 * content-type passthrough in `proxyFetch` handles non-JSON (Statcast) bodies.
 */
async function handleFlat(res, body) {
  const api = body.api;
  const short = body.endpoint;
  const params = body.params || {};

  const def = FLAT_ENDPOINT[`${api}:${short}`];
  if (!def) {
    res.status(400).json({ error: 'Unknown native API endpoint.' });
    return;
  }

  let target;
  try {
    const { url, query } = resolveFlat(def, params, endpoints.flatHosts);
    target = new URL(url);
    for (const [k, v] of Object.entries(query)) target.searchParams.set(k, String(v));
  } catch (err) {
    res.status(400).json({ error: String((err && err.message) || err) });
    return;
  }

  if (!ALLOWED_FLAT_HOSTS.has(target.host)) {
    res.status(400).json({ error: 'Resolved host is not an allowed native-API host.' });
    return;
  }

  // Auth families resolve a bearer-token header set before fetching. The token
  // is minted server-side and never exposed to the browser.
  let headers;
  if (def.auth) {
    const provider = AUTH_HEADER_PROVIDERS[api];
    if (!provider) {
      res.status(400).json({ error: `No auth provider for native API "${api}".` });
      return;
    }
    try {
      headers = await provider();
    } catch (err) {
      res
        .status(502)
        .json({ error: `Auth token mint failed: ${String((err && err.message) || err)}` });
      return;
    }
  }
  await proxyFetch(res, target.toString(), headers);
}

export default async function handler(req, res) {
  // POST-only: this triggers an upstream fetch, so don't expose it over GET.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed — use POST.' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  // `api` present => native flat dispatch; otherwise the ESPN path (unchanged).
  if (body.api) {
    await handleFlat(res, body);
  } else {
    await handleEspn(res, body);
  }
}
