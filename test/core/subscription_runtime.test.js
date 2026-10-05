import should from 'should';
import { readFileSync } from 'node:fs';
import sdv, {
  configure,
  resetConfig,
  SdvError,
  NoDataError,
  AssetFetchError,
  InvalidParameterError,
  NflProAuthError,
  hasKenpomLogin,
  kenpomClearSessionCache,
  nflProToken,
} from '../../dist/index.js';
import { _timer } from '../../dist/core/request.js';
import { resolveFamily } from '../../dist/core/config.js';
import { loginFormAction, looksLoggedOut } from '../../dist/core/kenpom_runtime.js';
import {
  nflProTokenEntitled,
  nflProTokenFresh,
  nflProBrowserLogin,
  nflProClearTokenCache,
  _playwrightLoader,
  _loginLimits,
  _tokenCache,
} from '../../dist/core/nfl_pro_runtime.js';
import { accountKey as kenpomAccountKey } from '../../dist/core/kenpom_runtime.js';
import { createHash } from 'node:crypto';
import { TransportUnavailableError } from '../../dist/core/errors.js';
import { inspect } from 'node:util';

// No-network tests for the subscription runtimes (src/core/{pff_api,kenpom,
// nfl_pro}_runtime.ts): credential precedence, the login flow, error mapping,
// withheld-column handling and NFL Pro's offset paging. Every request goes
// through a fake transport installed with configure({ transport: { <family> } }).

const fixture = (dir, name) => JSON.parse(readFileSync(new URL(`../fixtures/${dir}/${name}`, import.meta.url), 'utf8'));

/** Replays `script` (one entry per call, last repeats); records calls. */
function fakeTransport(...script) {
  const calls = [];
  const t = async (req) => {
    calls.push(req);
    const step = script[Math.min(calls.length - 1, script.length - 1)];
    const r = typeof step === 'function' ? await step(req, calls.length - 1) : step;
    if (r instanceof Error) throw r;
    return { headers: {}, data: null, url: req.url, ...r };
  };
  t.calls = calls;
  return t;
}

const header = (req, name) => {
  const k = Object.keys(req.headers ?? {}).find((h) => h.toLowerCase() === name.toLowerCase());
  return k === undefined ? undefined : req.headers[k];
};

const ENV = [
  'PFF_API_KEY', 'SDV_PFF_API_KEY', 'SDV_PFF_STRICT',
  'KENPOM_EMAIL', 'KENPOM_PW', 'KENPOM_PASSWORD', 'KP_USER', 'KP_PW', 'SDV_KENPOM_EMAIL', 'SDV_KENPOM_PW',
  'NFLPRO_TOKEN', 'NFLPRO_EMAIL', 'NFLPRO_PW',
];

function isolate() {
  let saved;
  let realSleep;
  beforeEach(() => {
    saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
    for (const k of ENV) delete process.env[k];
    resetConfig();
    kenpomClearSessionCache();
    realSleep = _timer.sleep;
    _timer.sleep = async () => {};
  });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    _timer.sleep = realSleep;
    resetConfig();
    kenpomClearSessionCache();
  });
}

/** Collect process warnings emitted while `fn` runs. */
async function warningsDuring(fn) {
  const seen = [];
  const onWarning = (w) => seen.push(w);
  process.on('warning', onWarning);
  try {
    await fn();
    await new Promise((r) => setImmediate(r)); // emitWarning is delivered on next tick
  } finally {
    process.off('warning', onWarning);
  }
  return seen;
}

describe('subscription families: wiring', () => {
  it('each family opts out of 403 retries and has an auth provider', () => {
    for (const fam of ['pff_api', 'kenpom', 'nfl_pro']) {
      const r = resolveFamily(fam);
      should.exist(r.auth, fam);
      r.retryStatuses.should.eql([408, 429, 500, 502, 503, 504]);
    }
  });
  it('wrappers are exposed (snake + camel) on their league namespace', () => {
    sdv.nfl.pff_api_team_stats.should.equal(sdv.nfl.pffApiTeamStats);
    sdv.nfl.nfl_pro_players_offense_passing_season.should.equal(sdv.nfl.nflProPlayersOffensePassingSeason);
    sdv.mbb.kenpom_ratings.should.equal(sdv.mbb.kenpomRatings);
  });
  it('kenpom defaults to the browser-impersonating transport (kenpom.com 403s Node TLS)', () => {
    resolveFamily('kenpom').transport.should.not.equal(resolveFamily('pff_api').transport);
  });
});

describe('pff_api runtime', () => {
  isolate();
  const LEAGUES = { leagues: [{ id: 1, abbreviation: 'NFL' }] };

  it('no key anywhere -> SdvError naming the env vars, and no request is made', async () => {
    const t = fakeTransport({ status: 200, data: LEAGUES });
    configure({ transport: { pff_api: t } });
    const err = await sdv.nfl.pffApiRefLeagues().then(() => null, (e) => e);
    err.should.be.instanceOf(SdvError);
    err.message.should.match(/PFF_API_KEY/).and.match(/SDV_PFF_API_KEY/);
    t.calls.length.should.equal(0);
  });

  it('key precedence: Authorization header > api_key > SDV_PFF_API_KEY > PFF_API_KEY', async () => {
    const t = fakeTransport({ status: 200, data: LEAGUES });
    configure({ transport: { pff_api: t } });
    process.env.PFF_API_KEY = 'ak_env_plain';
    await sdv.nfl.pffApiRefLeagues();
    header(t.calls[0], 'authorization').should.equal('Bearer ak_env_plain');
    process.env.SDV_PFF_API_KEY = 'ak_env_sdv';
    await sdv.nfl.pffApiRefLeagues();
    header(t.calls[1], 'authorization').should.equal('Bearer ak_env_sdv');
    await sdv.nfl.pffApiRefLeagues({ api_key: 'ak_arg' });
    header(t.calls[2], 'authorization').should.equal('Bearer ak_arg');
    await sdv.nfl.pffApiRefLeagues({ api_key: 'ak_arg', headers: { Authorization: 'Bearer ak_header' } });
    header(t.calls[3], 'authorization').should.equal('Bearer ak_header');
    header(t.calls[3], 'accept').should.equal('application/json');
  });

  it('/v1 query keys stay snake_case exactly as the spec; /v2 keeps camelCase + the {league} path', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    const t = fakeTransport({ status: 200, data: { passing_summary: [] } });
    configure({ transport: { pff_api: t } });
    await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022, week: 1, franchise_id: 7, game_id: 23108 });
    t.calls[0].url.should.equal('https://api.pff.com/v1/facet/passing/summary');
    t.calls[0].query.should.eql({ league: 'nfl', season: 2022, week: 1, franchise_id: 7, game_id: 23108 });
    await sdv.nfl.pffApiTeamStats({ league: 'ncaa', season: 2024, week_group: 'REG', category: 'offense-passing' });
    t.calls[1].url.should.equal('https://api.pff.com/v2/ncaa/teams/stats');
    t.calls[1].query.should.eql({ season: 2024, weekGroup: 'REG', category: 'offense-passing' });
    // control keys never leak into the query string
    await sdv.nfl.pffApiRefLeagues({ api_key: 'ak_y', strict: true, parsed: true });
    t.calls[2].query.should.eql({});
  });

  it('parsed: true runs the ported parser over the body', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    configure({ transport: { pff_api: fakeTransport({ status: 200, data: fixture('pff_api', 'team_stats.json') }) } });
    const rows = await sdv.nfl.pffApiTeamStats({ league: 'nfl', season: 2022, parsed: true });
    rows.should.eql(fixture('pff_api', 'team_stats.py.json').rows);
  });

  const ERR = (code, message) => ({ error: { code, message, request_id: 'req-1', details: { param: 'season' } } });

  it('400 / 422 -> InvalidParameterError carrying PFF\'s error message (not retried)', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    for (const status of [400, 422]) {
      const t = fakeTransport({ status, data: ERR('invalid_parameter', 'season must be a valid year') });
      configure({ transport: { pff_api: t } });
      const err = await sdv.nfl.pffApiRefGames({ league: 'nfl', season: 1800, week: 1 }).then(() => null, (e) => e);
      err.should.be.instanceOf(InvalidParameterError);
      err.should.not.be.instanceOf(AssetFetchError);
      err.status.should.equal(status);
      err.message.should.equal(
        'pff_api: PFF rejected https://api.pff.com/v1/games: invalid_parameter: season must be a valid year {"param": "season"} [request_id req-1]'
      );
      t.calls.length.should.equal(1);
    }
  });

  it('404 -> NoDataError; 401 / 403 -> AssetFetchError, never retried; 429 / 5xx retried then AssetFetchError', async () => {
    process.env.PFF_API_KEY = 'ak_secret_value';
    let t = fakeTransport({ status: 404, data: ERR('not_found', 'no such team') });
    configure({ transport: { pff_api: t } });
    (await sdv.nfl.pffApiTeamRoster({ league: 'nfl', team: 'x' }).then(() => null, (e) => e)).should.be.instanceOf(NoDataError);
    for (const status of [401, 403]) {
      t = fakeTransport({ status, data: ERR('forbidden', 'not entitled') });
      configure({ transport: { pff_api: t } });
      const err = await sdv.nfl.pffApiRefLeagues().then(() => null, (e) => e);
      err.should.be.instanceOf(AssetFetchError);
      err.status.should.equal(status);
      err.message.should.not.match(/ak_secret_value/);
      t.calls.length.should.equal(1);
    }
    t = fakeTransport({ status: 429, data: ERR('rate_limited', 'slow down') }, { status: 200, data: LEAGUES });
    configure({ transport: { pff_api: t } });
    (await sdv.nfl.pffApiRefLeagues()).should.eql(LEAGUES);
    t.calls.length.should.equal(2);
    t = fakeTransport({ status: 503, data: 'upstream down' });
    configure({ transport: { pff_api: t }, retries: 2 });
    const err = await sdv.nfl.pffApiRefLeagues().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    t.calls.length.should.equal(3);
  });

  it('a 200 whose body is not a JSON object is an unknown answer -> AssetFetchError', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    for (const data of ['<html>cdn interstitial</html>', [1, 2]]) {
      configure({ transport: { pff_api: fakeTransport({ status: 200, data }) } });
      (await sdv.nfl.pffApiRefLeagues().then(() => null, (e) => e)).should.be.instanceOf(AssetFetchError);
    }
  });

  it('withheld columns warn by default; strict (arg or SDV_PFF_STRICT=1) throws', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    const body = { ...fixture('pff_api', 'facet_passing_summary.json'), restricted: ['grades_pass', 'btt_rate'] };
    configure({ transport: { pff_api: fakeTransport({ status: 200, data: body }) } });
    let out;
    const warned = await warningsDuring(async () => {
      out = await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022 });
    });
    out.should.eql(body);
    warned.length.should.equal(1);
    warned[0].name.should.equal('UserWarning');
    warned[0].message.should.match(/grades_pass, btt_rate/);
    const strictErr = await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022, strict: true }).then(() => null, (e) => e);
    strictErr.should.be.instanceOf(AssetFetchError);
    process.env.SDV_PFF_STRICT = '1';
    (await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022 }).then(() => null, (e) => e)).should.be.instanceOf(AssetFetchError);
    // an explicit strict: false still wins over the env
    (await sdv.nfl.pffApiFacetPassingSummary({ league: 'nfl', season: 2022, strict: false })).should.eql(body);
  });
});

// ---------------------------------------------------------------------------

const LOGIN_FORM =
  '<form action="handlers/login_handler.php"><input name="email"><input type="password" name="password"></form>';
const LOGGED_IN = '<html><body>Welcome back</body></html>';
const RATINGS = readFileSync(new URL('../fixtures/kenpom/ratings_2025.trim.html', import.meta.url), 'utf8');

/** A kenpom.com double: login page, login POST (rotates the session), member pages. */
function kenpomSite({ postBody = LOGGED_IN } = {}) {
  return fakeTransport((req) => {
    if (req.method === 'GET' && req.url === 'https://kenpom.com/index.php' && !header(req, 'cookie')) {
      return { status: 200, data: LOGIN_FORM, headers: { 'set-cookie': 'PHPSESSID=anon; path=/' } };
    }
    if (req.method === 'POST') {
      return { status: 200, data: postBody, headers: { 'set-cookie': 'PHPSESSID=member; path=/\nkpuser=1; path=/' } };
    }
    return { status: 200, data: RATINGS };
  });
}

describe('kenpom runtime (password-login session)', () => {
  isolate();

  it('no credentials -> SdvError naming the env vars, and no request is made', async () => {
    const t = kenpomSite();
    configure({ transport: { kenpom: t } });
    hasKenpomLogin().should.be.false();
    const err = await sdv.mbb.kenpomRatings({ year: 2025 }).then(() => null, (e) => e);
    err.should.be.instanceOf(SdvError);
    err.message.should.match(/KENPOM_EMAIL/).and.match(/KENPOM_PW/).and.match(/KP_USER/);
    t.calls.length.should.equal(0);
  });

  it('logs in once (GET form, POST to its action), then reuses the rotated session cookie', async () => {
    process.env.KP_USER = 'r@example.com'; // hoopR's names work unchanged
    process.env.KP_PW = 'secret';
    hasKenpomLogin().should.be.true();
    const t = kenpomSite();
    configure({ transport: { kenpom: t } });
    const html = await sdv.mbb.kenpomRatings({ year: 2025 });
    html.should.equal(RATINGS);
    const [landing, post, page] = t.calls;
    landing.url.should.equal('https://kenpom.com/index.php');
    post.method.should.equal('POST');
    post.url.should.equal('https://kenpom.com/handlers/login_handler.php');
    Object.fromEntries(new URLSearchParams(post.body)).should.eql({ submit: 'Login', email: 'r@example.com', password: 'secret' });
    header(post, 'cookie').should.equal('PHPSESSID=anon');
    header(post, 'referer').should.equal('https://kenpom.com/index.php');
    page.url.should.equal('https://kenpom.com/index.php');
    page.query.should.eql({ y: 2025 });
    header(page, 'cookie').should.equal('PHPSESSID=member; kpuser=1');
    page.responseType.should.equal('text');
    // second call: no new login
    const tables = await sdv.mbb.kenpomEfficiency({ year: 2025, parsed: true });
    t.calls.length.should.equal(4);
    tables.ratings_table.length.should.equal(8);
  });

  it('a rejected login (login form still on the page) throws instead of scraping free-tier tables', async () => {
    process.env.KENPOM_EMAIL = 'u@example.com';
    process.env.KENPOM_PW = 'wrong';
    const t = kenpomSite({ postBody: LOGIN_FORM });
    configure({ transport: { kenpom: t } });
    const err = await sdv.mbb.kenpomRatings({ year: 2025 }).then(() => null, (e) => e);
    err.should.be.instanceOf(SdvError);
    err.message.should.match(/rejected the supplied credentials/);
    err.message.should.not.match(/wrong/);
    t.calls.length.should.equal(2);
  });

  it('explicit email / password beat the environment (and get their own cached session)', async () => {
    process.env.KENPOM_EMAIL = 'env@example.com';
    process.env.KENPOM_PW = 'envpw';
    const t = kenpomSite();
    configure({ transport: { kenpom: t } });
    await sdv.mbb.kenpomRatings({ year: 2025, email: 'arg@example.com', password: 'argpw' });
    Object.fromEntries(new URLSearchParams(t.calls[1].body)).email.should.equal('arg@example.com');
    await sdv.mbb.kenpomRatings({ year: 2024, email: 'arg@example.com', password: 'argpw' });
    t.calls.filter((c) => c.method === 'POST').length.should.equal(1);
    t.calls[3].query.should.eql({ y: 2024 }); // credentials never reach the query string
  });

  it('a Cookie in headers is used as-is (no login)', async () => {
    const t = kenpomSite();
    configure({ transport: { kenpom: t } });
    await sdv.mbb.kenpomRatings({ year: 2025, headers: { Cookie: 'PHPSESSID=mine' } });
    t.calls.length.should.equal(1);
    header(t.calls[0], 'cookie').should.equal('PHPSESSID=mine');
  });

  it('login form discovery + logged-out detection follow sdv-py', () => {
    loginFormAction('<form id="login" method="POST" action="handlers/login_handler.php"><input name="email"></form>')
      .should.equal('https://kenpom.com/handlers/login_handler.php');
    loginFormAction('<form action="/team.php"><input name="team"></form>').should.equal('https://kenpom.com/handlers/login_handler.php');
    looksLoggedOut(LOGIN_FORM).should.be.true();
    looksLoggedOut(LOGGED_IN).should.be.false();
  });
});

// ---------------------------------------------------------------------------

/** An unsigned JWT with the given claims (the runtime only reads claims). */
const jwt = (claims) =>
  `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;
const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;
const ENTITLED = () => jwt({ exp: inAnHour(), plans: [{ plan: 'NFL_PLUS_PREMIUM', status: 'ACTIVE' }] });

describe('nfl_pro runtime (user token + offset paging)', () => {
  isolate();
  const page = fixture('nfl_pro', 'players_offense_passing_season.json');

  it('no token -> NflProAuthError naming NFLPRO_TOKEN, and no request is made', async () => {
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e);
    err.should.be.instanceOf(NflProAuthError);
    err.should.be.instanceOf(SdvError);
    err.message.should.match(/NFLPRO_TOKEN/);
    t.calls.length.should.equal(0);
  });

  it('rejects a token without an ACTIVE NFL_PLUS plan, or an expired one', async () => {
    nflProTokenEntitled(ENTITLED()).should.be.true();
    nflProTokenEntitled(jwt({ exp: inAnHour(), plans: [{ plan: 'NFL_PLUS_PREMIUM', status: 'EXPIRED' }] })).should.be.false();
    nflProTokenEntitled(jwt({ exp: inAnHour(), plans: [{ plan: 'FREE' }] })).should.be.false();
    nflProTokenEntitled('not-a-jwt').should.be.false();
    nflProTokenFresh(jwt({ exp: Math.floor(Date.now() / 1000) + 60 })).should.be.false(); // inside the 120 s skew
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    process.env.NFLPRO_TOKEN = jwt({ exp: inAnHour(), plans: [] });
    (await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e)).should.be.instanceOf(NflProAuthError);
    process.env.NFLPRO_TOKEN = jwt({ exp: 1, plans: [{ plan: 'NFL_PLUS_PREMIUM' }] });
    (await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e)).should.be.instanceOf(NflProAuthError);
    t.calls.length.should.equal(0);
  });

  it('token precedence: Authorization header > token > NFLPRO_TOKEN; browser headers + py defaults sent', async () => {
    const envTok = ENTITLED();
    const argTok = jwt({ exp: inAnHour() + 1, plans: [{ plan: 'NFL_PLUS_PREMIUM' }] });
    process.env.NFLPRO_TOKEN = envTok;
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ paginate: false });
    header(t.calls[0], 'authorization').should.equal(`Bearer ${envTok}`);
    header(t.calls[0], 'referer').should.equal('https://pro.nfl.com/');
    t.calls[0].query.should.eql({ season: 2024, seasonType: 'REG', limit: 500 });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ token: argTok, paginate: false });
    header(t.calls[1], 'authorization').should.equal(`Bearer ${argTok}`);
    await sdv.nfl.nflProPlayersOffensePassingSeason({ token: argTok, headers: { Authorization: 'Bearer mine' }, paginate: false });
    header(t.calls[2], 'authorization').should.equal('Bearer mine');
  });

  it('pages on offset until the envelope total is reached (responses truncate silently)', async () => {
    process.env.NFLPRO_TOKEN = ENTITLED();
    const rows = page.passers;
    const total = rows.length;
    const t = fakeTransport((req) => {
      const offset = req.query.offset ?? 0;
      return { status: 200, data: JSON.stringify({ ...page, total, passers: rows.slice(offset, offset + 2) }) };
    });
    configure({ transport: { nfl_pro: t } });
    const body = await sdv.nfl.nflProPlayersOffensePassingSeason({ limit: 2 });
    body.passers.should.eql(rows);
    t.calls.map((c) => c.query.offset).should.eql([undefined, 2, 4].slice(0, Math.ceil(total / 2)));
    should(body._truncated).be.undefined();
    const parsed = await sdv.nfl.nflProPlayersOffensePassingSeason({ limit: 2, parsed: true });
    parsed.should.eql(fixture('nfl_pro', 'players_offense_passing_season.py.json').rows);
  });

  it('stops at max_pages with _truncated + a warning; refuses a server that ignores offset', async () => {
    process.env.NFLPRO_TOKEN = ENTITLED();
    const rows = page.passers;
    let t = fakeTransport((req) => {
      const offset = req.query.offset ?? 0;
      return { status: 200, data: JSON.stringify({ ...page, total: 100, passers: rows.slice(offset % rows.length, (offset % rows.length) + 1) }) };
    });
    configure({ transport: { nfl_pro: t } });
    let body;
    const warned = await warningsDuring(async () => {
      body = await sdv.nfl.nflProPlayersOffensePassingSeason({ limit: 1, max_pages: 3 });
    });
    body._truncated.should.be.true();
    body.passers.length.should.equal(3);
    warned.some((w) => /stopped after 3 pages/.test(w.message)).should.be.true();
    t = fakeTransport({ status: 200, data: JSON.stringify({ ...page, total: 100 }) });
    configure({ transport: { nfl_pro: t } });
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.message.should.match(/ignored `offset`/);
  });

  it('HTTP 200 with an empty body (rejected query params) -> InvalidParameterError', async () => {
    process.env.NFLPRO_TOKEN = ENTITLED();
    configure({ transport: { nfl_pro: fakeTransport({ status: 200, data: '' }) } });
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason({ sort_key: 'nope' }).then(() => null, (e) => e);
    err.should.be.instanceOf(InvalidParameterError);
    err.message.should.match(/week` is a path scope/);
  });

  it('401 / 403 -> AssetFetchError naming the entitlement, never retried; 500 carries the body', async () => {
    process.env.NFLPRO_TOKEN = ENTITLED();
    for (const status of [401, 403]) {
      const t = fakeTransport({ status, data: 'denied' });
      configure({ transport: { nfl_pro: t } });
      const err = await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e);
      err.should.be.instanceOf(AssetFetchError);
      err.message.should.match(/NFL_PLUS/);
      t.calls.length.should.equal(1);
    }
    configure({ transport: { nfl_pro: fakeTransport({ status: 500, data: 'positionGroup is required' }) }, retries: 0 });
    (await sdv.nfl.nflProFantasyGame().then(() => null, (e) => e)).message.should.match(/positionGroup is required/);
  });
});

/**
 * A fake `playwright` module driving a scripted id.nfl.com. `steps` are the
 * screens shown after "Sign In" is clicked, in order ('email', 'passkey' — the
 * sign-in-biometric OFFER with no password field — and 'password'); Enter on a
 * field (or "use password" on the passkey offer) advances to the next screen,
 * and past the last one the page is signed in. `blobs(email)` is what
 * localStorage holds afterwards. Every launch starts a fresh page.
 */
function fakePlaywright({ steps, blobs, onFill, hang = false }) {
  const log = { launched: 0, closed: 0, fills: [] };
  const ctl = { hang }; // ctl.hang: every page.evaluate never settles (a hung page)
  const chromium = {
    async launch(opts) {
      opts.should.eql({ headless: true });
      log.launched++;
      let at = -1; // the pro.nfl.com home page, before "Sign In"
      let filledEmail;
      const screen = () => steps[at];
      const page = {
        async goto() {},
        async waitForTimeout() {},
        url: () =>
          at >= steps.length
            ? 'https://pro.nfl.com/'
            : `https://id.nfl.com/account/${screen() === 'recovery' ? 'account-recovery' : 'sign-in'}`,
        async evaluate(fn) {
          if (ctl.hang) return new Promise(() => {});
          const src = String(fn);
          if (src.includes('login-button')) {
            at = Math.max(at, 0);
            return undefined;
          }
          if (src.includes('use password')) {
            if (screen() !== 'passkey') return false;
            at++;
            return true;
          }
          if (src.includes('localStorage')) return blobs(filledEmail);
          throw new Error(`unexpected evaluate: ${src}`);
        },
        locator(sel) {
          const kind = sel.includes('password') ? 'password' : 'email';
          const loc = {
            first: () => loc,
            count: async () => (screen() === kind ? 1 : 0),
            isVisible: async () => screen() === kind,
            async fill(value, o) {
              o.timeout.should.equal(8000);
              log.fills.push([kind, value]);
              if (kind === 'email') filledEmail = value;
              if (onFill) onFill(kind, value);
            },
            async press(key) {
              if (key === 'Enter') at++;
            },
          };
          return loc;
        },
      };
      return {
        async newContext(o) {
          o.viewport.should.eql({ width: 1440, height: 900 });
          return { newPage: async () => page };
        },
        async close() {
          log.closed++;
        },
      };
    },
  };
  return { chromium, log, ctl };
}

describe('nfl_pro login (id.nfl.com via an injected Playwright)', () => {
  isolate();
  const page = fixture('nfl_pro', 'players_offense_passing_season.json');
  const PW = 'hunter2-Sekret!';
  // `exp` is frozen once per test: tokens minted at different moments of one
  // test must compare equal across a wall-clock second boundary
  let exp;
  const tokenFor = (email, extra = {}) =>
    jwt({ exp, sub: email, plans: [{ plan: 'NFL_PLUS_PREMIUM', status: 'ACTIVE' }], ...extra });
  const ANON = jwt({ exp: inAnHour(), plans: [] }); // an anonymous / Gigya-UID token: same shape, no plan
  let realLoad;
  let realNow;
  let realDeadline;
  beforeEach(() => {
    exp = inAnHour();
    realLoad = _playwrightLoader.load;
    realNow = Date.now;
    realDeadline = _loginLimits.deadlineMs;
    nflProClearTokenCache();
  });
  afterEach(() => {
    _playwrightLoader.load = realLoad;
    Date.now = realNow;
    _loginLimits.deadlineMs = realDeadline;
    nflProClearTokenCache();
  });

  it('drives every step order to the password and returns the entitled token', async () => {
    for (const steps of [['email', 'password'], ['email', 'passkey', 'password'], ['passkey', 'email', 'password']]) {
      const pw = fakePlaywright({ steps, blobs: (e) => ['{"theme":"dark"}', `{"accessToken":"${ANON}"}`, `{"user":{"accessToken":"${tokenFor(e)}"}}`] });
      const token = await nflProBrowserLogin('a@example.com', PW, { playwright: pw });
      token.should.equal(tokenFor('a@example.com'));
      pw.log.fills.should.eql([['email', 'a@example.com'], ['password', PW]]);
      pw.log.closed.should.equal(1);
    }
  });

  it('a password screen first (remembered e-mail) skips the e-mail step', async () => {
    const pw = fakePlaywright({ steps: ['password'], blobs: () => [tokenFor('a@example.com')] });
    (await nflProBrowserLogin('a@example.com', PW, { playwright: pw })).should.equal(tokenFor('a@example.com'));
    pw.log.fills.should.eql([['password', PW]]);
  });

  it('never reaching the password step, or no entitled token after sign-in, is NflProAuthError (browser closed)', async () => {
    // "Sign In" opens no recognisable form: the state machine finds nothing to fill
    let pw = fakePlaywright({ steps: [], blobs: () => [] });
    let err = await nflProBrowserLogin('a@example.com', PW, { playwright: pw }).then(() => null, (e) => e);
    err.should.be.instanceOf(NflProAuthError);
    err.message.should.match(/password step was never reached/);
    pw.log.closed.should.equal(1);
    // an account with no password on file: id.nfl.com sends the e-mail step to
    // /account/account-recovery (measured live 2026-10-05)
    pw = fakePlaywright({ steps: ['email', 'recovery'], blobs: () => [] });
    err = await nflProBrowserLogin('a@example.com', PW, { playwright: pw }).then(() => null, (e) => e);
    err.should.be.instanceOf(NflProAuthError);
    err.message.should.match(/this account has no password/);
    err.message.should.not.containEql('a@example.com');
    // signed in, but localStorage holds only an anonymous token and a lapsed plan
    const lapsed = jwt({ exp: inAnHour(), plans: [{ plan: 'NFL_PLUS_PREMIUM', status: 'CANCELLED' }] });
    pw = fakePlaywright({ steps: ['email', 'password'], blobs: () => [ANON, lapsed] });
    err = await nflProBrowserLogin('a@example.com', PW, { playwright: pw }).then(() => null, (e) => e);
    err.should.be.instanceOf(NflProAuthError);
    err.message.should.match(/no token carrying an active NFL_PLUS_\* plan/);
  });

  it('wrapper with email / password logs in once, caches per account, re-logs in after expiry', async () => {
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)] });
    _playwrightLoader.load = async () => pw;
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    const creds = { email: 'a@example.com', password: PW, paginate: false };
    await sdv.nfl.nflProPlayersOffensePassingSeason(creds);
    await sdv.nfl.nflProPlayersOffensePassingSeason(creds);
    pw.log.launched.should.equal(1);
    header(t.calls[0], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com')}`);
    header(t.calls[1], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com')}`);
    t.calls[0].query.should.eql({ season: 2024, seasonType: 'REG', limit: 500 }); // credentials never in the query
    // the cached token expires -> a fresh login
    const now = realNow();
    Date.now = () => now + 2 * 3600 * 1000;
    await sdv.nfl.nflProPlayersOffensePassingSeason(creds);
    pw.log.launched.should.equal(2);
  });

  it('two accounts never share a token (the cache is keyed by account), nor does a wrong password', async () => {
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)] });
    _playwrightLoader.load = async () => pw;
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'b@example.com', password: PW, paginate: false });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    header(t.calls[0], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com')}`);
    header(t.calls[1], 'authorization').should.equal(`Bearer ${tokenFor('b@example.com')}`);
    header(t.calls[2], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com')}`);
    pw.log.launched.should.equal(2);
    // same e-mail, different password: not answered from the cache
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: 'other', paginate: false });
    pw.log.launched.should.equal(3);
  });

  it('resolution order is sdv-py\'s: token > NFLPRO_TOKEN > email / password > NFLPRO_EMAIL / NFLPRO_PW', async () => {
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)] });
    _playwrightLoader.load = async () => pw;
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    const envTok = tokenFor('env-token@example.com');
    const argTok = tokenFor('arg-token@example.com');
    process.env.NFLPRO_TOKEN = envTok;
    process.env.NFLPRO_EMAIL = 'env@example.com';
    process.env.NFLPRO_PW = PW;
    await sdv.nfl.nflProPlayersOffensePassingSeason({ token: argTok, email: 'a@example.com', password: PW, paginate: false });
    header(t.calls[0], 'authorization').should.equal(`Bearer ${argTok}`);
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    header(t.calls[1], 'authorization').should.equal(`Bearer ${envTok}`);
    pw.log.launched.should.equal(0);
    delete process.env.NFLPRO_TOKEN;
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    header(t.calls[2], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com')}`);
    await sdv.nfl.nflProPlayersOffensePassingSeason({ paginate: false }); // family auth provider: env login
    header(t.calls[3], 'authorization').should.equal(`Bearer ${tokenFor('env@example.com')}`);
    pw.log.launched.should.equal(2);
    delete process.env.NFLPRO_PW;
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason({ paginate: false }).then(() => null, (e) => e);
    err.should.be.instanceOf(NflProAuthError);
    err.message.should.match(/NFLPRO_EMAIL and NFLPRO_PW/);
    err.message.should.not.match(/env@example\.com/);
  });

  it('concurrent calls for one account share a single login', async () => {
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)] });
    _playwrightLoader.load = async () => pw;
    configure({ transport: { nfl_pro: fakeTransport({ status: 200, data: JSON.stringify(page) }) } });
    const creds = { email: 'a@example.com', password: PW, paginate: false };
    await Promise.all([sdv.nfl.nflProPlayersOffensePassingSeason(creds), sdv.nfl.nflProTeamOffenseOverviewSeason(creds)]);
    pw.log.launched.should.equal(1);
  });

  it('playwright missing -> TransportUnavailableError naming the install command; no request made', async () => {
    _playwrightLoader.load = async () => {
      throw Object.assign(new Error("Cannot find package 'playwright'"), { code: 'ERR_MODULE_NOT_FOUND' });
    };
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW }).then(() => null, (e) => e);
    err.should.be.instanceOf(TransportUnavailableError);
    err.message.should.containEql('npm i playwright && npx playwright install chromium');
    t.calls.length.should.equal(0);
  });

  it('SECURITY: a failing login never carries the e-mail, password or a token in the error or its cause chain', async () => {
    const leaky = (kind, value) => {
      // what a browser-automation error can look like: the value echoed in its
      // call log, raw and URL-encoded (e.g. inside a navigated URL)
      const e = new Error(
        `locator.fill: Timeout 8000ms exceeded.\nCall log:\n  - fill("${value}") on ${kind}\n  - navigated to https://id.nfl.com/x?u=${encodeURIComponent(value)}\n  - form field ${encodeURIComponent(value)}`
      );
      e.stack = `${e.message}\n    at fill (${value})`;
      e.log = [value];
      throw e;
    };
    // synthetic credentials; `markers` are fragments that must not survive either
    const creds = [
      { email: 'secret.person@example.com', password: PW, markers: [] },
      // a password that CONTAINS the e-mail: removed whole, not e-mail first
      { email: 'jane.doe@example.com', password: 'jane.doe@example.com#Tail99', markers: ['Tail99'] },
      // a password redactSecrets would rewrite first (scheme://…?): removed before it runs
      { email: 'jane.doe@example.com', password: 'https://pw.example/?k=Tail77', markers: ['Tail77', 'pw.example'] },
      // an e-mail echoed URL-encoded (jane.doe%2Bnfl%40example.com)
      { email: 'jane.doe+nfl@example.com', password: PW, markers: [] },
    ];
    for (const { email, password, markers } of creds) {
      const found = tokenFor(email, { plans: [] }); // a non-entitled token sitting in localStorage
      const forbidden = [password, email, encodeURIComponent(email), encodeURIComponent(password), found, ...markers];
      const modes = [
        fakePlaywright({ steps: ['email', 'password'], blobs: () => [found], onFill: (k, v) => k === 'password' && leaky(k, v) }),
        fakePlaywright({ steps: ['email', 'password'], blobs: () => [found], onFill: (k, v) => k === 'email' && leaky(k, v) }),
        fakePlaywright({ steps: ['email', 'password'], blobs: () => [found] }), // signed in, token not entitled
      ];
      for (const pw of modes) {
        _playwrightLoader.load = async () => pw;
        const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
        configure({ transport: { nfl_pro: t } });
        for (const call of [
          () => sdv.nfl.nflProPlayersOffensePassingSeason({ email, password }),
          () => {
            process.env.NFLPRO_EMAIL = email;
            process.env.NFLPRO_PW = password;
            return sdv.nfl.nflProPlayersOffensePassingSeason();
          },
        ]) {
          const err = await call().then(() => null, (e) => e);
          err.should.be.instanceOf(NflProAuthError);
          const dumps = [inspect(err, { depth: Infinity, showHidden: true }), JSON.stringify(err), String(err.stack)];
          for (let c = err.cause; c; c = c.cause) dumps.push(inspect(c, { depth: Infinity, showHidden: true }), String(c.stack));
          for (const d of dumps) for (const f of forbidden) d.should.not.containEql(f);
          t.calls.length.should.equal(0);
        }
        delete process.env.NFLPRO_EMAIL;
        delete process.env.NFLPRO_PW;
      }
    }
  });

  it('a hung page cannot block the account: one deadline closes the browser once and rejects every waiter', async () => {
    _loginLimits.deadlineMs = 50;
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)], hang: true });
    _playwrightLoader.load = async () => pw;
    const creds = { email: 'a@example.com', password: PW };
    const t0 = Date.now();
    const [a, b] = await Promise.allSettled([nflProToken(creds), nflProToken(creds)]); // b shares a's login
    (Date.now() - t0).should.be.below(2000);
    for (const r of [a, b]) {
      r.status.should.equal('rejected');
      r.reason.should.be.instanceOf(NflProAuthError);
      r.reason.message.should.match(/did not finish within 0\.05 s/);
    }
    pw.log.launched.should.equal(1);
    pw.log.closed.should.equal(1);
    // the account is not stuck: the next call logs in again
    pw.ctl.hang = false;
    (await nflProToken(creds)).should.equal(tokenFor('a@example.com'));
    pw.log.launched.should.equal(2);
    pw.log.closed.should.equal(2);
  });

  it('a 401 on a logged-in token drops it and logs in again exactly once (explicit and env credentials)', async () => {
    let n = 0;
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e, { jti: ++n })] });
    _playwrightLoader.load = async () => pw;
    const ok = { status: 200, data: JSON.stringify(page) };
    let t = fakeTransport({ status: 401, data: 'expired' }, ok);
    configure({ transport: { nfl_pro: t } });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    pw.log.launched.should.equal(2);
    t.calls.length.should.equal(2);
    header(t.calls[0], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com', { jti: 1 })}`);
    header(t.calls[1], 'authorization').should.equal(`Bearer ${tokenFor('a@example.com', { jti: 2 })}`);
    // the re-minted token is the cached one now
    await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW, paginate: false });
    pw.log.launched.should.equal(2);
    // a fresh login that still 401s is the answer: one re-mint, then AssetFetchError
    t = fakeTransport({ status: 401, data: 'no plan' });
    configure({ transport: { nfl_pro: t } });
    const err = await sdv.nfl.nflProPlayersOffensePassingSeason({ email: 'a@example.com', password: PW }).then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.status.should.equal(401);
    pw.log.launched.should.equal(3);
    t.calls.length.should.equal(2);
    // env credentials (the family default path) re-mint the same way
    process.env.NFLPRO_EMAIL = 'env@example.com';
    process.env.NFLPRO_PW = PW;
    t = fakeTransport({ status: 401, data: 'expired' }, ok);
    configure({ transport: { nfl_pro: t } });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ paginate: false });
    pw.log.launched.should.equal(5);
    t.calls.length.should.equal(2);
    // a SUPPLIED token is never re-minted
    process.env.NFLPRO_TOKEN = tokenFor('supplied@example.com');
    t = fakeTransport({ status: 401, data: 'revoked' });
    configure({ transport: { nfl_pro: t } });
    (await sdv.nfl.nflProPlayersOffensePassingSeason().then(() => null, (e) => e)).status.should.equal(401);
    t.calls.length.should.equal(1);
    pw.log.launched.should.equal(5);
  });

  it('a plan with status null is not ACTIVE (sdv-py rejects None); an absent status is', () => {
    nflProTokenEntitled(jwt({ exp, plans: [{ plan: 'NFL_PLUS_PREMIUM', status: null }] })).should.be.false();
    nflProTokenEntitled(jwt({ exp, plans: [{ plan: 'NFL_PLUS_PREMIUM' }] })).should.be.true();
  });

  it('cache keys are per-process HMACs (no e-mail, no unsalted hash); expired tokens are dropped on insert', async () => {
    const pw = fakePlaywright({ steps: ['email', 'password'], blobs: (e) => [tokenFor(e)] });
    _playwrightLoader.load = async () => pw;
    await nflProToken({ email: 'a@example.com', password: PW });
    const sha = createHash('sha256').update(PW).digest('hex');
    for (const k of _tokenCache.keys()) {
      k.should.match(/^[0-9a-f]{64}$/);
      k.should.not.containEql('a@example.com');
      k.should.not.containEql(sha);
    }
    _tokenCache.size.should.equal(1);
    // a's token expires; b's login prunes it on insert
    const now = realNow();
    Date.now = () => now + 2 * 3600 * 1000;
    exp = Math.floor(Date.now() / 1000) + 3600;
    await nflProToken({ email: 'b@example.com', password: PW });
    _tokenCache.size.should.equal(1);
    [..._tokenCache.values()].should.eql([tokenFor('b@example.com')]);
  });
});

describe('kenpom: explicit-session cache key', () => {
  const PW_KP = 'synthetic-Kp-pass1';
  it('is a per-process HMAC of e-mail + password: no e-mail, no unsalted hash, unambiguous', () => {
    const k = kenpomAccountKey({ email: 'a@example.com', password: PW_KP });
    k.should.match(/^[0-9a-f]{64}$/);
    k.should.not.containEql('a@example.com');
    k.should.not.containEql(createHash('sha256').update(PW_KP).digest('hex'));
    kenpomAccountKey({ email: 'a@example.com', password: PW_KP }).should.equal(k); // stable in-process
    kenpomAccountKey({ email: 'a@example.com', password: `${PW_KP}x` }).should.not.equal(k);
    kenpomAccountKey({ email: 'b@example.com', password: PW_KP }).should.not.equal(k);
    // length-prefixed parts: ("a@x.com", "bc") never collides with ("a@x.comb", "c")
    kenpomAccountKey({ email: 'a@x.com', password: 'bc' }).should.not.equal(kenpomAccountKey({ email: 'a@x.comb', password: 'c' }));
  });
});

describe('core: registerFamilyDefaults classifyError hook', () => {
  isolate();

  it('maps a final failed response to the family error; 404 stays NoDataError; undefined keeps AssetFetchError', async () => {
    const { registerFamilyDefaults } = await import('../../dist/core/config.js');
    const { request } = await import('../../dist/core/request.js');
    const seen = [];
    registerFamilyDefaults('test_classify', {
      retryStatuses: [503],
      classifyError: (res, url) => {
        seen.push([res.status, url]);
        return res.status === 400 ? new InvalidParameterError('bad args', { url, status: 400 }) : undefined;
      },
    });
    const run = async (status) => {
      configure({ transport: { test_classify: fakeTransport({ status, data: null }) }, retries: 1 });
      return request('test_classify', { method: 'GET', url: 'https://x.test/a', query: { k: 'secret' } }).then(() => null, (e) => e);
    };
    (await run(400)).should.be.instanceOf(InvalidParameterError);
    (await run(404)).should.be.instanceOf(NoDataError);
    (await run(503)).should.be.instanceOf(AssetFetchError); // retried once, then classified (undefined)
    seen.should.eql([[400, 'https://x.test/a'], [503, 'https://x.test/a']]);
  });
});

describe('kenpom runtime: credential cache, logged-out pages, refresh routing', () => {
  isolate();

  /** A kenpom.com double: GOOD password logs in; pages are logged out until `loggedInAfter` logins. */
  function site({ good = 'right', pageStatus = () => 200, loggedOutPages = 0 } = {}) {
    let served = 0;
    return fakeTransport((req) => {
      if (req.method === 'GET' && req.url === 'https://kenpom.com/index.php' && !header(req, 'cookie')) {
        return { status: 200, data: LOGIN_FORM, headers: { 'set-cookie': 'PHPSESSID=anon' } };
      }
      if (req.method === 'POST') {
        const form = Object.fromEntries(new URLSearchParams(req.body));
        return form.password === good
          ? { status: 200, data: LOGGED_IN, headers: { 'set-cookie': `PHPSESSID=member-${form.email}` } }
          : { status: 200, data: LOGIN_FORM };
      }
      const status = pageStatus(served);
      served++;
      if (status !== 200) return { status, data: '' };
      return { status: 200, data: served <= loggedOutPages ? `<html>${LOGIN_FORM}<table id="t"></table></html>` : RATINGS };
    });
  }
  const posts = (t) => t.calls.filter((c) => c.method === 'POST').map((c) => Object.fromEntries(new URLSearchParams(c.body)));

  it('a failed explicit login is not cached: the corrected password for the same e-mail succeeds', async () => {
    const t = site();
    configure({ transport: { kenpom: t } });
    const bad = await sdv.mbb.kenpomRatings({ year: 2025, email: 'a@example.com', password: 'wrong' }).then(() => null, (e) => e);
    bad.should.be.instanceOf(SdvError);
    bad.message.should.match(/rejected the supplied credentials/);
    (await sdv.mbb.kenpomRatings({ year: 2025, email: 'a@example.com', password: 'right' })).should.equal(RATINGS);
    posts(t).map((p) => p.password).should.eql(['wrong', 'right']);
    // the good session is cached: no further login
    await sdv.mbb.kenpomRatings({ year: 2024, email: 'a@example.com', password: 'right' });
    posts(t).length.should.equal(2);
  });

  it('sessions are keyed by e-mail + password hash and capped at 8 (oldest evicted)', async () => {
    const t = site({ good: 'right' });
    configure({ transport: { kenpom: t } });
    for (let i = 0; i < 9; i++) await sdv.mbb.kenpomRatings({ year: 2025, email: `u${i}@example.com`, password: 'right' });
    posts(t).length.should.equal(9);
    await sdv.mbb.kenpomRatings({ year: 2025, email: 'u8@example.com', password: 'right' }); // cached
    posts(t).length.should.equal(9);
    await sdv.mbb.kenpomRatings({ year: 2025, email: 'u0@example.com', password: 'right' }); // evicted -> logs in again
    posts(t).length.should.equal(10);
  });

  it('a logged-out page is refreshed once, then re-fetched (never returned as data)', async () => {
    process.env.KENPOM_EMAIL = 'env@example.com';
    process.env.KENPOM_PW = 'right';
    const t = site({ loggedOutPages: 1 });
    configure({ transport: { kenpom: t } });
    (await sdv.mbb.kenpomRatings({ year: 2025 })).should.equal(RATINGS);
    posts(t).length.should.equal(2); // the first login + the refresh
  });

  it('still logged out after the refresh -> AssetFetchError; the caller\'s own cookie is never refreshed', async () => {
    process.env.KENPOM_EMAIL = 'env@example.com';
    process.env.KENPOM_PW = 'right';
    let t = site({ loggedOutPages: 99 });
    configure({ transport: { kenpom: t } });
    const err = await sdv.mbb.kenpomRatings({ year: 2025 }).then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    err.message.should.match(/logged-out login page/);
    t = site({ loggedOutPages: 99 });
    configure({ transport: { kenpom: t } });
    const own = await sdv.mbb.kenpomRatings({ year: 2025, headers: { Cookie: 'PHPSESSID=mine' } }).then(() => null, (e) => e);
    own.should.be.instanceOf(AssetFetchError);
    posts(t).length.should.equal(0);
  });

  it('a 401 refreshes the session the request actually used (explicit credentials, not the env session)', async () => {
    process.env.KENPOM_EMAIL = 'env@example.com';
    process.env.KENPOM_PW = 'right';
    const t = site({ pageStatus: (n) => (n === 0 ? 401 : 200) });
    configure({ transport: { kenpom: t } });
    (await sdv.mbb.kenpomRatings({ year: 2025, email: 'arg@example.com', password: 'right' })).should.equal(RATINGS);
    posts(t).map((p) => p.email).should.eql(['arg@example.com', 'arg@example.com']);
    // the routing header never reaches the site
    for (const c of t.calls) should(header(c, 'x-sdv-kenpom-session')).be.undefined();
  });
});

describe('subscription families: `section` through the wrappers + NFL Pro booleans', () => {
  isolate();

  it('callFlat passes `section` to the PFF + KenPom parsers', async () => {
    process.env.PFF_API_KEY = 'ak_x';
    configure({ transport: { pff_api: fakeTransport({ status: 200, data: fixture('pff_api', 'team_rushing_direction.json') }) } });
    const totals = await sdv.nfl.pffApiTeamRushingDirection({ league: 'nfl', team: 'x', parsed: true, section: 'teamTotals' });
    totals.should.eql(fixture('pff_api', 'team_rushing_direction.teamTotals.py.json').rows);
    configure({ transport: { pff_api: fakeTransport({ status: 200, data: fixture('pff_api', 'player_offense_pass_blocking.json') }) } });
    (await sdv.nfl.pffApiPlayerOffensePassBlocking({ league: 'nfl', player_id: 1, parsed: true, section: 'career' }))
      .should.eql(fixture('pff_api', 'player_offense_pass_blocking.career.py.json').rows);
    configure({ transport: { kenpom: fakeTransport({ status: 200, data: RATINGS }) } });
    const t = await sdv.mbb.kenpomRatings({ year: 2025, headers: { Cookie: 'PHPSESSID=x' }, parsed: true, section: 'ratings_table' });
    t.length.should.equal(8);
    (await sdv.mbb.kenpomRatings({ year: 2025, headers: { Cookie: 'PHPSESSID=x' }, parsed: true, section: 'nope' }).then(() => null, (e) => e))
      .message.should.match(/Choose one of \["ratings_table"\]/);
  });

  it('NFL Pro sends bool params the way sdv-py\'s requests does: "True" / "False"', async () => {
    process.env.NFLPRO_TOKEN = ENTITLED();
    const page = fixture('nfl_pro', 'players_offense_passing_season.json');
    const t = fakeTransport({ status: 200, data: JSON.stringify(page) });
    configure({ transport: { nfl_pro: t } });
    await sdv.nfl.nflProPlayersOffensePassingSeason({ qualified: true, paginate: false });
    t.calls[0].query.qualifiedPasser.should.equal('True');
    await sdv.nfl.nflProPlayersOffensePassingSeason({ qualified: false, paginate: false });
    t.calls[1].query.qualifiedPasser.should.equal('False');
  });
});

describe('kenpom runtime: concurrent explicit-credential calls', () => {
  isolate();

  /** Site double: logins succeed for password "right"; `pageStep(req)` decides each page answer. */
  function site(pageStep) {
    return fakeTransport((req) => {
      if (req.method === 'GET' && req.url === 'https://kenpom.com/index.php' && !header(req, 'cookie')) {
        return { status: 200, data: LOGIN_FORM, headers: { 'set-cookie': 'PHPSESSID=anon' } };
      }
      if (req.method === 'POST') {
        const form = Object.fromEntries(new URLSearchParams(req.body));
        return form.password === 'right'
          ? { status: 200, data: LOGGED_IN, headers: { 'set-cookie': `PHPSESSID=member-${form.email}` } }
          : { status: 200, data: LOGIN_FORM };
      }
      return pageStep(req);
    });
  }
  const logins = (t) => t.calls.filter((c) => c.method === 'POST').length;

  it('two concurrent calls for one account share ONE login and both survive a retry', async () => {
    const firstAttempt = new Set();
    const t = site((req) => {
      // every call's first page attempt is a 503 -> request() retries and re-applies the session
      const key = `${req.url}?${JSON.stringify(req.query)}`;
      if (!firstAttempt.has(key)) {
        firstAttempt.add(key);
        return { status: 503, data: '' };
      }
      return { status: 200, data: RATINGS };
    });
    configure({ transport: { kenpom: t } });
    const creds = { email: 'same@example.com', password: 'right' };
    const results = await Promise.allSettled([
      sdv.mbb.kenpomRatings({ year: 2025, ...creds }),
      sdv.mbb.kenpomRatings({ year: 2024, ...creds }),
    ]);
    results.map((r) => r.status).should.eql(['fulfilled', 'fulfilled']);
    results.every((r) => r.value === RATINGS).should.be.true();
    logins(t).should.equal(1);
  });

  it('a failed concurrent login is shared too, and is not cached', async () => {
    const t = site(() => ({ status: 200, data: RATINGS }));
    configure({ transport: { kenpom: t } });
    const creds = { email: 'same@example.com', password: 'wrong' };
    const results = await Promise.allSettled([
      sdv.mbb.kenpomRatings({ year: 2025, ...creds }),
      sdv.mbb.kenpomRatings({ year: 2024, ...creds }),
    ]);
    results.map((r) => r.status).should.eql(['rejected', 'rejected']);
    logins(t).should.equal(1);
    await sdv.mbb.kenpomRatings({ year: 2025, ...creds }).then(() => null, (e) => e);
    logins(t).should.equal(2); // not cached: the next call logs in again
  });

  it('an in-flight request keeps its session when 8 other accounts evict it from the cache', async () => {
    let releaseFirst;
    const gate = new Promise((r) => (releaseFirst = r));
    let firstPage = true;
    const t = site(async (req) => {
      if (header(req, 'cookie') === 'PHPSESSID=member-a@example.com' && firstPage) {
        firstPage = false;
        await gate; // hold account a's request open while the cache churns
        return { status: 503, data: '' }; // -> retry -> re-applies a's (now evicted) session
      }
      return { status: 200, data: RATINGS };
    });
    configure({ transport: { kenpom: t } });
    const inFlight = sdv.mbb.kenpomRatings({ year: 2025, email: 'a@example.com', password: 'right' });
    await new Promise((r) => setTimeout(r, 0));
    while (logins(t) < 1) await new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < 8; i++) {
      await sdv.mbb.kenpomRatings({ year: 2025, email: `u${i}@example.com`, password: 'right' });
    }
    releaseFirst();
    (await inFlight).should.equal(RATINGS);
    logins(t).should.equal(9); // a was evicted from the cache, but its request never re-logged-in or threw
    await sdv.mbb.kenpomRatings({ year: 2025, email: 'a@example.com', password: 'right' });
    logins(t).should.equal(10); // a NEW call for a logs in again (evicted from the cache)
  });
});
