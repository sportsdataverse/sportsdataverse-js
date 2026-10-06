// Error vocabulary shared by every sdv-js fetch path. Port of the Python
// `sportsdataverse/errors.py`.
//
// The two fetch errors are deliberately SIBLINGS, never parent/child:
//   - `NoDataError`     — the fetch SUCCEEDED and the answer is "nothing here"
//                         (HTTP 404, or ESPN's 200-with-`{ code: 404 }` body).
//   - `AssetFetchError` — the fetch FAILED and the answer is UNKNOWN (403, 429,
//                         5xx, a network error, an exhausted retry budget).
// Collapsing them would let a failed fetch masquerade as an empty season.

/**
 * Where a fetch error came from. `url` never carries the query string.
 *
 * @remarks
 * Passed to the constructors of {@link NoDataError}, {@link AssetFetchError} and
 * {@link InvalidParameterError}; `cause` is stored through {@link safeCause}, so a raw
 * HTTP-client error (request config, headers, cookies) never rides on the error.
 */
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
 *
 * @param text - Free text that may hold a credential: an error message, a stack, a URL, a header dump.
 * @returns The same text with each secret replaced by `<redacted>` (a URL's whole query
 *   string becomes `?<redacted>`, a URL's `user:password@` becomes `<redacted>@`).
 * @example
 * ```ts
 * import { redactSecrets } from './core/errors.js'; // not re-exported from the package root
 *
 * redactSecrets('https://api.the-odds-api.com/v4/sports?apiKey=abc123');
 * // 'https://api.the-odds-api.com/v4/sports?<redacted>'
 * redactSecrets('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.sig');
 * // 'Authorization: <redacted>'
 * ```
 * @remarks
 * Every pattern is linear in the input (a test bounds 100 KB of adversarial input at
 * under 50 ms). A bare `Bearer x` is redacted only when `x` looks like a credential
 * (8+ characters with a digit or symbol, or 20+), a bare `key=x` only when `x` is 16+
 * characters, so prose such as "Bearer token required" or "primary key=player_id"
 * survives. Every error message sportsdataverse builds goes through this; call it
 * yourself before logging text from a third-party HTTP client.
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
 *
 * @param err - Anything caught: an `Error`, an axios / fetch client error, a string, `undefined`.
 * @returns `err` itself when it is `undefined`, `null` or an {@link SdvError}; otherwise a new
 *   plain `Error` carrying only the redacted `name`, `message` and `stack` plus a string or
 *   number `code` / `errno` / `syscall`. A non-object `err` becomes `Error(String(err))`.
 * @example
 * ```ts
 * import { AssetFetchError } from 'sportsdataverse';
 * import { safeCause } from './core/errors.js'; // not re-exported from the package root
 *
 * try {
 *   await myHttpClient.get(url);
 * } catch (err) {
 *   throw new AssetFetchError('my_family: fetch failed', { url, cause: safeCause(err) });
 * }
 * ```
 * @remarks
 * {@link SdvError}'s constructor already applies this to `options.cause`, so an error
 * built through any sportsdataverse error class never needs it called explicitly; the
 * built-in transports call it on the error they reject with.
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
 *
 * @example
 * ```ts
 * import sdv, { SdvError } from 'sportsdataverse';
 *
 * try {
 *   await sdv.nfl.espnNflScoreboard({ dates: 20240908 });
 * } catch (err) {
 *   if (err instanceof SdvError) console.error(err.name, err.message); // never a raw client error
 *   else throw err;
 * }
 * ```
 * @remarks
 * `name` is the concrete subclass name (`new.target.name`), so `err.name` reads
 * `"NoDataError"` / `"AssetFetchError"` / … in logs. The direct fetch subclasses
 * {@link NoDataError} and {@link AssetFetchError} are deliberately siblings, never
 * parent / child, so a failed fetch can never be caught as "no data".
 */
export class SdvError extends Error {
  /**
   * @param message - Human-readable message; callers redact it (see {@link redactSecrets}).
   * @param options - `{ cause }` as for `Error`; the cause is stored through {@link safeCause}.
   *   When `options` has no `cause` key, no cause is attached.
   */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options && "cause" in options ? { cause: safeCause(options.cause) } : undefined);
    this.name = new.target.name;
  }
}

/**
 * The fetch succeeded and there is nothing there (HTTP 404, ESPN `{ code: 404 }`).
 *
 * @example
 * ```ts
 * import sdv, { NoDataError } from 'sportsdataverse';
 *
 * try {
 *   await sdv.nfl.espnNflSummary({ event: 1 });
 * } catch (err) {
 *   if (err instanceof NoDataError) return []; // skip: a season gap, not a failure
 *   throw err;
 * }
 * ```
 * @remarks
 * Sibling of {@link AssetFetchError}, never its parent or child: catching one never
 * catches the other. `NoESPNDataError` is a back-compat alias of this class.
 */
export class NoDataError extends SdvError {
  /** Request URL, without the query string. */
  readonly url: string;
  /** HTTP status when a response was received (404, or 200 for ESPN's `{ code: 404 }` body). */
  readonly status?: number;
  /**
   * @param message - Message naming the family and the resource (`"site_v2: HTTP 404: …"`).
   * @param details - `url` (query-free), optional `status` and `cause` ({@link FetchErrorDetails}).
   */
  constructor(message: string, details: FetchErrorDetails) {
    super(message, { cause: details.cause });
    this.url = details.url;
    this.status = details.status;
  }
}

/**
 * The fetch failed (403, 429, 5xx, network, exhausted retries) — the answer is unknown.
 *
 * @example
 * ```ts
 * import sdv, { AssetFetchError, NoDataError } from 'sportsdataverse';
 *
 * try {
 *   await sdv.nfl.espnNflSummary({ event: 401671789 });
 * } catch (err) {
 *   if (err instanceof NoDataError) return [];
 *   if (err instanceof AssetFetchError) console.error(err.status, err.url, err.cause); // surface it
 *   throw err;
 * }
 * ```
 * @remarks
 * Also what `request()` throws for a failing auth step (`"<family>: auth failed (apply)"`),
 * an empty 2xx body, or a JSON request whose 2xx body is not JSON. Never record one as an
 * empty season: a failed fetch is not "no data" ({@link NoDataError}).
 */
export class AssetFetchError extends SdvError {
  /** Request URL, without the query string. */
  readonly url: string;
  /** HTTP status of the final response; absent when no response arrived (network error). */
  readonly status?: number;
  /**
   * @param message - Message naming the family, host / path and status, already redacted.
   * @param details - `url` (query-free), optional `status` and `cause` ({@link FetchErrorDetails}).
   */
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
 *
 * @example
 * ```ts
 * import sdv, { InvalidParameterError } from 'sportsdataverse';
 *
 * try {
 *   await sdv.nfl.pffApiTeamStats({ league: 'nfl', season: 'not-a-season' });
 * } catch (err) {
 *   if (err instanceof InvalidParameterError) console.error(err.status, err.message); // 400 / 422
 *   else throw err;
 * }
 * ```
 * @remarks
 * `request()` throws it for HTTP 400 / 422 without retrying; a family's `classifyError`
 * (see `registerFamilyDefaults`) may also return one for a 2xx with an empty body.
 */
export class InvalidParameterError extends SdvError {
  /** Request URL, without the query string. */
  readonly url: string;
  /** HTTP status (400 / 422, or 200 when a family classified an empty body). */
  readonly status?: number;
  /**
   * @param message - Message naming the family, host / path, status and a body excerpt, redacted.
   * @param details - `url` (query-free), optional `status` and `cause` ({@link FetchErrorDetails}).
   */
  constructor(message: string, details: FetchErrorDetails) {
    super(message, { cause: details.cause });
    this.url = details.url;
    this.status = details.status;
  }
}

/**
 * A requested season is outside what the source supports.
 *
 * @example
 * ```ts
 * import sdv, { SeasonNotFoundError } from 'sportsdataverse';
 *
 * try {
 *   await sdv.nfl.loadNflPbp({ seasons: [1950] });
 * } catch (err) {
 *   if (err instanceof SeasonNotFoundError) console.warn(err.message);
 *   else throw err;
 * }
 * ```
 * @remarks
 * Takes the {@link SdvError} constructor: `(message, options?)`; it carries no `url`.
 */
export class SeasonNotFoundError extends SdvError {}

/**
 * An optional transport dependency (e.g. `impit`) is not installed.
 *
 * @example
 * ```ts
 * import sdv, { configure, createImpersonatingTransport, TransportUnavailableError } from 'sportsdataverse';
 *
 * configure({ transport: { nba_stats: createImpersonatingTransport() } });
 * try {
 *   await sdv.nba.nbaStatsLeaguedashplayerstats({ leagueId: '00' });
 * } catch (err) {
 *   if (err instanceof TransportUnavailableError) console.error('run: npm install impit');
 *   else throw err;
 * }
 * ```
 * @remarks
 * Thrown by the transport from `createImpersonatingTransport()` on every call until
 * `impit` can be imported; its `cause` is the import error. `request()` never retries
 * an SdvError, so it reaches the caller on the first attempt.
 */
export class TransportUnavailableError extends SdvError {}

/**
 * Back-compat alias of {@link NoDataError}: the error was ESPN-only when it was named.
 *
 * @remarks
 * The same class object, not a subclass: `err instanceof NoESPNDataError` and
 * `err instanceof NoDataError` are always equal. Prefer `NoDataError` in new code.
 */
export const NoESPNDataError = NoDataError;
/** Type alias of {@link NoDataError} for the back-compat `NoESPNDataError` name. */
export type NoESPNDataError = NoDataError;
