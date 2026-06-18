// BartTorvik / T-Rank runtime for the generated `torvik` flat wrappers. Port of
// hoopR's `torvik_utils.R` (`.torvik_text` + `.torvik_user_agent`).
//
// barttorvik.com is auth-free but rejects default programmatic User-Agents, so
// this getter sets a browser-like UA. The five wrapped endpoints are
// heterogeneous — two CSV (`text/csv`), two JSON (one even served with a
// `text/html` content-type), one headerless CSV — so this getter does NOT
// content-type-branch the body; it returns the RAW response text and lets each
// parser (`src/parsers/torvik.ts`) handle its own format (CSV via papaparse, or
// `JSON.parse` of the headerless positional arrays). Returns `""` on transport
// failure so the parsers (which treat empty input as `[]`) chain cleanly.

import axios, { type AxiosRequestConfig } from "axios";

// A polite browser-like UA (mirrors hoopR's approach), identifying sdv-js.
const UA = "Mozilla/5.0 (sportsdataverse-js; +https://js.sportsdataverse.org/)";

const client = axios.create({
  timeout: 30000,
  headers: { "User-Agent": UA },
  // Always hand back the raw body string; the per-endpoint parser decides
  // whether to CSV-parse or JSON.parse it.
  responseType: "text",
  transformResponse: [(data) => data],
});

/**
 * GET a barttorvik.com URL and return the raw response body as a string.
 *
 * Signature matches `core/client.ts` `get` so it slots into the flat dispatch's
 * GETTER_OVERRIDES. Returns `""` when the request yields no usable response (so
 * the parsers, which map empty input to `[]`, never need a null-check).
 *
 * @param url    Fully-qualified barttorvik.com endpoint URL.
 * @param config Axios request config (e.g. `{ params }`); params pass through
 *               verbatim (the caller drops `undefined`/`null`).
 * @returns The raw response text (CSV or JSON, per endpoint).
 */
export async function torvikGet(
  url: string,
  config?: AxiosRequestConfig
): Promise<string> {
  let res;
  try {
    res = await client.get(url, config);
  } catch {
    return "";
  }
  if (res == null || res.data == null) return "";
  return typeof res.data === "string" ? res.data : String(res.data);
}
