import 'should';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Every sdv-py oracle generator (tools/parity, tools/oracle) runs the ONE shared guard,
// tools/sdv_py_pin.py `pinned_checkout(pin)` (HEAD == pin, a clean checkout, sportsdataverse
// imported from that checkout), before it writes a fixture, and none keeps a private copy.
// gen_norm_cdf_oracle.py never imports sdv-py (scipy + a Decimal truth), so it takes no pin.
const tools = fileURLToPath(new URL('../tools/', import.meta.url));
const NO_SDV_PY = new Set(['oracle/gen_norm_cdf_oracle.py']);
const generators = ['parity', 'oracle'].flatMap((dir) =>
  readdirSync(tools + dir)
    .filter((f) => f.endsWith('.py'))
    .map((f) => `${dir}/${f}`)
);

describe('sdv-py oracle generators share one pin guard', () => {
  it('finds the generators', () => {
    generators.length.should.be.aboveOrEqual(7);
  });

  for (const g of generators) {
    const src = readFileSync(tools + g, 'utf8');
    if (NO_SDV_PY.has(g)) {
      it(`${g} does not import sdv-py`, () => {
        src.should.not.match(/sportsdataverse/);
      });
      continue;
    }
    it(`${g} calls pinned_checkout(PORT_PIN | vendor_pin()) and has no private git guard`, () => {
      src.should.match(/pinned_checkout\((PORT_PIN|vendor_pin\(\))\)/);
      src.should.not.match(/rev-parse|--porcelain/);
    });
  }
});
