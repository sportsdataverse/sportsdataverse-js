import 'should';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Docusaurus 3 compiles every .md / .mdx page as MDX, where a bare `{` opens a JS
// expression and `<name` opens a JSX tag: `{429, 5xx}` or `Promise<T>` in prose breaks
// the docs build (docs/src/pages/CHANGELOG.md did, on Vercel only). The site cannot be
// built on every dev box, so this scans the compiled pages and fails with file:line.
// ponytail: a line scanner, not an MDX parser (its cases were checked against
// @mdx-js/mdx). It skips fences, code spans, `\{` / `\<` escapes, HTML and `{/* */}`
// comments, front matter, import/export lines, Docusaurus `{#id}` heading ids, and
// blocks of the JSX components the page imports (`<RunCell … />`); it allows a short
// list of lowercase HTML tags, requiring a void one (`<br>`, `<img>`) to end in `/>`.
// A tag split over lines, or a component used mid-line, is beyond it.

const root = fileURLToPath(new URL('..', import.meta.url));
const rel = (p) => relative(root, p).split('\\').join('/');
const HTML_OK = new Set([
  'a', 'img', 'br', 'hr', 'details', 'summary', 'div', 'span', 'p', 'sup', 'sub', 'kbd', 'b', 'i', 'em',
  'strong', 'code', 'ins', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);
const VOID = new Set(['br', 'img', 'hr']);

/** `line: text` for every line of `text` with an MDX-unsafe `{`, `<` or tag outside code. */
function mdxUnsafeLines(text) {
  const bad = [];
  const components = new Set(); // the JSX components this page imports
  let fence = null; // the opening fence run while inside a fenced block
  let comment = false; // inside a multi-line <!-- --> comment
  let jsx = false; // inside a multi-line JSX component tag
  let front = false; // inside YAML front matter
  text.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (i === 0 && t === '---') return void (front = true);
    if (front) return void (t === '---' && (front = false));
    const f = t.match(/^(`{3,}|~{3,})/);
    if (fence) return void (f && f[1][0] === fence[0] && f[1].length >= fence.length && t === f[1] && (fence = null));
    if (f) return void (fence = f[1]);
    if (jsx) return void (t.endsWith('>') && (jsx = false)); // `/>`, or the `>` ending a multi-line opening tag
    const imported = t.match(/^import\s+(.+?)\s+from\s/);
    if (imported) return void imported[1].match(/[A-Za-z_$][\w$]*/g).forEach((n) => components.add(n));
    if (/^export\s/.test(t)) return;
    const tag = t.match(/^<\/?([A-Z][\w.]*)/);
    if (tag && components.has(tag[1])) return void (!t.endsWith('>') && (jsx = true));
    let s = line;
    if (comment) {
      const end = s.indexOf('-->');
      if (end < 0) return;
      s = s.slice(end + 3);
      comment = false;
    }
    s = s.replace(/<!--.*?-->/g, '').replace(/\{\/\*.*?\*\/\}/g, '');
    const open = s.indexOf('<!--');
    if (open >= 0) [s, comment] = [s.slice(0, open), true];
    s = s.replace(/(`+)[\s\S]*?\1/g, '').replace(/\\[{}<]/g, '');
    if (/^#{1,6}\s/.test(t)) s = s.replace(/\s\{#[\w-]+\}\s*$/, ''); // `## Title {#id}`
    const tags = [...s.matchAll(/<\/?([A-Za-z][\w.:-]*)[^>]*>?/g)];
    const badTag = tags.some(([whole, name]) => !HTML_OK.has(name) || (VOID.has(name) && !whole.endsWith('/>')));
    // `<` then a digit, `=` or other non-name character starts no tag and is an MDX error (`<5`, `<=`).
    // A `{` opens an expression: `{429, 5xx}` fails to compile, and even a valid one (`{x}`) fails
    // at render (x is not defined). A stray `}` is literal text.
    if (s.includes('{') || /<(?![A-Za-z/!\s])/.test(s) || badTag) bad.push(`${i + 1}: ${t.slice(0, 120)}`);
  });
  return bad;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (rel(p) !== 'docs/docs/api') walk(p, out); // TypeDoc output, written at build time
    } else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('docs: every page Docusaurus compiles is MDX-safe', () => {
  // Every case agrees with @mdx-js/mdx 3 (plus Docusaurus' front matter, comment and
  // heading-id handling), except `{x}`: it compiles, then fails when the page renders.
  const unsafe = (text) => mdxUnsafeLines(text).length > 0;
  it('flags what MDX rejects: braces, non-tag `<`, unknown or unclosed tags, unimported components', () => {
    mdxUnsafeLines('retries {429, 5xx}').should.eql(['1: retries {429, 5xx}']);
    mdxUnsafeLines('valid {x} expression').should.have.length(1); // compiles; x is not defined at render
    for (const bad of ['returns Promise<T>', 'see <https://x.y>', 'x <5 rows', 'a <= 3', 'ends with <']) {
      unsafe(bad).should.be.true(bad);
    }
    for (const bad of ['line<br>break', "<img src='x'>", '<T> starts this prose line', '## Heading {a b}']) {
      unsafe(bad).should.be.true(bad);
    }
    // a multi-line opening tag ends at its `>`: the prose after it is scanned again
    const tabs = "import Tabs from '@theme/Tabs';\n\n<Tabs\n  groupId=\"x\">\n\nhidden {a b}\n\n</Tabs>";
    mdxUnsafeLines(tabs).should.eql(['6: hidden {a b}']);
  });

  it('passes what MDX accepts: code, escapes, comments, front matter, imported components, HTML', () => {
    for (const ok of [
      'retries `{429, 5xx}` and ``a `{b}` c``',
      '```js\nconst o = { a: 1 };\n```\nafter',
      '{/* generated */}\n<!-- a {note} -->\n\\{ok\\}',
      'a stray } brace',
      'a < 3 and b > 2',
      '---\ntitle: {x}\n---\nbody',
      "import X from 'y';\n<a href='u'><img src='v'/></a> line<br/>break <img src='x' />",
      "import Tabs from '@theme/Tabs';\n\n<Tabs>\n\nprose\n\n</Tabs>",
      '<table><tr><td>a</td></tr></table> a <code>x</code> b <ins>x</ins>',
      '## Heading {#custom-id}',
    ]) {
      unsafe(ok).should.be.false(ok);
    }
    const cells = "import RunCell from 'r';\n<RunCell\n  params={{ year: 2024 }}\n/>\n<RunCell a=\"b\" />\ntext {x y}";
    mdxUnsafeLines(cells).should.eql(['6: text {x y}']);
  });

  it('docs/docs, docs/src pages and the CHANGELOG copied to the site are clean (file:line)', () => {
    const files = [...walk(join(root, 'docs', 'docs')), ...walk(join(root, 'docs', 'src'))];
    files.length.should.be.above(100);
    const bad = files.flatMap((f) => mdxUnsafeLines(readFileSync(f, 'utf8')).map((l) => `${rel(f)}:${l}`));
    // The root CHANGELOG is not compiled, but its entries are copied into
    // docs/src/pages/CHANGELOG.md: check it from the first entry heading on.
    const log = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    const start = log.slice(0, log.search(/^## /m)).split('\n').length - 1;
    for (const l of mdxUnsafeLines(log.slice(log.search(/^## /m)))) {
      const [n, ...rest] = l.split(': ');
      bad.push(`CHANGELOG.md:${Number(n) + start}: ${rest.join(': ')}`);
    }
    bad.should.eql([]);
  });
});
