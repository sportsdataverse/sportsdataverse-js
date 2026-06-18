#!/usr/bin/env node
// ---------------------------------------------------------------------------
// inject-outputs.mjs — build-time "real output" injector (literate docs).
//
// Runs a manifest of example snippets at BUILD time and freezes their real
// parsed output into the guide pages, between HTML-comment markers. This gives
// the "literate docs" benefit (the reader sees the actual rows the parser
// produces) without any client runtime — the tables are plain markdown in the
// committed page.
//
// How it works:
//   1. The example set lives in tools/docs/examples.mjs (the MANIFEST) — each
//      entry names a committed fixture + a parse target (family/key/parser/
//      section) + the guide page + marker id where its table should land.
//   2. We load each fixture and run it through the SAME parser bundle the
//      playground uses (docs/src/playground/parsers.bundle.mjs, an esbuild
//      ESM module that runs in Node as-is).
//   3. We render the first ~8 rows × ~6 cols as a markdown table (truncation
//      noted), then inject it into the target guide between markers, e.g.
//         <!-- inject:example:scoreboard -->  ...  <!-- /inject -->
//
// Supported families (see examples.mjs for the contract):
//   - "espn"          ESPN array-frame parser  → array of row objects.
//   - "flat"          flat (non-ESPN) parser    → array of row objects.
//   - "espn-summary"  ESPN summary dispatcher   → dict of frames; render one
//                     chosen `section` sub-frame.
//
// It is idempotent: re-running replaces the content between each marker pair.
// It is deterministic: fixtures are committed, so there is NO network — CI can
// reproduce the exact same tables.
//
// Usage:
//   node tools/docs/inject-outputs.mjs           # write the frozen tables
//   node tools/docs/inject-outputs.mjs --check    # CI drift gate: exit 1 if any
//                                                 # guide is stale vs a fresh run
//   npm run docs:examples                          # alias for the write mode
//
// The `--check` mode is wired into CI (.github/workflows/ci.yml, docs job) so a
// committed guide whose frozen output no longer matches the parser fails the
// build instead of silently drifting.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { EXAMPLES } from './examples.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');

const FIXTURE_DIRS = {
  espn: join(REPO, 'test', 'fixtures', 'espn'),
  tools: join(__dirname, 'fixtures'),
};
const PARSERS = join(REPO, 'docs', 'src', 'playground', 'parsers.bundle.mjs');
const GUIDES = join(REPO, 'docs', 'docs', 'guides');

const MAX_ROWS = 8;
const MAX_COLS = 6;

const CHECK = process.argv.includes('--check');

/** Escape a value for a markdown table cell (no raw pipes/newlines). */
function cell(v) {
  if (v == null) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  s = s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  if (s.length > 40) s = s.slice(0, 37) + '…';
  return s;
}

/** Render rows -> a markdown table (first MAX_ROWS × MAX_COLS), with a note. */
function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '_0 rows (empty frame)._';
  }
  const allCols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cols = allCols.slice(0, MAX_COLS);
  const shown = rows.slice(0, MAX_ROWS);

  const header = `| ${cols.join(' | ')} |`;
  const divider = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = shown
    .map((r) => `| ${cols.map((c) => cell(r[c])).join(' | ')} |`)
    .join('\n');

  const truncBits = [];
  if (rows.length > MAX_ROWS) truncBits.push(`${rows.length} rows total — first ${MAX_ROWS} shown`);
  else truncBits.push(`${rows.length} rows`);
  if (allCols.length > MAX_COLS) truncBits.push(`${allCols.length} cols total — first ${MAX_COLS} shown`);
  else truncBits.push(`${allCols.length} cols`);

  return `${header}\n${divider}\n${body}\n\n_${truncBits.join(', ')}._`;
}

/** Run one manifest entry through the parser bundle → array of rows. */
function rowsFor(parsers, ex) {
  const dir = FIXTURE_DIRS[ex.fixtureDir];
  if (!dir) throw new Error(`example "${ex.id}": unknown fixtureDir "${ex.fixtureDir}"`);
  const raw = JSON.parse(readFileSync(join(dir, ex.fixture), 'utf8'));

  if (ex.family === 'espn') {
    return parsers.parseEndpoint('espn', ex.key, raw);
  }
  if (ex.family === 'flat') {
    return parsers.parseEndpoint('flat', ex.parser, raw);
  }
  if (ex.family === 'espn-summary') {
    const dict = parsers.parseEndpoint('espn', 'summary', raw);
    if (!dict || typeof dict !== 'object') return [];
    if (!(ex.section in dict)) {
      throw new Error(`example "${ex.id}": summary section "${ex.section}" not found`);
    }
    return dict[ex.section];
  }
  throw new Error(`example "${ex.id}": unknown family "${ex.family}"`);
}

/** Build the full injected block (caption + table) for an entry. */
function blockFor(parsers, ex) {
  const rows = rowsFor(parsers, ex);
  const count = Array.isArray(rows) ? rows.length : 0;
  return { block: `${ex.caption}\n\n${renderTable(rows)}`, count };
}

/** Replace the content between `<!-- inject:example:ID -->` and `<!-- /inject -->`. */
function injectBlock(doc, id, block) {
  const open = `<!-- inject:example:${id} -->`;
  const close = '<!-- /inject -->';
  const start = doc.indexOf(open);
  if (start === -1) return { doc, found: false };
  const end = doc.indexOf(close, start);
  if (end === -1) return { doc, found: false };
  const before = doc.slice(0, start + open.length);
  const after = doc.slice(end);
  return { doc: `${before}\n\n${block}\n\n${after}`, found: true };
}

async function main() {
  // pathToFileURL produces a correct, cross-platform `file:///…` specifier
  // (manual `file://` + slash-swapping breaks on Windows drive paths).
  const parsers = await import(pathToFileURL(PARSERS).href);

  // Group examples by target guide so each file is read + written once.
  const byTarget = new Map();
  for (const ex of EXAMPLES) {
    if (!byTarget.has(ex.target)) byTarget.set(ex.target, []);
    byTarget.get(ex.target).push(ex);
  }

  let staleFiles = 0;
  let injected = 0;
  let missingMarkers = 0;

  for (const [target, exs] of byTarget) {
    const path = join(GUIDES, target);
    const original = readFileSync(path, 'utf8');
    let doc = original;

    for (const ex of exs) {
      const { block, count } = blockFor(parsers, ex);
      const res = injectBlock(doc, ex.id, block);
      if (!res.found) {
        // A manifest entry pointing at a marker that isn't in the guide is
        // broken wiring — fail (don't silently skip), since a missing marker
        // leaves `doc === original` and would otherwise sneak past --check.
        missingMarkers += 1;
        console.error(`  ✗ marker not found for "${ex.id}" in ${target} — manifest ↔ guide wiring is broken`);
        continue;
      }
      doc = res.doc;
      injected += 1;
      console.log(`  ✓ ${ex.id.padEnd(18)} ${target.padEnd(20)} ${ex.family.padEnd(13)} ${count} rows`);
    }

    if (doc !== original) {
      if (CHECK) {
        staleFiles += 1;
        console.error(`  ✗ STALE: ${target} — injected output differs from a fresh run`);
      } else {
        writeFileSync(path, doc);
      }
    }
  }

  if (CHECK) {
    if (staleFiles > 0 || missingMarkers > 0) {
      const bits = [];
      if (staleFiles > 0) bits.push(`${staleFiles} guide(s) have stale frozen output`);
      if (missingMarkers > 0) bits.push(`${missingMarkers} manifest entr${missingMarkers === 1 ? 'y' : 'ies'} reference a missing inject marker`);
      console.error(
        `\n${bits.join('; ')}. ` +
          'Run `npm run docs:examples` (and fix any broken guide wiring), then commit the result.'
      );
      process.exit(1);
    }
    console.log(`\n✓ All ${injected} injected block(s) across ${byTarget.size} guide(s) are up to date.`);
    return;
  }

  // Even in write mode, a missing marker is broken wiring — surface it as a failure.
  if (missingMarkers > 0) {
    console.error(`\n${missingMarkers} manifest entr${missingMarkers === 1 ? 'y' : 'ies'} reference a missing inject marker (see above).`);
    process.exit(1);
  }

  console.log(`\nInjected ${injected} example(s) across ${byTarget.size} guide(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
