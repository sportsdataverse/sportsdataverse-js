// Error vocabulary shared by every sdv-js fetch path. Port of the Python
// `sportsdataverse/errors.py`.
//
// The two fetch errors are deliberately SIBLINGS, never parent/child:
//   - `NoDataError`     — the fetch SUCCEEDED and the answer is "nothing here"
//                         (HTTP 404, or ESPN's 200-with-`{ code: 404 }` body).
//   - `AssetFetchError` — the fetch FAILED and the answer is UNKNOWN (403, 429,
//                         5xx, a network error, an exhausted retry budget).
// Collapsing them would let a failed fetch masquerade as an empty season.

/** Where a fetch error came from. `url` never carries the query string. */
export interface FetchErrorDetails {
  /** Request URL (without query string, so keys passed as query params never leak). */
  url: string;
  /** HTTP status, when a response was received. */
  status?: number;
  /** Underlying error (e.g. the network error), when there was one. */
  cause?: unknown;
}

/** Names whose `name=value` / `"name": "value"` value is a credential. */
const SECRET_NAMES = String.raw`(?:password|passwd|pwd|(?:access_|refresh_|id_|auth_)?token|client_?secret|secret|api_?key|key|jwt)`;
/** A credential's alphabet (base64, base64url, hex, API keys, JWTs). */
const CREDENTIAL = String.raw`[A-Za-z0-9._~+/=-]+`;
const AUTH_HEADER = new RegExp(
  String.raw`\b((?:proxy-)?authorization|x-api-key)(["']?\s*[:=]\s*["']?)(?:(?:bearer|basic|token|digest|negotiate)\s+)?${CREDENTIAL}`,
  "gi"
);
const COOKIE_HEADER = /\b((?:set-)?cookie["']?\s*[:=]\s*["']?)[^"'\r\n]+/gi;
const BEARER = new RegExp(String.raw`\b(bearer\s+)(${CREDENTIAL})`, "gi");
const JWT = /\beyJ[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*/g;
const JSON_SECRET = new RegExp(String.raw`(["']${SECRET_NAMES}["']\s*:\s*["'])[^"']*`, "gi");
const PAIR_SECRET = new RegExp(String.raw`(?<![A-Za-z0-9])(${SECRET_NAMES}=)[^&\s"'<>]+`, "gi");

/**
 * A bare `Bearer x` is redacted only when `x` looks like a credential (8+
 * characters with a digit or symbol, or 20+), so prose such as "Bearer token
 * required" survives.
 */
const looksLikeCredential = (v: string): boolean => v.length >= 20 || (v.length >= 8 && /[^A-Za-z]/.test(v));

/**
 * Redact what must never reach a log from free text: URL query strings (API keys
 * ride there, e.g. The Odds API's `apiKey`), `user:password@` URL credentials
 * (proxy URLs), and credential-looking text a transport may echo in its error
 * message — `Authorization` / `Proxy-Authorization` / `X-Api-Key` and `Cookie` /
 * `Set-Cookie` values, `Bearer <token>`, JWT-shaped strings, and the value of
 * `password=` / `token=` / `api_key=` / `client_secret=` / … pairs (also as
 * `"password": "…"`). Ordinary text is left alone.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(AUTH_HEADER, "$1$2<redacted>")
    .replace(COOKIE_HEADER, "$1<redacted>")
    .replace(BEARER, (m: string, prefix: string, v: string) => (looksLikeCredential(v) ? `${prefix}<redacted>` : m))
    .replace(JWT, "<redacted>")
    .replace(JSON_SECRET, "$1<redacted>")
    .replace(PAIR_SECRET, "$1<redacted>")
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@'"]+@/gi, "$1<redacted>@")
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/[^\s?#'"]*)\?[^\s#'"]*/gi, "$1?<redacted>");
}

/**
 * A copy of `err` that is safe to keep as an error's `cause`: its name,
 * message and stack (all through {@link redactSecrets}, so a user transport's
 * own error text is covered too) and its
 * `code` / `errno` / `syscall` — nothing else. A raw HTTP-client error must
 * never be attached as-is: an axios error carries the request config, so its
 * `Authorization` header, cookies and a POSTed login form (password included)
 * would surface in `util.inspect(err)` or a logged stack. An SdvError is kept
 * (its own cause went through this when it was built).
 */
export function safeCause(err: unknown): unknown {
  if (err === undefined || err === null || err instanceof SdvError) return err;
  const e = (typeof err === "object" ? err : {}) as Record<string, unknown>;
  const out = new Error(redactSecrets(typeof e.message === "string" ? e.message : String(err)));
  out.name = typeof e.name === "string" ? redactSecrets(e.name) : "Error";
  for (const k of ["code", "errno", "syscall"]) {
    const v = e[k];
    if (typeof v === "string" || typeof v === "number") (out as unknown as Record<string, unknown>)[k] = v;
  }
  if (typeof e.stack === "string") out.stack = redactSecrets(e.stack);
  return out;
}

/**
 * Base class for every error sportsdataverse raises. A `cause` is always stored
 * through {@link safeCause}, whichever code path built the error.
 */
export class SdvError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options && "cause" in options ? { cause: safeCause(options.cause) } : undefined);
    this.name = new.target.name;
  }
}

/** The fetch succeeded and there is nothing there (HTTP 404, ESPN `{ code: 404 }`). */
export class NoDataError extends SdvError {
  readonly url: string;
  readonly status?: number;
  constructor(message: string, details: FetchErrorDetails) {
    super(message, { cause: details.cause });
    this.url = details.url;
    this.status = details.status;
  }
}

/** The fetch failed (403, 429, 5xx, network, exhausted retries) — the answer is unknown. */
export class AssetFetchError extends SdvError {
  readonly url: string;
  readonly status?: number;
  constructor(message: string, details: FetchErrorDetails) {
    super(message, { cause: details.cause });
    this.url = details.url;
    this.status = details.status;
  }
}

/**
 * The server rejected the request's parameters (e.g. HTTP 400 / 422 from the PFF
 * API, or NFL Pro's empty-body 200). Not a fetch failure and not "no data": the
 * call as made can never succeed — fix the arguments. (sdv-py raises ValueError.)
 */
export class InvalidParameterError extends SdvError {
  readonly url: string;
  readonly status?: number;
  constructor(message: string, details: FetchErrorDetails) {
    super(message, { cause: details.cause });
    this.url = details.url;
    this.status = details.status;
  }
}

/** A requested season is outside what the source supports. */
export class SeasonNotFoundError extends SdvError {}

/** An optional transport dependency (e.g. `impit`) is not installed. */
export class TransportUnavailableError extends SdvError {}

/** Back-compat alias: the error was ESPN-only when it was named. */
export const NoESPNDataError = NoDataError;
export type NoESPNDataError = NoDataError;
