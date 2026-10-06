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
 *
 * @remarks
 * Installed per family through {@link FamilyDefaults.classifyError}. It also sees a 2xx
 * whose body is empty or, for a JSON request, not JSON. It never sees a 404 or a
 * 400 / 422: `request()` classifies those itself.
 */
export type ClassifyError = (res: TransportResponse, url: string) => SdvError | undefined;

/**
 * What {@link configure} accepts. Every field is optional; calls merge.
 *
 * @remarks
 * Family stems are the keys `request()` is called with (`"site_v2"`, `"mlb"`, `"nfl_api"`,
 * `"nba_stats"`, …). A bare `transport` function is the same as `{ default: transport }`.
 */
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

/**
 * The user configuration as {@link getConfig} returns it: what `configure` set, with the
 * built-in defaults filled in (3 retries, 30 000 ms, the sportsdataverse-js User-Agent).
 *
 * @remarks
 * Family runtime defaults ({@link registerFamilyDefaults}) are not part of it; see
 * {@link resolveFamily} for the merged view of one family.
 */
export interface SdvConfig {
  /** Transports keyed by family stem; a `"default"` key is the fallback for every family. */
  transport: Record<string, Transport>;
  /** Auth providers keyed by family stem (no `"default"` fallback). */
  auth: Record<string, AuthProvider>;
  /** Retries after the first attempt. */
  retries: number;
  /** Per-request timeout in milliseconds. */
  timeoutMs: number;
  /** User-Agent sent when neither the caller nor the auth provider sets one. */
  userAgent: string;
}

/** What `request()` uses for one family after precedence is applied. */
export interface ResolvedFamilyConfig {
  /** The transport that sends this family's requests. */
  transport: Transport;
  /** The auth provider applied before each request, when the family has one. */
  auth?: AuthProvider;
  /** Retries after the first attempt. */
  retries: number;
  /** Per-request timeout in milliseconds. */
  timeoutMs: number;
  /** User-Agent sent when neither the caller nor the auth provider sets one. */
  userAgent: string;
  /** HTTP statuses retried for this family (see {@link DEFAULT_RETRY_STATUSES}). */
  retryStatuses: readonly number[];
  /** The family's error classifier, when it registered one. */
  classifyError?: ClassifyError;
}

/**
 * What a family runtime can install with {@link registerFamilyDefaults}.
 *
 * @remarks
 * Each field is a default the user's `configure` can still override; see
 * {@link resolveFamily} for the exact precedence.
 */
export interface FamilyDefaults {
  /** The family's default transport (e.g. TLS impersonation for stats.nba.com). */
  transport?: Transport;
  /** The family's default auth provider (e.g. the `nfl_api` token minting). */
  auth?: AuthProvider;
  /**
   * Statuses worth retrying for this family. Auth-gated families drop 403 —
   * there it is a real forbidden / entitlement, not load.
   */
  retryStatuses?: readonly number[];
  /**
   * Map a final failed response to a family-specific error (e.g. PFF's error
   * envelope in the message, or pro.nfl.com's empty 200 -> `InvalidParameterError`).
   * It sees a non-2xx that outlived the retries and a 2xx whose body is empty or,
   * for a JSON request, not JSON. 404 (`NoDataError`) and 400 / 422
   * (`InvalidParameterError`) are classified by `request()` and never reach it.
   */
  classifyError?: ClassifyError;
  /**
   * The family's retry budget (sdv-py passes e.g. `num_retries=4` for PFF).
   * `configure({ retries })` still wins when the user set it.
   */
  retries?: number;
  /**
   * The family's per-request timeout in ms (e.g. NFL Pro's slow tables).
   * `configure({ timeoutMs })` still wins when the user set it.
   */
  timeoutMs?: number;
}

/**
 * Statuses retried by default (sdv-py `dl_utils._RETRYABLE_STATUS`). 403 is in
 * the set because ESPN Core v2 answers 403 under load.
 *
 * @remarks
 * `[403, 408, 429, 500, 502, 503, 504]`. A family replaces the whole list with
 * {@link FamilyDefaults.retryStatuses} (auth-gated families drop 403); there is no
 * per-user override. Status retries are capped at `min(retries, 4)` by `request()`.
 */
export const DEFAULT_RETRY_STATUSES: readonly number[] = [403, 408, 429, 500, 502, 503, 504];

const DEFAULTS = {
  retries: 3,
  timeoutMs: 30000,
  // No `+https://…` token: ESPN's site API answers 403 to a UA carrying one.
  userAgent: "Mozilla/5.0 (compatible; sportsdataverse-js/4.x)",
};

let user: SdvConfig = fresh();
// The scalars the user actually passed to `configure`: those beat a family's
// registered retries / timeoutMs, the built-in DEFAULTS do not.
let userSet: { retries?: number; timeoutMs?: number } = {};
const familyDefaults: Record<string, FamilyDefaults> = {};

function fresh(): SdvConfig {
  return { transport: {}, auth: {}, ...DEFAULTS };
}

/**
 * Set the transport, auth, retry budget, timeout or User-Agent. Calls merge:
 * map entries are added / replaced per family, scalars replace. A `retries` /
 * `timeoutMs` set here applies to every family, including one that registered
 * its own default.
 *
 * @param opts - What to set ({@link ConfigureOptions}). `transport`: one function (becomes the
 *   `"default"` entry) or a map keyed by family stem; `auth`: providers keyed by family stem;
 *   `retries` (default 3), `timeoutMs` (default 30000), `userAgent`. An omitted field keeps its
 *   current value.
 * @returns Nothing; the module-level configuration is updated in place.
 * @example
 * ```ts
 * import { configure, bearerAuth, createImpersonatingTransport } from 'sportsdataverse';
 *
 * configure({
 *   transport: { nba_stats: createImpersonatingTransport() },
 *   auth: { pff_api: bearerAuth(process.env.PFF_API_KEY) },
 *   retries: 2,
 *   timeoutMs: 60_000,
 * });
 * ```
 * @remarks
 * A `retries` / `timeoutMs` passed here is remembered as user-set even when it equals the
 * built-in value, and then beats a family's registered default. There is no `"default"`
 * auth entry on purpose: credentials are only ever sent to the family they belong to.
 * {@link resetConfig} drops everything set here.
 */
export function configure(opts: ConfigureOptions): void {
  const transport =
    typeof opts.transport === "function" ? { default: opts.transport } : (opts.transport ?? {});
  if (opts.retries !== undefined) userSet.retries = opts.retries;
  if (opts.timeoutMs !== undefined) userSet.timeoutMs = opts.timeoutMs;
  user = {
    transport: { ...user.transport, ...transport },
    auth: { ...user.auth, ...(opts.auth ?? {}) },
    retries: opts.retries ?? user.retries,
    timeoutMs: opts.timeoutMs ?? user.timeoutMs,
    userAgent: opts.userAgent ?? user.userAgent,
  };
}

/**
 * A copy of the user configuration (family runtime defaults are not included).
 *
 * @returns A fresh {@link SdvConfig}: the `transport` and `auth` maps are shallow copies,
 *   so mutating the result never changes the live configuration.
 * @example
 * ```ts
 * import { configure, getConfig } from 'sportsdataverse';
 *
 * configure({ retries: 5 });
 * getConfig().retries; // 5
 * getConfig().timeoutMs; // 30000 (the built-in default)
 * ```
 * @remarks
 * To see what a family will actually use once its registered defaults are applied, call
 * {@link resolveFamily} (not re-exported from the package root).
 */
export function getConfig(): SdvConfig {
  return { ...user, transport: { ...user.transport }, auth: { ...user.auth } };
}

/**
 * Drop everything set via `configure` (family runtime defaults stay installed).
 *
 * @returns Nothing; the user configuration returns to the built-in defaults.
 * @example
 * ```ts
 * import { configure, resetConfig } from 'sportsdataverse';
 *
 * afterEach(() => resetConfig()); // each test starts from the built-in defaults
 * configure({ retries: 0 });
 * ```
 * @remarks
 * Also forgets that `retries` / `timeoutMs` were user-set, so a family's registered
 * default applies again. Use `_unregisterFamilyDefaults` (internal) to drop those.
 */
export function resetConfig(): void {
  user = fresh();
  userSet = {};
}

/**
 * For family runtimes: install the transport / auth / retry statuses / retry
 * budget / timeout a family needs by default. A user `configure` entry for the
 * same family (or a `retries` / `timeoutMs` the user set) still wins.
 *
 * @param family - Family stem (`"nfl_api"`, `"pff_api"`, `"nba_stats"`, …).
 * @param defaults - The {@link FamilyDefaults} to install; merged over anything already
 *   registered for `family`, field by field.
 * @returns Nothing.
 * @example
 * ```ts
 * import { registerFamilyDefaults, headerAuth, InvalidParameterError } from 'sportsdataverse';
 *
 * registerFamilyDefaults('my_api', {
 *   auth: headerAuth({ 'X-Api-Key': process.env.MY_API_KEY }),
 *   retryStatuses: [408, 429, 500, 502, 503, 504], // auth-gated: a 403 is forbidden, not load
 *   retries: 4,
 *   classifyError: (res, url) =>
 *     res.status === 200 ? new InvalidParameterError(`my_api: empty body`, { url, status: 200 }) : undefined,
 * });
 * ```
 * @remarks
 * Calls merge: registering `{ retries: 4 }` keeps a previously registered `transport`.
 * Family runtimes call this at import time; {@link resetConfig} does not undo it.
 */
export function registerFamilyDefaults(family: string, defaults: FamilyDefaults): void {
  familyDefaults[family] = { ...familyDefaults[family], ...defaults };
}

/**
 * Test seam: forget what {@link registerFamilyDefaults} installed for `families`.
 *
 * @param families - Family stems to forget; an unknown stem is ignored.
 * @returns Nothing.
 * @example
 * ```ts
 * import { _unregisterFamilyDefaults } from './core/config.js';
 *
 * afterEach(() => _unregisterFamilyDefaults('t2_test_family', 't2_auth_family'));
 * ```
 * @internal
 */
export function _unregisterFamilyDefaults(...families: string[]): void {
  for (const family of families) delete familyDefaults[family];
}

/**
 * Resolve one family. Transport precedence: user `[family]` > registered family
 * default > user `"default"` > axios — a host-required family transport (e.g.
 * TLS impersonation) is never silently replaced by a generic user default.
 * Auth: user `[family]` > registered default. Retry statuses: registered
 * default > {@link DEFAULT_RETRY_STATUSES}. Retries / timeout: a value the user
 * set via `configure` > registered default > built-in (3 retries, 30 s).
 *
 * @param family - Family stem to resolve; a stem nothing registered gets the user / built-in values.
 * @returns The merged {@link ResolvedFamilyConfig} for that family. `userAgent` is always the
 *   user's (or built-in) value; `classifyError` is only the family's registered one.
 * @example
 * ```ts
 * import { resolveFamily } from './core/config.js'; // not re-exported from the package root
 *
 * const { transport, retries, timeoutMs } = resolveFamily('nfl_api');
 * ```
 * @remarks
 * Precedence per field, first match wins:
 * - `transport`: user `[family]` > registered family default > user `"default"` > `axiosTransport`.
 * - `auth`: user `[family]` > registered default (never a user `"default"`).
 * - `retries` / `timeoutMs`: user-set via `configure` > registered default > built-in.
 * - `retryStatuses`: registered default > {@link DEFAULT_RETRY_STATUSES}.
 * A family runtime (e.g. `nfl_auth.ts`) calls this for its own token-mint request so a user
 * transport / timeout applies there too.
 */
export function resolveFamily(family: string): ResolvedFamilyConfig {
  const fam = familyDefaults[family] ?? {};
  return {
    transport:
      user.transport[family] ?? fam.transport ?? user.transport.default ?? axiosTransport,
    auth: user.auth[family] ?? fam.auth,
    retries: userSet.retries ?? fam.retries ?? user.retries,
    timeoutMs: userSet.timeoutMs ?? fam.timeoutMs ?? user.timeoutMs,
    userAgent: user.userAgent,
    retryStatuses: fam.retryStatuses ?? DEFAULT_RETRY_STATUSES,
    classifyError: fam.classifyError,
  };
}
