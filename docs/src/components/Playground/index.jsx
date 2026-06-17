import React, { useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import endpoints from '@site/src/playground/endpoints.json';
import { resolveUrl, resolveFlatUrl } from '@site/src/playground/resolve.mjs';
import styles from './styles.module.css';

const FLAT_APIS = endpoints.flatApis || [];
const FLAT_LEAGUES = endpoints.flatLeagues || {};
const FLAT_HOSTS = endpoints.flatHosts || {};

// Human label per flat-API family stem (matches the docs section headings).
const FLAT_API_LABEL = {
  mlb_api: 'MLB Stats API',
  mlb_statcast: 'Baseball Savant / Statcast',
  nhl_api_web: 'NHL api-web (game feed)',
  nhl_edge: 'NHL EDGE (player tracking)',
  nhl_stats_rest: 'NHL Stats REST',
  nhl_records: 'NHL Records',
  nfl_api: 'NFL.com Shield API',
  odds_api: 'The Odds API',
};

// Standalone (non-league) flat namespaces — any `flatLeagues` value that isn't a
// real ESPN league prefix (e.g. `odds`, The Odds API). They get a synthetic
// dropdown entry (empty `scopes` => no ESPN endpoints, only the native groups)
// so `sdv.<ns>.*` endpoints are still runnable in the playground.
const LEAGUE_PREFIXES = new Set(endpoints.leagues.map((l) => l.prefix));
const STANDALONE_NS = [...new Set(Object.values(FLAT_LEAGUES))]
  .filter((ns) => !LEAGUE_PREFIXES.has(ns))
  .sort();
const STANDALONE_LEAGUES = STANDALONE_NS.map((ns) => ({
  prefix: ns,
  sport: 'provider',
  league: ns,
  scopes: [],
  standalone: true,
}));

const LEAGUES = [...endpoints.leagues, ...STANDALONE_LEAGUES].sort((a, b) =>
  a.prefix.localeCompare(b.prefix)
);

/** snake_case -> camelCase (espn_nba_scoreboard -> espnNbaScoreboard). */
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

/** Canonical ESPN method name (espn_nba_scoreboard -> espnNbaScoreboard). */
const espnMethodName = (prefix, short) => toCamel(`espn_${prefix}_${short}`);

/** Canonical flat method name (mlb_api + teams -> mlbApiTeams). */
const flatMethodName = (api, short) => toCamel(`${api}_${short}`);

/** Stable option id so ESPN + flat endpoints that share a `short` don't collide. */
const espnId = (short) => `espn:${short}`;
const flatId = (api, short) => `flat:${api}:${short}`;

/** ESPN endpoints applicable to a league = those whose scope is in its scopes. */
function espnEndpointsFor(league) {
  const scopes = new Set(league.scopes);
  return endpoints.endpoints
    .filter((e) => scopes.has(e.scope))
    .sort((a, b) => a.short.localeCompare(b.short));
}

/** Flat endpoints merged onto a league, grouped by family stem (in file order). */
function flatGroupsFor(league) {
  const groups = [];
  for (const api of Object.keys(FLAT_HOSTS)) {
    if (FLAT_LEAGUES[api] !== league.prefix) continue;
    const eps = FLAT_APIS.filter((e) => e.api === api).sort((a, b) =>
      a.short.localeCompare(b.short)
    );
    if (eps.length) groups.push({ api, label: FLAT_API_LABEL[api] || api, eps });
  }
  return groups;
}

/** Resolve a selection id to its endpoint def + kind (espn | flat). */
function selectDef(league, id) {
  if (!id) return null;
  if (id.startsWith('flat:')) {
    const [, api, short] = id.split(':');
    const def = FLAT_APIS.find((e) => e.api === api && e.short === short);
    return def ? { kind: 'flat', def, api, short } : null;
  }
  const short = id.slice('espn:'.length);
  const def = espnEndpointsFor(league).find((e) => e.short === short);
  return def ? { kind: 'espn', def, short } : null;
}

/** The editable param fields for a selection, with defaults. */
function fieldsFor(league, sel) {
  if (!sel) return [];
  const fields = [];
  if (sel.kind === 'espn' && league.leagueParam) {
    // Optional: clearing it falls back to the league's default slug.
    fields.push({ name: 'league', kind: 'league', required: false, def: league.league });
  }
  for (const p of sel.def.pathParams || []) {
    fields.push({ name: p.name, kind: 'path', required: p.required !== false, def: p.default });
  }
  for (const p of sel.def.queryParams || []) {
    fields.push({ name: p.name, kind: 'query', required: false, def: p.default });
  }
  return fields;
}

function defaultParams(fields) {
  const out = {};
  for (const f of fields) if (f.def !== undefined && f.def !== null) out[f.name] = String(f.def);
  return out;
}

export default function Playground() {
  const [prefix, setPrefix] = useState('nba');
  const league = useMemo(() => LEAGUES.find((l) => l.prefix === prefix), [prefix]);
  const espnApplicable = useMemo(() => espnEndpointsFor(league), [league]);
  const flatGroups = useMemo(() => flatGroupsFor(league), [league]);

  const [selId, setSelId] = useState(espnId('scoreboard'));
  const sel = useMemo(() => selectDef(league, selId), [league, selId]);

  const fields = useMemo(() => fieldsFor(league, sel), [league, sel]);
  const [params, setParams] = useState(() => defaultParams(fieldsFor(league, sel)));

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset endpoint + params whenever the league changes. Prefer keeping the
  // current selection if it still exists for the new league, else scoreboard /
  // the first available endpoint.
  useEffect(() => {
    const stillValid = selectDef(league, selId);
    const next = stillValid
      ? selId
      : espnApplicable.find((e) => e.short === 'scoreboard')
        ? espnId('scoreboard')
        : espnApplicable[0]
          ? espnId(espnApplicable[0].short)
          : flatGroups[0]
            ? flatId(flatGroups[0].api, flatGroups[0].eps[0].short)
            : null;
    setSelId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  // Reset params to defaults whenever the (league, endpoint) selection changes.
  useEffect(() => {
    setParams(defaultParams(fieldsFor(league, sel)));
    setResult(null);
    setError(null);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, selId]);

  // The exact URL the package would build for this call (no network).
  const preview = useMemo(() => {
    try {
      if (!sel) return { url: null, error: 'No endpoint selected.' };
      const url =
        sel.kind === 'flat'
          ? resolveFlatUrl(sel.def, params, FLAT_HOSTS)
          : resolveUrl(sel.def, league, params, endpoints.hosts);
      return { url, error: null };
    } catch (e) {
      return { url: null, error: String(e.message || e) };
    }
  }, [sel, league, params]);

  const call = useMemo(() => {
    if (!sel) return '';
    const args = Object.entries(params)
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => `${k}: ${/^\d+$/.test(v) ? v : `'${v}'`}`)
      .join(', ');
    const method =
      sel.kind === 'flat'
        ? flatMethodName(sel.api, sel.short)
        : espnMethodName(prefix, sel.short);
    return `await sdv.${prefix}.${method}({ ${args} });`;
  }, [prefix, sel, params]);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(null);
    try {
      // Flat endpoints dispatch by `api` (a flat `short` isn't unique across
      // families); ESPN endpoints dispatch by `league`. The proxy branches on
      // the presence of `api`.
      const reqBody =
        sel.kind === 'flat'
          ? { api: sel.api, endpoint: sel.short, params }
          : { league: prefix, endpoint: sel.short, params };
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        // Non-JSON (Statcast CSV/HTML) — display the raw text as-is.
        setResult(text);
      }
      if (!res.ok) setError(`API / proxy returned ${res.status}`);
    } catch (e) {
      setError(
        `Request failed: ${String(e.message || e)} — the live proxy runs on the ` +
          `deployed site (Vercel); it is unavailable under plain \`docusaurus start\`.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.playground}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.label}>League</span>
          <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className={styles.select}>
            {LEAGUES.map((l) => (
              <option key={l.prefix} value={l.prefix}>
                {l.prefix} — {l.sport}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Endpoint</span>
          <select value={selId ?? ''} onChange={(e) => setSelId(e.target.value)} className={styles.select}>
            {espnApplicable.length > 0 && (
              <optgroup label="ESPN">
                {espnApplicable.map((e) => (
                  <option key={espnId(e.short)} value={espnId(e.short)}>
                    {espnMethodName(prefix, e.short)}
                  </option>
                ))}
              </optgroup>
            )}
            {flatGroups.map((g) => (
              <optgroup key={g.api} label={`Native — ${g.label}`}>
                {g.eps.map((e) => (
                  <option key={flatId(g.api, e.short)} value={flatId(g.api, e.short)}>
                    {flatMethodName(g.api, e.short)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {fields.length > 0 && (
        <div className={styles.params}>
          {fields.map((f) => (
            <label key={f.name} className={styles.field}>
              <span className={styles.label}>
                {f.name}
                {f.required && <span className={styles.req}> *</span>}
                <span className={styles.kind}>{f.kind}</span>
              </span>
              <input
                className={styles.input}
                value={params[f.name] ?? ''}
                placeholder={f.def != null ? String(f.def) : ''}
                onChange={(e) => setParams((p) => ({ ...p, [f.name]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}

      <div className={styles.codeBlock}>
        <code>{call}</code>
      </div>

      <div className={styles.requestRow}>
        <span className={styles.requestLabel}>GET</span>
        {preview.error ? (
          <code className={styles.requestErr}>{preview.error}</code>
        ) : (
          <code className={styles.requestUrl}>{preview.url}</code>
        )}
        <button
          className={clsx('button', 'button--primary', styles.runBtn)}
          onClick={run}
          disabled={loading || !!preview.error}
        >
          {loading ? 'Running…' : 'Run ▶'}
        </button>
      </div>

      {error && <div className={clsx(styles.output, styles.errorBox)}>{error}</div>}

      {result != null && (
        <div className={styles.output}>
          <div className={styles.outputHead}>
            <span>Response</span>
            {status != null && <span className={styles.statusPill}>HTTP {status}</span>}
            <span className={styles.bytes}>{(result.length / 1024).toFixed(1)} KB</span>
          </div>
          <pre className={styles.json}>
            {result.length > 200000 ? result.slice(0, 200000) + '\n… (truncated)' : result}
          </pre>
        </div>
      )}
    </div>
  );
}
