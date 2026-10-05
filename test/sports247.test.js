import should from 'should';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv, {
  FLAT_WRAPPERS,
  FLAT_HOSTS,
  configure,
  resetConfig,
  sports247ClearTokenCache,
  AssetFetchError,
  TransportUnavailableError,
  createImpersonatingTransport,
} from '../dist/index.js';
import { _impitLoader } from '../dist/core/transport.js';
import { SPORTS247_HEADERS } from '../dist/core/sports247_runtime.js';
import handler from '../docs/api/run.mjs';

// No-network tests for the 247Sports families (sports247 + sports247_site_pages)
// and the deprecation of the old `recruiting` family. The transport is replaced
// per family via configure(), so the guest-JWT mint (GET https://247sports.com/)
// and every data request are answered by a fake that records what was sent.

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (dir, name) => JSON.parse(readFileSync(join(here, 'fixtures', dir, name), 'utf8'));

/** A `header.payload.sig` JWT carrying `exp` (unix seconds). */
const fakeJwt = (exp, tag = 'a') =>
  `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(
    JSON.stringify({ sub: '247sports.com', exp, tag })
  ).toString('base64url')}.sig`;

/**
 * Fake transport: the site root answers with `jwts.shift()` as a JWT cookie;
 * data routes answer `respond(req)` (default 200 + teams capture).
 */
function fakeTransport({ jwts = [], respond } = {}) {
  const calls = [];
  const transport = async (req) => {
    calls.push(req);
    if (req.url === 'https://247sports.com/') {
      const jwt = jwts.shift();
      return {
        status: 200,
        headers: jwt ? { 'set-cookie': `BETAS=x; path=/\nJWT=${jwt}; path=/; secure` } : {},
        data: '<html></html>',
        url: req.url,
      };
    }
    const out = respond ? respond(req, calls) : { status: 200, data: fixture('sports247', 'sports247_teams_football.json') };
    return { headers: {}, url: req.url, ...out };
  };
  return { transport, calls };
}
const mints = (calls) => calls.filter((c) => c.url === 'https://247sports.com/').length;
const dataCalls = (calls) => calls.filter((c) => c.url !== 'https://247sports.com/');
const header = (req, name) =>
  Object.entries(req.headers ?? {}).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];

const later = () => Math.floor(Date.now() / 1000) + 12 * 3600;

/** The messages of the process warnings emitted while `fn` runs. */
async function warningsDuring(fn) {
  const seen = [];
  const onWarning = (w) => seen.push(w.message);
  process.on('warning', onWarning);
  try {
    await fn();
    await new Promise((r) => setImmediate(r)); // 'warning' fires on the next tick
  } finally {
    process.off('warning', onWarning);
  }
  return seen;
}

describe('sports247: surface', () => {
  it('exposes the 12 RDB + 35 site-page wrappers on sdv.sports247 (snake + camel)', () => {
    FLAT_WRAPPERS.filter((w) => w.api === 'sports247').length.should.equal(12);
    FLAT_WRAPPERS.filter((w) => w.api === 'sports247_site_pages').length.should.equal(35);
    Object.keys(sdv.sports247).length.should.equal(94);
    sdv.sports247.sports247Recruits.should.equal(sdv.sports247.sports247_recruits);
    sdv.sports247.sports247SitePagesInstitution.should.equal(sdv.sports247.sports247_site_pages_institution);
    FLAT_HOSTS.sports247.should.equal('https://ipa.247sports.com');
    FLAT_HOSTS.sports247_site_pages.should.equal('https://247sports.com');
  });

  it('does not wrap the 13 logged-in-only RDB routes (as sdv-py)', () => {
    const shorts = new Set(FLAT_WRAPPERS.filter((w) => w.api === 'sports247').map((w) => w.short));
    for (const s of ['biggest_movers', 'archived_player_rankings', 'player_sport_rankings',
      'transfer_player_sport_rankings', 'unranked_recruits', 'unranked_transfers', 'rankings', 'sports',
      'year', 'institution_groups', 'players_under_special_evaluation', 'tags_photos_by_key',
      'tags_photos_by_type']) {
      shorts.has(s).should.be.false(s);
    }
  });
});

describe('sports247: guest JWT + transport (offline)', () => {
  beforeEach(() => {
    resetConfig();
    sports247ClearTokenCache();
  });
  after(() => {
    resetConfig();
    sports247ClearTokenCache();
  });

  it('mints once, sends Bearer + browser headers, adds the RDB trailing slash', async () => {
    const jwt = fakeJwt(later());
    const { transport, calls } = fakeTransport({ jwts: [jwt] });
    configure({ transport: { sports247: transport } });
    const rows = await sdv.sports247.sports247Teams({ parsed: true });
    rows.length.should.be.above(100);
    await sdv.sports247.sports247_coaches({ year: 2026 });
    mints(calls).should.equal(1); // the cached token is reused
    const [teams, coaches] = dataCalls(calls);
    teams.url.should.equal('https://ipa.247sports.com/rdb/v1/teams/');
    teams.query.should.eql({ sportKey: 1 });
    header(teams, 'authorization').should.equal(`Bearer ${jwt}`);
    header(coaches, 'authorization').should.equal(`Bearer ${jwt}`);
    header(teams, 'referer').should.equal('https://247sports.com/');
    header(teams, 'origin').should.equal('https://247sports.com');
    header(teams, 'user-agent').should.equal(SPORTS247_HEADERS['User-Agent']);
  });

  it('the User-Agent is the one the pinned impit profile itself sends (UA agrees with the TLS fingerprint)', async function () {
    try {
      await import('impit');
    } catch {
      this.skip();
    }
    const server = http.createServer((req, res) => res.end(JSON.stringify({ ua: req.headers['user-agent'] })));
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    try {
      // no UA on the request: whatever arrives is impit's own for that profile
      const res = await createImpersonatingTransport({ browser: 'chrome142' })({
        method: 'GET',
        url: `http://127.0.0.1:${server.address().port}/`,
      });
      res.data.ua.should.equal(SPORTS247_HEADERS['User-Agent']);
    } finally {
      server.close();
    }
  });

  it('the guest-JWT mint uses the resolved timeout: 30 s by default, configure({ timeoutMs }) wins', async () => {
    let { transport, calls } = fakeTransport({ jwts: [fakeJwt(later())] });
    configure({ transport: { sports247: transport } });
    await sdv.sports247.sports247Teams();
    calls.find((c) => c.url === 'https://247sports.com/').timeoutMs.should.equal(30000);
    sports247ClearTokenCache();
    ({ transport, calls } = fakeTransport({ jwts: [fakeJwt(later())] }));
    configure({ transport: { sports247: transport }, timeoutMs: 77000 });
    await sdv.sports247.sports247Teams();
    calls.find((c) => c.url === 'https://247sports.com/').timeoutMs.should.equal(77000);
  });

  it('re-mints when the cached token is within a minute of its exp', async () => {
    const soon = Math.floor(Date.now() / 1000) + 30;
    const { transport, calls } = fakeTransport({ jwts: [fakeJwt(soon, 'old'), fakeJwt(later(), 'new')] });
    configure({ transport: { sports247: transport } });
    await sdv.sports247.sports247Teams();
    await sdv.sports247.sports247Teams();
    mints(calls).should.equal(2);
  });

  it('re-mints once on a 401 and retries', async () => {
    const [stale, fresh] = [fakeJwt(later(), 'stale'), fakeJwt(later(), 'fresh')];
    const { transport, calls } = fakeTransport({
      jwts: [stale, fresh],
      respond: (req) =>
        header(req, 'authorization') === `Bearer ${stale}` ? { status: 401, data: '' } : { status: 200, data: [] },
    });
    configure({ transport: { sports247: transport } });
    (await sdv.sports247.sports247Recruits()).should.eql([]);
    mints(calls).should.equal(2);
    dataCalls(calls).map((c) => header(c, 'authorization')).should.eql([`Bearer ${stale}`, `Bearer ${fresh}`]);
  });

  it('a failed mint falls back to no token (sdv-py): a public route still answers; one warning', async () => {
    const seen = [];
    const onWarning = (w) => /guest JWT mint failed/.test(w.message) && seen.push(w.message);
    process.on('warning', onWarning);
    const { transport, calls } = fakeTransport({ jwts: [] }); // root sets no JWT cookie
    configure({ transport: { sports247: transport } });
    try {
      const rows = await sdv.sports247.sports247Teams({ parsed: true });
      rows.length.should.be.above(100);
      await sdv.sports247.sports247Teams(); // mints again (nothing cached), warns no more
      await new Promise((r) => setImmediate(r)); // 'warning' fires on the next tick
    } finally {
      process.off('warning', onWarning);
    }
    dataCalls(calls).length.should.equal(2);
    dataCalls(calls).every((c) => header(c, 'authorization') === undefined).should.be.true();
    seen.length.should.equal(1);
    seen[0].should.match(/no JWT cookie.*continuing without a token/);
  });

  it('a failed mint (network error included) still fails a gated route loudly: 401 -> refresh -> throw', async () => {
    const { transport, calls } = fakeTransport({
      respond: (req) => (header(req, 'authorization') ? { status: 200, data: [] } : { status: 401, data: '' }),
    });
    const offline = async (req) => {
      if (req.url === 'https://247sports.com/') throw new Error('ECONNRESET');
      return transport(req);
    };
    configure({ transport: { sports247: offline } });
    const err = await sdv.sports247.sports247Recruits().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.message.should.match(/guest JWT mint failed .*network/);
    dataCalls(calls).length.should.equal(1); // one unauthenticated try; the refresh mint fails
  });

  it('a failed mint still fails a gated route that answers 403', async () => {
    const { transport, calls } = fakeTransport({ jwts: [], respond: () => ({ status: 403, data: '' }) });
    configure({ transport: { sports247: transport } });
    const err = await sdv.sports247.sports247Coaches().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(403);
    dataCalls(calls).length.should.equal(1);
    should(header(dataCalls(calls)[0], 'authorization')).be.undefined();
  });

  it('a 403 re-mints once and retries with the fresh token (sdv-py: an expired guest token can 403)', async () => {
    const [stale, fresh] = [fakeJwt(later(), 'stale'), fakeJwt(later(), 'fresh')];
    const { transport, calls } = fakeTransport({
      jwts: [stale, fresh],
      respond: (req) =>
        header(req, 'authorization') === `Bearer ${stale}` ? { status: 403, data: '' } : { status: 200, data: [] },
    });
    configure({ transport: { sports247: transport } });
    (await sdv.sports247.sports247Coaches()).should.eql([]);
    mints(calls).should.equal(2);
    dataCalls(calls).map((c) => header(c, 'authorization')).should.eql([`Bearer ${stale}`, `Bearer ${fresh}`]);
  });

  it('a 403 that persists after the re-mint is the answer: one re-mint, two data calls, no status retry', async () => {
    const { transport, calls } = fakeTransport({
      jwts: [fakeJwt(later(), 'a'), fakeJwt(later(), 'b'), fakeJwt(later(), 'c')],
      respond: () => ({ status: 403, data: '' }),
    });
    configure({ transport: { sports247: transport } });
    const err = await sdv.sports247.sports247Coaches().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(403);
    mints(calls).should.equal(2);
    dataCalls(calls).length.should.equal(2);
  });

  it('a caller-supplied Authorization wins (no mint, and no re-mint on its 403)', async () => {
    const { transport, calls } = fakeTransport();
    configure({ transport: { sports247: transport } });
    await sdv.sports247.sports247Teams({ headers: { Authorization: 'Bearer mine' } });
    mints(calls).should.equal(0);
    header(dataCalls(calls)[0], 'authorization').should.equal('Bearer mine');
    const denied = fakeTransport({ jwts: [fakeJwt(later())], respond: () => ({ status: 403, data: '' }) });
    configure({ transport: { sports247: denied.transport } });
    const err = await sdv.sports247.sports247Coaches({ headers: { Authorization: 'Bearer mine' } }).then(() => null, (e) => e);
    err.status.should.equal(403);
    mints(denied.calls).should.equal(0);
    dataCalls(denied.calls).length.should.equal(1);
  });

  it('after a failed mint (tokenless fallback) a caller-supplied Authorization is still sent as-is', async () => {
    const { transport, calls } = fakeTransport({ jwts: [] }); // the root sets no JWT cookie
    configure({ transport: { sports247: transport } });
    await sdv.sports247.sports247Teams(); // mint fails -> tokenless
    await sdv.sports247.sports247Teams({ headers: { Authorization: 'Bearer mine' } });
    const [tokenless, mine] = dataCalls(calls);
    should(header(tokenless, 'authorization')).be.undefined();
    header(mine, 'authorization').should.equal('Bearer mine');
    mints(calls).should.equal(1);
  });

  it('a failed mint is not re-tried for a minute (an outage costs one root GET, not one per call)', async () => {
    const realNow = Date.now;
    let now = realNow();
    Date.now = () => now;
    try {
      const { transport, calls } = fakeTransport({ jwts: [] });
      configure({ transport: { sports247: transport } });
      for (let i = 0; i < 3; i++) await sdv.sports247.sports247Teams();
      mints(calls).should.equal(1);
      dataCalls(calls).length.should.equal(3);
      now += 61_000; // cooldown over: the next call mints again
      await sdv.sports247.sports247Teams();
      mints(calls).should.equal(2);
    } finally {
      Date.now = realNow;
    }
  });

  it('sports247ClearTokenCache resets the failure state: the next failed mint warns again', async () => {
    const seen = await warningsDuring(async () => {
      for (let round = 0; round < 2; round++) {
        sports247ClearTokenCache();
        const { transport } = fakeTransport({ jwts: [] });
        configure({ transport: { sports247: transport } });
        await sdv.sports247.sports247Teams();
      }
    });
    seen.filter((m) => /guest JWT mint failed/.test(m)).length.should.equal(2);
  });

  it('site pages: no auth, no mint, URL sent verbatim', async () => {
    const { transport, calls } = fakeTransport({
      respond: () => ({ status: 200, data: fixture('sports247_site_pages', 'institution.json') }),
    });
    configure({ transport: { sports247_site_pages: transport } });
    const rows = await sdv.sports247.sports247SitePagesInstitution({ key: 24099, parsed: true });
    rows.length.should.equal(1);
    mints(calls).should.equal(0);
    calls[0].url.should.equal('https://247sports.com/Institution/24099.json');
    should(header(calls[0], 'authorization')).be.undefined();
    header(calls[0], 'user-agent').should.equal(SPORTS247_HEADERS['User-Agent']);
  });

  it('without `impit`, the default transport rejects with TransportUnavailableError', async () => {
    const realLoad = _impitLoader.load;
    _impitLoader.load = async () => {
      throw new Error("Cannot find package 'impit'");
    };
    try {
      for (const call of [() => sdv.sports247.sports247Teams(), () => sdv.sports247.sports247SitePagesInstitution({ key: 1 })]) {
        const err = await call().then(() => null, (e) => e);
        err.should.be.instanceOf(TransportUnavailableError);
        err.message.should.match(/npm install impit/);
      }
    } finally {
      _impitLoader.load = realLoad;
    }
  });
});

describe('recruiting (api.247sports.com): deprecated', () => {
  const recruiting = FLAT_WRAPPERS.filter((w) => w.api === 'recruiting');
  const sports247 = new Set(FLAT_WRAPPERS.filter((w) => w.api === 'sports247').map((w) => `sports247_${w.short}`));

  it('every method is deprecated; 12 name an existing sports247 replacement, 13 have none', () => {
    recruiting.length.should.equal(25);
    recruiting.every((w) => typeof w.deprecated === 'string').should.be.true();
    const named = recruiting.map((w) => /sdv\.sports247\.(sports247_\w+)\(\)/.exec(w.deprecated)?.[1]).filter(Boolean);
    named.length.should.equal(12);
    named.every((n) => sports247.has(n)).should.be.true();
    recruiting.filter((w) => /no sports247 equivalent/.test(w.deprecated)).length.should.equal(13);
    // fox: the 5 dead routes sdv-py dropped (test/parsers/fox_bifrost.test.js)
    FLAT_WRAPPERS.filter((w) => !['recruiting', 'fox'].includes(w.api) && w.deprecated).should.eql([]);
  });

  it('emits one DeprecationWarning per method, then still calls through', async () => {
    const seen = [];
    const onWarning = (w) => w.name === 'DeprecationWarning' && seen.push(w.message);
    process.on('warning', onWarning);
    let fetched = 0;
    configure({
      transport: {
        recruiting: async (req) => (fetched++, { status: 200, headers: {}, data: [{ teamId: 1 }], url: req.url }),
      },
    });
    try {
      await sdv.recruiting.recruitingTeams();
      await sdv.recruiting.recruiting_teams();
      await sdv.recruiting.recruitingCoaches();
      await new Promise((r) => setImmediate(r)); // 'warning' is emitted on the next tick
    } finally {
      process.off('warning', onWarning);
      resetConfig();
    }
    fetched.should.equal(3);
    seen.length.should.equal(2);
    seen[0].should.match(/^recruiting_teams\(\) is deprecated: use sdv\.sports247\.sports247_teams\(\)/);
    seen[1].should.match(/^recruiting_coaches\(\) is deprecated/);
  });
});

describe('sports247: kept off the docs playground', () => {
  const endpoints = JSON.parse(readFileSync(join(here, '..', 'docs', 'src', 'playground', 'endpoints.json'), 'utf8'));

  it('is absent from the playground metadata (so off the proxy allowlist)', () => {
    should(endpoints.flatHosts.sports247).be.undefined();
    should(endpoints.flatHosts.sports247_site_pages).be.undefined();
    Object.values(endpoints.flatHosts).some((u) => /247sports\.com$/.test(new URL(u).host) && !u.includes('api.247sports'))
      .should.be.false();
    endpoints.flatApis.filter((e) => e.api.startsWith('sports247')).should.eql([]);
    Object.keys(endpoints.flatLeagues).some((k) => k.startsWith('sports247')).should.be.false();
  });

  it('the proxy rejects a sports247 request', async () => {
    const res = { statusCode: null, body: null, headers: {} };
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => ((res.body = o), res);
    res.send = (s) => ((res.body = s), res);
    res.setHeader = (k, v) => ((res.headers[k] = v), res);
    await handler({ method: 'POST', body: { api: 'sports247', endpoint: 'teams', params: {} } }, res);
    res.statusCode.should.equal(400);
  });
});
