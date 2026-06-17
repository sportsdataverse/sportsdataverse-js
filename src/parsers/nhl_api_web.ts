// Parsers for the modern NHL game-feed API (`api-web.nhle.com/v1/`). Faithful
// port of `sportsdataverse/nhl/nhl_api_web_parsers.py`:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// Each `nhl_api_web_*` wrapper ships a different payload shape — game-center
// deep dives carry per-team player arrays, schedules nest day -> games,
// leaderboards key by stat-category, and the right-rail endpoint exposes
// multiple independent sub-frames. The two Python dispatchers
// (`parse_nhl_web_right_rail`, `parse_nhl_web_club_stats`) return a dict of
// sub-frames by default; in the JS flat-API contract a parser returns a single
// rectangular frame, so these are ported to their PRIMARY sub-frame
// (right_rail -> season_series, club_stats -> skaters).

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// 1. Game-center
// ---------------------------------------------------------------------------

/**
 * Parse `nhl_api_web_pbp()` into one row per play.
 *
 * Walks `payload.plays` (~330 plays/game) and deep-flattens each play's nested
 * `periodDescriptor` / `details` sub-dicts. Plays are identified by `eventId` +
 * `sortOrder` and typed via `typeCode` / `typeDescKey`.
 */
export function parse_nhl_web_pbp(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.plays ?? []);
}

/**
 * Parse `nhl_api_web_boxscore()` into one row per (team × player).
 *
 * Boxscore ships `playerByGameStats: {awayTeam: {forwards, defense, goalies},
 * homeTeam: {...}}`. Walks all six (team × position-group) buckets and tags
 * each row with `home_away` ("home"/"away") and `position_group`
 * ("forwards"/"defense"/"goalies") so the output is one tidy long-form frame.
 */
export function parse_nhl_web_boxscore(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const byTeam = raw.playerByGameStats ?? {};
  const rows: Record<string, any>[] = [];
  for (const side of ["awayTeam", "homeTeam"]) {
    const teamBlock = byTeam[side] ?? {};
    const ha = side === "awayTeam" ? "away" : "home";
    for (const posGroup of ["forwards", "defense", "goalies"]) {
      for (const player of teamBlock[posGroup] ?? []) {
        rows.push({ home_away: ha, position_group: posGroup, ...(player ?? {}) });
      }
    }
  }
  return normalize(rows);
}

/**
 * Parse `nhl_api_web_landing()` into a single-row game profile. The nested
 * `summary` sub-dict (scoring / threeStars / penalties) is stringified to keep
 * the output one row per call.
 */
export function parse_nhl_web_landing(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}

/**
 * Parse `nhl_api_web_right_rail()` into one row per head-to-head game.
 *
 * The right-rail endpoint exposes several independent sub-frames
 * (`seasonSeries`, `shotsByPeriod`, `teamGameStats`, `gameInfo`,
 * `linescore.byPeriod`, `seasonSeriesWins`). The Python parser is a dispatcher
 * that returns all of them keyed by section; in the flat-API single-frame
 * contract this returns the PRIMARY sub-frame, `seasonSeries`.
 */
export function parse_nhl_web_right_rail(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  return normalize(raw.seasonSeries ?? []);
}

// ---------------------------------------------------------------------------
// 2. Schedule / score
// ---------------------------------------------------------------------------

/**
 * Parse `nhl_api_web_schedule()` / `_schedule_calendar()` into one row per
 * scheduled game.
 *
 * Input: `{gameWeek: [{date, dayAbbrev, numberOfGames, games: [...]}, ...]}`.
 * Walks every `gameWeek[].games[]` and prefixes the day's `date` onto each game
 * row as `schedule_date`.
 */
export function parse_nhl_web_schedule(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const week = raw.gameWeek ?? [];
  const rows: Record<string, any>[] = [];
  for (const day of week) {
    const dateStr = (day ?? {}).date;
    for (const game of (day ?? {}).games ?? []) {
      rows.push({ schedule_date: dateStr, ...(game ?? {}) });
    }
  }
  return normalize(rows);
}

/**
 * Parse `nhl_api_web_score()` into one row per game for the date. Shape:
 * `{currentDate, games: [...], gameWeek: [...]}` — the `games` array flattened.
 */
export function parse_nhl_web_score(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.games ?? []);
}

/**
 * Parse `nhl_api_web_club_schedule_season()` / `_month()` / `_week()` into one
 * row per game.
 *
 * All three club-schedule endpoints share the `{games: [...]}` payload shape
 * plus a few context fields (`currentSeason`, `previousSeason`, `nextSeason`,
 * `clubTimezone`). The context fields are prefixed onto each row as `club_*`.
 */
export function parse_nhl_web_club_schedule(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const ctx = {
    club_previous_season: raw.previousSeason,
    club_current_season: raw.currentSeason,
    club_next_season: raw.nextSeason,
    club_timezone: raw.clubTimezone,
  };
  const rows = (raw.games ?? []).map((game: any) => ({ ...ctx, ...(game ?? {}) }));
  return normalize(rows);
}

// ---------------------------------------------------------------------------
// 3. Standings
// ---------------------------------------------------------------------------

/** Parse `nhl_api_web_standings()` into one row per team. */
export function parse_nhl_web_standings(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.standings ?? []);
}

/** Parse `nhl_api_web_standings_season()` into one row per season. */
export function parse_nhl_web_standings_season(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.seasons ?? []);
}

// ---------------------------------------------------------------------------
// 4. Team / player surfaces
// ---------------------------------------------------------------------------

/**
 * Parse `nhl_api_web_club_stats()` / `_club_stats_season()` into one row per
 * skater.
 *
 * The payload ships `{skaters: [...], goalies: [...]}`. The Python parser is a
 * dispatcher returning both keyed by section; in the flat-API single-frame
 * contract this returns the PRIMARY sub-frame, `skaters`.
 */
export function parse_nhl_web_club_stats(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  return normalize(raw.skaters ?? []);
}

/**
 * Parse `nhl_api_web_roster()` / `_roster_season()` into one row per player.
 *
 * Shape: `{forwards: [...], defensemen: [...], goalies: [...]}`. Merges all
 * three position groups with a `position_group` column so the output is one
 * long-form frame instead of three.
 */
export function parse_nhl_web_roster(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const rows: Record<string, any>[] = [];
  for (const posGroup of ["forwards", "defensemen", "goalies"]) {
    for (const player of raw[posGroup] ?? []) {
      rows.push({ position_group: posGroup, ...(player ?? {}) });
    }
  }
  return normalize(rows);
}

/**
 * Parse `nhl_api_web_player_landing()` into a single-row player profile. Nested
 * `featuredStats` / `careerTotals` / `last5Games` sub-frames are stringified.
 */
export function parse_nhl_web_player_landing(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw) || Object.keys(raw).length === 0) return [];
  return normalize([raw]);
}

/**
 * Parse `nhl_api_web_player_game_log()` into one row per game. Walks
 * `payload.gameLog` (~76 games/season for a regular skater).
 */
export function parse_nhl_web_player_game_log(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.gameLog ?? []);
}

// ---------------------------------------------------------------------------
// 5. Leaders + draft
// ---------------------------------------------------------------------------

/**
 * Parse `nhl_api_web_skater_leaders()` / `_goalie_leaders()` into one row per
 * (category × player).
 *
 * The leaders payloads are keyed by stat category at the top level — e.g.
 * `{points: [<10 player rows>], goals: [...], ...}` for skaters; `{wins: [...],
 * savePctg: [...]}` for goalies. Walks every top-level list-valued key, tags
 * each row with the `category` it came from, and concatenates.
 */
export function parse_nhl_web_leaders(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const rows: Record<string, any>[] = [];
  for (const [category, players] of Object.entries(raw)) {
    if (!Array.isArray(players)) continue;
    for (const player of players) {
      if (!isPlainObject(player)) continue;
      rows.push({ category, ...player });
    }
  }
  return normalize(rows);
}

/** Parse `nhl_api_web_draft_picks()` (and `_now` variants) into one row per pick. */
export function parse_nhl_web_draft_picks(raw: any): Record<string, any>[] {
  return normalize((raw ?? {})?.picks ?? []);
}

/**
 * Parse `nhl_api_web_player_spotlight()` into one row per featured player. The
 * `/v1/player-spotlight` endpoint returns a bare top-level JSON array.
 */
export function parse_nhl_web_player_spotlight(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `nhl_api_web_draft_rankings()` / `_now()` into one row per prospect.
 *
 * Input: `{draftYear, categoryId, categoryKey, rankings: [...]}`. Each
 * `rankings[]` row is flattened and prefixed with the draft-year / category
 * context so a row carries both the prospect and which board it came from.
 */
export function parse_nhl_web_draft_rankings(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const base = {
    draft_year: raw.draftYear,
    category_id: raw.categoryId,
    category_key: raw.categoryKey,
  };
  const rows = (raw.rankings ?? []).map((p: any) => ({ ...base, ...(p ?? {}) }));
  return normalize(rows);
}

/**
 * Parse `nhl_api_web_playoff_series()` into one row per series game.
 *
 * Input: `{round, seriesLetter, topSeedTeam, bottomSeedTeam, games: [...]}`.
 * Emits one row per game prefixed with series context (round, series letter,
 * top/bottom seed team ids + abbrevs).
 */
export function parse_nhl_web_playoff_series(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const top = raw.topSeedTeam ?? {};
  const bottom = raw.bottomSeedTeam ?? {};
  const base = {
    round: raw.round,
    series_letter: raw.seriesLetter,
    top_seed_team_id: top.id,
    top_seed_team_abbrev: top.abbrev,
    bottom_seed_team_id: bottom.id,
    bottom_seed_team_abbrev: bottom.abbrev,
  };
  const rows = (raw.games ?? []).map((game: any) => ({ ...base, ...(game ?? {}) }));
  return normalize(rows);
}
