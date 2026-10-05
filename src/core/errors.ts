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

/**
 * Redact what must never reach a log from free text: URL query strings (API keys
 * ride there, e.g. The Odds API's `apiKey`) and `user:password@` URL credentials
 * (proxy URLs).
 */
export function redactSecrets(text: string): string {
  return text
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@'"]+@/gi, "$1<redacted>@")
    .replace(/(\b[a-z][a-z0-9+.-]*:\/\/[^\s?#'"]*)\?[^\s#'"]*/gi, "$1?<redacted>");
}

/**
 * A copy of `err` that is safe to keep as an error's `cause`: its name,
 * message and stack (both through {@link redactSecrets}) and its
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
  out.name = typeof e.name === "string" ? e.name : "Error";
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
