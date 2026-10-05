import 'should';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Docusaurus 3 compiles every .md / .mdx page as MDX, where a bare `{` opens a JS
// expression and `<name` opens a JSX tag: `{429, 5xx}` or `Promise<T>` in prose breaks
// the docs build (docs/src/pages/CHANGELOG.md did, on Vercel only). The site cannot be
// built on every dev box, so this scans the compiled pages and fails with file:line.
// ponytail: a line scanner, not an MDX parser. It skips fences, code spans, `\{` / `\<`
// escapes, HTML and `{/* */}` comments, import/export lines and capitalised JSX
// component blocks (`<RunCell … />`), and allows a short list of lowercase HTML tags;
// an unclosed allowed tag (`<br>`) still passes. Swap in @mdx-js/mdx if that bites.

const root = fileURLToPath(new URL('..', import.meta.url));
const rel = (p) => relative(root, p).split('\\').join('/');
const HTML_OK = new Set(['a', 'img', 'br', 'details', 'summary', 'div', 'span', 'p', 'sup', 'sub', 'kbd', 'b', 'i', 'em', 'strong']);

/** `line: text` for every line of `text` with an MDX-unsafe `{`, `}` or `<tag` outside code. */
function mdxUnsafeLines(text) {
  const bad = [];
  let fence = null; // the opening fence run while inside a fenced block
  let comment = false; // inside a multi-line <!-- --> comment
  let jsx = false; // inside a multi-line capitalised JSX component
  let front = false; // inside YAML front matter
  text.split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (i === 0 && t === '---') return void (front = true);
    if (front) return void (t === '---' && (front = false));
    const f = t.match(/^(`{3,}|~{3,})/);
    if (fence) return void (f && f[1][0] === fence[0] && f[1].length >= fence.length && t === f[1] && (fence = null));
    if (f) return void (fence = f[1]);
    if (jsx) return void ((t.endsWith('/>') || /^<\/[A-Z]/.test(t)) && (jsx = false));
    if (/^(import|export)\s/.test(t)) return;
    if (/^<[A-Z]/.test(t)) return void (!t.endsWith('>') && (jsx = true));
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
    const tags = [...s.matchAll(/<\/?([A-Za-z][\w.:-]*)/g)].map((m) => m[1]);
    if (/[{}]/.test(s) || tags.some((tag) => !HTML_OK.has(tag))) bad.push(`${i + 1}: ${t.slice(0, 120)}`);
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
  it('the scanner flags bare braces and tags in prose, not in code or JSX blocks', () => {
    mdxUnsafeLines('retries {429, 5xx}').should.eql(['1: retries {429, 5xx}']);
    mdxUnsafeLines('returns Promise<T>').should.have.length(1);
    mdxUnsafeLines('see <https://x.y>').should.have.length(1);
    mdxUnsafeLines('a stray } brace').should.have.length(1);
    mdxUnsafeLines('retries `{429, 5xx}` and ``a `{b}` c``').should.eql([]);
    mdxUnsafeLines('```js\nconst o = { a: 1 };\n```\nafter').should.eql([]);
    mdxUnsafeLines('{/* generated */}\n<!-- a {note} -->\n\\{ok\\}').should.eql([]);
    mdxUnsafeLines('<RunCell\n  params={{ year: 2024 }}\n/>\n<RunCell a="b" />\ntext {x}').should.eql(['5: text {x}']);
    mdxUnsafeLines("import X from 'y';\n<a href='u'><img src='v'/></a>").should.eql([]);
    mdxUnsafeLines('---\ntitle: {x}\n---\nbody').should.eql([]);
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
