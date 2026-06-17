// Parser for the NHL Stats REST API (`api.nhle.com/stats/rest/`). Faithful port
// of `sportsdataverse/nhl/nhl_stats_rest_parsers.py`. Every data endpoint ships
// its rows under the same top-level `{data: [...], total: N}` shape, so a
// single generic parser handles all of them. The meta endpoints (`ping`,
// `componentSeason`, `config`, `content_module`) carry no parser in the YAML
// and pass through as raw JSON.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Parse any NHL Stats REST response into tidy rows. Every Stats REST endpoint
 * ships `{data: [{...}, ...], total: N}`; this unwraps `data` and deep-flattens
 * it. Returns `[]` for meta payloads (`config`, `componentSeason`, `ping`) that
 * don't carry a `data` array, or for empty / malformed input.
 */
export function parse_nhl_stats_rest(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const rows = raw.data;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return normalize(rows);
}
