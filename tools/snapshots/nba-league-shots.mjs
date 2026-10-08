#!/usr/bin/env node
// ---------------------------------------------------------------------------
// nba-league-shots.mjs — the league baseline for the "shot chart vs league"
// tutorial (examples/94_sdvplot_shots_vs_league.mjs).
//
// Reads the 2023-24 `espn_nba_shots` release asset with `sdv.nba.loadNbaShots`
// and writes every field-goal attempt of the season, counted per ESPN court spot:
//
//   test/fixtures/releases/nba_shots_2024_spots.json
//     { provenance: { source, captured_utc, sha256, bytes, sdv_js_commit, … },
//       spots: [[x, y, value, attempts, makes], …] }
//
// ESPN's shot coordinates are whole feet (`coordinate_x_raw` 0..50 across the
// court, `coordinate_y_raw` from the hoop toward half court; every 2023-24 attempt
// is an integer pair), so this count per spot is lossless for any binning coarser
// than a foot: the 234,063 attempts become ~2,300 rows.
//
// `value` is 2 or 3. A make carries it (`score_value`); a miss has `score_value`
// 0, so a miss is labelled by `isThree` below, a rule MEASURED on the season's
// 110,857 makes (99.95% agree with the scorer) and on all 169 attempts of
// game 401585607, whose ESPN `pointsAttempted` it matches exactly
// (test/tutorial-fixtures.test.js asserts both).
//
//   npm run build && node tools/snapshots/nba-league-shots.mjs   # network: ~3.6 MB
//
// test/tutorial-fixtures.test.js re-derives the committed file from the asset
// when SDV_LIVE=1 and checks it against an independent capture offline.
// ---------------------------------------------------------------------------

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SEASON = 2024;
export const ASSET = `https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_nba_shots/shots_${SEASON}.parquet`;
export const OUT = new URL(`../../test/fixtures/releases/nba_shots_${SEASON}_spots.json`, import.meta.url);

/**
 * Is a shot from ESPN spot (x, y) a three? Hoop at (25, 1); corner threes 22 ft out
 * and the arc 23.75 ft away, both read 0.25-0.5 ft short because ESPN floors to whole feet.
 */
export const isThree = (x, y) => {
  const dx = x - 25;
  const dy = y - 1;
  return (Math.abs(dx) >= 21.5 && dy <= 9) || Math.hypot(dx, dy) >= 23.25;
};

/** Field-goal attempts (free throws dropped) → [[x, y, value, attempts, makes], …], sorted. */
export function spotsFromShots(rows) {
  const acc = new Map();
  for (const r of rows) {
    if (/free throw/i.test(r.type_text)) continue;
    const x = r.coordinate_x_raw;
    const y = r.coordinate_y_raw;
    if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`non-integer ESPN spot ${x},${y} in game ${r.game_id}`);
    const value = r.scoring_play ? r.score_value : isThree(x, y) ? 3 : 2;
    if (value !== 2 && value !== 3) throw new Error(`a made field goal worth ${value} in game ${r.game_id}`);
    const key = `${x},${y},${value}`;
    const s = acc.get(key) ?? [x, y, value, 0, 0];
    s[3] += 1;
    if (r.scoring_play) s[4] += 1;
    acc.set(key, s);
  }
  return [...acc.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

/** Download the asset once, hash it, and decode THOSE bytes with the release loader. */
export async function capture(sdv, configure) {
  const res = await fetch(ASSET);
  if (!res.ok) throw new Error(`${ASSET}: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  configure({ retries: 0, transport: async (req) => ({ status: 200, headers: {}, data: bytes, url: req.url }) });
  const rows = await sdv.nba.loadNbaShots({ seasons: SEASON });
  return { bytes, rows, sha256: createHash('sha256').update(bytes).digest('hex') };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { default: sdv, configure } = await import('../../dist/index.js');
  const captured_utc = new Date().toISOString();
  const { bytes, rows, sha256 } = await capture(sdv, configure);
  const spots = spotsFromShots(rows);
  const fga = spots.reduce((n, s) => n + s[3], 0);
  const provenance = {
    source: ASSET,
    loader: `sdv.nba.loadNbaShots({ seasons: ${SEASON} })`,
    captured_utc,
    sha256,
    bytes: bytes.length,
    sdv_js_commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
    rows: rows.length,
    games: new Set(rows.map((r) => r.game_id)).size,
    field_goal_attempts: fga,
    makes: spots.reduce((n, s) => n + s[4], 0),
    derivation: 'tools/snapshots/nba-league-shots.mjs (spotsFromShots)',
    columns: ['x', 'y', 'value', 'attempts', 'makes'],
  };
  const body = `{\n  "provenance": ${JSON.stringify(provenance, null, 2).replace(/\n/g, '\n  ')},\n  "spots": [\n${spots.map((s) => `    ${JSON.stringify(s)}`).join(',\n')}\n  ]\n}\n`;
  writeFileSync(OUT, body);
  console.log(`wrote ${fileURLToPath(OUT)}: ${spots.length} spots, ${fga} attempts from ${provenance.games} games (sha256 ${sha256})`);
}
