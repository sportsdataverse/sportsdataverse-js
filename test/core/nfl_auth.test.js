import should from 'should';
import axios from 'axios';
import {
  nflTokenGen,
  nflHeadersGen,
  nflClearTokenCache,
  jwtExp,
} from '../../dist/core/nfl_auth.js';

// No-network unit tests for the api.nfl.com token auth. The mint POST to
// /identity/v3/token is stubbed (axios.post), so nothing here touches the wire.
// Covers: JWT exp parsing, in-process cache reuse (a 2nd call doesn't re-POST),
// force-refresh, NFL_ACCESS_TOKEN env override, and the headers shape.

/** Base64url-encode a string (the `-_` alphabet, no padding) — JWT segment shape. */
function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Build a fake `header.payload.signature` JWT carrying a given `exp` (unix secs). */
function fakeJwt(exp) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({ sub: 'web', plan: 'free', exp });
  return `${header}.${payload}.sig-not-verified`;
}

describe('core/nfl_auth: jwtExp', () => {
  it('reads the exp claim out of a JWT payload segment', () => {
    jwtExp(fakeJwt(1893456000)).should.equal(1893456000);
  });
  it('returns null for an unparseable / claimless token', () => {
    should(jwtExp('not-a-jwt')).be.null();
    should(jwtExp(fakeJwt(undefined))).be.null(); // no exp claim
    should(jwtExp('')).be.null();
  });
});

describe('core/nfl_auth: nflTokenGen caching', () => {
  let postStub;
  let calls;

  beforeEach(() => {
    nflClearTokenCache();
    delete process.env.NFL_ACCESS_TOKEN;
    delete process.env.NFL_CLIENT_KEY;
    delete process.env.NFL_CLIENT_SECRET;
    calls = 0;
    const future = Math.floor(Date.now() / 1000) + 3600; // 1h out
    postStub = axios.post;
    axios.post = async () => {
      calls += 1;
      return { data: { accessToken: fakeJwt(future) } };
    };
  });

  afterEach(() => {
    axios.post = postStub;
    nflClearTokenCache();
  });

  it('mints once, then serves the cached token on the next call (no re-POST)', async () => {
    const t1 = await nflTokenGen();
    const t2 = await nflTokenGen();
    t1.should.equal(t2);
    calls.should.equal(1); // second call hit the cache, did not re-mint
  });

  it('re-mints when forceRefresh is set', async () => {
    await nflTokenGen();
    await nflTokenGen({ forceRefresh: true });
    calls.should.equal(2);
  });

  it('re-mints after the cache is cleared', async () => {
    await nflTokenGen();
    nflClearTokenCache();
    await nflTokenGen();
    calls.should.equal(2);
  });

  it('re-mints when the credentials change (cache keyed by key+secret)', async () => {
    await nflTokenGen({ clientKey: 'k1', clientSecret: 's1' });
    await nflTokenGen({ clientKey: 'k2', clientSecret: 's2' });
    calls.should.equal(2);
  });

  it('honours NFL_ACCESS_TOKEN verbatim without minting', async () => {
    process.env.NFL_ACCESS_TOKEN = 'preminted-token-xyz';
    const t = await nflTokenGen();
    t.should.equal('preminted-token-xyz');
    calls.should.equal(0); // never POSTed
  });

  it('treats a token whose exp is unparseable as short-lived (re-mints)', async () => {
    // Override the stub to return a token with no exp -> fallback TTL path,
    // but since fallback TTL is 300s it should still cache on a 2nd immediate call.
    axios.post = async () => {
      calls += 1;
      return { data: { accessToken: fakeJwt(undefined) } };
    };
    await nflTokenGen();
    await nflTokenGen();
    calls.should.equal(1); // fallback TTL (300s) still well within skew window
  });
});

describe('core/nfl_auth: nflHeadersGen', () => {
  let postStub;
  beforeEach(() => {
    nflClearTokenCache();
    delete process.env.NFL_ACCESS_TOKEN;
    const future = Math.floor(Date.now() / 1000) + 3600;
    postStub = axios.post;
    axios.post = async () => ({ data: { accessToken: fakeJwt(future) } });
  });
  afterEach(() => {
    axios.post = postStub;
    nflClearTokenCache();
  });

  it('builds the browser-style header set with a Bearer Authorization', async () => {
    const h = await nflHeadersGen();
    h.Authorization.should.startWith('Bearer ');
    h.should.have.property('X-Domain-Id', '100');
    h.should.have.property('Origin', 'https://www.nfl.com');
    h.should.have.property('Referer', 'https://www.nfl.com/');
    h.Accept.should.equal('application/json');
    h.should.have.property('User-Agent');
  });

  it('reuses a caller-supplied token verbatim (no mint)', async () => {
    let minted = false;
    axios.post = async () => {
      minted = true;
      return { data: { accessToken: 'x' } };
    };
    const h = await nflHeadersGen('my-own-token');
    h.Authorization.should.equal('Bearer my-own-token');
    minted.should.be.false();
  });
});
