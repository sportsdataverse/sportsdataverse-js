import should from 'should';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { parserFor } from '../../dist/parsers/_registry.js';
import { MULTI_TABLE_SECTIONS } from '../../dist/parsers/_frames.js';
import { loadManifest, transformFamily } from '../../tools/codegen/vendor.mjs';
import { same } from '../helpers/parity.mjs';

// Parser-parity harness: the gate that a vendored py returns schema describes
// what the JS parser returns, on sdv-py's REAL committed captures
// (test/fixtures/py/manifest.yaml). For a DOCUMENTED endpoint (declared
// schema_compatible in vendor.yaml and carrying a non-empty returns table) the
// parser's rows must (1) contain every schema column and (2) hold, per column,
// only nulls and values of the schema type's JS runtime type. For every
// manifest entry (3) the rows equal sdv-py's own parser output on the same bytes
// (py/oracle/<family>.json.gz, tools/parity/py_oracle.py): row count, column
// set, and the first 20 rows cell by cell.
//
// Tolerances (documented, everything else strict): column ORDER is not compared
// (pandas.json_normalize orders scalars before flattened objects; JS keeps
// payload order); a nested list/object cell compares by structure (JS
// JSON-encodes it, py keeps a polars List/Struct or stringifies it with str());
// ids compare strictly (same type and value). Generated row types (Task 18a)
// are emitted only for documented endpoints verified here: the committed
// test/fixtures/py/parity_coverage.json lists them (a drift-checked summary;
// SDV_PARITY_WRITE=1 rewrites it).

const here = dirname(fileURLToPath(import.meta.url));
const FIX = join(here, '..', 'fixtures');
const CODEGEN = join(here, '..', '..', 'tools', 'codegen');
const text = (p) => (p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8');
// CSV / HTML bodies reach the parser as text, JSON as the decoded value (callFlat).
const body = (p) => (/\.(csv|html)(\.gz)?$/.test(p) ? text(p) : JSON.parse(text(p)));
const schemaColumns = (ref) => {
  const p = join(CODEGEN, 'schemas', `${ref}.yaml`);
  return existsSync(p) ? parse(text(p)).columns ?? [] : [];
};

/**
 * family -> Map(short -> returns-schema ref) of DOCUMENTED endpoints: the py
 * returns schema is kept by the vendor.yaml declaration (fail-closed) and
 * resolves to a non-empty table (an endpoint without one has nothing to verify).
 */
function documented() {
  const m = loadManifest();
  const out = new Map();
  for (const [key, c] of Object.entries(m.families)) {
    const cfg = c ?? {};
    const up = text(join(CODEGEN, 'vendor', 'upstream', 'endpoints', `${cfg.from ?? key}.yaml`));
    // No overlay: every returns_schema left is a py one the declaration kept...
    const eps = parse(transformFamily(key, cfg, up, null, m.source).text).endpoints ?? [];
    // ...unless the overlay re-points it at a JS-owned schema.
    const ovPath = join(CODEGEN, 'overlay', `${key}.yaml`);
    const ov = existsSync(ovPath) ? parse(text(ovPath)).endpoints ?? [] : [];
    const jsOwned = new Set(ov.filter((e) => 'returns_schema' in e).map((e) => e.short));
    const docd = eps.filter((e) => e.returns_schema && !jsOwned.has(e.short) && schemaColumns(e.returns_schema).length);
    out.set(key, new Map(docd.map((e) => [e.short, e.returns_schema])));
  }
  return out;
}

const isNum = (v) => typeof v === 'number' || typeof v === 'bigint';
const TYPE_OK = {
  integer: isNum,
  numeric: isNum,
  double: isNum,
  character: (v) => typeof v === 'string',
  logical: (v) => typeof v === 'boolean',
};

/** The parser's output exactly as `callFlat(def, { parsed: true })` returns it. */
function runParser(def, raw) {
  const fn = parserFor(def.parser);
  return def.parser in MULTI_TABLE_SECTIONS ? fn(raw, undefined) : fn(raw);
}

// py dispatchers that return {name: frame} where JS returns one frame: the primary
// sub-frame (src/parsers/nhl_api_web.ts header).
const PRIMARY_FRAME = { parse_nhl_web_right_rail: 'season_series', parse_nhl_web_club_stats: 'skaters' };

const columnsOf = (rows) => [...new Set(rows.flatMap((r) => Object.keys(r)))];

/** (3) JS rows vs one py oracle frame `{columns, n_rows, rows}`. */
function assertFrame(rows, py, label) {
  rows.length.should.equal(py.n_rows, `${label}: row count`);
  if (!py.n_rows) return;
  columnsOf(rows).sort().should.eql([...py.columns].sort(), `${label}: column set`);
  py.rows.forEach((pr, i) => {
    for (const c of py.columns) {
      same(rows[i][c], pr[c], c).should.equal(
        true,
        `${label}[${i}].${c}: js=${JSON.stringify(rows[i][c])?.slice(0, 120)} py=${JSON.stringify(pr[c])?.slice(0, 120)}`
      );
    }
  });
}

const manifest = parse(readFileSync(join(FIX, 'py', 'manifest.yaml'), 'utf8'));
const docs = documented();

for (const [family, fixtures] of Object.entries(manifest)) {
  const oracle = JSON.parse(text(join(FIX, 'py', 'oracle', `${family}.json.gz`)));
  describe(`parser parity: ${family} (sdv-py real captures)`, () => {
    for (const [path, short] of Object.entries(fixtures)) {
      const ref = docs.get(family)?.get(short);
      it(`${short} <- ${path}${ref ? '' : ' (no returns table: parity only)'}`, () => {
        const def = FLAT_WRAPPERS.find((w) => w.api === family && w.short === short);
        should.exist(def, `${family}.${short} is not a wrapper`);
        const out = runParser(def, body(join(FIX, path)));
        let py = oracle[path].out;
        if (def.parser in MULTI_TABLE_SECTIONS) py = py[MULTI_TABLE_SECTIONS[def.parser].default];
        if (def.parser in PRIMARY_FRAME) py = py[PRIMARY_FRAME[def.parser]];

        if (ref) {
          def.returnsSchema.should.equal(ref);
          Array.isArray(out).should.equal(true, `${def.parser} returned ${typeof out}, not rows`);
          out.length.should.be.above(0, 'an empty frame verifies nothing');
          const schema = schemaColumns(ref);
          // (1) every schema column is present
          const cols = columnsOf(out);
          schema.map((c) => c.name).filter((n) => !cols.includes(n)).should.eql([], 'schema columns missing from the rows');
          // (2) runtime types agree with the schema (nulls allowed)
          const bad = [];
          for (const { name, type } of schema) {
            const ok = TYPE_OK[type];
            if (!ok) throw new Error(`${name}: unknown schema type ${type}`);
            const v = out.map((r) => r[name]).find((x) => x !== null && x !== undefined && !ok(x));
            if (v !== undefined) bad.push(`${name}: ${type}, JS ${typeof v} ${JSON.stringify(v).slice(0, 60)}`);
          }
          bad.should.eql([], 'JS runtime types disagree with the schema');
        }

        // (3) parity with sdv-py's own output on the same capture
        if (Array.isArray(out)) {
          out.length.should.be.above(0, 'an empty frame verifies nothing');
          assertFrame(out, py, short);
        } else {
          // a multi-frame payload: py returns {name: frame}, JS {name: rows}
          Object.keys(out).should.eql(Object.keys(py), `${short}: frame names`);
          for (const k of Object.keys(py)) assertFrame(out[k], py[k], `${short}.${k}`);
        }
      });
    }
  });
}

describe('parser parity: manifest + coverage', () => {
  it('every oracle entry has a capture in the manifest (regenerate with tools/parity/py_oracle.py)', () => {
    for (const [family, fixtures] of Object.entries(manifest)) {
      const oracle = JSON.parse(text(join(FIX, 'py', 'oracle', `${family}.json.gz`)));
      Object.keys(oracle).filter((k) => k !== '_provenance').sort().should.eql(Object.keys(fixtures).sort(), family);
    }
  });
  it('parity_coverage.json is current (SDV_PARITY_WRITE=1 rewrites it; SDV_PARITY_REPORT=1 prints it)', () => {
    const cov = coverage();
    const file = join(FIX, 'py', 'parity_coverage.json');
    const out = `${JSON.stringify(cov, null, 2)}
`;
    if (process.env.SDV_PARITY_WRITE) writeFileSync(file, out);
    if (process.env.SDV_PARITY_REPORT) {
      console.log('family | documented | verified | unverified | incompatible');
      for (const [f, c] of Object.entries(cov.families)) {
        console.log(`${f} | ${c.documented} | ${c.verified} | ${c.unverified} | ${c.incompatible}`);
      }
    }
    readFileSync(file, 'utf8').should.equal(out, 'stale: rerun with SDV_PARITY_WRITE=1');
    cov.totals.verified.should.be.above(150);
  });
});

/**
 * Per family: `documented` (py returns table attached), `verified` (documented and
 * checked on a real capture here; `verified_endpoints` names them), `unverified`,
 * and `incompatible` (a py returns table vendor.yaml explicitly declares does not
 * describe the JS parser: `schema_compatible: false` at family / parser level, or
 * `schema_incompatible`). Families with none of these are left out.
 */
function coverage() {
  const m = loadManifest();
  const families = {};
  const totals = { documented: 0, verified: 0, unverified: 0, incompatible: 0 };
  for (const [key, c] of Object.entries(m.families).sort(([a], [b]) => a.localeCompare(b))) {
    const cfg = c ?? {};
    const shorts = docs.get(key);
    const verified = [...new Set(Object.values(manifest[key] ?? {}))].filter((s) => shorts.has(s)).sort();
    const flipped = new Set(cfg.schema_incompatible ?? []);
    const py = parse(text(join(CODEGEN, 'vendor', 'upstream', 'endpoints', `${cfg.from ?? key}.yaml`))).endpoints ?? [];
    let incompatible = 0;
    for (const e of py) {
      const short = (cfg.names ?? {})[e.short] ?? e.short;
      if (!e.returns_schema || !e.parser || (cfg.parser_overrides ?? {})[short]) continue;
      const entry = (cfg.parsers ?? {})[e.parser];
      if (flipped.has(short) || (entry ? entry.schema_compatible : cfg.schema_compatible) === false) incompatible++;
    }
    const row = {
      documented: shorts.size,
      verified: verified.length,
      unverified: shorts.size - verified.length,
      incompatible,
    };
    if (!row.documented && !incompatible) continue;
    for (const k of Object.keys(totals)) totals[k] += row[k];
    families[key] = { ...row, verified_endpoints: verified };
  }
  return {
    _doc:
      'Parser-parity coverage of the vendored py returns tables, written by test/parsers/parity.test.js ' +
      '(SDV_PARITY_WRITE=1). documented: py table attached; verified: documented and checked on a real ' +
      'sdv-py capture (verified_endpoints; generated row types are emitted only for these); unverified: ' +
      'documented, no capture; incompatible: py table vendor.yaml declares does not describe the JS ' +
      'parser (schema_compatible: false, or schema_incompatible).',
    source_ref: m.source.ref,
    totals,
    families,
  };
}
