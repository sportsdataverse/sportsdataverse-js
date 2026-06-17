// Parser for the NHL Records site API (`records.nhl.com/site/api/`). Faithful
// port of `sportsdataverse/nhl/nhl_records_parsers.py`. Every Records endpoint
// ships its rows under the same top-level `{data: [...], total: N}` shape
// (identical to NHL Stats REST), so a single generic parser handles all of them.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Parse any NHL Records response into tidy rows. Every Records endpoint ships
 * `{data: [{...}, ...], total: N}`; this unwraps `data` and deep-flattens it.
 * Returns `[]` when the payload is missing `data` or has an empty list.
 */
export function parse_nhl_records(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const rows = raw.data;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return normalize(rows);
}
