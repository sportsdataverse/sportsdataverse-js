import 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LEAGUES } from '../dist/generated/leagues.js';
import { WRAPPERS, FLAT_WRAPPERS } from '../dist/generated/wrappers.js';

// docs/src/generated/sources.json (tools/codegen/sources.mjs): the sources-first
// view-model the homepage, intro, Sources page and every league index render. Its
// rows must sum to the registries the doc-counts test checks the prose against.

const root = fileURLToPath(new URL('..', import.meta.url));
const json = JSON.parse(readFileSync(root + 'docs/src/generated/sources.json', 'utf8'));
const rows = json.sources;
const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
const flatFamilies = [...new Set(FLAT_WRAPPERS.map((w) => w.api))];
const prefixes = new Set(LEAGUES.map((l) => l.prefix));

describe('docs/src/generated/sources.json', () => {
  it('totals are the registries', () => {
    json.totals.espnShorts.should.equal(WRAPPERS.length);
    json.totals.espnLeagues.should.equal(LEAGUES.length);
    json.totals.flatWrappers.should.equal(FLAT_WRAPPERS.length);
    json.totals.flatFamilies.should.equal(flatFamilies.length);
    json.totals.sources.should.equal(rows.length);
  });

  it('the ESPN row carries every short on every league', () => {
    byId.espn.wrapperCount.should.equal(WRAPPERS.length);
    byId.espn.leagues.should.eql(LEAGUES.map((l) => l.prefix));
    byId.espn.families.reduce((n, f) => n + f.count, 0).should.equal(WRAPPERS.length);
  });

  it('the native rows sum to FLAT_WRAPPERS, one family on exactly one row', () => {
    const native = rows.filter((r) => !['espn', 'releases'].includes(r.id));
    native.reduce((n, r) => n + r.wrapperCount, 0).should.equal(FLAT_WRAPPERS.length);
    const seen = native.flatMap((r) => r.families.map((f) => f.api)).sort();
    seen.should.eql([...flatFamilies].sort());
    for (const r of native) {
      for (const f of r.families) {
        f.count.should.equal(FLAT_WRAPPERS.filter((w) => w.api === f.api).length, `${r.id}/${f.api}`);
      }
      r.wrapperCount.should.equal(r.families.reduce((n, f) => n + f.count, 0));
    }
  });

  it('every row is well-formed (auth, ownership, docs path, leagues)', () => {
    for (const r of rows) {
      ['none', 'key', 'subscription', 'impersonation'].should.containEql(r.auth);
      ['vendored', 'js-owned', 'mixed', 'loaders', 'hand-written'].should.containEql(r.ownership);
      r.docsPath.should.startWith('/docs/');
      r.host.should.not.be.empty();
      // the loaders row lists loader namespaces (pwhl has loaders but no ESPN league)
      if (r.id !== 'releases') r.leagues.forEach((l) => prefixes.has(l).should.be.true(`${r.id}: ${l} is not a league`));
      if (r.parity) r.parity.verified.should.be.belowOrEqual(r.parity.total);
      if (r.descriptionFill) r.descriptionFill.filled.should.be.belowOrEqual(r.descriptionFill.total);
    }
    byId.releases.wrapperCount.should.equal(json.totals.loaders);
  });

  it('every league has at least ESPN as a source', () => {
    for (const l of LEAGUES) {
      rows.filter((r) => r.leagues.includes(l.prefix)).length.should.be.aboveOrEqual(1, l.prefix);
    }
    rows.filter((r) => r.leagues.includes('nba')).map((r) => r.id).should.containDeep(['espn', 'nba_stats', 'releases']);
  });
});
