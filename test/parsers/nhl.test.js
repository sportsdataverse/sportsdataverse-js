import should from 'should';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  parse_nhl_web_pbp,
  parse_nhl_web_boxscore,
  parse_nhl_web_schedule,
  parse_nhl_web_roster,
  parse_nhl_web_leaders,
  parse_nhl_web_right_rail,
  parse_nhl_web_club_stats,
  parse_nhl_web_player_spotlight,
} from '../../dist/parsers/nhl_api_web.js';
import {
  parse_edge_top10,
  parse_edge_detail,
  parse_edge_shot_location,
  parse_edge_zone_time,
  parse_edge_hardest_shots,
  parse_edge_payload,
} from '../../dist/parsers/nhl_edge.js';
import { parse_nhl_stats_rest } from '../../dist/parsers/nhl_stats_rest.js';
import { parse_nhl_records } from '../../dist/parsers/nhl_records.js';
import { isIdColumn } from '../../dist/core/int64.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the four NHL native-API parser families, run on sdv-py's REAL
// committed captures vendored under test/fixtures/py/{nhl_api_web,nhl_edge,
// nhl_stats_rest,nhl_records}/ (provenance: test/fixtures/py/README.md;
// capture -> endpoint short in test/fixtures/py/manifest.yaml; short -> parser
// in tools/codegen/endpoints/nhl_*.yaml). Every assertion is a concrete fact
// about the capture: an exact row count, a named player / team / game id / score.
// The expected values were cross-read from sdv-py's own output on the same bytes
// (test/fixtures/py/oracle/<family>.json.gz), which test/parsers/parity.test.js
// compares cell by cell; here the JS parser output is asserted directly.
//
// The two Python dispatchers (right_rail, club_stats) are ported to their
// PRIMARY sub-frame (season_series, skaters) and are tested on the real
// captures as such. parse_edge_top10 is the one parser with no vendored
// capture (no `*-top-10` endpoint was captured): its known-key path stays
// synthetic; its list-of-dicts fallback is exercised on a real detail payload.
// Synthetic payloads are otherwise used only for the malformed / empty edge
// cases at the bottom.

const here = dirname(fileURLToPath(import.meta.url));
const FIX = join(here, '..', 'fixtures', 'py');
const text = (p) => (p.endsWith('.gz') ? gunzipSync(readFileSync(p)) : readFileSync(p)).toString('utf8');
const capture = (family, name) => JSON.parse(text(join(FIX, family, name)));

const SNAKE = /^[a-z0-9_]+$/;
/** Every key snake_case; every id column (`id`, `*_id`, `*_ids`, `*_pk`) null or a string, never a number. */
function assertTidy(rows) {
  rows.length.should.be.above(0);
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      SNAKE.test(k).should.be.true(`key ${k} is not snake_case`);
      if (isIdColumn(k) && v !== null && v !== undefined) {
        (typeof v).should.equal('string', `id column ${k} holds a ${typeof v}: ${v}`);
      }
    }
  }
}
const countBy = (rows, k) => rows.reduce((a, r) => ((a[r[k]] = (a[r[k]] ?? 0) + 1), a), {});

// ---------------------------------------------------------------------------
// nhl_api_web (modern game-feed) — 2024 Stanley Cup Final Game 7, EDM @ FLA
// ---------------------------------------------------------------------------

describe('parsers/nhl_api_web: parse_nhl_web_pbp (pbp_2024_scf_g7.json.gz)', () => {
  const rows = parse_nhl_web_pbp(capture('nhl_api_web', 'pbp_2024_scf_g7.json.gz'));

  it('produces one row per play (331), deep-flattening periodDescriptor / details', () => {
    rows.length.should.equal(331);
    assertTidy(rows);
    rows[0].should.have.property('event_id', '102');
    rows[0].should.have.property('type_desc_key', 'period-start');
    rows[0].should.have.property('sort_order', 10);
    rows[0].should.have.property('period_descriptor_number', 1);
    rows[0].should.have.property('period_descriptor_period_type', 'REG');
    rows[0].should.have.property('situation_code', '1551');
    rows[330].should.have.property('period_descriptor_number', 3);
    rows[330].should.have.property('time_remaining', '00:00');
  });

  it('carries the three goals of the 2-1 Cup clincher with string player / team ids', () => {
    const types = countBy(rows, 'type_desc_key');
    types.faceoff.should.equal(59);
    types['shot-on-goal'].should.equal(42);
    types.goal.should.equal(3);
    types['game-end'].should.equal(1);
    const goals = rows.filter((r) => r.type_desc_key === 'goal');
    goals.map((g) => g.event_id).should.eql(['302', '186', '866']);
    goals[0].should.have.property('period_descriptor_number', 1);
    goals[0].should.have.property('time_in_period', '04:27');
    goals[0].should.have.property('details_scoring_player_id', '8477409');
    goals[0].should.have.property('details_event_owner_team_id', '13');
    goals[0].should.have.property('details_home_score', 1);
    goals[0].should.have.property('details_away_score', 0);
    goals[2].should.have.property('details_scoring_player_id', '8477933'); // Reinhart, the Cup winner
    goals[2].should.have.property('details_home_score', 2);
    goals[2].should.have.property('details_away_score', 1);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_boxscore (boxscore_2024_scf_g7.json.gz)', () => {
  const rows = parse_nhl_web_boxscore(capture('nhl_api_web', 'boxscore_2024_scf_g7.json.gz'));

  it('walks all six (team x position-group) buckets into 40 long-form rows', () => {
    rows.length.should.equal(40);
    assertTidy(rows);
    countBy(rows, 'home_away').should.eql({ away: 20, home: 20 });
    countBy(rows, 'position_group').should.eql({ forwards: 24, defense: 12, goalies: 4 });
    rows[0].should.have.property('home_away', 'away');
    rows[0].should.have.property('position_group', 'forwards');
    rows[0].should.have.property('player_id', '8478585');
    rows[0].should.have.property('name_default', 'D. Ryan');
    rows[0].should.have.property('hits', 3);
    rows[0].should.have.property('toi', '06:54');
  });

  it('carries McDavid (away F, #97) and Bobrovsky (home G, .958)', () => {
    const mcd = rows.find((r) => r.player_id === '8478402');
    mcd.should.have.property('name_default', 'C. McDavid');
    mcd.should.have.property('home_away', 'away');
    mcd.should.have.property('position_group', 'forwards');
    mcd.should.have.property('sweater_number', 97);
    mcd.should.have.property('goals', 0);
    const bob = rows.find((r) => r.player_id === '8475683');
    bob.should.have.property('name_default', 'S. Bobrovsky');
    bob.should.have.property('home_away', 'home');
    bob.should.have.property('position_group', 'goalies');
    bob.save_pctg.should.be.approximately(0.958333, 1e-6);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_schedule (schedule_2024_06_24.json)', () => {
  const rows = parse_nhl_web_schedule(capture('nhl_api_web', 'schedule_2024_06_24.json'));

  it('unrolls gameWeek[].games[] with the schedule_date prefix (one game that night)', () => {
    rows.length.should.equal(1);
    assertTidy(rows);
    rows[0].should.have.property('schedule_date', '2024-06-24');
    rows[0].should.have.property('id', '2023030417');
    rows[0].should.have.property('season', 20232024);
    rows[0].should.have.property('game_type', 3);
    rows[0].should.have.property('venue_default', 'Amerant Bank Arena');
    rows[0].should.have.property('away_team_id', '22');
    rows[0].should.have.property('away_team_abbrev', 'EDM');
    rows[0].should.have.property('away_team_score', 1);
    rows[0].should.have.property('home_team_abbrev', 'FLA');
    rows[0].should.have.property('home_team_score', 2);
    rows[0].should.have.property('winning_goalie_player_id', '8475683');
    rows[0].should.have.property('winning_goal_scorer_player_id', '8477933');
  });

  it('stringifies the list-valued tvBroadcasts cell', () => {
    (typeof rows[0].tv_broadcasts).should.equal('string');
    JSON.parse(rows[0].tv_broadcasts)[0].should.have.property('market', 'N');
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_roster (roster_edm_2024.json)', () => {
  const rows = parse_nhl_web_roster(capture('nhl_api_web', 'roster_edm_2024.json'));

  it('merges forwards / defensemen / goalies (11 + 9 + 4) with a position_group column', () => {
    rows.length.should.equal(24);
    assertTidy(rows);
    countBy(rows, 'position_group').should.eql({ forwards: 11, defensemen: 9, goalies: 4 });
    rows[0].should.have.property('position_group', 'forwards');
    rows[0].should.have.property('id', '8482673');
    rows[0].should.have.property('last_name_default', 'Bourgault');
    rows[0].should.have.property('birth_city_default', "L'Islet");
    rows[23].should.have.property('position_group', 'goalies');
  });

  it('carries McDavid (#97 C) and Skinner (#74 G)', () => {
    const mcd = rows.find((r) => r.id === '8478402');
    mcd.should.have.property('first_name_default', 'Connor');
    mcd.should.have.property('last_name_default', 'McDavid');
    mcd.should.have.property('position_group', 'forwards');
    mcd.should.have.property('sweater_number', 97);
    mcd.should.have.property('position_code', 'C');
    const sk = rows.find((r) => r.id === '8479973');
    sk.should.have.property('last_name_default', 'Skinner');
    sk.should.have.property('position_group', 'goalies');
    sk.should.have.property('sweater_number', 74);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_leaders (skater_leaders_now.json + goalie_leaders_now.json)', () => {
  it('walks the category-keyed skater lists, tagging each row with its category', () => {
    const rows = parse_nhl_web_leaders(capture('nhl_api_web', 'skater_leaders_now.json'));
    rows.length.should.equal(10);
    assertTidy(rows);
    countBy(rows, 'category').should.eql({ points: 10 });
    rows[0].should.have.property('id', '8478483');
    rows[0].should.have.property('first_name_default', 'Mitch');
    rows[0].should.have.property('last_name_default', 'Marner');
    rows[0].should.have.property('team_abbrev', 'VGK');
    rows[0].should.have.property('value', 19);
    rows[1].should.have.property('last_name_default', 'Eichel');
    rows[1].should.have.property('value', 18);
    rows[9].should.have.property('last_name_default', 'Hutson');
  });

  it('does the same for the goalie wins leaderboard', () => {
    const rows = parse_nhl_web_leaders(capture('nhl_api_web', 'goalie_leaders_now.json'));
    rows.length.should.equal(10);
    assertTidy(rows);
    countBy(rows, 'category').should.eql({ wins: 10 });
    rows[0].should.have.property('id', '8479394');
    rows[0].should.have.property('last_name_default', 'Hart');
    rows[0].should.have.property('value', 10);
    rows[0].should.have.property('position', 'G');
  });
});

describe('parsers/nhl_api_web: dispatchers return their primary sub-frame (real captures)', () => {
  it('parse_nhl_web_right_rail returns the seasonSeries rows (the 7-game Final), not the other sub-frames', () => {
    const raw = capture('nhl_api_web', 'right_rail_2024_scf_g7.json');
    const rows = parse_nhl_web_right_rail(raw);
    rows.length.should.equal(7);
    rows.length.should.equal(raw.seasonSeries.length);
    raw.teamGameStats.length.should.equal(10); // present in the payload, deliberately not returned
    raw.shotsByPeriod.length.should.equal(3);
    assertTidy(rows);
    rows.map((r) => r.id).should.eql(['2023030411', '2023030412', '2023030413', '2023030414', '2023030415', '2023030416', '2023030417']);
    rows.every((r) => r.game_type === 3 && r.game_state === 'OFF').should.be.true();
    rows[0].should.have.property('game_date', '2024-06-08');
    rows[0].should.have.property('away_team_id', '22');
    rows[0].should.have.property('away_team_abbrev', 'EDM');
    rows[0].should.have.property('away_team_score', 0);
    rows[0].should.have.property('home_team_abbrev', 'FLA');
    rows[0].should.have.property('home_team_score', 3);
    rows[3].should.have.property('home_team_abbrev', 'EDM');
    rows[3].should.have.property('home_team_score', 8); // Game 4, 8-1
    rows[6].should.have.property('game_date', '2024-06-24');
    rows[6].should.have.property('away_team_score', 1);
    rows[6].should.have.property('home_team_score', 2);
  });

  it('parse_nhl_web_club_stats returns the skaters rows (27 Oilers), not the 3 goalies', () => {
    const raw = capture('nhl_api_web', 'club_stats_edm_2024.json.gz');
    const rows = parse_nhl_web_club_stats(raw);
    rows.length.should.equal(27);
    rows.length.should.equal(raw.skaters.length);
    raw.goalies.length.should.equal(3);
    assertTidy(rows);
    rows[0].should.have.property('player_id', '8470621');
    rows[0].should.have.property('last_name_default', 'Perry');
    rows[0].should.have.property('goals', 8);
    const mcd = rows.find((r) => r.player_id === '8478402');
    mcd.should.have.property('last_name_default', 'McDavid');
    mcd.should.have.property('goals', 32);
    mcd.should.have.property('assists', 100);
    mcd.should.have.property('points', 132);
    mcd.should.have.property('games_played', 76);
    const drai = rows.find((r) => r.player_id === '8477934');
    drai.should.have.property('last_name_default', 'Draisaitl');
    drai.should.have.property('points', 106);
  });
});

describe('parsers/nhl_api_web: parse_nhl_web_player_spotlight (player_spotlight.json — bare array)', () => {
  const raw = capture('nhl_api_web', 'player_spotlight.json');
  const rows = parse_nhl_web_player_spotlight(raw);

  it('flattens the bare top-level array of 10 featured players', () => {
    rows.length.should.equal(10);
    rows.length.should.equal(raw.length);
    assertTidy(rows);
    rows[0].should.have.property('player_id', '8484144');
    rows[0].should.have.property('name_default', 'Connor Bedard');
    rows[0].should.have.property('team_id', '16');
    rows[0].should.have.property('team_tri_code', 'CHI');
    rows[0].should.have.property('sort_id', '5');
    rows[0].should.have.property('position', 'C');
    rows[0].should.have.property('sweater_number', 98);
    rows[1].should.have.property('player_id', '8481540');
    rows[1].should.have.property('name_default', 'Cole Caufield');
    rows[1].should.have.property('team_tri_code', 'MTL');
  });
});

// ---------------------------------------------------------------------------
// nhl_edge (player/team tracking)
// ---------------------------------------------------------------------------

describe('parsers/nhl_edge: parse_edge_detail (skater_detail.json + goalie_detail.json)', () => {
  it('flattens the McDavid skater detail to a single row, stringifying list cells', () => {
    const rows = parse_edge_detail(capture('nhl_edge', 'skater_detail.json'));
    rows.length.should.equal(1);
    assertTidy(rows);
    Object.keys(rows[0]).length.should.equal(96);
    rows[0].should.have.property('player_id', '8478402');
    rows[0].should.have.property('player_first_name_default', 'Connor');
    rows[0].should.have.property('player_last_name_default', 'McDavid');
    rows[0].should.have.property('player_team_abbrev', 'EDM');
    rows[0].should.have.property('player_position', 'C');
    rows[0].should.have.property('player_goals', 26);
    rows[0].should.have.property('player_assists', 74);
    rows[0].should.have.property('player_points', 100);
    rows[0].should.have.property('player_games_played', 67);
    (typeof rows[0].sog_details).should.equal('string'); // 17-cell grid stringified
    JSON.parse(rows[0].sog_details).length.should.equal(17);
    (typeof rows[0].seasons_with_edge_stats).should.equal('string');
  });

  it('flattens the Logan Thompson goalie detail (31 wins, .910)', () => {
    const rows = parse_edge_detail(capture('nhl_edge', 'goalie_detail.json'));
    rows.length.should.equal(1);
    assertTidy(rows);
    rows[0].should.have.property('player_id', '8480313');
    rows[0].should.have.property('player_first_name_default', 'Logan');
    rows[0].should.have.property('player_last_name_default', 'Thompson');
    rows[0].should.have.property('player_wins', 31);
    rows[0].should.have.property('player_save_pctg', 0.91041);
    rows[0].should.have.property('player_team_common_name_default', 'Capitals');
  });
});

describe('parsers/nhl_edge: parse_edge_top10 (synthetic — no vendored capture)', () => {
  it('finds the first non-empty known list key and flattens it', () => {
    const raw = { leaderboard: [{ playerId: 1, rank: 1 }, { playerId: 2, rank: 2 }] };
    const rows = parse_edge_top10(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('player_id', '1');
  });

  it('falls back to the first list-of-dicts when no known key matches (real skater_shot_speed.json)', () => {
    const raw = capture('nhl_edge', 'skater_shot_speed.json');
    Object.keys(raw).should.eql(['hardestShots', 'shotSpeedDetails']); // no TOP10_LIST_KEYS present
    const rows = parse_edge_top10(raw);
    rows.length.should.equal(10);
    assertTidy(rows);
    rows[0].should.have.property('shot_speed_imperial', 88);
    rows[0].should.have.property('game_date', '2025-04-11');
  });
});

describe('parsers/nhl_edge: parse_edge_shot_location (skater / goalie / team *_shot_loc captures)', () => {
  it('returns the 17 zone cells of shotLocationDetails, not the 4-row shotLocationTotals', () => {
    const raw = capture('nhl_edge', 'skater_shot_loc_detail.json');
    const rows = parse_edge_shot_location(raw);
    rows.length.should.equal(17);
    rows.length.should.equal(raw.shotLocationDetails.length);
    raw.shotLocationTotals.length.should.equal(4);
    assertTidy(rows);
    rows[0].should.have.property('area', 'Behind the Net');
    rows[0].should.have.property('sog', 7);
    rows[0].should.have.property('goals', 0);
    rows[0].should.have.property('sog_percentile', 0.9983);
    rows[2].should.have.property('area', 'Center Point');
    rows[2].should.have.property('sog', 3);
    rows[16].should.have.property('area', 'R Point');
    rows[16].should.have.property('sog', 1);
  });

  it('goalie grid carries shotsAgainst / saves / savePctg per zone', () => {
    const rows = parse_edge_shot_location(capture('nhl_edge', 'goalie_shot_loc.json'));
    rows.length.should.equal(17);
    assertTidy(rows);
    rows[0].should.have.property('area', 'Behind the Net');
    rows[0].should.have.property('shots_against', 8);
    rows[0].should.have.property('saves', 7);
    rows[0].should.have.property('goals_against', 1);
    rows[0].should.have.property('save_pctg', 0.875);
    rows[16].should.have.property('shots_against', 77);
  });

  it('team grid carries league ranks per zone', () => {
    const rows = parse_edge_shot_location(capture('nhl_edge', 'team_shot_loc.json'));
    rows.length.should.equal(17);
    assertTidy(rows);
    rows[0].should.have.property('area', 'Behind the Net');
    rows[0].should.have.property('sog', 20);
    rows[0].should.have.property('sog_rank', 5);
    rows[16].should.have.property('sog', 191);
    rows[16].should.have.property('goals', 6);
  });
});

describe('parsers/nhl_edge: parse_edge_zone_time (skater_zone_time.json + team_zone_time_details.json)', () => {
  it('returns the 4 strength splits of the list-valued zoneTimeDetails, ignoring the zoneStarts dict', () => {
    const raw = capture('nhl_edge', 'skater_zone_time.json');
    const rows = parse_edge_zone_time(raw);
    rows.length.should.equal(4);
    raw.zoneStarts.should.be.an.Object(); // present, not what the parser unrolls
    assertTidy(rows);
    rows.map((r) => r.strength_code).should.eql(['all', 'es', 'pp', 'pk']);
    rows[0].should.have.property('offensive_zone_pctg', 0.49282734);
    rows[0].should.have.property('defensive_zone_pctg', 0.33579046);
    rows[0].should.have.property('offensive_zone_league_avg', 0.4234038);
    rows[3].should.have.property('offensive_zone_pctg', 0.63499221);
  });

  it('team zone time carries league ranks per strength', () => {
    const rows = parse_edge_zone_time(capture('nhl_edge', 'team_zone_time_details.json'));
    rows.length.should.equal(4);
    assertTidy(rows);
    rows.map((r) => r.strength_code).should.eql(['all', 'es', 'pp', 'pk']);
    rows[0].should.have.property('offensive_zone_pctg', 0.4291742);
    rows[0].should.have.property('offensive_zone_rank', 3);
    rows[2].should.have.property('offensive_zone_pctg', 0.6172135);
  });
});

describe('parsers/nhl_edge: sub-frame + generic fallback (real captures)', () => {
  it('parse_edge_hardest_shots returns the 10 hardestShots of skater_shot_speed.json', () => {
    const raw = capture('nhl_edge', 'skater_shot_speed.json');
    const rows = parse_edge_hardest_shots(raw);
    rows.length.should.equal(10);
    rows.length.should.equal(raw.hardestShots.length);
    assertTidy(rows);
    rows[0].should.have.property('shot_speed_imperial', 88);
    rows[0].should.have.property('shot_speed_metric', 141.62);
    rows[0].should.have.property('game_date', '2025-04-11');
    rows[0].should.have.property('time_in_period', '10:27');
    rows[0].should.have.property('period_descriptor_number', 3);
    rows[0].should.have.property('home_team_abbrev', 'EDM');
    rows[0].should.have.property('away_team_abbrev', 'SJS');
    rows[0].should.have.property('player_on_home_team', false);
    rows[9].should.have.property('shot_speed_imperial', 79.28);
    rows[9].should.have.property('game_date', '2025-03-04');
  });

  it('parse_edge_payload picks the largest list-of-dicts: sogDetails (17) over sogSummary (4) on skater_detail.json', () => {
    const raw = capture('nhl_edge', 'skater_detail.json');
    raw.sogSummary.length.should.equal(4);
    const rows = parse_edge_payload(raw);
    rows.length.should.equal(17);
    rows.length.should.equal(raw.sogDetails.length);
    assertTidy(rows);
    rows[0].should.have.property('area', 'Behind the Net');
    rows[0].should.have.property('shots', 7);
    rows[0].should.have.property('shots_percentile', 0.9983);
  });

  it('parse_edge_payload on the landing pages returns the 5 seasonsWithEdgeStats rows', () => {
    const sk = parse_edge_payload(capture('nhl_edge', 'skater_landing.json'));
    sk.length.should.equal(5);
    assertTidy(sk);
    sk.map((r) => r.id).should.eql(['20212022', '20222023', '20232024', '20242025', '20252026']);
    sk[0].should.have.property('game_types', '[2,3]'); // nested list stringified
    const tm = parse_edge_payload(capture('nhl_edge', 'team_landing.json'));
    tm.length.should.equal(5);
    tm[0].should.have.property('id', '20252026');
  });
});

// ---------------------------------------------------------------------------
// nhl_stats_rest + nhl_records (shared {data:[...]} generic)
// ---------------------------------------------------------------------------

describe('parsers/nhl_stats_rest: parse_nhl_stats_rest (stats_rest_* captures)', () => {
  it('stats_rest_team.json: unwraps {data:[...]} into 5 historical teams', () => {
    const rows = parse_nhl_stats_rest(capture('nhl_stats_rest', 'stats_rest_team.json'));
    rows.length.should.equal(5);
    assertTidy(rows);
    rows[0].should.eql({ id: '32', franchise_id: '27', full_name: 'Quebec Nordiques', league_id: '133', raw_tricode: 'QUE', tri_code: 'QUE' });
    rows[1].should.have.property('id', '8');
    rows[1].should.have.property('full_name', 'Montréal Canadiens');
    rows[1].should.have.property('franchise_id', '1');
    rows[4].should.have.property('full_name', 'Oakland Seals');
  });

  it('stats_rest_franchise.json: 40 franchises, Ducks first and Utah Mammoth last', () => {
    const rows = parse_nhl_stats_rest(capture('nhl_stats_rest', 'stats_rest_franchise.json'));
    rows.length.should.equal(40);
    assertTidy(rows);
    rows[0].should.eql({ id: '32', full_name: 'Anaheim Ducks', team_common_name: 'Ducks', team_place_name: 'Anaheim' });
    rows[39].should.have.property('id', '40');
    rows[39].should.have.property('full_name', 'Utah Mammoth');
  });

  it('stats_rest_skater_summary_2024.json: 20 skater report rows with string player / season ids', () => {
    const rows = parse_nhl_stats_rest(capture('nhl_stats_rest', 'stats_rest_skater_summary_2024.json'));
    rows.length.should.equal(20);
    assertTidy(rows);
    rows[0].should.have.property('player_id', '8484287');
    rows[0].should.have.property('skater_full_name', 'Cole McWard');
    rows[0].should.have.property('season_id', '20232024');
    rows[0].should.have.property('team_abbrevs', 'VAN');
    rows[0].should.have.property('position_code', 'D');
    should(rows[0].faceoff_win_pct).be.null();
    rows[1].should.have.property('skater_full_name', 'Anton Blidh');
  });

  it('stats_rest_leaders_skaters.json.gz: deep-flattens player.* / team.* and stringifies team.logos', () => {
    const rows = parse_nhl_stats_rest(capture('nhl_stats_rest', 'stats_rest_leaders_skaters.json.gz'));
    rows.length.should.equal(10);
    assertTidy(rows);
    // all-time single-season goals: four Gretzky seasons, Hull twice, Lemieux, Esposito, Selanne, Mogilny
    countBy(rows, 'player_full_name').should.eql({
      'Wayne Gretzky': 4, 'Brett Hull': 2, 'Mario Lemieux': 1, 'Phil Esposito': 1, 'Teemu Selanne': 1, 'Alexander Mogilny': 1,
    });
    rows[0].should.have.property('player_full_name', 'Wayne Gretzky');
    rows[0].should.have.property('goals', 92);
    rows[0].should.have.property('player_id', '8447400');
    rows[0].should.have.property('player_sweater_number', 99);
    rows[0].should.have.property('team_id', '22');
    rows[0].should.have.property('team_franchise_id', '25');
    rows[0].should.have.property('team_full_name', 'Edmonton Oilers');
    should(rows[0].player_current_team_id).be.null();
    (typeof rows[0].team_logos).should.equal('string');
    rows[2].should.have.property('player_full_name', 'Brett Hull');
    rows[2].should.have.property('team_id', '19');
    rows[9].should.have.property('goals', 71);
  });
});

describe('parsers/nhl_records: parse_nhl_records (records_* captures)', () => {
  it('records_franchise.json: 40 franchises, Canadiens first (franchise 1, team 8)', () => {
    const rows = parse_nhl_records(capture('nhl_records', 'records_franchise.json'));
    rows.length.should.equal(40);
    assertTidy(rows);
    rows[0].should.have.property('id', '1');
    rows[0].should.have.property('full_name', 'Montréal Canadiens');
    rows[0].should.have.property('first_season_id', '19171918');
    rows[0].should.have.property('most_recent_team_id', '8');
    rows[0].should.have.property('team_abbrev', 'MTL');
    should(rows[0].last_season_id).be.null(); // still active
    rows[1].should.have.property('full_name', 'Montreal Wanderers');
    rows[1].should.have.property('last_season_id', '19171918');
    rows[1].should.have.property('most_recent_team_id', '41');
    rows[39].should.have.property('id', '40');
    rows[39].should.have.property('full_name', 'Utah Mammoth');
  });

  it('records_coach_single.json: one coach row (Al MacNeil, id 1)', () => {
    const rows = parse_nhl_records(capture('nhl_records', 'records_coach_single.json'));
    rows.length.should.equal(1);
    assertTidy(rows);
    rows[0].should.have.property('id', '1');
    rows[0].should.have.property('full_name', 'Al MacNeil');
    rows[0].should.have.property('birth_city', 'Sydney');
    rows[0].should.have.property('birth_country3code', 'CAN');
    rows[0].should.have.property('deceased', false);
    should(rows[0].bio).be.null();
  });

  it('records_attendance.json: 80 season rows whose totals add up, except the all-null 2004-05 lockout', () => {
    const rows = parse_nhl_records(capture('nhl_records', 'records_attendance.json'));
    rows.length.should.equal(80);
    assertTidy(rows);
    rows[0].should.eql({ id: '1', playoff_attendance: 1606364, regular_attendance: 21545024, season_id: '20162017', total_attendance: 23151388 });
    rows[79].should.have.property('id', '82');
    rows[79].should.have.property('season_id', '20252026');
    const lockout = rows.filter((r) => r.total_attendance === null);
    lockout.length.should.equal(1);
    lockout[0].should.eql({ id: '13', playoff_attendance: null, regular_attendance: null, season_id: '20042005', total_attendance: null });
    rows
      .filter((r) => r.total_attendance !== null)
      .every((r) => r.playoff_attendance + r.regular_attendance === r.total_attendance)
      .should.be.true();
  });
});

describe('parsers/nhl (synthetic edge cases): empty / malformed payloads return []', () => {
  it('nhl_api_web parsers', () => {
    parse_nhl_web_pbp({}).should.eql([]);
    parse_nhl_web_pbp(null).should.eql([]);
    parse_nhl_web_boxscore({}).should.eql([]);
    parse_nhl_web_boxscore(null).should.eql([]);
    parse_nhl_web_schedule({}).should.eql([]);
    parse_nhl_web_schedule(null).should.eql([]);
    parse_nhl_web_roster(null).should.eql([]);
    parse_nhl_web_leaders(null).should.eql([]);
    parse_nhl_web_right_rail(null).should.eql([]);
    parse_nhl_web_club_stats(null).should.eql([]);
    parse_nhl_web_player_spotlight({}).should.eql([]);
    parse_nhl_web_player_spotlight(null).should.eql([]);
  });

  it('nhl_edge parsers', () => {
    parse_edge_detail({}).should.eql([]);
    parse_edge_detail(null).should.eql([]);
    parse_edge_top10({ total: 0 }).should.eql([]);
    parse_edge_top10(null).should.eql([]);
    parse_edge_shot_location({ foo: 1 }).should.eql([]);
    parse_edge_shot_location(null).should.eql([]);
    parse_edge_zone_time(null).should.eql([]);
    parse_edge_hardest_shots({}).should.eql([]);
    parse_edge_payload(null).should.eql([]);
  });

  it('parse_edge_zone_time flattens a dict-valued zoneTimeDetails to a single row', () => {
    const rows = parse_edge_zone_time({ zoneTimeDetails: { offensiveZonePctg: 0.6 } });
    rows.length.should.equal(1);
    rows[0].should.have.property('offensive_zone_pctg', 0.6);
  });

  it('nhl_stats_rest + nhl_records return [] for meta payloads with no data array', () => {
    parse_nhl_stats_rest({ ok: true }).should.eql([]);
    parse_nhl_stats_rest({ data: [] }).should.eql([]);
    parse_nhl_stats_rest(null).should.eql([]);
    parse_nhl_records({}).should.eql([]);
    parse_nhl_records({ data: [] }).should.eql([]);
    parse_nhl_records(null).should.eql([]);
  });
});

// ---------------------------------------------------------------------------
// registry wiring
// ---------------------------------------------------------------------------

describe('parsers/_registry: NHL parsers are registered + resolvable by name', () => {
  it('resolves each NHL parser by its YAML-referenced name', () => {
    parserFor('parse_nhl_web_pbp').should.equal(parse_nhl_web_pbp);
    parserFor('parse_edge_detail').should.equal(parse_edge_detail);
    parserFor('parse_nhl_stats_rest').should.equal(parse_nhl_stats_rest);
    parserFor('parse_nhl_records').should.equal(parse_nhl_records);
  });

  it('registers every NHL parser name the YAMLs reference', () => {
    for (const name of [
      // nhl_api_web
      'parse_nhl_web_pbp',
      'parse_nhl_web_boxscore',
      'parse_nhl_web_landing',
      'parse_nhl_web_right_rail',
      'parse_nhl_web_schedule',
      'parse_nhl_web_score',
      'parse_nhl_web_club_schedule',
      'parse_nhl_web_standings',
      'parse_nhl_web_standings_season',
      'parse_nhl_web_club_stats',
      'parse_nhl_web_roster',
      'parse_nhl_web_player_landing',
      'parse_nhl_web_player_game_log',
      'parse_nhl_web_leaders',
      'parse_nhl_web_draft_picks',
      'parse_nhl_web_player_spotlight',
      'parse_nhl_web_draft_rankings',
      'parse_nhl_web_playoff_series',
      // nhl_edge
      'parse_edge_top10',
      'parse_edge_detail',
      'parse_edge_shot_location',
      'parse_edge_zone_time',
      // nhl_stats_rest + nhl_records
      'parse_nhl_stats_rest',
      'parse_nhl_records',
    ]) {
      Object.keys(PARSERS).should.containEql(name);
    }
  });
});
