// Pluggable HTTP transport. A Transport only moves bytes: it resolves with a
// response for ANY HTTP status and rejects only when no response arrived
// (network error, timeout). Retry, auth and error classification live in
// `request()` (src/core/request.ts), so every transport gets them for free.

import axios from "axios";
import { TransportUnavailableError } from "./errors.js";

export interface TransportRequest {
  method: "GET" | "POST";
  /** Absolute URL without the query string. */
  url: string;
  /** Query params; `undefined` / `null` values are dropped. */
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Request body (POST). Strings / URLSearchParams are sent as-is, objects as JSON. */
  body?: unknown;
  timeoutMs?: number;
  /**
   * How to decode the body. `"json"` (default) parses JSON when the body is JSON
   * and otherwise hands back the raw text; `"text"` always returns the text;
   * `"arraybuffer"` returns the raw bytes.
   */
  responseType?: "json" | "text" | "arraybuffer";
}

export interface TransportResponse {
  status: number;
  /** Lower-cased header names. Multiple `set-cookie` values are joined with `"\n"`. */
  headers: Record<string, string>;
  data: unknown;
  /** Final URL (after redirects) when the transport knows it, else the request URL. */
  url: string;
}

export type Transport = (req: TransportRequest) => Promise<TransportResponse>;

/** Case-insensitive header lookup. */
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

/** Merge header maps case-insensitively; a later map's value wins. */
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
 */
export const axiosTransport: Transport = async (req) => {
  const responseType = req.responseType ?? "json";
  const config = {
    params: req.query,
    headers: req.headers,
    timeout: req.timeoutMs,
    responseType,
    // Keep text / bytes untouched; "json" keeps axios' parse-if-JSON default.
    ...(responseType === "json" ? {} : { transformResponse: [(d: unknown) => d] }),
    validateStatus: () => true,
  };
  // ponytail: axios.get / axios.post (not axios.request) — the existing NFL auth
  // tests stub `axios.post`, and both helpers take the same config.
  const res =
    req.method === "POST"
      ? await axios.post(req.url, req.body, config)
      : await axios.get(req.url, config);
  const finalUrl = (res.request as { res?: { responseUrl?: string } } | undefined)?.res
    ?.responseUrl;
  return {
    status: res.status,
    headers: flattenHeaders(res.headers),
    data: res.data,
    url: finalUrl ?? req.url,
  };
};

/** Append `query` to `url`, dropping `undefined` / `null`; arrays repeat the key. */
function withQuery(url: string, query?: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    for (const item of Array.isArray(v) ? v : [v]) sp.append(k, String(item));
  }
  const qs = sp.toString();
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
 * @param opts.browser  impit browser profile (`"chrome"` default, `"firefox"`, `"chrome142"`, …).
 * @param opts.proxyUrl HTTP / HTTPS / SOCKS proxy URL.
 */
export function createImpersonatingTransport(
  opts: { browser?: string; proxyUrl?: string } = {}
): Transport {
  let client: Promise<ImpitClient> | undefined;
  const getClient = (): Promise<ImpitClient> =>
    (client ??= _impitLoader.load().then(
      (mod) => {
        const Impit = mod.Impit ?? mod.default?.Impit;
        return new Impit({ browser: opts.browser ?? "chrome", proxyUrl: opts.proxyUrl });
      },
      (err: unknown) => {
        client = undefined; // let a later call retry after `npm install impit`
        throw new TransportUnavailableError(
          "The impersonating transport needs the optional dependency `impit`. Install it with: npm install impit",
          { cause: err }
        );
      }
    ));

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
    const res = await impit.fetch(url, {
      method: req.method,
      headers,
      body: body ?? undefined,
      timeout: req.timeoutMs,
    });
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
