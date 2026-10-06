import 'should';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Every examples/NN_*.mjs runs OFFLINE (examples/_offline.mjs routes each request
// to a committed fixture; an unrouted URL throws) and must exit 0 having printed
// at least one table. The `--import ./_resolve.mjs` preload resolves the package
// to this worktree's dist/ (built by `pretest`), so no `npm install` in
// examples/ is needed. The 9x_sdvplot_* scripts also need the unpublished
// @sportsdataverse/{sdvplot,sporty} build from a sibling sdvplot-js checkout
// (SDVPLOT_JS_DIR); without it the preload prints `skipped:` and exits 0, and
// the case is skipped here (CI has no sibling checkout).

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(__dirname, '..', 'examples');

const scripts = readdirSync(EXAMPLES).filter((f) => /^\d\d_.*\.mjs$/.test(f)).sort();

describe('examples/ run offline against committed fixtures', function () {
  this.timeout(60_000);

  it('has at least 12 numbered scripts', () => {
    scripts.length.should.be.aboveOrEqual(12);
  });

  for (const script of scripts) {
    it(`${script} exits 0 and prints a table`, function () {
      const res = spawnSync(process.execPath, ['--import', './_resolve.mjs', script], {
        cwd: EXAMPLES,
        encoding: 'utf8',
        env: { ...process.env, SDV_LIVE: '' },
        timeout: 55_000,
      });
      res.status.should.equal(0, `${script}\n--- stdout ---\n${res.stdout}\n--- stderr ---\n${res.stderr}`);
      if (res.stdout.startsWith('skipped:')) return this.skip(); // 9x without a sdvplot-js build
      res.stdout.should.match(/^\| .+ \|$/m, `${script} printed no table:\n${res.stdout}`);
      res.stdout.should.not.match(/SDV_LIVE=1/);
    });
  }
});
