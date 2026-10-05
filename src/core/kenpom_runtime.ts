// KenPom (`https://kenpom.com`) runtime: a username/password subscription login
// whose session cookie rides on every page GET. Port of sdv-py's
// `sportsdataverse/_subscription_http.py` (login / get_html) +
// `sportsdataverse/mbb/kenpom_runtime.py` (the KenPom site description).
//
// Login (once per credentials, reused for 30 minutes):
//   1. GET the login page — establishes the PHP session cookie,
//   2. POST email / password / submit to the login form's own `action`,
//   3. verify the login took: a rejected login answers 200 with the login form
//      still on the page, and scraping THAT would hand back free-tier tables as
//      subscriber data — so it throws instead.
//
// Credentials: `email` / `password` on the call > env `KENPOM_EMAIL` / `KP_USER`
// / `SDV_KENPOM_EMAIL` and `KENPOM_PW` / `KENPOM_PASSWORD` / `KP_PW` /
// `SDV_KENPOM_PW` (hoopR's `KP_USER` / `KP_PW` work unchanged). Never logged,
// never defaulted. A `Cookie` header in the call's `headers` is used as-is (no
// login).
//
// Transport: kenpom.com sits behind a Cloudflare bot check that answers 403 to
// Node's own TLS fingerprint (curl and Python requests pass), so the family's
// default transport is the browser-impersonating one (optional peer dependency
// `impit` — `npm install impit`). `configure({ transport: { kenpom } })`
// replaces it (e.g. to add a proxy: `createImpersonatingTransport({ proxyUrl })`).
//
// Importing this module registers the `kenpom` family defaults.

import { randomUUID } from "node:crypto";
import type { AuthContext, AuthProvider } from "./auth.js";
import { credentialKey, sessionAuth } from "./auth.js";
import { registerFamilyDefaults, resolveFamily } from "./config.js";
import { AssetFetchError, SdvError } from "./errors.js";
import { request } from "./request.js";
// registers the node-only parse_kenpom_page in the flat parser registry
import "../parsers/kenpom.js";
import {
  createImpersonatingTransport,
  headerValue,
  mergeHeaders,
  type Transport,
  type TransportRequest,
  type TransportResponse,
} from "./transport.js";

const FAMILY = "kenpom";
export const KENPOM_BASE_URL = "https://kenpom.com";
const LOGIN_URL = `${KENPOM_BASE_URL}/index.php`;
const DEFAULT_ACTION = "handlers/login_handler.php";
const SIGNUP_URL = "https://kenpom.com/register.php";
const EMAIL_ENV = ["KENPOM_EMAIL", "KP_USER", "SDV_KENPOM_EMAIL"];
const PASSWORD_ENV = ["KENPOM_PW", "KENPOM_PASSWORD", "KP_PW", "SDV_KENPOM_PW"];
/** Seconds a logged-in session is reused (a KenPom cookie outlives this comfortably). */
const SESSION_TTL = 1800;
// Browser-ish UA: KenPom serves member tables to a plain client (no TLS gate).
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function envFirst(names: string[]): string | undefined {
  for (const name of names) {
    const v = (process.env[name] ?? "").trim();
    if (v) return v;
  }
  return undefined;
}

/** Explicit credentials > environment, or an SdvError naming the env vars (no request made). */
export function resolveKenpomCredentials(email?: string, password?: string): { email: string; password: string } {
  const e = (email ?? "").trim() || envFirst(EMAIL_ENV);
  const p = password || envFirst(PASSWORD_ENV);
  if (e && p) return { email: e, password: p };
  throw new SdvError(
    `kenpom: KenPom is a paid subscription service — pass email / password to the call, or set ` +
      `${EMAIL_ENV.join(" / ")} and ${PASSWORD_ENV.join(" / ")}. A subscription is required: ${SIGNUP_URL}.`
  );
}

/** Whether KenPom credentials resolve from the environment (gate a live test without logging in). */
export function hasKenpomLogin(): boolean {
  return Boolean(envFirst(EMAIL_ENV) && envFirst(PASSWORD_ENV));
}

/** Absolute URL of the login form's `action` (the form holding the e-mail field). */
export function loginFormAction(html: string): string {
  let action: string | undefined;
  for (const m of html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)) {
    if (/name=["']email["']/i.test(m[0])) {
      action = /\baction=["']([^"']*)["']/i.exec(m[0])?.[1]?.trim();
      break;
    }
  }
  action ||= DEFAULT_ACTION;
  if (/^https?:\/\//.test(action)) return action;
  return `${KENPOM_BASE_URL}/${action.replace(/^\/+/, "")}`;
}

/** A rejected login answers 200 with the login form (a password input) still on the page. */
export const looksLoggedOut = (html: string): boolean => /<input[^>]*\bname=["']password["']/i.test(html);

/** Fold a response's `Set-Cookie` lines into the jar (later values win). */
function collectCookies(res: TransportResponse, jar: Record<string, string>): void {
  for (const line of (res.headers["set-cookie"] ?? "").split("\n")) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
}

const bodyText = (res: TransportResponse): string => (typeof res.data === "string" ? res.data : "");

/**
 * Log into kenpom.com through `transport` and return the session cookies.
 * Throws SdvError on missing / rejected credentials, AssetFetchError when the
 * login pages themselves fail.
 */
async function login(
  transport: Transport,
  creds: { email: string; password: string }
): Promise<{ headers: Record<string, string>; cookies: Record<string, string>; expiresAt: number }> {
  const jar: Record<string, string> = {};
  const cookieHeader = (): string =>
    Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  const landing = await transport({
    method: "GET",
    url: LOGIN_URL,
    headers: { "User-Agent": USER_AGENT },
    responseType: "text",
    timeoutMs: resolveFamily(FAMILY).timeoutMs, // configure({ timeoutMs }) > family default > 30 s
  });
  if (landing.status >= 400) {
    throw new AssetFetchError(`${FAMILY}: login page HTTP ${landing.status}`, { url: LOGIN_URL, status: landing.status });
  }
  collectCookies(landing, jar);
  const action = loginFormAction(bodyText(landing));
  const form = new URLSearchParams({ submit: "Login", email: creds.email, password: creds.password });
  const posted = await transport({
    method: "POST",
    url: action,
    body: form.toString(),
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: LOGIN_URL,
      ...(Object.keys(jar).length ? { Cookie: cookieHeader() } : {}),
    },
    responseType: "text",
    timeoutMs: resolveFamily(FAMILY).timeoutMs, // configure({ timeoutMs }) > family default > 30 s
  });
  if (posted.status >= 400) {
    throw new AssetFetchError(`${FAMILY}: login POST HTTP ${posted.status}`, { url: action, status: posted.status });
  }
  collectCookies(posted, jar);
  if (looksLoggedOut(bodyText(posted))) {
    throw new SdvError(
      `kenpom: KenPom rejected the supplied credentials (the response still shows the login form). ` +
        `Check ${EMAIL_ENV.join(" / ")} and ${PASSWORD_ENV.join(" / ")}, and that the subscription is active.`
    );
  }
  return {
    headers: { "User-Agent": USER_AGENT, Referer: `${KENPOM_BASE_URL}/` },
    cookies: { ...jar },
    expiresAt: Date.now() / 1000 + SESSION_TTL,
  };
}

/**
 * Internal routing header: the getter tags a request with the id of the
 * explicit-credential session it should ride on; {@link kenpomAuth} reads and
 * strips it, so it never reaches kenpom.com.
 */
const SESSION_HEADER = "x-sdv-kenpom-session";
/** Explicit-credential sessions kept at once (sdv-py's `_SESSION_CACHE_MAX`); the oldest is evicted. */
const SESSION_CACHE_MAX = 8;

/**
 * Explicit-credential sessions, keyed by an HMAC of e-mail + password under a
 * per-process key ({@link credentialKey}: never the plaintext, never an
 * unsalted hash), so a corrected password is a different session. Only a
 * session whose login SUCCEEDED is cached, at most SESSION_CACHE_MAX (FIFO).
 */
let explicitSessions = new Map<string, { id: string; provider: AuthProvider }>();

function sessionFor(creds?: { email: string; password: string }): AuthProvider {
  return sessionAuth({
    login: (ctx: AuthContext) => login(ctx.transport, creds ?? resolveKenpomCredentials()),
  });
}

let envSession = sessionFor();

/** @internal (exported for tests) */
export const accountKey = (c: { email: string; password: string }): string => credentialKey(c.email, c.password);

type ExplicitSession = { id: string; provider: AuthProvider };

/** Logins in flight, per account key: concurrent first calls share ONE login (removed when it settles). */
let pendingLogins = new Map<string, Promise<ExplicitSession>>();

/**
 * Sessions held by in-flight requests (id -> session + holder count). A request
 * keeps riding on the session it started with even if the cache evicts it
 * meanwhile (a 9th account) — eviction only stops NEW calls from reusing it.
 */
const inUse = new Map<string, { session: ExplicitSession; holders: number }>();

function hold(s: ExplicitSession): void {
  const e = inUse.get(s.id);
  if (e) e.holders++;
  else inUse.set(s.id, { session: s, holders: 1 });
}

function release(s: ExplicitSession): void {
  const e = inUse.get(s.id);
  if (e && --e.holders === 0) inUse.delete(s.id);
}

function sessionById(id: string): AuthProvider | undefined {
  const held = inUse.get(id);
  if (held) return held.session.provider;
  for (const s of explicitSessions.values()) if (s.id === id) return s.provider;
  return undefined;
}

const withoutHeader = (headers: Record<string, string> | undefined, name: string): Record<string, string> =>
  Object.fromEntries(Object.entries(headers ?? {}).filter(([k]) => k.toLowerCase() !== name));

/** Same contract as request(): an SdvError passes through, anything else is an auth failure. */
const authFailure = (step: string, url: string, err: unknown): SdvError =>
  err instanceof SdvError ? err : new AssetFetchError(`${FAMILY}: auth failed (${step})`, { url, cause: err });

/**
 * The session for explicit credentials: a cached one, the login already in
 * flight for the same account, or a fresh login that is cached only once it
 * succeeded (a failed login is not cached, and its pending entry is dropped).
 */
function explicitSession(creds: { email: string; password: string }, ctx: AuthContext): Promise<ExplicitSession> {
  const key = accountKey(creds);
  const hit = explicitSessions.get(key);
  if (hit) return Promise.resolve(hit);
  let pending = pendingLogins.get(key);
  if (!pending) {
    const logins = pendingLogins; // a cache clear mid-login must not drop a newer map's entry
    pending = (async (): Promise<ExplicitSession> => {
      const provider = sessionFor(creds);
      try {
        await provider.apply({ method: "GET", url: LOGIN_URL }, ctx); // logs in; throws on a rejected login
      } catch (err) {
        throw authFailure("login", LOGIN_URL, err);
      }
      const raced = explicitSessions.get(key);
      if (raced) return raced;
      if (explicitSessions.size >= SESSION_CACHE_MAX) {
        explicitSessions.delete(explicitSessions.keys().next().value as string); // FIFO-evict the oldest
      }
      const session = { id: randomUUID(), provider };
      explicitSessions.set(key, session);
      return session;
    })().finally(() => {
      if (logins.get(key) === pending) logins.delete(key);
    });
    logins.set(key, pending);
  }
  return pending;
}

/**
 * The `kenpom` auth provider. A request tagged with an explicit-credential
 * session id rides on that session; one that already carries a `Cookie` (the
 * caller's own session) is sent as-is; anything else uses the
 * environment-credential session. `refresh` re-logs-in whichever session the
 * failed request used (nothing to refresh for the caller's own cookie).
 */
export const kenpomAuth: AuthProvider = {
  async apply(req, ctx) {
    const id = headerValue(req.headers, SESSION_HEADER);
    if (id !== undefined) {
      const provider = sessionById(id);
      if (!provider) throw new SdvError(`${FAMILY}: that KenPom session is no longer cached — call again with email / password`);
      return provider.apply({ ...req, headers: withoutHeader(req.headers, SESSION_HEADER) }, ctx);
    }
    if (headerValue(req.headers, "cookie") !== undefined) return req;
    return envSession.apply(req, ctx);
  },
  async refresh(ctx) {
    const id = headerValue(ctx.request?.headers, SESSION_HEADER);
    if (id !== undefined) return sessionById(id)?.refresh?.(ctx);
    if (headerValue(ctx.request?.headers, "cookie") !== undefined) return;
    return envSession.refresh!(ctx);
  },
};

/** Drop every cached KenPom session (credential rotation / tests). */
export function kenpomClearSessionCache(): void {
  explicitSessions = new Map();
  pendingLogins = new Map();
  envSession = sessionFor();
}

/**
 * Log into KenPom now (optional — every wrapper logs in on demand) to verify
 * credentials before a long pull. The session is cached for later calls.
 */
export async function kenpomLogin(opts: { email?: string; password?: string } = {}): Promise<void> {
  const ctx: AuthContext = { family: FAMILY, transport: resolveFamily(FAMILY).transport };
  if (opts.email || opts.password) {
    await explicitSession(resolveKenpomCredentials(opts.email, opts.password), ctx);
    return;
  }
  try {
    await envSession.apply({ method: "GET", url: LOGIN_URL }, ctx);
  } catch (err) {
    throw authFailure("login", LOGIN_URL, err);
  }
}

/**
 * GET an authenticated kenpom.com page and return its HTML. The flat dispatch
 * calls this for every `kenpom_*` wrapper; `args` are the caller's params
 * (`email`, `password`).
 *
 * A page that comes back as the logged-out login form is a failed fetch, never
 * data: the session that was used is refreshed once and the page re-fetched;
 * if it is still logged out (or the caller's own cookie was rejected) the call
 * throws AssetFetchError.
 */
export async function kenpomGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string>; family: string; args?: Record<string, any> }
): Promise<string> {
  const args = config.args ?? {};
  const { auth, transport } = resolveFamily(config.family);
  const ctx: AuthContext = { family: config.family, transport };
  let headers = mergeHeaders({ "User-Agent": USER_AGENT, Referer: `${KENPOM_BASE_URL}/` }, config.headers);
  const ownCookie = headerValue(config.headers, "cookie") !== undefined;
  let held: ExplicitSession | undefined;
  if (!ownCookie && (args.email || args.password)) {
    if (auth !== kenpomAuth) {
      throw new SdvError(`${FAMILY}: email / password on the call need the built-in KenPom auth (a custom auth provider is configured for kenpom)`);
    }
    held = await explicitSession(resolveKenpomCredentials(args.email, args.password), ctx);
    hold(held); // this request keeps its session even if the cache evicts it meanwhile
    headers = mergeHeaders(headers, { [SESSION_HEADER]: held.id });
  }
  try {
    return await fetchLoggedIn(url, config, headers, ownCookie, ctx, auth);
  } finally {
    if (held) release(held);
  }
}

/** Fetch a page; a logged-out answer refreshes the used session once, then throws. */
async function fetchLoggedIn(
  url: string,
  config: { params?: Record<string, unknown>; family: string },
  headers: Record<string, string>,
  ownCookie: boolean,
  ctx: AuthContext,
  auth: AuthProvider | undefined
): Promise<string> {
  const page: TransportRequest = { method: "GET", url, query: config.params, headers, responseType: "text" };
  const fetchPage = async (): Promise<string> => {
    const body = await request(config.family, page);
    return typeof body === "string" ? body : "";
  };
  let html = await fetchPage();
  if (looksLoggedOut(html) && !ownCookie && auth?.refresh) {
    try {
      await auth.refresh({ ...ctx, request: page });
    } catch (err) {
      throw authFailure("refresh", url, err);
    }
    html = await fetchPage();
  }
  if (looksLoggedOut(html)) {
    throw new AssetFetchError(
      `${FAMILY}: ${url} came back as the logged-out login page — the session was not accepted`,
      { url, status: 200 }
    );
  }
  return html;
}

registerFamilyDefaults(FAMILY, {
  transport: createImpersonatingTransport(),
  auth: kenpomAuth,
  // a 403 here is the subscription gate, not load: never retried
  retryStatuses: [408, 429, 500, 502, 503, 504],
});
