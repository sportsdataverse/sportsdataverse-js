// 04 — NFL week-1 schedule + season standings, joined on team_id.
//
// Shows: two ESPN calls on the same namespace and a join on the string
// `team_id` that both parsers emit (ids are ALWAYS decimal strings in v4, so a
// Map keyed by id works across endpoints).
//
// Sources: ESPN Site API v2 —
//   site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2024&week=1&seasontype=2
//   site.api.espn.com/apis/v2/sports/football/nfl/standings?season=2024
// Offline fixtures: test/fixtures/espn/scoreboard_nfl_2024_w1.json, standings_nfl_2024.json
// (both captured 2026-10-06).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const games = await sdv.nfl.espnNflScoreboard({ dates: 2024, week: 1, season_type: 2, parsed: true });
const standings = await sdv.nfl.espnNflStandings({ season: 2024, parsed: true });
console.log(`${games.length} week-1 games; ${standings.length} teams in the standings`);

printTable(
  games,
  ['game_id', 'date', 'short_name', 'home_score', 'away_score', 'venue_full_name'],
  6,
  'Week 1, 2024 (parsed scoreboard)'
);

// Join: final-season record for both teams of each week-1 game.
const byId = new Map(standings.map((s) => [s.team_id, s]));
const joined = games.map((g) => {
  const h = byId.get(g.home_id);
  const a = byId.get(g.away_id);
  return {
    short_name: g.short_name,
    home_final: h ? `${h.wins}-${h.losses}${h.ties ? `-${h.ties}` : ''}` : '',
    away_final: a ? `${a.wins}-${a.losses}${a.ties ? `-${a.ties}` : ''}` : '',
    home_seed: h?.playoff_seed || '',
    away_seed: a?.playoff_seed || '',
  };
});
printTable(joined, ['short_name', 'home_final', 'away_final', 'home_seed', 'away_seed'], 6, 'Week-1 matchups with end-of-season records');

// Division table from the standings frame.
printTable(
  standings
    .filter((s) => s.group_abbreviation === 'AFC')
    .sort((a, b) => b.win_percent - a.win_percent)
    .map((s) => ({ team: s.team_abbreviation, w: s.wins, l: s.losses, pct: round(s.win_percent, 3), pf: s.points_for, pa: s.points_against, diff: s.point_differential })),
  ['team', 'w', 'l', 'pct', 'pf', 'pa', 'diff'],
  8,
  'AFC by win percentage'
);
