import 'should'; // side-effect: installs the `.should` assertion property
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { ESPN_ENDPOINT_PARSERS as srcEspn } from '../dist/parsers/espn.js';
import { PARSERS as srcNative, NODE_ONLY_PARSERS } from '../dist/parsers/_registry.js';
import '../dist/index.js'; // registers the node-only parsers, so the comparison below is order-independent
import * as bundle from '../docs/src/playground/parsers.bundle.mjs';

// Staleness guard for the committed playground parser bundle
// (docs/src/playground/parsers.bundle.mjs, produced by `npm run bundle:parsers`).
// The docs playground imports it to parse payloads client-side. If a parser is
// added/removed/renamed in src/parsers without rebundling, the registry key sets
// here diverge and this test fails — the fix is to re-run `npm run bundle:parsers`.
describe('playground parser bundle is in sync with src/parsers', () => {
  it('exposes the unified parse helpers', () => {
    (typeof bundle.parseEndpoint).should.equal('function');
    (typeof bundle.parserForEndpoint).should.equal('function');
    (typeof bundle.parserFor).should.equal('function');
    (typeof bundle.parse_summary).should.equal('function');
  });

  it('bundles the same ESPN + native parser registry keys', () => {
    // Compare the actual key SETS (sorted), not just counts — so a renamed or
    // swapped parser key (same total) still trips the staleness guard.
    Object.keys(bundle.ESPN_ENDPOINT_PARSERS).sort().should.eql(
      Object.keys(srcEspn).sort()
    );
    // node-only parsers (KenPom's cheerio HTML parser) stay out of the browser bundle
    NODE_ONLY_PARSERS.has('parse_kenpom_page').should.be.true();
    Object.keys(bundle.PARSERS).sort().should.eql(Object.keys(srcNative).filter((k) => !NODE_ONLY_PARSERS.has(k)).sort());
  });

  it('parses through the bundle (espn scoreboard + summary dispatcher)', () => {
    const rows = bundle.parseEndpoint('espn', 'scoreboard', { events: [{ id: '1' }] });
    rows.should.be.an.Array();
    rows.length.should.equal(1);
    const dict = bundle.parseEndpoint('espn', 'summary', { boxscore: {} });
    dict.should.be.an.Object();
    dict.should.have.property('boxscore_team');
  });

  it('a flat multi-table parser honours `section` (the playground section picker), as the wrapper does', () => {
    const fx = (...p) => JSON.parse(readFileSync(new URL(`fixtures/${p.join('/')}`, import.meta.url), 'utf8'));
    const match = fx('mls_api', 'statsapi_match_single.json');
    const tables = bundle.parse_mls_match_tables(match);
    bundle.parseEndpoint('flat', 'parse_mls_match', match).should.eql(tables.match_information); // default
    bundle.parseEndpoint('flat', 'parse_mls_match', match, 'players').should.eql(tables.players);
    bundle.parseEndpoint('flat', 'parse_mls_match', match, 'players').length.should.be.above(0);
    // payload-named tables (stats.nba.com): the default is every set; a name picks one
    const career = fx('nba_stats', 'cap_playercareerstats_nba.json');
    const all = bundle.parseEndpoint('flat', 'parse_nba_stats_result_sets', career);
    Object.keys(all).should.have.length(14);
    bundle.parseEndpoint('flat', 'parse_nba_stats_result_sets', career, 'SeasonHighs').should.eql(all.SeasonHighs);
    bundle.MULTI_TABLE_SECTIONS.parse_mls_match.sections.should.containEql('players');
  });

  it('is byte-identical to a fresh `npm run bundle:parsers` (a changed parser BODY is stale too)', async () => {
    // Same options as the package.json script, built in memory.
    const root = fileURLToPath(new URL('..', import.meta.url));
    const out = 'docs/src/playground/parsers.bundle.mjs';
    const { outputFiles } = await build({
      absWorkingDir: root,
      entryPoints: ['src/parsers/browser.ts'],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      legalComments: 'eof',
      outfile: out,
      write: false,
      logLevel: 'silent',
    });
    (outputFiles[0].text === readFileSync(root + out, 'utf8')).should.equal(true, `${out} is stale: run npm run bundle:parsers`);
  });
});
