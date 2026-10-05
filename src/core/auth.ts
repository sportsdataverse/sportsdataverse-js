// Auth providers. A provider decorates a TransportRequest (headers, query,
// cookies) before `request()` sends it; `refresh` is called once when a request
// comes back 401. Values the caller already put on the request win over the
// provider's (explicit args beat configured / env credentials).
//
// Failure contract: `apply` / `refresh` (and so `mint` / `login` / a token
// getter) THROW on failure. `request()` never retries them — re-submitting
// credentials is the provider's decision — so a provider that wants to ride out
// transient errors retries inside `mint` / `login` itself. An SdvError thrown
// here reaches the caller unchanged; anything else becomes
// `AssetFetchError("<family>: auth failed (apply|refresh)")`.

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

/** The SdvError raised when a provider has no credential to send (no request is made). */
function missingCredential(family: string, what: string): SdvError {
  return new SdvError(
    `${family}: no credential — ${what} is empty. Set the key this family needs (its env var or argument), or pass it via configure({ auth: { ${family}: … } }).`
  );
}

export interface AuthContext {
  /** Family stem the request belongs to (e.g. `"nfl_api"`). */
  family: string;
  /** The family's transport — use it for login / token calls (it bypasses auth). */
  transport: Transport;
}

export interface AuthProvider {
  apply(req: TransportRequest, ctx: AuthContext): Promise<TransportRequest>;
  /** Force new credentials (called once after a 401). */
  refresh?(ctx: AuthContext): Promise<void>;
}

/**
 * `Authorization: Bearer <token>`; `token` may be a (possibly async) getter.
 * An empty / undefined token throws an SdvError naming the family — the request
 * is never sent with `Bearer undefined`.
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

/** Static headers (e.g. an API-key header); `undefined` / empty values are dropped. */
export function headerAuth(headers: Record<string, string | undefined>): AuthProvider {
  return {
    async apply(req) {
      return { ...req, headers: mergeHeaders(present(headers), req.headers) };
    },
  };
}

/** Static query params (e.g. `{ apiKey: "…" }`); `undefined` / empty values are dropped. */
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
 */
export function tokenAuth(opts: {
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
 */
export function sessionAuth(opts: {
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
