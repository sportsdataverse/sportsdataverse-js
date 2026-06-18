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
const GUIDES = join(REPO, 'docs', 'docs', 'guides');

describe('docs output-injector manifest is internally consistent', () => {
  it('has at least one example per supported family', () => {
    const families = new Set(EXAMPLES.map((e) => e.family));
    families.has('espn').should.equal(true);
    families.has('flat').should.equal(true);
    families.has('espn-summary').should.equal(true);
  });

  for (const ex of EXAMPLES) {
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
        const doc = readFileSync(join(GUIDES, ex.target), 'utf8');
        const open = `<!-- inject:example:${ex.id} -->`;
        const close = '<!-- /inject -->';
        const start = doc.indexOf(open);
        start.should.be.above(-1);
        doc.indexOf(close, start).should.be.above(start);
      });
    });
  }
});
