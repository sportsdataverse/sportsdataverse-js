// HockeyTech analytics: shifts -> time-on-ice -> on-ice tracking -> Corsi/Fenwick.
//
// Faithful port of sdv-py `sportsdataverse/hockeytech/_analytics.py` (plus the two
// parsers it consumes, `_parsers.parse_shifts` / `parse_pbp`), pinned at
// 719de79edb685b89c524f8b4c0c146fea0b53855. PURE: rows in, rows out, no network.
// The network wrappers live in `./hockeytech_family.ts`.
//
// A "frame" here is `Row[]` (every row carries every column, missing -> `null`,
// columns in first-seen order like `pandas.json_normalize` -> polars). Empty frames
// are `[]`.
//
// Corsi/Fenwick caveat (same as py): the HockeyTech feed has no missed-shot event,
// so shot attempts = shot + blocked_shot + goal. Both are proxies; every output row
// carries `corsi_includes_missed = false`.
//
// Deliberate deviations from py (everything else is cell-for-cell identical, see
// test/analytics/hockeytech.test.js against the committed py oracle):
//   * `enrich_pbp` never fetches: a missing `meta_payload` / `shifts_payload` is
//     treated as `{}` (no game meta / no on-ice) instead of a hidden request. The
//     async wrappers in `hockeytech_family.ts` fetch and pass the payloads in.
//   * Row ORDER of the two group-by outputs whose py order is undefined
//     (`player_toi` ties, `corsi_fenwick` teams) is first-seen order here.
//   * An EMPTY play-by-play: py's `enrich_pbp` raises (an empty polars frame has no
//     `x_coord` column); this returns `[]`.

/**
 * One row of a frame: a plain object with every column of the frame as a key (missing cells are
 * `null`). Re-exported from `../core/types.js` so callers can type the inputs and outputs here.
 */
export type { ParserRow as Row } from "../core/types.js";
import type { ParserRow as Row } from "../core/types.js";

// ---------------------------------------------------------------------------
// Python-semantics helpers
// ---------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, any> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Python truthiness for JSON values. */
function truthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (isObj(v)) return Object.keys(v).length > 0;
  return true;
}

/** Python `a or b or ...`. */
function pyOr(...vs: unknown[]): any {
  for (const v of vs) if (truthy(v)) return v;
  return vs[vs.length - 1];
}

/** Python `str(v)` for JSON scalars. */
function pyStr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  return String(v);
}

/** Python `_str_or_none`: `str(v)` unless None / empty. */
function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = pyStr(v);
  return s === "" ? null : s;
}

/** Python `int(v)` for a JSON scalar (throws like py on garbage / None). */
function pyInt(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string" && /^\s*[+-]?\d+\s*$/.test(v)) return parseInt(v, 10);
  throw new TypeError(`int() argument must be a number or numeric string, got ${pyStr(v)}`);
}

/** polars `cast(Int64, strict=False)` from a string / number: null on failure. */
function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  if (typeof v === "string") return /^[+-]?\d+$/.test(v) ? parseInt(v, 10) : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

/** polars `cast(Float64, strict=False)`: null on failure. */
function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : v;
  if (typeof v === "string")
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(v) ? parseFloat(v) : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
}

/** pandas-style frame: union of keys in first-seen order, `null` fill. `[]` for no records. */
function toFrame(records: Row[]): Row[] {
  if (records.length === 0) return [];
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const r of records)
    for (const k of Object.keys(r))
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
  return records.map((r) => {
    const o: Row = {};
    for (const c of cols) o[c] = r[c] === undefined ? null : r[c];
    return o;
  });
}

/**
 * polars rewrites `expr / <float literal>` as `expr * (1 / literal)`, which differs from IEEE
 * division in the last ulp (e.g. -100 / 3). Matching it is what makes the coordinate columns
 * cell-identical to py.
 */
const divc = (a: number, c: number): number => a * (1 / c);

/**
 * A numeric cell of a frame this module built (`period`, `start_s`, `time_s`,
 * `toi_seconds`, ...: a number, or null where the caller checks first), read as the
 * number it is. Unchecked, as the py frame's Int64 / Float64 column is.
 */
const num = (v: unknown): number => v as number;

const hasCol = (rows: Row[], name: string): boolean => rows.length > 0 && name in rows[0];

// ---------------------------------------------------------------------------
// Parsers (py `_parsers.mmss_to_seconds` / `parse_shifts` / `parse_pbp`)
// ---------------------------------------------------------------------------

/**
 * Convert a `'MM:SS'` clock string to total seconds (py `mmss_to_seconds`).
 *
 * @param value - The clock string (e.g. `'03:16'`); any non-string is stringified first.
 *   `null` / `undefined` / `''` short-circuit to `null`.
 * @returns `minutes * 60 + seconds`, or `null` when the value is empty, has no single `:`,
 *   or either part is not an integer (`'3'`, `'a:b'`).
 * @example
 * ```ts
 * import { mmss_to_seconds } from "sportsdataverse/dist/analytics/hockeytech.js";
 * mmss_to_seconds("03:16"); // 196
 * mmss_to_seconds("a:b"); // null
 * ```
 * @remarks Pure and never throws; it is the clock parser behind `start_s` / `end_s` in
 * {@link parse_shifts}.
 */
export function mmss_to_seconds(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parts = String(value).split(":");
  if (parts.length !== 2) return null;
  const re = /^\s*[+-]?\d+\s*$/;
  if (!re.test(parts[0]) || !re.test(parts[1])) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Parse a `modulekit/gameshifts` payload (`SiteKit.Gameshifts`) into one row per
 * player-shift stint (py `parse_shifts`). The shift clock is a COUNTDOWN, so
 * `start_s >= end_s` for every row.
 *
 * @param payload - The raw feed body, `{ SiteKit: { Gameshifts: { home: [...], visitor: [...] } } }`.
 *   Anything without that envelope (`null`, `{}`, a list) yields `[]`.
 * @param game_id - Stamped verbatim into the `game_id` column of every row. Default `null`.
 * @returns One row per shift with `game_id`, `player_id`, `first_name`, `last_name`,
 *   `jersey_number`, `home` (1 / 0: the player's own `home` flag, else the side he was listed
 *   under), `period` (integer or `null`), `start_time` / `end_time` / `length` (raw `'MM:SS'`
 *   strings), `start_s` / `end_s` (seconds REMAINING, via {@link mmss_to_seconds}),
 *   `goal_on_shift` and `penalty_on_shift` (integers, 0 when absent). Home players first, then
 *   visitors, in feed order. `[]` for an empty game.
 * @throws TypeError when `home`, `period`, `goal_on_shift` or `penalty_on_shift` is neither
 *   a number nor an integer string (py `int()` semantics).
 * @example
 * ```ts
 * import { parse_shifts } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = parse_shifts(gameshiftsPayload, 42);
 * rows[0].start_s >= rows[0].end_s; // true: the clock counts down
 * ```
 * @remarks Ids are passed through as the feed ships them (py-faithful); the network wrappers
 * in `hockeytech_family.ts` convert id columns to decimal strings on the way out.
 */
export function parse_shifts(payload: unknown, game_id: unknown = null): Row[] {
  const kit = isObj(payload) ? payload.SiteKit : undefined;
  const gs = (isObj(kit) ? kit.Gameshifts : undefined) || {};
  const rows: Row[] = [];
  for (const side of ["home", "visitor"]) {
    const players = gs[side] || [];
    for (const player of players) {
      for (const sh of player.shifts || []) {
        rows.push({
          game_id: game_id ?? null,
          player_id: player.player_id ?? null,
          first_name: player.first_name ?? null,
          last_name: player.last_name ?? null,
          jersey_number: player.jersey_number ?? null,
          home: pyInt("home" in player ? player.home : side === "home" ? 1 : 0),
          period: truthy(sh.period) ? pyInt(sh.period) : null,
          start_time: sh.start_time ?? null,
          end_time: sh.end_time ?? null,
          length: sh.length ?? null,
          start_s: mmss_to_seconds(sh.start_time),
          end_s: mmss_to_seconds(sh.end_time),
          goal_on_shift: pyInt(pyOr(sh.goal_on_shift ?? 0, 0)),
          penalty_on_shift: pyInt(pyOr(sh.penalty_on_shift ?? 0, 0)),
        });
      }
    }
  }
  return toFrame(rows);
}

function player(d: unknown): { id: any; first: any; last: any; pos: any } {
  const o = isObj(d) ? d : {};
  return { id: o.id ?? null, first: o.firstName ?? null, last: o.lastName ?? null, pos: o.position ?? null };
}

const ORDINALS = ["one", "two", "three", "four", "five"];

function parsePbpEvents(events: unknown[], game_id: unknown): Row[] {
  const rows: Row[] = [];
  for (const e of events) {
    if (!isObj(e)) continue;
    const ev = e.event ?? null;
    const d: Record<string, any> = truthy(e.details) && isObj(e.details) ? e.details : {};

    const periodRaw = d.period;
    const period = isObj(periodRaw) ? (periodRaw.id ?? null) : (periodRaw ?? null);

    const base: Row = {
      game_id: game_id ?? null,
      event: ev,
      team_id: strOrNull(pyOr(d.team_id, d.shooterTeamId, d.teamId)),
      period_of_game: period,
      time_of_period: d.time ?? null,
      x_coord: d.xLocation ?? null,
      y_coord: d.yLocation ?? null,
      player_id: null,
      player_name_first: null,
      player_name_last: null,
      player_position: null,
      goal: null,
      is_goal_twin: false,
      goalie_id: null,
      goalie_first: null,
      goalie_last: null,
    };

    if (ev === "shot" || ev === "blocked_shot") {
      const sh = player(d.shooter);
      const gl = player(d.goalie);
      Object.assign(base, {
        player_id: sh.id,
        player_name_first: sh.first,
        player_name_last: sh.last,
        player_position: sh.pos,
        player_team_id: d.shooterTeamId ?? null,
        event_type: d.shotType ?? null,
        shot_quality: d.shotQuality ?? null,
        goal: ev === "shot" ? truthy(d.isGoal) : false,
        // The feed emits BOTH a shot row (isGoal=true) and a goal row per goal;
        // the shot twin is flagged so callers can dedupe.
        is_goal_twin: ev === "shot" ? truthy(d.isGoal) : false,
        goalie_id: gl.id,
        goalie_first: gl.first,
        goalie_last: gl.last,
      });
    } else if (ev === "goal") {
      const sc = player(d.scoredBy);
      const assists: any[] = Array.isArray(d.assists) ? d.assists : [];
      const props: Record<string, any> = truthy(d.properties) && isObj(d.properties) ? d.properties : {};
      const teamObj = truthy(d.team) && isObj(d.team) ? d.team : {};
      const team_id = pyOr(strOrNull(teamObj.id), base.team_id);
      Object.assign(base, {
        player_id: sc.id,
        player_name_first: sc.first,
        player_name_last: sc.last,
        player_position: sc.pos,
        team_id,
        goal: true,
        empty_net: props.isEmptyNet ?? null,
        game_winner: props.isGameWinningGoal ?? null,
        penalty_shot: props.isPenaltyShot ?? null,
        insurance: props.isInsuranceGoal ?? null,
        short_handed: props.isShortHanded ?? null,
        power_play: props.isPowerPlay ?? null,
      });
      const assistNames = ["two", "three"];
      assists.slice(0, 2).forEach((a, i) => {
        const pa = player(a);
        base[`player_${assistNames[i]}_id`] = pa.id;
        base[`player_${assistNames[i]}_name_first`] = pa.first;
        base[`player_${assistNames[i]}_name_last`] = pa.last;
        base[`player_${assistNames[i]}_position`] = pa.pos;
      });
      for (const [sign, key] of [
        ["plus", "plus_players"],
        ["minus", "minus_players"],
      ] as const) {
        const list: any[] = Array.isArray(d[key]) ? d[key] : [];
        list.slice(0, 5).forEach((p, j) => {
          const o = ORDINALS[j];
          const pp = player(p);
          base[`${sign}_player_${o}_id`] = pp.id;
          base[`${sign}_player_${o}_first`] = pp.first;
          base[`${sign}_player_${o}_last`] = pp.last;
          base[`${sign}_player_${o}_position`] = pp.pos;
        });
      }
    } else if (ev === "faceoff") {
      const hp = player(d.homePlayer);
      Object.assign(base, {
        player_id: hp.id,
        player_name_first: hp.first,
        player_name_last: hp.last,
        player_position: hp.pos,
        home_win: d.homeWin ?? null,
      });
    } else if (ev === "hit") {
      const p = player(d.player);
      Object.assign(base, {
        player_id: p.id,
        player_name_first: p.first,
        player_name_last: p.last,
        player_position: p.pos,
        team_id: pyOr(strOrNull(d.teamId), base.team_id),
      });
    } else if (ev === "penalty") {
      // servedBy is primary (player_id), takenBy secondary (player_two_*), as in fastRhockey.
      const sb = player(d.servedBy);
      const tb = player(d.takenBy);
      const against = truthy(d.againstTeam) && isObj(d.againstTeam) ? d.againstTeam : {};
      Object.assign(base, {
        player_id: sb.id,
        player_name_first: sb.first,
        player_name_last: sb.last,
        player_position: sb.pos,
        player_two_id: tb.id,
        player_two_name_first: tb.first,
        player_two_name_last: tb.last,
        player_two_position: tb.pos,
        team_id: strOrNull(against.id),
        penalty_length: d.minutes ?? null,
        event_type: d.description ?? null,
        power_play: d.isPowerPlay ? "1" : "0",
      });
    } else if (ev === "goalie_change") {
      const gc = player(d.goalieComingIn);
      Object.assign(base, { goalie_id: gc.id, goalie_first: gc.first, goalie_last: gc.last });
    }
    rows.push(base);
  }
  return rows;
}

/**
 * Parse a `gameCenterPlayByPlay` payload (a list of `{event, details}`) into one row
 * per event (py `parse_pbp`). Dialects a/b share one wire format. The feed emits two
 * rows per goal (the `goal` event + a twin `shot` with `is_goal_twin = true`).
 *
 * @param payload - The raw feed body: an array of `{ event, details }` objects. A non-array
 *   yields `[]`; non-object entries are skipped.
 * @param pbp_style - Coordinate-canvas dialect, `'hockeytech_a'` (≈ 850x400, PWHL / AHL) or
 *   `'hockeytech_b'` (≈ 600x300, OHL / WHL / ...). Default `'hockeytech_a'`. Accepted for
 *   parity only: both dialects parse identically (py `_parse_pbp_b` delegates to `_parse_pbp_a`).
 * @param game_id - Stamped verbatim into the `game_id` column. Default `null`.
 * @returns One row per event. Every row carries `game_id`, `event`, `team_id` (string or
 *   `null`), `period_of_game`, `time_of_period` (elapsed `'M:SS'`), raw `x_coord` / `y_coord`,
 *   the `player_*` / `goalie_*` columns, `goal` and `is_goal_twin`. Event-specific columns are
 *   added for `shot` / `blocked_shot` (`event_type`, `shot_quality`, `player_team_id`), `goal`
 *   (`empty_net`, `game_winner`, `power_play`, assists as `player_two_*` / `player_three_*`,
 *   `plus_player_<one..five>_*` / `minus_player_*`), `faceoff` (`home_win`), `penalty`
 *   (`penalty_length`, `event_type`, `power_play` `'1'`/`'0'`, `player_two_*` = takenBy) and
 *   `goalie_change`; a column absent on a row is `null`. Feed order is kept.
 * @example
 * ```ts
 * import { parse_pbp } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = parse_pbp(pbpPayload, "hockeytech_a", 42);
 * const goals = rows.filter((r) => r.event === "goal");
 * ```
 * @remarks For a penalty, `servedBy` is the primary player (`player_id`) and `takenBy` the
 * secondary (`player_two_*`), as in fastRhockey. Never throws.
 */
export function parse_pbp(payload: unknown, pbp_style: string = "hockeytech_a", game_id: unknown = null): Row[] {
  void pbp_style; // dialect b == dialect a on the wire (py `_parse_pbp_b` delegates to `_parse_pbp_a`)
  const events: unknown[] = Array.isArray(payload) ? payload : [];
  return toFrame(parsePbpEvents(events, game_id));
}

// ---------------------------------------------------------------------------
// Clock + coordinate transforms (fastRhockey R/pwhl_pbp.R)
// ---------------------------------------------------------------------------

/**
 * Add `minute_start`, `second_start`, `clock` (remaining, "M:SS") and
 * `sec_from_start` (game seconds, +1200 per period) from `time_of_period` (elapsed
 * "M:SS") + `period_of_game`. Null / unparseable parts give null. A value without
 * a ":" throws, exactly as py's polars `list.get(1)` does.
 *
 * @param pbp - Parsed play-by-play rows (see {@link parse_pbp}) carrying `time_of_period` and
 *   `period_of_game`.
 * @returns A new array of copied rows with four columns appended: `minute_start` /
 *   `second_start` (integers from the elapsed clock, `null` when a part is not an integer),
 *   `clock` (time REMAINING in the period as `'M:SS'`; `'20:00'` at `0:00`), and
 *   `sec_from_start` (elapsed game seconds: `minute_start * 60 + second_start` plus 1200 per
 *   completed period for periods 2-5; no offset for an unknown period). Input order kept.
 * @throws Error (`get index is out of bounds`) when a non-null `time_of_period` has no `':'`.
 * @example
 * ```ts
 * import { add_clock_columns } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const [r] = add_clock_columns([{ time_of_period: "3:16", period_of_game: "2" }]);
 * r.clock; // "16:44"
 * r.sec_from_start; // 1396
 * ```
 * @remarks Copies rows (the input is untouched). Required before {@link backfill_power_play}.
 * The remaining-clock formula assumes 20-minute periods.
 */
export function add_clock_columns(pbp: Row[]): Row[] {
  const offset: Record<number, number> = { 2: 1200, 3: 2400, 4: 3600, 5: 4800 };
  return pbp.map((r) => {
    const t = r.time_of_period;
    let m: number | null = null;
    let s: number | null = null;
    if (t !== null && t !== undefined) {
      const parts = String(t).split(":");
      if (parts.length < 2) throw new Error("get index is out of bounds (time_of_period has no ':')");
      m = toInt(parts[0]);
      s = toInt(parts[1]);
    }
    let clock: string | null = null;
    if (m !== null && s !== null) {
      const cm = m === 0 && s === 0 ? 20 : 19 - m;
      const cs = s === 0 ? 0 : 60 - s;
      clock = `${cm}:${cs < 10 ? "0" : ""}${cs}`;
    }
    const base = m !== null && s !== null ? m * 60 + s : null;
    const p = toInt(r.period_of_game);
    const sfs = base === null ? null : base + (p !== null && p in offset ? offset[p] : 0);
    return { ...r, minute_start: m, second_start: s, clock, sec_from_start: sfs };
  });
}

/**
 * Add the ten derived coordinate columns (`*_original`, `*_neutral`, `*_fixed`, `*_right`,
 * `*_vertical`) from raw `x_coord` / `y_coord` (canvas pixels, 600x300, top-left origin).
 *
 * @param pbp - Play-by-play rows with raw `x_coord` / `y_coord` (numbers or numeric strings;
 *   anything else becomes `null`), `team_id`, and optionally `home_team_id` (added by
 *   {@link enrich_pbp}).
 * @returns A new array of copied rows with `x_coord_original` / `y_coord_original` (the raw
 *   values as floats), `*_neutral` (origin moved to canvas centre: `x - 300`, `y - 150`), and
 *   three rotations of the rink-feet frame `x = x_coord / 3 - 100` (-100..100),
 *   `y = 42.5 - y_coord * 85 / 300` (-42.5..42.5, positive = top of the canvas):
 *   `*_fixed` = `(-x, -y)` for every event (the home team shoots right, +x);
 *   `*_right` = `(-x, -y)` for home events and `(x, y)` for visitor events (every team shoots
 *   right); `*_vertical` = `(-y_coord_right, x_coord_right)` (every team shoots up). Null
 *   coordinates stay `null` in every derived column.
 * @example
 * ```ts
 * import { add_coord_transforms } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const [r] = add_coord_transforms([{ x_coord: 450, y_coord: 75, team_id: "1", home_team_id: "2" }]);
 * r.x_coord_right; // 50 (visitor: unchanged feet)
 * r.y_coord_vertical; // 50
 * ```
 * @remarks The feed's home team attacks raw x = 0 and the visitor x = 600 in every period, so the
 * 180-degree rotation `(-x, -y)` points the home team right. Home / away is decided by comparing
 * `String(team_id)` to `String(home_team_id)`; when either is null or `''` (faceoffs carry no
 * team, and `home_team_id` is `''` without game metadata) the side is unknown and the `*_right`
 * and `*_vertical` columns are `null`, never the visitor's. Divisions by a float literal are
 * computed as `a * (1 / c)` so the feet match sdv-py's polars output bit-for-bit. Ported from
 * fastRhockey `R/hockeytech_analytics.R`; definitions in sdv-internal-refs `hockeytech/CANVAS.md`.
 */
export function add_coord_transforms(pbp: Row[]): Row[] {
  const known = (v: unknown): boolean => v !== null && v !== undefined && v !== "";
  return pbp.map((r) => {
    const ox = toFloat(r.x_coord);
    const oy = toFloat(r.y_coord);
    const x = ox === null ? null : divc(ox, 3.0) - 100.0;
    const y = oy === null ? null : 42.5 - divc(oy * 85.0, 300.0);
    const isHome =
      known(r.team_id) && known(r.home_team_id) ? pyStr(r.team_id) === pyStr(r.home_team_id) : null;
    const xRight = x === null || isHome === null ? null : isHome ? -x : x;
    const yRight = y === null || isHome === null ? null : isHome ? -y : y;
    return {
      ...r,
      x_coord_original: ox,
      y_coord_original: oy,
      x_coord_neutral: ox === null ? null : ox - 300.0,
      y_coord_neutral: oy === null ? null : oy - 150.0,
      x_coord_fixed: x === null ? null : -x,
      y_coord_fixed: y === null ? null : -y,
      x_coord_right: xRight,
      y_coord_right: yRight,
      x_coord_vertical: yRight === null ? null : -yRight,
      y_coord_vertical: xRight,
    };
  });
}

// ---------------------------------------------------------------------------
// Shot geometry
// ---------------------------------------------------------------------------

const SCORING_CHANCE_FT = 25.0;
const SHOT_EVENTS: readonly unknown[] = ["shot", "blocked_shot", "goal"];
/**
 * Offensive goal-line x (feet) on an NHL-size rink; the PWHL plays on one.
 *
 * @remarks The default `goal_x` of {@link add_shot_distance_angle}. Coordinates must already be
 * in rink feet (the `*_fixed` frame of {@link add_coord_transforms}), not raw canvas units.
 */
export const NHL_SIZE_RINK_GOAL_X = 89.0;
const MAX_PLAUSIBLE_GOAL_X = 110.0;

/**
 * Add `shot_distance` / `shot_angle` (feet / degrees) for shot-type events, null elsewhere.
 *
 * @param pbp - Play-by-play rows whose `x_coord` / `y_coord` are in rink FEET (net near
 *   `+goal_x`, centre ice at 0). Rows with `event` in `shot`, `blocked_shot`, `goal` get values.
 * @param goal_x - Offensive goal-line x in feet, `0 < goal_x <= 110`. Default
 *   {@link NHL_SIZE_RINK_GOAL_X} (89 ft).
 * @returns A new array of copied rows with `shot_distance` (feet from the net:
 *   `sqrt((goal_x - |x|)^2 + y^2)`) and `shot_angle` (degrees off the goal line's normal,
 *   `|atan2(|y|, goal_x - |x|)|`); `null` for non-shot events and for null coordinates.
 * @throws RangeError when `goal_x` is outside `(0, 110]` — the guard against passing raw
 *   feed-scale coordinates.
 * @example
 * ```ts
 * import { add_shot_distance_angle } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = add_shot_distance_angle(rinkFeetPbp); // default 89 ft net
 * const olympic = add_shot_distance_angle(rinkFeetPbp, 80); // custom goal line
 * ```
 * @remarks Uses `|x|`, so shots at either end measure to the nearer net. {@link enrich_pbp}
 * calls this on the rink-feet frame it derives from `x_coord_original` / `y_coord_original`.
 */
export function add_shot_distance_angle(pbp: Row[], goal_x: number = NHL_SIZE_RINK_GOAL_X): Row[] {
  if (!(goal_x > 0 && goal_x <= MAX_PLAUSIBLE_GOAL_X)) {
    throw new RangeError(
      `goal_x=${goal_x} ft is outside the plausible rink range (0, ${MAX_PLAUSIBLE_GOAL_X}]; ` +
        "coordinates must be in standard rink-feet (offensive net near +89 ft), not RAW feed scale."
    );
  }
  return pbp.map((r) => {
    const x = toFloat(r.x_coord);
    const y = toFloat(r.y_coord);
    const isShot = r.event !== null && r.event !== undefined && SHOT_EVENTS.includes(r.event);
    let dist: number | null = null;
    let angle: number | null = null;
    if (isShot && x !== null && y !== null) {
      const dx = goal_x - Math.abs(x);
      dist = Math.sqrt(dx * dx + y * y);
      angle = Math.abs(Math.atan2(Math.abs(y), dx)) * (180.0 / Math.PI);
    }
    return { ...r, shot_distance: dist, shot_angle: angle };
  });
}

/**
 * Add `scoring_chance` = shot-type event within `threshold_ft` of the net (false for non-shots).
 *
 * @param pbp - Play-by-play rows. If the first row has no `shot_distance` column,
 *   {@link add_shot_distance_angle} is run first with its default `goal_x`.
 * @param threshold_ft - Maximum `shot_distance` (feet, inclusive) that counts as a chance.
 *   Default 25.
 * @returns A new array of copied rows with boolean `scoring_chance`: `true` when
 *   `shot_distance` is non-null and `<= threshold_ft`, else `false` (never `null`).
 * @example
 * ```ts
 * import { add_shot_distance_angle, scoring_chances } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = scoring_chances(add_shot_distance_angle(rinkFeetPbp, 80), 15);
 * rows.filter((r) => r.scoring_chance).length;
 * ```
 * @remarks Pass a custom `goal_x` by calling {@link add_shot_distance_angle} yourself first;
 * the implicit call here always uses the NHL-size default.
 */
export function scoring_chances(pbp: Row[], threshold_ft: number = SCORING_CHANCE_FT): Row[] {
  const rows = pbp.length > 0 && !("shot_distance" in pbp[0]) ? add_shot_distance_angle(pbp) : pbp;
  return rows.map((r) => ({
    ...r,
    scoring_chance: r.shot_distance !== null && r.shot_distance !== undefined && num(r.shot_distance) <= threshold_ft,
  }));
}

// ---------------------------------------------------------------------------
// On-ice tracking
// ---------------------------------------------------------------------------

/**
 * Seconds BEFORE a goal instant at which on-ice personnel are evaluated.
 *
 * @remarks Default `goal_epsilon_s` of {@link build_on_ice}: the shift chart is often already
 * rolled to the post-goal deployment at the goal's own timestamp.
 */
export const GOAL_EPSILON_S = 2;

/**
 * Attach `on_ice_home` / `on_ice_away` (comma-joined player ids) to every event.
 *
 * `pbp` carries integer `period_of_game` and `time_s` (seconds REMAINING). A player
 * is on ice iff a shift in that period has `start_s >= time_s > end_s` (the end is
 * EXCLUSIVE so a line-change instant belongs only to the incoming shift). Goals are
 * evaluated `goal_epsilon_s` earlier, clamped to the period's first shift start
 * (the shift chart is often already rolled to the post-goal deployment). Ids are
 * the unique Int64s sorted AS STRINGS (so "10" < "9"), exactly as py. Returns the
 * rows with goal `time_s` shifted (py leaves that column modified).
 *
 * @param pbp - Event rows with integer `period_of_game` and `time_s` (seconds REMAINING in the
 *   period) and, for the goal adjustment, `event`.
 * @param shifts - Shift stints from {@link parse_shifts}: `period`, `start_s`, `end_s`
 *   (countdown seconds), `player_id`, `home` (1 / 0). Stints with a null period or clock are
 *   ignored.
 * @param goal_epsilon_s - Seconds added to a goal's `time_s` (i.e. moved EARLIER on the
 *   countdown clock) before the lookup, clamped to the period's latest shift start. `0` disables
 *   the adjustment. Default {@link GOAL_EPSILON_S} (2).
 * @returns A new array of copied rows with `on_ice_home` / `on_ice_away` appended:
 *   comma-joined, string-sorted unique player ids, `null` when no shift of that side matches
 *   (or when the event's period / time is unknown). Goal rows also carry the shifted `time_s`.
 *   With an empty `pbp` or `shifts`, every row gets `null` for both columns.
 * @example
 * ```ts
 * import { build_on_ice, parse_shifts } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const shifts = parse_shifts(gameshiftsPayload, 42);
 * const rows = build_on_ice(eventsWithTimeS, shifts); // default 2 s goal epsilon
 * const atGoal = build_on_ice(eventsWithTimeS, shifts, 0); // evaluate at the goal instant
 * ```
 * @remarks `on_ice_*` is `null` when NO stint of that side covers the instant; a side with
 * covering stints whose ids are all unparseable gives `''`. The id strings are
 * `String(toInt(player_id))`, so `'10'` sorts before `'9'`.
 */
export function build_on_ice(pbp: Row[], shifts: Row[], goal_epsilon_s: number = GOAL_EPSILON_S): Row[] {
  if (pbp.length === 0 || shifts.length === 0) {
    return pbp.map((r) => ({ ...r, on_ice_home: null, on_ice_away: null }));
  }
  let rows: Row[] = pbp.map((r) => ({ ...r }));
  if (goal_epsilon_s && hasCol(rows, "event")) {
    const periodStart = new Map<number, number>();
    for (const s of shifts) {
      if (s.period === null || s.period === undefined || s.start_s === null || s.start_s === undefined) continue;
      const cur = periodStart.get(num(s.period));
      if (cur === undefined || num(s.start_s) > cur) periodStart.set(num(s.period), num(s.start_s));
    }
    rows = rows.map((r) => {
      if (r.event !== "goal") return r;
      const t: number | null = r.time_s === undefined || r.time_s === null ? null : num(r.time_s);
      const c1 = t === null ? null : t + goal_epsilon_s;
      const ps = periodStart.get(num(r.period_of_game));
      const c2 = ps === undefined ? c1 : ps;
      // min_horizontal skips nulls
      const vals = [c1, c2].filter((v): v is number => v !== null);
      return { ...r, time_s: vals.length ? Math.min(...vals) : null };
    });
  }
  const byPeriod = new Map<number, Row[]>();
  for (const s of shifts) {
    if (s.period === null || s.period === undefined) continue;
    const arr = byPeriod.get(num(s.period));
    if (arr) arr.push(s);
    else byPeriod.set(num(s.period), [s]);
  }
  return rows.map((r) => {
    const out: Row = { ...r, on_ice_home: null, on_ice_away: null };
    const t: number | null = r.time_s === undefined || r.time_s === null ? null : num(r.time_s);
    const cand = byPeriod.get(num(r.period_of_game));
    if (!cand || t === null) return out;
    const home = new Set<string>();
    const away = new Set<string>();
    let hasHome = false;
    let hasAway = false;
    for (const s of cand) {
      if (s.start_s === null || s.start_s === undefined || s.end_s === null || s.end_s === undefined) continue;
      if (!(num(s.start_s) >= t && t > num(s.end_s))) continue;
      const pid = toInt(s.player_id);
      if (s.home === 1) {
        hasHome = true;
        if (pid !== null) home.add(String(pid));
      } else if (s.home === 0) {
        hasAway = true;
        if (pid !== null) away.add(String(pid));
      }
    }
    if (hasHome) out.on_ice_home = [...home].sort().join(",");
    if (hasAway) out.on_ice_away = [...away].sort().join(",");
    return out;
  });
}

/** Kleene AND over nullable booleans. */
function kleeneAnd(a: boolean | null, b: boolean | null): boolean | null {
  if (a === false || b === false) return false;
  if (a === null || b === null) return null;
  return true;
}

/**
 * `skaters_home` / `skaters_away`, `strength_state` ("5v4", home first) and
 * `strength_state_valid` (both counts within 3..6) from the on-ice id lists. Goalies
 * (`goalie_ids`, coerced to string, NOT de-duplicated) are stripped from the counts;
 * with none given each side is assumed to carry exactly one. No empty-net flag is
 * derived here (the shift feed does not carry goalie presence reliably).
 *
 * @param pbp - Rows carrying `on_ice_home` / `on_ice_away` (comma-joined ids from
 *   {@link build_on_ice}). Without both columns every row gets `null` for all four outputs.
 * @param goalie_ids - Goalie ids (any scalar; compared as strings) to subtract from the on-ice
 *   counts. `null` / `undefined` / `[]` all mean "assume one goalie per side". Default `null`.
 * @returns A new array of copied rows with `skaters_home` / `skaters_away` (on-ice count minus
 *   goalies; `null` when that side's list is `null`), `strength_state` (`'<home>v<away>'`,
 *   `null` if either count is null) and `strength_state_valid` (Kleene AND of "count in
 *   3..6" per side: `false` if either is out of range, `null` if either is null, else `true`).
 * @example
 * ```ts
 * import { add_strength_state } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = add_strength_state(enrichedPbp, ["105", "212"]); // two goalie ids
 * rows[0].strength_state; // e.g. "5v4"
 * ```
 * @remarks A goalie id listed twice is subtracted twice (NOT de-duplicated). `strength_state`
 * is home-first regardless of which team the event belongs to.
 */
export function add_strength_state(pbp: Row[], goalie_ids: Iterable<unknown> | null = null): Row[] {
  const gset = [...(goalie_ids ?? [])].map((g) => pyStr(g));
  const haveG = gset.length > 0;
  if (pbp.length === 0 || !hasCol(pbp, "on_ice_home") || !hasCol(pbp, "on_ice_away")) {
    return pbp.map((r) => ({
      ...r,
      skaters_home: null,
      skaters_away: null,
      strength_state: null,
      strength_state_valid: null,
    }));
  }
  const skaters = (raw: unknown): number | null => {
    if (raw === null || raw === undefined) return null;
    const ids = String(raw).split(",");
    const total = ids.length;
    const goalies = haveG ? gset.reduce((n, g) => n + (ids.includes(g) ? 1 : 0), 0) : 1;
    return total - goalies;
  };
  const between = (n: number | null): boolean | null => (n === null ? null : n >= 3 && n <= 6);
  return pbp.map((r) => {
    const h = skaters(r.on_ice_home);
    const a = skaters(r.on_ice_away);
    return {
      ...r,
      skaters_home: h,
      skaters_away: a,
      strength_state: h !== null && a !== null ? `${h}v${a}` : null,
      strength_state_valid: kleeneAnd(between(h), between(a)),
    };
  });
}

// ---------------------------------------------------------------------------
// Corsi / Fenwick
// ---------------------------------------------------------------------------

const CORSI_EVENTS: readonly unknown[] = ["shot", "blocked_shot", "goal"];
const FENWICK_EVENTS: readonly unknown[] = ["shot", "goal"];

/**
 * Team-level shot-attempt counts, one row per non-null `team_id`: CF/CA/CF%,
 * FF/FA/FF% and `corsi_includes_missed = false`. Teams come out in first-seen order.
 *
 * @param pbp - Event rows with `event` and `team_id`. Corsi events are `shot`, `blocked_shot`,
 *   `goal`; Fenwick events are `shot`, `goal`. Rows with a null `team_id` are ignored.
 * @returns One row per distinct team: `team_id` (as found in the input), `corsi_for`,
 *   `corsi_against`, `corsi_for_pct` (`null` when CF + CA is 0), `fenwick_for`,
 *   `fenwick_against`, `fenwick_for_pct`, `corsi_includes_missed` (always `false`). `[]` for
 *   an empty input.
 * @example
 * ```ts
 * import { corsi_fenwick } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const teams = corsi_fenwick(enrichedPbp); // two rows for a normal game
 * ```
 * @remarks "Against" counts every other non-null team's attempts, so the two rows of a game
 * mirror each other. The HockeyTech feed has no missed-shot event, so these are proxies.
 * Note the `goal` + twin `shot` rows from {@link parse_pbp} both count unless you dedupe on
 * `is_goal_twin` first. Py's output row order is undefined; here it is first-seen.
 */
export function corsi_fenwick(pbp: Row[]): Row[] {
  if (pbp.length === 0) return [];
  const teams: any[] = [];
  for (const r of pbp) if (r.team_id !== null && r.team_id !== undefined && !teams.includes(r.team_id)) teams.push(r.team_id);
  return teams.map((t) => {
    let cf = 0,
      ca = 0,
      ff = 0,
      fa = 0;
    for (const r of pbp) {
      if (r.team_id === null || r.team_id === undefined) continue;
      const ev = r.event;
      const mine = r.team_id === t;
      if (CORSI_EVENTS.includes(ev)) mine ? cf++ : ca++;
      if (FENWICK_EVENTS.includes(ev)) mine ? ff++ : fa++;
    }
    return {
      team_id: t,
      corsi_for: cf,
      corsi_against: ca,
      corsi_for_pct: cf + ca ? cf / (cf + ca) : null,
      fenwick_for: ff,
      fenwick_against: fa,
      fenwick_for_pct: ff + fa ? ff / (ff + fa) : null,
      corsi_includes_missed: false,
    };
  });
}

/**
 * Player-level on-ice CF/CA/FF/FA from an ENRICHED pbp (needs `event`, `team_id`,
 * `home_team_id`, `on_ice_home`, `on_ice_away`). Home-team events credit the home
 * on-ice players "for" and the away ones "against" (and vice versa); `blocked_shot`
 * counts for Corsi only. `player_id` is a string; rows are in first-seen order.
 *
 * @param pbp - Enriched rows (see {@link enrich_pbp}). If the first row lacks any of the five
 *   required columns the result is `[]`. Events with a null `team_id`, `home_team_id`,
 *   `on_ice_home` or `on_ice_away` are skipped.
 * @returns One row per player id seen in an on-ice list: `player_id` (trimmed string),
 *   `corsi_for`, `corsi_against`, `corsi_for_pct` (`null` when CF + CA is 0), `fenwick_for`,
 *   `fenwick_against`, `fenwick_for_pct`, `corsi_includes_missed` (always `false`).
 * @example
 * ```ts
 * import { corsi_fenwick_on_ice } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const players = corsi_fenwick_on_ice(enrichedPbp);
 * players.find((p) => p.player_id === "5121")?.corsi_for_pct;
 * ```
 * @remarks `player_id` here is the string split out of `on_ice_*`; {@link game_corsi_rows}
 * joins it to {@link player_toi} on that string.
 */
export function corsi_fenwick_on_ice(pbp: Row[]): Row[] {
  const required = ["event", "team_id", "home_team_id", "on_ice_home", "on_ice_away"];
  if (pbp.length === 0 || !required.every((c) => c in pbp[0])) return [];
  const stats = new Map<string, { cf: number; ca: number; ff: number; fa: number }>();
  const ensure = (pid: string) => {
    let s = stats.get(pid);
    if (!s) {
      s = { cf: 0, ca: 0, ff: 0, fa: 0 };
      stats.set(pid, s);
    }
    return s;
  };
  const split = (raw: unknown): string[] =>
    String(raw)
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
  for (const r of pbp) {
    if (!CORSI_EVENTS.includes(r.event)) continue;
    if (r.team_id == null || r.home_team_id == null) continue;
    if (r.on_ice_home == null || r.on_ice_away == null) continue;
    const isHome = pyStr(r.team_id) === pyStr(r.home_team_id);
    const forP = split(isHome ? r.on_ice_home : r.on_ice_away);
    const agP = split(isHome ? r.on_ice_away : r.on_ice_home);
    const fen = FENWICK_EVENTS.includes(r.event);
    for (const p of forP) {
      const s = ensure(p);
      s.cf++;
      if (fen) s.ff++;
    }
    for (const p of agP) {
      const s = ensure(p);
      s.ca++;
      if (fen) s.fa++;
    }
  }
  return [...stats].map(([pid, s]) => ({
    player_id: pid,
    corsi_for: s.cf,
    corsi_against: s.ca,
    corsi_for_pct: s.cf + s.ca ? s.cf / (s.cf + s.ca) : null,
    fenwick_for: s.ff,
    fenwick_against: s.fa,
    fenwick_for_pct: s.ff + s.fa ? s.ff / (s.ff + s.fa) : null,
    corsi_includes_missed: false,
  }));
}

// ---------------------------------------------------------------------------
// Power-play back-fill
// ---------------------------------------------------------------------------

/**
 * Back-fill `power_play` / `short_handed` ("1"/"0") on `shot` and `faceoff` events
 * inside a power-play window: from each PP penalty (`power_play == "1"`) for
 * `penalty_length` minutes, truncated at the first goal in the window. The first
 * matching window wins; rows outside any window are untouched. Requires
 * `sec_from_start` (run {@link add_clock_columns} first). Quirk kept from py: the
 * "previous window" lookup uses the penalty's index into the (skipping) interval list.
 *
 * @param df - Event rows with `event`, `team_id`, `home_team_id`, `away_team_id`,
 *   `sec_from_start` and, on penalties, `power_play` (`'1'` marks a PP penalty) and
 *   `penalty_length` (minutes).
 * @returns The rows with `power_play` / `short_handed` set to `'1'` / `'0'` on every `shot` or
 *   `faceoff` inside a window (the advantaged team gets `power_play = '1'`, the other
 *   `short_handed = '1'`). Both columns are added (as `null`) when missing. Rows outside every
 *   window, and non-shot / non-faceoff rows, are returned as-is. `[]` in, `[]` out.
 * @example
 * ```ts
 * import { add_clock_columns, backfill_power_play } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = backfill_power_play(add_clock_columns(pbpWithTeams));
 * rows.filter((r) => r.event === "shot" && r.power_play === "1").length;
 * ```
 * @remarks Row objects outside a window are the SAME objects as the input (not copied); rows
 * inside a window are new objects. The advantaged team is `away_team_id` when the penalised
 * `team_id` equals `home_team_id`, else `home_team_id`. A penalty without a parsable time or
 * length is skipped, which is what makes the previous-window index lookup a quirk.
 */
export function backfill_power_play(df: Row[]): Row[] {
  let rows = df;
  if (rows.length > 0 && !("short_handed" in rows[0])) rows = rows.map((r) => ({ ...r, short_handed: null }));
  if (rows.length > 0 && !("power_play" in rows[0])) rows = rows.map((r) => ({ ...r, power_play: null }));
  if (rows.length === 0) return rows;

  const pens = rows.filter(
    (r) => r.event === "penalty" && r.power_play === "1" && r.sec_from_start !== null && r.sec_from_start !== undefined
  );
  if (pens.length === 0) return rows;

  const goalTimes = rows
    .filter((r) => r.event === "goal" && r.sec_from_start !== null && r.sec_from_start !== undefined)
    .map((r) => toFloat(r.sec_from_start))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const intervals: Array<[number, number, string]> = [];
  pens.forEach((p, i) => {
    const adv =
      p.team_id !== null && p.team_id !== undefined && p.home_team_id !== null && p.home_team_id !== undefined &&
      p.team_id === p.home_team_id
        ? p.away_team_id
        : p.home_team_id;
    const s = toFloat(p.sec_from_start);
    const len = toFloat(p.penalty_length);
    let e = s !== null && len !== null ? s + len * 60.0 : null;
    if (s === null || e === null) return;
    const prevEnd = i > 0 && intervals.length ? intervals[i - 1]?.[1] : null;
    for (const g of goalTimes) {
      if (g >= s && g <= e) {
        if (prevEnd === null || prevEnd === undefined || g > prevEnd) {
          e = g;
          break;
        }
      }
    }
    intervals.push([s, e, adv !== null && adv !== undefined ? pyStr(adv) : ""]);
  });

  return rows.map((r) => {
    if (r.event !== "shot" && r.event !== "faceoff") return r;
    const sec = toFloat(r.sec_from_start);
    if (sec === null) return r;
    for (const [ps, pe, adv] of intervals) {
      if (ps <= sec && sec <= pe) {
        return pyStr(r.team_id) === adv ? { ...r, power_play: "1", short_handed: "0" } : { ...r, power_play: "0", short_handed: "1" };
      }
    }
    return r;
  });
}

// ---------------------------------------------------------------------------
// enrich_pbp
// ---------------------------------------------------------------------------

/**
 * The two raw feed payloads {@link enrich_pbp} consumes instead of fetching them (the one
 * deliberate deviation from py's `enrich_pbp`, which fetches both itself).
 */
export interface EnrichOptions {
  /** `gc/gamesummary` payload (game meta). Absent -> treated as `{}`. */
  meta_payload?: unknown;
  /** `modulekit/gameshifts` payload (on-ice). Absent / `{}` -> `on_ice_*` are null. */
  shifts_payload?: unknown;
}

/**
 * Enrich a parsed play-by-play (py `enrich_pbp`, league-generic): game-meta columns,
 * coordinate transforms, clock columns, power-play back-fill, shot geometry and
 * on-ice tracking from the shift chart. Pure: pass the payloads in (see module
 * header for the no-fetch deviation).
 *
 * @param df - Rows from {@link parse_pbp}. `[]` returns `[]` (py raises here).
 * @param league - League slug (e.g. `'pwhl'`). Accepted for py signature parity; unused.
 * @param game_id - Stamped into the shift rows parsed from `shifts_payload` (the pbp rows
 *   already carry theirs from {@link parse_pbp}).
 * @param opts - The `gc/gamesummary` and `modulekit/gameshifts` payloads, see
 *   {@link EnrichOptions}. Default `{}`: blank meta, null on-ice.
 * @returns A new array of copied rows, in input order, with — in this order — the meta
 *   columns `game_date`, `game_season` (year from the date, or `null`), `game_season_id`,
 *   `home_team`, `home_team_id`, `away_team`, `away_team_id` (strings, `''` when the meta is
 *   missing); the ten {@link add_coord_transforms} columns; the four
 *   {@link add_clock_columns} columns; `power_play` / `short_handed` back-filled by
 *   {@link backfill_power_play}; `shot_distance`, `shot_angle`, `scoring_chance` on the
 *   rink-feet frame; and `on_ice_home` / `on_ice_away` from {@link build_on_ice} (`null` when
 *   no shifts are given).
 * @example
 * ```ts
 * import { enrich_pbp, parse_pbp } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const parsed = parse_pbp(pbpPayload, "hockeytech_a", 42);
 * const rows = enrich_pbp(parsed, "pwhl", 42, { meta_payload: summary, shifts_payload: shifts });
 * ```
 * @remarks Meta fields resolve by first truthy value: team id from `meta.home_team`, then
 * `home.id`, then `home.team_id`; date from `meta.date_played`, `game_date_iso_8601`,
 * `game_date`. For on-ice lookup each period's length is the max shift `start_s` in that period
 * (OT is shorter), default 1200, and `time_s = length - elapsed`. Propagates the `Error` of
 * {@link add_clock_columns} when a `time_of_period` has no `':'`. Ids stay as the feeds ship
 * them; the wrappers in `hockeytech_family.ts` convert them to decimal strings.
 */
export function enrich_pbp(df: Row[], league: string, game_id: unknown, opts: EnrichOptions = {}): Row[] {
  void league;
  if (df.length === 0) return [];
  const metaPayload = opts.meta_payload;
  const root = (isObj(metaPayload) ? metaPayload.GC : undefined) || {};
  const gs = (("Gamesummary" in root ? root.Gamesummary : root) as Record<string, any>) || {};
  const gsMeta: Record<string, any> = gs.meta || {};
  const homeRaw: Record<string, any> = gs.home || {};
  const awayRaw: Record<string, any> = gs.visitor || {};

  const homeTeam = pyStr2(pyOr(homeRaw.name, homeRaw.city, ""));
  const homeTeamId = pyStr2(pyOr(gsMeta.home_team, homeRaw.id, homeRaw.team_id, ""));
  const awayTeam = pyStr2(pyOr(awayRaw.name, awayRaw.city, ""));
  const awayTeamId = pyStr2(pyOr(gsMeta.visiting_team, awayRaw.id, awayRaw.team_id, ""));
  const gameDate = pyStr2(pyOr(gsMeta.date_played, gs.game_date_iso_8601, gs.game_date, ""));
  const seasonRaw = gameDate ? gameDate.slice(0, 4) : null;
  const gameSeason = seasonRaw && /^\d+$/.test(seasonRaw) ? parseInt(seasonRaw, 10) : null;
  const gameSeasonId = pyStr2(pyOr(gsMeta.season_id, ""));

  let rows: Row[] = df.map((r) => ({
    ...r,
    game_date: gameDate,
    game_season: gameSeason,
    game_season_id: gameSeasonId,
    home_team: homeTeam,
    home_team_id: homeTeamId,
    away_team: awayTeam,
    away_team_id: awayTeamId,
  }));
  rows = add_coord_transforms(rows);
  rows = add_clock_columns(rows);
  rows = backfill_power_play(rows);

  // Shot geometry on the rink-feet frame (undo the raw canvas scaling).
  const geo = scoring_chances(
    add_shot_distance_angle(
      rows.map((r) => ({
        ...r,
        x_coord: r.x_coord_original === null ? null : divc(num(r.x_coord_original), 3.0) - 100.0,
        y_coord: r.y_coord_original === null ? null : 42.5 - divc(num(r.y_coord_original) * 85.0, 300.0),
      }))
    )
  );
  rows = rows.map((r, i) => ({
    ...r,
    shot_distance: geo[i].shot_distance,
    shot_angle: geo[i].shot_angle,
    scoring_chance: geo[i].scoring_chance,
  }));

  const shiftsPayload = opts.shifts_payload;
  const shifts = isObj(shiftsPayload) ? parse_shifts(shiftsPayload, game_id) : [];
  if (shifts.length > 0) {
    // Per-period length = max shift start_s in that period (OT is shorter); default 1200.
    const plen = new Map<number, number>();
    for (const s of shifts) {
      if (s.period === null || s.start_s === null) continue;
      const cur = plen.get(num(s.period));
      if (cur === undefined || num(s.start_s) > cur) plen.set(num(s.period), num(s.start_s));
    }
    const copy = rows.map((r) => {
      const p = toInt(r.period_of_game);
      const len = p !== null && plen.has(p) ? (plen.get(p) as number) : 1200;
      const elapsed =
        r.minute_start === null || r.second_start === null ? null : num(r.minute_start) * 60 + num(r.second_start);
      return { ...r, period_of_game: p, time_s: elapsed === null ? null : len - elapsed };
    });
    const res = build_on_ice(copy, shifts);
    rows = rows.map((r, i) => ({ ...r, on_ice_home: res[i].on_ice_home, on_ice_away: res[i].on_ice_away }));
  } else {
    rows = rows.map((r) => ({ ...r, on_ice_home: null, on_ice_away: null }));
  }
  return rows;
}

/** Python `str(...)` of an already-`or`-ed JSON scalar. */
function pyStr2(v: unknown): string {
  return pyStr(v);
}

// ---------------------------------------------------------------------------
// TOI + per-60
// ---------------------------------------------------------------------------

/**
 * Per-60 rate: `value / toi_seconds * 3600` (py `per60`, as a plain function).
 *
 * @param value - The count to scale (e.g. `corsi_for`).
 * @param toi_seconds - Time on ice in seconds. Not guarded: `0` gives `Infinity` / `NaN`.
 * @returns `value` per 60 minutes of ice time.
 * @example
 * ```ts
 * import { per60 } from "sportsdataverse/dist/analytics/hockeytech.js";
 * per60(20, 1131); // 63.66...
 * ```
 * @remarks {@link game_corsi_rows} only calls this when `toi_seconds > 0`.
 */
export function per60(value: number, toi_seconds: number): number {
  return (value / toi_seconds) * 3600;
}

/**
 * Per-player time on ice from a parsed shifts frame: `toi_seconds` (sum of
 * `start_s - end_s`, a countdown clock), `num_shifts` and `avg_shift_s`, sorted by
 * `toi_seconds` descending (ties keep first-seen order; py's tie order is undefined).
 *
 * @param shifts - Shift stints from {@link parse_shifts}; grouped on
 *   (`player_id`, `first_name`, `last_name`).
 * @returns One row per player: `player_id`, `first_name`, `last_name` (as in the input),
 *   `toi_seconds` (sum over stints with both `start_s` and `end_s` non-null), `num_shifts`
 *   (ALL stints, including ones with a null clock) and `avg_shift_s` (`toi_seconds` over the
 *   counted stints; `null` if none). `[]` for an empty input.
 * @example
 * ```ts
 * import { parse_shifts, player_toi } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const toi = player_toi(parse_shifts(gameshiftsPayload, 42));
 * toi[0]; // the player with the most ice time
 * ```
 * @remarks `num_shifts` and the `avg_shift_s` denominator differ when a stint has an
 * unparseable `start_time` / `end_time`.
 */
export function player_toi(shifts: Row[]): Row[] {
  if (shifts.length === 0) return [];
  const groups = new Map<string, { player_id: any; first_name: any; last_name: any; vals: number[]; n: number }>();
  for (const s of shifts) {
    const key = JSON.stringify([s.player_id, s.first_name, s.last_name]);
    let g = groups.get(key);
    if (!g) {
      g = { player_id: s.player_id, first_name: s.first_name, last_name: s.last_name, vals: [], n: 0 };
      groups.set(key, g);
    }
    g.n++;
    if (s.start_s !== null && s.start_s !== undefined && s.end_s !== null && s.end_s !== undefined) g.vals.push(num(s.start_s) - num(s.end_s));
  }
  const out = [...groups.values()].map((g) => {
    const sum = g.vals.reduce((a, b) => a + b, 0);
    return {
      player_id: g.player_id,
      first_name: g.first_name,
      last_name: g.last_name,
      toi_seconds: sum,
      num_shifts: g.n,
      avg_shift_s: g.vals.length ? sum / g.vals.length : null,
    } as Row;
  });
  return out.sort((a, b) => num(b.toi_seconds) - num(a.toi_seconds));
}

/**
 * Player-level on-ice Corsi/Fenwick joined to time on ice (the body of py
 * `<lg>_game_corsi`): `corsi_fenwick_on_ice(pbp)` LEFT-joined to `toi_seconds`
 * on the string `player_id`, plus `corsi_for_per60` (null unless TOI > 0).
 *
 * @param enrichedPbp - Output of {@link enrich_pbp} (needs `event`, `team_id`,
 *   `home_team_id`, `on_ice_home`, `on_ice_away`).
 * @param shifts - Shift stints from {@link parse_shifts} for the same game.
 * @returns The {@link corsi_fenwick_on_ice} rows (same order) with `toi_seconds` (`null` when
 *   the player has no TOI row) and `corsi_for_per60` (`per60(corsi_for, toi_seconds)`, `null`
 *   unless `toi_seconds > 0`). `[]` when the enriched pbp is empty or lacks the on-ice columns.
 * @example
 * ```ts
 * import { game_corsi_rows, parse_shifts } from "sportsdataverse/dist/analytics/hockeytech.js";
 * const rows = game_corsi_rows(enrichedPbp, parse_shifts(gameshiftsPayload, 42));
 * ```
 * @remarks The join key is the TOI side's `player_id` coerced through `toInt` then
 * `String(...)`; a TOI row with a non-integer id never matches. A player with several TOI rows
 * (same id, different name spelling) is emitted once per match, like a LEFT join.
 */
export function game_corsi_rows(enrichedPbp: Row[], shifts: Row[]): Row[] {
  const corsi = corsi_fenwick_on_ice(enrichedPbp);
  const toi = player_toi(shifts);
  const byId = new Map<string, Row[]>();
  for (const t of toi) {
    const pid = toInt(t.player_id);
    const key = pid === null ? null : String(pid);
    if (key === null) continue;
    const arr = byId.get(key);
    if (arr) arr.push(t);
    else byId.set(key, [t]);
  }
  const out: Row[] = [];
  for (const c of corsi) {
    // corsi_fenwick_on_ice's player_id is a string and corsi_for a count
    const matches = byId.get(c.player_id as string) ?? [null];
    for (const m of matches) {
      const toiSeconds = m ? m.toi_seconds : null;
      out.push({
        ...c,
        toi_seconds: toiSeconds,
        corsi_for_per60: toiSeconds !== null && num(toiSeconds) > 0 ? per60(num(c.corsi_for), num(toiSeconds)) : null,
      });
    }
  }
  return out;
}
