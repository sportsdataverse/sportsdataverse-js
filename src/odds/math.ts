/**
 * Odds / market math — faithful port of sdv-py `sportsdataverse.wexp.market`
 * (pin 719de79edb685b89c524f8b4c0c146fea0b53855).
 *
 * Prices -> implied probabilities, vig removal (multiplicative default, Shin as
 * the sensitivity check), the spread -> win-probability normal-CDF map and the
 * nfelo-style logit-space blend. Pure functions, no I/O.
 *
 * Conventions: `spread` is the expected HOME margin (positive = home favored);
 * all probabilities are HOME win probabilities unless noted.
 *
 * Error behaviour mirrors Python: ValueError / ZeroDivisionError / OverflowError
 * where Python raises them (same trigger conditions), NaN propagates where
 * Python's float arithmetic propagates it.
 */

import { SdvError } from '../core/errors.js';

// Python-named errors (`name` stays 'ValueError' etc. so py error types can be compared);
// the classes carry an `Odds` prefix to avoid generic-name collisions and extend SdvError.
export class OddsValueError extends SdvError {
  override name = 'ValueError';
}
export class OddsZeroDivisionError extends SdvError {
  override name = 'ZeroDivisionError';
}
export class OddsOverflowError extends SdvError {
  override name = 'OverflowError';
}
export class OddsRuntimeError extends SdvError {
  override name = 'RuntimeError';
}

// Python `sum()` of floats (3.12+ is compensated; ~1ulp from naive, inside parity tolerance).
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

/** Raw implied probability of an American price. Raises ValueError on 0. */
export function prob_from_american(price: number): number {
  if (price === 0) throw new OddsValueError('American price cannot be 0');
  const p = Number(price);
  return p < 0 ? -p / (-p + 100) : 100 / (p + 100);
}

/** Raw implied probability of a decimal price (> 1). Raises ValueError otherwise. */
export function prob_from_decimal(price: number): number {
  if (price <= 1) throw new OddsValueError('Decimal price must be > 1');
  return 1.0 / Number(price);
}

/** Vig removal by normalizing raw implied probabilities to sum to 1 (order preserved). */
export function devig_multiplicative(p_raw: readonly number[]): number[] {
  const total = sum(p_raw);
  if (p_raw.length > 0 && total === 0) throw new OddsZeroDivisionError('float division by zero');
  return p_raw.map((p) => p / total);
}

// Node: process warning; other runtimes: console.warn.
const warn = (msg: string): void => {
  if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') process.emitWarning(msg, 'SdvWarning');
  else console.warn(msg);
};

// sign bit incl. -0, as C `signbit`
const signbit = (x: number): boolean => x < 0 || Object.is(x, -0);

/**
 * scipy.optimize.brentq (C implementation) with scipy's defaults except xtol:
 * rtol = 4*eps, maxiter = 100. Raises ValueError on a non-bracketing interval
 * (or NaN endpoint values) and RuntimeError on non-convergence, like scipy.
 */
function brentq(f: (x: number) => number, xa: number, xb: number, xtol: number): number {
  const rtol = 4 * 2.220446049250313e-16;
  const maxiter = 100;
  let xpre = xa;
  let xcur = xb;
  let xblk = 0;
  let fpre = f(xpre);
  let fcur = f(xcur);
  let fblk = 0;
  let spre = 0;
  let scur = 0;
  if (fpre === 0) return xpre;
  if (fcur === 0) return xcur;
  // ponytail: NaN endpoint values are treated as a sign error (C signbit of a NaN is platform-defined).
  if (Number.isNaN(fpre) || Number.isNaN(fcur) || signbit(fpre) === signbit(fcur)) {
    throw new OddsValueError('f(a) and f(b) must have different signs');
  }
  for (let i = 0; i < maxiter; i++) {
    if (fpre !== 0 && fcur !== 0 && signbit(fpre) !== signbit(fcur)) {
      xblk = xpre;
      fblk = fpre;
      spre = scur = xcur - xpre;
    }
    if (Math.abs(fblk) < Math.abs(fcur)) {
      xpre = xcur; xcur = xblk; xblk = xpre;
      fpre = fcur; fcur = fblk; fblk = fpre;
    }
    const delta = (xtol + rtol * Math.abs(xcur)) / 2;
    const sbis = (xblk - xcur) / 2;
    if (fcur === 0 || Math.abs(sbis) < delta) return xcur;
    if (Math.abs(spre) > delta && Math.abs(fcur) < Math.abs(fpre)) {
      let stry: number;
      if (xpre === xblk) {
        stry = (-fcur * (xcur - xpre)) / (fcur - fpre);
      } else {
        const dpre = (fpre - fcur) / (xpre - xcur);
        const dblk = (fblk - fcur) / (xblk - xcur);
        stry = (-fcur * (fblk * dblk - fpre * dpre)) / (dblk * dpre * (fblk - fpre));
      }
      if (2 * Math.abs(stry) < Math.min(Math.abs(spre), 3 * Math.abs(sbis) - delta)) {
        spre = scur; scur = stry;
      } else {
        spre = sbis; scur = sbis;
      }
    } else {
      spre = sbis; scur = sbis;
    }
    xpre = xcur;
    fpre = fcur;
    xcur += Math.abs(scur) > delta ? scur : sbis > 0 ? delta : -delta;
    fcur = f(xcur);
  }
  throw new OddsRuntimeError(`Failed to converge after ${maxiter} iterations`);
}

/**
 * Vig removal with Shin's method (insider-trading model). With overround <= 0
 * it reduces to the multiplicative method. If the solver cannot bracket a root
 * it emits a process warning and falls back to multiplicative (as Python warns).
 */
export function devig_shin(p_raw: readonly number[]): number[] {
  const booksum = sum(p_raw);
  if (booksum <= 1.0) return devig_multiplicative(p_raw);

  // Shin (1993): p_i = (sqrt(z^2 + 4(1-z) pi_i^2 / booksum) - z) / (2(1-z))
  const shinProbs = (z: number): number[] =>
    p_raw.map((p) => (Math.sqrt(z * z + (4 * (1 - z) * (p * p)) / booksum) - z) / (2 * (1 - z)));
  const excess = (z: number): number => sum(shinProbs(z)) - 1.0;

  let zStar: number;
  try {
    zStar = brentq(excess, 0.0, 1.0 - 1e-9, 1e-12);
  } catch (e) {
    if (!(e instanceof OddsValueError)) throw e;
    warn(`Shin solver failed to bracket (booksum=${booksum.toFixed(4)}); falling back to multiplicative devig`);
    return devig_multiplicative(p_raw);
  }
  const probs = shinProbs(zStar);
  const total = sum(probs);
  return probs.map((p) => p / total);
}

// Standard normal CDF, double precision (Hart 1968 / West 2005), ~1e-15.
function normCdf(x: number): number {
  if (Number.isNaN(x)) return NaN;
  const xabs = Math.abs(x);
  let c: number;
  if (xabs > 37) {
    c = 0;
  } else {
    const e = Math.exp((-xabs * xabs) / 2);
    if (xabs < 7.07106781186547) {
      let b = 3.52624965998911e-2 * xabs + 0.700383064443688;
      b = b * xabs + 6.37396220353165;
      b = b * xabs + 33.912866078383;
      b = b * xabs + 112.079291497871;
      b = b * xabs + 221.213596169931;
      b = b * xabs + 220.206867912376;
      let d = 8.83883476483184e-2 * xabs + 1.75566716318264;
      d = d * xabs + 16.064177579207;
      d = d * xabs + 86.7807322029461;
      d = d * xabs + 296.564248779674;
      d = d * xabs + 637.333633378831;
      d = d * xabs + 793.826512519948;
      d = d * xabs + 440.413735824752;
      c = (e * b) / d;
    } else {
      let b = xabs + 0.65;
      b = xabs + 4 / b;
      b = xabs + 3 / b;
      b = xabs + 2 / b;
      b = xabs + 1 / b;
      c = e / b / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

/** P(home win) = Phi(spread / sigma). Raises ZeroDivisionError when sigma is 0. */
export function spread_to_prob(spread: number, sigma: number): number {
  if (sigma === 0) throw new OddsZeroDivisionError('float division by zero');
  return normCdf(spread / sigma);
}

const pyLog = (x: number): number => {
  if (x <= 0) throw new OddsValueError('math domain error');
  return Math.log(x);
};

/** Blend two probabilities in logit space (nfelo's 70/30 practice). */
export function logit_blend(p_a: number, p_b: number, weight_a = 0.7): number {
  const ratio = (p: number): number => {
    if (1 - p === 0) throw new OddsZeroDivisionError('float division by zero');
    return p / (1 - p);
  };
  const la = pyLog(ratio(p_a));
  const lb = pyLog(ratio(p_b));
  const lz = weight_a * la + (1 - weight_a) * lb;
  const ex = Math.exp(-lz);
  if (!Number.isFinite(ex) && Number.isFinite(lz)) throw new OddsOverflowError('math range error');
  return 1 / (1 + ex);
}

/** Vig-removed HOME win probability from a two-way American moneyline pair. */
export function moneyline_pair_prob(
  home_price: number,
  away_price: number,
  method: string = 'multiplicative',
): number {
  const raw = [prob_from_american(home_price), prob_from_american(away_price)];
  if (method === 'multiplicative') return devig_multiplicative(raw)[0];
  if (method === 'shin') return devig_shin(raw)[0];
  throw new OddsValueError(`unknown devig method: '${method}'`);
}

export const oddsErrors = { ValueError: OddsValueError, ZeroDivisionError: OddsZeroDivisionError, OverflowError: OddsOverflowError, RuntimeError: OddsRuntimeError };

export const oddsMath = {
  prob_from_american, probFromAmerican: prob_from_american,
  prob_from_decimal, probFromDecimal: prob_from_decimal,
  devig_multiplicative, devigMultiplicative: devig_multiplicative,
  devig_shin, devigShin: devig_shin,
  spread_to_prob, spreadToProb: spread_to_prob,
  logit_blend, logitBlend: logit_blend,
  moneyline_pair_prob, moneylinePairProb: moneyline_pair_prob,
};
