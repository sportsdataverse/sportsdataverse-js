// BartTorvik / T-Rank runtime for the generated `torvik` flat wrappers. Port of
// hoopR's `torvik_utils.R` (`.torvik_text` + `.torvik_user_agent`).
//
// barttorvik.com is auth-free but rejects default programmatic User-Agents, so
// this getter sets a browser-like UA. The five wrapped endpoints are
// heterogeneous — two CSV (`text/csv`), two JSON (one even served with a
// `text/html` content-type), one headerless CSV — so this getter does NOT
// content-type-branch the body; it returns the RAW response text and lets each
// parser (`src/parsers/torvik.ts`) handle its own format (CSV via papaparse, or
// `JSON.parse` of the headerless positional arrays). A failed fetch throws
// (NoDataError / AssetFetchError) rather than masquerading as an empty table.

import { request } from "./request.js";
import { mergeHeaders } from "./transport.js";

// A polite browser-like UA (mirrors hoopR's approach), identifying sdv-js.
const UA = "Mozilla/5.0 (sportsdataverse-js; +https://js.sportsdataverse.org/)";

/**
 * GET a barttorvik.com URL and return the raw response body as a string.
 *
 * Signature matches `core/client.ts` `get` so it slots into the flat dispatch's
 * GETTER_OVERRIDES. Returns `""` for an empty body (the parsers map empty input
 * to `[]`).
 *
 * @param url    Fully-qualified barttorvik.com endpoint URL.
 * @param config `{ params, headers }`; params pass through verbatim (the caller
 *               drops `undefined`/`null`).
 * @returns The raw response text (CSV or JSON, per endpoint).
 * @throws NoDataError on 404; AssetFetchError on any other failed fetch.
 */
export async function torvikGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<string> {
  // Raw body text; the per-endpoint parser decides CSV-parse vs JSON.parse.
  const data = await request("torvik", {
    method: "GET",
    url,
    query: config.params,
    headers: mergeHeaders({ "User-Agent": UA }, config.headers),
    responseType: "text",
  });
  if (data == null) return "";
  return typeof data === "string" ? data : String(data);
}
