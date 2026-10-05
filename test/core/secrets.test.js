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
import { _timer } from '../../dist/core/request.js';
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
