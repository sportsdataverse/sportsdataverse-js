import 'should';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Every sdv-py oracle generator (tools/parity, tools/oracle) runs the ONE shared guard,
// tools/sdv_py_pin.py `pinned_checkout(pin)` (HEAD == pin, a clean checkout, sportsdataverse
// imported from that checkout), before it writes a fixture, and none keeps a private copy.
// Each generator is held to ITS pin: moving one to another pin is a deliberate edit here too.
// gen_norm_cdf_oracle.py never imports sdv-py (scipy + a Decimal truth), so it takes no pin.
const tools = fileURLToPath(new URL('../tools/', import.meta.url));
const PIN = {
  'parity/espn_basketball_box_oracle.py': 'PORT_PIN',
  'parity/espn_basketball_pbp_oracle.py': 'BASKETBALL_PBP_PIN',
  'parity/keyless_oracle.py': 'PORT_PIN',
  'parity/py_oracle.py': 'vendor_pin()',
  'parity/season_oracle.py': 'vendor_pin()', // the season transform rides in with the vendored YAML
  'oracle/gen_cricket_wp_oracle.py': 'PORT_PIN',
  'oracle/hockeytech_analytics_oracle.py': 'HOCKEYTECH_PIN',
  'oracle/odds_math_oracle.py': 'PORT_PIN',
  'oracle/error_vocabulary_oracle.py': 'ERROR_VOCAB_PIN',
  'oracle/gen_norm_cdf_oracle.py': null,
};
const generators = ['parity', 'oracle'].flatMap((dir) =>
  readdirSync(tools + dir)
    .filter((f) => f.endsWith('.py'))
    .map((f) => `${dir}/${f}`)
);

describe('sdv-py oracle generators share one pin guard', () => {
  it('finds the generators, each with an expected pin', () => {
    generators.length.should.be.aboveOrEqual(7);
    generators.sort().should.eql(Object.keys(PIN).sort());
  });

  for (const g of generators) {
    const src = readFileSync(tools + g, 'utf8');
    const pin = PIN[g];
    if (pin === null) {
      it(`${g} does not import sdv-py`, () => {
        src.should.not.match(/sportsdataverse/);
      });
      continue;
    }
    it(`${g} calls pinned_checkout(${pin}) only and has no private git guard`, () => {
      [...src.matchAll(/pinned_checkout\(([^()]*(?:\(\))?)\)/g)].map((m) => m[1]).should.eql([pin]);
      src.should.not.match(/\b(PORT_PIN|BASKETBALL_PBP_PIN|HOCKEYTECH_PIN|ERROR_VOCAB_PIN|vendor_pin)\s+as\s/); // no renamed pin
      src.should.not.match(/rev-parse|--porcelain/);
    });
  }
});
