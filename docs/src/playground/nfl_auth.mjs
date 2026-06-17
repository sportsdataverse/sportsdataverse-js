// Dependency-free, fetch-based port of the package's NFL.com "Shield" token auth
// (src/core/nfl_auth.ts) for the docs playground proxy. The package version uses
// axios; the Vercel serverless function (docs/api/run.mjs) has only global
// `fetch`, so this is a parallel minimal implementation — kept tiny + dep-free
// for the same reason resolve.mjs is a parallel port of the resolver.
//
// NFL.com mints an anonymous bearer token from `/identity/v3/token` using the
// public `WEB_DESKTOP` web-app client credentials shipped in every browser's JS
// bundle (NOT a personal account). The token is cached in-process and reused
// until ~2 min before its JWT `exp`, then transparently re-minted. The minted
// bearer never leaves the server — only the resolved JSON is returned to the
// browser.

export const NFL_API_HOST = 'https://api.nfl.com';

// Public WEB_DESKTOP client credentials (shipped in the site's JS bundle).
const DEFAULT_CLIENT_KEY = '4cFUW6DmwJpzT9L7LrG3qRAcABG5s04g';
const DEFAULT_CLIENT_SECRET = 'CZuvCL49d9OwfGsR';
// base64({"model":"desktop","osName":"Windows","osVersion":"10","version":"Chrome"})
const DEFAULT_DEVICE_INFO =
  'eyJtb2RlbCI6ImRlc2t0b3AiLCJvc05hbWUiOiJXaW5kb3dzIiwib3NWZXJzaW9uIjoiMTAiLCJ2ZXJzaW9uIjoiQ2hyb21lIn0=';
const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Renew this many seconds before the JWT's own `exp` so a call never races expiry.
const TOKEN_SKEW_SECONDS = 120;
// Conservative lifetime used only when a token's `exp` claim can't be parsed.
const TOKEN_FALLBACK_TTL = 300;

// In-process token cache so back-to-back proxy calls share one minted token.
let tokenCache = null;

/** base64url -> Buffer (Node Buffer handles the `-_` alphabet + missing padding). */
function b64urlDecode(segment) {
  const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
  return Buffer.from(padded, 'base64url');
}

/** Best-effort read of a JWT's `exp` claim (unix seconds); `null` if unparseable. */
export function jwtExp(token) {
  try {
    const payloadSeg = String(token).split('.')[1];
    if (!payloadSeg) return null;
    const claims = JSON.parse(b64urlDecode(payloadSeg).toString('utf8'));
    const exp = claims?.exp;
    return exp === undefined || exp === null ? null : Number(exp);
  } catch {
    return null;
  }
}

/** POST the anonymous device-token grant and return the bearer `accessToken`. */
async function mintToken(key, secret) {
  const body = new URLSearchParams({
    clientKey: key,
    clientSecret: secret,
    deviceId: globalThis.crypto.randomUUID(),
    deviceInfo: DEFAULT_DEVICE_INFO,
    networkType: 'other',
  });
  const res = await fetch(`${NFL_API_HOST}/identity/v3/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': DEFAULT_UA,
      'X-Domain-Id': '100',
    },
    body: body.toString(),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  const token = data?.accessToken;
  if (typeof token !== 'string' || !token) {
    throw new Error('nfl_auth: /identity/v3/token response missing accessToken');
  }
  return token;
}

/** Drop the cached token (forces a fresh mint on the next call). */
export function nflClearTokenCache() {
  tokenCache = null;
}

/**
 * Return a valid `api.nfl.com` bearer token, minting + caching as needed.
 * `NFL_ACCESS_TOKEN` (env) is returned verbatim when set; otherwise mints with
 * `NFL_CLIENT_KEY`/`NFL_CLIENT_SECRET` (env) or the bundled public defaults.
 */
export async function nflTokenGen() {
  const envToken = process.env.NFL_ACCESS_TOKEN;
  if (envToken) return envToken;

  const key = process.env.NFL_CLIENT_KEY || DEFAULT_CLIENT_KEY;
  const secret = process.env.NFL_CLIENT_SECRET || DEFAULT_CLIENT_SECRET;
  const now = Date.now() / 1000;

  if (
    tokenCache &&
    tokenCache.key === key &&
    tokenCache.secret === secret &&
    tokenCache.exp - TOKEN_SKEW_SECONDS > now
  ) {
    return tokenCache.token;
  }

  const token = await mintToken(key, secret);
  const exp = jwtExp(token);
  tokenCache = { token, key, secret, exp: exp ?? now + TOKEN_FALLBACK_TTL };
  return token;
}

/** Build the request-header dict expected by `api.nfl.com` (with bearer token). */
export async function nflHeadersGen(token) {
  const bearer = token ?? (await nflTokenGen());
  return {
    'User-Agent': DEFAULT_UA,
    Accept: 'application/json',
    Referer: 'https://www.nfl.com/',
    Origin: 'https://www.nfl.com',
    Authorization: `Bearer ${bearer}`,
    'X-Domain-Id': '100',
  };
}

// Per-family auth-header providers, keyed by the flat `api` stem — mirrors
// AUTH_HEADER_PROVIDERS in src/leagues/_make_flat.ts. The proxy resolves a flat
// wrapper's headers through this map when the wrapper is `auth`-gated.
export const AUTH_HEADER_PROVIDERS = {
  nfl_api: nflHeadersGen,
};
