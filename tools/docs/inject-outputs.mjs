#!/usr/bin/env node
// ---------------------------------------------------------------------------
// inject-outputs.mjs — build-time "real output" injector (literate docs PoC).
//
// Runs a small set of example snippets at BUILD time and freezes their real
// parsed output into a guide page, between HTML-comment markers. This gives the
// "literate docs" benefit (the reader sees actual rows the parser produces)
// without any client runtime — the tables are plain markdown in the committed
// page.
//
// How it works:
//   1. Each EXAMPLE names a committed ESPN fixture + a parse target (kind/key).
//   2. We load the fixture and run it through the SAME parser bundle the
//      playground uses (docs/src/playground/parsers.bundle.mjs, which runs in
//      Node as-is — it's an esbuild-bundled ESM module).
//   3. We render the first ~8 rows × ~6 cols as a markdown table (truncation
//      noted), then inject it into the target guide between markers, e.g.
//         <!-- inject:example:scoreboard -->  ...  <!-- /inject -->
//
// It is idempotent: re-running replaces the content between each marker pair.
// It is deterministic: fixtures are committed, so there is NO network — CI can
// reproduce the exact same tables. (The same injector could fetch live instead;
// the fixture path is the PoC choice for reproducibility.)
//
// Usage:  node tools/docs/inject-outputs.mjs
//         npm run docs:examples
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');

const FIXTURES = join(REPO, 'test', 'fixtures', 'espn');
const PARSERS = join(REPO, 'docs', 'src', 'playground', 'parsers.bundle.mjs');
const TARGET = join(REPO, 'docs', 'docs', 'guides', '01-quickstart.mdx');

const MAX_ROWS = 8;
const MAX_COLS = 6;

// The PoC example set: id (matches the marker), fixture file, parse kind + key,
// and a one-line caption rendered above the table.
const EXAMPLES = [
  {
    id: 'scoreboard',
    fixture: 'scoreboard_nba.json',
    kind: 'espn',
    key: 'scoreboard',
    caption: '`sdv.nba.espnNbaScoreboard({ parsed: true })` — one row per game.',
  },
  {
    id: 'standings',
    fixture: 'standings_nba.json',
    kind: 'espn',
    key: 'standings',
    caption: '`sdv.nba.espnNbaStandings({ parsed: true })` — one row per team.',
  },
  {
    id: 'team_roster',
    fixture: 'team_roster_nba.json',
    kind: 'espn',
    key: 'team_roster',
    caption: '`sdv.nba.espnNbaTeamRoster({ team_id: 13, parsed: true })` — one row per player.',
  },
];

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

/** Replace the content between `<!-- inject:example:ID -->` and `<!-- /inject -->`. */
function injectBlock(doc, id, block) {
  const open = `<!-- inject:example:${id} -->`;
  const close = '<!-- /inject -->';
  const start = doc.indexOf(open);
  if (start === -1) {
    console.warn(`  ! marker not found for "${id}" — skipped`);
    return doc;
  }
  const end = doc.indexOf(close, start);
  if (end === -1) {
    console.warn(`  ! closing marker not found for "${id}" — skipped`);
    return doc;
  }
  const before = doc.slice(0, start + open.length);
  const after = doc.slice(end);
  return `${before}\n\n${block}\n\n${after}`;
}

async function main() {
  const parsers = await import(`file://${PARSERS.replace(/\\/g, '/')}`);
  let doc = readFileSync(TARGET, 'utf8');

  for (const ex of EXAMPLES) {
    const raw = JSON.parse(readFileSync(join(FIXTURES, ex.fixture), 'utf8'));
    const rows = parsers.parseEndpoint(ex.kind, ex.key, raw);
    const count = Array.isArray(rows) ? rows.length : 0;
    const block = `${ex.caption}\n\n${renderTable(rows)}`;
    doc = injectBlock(doc, ex.id, block);
    console.log(`  ✓ ${ex.id.padEnd(12)} ${ex.fixture.padEnd(24)} ${count} rows`);
  }

  writeFileSync(TARGET, doc);
  console.log(`\nInjected ${EXAMPLES.length} example(s) into ${TARGET}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
