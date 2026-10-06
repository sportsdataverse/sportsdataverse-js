import 'should';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import * as pkg from '../dist/index.js';
import { UTILITY_CATEGORIES } from '../dist/generated/utilities.js';
import { listFunctions } from '../dist/discover.js';

// The utilities catalogue (tools/codegen/utilities.yaml): every hand-written, non-data
// public export of src/index.ts is catalogued (fails naming the missing ones), every
// catalogued name exists, and discover.listFunctions labels utilities with it.

const root = fileURLToPath(new URL('..', import.meta.url));
const doc = parse(readFileSync(join(root, 'tools', 'codegen', 'utilities.yaml'), 'utf8'));
const catalogued = new Set();
const aliased = new Set();
for (const m of doc.modules) {
  for (const e of m.exports) {
    catalogued.add(e.name);
    for (const a of e.aliases ?? []) aliased.add(a);
  }
}

/** The named exports of src/index.ts that are not re-exported from src/generated/. */
function indexExports() {
  const src = readFileSync(join(root, 'src', 'index.ts'), 'utf8');
  const names = new Set();
  const re = /^export\s+(type\s+)?\{([^}]*)\}(?:\s*from\s*'([^']+)')?/gm;
  for (const m of src.matchAll(re)) {
    if (m[3] && m[3].startsWith('./generated/')) continue;
    for (const raw of m[2].split(',')) {
      const n = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop();
      if (n) names.add(n);
    }
  }
  for (const m of src.matchAll(/^export\s+type\s+(\w+)\s*=/gm)) names.add(m[1]);
  return names;
}

describe('utilities catalogue (tools/codegen/utilities.yaml)', () => {
  const NAMESPACE_LIKE = new Set(['LEAGUES', 'WRAPPERS', 'FLAT_WRAPPERS']);

  it('lists every public non-data export of src/index.ts', () => {
    const missing = [...indexExports()].filter(
      (n) => !NAMESPACE_LIKE.has(n) && !/^load[A-Z_]/.test(n) && !catalogued.has(n) && !aliased.has(n)
    );
    missing.should.eql([], `add to tools/codegen/utilities.yaml: ${missing.join(', ')}`);
  });

  it('every catalogued value export exists on the built package or its module', () => {
    const missing = [];
    for (const m of doc.modules) {
      const modPath = join(root, 'dist', m.module.replace(/^src\//, '').replace(/\.ts$/, '.js'));
      for (const e of m.exports) {
        if (e.kind === 'type') continue;
        if (e.name in pkg) continue;
        if (existsSync(modPath)) continue; // module-level export: the signature lookup already proved it
        missing.push(`${m.module}.${e.name}`);
      }
    }
    missing.should.eql([]);
  });

  it('the generated UTILITY_CATEGORIES table carries every name + alias with its category', () => {
    for (const m of doc.modules) {
      for (const e of m.exports) {
        for (const n of [e.name, ...(e.aliases ?? [])]) UTILITY_CATEGORIES[n].should.equal(m.category, n);
      }
    }
    Object.keys(UTILITY_CATEGORIES).length.should.be.above(200);
  });

  it('listFunctions({ detail: true }) labels utilities and data', async () => {
    const odds = await listFunctions('odds', { detail: true });
    const shin = odds.find((e) => e.name === 'devig_shin');
    shin.should.eql({ name: 'devig_shin', kind: 'utility', category: 'odds' });
    const nba = await listFunctions('nba', { detail: true });
    nba.find((e) => e.name === 'espn_nba_scoreboard').should.eql({ name: 'espn_nba_scoreboard', kind: 'data' });
    nba.find((e) => e.name === 'helper_nba_pbp').kind.should.equal('utility');
    nba.find((e) => e.name === 'load_nba_pbp').kind.should.equal('data');
    // bare names are unchanged
    (await listFunctions('odds')).should.containEql('devig_shin');
  });

  it('the docs utilities pages exist for every category with its exports', () => {
    for (const [cat] of Object.entries(doc.categories)) {
      const page = join(root, 'docs', 'docs', 'utilities', `${cat}.md`);
      if (!doc.modules.some((m) => m.category === cat)) continue;
      const text = readFileSync(page, 'utf8');
      for (const m of doc.modules.filter((m) => m.category === cat)) {
        for (const e of m.exports) text.includes(`### \`${e.name}\``).should.be.true(`${cat}.md: ${e.name}`);
      }
      text.includes('These utilities never fetch a provider payload').should.be.true();
    }
  });
});
