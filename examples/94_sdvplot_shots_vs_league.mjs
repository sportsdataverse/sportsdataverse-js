// 94 — A game's shot chart against the league: ESPN plays + the 2023-24 league
// baseline → sdvplot hexagons coloured by FG% vs the league → PNG.
//
// Shows: ESPN summary `plays` for one game, mapped into the shot kit's frame
// (@sportsdataverse/sdvplot/shots: legacy tenths of a foot, hoop at the origin);
// `leagueIndex` over every 2023-24 field-goal attempt (the `espn_nba_shots`
// release, counted per ESPN spot in a committed snapshot); `cellsVsLeague` +
// `sizeCells` per team; `surface` + `shotCells` drawn with Observable Plot in
// Node (jsdom), then rasterised by `toPNG` (resvg). Writes
// examples/out/shots_vs_league.png. sdvplot-js is UNPUBLISHED (see README.md).
//
// Frame (fitted in 02_nba_pbp_shots.mjs, MAE 0.3 ft): ESPN `coordinate_x` is feet
// across the court with the hoop at 25, `coordinate_y` feet toward half court with
// the hoop at 1, whole feet, one basket for both teams. So
//   x_legacy = (coordinate_x - 25) * 10,  y_legacy = (coordinate_y - 1) * 10.
// Free throws carry a sentinel and are dropped. `shot_value` is ESPN's
// `points_attempted` (2 or 3); the shot kit reads it for the zones.
//
// The league snapshot: test/fixtures/releases/nba_shots_2024_spots.json, written by
// tools/snapshots/nba-league-shots.mjs from `sdv.nba.loadNbaShots({ seasons: 2024 })`
// (provenance inside the file). It includes this game: the release carries all
// 169 of its field-goal attempts, at the same spots as the summary below.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401585607
// and the sportsdataverse-data release espn_nba_shots/shots_2024.parquet.
// Offline fixtures: test/fixtures/espn/summary_nba.json (ORL vs TOR, 2024-03-17) + the snapshot above.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as Plot from '@observablehq/plot';
import { JSDOM } from 'jsdom';
import sdv from 'sportsdataverse';
import { teamColors } from '@sportsdataverse/sdvplot';
import { toPNG } from '@sportsdataverse/sdvplot/export';
import { shotCells, surface } from '@sportsdataverse/sdvplot/plot';
import { cellsVsLeague, diffScale, leagueIndex, sizeCells, statsByZone } from '@sportsdataverse/sdvplot/shots';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const EVENT_ID = 401585607;
const FONT = 'Arial, Helvetica, sans-serif'; // resvg draws text with the system's fonts; Plot's default system-ui resolves oddly there
const HEX = { radius: 20 }; // 2 ft hexagons: one game is ~85 attempts a team, so coarser than a season chart's 1.5 ft

/** One ESPN shot → the shot kit's ShotRow (legacy tenths, hoop at the origin). */
const shotRow = (x, y, value, made) => {
  const dx = x - 25;
  const dy = y - 1;
  return { x_legacy: dx * 10, y_legacy: dy * 10, shot_distance: Math.round(Math.hypot(dx, dy)), shot_value: value, shot_result: made ? 'Made' : 'Missed' };
};

// --- the game ------------------------------------------------------------------
const header = await sdv.nba.espnNbaSummary({ event_id: EVENT_ID, parsed: true, section: 'header' });
const competitors = JSON.parse(header[0].competitions)[0].competitors;
const teams = competitors.map((c) => ({ id: c.team.id, abbr: c.team.abbreviation, homeAway: c.homeAway, score: c.score }));

const plays = await sdv.nba.espnNbaSummary({ event_id: EVENT_ID, parsed: true, section: 'plays' });
const attempts = plays.filter((p) => p.shooting_play && p.coordinate_x > -100 && !/free throw/i.test(p.text));
// The join key: header team ids and play team ids must be the same type before we group on them.
const idTypes = new Set([...teams.map((t) => typeof t.id), ...attempts.map((p) => typeof p.team_id)]);
if (idTypes.size !== 1) throw new Error(`team_id types disagree between header and plays: ${[...idTypes]}`);

// --- the league ------------------------------------------------------------------
const snapshot = JSON.parse(readFileSync(new URL('../test/fixtures/releases/nba_shots_2024_spots.json', import.meta.url), 'utf8'));
const league = snapshot.spots.flatMap(([x, y, value, n, makes]) =>
  Array.from({ length: n }, (_, i) => shotRow(x, y, value, i < makes))
);
const index = leagueIndex(league, HEX);
const leagueZones = statsByZone(league);

// --- per team: cells vs league, zones vs league ---------------------------------------
const doc = new JSDOM('').window.document;
const court = surface('nba', { displayRange: 'defense', rotation: 90 });
const scale = diffScale();
const colors = await teamColors('nba', teams.map((t) => t.id), { which: 'primary' });
const zoneRows = [];
const panels = [];
const titles = [];
for (const [i, team] of teams.entries()) {
  const shots = attempts.filter((p) => p.team_id === team.id).map((p) => shotRow(p.coordinate_x, p.coordinate_y, p.points_attempted, p.scoring_play));
  const cells = cellsVsLeague(shots, index);
  const zones = statsByZone(shots);
  // corners merged: ESPN's left/right handedness against the legacy frame is not verified
  const merge = (z) => ({
    restricted_area: z.restricted_area,
    paint: z.paint,
    mid_range: z.mid_range,
    corner_3: { attempts: z.corner_3_left.attempts + z.corner_3_right.attempts, makes: z.corner_3_left.makes + z.corner_3_right.makes },
    above_break_3: z.above_break_3,
  });
  const lz = merge(leagueZones);
  for (const [zone, s] of Object.entries(merge(zones))) {
    const fg = s.attempts ? s.makes / s.attempts : null;
    const lfg = lz[zone].makes / lz[zone].attempts;
    zoneRows.push({ team: team.abbr, zone, fga: s.attempts, fgm: s.makes, fg_pct: round(fg, 3), league_fg_pct: round(lfg, 3), diff_pts: fg == null ? null : round((fg - lfg) * 100, 1) });
  }
  const fga = shots.length;
  const fgm = shots.filter((s) => s.shot_result === 'Made').length;
  titles.push({ text: `${team.abbr} ${fgm}/${fga} FG (${team.homeAway})`, color: colors[i] });
  panels.push(
    Plot.plot({
      ...court.scales,
      document: doc,
      style: { fontFamily: FONT },
      width: 360,
      marks: [
        ...court.marks,
        shotCells(cells, { r: sizeCells(cells, HEX).r, frame: 'nba-legacy-vertical', scale }),
      ],
    })
  );
}

// --- one PNG: the two courts side by side, a legend underneath ------------------------
const pts = (d) => (d === 0 ? '0' : `${d > 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(0)}`);
// Plot.legend's continuous ramp paints a <canvas>, which jsdom lacks: draw the key as rects in the scale's colours.
const steps = Array.from({ length: 31 }, (_, i) => round(-0.15 + i * 0.01, 2));
const legend = Plot.plot({
  document: doc,
  style: { fontFamily: FONT },
  width: 360,
  height: 46,
  marginTop: 4,
  marginBottom: 30,
  x: { domain: [-0.155, 0.155], ticks: [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15], tickFormat: pts, label: 'FG% vs 2023-24 league, same hexagon (points) →', labelAnchor: 'center' },
  y: { axis: null },
  color: { type: 'identity' },
  marks: [Plot.rect(steps, { x1: (d) => d - 0.005, x2: (d) => d + 0.005, y1: 0, y2: 1, fill: (d) => scale(d) })],
});
const w = panels.map((p) => Number(p.getAttribute('width')));
const h = Math.max(...panels.map((p) => Number(p.getAttribute('height'))));
const W = w[0] + w[1] + 24;
const TOP = 36; // a title band above the courts
const H = TOP + h + 64;
const nested = (svg, x, y) => {
  svg.setAttribute('x', String(x));
  svg.setAttribute('y', String(y));
  return svg.outerHTML;
};
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">` +
  `<rect width="${W}" height="${H}" fill="white"/>` +
  titles.map((t, i) => `<text x="${i === 0 ? w[0] / 2 : w[0] + 24 + w[1] / 2}" y="26" text-anchor="middle" font-size="18" font-weight="bold" fill="${t.color}">${t.text}</text>`).join('') +
  nested(panels[0], 0, TOP) +
  nested(panels[1], w[0] + 24, TOP) +
  nested(legend, (W - 360) / 2, TOP + h + 8) +
  '</svg>';
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/shots_vs_league.png', import.meta.url), await toPNG(svg, { scale: 2 }));

printTable(
  teams.map((t, i) => ({ team: t.abbr, team_id: t.id, home_away: t.homeAway, score: t.score, color: colors[i] })),
  ['team', 'team_id', 'home_away', 'score', 'color'],
  2,
  `Game ${EVENT_ID} vs a league of ${snapshot.provenance.field_goal_attempts} attempts (${snapshot.provenance.games} games)`
);
printTable(zoneRows, ['team', 'zone', 'fga', 'fgm', 'fg_pct', 'league_fg_pct', 'diff_pts'], 10, 'FG% by zone against the league → examples/out/shots_vs_league.png');
