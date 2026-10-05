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
//   401. The 13 RDB routes that need a logged-in session (the guest token still
//   403s) are not wrapped, as in sdv-py.
// * `sports247_site_pages` is auth-free; its `.json` URLs are sent verbatim.
//
// Deltas from sdv-py, by the JS core contract: a failed mint THROWS (sdv-py
// falls back to an unauthenticated request), and a failed fetch raises
// NoDataError / AssetFetchError instead of returning `{}`.
//
// Importing this module registers both families' defaults (transport, auth,
// retry statuses); `configure({ transport: { sports247 }, auth: { sports247 } })`
// replaces them.

import { tokenAuth, type AuthContext, type AuthProvider } from "./auth.js";
import { DEFAULT_RETRY_STATUSES, registerFamilyDefaults } from "./config.js";
import { AssetFetchError } from "./errors.js";
import { jwtExp } from "./nfl_auth.js";
import { request } from "./request.js";
import { createImpersonatingTransport, mergeHeaders } from "./transport.js";

/** Site root whose response sets the guest `JWT` cookie. */
export const SPORTS247_SITE_ROOT = "https://247sports.com/";

/** sdv-py `rdb_headers()` / `site_headers()` (identical), verbatim. */
export const SPORTS247_HEADERS: Readonly<Record<string, string>> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
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
 * AssetFetchError when the root fails or sets no cookie (and passes a
 * TransportUnavailableError through when `impit` is missing).
 */
async function mintGuestJwt(ctx: AuthContext): Promise<{ token: string; expiresAt?: number }> {
  const res = await ctx.transport({
    method: "GET",
    url: SPORTS247_SITE_ROOT,
    headers: { ...SPORTS247_HEADERS },
    timeoutMs: 30000,
    responseType: "text",
  });
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

let tokens = tokenAuth({ mint: mintGuestJwt });

/** The `sports247` auth provider: a cached, auto-renewed guest bearer JWT. */
export const sports247Auth: AuthProvider = {
  apply: (req, ctx) => tokens.apply(req, ctx),
  refresh: (ctx) => tokens.refresh!(ctx),
};

/** Drop the cached 247Sports guest JWT (the next `sports247` call mints a fresh one). */
export function sports247ClearTokenCache(): void {
  tokens = tokenAuth({ mint: mintGuestJwt });
}

/**
 * GET an ipa.247sports.com RDB route (flat-dispatch getter). Adds the browser
 * headers (caller `headers` win) and the trailing slash the RDB 301s without.
 *
 * @throws NoDataError on 404; AssetFetchError on any other failed fetch or mint.
 */
export async function sports247Get(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<unknown> {
  return request("sports247", {
    method: "GET",
    url: url.endsWith("/") ? url : `${url}/`,
    query: config.params,
    headers: mergeHeaders(SPORTS247_HEADERS, config.headers),
  });
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
const transport = createImpersonatingTransport({ browser: "chrome142" });
// 403 here is the fingerprint block or a logged-in-only route — never load.
const retryStatuses = DEFAULT_RETRY_STATUSES.filter((s) => s !== 403);
registerFamilyDefaults("sports247", { transport, auth: sports247Auth, retryStatuses });
registerFamilyDefaults("sports247_site_pages", { transport, retryStatuses });
