import should from 'should';
import { LEAGUES, WRAPPERS } from '../dist/index.js';
import { resolveRequest } from '../dist/core/espn.js';
import { HOSTS } from '../dist/core/client.js';
// the docs playground's standalone runtime (separate port of the resolver + the
// serverless proxy) — tested here so it can't drift from the package.
import { resolveUrl } from '../docs/src/playground/resolve.mjs';
import handler from '../docs/api/run.mjs';

const L = Object.fromEntries(LEAGUES.map((l) => [l.prefix, l]));
const E = Object.fromEntries(WRAPPERS.map((w) => [w.short, w]));

describe('playground resolve.mjs matches the package resolver', () => {
  const cases = [
    ['nba', 'scoreboard', {}],
    ['nba', 'summary', { event_id: 401584793 }],
    ['nfl', 'team_roster', { team_id: 12 }],
    ['nfl', 'team_schedule', { teamId: 12, season: 2024 }],
    ['soccer', 'scoreboard', { league: 'eng.1' }],
    ['cfb', 'rankings', {}],
  ];
  for (const [prefix, short, params] of cases) {
    it(`${prefix}.${short} resolves to an identical URL`, () => {
      const league = L[prefix];
      const def = E[short];
      const pkg = resolveRequest(def, league, params);
      const pkgUrl = new URL(pkg.url);
      // package resolveRequest returns query=undefined when there are no params
      for (const [k, v] of Object.entries(pkg.query || {})) pkgUrl.searchParams.set(k, String(v));
      resolveUrl(def, league, params, HOSTS).should.equal(pkgUrl.toString());
    });
  }
});

function mockRes() {
  const res = { statusCode: null, body: null, headers: {} };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (o) => ((res.body = o), res);
  res.send = (s) => ((res.body = s), res);
  res.setHeader = (k, v) => ((res.headers[k] = v), res);
  return res;
}

describe('playground proxy (run.mjs) validation + allowlist', () => {
  it('rejects non-POST with 405', async () => {
    const res = mockRes();
    await handler({ method: 'GET', query: {} }, res);
    res.statusCode.should.equal(405);
  });

  it('rejects an invalid JSON body with 400', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: '{not json' }, res);
    res.statusCode.should.equal(400);
  });

  it('rejects an unknown league/endpoint with 400', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { league: 'zzz', endpoint: 'nope', params: {} } }, res);
    res.statusCode.should.equal(400);
  });

  it('rejects an out-of-scope endpoint with 400 (nba + rankings)', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { league: 'nba', endpoint: 'rankings', params: {} } }, res);
    res.statusCode.should.equal(400);
  });

  it('proxies an allowed ESPN request to the resolved URL (mocked fetch)', async () => {
    const original = global.fetch;
    let fetched = null;
    global.fetch = async (url) => {
      fetched = url;
      return { ok: true, status: 200, text: async () => JSON.stringify({ leagues: [] }) };
    };
    try {
      const res = mockRes();
      await handler({ method: 'POST', body: { league: 'nba', endpoint: 'scoreboard', params: {} } }, res);
      res.statusCode.should.equal(200);
      should(fetched).be.a.String();
      fetched.should.startWith('https://site.api.espn.com');
      fetched.should.containEql('/basketball/nba/scoreboard');
      JSON.parse(res.body).should.have.property('leagues');
    } finally {
      global.fetch = original;
    }
  });
});
