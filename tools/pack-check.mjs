// Lint the PUBLISHED artifact: `npm pack` once, then run @arethetypeswrong/cli and
// publint against that tarball (not the working tree), so the check sees exactly
// the files, exports map and type declarations a consumer installs.
//
//   npm run pack:check
//
// attw `--ignore-rules cjs-resolves-to-esm`: the package is ESM-only by design
// ("type": "module", no `require` condition). A CommonJS consumer loads it with
// `await import('sportsdataverse')` (or `require()` on Node >= 20.19 / 22.12, which
// can load ESM). Every other attw rule, including node10 subpath resolution, stays on.
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Run a command with its output streamed; record (not throw) a failure so both tools report.
function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`\npack:check failed: ${cmd}`);
    process.exitCode = 1;
  }
}

const dir = mkdtempSync(join(tmpdir(), 'sdv-pack-'));
try {
  // Lifecycle output (the `prepare` build) goes to stderr; stdout is the JSON.
  const [{ filename }] = JSON.parse(
    execSync(`npm pack --json --pack-destination "${dir}"`, { encoding: 'utf8' }),
  );
  const tgz = join(dir, filename);
  run(`npx --no-install attw "${tgz}" --ignore-rules cjs-resolves-to-esm`);
  run(`npx --no-install publint run "${tgz}" --strict`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
