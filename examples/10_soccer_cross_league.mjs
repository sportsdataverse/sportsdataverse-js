// 10 — Soccer: one namespace, many competitions (the `league` parameter).
//
// Shows: ESPN soccer is league-parameterised — `sdv.soccer.*` takes a `league`
// slug (eng.1, esp.1, ger.1, usa.1, …), and the convenience namespaces
// (`sdv.epl`, `sdv.laliga`, `sdv.bundesliga`, `sdv.mls`, …) pin the slug. The
// same function on `sdv.soccer` with `{ league }` and on `sdv.laliga` without
// it are the same request. Also the ESPN CDN scoreboard, which takes a date.
//
// Sources: ESPN Site API v2 — site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2024
//          ESPN CDN — cdn.espn.com/core/eng.1/scoreboard?xhr=1&date=20250201
// Offline fixtures: test/fixtures/espn/standings_laliga_2024.json (captured 2026-10-06),
//                   test/fixtures/espn/cdn/scoreboard_epl.json.gz (sdv-py capture).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable } from './_util.mjs';

setup();

// The two spellings resolve to the same request.
const viaParam = await sdv.soccer.espnSoccerStandings({ league: 'esp.1', season: 2024, parsed: true });
const viaNamespace = await sdv.laliga.espnLaligaStandings({ season: 2024, parsed: true });
console.log(`sdv.soccer + { league: 'esp.1' } → ${viaParam.length} rows; sdv.laliga → ${viaNamespace.length} rows; same table: ${JSON.stringify(viaParam) === JSON.stringify(viaNamespace)}`);

printTable(
  viaParam
    .sort((a, b) => a.rank - b.rank)
    .map((t) => ({ rank: t.rank, team: t.team_display_name, gp: t.games_played, w: t.wins, d: t.ties, l: t.losses, gf: t.points_for, ga: t.points_against, gd: t.point_differential, pts: t.points })),
  ['rank', 'team', 'gp', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'pts'],
  8,
  'LaLiga 2024-25 (espnSoccerStandings, league = esp.1)'
);

const epl = await sdv.epl.espnEplCdnScoreboard({ date: 20250201, parsed: true });
printTable(
  epl.map((g) => ({ game_id: g.game_id, date: g.date.slice(0, 16), match: g.short_name, status: g.status_type_description, home: g.home_abbreviation, hs: g.home_score, away: g.away_abbreviation, as: g.away_score })),
  ['game_id', 'date', 'match', 'status', 'home', 'hs', 'away', 'as'],
  6,
  'Premier League, 2025-02-01 (espnEplCdnScoreboard)'
);

// Which soccer namespaces exist, and the slug each one pins.
import { LEAGUES } from 'sportsdataverse';
printTable(
  LEAGUES.filter((l) => l.sport === 'soccer').map((l) => ({ namespace: `sdv.${l.prefix}`, slug: l.league, league_param: l.league_param ? 'yes' : '' })),
  ['namespace', 'slug', 'league_param'],
  12,
  'Soccer namespaces (LEAGUES)'
);
