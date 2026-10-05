// Browser-safe parser barrel: the entry `npm run bundle:parsers` builds the
// docs playground's parser bundle from. Re-exports the parser layer so a raw
// ESPN / native payload can become tidy rows WITHOUT the package root (which
// pulls in node-only HTTP deps: axios, cheerio). Everything here transitively
// imports only `_normalize`, the sibling parser modules, and `papaparse` — all
// browser-safe. The public `sportsdataverse/parsers` entry (index.ts) is this
// plus the node-only KenPom HTML parser.

export { normalize, snakeCase } from "./_normalize.js";
export { PARSERS, parserFor } from "./_registry.js";
export type { ParserFn, FlatParserFn, ParsedTables } from "./_registry.js";
export { MULTI_TABLE_SECTIONS } from "./_frames.js";
// Multi-table parsers: every sub-frame at once (the registry entries return one,
// chosen by `section`).
export { parse_asa_goals_added_tables } from "./asa.js";
export { parse_mls_standings_tables, parse_mls_match_tables } from "./mls_api.js";
export { parse_nwsl_lineups_tables } from "./nwsl_api.js";
// Subscription families (pure JSON, browser-safe): PFF Developer API + NFL Pro.
export {
  parse_pff_report,
  parse_pff_player_detail,
  parse_pff_v2_table,
  parse_pff_matrix,
} from "./pff_api.js";
export { parse_nfl_pro_stats } from "./nfl_pro.js";
export {
  ESPN_ENDPOINT_PARSERS,
  parserForEndpoint,
  parse_summary,
  SECTIONED_ENDPOINTS,
  SUMMARY_SECTION_PARSERS,
} from "./espn.js";

import { parserFor } from "./_registry.js";
import { MULTI_TABLE_SECTIONS } from "./_frames.js";
import { SECTIONED_ENDPOINTS, parserForEndpoint } from "./espn.js";

/** Tidy rows, or — for the ESPN `summary` dispatcher, or a dict-default flat
 * multi-table parser, with no section — a dict of sub-frames. `null` when no
 * parser is registered for the endpoint. */
export type ParsedResult =
  | Record<string, any>[]
  | Record<string, Record<string, any>[]>
  | null;

/**
 * Unified parse helper: turn a raw payload into tidy rows given how the endpoint
 * was dispatched.
 *
 * - `kind: "espn"` — `key` is the endpoint short name (e.g. `"scoreboard"`,
 *   `"summary"`); the `summary` dispatcher (and the CDN game pages, which run it)
 *   honours `section` (omit it to get the dict of all 21 sub-frames).
 * - `kind: "flat"` — `key` is the registered parser name (a native wrapper's
 *   `parser`, e.g. `"parse_mlb_schedule"`); a multi-table parser
 *   (`MULTI_TABLE_SECTIONS`) honours `section` exactly as the wrapper's
 *   `{ parsed: true, section }` does.
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
    if (SECTIONED_ENDPOINTS.has(key)) return (fn as (p: any, s?: string) => ParsedResult)(raw, section);
    return (fn as (p: any) => Record<string, any>[])(raw);
  }
  const fn = parserFor(key);
  if (!fn) return null;
  // as callFlat (src/leagues/_make_flat.ts)
  return key in MULTI_TABLE_SECTIONS ? fn(raw, section) : fn(raw);
}
