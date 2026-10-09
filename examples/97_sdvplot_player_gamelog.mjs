// 97 — A player's form: an ESPN game log → points per game with a rolling
// average, the season mean and the player's headshot → PNG.
//
// Shows: `espnNbaPlayerGamelog({ athlete_id: '1966', season: 2024 })` (LeBron
// James, 2023-24; ESPN web v3) taken RAW and joined by hand: the payload keeps the
// stat names (`names`), the per-game stats (`seasonTypes[].categories[].events[]`)
// and the game details (`events`, keyed by event id) in three places. Then the
// official regular season (ESPN files two games there that do not count), a
// 10-game rolling mean, and a chart drawn with Observable Plot in Node (jsdom):
// `teamColors` for the line, sdvplot's `meanLines` for the season average,
// `headshots` at the end of the line, `toPNG` (resvg, which downloads the
// headshot). Writes examples/out/lebron_2024_form.png. sdvplot-js is UNPUBLISHED.
//
// Sources: ESPN web v3 — site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/1966/gamelog?season=2024
// Offline fixture: test/fixtures/espn/athlete_gamelog_nba_1966_2024.json.gz (verbatim, captured 2026-10-08).

import { mkdirSync, writeFileSync } from 'node:fs';
import * as Plot from '@observablehq/plot';
import { JSDOM } from 'jsdom';
import sdv from 'sportsdataverse';
import { teamColors } from '@sportsdataverse/sdvplot';
import { toPNG } from '@sportsdataverse/sdvplot/export';
import { headshots, meanLines } from '@sportsdataverse/sdvplot/plot';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const ATHLETE_ID = '1966';
const WINDOW = 10;
const FONT = 'Arial, Helvetica, sans-serif'; // resvg draws text with the system's fonts; Plot's default system-ui resolves oddly there

const raw = await sdv.nba.espnNbaPlayerGamelog({ athlete_id: ATHLETE_ID, season: 2024 });

// --- join the three parts of the payload ---------------------------------------------
const col = Object.fromEntries(raw.names.map((n, i) => [n, i])); // 'points' → 13, …
const block = raw.seasonTypes.find((s) => / Regular Season$/.test(s.displayName) && !/Play In/.test(s.displayName));
const logged = block.categories.filter((c) => c.type === 'event').flatMap((c) => c.events);
// The join key: a game's eventId and the keys of `events` must agree in type (object keys are strings).
const keyTypes = new Set(logged.map((e) => typeof e.eventId));
if (keyTypes.size !== 1 || !keyTypes.has('string')) throw new Error(`eventId types: ${[...keyTypes]}`);
const games = logged.map((e) => {
  const g = raw.events[e.eventId];
  if (!g) throw new Error(`event ${e.eventId} has stats but no game details`);
  return {
    event_id: e.eventId,
    date: new Date(g.gameDate).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), // gameDate is UTC: an evening tip-off is the next day there
    opp: g.opponent.abbreviation,
    at_vs: g.atVs,
    result: g.gameResult,
    score: g.score,
    team_id: g.team.id,
    note: g.eventNote ?? '',
    min: Number(e.stats[col.minutes]),
    pts: Number(e.stats[col.points]),
    reb: Number(e.stats[col.totalRebounds]),
    ast: Number(e.stats[col.assists]),
  };
});

// ESPN's "Regular Season" block also holds the All-Star Game and the In-Season
// Tournament final, neither of which counts in the official season statistics.
const extra = games.filter((g) => /All-Star Game|In-Season Tournament Championship/.test(g.note));
const season = games.filter((g) => !extra.includes(g)).sort((a, b) => a.date.localeCompare(b.date));
season.forEach((g, i) => {
  g.game = i + 1;
  const win = season.slice(Math.max(0, i - WINDOW + 1), i + 1);
  g.pts_roll = win.length === WINDOW ? win.reduce((s, x) => s + x.pts, 0) / WINDOW : null;
});

const per = (k) => round(season.reduce((s, g) => s + g[k], 0) / season.length, 1);
const totals = { games: season.length, pts: season.reduce((s, g) => s + g.pts, 0), ppg: per('pts'), rpg: per('reb'), apg: per('ast'), mpg: per('min') };

// --- the chart -----------------------------------------------------------------------
const doc = new JSDOM('').window.document;
const teamIds = [...new Set(season.map((g) => g.team_id))];
if (teamIds.length !== 1) throw new Error(`more than one team in the season: ${teamIds}`);
const [lal] = await teamColors('nba', teamIds, { which: 'primary' });
const last = season.at(-1);
const peak = season.filter((g) => g.pts_roll != null).reduce((a, b) => (b.pts_roll > a.pts_roll ? b : a));
const chart = Plot.plot({
  document: doc,
  style: { fontFamily: FONT, background: 'white' },
  width: 820,
  height: 380,
  marginTop: 64,
  marginRight: 30,
  // no Plot `title`: it wraps the SVG in an HTML <figure>, and toPNG takes an SVG; the heading is a text mark
  x: { label: 'Game of the regular season →', domain: [0, season.length + 6] },
  y: { label: null, domain: [0, 45], grid: true },
  marks: [
    Plot.dot(season, { x: 'game', y: 'pts', r: 3.5, fill: (g) => (g.result === 'W' ? lal : 'white'), stroke: lal, strokeWidth: 1.2 }),
    Plot.line(season, { x: 'game', y: 'pts_roll', stroke: lal, strokeWidth: 3 }),
    ...meanLines(season, { y: 'pts', stroke: '#555', strokeDasharray: '5 4' }),
    Plot.text([totals.ppg], { x: 2, y: (d) => d, text: (d) => `season mean ${d}`, dy: -8, textAnchor: 'start', fill: '#555', stroke: 'white', strokeWidth: 4, fontSize: 12 }),
    Plot.text([peak], { x: 'game', y: 'pts_roll', text: (g) => `${WINDOW}-game high ${round(g.pts_roll, 1)}`, dy: -16, fill: lal, stroke: 'white', strokeWidth: 4, fontSize: 12, fontWeight: 'bold' }),
    Plot.text([{}], { frameAnchor: 'top-left', dy: -46, text: () => `LeBron James, 2023-24: points per game (${totals.games} games, ${totals.ppg} a game)`, fontSize: 16, fontWeight: 'bold', fill: '#111', textAnchor: 'start' }),
    Plot.text([{}], { frameAnchor: 'top-left', dy: -24, text: () => `● win  ○ loss  — ${WINDOW}-game rolling mean`, fontSize: 12, fill: '#333', textAnchor: 'start' }),
    headshots([last], { league: 'nba', player: () => ATHLETE_ID, x: () => season.length + 3.2, y: 'pts_roll', height: 0.2 }),
  ],
});
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/lebron_2024_form.png', import.meta.url), await toPNG(chart, { scale: 2 }));

printTable([totals], ['games', 'pts', 'ppg', 'rpg', 'apg', 'mpg'], 1, `Regular season (ESPN listed ${games.length} games; ${extra.length} do not count)`);
printTable(extra, ['date', 'opp', 'note', 'pts'], 2, 'Logged under Regular Season but not counted');
printTable(
  season.filter((g) => g.game % 10 === 0 || g === peak || g === last).map((g) => ({ ...g, pts_roll: round(g.pts_roll, 1) })),
  ['game', 'date', 'opp', 'at_vs', 'result', 'pts', 'pts_roll'],
  12,
  `Every 10th game, the peak and the last → examples/out/lebron_2024_form.png`
);
