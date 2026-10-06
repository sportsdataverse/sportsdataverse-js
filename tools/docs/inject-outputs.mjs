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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
/** Target page dirs: an entry's `dir` (default "guides") picks one. */
const DOC_DIRS = {
  guides: join(REPO, 'docs', 'docs', 'guides'),
  tutorials: join(REPO, 'docs', 'docs', 'tutorials'),
};
// The "script" family: run examples/<script> offline (examples/_offline.mjs
// serves committed fixtures) and freeze its stdout; its `artifacts` (files the
// script writes to examples/out/) are copied to docs/static/examples/ so a
// tutorial can embed them. Needs `npm install` in examples/ (file:.. link).
const EXAMPLES_DIR = join(REPO, 'examples');
const STATIC_EXAMPLES = join(REPO, 'docs', 'static', 'examples');

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

/** Run examples/<script> offline; returns its stdout (deterministic: fixtures only). */
function runScript(ex) {
  if (!existsSync(join(EXAMPLES_DIR, 'node_modules', 'sportsdataverse'))) {
    throw new Error(`example "${ex.id}": examples/node_modules is missing — run \`npm install\` in examples/ first`);
  }
  const res = spawnSync(process.execPath, [ex.script], {
    cwd: EXAMPLES_DIR,
    encoding: 'utf8',
    env: { ...process.env, SDV_LIVE: '' },
    timeout: 60_000,
  });
  if (res.status !== 0) {
    throw new Error(`example "${ex.id}": ${ex.script} exited ${res.status}\n${res.stderr}`);
  }
  return res.stdout.replace(/\r\n/g, '\n').trimEnd();
}

/** Build the full injected block (caption + table) for an entry. */
function blockFor(parsers, ex) {
  if (ex.family === 'script') {
    const out = runScript(ex);
    const count = (out.match(/^## /gm) ?? []).length;
    return { block: `${ex.caption}\n\n\`\`\`text\n${out}\n\`\`\``, count };
  }
  const rows = rowsFor(parsers, ex);
  const count = Array.isArray(rows) ? rows.length : 0;
  return { block: `${ex.caption}\n\n${renderTable(rows)}`, count };
}

/** The script's own source as a fenced block (for `<!-- inject:source:ID -->`). */
function sourceBlock(ex) {
  const src = readFileSync(join(EXAMPLES_DIR, ex.script), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  return `\`\`\`js title="examples/${ex.script}"\n${src}\n\`\`\``;
}

/**
 * Copy a script's artifacts (examples/out/<f>) to docs/static/examples/<f>.
 * Returns the names whose committed copy differs (or is missing).
 */
function syncArtifacts(ex) {
  const stale = [];
  for (const f of ex.artifacts ?? []) {
    const src = readFileSync(join(EXAMPLES_DIR, 'out', f));
    const dst = join(STATIC_EXAMPLES, f);
    const same = existsSync(dst) && readFileSync(dst).equals(src);
    if (same) continue;
    stale.push(f);
    if (!CHECK) {
      mkdirSync(STATIC_EXAMPLES, { recursive: true });
      writeFileSync(dst, src);
    }
  }
  return stale;
}

/** Replace the content between `<!-- inject:<kind>:ID -->` and `<!-- /inject -->`. */
function injectBlock(doc, id, block, kind = 'example') {
  const open = `<!-- inject:${kind}:${id} -->`;
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
    const key = `${ex.dir ?? 'guides'}/${ex.target}`;
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key).push(ex);
  }

  let staleFiles = 0;
  let injected = 0;
  let missingMarkers = 0;

  for (const [target, exs] of byTarget) {
    const [dir, file] = target.split('/');
    if (!DOC_DIRS[dir]) throw new Error(`unknown docs dir "${dir}" (use ${Object.keys(DOC_DIRS).join(' | ')})`);
    const path = join(DOC_DIRS[dir], file);
    const original = readFileSync(path, 'utf8');
    let doc = original;

    for (const ex of exs) {
      const { block, count } = blockFor(parsers, ex);
      // A script entry also freezes its own source (`<!-- inject:source:ID -->`)
      // so the tutorial can never show code that differs from examples/.
      const parts = [['example', block]];
      if (ex.family === 'script') parts.push(['source', sourceBlock(ex)]);
      let ok = true;
      for (const [kind, content] of parts) {
        const res = injectBlock(doc, ex.id, content, kind);
        if (!res.found) {
          // A manifest entry pointing at a marker that isn't in the page is
          // broken wiring — fail (don't silently skip), since a missing marker
          // leaves `doc === original` and would otherwise sneak past --check.
          missingMarkers += 1;
          ok = false;
          console.error(`  ✗ ${kind} marker not found for "${ex.id}" in ${target} — manifest ↔ page wiring is broken`);
          continue;
        }
        doc = res.doc;
      }
      if (!ok) continue;
      injected += 1;
      const staleArtifacts = ex.family === 'script' ? syncArtifacts(ex) : [];
      if (CHECK && staleArtifacts.length > 0) {
        staleFiles += 1;
        console.error(`  ✗ STALE: docs/static/examples/{${staleArtifacts.join(',')}} differ from a fresh run of ${ex.script}`);
      }
      const unit = ex.family === 'script' ? 'tables' : 'rows';
      console.log(`  ✓ ${ex.id.padEnd(18)} ${target.padEnd(34)} ${ex.family.padEnd(13)} ${count} ${unit}`);
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
