// 247Sports runtime for the vendored `sports247` (Recruit Database, RDB) and
// `sports247_site_pages` (247sports.com `*.json` page models) flat families.
// Port of sdv-py `sportsdataverse/cfb/sports247_runtime.py` +
// `sports247_site_pages_runtime.py` (pin 719de79).
//
// * Browser-TLS impersonation — the Fastly edge fingerprint-blocks plain HTTP
//   clients on both hosts (0-byte 403), so both families default to the
//   impersonating transport (optional peer dependency `impit`; without it every
//   call rejects with TransportUnavailableError + install guidance).
// * Guest JWT (`sports247` only) — `GET https://247sports.com/` sets a `JWT`
//   cookie with no login (~12 h TTL). It is minted lazily, cached until shortly
//   before its `exp`, sent as `Authorization: Bearer`, and re-minted once on a
//   401 or (as sdv-py) a 403. The 13 RDB routes that need a logged-in session
//   (the guest token still 403s) are not wrapped, as in sdv-py.
// * `sports247_site_pages` is auth-free; its `.json` URLs are sent verbatim.
//
// As in sdv-py, a failed mint falls back to an unauthenticated request (one
// warning per process). Delta by the JS core contract: a failed fetch raises
// NoDataError / AssetFetchError instead of returning `{}`.
//
// Importing this module registers both families' defaults (transport, auth,
// retry statuses); `configure({ transport: { sports247 }, auth: { sports247 } })`
// replaces them.

import { tokenAuth, type AuthContext, type AuthProvider } from "./auth.js";
import { DEFAULT_RETRY_STATUSES, registerFamilyDefaults, resolveFamily } from "./config.js";
import { AssetFetchError, SdvError } from "./errors.js";
import { jwtExp } from "./nfl_auth.js";
import { request } from "./request.js";
import { createImpersonatingTransport, headerValue, mergeHeaders, type TransportResponse } from "./transport.js";

/** Site root whose response sets the guest `JWT` cookie. */
export const SPORTS247_SITE_ROOT = "https://247sports.com/";

/** The impit browser profile both families impersonate (see the transport below). */
const IMPIT_PROFILE = "chrome142";

/**
 * sdv-py `rdb_headers()` / `site_headers()` (identical), except the User-Agent:
 * it is the one impit's {@link IMPIT_PROFILE} profile itself sends, so the UA
 * agrees with the TLS fingerprint and the `sec-ch-ua` hints (sdv-py pairs a
 * Chrome/124 UA with curl_cffi's newer Chrome TLS).
 */
export const SPORTS247_HEADERS: Readonly<Record<string, string>> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://247sports.com/",
  Origin: "https://247sports.com",
};

/** The `JWT` cookie value from a (newline-joined) `set-cookie` header, if any. */
export function guestJwtFromSetCookie(setCookie: string | undefined): string | undefined {
  for (const line of (setCookie ?? "").split("\n")) {
    const m = /^\s*JWT=([^;]*)/.exec(line);
    if (m && m[1]) return m[1];
  }
  return undefined;
}

/**
 * Mint a guest bearer JWT: `GET https://247sports.com/` and read its `JWT`
 * cookie. Single attempt, like sdv-py's `_mint_guest_jwt`; throws
 * AssetFetchError when the root fails (network included) or sets no cookie,
 * and passes a TransportUnavailableError through when `impit` is missing.
 */
async function mintGuestJwt(ctx: AuthContext): Promise<{ token: string; expiresAt?: number }> {
  let res: TransportResponse;
  try {
    res = await ctx.transport({
      method: "GET",
      url: SPORTS247_SITE_ROOT,
      headers: { ...SPORTS247_HEADERS },
      timeoutMs: 30000,
      responseType: "text",
    });
  } catch (err) {
    if (err instanceof SdvError) throw err;
    throw new AssetFetchError(`${ctx.family}: guest JWT mint failed (GET ${SPORTS247_SITE_ROOT}: network)`, {
      url: SPORTS247_SITE_ROOT,
      cause: err,
    });
  }
  const ok = res.status >= 200 && res.status < 300;
  const token = ok ? guestJwtFromSetCookie(res.headers["set-cookie"]) : undefined;
  if (!token) {
    throw new AssetFetchError(
      `${ctx.family}: guest JWT mint failed (GET ${SPORTS247_SITE_ROOT} -> HTTP ${res.status}${ok ? ", no JWT cookie" : ""})`,
      { url: SPORTS247_SITE_ROOT, status: res.status }
    );
  }
  return { token, expiresAt: jwtExp(token) ?? undefined };
}

/** After a failed mint, calls go out tokenless for this long before minting again. */
const MINT_COOLDOWN_MS = 60_000;
let lastMintFailure: { at: number; err: AssetFetchError } | undefined;

/**
 * {@link mintGuestJwt} with a cooldown: during an outage every call would
 * otherwise re-try the site root first. Within {@link MINT_COOLDOWN_MS} of a
 * failed mint the same failure is rethrown without a request.
 * ponytail: fixed cooldown, no exponential backoff; add one if outages outlast it.
 */
async function mintWithCooldown(ctx: AuthContext): Promise<{ token: string; expiresAt?: number }> {
  if (lastMintFailure && Date.now() - lastMintFailure.at < MINT_COOLDOWN_MS) throw lastMintFailure.err;
  try {
    const minted = await mintGuestJwt(ctx);
    lastMintFailure = undefined;
    return minted;
  } catch (err) {
    if (err instanceof AssetFetchError) lastMintFailure = { at: Date.now(), err };
    throw err;
  }
}

let tokens = tokenAuth({ mint: mintWithCooldown });
let warnedMintFailure = false;

/**
 * The `sports247` auth provider: a cached, auto-renewed guest bearer JWT. As in
 * sdv-py, a failed mint does not fail the call: the request goes out WITHOUT a
 * token (public routes still answer) and one warning per process names the
 * failure; the mint is not re-tried for a minute. A route that needs the token
 * then fails loudly — its 401 triggers one refresh, whose failed mint throws —
 * or with a 403 AssetFetchError.
 */
export const sports247Auth: AuthProvider = {
  async apply(req, ctx) {
    try {
      return await tokens.apply(req, ctx);
    } catch (err) {
      if (!(err instanceof AssetFetchError)) throw err;
      if (!warnedMintFailure) {
        warnedMintFailure = true;
        process.emitWarning(
          `${err.message}; continuing without a token (routes that need one will fail).`
        );
      }
      return req;
    }
  },
  refresh: (ctx) => tokens.refresh!(ctx),
};

/**
 * Drop the cached 247Sports guest JWT and any mint-failure state (the next
 * `sports247` call mints a fresh one, and warns again if that fails).
 */
export function sports247ClearTokenCache(): void {
  tokens = tokenAuth({ mint: mintWithCooldown });
  lastMintFailure = undefined;
  warnedMintFailure = false;
}

/**
 * GET an ipa.247sports.com RDB route (flat-dispatch getter). Adds the browser
 * headers (caller `headers` win) and the trailing slash the RDB 301s without.
 * As sdv-py does, a 403 re-mints the guest JWT once and retries (an expired or
 * revoked guest token can answer 403, not only 401) — unless the caller sent
 * its own `Authorization` or replaced this family's auth.
 *
 * @throws NoDataError on 404; AssetFetchError on any other failed fetch or mint.
 */
export async function sports247Get(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<unknown> {
  const req = {
    method: "GET" as const,
    url: url.endsWith("/") ? url : `${url}/`,
    query: config.params,
    headers: mergeHeaders(SPORTS247_HEADERS, config.headers),
  };
  try {
    return await request("sports247", req);
  } catch (err) {
    if (!(err instanceof AssetFetchError) || err.status !== 403) throw err;
    const { auth, transport } = resolveFamily("sports247");
    if (auth !== sports247Auth || headerValue(req.headers, "authorization") !== undefined) throw err;
    try {
      await sports247Auth.refresh!({ family: "sports247", transport, request: req });
    } catch {
      throw err; // no fresh token to try: the 403 is the answer
    }
    return request("sports247", req);
  }
}

/**
 * GET a 247sports.com `*.json` page-model route (flat-dispatch getter). No
 * auth, URL sent verbatim (a trailing slash would 404).
 *
 * @throws NoDataError on 404; AssetFetchError on any other failed fetch.
 */
export async function sports247SitePagesGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<unknown> {
  return request("sports247_site_pages", {
    method: "GET",
    url,
    query: config.params,
    headers: mergeHeaders(SPORTS247_HEADERS, config.headers),
  });
}

// ponytail: pinned profile — impit's bare "chrome" (chrome124) gets HTTP 406
// from the 247sports.com `.json` edge (probed 2026-10-05; chrome131+ and firefox
// pass). Bump when the edge starts rejecting this one.
const transport = createImpersonatingTransport({ browser: IMPIT_PROFILE });
// 403 here is the fingerprint block or a logged-in-only route — never load.
const retryStatuses = DEFAULT_RETRY_STATUSES.filter((s) => s !== 403);
registerFamilyDefaults("sports247", { transport, auth: sports247Auth, retryStatuses });
registerFamilyDefaults("sports247_site_pages", { transport, retryStatuses });
