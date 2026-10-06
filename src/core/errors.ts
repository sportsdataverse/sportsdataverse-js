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

// Every pattern below is linear in the input: a scan that could fail late
// (a scheme, a JWT segment) is gated by a lookbehind so it only starts at the
// beginning of a run, never at every character of one (a test bounds 100 KB of
// adversarial input at < 50 ms).

/** Names whose `name=value` / `name: value` / `"name": "value"` value is a credential. */
const SECRET_NAMES = String.raw`(?:password|passwd|pwd|(?:(?:access|refresh|id|auth|session)[_-]?)?token|client[_-]?secret|secret|api[_-]?key|key|jwt)`;
/** `=` / `:` (also URL-encoded, `%3D` / `%3A`), with optional spaces and quotes. */
const SEP = String.raw`["']?\s*(?:[:=]|%3[ADad])\s*["']?`;
/** A credential's alphabet (base64, base64url, hex, API keys, JWTs, URL-encoded). */
const CREDENTIAL = String.raw`[A-Za-z0-9._~+/=%-]+`;
/** An auth scheme and its separator (a space, or `%20` / `+` when URL-encoded). */
const SCHEME = String.raw`(?:bearer|basic|token|digest|negotiate)(?:\s+|%20|\+)`;
const AUTH_HEADER = new RegExp(
  String.raw`\b((?:proxy-)?authorization|x-api-key|x-auth-token|x-access-token|api-key|ocp-apim-subscription-key)(${SEP})(?:${SCHEME})?${CREDENTIAL}`,
  "gi"
);
const COOKIE_HEADER = /\b((?:set-)?cookie["']?\s*[:=]\s*["']?)[^"'\r\n]+/gi;
const BARE_SCHEME = new RegExp(String.raw`\b((bearer|basic)(?:\s+|%20|\+))(${CREDENTIAL})`, "gi");
// sdv-py `errors._SECRET_PAIR`. The name starts a word, or follows a URL escape
// (`…%26password%3D…`); the leading lookahead (every name's first letter) only
// makes the scan cheaper. A quoted value runs to its closing quote (it may hold
// spaces); an unquoted one stops at the first separator.
const PAIR_SECRET = new RegExp(
  String.raw`(?=[acijkprst])(?<=^|[^A-Za-z0-9]|%[0-9A-Fa-f]{2})((${SECRET_NAMES})${SEP})((?<=")[^"\n]*|(?<=')[^'\n]*|[^&\s"'<>]+)`,
  "gi"
);
/** A run that may hold a JWT (dots included); started only at a run boundary. */
const TOKEN_RUN = /(?<![A-Za-z0-9_.-])[A-Za-z0-9_.-]+/g;
const URL_USERINFO = /(?<![a-z0-9+.-])([a-z0-9+.-]+:\/\/)[^\s/@'"]+@/gi;
// The path stops at the next `://`, so each URL's scan is bounded by the next one.
const URL_QUERY = /(?<![a-z0-9+.-])([a-z0-9+.-]+:\/\/(?:(?!:\/\/)[^\s?#'"])*)\?[^\s#'"]*/gi;

/**
 * A bare `Bearer x` is redacted only when `x` looks like a credential (8+
 * characters with a digit or symbol, or 20+), so prose such as "Bearer token
 * required" survives.
 */
const looksLikeCredential = (v: string): boolean => v.length >= 20 || (v.length >= 8 && /[^A-Za-z]/.test(v));

/** `Basic x`: also redacted when `x` is base64 of printable `user:password`. */
function isBasicCredential(v: string): boolean {
  if (v.length < 8 || v.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(v)) return false;
  try {
    const raw = atob(v);
    return raw.includes(":") && /^[\x20-\x7e]+$/.test(raw);
  } catch {
    return false;
  }
}

/**
 * sdv-py `_redact_pair`. An unquoted value (`{'key': 1234}`, `(token=abc)`) runs
 * into the punctuation that closes it; that punctuation stays out of the
 * redaction. A quoted value already stopped at its quote, so all of it is the
 * secret. A bare `key` must look like a credential (16+ characters, as every
 * HockeyTech key is), so "primary key=player_id" survives; the short value is
 * still scanned, since it may hold an escaped pair of its own.
 */
function redactPair(_m: string, prefix: string, name: string, value: string): string {
  const secret = /["']$/.test(prefix) ? value : value.replace(/[,;)\]}]+$/, "");
  if (name.toLowerCase() === "key" && secret.length < 16) return prefix + value.replace(PAIR_SECRET, redactPair);
  return `${prefix}<redacted>${value.slice(secret.length)}`;
}

/** Cut each JWT (`eyJ…` header, payload, signature) out of a dotted run, even when glued to a prefix. */
function redactJwts(run: string): string {
  if (!run.includes("eyJ")) return run;
  const seg = run.split(".");
  const out: string[] = [];
  for (let i = 0; i < seg.length; i++) {
    const at = seg[i].indexOf("eyJ");
    if (at >= 0 && seg[i].length - at >= 8 && i + 2 < seg.length && seg[i + 1].length >= 2) {
      out.push(`${seg[i].slice(0, at)}<redacted>`);
      i += 2; // the payload and signature go with it
    } else {
      out.push(seg[i]);
    }
  }
  return out.join(".");
}

/**
 * Redact what must never reach a log from free text: URL query strings (API keys
 * ride there, e.g. The Odds API's `apiKey`), `user:password@` URL credentials
 * (proxy URLs), and credential-looking text a transport may echo in its error
 * message — `Authorization` / `Proxy-Authorization` / `X-Api-Key` /
 * `X-Auth-Token` / `X-Access-Token` / `Api-Key` / `Ocp-Apim-Subscription-Key`
 * and `Cookie` / `Set-Cookie` values, `Bearer <token>` / `Basic <base64>`,
 * JWT-shaped strings, and the value of `password` / `token` / `accessToken` /
 * `api_key` / `client_secret` / … pairs (`=`, `:` or URL-encoded, also as
 * `"password": "…"`). Ordinary text is left alone.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(AUTH_HEADER, "$1$2<redacted>")
    .replace(COOKIE_HEADER, "$1<redacted>")
    .replace(BARE_SCHEME, (m: string, prefix: string, scheme: string, v: string) =>
      looksLikeCredential(v) || (scheme.toLowerCase() === "basic" && isBasicCredential(v)) ? `${prefix}<redacted>` : m
    )
    .replace(TOKEN_RUN, redactJwts)
    .replace(PAIR_SECRET, redactPair)
    .replace(URL_USERINFO, "$1<redacted>@")
    .replace(URL_QUERY, "$1?<redacted>");
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
