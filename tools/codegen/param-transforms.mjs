// Param transforms the runtime implements (src/core/transforms.ts TRANSFORMS;
// test/transforms.test.js keeps the two lists equal). generate.mjs refuses any
// other `transform:` name, so a transform sdv-py adds upstream fails the codegen
// loudly instead of being silently dropped.
export const PARAM_TRANSFORMS = ["bool_str", "_bool_str", "format_nhl_season"];

/** Return `name` if the runtime implements it; throw otherwise. */
export function checkTransform(name, where) {
  if (!PARAM_TRANSFORMS.includes(name)) {
    throw new Error(
      `${where}: unknown param transform "${name}" — port it to src/core/transforms.ts ` +
        `(+ docs/src/playground/resolve.mjs) and add it to tools/codegen/param-transforms.mjs`
    );
  }
  return name;
}
