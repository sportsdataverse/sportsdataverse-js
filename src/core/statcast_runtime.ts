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

import axios, { type AxiosRequestConfig } from "axios";

const client = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; sportsdataverse-js/3.x; +https://js.sportsdataverse.org/)",
  },
  // Always hand back the raw body string — we content-type-branch ourselves so
  // CSV/HTML payloads aren't silently coerced or dropped by axios.
  responseType: "text",
  transformResponse: [(data) => data],
});

/**
 * GET a Baseball Savant URL and return JSON (object) or raw text (string).
 *
 * Content-type drives the shape: `application/json` is parsed to an object;
 * anything else (`text/csv`, `application/download` for the search export,
 * `text/html` for the embedded-JSON leaderboards) is returned as the raw
 * response text. Returns `{}` when the request yields no usable response (so
 * JSON consumers can chain without a null-check), and `""` only when a body is
 * present but unreadable.
 *
 * @param url    Fully-qualified Savant endpoint URL.
 * @param config Axios request config (e.g. `{ params }`); `params` are passed
 *               through verbatim (the caller drops `undefined`/`null`).
 * @returns Parsed JSON object for JSON responses, raw `string` for CSV/HTML.
 */
export async function statcastGet(
  url: string,
  config?: AxiosRequestConfig
): Promise<any> {
  let res;
  try {
    res = await client.get(url, config);
  } catch {
    // Transport failure / non-2xx — give JSON consumers an empty object.
    return {};
  }
  if (res == null || res.data == null) return {};
  const ctype = String(res.headers?.["content-type"] ?? "").toLowerCase();
  const body = res.data;
  if (ctype.includes("json")) {
    if (typeof body !== "string") return body; // already-parsed object
    try {
      return JSON.parse(body);
    } catch {
      // fall through to the raw-text return below
    }
  }
  if (typeof body === "string") return body;
  // No content-type hint and a non-string body — last-ditch stringify so the
  // CSV/HTML parsers (which expect text) still get something usable.
  try {
    return String(body);
  } catch {
    return "";
  }
}
