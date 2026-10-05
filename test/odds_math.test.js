import should from 'should';
import { readFileSync } from 'node:fs';
import sdv from '../dist/index.js';
import * as m from '../dist/odds/math.js';
import { SdvError, OddsValueError, OddsZeroDivisionError } from '../dist/index.js';

const oracle = JSON.parse(readFileSync(new URL('./fixtures/odds/odds_math_oracle.json', import.meta.url)));
const rows = JSON.parse(readFileSync(new URL('./fixtures/odds/h2h_rows.json', import.meta.url))).rows;

// Parity tolerance vs sdv-py at the pin (abs). Differences come only from libm/erfc
// implementations and Python>=3.12 compensated sum(); everything else is the same algorithm.
const TOL = 1e-12;
const dec = (x) => ({ NaN: NaN, Infinity: Infinity, '-Infinity': -Infinity })[x] ?? x;
const decAll = (v) => (Array.isArray(v) ? v.map(decAll) : dec(v));

const close = (got, want, ctx) => {
  if (Array.isArray(want)) {
    got.length.should.equal(want.length, ctx);
    want.forEach((w, i) => close(got[i], w, ctx));
  } else if (Number.isNaN(want)) {
    Number.isNaN(got).should.equal(true, `${ctx}: want NaN got ${got}`);
  } else if (!Number.isFinite(want)) {
    got.should.equal(want, ctx);
  } else {
    Math.abs(got - want).should.be.belowOrEqual(TOL, `${ctx}: got ${got} want ${want}`);
  }
};

describe('odds/math: parity with sdv-py wexp.market', () => {
  it('oracle provenance is the pinned sdv-py', () => {
    oracle.provenance.sdv_py_pin.should.equal('719de79edb685b89c524f8b4c0c146fea0b53855');
  });

  for (const [name, cases] of Object.entries(oracle.cases)) {
    it(`${name}: ${cases.length} oracle cases (values and error types)`, () => {
      const orig = process.emitWarning;
      const emitted = new Set();
      process.emitWarning = (msg) => { if (/Shin solver failed/.test(msg)) { emitted.has(msg).should.equal(false, 'duplicate warning'); emitted.add(msg); } };
      let warnWant = 0;
      try {
        for (const c of cases) {
          const args = c.args.map(decAll);
          const ctx = `${name}(${JSON.stringify(c.args)})`;
          if (c.error) {
            (() => m[name](...args)).should.throw({ name: c.error });
          } else {
            close(m[name](...args), decAll(c.value), ctx);
          }
          if (c.warned) warnWant++;
        }
      } finally {
        process.emitWarning = orig;
      }
      // py warns where JS warns (Shin bracketing failure -> multiplicative fallback), but
      // once per distinct message per process (py default filter), not once per call
      // devig_shin is the first suite to reach each message, so there parity is exact in presence
      if (name === 'devig_shin') (emitted.size > 0).should.equal(warnWant > 0);
      emitted.size.should.be.belowOrEqual(warnWant);
    });
  }

  it('devig_multiplicative is BIT-exact vs py (3.13 compensated sum), incl. cancellation-prone books', () => {
    for (const c of oracle.cases.devig_multiplicative) {
      if (c.error) continue;
      const got = m.devig_multiplicative(decAll(c.args[0]));
      const want = decAll(c.value);
      got.length.should.equal(want.length);
      want.forEach((w, i) => Object.is(got[i], w).should.equal(true, `${JSON.stringify(c.args)}[${i}]: got ${got[i]} want ${w}`));
    }
    m.devig_multiplicative([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]).forEach((p) => p.should.equal(0.1));
  });

  it('warns once per distinct message per process (py default filter), not per call', () => {
    const orig = process.emitWarning;
    const got = [];
    process.emitWarning = (msg) => got.push(msg);
    try {
      for (let i = 0; i < 3; i++) m.devig_shin([3.3e300, 1e300]);
      for (let i = 0; i < 3; i++) m.devig_shin([4.4e300, 1e300]);
    } finally {
      process.emitWarning = orig;
    }
    got.length.should.equal(2);
  });

  it('real The Odds API h2h rows are present and drive the oracle', () => {
    rows.length.should.be.greaterThan(100);
    oracle.cases.devig_shin.length.should.be.greaterThan(rows.length / 2);
  });
});

describe('odds/math: properties and edge cases', () => {
  it('even odds', () => {
    m.prob_from_american(100).should.equal(0.5);
    m.prob_from_american(-100).should.equal(0.5);
    m.prob_from_decimal(2).should.equal(0.5);
    m.moneyline_pair_prob(-110, -110).should.be.approximately(0.5, 1e-15);
  });
  it('zero / invalid prices raise like python', () => {
    (() => m.prob_from_american(0)).should.throw({ name: 'ValueError' });
    (() => m.prob_from_decimal(1)).should.throw({ name: 'ValueError' });
    (() => m.moneyline_pair_prob(-110, 100, 'power')).should.throw({ name: 'ValueError' });
    (() => m.spread_to_prob(3, 0)).should.throw({ name: 'ZeroDivisionError' });
    (() => m.devig_multiplicative([0, 0])).should.throw({ name: 'ZeroDivisionError' });
    m.devig_multiplicative([]).should.eql([]);
    Number.isNaN(m.prob_from_american(NaN)).should.equal(true);
  });
  it('devig methods sum to 1 on every real h2h row (multi-outcome incl. 3-way soccer)', () => {
    let three = 0;
    for (const r of rows) {
      const raw = r.outcomes.map((o) => m.prob_from_american(o.price));
      if (raw.length === 3) three++;
      for (const f of [m.devig_multiplicative, m.devig_shin]) {
        f(raw).reduce((a, b) => a + b, 0).should.be.approximately(1, 1e-9);
      }
    }
    three.should.be.greaterThan(0);
  });
  it('shin shifts overround toward longshots vs multiplicative', () => {
    const raw = [0.85, 0.25];
    m.devig_shin(raw)[1].should.be.lessThan(m.devig_multiplicative(raw)[1]);
  });
  it('logit_blend: weight endpoints and symmetry', () => {
    m.logit_blend(0.61, 0.64, 1).should.be.approximately(0.61, 1e-12);
    m.logit_blend(0.61, 0.64, 0).should.be.approximately(0.64, 1e-12);
    m.logit_blend(0.3, 0.7, 0.5).should.be.approximately(0.5, 1e-12);
  });
  it('spread_to_prob is monotone and symmetric', () => {
    m.spread_to_prob(0, 13.45).should.be.approximately(0.5, 1e-15);
    (m.spread_to_prob(7, 13.45) + m.spread_to_prob(-7, 13.45)).should.be.approximately(1, 1e-15);
    m.spread_to_prob(10, 13.45).should.be.greaterThan(m.spread_to_prob(3, 13.45));
  });
});

describe('odds/math: sdv.odds surface', () => {
  it('errors extend SdvError, keep python names, and are exported', () => {
    let e;
    try { m.prob_from_american(0); } catch (x) { e = x; }
    e.should.be.instanceOf(SdvError).and.instanceOf(OddsValueError);
    e.name.should.equal('ValueError');
    try { m.spread_to_prob(1, 0); } catch (x) { e = x; }
    e.should.be.instanceOf(SdvError).and.instanceOf(OddsZeroDivisionError);
    e.name.should.equal('ZeroDivisionError');
    sdv.odds.errors.ValueError.should.equal(OddsValueError);
  });
  it('exposes py snake_case and camelCase names', () => {
    for (const n of ['prob_from_american', 'prob_from_decimal', 'devig_multiplicative', 'devig_shin', 'spread_to_prob', 'logit_blend', 'moneyline_pair_prob']) {
      sdv.odds[n].should.be.a.Function();
      sdv.odds[n.replace(/_([a-z])/g, (_x, c) => c.toUpperCase())].should.equal(sdv.odds[n]);
    }
    sdv.odds.probFromAmerican(-110).should.be.approximately(0.5238095238, 1e-9);
  });
});
