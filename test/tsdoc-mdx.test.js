import 'should';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// TypeDoc renders the doc comments of docs/typedoc.tsconfig.json's modules to Markdown
// that Docusaurus compiles as MDX: a bare `<` before a letter / `=` / `/` opens a JSX
// tag and a bare `{` opens an expression, so `Promise<Row[]>` or `period <= 2` in
// prose breaks the docs build (it did: 477 pages, then 4). Code spans and fenced
// blocks are safe, and TypeDoc fences an `@example` body itself. This scans the
// comments the same way test/docs-mdx.test.js scans the pages, so the break shows
// here instead of in `cd docs && npm run build`.
// ponytail: a line scanner over `/** */` blocks, not a TSDoc parser.

const root = fileURLToPath(new URL('..', import.meta.url));
const entry = JSON.parse(readFileSync(join(root, 'docs', 'typedoc.tsconfig.json'), 'utf8')).files;

function unsafeLines(file) {
  const src = readFileSync(join(root, file), 'utf8');
  const bad = [];
  for (const m of src.matchAll(/\/\*\*([\s\S]*?)\*\//g)) {
    const startLine = src.slice(0, m.index).split('\n').length;
    const lines = m[1].split('\n');
    let fenced = false;
    let example = false;
    lines.forEach((raw, i) => {
      let s = raw.replace(/^\s*\*\s?/, '');
      if (/^\s*```/.test(s)) fenced = !fenced;
      if (/^\s*@\w+/.test(s)) example = /^\s*@example\b/.test(s);
      if (fenced || example || /^\s*```/.test(s)) return;
      s = s.replace(/`[^`]*`/g, '').replace(/\{@link[^}]*\}/g, '').replace(/\\[{}<]/g, '');
      if (/<(?=[A-Za-z=\/!])/.test(s) || /\{/.test(s)) bad.push(`${file}:${startLine + i}: ${raw.trim()}`);
    });
  }
  return bad;
}

describe('TSDoc of the TypeDoc entry points is MDX-safe', () => {
  for (const f of entry.filter((f) => !f.includes('/generated/'))) {
    it(`${f.replace('../', '')} has no bare < or { in comment prose`, () => {
      unsafeLines(f.replace('../', '')).should.eql([]);
    });
  }
});
