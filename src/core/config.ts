// Runtime configuration: which transport / auth each family uses, plus the
// retry budget, timeout and User-Agent. Family runtimes install their defaults
// with `registerFamilyDefaults`; anything the user passes to `configure` wins.

import type { AuthProvider } from "./auth.js";
import type { SdvError } from "./errors.js";
import { axiosTransport, type Transport, type TransportResponse } from "./transport.js";

/**
 * Per-family classification of a final failed response (non-2xx, not 404, no
 * retry left). Return the error to throw, or `undefined` for the default
 * `AssetFetchError`. `url` carries no query string.
 */
export type ClassifyError = (res: TransportResponse, url: string) => SdvError | undefined;

export interface ConfigureOptions {
  /** One transport for every family, or a map keyed by family stem with an optional `"default"`. */
  transport?: Transport | Record<string, Transport>;
  /**
   * Auth providers keyed by family stem. There is no `"default"` fallback for
   * auth on purpose: credentials are only ever sent to the family they belong to.
   */
  auth?: Record<string, AuthProvider>;
  /**
   * Retries after the first attempt (default 3): network errors may use all of
   * them, the family's retry statuses at most min(retries, 4).
   */
  retries?: number;
  /** Per-request timeout in milliseconds (default 30000). */
  timeoutMs?: number;
  /** User-Agent sent when neither the caller nor the auth provider sets one. */
  userAgent?: string;
}

export interface SdvConfig {
  transport: Record<string, Transport>;
  auth: Record<string, AuthProvider>;
  retries: number;
  timeoutMs: number;
  userAgent: string;
}

/** What `request()` uses for one family after precedence is applied. */
export interface ResolvedFamilyConfig {
  transport: Transport;
  auth?: AuthProvider;
  retries: number;
  timeoutMs: number;
  userAgent: string;
  /** HTTP statuses retried for this family (see {@link DEFAULT_RETRY_STATUSES}). */
  retryStatuses: readonly number[];
  /** The family's error classifier, when it registered one. */
  classifyError?: ClassifyError;
}

/** What a family runtime can install with {@link registerFamilyDefaults}. */
export interface FamilyDefaults {
  transport?: Transport;
  auth?: AuthProvider;
  /**
   * Statuses worth retrying for this family. Auth-gated families drop 403 —
   * there it is a real forbidden / entitlement, not load.
   */
  retryStatuses?: readonly number[];
  /**
   * Map a final failed response to a family-specific error (e.g. PFF's 400 / 422
   * -> `InvalidParameterError`, with the API's own error message). 404 is
   * always `NoDataError` and never reaches this hook.
   */
  classifyError?: ClassifyError;
}

/**
 * Statuses retried by default (sdv-py `dl_utils._RETRYABLE_STATUS`). 403 is in
 * the set because ESPN Core v2 answers 403 under load.
 */
export const DEFAULT_RETRY_STATUSES: readonly number[] = [403, 408, 429, 500, 502, 503, 504];

const DEFAULTS = {
  retries: 3,
  timeoutMs: 30000,
  // No `+https://…` token: ESPN's site API answers 403 to a UA carrying one.
  userAgent: "Mozilla/5.0 (compatible; sportsdataverse-js/3.x)",
};

let user: SdvConfig = fresh();
const familyDefaults: Record<string, FamilyDefaults> = {};

function fresh(): SdvConfig {
  return { transport: {}, auth: {}, ...DEFAULTS };
}

/**
 * Set the transport, auth, retry budget, timeout or User-Agent. Calls merge:
 * map entries are added / replaced per family, scalars replace.
 */
export function configure(opts: ConfigureOptions): void {
  const transport =
    typeof opts.transport === "function" ? { default: opts.transport } : (opts.transport ?? {});
  user = {
    transport: { ...user.transport, ...transport },
    auth: { ...user.auth, ...(opts.auth ?? {}) },
    retries: opts.retries ?? user.retries,
    timeoutMs: opts.timeoutMs ?? user.timeoutMs,
    userAgent: opts.userAgent ?? user.userAgent,
  };
}

/** A copy of the user configuration (family runtime defaults are not included). */
export function getConfig(): SdvConfig {
  return { ...user, transport: { ...user.transport }, auth: { ...user.auth } };
}

/** Drop everything set via `configure` (family runtime defaults stay installed). */
export function resetConfig(): void {
  user = fresh();
}

/**
 * For family runtimes: install the transport / auth / retry statuses a family
 * needs by default. A user `configure` entry for the same family still wins.
 */
export function registerFamilyDefaults(family: string, defaults: FamilyDefaults): void {
  familyDefaults[family] = { ...familyDefaults[family], ...defaults };
}

/**
 * Resolve one family. Transport precedence: user `[family]` > registered family
 * default > user `"default"` > axios — a host-required family transport (e.g.
 * TLS impersonation) is never silently replaced by a generic user default.
 * Auth: user `[family]` > registered default. Retry statuses: registered
 * default > {@link DEFAULT_RETRY_STATUSES}.
 */
export function resolveFamily(family: string): ResolvedFamilyConfig {
  const fam = familyDefaults[family] ?? {};
  return {
    transport:
      user.transport[family] ?? fam.transport ?? user.transport.default ?? axiosTransport,
    auth: user.auth[family] ?? fam.auth,
    retries: user.retries,
    timeoutMs: user.timeoutMs,
    userAgent: user.userAgent,
    retryStatuses: fam.retryStatuses ?? DEFAULT_RETRY_STATUSES,
    classifyError: fam.classifyError,
  };
}
