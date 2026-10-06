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

// The measured overall fill rate at the time this gate was set (90.6% on 2026-10-06, after the cross-sport fallback was removed),
// rounded DOWN. Raise it when coverage improves; never lower it.
const FLOOR = 0.9;

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

  it('resolves schema text -> manual[schema] -> manual._global -> the league\'s own-sport R packages -> ""', () => {
    const { manual, r } = loadDescriptionSources(codegen);
    Object.keys(manual).length.should.be.above(100);
    describeColumn('Kept as is.', 'anything', ['boxscore'], 'nba').should.equal('Kept as is.');
    // a manual schema-keyed entry beats _global
    const schemaKey = Object.keys(manual).find((k) => k !== '_global' && Object.keys(manual[k] ?? {}).some((c) => manual._global[c]));
    const col = Object.keys(manual[schemaKey]).find((c) => manual._global[c]);
    describeColumn('', col, [schemaKey], null).should.equal(String(manual[schemaKey][col]));
    describeColumn('', col, [], null).should.equal(String(manual._global[col]));
    // the league's own package backs a blank; its same-sport sibling next; NEVER another sport
    const strip = (s) => s.replace(/;\s*`[a-z_]+ = (?:TRUE|FALSE)` only(?=\.?$)/, '');
    const hoopCol = Object.keys(r.hoopR).find((c) => !manual._global[c] && r.wehoop[c] && r.wehoop[c] !== r.hoopR[c]);
    describeColumn('', hoopCol, [], 'nba').should.equal(strip(r.hoopR[hoopCol]));
    describeColumn('', hoopCol, [], 'wnba').should.equal(strip(r.wehoop[hoopCol]));
    const wehoopOnly = Object.keys(r.wehoop).find((c) => !manual._global[c] && !r.hoopR[c]);
    describeColumn('', wehoopOnly, [], 'nba').should.equal(strip(r.wehoop[wehoopOnly]));
    // cross-sport text is never used: a baseballr-only column stays blank on a basketball league,
    // a cfbfastR-only column on the NFL, and an unmapped namespace / the shared page get no R text
    const baseballOnly = Object.keys(r.baseballr).find((c) => !manual._global[c] && !r.hoopR[c] && !r.wehoop[c]);
    describeColumn('', baseballOnly, [], 'nba').should.equal('');
    const cfbOnly = Object.keys(r.cfbfastR).find((c) => !manual._global[c] && !r.nflreadr[c] && !r.nflfastR[c]);
    describeColumn('', cfbOnly, [], 'nfl').should.equal('');
    describeColumn('', hoopCol, [], 'cbs').should.equal('');
    describeColumn('', hoopCol, [], null).should.equal('');
    describeColumn('', 'no_such_column_zzz', ['boxscore'], 'nba').should.equal('');
  });

  // Sport-specific phrases that must never describe a column of another sport's family
  // (every one shipped before the cross-sport `_merged` fallback was removed).
  const DENY = [
    { phrase: 'Inning', except: ['mlb', 'college_baseball', 'college_softball', 'reference/asa'] },
    { phrase: 'SP+', except: ['cfb'] },
    { phrase: 'Binary flag', except: ['cfb', 'nfl/reference/loaders'] },
    // nflfastR play-level vocabulary on the NFL aggregate families (nfl_api / nfl_pro / pff_api)
    // and on the recruiting provider: checked only where it is wrong by construction
    { phrase: 'Binary indicator', only: ['nfl/reference/native.md', 'reference/on3.md'] },
    { phrase: 'play ended', only: ['nfl/reference/native.md', 'reference/on3.md'] },
    { phrase: 'given play', only: ['nfl/reference/native.md', 'reference/on3.md'] },
    { phrase: 'statistical ranks', except: [] },
    { phrase: 'Position in the poll', except: ['cfb', 'mbb', 'wbb', 'reference/espn-parsed-returns', 'cdn'] },
  ];
  const SPOT = [
    ['nba/reference/native.md', '`num`', 'Inning'],
    ['wnba/reference/native.md', '`num`', 'Inning'],
    ['wnba/reference/native.md', '`rank`', 'statistical ranks'],
    ['nba/reference/native.md', '`rank`', 'statistical ranks'],
    ['reference/on3.md', '`rating`', 'SP+'],
    ['reference/on3.md', '`rank`', 'poll'],
    ['nfl/reference/native.md', '`rating`', 'SP+'],
    ['nfl/reference/native.md', '`int`', 'Binary flag'],
    ['nfl/reference/native.md', '`sack`', 'Binary flag'],
  ];

  it('never describes a column with another sport\'s text (denylist over the generated docs)', () => {
    const docsRoot = join(root, 'docs', 'docs');
    const pages = walk(docsRoot).filter((p) => !/[\\/](guides|tutorials|api|architecture|utilities)[\\/]/.test(p));
    const hits = [];
    for (const page of pages) {
      const rel = page.slice(docsRoot.length + 1).replace(/\\/g, '/');
      const lines = readFileSync(page, 'utf8').split('\n');
      for (const { phrase, except, only } of DENY) {
        if (only && !only.includes(rel)) continue;
        if (except?.some((e) => rel.startsWith(e) || rel.includes(`/${e}`) || rel.includes(e))) continue;
        lines.forEach((l, i) => {
          if (l.startsWith('| `') && l.includes(phrase)) hits.push(`${rel}:${i + 1}: ${phrase}`);
        });
      }
    }
    hits.should.eql([]);
  });

  it('the reviewed wrong-sport cells are clean (spot list)', () => {
    const docsRoot = join(root, 'docs', 'docs');
    const bad = [];
    for (const [file, col, phrase] of SPOT) {
      const lines = readFileSync(join(docsRoot, file), 'utf8').split('\n');
      lines.forEach((l, i) => {
        if (l.startsWith(`| ${col} |`) && l.includes(phrase)) bad.push(`${file}:${i + 1}: ${col} contains ${phrase}`);
      });
    }
    bad.should.eql([]);
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
