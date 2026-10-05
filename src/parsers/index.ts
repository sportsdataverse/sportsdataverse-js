// Public, browser-safe parser barrel — the `sportsdataverse/parsers` subpath
// export. Re-exports the whole parser layer so callers (and the docs playground)
// can turn a raw ESPN / native payload into tidy rows WITHOUT importing the
// package root (which pulls in node-only HTTP deps: axios, cheerio). Everything
// re-exported here transitively imports only `_normalize`, the sibling parser
// modules, and `papaparse` — all browser-safe.

export { normalize, snakeCase } from "./_normalize.js";
export { PARSERS, parserFor } from "./_registry.js";
export { MULTI_TABLE_SECTIONS } from "./_frames.js";
// Multi-table parsers: every sub-frame at once (the registry entries return one,
// chosen by `section`).
export { parse_asa_goals_added_tables } from "./asa.js";
export { parse_mls_standings_tables, parse_mls_match_tables } from "./mls_api.js";
export { parse_nwsl_lineups_tables } from "./nwsl_api.js";
export type { ParserFn } from "./_registry.js";
export {
  ESPN_ENDPOINT_PARSERS,
  parserForEndpoint,
  parse_summary,
  SUMMARY_SECTION_PARSERS,
} from "./espn.js";

import { parserFor } from "./_registry.js";
import { parserForEndpoint, parse_summary } from "./espn.js";

/** Tidy rows, or — for the ESPN `summary` dispatcher with no section — the dict
 * of all 21 sub-frames. `null` when no parser is registered for the endpoint. */
export type ParsedResult =
  | Record<string, any>[]
  | Record<string, Record<string, any>[]>
  | null;

/**
 * Unified parse helper: turn a raw payload into tidy rows given how the endpoint
 * was dispatched.
 *
 * - `kind: "espn"` — `key` is the endpoint short name (e.g. `"scoreboard"`,
 *   `"summary"`); the `summary` dispatcher honours `section` (omit it to get the
 *   dict of all 21 sub-frames).
 * - `kind: "flat"` — `key` is the registered parser name (a native wrapper's
 *   `parser`, e.g. `"parse_mlb_schedule"`).
 *
 * Returns `null` when no parser is registered, so callers fall back to raw.
 */
export function parseEndpoint(
  kind: "espn" | "flat",
  key: string,
  raw: any,
  section?: string
): ParsedResult {
  if (kind === "espn") {
    const fn = parserForEndpoint(key);
    if (!fn) return null;
    if (key === "summary") return parse_summary(raw, section);
    return (fn as (p: any) => Record<string, any>[])(raw);
  }
  const fn = parserFor(key);
  return fn ? fn(raw) : null;
}
