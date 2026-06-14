import should from 'should';
import sdv, { LEAGUES, WRAPPERS } from '../dist/index.js';
// deep imports (not public API) — exercise request building + hosts w/o network
import { resolveRequest } from '../dist/core/espn.js';
import { HOSTS } from '../dist/core/client.js';

// Exhaustive, no-network contract tests for the full generated ESPN surface:
// every wrapper, on every league it applies to, is exposed under both names and
// builds a well-formed ESPN URL. ~819 wrappers across 29 leagues.

const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());
const FAMILIES = new Set(['site_v2', 'site_v2_alt', 'web_v3', 'core_v2']);
const SCOPES = new Set(['universal', 'ncaa', 'football', 'mlb']);

/** Wrappers applicable to a league = those whose scope is in the league's scopes. */
function applicable(league) {
  const scopes = new Set(league.scopes);
  return WRAPPERS.filter((w) => scopes.has(w.scope));
}

/** Fill every path param that has no other resolution source, so URLs fully resolve. */
function minimalParams(league, def) {
  const params = {};
  if (league.leagueParam) params.league = league.league;
  for (const p of def.pathParams || []) {
    if (p.default === undefined && p.defaultFrom === undefined) params[p.name] = 12345;
  }
  return params;
}

describe('ESPN wrapper metadata invariants', () => {
  it('exposes a non-trivial, unique wrapper table', () => {
    WRAPPERS.length.should.be.above(100);
    const shorts = WRAPPERS.map((w) => w.short);
    new Set(shorts).size.should.equal(shorts.length, 'duplicate wrapper short names');
  });

  it('every wrapper has a valid family, scope, and sport-templated absolute path', () => {
    for (const w of WRAPPERS) {
      FAMILIES.has(w.family).should.be.true(`bad family on ${w.short}: ${w.family}`);
      SCOPES.has(w.scope).should.be.true(`bad scope on ${w.short}: ${w.scope}`);
      w.path.startsWith('/').should.be.true(`path not absolute on ${w.short}: ${w.path}`);
      w.path.includes('{sport}').should.be.true(`path lacks {sport} on ${w.short}`);
      Array.isArray(w.pathParams).should.be.true(`pathParams not an array on ${w.short}`);
      Array.isArray(w.queryParams).should.be.true(`queryParams not an array on ${w.short}`);
    }
  });

  it('HOSTS provides an https base for every family in use', () => {
    for (const fam of new Set(WRAPPERS.map((w) => w.family))) {
      (typeof HOSTS[fam]).should.equal('string', `no host for family ${fam}`);
      HOSTS[fam].startsWith('https://').should.be.true(`host not https for ${fam}`);
    }
  });
});

describe('every wrapper is exposed under both names on every applicable league', () => {
  for (const league of LEAGUES) {
    const wrappers = applicable(league);
    it(`${league.prefix}: ${wrappers.length} wrappers present as camelCase + snake (same fn)`, () => {
      const ns = sdv[league.prefix];
      should(ns).be.an.Object();
      for (const w of wrappers) {
        const snake = `espn_${league.prefix}_${w.short}`;
        const camel = toCamel(snake);
        (typeof ns[snake]).should.equal('function', `missing ${snake}`);
        (typeof ns[camel]).should.equal('function', `missing ${camel}`);
        ns[camel].should.equal(ns[snake], `${camel} and ${snake} differ`);
      }
    });
  }
});

describe('every wrapper builds a well-formed ESPN URL (no network)', () => {
  for (const league of LEAGUES) {
    it(`${league.prefix}: all wrappers resolve to a valid URL`, () => {
      for (const w of applicable(league)) {
        const { url } = resolveRequest(w, league, minimalParams(league, w));
        url.should.startWith(HOSTS[w.family], `${w.short}: wrong host`);
        url.should.containEql(`/${league.sport}/`, `${w.short}: missing sport slug`);
        if (!league.leagueParam) {
          url.should.containEql(`/${league.league}`, `${w.short}: missing league slug`);
        }
        url.should.not.match(/[{}]/, `${w.short}: unresolved token in ${url}`);
      }
    });
  }
});

describe('path-param resolution rules', () => {
  it('throws when a required path param is missing', () => {
    const def = WRAPPERS.find((w) =>
      (w.pathParams || []).some(
        (p) => p.required !== false && p.default === undefined && p.defaultFrom === undefined
      )
    );
    should(def).be.ok();
    const league = LEAGUES.find((l) => l.scopes.includes(def.scope));
    const base = league.leagueParam ? { league: league.league } : {};
    (() => resolveRequest(def, league, base)).should.throw(/missing required path parameter/);
  });

  it('honours camelCase aliases for path params', () => {
    const def = WRAPPERS.find(
      (w) => (w.pathParams || []).some((p) => p.name.includes('_'))
    );
    should(def).be.ok();
    const league = LEAGUES.find((l) => l.scopes.includes(def.scope) && !l.leagueParam);
    const snakeKey = def.pathParams.find((p) => p.name.includes('_')).name;
    const a = resolveRequest(def, league, { [snakeKey]: 7 }).url;
    const b = resolveRequest(def, league, { [toCamel(snakeKey)]: 7 }).url;
    a.should.equal(b);
  });

  it('honours camelCase aliases for query params (and maps to the ESPN key)', () => {
    const def = WRAPPERS.find(
      (w) => (w.queryParams || []).some((p) => p.name.includes('_'))
    );
    should(def).be.ok();
    const league = LEAGUES.find((l) => l.scopes.includes(def.scope) && !l.leagueParam);
    const qp = def.queryParams.find((p) => p.name.includes('_'));
    const snakeQuery = resolveRequest(def, league, { [qp.name]: 2 }).query;
    const camelQuery = resolveRequest(def, league, { [toCamel(qp.name)]: 2 }).query;
    JSON.stringify(snakeQuery).should.equal(JSON.stringify(camelQuery));
    // resolved under the ESPN query key, not the call-param name
    snakeQuery[qp.queryKey].should.equal(2);
  });
});
