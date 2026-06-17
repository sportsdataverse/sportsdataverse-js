// NFL.com "Shield" API (`api.nfl.com`) token auth. Port of the Python
// `sportsdataverse/nfl/nfl_games.py` (`_mint_token`, `_jwt_exp`, `nfl_token_gen`,
// `nfl_headers_gen`) + `nfl_api_runtime.py` getter.
//
// NFL.com mints an anonymous bearer token from `/identity/v3/token` using the
// public `WEB_DESKTOP` web-app client credentials it ships in every browser's JS
// bundle (NOT a personal account). The token is cached in-process and reused
// until ~2 min before its JWT `exp`, then transparently re-minted.
//
// Env overrides (all optional):
//   - `NFL_ACCESS_TOKEN`              — returned verbatim (skips minting + caching).
//   - `NFL_CLIENT_KEY` / `NFL_CLIENT_SECRET` — mint with these instead of defaults.

import axios from "axios";

export const NFL_API_HOST = "https://api.nfl.com";

// NFL.com web-app (WEB_DESKTOP) client credentials — shipped publicly in the
// site's JS bundle; overridable via env vars / args. NOT a personal account.
const DEFAULT_CLIENT_KEY = "4cFUW6DmwJpzT9L7LrG3qRAcABG5s04g";
const DEFAULT_CLIENT_SECRET = "CZuvCL49d9OwfGsR";
// base64({"model":"desktop","osName":"Windows","osVersion":"10","version":"Chrome"})
const DEFAULT_DEVICE_INFO =
  "eyJtb2RlbCI6ImRlc2t0b3AiLCJvc05hbWUiOiJXaW5kb3dzIiwib3NWZXJzaW9uIjoiMTAiLCJ2ZXJzaW9uIjoiQ2hyb21lIn0=";
const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Renew this many seconds before the JWT's own `exp` so a call never races expiry.
const TOKEN_SKEW_SECONDS = 120;
// Conservative lifetime used only when a token's `exp` claim can't be parsed.
const TOKEN_FALLBACK_TTL = 300;

/** Cached minted token (keyed by the resolving client key+secret). */
interface TokenCacheEntry {
  token: string;
  key: string;
  secret: string;
  exp: number; // unix seconds
}

// In-process token cache so back-to-back wrapper calls share one minted token
// instead of POSTing to `/identity/v3/token` every time.
let tokenCache: TokenCacheEntry | null = null;

/** Options for {@link nflTokenGen}. */
export interface NflTokenOptions {
  /** Override the client key (else `NFL_CLIENT_KEY`, else the web default). */
  clientKey?: string;
  /** Override the client secret (else `NFL_CLIENT_SECRET`, else the default). */
  clientSecret?: string;
  /** Mint a new token even if a cached one is still valid. */
  forceRefresh?: boolean;
}

/** base64url -> Uint8Array (Node Buffer handles the `-_` alphabet + missing padding). */
function b64urlDecode(segment: string): Buffer {
  const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
  return Buffer.from(padded, "base64url");
}

/**
 * Best-effort read of a JWT's `exp` claim (unix seconds); `null` if unparseable.
 *
 * The token is `header.payload.signature`; the payload segment is base64url
 * decoded and its `exp` claim returned. No signature verification — only the
 * expiry is needed to schedule renewal. Exported for unit testing.
 */
export function jwtExp(token: string): number | null {
  try {
    const payloadSeg = token.split(".")[1];
    if (!payloadSeg) return null;
    const claims = JSON.parse(b64urlDecode(payloadSeg).toString("utf8"));
    const exp = claims?.exp;
    return exp === undefined || exp === null ? null : Number(exp);
  } catch {
    // any decode/parse failure -> unknown expiry
    return null;
  }
}

/** POST the anonymous device-token grant and return the bearer `accessToken`. */
async function mintToken(key: string, secret: string): Promise<string> {
  const body = new URLSearchParams({
    clientKey: key,
    clientSecret: secret,
    deviceId: cryptoRandomUuid(),
    deviceInfo: DEFAULT_DEVICE_INFO,
    networkType: "other",
  });
  const res = await axios.post(`${NFL_API_HOST}/identity/v3/token`, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": DEFAULT_UA,
      "X-Domain-Id": "100",
    },
    timeout: 30000,
  });
  const token = res?.data?.accessToken;
  if (typeof token !== "string" || !token) {
    throw new Error("nfl_auth: /identity/v3/token response missing accessToken");
  }
  return token;
}

/** UUID v4, using the Web Crypto API available on Node >= 20.18.1. */
function cryptoRandomUuid(): string {
  return globalThis.crypto.randomUUID();
}

/** Drop the cached `api.nfl.com` token (forces a fresh mint on the next call). */
export function nflClearTokenCache(): void {
  tokenCache = null;
}

/**
 * Return a valid `api.nfl.com` bearer token, minting + caching as needed.
 *
 * The token is cached in-process and reused until ~2 min before its own JWT
 * `exp`, then transparently re-minted — so callers never have to think about
 * expiry or refresh. The first call (or any call after expiry / `forceRefresh`)
 * mints a fresh token via the anonymous device-token grant at
 * `/identity/v3/token`.
 *
 * Resolution order (all overrides optional):
 *   1. `NFL_ACCESS_TOKEN` env var — returned verbatim, skipping minting +
 *      caching. Ignored if explicit credentials are passed.
 *   2. Credentials: explicit `clientKey`/`clientSecret` opts -> `NFL_CLIENT_KEY`
 *      / `NFL_CLIENT_SECRET` env vars -> the bundled public `WEB_DESKTOP` pair.
 */
export async function nflTokenGen(opts: NflTokenOptions = {}): Promise<string> {
  const { clientKey, clientSecret, forceRefresh = false } = opts;

  // 1. A user-supplied token via env wins outright, unless explicit credentials
  //    were passed (which mean "mint with these").
  if (clientKey === undefined && clientSecret === undefined) {
    const envToken = process.env.NFL_ACCESS_TOKEN;
    if (envToken) return envToken;
  }

  // 2. Resolve credentials, then serve a cached token or mint a fresh one.
  const key = clientKey ?? process.env.NFL_CLIENT_KEY ?? DEFAULT_CLIENT_KEY;
  const secret =
    clientSecret ?? process.env.NFL_CLIENT_SECRET ?? DEFAULT_CLIENT_SECRET;
  const now = Date.now() / 1000;

  if (
    !forceRefresh &&
    tokenCache &&
    tokenCache.key === key &&
    tokenCache.secret === secret &&
    tokenCache.exp - TOKEN_SKEW_SECONDS > now
  ) {
    return tokenCache.token;
  }

  const token = await mintToken(key, secret);
  const exp = jwtExp(token);
  tokenCache = {
    token,
    key,
    secret,
    exp: exp ?? now + TOKEN_FALLBACK_TTL,
  };
  return token;
}

/**
 * Build the request-header dict expected by `api.nfl.com`.
 *
 * Obtains a bearer token via {@link nflTokenGen} (which caches + auto-renews, or
 * honors `NFL_ACCESS_TOKEN`) unless `token` is supplied, and combines it with the
 * browser-style headers the NFL.com web app sends.
 *
 * @param token An existing access token to reuse; mints/caches one when omitted.
 */
export async function nflHeadersGen(
  token?: string
): Promise<Record<string, string>> {
  const bearer = token ?? (await nflTokenGen());
  return {
    "User-Agent": DEFAULT_UA,
    Accept: "application/json",
    Referer: "https://www.nfl.com/",
    Origin: "https://www.nfl.com",
    Authorization: `Bearer ${bearer}`,
    "X-Domain-Id": "100",
  };
}
