import 'should'; // side-effect: installs the `.should` assertion property
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EXAMPLES } from '../tools/docs/examples.mjs';
import * as bundle from '../docs/src/playground/parsers.bundle.mjs';

// No-network guard for the docs output injector (tools/docs/inject-outputs.mjs)
// + its manifest (tools/docs/examples.mjs). Each example freezes real parser
// output into a guide between marker comments; this test checks the wiring is
// internally consistent so a broken manifest entry fails CI before the docs
// build. It runs the SAME committed parser bundle the injector + playground use.

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const FIXTURE_DIRS = {
  espn: join(REPO, 'test', 'fixtures', 'espn'),
  tools: join(REPO, 'tools', 'docs', 'fixtures'),
};
const DOC_DIRS = {
  guides: join(REPO, 'docs', 'docs', 'guides'),
  tutorials: join(REPO, 'docs', 'docs', 'tutorials'),
};
const pageOf = (ex) => join(DOC_DIRS[ex.dir ?? 'guides'], ex.target);

describe('docs output-injector manifest is internally consistent', () => {
  it('has at least one example per supported family', () => {
    const families = new Set(EXAMPLES.map((e) => e.family));
    families.has('espn').should.equal(true);
    families.has('flat').should.equal(true);
    families.has('espn-summary').should.equal(true);
    families.has('script').should.equal(true);
  });

  // The "script" family runs examples/<script> (test/examples.test.js covers the
  // run itself); here only the static wiring is checked.
  for (const ex of EXAMPLES.filter((e) => e.family === 'script')) {
    describe(`script example "${ex.id}" (${ex.script} → ${ex.dir}/${ex.target})`, () => {
      it('points at a script that exists and targets the tutorials dir', () => {
        existsSync(join(REPO, 'examples', ex.script)).should.equal(true);
        ex.dir.should.equal('tutorials');
      });
      it('has example + source inject markers in its target page', () => {
        const doc = readFileSync(pageOf(ex), 'utf8');
        for (const kind of ['example', 'source']) {
          const open = `<!-- inject:${kind}:${ex.id} -->`;
          const start = doc.indexOf(open);
          start.should.be.above(-1, `${open} missing in ${ex.target}`);
          doc.indexOf('<!-- /inject -->', start).should.be.above(start);
        }
      });
      it('every declared artifact is committed under docs/static/examples/', () => {
        for (const f of ex.artifacts ?? []) {
          existsSync(join(REPO, 'docs', 'static', 'examples', f)).should.equal(true, f);
        }
      });
    });
  }

  for (const ex of EXAMPLES.filter((e) => e.family !== 'script')) {
    describe(`example "${ex.id}" (${ex.family} → ${ex.target})`, () => {
      it('points at a fixture that exists', () => {
        const dir = FIXTURE_DIRS[ex.fixtureDir];
        (dir == null).should.equal(false);
        existsSync(join(dir, ex.fixture)).should.equal(true);
      });

      it('parses to a non-empty array of rows via the committed bundle', () => {
        const dir = FIXTURE_DIRS[ex.fixtureDir];
        const raw = JSON.parse(readFileSync(join(dir, ex.fixture), 'utf8'));
        let rows;
        if (ex.family === 'espn') {
          rows = bundle.parseEndpoint('espn', ex.key, raw);
        } else if (ex.family === 'flat') {
          rows = bundle.parseEndpoint('flat', ex.parser, raw);
        } else if (ex.family === 'espn-summary') {
          const dict = bundle.parseEndpoint('espn', 'summary', raw);
          dict.should.be.an.Object();
          dict.should.have.property(ex.section);
          rows = dict[ex.section];
        } else {
          throw new Error(`unknown family "${ex.family}"`);
        }
        rows.should.be.an.Array();
        rows.length.should.be.above(0);
      });

      it('has matching inject markers in its target guide', () => {
        const doc = readFileSync(pageOf(ex), 'utf8');
        const open = `<!-- inject:example:${ex.id} -->`;
        const close = '<!-- /inject -->';
        const start = doc.indexOf(open);
        start.should.be.above(-1);
        doc.indexOf(close, start).should.be.above(start);
      });
    });
  }
});
