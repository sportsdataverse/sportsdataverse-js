import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { ESPN_ENDPOINT_PARSERS } from '../dist/parsers/espn.js';
import { WRAPPERS } from '../dist/generated/wrappers.js';

// Drift guard: tools/codegen/endpoints/espn_parser_map.yaml is committed metadata
// the codegen reads to render the shared "ESPN parsed returns" doc page (each
// endpoint -> its parser -> that parser's schema). Its source of truth is the
// runtime ESPN_ENDPOINT_PARSERS registry, filtered to the actual ESPN wrapper
// short names (WRAPPERS). This test fails if the committed map drifts from the
// registry — regenerate it if a parser/endpoint is added or removed.
const here = dirname(fileURLToPath(import.meta.url));
const mapFile = join(here, '..', 'tools', 'codegen', 'endpoints', 'espn_parser_map.yaml');

describe('codegen: espn_parser_map.yaml matches the runtime registry', () => {
  const map = parse(readFileSync(mapFile, 'utf8'))?.endpoints || {};
  const wrapShorts = new Set(WRAPPERS.map((w) => w.short));

  it('keys are exactly the wrapper shorts that have a registered parser', () => {
    const expected = [...wrapShorts].filter((s) => ESPN_ENDPOINT_PARSERS[s]).sort();
    Object.keys(map).sort().should.eql(expected);
  });

  it('every value is the registered parser fn name for that short', () => {
    for (const [short, fnName] of Object.entries(map)) {
      should(ESPN_ENDPOINT_PARSERS[short]).be.a.Function();
      ESPN_ENDPOINT_PARSERS[short].name.should.equal(fnName);
    }
  });

  it('every ESPN wrapper short has a parser (ENDPOINT_PARSERS coverage invariant)', () => {
    const missing = [...wrapShorts].filter((s) => !ESPN_ENDPOINT_PARSERS[s]);
    missing.should.eql([]);
  });
});
