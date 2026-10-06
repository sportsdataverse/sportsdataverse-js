// 90 — Shot chart: ESPN NBA plays → a sporty court → SVG with sdvplot team colours.
//
// Shows: ESPN summary `plays` (coordinate_x / coordinate_y) mapped onto a
// @sportsdataverse/sporty NBA half court and rendered with `toSVG`, with each
// team's shots coloured by @sportsdataverse/sdvplot `teamColors`. Written to
// examples/out/shot_chart.svg. Both packages are UNPUBLISHED (see README.md).
//
// Coordinate mapping (MEASURED, not assumed — see 02_nba_pbp_shots.mjs): fitting
// the hoop against the "N-foot" distance in each play's text on four ESPN
// basketball captures gives hoop = (25, 0..1) with MAE 0.3 ft, so ESPN's frame is
//   x: feet across the court, 0..50, hoop at 25
//   y: feet from the hoop toward half court, -1..~31
//   both teams on ONE basket in every period (no side flip)
//   free throws = sentinel (-214748340, -214748365) → dropped
// sporty's NBA court is centre-origin feet: x along the length (-47..47), y across
// (-25..25); `displayRange: "offense"` shows x in 0..47 with the hoop at x = 41.75
// (47 - 5.25). So:  surface_x = 41.75 - coordinate_y,  surface_y = coordinate_x - 25.
// sporty has no built-in ESPN basketball frame (its `nba-legacy` frame is for
// stats.nba.com LOC_X/LOC_Y, tenths of a foot); we pass the mapping as `from`.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401585607
// Offline fixture: test/fixtures/espn/summary_nba.json (ORL vs TOR, 2024-03-17).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { basketballCourt, toSurfaceFrame } from '@sportsdataverse/sporty';
import { toSVG } from '@sportsdataverse/sporty/svg';
import { teamColors } from '@sportsdataverse/sdvplot';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const EVENT_ID = 401585607;
const ESPN_NBA_FRAME = {
  x: (r) => (r.y == null || r.y < -100 ? null : 41.75 - r.y),
  y: (r) => (r.x == null || r.x < -100 ? null : r.x - 25),
  description: 'ESPN basketball plays: x across (0-50, hoop 25), y from the hoop toward half court → sporty offense half',
};

const header = await sdv.nba.espnNbaSummary({ event_id: EVENT_ID, parsed: true, section: 'header' });
const competitors = JSON.parse(header[0].competitions)[0].competitors;
const teams = Object.fromEntries(competitors.map((c) => [c.team.id, c.team.abbreviation]));
const teamIds = Object.keys(teams);

const plays = await sdv.nba.espnNbaSummary({ event_id: EVENT_ID, parsed: true, section: 'plays' });
const shots = toSurfaceFrame(
  plays.filter((p) => p.shooting_play && p.coordinate_x > -100 && !/free throw/i.test(p.text)),
  { from: ESPN_NBA_FRAME, x: 'coordinate_x', y: 'coordinate_y' }
);

// Team colours resolve from sdvplot's bundled index (ESPN team ids work directly; no network).
const colors = await teamColors('nba', teamIds, { which: 'primary' });
const colorOf = Object.fromEntries(teamIds.map((id, i) => [id, colors[i]]));

printTable(
  shots.map((s) => ({ team: teams[s.team_id], made: s.scoring_play, x_espn: s.coordinate_x, y_espn: s.coordinate_y, surface_x: round(s.surface_x, 2), surface_y: s.surface_y, text: s.text })),
  ['team', 'made', 'x_espn', 'y_espn', 'surface_x', 'surface_y', 'text'],
  6,
  'Shots mapped onto the sporty court'
);

// Render: court SVG + one <circle> per shot inside the same y-flipped group.
const court = basketballCourt('nba', { displayRange: 'offense' });
const svg = toSVG(court, { width: 720 });
const marks = shots
  .map((s) => `<circle cx="${s.surface_x.toFixed(2)}" cy="${s.surface_y.toFixed(2)}" r="0.9" fill="${s.scoring_play ? colorOf[s.team_id] : 'none'}" stroke="${colorOf[s.team_id]}" stroke-width="0.25"/>`)
  .join('');
const out = svg.replace('</g></svg>', `${marks}</g></svg>`);

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/shot_chart.svg', import.meta.url), out);

printTable(
  teamIds.map((id) => ({ team: teams[id], color: colorOf[id], fga: shots.filter((s) => s.team_id === id).length, fgm: shots.filter((s) => s.team_id === id && s.scoring_play).length })),
  ['team', 'color', 'fga', 'fgm'],
  2,
  'Legend (filled = made, hollow = missed) → examples/out/shot_chart.svg'
);
