// Module-resolution preload for the example scripts, so they run from a bare
// checkout with NO `npm install` in examples/:
//
//   node --import ./_resolve.mjs 01_nba_scoreboard_to_table.mjs
//
// It registers a resolve hook (node:module `register`) that maps the bare
// specifiers the scripts import to the worktree's own build output, so the
// scripts keep their copy-pasteable `import sdv from 'sportsdataverse'`:
//
//   sportsdataverse            → ../dist/index.js          (run `npm run build` first)
//   sportsdataverse/parsers    → ../dist/parsers/index.js
//   @sportsdataverse/<pkg>[/x] → $SDVPLOT_JS_DIR/packages/<pkg>/<its package.json exports>
//                                 (default: ../../sdvplot-js, the sibling clone)
//   any other bare specifier this repo does not install (@observablehq/plot,
//   jsdom) → resolved from $SDVPLOT_JS_DIR/packages/sdvplot (its dev install)
//
// The unpublished sdvplot-js packages are optional: when a script imports one
// and its dist is absent, this preload prints one `skipped:` line and exits 0
// before the script's imports run, so tools/docs/inject-outputs.mjs and
// test/examples.test.js stay green without the sibling checkout. The injector
// keeps the previously committed output for a skipped script.
//
// `npm install` in examples/ (package.json links the package with `file:..`)
// remains a convenience for plain `node NN_*.mjs`; it is not required.

import { existsSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainThread } from 'node:worker_threads';

const REPO = new URL('../', import.meta.url);
const SDVPLOT_JS = process.env.SDVPLOT_JS_DIR
  ? pathToFileURL(resolvePath(process.env.SDVPLOT_JS_DIR) + '/')
  : new URL('../../sdvplot-js/', REPO);

const LOCAL = {
  sportsdataverse: new URL('dist/index.js', REPO),
  'sportsdataverse/parsers': new URL('dist/parsers/index.js', REPO),
};

/** `@sportsdataverse/sporty/svg` → the file its package.json `exports` names, or null. */
function sdvplotEntry(specifier) {
  const m = specifier.match(/^@sportsdataverse\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  const pkgDir = new URL(`packages/${m[1]}/`, SDVPLOT_JS);
  const pkgJson = new URL('package.json', pkgDir);
  if (!existsSync(pkgJson)) return null;
  const entry = JSON.parse(readFileSync(pkgJson, 'utf8')).exports?.[`.${m[2] ?? ''}`];
  const file = typeof entry === 'string' ? entry : entry?.import;
  return file ? new URL(file, pkgDir) : null;
}

export async function resolve(specifier, context, next) {
  if (LOCAL[specifier]) return { url: LOCAL[specifier].href, shortCircuit: true };
  const sdvplot = sdvplotEntry(specifier);
  if (sdvplot) return { url: sdvplot.href, shortCircuit: true };
  try {
    return await next(specifier, context);
  } catch (e) {
    // A peer the 9x scripts share with sdvplot (@observablehq/plot, jsdom) resolves from
    // sdvplot-js's own install, so the script and sdvplot load ONE copy of Plot.
    if (e?.code !== 'ERR_MODULE_NOT_FOUND' || /^[./]|^[a-z]+:/i.test(specifier)) throw e;
    return next(specifier, { ...context, parentURL: new URL('packages/sdvplot/package.json', SDVPLOT_JS).href });
  }
}

if (isMainThread) {
  // --import preload: runs on the main thread before the entry script.
  const entry = process.argv[1];
  // every `@sportsdataverse/<pkg>[/sub]` the script imports must resolve to a built file
  const specifiers = entry
    ? [...readFileSync(entry, 'utf8').matchAll(/from\s+['"](@sportsdataverse\/[^'"]+)['"]/g)].map((m) => m[1])
    : [];
  const missing = specifiers.filter((s) => {
    const file = sdvplotEntry(s);
    return !file || !existsSync(file);
  });
  if (missing.length) {
    console.log(`skipped: build sdvplot-js first (see examples/README.md) — missing ${missing.join(', ')}`);
    process.exit(0);
  }
  if (!existsSync(LOCAL.sportsdataverse)) {
    console.error(`examples/_resolve.mjs: ${fileURLToPath(LOCAL.sportsdataverse)} is missing — run \`npm run build\` at the repo root`);
    process.exit(1);
  }
  register(import.meta.url);
}
