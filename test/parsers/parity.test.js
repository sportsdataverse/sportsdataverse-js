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
import { isIdColumn, same, sameType } from '../helpers/parity.mjs';

// Parser-parity harness: the gate that a vendored py returns schema describes
// what the JS parser returns, on sdv-py's REAL committed captures
// (test/fixtures/py/manifest.yaml). For a DOCUMENTED endpoint (its py returns
// table is attached by the vendor.yaml declaration and has columns) the parser's
// rows must (1) contain every schema column and (2) hold, per column, only nulls
// and values of the schema type's JS runtime type. For every manifest entry (3)
// the rows equal sdv-py's own parser output on the same bytes
// (py/oracle/<family>.json.gz, tools/parity/py_oracle.py): row count, column set,
// every non-null JS value's type against the oracle's polars dtype, and the first
// 20 rows cell by cell.
//
// Tolerances (documented, everything else strict): column ORDER is not compared
// (pandas.json_normalize orders scalars before flattened objects; JS keeps
// payload order); a nested list/object cell compares by structure (JS
// JSON-encodes it, py keeps a polars List/Struct or stringifies it with str());
// ids (`id`, `*_id(s)`, `*_pk`, MLBAM id columns) compare strictly, and an id
// column py types numeric (Int64, or Float64 with nulls) must be decimal STRINGS
// in JS (the v4 INT64 id rule, src/core/int64.ts) — in (2) and (3) alike.
//
// A `kind: frames` schema (sdv-py #683: one table per key of the parser's dict,
// e.g. a stats.nba.com payload with several result sets) is checked frame by
// frame: the parser returns an object with exactly those keys, in order, and (1) +
// (2) hold for each frame. A frame with no rows in the capture cannot show its
// columns (JS rows carry no schema), so all its columns are unexercised.
//
// A `kind: frames` schema with `frames_by: <request param>` is ONE table: the
// frame whose section is that param's value (sdv-py pff_api /v2 reports). Its
// columns all count, but it is never verified: a manifest capture records no
// request params to pick its frame by, so it stays unverified (no object of
// frames is expected of it).
//
// A schema column that is null in every row of every capture is UNEXERCISED:
// (2) cannot check its type (py types an all-null column `character`). The
// committed test/fixtures/py/parity_coverage.json (drift-checked;
// SDV_PARITY_WRITE=1 rewrites it) lists the verified endpoints with their
// unexercised columns; generated row types (Task 18a) are emitted only for
// verified endpoints and type every unexercised column `unknown`.

const here = dirname(fileURLToPath(import.meta.url));
const FIX = join(here, '..', 'fixtures');
const CODEGEN = join(here, '..', '..', 'tools', 'codegen');
const text = (p) => (p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8');
// CSV / HTML bodies reach the parser as text, JSON as the decoded value (callFlat).
const body = (p) => (/\.(csv|html)(\.gz)?$/.test(p) ? text(p) : JSON.parse(text(p)));
/**
 * A returns schema's tables: `[{ section, columns }]`, one per frame of a
 * `kind: frames` schema, else one with `section: null`. `[]` when the file is
 * missing or publishes no columns (an `unverified` schema).
 */
const docMemo = new Map(); // ref -> parsed schema or null (each schema file is parsed once)
const schemaDoc = (ref) => {
  if (!docMemo.has(ref)) {
    const p = join(CODEGEN, 'schemas', `${ref}.yaml`);
    docMemo.set(ref, existsSync(p) ? parse(text(p)) : null);
  }
  return docMemo.get(ref);
};
const schemaTables = (ref) => {
  const doc = schemaDoc(ref);
  if (!doc) return [];
  const all = doc.kind === 'frames' ? doc.frames : [{ section: null, columns: doc.columns ?? [] }];
  return all.some((t) => t.columns.length) ? all : [];
};
/** Every schema column as `[section, column]` (section null for one frame). */
const schemaColumns = (ref) => schemaTables(ref).flatMap((t) => t.columns.map((c) => [t.section, c]));
const label = ([section, c]) => (section === null ? c.name : `${section}.${c.name}`);
const nil = (v) => v === null || v === undefined;

/**
 * family -> [{ short, ref, status }] for every upstream endpoint carrying a py
 * returns_schema: vendor.mjs `transformFamily` (the same derivation `npm run
 * vendor` runs, overlay included) says why each is or is not attached.
 */
function pySchemaStatus() {
  const m = loadManifest();
  const out = new Map();
  for (const [key, c] of Object.entries(m.families)) {
    const cfg = c ?? {};
    const up = text(join(CODEGEN, 'vendor', 'upstream', 'endpoints', `${cfg.from ?? key}.yaml`));
    const ovPath = join(CODEGEN, 'overlay', `${key}.yaml`);
    const overlay = existsSync(ovPath) ? text(ovPath) : null;
    const { pySchemas } = transformFamily(key, cfg, up, overlay, m.source);
    // the independent count the buckets must add up to
    const total = (parse(up).endpoints ?? []).filter((e) => e.returns_schema).length;
    pySchemas.length.should.equal(total, `${key}: every py returns_schema gets a status`);
    out.set(key, pySchemas);
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
const isStr = (v) => typeof v === 'string';
/** (2)'s check for one schema column: a numeric id column is decimal strings (a number fails). */
const typeCheck = (type, name) => (TYPE_OK[type] === isNum && isIdColumn(name) ? isStr : TYPE_OK[type]);

/** The parser's output exactly as `callFlat(def, { parsed: true })` returns it. */
function runParser(def, raw) {
  const fn = parserFor(def.parser);
  return def.parser in MULTI_TABLE_SECTIONS ? fn(raw, undefined) : fn(raw);
}

// py dispatchers that return {name: frame} where JS returns one frame: the primary
// sub-frame (src/parsers/nhl_api_web.ts header).
const PRIMARY_FRAME = { parse_nhl_web_right_rail: 'season_series', parse_nhl_web_club_stats: 'skaters' };

const columnsOf = (rows) => [...new Set(rows.flatMap((r) => Object.keys(r)))];

/** (3) JS rows vs one py oracle frame `{columns, dtypes, n_rows, rows}`. */
function assertFrame(rows, py, label, parser) {
  rows.length.should.equal(py.n_rows, `${label}: row count`);
  if (!py.n_rows) return;
  columnsOf(rows).sort().should.eql([...py.columns].sort(), `${label}: column set`);
  // every non-null JS value has the JS type of py's polars dtype for that column
  const bad = [];
  py.columns.forEach((c, k) => {
    // Known sdv-py divergence, parse_on3_rdb ONLY: pandas stringifies a bool column
    // that has a null in it ('True' / 'False', 'nan' for the null), so py's dtype
    // is String; the JS port keeps booleans. Same values (same() folds case and
    // 'nan'); the column's py returns type (`character`) is wrong for JS, so
    // vendor.yaml marks those tables schema_incompatible. Scoped to that parser so
    // a "True"/"False" text column elsewhere (the nfl_pro ruling) stays strict.
    const boolText =
      parser === 'parse_on3_rdb' &&
      py.dtypes[k] === 'String' &&
      py.rows.some((r) => r[c] === 'True' || r[c] === 'False') &&
      py.rows.every((r) => nil(r[c]) || ['True', 'False', 'nan'].includes(r[c]));
    const v = rows
      .map((r) => r[c])
      .find((x) => !nil(x) && !sameType(x, py.dtypes[k], c) && !(boolText && typeof x === 'boolean'));
    if (v !== undefined) bad.push(`${c}: py ${py.dtypes[k]}, JS ${typeof v} ${JSON.stringify(String(v)).slice(0, 40)}`);
  });
  bad.should.eql([], `${label}: JS value types disagree with sdv-py's dtypes`);
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
const status = pySchemaStatus();
// family -> Map(short -> ref) of DOCUMENTED endpoints (attached py table with columns)
const docs = new Map(
  [...status].map(([f, eps]) => [
    f,
    new Map(eps.filter((e) => e.status === 'attached' && schemaColumns(e.ref).length).map((e) => [e.short, e.ref])),
  ])
);
// The documented endpoint a capture can verify: not frames_by (no capture says which frame it picks).
const verifiable = (family, short) => {
  const ref = docs.get(family)?.get(short);
  return ref && !schemaDoc(ref).frames_by ? ref : undefined;
};

// Every capture parsed once, up front (the coverage summary and the test titles use the results).
const runs = new Map();
for (const [family, fixtures] of Object.entries(manifest)) {
  for (const [path, short] of Object.entries(fixtures)) {
    const def = FLAT_WRAPPERS.find((w) => w.api === family && w.short === short);
    let out;
    let error;
    try {
      out = def && runParser(def, body(join(FIX, path)));
    } catch (e) {
      error = e;
    }
    runs.set(path, { family, short, def, out, error });
  }
}

/** The rows of one frame of a parser result (`section` null = the result itself). */
const frameRows = (out, section) => {
  const rows = section === null ? out : out?.[section];
  return Array.isArray(rows) ? rows : [];
};

/**
 * Per documented endpoint with a capture: its schema columns, and those null in
 * every row of every capture (a frames schema's are `<section>.<column>`).
 */
const exerciseMemo = new Map();
function exercise(family, short) {
  const key = `${family}.${short}`;
  if (!exerciseMemo.has(key)) exerciseMemo.set(key, exerciseUncached(family, short));
  return exerciseMemo.get(key);
}
function exerciseUncached(family, short) {
  const cols = schemaColumns(docs.get(family).get(short));
  const outs = [...runs.values()].filter((r) => r.family === family && r.short === short && r.out).map((r) => r.out);
  const unexercised = cols
    .filter(([section, c]) => outs.every((o) => frameRows(o, section).every((r) => nil(r[c.name]))))
    .map(label);
  return { columns: cols.length, exercised: cols.length - unexercised.length, unexercised_columns: unexercised };
}

for (const [family, fixtures] of Object.entries(manifest)) {
  const oracle = JSON.parse(text(join(FIX, 'py', 'oracle', `${family}.json.gz`)));
  describe(`parser parity: ${family} (sdv-py real captures)`, () => {
    for (const [path, short] of Object.entries(fixtures)) {
      const ref = verifiable(family, short);
      const ex = ref && exercise(family, short);
      const tag = ref ? ` [${ex.exercised}/${ex.columns} columns exercised]` : ' (no returns table: parity only)';
      it(`${short} <- ${path}${tag}`, () => {
        const { def, out, error } = runs.get(path);
        should.exist(def, `${family}.${short} is not a wrapper`);
        if (error) throw error;
        let py = oracle[path].out;
        if (def.parser in MULTI_TABLE_SECTIONS) py = py[MULTI_TABLE_SECTIONS[def.parser].default];
        if (def.parser in PRIMARY_FRAME) py = py[PRIMARY_FRAME[def.parser]];

        if (ref) {
          def.returnsSchema.should.equal(ref);
          const tables = schemaTables(ref);
          if (tables[0].section === null) {
            Array.isArray(out).should.equal(true, `${def.parser} returned ${typeof out}, not rows`);
            out.length.should.be.above(0, 'an empty frame verifies nothing');
          } else {
            // kind: frames -> exactly the documented tables, in order
            (out !== null && typeof out === 'object' && !Array.isArray(out)).should.equal(true, `${def.parser} returned rows, not frames`);
            Object.keys(out).should.eql(tables.map((t) => t.section), 'frame names');
          }
          const missing = [];
          const bad = [];
          for (const { section, columns } of tables) {
            const rows = frameRows(out, section);
            if (!rows.length) continue; // an empty frame shows no columns: all unexercised
            const at = section === null ? '' : `${section}.`;
            // (1) every schema column is present
            const cols = columnsOf(rows);
            missing.push(...columns.filter((c) => !cols.includes(c.name)).map((c) => at + c.name));
            // (2) runtime types agree with the schema (nulls allowed; an all-null column is unexercised)
            for (const { name, type } of columns) {
              const ok = typeCheck(type, name);
              if (!ok) throw new Error(`${at}${name}: unknown schema type ${type}`);
              const v = rows.map((r) => r[name]).find((x) => !nil(x) && !ok(x));
              if (v !== undefined) bad.push(`${at}${name}: ${type}, JS ${typeof v} ${JSON.stringify(String(v)).slice(0, 60)}`);
            }
          }
          missing.should.eql([], 'schema columns missing from the rows');
          bad.should.eql([], 'JS runtime types disagree with the schema');
          ex.exercised.should.be.above(0, 'no schema column is exercised by this capture');
        }

        // (3) parity with sdv-py's own output on the same capture
        if (Array.isArray(out)) {
          out.length.should.be.above(0, 'an empty frame verifies nothing');
          assertFrame(out, py, short, def.parser);
        } else {
          // a multi-frame payload: py returns {name: frame}, JS {name: rows}
          Object.keys(out).should.eql(Object.keys(py), `${short}: frame names`);
          for (const k of Object.keys(py)) assertFrame(out[k], py[k], `${short}.${k}`, def.parser);
        }
      });
    }
  });
}

// Bucket for each py returns_schema status; documented + no_schema + every other bucket == py_tables.
const BUCKET = {
  schema_incompatible: 'incompatible',
  declared_incompatible: 'incompatible',
  parser_override: 'overridden',
  overlay_schema: 'overlay_schema',
  undeclared: 'undeclared',
};
const BUCKETS = ['documented', 'no_schema', 'incompatible', 'overridden', 'overlay_schema', 'undeclared'];

/**
 * Per family with at least one py returns table: `py_tables`, how they split into
 * BUCKETS, `verified` / `unverified` (documented endpoints with / without a real
 * capture here) and `verified_endpoints` (short -> exercised-column report).
 */
function coverage() {
  const families = {};
  const totals = Object.fromEntries(['py_tables', ...BUCKETS, 'verified', 'unverified', 'unexercised_columns'].map((k) => [k, 0]));
  for (const [key, eps] of [...status].sort(([a], [b]) => a.localeCompare(b))) {
    if (!eps.length) continue;
    const row = Object.fromEntries(['py_tables', ...BUCKETS].map((k) => [k, 0]));
    row.py_tables = eps.length;
    for (const e of eps) {
      const b = e.status === 'attached' ? (schemaColumns(e.ref).length ? 'documented' : 'no_schema') : BUCKET[e.status];
      if (!b) throw new Error(`${key}.${e.short}: unknown status ${e.status}`);
      row[b]++;
    }
    const captured = new Set(Object.values(manifest[key] ?? {}));
    const verified = [...docs.get(key).keys()].filter((s) => captured.has(s) && verifiable(key, s)).sort();
    row.verified = verified.length;
    row.unverified = row.documented - verified.length;
    row.verified_endpoints = Object.fromEntries(verified.map((s) => [s, exercise(key, s)]));
    for (const k of Object.keys(totals)) {
      totals[k] +=
        k === 'unexercised_columns'
          ? verified.reduce((n, s) => n + row.verified_endpoints[s].unexercised_columns.length, 0)
          : row[k];
    }
    families[key] = row;
  }
  return {
    _doc:
      'Parser-parity coverage of the vendored py returns tables, written by test/parsers/parity.test.js ' +
      '(SDV_PARITY_WRITE=1). py_tables = documented (attached, with columns) + no_schema (attached, missing or ' +
      'empty schema file) + incompatible (schema_compatible: false or schema_incompatible) + overridden ' +
      '(parser_overrides) + overlay_schema (the overlay attaches a JS-owned schema) + undeclared (no ' +
      'declaration). verified = documented endpoints checked on a real sdv-py capture; generated row types ' +
      'are emitted only for verified_endpoints, and each listed unexercised column (null in every capture, so ' +
      'its type is unchecked) must be typed unknown. A kind: frames schema counts the columns of every frame, ' +
      'and lists its unexercised ones as <section>.<column>. One with frames_by (a single table, the frame a ' +
      'request parameter picks) is always unverified: a capture records no request parameter to pick it by.',
    source_ref: loadManifest().source.ref,
    totals,
    families,
  };
}

describe('parser parity: manifest + coverage', () => {
  it('the dtype check holds the INT64 id rule both ways (a number in an id column fails)', () => {
    sameType('1630639', 'Int64', 'player_id').should.be.true();
    sameType(1630639, 'Int64', 'player_id').should.be.false(); // an id returned as a number
    sameType('8445802', 'Float64', 'player_id').should.be.true(); // pandas' Float64 of an Int64 id with nulls
    sameType(1630639n, 'Int64', 'game_pk').should.be.false();
    sameType(12, 'Int64', 'games').should.be.true(); // non-id INT64: number / bigint
    sameType(12n, 'Int64', 'games').should.be.true();
    sameType('12', 'Int64', 'games').should.be.false();
    typeCheck('integer', 'team_id')('1610612742').should.be.true();
    typeCheck('integer', 'team_id')(1610612742).should.be.false();
    typeCheck('integer', 'games')(3).should.be.true();
    same('1630639', 1630639, 'player_id').should.be.true(); // py's integer id == JS's decimal string
    same('1630639', 1630640, 'player_id').should.be.false();
    same(1630639, 1630639, 'player_id').should.be.true(); // equality alone; the dtype check rejects the number
  });

  it('a kind: frames schema with columns is documented, never no_schema', () => {
    let frames = 0;
    for (const [key, eps] of status) {
      for (const e of eps.filter((x) => x.status === 'attached')) {
        // read independently of schemaTables (plain text: a YAML parse of every schema is slow)
        const p = join(CODEGEN, 'schemas', `${e.ref}.yaml`);
        const raw = existsSync(p) ? text(p) : '';
        if (!/^kind: frames\s*$/m.test(raw) || !/^\s*-? *name: /m.test(raw)) continue;
        frames++;
        schemaColumns(e.ref).length.should.be.above(0, `${key}.${e.short}`);
        docs.get(key).has(e.short).should.be.true(`${key}.${e.short} is documented`);
      }
    }
    frames.should.be.above(0);
  });

  it('every oracle entry has a capture in the manifest (regenerate with tools/parity/py_oracle.py)', () => {
    for (const [family, fixtures] of Object.entries(manifest)) {
      const oracle = JSON.parse(text(join(FIX, 'py', 'oracle', `${family}.json.gz`)));
      Object.keys(oracle).filter((k) => k !== '_provenance').sort().should.eql(Object.keys(fixtures).sort(), family);
    }
  });
  it('parity_coverage.json is current (SDV_PARITY_WRITE=1 rewrites it; SDV_PARITY_REPORT=1 prints it)', () => {
    const cov = coverage();
    const file = join(FIX, 'py', 'parity_coverage.json');
    const out = `${JSON.stringify(cov, null, 2)}\n`;
    if (process.env.SDV_PARITY_WRITE) writeFileSync(file, out);
    if (process.env.SDV_PARITY_REPORT) {
      console.log(`family | py_tables | ${BUCKETS.join(' | ')} | verified | unverified | exercised (verified)`);
      for (const [f, c] of Object.entries(cov.families)) {
        const v = Object.values(c.verified_endpoints);
        const ex = `${v.reduce((n, e) => n + e.exercised, 0)}/${v.reduce((n, e) => n + e.columns, 0)}`;
        console.log(`${f} | ${c.py_tables} | ${BUCKETS.map((b) => c[b]).join(' | ')} | ${c.verified} | ${c.unverified} | ${ex}`);
      }
    }
    // the buckets partition every py returns table, per family and in total
    for (const [f, c] of Object.entries(cov.families)) {
      BUCKETS.reduce((n, b) => n + c[b], 0).should.equal(c.py_tables, `${f}: buckets sum to py_tables`);
      (c.verified + c.unverified).should.equal(c.documented, f);
      for (const [s, e] of Object.entries(c.verified_endpoints)) {
        (e.exercised + e.unexercised_columns.length).should.equal(e.columns, `${f}.${s}: exercised-column report`);
      }
    }
    BUCKETS.reduce((n, b) => n + cov.totals[b], 0).should.equal(cov.totals.py_tables, 'total buckets');
    readFileSync(file, 'utf8').should.equal(out, 'stale: rerun with SDV_PARITY_WRITE=1');
    cov.totals.verified.should.be.above(150);
  });
});
