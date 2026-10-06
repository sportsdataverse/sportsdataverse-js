// 02 — NBA play-by-play → shots with court coordinates.
//
// Shows: the `summary` dispatcher's `plays` sub-frame, and how ESPN encodes shot
// location. The frame below was FITTED on four ESPN basketball captures (NBA
// 401585607, 401430219, 401360428; WNBA 400927398; only the first is committed,
// as test/fixtures/espn/summary_nba.json) by placing the hoop where it best
// reproduces the "N-foot" distance ESPN writes into each play's text (MAE 0.3 ft,
// integer coordinates). test/examples-shot-frame.test.js asserts it on the
// committed capture:
//
//   - coordinate_x: feet ACROSS the court, 0..50; the hoop is at x = 25.
//   - coordinate_y: feet from the HOOP toward half court, -1..~31; the hoop fits
//     at y = 1 on the committed capture (0–1 across the four; not the baseline,
//     which would put it at 5.25). A "23-foot three" from the corner sits at
//     (2, 2); a layup at (25, 2).
//   - BOTH teams are normalised onto the same basket in every period — there is
//     no per-period side flip to undo.
//   - Free throws carry the ESPN "unknown" sentinel (-214748340, -214748365);
//     drop any coordinate < -100 before plotting.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=…
// Offline fixture: test/fixtures/espn/summary_nba.json (ORL vs TOR, 2024-03-17).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const EVENT_ID = 401585607;
const HOOP = { x: 25, y: 1 }; // the fitted position (MAE 0.32 ft on this capture)

const plays = await sdv.nba.espnNbaSummary({ event_id: EVENT_ID, parsed: true, section: 'plays' });
console.log(`${plays.length} plays in the summary`);

const shots = plays
  .filter((p) => p.shooting_play && p.coordinate_x > -100 && !/free throw/i.test(p.text))
  .map((p) => ({
    period: p.period_number,
    clock: p.clock_display_value,
    team_id: p.team_id,
    made: p.scoring_play,
    pts: p.points_attempted,
    x: p.coordinate_x,
    y: p.coordinate_y,
    dist_ft: round(Math.hypot(p.coordinate_x - HOOP.x, p.coordinate_y - HOOP.y), 1),
    text: p.text,
  }));

printTable(shots, ['period', 'clock', 'team_id', 'made', 'pts', 'x', 'y', 'dist_ft', 'text'], 8, 'Field-goal attempts with coordinates');

// Sanity check of the convention: threes should be ≥ ~22 ft from the hoop, rim
// attempts (dunks / layups / tips) within a few feet.
const bucket = (label, pred) => {
  const d = shots.filter(pred).map((s) => s.dist_ft).sort((a, b) => a - b);
  return { shot_type: label, n: d.length, min_ft: d[0], median_ft: d[d.length >> 1], max_ft: d[d.length - 1] };
};
printTable(
  [
    bucket('three (points_attempted = 3)', (s) => s.pts === 3),
    bucket('rim (dunk / layup / tip)', (s) => /dunk|layup|tip/i.test(s.text)),
    bucket('other two', (s) => s.pts === 2 && !/dunk|layup|tip/i.test(s.text)),
  ],
  ['shot_type', 'n', 'min_ft', 'median_ft', 'max_ft'],
  3,
  'Distance from the hoop at (25, 0), by shot type'
);
