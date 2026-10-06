import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import sdv, { configure, resetConfig, RELEASES_FAMILY } from '../../dist/index.js';
import { _warn } from '../../dist/core/releases.js';

// Loader type / runtime agreement (T18b-2): every value a release loader returns on the
// committed REAL release fixtures (test/fixtures/releases/README.md) must be a value of
// its GENERATED row type (src/generated/loader_rows/<ns>.ts, from sdv-py's loader
// schemas), read with the TypeScript parser, so it checks what users see. A column the
// schema does not list is allowed (the index signature: `unknown`) and counted.

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');
const fixture = (f) => readFileSync(join(ROOT, 'test', 'fixtures', 'releases', f));

/** `name -> allowed runtime kinds` of a generated loader row interface. */
function rowType(ns, iface) {
  const file = join(ROOT, 'src', 'generated', 'loader_rows', `${ns}.ts`);
  const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  let found;
  ts.forEachChild(sf, (n) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === iface) found = n;
  });
  if (!found) throw new Error(`${ns}: no interface ${iface}`);
  const kinds = (node) => {
    if (ts.isUnionTypeNode(node)) return node.types.flatMap(kinds);
    if (ts.isParenthesizedTypeNode(node)) return kinds(node.type);
    if (node.kind === ts.SyntaxKind.StringKeyword) return ['string'];
    if (node.kind === ts.SyntaxKind.NumberKeyword) return ['number'];
    if (node.kind === ts.SyntaxKind.BigIntKeyword) return ['bigint'];
    if (node.kind === ts.SyntaxKind.BooleanKeyword) return ['boolean'];
    if (node.kind === ts.SyntaxKind.UnknownKeyword) return ['unknown'];
    if (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword) return ['null'];
    if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'Date') return ['Date'];
    if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'Array') return [{ array: kinds(node.typeArguments[0]) }];
    throw new Error(`unsupported column type ${node.getText()}`);
  };
  const cols = new Map();
  let index = false;
  for (const m of found.members) {
    if (ts.isIndexSignatureDeclaration(m)) index = true;
    else cols.set(m.name.getText().replace(/^"|"$/g, ''), kinds(m.type));
  }
  return { cols, index };
}

/** Is `v` a value of a column of kinds `ks`? */
function fits(v, ks) {
  if (ks.includes('unknown')) return true;
  if (v === null || v === undefined) return ks.includes('null');
  if (v instanceof Date) return ks.includes('Date');
  if (Array.isArray(v)) {
    const arr = ks.find((k) => typeof k === 'object');
    return Boolean(arr) && v.every((x) => fits(x, arr.array));
  }
  return ks.includes(typeof v);
}

// [namespace, loader, row interface, fixture, args]
const CASES = [
  ['cfb', 'loadCfbRatings', 'LoadCfbRatingsRow', 'cfb_ratings_2024.parquet', { seasons: 2024 }],
  ['cfb', 'loadCfbTeamPortal', 'LoadCfbTeamPortalRow', 'cfb_team_portal_2024.parquet', { seasons: 2024 }],
  ['cfb', 'loadCfbPbp', 'LoadCfbPbpRow', 'cfb_pbp_2024_head20.parquet', { seasons: 2024 }],
  ['cfb', 'loadCfbPbp', 'LoadCfbPbpRow', 'cfb_pbp_2013_head20.parquet', { seasons: 2013 }],
  ['cfb', 'loadCfbPbpR', 'LoadCfbPbpRRow', 'cfb_pbp_r_2024_head20.parquet', { seasons: 2024 }],
  ['nfl', 'loadNflFtnCharting', 'LoadNflFtnChartingRow', 'ftn_charting_2022_head100.parquet', { seasons: 2022 }],
  ['nfl', 'loadNflPbpParticipation', 'LoadNflPbpParticipationRow', 'pbp_participation_2025_head20.parquet', { seasons: 2025 }],
  ['nhl', 'loadNhlGroups', 'LoadNhlGroupsRow', 'nhl_groups.parquet', {}],
];

describe('generated loader row types agree with the loaders on real release fixtures (src/generated/loader_rows)', () => {
  let realEmit;
  before(() => {
    realEmit = _warn.emit;
    _warn.emit = () => {}; // the INT64 / skipped-season warnings are tested elsewhere
  });
  after(() => {
    _warn.emit = realEmit;
    resetConfig();
  });

  const totals = { loaders: 0, typed: 0, cells: 0, undeclared: 0, mismatches: [] };
  for (const [ns, loader, iface, file, args] of CASES) {
    it(`${ns}.${loader} on ${file}: every value is of ${iface}`, async () => {
      configure({ transport: { [RELEASES_FAMILY]: async (req) => ({ status: 200, headers: {}, data: fixture(file), url: req.url }) } });
      const { cols, index } = rowType(ns, iface);
      index.should.equal(true, `${iface} has the index signature`);
      const rows = await sdv[ns][loader](args);
      rows.length.should.be.above(0);
      const undeclared = new Set();
      for (const row of rows) {
        for (const [k, v] of Object.entries(row)) {
          const ks = cols.get(k);
          if (!ks) {
            undeclared.add(k);
            continue;
          }
          totals.cells++;
          if (!fits(v, ks)) totals.mismatches.push(`${loader}(${file}).${k}: ${typeof v} ${String(v).slice(0, 40)} is not ${JSON.stringify(ks)}`);
        }
      }
      totals.loaders++;
      totals.typed += cols.size;
      totals.undeclared += undeclared.size;
      // `columns` + `format: "columns"` (the Pick / column-array overload) hold the same values.
      const pick = [...cols.keys()].filter((c) => c in rows[0]).slice(0, 3);
      const arrays = await sdv[ns][loader]({ ...args, columns: pick, format: 'columns' });
      Object.keys(arrays).should.eql(pick);
      for (const c of pick) arrays[c].every((v) => fits(v, cols.get(c))).should.equal(true, c);
    });
  }

  it('0 mismatches', () => {
    console.log(
      `      loader type/runtime agreement: ${totals.loaders} loads, ${totals.typed} typed columns, ` +
        `${totals.cells} cells, ${totals.undeclared} undeclared columns, ${totals.mismatches.length} mismatches`
    );
    totals.mismatches.should.eql([]);
  });
});
