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
/**
 * Python `ValueError` raised by the odds math (a zero American price, a decimal price
 * `<= 1`, a log of a non-positive odds ratio, an unknown devig method, a non-bracketing
 * Shin solver).
 *
 * @remarks `name` is `'ValueError'` so it compares equal to the sdv-py error type;
 * the class extends {@link SdvError}. Also exposed as `oddsErrors.ValueError`.
 */
export class OddsValueError extends SdvError {
  override name = 'ValueError';
}
/**
 * Python `ZeroDivisionError` raised by the odds math (raw probabilities summing to 0,
 * `sigma` of 0, a probability of exactly 1 in {@link logit_blend}).
 *
 * @remarks `name` is `'ZeroDivisionError'`; also exposed as `oddsErrors.ZeroDivisionError`.
 */
export class OddsZeroDivisionError extends SdvError {
  override name = 'ZeroDivisionError';
}
/**
 * Python `OverflowError` raised when `exp(-logit)` overflows to Infinity from a finite
 * logit in {@link logit_blend}.
 *
 * @remarks `name` is `'OverflowError'`; also exposed as `oddsErrors.OverflowError`.
 */
export class OddsOverflowError extends SdvError {
  override name = 'OverflowError';
}
/**
 * Python `RuntimeError` raised when the Shin root solver (a port of scipy's `brentq`)
 * fails to converge within 100 iterations.
 *
 * @remarks `name` is `'RuntimeError'`; also exposed as `oddsErrors.RuntimeError`.
 */
export class OddsRuntimeError extends SdvError {
  override name = 'RuntimeError';
}

// Python `sum()` of floats: CPython 3.12+ Neumaier (improved Kahan-Babuska) compensated
// summation, ported from bltinmodule.c (incl. its finite-compensation guard).
const sum = (xs: readonly number[]): number => {
  let result = 0;
  let c = 0;
  for (const x of xs) {
    const t = result + x;
    if (Math.abs(result) >= Math.abs(x)) c += result - t + x;
    else c += x - t + result;
    result = t;
  }
  return c !== 0 && Number.isFinite(c) ? result + c : result;
};

/**
 * Raw (vig-included) implied probability of an American moneyline price (py `prob_from_american`).
 *
 * @param price - American price: negative for a favourite (`-150` -> 0.6), positive for an
 *   underdog (`+130` -> 100 / 230). Must not be `0`.
 * @returns The implied probability in (0, 1): `-p / (-p + 100)` for `p < 0`, else `100 / (p + 100)`.
 * @throws OddsValueError When `price` is `0`.
 * @remarks Not devigged; pass the raw pair through {@link devig_multiplicative} /
 *   {@link devig_shin} or use {@link moneyline_pair_prob}. A NaN price propagates NaN.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.prob_from_american(-150); // 0.6
 * sdv.odds.probFromAmerican(130);    // 0.4347826...
 * ```
 */
export function prob_from_american(price: number): number {
  if (price === 0) throw new OddsValueError('American price cannot be 0');
  const p = Number(price);
  return p < 0 ? -p / (-p + 100) : 100 / (p + 100);
}

/**
 * Raw (vig-included) implied probability of a decimal price (py `prob_from_decimal`).
 *
 * @param price - Decimal (European) price; must be strictly greater than `1`.
 * @returns `1 / price`.
 * @throws OddsValueError When `price <= 1`.
 * @remarks A NaN price is not rejected by the `<= 1` check and yields NaN.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.prob_from_decimal(2.5); // 0.4
 * ```
 */
export function prob_from_decimal(price: number): number {
  if (price <= 1) throw new OddsValueError('Decimal price must be > 1');
  return 1.0 / Number(price);
}

/**
 * Vig removal by normalizing raw implied probabilities to sum to 1, order preserved
 * (py `devig_multiplicative`).
 *
 * @param p_raw - Raw implied probabilities of every outcome of one market (e.g. from
 *   {@link prob_from_american}). An empty array returns an empty array.
 * @returns A new array, `p_raw[i] / sum(p_raw)` for each outcome.
 * @throws OddsZeroDivisionError When `p_raw` is non-empty and sums to `0`.
 * @remarks The sum is Python 3.12+ compensated (Neumaier) summation, so results match
 *   sdv-py's `sum()` to ~1e-12. NaN inputs propagate NaN.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.devig_multiplicative([0.6, 0.4347826086956522]); // [0.5798..., 0.4201...]
 * ```
 */
export function devig_multiplicative(p_raw: readonly number[]): number[] {
  const total = sum(p_raw);
  if (p_raw.length > 0 && total === 0) throw new OddsZeroDivisionError('float division by zero');
  return p_raw.map((p) => p / total);
}

// Node: process warning; other runtimes: console.warn. Once per distinct message per
// process, like Python's default filter (once per site + text; each call site is distinct).
const warned = new Set<string>();
const warn = (msg: string): void => {
  if (warned.has(msg)) return;
  warned.add(msg);
  if (typeof process !== 'undefined' && typeof process.emitWarning === 'function') process.emitWarning(msg, 'SdvWarning');
  else console.warn(msg);
};

// sign bit incl. -0, as C `signbit`
const signbit = (x: number): boolean => x < 0 || Object.is(x, -0);

/**
 * scipy.optimize.brentq (C implementation) with scipy's defaults except xtol:
 * rtol = 4*eps, maxiter = 100. Raises ValueError on a non-bracketing interval
 * (or any NaN function value) and RuntimeError on non-convergence, like scipy.
 */
function brentq(f0: (x: number) => number, xa: number, xb: number, xtol: number): number {
  // scipy >= 1.x: a NaN from f at ANY evaluation is a ValueError ("solver cannot continue").
  const f = (x: number): number => {
    const v = f0(x);
    if (Number.isNaN(v)) throw new OddsValueError(`The function value at x=${x} is NaN; solver cannot continue.`);
    return v;
  };
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
  if (signbit(fpre) === signbit(fcur)) {
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
 * Vig removal with Shin's (1993) insider-trading method (py `devig_shin`).
 *
 * Solves for the insider share `z` at which the Shin probabilities sum to 1 (a port of
 * scipy's `brentq` on `[0, 1 - 1e-9]`, `xtol = 1e-12`), then renormalizes.
 *
 * @param p_raw - Raw implied probabilities of every outcome of one market.
 * @returns A new array of devigged probabilities in `p_raw` order, summing to 1.
 * @throws OddsZeroDivisionError When the booksum is `<= 1` and the multiplicative fallback
 *   divides by a zero sum (non-empty `p_raw`).
 * @throws OddsRuntimeError When the root solver does not converge in 100 iterations.
 * @remarks With booksum (overround) `<= 1` this reduces to {@link devig_multiplicative}.
 *   If the solver cannot bracket a root (or hits a NaN) it warns
 *   `Shin solver failed to bracket (...)` (a Node process warning named `SdvWarning`,
 *   `console.warn` elsewhere) **once per distinct message per process** and falls back to
 *   the multiplicative method, as sdv-py warns.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.devig_shin([0.6, 0.4347826086956522]); // [0.58..., 0.41...], sums to 1
 * ```
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

/**
 * Home win probability from a point spread: `Phi(spread / sigma)` (py `spread_to_prob`).
 *
 * @param spread - Expected HOME margin in points; positive = home favoured (the negative of
 *   the quoted home line).
 * @param sigma - Standard deviation of the margin in points; must not be `0`.
 * @returns The standard-normal CDF of `spread / sigma`, a HOME win probability in [0, 1].
 * @throws OddsZeroDivisionError When `sigma` is `0`.
 * @remarks The CDF is the Hart 1968 / West 2005 double-precision algorithm (~1e-15).
 *   NaN propagates; `|x| > 37` saturates to exactly 0 / 1.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.spread_to_prob(3, 13.5); // 0.5878...
 * ```
 */
export function spread_to_prob(spread: number, sigma: number): number {
  if (sigma === 0) throw new OddsZeroDivisionError('float division by zero');
  return normCdf(spread / sigma);
}

const pyLog = (x: number): number => {
  if (x <= 0) throw new OddsValueError('math domain error');
  return Math.log(x);
};

/**
 * Blend two probabilities in logit space, nfelo's 70/30 practice (py `logit_blend`).
 *
 * @param p_a - First probability, strictly inside (0, 1).
 * @param p_b - Second probability, strictly inside (0, 1).
 * @param weight_a - Weight on `p_a`'s logit; `p_b` gets `1 - weight_a`. Default `0.7`.
 * @returns `sigmoid(weight_a * logit(p_a) + (1 - weight_a) * logit(p_b))`.
 * @throws OddsZeroDivisionError When `p_a` or `p_b` is exactly `1` (odds ratio divides by 0).
 * @throws OddsValueError When an odds ratio is `<= 0` (a probability `<= 0` or `> 1`),
 *   Python's `math domain error`.
 * @throws OddsOverflowError When `exp(-logit)` overflows to Infinity from a finite blended
 *   logit, Python's `math range error`.
 * @remarks Error triggers mirror CPython's `math.log` / `math.exp`; NaN propagates.
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.logit_blend(0.6, 0.5);       // 0.5705...
 * sdv.odds.logit_blend(0.6, 0.5, 0.5);  // equal weights
 * ```
 */
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

/**
 * Vig-removed HOME win probability from a two-way American moneyline pair
 * (py `moneyline_pair_prob`).
 *
 * @param home_price - Home American price (non-zero).
 * @param away_price - Away American price (non-zero).
 * @param method - Devig method: `'multiplicative'` (default, {@link devig_multiplicative})
 *   or `'shin'` ({@link devig_shin}).
 * @returns The home outcome's devigged probability (element 0 of the devigged pair).
 * @throws OddsValueError When either price is `0`, or `method` is not one of the two names.
 * @throws OddsZeroDivisionError When the raw pair sums to `0` (via the devig).
 * @throws OddsRuntimeError When `method === 'shin'` and the solver fails to converge.
 * @remarks `'shin'` may emit the once-per-process Shin fallback warning (see {@link devig_shin}).
 * @example
 * ```ts
 * import sdv from 'sportsdataverse';
 * sdv.odds.moneyline_pair_prob(-150, 130);         // 0.5798...
 * sdv.odds.moneyline_pair_prob(-150, 130, 'shin'); // Shin-devigged
 * ```
 */
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

/**
 * The odds error classes keyed by their Python names, mounted as `sdv.odds.errors`.
 *
 * @remarks Lets callers write `e instanceof sdv.odds.errors.ValueError` without importing
 *   the `Odds*` classes from the package root.
 */
export const oddsErrors = { ValueError: OddsValueError, ZeroDivisionError: OddsZeroDivisionError, OverflowError: OddsOverflowError, RuntimeError: OddsRuntimeError };

/**
 * Every odds math function under both its sdv-py snake_case name and a camelCase alias;
 * spread onto `sdv.odds` by `src/index.ts`.
 *
 * @remarks Pure functions, no I/O; each alias is the same function object as its
 *   snake_case original.
 */
export const oddsMath = {
  prob_from_american, probFromAmerican: prob_from_american,
  prob_from_decimal, probFromDecimal: prob_from_decimal,
  devig_multiplicative, devigMultiplicative: devig_multiplicative,
  devig_shin, devigShin: devig_shin,
  spread_to_prob, spreadToProb: spread_to_prob,
  logit_blend, logitBlend: logit_blend,
  moneyline_pair_prob, moneylinePairProb: moneyline_pair_prob,
};
