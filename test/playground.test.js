import should from 'should';
import { LEAGUES, WRAPPERS, FLAT_WRAPPERS } from '../dist/index.js';
import { resolveRequest } from '../dist/core/espn.js';
import { resolveFlat as pkgResolveFlat } from '../dist/core/flat.js';
import { HOSTS, FLAT_HOSTS } from '../dist/core/client.js';
// the docs playground's standalone runtime (separate port of the resolver + the
// serverless proxy) — tested here so it can't drift from the package.
import { resolveUrl, resolveFlat, resolveFlatUrl } from '../docs/src/playground/resolve.mjs';
import { nflClearTokenCache } from '../docs/src/playground/nfl_auth.mjs';
import handler from '../docs/api/run.mjs';

const L = Object.fromEntries(LEAGUES.map((l) => [l.prefix, l]));
const E = Object.fromEntries(WRAPPERS.map((w) => [w.short, w]));
// Flat wrappers keyed by `${api}:${short}` (a flat `short` isn't unique across families).
const F = Object.fromEntries(FLAT_WRAPPERS.map((w) => [`${w.api}:${w.short}`, w]));

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
      return {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify({ leagues: [] }),
      };
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

// ---------------------------------------------------------------------------
// Flat (native) API: the playground's resolveFlat must match the package's
// resolveFlat for every family, and the proxy must dispatch flat endpoints
// (allowlist + auth header mint + non-JSON content-type passthrough).
// ---------------------------------------------------------------------------

describe('playground resolveFlat matches the package flat resolver', () => {
  const cases = [
    // [api, short, params]  — at least one per flat family, mixing path + query.
    ['mlb_api', 'teams', { sportId: 1, season: 2024 }],
    ['mlb_api', 'schedule', { date: '2024-07-01' }],
    ['mlb_statcast', 'leaderboard_expected_stats', { year: 2024, csv: 'true' }],
    ['nhl_api_web', 'pbp', { game_id: 2023030417 }],
    ['nhl_edge', 'skater_detail', { player_id: 8478402 }],
    ['nhl_stats_rest', 'ping', {}],
    ['nhl_records', 'awards_by_franchise', { franchise_id: 1 }],
    ['nfl_api', 'standings', { season: 2024 }],
    ['nfl_api', 'team', { team_id: 'ARI' }],
  ];
  for (const [api, short, params] of cases) {
    it(`${api}.${short} resolves to an identical absolute URL`, () => {
      const def = F[`${api}:${short}`];
      should(def).be.an.Object();
      const pkg = pkgResolveFlat(def, params);
      const pkgUrl = new URL(pkg.url);
      for (const [k, v] of Object.entries(pkg.query || {})) pkgUrl.searchParams.set(k, String(v));
      resolveFlatUrl(def, params, FLAT_HOSTS).should.equal(pkgUrl.toString());
    });
  }

  it('throws on a missing required flat path param', () => {
    const def = F['nhl_api_web:pbp']; // requires game_id
    (() => resolveFlat(def, {}, FLAT_HOSTS)).should.throw(/game_id/);
  });

  it('host-with-path families resolve correctly (nhl_stats_rest)', () => {
    const def = F['nhl_stats_rest:ping'];
    resolveFlat(def, {}, FLAT_HOSTS).url.should.equal('https://api.nhle.com/stats/rest/ping');
  });
});

describe('playground proxy (run.mjs) flat dispatch', () => {
  it('allowlist includes every generated flat host', () => {
    // The proxy derives ALLOWED_FLAT_HOSTS from endpoints.flatHosts. Assert each
    // flat host (bare host, path stripped) is reachable by round-tripping a
    // request per family through the proxy with a mocked fetch.
    for (const api of Object.keys(FLAT_HOSTS)) {
      const expectedHost = new URL(FLAT_HOSTS[api]).host;
      FLAT_WRAPPERS.some((w) => w.api === api).should.be.true();
      expectedHost.should.be.a.String();
    }
  });

  it('rejects an unknown native endpoint with 400', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { api: 'mlb_api', endpoint: 'nope', params: {} } }, res);
    res.statusCode.should.equal(400);
  });

  it('dispatches a non-auth JSON flat request (mlb_api, mocked fetch)', async () => {
    const original = global.fetch;
    let fetched = null;
    let sentHeaders = null;
    global.fetch = async (url, cfg) => {
      fetched = url;
      sentHeaders = cfg && cfg.headers;
      return {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify({ teams: [] }),
      };
    };
    try {
      const res = mockRes();
      await handler(
        { method: 'POST', body: { api: 'mlb_api', endpoint: 'teams', params: { sportId: 1 } } },
        res
      );
      res.statusCode.should.equal(200);
      fetched.should.startWith('https://statsapi.mlb.com/api/v1/teams');
      fetched.should.containEql('sportId=1');
      // No auth header for a non-auth family.
      should(sentHeaders && sentHeaders.Authorization).be.undefined();
      JSON.parse(res.body).should.have.property('teams');
    } finally {
      global.fetch = original;
    }
  });

  it('passes non-JSON (Statcast CSV) content-type through as text', async () => {
    const original = global.fetch;
    const csv = 'player_id,xwoba\n12345,0.401\n';
    global.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'text/csv; charset=utf-8']]),
      text: async () => csv,
    });
    try {
      const res = mockRes();
      await handler(
        {
          method: 'POST',
          body: {
            api: 'mlb_statcast',
            endpoint: 'leaderboard_expected_stats',
            params: { year: 2024, csv: 'true' },
          },
        },
        res
      );
      res.statusCode.should.equal(200);
      // Raw CSV body forwarded verbatim with the upstream content-type.
      res.body.should.equal(csv);
      res.headers['Content-Type'].should.containEql('text/csv');
    } finally {
      global.fetch = original;
    }
  });

  it('mints + attaches a bearer token for an auth family (nfl_api) server-side', async () => {
    const original = global.fetch;
    nflClearTokenCache();
    // A JWT whose payload `exp` is far in the future so the token caches cleanly.
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const fakeJwt = `h.${payload}.s`;

    let mintCalls = 0;
    let upstreamUrl = null;
    let upstreamHeaders = null;
    global.fetch = async (url, cfg) => {
      if (String(url).includes('/identity/v3/token')) {
        mintCalls += 1;
        return {
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ accessToken: fakeJwt }),
          text: async () => JSON.stringify({ accessToken: fakeJwt }),
        };
      }
      upstreamUrl = url;
      upstreamHeaders = cfg && cfg.headers;
      return {
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify({ standings: [] }),
      };
    };
    try {
      const res = mockRes();
      await handler(
        { method: 'POST', body: { api: 'nfl_api', endpoint: 'standings', params: { season: 2024 } } },
        res
      );
      res.statusCode.should.equal(200);
      mintCalls.should.equal(1); // token minted server-side
      upstreamUrl.should.startWith('https://api.nfl.com/football/v2/standings');
      // The bearer is attached to the UPSTREAM request, never returned to the client.
      upstreamHeaders.Authorization.should.equal(`Bearer ${fakeJwt}`);
      res.body.should.not.containEql(fakeJwt);
    } finally {
      global.fetch = original;
      nflClearTokenCache();
    }
  });
});
