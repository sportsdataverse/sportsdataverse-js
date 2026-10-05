import type { WrapperFn } from "./types.js";

/**
 * A pre-v4 wrapper name kept callable after v4 adopted sdv-py's names: it
 * forwards to `deprecatedAliasOf` (the v4 wrapper) and warns once.
 */
export interface DeprecatedAlias extends WrapperFn {
  /** The v4 wrapper this alias forwards to. */
  readonly deprecatedAliasOf: WrapperFn;
  /** The v4 name to call instead. */
  readonly replacement: string;
}

/** `code` of the DeprecationWarning a pre-v4 name emits. */
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
 */
export function warnOnce(key: string, message: string, options: { type?: string; code?: string }): void {
  if (warned.has(key)) return;
  warned.add(key);
  process.emitWarning(message, options);
}

/**
 * Forget every {@link warnOnce} key, so each warns again. For tests: a "warns once"
 * test calls it first instead of depending on no earlier test having warned.
 */
export function resetWarnOnce(): void {
  warned.clear();
}

const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

/**
 * Wrap `target` under its pre-v4 `name`: same behaviour, plus ONE
 * `DeprecationWarning` per name per process naming `replacement`.
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
