import 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The docs site publishes llms.txt + llms-full.txt + per-page Markdown
// (docusaurus-plugin-llms, postBuild). The site cannot be built on every dev
// box, so this reads the config SOURCE (no build, no require: the config pulls
// in docs-only deps) and pins the parts the published files depend on.

const root = new URL('..', import.meta.url);
const config = readFileSync(fileURLToPath(new URL('docs/docusaurus.config.js', root)), 'utf8');
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('docs/package.json', root)), 'utf8'));

describe('docs: llms.txt plugin is configured', () => {
  it('docusaurus-plugin-llms is a docs dependency', () => {
    pkg.dependencies.should.have.property('docusaurus-plugin-llms');
  });

  it('is registered with llms.txt + llms-full.txt + per-page markdown on', () => {
    const block = config.slice(config.indexOf("'docusaurus-plugin-llms'"));
    block.should.not.equal(''); // the plugin is in the config
    for (const opt of ['generateLLMsTxt: true', 'generateLLMsFullTxt: true', 'generateMarkdownFiles: true']) {
      block.slice(0, block.indexOf('themeConfig')).should.containEql(opt);
    }
  });

  it('names the package and the sources covered, and leaves the TypeDoc tree out', () => {
    const block = config.slice(config.indexOf("'docusaurus-plugin-llms'"), config.indexOf('themeConfig'));
    block.should.match(/title:\s*'sportsdataverse/);
    for (const source of ['ESPN', 'MLB Stats API', 'NHL', 'NFL.com', 'HockeyTech', 'Odds API']) {
      block.should.containEql(source);
    }
    block.should.match(/ignoreFiles:\s*\[\s*'api\/\*\*'/);
    // the dirs PR-B adds are matched by glob so they are picked up when they land
    for (const dir of ['guides/**', 'tutorials/**', 'reference/**', 'utilities/**', 'architecture/**']) {
      block.should.containEql(`'${dir}'`);
    }
  });
});
