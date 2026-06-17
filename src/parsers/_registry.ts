// Flat-API parser registry. A flat wrapper carries a `parser` name on its
// `WrapperDef`; when a caller passes `{ parsed: true }` the wrapper dispatch
// (src/leagues/_make_flat.ts) looks the parser up here and runs it over the raw
// JSON. Mirrors the `ENDPOINT_PARSERS` / `MLB_API_ENDPOINT_PARSERS` registries
// in `sportsdataverse-py`.

import {
  parse_mlb_api_list,
  parse_mlb_api_teams,
  parse_mlb_api_schedule,
  parse_mlb_api_team_roster,
  parse_mlb_api_standings,
  parse_mlb_api_person_stats,
  parse_mlb_api_boxscore,
  parse_mlb_api_linescore,
  parse_mlb_api_play_by_play,
  parse_mlb_api_win_probability,
  parse_mlb_api_draft_latest,
  parse_mlb_api_timecodes,
} from "./mlb_api.js";

/** A flat-API parser: raw JSON -> tidy rectangular rows. */
export type ParserFn = (raw: any) => Record<string, any>[];

/** Registered parsers, keyed by the `parser` name on a flat `WrapperDef`. */
export const PARSERS: Record<string, ParserFn> = {
  // Generic list flattener (the default for most endpoints).
  parse_mlb_api_list,
  // Dedicated parsers (extra unrolling logic).
  parse_mlb_api_teams,
  parse_mlb_api_schedule,
  parse_mlb_api_team_roster,
  parse_mlb_api_standings,
  parse_mlb_api_person_stats,
  parse_mlb_api_boxscore,
  parse_mlb_api_linescore,
  parse_mlb_api_play_by_play,
  parse_mlb_api_win_probability,
  parse_mlb_api_draft_latest,
  parse_mlb_api_timecodes,
};

/**
 * Look up a parser by name. Returns `undefined` when `name` is missing or not
 * registered, so the caller falls back to returning the raw payload.
 */
export function parserFor(name?: string): ParserFn | undefined {
  return name ? PARSERS[name] : undefined;
}
