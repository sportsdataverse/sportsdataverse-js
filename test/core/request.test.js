import should from 'should';
import http from 'node:http';
import sdv, {
  configure,
  getConfig,
  resetConfig,
  bearerAuth,
  headerAuth,
  queryAuth,
  tokenAuth,
  sessionAuth,
  axiosTransport,
  createImpersonatingTransport,
  SdvError,
  NoDataError,
  NoESPNDataError,
  AssetFetchError,
  SeasonNotFoundError,
  TransportUnavailableError,
  nflClearTokenCache,
} from '../../dist/index.js';
import { request, retryDelayMs, _timer } from '../../dist/core/request.js';
import { registerFamilyDefaults, resolveFamily, DEFAULT_RETRY_STATUSES } from '../../dist/core/config.js';
import { _impitLoader, encodeQuery } from '../../dist/core/transport.js';
import { get } from '../../dist/core/client.js';
import { statcastGet } from '../../dist/core/statcast_runtime.js';
import { torvikGet } from '../../dist/core/torvik_runtime.js';
import { hockeytechGet, resolveSeasonId } from '../../dist/core/hockeytech_runtime.js';

// No-network tests for the runtime core (src/core/{errors,transport,auth,config,request}.ts).
// Every request goes through a fake transport; the backoff sleep is stubbed so
// retry tests record the delays instead of waiting them out.

/**
 * A fake Transport that replays `script` (one entry per call; the last entry
 * repeats). An Error entry rejects (a network failure); an object is the
 * response. Calls are recorded on `.calls`.
 */
function fakeTransport(...script) {
  const calls = [];
  const t = async (req) => {
    calls.push(req);
    const step = script[Math.min(calls.length - 1, script.length - 1)];
    const r = typeof step === 'function' ? step(req) : step;
    if (r instanceof Error) throw r;
    return { headers: {}, data: null, url: req.url, ...r };
  };
  t.calls = calls;
  return t;
}

const GET = (url = 'https://example.test/x') => ({ method: 'GET', url });

let sleeps;

/** Per-describe hooks: clean config + a recording (non-waiting) backoff sleep. */
function isolate() {
  let realSleep;
  beforeEach(() => {
    resetConfig();
    sleeps = [];
    realSleep = _timer.sleep;
    _timer.sleep = async (ms) => {
      sleeps.push(ms);
    };
  });
  afterEach(() => {
    _timer.sleep = realSleep;
    resetConfig();
  });
}

describe('core/errors', () => {
  it('NoDataError and AssetFetchError are siblings under SdvError', () => {
    const nd = new NoDataError('none', { url: 'u', status: 404 });
    const af = new AssetFetchError('failed', { url: 'u', status: 503 });
    nd.should.be.instanceOf(SdvError);
    af.should.be.instanceOf(SdvError);
    (nd instanceof AssetFetchError).should.be.false();
    (af instanceof NoDataError).should.be.false();
    nd.name.should.equal('NoDataError');
    af.status.should.equal(503);
    af.url.should.equal('u');
  });
  it('NoESPNDataError is the same class as NoDataError', () => {
    NoESPNDataError.should.equal(NoDataError);
  });
  it('SeasonNotFoundError / TransportUnavailableError are SdvErrors', () => {
    new SeasonNotFoundError('x').should.be.instanceOf(SdvError);
    new TransportUnavailableError('x').should.be.instanceOf(SdvError);
  });
});

describe('core/request: retry + classification', () => {
  isolate();
  it('retries a 503 three times with growing backoff, then AssetFetchError', async () => {
    const t = fakeTransport({ status: 503 });
    configure({ transport: t });
    const err = await request('mlb', GET()).should.be.rejectedWith(AssetFetchError);
    err.status.should.equal(503);
    t.calls.length.should.equal(4); // 1 attempt + 3 retries (default)
    sleeps.length.should.equal(3);
    // 0.5s * 2^n capped at 4s, jittered to 50-100%.
    sleeps[0].should.be.within(250, 500);
    sleeps[1].should.be.within(500, 1000);
    sleeps[2].should.be.within(1000, 2000);
  });

  it('returns the data once a retried 5xx recovers', async () => {
    const t = fakeTransport({ status: 502 }, { status: 200, data: { ok: true } });
    configure({ transport: t });
    (await request('mlb', GET())).should.eql({ ok: true });
    t.calls.length.should.equal(2);
  });

  it('honours the retries setting', async () => {
    const t = fakeTransport({ status: 500 });
    configure({ transport: t, retries: 1 });
    await request('mlb', GET()).should.be.rejectedWith(AssetFetchError);
    t.calls.length.should.equal(2);
  });

  it('honours Retry-After (seconds and HTTP-date), capped at 120s', async () => {
    const t = fakeTransport(
      { status: 429, headers: { 'retry-after': '7' } },
      { status: 429, headers: { 'retry-after': '9999' } },
      { status: 200, data: 'ok' }
    );
    configure({ transport: t });
    (await request('mlb', GET())).should.equal('ok');
    sleeps.should.eql([7000, 120000]);
    const inTwo = new Date(Date.now() + 2000).toUTCString();
    retryDelayMs(0, inTwo).should.be.within(0, 2000);
  });

  it('404 -> NoDataError after one attempt', async () => {
    const t = fakeTransport({ status: 404 });
    configure({ transport: t });
    const err = await request('mlb', GET()).should.be.rejectedWith(NoDataError);
    err.status.should.equal(404);
    (err instanceof AssetFetchError).should.be.false();
    t.calls.length.should.equal(1);
  });

  it('ESPN 403 (load) is retried, capped at 4 status retries, then AssetFetchError', async () => {
    const t = fakeTransport({ status: 403 });
    configure({ transport: t, retries: 10 });
    const err = await request('core_v2', GET()).should.be.rejectedWith(AssetFetchError);
    err.status.should.equal(403);
    t.calls.length.should.equal(5); // 1 attempt + 4 status retries (the cap), not 1 + 10
    sleeps.length.should.equal(4);
  });

  it('status retries are min(retries, 4): the default budget of 3 gives 4 attempts', async () => {
    const t = fakeTransport({ status: 403 });
    configure({ transport: t });
    await request('site_v2', GET()).should.be.rejectedWith(AssetFetchError);
    t.calls.length.should.equal(4);
  });

  it('a 403 that recovers within the cap returns the data', async () => {
    const t = fakeTransport({ status: 403 }, { status: 403 }, { status: 200, data: 'ok' });
    configure({ transport: t });
    (await request('core_v2', GET())).should.equal('ok');
    t.calls.length.should.equal(3);
  });

  it('408 is retried', async () => {
    const t = fakeTransport({ status: 408 }, { status: 200, data: 'ok' });
    configure({ transport: t });
    (await request('mlb', GET())).should.equal('ok');
    t.calls.length.should.equal(2);
  });

  it('non-listed statuses (400, 501) fail on the first attempt', async () => {
    for (const status of [400, 501]) {
      const t = fakeTransport({ status });
      configure({ transport: t });
      const err = await request('mlb', GET()).should.be.rejectedWith(AssetFetchError);
      err.status.should.equal(status);
      t.calls.length.should.equal(1);
    }
  });

  it('network errors keep the full retry budget (not the status cap)', async () => {
    const t = fakeTransport(new Error('ECONNRESET'));
    configure({ transport: t, retries: 10 });
    await request('core_v2', GET()).should.be.rejectedWith(AssetFetchError);
    t.calls.length.should.equal(11);
  });

  it('a family that opts out via registerFamilyDefaults({ retryStatuses }) never retries 403', async () => {
    registerFamilyDefaults('t2_authd_family', {
      retryStatuses: DEFAULT_RETRY_STATUSES.filter((s) => s !== 403),
    });
    const t = fakeTransport({ status: 403 });
    configure({ transport: t, retries: 10 });
    const err = await request('t2_authd_family', GET()).should.be.rejectedWith(AssetFetchError);
    err.status.should.equal(403);
    t.calls.length.should.equal(1);
    sleeps.length.should.equal(0);
  });

  it('nfl_api 403 -> AssetFetchError after exactly one attempt', async () => {
    nflClearTokenCache();
    const t = fakeTransport((req) =>
      req.method === 'POST' ? { status: 200, data: { accessToken: 'tok' } } : { status: 403 }
    );
    configure({ transport: { nfl_api: t }, retries: 10 });
    const err = await sdv.nfl.nflApiInjuries({}).should.be.rejectedWith(AssetFetchError);
    err.status.should.equal(403);
    t.calls.filter((c) => c.method === 'GET').length.should.equal(1);
    nflClearTokenCache();
  });

  it('DEFAULT_RETRY_STATUSES matches sdv-py _RETRYABLE_STATUS', () => {
    [...DEFAULT_RETRY_STATUSES].sort().should.eql([403, 408, 429, 500, 502, 503, 504]);
  });

  it('ESPN families: a 200 body { code: 404 } -> NoDataError; other families pass it through', async () => {
    const body = { code: 404, message: 'Failed to get events endpoint.' };
    configure({ transport: fakeTransport({ status: 200, data: body }) });
    for (const family of ['site_v2', 'site_v2_alt', 'web_v3', 'core_v2', 'fitt_v3']) {
      await request(family, GET()).should.be.rejectedWith(NoDataError);
    }
    (await request('mlb', GET())).should.eql(body);
  });

  it('network errors are retried, then wrapped in AssetFetchError with the cause', async () => {
    const boom = new Error('ECONNRESET');
    const t = fakeTransport(boom);
    configure({ transport: t });
    const err = await request('mlb', GET()).should.be.rejectedWith(AssetFetchError);
    err.cause.should.equal(boom);
    should(err.status).be.undefined();
    t.calls.length.should.equal(4);
  });

  it('error messages never carry the query string', async () => {
    configure({ transport: fakeTransport({ status: 500 }), retries: 0 });
    const err = await request('odds_api', {
      method: 'GET',
      url: 'https://example.test/odds',
      query: { apiKey: 'SECRET' },
    }).should.be.rejected();
    err.message.should.not.containEql('SECRET');
    err.url.should.equal('https://example.test/odds');
  });

  it('sends the configured timeout + default User-Agent', async () => {
    const t = fakeTransport({ status: 200 });
    configure({ transport: t, timeoutMs: 1234, userAgent: 'ua-test' });
    await request('mlb', GET());
    t.calls[0].timeoutMs.should.equal(1234);
    t.calls[0].headers['User-Agent'].should.equal('ua-test');
  });
});

describe('core/config: per-family transport selection', () => {
  isolate();
  it('level 4: nothing configured or registered -> the built-in axiosTransport', () => {
    resolveFamily('t2_unregistered').transport.should.equal(axiosTransport);
  });

  it('level 3: a user "default" transport applies to a family with no registered default', async () => {
    configure({ transport: { default: fakeTransport({ status: 200, data: 'user-default' }) } });
    (await request('t2_unregistered', GET())).should.equal('user-default');
  });

  it('level 2: a registered family default beats the user "default" (host-required transports survive)', async () => {
    registerFamilyDefaults('t2_test_family', {
      transport: fakeTransport({ status: 200, data: 'family-default' }),
    });
    (await request('t2_test_family', GET())).should.equal('family-default');
    configure({ transport: fakeTransport({ status: 200, data: 'user-default' }) }); // bare = default
    (await request('t2_test_family', GET())).should.equal('family-default');
    (await request('t2_unregistered', GET())).should.equal('user-default');
  });

  it('level 1: a user per-family entry beats the registered family default', async () => {
    configure({ transport: { t2_test_family: fakeTransport({ status: 200, data: 'specific' }) } });
    (await request('t2_test_family', GET())).should.equal('specific');
    resetConfig();
    (await request('t2_test_family', GET())).should.equal('family-default');
    getConfig().transport.should.eql({});
  });

  it('auth: user per-family entry > registered family default; a "default" auth is never applied', async () => {
    const t = fakeTransport({ status: 200 });
    registerFamilyDefaults('t2_auth_family', { auth: headerAuth({ 'X-Who': 'family' }) });
    configure({ transport: t, auth: { default: headerAuth({ 'X-Who': 'user-default' }) } });
    await request('t2_auth_family', GET());
    t.calls[0].headers['X-Who'].should.equal('family');
    await request('t2_unregistered', GET());
    should(t.calls[1].headers['X-Who']).be.undefined();
    configure({ auth: { t2_auth_family: headerAuth({ 'X-Who': 'user' }) } });
    await request('t2_auth_family', GET());
    t.calls[2].headers['X-Who'].should.equal('user');
  });

  it('default User-Agent carries no +http token (ESPN site API 403s on one)', async () => {
    getConfig().userAgent.should.equal('Mozilla/5.0 (compatible; sportsdataverse-js/3.x)');
    getConfig().userAgent.should.not.containEql('+http');
    const t = fakeTransport({ status: 200 });
    configure({ transport: t });
    await request('site_v2', GET());
    t.calls[0].headers['User-Agent'].should.not.containEql('+http');
  });

  it('a bare transport means every family', async () => {
    const t = fakeTransport({ status: 200, data: 1 });
    configure({ transport: t });
    getConfig().transport.default.should.equal(t);
  });
});

describe('core/auth', () => {
  isolate();
  it('bearerAuth / headerAuth / queryAuth decorate the request; caller values win', async () => {
    const t = fakeTransport({ status: 200 });
    configure({
      transport: t,
      auth: {
        a: bearerAuth(async () => 'tok'),
        b: headerAuth({ 'X-Api-Key': 'k' }),
        c: queryAuth({ apiKey: 'q', other: 1 }),
      },
    });
    await request('a', GET());
    t.calls[0].headers.Authorization.should.equal('Bearer tok');
    await request('a', { ...GET(), headers: { authorization: 'Bearer mine' } });
    t.calls[1].headers.authorization.should.equal('Bearer mine');
    should(t.calls[1].headers.Authorization).be.undefined();
    await request('b', GET());
    t.calls[2].headers['X-Api-Key'].should.equal('k');
    await request('c', { ...GET(), query: { apiKey: 'explicit' } });
    t.calls[3].query.should.eql({ apiKey: 'explicit', other: 1 });
    await request('unconfigured', GET());
    should(t.calls[4].headers.Authorization).be.undefined(); // no auth leaks across families
  });

  it('tokenAuth caches, re-mints before expiry, and a 401 refreshes exactly once', async () => {
    let mints = 0;
    let expiresAt = Date.now() / 1000 + 3600;
    const auth = tokenAuth({
      mint: async () => ({ token: `t${++mints}`, expiresAt }),
      skewSeconds: 60,
    });
    const t = fakeTransport((req) =>
      req.headers.Authorization === 'Bearer t1' ? { status: 401 } : { status: 200, data: req.headers.Authorization }
    );
    configure({ transport: t, auth: { fam: auth } });

    // first call: mint t1 -> 401 -> refresh mints t2 -> 200
    (await request('fam', GET())).should.equal('Bearer t2');
    mints.should.equal(2);
    t.calls.length.should.equal(2);
    // cached
    (await request('fam', GET())).should.equal('Bearer t2');
    mints.should.equal(2);
    // inside the skew window -> re-mint
    expiresAt = Date.now() / 1000 + 30;
    await auth.refresh({ family: 'fam', transport: t }); // t3, expiring in 30s
    (await request('fam', GET())).should.equal('Bearer t4');
  });

  it('a persistent 401 refreshes once, then AssetFetchError', async () => {
    let mints = 0;
    const t = fakeTransport({ status: 401 });
    configure({
      transport: t,
      auth: { fam: tokenAuth({ mint: async () => ({ token: `t${++mints}` }) }) },
    });
    const err = await request('fam', GET()).should.be.rejectedWith(AssetFetchError);
    err.status.should.equal(401);
    mints.should.equal(2);
    t.calls.length.should.equal(2);
  });

  it('tokenAuth shares one in-flight mint between concurrent requests', async () => {
    let mints = 0;
    configure({
      transport: fakeTransport({ status: 200 }),
      auth: { fam: tokenAuth({ mint: async () => ({ token: `t${++mints}` }), header: 'X-Token', scheme: '' }) },
    });
    await Promise.all([request('fam', GET()), request('fam', GET()), request('fam', GET())]);
    mints.should.equal(1);
  });

  it('tokenAuth mint receives the family transport', async () => {
    const t = fakeTransport({ status: 200, data: { token: 'minted' } });
    configure({
      transport: { fam: t },
      auth: {
        fam: tokenAuth({
          mint: async (ctx) => {
            ctx.family.should.equal('fam');
            const res = await ctx.transport({ method: 'POST', url: 'https://example.test/token' });
            return { token: res.data.token };
          },
        }),
      },
    });
    await request('fam', GET());
    t.calls[0].method.should.equal('POST');
    t.calls[1].headers.Authorization.should.equal('Bearer minted');
  });

  it('sessionAuth logs in once, attaches cookies + headers, and re-logs-in on 401', async () => {
    let logins = 0;
    const t = fakeTransport((req) =>
      req.headers.Cookie === 'sid=s1' ? { status: 401 } : { status: 200, data: req.headers }
    );
    configure({
      transport: t,
      auth: {
        kp: sessionAuth({
          login: async () => ({ cookies: { sid: `s${++logins}` }, headers: { 'X-Csrf': 'c' } }),
        }),
      },
    });
    const h = await request('kp', GET());
    h.Cookie.should.equal('sid=s2');
    h['X-Csrf'].should.equal('c');
    logins.should.equal(2);
    await request('kp', GET());
    logins.should.equal(2);
  });
});

describe('core/auth: failures and empty credentials', () => {
  isolate();

  it('a throwing login is called exactly once, not retried, and the error names the auth step', async () => {
    let logins = 0;
    const t = fakeTransport({ status: 200 });
    configure({
      transport: t,
      retries: 5,
      auth: { kp: sessionAuth({ login: async () => { logins += 1; throw new Error('bad password'); } }) },
    });
    const err = await request('kp', GET()).should.be.rejectedWith(AssetFetchError);
    err.message.should.equal('kp: auth failed (apply)');
    err.cause.message.should.equal('bad password');
    logins.should.equal(1);
    t.calls.length.should.equal(0); // the data URL was never requested
    sleeps.length.should.equal(0);
  });

  it('a throwing refresh is reported the same way (auth failed (refresh))', async () => {
    let logins = 0;
    configure({
      transport: fakeTransport({ status: 401 }),
      auth: {
        kp: sessionAuth({
          login: async () => {
            logins += 1;
            if (logins > 1) throw new Error('locked out');
            return { cookies: { sid: 's1' } };
          },
        }),
      },
    });
    const err = await request('kp', GET()).should.be.rejectedWith(AssetFetchError);
    err.message.should.equal('kp: auth failed (refresh)');
    err.status.should.equal(401);
    logins.should.equal(2);
  });

  it('an SdvError thrown by mint passes through unchanged (no retry)', async () => {
    const own = new SeasonNotFoundError('not entitled');
    let mints = 0;
    configure({
      transport: fakeTransport({ status: 200 }),
      retries: 5,
      auth: { fam: tokenAuth({ mint: async () => { mints += 1; throw own; } }) },
    });
    (await request('fam', GET()).should.be.rejected()).should.equal(own);
    mints.should.equal(1);
  });

  it('bearerAuth with an empty / undefined token throws an SdvError naming the family; nothing is sent', async () => {
    for (const token of [() => undefined, async () => '', '', undefined]) {
      const t = fakeTransport({ status: 200 });
      configure({ transport: t, auth: { recruiting: bearerAuth(token) } });
      const err = await request('recruiting', GET()).should.be.rejectedWith(SdvError);
      (err instanceof AssetFetchError).should.be.false();
      err.message.should.startWith('recruiting: no credential');
      t.calls.length.should.equal(0);
    }
  });

  it('tokenAuth mint returning an empty token throws an SdvError naming the family', async () => {
    const t = fakeTransport({ status: 200 });
    configure({ transport: t, auth: { fam: tokenAuth({ mint: async () => ({ token: '' }) }) } });
    (await request('fam', GET()).should.be.rejectedWith(SdvError)).message.should.startWith('fam: no credential');
    t.calls.length.should.equal(0);
  });

  it('headerAuth / queryAuth drop undefined and empty values', async () => {
    const t = fakeTransport({ status: 200 });
    configure({
      transport: t,
      auth: {
        h: headerAuth({ 'X-Unset': undefined, 'X-Empty': '', 'X-Ok': 'v' }),
        q: queryAuth({ unset: undefined, empty: '', ok: 'v' }),
      },
    });
    await request('h', GET());
    should(t.calls[0].headers['X-Unset']).be.undefined();
    should(t.calls[0].headers['X-Empty']).be.undefined();
    t.calls[0].headers['X-Ok'].should.equal('v');
    await request('q', GET());
    t.calls[1].query.should.eql({ ok: 'v' });
  });

  it('get() requires a family (SdvError, nothing sent)', async () => {
    const t = fakeTransport({ status: 200 });
    configure({ transport: t });
    (await get('https://example.test/x').should.be.rejectedWith(SdvError)).message.should.containEql(
      'a family is required'
    );
    await get('https://example.test/x', {}).should.be.rejectedWith(SdvError);
    t.calls.length.should.equal(0);
    await get('https://example.test/x', { family: 'mlb' });
    t.calls.length.should.equal(1);
  });
});

describe('core/transport', () => {
  isolate();
  let server;
  let base;
  before(async () => {
    server = http.createServer((req, res) => {
      if (req.url.startsWith('/fail')) {
        res.writeHead(500, { 'content-type': 'text/plain' });
        res.end('nope');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': ['a=1; Path=/', 'b=2; Path=/'] });
      res.end(JSON.stringify({ path: req.url, ua: req.headers['user-agent'] }));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  it('axiosTransport resolves (never throws) on a non-2xx status', async () => {
    const res = await axiosTransport({ method: 'GET', url: `${base}/fail`, responseType: 'text' });
    res.status.should.equal(500);
    res.data.should.equal('nope');
  });

  it('axiosTransport lower-cases headers and joins set-cookie with newlines', async () => {
    const res = await axiosTransport({ method: 'GET', url: `${base}/ok`, query: { a: 1 } });
    res.status.should.equal(200);
    res.data.path.should.equal('/ok?a=1');
    res.headers['set-cookie'].should.equal('a=1; Path=/\nb=2; Path=/');
  });

  it('missing impersonation dependency -> TransportUnavailableError naming the install command', async () => {
    const real = _impitLoader.load;
    _impitLoader.load = async () => {
      throw new Error("Cannot find package 'impit'");
    };
    try {
      configure({ transport: { nba_stats: createImpersonatingTransport() } });
      const err = await request('nba_stats', GET()).should.be.rejectedWith(TransportUnavailableError);
      err.message.should.containEql('npm install impit');
      sleeps.length.should.equal(0); // not retried
    } finally {
      _impitLoader.load = real;
    }
  });

  it('createImpersonatingTransport drives the real impit client (local server)', async function () {
    let impitAvailable = true;
    try {
      await import('impit');
    } catch {
      impitAvailable = false;
    }
    if (!impitAvailable) this.skip();
    const t = createImpersonatingTransport({ browser: 'chrome' });
    const res = await t({ method: 'GET', url: `${base}/imp`, query: { q: 'x' } });
    res.status.should.equal(200);
    res.data.path.should.equal('/imp?q=x');
    res.data.ua.should.match(/Chrome/);
    res.headers['set-cookie'].split('\n').length.should.equal(2);
    const fail = await t({ method: 'GET', url: `${base}/fail` });
    fail.status.should.equal(500);
    fail.data.should.equal('nope');
  });

  // The pinned TransportRequest.query contract: arrays repeat the key, never k[]=.
  const QUERY = { k: ['a', 'b'], s: 'x y', c: 'a,b', skip: undefined };
  const WIRE = '/q?k=a&k=b&s=x+y&c=a,b';

  it('query contract: axiosTransport sends arrays as repeated keys (k=a&k=b)', async () => {
    const res = await axiosTransport({ method: 'GET', url: `${base}/q`, query: QUERY });
    res.data.path.should.equal(WIRE);
  });

  it('query contract: the impersonating transport sends the identical wire form', async function () {
    try {
      await import('impit');
    } catch {
      this.skip();
    }
    const res = await createImpersonatingTransport()({ method: 'GET', url: `${base}/q`, query: QUERY });
    res.data.path.should.equal(WIRE);
  });

  it('encodeQuery keeps axios scalar encoding and drops undefined / null', () => {
    encodeQuery({ a: 1, b: null, c: undefined, d: 'x:y$z', e: ['1', null, '2'] }).should.equal(
      'a=1&d=x:y$z&e=1&e=2'
    );
  });

  it('a throwing impit constructor -> SdvError (not retried), and the failure is not cached', async () => {
    const real = _impitLoader.load;
    let constructed = 0;
    class FakeImpit {
      constructor() {
        constructed += 1;
        if (constructed === 1) throw new Error('bad browser profile');
      }
      async fetch(url) {
        return {
          status: 200,
          url,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => '{"ok":true}',
          arrayBuffer: async () => new ArrayBuffer(0),
        };
      }
    }
    _impitLoader.load = async () => ({ Impit: FakeImpit });
    try {
      configure({ transport: { nba_stats: createImpersonatingTransport({ browser: 'nope' }) } });
      const err = await request('nba_stats', GET()).should.be.rejectedWith(SdvError);
      err.message.should.containEql('could not create an impit client');
      (err instanceof AssetFetchError).should.be.false();
      sleeps.length.should.equal(0); // not retried as a network error
      constructed.should.equal(1);
      (await request('nba_stats', GET())).should.eql({ ok: true }); // re-created, not replayed
      constructed.should.equal(2);
    } finally {
      _impitLoader.load = real;
    }
  });
});

describe('core/request: wrappers route through request()', () => {
  isolate();
  it('ESPN wrapper: family = def.family, { code: 404 } -> NoDataError', async () => {
    const t = fakeTransport({ status: 200, data: { code: 404 } });
    configure({ transport: { site_v2: t } });
    await sdv.nba.espnNbaScoreboard({}).should.be.rejectedWith(NoDataError);
    t.calls[0].url.should.startWith('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/');
  });

  it('flat wrapper: caller headers pass through; 5xx -> AssetFetchError', async () => {
    const t = fakeTransport({ status: 503 });
    configure({ transport: { mlb: t }, retries: 0 });
    await sdv.mlb.mlbTeams({ headers: { 'X-Test': '1' } }).should.be.rejectedWith(AssetFetchError);
    t.calls[0].headers['X-Test'].should.equal('1');
  });

  it('runtimes: statcast content-type branching, torvik UA, hockeytech JSONP + key in query', async () => {
    configure({
      transport: {
        mlb_statcast: fakeTransport(
          { status: 200, headers: { 'content-type': 'application/json' }, data: '{"a":1}' },
          { status: 200, headers: { 'content-type': 'text/csv' }, data: 'a,b\n1,2' }
        ),
        torvik: fakeTransport((req) => ({ status: 200, data: req.headers['User-Agent'] })),
        hockeytech: fakeTransport((req) => ({ status: 200, data: `angular.callbacks._1(${JSON.stringify(req.query)})` })),
      },
    });
    (await statcastGet('https://baseballsavant.mlb.com/gf')).should.eql({ a: 1 });
    (await statcastGet('https://baseballsavant.mlb.com/leaderboard')).should.equal('a,b\n1,2');
    (await torvikGet('https://barttorvik.com/x')).should.match(/^Mozilla\/5\.0 \(sportsdataverse-js/);
    const ht = await hockeytechGet('ignored', { params: { league: 'pwhl', view: 'scorebar' } });
    ht.should.have.property('client_code', 'pwhl');
    ht.should.have.property('key');
  });

  it('hockeytech resolveSeasonId: PWHL keeps its fallback table on a failed fetch; others throw', async () => {
    configure({ transport: { hockeytech: fakeTransport({ status: 503 }) }, retries: 0 });
    (await resolveSeasonId('pwhl', { season: 2025 })).should.equal(5);
    await resolveSeasonId('echl', { season: 2025 }).should.be.rejectedWith(AssetFetchError);
  });

  it('runtimes throw on a failed fetch instead of returning an empty payload', async () => {
    configure({ transport: fakeTransport({ status: 500 }), retries: 0 });
    await statcastGet('https://baseballsavant.mlb.com/gf').should.be.rejectedWith(AssetFetchError);
    await torvikGet('https://barttorvik.com/x').should.be.rejectedWith(AssetFetchError);
    await hockeytechGet('ignored', { params: { league: 'pwhl', view: 'scorebar' } }).should.be.rejectedWith(AssetFetchError);
  });
});

describe('core/nfl_auth: registered nfl_api tokenAuth', () => {
  isolate();
  function fakeJwt(exp) {
    const seg = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    return `${seg({ alg: 'HS256' })}.${seg({ exp })}.sig`;
  }
  beforeEach(() => {
    nflClearTokenCache();
    delete process.env.NFL_ACCESS_TOKEN;
  });
  afterEach(() => {
    nflClearTokenCache();
    delete process.env.NFL_ACCESS_TOKEN;
  });

  it('mints through the nfl_api transport, then sends bearer + browser headers', async () => {
    const token = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
    const t = fakeTransport((req) =>
      req.method === 'POST' ? { status: 200, data: { accessToken: token } } : { status: 200, data: req.headers }
    );
    configure({ transport: { nfl_api: t } });
    const h = await sdv.nfl.nflApiInjuries({});
    t.calls[0].url.should.equal('https://api.nfl.com/identity/v3/token');
    h.Authorization.should.equal(`Bearer ${token}`);
    h['X-Domain-Id'].should.equal('100');
    h['User-Agent'].should.match(/Chrome/); // NFL browser UA beats the sdv default
    await sdv.nfl.nflApiInjuries({});
    t.calls.filter((c) => c.method === 'POST').length.should.equal(1); // cached
  });

  it('honours NFL_ACCESS_TOKEN without minting; a 401 re-mints once', async () => {
    process.env.NFL_ACCESS_TOKEN = 'env-token';
    const t = fakeTransport((req) => (req.method === 'POST' ? new Error('should not mint') : { status: 200, data: req.headers }));
    configure({ transport: { nfl_api: t } });
    (await sdv.nfl.nflApiInjuries({})).Authorization.should.equal('Bearer env-token');

    delete process.env.NFL_ACCESS_TOKEN;
    nflClearTokenCache();
    let mints = 0;
    const t2 = fakeTransport((req) => {
      if (req.method === 'POST') return { status: 200, data: { accessToken: `m${++mints}` } };
      return req.headers.Authorization === 'Bearer m1' ? { status: 401 } : { status: 200, data: req.headers };
    });
    configure({ transport: { nfl_api: t2 } });
    (await sdv.nfl.nflApiInjuries({})).Authorization.should.equal('Bearer m2');
    mints.should.equal(2);
  });

  it('caller-supplied Authorization wins (no mint)', async () => {
    const t = fakeTransport((req) => (req.method === 'POST' ? new Error('should not mint') : { status: 200, data: req.headers }));
    configure({ transport: { nfl_api: t } });
    const h = await sdv.nfl.nflApiInjuries({ headers: { Authorization: 'Bearer mine' } });
    h.Authorization.should.equal('Bearer mine');
    h.Origin.should.equal('https://www.nfl.com');
  });
});
