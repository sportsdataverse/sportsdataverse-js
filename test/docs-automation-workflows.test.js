import 'should';
import { readFileSync } from 'node:fs';

// The automation tutorials show their GitHub Actions workflow in full. The injector freezes a
// script's source into its page, but not YAML, so this keeps each page's
// ```yaml title="examples/workflows/<f>.yml" block byte-equal to the template file.

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FENCE = '```';

for (const [page, workflow] of [
  ['docs/docs/tutorials/sdvplot-scores-card.mdx', 'examples/workflows/scores-card.yml'],
  ['docs/docs/tutorials/sdvplot-rankings-ladder.mdx', 'examples/workflows/rankings-ladder.yml'],
]) {
  describe(`${page} shows ${workflow}`, () => {
    it('as a yaml block identical to the file', () => {
      const text = read(page);
      const open = `${FENCE}yaml title="${workflow}"\n`; // matched literally (indexOf), not as a RegExp
      const start = text.indexOf(open);
      start.should.not.equal(-1, `no ${open.trim()} block in ${page}`);
      const body = text.slice(start + open.length, text.indexOf(`${FENCE}\n`, start + open.length));
      body.should.equal(read(workflow));
    });
  });
}
