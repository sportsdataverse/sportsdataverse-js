// PFF Developer API (`https://api.pff.com`) runtime. Port of sdv-py's
// `sportsdataverse/nfl/pff_api_runtime.py`.
//
// Auth: a PFF Pro bearer API key (`ak_live_…`). Precedence (sdv-py's code):
//   1. an `Authorization` header in the call's `headers`,
//   2. `api_key` on the call,
//   3. env `SDV_PFF_API_KEY`, then `PFF_API_KEY` (the name PFF's guide uses),
//   4. otherwise an SdvError naming those variables — no request is made.
// Keys never appear in an error message or a URL.
//
// Errors (PFF's error body is `{ error: { code, message, request_id, details } }`):
//   404 -> NoDataError, 400 / 422 -> InvalidParameterError (both core); 401 / 403 /
//   429 / 5xx that outlive the retries -> AssetFetchError. 403 is an entitlement
//   answer and is never retried. A 200 whose body is not a JSON object is an
//   unknown answer -> AssetFetchError.
//
// Withheld columns: a view-only entitlement answers 200 with some columns
// REMOVED and a `restricted` list naming them. The partial body is returned with
// a warning; `strict: true` on the call (or env `SDV_PFF_STRICT=1`) throws
// AssetFetchError instead — pipelines should be strict.
//
// Importing this module registers the `pff_api` family defaults.

import { bearerAuth } from "./auth.js";
import { registerFamilyDefaults } from "./config.js";
import { AssetFetchError, SdvError } from "./errors.js";
import { request } from "./request.js";
import { pyJsonDumps } from "../parsers/pff_api.js";
import { headerValue, mergeHeaders } from "./transport.js";

const FAMILY = "pff_api";
const KEY_ENV = ["SDV_PFF_API_KEY", "PFF_API_KEY"];
const STRICT_ENV = "SDV_PFF_STRICT";

/** The explicit key, else the first non-empty key env var, else `undefined`. */
export function resolvePffApiKey(apiKey?: string): string | undefined {
  if (apiKey && apiKey.trim()) return apiKey.trim();
  for (const name of KEY_ENV) {
    const v = (process.env[name] ?? "").trim();
    if (v) return v;
  }
  return undefined;
}

function strictMode(strict: unknown): boolean {
  if (strict !== undefined && strict !== null) return Boolean(strict);
  return ["1", "true", "yes"].includes((process.env[STRICT_ENV] ?? "").trim().toLowerCase());
}

const isObject = (v: unknown): v is Record<string, any> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** `code: message (details) [request_id]` from PFF's error envelope, or the raw body. */
export function pffErrorDetail(data: unknown): string {
  let body: unknown = data;
  if (typeof data === "string") {
    try {
      body = JSON.parse(data);
    } catch {
      return data.trim().slice(0, 200);
    }
  }
  const err = isObject(body) ? body.error : undefined;
  if (!isObject(err)) return (typeof data === "string" ? data : JSON.stringify(data ?? "")).trim().slice(0, 200);
  let msg = `${err.code || "error"}: ${err.message || ""}`.replace(/[: ]+$/, "");
  if (err.details) msg += ` ${pyJsonDumps(err.details)}`;
  if (err.request_id) msg += ` [request_id ${err.request_id}]`;
  return msg;
}

/**
 * GET an `api.pff.com` endpoint and return its JSON object body. The flat
 * dispatch calls this for every `pff_api_*` wrapper; `args` are the caller's
 * params (`api_key`, `strict`).
 */
export async function pffApiGet(
  url: string,
  config: { params?: Record<string, unknown>; headers?: Record<string, string>; family: string; args?: Record<string, any> }
): Promise<Record<string, any>> {
  const args = config.args ?? {};
  let headers = mergeHeaders({ Accept: "application/json" }, config.headers);
  const key = args.api_key ?? args.apiKey;
  if (headerValue(headers, "authorization") === undefined && typeof key === "string" && key.trim()) {
    headers = mergeHeaders(headers, { Authorization: `Bearer ${key.trim()}` });
  }
  const body = await request(config.family, { method: "GET", url, query: config.params, headers });
  if (!isObject(body)) {
    const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
    throw new AssetFetchError(`${FAMILY}: HTTP 200 with a non-object body: ${url}: ${text.trim().slice(0, 120)}`, {
      url,
      status: 200,
    });
  }
  const restricted = body.restricted;
  const withheld = Array.isArray(restricted) ? restricted.length > 0 : isObject(restricted) ? Object.keys(restricted).length > 0 : Boolean(restricted);
  if (withheld) {
    // PFF spec (RestrictedColumns): "never assume a missing column means the stat does not exist"
    const cols = Array.isArray(restricted) ? restricted.map(String).join(", ") : String(restricted);
    const msg = `PFF withheld columns by entitlement on ${url}: ${cols} (missing != absent stat)`;
    if (strictMode(args.strict)) throw new AssetFetchError(msg, { url, status: 200 });
    process.emitWarning(msg, { type: "UserWarning", code: "SDV_PFF_RESTRICTED" });
  }
  return body;
}

/** Bearer from the environment; an `Authorization` header (or `api_key`, set by the getter) wins. */
export const pffApiAuth = bearerAuth(() => {
  const key = resolvePffApiKey();
  if (!key) {
    throw new SdvError(
      "pff_api: no PFF API key — pass api_key, or set PFF_API_KEY (or SDV_PFF_API_KEY). " +
        "Create one at https://www.pff.com/account/api-keys (PFF Pro)."
    );
  }
  return key;
});

registerFamilyDefaults(FAMILY, {
  auth: pffApiAuth,
  // sdv-py _RETRY_STATUSES = {429, 500, 502, 503, 504}: 403 is an entitlement answer, and
  // 408 is not retried either (the 100 reads/min budget is shared with the pff scrapers).
  retryStatuses: [429, 500, 502, 503, 504],
  // sdv-py `_RETRIES = 4` (download(num_retries=4)); a configure({ retries }) still wins.
  retries: 4,
  classifyError: (res, url) => {
    const detail = pffErrorDetail(res.data);
    return new AssetFetchError(`${FAMILY}: HTTP ${res.status}: ${url}: ${detail}`, { url, status: res.status });
  },
});
