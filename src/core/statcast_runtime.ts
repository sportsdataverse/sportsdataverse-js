// Content-type-aware getter for the generated `mlb_statcast` (Baseball Savant)
// wrappers. Port of the Python `sportsdataverse/mlb/mlb_statcast_runtime.py`.
//
// Baseball Savant (`baseballsavant.mlb.com`) is heterogeneous: leaderboards
// return **CSV** when called with `csv=true` (`text/csv`), the per-game feed
// `/gf` and `/schedule` return **JSON** (`application/json`), and a couple of
// leaderboards (`fielding-run-value`, `statcast-park-factors`) return **HTML**
// with the rows embedded in a `<script>` blob even with `csv=true`.
//
// The shared no-auth getter (`src/core/client.ts` `get`) returns `res.data`,
// which axios has already JSON-parsed for JSON bodies but left as text for the
// rest. To make the shape deterministic — a parsed JSON object for JSON bodies
// and a raw text string for CSV/HTML — this getter fetches the raw body
// (`responseType: "text"`, no axios `transformResponse`) and branches on the
// `content-type` response header: JSON → `JSON.parse`, anything else → the raw
// text. Each endpoint's registered parser then receives the shape it expects
// (`parse_mlb_statcast_leaderboard` consumes CSV text,
// `parse_mlb_statcast_gamefeed` consumes the JSON object, the HTML-leaderboard
// parser consumes HTML text).

// A JSON-labelled body that does not decode, and an empty 200, are failed
// fetches (sdv-py `mlb_statcast_runtime._get`), never an empty table.

import { jsonBody, requestResponse } from "./request.js";

/**
 * GET a Baseball Savant URL and return JSON (object) or raw text (string).
 *
 * Content-type drives the shape: `application/json` is parsed to an object;
 * anything else (`text/csv`, `application/download` for the search export,
 * `text/html` for the embedded-JSON leaderboards) is returned as the raw
 * response text. A 204 / 205 returns `{}` (JSON-labelled) or `""`.
 *
 * @param url    Fully-qualified Savant endpoint URL.
 * @param config `{ params, headers }`; `params` are passed through verbatim
 *               (the caller drops `undefined`/`null`).
 * @returns Parsed JSON object for JSON responses, raw `string` for CSV/HTML.
 * @throws NoDataError on 404; InvalidParameterError on 400 / 422; AssetFetchError on any
 *         other failed fetch, an empty 200, or a JSON-labelled body that does not decode
 *         (Savant's error page is not data).
 */
export async function statcastGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Promise<any> {
  // Raw body text — we content-type-branch ourselves so CSV/HTML payloads
  // aren't silently coerced.
  const res = await requestResponse("mlb_statcast", {
    method: "GET",
    url,
    query: config.params,
    headers: config.headers,
    responseType: "text",
  });
  if (String(res.headers["content-type"] ?? "").toLowerCase().includes("json")) {
    return jsonBody("mlb_statcast", res, url);
  }
  return typeof res.data === "string" ? res.data : String(res.data ?? "");
}
