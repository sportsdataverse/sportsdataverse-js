// Auth providers. A provider decorates a TransportRequest (headers, query,
// cookies) before `request()` sends it; `refresh` is called once when a request
// comes back 401. Values the caller already put on the request win over the
// provider's (explicit args beat configured / env credentials). The failure
// contract is on the `AuthProvider` interface: `mint` / `login` / a token
// getter throw on failure and `request()` never retries them.

import { createHmac, randomBytes } from "node:crypto";
import { SdvError } from "./errors.js";
import type { Transport, TransportRequest } from "./transport.js";
import { headerValue, mergeHeaders } from "./transport.js";

/** Drop `undefined` / `null` / `""` values (an unset env var must never be sent). */
function present<T>(map: Record<string, T | undefined | null>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

// A random key per process: a credential cache key is useless outside it.
const CREDENTIAL_KEY = randomBytes(32);

/**
 * The cache key for a set of credentials (e.g. e-mail + password): an HMAC
 * under a random per-process key, so neither the plaintext nor an unsalted
 * hash of a password is held for the life of the process.
 *
 * @param parts - The credential parts (e.g. e-mail, password); each is length-prefixed
 *   before hashing, so `("a", "bc")` and `("ab", "c")` differ.
 * @returns A 64-character hex HMAC-SHA256 digest, stable within this process only.
 * @example
 * ```ts
 * import { credentialKey } from './core/auth.js'; // not re-exported from the package root
 *
 * const sessions = new Map<string, Session>();
 * const key = credentialKey(email, password);
 * if (!sessions.has(key)) sessions.set(key, await login(email, password));
 * ```
 * @remarks
 * The HMAC key is 32 random bytes drawn at module load, so a key is useless outside the
 * process and cannot be used to recover or confirm a password from a dump.
 * @internal
 */
export function credentialKey(...parts: string[]): string {
  const h = createHmac("sha256", CREDENTIAL_KEY);
  for (const p of parts) h.update(`${p.length}:${p}`); // length-prefixed: ("a","bc") != ("ab","c")
  return h.digest("hex");
}

/** The SdvError raised when a provider has no credential to send (no request is made). */
function missingCredential(family: string, what: string): SdvError {
  return new SdvError(
    `${family}: no credential — ${what} is empty. Set the key this family needs (its env var or argument), or pass it via configure({ auth: { ${family}: … } }).`
  );
}

/**
 * What `request()` passes to {@link AuthProvider.apply} and {@link AuthProvider.refresh}.
 *
 * @remarks
 * `transport` is the family's resolved transport, so a provider's own login / mint call
 * goes through the same user-configured transport without re-entering auth.
 */
export interface AuthContext {
  /** Family stem the request belongs to (e.g. `"nfl_api"`). */
  family: string;
  /** The family's transport — use it for login / token calls (it bypasses auth). */
  transport: Transport;
  /**
   * On `refresh` only: the request (before auth was applied) whose credentials
   * failed, so a provider holding several sessions refreshes the one it used.
   */
  request?: TransportRequest;
}

/**
 * Decorates a request with credentials. Values the caller already put on the
 * request win over the provider's.
 *
 * Failure contract: `apply` and `refresh` THROW on failure, and `request()`
 * never retries them (re-submitting credentials is the provider's decision),
 * so a provider that wants to ride out transient errors retries internally.
 * An `SdvError` thrown here reaches the caller unchanged; anything else becomes
 * `AssetFetchError("<family>: auth failed (apply|refresh)")`.
 *
 * @example
 * ```ts
 * import { configure, type AuthProvider } from 'sportsdataverse';
 *
 * const myAuth: AuthProvider = {
 *   async apply(req, ctx) {
 *     return { ...req, headers: { 'X-Api-Key': process.env.MY_KEY ?? '', ...req.headers } };
 *   },
 * };
 * configure({ auth: { my_api: myAuth } });
 * ```
 * @remarks
 * The built-ins — {@link bearerAuth}, {@link headerAuth}, {@link queryAuth},
 * {@link tokenAuth}, {@link sessionAuth} — cover the usual shapes; install one per family
 * with `configure({ auth })` or `registerFamilyDefaults`. `refresh` is called at most once
 * per request, after a 401, and the request is then re-sent once.
 */
export interface AuthProvider {
  /** The request with credentials added (values the caller set win). Throws on failure. */
  apply(req: TransportRequest, ctx: AuthContext): Promise<TransportRequest>;
  /**
   * Force new credentials (called once after a 401; `ctx.request` is the
   * request that failed). Throws on failure, as `apply` does.
   */
  refresh?(ctx: AuthContext): Promise<void>;
}

/**
 * `Authorization: Bearer <token>`; `token` may be a (possibly async) getter.
 * An empty / undefined token throws an SdvError naming the family — the request
 * is never sent with `Bearer undefined`.
 *
 * @param token - The bearer token, or a sync / async getter for it (read on every request,
 *   so a rotated token is picked up). `undefined` / `""` means "no credential".
 * @returns An {@link AuthProvider} whose `apply` sets `Authorization: Bearer <token>` unless
 *   the request already carries an `Authorization` header (any casing). It has no `refresh`.
 * @throws SdvError (from `apply`) when the token is empty / undefined:
 *   `"<family>: no credential — the bearerAuth token is empty. …"`; no request is made.
 * @example
 * ```ts
 * import { configure, bearerAuth } from 'sportsdataverse';
 *
 * configure({ auth: { pff_api: bearerAuth(process.env.PFF_API_KEY) } });
 * // or a getter, evaluated per request:
 * configure({ auth: { pff_api: bearerAuth(async () => readKeyFromVault()) } });
 * ```
 * @remarks
 * A getter that throws is not retried by `request()`; a non-SdvError becomes
 * `AssetFetchError("<family>: auth failed (apply)")`.
 */
export function bearerAuth(
  token: string | undefined | (() => string | undefined | Promise<string | undefined>)
): AuthProvider {
  return {
    async apply(req, ctx) {
      if (headerValue(req.headers, "authorization") !== undefined) return req;
      const value = typeof token === "function" ? await token() : token;
      if (!value) throw missingCredential(ctx.family, "the bearerAuth token");
      return { ...req, headers: mergeHeaders({ Authorization: `Bearer ${value}` }, req.headers) };
    },
  };
}

/**
 * Static headers (e.g. an API-key header); `undefined` / empty values are dropped.
 *
 * @param headers - Header map; an `undefined` / `null` / `""` value (an unset env var) is
 *   never sent.
 * @returns An {@link AuthProvider} whose `apply` merges `headers` under the request's own
 *   (case-insensitively; a header the caller set wins). It has no `refresh`.
 * @example
 * ```ts
 * import { configure, headerAuth } from 'sportsdataverse';
 *
 * configure({ auth: { odds_api: headerAuth({ 'X-Api-Key': process.env.ODDS_API_KEY }) } });
 * ```
 * @remarks
 * Unlike {@link bearerAuth} it never throws for a missing value: with every value empty it
 * sends the request without credentials. The values are read once, when the provider is
 * built.
 */
export function headerAuth(headers: Record<string, string | undefined>): AuthProvider {
  return {
    async apply(req) {
      return { ...req, headers: mergeHeaders(present(headers), req.headers) };
    },
  };
}

/**
 * Static query params (e.g. `{ apiKey: "…" }`); `undefined` / empty values are dropped.
 *
 * @param params - Query map; an `undefined` / `null` / `""` value is never sent.
 * @returns An {@link AuthProvider} whose `apply` adds `params` under the request's own
 *   `query` (a key the caller set wins). It has no `refresh`.
 * @example
 * ```ts
 * import { configure, queryAuth } from 'sportsdataverse';
 *
 * configure({ auth: { odds_api: queryAuth({ apiKey: process.env.ODDS_API_KEY }) } });
 * ```
 * @remarks
 * A key sent this way rides in the query string, which `request()` keeps out of every
 * error message (`url` is query-free) and `redactSecrets` strips from any text.
 */
export function queryAuth(params: Record<string, unknown>): AuthProvider {
  return {
    async apply(req) {
      return { ...req, query: { ...present(params), ...req.query } };
    },
  };
}

/**
 * A minted token, cached in-process and re-minted `skewSeconds` before
 * `expiresAt` (unix epoch SECONDS, like a JWT `exp`; omit for "until a 401").
 * Concurrent requests share one in-flight mint. `refresh` forces a re-mint.
 * `mint` throws on failure (and retries internally if it wants to); an empty
 * token throws an SdvError naming the family.
 *
 * @param opts - Minting options.
 * @param opts.mint - Mints a token (`ctx.transport` is the family's transport for the mint call).
 *   `expiresAt` in unix epoch seconds; omitted means the token is kept until a 401. The other
 *   options (`header`, `scheme`, `skewSeconds`) are documented on the parameter type below.
 * @returns An {@link AuthProvider}. `apply` sets `<header>: <scheme> <token>` unless the request
 *   already carries that header; `refresh` drops the cache and mints again — unless the 401
 *   was for a header the caller set themselves, in which case it does nothing.
 * @throws SdvError (from `apply` / `refresh`) when `mint` resolves without a `token`:
 *   `"<family>: no credential — the token returned by tokenAuth mint() is empty. …"`.
 * @example
 * ```ts
 * import { configure, tokenAuth } from 'sportsdataverse';
 *
 * configure({
 *   auth: {
 *     nfl_api: tokenAuth({
 *       mint: async (ctx) => {
 *         const url = 'https://api.nfl.com/identity/v3/token';
 *         const res = await ctx.transport({ method: 'POST', url, body });
 *         const { accessToken, expiresIn } = res.data as { accessToken: string; expiresIn: number };
 *         return { token: accessToken, expiresAt: Date.now() / 1000 + expiresIn };
 *       },
 *     }),
 *   },
 * });
 * ```
 * @remarks
 * Concurrent requests share one in-flight mint; the cache is per provider instance, not per
 * process. A `mint` that throws is not retried by `request()`; a non-SdvError becomes
 * `AssetFetchError("<family>: auth failed (apply|refresh)")`. The `nfl_api` family already
 * registers a provider of this shape (`nflTokenGen`); this example is the pattern only.
 */
export function tokenAuth(opts: {
  /** Mint a token; `expiresAt` is unix epoch seconds (omit for "until a 401"). Throws on failure. */
  mint(ctx: AuthContext): Promise<{ token: string; expiresAt?: number }>;
  /** Header to set (default `"Authorization"`). */
  header?: string;
  /** Value prefix (default `"Bearer"`; `""` sends the bare token). */
  scheme?: string;
  /** Re-mint this many seconds before expiry (default 60). */
  skewSeconds?: number;
}): AuthProvider {
  const header = opts.header ?? "Authorization";
  const scheme = opts.scheme ?? "Bearer";
  const skew = opts.skewSeconds ?? 60;
  let cached: { token: string; expiresAt?: number } | undefined;
  let inflight: Promise<{ token: string; expiresAt?: number }> | undefined;

  const mint = async (ctx: AuthContext): Promise<{ token: string; expiresAt?: number }> => {
    inflight ??= opts.mint(ctx).finally(() => {
      inflight = undefined;
    });
    const minted = await inflight;
    if (!minted?.token) throw missingCredential(ctx.family, "the token returned by tokenAuth mint()");
    cached = minted;
    return cached;
  };

  return {
    async apply(req, ctx) {
      if (headerValue(req.headers, header) !== undefined) return req;
      const now = Date.now() / 1000;
      const live =
        cached && (cached.expiresAt === undefined || cached.expiresAt - skew > now)
          ? cached
          : await mint(ctx);
      const value = scheme ? `${scheme} ${live.token}` : live.token;
      return { ...req, headers: mergeHeaders(req.headers, { [header]: value }) };
    },
    async refresh(ctx) {
      // The 401 was for the caller's own credential (apply sent it untouched):
      // a minted token would never be sent, so don't mint one.
      if (headerValue(ctx.request?.headers, header) !== undefined) return;
      cached = undefined;
      await mint(ctx);
    },
  };
}

/**
 * A logged-in session: `login` runs once (and again after `expiresAt`, unix
 * epoch seconds); its headers and cookies ride on every request. `refresh`
 * logs in again. `login` throws on failure (and retries internally if it
 * wants to) — `request()` calls it once per need, never in a retry loop.
 *
 * @param opts - Login options.
 * @param opts.login - Performs the login (`ctx.transport` is the family's transport). Returns the
 *   `headers` and `cookies` to ride on every request and an optional `expiresAt` (unix epoch
 *   seconds; omitted means the session lasts until a 401).
 * @returns An {@link AuthProvider}. `apply` merges the session headers under the request's own
 *   and appends the cookies to any `Cookie` header the caller set (`name=value; …`); `refresh`
 *   drops the session and logs in again.
 * @example
 * ```ts
 * import { configure, sessionAuth } from 'sportsdataverse';
 *
 * configure({
 *   auth: {
 *     kenpom: sessionAuth({
 *       login: async (ctx) => {
 *         const res = await ctx.transport({ method: 'POST', url: loginUrl, body: form, responseType: 'text' });
 *         return { cookies: parseSetCookie(res.headers['set-cookie']), expiresAt: Date.now() / 1000 + 3600 };
 *       },
 *     }),
 *   },
 * });
 * ```
 * @remarks
 * Concurrent requests share one in-flight login. A `login` that throws is not retried by
 * `request()`; a non-SdvError becomes `AssetFetchError("<family>: auth failed (apply|refresh)")`
 * and the thrown message never carries the password (it goes through `safeCause`). Unlike
 * {@link tokenAuth}, `refresh` always logs in again, even when the caller set the header.
 */
export function sessionAuth(opts: {
  /** Log in; returns the headers / cookies for every request and an optional `expiresAt`. Throws on failure. */
  login(ctx: AuthContext): Promise<{
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    expiresAt?: number;
  }>;
}): AuthProvider {
  type Session = Awaited<ReturnType<typeof opts.login>>;
  let session: Session | undefined;
  let inflight: Promise<Session> | undefined;

  const login = async (ctx: AuthContext): Promise<Session> => {
    inflight ??= opts.login(ctx).finally(() => {
      inflight = undefined;
    });
    session = await inflight;
    return session;
  };

  return {
    async apply(req, ctx) {
      const live =
        session && (session.expiresAt === undefined || session.expiresAt > Date.now() / 1000)
          ? session
          : await login(ctx);
      let headers = mergeHeaders(live.headers, req.headers);
      const jar = Object.entries(live.cookies ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      if (jar) {
        const existing = headerValue(headers, "cookie");
        headers = mergeHeaders(headers, { Cookie: existing ? `${existing}; ${jar}` : jar });
      }
      return { ...req, headers };
    },
    async refresh(ctx) {
      session = undefined;
      await login(ctx);
    },
  };
}
