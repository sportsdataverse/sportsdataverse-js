// NFL Pro (`https://pro.nfl.com`) runtime. Port of sdv-py's
// `sportsdataverse/nfl/nflpro_runtime.py`.
//
// pro.nfl.com serves the Next Gen Stats tables nextgenstats.nfl.com stopped
// serving. `/api/secured/*` needs a USER-BOUND bearer token carrying an ACTIVE
// `NFL_PLUS_*` plan: a client-credentials token is not user-bound and 401s on
// every route, so nothing here mints one. The token comes from (sdv-py's order):
//   1. an `Authorization` header in the call's `headers`,
//   2. `token` on the call,
//   3. env `NFLPRO_TOKEN`,
//   4. a headless-browser id.nfl.com login with `email` / `password` on the
//      call, else env `NFLPRO_EMAIL` / `NFLPRO_PW` (optional peer `playwright`,
//      imported only when a login is actually needed),
// and a supplied token is checked (plan + expiry, from its JWT claims) before
// any request. Logged-in tokens are cached per account until they expire.
//
// Two measured API behaviours handled here:
//   - an unsupported query param answers HTTP 200 with an EMPTY body (no error
//     envelope) -> InvalidParameterError;
//   - responses truncate silently at the page size, so the getter pages on
//     `offset` until it holds the envelope's own `total` rows.
//
// Importing this module registers the `nfl_pro` family defaults.

import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { bearerAuth } from "./auth.js";
import { registerFamilyDefaults } from "./config.js";
import { AssetFetchError, InvalidParameterError, SdvError, TransportUnavailableError, redactSecrets } from "./errors.js";
import { request } from "./request.js";
import { headerValue, mergeHeaders } from "./transport.js";
import { NFL_PRO_COLLECTION_KEYS } from "../parsers/nfl_pro.js";

const FAMILY = "nfl_pro";
export const NFL_PRO_HOST = "https://pro.nfl.com";
const TOKEN_ENV = "NFLPRO_TOKEN";
const EMAIL_ENV = "NFLPRO_EMAIL";
const PASSWORD_ENV = "NFLPRO_PW";
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

/** Minimal shape of the Playwright API the login drives (the `playwright` package). */
export interface PlaywrightLike {
  chromium: { launch(opts: { headless: boolean }): Promise<PlaywrightBrowser> };
}
interface PlaywrightBrowser {
  newContext(opts: { userAgent: string; viewport: { width: number; height: number } }): Promise<{ newPage(): Promise<PlaywrightPage> }>;
  close(): Promise<void>;
}
interface PlaywrightPage {
  goto(url: string, opts: { waitUntil: "domcontentloaded"; timeout: number }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<R>(fn: () => R): Promise<R>;
  locator(selector: string): PlaywrightLocator;
  url(): string;
}
interface PlaywrightLocator {
  first(): PlaywrightLocator;
  count(): Promise<number>;
  isVisible(): Promise<boolean>;
  fill(value: string, opts: { timeout: number }): Promise<void>;
  press(key: string): Promise<void>;
}

const PLAYWRIGHT_MODULE = "playwright";
const PLAYWRIGHT_INSTALL = "npm i playwright && npx playwright install chromium";

/**
 * Test seam: how the optional `playwright` package is loaded. The specifier is
 * a variable so TypeScript and bundlers never require it to be installed.
 * @internal
 */
export const _playwrightLoader = {
  load: (): Promise<any> => import(PLAYWRIGHT_MODULE),
};

async function loadPlaywright(): Promise<PlaywrightLike> {
  let mod: any;
  try {
    mod = await _playwrightLoader.load();
  } catch (err) {
    throw new TransportUnavailableError(
      `nfl_pro: logging in to NFL Pro needs the optional dependency \`playwright\`. Install it with: ${PLAYWRIGHT_INSTALL} ` +
        `— or set ${TOKEN_ENV} to a token obtained elsewhere.`,
      { cause: err }
    );
  }
  return mod.chromium ? mod : mod.default;
}

// Run INSIDE the page (Playwright serializes them), so browser globals only.
const clickSignIn = (): void => {
  (globalThis as any).document
    .querySelectorAll('.login-button, [aria-label="Sign In"]')
    .forEach((el: any) => el.click());
};
const clickUsePassword = (): boolean => {
  const el = Array.from((globalThis as any).document.querySelectorAll("button,a")).find((e: any) =>
    /sign in with password|use password/i.test(e.innerText || "")
  ) as any;
  if (el) {
    el.click();
    return true;
  }
  return false;
};
const readLocalStorage = (): string[] => {
  const ls = (globalThis as any).localStorage;
  const out: string[] = [];
  for (let i = 0; i < ls.length; i++) out.push(ls.getItem(ls.key(i)) || "");
  return out;
};

/** A copy of `err` (name / message / stack) with every `secrets` value cut out. */
function scrubbed(err: unknown, secrets: string[]): Error {
  const cut = (s: string) => secrets.filter(Boolean).reduce((acc, x) => acc.split(x).join("<redacted>"), redactSecrets(s));
  const e = (typeof err === "object" && err !== null ? err : {}) as Record<string, unknown>;
  const out = new Error(cut(typeof e.message === "string" ? e.message : String(err)));
  out.name = typeof e.name === "string" ? e.name : "Error";
  out.stack = typeof e.stack === "string" ? cut(e.stack) : undefined;
  return out;
}

/**
 * Complete the real id.nfl.com login in headless Chromium and return the
 * user-bound access token (port of sdv-py's `_browser_login`).
 *
 * The flow is three steps in a non-fixed order (email -> passkey offer ->
 * password), so it is driven as a state machine: `/account/sign-in-biometric`
 * reads like a passkey ENROLMENT page but is a sign-in OFFER with no password
 * field, so a fixed email-then-password script stops there having submitted
 * nothing. Only a token carrying an ACTIVE `NFL_PLUS_*` plan is returned — an
 * anonymous token looks identical, so "the login worked" proves nothing.
 *
 * @param opts.playwright the `playwright` module (default: imported lazily;
 *   missing -> {@link TransportUnavailableError}).
 * @throws {NflProAuthError} the login failed or found no entitled token. The
 *   email and password never appear in the error or its cause.
 */
export async function nflProBrowserLogin(
  email: string,
  password: string,
  opts: { playwright?: PlaywrightLike; timeoutMs?: number } = {}
): Promise<string> {
  const pw = opts.playwright ?? (await loadPlaywright());
  const timeout = opts.timeoutMs ?? 60000;
  const home = `${NFL_PRO_HOST}/`;
  const emailSel = "input[type=email], input[name*=email i], input[id*=email i], input[name=loginID]";
  let blobs: string[];
  try {
    const browser = await pw.chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(home, { waitUntil: "domcontentloaded", timeout });
      await page.waitForTimeout(6000);
      // The header collapses the control off-screen: dispatch the handler
      // rather than waiting for a visibility that never comes.
      await page.evaluate(clickSignIn);
      await page.waitForTimeout(8000);

      let submitted = false;
      for (let step = 0; step < 6; step++) {
        await page.waitForTimeout(2500);
        let field = page.locator("input[type=password]:visible").first();
        if (await field.count()) {
          await field.fill(password, { timeout: 8000 });
          await field.press("Enter");
          submitted = true;
          await page.waitForTimeout(9000);
          continue;
        }
        if (await page.evaluate(clickUsePassword)) continue;
        field = page.locator(emailSel).first();
        if ((await field.count()) && (await field.isVisible())) {
          await field.fill(email, { timeout: 8000 });
          await field.press("Enter");
          continue;
        }
        break;
      }
      if (!submitted) {
        // Measured live 2026-10-05 (not in sdv-py): an account with no password
        // on file lands on /account/account-recovery after the e-mail step.
        const why = page.url().includes("account-recovery")
          ? "id.nfl.com says this account has no password (it asks to set up a password or passkey). " +
            `Set a password on the NFL account, or set ${TOKEN_ENV}`
          : "the password step was never reached";
        throw new NflProAuthError(`nfl_pro: id.nfl.com login: ${why}`);
      }

      await page.waitForTimeout(8000);
      if (!page.url().includes("pro.nfl.com")) {
        await page.goto(home, { waitUntil: "domcontentloaded", timeout });
        await page.waitForTimeout(10000);
      }
      blobs = await page.evaluate(readLocalStorage);
    } finally {
      await browser.close();
    }
  } catch (err) {
    if (err instanceof SdvError) throw err;
    const safe = scrubbed(err, [email, password]);
    throw new NflProAuthError(`nfl_pro: the id.nfl.com browser login failed: ${safe.message}`, { cause: safe });
  }
  for (const blob of blobs ?? []) {
    for (const m of String(blob).matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      if (nflProTokenEntitled(m[0])) return m[0];
    }
  }
  throw new NflProAuthError(
    "nfl_pro: signed in, but no token carrying an active NFL_PLUS_* plan was found — " +
      "the account may not hold an NFL+ Premium subscription."
  );
}

// Keyed by ACCOUNT (e-mail + a hash of the password, never the plaintext): a
// single-slot cache would hand account B the token minted for account A, and a
// wrong password must not be answered from a cached right one.
const tokenCache = new Map<string, string>();
const pendingLogins = new Map<string, Promise<string>>();
const accountKey = (email: string, password: string): string =>
  `${email}\u0000${createHash("sha256").update(password).digest("hex")}`;

/** Forget every logged-in NFL Pro token (the next call logs in again). */
export function nflProClearTokenCache(): void {
  tokenCache.clear();
  pendingLogins.clear();
}

/**
 * Resolve a usable NFL Pro token, in sdv-py's order: `token`, else env
 * `NFLPRO_TOKEN` (either must be entitled and unexpired), else a browser login
 * with `email` / `password`, else env `NFLPRO_EMAIL` / `NFLPRO_PW`. A logged-in
 * token is cached per account until it expires; concurrent calls for one
 * account share one login. Throws {@link NflProAuthError} when nothing resolves
 * (no request is made) and {@link TransportUnavailableError} when a login is
 * needed but `playwright` is not installed.
 */
export async function nflProToken(opts: { token?: string; email?: string; password?: string } = {}): Promise<string> {
  const t = String(opts.token ?? "").trim() || (process.env[TOKEN_ENV] ?? "").trim();
  if (t) {
    if (!nflProTokenEntitled(t)) {
      throw new NflProAuthError(
        "nfl_pro: the NFL Pro token carries no active NFL_PLUS_* plan, so every /api/secured/* route " +
          "would 401. A client-credentials token is not user-bound."
      );
    }
    // expiry is checked here too: a stale NFLPRO_TOKEN would otherwise 401 on every route
    if (!nflProTokenFresh(t)) {
      throw new NflProAuthError(
        `nfl_pro: the NFL Pro token has expired — obtain a fresh one (unset ${TOKEN_ENV} to log in again).`
      );
    }
    return t;
  }

  const email = String(opts.email ?? "").trim() || (process.env[EMAIL_ENV] ?? "").trim();
  const password = String(opts.password ?? "") || (process.env[PASSWORD_ENV] ?? "");
  if (!email || !password) {
    throw new NflProAuthError(
      `nfl_pro: no NFL Pro credentials — pass email / password, or set ${EMAIL_ENV} and ${PASSWORD_ENV}, ` +
        `or set ${TOKEN_ENV} to an already-obtained user-bound token (an NFL+ Premium account).`
    );
  }
  // looked up AFTER resolving which account is asked for, keyed on that account
  const key = accountKey(email, password);
  const cached = tokenCache.get(key);
  if (cached && nflProTokenFresh(cached)) return cached;
  let pending = pendingLogins.get(key);
  if (!pending) {
    const login: Promise<string> = nflProBrowserLogin(email, password).finally(() => {
      if (pendingLogins.get(key) === login) pendingLogins.delete(key);
    });
    pendingLogins.set(key, login);
    pending = login;
  }
  const fresh = await pending;
  tokenCache.set(key, fresh);
  return fresh;
}

/**
 * Bearer from `NFLPRO_TOKEN`, else an `NFLPRO_EMAIL` / `NFLPRO_PW` login; an
 * `Authorization` header (or `token` / `email` / `password`, resolved by the
 * getter) wins.
 */
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
 * params (`token`, `email`, `password`, `paginate` (default true),
 * `max_pages` (default 40)).
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
  if (headerValue(headers, "authorization") === undefined && (args.token || args.email || args.password)) {
    const token = await nflProToken({ token: args.token, email: args.email, password: args.password });
    headers = mergeHeaders(headers, { Authorization: `Bearer ${token}` });
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
