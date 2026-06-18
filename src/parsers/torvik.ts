// Parsers for BartTorvik / T-Rank (barttorvik.com) payloads. Faithful port of
// hoopR's torvik_*.R parsing. Universal flat-API parser contract (mirrors
// mlb.ts / mlb_statcast.ts):
//
//   - return an array of flat row objects (the JS analogue of a hoopR tibble);
//   - empty / malformed payloads return `[]` instead of throwing, so callers
//     can chain without null-checks;
//   - column keys are snake_cased.
//
// Five heterogeneous endpoints:
//   - ratings / team_factors: CSV WITH a header row -> header drives the columns
//     (snake_cased, the R `janitor::clean_names` equivalent);
//   - player_stats: a HEADERLESS CSV whose 67 positional columns are hardcoded
//     from Bart Torvik's standard player advanced-stats layout;
//   - game_stats / game_schedule: HEADERLESS JSON arrays-of-arrays whose 31 / 55
//     positional columns are hardcoded (nested per-game stat sub-arrays are
//     stringified, matching R's `paste(unlist(x), collapse=";")`).

import Papa from "papaparse";

/**
 * Clean a Torvik CSV header into a snake_case column name — a faithful port of
 * R's `janitor::clean_names` for these files. Crucially, `%` -> `_percent` and
 * `#` -> `_number` (so `eFG%` -> `e_fg_percent`, `OR%` -> `or_percent`, matching
 * hoopR's documented columns), then camelCase / non-alphanumeric boundaries are
 * split to `_`, runs collapsed, and the result lowercased.
 */
function cleanHeader(key: string): string {
  return String(key)
    .replace(/%/g, "_percent")
    .replace(/#/g, "_number")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2") // camelCase boundary (TeamName -> Team_Name)
    .replace(/[^A-Za-z0-9]+/g, "_") // any other punctuation/space run -> _
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/**
 * Clean every key of a row object (the tidy column transform). If two distinct
 * source headers normalize to the same snake_case key, the later ones are
 * suffixed `_2`, `_3`, … so no column is silently dropped — matching
 * `janitor::clean_names`' de-duplication (and PapaParse's own `Rk` -> `Rk_1`).
 */
function cleanKeys(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  const counts = new Map<string, number>();
  for (const [k, v] of Object.entries(row)) {
    const base = cleanHeader(k);
    let key = base;
    if (counts.has(base)) {
      let n = (counts.get(base) as number) + 1;
      while (`${base}_${n}` in out) n++;
      key = `${base}_${n}`;
      counts.set(base, n);
    } else {
      counts.set(base, 1);
    }
    out[key] = v;
  }
  return out;
}

/**
 * Parse CSV text that carries a header row into tidy rows. PapaParse de-dupes
 * repeated headers (`Rk`, `Rk_1`, ...) the way Torvik's interspersed rank
 * columns require; headers are then snake_cased. Empty / unparseable input
 * returns `[]`.
 */
function parseHeaderCsv(text: any): Record<string, any>[] {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = Papa.parse<Record<string, any>>(text, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((row) => cleanKeys(row));
}

/**
 * Parse headerless CSV text by applying a fixed positional column-name array.
 * Rows with more cells than names keep the extras under `field_<n>`; rows with
 * fewer cells than names still emit every column name, with the missing trailing
 * values set to `null`. Empty input returns `[]`.
 */
function parsePositionalCsv(text: any, cols: string[]): Record<string, any>[] {
  if (typeof text !== "string" || !text.trim()) return [];
  let parsed;
  try {
    parsed = Papa.parse<string[]>(text, {
      header: false,
      dynamicTyping: false,
      skipEmptyLines: true,
    });
  } catch {
    return [];
  }
  const data = parsed?.data;
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.map((arr) => positionalRow(Array.isArray(arr) ? arr : [], cols));
}

/** Build a row object from a positional array + a fixed column-name array. */
function positionalRow(arr: any[], cols: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  const n = Math.max(arr.length, cols.length);
  for (let i = 0; i < n; i++) {
    const name = i < cols.length ? cols[i] : `field_${i}`;
    let v = i < arr.length ? arr[i] : null;
    // Match R's `paste(unlist(x), collapse=";")`: collapse a nested array cell
    // (the per-game stat sub-array) to a ;-joined string so the row stays flat.
    if (Array.isArray(v)) v = v.map((x) => (x === null || x === undefined ? "" : x)).join(";");
    out[name] = v;
  }
  return out;
}

/**
 * Parse headerless JSON (array-of-arrays) text by applying a fixed positional
 * column-name array. Accepts either the raw JSON string or an already-parsed
 * array. Empty / unparseable input returns `[]`.
 */
function parsePositionalJson(input: any, cols: string[]): Record<string, any>[] {
  let rows = input;
  if (typeof input === "string") {
    if (!input.trim()) return [];
    try {
      rows = JSON.parse(input);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return rows.map((arr) => positionalRow(Array.isArray(arr) ? arr : [], cols));
}

// barttorvik's getgamestats.php is headerless; these are its 31 positional
// fields. Field 30 `game_stats` is a per-game stat blob — note Torvik ships it
// here ALREADY as a JSON-encoded STRING (not a live array), so it passes through
// verbatim; the {year}_super_sked.json `gamestats` field (below) IS a live array
// and gets `;`-joined by positionalRow. Both match R's per-field handling.
const GAME_STATS_COLS = [
  "date", "type", "team", "conf", "opp", "venue", "result", "adj_oe", "adj_de",
  "oe", "off_efg", "off_to", "off_or", "off_ftr", "de", "def_efg", "def_to",
  "def_or", "def_ftr", "game_score", "opp_conf", "quad", "year", "tempo",
  "muid", "coach", "opp_coach", "margin", "win_prob", "game_stats", "overtimes",
];

// barttorvik's getadvstats.php CSV is headerless; these are its 67 positional
// fields in Bart Torvik's standard player advanced-stats order.
const PLAYER_STATS_COLS = [
  "player_name", "team", "conf", "games", "min_pct", "o_rtg", "usage", "e_fg",
  "ts_pct", "orb_pct", "drb_pct", "ast_pct", "to_pct", "ftm", "fta", "ft_pct",
  "two_pm", "two_pa", "two_p_pct", "three_pm", "three_pa", "three_p_pct",
  "blk_pct", "stl_pct", "ftr", "class", "height", "number", "porpag", "adj_oe",
  "pfr", "year", "player_id", "hometown", "rec_rank", "ast_to", "rim_made",
  "rim_attempts", "mid_made", "mid_attempts", "rim_pct", "mid_pct", "dunks_made",
  "dunks_attempts", "dunks_pct", "pick", "drtg", "adrtg", "dporpag", "stops",
  "bpm", "obpm", "dbpm", "gbpm", "minutes", "ogbpm", "dgbpm", "oreb", "dreb",
  "treb", "ast", "stl", "blk", "pts", "role", "threat", "recruit_date",
];

// The 55 positional fields of barttorvik's {year}_super_sked.json (field 50
// `gamestats` is a nested per-game stat array — stringified).
const GAME_SCHEDULE_COLS = [
  "muid", "date", "conmatch", "matchup", "prediction", "ttq", "conf", "venue",
  "team1", "t1oe", "t1de", "t1py", "t1wp", "t1propt",
  "team2", "t2oe", "t2de", "t2py", "t2wp", "t2propt",
  "tpro", "t1qual", "t2qual", "gp", "result", "tempo", "possessions", "t1pts",
  "t2pts", "winner", "loser", "t1adjt", "t2adjt", "t1adjo", "t1adjd", "t2adjo",
  "t2adjd", "gamevalue", "mismatch", "blowout", "t1elite", "t2elite", "ord_date",
  "t1ppp", "t2ppp", "gameppp", "t1rk", "t2rk", "t1gs", "t2gs", "gamestats",
  "overtimes", "t1fun", "t2fun", "results",
];

/** Parse `torvik_ratings()` — one row per team (CSV with header, T-Rank). */
export function parse_torvik_ratings(text: any): Record<string, any>[] {
  return parseHeaderCsv(text);
}

/** Parse `torvik_team_factors()` — one row per team (CSV with header). */
export function parse_torvik_team_factors(text: any): Record<string, any>[] {
  return parseHeaderCsv(text);
}

/**
 * Parse `torvik_game_stats()` — one row per team-game. Headerless JSON
 * (`getgamestats.php?json=1`); the 31 positional columns are hardcoded.
 */
export function parse_torvik_game_stats(input: any): Record<string, any>[] {
  return parsePositionalJson(input, GAME_STATS_COLS);
}

/**
 * Parse `torvik_player_stats()` — one row per player. Headerless CSV
 * (`getadvstats.php?csv=1`); the 67 positional columns are hardcoded.
 */
export function parse_torvik_player_stats(text: any): Record<string, any>[] {
  return parsePositionalCsv(text, PLAYER_STATS_COLS);
}

/**
 * Parse `torvik_game_schedule()` — one row per game. Headerless JSON
 * (`{year}_super_sked.json`); the 55 positional columns are hardcoded.
 */
export function parse_torvik_game_schedule(input: any): Record<string, any>[] {
  return parsePositionalJson(input, GAME_SCHEDULE_COLS);
}
