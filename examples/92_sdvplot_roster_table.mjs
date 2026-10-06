// 92 — Roster table: ESPN NBA roster → an HTML table with headshots and the logo.
//
// Shows: @sportsdataverse/sdvplot `headshotUrl(playerId, league)` (ESPN ids by
// default) and `logoUrl` / `teamColors` to brand a plain HTML table. Written to
// examples/out/roster.html. URLs are strings — nothing is fetched, so this runs
// offline. The packages are UNPUBLISHED (see README.md).
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/13/roster
// Offline fixture: test/fixtures/espn/team_roster_nba.json (Lakers).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { headshotUrl, logoUrl, teamColors, onColor } from '@sportsdataverse/sdvplot';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

const TEAM_ID = 13;
const roster = await sdv.nba.espnNbaTeamRoster({ team_id: TEAM_ID, parsed: true });
const [primary] = await teamColors('nba', [TEAM_ID], { which: 'primary' });
const logo = await logoUrl(TEAM_ID, 'nba');

const players = roster
  .map((p) => ({
    jersey: p.jersey,
    player: p.display_name,
    pos: p.position_abbreviation,
    height: p.display_height,
    weight: p.display_weight,
    age: p.age,
    exp: p.experience_years,
    headshot: headshotUrl(p.id, 'nba'),
  }))
  .sort((a, b) => Number(a.jersey) - Number(b.jersey));

printTable(players, ['jersey', 'player', 'pos', 'height', 'weight', 'age', 'exp', 'headshot'], 6, `Roster, team ${TEAM_ID} (headshotUrl from the ESPN athlete id)`);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const html = `<!doctype html>
<meta charset="utf-8">
<title>Roster ${TEAM_ID}</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 24px; }
  h1 { display: flex; align-items: center; gap: 12px; color: ${primary}; }
  h1 img { height: 48px; }
  table { border-collapse: collapse; }
  th { background: ${primary}; color: ${onColor(primary)}; text-align: left; padding: 6px 10px; }
  td { padding: 4px 10px; border-bottom: 1px solid #ddd; }
  td img { height: 40px; width: 40px; object-fit: cover; border-radius: 50%; background: #eee; }
</style>
<h1><img src="${esc(logo)}" alt=""> Team ${TEAM_ID} roster</h1>
<table>
<tr><th></th><th>#</th><th>Player</th><th>Pos</th><th>Ht</th><th>Wt</th><th>Age</th><th>Exp</th></tr>
${players.map((p) => `<tr><td><img src="${esc(p.headshot)}" alt=""></td><td>${esc(p.jersey)}</td><td>${esc(p.player)}</td><td>${esc(p.pos)}</td><td>${esc(p.height)}</td><td>${esc(p.weight)}</td><td>${esc(p.age)}</td><td>${esc(p.exp)}</td></tr>`).join('\n')}
</table>
`;

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/roster.html', import.meta.url), html);
console.log(`wrote examples/out/roster.html (${players.length} players, primary colour ${primary})`);
