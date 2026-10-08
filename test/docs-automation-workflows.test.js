import 'should';
import { readFileSync } from 'node:fs';

// The automation tutorials show their GitHub Actions workflow in full. The injector freezes a
// script's source into its page, but not YAML, so this keeps each page's
// ```yaml title="examples/workflows/<f>.yml" block byte-equal to the template file.

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

for (const [page, workflow] of [
  ['docs/docs/tutorials/sdvplot-scores-card.mdx', 'examples/workflows/scores-card.yml'],
  ['docs/docs/tutorials/sdvplot-rankings-ladder.mdx', 'examples/workflows/rankings-ladder.yml'],
]) {
  describe(`${page} shows ${workflow}`, () => {
    it('as a yaml block identical to the file', () => {
      const fence = '```';
      const m = read(page).match(new RegExp(`${fence}yaml title="${workflow}"\\n([\\s\\S]*?)${fence}\\n`));
      (m !== null).should.be.true(`no \`\`\`yaml title="${workflow}" block in ${page}`);
      m[1].should.equal(read(workflow));
    });
  });
}
