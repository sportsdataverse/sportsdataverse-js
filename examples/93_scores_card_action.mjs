// 93 — Nightly scores card: one night's ESPN scoreboard → a team-coloured PNG, built to run in a GitHub Action.
//
// Shows: `espn<League>Scoreboard({ dates, parsed: true })` (one row per game) drawn as a
// plain SVG scores card with @sportsdataverse/sdvplot `palette` (team colours by ESPN id),
// `logoUrl` (archived logo URL) and `onColor` (black or white text on a colour), framed by
// `socialCard` (4:5 portrait) and rasterized by `toPNG` (optional peer @resvg/resvg-js,
// which downloads the logos with Node's fetch). Writes out/scores_card.png + scores_card.json
// next to this script.
//
// Inputs (env): LEAGUE = nba (default) | wnba | nfl | mlb | nhl | cfb | mbb | wbb
//               DATE   = YYYYMMDD or YYYY-MM-DD; default: yesterday in America/New_York
//               MAX    = most games on one card (default 16; a college Saturday has 50+)
// SDV_LIVE=1 hits the real hosts (ESPN + the logo CDN); the repo's docs build runs it
// offline against the committed fixture instead (examples/_offline.mjs, logos skipped).
// The workflow template is examples/workflows/scores-card.yml.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
// Offline fixture: test/fixtures/espn/scoreboard_nba.json (the night of 2024-12-01).

import { mkdirSync, writeFileSync } from 'node:fs';
import sdv from 'sportsdataverse';
import { logoUrl, mix, onColor, palette } from '@sportsdataverse/sdvplot';
import { socialCard, toPNG } from '@sportsdataverse/sdvplot/export';

const LIVE = process.env.SDV_LIVE === '1';
if (!LIVE) await import('./_offline.mjs').then((m) => m.setup()); // repo-only: serve committed fixtures

const LEAGUE = (process.env.LEAGUE || 'nba').toLowerCase();
const ET = 'America/New_York';
function yesterdayET() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: ET }).format(new Date()); // YYYY-MM-DD
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10).replaceAll('-', '');
}
const DATE = (process.env.DATE || yesterdayET()).replaceAll('-', '');
if (!/^\d{8}$/.test(DATE)) throw new Error(`DATE must be YYYYMMDD or YYYY-MM-DD, got ${process.env.DATE}`);

const scoreboard = sdv[LEAGUE]?.[`espn${LEAGUE[0].toUpperCase()}${LEAGUE.slice(1)}Scoreboard`];
if (!scoreboard) throw new Error(`no ESPN scoreboard for LEAGUE=${LEAGUE}`);
const all = (await scoreboard({ dates: DATE, parsed: true })).sort((a, b) => a.date.localeCompare(b.date));
const games = all.slice(0, Number(process.env.MAX) || 16);
if (games.length === 0) {
  console.log(`no ${LEAGUE.toUpperCase()} games on ${DATE}; nothing to draw`);
  process.exit(0);
}

// Colours and logos from sdvplot by ESPN team id; ESPN's own colour/logo fields are the fallback.
const ids = [...new Set(games.flatMap((g) => [g.away_id, g.home_id]))];
const colors = await palette(LEAGUE, ids, { idSystem: 'espn' });
const logos = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await logoUrl(id, LEAGUE, { idSystem: 'espn' })])));
const side = (g, s) => ({
  abbr: g[`${s}_abbreviation`],
  name: g[`${s}_name`],
  score: g.status_type_state === 'pre' ? '' : (g[`${s}_score`] ?? ''), // ESPN sends "0" before tip-off
  winner: g[`${s}_winner`] === true,
  color: colors[g[`${s}_id`]] ?? `#${g[`${s}_color`] || '777777'}`,
  logo: logos[g[`${s}_id`]] ?? g[`${s}_logo`],
});

// The night the games belong to, read from the data (first tip-off in Eastern time), not from DATE.
const night = new Intl.DateTimeFormat('en-US', { timeZone: ET, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(games[0].date));

console.log(`## ${LEAGUE.toUpperCase()} scores, ${night}`);
console.log('| away | score | home | status | away colour | home colour |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const g of games) {
  const [a, h] = [side(g, 'away'), side(g, 'home')];
  console.log(`| ${a.abbr} | ${a.score}-${h.score} | ${h.abbr} | ${g.status_type_short_detail} | ${a.color} | ${h.color} |`);
}

// --- The card: a plain SVG, one tile per game, two rows per tile (away over home). ---
const FONT = "font-family=\"'DejaVu Sans', 'Liberation Sans', Arial, Helvetica, sans-serif\"";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const W = 1000;
const COLS = games.length > 6 ? 2 : 1;
const GAP = 20;
const ROW = 56;
const TILE_W = (W - GAP * (COLS - 1)) / COLS;
const TILE_H = 30 + 2 * ROW + 8;
const TOP = 110;
const rowsOfTiles = Math.ceil(games.length / COLS);
const H = TOP + rowsOfTiles * (TILE_H + GAP) + 30;

// Text is not measured: widths are rough per-character estimates, generous enough for DejaVu Sans (wider than Arial).
const ABBR_W = Math.max(80, 19 * Math.max(...games.flatMap((g) => [g.away_abbreviation.length, g.home_abbreviation.length])) + 14);
const fit = (text, size, chars) => (String(text).length > chars ? Math.floor((size * chars) / String(text).length) : size);

function teamRow(t, x, y, loser) {
  const ink = loser ? '#6b6b6b' : '#111111';
  const weight = loser ? 400 : 700;
  const box = loser ? mix(t.color, '#ffffff', 0.55) : t.color; // the loser's score box fades toward white
  return (
    `<rect x="${x}" y="${y + 4}" width="10" height="${ROW - 8}" fill="${t.color}"/>` +
    (t.logo ? `<image href="${esc(t.logo)}" x="${x + 22}" y="${y + 6}" width="${ROW - 12}" height="${ROW - 12}"/>` : '') +
    `<text x="${x + ROW + 22}" y="${y + 37}" ${FONT} font-size="26" font-weight="${weight}" fill="${ink}">${esc(t.abbr)}</text>` +
    `<text x="${x + ROW + 22 + ABBR_W}" y="${y + 36}" ${FONT} font-size="${fit(t.name, 19, 16)}" fill="${ink}">${esc(t.name)}</text>` +
    `<rect x="${x + TILE_W - 96}" y="${y + 4}" width="88" height="${ROW - 8}" rx="6" fill="${box}"/>` +
    `<text x="${x + TILE_W - 52}" y="${y + 39}" ${FONT} font-size="30" font-weight="${weight}" text-anchor="middle" fill="${onColor(box)}">${esc(t.score)}</text>`
  );
}

const tiles = games.map((g, i) => {
  const x = (i % COLS) * (TILE_W + GAP);
  const y = TOP + Math.floor(i / COLS) * (TILE_H + GAP);
  const [a, h] = [side(g, 'away'), side(g, 'home')];
  const done = g.status_type_completed === true;
  const note = [g.status_type_short_detail, g.note].filter(Boolean).join(' · ');
  return (
    `<rect x="${x}" y="${y}" width="${TILE_W}" height="${TILE_H}" rx="10" fill="#ffffff" stroke="#d9d9d9"/>` +
    `<text x="${x + 22}" y="${y + 22}" ${FONT} font-size="15" fill="#555555">${esc(note)}</text>` +
    teamRow(a, x, y + 28, done && h.winner) +
    teamRow(h, x, y + 28 + ROW, done && a.winner)
  );
});

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#f4f4f4"/>` +
  `<text x="0" y="46" ${FONT} font-size="40" font-weight="700" fill="#111111">${LEAGUE.toUpperCase()} scores</text>` +
  `<text x="0" y="84" ${FONT} font-size="22" fill="#444444">${esc(night)}</text>` +
  tiles.join('') +
  `<text x="0" y="${H - 8}" ${FONT} font-size="15" fill="#666666">${all.length > games.length ? `First ${games.length} of ${all.length} games by start time · ` : ''}Data: ESPN via sportsdataverse · colours and logos: sdvplot</text>` +
  `</svg>`;

// 4:5 portrait card (1080 x 1350 at width 1080), the shape social feeds crop least.
const png = await toPNG(socialCard(svg, { aspect: '4:5', padding: 40, background: '#f4f4f4' }), {
  width: 1080,
  images: LIVE ? 'fetch' : 'skip',
});
const out = new URL('./out/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('scores_card.png', out), png);
writeFileSync(
  new URL('scores_card.json', out),
  `${JSON.stringify({ league: LEAGUE, date: DATE, night, games: games.map((g) => ({ game_id: g.game_id, away: side(g, 'away'), home: side(g, 'home'), status: g.status_type_short_detail })) }, null, 2)}\n`
);
console.log(`\nwrote out/scores_card.png (${games.length} games, ${png.length} bytes) + out/scores_card.json`);
