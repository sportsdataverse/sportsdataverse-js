// Parser for the stats.nba.com / stats.wnba.com `resultSets` envelope. Faithful
// port of `sportsdataverse/nba/nba_stats_parsers.py` (`parse_nba_stats_result_sets`
// and the helpers behind it): one generic parser handles every endpoint, including
// the family's non-uniform shapes (shot-location 2-level headers, scoreboardv3,
// scheduleleaguev2, the *v3 boxscore family and the video endpoints' dict envelope).
//
// Contract: a single result set -> rows; several -> `{ [name]: rows }`; empty or
// malformed input -> `[]` (never throws). Columns are snake_cased with sdv-py's
// `underscore`. A zero-row frame in py carries the documented schema; rows-as-
// objects cannot, so an empty set is `[]`. An id column of integers (`player_id`,
// `team_id`, ...: Int64 in py) is decimal strings (the v4 id rule, src/core/int64.ts);
// `game_id` ships as a string ("0022300001") and stays one.

import { idColumnsToStrings } from "../core/int64.js";

type Row = Record<string, any>;
type ResultSet = { name?: string; headers?: any; rowSet?: any };

/** sdv-py `dl_utils.underscore` (keeps spaces/dots, unlike `snakeCase`). */
export function underscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

const isObj = (v: any): boolean => v !== null && typeof v === "object" && !Array.isArray(v);
const isNested = (v: any): boolean => isObj(v) || Array.isArray(v);

/** Python `json.dumps` (", " / ": " separators, ASCII-escaped) so stringified cells match py. */
function pyJson(v: any): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") {
    return JSON.stringify(v).replace(/[\u007f-￿]/g, (c) =>
      "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")
    );
  }
  if (Array.isArray(v)) return "[" + v.map(pyJson).join(", ") + "]";
  if (isObj(v)) {
    return "{" + Object.entries(v).map(([k, x]) => `${pyJson(String(k))}: ${pyJson(x)}`).join(", ") + "}";
  }
  return String(v);
}

/** Build a `{name, headers, rowSet}` set from dict rows (union of keys, first-seen order). */
function setFromRows(name: string, rows: Row[]): ResultSet {
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) (seen.add(k), headers.push(k));
  return { name, headers, rowSet: rows.map((r) => headers.map((h) => (h in r ? r[h] : null))) };
}

/** Same, with headers sorted (scoreboard / schedule feeds). */
function setFromRowsSorted(name: string, rows: Row[]): ResultSet {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))].sort();
  return { name, headers, rowSet: rows.map((r) => headers.map((h) => (h in r ? r[h] : null))) };
}

function videoResultSets(rs: Row): ResultSet[] {
  const urls = isObj(rs.Meta) && Array.isArray(rs.Meta.videoUrls) ? rs.Meta.videoUrls : [];
  const playlist = Array.isArray(rs.playlist) ? rs.playlist : [];
  return [
    setFromRows("videoUrls", urls.filter(isObj)),
    setFromRows("playlist", playlist.filter(isObj)),
  ];
}

function boxscoreV3ResultSets(box: Row): ResultSet[] {
  const gameMeta: Row = {};
  for (const [k, v] of Object.entries(box)) if (!isNested(v)) gameMeta[k] = v;
  const teams = ["homeTeam", "awayTeam"].filter((s) => isObj(box[s])).map((s) => box[s]);
  if (!teams.length) {
    const row: Row = {};
    for (const [k, v] of Object.entries(box)) row[k] = isNested(v) ? pyJson(v) : v;
    return [setFromRows("BoxScoreSummary", [row])];
  }
  const playerRows: Row[] = [];
  const teamRows: Row[] = [];
  for (const team of teams) {
    const ident: Row = { ...gameMeta };
    for (const [k, v] of Object.entries(team)) if (!isNested(v)) ident[k] = v;
    const tstats = isObj(team.statistics) ? team.statistics : {};
    const trow: Row = { ...ident };
    for (const [k, v] of Object.entries(tstats)) if (!isNested(v)) trow[k] = v;
    teamRows.push(trow);
    for (const player of Array.isArray(team.players) ? team.players : []) {
      const row: Row = { ...ident };
      for (const [k, v] of Object.entries(player as Row)) {
        if (k === "statistics" && isObj(v)) {
          for (const [sk, sv] of Object.entries(v)) if (!isNested(sv)) row[sk] = sv;
        } else if (isNested(v)) row[k] = pyJson(v);
        else row[k] = v;
      }
      playerRows.push(row);
    }
  }
  const sets = [setFromRows("PlayerStats", playerRows), setFromRows("TeamStats", teamRows)];
  for (const [k, v] of Object.entries(box)) {
    if (Array.isArray(v) && v.length && isObj(v[0])) {
      const rows = v.map((rec: Row) => {
        const o: Row = {};
        for (const [rk, rv] of Object.entries(rec)) o[rk] = isNested(rv) ? pyJson(rv) : rv;
        return o;
      });
      sets.push(setFromRows(k.charAt(0).toUpperCase() + k.slice(1), rows));
    }
  }
  return sets;
}

function flattenGame(record: Row, prefix = ""): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(record)) {
    const name = prefix ? `${prefix}${key}` : key;
    if (isObj(value)) Object.assign(out, flattenGame(value, `${name}_`));
    else if (Array.isArray(value)) continue;
    else out[name.toLowerCase()] = value;
  }
  return out;
}

function scoreboardResultSet(sb: Row): ResultSet {
  const base: Row = {};
  for (const [k, v] of Object.entries(sb)) if (k !== "games" && !isNested(v)) base[k] = v;
  const rows = (sb.games as any[])
    .filter(isObj)
    .map((g) => {
      const merged: Row = { ...base };
      for (const [k, v] of Object.entries(g)) if (!Array.isArray(v)) merged[k] = v;
      return flattenGame(merged);
    });
  return setFromRowsSorted("GameHeader", rows);
}

const SEASON_TYPE_BY_ID: Record<string, string> = {
  "1": "Pre-Season",
  "2": "Regular Season",
  "3": "All-Star",
  "4": "Playoffs",
  "5": "Play-In Game",
  "6": "NBA Cup",
  "9": "International",
};

/** `homeTeam.teamId` -> `home_team_id` (collapse the `team_team` stutter). */
const nestedName = (outer: string, inner: string): string =>
  `${underscore(outer)}_${underscore(inner)}`.replace(/team_team/g, "team");

function leagueScheduleResultSet(ls: Row): ResultSet {
  const rows: Row[] = [];
  for (const gd of ls.gameDates as any[]) {
    if (!isObj(gd)) continue;
    const day: Row = {};
    for (const [k, v] of Object.entries(gd)) if (k !== "games" && !isNested(v)) day[underscore(k)] = v;
    for (const game of Array.isArray(gd.games) ? gd.games : []) {
      if (!isObj(game)) continue;
      const row: Row = { ...day };
      for (const [key, value] of Object.entries(game as Row)) {
        if (Array.isArray(value)) continue; // broadcasters / pointsLeaders
        if (isObj(value)) {
          for (const [k, v] of Object.entries(value)) if (!isNested(v)) row[nestedName(key, k)] = v;
        } else row[underscore(key)] = value;
      }
      const gid = row.game_id;
      const typeId = gid ? String(gid).slice(2, 3) : null;
      row.season_type_id = typeId;
      row.season_type_description = SEASON_TYPE_BY_ID[typeId ?? ""] ?? null;
      row.season = ls.seasonYear ?? null;
      row.league_id = ls.leagueId ?? null;
      rows.push(row);
    }
  }
  return setFromRowsSorted("SeasonGames", rows);
}

function resultSets(raw: Row): ResultSet[] {
  if (Array.isArray(raw.resultSets)) return raw.resultSets;
  if (isObj(raw.resultSets)) {
    if ("Meta" in raw.resultSets || "playlist" in raw.resultSets) return videoResultSets(raw.resultSets);
    return [raw.resultSets]; // shot-location family: one dict set with 2-level headers
  }
  if (isObj(raw.resultSet)) return [raw.resultSet];
  if (Array.isArray(raw.resultSet)) return raw.resultSet;
  if (isObj(raw.scoreboard) && Array.isArray(raw.scoreboard.games)) return [scoreboardResultSet(raw.scoreboard)];
  if (isObj(raw.leagueSchedule) && Array.isArray(raw.leagueSchedule.gameDates)) {
    return [leagueScheduleResultSet(raw.leagueSchedule)];
  }
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith("boxScore") && isObj(val)) return boxscoreV3ResultSets(val);
  }
  return [];
}

/** Flatten the shot-location endpoints' `[group, flat]` header pair into composite names. */
function flattenHeaders(headers: any): string[] {
  if (!Array.isArray(headers) || !headers.length || !isObj(headers[0])) return Array.isArray(headers) ? [...headers] : [];
  const [group, flatHdr] = headers;
  const flat: string[] = [...(flatHdr?.columnNames ?? [])];
  const skip = group.columnsToSkip ?? 0;
  const span = group.columnSpan ?? 1;
  const out = flat.slice(0, skip);
  let idx = skip;
  for (const grp of group.columnNames ?? []) {
    const prefix = String(grp).replace(/\./g, "").trim().replace(/ /g, "_");
    for (let i = 0; i < span; i++) if (idx < flat.length) out.push(`${prefix}_${flat[idx++]}`);
  }
  return out.concat(flat.slice(idx));
}

function toRows(rs: ResultSet): Row[] {
  const headers = flattenHeaders(rs.headers).map((h) => underscore(String(h)));
  if (!headers.length) return [];
  const rows = Array.isArray(rs.rowSet) ? rs.rowSet : [];
  const out: Row[] = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length !== headers.length) continue; // ragged rows dropped, as py
    const o: Row = {};
    headers.forEach((h, i) => {
      const c = r[i];
      o[h] = Array.isArray(c) ? c.map(String).join("|") : c;
    });
    out.push(o);
  }
  return idColumnsToStrings(out);
}

/**
 * Parse a stats.nba.com / stats.wnba.com response.
 *
 * @param raw Raw JSON body. Empty / malformed input returns `[]`, never throws.
 * @param resultSet When given, return only that named set (`[]` if absent, as sdv-py's zero-row
 *   frame). The flat wrappers pass `params.section` here (MULTI_TABLE_SECTIONS).
 * @returns Rows for a named or single set (a legit-empty set is `[]`: rows-as-objects cannot carry
 *   py's zero-row schema, so read `resultSets[i].headers` from the raw body for the column list); `{ [setName]: rows }` for several sets.
 */
export function parse_nba_stats_result_sets(
  raw: any,
  resultSet?: string
): Record<string, any>[] | Record<string, Record<string, any>[]> {
  if (!isObj(raw)) return [];
  let sets: ResultSet[];
  try {
    sets = resultSets(raw).filter(isObj);
  } catch {
    return [];
  }
  const frames: Record<string, Row[]> = {};
  sets.forEach((rs, i) => {
    // An own data property even for a set named `__proto__` (plain assignment would hit
    // the inherited setter and drop the frame); sdv-py's dict keeps every name.
    Object.defineProperty(frames, rs.name ?? `set_${i}`, {
      value: toRows(rs),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  });
  // sdv-py `result_set`: an unknown name is a zero-row frame there, `[]` here (never throws).
  if (resultSet != null) {
    return Object.prototype.hasOwnProperty.call(frames, resultSet) ? frames[resultSet] : [];
  }
  const names = Object.keys(frames);
  if (!names.length) return [];
  if (names.length === 1) return frames[names[0]];
  return frames;
}
