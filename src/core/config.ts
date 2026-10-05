// Runtime configuration: which transport / auth each family uses, plus the
// retry budget, timeout and User-Agent. Family runtimes install their defaults
// with `registerFamilyDefaults`; anything the user passes to `configure` wins.

import type { AuthProvider } from "./auth.js";
import { axiosTransport, type Transport } from "./transport.js";

export interface ConfigureOptions {
  /** One transport for every family, or a map keyed by family stem with an optional `"default"`. */
  transport?: Transport | Record<string, Transport>;
  /**
   * Auth providers keyed by family stem. There is no `"default"` fallback for
   * auth on purpose: credentials are only ever sent to the family they belong to.
   */
  auth?: Record<string, AuthProvider>;
  /** Retries after the first attempt for 429 / 5xx / network errors (default 3). */
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
}

const DEFAULTS = {
  retries: 3,
  timeoutMs: 30000,
  userAgent: "Mozilla/5.0 (compatible; sportsdataverse-js/3.x; +https://js.sportsdataverse.org/)",
};

let user: SdvConfig = fresh();
const familyDefaults: Record<string, { transport?: Transport; auth?: AuthProvider }> = {};

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

/** For family runtimes: install the transport / auth a family needs by default. */
export function registerFamilyDefaults(
  family: string,
  defaults: { transport?: Transport; auth?: AuthProvider }
): void {
  familyDefaults[family] = { ...familyDefaults[family], ...defaults };
}

/**
 * Resolve one family. Transport precedence: user `[family]` > user `"default"`
 * > registered family default > axios. Auth: user `[family]` > registered default.
 */
export function resolveFamily(family: string): ResolvedFamilyConfig {
  const fam = familyDefaults[family] ?? {};
  return {
    transport:
      user.transport[family] ?? user.transport.default ?? fam.transport ?? axiosTransport,
    auth: user.auth[family] ?? fam.auth,
    retries: user.retries,
    timeoutMs: user.timeoutMs,
    userAgent: user.userAgent,
  };
}
