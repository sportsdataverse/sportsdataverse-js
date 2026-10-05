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

import type { AuthContext, AuthProvider } from "./auth.js";
import { sessionAuth } from "./auth.js";
import { registerFamilyDefaults, resolveFamily } from "./config.js";
import { AssetFetchError, SdvError } from "./errors.js";
import { request } from "./request.js";
import { registerParser } from "../parsers/_registry.js";
import { parse_kenpom_page } from "../parsers/kenpom.js";
import {
  createImpersonatingTransport,
  headerValue,
  mergeHeaders,
  type Transport,
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
    timeoutMs: 30000,
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
    timeoutMs: 30000,
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

/** One cached session per explicit e-mail (env credentials use the family default). */
let explicitSessions = new Map<string, AuthProvider>();

function sessionFor(creds?: { email: string; password: string }): AuthProvider {
  return sessionAuth({
    login: (ctx: AuthContext) => login(ctx.transport, creds ?? resolveKenpomCredentials()),
  });
}

let envSession = sessionFor();

/**
 * The `kenpom` auth provider: the environment-credential session, skipped when
 * the request already carries a `Cookie` (an explicit-credential session the
 * getter applied, or the caller's own cookie).
 */
export const kenpomAuth: AuthProvider = {
  apply: (req, ctx) => (headerValue(req.headers, "cookie") !== undefined ? Promise.resolve(req) : envSession.apply(req, ctx)),
  refresh: (ctx) => envSession.refresh!(ctx),
};

/** Drop every cached KenPom session (credential rotation / tests). */
export function kenpomClearSessionCache(): void {
  explicitSessions = new Map();
  envSession = sessionFor();
}

/**
 * Log into KenPom now (optional — every wrapper logs in on demand) to verify
 * credentials before a long pull. The session is cached for later calls.
 */
export async function kenpomLogin(opts: { email?: string; password?: string } = {}): Promise<void> {
  const ctx: AuthContext = { family: FAMILY, transport: resolveFamily(FAMILY).transport };
  const provider = opts.email || opts.password ? explicitProvider(resolveKenpomCredentials(opts.email, opts.password)) : envSession;
  await provider.apply({ method: "GET", url: LOGIN_URL }, ctx);
}

function explicitProvider(creds: { email: string; password: string }): AuthProvider {
  let p = explicitSessions.get(creds.email);
  if (!p) {
    p = sessionFor(creds);
    explicitSessions.set(creds.email, p);
  }
  return p;
}

/**
 * GET an authenticated kenpom.com page and return its HTML. The flat dispatch
 * calls this for every `kenpom_*` wrapper; `args` are the caller's params
 * (`email`, `password`).
 */
export async function kenpomGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string>; family: string; args?: Record<string, any> }
): Promise<string> {
  const args = config.args ?? {};
  let headers = mergeHeaders({ "User-Agent": USER_AGENT, Referer: `${KENPOM_BASE_URL}/` }, config.headers);
  if (headerValue(headers, "cookie") === undefined && (args.email || args.password)) {
    // explicit credentials: log in with them (cached per e-mail) instead of the env session
    const provider = explicitProvider(resolveKenpomCredentials(args.email, args.password));
    const ctx: AuthContext = { family: config.family, transport: resolveFamily(config.family).transport };
    try {
      headers = (await provider.apply({ method: "GET", url, headers }, ctx)).headers ?? headers;
    } catch (err) {
      // same contract as request(): an SdvError passes through, anything else is an auth failure
      if (err instanceof SdvError) throw err;
      throw new AssetFetchError(`${FAMILY}: auth failed (login)`, { url, cause: err });
    }
  }
  const body = await request(config.family, { method: "GET", url, query: config.params, headers, responseType: "text" });
  return typeof body === "string" ? body : "";
}

// KenPom's HTML parser needs cheerio: registered here (node) rather than in the
// browser-safe parser registry.
registerParser("parse_kenpom_page", parse_kenpom_page);

registerFamilyDefaults(FAMILY, {
  transport: createImpersonatingTransport(),
  auth: kenpomAuth,
  // a 403 here is the subscription gate, not load: never retried
  retryStatuses: [408, 429, 500, 502, 503, 504],
});
