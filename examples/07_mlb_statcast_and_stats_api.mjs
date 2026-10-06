// 07 — MLB: a Baseball Savant leaderboard + the Stats API for one game.
//
// Shows: two MLB sources with different wire formats behind one contract. Savant
// leaderboards are CSV (the `mlb_statcast` runtime asks for csv=true and parses
// it); the Stats API is JSON. `mlbLinescore` gives one row per inning and
// `mlbBoxscore` one row per player with `stats_batting_*` / `stats_pitching_*`.
//
// Sources: Baseball Savant — baseballsavant.mlb.com/leaderboard/catcher-stance?csv=true
//          MLB Stats API — statsapi.mlb.com/api/v1/game/745282/linescore, …/boxscore
// Offline fixtures: test/fixtures/py/mlb_statcast/leaderboard_catcher_stance.csv,
//                   test/fixtures/py/mlb/linescore_745282.json, boxscore_745282.json.gz
// (sdv-py captures; game 745282 = Cardinals at Giants, 2024).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const stance = await sdv.mlb.mlbStatcastLeaderboardCatcherStance({ parsed: true });
printTable(
  stance.map((r) => ({
    name: r.name,
    year: r.year,
    pitches: r.pitches,
    knee_down_pct: round(r.knee_down_pct, 3),
    one_knee_framing_rv: round(r.one_knee_framing_rv, 1),
    other_framing_rv: round(r.other_framing_rv, 1),
    catching_rv: round(r.catching_rv, 1),
  })),
  ['name', 'year', 'pitches', 'knee_down_pct', 'one_knee_framing_rv', 'other_framing_rv', 'catching_rv'],
  7,
  'Statcast catcher-stance leaderboard (CSV → rows)'
);

const GAME_PK = 745282;
const line = await sdv.mlb.mlbLinescore({ game_pk: GAME_PK, parsed: true });
printTable(line, ['ordinal_num', 'away_runs', 'away_hits', 'away_errors', 'home_runs', 'home_hits', 'home_errors'], 9, `Linescore, game ${GAME_PK}`);

const box = await sdv.mlb.mlbBoxscore({ game_pk: GAME_PK, parsed: true });
const batters = box
  .filter((p) => p.batting_order)
  .map((p) => ({
    side: p.team_side,
    order: p.batting_order,
    player: p.person_boxscore_name,
    pos: p.position_abbreviation,
    ab: p.stats_batting_at_bats,
    h: p.stats_batting_hits,
    hr: p.stats_batting_home_runs,
    rbi: p.stats_batting_rbi,
    bb: p.stats_batting_base_on_balls,
    k: p.stats_batting_strike_outs,
  }))
  .sort((a, b) => a.side.localeCompare(b.side) || Number(a.order) - Number(b.order));
printTable(batters, ['side', 'order', 'player', 'pos', 'ab', 'h', 'hr', 'rbi', 'bb', 'k'], 9, 'Starting lineups (boxscore rows with a batting order)');
