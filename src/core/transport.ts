// Pluggable HTTP transport. A Transport only moves bytes: it resolves with a
// response for ANY HTTP status and rejects only when no response arrived
// (network error, timeout). Retry, auth and error classification live in
// `request()` (src/core/request.ts), so every transport gets them for free.

import axios from "axios";
import { SdvError, TransportUnavailableError, redactSecrets, safeCause } from "./errors.js";

/**
 * What `request()` hands a {@link Transport}: everything about one HTTP call, with the
 * query kept separate from the URL.
 *
 * @remarks
 * `url` is query-free on purpose: error messages and logging interceptors see the URL,
 * and an API key rides in `query`. Auth providers add `headers` / `query` before the
 * transport sees the request.
 */
export interface TransportRequest {
  /** HTTP method; the built-in transports support `GET` and `POST`. */
  method: "GET" | "POST";
  /** Absolute URL without the query string. */
  url: string;
  /**
   * Query params; `undefined` / `null` values are dropped. An array value
   * repeats the key (`{ k: ["a", "b"] }` → `k=a&k=b`, as sdv-py / requests
   * sends) — never `k[]=a`. Every built-in transport encodes the same way
   * ({@link encodeQuery}).
   */
  query?: Record<string, unknown>;
  /** Request headers; `request()` adds the family `User-Agent` unless one is set here or by auth. */
  headers?: Record<string, string>;
  /** Request body (POST). Strings / URLSearchParams are sent as-is, objects as JSON. */
  body?: unknown;
  /** Per-request timeout in milliseconds; `request()` fills in the family's when absent. */
  timeoutMs?: number;
  /**
   * How to decode the body. `"json"` (default) parses JSON when the body is JSON
   * and otherwise hands back the raw text; `"text"` always returns the text;
   * `"arraybuffer"` returns the raw bytes.
   */
  responseType?: "json" | "text" | "arraybuffer";
}

/**
 * What a {@link Transport} resolves with, for ANY HTTP status.
 *
 * @remarks
 * `request()` classifies the status (404 → `NoDataError`, 400 / 422 →
 * `InvalidParameterError`, retryable statuses retried, the rest `AssetFetchError`); a
 * transport never does.
 */
export interface TransportResponse {
  /** HTTP status code of the response. */
  status: number;
  /** Lower-cased header names. Multiple `set-cookie` values are joined with `"\n"`. */
  headers: Record<string, string>;
  /**
   * Decoded body per {@link TransportRequest.responseType}: parsed JSON (or the raw text
   * when it was not JSON) for `"json"`, a string for `"text"`, an `ArrayBuffer` for
   * `"arraybuffer"`.
   */
  data: unknown;
  /** Final URL (after redirects) when the transport knows it, else the request URL. */
  url: string;
}

/**
 * A pluggable HTTP transport: moves bytes, nothing more.
 *
 * @remarks
 * Contract: resolve with a {@link TransportResponse} for ANY HTTP status and reject only
 * when no response arrived (network error, timeout). `request()` retries a rejection as a
 * network failure unless it is an `SdvError`, which passes through. Reject with a
 * sanitized error (see `safeCause`), never a raw client error carrying the request
 * config. Install one with `configure({ transport })` or `registerFamilyDefaults`.
 */
export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

/**
 * Case-insensitive header lookup.
 *
 * @param headers - A header map (any casing); `undefined` is treated as empty.
 * @param name - Header name to find, any casing.
 * @returns The first value whose key matches `name` case-insensitively, else `undefined`.
 * @example
 * ```ts
 * import { headerValue } from './core/transport.js'; // not re-exported from the package root
 *
 * headerValue({ 'Content-Type': 'text/csv' }, 'content-type'); // 'text/csv'
 * headerValue(undefined, 'retry-after'); // undefined
 * ```
 */
export function headerValue(
  headers: Record<string, string> | undefined,
  name: string
): string | undefined {
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (k.toLowerCase() === want) return v;
  }
  return undefined;
}

/**
 * Merge header maps case-insensitively; a later map's value wins.
 *
 * @param maps - Header maps in increasing precedence; `undefined` entries are skipped.
 * @returns A new map. When two keys differ only in case the earlier key is dropped and
 *   the later key's spelling and value are kept.
 * @example
 * ```ts
 * import { mergeHeaders } from './core/transport.js'; // not re-exported from the package root
 *
 * mergeHeaders({ 'user-agent': 'default' }, { 'User-Agent': 'mine' });
 * // { 'User-Agent': 'mine' }
 * ```
 * @remarks
 * The auth providers rely on the precedence: `mergeHeaders(provider, req.headers)` lets a
 * header the caller set win over the provider's.
 */
export function mergeHeaders(
  ...maps: Array<Record<string, string> | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const map of maps) {
    for (const [k, v] of Object.entries(map ?? {})) {
      for (const existing of Object.keys(out)) {
        if (existing.toLowerCase() === k.toLowerCase()) delete out[existing];
      }
      out[k] = v;
    }
  }
  return out;
}

/** Normalise a response header bag to lower-cased string values. */
function flattenHeaders(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.map(String).join("\n") : String(v);
  }
  return out;
}

/**
 * Default transport (axios). Never throws on an HTTP status
 * (`validateStatus: () => true`); only a network failure rejects.
 *
 * @param req - The {@link TransportRequest}; `responseType` defaults to `"json"`.
 * @returns The {@link TransportResponse}: lower-cased headers, axios' parsed body (text /
 *   bytes untouched for `"text"` / `"arraybuffer"`), and the post-redirect URL when known.
 * @throws SdvError when a `query` value is an invalid `Date` (raised before any request).
 * @throws Error a sanitized copy (`safeCause`) of the axios error on a network failure or
 *   timeout — name, message, code, errno, syscall; never the request config.
 * @example
 * ```ts
 * import { axiosTransport, configure } from 'sportsdataverse';
 *
 * // Wrap the default transport to log every status, without touching retry / auth.
 * configure({
 *   transport: async (req) => {
 *     const res = await axiosTransport(req);
 *     console.log(req.method, res.url, res.status);
 *     return res;
 *   },
 * });
 * ```
 * @remarks
 * The query is encoded once with {@link encodeQuery} and handed to axios as `params` plus a
 * serializer, never baked into `url`, so `config.url` stays query-free for any app-level
 * interceptor that logs it. Arrays are sent as repeated keys (`k=a&k=b`), not axios'
 * default `k[]=a`. This is what `resolveFamily` falls back to when no transport is
 * configured or registered.
 */
export const axiosTransport: Transport = async (req) => {
  const responseType = req.responseType ?? "json";
  // Encoded once up front, so an invalid Date throws an SdvError before any
  // request (axios rewraps an error thrown inside paramsSerializer as a plain
  // Error, which would be retried as a network failure). Handed to axios as
  // `params` + a serializer returning that string, never baked into `url`:
  // `config.url` stays query-free for any app-level interceptor that logs it
  // (a caller's apiKey rides in the query). Repeated keys for arrays (axios'
  // default sends `k[]=a`).
  const qs = encodeQuery(req.query);
  const config = {
    params: req.query,
    paramsSerializer: () => qs,
    headers: req.headers,
    timeout: req.timeoutMs,
    responseType,
    // Keep text / bytes untouched; "json" keeps axios' parse-if-JSON default.
    ...(responseType === "json" ? {} : { transformResponse: [(d: unknown) => d] }),
    validateStatus: () => true,
  };
  // ponytail: axios.get / axios.post (not axios.request) — the existing NFL auth
  // tests stub `axios.post`, and both helpers take the same config.
  let res;
  try {
    res =
      req.method === "POST"
        ? await axios.post(req.url, req.body, config)
        : await axios.get(req.url, config);
  } catch (err) {
    // An axios error carries the whole request config (headers incl.
    // Authorization / Cookie, a POSTed body incl. a login password): reject with
    // a sanitized copy (name / message / code / errno / syscall) instead.
    throw safeCause(err);
  }
  const finalUrl = (res.request as { res?: { responseUrl?: string } } | undefined)?.res
    ?.responseUrl;
  return {
    status: res.status,
    headers: flattenHeaders(res.headers),
    data: res.data,
    url: finalUrl ?? req.url,
  };
};

/** axios' own component encoder (lib/helpers/buildURL.js), so scalar encoding is unchanged. */
function encodeComponent(value: string): string {
  return encodeURIComponent(value)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+");
}

/**
 * One query value as text. A `Date` is ISO-8601 UTC (`toISOString()`, what
 * axios' own serializer sent before the transport layer); an invalid `Date`
 * throws instead of sending `"Invalid Date"`.
 */
function queryValue(key: string, item: unknown): string {
  if (!(item instanceof Date)) return String(item);
  if (Number.isNaN(item.getTime())) throw new SdvError(`query param "${key}" is an invalid Date`);
  return item.toISOString();
}

/**
 * Serialise a query map: `undefined` / `null` dropped, arrays as repeated keys
 * (`k=a&k=b`), a `Date` as ISO-8601 UTC. Shared by every built-in transport so
 * the wire form is identical. A date-only API (`YYYY-MM-DD`, ESPN's
 * `YYYYMMDD`) wants a string: pass one rather than a `Date`.
 *
 * @param query - Query map; `undefined` is treated as empty. Each value is a scalar, a `Date`
 *   or an array of those; `undefined` / `null` (also inside an array) are dropped.
 * @returns The `&`-joined `key=value` pairs without a leading `?`; `""` when nothing remains.
 *   Keys and values use axios' component encoding (`:`, `$`, `,` kept; space as `+`).
 * @throws SdvError when a value is an invalid `Date` (`"query param "<key>" is an invalid Date"`).
 * @example
 * ```ts
 * import { encodeQuery } from './core/transport.js'; // not re-exported from the package root
 *
 * encodeQuery({ dates: 20240908, groups: [80, 81], limit: undefined });
 * // 'dates=20240908&groups=80&groups=81'
 * ```
 */
export function encodeQuery(query?: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      if (item === undefined || item === null) continue;
      parts.push(`${encodeComponent(k)}=${encodeComponent(queryValue(k, item))}`);
    }
  }
  return parts.join("&");
}

/** Append `query` to `url` with {@link encodeQuery}. */
function withQuery(url: string, query?: Record<string, unknown>): string {
  const qs = encodeQuery(query);
  if (!qs) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

/** Minimal shape of the `impit` client this module relies on. */
interface ImpitClient {
  fetch(
    url: string,
    init?: { method?: string; headers?: Record<string, string>; body?: unknown; timeout?: number }
  ): Promise<{
    status: number;
    url: string;
    headers: Headers;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
  }>;
}

const IMPIT_MODULE = "impit";

/**
 * Test seam: how the optional `impit` package is loaded. The specifier is a
 * variable so TypeScript and bundlers never require `impit` to be installed.
 *
 * @remarks
 * Replace `load` in a test to supply a fake `Impit` class, or make it reject to exercise
 * `TransportUnavailableError`.
 * @internal
 */
export const _impitLoader = {
  load: (): Promise<any> => import(IMPIT_MODULE),
};

/**
 * A transport that impersonates a real browser's TLS / HTTP-2 fingerprint, for
 * hosts that silently stall non-browser clients (stats.nba.com,
 * stats.wnba.com). Backed by the optional peer dependency
 * [`impit`](https://github.com/apify/impit) — `npm install impit`. If it is not
 * installed, every call rejects with {@link TransportUnavailableError}.
 *
 * @param opts - Options; default `{}`.
 * @param opts.browser - impit browser profile (`"chrome"` default, `"firefox"`, `"chrome142"`, …).
 * @param opts.proxyUrl - HTTP / HTTPS / SOCKS proxy URL, passed to impit as `proxyUrl`.
 * @returns A {@link Transport} that lazily creates one impit client on its first call and
 *   reuses it; the body is decoded per `responseType` as `axiosTransport` does, and
 *   `set-cookie` values are joined with `"\n"`.
 * @throws TransportUnavailableError (from the returned transport) when `impit` cannot be
 *   imported; its `cause` is the import error. The failure is not cached, so a call after
 *   `npm install impit` succeeds.
 * @throws SdvError (from the returned transport) when the impit client cannot be constructed,
 *   e.g. an unknown browser profile; the message is redacted.
 * @throws Error (from the returned transport) a sanitized copy (`safeCause`) of impit's error
 *   on a network failure or timeout.
 * @example
 * ```ts
 * import sdv, { configure, createImpersonatingTransport } from 'sportsdataverse';
 *
 * configure({
 *   transport: {
 *     nba_stats: createImpersonatingTransport({ browser: 'chrome' }),
 *     wnba_stats: createImpersonatingTransport({ proxyUrl: process.env.HTTPS_PROXY }),
 *   },
 * });
 * const rows = await sdv.nba.nbaStatsLeaguedashplayerstats({ leagueId: '00' });
 * ```
 * @remarks
 * `impit` is an optional peer dependency: nothing in sportsdataverse imports it statically.
 * A plain-object `body` is sent as JSON with `Content-Type: application/json` unless the
 * request sets a content-type; a string / `URLSearchParams` body is sent as-is. Like every
 * transport it resolves for any HTTP status and leaves retry / auth / classification to
 * `request()`.
 */
export function createImpersonatingTransport(
  opts: { browser?: string; proxyUrl?: string } = {}
): Transport {
  let client: Promise<ImpitClient> | undefined;
  const create = async (): Promise<ImpitClient> => {
    let mod: any;
    try {
      mod = await _impitLoader.load();
    } catch (err) {
      throw new TransportUnavailableError(
        "The impersonating transport needs the optional dependency `impit`. Install it with: npm install impit",
        { cause: err }
      );
    }
    try {
      const Impit = mod.Impit ?? mod.default?.Impit;
      return new Impit({ browser: opts.browser ?? "chrome", proxyUrl: opts.proxyUrl });
    } catch (err) {
      throw new SdvError(
        `The impersonating transport could not create an impit client (browser ${JSON.stringify(opts.browser ?? "chrome")}): ${redactSecrets(err instanceof Error ? err.message : String(err))}`,
        { cause: err }
      );
    }
  };
  // Cache only a client that was created; a failure is retried on the next call
  // (e.g. after `npm install impit`) instead of being replayed forever.
  const getClient = (): Promise<ImpitClient> =>
    (client ??= create().catch((err: unknown) => {
      client = undefined;
      throw err;
    }));

  return async (req) => {
    const impit = await getClient();
    const url = withQuery(req.url, req.query);
    let headers = req.headers;
    let body = req.body;
    if (body !== undefined && body !== null && typeof body === "object" && !(body instanceof URLSearchParams)) {
      body = JSON.stringify(body);
      if (!headerValue(headers, "content-type")) {
        headers = mergeHeaders(headers, { "Content-Type": "application/json" });
      }
    }
    let res: Awaited<ReturnType<ImpitClient["fetch"]>>;
    try {
      res = await impit.fetch(url, {
        method: req.method,
        headers,
        body: body ?? undefined,
        timeout: req.timeoutMs,
      });
    } catch (err) {
      // same boundary rule as axiosTransport: never surface a raw client error
      throw safeCause(err);
    }
    const outHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      outHeaders[k.toLowerCase()] = v;
    });
    const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    if (cookies.length) outHeaders["set-cookie"] = cookies.join("\n");

    const responseType = req.responseType ?? "json";
    let data: unknown;
    if (responseType === "arraybuffer") {
      data = await res.arrayBuffer();
    } else {
      const text = await res.text();
      data = text;
      if (responseType === "json" && text) {
        try {
          data = JSON.parse(text);
        } catch {
          // not JSON — hand back the text, same as axios' silent JSON parsing
        }
      }
    }
    return { status: res.status, headers: outHeaders, data, url: res.url || url };
  };
}
