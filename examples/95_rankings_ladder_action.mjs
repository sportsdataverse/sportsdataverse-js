// 95 — Weekly power-rankings ladder: the AP Top 25 → a team-coloured ladder PNG, built for a weekly GitHub Action.
//
// Shows: `espnCfbCdnRankings()` parsed by `parseEndpoint('espn', 'cdn_rankings', raw)` (one row per
// poll entry, every poll), filtered
// to one poll and drawn as a 25-rung ladder: rank, movement since last week, logo, team,
// record, and a bar of poll points in the team's colour. Colours and logos come from
// @sportsdataverse/sdvplot `palette` / `logoUrl` by ESPN team id, bar labels from `onColor`;
// `socialCard` frames it 4:5 and `toPNG` (optional peer @resvg/resvg-js) rasterizes it,
// downloading the logos. Writes out/rankings_ladder.png + rankings_ladder.json next to this script.
//
// Inputs (env): POLL   = AP Top 25 (default) | AFCA Coaches Poll | …  (the `poll_name` column)
//               SEASON, WEEK = a past poll (regular season); default: ESPN's current week
// SDV_LIVE=1 hits the real hosts (ESPN + the logo CDN); the repo's docs build runs it
// offline against the committed fixture instead (examples/_offline.mjs, logos skipped).
// The workflow template is examples/workflows/rankings-ladder.yml.
//
// Sources: ESPN CDN — cdn.espn.com/core/college-football/rankings?xhr=1[&year=SEASON&week=WEEK]
// Offline fixture: test/fixtures/espn/cdn/rankings_cfb.json.gz (2024 week 5).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { parseEndpoint } from 'sportsdataverse/parsers';
import { logoUrl, onColor, palette } from '@sportsdataverse/sdvplot';
import { socialCard, toPNG } from '@sportsdataverse/sdvplot/export';

const LIVE = process.env.SDV_LIVE === '1';
if (!LIVE) await import('./_offline.mjs').then((m) => m.setup()); // repo-only: serve committed fixtures

const POLL = process.env.POLL || 'AP Top 25';
const args = {};
if (process.env.SEASON) args.season = Number(process.env.SEASON);
if (process.env.WEEK) Object.assign(args, { week: Number(process.env.WEEK), season_type: 2 });

// One request: keep the raw page (for the week label below) and parse it with the same parser `parsed: true` uses.
const raw = await sdv.cfb.espnCfbCdnRankings(args);
const parsed = parseEndpoint('espn', 'cdn_rankings', raw);
const ranked = parsed.filter((r) => r.poll_name === POLL && r.ranked === true).sort((a, b) => a.rank - b.rank);
if (ranked.length === 0) {
  // ESPN always serves some poll (the last one, off-season), so no rows means a wrong POLL or a changed payload: fail the run.
  console.error(`no "${POLL}" ranks for ${JSON.stringify(args)}; polls present: ${[...new Set(parsed.map((r) => r.poll_name))].join(' | ')}`);
  process.exit(1);
}

// The week ESPN actually served, from the page's own config (absent in the trimmed offline fixture).
const served = raw?.content?.config?.json?.requestedSeason;
const week = served ? `${served.year} ${served.week?.displayValue ?? ''}`.trim() : args.week ? `${args.season ?? ''} Week ${args.week}`.trim() : '';

const ids = ranked.map((r) => r.team_id);
const colors = await palette('cfb', ids, { idSystem: 'espn' });
const logos = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, (await logoUrl(id, 'cfb', { idSystem: 'espn' })) ?? null])));
const rows = ranked.map((r) => ({
  rank: r.rank,
  // previous_rank 0 = unranked last week
  move: r.previous_rank > 0 ? r.previous_rank - r.rank : null,
  team: r.team_display_name,
  abbr: r.team_abbreviation,
  record: r.formatted_record,
  points: r.points,
  first: r.first_place_votes,
  color: colors[r.team_id] ?? '#777777',
  logo: logos[r.team_id] ?? r.team_logo,
}));

console.log(`## ${POLL}${week ? `, ${week}` : ''}`);
console.log('| rank | move | team | record | points | 1st | colour |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) {
  console.log(`| ${r.rank} | ${r.move === null ? 'new' : r.move} | ${r.team} | ${r.record} | ${r.points} | ${r.first || ''} | ${r.color} |`);
}

// --- The ladder: a plain SVG, one rung per team. ---
const FONT = "font-family=\"'DejaVu Sans', 'Liberation Sans', Arial, Helvetica, sans-serif\"";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const W = 1000;
const RUNG = 44;
const TOP = 120;
const BAR_X = 470;
const BAR_W = W - BAR_X;
const H = TOP + rows.length * RUNG + 40;
const maxPoints = Math.max(...rows.map((r) => r.points || 0)) || 1;
// Text is not measured: a long team name shrinks to fit about 17 characters at 22 px (DejaVu Sans, the widest likely font).
const fit = (text, size, chars) => (String(text).length > chars ? Math.floor((size * chars) / String(text).length) : size);

function movement(m, x, y) {
  if (m === null) return `<text x="${x}" y="${y + 6}" ${FONT} font-size="13" font-weight="700" fill="#1f6feb">NEW</text>`;
  if (m === 0) return `<rect x="${x + 2}" y="${y - 1}" width="12" height="3" fill="#9a9a9a"/>`;
  const up = m > 0;
  const tri = up ? `${x},${y + 5} ${x + 14},${y + 5} ${x + 7},${y - 6}` : `${x},${y - 6} ${x + 14},${y - 6} ${x + 7},${y + 5}`;
  return `<polygon points="${tri}" fill="${up ? '#1a7f37' : '#cf222e'}"/><text x="${x + 18}" y="${y + 5}" ${FONT} font-size="15" fill="${up ? '#1a7f37' : '#cf222e'}">${Math.abs(m)}</text>`;
}

const rungs = rows.map((r, i) => {
  const y = TOP + i * RUNG;
  const mid = y + RUNG / 2;
  const len = Math.max(4, (BAR_W * (r.points || 0)) / maxPoints);
  const inside = len > 90;
  return (
    (i % 2 === 0 ? `<rect x="0" y="${y}" width="${W}" height="${RUNG}" fill="#f6f6f6"/>` : '') +
    `<text x="40" y="${mid + 9}" ${FONT} font-size="24" font-weight="700" text-anchor="end" fill="#111111">${r.rank}</text>` +
    movement(r.move, 54, mid) +
    (r.logo ? `<image href="${esc(r.logo)}" x="100" y="${y + 5}" width="${RUNG - 10}" height="${RUNG - 10}"/>` : '') +
    `<text x="146" y="${mid + 8}" ${FONT} font-size="${fit(r.team, 22, 17)}" font-weight="700" fill="#111111">${esc(r.team)}</text>` +
    `<text x="${BAR_X - 12}" y="${mid + 7}" ${FONT} font-size="17" text-anchor="end" fill="#555555">${esc(r.record)}${r.first ? ` (${r.first})` : ''}</text>` +
    `<rect x="${BAR_X}" y="${y + 7}" width="${len.toFixed(1)}" height="${RUNG - 14}" rx="4" fill="${r.color}" stroke="#00000022"/>` +
    `<text x="${inside ? BAR_X + len - 10 : BAR_X + len + 8}" y="${mid + 6}" ${FONT} font-size="16" text-anchor="${inside ? 'end' : 'start'}" fill="${inside ? onColor(r.color) : '#333333'}">${r.points}</text>`
  );
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
  `<text x="0" y="46" ${FONT} font-size="40" font-weight="700" fill="#111111">${esc(POLL)}</text>` +
  `<text x="0" y="84" ${FONT} font-size="22" fill="#444444">${esc(week || 'College football')} · bars are poll points, record (first-place votes)</text>` +
  rungs.join('') +
  `<text x="0" y="${H - 8}" ${FONT} font-size="15" fill="#666666">Data: ESPN via sportsdataverse · colours and logos: sdvplot</text>` +
  `</svg>`;

const png = await toPNG(socialCard(svg, { aspect: '4:5', padding: 40, background: '#ffffff' }), {
  width: 1080,
  images: LIVE ? 'fetch' : 'skip',
});
const out = new URL('./out/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('rankings_ladder.png', out), png);
writeFileSync(new URL('rankings_ladder.json', out), `${JSON.stringify({ poll: POLL, week, rows }, null, 2)}\n`);
console.log(`\nwrote out/rankings_ladder.png (${rows.length} teams, ${png.length} bytes) + out/rankings_ladder.json`);
