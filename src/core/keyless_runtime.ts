// Runtime getters for the keyless provider / league-API families vendored from
// sdv-py: `on3`, `mls_api`, `nwsl_api` (browser User-Agent, plus the site Referer
// for MLS / NWSL) and `bart_wbb` (women's T-Rank; same raw-text contract as
// `torvik_runtime.ts`). None needs a key. Each fetches through `request()` under
// its own family stem, so the configured transport, retry and error vocabulary
// apply (a 404 is `NoDataError`, any other failed fetch `AssetFetchError`).
//
// sdv-py's `_get` returns `{}` on a missing / non-JSON body; here a 2xx body that
// is not JSON comes back as the raw string, and the parsers map non-object input
// to `[]`.
//
// NWSL composite ids (`nwsl::Football_Season::<hex>`) must reach the host with the
// `::` literal. They are substituted into the URL path by `resolveFlat` and the
// transport sends the absolute URL as given, so nothing percent-encodes them.

import { AssetFetchError } from "./errors.js";
import { request } from "./request.js";
import { mergeHeaders } from "./transport.js";

type Config = { params?: Record<string, unknown>; headers?: Record<string, string> };

// Same browser UA sdv-py sends to these hosts.
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const MLS_REFERER = "https://www.mlssoccer.com/";
export const NWSL_REFERER = "https://www.nwslsoccer.com/";

function makeGetter(family: string, defaults: Record<string, string>) {
  return async (url: string, config: Config = {}): Promise<any> => {
    const data = await request(family, {
      method: "GET",
      url,
      query: config.params,
      // caller headers win key-by-key
      headers: mergeHeaders(defaults, config.headers),
    });
    // These are JSON APIs. A 2xx body that is not JSON (an HTML bot-block / error page
    // arrives as a string) is a failed fetch, never an empty result; a genuinely empty
    // JSON body ([] / {}) is data and passes through.
    if (typeof data === "string") {
      throw new AssetFetchError(`${family}: expected JSON but received a non-JSON body: ${url}`, {
        url,
      });
    }
    return data ?? {};
  };
}

/** `api.on3.com` RDB: auth-free, browser UA. */
export const on3Get = makeGetter("on3", { "User-Agent": BROWSER_UA });
/** The three mlssoccer.com hosts: auth-free, site Referer + browser UA. */
export const mlsGet = makeGetter("mls_api", { Referer: MLS_REFERER, "User-Agent": BROWSER_UA });
/** `api-sdp.nwslsoccer.com`: auth-free, site Referer + browser UA. */
export const nwslGet = makeGetter("nwsl_api", { Referer: NWSL_REFERER, "User-Agent": BROWSER_UA });
