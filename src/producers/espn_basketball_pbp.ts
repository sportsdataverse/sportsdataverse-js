// ESPN basketball PBP producers (NBA / WNBA / MBB / WBB): one game's ESPN summary payload
// -> py's cleaned game dict (`plays` rows, `timeouts`, the raw summary keys passed through).
//
// Faithful port of sdv-py, pinned at 313587306d1031b0da46f5e1fef85dbaf5728200 (includes #688):
// `{nba,wnba,mbb,wbb}/<lg>_pbp.py` -- `helper_<lg>_pbp(game_id, pbp_txt)` and its stages
// `helper_<lg>_pickcenter` -> `helper_<lg>_game_data` -> `helper_<lg>_pbp_features`, plus the
// key trimming `espn_<lg>_pbp` applies to the fetched summary before calling the helper, and
// the pieces the four share (`_espn_basketball_pbp.py`: `pickcenter_odds`, `team_timeout_called`).
//
// Shared (all four leagues):
//   pickcenter  read whenever some provider carries a spread (one provider is enough), in
//               str(provider.id) order; the spread and the home favorite come from the SAME row
//               (the first with a spread): favorite = spread < 0, or that row's own flag for a
//               spread of 0 (home when unset). Over/under = the first non-null one. No spread
//               anywhere: the defaults (2.5, home, unavailable). Values are plain scalars.
//   timeouts    a team-timeout type (RegularTimeOut, ShortTimeOut, Full / Short / No / Reset
//               Timeout; official / TV timeouts excluded) credited to the play's own `team.id`;
//               a play without one falls back to the team's abbreviation / location / mascot /
//               alt name as a whole word in the text (case-insensitive).
//
// Per-league facts, from diffing the four modules against each other:
//   NBA   quarters always (no era logic). Seconds ladders 720 / 1440 / 2160 / 2880, OT 300.
//         Arithmetic `K + 60*m + s` = ((K + 60m) + s). The clock gets a "0:" prefix when it has
//         no colon; minutes / seconds are Float32. season / team ids `.cast(Int32)`. Timeouts
//         split at period <= 2. pickcenter over/under default 215.5. Keeps `seasonseries`.
//   WNBA  era-aware: `format.regulation.periods` (2 = halves, 4 = quarters) is authoritative,
//         else season year < 2006 = halves. Quarters: ladders 600 / 1200 / 1800 / 2400, OT
//         300, arithmetic `K + (60m + s)`. Halves (period IS the half): ladders 1200 / 2400, OT
//         300 from period 3, half = period. Timeouts split at the first-half period count (1
//         or 2). "0:" prefix + Float32 clock; ids cast Int32; over/under 165.5; keeps
//         `seasonseries`.
//   WBB   WNBA's code with a 2016 season-year cutoff, season / team ids NOT cast, over/under
//         130.5, no `seasonseries`, `gameId` = int(game_id).
//   MBB   halves always, its own column set: `half` = period, `lag_period` / `lead_period`,
//         `start.period_seconds_remaining` / `end.period_seconds_remaining` (no qtr / game_half
//         / period / quarter columns). The clock is split with a "0:" prefix when it has no
//         colon ("23.4" -> 0:23; `time` / `clock.displayValue` keep the display as is) and cast
//         Float64 -> Int32 (truncating). Ladders 1200 / 2400, OT 300; `end.period_seconds_remaining`
//         and `end.game_seconds_remaining` both reset to 300 at every OT. Timeouts split at
//         period <= 1. Over/under 142.0; ids not cast; `gameId` = int(game_id).
//   NCAA (MBB/WBB) `espn_<lg>_pbp` defaults the ARRAY keys (plays, videos, ...) to {} and the
//         dict keys to [] -- py's (swapped) dict_keys_expected, kept as is.
//
// Output (py `to_dicts()` / dict), PURE (no network; `espn_<lg>_pbp` takes the summary fetcher
// injected -- src/index.ts passes the generated `espn_<lg>_summary`): `plays` is `Row[]` with
// py's column names (dotted, e.g. `end.half_seconds_remaining`) in py's order; `[]` when py's frame is empty. The other keys are
// the summary's own values (np.array(x).tolist() is the identity on ESPN's lists of objects /
// dicts; a list of scalars, which numpy would coerce, is passed through unchanged -- ESPN ships
// none). `header.competitions[0]` gains `home` / `away` (py mutates it; `teamInfo` IS that
// object). Inputs are never mutated here: the touched header path is copied.
//
// dtypes (py polars -> JS): Int32 / UInt32 -> number; Float32 -> number rounded to float32 at
// every arithmetic step exactly as polars computes it (Math.fround); Float64 -> number; String;
// Boolean; Int64 -> number (safe integers: scores, coordinates). Id columns follow the id rule
// (`applyInt64Policy`, src/core/int64.ts; owner decision 2026-10-05): the play `id` (Int64,
// parsed exactly), `game_id`, `homeTeamId` / `awayTeamId` (Int32 or py int) and the result's
// top-level `gameId` are decimal STRINGS in every game of every era (ESPN's college play ids are
// 12-13 digits through 2013 and 18 digits from 2014-15, beyond 2^53), as the release loaders
// return them. The timeouts lists hold the same id strings. The stage helpers' `init` dict
// (`helper_<lg>_game_data`) stays py-faithful. No py column is a date / datetime (`wallclock` is a String in py, kept so).
//
// Every lag / lead / row-number op runs per `game_id` (py's frames are single-game; here a
// concatenated frame never leaks across games -- see the test).
//
// Known ceilings (not reproduced): a JSON object key that is an integer string is reordered by
// JS; a numeric `provider.id` column that pandas holds as Float64 (ints mixed with a missing id)
// reads "45.0" in py's str sort, "45" here (ESPN ships string ids); `timeouts` keys are strings
// (py: int) and JS orders integer keys ascending; int-vs-float is invisible in JS (py
// `-1 * abs(0)` is int 0, here -0).

import { idColumnsToStrings } from "../core/int64.js";
import { applyInt64Policy } from "../core/releases.js";
import { isObj, or, pyEqTrue, PY_FLOAT, PY_INT, truthy, type Row } from "./espn_basketball_box.js";

export type { Row };
export type League = "nba" | "wnba" | "mbb" | "wbb";

// ---------------------------------------------------------------------------
// Python semantics
// ---------------------------------------------------------------------------

function fail(kind: string, msg: string): never {
  throw new Error(`${kind}: ${msg}`);
}

const has = (o: unknown, k: string): boolean => isObj(o) && Object.prototype.hasOwnProperty.call(o, k);

/** py `o[k]` (KeyError / IndexError / TypeError -> throw). */
function at(o: unknown, k: string | number): any {
  if (typeof k === "number") {
    if (Array.isArray(o) && k < o.length) return o[k];
  } else if (has(o, k)) return (o as Record<string, unknown>)[k];
  return fail(typeof k === "number" ? "IndexError" : "KeyError", String(k));
}

/** py `dict.get(k)` (AttributeError on a non-dict). */
function pyGet(o: unknown, k: string): any {
  if (!isObj(o)) fail("AttributeError", `.get('${k}') on a non-dict`);
  return has(o, k) ? o[k] : null;
}

/** py `int(x)`. */
function pyInt(v: unknown): number {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v) || 0;
  if (typeof v === "string" && PY_INT.test(v.trim())) return Number(v.trim().replace(/_/g, ""));
  return fail("ValueError", `int(${String(v)})`);
}

/** py `float(x)`. */
function pyFloat(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string" && PY_FLOAT.test(v.trim())) {
    const s = v.trim().replace(/_/g, "").toLowerCase();
    if (/^[+-]?nan$/.test(s)) return NaN;
    if (/^[+-]?inf(inity)?$/.test(s)) return s.startsWith("-") ? -Infinity : Infinity;
    return Number(s);
  }
  return fail("ValueError", `float(${String(v)})`);
}

/** py `abs(x)` (a str / None raises; numpy applies it per element). */
function pyAbs(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(pyAbs);
  if (typeof v === "number") return Math.abs(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  return fail("TypeError", `bad operand type for abs(): ${String(v)}`);
}

/** py `str(x)` for JSON scalars. */
function pyStr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  return String(v);
}

/** `np.asarray(x).reshape(-1)[0]`. */
function first(v: unknown): unknown {
  while (Array.isArray(v)) {
    if (!v.length) fail("IndexError", "index 0 is out of bounds");
    v = v[0];
  }
  return v;
}

// ---------------------------------------------------------------------------
// polars semantics: strict casts (a failed cast raises InvalidOperationError)
// ---------------------------------------------------------------------------

const POLARS_INT = /^[+-]?\d+$/;
const POLARS_FLOAT = /^[+-]?(?:inf|infinity|nan|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/i;
const I64_MIN = -(2n ** 63n);
const I64_MAX = 2n ** 63n - 1n;

const badCast = (v: unknown, to: string): never => fail("InvalidOperationError", `conversion to ${to} failed: ${String(v)}`);

/** `cast(pl.Int32)`: ints in range; floats truncate; NaN / inf / out of range / bad strings raise. */
function castInt32(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  let n = NaN;
  if (typeof v === "number" && Number.isFinite(v)) n = Math.trunc(v) || 0;
  else if (typeof v === "string" && POLARS_INT.test(v)) n = Number(v) || 0;
  return n >= -(2 ** 31) && n <= 2 ** 31 - 1 ? n : badCast(v, "i32");
}

/** `cast(pl.Int64)` as an exact BigInt (the INT64 policy then makes the `id` column decimal strings). */
function castInt64(v: unknown): bigint | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1n : 0n;
  // A JS number past 2^53 was already rounded before it got here (py's ints are
  // exact, so py never sees this): refuse it rather than emit a wrong id.
  if (typeof v === "number" && Number.isInteger(v) && !Number.isSafeInteger(v)) {
    throw new TypeError(
      `integer ${v} is beyond Number.MAX_SAFE_INTEGER and has lost precision; pass 64-bit ids as decimal strings (as ESPN's JSON does)`
    );
  }
  if (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 2 ** 63) return BigInt(Math.trunc(v));
  if (typeof v === "string" && POLARS_INT.test(v)) {
    const b = BigInt(v);
    if (b >= I64_MIN && b <= I64_MAX) return b;
  }
  return badCast(v, "i64");
}

/** `cast(pl.Float64)` (Rust float grammar: no whitespace / `_`; inf, nan case-insensitive). */
function castFloat64(v: unknown, to = "f64"): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v !== "string" || !POLARS_FLOAT.test(v)) return badCast(v, to);
  const s = v.toLowerCase();
  if (s.endsWith("nan")) return NaN;
  if (s.endsWith("inf") || s.endsWith("infinity")) return s.startsWith("-") ? -Infinity : Infinity;
  return Number(s);
}

/** `cast(pl.Float32)`. */
function castFloat32(v: unknown): number | null {
  const x = castFloat64(v, "f32");
  return x === null ? null : Math.fround(x);
}

const f32 = Math.fround;

// ---------------------------------------------------------------------------
// A minimal polars frame: ordered columns + rows (with_columns replaces in place / appends)
// ---------------------------------------------------------------------------

/** @internal A frame: `cols` in order; `rows` keyed by column (missing key = null). */
export interface Frame {
  cols: string[];
  rows: Row[];
}

function col(f: Frame, c: string): any[] {
  if (!f.cols.includes(c)) fail("ColumnNotFoundError", `unable to find column "${c}"`);
  return f.rows.map((r) => r[c] ?? null);
}

/** A column polars holds as String (`.str` ops / `== "str"` raise on any other dtype). */
function strCol(f: Frame, c: string): (string | null)[] {
  const v = col(f, c);
  if (v.some((x) => x !== null && typeof x !== "string")) fail("InvalidOperationError", `expected String type: "${c}"`);
  return v;
}

/** `with_columns`: every value is computed against the input frame BEFORE this is called. */
function withColumns(f: Frame, entries: [string, unknown[]][]): void {
  for (const [c, vals] of entries) {
    if (!f.cols.includes(c)) f.cols.push(c);
    f.rows.forEach((r, i) => {
      r[c] = vals[i];
    });
  }
}

const newRow = (): Row => Object.create(null);

/** Per-game `shift(1)` (lag) / `shift(-1)` (lead): never reads across a `game_id` boundary. */
function shiftByGame(f: Frame, vals: unknown[], n: 1 | -1): unknown[] {
  const games = col(f, "game_id");
  const out: unknown[] = new Array(vals.length).fill(null);
  const idx = [...vals.keys()];
  const prev = new Map<unknown, number>();
  for (const i of n === 1 ? idx : idx.reverse()) {
    const g = games[i];
    if (prev.has(g)) out[i] = vals[prev.get(g)!];
    prev.set(g, i);
  }
  return out;
}

/** Per-game `with_row_index("game_play_number", offset=1)` (prepended, UInt32). */
function rowIndexByGame(f: Frame): void {
  if (f.cols.includes("game_play_number")) fail("DuplicateError", "column 'game_play_number' already exists");
  const seen = new Map<unknown, number>();
  const games = col(f, "game_id");
  f.rows.forEach((r, i) => {
    const k = (seen.get(games[i]) ?? 0) + 1;
    seen.set(games[i], k);
    r.game_play_number = k;
  });
  f.cols.unshift("game_play_number");
}

/** `clock.displayValue.str.split(":").list.to_struct(upper_bound=2)` -> rename -> unnest. */
function unnestClock(f: Frame, display: (string | null)[]): void {
  for (const c of ["clock.minutes", "clock.seconds"]) {
    if (f.cols.includes(c)) fail("DuplicateError", `column with name '${c}' has more than one occurrence`);
  }
  const parts = display.map((d) => (d === null ? [null, null] : d.split(":")));
  f.rows.forEach((r, i) => {
    r["clock.minutes"] = parts[i][0] ?? null;
    r["clock.seconds"] = parts[i][1] ?? null;
    delete r["clock.mm"];
  });
  const pos = f.cols.indexOf("clock.mm");
  if (pos >= 0) f.cols.splice(pos, 1, "clock.minutes", "clock.seconds");
  else f.cols.push("clock.minutes", "clock.seconds");
}

// ---------------------------------------------------------------------------
// League facts
// ---------------------------------------------------------------------------

interface Facts {
  lg: League;
  /** `espn_<lg>_pbp` incoming_keys_expected (kept, in order). */
  keys: readonly string[];
  /** dict_keys_expected: an absent key defaults to {} (else []). */
  dictKeys: ReadonlySet<string>;
  /** pickcenter over/under default. */
  overUnder: number;
  /** season / homeTeamId / awayTeamId `.cast(pl.Int32)` (NBA, WNBA). */
  castIds: boolean;
  /** `gameId` = int(game_id) (MBB, WBB). */
  gameIdInt: boolean;
  /** play-feature variant. */
  plays: "nba" | "wnba" | "mbb";
  /** WNBA / WBB: season year below this = halves era (when the format is silent). */
  halvesBefore: number;
}

const PRO_KEYS = [
  "boxscore", "format", "gameInfo", "leaders", "seasonseries", "broadcasts", "predictor", "pickcenter",
  "againstTheSpread", "odds", "winprobability", "header", "plays", "article", "videos", "standings", "teamInfo",
  "espnWP", "season", "timeouts",
] as const;
const NCAA_KEYS = PRO_KEYS.filter((k) => k !== "seasonseries");
const PRO_DICT = new Set(["boxscore", "format", "gameInfo", "predictor", "article", "header", "season", "standings"]);
const NCAA_DICT = new Set([
  "plays", "videos", "broadcasts", "pickcenter", "againstTheSpread", "odds", "winprobability", "teamInfo", "espnWP",
  "leaders",
]);

const FACTS: Record<League, Facts> = {
  nba: { lg: "nba", keys: PRO_KEYS, dictKeys: PRO_DICT, overUnder: 215.5, castIds: true, gameIdInt: false, plays: "nba", halvesBefore: 0 },
  wnba: { lg: "wnba", keys: PRO_KEYS, dictKeys: PRO_DICT, overUnder: 165.5, castIds: true, gameIdInt: false, plays: "wnba", halvesBefore: 2006 },
  mbb: { lg: "mbb", keys: NCAA_KEYS, dictKeys: NCAA_DICT, overUnder: 142.0, castIds: false, gameIdInt: true, plays: "mbb", halvesBefore: 0 },
  wbb: { lg: "wbb", keys: NCAA_KEYS, dictKeys: NCAA_DICT, overUnder: 130.5, castIds: false, gameIdInt: true, plays: "wnba", halvesBefore: 2016 },
};

// ---------------------------------------------------------------------------
// helper_<lg>_pickcenter
// ---------------------------------------------------------------------------

/** pandas `nested_to_record`: dicts flatten to dotted keys (an empty dict vanishes); lists stay. */
function nestedToRecord(d: Record<string, unknown>, prefix = "", out: Row = newRow()): Row {
  for (const [k, v] of Object.entries(d)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isObj(v)) nestedToRecord(v, key, out);
    else out[key] = v;
  }
  return out;
}

/** pandas `astype(str)` of a `provider.id` cell: an absent id is NaN -> "nan", a null one "None". */
const providerKey = (v: unknown): string => (v === undefined ? "nan" : pyStr(v));

/**
 * The spread / over-under / home-favorite metadata (py `helper_<lg>_pickcenter` ->
 * `_espn_basketball_pbp.pickcenter_odds`): providers in str(provider.id) order (teamrankings
 * "1002" ahead of consensus "1004" and Caesars "45"); the spread and the home favorite from the
 * same row, the first with a spread; the first non-null over/under.
 */
function pickcenter(pbp_txt: any, facts: Facts): Record<string, unknown> {
  // pd.json_normalize(pbp_txt.get("pickcenter") or []): a dict is one record
  const pc = or(pyGet(pbp_txt, "pickcenter"), []);
  if (!Array.isArray(pc) && !isObj(pc)) fail("TypeError", "pickcenter is not a list of dicts");
  const recs = (Array.isArray(pc) ? pc : [pc]).map((e) => (isObj(e) ? nestedToRecord(e) : fail("TypeError", "pickcenter entry is not a dict")));
  const val = (r: Row, c: string): unknown => r[c] ?? null;
  if (!recs.some((r) => val(r, "spread") !== null)) {
    return { gameSpread: 2.5, overUnder: facts.overUnder, homeFavorite: true, gameSpreadAvailable: false };
  }
  const byId = recs.some((r) => "provider.id" in r);
  // sort_values(key=astype(str), kind="stable"); JS sort is stable
  const sorted = byId ? [...recs].sort((a, b) => cmpStr(providerKey(a["provider.id"]), providerKey(b["provider.id"]))) : recs;
  const row = sorted.find((r) => val(r, "spread") !== null) as Row;
  const spread = pyFloat(row.spread);
  // ESPN's spread is the home team's line: negative = home favorite; a pick'em takes the row's flag
  const fav = val(row, "homeTeamOdds.favorite");
  const homeFavorite = spread !== 0 ? spread < 0 : fav === null ? true : truthy(fav);
  const ou = sorted.find((r) => val(r, "overUnder") !== null);
  return {
    gameSpread: spread,
    overUnder: ou ? pyFloat(ou.overUnder) : facts.overUnder,
    homeFavorite,
    gameSpreadAvailable: true,
  };
}

/** Python str comparison (code point order). */
const cmpStr = (a: string, b: string): number => (a === b ? 0 : a < b ? -1 : 1);

// ---------------------------------------------------------------------------
// helper_<lg>_game_data
// ---------------------------------------------------------------------------

/** Home / away identification + the spread fields (py `helper_<lg>_game_data`). */
function gameData(pbp_txt: any, init: Record<string, any>): [Record<string, any>, Record<string, any>] {
  const header = at(pbp_txt, "header");
  const comps = at(header, "competitions");
  const comp0 = { ...at(comps, 0) } as Record<string, any>; // copy: py mutates it (home / away)
  const out: Record<string, any> = { ...pbp_txt, header: { ...header, competitions: [comp0, ...(comps as any[]).slice(1)] } };
  out.timeouts = {};
  out.teamInfo = comp0;
  out.season = at(header, "season");
  out.playByPlaySource = at(comp0, "playByPlaySource");
  out.boxscoreSource = at(comp0, "boxscoreSource");
  out.gameSpreadAvailable = at(init, "gameSpreadAvailable");
  out.gameSpread = at(init, "gameSpread");
  out.homeFavorite = at(init, "homeFavorite");
  // np.where(homeFavorite == True, abs(gameSpread), -1 * abs(gameSpread))
  const fav = init.homeFavorite;
  const spread = pyAbs(init.gameSpread);
  const pick = (f: unknown, s: unknown): unknown => (pyEqTrue(f) ? s : -1 * (s as number));
  out.homeTeamSpread = Array.isArray(fav) || Array.isArray(spread) ? [pick(first(fav), first(spread))] : pick(fav, spread);
  out.overUnder = at(init, "overUnder");

  const competitors = at(comp0, "competitors");
  const side = (c: any) => {
    const team = at(c, "team");
    const name = pyStr(at(team, "location"));
    return {
      team,
      id: pyInt(at(team, "id")),
      mascot: pyStr(at(team, "name")),
      name,
      abbrev: pyStr(at(team, "abbreviation")),
      alt: name.replace(/Stat([^\n]+)/g, "St"), // re.sub("Stat(.+)", "St", name)
    };
  };
  const c0 = at(competitors, 0);
  let home;
  let away;
  if (at(c0, "homeAway") === "home") {
    home = side(c0);
    comp0.home = home.team;
    away = side(at(competitors, 1));
    comp0.away = away.team;
  } else {
    away = side(c0);
    comp0.away = away.team;
    home = side(at(competitors, 1));
    comp0.home = home.team;
  }
  const next = {
    ...init,
    homeTeamId: home.id,
    homeTeamMascot: home.mascot,
    homeTeamName: home.name,
    homeTeamAbbrev: home.abbrev,
    homeTeamNameAlt: home.alt,
    awayTeamId: away.id,
    awayTeamMascot: away.mascot,
    awayTeamName: away.name,
    awayTeamAbbrev: away.abbrev,
    awayTeamNameAlt: away.alt,
  };
  return [out, next];
}

// ---------------------------------------------------------------------------
// helper_<lg>_pbp_features
// ---------------------------------------------------------------------------

/** sdv-py `dl_utils.flatten_json_iterative` (one level per pass; dict() keeps a key's first slot). */
function flattenIterative(d: Record<string, unknown>): Row {
  let cur: [string, unknown][] = Object.entries(d);
  for (;;) {
    const next = new Map<string, unknown>();
    for (const [k, v] of cur) {
      if (isObj(v)) for (const [k2, v2] of Object.entries(v)) next.set(`${k}.${k2}`, v2);
      else if (Array.isArray(v)) v.forEach((x, i) => next.set(`${k}.${i}`, x));
      else next.set(k, v);
    }
    cur = [...next];
    if (!cur.some(([, v]) => isObj(v) || Array.isArray(v))) break;
  }
  const row = newRow();
  for (const [k, v] of cur) row[k] = v;
  return row;
}

/** `pl.from_pandas(pd.json_normalize(pbp_txt, "plays_mod"))` over the flattened plays. */
function normalizePlays(plays: unknown): Frame {
  // `for play in pbp_txt["plays"]`: a dict iterates its keys (strings -> flatten raises).
  if (isObj(plays) && !Object.keys(plays).length) plays = [];
  if (!Array.isArray(plays)) return fail("TypeError", "plays is not a list of dicts");
  const rows = plays.map((p) => (isObj(p) ? flattenIterative(p) : fail("AttributeError", "a play is not a dict")));
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) if (!seen.has(k)) seen.add(k), cols.push(k);
  // pandas -> arrow: a column mixing str / number / bool raises (int + float is Float64).
  for (const c of cols) {
    const kinds = new Set(rows.map((r) => r[c]).filter((v) => v !== null && v !== undefined).map((v) => typeof v));
    if (kinds.size > 1) fail("TypeError", `column "${c}" mixes ${[...kinds].join(" / ")}`);
  }
  return { cols, rows };
}

/**
 * @internal Stage A of `helper_<lg>_pbp_features`: the plays frame + py's first two
 * `with_columns` (game / team / spread literals, `id` / `sequenceNumber` casts, `homeTeamSpread`).
 */
export function _playsFrame(league: League, game_id: unknown, pbp_txt: any, init: any): Frame {
  const facts = FACTS[league];
  const header = at(pbp_txt, "header");
  const seasonInfo = at(header, "season");
  const year = at(seasonInfo, "year");
  const seasonType = at(seasonInfo, "type");
  const lit = (v: unknown) => (facts.castIds ? castInt32(v) : v);
  const spread = Math.abs(pyFloat(first(at(init, "gameSpread"))));
  const favorite = truthy(first(at(init, "homeFavorite")));
  const f = normalizePlays(at(pbp_txt, "plays"));
  const n = f.rows.length;
  const fill = (v: unknown) => new Array(n).fill(v);
  withColumns(f, [
    ["game_id", fill(castInt32(game_id))],
    ["id", col(f, "id").map(castInt64)],
    ["sequenceNumber", col(f, "sequenceNumber").map(castInt32)],
    ["season", fill(lit(year))],
    ["seasonType", fill(seasonType)],
    ["homeTeamId", fill(lit(at(init, "homeTeamId")))],
    ["homeTeamName", fill(at(init, "homeTeamName"))],
    ["homeTeamMascot", fill(at(init, "homeTeamMascot"))],
    ["homeTeamAbbrev", fill(at(init, "homeTeamAbbrev"))],
    ["homeTeamNameAlt", fill(at(init, "homeTeamNameAlt"))],
    ["awayTeamId", fill(lit(at(init, "awayTeamId")))],
    ["awayTeamName", fill(at(init, "awayTeamName"))],
    ["awayTeamMascot", fill(at(init, "awayTeamMascot"))],
    ["awayTeamAbbrev", fill(at(init, "awayTeamAbbrev"))],
    ["awayTeamNameAlt", fill(at(init, "awayTeamNameAlt"))],
    ["gameSpread", fill(spread)],
    ["homeFavorite", fill(favorite)],
    ["gameSpreadAvailable", fill(at(init, "gameSpreadAvailable"))],
  ]);
  withColumns(f, [["homeTeamSpread", f.rows.map((r) => (r.homeFavorite === true ? r.gameSpread : -1 * r.gameSpread))]]);
  return f;
}

/** ESPN play types for a timeout a team called (py `TEAM_TIMEOUT_TYPES`; official / TV timeouts are no team's). */
const TEAM_TIMEOUT_TYPES = new Set(["RegularTimeOut", "ShortTimeOut", "Full Timeout", "Short Timeout", "No Timeout", "Reset Timeout"]);
/** Rust regex's Unicode `\W` (JS `\W` is ASCII-only, even with the `u` flag). */
const NON_WORD = "[^\\p{Alphabetic}\\p{M}\\p{Nd}\\p{Pc}\\p{Join_Control}]";
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** `team.id` `cast(pl.Int64, strict=False)`: an unparseable id is null. */
function teamIdOrNull(v: unknown): bigint | null {
  try {
    return castInt64(v);
  } catch {
    return null; // ponytail: castInt64's refusals (bad string, unsafe number) all mean null here
  }
}

/**
 * py `team_timeout_called(columns, init, side)`: a team-timeout play the side's team called. The
 * play's own `team.id` decides; only a play without one falls back to the side's abbreviation /
 * location / mascot / alt name as a whole word in the text (case-insensitive).
 */
function timeoutFlags(f: Frame, init: any, side: "home" | "away"): boolean[] {
  const typeText = strCol(f, "type.text");
  const sideId = BigInt(at(init, `${side}TeamId`));
  const teamIds = f.cols.includes("team.id") ? col(f, "team.id").map(teamIdOrNull) : typeText.map(() => null);
  const names = new Set(["Abbrev", "Name", "Mascot", "NameAlt"].map((k) => pyStr(at(init, `${side}Team${k}`))));
  names.delete("");
  names.delete("None");
  let byName: (boolean | null)[] = typeText.map(() => false);
  if (names.size) {
    const re = new RegExp(`(?:^|${NON_WORD})(?:${[...names].map(escapeRe).join("|")})(?:${NON_WORD}|$)`, "iu");
    byName = strCol(f, "text").map((t) => (t === null ? null : re.test(t)));
  }
  return typeText.map(
    (t, i) => t !== null && TEAM_TIMEOUT_TYPES.has(t) && (teamIds[i] !== null ? teamIds[i] === sideId : byName[i] === true),
  );
}

/** Is the WNBA / WBB game in the halves era (py: format first, season-year fallback)? */
function halvesEra(pbp_txt: any, facts: Facts): boolean {
  const fmt = has(pbp_txt, "format") ? pbp_txt.format : null;
  const reg = isObj(fmt) ? pyGet(or(pyGet(fmt, "regulation"), {}), "periods") : null;
  if (reg === 2 || reg === 4) return reg === 2;
  return pyInt(at(at(at(pbp_txt, "header"), "season"), "year")) < facts.halvesBefore;
}

/** Which py feature chain runs, and (WNBA / WBB) whether the game is in the halves era. */
interface Variant {
  plays: Facts["plays"];
  /** WNBA / WBB halves era. */
  halves: boolean;
}

/** @internal The variant `helper_<lg>_pbp_features` uses for this payload. */
export function _variant(league: League, pbp_txt: any): Variant {
  const facts = FACTS[league];
  return { plays: facts.plays, halves: facts.plays === "wnba" ? halvesEra(pbp_txt, facts) : facts.plays === "mbb" };
}

const eq = (a: unknown, b: unknown): boolean => a !== null && a !== undefined && a === b;
/** `(lag == period - 1) & (period >= from)` -- an overtime boundary. */
const otStart = (lag: unknown, p: unknown, from: number): boolean => typeof p === "number" && lag === p - 1 && p >= from;

/** NBA / WNBA / WBB features after stage A (py's `with_columns` chain from the clock on). */
function proFeatures(f: Frame, init: any, v: Variant): void {
  const nba = v.plays === "nba";
  const q = nba ? 720 : 600; // quarter length
  const pn = col(f, "period.number").map(castInt32);
  const display = strCol(f, "clock.displayValue").map((d) => (d === null || d.includes(":") ? d : `0:${d}`));
  withColumns(f, [["period.number", pn], ["qtr", pn], ["clock.displayValue", display]]);
  withColumns(f, [["time", display]]);
  unnestClock(f, display);
  withColumns(f, [
    ["clock.minutes", col(f, "clock.minutes").map(castFloat32)],
    ["clock.seconds", col(f, "clock.seconds").map(castFloat32)],
    ["homeTimeoutCalled", timeoutFlags(f, init, "home")],
    ["awayTimeoutCalled", timeoutFlags(f, init, "away")],
  ]);
  const qtr = col(f, "qtr");
  const firstHalf = v.halves ? 1 : 2;
  const half = qtr.map((x) => (x !== null && x <= firstHalf ? 1 : 2));
  withColumns(f, [["half", half], ["game_half", half]]);
  withColumns(f, [
    ["lag_qtr", shiftByGame(f, qtr, 1)],
    ["lead_qtr", shiftByGame(f, qtr, -1)],
    ["lag_half", shiftByGame(f, half, 1)],
    ["lead_half", shiftByGame(f, half, -1)],
  ]);
  // Float32 at every step. NBA: `K + 60*m + s` = ((K + 60m) + s); WNBA / WBB: K + (60m + s).
  const m = col(f, "clock.minutes");
  const s = col(f, "clock.seconds");
  const sixty = (i: number) => f32(60 * m[i]);
  const clockSec = (i: number) => (m[i] === null || s[i] === null ? null : f32(sixty(i) + s[i]));
  const plus = (k: number, i: number) => {
    if (m[i] === null || s[i] === null) return null;
    return nba ? f32(f32(k + sixty(i)) + s[i]) : f32(k + (clockSec(i) as number));
  };
  const idx = [...qtr.keys()];
  const startQ = idx.map(clockSec);
  const startH = v.halves ? startQ : idx.map((i) => (qtr[i] === 1 || qtr[i] === 3 ? plus(q, i) : clockSec(i)));
  const startG = v.halves
    ? idx.map((i) => (qtr[i] === 1 ? plus(1200, i) : clockSec(i)))
    : idx.map((i) => (qtr[i] === 1 ? plus(3 * q, i) : qtr[i] === 2 ? plus(2 * q, i) : qtr[i] === 3 ? plus(q, i) : clockSec(i)));
  withColumns(f, [
    ["start.quarter_seconds_remaining", startQ],
    ["start.half_seconds_remaining", startH],
    ["start.game_seconds_remaining", startG],
  ]);
  withColumns(f, [
    ["end.quarter_seconds_remaining", shiftByGame(f, startQ, -1)],
    ["end.half_seconds_remaining", shiftByGame(f, startH, -1)],
    ["end.game_seconds_remaining", shiftByGame(f, startG, -1)],
  ]);
  rowIndexByGame(f);

  const endQ: unknown[] = [];
  const endH: unknown[] = [];
  const endG: unknown[] = [];
  for (const r of f.rows) {
    const [g1, p, lag] = [r.game_play_number === 1, r["period.number"], r.lag_qtr];
    const step = (a: number, b: number) => eq(lag, a) && eq(p, b);
    if (v.halves) {
      endQ.push(g1 || step(1, 2) ? 1200 : otStart(lag, p, 3) ? 300 : r["end.quarter_seconds_remaining"]);
      endH.push(g1 || (eq(r.lag_half, 1) && eq(r.half, 2)) ? 1200 : otStart(lag, p, 3) ? 300 : r["end.half_seconds_remaining"]);
      endG.push(g1 ? 2400 : step(1, 2) ? 1200 : otStart(lag, p, 3) ? 300 : r["end.game_seconds_remaining"]);
    } else {
      endQ.push(g1 || step(1, 2) || step(2, 3) || step(3, 4) ? q : otStart(lag, p, 5) ? 300 : r["end.quarter_seconds_remaining"]);
      endH.push(
        g1 || (eq(r.lag_half, 1) && eq(r.half, 2)) ? 2 * q
          : step(1, 2) ? q : step(2, 3) ? 2 * q : step(3, 4) ? q : otStart(lag, p, 5) ? 300 : r["end.half_seconds_remaining"],
      );
      endG.push(
        g1 ? 4 * q : step(1, 2) ? 3 * q : step(2, 3) ? 2 * q : step(3, 4) ? q : otStart(lag, p, 5) ? 300 : r["end.game_seconds_remaining"],
      );
    }
  }
  withColumns(f, [
    ["end.quarter_seconds_remaining", endQ],
    ["end.half_seconds_remaining", endH],
    ["end.game_seconds_remaining", endG],
    ["period", col(f, "qtr")],
  ]);
}

/** `cast(pl.Float64).cast(pl.Int32)`: parse, then truncate (NaN / inf / out of range raise). */
const castInt32ViaF64 = (v: unknown): number | null => castInt32(castFloat64(v));

/** MBB features after stage A (halves; Int32 clock, a bare-seconds clock read as 0:ss). */
function mbbFeatures(f: Frame, init: any): void {
  const pn = col(f, "period.number").map(castInt32);
  const display = strCol(f, "clock.displayValue");
  withColumns(f, [["period.number", pn], ["half", pn], ["time", display]]);
  // the "0:" prefix feeds the split only; `clock.displayValue` / `time` keep the display
  unnestClock(f, display.map((d) => (d === null || d.includes(":") ? d : `0:${d}`)));
  withColumns(f, [
    ["clock.minutes", col(f, "clock.minutes").map(castInt32ViaF64)],
    ["clock.seconds", col(f, "clock.seconds").map(castInt32ViaF64)],
    ["homeTimeoutCalled", timeoutFlags(f, init, "home")],
    ["awayTimeoutCalled", timeoutFlags(f, init, "away")],
  ]);
  withColumns(f, [
    ["lag_period", shiftByGame(f, pn, 1)],
    ["lead_period", shiftByGame(f, pn, -1)],
    ["lag_half", shiftByGame(f, pn, 1)],
    ["lead_half", shiftByGame(f, pn, -1)],
  ]);
  const m = col(f, "clock.minutes");
  const s = col(f, "clock.seconds");
  const startP = pn.map((_, i) => (m[i] === null || s[i] === null ? null : 60 * m[i] + s[i]));
  const startG = pn.map((p, i) => (startP[i] !== null && p === 1 ? 1200 + 60 * m[i] + s[i] : startP[i]));
  withColumns(f, [["start.period_seconds_remaining", startP], ["start.game_seconds_remaining", startG]]);
  withColumns(f, [
    ["end.period_seconds_remaining", shiftByGame(f, startP, -1)],
    ["end.game_seconds_remaining", shiftByGame(f, startG, -1)],
  ]);
  rowIndexByGame(f);
  const endP: unknown[] = [];
  const endG: unknown[] = [];
  for (const r of f.rows) {
    const [g1, p, lag] = [r.game_play_number === 1, r["period.number"], r.lag_period];
    endP.push(g1 || (eq(lag, 1) && eq(p, 2)) ? 1200 : otStart(lag, p, 3) ? 300 : r["end.period_seconds_remaining"]);
    endG.push(g1 ? 2400 : eq(lag, 1) && eq(p, 2) ? 1200 : otStart(lag, p, 3) ? 300 : r["end.game_seconds_remaining"]);
  }
  withColumns(f, [["end.period_seconds_remaining", endP], ["end.game_seconds_remaining", endG]]);
}

/** @internal Stage B of `helper_<lg>_pbp_features` (every op after stage A; per game). */
export function _features(f: Frame, init: any, v: Variant): Frame {
  if (v.plays === "mbb") mbbFeatures(f, init);
  else proFeatures(f, init, v);
  return f;
}

/** @internal The frame as py `to_dicts()` rows (column order; INT64 policy applied). */
export function _rows(f: Frame, label: string): Row[] {
  return applyInt64Policy(
    f.rows.map((r) => Object.fromEntries(f.cols.map((c) => [c, r[c] ?? null]))),
    label,
  );
}

/** py's timeouts map: `{homeTeamId: {"1": ids, "2": ids}, awayTeamId: {...}}` split by half. */
function timeoutsMap(rows: Row[], init: any, firstHalf: number): Record<string, Record<string, unknown[]>> {
  const t: Record<string, Record<string, unknown[]>> = {};
  const home = at(init, "homeTeamId");
  const away = at(init, "awayTeamId");
  t[home] = { "1": [], "2": [] };
  t[away] = { "1": [], "2": [] };
  const ids = (flag: string, second: boolean) =>
    rows
      .filter((r) => r[flag] === true && typeof r["period.number"] === "number" && (r["period.number"] > firstHalf) === second)
      .map((r) => r.id);
  t[home]["1"] = ids("homeTimeoutCalled", false);
  t[home]["2"] = ids("homeTimeoutCalled", true);
  t[away]["1"] = ids("awayTimeoutCalled", false);
  t[away]["2"] = ids("awayTimeoutCalled", true);
  return t;
}

function pbpFeatures(league: League, game_id: unknown, pbp_txt: any, init: any): Record<string, any> {
  const v = _variant(league, pbp_txt);
  const f = _features(_playsFrame(league, game_id, pbp_txt, init), init, v);
  const plays = _rows(f, `helper_${league}_pbp_features`);
  const firstHalf = v.plays === "mbb" || v.halves ? 1 : 2;
  // py also keeps its intermediate flattened records under `plays_mod`; nothing reads them.
  return { ...pbp_txt, plays, timeouts: timeoutsMap(plays, init, firstHalf) };
}

// ---------------------------------------------------------------------------
// helper_<lg>_pbp + espn_<lg>_pbp's summary trimming
// ---------------------------------------------------------------------------

/** The cleaned game dict `helper_<lg>_pbp` returns. */
export type PbpResult = Record<string, any> & { plays: Row[]; timeouts: Record<string, Record<string, unknown[]>> };

function pbp(league: League, game_id: unknown, pbp_txt: any): PbpResult {
  const facts = FACTS[league];
  const init0 = pickcenter(pbp_txt, facts);
  const [txt, init] = gameData(pbp_txt, init0);
  let plays: Row[] = [];
  let timeouts: PbpResult["timeouts"];
  if (has(txt, "plays") && pyGet(at(pyGet(txt.header, "competitions"), 0), "playByPlaySource") !== "none") {
    const done = pbpFeatures(league, game_id, txt, init);
    plays = done.plays;
    timeouts = done.timeouts;
  } else {
    timeouts = {};
    timeouts[init.homeTeamId] = { "1": [], "2": [] };
    timeouts[init.awayTeamId] = { "1": [], "2": [] };
  }
  const out: Record<string, any> = { gameId: facts.gameIdInt ? pyInt(game_id) : game_id, plays };
  for (const k of ["winprobability", "boxscore", "header", "format", "broadcasts", "videos", "playByPlaySource", "standings", "article", "leaders"]) {
    out[k] = at(txt, k);
  }
  if (league === "nba" || league === "wnba") out.seasonseries = at(txt, "seasonseries");
  out.timeouts = timeouts;
  for (const k of ["pickcenter", "againstTheSpread", "odds", "predictor", "espnWP", "gameInfo", "teamInfo", "season"]) {
    out[k] = at(txt, k);
  }
  // the top-level `gameId` (py int) is an id too: a decimal string, like the plays' ids
  return idColumnsToStrings([out])[0] as PbpResult;
}


/**
 * @internal The pure core of `espn_<lg>_pbp` after its fetch: keep py's incoming keys (absent
 * ones default to {} / [] per league), then `helper_<lg>_pbp`; `raw` returns the trimmed payload.
 */
export function _pbpFromSummary(league: League, game_id: unknown, summary: any, raw = false): Record<string, any> {
  const facts = FACTS[league];
  if (!isObj(summary)) fail("AttributeError", "summary is not a dict");
  const trimmed: Record<string, any> = raw ? {} : { timeouts: {} };
  for (const k of facts.keys) trimmed[k] = has(summary, k) ? summary[k] : facts.dictKeys.has(k) ? {} : [];
  return raw ? trimmed : pbp(league, game_id, trimmed);
}

/** Options of `espn_<lg>_pbp`: `raw` (py's `raw=True`), the rest go to `espn_<lg>_summary`. */
export type EspnPbpOptions = { raw?: boolean } & Record<string, unknown>;

/**
 * @internal py `espn_<lg>_pbp(game_id, raw=False)` with the summary fetcher injected
 * (src/index.ts passes the generated `espn_<lg>_summary`, which takes `{ event_id }`).
 */
export function _espnPbp(league: League, fetchSummary: (params: Record<string, unknown>) => Promise<unknown>) {
  return async (game_id: unknown, { raw = false, ...params }: EspnPbpOptions = {}): Promise<Record<string, any>> =>
    _pbpFromSummary(league, game_id, await fetchSummary({ ...params, event_id: game_id }), raw);
}

// ---------------------------------------------------------------------------
// Public per-league helpers (sdv-py names)
// ---------------------------------------------------------------------------

type Init = Record<string, any>;

function leagueHelpers(league: League) {
  const facts = FACTS[league];
  return {
    pickcenter: (pbp_txt: any): Init => pickcenter(pbp_txt, facts),
    game_data: (pbp_txt: any, init: Init): [Record<string, any>, Init] => gameData(pbp_txt, init),
    pbp_features: (game_id: unknown, pbp_txt: any, init: Init): Record<string, any> => pbpFeatures(league, game_id, pbp_txt, init),
    pbp: (game_id: unknown, pbp_txt: any): PbpResult => pbp(league, game_id, pbp_txt),
  };
}

const NBA = leagueHelpers("nba");
const WNBA = leagueHelpers("wnba");
const MBB = leagueHelpers("mbb");
const WBB = leagueHelpers("wbb");

/**
 * NBA pickcenter metadata (sdv-py `helper_nba_pickcenter(pbp_txt)`): spread / over-under (default
 * 215.5) / home favorite / availability as plain scalars, e.g. `gameSpread: -8.5`; the spread and the
 * favorite come from one provider row.
 */
export const helper_nba_pickcenter = NBA.pickcenter;
/**
 * NBA home / away identification (sdv-py `helper_nba_game_data(pbp_txt, init)`): `[pbp_txt, init]`.
 * `homeTeamSpread` follows `homeFavorite` (a one-element array in `init` stays one, as numpy).
 */
export const helper_nba_game_data = NBA.game_data;
/** NBA play features + timeouts (sdv-py `helper_nba_pbp_features`): quarters, 720-second ladder. */
export const helper_nba_pbp_features = NBA.pbp_features;
/** NBA cleaned game dict (sdv-py `helper_nba_pbp(game_id, pbp_txt)`): `plays`, `timeouts`, ... */
export const helper_nba_pbp = NBA.pbp;
/**
 * WNBA pickcenter metadata (sdv-py `helper_wnba_pickcenter(pbp_txt)`): spread / over-under (default
 * 165.5) / home favorite / availability as plain scalars, e.g. `gameSpread: -8.5`; the spread and the
 * favorite come from one provider row.
 */
export const helper_wnba_pickcenter = WNBA.pickcenter;
/**
 * WNBA home / away identification (sdv-py `helper_wnba_game_data(pbp_txt, init)`): `[pbp_txt, init]`.
 * `homeTeamSpread` follows `homeFavorite` (a one-element array in `init` stays one, as numpy).
 */
export const helper_wnba_game_data = WNBA.game_data;
/** WNBA play features + timeouts (sdv-py `helper_wnba_pbp_features`): halves before 2006, else quarters. */
export const helper_wnba_pbp_features = WNBA.pbp_features;
/** WNBA cleaned game dict (sdv-py `helper_wnba_pbp(game_id, pbp_txt)`): `plays`, `timeouts`, ... */
export const helper_wnba_pbp = WNBA.pbp;
/**
 * MBB pickcenter metadata (sdv-py `helper_mbb_pickcenter(pbp_txt)`): spread / over-under (default
 * 142.0) / home favorite / availability as plain scalars, e.g. `gameSpread: -8.5`; the spread and the
 * favorite come from one provider row.
 */
export const helper_mbb_pickcenter = MBB.pickcenter;
/**
 * MBB home / away identification (sdv-py `helper_mbb_game_data(pbp_txt, init)`): `[pbp_txt, init]`.
 * `homeTeamSpread` follows `homeFavorite` (a one-element array in `init` stays one, as numpy).
 */
export const helper_mbb_game_data = MBB.game_data;
/** MBB play features + timeouts (sdv-py `helper_mbb_pbp_features`): halves, Int32 clock. */
export const helper_mbb_pbp_features = MBB.pbp_features;
/** MBB cleaned game dict (sdv-py `helper_mbb_pbp(game_id, pbp_txt)`): `plays`, `timeouts`, ... */
export const helper_mbb_pbp = MBB.pbp;
/**
 * WBB pickcenter metadata (sdv-py `helper_wbb_pickcenter(pbp_txt)`): spread / over-under (default
 * 130.5) / home favorite / availability as plain scalars, e.g. `gameSpread: -8.5`; the spread and the
 * favorite come from one provider row.
 */
export const helper_wbb_pickcenter = WBB.pickcenter;
/**
 * WBB home / away identification (sdv-py `helper_wbb_game_data(pbp_txt, init)`): `[pbp_txt, init]`.
 * `homeTeamSpread` follows `homeFavorite` (a one-element array in `init` stays one, as numpy).
 */
export const helper_wbb_game_data = WBB.game_data;
/** WBB play features + timeouts (sdv-py `helper_wbb_pbp_features`): halves before 2016, else quarters. */
export const helper_wbb_pbp_features = WBB.pbp_features;
/** WBB cleaned game dict (sdv-py `helper_wbb_pbp(game_id, pbp_txt)`): `plays`, `timeouts`, ... */
export const helper_wbb_pbp = WBB.pbp;

/** `{ league: { helper_<lg>_pbp, helper_<lg>_pickcenter, ... } }` for the `sdv.<lg>` merge. */
export const BASKETBALL_PBP_PRODUCERS: Record<League, Record<string, (...args: any[]) => unknown>> = {
  nba: { helper_nba_pbp, helper_nba_pickcenter, helper_nba_game_data, helper_nba_pbp_features },
  wnba: { helper_wnba_pbp, helper_wnba_pickcenter, helper_wnba_game_data, helper_wnba_pbp_features },
  mbb: { helper_mbb_pbp, helper_mbb_pickcenter, helper_mbb_game_data, helper_mbb_pbp_features },
  wbb: { helper_wbb_pbp, helper_wbb_pickcenter, helper_wbb_game_data, helper_wbb_pbp_features },
};
