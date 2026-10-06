// 09 — PWHL (HockeyTech): play-by-play, time on ice and on-ice Corsi for one game.
//
// Shows: the HockeyTech family's analytics layer. One feed gateway serves 20
// leagues; `sdv.hockeytech.pwhl_*` pins the PWHL. `pwhl_pbp` is the parsed
// gameCenterPlayByPlay (shots carry x_coord / y_coord on the league's canvas),
// `pwhl_player_toi` folds the shift chart into per-player TOI, and
// `pwhl_game_corsi` credits every shot attempt to the skaters on the ice
// (ported from sdv-py's hockeytech `_analytics`). Three feeds, one game id.
//
// Sources: HockeyTech — lscluster.hockeytech.com/feed/index.php
//   feed=statviewfeed&view=gameCenterPlayByPlay, feed=modulekit&view=gameshifts, feed=gc&tab=gamesummary
// Offline fixtures: test/fixtures/hockeytech/analytics/pwhl_{pbp,gameshifts,game_summary}_42.json
// (PWHL game 42, sdv-py analytics oracle captures).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const GAME_ID = 42;

const pbp = await sdv.hockeytech.pwhl_pbp(GAME_ID);
const shots = pbp.filter((p) => p.event === 'shot' || p.event === 'goal');
console.log(`${pbp.length} events, ${shots.length} shots/goals`);
printTable(
  shots.map((p) => ({ period: p.period_of_game, time: p.time_of_period, team_id: p.team_id, shooter: `${p.player_name_first ?? ''} ${p.player_name_last ?? ''}`.trim(), event: p.event, quality: p.shot_quality, x: p.x_coord, y: p.y_coord })),
  ['period', 'time', 'team_id', 'shooter', 'event', 'quality', 'x', 'y'],
  8,
  'Shot attempts (pwhl_pbp)'
);

const toi = await sdv.hockeytech.pwhl_player_toi(GAME_ID);
const corsi = await sdv.hockeytech.pwhl_game_corsi(GAME_ID);
const names = new Map(toi.map((t) => [t.player_id, `${t.first_name} ${t.last_name}`]));

printTable(
  corsi
    .filter((c) => c.toi_seconds >= 600) // skaters with 10+ minutes
    .map((c) => ({
      player: names.get(c.player_id) ?? c.player_id,
      toi: `${Math.floor(c.toi_seconds / 60)}:${String(c.toi_seconds % 60).padStart(2, '0')}`,
      cf: c.corsi_for,
      ca: c.corsi_against,
      cf_pct: round(c.corsi_for_pct, 3),
      ff_pct: round(c.fenwick_for_pct, 3),
      cf_per60: round(c.corsi_for_per60, 1),
    }))
    .sort((a, b) => b.cf_pct - a.cf_pct),
  ['player', 'toi', 'cf', 'ca', 'cf_pct', 'ff_pct', 'cf_per60'],
  10,
  'On-ice Corsi, skaters with 10+ minutes (pwhl_game_corsi + pwhl_player_toi)'
);
