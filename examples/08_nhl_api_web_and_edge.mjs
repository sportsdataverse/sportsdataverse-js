// 08 — NHL: api-web standings + a game's play-by-play, and an EDGE leaderboard.
//
// Shows: the three NHL families on sdv.nhl — `nhl*` (api-web.nhle.com/v1, the
// modern game feed), `nhlEdge*` (api-web.nhle.com/v1/edge, player tracking) and
// their py-parity parsers. `nhlWebPbp` returns one row per event; EDGE "landing"
// payloads are one wide row of leaders, so we reshape it into a long table.
//
// Sources: NHL api-web — api-web.nhle.com/v1/standings/now, /v1/gamecenter/2023030417/play-by-play
//          NHL EDGE — api-web.nhle.com/v1/edge/skater-landing/now
// Offline fixtures: test/fixtures/py/nhl_api_web/standings_now.json.gz, pbp_2024_scf_g7.json.gz
//                   (2024 Stanley Cup Final game 7), test/fixtures/py/nhl_edge/skater_landing.json.

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const standings = await sdv.nhl.nhlStandings({ parsed: true });
printTable(
  standings
    .sort((a, b) => b.points - a.points)
    .map((s) => ({ team: s.team_abbrev_default, div: s.division_abbrev, gp: s.games_played, w: s.wins, l: s.losses, otl: s.ot_losses, pts: s.points, gd: s.goal_differential, l10: `${s.l10_wins}-${s.l10_losses}-${s.l10_ot_losses}` })),
  ['team', 'div', 'gp', 'w', 'l', 'otl', 'pts', 'gd', 'l10'],
  8,
  'League standings by points'
);

const GAME_ID = 2023030417;
const pbp = await sdv.nhl.nhlWebPbp({ game_id: GAME_ID, parsed: true });
const counts = new Map();
for (const p of pbp) counts.set(p.type_desc_key, (counts.get(p.type_desc_key) ?? 0) + 1);
printTable(
  [...counts].map(([type, n]) => ({ event_type: type, n })).sort((a, b) => b.n - a.n),
  ['event_type', 'n'],
  8,
  `Event mix, game ${GAME_ID} (${pbp.length} events)`
);
printTable(
  pbp.filter((p) => p.type_desc_key === 'goal').map((p) => ({ period: p.period_descriptor_number, time: p.time_in_period, situation: p.situation_code, scorer_id: p.details_scoring_player_id, score: `${p.details_away_score}-${p.details_home_score}`, x: p.details_x_coord, y: p.details_y_coord })),
  ['period', 'time', 'situation', 'scorer_id', 'score', 'x', 'y'],
  8,
  'Goals'
);

// EDGE landing: one wide row → long (leader category, player, value).
const [edge] = await sdv.nhl.nhlEdgeSkaterLanding({ parsed: true });
// Each category is `leaders_<cat>_player_*` + one value key whose name is the
// metric (`..._shot_speed_imperial`, `..._distance_imperial`, …).
const leaders = [];
for (const k of Object.keys(edge)) {
  const m = k.match(/^leaders_(\w+)_player_id$/);
  if (!m) continue;
  const cat = m[1];
  const prefix = `leaders_${cat}_`;
  const valueKey = Object.keys(edge).find((x) => x.startsWith(prefix) && !x.startsWith(`${prefix}player_`) && !x.startsWith(`${prefix}overlay_`));
  leaders.push({
    category: cat,
    player: `${edge[`${prefix}player_first_name_default`]} ${edge[`${prefix}player_last_name_default`]}`,
    team: edge[`${prefix}player_team_abbrev`],
    metric: valueKey?.slice(prefix.length),
    value: round(edge[valueKey], 2),
  });
}
printTable(leaders, ['category', 'player', 'team', 'metric', 'value'], 8, 'EDGE skater leaders (reshaped from the wide landing row)');
