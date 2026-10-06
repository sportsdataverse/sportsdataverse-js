// 06 — Men's college basketball: BartTorvik ratings + an ESPN box score.
//
// Shows: a non-ESPN provider on the same `{ parsed: true }` contract. BartTorvik
// serves CSV (with a header for team results) behind a browser-UA check — the
// `torvik` runtime handles both, so the wrapper returns rows like any other. Then
// the ESPN `summary` dispatcher's `boxscore_player` / `boxscore_team` sub-frames
// for one game (team stats are long-form: one row per team × stat).
//
// Sources: BartTorvik — barttorvik.com/2024_team_results.csv
//          ESPN Site API v2 — site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=401600379
// Offline fixtures: test/fixtures/torvik/torvik_ratings.csv (2026-06-18, 3 rows),
//                   test/fixtures/espn/basketball_pbp/mbb_summary_401600379.json.gz (Maryland at Illinois, 2024-02-10).

import sdv from 'sportsdataverse';
import { setup } from './_offline.mjs';
import { printTable, round } from './_util.mjs';

setup();

const ratings = await sdv.torvik.torvikRatings({ year: 2024, parsed: true });
printTable(
  ratings.map((r) => ({
    rank: Number(r.rank),
    team: r.team,
    conf: r.conf,
    record: r.record,
    adj_oe: round(Number(r.adjoe), 1),
    adj_de: round(Number(r.adjde), 1),
    barthag: round(Number(r.barthag), 3),
    adj_t: round(Number(r.adjt), 1),
  })),
  ['rank', 'team', 'conf', 'record', 'adj_oe', 'adj_de', 'barthag', 'adj_t'],
  5,
  'T-Rank 2023-24 (torvik_ratings)'
);

const EVENT_ID = 401600379;
const players = await sdv.mbb.espnMbbSummary({ event_id: EVENT_ID, parsed: true, section: 'boxscore_player' });
const teams = await sdv.mbb.espnMbbSummary({ event_id: EVENT_ID, parsed: true, section: 'boxscore_team' });
console.log(`${players.length} player rows, ${teams.length} team-stat rows`);

printTable(
  players
    .filter((p) => !p.did_not_play)
    .map((p) => ({ team: p.team_abbreviation, player: p.athlete_short_name, pos: p.athlete_position, min: Number(p.minutes), pts: Number(p.points), fg: p.field_goals_made_field_goals_attempted, reb: Number(p.rebounds), ast: Number(p.assists) }))
    .sort((a, b) => b.pts - a.pts),
  ['team', 'player', 'pos', 'min', 'pts', 'fg', 'reb', 'ast'],
  8,
  'Top scorers (boxscore_player)'
);

// Pivot the long team frame to one row per stat with a column per team.
const abbrs = [...new Set(teams.map((t) => t.team_abbreviation))];
const byStat = new Map();
for (const t of teams) {
  if (!byStat.has(t.stat_label)) byStat.set(t.stat_label, { stat: t.stat_label });
  byStat.get(t.stat_label)[t.team_abbreviation] = t.stat_display_value;
}
printTable([...byStat.values()], ['stat', ...abbrs], 8, 'Team totals (boxscore_team, pivoted)');
