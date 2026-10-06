#!/usr/bin/env node
// ---------------------------------------------------------------------------
// examples-source.mjs — freeze examples/*.mjs into a JSON map the docs site can
// import at build time (docs/src/generated/examples-source.json), so the
// "Open in StackBlitz" button (docs/src/components/OpenInStackBlitz) can ship a
// tutorial's full script as the project's index.mjs without reading the
// filesystem from a React component. Keys are the file names under examples/
// (the numbered scripts + the shared _util.mjs helper); values are the source
// with LF line endings. Deterministic: sorted keys, no timestamps.
//
//   node tools/docs/examples-source.mjs          # write
//   node tools/docs/examples-source.mjs --check  # drift gate (exit 1 if stale)
//
// Both run as part of `npm run docs:examples` / `docs:examples:check`.
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const EXAMPLES_DIR = join(REPO, 'examples');
const OUT = join(REPO, 'docs', 'src', 'generated', 'examples-source.json');
const CHECK = process.argv.includes('--check');

const files = readdirSync(EXAMPLES_DIR)
  .filter((f) => /^\d\d_.*\.mjs$/.test(f) || f === '_util.mjs')
  .sort();
const map = {};
for (const f of files) map[f] = readFileSync(join(EXAMPLES_DIR, f), 'utf8').replace(/\r\n/g, '\n');
const next = `${JSON.stringify(map, null, 2)}\n`;

const current = existsSync(OUT) ? readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : null;
if (current === next) {
  console.log(`✓ docs/src/generated/examples-source.json is up to date (${files.length} files).`);
} else if (CHECK) {
  console.error('✗ STALE: docs/src/generated/examples-source.json differs from examples/ — run `npm run docs:examples`.');
  process.exit(1);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, next);
  console.log(`✓ wrote docs/src/generated/examples-source.json (${files.length} files).`);
}
