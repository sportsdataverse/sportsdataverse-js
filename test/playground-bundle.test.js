import 'should'; // side-effect: installs the `.should` assertion property
import { ESPN_ENDPOINT_PARSERS as srcEspn } from '../dist/parsers/espn.js';
import { PARSERS as srcNative } from '../dist/parsers/_registry.js';
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
    Object.keys(bundle.PARSERS).sort().should.eql(Object.keys(srcNative).sort());
  });

  it('parses through the bundle (espn scoreboard + summary dispatcher)', () => {
    const rows = bundle.parseEndpoint('espn', 'scoreboard', { events: [{ id: '1' }] });
    rows.should.be.an.Array();
    rows.length.should.equal(1);
    const dict = bundle.parseEndpoint('espn', 'summary', { boxscore: {} });
    dict.should.be.an.Object();
    dict.should.have.property('boxscore_team');
  });
});
