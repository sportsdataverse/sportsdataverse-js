import type { WrapperFn } from "./types.js";

/**
 * A pre-v4 wrapper name kept callable after v4 adopted sdv-py's names: it
 * forwards to `deprecatedAliasOf` (the v4 wrapper) and warns once.
 *
 * @remarks
 * Built by {@link deprecatedAlias}; both properties are non-enumerable and read-only, and
 * `fn.name` is the old name so stack traces show what the caller used.
 */
export interface DeprecatedAlias extends WrapperFn {
  /** The v4 wrapper this alias forwards to. */
  readonly deprecatedAliasOf: WrapperFn;
  /** The v4 name to call instead. */
  readonly replacement: string;
}

/**
 * `code` of the DeprecationWarning a pre-v4 name emits.
 *
 * @remarks
 * Filter with `w.code === "SDV_DEPRECATED_NAME"` in a `process.on("warning")` listener.
 */
export const DEPRECATED_NAME_CODE = "SDV_DEPRECATED_NAME";

/**
 * `code` of the DeprecationWarning a deprecated ENDPOINT emits (endpoint YAML
 * `deprecated:`: a dead route kept callable, e.g. `recruiting_*`, the Fox routes
 * sdv-py dropped). Filter with `w.code === "SDV_DEPRECATED_ENDPOINT"`.
 */
export const DEPRECATED_ENDPOINT_CODE = "SDV_DEPRECATED_ENDPOINT";

const warned = new Set<string>();

/**
 * `process.emitWarning(message, options)` the first time `key` is seen in this
 * process, never again: the one warn-once registry behind the deprecated names and
 * endpoints, the stats.ncaa.org scrapers and the CDN football-date warning. Namespace
 * the key by caller (`"name:" + fn`) so two callers cannot share it.
 *
 * @param key - Registry key; the first call per process with this key warns, later ones return.
 *   Namespace it (`"name:espn_nfl_pbp"`, `"endpoint:recruiting_players"`).
 * @param message - The warning text.
 * @param options - `process.emitWarning` options: `type` (e.g. `"DeprecationWarning"`) and a
 *   stable `code` callers can filter on ({@link DEPRECATED_NAME_CODE}, {@link DEPRECATED_ENDPOINT_CODE}).
 * @returns Nothing.
 * @example
 * ```ts
 * import { warnOnce, DEPRECATED_ENDPOINT_CODE } from './core/deprecation.js';
 *
 * warnOnce(`endpoint:${short}`, `${short}() hits a dead route`, {
 *   type: 'DeprecationWarning',
 *   code: DEPRECATED_ENDPOINT_CODE,
 * });
 * ```
 * @remarks
 * The registry is a module-level `Set`, so it is per process and shared by every caller;
 * {@link resetWarnOnce} clears it (for tests). Only `DEPRECATED_NAME_CODE` and
 * `DEPRECATED_ENDPOINT_CODE` are re-exported from the package root.
 */
export function warnOnce(key: string, message: string, options: { type?: string; code?: string }): void {
  if (warned.has(key)) return;
  warned.add(key);
  process.emitWarning(message, options);
}

/**
 * Forget every {@link warnOnce} key, so each warns again. For tests: a "warns once"
 * test calls it first instead of depending on no earlier test having warned.
 *
 * @returns Nothing.
 * @example
 * ```ts
 * import { resetWarnOnce } from './core/deprecation.js';
 *
 * beforeEach(() => resetWarnOnce());
 * ```
 */
export function resetWarnOnce(): void {
  warned.clear();
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/**
 * Wrap `target` under its pre-v4 `name`: same behaviour, plus ONE
 * `DeprecationWarning` per name per process naming `replacement`.
 *
 * @param target - The v4 wrapper to forward to.
 * @param name - The pre-v4 name the caller uses; becomes `fn.name` and the warn-once key `"name:<name>"`.
 * @param replacement - The v4 name the warning tells the caller to use instead.
 * @returns A {@link DeprecatedAlias}: `(params?) => target(params)` with `deprecatedAliasOf`
 *   and `replacement` attached.
 * @example
 * ```ts
 * import { deprecatedAlias } from './core/deprecation.js';
 *
 * const espnNflAthleteBio = deprecatedAlias(espnNflPlayerBio, 'espnNflAthleteBio', 'espnNflPlayerBio');
 * await espnNflAthleteBio({ athleteId: 3139477 }); // warns once (code SDV_DEPRECATED_NAME), then forwards
 * ```
 * @remarks
 * The warning is emitted through {@link warnOnce} with `type: "DeprecationWarning"` and
 * `code: DEPRECATED_NAME_CODE`, on the first call only; the forward itself is unchanged.
 */
export function deprecatedAlias(target: WrapperFn, name: string, replacement: string): DeprecatedAlias {
  const alias = (params?: Record<string, any>) => {
    warnOnce(
      `name:${name}`,
      `${name}() is deprecated: sportsdataverse v4 adopted sdv-py's names; call ${replacement}() instead. ` +
        "The old name will be removed in a future major release.",
      // A stable `code` so callers can filter: `w.code === "SDV_DEPRECATED_NAME"`.
      { type: "DeprecationWarning", code: DEPRECATED_NAME_CODE }
    );
    return target(params);
  };
  return Object.defineProperties(alias, {
    name: { value: name }, // stack traces / fn.name show the name the caller used
    deprecatedAliasOf: { value: target },
    replacement: { value: replacement },
  }) as DeprecatedAlias;
}

/**
 * The entries of `aliases` whose target `mod` exposes (a runtime-factory module
 * may bind fewer wrappers than the generated namespace the table was built for).
 *
 * @param mod - The module (name → wrapper) the aliases will be attached to.
 * @param aliases - `old snake_case name -> new snake_case name` table; default `{}`.
 * @returns The subset of `aliases` whose new name is a key of `mod`.
 * @example
 * ```ts
 * import { aliasesFor, withDeprecatedAliases } from './core/deprecation.js';
 *
 * import { ESPN_DEPRECATED_ALIASES } from '../generated/aliases.js';
 *
 * const mod = withDeprecatedAliases(bound, aliasesFor(bound, ESPN_DEPRECATED_ALIASES.nfl));
 * ```
 * @remarks
 * Use it before {@link withDeprecatedAliases} when `mod` may legitimately lack a target;
 * `withDeprecatedAliases` throws on a missing one.
 */
export function aliasesFor(
  mod: Record<string, WrapperFn>,
  aliases: Record<string, string> = {}
): Record<string, string> {
  return Object.fromEntries(Object.entries(aliases).filter(([, now]) => now in mod));
}

/**
 * A copy of `mod` plus a deprecated alias for every `old snake -> new snake`
 * entry of `aliases`, under both the snake_case and camelCase forms (the
 * generated tables in src/generated/aliases.ts). Throws when a target is
 * missing, so a stale table fails loudly instead of dropping a name.
 *
 * @param mod - The module (name → wrapper) to extend; it is not mutated.
 * @param aliases - `old snake_case name -> new snake_case name` table; default `{}`. Each entry
 *   also yields a camelCase pair (`old_name` → `oldName`, `new_name` → `newName`).
 * @returns A shallow copy of `mod` with one {@link DeprecatedAlias} per old name (snake and
 *   camel). An existing key of `mod` with the same name as an alias is overwritten.
 * @throws Error `"deprecated alias <old>: no wrapper named <new>"` when `mod[new]` is not a
 *   function (checked for the snake and the camel form).
 * @example
 * ```ts
 * import { withDeprecatedAliases } from './core/deprecation.js';
 *
 * const nfl = withDeprecatedAliases(generated, { espn_nfl_athlete_bio: 'espn_nfl_player_bio' });
 * await nfl.espnNflAthleteBio({ athleteId: 3139477 }); // DeprecationWarning once, then espnNflPlayerBio
 * ```
 */
export function withDeprecatedAliases(
  mod: Record<string, WrapperFn>,
  aliases: Record<string, string> = {}
): Record<string, WrapperFn> {
  const out: Record<string, WrapperFn> = { ...mod };
  for (const [oldSnake, newSnake] of Object.entries(aliases)) {
    for (const [old, now] of [
      [oldSnake, newSnake],
      [toCamel(oldSnake), toCamel(newSnake)],
    ]) {
      const target = mod[now];
      if (typeof target !== "function") throw new Error(`deprecated alias ${old}: no wrapper named ${now}`);
      out[old] = deprecatedAlias(target, old, now);
    }
  }
  return out;
}
