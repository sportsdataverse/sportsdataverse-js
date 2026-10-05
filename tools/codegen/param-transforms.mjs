// Param transforms the runtime implements (src/core/transforms.ts TRANSFORMS;
// test/transforms.test.js keeps the two lists equal). generate.mjs refuses any
// other `transform:` name, so a transform sdv-py adds upstream fails the codegen
// loudly instead of being silently dropped.
export const PARAM_TRANSFORMS = ["bool_str", "_bool_str", "format_nhl_season", "season_latest_with_data"];

// A transform sdv-py defines in one family's runtime module only (the generated
// wrapper imports it from its getter module), so py fails at generate time on any
// other family; so does the codegen here.
export const FAMILY_TRANSFORMS = {
  season_latest_with_data: ["nba_stats", "wnba_stats"],
};

/** Return `name` if the runtime implements it for family `api`; throw otherwise. */
export function checkTransform(name, where, api) {
  if (!PARAM_TRANSFORMS.includes(name)) {
    throw new Error(
      `${where}: unknown param transform "${name}" — port it to src/core/transforms.ts ` +
        `(+ docs/src/playground/resolve.mjs) and add it to tools/codegen/param-transforms.mjs`
    );
  }
  const families = FAMILY_TRANSFORMS[name];
  if (families && !families.includes(api)) {
    throw new Error(`${where}: param transform "${name}" is only defined for ${families.join(", ")}, not "${api}"`);
  }
  return name;
}
