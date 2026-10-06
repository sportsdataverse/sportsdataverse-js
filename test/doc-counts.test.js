import 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sdv from '../dist/index.js';
import { LEAGUES } from '../dist/generated/leagues.js';
import { WRAPPERS, FLAT_WRAPPERS } from '../dist/generated/wrappers.js';
import { WRITTEN_FLAT } from '../dist/generated/flat/index.js';

// The league / wrapper / family counts quoted in the hand-written docs must be the
// tree's (README.md:12 said "29 leagues" for a release after the vendor sync added
// nbagl). Each count is derived from the generated registries, then every quoted
// count of that kind in each doc is compared with it.
// ponytail: line-scoped regexes, not a markdown parser; a count quoted in a new
// phrasing is simply not checked until a pattern is added below.

const root = fileURLToPath(new URL('..', import.meta.url));
const DOCS = ['README.md', 'CLAUDE.md', 'CONTRIBUTING.md', 'docs/docs/intro.md'];

const leaguePrefixes = new Set(LEAGUES.map((l) => l.prefix));
const families = [...new Set(FLAT_WRAPPERS.map((w) => w.api))];
/** The namespace a flat family's wrappers were merged onto (by function identity). */
function namespaceOf(api) {
  const mod = WRITTEN_FLAT[api];
  const name = Object.keys(mod).find((k) => typeof mod[k] === 'function');
  return Object.keys(sdv).find((ns) => sdv[ns] && sdv[ns][name] === mod[name]);
}
const leagueFamilies = families.filter((api) => leaguePrefixes.has(namespaceOf(api)));

const expected = {
  leagues: LEAGUES.length,
  shorts: new Set(WRAPPERS.map((w) => w.short)).size,
  flat: FLAT_WRAPPERS.length,
  families: families.length,
  leagueFamilies: leagueFamilies.length,
  providerFamilies: families.length - leagueFamilies.length,
};

// [kind, line filter, regex with one capture = the quoted count]
const PATTERNS = [
  ['leagues', (l) => /espn|endpoint/i.test(l), /\b(\d+) leagues\b/g],
  ['shorts', () => true, /\b(\d+) (?:ESPN )?(?:endpoint wrappers|endpoint short names|distinct short names)/g],
  ['shorts', () => true, /\b(\d+) endpoints × \d+ leagues/g],
  ['flat', () => true, /\b(\d+) (?:flat-API\s+)?wrappers across \d+\s+families/g],
  ['families', () => true, /\b\d+ (?:flat-API\s+)?wrappers across (\d+)\s+families/g],
  ['leagueFamilies', () => true, /\b(\d+) league\s+families\b/g],
  ['providerFamilies', () => true, /\b(\d+) provider families\b/g],
];

describe('the CHANGELOG pair', () => {
  it('docs/src/pages/CHANGELOG.md is CHANGELOG.md from the first release heading on', () => {
    // The root copy's intro links the site with an autolink Docusaurus (MDX) rejects, so
    // only the title lines differ; the entries must not drift (the docs copy once did).
    const body = (f) => readFileSync(root + f, 'utf8').replace(/\r\n/g, '\n').replace(/^[\s\S]*?(?=^## )/m, '');
    body('docs/src/pages/CHANGELOG.md').should.equal(body('CHANGELOG.md'));
  });
});

describe('doc counts match the generated tree', () => {
  it('derives the counts from the registries', () => {
    expected.leagues.should.be.above(0);
    expected.shorts.should.be.above(0);
    expected.flat.should.be.above(0);
    families.forEach((api) => should.exist(namespaceOf(api), `family ${api} is on no namespace`));
  });

  for (const doc of DOCS) {
    it(`${doc} quotes the tree's counts`, () => {
      const text = readFileSync(root + doc, 'utf8').replace(/\*\*/g, '');
      const seen = new Set();
      for (const [kind, lineOk, re] of PATTERNS) {
        for (const m of text.matchAll(re)) {
          const lineStart = text.lastIndexOf('\n', m.index) + 1;
          const line = text.slice(lineStart, text.indexOf('\n', m.index));
          if (!lineOk(line)) continue;
          seen.add(kind);
          Number(m[1]).should.equal(expected[kind], `${doc}: "${m[0].replace(/\s+/g, ' ')}" vs ${kind}=${expected[kind]}`);
        }
      }
      // every doc states the ESPN league count and the flat wrapper / family counts
      ['leagues', 'shorts', 'flat', 'families'].forEach((k) => seen.has(k).should.be.true(`${doc} does not quote ${k}`));
    });
  }
});
