// The single HTTP chokepoint: auth -> transport -> retry -> classify.
// Port of the Python `dl_utils.download()` retry loop + `errors.py` vocabulary.

import type { AuthContext } from "./auth.js";
import { resolveFamily } from "./config.js";
import { AssetFetchError, InvalidParameterError, NoDataError, SdvError, redactSecrets } from "./errors.js";
import {
  headerValue,
  mergeHeaders,
  type TransportRequest,
  type TransportResponse,
} from "./transport.js";

/** ESPN families whose 200 body `{ code: 404 }` means "no such resource". */
const ESPN_FAMILIES = new Set(["site_v2", "site_v2_alt", "web_v3", "core_v2", "fitt_v3", "cdn"]);

/** Ceiling on an honoured `Retry-After`, in seconds (same as sdv-py). */
const MAX_RETRY_AFTER_SECONDS = 120;

/**
 * Status retries get their own small cap (sdv-py `_MAX_STATUS_RETRIES`) so a
 * persistent 403 / 5xx can't spin the whole budget; network retries don't.
 */
const MAX_STATUS_RETRIES = 4;

/**
 * Test seam for the backoff sleep: `request()` awaits `_timer.sleep(ms)` between attempts.
 *
 * @remarks
 * Replace `sleep` in a test to make retries instant; `request.test.js` stubs it.
 * @internal
 */
export const _timer = {
  sleep: (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** Parse `Retry-After` (seconds or HTTP-date) to seconds, clamped at 0; undefined if unparseable. */
function parseRetryAfter(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs);
  const when = Date.parse(value);
  return Number.isNaN(when) ? undefined : Math.max(0, (when - Date.now()) / 1000);
}

/**
 * Milliseconds to wait before retry number `attempt + 1`: the server's
 * `Retry-After` (capped at 120s) when present, else exponential backoff
 * 0.5s * 2^attempt capped at 4s, with 50-100% jitter.
 *
 * @param attempt - Zero-based index of the attempt that just failed: 0 → 0.5 s, 1 → 1 s,
 *   2 → 2 s, 3+ → 4 s (before jitter).
 * @param retryAfter - The response's `Retry-After` header: seconds or an HTTP-date. Blank or
 *   unparseable falls back to the backoff schedule; a date in the past counts as 0.
 * @returns Milliseconds to sleep. From `Retry-After`: exactly `min(120, seconds) * 1000`, no
 *   jitter. Otherwise the backoff delay scaled by a random factor in [0.5, 1).
 * @example
 * ```ts
 * import { retryDelayMs } from './core/request.js'; // not re-exported from the package root
 *
 * retryDelayMs(0);               // 250..500 ms
 * retryDelayMs(5);               // 2000..4000 ms (capped at 4 s)
 * retryDelayMs(0, '3');          // 3000 ms
 * retryDelayMs(0, '600');        // 120000 ms (capped at 120 s)
 * ```
 */
export function retryDelayMs(attempt: number, retryAfter?: string): number {
  const secs = parseRetryAfter(retryAfter);
  if (secs !== undefined) return Math.min(MAX_RETRY_AFTER_SECONDS, secs) * 1000;
  const delay = Math.min(4, 0.5 * 2 ** attempt);
  return delay * (0.5 + Math.random() * 0.5) * 1000;
}

function isEspnCode404(data: unknown): boolean {
  return (
    typeof data === "object" && data !== null && Number((data as { code?: unknown }).code) === 404
  );
}

/** `host/path` of `url` — never the query string, which can carry an API key (sdv-py `_where`). */
function hostPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/** A bounded, single-line head of a body for an error message (sdv-py `_excerpt`). */
function excerpt(data: unknown): string {
  let text = "";
  if (typeof data === "string") text = data;
  else if (data !== undefined && data !== null && !(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
    try {
      text = JSON.stringify(data) ?? "";
    } catch {
      // a BigInt / circular body: no excerpt
    }
  }
  return text.trim().replace(/\s+/g, " ").slice(0, 200);
}

/** A 2xx body that carries nothing: no body, blank text, or zero bytes (204 / 205 aside). */
function isEmptyBody(data: unknown): boolean {
  if (data === undefined) return true;
  if (typeof data === "string") return data.trim() === "";
  return (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) && data.byteLength === 0;
}

/** `AssetFetchError("<family>: <host/path> answered HTTP <status> <what>")`, redacted. */
function failedBody(family: string, url: string, status: number, what: string): AssetFetchError {
  return new AssetFetchError(redactSecrets(`${family}: ${hostPath(url)} answered HTTP ${status} ${what}`), {
    url,
    status,
  });
}

/**
 * Decode the text body of a JSON-labelled response (sdv-py `_json_body`): a body
 * that does not decode is a failed fetch, never text for a parser. A blank body
 * is a 204 / 205 (`request()` already raised on every other empty 2xx) → `{}`.
 * Used by the text getters that branch on content-type (statcast, torvik).
 *
 * @param family - Family stem, for the error message.
 * @param res - The {@link TransportResponse} from {@link requestResponse}; only `data` and
 *   `status` are read.
 * @param url - Request URL, for the error (reduced to host / path in the message).
 * @returns `res.data` unchanged when it is not a string (the transport already parsed it);
 *   `{}` for a blank string body; otherwise the parsed JSON.
 * @throws AssetFetchError when the string body does not parse as JSON; the message carries
 *   a bounded, redacted excerpt of the body.
 * @example
 * ```ts
 * import { jsonBody, requestResponse } from './core/request.js';
 *
 * const res = await requestResponse('mlb_statcast', { method: 'GET', url, responseType: 'text' });
 * const data = /json/.test(res.headers['content-type'] ?? '') ? jsonBody('mlb_statcast', res, url) : res.data;
 * ```
 * @internal
 */
export function jsonBody(family: string, res: TransportResponse, url: string): unknown {
  if (typeof res.data !== "string") return res.data;
  if (!res.data.trim()) return {};
  try {
    return JSON.parse(res.data);
  } catch {
    throw failedBody(family, url, res.status, `with a JSON content-type but a body that does not decode: ${excerpt(res.data)}`);
  }
}

/**
 * Like {@link request} but resolves with the whole response (status, headers,
 * data) — for runtimes that branch on response headers (e.g. content-type).
 *
 * @param family - Family stem (`"site_v2"`, `"mlb"`, `"nfl_api"`, …): selects the transport,
 *   auth, retry statuses, retry budget, timeout and `classifyError` via `resolveFamily`.
 * @param req - The {@link TransportRequest}. `timeoutMs` defaults to the family's; the family
 *   `User-Agent` is added unless the request or the auth provider already sets one.
 * @returns The final 2xx {@link TransportResponse}. A 204 / 205 resolves with `data` `{}`
 *   (`""` when `req.responseType` is `"text"`).
 * @throws NoDataError on HTTP 404, or an ESPN-family (`site_v2`, `site_v2_alt`, `web_v3`,
 *   `core_v2`, `fitt_v3`, `cdn`) 2xx body `{ code: 404 }`.
 * @throws InvalidParameterError on HTTP 400 / 422 (never retried).
 * @throws AssetFetchError when the answer is unknown: a network error that outlived
 *   `retries`, a non-2xx that outlived the retries, an empty 2xx body (204 / 205 aside), a JSON
 *   request whose 2xx body is a string (did not decode), an ESPN-family 2xx body that is not an
 *   object, or a throwing `auth.apply` / `auth.refresh` (`"<family>: auth failed (apply|refresh)"`).
 *   A family's `classifyError` may replace it with its own SdvError.
 * @throws SdvError any SdvError thrown by the transport or the auth provider passes through
 *   unchanged and is never retried (e.g. `TransportUnavailableError`).
 * @example
 * ```ts
 * import { requestResponse } from './core/request.js'; // not re-exported from the package root
 *
 * const res = await requestResponse('mlb_statcast', {
 *   method: 'GET',
 *   url: 'https://baseballsavant.mlb.com/leaderboard/custom',
 *   query: { year: 2024, csv: true },
 *   responseType: 'text',
 * });
 * const isCsv = /csv/.test(res.headers['content-type'] ?? '');
 * ```
 * @remarks
 * Retry accounting: `retries` (default 3) attempts after the first, of which at most
 * `min(retries, 4)` may be spent on the family's retry statuses (default
 * {@link DEFAULT_RETRY_STATUSES}); network errors may use the whole budget. The sleep between
 * attempts is {@link retryDelayMs} (`Retry-After` honoured, capped at 120 s). A 401 triggers one
 * `auth.refresh` and one re-send, outside the retry budget. Error messages name the host, path
 * and status, never the query string, and go through `redactSecrets`.
 */
export async function requestResponse(
  family: string,
  req: TransportRequest
): Promise<TransportResponse> {
  const { transport, auth, retries, timeoutMs, userAgent, retryStatuses, classifyError } =
    resolveFamily(family);
  // Same accounting as sdv-py: one attempt budget (`retries`), of which at most
  // min(retries, 4) may be spent on retryable statuses.
  const statusBudget = Math.min(retries, MAX_STATUS_RETRIES);
  const ctx: AuthContext = { family, transport };
  const base: TransportRequest = { ...req, timeoutMs: req.timeoutMs ?? timeoutMs };
  const where = { url: req.url };
  let attempt = 0;
  let statusRetries = 0;
  let refreshed = false;
  // Auth failures (a throwing mint / login / token getter) are never retried
  // here — re-submitting credentials is the provider's call — and are named as
  // the auth step, not blamed on the data URL. An SdvError passes through.
  const authFailed = (step: string, err: unknown, status?: number): SdvError =>
    err instanceof SdvError
      ? err
      : new AssetFetchError(`${family}: auth failed (${step})`, { ...where, status, cause: err });

  for (;;) {
    let authed: TransportRequest;
    try {
      authed = auth ? await auth.apply(base, ctx) : base;
    } catch (err) {
      throw authFailed("apply", err);
    }
    let res: TransportResponse;
    try {
      res = await transport({
        ...authed,
        headers: mergeHeaders({ "User-Agent": userAgent }, authed.headers),
      });
    } catch (err) {
      if (err instanceof SdvError) throw err;
      if (attempt < retries) {
        await _timer.sleep(retryDelayMs(attempt));
        attempt++;
        continue;
      }
      throw new AssetFetchError(
        `${family}: request failed after ${attempt + 1} attempt(s): ${req.url}`,
        { ...where, cause: err }
      );
    }

    const { status } = res;
    if (status === 401 && auth?.refresh && !refreshed) {
      refreshed = true;
      try {
        await auth.refresh({ ...ctx, request: base });
      } catch (err) {
        throw authFailed("refresh", err, status);
      }
      continue;
    }
    if (status >= 200 && status < 300) {
      // sdv-py `_json_text` / `_text_body`. 204 / 205 carry no content by
      // definition: success with nothing in it.
      if (status === 204 || status === 205) return { ...res, data: req.responseType === "text" ? "" : {} };
      // Any other empty 2xx is not "nothing" (barttorvik's block, pro.nfl.com's
      // rejected params, a throttled stats host all answer that way), and a JSON
      // request whose body is still text did not decode (an HTML challenge or
      // error page): both are failed fetches, never an empty result. The family's
      // `classifyError` may name it (pro.nfl.com: InvalidParameterError).
      const bad = isEmptyBody(res.data)
        ? "with an empty body"
        : (req.responseType ?? "json") === "json" && typeof res.data === "string"
          ? `with a non-JSON body: ${excerpt(res.data)}`
          : undefined;
      if (bad) throw classifyError?.(res, req.url) ?? failedBody(family, req.url, status, bad);
      if (ESPN_FAMILIES.has(family)) {
        // ESPN's are JSON APIs: a 2xx body that is not a JSON object / array is a
        // failed fetch too.
        if (typeof res.data !== "object" || res.data === null) {
          throw new AssetFetchError(
            `${family}: HTTP ${status} with a non-JSON body (a bot challenge or error page?): ${req.url}`,
            { ...where, status }
          );
        }
        if (isEspnCode404(res.data)) {
          throw new NoDataError(`${family}: no data (ESPN code 404): ${req.url}`, {
            ...where,
            status,
          });
        }
      }
      return res;
    }
    if (status === 404) {
      throw new NoDataError(`${family}: HTTP 404: ${req.url}`, { ...where, status });
    }
    if (status === 400 || status === 422) {
      // The request itself is wrong; no retry can help (sdv-py ValueError).
      throw new InvalidParameterError(
        redactSecrets(`${family}: ${hostPath(req.url)} rejected the request: HTTP ${status}: ${excerpt(res.data)}`),
        { ...where, status }
      );
    }
    if (retryStatuses.includes(status) && statusRetries < statusBudget && attempt < retries) {
      await _timer.sleep(retryDelayMs(attempt, headerValue(res.headers, "retry-after")));
      statusRetries++;
      attempt++;
      continue;
    }
    const classified = classifyError?.(res, req.url);
    if (classified) throw classified;
    throw new AssetFetchError(
      `${family}: HTTP ${status} after ${attempt + 1} attempt(s): ${req.url}`,
      { ...where, status }
    );
  }
}

/**
 * Fetch through the family's configured transport + auth and return the body.
 *
 * Auth is applied, then the transport is called. A failing `auth.apply` /
 * `auth.refresh` is not retried: an SdvError passes through, anything else
 * becomes `AssetFetchError("<family>: auth failed (apply|refresh)")`. A 401
 * triggers one `auth.refresh` and a retry. Network errors and the family's retry statuses
 * (default 403 / 408 / 429 / 500 / 502 / 503 / 504; auth-gated families drop
 * 403) are retried with bounded exponential backoff + jitter (honouring
 * `Retry-After`), up to `retries` (default 3) attempts in all, at most 4 of
 * them on statuses. Then (sdv-py `_check_status` / `_json_body`):
 * - 2xx returns the data; 204 / 205 return `{}` (`""` for a `"text"` request).
 * - 404 — or an ESPN-family 200 body `{ code: 404 }` — throws {@link NoDataError}.
 * - 400 / 422 throw {@link InvalidParameterError}: the request is wrong.
 * - Any other failure throws the family's `classifyError` result when it
 *   registered one (`registerFamilyDefaults`), else {@link AssetFetchError}:
 *   a non-2xx that outlived the retries (a persisting 403 included), an empty
 *   2xx body, or a JSON request whose 2xx body is not JSON (an HTML page).
 *
 * A failed fetch never comes back as empty data. Error messages name the host,
 * path and status, never the query string, and are redacted.
 *
 * @param family - Family stem (`"site_v2"`, `"mlb"`, `"nfl_api"`, …) — selects transport + auth.
 * @param req - The {@link TransportRequest}: `method`, query-free `url`, `query`, `headers`,
 *   `body`, `timeoutMs` (default: the family's), `responseType` (default `"json"`).
 * @returns The response body: parsed JSON for a `"json"` request whose body was JSON, the text
 *   for `"text"`, an `ArrayBuffer` for `"arraybuffer"`; `{}` (or `""` for `"text"`) on 204 / 205.
 * @throws NoDataError on HTTP 404, or an ESPN-family 2xx body `{ code: 404 }`.
 * @throws InvalidParameterError on HTTP 400 / 422.
 * @throws AssetFetchError on every other failure (non-2xx after the retries, an empty or
 *   non-JSON 2xx body, a network error after the retries, a failing auth step), unless the
 *   family's `classifyError` names a more specific SdvError.
 * @throws SdvError any SdvError from the transport or auth provider passes through unchanged.
 * @example
 * ```ts
 * import { request } from './core/request.js'; // not re-exported from the package root
 * import { NoDataError } from 'sportsdataverse';
 *
 * try {
 *   const data = await request('site_v2', {
 *     method: 'GET',
 *     url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary',
 *     query: { event: 401671789 },
 *   });
 * } catch (err) {
 *   if (err instanceof NoDataError) return undefined; // nothing there; a failed fetch still throws
 *   throw err;
 * }
 * ```
 * @remarks
 * This is `(await requestResponse(family, req)).data`; see {@link requestResponse} for the
 * retry accounting and the headers / status of the final response.
 */
export async function request(family: string, req: TransportRequest): Promise<unknown> {
  return (await requestResponse(family, req)).data;
}
