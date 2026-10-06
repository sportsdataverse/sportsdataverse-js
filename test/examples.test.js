import 'should';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Every examples/NN_*.mjs runs OFFLINE (examples/_offline.mjs routes each request
// to a committed fixture; an unrouted URL throws) and must exit 0 having printed
// at least one table. The 9x_sdvplot_* scripts also need the unpublished
// @sportsdataverse/{sdvplot,sporty} packages, linked by examples/package.json
// from a sibling sdvplot-js checkout; they are skipped when that link is absent
// (CI has no sibling checkout) so the gate stays green without it.

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(__dirname, '..', 'examples');
const INSTALLED = existsSync(join(EXAMPLES, 'node_modules', 'sportsdataverse'));
const SDVPLOT = existsSync(join(EXAMPLES, 'node_modules', '@sportsdataverse', 'sporty'));

const scripts = readdirSync(EXAMPLES).filter((f) => /^\d\d_.*\.mjs$/.test(f)).sort();

describe('examples/ run offline against committed fixtures', function () {
  this.timeout(60_000);

  it('has at least 12 numbered scripts', () => {
    scripts.length.should.be.aboveOrEqual(12);
  });

  for (const script of scripts) {
    const needsSdvplot = script.startsWith('9');
    it(`${script} exits 0 and prints a table`, function () {
      if (!INSTALLED) return this.skip(); // run `npm install` in examples/ first
      if (needsSdvplot && !SDVPLOT) return this.skip();
      const res = spawnSync(process.execPath, [script], {
        cwd: EXAMPLES,
        encoding: 'utf8',
        env: { ...process.env, SDV_LIVE: '' },
        timeout: 55_000,
      });
      res.status.should.equal(0, `${script}\n--- stdout ---\n${res.stdout}\n--- stderr ---\n${res.stderr}`);
      res.stdout.should.match(/^\| .+ \|$/m, `${script} printed no table:\n${res.stdout}`);
      res.stdout.should.not.match(/SDV_LIVE=1/);
    });
  }
});
