import React from 'react';
import sources from '@site/src/generated/examples-source.json';

// <OpenInStackBlitz code="…" /> or <OpenInStackBlitz src="examples/02_nba_pbp_shots.mjs" />
//
// Opens a StackBlitz WebContainer (template 'node') in a new tab with the
// snippet as index.mjs, so a reader can `npm install sportsdataverse` and run
// it against the live hosts without cloning anything. `src` names a script
// under examples/ whose source is frozen into examples-source.json by
// tools/docs/examples-source.mjs (`npm run docs:examples`); the project also
// gets examples/_util.mjs and a live stand-in for _offline.mjs (no fixtures in
// the browser, so the script runs live — the SDV_LIVE=1 path).
//
// The SDK is imported on click: it is browser-only and the page must SSR.
// Not for the 9x sdvplot tutorials: they import the unpublished
// @sportsdataverse/* packages, which StackBlitz cannot install.

// TODO(release): pin ^4 once published — npm `latest` is 3.0.0 today, whose
// surface (method names, `parsed`) differs from these v4 snippets.
const PACKAGE_JSON = {
  name: 'sportsdataverse-example',
  private: true,
  type: 'module',
  scripts: { start: 'node index.mjs' },
  dependencies: { sportsdataverse: 'latest' },
};

const README = `# sportsdataverse example

Run it: \`npm start\` (or \`node index.mjs\`). ESPN needs no API key; the
native families that do (The Odds API, PFF, NFL Pro, KenPom) read theirs from
env vars — see https://js.sportsdataverse.org/docs/guides/transport-and-auth.

\`sportsdataverse\` is ESM-only: \`import sdv from 'sportsdataverse'\` (no
\`require\`). Docs: https://js.sportsdataverse.org
`;

// StackBlitz has no committed fixtures: run the example live (SDV_LIVE=1 semantics).
const OFFLINE_STUB = `// Live stand-in for examples/_offline.mjs: StackBlitz has no fixture captures,
// so every request goes to the real host (what SDV_LIVE=1 does in the repo).
export const LIVE = true;
export function setup() {}
`;

export default function OpenInStackBlitz({ code, src, title = 'sportsdataverse example' }) {
  const file = src ? src.replace(/^examples\//, '') : null;
  const snippet = code ?? (file && sources[file]);
  if (!snippet) return null;

  async function open() {
    const sdk = (await import('@stackblitz/sdk')).default;
    const files = {
      'index.mjs': snippet,
      'package.json': `${JSON.stringify(PACKAGE_JSON, null, 2)}\n`,
      'README.md': README,
    };
    if (file) {
      files['_util.mjs'] = sources['_util.mjs'];
      files['_offline.mjs'] = OFFLINE_STUB;
    }
    sdk.openProject({ title, description: 'sportsdataverse (Node.js) example', template: 'node', files }, {
      newWindow: true,
      openFile: 'index.mjs',
    });
  }

  return (
    <p>
      <button type="button" className="button button--primary button--sm" onClick={open}>
        Open in StackBlitz ⚡
      </button>{' '}
      <small>
        Opens a Node sandbox in a new tab with this script as <code>index.mjs</code>; runs live
        (no API key for ESPN).
      </small>
    </p>
  );
}
