// Vercel serverless proxy for the docs playground.
//
// ESPN's API sends no CORS headers, so a browser can't call it directly. This
// function runs the resolved request server-side (no CORS there) and returns the
// JSON. It is locked to ESPN hosts via an allowlist derived from the generated
// endpoints.json, so it cannot be used as an open/SSRF proxy: the league +
// endpoint must exist in the metadata, the endpoint must be in scope for the
// league, and the resolved host must be one of ESPN's four API hosts.
//
// Runs on Vercel only (or `vercel dev`); during plain `docusaurus start` the
// /api/run route does not exist and the playground surfaces a friendly error.
import endpoints from '../src/playground/endpoints.json';
import { resolveRequest } from '../src/playground/resolve.mjs';

const ALLOWED_HOSTS = new Set(
  Object.values(endpoints.hosts).map((u) => new URL(u).host)
);
const LEAGUE = Object.fromEntries(endpoints.leagues.map((l) => [l.prefix, l]));
const ENDPOINT = Object.fromEntries(endpoints.endpoints.map((e) => [e.short, e]));

export default async function handler(req, res) {
  const body =
    req.method === 'POST'
      ? typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : req.body || {}
      : req.query || {};

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

  try {
    const espn = await fetch(target.toString(), {
      headers: { 'User-Agent': 'sportsdataverse-js docs playground' },
    });
    const text = await espn.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache successful responses briefly at the edge to be a polite ESPN client.
    if (espn.ok) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }
    res.status(espn.status).send(text);
  } catch (err) {
    res.status(502).json({ error: `Upstream fetch failed: ${String((err && err.message) || err)}` });
  }
}
