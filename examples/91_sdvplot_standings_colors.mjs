// 91 — Standings bar chart: ESPN WNBA standings → horizontal bars in team colours.
//
// Shows: @sportsdataverse/sdvplot `palette` (team → hex, keyed by whatever you
// passed — here ESPN team ids) and `logoUrl` (a CDN URL string, no fetch) laid
// out as a plain SVG. Written to examples/out/standings.svg. The packages are
// UNPUBLISHED (see README.md); colours come from sdvplot's bundled index, so
// this runs offline.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/v2/sports/basketball/wnba/standings?season=2025
// Offline fixture: test/fixtures/espn/standings_wnba_2025.json (captured 2026-10-06).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { palette, logoUrl, onColor } from '@sportsdataverse/sdvplot';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const rows = (await sdv.wnba.espnWnbaStandings({ season: 2025, parsed: true })).sort((a, b) => b.win_percent - a.win_percent);
const ids = rows.map((r) => r.team_id);
const colors = await palette('wnba', ids);
const logos = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await logoUrl(id, 'wnba')])));

const table = rows.map((r) => ({ team: r.team_abbreviation, team_id: r.team_id, win_pct: round(r.win_percent, 3), color: colors[r.team_id], text_on: onColor(colors[r.team_id]), logo: logos[r.team_id] }));
printTable(table, ['team', 'team_id', 'win_pct', 'color', 'text_on', 'logo'], 6, 'Team colours + logo URLs resolved by ESPN id');

// Horizontal bar chart: one row per team, bar length = win%, logo at the left.
const ROW = 26;
const LEFT = 120;
const W = 640;
const H = 20 + rows.length * ROW;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const bars = table
  .map((t, i) => {
    const y = 10 + i * ROW;
    const len = (W - LEFT - 60) * t.win_pct;
    return (
      `<image href="${esc(t.logo)}" x="4" y="${y + 2}" width="22" height="22"/>` +
      `<text x="32" y="${y + 17}" font-family="sans-serif" font-size="13">${esc(t.team)}</text>` +
      `<rect x="${LEFT}" y="${y + 3}" width="${len.toFixed(1)}" height="${ROW - 6}" fill="${t.color}" rx="3"/>` +
      `<text x="${LEFT + len + 6}" y="${y + 17}" font-family="sans-serif" font-size="12" fill="#333">${t.win_pct.toFixed(3)}</text>`
    );
  })
  .join('\n');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n<rect width="${W}" height="${H}" fill="#fff"/>\n${bars}\n</svg>\n`;

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/standings.svg', import.meta.url), svg);
console.log(`wrote examples/out/standings.svg (${rows.length} bars)`);
