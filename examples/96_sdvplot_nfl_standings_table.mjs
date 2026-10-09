// 96 — Conference standings → a publication table PNG: ESPN NFL standings →
// @sportsdataverse/sdvtables → HTML → PNG (headless Chromium).
//
// Shows: `espnNflStandings({ season: 2024, parsed: true })` (one row per team),
// one `defineTable` spec per conference (team logo by ESPN id, record, win %,
// points, point differential, streak, a cutline under the 7th seed), the two set
// side by side by `gridTables`, and `htmlToPNG` from
// @sportsdataverse/sdvtables/export. Writes examples/out/nfl_standings_2024.png.
// sdvplot-js is UNPUBLISHED (see README.md); the PNG step also needs playwright and
// its browser (`npx playwright install chromium`) and loads the logos over the network.
//
// Sources: ESPN v2 standings — site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2024
// Offline fixture: test/fixtures/espn/standings_nfl_2024.json (32 teams, final 2024 regular season).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { logoUrl } from '@sportsdataverse/sdvplot';
import { defineTable } from '@sportsdataverse/sdvtables';
import { gridTables, htmlToPNG } from '@sportsdataverse/sdvtables/export';
import { prepare } from '@sportsdataverse/sdvtables/html';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const standings = await sdv.nfl.espnNflStandings({ season: 2024, parsed: true });

// The logo column is keyed on the ESPN team id: check it is one type, and that sdvplot
// resolves each id to the same logo as the team's abbreviation (it does for all 32).
const idTypes = new Set(standings.map((r) => typeof r.team_id));
if (idTypes.size !== 1 || !idTypes.has('string')) throw new Error(`team_id is not one string type: ${[...idTypes]}`);
for (const r of standings) {
  if ((await logoUrl(r.team_id, 'nfl')) !== (await logoUrl(r.team_abbreviation, 'nfl'))) throw new Error(`logo for ${r.team_id} ≠ ${r.team_abbreviation}`);
}

const rows = standings
  .map((r) => ({
    conference: r.group_abbreviation,
    seed: r.playoff_seed,
    team_id: r.team_id,
    team: r.team_display_name,
    abbr: r.team_abbreviation,
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    win_share: r.win_percent,
    pf: r.points_for,
    pa: r.points_against,
    diff: r.points_for - r.points_against,
    // ESPN's streak is signed: +4 = four straight wins, -1 = one loss
    streak: r.streak > 0 ? `W${r.streak}` : `L${-r.streak}`,
  }))
  .sort((a, b) => a.conference.localeCompare(b.conference) || a.seed - b.seed);

const tableFor = (conference) =>
  defineTable()
    .columns((c) => [
      c.int('seed', { label: '#' }),
      c.logo('team_id', { league: 'nfl', label: '', height: 24 }),
      c.text('team', { label: 'Team' }),
      c.int('wins', { label: 'W' }),
      c.int('losses', { label: 'L' }),
      c.pct('win_share', { label: 'Win %', decimals: 1 }),
      c.int('pf', { label: 'PF' }),
      c.int('pa', { label: 'PA' }),
      c.colorPills('diff', { label: 'Diff', domain: [-225, 225] }), // one domain, so AFC and NFC colours compare
      c.text('streak', { label: 'Streak' }),
    ])
    .cutline(7, { label: ['Playoff line'] })
    .theme('athletic')
    .title(conference)
    .build();

const afc = rows.filter((r) => r.conference === 'AFC');
const nfc = rows.filter((r) => r.conference === 'NFC');
const specs = [tableFor('AFC'), tableFor('NFC')];
await Promise.all(specs.map((s) => prepare(s))); // loads the NFL logo shard renderHTML reads
const html = gridTables(
  [
    { spec: specs[0], rows: afc },
    { spec: specs[1], rows: nfc },
  ],
  {
    ncol: 2,
    title: 'NFL standings, 2024 regular season',
    subtitle: 'By playoff seed; seeds 1-4 won their divisions, 5-7 are wild cards',
    sourceNote: 'Data: ESPN via sportsdataverse (sdv.nfl.espnNflStandings)',
  }
);
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/nfl_standings_2024.png', import.meta.url), await htmlToPNG(html, { width: 1200 }));

for (const [name, side] of [['AFC', afc], ['NFC', nfc]]) {
  printTable(
    side.map((r) => ({ seed: r.seed, team: r.abbr, team_id: r.team_id, record: `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ''}`, win_pct: round(r.win_share, 3), pf: r.pf, pa: r.pa, diff: r.diff, streak: r.streak })),
    ['seed', 'team', 'team_id', 'record', 'win_pct', 'pf', 'pa', 'diff', 'streak'],
    16,
    `${name} by seed${name === 'NFC' ? ' → examples/out/nfl_standings_2024.png' : ''}`
  );
}
