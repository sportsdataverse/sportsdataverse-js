import React from 'react';
import endpoints from '@site/src/playground/endpoints.json';
import * as parsers from '@site/src/playground/parsers.bundle.mjs';
import * as resolve from '@site/src/playground/resolve.mjs';
import { CompactTable as Table } from '@site/src/components/RunCell';

// The scope every ```jsx live``` block sees (react-live cannot `import`). The
// vocabulary is documented in docs/docs/guides/live-blocks.md — keep the two in
// sync. Everything here is SSR-safe: the block's preview itself only renders in
// the browser (@docusaurus/theme-live-codeblock wraps it in BrowserOnly).

/**
 * POST /api/run — the same host-allowlisted Vercel proxy RunCell and the
 * Playground use (upstreams send no CORS headers, so a block cannot fetch them
 * directly). The body is the proxy's own request shape, NOT a URL:
 *   { league: 'nba', endpoint: 'scoreboard', params: {} }       ESPN
 *   { api: 'nfl_api', endpoint: 'standings', params: {...} }    flat family
 * Resolves to the parsed JSON body (or the raw text for CSV/HTML upstreams);
 * rejects with the proxy's error message on a non-2xx. `init` is merged into
 * the fetch init (e.g. an AbortSignal).
 */
async function fetchViaProxy(request, init = {}) {
  const res = await fetch('/api/run', {
    method: 'POST',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(request),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text; // non-JSON upstream (Statcast CSV / HTML)
  }
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && data.error) || `proxy returned ${res.status}`;
    throw new Error(
      `${msg} — the live proxy runs on the deployed site (Vercel); it is unavailable under plain docusaurus start.`
    );
  }
  return data;
}

const ReactLiveScope = {
  React,
  ...React,
  // sportsdataverse/parsers (browser bundle): parseEndpoint, parse_summary,
  // normalize, snakeCase, PARSERS, parserFor, … plus the namespace itself.
  ...parsers,
  parsers,
  // URL resolver the playground + proxy share (resolveUrl, resolveFlatUrl,
  // findFlatDef, TRANSFORMS, latestSeason, …) and the endpoint catalogue.
  resolve,
  endpoints,
  fetchViaProxy,
  Table,
};

export default ReactLiveScope;
