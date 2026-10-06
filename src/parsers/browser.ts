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
import type { ParserRow } from "../core/types.js";
import { MULTI_TABLE_SECTIONS } from "./_frames.js";
import { SECTIONED_ENDPOINTS, parserForEndpoint } from "./espn.js";

/**
 * Tidy rows, or — for the ESPN `summary` dispatcher, or a dict-default flat
 * multi-table parser, with no section — a dict of sub-frames. `null` when no
 * parser is registered for the endpoint.
 *
 * @remarks
 * The result of {@link parseEndpoint}. Narrow with `Array.isArray` (rows) / `=== null` (no
 * parser) before indexing.
 */
export type ParsedResult = ParserRow[] | Record<string, ParserRow[]> | null;

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
 *
 * @param kind - `"espn"` (look `key` up in `ESPN_ENDPOINT_PARSERS` via `parserForEndpoint`) or
 *   `"flat"` (look it up in the flat `PARSERS` registry via `parserFor`).
 * @param key - The ESPN endpoint short name, or the flat parser's registered name.
 * @param raw - The raw payload exactly as the endpoint returned it (decoded JSON, or the text
 *   body for CSV / HTML parsers).
 * @param section - A sub-frame name. Forwarded only to a sectioned ESPN endpoint
 *   (`SECTIONED_ENDPOINTS`) or a flat parser listed in `MULTI_TABLE_SECTIONS`; otherwise
 *   ignored. Omitted = the parser's default (a dict of every sub-frame for the ESPN
 *   `summary` dispatcher and the dict-default flat parsers).
 * @returns Rows, a dict of row arrays, or `null` when `key` has no parser of that `kind`.
 * @remarks
 * This function throws nothing itself, but a multi-table flat parser rejects an unknown
 * `section` with an `Error` listing the valid names (`sectionError` in `_frames.ts`). The
 * flat branch dispatches exactly as the wrapper's `{ parsed: true, section }` does
 * (`callFlat`, src/leagues/_make_flat.ts). Browser-safe: no network, no node-only parser —
 * a `"flat"` key registered only on node (`parse_kenpom_page`) returns `null` here.
 * @example
 * const rows = parseEndpoint("espn", "scoreboard", raw);
 * const players = parseEndpoint("flat", "parse_mls_match", match, "players");
 */
export function parseEndpoint(
  kind: "espn" | "flat",
  key: string,
  raw: unknown,
  section?: string
): ParsedResult {
  if (kind === "espn") {
    const fn = parserForEndpoint(key);
    if (!fn) return null;
    if (SECTIONED_ENDPOINTS.has(key)) return (fn as (p: unknown, s?: string) => ParsedResult)(raw, section);
    return (fn as (p: unknown) => ParserRow[])(raw);
  }
  const fn = parserFor(key);
  if (!fn) return null;
  // as callFlat (src/leagues/_make_flat.ts)
  return key in MULTI_TABLE_SECTIONS ? fn(raw, section) : fn(raw);
}
