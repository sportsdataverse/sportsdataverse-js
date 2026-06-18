// Parsers for the official MLB Stats API (`statsapi.mlb.com/api/v1/`). The
// flat wrappers in the generated table return raw JSON; these turn the payloads
// into tidy rectangular rows. Faithful port of
// `sportsdataverse/mlb/mlb_parsers.py`:
//
//   - return an array of flat row objects (the JS analogue of a polars frame);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are deep-flattened (`_`) and snake_cased via `normalize`.
//
// Most endpoints use the generic `parse_mlb_list` (find the first
// list-valued top-level key and flatten it); the dedicated parsers below do
// extra unrolling (schedule dates[].games[], standings records[].teamRecords[],
// stats[].splits[], the boxscore players-by-id dict, etc.).

import { normalize } from "./_normalize.js";

/** Is `v` a plain object (not null, not an array)? */
function isPlainObject(v: any): boolean {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Common top-level array keys in Stats API responses. Tried in order — mirrors
 * the Python `_LIST_KEYS` tuple. `parse_mlb_list` walks these and flattens
 * the first one that resolves to a non-empty list of objects.
 */
const LIST_KEYS = [
  "teams",
  "venues",
  "sports",
  "leagues",
  "divisions",
  "seasons",
  "awards",
  "awardRecipients",
  "umpires",
  "people",
  "players",
  "items",
  "records",
  "conferences",
  "roster",
  "highLowResults",
  "leagueLeaders",
  "freeAgents",
  "stats",
  "series",
];

/**
 * Generic parser for any MLB Stats API response that wraps a list of records
 * under a known top-level key. Walks `LIST_KEYS` in order and flattens the
 * first key that resolves to a non-empty array of objects.
 *
 * Use a dedicated parser (`parse_mlb_schedule`, `parse_mlb_standings`,
 * `parse_mlb_person_stats`, …) for endpoints that need extra unrolling.
 */
export function parse_mlb_list(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  for (const key of LIST_KEYS) {
    const candidate = raw[key];
    if (Array.isArray(candidate) && candidate.length > 0 && isPlainObject(candidate[0])) {
      return normalize(candidate);
    }
  }
  return [];
}

/** Parse `mlb_teams()` into one row per team (from `teams[]`). */
export function parse_mlb_teams(raw: any): Record<string, any>[] {
  return normalize(raw?.teams ?? []);
}

/**
 * Parse `mlb_schedule()` into one row per game.
 *
 * The Stats API ships the schedule as `{dates: [{date, games: [...]}, ...]}`;
 * this walks every `dates[].games[]`, prefixes the schedule `date` onto each
 * game row, and flattens the nested `teams.*` / `venue.*` / `status.*` fields.
 */
export function parse_mlb_schedule(raw: any): Record<string, any>[] {
  const dates = raw?.dates;
  if (!Array.isArray(dates) || dates.length === 0) return [];
  const rows = dates.flatMap((d: any) =>
    (d?.games ?? []).map((g: any) => ({ schedule_date: d?.date, ...g }))
  );
  return normalize(rows);
}

/**
 * Parse `mlb_team_roster()` into one row per player (from `roster[]`).
 *
 * Input: `{roster: [{person, jerseyNumber, position, status}, ...]}`. The
 * `person` / `position` / `status` sub-dicts flatten to `person_id`,
 * `position_abbreviation`, `status_code`, etc.
 */
export function parse_mlb_team_roster(raw: any): Record<string, any>[] {
  return normalize(raw?.roster ?? []);
}

/**
 * Parse `mlb_standings()` into one row per (division × team).
 *
 * Input: `{records: [{standingsType, league, division, teamRecords: [...]},
 * ...]}`. Walks each division's `teamRecords[]` and prefixes the (namespaced)
 * division identifiers onto each team row so a single output row carries both
 * the division context and the team's full standing stats.
 */
export function parse_mlb_standings(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const records = raw.records;
  if (!Array.isArray(records) || records.length === 0) return [];
  const rows: Record<string, any>[] = [];
  for (const div of records) {
    if (!isPlainObject(div)) continue;
    // Namespace the division-level fields with a `standings_` prefix so they
    // don't collide with same-named team-record fields once flattened (e.g.
    // teamRecords has its own `lastUpdated`).
    const base = {
      standings_type: div.standingsType,
      standings_league_id: div.league?.id,
      standings_league_name: div.league?.name,
      standings_division_id: div.division?.id,
      standings_division_name: div.division?.name,
      standings_last_updated: div.lastUpdated,
    };
    for (const teamRow of div.teamRecords ?? []) {
      rows.push({ ...base, ...(teamRow ?? {}) });
    }
  }
  return normalize(rows);
}

/**
 * Parse `mlb_person_stats()` / `mlb_team_stats()` into one row per
 * stats split.
 *
 * Input: `{stats: [{type, group, splits: [{season, stat, team, player, ...},
 * ...]}, ...]}`. Each `stats[]` entry is a (statsType × statsGroup) bucket;
 * each `splits[]` row is one sliced view. Flattens each `splits[]` row and
 * prefixes `stats_type` / `stats_group` from the parent.
 */
export function parse_mlb_person_stats(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const stats = raw.stats;
  if (!Array.isArray(stats) || stats.length === 0) return [];
  const rows: Record<string, any>[] = [];
  for (const block of stats) {
    if (!isPlainObject(block)) continue;
    const base = {
      stats_type: block.type?.displayName,
      stats_group: block.group?.displayName,
    };
    for (const split of block.splits ?? []) {
      rows.push({ ...base, ...(split ?? {}) });
    }
  }
  return normalize(rows);
}

/**
 * Parse `mlb_boxscore()` into one row per (team-side × player).
 *
 * Input: `{teams: {home: {team, players: {ID######: {...}}}, away: {...}}}`.
 * The `players` block is a *dict keyed by* `ID<id>` (not a list), so this
 * walks each side's players, prefixes `team_side` / `team_id` / `team_name`,
 * and flattens the nested `person` / `position` / `stats.*` sub-dicts.
 */
export function parse_mlb_boxscore(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  const teams = raw.teams ?? {};
  const rows: Record<string, any>[] = [];
  for (const side of ["home", "away"]) {
    const sideData = teams[side] ?? {};
    const team = sideData.team ?? {};
    const base = { team_side: side, team_id: team.id, team_name: team.name };
    const players = sideData.players ?? {};
    for (const player of Object.values(players)) {
      rows.push({ ...base, ...((player as Record<string, any>) ?? {}) });
    }
  }
  return normalize(rows);
}

/**
 * Parse `mlb_linescore()` into one row per inning (from `innings[]`).
 *
 * Input: `{innings: [{num, ordinalNum, home: {runs, hits, errors}, away:
 * {...}}, ...]}`. Each inning flattens so home/away become `home_runs` /
 * `away_hits` columns.
 */
export function parse_mlb_linescore(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  return normalize(raw.innings ?? []);
}

/**
 * Parse `mlb_play_by_play()` into one row per play (from `allPlays[]`).
 *
 * Input: `{allPlays: [{result, about, count, matchup, ...}, ...]}`. Each entry
 * flattens: nested `result.*` / `about.*` / `count.*` / `matchup.*` dicts
 * become columns, list fields are stringified.
 */
export function parse_mlb_play_by_play(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw)) return [];
  return normalize(raw.allPlays ?? []);
}

/**
 * Parse `mlb_win_probability()` into one row per play.
 *
 * Unlike most Stats API endpoints, `winProbability` returns a *bare top-level
 * JSON array* of play objects carrying win-probability series fields. Flattened
 * directly.
 */
export function parse_mlb_win_probability(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw)) return [];
  return normalize(raw);
}

/**
 * Parse `mlb_draft_latest()` into a single-row frame.
 *
 * The latest-pick endpoint returns `{pick: {...}, number, nextUp}` — a single
 * object rather than a list — so it is flattened as one row (with the
 * `copyright` boilerplate dropped). The nested `pick` sub-dict unrolls into
 * `pick_*` columns.
 */
export function parse_mlb_draft_latest(raw: any): Record<string, any>[] {
  if (!isPlainObject(raw) || Object.keys(raw).length === 0) return [];
  const { copyright, ...row } = raw;
  return normalize([row]);
}

/**
 * Parse a bare list of GUMBO / color timecodes into a one-column frame.
 *
 * The `feed/live/timestamps` and `feed/color/timestamps` endpoints return a
 * bare JSON array of timecode strings (e.g. `"20230929_215457"`). Shaped into a
 * single `timecode` column, one row per timestamp.
 */
export function parse_mlb_timecodes(raw: any): Record<string, any>[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return normalize(raw.map((t: any) => ({ timecode: t })));
}

/**
 * Endpoint (parser name) → parser. Mirrors the Python
 * `MLB_ENDPOINT_PARSERS` registry but is keyed by the *parser function
 * name* the YAML references (the JS generator threads `def.parser` straight
 * through `parserFor`). Endpoints whose `parser:` is `parse_mlb_list` are
 * not listed individually — they resolve to the generic flattener by name.
 */
export const MLB_PARSERS = {
  parse_mlb_list,
  parse_mlb_teams,
  parse_mlb_schedule,
  parse_mlb_team_roster,
  parse_mlb_standings,
  parse_mlb_person_stats,
  parse_mlb_boxscore,
  parse_mlb_linescore,
  parse_mlb_play_by_play,
  parse_mlb_win_probability,
  parse_mlb_draft_latest,
  parse_mlb_timecodes,
};
