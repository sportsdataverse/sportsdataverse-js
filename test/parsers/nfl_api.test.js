import should from 'should';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isIdColumn } from '../../dist/core/int64.js';
import { FLAT_WRAPPERS } from '../../dist/generated/wrappers.js';
import {
  NFL_API_PARSERS,
  parse_nfl_standings,
  parse_nfl_rosters,
  parse_nfl_teams_history,
  parse_nfl_team,
  parse_nfl_weeks,
  parse_nfl_weeks_by_date,
  parse_nfl_combine_profiles,
  parse_nfl_draft_picks,
  parse_nfl_injuries,
  parse_nfl_game_summaries,
  parse_nfl_weekly_game_details,
} from '../../dist/parsers/nfl_api.js';
import { parserFor, PARSERS } from '../../dist/parsers/_registry.js';

// Unit tests for the NFL.com "Shield" API (api.nfl.com) parsers.
//
// Capture-backed: `parse_nfl_team` runs on the five real sdv-py captures in
// test/fixtures/nfl_api/ (provenance in that README) — the four live /
// gamedetails routes `tools/codegen/endpoints/nfl_api.yaml` maps to it plus the
// v1 gamedetails body. On those captures `parse_nfl_weeks_by_date` is the same
// one-object wrap, and parse_nfl_game_summaries / parse_nfl_weekly_game_details
// extract nothing (v1's `data` is an object, not a list) — so neither is
// asserted on real data.
//
// Synthetic (no public capture — api.nfl.com needs a minted token and the
// harness is offline): parse_nfl_standings, parse_nfl_rosters,
// parse_nfl_teams_history, parse_nfl_weeks, parse_nfl_weeks_by_date,
// parse_nfl_combine_profiles, parse_nfl_draft_picks, parse_nfl_injuries,
// parse_nfl_game_summaries, parse_nfl_weekly_game_details.

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, '..', 'fixtures', 'nfl_api', `${name}.json`), 'utf8'));
const CAPTURES = [
  'live_team_statistics',
  'live_player_statistics',
  'game_details_v2',
  'game_details_by_slug',
  'game_details_v1',
];
const DEN_KC = 'a9a890ed-4feb-11f1-abca-2c54536568a9';
const KC_ID = '10402310-a47e-10ea-7442-16b633633637';
const DEN_ID = '10401400-b89b-96e5-55d1-caa7e18de3d8';

describe('parsers/nfl_api: parse_nfl_team on the real captures', () => {
  it('the four live / gamedetails routes are wired to parse_nfl_team in the flat table', () => {
    const byShort = Object.fromEntries(FLAT_WRAPPERS.filter((w) => w.api === 'nfl_api').map((w) => [w.short, w]));
    for (const short of ['live_team_statistics', 'live_player_statistics', 'game_details_v2', 'game_details_by_slug']) {
      byShort[short].parser.should.equal('parse_nfl_team', short);
      parserFor(byShort[short].parser).should.equal(parse_nfl_team, short);
    }
  });

  for (const name of CAPTURES) {
    it(`${name}: one row, every key snake_case, every id column a string`, () => {
      const rows = parse_nfl_team(load(name));
      rows.length.should.equal(1);
      const keys = Object.keys(rows[0]);
      keys.length.should.be.above(5);
      keys.filter((k) => !/^[a-z0-9_]+$/.test(k)).should.eql([]);
      const idCols = keys.filter(isIdColumn);
      idCols.length.should.be.above(2, name);
      for (const c of idCols) if (rows[0][c] != null) (typeof rows[0][c]).should.equal('string', `${name}.${c}`);
    });
  }

  it('live_team_statistics: the per-side box score flattens to away_team_* / home_team_* columns', () => {
    const [r] = parse_nfl_team(load('live_team_statistics'));
    Object.keys(r).length.should.equal(214);
    r.game_id.should.equal(DEN_KC);
    r.offset.should.equal(101);
    r.away_team_team_id.should.equal(DEN_ID);
    r.home_team_team_id.should.equal(KC_ID);
    r.away_team_passing_yards.should.equal(73);
    r.home_team_rushing_yards.should.equal(59);
    r.away_team_total_yards.should.equal(91);
    r.home_team_total_yards.should.equal(68);
  });

  it('live_player_statistics: the player lists stay as stringified JSON cells (one row, not one per player)', () => {
    const [r] = parse_nfl_team(load('live_player_statistics'));
    Object.keys(r).should.eql([
      'game_id',
      'offset',
      'away_team_team_id',
      'away_team_players',
      'home_team_team_id',
      'home_team_players',
    ]);
    r.game_id.should.equal(DEN_KC);
    const away = JSON.parse(r.away_team_players);
    const home = JSON.parse(r.home_team_players);
    away.length.should.equal(3);
    home.length.should.equal(3);
    away[0].gsisPlayerName.should.equal('A.Singleton');
    away[0].gsisPlayerId.should.equal('00-0031898');
    home[0].gsisPlayerName.should.equal('T.Kelce');
    home[0].gsisPlayerJerseyNumber.should.equal('87');
  });

  it('game_details_v2: the in-game v2 detail (summary, standings, drive chart) flattens to one row', () => {
    const [r] = parse_nfl_team(load('game_details_v2'));
    Object.keys(r).length.should.equal(180);
    r.id.should.equal(DEN_KC);
    r.home_team_full_name.should.equal('Kansas City Chiefs');
    r.away_team_full_name.should.equal('Denver Broncos');
    r.season.should.equal(2026);
    r.season_type.should.equal('REG');
    r.week.should.equal(1);
    r.venue_name.should.equal('Arrowhead Stadium');
    r.summary_phase.should.equal('INGAME');
    r.summary_quarter.should.equal('Q2');
    r.summary_clock.should.equal('12:42');
    r.summary_home_team_score_total.should.equal(7);
    r.summary_away_team_score_total.should.equal(7);
    r.summary_home_team_team_id.should.equal(KC_ID);
    r.drive_chart_game_id.should.equal(DEN_KC);
    // `externalIds` is a list -> a stringified cell (its name matches the id
    // rule, and it is a string, but it is JSON, not an id).
    JSON.parse(r.external_ids).should.eql([
      { source: 'elias', id: '2026091400' },
      { source: 'gsis', id: '60193' },
      { source: 'slug', id: 'broncos-at-chiefs-2026-reg-1' },
    ]);
  });

  it('game_details_by_slug: the post-final detail carries the final score and 1-0 / 0-1 standings', () => {
    const [r] = parse_nfl_team(load('game_details_by_slug'));
    Object.keys(r).length.should.equal(178);
    r.id.should.equal(DEN_KC);
    r.summary_phase.should.equal('FINAL');
    r.summary_quarter.should.equal('END_OF_GAME');
    r.summary_home_team_score_total.should.equal(31);
    r.summary_away_team_score_total.should.equal(10);
    r.summary_home_team_score_q3.should.equal(10);
    r.home_team_standings_overall_wins.should.equal(1);
    r.home_team_standings_overall_streak_type.should.equal('W');
    r.away_team_standings_overall_losses.should.equal(1);
    r.away_team_standings_overall_points_against.should.equal(31);
    should(r.replays).be.undefined(); // no includeReplays on this capture
  });

  it('game_details_v1: the GraphQL-shaped body flattens under data_viewer_game_detail_*', () => {
    const [r] = parse_nfl_team(load('game_details_v1'));
    Object.keys(r).length.should.equal(70);
    Object.keys(r).every((k) => k.startsWith('data_viewer_game_detail_')).should.be.true();
    r.data_viewer_game_detail_id.should.equal('a8fc1728-4feb-11f1-abca-2c54536568a9');
    r.data_viewer_game_detail_home_team_abbreviation.should.equal('JAX');
    r.data_viewer_game_detail_visitor_team_abbreviation.should.equal('CLE');
    r.data_viewer_game_detail_visitor_team_nick_name.should.equal('Browns');
    r.data_viewer_game_detail_phase.should.equal('FINAL');
    r.data_viewer_game_detail_home_points_total.should.equal(34);
    r.data_viewer_game_detail_visitor_points_total.should.equal(10);
    r.data_viewer_game_detail_attendance.should.equal(41156);
    r.data_viewer_game_detail_home_team_id.should.equal('10402250-89fe-7b86-ef98-9062cd354256');
    JSON.parse(r.data_viewer_game_detail_plays).length.should.equal(5); // trimmed to 5
    JSON.parse(r.data_viewer_game_detail_scoring_summaries)[0].playDescription.should.startWith('P.Washington 30 yd. pass');
  });

  it('no other parser extracts rows from these single-object bodies', () => {
    for (const name of CAPTURES) {
      const raw = load(name);
      for (const [p, fn] of Object.entries(NFL_API_PARSERS)) {
        if (p === 'parse_nfl_team' || p === 'parse_nfl_weeks_by_date') continue;
        fn(raw).should.eql([], `${p} on ${name}`);
      }
    }
  });
});

describe('parsers/nfl_api: parse_nfl_standings (synthetic — no public capture)', () => {
  it('unrolls weeks[].standings[] into one row per team standing', () => {
    const raw = {
      weeks: [
        {
          week: 18,
          standings: [
            { team: { abbreviation: 'KC' }, overallWins: 15, overallLosses: 2 },
            { team: { abbreviation: 'BUF' }, overallWins: 13, overallLosses: 4 },
          ],
        },
        {
          week: 17,
          standings: [{ team: { abbreviation: 'PHI' }, overallWins: 14, overallLosses: 3 }],
        },
      ],
    };
    const rows = parse_nfl_standings(raw);
    rows.length.should.equal(3);
    rows[0].should.have.property('team_abbreviation', 'KC'); // nested -> _
    rows[0].should.have.property('overall_wins', 15); // camel -> snake
    rows[2].should.have.property('team_abbreviation', 'PHI');
  });
});

describe('parsers/nfl_api: parse_nfl_rosters (synthetic — no public capture)', () => {
  it('produces one tidy row per team roster with snake_cased keys', () => {
    const raw = {
      rosters: [
        { teamId: '10403800', season: 2024, rosterType: 'active' },
        { teamId: '10401200', season: 2024, rosterType: 'active' },
      ],
    };
    const rows = parse_nfl_rosters(raw);
    rows.length.should.equal(2);
    rows[0].should.have.property('team_id', '10403800'); // teamId -> team_id
    rows[0].should.have.property('roster_type', 'active');
  });
});

describe('parsers/nfl_api: single-object endpoints (synthetic — no public capture)', () => {
  it('parse_nfl_team passes an already-list payload through', () => {
    parse_nfl_team([{ id: 'a' }, { id: 'b' }]).length.should.equal(2);
  });

  it('parse_nfl_weeks_by_date wraps a single week object into one row', () => {
    const rows = parse_nfl_weeks_by_date({ week: 1, seasonType: 'REG' });
    rows.length.should.equal(1);
    rows[0].should.have.property('season_type', 'REG');
  });
});

describe('parsers/nfl_api: keyed-list endpoints (synthetic — no public capture)', () => {
  it('parse_nfl_teams_history reads teams[]', () => {
    parse_nfl_teams_history({ teams: [{ id: 1 }, { id: 2 }] }).length.should.equal(2);
  });
  it('parse_nfl_weeks reads weeks[]', () => {
    parse_nfl_weeks({ weeks: [{ week: 1 }, { week: 2 }, { week: 3 }] }).length.should.equal(3);
  });
  it('parse_nfl_combine_profiles reads combineProfiles[]', () => {
    const rows = parse_nfl_combine_profiles({ combineProfiles: [{ playerId: 'p1' }] });
    rows.length.should.equal(1);
    rows[0].should.have.property('player_id', 'p1');
  });
  it('parse_nfl_draft_picks reads picks[]', () => {
    parse_nfl_draft_picks({ picks: [{ round: 1 }, { round: 1 }] }).length.should.equal(2);
  });
  it('parse_nfl_injuries reads injuries[]', () => {
    parse_nfl_injuries({ injuries: [{ status: 'OUT' }] }).length.should.equal(1);
  });
  it('parse_nfl_game_summaries reads data[]', () => {
    parse_nfl_game_summaries({ data: [{ gameId: 'g1' }, { gameId: 'g2' }] }).length.should.equal(2);
  });
});

describe('parsers/nfl_api: parse_nfl_weekly_game_details (synthetic — no public capture)', () => {
  it('flattens a bare top-level list of games', () => {
    const rows = parse_nfl_weekly_game_details([
      { id: 'g1', homeTeam: { abbreviation: 'KC' } },
      { id: 'g2', homeTeam: { abbreviation: 'SF' } },
    ]);
    rows.length.should.equal(2);
    rows[0].should.have.property('home_team_abbreviation', 'KC');
  });

  it('falls back to a games / data dict wrapper', () => {
    parse_nfl_weekly_game_details({ games: [{ id: 'g1' }] }).length.should.equal(1);
    parse_nfl_weekly_game_details({ data: [{ id: 'g1' }, { id: 'g2' }] }).length.should.equal(2);
  });
});

describe('parsers/nfl_api: empty / malformed payloads (synthetic edge cases)', () => {
  it('every parser returns [] for null; the keyed-list parsers also for {} / an empty list', () => {
    const wraps = new Set(['parse_nfl_team', 'parse_nfl_weeks_by_date']);
    for (const [name, fn] of Object.entries(NFL_API_PARSERS)) {
      fn(null).should.eql([], name);
      // the two single-object parsers wrap {} into one empty row (documented
      // wrap-the-object contract), every other parser gives []
      fn({}).should.eql(wraps.has(name) ? [{}] : [], name);
    }
    parse_nfl_standings({ weeks: [] }).should.eql([]);
    parse_nfl_weekly_game_details([]).should.eql([]);
  });
});

describe('parsers/nfl_api: registry wiring', () => {
  it('every parse_nfl_* parser is registered + resolvable by name', () => {
    const names = Object.keys(NFL_API_PARSERS);
    names.length.should.equal(11);
    for (const n of names) {
      (typeof PARSERS[n]).should.equal('function', `missing ${n} in registry`);
      parserFor(n).should.equal(NFL_API_PARSERS[n], `parserFor(${n}) unresolved`);
    }
  });
});
