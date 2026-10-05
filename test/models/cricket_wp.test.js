import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sdv from '../../dist/index.js';
import {
  cricket_match_state,
  cricket_win_probability,
  parse_score_string,
  get_format,
  norm_cdf,
  cricket_expected_runs,
  cricket_wpa,
} from '../../dist/models/cricket_wp.js';

const fx = (f) =>
  JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'cricket', f), 'utf8'));
const oracle = fx('py_oracle_cricket_wp.json');

// Tolerance: 1e-12 absolute. The only non-bit-exact piece is Phi (scipy ndtr vs.
// our series / continued fraction, ~1e-16 abs); interp slopes can amplify that
// by at most the (bounded) isotonic slope, so 1e-12 leaves >3 orders of margin.
const TOL = 1e-12;
const COLS = ['overs_left', 'wickets_left', 'resources_left', 'proj_final', 'win_prob_raw', 'win_prob'];

function checkRows(got, want, label) {
  got.length.should.equal(want.length, label);
  let maxd = 0;
  got.forEach((g, i) => {
    for (const c of COLS) {
      const d = Math.abs(g[c] - want[i][c]);
      if (!(d <= TOL)) throw new Error(`${label}[${i}].${c}: js=${g[c]} py=${want[i][c]} d=${d}`);
      maxd = Math.max(maxd, d);
    }
  });
  return maxd;
}

describe('models/cricket_wp (parity with sdv-py 719de79)', () => {
  it('parse_score_string matches py cases', () => {
    parse_score_string('161/5 (18/20 ov, target 156)').should.eql([161, 5, 108, 156]);
    parse_score_string('88/3 (12.4/20 ov)').should.eql([88, 3, 76, null]);
    parse_score_string('168/7 (20 ov)').should.eql([168, 7, 120, null]);
    should(parse_score_string('no score yet')).be.null();
    should(parse_score_string(null)).be.null();
  });

  it('get_format: case-insensitive; test + unknown throw', () => {
    get_format(' T20 ').balls_total.should.equal(120);
    get_format('odi').par_score.should.equal(248.7);
    (() => get_format('test')).should.throw(/deferred/);
    (() => get_format('hundred')).should.throw(/Unknown cricket format/);
  });

  it('norm_cdf is accurate to 1e-15 on known values', () => {
    norm_cdf(0).should.equal(0.5);
    Math.abs(norm_cdf(1.96) - 0.9750021048517795).should.be.below(1e-15);
    Math.abs(norm_cdf(-3.5) / 0.00023262907903552504 - 1).should.be.below(1e-13);
    Math.abs(norm_cdf(-5) / 2.866515718791939e-7 - 1).should.be.below(1e-13);
    Math.abs(norm_cdf(-6) - 9.865876450376946e-10).should.be.below(1e-22);
    norm_cdf(40).should.equal(1);
  });

  it('norm_cdf: far-left tail is relative-accurate (scipy.stats.norm.cdf 1.18 oracle + 60-digit truth)', () => {
    // rows: [x, 60-digit-decimal truth (x <= -1.5 only, else null), scipy norm.cdf]
    const rows = fx('norm_cdf_oracle.json');
    rows.length.should.be.above(500);
    let worstScipy = 0;
    let worstTruth = 0;
    for (const [x, truth, scipy] of rows) {
      const got = norm_cdf(x);
      if (scipy > 0) worstScipy = Math.max(worstScipy, Math.abs(got / scipy - 1));
      else got.should.be.below(1e-300);
      if (truth) worstTruth = Math.max(worstTruth, Math.abs(got / truth - 1));
    }
    worstScipy.should.be.below(2e-13); // scipy itself is ~6e-14 off truth at x<=-20 (unsplit exp(-z*z))
    worstTruth.should.be.below(2e-15); // was 1.8e-11 before the erfc/CF fix
    Number.isNaN(norm_cdf(NaN)).should.equal(true);
    norm_cdf(-9).should.be.approximately(1.1285884059538324e-19, 1e-31);
  });

  it('match state from the real ESPN IPL capture equals py (summary header + scoreboard event)', () => {
    const summary = cricket_match_state(fx('espn_ipl_8048_summary_header.json'), { fmt: 't20' });
    summary.should.eql(oracle.espn.summary.state);
    const sb = cricket_match_state(fx('espn_ipl_8048_scoreboard.json').events[0], { fmt: 't20' });
    sb.should.eql(oracle.espn.scoreboard_event0.state);
    summary.length.should.be.above(0);
  });

  it('win probability on the ESPN capture equals py', () => {
    const st = cricket_match_state(fx('espn_ipl_8048_summary_header.json'), { fmt: 't20' });
    checkRows(cricket_win_probability(st), oracle.espn.summary.wp, 'espn');
  });

  it('win probability on real Cricsheet holdout states equals py (686 rows, T20 + ODI, set + chase + terminal)', () => {
    const { state, wp } = oracle.holdout;
    state.length.should.be.above(500);
    new Set(state.map((s) => s.fmt)).size.should.equal(2);
    const got = cricket_win_probability(state);
    const maxd = checkRows(got, wp, 'holdout');
    maxd.should.be.below(TOL);
    // terminal overrides are exercised
    got.some((r) => r.win_prob === 1).should.be.true();
    got.some((r) => r.win_prob === 0).should.be.true();
  });

  it('is exposed on sdv.cricket (snake + camel) and throws for test cricket', () => {
    sdv.cricket.cricket_win_probability.should.equal(cricket_win_probability);
    sdv.cricket.cricketMatchState.should.equal(cricket_match_state);
    sdv.cricket.cricket_wpa.should.equal(cricket_wpa);
    sdv.cricket.cricketWpa.should.equal(cricket_wpa);
    sdv.cricket.cricketExpectedRuns.should.equal(cricket_expected_runs);
    (() => cricket_match_state({}, { fmt: 'test' })).should.throw(/deferred/);
    cricket_win_probability([]).should.eql([]);
  });

  describe('expected runs + WPA (py cricket_wpa.py)', () => {
    const { state, wp, expected_runs, wpa } = oracle.wpa;
    const near = (a, b, l) => {
      if (b === null) return should(a).be.null();
      if (!(Math.abs(a - b) <= TOL)) throw new Error(`${l}: js=${a} py=${b}`);
    };

    it('win-prob chain on the shuffled real WPA-holdout matches py', () => {
      checkRows(cricket_win_probability(state), wp, 'wpa-wp');
    });

    it('cricket_expected_runs equals py (floor at 0, null rate when no overs left)', () => {
      const got = cricket_expected_runs(cricket_win_probability(state));
      got.length.should.equal(expected_runs.length);
      got.forEach((g, i) => {
        near(g.exp_runs_remaining, expected_runs[i].exp_runs_remaining, `er[${i}]`);
        near(g.exp_run_rate, expected_runs[i].exp_run_rate, `rate[${i}]`);
      });
      got.some((g) => g.exp_run_rate === null).should.be.true();
    });

    it('cricket_wpa equals py (sorted, per-innings lead, first state 0, bowling = -batting)', () => {
      const got = cricket_wpa(cricket_win_probability(state));
      got.length.should.equal(wpa.length);
      got.forEach((g, i) => {
        g.event_id.should.equal(wpa[i].event_id);
        g.balls_bowled.should.equal(wpa[i].balls_bowled);
        near(g.win_prob_before, wpa[i].win_prob_before, `before[${i}]`);
        near(g.wpa_batting, wpa[i].wpa_batting, `wpa[${i}]`);
        near(g.wpa_bowling, wpa[i].wpa_bowling, `wpab[${i}]`);
      });
      got.filter((g) => g.win_prob_before === null).length.should.be.above(10);
    });

    it('empty inputs return empty arrays', () => {
      cricket_expected_runs([]).should.eql([]);
      cricket_wpa([]).should.eql([]);
    });
  });
});
