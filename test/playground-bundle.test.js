import should from 'should';
import { ESPN_ENDPOINT_PARSERS as srcEspn } from '../dist/parsers/espn.js';
import { PARSERS as srcNative } from '../dist/parsers/_registry.js';
import * as bundle from '../docs/src/playground/parsers.bundle.mjs';

// Staleness guard for the committed playground parser bundle
// (docs/src/playground/parsers.bundle.mjs, produced by `npm run bundle:parsers`).
// The docs playground imports it to parse payloads client-side. If a parser is
// added/removed in src/parsers without rebundling, the registry counts here
// diverge and this test fails — the fix is to re-run `npm run bundle:parsers`.
describe('playground parser bundle is in sync with src/parsers', () => {
  it('exposes the unified parse helpers', () => {
    (typeof bundle.parseEndpoint).should.equal('function');
    (typeof bundle.parserForEndpoint).should.equal('function');
    (typeof bundle.parserFor).should.equal('function');
    (typeof bundle.parse_summary).should.equal('function');
  });

  it('bundles the same ESPN + native parser registries', () => {
    Object.keys(bundle.ESPN_ENDPOINT_PARSERS).length.should.equal(
      Object.keys(srcEspn).length
    );
    Object.keys(bundle.PARSERS).length.should.equal(Object.keys(srcNative).length);
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
