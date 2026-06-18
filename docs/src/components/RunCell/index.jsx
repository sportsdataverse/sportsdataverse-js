import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import endpoints from '@site/src/playground/endpoints.json';
import { resolveUrl, resolveFlatUrl } from '@site/src/playground/resolve.mjs';
import { parseEndpoint } from '@site/src/playground/parsers.bundle.mjs';
import styles from './styles.module.css';

// ---------------------------------------------------------------------------
// <RunCell> — a compact, single-endpoint live runner, droppable inline in an
// MDX guide. It is a focused slice of the full <Playground>: one endpoint, a
// small row of editable param inputs, the resolved GET URL, a Run button, and
// the result (a tidy table when `parsed`, pretty JSON otherwise).
//
// It reuses the playground's own infrastructure verbatim:
//   - resolve.mjs        — builds the request URL (no network)
//   - parsers.bundle.mjs — client-side parseEndpoint(kind, key, raw, section)
//   - /api/run           — the Vercel serverless proxy (ESPN/flat send no CORS)
//
// Props:
//   league   (string)  league prefix, e.g. "nba"
//   endpoint (string)  "espn:<short>" or "flat:<api>:<short>"
//   params   (object)  default param values, e.g. { team_id: 13 }
//   parsed   (bool)    run the response through parseEndpoint and show a table
//   section  (string)  for the ESPN summary dispatcher, pick one sub-frame
//   title    (string)  optional heading above the cell
// ---------------------------------------------------------------------------

const FLAT_APIS = endpoints.flatApis || [];
const FLAT_HOSTS = endpoints.flatHosts || {};

const MAX_TABLE_ROWS = 25;
const MAX_TABLE_COLS = 12;

/** snake_case -> camelCase (espn_nba_scoreboard -> espnNbaScoreboard). */
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
const espnMethodName = (prefix, short) => toCamel(`espn_${prefix}_${short}`);
const flatMethodName = (api, short) => toCamel(`${api}_${short}`);

/** Resolve the `endpoint` prop string to a def + dispatch metadata. */
function resolveSelection(league, endpoint) {
  if (!endpoint) return { error: 'RunCell: missing `endpoint` prop.' };
  if (endpoint.startsWith('flat:')) {
    const [, api, short] = endpoint.split(':');
    const def = FLAT_APIS.find((e) => e.api === api && e.short === short);
    if (!def) return { error: `RunCell: unknown flat endpoint "${endpoint}".` };
    return { kind: 'flat', def, api, short };
  }
  const short = endpoint.startsWith('espn:') ? endpoint.slice('espn:'.length) : endpoint;
  const lg = endpoints.leagues.find((l) => l.prefix === league);
  if (!lg) return { error: `RunCell: unknown league "${league}".` };
  const def = endpoints.endpoints.find((e) => e.short === short);
  if (!def) return { error: `RunCell: unknown ESPN endpoint "${short}".` };
  return { kind: 'espn', def, short, lg };
}

/** Editable fields for a selection (path + query params), with seeded defaults. */
function fieldsFor(sel) {
  const fields = [];
  for (const p of sel.def.pathParams || []) {
    fields.push({ name: p.name, required: p.required !== false, def: p.default });
  }
  for (const p of sel.def.queryParams || []) {
    fields.push({ name: p.name, required: false, def: p.default });
  }
  return fields;
}

function fmtCell(v) {
  if (v == null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function CompactTable({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className={styles.empty}>0 rows (empty frame).</div>;
  }
  const allCols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cols = allCols.slice(0, MAX_TABLE_COLS);
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
      <div className={styles.meta}>
        {rows.length} rows × {allCols.length} cols
        {rows.length > MAX_TABLE_ROWS && ` — showing first ${MAX_TABLE_ROWS}`}
        {allCols.length > MAX_TABLE_COLS && `, first ${MAX_TABLE_COLS} cols`}
      </div>
    </>
  );
}

function RunCellInner({ league, endpoint, params: seedParams, parsed, section, title }) {
  const { useMemo, useState } = React;

  const sel = useMemo(() => resolveSelection(league, endpoint), [league, endpoint]);
  const fields = useMemo(() => (sel.error ? [] : fieldsFor(sel)), [sel]);

  // Seed params: explicit `params` prop wins, then the endpoint's declared
  // defaults. Everything is held as a string (the inputs are text).
  const [params, setParams] = useState(() => {
    const out = {};
    for (const f of fields) {
      if (f.def !== undefined && f.def !== null) out[f.name] = String(f.def);
    }
    for (const [k, v] of Object.entries(seedParams || {})) {
      if (v !== undefined && v !== null) out[k] = String(v);
    }
    return out;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [rawData, setRawData] = useState(null);

  const preview = useMemo(() => {
    if (sel.error) return { url: null, error: sel.error };
    try {
      const url =
        sel.kind === 'flat'
          ? resolveFlatUrl(sel.def, params, FLAT_HOSTS)
          : resolveUrl(sel.def, sel.lg, params, endpoints.hosts);
      return { url, error: null };
    } catch (e) {
      return { url: null, error: String(e.message || e) };
    }
  }, [sel, params]);

  const method = useMemo(() => {
    if (sel.error) return '';
    const m = sel.kind === 'flat' ? flatMethodName(sel.api, sel.short) : espnMethodName(league, sel.short);
    const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null);
    if (parsed) entries.push(['parsed', 'true']);
    if (parsed && section) entries.push(['section', section]);
    const args = entries
      .map(([k, v]) => {
        const isBool = v === 'true' || v === 'false';
        const isNum = /^-?\d+(\.\d+)?$/.test(v);
        return `${k}: ${isBool || isNum ? v : `'${v}'`}`;
      })
      .join(', ');
    return `await sdv.${league}.${m}(${args ? `{ ${args} }` : '{}'});`;
  }, [sel, league, params, parsed, section]);

  // Parse the cached payload client-side, exactly like the playground does.
  const parsedView = useMemo(() => {
    if (!parsed || sel.error || rawData == null) return null;
    try {
      if (sel.kind === 'espn' && sel.short === 'summary') {
        const dict = parseEndpoint('espn', 'summary', rawData);
        const sections = dict && typeof dict === 'object' ? Object.keys(dict) : [];
        const active = section && sections.includes(section) ? section : sections[0];
        return { rows: active ? dict[active] : [] };
      }
      const key = sel.kind === 'espn' ? sel.short : sel.def.parser;
      const out = parseEndpoint(sel.kind, key, rawData);
      if (out == null) return { error: 'No parser registered for this endpoint.' };
      return { rows: out };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }, [parsed, sel, rawData, section]);

  async function run() {
    setLoading(true);
    setError(null);
    setStatus(null);
    setRawData(null);
    try {
      const reqBody =
        sel.kind === 'flat'
          ? { api: sel.api, endpoint: sel.short, params }
          : { league, endpoint: sel.short, params };
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      setStatus(res.status);
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null; // non-JSON body (CSV/HTML flat families)
      }
      setRawData(data);
      if (!res.ok) setError(`Proxy returned ${res.status}.`);
    } catch (e) {
      setError(
        `Request failed: ${String(e.message || e)} — the live proxy runs on the ` +
          'deployed site (Vercel); it is unavailable under plain `docusaurus start`.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (sel.error) {
    return (
      <div className={styles.cell}>
        <div className={styles.err}>{sel.error}</div>
      </div>
    );
  }

  return (
    <div className={styles.cell}>
      {title ? <div className={styles.title}>{title}</div> : null}

      {fields.length > 0 && (
        <div className={styles.params}>
          {fields.map((f) => (
            <label key={f.name} className={styles.field}>
              <span className={styles.label}>
                {f.name}
                {f.required ? <span className={styles.req}>*</span> : null}
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

      <div className={styles.urlRow}>
        <span className={styles.urlTag}>GET</span>
        {preview.error ? (
          <span className={styles.err}>{preview.error}</span>
        ) : (
          <code className={styles.url}>{preview.url}</code>
        )}
      </div>

      <div className={styles.runRow}>
        <button className={styles.runBtn} onClick={run} disabled={loading || !!preview.error}>
          {loading ? 'Running…' : 'Run ▶'}
        </button>
        <code className={styles.method}>{method}</code>
      </div>

      {error ? <div className={styles.err}>{error}</div> : null}

      {rawData != null && parsed && parsedView ? (
        parsedView.error ? (
          <div className={styles.err}>{parsedView.error}</div>
        ) : (
          <CompactTable rows={parsedView.rows} />
        )
      ) : null}

      {rawData != null && !parsed ? (
        <pre className={styles.json}>
          <code>{JSON.stringify(rawData, null, 2).slice(0, 4000)}</code>
        </pre>
      ) : null}

      {status != null && rawData == null && !error ? (
        <div className={styles.empty}>HTTP {status} — no JSON body returned.</div>
      ) : null}
    </div>
  );
}

/**
 * <RunCell league="nba" endpoint="espn:scoreboard" parsed /> — an SSR-safe,
 * single-endpoint live runner for inline use in MDX guides.
 *
 * Props:
 *   - league   (string, required)  league prefix, e.g. "nba"
 *   - endpoint (string, required)  "espn:<short>" or "flat:<api>:<short>"
 *   - params   (object)            default param values, e.g. {{ team_id: 13 }}
 *   - parsed   (bool)              render a tidy table via parseEndpoint
 *   - section  (string)            sub-frame name for the ESPN summary dispatcher
 *   - title    (string)            optional heading above the cell
 */
export default function RunCell(props) {
  return (
    <BrowserOnly fallback={<div className={styles.cell}>Loading live cell…</div>}>
      {() => <RunCellInner {...props} />}
    </BrowserOnly>
  );
}
