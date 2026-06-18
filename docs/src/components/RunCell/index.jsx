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
// the result (a tidy table when `parsed`, pretty JSON / raw text otherwise).
//
// It reuses the playground's own infrastructure verbatim:
//   - resolve.mjs        — builds the request URL (no network)
//   - parsers.bundle.mjs — client-side parseEndpoint(kind, key, raw, section)
//   - /api/run           — the Vercel serverless proxy (ESPN/flat send no CORS)
//
// Generalizations over the original PoC:
//   - works for EVERY endpoint kind: ESPN (incl. `leagueParam` leagues like
//     soccer, where a `league` slug field is injected) and every flat family
//     (MLB Stats, NHL ×4, NFL.com, Statcast, odds, CBS/Fox/Yahoo, 247);
//   - the ESPN `summary` dispatcher gets a live section <select> (mirrors the
//     Playground) so a reader can flip between the 21 sub-frames after running;
//   - params are seeded from endpoints.json metadata, and a small curated ENUM
//     map renders a <select> for well-known closed-set params (season_type,
//     csv, game_type, …) with a text input fallback everywhere else;
//   - non-JSON upstreams (Statcast CSV / HTML) keep their raw text and render it
//     instead of silently showing nothing.
//
// Props:
//   league   (string)  league / namespace prefix, e.g. "nba", "soccer", "fox"
//   endpoint (string)  "espn:<short>" or "flat:<api>:<short>"
//   params   (object)  default param values, e.g. { team_id: 13 }
//   parsed   (bool)    run the response through parseEndpoint and show a table
//   section  (string)  for the ESPN summary dispatcher, the initial sub-frame
//   title    (string)  optional heading above the cell
// ---------------------------------------------------------------------------

const FLAT_APIS = endpoints.flatApis || [];
const FLAT_HOSTS = endpoints.flatHosts || {};

const MAX_TABLE_ROWS = 25;
const MAX_TABLE_COLS = 12;

// Curated closed-set options for well-known params. endpoints.json carries no
// enum metadata (only name/queryKey/default/required), so this small map lets a
// reader pick from a dropdown for the handful of params with a real fixed set.
// Anything not listed here renders as a free-text input. Keyed by param name.
const ENUM_PARAMS = {
  season_type: ['REG', 'POST', 'PRE', '1', '2', '3'],
  game_type: ['2', '1', '3'], // NHL/Statcast: 2 = regular season
  csv: ['true', 'false'],
  all: ['true', 'false'],
  positions: ['forwards', 'defensemen', 'goalies'],
  roster_type: ['active', 'fullSeason', '40Man', 'depthChart'],
  player_type: ['pitcher', 'batter'],
  include_drive_chart: ['true', 'false'],
  include_replays: ['true', 'false'],
  include_standings: ['true', 'false'],
};

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

/**
 * Editable fields for a selection (league slug + path + query params), with
 * seeded defaults. Mirrors the Playground's `fieldsFor`: a `league` field is
 * injected for ESPN `leagueParam` leagues (soccer) so the reader can pick the
 * competition slug. Each field carries `options` when it's in ENUM_PARAMS.
 */
function fieldsFor(sel) {
  const fields = [];
  if (sel.kind === 'espn' && sel.lg && sel.lg.leagueParam) {
    fields.push({ name: 'league', required: false, def: sel.lg.league, kind: 'league' });
  }
  for (const p of sel.def.pathParams || []) {
    fields.push({
      name: p.name,
      required: p.required !== false,
      def: p.default,
      kind: 'path',
      options: ENUM_PARAMS[p.name],
    });
  }
  for (const p of sel.def.queryParams || []) {
    fields.push({
      name: p.name,
      required: false,
      def: p.default,
      kind: 'query',
      options: ENUM_PARAMS[p.name],
    });
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

function RunCellInner({ league, endpoint, params: seedParams, parsed, section: initialSection, title }) {
  const { useMemo, useState } = React;

  const sel = useMemo(() => resolveSelection(league, endpoint), [league, endpoint]);
  const fields = useMemo(() => (sel.error ? [] : fieldsFor(sel)), [sel]);

  // Seed params: explicit `params` prop wins, then the endpoint's declared
  // defaults. Everything is held as a string (the inputs are text/select).
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

  // Active summary sub-frame (only meaningful for espn:summary). Seeded from the
  // `section` prop; the reader can change it live via the dropdown after a run.
  const [section, setSection] = useState(initialSection || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [rawText, setRawText] = useState(null);

  const isSummary = sel.kind === 'espn' && sel.short === 'summary';

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
    if (parsed && isSummary && section) entries.push(['section', section]);
    const args = entries
      .map(([k, v]) => {
        const isBool = v === 'true' || v === 'false';
        const isNum = /^-?\d+(\.\d+)?$/.test(v);
        return `${k}: ${isBool || isNum ? v : `'${v}'`}`;
      })
      .join(', ');
    return `await sdv.${league}.${m}(${args ? `{ ${args} }` : '{}'});`;
  }, [sel, league, params, parsed, isSummary, section]);

  // Parse the cached payload client-side, exactly like the playground does. For
  // the summary dispatcher we surface the full section list so the dropdown can
  // flip between sub-frames without a re-run.
  const parsedView = useMemo(() => {
    if (!parsed || sel.error || rawData == null) return null;
    try {
      if (isSummary) {
        const dict = parseEndpoint('espn', 'summary', rawData);
        const sections = dict && typeof dict === 'object' ? Object.keys(dict) : [];
        const active = section && sections.includes(section) ? section : sections[0];
        return { kind: 'summary', sections, active, rows: active ? dict[active] : [] };
      }
      const key = sel.kind === 'espn' ? sel.short : sel.def.parser;
      if (!key) return { error: 'No parser registered for this endpoint.' };
      const out = parseEndpoint(sel.kind, key, rawData);
      if (out == null) return { error: 'No parser registered for this endpoint.' };
      return { kind: 'table', rows: out };
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }, [parsed, sel, rawData, section, isSummary]);

  // Does the selected flat endpoint even have a parser? ESPN shorts always do.
  const hasParser = sel.error ? false : sel.kind === 'flat' ? !!sel.def.parser : true;

  async function run() {
    setLoading(true);
    setError(null);
    setStatus(null);
    setRawData(null);
    setRawText(null);
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
      setRawText(text);
      try {
        setRawData(JSON.parse(text));
      } catch {
        setRawData(null); // non-JSON body (CSV/HTML flat families)
      }
      if (!res.ok) setError(`Proxy / upstream returned ${res.status}.`);
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

  const showParsedTable = parsed && hasParser;
  const prettyRaw = rawData != null ? JSON.stringify(rawData, null, 2) : rawText;

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
              {f.options ? (
                <select
                  className={styles.input}
                  value={params[f.name] ?? ''}
                  onChange={(e) => setParams((p) => ({ ...p, [f.name]: e.target.value }))}
                >
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={styles.input}
                  value={params[f.name] ?? ''}
                  placeholder={f.def != null ? String(f.def) : ''}
                  onChange={(e) => setParams((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              )}
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
        {showParsedTable && parsedView?.kind === 'summary' && parsedView.sections?.length > 0 && (
          <select
            className={styles.sectionSelect}
            value={parsedView.active || ''}
            onChange={(e) => setSection(e.target.value)}
            title="Pick a summary sub-frame"
          >
            {parsedView.sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {error ? <div className={styles.err}>{error}</div> : null}

      {/* Parsed → a tidy table (or the parser's "no parser" note). */}
      {showParsedTable && parsedView ? (
        parsedView.error ? (
          <div className={styles.err}>{parsedView.error}</div>
        ) : (
          <CompactTable rows={parsedView.rows} />
        )
      ) : null}

      {/* Raw JSON (parsed off, or no parser). */}
      {!showParsedTable && rawData != null ? (
        <pre className={styles.json}>
          <code>{JSON.stringify(rawData, null, 2).slice(0, 4000)}</code>
        </pre>
      ) : null}

      {/* Non-JSON upstream (Statcast CSV / HTML): show the raw text body. */}
      {!showParsedTable && rawData == null && rawText ? (
        <pre className={styles.json}>
          <code>{rawText.slice(0, 4000)}{rawText.length > 4000 ? '\n… (truncated)' : ''}</code>
        </pre>
      ) : null}

      {status != null && rawData == null && !rawText && !error ? (
        <div className={styles.empty}>HTTP {status} — no body returned.</div>
      ) : null}
    </div>
  );
}

/**
 * <RunCell league="nba" endpoint="espn:scoreboard" parsed /> — an SSR-safe,
 * single-endpoint live runner for inline use in MDX guides.
 *
 * Props:
 *   - league   (string, required)  league / namespace prefix, e.g. "nba"
 *   - endpoint (string, required)  "espn:<short>" or "flat:<api>:<short>"
 *   - params   (object)            default param values, e.g. {{ team_id: 13 }}
 *   - parsed   (bool)              render a tidy table via parseEndpoint
 *   - section  (string)            initial sub-frame for the ESPN summary dispatcher
 *   - title    (string)            optional heading above the cell
 */
export default function RunCell(props) {
  return (
    <BrowserOnly fallback={<div className={styles.cell}>Loading live cell…</div>}>
      {() => <RunCellInner {...props} />}
    </BrowserOnly>
  );
}
