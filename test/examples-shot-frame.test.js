import 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEndpoint } from '../dist/parsers/index.js';

// The ESPN basketball shot frame the examples / tutorials state (02_nba_pbp_shots.mjs,
// 90_sdvplot_shot_chart.mjs): coordinate_x = feet across the court with the hoop at 25,
// coordinate_y = feet from the HOOP toward half court (hoop at y ≈ 0–1, not the 5.25 ft
// baseline), free throws carry a sentinel. It was fitted on four captures; this holds the
// one committed capture (401585607, ORL vs TOR 2024-03-17) to it, the way the fit was done:
// every shooting play whose text carries ESPN's own "N-foot" distance must reproduce N.

const root = fileURLToPath(new URL('..', import.meta.url));
const raw = JSON.parse(readFileSync(root + 'test/fixtures/espn/summary_nba.json', 'utf8'));
const plays = parseEndpoint('espn', 'summary', raw, 'plays');

const HOOP = { x: 25, y: 1 }; // the constant the scripts use = the fitted position (see below)
const dist = (p, hoop = HOOP) => Math.hypot(p.coordinate_x - hoop.x, p.coordinate_y - hoop.y);
const sorted = (a) => a.slice().sort((x, y) => x - y);
const quantile = (a, f) => sorted(a)[Math.floor((a.length - 1) * f)];

const shooting = plays.filter((p) => p.shooting_play);
const sentinel = shooting.filter((p) => p.coordinate_x < -100);
const shots = shooting.filter((p) => p.coordinate_x > -100 && !/free throw/i.test(p.text));

describe('examples: the ESPN basketball shot frame (summary_nba.json, 401585607)', () => {
  it('has the shots the scripts work on', () => {
    plays.length.should.equal(450);
    shots.length.should.be.above(150);
  });

  it('free throws carry the sentinel and are the only rows dropped by the coordinate filter', () => {
    sentinel.length.should.be.above(0);
    sentinel.forEach((p) => /free throw/i.test(p.text).should.be.true(p.text));
    [...new Set(sentinel.map((p) => `${p.coordinate_x},${p.coordinate_y}`))].should.eql(['-214748340,-214748365']);
    shooting.filter((p) => !/free throw/i.test(p.text) && p.coordinate_x < -100).should.be.empty();
  });

  it('reproduces the "N-foot" distance ESPN writes into each play (MAE ≤ 0.4 ft from hoop (25, 1))', () => {
    const measured = shots
      .map((p) => ({ p, n: Number((/(\d+)-foot/.exec(p.text) || [])[1]) }))
      .filter(({ n }) => Number.isFinite(n));
    measured.length.should.be.above(80);
    const errs = measured.map(({ p, n }) => Math.abs(dist(p) - n));
    // measured 0.32 ft (ESPN's N is an integer, so ≤ 0.5 is the rounding floor); 78% match exactly
    (errs.reduce((a, b) => a + b, 0) / errs.length).should.be.belowOrEqual(0.4);
    sorted(errs)[errs.length - 1].should.be.belowOrEqual(1.5);
    (measured.filter(({ p, n }) => Math.round(dist(p)) === n).length / measured.length).should.be.aboveOrEqual(0.7);
    // the baseline-origin hypothesis (hoop 5.25 ft up the court) is clearly worse
    const baseline = measured.map(({ p, n }) => Math.abs(dist(p, { x: 25, y: 5.25 }) - n));
    (baseline.reduce((a, b) => a + b, 0) / baseline.length).should.be.above(1.5);
  });

  it('y = 1 is the best hoop position (not the 5.25 ft baseline)', () => {
    const measured = shots
      .map((p) => ({ p, n: Number((/(\d+)-foot/.exec(p.text) || [])[1]) }))
      .filter(({ n }) => Number.isFinite(n));
    const mae = (y) => measured.reduce((a, { p, n }) => a + Math.abs(dist(p, { x: 25, y }) - n), 0) / measured.length;
    const best = [0, 0.5, 1, 1.5, 2, 3, 5.25].reduce((b, y) => (mae(y) < mae(b) ? y : b), 0);
    best.should.equal(1);
  });

  it('three-point attempts are ≥ 22 ft out; dunks / layups / tips cluster at the rim', () => {
    const threes = shots.filter((p) => p.points_attempted === 3).map((p) => dist(p));
    threes.length.should.be.above(30);
    sorted(threes)[0].should.be.aboveOrEqual(22); // a corner three is 22.0 ft
    const rim = shots.filter((p) => /dunk|layup|tip/i.test(p.text)).map((p) => dist(p));
    rim.length.should.be.above(20);
    quantile(rim, 0.5).should.be.belowOrEqual(5);
    quantile(rim, 0.9).should.be.belowOrEqual(5); // ESPN labels a few "6-foot" / "7-foot" layups itself
  });

  it('both teams share one basket every period (no per-period side flip to undo)', () => {
    for (const period of new Set(shots.map((p) => p.period_number))) {
      const inPeriod = shots.filter((p) => p.period_number === period);
      // every shot of every team sits on the hoop's half: y below ~31 ft (half court), never mirrored past it
      inPeriod.forEach((p) => p.coordinate_y.should.be.below(47 - 5.25, `${p.text} y=${p.coordinate_y}`));
      new Set(inPeriod.map((p) => p.team_id)).size.should.equal(2);
    }
  });
});
