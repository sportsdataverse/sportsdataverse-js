// Cricket in-play win probability. Faithful port of sdv-py
// `sportsdataverse/cricket/cricket_win_prob.py` + the format table in
// `cricket_model_constants.py` (pin 719de79edb685b89c524f8b4c0c146fea0b53855).
//
// Pipeline per state row: resource surface -> proj_final = runs + resources*par
// -> win_prob_raw = Phi((proj_final - benchmark)/sigma) -> per-(fmt, phase)
// isotonic calibration (linear interp) -> 1e-6 raw tie-breaker -> terminal
// overrides. Pure: no network. Tables: ./data/cricket_wp_tables.json (lossless
// conversion of the bundled parquet artifacts).
import tables from './data/cricket_wp_tables.json' with { type: 'json' };

/**
 * Per-format constants of the win-probability model (py `cricket_model_constants.py`).
 */
export interface FormatConstants {
  /** Canonical lower-case format slug: `'t20'` or `'odi'`. */
  name: string;
  /** Legal deliveries in one innings (120 for T20, 300 for ODI). */
  balls_total: number;
  /** Wickets available in one innings (10). */
  max_wickets: number;
  /** Fitted par first-innings score; the benchmark when setting and the resource multiplier. */
  par_score: number;
  /** Std. dev. (runs) of `proj_final - par_score` when setting a total (innings 1). */
  sigma_set: number;
  /** Std. dev. (runs) of `proj_final - target` when chasing (innings 2 with a target). */
  sigma_chase: number;
}

/**
 * The supported formats keyed by slug (`t20`, `odi`); fitted on Cricsheet male T20I + ODI
 * 2002-2026 (sdv-py `fit_cricket_resource_surface.py`).
 *
 * @remarks Test cricket is deferred and absent; look formats up through {@link get_format},
 *   which normalises case and rejects unknown slugs.
 */
export const FORMAT_TABLE: Record<string, FormatConstants> = {
  t20: { name: 't20', balls_total: 120, max_wickets: 10, par_score: 149.2, sigma_set: 43.0, sigma_chase: 34.0 },
  odi: { name: 'odi', balls_total: 300, max_wickets: 10, par_score: 248.7, sigma_set: 71.0, sigma_chase: 58.0 },
};

/**
 * Resolve a format slug to its {@link FormatConstants} (case-insensitive, whitespace trimmed).
 *
 * @param fmt - Format slug: `'t20'` / `'odi'` in any case, e.g. `' T20 '`. A nullish value is
 *   treated as `''` (unknown).
 * @returns The matching {@link FORMAT_TABLE} entry.
 * @throws Error `Test cricket deferred` for `'test'`;
 *   `Unknown cricket format '<fmt>'; expected one of ["odi","t20"]` for anything else not in the table.
 * @remarks Divergence from sdv-py, which joins on the raw slug (`KeyError` for `"T20"`): the JS
 *   port normalises case. Mounted as `sdv.cricket.cricket_get_format` / `cricketGetFormat`.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.cricket.cricket_get_format(' T20 ').balls_total; // 120
 * ```
 */
export function get_format(fmt: string): FormatConstants {
  // Divergence from py: py joins the surface / calibration on the raw slug (KeyError for e.g. "T20"); JS is more lenient and normalises case.
  const key = (fmt ?? '').trim().toLowerCase();
  if (key === 'test') throw new Error('Test cricket deferred');
  if (!Object.prototype.hasOwnProperty.call(FORMAT_TABLE, key)) {
    throw new Error(
      `Unknown cricket format '${fmt}'; expected one of ${JSON.stringify(Object.keys(FORMAT_TABLE).sort())}`,
    );
  }
  return FORMAT_TABLE[key];
}

/**
 * One over-level match state row: the input schema of {@link cricket_win_probability} and
 * the output of {@link cricket_match_state}.
 */
export interface CricketState {
  /** ESPN event id as a string, or `null` when the payload carries none. */
  event_id: string | null;
  /** `1` when setting a total, `2` when a target is present (chasing). */
  innings_number: number;
  /** Batting team id as a string (`competitor.team.id`, else `competitor.id`), or `null`. */
  batting_team_id: string | null;
  /** Runs scored so far in the innings. */
  runs: number;
  /** Wickets lost so far (0 when the score string has no `/w` part). */
  wickets: number;
  /** Legal deliveries bowled so far (`overs * 6 + balls`). */
  balls_bowled: number;
  /** Deliveries in a full innings for the format (`FormatConstants.balls_total`). */
  balls_total: number;
  /** Runs needed to win when chasing; `null` in the first innings. */
  target: number | null;
  /** Format slug; resolved through {@link get_format} per row. */
  fmt: string;
}

/**
 * A {@link CricketState} row plus the win-probability columns {@link cricket_win_probability}
 * appends.
 */
export interface CricketWinProb extends CricketState {
  /** Whole overs remaining: `floor((balls_total - balls_bowled) / 6)`. */
  overs_left: number;
  /** `10 - wickets`. */
  wickets_left: number;
  /** Resource fraction left from the bundled (fmt, overs_left, wickets_left) surface; `0` off-table. */
  resources_left: number;
  /** Projected final total: `runs + resources_left * par_score`. */
  proj_final: number;
  /** Uncalibrated `Phi((proj_final - benchmark) / sigma)`, after terminal overrides. */
  win_prob_raw: number;
  /** Calibrated win probability for the batting side, in [0, 1], after terminal overrides. */
  win_prob: number;
}

// ---- score-string parsing / match state -----------------------------------
// e.g. "161/5 (18/20 ov, target 156)", "88/3 (12.4/20 ov)", "168/7 (20 ov)"
const SCORE_RE =
  /(\d+)(?:\/(\d+))?\s*\(\s*(\d+)(?:\.(\d))?(?:\s*\/\s*\d+)?\s*ov(?:er)?s?(?:,\s*target\s*(\d+))?\s*\)/i;

/**
 * Parse an ESPN cricket competitor score string into `[runs, wickets, balls_bowled, target]`.
 *
 * @param score - The score string, e.g. `"161/5 (18/20 ov, target 156)"`, `"88/3 (12.4/20 ov)"`
 *   or `"168/7 (20 ov)"`. Any non-string returns `null`.
 * @returns `[runs, wickets, balls_bowled, target]` with `wickets` `0` when absent, `balls_bowled`
 *   `= overs * 6 + partial balls`, `target` `null` when absent; or `null` when the string does
 *   not match.
 * @remarks Case-insensitive; `ov`, `over` and `overs` are accepted, the `/N` overs limit is
 *   ignored. Mounted as `sdv.cricket.cricket_parse_score_string` / `cricketParseScoreString`.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.cricket.cricket_parse_score_string('161/5 (18/20 ov, target 156)'); // [161, 5, 108, 156]
 * sdv.cricket.cricket_parse_score_string('no score yet');                 // null
 * ```
 */
export function parse_score_string(score: unknown): [number, number, number, number | null] | null {
  if (typeof score !== 'string') return null;
  const m = SCORE_RE.exec(score);
  if (m === null) return null;
  const runs = parseInt(m[1], 10);
  const wickets = m[2] !== undefined ? parseInt(m[2], 10) : 0;
  const overs = parseInt(m[3], 10);
  const partial = m[4] !== undefined ? parseInt(m[4], 10) : 0;
  const target = m[5] !== undefined ? parseInt(m[5], 10) : null;
  return [runs, wickets, overs * 6 + partial, target];
}

function isObj(x: unknown): x is Record<string, any> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function findCompetition(summary: any): Record<string, any> {
  if (!isObj(summary)) return {};
  for (const path of [['header', 'competitions'], ['competitions']]) {
    let node: any = summary;
    for (const key of path) node = isObj(node) ? node[key] : undefined;
    if (Array.isArray(node) && node.length > 0) return isObj(node[0]) ? node[0] : {};
  }
  return {};
}

function eventId(summary: any, comp: Record<string, any>): string | null {
  for (const c of [comp.id, summary?.id, summary?.header?.id]) {
    if (c !== undefined && c !== null) return String(c);
  }
  return null;
}

/**
 * Extract over-level match state from an ESPN cricket summary / scoreboard-event payload
 * (py `cricket_match_state`): one row per competitor with a parseable score string.
 *
 * @param summary - An ESPN cricket `summary` payload or one `scoreboard.events[i]` object. The
 *   competition is read from `header.competitions[0]`, else `competitions[0]`; the event id
 *   from `competition.id`, `summary.id`, then `summary.header.id`. A non-object yields no rows.
 * @param opts - `fmt`: the format slug for every row (`'t20'` / `'odi'`, see {@link get_format}).
 * @returns {@link CricketState} rows sorted by `innings_number` (stable: `Array#sort`), innings
 *   `2` iff the score string carries a `target`. Competitors without a parseable score are skipped.
 * @throws Error From {@link get_format}, for `fmt` `'test'` (deferred) or an unknown slug.
 * @remarks Pure: no network. `balls_total` is the format's, not read from the payload.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * const sb = await sdv.cricket.espnCricketScoreboard({ league: '8048' }); // IPL, raw payload
 * const state = sdv.cricket.cricket_match_state(sb.events[0], { fmt: 't20' });
 * ```
 */
export function cricket_match_state(summary: any, opts: { fmt: string }): CricketState[] {
  const fc = get_format(opts.fmt);
  const comp = findCompetition(summary);
  const id = eventId(summary, comp);
  const rows: CricketState[] = [];
  for (const c of comp.competitors ?? []) {
    const parsed = isObj(c) ? parse_score_string(c.score) : null;
    if (parsed === null) continue;
    const [runs, wickets, balls, target] = parsed;
    const team = isObj(c.team) ? c.team.id : c.id;
    rows.push({
      event_id: id,
      innings_number: target !== null ? 2 : 1,
      batting_team_id: team === undefined || team === null ? null : String(team),
      runs,
      wickets,
      balls_bowled: balls,
      balls_total: fc.balls_total,
      target,
      fmt: fc.name,
    });
  }
  return rows.sort((a, b) => a.innings_number - b.innings_number); // Array#sort is stable
}

// ---- normal CDF (full double precision; scipy.stats.norm.cdf equivalent) ---
// erf via the all-positive series for |z|<2 and the Laplace continued fraction
// in the left tail (CF form); absolute error ~1e-16 in the series range.
function erfSeries(x: number): number {
  // erf(x) = 2/sqrt(pi) * exp(-x^2) * sum_{n>=0} 2^n x^(2n+1) / (1*3*...*(2n+1))
  let term = x;
  let sum = x;
  for (let n = 1; n < 200; n++) {
    term *= (2 * x * x) / (2 * n + 1);
    sum += term;
    if (term < 1e-17 * sum) break;
  }
  return (2 / Math.sqrt(Math.PI)) * Math.exp(-x * x) * sum;
}

// exp(-t/2) for t = x^2 with the square formed exactly: x*x in double loses ~x^2*eps
// relative accuracy (5e-14 at x=-30), so square an exactly-representable high part
// separately (Cody/Sun split).
function expNegHalfSq(x: number): number {
  const xh = Math.trunc(x * 16) / 16;
  return Math.exp((-xh * xh) / 2) * Math.exp((-(x - xh) * (x + xh)) / 2);
}

// Laplace continued fraction: erfc(z) = exp(-z^2)/sqrt(pi) / F, F = z + (1/2)/(z + 1/(z + (3/2)/(z + ...)));
// returns F (relative-accurate for z >= 1; the 1000 terms are far past convergence there).
function erfcCFDenominator(z: number): number {
  let f = z;
  for (let k = 1000; k >= 1; k--) f = z + k / 2 / f;
  return f;
}

/**
 * Standard normal CDF at full double precision (a `scipy.stats.norm.cdf` equivalent).
 *
 * @param x - The z-score; NaN returns NaN.
 * @returns `Phi(x)` in [0, 1].
 * @remarks Relative error ~1e-15 in the left tail (Laplace continued fraction below
 *   `-sqrt(2)`, erf series between, symmetry above); agrees with scipy to ~6e-14 relative at
 *   worst for `|x| >= 20`. Not mounted on `sdv.cricket`; import it from this module.
 * @example
 * ```ts
 * import { norm_cdf } from './cricket_wp.js';
 * norm_cdf(0);     // 0.5
 * norm_cdf(-1.96); // 0.0249...
 * ```
 */
export function norm_cdf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x < -Math.SQRT2) {
    // Phi(x) = erfc(-x/sqrt2)/2 = exp(-x^2/2) / (2 sqrt(pi) F)(-x/sqrt2): no 1 - erf cancellation.
    return (expNegHalfSq(x) / (2 * Math.sqrt(Math.PI)) / erfcCFDenominator(-x * Math.SQRT1_2));
  }
  if (x > Math.SQRT2) return 1 - norm_cdf(-x);
  return 0.5 * (1 + erfSeriesSigned(x * Math.SQRT1_2));
}

function erfSeriesSigned(z: number): number {
  return z < 0 ? -erfSeries(-z) : erfSeries(z);
}

// ---- bundled tables ---------------------------------------------------------
interface Tables {
  surface: { rows: [string, number, number, number][] };
  calibration: Record<string, { x: number[]; y: number[] }>;
}
const T = tables as unknown as Tables;
const SURFACE = new Map<string, number>(T.surface.rows.map(([f, o, w, r]) => [`${f}|${o}|${w}`, r]));

/** numpy.interp semantics (increasing xp, clamped ends). */
function interp(x: number, xp: number[], fp: number[]): number {
  if (Number.isNaN(x)) return NaN;
  const n = xp.length;
  if (x <= xp[0]) return fp[0];
  if (x >= xp[n - 1]) return fp[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xp[mid] <= x) lo = mid;
    else hi = mid;
  }
  const slope = (fp[lo + 1] - fp[lo]) / (xp[lo + 1] - xp[lo]);
  return slope * (x - xp[lo]) + fp[lo];
}

/**
 * In-play win probability for the batting / chasing team from match-state rows
 * (py `cricket_win_probability`).
 *
 * Per row: resource surface -> `proj_final = runs + resources_left * par_score` ->
 * `win_prob_raw = Phi((proj_final - benchmark) / sigma)` -> per-(fmt, phase) isotonic
 * calibration (linear interpolation) -> `1e-6 * (raw - 0.5)` tie-breaker, clamped to [0, 1]
 * -> terminal overrides.
 *
 * @param state - {@link CricketState} rows, the output of {@link cricket_match_state} or any
 *   rows with the same schema. An empty array returns an empty array.
 * @returns A new array of {@link CricketWinProb} rows (each a shallow copy of the input plus
 *   `overs_left`, `wickets_left`, `resources_left`, `proj_final`, `win_prob_raw`, `win_prob`),
 *   in input order.
 * @throws Error From {@link get_format}, for a row whose `fmt` is `'test'` or unknown.
 * @remarks A row is a chase iff `innings_number === 2` and `target` is non-null; the benchmark
 *   is then `target` with `sigma_chase`, else `par_score` with `sigma_set`. Chase overrides:
 *   `runs >= target` -> `win_prob = win_prob_raw = 1`; else all out (`wickets >= 10`) or out of
 *   balls -> `0`. An (overs_left, wickets_left) cell missing from the surface reads as `0`
 *   resources. Pure: tables are bundled JSON, no network.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * const wp = sdv.cricket.cricket_win_probability([{
 *   event_id: '8048', innings_number: 2, batting_team_id: '1', runs: 88, wickets: 3,
 *   balls_bowled: 76, balls_total: 120, target: 156, fmt: 't20',
 * }]);
 * wp[0].win_prob; // chasing side's probability in [0, 1]
 * ```
 */
export function cricket_win_probability(state: CricketState[]): CricketWinProb[] {
  return state.map((s) => {
    const fc = get_format(s.fmt);
    const fmt = fc.name;
    const overs_left = Math.floor((s.balls_total - s.balls_bowled) / 6);
    const wickets_left = 10 - s.wickets;
    const resources_left = SURFACE.get(`${fmt}|${overs_left}|${wickets_left}`) ?? 0.0;
    const proj_final = s.runs + resources_left * fc.par_score;
    const isChase = s.innings_number === 2 && s.target !== null && s.target !== undefined;
    const benchmark = isChase ? (s.target as number) : fc.par_score;
    const sigma = isChase ? fc.sigma_chase : fc.sigma_set;
    const raw0 = norm_cdf((proj_final - benchmark) / sigma);
    const cal = T.calibration[`${fmt}|${isChase ? 'chase' : 'set'}`];
    let wp = interp(raw0, cal.x, cal.y);
    // tiny raw tie-breaker (keeps win_prob strictly increasing across isotonic plateaus)
    wp = Math.min(1.0, Math.max(0.0, wp + 1e-6 * (raw0 - 0.5)));
    let raw = raw0;
    if (isChase) {
      // terminal overrides: target reached => 1; all out / out of balls short => 0
      if (s.runs >= (s.target as number)) {
        wp = 1.0;
        raw = 1.0;
      } else if (s.wickets >= 10 || s.balls_bowled >= s.balls_total) {
        wp = 0.0;
        raw = 0.0;
      }
    }
    return { ...s, overs_left, wickets_left, resources_left, proj_final, win_prob_raw: raw, win_prob: wp };
  });
}

// camelCase aliases
/** camelCase alias of {@link get_format}. */
export const getFormat = get_format;
/** camelCase alias of {@link parse_score_string}. */
export const parseScoreString = parse_score_string;
/** camelCase alias of {@link cricket_match_state}. */
export const cricketMatchState = cricket_match_state;
/** camelCase alias of {@link cricket_win_probability}. */
export const cricketWinProbability = cricket_win_probability;

// ---- expected runs + WPA (port of sdv-py cricket_wpa.py) --------------------
/** A {@link CricketWinProb} row plus the columns {@link cricket_expected_runs} appends. */
export interface CricketExpectedRuns extends CricketWinProb {
  /** `max(0, proj_final - runs)`. */
  exp_runs_remaining: number;
  /** `exp_runs_remaining / overs_left`, or `null` when no whole overs are left. */
  exp_run_rate: number | null;
}

/** A {@link CricketWinProb} row plus the columns {@link cricket_wpa} appends. */
export interface CricketWpa extends CricketWinProb {
  /** The previous state's `win_prob` in the same (event_id, innings_number); `null` for the first. */
  win_prob_before: number | null;
  /** `win_prob - win_prob_before` (`0` for the first state of an innings). */
  wpa_batting: number;
  /** `-wpa_batting`. */
  wpa_bowling: number;
}

/**
 * Projected runs still to come and the per-over rate needed for them (py `cricket_wpa.py`
 * expected runs).
 *
 * @param stateWp - Rows carrying at least `runs`, `proj_final` and `overs_left`, typically the
 *   output of {@link cricket_win_probability}.
 * @returns A new array, each row a shallow copy of the input plus `exp_runs_remaining`
 *   (`max(0, proj_final - runs)`) and `exp_run_rate` (`exp_runs_remaining / overs_left`, or
 *   `null` when `overs_left <= 0`).
 * @remarks The rate divides by whole overs left, so the last partial over reads as `null`.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * const er = sdv.cricket.cricket_expected_runs(sdv.cricket.cricket_win_probability(state));
 * er[0].exp_run_rate; // runs per over, or null
 * ```
 */
export function cricket_expected_runs(
  stateWp: Pick<CricketWinProb, 'runs' | 'proj_final' | 'overs_left'>[],
): (typeof stateWp[number] & { exp_runs_remaining: number; exp_run_rate: number | null })[] {
  return stateWp.map((s) => {
    const exp_runs_remaining = Math.max(0.0, s.proj_final - s.runs);
    const exp_run_rate = s.overs_left > 0 ? exp_runs_remaining / s.overs_left : null;
    return { ...s, exp_runs_remaining, exp_run_rate };
  });
}

function cmpNullFirst(a: any, b: any): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return a < b ? -1 : 1;
}

/**
 * Batting / bowling win-probability added per state (py `cricket_wpa`).
 *
 * @param stateWp - Rows carrying at least `event_id`, `innings_number`, `balls_bowled` and
 *   `win_prob`, typically the output of {@link cricket_win_probability}; any order.
 * @returns A new array **sorted** by `event_id`, `innings_number`, `balls_bowled` (nulls first,
 *   stable), each row a shallow copy of the input plus `win_prob_before` (the previous row's
 *   `win_prob` within the same (event_id, innings_number), else `null`), `wpa_batting`
 *   (`win_prob - win_prob_before`, `0` for the first state) and `wpa_bowling` (`-wpa_batting`).
 * @remarks Output order differs from input order. Tie order is stable here while polars'
 *   sort in sdv-py is unspecified on ties.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * const wpa = sdv.cricket.cricket_wpa(sdv.cricket.cricket_win_probability(state));
 * wpa[0].wpa_batting; // 0 for the first state of an innings
 * ```
 */
export function cricket_wpa(
  stateWp: Pick<CricketWinProb, 'event_id' | 'innings_number' | 'balls_bowled' | 'win_prob'>[],
): (typeof stateWp[number] & { win_prob_before: number | null; wpa_batting: number; wpa_bowling: number })[] {
  const sorted = [...stateWp].sort(
    (a, b) =>
      cmpNullFirst(a.event_id, b.event_id) ||
      cmpNullFirst(a.innings_number, b.innings_number) ||
      cmpNullFirst(a.balls_bowled, b.balls_bowled),
  );
  return sorted.map((s, i) => {
    const prev = i > 0 ? sorted[i - 1] : null;
    const same = prev !== null && prev.event_id === s.event_id && prev.innings_number === s.innings_number;
    const win_prob_before = same ? prev!.win_prob : null;
    const wpa_batting = win_prob_before === null ? 0.0 : s.win_prob - win_prob_before;
    return { ...s, win_prob_before, wpa_batting, wpa_bowling: -wpa_batting };
  });
}

/** camelCase alias of {@link cricket_expected_runs}. */
export const cricketExpectedRuns = cricket_expected_runs;
/** camelCase alias of {@link cricket_wpa}. */
export const cricketWpa = cricket_wpa;
