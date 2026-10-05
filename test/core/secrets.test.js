import should from 'should';
import http from 'node:http';
import { inspect } from 'node:util';
import axios from 'axios';
import sdv, {
  configure,
  resetConfig,
  axiosTransport,
  createImpersonatingTransport,
  AssetFetchError,
  kenpomClearSessionCache,
} from '../../dist/index.js';
import { _timer, request } from '../../dist/core/request.js';
import { _impitLoader } from '../../dist/core/transport.js';
import { safeCause, redactSecrets } from '../../dist/core/errors.js';

// Secrets must never ride on an error. A raw axios error carries the whole
// request config — the Authorization header, cookies, and a POSTed login form
// (password included) — so attaching it as `cause` leaks them into
// util.inspect / logged errors. These tests drive REAL axios requests at a local
// server that drops the connection, through the real transport + request() +
// auth paths of a bearer family (PFF), a cookie family (KenPom with the caller's
// own cookie) and a POST-login family (KenPom's password login).

const KEY = 'ak_live_SECRETKEY_123';
const COOKIE = 'PHPSESSID=SECRETCOOKIE_456';
const EMAIL = 'secret.user@example.com';
const PASSWORD = 'SECRETPASSWORD_789';
const SECRETS = [KEY, 'SECRETCOOKIE_456', PASSWORD];

let server;
let base;
before(async () => {
  // accept, then reset every connection: the client sees a network error
  server = http.createServer((req) => req.socket.destroy());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
});
after(() => new Promise((r) => server.close(r)));

/** axiosTransport, aimed at the local connection-dropping server. */
const toLocal = (req) => axiosTransport({ ...req, url: base });

function assertNoSecrets(err) {
  const dumps = [inspect(err, { depth: Infinity, showHidden: true }), JSON.stringify(err), String(err.stack)];
  for (const text of dumps) for (const s of SECRETS) text.should.not.containEql(s);
}

/** The cause keeps what debugging needs: a message and the network error code. */
function assertDebuggableCause(err) {
  should.exist(err.cause);
  err.cause.message.should.be.a.String().and.not.be.empty();
  err.cause.code.should.be.a.String();
}

describe('security: credentials never reach an error or its cause', function () {
  this.timeout(20000);
  let realSleep;
  const ENV = ['PFF_API_KEY', 'SDV_PFF_API_KEY', 'KENPOM_EMAIL', 'KENPOM_PW', 'KP_USER', 'KP_PW'];
  let saved;
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

  it('control: a raw axios error DOES carry the header and the POSTed password', async () => {
    const raw = await axios
      .post(base, `email=${EMAIL}&password=${PASSWORD}`, { headers: { Authorization: `Bearer ${KEY}` } })
      .then(() => null, (e) => e);
    const text = inspect(raw, { depth: Infinity });
    text.should.containEql(KEY);
    text.should.containEql(PASSWORD);
  });

  it('axiosTransport rejects with a sanitized error (name / message / code only)', async () => {
    const err = await toLocal({
      method: 'POST',
      url: base,
      headers: { Authorization: `Bearer ${KEY}`, Cookie: COOKIE },
      body: `password=${PASSWORD}`,
    }).then(() => null, (e) => e);
    should.exist(err);
    assertNoSecrets(err);
    err.code.should.be.a.String();
    should(err.config).be.undefined();
    should(err.request).be.undefined();
    should(err.response).be.undefined();
  });

  it('bearer family (pff_api): api_key never in AssetFetchError / cause', async () => {
    configure({ transport: { pff_api: toLocal }, retries: 0 });
    const err = await sdv.nfl.pffApiRefLeagues({ api_key: KEY }).then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    assertNoSecrets(err);
    assertDebuggableCause(err);
  });

  it('cookie family (kenpom, caller cookie): the cookie never in AssetFetchError / cause', async () => {
    configure({ transport: { kenpom: toLocal }, retries: 0 });
    const err = await sdv.mbb.kenpomRatings({ year: 2025, headers: { Cookie: COOKIE } }).then(() => null, (e) => e);
    err.should.be.instanceOf(AssetFetchError);
    assertNoSecrets(err);
    assertDebuggableCause(err);
  });

  it('POST-login family (kenpom password login): e-mail / password never in the auth failure / cause', async () => {
    process.env.KENPOM_EMAIL = EMAIL;
    process.env.KENPOM_PW = PASSWORD;
    const LOGIN_FORM = '<form action="handlers/login_handler.php"><input name="email"><input type="password" name="password"></form>';
    const site = async (req) =>
      req.method === 'GET' && req.url === 'https://kenpom.com/index.php' && !req.headers?.Cookie
        ? { status: 200, headers: { 'set-cookie': 'PHPSESSID=anon' }, data: LOGIN_FORM, url: req.url }
        : toLocal(req); // the login POST (and anything after) hits the dropping server
    configure({ transport: { kenpom: site }, retries: 0 });
    for (const call of [
      () => sdv.mbb.kenpomRatings({ year: 2025 }), // env credentials (family auth)
      () => sdv.mbb.kenpomRatings({ year: 2025, email: EMAIL, password: PASSWORD }), // explicit
    ]) {
      const err = await call().then(() => null, (e) => e);
      err.should.be.instanceOf(AssetFetchError);
      err.message.should.match(/auth failed/);
      assertNoSecrets(err);
      inspect(err, { depth: Infinity }).should.not.containEql(EMAIL);
      assertDebuggableCause(err);
    }
  });

  it('the impit transport sanitizes its rejections too', async () => {
    const realLoad = _impitLoader.load;
    _impitLoader.load = async () => ({
      Impit: class {
        async fetch() {
          const e = new Error('boom');
          e.code = 'ECONNRESET';
          e.config = { headers: { Authorization: `Bearer ${KEY}` }, data: `password=${PASSWORD}` };
          throw e;
        }
      },
    });
    try {
      const t = createImpersonatingTransport();
      const err = await t({ method: 'GET', url: base, headers: { Authorization: `Bearer ${KEY}` } }).then(() => null, (e) => e);
      assertNoSecrets(err);
      err.code.should.equal('ECONNRESET');
    } finally {
      _impitLoader.load = realLoad;
    }
  });

  it('safeCause keeps name / message / code / errno / syscall and redacts URL secrets', () => {
    const raw = Object.assign(new TypeError('GET https://x.test/a?apiKey=abc via http://u:pw@proxy:1 failed'), {
      code: 'E1', errno: -1, syscall: 'connect', config: { headers: { Authorization: 'Bearer z' } },
    });
    const c = safeCause(raw);
    c.name.should.equal('TypeError');
    c.message.should.equal('GET https://x.test/a?<redacted> via http://<redacted>@proxy:1 failed');
    c.code.should.equal('E1');
    c.errno.should.equal(-1);
    c.syscall.should.equal('connect');
    should(c.config).be.undefined();
    redactSecrets('no urls here').should.equal('no urls here');
  });
});

// A USER transport's own error text (a custom fetch wrapper, a proxy client)
// can echo the request it failed on. safeCause redacts credential-looking
// substrings in it; ordinary text must survive untouched. Synthetic values only.
describe('security: safeCause redacts credential-looking text, and only that', () => {
  // [text, the secret fragment that must not survive]
  const LEAKS = [
    ['Authorization: Bearer abc123.def456', 'abc123.def456'],
    ['{ "authorization": "Basic dXNlcjpwYXNz" }', 'dXNlcjpwYXNz'],
    ["headers: { Authorization: 'Token sk_live_9f8e7d' }", 'sk_live_9f8e7d'],
    ['authorization=SyntheticCredentialValue', 'SyntheticCredentialValue'],
    ['Proxy-Authorization: Basic Zm9vOmJhcg==', 'Zm9vOmJhcg=='],
    ['x-api-key: ak_live_123456789', 'ak_live_123456789'],
    ['sent bearer ak_live_0123456789abcdef upstream', 'ak_live_0123456789abcdef'],
    ['Bearer AbCdEfGhIjKlMnOpQrStUv', 'AbCdEfGhIjKlMnOpQrStUv'],
    ['token was eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl here', 'eyJzdWIiOiIxIn0'],
    ['unsigned eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0. token', 'eyJhbGciOiJub25lIn0'],
    ['POST body: email=a%40b.c&password=hunter2-Sekret!', 'hunter2-Sekret!'],
    ['clientKey=public&clientSecret=CZsyntheticSecret1', 'CZsyntheticSecret1'],
    ['access_token=ya29.synthetic&x=1', 'ya29.synthetic'],
    ['x_refresh_token=1//0gSynthetic', '1//0gSynthetic'],
    ['retrying with apiKey=0123456789abcdef', '0123456789abcdef'],
    ['form: PASSWORD=Upper.Case.Pw', 'Upper.Case.Pw'],
    ['{"password":"pa ss word","user":"x"}', 'pa ss word'],
    ["{ 'api_key': 'k-1234567' }", 'k-1234567'],
    ['Cookie: sid=s3cr3tSession; theme=dark', 's3cr3tSession'],
    ['set-cookie: JWT=abc.def.ghi; path=/', 'abc.def.ghi'],
    // camelCase token names
    ['accessToken=at-Synthetic-111', 'at-Synthetic-111'],
    ['?refreshToken=rt_Synthetic_222&x=1', 'rt_Synthetic_222'],
    ['sessionToken=st.Synthetic.333', 'st.Synthetic.333'],
    ['{"accessToken":"at Synthetic 444"}', 'at Synthetic 444'],
    ['{"id_token": "it-Synthetic-555"}', 'it-Synthetic-555'],
    // URL-encoded scheme / separators
    ['authorization=Bearer%20SyntheticTok666', 'SyntheticTok666'],
    ['authorization=Bearer+SyntheticTok667', 'SyntheticTok667'],
    ['Authorization%3A%20Bearer%20SyntheticTok668', 'SyntheticTok668'],
    ['email%3Da%40b.c%26password%3DSyntheticPw777', 'SyntheticPw777'],
    ['token%3DSyntheticTok888&next=1', 'SyntheticTok888'],
    // JWTs glued to a word or to `%3D`
    ['tokeneyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIn0.c2lnMg sent', 'eyJzdWIiOiIyIn0'],
    ['id_token%3DeyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzIn0.c2lnMw', 'eyJzdWIiOiIzIn0'],
    ['cb?jwt=xeyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0In0.c2lnNA#frag', 'eyJzdWIiOiI0In0'],
    // unquoted colon / spaced forms
    ['password: SyntheticPw999', 'SyntheticPw999'],
    ['token: SyntheticTok000', 'SyntheticTok000'],
    ['password = SyntheticPw121', 'SyntheticPw121'],
    ['client_secret : SyntheticCs131', 'SyntheticCs131'],
    // more header names
    ['X-Auth-Token: SyntheticXat141', 'SyntheticXat141'],
    ['x-access-token=SyntheticXac151', 'SyntheticXac151'],
    ['api-key: SyntheticApi161', 'SyntheticApi161'],
    ['Ocp-Apim-Subscription-Key: 0123456789abcdef0123', '0123456789abcdef0123'],
    // a bare Basic credential (base64 of user:password), and a long key=
    ['retry with Basic dXNlcjpwYXNz', 'dXNlcjpwYXNz'],
    ['key=0123456789abcdefSynthetic', '0123456789abcdefSynthetic'],
  ];
  const ORDINARY = [
    'nfl_api: auth failed (apply)',
    'Authorization failed for this route',
    'the Authorization header is missing',
    'Bearer token required',
    'Bearer undefined',
    'request timed out after 30000 ms',
    'connect ECONNREFUSED 127.0.0.1:443',
    'max_tokens=512 exceeded',
    'monkey=banana',
    'token budget exhausted; retry later',
    'password must be at least 8 characters',
    'missing required path parameter "key"',
    'eyJ is the prefix of a JWT header',
    'version 1.2.3-beta (build 42)',
    'GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard -> HTTP 503',
    'Authorization failed',
    'token expired',
    'max_tokens=512',
    'primary key=player_id',
    'key=value pair',
    'join on key: game_id',
    'Basic authentication required',
    'Basic realm="kenpom"',
    'access token expired; refresh token rotated',
    'sessionToken missing from the response',
    'heyJude.mp3 not found',
    'retrying http://example.test/path -> 503',
  ];

  it('redacts every credential in the matrix (message, stack and name)', () => {
    for (const [text, secret] of LEAKS) {
      const out = redactSecrets(text);
      out.should.not.containEql(secret, `leaked from: ${text}`);
      out.should.containEql('<redacted>');
      const err = new Error(text);
      err.name = `ProxyError ${text}`;
      const c = safeCause(err);
      for (const field of [c.message, c.stack, c.name]) field.should.not.containEql(secret);
    }
  });

  it('leaves ordinary text alone', () => {
    for (const text of ORDINARY) redactSecrets(text).should.equal(text);
  });

  it('is linear: 100 KB of adversarial input redacts in < 50 ms each (the old URL patterns took seconds)', () => {
    // runs of scheme characters, URL / JWT / header prefixes repeated with no terminator
    for (const unit of ['a-', 'a://', 'a://b/', 'eyJ', 'eyJa.', 'authorization=', 'password ', 'bearer ', '"password" ', 'x.']) {
      const text = unit.repeat(Math.ceil(100_000 / unit.length)).slice(0, 100_000);
      redactSecrets(text); // warm the regex compiler
      const t0 = performance.now();
      redactSecrets(text);
      (performance.now() - t0).should.be.below(50, `slow on ${JSON.stringify(unit)}`);
    }
  });

  it('a user transport that throws a leaky message: the AssetFetchError and its cause carry none of it', async () => {
    const realSleep = _timer.sleep;
    _timer.sleep = async () => {};
    try {
      const message = LEAKS.map(([text]) => text).join(' | ');
      configure({
        transport: {
          t_user: async () => {
            throw Object.assign(new Error(`proxy said: ${message}`), { code: 'EPROXY' });
          },
        },
      });
      const err = await request('t_user', { method: 'GET', url: 'https://example.test/x' }).then(
        () => null,
        (e) => e
      );
      err.should.be.instanceOf(AssetFetchError);
      err.cause.code.should.equal('EPROXY');
      const dumps = [inspect(err, { depth: Infinity, showHidden: true }), String(err.stack), String(err.cause.stack)];
      for (const d of dumps) for (const [, secret] of LEAKS) d.should.not.containEql(secret);
    } finally {
      _timer.sleep = realSleep;
      resetConfig();
    }
  });
});
