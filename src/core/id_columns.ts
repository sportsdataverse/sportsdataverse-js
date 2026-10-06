// The ONE id-column name predicate (owner decision 2026-10-05 12:55, #91), shared
// by every runtime surface (src/core/int64.ts re-exports it) AND by the codegen
// type generator (tools/codegen/id-columns.mjs transpiles THIS file), so a
// generated row type and the runtime value agree on which columns are ids.
// Dependency-free on purpose: no imports, so the generator can load it without
// a build.

/**
 * Savant columns holding MLBAM integer ids (players, game): sdv-py's
 * `_MLBAM_ID_COLUMNS` at the vendor pin. Their names do not end in `_id`, so the
 * id rule lists them.
 *
 * @remarks `batter`, `pitcher`, `on_1b` / `on_2b` / `on_3b`, `fielder_2` .. `fielder_9` and
 *   `game_pk` (13 names). `fielder_1`, `fielder_10` and `n_pk` are NOT ids. Re-exported from
 *   `./int64.ts`.
 */
export const MLBAM_ID_COLUMNS: readonly string[] = [
  "batter", "pitcher", "on_1b", "on_2b", "on_3b",
  ...[2, 3, 4, 5, 6, 7, 8, 9].map((i) => `fielder_${i}`),
  "game_pk",
];
/**
 * Whole column names that are ids but fit no pattern: the MLBAM ids, and the
 * stats.nba.com video playlist's `hid` / `vid` (home / visitor team id: 1610612744 /
 * 1610612747 in the committed videodetailsasset capture, the payload's own TeamID).
 */
const EXACT_IDS = new Set([...MLBAM_ID_COLUMNS, "hid", "vid"]);

/**
 * One name segment that marks an id: `id`; `*_id`, `*_ids`; a numbered id
 * (`athlete_id_1`, `sack_player_id2`, `team_id_247`); `id_play` / `id_drive`;
 * `*_id_started` / `*_id_ended` (`drive_play_id_started`); stats.nba.com's
 * underscore-less `teamid` / `personid` / `playerid` / `matchupid`
 * (`hometeam_teamid`, `gameleaders_homeleaders_personid`); camelCase `…Id` / `…Ids`
 * (`playerId`, `homeTeamId`). Lower-case `id` must stand alone or touch `_`, and
 * camelCase needs the capital `I`, so words like valid, paid, void, idle, Idaho,
 * width, event_idx never match. Only listed words may follow `id_` / `_id_`: the
 * columns `team_id_source` ("espn"), `*_sportec_id_overwrite` (a flag) and
 * `player_id_list` (a joined list) are not ids. `_pk` is not a suffix rule (only
 * `game_pk` is an id; Savant's `n_pk` is a pickoff count).
 */
const ID_SEGMENT =
  /^id$|_ids?$|_id\d+$|_id_(\d+|started|ended)$|^id_(play|drive)$|(team|person|player|matchup)id$|[a-z0-9]Ids?$/;

/**
 * A join-key column: its last dotted segment marks an id (`id`, `*_id`, `*_ids`,
 * `athlete_id_1`, `id_play`, `drive_play_id_started`, `hometeam_teamid`,
 * `playerId`, `homeTeamId`; dotted `start.team.id`), or it is a listed id column
 * (MLBAM: `batter`, `on_1b`, `game_pk`, ...; stats.nba.com `hid` / `vid`). The one
 * id-name predicate: every surface and the parity harness use it.
 *
 * @param name - A column name, possibly dotted (`participants.0.athlete.id`); only the part
 *   after the last `.` is tested against the segment pattern, the whole name against the
 *   listed exact ids.
 * @returns `true` when the column holds ids and must be decimal strings (the v4 id rule).
 * @remarks Case matters: lower-case `id` must stand alone or touch `_`, camelCase needs the
 *   capital `I`, so `valid`, `paid`, `idle`, `Idaho`, `width`, `event_idx`, `ID`, `ids`, `pk`
 *   never match. The only words allowed after `id_` / `_id_` are a number, `started`, `ended`,
 *   `play`, `drive`; `team_id_source`, `*_sportec_id_overwrite` and `player_id_list` are not
 *   ids. `tools/codegen/id-columns.mjs` transpiles this file, so the generated row types use
 *   the same predicate.
 * @example
 * ```ts
 * import { isIdColumn } from "./id_columns.js";
 * isIdColumn("game_id");         // true
 * isIdColumn("start.team.id");   // true (last dotted segment)
 * isIdColumn("homeTeamId");      // true
 * isIdColumn("game_pk");         // true (listed MLBAM id)
 * isIdColumn("team_id_source");  // false
 * ```
 */
export function isIdColumn(name: string): boolean {
  return ID_SEGMENT.test(name.slice(name.lastIndexOf(".") + 1)) || EXACT_IDS.has(name);
}
