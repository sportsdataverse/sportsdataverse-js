import React, { useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import endpoints from '@site/src/playground/endpoints.json';
import { resolveUrl } from '@site/src/playground/resolve.mjs';
import styles from './styles.module.css';

const LEAGUES = [...endpoints.leagues].sort((a, b) => a.prefix.localeCompare(b.prefix));

/** Endpoints applicable to a league = those whose scope is in the league's scopes. */
function endpointsFor(league) {
  const scopes = new Set(league.scopes);
  return endpoints.endpoints
    .filter((e) => scopes.has(e.scope))
    .sort((a, b) => a.short.localeCompare(b.short));
}

/** The editable param fields for a (league, endpoint) pair, with defaults. */
function fieldsFor(league, def) {
  if (!def) return [];
  const fields = [];
  if (league.leagueParam) {
    fields.push({ name: 'league', kind: 'league', required: true, def: league.league });
  }
  for (const p of def.pathParams || []) {
    fields.push({ name: p.name, kind: 'path', required: p.required !== false, def: p.default });
  }
  for (const p of def.queryParams || []) {
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
  const applicable = useMemo(() => endpointsFor(league), [league]);

  const [short, setShort] = useState('scoreboard');
  const def = useMemo(() => applicable.find((e) => e.short === short), [applicable, short]);

  const fields = useMemo(() => fieldsFor(league, def), [league, def]);
  const [params, setParams] = useState(() => defaultParams(fieldsFor(league, def)));

  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset endpoint + params whenever the league changes.
  useEffect(() => {
    const next = applicable.find((e) => e.short === short) ? short : applicable[0]?.short;
    setShort(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  // Reset params to defaults whenever the (league, endpoint) selection changes.
  useEffect(() => {
    setParams(defaultParams(fieldsFor(league, def)));
    setResult(null);
    setError(null);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, short]);

  // The exact ESPN URL the package would build for this call (no network).
  const preview = useMemo(() => {
    try {
      return { url: resolveUrl(def, league, params, endpoints.hosts), error: null };
    } catch (e) {
      return { url: null, error: String(e.message || e) };
    }
  }, [def, league, params]);

  const call = useMemo(() => {
    const args = Object.entries(params)
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => `${k}: ${/^\d+$/.test(v) ? v : `'${v}'`}`)
      .join(', ');
    return `await sdv.${prefix}.espn_${prefix}_${short}({ ${args} });`;
  }, [prefix, short, params]);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(null);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league: prefix, endpoint: short, params }),
      });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResult(text);
      }
      if (!res.ok) setError(`ESPN / proxy returned ${res.status}`);
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
          <select value={short} onChange={(e) => setShort(e.target.value)} className={styles.select}>
            {applicable.map((e) => (
              <option key={e.short} value={e.short}>
                espn_{prefix}_{e.short}
              </option>
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
