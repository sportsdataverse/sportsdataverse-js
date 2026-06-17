// Parsers for the modern NFL.com "Shield" API (`api.nfl.com` `/football/v2` +
// `/experience` surface). The flat wrappers in the generated table return raw
// JSON; these turn the payloads into tidy rectangular rows. Faithful port of
// `sportsdataverse/nfl/nfl_api_parsers.py`:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - the records of interest live under a different top-level key per endpoint
//     (`weeks[].standings`, `rosters`, `teams`, `picks`, `data`, or a bare list /
//     single object), so each parser does its own record extraction;
//   - empty / malformed payloads return `[]` instead of throwing;
//   - keys are deep-flattened (`_`) and snake_cased via `normalize`.

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Flatten `/football/v2/standings` into one row per team standing.
 *
 * The records live under `weeks[].standings[]` — walk every returned week and
 * concat its `standings` array.
 */
export function parse_nfl_standings(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const records: any[] = [];
  for (const wk of raw.weeks ?? []) {
    for (const s of wk?.standings ?? []) records.push(s);
  }
  return normalize(records);
}

/** Flatten `/football/v2/rosters` into one row per team roster (`rosters[]`). */
export function parse_nfl_rosters(raw: any): Record<string, any>[] {
  return normalize(raw?.rosters ?? []);
}

/** Flatten `/football/v2/teams/history` into one row per team (`teams[]`). */
export function parse_nfl_teams_history(raw: any): Record<string, any>[] {
  return normalize(raw?.teams ?? []);
}

/**
 * Flatten `/football/v2/teams/{team_id}` into a one-row team-detail frame.
 *
 * The single-team endpoint returns one object — wrap it into a one-element list
 * — or an already-list payload, which is flattened directly.
 */
export function parse_nfl_team(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject(raw)) return normalize([raw]);
  return [];
}

/** Flatten `/football/v2/weeks/season/...` into one row per week (`weeks[]`). */
export function parse_nfl_weeks(raw: any): Record<string, any>[] {
  return normalize(raw?.weeks ?? []);
}

/**
 * Flatten `/football/v2/weeks/date/{date}` into a one-row week frame.
 *
 * Returns a single week object (wrapped into a one-element list) or a list.
 */
export function parse_nfl_weeks_by_date(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject(raw)) return normalize([raw]);
  return [];
}

/**
 * Flatten `/football/v2/combine/profiles` into one row per prospect
 * (`combineProfiles[]`).
 */
export function parse_nfl_combine_profiles(raw: any): Record<string, any>[] {
  return normalize(raw?.combineProfiles ?? []);
}

/** Flatten `/football/v2/draft/picks/report` into one row per pick (`picks[]`). */
export function parse_nfl_draft_picks(raw: any): Record<string, any>[] {
  return normalize(raw?.picks ?? []);
}

/** Flatten `/football/v2/injuries` into one row per injured player (`injuries[]`). */
export function parse_nfl_injuries(raw: any): Record<string, any>[] {
  return normalize(raw?.injuries ?? []);
}

/**
 * Flatten `/football/v2/stats/live/game-summaries` into one row per game
 * (records under the `data` key).
 */
export function parse_nfl_game_summaries(raw: any): Record<string, any>[] {
  return normalize(raw?.data ?? []);
}

/**
 * Flatten `/football/v2/experience/weekly-game-details` into one row per game.
 *
 * Typically a bare list, with a `games` / `data` dict fallback.
 */
export function parse_nfl_weekly_game_details(raw: any): Record<string, any>[] {
  if (Array.isArray(raw)) return normalize(raw);
  if (isPlainObject(raw)) return normalize(raw.games ?? raw.data ?? []);
  return [];
}

/**
 * Endpoint (parser name) → parser. Mirrors the registry in
 * `src/parsers/_registry.ts`; the JS generator threads `def.parser` through
 * `parserFor`.
 */
export const NFL_API_PARSERS = {
  parse_nfl_standings,
  parse_nfl_rosters,
  parse_nfl_teams_history,
  parse_nfl_team,
  parse_nfl_weeks,
  parse_nfl_weeks_by_date,
  parse_nfl_combine_profiles,
  parse_nfl_draft_picks,
  parse_nfl_injuries,
  parse_nfl_game_summaries,
  parse_nfl_weekly_game_details,
};
