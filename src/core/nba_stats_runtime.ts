// Runtime for the generated `nba_stats` / `wnba_stats` flat wrappers. Port of
// sdv-py `nba/nba_stats_runtime.py` (`stats_headers` + `_get`).
//
// stats.nba.com / stats.wnba.com fingerprint-block plain HTTP clients: the
// request silently HANGS (no error, no status) instead of failing, and the hosts
// also hang on datacenter / cloud IPs. So this family installs, by default, the
// TLS-impersonating transport (optional peer dep `impit`) and never retries 403.
// Because a hang is indistinguishable from "no data", nothing here turns a
// timeout, blank body or bare `{}` into an empty result: those throw.

import { registerFamilyDefaults, DEFAULT_RETRY_STATUSES } from "./config.js";
import { AssetFetchError, TransportUnavailableError } from "./errors.js";
import { request } from "./request.js";
import { createImpersonatingTransport, mergeHeaders, type Transport } from "./transport.js";

const IMPIT_HINT =
  "stats.nba.com / stats.wnba.com fingerprint-block plain HTTP clients (the request hangs " +
  "instead of failing), so these families need the optional TLS-impersonating transport: " +
  "`npm install impit`. They also hang on datacenter / cloud IPs (GitHub Actions, AWS, …): " +
  "run from a residential connection, or pass a residential proxy via " +
  "`createImpersonatingTransport({ proxyUrl })`.";

/**
 * Browser headers stats.nba.com expects (sdv-py `stats_headers`). `Host` and
 * `Connection` are left to the HTTP stack (illegal / automatic over HTTP/2), and
 * no `User-Agent` is set so the impersonated browser's own UA (which matches its
 * client hints) is sent.
 */
export function statsHeaders(host: string = "stats.nba.com"): Record<string, string> {
  const wnba = host.includes("wnba");
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: wnba ? "https://www.wnba.com/" : "https://www.nba.com/",
    Origin: wnba ? "https://www.wnba.com" : "https://www.nba.com",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
  };
}

/** Family default transport: impit (chrome), the default UA stripped, install hint on failure. */
export function createNbaStatsTransport(opts: { browser?: string; proxyUrl?: string } = {}): Transport {
  const inner = createImpersonatingTransport({ browser: opts.browser ?? "chrome", proxyUrl: opts.proxyUrl });
  return async (req) => {
    // request() adds a generic User-Agent; over impit it would contradict the
    // browser fingerprint (sdv-py measured the mismatch), so drop it.
    const headers = Object.fromEntries(
      Object.entries(req.headers ?? {}).filter(([k]) => k.toLowerCase() !== "user-agent")
    );
    try {
      return await inner({ ...req, headers });
    } catch (err) {
      if (err instanceof TransportUnavailableError) {
        throw new TransportUnavailableError(`${err.message} ${IMPIT_HINT}`, { cause: err });
      }
      throw err;
    }
  };
}

const RETRY_STATUSES = DEFAULT_RETRY_STATUSES.filter((s) => s !== 403);
for (const family of ["nba_stats", "wnba_stats"]) {
  // 403 here is a real block (wrong fingerprint / IP), not load: never retried.
  registerFamilyDefaults(family, { transport: createNbaStatsTransport(), retryStatuses: RETRY_STATUSES });
}

/**
 * GET a stats.nba.com / stats.wnba.com endpoint and return the parsed JSON.
 * Signature matches `core/client.ts` `get` (slots into GETTER_OVERRIDES).
 * Params are sorted alphabetically (nba_api: "for some reason this matters for some
 * requests") and `GameID` is zero-padded to 10.
 *
 * @throws NoDataError on 404; AssetFetchError on any failed fetch AND on a 200 whose
 *   body is blank, undecodable or a bare `{}` (sdv-py's transient-throttle shape), so
 *   a throttled reply is never mistaken for "no data".
 */
export async function nbaStatsGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string>; family: string }
): Promise<any> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config.params ?? {})) if (v !== undefined && v !== null) clean[k] = v;
  if ("GameID" in clean) clean.GameID = String(clean.GameID).padStart(10, "0");
  const query = Object.fromEntries(Object.entries(clean).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const data = await request(config.family, {
    method: "GET",
    url,
    query,
    headers: mergeHeaders(statsHeaders(new URL(url).host), config.headers),
    responseType: "text",
  });
  let payload: unknown;
  try {
    payload = typeof data === "string" ? (data.trim() ? JSON.parse(data) : undefined) : data;
  } catch {
    payload = undefined;
  }
  if (!payload || typeof payload !== "object" || Object.keys(payload as object).length === 0) {
    throw new AssetFetchError(
      `${config.family}: blank, undecodable or empty body (likely a throttled reply, not "no data"): ${url}`,
      { url }
    );
  }
  return payload;
}
