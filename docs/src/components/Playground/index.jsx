import React, { useMemo, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import endpoints from '@site/src/playground/endpoints.json';
import { resolveUrl, resolveFlatUrl } from '@site/src/playground/resolve.mjs';
import { parseEndpoint } from '@site/src/playground/parsers.bundle.mjs';
import { EXAMPLES, examplesBySport } from '@site/src/playground/examples.js';
import styles from './styles.module.css';

const FLAT_APIS = endpoints.flatApis || [];
const FLAT_LEAGUES = endpoints.flatLeagues || {};
const FLAT_HOSTS = endpoints.flatHosts || {};

const MAX_TABLE_ROWS = 200;
const MAX_TABLE_COLS = 40;

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
  sports247: '247Sports (recruiting)',
  cbs_napi: 'CBS Sports (napi)',
  fox_bifrost: 'Fox Sports (Bifrost)',
  yahoo_editorial: 'Yahoo Sports (editorial)',
  yahoo_shangrila: 'Yahoo Sports (shangrila)',
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
const espnMethodName = (prefix, short) => toCamel(`espn_${prefix}_${short}`);
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

/** Flat endpoints merged onto a league, grouped by family stem. */
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

/** Does this selection have a registered parser (so `parsed` is meaningful)? */
function selHasParser(sel) {
  if (!sel) return false;
  return sel.kind === 'flat' ? !!sel.def.parser : true; // every ESPN short has one
}

/** The editable param fields for a selection, with defaults. */
function fieldsFor(league, sel) {
  if (!sel) return [];
  const fields = [];
  if (sel.kind === 'espn' && league.leagueParam) {
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

// --- deep-link state (querystring <-> playground) --------------------------

const CONTROL_KEYS = new Set(['l', 'e', 'parsed', 'section']);

/** Read initial state from the URL querystring (?l=&e=&parsed=&section=&<params>). */
function readUrlState() {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  if (!q.has('l') && !q.has('e')) return null;
  const params = {};
  for (const [k, v] of q.entries()) if (!CONTROL_KEYS.has(k)) params[k] = v;
  return {
    prefix: q.get('l') || 'nba',
    selId: q.get('e') || espnId('scoreboard'),
    parsed: q.get('parsed') === '1',
    section: q.get('section') || null,
    params,
  };
}

/** Serialize current state to a shareable `/playground?...` URL. */
function buildShareUrl({ prefix, selId, params, parsed, section }) {
  const q = [`l=${encodeURIComponent(prefix)}`, `e=${encodeURIComponent(selId)}`];
  if (parsed) q.push('parsed=1');
  if (section) q.push(`section=${encodeURIComponent(section)}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v != null) q.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return `/playground?${q.join('&')}`;
}

// --- table rendering -------------------------------------------------------

function fmtCell(v) {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function DataTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className={styles.tableEmpty}>0 rows (empty frame).</div>;
  }
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))].slice(0, MAX_TABLE_COLS);
  const shown = rows.slice(0, MAX_TABLE_ROWS);
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rowNum}>#</th>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                <td className={styles.rowNum}>{i}</td>
                {cols.map((c) => (
                  <td key={c} title={fmtCell(r[c])}>
                    {fmtCell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.tableMeta}>
        {rows.length} rows × {[...new Set(rows.flatMap((r) => Object.keys(r)))].length} cols
        {rows.length > MAX_TABLE_ROWS && ` — showing first ${MAX_TABLE_ROWS}`}
        {cols.length === MAX_TABLE_COLS && ` — showing first ${MAX_TABLE_COLS} cols`}
      </div>
    </>
  );
}

export default function Playground() {
  const init = useMemo(() => readUrlState(), []);
  const [prefix, setPrefix] = useState(init?.prefix || 'nba');
  const league = useMemo(() => LEAGUES.find((l) => l.prefix === prefix) || LEAGUES[0], [prefix]);
  const espnApplicable = useMemo(() => espnEndpointsFor(league), [league]);
  const flatGroups = useMemo(() => flatGroupsFor(league), [league]);

  const [selId, setSelId] = useState(init?.selId || espnId('scoreboard'));
  const sel = useMemo(() => selectDef(league, selId), [league, selId]);
  const hasParser = useMemo(() => selHasParser(sel), [sel]);

  const fields = useMemo(() => fieldsFor(league, sel), [league, sel]);
  const [params, setParams] = useState(
    () => init?.params && Object.keys(init.params).length
      ? init.params
      : defaultParams(fieldsFor(league, sel))
  );
  const [parsed, setParsed] = useState(init?.parsed || false);
  const [section, setSection] = useState(init?.section || null);

  const [rawData, setRawData] = useState(null); // parsed JSON object (or raw text)
  const [rawText, setRawText] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const didInit = useRef(false);

  // Reset endpoint when the league changes (keep selection if still valid).
  useEffect(() => {
    if (!didInit.current) return;
    const stillValid = selectDef(league, selId);
    setSelId(
      stillValid
        ? selId
        : espnApplicable.find((e) => e.short === 'scoreboard')
          ? espnId('scoreboard')
          : espnApplicable[0]
            ? espnId(espnApplicable[0].short)
            : flatGroups[0]
              ? flatId(flatGroups[0].api, flatGroups[0].eps[0].short)
              : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  // Reset params + clear result whenever the (league, endpoint) selection changes.
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return; // preserve URL-provided params on first mount
    }
    setParams(defaultParams(fieldsFor(league, sel)));
    setRawData(null);
    setRawText(null);
    setError(null);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, selId]);

  // Keep the URL in sync (shareable) without reloading.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = buildShareUrl({ prefix, selId, params, parsed, section });
    window.history.replaceState(null, '', url);
  }, [prefix, selId, params, parsed, section]);

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
    const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null);
    if (parsed && hasParser) {
      entries.push(['parsed', 'true']);
      if (sel.short === 'summary' && section) entries.push(['section', section]);
    }
    const args = entries
      .map(([k, v]) => {
        // Render booleans (true/false) and numbers as literals; everything else
        // as a quoted string — so e.g. includeReplays=false reads as `false`.
        const isBool = v === 'true' || v === 'false';
        const isNum = /^-?\d+(\.\d+)?$/.test(v);
        return `${k}: ${isBool || isNum ? v : `'${v}'`}`;
      })
      .join(', ');
    const method =
      sel.kind === 'flat' ? flatMethodName(sel.api, sel.short) : espnMethodName(prefix, sel.short);
    return `await sdv.${prefix}.${method}(${args ? `{ ${args} }` : '{}'});`;
  }, [prefix, sel, params, parsed, hasParser, section]);

  // Parse the cached raw payload client-side (instant Raw<->Parsed toggle).
  const parsedView = useMemo(() => {
    if (!parsed || !hasParser || rawData == null || !sel) return null;
    try {
      const key = sel.kind === 'espn' ? sel.short : sel.def.parser;
      if (sel.kind === 'espn' && sel.short === 'summary') {
        const dict = parseEndpoint('espn', 'summary', rawData);
        const sections = dict && typeof dict === 'object' ? Object.keys(dict) : [];
        const active = section && sections.includes(section) ? section : sections[0];
        return { kind: 'summary', sections, active, rows: active ? dict[active] : [] };
      }
      const out = parseEndpoint(sel.kind, key, rawData);
      if (out == null) return { error: 'No parser registered for this endpoint.' };
      return { kind: 'table', rows: out };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }, [parsed, hasParser, rawData, sel, section]);

  async function run() {
    setLoading(true);
    setError(null);
    setRawData(null);
    setRawText(null);
    setStatus(null);
    try {
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
      setRawText(text);
      try {
        setRawData(JSON.parse(text));
      } catch {
        setRawData(null); // non-JSON (Statcast CSV/HTML) — raw text only
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

  function applyExample(ex) {
    didInit.current = true; // we're explicitly setting everything; don't reset
    setPrefix(ex.league);
    setSelId(ex.endpoint);
    setParams(Object.fromEntries(Object.entries(ex.params || {}).map(([k, v]) => [k, String(v)])));
    setParsed(!!ex.parsed);
    setSection(ex.section || null);
    setRawData(null);
    setRawText(null);
    setError(null);
    setStatus(null);
  }

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const exampleGroups = useMemo(() => examplesBySport(), []);
  const prettyRaw = useMemo(() => {
    if (rawData != null) return JSON.stringify(rawData, null, 2);
    return rawText;
  }, [rawData, rawText]);

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

        <label className={clsx(styles.field, styles.examplesField)}>
          <span className={styles.label}>Examples</span>
          <select
            className={styles.select}
            value=""
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.id === e.target.value);
              if (ex) applyExample(ex);
            }}
          >
            <option value="">Load an example…</option>
            {Object.entries(exampleGroups).map(([sport, list]) => (
              <optgroup key={sport} label={sport}>
                {list.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.label}
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
        <button className={styles.copyBtn} onClick={() => copy('call', call)} type="button">
          {copied === 'call' ? 'Copied ✓' : 'Copy'}
        </button>
      </div>

      <div className={styles.requestRow}>
        <span className={styles.requestLabel}>GET</span>
        {preview.error ? (
          <code className={styles.requestErr}>{preview.error}</code>
        ) : (
          <code className={styles.requestUrl}>{preview.url}</code>
        )}

        {hasParser && (
          <div className={styles.toggle} role="group" aria-label="Output format">
            <button
              type="button"
              className={clsx(styles.toggleBtn, !parsed && styles.toggleOn)}
              onClick={() => setParsed(false)}
            >
              Raw
            </button>
            <button
              type="button"
              className={clsx(styles.toggleBtn, parsed && styles.toggleOn)}
              onClick={() => setParsed(true)}
              title="Run through the registered parser → tidy rows"
            >
              Parsed
            </button>
          </div>
        )}

        <button
          className={clsx('button', 'button--primary', styles.runBtn)}
          onClick={run}
          disabled={loading || !!preview.error}
        >
          {loading ? 'Running…' : 'Run ▶'}
        </button>
        <button
          className={styles.linkBtn}
          type="button"
          onClick={() =>
            copy('link', window.location.origin + buildShareUrl({ prefix, selId, params, parsed, section }))
          }
          title="Copy a shareable link to this exact call"
        >
          {copied === 'link' ? 'Link copied ✓' : '🔗 Share'}
        </button>
      </div>

      {error && <div className={clsx(styles.output, styles.errorBox)}>{error}</div>}

      {(rawData != null || rawText != null) && (
        <div className={styles.output}>
          <div className={styles.outputHead}>
            <span>{parsed && hasParser ? 'Parsed' : 'Response'}</span>
            {status != null && <span className={styles.statusPill}>HTTP {status}</span>}
            {!(parsed && hasParser) && prettyRaw != null && (
              <span className={styles.bytes}>{(prettyRaw.length / 1024).toFixed(1)} KB</span>
            )}
            {parsed && hasParser && parsedView?.kind === 'summary' && (
              <select
                className={styles.sectionSelect}
                value={parsedView.active || ''}
                onChange={(e) => setSection(e.target.value)}
              >
                {parsedView.sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {parsed && hasParser && (
              <button
                className={styles.copyBtn}
                type="button"
                onClick={() =>
                  copy('json', JSON.stringify(parsedView?.rows ?? parsedView ?? {}, null, 2))
                }
              >
                {copied === 'json' ? 'Copied ✓' : 'Copy JSON'}
              </button>
            )}
          </div>

          {parsed && hasParser ? (
            parsedView?.error ? (
              <div className={styles.errorBox}>{parsedView.error}</div>
            ) : (
              <DataTable rows={parsedView?.rows} />
            )
          ) : (
            <pre className={styles.json}>
              {prettyRaw && prettyRaw.length > 200000
                ? prettyRaw.slice(0, 200000) + '\n… (truncated)'
                : prettyRaw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
