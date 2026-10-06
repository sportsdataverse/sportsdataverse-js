import 'should';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describeColumn, loadDescriptionSources } from '../tools/codegen/descriptions.mjs';

// Returns-table column descriptions (tools/codegen/descriptions.mjs): the two sdv-py
// description files are vendored (and in the LOCK), the resolution order is sdv-py's,
// the measured fill rate holds, and every loader block documents its columns.

const root = fileURLToPath(new URL('..', import.meta.url));
const codegen = join(root, 'tools', 'codegen');
const coverage = JSON.parse(readFileSync(join(root, 'docs', 'src', 'generated', 'description_coverage.json'), 'utf8'));

// The measured overall fill rate at the time this gate was set (95.8% on 2026-10-06),
// rounded DOWN. Raise it when coverage improves; never lower it.
const FLOOR = 0.95;

describe('codegen: column descriptions', () => {
  it('vendors manual_column_descriptions.yaml + r_column_descriptions.yaml (verbatim copy + LOCK)', () => {
    const lock = readFileSync(join(codegen, 'vendor', 'upstream', 'LOCK'), 'utf8');
    const manifest = parse(readFileSync(join(codegen, 'vendor.yaml'), 'utf8'));
    for (const f of ['manual_column_descriptions.yaml', 'r_column_descriptions.yaml']) {
      manifest.copy.should.containEql(f);
      existsSync(join(codegen, 'vendor', 'upstream', f)).should.be.true(`vendor/upstream/${f}`);
      existsSync(join(codegen, f)).should.be.true(`tools/codegen/${f}`);
      new RegExp(`^[0-9a-f]{40}  ${f}$`, 'm').test(lock).should.be.true(`${f} in LOCK`);
      // the derived copy IS the upstream copy
      readFileSync(join(codegen, f), 'utf8').should.equal(readFileSync(join(codegen, 'vendor', 'upstream', f), 'utf8'));
    }
  });

  it('resolves schema text -> manual[schema] -> manual._global -> R package -> _merged -> ""', () => {
    const { manual, r } = loadDescriptionSources(codegen);
    Object.keys(manual).length.should.be.above(100);
    Object.keys(r._merged).length.should.be.above(1000);
    describeColumn('Kept as is.', 'anything', ['boxscore'], 'nba').should.equal('Kept as is.');
    // a manual schema-keyed entry beats _global
    const schemaKey = Object.keys(manual).find((k) => k !== '_global' && Object.keys(manual[k] ?? {}).some((c) => manual._global[c]));
    const col = Object.keys(manual[schemaKey]).find((c) => manual._global[c]);
    describeColumn('', col, [schemaKey], null).should.equal(String(manual[schemaKey][col]));
    describeColumn('', col, [], null).should.equal(String(manual._global[col]));
    // an R-package entry for the league wins over _merged; unknown league -> _merged
    const hoopCol = Object.keys(r.hoopR).find((c) => !manual._global[c] && r._merged[c] && r._merged[c] !== r.hoopR[c]);
    describeColumn('', hoopCol, [], 'nba').should.equal(r.hoopR[hoopCol].replace(/;\s*`[a-z_]+ = (?:TRUE|FALSE)` only(?=\.?$)/, ''));
    describeColumn('', hoopCol, [], null).should.equal(r._merged[hoopCol].replace(/;\s*`[a-z_]+ = (?:TRUE|FALSE)` only(?=\.?$)/, ''));
    describeColumn('', 'no_such_column_zzz', ['boxscore'], 'nba').should.equal('');
  });

  it(`fills at least ${FLOOR * 100}% of every rendered returns-table cell overall`, () => {
    coverage.totals.total.should.be.above(50000);
    coverage.totals.rate.should.be.aboveOrEqual(FLOOR, `overall fill rate ${coverage.totals.rate} < ${FLOOR}`);
  });

  it('fills descriptions on the families that shipped none (nba_stats, wnba_stats, mlb, nhl_*)', () => {
    for (const fam of ['nba_stats', 'wnba_stats', 'mlb', 'nhl_api_web', 'nhl_edge', 'nhl_stats_rest', 'nhl_records', 'espn', 'loaders']) {
      const s = coverage.families[fam];
      (s !== undefined).should.be.true(`${fam} in coverage`);
      s.filled.should.be.above(0, `${fam} filled`);
      s.rate.should.be.above(0.5, `${fam} rate ${s.rate}`);
    }
  });
});

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

describe('codegen: generated docs pages', () => {
  const docsRoot = join(root, 'docs', 'docs');
  const loaderPages = walk(docsRoot).filter((p) => p.endsWith(`${'reference'}${p.includes('\\') ? '\\' : '/'}loaders.md`));

  it('every loader block has a Returns table and names its row type (0 without)', () => {
    loaderPages.length.should.be.above(5);
    let blocks = 0;
    for (const page of loaderPages) {
      const text = readFileSync(page, 'utf8');
      const heads = text.match(/^## `load\w+`$/gm) ?? [];
      const returns = text.match(/^\*\*Returns\*\* \(one row per record/gm) ?? [];
      const rowTypes = text.match(/^\*\*Row type:\*\* `Load\w+Row`/gm) ?? [];
      const tables = text.match(/^\| col_name \| type \| description \|$/gm) ?? [];
      heads.length.should.be.above(0, page);
      returns.length.should.equal(heads.length, `${page}: loader blocks without a Returns table`);
      rowTypes.length.should.equal(heads.length, `${page}: loader blocks without a row type`);
      tables.length.should.equal(heads.length, `${page}: loader blocks without a columns table`);
      blocks += heads.length;
    }
    blocks.should.be.above(300);
  });

  it('every generated page carries the visible provenance footer (no hidden MDX comment)', () => {
    const generated = walk(docsRoot).filter((p) => {
      const rel = p.slice(docsRoot.length + 1).replace(/\\/g, '/');
      return !/^(guides|tutorials|api|architecture)\//.test(rel) && rel !== 'intro.md';
    });
    generated.length.should.be.above(200);
    for (const page of generated) {
      const text = readFileSync(page, 'utf8');
      /_Generated by tools\/codegen\/generate\.mjs from .+ — see \[How this library is built\]\(\/docs\/architecture\/[a-z-]+\)\._\n$/.test(text).should.be.true(`${page}: footer`);
      text.includes('{/* AUTO-GENERATED').should.be.false(`${page}: hidden comment`);
    }
  });

  it('ESPN blocks with no fixed table list the leagues that expose the endpoint and link the parser', () => {
    const text = readFileSync(join(docsRoot, 'nba', 'reference', 'core.md'), 'utf8');
    text.includes('column set varies by league and payload').should.be.true();
    text.includes('is exposed on ').should.be.true();
    /\]\(\.\.\/\.\.\/reference\/espn-parsed-returns#parse_single_entity\)/.test(text).should.be.true();
    text.includes('_Rows are untyped `Row[]` (not parity-verified yet)._').should.be.true();
  });

  it('the architecture pages carry a generated status block', () => {
    for (const p of ['index', 'espn-vendored', 'flat-vendored', 'flat-js-owned', 'hand-written', 'loaders']) {
      const text = readFileSync(join(docsRoot, 'architecture', `${p}.md`), 'utf8');
      const block = /<!-- gen:status -->\n([\s\S]+?)\n<!-- \/gen:status -->/.exec(text);
      (block !== null).should.be.true(`${p}: status block`);
      block[1].trim().length.should.be.above(20, `${p}: status block filled`);
    }
  });

  it('breaking-change admonitions appear on the affected pages and the deprecations table', () => {
    coverage.breaking_pages.should.be.above(100);
    const dep = readFileSync(join(docsRoot, 'reference', 'deprecations.md'), 'utf8');
    dep.includes('## Breaking changes by version').should.be.true();
    (dep.match(/^\| 4\.0\.0 \|/gm) ?? []).length.should.be.aboveOrEqual(18);
    const nba = readFileSync(join(docsRoot, 'nba', 'reference', 'site.md'), 'utf8');
    nba.includes(':::danger Breaking in 4.0.0').should.be.true();
    const ht = readFileSync(join(docsRoot, 'reference', 'hockeytech.md'), 'utf8');
    ht.includes('`season_yr` is the season').should.be.true();
    nba.includes('`season_yr` is the season').should.be.false();
  });
});
