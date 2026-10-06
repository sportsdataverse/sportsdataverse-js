// BartTorvik / T-Rank runtime for the generated `torvik` flat wrappers. Port of
// hoopR's `torvik_utils.R` (`.torvik_text` + `.torvik_user_agent`) and sdv-py's
// `mbb/torvik_runtime.py`.
//
// barttorvik.com is auth-free. hoopR sets a browser-like UA; sdv-js sends the
// configured `userAgent` (`configure({ userAgent })`; the default
// "Mozilla/5.0 (compatible; sportsdataverse-js/4.x)" answered 200 live,
// 2026-10-05), and a caller `User-Agent` header wins. The five wrapped endpoints are
// heterogeneous — two CSV (`text/csv`), two JSON (one even served with a
// `text/html` content-type), one headerless CSV — so this getter returns the RAW
// response text and lets each parser (`src/parsers/torvik.ts`) handle its own
// format (CSV via papaparse, or `JSON.parse` of the headerless positional arrays).
// A failed fetch throws rather than masquerading as an empty table: `request()`
// raises on a non-2xx and on the empty 200 barttorvik answers a blocked request
// with, and a JSON-labelled body that does not decode is an AssetFetchError here.

import { jsonBody, requestResponse } from "./request.js";

/**
 * GET a barttorvik.com URL and return the raw response body as a string.
 *
 * Signature matches `core/client.ts` `get` so it slots into the flat dispatch's
 * GETTER_OVERRIDES. A 204 / 205 returns `""` (the parsers map it to `[]`).
 *
 * @param url    Fully-qualified barttorvik.com endpoint URL.
 * @param config `{ params, headers }`; params pass through verbatim (the caller
 *               drops `undefined`/`null`).
 * @returns The raw response text (CSV or JSON, per endpoint).
 * @throws NoDataError on 404; InvalidParameterError on 400 / 422; AssetFetchError on any
 *         other failed fetch, an empty 200, or a JSON-labelled body that does not decode.
 */
export async function torvikGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {},
  family = "torvik"
): Promise<string> {
  // Raw body text; the per-endpoint parser decides CSV-parse vs JSON.parse.
  const res = await requestResponse(family, {
    method: "GET",
    url,
    query: config.params,
    headers: config.headers,
    responseType: "text",
  });
  // sdv-py: a JSON-labelled body that will not decode is a failed fetch, never text to parse.
  if (String(res.headers["content-type"] ?? "").toLowerCase().includes("json")) jsonBody(family, res, url);
  return typeof res.data === "string" ? res.data : String(res.data ?? "");
}

/** Women's T-Rank (`barttorvik.com/ncaaw`): the same getter under its own `bart_wbb` family stem. */
export const bartWbbGet = (
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<string> => torvikGet(url, config, "bart_wbb");
