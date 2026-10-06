// Offline transport for the example scripts.
//
// Every example runs against the committed captures under test/fixtures/ by
// default, so `node examples/01_nba_scoreboard_to_table.mjs` needs no network
// and prints the same tables every time (the docs injector relies on that).
// Set SDV_LIVE=1 to skip this file's `configure()` and hit the real hosts.
//
// The transport is a route table keyed on the request URL (+ query for the
// one-gateway HockeyTech feed). An unmatched URL throws, naming the URL, so a
// script that drifts onto an uncaptured endpoint fails loudly instead of
// silently returning `{}`. Captures are real responses; provenance lives in
// each fixture directory's README.md.

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { configure } from 'sportsdataverse';

export const LIVE = process.env.SDV_LIVE === '1';

const FIXTURES = new URL('../test/fixtures/', import.meta.url);

/** [predicate(url, query) → boolean, fixture path relative to test/fixtures/] */
const ROUTES = [
  // --- ESPN site v2 / v2 ----------------------------------------------------
  [(u) => u.endsWith('/basketball/nba/scoreboard'), 'espn/scoreboard_nba.json'],
  [(u) => u.endsWith('/basketball/nba/summary'), 'espn/summary_nba.json'],
  [(u) => u.endsWith('/basketball/nba/teams'), 'espn/teams_site_nba.json'],
  [(u) => u.endsWith('/basketball/nba/teams/13/roster'), 'espn/team_roster_nba.json'],
  [(u) => u.endsWith('/basketball/wnba/standings'), 'espn/standings_wnba_2025.json'],
  [(u) => u.endsWith('/football/nfl/scoreboard'), 'espn/scoreboard_nfl_2024_w1.json'],
  [(u) => u.endsWith('/football/nfl/standings'), 'espn/standings_nfl_2024.json'],
  [(u) => u.endsWith('/mens-college-basketball/summary'), 'espn/basketball_pbp/mbb_summary_401600379.json.gz'],
  [(u) => u.endsWith('/soccer/esp.1/standings'), 'espn/standings_laliga_2024.json'],
  // --- ESPN CDN (cdn.espn.com/core) ------------------------------------------
  [(u) => u.endsWith('/core/college-football/rankings'), 'espn/cdn/rankings_cfb.json.gz'],
  [(u) => u.endsWith('/core/college-football/playbyplay'), 'espn/cdn/playbyplay_cfb.json.gz'],
  [(u) => u.endsWith('/core/eng.1/scoreboard'), 'espn/cdn/scoreboard_epl.json.gz'],
  // --- BartTorvik -------------------------------------------------------------
  [(u) => u.endsWith('/2024_team_results.csv'), 'torvik/torvik_ratings.csv'],
  // --- MLB Stats API + Baseball Savant ----------------------------------------
  [(u) => u.endsWith('/game/745282/linescore'), 'py/mlb/linescore_745282.json'],
  [(u) => u.endsWith('/game/745282/boxscore'), 'py/mlb/boxscore_745282.json.gz'],
  [(u) => u.endsWith('/leaderboard/catcher-stance'), 'py/mlb_statcast/leaderboard_catcher_stance.csv'],
  [(u) => u.endsWith('baseballsavant.mlb.com/schedule'), 'py/mlb_statcast/schedule.json'],
  // --- NHL api-web + EDGE -----------------------------------------------------
  [(u) => u.endsWith('/v1/standings/now'), 'py/nhl_api_web/standings_now.json.gz'],
  [(u) => u.endsWith('/v1/gamecenter/2023030417/play-by-play'), 'py/nhl_api_web/pbp_2024_scf_g7.json.gz'],
  [(u) => u.endsWith('/v1/edge/skater-landing/now'), 'py/nhl_edge/skater_landing.json'],
  // --- HockeyTech (one gateway; route on the query) ---------------------------
  [(u, q) => u.includes('hockeytech.com') && q.feed === 'statviewfeed', 'hockeytech/analytics/pwhl_pbp_42.json'],
  [(u, q) => u.includes('hockeytech.com') && q.view === 'gameshifts', 'hockeytech/analytics/pwhl_gameshifts_42.json'],
  [(u, q) => u.includes('hockeytech.com') && q.feed === 'gc', 'hockeytech/analytics/pwhl_game_summary_42.json'],
  // --- The Odds API (historical snapshot) -------------------------------------
  [(u) => u.endsWith('/v4/historical/sports/americanfootball_nfl/odds'), 'odds/nfl_lines_20200911T001500Z_0.json'],
  // --- Release assets (parquet bytes) -----------------------------------------
  [(u) => u.endsWith('/cfb_ratings/cfb_ratings_2024.parquet'), 'releases/cfb_ratings_2024.parquet'],
  [(u) => u.endsWith('/cfb_team_portal/cfb_team_portal_2024.parquet'), 'releases/cfb_team_portal_2024.parquet'],
  [(u) => u.endsWith('/nhl_groups/nhl_groups.parquet'), 'releases/nhl_groups.parquet'],
];

function load(rel) {
  let bytes = readFileSync(new URL(rel, FIXTURES));
  if (rel.endsWith('.gz')) bytes = gunzipSync(bytes);
  return bytes;
}

/** Mimic the default transport's decoding for each responseType. */
function decode(bytes, responseType) {
  if (responseType === 'arraybuffer') return bytes;
  const text = bytes.toString('utf8');
  if (responseType === 'text') return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function offlineTransport(req) {
  const q = req.query ?? {};
  const hit = ROUTES.find(([match]) => match(req.url, q));
  if (!hit) {
    throw new Error(
      `examples/_offline.mjs: no fixture routed for ${req.url} ${JSON.stringify(q)} — ` +
        'add a captured fixture + a ROUTES entry, or run with SDV_LIVE=1'
    );
  }
  return { status: 200, headers: {}, data: decode(load(hit[1]), req.responseType), url: req.url };
}

/** Install the fixture transport unless SDV_LIVE=1. Call once at the top of a script. */
export function setup() {
  if (LIVE) {
    console.log('# SDV_LIVE=1 — hitting the real hosts');
    return;
  }
  configure({ retries: 0, transport: offlineTransport });
}
