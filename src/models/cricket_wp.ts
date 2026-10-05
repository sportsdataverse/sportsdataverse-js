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

export interface FormatConstants {
  name: string;
  balls_total: number;
  max_wickets: number;
  par_score: number;
  sigma_set: number;
  sigma_chase: number;
}

// Fitted on Cricsheet male T20I + ODI 2002-2026 (sdv-py fit_cricket_resource_surface.py).
export const FORMAT_TABLE: Record<string, FormatConstants> = {
  t20: { name: 't20', balls_total: 120, max_wickets: 10, par_score: 149.2, sigma_set: 43.0, sigma_chase: 34.0 },
  odi: { name: 'odi', balls_total: 300, max_wickets: 10, par_score: 248.7, sigma_set: 71.0, sigma_chase: 58.0 },
};

/** Resolve a format slug (case-insensitive). Throws for "test" (deferred) or unknown. */
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

export interface CricketState {
  event_id: string | null;
  innings_number: number;
  batting_team_id: string | null;
  runs: number;
  wickets: number;
  balls_bowled: number;
  balls_total: number;
  target: number | null;
  fmt: string;
}

export interface CricketWinProb extends CricketState {
  overs_left: number;
  wickets_left: number;
  resources_left: number;
  proj_final: number;
  win_prob_raw: number;
  win_prob: number;
}

// ---- score-string parsing / match state -----------------------------------
// e.g. "161/5 (18/20 ov, target 156)", "88/3 (12.4/20 ov)", "168/7 (20 ov)"
const SCORE_RE =
  /(\d+)(?:\/(\d+))?\s*\(\s*(\d+)(?:\.(\d))?(?:\s*\/\s*\d+)?\s*ov(?:er)?s?(?:,\s*target\s*(\d+))?\s*\)/i;

/** Parse an ESPN cricket score string to [runs, wickets, balls_bowled, target|null], or null. */
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
 * Extract over-level match state from an ESPN cricket summary / scoreboard-event
 * payload: one row per innings with a parseable competitor score string,
 * sorted by innings_number (stable). Throws for fmt "test"/unknown.
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
// erf via the all-positive series for |x|<3 and the Laplace continued fraction
// for erfc beyond; absolute error ~1e-16.
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

function erfcCF(z: number): number {
  // erfc(z) = exp(-z^2)/sqrt(pi) * 1/(z + (1/2)/(z + 1/(z + (3/2)/(z + 2/(z + ...)))))
  let f = z;
  for (let k = 120; k >= 1; k--) f = z + k / 2 / f;
  return Math.exp(-z * z) / Math.sqrt(Math.PI) / f;
}

function erfc(z: number): number {
  if (z < 0) return 2 - erfc(-z);
  return z < 3 ? 1 - erfSeries(z) : erfcCF(z);
}

/** Standard normal CDF. */
export function norm_cdf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  return 0.5 * erfc(-x / Math.SQRT2);
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
 * In-play win probability for the batting/chasing team from match-state rows
 * (the output of {@link cricket_match_state} or any rows with the same schema).
 * Returns the input rows plus overs_left, wickets_left, resources_left,
 * proj_final, win_prob_raw, win_prob. Throws for fmt "test"/unknown.
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
export const getFormat = get_format;
export const parseScoreString = parse_score_string;
export const cricketMatchState = cricket_match_state;
export const cricketWinProbability = cricket_win_probability;

// ---- expected runs + WPA (port of sdv-py cricket_wpa.py) --------------------
export interface CricketExpectedRuns extends CricketWinProb {
  exp_runs_remaining: number;
  exp_run_rate: number | null;
}

export interface CricketWpa extends CricketWinProb {
  win_prob_before: number | null;
  wpa_batting: number;
  wpa_bowling: number;
}

/** Projected runs still to come (proj_final - runs, floored at 0) and per-over rate (null when no overs left). */
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
 * Batting/bowling win-probability added: wpa_batting = win_prob - previous
 * win_prob within the same (event_id, innings_number) (0 for the first state),
 * wpa_bowling = -wpa_batting. Rows are returned sorted by
 * event_id, innings_number, balls_bowled (stable; polars' sort is unspecified on ties).
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

export const cricketExpectedRuns = cricket_expected_runs;
export const cricketWpa = cricket_wpa;
