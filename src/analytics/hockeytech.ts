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

export type Row = Record<string, any>;

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

const hasCol = (rows: Row[], name: string): boolean => rows.length > 0 && name in rows[0];

// ---------------------------------------------------------------------------
// Parsers (py `_parsers.mmss_to_seconds` / `parse_shifts` / `parse_pbp`)
// ---------------------------------------------------------------------------

/** `'MM:SS'` -> total seconds, `null` for None / "" / unparseable (py `mmss_to_seconds`). */
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
 * Add the ten normalised coordinate columns (`*_original`, `*_neutral`, `*_fixed`,
 * `*_right`, `*_vertical`) from raw `x_coord` / `y_coord` (~850x400 canvas).
 * Without a `home_team_id` column every row is treated as an away event; a row with
 * a null `team_id` / `home_team_id` takes the away (passthrough) branch.
 */
export function add_coord_transforms(pbp: Row[]): Row[] {
  const withHome = hasCol(pbp, "home_team_id");
  return pbp.map((r) => {
    const ox = toFloat(r.x_coord);
    const oy = toFloat(r.y_coord);
    const xT = ox === null ? null : divc(ox, 3.0) - 100.0;
    const yT = oy === null ? null : 42.5 - divc(oy * 85.0, 300.0);
    const xFixed = xT === null ? null : divc(xT, 3.0);
    const yFixed = yT === null ? null : 42.5 - (divc(yT * 85.0, 300.0) - 42.5);
    const isHome =
      withHome && r.team_id !== null && r.team_id !== undefined && r.home_team_id !== null && r.home_team_id !== undefined
        ? pyStr(r.team_id) === pyStr(r.home_team_id)
        : false;
    const xRight = xT === null ? null : isHome ? 100.0 + (100.0 - xT) : xT;
    const yRight = yT === null ? null : isHome ? 42.5 - (yT - 42.5) : yT;
    return {
      ...r,
      x_coord_original: ox,
      y_coord_original: oy,
      x_coord_neutral: ox === null ? null : ox - 300.0,
      y_coord_neutral: oy === null ? null : oy - 150.0,
      x_coord_fixed: xFixed,
      y_coord_fixed: yFixed,
      x_coord_right: xRight,
      y_coord_right: yRight,
      x_coord_vertical: yRight === null ? null : 42.5 - (yRight - 42.5),
      y_coord_vertical: xRight,
    };
  });
}

// ---------------------------------------------------------------------------
// Shot geometry
// ---------------------------------------------------------------------------

const SCORING_CHANCE_FT = 25.0;
const SHOT_EVENTS = ["shot", "blocked_shot", "goal"];
/** Offensive goal-line x (feet) on an NHL-size rink; the PWHL plays on one. */
export const NHL_SIZE_RINK_GOAL_X = 89.0;
const MAX_PLAUSIBLE_GOAL_X = 110.0;

/** `shot_distance` / `shot_angle` (feet / degrees) for shot-type events, null elsewhere. */
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

/** `scoring_chance` = shot-type event within `threshold_ft` of the net (false for non-shots). */
export function scoring_chances(pbp: Row[], threshold_ft: number = SCORING_CHANCE_FT): Row[] {
  const rows = pbp.length > 0 && !("shot_distance" in pbp[0]) ? add_shot_distance_angle(pbp) : pbp;
  return rows.map((r) => ({
    ...r,
    scoring_chance: r.shot_distance !== null && r.shot_distance !== undefined && r.shot_distance <= threshold_ft,
  }));
}

// ---------------------------------------------------------------------------
// On-ice tracking
// ---------------------------------------------------------------------------

/** Seconds BEFORE a goal instant at which on-ice personnel are evaluated. */
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
      const cur = periodStart.get(s.period);
      if (cur === undefined || s.start_s > cur) periodStart.set(s.period, s.start_s);
    }
    rows = rows.map((r) => {
      if (r.event !== "goal") return r;
      const t: number | null = r.time_s ?? null;
      const c1 = t === null ? null : t + goal_epsilon_s;
      const ps = periodStart.get(r.period_of_game);
      const c2 = ps === undefined ? c1 : ps;
      // min_horizontal skips nulls
      const vals = [c1, c2].filter((v): v is number => v !== null);
      return { ...r, time_s: vals.length ? Math.min(...vals) : null };
    });
  }
  const byPeriod = new Map<number, Row[]>();
  for (const s of shifts) {
    if (s.period === null || s.period === undefined) continue;
    const arr = byPeriod.get(s.period);
    if (arr) arr.push(s);
    else byPeriod.set(s.period, [s]);
  }
  return rows.map((r) => {
    const out: Row = { ...r, on_ice_home: null, on_ice_away: null };
    const t: number | null = r.time_s ?? null;
    const cand = byPeriod.get(r.period_of_game);
    if (!cand || t === null) return out;
    const home = new Set<string>();
    const away = new Set<string>();
    let hasHome = false;
    let hasAway = false;
    for (const s of cand) {
      if (s.start_s === null || s.start_s === undefined || s.end_s === null || s.end_s === undefined) continue;
      if (!(s.start_s >= t && t > s.end_s)) continue;
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

const CORSI_EVENTS = ["shot", "blocked_shot", "goal"];
const FENWICK_EVENTS = ["shot", "goal"];

/**
 * Team-level shot-attempt counts, one row per non-null `team_id`: CF/CA/CF%,
 * FF/FA/FF% and `corsi_includes_missed = false`. Teams come out in first-seen order.
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
        x_coord: r.x_coord_original === null ? null : divc(r.x_coord_original, 3.0) - 100.0,
        y_coord: r.y_coord_original === null ? null : 42.5 - divc(r.y_coord_original * 85.0, 300.0),
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
      const cur = plen.get(s.period);
      if (cur === undefined || s.start_s > cur) plen.set(s.period, s.start_s);
    }
    const copy = rows.map((r) => {
      const p = toInt(r.period_of_game);
      const len = p !== null && plen.has(p) ? (plen.get(p) as number) : 1200;
      const elapsed =
        r.minute_start === null || r.second_start === null ? null : r.minute_start * 60 + r.second_start;
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

/** Per-60 rate: `value / toi_seconds * 3600` (py `per60`, as a plain function). */
export function per60(value: number, toi_seconds: number): number {
  return (value / toi_seconds) * 3600;
}

/**
 * Per-player time on ice from a parsed shifts frame: `toi_seconds` (sum of
 * `start_s - end_s`, a countdown clock), `num_shifts` and `avg_shift_s`, sorted by
 * `toi_seconds` descending (ties keep first-seen order; py's tie order is undefined).
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
    if (s.start_s !== null && s.start_s !== undefined && s.end_s !== null && s.end_s !== undefined) g.vals.push(s.start_s - s.end_s);
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
  return out.sort((a, b) => b.toi_seconds - a.toi_seconds);
}

/**
 * Player-level on-ice Corsi/Fenwick joined to time on ice (the body of py
 * `<lg>_game_corsi`): `corsi_fenwick_on_ice(pbp)` LEFT-joined to `toi_seconds`
 * on the string `player_id`, plus `corsi_for_per60` (null unless TOI > 0).
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
    const matches = byId.get(c.player_id) ?? [null];
    for (const m of matches) {
      const toiSeconds = m ? m.toi_seconds : null;
      out.push({
        ...c,
        toi_seconds: toiSeconds,
        corsi_for_per60: toiSeconds !== null && toiSeconds > 0 ? per60(c.corsi_for, toiSeconds) : null,
      });
    }
  }
  return out;
}
