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
import {
  parse_nhl_web_pbp,
  parse_nhl_web_boxscore,
  parse_nhl_web_landing,
  parse_nhl_web_right_rail,
  parse_nhl_web_schedule,
  parse_nhl_web_score,
  parse_nhl_web_club_schedule,
  parse_nhl_web_standings,
  parse_nhl_web_standings_season,
  parse_nhl_web_club_stats,
  parse_nhl_web_roster,
  parse_nhl_web_player_landing,
  parse_nhl_web_player_game_log,
  parse_nhl_web_leaders,
  parse_nhl_web_draft_picks,
  parse_nhl_web_player_spotlight,
  parse_nhl_web_draft_rankings,
  parse_nhl_web_playoff_series,
} from "./nhl_api_web.js";
import {
  parse_edge_top10,
  parse_edge_detail,
  parse_edge_shot_location,
  parse_edge_zone_time,
  parse_edge_sog_details,
  parse_edge_sog_summary,
  parse_edge_hardest_shots,
  parse_edge_payload,
} from "./nhl_edge.js";
import { parse_nhl_stats_rest } from "./nhl_stats_rest.js";
import { parse_nhl_records } from "./nhl_records.js";
import {
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
} from "./nfl_api.js";
import {
  parse_mlb_statcast_leaderboard,
  parse_mlb_statcast_search,
  parse_mlb_statcast_gamefeed,
  parse_mlb_statcast_schedule,
  parse_mlb_statcast_html_leaderboard,
  parse_mlb_statcast_player,
} from "./mlb_statcast.js";
import {
  parse_odds_api_sports,
  parse_odds_api_sports_odds,
  parse_odds_api_sports_scores,
  parse_odds_api_sports_events,
  parse_odds_api_sports_participants,
  parse_odds_api_event_odds,
  parse_odds_api_event_markets,
  parse_odds_api_sports_odds_history,
  parse_odds_api_sports_events_history,
  parse_odds_api_event_odds_history,
} from "./odds_api.js";
import {
  parse_sports247_list,
  parse_sports247_paged_list,
  parse_sports247_institution_rankings,
  parse_sports247_ranking_feed,
} from "./sports247.js";

/** A flat-API parser: raw JSON -> tidy rectangular rows. */
export type ParserFn = (raw: any) => Record<string, any>[];

/** Registered parsers, keyed by the `parser` name on a flat `WrapperDef`. */
export const PARSERS: Record<string, ParserFn> = {
  // ---- MLB Stats API ----
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
  // ---- NHL api-web (modern game-feed) ----
  parse_nhl_web_pbp,
  parse_nhl_web_boxscore,
  parse_nhl_web_landing,
  parse_nhl_web_right_rail,
  parse_nhl_web_schedule,
  parse_nhl_web_score,
  parse_nhl_web_club_schedule,
  parse_nhl_web_standings,
  parse_nhl_web_standings_season,
  parse_nhl_web_club_stats,
  parse_nhl_web_roster,
  parse_nhl_web_player_landing,
  parse_nhl_web_player_game_log,
  parse_nhl_web_leaders,
  parse_nhl_web_draft_picks,
  parse_nhl_web_player_spotlight,
  parse_nhl_web_draft_rankings,
  parse_nhl_web_playoff_series,
  // ---- NHL EDGE (player/team tracking) ----
  parse_edge_top10,
  parse_edge_detail,
  parse_edge_shot_location,
  parse_edge_zone_time,
  parse_edge_sog_details,
  parse_edge_sog_summary,
  parse_edge_hardest_shots,
  parse_edge_payload,
  // ---- NHL Stats REST + Records (shared {data:[...]} generic) ----
  parse_nhl_stats_rest,
  parse_nhl_records,
  // ---- NFL.com "Shield" API (api.nfl.com /football/v2) ----
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
  // ---- Baseball Savant / Statcast (baseballsavant.mlb.com) ----
  parse_mlb_statcast_leaderboard,
  parse_mlb_statcast_search,
  parse_mlb_statcast_gamefeed,
  parse_mlb_statcast_schedule,
  parse_mlb_statcast_html_leaderboard,
  parse_mlb_statcast_player,
  // ---- The Odds API (api.the-odds-api.com) ----
  parse_odds_api_sports,
  parse_odds_api_sports_odds,
  parse_odds_api_sports_scores,
  parse_odds_api_sports_events,
  parse_odds_api_sports_participants,
  parse_odds_api_event_odds,
  parse_odds_api_event_markets,
  parse_odds_api_sports_odds_history,
  parse_odds_api_sports_events_history,
  parse_odds_api_event_odds_history,
  // ---- 247Sports Recruit Database (api.247sports.com /rdb/v1) ----
  // Generic list flattener (the default for most endpoints).
  parse_sports247_list,
  // Dedicated parsers (envelope unrolling logic).
  parse_sports247_paged_list,
  parse_sports247_institution_rankings,
  parse_sports247_ranking_feed,
};

/**
 * Look up a parser by name. Returns `undefined` when `name` is missing or not
 * registered, so the caller falls back to returning the raw payload.
 */
export function parserFor(name?: string): ParserFn | undefined {
  return name ? PARSERS[name] : undefined;
}
