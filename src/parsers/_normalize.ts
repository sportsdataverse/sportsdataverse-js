// Tidy.js parser support: a `pandas.json_normalize` equivalent for the flat-API
// parser layer. Mirrors the Python parser contract in
// `sportsdataverse/mlb/mlb_parsers.py` (`_flatten_rows`):
//
//   - deep-flatten nested objects with a `_` separator,
//   - snake_case the resulting keys,
//   - stringify array-valued cells (JSON.stringify) so rows stay rectangular,
//   - non-array / empty input → [].
//
// `normalize` itself is plain TS (no @tidyjs/tidy dependency) so it has no
// surprises; downstream parsers may compose tidy verbs on the rectangular rows.

/** Is `v` a plain object (not null, not an array, not a Date)? */
function isPlainObject(v: any): boolean {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    !(v instanceof Date)
  );
}

/**
 * Convert an arbitrary key to snake_case. Handles camelCase, PascalCase,
 * `dot.separated`, and runs of capitals (`ERA` -> `era`, `homeRBI` -> `home_rbi`).
 */
export function snakeCase(key: string): string {
  return key
    .replace(/\./g, "_")
    // camelCase / PascalCase boundary: insert `_` before an uppercase that
    // follows a lowercase or digit (fooBar -> foo_Bar, x1Y -> x1_Y).
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    // run-of-capitals boundary: ABCDef -> ABC_Def
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Deep-flatten a single row object into a flat `{ snake_key: scalar }` map.
 * Nested objects are joined with `_`; array-valued cells are JSON.stringify'd
 * so the output stays rectangular (no nested structures, no arrays).
 */
function flattenRow(
  obj: Record<string, any>,
  prefix: string,
  out: Record<string, any>
): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}_${k}` : k;
    if (isPlainObject(v)) {
      flattenRow(v, key, out);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
}

/**
 * json_normalize equivalent: flatten an array of (possibly nested) row objects
 * into rectangular rows with deep `_`-joined, snake_cased keys. Array-valued
 * cells are stringified. Non-array / empty input returns `[]`.
 */
export function normalize(rows: any[]): Record<string, any>[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((row) => {
    const out: Record<string, any> = {};
    if (isPlainObject(row)) {
      flattenRow(row, "", out);
    } else {
      // Bare scalar/array row — keep it under a single `value` column so the
      // frame stays rectangular (parity with json_normalize of scalars).
      out.value = Array.isArray(row) ? JSON.stringify(row) : row;
    }
    // snake_case the (already `_`-joined) keys for a stable column set.
    const snaked: Record<string, any> = {};
    for (const [k, v] of Object.entries(out)) snaked[snakeCase(k)] = v;
    return snaked;
  });
}
