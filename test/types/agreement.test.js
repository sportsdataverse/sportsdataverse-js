import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import { parse } from 'yaml';
import { FLAT_WRAPPERS } from '../../dist/index.js';
import { parserFor } from '../../dist/parsers/_registry.js';
import { MULTI_TABLE_SECTIONS } from '../../dist/parsers/_frames.js';

// Type / runtime agreement (Task 18a): every value a parser returns on sdv-py's
// committed real captures must be a value of the GENERATED TypeScript type of
// its wrapper's `{ parsed: true }` result. The checker reads the generated source
// itself (src/generated/rows/*.ts + the wrapper annotations in
// src/generated/flat/*.ts) with the TypeScript parser, so it checks what users
// see, not a second copy of the rule: ids (string vs number), string / number /
// boolean / null / unknown per column, the set of keys of every row (no key the
// type does not declare) and of every object of tables, and each `section` a
// type names. Plus the `unknown` rule: a column is `unknown` exactly when no
// capture exercises it (test/fixtures/py/parity_coverage.json `unexercised_columns`).

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');
const FIX = join(ROOT, 'test', 'fixtures');
const GEN = join(ROOT, 'src', 'generated');
const text = (p) => (p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8');
const body = (p) => (/\.(csv|html)(\.gz)?$/.test(p) ? text(p) : JSON.parse(text(p)));
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const keyName = (n) => (ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : n.getText());

const sourceMemo = new Map();
const source = (file) => {
  if (!sourceMemo.has(file)) {
    sourceMemo.set(file, ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true));
  }
  return sourceMemo.get(file);
};

/** Interfaces of a generated rows module: name -> InterfaceDeclaration. */
function interfaces(api) {
  const out = new Map();
  ts.forEachChild(source(join(GEN, 'rows', `${api}.ts`)), (n) => {
    if (ts.isInterfaceDeclaration(n)) out.set(n.name.text, n);
  });
  return out;
}

/** A column's member types: `string`, `number`, `bigint`, `boolean`, `null`, `Date`, `unknown`. */
function prims(node) {
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(prims);
  if (node.kind === ts.SyntaxKind.StringKeyword) return ['string'];
  if (node.kind === ts.SyntaxKind.NumberKeyword) return ['number'];
  if (node.kind === ts.SyntaxKind.BigIntKeyword) return ['bigint'];
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return ['boolean'];
  if (node.kind === ts.SyntaxKind.UnknownKeyword) return ['unknown'];
  if (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword) return ['null'];
  if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'Date') return ['Date'];
  throw new Error(`unsupported column type ${node.getText()}`);
}

/**
 * The model of a generated type node: `unknown`; `array` of a model; `row` (a
 * row interface: column -> member types; or the shared `Row`, props null);
 * `tables` (the shared `ParsedTables`); `object` (an object of tables: key ->
 * model); `union` of models.
 */
function model(node, ifaces) {
  if (node.kind === ts.SyntaxKind.UnknownKeyword) return { k: 'unknown' };
  if (ts.isArrayTypeNode(node)) return { k: 'array', of: model(node.elementType, ifaces) };
  if (ts.isUnionTypeNode(node)) return { k: 'union', of: node.types.map((t) => model(t, ifaces)) };
  if (ts.isParenthesizedTypeNode(node)) return model(node.type, ifaces);
  const members = (ms) => ms.filter(ts.isPropertySignature);
  if (ts.isTypeLiteralNode(node)) {
    return { k: 'object', props: new Map(members(node.members).map((m) => [keyName(m.name), model(m.type, ifaces)])) };
  }
  if (ts.isTypeReferenceNode(node)) {
    const name = node.typeName.getText();
    if (name === 'Row') return { k: 'row', props: null };
    if (name === 'ParsedTables') return { k: 'tables' };
    const decl = ifaces.get(name);
    if (!decl) throw new Error(`unresolved type ${name}`);
    const ms = members(decl.members);
    if (ms.every((m) => ts.isArrayTypeNode(m.type))) {
      return { k: 'object', name, props: new Map(ms.map((m) => [keyName(m.name), model(m.type, ifaces)])) };
    }
    return { k: 'row', name, props: new Map(ms.map((m) => [keyName(m.name), prims(m.type)])) };
  }
  throw new Error(`unsupported type ${node.getText()}`);
}

const PRIM_OK = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number',
  bigint: (v) => typeof v === 'bigint',
  boolean: (v) => typeof v === 'boolean',
  null: (v) => v === null,
  Date: (v) => v instanceof Date,
  unknown: () => true,
};

/** Mismatches of `value` against `m` (empty: the value is of the type). `stats` counts what was checked. */
function check(value, m, at, stats) {
  switch (m.k) {
    case 'unknown':
      return [];
    case 'array':
      if (!Array.isArray(value)) return [`${at}: ${typeof value}, not an array`];
      return value.flatMap((v, i) => check(v, m.of, `${at}[${i}]`, stats));
    case 'tables':
      if (!isObj(value)) return [`${at}: not an object of tables`];
      return Object.entries(value).flatMap(([k, rows]) => check(rows, { k: 'array', of: { k: 'row', props: null } }, `${at}.${k}`, stats));
    case 'object': {
      if (!isObj(value)) return [`${at}: ${Array.isArray(value) ? 'an array' : typeof value}, not ${m.name ?? 'an object'}`];
      const keys = Object.keys(value).sort();
      const declared = [...m.props.keys()].sort();
      if (JSON.stringify(keys) !== JSON.stringify(declared)) return [`${at}: keys ${keys} != declared ${declared}`];
      return declared.flatMap((k) => check(value[k], m.props.get(k), `${at}.${k}`, stats));
    }
    case 'row': {
      if (!isObj(value)) return [`${at}: not a row object`];
      if (m.props === null) return [];
      const bad = [];
      for (const [k, v] of Object.entries(value)) {
        const allowed = m.props.get(k);
        if (!allowed) {
          bad.push(`${at}.${k}: a key ${m.name} does not declare`);
          continue;
        }
        stats.cells++;
        stats.keys.add(`${m.name}.${k}`);
        if (v !== null && v !== undefined) stats.nonNull.add(`${m.name}.${k}`);
        // optional (`?:`): undefined is allowed
        if (v !== undefined && !allowed.some((p) => PRIM_OK[p](v))) {
          bad.push(`${at}.${k}: ${m.name} says ${allowed.join(' | ')}, runtime ${typeof v} ${JSON.stringify(String(v)).slice(0, 40)}`);
        }
      }
      return bad;
    }
    case 'union': {
      const tries = m.of.map((o) => check(value, o, at, stats));
      return tries.some((t) => !t.length) ? [] : tries.flat();
    }
    default:
      throw new Error(`unknown model ${m.k}`);
  }
}

/**
 * A flat wrapper's declared `{ parsed: true }` type `P` and section map `S` (src/generated/flat/<api>.ts):
 * `Wrapper<P, Params>` / `SectionedWrapper<P, S, Params>`, where an `S` of `{}` names no table.
 */
function wrapperType(api, camel, ifaces) {
  let found;
  ts.forEachChild(source(join(GEN, 'flat', `${api}.ts`)), (n) => {
    if (!ts.isVariableStatement(n)) return;
    for (const d of n.declarationList.declarations) if (d.name.getText() === camel) found = d.type;
  });
  if (!found || !ts.isTypeReferenceNode(found)) throw new Error(`${api}.${camel}: no wrapper type annotation`);
  const kind = found.typeName.getText();
  const [p, s] = found.typeArguments ?? [];
  const sections = kind === 'SectionedWrapper' && s && !(ts.isTypeLiteralNode(s) && !s.members.length) ? s : null;
  return {
    kind,
    text: found.getText(),
    P: p ? model(p, ifaces) : { k: 'array', of: { k: 'row', props: null } },
    S: sections ? model(sections, ifaces) : null,
  };
}

/** Every row interface a model names. */
const rowModels = (m) =>
  m.k === 'row' && m.props
    ? [m]
    : m.k === 'array' || m.k === 'union' || m.k === 'object'
      ? (m.of ? [].concat(m.of) : [...m.props.values()]).flatMap(rowModels)
      : [];

const coverage = JSON.parse(readFileSync(join(FIX, 'py', 'parity_coverage.json'), 'utf8'));
const manifest = parse(readFileSync(join(FIX, 'py', 'manifest.yaml'), 'utf8'));

describe('generated row types agree with the parsers on real captures (src/generated/rows)', () => {
  const totals = { endpoints: 0, captures: 0, columns: 0, cells: 0, sections: 0 };
  for (const [api, fam] of Object.entries(coverage.families)) {
    const shorts = Object.keys(fam.verified_endpoints);
    if (!shorts.length) continue;
    it(`${api}: ${shorts.length} verified endpoints, every returned value is of its generated type`, () => {
      const ifaces = interfaces(api);
      const mismatches = [];
      for (const short of shorts) {
        const def = FLAT_WRAPPERS.find((w) => w.api === api && w.short === short);
        should.exist(def, `${api}.${short}`);
        const camel = toCamel(def.publicName ?? `${api}_${short}`);
        const t = wrapperType(api, camel, ifaces);
        const rows = [...rowModels(t.P), ...(t.S ? rowModels(t.S) : [])];
        rows.length.should.be.above(0, `${camel}: ${t.text} names no generated row type`);
        const caps = Object.entries(manifest[api]).filter(([, s]) => s === short).map(([p]) => p);
        caps.length.should.be.above(0, `${api}.${short}: verified without a capture`);
        const fn = parserFor(def.parser);
        const multi = def.parser in MULTI_TABLE_SECTIONS;
        const stats = { cells: 0, keys: new Set(), nonNull: new Set() };
        for (const path of caps) {
          const raw = body(join(FIX, path));
          // exactly what callFlat(def, { parsed: true }) returns
          const out = multi ? fn(raw, undefined) : fn(raw);
          mismatches.push(...check(out, t.P, `${camel}(${path})`, stats));
          // every section the type names: `{ parsed: true, section: K }` is S[K]
          if (t.S) {
            for (const [k, m] of t.S.props) {
              totals.sections++;
              mismatches.push(...check(fn(raw, k), m, `${camel}(${path}, section ${k})`, stats));
            }
          }
          totals.captures++;
        }
        // the `unknown` rule, at runtime: a column is `unknown` exactly when no capture
        // gives it a value; every other declared column is seen with a value. A frames
        // schema's unexercised columns are named `<section>.<column>`.
        const unexercised = new Set(fam.verified_endpoints[short].unexercised_columns);
        const byName = new Map(rows.map((r) => [r.name, r]));
        const prefix = new Map();
        if (t.S?.name) for (const [k, m] of t.S.props) prefix.set(m.of.name, `${k}.`);
        const typedUnknown = [];
        for (const r of byName.values()) {
          for (const [col, types] of r.props) {
            totals.columns++;
            const isUnknown = types.length === 1 && types[0] === 'unknown';
            const exercised = stats.nonNull.has(`${r.name}.${col}`);
            if (isUnknown === exercised) {
              mismatches.push(`${camel}: ${r.name}.${col} is ${types.join(' | ')} but ${exercised ? 'has' : 'never has'} a value in the captures`);
            }
            if (isUnknown) typedUnknown.push((prefix.get(r.name) ?? '') + col);
          }
        }
        // ... and the generator typed `unknown` exactly the harness's unexercised columns
        typedUnknown.sort().should.eql([...unexercised].sort(), `${camel}: unknown columns`);
        totals.cells += stats.cells;
        totals.endpoints++;
      }
      mismatches.should.eql([], `${api}: generated types disagree with the runtime`);
    });
  }
  after(() => {
    // the whole verified surface was checked
    totals.endpoints.should.equal(coverage.totals.verified);
    console.log(
      `      type/runtime agreement: ${totals.endpoints} endpoints, ${totals.captures} captures, ` +
        `${totals.columns} typed columns, ${totals.cells} cells, ${totals.sections} section calls, 0 mismatches`
    );
  });
});
