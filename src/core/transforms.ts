/**
 * Param transforms named by `transform:` on a path / query param in the
 * vendored sdv-py endpoint YAML. Exact ports of the sdv-py functions at the
 * vendor pin (tools/codegen/vendor.yaml `source.ref`); the resolvers in
 * src/core/espn.ts + flat.ts apply them to the resolved value (explicit param
 * or its default) before it reaches the URL. `null` / `undefined` pass through,
 * so an unset param is still dropped. The codegen refuses any name not listed in
 * tools/codegen/param-transforms.mjs (a test keeps the two lists equal), and the
 * docs playground carries a dependency-free copy (docs/src/playground/resolve.mjs).
 */

/** A param transform: resolved value -> wire value (`null`/`undefined` pass through). */
export type ParamTransform = (value: unknown) => unknown;

/** Python truthiness for the values a wrapper param can hold. */
function pyTruthy(v: unknown): boolean {
  if (typeof v === "number") return v !== 0; // NaN is truthy in Python too
  if (typeof v === "string" || Array.isArray(v)) return v.length > 0;
  if (v !== null && typeof v === "object") return Object.keys(v).length > 0;
  return Boolean(v);
}

/**
 * `sportsdataverse._codegen_runtime.bool_str`: a truthy value becomes `"true"`,
 * a falsy one `"false"` (Python truthiness, so `"false"` the string is truthy).
 */
export function bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return pyTruthy(value) ? "true" : "false";
}

/**
 * `sportsdataverse.nfl.nfl_api_runtime._bool_str`: `str(value).lower()`, so
 * `true` -> `"true"`, `"False"` -> `"false"`, `1` -> `"1"`.
 */
export function _bool_str(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  return String(value).toLowerCase();
}

/**
 * `sportsdataverse._codegen_runtime.format_nhl_season`: a 4-digit end year
 * becomes the 8-digit api-web season (`2025` -> `"20242025"`); an 8-digit value
 * passes through as a string. Anything else throws.
 */
export function format_nhl_season(season: unknown): unknown {
  if (season === null || season === undefined) return season;
  const s = String(season);
  if (s.length === 8 && /^\d+$/.test(s)) return s;
  if (s.length === 4 && /^\d+$/.test(s)) return `${Number(s) - 1}${s}`;
  throw new Error(`Unrecognized NHL season ${JSON.stringify(season)}`);
}

/** Every transform the endpoint YAML may name, keyed by its sdv-py name. */
export const TRANSFORMS: Record<string, ParamTransform> = {
  bool_str,
  _bool_str,
  format_nhl_season,
};

/** Apply the named transform to `value` (no name: unchanged; unknown name: throws). */
export function applyTransform(name: string | undefined, value: unknown): unknown {
  if (!name) return value;
  const fn = TRANSFORMS[name];
  if (!fn) throw new Error(`unknown param transform "${name}"`);
  return fn(value);
}
