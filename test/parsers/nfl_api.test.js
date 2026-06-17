import should from 'should';
import {
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

// Unit tests for the NFL.com "Shield" API (api.nfl.com) parsers. Inline raw
// payloads (no network) -> tidy rows: row count + snake_cased flattened keys.
// Each parser extracts records from a different top-level key.

describe('parsers/nfl_api: parse_nfl_standings', () => {
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

  it('returns [] for a missing / empty weeks block', () => {
    parse_nfl_standings({}).should.eql([]);
    parse_nfl_standings({ weeks: [] }).should.eql([]);
    parse_nfl_standings(null).should.eql([]);
  });
});

describe('parsers/nfl_api: parse_nfl_rosters', () => {
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

  it('returns [] when rosters key is absent', () => {
    parse_nfl_rosters({}).should.eql([]);
    parse_nfl_rosters(null).should.eql([]);
  });
});

describe('parsers/nfl_api: single-object endpoints', () => {
  it('parse_nfl_team wraps a single team object into one row', () => {
    const rows = parse_nfl_team({ id: 'abc', fullName: 'Kansas City Chiefs' });
    rows.length.should.equal(1);
    rows[0].should.have.property('full_name', 'Kansas City Chiefs');
  });

  it('parse_nfl_team passes an already-list payload through', () => {
    parse_nfl_team([{ id: 'a' }, { id: 'b' }]).length.should.equal(2);
  });

  it('parse_nfl_weeks_by_date wraps a single week object into one row', () => {
    const rows = parse_nfl_weeks_by_date({ week: 1, seasonType: 'REG' });
    rows.length.should.equal(1);
    rows[0].should.have.property('season_type', 'REG');
  });
});

describe('parsers/nfl_api: keyed-list endpoints', () => {
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

describe('parsers/nfl_api: parse_nfl_weekly_game_details', () => {
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

  it('returns [] for an empty / unrecognized payload', () => {
    parse_nfl_weekly_game_details([]).should.eql([]);
    parse_nfl_weekly_game_details({}).should.eql([]);
    parse_nfl_weekly_game_details(null).should.eql([]);
  });
});

describe('parsers/nfl_api: registry wiring', () => {
  it('every parse_nfl_* parser is registered + resolvable by name', () => {
    const names = [
      'parse_nfl_standings',
      'parse_nfl_rosters',
      'parse_nfl_teams_history',
      'parse_nfl_team',
      'parse_nfl_weeks',
      'parse_nfl_weeks_by_date',
      'parse_nfl_combine_profiles',
      'parse_nfl_draft_picks',
      'parse_nfl_injuries',
      'parse_nfl_game_summaries',
      'parse_nfl_weekly_game_details',
    ];
    for (const n of names) {
      (typeof PARSERS[n]).should.equal('function', `missing ${n} in registry`);
      (typeof parserFor(n)).should.equal('function', `parserFor(${n}) unresolved`);
    }
  });
});
