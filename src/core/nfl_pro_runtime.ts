// NFL Pro (`https://pro.nfl.com`) runtime. Port of sdv-py's
// `sportsdataverse/nfl/nflpro_runtime.py`.
//
// pro.nfl.com serves the Next Gen Stats tables nextgenstats.nfl.com stopped
// serving. `/api/secured/*` needs a USER-BOUND bearer token carrying an ACTIVE
// `NFL_PLUS_*` plan: a client-credentials token is not user-bound and 401s on
// every route, so nothing here mints one. The token comes from:
//   1. an `Authorization` header in the call's `headers`,
//   2. `token` on the call,
//   3. env `NFLPRO_TOKEN`,
// and is checked (plan + expiry, from its JWT claims) before any request.
// sdv-py can also obtain the token by driving a headless-browser login
// (NFLPRO_EMAIL / NFLPRO_PW, optional Playwright); that is not ported here —
// pass a token, or plug your own minting in with
// `configure({ auth: { nfl_pro: tokenAuth({ mint }) } })`.
//
// Two measured API behaviours handled here:
//   - an unsupported query param answers HTTP 200 with an EMPTY body (no error
//     envelope) -> InvalidParameterError;
//   - responses truncate silently at the page size, so the getter pages on
//     `offset` until it holds the envelope's own `total` rows.
//
// Importing this module registers the `nfl_pro` family defaults.

import { isDeepStrictEqual } from "node:util";
import { bearerAuth } from "./auth.js";
import { registerFamilyDefaults } from "./config.js";
import { AssetFetchError, InvalidParameterError, SdvError } from "./errors.js";
import { request } from "./request.js";
import { headerValue, mergeHeaders } from "./transport.js";
import { NFL_PRO_COLLECTION_KEYS } from "../parsers/nfl_pro.js";

const FAMILY = "nfl_pro";
export const NFL_PRO_HOST = "https://pro.nfl.com";
const TOKEN_ENV = "NFLPRO_TOKEN";
const MAX_PAGES = 40;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Raised when no usable (user-bound, entitled, unexpired) NFL Pro token resolves. */
export class NflProAuthError extends SdvError {}

/** A JWT's payload claims (no signature check — we only read our own token). */
function claims(token: string): Record<string, any> {
  const part = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

/**
 * True if the token carries an ACTIVE `NFL_PLUS_*` plan. An anonymous token and
 * one minted with a Gigya UID have identical claims, so "the login worked"
 * proves nothing — only the plan distinguishes a user-bound token.
 */
export function nflProTokenEntitled(token: string): boolean {
  let plans: unknown;
  try {
    plans = claims(token).plans;
  } catch {
    return false;
  }
  if (!Array.isArray(plans)) return false;
  return plans.some(
    (p) =>
      p !== null &&
      typeof p === "object" &&
      String(p.plan ?? "").startsWith("NFL_PLUS") &&
      // an expired subscription still lists its plan; only ACTIVE grants access
      String(p.status ?? "ACTIVE").toUpperCase() === "ACTIVE"
  );
}

/** True if the token's `exp` is more than `skew` seconds away. */
export function nflProTokenFresh(token: string, skew = 120): boolean {
  try {
    return Number(claims(token).exp ?? 0) - skew > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * Resolve a usable NFL Pro token: `token`, else env `NFLPRO_TOKEN`; it must be
 * entitled and unexpired. Throws {@link NflProAuthError} (no request is made).
 */
export function nflProToken(token?: string): string {
  const t = (token ?? "").trim() || (process.env[TOKEN_ENV] ?? "").trim();
  if (!t) {
    throw new NflProAuthError(
      `nfl_pro: no NFL Pro token — pass token, or set ${TOKEN_ENV} to a user-bound pro.nfl.com ` +
        "access token (an NFL+ Premium account; client-credentials tokens are not user-bound)."
    );
  }
  if (!nflProTokenEntitled(t)) {
    throw new NflProAuthError(
      "nfl_pro: the NFL Pro token carries no active NFL_PLUS_* plan, so every /api/secured/* route " +
        "would 401. A client-credentials token is not user-bound."
    );
  }
  if (!nflProTokenFresh(t)) {
    throw new NflProAuthError(`nfl_pro: the NFL Pro token has expired — obtain a fresh one (${TOKEN_ENV}).`);
  }
  return t;
}

/** Bearer from `NFLPRO_TOKEN`; an `Authorization` header (or `token`, set by the getter) wins. */
export const nflProAuth = bearerAuth(() => nflProToken());

const isObject = (v: unknown): v is Record<string, any> => v !== null && typeof v === "object" && !Array.isArray(v);

/** The envelope key holding the records: a known collection name, else the longest list. */
function collectionKey(body: Record<string, any>): string | undefined {
  for (const key of NFL_PRO_COLLECTION_KEYS) if (Array.isArray(body[key])) return key;
  let best: string | undefined;
  for (const [k, v] of Object.entries(body)) {
    if (Array.isArray(v) && (best === undefined || v.length > body[best].length)) best = k;
  }
  return best;
}

/**
 * GET a `pro.nfl.com` payload, authenticating and de-truncating. The flat
 * dispatch calls this for every `nfl_pro_*` wrapper; `args` are the caller's
 * params (`token`, `paginate` (default true), `max_pages` (default 40)).
 */
export async function nflProGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string>; family: string; args?: Record<string, any> }
): Promise<unknown> {
  const args = config.args ?? {};
  let headers = mergeHeaders(
    { "User-Agent": USER_AGENT, Referer: `${NFL_PRO_HOST}/`, Accept: "application/json, text/plain, */*" },
    config.headers
  );
  if (headerValue(headers, "authorization") === undefined && args.token) {
    headers = mergeHeaders(headers, { Authorization: `Bearer ${nflProToken(String(args.token))}` });
  }
  // sdv-py sends its `bool` params (`qualifiedPasser`, …) through requests,
  // which writes Python's str(): "True" / "False" — send exactly that.
  // ponytail: unverified live (no token); matches py byte-for-byte on the wire.
  const clean = Object.fromEntries(
    Object.entries(config.params ?? {}).map(([k, v]) => [k, typeof v === "boolean" ? (v ? "True" : "False") : v])
  );
  const fetchPage = async (query: Record<string, unknown>): Promise<unknown> => {
    const text = await request(config.family, { method: "GET", url, query, headers, responseType: "text", timeoutMs: 45000 });
    const s = typeof text === "string" ? text : "";
    if (!s.trim()) {
      throw new InvalidParameterError(
        `${FAMILY}: pro.nfl.com returned HTTP 200 with an empty body for ${url} — how this API rejects ` +
          "unsupported query params (note: `week` is a path scope, not a query param).",
        { url, status: 200 }
      );
    }
    try {
      return JSON.parse(s);
    } catch (err) {
      throw new AssetFetchError(`${FAMILY}: HTTP 200 with a non-JSON body: ${url}`, { url, status: 200, cause: err });
    }
  };

  const first = await fetchPage(clean);
  if (args.paginate === false || !isObject(first)) return first;
  const key = collectionKey(first);
  if (key === undefined) return first;
  const body: Record<string, any> = { ...first };
  const start = Number.parseInt(String(clean.offset ?? 0), 10) || 0;
  const limit = Number.isInteger(clean.limit) ? (clean.limit as number) : undefined;
  const items: any[] = [...(body[key] ?? [])];
  const totalNum = Number(body.total);
  const total = body.total === null || body.total === undefined || !Number.isFinite(totalNum) ? undefined : Math.trunc(totalNum);
  const maxPages = Number(args.max_pages ?? args.maxPages ?? MAX_PAGES);
  // Offsets are absolute: page from the caller's offset. With no `total`, a page
  // the size of `limit` is indistinguishable from a complete answer — keep going
  // until a short page proves the end.
  const moreExpected = (): boolean =>
    total !== undefined ? start + items.length < total : limit !== undefined && items.length > 0 && items.length % limit === 0;

  let truncated = false;
  let pages = 1;
  while (moreExpected()) {
    if (pages >= maxPages) {
      truncated = true;
      break;
    }
    const next = await fetchPage({ ...clean, offset: start + items.length });
    const chunk: any[] = (isObject(next) && Array.isArray(next[key]) ? next[key] : []) as any[];
    if (!chunk.length) {
      truncated = total !== undefined && start + items.length < total;
      break;
    }
    if (items.length && isDeepStrictEqual(chunk[0], items[0])) {
      // the server accepted `offset` and ignored it: extending would pile up duplicates
      throw new AssetFetchError(
        `${FAMILY}: pro.nfl.com ignored \`offset\` for ${url}: page ${pages + 1} repeated the first page. ` +
          "Refusing to return duplicated rows.",
        { url, status: 200 }
      );
    }
    items.push(...chunk);
    pages++;
  }
  body[key] = items;
  if (truncated) {
    // a partial collection must never be indistinguishable from a complete one
    body._truncated = true;
    process.emitWarning(`pro.nfl.com ${url}: returning ${items.length} of ${total ?? "?"} rows (stopped after ${pages} pages).`, {
      type: "UserWarning",
      code: "SDV_NFL_PRO_TRUNCATED",
    });
  }
  return body;
}

registerFamilyDefaults(FAMILY, {
  auth: nflProAuth,
  // a 401 / 403 is the entitlement answer, not load: never retried
  retryStatuses: [408, 429, 500, 502, 503, 504],
  classifyError: (res, url) => {
    if (res.status === 401 || res.status === 403) {
      return new AssetFetchError(
        `${FAMILY}: pro.nfl.com refused ${url} (${res.status}). The token is expired, not user-bound, ` +
          "or carries no active NFL_PLUS_* plan.",
        { url, status: res.status }
      );
    }
    // a missing required param surfaces as a bare 500 — the body usually names it
    const detail = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
    return new AssetFetchError(`${FAMILY}: HTTP ${res.status}: ${url} -- response body: ${detail.slice(0, 300)}`, {
      url,
      status: res.status,
    });
  },
});
