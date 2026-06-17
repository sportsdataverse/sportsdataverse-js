import should from 'should';
import sdv, { FLAT_WRAPPERS } from '../dist/index.js';
// deep import (not public API) — exercise flat request building w/o network
import { resolveFlat } from '../dist/core/flat.js';
import { FLAT_HOSTS } from '../dist/core/client.js';

// No-network contract tests for the flat-API (non-ESPN) surface. Mirrors
// espn-contract.test.js but for the absolute-host MLB Stats API slice: every
// flat wrapper is exposed under both names on its target namespace and builds a
// valid absolute https URL with no unresolved {tokens}.

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

// api stem -> sdv namespace prefix (mirrors index.ts FLAT_API_NAMESPACES)
const FLAT_API_NAMESPACES = { mlb_api: 'mlb' };

/** Fill every required path param so the URL fully resolves. */
function minimalParams(def) {
  const params = {};
  for (const p of def.pathParams || []) {
    if (p.required !== false && p.default === undefined) params[p.name] = 12345;
  }
  return params;
}

describe('flat-API wrapper metadata invariants', () => {
  it('exposes a non-empty, flagged flat wrapper table', () => {
    FLAT_WRAPPERS.length.should.be.above(0);
    for (const w of FLAT_WRAPPERS) {
      w.flat.should.be.true(`flat flag missing on ${w.short}`);
      (typeof w.api).should.equal('string', `api stem missing on ${w.short}`);
      w.host.startsWith('https://').should.be.true(`host not https on ${w.short}`);
      w.path.startsWith('/').should.be.true(`path not absolute on ${w.short}: ${w.path}`);
      Array.isArray(w.pathParams).should.be.true(`pathParams not an array on ${w.short}`);
      Array.isArray(w.queryParams).should.be.true(`queryParams not an array on ${w.short}`);
    }
  });

  it('FLAT_HOSTS provides an https base for every api family in use', () => {
    for (const api of new Set(FLAT_WRAPPERS.map((w) => w.api))) {
      (typeof FLAT_HOSTS[api]).should.equal('string', `no FLAT_HOSTS entry for ${api}`);
      FLAT_HOSTS[api].startsWith('https://').should.be.true(`host not https for ${api}`);
    }
  });

  it('includes the proof-slice mlb_api teams + schedule endpoints', () => {
    const shorts = FLAT_WRAPPERS.filter((w) => w.api === 'mlb_api').map((w) => w.short);
    shorts.should.containEql('teams');
    shorts.should.containEql('schedule');
  });
});

describe('every flat wrapper is exposed under both names on sdv.mlb', () => {
  for (const def of FLAT_WRAPPERS) {
    const prefix = FLAT_API_NAMESPACES[def.api] ?? def.api;
    it(`${def.api}_${def.short} present as snake + camelCase (same fn) on sdv.${prefix}`, () => {
      const ns = sdv[prefix];
      should(ns).be.an.Object();
      const snake = `${def.api}_${def.short}`;
      const camel = toCamel(snake);
      (typeof ns[snake]).should.equal('function', `missing ${snake}`);
      (typeof ns[camel]).should.equal('function', `missing ${camel}`);
      ns[camel].should.equal(ns[snake], `${camel} and ${snake} differ`);
    });
  }

  it('flat wrappers coexist with the legacy + ESPN MLB surface (no clobbering)', () => {
    (typeof sdv.mlb.getPlayByPlay).should.equal('function'); // legacy
    (typeof sdv.mlb.espnMlbScoreboard).should.equal('function'); // ESPN
    (typeof sdv.mlb.mlbApiTeams).should.equal('function'); // flat
  });
});

describe('every flat wrapper builds a well-formed absolute URL (no network)', () => {
  for (const def of FLAT_WRAPPERS) {
    it(`${def.api}_${def.short} resolves to a valid ${def.host} URL`, () => {
      const { url, query } = resolveFlat(def, minimalParams(def));
      url.should.startWith(def.host, `${def.short}: wrong host`);
      url.should.startWith('https://', `${def.short}: not https`);
      url.should.not.match(/[{}]/, `${def.short}: unresolved token in ${url}`);
      should(query).be.an.Object();
    });
  }

  it('mlb_api teams resolves to https://statsapi.mlb.com/api/v1/teams with default sportId', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'mlb_api' && w.short === 'teams');
    should(def).be.ok();
    const { url, query } = resolveFlat(def, {});
    url.should.equal('https://statsapi.mlb.com/api/v1/teams');
    query.sportId.should.equal(1); // default applied
  });

  it('honours camelCase + snake_case aliases for query params (mapped to the API key)', () => {
    const def = FLAT_WRAPPERS.find((w) => w.api === 'mlb_api' && w.short === 'teams');
    const snake = resolveFlat(def, { sport_id: 11 }).query;
    const camel = resolveFlat(def, { sportId: 11 }).query;
    JSON.stringify(snake).should.equal(JSON.stringify(camel));
    snake.sportId.should.equal(11); // resolved under the API key, not the call-param name
  });
});
