// The single HTTP chokepoint: auth -> transport -> retry -> classify.
// Port of the Python `dl_utils.download()` retry loop + `errors.py` vocabulary.

import type { AuthContext } from "./auth.js";
import { resolveFamily } from "./config.js";
import { AssetFetchError, NoDataError, SdvError } from "./errors.js";
import {
  headerValue,
  mergeHeaders,
  type TransportRequest,
  type TransportResponse,
} from "./transport.js";

/** ESPN families whose 200 body `{ code: 404 }` means "no such resource". */
const ESPN_FAMILIES = new Set(["site_v2", "site_v2_alt", "web_v3", "core_v2"]);

/** Ceiling on an honoured `Retry-After`, in seconds (same as sdv-py). */
const MAX_RETRY_AFTER_SECONDS = 120;

/**
 * Test seam for the backoff sleep.
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

/**
 * Like {@link request} but resolves with the whole response (status, headers,
 * data) — for runtimes that branch on response headers (e.g. content-type).
 */
export async function requestResponse(
  family: string,
  req: TransportRequest
): Promise<TransportResponse> {
  const { transport, auth, retries, timeoutMs, userAgent } = resolveFamily(family);
  const ctx: AuthContext = { family, transport };
  const base: TransportRequest = { ...req, timeoutMs: req.timeoutMs ?? timeoutMs };
  const where = { url: req.url };
  let attempt = 0;
  let refreshed = false;

  for (;;) {
    let res: TransportResponse;
    try {
      const authed = auth ? await auth.apply(base, ctx) : base;
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
        await auth.refresh(ctx);
      } catch (err) {
        if (err instanceof SdvError) throw err;
        throw new AssetFetchError(`${family}: auth refresh failed: ${req.url}`, {
          ...where,
          status,
          cause: err,
        });
      }
      continue;
    }
    if (status >= 200 && status < 300) {
      if (ESPN_FAMILIES.has(family) && isEspnCode404(res.data)) {
        throw new NoDataError(`${family}: no data (ESPN code 404): ${req.url}`, {
          ...where,
          status,
        });
      }
      return res;
    }
    if (status === 404) {
      throw new NoDataError(`${family}: HTTP 404: ${req.url}`, { ...where, status });
    }
    if ((status === 429 || status >= 500) && attempt < retries) {
      await _timer.sleep(retryDelayMs(attempt, headerValue(res.headers, "retry-after")));
      attempt++;
      continue;
    }
    throw new AssetFetchError(
      `${family}: HTTP ${status} after ${attempt + 1} attempt(s): ${req.url}`,
      { ...where, status }
    );
  }
}

/**
 * Fetch through the family's configured transport + auth and return the body.
 *
 * Auth is applied, then the transport is called. A 401 triggers one
 * `auth.refresh` and a retry. 429 / 5xx / network errors are retried with
 * bounded exponential backoff + jitter (honouring `Retry-After`), up to
 * `retries` (default 3). Then: 2xx returns the data; 404 — or an ESPN-family
 * 200 body `{ code: 404 }` — throws {@link NoDataError}; anything else throws
 * {@link AssetFetchError}. 403 is never retried.
 *
 * @param family Family stem (`"site_v2"`, `"mlb"`, `"nfl_api"`, …) — selects transport + auth.
 */
export async function request(family: string, req: TransportRequest): Promise<unknown> {
  return (await requestResponse(family, req)).data;
}
